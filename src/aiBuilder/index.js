// AI Website Builder — interface (programme 21.8) : façade de PROJET au-dessus des moteurs 21.3 à 21.7. Ce module ne contient ni analyse, ni génération, ni rendu, ni publication :
//  - brief / plan  → src/marketing/ai/builder/plans (21.3)           - pages    → src/pageGen (21.4)        - design → src/designGen (21.5)
//  - contenus      → src/contentGen (21.6)                           - médias   → src/aiMedia (21.7)        - aperçu → /marketing/pages/:id/apercu (moteur de rendu natif)
//  - publication   → pages.publish (système natif, contrôles de publication inclus)
// Il ajoute : le projet (appartenant à un site), le calcul de progression à partir des ÉTATS RÉELS des moteurs, le journal des changements (annuler / rétablir), la liste de contrôle de publication.
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const store = require("./store");
const bridge = require("./bridge");

const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const pagesLib = () => require("../marketing/pages");
const plansLib = () => require("../marketing/ai/builder/plans");
const pageGen = () => require("../pageGen");
const designGen = () => require("../designGen");
const contentGen = () => require("../contentGen");
const aiMedia = () => require("../aiMedia");
const { json } = store;
const STEPS = Object.freeze([["brief", "Brief du projet"], ["plan", "Plan du site"], ["pages", "Pages"], ["design", "Design"], ["contents", "Contenus"], ["media", "Images et médias"], ["preview", "Prévisualisation"], ["publish", "Publication"]]);
const DRAFT_KEYS = Object.freeze(["description", "projectName", "company", "sector", "siteType", "audience", "country", "language", "languages", "goals", "services", "style", "references", "logoMediaId"]);
const UNDOABLE = new Set(["plan", "pagegen", "design", "content", "media"]);

