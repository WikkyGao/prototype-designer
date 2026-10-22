# Figma MCP 适配器参考

> 本文件是 `adapters/figma/SKILL.md` 的详细参考，由 `prototype-designer` 的原生工具选择流程路由进入。
> Figma 是**云端文件编辑器**：设计存在云端 `file_key` 中，写操作依赖 Remote MCP 与席位。
> 工具名与参数以当前会话实际挂载的 Figma MCP 为准；未挂载时返回 `blocked`，不得猜命令。

---

## 1. 接入方式（用户侧）

- **协议**：Remote MCP（HTTP），官方托管 `https://mcp.figma.com/mcp`
- **鉴权**：Figma 账号授权；企业环境可使用 Personal Access Token
- **席位要求**：
  - **Full / Dev**：可读写
  - **View / Collab**：可读；每月调用额度很低（约 6 次），几乎只能抽取设计
- **探测**：优先调用一次 `whoami()`；无法调用时再检查当前会话是否挂载 Figma MCP
- 写能力为 beta，可能产生费用；首次写前必须提示并取得用户确认

> 若未配置，先给接入指引（Remote MCP 端点 + Figma 账号授权），不要直接调用写工具。

---

## 2. 工具清单（读 / 写拆分）

### 读（所有席位可用）

| 工具 | 用途 |
|---|---|
| `get_design_context` | 抽取设计上下文，默认输出 React + Tailwind（也支持 iOS / SwiftUI / Compose 等） |
| `get_metadata` | 文件 / 节点元数据 |
| `get_variable_defs` | 设计变量（颜色/字号令牌）定义 |
| `get_screenshot` | 节点截图（视觉自检） |
| `get_code_connect_map` | Code Connect 映射 |
| `search_design_system` / `get_libraries` / `get_library_items` | 设计系统 / 组件库检索 |
| `whoami` | 当前用户与席位（用于席位探测） |

### 写（Remote MCP 专属，需 Full/Dev 席位，beta）

| 工具 | 用途 |
|---|---|
| `use_figma` | 创建/编辑/删除任意对象，复用已发布组件/变量 |
| `create_new_file` | 新建 Figma 文件，返回 `file_key` |
| `generate_figma_design` | 把网页 / localhost 实时 UI 转成可编辑图层（补充导入路径） |
| `upload_assets` / `download_assets` | 资源上传/下载 |
| `generate_diagram` | 生成图表 |
| `add_code_connect_map` | 添加 Code Connect 映射 |

> `generate_figma_design` 依赖可渲染源，不能作为唯一创建方式。

---

## 3. 席位探测与只读降级（必做）

```text
whoami()
```

| 席位 | 能力 | 适配器行为 |
|---|---|---|
| Full / Dev | 读写 | 走完整 `create_new_file` / `use_figma` 写流程 |
| View / Collab | 每月仅约 6 次调用 | 自动只读降级：只做 `get_design_context` / `get_metadata` / `get_screenshot`，不写 |

- 只读降级必须在 `limitations` 中记录。
- 需要写入但席位不足时：提示升级席位，或经用户确认改选 Pen / Axure / 仅 HTML；**不得静默切换**。
- 写操作为 beta，首次写前提示“可能产生费用”。

---

## 4. `file_key` 管理

Figma 设计存在云端 `file_key` 里，与 pen.dev 本地 `.pen` 不同：

- 用户给了 Figma URL → 解析 `/file/<key>` 或 `/design/<key>`，复用该文件；
- 没给 → 先 `create_new_file` 创建，取回 `file_key` 并**回显给用户**（后续迭代要用）；
- `DesignResult` 中：
  - `files.native` = Figma 文件 URL
  - `files.nativeRef` = `{ "provider": "figma", "fileKey": "<key>" }`
- 不伪造本地 `.fig` 路径；如用户需要本地备份，再单独导出并说明。

---

## 5. `figma-use` 工作流前置（写前必须加载）

Figma 的 `use_figma` 是**设计系统优先**的语义写（复用已发布组件/变量），不是 pen.dev 那种画原语。规则：

- 写前必须加载 `figma-use` 技能 / 工作流（颜色区间、字体加载约束）；
- 不能把 pen.dev 的 `Insert(frame/text/...)` 原语 1:1 翻译为 Figma 调用；
- 优先用已发布组件 + 变量，而非硬编码矩形/文字；
- 加载失败时停止写操作，返回 `blocked`，不得降级为“猜 API”。

---

## 6. 调用范式示例

```text
# 1. 席位探测
whoami()

# 2. 无 file_key 则创建
create_new_file({ title: "工作台" })   # → file_key

# 3. 读设计上下文（默认 React + Tailwind）
get_design_context({ file_key, node_id })

# 4. 读变量与组件库
get_variable_defs({ file_key })
get_libraries({ file_key })
search_design_system({ query: "Button" })

# 5. 写：先加载 figma-use，再调用
use_figma({ file_key, ... })

# 6. 视觉自检
get_screenshot({ file_key, node_id })
```

> 示例只表达顺序，具体参数以当前 MCP schema 为准。

---

## 7. 与统一 HTML 导出的衔接

- Figma 侧用 `get_design_context` 读取结构与样式；`get_metadata` 读取页面 frame 与节点信息。
- `pages[]` 由顶层 frame / PRD 页面清单归一化；`interactions[]` 来自 PRD、Figma 原型连线或用户在 HTML 阶段补充的 `data-context`。
- 公共核心按 `pages` / `interactions` 生成三栏 HTML 与 `#prototype-manifest`；Figma 适配器不拼 HTML 外壳。
- `#prototype-manifest` 中 `mode=figma`，`files.design` 指向 Figma URL。
- `get_design_context` 默认输出 React + Tailwind，可直接作为页面结构参考，但不能替代三栏评审原型的交互层。

---

## 8. 错误速查

| 症状 | 处理 |
|---|---|
| Figma MCP 未挂载 | 返回 `blocked`，给出 Remote MCP 接入步骤；不猜工具名 |
| `403 seat limit` | 当前席位不可写（View/Collab 额度极低）；降级只读或换 Full/Dev |
| `missing file_key` | 未提供文件 URL；先 `create_new_file` 或让用户给链接 |
| `figma-use not loaded` | 写前必须加载 `figma-use` 工作流 |
| `rate limit` | 触发限流；降低调用频率，或改用轻量读工具 |
| 写操作计费提示 | 首次写前告知可能产生费用并取得确认 |
| 只读席位却要求写 | 不重试、不伪造；说明限制并让用户选择升级或改工具 |
