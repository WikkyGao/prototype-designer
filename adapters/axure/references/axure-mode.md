# 模式 3：Axure 原型（zee-rp）— 参考手册

> 本文档是 prototype-designer SKILL.md 中「模式 3：用 Axure 设计原型」的完整实现参考。
> 进入模式 3 前，必须已完成 §0.5 前置检查：PRD.md → 标准控件库 → 设计规范文档 → 产出形式确认。
> 核心原则：**用 zee-rp 的工具链产出可继续在 Axure 中编辑的原生 `.rp`；不跳过 PRD、控件库、设计规范与组件库流程。**

zee-rp 是独立实验性项目（MIT），不是 Axure 官方产品。它的证据边界是「具体 macOS + Axure RP 9/11 样本」，不能把结构级通过当成 GUI 已验收。完整边界见 zee-rp 的 `references/capabilities.md` 与 `docs/verification.md`。

---

## 一、适用场景

- 交付物必须在 Axure RP 中继续编辑，而不是只能看的图片或 HTML
- 需要原生页面、动态面板、中继器、表格、连接线、母版或原生交互
- 已有 `.rp` 工程需要批量改名、改文案、加交互或补页面
- 已有截图/网页，希望还原成可编辑的 Axure 布局

不适用：只需要快速可交互 HTML（用模式 2）、需要 pen.dev 图层协作（用模式 1）、目标环境没有 Axure 且不接受「仅结构验证」。

---

## 二、产物清单

| 文件 | 作用 | 是否必需 |
|------|------|----------|
| `design.rp1.json` 或 `design.rp1` | RP/1 原型源码（页面、数据、变量、交互的唯一事实来源） | 新建时必需 |
| `design.rp` | 原生 Axure 工程，可在 Axure 中继续编辑 | 是 |
| `design-prototype.html` | 可选三栏可交互 HTML 原型，内嵌 `#prototype-manifest` | 推荐 |
| `UI Design.rp` 或 `UI Design.html` | 设计规范可视化载体 | 按项目情况 |
| `components.json` | 组件注册表（Axure 条目为增量扩展） | 是 |
| `outputs/` | zee-rp 的编译产物（摘要、IR、布局审计、预览图） | 由工具生成 |

所有输出使用**新路径**。zee-rp 拒绝覆盖已有 `.rp`，也不允许改写受保护的原工程。

---

## 三、环境准备

### 3.1 安装 zee-rp

```bash
git clone https://github.com/LilZeeCN/zee-rp.git
cd zee-rp
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm ci
```

要求 Node.js 18+、Python 3.10+。截图 OCR 额外需要 macOS Vision 与 Swift 编译器；生成原生 `.rp` 需要本机安装 Axure，并准备**对应版本**保存的单页空白工程。

建议设置 `ZEE_RP_HOME` 指向 zee-rp 仓库，后续命令都在该目录执行：

```bash
export ZEE_RP_HOME=/absolute/path/to/zee-rp
```

### 3.2 空白模板

```bash
# RP/1 原生生成（zee-rp 0.2.0 产出 RP9 工程）
export AXURE_BLANK_TEMPLATE_RP9=/absolute/path/to/own-rp9-blank.rp

# 原生 RP11 新建/编辑
export AXURE_BLANK_TEMPLATE_RP11=/absolute/path/to/own-rp11-blank.rp
```

也可以把模板放在 zee-rp 仓库的 `templates/` 下，命名为 `axure-rp9-blank.rp` / `axure-rp11-blank.rp`；本 skill 的 preflight 会自动识别。模板必须由目标 Axure 版本自己保存，不能跨版本混用。仓库不分发模板、官方元件库或运行时。

### 3.3 MCP（可选，但推荐用于改已有工程）

```json
{
  "mcpServers": {
    "zee-rp": {
      "command": "node",
      "args": ["/absolute/path/to/zee-rp/bin/mcp.mjs"],
      "env": {
        "AXURE_BLANK_TEMPLATE_RP9": "/absolute/path/to/own-rp9-blank.rp",
        "AXURE_BLANK_TEMPLATE": "/absolute/path/to/own-blank.rp"
      }
    }
  }
}
```

