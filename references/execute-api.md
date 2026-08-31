# execute API 完全参考

> 对应 pen.dev CLI 0.3.5 / Pen.app 1.2.5+。内容源自官方 `read_skill({ path: "execute.md" })`。
> `execute` 取代了旧版的 `batch_design` + `batch_get` + `get_variables` + `set_variables` + `get_screenshot` + `export_nodes` + `snapshot_layout`。

---

## 一、基本模型

`execute` 执行一段**小型 JavaScript snippet** 来修改文档。

```
execute({ filePath: "design.pen", input: "<JS snippet>" })
```

核心心智模型：

- 出错时**本次所有修改和创建的全局变量全部回滚**
- 响应里会返回 warnings 列表，**必须在下一次 execute 中修掉**
- 每次 `execute` 独立作用域，**局部变量和 helper 函数不跨调用共享**
- 跨调用持久化：用**无声明赋值**（`myId = Insert(...)`），不要用 `const`/`let`
- 响应末尾返回 **name → id 映射**，供后续调用引用

---

## 二、失败修补机制（v4 新增，重要）

旧的 `batch_design` 失败只能整段重发。新版 `execute` 失败后会返回 `editId`，应用它做**增量打补丁**：

```
execute({
  filePath: "design.pen",
  editId: "<失败信息中给出的 id>",
  edits: [
    { find: "原 snippet 中的精确文本", replace: "替换后的文本" },
    { find: "...", replace: "...", all: true }   // all: 替换全部匹配
  ]
})
```

规则：

- **失败时永远用 `edits` + `editId` 修补，绝不重发整个 snippet**
- `editId` 只能来自失败信息，且必须是引用失败调用的有效 id
- `edits` 和 `input` **互斥**，不要同时传
- 补丁后的 snippet **从头重跑**
- 编辑按顺序生效：每条 `find` 必须匹配**已被前面 edits 修改过**的 snippet
- 再失败就在**同一个 editId** 下继续加 `edits`
- `find` 默认必须唯一匹配，否则报错；要替换所有出现处用 `all: true`

---

## 三、API 签名

```ts
const document: string;   // 预定义的根节点

// ── 变更 ──
function Insert(parent: string, nodeData: Child): string;              // 返回新节点 id
function Copy(path: string, parent: string, copyNodeData?: Child): string;
function Update(path: string, updateData: Child): void;
function Replace(path: string, nodeData: Child): string;
function Move(path: string, parent?: string, index?: number): void;
function Delete(path: string): void;
function Generate(nodeId: string, type: "ai" | "svg" | "stock", prompt: string): void;
function SetVariables(variables: Record<string, VariableDefinition>, replace?: boolean): void;

// ── 读取 ──
function Get(path: string, options?: GetOptions): Child;                    // 单节点，children 嵌套
function Get<T>(path: string, visit: Visit<T>, options?: GetOptions): T[];  // 遍历子树
function Get<T>(visit: Visit<T>, options?: GetOptions): T[];                // 遍历整个文档
function GetVariables(): { variables: Record<string, VariableDefinition>; themes?: Record<string, string[]> };
function FindEmptySpace(input: FindEmptySpaceInput): { x: number; y: number; parentId?: string };
function Print(...values: unknown[]): void;
function TakeScreenshot(nodeIds: string[]): void;
function Export(nodeIds: string[], format: ExportFormat, outputPath: string, options?: ExportOptions): void;
```

### 类型定义

