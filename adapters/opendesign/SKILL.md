# OpenDesign 适配器（planned）

> `status: planned` ｜ `migrationState: planned`
> 尚未确认唯一官方对象、原生格式、命令与验收方式。
> 本文件只声明占位、回退和调研门槛，**不提供任何可用命令**。

## 1. 当前行为

- OpenDesign **不进入正常工具选择**；只在适配器状态或用户点名时说明。
- 用户点名 OpenDesign 时返回 `blocked`，不得猜测 CLI/API，不得伪造原生文件，不得静默改用 Pen 或 Axure。
- 可选回退只有两个：用户确认后改「仅 HTML」，或停止并等待适配器实现。

`DesignResult` 片段：

```json
{
  "schemaVersion": "1.0",
  "adapter": "opendesign",
  "status": "blocked",
  "files": {
    "native": null,
    "html": null,
    "manifest": null
  },
  "pages": [],
  "interactions": [],
  "acceptance": {
    "structural": { "status": "unsupported", "evidence": null },
    "nativeOpen": { "status": "unsupported", "evidence": null },
    "preview": { "status": "unsupported", "evidence": null },
    "guiRoundtrip": { "status": "unsupported", "evidence": null }
  },
  "limitations": ["OpenDesign 适配器尚未实现"],
  "nextActions": ["改用仅 HTML 原型", "停止并等待 OpenDesign 适配器"]
}
```

## 2. 调研边界

完整清单、证据要求和启用门槛见 [research-checklist.md](references/research-checklist.md)。

开始实现前必须先确认：

- 唯一官方对象、版本、许可证与平台
- 原生文件格式与扩展名
- CLI / API / MCP / SDK / GUI 的最小访问方式
- 认证、离线能力和凭据处理
- 文件创建、读取、修改、另存的闭环
- 组件库/母版/设计令牌的映射
- 预览、打开、往返验收的证据形式

只完成文档调研、没有真实文件或调用记录时，不得把 `status` 改为 `ready`。

## 3. 契约

- `adapter.json`：`status=planned`、`migrationState=planned`、`nativeFormat=TBD`、`htmlPolicy=optional`
- `capabilities` 全为 `false`
- `acceptance` 为空
- `preflight` 为 `null`
- 输入输出遵循 `../../references/design-contract.md`
- `adapters.json` 索引保持不变；启用时只更新 `adapter.json`、本文件与新增的 `references/` / `scripts/` / `assets/`

## 4. 与 T8 的关系

- `requirement-analysis` 的 T8 只决定「原生设计文件」或「仅 HTML」，不选择具体工具。
- `prototype-designer` 负责询问 Pen / Axure / Figma / OpenDesign；OpenDesign 在 `ready` 前不显示为可用选项。
- 用户点名 OpenDesign 时，由编排层返回 `blocked`；不得让 T8 直接调用 OpenDesign。
- 适配器启用后也不反向修改 T8 的路由字段，只更新 `adapters.json` 与能力声明。

## 5. 启用门槛

至少满足 [research-checklist.md](references/research-checklist.md) 的验收门槛：

1. 唯一官方来源与版本
2. 创建 → 读取 → 修改 → 另存 → 再读取闭环
3. 页面级预览或原生打开证据
4. `adapter.json` 与真实能力一致
5. `SKILL.md` 只写已验证命令
6. 创建、读取、修改、失败回退测试齐全
