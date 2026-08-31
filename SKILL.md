---
name: pencil-designer
slug: pencil-designer
displayName: pencil-designer

version: 4.0.0
description: pen.dev（原 Pencil）页面设计 Skill。创建/修改 .pen 文件、管理组件库、生成可交互 HTML 原型。CLI Agent 模式快速出图，MCP execute 精细控制，browser 工具把真实网页转成可编辑图层。用户提到 Pencil/pen.dev 设计、生成 .pen 文件、页面/UI 设计、组件库管理、网页转设计或 HTML 原型时应使用此 skill。
author: AI Agent Team
created: 2026-03-31
updated: 2026-08-31
tags:
  - design
  - ui
  - pencil
  - pen-dev
  - cli
  - mcp
  - page-design
  - component-library
  - interactive-prototype
  - browser-import
triggers:
  - 设计页面
  - 创建 UI
  - 生成 .pen 文件
  - Pencil 设计
  - pen.dev 设计
  - 界面设计
  - 页面布局
  - 组件库管理
  - 生成可交互原型
  - 导出 HTML 原型
  - 交互原型
  - 网页转设计
  - 参考某个网站设计
---

# pen.dev Designer - Skill 指令

> **重要**：Pencil 已正式更名为 **pen.dev**。CLI 命令 `pencil` → `pen`，包名 `@pencil.dev/cli` → `@pen.dev/cli`。
> 本 Skill v4.0.0 已对齐 pen.dev CLI 0.3.5 与 Pen.app 1.2.5+ 的全新 MCP 工具集。

---

## 0. 版本对齐（必读）

### 破坏性变更：MCP 工具已全面重构

v3.x 使用的 9 个 MCP 工具**已全部移除**。若沿用旧写法会直接报错。

| v3.x 旧工具（已废弃） | v4.0 新工具 |
|---|---|
| `batch_design` | `execute`（JS snippet） |
| `batch_get` | `execute` 的 `Get()` |
| `get_editor_state` | `get_app_state` |
| `get_screenshot` | `execute` 的 `TakeScreenshot()` |
| `export_nodes` | `execute` 的 `Export()` |
| `get_variables` / `set_variables` | `execute` 的 `GetVariables()` / `SetVariables()` |
| `snapshot_layout` | `execute` 的 `Get` + `ctx.bounds` |
| `get_guidelines` | `get_guidelines`（保留，参数变化） |
| — （新增） | `browser`（真实网页 → 可编辑图层） |
| — （新增） | `read_skill`（CLI 端，拉取官方文档） |
| — （新增） | `get_style`（CLI 端，风格加载） |

### 命名与环境变量对照

| 项目 | 旧 | 新 |
|---|---|---|
| 命令 | `pencil` | `pen` |
| npm 包 | `@pencil.dev/cli` | `@pen.dev/cli` |
| 后端 | `api.pencil.dev` | `api.pen.dev` |
| 认证变量 | `PENCIL_CLI_KEY` | `PEN_CLI_KEY` |
| | `PENCIL_AGENT_API_KEY` | `PEN_AGENT_API_KEY` |
| | `PENCIL_API_BASE` | `PEN_API_BASE` |

---

## 1. 前置条件：环境校验

```bash
which pen || npm install -g @pen.dev/cli   # 安装
node --version                              # 需 >= 18
pen status                                  # 认证状态
npm view @pen.dev/cli version               # 最新版本
pen version                                 # 本地版本
```

**认证**：未登录时三选一

```bash
pen signup --email you@example.com --username johndoe --name "John Doe"  # 注册
pen login --email you@example.com --code 123456                          # 非交互登录
pen login                                                                 # 交互登录
export PEN_CLI_KEY=pencil_cli_...                                        # CI/CD
```

> CLI 的 AI Agent 依赖已认证的 Claude Code。若两者都不可用，明确告知用户并协助配置。

**每次会话首次设计前**比对 `npm view @pen.dev/cli version` 与 `pen version`，不一致则提示升级：

```bash
npm install -g @pen.dev/cli
```

**校验未通过不得继续设计流程。**

---

## 2. 工具速查

### CLI Agent 模式（快速出图，首选）

