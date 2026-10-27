---
name: prototype-designer
slug: prototype-designer
displayName: prototype-designer

version: 5.6.0
description: 页面设计 Skill，支持 pen.dev（原 Pencil）、Axure 与 Figma。可创建/修改 .pen、管理组件库、生成可交互 HTML 原型；也可经 zee-rp 的 CLI/MCP 生成和修改可在 Axure RP 中继续编辑的原生 .rp；或通过 Figma Remote MCP 读取/创建云端设计（写操作需 Full/Dev 席位，只读席位自动降级）。进入设计前先检查 PRD.md、标准控件库与设计规范（design.md、tokens.json、variables.css、UI Design.pen/rp/html 或 Figma 文件），已有资产强制复用，缺失则询问或建默认并标注「默认值待确认」。随后确认产出形态：「原生设计文件 + 可交互 HTML」或「仅 HTML」；选择原生后再由本 Skill 询问 Pen / Axure / Figma / 墨刀 Modao（OpenDesign planned，当前禁用）。（仅 HTML 跳过原生工具环境校验，但保留 PRD/控件库/设计规范/组件库流程）。生成 HTML 原型时首次询问外壳变体（A 顶部导航 / B 三栏标注评审 / C 直出）并记住选择，后续默认沿用直到用户明确更换；配色与字体由项目令牌区按项目前端/UI 规范注入，不绑定视觉预设。Axure 子技能进入前先告知 zee-rp 第三方工具风险，默认 CLI 模式不接管鼠标/键盘，原生验收需逐项目开启 gui-acceptance；墨刀子技能经官方生成型 MCP 异步产出单文件 HTML（continue_task 迭代）。CLI Agent 快速出图，MCP execute 精细控制，browser 网页转设计。用户提到 Pencil/pen.dev、生成 .pen、Figma、Figma MCP、墨刀、MockingBot、modao、页面/UI 设计、组件库、网页转设计、HTML 原型、Axure、.rp、RP/1 或 zee-rp 时应使用此 skill。
author: AI Agent Team
created: 2026-03-31
updated: 2026-10-27
tags:
  - design
  - ui
  - pencil
  - pen-dev
  - axure
  - zee-rp
  - figma
  - figma-mcp
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
  - Axure 设计
  - 墨刀设计
  - 墨刀原型
  - MockingBot
  - 生成 .rp
  - RP/1
  - zee-rp
  - Figma 设计
  - Figma MCP
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
> 本 Skill v5.2.0 已对齐 pen.dev CLI 0.3.12 与 Pen.app 1.2.5+ 的 MCP 工具集，并支持 Pen / Axure / Figma 三种原生适配器。
> zee-rp 是独立实验性项目，不是 Axure 官方产品；其证据边界见 [axure-mode.md](adapters/axure/references/axure-mode.md)。Figma 写操作依赖 Remote MCP 与 Full/Dev 席位，见 [adapters/figma/SKILL.md](adapters/figma/SKILL.md)。

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
| `get_guidelines` | `get_style`（视觉风格）+ `read_skill`（设计指南）；0.3.12 起 `get_guidelines` 已移除 |
| — （新增） | `browser`（真实网页 → 可编辑图层） |
| — （新增） | `read_skill`（官方文档读取） |
| — （新增） | `get_style`（视觉风格原型） |

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

## 0.5 前置检查与产出形式选择（进入流程前必做）

### 0.5.0 提问协议（跨客户端）

本 skill 不绑定单一客户端。遇到必须由用户决定的事项，按当前环境选择：

| 环境 | 做法 |
|---|---|
| Claude Code / 支持 `AskUserQuestion` | 用交互提问工具，一次合并 1-3 个问题 |
| opencode / 支持 `question` | 用 `question` 工具，推荐项放第一 |
| 其他或无提问工具 | 输出编号选项，**停止并等待回复**；不得自问自答 |

用户回复前不得继续执行不可逆操作。下文所有“提问”均指本节协议。

### 0.5.0.1 客户端能力探测（先于提问）

进入流程前先探测当前客户端能力；缺失时**自动降级**，不得要求用户先安装本地工具或登录 CLI。

| 能力 | 探测信号 | 缺失时 |
|---|---|---|
| 本地 shell | 可执行 `node` / `python3` / `pen` 等命令 | 视为无本地工具 |
| 持久文件系统 | 可读写项目目录，且后续轮次仍存在 | 视为临时沙箱 |
| 原生 MCP | Pen / Figma / 墨刀 MCP 工具可用 | 跳过对应模式 |
| 交互提问 | `AskUserQuestion` / `question` 可用 | 用 §0.5.0 编号选项 |

- **无 shell、无持久文件系统或无原生 MCP**（如 ChatGPT 网页版、临时沙箱）→ 强制「仅 HTML」模式：
  - 接受用户直接粘贴 PRD、设计规范或控件清单，不要求文件路径，不写入 `components.json`
  - 只输出单文件自包含 HTML（CSS/JS 内联），产物由用户自行复制保存
  - 不尝试 pen.dev / Axure / Figma / 墨刀，不执行 `skillhub login`，不引导安装 CLI
  - 明确告知：产物不会持久化到用户本机
- **有 shell 但无对应原生工具** → 只提供「仅 HTML」，不引导安装 pen / zee-rp / Axure
- **有持久文件系统且对应 MCP 可用** → 按 §0.5.4 正常提供原生与仅 HTML 选项

固定顺序：**PRD.md → 标准控件库 → 设计规范文档 → 产出形式确认**。这四项完成前只做检测与询问，**不得**创建 `.pen`、控件库、设计规范或原型文件。

### 0.5.1 检查 PRD.md

在当前及上级目录查找 `PRD.md`：

- 存在 → 读取并提取项目概述、功能模块、数据字段、业务流程
- 不存在 → **按 §0.5.0 提问协议**："未找到 PRD.md，是否跳过？[1] 跳过继续 [2] 先提供 PRD.md [3] 按描述直接设计"

### 0.5.2 检查标准控件库

此时产出形式尚未确定，四种载体都要探测：

