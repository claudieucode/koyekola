// Programme 22.1 — Laboratoire de qualité : mesures DÉTERMINISTES et reproductibles de la chaîne de génération (base en mémoire, vraies migrations, fournisseur d'IA simulé, aucun coût).
// Ces tests FIGENT l'état observé le 2026-10-30 : certains décrivent des défauts connus (marqués « ÉTAT 22.1 »). Quand un palier suivant corrige un défaut, le test correspondant doit être
// INVERSÉ (pas supprimé) : c'est ainsi que l'amélioration est mesurée. Le détail et les preuves sont dans docs/KOLAKISA_PROGRAMME22_1B_QUALITY_AUDIT.md.
const crypto = require("node:crypto");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-p22-1-"));
process.env.DATA_DIR = path.join(SCRATCH, "data"); process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const pages = require("../src/marketing/pages");
const plans = require("../src/marketing/ai/builder/plans");
const ws = require("../src/marketing/ai/builder/workspace");
const designGen = require("../src/designGen");
const urls = require("../src/services/urls");
const mapper = require("../src/pageGen/mapper");
const color = require("../src/designGen/color");
const { SCENARIOS, fact } = require("../scripts/quality-lab-navigateur/scenarios");
const { scoreSite } = require("../scripts/quality-lab-navigateur/score");
after(() => { aiCore.setClientForTests(null); fs.rmSync(SCRATCH, { recursive: true, force: true }); });

const fake = (out) => aiCore.setClientForTests({ beta: { messages: { create: async (r) => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(typeof out === "function" ? out(r) : out) }], model: "fake", usage: { input_tokens: 5, output_tokens: 5 } }) } } });

describe("22.1 — scénarios de référence", () => {
  test("15 scénarios aux briefs FIGÉS (empreinte) : toute modification des briefs doit être délibérée", () => {
    assert.equal(SCENARIOS.length, 15);
    assert.equal(new Set(SCENARIOS.map((s) => s.id)).size, 15);
    const digest = crypto.createHash("sha256").update(SCENARIOS.map((s) => `${s.id}|${s.brief}`).join("\n")).digest("hex").slice(0, 16);
    assert.equal(digest, process.env.P22_UPDATE_BRIEFS ? digest : EXPECTED_BRIEFS_DIGEST, "les briefs de référence ont changé : mettre à jour l'empreinte ET refaire la mesure de référence");
    for (const s of SCENARIOS) assert.ok(s.brief.length > 50 && !/@|\d{10}/.test(s.brief), `${s.id} : aucune donnée personnelle`);
  });
  test("grille de notation : une note ne masque pas un critère non évalué ; une défaillance critique plafonne le statut", () => {
    const base = { sc: SCENARIOS[0], gen: { pages: [{ status: "published" }] }, audit: { pages: [], site: {}, links: { total: 0, broken: [] }, unpublished: [] } };
    const s = scoreSite(base);
    assert.equal(s.criteria.brief.got, null); assert.equal(s.criteria.contenus.got, null);
    assert.ok(s.evaluatedPoints < 100, "les critères non évalués sont exclus du dénominateur");
    const none = scoreSite({ sc: SCENARIOS[0], gen: { pages: [] } });
    assert.match(String(none.note), /absent/);
  });
});
const EXPECTED_BRIEFS_DIGEST = "a3aa01ace3b0848b"; // empreinte des 15 briefs de référence (2026-10-30)