```bash
# 从零创建
pen --out design.pen --prompt "<用户原话>" --export design.png --export-scale 2

# 迭代修改
pen --in design.pen --out design-v2.pen --prompt "把主色改成绿色" --export v2.png

# 指定模型 / agent
pen --out design.pen --model claude-haiku-4-5 --prompt "..."
pen --out design.pen --agent gemini --prompt "..."

# 附加参考图（可重复）
pen --out design.pen --prompt "参照这个布局" --prompt-file ./ref.png

# 批量
pen --tasks batch.json
```

**Agent 模式黄金规则**：

- **直接透传用户原话，不要自行扩写 prompt**。pen.dev CLI 自带 AI 设计师 agent，自行添加布局/配色/字体细节会干扰其判断，结果更差。
- 时间预期：简单 1-2 分钟、中等 2-3 分钟、复杂 3-5+ 分钟。**超时至少设 600000ms（10 分钟）**。
- 生成后用 Read 工具读取导出的 PNG 展示给用户——**必须展示**，这是用户要的结果。

### MCP Interactive 模式（精细控制）

```bash
pen interactive -o output.pen              # headless
pen interactive -i input.pen -o output.pen # 编辑已有
pen interactive -a desktop -i design.pen   # 连接桌面应用，实时预览
```

Shell 内：`tool_name({ key: value })` 调用工具，`save()` 保存，`exit()` 退出。

#### 四大 MCP 工具

| 工具 | 用途 | 关键参数 |
|---|---|---|
| `get_app_state` | 文档状态 + schema + 画布规范 | `include_schema`、`include_canvas_design`、`include_scripts_and_shaders`（三个都必填） |
| `execute` | 增删查改节点、变量、截图、导出 | `filePath`、`input`（JS snippet）、`editId`+`edits`（失败修补） |
| `get_guidelines` | 设计指南与视觉风格 | `category`（guide/style）、`name`、`params` |
| `browser` | 真实网页 → 画布图层 | `action`、`target`、`url`、`querySelector` |

**首次进入任何 .pen 任务必须先取 schema**：

```
get_app_state({ include_schema: true, include_canvas_design: true, include_scripts_and_shaders: false })
```

CLI headless 下等价入口：`read_skill()` / `read_skill({ path: "execute.md" })` / `read_skill({ path: "pen-schema.md" })`。

> **.pen 文件是加密的**，只能用 pen.dev MCP 工具访问，**禁止用 Read/Grep 直接读 .pen 文件**。

---

## 3. 完整设计流程

```
Step 0 环境校验 → Step 1 PRD.md → Step 2 设计规范
  → Step 3 CLI 出图 → Step 4 MCP 精细控制 → [可选] Step 5 组件库
  → [可选] Step 6 Context 补录 → [可选] Step 7 可交互原型
```

| 步骤 | 默认 | 说明 |
|---|---|---|
| 0. 环境校验 | 强制 | 本文件 §1 |
| 1. PRD.md 检查 | 强制 | 本文件 §4 |
| 2. 设计规范文件 | 强制 | 本文件 §4 |
| 3. CLI Agent 出图 | 强制 | 本文件 §2 |
| 4. MCP 精细控制 | 按需 | [execute-api.md](references/execute-api.md) |
| 5. 组件库管理 | 可选 | [config-management.md](references/config-management.md) |
| 6. Context 补录 | 可选 | [context-templates.md](references/context-templates.md) |
| 7. 可交互原型 | 可选 | [prototype-generation.md](references/prototype-generation.md) |

**策略：CLI 优先，MCP 兜底。** 先用 CLI Agent 模式产出整体，结果不理想或需精确控制时再切 MCP。

---

## 4. 步骤 1-2：PRD 与设计规范

**PRD.md**：在当前及上级目录查找。

- 存在 → 读取并提取项目概述、功能模块、数据字段、业务流程
- 不存在 → **AskUserQuestion**："未找到 PRD.md，是否跳过？[1] 跳过继续 [2] 先提供 PRD.md [3] 按描述直接设计"

**设计规范文件**：检查当前目录是否有 `UI Design.pen`，无则创建，用于沉淀色彩、字体、组件风格。

**组件名前缀规范**见 [component-naming.md](references/component-naming.md)。

---

## 5. 步骤 4：execute 核心规则

详细 API 见 [execute-api.md](references/execute-api.md)，schema 见 [pen-schema.md](references/pen-schema.md)。以下为**必须遵守**的规则：