// ---------- accès ----------
function siteOf(ctx, siteId) {
  store.ensureSchema(ctx.db);
  if (!Number.isInteger(siteId) || siteId < 1) throw bad("Site introuvable.", "not_found");
  if (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId) throw bad("Site introuvable.", "not_found");
  const site = pagesLib().getSite(ctx, siteId);
  if (!site || site.deleted_at) throw bad("Site introuvable.", "not_found");
  if (site.status !== "active") throw bad("Ce site est archivé : restaurez-le avant de créer du contenu.");
  return site;
}
function row(ctx, siteId, pid) {
  siteOf(ctx, siteId);
  const r = ctx.db.prepare("SELECT * FROM mk_aib_projects WHERE id = ? AND organization_id = ? AND site_id = ? AND archived_at IS NULL").get(Number(pid), ctx.organizationId, siteId);
  if (!r) throw bad("Projet introuvable.", "not_found");
  return r;
}
const shape = (r) => ({ id: r.id, siteId: r.site_id, name: r.name, planId: r.plan_id, draft: json(r.draft, {}), links: json(r.links, {}), approvals: json(r.approvals, {}), revision: r.revision, createdAt: r.created_at, updatedAt: r.updated_at });
function touch(ctx, r, patch = {}) {
  const sets = ["revision = revision + 1", "updated_at = datetime('now')"], vals = [];
  for (const [k, col] of [["name", "name"], ["planId", "plan_id"], ["draft", "draft"], ["links", "links"], ["approvals", "approvals"]]) if (k in patch) { sets.push(`${col} = ?`); vals.push(typeof patch[k] === "object" && patch[k] !== null ? JSON.stringify(patch[k]) : patch[k]); }
  const res = ctx.db.prepare(`UPDATE mk_aib_projects SET ${sets.join(", ")} WHERE id = ? AND revision = ?`).run(...vals, r.id, r.revision);
  if (!res.changes) throw bad("Ce projet a été modifié ailleurs : rechargez-le.", "conflict");
  return ctx.db.prepare("SELECT * FROM mk_aib_projects WHERE id = ?").get(r.id);
}
function log(ctx, pid, { kind, role = "system", text = "", payload = {}, status = "done" }) {
  return Number(ctx.db.prepare("INSERT INTO mk_aib_events (project_id, organization_id, user_id, kind, role, text, payload, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(pid, ctx.organizationId, ctx.userId ?? null, kind, role, String(text).slice(0, 2000), JSON.stringify(payload).slice(0, 400000), status).lastInsertRowid);
}

// ---------- projets ----------
function createProject(ctx, siteId, { name } = {}) {
  siteOf(ctx, siteId);
  const n = String(name || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  if (!n) throw bad("Donnez un nom à votre projet.");
  const open = ctx.db.prepare("SELECT COUNT(*) n FROM mk_aib_projects WHERE organization_id = ? AND site_id = ? AND archived_at IS NULL").get(ctx.organizationId, siteId).n;
  if (open >= 20) throw bad("20 projets au plus par site : archivez-en un avant d'en créer un autre.", "limit");
  const id = Number(ctx.db.prepare("INSERT INTO mk_aib_projects (organization_id, site_id, name, created_by, draft) VALUES (?, ?, ?, ?, ?)").run(ctx.organizationId, siteId, n, ctx.userId ?? null, JSON.stringify({ projectName: n })).lastInsertRowid);
  log(ctx, id, { kind: "system", text: "Projet créé." });
  return shape(ctx.db.prepare("SELECT * FROM mk_aib_projects WHERE id = ?").get(id));
}
function archiveProject(ctx, siteId, pid) { const r = row(ctx, siteId, pid); ctx.db.prepare("UPDATE mk_aib_projects SET archived_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(r.id); return { ok: true }; }
function listProjects(ctx, siteId) {
  siteOf(ctx, siteId);
  return ctx.db.prepare("SELECT * FROM mk_aib_projects WHERE organization_id = ? AND site_id = ? AND archived_at IS NULL ORDER BY updated_at DESC, id DESC LIMIT 50").all(ctx.organizationId, siteId).map((r) => {
    const s = steps(ctx, siteId, shape(r));
    const done = s.filter((x) => x.status === "done").length;
    const group = done === s.length ? "terminé" : s.find((x) => x.key === "publish").status === "done" ? "publié" : s.every((x) => x.status === "notstarted") ? "en attente" : "en cours";
    return { ...shape(r), progress: { done, total: s.length, steps: s.map((x) => ({ key: x.key, status: x.status })) }, group };
  });
}
// Sauvegarde du brief en cours de saisie (autosauvegarde) : champs connus seulement, révision contrôlée
function saveDraft(ctx, siteId, pid, { fields, revision } = {}) {
  const r = row(ctx, siteId, pid);
  if (Number(revision) !== r.revision) throw bad("Ce projet a changé depuis son affichage : rechargez-le pour ne pas écraser un autre travail.", "conflict");
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw bad("Champs invalides.");
  const cur = json(r.draft, {}), next = { ...cur };
  for (const k of DRAFT_KEYS) if (k in fields) next[k] = k === "logoMediaId" ? (Number.isInteger(Number(fields[k])) && Number(fields[k]) > 0 ? Number(fields[k]) : null) : bridge.str(String(fields[k] ?? ""), k === "description" ? 3000 : 300);
  const upd = touch(ctx, r, { draft: next, ...(next.projectName && next.projectName !== r.name ? { name: next.projectName } : {}) });
  return shape(upd);
}

// ---------- étapes 1-2 : brief et plan (moteur 21.3) ----------
const planView = (ctx, p) => (p.planId ? plansLib().get(ctx, p.planId) : null);
async function analyze(ctx, siteId, pid) {
  const r = row(ctx, siteId, pid), p = shape(r);
  const text = bridge.composeBrief(p.draft);
  const plan = await plansLib().analyzeBrief(ctx, { brief: text, siteId });
  touch(ctx, r, { planId: plan.id, approvals: {}, links: {} });
  log(ctx, r.id, { kind: "system", text: `Brief analysé (niveau : ${plan.analysis.readiness.level}).` });
  return { plan };
}
async function answer(ctx, siteId, pid, answers) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.planId) throw bad("Analysez d'abord le brief.");
  const plan = await plansLib().answerQuestions(ctx, p.planId, { answers });
  return { plan };
}
async function planify(ctx, siteId, pid, { proceedWithAssumptions = false } = {}) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.planId) throw bad("Analysez d'abord le brief.");
  const before = planSnapshot(ctx, p.planId);
  const plan = await plansLib().createPlan(ctx, p.planId, { proceedWithAssumptions });
  log(ctx, pid, { kind: "change", text: "Plan du site proposé.", payload: { kind: "plan", before, planId: p.planId, after: planSnapshot(ctx, p.planId) } });
  return { plan };
}
function planSnapshot(ctx, planId) { const v = plansLib().get(ctx, planId); return { plan: v.plan, status: v.status }; }
// Modification du plan : la logique est celle du Site Planner (plans.edit) ; le journal garde l'état d'avant/après pour annuler et rétablir
function editPlan(ctx, siteId, pid, operation, revision) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.planId) throw bad("Pas de plan à modifier.");
  const before = planSnapshot(ctx, p.planId);
  const plan = plansLib().edit(ctx, p.planId, operation, { revision });
  log(ctx, pid, { kind: "change", text: `Plan modifié (${operation && operation.op}).`, payload: { kind: "plan", before, planId: p.planId, after: planSnapshot(ctx, p.planId) } });
  return { plan };
}
function validatePlan(ctx, siteId, pid, revision) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.planId) throw bad("Pas de plan à valider.");
  const plan = plansLib().validate(ctx, p.planId, { revision });
  log(ctx, pid, { kind: "system", text: "Plan validé." });
  return { plan };
}
// Restauration d'un état de plan (annuler / rétablir) : écriture directe dans la ligne du plan, révision incrémentée, jamais « validé » automatiquement
function restorePlan(ctx, planId, snap) {
  const v = plansLib().get(ctx, planId);
  ctx.db.prepare("UPDATE mk_ai_plans SET plan_json = ?, status = ?, revision = revision + 1, updated_at = ?, validated_at = NULL WHERE id = ? AND organization_id = ? AND revision = ?")
    .run(snap.plan ? JSON.stringify(snap.plan) : null, snap.plan ? (snap.status === "validated" ? "modified" : snap.status) : "draft", Date.now(), planId, ctx.organizationId, v.revision);
}

