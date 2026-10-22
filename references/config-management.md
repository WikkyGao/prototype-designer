# 配置文件管理与双向同步

> 管理 `components.json` 配置与组件库文件之间的一致性。
> 模式 1 对应 `.pen` 控件库；模式 2（仅 HTML）对应 `component-library.html`；模式 3（Axure）对应 `.rp` 母版 / `.rplib`；模式 4（Figma）对应云端 library / 已发布组件。四者共用同一份 `components.json`，用 `source` 区分。

---

## components.json 结构

```json
{
  "version": "1.2.0",
  "libraryFile": "控件库.pen",
  "htmlLibraryFile": "component-library.html",
  "axureLibraryFile": "控件库.rplib",
  "axureMasterFile": "控件库.rp",
  "figmaFileKey": "AbCdEf123456",
  "lastUpdated": "2026-04-24T00:00:00Z",
  "categories": [
    { "id": "basic", "name": "基础", "prefix": "btn-", "description": "基础交互组件" },
    { "id": "form", "name": "表单", "prefix": "input-", "description": "表单输入组件" },
    { "id": "layout", "name": "布局", "prefix": "card-", "description": "页面布局组件" }
  ],
  "components": [
    {
      "id": "comp-001",
      "name": "btn-primary",
      "category": "basic",
      "nodeId": "abc123",
      "description": "主要按钮组件",
      "createdAt": "2026-04-24T00:00:00Z",
      "usageCount": 5
    },
    {
      "id": "comp-html-001",
      "name": "btn-primary",
      "category": "basic",
      "source": "html",
      "snippetId": "btn-primary",
      "className": "btn btn-primary",
      "dependencies": ["--color-primary", "--radius-sm"],
      "description": "主要按钮组件（HTML 片段）",
      "createdAt": "2026-10-22T00:00:00Z",
      "usageCount": 2
    },
    {
      "id": "comp-axure-001",
      "name": "btn-primary",
      "category": "basic",
      "source": "axure",
      "format": "axure",
      "master": "按钮-主要",
      "libraryFile": "控件库.rplib",
      "widgetName": "Primary Button",
      "description": "主要按钮组件（Axure 母版/元件库）",
      "createdAt": "2026-10-22T00:00:00Z",
      "usageCount": 0
    },
    {
      "id": "comp-figma-001",
      "name": "btn-primary",
      "category": "basic",
      "source": "figma",
      "format": "figma",
      "figmaFileKey": "AbCdEf123456",
      "componentKey": "c1234567890",
      "nodeId": "12:34",
      "libraryName": "Design System",
      "description": "主要按钮组件（Figma 已发布组件）",
      "createdAt": "2026-10-22T00:00:00Z",
      "usageCount": 0
    }
  ]
}
```

**字段说明**:

| 字段 | 说明 |
|------|------|
| `version` | 配置文件版本号 |
| `libraryFile` | 控件库 .pen 文件路径 |
| `htmlLibraryFile` | HTML 组件库文件路径（模式 2） |
| `axureLibraryFile` | Axure `.rplib` 元件库路径（模式 3） |
| `axureMasterFile` | Axure 母版工程路径（模式 3） |
| `figmaFileKey` | Figma 云端文件 key（模式 4） |
| `lastUpdated` | 最后更新时间戳 |
| `categories[].prefix` | 组件命名前缀，用于快速筛选 |
| `components[].source` | `pen` / `html` / `axure` / `figma`，缺省为 `pen` |
| `components[].nodeId` | 模式 1：控件库中对应的节点 ID |
| `components[].snippetId` | 模式 2：`<template data-component>` 的值 |
| `components[].className` | 模式 2：复用时需要带上的类名 |
| `components[].dependencies` | 模式 2：依赖的 CSS 变量 |
| `components[].master` | 模式 3：RP/1 `masters` 或 `.rp` 中的母版名 |
| `components[].libraryFile` + `widgetName` | 模式 3：`.rplib` 元件定位 |
| `components[].figmaFileKey` | 模式 4：Figma 文件 key |
| `components[].componentKey` + `nodeId` | 模式 4：已发布组件 key / 节点定位 |
| `components[].libraryName` | 模式 4：Figma library 名称 |
| `components[].usageCount` | 组件被引用次数 |

