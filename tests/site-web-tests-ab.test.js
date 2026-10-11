// Phase 12 — tests A/B des pages : version B composée dans l'éditeur puis figée au démarrage, répartition stable sans
// cookie, une vue et une conversion par visiteur et par jour, statistiques honnêtes (aucun gagnant sans données
// suffisantes ni différence significative), gagnant appliqué dans le brouillon de la page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const ab = require("../src/marketing/pages/abtests");
const { startServer, Client, loginInstructor } = require("./helpers");

const publishRaw = (db, id) => db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);

describe("statistiques", () => {
  test("loi normale et comparaison de deux taux", () => {
    assert.ok(Math.abs(ab.normalCdf(1.96) - 0.975) < 0.001);
    assert.ok(Math.abs(ab.normalCdf(0) - 0.5) < 1e-6);
    const { p } = ab.compare({ views: 1000, conversions: 100 }, { views: 1000, conversions: 130 });
    assert.ok(p > 0.03 && p < 0.04, `p = ${p}`);
    assert.ok(ab.compare({ views: 1000, conversions: 100 }, { views: 1000, conversions: 101 }).p > 0.9);
  });

  test("verdicts : insuffisant, pas de différence, gagnant (jamais sans données)", () => {
    const { db, A } = freshMarketing();
    const page = pages.createPage(A, { name: "Offre", kind: "page" });
    publishRaw(db, page.id);
    const t = ab.createTest(A, page.id, { name: "Titre" });
    const ins = db.prepare("INSERT INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at) VALUES (?, ?, ?, ?, ?)");
    const fill = (variant, views, conv, prefix) => { for (let i = 0; i < views; i++) { ins.run(t.id, variant, `${prefix}${i}`, "view", Date.now()); if (i < conv) ins.run(t.id, variant, `${prefix}${i}`, "conversion", Date.now()); } };
    fill("a", 50, 10, "a"); fill("b", 50, 30, "b");
    assert.equal(ab.results(A, t).verdict.kind, "insufficient", "50 visiteurs par version : pas de conclusion, même avec un grand écart");
    db.prepare("DELETE FROM mk_page_test_events").run();
    fill("a", 400, 40, "a"); fill("b", 400, 42, "b");
    assert.equal(ab.results(A, t).verdict.kind, "inconclusive");
    db.prepare("DELETE FROM mk_page_test_events").run();
    fill("a", 1000, 100, "a"); fill("b", 1000, 140, "b");
    assert.equal(ab.results(A, t).verdict.kind, "significant", "écart significatif mais test pas encore démarré depuis 7 jours : pas de gagnant déclaré");
    db.prepare("UPDATE mk_page_tests SET started_at = datetime('now', '-8 days') WHERE id = ?").run(t.id);
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.verdict.kind, "winner");
    assert.equal(r.verdict.winner, "b");
    assert.equal(r.verdict.uplift, 40);
    assert.equal(r.verdict.confidence, 95);
    assert.ok(r.verdict.p < 0.05);
    assert.equal(r.evolution.length, 1);
  });
});

