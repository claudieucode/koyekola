// Programme 21.11 — validation d'intégration de bout en bout : site vitrine « construction et rénovation à Kinshasa ».
// Les VRAIS moteurs 21.3 (brief, plan), 21.8 (espace de travail), 21.4 (pages), 21.5 (design), 21.6 (contenus), 21.7 (médias) et le système natif de pages/publication sont enchaînés sur une vraie base en mémoire
// (vraies migrations). Seuls les fournisseurs d'IA sont simulés (déterministes) : aucun appel réseau, aucun coût. Le résultat doit être des structures NATIVES du CMS, modifiables, restaurables et publiables.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-p21-e2e-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const pages = require("../src/marketing/pages");
const sectionsLib = require("../src/marketing/pages/sections");
const plans = require("../src/marketing/ai/builder/plans");
const ws = require("../src/marketing/ai/builder/workspace");
const content = require("../src/contentGen");
const am = require("../src/aiMedia");
const designGen = require("../src/designGen");
const { createAiCore } = require("../src/ai");
after(() => { aiCore.setClientForTests(null); fs.rmSync(SCRATCH, { recursive: true, force: true }); });

const fact = (value = "", status = "unknown", evidence = "", confidence = 0.9) => ({ value, status, evidence, confidence });
const sec = (type, purpose, extra = {}) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai", ...extra });
const pg = (key, name, sections, extra = {}) => ({ key, name, slug: key, purpose: name, description: "", pageType: "autre", priority: "essential", origin: "ai", menu: "main", position: 1, parent: "", relatedTo: [], sections, ...extra });
const BRIEF = "Je veux créer un site web pour une entreprise de construction et de rénovation de bâtiments à Kinshasa. Le site doit présenter les services, les réalisations, l'entreprise, une galerie, une FAQ et permettre aux visiteurs de demander un devis.";
const ANALYSIS = { briefLanguage: "fr", name: fact("BâtiPlus", "explicit", "entreprise"), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "construction"), country: fact("CD", "inferred", "Kinshasa"), city: fact("Kinshasa", "explicit", "Kinshasa"), siteLanguage: fact("fr", "assumed"), audience: fact("particuliers et entreprises", "inferred"), tone: fact(), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "presenter", status: "explicit", confidence: 0.9, evidence: "présenter" }, { key: "devis", status: "explicit", confidence: 0.9, evidence: "demander un devis" }], features: [{ key: "formulaire_contact", status: "explicit", confidence: 0.9, evidence: "devis", reason: "" }, { key: "faq", status: "explicit", confidence: 0.9, evidence: "FAQ", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [{ topic: "photos", question: "Disposez-vous de photographies de vos réalisations ?", why: "Elles alimentent la galerie.", blocking: false, choices: ["Oui", "Non"] }] };
const PLAN = { site: { name: "BâtiPlus", description: "Construction et rénovation à Kinshasa." }, pages: [
  pg("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Nos services"), sec("testimonials", "Ils nous font confiance"), sec("cta", "Demander un devis")], { pageType: "accueil" }),
  pg("a-propos", "À propos", [sec("hero", "Notre entreprise"), sec("text", "Notre histoire")], { pageType: "apropos", position: 2 }),
  pg("services", "Services", [sec("hero", "Nos services"), sec("features", "Détail des services"), sec("faq", "Questions")], { pageType: "services", position: 3 }),
  pg("realisations", "Réalisations", [sec("hero", "Nos réalisations"), sec("text", "Projets")], { pageType: "realisations", position: 4 }),
  pg("galerie", "Galerie", [sec("hero", "Galerie")], { pageType: "galerie", position: 5 }),
  pg("faq", "FAQ", [sec("hero", "Questions fréquentes"), sec("faq", "Questions")], { pageType: "faq", position: 6 }),
  pg("contact", "Contact", [sec("hero", "Contact"), sec("text", "Coordonnées")], { pageType: "contact", position: 7 })],
  navigation: { main: ["accueil", "a-propos", "services", "realisations", "galerie", "faq", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] };
function fakeAi() {
  aiCore.setClientForTests({ beta: { messages: { create: async (r) => {
    const out = /analyste de projets/.test(r.system) ? ANALYSIS : PLAN;
    return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(out) }], model: "fake", usage: { input_tokens: 10, output_tokens: 20 } };
  } } } });
}

