// Détection des liens internes cassés (palier 12). Aucun robot d'exploration : seulement les liens CONNUS du système, lus dans
//   • les éléments de menus (références d'objets et adresses personnalisées),
//   • les pages en ligne (boutons, liens de sections et d'éléments, liens des textes),
//   • les articles publiés (liens du contenu).
// Chaque adresse interne distincte est vérifiée une fois : le moteur d'URLs répond pour les ressources qu'il connaît ; pour toute autre adresse,
// la sonde interroge le vrai serveur (code HTTP réel : 200, 301/302, 404). Résultat : cassé (404, corbeille, brouillon) ou redirigé (à mettre à jour).
const db = require("../config/database");
const urls = require("./urls");
const probe = require("../seo/probe");

const LINK_KEYS = new Set(["url", "href", "link", "buttonUrl", "ctaUrl", "target", "linkUrl", "src_link"]);
const SKIP = /^\/(uploads|css|js|img|fonts|marketing|formateur)(\/|$)/;
const MAX_LINKS = 3000;

// « /blog/x?utm=1#a » → « /blog/x » ; null si ce n'est pas une adresse interne vérifiable
function internalPath(raw) {
  let v = String(raw || "").trim();
  if (!v.startsWith("/") || v.startsWith("//")) return null;
  v = v.split("#")[0].split("?")[0];
  if (!v || SKIP.test(v) || /\{\{|\}\}|%7B/i.test(v)) return null; // étiquettes dynamiques : pas une adresse fixe
  const p = urls.cleanPath(v);
  return p;
}

function collectFromJson(value, out, key = "") {
  if (typeof value === "string") {
    if (LINK_KEYS.has(key)) { const p = internalPath(value); if (p) out.add(p); }
    for (const m of value.matchAll(/\]\((\/[^)\s]*)\)/g)) { const p = internalPath(m[1]); if (p) out.add(p); }
    for (const m of value.matchAll(/href="(\/[^"]*)"/g)) { const p = internalPath(m[1]); if (p) out.add(p); }
  } else if (Array.isArray(value)) value.forEach((v) => collectFromJson(v, out, key));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) collectFromJson(v, out, k);
}
const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

// Liens connus : [{ path, source: { type, id, title, editUrl, where } }]
function collect() {
  const found = [];
  const add = (paths, source) => { for (const path of paths) found.push({ path, source }); };

  // 1. Menus
  const navigation = require("./navigation");
  try {
    const items = db.prepare("SELECT i.id, i.menu_id, i.type, i.object_id, i.url, i.label, m.name AS menu, m.site_id FROM nav_items i JOIN nav_menus m ON m.id = i.menu_id WHERE i.status = 'published' AND m.status = 'published'").all();
    const byType = new Map();
    for (const it of items) if (it.object_id && navigation.TYPES[it.type] && navigation.TYPES[it.type].resolve) { if (!byType.has(it.type)) byType.set(it.type, new Set()); byType.get(it.type).add(it.object_id); }
    const resolved = {};
    for (const [t, ids] of byType) resolved[t] = navigation.TYPES[t].resolve([...ids]);
    for (const it of items) {
      const source = { type: "menu", id: it.menu_id, title: `${it.menu} › ${it.label || "(sans titre)"}`, editUrl: `/marketing/site-web/navigation/menus/${it.menu_id}`, where: "Menu" };
      if (it.object_id && resolved[it.type]) {
        const hit = resolved[it.type].get(it.object_id);
        if (!hit) found.push({ path: null, problem: "Ressource liée introuvable (supprimée)", source });
        else if (hit.state !== "ok") found.push({ path: hit.url, problem: hit.state === "trashed" ? "La ressource liée est à la corbeille" : "La ressource liée n'est pas publiée", source });
        else found.push({ path: hit.url, source });
      } else if (it.type === "custom") { const p = internalPath(it.url); if (p) found.push({ path: p, source }); }
    }
  } catch (error) { if (!/no such table/i.test(error.message)) throw error; }

  // 2. Pages en ligne
  try {
    for (const p of db.prepare("SELECT id, name, title, slug, sections FROM mk_landing_pages WHERE status = 'published' AND archived_at IS NULL").all()) {
      const set = new Set();
      collectFromJson(parse(p.sections), set);
      add(set, { type: "page", id: p.id, title: p.title || p.name, editUrl: `/marketing/pages/${p.id}/editeur`, where: "Page" });
    }
  } catch (error) { if (!/no such (table|column)/i.test(error.message)) throw error; }

  // 3. Articles publiés
  for (const a of db.prepare("SELECT id, title, content FROM posts WHERE published = 1 AND deleted_at IS NULL").all()) {
    const set = new Set();
    collectFromJson(a.content, set);
    add(set, { type: "post", id: a.id, title: a.title, editUrl: `/formateur/blog/${a.id}/modifier`, where: "Article" });
  }
  return found;
}

// Verdict d'une adresse : { status: "ok" | "redirected" | "broken", detail, http?, to? }
async function judge(path, port) {
  const r = urls.resolve(path);
  if (r.state === "live") return { status: "ok" };
  if (r.state === "trashed") return { status: "broken", detail: "La ressource est à la corbeille", http: 404 };
  if (r.state === "draft") return { status: "broken", detail: "La ressource n'est pas publiée", http: 404 };
  // Toute autre adresse : le vrai serveur répond (routes fixes, redirections gérées, historique, 404)
  const t = await probe.trace(port, path);
  const first = t.steps[0];
  if (t.loop) return { status: "broken", detail: "Boucle de redirections", http: 0 };
  if (first.status >= 300 && first.status < 400) {
    const final = t.final;
    const to = t.steps[t.steps.length - 1].location || t.steps[t.steps.length - 1].url;
    if (final.status === 200 || final.external) return { status: "redirected", detail: `Redirigé (${first.status}) vers ${t.steps.length > 1 ? t.steps[t.steps.length - 1].url : first.location}`, to, http: first.status };
    return { status: "broken", detail: `Redirigé vers une adresse en erreur (${final.status})`, http: final.status };
  }
  if (first.status === 200) return { status: "ok" };
  if (first.status === 0) return { status: "unknown", detail: "Vérification impossible", http: 0 };
  return { status: "broken", detail: first.status === 404 ? "Page introuvable (404)" : `Erreur ${first.status}`, http: first.status };
}

// Analyse complète : liens groupés par adresse ; seuls les liens à corriger sont renvoyés
async function scan({ port }) {
  const all = collect().slice(0, MAX_LINKS);
  const verdicts = new Map();
  const issues = [];
  let checked = 0;
  for (const link of all) {
    if (link.problem) { issues.push({ path: link.path, status: "broken", detail: link.problem, source: link.source }); continue; }
    let v = verdicts.get(link.path);
    if (!v) { v = await judge(link.path, port); verdicts.set(link.path, v); checked++; }
    if (v.status === "broken" || v.status === "redirected") issues.push({ path: link.path, ...v, source: link.source });
  }
  return { issues, checked, links: all.length, at: new Date().toISOString() };
}

module.exports = { scan, collect, judge, internalPath };
