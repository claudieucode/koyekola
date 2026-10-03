// Validateur HTML : télécharge une page publique du site (comme un robot) et relève ce qu'elle publie réellement —
// <title>, description, robots, canonical, Open Graph, X, JSON-LD, H1, images sans ALT, liens. Sert au contrôle qualité
// (réglages ↔ HTML), à l'audit et à l'analyse « cette page ». Ne lit QUE les pages du site lui-même.
const http = require("http");
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const schema = require("./schema");

const TIMEOUT_MS = 10000;
const MAX_BYTES = 3 * 1024 * 1024;

// Le serveur s'interroge lui-même en local (boucle locale) : rapide, sans dépendre du DNS ni du certificat
function fetchLocal(path, { host = "localhost" } = {}) {
  const port = Number(process.env.PORT || 3002);
  return new Promise((resolve) => {
    const started = Date.now();
    const req = http.request({ host: "127.0.0.1", port, path, method: "GET", headers: { Host: host, "User-Agent": "KOLAKISA-SEO-Inspector/1 (+robot interne)", Accept: "text/html" } }, (res) => {
      let size = 0;
      const chunks = [];
      res.on("data", (c) => { size += c.length; if (size <= MAX_BYTES) chunks.push(c); });
      res.on("end", () => resolve({ ok: true, status: res.statusCode, headers: res.headers, location: res.headers.location || null, body: Buffer.concat(chunks).toString("utf8"), ms: Date.now() - started }));
    });
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error("timeout")));
    req.on("error", (error) => resolve({ ok: false, status: 0, error: error.message === "timeout" ? "Délai dépassé (10 s)" : "Page injoignable", ms: Date.now() - started }));
    req.end();
  });
}

const text = (node) => DomUtils.textContent(node).replace(/\s+/g, " ").trim();

// Analyse du HTML : tout ce qui compte pour le référencement, tel que publié
function parse(html) {
  const doc = parseDocument(html, { decodeEntities: true });
  const all = (name) => DomUtils.findAll((n) => n.name === name, doc.children);
  const metas = all("meta");
  const metaOf = (attr, key) => { const m = metas.find((x) => (x.attribs[attr] || "").toLowerCase() === key); return m ? m.attribs.content ?? null : null; };
  const metaAll = (attr, key) => metas.filter((x) => (x.attribs[attr] || "").toLowerCase() === key).map((m) => m.attribs.content);
  const links = all("link");
  const titleNodes = all("title");
  const jsonLd = [];
  let jsonLdError = false;
  for (const s of all("script").filter((x) => x.attribs.type === "application/ld+json")) {
    try { jsonLd.push(JSON.parse(text(s) || DomUtils.getText(s))); } catch { jsonLdError = true; }
  }
  const main = DomUtils.findOne((n) => n.name === "main", doc.children) || doc;
  const imgs = DomUtils.findAll((n) => n.name === "img", [main]);
  const anchors = DomUtils.findAll((n) => n.name === "a" && n.attribs.href, [main]);
  // Tous les liens de la page (menu et pied de page compris), pour le graphe des liens internes
  const mainSet = new Set(anchors);
  const allAnchors = DomUtils.findAll((n) => n.name === "a" && n.attribs.href, doc.children).map((a) => ({ href: a.attribs.href, inMain: mainSet.has(a), rel: a.attribs.rel || "" }));
  const htmlNode = DomUtils.findOne((n) => n.name === "html", doc.children);
  return {
    lang: htmlNode ? htmlNode.attribs.lang || null : null,
    title: titleNodes.length ? text(titleNodes[0]) : null,
    titleCount: titleNodes.length,
    description: metaOf("name", "description"),
    descriptionCount: metaAll("name", "description").length,
    robots: metaOf("name", "robots"),
    viewport: metaOf("name", "viewport"),
    canonical: (links.find((l) => (l.attribs.rel || "").toLowerCase() === "canonical") || { attribs: {} }).attribs.href || null,
    canonicalCount: links.filter((l) => (l.attribs.rel || "").toLowerCase() === "canonical").length,
    og: Object.fromEntries(["og:title", "og:description", "og:url", "og:type", "og:image", "og:image:width", "og:image:height", "og:site_name", "og:locale"].map((k) => [k, metaOf("property", k)])),
    twitter: Object.fromEntries(["twitter:card", "twitter:title", "twitter:description", "twitter:image"].map((k) => [k, metaOf("name", k)])),
    jsonLd, jsonLdError,
    jsonLdProblems: jsonLdError ? [{ level: "critical", message: "Données structurées : JSON invalide." }] : schema.validate(jsonLd),
    h1: DomUtils.findAll((n) => n.name === "h1", doc.children).map(text),
    headings: DomUtils.findAll((n) => /^h[2-4]$/.test(n.name), [main]).map((n) => ({ level: Number(n.name[1]), text: text(n) })),
    images: imgs.map((i) => ({ src: i.attribs.src || "", alt: i.attribs.alt, hasAlt: Object.hasOwn(i.attribs, "alt"), width: i.attribs.width || null, height: i.attribs.height || null, loading: i.attribs.loading || null })),
    links: anchors.map((a) => ({ href: a.attribs.href, text: text(a).slice(0, 120), rel: a.attribs.rel || "" })),
    allLinks: allAnchors,
    text: text(main).slice(0, 60000),
    words: text(main).split(/\s+/).filter(Boolean).length,
  };
}

async function inspect(path, opts) {
  const r = await fetchLocal(path, opts);
  if (!r.ok) return { path, ok: false, status: 0, error: r.error, ms: r.ms };
  const out = { path, ok: true, status: r.status, location: r.location, ms: r.ms, xRobots: r.headers["x-robots-tag"] || null };
  if (r.status === 200 && /text\/html/.test(r.headers["content-type"] || "")) out.page = parse(r.body);
  return out;
}

module.exports = { inspect, parse, fetchLocal };
