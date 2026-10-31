// Assistant responsive : analyse → proposition → application → annulation (programme 22.8). Réutilise TOUT le cadre de 21.9/22.3 (historique des opérations, instantanés avant/après,
// protections section verrouillée / validée / modifiée à la main, brouillon par pages.saveDraft, annulation par regen.undo) : aucun second mécanisme.
// Principes : (1) une correction ne règle que tablette / mobile et UNIQUEMENT là où l'écran n'a pas déjà sa valeur — l'ordinateur et les réglages manuels sont intacts ;
// (2) la portée est explicite (élément, section, page) et rien ne s'applique sans proposition lue ; (3) rien n'est publié ; (4) aucun appel IA : correctifs déterministes.
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const audit = require("./audit");
const layoutValidate = require("../layoutGen/validate");

const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const regen = () => require("../regen");
const pagesLib = () => require("../marketing/pages");
const fpOf = (v) => require("../regen/util").fp(v);
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
const ws = (p) => (p.working || {});
const clone = (v) => JSON.parse(JSON.stringify(v));

function ensureSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS mk_responsive_proposals (op_id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, payload TEXT NOT NULL)`);
}
const guard = (ctx, siteId) => { const r = regen(); r.ctxLib.siteGuard(ctx, siteId); r.store.ensureSchema(ctx.db); ensureSchema(ctx.db); };
const pageOf = (ctx, siteId, pageId) => regen().ctxLib.pageOf(ctx, siteId, pageId);

// Analyse d'une page (lecture seule)
function analysePage(ctx, siteId, pageId) {
  guard(ctx, siteId);
  const page = pageOf(ctx, siteId, pageId);
  const res = audit.auditSections(ws(page).sections || [], { pageId: page.id, pageName: page.name });
  return { page: { id: page.id, name: page.name, revision: page.revision }, ...res };
}
// Analyse de toutes les pages du site (lecture seule) : « vérifie toutes les pages » ne modifie RIEN, elle liste les pages et éléments concernés
function analyseSite(ctx, siteId) {
  guard(ctx, siteId);
  const pages = pagesLib().sitePages(ctx, siteId);
  const out = pages.map((p) => { const a = analysePage(ctx, siteId, p.id); return { page: a.page, summary: a.summary, issues: a.issues }; });
  const all = out.flatMap((p) => p.issues);
  return { pages: out, summary: audit.summarize(all) };
}

const SCOPES = new Set(["page", "section", "node"]);
function patchTree(children, wanted, applied) {
  for (const n of children || []) {
    const fixes = wanted.get(n.id);
    if (fixes) for (const f of fixes) {
      n.styles = n.styles || {};
      const cur = n.styles[f.device] = n.styles[f.device] || {};
      for (const [k, v] of Object.entries(f.set)) if (cur[k] === undefined) { cur[k] = v; applied.push({ node: n.id, device: f.device, key: k, value: v, rule: f.rule }); }
    }
    patchTree(n.children, wanted, applied);
  }
}
// Proposition : n'écrit RIEN dans la page. { pageId, scope: page|section|node, sectionId?, nodeId?, rules? (liste blanche des règles) }
function propose(ctx, siteId, { pageId, scope = "page", sectionId = null, nodeId = null, rules = null, request = "" } = {}) {
  guard(ctx, siteId);
  if (!SCOPES.has(scope)) throw bad("Portée inconnue (page, section ou élément).");
  const page = pageOf(ctx, siteId, pageId);
  const secs = ws(page).sections || [];
  if (scope !== "page" && !sectionId) throw bad("Précisez la section visée.");
  if (scope === "node" && !nodeId) throw bad("Précisez l'élément visé.");
  const targets = scope === "page" ? secs : secs.filter((s) => s.id === sectionId);
  if (!targets.length) throw bad("Section introuvable dans cette page.", "not_found");
  const a = audit.auditSections(targets, { pageId: page.id, pageName: page.name });
  const allow = Array.isArray(rules) ? new Set(rules.map(String)) : null;
  const issues = a.issues.filter((i) => i.fix && (!allow || allow.has(i.rule)) && (scope !== "node" || i.node === nodeId));
  if (!issues.length) throw bad("Rien à corriger automatiquement dans cette portée.", "nothing_to_do");
  const changes = [], results = [];
  let confirm = false; const reasons = [];
  for (const sec of targets) {
    const mine = issues.filter((i) => i.section === sec.id); if (!mine.length) continue;
    const wanted = new Map();
    for (const i of mine) { if (!wanted.has(i.node)) wanted.set(i.node, []); wanted.get(i.node).push({ device: i.fix.device, set: i.fix.set, rule: i.rule }); }
    const copy = clone(sec), applied = [];
    patchTree(copy.children, wanted, applied);
    if (!applied.length) continue;
    const v = layoutValidate.validate(ctx, copy);
    if (!v.ok) throw bad(`La correction de la section « ${sec.name || sec.id} » ne passe pas la validation native : ${v.errors[0]}`);
    const state = regen().protect.stateOf(ctx, siteId, "section", sec.id, sec);
    if (state === "locked") { reasons.push(`la section ${sec.name || sec.id} est verrouillée`); }
    else if (state === "user_modified" || state === "validated") { confirm = true; reasons.push(`la section ${sec.name || sec.id} contient des modifications manuelles ou validées (leurs valeurs propres à l'écran sont conservées)`); }
    results.push({ section: v.section, applied });
    for (const x of applied) changes.push({ path: `${sec.id}/${x.node}/${x.device}/${x.key}`, before: "(hérité)", after: String(x.value).slice(0, 60), rule: x.rule, sectionId: sec.id });
  }
  if (!results.length) throw bad("Rien à corriger automatiquement dans cette portée.", "nothing_to_do");
  if (results.length > 1) { confirm = true; reasons.push("plusieurs sections modifiées en une opération"); }
  const base = { pageRevision: page.revision, fps: Object.fromEntries(results.map((r) => [`section:${r.section.id}`, fpOf(secs.find((s) => s.id === r.section.id))])) };
  const rulesUsed = [...new Set(changes.map((c) => c.rule))];
  const opId = regen().histories.create(ctx, siteId, { actor: "human", kind: "responsive", request: (request || `Responsive : ${rulesUsed.join(", ")}`).slice(0, 600), intent: "responsive", scope,
    target: { pageId: page.id, sectionId: sectionId || null, nodeId: nodeId || null, targets: results.map((r) => ({ kind: "section", ref: r.section.id, label: r.section.name || r.section.id })) },
    plan: { executor: "responsive", confirm, reasons }, changes, status: "proposed", base, reversible: true });
  ctx.db.prepare("INSERT INTO mk_responsive_proposals (op_id, site_id, organization_id, payload) VALUES (?, ?, ?, ?)").run(opId, siteId, ctx.organizationId, JSON.stringify({ sections: results.map((r) => r.section) }));
  return { opId, status: "proposed", requiresConfirmation: confirm, reasons, changes: changes.map(({ sectionId: s, ...c }) => ({ ...c, section: s })), sections: results.map((r) => r.section.id), page: { id: page.id, name: page.name } };
}

