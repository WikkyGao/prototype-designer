# 可交互原型生成 — 参考手册

> 本文档是 prototype-designer SKILL.md 中「步骤 8：可交互原型生成」的详细实现参考。
> 主文件只保留触发条件和输出规格，完整实现细节在此。
> 支持四种页面来源：模式 1 从 `.pen` 读取；模式 2 从 `design-pages.html` 读取（见 [html-only-mode.md](html-only-mode.md)）；模式 3 从 RP/1 源码或 `.rp` 读取（见 [axure-mode.md](../adapters/axure/references/axure-mode.md)）；模式 4 从 Figma 云端文件读取（见 [figma-mcp.md](../adapters/figma/references/figma-mcp.md)）。

## 一、前置：Context 补录

原型生成前必须确认所有交互型节点已有 context。缺失 context 的节点无法正确实现交互。

### 模式 1：.pen 来源

1. `execute` 的 `Get` 读取全部节点
2. 筛选交互型节点（名含 btn/input/select/switch/filter/row/stat/chart/tab/modal）
3. 检查 context 是否存在，缺失的按优先级补录：
   - PRD.md 交互需求 > 节点命名推断 > 默认惯例
4. 用 `Update(id, {context:"..."})` 批量写入
5. `Get` 验证写入成功

### 模式 2：HTML 来源

1. 解析 `design-pages.html`，遍历所有带 `data-context` 的节点
2. 校验属性值可被 `JSON.parse`，且包含 `trigger` / `action`
3. 筛选应有的交互型节点（class 或标签命中 btn/input/select/switch/filter/row/stat/chart/tab/modal）
4. 缺失 context 的节点按同一优先级补齐，**直接写回 `design-pages.html` 的 `data-context` 属性**
5. 校验 `navigate.target` 能匹配到某个 `data-page` 或已声明弹窗

> HTML 模式在页面设计阶段就应内联 context，这里只做校验与兜底，不引入 pen 工具。

### 模式 3：Axure 来源

1. 优先解析 `design.rp1.json` 的 `pages[]` 与 `on` / `onClick` / `onLoad` 事件，动作即交互事实来源
2. 已有 `.rp` 用 `node bin/axure.mjs rp-read <file> --json`，或 MCP `read_interactions({ page })`
3. RP/1 原生交互不需要补录 context；生成 HTML 原型时把事件与动作转成 `data-context`
4. 名称以 `btn-` / `input-` / `select-` / `nav-` / `tab-` 开头的节点必须有对应交互，否则在说明面板标注「静态展示」
5. 跳转目标必须能匹配到 `pages[].name` 或已声明弹窗

### 模式 4：Figma 来源

1. 用 `get_metadata` 读取文件与顶层 frame，确定页面清单；用 `get_design_context` 读取结构与样式（默认 React + Tailwind，仅作参考）
2. 用 `get_variable_defs` 读取设计令牌；用 `get_libraries` / `search_design_system` 识别已发布组件
3. Figma 节点没有 pen.dev 的 `context` 字段；交互从 PRD、Figma 原型连线、页面命名与用户补充信息推导
4. 生成 HTML 时把推导结果写为 `data-context`；无法确认的交互标为「静态展示」并写入 `limitations`
5. 用 `get_screenshot` 做视觉参考，不把截图通过说成交互验收
6. 归一化 `pages[]` / `interactions[]` 后交给公共核心生成三栏 HTML；Figma 适配器不拼 HTML 外壳

### 默认 Context 模板

| 场景 | 默认 context |
|------|-------------|
| 提交/保存按钮 | `{"trigger":"click","action":"submit","loading":true,"onSuccess":"toast:操作成功","onError":"toast:操作失败"}` |
| 取消按钮 | `{"trigger":"click","action":"navigate","target":"返回上一页"}` |
| 删除按钮 | `{"trigger":"click","action":"delete","confirm":"确认删除？","loading":true}` |
| 搜索/筛选 | `{"trigger":"click","action":"filter","description":"展开筛选条件"}` |
| 导航菜单 | `{"trigger":"click","action":"navigate","target":"/目标页面"}` |
| 表格行 | `{"trigger":"click","action":"navigate","target":"/detail","hover":"cursor:pointer"}` |
| 统计卡片 | `{"trigger":"click","action":"navigate","target":"/对应详情"}` |
| 图表 | `{"trigger":"hover","action":"custom","description":"hover显示详细数据"}` |

