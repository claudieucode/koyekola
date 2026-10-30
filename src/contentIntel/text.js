// Extraction du texte d'un contenu (sections natives d'une page, ou texte brut/Markdown d'un article) vers un « document » commun, lu par tous les analyseurs.
// Aucun second format de contenu : on LIT les sections natives, on ne les remplace pas.
const { outline } = require("../contentGen/seo");

const plain = (s) => String(s ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[*_`>#]+/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
const clip = (s, n) => String(s ?? "").slice(0, n);
const MAX_TEXT = 60000;

// Phrases : coupe sur . ! ? … suivis d'un espace ; ignore les abréviations d'une lettre
function sentences(text) {
  return String(text || "").split(/(?<=[.!?…])\s+(?=[\p{Lu}0-9«"(\[])/u).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2);
}
const wordsOf = (t) => (String(t || "").toLowerCase().match(/[\p{L}\p{N}'’-]+/gu) || []);

// Document depuis les sections natives d'une page. `working` = page.working (brouillon ou en ligne).
function fromSections(working = {}) {
  const sections = Array.isArray(working.sections) ? working.sections : [];
  const parts = [], links = [], images = [], ctas = [];
  for (const s of sections) {
    if (!s || typeof s !== "object") continue;
    for (const k of ["title", "subtitle", "intro", "text", "heading", "caption"]) if (typeof s[k] === "string" && s[k]) parts.push(plain(s[k]));
    if (typeof s.markdown === "string") { parts.push(plain(s.markdown)); for (const m of s.markdown.matchAll(/(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g)) links.push({ anchor: m[1], href: m[2] }); }
    for (const k of ["list", "items"]) for (const it of Array.isArray(s[k]) ? s[k] : []) {
      if (typeof it === "string") parts.push(plain(it));
      else if (it && typeof it === "object") for (const f of ["title", "text", "q", "a"]) if (typeof it[f] === "string") parts.push(plain(it[f]));
    }
    if (s.type === "image") images.push({ alt: String(s.alt || "").trim(), section: s.id });
    if (s.type === "hero" && s.image) images.push({ alt: String(s.imageAlt || "").trim(), section: s.id });
    const btn = s.type === "button" ? { label: s.label, href: s.url } : { label: s.buttonLabel, href: s.buttonUrl };
    if (btn.label) { ctas.push({ label: String(btn.label), href: String(btn.href || ""), section: s.id }); if (btn.href) links.push({ anchor: String(btn.label), href: String(btn.href), cta: true }); }
  }
  const text = clip(parts.filter(Boolean).join("\n"), MAX_TEXT);
  const heads = outline(sections);
  const seo = working.seo && typeof working.seo === "object" ? working.seo : {};
  return { origin: "page", text, sentences: sentences(text), words: wordsOf(text), headings: heads, h1: (heads.find((h) => h.level === 1) || {}).text || "", links, images, ctas, sections, seo,
    faq: sections.filter((s) => s.type === "faq").flatMap((s) => (Array.isArray(s.items) ? s.items : [])).filter((i) => i && i.q && i.a), types: sections.map((s) => s.type) };
}
// Document depuis un texte Markdown/HTML simple (article du blog, sélection dans l'éditeur)
function fromText({ title = "", body = "", seo = {} } = {}) {
  const raw = clip(body, MAX_TEXT * 2), heads = [];
  if (title) heads.push({ level: 1, text: String(title) });
  for (const m of raw.matchAll(/^(#{1,6})\s+(.+)$/gm)) heads.push({ level: m[1].length, text: m[2].trim() });
  for (const m of raw.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) heads.push({ level: Number(m[1]), text: plain(m[2]) });
  const links = [...raw.matchAll(/(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({ anchor: m[1], href: m[2] })).concat([...raw.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({ anchor: plain(m[2]), href: m[1] })));
  const images = [...raw.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)].map((m) => ({ alt: m[1].trim() })).concat([...raw.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ alt: ((m[0].match(/\balt=["']([^"']*)["']/i) || [])[1] || "").trim() })));
  const text = clip(plain(raw.replace(/^#{1,6}\s+.*$/gm, " ")).concat(title ? "" : ""), MAX_TEXT);
  return { origin: "text", text, sentences: sentences(text), words: wordsOf(text), headings: heads, h1: (heads.find((h) => h.level === 1) || {}).text || "", links, images, ctas: [], sections: [], seo, faq: [], types: [] };
}
// Empreinte de contenu : sert à ne pas ré-analyser un contenu inchangé
const fingerprint = (doc, extra = "") => require("node:crypto").createHash("sha1").update(JSON.stringify([doc.text, doc.headings.map((h) => h.text), doc.links, doc.images, doc.seo, doc.types, extra])).digest("hex").slice(0, 20);

module.exports = { plain, sentences, wordsOf, fromSections, fromText, fingerprint, MAX_TEXT };
