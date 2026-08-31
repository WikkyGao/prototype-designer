# 配置文件管理与双向同步

> 管理 `components.json` 配置与设计文件 `控件库.pen` 之间的一致性。

---

## components.json 结构

```json
{
  "version": "1.0.0",
  "libraryFile": "控件库.pen",
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
    }
  ]
}
```

**字段说明**:

| 字段 | 说明 |
|------|------|
| `version` | 配置文件版本号 |
| `libraryFile` | 控件库 .pen 文件路径 |
| `lastUpdated` | 最后更新时间戳 |
| `categories[].prefix` | 组件命名前缀，用于快速筛选 |
| `components[].nodeId` | 控件库中对应的节点 ID |
| `components[].usageCount` | 组件被引用次数 |

**使用模式**:
- 查找某类组件 → 读 `categories` 定位 `prefix` → 过滤 `components`
- 记录使用 → `usageCount += 1` → 更新 `lastUpdated`

---

## 双向同步流程

### 配置 → .pen（验证）

1. 读取 `components.json`，提取所有 `nodeId` 列表
2. 使用 `batch_get` 批量检查节点在控件库中是否存在
3. 记录不存在的 `nodeId`

**结果**:
- ✅ 全部存在 → 同步正常
- ❌ 部分不存在 → 记录差异，触发冲突处理

### .pen → 配置（发现）

1. 使用 `batch_get` 搜索所有 `reusable: true` 的节点
2. 提取节点 ID 和名称
3. 对比 `components.json` 中的 `nodeId` 列表
4. 记录未注册的组件

**结果**:
- ✅ 全部已注册 → 同步正常
- ❌ 存在未注册组件 → 提示添加到配置

### 冲突处理

发现差异时提供三种选项：

| 选项 | 适用场景 | 操作 |
|------|---------|------|
| 以配置为准 | 配置文件是最新的，设计文件滞后 | 删除 .pen 中未注册的组件 |
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

### 步骤 2: 检查控件库.pen

- 文件是否存在
- 是否为有效的 .pen 文件

**失败处理**:
- 不存在 → 创建新的控件库文件
- 损坏 → 提示重建选项

### 步骤 3: 验证组件 nodeId 存在性

```javascript
nodeIds = config.components.map(comp => comp.nodeId)
result = batch_get({ filePath: "控件库.pen", nodeIds: nodeIds, readDepth: 1 })
```

**失败处理**: 发现缺失 nodeId → 记录差异，触发同步流程

### 步骤 4: 扫描未注册组件

```javascript
reusableNodes = batch_get({
  filePath: "控件库.pen",
  patterns: [{ reusable: true }],
  readDepth: 1, searchDepth: 3
})
registeredIds = config.components.map(comp => comp.nodeId)
unregisteredNodes = reusableNodes.filter(node => !registeredIds.includes(node.id))
```

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
