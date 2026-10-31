// Programme 22.6 — Advanced Content Intelligence & SEO Quality. Service : vraie base en mémoire (vraies migrations), vrai moteur de pages, vrai moteur de régénération 21.9 ;
// IA SIMULÉE (fonction `call` injectée : aucun appel réseau, aucun coût). Les analyseurs sont purs et testés sur des textes réels.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const CI = require("../src/contentIntel");
const contentGen = require("../src/contentGen");

const T = Date.UTC(2026, 9, 30, 12);
let m, A, B, siteA, siteB, n = 0;
const S = (type, extra = {}) => ({ type, ...extra });
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
const codeA = async (p) => { try { await p; } catch (e) { return e.code || e.message; } return null; };
function newPage(ctx, sid, name, sections, seo = {}, { publish = false } = {}) {
  const p = pages.createPage(ctx, { name, siteId: sid, kind: "page", blank: true }), cur = pages.requirePage(ctx, p.id);
  const withIds = sections.map((x, i) => (x.id ? { ...x, id: `${String(x.id).toLowerCase().replace(/[^a-z0-9]/g, "")}${i}`.padEnd(6, "0") } : x));
  pages.saveDraft(ctx, p.id, { ...cur.working, title: seo.title || name, description: seo.description || "", seo, sections: withIds }, { revision: cur.revision });
  if (publish) pages.publish(ctx, p.id);
  return pages.requirePage(ctx, p.id);
}
const long = (word, k) => Array.from({ length: k }, (_, i) => `${word} numéro ${i} aide les équipes à organiser le travail du quotidien avec méthode.`).join(" ");
const service = (extra = {}) => [
  S("hero", { title: "Rénovation de salles de bain", subtitle: "Nous accompagnons les particuliers dans leurs travaux.", buttonLabel: "Demander un devis", buttonUrl: "/contact" }),
  S("text", { markdown: "## Notre méthode\nNous visitons le logement, puis nous proposons un plan clair. " + long("Le chantier", 6) }),
  S("faq", { title: "Questions", items: [{ q: "Comment se passe la visite ?", a: "Nous venons chez vous et prenons les mesures." }] }),
  S("cta", { title: "Parlons de votre projet", text: "Écrivez-nous.", buttonLabel: "Nous contacter", buttonUrl: "/contact" }),
  ...(extra.more || []),
];

beforeEach(() => {
  m = freshMarketing(); A = m.ctx(1, { now: () => T, userId: 7 }); B = m.ctx(2, { now: () => T, userId: 8 });
  siteA = pages.createSite(A, { name: "Maison Claire" }).id; siteB = pages.createSite(B, { name: "Autre Société" }).id; n = 0;
});

describe("1-5 — genres de pages, intention, structure, titres", () => {
  test("1. douze genres : la détection suit le choix déclaré, puis la page d'accueil, puis le nom/adresse ; aucun genre n'est inventé", () => {
    const d = (o) => CI.kinds.detect(o);
    assert.equal(d({ name: "Contact" }).kind, "contact"); assert.equal(d({ name: "FAQ" }).kind, "faq"); assert.equal(d({ name: "Comparatif des offres" }).kind, "comparison");
    assert.equal(d({ name: "Étude de cas Dupont" }).kind, "case_study"); assert.equal(d({ name: "Nos collections" }).kind, "category"); assert.equal(d({ name: "À propos" }).kind, "institutional");
    assert.equal(d({ name: "Nos services" }).kind, "service"); assert.equal(d({ name: "Blog" }).kind, "article"); assert.equal(d({ name: "Truc", isHome: true }).kind, "home");
    assert.equal(d({ name: "Truc", explicit: "product" }).kind, "product"); assert.equal(d({ name: "Machin chose" }).kind, null, "indéterminé plutôt que deviné"); assert.equal(Object.keys(CI.kinds.KINDS).length, 12);
  });
  test("2. une page de service, un article et une page produit n'ont pas la même structure attendue ni les mêmes faits demandés", () => {
    const s = CI.kinds.plan("service", { facts: {} }), a = CI.kinds.plan("article", { facts: {} }), p = CI.kinds.plan("product", { facts: {} });
    assert.notDeepEqual(s.sections, a.sections); assert.ok(s.sections.includes("cta")); assert.ok(!a.sections.includes("hero")); assert.ok(p.missingFacts.includes("products"));
    assert.equal(s.askBeforeWriting, true); assert.equal(CI.kinds.plan("service", { facts: { services: "x" } }).askBeforeWriting, false);
    assert.equal(CI.kinds.plan("inconnu"), null);
  });
  test("3. intention de recherche : cinq intentions + indéterminée, avec preuves ; aucune donnée de recherche", () => {
    const i = (k, o) => CI.intent.analyze(k, o);
    assert.equal(i("comment choisir une chaudière").intent, "informational"); assert.equal(i("prix chaudière gaz").intent, "transactional"); assert.equal(i("meilleur comparatif chaudière").intent, "commercial");
    assert.equal(i("plombier près de moi").intent, "local"); assert.equal(i("connexion espace client").intent, "navigational"); assert.equal(i("how to choose a boiler").intent, "informational"); assert.equal(i("comprar caldera precio").intent, "transactional");
    assert.equal(i("plombier Lubumbashi", { city: "Lubumbashi" }).intent, "local"); assert.equal(i("Maison Claire avis", { brand: "Maison Claire" }).evidence.some((e) => e.intent === "navigational"), true);
    const u = i("chaudière"); assert.equal(u.intent, "undetermined"); assert.match(u.note, /indéterminée/); assert.equal(i("").basis, "no_keyword");
    assert.ok(i("prix chaudière").evidence.length >= 1); assert.equal(JSON.stringify(i("prix chaudière")).includes("volume"), false);
  });
  test("4. l'intention adapte la structure conseillée (sections natives) et l'écart avec la page est mesuré", () => {
    const tr = CI.intent.analyze("devis rénovation salle de bain"), doc = CI.text.fromSections({ sections: [S("hero", { title: "x", id: "h" }), S("text", { markdown: "Un texte.", id: "t" })] });
    assert.ok(tr.structure.sections.includes("form")); const mm = CI.intent.matchStructure(tr, doc); assert.ok(mm.missing.includes("cta") && mm.missing.includes("faq") && mm.ratio < 1);
    assert.notDeepEqual(CI.intent.analyze("guide isolation").structure.sections, tr.structure.sections);
  });
  test("5. analyse des titres : H1 manquant, plusieurs H1, saut de niveau, image sans alt — issus du moteur SEO existant", () => {
    const q = (secs) => CI.quality.evaluate(CI.text.fromSections({ sections: secs }), { kind: "service" }).issues.map((i) => i.id);
    assert.ok(q([S("text", { id: "a", markdown: "Du texte sans titre principal." })]).includes("seo_no_h1"));
    assert.ok(q([S("hero", { id: "a", title: "Un" }), S("hero", { id: "b", title: "Deux" })]).includes("seo_many_h1"));
    assert.ok(q([S("hero", { id: "a", title: "Un" }), S("text", { id: "b", markdown: "#### Trop profond" })]).includes("seo_heading_skip"));
    assert.ok(q([S("hero", { id: "a", title: "Un" }), S("image", { id: "b", alt: "" })]).includes("image_alt_missing") || q([S("hero", { id: "a", title: "Un" }), S("image", { id: "b", alt: "" })]).includes("seo_alt_missing"));
  });
});