| 载体 | 文件名（按优先级） | 注册表 |
|------|-------------------|--------|
| `.pen` | `控件库.pen` > `lib.pen` > `component.lib` > `*.lib.pen` | `components.json` 的 `libraryFile` |
| HTML | `component-library.html` | `components.json` 的 `htmlLibraryFile` |
| Axure | `控件库.rp` / `控件库.rplib` > `*.rplib` > 含 `masters` 的 `.rp` | `components.json` 的 `axureLibraryFile` / `axureMasterFile` |
| Figma | 云端 library / 已发布组件（`get_libraries` / `search_design_system` / `get_library_items`） | `components.json` 的 `figmaFileKey` / `componentKey` |

- 命中 → 记录库文件、组件数量与分类，后续设计**强制复用与遵循**
- 未命中 → **按 §0.5.0 提问协议** 询问用户是否提供控件库路径；未提供则记录缺失，待 §0.5.4 确认产出形式后新建对应载体的默认控件库，并标注「默认值待确认」

### 0.5.3 检查设计规范文档与设计令牌

在当前及上级目录收集**所有存在**的规范来源（可多来源合并，不是只取第一个）：

| 类型 | 文件名（含常见变体） | 用途 |
|------|---------------------|------|
| 规范说明 | `design.md` / `DESIGN.md` / `design-system.md` | 设计原则、组件规则、文案与交互约定 |
| 令牌 JSON | `tokens.json` / `design-tokens.json` / `theme.json` | 机器可读令牌（支持 W3C `$value` 格式） |
| 令牌 CSS | `variables.css` / `design-tokens.css` / `theme.css` | `:root` 变量（颜色/字体/字号/间距/圆角/阴影） |
| 本 skill 载体 | `UI Design.pen` / `UI Design.rp` / `UI Design.html` | 可视化规范与令牌沉淀 |
| Axure 主题 | `theme.rp1.json` / RP/1 源码内 `theme` + `variables` | Axure 模式的主题与变量事实来源 |
| Figma 文件 | Figma URL / `file_key` + `get_variable_defs` | 云端设计规范、变量与组件事实来源 |

- 命中 → 记录来源；`design.md` 提供规则，令牌文件提供具体值，`UI Design.*` 提供示例，后续设计**强制引用**
- 同一令牌多来源取值不一致 → 生成冲突表交用户确认，不自动覆盖
- 均未命中 → **按 §0.5.0 提问协议** 询问用户提供规范文档/令牌文件路径；未提供则记录缺失，待 §0.5.4 确认产出形式后按所选载体创建默认规范，并标注「默认值待确认」

### 0.5.4 确认产出形态与工具（必须询问）

汇总前三步结果后再询问，用户未明确选择时**不得**创建任何设计产物：

```
已检测：PRD.md ✅｜控件库 N 个组件｜设计规范 ✅（或「未找到，将建默认」）
本次需要哪种产出？
1. 原生设计文件 + 可交互 HTML
2. 仅可交互 HTML
```

若用户选 1，再问原生工具；OpenDesign 为 `planned`，当前禁用：

```
请选择原生工具：
1. pen.dev → .pen + 可交互 HTML
2. Axure → .rp + 可选 HTML（进入前告知 zee-rp 第三方工具风险）
3. Figma → 云端文件 + 可选 HTML（写需 Full/Dev 席位）
4. 墨刀 Modao → 官方生成型 MCP，异步产出单文件 HTML + 云端预览
5. OpenDesign（planned，当前不可用）
```

- 用户只选产出形态时，**不得替用户选工具**。
- 由 `requirement-analysis` T8 进入时，`output` 已确定：跳过产出形态问题，直接确认原生工具（仅 HTML 则跳过本节）。
- `output=html` 时不再询问工具，直接进入公共 HTML 流程。
- Figma 先 `whoami()` 探测席位；View / Collab 自动只读降级，需要写时先说明限制。
- OpenDesign 选择后返回 `blocked`，提供「仅 HTML」或停止；不得静默换工具。

| 环节 | 模式 1：.pen + HTML | 模式 2：仅 HTML | 模式 3：Axure .rp + 可选 HTML | 模式 4：Figma 云端文件 + 可选 HTML | 模式 5：墨刀生成 + HTML |
|------|--------------------|-----------------|------------------------------|-----------------------------------|
| 环境校验（§1） | **必须** | **跳过**（不检查 CLI / MCP / 登录状态） | **必须**（zee-rp + Python + Axure 空白模板） | **必须**（Figma MCP + `whoami` 席位；只读自动降级） | **必须**（墨刀 MCP 挂载 + `get_account_status` 权益） |
| §0.5.1 PRD.md | 必须 | **必须** | **必须** | **必须** | **必须** |
| §0.5.2 标准控件库 | 必须（`.pen` 载体） | 必须（HTML 载体） | 必须（`.rp` 母版 / `.rplib` / RP/1 `components`） | 必须（Figma library / 已发布组件） | 必须（HTML 载体） |
| §0.5.3 设计规范 | `design.md` / `tokens.json` / `variables.css` + `UI Design.pen` | 同左 + `UI Design.html`（不存在则创建） | 同左 + `UI Design.rp`；令牌映射为 `theme` / `variables` / 十六进制 | 同左 + `get_variable_defs` 读取 Figma 变量 | 同左；令牌合并结果并入生成 `query`（风格 / 主色 / 圆角） |
| §7 组件库 | `控件库.pen` + `components.json` | `component-library.html` + `components.json` | `masters` / `.rplib` + `components.json` | Figma 已发布组件 + `components.json` 的 `figmaFileKey` / `componentKey` | `component-library.html` + `components.json` |
| 页面设计 | CLI Agent / MCP `execute` 生成 `.pen` | 直接编写 HTML 页面（带 `data-page` / `data-context`） | 编写 RP/1 源码 → `proto.mjs check/generate`；已有 `.rp` 用 CLI writer / MCP 会话链 | `create_new_file` / `use_figma`（先加载 `figma-use`） | 意图翻译为 query → `generate_html` 异步生成；迭代一律 `continue_task` |
| Context | `execute` 写入 `.pen` 节点 | HTML 节点内联 `data-context` 属性 | RP/1 `on` 原生交互；HTML 原型仍内联 `data-context` | Figma 侧不写节点 context；HTML 生成时从 PRD / 原型连线转 `data-context` | 交互意图并入生成 `query`；产物交公共核心后按需补 `data-context` |
| §9 原型生成 | `execute` 的 `Get` 读取 `.pen` → 评审 shell | 直接读取 HTML 页面 → 评审 shell | `rp-read` / MCP 读取 `.rp` 或 RP/1 源码 → 评审 shell（可选） | `get_design_context` / `get_metadata` 读取 → 评审 shell（可选） | `download_generated_content` 产物 → 按 `shellVariant` 评审 shell |
| 输出 | `design.pen` + `design-prototype.html` | 仅 `design-prototype.html` | `design.rp` + `design-prototype.html`（推荐，可选） | Figma URL + `design-prototype.html`（可选） | 墨刀预览链接 + `design-prototype.html` |

