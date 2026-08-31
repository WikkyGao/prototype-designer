# pen.dev Designer（原 Pencil Designer）

pen.dev 页面设计 Skill，支持 Codex 和 Claude Code。CLI Agent 模式优先快速出图，MCP `execute` 精细控制，配置文件管理组件库。

> **重要**：Pencil 已正式更名为 **pen.dev**。命令 `pencil` → `pen`，npm 包 `@pencil.dev/cli` → `@pen.dev/cli`，环境变量 `PENCIL_*` → `PEN_*`。本 Skill v4.0.0 已对齐 pen.dev CLI 0.3.5 与 Pen.app 1.2.5+ 的全新 MCP 工具集。

## 简介

pen.dev Designer 是一个专业的页面设计助手，帮助 Codex、Claude Code 等 AI Agent 通过 pen.dev CLI 创建 `.pen` 设计文件。结合 CLI 快速生成和 MCP `execute` 精细控制两种模式，通过 components.json 配置文件管理组件库，支持双向同步和完整性校验。

## 环境要求

- **Node.js**: >= 18
- **pen.dev CLI**: `npm install -g @pen.dev/cli`
- **认证**: 运行 `pen login` 或设置 `PEN_CLI_KEY` 环境变量

## 核心功能

- ✅ 页面设计自动化：通过自然语言描述生成 .pen 设计文件
- ✅ CLI 优先 MCP 兜底：简单页面一句话生成，复杂页面精细控制
- ✅ 组件库配置管理：通过 components.json 管理组件注册、使用统计
- ✅ 双向同步：配置文件与控件库的一致性维护
- ✅ 完整性校验：启动时自动验证文件、格式、nodeId
- ✅ 交互描述管理：JSON 格式 context，支持回写 PRD.md
- ✅ 便签文档生成：自动创建功能说明和字段说明便签
- ✅ 命名规范驱动：通过统一命名规范管理组件
- ✅ 批量处理：支持批量生成多个设计文件
- ✅ 导出能力：导出为 PNG/JPEG/WEBP/PDF，以及 HTML（html-tailwind / html-css）
- ✅ 可交互原型生成：从 .pen 生成单文件 HTML，严格实现 context 交互，多页面左导航 + 右功能说明
- ✅ 原型增强特性：水滴标注系统（标注点+连接线+开关）、拖拽分割线、说明面板字体调整
- ✅ 网页转设计：MCP `browser` 工具把真实网页/元素复现为可编辑画布图层
- ✅ AI 图片与 SVG 生成：`Generate` 生成 AI 图、Unsplash 图库、矢量插画

## 使用方法

### 平台兼容

- **Codex**: 通过 `SKILL.md` 触发 skill；`agents/openai.yaml` 提供 Codex UI 元数据。文件读写、命令执行使用 Codex 当前可用工具。
- **Claude Code**: 通过 `SKILL.md` 触发 skill。文件读写可使用 `Read` / `Edit` / `MultiEdit`，命令执行可使用 `Bash`。MCP 工具（`execute` / `get_app_state` / `get_guidelines` / `browser`）由 Pen.app 桌面应用提供。

### 激活 Skill

当用户需要：
- 创建新的页面设计
- 使用 pen.dev 设计 UI 界面
- 基于需求生成 .pen 文件
- 管理可复用的设计组件
- 维护组件库配置
- 把真实网页转成设计稿

时会自动激活此 Skill。

### 基本流程

1. **环境校验**：检查 pen.dev CLI 是否已安装并认证（`pen version` / `pen status`）
2. **检查 PRD.md**：确认需求文档存在
3. **检查设计规范**：确认 UI Design.pen 存在
4. **页面设计**：CLI Agent 模式优先，结果不理想或需精确控制时切 MCP `execute`
5. **组件查找**：通过配置文件 + `Get(n => n.reusable)` 搜索可用组件
6. **组件提取**：识别新创建的可复用组件
7. **控件库更新 + 配置更新**：更新控件库.pen 和 components.json
8. **可交互原型生成**（可选）：从 .pen 生成单文件 HTML 原型

### 两种设计模式

#### Agent 模式（快速生成，优先使用）

适合简单到中等复杂度的页面。**直接透传用户原话**，不要扩写 prompt。

```bash
pen --out login.pen --prompt "Create a login page with email and password"
pen --in app.pen --out app-v2.pen --prompt "Add a sidebar"
```

#### MCP Interactive 模式（精细控制，兜底）

适合复杂设计和精确控制。先 `get_app_state` 取 schema，再用 `execute` 的 JS snippet 增删改节点。

```bash
pen interactive -o dashboard.pen
# Shell 中：
get_app_state({ include_schema: true, include_canvas_design: true, include_scripts_and_shaders: false })
execute({ filePath: "dashboard.pen", input: "pageId = Insert(document,{type:'frame',name:'Dashboard',...})" })
save()
exit()
```

> 桌面端连接（app 模式）需 **Pen.app 正在运行**；否则用 `pen interactive` headless 模式。

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

组件库通过 `components.json` 管理注册信息，包括分类、nodeId、使用统计等。每次设计时自动校验配置与控件库的一致性，支持双向同步。

## 可复用性判断标准

Agent 会根据以下标准自动判断一个元素是否应该成为可复用组件：

1. **多页面使用潜力**：是否具有通用性
2. **独立完整功能**：是否包含完整的功能单元
3. **可参数定制**：是否可通过属性参数进行定制
4. **结构完整性**：是否结构完整（非碎片化元素）

**判断规则**：符合 3 条或以上标准则标记为 `reusable: true`。

## 版本

- 版本号: 4.0.0
- 创建日期: 2026-03-31
- 更新日期: 2026-08-31

## 更新日志

### v4.0.0 (2026-08-31)
- 💥 **破坏性更新**：Pencil → pen.dev 全面更名（命令 `pen`、包 `@pen.dev/cli`、环境变量 `PEN_*`）
- 💥 **MCP 工具重构**：旧 9 个工具（`batch_design`/`batch_get`/`get_editor_state`/`get_screenshot`/`export_nodes`/`get_variables`/`set_variables`/`snapshot_layout`/`get_guidelines` 部分）合并为 4 个（`execute`/`get_app_state`/`get_guidelines`/`browser`）
- ✨ `execute` 改为 JS snippet 模式，新增 `editId` + `edits` 失败修补机制
- ✨ 新增 `browser` 工具：真实网页/元素 → 可编辑画布图层
- ✨ 新增 `Generate`：AI 图、Unsplash 图库、矢量 SVG 插画
- ✨ 新增 `Export`：HTML 导出（`html-tailwind` / `html-css`）
- ✨ 新增 CLI `read_skill` / `get_style` 拉取官方文档
- ✨ 新增参考文档：execute-api.md、pen-schema.md、mcp-tools.md
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
