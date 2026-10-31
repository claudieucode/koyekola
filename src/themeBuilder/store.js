// Stockage du Theme Builder (programme 23.1) : modèles PAR SITE. Le site vient toujours de l'appelant (adresse) et est revérifié ; chaque requête filtre organization_id ET site_id.
// Le contenu d'un modèle est un DOCUMENT existant (page ou composant) édité dans l'éditeur actuel : ce module ne le modifie que par les services publics (createPage, publish, duplicatePage…).
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const siteModules = require("../marketing/siteModules");
const Types = require("./types");
const Cond = require("./conditions");
const Res = require("./resolve");

const P = () => require("../marketing/pages");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
const MAX_PER_SITE = 200;

function site(ctx, siteId) {
  if (!Number.isInteger(siteId) || siteId < 1) throw bad("Site introuvable.", "not_found");
  if (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId) throw bad("Site introuvable.", "not_found");
  const s = P().getSite(ctx, siteId);
  if (!s || s.deleted_at) throw bad("Site introuvable.", "not_found");
  return s;
}
const shape = (r) => r && ({ id: r.id, siteId: r.site_id, type: r.type, typeLabel: (Types.TYPES[r.type] || { label: r.type }).label, group: (Types.TYPES[r.type] || {}).group || "custom", name: r.name, status: r.status,
  sourceKind: r.source_kind, sourceId: r.source_id, conditions: json(r.conditions, { include: [], exclude: [] }), revision: r.revision, legacyRef: r.legacy_ref, createdAt: r.created_at, updatedAt: r.updated_at, publishedAt: r.published_at, archivedAt: r.archived_at });
const row = (ctx, siteId, id) => ctx.db.prepare("SELECT * FROM mk_tb_templates WHERE id = ? AND site_id = ? AND organization_id = ?").get(Number(id), siteId, ctx.organizationId);
function get(ctx, siteId, id) { site(ctx, siteId); const r = row(ctx, siteId, id); if (!r) throw bad("Modèle introuvable.", "not_found"); return shape(r); }

// Marqueur de cache de résolution d'un site : change à toute écriture (chaque écriture incrémente `revision`, donc la somme change même dans la même seconde)
const stampOf = (ctx, siteId) => { const r = ctx.db.prepare("SELECT COUNT(*) n, COALESCE(SUM(revision), 0) u, COALESCE(MAX(id), 0) m FROM mk_tb_templates WHERE site_id = ? AND organization_id = ?").get(siteId, ctx.organizationId); return `${r.n}:${r.u}:${r.m}`; };
const touch = (ctx, siteId, id) => ctx.db.prepare("UPDATE mk_tb_templates SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ? AND site_id = ?").run(id, siteId);

