// Suggestions de liens internes : pour une page, les AUTRES pages du même site dont le sujet (mot-clé principal, sinon titre) est déjà
// mentionné dans son texte et vers lesquelles elle ne fait pas encore de lien. Calcul purement local et déterministe (aucun service externe,
// aucune IA) : c'est un repère éditorial, pas une promesse d'effet sur le classement. Toutes les lectures sont bornées au site demandé.
const db = require("../config/database");
const urls = require("../services/urls");

const MAX_CANDIDATES = 500;
const MIN_PHRASE = 4;
const fold = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");

// Toutes les chaînes d'une structure (sections d'une page), sans les clés
function strings(node, out = [], depth = 0) {
  if (depth > 12) return out;
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out, depth + 1));
  else if (node && typeof node === "object") Object.values(node).forEach((n) => strings(n, out, depth + 1));
  return out;
}
const plain = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// Texte lisible et liens déjà présents d'un contenu
function extract(values) {
  const links = new Set();
  const texts = [];
  for (const v of values) {
    for (const m of v.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) links.add(m[1]);
    if (/^(\/(?!\/)|https?:\/\/)\S*$/.test(v.trim())) links.add(v.trim());
    else if (!/^(#|data:|\/uploads\/)/.test(v) && v.length < 5000) texts.push(plain(v));
  }
  return { text: texts.join(" . "), links };
}

const samePath = (link, path) => { const l = String(link).split("#")[0].split("?")[0].replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "") || "/"; return l === path; };

// Pur : text = texte de la page, links = liens présents, candidates = [{ id, name, path, phrases: [mots-clés, titre…] }]
function suggest({ text, links = new Set(), candidates, selfPath = null, limit = 10 }) {
  const body = ` ${fold(text)} `;
  const out = [];
  for (const c of candidates) {
    if (selfPath && c.path === selfPath) continue;
    if ([...links].some((l) => samePath(l, c.path))) continue;
    let best = null;
    for (const raw of c.phrases) {
      const phrase = fold(raw).trim();
      if (phrase.length < MIN_PHRASE) continue;
      const re = new RegExp(`(?<![a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "g");
      const hits = [...body.matchAll(re)];
      if (!hits.length) continue;
      const words = phrase.split(/\s+/).length;
      const score = hits.length * words;
      if (!best || score > best.score) {
        const at = hits[0].index;
        best = { score, anchor: raw, count: hits.length, context: body.slice(Math.max(0, at - 40), at + phrase.length + 40).trim() };
      }
    }
    if (best) out.push({ id: c.id, name: c.name, path: c.path, ...best });
  }
  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "fr")).slice(0, limit);
}

const parse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };

// Pages publiées du site → candidats (siteId vérifié par l'appelant)
function candidatesFor(siteId) {
  if (!Number.isInteger(siteId) || siteId <= 0) throw new Error("Suggestions de liens : site non vérifié.");
  return db.prepare("SELECT id, slug, site_id, name, title, seo FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL AND status = 'published' ORDER BY id LIMIT ?").all(siteId, MAX_CANDIDATES).map((r) => {
    const seo = parse(r.seo, {});
    return { id: r.id, name: r.title || r.name, path: urls.pageCanonicalPath(r), phrases: [seo.focusKeyword, r.title, r.name].filter(Boolean) };
  });
}

// Suggestions pour chaque page en ligne du site (la page n'est jamais proposée vers elle-même)
function forSite(siteId, { limitPerPage = 5, pageId = null } = {}) {
  const cands = candidatesFor(siteId);
  const rows = db.prepare("SELECT id, slug, site_id, name, title, description, sections, seo FROM mk_landing_pages WHERE site_id = ? AND archived_at IS NULL AND status = 'published' ORDER BY id LIMIT ?").all(siteId, MAX_CANDIDATES);
  const out = [];
  for (const r of rows) {
    if (pageId && r.id !== pageId) continue;
    const { text, links } = extract([...strings(parse(r.sections, [])), r.title || "", r.description || ""]);
    const items = suggest({ text, links, candidates: cands, selfPath: urls.pageCanonicalPath(r), limit: limitPerPage });
    out.push({ id: r.id, name: r.title || r.name, path: urls.pageCanonicalPath(r), links: links.size, suggestions: items });
  }
  return { pages: out, withSuggestions: out.filter((p) => p.suggestions.length).length, candidates: cands.length, truncated: rows.length >= MAX_CANDIDATES };
}

module.exports = { suggest, extract, strings, forSite, candidatesFor };