MCP 依赖可选 SDK，需在 zee-rp 目录执行过 `npm ci --ignore-scripts`。核心 CLI 不依赖 npm 运行时。

### 3.4 快速自检

在 `prototype-designer` 根目录运行：

```bash
node adapters/axure/scripts/axure-preflight.mjs
```

该脚本检查 zee-rp 路径、关键文件、Node/Python 版本、空白模板环境变量与 Axure 安装位置，并打印 MCP 配置片段。它只做检测，不修改任何文件。

---

## 四、前置检查如何映射到 Axure

### 4.1 PRD.md

读取项目概述、功能模块、数据字段、业务流程，落到 RP/1：

| PRD 内容 | RP/1 载体 |
|---|---|
| 页面清单、导航 | `pages[]`、`link` 动作 |
| 数据字段、列表 | `models` / `datasets` / `repeater` |
| 表单与筛选 | `input`、`button`、`data-filter` |
| 业务状态 | `variables`、`dynamic-panel`、条件 Case |
| 业务流程 | `on` 事件 + 动作序列 |

### 4.2 标准控件库

模式 3 同时探测三种 Axure 载体：

| 载体 | 文件（按优先级） | 用法 |
|---|---|---|
| 原生页面/母版 | `控件库.rp` / 含 `masters` 的 `.rp` | 用 `create-master` / `place-master` 复用，或在 RP/1 顶层声明 `masters` |
| 原生元件库 | `*.rplib` | `clone-library-widget` / `clone-library-page-content` |
| RP/1 组件 | `components` 声明 | 编译时展开，适合纯布局/文字/按钮/输入 |

命中后**强制复用**；只有缺失组件才新建并登记到 `components.json`。

### 4.3 设计规范

| 来源 | 映射 |
|---|---|
| `design.md` | 设计原则、组件规则、禁用项；人工遵循 |
| `tokens.json` / `variables.css` | 颜色转 `#RRGGBB`；可复用标量转 `variables`；主题选 `theme` |
| `UI Design.rp` | 视觉示例与最终沉淀载体 |
| `UI Design.html` | 无 Axure 环境可读时的规范回退 |

RP/1 的颜色只接受已知 `$token` 或 `#RRGGBB`。项目令牌不在内置主题里时，直接把令牌值写成十六进制，并在交付文档中保留令牌名到值的对应表（RP/1 不解析任意自定义主题键）。

---

## 五、工作流 A：从零生成原生原型（首选）

### 5.1 写 RP/1 源码

最小示例：

```json
{
  "language": "rp/1",
  "target": 9,
  "name": "示例原型",
  "domain": "web",
  "theme": "enterprise-light",
  "variables": {
    "count": { "type": "number", "value": 0 }
  },
  "pages": [{
    "id": "home",
    "name": "首页",
    "canvas": { "w": 1440, "h": 900 },
    "root": {
      "type": "box", "id": "root", "layout": "column",
      "padding": 32, "gap": 16, "w": "fill", "h": "fill",
      "children": [
        { "type": "label", "id": "title", "text": "控制台", "fontSize": 24, "fontWeight": "bold" },
        { "type": "button", "id": "add", "text": "新增", "on": { "click": [
          { "type": "set-variable", "variable": "count", "value": { "op": "+", "left": { "variable": "count" }, "right": 1 } }
        ] } }
      ]
    }
  }]
}
```

编写规则：

- 顶层必须声明 `language: "rp/1"`；新建原生原型用 `target: 9`
- 每个页面声明 `id` 与 `root`；`name` 会写入 Axure OUTLINE
- 尺寸用数字或 `fill` / `hug` / `auto`；不要写 CSS 的 margin、百分比
- 颜色用 `$token` 或 `#RRGGBB`；字号/间距来自设计规范
- 交互写在 `on` / `onClick` 等事件里，使用 RP/1 动作，不写 JS
- `repeat` 是编译期展开；`repeater` 才是运行期列表
- 母版只支持文字、按钮、输入等基础元件；含动态面板/中继器的母版会被拒绝
- 自适应只支持页面元件的有限 `x/y/w/h`；模板内覆盖会被拒绝

完整语法见 zee-rp `references/rp-language.md`，AI 速查见 `references/rp-ai-quickstart.md`。

### 5.2 检查 → 生成 → 验证

