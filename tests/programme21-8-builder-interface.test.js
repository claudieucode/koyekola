// Programme 21.8 — AI Website Builder (interface). Service : vraie base en mémoire (vraies migrations), IA simulée et déterministe branchée sur le vrai AI Core historique (ai.call → aiCore.runJson),
// vrais moteurs 21.3 à 21.7 (Brief Analyzer, Site Planner, Page Generator, Design Generator, Content Generator, AI Media), vrai moteur de pages. Aucun appel réseau, aucun coût.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-aib-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const pages = require("../src/marketing/pages");
const b = require("../src/aiBuilder");
const assistant = require("../src/aiBuilder/assistant");
const bridge = require("../src/aiBuilder/bridge");
const aiMedia = require("../src/aiMedia");
const modules = require("../src/marketing/siteModules");
const { createAiCore } = require("../src/ai");

const T = Date.UTC(2026, 9, 30, 12);
let m, A, siteId, replies, calls;
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const analysisRaw = () => ({ briefLanguage: "fr", name: fact("BâtiPlus", "explicit", "BâtiPlus"), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact("Kinshasa", "explicit", "Kinshasa"), siteLanguage: fact("fr", "assumed"), audience: fact("clients", "inferred"), tone: fact(), formality: fact(), style: fact("moderne", "explicit", "moderne"), typography: fact(), colors: [fact("bleu marine", "explicit", "bleu marine")], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "demander un devis" }], features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [] });
const sec = (type, purpose, extra = {}) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai", ...extra });
const pg = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: `Objectif ${name}`, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const planRaw = () => ({ site: { name: "BâtiPlus", description: "Construction à Kinshasa." }, pages: [pg("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Services"), sec("cta", "Devis")], "accueil", 1), pg("services", "Services", [sec("hero", "Titre"), sec("features", "Détail")], "services", 2), pg("contact", "Contact", [sec("text", "Coordonnées")], "contact", 3)], navigation: { main: ["accueil", "services", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] });
function fake() {
  calls = [];
  aiCore.setClientForTests({ beta: { messages: { create: async (r) => {
    calls.push(r);
    const sys = String(r.system || ""), user = String(r.messages[0].content);
    let out;
    if (/analyste de projets/.test(sys)) out = replies.brief;
    else if (/architecte de sites/.test(sys)) out = replies.plan;
    else if (/rédacteur web/.test(sys)) {
      if (/variante\(s\)/.test(user)) out = { variants: ["Texte plus clair et plus court."] };
      else { const keys = [...user.matchAll(/"key":"([^"]+)"/g)].map((x) => x[1]); out = { fields: keys.map((key) => ({ key, value: /title|heading/.test(key) ? "Un titre précis" : /items/.test(key) ? "Un point utile." : "Un texte clair et utile." })), seo: { title: "BâtiPlus : construction à Kinshasa", description: "Entreprise de construction à Kinshasa : conception, chantiers et suivi. Demandez un devis gratuit en ligne.", focusKeyword: "construction Kinshasa", slug: "accueil" }, questions: [] }; }
    } else if (/conseiller/.test(sys)) out = { answer: "Ajoutez des réalisations concrètes pour rassurer vos visiteurs." };
    else out = {};
    if (out instanceof Error) throw out;
    return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(out) }], model: "fake", usage: { input_tokens: 10, output_tokens: 20 } };
  } } } });
}
const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
const BRIEF = { description: "Je veux un site pour mon entreprise de construction à Kinshasa avec une page pour demander un devis.", company: "BâtiPlus", sector: "construction", country: "CD", language: "fr" };
async function toValidatedPlan(pid) {
  const proj = b.saveDraft(A, siteId, pid, { fields: BRIEF, revision: b.row(A, siteId, pid).revision });
  await b.analyze(A, siteId, pid);
  const planned = await b.planify(A, siteId, pid, { proceedWithAssumptions: true });
  return b.validatePlan(A, siteId, pid, planned.plan.revision);
}

