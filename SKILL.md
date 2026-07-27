---
name: pencil-designer
slug: pencil-designer
displayName: pencil-designer

version: 3.7.0
description: Pencil 页面设计 Skill，用于创建/修改 .pen 文件、管理组件库、生成可交互 HTML 原型。CLI 优先快速出图，MCP Interactive 兜底精细控制。支持按需校验、context 补录和原型生成。用户提到 Pencil 设计、生成 .pen 文件、页面/UI 设计、组件库管理或 HTML 原型时应使用此 skill。
author: AI Agent Team
created: 2026-03-31
updated: 2026-06-25
tags:
  - design
  - ui
  - pencil
  - pencil-cli
  - mcp
  - page-design
  - component-library
  - interactive-prototype
triggers:
  - 设计页面
  - 创建 UI
  - 生成 .pen 文件
  - Pencil 设计
  - 界面设计
  - 页面布局
  - 组件库管理
  - 生成可交互原型
  - 导出 HTML 原型
  - 交互原型
---

# Pencil Designer - Skill 指令

## 运行平台兼容

此 Skill 同时支持 **Codex** 和 **Claude Code**。文档中的 `batch_get`、`batch_design` 等表示 Pencil MCP 工具能力，在当前平台使用等价工具执行即可。

## 触发条件

当用户请求以下任务时，自动激活此 Skill：

- 创建新的页面设计或 UI 界面
- 基于 Pencil 设计 `.pen` 文件
- 设计 Web 应用、移动应用、仪表板、落地页等界面
- 管理和使用可复用的设计组件
- 维护和更新组件库配置
- 基于 PRD.md 需求文档进行可视化设计

---

## 前置条件：环境校验

### 步骤 0: 检查 pencil CLI

**执行**:

1. 运行 `pencil version` 检查 CLI 是否已安装
2. 如果不存在，提示安装：`npm install -g @pencil.dev/cli`
3. 确认 Node.js 版本 >= 18：`node --version`
4. 运行 `pencil status` 检查认证状态
5. 如果未认证，提示 `pencil login` 或设置 `PENCIL_CLI_KEY`

**安装失败处理**:

- `npm install -g` 失败 → 检查 npm 权限和网络
- Node.js 版本过低 → 提示升级到 18+
- 命令超时（>15 秒无响应）→ 检查网络/VPN，重试；仍失败则提示手动检查

**重要**: 环境校验未通过时，**不得**继续执行设计流程。

---

## pencil CLI 工具使用指南

### 两种使用模式

#### 模式 1: Agent 模式（快速生成）

```bash
# 从零创建设计
pencil --out output.pen --prompt "Create a login page with email and password fields"

# 修改已有设计
pencil --in input.pen --out output.pen --prompt "Add a sidebar navigation"

# 使用特定模型
pencil --out output.pen --model claude-haiku-4-5 --prompt "Create a 404 page"

# 导出为图片
pencil --in design.pen --export output.png --export-scale 2
```

#### 模式 2: Interactive 模式（精细控制）

```bash
# 启动交互式 Shell（新文件）
pencil interactive -o output.pen

# 编辑已有文件
pencil interactive -i input.pen -o output.pen

# 连接桌面应用（实时预览）
pencil interactive -a desktop -i input.pen
```

Interactive Shell 中可用命令：

```
get_editor_state({ include_schema: true })
get_guidelines()
get_guidelines({ category: "guide", name: "Landing Page" })
batch_get({ patterns: [{ reusable: true }], readDepth: 2, searchDepth: 3 })
batch_design({ operations: 'frame=I(document,{type:"frame",name:"MyFrame",width:1440,height:900})' })
get_screenshot({ nodeId: "frame" })
save()
exit()
```

### CLI 核心命令参考

| 命令                                      | 说明           |
| --------------------------------------- | ------------ |
| `pencil version`                        | 检查 CLI 版本    |
| `pencil status`                         | 检查认证状态       |
| `pencil login`                          | 交互式登录        |
| `pencil --out <file> --prompt "<text>"` | Agent 模式生成设计 |
| `pencil interactive -o <file>`          | 启动交互式 Shell  |
| `pencil --in <file> --export <img>`     | 导出设计为图片      |
| `pencil --list-models`                  | 列出可用 AI 模型   |

### Interactive Shell 内置工具

| 工具                                | 说明                      |
| --------------------------------- | ----------------------- |
| `batch_design`                    | 插入、更新、删除、移动、复制、替换节点     |
| `batch_get`                       | 按模式或 ID 搜索和读取节点         |
| `get_editor_state`                | 获取文档元数据和结构              |
| `get_guidelines`                  | 加载设计指南和样式               |
| `get_variables` / `set_variables` | 读写设计变量                  |
| `get_screenshot`                  | 将节点渲染为图片                |
| `export_nodes`                    | 导出节点为 PNG/JPEG/WEBP/PDF |
| `snapshot_layout`                 | 获取文档布局结构                |
| `save()`                          | 保存到磁盘                   |

### 工具选择策略

**核心原则：CLI 优先，MCP 兜底。**