```bash
cd "$ZEE_RP_HOME"

# 1. 静态检查（不需要 Axure / 字体 / GUI）
node scripts/proto.mjs check --spec /absolute/path/design.rp1.json

# 2. 生成原生工程与新产物
node scripts/proto.mjs generate \
  --spec /absolute/path/design.rp1.json \
  --out-dir /absolute/path/outputs \
  --out-rp /absolute/path/design.rp

# 3. 读回结构，确认三零（unparseable / danglingRefs / problems）
node bin/axure.mjs rp-read /absolute/path/design.rp --json

# 4. 可选：解释某个节点、补充缺失属性、探索交互
node scripts/proto.mjs inspect --spec /absolute/path/design.rp1.json
node scripts/proto.mjs explain --spec /absolute/path/design.rp1.json --target home/status
node scripts/proto.mjs complete --spec /absolute/path/design.rp1.json --pointer /pages/0/root
node scripts/proto.mjs explore --spec /absolute/path/design.rp1.json --max-depth 3 --max-states 48
```

`check` 失败时按诊断的 `pointer` / `code` 修复；所有诊断带 `candidatePatches`，可用 `--auto-heal` 自动修复后重验。**不要绕过 check 直接 generate。**

### 5.3 在 Axure 11 中验收

RP/1 产物是 RP9 工程，Axure 11 打开时可能提示升级。**先复制，再验证**：

```bash
cp /absolute/path/design.rp /absolute/path/design-rp11-verify.rp
open -a "Axure RP 11" /absolute/path/design-rp11-verify.rp
```

生成成功后：

1. 在 Axure 11 中打开验证副本；如提示升级旧版本，只对副本确认
2. `Publish → Preview`（或工具栏播放按钮）打开浏览器预览
3. 点击关键交互，确认文案/状态按预期变化
4. 保存 → 关闭 → 重新打开验证副本，确认没有丢失
5. 若做过 GUI 手改，再保存并重新预览

原生 RP11（不经过 RP/1）：

```bash
node scripts/create-blank-project.mjs /absolute/path/blank-rp11.rp --version 11
node bin/axure.mjs rp-read /absolute/path/blank-rp11.rp --json
```

需要 `AXURE_BLANK_TEMPLATE_RP11`。替代方案是直接在 Axure 11 新建空白工程并另存，效果相同。

没有完成以上步骤时，只能声明「结构已验证」，不能声明「Axure 预览已通过」。本地 PNG 对比、模拟器或截图相似度不能代替原生预览。

---

## 六、工作流 B：已有 `.rp` 的读取与修改

### 6.1 只读定位

```bash
node bin/axure.mjs rp-read /absolute/path/source.rp
node bin/axure.mjs rp-read /absolute/path/source.rp --json
node bin/axure.mjs rp-read /absolute/path/source.rp --full
```

摘要包含页面、母版、Page 记录索引、元件名称/几何/文本、面板状态、交互与问题。`--json` 的 `containedWidgets` 提供 `record/id/guid/container` 递归清单。

### 6.2 CLI 修改（输出新文件）

```bash
# 改名（保留身份与交互）
node bin/axure.mjs name-widget source.rp renamed.rp --name "旧名称" --to "搜索输入框"

# 改文案
node scripts/set-widget-text.mjs source.rp edited.rp "Page 1" LBL_NAME "新的文案"

# 加交互
node scripts/add-interaction.mjs source.rp interactive.rp "提交按钮" \
  --event OnClick --action show target="提示框" animation=slideDown duration=300

# 复制页面 / 放置母版 / 克隆库元件
node scripts/duplicate-page.mjs source.rp pages.rp "源页面" "新页面"
node scripts/place-master.mjs source.rp instance.rp "已有母版名" PAGE_RECORD_INDEX --x 100 --y 100
node scripts/clone-library-widget.mjs Default.rplib source.rp with-field.rp \
  "Text field" "Page 1" FORM_NAME --x 120 --y 120 --w 260 --h 32
```

规则：

- **永远不要覆盖用户原工程**；输入保留，输出用新文件名
- `--record` / `--widget` 的精确定位优先于名称；名称必须唯一
- `add-interaction` 默认追加，不替换已有同名事件
- 每次修改后重跑 `rp-read` 或 `verify`