function list(ctx, siteId, { type = "", status = "", q = "", archived = false } = {}) {
  site(ctx, siteId);
  const where = ["organization_id = ?", "site_id = ?"], args = [ctx.organizationId, siteId];
  if (type && Types.has(type)) { where.push("type = ?"); args.push(type); }
  if (["draft", "published", "archived"].includes(status)) { where.push("status = ?"); args.push(status); } else if (!archived) where.push("status != 'archived'");
  const rows = ctx.db.prepare(`SELECT * FROM mk_tb_templates WHERE ${where.join(" AND ")} ORDER BY updated_at DESC, id DESC`).all(...args).map(shape);
  const needle = line(q, 80).toLowerCase();
  return needle ? rows.filter((t) => `${t.name} ${t.typeLabel}`.toLowerCase().includes(needle)) : rows;
}
function assertType(ctx, siteId, type) {
  if (!Types.has(type)) throw bad("Type de modèle inconnu.");
  const m = Types.TYPES[type].module;
  if (m && !siteModules.isEnabled(ctx.db, ctx.organizationId, siteId, m)) throw bad(`Le module ${siteModules.MODULES[m].label} est désactivé pour ce site : ce type de modèle n'est pas disponible.`, "module_disabled");
}
const uniqueName = (ctx, siteId, name, exceptId = 0) => {
  const base = line(name, 100) || "Modèle"; let n = base, i = 2;
  while (ctx.db.prepare("SELECT 1 FROM mk_tb_templates WHERE site_id = ? AND organization_id = ? AND status != 'archived' AND name = ? COLLATE NOCASE AND id != ?").get(siteId, ctx.organizationId, n, exceptId)) n = `${base} (${i++})`;
  return n;
};
// Document de départ selon le type : les parties globales sont des COMPOSANTS (réutilisables), les autres des PAGES du site
const KIND_OF = (type) => (["header", "footer", "sidebar"].includes(type) ? "component" : "page");
const starter = (name) => ({ type: "layout", children: [{ type: "heading", id: "tb" + Math.random().toString(36).slice(2, 10), props: { text: name, level: "2" } }] });
function docName(ctx, siteId, kind, name) {
  const table = kind === "component" ? "mk_web_components" : "mk_landing_pages";
  let n = `Thème · ${name}`.slice(0, 80), i = 2; const base = n;
  while (ctx.db.prepare(`SELECT 1 FROM ${table} WHERE organization_id = ? AND name = ? COLLATE NOCASE`).get(ctx.organizationId, n)) n = `${base} (${i++})`.slice(0, 80);
  return n;
}
function create(ctx, siteId, { type, name, conditions = {}, sourceKind = null, sourceId = null, legacyRef = null, status = "draft" } = {}) {
  site(ctx, siteId); assertType(ctx, siteId, type);
  const n = line(name, 100); if (!n) throw bad("Le nom du modèle est obligatoire.");
  if (ctx.db.prepare("SELECT COUNT(*) c FROM mk_tb_templates WHERE site_id = ? AND organization_id = ?").get(siteId, ctx.organizationId).c >= MAX_PER_SITE) throw bad(`${MAX_PER_SITE} modèles au plus par site.`);
  let cond; try { cond = Cond.normalize(conditions, type); } catch (e) { throw bad(e.message); }
  return transaction(ctx.db, () => {
    let kind = sourceKind, sid = sourceId;
    if (kind && sid) { // document existant : il doit appartenir à CE site (jamais celui d'un autre)
      if (kind === "page") { const p = P().requirePage(ctx, Number(sid)); if (p.site_id !== siteId) throw bad("Ce document n'appartient pas à ce site."); }
      else { const c = P().getComponent(ctx, Number(sid)); if (!c || (c.site_id !== null && c.site_id !== siteId)) throw bad("Ce composant n'appartient pas à ce site."); }
    } else {
      kind = KIND_OF(type);
      if (kind === "component") sid = P().createComponent(ctx, { name: docName(ctx, siteId, kind, n), section: starter(n), siteId, kind: "standard" }).id;
      else sid = P().createPage(ctx, { name: docName(ctx, siteId, kind, n), siteId, kind: "page" }).id;
    }
    const id = Number(ctx.db.prepare("INSERT INTO mk_tb_templates (organization_id, site_id, type, name, status, source_kind, source_id, conditions, legacy_ref, created_by) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, siteId, type, uniqueName(ctx, siteId, n), kind, Number(sid), JSON.stringify(cond), legacyRef, ctx.userId ?? null).lastInsertRowid);
    if (status === "published") ctx.db.prepare("UPDATE mk_tb_templates SET status = 'published', published_at = datetime('now') WHERE id = ?").run(id);
    return shape(row(ctx, siteId, id));
  });
}
function rename(ctx, siteId, id, name) {
  const t = get(ctx, siteId, id); const n = line(name, 100); if (!n) throw bad("Le nom du modèle est obligatoire.");
  ctx.db.prepare("UPDATE mk_tb_templates SET name = ? WHERE id = ? AND site_id = ?").run(uniqueName(ctx, siteId, n, t.id), t.id, siteId); touch(ctx, siteId, t.id);
  return get(ctx, siteId, id);
}
// Conflits que provoquerait ce jeu de conditions pour ce modèle (sans rien écrire)
function conflictsFor(ctx, siteId, t, conditions) {
  const others = list(ctx, siteId).filter((o) => o.id !== t.id && o.type === t.type);
  return Res.conflicts([...others, { ...t, conditions, status: "published" }]).filter((c) => c.a === t.id || c.b === t.id);
}
function setConditions(ctx, siteId, id, conditions, { revision = null } = {}) {
  const t = get(ctx, siteId, id);
  if (t.status === "archived") throw bad("Ce modèle est archivé : restaurez-le avant de le modifier.");
  if (revision !== null && Number(revision) !== t.revision) throw bad("Ce modèle a été modifié ailleurs : rechargez avant d'enregistrer.", "conflict");
  let cond; try { cond = Cond.normalize(conditions, t.type); } catch (e) { throw bad(e.message); }
  const conflicts = t.status === "published" ? conflictsFor(ctx, siteId, t, cond) : [];
  if (conflicts.some((c) => c.severity === "blocking")) throw Object.assign(bad(conflicts.find((c) => c.severity === "blocking").message, "conflict"), { conflicts });
  ctx.db.prepare("UPDATE mk_tb_templates SET conditions = ? WHERE id = ? AND site_id = ?").run(JSON.stringify(cond), t.id, siteId); touch(ctx, siteId, t.id);
  return { template: get(ctx, siteId, id), conflicts };
}
function snapshotOf(ctx, t) {
  if (t.sourceKind === "component") { const c = P().getComponent(ctx, t.sourceId); return { kind: "component", name: c ? c.name : "", section: c ? c.section : null }; }
  const p = P().getPage(ctx, t.sourceId); return { kind: "page", name: p ? p.name : "", content: p ? p.working : null };
}
function publish(ctx, siteId, id, { revision = null } = {}) {
  const t = get(ctx, siteId, id);
  if (t.status === "archived") throw bad("Ce modèle est archivé : restaurez-le avant de le publier.");
  if (revision !== null && Number(revision) !== t.revision) throw bad("Ce modèle a été modifié ailleurs : rechargez avant de publier.", "conflict");
  const conflicts = conflictsFor(ctx, siteId, t, t.conditions);
  const blocking = conflicts.find((c) => c.severity === "blocking");
  if (blocking) throw Object.assign(bad(blocking.message, "conflict"), { conflicts });
  return transaction(ctx.db, () => {
    // le document est publié par le service existant (contrôles de publication de l'éditeur inchangés) ; une erreur annule tout
    try {
      if (t.sourceKind === "page") P().publish(ctx, t.sourceId);
      else { const c = P().getComponent(ctx, t.sourceId); if (c && c.hasDraft) P().publishComponent(ctx, t.sourceId); }
    } catch (e) { throw e instanceof MarketingError ? e : bad(e.message); }
    const n = (ctx.db.prepare("SELECT COALESCE(MAX(number), 0) m FROM mk_tb_versions WHERE template_id = ?").get(t.id).m) + 1;
    ctx.db.prepare("INSERT INTO mk_tb_versions (template_id, number, name, conditions, snapshot, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(t.id, n, t.name, JSON.stringify(t.conditions), JSON.stringify(snapshotOf(ctx, t)), ctx.userId ?? null);
    ctx.db.prepare("DELETE FROM mk_tb_versions WHERE template_id = ? AND number <= ?").run(t.id, n - 30);
    ctx.db.prepare("UPDATE mk_tb_templates SET status = 'published', published_at = datetime('now') WHERE id = ? AND site_id = ?").run(t.id, siteId); touch(ctx, siteId, t.id);
    return { template: get(ctx, siteId, id), version: n, conflicts };
  });
}
function unpublish(ctx, siteId, id) {
  const t = get(ctx, siteId, id); if (t.status !== "published") throw bad("Ce modèle n'est pas publié.", "conflict");
  ctx.db.prepare("UPDATE mk_tb_templates SET status = 'draft' WHERE id = ? AND site_id = ?").run(t.id, siteId); touch(ctx, siteId, t.id); return get(ctx, siteId, id);
}
function archive(ctx, siteId, id) {
  const t = get(ctx, siteId, id); if (t.status === "archived") throw bad("Ce modèle est déjà archivé.", "conflict");
  ctx.db.prepare("UPDATE mk_tb_templates SET status = 'archived', archived_at = datetime('now') WHERE id = ? AND site_id = ?").run(t.id, siteId); touch(ctx, siteId, t.id); return get(ctx, siteId, id);
}
function restore(ctx, siteId, id) {
  const t = get(ctx, siteId, id); if (t.status !== "archived") throw bad("Ce modèle n'est pas archivé.", "conflict");
  ctx.db.prepare("UPDATE mk_tb_templates SET status = 'draft', archived_at = NULL, name = ? WHERE id = ? AND site_id = ?").run(uniqueName(ctx, siteId, t.name, t.id), t.id, siteId); touch(ctx, siteId, t.id); return get(ctx, siteId, id);
}
// Suppression : seulement un modèle ARCHIVÉ. Le document (page ou composant) n'est jamais effacé : il reste dans Pages / Composants.
function remove(ctx, siteId, id) {
  const t = get(ctx, siteId, id); if (t.status !== "archived") throw bad("Archivez le modèle avant de le supprimer.", "conflict");
  ctx.db.prepare("DELETE FROM mk_tb_templates WHERE id = ? AND site_id = ?").run(t.id, siteId); return { removed: t.id, documentKept: { kind: t.sourceKind, id: t.sourceId } };
}
function duplicate(ctx, siteId, id) {
  const t = get(ctx, siteId, id);
  return transaction(ctx.db, () => {
    let sid;
    if (t.sourceKind === "page") sid = P().duplicatePage(ctx, t.sourceId, { siteId }).id;
    else { const c = P().getComponent(ctx, t.sourceId); if (!c) throw bad("Le document de ce modèle n'existe plus.", "not_found"); sid = P().createComponent(ctx, { name: docName(ctx, siteId, "component", `${t.name} (copie)`), section: c.section, siteId, kind: "standard" }).id; }
    return create(ctx, siteId, { type: t.type, name: `${t.name} (copie)`, conditions: t.conditions, sourceKind: t.sourceKind, sourceId: sid });
  });
}
function versions(ctx, siteId, id) {
  const t = get(ctx, siteId, id);
  return ctx.db.prepare("SELECT number, name, conditions, created_at FROM mk_tb_versions WHERE template_id = ? ORDER BY number DESC").all(t.id).map((v) => ({ number: v.number, name: v.name, conditions: json(v.conditions, {}), createdAt: v.created_at }));
}
// Restauration d'une version : JAMAIS de mise hors ligne. Le contenu du document revient en copie de travail (brouillon) — la page publique ne change qu'à la prochaine publication ;
// le nom revient ; les CONDITIONS ne reviennent que si le modèle n'est pas publié (elles prendraient effet immédiatement sur le site en ligne).
function restoreVersion(ctx, siteId, id, number) {
  const t = get(ctx, siteId, id); const v = ctx.db.prepare("SELECT * FROM mk_tb_versions WHERE template_id = ? AND number = ?").get(t.id, Number(number));
  if (!v) throw bad("Version introuvable.", "not_found");
  const snap = json(v.snapshot, {}); const cond = Cond.normalize(json(v.conditions, {}), t.type);
  const conditionsRestored = t.status !== "published";
  return transaction(ctx.db, () => {
    if (snap.kind === "component" && snap.section) P().saveComponentDraft(ctx, t.sourceId, snap.section);
    else if (snap.kind === "page" && snap.content) P().saveDraft(ctx, t.sourceId, snap.content, { revision: P().requirePage(ctx, t.sourceId).revision });
    ctx.db.prepare("UPDATE mk_tb_templates SET conditions = CASE WHEN ? THEN ? ELSE conditions END, name = ? WHERE id = ? AND site_id = ?").run(conditionsRestored ? 1 : 0, JSON.stringify(cond), uniqueName(ctx, siteId, v.name, t.id), t.id, siteId); touch(ctx, siteId, t.id);
    return { ...get(ctx, siteId, id), conditionsRestored };
  });
}
module.exports = { docName, list, get, create, rename, setConditions, publish, unpublish, archive, restore, remove, duplicate, versions, restoreVersion, conflictsFor, stampOf, site, MAX_PER_SITE };