## 二、HTML 布局规范

### 固定三栏布局

```
┌──────────────┬────────────────────────┬──────────────┐
│  左侧面板     │      中间主面板          │   右侧面板     │
│  (页面导航)   │      (页面预览)          │  (功能说明)   │
│  width:180    │     flex:1 自适应       │  width:280    │
│  min:150      │                        │  min:200      │
│  max:250      │                        │  max:500      │
└──────────────┴────────────────────────┴──────────────┘
```

CSS 变量驱动宽度：`--left-width: 180px; --info-width: 280px`

## 三、水滴标注系统

### 水滴形状

使用内联 SVG 真实泪滴路径——**上大下小**（顶部圆润饱满、底部收尖）：

```html
<svg width="24" height="30" viewBox="0 0 24 30">
  <defs>
    <radialGradient id="td" cx="40%" cy="35%">
      <stop offset="0%" stop-color="rgba(100,181,246,0.9)"/>
      <stop offset="40%" stop-color="rgba(30,136,229,0.65)"/>
      <stop offset="100%" stop-color="rgba(13,71,161,0.55)"/>
    </radialGradient>
  </defs>
  <path d="M12 29 C12 29 0 16 0 8 C0 3.6 5.4 0 12 0 C18.6 0 24 3.6 24 8 C24 16 12 29 12 29Z" fill="url(#td)" stroke="#1565c0" stroke-width="1.2"/>
  <!-- 弧形反光 -->
  <path d="M6 7 C8 5 11 4 12 4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <!-- 编号 -->
  <text x="12" y="17" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="sans-serif">1</text>
</svg>
```

### CSS 定位

```css
.annotation-wrap {
  position: absolute;
  transform: translate(-50%, -100%); /* 锚在底部尖端 */
  z-index: 10;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
.annotation-wrap.dragging {
  cursor: grabbing;
  z-index: 20;
}
.annotation-wrap.dragging svg {
  animation: none !important; /* 拖拽时暂停脉冲动画 */
}
```

### 拖拽移动标注点

标注点必须支持鼠标拖拽移动，拖拽结束后连线自动跟随更新。

```javascript
function initDraggableAnnotations() {
  const viewport = document.getElementById('pageViewport');
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };

  viewport.addEventListener('mousedown', e => {
    const wrap = e.target.closest('.annotation-wrap');
    if (!wrap || e.target.closest('.save-btn')) return;
    e.preventDefault();
    dragging = wrap;
    dragging.classList.add('dragging');
    const rect = wrap.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left - rect.width / 2;
    dragOffset.y = e.clientY - rect.top;
    // 拖拽开始时暂停脉冲动画
    const svg = wrap.querySelector('svg');
    if (svg) svg.style.animation = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const vpRect = viewport.getBoundingClientRect();
    let left = e.clientX - vpRect.left - dragOffset.x;
    let top = e.clientY - vpRect.top - dragOffset.y;

    // 边界限制：在 viewport 内
    left = Math.max(0, Math.min(vpRect.width, left));
    top = Math.max(0, Math.min(vpRect.height, top));

    dragging.style.left = left + 'px';
    dragging.style.top = top + 'px';

    // 拖拽中实时更新连线
    drawAllConnections();
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging.classList.remove('dragging');
      // 恢复脉冲动画
      const svg = dragging.querySelector('svg');
      if (svg) svg.style.animation = '';
      dragging = null;
      drawAllConnections();
    }
  });

  // 触屏支持
  viewport.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const wrap = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.annotation-wrap');
    if (!wrap || wrap.classList.contains('dragging')) return;
    e.preventDefault();
    dragging = wrap;
    dragging.classList.add('dragging');
    const rect = wrap.getBoundingClientRect();
    dragOffset.x = touch.clientX - rect.left - rect.width / 2;
    dragOffset.y = touch.clientY - rect.top;
    const svg = wrap.querySelector('svg');
    if (svg) svg.style.animation = 'none';
  }, { passive: false });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const touch = e.touches[0];
    const vpRect = viewport.getBoundingClientRect();
    let left = touch.clientX - vpRect.left - dragOffset.x;
    let top = touch.clientY - vpRect.top - dragOffset.y;
    left = Math.max(0, Math.min(vpRect.width, left));
    top = Math.max(0, Math.min(vpRect.height, top));
    dragging.style.left = left + 'px';
    dragging.style.top = top + 'px';
    drawAllConnections();
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (dragging) {
      dragging.classList.remove('dragging');
      const svg = dragging.querySelector('svg');
      if (svg) svg.style.animation = '';
      dragging = null;
      drawAllConnections();
    }
  });
}
```