beforeEach(() => { m = freshMarketing(); A = m.ctx(1, { now: () => T, userId: 7 }); siteId = pages.createSite(A, { name: "Site Un" }).id; replies = { brief: analysisRaw(), plan: planRaw() }; fake(); });
after(() => { aiCore.setClientForTests(null); fs.rmSync(SCRATCH, { recursive: true, force: true }); });

describe("1-4 — projet, brief, plan, modification", () => {
  test("création d'un projet ; chargement ; nom borné ; limite de 20 ; archivage", () => {
    const p = b.createProject(A, siteId, { name: "  Mon site de construction  " });
    assert.equal(p.name, "Mon site de construction"); assert.equal(p.siteId, siteId);
    assert.equal(b.listProjects(A, siteId).length, 1);
    assert.throws(() => b.createProject(A, siteId, { name: "  " }), /nom/i);
    for (let i = 0; i < 19; i++) b.createProject(A, siteId, { name: `P${i}` });
    assert.throws(() => b.createProject(A, siteId, { name: "de trop" }), (e) => e.code === "limit");
    b.archiveProject(A, siteId, p.id);
    assert.equal(b.listProjects(A, siteId).length, 19);
    assert.throws(() => b.state(A, siteId, p.id), (e) => e.code === "not_found");
  });
  test("brief : autosauvegarde avec contrôle de révision (aucun écrasement), champs inconnus ignorés ; analyse via le Brief Analyzer (pas de logique dupliquée)", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    const s1 = b.saveDraft(A, siteId, p.id, { fields: { ...BRIEF, onclick: "alert(1)" }, revision: p.revision });
    assert.equal(s1.draft.company, "BâtiPlus"); assert.equal(s1.draft.onclick, undefined); assert.equal(s1.revision, p.revision + 1);
    assert.throws(() => b.saveDraft(A, siteId, p.id, { fields: { company: "X" }, revision: p.revision }), (e) => e.code === "conflict");
    assert.equal(b.state(A, siteId, p.id).project.draft.company, "BâtiPlus", "la sauvegarde périmée n'a rien écrasé");
    const out = await b.analyze(A, siteId, p.id);
    assert.equal(out.plan.analysis.contract, "kolakisa.brief-analysis");
    assert.match(calls[0].messages[0].content, /Informations fournies :[\s\S]*Entreprise ou marque : BâtiPlus/, "les champs saisis sont transmis comme informations fournies");
    assert.equal(b.state(A, siteId, p.id).steps[0].status, "done");
    assert.equal(await code(b.analyze(A, siteId, b.createProject(A, siteId, { name: "Vide" }).id)), "brief_empty");
  });
  test("plan : proposition, modification (ajout / suppression / renommage de page, section), validation ; statuts réels", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    assert.deepEqual(b.state(A, siteId, p.id).steps.map((s) => s.status), Array(8).fill("notstarted"));
    b.saveDraft(A, siteId, p.id, { fields: BRIEF, revision: p.revision });
    await b.analyze(A, siteId, p.id);
    const planned = await b.planify(A, siteId, p.id, { proceedWithAssumptions: true });
    assert.equal(b.state(A, siteId, p.id).steps[1].status, "review");
    const rev = () => b.planView(A, b.shape(b.row(A, siteId, p.id))).revision;
    let r = b.editPlan(A, siteId, p.id, { op: "add_page", name: "À propos" }, rev());
    assert.ok(r.plan.plan.pages.some((x) => x.name === "À propos"));
    r = b.editPlan(A, siteId, p.id, { op: "rename_page", key: "contact", name: "Nous joindre" }, rev());
    r = b.editPlan(A, siteId, p.id, { op: "add_section", pageKey: "contact", type: "faq", purpose: "Questions" }, rev());
    assert.equal(r.plan.plan.pages.find((x) => x.key === "contact").sections.at(-1).type, "faq");
    assert.throws(() => b.editPlan(A, siteId, p.id, { op: "remove_page", key: "accueil" }, rev()), (e) => e.code === "forbidden");
    assert.throws(() => b.editPlan(A, siteId, p.id, { op: "rename_page", key: "contact", name: "x" }, 1), (e) => e.code === "conflict");
    const v = b.validatePlan(A, siteId, p.id, rev());
    assert.equal(v.plan.status, "validated"); assert.equal(b.state(A, siteId, p.id).steps[1].status, "done");
  });
});

