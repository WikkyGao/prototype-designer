# Pencil Designer

Pencil 页面设计 Skill，支持 Codex 和 Claude Code。CLI 优先快速出图，Interactive/MCP 兜底精细控制，配置文件管理组件库。

## 简介

Pencil Designer 是一个专业的页面设计助手，帮助 Codex、Claude Code 等 AI Agent 通过 pencil CLI 创建 `.pen` 设计文件。结合了 CLI 快速生成和 Interactive/MCP 精细控制两种模式，通过 components.json 配置文件管理组件库，支持双向同步和完整性校验。

## 环境要求

- **Node.js**: >= 18
- **pencil CLI**: `npm install -g @pencil.dev/cli`
- **认证**: 运行 `pencil login` 或设置 `PENCIL_CLI_KEY` 环境变量

## 核心功能

- ✅ 页面设计自动化：通过自然语言描述生成 .pen 设计文件
- ✅ CLI 优先 MCP 兜底：简单页面一句话生成，复杂页面精细控制
- ✅ 组件库配置管理：通过 components.json 管理组件注册、使用统计
- ✅ 双向同步：配置文件与控件库的一致性维护
- ✅ 6 步完整性校验：启动时自动验证文件、格式、nodeId
- ✅ 交互描述管理：JSON 格式 context，支持回写 PRD.md
- ✅ 便签文档生成：自动创建功能说明和字段说明便签
- ✅ 命名规范驱动：通过统一命名规范管理组件
- ✅ 批量处理：支持批量生成多个设计文件
- ✅ 导出能力：导出为 PNG/JPEG/WEBP/PDF
- ✅ 可交互原型生成：从 .pen 生成单文件 HTML，严格实现 context 交互，多页面左导航 + 右功能说明
- ✅ 原型增强特性：水滴标注系统（标注点+连接线+开关）、拖拽分割线、说明面板字体调整

## 使用方法

### 平台兼容

- **Codex**: 通过 `SKILL.md` 触发 skill；`agents/openai.yaml` 提供 Codex UI 元数据。文件读写、命令执行使用 Codex 当前可用工具。
- **Claude Code**: 通过 `SKILL.md` 触发 skill。文件读写可使用 `Read` / `Edit` / `MultiEdit`，命令执行可使用 `Bash`。
- 文档中出现的 `batch_get`、`batch_design` 等命令是 Pencil Interactive/MCP 能力；如果当前平台直接提供 Pencil MCP 工具，可以直接调用，否则通过 `pencil interactive` 使用。

### 激活 Skill

当用户需要：
- 创建新的页面设计
- 使用 Pencil 设计 UI 界面
- 基于需求生成 .pen 文件
- 管理可复用的设计组件
- 维护组件库配置

时会自动激活此 Skill。

### 基本流程

1. **环境校验**：检查 pencil CLI 是否已安装并认证
2. **检查 PRD.md**：确认需求文档存在
3. **检查设计规范**：确认 UI Design.pen 存在
4. **校验环境**：执行 6 步完整性校验
5. **组件查找**：通过配置文件 + MCP 搜索可用组件
6. **页面设计**：CLI 优先，失败后降级到 MCP Interactive 模式
7. **组件提取**：识别新创建的可复用组件
8. **控件库更新 + 配置更新**：更新控件库.pen 和 components.json
9. **可交互原型生成**（可选）：从 .pen 生成单文件 HTML 原型

### 两种设计模式

#### Agent 模式（快速生成，优先使用）

适合简单到中等复杂度的页面：

```bash
pencil --out login.pen --prompt "Create a login page with email and password"
```

#### Interactive 模式（精细控制，MCP 兜底）

适合复杂设计和精确控制：

```bash
pencil interactive -o dashboard.pen
# 在 Shell 中逐步执行 MCP 工具
batch_design({ operations: '...' })
save()
exit()
```

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

- 版本号: 3.2.0
- 创建日期: 2026-03-31
- 更新日期: 2026-05-29

## 更新日志

### v3.2.0 (2026-05-29)
- ✨ 新增原型增强特性：水滴标注系统（标注点+连接线+显示/隐藏开关）
- ✨ 新增拖拽分割线：主内容区与说明面板间可拖拽调整宽度（CSS变量驱动）
- ✨ 新增说明面板字体调整：A⁻/A⁺ 缩放按钮，子元素使用 em 相对单位

### v3.1.1 (2026-05-16)
- 新增 Codex / Claude Code 运行平台兼容说明
- 新增 `agents/openai.yaml` Codex UI 元数据
- 保持原有 CLI 优先、MCP 兜底、组件库管理和原型生成流程不变

### v3.1.0 (2026-04-24)
- ✨ 新增可交互原型生成（可选步骤）
- ✨ 从 .pen 文件生成单文件 HTML，严格实现 context 字段描述的交互
- ✨ 多页面支持左侧导航菜单 + 右侧功能说明面板
- ✨ 内置 Toast/Modal/Loading 反馈组件
- ✨ 自动从便签节点提取页面说明并映射到右侧面板

### v3.0.0 (2026-04-24)
- 🔄 合并 pencil-designer-lite 和 pencil-designer-pro 为统一版本
- ✨ 新增 components.json 配置管理（注册、使用统计、分类管理）
- ✨ 新增 6 步完整性校验（文件、格式、nodeId、未注册组件）
- ✨ 新增双向同步流程（配置 ↔ 控件库）
- ✨ 交互描述改为 JSON 格式，支持回写 PRD.md
- ✨ 新增 UI Design.pen 设计规范文件检查

### v2.0.0 (2026-04-24)
- 🔄 从 pencil MCP 切换为 pencil CLI
- ✨ 新增环境校验步骤
- ✨ 新增 Agent 模式和 Interactive 模式
- ✨ 新增批量处理和导出能力