```ts
type Visit<T> = (node: Child, ctx: Ctx) => T | undefined;   // 返回 undefined 则不收集该节点

interface GetOptions {
  depth?: number;              // 0 = 仅节点自身；省略的子节点显示为 "..."
  resolveVariables?: boolean;  // 返回计算值而非 $variable 引用
  resolveInstances?: boolean;  // 把组件实例展开成完整子树
  includePathGeometry?: boolean;
}

interface ExportOptions {
  scale?: number;                 // 图片缩放，默认 2
  quality?: number;               // JPEG/WEBP 质量 1-100
  includeHtmlScaffold?: boolean;  // html：完整文档骨架，默认 true
  includeLayerNames?: boolean;    // html：图层名作为 data 属性，默认 true
  includeLayerIds?: boolean;      // html：图层 id 作为 data 属性，默认 false
}

interface Ctx {
  node: Child;                 // 当前节点
  parentCtx?: Ctx;             // 父上下文，顶层为 undefined，可链式追溯祖先
  depth: number;
  index: number;               // 兄弟中的序号
  bounds: Rect;                // 父坐标系下的解析边界（与节点 x/y 同坐标系）
  problems?: "partially clipped" | "fully clipped";   // 节点溢出父容器
  skipChildren(): void;        // 不再下探子节点
}

interface FindEmptySpaceInput {
  width: number;
  height: number;
  direction?: "top" | "right" | "bottom" | "left";  // 默认 "right"
  padding?: number;                                  // 默认 0
  nodeId?: string;                                   // 锚点，用于串联多个屏幕
}

type ExportFormat = "png" | "jpeg" | "webp" | "pdf" | "html-tailwind" | "html-css";
```

`Get` 按**类型**识别参数，未使用的直接省略即可：`Get(screen, visit)`、`Get(visit)`、`Get(id, {depth:1})` 都合法。

> 故意**没有**无 visitor 的整文档读取——那会把整个序列化文档倾倒出来。

---

## 四、path 参数

`Get` / `Copy` / `Update` / `Replace` / `Move` / `Delete` 的 `path` 是：

- **节点 id**，或
- **斜杠分隔路径**，指向组件实例内部的嵌套节点：`instanceId/childId`

限制：

- 斜杠**只对组件实例嵌套有效**，对普通图层结构无效（任意嵌套深度都可用）
- 目标参数（`path` 和 `Insert` 的 `parent`）**永远是 id/path 字符串**，绝不传节点对象
- 从 `Get` 拿到节点后要传它的 `.id`
- 返回的 id 可直接拼接：`cardId + "/childId"`、`{[metricLabelId]: {...}}`

只知道名字时，用 visitor 查找：

```js
Get(n => n.name === "Primary Button" && Insert(n.id, {type:"text",name:"Button Label",content:"RESERVE NOW",fontFamily:"Inter",fontSize:13,fill:"#111111"}))
```

---

## 五、各操作详解

### Insert

- 在指定 parent 的 children **末尾**插入
- **一次只能插一个节点**；要加子节点，用返回的 id 在下一次 Insert 中调用
- 使用组件（`reusable: true`）时，插的是 `ref` 实例，用 `descendants` map 覆写后代属性
- 覆写组件实例内部的子节点用 `Replace("myInstance/childId", {...})`
- 返回新节点 id 字符串

### Copy

- `path` 是要复制的节点 id；要自定义属性，直接并排写在第二个参数里
- **自定义嵌套子节点必须用 `descendants`**，不能用独立的 Update —— 副本及其后代会拿到**全新 id**，用原 id 的 Update 必然失败
- `descendants` 的键可以是节点 id/path，也可以是组件内**唯一的后代名字**；名字重复时改用 id/path
- 复制 `reusable` 节点会创建**关联实例**（`ref` 节点）
- 返回副本 id 字符串

### Update

- 更新属性，**不列 children**
- **不能**用来更新 `children`（用 `Replace`）
- **不能**修改 `id`、`type`、`ref`

### Replace

- 整体替换节点，包含 x/y 在内的所有属性都被替换
- 适合替换组件实例内部的局部节点
- 返回新节点 id 字符串

### Move

- `parent` 省略则保持当前父节点
- `index` 省略则放到末尾

### Delete

- **不能删除组件实例的后代节点**；替代方案是把该后代的 `enabled` 覆写为 `false`

### SetVariables