**拖拽体验要点**：

- 拖拽时暂停脉冲动画，避免视觉冲突
- 拖拽光标变为 `grabbing`，松开恢复 `grab`
- 拖拽过程中连线实时跟随更新（每帧重绘）
- 拖拽结束时恢复脉冲动画
- 边界限制：标注点不能拖出 viewport 可视区域外
- 触屏支持：`touchstart/touchmove/touchend` 与 mouse 事件逻辑一致
- 双击还原：双击标注点可还原到原始位置（从 .pen 节点坐标恢复）
- **拖拽锚点用 CSS left/top**：由于 `transform: translate(-50%, -100%)`，不能使用 `getBoundingClientRect()` 作为拖拽起点，应直接读取 `style.left/style.top`

### 脉冲动画

```css
@keyframes dropPulse {
  0%,100% { filter: drop-shadow(0 1px 3px rgba(21,101,192,0.4)); }
  50%    { filter: drop-shadow(0 2px 12px rgba(21,101,192,0.7)); }
}
.annotation-wrap svg { animation: dropPulse 2s ease-in-out infinite; }
```

## 四、SVG 贝塞尔连线

**关键：SVG 必须 `position: fixed` 挂在 `document.body`，`z-index: 1000`，全窗口覆盖。**

```css
.connections-layer {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 1000;
}
.connections-layer path {
  fill: none; stroke: #1565c0; stroke-width: 1.5;
  stroke-dasharray: 6 3; opacity: 0.7;
  animation: dashFlow 20s linear infinite;
}
@keyframes dashFlow { to { stroke-dashoffset: -180; } }
```

### 坐标计算

使用 `getBoundingClientRect()` 绝对屏幕坐标（非 viewport 相对坐标）：

```javascript
function drawConnections() {
  const anns = document.querySelectorAll('#pageViewport .annotation-wrap');
  anns.forEach(a => {
    const card = document.querySelector(`#infoContent .info-card[data-note-index="${a.dataset.noteIndex}"]`);
    const aR = a.getBoundingClientRect();  // 水滴尖端坐标
    const cR = card.getBoundingClientRect(); // 卡片左侧中点

    const x1 = aR.left + aR.width / 2;     // 水滴尖端X
    const y1 = aR.top + aR.height;          // 水滴尖端Y
    const x2 = cR.left - 4;                 // 卡片左侧
    const y2 = cR.top + cR.height / 2;      // 卡片中点Y

    // 贝塞尔：对称控制点
    const midX = x1 + (x2 - x1) * 0.5;
    path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  });
}
```

### 双向联动

点击标注点 → 高亮对应卡片 + 加粗连线；点击卡片标题 → 高亮对应标注点 + 加粗连线。

### 显隐开关

右上角 checkbox 控制所有 `.annotation-wrap` 和 `#connectionsLayer` 的 display。

## 五、说明面板

