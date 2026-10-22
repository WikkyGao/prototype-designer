# 页面设计 Skill（pen.dev / Axure / Figma）

页面设计 Skill，支持 Codex 和 Claude Code。pen.dev 链路用 CLI Agent 快速出图、MCP `execute` 精细控制；Axure 链路经 zee-rp 的 CLI/MCP 生成可继续在 Axure RP 中编辑的原生 `.rp`；Figma 链路经 Remote MCP 读写云端设计；配置文件管理组件库。

> **重要**：Pencil 已正式更名为 **pen.dev**。命令 `pencil` → `pen`，npm 包 `@pencil.dev/cli` → `@pen.dev/cli`，环境变量 `PENCIL_*` → `PEN_*`。本 Skill v5.1.0 已对齐 pen.dev CLI 0.3.12、Pen.app 1.2.5+、zee-rp 0.2.0 与 Figma Remote MCP，并新增模式 4（Figma）。zee-rp 是独立实验性项目，不是 Axure 官方产品。

## 简介

页面设计助手，帮助 Codex、Claude Code 等 AI Agent 通过 pen.dev 创建 `.pen` 设计文件，通过 zee-rp 创建/修改可继续在 Axure RP 中编辑的原生 `.rp`，或通过 Figma Remote MCP 读取/创建云端设计。所有载体共享同一套前置检查（PRD → 控件库 → 设计规范），通过 components.json 管理组件库，支持双向同步和完整性校验。

自 v5.0.0 起采用**编排层 + 适配器架构**：`prototype-designer` 负责编排、公共检查与 HTML 渲染，Pen / Axure / Figma 的完整细节位于 `adapters/`，OpenDesign 为 `planned` 占位（当前禁用）。`requirement-analysis` 的 T8 只决定「原生设计文件 / 仅 HTML」，具体工具由本 Skill 询问。

## 环境要求

**模式 1（.pen + HTML）**：

- **Node.js**: >= 18
- **pen.dev CLI**: >= 0.3.12，`npm install -g @pen.dev/cli`
- **认证**: 运行 `pen login`（或 `pen codex-login` 供 codex agent）或设置 `PEN_CLI_KEY` 环境变量

**模式 2（仅 HTML）**：

- 无需 Node.js / pen.dev CLI / 登录状态
- 仍需执行 PRD 检查、设计规范检查（`UI Design.html`）与组件库管理（`component-library.html` + `components.json`）

**模式 3（Axure .rp + 可选 HTML）**：

- **Node.js** >= 18、**Python** >= 3.10（系统 `python3` 可能是 3.9，用 `python3.12 -m venv .venv`）
- **zee-rp**：`git clone https://github.com/LilZeeCN/zee-rp.git`，设置 `ZEE_RP_HOME`
- 在 zee-rp 目录执行 `python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && npm ci`
- **Axure RP 9 / 11** 与本机保存的对应版本单页空白工程：
  - `AXURE_BLANK_TEMPLATE_RP9`：RP/1 → RP9 原生生成
  - `AXURE_BLANK_TEMPLATE_RP11`：原生 RP11 新建/编辑
  - 也可放在 `$ZEE_RP_HOME/templates/axure-rp9-blank.rp` / `axure-rp11-blank.rp`，preflight 会自动识别
- 运行 `node adapters/axure/scripts/axure-preflight.mjs` 自检
- **Axure 11 验收**：RP/1 产物是 RP9 原生工程；复制一份用 Axure 11 打开并升级，`Publish → Preview` 点击交互，不覆盖交付文件

**模式 4（Figma 云端文件 + 可选 HTML）**：

- **Figma MCP**：接入 `https://mcp.figma.com/mcp`（Remote MCP）
- **席位**：Full / Dev 可读写；View / Collab 自动只读降级（每月约 6 次调用）
- **写前置**：加载 `figma-use` 工作流；写操作是 beta，可能计费，首次写入前确认
- **文件定位**：从 Figma URL 解析 `file_key`；没有 `file_key` 时先向用户确认，或经确认 `create_new_file`
- 详细工具与错误处理见 [adapters/figma/references/figma-mcp.md](adapters/figma/references/figma-mcp.md)

## 核心功能

