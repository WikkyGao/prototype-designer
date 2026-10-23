# Axure 适配器

> `status: ready` ｜ `migrationState: extracted`
> 独立目录与文档由 `prototype-designer` 读取调用，**不单独触发**。
> Axure 的完整实现细节在 `references/axure-mode.md`；本文件只定义适配器边界与执行顺序。

## 1. 职责

- 原生格式：`.rp`（RP9 / RP11）
- 输入：`DesignRequest`（见 `../../references/design-contract.md`）
- 输出：`DesignResult`，包含原生文件、页面/交互模型与分层验收证据
- HTML：可选，由 `prototype-designer` 公共核心生成；本适配器不生成三栏外壳
- 执行模式：默认 `cli`（纯文件，不接管鼠标/键盘/焦点）；`gui-acceptance` 需逐项目显式开启

不负责：

- PRD 解析、需求澄清
- HTML 三栏外壳、`#prototype-manifest`
- 总入口路由与用户确认

## 2. 入口

| 内容 | 位置 |
|---|---|
| zee-rp 环境、RP/1、`.rp` 读写、截图转布局、MCP、CLI/GUI 边界 | `references/axure-mode.md` |
| RP9 / RP11 版本差异、字段表、DOA / FCall / 事件门禁 | `references/version-matrix.md` |
| 环境检测（`--mode cli` 不要求本机 Axure） | `scripts/axure-preflight.mjs` |
| 组件库同步 | `../../references/config-management.md` |
| Context 补录 | `../../references/context-templates.md` |
| 可交互 HTML | `../../references/prototype-generation.md` |

从 `prototype-designer` 根目录运行自检：

```bash
# CLI 模式（默认）：只检查文件级生成所需环境，不要求本机安装 Axure
node adapters/axure/scripts/axure-preflight.mjs --mode cli

# 原生验收模式：额外检查 Axure 安装与版本
node adapters/axure/scripts/axure-preflight.mjs --mode gui
```

## 3. 输入输出

输入至少包含：

- `requestId`、`projectRoot`
- `pages[]`：页面名、目标文件、布局与交互
- `assets`：设计规范、控件库、组件库、已有 `.rp`
- `output.native`、`output.html`
- `constraints.axureVersion`（`9` / `11`，未指定则不擅自升级）

输出至少包含：

- `status`：`ok` / `partial` / `blocked` / `failed`
- `files.native`、`files.html`、`files.manifest`
- `pages[]`、`interactions[]`
- `acceptance.structural` / `nativeOpen` / `preview` / `guiRoundtrip`
- `limitations[]`、`nextActions[]`

不得修改 `DesignRequest`；缺信息返回 `blocked` 与 `nextActions`。

## 4. 执行顺序

1. **第三方工具风险告知（必须最先执行）**：明确告知用户——zee-rp 是独立实验性项目，**不是 Axure 官方产品**；本适配器的 .rp 读写依赖其 RP/1 中间格式与脚本链，可能存在格式兼容、生成保真度与后续版本演进风险；验收按「结构 → 原生打开 → 原生预览 → GUI 往返」分层记录，结构通过不代表 Axure 原生预览通过。用户接受 → 继续；拒绝 → 回退「仅 HTML」或停止，不得静默改用 Pen。该告知在每个项目的首次进入时必须执行，用户已确认过的项目可在交付说明中注明「已确认 zee-rp 风险」。
2. 读取 `DesignRequest`，确认 Axure 版本、目标文件、是否要 HTML，以及**执行模式**（默认 `cli`；用户明确要求原生验收才用 `gui-acceptance`）。
3. 运行 `scripts/axure-preflight.mjs --mode cli`，检查 Node、Python、zee-rp、venv 与模板。只有 `gui-acceptance` 才追加检查本机 Axure 安装（`--mode gui`）。
4. 选择路径：
   - 新建：写 RP/1（`check` → `generate`），默认 RP9。
   - 已有 `.rp`：先 `rp-read`，再用 writer 修改，输出新文件。
   - 截图/网页：先 `trace.mjs draft/patch` 转布局；落成 `.rp` 优先重写为 RP/1 后走 `generate`。`rp9_place.py` / `axvg paste` 属 GUI 路径，`cli` 模式不自动执行。