### 6.3 MCP 修改（推荐用于多步编辑）

```text
axure_open({ path: "/absolute/path/source.rp" })
axure_state()
locate({ query: "提交按钮", page: "订单页" })
inspect({ target: { record: 4, id: 17 } })
read_interactions({ page: "订单页" })
edit_text({ target: { record: 4, id: 17 }, text: "保存订单" })
rename_widget({ target: { name: "旧名称" }, name: "搜索输入框" })
axure_save({ as: "/absolute/path/design.rp" })
verify({ deep: true })
```

`axure_open` 会创建与源文件同目录的工作副本链（`源主名.work-1.rp`），所有修改写在新链节点；`axure_save` 只允许另存为新文件。上下文被压缩后用 `axure_state` 恢复。

其他命令工具（`rp_read`、`create_blank_project`、`duplicate_page`、`add_interaction`、`set_widget_text`、`create_master`、`place_master`、`clone_library_widget` 等）默认接续当前会话链；也支持显式传源/输出路径。`gui_roundtrip`、`jobs_list`、`jobs_get`、`jobs_cancel` 用于 macOS GUI 保存/关闭/重开队列。

---

## 七、工作流 C：截图 → 可编辑 Axure 布局

适合参考截图、竞品页面、设计稿还原。zee-rp 的识别是启发式，必须人工核对。

```bash
cd "$ZEE_RP_HOME"

# 1. 分析截图，生成草稿、剪贴板 JSON、视觉差分
node scripts/trace.mjs draft /absolute/path/source.png \
  -o /absolute/path/outputs/screenshot \
  --scale 2 \
  --axvg /absolute/path/outputs/screenshot/page.axvg.json

# 2. 修正识别错字
node scripts/trace.mjs patch /absolute/path/outputs/screenshot/draft.spec.json \
  --replace "识别错字=正确文字" \
  --axvg /absolute/path/outputs/screenshot/page.axvg.json \
  --safe-lines

# 3. 落成原生工程
# RP9：先打开一个新的工作工程，再执行（会清空当前页）
python3 tools/rp9_place.py /absolute/path/new-working-project.rp \
  --axvg /absolute/path/outputs/screenshot/page.axvg.json

# RP11：写入剪贴板，再在 Axure 中粘贴并保存
node scripts/axvg.mjs paste /absolute/path/outputs/screenshot/page.axvg.json --version 11
```

`--scale` 是物理像素与逻辑像素的比值，Retina 2x 截图通常用 `2`。照片、复杂画面和部分图标仍是独立图片，不能恢复站点业务逻辑。RP9 斜线使用 `--safe-lines`。

视觉核对：

```bash
node scripts/trace.mjs verify /absolute/path/outputs/screenshot/draft.spec.json \
  --source /absolute/path/source.png --scale 2 \
  --preview /absolute/path/axure-preview.png \
  -o /absolute/path/outputs/host-comparison
```

只有传了 `--preview` 且报告出现 `axure_preview_mae_per_255`，才是与 Axure 实际预览的比较；`pixel_similarity_pct` 不是 OCR 准确率。

---

## 八、设计规范 → RP/1 映射

### 8.1 主题与变量

| 设计规范 | RP/1 |
|---|---|
| 配色体系 | 选最接近的 `theme`，其余令牌写成 `#RRGGBB` |
| 可复用数值 | `variables: { "space-md": { "type": "number", "value": 16 } }` |
| 布尔开关 | `variables` 的 `boolean` |
| 文案 | `label` / `paragraph` 的 `text` |
| 字体族/字号/字重 | `fontFamily` / `fontSize` / `fontWeight` |
| 行高 | `paragraph` 的 `lineHeight`（总行高）或 `lineGap`（额外间隙） |

内置主题：`enterprise-light`、`modern-dark`、`cobalt-pro`、`mobile-lowfi`、`mobile-hifi`。领域：`web`、`mobile`、`doc`、`test`。

### 8.2 间距与布局

- 优先用 `layout: "row" | "column" | "grid" | "stack"` + `gap` / `padding`，不要手写散落坐标
- 固定画布用 `canvas`；自适应内容用 `w/h: "fill" | "hug"`
- 结构审计会检查溢出、重叠、裁切与最坏行文本；不要靠缩短文案掩盖问题