**使用模式**:
- 查找某类组件 → 读 `categories` 定位 `prefix` → 过滤 `components`
- 记录使用 → `usageCount += 1` → 更新 `lastUpdated`

---

## 双向同步流程

### 配置 → .pen（验证）

1. 读取 `components.json`，提取所有 `source: "pen"` 的 `nodeId` 列表
2. 使用 `execute` 的 `Get({ nodeIds })` 批量检查节点在控件库中是否存在
3. 记录不存在的 `nodeId`

**结果**:
- ✅ 全部存在 → 同步正常
- ❌ 部分不存在 → 记录差异，触发冲突处理

### .pen → 配置（发现）

1. 使用 `execute` 的 `Get(n => n.reusable && Print(n.id, n.name))` 搜索所有可复用节点
2. 提取节点 ID 和名称
3. 对比 `components.json` 中的 `nodeId` 列表
4. 记录未注册的组件

**结果**:
- ✅ 全部已注册 → 同步正常
- ❌ 存在未注册组件 → 提示添加到配置

### HTML 模式同步（模式 2）

**配置 → 组件库（验证）**：读取 `source: "html"` 条目的 `snippetId`，逐个在 `component-library.html` 中查找 `template[data-component="{snippetId}"]`，缺一即记为差异。

**组件库 → 配置（发现）**：解析 `component-library.html` 中全部 `template[data-component]`，与配置里的 `snippetId` 对比，未登记的提示补充。

**额外校验**：组件内交互节点是否有 `data-context`；`dependencies` 中的 CSS 变量是否都存在于 `UI Design.html` 的 `:root`。

### Axure 模式同步（模式 3）

**配置 → 母版/元件库（验证）**：
- `master` 条目：用 `node bin/axure.mjs rp-read "$axureMasterFile" --json` 检查母版名是否存在
- `libraryFile` + `widgetName` 条目：用 `rp-read` 检查 `.rplib` 中是否存在该元件，或按 zee-rp `clone-library-widget` 的定位方式核对

**母版/元件库 → 配置（发现）**：读取 `.rp` 的 masters 与 `.rplib` 的元件清单，和 `source: "axure"` 条目比对，未登记的提示补充。

**额外校验**：RP/1 `masters` 只能包含基础元件；含动态面板或中继器的母版会被 zee-rp 拒绝，应改用 `.rplib` 克隆或页面内组件。

### Figma 模式同步（模式 4）

**配置 → 云端（验证）**：读取 `source: "figma"` 条目的 `figmaFileKey` / `componentKey` / `nodeId`，用 `get_libraries` + `get_library_items`（或 `search_design_system`）核对组件是否仍可用；文件 key 不匹配记为差异。

**云端 → 配置（发现）**：读取当前文件的已发布组件与 library 组件，和 `source: "figma"` 条目比对，未登记的提示补充；只登记已发布或可复用组件，不把普通图层当组件。

**额外校验**：只读席位仍可做发现与验证，但不能创建/修改组件；`componentKey` 与 `nodeId` 至少有一个可用于定位；不把 Figma URL 当成本地文件路径。

### 冲突处理

发现差异时提供三种选项：

| 选项 | 适用场景 | 操作 |
|------|---------|------|
| 以配置为准 | 配置文件是最新的，设计文件滞后 | 删除 .pen 中未注册的组件；Figma 侧只移除配置，不自动删云端组件 |
| 以 .pen 为准 | 设计文件是最新的，配置文件滞后 | 为未注册组件生成配置记录 |
| 手动合并 | 双方都有更新，需要人工判断 | 展示差异详情，逐项处理 |

**差异报告格式**:

```
=== 同步差异报告 ===

【仅存在于配置中】
- btn-primary (nodeId: abc123)
- input-email (nodeId: def456)

【仅存在于 .pen 中】
- card-dashboard (nodeId: ghi789)
- chart-line (nodeId: jkl012)

【处理选项】
1. 以配置为准（删除 .pen 中未注册组件）
2. 以 .pen 为准（添加到配置）
3. 手动选择（逐项处理）
```

---

## 校验步骤（6 步）

### 步骤 1: 检查 components.json

