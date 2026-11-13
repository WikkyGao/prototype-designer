# 便签样式与创建

> 便签（note）是 pen.dev 中的特殊节点类型，用于在设计稿中添加注释、说明文档、功能描述等内容。
> **schema 2.22（CLI 0.3.16）更新**：note 新增 `color` 属性（背景色，默认 `#FEE484`）；同时 note 移除了 TextStyle——`fontSize` / `lineHeight` / `fontWeight` 等排版属性对 note 不再生效，需要排版控制时用 frame + text。

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

**背景色**：note 自带 `color` 属性可直接上背景色；note 仍不支持 `fill`。

---

## 创建示例

### 方式 1: 纯 note + `color`（推荐，schema 2.22 起）

```javascript
note=Insert(document,{
  type:"note", name:"功能说明",
  content:"本页面用于展示用户管理功能...",
  x:100, y:100, width:350,
  color:"#E3F2FD"
})
```

- 高度随内容自动计算，无需设 height
- 内容内用 `\n` 换行
- 无排版属性：字号/行高不可控，适合快速标注

### 方式 2: frame 包裹 + text（需要字号 / 行高 / 标题时）

```javascript
noteFrame=Insert(document,{
  type:"frame", x:100, y:100, width:370,
  fill:"#E3F2FD", cornerRadius:8, padding:16, layout:"vertical"
})
noteTitle=Insert(noteFrame,{ type:"text", name:"功能说明标题", content:"📝 功能说明", fontSize:16, fontWeight:"bold", fill:"#1976D2" })
noteBody=Insert(noteFrame,{ type:"text", name:"功能说明正文", content:"本页面用于...", width:340, fontSize:14, lineHeight:1.6, textGrowth:"fixed-width" })
```

---

## 使用建议

1. **颜色一致性**: 项目中每种类型便签保持颜色一致
2. **位置规范**: 放在画布右侧或底部，距主要内容至少 50px；不遮挡主要内容
3. **命名规范**: 使用清晰的中文名称，如 "功能说明"、"字段说明"
4. **内容精简**: 保持便签内容简洁，避免过多细节
5. **定期维护**: 随项目进展及时更新便签内容

---

## 在原型生成中的应用

便签内容映射到原型右侧面板的说明卡片：
- 便签类型 → 卡片颜色（左边框强调）
- 便签内容 → 卡片正文
- 6 种便签类型对应 6 种卡片样式（详见 [prototype-generation.md](prototype-generation.md) 第五节）
