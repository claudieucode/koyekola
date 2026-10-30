// Intelligent Regeneration & History (programme 21.9) — point d'entrée. Voir docs/KOLAKISA_AI_INTELLIGENT_REGENERATION.md.
const store = require("./store");
const ctxLib = require("./context");
const snaps = require("./snapshots");
const history = require("./history");
const compareLib = require("./compare");
const restoreLib = require("./restore");
const protect = require("./protect");
const engine = require("./engine");
const analyzer = require("./analyzer");
const { bad } = require("./util");

const guard = (ctx, siteId) => { ctxLib.siteGuard(ctx, siteId); store.ensureSchema(ctx.db); };
// Comparaison de deux versions (même niveau) : snapshots du même site uniquement
function compare(ctx, siteId, aId, bId) {
  guard(ctx, siteId);
  const a = snaps.get(ctx, siteId, aId), b = snaps.get(ctx, siteId, bId);
  const res = (id) => snaps.get(ctx, siteId, id);
  return compareLib.compare(a, b, { resolve: res });
}
// Comparer une version à l'état ACTUEL (page, section, design)
function compareWithCurrent(ctx, siteId, snapId, { can = () => true } = {}) {
  guard(ctx, siteId);
  const s = snaps.get(ctx, siteId, snapId);
  let cur;
  if (s.level === "page") { const p = snaps.pageOf(ctx, siteId, s.data.pageId); cur = { ...s, id: 0, label: "État actuel", createdAt: null, data: restoreLib.currentPageData(p) }; }
  else if (s.level === "section") { const p = snaps.pageOf(ctx, siteId, s.data.pageId); const sec = ((p.working || {}).sections || []).find((x) => x.id === s.data.sectionId); if (!sec) throw bad("Cette section n'existe plus dans la page.", "not_found"); cur = { ...s, id: 0, label: "État actuel", createdAt: null, data: { ...s.data, section: sec } }; }
  else if (s.level === "design") { const st = require("./designPort").port().state(ctx, siteId, can); cur = { ...s, id: 0, label: "État actuel", createdAt: null, data: { changes: st.changes, rev: st.rev } }; }
  else throw bad("Comparaison avec l'état actuel non prise en charge pour ce niveau.");
  cur.fp = require("./util").fp(cur.data);
  return compareLib.compare(s, cur, { resolve: null });
}
function takeSnapshot(ctx, siteId, { level, pageId = null, sectionId = null, nodeId = null, label = "", can = () => true } = {}) {
  guard(ctx, siteId);
  if (level === "page") return snaps.takePage(ctx, siteId, pageId, { label });
  if (level === "section") return snaps.takeSection(ctx, siteId, pageId, sectionId, { label });
  if (level === "node") return snaps.takeNode(ctx, siteId, pageId, nodeId, { label });
  if (level === "design") return snaps.takeDesign(ctx, siteId, { can, label: label || "Design du site" });
  if (level === "site") return snaps.takeSite(ctx, siteId, { label: label || "Site entier", can });
  throw bad("Niveau inconnu.");
}
// États de protection de tous les éléments d'une page (pour l'interface)
function protections(ctx, siteId, pageId = null) {
  guard(ctx, siteId);
  const out = { explicit: protect.list(ctx, siteId), elements: [] };
  if (pageId) { const p = snaps.pageOf(ctx, siteId, pageId); out.page = { id: p.id, state: protect.stateOf(ctx, siteId, "page", p.id, p.working) }; const fieldsLib = require("../contentGen/fields"); out.elements = (((p.working || {}).sections) || []).map((s) => ({ kind: "section", ref: s.id, type: s.type, label: ctxLib.label(s), state: protect.stateOf(ctx, siteId, "section", s.id, s), fields: fieldsLib.describe(s).map((d) => ({ kind: "field", ref: d.key, label: d.label, state: protect.stateOf(ctx, siteId, "field", d.key, d.current) })) })); }
  return out;
}
const wrap = (fn) => (ctx, siteId, ...a) => { guard(ctx, siteId); return fn(ctx, siteId, ...a); };
module.exports = {
  analyze: analyzer.analyze, propose: engine.propose, apply: engine.apply, reject: wrap(engine.reject), undo: engine.undo, redo: engine.redo,
  restore: wrap(restoreLib.restore), takeSnapshot, getSnapshot: wrap(snaps.get), listSnapshots: wrap(snaps.list), snapshotStats: wrap(snaps.stats), pruneSnapshots: wrap(snaps.prune),
  compare, compareWithCurrent, history: wrap(history.list), getOperation: wrap(history.get), usage: wrap(history.usage),
  setProtection: wrap(protect.setProtection), protections, store, protect, snapshots: snaps, histories: history, compareLib, restoreLib, ctxLib, engine, analyzer,
};