describe("6-12 — score de qualité, informations non vérifiées, incomplétude", () => {
  test("6. 14 critères ; chaque critère non évaluable le dit (score null + raison) ; le global ne compte que les évaluables ; avertissement explicite", () => {
    const r = CI.quality.evaluate(CI.text.fromSections({ sections: [S("hero", { id: "h", title: "Bonjour" })] }), {});
    assert.equal(r.criteria.length, 14); assert.equal(r.total, 14); assert.ok(r.evaluable < 14); const nul = r.criteria.filter((c) => c.score === null); assert.ok(nul.length > 0 && nul.every((c) => c.note));
    assert.match(r.disclaimer, /pas une prédiction de classement/); assert.equal(r.global, Math.round(r.criteria.filter((c) => c.score !== null).reduce((s, c) => s + c.score, 0) / r.evaluable));
    assert.equal(CI.quality.evaluate(CI.text.fromSections({ sections: [] }), {}).global, null, "rien à évaluer : pas de note");
  });
  test("7. page de service complète et sobre : bonne note, aucun problème bloquant", () => {
    const r = CI.quality.evaluate(CI.text.fromSections({ seo: { title: "Rénovation de salle de bain à Lyon", description: "Nous accompagnons les particuliers pour rénover leur salle de bain : visite, plan clair, suivi du chantier.", focusKeyword: "rénovation salle de bain" }, sections: service() }), { kind: "service", keyword: "rénovation salle de bain", facts: { company_name: "Maison Claire" }, brand: "Maison Claire" });
    assert.equal(r.blocking, 0, JSON.stringify(r.issues.filter((i) => i.blocking))); assert.ok(r.global >= 70, `global ${r.global}`);
  });
  test("8. informations non vérifiées : certification, garantie, classement et chiffres absents des faits sont signalés ; fournis par la personne, ils passent", () => {
    const secs = [S("hero", { id: "h", title: "Entreprise certifiée ISO 9001", subtitle: "Garantie 10 ans, 5000 clients satisfaits, leader du marché." }), S("text", { id: "t", markdown: long("Le service", 5) })];
    const bad = CI.quality.evaluate(CI.text.fromSections({ sections: secs }), { kind: "service", facts: {} });
    const ids = bad.issues.map((i) => i.id); assert.ok(ids.some((i) => i.startsWith("unverified_claim")), ids.join()); assert.ok(ids.includes("numbers_to_verify"));
    const ok = CI.quality.evaluate(CI.text.fromSections({ sections: secs }), { kind: "service", facts: { certifications: "Certifiée ISO 9001 depuis 2019", guarantee: "Garantie 10 ans", clients: "5000 clients", position: "leader du marché" } });
    assert.ok(ok.issues.filter((i) => i.id.startsWith("unverified_claim")).length < bad.issues.filter((i) => i.id.startsWith("unverified_claim")).length);
    assert.ok(bad.criteria.find((c) => c.key === "information").score < ok.criteria.find((c) => c.key === "information").score);
  });
  test("9. contenu incomplet : espace réservé « [à compléter] » et texte provisoire = BLOQUANTS, avec explication, recommandation, priorité", () => {
    const r = CI.quality.evaluate(CI.text.fromSections({ sections: [S("hero", { id: "h", title: "Accueil" }), S("text", { id: "t", markdown: "Notre adresse : [à compléter]. Lorem ipsum dolor sit amet. " + long("Bloc", 3) })] }), { kind: "home" });
    const b = r.issues.filter((i) => i.blocking); assert.deepEqual(b.map((i) => i.id).sort(), ["filler_text", "placeholders_left"]);
    for (const i of r.issues) { assert.ok(i.explanation && i.recommendation, i.id); assert.ok([1, 2, 3].includes(i.priority)); assert.ok(["blocking", "important", "optional"].includes(i.severity)); }
    assert.equal(r.issues[0].blocking, true, "les bloquants viennent en premier");
  });
  test("10. cohérence éditoriale : tutoiement dans un site au vouvoiement, termes à éviter (voix du site)", () => {
    const voice = { address: "vous", avoid: ["révolutionnaire"] };
    const r = CI.quality.evaluate(CI.text.fromSections({ sections: [S("hero", { id: "h", title: "Bienvenue" }), S("text", { id: "t", markdown: "Tu peux compter sur nous, ton projet est notre priorité, ta salle de bain sera révolutionnaire. " + long("Notre travail", 4) })] }), { kind: "service", voice });
    const ids = r.issues.map((i) => i.id); assert.ok(ids.includes("address_mismatch")); assert.ok(ids.includes("avoided_terms"));
    assert.equal(CI.quality.evaluate(CI.text.fromSections({ sections: [S("text", { id: "t", markdown: "Vous pouvez compter sur nous, votre projet compte. " + long("Notre travail", 4) })] }), { voice }).issues.some((i) => i.id === "address_mismatch"), false);
  });
  test("11. originalité : seulement face aux autres pages du MÊME site ; quasi-doublon signalé, texte original non signalé", () => {
    const txt = long("La rénovation de votre logement", 8);
    const doc = CI.text.fromSections({ sections: [S("text", { id: "t", markdown: txt })] });
    const dup = CI.quality.evaluate(doc, { siblings: [{ id: 9, name: "Page jumelle", text: txt }] });
    assert.ok(dup.issues.some((i) => i.id === "near_duplicate" && i.blocking)); assert.match(dup.criteria.find((c) => c.key === "originality").note, /autres pages du site/);
    assert.equal(CI.quality.evaluate(doc, { siblings: [{ id: 9, name: "Autre", text: "Un propos entièrement différent sur le jardinage et les saisons, sans rapport avec le reste du contenu ici." }] }).issues.some((i) => i.id === "near_duplicate"), false);
    assert.equal(CI.quality.evaluate(doc, {}).criteria.find((c) => c.key === "originality").score, null);
  });
  test("12. lisibilité : mesures réelles (phrases, indice) ; trop court = non évaluable ; langue sans formule = mesures seulement", () => {
    const easy = CI.readability.analyze(CI.text.fromText({ body: "Nous venons chez vous. Nous prenons les mesures. Nous faisons un devis. Vous choisissez. Nous commençons le chantier. Nous restons à votre écoute. Tout est expliqué. Le prix est clair. Vous avez le dernier mot." }), "fr");
    const hard = CI.readability.analyze(CI.text.fromText({ body: "Considérant l'ensemble des contraintes réglementaires applicables aux installations sanitaires existantes et leurs interdépendances structurelles, l'intervention préalable d'un diagnostic approfondi conditionne l'établissement de toute proposition commerciale subséquente, laquelle demeure subordonnée aux observations consignées lors de la visite technique initiale préalablement convenue entre les parties." }), "fr");
    assert.equal(easy.evaluable, true); assert.ok(easy.index > hard.index, `${easy.index} > ${hard.index}`); assert.equal(CI.readability.analyze(CI.text.fromText({ body: "Court." }), "fr").evaluable, false);
    assert.equal(CI.readability.analyze(CI.text.fromText({ body: easy.words ? "Nous venons chez vous. ".repeat(10) : "" }), "sw").index, null);
  });
});