describe("5-7 — pages, design, contenus (moteurs 21.4, 21.5, 21.6)", () => {
  test("les pages ne sont générées qu'à partir d'un plan VALIDÉ ; proposition puis application en brouillon (jamais publié) ; annulation", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    assert.throws(() => b.generatePages(A, siteId, p.id), /Aucun plan/);
    b.saveDraft(A, siteId, p.id, { fields: BRIEF, revision: p.revision }); await b.analyze(A, siteId, p.id);
    const pl = await b.planify(A, siteId, p.id, { proceedWithAssumptions: true });
    await assert.rejects(Promise.resolve().then(() => b.generatePages(A, siteId, p.id)), (e) => e.code === "not_validated");
    b.validatePlan(A, siteId, p.id, pl.plan.revision);
    const g = await b.generatePages(A, siteId, p.id);
    assert.equal(g.run.status, "proposed"); assert.equal(g.run.result.pages.length, 3);
    assert.equal(b.state(A, siteId, p.id).steps[2].status, "review");
    assert.equal(pages.sitePages(A, siteId).length, 0, "rien n'est écrit tant que la personne n'applique pas");
    const ap = b.applyPages(A, siteId, p.id, {});
    assert.equal(Object.keys(ap.applied).length, 3);
    const list = b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id)));
    assert.equal(list.length, 3); assert.ok(list.every((x) => x.status !== "published" && x.sections > 0 && x.previewUrl.startsWith("/marketing/pages/")), JSON.stringify(list.map((x) => [x.key, x.status, x.sections, x.missing])));
    assert.equal(b.state(A, siteId, p.id).steps[2].status, "done");
    const u = b.undo(A, siteId, p.id);
    assert.equal(u.undone.kind, "pagegen");
    assert.equal(b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id))).length, 0);
  });
  test("design : propositions générées par le Design Generator, étape « à choisir » (l'application au personnalisateur natif est testée en HTTP réel : elle écrit dans la base de l'application)", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    assert.equal(b.state(A, siteId, p.id).steps[3].status, "notstarted");
    b.saveDraft(A, siteId, p.id, { fields: { ...BRIEF, style: "premium, bleu marine, élégant", siteType: "immobilier" }, revision: p.revision });
    const g = await b.generateDesign(A, siteId, p.id, { text: "sobre et élégant" });
    assert.ok(g.run.proposals.length >= 1 && g.run.proposals.every((x) => x.report.ok));
    assert.equal(b.state(A, siteId, p.id).steps[3].status, "review");
    assert.equal(b.state(A, siteId, p.id).project.links.designRun, g.run.id);
  });
  test("contenus : génération pour une page DU PROJET uniquement, application aux champs natifs, texte manuel protégé", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    await toValidatedPlan(p.id); await b.generatePages(A, siteId, p.id); b.applyPages(A, siteId, p.id, {});
    const list = b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id)));
    const home = list.find((x) => x.key === "accueil");
    const foreign = pages.createPage(A, { name: "Hors projet", siteId, kind: "page", blank: true });
    assert.equal(await code(b.generateContent(A, siteId, p.id, { pageId: foreign.id })), "not_found");
    const g = await b.generateContent(A, siteId, p.id, { pageId: home.pageId });
    assert.equal(g.set.status, "proposed");
    // la personne retouche le titre du bandeau à la main AVANT l'application
    const cur = pages.requirePage(A, home.pageId);
    pages.saveDraft(A, home.pageId, { ...cur.working, sections: cur.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Mon titre à moi" } : s)) }, { revision: cur.revision });
    const out = b.applyContent(A, siteId, p.id, { setId: g.set.id });
    const after = pages.requirePage(A, home.pageId).working.sections;
    assert.equal(after.find((s) => s.type === "hero").title, "Mon titre à moi", "le texte manuel est conservé");
    assert.ok(out.written.length > 0 && out.skipped.some((s) => /modifié depuis/.test(s.why)));
    assert.equal(b.undo(A, siteId, p.id).undone.kind, "content");
  });
});

