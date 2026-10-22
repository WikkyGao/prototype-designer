# HTML 原型外壳变体与项目令牌

> 适用于所有会生成 `design-prototype.html` 的模式（Pen / HTML-only / Axure / Figma）。
> v5.3 起：**外壳结构与视觉解耦**——外壳只定义「页面怎么切换、说明放哪里、标注怎么连」；配色 / 字体 / 圆角一律由「项目令牌区」按具体项目的前端与 UI 规范注入，不绑定预设、无明暗切换。`editorial-ink` 预设降级为遗留资产（见 §七）。

---

## 一、外壳变体目录

| ID | 名称 | 结构与标注 | 适用场景 | 预览 |
|---|---|---|---|---|
| `A` | 顶部导航版 | 顶部页面切换 + 页面级备注（「看全部备注」展开 / 收起，当前页高亮）；无水滴、无连线 | 页面少、说明按页讲，最轻结构 | [shell-a-topnav.html](../assets/prototypes/shell-a-topnav.html) |
| `B` | 三栏标注评审版 | 左页面导航 / 中舞台 / 右说明面板；销钉水滴锚点 + SVG 连线（开关仅在右栏右上角）、类型筛选、双向定位、水滴可拖拽 | 逐节点评审已确认决策 | [shell-b-three-column.html](../assets/prototypes/shell-b-three-column.html) |
| `C` | 直出版 | 头部页面菜单 + 页面直出；右下角「需求说明」浮动面板，卡片头部展开 / 收起，可整体折叠；无水滴、无连线 | 演示与走查，页面即全屏 | [shell-c-direct.html](../assets/prototypes/shell-c-direct.html) |

新增外壳变体时必须同时补齐：变体 ID、说明、预览文件、本文件应用规则、`SKILL.md` §0.5.5 话术与 `test-prompts.json` 用例。

---

## 二、配置与记忆（`.prototype-designer.json`）

### 2.1 配置结构