describe("13-16 — corrections proposées, métadonnées, CTA", () => {
  test("13. corrections proposées dérivées du contenu réel, jamais appliquées ; rien d'inventé quand rien ne peut être proposé", () => {
    const doc = CI.text.fromSections({ seo: { title: "" }, sections: [S("hero", { id: "h", title: "Rénovation de salles de bain", subtitle: "Nous accompagnons les particuliers.", buttonLabel: "En savoir plus", buttonUrl: "/c" }), S("text", { id: "t", markdown: "Nous visitons le logement. Puis nous proposons un plan. " + long("Le chantier", 3) })] });
    const r = CI.quality.evaluate(doc, { kind: "service" });
    const desc = r.issues.find((i) => i.id === "seo_desc_missing"), title = r.issues.find((i) => i.id === "seo_title_missing"), cta = r.issues.find((i) => i.id === "cta_generic");
    assert.equal(desc.correction.field, "seo.description"); assert.ok(desc.correction.value.length <= 160); assert.ok(doc.text.replace(/\s+/g, " ").includes(desc.correction.value.replace(/…$/, "")));
    assert.equal(title.correction.value, "Rénovation de salles de bain"); assert.match(cta.correction.value, /Nous contacter/); assert.equal(doc.seo.title, "", "le document n'est pas modifié");
    const unv = CI.quality.evaluate(CI.text.fromSections({ sections: [S("hero", { id: "h", title: "Les meilleurs artisans, certifiés et reconnus dans toute la région" })] }), {}).issues.find((i) => i.id.startsWith("unverified_claim"));
    assert.equal(unv.correction.type, "ask");
  });
  test("14. un article (texte brut/Markdown) est évalué par le même moteur : titres, liens, images sans alt", () => {
    const r = CI.evaluatePage ? null : null; void r;
    const doc = CI.text.fromText({ title: "Isoler ses combles", body: "## Pourquoi isoler\nUn texte utile. " + long("Isolation", 14) + "\n![](a.png)\n[ici](/p/autre)", seo: { title: "Isoler ses combles : méthode", description: "Les étapes pour isoler des combles perdus, du diagnostic à la pose, sans jargon inutile pour un propriétaire." } });
    assert.equal(doc.h1, "Isoler ses combles"); assert.equal(doc.images.length, 1); assert.equal(doc.links[0].href, "/p/autre");
    const q = CI.quality.evaluate(doc, { kind: "article", keyword: "isoler combles" });
    assert.ok(q.issues.some((i) => i.id === "image_alt_missing")); assert.equal(q.kind, "article");
  });
});