function apply(ctx, siteId, opId, { confirm = false, allow = [] } = {}) {
  guard(ctx, siteId);
  const R = regen();
  const op = R.histories.get(ctx, siteId, opId);
  if (op.kind !== "responsive") throw bad("Cette opération n'est pas une correction responsive.", "conflict");
  if (op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict");
  const row = ctx.db.prepare("SELECT payload FROM mk_responsive_proposals WHERE op_id = ? AND site_id = ? AND organization_id = ?").get(op.id, siteId, ctx.organizationId);
  if (!row) throw bad("Proposition introuvable.", "not_found");
  if (op.plan.confirm && confirm !== true) throw bad("Cette correction touche plusieurs sections ou des éléments modifiés à la main : confirmez-la explicitement après avoir lu l'aperçu.", "confirm_required");
  const items = json(row.payload, {}).sections || [];
  const page = pageOf(ctx, siteId, op.target.pageId);
  const secs = clone(ws(page).sections || []);
  for (const [k, f] of Object.entries(op.base.fps || {})) { const sid = k.slice(8); const cur = secs.find((s) => s.id === sid); if (!cur || f !== fpOf(cur)) throw bad("Conflit : une section a été modifiée depuis la proposition. Rien n'a été écrit : refaites l'analyse.", "conflict"); }
  for (const s of items) {
    if (R.protect.isLocked(ctx, siteId, [["page", page.id], ["section", s.id]])) throw bad("La page ou la section est verrouillée : aucune correction.", "protected");
    R.protect.assertWritable(ctx, siteId, [{ kind: "section", ref: s.id, label: s.name || s.id, value: secs.find((x) => x.id === s.id) }], { allow });
  }
  const before = [], after = [];
  transaction(ctx.db, () => {
    before.push(R.snapshots.takePage(ctx, siteId, page.id, { label: `Avant : ${op.request.slice(0, 60)}` }).id);
    for (const s of items) { const i = secs.findIndex((x) => x.id === s.id); if (i >= 0) secs[i] = s; }
    pagesLib().saveDraft(ctx, page.id, { ...ws(page), sections: secs }, { revision: page.revision });
    after.push(R.snapshots.takePage(ctx, siteId, page.id, { label: `Après : ${op.request.slice(0, 60)}` }).id);
  });
  R.histories.attach(ctx, op.id, "before", before); R.histories.attach(ctx, op.id, "after", after);
  R.histories.update(ctx, siteId, op.id, { status: "applied", appliedAt: new Date().toISOString().replace("T", " ").slice(0, 19) });
  return { opId: op.id, status: "applied", note: "Brouillon mis à jour : rien n'est publié. Annulation possible depuis l'historique." };
}
const reject = (ctx, siteId, opId) => { guard(ctx, siteId); const op = regen().histories.get(ctx, siteId, opId); if (op.kind !== "responsive" || op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict"); regen().histories.update(ctx, siteId, op.id, { status: "rejected" }); return { opId: op.id, status: "rejected" }; };
const undo = (ctx, siteId, opId, o = {}) => { guard(ctx, siteId); return regen().undo(ctx, siteId, opId, o); };
module.exports = { analysePage, analyseSite, propose, apply, reject, undo, ensureSchema };
