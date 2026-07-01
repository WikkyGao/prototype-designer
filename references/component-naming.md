# 组件命名规范

> 详细命名规则和分类清单。主流程中只需记住前缀即可快速查找。

## 命名格式

**标准格式**: `{前缀}-{功能描述}`

- 全部小写字母
- 使用连字符 `-` 分隔单词
- 描述不超过 3 个单词
- 简洁明了

| ✅ 正确 | ❌ 错误 |
|---------|---------|
| `btn-primary` | `Button_Primary` |
| `card-user-profile` | `Card_User_Profile` |
| `input-email` | `input_email` |
| `nav-top` | `NavTop` |

**命名冲突处理**: 添加功能限定符（如 `btn-submit` 而非 `btn`）。

---

## 分类速查表

| 分类 | 前缀 | 示例 |
|------|------|------|
| 基础 | `btn-`, `icon-`, `label-`, `tag-` | `btn-primary` |
| 表单 | `input-`, `select-`, `switch-`, `checkbox-`, `radio-` | `input-email` |
| 布局 | `card-`, `container-`, `grid-`, `sidebar-`, `header-`, `footer-` | `card-dashboard` |
| 导航 | `nav-`, `tab-`, `breadcrumb-`, `menu-` | `nav-top` |
| 数据展示 | `table-`, `list-`, `chart-`, `timeline-` | `chart-line` |
| 反馈 | `modal-`, `toast-`, `alert-`, `progress-` | `modal-confirm` |

## 各类示例

### 基础组件
- `btn-primary` — 主要按钮
- `btn-danger` — 危险按钮
- `icon-user` — 用户图标
- `label-title` — 标题标签
- `tag-status` — 状态标签

### 表单组件
- `input-text` — 文本输入框
- `input-email` — 邮箱输入框
- `select-dropdown` — 下拉选择器
- `switch-toggle` — 开关切换
- `checkbox-single` — 单选复选框

### 布局组件
- `card-dashboard` — 仪表板卡片
- `card-user-profile` — 用户资料卡片
- `container-main` — 主容器
- `sidebar-navigation` — 导航侧边栏
- `header-top` — 顶部头部

### 导航组件
- `nav-top` — 顶部导航
- `nav-sidebar` — 侧边导航
- `tab-horizontal` — 水平标签页
- `breadcrumb-main` — 面包屑导航
- `menu-dropdown` — 下拉菜单

### 数据展示组件
- `table-data` — 数据表格
- `list-items` — 项目列表
- `chart-line` — 折线图
- `chart-bar` — 柱状图
- `timeline-vertical` — 垂直时间线

### 反馈组件
- `modal-confirm` — 确认对话框
- `toast-success` — 成功提示
- `toast-error` — 错误提示
- `alert-info` — 信息警告
- `progress-linear` — 线性进度条
