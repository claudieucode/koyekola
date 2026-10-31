// Programme 22.1 — le laboratoire de qualité est lui-même testé : scénarios de référence stables, analyseurs corrects, notation honnête (le non-mesuré n'est jamais compté comme réussi),
// garde-fous du Brief Analyzer et du Content Generator, et cohérence du RÉSULTAT DE RÉFÉRENCE enregistré (docs/quality-lab/results.json). Le laboratoire complet (serveur réel, ~3 min) se relance avec :
//   node tests/quality-lab/lab.js        (ou QUALITY_LAB=1 node --test tests/programme22-1-quality-lab.test.js)
const fs = require("node:fs");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { SCENARIOS, BRIEF_CASES } = require("./quality-lab/scenarios");
const audit = require("./quality-lab/audit");
const lab = require("./quality-lab/lab");
const RESULTS = path.join(__dirname, "..", "docs", "quality-lab", "results.json");

describe("scénarios de référence", () => {
  test("21 scénarios, identifiants uniques, briefs non vides, aucune donnée réelle (pas d'e-mail ni de téléphone)", () => {
    assert.equal(SCENARIOS.length, 21);
    assert.equal(new Set(SCENARIOS.map((s) => s.id)).size, 21);
    for (const s of SCENARIOS) {
      assert.ok(s.brief.length > 60 && s.design.text && s.expect.country && s.essential.length >= 3, s.id);
      assert.ok(!/@|\+?\d[\d .]{8,}/.test(s.brief), `${s.id} : donnée personnelle`);
      assert.ok(require("../src/siteWizard/catalog").category(s.wizard), `${s.id} : catégorie du parcours guidé`);
    }
    for (const k of ["entreprise", "immobilier", "construction", "tech", "photographie", "portfolio", "institutionnel", "restaurant", "blog", "boutique", "mode", "informatique", "services", "education", "sante"]) assert.ok(SCENARIOS.some((s) => s.id === k), k);
    assert.equal(BRIEF_CASES.length, 6);
  });
});

describe("analyseur de pages et notation", () => {
  const html = `<html lang="fr"><head><title>T</title><meta name="description" content="d"><meta name="viewport" content="width=device-width"><link rel="canonical" href="/x"></head><body><header></header><nav></nav><main><h1>Un</h1><h3>Saut de niveau</h3><img src="a.png"><img src="b.png" alt="b" width="10" height="10"><a href="/x">x</a><a href="#">vide</a><input id="n"><label for="n">N</label><input name="z"><p>[Titre à compléter] texte</p></main><footer></footer></body></html>`;
  test("détecte h1, saut de niveau, images sans alt, liens vides, champs sans label, espaces réservés", () => {
    const a = audit.analyzePage(html);
    assert.equal(a.h1, 1); assert.equal(a.headingOrderOk, false); assert.equal(a.imagesNoAlt, 1); assert.equal(a.emptyLinks, 1);
    assert.equal(a.formFields, 2); assert.equal(a.formFieldsLabelled, 1); assert.equal(a.placeholders, 1);
    assert.ok(a.viewport && a.canonical && a.description === "d" && a.lang === "fr" && a.landmarks.main && a.landmarks.nav && a.landmarks.footer);
  });
  test("affirmations inventées : statistiques, certifications, années d'expérience, promesses médicales", () => {
    assert.ok(audit.inventedClaims("Plus de 95 % de clients satisfaits").length);
    assert.ok(audit.inventedClaims("Certifiés ISO 9001").length); assert.ok(audit.inventedClaims("25 ans d'expérience").length);
    assert.ok(audit.inventedClaims("guérison garantie").length);
    assert.equal(audit.inventedClaims("Nous construisons des maisons à Kinshasa.").length, 0);
  });
  test("statuts selon la grille de la mission et plafonnement par une défaillance critique", () => {
    for (const [n, s] of [[100, "EXCELLENT"], [90, "EXCELLENT"], [89.9, "TRÈS BON"], [80, "TRÈS BON"], [79, "SATISFAISANT"], [70, "SATISFAISANT"], [69, "À AMÉLIORER"], [50, "À AMÉLIORER"], [49, "INSUFFISANT"]]) assert.equal(audit.STATUS(n), s, String(n));
    const full = Object.fromEntries(audit.CRITERIA.map(([k, , max]) => [k, { got: max, measured: max }]));
    assert.equal(audit.grade(full, []).status, "EXCELLENT");
    const capped = audit.grade(full, ["parcours d'achat défectueux"]);
    assert.equal(capped.status, "À AMÉLIORER"); assert.equal(capped.capped, true);
  });
  test("le non-mesuré n'est JAMAIS compté comme réussi : points obtenus ≤ points mesurés ≤ pondération, total pondéré = 100", () => {
    assert.equal(audit.CRITERIA.reduce((a, c) => a + c[2], 0), 100);
    const g = audit.grade({ visuel: { got: 99, measured: 99 }, brief: { got: 5, measured: 4 } }, []);
    const v = g.rows.find((r) => r.key === "visuel"), b = g.rows.find((r) => r.key === "brief");
    assert.equal(v.measured, 20); assert.equal(v.got, 20); assert.equal(b.got, 4);
    assert.equal(g.measured, 24); assert.equal(audit.grade({}, []).measured, 0);
  });
});