### 8.3 设计规范页

- 能打开 Axure：把令牌和组件示例做成 `UI Design.rp`
- 不能打开 Axure：保留 `UI Design.html`，并在 `design-prototype.html` 中引用同一套令牌
- 无任何来源：先建默认规范，所有值标注「默认值待确认」

---

## 九、组件库管理（Axure）

### 9.1 三级复用

1. **RP/1 `components`**：编译期展开，适合纯布局/文字/按钮/输入；实例用 `type: "use"` + `component` + `args`
2. **RP/1 `masters`**：生成原生 `Axure:Master` + `ReferenceDiagramObject`；只支持基础元件，含面板/中继器明确拒绝
3. **原生 `.rplib` / 页面内容**：用 `clone-library-widget` / `clone-library-page-content` 克隆到目标页

### 9.2 components.json 扩展

不破坏现有字段，Axure 条目新增以下可选字段：

```json
{
  "id": "btn-primary-20261022",
  "name": "btn-primary",
  "category": "basic",
  "format": "axure",
  "source": "axure",
  "master": "按钮-主要",
  "libraryFile": "控件库.rplib",
  "widgetName": "Primary Button",
  "description": "主要操作按钮",
  "createdAt": "2026-10-22T10:00:00Z",
  "usageCount": 0,
  "tags": ["button", "primary"]
}
```

- `master`：RP/1 `masters` 或 `.rp` 中的母版名
- `libraryFile` + `widgetName`：`.rplib` 定位
- `format` / `source` 用于区分 pen.dev、HTML 与 Axure 条目
- 新增 `components.json` 顶层字段 `axureLibraryFile`（默认 `控件库.rplib`）与 `axureMasterFile`（默认 `控件库.rp`）

新增组件前先按名称/分类查重；删除前必须确认使用次数。

---

## 十、交互与 HTML 原型

### 10.1 原生交互

RP/1 的 `on` 事件会编译成 Axure 原生事件。常用动作：

| 动作 | 作用 |
|---|---|
| `set-text` | 改文字 |
| `set-variable` | 改全局变量 |
| `set-panel-state` | 切换动态面板状态 |
| `show` / `hide` / `toggle` | 显隐 |
| `enable` / `disable` / `focus` | 输入控件状态 |
| `link` | 页面跳转 |
| `wait` | 等待 |
| `data-add` / `data-update` / `data-delete` | 中继器数据 |
| `data-filter` / `data-sort` / `data-page` | 筛选、排序、分页 |

事件别名：`click`、`change`、`load`、`mouseover`、`mouseout`、`focus`、`blur`、`statechange`。页面只支持 `load`；`change/focus/blur` 只允许输入；`statechange` 只允许面板。

### 10.2 可选 HTML 原型

模式 3 默认交付 `.rp`；需要评审/演示/给下游 `prototype-to-frontend` 解析时，再生成 `design-prototype.html`：

- 页面来源：RP/1 `pages[]`（推荐）或 `rp-read` 读取的 `.rp` 摘要
- 交互来源：RP/1 `on` 事件；HTML 节点内联 `data-context`
- 保留三栏 shell、`data-page` / `data-route` / `data-target` / `data-annotation-id`
- 内嵌 `#prototype-manifest`，`mode` 为 `"axure"`，`files.design` 指向 `.rp`
- `pages[].selector` 必须在最终 HTML 中唯一命中，`contextCount` 用于核对交互数

`prototype-manifest` 最小示例：

```json
{
  "schemaVersion": "1.0",
  "generator": "prototype-designer",
  "mode": "axure",
  "tokensSource": "UI Design.rp",
  "pages": [
    { "name": "订单列表", "route": "/orders", "selector": "[data-page=\"订单列表\"]", "contextCount": 4 }
  ],
  "shared": ["app-shell"],
  "files": {
    "design": "design.rp",
    "source": "design.rp1.json",
    "pages": "design-pages.html",
    "componentLibrary": "component-library.html",
    "components": "components.json"
  }
}
```

---

## 十一、验证与交付口径

zee-rp 的证据分层要在交付说明中如实区分：

