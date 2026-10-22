# Context 交互模板

> 交互型节点的 context 属性格式、模板和自动记录流程。

---

## context 属性说明

context 是每个交互型节点上的不可见元数据，存储交互行为、数据绑定、导航目标等运行时信息。开发阶段可直接读取。

**格式**: JSON 字符串

**载体**:
- 模式 1（.pen）：节点 `context` 属性，通过 `execute` 的 `Update` 写入
- 模式 2（仅 HTML）：节点 `data-context` 属性，写作时内联，值同样是 JSON 字符串
- 模式 4（Figma）：Figma 节点没有等价 `context` 字段；交互从 PRD、Figma 原型连线与用户补充信息推导，生成 HTML 时写入 `data-context`

下文模板模式 1 / 2 通用，仅存放位置不同；模式 3 的原生交互写在 RP/1 `on` 中，生成 HTML 原型时再转成 `data-context`；模式 4 只在 HTML 阶段落 `data-context`，不回写 Figma。

**核心字段**: `trigger`（click/change/input/submit）、`action`、`target`、`onSuccess`、`onError`、`loading`、`confirm`

---

## 交互型节点识别

以下节点类型需要记录 context：

| 节点类型 | 命名特征 | 必需 |
|----------|---------|------|
| 按钮 | 名含 `btn-` | ✅ |
| 输入框 | 名含 `input-` | ✅ |
| 选择器 | 名含 `select-` | ✅ |
| 开关 | 名含 `switch-` | ✅ |
| 导航项 | 名含 `nav-`/`tab-`/`menu-` | ✅ |
| 链接文本 | 含 URL 或跳转说明 | ✅ |
| 图标按钮 | 名含 `icon-btn` | ✅ |
| 可点击卡片/行 | 容器型可点击元素 | 按需 |
| 纯展示元素 | 标题、分隔线、背景 | ❌ |

---

## Context 模板表

### 按钮 (btn-*)

| 场景 | context |
|------|---------|
| 提交/保存 | `{"trigger":"click","action":"submit","target":"/api/submit","method":"POST","validate":["required"],"onSuccess":"toast:提交成功","onError":"toast:提交失败","loading":true}` |
| 取消 | `{"trigger":"click","action":"navigate","target":"返回上一页"}` |
| 删除 | `{"trigger":"click","action":"delete","confirm":"确认删除？","loading":true}` |
| 搜索 | `{"trigger":"click","action":"filter","target":"/api/search"}` |

### 输入框 (input-*)

| 场景 | context |
|------|---------|
| 文本输入 | `{"type":"text","field":"fieldName","placeholder":"提示文字","required":false}` |
| 搜索框 | `{"type":"search","field":"keyword","debounce":300,"placeholder":"搜索..."}` |
| 邮箱 | `{"type":"email","field":"email","required":true,"validate":"email_format"}` |

### 选择器 (select-*)

```json
{"type":"single","field":"category","options":"来自 /api/options","searchable":true,"onChange":"联动行为"}
```

### 开关 (switch-*)

```json
{"type":"switch","field":"status","default":false,"api":"/api/toggle","method":"PATCH"}
```

### 导航 (nav-*/tab-*)

```json
{"trigger":"click","action":"navigate","target":"/dashboard","active":"匹配路由高亮"}
```

### 可点击卡片/行

```json
{"trigger":"click","action":"navigate","target":"/users/{{row.id}}","hover":"cursor:pointer"}
```

---

## 优先级

**PRD.md 交互需求 > 节点命名推断 > 默认惯例**

- `btn-delete` → 推断为 DELETE 操作
- `btn-submit` → 推断为 SUBMIT 操作

---

## 自动记录流程

**执行时机**: 步骤 6（组件库管理）完成后、步骤 8（原型生成）之前

1. 遍历所有交互型节点
2. 根据节点类型匹配模板
3. 从 PRD.md 提取对应交互规格
4. 将模板填充后写入节点 `context` 属性
5. 无明确规格的写入默认行为
6. 批量 `U(nodeId,{context:"..."})` 一次性写入
7. `batch_get` 验证所有 context 已写入

**验证清单**:

```
□ 所有 btn-* 节点有 context
□ 所有 input-* 节点有 context
□ 所有 select-* 节点有 context
□ 所有 switch-* 节点有 context
□ 所有 nav-*/tab-* 节点有 context
□ 所有 icon-btn 节点有 context
□ 所有可点击卡片有 context
```

---

## PRD.md 回写

发现新增交互（PRD.md 中未记录的）时：

1. 整理差异清单
2. **按 SKILL.md §0.5.0 提问协议确认**: "发现新增交互，是否更新 PRD.md？[1] 全部写入 [2] 仅指定项 [3] 跳过"
3. 修改 PRD.md（追加不覆盖）

---

## Interactive Shell 写入示例

```
# 创建节点时附带 context
batch_design({ operations: 'btn=I(formArea,{type:"ref",ref:"btn-primary",context:"{\"trigger\":\"click\",\"action\":\"submit\",\"loading\":true}"})' })

# 批量更新已有节点
batch_design({ operations: 'U(btnCancel,{context:"{\"trigger\":\"click\",\"action\":\"navigate\",\"target\":\"/login\"}"})' })
```