- 定义/更新变量与主题。先 `Print(GetVariables())` 读取现有的，避免覆盖
- 每个值**必须是对象**，含 `type`（`"color"` / `"number"` / `"string"`）和 `value`。传裸值（如 `"#A3B59A"` 或 `16`）会失败
- 变量名**不得以 `$` 开头**；`$` 前缀只在属性引用时使用（如 `fill: "$accent"`）
- `replace` 默认 `false`（合并）；传 `true` 完全替换现有定义
- **不要单独定义 themes**；变量使用主题时，缺少的主题轴和值会自动注册

```js
SetVariables({
  accent: {type:"color", value:"#A3B59A"},
  "spacing-unit": {type:"number", value:16},
  "font-heading": {type:"string", value:"Playfair Display"},
  background: {type:"color", value:[
    {value:"#F8F5F0", theme:{mode:"light"}},
    {value:"#1A1A1A", theme:{mode:"dark"}}
  ]}
})
```

### GetVariables

- 返回当前变量与主题，包含**同一 execute 调用中早先的修改**
- 用 `Print(GetVariables())` 在响应中读出来

### Get

- 反映同一 execute 调用中早先的修改，可回读刚创建/修改的内容
- 不带 `visit` 时返回纯 schema 数据，可直接回灌 `Insert`/`Copy`/`Update`/`Replace`
- 带 `visit` 时自上而下遍历；只有返回 `undefined` 才不收集（`cond && Update(...)` 返回的 `false` 会被收集，无所谓）
- 被跳过的节点**其子节点仍会被访问**，除非调用 `ctx.skipChildren()`
- 用 `ctx.bounds` / `ctx.problems` 校验布局，不要靠猜；`bounds` 可直接与节点 `x`/`y` 比对并喂给 `Update`
- visitor 用单字母参数保持紧凑：`(n,c) => ({id:n.id, name:n.name, w:c.bounds.width})`
- **不要把大体积 Get 结果存进全局变量**，跨调用只值得存 id 和小值

```js
Print(Get("Xk9f2", {depth: 3}))                                    // 读子树
Get(n => n.reusable && Print(n.id, n.name))                        // 列出所有组件
Get(screen, n => n.type === "text" && n.fontSize < 12 && Update(n.id, {fontSize:12}), {resolveVariables:true})
Get(screen, (n,c) => Print(n.id, n.name, c.depth, c.bounds.width)) // 紧凑概览
Get(screen, (n,c) => c.problems && Print(n.name,"in",c.parentCtx?.node.name,":",c.problems))
Get(card, (n,c) => c.parentCtx && Math.abs(c.bounds.x + c.bounds.width/2 - c.parentCtx.bounds.width/2) > 1 && Print(n.name,"off-center"))
const texts = Get(screen, n => n.type === "text" ? n : undefined)  // 仅在需要列表时收集
```

### Print

- 往 execute 响应里加一行；字符串原样输出，其他按 JSON 输出，空格连接
- 只打印 JSON 兼容的值
- **保持响应精简**：行状数据打印紧凑的位置行，别打 JSON 对象；JSON 留给单个结构化值
- **失败的 execute 调用，其 Print 值不会返回**

### TakeScreenshot

- 渲染指定节点并把截图作为图片附在响应里，每个 id 一张。无返回值
- `nodeIds` 传 `"document"` 可截整个文档
- 反映同一调用中早先的修改
- **好习惯**：完成一个 section 的同一个调用里结尾就 `TakeScreenshot`，不必单独再发一次工具调用
- **截图很贵**：一个完整 section 做完才拍，不要每次 execute 都拍
- 优先拍**最小的有意义节点**（section frame，而非整个文档）——大节点耗 token 且看不清细节
- 结构/尺寸检查用 `Get` + `ctx.bounds`；只有需要验证**视觉保真**（颜色、字形、对齐）时才截图
- **失败的 execute 调用的截图不会返回**

```js
heroId = Insert(pageId,{type:"frame",name:"Hero",layout:"vertical",gap:24,padding:64,width:"fill_container"})
Insert(heroId,{type:"text",name:"Headline",content:"Ship faster.",fontSize:64,fontWeight:"bold",fill:"$text-primary"})
Insert(heroId,{type:"text",name:"Subhead",content:"Design at the speed of thought.",fontSize:20,fill:"$text-secondary"})
TakeScreenshot([heroId])
```