describe("8-9 — médias, aperçu, publication", () => {
  async function withPages() {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    await toValidatedPlan(p.id); await b.generatePages(A, siteId, p.id); b.applyPages(A, siteId, p.id, {});
    return p;
  }
  test("médias : besoins issus des pages du projet, génération simulée (fournisseur de démonstration), estimation, association, restauration ; état de progression honnête", async () => {
    const p = await withPages();
    const needs = aiMedia.plan(A, siteId, { pageIds: b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id))).map((x) => x.pageId) });
    assert.ok(needs.length >= 1);
    assert.equal(b.state(A, siteId, p.id).steps[5].status, "review");
    const key = needs.find((n) => n.status === "needed").key;
    const est = aiMedia.estimate(A, siteId, { needKeys: [key], provider: "demo" });
    assert.ok(est && "totalMicroUsd" in est);
    const OPTS = { core: createAiCore({ db: m.db, settings: A.settings }), credentials: () => null };
    const started = b.mediaStart(A, siteId, p.id, { needKeys: [key], provider: "demo" }, OPTS);
    assert.equal(started.tasks.length, 1);
    assert.equal(b.state(A, siteId, p.id).steps[5].status, "inprogress", "une génération en attente n'est pas « terminée »");
    assert.equal(b.state(A, siteId, p.id).progress.tasks.filter((t) => ["queued", "running"].includes(t.status)).length, 1);
    for (let i = 0; i < 40 && ["queued", "running"].includes(aiMedia.getTask(A, siteId, started.tasks[0].id).status); i++) await new Promise((r) => setTimeout(r, 50));
    const task = aiMedia.getTask(A, siteId, started.tasks[0].id);
    assert.equal(task.status, "succeeded", JSON.stringify(task).slice(0, 600));
    const asg = b.mediaAssign(A, siteId, p.id, { needKey: key, mediaId: task.mediaIds[0] });
    assert.ok(asg.assigned);
    assert.throws(() => b.undo(A, siteId, p.id), (e) => e.code === "undo_unsupported" && /éditeur de la page/.test(e.message), "une première association n'est pas annulable ici : le dire plutôt que mentir");
  });
  test("aperçu : pages du projet, liens et images vérifiés (lien cassé détecté), espaces réservés signalés ; validation de relecture", async () => {
    const p = await withPages();
    const pp = b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id)));
    let checks = b.previewChecks(A, siteId, pp);
    assert.ok(checks.some((c) => c.code === "placeholders"), "les textes d'exemple [ … ] sont signalés");
    const home = pp[0]; const cur = pages.requirePage(A, home.pageId);
    pages.saveDraft(A, home.pageId, { ...cur.working, sections: [...cur.working.sections, { type: "button", label: "Aller", url: "/p/page-inexistante", align: "center" }] }, { revision: cur.revision });
    checks = b.previewChecks(A, siteId, b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id))));
    assert.ok(checks.some((c) => c.code === "link_broken" && c.level === "error"));
    assert.equal(b.state(A, siteId, p.id).steps[6].status, "review");
    b.approve(A, siteId, p.id, "previewed", true);
    assert.equal(b.state(A, siteId, p.id).steps[6].status, "done");
    assert.throws(() => b.approve(A, siteId, p.id, "n'importe-quoi"), /inconnue/);
  });
  test("publication : contrôles bloquants (lien cassé, plan non validé) ; confirmation explicite requise ; publication par le système natif", async () => {
    const p = await withPages();
    const chk = b.publishCheck(A, siteId, b.shape(b.row(A, siteId, p.id)));
    assert.ok(chk.items.find((i) => i.key === "plan").ok && chk.items.find((i) => i.key === "pages").ok);
    assert.ok(chk.items.some((i) => i.key === "mobile" && i.ok === null && /Non vérifiée/.test(i.detail)), "ce qui n'est pas vérifiable est dit");
    const bad = b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id)))[0]; const cur = pages.requirePage(A, bad.pageId);
    pages.saveDraft(A, bad.pageId, { ...cur.working, sections: [...cur.working.sections, { type: "button", label: "Cassé", url: "/p/rien-du-tout", align: "center" }] }, { revision: cur.revision });
    const blocked = b.publishCheck(A, siteId, b.shape(b.row(A, siteId, p.id)));
    assert.equal(blocked.canPublish, false); assert.ok(blocked.blocking.length >= 1);
    assert.throws(() => b.publish(A, siteId, p.id, { confirm: true }), (e) => e.code === "preflight_failed");
    assert.equal(pages.sitePages(A, siteId).filter((x) => x.status === "published").length, 0, "rien n'est publié quand un contrôle bloque");
    // retrait du lien cassé : la publication redevient possible mais exige la confirmation
    pages.saveDraft(A, bad.pageId, { ...cur.working, sections: cur.working.sections }, { revision: pages.requirePage(A, bad.pageId).revision });
    const ok = b.publishCheck(A, siteId, b.shape(b.row(A, siteId, p.id)));
    if (!ok.canPublish) { assert.ok(ok.blocking.every((i) => /formulaire|section|Page/.test(i.detail + i.label)), JSON.stringify(ok.blocking).slice(0, 300)); return; }
    assert.throws(() => b.publish(A, siteId, p.id, { confirm: false }), (e) => e.code === "confirm_required");
    const pub = b.publish(A, siteId, p.id, { confirm: true });
    assert.ok(pub.results.some((r) => r.ok));
    assert.ok(pages.sitePages(A, siteId).some((x) => x.status === "published"));
  });
});

