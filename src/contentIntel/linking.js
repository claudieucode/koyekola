// Internal Linking Intelligence : analyse du maillage des pages d'UN site, propositions de liens que la personne accepte ou refuse une à une.
// Réutilise seo/linkSuggestions (détection d'un sujet déjà cité dans le texte). Ajouts : décision persistée, application contrôlée dans le BROUILLON (jamais en ligne),
// version de la page prise avant (restauration), pages orphelines, ancres génériques, liens vers des pages non publiées. Jamais de lien vers une page inexistante ni d'un autre site.
// Limite documentée : seuls les liens écrits DANS le contenu sont comptés ; les menus et pieds de page ne le sont pas.
const store = require("./store");
const textLib = require("./text");
const ls = require("../seo/linkSuggestions");
const urls = require("../services/urls");
const pages = require("../marketing/pages");

const bad = (m, code = "invalid") => Object.assign(new Error(m), { code, name: "MarketingError" });
const GENERIC = new Set(["cliquez ici", "ici", "en savoir plus", "lire la suite", "voir plus", "lien", "click here", "here", "read more", "learn more", "more", "ver mas", "aqui"]);
const now = (ctx) => new Date(ctx.now ? ctx.now() : Date.now()).toISOString();
const MAX = 300;
const pathOf = (href) => { const h = String(href || "").trim(); if (!h || /^(#|mailto:|tel:|javascript:)/i.test(h)) return null; try { const u = new URL(h, "http://interne.local"); if (u.host !== "interne.local") return null; return decodeURI(u.pathname).replace(/\/+$/, "") || "/"; } catch { return null; } };

function sitePages(ctx, siteId) {
  return ctx.db.prepare("SELECT id, slug, site_id, name, title, status FROM mk_landing_pages WHERE site_id = ? AND organization_id = ? AND archived_at IS NULL ORDER BY id LIMIT ?").all(siteId, ctx.organizationId, MAX).map((r) => ({ ...r, path: urls.pageCanonicalPath(r) }));
}
// Analyse : pour chaque page, liens sortants internes, entrants, ancres génériques, liens vers des pages non publiées
function analyze(ctx, siteId) {
  const list = sitePages(ctx, siteId), byPath = new Map(list.map((p) => [p.path, p]));
  const info = list.map((p) => { const w = (pages.requirePage(ctx, p.id) || {}).working || {}; const doc = textLib.fromSections(w); return { ...p, doc }; });
  const inbound = new Map(list.map((p) => [p.id, new Set()]));
  const out = { generic: [], toUnpublished: [], toMissing: [], pages: [] };
  for (const p of info) {
    let outCount = 0;
    for (const l of p.doc.links) {
      const path = pathOf(l.href);
      if (!path) continue;
      const target = byPath.get(path);
      if (target && target.id !== p.id) { inbound.get(target.id).add(p.id); outCount++; if (target.status !== "published" && p.status === "published") out.toUnpublished.push({ pageId: p.id, pageName: p.name, href: l.href, target: target.name }); }
      if (!l.cta && GENERIC.has(textLib.plain(l.anchor).toLowerCase())) out.generic.push({ pageId: p.id, pageName: p.name, anchor: l.anchor, href: l.href });
      if (!target && /^\/(p|pages?)\//.test(path)) out.toMissing.push({ pageId: p.id, pageName: p.name, href: l.href });
    }
    out.pages.push({ id: p.id, name: p.name, path: p.path, status: p.status, outbound: outCount });
  }
  const homeId = (ctx.db.prepare("SELECT home_page_id FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, ctx.organizationId) || {}).home_page_id;
  for (const row of out.pages) { row.inbound = inbound.get(row.id).size; row.orphan = row.status === "published" && row.inbound === 0 && row.id !== homeId; }
  out.orphans = out.pages.filter((r) => r.orphan);
  out.limits = "Seuls les liens écrits dans le contenu des pages sont comptés ; les menus, pieds de page et liens générés par le thème ne le sont pas. La vérification des liens cassés en conditions réelles reste celle de l'analyse SEO du site.";
  out.truncated = list.length >= MAX;
  return out;
}
// Génère et enregistre des propositions (sans en créer deux fois la même, ni rouvrir une proposition déjà refusée)
function propose(ctx, siteId, { pageId = null, limitPerPage = 5 } = {}) {
  store.ensureSchema(ctx.db);
  const parse = (t) => store.json(t, {});
  const rows = ctx.db.prepare("SELECT id, slug, site_id, name, title, description, sections, seo FROM mk_landing_pages WHERE site_id = ? AND organization_id = ? AND archived_at IS NULL AND status = 'published' ORDER BY id LIMIT ?").all(siteId, ctx.organizationId, MAX);
  // candidats = pages EN LIGNE de ce site uniquement (lues par la base du contexte, jamais d'un autre site)
  const cands = rows.map((r) => ({ id: r.id, name: r.title || r.name, path: urls.pageCanonicalPath(r), phrases: [parse(r.seo).focusKeyword, r.title, r.name].filter(Boolean) }));
  const insert = ctx.db.prepare("INSERT OR IGNORE INTO mk_ci_link_props (site_id, organization_id, page_id, target_page_id, anchor, context, status, created_at) VALUES (?,?,?,?,?,?, 'proposed', ?)");
  let created = 0;
  for (const r of rows) {
    if (pageId && r.id !== pageId) continue;
    const { text, links } = ls.extract([...ls.strings(store.json(r.sections, [])), r.title || "", r.description || ""]);
    const items = ls.suggest({ text, links, candidates: cands, selfPath: urls.pageCanonicalPath(r), limit: limitPerPage });
    for (const s of items) {
      // une décision déjà prise (acceptée ou refusée) n'est jamais rouverte : l'index unique + INSERT OR IGNORE
      created += Number(insert.run(siteId, ctx.organizationId, r.id, s.id, String(s.anchor).slice(0, 120), String(s.context || "").slice(0, 200), now(ctx)).changes);
    }
  }
  return { created, ...list(ctx, siteId, { pageId, status: "proposed" }) };
}
function list(ctx, siteId, { pageId = null, status = null } = {}) {
  store.ensureSchema(ctx.db);
  const rows = ctx.db.prepare(`SELECT l.*, s.name AS source_name, t.name AS target_name, t.slug AS target_slug, t.site_id AS target_site FROM mk_ci_link_props l
    JOIN mk_landing_pages s ON s.id = l.page_id AND s.site_id = l.site_id JOIN mk_landing_pages t ON t.id = l.target_page_id AND t.site_id = l.site_id
    WHERE l.site_id = ? AND l.organization_id = ? AND (? IS NULL OR l.page_id = ?) AND (? IS NULL OR l.status = ?) ORDER BY l.id DESC LIMIT 200`).all(siteId, ctx.organizationId, pageId, pageId, status, status);
  return { proposals: rows.map((r) => ({ id: r.id, pageId: r.page_id, pageName: r.source_name, targetId: r.target_page_id, targetName: r.target_name, targetPath: urls.pageCanonicalPath({ id: r.target_page_id, slug: r.target_slug, site_id: r.target_site }), anchor: r.anchor, context: r.context, status: r.status, appliedSection: r.applied_section })) };
}
const own = (ctx, siteId, id) => {
  const r = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_ci_link_props WHERE id = ? AND site_id = ? AND organization_id = ?").get(id, siteId, ctx.organizationId) : null;
  if (!r) throw bad("Proposition introuvable dans ce site.", "not_found");
  return r;
};
function refuse(ctx, siteId, id) {
  store.ensureSchema(ctx.db);
  const r = own(ctx, siteId, id);
  if (r.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict");
  ctx.db.prepare("UPDATE mk_ci_link_props SET status = 'refused', decided_by = ?, decided_at = ? WHERE id = ?").run(ctx.userId || null, now(ctx), id);
  return { id, status: "refused" };
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Accepter = insérer le lien dans le BROUILLON, dans un texte Markdown où l'ancre apparaît encore et n'est pas déjà un lien. Version de la page prise avant.
function accept(ctx, siteId, id) {
  store.ensureSchema(ctx.db);
  const r = own(ctx, siteId, id);
  if (r.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict");
  const target = ctx.db.prepare("SELECT id, slug, site_id, status FROM mk_landing_pages WHERE id = ? AND site_id = ? AND organization_id = ? AND archived_at IS NULL").get(r.target_page_id, siteId, ctx.organizationId);
  if (!target || target.status !== "published") throw bad("La page cible n'existe plus ou n'est plus publiée : aucun lien n'est créé.", "target_gone");
  const href = urls.pageCanonicalPath(target);
  const page = pages.requirePage(ctx, r.page_id);
  if (page.site_id !== siteId) throw bad("Page introuvable dans ce site.", "not_found");
  const sections = JSON.parse(JSON.stringify((page.working || {}).sections || []));
  const re = new RegExp(`(?<![\\p{L}\\p{N}\\[])(${esc(r.anchor)})(?![\\p{L}\\p{N}\\]])`, "iu");
  let done = null;
  for (const s of sections) {
    if (s.type !== "text" || typeof s.markdown !== "string") continue;
    const parts = s.markdown.split(/(\[[^\]]*\]\([^)]*\))/); // ne touche jamais l'intérieur d'un lien existant
    for (let i = 0; i < parts.length && !done; i += 2) if (re.test(parts[i])) { parts[i] = parts[i].replace(re, (m) => `[${m}](${href})`); done = s.id; }
    if (done) { s.markdown = parts.join(""); break; }
  }
  if (!done) throw bad("L'ancre n'apparaît plus dans un texte modifiable de cette page (ou se trouve déjà dans un lien) : aucun changement.", "cannot_apply");
  let snapshotId = null;
  try { snapshotId = require("../regen").takeSnapshot(ctx, siteId, { level: "page", pageId: r.page_id, label: `Avant lien interne vers « ${r.anchor} »` }).id; } catch { /* la sauvegarde de version ne bloque pas, mais est signalée par snapshotId = null */ }
  pages.saveDraft(ctx, r.page_id, { ...page.working, sections }, { revision: page.revision });
  ctx.db.prepare("UPDATE mk_ci_link_props SET status = 'accepted', decided_by = ?, decided_at = ?, applied_section = ? WHERE id = ?").run(ctx.userId || null, now(ctx), done, id);
  return { id, status: "accepted", href, section: done, snapshotId, published: false, note: "Lien ajouté au brouillon. Publiez la page pour le mettre en ligne ; la version précédente est restaurable." };
}
module.exports = { analyze, propose, list, accept, refuse, GENERIC };