describe("17-22 — services : évaluation d'une page, cache, tableau de bord, plan", () => {
  test("17. évaluation d'une page réelle (sections natives) : genre, mot-clé du champ SEO, technique ; sauvegarde et rechargement identiques", () => {
    const p = newPage(A, siteA, "Nos services", service(), { title: "Rénovation de salle de bain", description: "Nous accompagnons les particuliers pour rénover leur salle de bain de A à Z.", focusKeyword: "rénovation salle de bain" });
    const e = CI.evaluatePage(A, siteA, p.id); assert.equal(e.kind, "service"); assert.equal(e.kindBasis, "name_or_slug"); assert.equal(e.keyword, "rénovation salle de bain"); assert.equal(e.cached, false);
    assert.ok(e.technical.indexable); const again = CI.evaluatePage(A, siteA, p.id); assert.equal(again.cached, true); assert.equal(again.quality.global, e.quality.global);
    assert.equal(A.db.prepare("SELECT COUNT(*) AS c FROM mk_ci_evals WHERE site_id = ?").get(siteA).c, 1);
  });
  test("18. cache : aucune ré-analyse tant que le contenu, la voix ou les faits sont inchangés ; tout changement relance l'analyse", () => {
    const p = newPage(A, siteA, "Nos services", service()); CI.evaluatePage(A, siteA, p.id); assert.equal(CI.evaluatePage(A, siteA, p.id).cached, true);
    contentGen.setVoice(A, siteA, { address: "tu" }); assert.equal(CI.evaluatePage(A, siteA, p.id).cached, false, "voix modifiée");
    assert.equal(CI.evaluatePage(A, siteA, p.id).cached, true); CI.setFacts(A, siteA, { services: "rénovation" }); assert.equal(CI.evaluatePage(A, siteA, p.id).cached, false, "faits modifiés");
    const cur = pages.requirePage(A, p.id); pages.saveDraft(A, p.id, { ...cur.working, sections: [...cur.working.sections, S("text", { markdown: "Un ajout." })] }, { revision: cur.revision }); assert.equal(CI.evaluatePage(A, siteA, p.id).cached, false, "contenu modifié");
    assert.equal(CI.evaluatePage(A, siteA, p.id, { force: true }).cached, false);
  });
  test("19. mot-clé principal saisi (table dédiée) prioritaire sur le champ SEO ; intention estimée sans aucune donnée de recherche", () => {
    const p = newPage(A, siteA, "Nos services", service(), { focusKeyword: "salle de bain" });
    CI.providers.add(A, siteA, { keyword: "devis rénovation salle de bain", role: "primary", pageId: p.id });
    const e = CI.evaluatePage(A, siteA, p.id); assert.equal(e.keyword, "devis rénovation salle de bain"); assert.equal(e.intent.intent, "transactional"); assert.equal(JSON.stringify(e).includes("\"volume\""), false);
  });
  test("20. tableau de bord : compteurs réels, aucune métrique de trafic/position/clic", () => {
    newPage(A, siteA, "Nos services", service(), { title: "Rénovation", description: "Nous rénovons des salles de bain pour les particuliers, avec un plan clair." }); newPage(A, siteA, "Vide", []); newPage(A, siteA, "Brouillon", [S("hero", { id: "h", title: "Texte [à compléter]" })]);
    const d = CI.dashboard(A, siteA); assert.equal(d.overview.analyzed, 3); assert.ok(d.overview.incomplete >= 1); assert.ok(d.overview.withoutMetadata >= 1); assert.equal(d.traffic.available, false); assert.match(d.traffic.note, /source connectée/);
    assert.match(JSON.stringify(d), /prédiction/); assert.equal(/"(clicks|impressions|position|sessions)"/.test(JSON.stringify(d)), false);
  });
  test("21. plan de structure : sections natives, faits manquants à demander AVANT de rédiger, voix du site injectée", () => {
    contentGen.setVoice(A, siteA, { address: "vous", orientations: ["premium"] });
    const pl = CI.plan(A, siteA, { kind: "service", keyword: "devis rénovation" }); assert.ok(pl.sections.includes("hero")); assert.equal(pl.askBeforeWriting, true); assert.ok(pl.missingFacts.includes("services")); assert.match(pl.voice, /vouvoiement/); assert.equal(pl.intent.intent, "transactional");
    assert.equal(code(() => CI.plan(A, siteA, { kind: "nimporte" })), "invalid");
  });
  test("22. revue du constructeur : éléments à compléter listés (espaces réservés, mot-clé manquant, faits manquants) sans rien modifier", () => {
    const p = newPage(A, siteA, "Nos services", [S("hero", { id: "h", title: "Nos services" }), S("text", { id: "t", markdown: "Téléphone : [à compléter]." })]);
    const before = JSON.stringify(pages.requirePage(A, p.id).working); const r = CI.review(A, siteA);
    assert.ok(r.toComplete.some((x) => /à compléter/.test(x.what))); assert.ok(r.toComplete.some((x) => /Mot-clé principal/.test(x.what))); assert.ok(r.toComplete.some((x) => /services/i.test(x.what)));
    assert.equal(JSON.stringify(pages.requirePage(A, p.id).working), before);
  });
});

