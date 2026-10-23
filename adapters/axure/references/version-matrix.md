# Axure RP 9 / RP 11 差异与处理矩阵

> 证据来源：zee-rp 0.2.0 的 `scripts/version.mjs`、`version-fields.mjs`、`version-adapt.mjs`、`version-lint.mjs` 与 `references/commands-generated.md`。
> 本文只记录「代码里已实现的门禁与适配」；宿主行为仍须按 `structure → native-open → preview → gui-roundtrip` 分层验收。

---

## 一、先记住三条硬规则

1. **RP/1 只产出 RP9**。`language: "rp/1"` 的 `target` 是常量 `9`，`proto.mjs generate` 不接受 `target: 11`。
2. **RP9 产物不能被当作 RP11 原生文件**。需要原生 RP11 时，用 `create-blank-project --version 11` + `AXURE_BLANK_TEMPLATE_RP11` 起步，再走 writer / `clone-library-*`；或让用户在 Axure 11 中另存升级副本。RP/1 不能直接生成 RP11 整页。
3. **版本由文件字节决定，不由「本机开着哪个 Axure」决定**。写入、lint、GUI 宿主绑定都必须显式带版本，禁止猜。

---

## 二、版本识别与绑定

| 项目 | RP9 | RP11 |
|---|---|---|
| 文件头 | `ac ef 09 00` | `ac ef 0b 00` |
| 识别函数 | `detectFileVersion()` / `tryDetectFileVersion()` | 同左 |
| 默认空白模板变量 | `AXURE_BLANK_TEMPLATE_RP9` | `AXURE_BLANK_TEMPLATE_RP11` |
| 本地模板回退 | `templates/axure-rp9-blank.rp` | `templates/axure-rp11-blank.rp` |
| App 路径 | `/Applications/Axure RP 9.app` | `/Applications/Axure RP 11.app` |
| Bundle ID | `com.axure.AxureRP9` | `com.axure.AxureRP11` |
| 进程名 | `Axure RP 9` | `Axure RP 11` |

写侧默认目标版本是 **11**（`DEFAULT_VERSION`），可用 `--version 9|11` 或 `AXURE_TARGET_VERSION` 覆盖。RP/1 是唯一例外，永远按 9 生成。

GUI 粘贴 / 保存重开时，`resolvePasteTarget()` 的选择顺序：

```text
显式 --version / --bundle-id
  > AXURE_TARGET_VERSION
  > 本机唯一在跑的 Axure
  > 双版本并行时报错，要求显式指定
```

双版本并行时不允许按「第一个名字含 Axure 的进程」选宿主，否则会把 RP9 文件粘进 RP11 或反过来。

---

## 三、字段与值差异

### 3.1 动作/交互对象

| 类型 | RP9 | RP11 | zee-rp 处理 |
|---|---|---|---|
| `EnableDisableWidgetsInfo.enable` | `bool`（`true`=启用 / `false`=禁用） | `int`（`0`=Enable / `1`=Disable / `2`=Toggle） | 目标 9 时按 bool 写；`toggle` 在 RP9 无等价 bool，不能降级 |
| `InteractionCase` | 无 `Disabled`（旧样本的 `IsEnabled` 只被 reader 容忍） | `Disabled: bool` | 目标 9 时**删除** `Disabled`，不做改名取反 |
| `InteractionEvent` | 无 `Disabled` / `variable-id` | 两者都有 | 目标 9 时删除 |
| `Interaction*Action` 动作壳 | 无 `Disabled` | 多 `Disabled` | 目标 9 时删除；注意 zee-rp 自身把 `SetFunction` 类名拼成 `InterationActionSetFunction`（少一个 c），匹配时要兼容 |
| `FadeWidgetInfo` | 有 `vertical` | 有 `scale` / `scale-hide` / `scale-anchor` / `scale-hide-anchor` / `compress-distance-type` / `custom-compress-value` / `page-background-blur`，**无** `vertical` | 目标 9 时删除 RP11 键并补 `vertical` |
| `SetPanelStateInfo` | 有 `vertical` | 有 `enter-scale` / `enter-anchor` / `exit-scale` / `exit-anchor` / `compress-distance-type` / `custom-compress-value`，**无** `vertical` | 目标 9 时删除 RP11 键并补 `vertical` |

`version-adapt.mjs` 的 `adaptNodesForVersion(nodes, { version })` 是所有 writer 的公共收口：

