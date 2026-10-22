# Axure 适配器

> `status: ready` ｜ `migrationState: extracted`
> 独立目录与文档由 `prototype-designer` 读取调用，**不单独触发**。
> Axure 的完整实现细节在 `references/axure-mode.md`；本文件只定义适配器边界与执行顺序。

## 1. 职责

- 原生格式：`.rp`（RP9 / RP11）
- 输入：`DesignRequest`（见 `../../references/design-contract.md`）
- 输出：`DesignResult`，包含原生文件、页面/交互模型与分层验收证据
- HTML：可选，由 `prototype-designer` 公共核心生成；本适配器不生成三栏外壳

不负责：

- PRD 解析、需求澄清
- HTML 三栏外壳、`#prototype-manifest`
- 总入口路由与用户确认

## 2. 入口

| 内容 | 位置 |
|---|---|
| zee-rp 环境、RP/1、`.rp` 读写、截图转布局、MCP、GUI 边界 | `references/axure-mode.md` |
| 环境检测 | `scripts/axure-preflight.mjs` |
| 组件库同步 | `../../references/config-management.md` |
| Context 补录 | `../../references/context-templates.md` |
| 可交互 HTML | `../../references/prototype-generation.md` |

从 `prototype-designer` 根目录运行自检：

```bash
node adapters/axure/scripts/axure-preflight.mjs
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

1. 读取 `DesignRequest`，确认 Axure 版本、目标文件与是否要 HTML。
2. 运行 `scripts/axure-preflight.mjs`，检查 Node、Python、zee-rp、venv、模板与 Axure。
3. 选择路径：
   - 新建：写 RP/1（`check` → `generate`），默认 RP9。
   - 已有 `.rp`：先 `rp-read`，再用 writer 或 MCP 会话链修改，输出新文件。
   - 截图/网页：先转布局，再进入上述路径。
4. 生成后做结构校验（`rp-read` / `verify` / 结构三零）。
5. 需要原生验收时，在 Axure 中打开**验证副本**，执行 `Publish → Preview` 并记录实际交互。
6. 需要 HTML 时，把 `pages` / `interactions` 交给公共核心生成，不在本适配器内拼三栏页面。
7. 返回 `DesignResult`，分层记录证据与限制。

## 5. 验收层级

| 层级 | 说明 |
|---|---|
| `structural` | 文件可读、页面/元件/交互数量与结构校验通过 |
| `native-open` | 目标 Axure 版本能打开，页面树与画布正常 |
| `preview` | `Publish → Preview` 中实际点击/输入结果正确 |
| `gui-roundtrip` | GUI 修改并保存后仍可打开、可预览 |

结构三零不等于预览通过；本地 PNG 对比不能代替 Axure 原生预览。

## 6. 版本规则

- RP/1 `target: 9` 产出 RP9；`AXURE_BLANK_TEMPLATE_RP9` 必须是 RP9 自己保存的空白工程。
- 原生 RP11 使用 `AXURE_BLANK_TEMPLATE_RP11` + `--version 11`。
- 在 Axure 11 中验证 RP9 时，复制为 `*-rp11-verify.rp` 再打开；升级只发生在副本。
- 不混用 RP9/RP11 模板，不覆盖用户原稿。

## 7. 失败与回退

| 情况 | 处理 |
|---|---|
| preflight 失败 | 返回 `blocked`，给出 `ZEE_RP_HOME` / venv / 模板修复动作 |
| 缺少空白模板 | 返回 `blocked`，要求在对应 Axure 版本新建单页空白工程 |
| 输出已存在 | 换新文件名，不删除原工程 |
| Axure 版本不匹配 | 停止并询问；不得静默升级 |
| 原生工具不可用 | 回退「仅 HTML」或停止；不得静默改用 Pen |

## 8. 边界

- 接管 GUI 前必须告知版本、文件、动作（点击/输入/保存/关闭）并取得确认。
- 不操作用户已打开的工程；不覆盖原稿；不删除用户文件。
- 不把结构校验、截图对比或本地预览说成 Axure 原生验收。
- zee-rp 是独立实验性项目，不是 Axure 官方产品。
- OpenDesign 未实现前，不得用本适配器冒充。