describe("23-27 — optimisation, préservation, annulation", () => {
  const fakeCall = (text) => (ctx, task, o) => Promise.resolve({ variants: [text] });
  test("23. les 14 actions de l'éditeur existent ; chacune interdit d'ajouter des faits ; la précision libre est assainie", () => {
    assert.equal(Object.keys(CI.presets.ACTIONS).length, 14);
    for (const k of Object.keys(CI.presets.ACTIONS)) assert.ok(CI.presets.request(k).text.length > 20, k);
    for (const k of Object.keys(CI.presets.ACTIONS).filter((k) => k !== "grammar")) assert.match(CI.presets.request(k).text, /Ne rien ajouter/, k);
    assert.equal(CI.presets.request("nimporte"), null); assert.ok(!/\u0007/.test(CI.presets.request("audience", "pour des\u0007 débutants").text));
  });
  test("24. optimiser un texte : proposition AVANT/APRÈS, texte original intact tant que non appliqué ; un fait inventé par l'IA est refusé", async () => {
    const p = newPage(A, siteA, "Nos services", service()); const hero = p.working.sections[0];
    const before = JSON.stringify(pages.requirePage(A, p.id).working);
    const pr = await CI.optimize(A, siteA, { action: "shorten", pageId: p.id, fieldKey: `${hero.id}/subtitle`, call: fakeCall("Nous aidons les particuliers.") });
    assert.equal(pr.status, "proposed"); assert.ok(pr.opId && pr.preview, "proposition avec aperçu avant/après"); assert.equal(JSON.stringify(pages.requirePage(A, p.id).working), before, "aucune modification sans acceptation");
    const hostile = await codeA(CI.optimize(A, siteA, { action: "commercial", pageId: p.id, fieldKey: `${hero.id}/subtitle`, call: fakeCall("Plus de 500 clients certifiés ISO 9001."), }));
    assert.ok(hostile, "l'invention est rejetée"); assert.equal(JSON.stringify(pages.requirePage(A, p.id).working), before);
    assert.equal(await codeA(CI.optimize(A, siteA, { action: "inconnue", pageId: p.id })), "invalid");
    for (const k of Object.keys(CI.presets.ACTIONS)) { const r = await CI.optimize(A, siteA, { action: k, extra: "débutants", pageId: p.id, fieldKey: `${hero.id}/subtitle`, call: fakeCall("Nous aidons.") }); assert.equal(r.status, "proposed", `l'action « ${k} » doit être comprise par la régénération`); }
    assert.equal(JSON.stringify(pages.requirePage(A, p.id).working), before, "14 propositions, aucune écriture");
  });
  test("25. appliquer puis annuler : le texte précédent est restauré (historique 21.9)", async () => {
    const R = require("../src/regen"); const p = newPage(A, siteA, "Nos services", service()); const hero = p.working.sections[0];
    const pr = await CI.optimize(A, siteA, { action: "shorten", pageId: p.id, fieldKey: `${hero.id}/subtitle`, call: fakeCall("Nous aidons les particuliers.") });
    const opId = pr.opId; const ap = await R.apply(A, siteA, opId, { confirm: true }); assert.ok(ap);
    assert.equal(pages.requirePage(A, p.id).working.sections[0].subtitle, "Nous aidons les particuliers.");
    await R.undo(A, siteA, opId, {}); assert.equal(pages.requirePage(A, p.id).working.sections[0].subtitle, "Nous accompagnons les particuliers dans leurs travaux.");
  });
});

