# 便签样式与创建

> 便签（note）是 Pencil 中的特殊节点类型，用于在设计稿中添加注释、说明文档、功能描述等内容。

---

## 便签类型与颜色方案

| 类型 | 背景色 | 标题色 | 图标 | 用途 |
|------|--------|--------|------|------|
| 功能说明 | #E3F2FD | #1976D2 | 📝 | 页面核心功能列表 |
| 字段说明 | #E8F5E9 | #388E3C | 📋 | 数据字段定义和约束 |
| 交互说明 | #F3E5F5 | #7B1FA2 | 🔄 | 用户交互流程 |
| 注意事项 | #FFF3E0 | #F57C00 | ⚠️ | 重要提醒和警告 |
| 技术备注 | #E0F7FA | #0097A7 | 💻 | 技术栈和实现细节 |
| 待办事项 | #FCE4EC | #C2185B | ✅ | 任务清单和进度 |

**重要**: Note 节点不支持 `fill` 属性设置背景色，需使用 Frame 包裹实现。

---

## 样式参数

| 参数 | 值 | 用途 |
|------|------|------|
| fontSize | 12px | 小号：备注、待办 |
| fontSize | 13px | 中号：字段说明、交互说明 |
| fontSize | 14px | 大号：主要功能说明 |
| lineHeight | 1.5 | 标准行高 |
| lineHeight | 1.6 | 宽松行高 |
| width | 250-270px | 窄：简洁内容 |
| width | 290-310px | 中等：平衡可读性 |
| width | 340px | 宽：详细说明 |

---

## 创建示例

### 方式 1: Frame 包裹（推荐，支持背景色）

```javascript
noteFrame=I(document,{
  type:"frame", x:100, y:100, width:370, height:220,
  fill:"#E3F2FD", cornerRadius:8, padding:16, layout:"vertical"
})
noteTitle=I(noteFrame,{ type:"text", content:"📝 功能说明", fontSize:16, fontWeight:"bold", fill:"#1976D2" })
note=I(noteFrame,{ type:"note", content:"本页面用于...", width:340, fontSize:14, lineHeight:1.6 })
```

### 方式 2: 纯 Note 节点（无背景色）

```javascript
note=I(document,{
  type:"note", name:"功能说明",
  content:"本页面用于展示用户管理功能...",
  x:100, y:100, width:350, fontSize:14, lineHeight:1.6
})
```

---

## 使用建议

1. **颜色一致性**: 项目中每种类型便签保持颜色一致
2. **位置规范**: 放在画布右侧或底部，距主要内容至少 50px
3. **命名规范**: 使用清晰的中文名称，如 "功能说明"、"字段说明"
4. **内容精简**: 保持便签内容简洁，避免过多细节
5. **定期维护**: 随项目进展及时更新便签内容

---

## 在原型生成中的应用

便签内容映射到原型右侧面板的说明卡片：
- 便签类型 → 卡片颜色（左边框强调）
- 便签内容 → 卡片正文
- 6 种便签类型对应 6 种卡片样式（详见 [prototype-generation.md](prototype-generation.md) 第五节）
