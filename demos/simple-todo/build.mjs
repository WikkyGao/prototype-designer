import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);

const pagesSource = read("design-pages.html");
const pageCssMatch = pagesSource.match(/<style data-role="page-css">([\s\S]*?)<\/style>/);
const pagesMatch = pagesSource.match(/<!-- pages:start -->([\s\S]*?)<!-- pages:end -->/);
if (!pageCssMatch || !pagesMatch) {
  throw new Error("design-pages.html is missing page CSS or page markers");
}

const pageCss = pageCssMatch[1].trim();
const pagesHtml = pagesMatch[1].trim();
const overlayAt = pagesHtml.indexOf('<div class="modal-backdrop" id="taskModal"');
if (overlayAt < 0) throw new Error("design-pages.html is missing the overlay block");
const pageSectionsHtml = pagesHtml.slice(0, overlayAt).trim();
const overlaysHtml = pagesHtml.slice(overlayAt).trim();
const pageJs = read("page.js").trim();
const annotationsJs = read("annotations.js").trim();
const variablesCss = read("variables.css").trim();
const editorialCss = read("styles/editorial.css").trim();
const annotatedCss = read("styles/annotated.css").trim();
const reviewCss = read("styles/review-flat.css").trim();

function inject(template, marker, content) {
  if (!template.includes(marker)) throw new Error(`Missing marker: ${marker}`);
  return template.split(marker).join(content);
}

function buildManifest(style, tokensSource) {
  const pages = [];
  const sectionRe = /<section class="page[^"]*" data-page="([^"]+)" data-route="([^"]+)">([\s\S]*?)<\/section>/g;
  let match;
  while ((match = sectionRe.exec(pageSectionsHtml))) {
    const body = match[3];
    pages.push({
      name: match[1],
      route: match[2],
      selector: `[data-page="${match[1]}"]`,
      contextCount: (body.match(/data-context=/g) || []).length
    });
  }
  return JSON.stringify({
    schemaVersion: "1.0",
    generator: "prototype-designer",
    mode: "html-only",
    style,
    tokensSource,
    pages,
    shared: style === "editorial-ink" ? ["top-nav", "page-notes"] : ["nav-sidebar", "annotation-layer", "notes-panel"],
    files: {
      pages: "design-pages.html",
      designSpec: "UI Design.html",
      componentLibrary: "component-library.html",
      components: "components.json"
    }
  }, null, 2);
}

function buildEditorial() {
  let html = read("shells/editorial.html");
  html = inject(html, "/*INJECT_PAGE_CSS*/", pageCss);
  html = inject(html, "/*INJECT_STYLE_CSS*/", editorialCss);
  html = inject(html, "<!--INJECT_PAGES-->", pageSectionsHtml);
  html = inject(html, "<!--INJECT_OVERLAYS-->", overlaysHtml);
  html = inject(html, "<!--INJECT_MANIFEST-->", buildManifest("editorial-ink", "editorial-ink preset"));
  html = inject(html, "/*INJECT_PAGE_JS*/", pageJs);
  write("design-prototype.html", html);
  return html.length;
}

function buildAnnotated() {
  let html = read("shells/annotated.html");
  html = inject(html, "/*INJECT_PAGE_CSS*/", pageCss);
  html = inject(html, "/*INJECT_VARIABLES*/", variablesCss);
  html = inject(html, "/*INJECT_STYLE_CSS*/", annotatedCss);
  html = inject(html, "<!--INJECT_REQBAR-->", "");
  html = inject(html, "<!--INJECT_PAGES-->", pageSectionsHtml);
  html = inject(html, "<!--INJECT_OVERLAYS-->", overlaysHtml);
  html = inject(html, "<!--INJECT_MANIFEST-->", buildManifest("project", "UI Design.html"));
  html = inject(html, "/*INJECT_ANNOTATIONS*/", annotationsJs);
  html = inject(html, "/*INJECT_PAGE_JS*/", pageJs);
  write("design-prototype-annotated.html", html);
  return html.length;
}

const reviewBar = `
      <div class="reqbar">
        <span class="req-tag">原型预览</span>
        <p><b>需求：</b>微光清单只服务「今天」。登录进入今日清单，支持新建、完成、筛选、详情、删除二次确认与归档恢复；数据保存在本机，刷新不丢，演示数据可重置。</p>
        <span class="req-meta">2026-10-22 · 已确认</span>
      </div>`;

function buildReview() {
  let html = read("shells/annotated.html");
  html = inject(html, "/*INJECT_PAGE_CSS*/", pageCss);
  html = inject(html, "/*INJECT_VARIABLES*/", variablesCss);
  html = inject(html, "/*INJECT_STYLE_CSS*/", annotatedCss + "\n\n" + reviewCss);
  html = inject(html, "<!--INJECT_REQBAR-->", reviewBar);
  html = inject(html, "<!--INJECT_PAGES-->", pageSectionsHtml);
  html = inject(html, "<!--INJECT_OVERLAYS-->", overlaysHtml);
  html = inject(html, "<!--INJECT_MANIFEST-->", buildManifest("project", "UI Design.html"));
  html = inject(html, "/*INJECT_ANNOTATIONS*/", annotationsJs);
  html = inject(html, "/*INJECT_PAGE_JS*/", pageJs);
  html = html.replace('<span class="eyebrow">ANNOTATIONS</span>', '<span class="eyebrow">REQUIREMENTS</span>');
  html = html.replace('<h2>页面说明</h2>', '<h2>需求说明</h2>');
  html = html.replace(
    '<p class="desc"><b id="notePage">登录</b> · <span id="noteCount">3</span> 条标注 · 点击卡片定位</p>',
    '<p class="desc"><b id="notePage">登录</b> · <span id="noteCount">3</span> 条说明 · <span class="confirmed">已确认</span></p>'
  );
  html = html.replace(
    '<div class="notes-scroll" id="infoContent"></div>',
    '<div class="notes-scroll" id="infoContent"></div>\n    <div class="notes-foot"><span>已确认 10 条需求</span><span>2026-10-22 · 数据为模拟</span></div>'
  );
  write("design-prototype-review.html", html);
  return html.length;
}

const sizes = { editorial: buildEditorial(), annotated: buildAnnotated(), review: buildReview() };
for (const [name, size] of Object.entries(sizes)) {
  console.log(`${name}: ${(size / 1024).toFixed(1)} KB`);
}
