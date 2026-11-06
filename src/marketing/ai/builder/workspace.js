// Espace de travail « Assistant IA » (Programme 21.8) : ORCHESTRE les moteurs existants, n'en refait aucun.
//   Brief/Plan → plans.js (21.3) · Pages → pageGen (21.4) via la passerelle bridge.js · Design → designGen (21.5) · Contenus → contentGen (21.6)
//   Médiathèque → médiathèque native du site · Aperçu → rendu natif des pages · Publication → pages.publish natif (avec son contrôle de préparation).
// Ce module ne calcule AUCUN état de son propre chef : chaque statut d'étape, chaque pourcentage et chaque contrôle de la liste de publication est lu dans les données
// réelles des moteurs (plan, générations, pages, jeux de contenus, domaines). Il ajoute seulement : l'annulation/rétablissement des modifications du plan,
// la conversation avec l'assistant (propositions à accepter ou refuser) et la publication groupée des pages générées.
// Portée : tout passe par `plans.get` (plan de l'organisation ET, pour un accès limité à un site, de CE site) ; le site visé est celui du plan, jamais celui d'une requête.
const { MarketingError } = require("../../errors");
const plans = require("./plans");
const bridge = require("./bridge");
const assistant = require("./assistant");
const siteModules = require("../../siteModules");

