# Pen 适配器

> `status: ready` ｜ `migrationState: extracted`
> 独立目录与文档由 `prototype-designer` 读取调用，**不单独触发**。
> `.pen` 的完整 API、schema 与 MCP 工具在本目录 `references/`；本文件定义适配器边界与执行顺序。

## 1. 职责

- 原生格式：`.pen`
- 输入：`DesignRequest`（见 `../../references/design-contract.md`）
- 输出：`DesignResult`，包含原生文件、页面/交互模型与验收证据
- HTML：由 `prototype-designer` 公共核心生成；本适配器不生成三栏外壳

不负责：

- PRD 解析、需求澄清
- HTML 三栏外壳、`#prototype-manifest`
- 总入口路由与用户确认

## 2. 入口

| 内容 | 位置 |
|---|---|
| execute 完整 API、操作签名、失败修补 | `references/execute-api.md` |
| `.pen` schema、节点类型、属性 | `references/pen-schema.md` |
| 五大 MCP 工具（含 browser / CDP） | `references/mcp-tools.md` |
| 便签示例说明 | `references/便签样式说明.md` |
| 示例文件 | `assets/demo.pen`、`assets/UI Design.pen` |
| 便签样式选择页 | `assets/style-selector.html` |
| 组件库同步 | `../../references/config-management.md` |
| Context 模板 | `../../references/context-templates.md` |
| 可交互 HTML | `../../references/prototype-generation.md` |

## 3. 环境

由父级 §1 校验，适配器不重复实现 preflight：

```bash
node --version     # >= 18
which pen          # 未安装则 npm install -g @pen.dev/cli
pen version        # 须 >= 0.3.16；旧版先升级（npm i -g @pen.dev/cli）
pen status         # 认证状态
```

`adapter.json` 的 `preflight` 为 `null`；环境不通过时返回 `blocked`，不得继续创建 `.pen`。

## 4. 执行方式

> 0.3.16 起官方定位：**agent 优先用 `pen interactive` 模式设计**；一次性 CLI 运行适合简单/批量场景。

### 4.1 CLI Agent（一次性）

```bash
pen --out design.pen --prompt "<用户原话>" --export design.png --export-scale 2
pen --in design.pen --out design-v2.pen --prompt "把主色改成绿色" --export v2.png
pen --out design.pen --library 控件库.pen --prompt "..."          # --library 可重复传
pen --out design.pen --library pencil:shadcn.lib.pen --prompt "..."  # 内置 shadcn 库
pen --out design.pen --agent codex --prompt "..."                # 需先 pen codex-login
pen --out design.pen --prompt "参照这个布局" --prompt-file ./ref.png  # 附参考图/文件，可重复
pen --tasks batch.json --agent claude                            # 官方批处理（in/out/prompt/model/promptFiles）
```

- `--agent`：`claude`（默认）/ `codex` / Pi providers（`google` / `xai` / `openrouter`，用各自 `*_API_KEY`）；`--model` 传模型 id 时 agent 自动推断
- 调试利器：`--verbose-mcp`（完整 MCP 错误）、`--verbose`（流式思考与工具输入输出）、`--max-failed-calls <n>`（失败熔断）
- CLI 未指定 `--out` 时输出到默认目录；交付前确认文件实际路径

### 4.2 MCP Interactive（官方推荐）

```bash
pen interactive -i input.pen -o output.pen   # headless；改动用 save() 落盘
pen interactive -a desktop -i design.pen     # 连接运行中的 Pen.app，实时生效
```

首次进入 `.pen` 任务：

```text
get_app_state()
read_skill({ path: "pen-schema.md" })
read_skill({ path: "execute.md" })
execute({ filePath: "design.pen", description: "Create landing page", input: "..." })
```

每个 `execute` 必须传 `description`：3-8 个词的命令式短语，首字母大写、不加句号，作为用户可见的操作标签。

shell 内组件库命令：`import_library({path})` / `remove_library({id})` / `list_libraries()`（见 [references/mcp-tools.md](references/mcp-tools.md) §七）。

## 5. 硬性禁令

- `.pen` 加密，只能用 MCP 工具访问，**禁止 Read/Grep 直接读取**
- 禁止 `alignItems: baseline/stretch`、`margin`、百分比尺寸
- 禁止用 CSS/HTML 思维建模；pen.dev 是自有格式
- 禁止自行设置节点 `id`（系统生成并覆盖）
- 禁止为图片编造 URL，必须用 `Generate` 获取
- 没有 `image` 节点类型；图片是施加到 frame/rectangle 的 **fill**
- `Generate` 参数顺序（0.3.16 起反转）：**`Generate("svg", frameId, prompt)`**，type 在第一位
- 禁止在 document 根下直接放 text/icon/button/card；根下只放页面 frame、可复用组件、主容器、`browser` 节点
- `prompt` / `context` 节点类型已在 schema 2.22 移除，不要再创建；元数据走节点 `context` 属性
- 禁止 `Get` 组件实例读子节点（实例无 children）；用 `instanceId/childId` 路径或 `resolveInstances: true`
- 手工拼 `path` / `polygon` 画插画会很粗糙，统一用 `Generate("svg", frameId, prompt)`