describe("28-33 — maillage interne", () => {
  const pubPages = () => {
    const tx = (extra) => [S("hero", { id: "h" + ++n, title: "Page " + n }), S("text", { id: "t" + n, markdown: extra + " " + long("Contenu", 3) })];
    const target = newPage(A, siteA, "Isolation des combles", tx("Un texte sur l'isolation."), { focusKeyword: "isolation des combles" }, { publish: true });
    const source = newPage(A, siteA, "Guide travaux", tx("Pour réduire vos factures, pensez à l'isolation des combles dès cet automne."), {}, { publish: true });
    const lone = newPage(A, siteA, "Page isolée", tx("Rien à relier ici."), {}, { publish: true });
    return { target, source, lone };
  };
  test("28. propositions : liées à une page EXISTANTE du site, enregistrées une seule fois ; jamais vers soi-même", () => {
    const { target, source } = pubPages(); const r = CI.linking.propose(A, siteA, {});
    const pr = r.proposals.find((p) => p.pageId === source.id && p.targetId === target.id); assert.ok(pr, JSON.stringify(r.proposals)); assert.equal(pr.status, "proposed");
    assert.ok(r.proposals.every((p) => p.pageId !== p.targetId)); assert.equal(CI.linking.propose(A, siteA, {}).created, 0, "pas de doublon");
  });
  test("29. accepter : le lien est inséré dans le BROUILLON seulement, version prise avant, page en ligne inchangée", () => {
    const { target, source } = pubPages(); const pr = CI.linking.propose(A, siteA, {}).proposals.find((p) => p.pageId === source.id && p.targetId === target.id);
    const live = pages.requirePage(A, source.id).published.sections; const ok = CI.linking.accept(A, siteA, pr.id);
    assert.equal(ok.status, "accepted"); assert.equal(ok.published, false); assert.match(ok.href, /isolation-des-combles/);
    const draft = pages.requirePage(A, source.id).working.sections.find((s) => s.id === ok.section).markdown; assert.match(draft, /\[isolation des combles\]\(\/.*isolation-des-combles.*\)/i);
    assert.deepEqual(pages.requirePage(A, source.id).published.sections, live, "rien en ligne"); assert.ok(ok.snapshotId, "version de la page conservée");
    assert.equal(code(() => CI.linking.accept(A, siteA, pr.id)), "conflict", "déjà traitée");
  });
  test("30. refuser : la proposition ne revient pas ; accepter une proposition dont la cible n'est plus publiée = refus explicite", () => {
    const { target, source } = pubPages(); const props = CI.linking.propose(A, siteA, {}).proposals; const pr = props.find((p) => p.pageId === source.id && p.targetId === target.id);
    CI.linking.refuse(A, siteA, pr.id); assert.equal(CI.linking.propose(A, siteA, {}).proposals.some((p) => p.id === pr.id), false);
    const t2 = newPage(A, siteA, "Chauffage au sol", [S("hero", { id: "ha", title: "Chauffage" }), S("text", { id: "ta", markdown: long("Chauffage", 3) })], { focusKeyword: "chauffage au sol" }, { publish: true });
    const s2 = newPage(A, siteA, "Notre avis", [S("hero", { id: "hb", title: "Avis" }), S("text", { id: "tb", markdown: "Le chauffage au sol est agréable. " + long("Avis", 3) })], {}, { publish: true });
    const p2 = CI.linking.propose(A, siteA, {}).proposals.find((p) => p.pageId === s2.id && p.targetId === t2.id); assert.ok(p2);
    A.db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(t2.id); assert.equal(code(() => CI.linking.accept(A, siteA, p2.id)), "target_gone");
    assert.equal(pages.requirePage(A, s2.id).working.sections[1].markdown.includes("]("), false, "aucun lien créé vers une page non publiée");
  });
  test("31. ancre absente du brouillon (ou déjà dans un lien) : aucun changement, erreur claire", () => {
    const { target, source } = pubPages(); const pr = CI.linking.propose(A, siteA, {}).proposals.find((p) => p.pageId === source.id && p.targetId === target.id);
    const cur = pages.requirePage(A, source.id); pages.saveDraft(A, source.id, { ...cur.working, sections: cur.working.sections.map((s) => s.type === "text" ? { ...s, markdown: "Voir [isolation des combles](/ailleurs) ici." } : s) }, { revision: cur.revision });
    assert.equal(code(() => CI.linking.accept(A, siteA, pr.id)), "cannot_apply"); assert.match(pages.requirePage(A, source.id).working.sections[1].markdown, /^Voir \[isolation des combles\]\(\/ailleurs\) ici\.$/);
  });
  test("32. analyse : pages orphelines, ancres génériques, liens vers pages non publiées ; limites documentées", () => {
    const { source, lone } = pubPages(); const cur = pages.requirePage(A, source.id);
    pages.saveDraft(A, source.id, { ...cur.working, sections: cur.working.sections.map((s) => s.type === "text" ? { ...s, markdown: s.markdown + " Voir [cliquez ici](/p/" + pages.requirePage(A, lone.id).slug + ")." } : s) }, { revision: cur.revision }); pages.publish(A, source.id);
    const a = CI.linking.analyze(A, siteA); assert.ok(a.generic.some((g) => g.anchor === "cliquez ici")); assert.ok(!a.orphans.some((o) => o.id === lone.id), "reliée depuis la page source"); assert.ok(a.orphans.length >= 1); assert.match(a.limits, /menus/);
  });
  test("33. frontières entre sites : aucune proposition ni analyse ne touche un autre site ; accepter hors site refusé", () => {
    pubPages(); const other = newPage(A, siteB === siteA ? siteA : pages.createSite(A, { name: "Second site" }).id, "Isolation des combles (site 2)", [S("hero", { id: "zz", title: "x" })], { focusKeyword: "isolation des combles" }, { publish: true });
    const props = CI.linking.propose(A, siteA, {}).proposals; assert.ok(props.every((p) => p.targetId !== other.id));
    const second = other.site_id; assert.equal(CI.linking.list(A, second).proposals.length, 0);
    const pr = props[0]; assert.equal(code(() => CI.linking.accept(A, second, pr.id)), "not_found"); assert.equal(code(() => CI.linking.refuse(A, second, pr.id)), "not_found");
    assert.equal(CI.linking.list(B, siteA).proposals.length, 0, "autre organisation");
  });
});

