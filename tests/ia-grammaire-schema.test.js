// Erreur Anthropic 400 « The compiled grammar is too large » sur « Analyser mon projet ».
// Cause : le schéma de SORTIE structurée de l'analyse (19 objets, 17 énumérations) — aucun outil n'est transmis à Anthropic.
// Vérifié ici (client factice, aucun appel réseau) : forme compacte du schéma et équivalence du résultat, budget de complexité,
// garde-fou avant l'appel, message dédié au refus de grammaire, aucun outil transmis, rien de modifié en cas d'échec, reprise.
const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const budget = require("../src/services/schemaBudget");
const plans = require("../src/marketing/ai/builder/plans");
const workspace = require("../src/marketing/ai/builder/workspace");
const C = require("../src/marketing/ai/builder/contracts");

const NOW = Date.UTC(2026, 9, 30, 12);
const BRIEF = "Je veux créer un site web pour une entreprise de construction à Kinshasa. Je souhaite présenter mes services, afficher mes réalisations et permettre aux clients de demander un devis. Design moderne, bleu marine et blanc.";
let m, A, calls, behaviour;

const fact = (value = "", status = "unknown", evidence = "", confidence = 0.9) => ({ value, status, evidence, confidence });
// Réponse du modèle à la forme COMPACTE actuelle
const compact = () => ({
  briefLanguage: "fr",
  facts: [
    { field: "siteType", ...fact("entreprise", "explicit", "entreprise de construction") }, { field: "sector", ...fact("construction", "explicit", "entreprise de construction") },
    { field: "city", ...fact("Kinshasa", "explicit", "Kinshasa") }, { field: "siteLanguage", ...fact("fr", "assumed") }, { field: "style", ...fact("moderne", "explicit", "Design moderne") },
    { field: "color", ...fact("bleu marine", "explicit", "bleu marine") }, { field: "color", ...fact("blanc", "explicit", "blanc") },
  ],
  signals: [
    { kind: "goal", key: "presenter", status: "explicit", confidence: 0.9, evidence: "présenter mes services", reason: "" },
    { kind: "feature", key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" },
    { kind: "feature", key: "inconnue_xyz", status: "explicit", confidence: 0.9, evidence: "", reason: "" },
    { kind: "secondaryType", key: "portfolio", status: "inferred", confidence: 0.6, evidence: "", reason: "" },
  ],
  pagesRequested: [{ name: "Réalisations", evidence: "afficher mes réalisations" }], contradictions: [], missing: [],
  questions: [{ topic: "photos", question: "Avez-vous des photos ?", why: "", blocking: false, choices: ["Oui", "Non"] }],
});
// La même réponse à l'ancienne forme (un champ par fait) : doit donner exactement la même analyse
const legacy = () => ({
  briefLanguage: "fr", name: fact(), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(),
  city: fact("Kinshasa", "explicit", "Kinshasa"), siteLanguage: fact("fr", "assumed"), audience: fact(), tone: fact(), formality: fact(), style: fact("moderne", "explicit", "Design moderne"), typography: fact(),
  colors: [fact("bleu marine", "explicit", "bleu marine"), fact("blanc", "explicit", "blanc")], secondaryTypes: ["portfolio"],
  goals: [{ key: "presenter", status: "explicit", confidence: 0.9, evidence: "présenter mes services" }],
  features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" }, { key: "inconnue_xyz", status: "explicit", confidence: 0.9, evidence: "", reason: "" }],
  pagesRequested: [{ name: "Réalisations", evidence: "afficher mes réalisations" }], contradictions: [], missing: [],
  questions: [{ topic: "photos", question: "Avez-vous des photos ?", why: "", blocking: false, choices: ["Oui", "Non"] }],
});
const planRaw = () => ({ site: { name: "Mon site", description: "" }, pages: [{ key: "accueil", name: "Accueil", slug: "accueil", purpose: "Accueil", description: "", pageType: "accueil", priority: "essential", origin: "ai", menu: "main", position: 1, parent: "", relatedTo: [], sections: [{ key: "", type: "hero", purpose: "Accroche", description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: ["cle_inventee"], origin: "ai" }] }], navigation: { main: ["accueil"], secondary: [], footer: [] }, features: [{ key: "cle_inventee", level: "required", origin: "ai", reason: "" }], conversions: [], recommendations: [] });

const grammarError = () => new aiCore.AnthropicClient.BadRequestError(400, { type: "error", error: { type: "invalid_request_error", message: "The compiled grammar is too large, which would cause performance issues. Simplify your tool schemas or reduce the number of strict tools." } }, undefined, new Headers());

function fake() {
  calls = [];
  aiCore.setClientForTests({ beta: { messages: { create: async (r) => {
    calls.push(r);
    const kind = /analyste de projets/.test(r.system) ? "brief" : "plan";
    const out = typeof behaviour[kind] === "function" ? behaviour[kind](r) : behaviour[kind];
    if (out instanceof Error) throw out;
    return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(out) }], model: "fake", usage: { input_tokens: 10, output_tokens: 20 } };
  } } } });
}
const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
const count = (sql) => m.db.prepare(sql).get().n;