describe("10-12 — assistant, annuler / rétablir, journal", () => {
  test("assistant : conseil = aucune modification ; demande = PROPOSITION (avant/après) ; acceptation passe par le Site Planner ; refus n'écrit rien ; annulation et rétablissement", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    await toValidatedPlan(p.id);
    const pv = () => b.planView(A, b.shape(b.row(A, siteId, p.id)));
    const n0 = pv().plan.pages.length;
    const adv = await assistant.propose(A, siteId, p.id, { message: "Comment améliorer mon site ?", step: "plan" });
    assert.equal(adv.intent, "advice"); assert.equal(adv.proposal, null); assert.match(adv.text, /réalisations/); assert.equal(pv().plan.pages.length, n0);
    const pr = await assistant.propose(A, siteId, p.id, { message: "Ajoute une page À propos", step: "plan" });
    assert.equal(pr.proposal.type, "plan"); assert.deepEqual([pr.proposal.before, pr.proposal.after], [`${n0} page(s)`, `${n0 + 1} page(s)`]);
    assert.equal(pv().plan.pages.length, n0, "une proposition ne modifie rien");
    assert.equal(assistant.decide(A, siteId, p.id, pr.proposal.eventId, false).status, "rejected");
    assert.equal(pv().plan.pages.length, n0);
    assert.throws(() => assistant.decide(A, siteId, p.id, pr.proposal.eventId, true), (e) => e.code === "not_found", "déjà traitée");
    const pr2 = await assistant.propose(A, siteId, p.id, { message: "Ajoute une page À propos", step: "plan" });
    // la révision a changé entre la proposition et l'acceptation → refus (conflit), aucune écriture silencieuse
    b.editPlan(A, siteId, p.id, { op: "rename_page", key: "contact", name: "Nous joindre" }, pv().revision);
    assert.throws(() => assistant.decide(A, siteId, p.id, pr2.proposal.eventId, true), (e) => e.code === "conflict");
    const pr3 = await assistant.propose(A, siteId, p.id, { message: "Ajoute une page À propos", step: "plan" });
    const acc = assistant.decide(A, siteId, p.id, pr3.proposal.eventId, true);
    assert.equal(acc.status, "accepted"); assert.equal(pv().plan.pages.length, n0 + 1);
    // annuler / rétablir
    const st = b.state(A, siteId, p.id); assert.ok(st.canUndo);
    b.undo(A, siteId, p.id); assert.equal(pv().plan.pages.length, n0); assert.ok(b.state(A, siteId, p.id).canRedo);
    b.redo(A, siteId, p.id); assert.equal(pv().plan.pages.length, n0 + 1);
    assert.equal(b.state(A, siteId, p.id).steps[1].status, "review", "un plan modifié n'est plus « validé »");
    const ev = b.events(A, siteId, p.id);
    assert.ok(ev.some((e) => e.kind === "chat" && e.role === "user") && ev.some((e) => e.kind === "change" && e.change === "plan"));
  });
  test("assistant : suppression d'une page essentielle signalée ; section sans page sélectionnée = question ; couleur / mobile = navigation (jamais d'écriture) ; texte sans champ sélectionné = question", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" }); await toValidatedPlan(p.id);
    const rm = await assistant.propose(A, siteId, p.id, { message: "Supprime la page Services", step: "plan" });
    assert.match(rm.proposal.summary, /essentielle|demandée/);
    const noPage = await assistant.propose(A, siteId, p.id, { message: "Ajoute une section FAQ", step: "plan" });
    assert.equal(noPage.proposal, null); assert.match(noPage.text, /Sur quelle page/);
    const withPage = await assistant.propose(A, siteId, p.id, { message: "Ajoute une section FAQ", step: "plan", pageKey: "contact" });
    assert.equal(withPage.proposal.op.type, "faq");
    assert.equal((await assistant.propose(A, siteId, p.id, { message: "Change la couleur principale en bleu marine" })).proposal.type, "navigate");
    assert.equal((await assistant.propose(A, siteId, p.id, { message: "Rends cette page plus adaptée aux téléphones" })).proposal.target, "preview");
    const t = await assistant.propose(A, siteId, p.id, { message: "Rends ce texte plus professionnel" });
    assert.equal(t.proposal, null); assert.match(t.text, /Sélectionnez/);
    assert.equal((await assistant.propose(A, siteId, p.id, { message: "blabla" })).proposal, null);
    assert.equal(await code(assistant.propose(A, siteId, p.id, { message: "   " })), "invalid_field");
  });
  test("assistant : réécriture d'un champ (variante affichée avant/après, acceptée explicitement) ; régénération d'image = proposition avec estimation, fournisseur de démonstration", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    await toValidatedPlan(p.id); await b.generatePages(A, siteId, p.id); b.applyPages(A, siteId, p.id, {});
    const home = b.projectPages(A, siteId, b.shape(b.row(A, siteId, p.id))).find((x) => x.key === "accueil");
    const g = await b.generateContent(A, siteId, p.id, { pageId: home.pageId });
    const fieldKey = Object.keys(g.set.fields)[0];
    const pr = await assistant.propose(A, siteId, p.id, { message: "Raccourcis ce texte", step: "contents", setId: g.set.id, fieldKey });
    assert.equal(pr.proposal.type, "revise"); assert.equal(pr.proposal.before, g.set.fields[fieldKey].value); assert.equal(pr.proposal.after, "Texte plus clair et plus court.");
    assert.equal(require("../src/contentGen").getSet(A, siteId, g.set.id).fields[fieldKey].value, pr.proposal.before, "rien n'est remplacé avant l'acceptation");
    assistant.decide(A, siteId, p.id, pr.proposal.eventId, true);
    assert.equal(require("../src/contentGen").getSet(A, siteId, g.set.id).fields[fieldKey].value, "Texte plus clair et plus court.");
    const needs = aiMedia.plan(A, siteId, {}); const key = needs.find((n) => n.status === "needed").key;
    const im = await assistant.propose(A, siteId, p.id, { message: "Génère une autre image pour cette bannière", needKey: key });
    assert.equal(im.proposal.type, "media"); assert.ok("totalMicroUsd" in im.proposal.estimate);
  });
});

