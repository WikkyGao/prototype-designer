# .pen 文件 Schema 速查

> 对应 pen.dev Document Schema `version: "2.17"`。内容源自官方 `read_skill({ path: "pen-schema.md" })`。
> 本文件给出**可直接用的节点类型与属性**；文末保留权威 TypeScript 类型定义。

---

## 一、关键认知（先看）

- **没有 `image` 节点类型**。图片是作为 **fill** 施加到 frame / rectangle 上的（`Generate` 异步填充）。
- 节点 `id` **不要自己设**——系统自动生成并覆盖。返回的 id 才是真实 id。
- `id` 字符串**不能含 `/`**。斜杠仅用于组件实例内部嵌套路径（`instanceId/childId`）。
- 颜色：hex（`#RGB` / `#RRGGBB` / `#RRGGBBAA`）。变量引用用 `$name`。
- 尺寸/位置可用 `$variable` 引用设计令牌（`fill`、`width`、`padding` 等都支持）。
- `document` 根下**只放 page frame、可复用组件（`reusable: true`）、主容器**；不要把 text/icon/button/card 直接挂根。

---

## 二、节点类型总览

| type | 说明 | 关键属性 |
|---|---|---|
| `frame` | 容器，建立层级与布局（默认 layout=horizontal） | `layout`、`gap`、`padding`、`justifyContent`、`alignItems`、`clip`、`placeholder`、`slot` |
| `group` | 纯分组（无图形/布局） | `children` |
| `rectangle` | 矩形 | `cornerRadius`、`fill`、`stroke` |
| `ellipse` | 椭圆/圆环/弧 | `innerRadius`、`startAngle`、`sweepAngle` |
| `polygon` | 多边形 | `polygonCount`、`cornerRadius` |
| `path` | SVG path | `geometry`、`viewBox`、`fillRule` |
| `text` | 文本 | `content`、`textGrowth`、`fontFamily`、`fontSize`、`fontWeight`、`textAlign`… |
| `note` | 便签（注释） | `content`；**不支持 `fill`**（要背景色用 frame 包裹） |
| `prompt` | 提示词节点 | `content`、`model` |
| `context` | 上下文节点 | `content` |
| `icon` | 图标库图标 | `library`、`icon`、`weight` |
| `script` | 由 JS 生成嵌套子节点 | `scriptUri`、`inputs` |
| `ref` | 复用实例（`ref` 指向 `reusable: true` 节点） | `ref`、`descendants` |

---

## 三、通用属性（所有节点都有）

```ts
interface Entity {
  id: string;            // 自动生成，禁止自设
  name?: string;         // 必填人类可读名（含子节点）
  context?: string;      // 元数据：交互行为/数据绑定/导航目标
  reusable?: boolean;    // true 可被 ref 复用
  theme?: Theme;         // { device: "phone" } 等主题轴
  enabled?: bool|var;
  opacity?: num|var;
  flipX?: bool|var;
  flipY?: bool|var;
  layoutPosition?: "auto" | "absolute";  // absolute 脱离父布局
  metadata?: { type: string; [k:string]: any };
  rotation?: num|var;    // 绕左上角 CCW 度数
  x?: number; y?: number; // 相对父坐标。父用 flex 时忽略
}
```

---

## 四、布局 Layout（frame / group 等容器）

```ts
interface Layout {
  layout?: "none" | "vertical" | "horizontal";   // none = 绝对定位子节点
  gap?: num|var;                                  // 主轴间距，默认 0
  layoutIncludeStroke?: boolean;
  padding?: num|var | [v,h] | [t,r,b,l];          // 内边距
  justifyContent?: "start"|"center"|"end"|"space_between"|"space_around";
  alignItems?: "start"|"center"|"end";            // ⚠ 不支持 baseline/stretch
}
```

**尺寸行为（SizingBehavior）**：
- `fit_content`：由子节点尺寸决定（无子节点时回退到指定值）
- `fill_container`：占满父容器（需父有布局；否则回退）
- 回退值写法：`fit_content(100)`、`fill_container(200)`

⚠ **禁止百分比尺寸、`margin`**。间距用 `gap`/布局，不用 margin。

---

## 五、Fill（fill / stroke）

`Fills = Fill | Fill[]`，每个节点可单填或数组多填。

| 类型 | 用途 | 关键字段 |
|---|---|---|
| `color` | 纯色 | `color`（支持 `$var`） |
| `gradient` | 线性/径向/角向渐变 | `gradientType`、`colors[]`、`rotation`、`center`、`size` |
| `image` | 图片（URL 相对 .pen，如 `./img.jpg`） | `url`、`mode: stretch\|fill\|fit` |
| `shader` | WebGL 着色器（`.glsl`，相对路径） | `url`、`uniforms` |
| `mesh_gradient` | 贝塞尔色彩网格 | `columns`、`rows`、`colors[]`、`points[]` |

> 填充透明度只能经 hex alpha 通道设置（如 `#RRGGBBAA`），`opacity` 作用于整个节点而非单 fill。

---

