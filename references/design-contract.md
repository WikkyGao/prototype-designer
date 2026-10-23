# 设计适配器契约

> 本文件定义 `prototype-designer` 与 `adapters/` 下各工具子技能的边界。
> 适配器架构已完成：Pen / Axure / Figma 已迁移，OpenDesign 保持 `planned` 占位。T8 只决定原生/仅 HTML，具体工具由 `prototype-designer` 选择。

## 1. 分层与职责

| 层 | 负责 | 不负责 |
|---|---|---|
| `requirement-analysis` | 需求分析、PRD、询问是否做原型 | 具体设计工具、适配器 preflight |
| `prototype-designer` | 设计编排、公共检查、页面/交互模型、HTML 渲染、验收汇总 | 各工具的原生文件细节 |
| `adapters/<id>` | 原生文件的创建、读取、修改、验证 | PRD、HTML 外壳、总入口路由 |

调用方向固定为：

```text
requirement-analysis
        ↓ DesignRequest
prototype-designer
        ↓ 读取 adapters.json + adapter.json
adapters/pen | adapters/axure | adapters/figma | adapters/opendesign
        ↓ DesignResult
prototype-designer
        ↓ HTML + manifest
requirement-analysis
```

适配器不得反向调用 `requirement-analysis`，也不得自行生成评审外壳；HTML 外壳由公共核心按 `prototypeStyle` 生成。

## 2. 目录结构

```text
prototype-designer/
├── SKILL.md
├── adapters.json
├── references/
│   ├── design-contract.md
│   ├── prototype-generation.md
│   ├── html-only-mode.md
│   └── ...
└── adapters/
    ├── pen/
    │   ├── SKILL.md
    │   ├── adapter.json
    │   ├── references/
    │   └── assets/
    ├── axure/
    │   ├── SKILL.md
    │   ├── adapter.json
    │   ├── references/
    │   └── scripts/
    ├── figma/
    │   ├── SKILL.md
    │   ├── adapter.json
    │   └── references/
    │       └── figma-mcp.md
    └── opendesign/
        ├── SKILL.md
        ├── adapter.json
        └── references/
            └── research-checklist.md
```

- `adapters.json` 只负责发现：列出有哪些适配器、目录在哪里。
- 每个 `adapter.json` 是能力事实来源：状态、格式、依赖、preflight、验收层级。
- 适配器的 `SKILL.md` 是独立说明；已迁移工具（Pen / Axure / Figma）由适配器承载，OpenDesign 仍为占位。
- 子技能拥有独立目录、文档、脚本与测试，但**不单独触发**；由 `prototype-designer` 读取。

## 3. 适配器索引

`adapters.json`：

```json
{
  "schemaVersion": "1.0",
  "updated": "2026-10-22",
  "adapters": [
    { "id": "pen", "path": "adapters/pen", "entry": "SKILL.md" },
    { "id": "axure", "path": "adapters/axure", "entry": "SKILL.md" },
    { "id": "figma", "path": "adapters/figma", "entry": "SKILL.md" },
    { "id": "opendesign", "path": "adapters/opendesign", "entry": "SKILL.md" }
  ]
}
```

新增工具时只追加一条索引，不改 `requirement-analysis`。索引与 `adapter.json` 冲突时，以 `adapter.json` 为准。

## 4. `adapter.json`

```json
{
  "schemaVersion": "1.0",
  "id": "pen",
  "name": "pen.dev",
  "version": "0.1.0",
  "status": "ready",
  "migrationState": "extracted",
  "nativeFormat": ".pen",
  "htmlPolicy": "required",
  "requires": ["node>=18", "pen>=0.3.12", "pen-auth"],
  "preflight": null,
  "capabilities": {
    "create": true,
    "read": true,
    "edit": true,
    "verify": true
  },
  "acceptance": ["structural", "preview"],
  "entry": "SKILL.md"
}
```

| 字段 | 允许值 | 说明 |
|---|---|---|
| `status` | `ready` / `planned` / `disabled` | 用户是否可以选择该工具 |
| `migrationState` | `scaffolded` / `extracted` / `planned` | 骨架、已迁移、仅规划 |
| `nativeFormat` | 字符串 | `.pen`、`.rp`、`TBD` 等 |
| `htmlPolicy` | `required` / `optional` / `unsupported` | 是否必须、可选或不能产出 HTML |
| `requires` | 字符串数组 | 运行前置条件，供 preflight 展示 |
| `preflight` | 相对路径或 `null` | 从适配器目录解析；未实现时可暂为 `null` |
| `executionModes` | 字符串数组，可选 | 执行模式，如 Axure 的 `cli` / `gui-acceptance`；未声明视为单一默认模式 |
| `defaultExecutionMode` | 字符串，可选 | 默认执行模式，必须是 `executionModes` 的一项 |
| `capabilities` | 布尔对象 | 创建、读取、修改、验证 |
| `acceptance` | 字符串数组 | `structural` / `native-open` / `preview` / `gui-roundtrip` |

