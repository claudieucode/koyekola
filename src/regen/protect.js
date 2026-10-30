// Preservation Engine : protections posées par la personne et état de chaque élément, appliqués CÔTÉ SERVEUR (une demande IA qui vise un élément protégé est refusée même si l'interface l'avait proposée).
// États : locked (verrouillé : aucune régénération) · validated (validé : régénération seulement avec confirmation explicite) · user_modified (modifié depuis la dernière écriture IA) ·
// ai (généré par l'IA, inchangé) · pending (proposition en attente) · user (aucun marquage).
const store = require("./store");
const { bad, fp } = require("./util");
const KINDS = ["page", "section", "node", "field", "design", "component", "media"];

function setProtection(ctx, siteId, { kind, ref, state, reason = "" }) {
  store.ensureSchema(ctx.db);
  if (!KINDS.includes(kind)) throw bad("Type d'élément inconnu.");
  if (!["locked", "validated", "none"].includes(state)) throw bad("État de protection inconnu.");
  const r = String(ref || "").slice(0, 120); if (!r) throw bad("Élément manquant.");
  if (state === "none") { ctx.db.prepare("DELETE FROM mk_regen_protections WHERE site_id = ? AND organization_id = ? AND kind = ? AND ref = ?").run(siteId, ctx.organizationId, kind, r); return { kind, ref: r, state: "none" }; }
  ctx.db.prepare("INSERT INTO mk_regen_protections (organization_id, site_id, kind, ref, state, reason, user_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (site_id, kind, ref) DO UPDATE SET state = excluded.state, reason = excluded.reason, user_id = excluded.user_id, created_at = datetime('now')")
    .run(ctx.organizationId, siteId, kind, r, state, String(reason).slice(0, 200), ctx.userId ?? null);
  return { kind, ref: r, state };
}
function list(ctx, siteId) { store.ensureSchema(ctx.db); return ctx.db.prepare("SELECT kind, ref, state, reason, user_id AS userId, created_at AS at FROM mk_regen_protections WHERE organization_id = ? AND site_id = ? ORDER BY id DESC LIMIT 500").all(ctx.organizationId, siteId).map((r) => ({ ...r })); }
function protectionOf(ctx, siteId, kind, ref) { store.ensureSchema(ctx.db); const r = ctx.db.prepare("SELECT state FROM mk_regen_protections WHERE organization_id = ? AND site_id = ? AND kind = ? AND ref = ?").get(ctx.organizationId, siteId, kind, String(ref)); return r ? r.state : null; }
// Verrou posé sur l'élément OU sur un parent (page, section) : utilisé aussi par les autres moteurs (ex. Content Generator) sans dépendance circulaire
function isLocked(ctx, siteId, chain) { return chain.some(([kind, ref]) => ref !== undefined && ref !== null && protectionOf(ctx, siteId, kind, ref) === "locked"); }
function mark(ctx, siteId, kind, ref, value, opId = null) { store.ensureSchema(ctx.db); ctx.db.prepare("INSERT INTO mk_regen_marks (site_id, kind, ref, fp, op_id) VALUES (?, ?, ?, ?, ?) ON CONFLICT (site_id, kind, ref) DO UPDATE SET fp = excluded.fp, op_id = excluded.op_id, at = datetime('now')").run(siteId, kind, String(ref), fp(value), opId); }
function stateOf(ctx, siteId, kind, ref, currentValue) {
  const p = protectionOf(ctx, siteId, kind, ref);
  if (p === "locked") return "locked";
  const m = ctx.db.prepare("SELECT fp FROM mk_regen_marks WHERE site_id = ? AND kind = ? AND ref = ?").get(siteId, kind, String(ref));
  const pending = ctx.db.prepare("SELECT 1 FROM mk_regen_ops WHERE site_id = ? AND status = 'proposed' AND target LIKE ? LIMIT 1").get(siteId, `%"${String(ref).replace(/[%_"\\]/g, "")}"%`);
  if (p === "validated") return "validated";
  if (m) return fp(currentValue) === m.fp ? (pending ? "pending" : "ai") : "user_modified";
  return pending ? "pending" : "user";
}
// Contrôle d'une liste d'éléments avant écriture IA : verrouillé → refus ; validé / modifié par la personne → refus sauf autorisation explicite (`allow` = liste de références)
function assertWritable(ctx, siteId, items, { allow = [] } = {}) {
  const blocked = [];
  for (const it of items) {
    const st = stateOf(ctx, siteId, it.kind, it.ref, it.value);
    if (st === "locked") blocked.push({ ...it, state: st, why: "élément verrouillé" });
    else if ((st === "validated" || st === "user_modified") && !allow.includes(String(it.ref))) blocked.push({ ...it, state: st, why: st === "validated" ? "élément validé par la personne : confirmation explicite requise" : "modifié par la personne depuis la dernière génération : confirmation explicite requise" });
  }
  if (blocked.length) { const hardLock = blocked.some((b) => b.state === "locked"); const e = bad(`Protégé : ${blocked.slice(0, 3).map((b) => `${b.label || b.ref} (${b.why})`).join(" ; ")}. Rien n'a été modifié.`, hardLock ? "protected" : "needs_confirmation"); e.detail = blocked; throw e; }
}
module.exports = { KINDS, setProtection, list, protectionOf, isLocked, mark, stateOf, assertWritable };