### 卡片样式 — 左边框强调

6 种类型分别对应不同颜色背景 + 左边框：

| 类型 | 背景色 | 边框色 | 用途 |
|------|--------|--------|------|
| feature | #E3F2FD | #1976D2 | 功能说明 |
| field | #E8F5E9 | #388E3C | 字段说明 |
| interact | #F3E5F5 | #7B1FA2 | 交互说明 |
| warning | #FFF3E0 | #F57C00 | 注意事项 |
| tech | #E0F7FA | #0097A7 | 技术备注 |
| todo | #FCE4EC | #C2185B | 待办事项 |

### 可编辑保存

```html
<p contenteditable="true" 
   onfocus="this.closest('.info-card').classList.add('editing')" 
   onblur="this.closest('.info-card').classList.remove('editing')">说明内容</p>
<button class="save-btn" onclick="saveCardEdit(this)">保存</button>
```

### 字体调整

胶囊按钮 A⁻ 缩小 / 放大 A⁺，CSS `fontSize` px 单位驱动（10~22px 范围）。

## 六、拖拽分割线

```javascript
function initSplitter(id) {
  let dragging = false;
  splitter.addEventListener('mousedown', e => { dragging = true; ... });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    // 左侧：150~250px，右侧：200~500px
    document.getElementById('panelLeft|panelRight').style.width = clampedWidth + 'px';
    drawAllConnections(); // 拖拽后重绘连线
  });
}
```

## 七、交互反馈组件

- **Toast**：右上角 fixed，success(绿)/error(红)/info(蓝)，3 秒后 fadeOut 移除
- **Confirm Modal**：半透明遮罩 + 居中白卡 + 取消/确认按钮
- **Loading**：半透明白色遮罩 + CSS spinner 旋转动画

## 八、localStorage 自动保存

生成的 HTML 必须支持自动保存，刷新后保持状态。

```javascript
// 保存的数据
// - 水滴位置 (annotationPositions)
// - 说明卡片内容 (noteCardsByPage)  
// - 当前页面 (currentPage)
// - 字体大小 (fontSize)

function autoSave() {
  localStorage.setItem('prefix_dropPositions', JSON.stringify(annotationPositions));
  localStorage.setItem('prefix_noteCards', JSON.stringify(noteCardsByPage));
  localStorage.setItem('prefix_currentPage', currentPage);
  localStorage.setItem('prefix_fontSize', fontSize);
}

function autoLoad() {
  // 每项独立 try-catch，一项损坏不影响其他
  const p = localStorage.getItem('prefix_dropPositions');
  if (p) { /* merge into annotationPositions */ }
}
```

**触发时机**：
- 拖拽结束后 500ms（debounce）
- 说明卡片编辑保存后
- 页面切换后
- 字体调整后

## 九、页面数据提取

### 模式 1：从 execute Get 结果提取

```javascript
// 页面列表
for (n of data.nodes) if (n.type === 'frame' && n.name.includes('页')) pages.push(n)

// 交互型节点
// 名含 btn/button/input/select/switch/filter/row/stat/chart/tab/modal 的节点
// 提取 context → 生成交互映射清单（右侧底部表格）

// 便签 → 生成说明卡片
// noteFrame 节点的 name/children 提取标题和内容
```

### 模式 2：从 HTML 片段提取

```javascript
const doc = new DOMParser().parseFromString(pagesHtml, 'text/html');

// 页面列表：data-page 即导航项
const pages = [...doc.querySelectorAll('section.page[data-page]')].map(el => ({
  name: el.dataset.page,
  route: el.dataset.route || '',
  html: el.outerHTML
}));

// 交互映射：所有带 data-context 的节点
const interactions = [...doc.querySelectorAll('[data-context]')].map(el => ({
  page: el.closest('section.page')?.dataset.page,
  selector: el.className || el.tagName.toLowerCase(),
  context: JSON.parse(el.dataset.context)
}));

// 说明卡片：优先取 data-note 属性，其次取页面内 .note 节点
const notes = [...doc.querySelectorAll('[data-note], .note')];
```

