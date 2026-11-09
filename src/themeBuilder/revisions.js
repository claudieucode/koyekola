// Historique des révisions du PIED DE PAGE (chantier E). Périmètre : composants qui sont le document d'un modèle de type « footer » (les autres types ne changent pas).
// Une révision = une copie du contenu de travail à un instant (enregistrement du brouillon, publication, sécurité avant un retour ou une restauration).
// Règles : jamais le document entier dans une liste · doublons identiques ignorés · enregistrements rapprochés du même auteur fusionnés · plafond MAX par pied (les plus anciennes
// partent, la DERNIÈRE PUBLIÉE reste toujours) · restaurer = nouveau brouillon, la version en ligne ne bouge JAMAIS sans publication explicite.
const crypto = require("crypto");
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const store = require("./store");

const P = () => require("../marketing/pages");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const MAX = 50; // révisions gardées par pied
const MERGE_SECONDS = 60; // deux enregistrements du même auteur à moins de 60 s : une seule révision (enregistrement automatique)
const PAGE_MAX = 50;
const KINDS = ["draft", "publish", "safety", "restore"];
const KIND_LABEL = { draft: "Brouillon", publish: "Publication", safety: "Sauvegarde de sécurité", restore: "Restauration" };
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };

const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));
const hashOf = (section) => crypto.createHash("sha256").update(canon(section)).digest("hex").slice(0, 32);

// Éléments à plat : clé = identifiant de l'élément (ou chemin s'il n'en a pas) ; empreinte = tout sauf les enfants
function flat(section) {
  const out = new Map();
  const walk = (nodes, path) => (Array.isArray(nodes) ? nodes : []).forEach((n, i) => {
    if (!n || typeof n !== "object") return;
    const key = n.id ? `#${n.id}` : `${path}/${i}`;
    const { children, ...own } = n;
    out.set(key, { type: String(n.type || "?"), sig: canon(own) });
    walk(children, `${path}/${i}`);
  });
  walk(section && section.children, "");
  return out;
}
const countWidgets = (section) => flat(section).size;
function diff(a, b) {
  const A = flat(a), B = flat(b); const added = [], removed = [], modified = [];
  for (const [k, v] of B) { if (!A.has(k)) added.push(v.type); else if (A.get(k).sig !== v.sig) modified.push(v.type); }
  for (const [k, v] of A) if (!B.has(k)) removed.push(v.type);
  return { added: added.length, removed: removed.length, modified: modified.length, details: { added: added.slice(0, 40), removed: removed.slice(0, 40), modified: modified.slice(0, 40) } };
}
const phrase = (d, first) => {
  if (first) return "Première version enregistrée";
  const p = [];
  if (d.added) p.push(`${d.added} ajouté${d.added > 1 ? "s" : ""}`);
  if (d.removed) p.push(`${d.removed} retiré${d.removed > 1 ? "s" : ""}`);
  if (d.modified) p.push(`${d.modified} modifié${d.modified > 1 ? "s" : ""}`);
  return p.length ? `Éléments : ${p.join(", ")}` : "Aucun changement d'éléments";
};

// Modèle « pied » qui porte ce composant (ou null) : seul ce cas déclenche l'historique
function footerOf(ctx, componentId) {
  return ctx.db.prepare("SELECT id, site_id, status FROM mk_tb_templates WHERE organization_id = ? AND source_kind = 'component' AND source_id = ? AND type = 'footer' ORDER BY (status = 'archived'), id LIMIT 1").get(ctx.organizationId, Number(componentId)) || null;
}
let suppressed = 0; // > 0 : les restaurations enregistrent elles-mêmes leur révision
const last = (ctx, componentId) => ctx.db.prepare("SELECT * FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ? ORDER BY id DESC LIMIT 1").get(Number(componentId), ctx.organizationId);