```
任何设计任务 → 先尝试 CLI（Agent 模式）
  ✅ 成功 → 完成
  ❌ 结果不理想/需要精细控制 → 降级到 Interactive 模式（MCP）
```

CLI 适用：从零创建、修改已有设计、导出图片、简单到中等复杂度页面。
MCP 适用：精确控制节点属性、引用已有组件、分批构建复杂结构、读取已有设计节点信息。

---

## 完整设计流程

```
Step 0 环境校验 → Step 1 CLI 检查 → Step 2 PRD.md → [可选] Step 4 校验 → Step 5 组件查找 → Step 6 页面设计 → [可选] Step 6b Context → [可选] Step 7-8 组件提取 → [可选] Step 9 原型生成
```

| 步骤             | 默认     | 引用                                                            |
| -------------- | ------ | ------------------------------------------------------------- |
| 0. 环境校验        | 强制     | 本文件                                                           |
| 1. CLI 可用性     | 强制     | 本文件                                                           |
| 2. PRD.md 检查   | 强制     | 本文件                                                           |
| 3. 设计规范文件      | 强制     | 本文件                                                           |
| 4. 校验环境        | **可选** | [config-management.md](references/config-management.md)       |
| 5. 组件查找        | 默认     | 本文件                                                           |
| 6. 页面设计        | 强制     | 本文件                                                           |
| 6b. Context 补录 | **可选** | [context-templates.md](references/context-templates.md)       |
| 7-8. 组件提取/更新   | **可选** | 本文件                                                           |
| 9. 可交互原型       | **可选** | [prototype-generation.md](references/prototype-generation.md) |

---

## 步骤 1: CLI 可用性检查

```bash
pencil version
pencil status
```

- 安装 → `npm install -g @pencil.dev/cli`
- 未认证 → `pencil login` 或设 `PENCIL_CLI_KEY`

## 步骤 2: 检查 PRD.md

1. 在当前及上级目录查找 `PRD.md`
2. 存在 → 读取，提取：项目概述、功能模块、数据字段、业务流程
3. 不存在 → **AskUserQuestion**: "未找到 PRD.md，是否跳过直接设计？[1] 跳过继续 [2] 先提供 PRD.md [3] 按描述直接设计"

## 步骤 3: 检查设计规范文件

检查当前目录是否存在 `UI Design.pen`。不存在则创建，用于存储色彩方案、字体规范、组件风格。

## 步骤 4: 校验环境（可选）

默认跳过。以下场景需要执行：

- 首次使用 Skill
- 组件库较大或多人协作
- 怀疑配置与设计文件不一致

详细校验流程（6 步）和异常处理见 [config-management.md](references/config-management.md)。

**发现差异时 AskUserQuestion**: "检测到配置与控件库不一致，请选择：[1] 以配置为准 [2] 以 .pen 为准 [3] 手动合并 [4] 忽略继续"

## 步骤 5: 组件查找

1. 读取 `components.json`，按分类和名称前缀筛选
2. 在 Interactive Shell 中 `batch_get` 验证组件详情

```
# 搜索所有可复用组件
batch_get({ patterns: [{ reusable: true }], readDepth: 2, searchDepth: 3 })

# 搜索特定类型
batch_get({ patterns: [{ name: "btn-.*" }], readDepth: 2 })
```

找到 → 记录 nodeId；未找到 → 计划创建新组件。

## 步骤 6: 页面设计

**组件命名规范**见 [component-naming.md](references/component-naming.md)。

### CLI Agent 模式

```bash
pencil --out page.pen --prompt "Create a login page with:
- Email input field
- Password input field
- Sign In button
- Design should use blue (#1890ff) as primary color"
```

### Interactive 模式

- 每次 `batch_design` 最多 25 个操作
- 复杂页面分批构建：结构 → 内容 → 样式 → context → 便签
- 所有交互型节点必须附带 `context` 属性
- **注意**: Agent 模式不会自动添加 context，需在 prompt 中显式要求或切换到 Interactive 模式

### 操作规范

- 复杂页面分多次 `batch_design`（结构 → 内容 → 样式 → context → 便签）
- 所有交互型节点必须附带 `context` 属性
- Agent 模式需显式要求在 prompt 中添加 context

## 步骤 6b: Context 补录（可选）

默认跳过。以下场景需要执行：

- 需要生成可交互原型
- 组件交付给开发团队
- 用户明确要求

详细模板和流程见 [context-templates.md](references/context-templates.md)。

**验证清单**:

```
□ 所有 btn-* 节点有 context
□ 所有 input-* 节点有 context
□ 所有 select-* 节点有 context
□ 所有 switch-* 节点有 context
□ 所有 nav-*/tab-* 节点有 context
□ 所有 icon-btn 节点有 context
□ 所有可点击卡片有 context
```

**发现新增交互时 AskUserQuestion**: "发现以下新增交互未在 PRD.md 中：

- btn-delete: DELETE /api/users/{{id}}
- filter-toggle: 展开高级筛选
  是否更新 PRD.md？[1] 全部写入 [2] 仅指定项 [3] 跳过"