describe("22.1 — Brief Analyzer : garde-fous déterministes (le modèle est simulé et ADVERSAIRE)", () => {
  let m, A, siteId;
  const BRIEF = "Je veux un site pour mon cabinet de comptabilité à Lyon, avec une page contact.";
  const hallucinated = () => ({ briefLanguage: "fr", name: fact("Dupont & Associés", "explicit", "Dupont & Associés"), siteType: fact("vitrine", "explicit", "site"), sector: fact("comptabilité", "explicit", "cabinet de comptabilité"), country: fact("FR", "explicit", "France"), city: fact("Lyon", "explicit", "Lyon"),
    siteLanguage: fact("fr", "explicit", "français"), audience: fact("PME de plus de 50 salariés", "explicit", "PME de plus de 50 salariés"), tone: fact("luxueux", "explicit", "luxueux"), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [],
    goals: [{ key: "presenter", status: "explicit", confidence: 1, evidence: "présenter" }], features: [{ key: "boutique", status: "explicit", confidence: 1, evidence: "boutique" }, { key: "inventee", status: "explicit", confidence: 1, evidence: "x" }], pagesRequested: [], contradictions: [], missing: [],
    questions: Array.from({ length: 9 }, (_, i) => ({ topic: `t${i}`, question: `Question ${i} ?`, why: "w", blocking: false, choices: [] })) });
  before(() => { m = freshMarketing(); A = m.ctx(1); siteId = pages.createSite(A, { name: "S" }).id; });

  test("brief vide, trop court, sans mots : refusés AVANT tout appel au modèle (aucun coût)", async () => {
    let calls = 0; aiCore.setClientForTests({ beta: { messages: { create: async () => { calls += 1; return {}; } } } });
    for (const [b, code] of [["", "brief_empty"], ["site", "brief_too_short"], ["12345 !!!", "brief_empty"]]) await assert.rejects(plans.analyzeBrief(A, { brief: b, siteId }), (e) => e.code === code, b);
    assert.equal(calls, 0);
  });
  test("contradictions évidentes détectées par des RÈGLES (sans IA)", async () => {
    fake({ ...hallucinated(), features: [], questions: [] });
    const a = await plans.analyzeBrief(A, { brief: "Je vends des produits sans paiement en ligne, avec une boutique, et un blog mais pas de blog du tout, merci", siteId });
    assert.deepEqual(a.analysis.contradictions.map((c) => c.code).sort(), ["blog_vs_none", "payment_vs_none"]);
  });
  test("un fait « explicit » dont la citation n'est PAS dans le brief est déclassé ; plafond de 5 questions ; fonctionnalité inconnue écartée", async () => {
    fake(hallucinated());
    const a = (await plans.analyzeBrief(A, { brief: BRIEF, siteId })).analysis;
    assert.equal(a.project.city.status, "explicit"); assert.equal(a.project.sector.status, "explicit", "citations présentes dans le brief : conservées");
    for (const f of [a.project.name, a.project.audience]) assert.equal(f.status, "inferred", "citation absente du brief : déclassé");
    assert.ok(a.questions.length <= 5);
    assert.ok(!a.features.some((f) => f.key === "inventee"), "fonctionnalité inconnue du registre : écartée");
    assert.ok(a.warnings.some((w) => w.code === "evidence_missing"));
  });
  test("ÉTAT 22.1 (défaut D-B1) : un nom, un public et un ton INVENTÉS par le modèle sont déclassés en « inferred » mais CONSERVÉS avec la valeur inventée ; la demande est jugée « prête »", async () => {
    fake(hallucinated());
    const a = (await plans.analyzeBrief(A, { brief: BRIEF, siteId })).analysis;
    assert.equal(a.project.name.value, "Dupont & Associés", "le nom absent du brief survit (à inverser quand le garde-fou le supprimera)");
    assert.equal(a.project.audience.value, "PME de plus de 50 salariés");
    assert.equal(a.identity.tone.value, "luxueux");
    assert.equal(a.readiness.level, "ready");
    assert.ok(a.features.some((f) => f.key === "boutique" && f.status === "inferred"), "« boutique » absent du brief mais cité comme explicite : devient une fonctionnalité déduite");
  });
});

describe("22.1 — Component Mapper : textes d'exemple et honnêteté des composants", () => {
  const sec = (kind, extra = {}) => ({ key: `${kind}-1`, kind, title: "", text: "", items: [], image: null, images: [], cta: null, courseIds: [], url: "", columns: 0, ...extra });
  const env = { siteName: "Site", courses: [] };
  test("sans contenu fourni, services/avantages/étapes/témoignages/FAQ livrent des textes d'exemple ENTRE CROCHETS (jamais de faux avis réel)", () => {
    for (const kind of ["services", "benefits", "steps", "testimonials", "faq"]) {
      const out = mapper.mapSection(sec(kind), { name: "P", key: "p" }, env);
      assert.ok(out.example, `${kind} : signalé comme exemple`);
      const txt = JSON.stringify(out.sections);
      assert.ok(/\[[^\]]+\]|Remplacez/.test(txt), `${kind} : texte d'exemple visible`);
    }
  });
  test("une galerie sans image fournie est IGNORÉE (aucune image sans rapport)", () => {
    const out = mapper.mapSection(sec("gallery"), { name: "P", key: "p" }, env);
    assert.equal(out.status, "skipped"); assert.deepEqual(out.sections, []);
  });
  test("pricing / gallery : composants natifs absents → alternative signalée, jamais déguisée", () => {
    const g = mapper.mapSection(sec("gallery", { images: [{ src: "/a.jpg", alt: "a", caption: "" }] }), { name: "P", key: "p" }, env);
    assert.equal(g.status, "partial"); assert.ok(g.alternative && g.missing.length);
    const p = mapper.mapSection(sec("pricing", { items: [{ title: "Formule" }] }), { name: "P", key: "p" }, env);
    assert.equal(p.status, "partial");
  });
});