| 层级 | 含义 | 能声明什么 |
|---|---|---|
| `structure` | 文件可解析、引用完整、结构三零 | 结构已验证 |
| `gui-roundtrip` | Axure 保存/关闭/重开后结构保留 | GUI 往返已验证 |
| `preview` | 本机 Axure 预览实际展示/交互 | 预览已验证 |
| `loaded` | 原生工程可被 Axure 正常加载 | 加载已验证 |

交付前至少完成：

```bash
node bin/axure.mjs rp-read /absolute/path/design.rp --json
```

确认 `unparseable` / `danglingRefs` / `problems` 为空。有时间再打开 Axure 做预览、保存关闭重开。

**不要**把本地 PNG 对比、模拟器或截图相似度当成 Axure 原生预览证据。

---

## 十二、安全与边界

- 不覆盖用户原工程；输出必须是新文件
- `AXURE_WRITE_ROOT` 可限制写入根目录；`AXURE_PROTECTED_PATHS` 可配置受保护文件
- 模板、官方元件库、运行时均来自用户本机，不随项目分发
- RP/1 母版不支持动态面板/中继器；自适应覆盖不支持母版/面板/中继器模板
- 自定义路径、旋转、效果、渐变、不等角圆角不是通用 Axvg 导入能力
- 截图转布局不会自动恢复业务逻辑
- zee-rp 是实验性项目，不承诺所有 Axure 版本、平台与功能组合都通过

---

## 十三、错误速查

| 症状 | 原因 / 处理 |
|---|---|
| `ZEE_RP_HOME` 未设置 | 设置到 zee-rp 仓库绝对路径，或运行 `node adapters/axure/scripts/axure-preflight.mjs` 查看候选 |
| `Cannot find module '@modelcontextprotocol/sdk'` | 在 zee-rp 目录执行 `npm ci --ignore-scripts` |
| `AXURE_BLANK_TEMPLATE_RP9` 缺失 | 用 RP9 保存一个单页空白工程，导出该环境变量 |
| 模板跨版本失败 | 模板必须与目标 Axure 版本一致 |
| `output file exists` / 拒绝覆盖 | 换新输出文件名；zee-rp 不覆盖已有 `.rp` |
| `python3` 找不到 | 激活 zee-rp 的 venv，确保 `python3` 在 `PATH` |
| OCR 识别差 | 用正确的 `--scale`；执行 `trace.mjs patch` 修正；复杂画面保留图片 |
| `rp9_place.py` 清空了页面 | 它只适合**新的工作工程**；不要指向正式工程 |
| RP11 粘贴无反应 | 先 `axvg.mjs paste ... --version 11`，再在 Axure 中手动粘贴并保存 |
| 改名后引用失效 | 用 `name-widget` / `rename_widget`，不要直接改二进制；引用始终用 `id` |
| 交互没生效 | 先 `read_interactions` 看现状；`add-interaction` 默认追加，不替换 |
| 结构三零但预览异常 | 结构不等于 GUI；需在 Axure 中实际预览并记录证据层级 |
| 母版/自适应被拒绝 | 检查是否包含动态面板、中继器或模板内覆盖 |
| 生成耗时过长 | 原生生成通常秒级到分钟级；GUI 保存/预览另计 |

---

## 十四、验证踩坑与环境隔离

以下是实际验证中踩过的问题。模式 3 的 GUI 验收必须按本节执行，否则很容易误改用户工程或把 RP9/RP11 混在一起。

### 14.1 多版本 Axure 共存

同一台机器同时安装 Axure RP 9 和 Axure RP 11 时，先定向，再动手：

| 目标 | 生成方式 | 模板变量 | 产物 |
|---|---|---|---|
| RP9 原生 | RP/1 `target: 9` + `proto.mjs generate` | `AXURE_BLANK_TEMPLATE_RP9` | RP9 `.rp` |
| RP11 验收 | 复制 RP9 产物，用 Axure 11 打开并确认升级 | 不需要新模板 | `*-rp11-verify.rp`（副本） |
| RP11 原生 | `create-blank-project --version 11` + RP11 writer/MCP | `AXURE_BLANK_TEMPLATE_RP11` | RP11 `.rp` |

规则：