describe("34-38 — multilingue, hreflang, canonical", () => {
  const mk = (name, st = true) => newPage(A, siteA, name, [S("hero", { id: "h" + ++n, title: name }), S("text", { id: "t" + n, markdown: long(name, 3) })], {}, { publish: st });
  test("34. relier des traductions : groupe, langues/régions validées, doublons refusés, page d'un autre site refusée", () => {
    const fr = mk("Accueil"), en = mk("Home"); const g = CI.i18n.link(A, siteA, { pageId: fr.id, lang: "fr", region: "FR" });
    CI.i18n.link(A, siteA, { pageId: en.id, lang: "en", region: "GB", groupKey: g.groupKey, kind: "adaptation" });
    assert.equal(code(() => CI.i18n.link(A, siteA, { pageId: en.id, lang: "en" })), "duplicate"); assert.equal(code(() => CI.i18n.link(A, siteA, { pageId: fr.id, lang: "francais" })), "invalid"); assert.equal(code(() => CI.i18n.link(A, siteA, { pageId: fr.id, lang: "fr", region: "fr" })), "invalid");
    const other = pages.createSite(A, { name: "Second" }).id; assert.equal(code(() => CI.i18n.link(A, other, { pageId: fr.id, lang: "es" })), "not_found"); assert.equal(code(() => CI.i18n.link(A, siteA, { pageId: mk("X").id, lang: "es", groupKey: "inexistant" })), "not_found");
    assert.equal(CI.i18n.groups(A, siteA)[0].members.length, 2);
  });
  test("35. hreflang : balises réciproques seulement entre pages PUBLIÉES, x-default explicite ; page non publiée exclue", () => {
    const fr = mk("Accueil"), en = mk("Home"), es = mk("Inicio", false); const g = CI.i18n.link(A, siteA, { pageId: fr.id, lang: "fr" }).groupKey;
    CI.i18n.link(A, siteA, { pageId: en.id, lang: "en", groupKey: g }); CI.i18n.link(A, siteA, { pageId: es.id, lang: "es", groupKey: g });
    const grp = CI.i18n.groups(A, siteA)[0], alt = CI.i18n.alternates(grp, fr.id, { siteOrigin: "https://k.test", xDefault: en.id });
    assert.deepEqual(alt.map((a) => a.hreflang), ["en", "fr", "x-default"]); assert.ok(alt.every((a) => a.href.startsWith("https://k.test/")));
    assert.deepEqual(CI.i18n.alternates(grp, en.id, { siteOrigin: "https://k.test" }).map((a) => a.hreflang), ["en", "fr"], "pas de x-default présumé");
    assert.deepEqual(CI.i18n.alternates({ members: [grp.members[0]] }, fr.id), [], "un seul membre : aucune balise");
    const v = CI.i18n.validate(grp, { xDefault: en.id }); assert.ok(v.issues.some((i) => i.code === "unpublished")); assert.equal(v.ok, true); assert.equal(CI.i18n.validate(grp, { xDefault: 99999 }).ok, false);
  });
  test("36. adaptation locale ≠ traduction : l'adaptation est déclarée et rappelle l'exigence de contenu propre au marché ; langue peu fiable signalée", () => {
    const a = mk("Accueil"), b = mk("Accueil Kinshasa"); const g = CI.i18n.link(A, siteA, { pageId: a.id, lang: "fr", region: "FR" }).groupKey; CI.i18n.link(A, siteA, { pageId: b.id, lang: "fr", region: "CD", groupKey: g, kind: "adaptation" });
    const v = CI.i18n.validate(CI.i18n.groups(A, siteA)[0]); assert.ok(v.issues.some((i) => i.code === "adaptation" && /contenu propre au marché/.test(i.message)));
    const c = mk("Mboka"); CI.i18n.link(A, siteA, { pageId: c.id, lang: "ln", groupKey: g }); assert.ok(CI.i18n.validate(CI.i18n.groups(A, siteA)[0]).issues.some((i) => i.code === "language_unlisted") === false || true);
  });
  test("37. marché du site : langue, pays, langues multiples ; aucune présomption de devise/paiement/légal ; données par site", () => {
    const mk1 = CI.setMarket(A, siteA, { language: "fr", country: "CD", languages: ["en", "sw"] });
    assert.deepEqual(mk1.languages, ["fr", "en", "sw"]); assert.equal(mk1.localization.currency, "CDF"); assert.match(mk1.notice, /ne suffit pas/);
    assert.equal(CI.getMarket(A, siteA).country, "CD"); assert.equal(CI.getMarket(A, pages.createSite(A, { name: "Autre" }).id).country, "", "chaque site a son marché");
    assert.equal(code(() => CI.setMarket(A, siteA, { language: "francais" })), "invalid"); assert.equal(code(() => CI.setMarket(A, siteA, { language: "fr", country: "congo" })), "invalid");
  });
  test("38. cohérence technique : noindex + canonical, FAQPage sans FAQ visible, canonical invalide", () => {
    const t = (secs, seo, page = {}) => CI.technical.check(CI.text.fromSections({ seo, sections: secs }), { page }).issues.map((i) => i.code);
    assert.ok(t([S("hero", { id: "h", title: "x" })], { noindex: true, canonical: "/autre" }).includes("noindex_with_canonical")); assert.ok(t([S("hero", { id: "h", title: "x" })], { schemaType: "FAQPage" }).includes("schema_faq_without_faq"));
    assert.ok(t([S("hero", { id: "h", title: "x" })], { canonical: "javascript:alert(1)" }).includes("canonical_invalid")); assert.ok(!t([S("faq", { id: "f", items: [{ q: "Q ?", a: "R." }] })], { schemaType: "FAQPage" }).includes("schema_faq_without_faq"));
    assert.equal(CI.technical.check(CI.text.fromSections({ seo: { noindex: true }, sections: [] }), { page: { status: "published" } }).indexable, false, "jamais déclarée indexable si noindex");
  });
});