- `version !== 9` 原样返回；
- 遇到 `RP11_ONLY_CLASSES`（`Axure:InteractionApplyStyle` / `Axure:InteractionApplyStyleInfo`）直接拒绝写入 RP9；
- 按 `RP11_ONLY_KEYS` 删除 RP11 新增键；
- 按 `RP9_TAG_OVERRIDES` 把同名不同型的值改成 RP9 类型；
- 只裁剪/改写，不做「改名 + 取反」这类语义猜测。

### 3.2 元件与文档对象

RP11 文件里常见、RP9 应删除的键（节选，完整表在 `version-fields.mjs` 的 `RP11_ONLY_KEYS`）：

| 对象 | RP11 专属键 |
|---|---|
| `DiagramObject:TextBox` / `ComboBox` / `ListBox` / `Checkbox` / `RadioButton` / `Table` / `TableCell` / `TextArea` / `ImageBox` / `Connector` / `DynamicPanel` / `Repeater` / `Master` 等 | `Error` |
| `DiagramObject:DynamicPanel` / `Layer` / `Repeater` | `ExpandedOnOutlineTreeView` |
| `DiagramObject:Repeater` | `Propagate` |
| `DiagramObject:ImageMapRegion` | `InteractionMap` |
| `DocumentSettings` | `FloatingEditorLayoutInfos` / `PrototypeDeleted` / `ShowLastPublishedCurrentLinks` / `UploadedSitmapIds` |
| `AdaptiveView` | `Cursor` |
| `PanelDiagram` | `ExpandedOnOutlineTreeView` |

### 3.3 样式属性码（DOA）

| 数值 | RP11 名称 | 处理 |
|---|---|---|
| `0x6c` | `FIXED_HEIGHT` | RP11 专属，目标 9 拒绝 |
| `0x6d` | `FIXED_WIDTH` | RP11 专属，目标 9 拒绝 |
| `0x578` | `TRANSITION` | RP11 专属，目标 9 拒绝 |
| `0x579` | `TRANSFORM` | RP11 专属，目标 9 拒绝 |
| `0x57a` | `TRANSFORM_ORIGIN` | RP11 专属，目标 9 拒绝 |
| `0x57b` | `WIDGET_BLUR` | RP11 专属，目标 9 拒绝 |
| `0x57c` | `BACKDROP_BLUR` | RP11 专属，目标 9 拒绝 |
| `0x57d` | `PAGE_CURSOR` | RP11 专属，目标 9 拒绝 |
| `0x6a` | `PIN_HORIZONTAL` | 同槽改名；RP9 叫 `ANCHOR_HORIZONTAL`，按数值判定，不算违规 |
| `0x6b` | `PIN_VERTICAL` | 同槽改名；RP9 叫 `ANCHOR_VERTICAL`，按数值判定，不算违规 |

DOA 判定必须用**数值**（`DOA = 0xC0000000 | 基值`），不能用名字；名字跨版本会变。

### 3.4 表达式函数（FCall）

| 函数 | RP9 | RP11 |
|---|---|---|
| `ToLowerCase` | 不存在 | 存在 |
| `GetErrorState` | 不存在 | 存在 |
| `SetErrorState` | 不存在 | 存在 |

RP9 预览运行时函数表 38 个，RP11 41 个。目标 RP9 时这些函数不可用，`add-interaction` 的 FCall 白名单会拦截。

### 3.5 事件（event-type）

| 事件 | RP9 | RP11 |
|---|---|---|
| `OnErrorSet` | 不存在 | 存在 |
| `OnErrorRemoved` | 不存在 | 存在 |
| `OnBeforeItemLoad` | 不存在 | 存在 |

其余 39 个事件两版都有。目标 RP9 时不允许写这三个事件。

### 3.6 类型存在性

- `Axure:InteractionApplyStyle` 与 `Axure:InteractionApplyStyleInfo` **仅 RP11 存在**，目标 RP9 明确拒绝。
- 曾经被列为「RP11 独有」的 9 个类型，经 RP9 程序集类型标签核实后确认全部存在，不再是拒绝理由；`CLASSES_NOT_IN_RP9_CORPUS` 恒为空。
- 「RP11 语料里出现过、RP9 语料里没观察到」只是覆盖率问题，不作为存在性判据。

---

## 四、zee-rp 的适配层