- 文件是否存在
- JSON 格式是否正确
- 必需字段是否完整（`version`, `libraryFile`, `categories`, `components`）

**失败处理**:
- 不存在 → 创建默认配置
- 格式错误 → 提示修复或重建
- 字段缺失 → 补充默认值

### 步骤 2: 检查组件库文件

模式 1：按 `控件库.pen` > `lib.pen` > `component.lib` > `*.lib.pen` 检查是否存在有效控件库文件。
模式 2：检查 `htmlLibraryFile` 指向的 `component-library.html` 是否存在、是否能解析出 `<template data-component>`。
模式 3：检查 `axureMasterFile` / `axureLibraryFile` 指向的 `.rp` / `.rplib` 是否存在，能否用 `rp-read` 解析。
模式 4：检查 `figmaFileKey` 是否可从 URL 或用户输入解析，`get_libraries` / `search_design_system` 是否可访问目标组件。

**失败处理**:
- 不存在 → 创建新的组件库文件（模式 2 按 [html-only-mode.md](html-only-mode.md) 的骨架创建）
- 损坏 → 提示重建选项

### 步骤 3: 验证组件标识存在性（按 source 分支）

```javascript
// source = pen
nodeIds = config.components.filter(c => (c.source ?? 'pen') === 'pen').map(c => c.nodeId)
result = execute({ filePath: "控件库.pen", input: "Get(" + JSON.stringify(nodeIds) + ", {depth:1})" })

// source = html
snippetIds = config.components.filter(c => c.source === 'html').map(c => c.snippetId)
// 在 component-library.html 中查找 template[data-component=...]，无需 pen 工具

// source = axure
// 用 rp-read 检查 master 是否存在；用 .rplib 清单核对 libraryFile + widgetName

// source = figma
// 用 get_libraries / get_library_items / search_design_system 核对 componentKey / nodeId
```

**失败处理**: 发现缺失 nodeId / snippetId / componentKey → 记录差异，触发同步流程

### 步骤 4: 扫描未注册组件

```javascript
// source = html：解析 template[data-component]，与 snippetId 列表比对
reusableNodes = batch_get({
  filePath: "控件库.pen",
  patterns: [{ reusable: true }],
  readDepth: 1, searchDepth: 3
})
registeredIds = config.components.map(comp => comp.nodeId)
unregisteredNodes = reusableNodes.filter(node => !registeredIds.includes(node.id))
```

Figma：不扫描普通图层，只对比已发布组件 / library 组件；未发布组件不自动登记。

**失败处理**: 发现未注册组件 → 记录差异，触发同步流程

### 步骤 5: 生成差异报告

```
=== 校验差异报告 ===

【缺失的组件 nodeId】（配置中存在但 .pen 中不存在）
- btn-primary (nodeId: abc123)

【未注册的可复用组件】（.pen 中存在但配置中不存在）
- card-dashboard (nodeId: ghi789)

【建议操作】
1. 执行同步以修复差异
2. 手动选择处理方式
```

### 步骤 6: 提供同步选项

```
检测到配置与控件库不一致，请选择处理方式：

[1] 以配置为准 - 删除 .pen 中未注册的组件
[2] 以 .pen 为准 - 将未注册组件添加到配置
[3] 手动合并 - 逐项处理每个差异
[4] 忽略差异 - 继续使用（可能导致不一致）
```

### 异常场景处理

| 场景 | 处理 |
|------|------|
| .pen 文件被锁定 | 等待 2 秒后重试；3 次仍锁定 → 提示用户关闭其他程序 |
| batch_design 部分失败 | 提取失败项，修复后仅重试失败操作 |
| 磁盘空间不足 | 提示用户检查磁盘，清理后重试 |
| save() 持久化失败 | 检查文件路径权限和磁盘状态 |

---

## CLI 降级处理

| 场景 | 处理 |
|------|------|
| `pen interactive` 启动超时 | 重试 1 次；仍失败 → 降级为纯 CLI 操作 |
| MCP 返回 `tool_not_found` | 确认 Interactive Shell 仍在运行、Pen.app 已启动，必要时重启 |
| `execute` 部分失败 | 用返回 `editId` + `edits` 打补丁重试，勿重发 snippet |
