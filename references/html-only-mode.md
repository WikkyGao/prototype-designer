# 仅 HTML 模式 — 参考手册

> 本文档是 prototype-designer SKILL.md 中「模式 2：仅可交互 HTML 原型」的完整实现参考。
> 进入模式 2 前，必须已完成 §0.5 前置检查：PRD.md → 标准控件库 → 设计规范文档 → 产出形式确认。
> 核心原则：**只跳过 pen CLI/MCP 环境校验与 `.pen` 产物，不跳过 PRD 检查、控件库检查、设计规范检查与组件库管理。**

---

## 一、适用场景

- 用户只需要可交互 HTML 原型，不打算在 pen.dev 中继续编辑图层
- 当前环境未安装 pen.dev CLI、未登录，或无法使用 MCP
- 需求验证、演示、快速评审优先于设计稿资产沉淀

不适用：需要交付 `.pen` 设计稿、需要设计稿与开发团队双向协作、需要 pen.dev 图层级精细控制。

---

## 二、产物清单

| 文件 | 作用 | 是否必需 |
|------|------|----------|
| `UI Design.html` | 设计规范（色彩、字体、间距、圆角、阴影的 CSS 变量与示例） | 是 |
| `component-library.html` | HTML 组件库（可复用片段 + 可视化预览） | 是 |
| `components.json` | 组件注册表（HTML 条目带 `source: "html"`） | 是 |
| `design-pages.html` | 原型页面片段集合（每页带 `data-page` / `data-route`，交互节点带 `data-context`） | 是 |
| `design-prototype.html` | 最终单文件可交互原型（评审外壳 + 所有页面 + 内嵌 `#prototype-manifest`） | 是 |
| `.prototype-designer.json` | 项目级样式记忆（`project` / `editorial-ink`） | 首次选择后 |

所有文件放在同一目录；`design-prototype.html` 必须单文件自包含（内联 CSS/JS，不依赖外部资源）。

---

## 二·一、样式选择

在产出形式确认后、页面设计前读取项目根 `.prototype-designer.json`：

- 已有 `prototypeStyle` → 直接沿用，不再询问
- 无值 → 询问「项目规范 project / 纸墨编辑风 editorial-ink」，确认后写入
- 用户说「换样式」→ 重新询问并更新
- `editorial-ink` 使用顶部导航外壳、双主题与「看全部备注」，不使用三栏

完整选择流程、配置结构与令牌见 [prototype-styles.md](prototype-styles.md)。

---

## 三、设计规范：UI Design.html

### 规范来源（生成前必查）

按 SKILL.md §0.5.3 收集并合并，存在多个来源时要全部使用：

| 来源 | 提取内容 |
|------|----------|
| `design.md` / `DESIGN.md` / `design-system.md` | 设计原则、组件规则、禁用项 |
| `tokens.json` / `design-tokens.json` / `theme.json` | 令牌值（支持 W3C `$value` 格式） |
| `variables.css` / `design-tokens.css` / `theme.css` | `:root` CSS 变量 |
| `UI Design.pen` | 已有视觉规范（需 pen 环境读取） |

- 合并顺序：**规则 → 令牌 → 示例**；同一令牌多来源冲突时列出冲突表请用户确认
- 生成/更新 `UI Design.html` 时，令牌必须来自上述来源，不另行编造
- 无任何来源时使用默认值并标注「默认值待确认」

### 结构要求

1. 顶部为设计令牌展示区：色板、字号阶梯、间距刻度、圆角、阴影
2. `:root` 内定义全部 CSS 变量，供组件库与页面统一引用
3. 提供 1 个最小示例区块，演示变量如何被组件使用

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>UI Design</title>
  <style>
    :root {
      --color-primary: #1890ff;
      --color-primary-hover: #40a9ff;
      --color-text: #1f2329;
      --color-text-secondary: #646a73;
      --color-border: #dee0e3;
      --color-bg: #ffffff;
      --color-bg-subtle: #f5f6f7;
      --color-success: #52c41a;
      --color-warning: #faad14;
      --color-danger: #ff4d4f;

      --font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
      --font-size-xs: 12px;
      --font-size-sm: 13px;
      --font-size-base: 14px;
      --font-size-lg: 16px;
      --font-size-xl: 20px;

      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 24px;
      --space-6: 32px;

      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, .06);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, .1);
    }
  </style>
</head>
<body>
  <h1>设计规范</h1>
  <section class="spec-colors"><!-- 色板 --></section>
  <section class="spec-type"><!-- 字号 --></section>
  <section class="spec-spacing"><!-- 间距 --></section>