## 步骤 7-8: 组件提取与控件库更新（可选）

默认不提取。以下场景执行：创建通用组件库、用户明确要求。

**可复用性判断标准**（满足 3 条以上标记为 `reusable: true`）：

1. 多页面使用潜力 — 通用性，非特定场景专用
2. 独立完整功能 — 可独立工作，有明确交互/展示目的
3. 可参数定制 — 有可变属性（文本、颜色、尺寸等）
4. 结构完整性 — 完整节点树，非碎片化单一元素

**控件库更新**:

1. 打开 `控件库.pen`（按优先级：`控件库.pen` > `lib.pen` > `component.lib`）
2. 标记 `reusable: true`，按规范命名
3. 生成唯一 ID，确定分类，写入 `components.json`
4. 更新 `lastUpdated` 时间戳

**删除组件时 AskUserQuestion**: "组件 {name} 已被使用 {count} 次，确认删除？[1] 确认删除 [2] 保留"

## 步骤 9: 可交互原型生成（可选）

**触发**: 用户请求"生成可交互原型"/"导出 HTML 原型"时执行。

**前提**: 步骤 6b context 补录验证通过。

**执行流程**:

1. `batch_get` 读取 .pen 所有页面和子节点（`readDepth: 4`），收集 context 和 note
2. 验证 context 完整性
3. 解析 context → 建立交互映射表
4. 生成单文件 HTML（内联 CSS+JS），**固定三栏布局**：
   - 左侧面板（180px，可拖拽 150~250px）：多页面导航
   - 中间面板（flex: 1）：主页面预览，含水滴标注点和 SVG 贝塞尔连线
   - 右侧面板（280px，可拖拽 200~500px）：功能说明面板
   - 拖拽分割线 + 字体调整 A⁻/A⁺
5. 严格按 context 实现交互（导航/提交/删除/搜索 debounce 等）
6. 内置 Toast、Confirm Modal、Loading 反馈组件

详细实现见 [prototype-generation.md](references/prototype-generation.md)。

**输出**: `{原文件名}-prototype.html`，与 .pen 同目录，单文件自包含。

---

## 批量处理

```bash
pencil --tasks batch.json
```

`batch.json` 示例：

```json
{
  "tasks": [
    { "out": "login.pen", "prompt": "Create a login page" },
    { "out": "register.pen", "prompt": "Create a registration page" },
    { "out": "dashboard.pen", "model": "claude-haiku-4-5", "prompt": "Create a dashboard" }
  ]
}
```

---

## 便签控件

便签用于在设计稿中添加注释和说明。类型和颜色方案见 [note-styling.md](references/note-styling.md)。

**创建示例**:

```
# 基础便签
batch_design({ operations: 'note=I(page,{type:"note",content:"这是便签内容",x:100,y:100,width:300})' })

# 带样式便签（Frame 包裹）
batch_design({ operations: 'note=I(page,{type:"note",name:"功能说明",content:"..."})' })
```

**注意**: Note 节点不支持 `fill` 属性，需使用 Frame 包裹实现背景色。

---

## 注意事项

### 设计最佳实践

1. **优先复用**: 始终先查找现有组件，再创建新组件
2. **命名规范**: 遵循 [component-naming.md](references/component-naming.md)
3. **CLI 优先**: 简单页面用 Agent 模式，复杂页面用 Interactive 模式
4. **分步设计**: 复杂页面分批构建（结构 → 内容 → 样式）
5. **验证结果**: 完成后用 `get_screenshot` 验证
6. **及时保存**: Interactive 模式中定期执行 `save()`
7. **定期校验**: 首次使用或多人协作时执行步骤 4

### 脚本目录

`scripts/` 目录预留用于未来自动化脚本（批量组件注册、配置同步工具等）。目前为空。

---

## 常见问题速查

- pencil 命令找不到？`npm install -g @pencil.dev/cli`，Node >= 18
- 认证失败？`pencil login` 或设 `PENCIL_CLI_KEY`
- Agent 模式结果不理想？切换到 Interactive 模式精细控制
- 组件命名冲突？加功能限定符（`btn-submit` 而非 `btn`）
- 导出设计？`pencil --in design.pen --export output.png --export-scale 2`
- 配置文件损坏？从备份恢复或从控件库重新生成

---

## 原型 HTML 模板

生成原型时参考 [assets/prototypes/main-prototype.html](assets/prototypes/main-prototype.html)。实现三栏布局、水滴标注、连线、localStorage 自动保存等功能。

## 版本信息

- **Skill 版本**: 3.7.0
- **创建日期**: 2026-03-31
- **更新日期**: 2026-06-25
- **变更说明**: v3.7.0 模块化拆分（4 个参考文件）+ 校验/组件步骤可选化 + 5 个 AskUserQuestion 检查点；v3.6.0 原型自动保存 + 拖拽锚点修复；v3.5.0 水滴标注拖拽；v3.4.0 连线坐标修复；v3.3.0 Context 补录+三栏布局
