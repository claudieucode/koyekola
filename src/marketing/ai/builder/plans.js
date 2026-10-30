// Plans de site (Programme 21.3) : enregistrement, modification par la personne, validation, historique.
// Cycle : draft (analyse seule) → pending (plan proposé, en attente) → modified (la personne a changé quelque chose) → validated (référence des paliers suivants) ; to_fix = erreurs bloquantes.
// Un plan n'est JAMAIS appliqué automatiquement : ce module n'écrit ni page, ni menu, ni style. Seul un plan « validated » peut être transmis (`validatedPlan`).
// Portée : un accès limité à un site ne voit et ne modifie que les plans de CE site (ctx.siteScope, posé par le serveur) ; le site d'un plan est revalidé en base, jamais lu d'une requête.
const { MarketingError } = require("../../errors");
const { checkCtx, audit } = require("../../audience/shared");
const { transaction } = require("../../db/tx");
const { validSite } = require("../../audit");
const siteModules = require("../../siteModules");
const { slugify } = require("../../../utils/format");
const registry = require("./registry");
const brief = require("./brief");
const planner = require("./planner");
const C = require("./contracts");

const err = (code, message) => new MarketingError(code, message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;
const clip = brief.clip;
const parse = (s, fb) => { try { return s ? JSON.parse(s) : fb; } catch { return fb; } };

function scopeSql(ctx) {
  if (!limited(ctx)) return { sql: "", params: [] };
  return Number.isInteger(ctx.siteScope) ? { sql: " AND site_id = ?", params: [ctx.siteScope] } : { sql: " AND 1 = 0", params: [] };
}
function load(ctx, id) {
  checkCtx(ctx);
  const sc = scopeSql(ctx);
  const row = ctx.db.prepare(`SELECT * FROM mk_ai_plans WHERE id = ? AND organization_id = ?${sc.sql}`).get(Number(id), ctx.organizationId, ...sc.params);
  if (!row) throw err("not_found", "Plan introuvable.");
  return row;
}
const view = (row) => ({ id: row.id, siteId: row.site_id, status: row.status, revision: row.revision, contractVersion: row.contract_version, brief: row.brief_text, answers: parse(row.answers_json, []), analysis: parse(row.analysis_json, null), plan: parse(row.plan_json, null), createdAt: row.created_at, updatedAt: row.updated_at, validatedAt: row.validated_at });
function event(ctx, planId, action, summary, revision) {
  ctx.db.prepare("INSERT INTO mk_ai_plan_events (plan_id, organization_id, user_id, action, summary, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(planId, ctx.organizationId, ctx.userId ?? null, action, clip(summary, 240), revision, nowOf(ctx));
}
// Site du plan : un accès limité est toujours attribué à SON site ; l'équipe peut viser un site de l'organisation (relu en base) ou aucun
function siteOf(ctx, requested) {
  if (limited(ctx)) { const s = validSite(ctx.db, ctx.organizationId, ctx.siteScope); if (s === null) throw err("forbidden", "Ce site n'est pas accessible avec vos droits."); return s; }
  if (requested === undefined || requested === null || requested === "") return null;
  const s = validSite(ctx.db, ctx.organizationId, Number(requested));
  if (s === null) throw err("invalid_field", "Site inconnu.");
  return s;
}
// Accès aux fonctions du constructeur : module « ia » du site (accès limité) comme pour l'AI Studio
const gate = (ctx) => siteModules.assertEnabled(ctx, "ai");

// ---------- Analyse ----------
async function analyzeBrief(ctx, { brief: text, siteId } = {}) {
  checkCtx(ctx); gate(ctx);
  const site = siteOf(ctx, siteId);
  const analysis = await brief.analyze(ctx, text, { siteId: site });
  const now = nowOf(ctx);
  const id = transaction(ctx.db, () => {
    const r = ctx.db.prepare("INSERT INTO mk_ai_plans (organization_id, site_id, user_id, status, brief_text, analysis_json, created_at, updated_at) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?)").run(ctx.organizationId, site, ctx.userId ?? null, analysis.original.slice(0, C.LIMITS.brief), JSON.stringify(analysis), now, now);
    const pid = Number(r.lastInsertRowid);
    event(ctx, pid, "analyzed", `Brief analysé (niveau : ${analysis.readiness.level}).`, 1);
    audit(ctx, "ai_plan.analyzed", "ai_plan", pid, { level: analysis.readiness.level, questions: analysis.questions.length });
    return pid;
  });
  return view(load(ctx, id));
}

// ---------- Réponses aux questions (modifiables, facultatives) ----------
async function answerQuestions(ctx, id, { answers, revision } = {}) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (revision !== undefined && Number(revision) !== row.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw err("invalid_field", "Réponses invalides.");
  const analysis = parse(row.analysis_json, null);
  const prev = parse(row.answers_json, []);
  const byId = new Map(prev.map((a) => [a.id, a]));
  const questions = new Map(analysis.questions.map((q) => [q.id, q]));
  for (const [qid, v] of Object.entries(answers)) {
    if (v === null || v === "" || (v && v.skip)) { byId.delete(qid); continue; }   // passer / retirer une réponse
    const q = questions.get(qid) || byId.get(qid);                                   // une question déjà répondue n'est plus dans l'analyse : sa réponse reste modifiable
    if (!q) continue;
    byId.set(qid, { id: qid, topic: q.topic, question: q.question, answer: clip(typeof v === "object" ? v.text : v, 300) });
  }
  const list = [...byId.values()].filter((a) => a.answer);
  const fresh = await brief.analyze(ctx, row.brief_text, { answers: list, siteId: row.site_id });
  // les réponses restent attachées à la nouvelle analyse même si les identifiants de questions changent
  const now = nowOf(ctx);
  const ok = transaction(ctx.db, () => {
    const r = ctx.db.prepare("UPDATE mk_ai_plans SET analysis_json = ?, answers_json = ?, revision = revision + 1, updated_at = ?, status = CASE WHEN plan_json IS NULL THEN 'draft' ELSE 'to_fix' END, validated_at = NULL WHERE id = ? AND organization_id = ? AND revision = ?")
      .run(JSON.stringify(fresh), JSON.stringify(list), now, row.id, ctx.organizationId, row.revision);
    if (!r.changes) throw err("conflict", "Ce plan a changé pendant l'analyse : rechargez-le.");
    event(ctx, row.id, "answered", `${list.length} réponse(s) prise(s) en compte ; analyse mise à jour.`, row.revision + 1);
    return true;
  });
  return ok && view(load(ctx, id));
}

// ---------- Plan ----------
async function createPlan(ctx, id, { proceedWithAssumptions = false } = {}) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (row.status === "validated") throw err("conflict", "Ce plan est validé : modifiez-le (il repassera « modifié ») plutôt que d'en générer un autre.");
  const analysis = parse(row.analysis_json, null);
  const planned = await planner.plan(ctx, analysis, { siteId: row.site_id, proceedWithAssumptions });
  const status = planned.summary.errors ? "to_fix" : "pending";
  const now = nowOf(ctx);
  transaction(ctx.db, () => {
    const r = ctx.db.prepare("UPDATE mk_ai_plans SET plan_json = ?, status = ?, revision = revision + 1, updated_at = ?, validated_at = NULL WHERE id = ? AND organization_id = ? AND revision = ?")
      .run(JSON.stringify(planned), status, now, row.id, ctx.organizationId, row.revision);
    if (!r.changes) throw err("conflict", "Ce plan a changé pendant la planification : rechargez-le.");
    event(ctx, row.id, "planned", `Plan proposé : ${planned.summary.pages} page(s), ${planned.summary.sections} section(s).`, row.revision + 1);
    audit(ctx, "ai_plan.created", "ai_plan", row.id, { pages: planned.summary.pages, status });
  });
  return view(load(ctx, id));
}

// ---------- Modification par la personne (aucun appel IA) ----------
const findPage = (plan, key) => { const p = plan.pages.find((x) => x.key === key); if (!p) throw err("not_found", "Page introuvable dans le plan."); return p; };
const findSection = (page, key) => { const s = page.sections.find((x) => x.key === key); if (!s) throw err("not_found", "Section introuvable dans la page."); return s; };
const text = (v, max, label) => { const t = clip(v, max); if (!t) throw err("invalid_field", `${label} : texte obligatoire.`); return t; };

const OPS = {
  rename_site(plan, o) { plan.site.name = text(o.name, 80, "Nom du site"); plan.site.nameEdited = true; return `Site renommé « ${plan.site.name} ».`; },
  set_goals(plan, o) { const g = (Array.isArray(o.goals) ? o.goals : []).filter((k) => Object.hasOwn(C.GOALS, k)); if (!g.length) throw err("invalid_field", "Choisissez au moins un objectif connu."); plan.site.goals = [...new Set(g)]; return "Objectifs modifiés."; },
  set_description(plan, o) { plan.site.description = text(o.description, 400, "Description"); return "Description modifiée."; },
  rename_page(plan, o) { const p = findPage(plan, o.key); const old = p.name; p.name = text(o.name, 80, "Nom de la page"); if (o.slug !== undefined) p.slug = text(o.slug, 40, "Adresse"); return `Page « ${old} » renommée « ${p.name} ».`; },
  set_page(plan, o) { const p = findPage(plan, o.key); if (o.purpose !== undefined) p.purpose = clip(o.purpose, 240); if (o.description !== undefined) p.description = clip(o.description, 400); return `Page « ${p.name} » modifiée.`; },
  add_page(plan, o) {
    if (plan.pages.length >= C.LIMITS.pages) throw err("limit", `Un plan contient ${C.LIMITS.pages} pages au plus.`);
    const name = text(o.name, 80, "Nom de la page");
    const pageType = registry.pageType(clip(o.pageType, 40)) ? clip(o.pageType, 40) : "autre";
    let key = (slugify(name) || "page").slice(0, 36); while (plan.pages.some((x) => x.key === key)) key += "-2";
    const menu = o.menu && C.MENUS.includes(o.menu) ? o.menu : "main";
    plan.pages.push({ key, name, slug: key, purpose: clip(o.purpose, 240), description: "", pageType, priority: "optional", origin: "user", menu, position: plan.pages.length + 1, parent: "", relatedTo: [], sections: [] });
    if (menu !== "none") plan.navigation[menu] = [...plan.navigation[menu], key];
    return `Page « ${name} » ajoutée.`;
  },
  remove_page(plan, o) {
    const p = findPage(plan, o.key);
    if (p.key === "accueil" || p.pageType === "accueil") throw err("forbidden", "La page d'accueil ne peut pas être supprimée.");
    plan.pages = plan.pages.filter((x) => x.key !== p.key);
    for (const x of plan.pages) if (x.parent === p.key) x.parent = "";
    for (const m of ["main", "secondary", "footer"]) plan.navigation[m] = plan.navigation[m].filter((k) => k !== p.key);
    plan.conversions = plan.conversions.filter((c) => c.pageKey !== p.key);
    return `Page « ${p.name} » supprimée.`;
  },
  set_navigation(plan, o) {
    if (!["main", "secondary", "footer"].includes(o.menu) || !Array.isArray(o.keys)) throw err("invalid_field", "Menu ou liste invalide.");
    const keys = o.keys.filter((k, i, a) => a.indexOf(k) === i);
    for (const k of keys) findPage(plan, k);
    plan.navigation[o.menu] = keys;
    return `Navigation « ${o.menu} » réorganisée.`;
  },
  move_in_navigation(plan, o) {
    const list = plan.navigation[o.menu]; if (!Array.isArray(list) || !list.includes(o.key)) throw err("not_found", "Entrée de menu introuvable.");
    const to = Math.max(0, Math.min(list.length - 1, Number(o.to) || 0)); list.splice(list.indexOf(o.key), 1); list.splice(to, 0, o.key);
    return "Entrée de menu déplacée.";
  },
  add_feature(plan, o) {
    if (!registry.FEATURES[o.key]) throw err("invalid_field", "Fonctionnalité inconnue.");
    plan.removedFeatures = (plan.removedFeatures || []).filter((k) => k !== o.key);
    plan.features = plan.features.filter((f) => f.key !== o.key);
    plan.features.push({ key: o.key, level: C.LEVELS.includes(o.level) ? o.level : "optional", origin: "user", addedByUser: true, reason: clip(o.reason, 240) || "Ajoutée par vous." });
    return `Fonctionnalité « ${registry.feature(o.key).label} » ajoutée.`;
  },
  remove_feature(plan, o) {
    if (!registry.FEATURES[o.key]) throw err("invalid_field", "Fonctionnalité inconnue.");
    plan.features = plan.features.filter((f) => f.key !== o.key);
    plan.removedFeatures = [...new Set([...(plan.removedFeatures || []), o.key])];
    return `Fonctionnalité « ${registry.feature(o.key).label} » retirée.`;
  },
  acknowledge_feature(plan, o) { if (!plan.features.some((f) => f.key === o.key)) throw err("not_found", "Fonctionnalité absente du plan."); plan.acknowledged = [...new Set([...(plan.acknowledged || []), o.key])]; return `« ${registry.feature(o.key).label} » : poursuite sans cette fonctionnalité reconnue.`; },
  accept_recommendation(plan, o) {
    const r = plan.recommendations.find((x) => x.id === o.id); if (!r) throw err("not_found", "Recommandation introuvable.");
    r.accepted = true;
    if (r.feature) { plan.removedFeatures = (plan.removedFeatures || []).filter((k) => k !== r.feature); if (!plan.features.some((f) => f.key === r.feature)) plan.features.push({ key: r.feature, level: "recommended", origin: "ai", reason: r.text }); }
    return "Recommandation acceptée.";
  },
  reject_recommendation(plan, o) {
    const r = plan.recommendations.find((x) => x.id === o.id); if (!r) throw err("not_found", "Recommandation introuvable.");
    plan.rejectedRecommendations = [...new Set([...(plan.rejectedRecommendations || []), r.id])];
    if (r.feature && !r.accepted) plan.features = plan.features.filter((f) => !(f.key === r.feature && f.origin === "ai"));
    return "Recommandation refusée.";
  },
  add_section(plan, o) {
    const p = findPage(plan, o.pageKey);
    if (p.sections.length >= C.LIMITS.sectionsPerPage) throw err("limit", `${C.LIMITS.sectionsPerPage} sections au plus par page.`);
    const s = { key: `${p.key}-n${Date.now().toString(36)}${p.sections.length}`, type: clip(o.type, 40), purpose: clip(o.purpose, 160), description: clip(o.description, 400), expectedContent: clip(o.expectedContent, 400), widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "user" };
    if (!registry.hasSection(s.type)) throw err("invalid_field", `Type de section inconnu : ${s.type || "(vide)"}. Types disponibles : ${registry.sectionTypes().join(", ")}.`);
    const at = Number.isInteger(o.index) ? Math.max(0, Math.min(p.sections.length, o.index)) : p.sections.length; p.sections.splice(at, 0, s);
    return `Section « ${s.purpose || s.type} » ajoutée à « ${p.name} ».`;
  },
  remove_section(plan, o) { const p = findPage(plan, o.pageKey); const s = findSection(p, o.key); p.sections = p.sections.filter((x) => x !== s); return `Section « ${s.purpose || s.type} » retirée de « ${p.name} ».`; },
  move_section(plan, o) { const p = findPage(plan, o.pageKey); const s = findSection(p, o.key); p.sections.splice(p.sections.indexOf(s), 1); p.sections.splice(Math.max(0, Math.min(p.sections.length, Number(o.to) || 0)), 0, s); return `Section déplacée dans « ${p.name} ».`; },
  set_section(plan, o) { const p = findPage(plan, o.pageKey); const s = findSection(p, o.key); for (const k of ["purpose", "description", "expectedContent"]) if (o[k] !== undefined) s[k] = clip(o[k], k === "purpose" ? 160 : 400); if (o.type !== undefined) { if (!registry.hasSection(o.type)) throw err("invalid_field", "Type de section inconnu."); s.type = o.type; } return `Section de « ${p.name} » modifiée.`; },
};

function edit(ctx, id, op, { revision } = {}) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (revision === undefined || Number(revision) !== row.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  if (!row.plan_json) throw err("invalid_field", "Ce brief n'a pas encore de plan.");
  if (!op || typeof op !== "object" || !Object.hasOwn(OPS, op.op)) throw err("invalid_field", "Modification inconnue.");
  const analysis = parse(row.analysis_json, null);
  const plan = parse(row.plan_json, null);
  plan.recommendations = plan.recommendations || [];
  const summary = OPS[op.op](plan, op);
  const next = planner.reconcile(ctx, plan, analysis, { siteId: row.site_id });
  next.assumptions = plan.assumptions || [];
  const status = next.summary.errors ? "to_fix" : "modified";
  const now = nowOf(ctx);
  transaction(ctx.db, () => {
    const r = ctx.db.prepare("UPDATE mk_ai_plans SET plan_json = ?, status = ?, revision = revision + 1, updated_at = ?, validated_at = NULL WHERE id = ? AND organization_id = ? AND revision = ?")
      .run(JSON.stringify(next), status, now, row.id, ctx.organizationId, row.revision);
    if (!r.changes) throw err("conflict", "Ce plan a été modifié par quelqu'un d'autre : rechargez-le.");
    event(ctx, row.id, op.op, summary, row.revision + 1);
  });
  return view(load(ctx, id));
}

// ---------- Validation ----------
function validate(ctx, id, { revision } = {}) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (revision === undefined || Number(revision) !== row.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  if (!row.plan_json) throw err("invalid_field", "Ce brief n'a pas encore de plan à valider.");
  if (row.status === "validated") return view(row);
  const analysis = parse(row.analysis_json, null);
  const plan = planner.reconcile(ctx, parse(row.plan_json, null), analysis, { siteId: row.site_id });
  const errors = plan.warnings.filter((w) => w.level === "error");
  if (errors.length) {
    ctx.db.prepare("UPDATE mk_ai_plans SET plan_json = ?, status = 'to_fix', revision = revision + 1, updated_at = ? WHERE id = ? AND organization_id = ? AND revision = ?").run(JSON.stringify({ ...plan, assumptions: parse(row.plan_json, {}).assumptions || [] }), nowOf(ctx), row.id, ctx.organizationId, row.revision);
    throw err("plan_invalid", `Le plan ne peut pas être validé : ${errors.map((e) => e.message).join(" ")}`);
  }
  const now = nowOf(ctx);
  transaction(ctx.db, () => {
    const r = ctx.db.prepare("UPDATE mk_ai_plans SET status = 'validated', revision = revision + 1, updated_at = ?, validated_at = ? WHERE id = ? AND organization_id = ? AND revision = ?").run(now, now, row.id, ctx.organizationId, row.revision);
    if (!r.changes) throw err("conflict", "Ce plan a changé : rechargez-le.");
    event(ctx, row.id, "validated", `Plan validé (${plan.summary.pages} pages).`, row.revision + 1);
    audit(ctx, "ai_plan.validated", "ai_plan", row.id, { pages: plan.summary.pages });
  });
  return view(load(ctx, id));
}
// Seule porte vers les paliers suivants
function validatedPlan(ctx, id) {
  const v = view(load(ctx, id));
  if (v.status !== "validated") throw err("not_validated", "Le plan doit être validé par la personne avant d'être transmis à la génération.");
  return { plan: v.plan, pages: planner.pagePlans(v.plan), planId: v.id, revision: v.revision };
}

function list(ctx, { limit = 30 } = {}) {
  checkCtx(ctx);
  const sc = scopeSql(ctx);
  return ctx.db.prepare(`SELECT id, site_id, status, revision, updated_at, substr(brief_text, 1, 120) AS excerpt FROM mk_ai_plans WHERE organization_id = ?${sc.sql} ORDER BY updated_at DESC, id DESC LIMIT ?`).all(ctx.organizationId, ...sc.params, Math.min(Math.max(Number(limit) || 30, 1), 100));
}
function get(ctx, id) { return view(load(ctx, id)); }
function history(ctx, id) { const row = load(ctx, id); return ctx.db.prepare("SELECT id, action, summary, revision, user_id, created_at FROM mk_ai_plan_events WHERE plan_id = ? AND organization_id = ? ORDER BY id").all(row.id, ctx.organizationId); }

module.exports = { analyzeBrief, answerQuestions, createPlan, edit, validate, validatedPlan, list, get, history, OPS: Object.keys(OPS) };