```json
{
  "schemaVersion": "1.0",
  "shellVariant": "A",
  "tokensSource": "design.md+tokens.json+variables.css",
  "styleConfirmedAt": "2026-10-23T10:00:00+08:00",
  "updatedAt": "2026-10-23T10:00:00+08:00"
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `schemaVersion` | 是 | 固定 `"1.0"` |
| `shellVariant` | 是 | `"A"` / `"B"` / `"C"` |
| `tokensSource` | 否 | 令牌来源说明（规范文件列表或 `neutral default`） |
| `styleConfirmedAt` | 是 | 用户首次确认外壳的时间 |
| `updatedAt` | 是 | 最近一次更新时间 |

兼容说明：v5.2 的 `prototypeStyle`（project / editorial-ink）不再使用。读到旧配置时：`project` → 写入 `shellVariant: "A"`；`editorial-ink` → 提示用户视觉预设已下线，按 §2.2 重新询问外壳并写 `shellVariant`，视觉统一改用项目令牌。

项目根判定顺序：

1. 从输出目录向上找到最近的 `.git` 或 `PRD.md` 所在目录
2. 找不到时使用当前工作目录
3. 输出目录本身已有 `.prototype-designer.json` 时优先使用

配置损坏 / JSON 无法解析 / `shellVariant` 非法时：不覆盖原文件 → 说明问题 → 按 §2.2 重新询问 → 用户确认后写回，保留无法识别的其他字段。

### 2.2 首次生成流程（在产出形式确认后、页面设计前执行）

1. 从项目根读取 `.prototype-designer.json`
2. 找到合法 `shellVariant` → 直接沿用，不再询问；交付说明写「本次沿用外壳：{A/B/C}」
3. 无值 → 按 §0.5.0 提问协议询问一次，推荐项放第一
4. 用户确认 → 写入配置
5. 用户明确说「只这次用 X」→ 本次使用 X，不写配置
6. 用户拒绝选择 → 停止，不生成 HTML
7. 用户说「换外壳 / 用 X 方案」→ 重新确认并更新配置；**换外壳仅重组装评审壳，页面内容、`data-*` 契约与 manifest 数据不变**

提问话术（推荐规则：需逐节点评审 → 推荐 B；页面少说明按页 → 推荐 A；演示走查 → 推荐 C）：

```text
本次可交互 HTML 原型使用哪种外壳方案？
1. A 顶部导航版 — 顶部页面切换 + 页面级备注，最轻
2. B 三栏标注评审版 — 水滴 + 连线逐节点标注
3. C 直出版 — 页面直出 + 右下角说明面板
（确认后默认沿用；说「换外壳 / 用 X 方案」随时更换）
```

### 2.3 后续与切换

- 已有配置时不重复询问，交付说明写一句「本次沿用外壳：{名称}」
- 用户直接指定「用 A / B / C」视为确认，写入配置
- 原生文件（.pen / .rp / Figma）不需要该配置；仅在生成 HTML 原型时读取

---

## 三、项目令牌区（PROJECT TOKENS）

外壳与页面样式**不写死任何颜色、字体、圆角、阴影**，全部引用令牌变量。

### 3.1 令牌来源与合并

合并顺序：`design.md` → `tokens.json` / `variables.css` → `UI Design.*`（多来源可合并；同一令牌多来源不一致时生成冲突表交用户确认，未确认以令牌文件为准并标 `⚠️ 待确认`）。

全部命中失败时使用中性默认值，并标注「默认值待确认」。中性默认参考（与三外壳预览一致）：

| 令牌 | 中性默认 | 用途 |
|---|---|---|
| `--font-sans` | system-ui, -apple-system, PingFang SC, … | 正文 / 控件 |
| `--font-meta` | ui-monospace, SF Mono, Consolas | 编号 / 元信息 |
| `--bg` / `--surface` / `--surface-2` | `#F3F4F6` / `#FFFFFF` / `#F7F8FA` | 底色 / 卡片 / 次级面 |
| `--border` / `--border-strong` | `#E4E7EC` / `#CBD2DC` | 边框 |
| `--text` / `--text-2` / `--text-3` | `#1F2429` / `#5C6470` / `#9096A0` | 文字层级 |
| `--acc` / `--acc-hover` / `--acc-soft` | `#3B6EF0` / `#2E5BD7` / rgba(59,110,240,.12) | 主操作 / 选中 |
| `--annot` | `#E8833A` | 标注强调（水滴 / 连线 / 高亮） |
| `--ok` / `--warn` / `--bad` | `#2E9E62` / `#D98A1F` / `#D64545` | 语义色 |
| `--t-feature` / `--t-field` / `--t-interact` / `--t-warning` | 蓝 / 绿 / 紫 / 琥珀 | 说明类型色 |
| `--r-xs` / `--r-sm` / `--r-md` | 6 / 10 / 14px | 圆角 |

### 3.2 注入方式

- 最终 `design-prototype.html` 顶部保留独立的「项目令牌区」`<style>` 块（`:root { … }`），由 §3.1 合并结果生成；换项目只改这一段
- **无明暗主题、无主题切换按钮**；不读取 localStorage 主题键
- 外壳 CSS、页面 CSS、组件 CSS 只引用变量；发现写死颜色视为自检不通过

---

## 四、各外壳应用规则

### 4.1 变体 A · 顶部导航版

- 顶栏 `.proto`：`PROTOTYPE` 标签 + `.pnav` 页面按钮（`data-target="<data-page>"`，点击更新 `.on` / `aria-current` 并切换 `section.page`）+ 「看全部备注」按钮
- 备注面板在顶栏下方展开，不覆盖页面内容；每页说明来自 `<template data-page-note>`，当前页对应项高亮；按钮文案「看全部备注 ⇄ 收起备注」
- `.wrap` 居中舞台（max-width 880–1120px）；页面切换不刷新、回到页顶
- 无水滴、无连线、无页面内标注元素

### 4.2 变体 B · 三栏标注评审版