// ---------- étape 3 : pages (Page Generator 21.4) ----------
function generatePages(ctx, siteId, pid, { useAi = false } = {}) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.planId) throw bad("Aucun plan : analysez le brief puis validez le plan.");
  const v = plansLib().validatedPlan(ctx, p.planId); // refuse tout plan non validé par la personne
  const conv = bridge.sitePlanToPageGen(v.plan);
  if (!conv.plan.pages.length) throw bad("Aucune page générable dans ce plan (toutes les sections sont indisponibles ou sans équivalent).");
  return pageGen().generate(ctx, siteId, conv.plan, { useAi }).then((run) => {
    touch(ctx, row(ctx, siteId, pid), { links: { ...p.links, pagegenRun: run.id } });
    return { run, skipped: conv.skipped };
  });
}
function applyPages(ctx, siteId, pid, { decisions = {}, confirmReplace = false } = {}) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.links.pagegenRun) throw bad("Aucune génération de pages à appliquer.");
  const out = pageGen().apply(ctx, siteId, p.links.pagegenRun, decisions, { confirmReplace });
  log(ctx, pid, { kind: "change", text: `${Object.keys(out).length} page(s) enregistrée(s) en brouillon.`, payload: { kind: "pagegen", run: p.links.pagegenRun } });
  return { applied: out };
}
function undoPages(ctx, siteId, pid) { const p = shape(row(ctx, siteId, pid)); if (!p.links.pagegenRun) throw bad("Rien à annuler."); return { report: pageGen().undo(ctx, siteId, p.links.pagegenRun) }; }
// Pages du projet : pages créées par la génération appliquée, avec leur état réel
function projectPages(ctx, siteId, p) {
  let ids = [];
  if (p.links.pagegenRun) { try { const run = pageGen().getRun(ctx, siteId, p.links.pagegenRun); if (run.status === "applied") ids = Object.entries(run.applied).map(([key, a]) => ({ key, pageId: a.pageId })); } catch { /* run supprimé */ } }
  const sets = ctx.db.prepare("SELECT page_id, status FROM mk_content_sets WHERE site_id = ? AND organization_id = ? AND status != 'discarded' AND language = ?").all(siteId, ctx.organizationId, (planLang(ctx, p) || "fr"));
  return ids.map(({ key, pageId }) => {
    let pg = null; try { pg = pagesLib().requirePage(ctx, pageId); } catch { /* page retirée */ }
    if (!pg || pg.site_id !== siteId || pg.archived_at) return { key, pageId, missing: true };
    const w = pg.working || {};
    const txt = JSON.stringify(w.sections || []);
    const cs = sets.filter((s) => s.page_id === pageId).map((s) => s.status);
    return { key, pageId, name: pg.name, slug: pg.slug, status: pg.status, hasDraft: Boolean(pg.hasDraft), sections: (w.sections || []).length, updatedAt: pg.updated_at, description: w.description || "", seo: { title: (w.seo || {}).title || "", description: (w.seo || {}).description || "" }, placeholders: (txt.match(/\[[^\]\\"]{1,80}\]/g) || []).length, contentState: cs.includes("applied") ? "applied" : cs.includes("accepted") ? "accepted" : cs.length ? "proposed" : "none", previewUrl: `/marketing/pages/${pageId}/apercu`, editUrl: `/marketing/pages/${pageId}/editeur` };
  });
}
function planLang(ctx, p) { try { const v = p.planId ? plansLib().get(ctx, p.planId) : null; return v && v.analysis && v.analysis.language.site.value; } catch { return null; } }

// ---------- étape 4 : design (Design Generator 21.5) ----------
async function generateDesign(ctx, siteId, pid, { text = "", useAi = false } = {}) {
  const p = shape(row(ctx, siteId, pid));
  const base = designGen().defaultBrief(ctx, siteId);
  const d = p.draft;
  const brief = { ...base, text: [text, d.style, d.siteType, d.sector, String(d.description || "").slice(0, 500), base.text].filter(Boolean).join(" ").slice(0, 2000), sector: d.sector || base.sector, country: (d.country || base.country || "").slice(0, 2).toUpperCase(), category: base.category || d.siteType || "" };
  const run = await designGen().generate(ctx, siteId, brief, { useAi });
  touch(ctx, row(ctx, siteId, pid), { links: { ...p.links, designRun: run.id } });
  return { run };
}
function designCompare(ctx, siteId, pid, key, can) { const p = shape(row(ctx, siteId, pid)); if (!p.links.designRun) throw bad("Aucune proposition de design."); return designGen().compare(ctx, siteId, p.links.designRun, key, { can }); }
function applyDesign(ctx, siteId, pid, { key, overwrite = false, can } = {}) {
  const p = shape(row(ctx, siteId, pid));
  if (!p.links.designRun) throw bad("Aucune proposition de design.");
  const r = designGen().apply(ctx, siteId, p.links.designRun, key, { overwrite, can, userId: ctx.userId ?? null });
  log(ctx, pid, { kind: "change", text: "Direction artistique appliquée au brouillon du personnalisateur.", payload: { kind: "design", run: p.links.designRun } });
  return { applied: r };
}
function undoDesign(ctx, siteId, pid, can) { const p = shape(row(ctx, siteId, pid)); if (!p.links.designRun) throw bad("Rien à annuler."); return designGen().undo(ctx, siteId, p.links.designRun, { can, userId: ctx.userId ?? null }); }

// ---------- étape 5 : contenus (Content Generator 21.6) ----------
function contentContext(ctx, p) {
  const v = p.planId ? plansLib().get(ctx, p.planId) : null;
  const d = p.draft;
  return { company: { name: d.company || undefined, sector: d.sector || undefined, services: d.services || undefined }, analysis: v ? v.analysis : undefined, audience: d.audience || undefined, language: (v && v.analysis && v.analysis.language.site.value) || d.language || "fr", country: ((v && v.analysis && v.analysis.project.country.code) || d.country || "").toUpperCase().slice(0, 2) };
}
async function generateContent(ctx, siteId, pid, { pageId, scope = "empty", voice = null } = {}) {
  const p = shape(row(ctx, siteId, pid));
  const mine = projectPages(ctx, siteId, p).filter((x) => !x.missing).map((x) => x.pageId);
  if (!mine.includes(Number(pageId))) throw bad("Cette page n'appartient pas à ce projet.", "not_found");
  const set = await contentGen().generatePage(ctx, siteId, { pageId: Number(pageId), context: contentContext(ctx, p), voiceOverride: voice, scope: scope === "all" ? "all" : "empty" });
  return { set };
}
function applyContent(ctx, siteId, pid, { setId, overwriteManual = [] } = {}) {
  const p = shape(row(ctx, siteId, pid));
  const set = contentGen().getSet(ctx, siteId, Number(setId));
  if (!projectPages(ctx, siteId, p).some((x) => x.pageId === set.pageId)) throw bad("Ce contenu ne concerne pas une page du projet.", "not_found");
  const out = contentGen().apply(ctx, siteId, Number(setId), { overwriteManual });
  if (out.written.length || out.seoWritten.length) log(ctx, pid, { kind: "change", text: `Contenus appliqués à la page (${out.written.length} champ(s)).`, payload: { kind: "content", setId: Number(setId) } });
  return out;
}

// ---------- étape 6 : médias (AI Media 21.7) ----------
function mediaState(ctx, siteId, opts = {}) {
  const needs = aiMedia().listNeeds(ctx, siteId), tasks = aiMedia().listTasks(ctx, siteId, {});
  return { needs, tasks: tasks.slice(0, 30), providers: aiMedia().providerStatus(ctx, siteId, opts).map((x) => ({ id: x.id, label: x.label, kind: x.kind, usable: x.usable, why: x.why })) };
}
function mediaStart(ctx, siteId, pid, input, opts = {}) { row(ctx, siteId, pid); return { tasks: aiMedia().start(ctx, siteId, input, opts) }; }
function mediaAssign(ctx, siteId, pid, input) {
  row(ctx, siteId, pid);
  const r = aiMedia().assign(ctx, siteId, input);
  // Seul un REMPLACEMENT est annulable par le moteur média (« restaurer » rétablit l'image précédente) ; une première association se retire dans l'éditeur de la page
  log(ctx, pid, { kind: "change", text: r.operation === "replace" ? "Image remplacée dans un emplacement." : "Image associée à un emplacement.", payload: { kind: r.operation === "replace" ? "media" : "media-first", needKey: input.needKey } });
  return { assigned: r };
}

// ---------- progression : ÉTATS RÉELS des moteurs, jamais un pourcentage inventé ----------
const S = (key, label, status, detail, extra = {}) => ({ key, label, status, detail, ...extra });
function steps(ctx, siteId, p) {
  const out = [];
  let v = null; try { v = p.planId ? plansLib().get(ctx, p.planId) : null; } catch { v = null; }
  const a = v && v.analysis;
  out.push(!a ? S("brief", "Brief du projet", "notstarted", "Le brief n'est pas encore analysé.")
    : a.readiness.level === "insufficient" ? S("brief", "Brief du projet", "error", "Le brief ne permet pas d'identifier le projet : complétez-le.")
    : a.readiness.level === "blocked" ? S("brief", "Brief du projet", "review", `${a.questions.filter((q) => q.blocking).length || a.readiness.blocking.length} point(s) bloquant(s) à lever.`)
    : S("brief", "Brief du projet", "done", "Brief analysé."));
  out.push(!v || !v.plan ? S("plan", "Plan du site", "notstarted", a ? "Le plan n'est pas encore proposé." : "Analysez d'abord le brief.")
    : v.status === "to_fix" ? S("plan", "Plan du site", "error", "Le plan contient des erreurs bloquantes.")
    : v.status === "validated" ? S("plan", "Plan du site", "done", `${v.plan.pages.length} page(s) validée(s).`) : S("plan", "Plan du site", "review", "Plan à vérifier et à valider."));
  let run = null; if (p.links.pagegenRun) { try { run = pageGen().getRun(ctx, siteId, p.links.pagegenRun); } catch { run = null; } }
  const pp = projectPages(ctx, siteId, p);
  const live = pp.filter((x) => !x.missing);
  const planned = v && v.plan ? v.plan.pages.length : 0;
  out.push(run && run.status === "applied" ? (live.length < Math.min(planned, run.result.pages.filter((x) => x.status === "ready").length) ? S("pages", "Pages", "review", "Des pages générées ont été retirées.") : S("pages", "Pages", "done", `${live.length} page(s) en brouillon.`))
    : run && run.status === "proposed" ? S("pages", "Pages", "review", "Proposition de pages à examiner et à appliquer.") : S("pages", "Pages", "notstarted", v && v.status === "validated" ? "Les pages ne sont pas encore générées." : "Validez d'abord le plan."));
  let druns = []; try { druns = designGen().listRuns(ctx, siteId); } catch { druns = []; }
  const lastD = druns.find((r) => r.id === p.links.designRun);
  out.push(lastD && lastD.status === "applied" ? S("design", "Design", "done", "Direction artistique appliquée.") : lastD && lastD.status !== "undone" ? S("design", "Design", "review", "Propositions à choisir.") : S("design", "Design", "notstarted", "Aucune direction artistique choisie."));
  const withSet = live.filter((x) => x.contentState !== "none"), applied = live.filter((x) => x.contentState === "applied");
  out.push(!live.length ? S("contents", "Contenus", "notstarted", "Générez d'abord les pages.")
    : applied.length === live.length && live.every((x) => x.placeholders === 0) ? S("contents", "Contenus", "done", "Textes appliqués sur toutes les pages.")
    : withSet.length || live.some((x) => x.placeholders === 0) ? S("contents", "Contenus", "review", `${applied.length}/${live.length} page(s) avec textes appliqués ; ${live.reduce((n, x) => n + x.placeholders, 0)} espace(s) réservé(s) restant(s).`) : S("contents", "Contenus", "inprogress", "Textes d'exemple à remplacer."));
  let needs = [], tasks = []; try { needs = aiMedia().listNeeds(ctx, siteId); tasks = aiMedia().listTasks(ctx, siteId, {}); } catch { /* module absent */ }
  const open = needs.filter((n) => ["needed"].includes(n.status)), running = tasks.filter((t) => ["queued", "running"].includes(t.status)), failed = tasks.filter((t) => t.status === "failed" && !needs.find((n) => n.key === t.needKey && ["assigned", "generated"].includes(n.status)));
  out.push(running.length ? S("media", "Images et médias", "inprogress", `${running.length} génération(s) en cours.`)
    : failed.length ? S("media", "Images et médias", "error", `${failed.length} génération(s) échouée(s).`)
    : !needs.length ? S("media", "Images et médias", "notstarted", live.length ? "Besoins visuels non analysés." : "Générez d'abord les pages.")
    : open.length ? S("media", "Images et médias", "review", `${open.length} image(s) manquante(s) ou à choisir.`) : S("media", "Images et médias", "done", "Tous les emplacements d'image sont pourvus."));
  out.push(!live.length ? S("preview", "Prévisualisation", "notstarted", "Aucune page à prévisualiser.") : p.approvals.previewed ? S("preview", "Prévisualisation", "done", "Site relu.") : S("preview", "Prévisualisation", "review", "À relire avant publication."));
  const pub = publishCheck(ctx, siteId, p, { pp: live });
  out.push(!live.length ? S("publish", "Publication", "notstarted", "Rien à publier.") : live.every((x) => x.status === "published" && !x.hasDraft) ? S("publish", "Publication", "done", "Pages en ligne.")
    : pub.blocking.length ? S("publish", "Publication", "error", `${pub.blocking.length} point(s) bloquant(s).`) : S("publish", "Publication", "review", "Prêt à publier."));
  return out;
}

// ---------- prévisualisation et publication ----------
function internalTargets(ctx, siteId) { return new Set(pagesLib().sitePages(ctx, siteId).map((x) => `/p/${x.slug}`)); }
function previewChecks(ctx, siteId, pp) {
  const targets = internalTargets(ctx, siteId), out = [];
  for (const x of pp) {
    const pg = pagesLib().requirePage(ctx, x.pageId), secs = (pg.working || {}).sections || [];
    for (const s of secs) {
      for (const k of ["buttonUrl", "url", "link"]) {
        const u = s[k];
        if (typeof u === "string" && u.startsWith("/") && !["/catalogue", "/contact", "/connexion"].includes(u) && !u.startsWith("/p/") && !u.startsWith("/uploads/") && !u.startsWith("/blog") && !u.startsWith("/cours")) out.push({ page: x.name, level: "warning", code: "link_unknown", message: `Lien « ${u} » : destination non reconnue (à vérifier).` });
        if (typeof u === "string" && u.startsWith("/p/") && !targets.has(u)) out.push({ page: x.name, level: "error", code: "link_broken", message: `Lien vers « ${u} » : cette page n'existe pas.` });
      }
      for (const k of ["image", "src"]) {
        const u = s[k];
        if (typeof u === "string" && u.startsWith("/uploads/")) { const m = ctx.db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND path = ?").get(ctx.organizationId, u); if (!m) out.push({ page: x.name, level: "error", code: "image_missing", message: `Image « ${u} » introuvable dans la médiathèque.` }); }
      }
      if ((s.type === "hero" || s.type === "image") && !(s.image || s.src)) out.push({ page: x.name, level: "info", code: "no_image", message: s.type === "hero" ? "Bandeau sans image." : "Section image sans fichier." });
    }
    if (x.placeholders) out.push({ page: x.name, level: "warning", code: "placeholders", message: `${x.placeholders} espace(s) réservé(s) [ … ] restant(s) dans le texte.` });
  }
  return out;
}
function publishCheck(ctx, siteId, p, { pp = null } = {}) {
  const pages = pp || projectPages(ctx, siteId, p).filter((x) => !x.missing);
  const items = [], blocking = [], add = (level, key, label, ok, detail) => { const i = { key, label, ok, level, detail }; items.push(i); if (!ok && level === "error") blocking.push(i); };
  let v = null; try { v = p.planId ? plansLib().get(ctx, p.planId) : null; } catch { v = null; }
  add("error", "plan", "Plan du site validé", Boolean(v && v.status === "validated"), v && v.status === "validated" ? "Plan validé." : "Le plan doit être validé par la personne.");
  add("error", "pages", "Pages générées", pages.length > 0, pages.length ? `${pages.length} page(s).` : "Aucune page générée.");
  for (const x of pages) {
    let ready = { ready: true, errors: [] };
    try { const pg = pagesLib().requirePage(ctx, x.pageId); ready = require("../marketing/landing").preflight(ctx, { ...pg, sections: pagesLib().resolveSections(ctx, (pg.working || {}).sections || []) }); } catch (e) { ready = { ready: false, errors: [e.message] }; }
    add("error", `page-${x.pageId}`, `Page « ${x.name} » publiable`, ready.ready, ready.ready ? "Contrôles natifs réussis." : ready.errors.join(" "));
    add("warning", `seo-${x.pageId}`, `SEO de « ${x.name} »`, Boolean(x.seo.title && x.seo.description), x.seo.title && x.seo.description ? "Titre et description présents." : "Titre ou description SEO manquant.");
    add("warning", `texte-${x.pageId}`, `Textes de « ${x.name} »`, x.placeholders === 0, x.placeholders ? `${x.placeholders} espace(s) réservé(s) à remplacer.` : "Aucun espace réservé.");
  }
  let needs = []; try { needs = aiMedia().listNeeds(ctx, siteId); } catch { needs = []; }
  const missing = needs.filter((n) => n.status === "needed").length;
  add("warning", "images", "Images", missing === 0, missing ? `${missing} image(s) manquante(s) (la publication reste possible).` : "Emplacements pourvus (ou aucun besoin).");
  let druns = []; try { druns = designGen().listRuns(ctx, siteId); } catch { druns = []; }
  add("warning", "design", "Identité visuelle", druns.some((r) => r.status === "applied"), druns.some((r) => r.status === "applied") ? "Direction artistique appliquée." : "Aucune direction artistique appliquée (design par défaut).");
  const checks = previewChecks(ctx, siteId, pages);
  const broken = checks.filter((c) => c.level === "error");
  add("error", "liens", "Liens et images", broken.length === 0, broken.length ? broken.map((c) => c.message).join(" ") : "Aucun lien ou fichier cassé détecté.");
  items.push({ key: "mobile", label: "Version mobile", ok: null, level: "info", detail: "Non vérifiée automatiquement : relisez l'aperçu mobile." });
  items.push({ key: "domaine", label: "Domaine et paramètres de publication", ok: null, level: "info", detail: "Géré dans Domaines du site ; la publication n'ouvre pas de domaine." });
  return { items, blocking, warnings: items.filter((i) => i.ok === false && i.level === "warning"), canPublish: blocking.length === 0 && pages.length > 0, checks };
}
function publish(ctx, siteId, pid, { confirm = false } = {}) {
  const p = shape(row(ctx, siteId, pid));
  const chk = publishCheck(ctx, siteId, p);
  if (!chk.canPublish) throw new MarketingError("preflight_failed", `Publication impossible : ${chk.blocking.map((b) => b.detail).join(" ")}`);
  if (confirm !== true) throw bad("Confirmez explicitement la mise en ligne.", "confirm_required");
  const results = [];
  for (const x of projectPages(ctx, siteId, p).filter((y) => !y.missing)) {
    try { const r = pagesLib().publish(ctx, x.pageId); results.push({ pageId: x.pageId, name: x.name, ok: true, version: r.version }); }
    catch (e) { results.push({ pageId: x.pageId, name: x.name, ok: false, error: e.message }); }
  }
  log(ctx, pid, { kind: "system", text: `Publication : ${results.filter((r) => r.ok).length}/${results.length} page(s).` });
  return { results };
}
function approve(ctx, siteId, pid, key, value = true) {
  if (!["previewed"].includes(key)) throw bad("Validation inconnue.");
  const r = row(ctx, siteId, pid), a = json(r.approvals, {});
  a[key] = value ? new Date().toISOString() : undefined;
  return shape(touch(ctx, r, { approvals: JSON.parse(JSON.stringify(a)) }));
}

// ---------- journal, annuler, rétablir ----------
function events(ctx, siteId, pid, { limit = 60 } = {}) {
  const r = row(ctx, siteId, pid);
  return ctx.db.prepare("SELECT id, kind, role, text, status, created_at, payload FROM mk_aib_events WHERE project_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?").all(r.id, ctx.organizationId, Math.min(Math.max(limit, 1), 200)).reverse()
    .map((e) => { const pl = json(e.payload, {}); return { id: e.id, kind: e.kind, role: e.role, text: e.text, status: e.status, at: e.created_at, change: e.kind === "change" ? pl.kind : undefined, proposal: pl.proposal || undefined }; });
}
function undo(ctx, siteId, pid, { can } = {}) {
  const r = row(ctx, siteId, pid), p = shape(r);
  const e = ctx.db.prepare("SELECT * FROM mk_aib_events WHERE project_id = ? AND kind = 'change' AND status = 'done' ORDER BY id DESC LIMIT 1").get(r.id);
  if (!e) throw bad("Aucune modification à annuler.", "nothing_to_undo");
  const pl = json(e.payload, {});
  if (!UNDOABLE.has(pl.kind)) throw bad(pl.kind === "media-first" ? "Une première image associée à un emplacement ne s'annule pas ici : retirez-la dans l'éditeur de la page, ou remplacez-la (le remplacement, lui, s'annule)." : "Cette modification ne peut pas être annulée ici.", "undo_unsupported");
  let detail = "";
  transaction(ctx.db, () => {
    if (pl.kind === "plan") restorePlan(ctx, pl.planId, pl.before);
    else if (pl.kind === "pagegen") detail = JSON.stringify(pageGen().undo(ctx, siteId, pl.run));
    else if (pl.kind === "design") designGen().undo(ctx, siteId, pl.run, { can: can || (() => true), userId: ctx.userId ?? null });
    else if (pl.kind === "content") contentGen().unapply(ctx, siteId, pl.setId);
    else if (pl.kind === "media") aiMedia().restore(ctx, siteId, pl.needKey, { confirm: true });
    ctx.db.prepare("UPDATE mk_aib_events SET status = 'undone' WHERE id = ?").run(e.id);
  });
  return { undone: { id: e.id, text: e.text, kind: pl.kind }, detail };
}
function redo(ctx, siteId, pid) {
  const r = row(ctx, siteId, pid);
  const e = ctx.db.prepare("SELECT * FROM mk_aib_events WHERE project_id = ? AND kind = 'change' AND status = 'undone' ORDER BY id DESC LIMIT 1").get(r.id);
  if (!e) throw bad("Rien à rétablir.", "nothing_to_redo");
  const pl = json(e.payload, {});
  if (pl.kind !== "plan") throw bad("Seules les modifications du plan peuvent être rétablies ; pour les autres, relancez l'action.", "redo_unsupported");
  restorePlan(ctx, pl.planId, pl.after);
  ctx.db.prepare("UPDATE mk_aib_events SET status = 'done' WHERE id = ?").run(e.id);
  return { redone: { id: e.id, text: e.text } };
}

// ---------- état complet ----------
function state(ctx, siteId, pid) {
  const r = row(ctx, siteId, pid), p = shape(r);
  const s = steps(ctx, siteId, p);
  const done = s.filter((x) => x.status === "done").length;
  let tasks = []; try { tasks = aiMedia().listTasks(ctx, siteId, {}).filter((t) => ["queued", "running", "failed"].includes(t.status)).slice(0, 10).map((t) => ({ id: t.id, needKey: t.needKey, status: t.status, error: t.status === "failed" ? t.error : "" })); } catch { tasks = []; }
  return { project: p, steps: s, progress: { done, total: s.length, running: s.filter((x) => x.status === "inprogress").length, review: s.filter((x) => x.status === "review").map((x) => x.key), failed: s.filter((x) => x.status === "error").map((x) => x.key), tasks }, canUndo: Boolean(ctx.db.prepare("SELECT 1 FROM mk_aib_events WHERE project_id = ? AND kind = 'change' AND status = 'done' LIMIT 1").get(r.id)), canRedo: Boolean(ctx.db.prepare("SELECT 1 FROM mk_aib_events WHERE project_id = ? AND kind = 'change' AND status = 'undone' AND payload LIKE '%\"kind\":\"plan\"%' LIMIT 1").get(r.id)) };
}

module.exports = { STEPS, DRAFT_KEYS, siteOf, row, shape, log, createProject, archiveProject, listProjects, saveDraft, analyze, answer, planify, editPlan, validatePlan, generatePages, applyPages, undoPages, projectPages, generateDesign, designCompare, applyDesign, undoDesign, contentContext, generateContent, applyContent, mediaState, mediaStart, mediaAssign, steps, publishCheck, previewChecks, publish, approve, events, undo, redo, state, planView };