> 五种模式只是载体不同：**PRD 检查、控件库检查、设计规范检查、组件库管理一个都不能少**。检测到已有资产时必须强制复用与遵循。模式 2 跳过工具链环境校验，模式 3 跳过 pen.dev 但必须通过 zee-rp 环境校验（并先完成第三方工具风险告知），模式 4 必须通过 Figma MCP 与席位检查，模式 5 必须通过墨刀 MCP 与权益检查。详细规格见 [html-only-mode.md](references/html-only-mode.md)、[axure-mode.md](adapters/axure/references/axure-mode.md) 与 [adapters/figma/SKILL.md](adapters/figma/SKILL.md)。

### 0.5.5 HTML 原型外壳变体选择与项目令牌（仅生成 HTML 时）

产出形式确定后、页面设计前执行一次。**视觉与外壳解耦**：配色 / 字体 / 圆角不绑定预设，由「项目令牌区」按项目前端与 UI 规范注入（§0.5.3 命中来源合并，无规范用中性默认并标注「默认值待确认」，无明暗切换）；外壳按变体询问并记忆：

1. 从输出目录向上查找 `.prototype-designer.json`，读取 `shellVariant`
2. 已有合法值（A / B / C）→ 直接沿用，不再询问；交付说明写「本次沿用外壳：{A/B/C}」
3. 无值 → 按 §0.5.0 提问协议询问一次，推荐项放第一（需逐节点评审 → 推荐 B；页面少说明按页 → 推荐 A；演示走查 → 推荐 C）
4. 用户确认 → 写入项目根 `.prototype-designer.json`；明确说「只这次」则不写
5. 用户说「换外壳 / 用 X 方案」→ 重新确认并更新配置；**换外壳仅重组装评审壳，页面内容与 `data-*` 契约不变**
6. 用户拒绝选择 → 停止，不生成 HTML

```text
本次可交互 HTML 原型使用哪种外壳方案？
1. A 顶部导航版 — 顶部页面切换 + 页面级备注，最轻
2. B 三栏标注评审版 — 水滴 + 连线逐节点标注
3. C 直出版 — 页面直出 + 右下角说明面板
（确认后默认沿用；说「换外壳 / 用 X 方案」随时更换）
```

- 原生文件本身不需要外壳配置；仅在生成 HTML 原型时读取
- 旧配置 `prototypeStyle`（project / editorial-ink）的迁移规则见 [prototype-styles.md](references/prototype-styles.md) §二 / §七
- 配置结构、各外壳应用规则、令牌合并与自检见 [prototype-styles.md](references/prototype-styles.md)

### 0.5.6 旧模式兼容（保留一版）

新调用优先使用 `output` / `adapter` 字段；旧「模式 1/2/3」仅作一版兼容别名：

| 旧别名 | 等价参数 |
|---|---|
| 模式 1 | `output=native`、`adapter=pen`、`html=true` |
| 模式 2 | `output=html`、`adapter=null`、`html=true` |
| 模式 3 | `output=native`、`adapter=axure`、`html=true`（可选） |
| Figma（新字段） | `output=native`、`adapter=figma`、`html=true`（可选） |

T8 不传 `adapter`；由本 Skill 在原生工具步骤中询问并填入。Figma 作为新适配器直接使用新字段；OpenDesign 没有旧别名。

## 0.6 不可逆操作与交付检查点（必须确认）

以下动作前必须按 §0.5.0 说明范围并取得确认：

| 动作 | 必须说明 |
|---|---|
| 安装/升级全局依赖 | 命令、版本、影响范围；优先项目内 venv |
| 覆盖已有文件 | 原路径、备份或新文件名；默认不覆盖 |
| 接管 GUI（仅 Axure `gui-acceptance`） | 应用与版本、目标文件、会执行的点击/输入/保存/关闭；`cli` 模式不触发 |
| 删除/移动资产 | 文件、引用次数、可恢复方式 |
| 最终交付 | 输出文件、目标版本、验证层级、已知限制 |

**交付前自检（缺一不可）**：

```
□ 输出文件存在，未覆盖原稿；临时文件已清理
□ 目标模式/版本正确（.pen / HTML / RP9 / RP11）
□ 结构校验通过（.pen problems / .rp 三零 / HTML 自检）
□ 交互或预览证据已记录，未把结构通过说成预览通过
□ 交付说明包含验证层级、已知限制、下一步
```

---

## 1. 前置条件：环境校验（模式 1；模式 3 见 §1.1；模式 4 见 §1.2）

```bash
which pen || npm install -g @pen.dev/cli   # 安装
node --version                              # 需 >= 18
pen status                                  # 认证状态
npm view @pen.dev/cli version               # 最新版本
pen version                                 # 本地版本
```

**认证**：pen.dev 用户未登录时三选一

```bash
pen signup --email you@example.com --username johndoe --name "John Doe"  # 注册
pen login --email you@example.com --code 123456                          # 非交互登录
pen login                                                                 # 交互登录（浏览器/邮箱密码/OTP）
export PEN_CLI_KEY=...                                                    # CI/CD
```

> **Agent 认证**：`claude` agent 依赖已认证的 Claude Code；`codex` / `gpt-*` 模型需 `pen codex-login`；Pi provider（`google` / `xai` / `openrouter`）需对应 API Key。若都不可用，明确告知用户并协助配置。

**每次会话首次设计前**比对 `npm view @pen.dev/cli version` 与 `pen version`，不一致则提示升级：

```bash
npm install -g @pen.dev/cli
```

**模式 1 校验未通过不得继续设计流程；模式 2 直接跳过本节，不检查 pen CLI / MCP / 登录状态。**

### 1.1 模式 3：Axure（zee-rp）环境校验

模式 3 不检查 pen.dev，改用 Axure 适配器：

```bash
node adapters/axure/scripts/axure-preflight.mjs
```