### Export

- 导出节点到磁盘文件。无返回值，响应里列出写入文件的绝对路径
- `outputPath`：图片格式传**目录**（每个节点写成 `<nodeId>.<ext>`）；HTML 格式传**文件路径**
- 图片格式（`png`/`jpeg`/`webp`/`pdf`）：默认 2x 缩放，每个节点单独一个文件；`pdf` 会合并成单个多页 `export.pdf`
- HTML 格式（`html-tailwind`/`html-css`）：所有节点导出到**一个** HTML 文件，图片资源用**相对路径引用，绝不内嵌**
- 用途是**交付最终产物或交接给代码**，不是用来检查工作；检查视觉用 `TakeScreenshot`

```js
Export([heroId, pricingId], "png", "./exports")
Export([pageId], "html-tailwind", "./landing.html")
```

---

## 六、Generate：图片与 SVG

**核心认知：没有 `image` 节点类型。** 图片是作为 **fill** 施加到已有节点上的；SVG 会被转成 path 并加到父 frame 里。

### 异步行为（关键）

- `"ai"` 和 `"svg"` 是**异步非阻塞**的，函数立刻返回，生成独立于 execute 进度完成（`"stock"` 是例外，会在调用期间直接应用 fill）
- 结果会在**发起它的 execute 调用返回之后**才落到文档里。在那之前目标节点是空的/无填充的，立刻截图看不到它——**这是预期行为**
- **绝不**因此重新生成、手工绘制，或往已生成 SVG 的 frame 里加子节点
- 生成 SVG 的 frame 在生成期间保持 `placeholder: true`，完成后自动清除。用**廉价的读取**检查，**不要用截图**：

```js
Print(Get(logoFrameId, {depth: 0}).placeholder)
```

- **生成很慢**：SVG 可能要几分钟。placeholder 还挂着的时候**不要干等**，继续做设计的其他部分，做完另一个 section 再偶尔回查，**不要每次 execute 都查**
- 只有确实没别的事做了，才用那个极小的 Get/Print 轮询，**间隔要慷慨**（中间穿插其他校验）。**绝不要背靠背连发检查**
- placeholder 清除后才能截图。若已清除但 frame 仍为空，说明生成失败——**这是唯一可以对该节点重新 Generate 的情况**

### 图片（`"ai"` / `"stock"`）

- **绝不猜测或编造图片 URL**，一律用 `Generate`
- 显示图片：先 Insert 一个 frame 或 rectangle，再用 `Generate` 把图片作为 fill 施加到该节点
- `type`：`"ai"` = AI 生成图；`"stock"` = Unsplash 图库
- `prompt`：`"ai"` 用详细的描述性 prompt；`"stock"` 用 **1-3 个关键词**的检索式（简单、具体，不要用途或抽象词）
- `"stock"` 在调用期间应用 fill；找不到匹配照片会返回 warning 且节点无图

### SVG（`"svg"`）

- **任何绘制任务都用 SVG 生成**：logo、插画、吉祥物、徽章、装饰画、抽象图案，或任何用户要求"画一个"的东西。无论是绘制本身是需求，还是插画只是大设计中的一部分
- **绝不手工拼 `path`/`polygon`/其他形状节点**——手搓的美术效果一定粗糙。**自由绘制的唯一工具就是 `Generate`**
- 显示 SVG：先 Insert 一个带目标宽高的 **frame**（不允许其他元素类型），再 `Generate`。生成的 path 元素会缩放到适配 frame 的包围盒并插入为其子节点

---

## 七、FindEmptySpace

查找一块 `width` × `height` 的空白区域。

- 直接往 document 根放对象、又没有确切位置时，**在 execute 开头用它**，绝不重叠根级对象
- 除非从上下文或用户需求中知道确切位置，否则不要随机选坐标
- 多个连续的屏幕：把上一个元素的 id 作为 `nodeId` 参数传入，实现串联
- 返回 `{x, y, parentId?}`；Insert/Copy 到 `parentId`（没有则用 `document`）的返回坐标处

