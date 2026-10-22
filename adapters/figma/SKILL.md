# Figma 适配器

> `status: ready` ｜ `migrationState: extracted`
> 独立目录与文档由 `prototype-designer` 读取调用，**不单独触发**。
> Figma 是云端文件编辑器：原生文件在 Figma 云端，写操作依赖 MCP 与席位。完整工具与错误速查见 `references/figma-mcp.md`。

## 1. 职责

- 原生格式：Figma 云端文件（`file_key`；可导出 `.fig`，但不作为主要交付物）
- 输入：`DesignRequest`（见 `../../references/design-contract.md`）
- 输出：`DesignResult`，包含 Figma 文件 URL / `file_key`、页面与交互模型、分层验收证据
- HTML：由 `prototype-designer` 公共核心生成；本适配器不生成三栏外壳

不负责：

- PRD 解析、需求澄清
- HTML 三栏外壳、`#prototype-manifest`
- 总入口路由与用户确认
- 代替用户购买/升级 Figma 席位

## 2. 入口

| 内容 | 位置 |
|---|---|
| Figma MCP 工具、席位、`file_key`、`figma-use`、错误速查 | `references/figma-mcp.md` |
| 输入输出契约 | `../../references/design-contract.md` |
| 组件库同步 | `../../references/config-management.md` |
| Context 与 HTML 交接 | `../../references/context-templates.md`、`../../references/prototype-generation.md` |

## 3. 环境与 preflight

Figma 没有本地 CLI 预检脚本；`adapter.json` 的 `preflight` 为 `null`。进入适配器后按以下顺序确认：

1. 当前会话是否挂载 Figma MCP 工具（如 `whoami`、`get_design_context`）。未挂载 → 返回 `blocked`，给出 Remote MCP 接入指引，不猜命令。
2. 调用 `whoami()` 读取席位与当前用户。
3. 判断写权限：
   - Full / Dev：可走 `create_new_file` / `use_figma` 写流程
   - View / Collab：自动只读降级，只做 `get_design_context` / `get_metadata` / `get_screenshot`
4. 首次写前提示：Figma 写能力为 beta，可能产生费用；取得用户确认后才写。
5. 写前加载 `figma-use` 工作流；未加载不得调用 `use_figma`。

Remote MCP 端点：`https://mcp.figma.com/mcp`。鉴权由用户在 Figma 侧完成；企业环境可使用 Personal Access Token。Skill 不代做授权，也不读取或输出 Token。

## 4. 输入输出

输入至少包含：

- `requestId`、`projectRoot`
- `pages[]`：页面名、目标 frame / route、布局与交互
- `assets`：设计规范、Figma 文件 URL / `file_key`、组件库、已有设计
- `output.native`、`output.html`
- `constraints.figmaSeat`（可选，`full` / `dev` / `view` / `collab`；未指定则运行时探测）

输出至少包含：

- `status`：`ok` / `partial` / `blocked` / `failed`
- `files.native`：Figma 文件 URL
- `files.nativeRef`：`{ "provider": "figma", "fileKey": "..." }`
- `files.html`、`files.manifest`
- `pages[]`、`interactions[]`
- `acceptance.structural` / `nativeOpen` / `preview`
- `limitations[]`、`nextActions[]`

不得修改 `DesignRequest`；缺信息返回 `blocked` 与 `nextActions`。

## 5. 执行顺序

1. 读取 `DesignRequest`，确认是否已有 Figma 文件 URL / `file_key`。
2. 探测 MCP 与席位；席位不足时先决定只读抽取还是停止。
3. 没有文件时调用 `create_new_file`；已有文件则解析 URL 中的 `file_key` 并复用。
4. 读取设计系统：`get_variable_defs`、`get_libraries`、`get_library_items`、`search_design_system`；有 Code Connect 时读 `get_code_connect_map`。
5. 读取页面上下文：`get_design_context`（默认 React + Tailwind，也可指定其他目标）与 `get_metadata`；截图用 `get_screenshot`。
6. 写操作：在 `figma-use` 工作流下调用 `use_figma`，优先复用已发布组件与变量，不把 Pen 的 `Insert` 原语 1:1 翻译。
7. 网页 / localhost 导入是补充路径：`generate_figma_design`；不得把它当作唯一创建方式。
8. 结构校验用 `get_metadata` / `get_variable_defs`；视觉校验用 `get_screenshot`。
9. 汇总 `pages` / `interactions`，交公共核心生成 HTML（`html=true` 时）。
10. 返回 `DesignResult`，记录席位、只读降级、未验证项与下一步。

