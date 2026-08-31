# pen.dev MCP 工具完全参考

> 对应 Pen.app 1.2.5+ MCP server。MCP 工具已从 9 个重构为 **4 个**：
> `execute` / `get_app_state` / `get_guidelines` / `browser`。
> 旧的 `batch_design`、`batch_get`、`get_editor_state`、`get_screenshot`、`export_nodes`、`get_variables`、`set_variables`、`snapshot_layout` 全部移除。
>
> 启动参数（桌面端）：`mcp-server --app desktop --agent claudeCodeCLI`。
> 桌面连接需 **Pen.app 正在运行**，否则返回空。

---

## 一、工具总览

| 工具 | 用途 | 必填参数 |
|---|---|---|
| `get_app_state` | 当前 app/画布/浏览器状态 + schema + 设计指南 | `include_schema`、`include_canvas_design`、`include_scripts_and_shaders`（三者必填） |
| `execute` | 执行 JS snippet 增删查改节点、变量、截图、导出 | `filePath`；`input`（首次）或 `editId`+`edits`（修补） |
| `get_guidelines` | 加载设计指南（guide）与视觉风格（style） | 无；`category`/`name`/`params` 按需 |
| `browser` | 真实网页 → 可编辑画布图层 / 截图 / 取 DOM | `filePath`、`action` |

> ⚠ `execute` 的官方说明写在 `get_app_state` 的返回里。也可在 CLI headless 下用 `read_skill({ path: "execute.md" })` 拉取（见 [execute-api.md](execute-api.md)）。

---

## 二、get_app_state

获取任务所需的当前状态。**只请求你确定需要的部分**，避免拉满上下文。

```json
{
  "include_schema": true,                       // .pen 文件 schema
  "include_canvas_design": true,                // 画布编辑器通用操作说明
  "include_scripts_and_shaders": false          // 仅当要用脚本/着色器时置 true
}
```

> ⚠ 三者都是**必填**布尔。为空或 false 过多会返回空内容。
> 桌面端且 Pen.app 未启动 → 返回空，需先启动应用或改用 `pen interactive` headless。

---

## 三、execute

执行一段小型 JavaScript snippet 修改文档。完整 API、操作签名、失败修补机制见 [execute-api.md](execute-api.md)。

```json
{
  "filePath": "design.pen",                     // 目标 .pen 文件路径（必填）
  "input": "<JS snippet>"                       // 首次执行的代码（与 edits 互斥）
}
```

失败时修补（**绝不重发整个 snippet**）：

```json
{
  "filePath": "design.pen",
  "editId": "<失败信息中的 id>",
  "edits": [
    { "find": "原 snippet 精确文本", "replace": "替换文本" },
    { "find": "...", "replace": "...", "all": true }
  ]
}
```

输入输出契约：
- 出错时本次所有修改 + 创建的全局变量**全部回滚**
- 响应末尾返回 **name → id 映射**
- 必须在下次 execute 中修掉响应里的 **warnings**
- ⚠ **headless shell 输入格式**：在 `pen interactive` 交互 shell 里，`input` 是 JSON 字符串，**必须单行、内部双引号用 `\"` 转义、不能有字面换行**；多语句用 `;` 分隔。换行或裸引号会被 shell 解析器判为 `Invalid syntax`。经 MCP 工具调用（结构化 JSON）则无此限制。
- 无 `fill` 的文本/图形节点会被标记为 warning（不可见），务必显式设 `fill`。

---

## 四、get_guidelines

加载任务相关的设计指南与视觉风格。风格（style）**只提供参考值，不写入变量**。

```json
// 1) 列出全部可用 guide / style
{ }

// 2) 加载指定指南（或先拿所需 params）
{ "category": "guide", "name": "landing-page" }

// 3) 带参数加载指南 / 风格
{ "category": "style", "name": "minimal", "params": { "accent": "#A3B59A" } }
```

| 字段 | 说明 |
|---|---|
| `category` | `"guide"`（任务型指令）/ `"style"`（字体/配色/图像风格原型） |
| `name` | 来自清单的名称 |
| `params` | 第 2 步返回的必填键值对 |

> 不要一次请求互不兼容的多份指南，按当前任务只取需要的。

---

## 五、browser

与 app 内置浏览器里的**真实网页**交互：打开 URL、把页面（或某元素）复现为可编辑画布图层、截图、或把 DOM/截图拉回对话。

```json
// 打开页面（其他 action 的前置条件）
{ "filePath": "design.pen", "action": "load-page", "url": "https://example.com" }

// 把指定元素复现为可编辑画布图层（响应报告顶层 frame id，供 execute 使用）
{ "filePath": "design.pen", "action": "import-to-canvas", "target": "query", "querySelector": "header.hero" }

// 取元素 DOM + 计算样式（文本）
{ "filePath": "design.pen", "action": "return-element", "target": "query", "querySelector": ".pricing-card" }

// 截图看（返回图片给你自己看）
{ "filePath": "design.pen", "action": "return-screenshot", "target": "full-page" }

// 截图落到画布（作为图片节点）
{ "filePath": "design.pen", "action": "screenshot-to-canvas", "target": "full-page" }
```

### action 枚举

| action | 说明 |
|---|---|
| `load-page` | 打开内置浏览器并加载 `url`；加载完成或失败返回 |
| `import-to-canvas` | 把目标复现为可编辑画布图层；导入节点 `context` 记录源元素 tag（如 `Card - div`） |
| `screenshot-to-canvas` | 把目标截图作为图片放到画布 |
| `return-element` | 返回目标元素的 DOM + 计算样式文本 |
| `return-screenshot` | 返回目标截图图片（给你看） |

### target 枚举

| target | 说明 |
|---|---|
| `full-page` | 整页（默认） |
| `selection` | 用户在浏览器里用元素选择器挑中的（没有则报错） |
| `query` | 由 `querySelector` 解析出的元素 |

### 使用要点

- **先 `load-page`** 再调用其他 action；页面未加载会失败
- localhost 开发服务器通常热更新：页面已加载时跳过 `load-page` 直接 `return-screenshot`
- 优先 `target: "query"` / `"selection"`，避免 `full-page` 撑爆上下文
- `return-element` 对 `body`/`html` 或宽泛选择器要谨慎——整页 DOM 可能极大；改用具体 section 或 `return-screenshot`
- `return-screenshot` 给你**肉眼看**；`screenshot-to-canvas` / `import-to-canvas` 把结果放进**用户文档**
- 导入后是**普通画布节点**，之后用 `execute` 编辑，**不要再按 HTML/CSS 思维处理**

### 典型流程

1. 复现 hero：`load-page`(url) → `import-to-canvas`(target:query, querySelector:".hero")
2. 忠实还原组件：`return-element`(.pricing-card) 读 DOM/样式 → `return-screenshot`(.pricing-card) 对比自己的渲染
3. 闭环本地生成的页面：`load-page`(localhost) → `return-screenshot`(full-page)