5. 生成后做结构校验：`rp-read` 三零 + `version-lint --version 9|11`。
6. **仅 `gui-acceptance` 模式**：需要原生验收时，**先按 §0.6 通知用户**（Axure 版本、验证副本文件、将执行的打开 / 点击 / 输入 / 保存 / 关闭动作）并取得确认，再在 Axure 中打开**验证副本**，执行 `Publish → Preview` 并记录实际交互；用户拒绝或仍为 `cli` 模式 → 跳过原生验收，在 `limitations` 记录「Axure 预览待验收」。
7. 需要 HTML 时，把 `pages` / `interactions` 交给公共核心生成，不在本适配器内拼三栏页面。
8. 返回 `DesignResult`，分层记录证据与限制。`cli` 模式的固定口径：`structural` 可为 `passed`，`nativeOpen` / `preview` / `guiRoundtrip` 一律 `not_run`。

### CLI 流水线（默认，不启动 Axure）

```bash
cd "$ZEE_RP_HOME"
node scripts/proto.mjs check --spec /abs/design.rp1.json
node scripts/proto.mjs generate --spec /abs/design.rp1.json \
  --out-dir /abs/outputs --out-rp /abs/design.rp
node bin/axure.mjs rp-read /abs/design.rp --json
node scripts/version-lint.mjs /abs/design.rp --version 9
```

已有 `.rp` 的修改同样只走 `rp-read` + writer（`set-widget-text` / `add-interaction` / `name-widget` / `duplicate-page` / `place-master` / `clone-library-*`），每次输出新文件并重跑 `rp-read` 与 `version-lint`。

## 5. 验收层级

| 层级 | 说明 |
|---|---|
| `structural` | 文件可读、页面/元件/交互数量与结构校验通过 |
| `native-open` | 目标 Axure 版本能打开，页面树与画布正常 |
| `preview` | `Publish → Preview` 中实际点击/输入结果正确 |
| `gui-roundtrip` | GUI 修改并保存后仍可打开、可预览 |

结构三零不等于预览通过；本地 PNG 对比不能代替 Axure 原生预览。

## 6. 版本规则

- RP/1 只支持 `target: 9`，产出 RP9；`AXURE_BLANK_TEMPLATE_RP9` 必须是 RP9 自己保存的空白工程。不要在 RP/1 里写 `target: 11`。
- 原生 RP11 用 `create-blank-project --version 11` + `AXURE_BLANK_TEMPLATE_RP11` 起步；RP/1 只出 RP9，**不能直接生成 RP11 整页**。RP11 内容需 writer / `clone-library-*` 写入，或把 RP9 副本在 Axure 11 中另存升级（GUI）。
- 在 Axure 11 中验证 RP9 时，复制为 `*-rp11-verify.rp` 再打开；升级只发生在副本。
- 不混用 RP9/RP11 模板，不覆盖用户原稿。
- 写侧统一经 `version-adapt` 裁剪；生成/修改后必须跑 `version-lint --version 9|11`，三零查不出键集违规。
- 完整字段、DOA、FCall、事件差异与决策树见 [version-matrix.md](references/version-matrix.md)。

## 7. 失败与回退

| 情况 | 处理 |
|---|---|
| preflight 失败 | 返回 `blocked`，给出 `ZEE_RP_HOME` / venv / 模板修复动作 |
| 缺少空白模板 | 返回 `blocked`，要求在对应 Axure 版本新建单页空白工程 |
| 输出已存在 | 换新文件名，不删除原工程 |
| Axure 版本不匹配 | 停止并询问；不得静默升级 |
| 原生工具不可用 | 回退「仅 HTML」或停止；不得静默改用 Pen |

## 8. 边界

- 进入子技能先完成第 4 节第 1 步的第三方工具风险告知（zee-rp 非官方）；未告知不得开始生成。
- **默认 `cli` 模式**：不启动 Axure、不发 AppleScript / System Events / CGEvent、不写剪贴板、不切焦点。生成、读取、修改、结构校验全部走文件命令。
- `gui-acceptance` 必须逐项目开启；接管 GUI 前必须告知版本、文件、动作（点击/输入/保存/关闭）并取得确认。
- 不得把 `cli` 模式的结果说成「Axure 已验证」；只能声明「结构已验证，原生预览待验收」。
- 不操作用户已打开的工程；不覆盖原稿；不删除用户文件。
- 不把结构校验、截图对比或本地预览说成 Axure 原生验收。
- zee-rp 是独立实验性项目，不是 Axure 官方产品。
- OpenDesign 未实现前，不得用本适配器冒充。