---

## 八、写法约定

**用普通 JavaScript 消除重复**：数组、`for...of`、计算值、条件、对象展开、helper 函数、模板字符串都可用。

- 生成导航项、表格行、卡片、指标、菜单等重复 UI 时，**优先用循环/展开/helper**，而不是手写长串重复代码
- **snippet 里不要写注释**，保持 input 精简
- 创建随后会被展开复用的 style 对象时，**记得在里面包含 `type`**

---

## 九、完整示例

### 创建可复用组件并捕获 id

```js
const pos = FindEmptySpace({width:240, height:96, direction:"top", padding:80})
metricCardId = Insert(document,{type:"frame",name:"Metric",x:pos.x,y:pos.y,reusable:true,layout:"vertical",gap:4,placeholder:true})
metricLabelId = Insert(metricCardId,{type:"text",name:"Label",fontFamily:"Inter",fontSize:13,fill:"$text-secondary",content:"Label"})
metricValueId = Insert(metricCardId,{type:"text",name:"Value",fontFamily:"Inter",fontSize:28,fill:"$text-primary",content:"0"})
Update(metricCardId,{placeholder:false})
```

### 插入屏幕并用循环填充

```js
const pos = FindEmptySpace({width:1440, height:1024, padding:80})
pageId = Insert(document,{type:"frame",name:"Landing Page",x:pos.x,y:pos.y,layout:"vertical",width:1440,padding:40,gap:24,clip:true,placeholder:true})

const navItem = {type:"text",fontFamily:"Inter",fontSize:14,fill:"$text-secondary"}
navId = Insert(pageId,{type:"frame",name:"Nav",gap:32,alignItems:"center",width:"fill_container"})
for (const label of ["Home","Our Story","Visit","Journal"]) {
  Insert(navId,{...navItem, name:label, content:label})
}
```

### 循环实例化组件（同一 execute 内即可）

```js
rowId = Insert(pageId,{type:"frame",name:"Metrics",gap:16,width:"fill_container"})
for (const [label,value] of [["Orders","1,284"],["Revenue","$48.2K"],["Customers","9,431"]]) {
  Insert(rowId,{type:"ref",ref:metricCardId,name:label,width:"fill_container",
    descendants:{[metricLabelId]:{content:label},[metricValueId]:{content:value}}})
}
Update(pageId,{placeholder:false})
```

### 复制屏幕并定制后代

```js
const pos = FindEmptySpace({width:1440, height:1024, padding:80})
dashboardV2Id = Copy("Xk9f2", document, {name:"Dashboard V2", x:pos.x, y:pos.y, placeholder:true,
  descendants:{"Jd6Ru":{fill:"#0F172A"}, "Pc2Ny/Gh9Kf":{content:"Reports"}}})
Update(dashboardV2Id,{placeholder:false})
Delete("Vn4kP")
```

### 设计令牌 + 主题

```js
SetVariables({
  "bg":{type:"color",value:[
    {value:"#FAFAF7",theme:{mode:"light"}},
    {value:"#141414",theme:{mode:"dark"}}
  ]},
  "text-primary":{type:"color",value:[
    {value:"#1A1A1A",theme:{mode:"light"}},
    {value:"#F5F5F5",theme:{mode:"dark"}}
  ]},
  "font-body":{type:"string",value:"Inter"},
  "gap-md":{type:"number",value:16}
})

cardId = Insert(document,{type:"frame",name:"Card",layout:"vertical",fill:"$bg",padding:"$gap-md",gap:"$gap-md",x:80,y:80})
Insert(cardId,{type:"text",name:"Title",fontFamily:"$font-body",fontSize:20,fill:"$text-primary",content:"Tokens applied"})
```

主题值以 `{value, theme}` 数组传入，`dark` 轴值会自动注册，因此 `$bg`/`$text-primary` 引用会按主题自动解析。
