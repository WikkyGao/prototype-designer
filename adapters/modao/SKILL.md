# 墨刀（MockingBot）适配器

> `status: ready` ｜ `migrationState: extracted`
> 独立目录与文档由 `prototype-designer` 读取调用，**不单独触发**。
> 墨刀 MCP 是墨刀官方提供的**生成型 AI 服务**（自然语言 → HTML / React / PRD 产物），**不是画布编辑器**：没有节点级编辑与回读，产物为异步生成的单文件 HTML + 云端预览链接。工具清单、异步轮询、query 翻译模板见 [references/modao-mcp.md](references/modao-mcp.md)。

## 1. 职责

- 原生格式：墨刀云端原型（`task_id` / 预览链接）+ 生成的单文件 HTML
- 输入：`DesignRequest`（见 `../../references/design-contract.md`）
- 输出：`DesignResult`，包含墨刀预览链接、生成 HTML 与验收证据
- HTML：生成的页面源码交 `prototype-designer` 公共核心按 `shellVariant` 组装评审外壳；本适配器不生成外壳

不负责：

- PRD 解析、需求澄清
- HTML 评审外壳、`#prototype-manifest`
- 总入口路由与用户确认
- 代用户注册墨刀账号、购买权益或充值配额

## 2. 入口

| 内容 | 位置 |
|---|---|
| MCP 接入、工具清单、异步工作流、query 翻译模板、权益降级 | [references/modao-mcp.md](references/modao-mcp.md) |
| 输入输出契约 | `../../references/design-contract.md` |
| 组件库同步 | `../../references/config-management.md` |
| Context 与 HTML 交接 | `../../references/context-templates.md`、`../../references/prototype-generation.md` |

墨刀为云端生成服务，没有本地 preflight 脚本；`adapter.json` 的 `preflight` 为 `null`。

## 3. 环境与探测

1. 会话是否挂载墨刀 MCP 工具（`get_account_status` / `generate_html` 等）。未挂载 → 返回 `blocked` 并给出接入指引（Streamable HTTP 端点 `https://modao.cc/agent-py/ai/mcp`；鉴权走 OAuth 或 `modao-token` 请求头），不猜工具名。
2. 调用 `get_account_status` 确认账号可用、权益 / 配额充足。权益用尽 → 返回 `blocked` 或经用户确认回退「仅 HTML / pen.dev」，不代充值。

## 4. 输入输出

输入至少包含：

- `requestId`、`projectRoot`
- `pages[]`：页面名、布局与交互意图
- `assets`：设计规范、控件库、组件库
- `output.native`、`output.html`

输出至少包含：

- `status`：`ok` / `partial` / `blocked` / `failed`
- `files.native`：墨刀预览链接（`task_url` / `preview_url`）
- `files.nativeRef`：`{ "provider": "modao", "taskId": "..." }`
- `files.html`、`files.manifest`
- `pages[]`、`interactions[]`
- `acceptance.structural` / `nativeOpen` / `preview`
- `limitations[]`、`nextActions[]`

不得修改 `DesignRequest`；缺信息返回 `blocked` 与 `nextActions`。

## 5. 执行顺序

1. 探测 MCP 与账号权益（见 §3）。
2. 把结构化设计意图翻译为自然语言 `query`（用 [references/modao-mcp.md](references/modao-mcp.md) §4 模板；界面文案需简体中文时必须在 query 中声明）。
3. 调用 `generate_html`（React / PRD 用对应工具）拿到 `task_id`——墨刀为**异步生成**，返回即 `running`。
4. 等待约 60 秒后 `get_task_result` 轮询至 `completed`，取 `html` / `preview_url`。
5. 迭代修改一律用 `continue_task(task_id, query)`，**禁止重开 `generate_html` 新任务**（会导致产物分散、上下文丢失）。
6. `download_generated_content` 落本地副本。
7. 把生成页面交公共核心按 `shellVariant` 组装评审外壳；manifest `mode: "modao"`，`files.design` 指向墨刀预览链接。
8. 返回 `DesignResult`，记录任务链接、生成不确定性与未验证项。

## 6. 验收层级

| 层级 | 说明 |
|---|---|
| `structural` | 任务 `completed`、产物可下载、HTML 结构完整（页面 / 交互可解析） |
| `native-open` | 墨刀 `preview_url` 可在浏览器打开 |
| `preview` | 生成结果与 `query` 意图比对通过（截图或预览检查） |

- 墨刀为**生成型 AI 服务，产物存在不确定性**：同一 query 两次生成可能不同；未达预期的迭代必须走 `continue_task`。
- 结构 / 预览通过不等于交互验收通过；未完成层级写入 `limitations`。
- 无节点树，不存在 `gui-roundtrip` 层级。

## 7. 失败与回退

| 情况 | 处理 |
|---|---|
| MCP 未挂载 / 缺 `modao-token` | 返回 `blocked`，给接入指引（端点 + token 位置）；不猜工具名 |
| 权益 / 配额用尽 | 返回 `blocked` 或经用户确认回退 pen.dev / 仅 HTML |
| `modao service unavailable` | 稍后重试一次；仍失败 → 回退并告知 |
| 需要节点级精修 | 墨刀无画布编辑能力，明确建议改用 Pen / Figma，不静默切换 |
| 生成产物偏离意图 | `continue_task` 迭代，不重开新任务 |

## 8. 边界

- 墨刀 MCP 是官方生成型服务，但**产物为异步生成，存在不确定性**；交付说明必须标注「墨刀生成，可能需要 continue_task 迭代」。
- 产物写入用户墨刀个人空间；不代用户管理其云端文件，删除需用户自行操作。
- 产物是整页 HTML，无节点树；不得声称已完成节点级编辑或图层精修。
- 不把生成 HTML 直接说成交互验收；交互以公共核心外壳组装后的实测为准。
- 不承担墨刀账号注册、授权、权益购买。