beforeEach(() => { m = freshMarketing(); A = m.ctx(1, { now: () => NOW }); behaviour = { brief: compact(), plan: planRaw() }; fake(); });
after(() => aiCore.setClientForTests(null));

describe("budget de complexité des schémas", () => {
  test("les schémas d'analyse et de plan sont dans le budget, bien en dessous de l'ancien schéma refusé", () => {
    for (const s of [C.analysisSchema(), C.planSchema()]) assert.deepEqual(budget.exceeded(budget.measure(s)), []);
    const a = budget.measure(C.analysisSchema());
    assert.ok(a.objects <= 8 && a.enums <= 6 && a.enumValues <= 25, JSON.stringify(a));
  });
  test("un schéma comme l'ancien (14 faits recopiés, listes de clés en énumération) est détecté", () => {
    const fact = { type: "object", properties: { value: { type: "string" }, status: { type: "string", enum: C.FACT_STATUS }, confidence: { type: "number" }, evidence: { type: "string" } }, required: ["value", "status", "confidence", "evidence"], additionalProperties: false };
    const props = {}; for (let i = 0; i < 14; i++) props[`f${i}`] = fact;
    props.goals = { type: "array", items: { type: "object", properties: { key: { type: "string", enum: Object.keys(C.GOALS) } } } };
    props.types = { type: "array", items: { type: "string", enum: Object.keys(C.SITE_TYPES) } };
    const m1 = budget.measure({ type: "object", properties: props });
    assert.ok(budget.exceeded(m1).length >= 2, JSON.stringify(m1));
  });
  test("la mesure compte objets, propriétés, énumérations et profondeur", () => {
    const r = budget.measure({ type: "object", properties: { a: { type: "array", items: { type: "object", properties: { b: { type: "string", enum: ["x", "y"] } } } } } });
    assert.deepEqual([r.objects, r.properties, r.enums, r.enumValues, r.arrays, r.depth], [2, 2, 1, 2, 1, 3]);
  });
});

describe("analyse : forme compacte", () => {
  test("la requête envoyée à Anthropic ne contient aucun outil ni option stricte, et son schéma est dans le budget", async () => {
    await plans.analyzeBrief(A, { brief: BRIEF });
    const r = calls[0];
    assert.equal(r.tools, undefined); assert.equal(r.tool_choice, undefined);
    assert.ok(!JSON.stringify(r).includes('"strict"'));
    assert.equal(r.output_config.format.type, "json_schema");
    assert.deepEqual(budget.exceeded(budget.measure(r.output_config.format.schema)), []);
  });
  test("la forme compacte donne exactement la même analyse que l'ancienne forme", async () => {
    const a1 = (await plans.analyzeBrief(A, { brief: BRIEF })).analysis;
    behaviour.brief = legacy();
    const a2 = (await plans.analyzeBrief(A, { brief: BRIEF })).analysis;
    const strip = (a) => { const { original, ...rest } = a; return rest; };
    assert.deepEqual(strip(a1), strip(a2));
    assert.equal(a1.project.siteType.value, "entreprise"); assert.deepEqual(a1.identity.colors.map((c) => c.value), ["bleu marine", "blanc"]);
    assert.deepEqual(a1.project.secondaryTypes.map((t) => t.key), ["portfolio"]);
  });
  test("une clé inconnue envoyée par le modèle (fonctionnalité, objectif, type) est écartée côté serveur", async () => {
    behaviour.brief = { ...compact(), signals: [...compact().signals, { kind: "goal", key: "nimporte", status: "explicit", confidence: 1, evidence: "", reason: "" }, { kind: "secondaryType", key: "zzz", status: "inferred", confidence: 1, evidence: "", reason: "" }, { kind: "bizarre", key: "x", status: "explicit", confidence: 1, evidence: "", reason: "" }] };
    const a = (await plans.analyzeBrief(A, { brief: BRIEF })).analysis;
    assert.deepEqual(a.features.map((f) => f.key), ["formulaire_devis"]);
    assert.deepEqual(a.goals.map((g) => g.key), ["presenter"]);
    assert.deepEqual(a.project.secondaryTypes.map((t) => t.key), ["portfolio"]);
  });
  test("un type de site hors liste est classé « autre » ; un champ répété garde le premier", async () => {
    const r = compact(); r.facts.push({ field: "sector", ...fact("autre secteur", "explicit", "Kinshasa") }); r.facts[0] = { field: "siteType", ...fact("licorne", "inferred") };
    behaviour.brief = r;
    const a = (await plans.analyzeBrief(A, { brief: BRIEF })).analysis;
    assert.equal(a.project.siteType.value, "autre"); assert.equal(a.project.sector.value, "construction");
  });
  test("un champ nul, absent ou mal formé ne casse rien", () => {
    assert.equal(C.expandAnalysis(null), null);
    assert.deepEqual(C.expandAnalysis({ facts: [null, 3, { field: "nom_invalide", value: "x" }], signals: [null, {}] }).colors, []);
  });
});

