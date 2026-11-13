# pen.dev MCP 工具完全参考

> 本文只描述 pen.dev 的 MCP。模式 3（Axure）使用 zee-rp 的 MCP（`axure_open` / `locate` / `edit_text` / `axure_save` 等），见 [axure-mode.md](../../axure/references/axure-mode.md)。
>
> 对应 pen.dev CLI **0.3.16**（2026-11-12 发布）MCP server。MCP 工具共 **5 个**：
> `execute` / `get_app_state` / `get_style` / `read_skill` / `browser`。
>
> 0.3.16 相对 0.3.12：工具集数量不变；`get_style` 的风格清单换为**具名风格原型**（Aerial Gravitas 等，带 params 二段加载）；`read_skill` 的指南清单扩容（generate / components / code / design-system / tailwind / slides 等）；interactive shell 新增 `import_library` / `remove_library` / `list_libraries`；headless 模式用 `save()` 落盘。
> 更早移除的 `batch_design`、`batch_get`、`get_editor_state`、`get_screenshot`、`export_nodes`、`get_variables`、`set_variables`、`snapshot_layout` 同样不可用。
>
> 桌面连接需 **Pen.app 正在运行**，否则返回空。

---

## 一、工具总览

| 工具 | 用途 | 必填参数 |
|---|---|---|
| `get_app_state` | 当前 app/画布/浏览器状态、用户选择 | 无 |
| `execute` | 执行 JS snippet 增删查改节点、变量、截图、导出 | `filePath`；`input`（首次）或 `editId`+`edits`（修补）；建议传 `description` |
| `get_style` | 加载视觉风格原型（字体/配色/图像），仅参考值 | 无；`name`、`params` 按需 |
| `read_skill` | 读取官方 SKILL.md、schema、execute API 与指南 | 无；`path` 按需 |
| `browser` | 真实网页 → 可编辑画布图层 / 截图 / 取 DOM / CDP 操作 | `action`；`cdp` 时另需 `method`、`params` |

> ⚠ `execute` 的官方说明用 `read_skill({ path: "execute.md" })` 获取（见 [execute-api.md](execute-api.md)）。

---

## 二、get_app_state

获取当前文档状态、用户选择与画布基础信息。

```json
{}
```

- **无参数**（0.3.12 起不再接受 `include_schema` / `include_canvas_design` / `include_scripts_and_shaders`）
- 需要 `.pen` schema 或 execute 文档时改用 `read_skill`
- 桌面端且 Pen.app 未启动 → 返回空，需先启动应用或改用 `pen interactive` headless

---

## 三、execute

执行一段小型 JavaScript snippet 修改文档。完整 API、操作签名、失败修补机制见 [execute-api.md](execute-api.md)。

```json
{
  "filePath": "design.pen",                     // 目标 .pen 文件路径（必填）
  "description": "Add pricing section with 3 tiers",
  "input": "<JS snippet>"                       // 首次执行的代码（与 edits 互斥）
}
```

`description` 要求：3-8 个词的命令式短语，首字母大写、不加句号，会作为用户可见的操作标签。

失败时修补（**绝不重发整个 snippet**）：

```json
{
  "filePath": "design.pen",
  "description": "Fix header alignment",
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

## 四、get_style

加载视觉风格原型（style archetype）。风格**只提供参考值（字体/配色/图像），不写入变量**。

```json
// 1) 列出全部可用 style
{ }

// 2) 加载指定风格；若该风格需要 params，响应里返回必填项
{ "name": "Aerial Gravitas" }

// 3) 带参数加载风格
{ "name": "Aerial Gravitas", "params": { ... } }
```

| 字段 | 说明 |
|---|---|
| `name` | 来自清单的**具名风格**，如 `Aerial Gravitas`、`Artisan Editorial`、`Blueprint Technical`、`Modular Bento Showcase`、`Product Data Grid` 等（完整清单以 `get_style()` 返回为准） |
| `params` | 第 2 步返回的必填键值对 |

> 适合用户没有明确品牌/风格方向时选用；用户已有品牌规范时以项目令牌为准。需要任务型设计指南时用 `read_skill`，不要一次加载互不兼容的多份风格。

---

## 五、read_skill

读取 pen.dev 官方设计技能与文档。

```json
// 返回官方 SKILL.md
{ }

// 核心必读
{ "path": "pen-schema.md" }
{ "path": "execute.md" }