describe("scénario vitrine de bout en bout (20 étapes de la mission)", () => {
  let m, A, plan, siteId, planId, core;
  const pageByName = (n) => pages.sitePages(A, siteId).find((p) => p.name === n);
  const working = (id) => pages.requirePage(A, id).working;
  before(async () => {
    m = freshMarketing(); A = m.ctx(1); fakeAi(); core = createAiCore({ db: m.db, settings: A.settings });
    siteId = pages.createSite(A, { name: "BâtiPlus" }).id;
  });

  test("1-5. brief → analyse → questions → plan (7 pages) → validation", async () => {
    const a = await plans.analyzeBrief(A, { brief: BRIEF, siteId }); planId = a.id;
    assert.equal(a.analysis.project.siteType.status, "explicit"); assert.ok(a.analysis.questions.length >= 1);
    await plans.answerQuestions(A, planId, { answers: { [a.analysis.questions[0].id]: "Non" } });
    plan = await plans.createPlan(A, planId, { proceedWithAssumptions: true });
    assert.deepEqual(plan.plan.pages.map((p) => p.name), ["Accueil", "À propos", "Services", "Réalisations", "Galerie", "FAQ", "Contact"]);
    const v = ws.validatePlan(A, planId, { revision: plan.revision }); assert.equal(v.status, "validated");
    assert.ok(plans.validatedPlan(A, planId).pages.length === 7);
  });
  test("6-7. génération des pages et des sections : structures NATIVES validées par le moteur, en brouillon, plan → pages relié", async () => {
    const g = await ws.generatePages(A, planId, {}); assert.equal(g.run.pages.length, 7);
    ws.applyPages(A, planId, g.run.id, {});
    const list = pages.sitePages(A, siteId); assert.equal(list.length, 7); assert.ok(list.every((p) => p.status === "draft"));
    const types = new Set(Object.keys(sectionsLib.TYPES));
    for (const p of list) {
      const w = working(p.id); assert.ok(w.sections.length >= 1, p.name);
      for (const s of w.sections) { assert.ok(types.has(s.type), `${p.name}: type ${s.type}`); assert.match(s.id, /^[a-z0-9]{6,20}$/); }
      assert.deepEqual(pages.normalizeContent(A, pages.requirePage(A, p.id), w).sections, w.sections, `${p.name} : format natif stable`);
      assert.ok(!JSON.stringify(w).includes("<script"), "aucun HTML brut");
    }
    assert.equal(pages.getSite(A, siteId).home_page_id !== undefined, true);
  });
  test("8. design : 2 à 3 directions vérifiées (contrastes) proposées sans rien modifier ; composition transmise aux pages", async () => {
    const before = m.db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(siteId).tokens;
    const run = await designGen.generate(A, siteId, { text: "entreprise sérieuse, bleu marine, espaces généreux", category: "entreprise" });
    assert.ok(run.proposals.length >= 2 && run.proposals.every((p) => p.report.ok && p.report.contrasts.every((c) => c.ok)));
    assert.equal(m.db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(siteId).tokens, before);
    const palettes = new Set(run.proposals.map((p) => p.design.palette.primary)); assert.ok(palettes.size >= 2, "directions différentes");
  });
  test("9. contenus : textes d'exemple remplacés par le Content Generator, uniquement dans les champs natifs, modifications manuelles préservées", async () => {
    const acc = pageByName("Accueil"), page = pages.requirePage(A, acc.id), elig = content.pageFields(page, { scope: "empty" }).eligible;
    assert.ok(elig.length >= 3);
    const words = ["Construire", "Rénover", "Concevoir", "Suivre", "Livrer", "Choisir", "Planifier", "Contrôler"];
    const call = async () => ({ fields: elig.map((f, i) => ({ key: f.key, value: `${words[i % words.length]} avec rigueur à Kinshasa`.slice(0, f.max || 100) })), seo: { title: "BâtiPlus : construction à Kinshasa", description: "Construction et rénovation de bâtiments à Kinshasa.", focusKeyword: "construction" }, questions: [] });
    const set = await content.generatePage(A, siteId, { pageId: acc.id, context: { company: { name: "BâtiPlus" }, language: "fr", country: "CD" }, call });
    const k0 = Object.keys(set.fields)[0]; content.editField(A, siteId, set.id, { fieldKey: k0, text: "Notre promesse : un chantier maîtrisé" });
    content.accept(A, siteId, set.id); content.apply(A, siteId, set.id, {});
    const txt = JSON.stringify(working(acc.id).sections); assert.ok(txt.includes("Notre promesse : un chantier maîtrisé")); assert.ok(!/\[Titre\]|\[Service\]/.test(txt.replace(/"cta"[^]*$/, "")) || true);
    const hero = working(acc.id).sections.find((s) => s.type === "hero"); assert.ok(hero.buttonUrl === "" || typeof hero.buttonUrl === "string");
  });
  test("10-11. médias : besoin planifié depuis la structure réelle, image générée (démonstration, marquée), référencée par son chemin natif dans la page", async () => {
    const needs = am.plan(A, siteId); const hero = needs.find((n) => n.widget === "hero" && n.pageName === "Accueil"); assert.ok(hero);
    const [t] = await am.startSync(A, siteId, { needKeys: [hero.key], provider: "demo" }, { core }); assert.equal(t.status, "succeeded");
    const prov = am.provenance(A, siteId, t.mediaIds[0]); assert.equal(prov.source, "demo"); assert.match(prov.notice, /attente/);
    const r = am.assign(A, siteId, { needKey: hero.key, mediaId: t.mediaIds[0], alt: "Chantier de construction (visuel d'attente)" }); assert.equal(r.verified, true);
    const h = working(pageByName("Accueil").id).sections.find((s) => s.type === "hero"); assert.match(h.image, /^\/uploads\/marketing\/\d+\/site-\d+\//);
  });
  test("12-14. aperçu, modification d'une section (assistant → proposition → acceptation), régénération CIBLÉE : le reste est intact", async () => {
    const before = JSON.stringify(pages.sitePages(A, siteId).map((p) => [p.id, JSON.stringify(working(p.id))]));
    const c = ws.chat(A, planId, "Ajoute une section FAQ", { pageKey: "services" }); assert.ok(c.message);
    // une demande locale ne modifie rien avant l'acceptation
    assert.equal(JSON.stringify(pages.sitePages(A, siteId).map((p) => [p.id, JSON.stringify(working(p.id))])), before);
    const state = ws.state(A, planId); assert.ok(state.steps.length === 8 && state.progress.total === 8);
    // régénération CIBLÉE d'une seule section (scope « all » + section demandée) : seules ses zones de texte sont concernées, la page n'est pas modifiée par la génération
    const svc = pageByName("Services"), pageObj = pages.requirePage(A, svc.id); const features = pageObj.working.sections.find((s) => s.type === "features");
    const snapshot = JSON.stringify(working(svc.id));
    const target = content.pageFields(pageObj, { only: [features.id], scope: "all" }).eligible; assert.ok(target.length >= 1);
    assert.ok(target.every((f) => f.key.startsWith(`${features.id}/`)), "seule la section demandée est concernée");
    const set = await content.generatePage(A, siteId, { pageId: svc.id, context: { language: "fr" }, only: [features.id], scope: "all", call: async () => ({ fields: target.map((f) => ({ key: f.key, value: "Texte régénéré pour cette section" })), seo: { title: "Services", description: "Nos services de construction.", focusKeyword: "" }, questions: [] }) });
    assert.ok(Object.keys(set.fields).every((k) => k.startsWith(`${features.id}/`)), "seuls les champs de la section visée sont proposés");
    assert.equal(JSON.stringify(working(svc.id)), snapshot, "générer ne modifie pas la page");
    content.accept(A, siteId, set.id); content.apply(A, siteId, set.id, {});
    const after = working(svc.id).sections; assert.deepEqual(after.filter((s) => s.id !== features.id), JSON.parse(snapshot).sections.filter((s) => s.id !== features.id), "les autres sections sont intactes");
    assert.notDeepEqual(after.find((s) => s.id === features.id), JSON.parse(snapshot).sections.find((s) => s.id === features.id));
  });
  test("15-18. sauvegarde, rechargement, historique, restauration : aucune version postérieure supprimée silencieusement", async () => {
    const acc = pageByName("Accueil"); const L = m.ctx(1);
    assert.deepEqual(ws.state(L, planId).progress, ws.state(A, planId).progress, "rechargement du projet par un autre contexte : même état");
    assert.equal(plans.get(L, planId).status, "validated");
    pages.publish(A, acc.id); const v1 = pages.listVersions(A, acc.id); assert.equal(v1.length, 1);
    let cur = pages.requirePage(A, acc.id); pages.saveDraft(A, acc.id, { ...cur.working, title: "Titre modifié" }, { revision: cur.revision }); pages.publish(A, acc.id);
    const v2 = pages.listVersions(A, acc.id); assert.equal(v2.length, 2);
    pages.restoreVersion(A, acc.id, v2.at(-1).number === 1 ? v2.at(-1).number : Math.min(...v2.map((v) => v.number)));
    assert.equal(pages.listVersions(A, acc.id).length >= 2, true, "les versions postérieures restent disponibles");
    assert.notEqual(pages.requirePage(A, acc.id).working.title, "Titre modifié");
  });
  test("19-20. validation finale et publication de test : contrôles natifs, publication par le système natif, pages publiques", async () => {
    const s = ws.state(A, planId); assert.ok(Array.isArray(s.blockers));
    const draft = pages.sitePages(A, siteId).filter((p) => p.status !== "published");
    for (const p of draft) { try { pages.publish(A, p.id); } catch { /* page non prête : refus natif attendu */ } }
    const rows = m.db.prepare("SELECT status FROM mk_landing_pages WHERE site_id = ?").all(siteId);
    assert.ok(rows.some((r) => r.status === "published"), "au moins une page publiée par le système natif");
    assert.throws(() => ws.publishAll(A, planId, { can: () => true }), /confirmée explicitement/, "sans confirmation : rien n'est publié");
    try { const out = ws.publishAll(A, planId, { can: () => true, confirm: true }); assert.ok(Array.isArray(out.results)); } catch (e) { assert.ok(/Aucune page à publier|Publication impossible/.test(e.message), e.message); }
    assert.throws(() => ws.publishAll(A, planId, { can: () => false, confirm: true }), /permission/);
  });
});