### 硬性禁令（违反会报错）

- 禁止使用 `alignItems: baseline/stretch`、`margin`、百分比尺寸
- 禁止用 CSS/HTML 思维建模（pen.dev 是自有格式）
- 禁止自行设置节点 `id`（系统自动生成并覆盖）
- 禁止为图片编造 URL，必须用 `Generate()` 获取
- **无 `image` 节点类型**，图片是施加到 frame/rectangle 的 **fill**
- 禁止在 document 根下直接放 text/icon/button/card（根下只放页面 frame、可复用组件、主容器）
- 手工拼 `path`/`polygon` 画插画会很粗糙，一律用 `Generate(nodeId,"svg",prompt)`

### 必须遵守

- **每个节点都要设人类可读的 `name`**（含子节点），返回时会给 name→id 映射
- **失败时用 `edits` + `editId` 修补，绝不重发整个 snippet**
- 每次 `execute` 独立作用域；跨调用持久化变量用**无声明赋值** `myId = Insert(...)`（不要 `const`/`let`）
- 用 JS 消除重复：数组、`for...of`、对象展开、模板字符串、helper 函数
- snippet 内**不要写注释**
- `Insert`/`Copy`/`Replace` 返回 id 字符串；要读新建节点的子节点，先 `Get(id,{depth:1}).children`
- 复用组件用 `ref` + `descendants` 覆写，**不要**复制后再逐个 Update（id 会变，必然失败）
- 屏幕 frame 加 `clip: true`；工作时设 `placeholder: true`，完成后 `Update(id,{placeholder:false})`
- 根布局用 `FindEmptySpace()` 定位，不要拍脑袋写坐标

### 标准骨架

```js
const pos = FindEmptySpace({width:1440,height:1024,padding:80})
pageId = Insert(document,{type:"frame",name:"Landing Page",x:pos.x,y:pos.y,layout:"vertical",width:1440,padding:40,gap:24,clip:true,placeholder:true})

navId = Insert(pageId,{type:"frame",name:"Nav",gap:32,alignItems:"center",width:"fill_container"})
for (const label of ["Home","Pricing","Docs"]) {
  Insert(navId,{type:"text",name:label,content:label,fontFamily:"Inter",fontSize:14,fill:"$text-secondary"})
}

Update(pageId,{placeholder:false})
TakeScreenshot([pageId])
```

### 验证

- **结构/尺寸校验**用 `Get` + `ctx.bounds` / `ctx.problems`，不要用截图
- **视觉保真**（颜色、字形、对齐）用 `TakeScreenshot`
- 截图很贵：只在**一个完整 section 做完**时拍，拍最小有意义的节点
- 每完成一个 section 立即验证，不要等全部做完

```js
Get(pageId, (n,c) => c.problems && Print(n.name,"|",c.parentCtx?.node.name,"|",c.problems))  // 溢出检查
Get(pageId, (n,c) => Print(n.id,"=",n.name,c.depth,c.bounds.width))                          // 结构概览
```

---

## 6. browser：真实网页 → 可编辑设计

桌面端专属（需 Pen.app 运行）。适合"参考某个网站做设计""把这个页面改成我们的品牌"等场景。

```
browser({ action: "load-page", url: "https://example.com" })
browser({ action: "import-to-canvas", target: "query", querySelector: "header.hero" })
browser({ action: "return-element", target: "query", querySelector: ".pricing-card" })  // 取 DOM + 计算样式
browser({ action: "return-screenshot", target: "full-page" })                            // 肉眼看
browser({ action: "screenshot-to-canvas", target: "full-page" })                         // 截图落到画布
```

**要点**：

- 必须先 `load-page`，其余 action 才可用
- 优先 `target: "query"` 或 `"selection"`，避免 `full-page` 撑爆上下文
- `return-element` 对 `body`/`html` 要谨慎，DOM 会极大
- 导入后是**普通画布节点**，之后用 `execute` 编辑，**不要再按 HTML/CSS 思维处理**
- 导入节点的 `context` 字段记录源元素 tag（如 `Card - div`），便于回溯代码位置
- localhost 开发服务器通常热更新，页面已加载时可跳过 `load-page` 直接 `return-screenshot`

完整参数见 [mcp-tools.md](references/mcp-tools.md)。