describe("cycle de vie (sans serveur)", () => {
  test("création (version B cachée, non publiable), démarrage contrôlé, B figée, conversion après une vue, gagnant B → brouillon", () => {
    const { db, A } = freshMarketing();
    const page = pages.createPage(A, { name: "Offre", kind: "page" });
    assert.throws(() => ab.startTest(A, ab.createTest(A, page.id, { name: "T1" }).id), /doit être en ligne/);
    db.prepare("DELETE FROM mk_page_tests").run();
    publishRaw(db, page.id);
    const t = ab.createTest(A, page.id, { name: "Nouveau titre", goal: "click", trafficB: 50 });
    assert.throws(() => ab.createTest(A, page.id, { name: "Deux" }), /déjà en préparation ou en cours/);
    assert.ok(!pages.listPages(A).some((p) => p.id === t.variant_page_id), "version B absente de la liste des pages");
    assert.throws(() => pages.publish(A, t.variant_page_id), /version B d'un test A\/B/);
    assert.throws(() => ab.startTest(A, t.id), /identique à la version A/);
    const variant = pages.getPage(A, t.variant_page_id);
    const sections = variant.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Titre B" } : s));
    pages.saveDraft(A, variant.id, { ...variant.working, sections }, { revision: variant.revision });
    const started = ab.startTest(A, t.id);
    assert.equal(started.status, "running");
    assert.equal(started.variantB.sections[0].title, "Titre B");
    const v2 = pages.getPage(A, t.variant_page_id);
    pages.saveDraft(A, v2.id, { ...v2.working, sections: v2.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Autre" } : s)) }, { revision: v2.revision });
    assert.equal(ab.getTest(A, t.id).variantB.sections[0].title, "Titre B", "B figée pendant le test");
    // Répartition stable et proche de la part choisie
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) counts[ab.variantFor(started, `v${i}`)] += 1;
    assert.ok(counts.b > 900 && counts.b < 1100, JSON.stringify(counts));
    assert.equal(ab.variantFor(started, "v7"), ab.variantFor(started, "v7"));
    // Conversion : seulement après une vue, seulement pour l'objectif du test
    assert.equal(ab.recordConversion(db, started, "inconnu", "click"), false);
    ab.recordView(db, started, "v1");
    assert.equal(ab.recordConversion(db, started, "v1", "signup"), false, "objectif différent");
    assert.equal(ab.recordConversion(db, started, "v1", "click"), true);
    assert.equal(ab.recordConversion(db, started, "v1", "click"), false, "une seule conversion par visiteur");
    ab.decideTest(A, t.id, "b");
    const after = pages.getPage(A, page.id);
    assert.equal(after.working.sections[0].title, "Titre B", "B copiée dans le brouillon");
    assert.notEqual(after.published.sections[0].title, "Titre B", "la page en ligne ne change qu'à la publication");
    assert.equal(ab.getTest(A, t.id).status, "completed");
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("écrans, démarrage, visiteurs répartis entre A et B, clic converti, résultats sans conclusion hâtive", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Page testée", template: "vente" })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);
    let html = (await boss.get(`/marketing/pages/${id}/test-ab`)).text;
    assert.match(html, /Nouveau test/);
    await boss.post(`/marketing/pages/${id}/test-ab`, { name: "Bandeau", goal: "click", traffic_b: "50" });
    const t = db.prepare("SELECT * FROM mk_page_tests WHERE page_id = ?").get(id);
    html = (await boss.get(`/marketing/pages/${id}/test-ab`)).text;
    assert.match(html, new RegExp(`href="/marketing/pages/${t.variant_page_id}/editeur"`));
    const vp = pages.getPage({ db, organizationId: 1 }, t.variant_page_id);
    db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ ...vp.working, sections: vp.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Version B du bandeau" } : s)) }), vp.id);
    await boss.post(`/marketing/tests-ab/${t.id}/demarrer`, {});
    assert.equal(db.prepare("SELECT status FROM mk_page_tests WHERE id = ?").get(t.id).status, "running");
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    let seenB = 0, seenA = 0, clicked = false;
    for (let i = 0; i < 16; i++) {
      const ua = `Mozilla/5.0 (Macintosh) Chrome/120.${i}`;
      const v = new Client(srv.base);
      const page = (await v.get(`/p/${slug}`, { headers: { "User-Agent": ua } })).text;
      if (/Version B du bandeau/.test(page)) seenB += 1; else seenA += 1;
      if (!clicked) {
        const link = page.match(/href="(\/p\/[^"]+\/clic\/\d+)"/);
        if (link) { await v.get(link[1], { headers: { "User-Agent": ua } }); clicked = true; }
      }
    }
    assert.ok(seenA > 0 && seenB > 0, `A ${seenA}, B ${seenB}`);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'view'").get(t.id).n, 16);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'conversion'").get(t.id).n, 1);
    html = (await boss.get(`/marketing/pages/${id}/test-ab`)).text;
    assert.match(html, /Données insuffisantes : pas encore concluant/);
    assert.match((await boss.get("/marketing/site-web/tests-ab")).text, /Bandeau/);
    await boss.post(`/marketing/tests-ab/${t.id}/terminer`, { winner: "a" });
    assert.equal(db.prepare("SELECT winner FROM mk_page_tests WHERE id = ?").get(t.id).winner, "a");
    const after = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120.3" } })).text;
    assert.doesNotMatch(after, /Version B du bandeau/, "test terminé : tout le monde voit A");
  });
});