- ✅ 编排层 + 适配器：Pen / Axure / Figma 已迁移，OpenDesign 为 `planned` 占位
- ✅ T8 解耦：只决定原生/仅 HTML，具体工具由本 Skill 询问
- ✅ 页面设计自动化：通过自然语言描述生成 .pen 设计文件
- ✅ 跨客户端提问协议：兼容 `AskUserQuestion` / `question`，无提问工具时输出编号选项并停止等待
- ✅ 安全护栏：安装、覆盖、GUI 接管、删除与最终交付前必须确认，并执行交付前自检
- ✅ CLI 优先 MCP 兜底：简单页面一句话生成，复杂页面精细控制
- ✅ 组件库配置管理：通过 components.json 管理组件注册、使用统计
- ✅ 双向同步：配置文件与控件库的一致性维护
- ✅ 完整性校验：启动时自动验证文件、格式、nodeId
- ✅ 交互描述管理：JSON 格式 context，支持回写 PRD.md
- ✅ 便签文档生成：自动创建功能说明和字段说明便签
- ✅ 设计规范多来源：合并 `design.md` / `tokens.json` / `variables.css` / `UI Design.pen|html`
- ✅ 控件库导入：CLI `--library` 载入 `.lib.pen`（含内置 `pencil:shadcn.lib.pen`）
- ✅ 命名规范驱动：通过统一命名规范管理组件
- ✅ 批量处理：支持批量生成多个设计文件
- ✅ 导出能力：导出为 PNG/JPEG/WEBP/PDF，以及 HTML（html-tailwind / html-css）
- ✅ 可交互原型生成：从 .pen 生成单文件 HTML，严格实现 context 交互，多页面左导航 + 右功能说明
- ✅ 结构化交付契约：原型内嵌 `prototype-manifest`，页面/路由/交互/组件可被下游直接解析
- ✅ 仅 HTML 模式：不生成 .pen、跳过 pen 环境校验，直接产出单文件可交互 HTML
- ✅ Axure 模式：经 zee-rp CLI/MCP 生成/修改原生 `.rp`，支持 RP/1 源码、截图转布局、交互/面板/中继器/母版
- ✅ Axure 安全编辑：先读后改、工作副本链、输出新文件、结构三零校验
- ✅ Axure 证据分层：结构、GUI 往返、实际预览分别记录
- ✅ Figma 模式：经 Remote MCP 读取/创建云端设计，支持变量、组件库、截图与只读降级
- ✅ Figma 安全写入：`whoami()` 席位探测、`figma-use` 前置、`file_key` 管理、写前确认
- ✅ HTML 组件库：无 .pen 时以 `component-library.html` + `components.json` 管理可复用组件
- ✅ 原型增强特性：水滴标注系统（标注点+连接线+开关）、拖拽分割线、说明面板字体调整
- ✅ 网页转设计：MCP `browser` 工具把真实网页/元素复现为可编辑画布图层
- ✅ AI 图片与 SVG 生成：`Generate` 生成 AI 图、Unsplash 图库、矢量插画

## 使用方法

### 平台兼容

- **Codex**: 通过 `SKILL.md` 触发 skill；`agents/openai.yaml` 提供 Codex UI 元数据。文件读写、命令执行使用 Codex 当前可用工具。
- **Claude Code**: 通过 `SKILL.md` 触发 skill。文件读写可使用 `Read` / `Edit` / `MultiEdit`，命令执行可使用 `Bash`。MCP 工具（`execute` / `get_app_state` / `get_style` / `read_skill` / `browser`）由 Pen.app 桌面应用提供。

### 激活 Skill

当用户需要：
- 创建新的页面设计
- 使用 pen.dev 设计 UI 界面
- 使用 Figma Remote MCP 设计/修改云端页面
- 基于需求生成 .pen / .rp / Figma 文件
- 管理可复用的设计组件
- 维护组件库配置
- 把真实网页转成设计稿

时会自动激活此 Skill。

### 基本流程