`ZEE_RP_HOME`、venv、RP9/RP11 空白模板、MCP 配置与版本口径见 [adapters/axure/SKILL.md](adapters/axure/SKILL.md) 与 [axure-mode.md](adapters/axure/references/axure-mode.md) 第三章。**校验未通过不得生成 `.rp`；不得绕过 RP/1 `check`；不得覆盖原工程。**

### 1.2 模式 4：Figma（Remote MCP）环境校验

模式 4 不检查 pen.dev 或 zee-rp，改用 Figma 适配器：

```text
whoami()
```

- Figma MCP 未挂载 → 返回 `blocked`，给出 `https://mcp.figma.com/mcp` 接入指引，不猜工具名。
- Full / Dev 席位 → 可读写；首次写前提示 beta 可能计费并取得确认。
- View / Collab 席位 → **自动只读降级**，只做 `get_design_context` / `get_metadata` / `get_screenshot`。
- 写前必须加载 `figma-use` 工作流；未加载不得调用 `use_figma`。
- 没有 `file_key` → 让用户给 Figma URL，或取得确认后 `create_new_file`。

完整席位、`file_key`、工具与错误处理见 [adapters/figma/SKILL.md](adapters/figma/SKILL.md) 与 [figma-mcp.md](adapters/figma/references/figma-mcp.md)。**只读席位不得声称已写入；不得静默改用其他工具。**

---

## 2. 工具速查

| 模式 | 首选 | 精修/兜底 |
|---|---|---|
| 1 `.pen` | `pen --out ... --prompt "<用户原话>"` | `pen interactive` + `execute` |
| 2 HTML | 直接编写 HTML | — |
| 3 Axure | RP/1 `check` → `generate` | `rp-read` / writer / MCP |
| 4 Figma | `create_new_file` / `use_figma` | `get_design_context` / `get_metadata` / `get_screenshot` |
| 5 墨刀 | `generate_html`（query 按 §4 模板翻译） | `continue_task` 迭代 + `get_task_result` 轮询 + `download_generated_content` |
| OpenDesign | planned，当前禁用 | 返回 `blocked`；建议仅 HTML 或停止 |

**CLI 快速出图**：

```bash
pen --out design.pen --prompt "<用户原话>" --export design.png --export-scale 2
pen --in design.pen --out design-v2.pen --prompt "把主色改成绿色" --export v2.png
pen --out design.pen --library 控件库.pen --prompt "..."
pen --out design.pen --agent codex --prompt "..."
pen --out design.pen --prompt "参照这个布局" --prompt-file ./ref.png
```

- 直接透传用户原话，不自行扩写 prompt；超时至少 600000ms（10 分钟）。
- 生成后用 Read 读取导出的 PNG 展示给用户，必须展示。
- `--model` / `--agent` 按需指定；批量见 §11。

**MCP Interactive**：`pen interactive -i input.pen -o output.pen`；首次进入 `.pen` 任务先 `get_app_state()`、`read_skill({path:"pen-schema.md"})`、`read_skill({path:"execute.md"})`。

| 工具 | 用途 | 关键参数 |
|---|---|---|
| `get_app_state` | 文档状态、当前选择、画布规范 | 无参数 |
| `execute` | 增删查改、变量、截图、导出 | `description`、`input` 或 `editId`+`edits` |
| `get_style` | 视觉风格原型，仅参考值 | `name`、`params` |
| `read_skill` | 官方设计文档 | `path` |
| `browser` | 网页转图层、CDP | `action`、`nodeId`、`method`、`params` |

> `.pen` 加密，只能用 MCP 工具访问，禁止 Read/Grep 直接读。

**模式 3**：命令在 `$ZEE_RP_HOME` 下执行：

```bash
node scripts/proto.mjs check --spec /abs/design.rp1.json
node scripts/proto.mjs generate --spec /abs/design.rp1.json --out-dir /abs/outputs --out-rp /abs/design.rp
node bin/axure.mjs rp-read /abs/design.rp --json
```

工具清单与黄金规则见 [axure-mode.md](adapters/axure/references/axure-mode.md)。

**模式 4**：先读后写，写前加载 `figma-use`：

```text
whoami()
get_variable_defs({ file_key })
get_libraries({ file_key })
get_design_context({ file_key, node_id })
use_figma({ file_key, ... })
get_screenshot({ file_key, node_id })
```

工具名与参数以当前 MCP schema 为准；完整清单与席位规则见 [figma-mcp.md](adapters/figma/references/figma-mcp.md)。

---

## 3. 完整设计流程

```
[Step 0 PRD.md] → [Step 1 标准控件库] → [Step 2 设计规范] → [Step 3 产出形态 + 工具 + 首次样式]
  → ({模式1/3/4} Step 4 环境校验) → Step 5 页面设计
  → Step 6 组件库（.pen / HTML / Axure / Figma） → {模式1/4: 可选} Step 7 Context 补录
  → Step 8 可交互原型（.pen / HTML / 可选 .rp / Figma + HTML）
```

| 步骤 | 模式 1（.pen） | 模式 2（仅 HTML） | 模式 3（Axure） | 模式 4（Figma） | 说明 |
|---|---|---|---|---|---|
| 0. PRD.md 检查 | 强制 | 强制 | 强制 | 强制 | 本文件 §0.5.1 |
| 1. 标准控件库检查 | 强制 | 强制 | 强制（Axure 载体） | 强制（Figma library） | 本文件 §0.5.2 |
| 2. 设计规范检查 | 强制 | 强制（HTML 载体） | 强制（`theme` / `variables` / 十六进制） | 强制（Figma 变量） | 本文件 §0.5.3 |
| 3. 产出形态 / 工具选择 | 强制 | 强制 | 强制 | 强制 | 本文件 §0.5.4 / §0.5.5 / §0.5.6 |
| 4. 环境校验 | 强制 | **跳过** | 强制（zee-rp / Python / 空白模板） | 强制（MCP + 席位） | 本文件 §1 / §1.1 / §1.2 |
| 5. 页面设计 | CLI Agent / MCP `execute` | 直接编写 HTML 页面 | RP/1 源码 → `proto.mjs`；已有 `.rp` 用 writer/MCP | `create_new_file` / `use_figma` | 本文件 §2 / §4.5 / §5.5 / §5.6 |
| 6. 组件库管理 | 可选（按需提取） | **必须**（HTML 组件库） | 必须（`masters` / `.rplib`） | 必须（Figma 组件） | [config-management.md](references/config-management.md) |
| 7. Context 补录 | 可选 | 写作时内联，仅需校验 | RP/1 `on` 原生交互，通常不需要 | Figma 侧不写，HTML 生成时转 `data-context` | [context-templates.md](references/context-templates.md) |
| 8. 可交互原型 | 可选 | 默认执行 | 可选（`.rp` 为主交付） | 可选（Figma 为主交付） | [prototype-generation.md](references/prototype-generation.md) |