- **RP/1 产物是 RP9**。zee-rp 0.2.0 的 `proto.mjs generate` 不接受 `target: 11`；不要在 RP/1 源码里写 `target: 11` 然后期待 RP11 产物
- Axure 11 打开 RP9 工程会提示升级。**先复制**为 `*-rp11-verify.rp`，只对副本确认升级；不要保存回 `design.rp`
- 需要原生 RP11 时，用 `AXURE_BLANK_TEMPLATE_RP11` 和 `--version 11`，不要拿 RP9 产物冒充
- 不要用通用 `AXURE_BLANK_TEMPLATE` 指向另一个版本的模板；优先用版本专用变量，避免“模板 11 + 目标 9”这类静默错配
- 交付说明写清楚：产物版本、验证所用 Axure 版本、是否经过升级

### 14.2 接管 GUI 前先告知用户

以下操作都算“接管电脑”，执行前必须向用户说明并取得确认：

- 启动 / 激活 Axure RP
- 发送 AppleScript / System Events 的键盘、鼠标事件
- 打开、保存、另存、关闭、重开工程
- 点击 `Publish → Preview` 或操作预览浏览器

告知内容至少包括：**用哪个 Axure 版本、打开哪个文件、会做哪些点击/输入/保存动作、是否会关闭窗口**。用户拒绝时，交付「结构已验证，GUI 待验收」，不要强行操作。

硬性规则：

- 只操作**验证副本**，不碰用户已打开的工程和未保存文档
- 每次发送按键前先 `activate` 目标应用，并确认前台应用与窗口标题；应用不对就停止
- 不盲发 `Cmd+A` / `Cmd+S` / `Cmd+W`。保存必须通过明确的菜单或确认过的对话框路径完成
- 保存后立刻检查文件是否出现在预期目录；发现误生成（例如 `test.rp`、`Untitled.rp`）立即清理并告知用户
- 模态对话框打开时不要继续盲发按键；先截图确认，再决定下一步
- 窗口可能在另一块屏幕或屏幕外。先用窗口列表检查 `bounds`，必要时移到可见区域，再用窗口 ID 截图
- 缺少辅助功能/自动化权限时停止并请用户授权，不要尝试绕过

### 14.3 其他实际阻塞

| 问题 | 现象 | 处理 |
|---|---|---|
| GitHub 拉取不稳定 | `git clone` / `raw.githubusercontent.com` 超时 | 重试 `git clone --depth 1`；或用 GitHub API / codeload 下载；不要据此判断项目不可用 |
| 系统 Python 过旧 | `python3` 是 3.9，低于 3.10 | 用 `python3.12 -m venv .venv`；preflight 会优先使用 `$ZEE_RP_HOME/.venv/bin/python` |
| 缺少空白模板 | 仓库不分发 `.rp`，`generate` 报缺少模板 | 在对应 Axure 版本中新建单页空白工程并另存；确认 1 页、0 元件、0 面板状态；放在 `templates/` 或设置版本专用变量 |
| 误把教学工程当模板 | `create-blank-project` 报模板不是单页空白 | 教学工程含元件/面板，不能当模板；必须自己新建空白工程 |
| 输出文件已存在 | zee-rp 拒绝覆盖 | 换新文件名；不要删除原工程来“绕过” |
| `python3` 仍指向系统版本 | 已建 venv 但命令仍失败 | `source .venv/bin/activate`，或显式用 `.venv/bin/python` |
| 预览不是原生验收 | 本地 PNG/截图看着一样 | 必须以 Axure `Publish → Preview` 的实际页面和交互为准；结构三零只算结构验证 |
| `rp9_place.py` 清空页面 | 目标页内容被清空 | 只对**新的工作工程**使用，不要指向正式工程 |
| 窗口标题重复/空白 | 多个 `Untitled`，找不到目标窗口 | 用窗口列表 + `bounds` + 窗口 ID 定位；不要按标题猜 |

### 14.4 验证记录建议

每次 GUI 验收至少记录：

- 目标 Axure 版本与产物版本（RP9 / RP11）
- 使用的空白模板路径
- 验证副本路径（不要记录成原工程）
- 预览 URL / 页面名
- 实际点击的交互与结果（例如“Add one：Count 0 → 1”）
- 证据层级：`structure` / `preview` / `gui-roundtrip`
- 清理了哪些临时文件
