// KOLAKISA CMS — palier 22 : moteur d'A/B testing. Vraie base (vraies migrations), vrais moteurs.
// Statistiques, validations, statuts, affectation collante, exposition, fenêtre d'attribution, achats lus dans la boutique, anomalies, isolation par site.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const ab = require("../src/marketing/pages/abtests");
const stats = require("../src/marketing/pages/abstats");
const bridge = require("../src/marketing/bridge/events");
const visitors = require("../src/marketing/visitors");

let m, A, db;
const DAY = 86400000;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
const vid = (n) => `visiteur${String(n).padStart(8, "0")}.${1700000000000 + n}`;
const publishRaw = (id) => db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);
function newTest(opts = {}, { site } = {}) {
  const page = pages.createPage(A, { name: `Offre ${Math.random().toString(36).slice(2, 7)}`, kind: "page", ...(site ? { siteId: site } : {}) });
  publishRaw(page.id);
  return { page, t: ab.createTest(A, page.id, { name: "Titre", ...opts }) };
}
// Rend la version B différente de A, puis démarre
function startable(t) {
  const v = pages.getPage(A, t.variant_page_id);
  pages.saveDraft(A, v.id, { ...v.working, sections: v.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Titre B" } : s)) }, { revision: v.revision });
  return ab.startTest(A, t.id);
}
const insert = (t, variant, visitor, type, at = Date.now(), consent = 0) => db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, ?, ?, ?, ?, ?)").run(t.id, variant, visitor, type, at, consent);
function fill(t, variant, views, conv, prefix, consent = 0) { for (let i = 0; i < views; i++) { insert(t, variant, `${prefix}${i}`, "view", Date.now(), consent); if (i < conv) insert(t, variant, `${prefix}${i}`, "conversion", Date.now(), consent); } }

beforeEach(() => { m = freshMarketing(); A = m.A; db = m.db; addLmsSchema(db); });

describe("méthode statistique", () => {
  test("valeurs connues : loi normale, deux proportions, intervalle de l'écart", () => {
    assert.ok(Math.abs(stats.normalCdf(1.96) - 0.975) < 0.0005);
    const c = stats.compare({ views: 10000, conversions: 500 }, { views: 10000, conversions: 650 }, 95);
    assert.ok(c.p < 0.001 && c.significant, "5 % contre 6,5 % sur 10 000 visiteurs : très significatif");
    assert.ok(Math.abs(c.relative - 0.3) < 1e-9);
    assert.ok(c.diffLow > 0 && c.diffHigh > c.diff, "l'intervalle de l'écart exclut 0 quand le test est significatif");
  });
  test("le niveau de confiance change réellement le verdict (p ≈ 0,03 : vrai à 95 %, faux à 99 %)", () => {
    const a = { views: 1000, conversions: 100 }, b = { views: 1000, conversions: 130 };
    const p = stats.compare(a, b, 95).p;
    assert.ok(p > 0.01 && p < 0.05, `p = ${p}`);
    assert.equal(stats.compare(a, b, 95).significant, true);
    assert.equal(stats.compare(a, b, 90).significant, true);
    assert.equal(stats.compare(a, b, 99).significant, false);
    assert.equal(stats.compare(a, b, 99).alpha, 0.01);
    assert.equal(stats.compare(a, b, 97).confidence, 95, "une valeur inconnue retombe sur 95 %");
  });
  test("une différence brute n'est pas une victoire : 6 contre 9 conversions sur 100 visiteurs → non significatif", () => {
    assert.equal(stats.compare({ views: 100, conversions: 6 }, { views: 100, conversions: 9 }).significant, false);
  });
  test("approximation normale valable seulement avec ≥ 5 conversions et ≥ 5 non-conversions par version", () => {
    assert.equal(stats.approximationValid({ views: 100, conversions: 4 }, { views: 100, conversions: 30 }), false);
    assert.equal(stats.approximationValid({ views: 100, conversions: 5 }, { views: 100, conversions: 96 }), false, "moins de 5 non-conversions");
    assert.equal(stats.approximationValid({ views: 100, conversions: 10 }, { views: 100, conversions: 30 }), true);
  });
  test("taille d'échantillon : environ 8 000 par version pour passer de 5 % à 6 % (95 %, puissance 80 %)", () => {
    const n = stats.requiredSample(0.05, 0.2, 95);
    assert.ok(n > 7500 && n < 8800, `n = ${n}`);
    assert.ok(stats.requiredSample(0.05, 0.2, 99) > n, "plus de confiance, plus de visiteurs");
    assert.equal(stats.requiredSample(0, 0.2, 95), null);
  });
  test("contrôle de répartition : 50/50 conforme, 90/10 observé pour 50/50 réglé = anomalie", () => {
    assert.equal(stats.allocationCheck(510, 490, 0.5).mismatch, false);
    assert.equal(stats.allocationCheck(900, 100, 0.5).mismatch, true);
    assert.equal(stats.allocationCheck(10, 5, 0.5).checked, false, "trop peu de visiteurs pour juger");
  });
});

describe("validation des réglages", () => {
  test("répartition : A + B = 100 toujours ; B entre 10 et 90", () => {
    const page = pages.createPage(A, { name: "Page", kind: "page" });
    publishRaw(page.id);
    for (const bad of [5, 95, 100, 0, -10, 50.5, "abc"]) assert.throws(() => ab.createTest(A, page.id, { name: "x", trafficB: bad }), /entre 10 et 90/, String(bad));
    for (const ok of [10, 20, 30, 50, 70, 90]) {
      const t = ab.createTest(A, page.id, { name: `T${ok}`, trafficB: ok });
      assert.equal(t.traffic_b, ok);
      ab.deleteTest(A, t.id);
    }
  });
  test("objectif, confiance, fenêtre d'attribution, taille minimale : valeurs inconnues refusées", () => {
    const page = pages.createPage(A, { name: "Page", kind: "page" });
    publishRaw(page.id);
    assert.throws(() => ab.createTest(A, page.id, { goal: "revenue" }), /Objectif inconnu/);
    assert.throws(() => ab.createTest(A, page.id, { confidence: 97 }), /90, 95 ou 99/);
    assert.throws(() => ab.createTest(A, page.id, { attributionDays: 0 }), /entre 1 et 30/);
    assert.throws(() => ab.createTest(A, page.id, { attributionDays: 31 }), /entre 1 et 30/);
    assert.throws(() => ab.createTest(A, page.id, { minViews: 5 }), /entre 30 et 100 000/);
    const t = ab.createTest(A, page.id, { goal: "purchase", confidence: 99, attributionDays: 14, minViews: 500, description: "Hypothèse" });
    assert.equal(t.goalKey, "purchase"); assert.equal(t.confidence, 99); assert.equal(t.attribution_days, 14); assert.equal(t.minViewsEff, 500); assert.equal(t.description, "Hypothèse");
    assert.equal(t.goal, "signup", "l'ancienne colonne reste valide pour les anciens écrans");
  });
});

describe("statuts et transitions", () => {
  test("brouillon → en cours → pause → reprise → terminé ; transitions incohérentes refusées", () => {
    const { t } = newTest();
    assert.throws(() => ab.stopTest(A, t.id), /pas en cours/);
    assert.throws(() => ab.decideTest(A, t.id, "a"), /Seul un test démarré/);
    startable(t);
    assert.equal(ab.getTest(A, t.id).status, "running");
    assert.equal(ab.stopTest(A, t.id).status, "stopped");
    assert.equal(ab.startTest(A, t.id).status, "running", "reprise");
    assert.equal(ab.decideTest(A, t.id, "a").status, "completed");
    assert.throws(() => ab.startTest(A, t.id), /Transition impossible/);
    assert.throws(() => ab.stopTest(A, t.id), /pas en cours/);
    assert.throws(() => ab.updateTest(A, t.id, { name: "x" }), /terminé/);
  });
  test("pendant un test en cours : objectif, répartition, confiance et fenêtre ne bougent pas (pas de seuil choisi après coup)", () => {
    const { t } = newTest();
    startable(t);
    for (const change of [{ goal: "click" }, { trafficB: 70 }, { confidence: 99 }, { attributionDays: 3 }, { minViews: 50 }]) assert.throws(() => ab.updateTest(A, t.id, change), /pause/, JSON.stringify(change));
    assert.equal(ab.updateTest(A, t.id, { name: "Nom changé", description: "ok" }).name, "Nom changé");
    ab.stopTest(A, t.id);
    assert.equal(ab.updateTest(A, t.id, { trafficB: 70 }).traffic_b, 70, "en pause, les réglages se modifient");
  });
  test("archivage : jamais de suppression d'un test qui a des données ; archivé → impossible à démarrer sans restauration", () => {
    const { t } = newTest();
    startable(t);
    ab.recordView(db, ab.getTest(A, t.id), "v1");
    assert.throws(() => ab.deleteTest(A, t.id), /ne se supprime pas/);
    assert.throws(() => ab.archiveTest(A, t.id), /Terminez/);
    ab.decideTest(A, t.id, "a");
    assert.throws(() => ab.deleteTest(A, t.id), /ne se supprime pas/);
    const archived = ab.archiveTest(A, t.id);
    assert.equal(archived.archived, true);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ?", t.id).n, 1, "les données sont conservées");
    assert.throws(() => ab.startTest(A, t.id), /archivé/);
    assert.throws(() => ab.updateTest(A, t.id, { name: "x" }), /archivé/);
    assert.equal(ab.restoreTest(A, t.id).archived, false);
  });
  test("un brouillon sans donnée se supprime avec sa copie B", () => {
    const { t } = newTest();
    const copy = t.variant_page_id;
    ab.deleteTest(A, t.id);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_tests WHERE id = ?", t.id).n, 0);
    assert.equal(pages.getPage(A, copy), null);
  });
  test("une page testée (A ou B) ne part pas à la corbeille tant que le test n'est pas terminé", () => {
    const { page, t } = newTest();
    assert.throws(() => pages.archivePage(A, page.id), /utilisée par le test A\/B/);
    assert.throws(() => pages.archivePage(A, t.variant_page_id), /utilisée par le test A\/B/);
    startable(t);
    assert.throws(() => pages.archivePage(A, page.id), /utilisée par le test A\/B/);
    ab.decideTest(A, t.id, "a");
    pages.archivePage(A, page.id);
    assert.ok(pages.getPage(A, page.id).archived_at);
  });
});

describe("validation avant démarrage", () => {
  test("page hors ligne, version B supprimée, autre test en cours, site incohérent : démarrage bloqué", () => {
    const { page, t } = newTest();
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(page.id);
    assert.match(ab.validateStart(A, ab.getTest(A, t.id)).blocking.join(" "), /doit être en ligne/);
    assert.throws(() => ab.startTest(A, t.id), /doit être en ligne/);
    publishRaw(page.id);
    db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(t.variant_page_id);
    assert.match(ab.validateStart(A, ab.getTest(A, t.id)).blocking.join(" "), /version B a été supprimée/);
    const t2 = ab.getTest(A, t.id);
    const other = run("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Autre')");
    db.prepare("UPDATE mk_page_tests SET site_id = ? WHERE id = ?").run(other, t.id);
    assert.match(ab.validateStart(A, ab.getTest(A, t.id)).blocking.join(" "), /site/);
    assert.ok(t2);
  });
  test("version B identique à A : refusée ; B différente : démarre et se fige", () => {
    const { t } = newTest();
    assert.throws(() => ab.startTest(A, t.id), /identique à la version A/);
    const started = startable(t);
    assert.equal(started.variantB.sections.find((s) => s.type === "hero").title, "Titre B");
  });
});

describe("affectation collante et exposition", () => {
  test("un visiteur qui a accepté le suivi garde sa version même si la répartition change ensuite", () => {
    const { t } = newTest({ trafficB: 50 });
    const started = startable(t);
    const first = ab.assignment(db, started, { vid: vid(1), fingerprint: "empreinte-1" });
    assert.equal(first.consent, true); assert.equal(first.visitor, vid(1));
    ab.recordView(db, started, first.visitor, Date.now(), { consent: true });
    // Répartition extrême : un nouveau visiteur est presque toujours dans A, mais le visiteur déjà exposé garde sa version
    db.prepare("UPDATE mk_page_tests SET traffic_b = CASE WHEN ? = 'b' THEN 10 ELSE 90 END WHERE id = ?").run(first.variant, t.id);
    const again = ab.assignment(db, ab.getTest(A, t.id), { vid: vid(1), fingerprint: "autre-empreinte-un-autre-jour" });
    assert.equal(again.variant, first.variant, "même version à la deuxième visite, même avec une autre empreinte du jour");
    assert.equal(again.visitor, vid(1));
  });
  test("sans accord : la clé est l'empreinte du jour (aucun identifiant persistant) et la version tient pour la journée", () => {
    const { t } = newTest();
    const started = startable(t);
    const a = ab.assignment(db, started, { vid: null, fingerprint: "abc" });
    assert.equal(a.consent, false); assert.equal(a.visitor, "abc");
    assert.equal(ab.assignment(db, started, { vid: null, fingerprint: "abc" }).variant, a.variant);
  });
  test("répartition réelle proche de la part réglée (70/30, 90/10), déterminée par empreinte et non par hasard", () => {
    const { t } = newTest({ trafficB: 30 });
    const started = startable(t);
    const n = { a: 0, b: 0 };
    for (let i = 0; i < 4000; i++) n[ab.variantFor(started, vid(i))] += 1;
    assert.ok(n.b > 1100 && n.b < 1300, JSON.stringify(n));
    assert.equal(ab.variantFor(started, vid(7)), ab.variantFor(started, vid(7)));
  });
  test("une exposition par visiteur et par test ; conversion seulement après exposition, une fois, dans la fenêtre d'attribution", () => {
    const { t } = newTest({ goal: "click", attributionDays: 2 });
    const started = startable(t);
    const t0 = Date.now();
    assert.equal(ab.recordConversion(db, started, "inconnu", "click", t0), false, "sans exposition");
    ab.recordView(db, started, "v1", t0); ab.recordView(db, started, "v1", t0 + 1000);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_test_events WHERE type = 'view'").n, 1);
    assert.equal(ab.recordConversion(db, started, "v1", "signup", t0 + 5000), false, "autre objectif");
    assert.equal(ab.recordConversion(db, started, "v1", "click", t0 + 3 * DAY), false, "hors fenêtre de 2 jours");
    assert.equal(ab.recordConversion(db, started, "v1", "click", t0 + DAY), true);
    assert.equal(ab.recordConversion(db, started, "v1", "click", t0 + DAY + 1), false, "une seule conversion");
  });
  test("test en pause : plus de test actif pour la page (tout le monde voit A), données intactes", () => {
    const { page, t } = newTest();
    const started = startable(t);
    ab.recordView(db, started, "v1");
    assert.ok(ab.runningTestFor(db, page.id));
    ab.stopTest(A, t.id);
    assert.equal(ab.runningTestFor(db, page.id), null);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ?", t.id).n, 1);
  });
});

describe("verdict : jamais de gagnant hâtif", () => {
  test("états : insuffisant → non concluant → significatif sans gagnant (moins de 7 jours) → gagnant", () => {
    const { t } = newTest({ confidence: 95 });
    startable(t);
    fill(t, "a", 50, 10, "a"); fill(t, "b", 50, 30, "b");
    let r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.verdict.kind, "insufficient"); assert.equal(r.verdict.leader, "b", "B est en tête mais ça ne prouve rien");
    db.prepare("DELETE FROM mk_page_test_events").run();
    fill(t, "a", 400, 40, "a"); fill(t, "b", 400, 42, "b");
    r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.verdict.kind, "inconclusive");
    db.prepare("DELETE FROM mk_page_test_events").run();
    fill(t, "a", 1000, 100, "a"); fill(t, "b", 1000, 140, "b");
    r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.verdict.kind, "significant"); assert.match(r.verdict.reasons.join(" "), /pas encore 7 jours/);
    db.prepare("UPDATE mk_page_tests SET started_at = datetime('now', '-8 days') WHERE id = ?").run(t.id);
    r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.verdict.kind, "winner"); assert.equal(r.verdict.winner, "b"); assert.equal(r.verdict.uplift, 40);
    assert.ok(r.verdict.p < 0.05);
  });
  test("le même écart est un gagnant à 95 % et seulement « significatif ou non concluant » à 99 %", () => {
    const { t } = newTest({ confidence: 99 });
    startable(t);
    db.prepare("UPDATE mk_page_tests SET started_at = datetime('now', '-9 days') WHERE id = ?").run(t.id);
    fill(t, "a", 1000, 100, "a"); fill(t, "b", 1000, 130, "b");
    assert.equal(ab.results(A, ab.getTest(A, t.id)).verdict.kind, "inconclusive");
    db.prepare("UPDATE mk_page_tests SET status = 'stopped' WHERE id = ?").run(t.id);
    db.prepare("UPDATE mk_page_tests SET confidence = 95 WHERE id = ?").run(t.id);
    assert.equal(ab.results(A, ab.getTest(A, t.id)).verdict.kind, "winner");
  });
  test("alerte « test concluant » : seulement un test EN COURS au verdict gagnant ; données insuffisantes, pause ou test récent : aucune alerte", () => {
    const { t } = newTest();
    startable(t);
    assert.deepEqual(ab.concludedTests(A), [], "aucune donnée : pas d'alerte");
    fill(t, "a", 1000, 100, "a"); fill(t, "b", 1000, 140, "b");
    assert.deepEqual(ab.concludedTests(A), [], "moins de 7 jours : seulement « significatif »");
    db.prepare("UPDATE mk_page_tests SET started_at = datetime('now', '-8 days') WHERE id = ?").run(t.id);
    const c = ab.concludedTests(A);
    assert.equal(c.length, 1); assert.equal(c[0].id, t.id); assert.equal(c[0].winner, "b"); assert.equal(c[0].uplift, 40);
    db.prepare("UPDATE mk_page_tests SET status = 'stopped' WHERE id = ?").run(t.id);
    assert.deepEqual(ab.concludedTests(A), [], "test en pause : pas d'alerte");
  });
  test("une anomalie de répartition empêche de déclarer un gagnant", () => {
    const { t } = newTest({ trafficB: 50 });
    startable(t);
    db.prepare("UPDATE mk_page_tests SET started_at = datetime('now', '-9 days') WHERE id = ?").run(t.id);
    fill(t, "a", 1500, 150, "a"); fill(t, "b", 600, 90, "b"); // 50/50 réglé, 71/29 observé
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.ok(r.anomalies.some((x) => x.code === "allocation" && x.level === "error"));
    assert.notEqual(r.verdict.kind, "winner");
  });
  test("qualité des données : conversions > visiteurs, page hors ligne, aucune exposition → anomalies, chiffres non corrigés", () => {
    const { page, t } = newTest();
    startable(t);
    let r = ab.results(A, ab.getTest(A, t.id));
    assert.ok(r.anomalies.some((x) => x.code === "no_exposure"));
    insert(t, "a", "x1", "conversion");
    r = ab.results(A, ab.getTest(A, t.id));
    assert.ok(r.anomalies.some((x) => x.code === "conversion_over_exposure"));
    assert.equal(r.variants.a.conversions, 1, "la donnée brute n'est pas corrigée en silence");
    db.prepare("UPDATE mk_landing_pages SET status = 'unpublished' WHERE id = ?").run(page.id);
    assert.ok(ab.results(A, ab.getTest(A, t.id)).anomalies.some((x) => x.code === "page_offline"));
  });
});