**模式 5（墨刀）**：环境校验 = 墨刀 MCP 挂载 + 权益检查；页面设计 = 意图翻译 query 异步生成；其余环节（PRD / 控件库 / 规范 / 组件库）与模式 2 相同，HTML 交公共核心按 `shellVariant` 组装。详见 [adapters/modao/SKILL.md](adapters/modao/SKILL.md)。

**策略：CLI 优先，MCP 兜底。** 模式 1 先用 CLI Agent 模式产出整体，结果不理想或需精确控制时再切 MCP。模式 2 直接编写 HTML。模式 3 先用 RP/1 `check` + `generate` 出整体，已有工程再用 writer / MCP 会话链精修。模式 4 先读设计系统与文件，写前加载 `figma-use`，席位不足只读降级。**不要用 pen.dev 工具处理 `.rp` / Figma 文件，也不要用 zee-rp 工具处理 `.pen`。**

---

## 4. 步骤 0-2：PRD、控件库与设计规范

§0.5 已完成检测与提问；本节只规定通过后的落地规则。

- **PRD**：提取项目概述、功能模块、数据字段、业务流程；缺失按 §0.5.1 处理。
- **控件库**：命中则强制复用并按现有命名/分类登记，禁止重复造组件；未命中按 §7 建默认库并标注「默认值待确认」。
- **设计规范**：合并顺序 `design.md` → `tokens.json` / `variables.css` → `UI Design.*`；冲突列冲突表请用户确认，未确认以令牌文件为准并标 `⚠️ 待确认`。
- **落地**：模式 1 写 `.pen` 变量；模式 2 写 `UI Design.html` 的 `:root`；模式 3 映射 `theme` / `variables` / `#RRGGBB`；模式 4 读取 `get_variable_defs`，复用 Figma 已发布变量与组件。
- 组件命名见 [component-naming.md](references/component-naming.md)；同步规则见 [config-management.md](references/config-management.md)。

---

## 4.5 模式 2：仅 HTML 页面设计

不调用 pen CLI/MCP，按页面逐个编写语义化 HTML，落到 `design-pages.html`（页面片段集合，供 §9 组装）：

- 每个页面一个容器：`<section class="page" data-page="页面名称" data-route="/path">`
- 交互节点必须内联 `data-context`（单引号包裹的 JSON）：
  `<button class="btn btn-primary" data-context='{"trigger":"click","action":"submit","loading":true}'>保存</button>`
- 优先复用 `component-library.html` 中的组件片段（复制结构与类名），不引入外部依赖
- 样式统一来自「项目令牌区」CSS 变量（由 design.md / tokens.json / variables.css 合并生成；无规范用中性默认）+ 组件库内联 CSS；页面内不写死颜色/字号
- 外壳变体 `shellVariant` 确定后，页面按对应外壳的结构约定编写（见 §9 与 [prototype-styles.md](references/prototype-styles.md)）；页面数据契约不变
- 页面跳转、弹窗、Toast、Loading 等交互按 `data-context` 与 [prototype-generation.md](references/prototype-generation.md) 实现
- context 写作时即内联，无需 §7 的二次补录，仅需自检完整性

> 页面结构、组件库格式与自检清单见 [html-only-mode.md](references/html-only-mode.md)。

---

## 5. 步骤 5：.pen 页面设计（execute 核心规则）

模式 1 的完整操作、硬性禁令、标准骨架与验证由 [adapters/pen/SKILL.md](adapters/pen/SKILL.md) 定义；API 见 [execute-api.md](adapters/pen/references/execute-api.md)，schema 见 [pen-schema.md](adapters/pen/references/pen-schema.md)。

**必须记住**：`.pen` 加密，禁止 Read/Grep；禁止自行设 id、编造图片 URL、用 CSS 思维建模；每次 `execute` 传 `description`；失败用 `edits` + `editId` 修补；结构校验与截图验收分开。

---

## 5.5 模式 3：Axure 页面设计（RP/1 + zee-rp）

模式 3 不使用 pen.dev。RP/1 是唯一事实来源，zee-rp 编译为原生 `.rp`；已有 `.rp` 先读后改，输出新文件。执行顺序与验收标准由 [adapters/axure/SKILL.md](adapters/axure/SKILL.md) 定义，完整 RP/1 骨架、命令、多版本与 CLI/GUI 边界见 [axure-mode.md](adapters/axure/references/axure-mode.md)。

**默认 CLI 模式**：生成、读取、修改、结构校验全部走文件命令，不启动 Axure、不发 System Events / CGEvent、不写剪贴板、不抢焦点。只有用户逐项目明确要求原生验收时，才进入 `gui-acceptance` 模式。

**必须记住**：`check` 未过不得 `generate`；结构三零不等于预览通过；生成/修改后追加 `version-lint --version 9|11`；RP/1 只能产出 RP9，RP11 走模板 + `--version 11` 或升级副本；Axure 11 只开验证副本；未完成原生验收时标注「结构已验证，Axure 预览待验收」。版本差异见 [version-matrix.md](adapters/axure/references/version-matrix.md)。

---

## 5.6 模式 4：Figma 页面设计（Remote MCP）

模式 4 使用 Figma 云端文件，不是本地 `.pen` / `.rp`。先 `whoami()` 判断席位：Full / Dev 可写，View / Collab 自动只读降级。写前必须加载 `figma-use`，再调用 `use_figma`；创建新文件用 `create_new_file`，已有文件从 URL 解析 `file_key`。

**必须记住**：没有 `file_key` 不得假设；只读席位不得声称写入；`get_design_context` 默认 React + Tailwind 仅作结构参考；`get_screenshot` 只证明视觉，不证明交互；不伪造本地 `.fig` 路径，不静默改用其他工具。完整规则见 [adapters/figma/SKILL.md](adapters/figma/SKILL.md)、[figma-mcp.md](adapters/figma/references/figma-mcp.md)。

---

## 5.7 模式 5：墨刀页面设计（生成型 MCP）