---

## 7. 步骤 5：组件库管理（可选）

默认不提取。触发场景：创建通用组件库、用户明确要求。

**可复用性判断**（满足 3 条以上标记 `reusable: true`）：多页面通用 / 独立完整功能 / 可参数定制 / 结构完整。

**流程**：

1. 打开控件库（优先级 `控件库.pen` > `lib.pen` > `component.lib`）
2. `Insert` 时设 `reusable: true` 并按规范命名
3. 写入 `components.json`，更新 `lastUpdated`
4. 需要时执行双向同步校验

**查找已有组件**（替代旧 `batch_get`）：

```js
Get(n => n.reusable && Print(n.id, n.name))
```

**删除组件前 AskUserQuestion**："组件 {name} 已被使用 {count} 次，确认删除？[1] 确认 [2] 保留"

详细同步与校验流程见 [config-management.md](references/config-management.md)。

---

## 8. 步骤 6：Context 补录（可选）

默认跳过。触发：需要生成可交互原型 / 交付开发 / 用户要求。

`context` 是节点上的元数据（交互行为、数据绑定、导航目标），开发阶段可直接读取。

**识别规则**：名含 `btn-`/`input-`/`select-`/`switch-`/`nav-`/`tab-`/`icon-btn` 及可点击卡片需补录；纯展示元素不需要。

**写入**（替代旧 `batch_design` 的 `U()`）：

```js
Get(pageId, n => /^btn-|^input-|^select-/.test(n.name) && !n.context && Update(n.id, {context:"..."}))
```

**验证清单**：

```
□ btn-* □ input-* □ select-* □ switch-* □ nav-*/tab-* □ icon-btn □ 可点击卡片
```

**发现 PRD 未记录的交互时 AskUserQuestion**："发现以下新增交互未在 PRD.md 中：… 是否更新？[1] 全部写入 [2] 仅指定项 [3] 跳过"

模板与优先级见 [context-templates.md](references/context-templates.md)。

---

## 9. 步骤 7：可交互原型生成（可选）

**触发**：用户要求"生成可交互原型"/"导出 HTML 原型"。

> 区分两种导出：
> - **`execute` 的 `Export([ids],"html-tailwind","./out.html")`** — 官方静态 HTML 导出，适合交付代码
> - **本步骤的三栏可交互原型** — 带水滴标注、贝塞尔连线、交互模拟的说明型原型，适合评审和需求确认

**前提**：context 补录验证通过。

**流程**：

1. `execute` 的 `Get` 读取全部页面与子节点，收集 context 和 note
2. 解析 context → 建立交互映射表
3. 生成单文件 HTML（内联 CSS+JS），**固定三栏布局**
   - 左（180px，可拖拽 150~250）：多页面导航
   - 中（flex:1）：主预览 + 水滴标注点 + SVG 贝塞尔连线
   - 右（280px，可拖拽 200~500）：功能说明面板
   - 拖拽分割线 + A⁻/A⁺ 字号调整
4. 内置 Toast、Confirm Modal、Loading
5. localStorage 自动保存（标注位置、卡片内容、当前页、字号）

**输出**：`{原文件名}-prototype.html`，与 .pen 同目录，单文件自包含。

完整实现（水滴 SVG 路径、拖拽、连线坐标、localStorage）见 [prototype-generation.md](references/prototype-generation.md)。

---

## 10. 便签控件

便签用于设计稿注释。类型与配色见 [note-styling.md](references/note-styling.md)。

```js
noteId = Insert(pageId,{type:"note",name:"功能说明",content:"这是便签内容",x:100,y:100,width:300})
```

**注意**：`note` 节点不支持 `fill`，需要背景色时用 frame 包裹。

---

## 11. 批量处理

```bash
pen --tasks batch.json
```

```json
{
  "tasks": [
    { "out": "login.pen", "prompt": "Create a login page" },
    { "in": "app.pen", "out": "app-v2.pen", "prompt": "Add a sidebar" },
    { "out": "dash.pen", "model": "claude-haiku-4-5", "prompt": "Create a dashboard" },
    { "out": "ref.pen", "prompt": "Match this reference", "promptFiles": ["./assets/ref.png"] }
  ]
}
```