const err = (code, message) => new MarketingError(code, message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const parse = (s, fb) => { try { return s ? JSON.parse(s) : fb; } catch { return fb; } };
const pagesLib = () => require("../../pages");
const pageGen = () => require("../../../pageGen");
const designGen = () => require("../../../designGen");
const content = () => require("../../../contentGen");
const landing = () => require("../../landing");

const STEPS = Object.freeze([
  { key: "brief", label: "Brief du projet" }, { key: "plan", label: "Plan du site" }, { key: "pages", label: "Pages" }, { key: "design", label: "Design" },
  { key: "contenus", label: "Contenus" }, { key: "medias", label: "Images et médias" }, { key: "apercu", label: "Prévisualisation" }, { key: "publication", label: "Publication" },
]);
const MAX_UNDO = 30, MAX_MESSAGES = 200;

// ───────── Annuler / rétablir (copies du plan enregistrées par le serveur) ─────────
function pushState(ctx, planId, stack, v, label) {
  if (!v.plan) return;
  ctx.db.prepare("INSERT INTO mk_ai_builder_states (plan_id, organization_id, stack, plan_json, status, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(planId, ctx.organizationId, stack, JSON.stringify(v.plan), v.status, String(label || "").slice(0, 160), nowOf(ctx));
  if (stack === "undo") ctx.db.prepare("DELETE FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = 'undo' AND id NOT IN (SELECT id FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = 'undo' ORDER BY id DESC LIMIT ?)").run(planId, ctx.organizationId, planId, ctx.organizationId, MAX_UNDO);
}
const popState = (ctx, planId, stack) => {
  const row = ctx.db.prepare("SELECT * FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = ? ORDER BY id DESC LIMIT 1").get(planId, ctx.organizationId, stack);
  if (row) ctx.db.prepare("DELETE FROM mk_ai_builder_states WHERE id = ?").run(row.id);
  return row || null;
};
const countStack = (ctx, planId, stack) => ctx.db.prepare("SELECT COUNT(*) n FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = ?").get(planId, ctx.organizationId, stack).n;
const topLabel = (ctx, planId, stack) => { const r = ctx.db.prepare("SELECT label FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = ? ORDER BY id DESC LIMIT 1").get(planId, ctx.organizationId, stack); return r ? r.label : ""; };

// Une ou plusieurs opérations du plan avec UNE SEULE entrée d'annulation. Si une opération échoue, rien n'est resté enregistré dans la pile.
function editMany(ctx, id, ops, { revision, label } = {}) {
  const before = plans.get(ctx, id);
  if (!before.plan) throw err("invalid_field", "Ce brief n'a pas encore de plan.");
  if (revision === undefined || Number(revision) !== before.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  if (!Array.isArray(ops) || !ops.length || ops.length > 40) throw err("invalid_field", "Modification invalide.");
  let current = before;
  const undoCount = countStack(ctx, id, "undo");
  pushState(ctx, id, "undo", before, label || "Modification du plan");
  try {
    for (const op of ops) current = plans.edit(ctx, id, op, { revision: current.revision });
  } catch (e) {
    // Les opérations déjà passées sont annulées pour ne pas laisser un plan à moitié modifié
    if (current.revision !== before.revision) plans.restoreState(ctx, id, { planJson: JSON.stringify(before.plan), status: before.status, revision: current.revision, summary: "Modification interrompue : plan remis dans son état précédent." });
    while (countStack(ctx, id, "undo") > undoCount) popState(ctx, id, "undo");
    throw e;
  }
  ctx.db.prepare("DELETE FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = 'redo'").run(id, ctx.organizationId);
  return current;
}
const edit = (ctx, id, op, o) => editMany(ctx, id, [op], o);

function validatePlan(ctx, id, { revision } = {}) {
  const before = plans.get(ctx, id);
  const undoCount = countStack(ctx, id, "undo");
  pushState(ctx, id, "undo", before, "Validation du plan");
  try { const v = plans.validate(ctx, id, { revision }); ctx.db.prepare("DELETE FROM mk_ai_builder_states WHERE plan_id = ? AND organization_id = ? AND stack = 'redo'").run(id, ctx.organizationId); return v; }
  catch (e) { while (countStack(ctx, id, "undo") > undoCount) popState(ctx, id, "undo"); throw e; }
}

function undo(ctx, id, { revision } = {}) {
  const now = plans.get(ctx, id);
  if (revision === undefined || Number(revision) !== now.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  const row = popState(ctx, id, "undo");
  if (!row) throw err("nothing_to_undo", "Rien à annuler.");
  pushState(ctx, id, "redo", now, row.label);
  try { return plans.restoreState(ctx, id, { planJson: row.plan_json, status: row.status, revision: now.revision, summary: `Annulé : ${row.label || "modification"}.` }); }
  catch (e) { popState(ctx, id, "redo"); ctx.db.prepare("INSERT INTO mk_ai_builder_states (plan_id, organization_id, stack, plan_json, status, label, created_at) VALUES (?, ?, 'undo', ?, ?, ?, ?)").run(id, ctx.organizationId, row.plan_json, row.status, row.label, row.created_at); throw e; }
}
function redo(ctx, id, { revision } = {}) {
  const now = plans.get(ctx, id);
  if (revision === undefined || Number(revision) !== now.revision) throw err("conflict", "Ce plan a changé depuis son affichage : rechargez-le.");
  const row = popState(ctx, id, "redo");
  if (!row) throw err("nothing_to_redo", "Rien à rétablir.");
  pushState(ctx, id, "undo", now, row.label);
  try { return plans.restoreState(ctx, id, { planJson: row.plan_json, status: row.status, revision: now.revision, summary: `Rétabli : ${row.label || "modification"}.` }); }
  catch (e) { popState(ctx, id, "undo"); ctx.db.prepare("INSERT INTO mk_ai_builder_states (plan_id, organization_id, stack, plan_json, status, label, created_at) VALUES (?, ?, 'redo', ?, ?, ?, ?)").run(id, ctx.organizationId, row.plan_json, row.status, row.label, row.created_at); throw e; }
}

// Duplication d'une page du plan : page + sections, en UNE modification annulable
function duplicatePage(ctx, id, key, { revision } = {}) {
  const v = plans.get(ctx, id);
  const p = v.plan && v.plan.pages.find((x) => x.key === key);
  if (!p) throw err("not_found", "Page introuvable dans le plan.");
  const name = `${p.name} (copie)`.slice(0, 80);
  const newKey = (name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "page").slice(0, 36);
  const ops = [{ op: "add_page", name, pageType: p.pageType, purpose: p.purpose, menu: "none" }];
  const dupKey = v.plan.pages.some((x) => x.key === newKey) ? `${newKey}-2` : newKey;
  for (const s of p.sections) ops.push({ op: "add_section", pageKey: dupKey, type: s.type, purpose: s.purpose, description: s.description, expectedContent: s.expectedContent });
  return editMany(ctx, id, ops, { revision, label: `Duplication de « ${p.name} »` });
}

// ───────── Conversation avec l'assistant ─────────
const messageView = (r) => ({ id: r.id, role: r.role, kind: r.kind, text: r.text, proposal: parse(r.proposal, null), decision: r.decision, createdAt: r.created_at });
function addMessage(ctx, planId, role, kind, text, proposal) {
  const r = ctx.db.prepare("INSERT INTO mk_ai_builder_messages (plan_id, organization_id, user_id, role, kind, text, proposal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(planId, ctx.organizationId, role === "user" ? ctx.userId ?? null : null, role, kind, String(text).slice(0, 2000), proposal ? JSON.stringify(proposal) : null, nowOf(ctx));
  return Number(r.lastInsertRowid);
}
const getMessage = (ctx, planId, mid) => {
  const row = ctx.db.prepare("SELECT * FROM mk_ai_builder_messages WHERE id = ? AND plan_id = ? AND organization_id = ?").get(Number(mid), planId, ctx.organizationId);
  if (!row) throw err("not_found", "Message introuvable.");
  return row;
};
function listMessages(ctx, planId) {
  return ctx.db.prepare("SELECT * FROM (SELECT * FROM mk_ai_builder_messages WHERE plan_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id").all(planId, ctx.organizationId, MAX_MESSAGES).map(messageView);
}
// Une demande en langage courant → une réponse OU une proposition (jamais une modification directe)
function chat(ctx, id, message, { pageKey } = {}) {
  const v = plans.get(ctx, id);
  const text = String(message ?? "").replace(/\u0000/g, "").trim();
  if (!text) throw err("invalid_field", "Écrivez un message.");
  if (text.length > 600) throw err("invalid_field", "Message trop long (600 caractères au plus).");
  addMessage(ctx, id, "user", "info", text, null);
  const out = assistant.interpret(text, { plan: v.plan, pageKey: pageKey || null });
  const proposal = out.proposal ? { ...out.proposal, planRevision: v.revision } : null;
  const mid = addMessage(ctx, id, "assistant", out.kind === "proposal" ? "proposal" : out.kind === "advice" ? "advice" : "info", out.text, proposal);
  return { message: messageView(getMessage(ctx, id, mid)), redirect: out.redirect || null };
}
function decide(ctx, id, mid, decision, { revision } = {}) {
  const row = getMessage(ctx, id, mid);
  const proposal = parse(row.proposal, null);
  if (row.kind !== "proposal" || !proposal) throw err("invalid_field", "Ce message n'est pas une proposition.");
  if (row.decision) throw err("conflict", "Cette proposition a déjà été traitée.");
  if (decision === "refuse") {
    ctx.db.prepare("UPDATE mk_ai_builder_messages SET decision = 'refused' WHERE id = ?").run(row.id);
    return { message: messageView(getMessage(ctx, id, mid)), plan: plans.get(ctx, id) };
  }
  const v = plans.get(ctx, id);
  if (revision === undefined || Number(revision) !== v.revision) throw err("conflict", "Le plan a changé depuis cette proposition : redemandez-la à l'assistant.");
  const plan = edit(ctx, id, proposal.op, { revision: v.revision, label: proposal.summary });
  ctx.db.prepare("UPDATE mk_ai_builder_messages SET decision = 'accepted' WHERE id = ?").run(row.id);
  return { message: messageView(getMessage(ctx, id, mid)), plan };
}

// ───────── Pages (Page Generator) ─────────
function requireSite(ctx, v) {
  siteModules.assertEnabled(ctx, "ai");
  if (!v.siteId) throw err("no_site", "Ce projet n'est rattaché à aucun site : créez un nouveau projet en choisissant un site.");
  return v.siteId;
}
async function generatePages(ctx, id, { useAi = false, only = null } = {}) {
  const v = plans.get(ctx, id);
  const siteId = requireSite(ctx, v);
  const { plan, pages, planId, revision } = plans.validatedPlan(ctx, id);
  const conv = bridge.toPageGenPlan({ plan, pages, planId, revision });
  const run = await pageGen().generate(ctx, siteId, conv.plan, { useAi: Boolean(useAi), only: Array.isArray(only) && only.length ? only : null, layout: designGen().appliedLayout(ctx, siteId) });
  return { run: runView(run), skipped: conv.skipped };
}
const runView = (run) => ({ id: run.id, status: run.status, usedAi: run.usedAi, createdAt: run.createdAt, applied: run.applied, warnings: run.result.warnings || [], pages: run.result.pages.map((p) => ({ key: p.key, name: p.name, status: p.status, reason: p.reason || "", errors: p.errors || [], warnings: p.warnings || [], sections: (p.sections || []).length, existing: p.existing || null })) });
function applyPages(ctx, id, runId, decisions = {}, { confirmReplace = false } = {}) {
  const v = plans.get(ctx, id); const siteId = requireSite(ctx, v);
  const out = pageGen().apply(ctx, siteId, Number(runId), decisions, { confirmReplace });
  return { applied: out, editorial: editorialReview(ctx, siteId) };
}
// Contrôle éditorial (programme 22.6) après la génération : éléments à compléter, rien n'est modifié. Un échec du contrôle ne doit jamais empêcher l'application des pages.
function editorialReview(ctx, siteId) {
  try {
    const r = require("../../../contentIntel").review(ctx, siteId);
    return { toComplete: r.toComplete.slice(0, 30).map((x) => ({ pageId: x.pageId, page: x.page, what: x.what })), total: r.toComplete.length, analyzed: r.dashboard.overview.analyzed, optimized: r.dashboard.overview.optimized, toImprove: r.dashboard.overview.toImprove };
  } catch { return null; }
}
function undoPages(ctx, id, runId) { const v = plans.get(ctx, id); const siteId = requireSite(ctx, v); return { report: pageGen().undo(ctx, siteId, Number(runId)) }; }

// ───────── Design (Design Generator) ─────────
async function generateDesign(ctx, id, brief = {}, { useAi = false } = {}) {
  const v = plans.get(ctx, id); const siteId = requireSite(ctx, v);
  const a = v.analysis || {}; const f = (k) => (a[k] && typeof a[k] === "object" ? a[k].value : "") || "";
  const text = String(brief.text || v.brief || "").slice(0, 2000);
  const run = await designGen().generate(ctx, siteId, { text, category: brief.category || f("siteType"), sector: brief.sector || f("sector"), country: brief.country || f("country"), lang: brief.lang || f("siteLanguage") }, { useAi: Boolean(useAi) });
  return { run: designRunView(run) };
}
const designRunView = (run) => ({ id: run.id, status: run.status, chosen: run.chosen, usedAi: run.usedAi, createdAt: run.createdAt, applied: run.applied && run.applied.values ? { count: Object.keys(run.applied.values).length } : null, proposals: run.proposals.map((p) => ({ key: p.key, name: p.name, description: p.description, pros: p.pros, limits: p.limits, ok: p.report && p.report.ok, colors: (p.design && p.design.colors) || null, fonts: (p.design && p.design.fonts) || null, changes: (p.changes || []).length })) });
function designCompare(ctx, id, runId, key, o) { const v = plans.get(ctx, id); const siteId = requireSite(ctx, v); return designGen().compare(ctx, siteId, Number(runId), String(key), o); }
function applyDesign(ctx, id, runId, key, o) { const v = plans.get(ctx, id); const siteId = requireSite(ctx, v); return designGen().apply(ctx, siteId, Number(runId), String(key), o); }
function undoDesign(ctx, id, runId, o) { const v = plans.get(ctx, id); const siteId = requireSite(ctx, v); return designGen().undo(ctx, siteId, Number(runId), o); }

// ───────── Images et médias (AI Media Generator + Asset Manager, 21.7) ─────────
const media = () => require("../../../aiMedia");
function mediaOf(ctx, id) { const v = plans.get(ctx, id); const siteId = requireSite(ctx, v); return { v, siteId }; }
const mediaPlan = (ctx, id) => { const { siteId } = mediaOf(ctx, id); return { needs: media().plan(ctx, siteId) }; };
const mediaEstimate = (ctx, id, input) => { const { siteId } = mediaOf(ctx, id); return { estimate: media().estimate(ctx, siteId, input || {}) }; };
// Lancer une génération : contrôles du moteur (fournisseur utilisable, autorisation de dépense, quotas) AVANT toute création de tâche
function mediaGenerate(ctx, id, input = {}) { const { siteId } = mediaOf(ctx, id); return { tasks: media().start(ctx, siteId, input || {}, {}) }; }
const mediaCancel = (ctx, id, tid) => { const { siteId } = mediaOf(ctx, id); return { task: media().cancel(ctx, siteId, Number(tid)) }; };
const mediaRetry = (ctx, id, tid) => { const { siteId } = mediaOf(ctx, id); return { tasks: media().retry(ctx, siteId, Number(tid), {}) }; };
const mediaEditNeed = (ctx, id, key, o) => { const { siteId } = mediaOf(ctx, id); return { need: media().editNeed(ctx, siteId, String(key), { prompt: o.prompt, ratio: o.ratio }) }; };
// Poser une image dans l'emplacement : un emplacement déjà rempli n'est JAMAIS remplacé sans `replace: true` explicite (règle du moteur)
const mediaAssign = (ctx, id, o = {}) => { const { siteId } = mediaOf(ctx, id); return { result: media().assign(ctx, siteId, { needKey: String(o.needKey || ""), mediaId: Number(o.mediaId), alt: o.alt === undefined ? null : o.alt, replace: o.replace === true, confirmManual: o.confirmManual === true }) }; };
const mediaLibrary = (ctx, id, q) => { const { siteId } = mediaOf(ctx, id); return { items: media().library(ctx, siteId, { q: String(q || "").slice(0, 80), limit: 40 }) }; };

// ───────── État du projet : tout est LU dans les moteurs ─────────
const placeholders = (sections) => { let n = 0; const walk = (x) => { if (typeof x === "string") { if (/^\[[^\]]{2,}\]$/.test(x.trim())) n += 1; } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") Object.values(x).forEach(walk); }; walk(sections); return n; };
function mediaSlots(page) {
  const slots = [];
  (page.working.sections || []).forEach((s, i) => {
    if (s.type === "hero") slots.push({ pageId: page.id, pageName: page.name, section: i, kind: "bandeau", src: s.image || "", alt: s.imageAlt || "", missing: !s.image });
    else if (s.type === "image") slots.push({ pageId: page.id, pageName: page.name, section: i, kind: "image", src: s.src || "", alt: s.alt || "", missing: !s.src });
  });
  return slots;
}
const brokenButtons = (page) => (page.working.sections || []).filter((s) => (s.buttonLabel && !s.buttonUrl) || (s.ctaLabel && !s.ctaUrl)).length;

function state(ctx, id, { can = () => true } = {}) {
  const v = plans.get(ctx, id);
  const siteId = v.siteId;
  const site = siteId ? pagesLib().getSite(ctx, siteId) : null;
  const siteOk = Boolean(site && !site.deleted_at && site.status === "active");
  const history = plans.history(ctx, id).slice(-40).reverse();
  const validated = v.status === "validated";
  const plan = v.plan;
  const questions = ((v.analysis && v.analysis.questions) || []).map((q) => ({ id: q.id, topic: q.topic, question: q.question, why: q.why || "" }));

  // moteurs en aval (uniquement si un site existe)
  let pageRuns = [], latestPageRun = null, appliedPageRun = null, designRuns = [], latestDesign = null, appliedDesign = null, sets = [], sitePages = [];
  if (siteId && siteOk) {
    try { pageRuns = pageGen().listRuns(ctx, siteId); } catch { pageRuns = []; }
    const latest = pageRuns.find((r) => r.status !== "undone") || null;
    if (latest) latestPageRun = runView(pageGen().getRun(ctx, siteId, latest.id));
    const app = pageRuns.find((r) => r.status === "applied");
    if (app) appliedPageRun = latestPageRun && latestPageRun.id === app.id ? latestPageRun : runView(pageGen().getRun(ctx, siteId, app.id));
    try { designRuns = designGen().listRuns(ctx, siteId); } catch { designRuns = []; }
    const dl = designRuns.find((r) => r.status !== "undone"); if (dl) latestDesign = designRunView(designGen().getRun(ctx, siteId, dl.id));
    const da = designRuns.find((r) => r.status === "applied"); if (da) appliedDesign = latestDesign && latestDesign.id === da.id ? latestDesign : designRunView(designGen().getRun(ctx, siteId, da.id));
    try { sets = content().listSets(ctx, siteId); } catch { sets = []; }
    sitePages = pagesLib().listPages(ctx, { siteId });
  }
  // pages du plan ↔ pages natives créées par le générateur
  const genKey = (k) => require("../../../pageGen/plan").slugify(k) || k;
  const appliedMap = (appliedPageRun && appliedPageRun.applied) || {};
  const proposedMap = new Map(((latestPageRun && latestPageRun.pages) || []).map((p) => [p.key, p]));
  const native = new Map(); let pageDetails = [];
  for (const sp of sitePages) native.set(sp.id, sp);
  const planPages = (plan ? plan.pages : []).map((pp) => {
    const gk = genKey(pp.key); const ap = appliedMap[gk]; const sp = ap ? native.get(ap.pageId) : null; const pr = proposedMap.get(gk);
    let generation = "none", detail = "";
    if (sp) generation = sp.status === "published" ? "published" : "draft";
    else if (ap) { generation = "missing"; detail = "La page générée n'existe plus (supprimée ou archivée)."; }
    else if (pr && pr.status === "ready") generation = "proposed";
    else if (pr) { generation = pr.status; detail = pr.reason || (pr.errors && pr.errors[0]) || ""; }
    return { key: pp.key, name: pp.name, slug: pp.slug, goal: pp.purpose, pageType: pp.pageType, sections: pp.sections.length, origin: pp.origin, generation, detail, pageId: sp ? sp.id : null, pageStatus: sp ? sp.status : null, updatedAt: sp ? sp.updated_at : null, warnings: pr ? pr.warnings : [] };
  });
  const generated = planPages.filter((p) => p.pageId);
  const natives = generated.map((g) => pagesLib().getPage(ctx, g.pageId)).filter(Boolean);
  const slots = natives.flatMap(mediaSlots);
  const placeholderCount = natives.reduce((n, p) => n + placeholders(p.working.sections || []), 0);
  const noButtonUrl = natives.reduce((n, p) => n + brokenButtons(p), 0);
  const noSeo = natives.filter((p) => !(p.working.description || "").trim()).length;
  const acceptedSets = sets.filter((s) => s.status === "accepted" || s.status === "applied");
  // Médias : besoins visuels, tâches de génération et fournisseurs lus dans le Media Generator (21.7)
  let needs = [], tasks = [], imgProviders = [];
  if (siteId && siteOk) {
    try { needs = media().listNeeds(ctx, siteId); tasks = media().listTasks(ctx, siteId, {}); imgProviders = media().providerStatus(ctx, siteId, {}).map((p) => ({ id: p.id, label: p.label, kind: p.kind, usable: p.usable, why: p.why, integration: p.integration, models: (p.models || []).map((m) => ({ id: m.id, label: m.label || m.id })) })); } catch { needs = []; tasks = []; imgProviders = []; }
  }
  const running = tasks.filter((t) => t.status === "queued" || t.status === "running");
  const failedTasks = tasks.filter((t) => t.status === "failed" && needs.some((n) => n.key === t.needKey && ["needed", "queued", "failed"].includes(n.status)));
  const pendingNeeds = needs.filter((n) => ["needed", "queued", "generated"].includes(n.status));

  // contrôles de préparation à la publication (le contrôle de fond reste celui de pages.publish)
  const preflight = natives.map((p) => { try { const r = landing().preflight(ctx, { ...p, sections: pagesLib().resolveSections(ctx, p.working.sections || []) }); return { pageId: p.id, name: p.name, ready: r.ready, errors: r.errors || [] }; } catch (e) { return { pageId: p.id, name: p.name, ready: false, errors: [e.message] }; } });
  let domain = { verified: 0, total: 0 };
  if (siteId) { try { const d = ctx.db.prepare("SELECT COUNT(*) total, COALESCE(SUM(status = 'verified'), 0) verified FROM mk_site_domains WHERE site_id = ? AND organization_id = ?").get(siteId, ctx.organizationId); domain = { verified: d.verified, total: d.total }; } catch { /* table absente : contrôle non disponible */ } }
  const C = (key, label, level, message, blocking = false) => ({ key, label, level, message, blocking });
  const checklist = [
    C("site", "Site actif", siteOk ? "ok" : "error", siteOk ? `Site « ${site.name} ».` : "Le site du projet est absent ou archivé.", true),
    C("plan", "Plan validé", validated ? "ok" : "error", validated ? "Le plan est validé." : "Validez le plan à l'étape Plan du site.", true),
    C("pages", "Pages générées", generated.length === 0 ? "error" : generated.length < planPages.length ? "warn" : "ok", generated.length === 0 ? "Aucune page n'a encore été générée." : generated.length < planPages.length ? `${generated.length} page(s) sur ${planPages.length} générée(s).` : "Toutes les pages du plan sont générées.", true),
    C("preflight", "Contrôle de préparation des pages", preflight.some((p) => !p.ready) ? "error" : natives.length ? "ok" : "warn", preflight.some((p) => !p.ready) ? preflight.filter((p) => !p.ready).map((p) => `« ${p.name} » : ${p.errors.join(" ")}`).join(" ") : natives.length ? "Toutes les pages passent le contrôle du CMS." : "Rien à contrôler.", true),
    C("contenus", "Contenus", placeholderCount ? "warn" : natives.length ? "ok" : "warn", placeholderCount ? `${placeholderCount} texte(s) d'exemple entre crochets restent à remplacer.` : natives.length ? "Aucun texte d'exemple restant." : "Aucune page à vérifier."),
    C("images", "Images", running.length ? "warn" : slots.some((s) => s.missing) ? "warn" : "ok", running.length ? `${running.length} génération(s) d'image en cours : elles ne sont pas terminées.` : slots.some((s) => s.missing) ? `${slots.filter((s) => s.missing).length} emplacement(s) d'image sans image.` : "Aucun emplacement d'image vide."),
    C("liens", "Boutons et liens", noButtonUrl ? "warn" : "ok", noButtonUrl ? `${noButtonUrl} bouton(s) sans adresse.` : "Tous les boutons ont une adresse."),
    C("seo", "Description pour les moteurs de recherche", noSeo ? "warn" : natives.length ? "ok" : "warn", noSeo ? `${noSeo} page(s) sans description.` : natives.length ? "Toutes les pages ont une description." : "Aucune page à vérifier."),
    C("design", "Identité visuelle", appliedDesign ? "ok" : "warn", appliedDesign ? "Une direction artistique est appliquée au brouillon des styles (à publier dans l'écran Styles)." : "Aucune direction artistique appliquée : le site garde le style par défaut."),
    C("mobile", "Version mobile", "info", "Non vérifiable automatiquement : contrôlez l'aperçu mobile à l'étape Prévisualisation."),
    C("domaine", "Domaine", domain.verified ? "ok" : "warn", domain.verified ? `${domain.verified} domaine(s) vérifié(s).` : "Aucun domaine vérifié : configurez-le dans les réglages du site avant d'annoncer l'adresse."),
  ];
  const blocking = checklist.filter((c) => c.blocking && c.level === "error");
  const unpublished = generated.filter((g) => g.pageStatus !== "published");
  const canPublish = blocking.length === 0 && unpublished.length > 0 && can("pages.publish");

  // statuts des étapes (clés : not_started | in_progress | to_review | done | error)
  const S = (key, status, detail) => ({ key, label: STEPS.find((s) => s.key === key).label, status, detail });
  const steps = [
    S("brief", plan ? "done" : questions.length ? "to_review" : "in_progress", plan ? "Brief analysé et plan proposé." : questions.length ? `${questions.length} question(s) en attente.` : "Brief analysé : vous pouvez créer le plan."),
    S("plan", !plan ? "not_started" : validated ? "done" : v.status === "to_fix" ? "error" : "to_review", !plan ? "Le plan n'existe pas encore." : validated ? `${planPages.length} page(s) validée(s).` : v.status === "to_fix" ? "Des erreurs bloquent la validation." : "Plan à relire puis valider."),
    S("pages", !validated ? "not_started" : !siteOk ? "error" : generated.length === 0 ? (latestPageRun && latestPageRun.status === "proposed" ? "in_progress" : "not_started") : generated.length < planPages.length ? "to_review" : "done", generated.length ? `${generated.length}/${planPages.length} page(s) créée(s) en brouillon.` : latestPageRun && latestPageRun.status === "proposed" ? "Proposition prête, à appliquer." : validated ? "Aucune génération lancée." : "Validez d'abord le plan."),
    S("design", !siteOk ? "not_started" : appliedDesign ? "done" : latestDesign ? "in_progress" : "not_started", appliedDesign ? "Direction artistique appliquée au brouillon des styles." : latestDesign ? "Propositions prêtes, à choisir." : "Aucune proposition de design."),
    S("contenus", !natives.length ? "not_started" : placeholderCount === 0 ? "done" : acceptedSets.length ? "in_progress" : "to_review", !natives.length ? "Générez d'abord les pages." : placeholderCount === 0 ? "Aucun texte d'exemple restant." : `${placeholderCount} texte(s) d'exemple à remplacer.`),
    S("medias", !natives.length ? "not_started" : running.length ? "in_progress" : failedTasks.length ? "error" : slots.some((s) => s.missing) || pendingNeeds.length ? "to_review" : "done", !natives.length ? "Générez d'abord les pages." : running.length ? `${running.length} génération(s) en cours.` : failedTasks.length ? `${failedTasks.length} génération(s) échouée(s).` : slots.some((s) => s.missing) ? `${slots.filter((s) => s.missing).length} image(s) manquante(s).` : "Aucune image manquante."),
    S("apercu", !natives.length ? "not_started" : preflight.some((p) => !p.ready) ? "error" : "to_review", !natives.length ? "Aucune page à prévisualiser." : preflight.some((p) => !p.ready) ? "Une page ne passe pas le contrôle du CMS." : "À regarder avant de publier."),
    S("publication", !natives.length ? "not_started" : unpublished.length === 0 ? "done" : blocking.length ? "error" : "to_review", !natives.length ? "Rien à publier." : unpublished.length === 0 ? "Toutes les pages générées sont publiées." : blocking.length ? "Des conditions bloquantes ne sont pas remplies." : `${unpublished.length} page(s) à publier.`),
  ];
  const done = steps.filter((s) => s.status === "done").length;
  const current = (steps.find((s) => s.status !== "done") || steps[steps.length - 1]).key;
  return {
    project: { id: v.id, name: (plan && plan.site && plan.site.name) || (site && site.name) || "Projet sans nom", siteId, siteName: site ? site.name : "", siteActive: siteOk, status: v.status, revision: v.revision, updatedAt: v.updatedAt, validatedAt: v.validatedAt },
    brief: v.brief, answers: v.answers, questions, readiness: (v.analysis && v.analysis.readiness) || null, plan, steps, progress: { done, total: steps.length, percent: Math.round((done / steps.length) * 100), current, basis: "étapes terminées / étapes totales, lues dans l'état réel des moteurs" },
    pages: planPages, runs: { pages: latestPageRun, design: latestDesign, designApplied: appliedDesign, content: sets }, media: { slots, missing: slots.filter((s) => s.missing).length, needs, tasks, running: running.length, providers: imgProviders, generation: { available: imgProviders.some((p) => p.usable), reason: imgProviders.some((p) => p.usable && p.kind === "real") ? "" : "Aucun fournisseur d'images réel n'est utilisable : le mode « démonstration » produit des images de substitution, pas de vraies images générées par IA." } },
    checklist, canPublish, blockers: blocking.map((b) => b.message),
    undo: { canUndo: countStack(ctx, id, "undo") > 0, canRedo: countStack(ctx, id, "redo") > 0, undoLabel: topLabel(ctx, id, "undo"), redoLabel: topLabel(ctx, id, "redo") },
    messages: listMessages(ctx, id), history: history.map((h) => ({ id: h.id, action: h.action, summary: h.summary, revision: h.revision, at: h.created_at })),
    capabilities: { sectionTypes: require("./registry").sectionTypes(), pageTypes: require("./registry").pageTypeList().map((t) => ({ id: t.id, label: t.label })).slice(0, 80) },
  };
}

// ───────── Publication groupée (système natif) ─────────
function publishAll(ctx, id, { can = () => true, confirm = false } = {}) {
  if (!can("pages.publish")) throw err("forbidden", "Vous n'avez pas la permission de publier des pages.");
  const s = state(ctx, id, { can }); // accès au projet vérifié d'abord (autre site : « introuvable »)
  // Publication = action explicite : la confirmation est exigée par le SERVICE (pas seulement par la boîte de dialogue du navigateur)
  if (confirm !== true) throw err("confirm_required", "La publication doit être confirmée explicitement.");
  if (s.blockers.length) throw err("preflight_failed", `Publication impossible : ${s.blockers.join(" ")}`);
  const todo = s.pages.filter((p) => p.pageId && p.pageStatus !== "published");
  if (!todo.length) throw err("nothing_to_publish", "Aucune page à publier.");
  const out = [];
  for (const p of todo) {
    try { pagesLib().publish(ctx, p.pageId); out.push({ key: p.key, name: p.name, ok: true }); }
    catch (e) { out.push({ key: p.key, name: p.name, ok: false, error: e instanceof MarketingError ? e.message : "Erreur de publication." }); }
  }
  return { results: out, published: out.filter((r) => r.ok).length, failed: out.filter((r) => !r.ok).length };
}

// ───────── Création d'un projet ─────────
async function createProject(ctx, { brief, siteId, newSiteName }) {
  siteModules.assertEnabled(ctx, "ai");
  require("./brief").precheck(brief); // un brief refusé ne doit jamais laisser un site créé derrière lui
  let target = siteId, created = null;
  if (newSiteName) {
    if (ctx.siteScope !== undefined && ctx.siteScope !== null) throw err("forbidden", "Un accès limité à un site ne peut pas créer de nouveau site.");
    const name = String(newSiteName).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 80);
    if (name.length < 2) throw err("invalid_field", "Donnez un nom au projet (2 caractères au moins).");
    created = pagesLib().createSite(ctx, { name }); target = created.id;
  }
  try { return await plans.analyzeBrief(ctx, { brief, siteId: target }); }
  catch (e) {
    // L'analyse a échoué (IA indisponible, quota…) : le site créé pour ce projet est archivé (jamais supprimé) pour ne pas laisser un site vide actif
    if (created) { try { pagesLib().archiveSite(ctx, created.id); } catch { /* l'erreur d'origine prime */ } }
    throw e;
  }
}

function listProjects(ctx) {
  return plans.list(ctx, { limit: 100 }).map((r) => {
    let st = null;
    try { st = state(ctx, r.id); } catch { st = null; }
    const progress = st ? st.progress : { done: 0, total: STEPS.length, percent: 0 };
    const published = st ? st.steps.find((s) => s.key === "publication").status === "done" : false;
    return { id: r.id, siteId: r.site_id, name: (st && st.project.name) || r.excerpt, excerpt: r.excerpt, status: r.status, updatedAt: r.updated_at, progress, current: progress.current || "brief", pages: st ? st.pages.length : 0, generated: st ? st.pages.filter((p) => p.pageId).length : 0, group: published ? "published" : r.status === "validated" ? "validated" : r.status === "draft" ? "waiting" : "in_progress" };
  });
}

module.exports = { STEPS, state, listProjects, createProject, edit, editMany, duplicatePage, validatePlan, mediaPlan, mediaEstimate, mediaGenerate, mediaCancel, mediaRetry, mediaEditNeed, mediaAssign, mediaLibrary, undo, redo, chat, decide, generatePages, applyPages, undoPages, generateDesign, designCompare, applyDesign, undoDesign, publishAll, listMessages };