模式 5 不使用 pen.dev / zee-rp / Figma。墨刀 MCP 是墨刀官方的**生成型 AI 服务**：自然语言 `query` → 异步生成单文件 HTML + 云端预览链接，**无节点级编辑与回读**。接入方式、工具签名、query 翻译模板与验收层级由 [adapters/modao/SKILL.md](adapters/modao/SKILL.md) 定义。

**必须记住**：调用生成前先 `get_account_status` 确认权益；`generate_*` 为异步，必须 `get_task_result` 轮询到 `completed`；改设计一律 `continue_task`，禁止重开新任务；界面文案需简体中文时在 `query` 中声明；产物无节点树，节点级精修回 Pen / Figma；生成存在不确定性，交付说明标注「墨刀生成，可能需 continue_task 迭代」。

---

## 6. browser：真实网页 → 可编辑设计

桌面端专属（需 Pen.app）。先 `load-page`，再按需 `import-to-canvas` / `return-element` / `return-screenshot`；`target` 优先 `query` / `selection`，避免 `full-page` 撑爆上下文。CDP 仅开放 `DOM` / `Input` / `Page` / `Runtime` / `Emulation` / `CSS` / `Accessibility`，且不要发 `Escape`。导入后是普通画布节点，用 `execute` 编辑，不要按 HTML/CSS 思维处理。

```text
browser({ action:"load-page", url:"https://example.com" })
browser({ action:"import-to-canvas", target:"query", querySelector:"header.hero" })
browser({ action:"return-element", target:"query", querySelector:".pricing-card" })
browser({ action:"cdp", method:"Runtime.evaluate", params:{expression:"document.title",returnByValue:true} })
```

完整参数见 [mcp-tools.md](adapters/pen/references/mcp-tools.md)。

---

## 7. 步骤 6：组件库管理（四种模式都必须执行）

§0.5.2 已定位控件库。强制复用已有组件、按令牌取值；缺失才新建并登记，不得重复造组件。可复用性满足 3 条以上（多页面通用 / 独立完整 / 可参数定制 / 结构完整）标 `reusable: true`。

| 模式 | 操作 |
|---|---|
| 1 `.pen` | 打开 `控件库.pen` 等；`Insert` 设 `reusable:true` 并按规范命名；写 `components.json`、更新 `lastUpdated`；按需双向同步 |
| 2 HTML | 读 `components.json` 的 `source:"html"`；按 `categories[].prefix` 过滤，按 `snippetId` 找 `<template data-component>`；缺失按 [component-naming.md](references/component-naming.md) 新建并注册 |
| 3 Axure | RP/1 `components`（编译期展开）或 `masters`（仅基础元件）；原生 `.rplib` 用 `clone-library-widget`；在 `components.json` 增量登记并新增 `axureLibraryFile` / `axureMasterFile` |
| 4 Figma | 用 `get_libraries` / `search_design_system` / `get_library_items` 查已发布组件；优先实例化而非重画；在 `components.json` 登记 `source:"figma"`、`figmaFileKey`、`componentKey` / `nodeId` |

- 查已有 `.pen` 组件：`Get(n => n.reusable && Print(n.id, n.name))`
- 新增前按名称/分类查重；删除前按 §0.5.0 确认使用次数
- 不得因为不生成 `.pen` 就跳过组件查找或维护

格式与同步见 [axure-mode.md](adapters/axure/references/axure-mode.md)、[config-management.md](references/config-management.md)、[figma-mcp.md](adapters/figma/references/figma-mcp.md)。

---

## 8. 步骤 7：Context 补录（模式 1 可选；模式 3/4 通常不需要）

默认跳过。触发：需要生成可交互原型 / 交付开发 / 用户要求。模式 2 在写作时已内联 `data-context`，本节仅做校验；模式 3 的原生交互已写在 RP/1 `on` 中，通常无需补录，生成 HTML 原型时再转成 `data-context`；模式 4 不在 Figma 节点上写 context，生成 HTML 原型时从 PRD、Figma 原型连线或用户补充信息转成 `data-context`。

`context` 是节点上的元数据（交互行为、数据绑定、导航目标），开发阶段可直接读取。模式 2 的载体是 HTML 节点的 `data-context` 属性，JSON 内容一致。

**识别规则**：名含 `btn-`/`input-`/`select-`/`switch-`/`nav-`/`tab-`/`icon-btn` 及可点击卡片需补录；纯展示元素不需要。

**写入**（替代旧 `batch_design` 的 `U()`）：

```js
Get(pageId, n => /^btn-|^input-|^select-/.test(n.name) && !n.context && Update(n.id, {context:"..."}))
```

**验证清单**：

```
□ btn-* □ input-* □ select-* □ switch-* □ nav-*/tab-* □ icon-btn □ 可点击卡片
```

**发现 PRD 未记录的交互时按 §0.5.0 提问协议确认**："发现以下新增交互未在 PRD.md 中：… 是否更新？[1] 全部写入 [2] 仅指定项 [3] 跳过"

模板与优先级见 [context-templates.md](references/context-templates.md)。

---

## 9. 步骤 8：可交互原型生成

**触发**：模式 1 用户要求时；模式 2 默认执行；模式 3 可选（`.rp` 为主交付）；模式 4 可选（Figma 文件为主交付）。

> `execute` 的 `Export(...,"html-tailwind",...)` 是官方静态 HTML 导出；本步骤生成的是带页面切换、备注、交互模拟的评审原型；外壳由 `shellVariant` 决定（A / B / C 三选一，视觉一律来自项目令牌区）。

**流程**：读取页面与 context（模式 1 `Get`；模式 2 解析 `design-pages.html`；模式 3 `design.rp1.json` 或 `rp-read --json`；模式 4 `get_design_context` / `get_metadata` + PRD）→ 建立交互映射 → 按外壳变体生成单文件 HTML。

按 `shellVariant` 组装评审外壳（详见 [prototype-styles.md](references/prototype-styles.md) §四）：

- `A` 顶部导航版：顶部 `.proto` 页面切换 + `看全部备注` 展开页面级备注（`template[data-page-note]`，当前页高亮）；`.wrap` 居中舞台；无水滴无连线
- `B` 三栏标注评审版：左页面导航（可拖拽分割线）+ 中舞台（需求横幅 + 画布 + 销钉水滴）+ 右说明面板（类型筛选、双向定位）；连线为细实线，**开关只保留右栏右上角**；水滴扁平销钉形、可拖拽、双击复位
- `C` 直出版：头部页面菜单 + 页面直出；右下角「需求说明」浮动面板，卡片头部展开 / 收起、可整体折叠；无水滴无连线