## 六、Stroke / Effect

```ts
stroke?: Fills;
strokeWidth?: num|var | {top?,right?,bottom?,left?};  // 可四边不同
strokeLinecap?: "butt"|"round"|"square";
strokeLinejoin?: "miter"|"bevel"|"round";
strokeAlignment?: "inner"|"center"|"outer";

// effect（可数组）
{ type:"blur", radius }                          // 节点模糊
{ type:"background_blur", radius }               // 背景模糊
{ type:"shadow", shadowType:"inner"|"outer",
  offset:{x,y}, spread, blur, color, blendMode } // 阴影
```

---

## 七、文本 Text

```ts
interface Text extends Entity, Size, CanHaveGraphics, TextStyle {
  type: "text";
  content?: string|var;
  /** 必须设，width/height 才生效。
      'auto' 自适应不换行；
      'fixed-width' 宽度固定、换行、高度自适应；
      'fixed-width-height' 宽高均固定，可能溢出 */
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
}
interface TextStyle {
  fontFamily?, fontWeight?, fontStyle?, letterSpacing?, lineHeight?,
  underline?, strikethrough?, textAlign?, textAlignVertical?, href?
}
```

---

## 八、组件实例 Ref + descendants

```ts
interface Ref extends Entity {
  type: "ref";
  ref: string;                              // 被复用节点 id
  descendants?: { [idPath]: {} };          // 覆写/替换后代
}
```

- `descendants` 的 key 是后代的 id/path，或组件内**唯一后代名**（重名用 id）
- key **不带 `type`** = 属性覆写；**带 `type`** = 整体替换该后代节点树
- 复制 `reusable` 节点会创建关联 `ref` 实例

---

## 九、Document 根结构

```ts
interface Document {
  version: "2.17";
  themes?: { [axis: string]: string[] };                 // 主题轴 -> 轴值
  imports?: { [alias: string]: string };                 // 相对 URI 的 .pen 导入
  variables?: { [name: string]: VariableDefinition };    // 设计令牌
  children: Child[];                                     // 顶层节点
}
```

变量定义：
```ts
// 每个值必须是对象，含 type 与 value；不得裸值，名字不得以 $ 开头
{ type: "color" | "number" | "string" | "boolean", value: ... }
// 主题值：
{ type:"color", value:[ {value:"#FAFAF7", theme:{mode:"light"}}, {value:"#141414", theme:{mode:"dark"}} ] }
```

---

## 十、权威类型定义（完整 TS）