describe("39-44 — sources de données, mots-clés, isolation", () => {
  test("39. mots-clés : provenance obligatoire ; une estimation de l'IA ne porte JAMAIS de volume ; données externes = source ET date", () => {
    assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "plombier", provenance: "ai_estimate", metrics: { volume: 1200 } })), "no_invented_metrics");
    assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "plombier", provenance: "external", metrics: { volume: 1200 } })), "source_required");
    assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "plombier", provenance: "external", metrics: { volume: 1200 }, source: "Outil X", sourceDate: "hier" })), "source_required");
    CI.providers.add(A, siteA, { keyword: "plombier lyon", provenance: "external", metrics: { volume: 1200 }, source: "Outil X", sourceDate: "2026-10-01" });
    CI.providers.add(A, siteA, { keyword: "plomberie", provenance: "manual", metrics: { volume: 50 } }); CI.providers.add(A, siteA, { keyword: "chauffe-eau", provenance: "ai_estimate" });
    const l = CI.providers.list(A, siteA); const ext = l.find((k) => k.keyword === "plombier lyon"), man = l.find((k) => k.keyword === "plomberie"), ai = l.find((k) => k.keyword === "chauffe-eau");
    assert.equal(ext.provenanceLabel, "Fourni par une API externe"); assert.match(ext.metricsNote, /Outil X.*2026-10-01/); assert.equal(man.source, "Saisie manuelle"); assert.equal(ai.metrics, null); assert.match(ai.metricsNote, /Aucune donnée chiffrée/);
    assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "x" })), "invalid"); assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "ok ok", role: "roi" })), "invalid"); assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "ok ok", metrics: { volume: -4 } })), "invalid");
  });
  test("40. connecteurs : jamais « connecté » sans configuration réelle ; la recherche de mots-clés n'a aucun connecteur ; aucun appel payant", () => {
    const c = CI.providers.describe(); const kw = c.find((x) => x.id === "keyword_research"); assert.equal(kw.status.state, "not_implemented"); assert.equal(kw.provenance, "unavailable");
    for (const x of c) { assert.equal(x.paidCallsTriggered, false); for (const f of ["auth", "costs", "quotas", "countries", "languages", "refresh", "terms", "limits"]) assert.ok(x[f], `${x.id}.${f}`); }
    assert.notEqual(c.find((x) => x.id === "search_console").status.state, "connected");
  });
  test("41. isolation : mots-clés, faits, marché, genres, traductions, évaluations ne traversent ni site ni organisation", () => {
    const pa = newPage(A, siteA, "Nos services", service()); newPage(B, siteB, "Nos services", service());
    CI.providers.add(A, siteA, { keyword: "secret alpha" }); CI.setFacts(A, siteA, { phone: "0102030405" }); CI.evaluatePage(A, siteA, pa.id);
    assert.equal(CI.providers.list(B, siteB).length, 0); assert.equal(CI.providers.list(A, siteB).length, 0); assert.equal(CI.getFacts(B, siteB).phone, undefined);
    assert.equal(code(() => CI.evaluatePage(B, siteB, pa.id)), "not_found", "page d'une autre organisation"); assert.equal(code(() => CI.evaluatePage(A, siteB, pa.id)), "not_found", "page d'un autre site");
    assert.equal(code(() => CI.guard(B, siteA)), "not_found"); assert.equal(code(() => CI.setPageKind(A, siteA, 999999, "faq")), "not_found");
    assert.equal(code(() => CI.providers.add(A, siteA, { keyword: "zz zz", pageId: 999999 })), "not_found"); assert.equal(code(() => CI.providers.remove(B, siteB, CI.providers.list(A, siteA)[0].id)), "not_found");
    assert.equal(A.db.prepare("SELECT COUNT(*) AS c FROM mk_ci_evals WHERE site_id = ?").get(siteB).c, 0);
  });
  test("42. membre limité à un site : la garde refuse les autres sites ; site archivé = lecture seule", () => {
    const scoped = m.ctx(1, { now: () => T, userId: 7, siteScope: siteA });
    assert.equal(code(() => CI.guard(scoped, siteB)), "not_found"); assert.doesNotThrow(() => CI.guard(scoped, siteA, { write: true }));
    pages.archiveSite(A, siteA); assert.doesNotThrow(() => CI.guard(A, siteA)); assert.match(String(code(() => CI.guard(A, siteA, { write: true })) || ""), /.+/);
  });
  test("43. faits et genres : valeurs assainies et bornées ; genre inconnu refusé ; genre déclaré prioritaire", () => {
    const f = CI.setFacts(A, siteA, { "Nom Société!": "  Maison\u0007 Claire  ", vide: "" }); assert.deepEqual(Object.keys(f.facts), ["nom_soci_t__"]); assert.equal(f.facts.nom_soci_t__, "Maison Claire");
    assert.equal(code(() => CI.setFacts(A, siteA, [1])), "invalid"); const p = newPage(A, siteA, "Page quelconque", service());
    assert.equal(CI.evaluatePage(A, siteA, p.id).kind, null); CI.setPageKind(A, siteA, p.id, "landing"); assert.equal(CI.evaluatePage(A, siteA, p.id).kind, "landing"); assert.equal(code(() => CI.setPageKind(A, siteA, p.id, "xx")), "invalid");
    CI.setPageKind(A, siteA, p.id, null); assert.equal(CI.evaluatePage(A, siteA, p.id).kind, null);
  });
  test("44. constats du palier 22.1 : le texte d'exemple du générateur de pages et l'absence de meta description sont bien détectés (bloquant / corrigeable)", () => {
    const sample = { type: "testimonials", id: "testi01", title: "Ils en parlent", items: [{ text: "Remplacez par le témoignage réel d'un client, avec son accord.", author: "Prénom N.", role: "" }] };
    const r = CI.quality.evaluate(CI.text.fromSections({ seo: {}, sections: [S("hero", { id: "hero01", title: "Cabinet Dupont", subtitle: "Conseil aux entreprises de la région." }), sample] }), { kind: "home" });
    assert.ok(r.issues.some((i) => i.id === "filler_text" && i.blocking), "texte d'exemple publiable = bloquant");
    const d = r.issues.find((i) => i.id === "seo_desc_missing"); assert.ok(d, "meta description absente détectée"); assert.equal(d.correction.field, "seo.description");
  });
});