**下游契约**：预览容器保留 `data-page` / `data-route`，交互节点保留 `data-context`；外壳导航 `data-target="<data-page>"`；变体 B / C 标注数据内嵌 `window.PD_ANNOTATIONS`，标注与说明卡共享 `data-annotation-id`；内嵌 `#prototype-manifest`：

```json
{"schemaVersion":"1.0","generator":"prototype-designer","mode":"html-only","style":"project","shell":"A","tokensSource":"design.md+tokens.json+variables.css","pages":[{"name":"登录","route":"/login","selector":"[data-page=\"登录\"]","contextCount":3}],"shared":["top-nav"],"files":{"pages":"design-pages.html","designSpec":"UI Design.html","componentLibrary":"component-library.html","components":"components.json"}}
```

- `mode`：模式 1 为 `pen`（`files.design` 指向 `.pen`）；模式 3 为 `axure`（`files.design` 指向 `.rp`，`files.source` 指向 RP/1）；模式 4 为 `figma`（`files.design` 指向 Figma URL，`files.fileKey` 指向 `file_key`）；模式 5 为 `modao`（`files.design` 指向墨刀预览链接，`files.nativeRef = { provider: "modao", taskId }`）。
- `style` 固定 `"project"`；`tokensSource` 为项目规范合并来源或 `neutral default`；`shell` 为 `"A" | "B" | "C"`。
- `pages[].selector` 必须唯一命中；不新增外部清单，保持单文件自包含。
- 输出：模式 1 `{原文件名}-prototype.html`；模式 2 `design-prototype.html`；模式 3 可选 `design-prototype.html`，与 `.rp` 同目录；模式 4 可选 `design-prototype.html`。

完整实现（水滴 SVG、拖拽、连线、localStorage）见 [prototype-generation.md](references/prototype-generation.md)。

---

## 10. 便签控件

便签用于设计稿注释。类型与配色见 [note-styling.md](references/note-styling.md)。

```js
noteId = Insert(pageId,{type:"note",name:"功能说明",content:"这是便签内容",x:100,y:100,width:300})
```

**注意**：`note` 节点不支持 `fill`，需要背景色时用 frame 包裹。

---

## 11. 批量处理

模式 1 用 `pen --tasks batch.json`，字段 `out` / `prompt` 必填，`in` / `model` / `promptFiles` 可选，任务串行：

```json
{"tasks":[{"out":"login.pen","prompt":"Create a login page"},{"in":"app.pen","out":"app-v2.pen","prompt":"Add a sidebar"}]}
```

模式 3 不走 `pen --tasks`：用 shell 循环 `proto.mjs check/generate`，或逐个 writer / MCP，每项输出新文件。

模式 4 不走 `pen --tasks`：逐个 `create_new_file` / `use_figma`，每个页面或文件单独确认 `file_key`，不覆盖已有 Figma 文件。

---

## 12. 常见错误速查

| 症状 | 原因 / 处理 |
|---|---|
| pen 环境 / 加密 / execute / 组件库问题 | 见 [adapters/pen/SKILL.md](adapters/pen/SKILL.md) 与 [execute-api.md](adapters/pen/references/execute-api.md) |
| Axure 环境 / 模板 / 版本 / GUI / 结构校验问题 | 见 [axure-mode.md](adapters/axure/references/axure-mode.md) §14 常见错误与阻塞 |
| Figma MCP / 席位 / file_key / 写失败 | 见 [figma-mcp.md](adapters/figma/references/figma-mcp.md)；未挂载或只读席位返回 `blocked` / 只读降级，不猜命令 |
| OpenDesign 不可选 / 点名后无法执行 | 见 [adapters/opendesign/SKILL.md](adapters/opendesign/SKILL.md)；`planned` 状态返回 `blocked`，只能回退仅 HTML 或停止 |

---

## 13. 设计最佳实践

1. **优先复用**：先 `Get(n => n.reusable && Print(n.id,n.name))` 查现有组件；CLI 生成时加 `--library 控件库.pen` 载入组件库，再新建
2. **CLI 优先**：整体用 Agent 模式，细节用 `execute`
3. **分 section 推进**：每做完一块立即 `TakeScreenshot` 验证
4. **重复 UI 组件化**：先建 `reusable: true` 组件，再 `ref` 实例化，改一处全量生效
5. **及时保存**：Interactive 模式定期 `save()`
6. **变量驱动**：用 `SetVariables` 定义设计令牌，属性里 `$name` 引用，支持主题轴
7. **结果必展示**：生成完用 Read 读 PNG 给用户看
8. **Axure 先读适配器**：RP/1 `check` 后再 `generate`，已有 `.rp` 先读后改、输出新文件；结构 / 预览 / GUI 往返分层记录，版本与 GUI 确认规则见 [adapters/axure/SKILL.md](adapters/axure/SKILL.md)
9. **验证后清理**：删除临时副本与误生成文件，保留可控的验证证据路径；不要让 `Untitled`、`test.rp` 等临时文件留在用户目录
10. **不静默换工具**：适配器 `blocked` / `partial` 时按 `nextActions` 回退仅 HTML 或停止，不擅自改用 Pen/Axure/Figma

---

## 参考文件