| 机制 | 文件 | 作用 |
|---|---|---|
| 版本边界 | `scripts/version.mjs` | 文件头识别、目标版本解析、模板/宿主按版本绑定 |
| 字段差异表 | `scripts/version-fields.mjs` | 两版原生样本实测键集、DOA、FCall、事件差异 |
| 写侧统一适配 | `scripts/version-adapt.mjs` | 所有 writer 共用；目标 RP9 时裁剪/改写新建对象 |
| 结构 lint | `scripts/version-lint.mjs` | 全量扫描版本专属键、DOA、RP9 必需键；三零查不出这些问题 |
| RP9 面板注册链 | `scripts/fix-panel-registry.mjs` | 补 `DynamicPanelInfo` / `PanelDiagramInfo`，否则 RP9 不渲染面板状态内容 |
| 空白页跨版本 | `scripts/create-blank-page.mjs` | 模板版本必须与输入文件一致，跨版本拒绝 |
| 原生场景写入 | `scripts/native-scene.mjs` | RP9 原生编组/形状/文字/内嵌图片，无 GUI |
| RP9 截图落画 | `tools/rp9_place.py` | 仅 RP9；走 macOS AX API，GUI 操作 |
| RP11 截图落画 | `scripts/axvg.mjs paste --version 11` | 写剪贴板 + 菜单粘贴；GUI 操作 |
| GUI 往返 | `scripts/gui-roundtrip.swift` / `jobs.mjs` | 打开→保存→关闭→重开；GUI 操作 |

写侧的原则：

- 新对象先由 writer 生成 RP11 形状，再经 `adaptNodesForVersion()` 裁到目标版本；
- 不要把 `version-adapt` 的逻辑分散到各个 writer，否则独立实现的 writer 会漏适配；
- 三零通过后仍要跑 `version-lint`，因为键集违规不会产生 dangling ref 或 parse 错误。

---

## 五、Skill 层的决策树

```text
用户要 Axure 原生产物
├─ 未指定版本
│  └─ 默认 RP9：写 RP/1 → check → generate（target 9）
├─ 指定 RP9
│  └─ RP/1 → check → generate → rp-read → version-lint --version 9
└─ 指定 RP11
   ├─ 只需可编辑、可接受升级副本
   │  └─ 先出 RP9 → 复制为 *-rp11-verify.rp → 用户在 Axure 11 打开并另存升级
   │     （只对副本升级，不覆盖 design.rp）
   └─ 必须原生 RP11
      └─ AXURE_BLANK_TEMPLATE_RP11 + create-blank-project --version 11
         → RP11 writer / clone-library / MCP 修改 → rp-read → version-lint --version 11
         （RP/1 不参与；CLI 不能从零生成 RP11 整页；
          整页内容要么 writer 逐个写，要么 GUI axvg paste --version 11，
          要么 RP9 副本在 Axure 11 中另存升级）
```

版本记录必须写进 `DesignResult` 与交付说明：

- 产物版本（RP9 / RP11）
- 使用的空白模板路径
- 验证所用 Axure 版本
- 是否经过升级（升级只发生在副本）
- 未完成的验收层级

---

## 六、常见误配与处理

| 误配 | 后果 | 处理 |
|---|---|---|
| 在 RP/1 里写 `target: 11` | `check` / `generate` 拒绝 | 改回 `target: 9`；需要 RP11 走原生 writer 路径 |
| RP9 模板配 `--version 11` | 静默写出错误版本或打开异常 | 用版本专用模板变量，preflight 会校验文件头 |
| 用通用 `AXURE_BLANK_TEMPLATE` 指向另一版本 | 模板版本与目标不一致 | 优先用 `AXURE_BLANK_TEMPLATE_RP9/RP11` |
| 把 RP9 产物直接保存回 `design.rp` | 原稿被升级，丢失 RP9 兼容性 | 先复制为 `*-rp11-verify.rp`，只对副本升级 |
| 只跑三零就交付 | 版本专属键违规未被发现 | 追加 `version-lint --version 9\|11` |
| 双版本并行时自动选宿主 | 粘贴/保存到错误版本 | 显式传 `--version` / `--bundle-id` |
| RP9 面板不显示 | 缺面板注册链 | 跑 `fix-panel-registry.mjs` |
| 在 RP9 用 `ToLowerCase` / `OnErrorSet` | 预览求值失败或事件无效 | 改用两版都支持的函数/事件，或明确目标 RP11 |

---

## 七、验收口径

| 层级 | RP9 | RP11 |
|---|---|---|
| `structural` | `rp-read` 三零 + `version-lint --version 9` | `rp-read` 三零 + `version-lint --version 11` |
| `native-open` | 目标 RP9 能打开，页面树/画布正常 | 目标 RP11 能打开，无升级提示或只在副本上升级 |
| `preview` | RP9 `Publish → Preview` 实际交互正确 | RP11 `Publish → Preview` 实际交互正确 |
| `gui-roundtrip` | 保存/关闭/重开后结构保留 | 保存/关闭/重开后结构保留 |

结构通过不等于预览通过。任何一项未做，保留 `not_run` 并写入 `limitations`。