0. **前置检查**：依次检查 `PRD.md` → 标准控件库 → 设计规范（`design.md` / `tokens.json` / `variables.css` / `UI Design.pen|rp|html` / Figma 文件），检测到已有资产时设计阶段强制复用与遵循；缺失时询问用户，未提供则记录，待产出形式选定后建默认并标注「默认值待确认」
1. **产出形态选择**：检查完成后先询问「原生设计文件 + 可交互 HTML」还是「仅可交互 HTML」；选原生后再询问 Pen / Axure / Figma（OpenDesign planned，当前禁用），未选择不得开始
2. **环境校验**：模式 1 检查 pen.dev CLI 是否已安装并认证；模式 2 跳过；模式 3 检查 zee-rp、Python 与 Axure 空白模板；模式 4 检查 Figma MCP 与席位
3. **页面设计**：模式 1 CLI Agent 优先、按需切 MCP `execute`；模式 2 直接编写 HTML 页面片段；模式 3 编写 RP/1 源码并用 `proto.mjs check/generate`，已有 `.rp` 用原生 writer / MCP 会话链；模式 4 先读后写，写前加载 `figma-use`
4. **组件查找**：模式 1 用 `Get(n => n.reusable)`；模式 2 查 `component-library.html` 的 `<template>`；模式 3 查 `masters` / `.rplib`；模式 4 用 `get_libraries` / `search_design_system`
5. **组件提取**：识别可复用组件（模式 2 提取 HTML 片段，模式 4 优先实例化已发布组件）
6. **组件库更新 + 配置更新**：更新控件库.pen、`component-library.html`、Axure 母版或 Figma 组件，并同步 components.json
7. **可交互原型生成**：模式 1 可选、从 .pen 生成；模式 2 默认执行、从 HTML 片段组装；模式 3 主交付 `.rp`，可选从 RP/1 源码或 `.rp` 生成；模式 4 主交付 Figma 文件，可选生成 `design-prototype.html`（均内嵌 `prototype-manifest` 供下游解析）

### 四种载体（适配器）

> T8 只决定原生/仅 HTML；下表用于说明具体载体的差异，不代表 T8 选择工具。
> OpenDesign 为 `planned` 占位，当前不进入可选项；点名时返回 `blocked`。

#### 模式 1：pen.dev .pen + HTML

#### Agent 模式（快速生成，优先使用）

适合简单到中等复杂度的页面。**直接透传用户原话**，不要扩写 prompt。

```bash
pen --out login.pen --prompt "Create a login page with email and password"
pen --in app.pen --out app-v2.pen --prompt "Add a sidebar"
```

#### MCP Interactive 模式（精细控制，兜底）

适合复杂设计和精确控制。先 `get_app_state` 看状态、`read_skill` 取 schema，再用 `execute` 的 JS snippet 增删改节点。

```bash
pen interactive -o dashboard.pen
# Shell 中：
get_app_state()
read_skill({ path: "pen-schema.md" })
read_skill({ path: "execute.md" })
execute({ filePath: "dashboard.pen", description: "Create dashboard frame", input: "pageId = Insert(document,{type:'frame',name:'Dashboard',...})" })
save()
exit()
```

> 桌面端连接（app 模式）需 **Pen.app 正在运行**；否则用 `pen interactive` headless 模式。

#### 模式 2：仅 HTML

直接编写 `design-pages.html` / `UI Design.html` / `component-library.html`，再组装 `design-prototype.html`，不依赖 pen 工具链。

#### 模式 3：Axure（zee-rp）

```bash
export ZEE_RP_HOME=/absolute/path/to/zee-rp
node adapters/axure/scripts/axure-preflight.mjs

cd "$ZEE_RP_HOME"
node scripts/proto.mjs check --spec /abs/path/design.rp1.json
node scripts/proto.mjs generate --spec /abs/path/design.rp1.json \
  --out-dir /abs/path/outputs --out-rp /abs/path/design.rp
node bin/axure.mjs rp-read /abs/path/design.rp --json
```

已有 `.rp` 先 `rp-read`，再用 `name-widget` / `set-widget-text` / `add-interaction` 或 MCP 会话链（`axure_open` → `locate` → `edit_text` → `axure_save` → `verify`）修改，输出新文件。原生 RP11 用 `create-blank-project --version 11` 与对应 writer/MCP；RP/1 产物在 Axure 11 中验证时打开副本，避免升级改写交付文件。完整说明见 [adapters/axure/references/axure-mode.md](adapters/axure/references/axure-mode.md)。

#### 模式 4：Figma（Remote MCP）

```text
whoami()
get_variable_defs({ file_key })
get_libraries({ file_key })
get_design_context({ file_key, node_id })
use_figma({ file_key, ... })
get_screenshot({ file_key, node_id })
```

先 `whoami()` 判断席位：Full / Dev 可写，View / Collab 自动只读降级；写前加载 `figma-use`。已有文件从 URL 解析 `file_key`，新文件用 `create_new_file`。`get_design_context` 默认 React + Tailwind 仅作结构参考；`get_screenshot` 只证明视觉。完整说明见 [adapters/figma/SKILL.md](adapters/figma/SKILL.md) 与 [figma-mcp.md](adapters/figma/references/figma-mcp.md)。