</body>
</html>
```

### 规则

- 页面与组件中禁止写死颜色、字号、间距，必须引用变量
- 若已存在 `UI Design.pen` 且无 pen 环境：先尝试从用户处获取其品牌色/字体；无法获取时按 PRD 生成默认规范并标注「默认值待确认」
- 变量命名保持稳定，后续迭代只扩展不重命名
- `editorial-ink` 时直接使用 [editorial-ink.css](../assets/prototypes/styles/editorial-ink.css) 的令牌，并同时展示 `data-theme="dark"` 与 `data-theme="light"` 两套值
- `editorial-ink` 的评审外壳是顶部页面切换 + 居中舞台 + 可展开备注，不是三栏；结构见 [prototype-styles.md](prototype-styles.md) §4.3

---

## 四、HTML 组件库：component-library.html

### 文件结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>组件库</title>
  <link rel="stylesheet" href="UI Design.html"><!-- 仅预览用；构建原型时变量需内联 -->
  <style>/* 组件样式，全部基于 UI Design.html 的变量 */</style>
</head>
<body>
  <h1>组件库</h1>
  <section data-preview="basic"><!-- 组件的可视化预览 --></section>

  <template data-component="btn-primary" data-category="basic">
    <button class="btn btn-primary"
      data-context='{"trigger":"click","action":"submit","loading":true,"onSuccess":"toast:操作成功","onError":"toast:操作失败"}'>
      保存
    </button>
  </template>

  <template data-component="input-search" data-category="form">
    <label class="input-search">
      <span class="input-search__icon" aria-hidden="true"></span>
      <input type="search" placeholder="搜索" data-context='{"trigger":"input","action":"filter","debounce":300}'>
    </label>
  </template>
</body>
</html>
```

### 规则

- 每个组件一个 `<template data-component="{name}" data-category="{category}">`
- 组件名遵循 [component-naming.md](component-naming.md)：`btn-` / `input-` / `select-` / `switch-` / `nav-` / `tab-` / `card-` / `table-` 等前缀
- 组件内的交互节点必须内联 `data-context`
- 组件不得依赖外部 CSS/JS 文件；样式类名用组件名前缀，避免污染页面
- 预览区与 `<template>` 内容保持同步，便于人工核对
- 新增/修改组件后同步更新预览与 `components.json`

### components.json 扩展字段

```json
{
  "version": "1.2.0",
  "libraryFile": "控件库.pen",
  "htmlLibraryFile": "component-library.html",
  "lastUpdated": "2026-10-22T00:00:00Z",
  "categories": [
    { "id": "basic", "name": "基础", "prefix": "btn-", "description": "基础交互组件" }
  ],
  "components": [
    {
      "id": "btn-primary-20261022",
      "name": "btn-primary",
      "category": "basic",
      "source": "html",
      "snippetId": "btn-primary",
      "className": "btn btn-primary",
      "dependencies": ["--color-primary", "--radius-sm"],
      "description": "主要操作按钮，提交时显示 loading",
      "createdAt": "2026-10-22T00:00:00Z",
      "usageCount": 0,
      "tags": ["button", "primary", "submit"]
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `htmlLibraryFile` | HTML 组件库文件路径（与 `libraryFile` 并存） |
| `components[].source` | `"pen"` 或 `"html"`；缺省视为 `"pen"` |
| `components[].snippetId` | HTML 组件对应的 `<template data-component>` 值 |
| `components[].className` | 复用时需要带上的类名 |
| `components[].dependencies` | 依赖的 CSS 变量，便于校验设计规范是否齐全 |

### 查找与复用流程

1. 读取 `components.json`，筛出 `source === "html"` 的条目
2. 按 `categories[].prefix` 缩小范围
3. 到 `component-library.html` 中按 `data-component="{snippetId}"` 定位 `<template>`
4. 复制模板结构 + `className` 到页面；按需替换文案与数据
5. `usageCount += 1`，更新 `lastUpdated`
6. 未命中 → 新建组件：先写入组件库并注册，再在页面中使用（禁止先写死再补登记）

### 校验

- `components.json` 可解析，`htmlLibraryFile` 存在
- 每个 `source: "html"` 条目能在库中找到对应 `<template>`
- 每个 `<template>` 中的交互节点都有 `data-context`
- 组件引用的 CSS 变量都能在 `UI Design.html` 的 `:root` 中找到
- 发现差异时展示报告并让用户选择以配置为准 / 以库为准 / 手动合并

---

## 五、页面片段：design-pages.html

### 结构约定

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>页面片段</title></head>
<body>
  <section class="page" data-page="用户列表" data-route="/users">
    <header class="page__header">
      <h2>用户列表</h2>
      <button class="btn btn-primary"
        data-context='{"trigger":"click","action":"navigate","target":"用户新建"}'>新建用户</button>
    </header>

    <input class="input-search" type="search" placeholder="搜索用户"
      data-context='{"trigger":"input","action":"filter","debounce":300}'>

    <table class="table-data">
      <tr class="table-row" data-context='{"trigger":"click","action":"navigate","target":"用户详情"}'>
        <td>张三</td><td>管理员</td>
      </tr>
    </table>
  </section>

  <section class="page" data-page="用户新建" data-route="/users/new">
    <!-- 表单页 -->
  </section>
</body>
</html>
```

