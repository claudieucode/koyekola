// History Manager : journal central des opérations (humaines ou IA). Aucune clé, aucun secret : la demande est le texte de la personne, les valeurs sont bornées. Une restauration ou une annulation est une NOUVELLE opération
// (parent_id → l'opération d'origine) : l'historique n'est jamais réécrit ni raccourci.
const store = require("./store");
const { bad } = require("./util");
const { json } = store;
const clip = (s, n) => String(s ?? "").slice(0, n);
const trimChanges = (c) => (Array.isArray(c) ? c : []).slice(0, 300).map((x) => ({ ...x, path: clip(x.path, 160), before: clip(x.before, 500), after: clip(x.after, 500) }));
function create(ctx, siteId, o) {
  store.ensureSchema(ctx.db);
  const id = Number(ctx.db.prepare("INSERT INTO mk_regen_ops (organization_id, site_id, project_id, user_id, actor, kind, request, intent, scope, target, plan, changes, status, parent_id, ai_calls, provider, model, cost_micro, cost_kind, base, reversible, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, siteId, o.projectId ?? null, ctx.userId ?? null, o.actor === "ai" ? "ai" : "human", clip(o.kind, 30), clip(o.request, 600), clip(o.intent, 40), clip(o.scope, 30), JSON.stringify(o.target || {}).slice(0, 4000), JSON.stringify(o.plan || {}).slice(0, 8000), JSON.stringify(trimChanges(o.changes)), o.status || "proposed", o.parentId ?? null, o.aiCalls || 0, clip(o.provider, 40), clip(o.model, 60), o.costMicro ?? null, o.costKind || "none", JSON.stringify(o.base || {}).slice(0, 4000), o.reversible === false ? 0 : 1, clip(o.error, 300)).lastInsertRowid);
  for (const [phase, ids] of [["before", o.before], ["after", o.after]]) for (const sid of ids || []) ctx.db.prepare("INSERT OR IGNORE INTO mk_regen_op_snaps (op_id, phase, snap_id) VALUES (?, ?, ?)").run(id, phase, sid);
  return id;
}
const shape = (r, withSnaps = null) => ({ id: r.id, actor: r.actor, kind: r.kind, request: r.request, intent: r.intent, scope: r.scope, target: json(r.target, {}), plan: json(r.plan, {}), changes: json(r.changes, []), status: r.status, parentId: r.parent_id, userId: r.user_id, aiCalls: r.ai_calls, provider: r.provider, model: r.model, cost: { micro: r.cost_micro, kind: r.cost_kind, note: r.cost_kind === "estimated" ? "estimation, pas un coût réel" : r.cost_kind === "none" ? "aucun appel IA" : "coût non communiqué par le fournisseur" }, error: r.error, reversible: Boolean(r.reversible), createdAt: r.created_at, appliedAt: r.applied_at, base: json(r.base, {}), ...(withSnaps ? { snapshots: withSnaps } : {}) });
function get(ctx, siteId, opId) {
  store.ensureSchema(ctx.db);
  const r = ctx.db.prepare("SELECT * FROM mk_regen_ops WHERE id = ? AND organization_id = ? AND site_id = ?").get(Number(opId), ctx.organizationId, siteId);
  if (!r) throw bad("Opération introuvable.", "not_found");
  const snaps = ctx.db.prepare("SELECT o.phase, s.id, s.level, s.ref, s.label FROM mk_regen_op_snaps o JOIN mk_regen_snapshots s ON s.id = o.snap_id WHERE o.op_id = ? ORDER BY o.phase, s.id").all(r.id).map((x) => ({ ...x }));
  return shape(r, snaps);
}
function update(ctx, siteId, opId, patch) {
  const sets = [], vals = [];
  for (const [k, col, enc] of [["status", "status"], ["changes", "changes", (v) => JSON.stringify(trimChanges(v))], ["error", "error", (v) => clip(v, 300)], ["appliedAt", "applied_at"], ["aiCalls", "ai_calls"], ["costMicro", "cost_micro"], ["costKind", "cost_kind"], ["provider", "provider"], ["model", "model"], ["base", "base", (v) => JSON.stringify(v).slice(0, 4000)], ["plan", "plan", (v) => JSON.stringify(v).slice(0, 8000)]]) if (k in patch) { sets.push(`${col} = ?`); vals.push(enc ? enc(patch[k]) : patch[k]); }
  if (!sets.length) return;
  ctx.db.prepare(`UPDATE mk_regen_ops SET ${sets.join(", ")} WHERE id = ? AND organization_id = ? AND site_id = ?`).run(...vals, Number(opId), ctx.organizationId, siteId);
}
function attach(ctx, opId, phase, snapIds) { for (const s of snapIds) ctx.db.prepare("INSERT OR IGNORE INTO mk_regen_op_snaps (op_id, phase, snap_id) VALUES (?, ?, ?)").run(opId, phase, s); }
// Liste paginée ; filtres : page, section, acteur (human|ai), statut, type
function list(ctx, siteId, { pageId = null, sectionId = null, actor = "", status = "", kind = "", limit = 25, offset = 0 } = {}) {
  store.ensureSchema(ctx.db);
  const where = ["organization_id = ?", "site_id = ?"], args = [ctx.organizationId, siteId];
  if (pageId) { where.push("target LIKE ?"); args.push(`%"pageId":${Number(pageId)}%`); }
  if (sectionId) { where.push("target LIKE ?"); args.push(`%"sectionId":"${String(sectionId).replace(/[%_"\\]/g, "")}"%`); }
  if (actor) { where.push("actor = ?"); args.push(actor === "ai" ? "ai" : "human"); } if (status) { where.push("status = ?"); args.push(status); } if (kind) { where.push("kind = ?"); args.push(kind); }
  const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_regen_ops WHERE ${where.join(" AND ")}`).get(...args).n;
  const items = ctx.db.prepare(`SELECT * FROM mk_regen_ops WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, Math.min(Math.max(Number(limit) || 25, 1), 100), Math.max(Number(offset) || 0, 0)).map((r) => { const o = shape(r); return { ...o, changes: o.changes.slice(0, 5), changeCount: o.changes.length }; });
  return { total, items };
}
// Consommation IA : par site (appels, coût estimé SI connu), jamais présentée comme un coût réel
function usage(ctx, siteId) {
  store.ensureSchema(ctx.db);
  const r = ctx.db.prepare("SELECT COUNT(*) ops, COALESCE(SUM(ai_calls), 0) calls, SUM(cost_micro) cost, SUM(CASE WHEN cost_micro IS NULL AND ai_calls > 0 THEN 1 ELSE 0 END) unknown FROM mk_regen_ops WHERE organization_id = ? AND site_id = ? AND status IN ('applied','proposed','undone')").get(ctx.organizationId, siteId);
  return { operations: r.ops, aiCalls: r.calls, estimatedCostMicroUsd: r.cost, operationsWithUnknownCost: r.unknown, note: "Le coût n'est pas communiqué par le chemin ai.call : seules les estimations connues sont additionnées ; ce n'est pas un coût réel." };
}
module.exports = { create, get, update, attach, list, usage, shape };