## 组件命名规范

所有可复用组件遵循统一的命名规范，格式为：`{前缀}-{功能描述}`

### 组件分类

| 分类 | 前缀 | 示例 |
|------|------|------|
| 基础 | btn-, icon-, label-, tag- | btn-primary, icon-user, label-title |
| 表单 | input-, select-, switch-, checkbox-, radio- | input-text, select-dropdown |
| 布局 | card-, container-, grid-, sidebar-, header- | card-dashboard, sidebar-main |
| 导航 | nav-, tab-, breadcrumb-, menu- | nav-top, tab-horizontal |
| 数据展示 | table-, list-, chart-, timeline- | table-users, chart-line |
| 反馈 | modal-, toast-, alert-, progress- | modal-confirm, toast-success |

## 配置文件

组件库通过 `components.json` 管理注册信息，包括分类、nodeId、使用统计等。Axure 条目为增量扩展：`format: "axure"`、`source: "axure"`、`master` 或 `libraryFile` + `widgetName`，并使用顶层 `axureLibraryFile` / `axureMasterFile`。Figma 条目使用 `format: "figma"`、`source: "figma"`、`figmaFileKey`、`componentKey` / `nodeId` 与 `libraryName`，顶层记录 `figmaFileKey`。每次设计时自动校验配置与控件库的一致性，支持双向同步。

## 可复用性判断标准

Agent 会根据以下标准自动判断一个元素是否应该成为可复用组件：

1. **多页面使用潜力**：是否具有通用性
2. **独立完整功能**：是否包含完整的功能单元
3. **可参数定制**：是否可通过属性参数进行定制
4. **结构完整性**：是否结构完整（非碎片化元素）

**判断规则**：符合 3 条或以上标准则标记为 `reusable: true`。

## 版本

- 版本号: 5.1.0
- 创建日期: 2026-03-31
- 更新日期: 2026-10-22

## 更新日志

### v5.1.0 (2026-10-22)
- ✨ 新增模式 4（Figma）：经 Remote MCP 读取/创建云端设计，支持变量、组件库与截图
- 🧩 新增 `adapters/figma/` 子技能：席位探测、`figma-use` 前置、`file_key` 管理、只读降级
- 🔄 产出形态与工具选择保持两步：T8 只决定原生/仅 HTML，具体工具由本 Skill 询问
- 📚 适配器契约、组件库配置、原型生成与 Context 模板同步支持 Figma

### v5.0.0 (2026-10-22)
- 💥 完成编排层 + 适配器架构：Pen / Axure 细节迁入 `adapters/`，父级 `SKILL.md` 保留编排与公共核心
- ✨ 产出确认拆分为「原生 / 仅 HTML」与「具体工具」两步；T8 不再询问 `.pen` 或具体工具
- 🧩 `DesignRequest.adapter` 可留空，由 `prototype-designer` 选择已就绪适配器
- 🚫 OpenDesign 以 `planned` 占位：不进入可选项，点名时返回 `blocked`，不提供未验证命令
- 📚 新增适配器契约、注册表、调研清单与 OpenDesign 回退测试

### v4.5.1 (2026-10-22)
- 🔧 抽象跨客户端提问协议：兼容 `AskUserQuestion` / `question`，无工具时输出编号选项并等待
- 🔧 新增不可逆操作确认与交付前自检清单
- 📦 精简 `SKILL.md` 至约 500 行，Pen/Axure 细节下沉到 adapters
- 🧩 新增适配器契约与索引，Axure 参考/预检迁入 `adapters/axure/`
- 🧩 Pen 适配器迁移：`execute-api`、`pen-schema`、`mcp-tools` 与示例文件迁入 `adapters/pen/`

### v4.5.0 (2026-10-22)
- ✨ 新增模式 3（Axure）：经 zee-rp CLI/MCP 生成/修改可在 Axure RP 中继续编辑的原生 `.rp`
- ✨ 支持 RP/1 源码 `check/generate`、已有 `.rp` 的 `rp-read` 与原生 writer、MCP 会话链、截图转布局
- ✨ 新增 Axure 参考与环境检测（现位于 `adapters/axure/`）
- 🔄 产出形式扩展为三项；PRD、控件库、设计规范与组件库检查在三种模式下均保留