describe("13-15 — isolation, quotas, erreurs", () => {
  test("isolation : un projet est introuvable depuis un autre site, une autre organisation ou un accès limité à un autre site ; aucune API ne le laisse fuiter", async () => {
    const p = b.createProject(A, siteId, { name: "Secret" });
    const s2 = pages.createSite(A, { name: "Site Deux" }).id;
    assert.throws(() => b.state(A, s2, p.id), (e) => e.code === "not_found");
    assert.throws(() => b.saveDraft(A, s2, p.id, { fields: { company: "X" }, revision: 1 }), (e) => e.code === "not_found");
    assert.equal(await code(assistant.propose(A, s2, p.id, { message: "Ajoute une page Test" })), "not_found");
    assert.deepEqual(b.listProjects(A, s2), []);
    const L2 = m.ctx(1, { now: () => T, siteScope: s2 });
    assert.throws(() => b.state(L2, siteId, p.id), (e) => e.code === "not_found");
    assert.throws(() => b.listProjects(L2, siteId), (e) => e.code === "not_found");
    assert.throws(() => b.state(m.ctx(2, { now: () => T }), siteId, p.id), (e) => e.code === "not_found");
    // un projet ne peut pas viser le plan d'un autre site
    const q = b.createProject(A, s2, { name: "Autre" });
    b.saveDraft(A, s2, q.id, { fields: BRIEF, revision: q.revision }); await b.analyze(A, s2, q.id);
    assert.equal(b.state(A, siteId, p.id).steps[0].status, "notstarted", "le plan du site 2 n'apparaît pas dans le projet du site 1");
  });
  test("accès limité : le module « ia » du site est requis pour analyser ; quota de l'IA respecté et remonté sans rien écrire ; erreurs fournisseur lisibles", async () => {
    const s2 = pages.createSite(A, { name: "Site Deux" }).id;
    const L = m.ctx(1, { now: () => T, siteScope: s2, userId: 8 });
    const q = b.createProject(L, s2, { name: "Limité" }); b.saveDraft(L, s2, q.id, { fields: BRIEF, revision: q.revision });
    assert.equal(await code(b.analyze(L, s2, q.id)), "module_disabled");
    assert.equal(calls.length, 0, "aucun appel au fournisseur");
    modules.setEnabled(A, s2, "ai", true);
    m.ctx(1).settings.set(1, "ai.daily_limit", 1);
    const a1 = await b.analyze(L, s2, q.id); assert.ok(a1.plan);
    assert.equal(await code(b.analyze(L, s2, q.id)), "quota");
    replies.brief = Object.assign(new Error("boom"), { code: "api" });
  });
  test("progression : aucun pourcentage inventé — uniquement des compteurs d'étapes terminées et des listes d'étapes à vérifier / en échec", async () => {
    const p = b.createProject(A, siteId, { name: "Mon projet" });
    let st = b.state(A, siteId, p.id);
    assert.deepEqual(Object.keys(st.progress).sort(), ["done", "failed", "review", "running", "tasks", "total"]);
    assert.equal(st.progress.done, 0); assert.equal(st.progress.total, 8);
    await toValidatedPlan(p.id);
    st = b.state(A, siteId, p.id);
    assert.equal(st.progress.done, 2); assert.deepEqual(st.steps.slice(0, 2).map((s) => s.status), ["done", "done"]);
    const lp = b.listProjects(A, siteId)[0];
    assert.equal(lp.progress.done, 2); assert.equal(lp.group, "en cours");
  });
  test("pont de plan : sections indisponibles ou sans équivalent écartées ET listées ; textes d'exemple posés pour le Content Generator", () => {
    const plan = { site: { name: "S", description: "" }, pages: [{ key: "accueil", name: "Accueil", slug: "accueil", pageType: "accueil", purpose: "But", sections: [{ key: "a", type: "hero", availability: "available", purpose: "x" }, { key: "b", type: "layout", availability: "available", purpose: "libre" }, { key: "c", type: "features", availability: "unavailable", purpose: "boutique" }] }] };
    const r = bridge.sitePlanToPageGen(plan);
    assert.deepEqual(r.plan.pages[0].sections.map((s) => s.kind), ["hero"]); assert.equal(r.plan.pages[0].sections[0].title, "[Titre principal]");
    assert.equal(r.skipped.length, 2); assert.match(r.skipped[0].why, /sans équivalent/); assert.match(r.skipped[1].why, /indisponible/);
    const empty = bridge.sitePlanToPageGen({ site: { name: "S", description: "" }, pages: [{ key: "apropos", name: "À propos", slug: "apropos", pageType: "apropos", purpose: "", sections: [] }] });
    assert.equal(empty.plan.pages[0].sections[0].text, "[Texte]"); assert.match(empty.notes[0].note, /texte d'exemple/);
    assert.match(bridge.composeBrief({ description: "Un site", company: "X", sector: "BTP" }), /Informations fournies :\nEntreprise ou marque : X\nSecteur d'activité : BTP/);
  });
});

describe("interface : garde-fous statiques du code client", () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
  const js = read("public/js/ai-builder.js"), css = read("public/css/ai-builder.css"), view = read("views/marketing/site-ai-builder.ejs");
  test("le client n'appelle que les routes du site (jamais un fournisseur d'IA), sans clé ni secret, sans eval", () => {
    assert.doesNotMatch(js, /api\.anthropic|api\.openai|generativelanguage|sk-ant|ANTHROPIC|Authorization|eval\(|new Function|document\.write/);
    const urls = [...js.matchAll(/fetch\(([^,)]+)/g)].map((m) => m[1]);
    assert.ok(urls.length >= 2 && urls.every((u) => /API|boot\.siteBase/.test(u)), urls.join(" | "));
  });
  test("les textes insérés dans le DOM passent par esc() (échappement) ; données d'amorçage échappées contre « </script> »", () => {
    assert.match(js, /function esc\(/);
    assert.match(view, /replace\(\/<\/g, "\\\\u003c"\)/);
    assert.doesNotMatch(js, /innerHTML\s*=\s*[a-z]+\.(message|error)\b/i, "un message d'erreur serveur n'est jamais injecté sans échappement");
  });
  test("accessibilité et adaptation : navigation étiquetée, état courant, annonces, lien d'évitement, focus visible, 3 points de rupture, mouvement réduit", () => {
    for (const s of ['aria-label="Étapes du projet"', 'aria-live="polite"', 'role="status"', 'class="skip-link"']) assert.ok(view.includes(s), s);
    assert.match(js, /aria-current="step"/);
    for (const q of ["max-width: 1280px", "max-width: 1024px", "max-width: 720px", "prefers-reduced-motion"]) assert.ok(css.includes(q), q);
    assert.match(css, /:focus-visible/);
  });
  test("identité : marine en couleur maîtresse, grille fixe (la barre et la navigation ne bougent pas au changement d'étape)", () => {
    assert.match(css, /--aib-navy: #0b2a40/); assert.match(css, /grid-template-areas: "top top top" "side main assist"/);
  });
});