`status=planned` 的适配器不得执行任何生成命令；只能返回 `blocked`，由编排层提供「仅 HTML」或停止。

## 5. `DesignRequest`

由 `requirement-analysis` 或独立设计入口构造：

```json
{
  "schemaVersion": "1.0",
  "mode": "standard",
  "prdPath": "/abs/docs/PRD.md",
  "projectRoot": "/abs/project",
  "projectName": "订单工作台",
  "userRequest": "做一个订单工作台，包含订单列表和刷新操作",
  "pages": [
    {
      "id": "orders",
      "name": "订单列表",
      "route": "/orders",
      "modules": ["订单管理"],
      "priority": "must",
      "source": "PRD.md#订单列表"
    }
  ],
  "tokens": {
    "sources": ["docs/tokens.json", "docs/variables.css"],
    "values": {}
  },
  "componentLibrary": {
    "format": "pen",
    "path": "控件库.pen",
    "components": []
  },
  "outputDir": "/abs/project/prototype",
  "output": "native",
  "adapter": null,
  "html": true,
  "constraints": {
    "viewport": "1440x900",
    "locale": "zh-CN",
    "theme": "enterprise-light",
    "notes": []
  }
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `schemaVersion` | 是 | 当前为 `1.0` |
| `mode` | 是 | `standard` / `quick` / `incremental` / `standalone` |
| `prdPath` | 否 | 独立设计入口可为 `null` |
| `projectRoot` | 是 | 绝对路径；所有相对路径以此为基准 |
| `projectName` | 是 | 用于标题、文件命名与 manifest |
| `userRequest` | 否 | 用户原始需求，用于补充 PRD 未覆盖的语义 |
| `pages` | 是 | 页面清单；至少 1 项 |
| `tokens` | 否 | 设计令牌来源与合并值 |
| `componentLibrary` | 否 | 控件库信息；无则为 `null` |
| `outputDir` | 是 | 绝对路径 |
| `output` | 是 | `html`（无原生工具）或 `native` |
| `adapter` | 否 | 原生工具 id；T8 留空，由 `prototype-designer` 选择 |
| `html` | 是 | 是否同时产出 HTML |
| `constraints` | 否 | 视口、语言、主题与附加约束 |

约束规则：

- `output=html` 时 `adapter` 必须为 `null`，`html` 必须为 `true`。
- `output=native` 时 `adapter` 可为 `null`：由 `prototype-designer` 在已注册且 `status=ready` 的适配器中询问并选择；非空时必须是已注册且 `status=ready` 的适配器。
- `adapter.htmlPolicy=required` 时 `html` 必须为 `true`；`unsupported` 时必须为 `false`。
- `requirement-analysis` 的 T8 只构造 `output` / `html` / PRD 与项目字段，不填写 `adapter`，也不询问具体设计工具。
- `pages[].priority` 使用 `must` / `should` / `could` / `wont`。
- 适配器不得修改 `DesignRequest`；需要补充信息时返回 `blocked` 与 `nextActions`。

## 6. `DesignResult`

```json
{
  "schemaVersion": "1.0",
  "adapter": "pen",
  "status": "ok",
  "files": {
    "native": "/abs/project/prototype/design.pen",
    "html": "/abs/project/prototype/design-prototype.html",
    "manifest": null,
    "tokens": "/abs/project/docs/tokens.json",
    "componentLibrary": "/abs/project/控件库.pen"
  },
  "pages": [
    {
      "id": "orders",
      "name": "订单列表",
      "route": "/orders",
      "selector": "[data-page=\"订单列表\"]",
      "contextCount": 1
    }
  ],
  "interactions": [
    {
      "page": "orders",
      "node": "refresh",
      "trigger": "click",
      "action": "set-text",
      "target": "title",
      "value": "已刷新"
    }
  ],
  "acceptance": {
    "structural": { "status": "passed", "evidence": "problems=0" },
    "nativeOpen": { "status": "not_run", "evidence": null },
    "preview": { "status": "not_run", "evidence": null },
    "guiRoundtrip": { "status": "unsupported", "evidence": null }
  },
  "limitations": [],
  "nextActions": []
}
```

| 字段 | 说明 |
|---|---|
| `status` | `ok` / `partial` / `blocked` |
| `files.native` | 原生文件；仅 HTML 时为 `null`；Figma 为云端文件 URL |
| `files.nativeRef` | 可选：`{ provider, fileKey }`；Figma 记录 `provider:"figma"` 与 `fileKey` |
| `files.html` | 公共核心生成的 HTML；未生成时为 `null` |
| `files.manifest` | 独立 manifest 文件；内嵌时可指向 HTML 或 `null` |
| `pages` | 规范化页面清单，供 HTML 渲染与下游解析 |
| `interactions` | 规范化交互清单 |
| `acceptance` | 四个验收层级及证据 |
| `limitations` | 未完成项、工具限制、待人工确认项 |
| `nextActions` | 建议用户或编排层执行的下一步 |

验收状态只允许：`passed` / `failed` / `not_run` / `unsupported`。

| 层级 | 含义 |
|---|---|
| `structural` | 结构校验通过，例如 `.pen problems`、`.rp` 三零 |
| `native-open` | 原生文件能在目标工具中打开 |
| `preview` | 在工具预览中实际点击关键交互 |
| `gui-roundtrip` | 保存、关闭、重开后结构仍保留 |

结构通过不得写成预览通过；未完成的层级必须保留 `not_run` 并写入 `limitations`。

Figma 的 `files.native` 是云端文件 URL，不是本地 `.fig` 路径；同时用 `files.nativeRef` 记录 `provider:"figma"` 与 `fileKey`。没有真实 `file_key` 时不得伪造 URL。

## 7. 调用流程

```text
1. requirement-analysis 询问：是否生成原型
2. 若需要，询问：仅 HTML / 原生工具
3. 仅 HTML → prototype-designer 直接走公共 HTML 模式
4. 原生工具 → prototype-designer 读取 adapters.json，列出 ready 适配器
5. 用户选定 → 读取 adapter.json → 执行 preflight
6. preflight 失败 → 提供「仅 HTML」或停止，不静默切换
7. 适配器生成原生文件 → 返回 DesignResult
8. 若 html=true → 公共核心基于 pages/interactions 生成 HTML 与 manifest
9. 汇总验收层级与 limitations，交用户确认
```

## 8. 回退规则

| 场景 | 处理 |
|---|---|
| 适配器不存在 | 不显示该选项；或显示为 planned 并禁用 |
| preflight 失败 | 说明缺失项，提供「仅 HTML」或停止 |
| 原生生成失败 | 保留已生成文件，返回 `partial` / `blocked`，不伪造成功 |
| HTML 生成失败 | 原生文件仍可交付；`files.html=null`，写入 `limitations` |
| 用户拒绝原生工具 | 回退到仅 HTML，重新确认输出目录 |
| 适配器要求 HTML 但用户不要 | 拒绝该组合，要求改选或关闭原生模式 |
| Figma 席位不足 | 只读降级或停止；需要写时先提示升级席位，不静默换工具 |

## 9. 兼容别名

旧调用保留一版别名，内部映射到新字段：

| 旧模式 | 新字段 |
|---|---|
| 模式 1 `.pen + HTML` | `output=native, adapter=pen, html=true` |
| 模式 2 仅 HTML | `output=html, adapter=null, html=true` |
| 模式 3 Axure | `output=native, adapter=axure, html=true`（可关闭） |
| 模式 4 Figma（新字段） | `output=native, adapter=figma, html=true`（可关闭） |

Figma 是新增适配器，没有历史别名；旧「模式 1/2/3」只用于兼容。

## 10. 新增适配器清单

1. 新建 `adapters/<id>/`。
2. 写 `SKILL.md`：范围、输入输出、preflight、原生操作、验收、边界。
3. 写 `adapter.json`：状态、格式、依赖、能力、验收层级。
4. 在 `adapters.json` 追加索引。
5. 补 `test-prompts.json`：创建、读取、修改、失败回退。
6. 更新 `prototype-designer/SKILL.md` 的适配器列表。
7. 不改 `requirement-analysis`；它只依赖 `prototype-designer`。
8. 验证：目录可达、JSON 可解析、preflight 可执行、回退路径可走通。

## 11. 当前状态

| 适配器 | `status` | `migrationState` | 当前行为位置 |
|---|---|---|---|
| `pen` | `ready` | `extracted` | `adapters/pen/` |
| `axure` | `ready` | `extracted` | `adapters/axure/` |
| `figma` | `ready` | `extracted` | `adapters/figma/` |
| `opendesign` | `planned` | `planned` | 未实现，仅占位 |

Phase 2 已将 Axure 参考与环境检测迁入 `adapters/axure/`；Phase 3 已将 Pen 参考、示例与 MCP 文档迁入 `adapters/pen/`；Phase 4 已将 OpenDesign 固定为 `planned`，并补充调研清单与 `blocked` 回退；Phase 5 将 Figma 分支重构为 `adapters/figma/` 子技能。