## 6. 必须遵守

- 每个节点都要设人类可读的 `name`（含子节点），返回时会给出 name→id 映射
- 失败时用 `edits` + `editId` 修补，**绝不重发整个 snippet**
- 每次 `execute` 独立作用域；跨调用持久化变量用无声明赋值 `myId = Insert(...)`，不要 `const` / `let`
- 用 JS 消除重复：数组、`for...of`、对象展开、模板字符串、helper 函数
- snippet 内不要写注释
- `Insert` / `Copy` / `Replace` 返回 id 字符串；读新建节点的子节点先用 `Get(id, {depth:1}).children`
- 复用组件用 `ref` + `descendants` 覆写；不要复制后逐个 `Update`
- 屏幕 frame 加 `clip: true`；工作时 `placeholder: true`，完成后 `Update(id, {placeholder:false})`
- 根布局用 `FindEmptySpace()` 定位，不要手写坐标

## 7. 标准骨架

```js
const pos = FindEmptySpace({width:1440,height:1024,padding:80})
pageId = Insert(document,{type:"frame",name:"Landing Page",x:pos.x,y:pos.y,layout:"vertical",width:1440,padding:40,gap:24,clip:true,placeholder:true})

navId = Insert(pageId,{type:"frame",name:"Nav",gap:32,alignItems:"center",width:"fill_container"})
for (const label of ["Home","Pricing","Docs"]) {
  Insert(navId,{type:"text",name:label,content:label,fontFamily:"Inter",fontSize:14,fill:"$text-secondary"})
}

Update(pageId,{placeholder:false})
TakeScreenshot([pageId])
```

## 8. 验证

- **结构/尺寸校验**用 `Get` + `ctx.bounds` / `ctx.problems`，不要用截图
- **视觉保真**（颜色、字形、对齐）用 `TakeScreenshot`
- 截图很贵：只在**一个完整 section 做完**时拍，拍最小有意义的节点
- 每完成一个 section 立即验证，不要等全部做完

```js
Get(pageId, (n,c) => c.problems && Print(n.name,"|",c.parentCtx?.node.name,"|",c.problems))
Get(pageId, (n,c) => Print(n.id,"=",n.name,c.depth,c.bounds.width))
```

## 9. 组件与 Context

- 组件库：父级 §7 与 `../../references/config-management.md`；CLI 用 `--library <file>`（可重复，支持内置 `pencil:shadcn.lib.pen`），interactive 用 `import_library({path})`；打开 `控件库.pen`，`Insert` 设 `reusable:true`，写 `components.json`
- Context：父级 §8 与 `../../references/context-templates.md`；模式 1 通过 `execute` 的 `Update` 写入节点 `context` 属性（`context` 节点类型已移除，属性仍在）
- 交互命名：`btn-*` / `input-*` / `select-*` / `switch-*` / `nav-*` / `tab-*` / `icon-btn` 及可点击卡片

## 10. 验收层级

| 层级 | 说明 |
|---|---|
| `structural` | `Get` + `ctx.problems` 通过，节点/尺寸/命名完整 |
| `preview` | `TakeScreenshot` 视觉验收通过 |
| `prototype` | 公共核心从 `.pen` 生成可交互 HTML（父级 §9） |

结构通过不等于视觉通过；截图通过不等于交互通过。未完成项必须写入 `limitations`。

## 11. 失败与回退

| 情况 | 处理 |
|---|---|
| `pen` 未安装 / 未认证 | 返回 `blocked`，给出安装或登录动作（支持 `pen signup` / `pen login --email` / `PEN_CLI_KEY` CI key） |
| `.pen` 读取失败 | 改用 MCP 工具；禁止 Read/Grep |
| `execute` 失败 | 用返回的 `editId` + `edits` 修补，不重发 snippet |
| 输出文件已存在 | 换新文件名，不覆盖用户原稿 |
| 图片未生成 | 检查 `Generate` 异步状态（`placeholder` / fill url 的 `pencil:pending-image-` 前缀），不要重复生成 |
| Generate 全部失败 | 未登录 pen.dev 时 `Generate` 必失败：改用自己的出图工具 + 相对路径 image fill，或占位并告知用户 |
| 图片 url 为 `pencil://deferred-generation/...` | 配额用尽挂起，**禁止重试 Generate**；告知用户在画布/fill 面板手动恢复 |
| 需要 HTML 但 Pen 环境不可用 | 可建议仅 HTML，但必须取得用户确认，不得静默切换 |

## 12. 边界

- 不覆盖用户已有 `.pen`，默认输出新文件
- 不把结构校验、截图或本地预览说成下游交互验收
- 不把 `.pen` 当作 HTML/CSS 文件处理
- 不伪造命令、输出路径或组件库内容