// Enregistre une révision. Retourne l'identifiant, ou null si ignorée (doublon, pas un pied, ou section vide).
function record(ctx, componentId, kind, section, { note = "" } = {}) {
  if (!KINDS.includes(kind) || !section || typeof section !== "object") return null;
  const t = footerOf(ctx, componentId); if (!t) return null;
  const hash = hashOf(section), prev = last(ctx, componentId);
  if (prev && prev.hash === hash && (kind !== "publish" || prev.kind === "publish")) return null; // identique à la précédente : rien de nouveau (une publication du même contenu que le brouillon reste notée)
  const prevSection = prev ? json(prev.section, null) : null;
  const d = diff(prevSection, section);
  const summary = (note ? `${note} — ` : "") + phrase(d, !prev);
  const by = ctx.userId ?? null;
  // Enregistrements automatiques rapprochés : on remplace le contenu de la dernière révision « brouillon » du même auteur
  if (kind === "draft" && prev && prev.kind === "draft" && prev.created_by === by && ctx.db.prepare("SELECT (strftime('%s','now') - strftime('%s', ?)) <= ? ok").get(prev.created_at, MERGE_SECONDS).ok) {
    const before = ctx.db.prepare("SELECT section FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ? AND id < ? ORDER BY id DESC LIMIT 1").get(Number(componentId), ctx.organizationId, prev.id);
    const dd = diff(before ? json(before.section, null) : null, section);
    ctx.db.prepare("UPDATE mk_tb_revisions SET section = ?, hash = ?, widgets = ?, summary = ? WHERE id = ?").run(JSON.stringify(section), hash, countWidgets(section), phrase(dd, !before), prev.id);
    return prev.id;
  }
  const id = Number(ctx.db.prepare("INSERT INTO mk_tb_revisions (organization_id, site_id, template_id, component_id, kind, hash, section, widgets, summary, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, t.site_id, t.id, Number(componentId), kind, hash, JSON.stringify(section), countWidgets(section), summary.slice(0, 300), by).lastInsertRowid);
  prune(ctx, componentId);
  return id;
}
// Plafond : on retire les plus anciennes, jamais la dernière publication ni la révision qui vient d'être créée
function prune(ctx, componentId) {
  const keepPub = ctx.db.prepare("SELECT id FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ? AND kind = 'publish' ORDER BY id DESC LIMIT 1").get(Number(componentId), ctx.organizationId);
  const n = ctx.db.prepare("SELECT COUNT(*) c FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ?").get(Number(componentId), ctx.organizationId).c;
  if (n <= MAX) return 0;
  return Number(ctx.db.prepare("DELETE FROM mk_tb_revisions WHERE id IN (SELECT id FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ? AND id != ? ORDER BY id ASC LIMIT ?)")
    .run(Number(componentId), ctx.organizationId, keepPub ? keepPub.id : 0, n - MAX).changes);
}
// Appelés par les services de composants (pages/index.js) : une erreur d'historique ne doit JAMAIS empêcher d'enregistrer ou de publier
const onDraftSaved = (ctx, componentId, section) => { if (suppressed) return; try { record(ctx, componentId, "draft", section); } catch { /* historique indisponible */ } };
const onPublished = (ctx, componentId, section) => { try { record(ctx, componentId, "publish", section); } catch { /* historique indisponible */ } };

// ── Lecture (jamais de document dans une liste) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function footerTemplate(ctx, siteId, id) {
  const t = store.get(ctx, siteId, id); // vérifie site, organisation et accès limité à un site
  if (t.type !== "footer" || t.sourceKind !== "component") throw bad("Les révisions concernent seulement les pieds de page.");
  return t;
}
const authorName = (ctx, id) => { if (!id) return null; try { const r = ctx.db.prepare("SELECT username FROM users WHERE id = ?").get(id); return r ? r.username : null; } catch { return null; } };
const shape = (ctx, r) => ({ id: r.id, kind: r.kind, kindLabel: KIND_LABEL[r.kind] || r.kind, createdAt: r.created_at, by: authorName(ctx, r.created_by), widgets: r.widgets, summary: r.summary, isCurrentDraftContent: false });
function list(ctx, siteId, id, { limit = 20, before = 0 } = {}) {
  const t = footerTemplate(ctx, siteId, id);
  const lim = Math.min(PAGE_MAX, Math.max(1, Number(limit) || 20)), b = Number(before) > 0 ? Number(before) : Number.MAX_SAFE_INTEGER;
  const rows = ctx.db.prepare("SELECT id, kind, created_at, created_by, widgets, summary, hash FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ? AND id < ? ORDER BY id DESC LIMIT ?").all(t.sourceId, ctx.organizationId, b, lim + 1);
  const page = rows.slice(0, lim);
  const c = P().getComponent(ctx, t.sourceId), curHash = c ? hashOf(c.draft || c.section) : "";
  return { revisions: page.map((r) => ({ ...shape(ctx, r), isCurrentDraftContent: r.hash === curHash })), next: rows.length > lim ? page[page.length - 1].id : null, max: MAX, total: ctx.db.prepare("SELECT COUNT(*) c FROM mk_tb_revisions WHERE component_id = ? AND organization_id = ?").get(t.sourceId, ctx.organizationId).c };
}
function fetchRevision(ctx, t, rid) {
  const r = ctx.db.prepare("SELECT * FROM mk_tb_revisions WHERE id = ? AND component_id = ? AND organization_id = ?").get(Number(rid), t.sourceId, ctx.organizationId);
  if (!r) throw bad("Révision introuvable.", "not_found");
  return r;
}
// Aperçu : structure filaire + éléments par type (rien d'inventé, calculé depuis la révision)
function preview(ctx, siteId, id, rid) {
  const t = footerTemplate(ctx, siteId, id), r = fetchRevision(ctx, t, rid), section = json(r.section, null);
  const types = {}; for (const v of flat(section).values()) types[v.type] = (types[v.type] || 0) + 1;
  let svg = ""; try { svg = require("./thumb").thumbnail(section).svg; } catch { /* aperçu filaire indisponible */ }
  return { revision: shape(ctx, r), widgets: r.widgets, types, thumb: svg };
}
// Compare deux révisions (identifiants) ; « draft » = copie de travail actuelle, « live » = version en ligne
function sectionFor(ctx, t, ref) {
  if (ref === "draft" || ref === "live") { const c = P().getComponent(ctx, t.sourceId); if (!c) throw bad("Le document de ce pied n'existe plus.", "not_found"); return ref === "draft" ? (c.draft || c.section) : c.section; }
  return json(fetchRevision(ctx, t, ref).section, null);
}
function compare(ctx, siteId, id, a, b) {
  const t = footerTemplate(ctx, siteId, id);
  const d = diff(sectionFor(ctx, t, a), sectionFor(ctx, t, b));
  return { from: String(a), to: String(b), ...d, identical: !d.added && !d.removed && !d.modified };
}

// ── Écriture : toujours en brouillon ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function setDraft(ctx, t, section, kind, note) {
  const c = P().getComponent(ctx, t.sourceId); if (!c) throw bad("Le document de ce pied n'existe plus.", "not_found");
  if (t.status === "archived") throw bad("Ce modèle est archivé : restaurez-le avant de le modifier.", "conflict");
  return transaction(ctx.db, () => {
    record(ctx, t.sourceId, "safety", c.draft || c.section, { note: "Avant " + note }); // révision de sécurité automatique (ignorée si identique à la dernière)
    suppressed += 1;
    try { P().saveComponentDraft(ctx, t.sourceId, section); } finally { suppressed -= 1; }
    const rid = record(ctx, t.sourceId, kind, section, { note });
    return rid;
  });
}
function restore(ctx, siteId, id, rid) {
  const t = footerTemplate(ctx, siteId, id), r = fetchRevision(ctx, t, rid), section = json(r.section, null);
  if (!section) throw bad("Cette révision est illisible.");
  const newId = setDraft(ctx, t, section, "restore", `Restauration de la révision du ${r.created_at}`);
  return { template: store.get(ctx, siteId, id), revisionId: newId, published: false };
}
// « Revenir au modèle d'origine » : recrée le brouillon depuis le catalogue (révision de sécurité avant). Le public ne change pas avant « Publier ».
function originOf(ctx, t) {
  const r = ctx.db.prepare("SELECT origin_key, origin_version FROM mk_tb_templates WHERE id = ? AND organization_id = ?").get(t.id, ctx.organizationId);
  if (!r || !r.origin_key) return null;
  // L'identifiant d'origine peut être un ANCIEN identifiant : find() suit les alias jusqu'au modèle qui le remplace. version = version de composition du modèle d'origine à l'installation (null = inconnue) ;
  // currentVersion = version actuelle du modèle dans la bibliothèque (celle que « Revenir au modèle d'origine » restaurerait).
  const Catalog = require("./catalog"), m = Catalog.find("footer", r.origin_key);
  return m ? { key: m.key, name: m.name, version: Number.isInteger(r.origin_version) ? r.origin_version : null, currentVersion: Number.isInteger(m.version) ? m.version : 1, ...(m.key !== r.origin_key ? { renamedFrom: r.origin_key } : {}) } : null;
}
function revertToOrigin(ctx, siteId, id) {
  const t = footerTemplate(ctx, siteId, id);
  const o = originOf(ctx, t); if (!o) throw bad("Ce pied n'a pas été installé depuis la bibliothèque (ou son modèle d'origine n'existe plus) : retour impossible.");
  const Catalog = require("./catalog"), { siteFormId } = require("./catalog/use");
  const fresh = Catalog.build("footer", o.key, { formId: siteFormId(ctx, siteId) });
  if (!fresh || fresh.kind !== "component") throw bad("Le modèle d'origine est introuvable.", "not_found");
  const rid = setDraft(ctx, t, JSON.parse(JSON.stringify(fresh.section)), "restore", `Retour au modèle d'origine « ${o.name} » (version ${o.currentVersion})`);
  // Le pied a retrouvé la composition ACTUELLE du modèle : on met à jour l'identifiant (ancien alias → identifiant actuel) et la version d'origine mémorisés
  ctx.db.prepare("UPDATE mk_tb_templates SET origin_key = ?, origin_version = ? WHERE id = ? AND organization_id = ?").run(o.key, o.currentVersion, t.id, ctx.organizationId);
  return { template: store.get(ctx, siteId, id), revisionId: rid, original: { ...o, version: o.currentVersion, installedVersion: o.version }, published: false };
}
function origin(ctx, siteId, id) { return originOf(ctx, footerTemplate(ctx, siteId, id)); }

module.exports = { record, onDraftSaved, onPublished, list, preview, compare, restore, revertToOrigin, origin, originOfTemplate: originOf, diff, hashOf, MAX, MERGE_SECONDS };