### v4.4.1 (2026-10-22)
- 🔁 重新发布以同步 skillhub 版本记录，功能同 v4.4.0

### v4.4.0 (2026-10-22)
- ✨ 新增原型结构化交付契约：`design-prototype.html` 内嵌 `#prototype-manifest`，保留 `data-page` / `data-route` / `data-context`、`data-target`、`data-annotation-id`
- 🔄 `design-pages.html` 要求 `data-page` 唯一、`data-route` 必填
- ✨ 下游（如 prototype-to-frontend）可直接按元数据解析页面/交互，无需改动其流程

### v4.3.0 (2026-10-22)
- 🔄 对齐 pen.dev CLI 0.3.12：MCP 工具改为 5 个（`execute` / `get_app_state` / `get_style` / `read_skill` / `browser`），`get_guidelines` 已移除
- ✨ `get_app_state` 改为无参数；schema 与 execute 文档改用 `read_skill`
- ✨ `execute` 新增 `description`；`browser` 新增 `cdp` / `nodeId` / `method` / `params`
- ✨ CLI 新增 `--library`，可导入 `.lib.pen` 控件库（含内置 `pencil:shadcn.lib.pen`）
- ✨ 设计规范检查扩展为 `design.md` / `tokens.json` / `variables.css` 等多来源合并，冲突需用户确认

### v4.2.0 (2026-10-22)
- 🔄 流程前置化：设计前固定执行「PRD.md → 标准控件库 → 设计规范 → 产出形式确认」
- ✨ 控件库同时探测 `.pen`（`控件库.pen` > `lib.pen` > `component.lib`）与 HTML（`component-library.html`）两种载体
- ✨ 检测到已有控件库/设计规范时强制复用与遵循，缺失时询问用户，未提供则建默认并标注「默认值待确认」
- ✨ pencil 分支明确产出 `.pen` + 可交互 HTML

### v4.0.0 (2026-08-31)
- 💥 **破坏性更新**：Pencil → pen.dev 全面更名（命令 `pen`、包 `@pen.dev/cli`、环境变量 `PEN_*`）
- 💥 **MCP 工具重构**：旧 9 个工具（`batch_design`/`batch_get`/`get_editor_state`/`get_screenshot`/`export_nodes`/`get_variables`/`set_variables`/`snapshot_layout`/`get_guidelines` 部分）合并为 4 个（`execute`/`get_app_state`/`get_guidelines`/`browser`）
- ✨ `execute` 改为 JS snippet 模式，新增 `editId` + `edits` 失败修补机制
- ✨ 新增 `browser` 工具：真实网页/元素 → 可编辑画布图层
- ✨ 新增 `Generate`：AI 图、Unsplash 图库、矢量 SVG 插画
- ✨ 新增 `Export`：HTML 导出（`html-tailwind` / `html-css`）
- ✨ 新增 CLI `read_skill` / `get_style` 拉取官方文档
- ✨ 新增参考文档：execute-api.md、pen-schema.md、mcp-tools.md（现位于 `adapters/pen/references/`）
- ✨ 补入官方硬性禁令（无 image 节点类型、禁止 baseline/stretch/margin/百分比等）与最佳实践

### v3.2.0 (2026-05-29)
- ✨ 新增原型增强特性：水滴标注系统（标注点+连接线+显示/隐藏开关）
- ✨ 新增拖拽分割线：主内容区与说明面板间可拖拽调整宽度（CSS变量驱动）
- ✨ 新增说明面板字体调整：A⁻/A⁺ 缩放按钮，子元素使用 em 相对单位

### v3.1.1 (2026-05-16)
- 新增 Codex / Claude Code 运行平台兼容说明
- 新增 `agents/openai.yaml` Codex UI 元数据

### v3.1.0 (2026-04-24)
- ✨ 新增可交互原型生成（可选步骤）
- ✨ 从 .pen 文件生成单文件 HTML，严格实现 context 字段描述的交互

### v3.0.0 (2026-04-24)
- 🔄 合并 pencil-designer-lite 和 pencil-designer-pro 为统一版本
- ✨ 新增 components.json 配置管理（注册、使用统计、分类管理）
- ✨ 新增双向同步流程（配置 ↔ 控件库）

### v2.0.0 (2026-04-24)
- 🔄 从 pencil MCP 切换为 pencil CLI
- ✨ 新增环境校验步骤
- ✨ 新增 Agent 模式和 Interactive 模式