describe("gardes du Brief Analyzer, du Content Generator, du Component Mapper (fournisseur simulé)", () => {
  const o = lab.offlineAudit();
  test("un modèle qui invente des faits : tout est déclassé, type et fonctionnalité inconnus refusés, confiance plafonnée", () => {
    const g = o.brief.guards; assert.equal(g.downgraded, g.invented); assert.ok(g.unknownTypeRejected && g.unknownFeatureDropped && g.confidenceCapped);
    // LIMITE MESURÉE (constat F-BRIEF-1, voir la feuille de route) : une valeur inventée dont la citation est absente est déclassée en « déduite » mais CONSERVÉE (confiance ≤ 0,8) et le brief reste « prêt ».
    // Ce test documente l'état actuel ; il devra être inversé quand le palier correctif écartera les valeurs sans preuve.
    assert.equal(g.retainedWithValue, g.invented); assert.equal(o.brief.readinessOfInventedBrief, "ready");
  });
  test("briefs précis, courts, vagues, complexes, contradictoires : le pays et la contradiction évidente sont détectés par règles", () => {
    const by = Object.fromEntries(o.brief.cases.map((c) => [c.id, c]));
    assert.equal(by.precis.country, "CD"); assert.equal(by.complexe.country, "CD"); assert.deepEqual(by.contradictoire.contradictions, ["minimal_vs_rich"]);
    assert.ok(o.brief.cases.every((c) => c.language === "fr"));
  });
  test("Content Generator : 12 affirmations inventées sur 12 détectées, aucun faux positif sur 6 textes légitimes ; répétitions repérées", () => {
    assert.equal(o.content.detectionRate, 1, `non détectés : ${o.content.undetected}`); assert.equal(o.content.falsePositiveRate, 0);
    assert.ok(o.content.repetitionCodes.includes("repeated_sentence"));
  });
  test("Component Mapper : une section sans contenu n'est jamais présentée comme complète (exemples signalés, composants absents déclarés, sections vides ignorées)", () => {
    const by = Object.fromEntries(o.sections.map((s) => [s.kind, s]));
    assert.equal(o.sections.length, 14);
    for (const k of ["gallery", "cta", "video", "text"]) assert.equal(by[k].status, "skipped", k);
    for (const k of ["pricing", "listing"]) { assert.equal(by[k].status, "partial", k); assert.ok(by[k].missing.length, k); }
    for (const k of ["intro", "services", "benefits", "steps", "faq", "testimonials", "contact"]) assert.equal(by[k].example, true, k);
  });
  test("Media : démonstration locale vs fournisseur réel NON VÉRIFIÉ ; fournisseurs absents déclarés ; texte alternatif produit", () => {
    const m = o.media; assert.equal(m.providers.find((p) => p.id === "openai").priceStatus, "unverified"); assert.equal(m.providers.find((p) => p.id === "demo").kind, "demo");
    assert.ok(m.notIntegrated.length >= 3); assert.match(m.altSample, /Chantier/);
  });
});

describe("résultat de référence enregistré (docs/quality-lab/results.json)", () => {
  const exists = fs.existsSync(RESULTS);
  test("21 scénarios notés, notes cohérentes avec la grille, statuts recalculables, plafonds appliqués", { skip: !exists && "résultat de référence absent" }, () => {
    const r = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
    assert.equal(r.scenarios.length, 21);
    for (const s of r.scenarios) {
      const sc = s.score; assert.equal(sc.rows.length, 10);
      assert.ok(sc.rows.every((x) => x.got <= x.measured + 1e-9 && x.measured <= x.max), s.id);
      assert.ok(Math.abs(sc.pct - Math.round((sc.got / sc.measured) * 1000) / 10) < 0.11, s.id);
      const expected = sc.critical.length && sc.pct >= 70 ? "À AMÉLIORER" : audit.STATUS(sc.pct); assert.equal(sc.status, expected, s.id);
      assert.ok(sc.measured < 100, "une partie de la grille n'est pas mesurable : le total mesuré ne peut pas valoir 100");
    }
    for (const id of ["boutique", "mode", "informatique"]) assert.ok(r.scenarios.find((s) => s.id === id).score.critical.length >= 1, `${id} : défaillance critique du parcours d'achat attendue`);
  });
  test("diversité : les chiffres enregistrés correspondent aux pages réellement générées", { skip: !exists && "résultat de référence absent" }, () => {
    const r = JSON.parse(fs.readFileSync(RESULTS, "utf8")); const d = lab.diversity(r.scenarios);
    assert.equal(d.distinctHomeSignatures, r.diversity.distinctHomeSignatures); assert.equal(d.identicalHomePairs, r.diversity.identicalHomePairs);
  });
});

// Relance complète (serveur réel) : opt-in, car elle prend plusieurs minutes
describe("laboratoire complet (QUALITY_LAB=1)", { skip: !process.env.QUALITY_LAB && "opt-in : QUALITY_LAB=1" }, () => {
  test("les 21 scénarios s'exécutent de bout en bout (génération, publication, lecture publique)", { timeout: 900000 }, async () => {
    const r = await lab.runLab();
    assert.equal(r.scenarios.length, 21);
    assert.ok(r.scenarios.every((s) => s.pages.length >= 3 && s.pages.some((p) => p.status === 200)));
  });
});