describe("achats lus dans la boutique (jamais recalculés ni devinés)", () => {
  const at = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
  function buyer(n, { test: testId, variant, expose, orderAt, cents = 5000, refund = 0, linkContact = true }) {
    const u = run("INSERT INTO users (username, email) VALUES (?, ?)", `acheteur${n}`, `acheteur${n}@x.fr`);
    bridge.syncLmsEvents({ ...A }, { limit: 500 });
    const contact = one("SELECT id FROM mk_contacts WHERE lms_user_id = ?", u).id;
    visitors.record(db, 1, { visitorId: vid(n), sessionId: "sess0001", events: [{ t: "page_view", p: "/p/x", d: "desktop" }], userAgent: "Mozilla/5.0 Firefox/120", now: expose });
    if (linkContact) visitors.linkVisitor(db, 1, vid(n), contact);
    if (variant) db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, ?, ?, 'view', ?, 1)").run(testId, variant, vid(n), expose);
    let order = null;
    if (orderAt) {
      order = run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, ?, ?)", u, cents, at(orderAt));
      if (refund) run("INSERT INTO order_refunds (order_id, stripe_refund_id, amount_cents) VALUES (?, ?, ?)", order, `re_${n}`, refund);
    }
    return { u, contact, order };
  }
  test("conversion = acheteurs ÷ visiteurs suivis ; chiffre d'affaires net des remboursements ; fenêtre d'attribution respectée", () => {
    const { t } = newTest({ goal: "purchase", attributionDays: 7 });
    startable(t);
    const base = Date.now() - 3 * DAY, T = { test: t.id };
    // A : 4 visiteurs suivis, 1 acheteur (50,00 €) ; B : 4 visiteurs suivis, 2 acheteurs (50 € + 70 €, 20 € remboursés)
    for (let i = 1; i <= 4; i++) buyer(i, { ...T, variant: "a", expose: base, orderAt: i === 1 ? base + DAY : null });
    buyer(11, { ...T, variant: "b", expose: base, orderAt: base + DAY, cents: 5000 });
    buyer(12, { ...T, variant: "b", expose: base, orderAt: base + 2 * DAY, cents: 7000, refund: 2000 });
    buyer(13, { ...T, variant: "b", expose: base });
    buyer(14, { ...T, variant: "b", expose: base, orderAt: base + 10 * DAY - 1, cents: 9900 }); // hors fenêtre de 7 jours : non attribué
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.goal, "purchase");
    assert.deepEqual([r.variants.a.views, r.variants.a.conversions, r.variants.b.views, r.variants.b.conversions], [4, 1, 4, 2]);
    assert.equal(r.commerce.variants.a.netCents, 5000);
    assert.equal(r.commerce.variants.b.grossCents, 12000); assert.equal(r.commerce.variants.b.refundCents, 2000); assert.equal(r.commerce.variants.b.netCents, 10000);
    assert.equal(r.commerce.variants.b.revenuePerVisitorCents, 2500, "100 € nets ÷ 4 visiteurs suivis");
    assert.equal(r.commerce.variants.b.avgOrderCents, 6000);
    assert.equal(r.verdict.kind, "insufficient", "8 visiteurs : jamais de gagnant");
  });
  test("un achat sans visite suivie reliée à un contact n'est attribué à personne ; un visiteur vu dans A et B est exclu des deux", () => {
    const { t } = newTest({ goal: "purchase" });
    startable(t);
    const base = Date.now() - 2 * DAY;
    // Visiteur non relié à un contact : son achat ne peut pas être attribué
    buyer(21, { test: t.id, variant: "a", expose: base, orderAt: base + DAY, linkContact: false });
    // Même personne sur deux appareils, deux versions
    const dual = buyer(22, { test: t.id, variant: "a", expose: base, orderAt: base + DAY });
    visitors.record(db, 1, { visitorId: vid(23), sessionId: "sess0002", events: [{ t: "page_view", p: "/p/x", d: "mobile" }], userAgent: "Mozilla/5.0 Firefox/120", now: base });
    visitors.linkVisitor(db, 1, vid(23), dual.contact);
    db.prepare("INSERT INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, 'b', ?, 'view', ?, 1)").run(t.id, vid(23), base);
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.commerce.variants.a.orders, 0, "l'achat du visiteur non relié n'est attribué à aucune version");
    assert.equal(r.commerce.variants.b.orders, 0);
    assert.equal(r.commerce.ambiguous, 1);
    assert.equal(r.commerce.variants.a.units, 1, "seul le visiteur non relié compte encore (sans achat attribuable)");
  });
  test("test d'inscription : le chiffre d'affaires s'affiche en secondaire sans changer le taux de conversion", () => {
    const { t } = newTest({ goal: "signup" });
    startable(t);
    const base = Date.now() - 2 * DAY;
    buyer(31, { test: t.id, variant: "b", expose: base, orderAt: base + DAY, cents: 3000 });
    fill(t, "a", 10, 1, "ax");
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.equal(r.commerce.variants.b.netCents, 3000);
    assert.equal(r.variants.b.conversions, 0, "le taux principal reste celui de l'inscription");
  });
});

