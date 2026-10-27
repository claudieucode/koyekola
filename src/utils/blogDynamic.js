// Fabrication du HTML des blocs dynamiques (voir src/shared/dynamicBlocks.js) à l'affichage d'un article. Tout texte vient de la base ou d'un flux
// et passe par des nœuds texte (jamais concaténé en HTML) : aucune injection possible. Les adresses ont déjà été validées (articles du site) ou sont
// revérifiées ici (flux RSS : http/https seulement, liens externes en nofollow).
const { Element, Text } = require("domhandler");
const { NETWORKS } = require("../shared/dynamicBlocks");

const el = (name, attribs = {}, children = []) => { const n = new Element(name, attribs, children); children.forEach((c) => { c.parent = n; }); return n; };
const text = (v) => new Text(String(v == null ? "" : v));
const a = (href, label, extra = {}) => el("a", { href, ...extra }, [text(label)]);
const title = (t) => (t ? [el("p", { class: "kb-widget-title" }, [text(t)])] : []);
const widget = (cls, label, attribs, children) => el("aside", { class: `${cls} kb-widget`, "aria-label": label, ...attribs }, children);
const IMG_OK = /^\/uploads\/(?:thumbnails\/|marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?)[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
let counter = 0;

function latest(attribs, ctx) {
  const rows = ctx.widgets.latest({ count: Number(attribs["data-count"]) || 5, category: attribs["data-category"] || "" });
  if (!rows.length) return null;
  const items = rows.map((r) => {
    const parts = [];
    if (attribs["data-image"] === "true" && r.image && IMG_OK.test(r.image)) parts.push(el("img", { src: r.image, alt: r.alt || "", loading: "lazy", decoding: "async" }));
    const body = [a(r.url, r.title, { class: "kb-latest-title" })];
    if (attribs["data-date"] === "true" && r.date) body.push(text(" "), el("span", { class: "kb-latest-date" }, [text(r.date)]));
    if (attribs["data-excerpt"] === "true" && r.excerpt) body.push(el("p", { class: "kb-latest-excerpt" }, [text(r.excerpt)]));
    parts.push(el("div", { class: "kb-latest-body" }, body));
    return el("li", {}, parts);
  });
  return widget("kb-latest", attribs["data-title"] || "Derniers articles", { "data-view": attribs["data-view"] === "grid" ? "grid" : "list" }, [...title(attribs["data-title"]), el("ul", {}, items)]);
}
function categories(attribs, ctx) {
  const rows = ctx.widgets.categories();
  if (!rows.length) return null;
  return widget("kb-categories", attribs["data-title"] || "Catégories", {}, [...title(attribs["data-title"]), el("ul", {}, rows.map((r) => el("li", {}, [a(r.url, r.name), ...(attribs["data-count"] === "true" ? [text(" "), el("span", { class: "kb-widget-count" }, [text(`(${r.count})`)])] : [])])))]);
}
function tags(attribs, ctx) {
  const rows = ctx.widgets.tags({ max: Number(attribs["data-max"]) || 20 });
  if (!rows.length) return null;
  const top = Math.max(...rows.map((r) => r.count));
  return widget("kb-tags", attribs["data-title"] || "Étiquettes", {}, [...title(attribs["data-title"]), el("ul", {}, rows.map((r) => el("li", { "data-weight": String(Math.min(5, Math.max(1, Math.ceil((r.count / top) * 5)))) }, [a(r.url, r.name, { title: `${r.count} article${r.count > 1 ? "s" : ""}` })])))]);
}
function archives(attribs, ctx) {
  const rows = ctx.widgets.archives({ max: Number(attribs["data-max"]) || 12 });
  if (!rows.length) return null;
  return widget("kb-archives", attribs["data-title"] || "Archives", {}, [...title(attribs["data-title"]), el("ul", {}, rows.map((r) => el("li", {}, [a(r.url, r.label), ...(attribs["data-count"] === "true" ? [text(" "), el("span", { class: "kb-widget-count" }, [text(`(${r.count})`)])] : [])])))]);
}
function calendar(attribs, ctx) {
  const c = ctx.widgets.calendar();
  const pad = (n) => String(n).padStart(2, "0");
  const first = (new Date(Date.UTC(c.year, c.month - 1, 1)).getUTCDay() + 6) % 7; // lundi = 0
  const count = new Date(Date.UTC(c.year, c.month, 0)).getUTCDate();
  const head = el("tr", {}, ["Lu:lundi", "Ma:mardi", "Me:mercredi", "Je:jeudi", "Ve:vendredi", "Sa:samedi", "Di:dimanche"].map((s) => { const [short, long] = s.split(":"); return el("th", { scope: "col" }, [el("abbr", { title: long }, [text(short)])]); }));
  const rows = []; let cells = [];
  for (let i = 0; i < first; i++) cells.push(el("td", {}, []));
  for (let d = 1; d <= count; d++) {
    const n = c.days[d];
    cells.push(el("td", {}, [n ? a(`/blog?date=${c.ym}-${pad(d)}`, String(d), { "aria-label": `${n} article${n > 1 ? "s" : ""} le ${d} ${c.label.split(" ")[0]}` }) : text(String(d))]));
    if (cells.length === 7) { rows.push(el("tr", {}, cells)); cells = []; }
  }
  if (cells.length) { while (cells.length < 7) cells.push(el("td", {}, [])); rows.push(el("tr", {}, cells)); }
  return widget("kb-calendar", `Calendrier de ${c.label}`, {}, [el("table", {}, [el("caption", {}, [text(c.label)]), el("thead", {}, [head]), el("tbody", {}, rows)])]);
}
function search(attribs) {
  const id = `kb-search-${++counter}`;
  return el("form", { class: "kb-search kb-widget", role: "search", action: "/blog", method: "get" }, [
    ...title(attribs["data-title"]),
    el("label", { class: "sr-only", for: id }, [text(attribs["data-placeholder"] || "Rechercher un article")]),
    el("input", { type: "search", id, name: "q", maxlength: "100", placeholder: attribs["data-placeholder"] || "Rechercher un article", autocomplete: "off" }),
    el("button", { type: "submit", class: "btn btn-primary" }, [text(attribs["data-button"] || "Rechercher")]),
  ]);
}
function social(attribs) {
  const links = String(attribs["data-links"] || "").split(/\s+/).filter(Boolean).map((t) => { const i = t.indexOf("="); return [t.slice(0, i), t.slice(i + 1)]; }).filter(([net]) => NETWORKS[net]);
  if (!links.length) return null;
  return widget("kb-social", attribs["data-title"] || "Réseaux sociaux", { "data-size": /^(s|l)$/.test(attribs["data-size"] || "") ? attribs["data-size"] : "m" }, [
    ...title(attribs["data-title"]),
    el("ul", {}, links.map(([net, url]) => el("li", {}, [el("a", { href: url, class: `kb-social-link kb-social-${net}`, "aria-label": NETWORKS[net].label, ...(net === "email" ? {} : { target: "_blank", rel: "noopener noreferrer nofollow me" }) }, [text(NETWORKS[net].label)])]))),
  ]);
}
function pageList(attribs, ctx) {
  const rows = ctx.widgets.pages();
  if (!rows.length) return null;
  return widget("kb-pagelist", attribs["data-title"] || "Pages", {}, [...title(attribs["data-title"]), el("ul", {}, rows.map((r) => el("li", {}, [a(r.url, r.title)])))]);
}
function rss(attribs, ctx) {
  const feed = ctx.widgets.feed(attribs["data-url"]);
  const items = (feed.items || []).slice(0, Number(attribs["data-count"]) || 5);
  if (!items.length) return null;
  return widget("kb-rss", attribs["data-title"] || feed.title || "Flux RSS", {}, [
    ...title(attribs["data-title"] || feed.title),
    el("ul", {}, items.map((r) => el("li", {}, [
      a(r.url, r.title, { target: "_blank", rel: "noopener noreferrer nofollow" }),
      ...(attribs["data-date"] === "true" && r.date ? [text(" "), el("time", { datetime: r.date }, [text(r.date)])] : []),
      ...(attribs["data-excerpt"] === "true" && r.excerpt ? [el("p", {}, [text(r.excerpt)])] : []),
    ]))),
  ]);
}
// Sommaire : liste des titres de l'article (niveau 2 à `depth`), avec le numéro de page quand l'article est découpé en pages
function toc(attribs, entries, pageHref) {
  const depth = Number(attribs["data-depth"]) || 3;
  const rows = entries.filter((t) => t.level <= depth);
  if (!rows.length) return null;
  return widget("kb-toc", attribs["data-title"] || "Sommaire", {}, [...title(attribs["data-title"] || "Sommaire"), el("ol", {}, rows.map((t) => el("li", { "data-level": String(t.level) }, [a(`${pageHref(t.page || 1)}#${t.id}`, t.text)])))]);
}

const BUILDERS = { "kb-latest": latest, "kb-categories": categories, "kb-tags": tags, "kb-archives": archives, "kb-calendar": calendar, "kb-search": search, "kb-social": social, "kb-pagelist": pageList, "kb-rss": rss };
module.exports = { BUILDERS, toc, el, text };