### 输出命名

| 模式 | 输出文件 |
|------|----------|
| 模式 1（.pen） | `{原文件名}-prototype.html`，与 .pen 同目录 |
| 模式 2（仅 HTML） | `design-prototype.html`，与 `design-pages.html` 同目录 |
| 模式 3（Axure） | `design-prototype.html`（可选），与 `.rp` 同目录 |
| 模式 4（Figma） | `design-prototype.html`（可选） |

四种模式输出的 HTML 都必须是单文件自包含（CSS/JS 全部内联），引用图片时优先内联 data URI。

---

## 十、结构化元数据契约（下游交付）

原型除三栏展示外，必须携带可机器解析的页面/交互元数据，供 prototype-to-frontend 等下游直接消费。**不改变三栏布局、水滴标注与 localStorage 行为，也不需要下游改流程。**

### 10.1 DOM 约定

| 元素 | 必需属性 | 说明 |
|---|---|---|
| 预览区页面 | `class="page"` + `data-page` + `data-route` | 页面唯一名与建议路由；同一原型内 `data-page` 唯一 |
| 左栏导航项 | `data-target="<data-page 值>"` | 点击切换到对应页面 |
| 交互节点 | `data-context='{...}'` | JSON，含 `trigger`/`action`；模式 1 由节点 `context` 生成 |
| 标注点 | `data-annotation-id="<id>"` | 与说明卡一一对应 |
| 说明卡 | `data-annotation-id="<id>"` | 与标注点一一对应 |

```html
<section class="page" data-page="登录" data-route="/login">...</section>
<button class="nav-item" data-target="登录">登录</button>
<button class="btn btn-primary" data-context='{"trigger":"click","action":"submit"}'>登录</button>
<div class="annotation-wrap" data-annotation-id="a1">...</div>
<div class="note-card" data-annotation-id="a1">提交后跳转首页</div>
```

规则：

- `data-page` 使用与 PRD 页面名一致的稳定名称，不做同义多命名
- `data-route` 必须存在；PRD 未给出时按页面名生成建议路由
- 三栏外壳（左导航、右说明、拖拽把手）继续保留，但下游解析时应剥离

### 10.2 内嵌清单

在 `</body>` 前写入一份 JSON（不要写注释）：

```html
<script type="application/json" id="prototype-manifest">
{
  "schemaVersion": "1.0",
  "generator": "prototype-designer",
  "mode": "html-only",
  "tokensSource": "UI Design.html",
  "pages": [
    { "name": "登录", "route": "/login", "selector": "[data-page=\"登录\"]", "contextCount": 3 }
  ],
  "shared": ["nav-sidebar"],
  "files": { "pages": "design-pages.html", "designSpec": "UI Design.html", "componentLibrary": "component-library.html", "components": "components.json" }
}
</script>
```

- 模式 1：`mode` 为 `"pen"`，`files.design` 指向 `.pen`，`tokensSource` 写 `"design.pen variables"`
- 模式 3：`mode` 为 `"axure"`，`files.design` 指向 `.rp`，`files.source` 指向 RP/1
- 模式 4：`mode` 为 `"figma"`，`files.design` 指向 Figma URL，`files.fileKey` 记录 `file_key`
- `pages[].selector` 必须在最终 HTML 中唯一命中对应页面容器
- `contextCount` 为该页带 `data-context` 的节点数，供下游核对交互完整性
- `shared` 为跨页复用组件名（来自 `component-library.html` 或可复用节点）
- 不生成外部清单文件，原型保持单文件自包含

### 10.3 下游读取顺序

1. `#prototype-manifest` → 页面清单、路由、交互数、文件索引
2. `section.page[data-page]` → 页面 DOM 与结构
3. `[data-context]` → 交互规格
4. 剥离三栏外壳，只取预览区内容

按此顺序解析即可完成原型转前端所需的页面/结构/交互提取，无需依赖三栏视觉特征。