describe("plan : clés vérifiées par le serveur", () => {
  test("le schéma de plan n'énumère plus les clés ; une clé inventée est ignorée sans erreur", async () => {
    const p0 = await plans.analyzeBrief(A, { brief: BRIEF });
    const p = await plans.createPlan(A, p0.id, { proceedWithAssumptions: true });
    const schema = calls[1].output_config.format.schema;
    assert.deepEqual(budget.exceeded(budget.measure(schema)), []);
    assert.ok(!JSON.stringify(schema).includes("formulaire_devis"), "plus de liste de clés dans le schéma");
    assert.ok(!p.plan.features.some((f) => f.key === "cle_inventee"));
    assert.ok(p.plan.pages[0].sections.every((s) => !s.dependsOn.includes("cle_inventee")));
  });
});

describe("refus de grammaire par Anthropic", () => {
  test("le 400 est traduit en message dédié et le schéma mesuré est joint", async () => {
    behaviour.brief = grammarError();
    const e = await plans.analyzeBrief(A, { brief: BRIEF }).catch((x) => x);
    assert.equal(e.code, "schema_too_complex");
    assert.match(e.message, /trop complexe/); assert.match(e.message, /Rien n'a été modifié/);
    assert.ok(!/400/.test(e.message), "pas de jargon d'API brut");
    assert.ok(e.schema && e.schema.objects > 0);
  });
  test("un autre 400 garde son message d'origine", async () => {
    behaviour.brief = new aiCore.AnthropicClient.BadRequestError(400, { type: "error", error: { type: "invalid_request_error", message: "max_tokens too big" } }, undefined, new Headers());
    const e = await plans.analyzeBrief(A, { brief: BRIEF }).catch((x) => x);
    assert.equal(e.code, "api"); assert.match(e.message, /max_tokens too big/);
  });
  test("un schéma hors budget n'est jamais envoyé : le client n'est pas appelé", async () => {
    const props = {}; for (let i = 0; i < 30; i++) props[`o${i}`] = { type: "object", properties: { v: { type: "string" } } };
    const e = await aiCore.runJson({ system: "s", prompt: "p", schema: { type: "object", properties: props }, label: "test" }).catch((x) => x);
    assert.equal(e.code, "schema_too_complex"); assert.equal(calls.length, 0);
  });
});

describe("échec et reprise", () => {
  test("nouveau site : l'analyse refusée archive le site créé, aucun projet n'est enregistré, puis la reprise réussit", async () => {
    const sites = count("SELECT COUNT(*) n FROM mk_sites"), projets = plans.list(A, { limit: 100 }).length;
    behaviour.brief = grammarError();
    assert.equal(await code(workspace.createProject(A, { brief: BRIEF, newSiteName: "Projet grammaire" })), "schema_too_complex");
    const s = m.db.prepare("SELECT status FROM mk_sites WHERE name = 'Projet grammaire'").get();
    assert.equal(s.status, "archived", "archivé, pas supprimé, pas actif");
    assert.equal(count("SELECT COUNT(*) n FROM mk_sites"), sites + 1);
    assert.equal(plans.list(A, { limit: 100 }).length, projets);
    // reprise : même demande, l'IA répond
    behaviour.brief = compact();
    const ok = await workspace.createProject(A, { brief: BRIEF, newSiteName: "Projet grammaire 2" });
    assert.ok(ok.id); assert.equal(plans.list(A, { limit: 100 }).length, projets + 1);
  });
  test("site existant : l'échec ne laisse ni plan ni modification du site", async () => {
    const site = m.db.prepare("SELECT id, name, status FROM mk_sites WHERE organization_id = 1 LIMIT 1").get();
    const before = site ? JSON.stringify(m.db.prepare("SELECT * FROM mk_sites WHERE id = ?").get(site.id)) : null;
    behaviour.brief = grammarError();
    assert.equal(await code(workspace.createProject(A, { brief: BRIEF, siteId: site ? site.id : undefined })), "schema_too_complex");
    assert.equal(plans.list(A, { limit: 100 }).length, 0);
    if (site) assert.equal(JSON.stringify(m.db.prepare("SELECT * FROM mk_sites WHERE id = ?").get(site.id)), before);
  });
  test("analyse puis plan s'enchaînent avec les schémas compacts (description courte et description longue)", async () => {
    const p0 = await plans.analyzeBrief(A, { brief: "Site pour mon restaurant à Lubumbashi, menu et réservation." });
    assert.ok(["ready", "blocked", "insufficient"].includes(p0.analysis.readiness.level));
    const long = BRIEF + " " + "Nous proposons aussi des visites de chantier, un suivi photo, un blog, une page carrières et un espace client. ".repeat(20);
    const p1 = await plans.analyzeBrief(A, { brief: long.slice(0, 5900) });
    const plan = await plans.createPlan(A, p1.id, { proceedWithAssumptions: true });
    assert.equal(plan.status, "pending");
    assert.equal(calls.length, 3);
  });
});