## 6. 工具速查

### 读

| 工具 | 用途 |
|---|---|
| `whoami` | 当前用户与席位 |
| `get_design_context` | 抽取设计上下文与代码，默认 React + Tailwind |
| `get_metadata` | 文件 / 节点元数据 |
| `get_variable_defs` | 颜色、字号等变量令牌 |
| `get_screenshot` | 节点截图，用于视觉自检 |
| `get_code_connect_map` | Code Connect 映射 |
| `search_design_system` / `get_libraries` / `get_library_items` | 设计系统与组件库检索 |

### 写

| 工具 | 用途 |
|---|---|
| `create_new_file` | 新建 Figma 文件，返回 `file_key` |
| `use_figma` | 创建/编辑/删除对象，复用已发布组件与变量 |
| `generate_figma_design` | 网页 / localhost → 可编辑图层（补充路径） |
| `upload_assets` / `download_assets` | 资源上传 / 下载 |
| `generate_diagram` | 生成图表 |
| `add_code_connect_map` | 添加 Code Connect 映射 |

> 工具名与参数以当前会话实际挂载的 Figma MCP 为准；未挂载时返回 `blocked`，不得伪造调用或结果。

## 7. 组件与设计系统

- 优先使用 Figma 已发布组件、实例与变量；不得用硬编码矩形/文字替代。
- 组件登记写入 `components.json`：`source: "figma"`、`format: "figma"`、`figmaFileKey`、`componentKey` / `nodeId`、`libraryName`。
- 设计令牌从 `get_variable_defs` 读取，与 `design.md` / `tokens.json` / `variables.css` 合并；冲突交用户确认。
- Figma 文件中的页面以顶层 frame 为准；`pages[].name` 与 frame 名保持一致，`pages[].route` 来自 PRD 或用户指定。

## 8. 验收层级

| 层级 | 说明 |
|---|---|
| `structural` | `get_metadata` 能读取文件/节点，页面 frame 与命名完整；变量可读取 |
| `native-open` | Figma 文件 URL 能在浏览器中打开（不做自动化断言） |
| `preview` | `get_screenshot` 视觉检查通过 |

结构通过不等于视觉通过；只读席位只能完成读取与截图，不得声称已写入。

## 9. 失败与回退

| 情况 | 处理 |
|---|---|
| Figma MCP 未挂载 | 返回 `blocked`，给出 Remote MCP 接入步骤；不猜工具名 |
| View / Collab 席位 | 自动只读降级；需要写时提示升级 Full/Dev，或经用户确认改选其他适配器 |
| 缺少 `file_key` | 让用户给文件 URL，或取得确认后 `create_new_file` |
| `figma-use` 未加载 | 停止写操作；先加载工作流 |
| `403 seat limit` | 不重试写；降级只读或停止 |
| `rate limit` | 降低调用频率；优先用 `whoami` / `get_metadata` 等轻量工具 |
| 写操作可能计费 | 首次写前提示并取得确认 |
| 需要 HTML 但 Figma 不可写 | 可只读抽取后生成 HTML，或停止；不得静默改用 Pen/Axure |

## 10. 与 HTML 公共核心的交接

- `files.native` = Figma 文件 URL；`files.nativeRef.fileKey` = `file_key`。
- `pages[]` 由顶层 frame / PRD 页面清单归一化；`interactions[]` 来自 PRD、Figma 原型连线或用户在 HTML 阶段补充的 `data-context`。
- 公共核心生成三栏 HTML；Figma 适配器不拼接 HTML 外壳。
- `#prototype-manifest` 的 `mode` 使用 `figma`，`files.design` 指向 Figma URL。

## 11. 边界

- 不把 Figma 云端文件说成本地 `.fig` 文件；不伪造本地路径。
- 不把 Pen 的节点 API 当作 Figma API；两者语义不同。
- 不承担 Figma 授权、席位购买或企业策略配置。
- 不覆盖用户已有 Figma 文件；默认新建或输出副本。
- 不把截图通过说成交互验收；未执行的层级必须写入 `limitations`。