```typescript
/** Theme axis -> axis value. E.g. { 'device': 'phone' } */
export interface Theme { [key: string]: string; }
/** Dollar-prefixed variable name; binds the property to that variable. */
export type Variable = string;
export type NumberOrVariable = number | Variable;
/** Hex color: #RGB, #RRGGBB, or #RRGGBBAA. */
export type Color = string;
export type ColorOrVariable = Color | Variable;
export type BooleanOrVariable = boolean | Variable;
export type StringOrVariable = string | Variable;
export interface Layout {
  layout?: "none" | "vertical" | "horizontal";
  gap?: NumberOrVariable;
  layoutIncludeStroke?: boolean;
  padding?: NumberOrVariable | [NumberOrVariable, NumberOrVariable] | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
  justifyContent?: "start" | "center" | "end" | "space_between" | "space_around";
  alignItems?: "start" | "center" | "end";
}
export type SizingBehavior = string;
export interface Position { x?: number; y?: number; }
export interface Size { width?: NumberOrVariable | SizingBehavior; height?: NumberOrVariable | SizingBehavior; }
export type BlendMode = 'normal' | 'darken' | 'multiply' | 'linearBurn' | 'colorBurn' | 'light' | 'screen' | 'linearDodge' | 'colorDodge' | 'overlay' | 'softLight' | 'hardLight' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
export type Fill = ColorOrVariable | { type: "color"; enabled?: BooleanOrVariable; blendMode?: BlendMode; color: ColorOrVariable; } | { type: "gradient"; enabled?: BooleanOrVariable; blendMode?: BlendMode; gradientType?: "linear" | "radial" | "angular"; opacity?: NumberOrVariable; center?: Position; size?: { width?: NumberOrVariable; height?: NumberOrVariable }; rotation?: NumberOrVariable; colors?: { color: ColorOrVariable; position: NumberOrVariable }[]; } | { type: "image"; enabled?: BooleanOrVariable; blendMode?: BlendMode; opacity?: NumberOrVariable; url?: string; mode?: "stretch" | "fill" | "fit" } | { type: "shader"; enabled?: BooleanOrVariable; blendMode?: BlendMode; opacity?: NumberOrVariable; url: string; uniforms?: { [key: string]: number | boolean | string | number[] }; } | { type: "mesh_gradient"; enabled?: BooleanOrVariable; blendMode?: BlendMode; opacity?: NumberOrVariable; columns?: number; rows?: number; colors?: ColorOrVariable[]; points?: ([number, number] | { position: [number, number]; leftHandle?: [number, number]; rightHandle?: [number, number]; topHandle?: [number, number]; bottomHandle?: [number, number]; })[]; };
export type Fills = Fill | Fill[];
export interface CanHaveStroke { stroke?: Fills; strokeWidth?: NumberOrVariable | { top?: NumberOrVariable; right?: NumberOrVariable; bottom?: NumberOrVariable; left?: NumberOrVariable }; strokeLinecap?: "butt" | "round" | "square"; strokeLinejoin?: "miter" | "bevel" | "round"; strokeAlignment?: "inner" | "center" | "outer"; }
export type Effect = { enabled?: BooleanOrVariable; type: "blur"; radius?: NumberOrVariable } | { enabled?: BooleanOrVariable; type: "background_blur"; radius?: NumberOrVariable } | { type: "shadow"; enabled?: BooleanOrVariable; shadowType?: "inner" | "outer"; offset?: { x: NumberOrVariable; y: NumberOrVariable }; spread?: NumberOrVariable; blur?: NumberOrVariable; color?: ColorOrVariable; blendMode?: BlendMode };
export type Effects = Effect | Effect[];
export interface CanHaveEffects { effect?: Effects; }
export interface CanHaveGraphics extends CanHaveEffects, CanHaveStroke { fill?: Fills; }
export interface Entity extends Position { id: string; name?: string; context?: string; reusable?: boolean; theme?: Theme; enabled?: BooleanOrVariable; opacity?: NumberOrVariable; flipX?: BooleanOrVariable; flipY?: BooleanOrVariable; layoutPosition?: "auto" | "absolute"; metadata?: { type: string; [key: string]: any }; rotation?: NumberOrVariable; }
export interface Rectangleish extends Entity, Size, CanHaveGraphics { cornerRadius?: NumberOrVariable | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable]; }
export interface Rectangle extends Rectangleish { type: "rectangle"; }
export interface Ellipse extends Entity, Size, CanHaveGraphics { type: "ellipse"; innerRadius?: NumberOrVariable; startAngle?: NumberOrVariable; sweepAngle?: NumberOrVariable; }
export interface Polygon extends Entity, Size, CanHaveGraphics { type: "polygon"; polygonCount?: NumberOrVariable; cornerRadius?: NumberOrVariable; }
export interface Path extends Entity, Size, CanHaveGraphics { fillRule?: "nonzero" | "evenodd"; geometry?: string; viewBox?: [number, number, number, number]; type: "path"; }
export interface TextStyle { fontFamily?: StringOrVariable; fontSize?: NumberOrVariable; fontWeight?: StringOrVariable; letterSpacing?: NumberOrVariable; fontStyle?: StringOrVariable; underline?: BooleanOrVariable; lineHeight?: NumberOrVariable; textAlign?: "left" | "center" | "right" | "justify"; textAlignVertical?: "top" | "middle" | "bottom"; strikethrough?: BooleanOrVariable; href?: string; }
export type TextContent = StringOrVariable;
export interface Text extends Entity, Size, CanHaveGraphics, TextStyle { type: "text"; content?: TextContent; textGrowth?: "auto" | "fixed-width" | "fixed-width-height"; }
export interface CanHaveChildren { children?: Child[]; }
export interface Frame extends Rectangleish, CanHaveChildren, Layout { type: "frame"; clip?: BooleanOrVariable; placeholder?: boolean; slot?: false | string[]; }
export interface Group extends Entity, CanHaveChildren, CanHaveEffects { type: "group"; }
export interface Note extends Entity, Size, TextStyle { type: "note"; content?: TextContent; }
export interface Prompt extends Entity, Size, TextStyle { type: "prompt"; content?: TextContent; model?: StringOrVariable; }
export interface Context extends Entity, Size, TextStyle { type: "context"; content?: TextContent; }
export interface Icon extends Entity, Size, CanHaveEffects { type: "icon"; library?: StringOrVariable; icon?: StringOrVariable; weight?: NumberOrVariable; fill?: Fills; }
export interface Script extends Entity, Size { type: "script"; clip?: BooleanOrVariable; scriptUri?: string; inputs?: { [key: string]: string | number | boolean | Variable }; }
export interface Ref extends Entity { type: "ref"; ref: string; descendants?: { [key: string]: {} }; [key: string]: any; }
export type Child = Frame | Group | Rectangle | Ellipse | Path | Polygon | Text | Note | Prompt | Context | Icon | Script | Ref;
export type IdPath = string;
export interface Document { version: "2.17"; themes?: { [key: string]: string[] }; imports?: { [key: string]: string }; variables?: { [key: string]: { type: "boolean"; value: BooleanOrVariable | { value: BooleanOrVariable; theme?: Theme }[] } | { type: "color"; value: ColorOrVariable | { value: ColorOrVariable; theme?: Theme }[] } | { type: "number"; value: NumberOrVariable | { value: NumberOrVariable; theme?: Theme }[] } | { type: "string"; value: StringOrVariable | { value: StringOrVariable; theme?: Theme }[] } }; children: Child[]; }
```