字段：`out`（必填）、`prompt`（必填）、`in`、`model`、`promptFiles`（相对路径基于 JSON 所在目录）。任务串行执行，各自独立编辑器实例。

---

## 12. 常见错误速查

| 症状 | 原因 / 处理 |
|---|---|
| `pen: command not found` | `npm install -g @pen.dev/cli`，Node >= 18 |
| 安装报 `EEXIST: bin/pencil` | 旧包占位：`npm uninstall -g @pencil.dev/cli` 后重装 |
| `tool not found: batch_design` | 工具已废弃，见 §0 对照表改用 `execute` |
| MCP 连不上 `app: desktop` | Pen.app 未启动；或改用 `pen interactive` headless 模式 |
| 想用 Read 读 .pen 文件 | 禁止，.pen 加密，只能用 MCP 工具 |
| `alignItems: baseline` 报错 | 不支持 baseline/stretch/margin/百分比 |
| 复制后 Update 子节点失败 | 复制会生成新 id，必须在 `Copy` 的 `descendants` 里覆写 |
| execute 失败 | 用返回的 `editId` + `edits` 打补丁重试，勿重发 snippet |
| 图片没显示 | `Generate` 是异步的，检查 `placeholder` 是否清除，不要重复生成 |
| Agent 模式结果差 | prompt 被过度加工了，直接透传用户原话 |
| 认证失败 | `pen status` 检查；`PEN_CLI_KEY` 或 `pen login` |
| 命令超时 | 生成需 1-5+ 分钟，超时设 600000ms（10 分钟） |

---

## 13. 设计最佳实践

1. **优先复用**：先 `Get(n => n.reusable && Print(n.id,n.name))` 查现有组件，再新建
2. **CLI 优先**：整体用 Agent 模式，细节用 `execute`
3. **分 section 推进**：每做完一块立即 `TakeScreenshot` 验证
4. **重复 UI 组件化**：先建 `reusable: true` 组件，再 `ref` 实例化，改一处全量生效
5. **及时保存**：Interactive 模式定期 `save()`
6. **变量驱动**：用 `SetVariables` 定义设计令牌，属性里 `$name` 引用，支持主题轴
7. **结果必展示**：生成完用 Read 读 PNG 给用户看

---

## 参考文件

| 文件 | 内容 |
|---|---|
| [references/execute-api.md](references/execute-api.md) | execute 完整 API、操作详解、失败修补机制 |
| [references/pen-schema.md](references/pen-schema.md) | .pen 文件 schema、节点类型、属性速查 |
| [references/mcp-tools.md](references/mcp-tools.md) | 四大 MCP 工具完整参数（含 browser） |
| [references/prototype-generation.md](references/prototype-generation.md) | 三栏可交互原型 HTML 实现 |
| [references/context-templates.md](references/context-templates.md) | context 模板与补录流程 |
| [references/config-management.md](references/config-management.md) | components.json 双向同步与校验 |
| [references/component-naming.md](references/component-naming.md) | 组件命名规范 |
| [references/note-styling.md](references/note-styling.md) | 便签类型与配色 |

**原型 HTML 模板**：[assets/prototypes/main-prototype.html](assets/prototypes/main-prototype.html)

---

## 版本信息

- **Skill 版本**: 4.0.0
- **对齐**: pen.dev CLI 0.3.5 / Pen.app 1.2.5+ MCP
- **创建日期**: 2026-03-31
- **更新日期**: 2026-08-31

**变更说明**：

- v4.0.0 — **破坏性更新**。Pencil → pen.dev 全面更名（命令 `pen`、包 `@pen.dev/cli`、环境变量 `PEN_*`）；MCP 工具从 9 个重构为 4 个（`execute`/`get_app_state`/`get_guidelines`/`browser`）；`execute` 改为 JS snippet 模式 + `editId`/`edits` 失败修补；新增 `browser` 网页转设计、SVG 生成、HTML 导出（`html-tailwind`/`html-css`）；新增 `read_skill`/`get_style`；补入官方硬性禁令与最佳实践；新增 execute-api.md、pen-schema.md、mcp-tools.md 三份参考
- v3.7.0 — 模块化拆分 + 校验/组件步骤可选化
- v3.6.0 — 原型自动保存 + 拖拽锚点修复
- v3.5.0 — 水滴标注拖拽
- v3.3.0 — Context 补录 + 三栏布局