describe("22.1 — Design Generator : diversité et contrastes (parcours RÉEL : texte = brief complet, catégorie = type de site)", () => {
  let m, A, rows;
  before(async () => {
    m = freshMarketing(); A = m.ctx(1); rows = [];
    for (const sc of SCENARIOS) {
      const siteId = pages.createSite(A, { name: sc.label }).id;
      const run = await designGen.generate(A, siteId, { text: sc.brief, category: sc.analysis.siteType.value, sector: sc.sector, country: sc.country, lang: sc.lang });
      rows.push({ id: sc.id, proposals: run.proposals });
    }
  });
  test("chaque proposition de chaque scénario passe le contrôle de contraste (AA)", () => {
    for (const r of rows) for (const p of r.proposals) { assert.ok(p.report.ok, `${r.id}/${p.key}`); assert.ok(p.report.contrasts.every((c) => c.ok), `${r.id}/${p.key}`); }
  });
  test("2 à 3 directions par brief, différentes entre elles", () => {
    for (const r of rows) { assert.ok(r.proposals.length >= 2 && r.proposals.length <= 3, r.id); assert.ok(new Set(r.proposals.map((p) => p.design.palette.primary)).size >= 2, r.id); }
  });
  test("ÉTAT 22.1 (défaut D-V1) : 14 scénarios sur 15 reçoivent une couleur principale BLEUE (teinte 190°–240°) ; seulement 2 associations typographiques", () => {
    const hues = rows.map((r) => color.hexToHsl(r.proposals[0].design.palette.primary)[0]);
    const blue = hues.filter((h) => h >= 190 && h <= 240).length;
    assert.ok(blue >= 12, `bleues : ${blue}/15 (à inverser quand la teinte dépendra du secteur)`);
    const pairs = new Set(rows.map((r) => r.proposals[0].design.typography.pair));
    assert.ok(pairs.size <= 3, `associations typographiques distinctes : ${pairs.size}`);
  });
});

describe("22.1 — Page Generator : conflit de noms entre sites d'une même organisation et pages bloquées à la publication", () => {
  let m, A;
  const sc = SCENARIOS.find((s) => s.id === "entreprise");
  before(() => { m = freshMarketing(); A = m.ctx(1); });
  const generate = async (name) => {
    const siteId = pages.createSite(A, { name }).id;
    fake((r) => (/analyste de projets/.test(r.system) ? sc.analysis : sc.plan));
    const a = await plans.analyzeBrief(A, { brief: sc.brief, siteId });
    const p = await plans.createPlan(A, a.id, { proceedWithAssumptions: true }); ws.validatePlan(A, a.id, { revision: p.revision });
    const g = await ws.generatePages(A, a.id, {}); return { siteId, planId: a.id, run: g.run };
  };
  test("ÉTAT 22.1 (défaut D-G1) : le 2e site d'une organisation ne peut pas appliquer ses pages « Accueil », « Contact »… sans décision explicite (conflit avec les pages du 1er site)", async () => {
    const first = await generate("Site 1"); ws.applyPages(A, first.planId, first.run.id, {});
    const second = await generate("Site 2");
    assert.throws(() => ws.applyPages(A, second.planId, second.run.id, {}), (e) => e.code === "conflict", "conflit entre sites : à inverser quand la recherche sera limitée au site");
    const done = ws.applyPages(A, second.planId, second.run.id, Object.fromEntries(second.run.pages.map((p) => [p.key, "create"])));
    assert.ok(Object.keys(done.applied).length >= 4);
    assert.equal(pages.sitePages(A, second.siteId).length, 5);
  });
  test("ÉTAT 22.1 (défaut D-G2) : une page de contact générée avec une section de formulaire ne se publie pas tant qu'aucun formulaire n'est choisi", async () => {
    const siteId = pages.sitePages(A, 1).length ? 1 : 1; const contact = pages.sitePages(A, siteId).find((p) => p.name === "Contact");
    assert.ok(contact);
    assert.throws(() => pages.publish(A, contact.id), /formulaire/);
  });
  test("ÉTAT 22.1 (défaut D-U1) : le planificateur affecte à une page générée une adresse RÉSERVÉE à la plateforme (« contact », « a-propos »…), donc inaccessible sur le domaine du site", async () => {
    const site1 = pages.sitePages(A, 1);
    const reserved = site1.filter((p) => urls.isReserved(p.slug));
    assert.ok(reserved.length >= 1, `adresses réservées affectées : ${site1.map((p) => p.slug).join(", ")} (à inverser quand le planificateur consultera urls.isReserved)`);
    assert.ok(urls.isReserved("a-propos") && urls.isReserved("faq") && urls.isReserved("contact"), "ces adresses sont servies par la plateforme");
  });
});