- 三栏 grid：左导航（品牌 + 页面列表 + 外壳版本号；可拖拽分割线）｜中舞台（stagebar：LIVE 徽标 + 面包屑 + 水滴显隐 / 位置复位 + 顶部需求横幅 + 画布）｜右说明面板
- **连线开关只保留右栏右上角**一个；左栏不放假开关
- 销钉水滴（扁平无渐变无阴影）：圆头 + 内收锥尾，`viewBox="0 0 28 36"`，`fill: var(--annot)`、`stroke: var(--surface)` 1.4px；白色等宽编号居中于圆头；悬停显示标题标签；可拖拽（localStorage 记忆）、双击复位
- 连线：细实线 `stroke: var(--annot)`（透明度 .35），激活加粗；说明卡左缘 `note-port` 为连线端点
- 说明面板：类型筛选（全部 / 功能 / 交互 / 字段 / 注意）+ 卡片列表（编号 + 类型徽标 + 标题 + 摘要三行截断，再点展开全文）；点击卡片 / 水滴双向定位；目标不在当前页时卡片呈 `is-offscreen` 弱化并提示「当前页未出现」
- 页面元素用 `data-annot="<id>"` 标注锚点，与 `PD_ANNOTATIONS[].target` 对应

### 4.3 变体 C · 直出版

- 顶栏：品牌 + `.pnav` 页面菜单（含各页说明数）；无标注开关
- 需求横幅（reqbar）置于顶栏下；页面以 880–1080px 居中直出
- 右下角 `.notes-float`：头部（「需求说明 · {当前页}」+ 条数 + 折叠箭头，点头部整体折叠）+ 操作行（「全部收起 ⇄ 全部展开」）+ 卡片列表
- 卡片：头部 = 编号 + 类型徽标 + 标题 + 折叠箭头，**点击头部展开 / 收起正文**；说明数据来自 `PD_ANNOTATIONS`（无 target 也可，仅作面板条目）
- 无水滴、无连线、无 `data-annot` 锚点需求

---

## 五、交付契约

- `data-page` / `data-route` / `data-context` 契约不变；外壳导航 `data-target="<data-page>"`
- 变体 B / C 的标注数据内嵌 `window.PD_ANNOTATIONS`（id / page / target（B）/ type / title / body）；标注与说明卡共享 `data-annotation-id`
- `#prototype-manifest`：

```json
{
  "schemaVersion": "1.0",
  "generator": "prototype-designer",
  "mode": "html-only",
  "style": "project",
  "shell": "A",
  "tokensSource": "design.md+tokens.json+variables.css",
  "pages": []
}
```

- `style` 固定 `"project"`（令牌来自项目规范合并或中性默认）；`shell` 为 `"A" | "B" | "C"`；下游可忽略新增字段，不得因新增字段改变解析流程

---

## 六、自检清单

```text
□ 首次生成已按 §2.2 询问外壳；已有合法 shellVariant 未重复询问
□ .prototype-designer.json 可解析，shellVariant ∈ A/B/C
□ 项目令牌区存在且由规范合并生成；无规范时标注「默认值待确认」
□ 外壳 / 页面 / 组件无写死颜色字体，全部引用令牌变量
□ 无明暗切换、无主题按钮、不读写主题 localStorage
□ 外壳交互可用：A 备注展开 / B 水滴连线与筛选（开关仅右栏右上角）/ C 卡片头部展开收起
□ 变体 B/C 的 PD_ANNOTATIONS 与页面锚点一一对应（C 允许无锚点）
□ #prototype-manifest 含 style="project" 与 shell 字段
□ 截图检查通过；控制台无报错
□ 交付说明写明本次沿用外壳与令牌来源
```

---

## 七、遗留：editorial-ink 预设（已下线）

v5.2 的 `editorial-ink` 纸墨预设自 v5.3 起**不再作为可选项询问**，其视觉（暖黑 / 米白双主题、宋体标题）与新「项目令牌」模型冲突。处理规则：

- [style-editorial-ink.html](../assets/prototypes/style-editorial-ink.html) 与 [styles/editorial-ink.css](../assets/prototypes/styles/editorial-ink.css) 保留为历史资产，不再被流程引用
- 旧配置 `prototypeStyle: "project"` → 迁移为 `shellVariant: "A"`；`prototypeStyle: "editorial-ink"` → 按 §2.2 重新询问外壳，视觉改用项目令牌
- 用户点名要「纸墨风」时：说明预设已下线，可将其令牌（宋体标题 / 暖黑米白）作为该项目令牌区的取值注入，外壳仍按 A / B / C 之一组装