describe("liste, recherche et isolation par site", () => {
  test("filtres de statut, recherche, tri, pagination", () => {
    for (let i = 0; i < 7; i++) newTest({ name: `Test numéro ${i}` });
    const { t } = newTest({ name: "Bandeau spécial" });
    startable(t);
    const all = ab.searchTests(A, { size: 5 });
    assert.equal(all.total, 8); assert.equal(all.pages, 2); assert.equal(all.rows.length, 5);
    assert.equal(ab.searchTests(A, { status: "running" }).total, 1);
    assert.equal(ab.searchTests(A, { status: "draft" }).total, 7);
    assert.equal(ab.searchTests(A, { q: "spécial" }).rows[0].name, "Bandeau spécial");
    assert.equal(ab.searchTests(A, { q: "%" }).total, 0, "les caractères joker sont neutralisés");
    assert.equal(ab.searchTests(A, { sort: "name" }).rows[0].name, "Bandeau spécial");
    assert.equal(ab.searchTests(A, { status: "archived" }).total, 0);
    assert.deepEqual([all.counts.all, all.counts.draft, all.counts.running], [8, 7, 1]);
  });
  test("accès limité à un site : ni la liste, ni la lecture, ni la création sur un autre site (IDOR)", () => {
    const s1 = run("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha')"), s2 = run("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Bravo')");
    const a = newTest({ name: "Test alpha" }, { site: s1 }), b = newTest({ name: "Test bravo" }, { site: s2 });
    assert.equal(a.t.site_id, s1); assert.equal(b.t.site_id, s2);
    const scoped = { ...A, siteScope: s1 };
    assert.deepEqual(ab.listTests(scoped).map((t) => t.name), ["Test alpha"]);
    assert.equal(ab.getTest(scoped, b.t.id), null);
    assert.throws(() => ab.startTest(scoped, b.t.id), /introuvable/);
    assert.throws(() => ab.decideTest(scoped, b.t.id, "a"), /introuvable/);
    assert.throws(() => ab.createTest(scoped, b.page.id, { name: "intrus" }), /introuvable/);
    assert.equal(ab.searchTests(scoped, {}).total, 1);
  });
  test("la version B et la page testée sont dans le même site", () => {
    const s1 = run("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha')");
    const { page, t } = newTest({}, { site: s1 });
    assert.equal(pages.getPage(A, t.variant_page_id).site_id, s1);
    assert.equal(page.site_id, s1);
  });
});