| 文件 | 内容 |
|---|---|
| [adapters/pen/SKILL.md](adapters/pen/SKILL.md) | Pen 适配器：CLI/MCP、硬性禁令、标准骨架、验证、组件与回退 |
| [adapters/pen/references/execute-api.md](adapters/pen/references/execute-api.md) | execute 完整 API、操作详解、失败修补机制 |
| [adapters/pen/references/pen-schema.md](adapters/pen/references/pen-schema.md) | .pen 文件 schema、节点类型、属性速查 |
| [adapters/pen/references/mcp-tools.md](adapters/pen/references/mcp-tools.md) | 五大 MCP 工具完整参数（含 browser / CDP） |
| [references/prototype-generation.md](references/prototype-generation.md) | 可交互原型 HTML 实现（.pen / HTML / Axure / Figma 四来源；按样式选择外壳） |
| [references/prototype-styles.md](references/prototype-styles.md) | HTML 原型外壳变体 A/B/C：首次询问、项目级记忆、项目令牌区与应用规则 |
| [references/html-only-mode.md](references/html-only-mode.md) | 仅 HTML 模式：设计规范、HTML 组件库、页面片段与组装 |
| [adapters/axure/SKILL.md](adapters/axure/SKILL.md) | Axure 适配器：范围、执行顺序、验收层级、失败回退与 GUI 边界 |
| [adapters/axure/references/axure-mode.md](adapters/axure/references/axure-mode.md) | Axure 完整参考：zee-rp 环境、CLI 优先模式、RP/1、原生 `.rp` 读写、截图转布局、MCP 与证据边界 |
| [adapters/axure/references/version-matrix.md](adapters/axure/references/version-matrix.md) | Axure RP9 / RP11 差异与处理：字段表、DOA / FCall / 事件门禁、模板与决策树 |
| [adapters/figma/SKILL.md](adapters/figma/SKILL.md) | Figma 适配器：Remote MCP、席位、file_key、figma-use、验收与回退 |
| [adapters/figma/references/figma-mcp.md](adapters/figma/references/figma-mcp.md) | Figma MCP 完整参考：读写工具、席位降级、组件/变量与错误速查 |
| [adapters/modao/SKILL.md](adapters/modao/SKILL.md) | 墨刀适配器：生成型 MCP、异步任务、continue_task 迭代、权益降级与回退 |
| [adapters/modao/references/modao-mcp.md](adapters/modao/references/modao-mcp.md) | 墨刀 MCP 完整参考：接入方式、工具签名、query 翻译模板与降级原则 |
| [adapters/opendesign/SKILL.md](adapters/opendesign/SKILL.md) | OpenDesign 占位：planned 状态、blocked 返回、调研与启用门槛 |
| [adapters/opendesign/references/research-checklist.md](adapters/opendesign/references/research-checklist.md) | OpenDesign 调研清单与证据要求 |
| [references/context-templates.md](references/context-templates.md) | context 模板与补录流程 |
| [references/config-management.md](references/config-management.md) | components.json 双向同步与校验 |
| [references/design-contract.md](references/design-contract.md) | 适配器契约：`DesignRequest` / `DesignResult`、`adapter.json`、验收层级与 `adapters.json` 索引 |
| [references/component-naming.md](references/component-naming.md) | 组件命名规范 |
| [references/note-styling.md](references/note-styling.md) | 便签类型与配色 |

**原型 HTML 模板**：[assets/prototypes/main-prototype.html](assets/prototypes/main-prototype.html)
**外壳变体预览**：[shell-a-topnav.html](assets/prototypes/shell-a-topnav.html)｜[shell-b-three-column.html](assets/prototypes/shell-b-three-column.html)｜[shell-c-direct.html](assets/prototypes/shell-c-direct.html)（遗留：[style-editorial-ink.html](assets/prototypes/style-editorial-ink.html)）

---

## 版本信息

- **Skill**: 5.6.0
- **对齐**: pen.dev CLI 0.3.12 / Pen.app 1.2.5+ / zee-rp 0.2.0（RP9/RP11）/ Figma Remote MCP / 墨刀生成型 MCP
- **更新**: 2026-10-27
- **v5.6.0**: 新增客户端能力探测：无本地 shell / 持久文件系统 / 原生 MCP（如 ChatGPT 网页版与临时沙箱）时自动降级为「仅 HTML」模式；接受用户粘贴的 PRD / 设计规范，只输出单文件自包含 HTML，不写 `components.json`、不尝试 Pen/Axure/Figma/墨刀、不引导 `skillhub login`
- **v5.5.0**: Axure 适配器新增执行模式：默认 `cli`（纯文件，不启动 Axure、不发 System Events / CGEvent、不写剪贴板、不抢焦点）；`gui-acceptance` 需逐项目显式授权；新增 RP9/RP11 [版本差异矩阵](adapters/axure/references/version-matrix.md)；preflight 支持 `--mode cli|gui`；生成/修改后追加 `version-lint`
- **v5.4.0**: 新增模式 5（墨刀 Modao）：官方生成型 MCP 适配器 `adapters/modao/`；意图翻译 query → `generate_html` 异步生成 → `get_task_result` 轮询 → `continue_task` 迭代；产出交公共核心按 `shellVariant` 组装；manifest 新增 mode `modao`
- **v5.3.0**: HTML 原型外壳与视觉解耦：新增外壳变体 A 顶部导航 / B 三栏标注评审 / C 直出，首次询问 `shellVariant` 并写入 `.prototype-designer.json`，后续默认沿用直到用户明确更换；配色 / 字体改由「项目令牌区」按项目前端与 UI 规范注入（中性默认兜底），移除明暗切换；editorial-ink 预设降级为遗留资产；Axure 子技能新增「第三方工具风险告知」前置闸口（zee-rp 非 Axure 官方），接管 GUI 前通知用户明确画入子流程
- **v5.2.0**: 新增 HTML 原型视觉样式：首次生成询问并在 `.prototype-designer.json` 记住选择；新增「纸墨编辑风 editorial-ink」双主题预设、预览与令牌 CSS
- **v5.1.0**: 新增 Figma 子技能（`adapters/figma/`）；支持 Remote MCP、席位探测与只读降级、`file_key` 管理、`figma-use` 写前加载、组件/变量复用与 HTML 交接
- **v5.0.0**: 完成编排层 + 适配器架构；T8 只决定原生/仅 HTML，具体工具由本 Skill 询问；`adapter` 可留空；OpenDesign 固定为 planned 占位并返回 blocked
- **v4.5.1**: 抽象跨客户端提问协议；新增不可逆操作与交付前检查点；精简主文件（853 → 约 500 行），细节下沉 references 与 adapters；适配器契约、Axure 与 Pen 迁移完成。v5.0.0 因拆分「产出形态 / 工具选择」增至 530+ 行
- **v4.5.0**: 新增模式 3（Axure，zee-rp）；支持 RP/1 `check/generate`、已有 `.rp` 读写、截图转布局、母版/`.rplib` 复用与结构三零校验；新增 Axure 参考与环境检测（现位于 `adapters/axure/`）
- **v4.4.0**: 原型结构化交付契约（`data-page` / `data-route` / `data-context` / `#prototype-manifest`）
- **v4.3.0**: 对齐 pen.dev CLI 0.3.12（5 个 MCP 工具，`execute` 增加 `description`，新增 `browser` / `read_skill` / `get_style`）
