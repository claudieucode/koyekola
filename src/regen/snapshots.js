// Version Snapshot Manager : états cohérents à cinq niveaux (widget, section, page, design, site). Données compressées (gzip) et DÉDUPLIQUÉES par empreinte : un état identique au dernier snapshot de la même référence
// n'est pas re-stocké. Un snapshot ne contient JAMAIS de fichier : seulement des références de médias (chemins de la médiathèque). Un snapshot de site est une liste de références vers des snapshots de pages + du design.
const store = require("./store");
const designPort = require("./designPort");
const { bad, fp, pack, unpack, clone, findNode } = require("./util");
const pagesLib = () => require("../marketing/pages");
const MAX_BYTES = 3_000_000;

function insert(ctx, siteId, { level, ref, pageId = null, label = "", data }) {
  store.ensureSchema(ctx.db);
  const f = fp(data);
  const last = ctx.db.prepare("SELECT id, fp FROM mk_regen_snapshots WHERE site_id = ? AND level = ? AND ref = ? ORDER BY id DESC LIMIT 1").get(siteId, level, String(ref));
  if (last && last.fp === f) return { id: last.id, fp: f, reused: true };
  const packed = pack(data);
  if (packed.length > MAX_BYTES) throw bad("État trop volumineux pour un snapshot.", "too_large");
  const id = Number(ctx.db.prepare("INSERT INTO mk_regen_snapshots (organization_id, site_id, level, ref, page_id, label, fp, bytes, data, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(ctx.organizationId, siteId, level, String(ref), pageId, String(label).slice(0, 120), f, packed.length, packed, ctx.userId ?? null).lastInsertRowid);
  return { id, fp: f, reused: false };
}
function pageOf(ctx, siteId, pageId) {
  const p = Number.isInteger(Number(pageId)) ? pagesLib().requirePage(ctx, Number(pageId)) : null;
  if (!p || p.site_id !== siteId || p.archived_at) throw bad("Page introuvable pour ce site.", "not_found");
  return p;
}
const pageData = (p) => ({ pageId: p.id, name: p.name, revision: p.revision, content: clone(p.working) });
function takePage(ctx, siteId, pageId, { label = "" } = {}) { const p = pageOf(ctx, siteId, pageId); return insert(ctx, siteId, { level: "page", ref: String(p.id), pageId: p.id, label: label || `Page « ${p.name} »`, data: pageData(p) }); }
function takeSection(ctx, siteId, pageId, sectionId, { label = "" } = {}) {
  const p = pageOf(ctx, siteId, pageId), secs = (p.working || {}).sections || [], i = secs.findIndex((s) => s.id === sectionId);
  if (i < 0) throw bad("Section introuvable dans cette page.", "not_found");
  return insert(ctx, siteId, { level: "section", ref: `${p.id}:${sectionId}`, pageId: p.id, label: label || `Section de « ${p.name} »`, data: { pageId: p.id, sectionId, index: i, section: clone(secs[i]) } });
}
function takeNode(ctx, siteId, pageId, nodeId, { label = "" } = {}) {
  const p = pageOf(ctx, siteId, pageId), f = findNode((p.working || {}).sections || [], nodeId);
  if (!f) throw bad("Élément introuvable dans cette page.", "not_found");
  const sibs = f.parent ? f.parent.children : f.section.children;
  return insert(ctx, siteId, { level: "node", ref: `${p.id}:${nodeId}`, pageId: p.id, label: label || `Élément de « ${p.name} »`, data: { pageId: p.id, sectionId: f.section.id, nodeId, parentId: f.parent ? f.parent.id : null, index: sibs.findIndex((n) => n === f.node), node: clone(f.node) } });
}
function takeDesign(ctx, siteId, { can = () => true, label = "Design du site" } = {}) { const st = designPort.port().state(ctx, siteId, can); return insert(ctx, siteId, { level: "design", ref: "design", label, data: { changes: clone(st.changes), rev: st.rev } }); }
function takeSite(ctx, siteId, { pageIds = null, label = "Site entier", can = () => true, withDesign = true } = {}) {
  const ids = pageIds || pagesLib().sitePages(ctx, siteId).map((p) => p.id);
  const pages = ids.slice(0, 60).map((id) => ({ pageId: id, snapId: takePage(ctx, siteId, id).id }));
  let design = null; if (withDesign) { try { design = takeDesign(ctx, siteId, { can }).id; } catch { design = null; } }
  return insert(ctx, siteId, { level: "site", ref: "site", label, data: { pages, design } });
}
function row(ctx, siteId, snapId) {
  store.ensureSchema(ctx.db);
  const r = ctx.db.prepare("SELECT * FROM mk_regen_snapshots WHERE id = ? AND organization_id = ? AND site_id = ?").get(Number(snapId), ctx.organizationId, siteId);
  if (!r) throw bad("Version introuvable.", "not_found");
  return r;
}
const meta = (r) => ({ id: r.id, level: r.level, ref: r.ref, pageId: r.page_id, label: r.label, fp: r.fp, bytes: r.bytes, createdBy: r.created_by, createdAt: r.created_at });
function get(ctx, siteId, snapId) { const r = row(ctx, siteId, snapId); return { ...meta(r), data: unpack(r.data) }; }
function list(ctx, siteId, { level = "", ref = "", pageId = null, limit = 25, offset = 0 } = {}) {
  store.ensureSchema(ctx.db);
  const where = ["organization_id = ?", "site_id = ?"], args = [ctx.organizationId, siteId];
  if (level) { where.push("level = ?"); args.push(level); } if (ref) { where.push("ref = ?"); args.push(String(ref)); } if (pageId) { where.push("page_id = ?"); args.push(Number(pageId)); }
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_regen_snapshots WHERE ${where.join(" AND ")}`).get(...args).n;
  const items = ctx.db.prepare(`SELECT id, level, ref, page_id, label, fp, bytes, created_by, created_at FROM mk_regen_snapshots WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, Math.min(Math.max(Number(limit) || 25, 1), 100), Math.max(Number(offset) || 0, 0)).map(meta);
  return { total, items };
}
const stats = (ctx, siteId) => { store.ensureSchema(ctx.db); const r = ctx.db.prepare("SELECT COUNT(*) n, COALESCE(SUM(bytes), 0) bytes FROM mk_regen_snapshots WHERE organization_id = ? AND site_id = ?").get(ctx.organizationId, siteId); return { snapshots: r.n, bytes: r.bytes }; };
// Politique de conservation : AUCUNE suppression automatique. `prune` n'efface que sur demande explicite, jamais un snapshot rattaché à une opération ni le plus récent d'une référence ; simulation par défaut.
function prune(ctx, siteId, { olderThanDays = 180, keepLastPerRef = 10, dryRun = true } = {}) {
  store.ensureSchema(ctx.db);
  const days = Math.max(Number(olderThanDays) || 180, 30), keep = Math.max(Number(keepLastPerRef) || 10, 3);
  // références portées par les snapshots de site (pages, design) : jamais supprimées tant que le snapshot de site existe
  const held = new Set();
  for (const r of ctx.db.prepare("SELECT data FROM mk_regen_snapshots WHERE organization_id = ? AND site_id = ? AND level = 'site'").all(ctx.organizationId, siteId)) { try { const d = unpack(r.data); (d.pages || []).forEach((p) => held.add(p.snapId)); if (d.design) held.add(d.design); } catch { /* snapshot illisible : conservé */ } }
  const cands = ctx.db.prepare(`SELECT s.id, s.bytes FROM mk_regen_snapshots s WHERE s.organization_id = ? AND s.site_id = ? AND s.created_at < datetime('now', ?) AND NOT EXISTS (SELECT 1 FROM mk_regen_op_snaps o WHERE o.snap_id = s.id)
    AND s.id NOT IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY level, ref ORDER BY id DESC) rn FROM mk_regen_snapshots WHERE site_id = ?) WHERE rn <= ?)`).all(ctx.organizationId, siteId, `-${days} days`, siteId, keep).filter((c) => !held.has(c.id));
  if (!dryRun && cands.length) { const del = ctx.db.prepare("DELETE FROM mk_regen_snapshots WHERE id = ?"); for (const c of cands) del.run(c.id); }
  return { candidates: cands.length, bytes: cands.reduce((n, c) => n + c.bytes, 0), deleted: dryRun ? 0 : cands.length, dryRun };
}
const unpackData = unpack;
module.exports = { unpackData, takePage, takeSection, takeNode, takeDesign, takeSite, get, list, stats, prune, row, pageOf, insert };