describe("performance", () => {
  test("affectation : une requête indexée par page vue (5 000 affectations rapides) ; résultats sur 20 000 événements en moins d'une seconde", () => {
    const { t } = newTest();
    const started = startable(t);
    const plan = db.prepare("EXPLAIN QUERY PLAN SELECT variant FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'").all(t.id, "x").map((r) => r.detail).join(" ");
    assert.match(plan, /USING (COVERING )?INDEX|PRIMARY KEY|UNIQUE/i, plan);
    const t0 = Date.now();
    for (let i = 0; i < 5000; i++) ab.assignment(db, started, { vid: vid(i), fingerprint: `f${i}` });
    assert.ok(Date.now() - t0 < 1500, `5 000 affectations en ${Date.now() - t0} ms`);
    db.exec("BEGIN");
    for (let i = 0; i < 10000; i++) { insert(t, i % 2 ? "a" : "b", `p${i}`, "view"); if (i % 10 === 0) insert(t, i % 2 ? "a" : "b", `p${i}`, "conversion"); }
    db.exec("COMMIT");
    const t1 = Date.now();
    const r = ab.results(A, ab.getTest(A, t.id));
    assert.ok(Date.now() - t1 < 1000, `résultats en ${Date.now() - t1} ms`);
    assert.equal(r.exposures.a + r.exposures.b, 10000);
  });
});
