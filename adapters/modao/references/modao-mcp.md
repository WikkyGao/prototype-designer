# 墨刀（MockingBot）MCP 参考

> 本文件是 `adapters/modao` 的完整参考，由适配器 SKILL 路由至此。
> 墨刀 MCP 是墨刀官方的**生成型 AI 服务**（文本 → HTML/React/PRD 产物），不是画布编辑器，**没有节点级编辑/回读**。

---

## 1. 接入方式（用户侧，skill 不代做）

- **协议**：Streamable HTTP
- **端点**：`https://modao.cc/agent-py/ai/mcp`
- **鉴权**：推荐 OAuth（在墨刀个人设置中授权），兜底用 `modao-token` 请求头
- **配置位置**：对应客户端的 MCP 配置文件中登记 `modao` server
- **探测**：调用一次 `get_account_status` 验证；或在 MCP 配置中检索 `modao`

> 若探测显示「未配置」，先给用户**接入指引**（端点 + 获取 token 的位置），不要直接调用。

---

## 2. 工具清单（实测签名）

| 工具 | 入参 | 返回 | 说明 |
|---|---|---|---|
| `get_account_status` | `client` | `userId` / `email` / `planType` / 积分或配额 / `status` | 探测账号与权益，**调用前必做** |
| `generate_html` | `client`, `query` | `task_id` / `task_url` / `preview_url` / `status: running` | 生成单文件 HTML 原型（最常用） |
| `generate_react` | `client`, `query` | 同上结构 | 生成 React 应用源码 |
| `generate_prd` | `client`, `query` | 同上结构 | 生成 PRD Markdown |
| `generate` | `client`, `query` | 同上结构 | 通用生成入口 |
| `get_task_result` | `client`, `task_id` | `status`（running/completed）/ `html` 或 `htmlUrl` / `preview_url` / `task_url` | **异步轮询**结果（墨刀为异步生成） |
| `continue_task` | `client`, `task_id`, `query` | 新一次迭代结果 | **改设计 / 加细节用此**，**禁止**重新 `generate_html` 开新任务 |
| `download_generated_content` | `client`, `task_id` | 产物文件/源码 | 拉取生成的 HTML/React/PRD 源码 |

> 文档中另有别名 `gen_html` / `gen_description`，按当前环境实际暴露的工具名调用（以 MCP `tools/list` 为准）。

---

## 3. 生成型工作流（核心范式）

```
1. get_account_status   → 确认账号可用、权益充足
2. generate_html(query) → 拿到 task_id（status=running，异步）
3. 等待 ~60s
4. get_task_result(task_id) → status=completed 时取 html / preview_url
5. 迭代：continue_task(task_id, query) 细化，直到满意
6. download_generated_content(task_id) → 落本地副本
```

**要点**：

- 墨刀是**异步**的：`generate_*` 只返回 `task_id`，必须用 `get_task_result` 轮询到 `completed`。
- **「改设计」= 用 `continue_task` 带新 query 迭代**；重新 `generate_html` 会开**新任务**（工具明确约束禁止），导致产物分散、上下文丢失。
- 产物是 **HTML 源码 + 预览链接**（写入墨刀个人空间），**无节点树、不能图层精修**。
- 文案需简体中文时，query 里明确写「界面文案全部使用简体中文」。

---

## 4. 结构化设计意图 → 墨刀 query 翻译

墨刀没有 `Insert(frame)` 这类原语，必须把 skill 内部的结构化设计意图翻译成**自然语言 query**。模板：

```
设计一个 <产品类型> 的 <页面名> 原型（HTML 高保真、可浏览器预览），<视觉风格>。

布局结构：
1. <区域1>：<元素清单与关键属性，如尺寸/文案/状态>
2. <区域2>：...
3. <区域3>：...

交互与配色：<主色/圆角/阴影/响应式/轻量 JS 交互要求>
文案：全部使用简体中文。
请输出完整可运行的单文件 HTML（内联 CSS+JS，图表用 SVG/Canvas，无需外部库）。
```

**实测案例**（已生成「智企工作台」原型）：

- 顶部导航（Logo+搜索+通知红点+头像）→ 左侧固定侧边栏（菜单+用户信息）→ 主区（问候+指标卡×4+双图表+待办+动态）
- 蓝紫渐变 `#5B6EF5→#8B5CF6`、卡片圆角 12px+柔和阴影、SVG 折线/环形图、菜单高亮/卡片 hover/待办勾选交互
- 成功产物：本地 HTML 副本 + 墨刀预览链接

---

## 5. 权益 / 配额降级

| 现象 | 处理 |
|---|---|
| `missing modao-token` | 未授权；给接入指引（端点 + token 获取位置） |
| `entitlement/quota exceeded` | 账号权益/配额用尽 |
| `modao service unavailable` | 墨刀线上服务抖动 |

**降级原则**：墨刀不可用 / 权益失败时，回退 pen.dev 本地生成或「仅 HTML」，经用户确认后切换并告知。墨刀生成存在不确定性（不同于 pen.dev 像素级可控），精修场景优先 Pen / Figma。

---

## 6. 与公共核心的衔接

墨刀 `generate_html` 产物是单文件 HTML，交公共核心按 `shellVariant`（A / B / C）做评审外壳二次包装（注入说明面板 / 标注层）。若用户只要原型源码，直接 `download_generated_content` 交付，跳过外壳。

- `#prototype-manifest`：`mode: "modao"`，`files.design` 指向墨刀预览链接，`files.fileKey` 语义为 `task_id`（`files.nativeRef = { "provider": "modao", "taskId": "..." }`）。
- 墨刀产物作为 `pages[]` 来源时，整页视为单页面容器；页面名取 `DesignRequest.pages[0].name`。