### 规则

- 一个 `<section class="page" data-page="...">` 对应原型左侧导航的一项
- `data-route` 必须存在，用于映射 PRD 中的页面路径；PRD 未给时按页面名生成建议路由
- `data-page` 在同一原型内唯一，并与 PRD 页面清单命名一致
- 交互节点（按钮、输入、选择、开关、表格行、标签页、卡片等）必须内联 `data-context`
- `data-context` 使用单引号包裹 JSON，内部字符串用双引号
- 页面样式独立于原型 shell：`design-pages.html` 中可写页面 CSS，§9 需将其内联进最终单文件
- 页面之间不直接跳转，所有跳转由 `data-context.action = "navigate"` + `target` 驱动
- 页面命名与 PRD 的功能/页面结构保持一致，避免同义多命名
- 需要页面级说明时，在 `section.page` 内放 `<template data-page-note>...</template>`；`editorial-ink` 的「看全部备注」读取它
- 组装 `design-prototype.html` 时，页面导航项带 `data-target="<data-page 值>"`，并内嵌 `#prototype-manifest`（字段见 [prototype-generation.md](prototype-generation.md) §十）

### Context 默认模板

与 [prototype-generation.md](prototype-generation.md) 的「默认 Context 模板」一致；HTML 模式直接写入 `data-context` 属性。

### 自检清单

```
□ 每个页面都有 data-page 和 data-route，且与 PRD 页面清单一一对应
□ data-page 在原型内唯一
□ 所有交互节点都有 data-context，且 JSON 可解析
□ navigate 的 target 都能匹配到某个 data-page 或已定义弹窗
□ 表单提交/删除/搜索/分页等关键交互均已声明
□ 无写死的颜色、字号、间距（全部来自 CSS 变量）
□ 复用的组件结构与 component-library.html 一致
□ design-prototype.html 内嵌 #prototype-manifest，pages 与 data-page 一一对应
□ 页面导航项 data-target 均能命中页面
□ 首次生成已确认样式；已有 .prototype-designer.json 时未重复询问
□ editorial-ink 使用顶部页面切换，且「看全部备注」可展开 / 收起
□ editorial-ink 的当前页备注高亮，切换页面后同步更新
```

---

## 六、步骤 7：组装最终原型

1. 解析 `design-pages.html`：收集 `data-page` 列表、每页 DOM、`data-context` 交互映射
2. 校验 context 完整性；缺失项按默认模板补齐并回写 `design-pages.html`
3. 将 `UI Design.html` 的 `:root` 变量与页面/组件 CSS 内联到最终文件；`editorial-ink` 额外内联 `editorial-ink.css`
4. 按已确认样式套用评审外壳：
   - `project`：三栏 shell，左导航 / 中预览 / 右说明
   - `editorial-ink`：顶部 `.proto` 页面切换 + `.wrap` 居中舞台 + `看全部备注`；登录 / 注册用 `.authpage` 双栏
5. 实现交互：页面切换、备注展开 / 收起、提交、删除确认、搜索 debounce、Toast、Loading、Modal、localStorage 状态保存
6. 输出 `design-prototype.html`（单文件自包含）

---

## 七、与模式 1 的对照

| 关注点 | 模式 1（.pen + HTML） | 模式 2（仅 HTML） |
|--------|----------------------|-------------------|
| pen 安装/登录 | 必须 | 不需要 |
| PRD.md | 必须读取 | 必须读取 |
| 设计规范 | `UI Design.pen` | `UI Design.html` |
| 组件库 | `控件库.pen` + `components.json` | `component-library.html` + `components.json` |
| 交互描述 | 节点 `context` 属性（`execute` 写入） | 节点 `data-context` 属性 |
| 页面来源 | `.pen` 页面 frame | `design-pages.html` 的 `section.page` |
| 原型组装 | `execute` 的 `Get` → 按样式选择 shell | 解析 HTML → 按样式选择 shell |
| 最终交付 | `design.pen` + `design-prototype.html` | `design-prototype.html` |

---

## 八、常见错误

| 错误 | 纠正 |
|------|------|
| 因为不生成 .pen 就跳过组件库 | 组件库是必需流程，改用 `component-library.html` 维护 |
| 页面里写死颜色/字号 | 必须引用 `UI Design.html` 的 CSS 变量 |
| 只在最终原型里补交互 | 交互必须在 `design-pages.html` 中以 `data-context` 声明 |
| 组件先写死、事后补登记 | 先入库注册，再在页面复用 |
| 最终 HTML 引用外部 CSS/JS | 必须内联，保持单文件自包含 |
| 每次生成都重复询问样式 | 读取项目根 `.prototype-designer.json`，已有 `prototypeStyle` 时直接沿用 |
| editorial-ink 仍套三栏 | 改用顶部页面切换 + 居中舞台 + `看全部备注` |