// 按任务选读（0.3.16 清单扩容）
{ "path": "generate.md" }                    // Generate 六种类型与配额机制
{ "path": "guide/components.md" }            // 组件与实例模式（slot、嵌套实例）
{ "path": "guide/design-system.md" }         // 设计系统组合
{ "path": "guide/web-app.md" }               // Web 应用
{ "path": "guide/mobile-app.md" }            // 移动应用
{ "path": "guide/landing-page.md" }          // 落地页
{ "path": "guide/table.md" }                 // 表格与仪表盘
{ "path": "guide/slides.md" }                // 演示幻灯片
{ "path": "guide/tailwind.md" }              // Tailwind v4 实现
{ "path": "guide/code.md" }                  // 从 .pen 生成代码
{ "path": "code-website.md" }                // 网站设计 ↔ 代码同步
{ "path": "scripts-and-shaders.md" }         // 画布脚本与着色器
```

- 首次进入 `.pen` 任务时读取 `pen-schema.md` 与 `execute.md`
- 涉及图片/SVG 生成先读 `generate.md`；组件库任务读 `guide/components.md`
- 白板/调研类（whiteboard、competitive-research、sitemap 等）与本 skill 无关，不要加载

---

## 六、browser

与 app 内置浏览器里的**真实网页**交互：打开 URL、把页面（或某元素）复现为可编辑画布图层、截图、取 DOM，或直接发送 CDP 命令。

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

// CDP：读页面标题
{ "filePath": "design.pen", "action": "cdp", "method": "Runtime.evaluate", "params": { "expression": "document.title", "returnByValue": true } }

// CDP：点击页面坐标
{ "filePath": "design.pen", "action": "cdp", "method": "Input.dispatchMouseEvent", "params": { "type": "mousePressed", "x": 100, "y": 200, "button": "left", "clickCount": 1 } }
```

### action 枚举

| action | 说明 |
|---|---|
| `load-page` | 打开内置浏览器并加载 `url`；加载完成或失败返回 |
| `import-to-canvas` | 把目标复现为可编辑画布图层；导入节点 `context` 记录源元素 tag（如 `Card - div`） |
| `screenshot-to-canvas` | 把目标截图作为图片放到画布 |
| `return-element` | 返回目标元素的 DOM + 计算样式文本 |
| `return-screenshot` | 返回目标截图图片（给你看） |
| `cdp` | 发送一条 Chrome DevTools Protocol 命令（`method` + `params`） |

### target 枚举

| target | 说明 |
|---|---|
| `full-page` | 整页（默认） |
| `selection` | 用户在浏览器里用元素选择器挑中的（没有则报错） |
| `query` | 由 `querySelector` 解析出的元素 |

### CDP 限制（0.3.12 起，0.3.16 沿用）

- 仅开放 `DOM` / `Input` / `Page` / `Runtime` / `Emulation` / `CSS` / `Accessibility` 域
- 不要发送 `Escape`：编辑器会拦截并取消选中
- 引发导航的命令（含点击链接）会在加载完成后返回
- 执行后用 `return-screenshot` 或 `return-element` 校验结果

### 使用要点

- **先 `load-page`** 再调用其他 action；页面未加载会失败
- `nodeId` 可驱动文档中的 browser 节点（**每次调用都要传**，包括 CDP）；省略则驱动侧边栏自带页面
- localhost 开发服务器通常热更新：页面已加载时跳过 `load-page` 直接 `return-screenshot`，改动不可见再 `load-page` 重载
- 优先 `target: "query"` / `"selection"`，避免 `full-page` 撑爆上下文
- `return-element` 对 `body`/`html` 或宽泛选择器要谨慎——整页 DOM 可能极大；改用具体 section 或 `return-screenshot`
- `return-screenshot` 给你**肉眼看**；`screenshot-to-canvas` / `import-to-canvas` 把结果放进**用户文档**
- 导入后是**普通画布节点**，之后用 `execute` 编辑，**不要再按 HTML/CSS 思维处理**

### 典型流程

1. 复现 hero：`load-page`(url) → `import-to-canvas`(target:query, querySelector:".hero")
2. 忠实还原组件：`return-element`(.pricing-card) 读 DOM/样式 → `return-screenshot`(.pricing-card) 对比自己的渲染
3. 闭环本地生成的页面：`load-page`(localhost) → `return-screenshot`(full-page)
4. 操作页面菜单：`DOM.querySelector` + `DOM.getBoxModel` 定位 → `Input.dispatchMouseEvent` 点击中心 → `return-screenshot` 校验

---

## 七、interactive shell 命令（0.3.16）

`pen interactive` 会话内除 MCP 工具外可用的 shell 命令：

```
tool_name({ key: value })     调用 MCP 工具
save()                        落盘文档（headless 必须显式 save）
exit()                        退出 shell
import_library({ path })      导入 .lib.pen 组件库（也接受 pencil:shadcn.lib.pen 内置库）
remove_library({ id })        移除已导入库；其实例退化为普通副本
list_libraries()              列出已导入库（id / URI / 状态）
```

- 路径自动注入，工具调用**不需要**再传 `filePath`
- 导入的库内容可与 `execute` 的 `Insert`（`reusable: true`）流程组合使用
