// Analytics du Site Web (phase 7) : audience mesurée (provenance, nouveaux / récurrents, appareils, conversions) et
// entonnoir d'une page (sections atteintes dans l'ordre, formulaire, plus forte perte seulement avec un échantillon
// suffisant). Uniquement des comptages réels des visites suivies avec accord.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const analytics = require("../src/marketing/pages/analytics");
const { startServer, loginInstructor } = require("./helpers");

const DAY = 86400000;
function seed(db, { visitors = 40, reachHero = 35, reachFeatures = 20, formView = 18, submit = 5, now = Date.now() } = {}) {
  db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, status) VALUES (1, 'Offre', 'offre', 'published')").run();
  const vis = db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen, sessions) VALUES (?, 1, ?, ?, 1)");
  const ev = db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, target, referrer, utm_source, device, occurred_at) VALUES (1, ?, 'sessionsession', ?, '/p/offre', ?, ?, ?, ?, ?)");
  for (let i = 0; i < visitors; i++) {
    const id = `${String(i).padStart(32, "v")}.${now - (i < 10 ? 90 : 1) * DAY}`; // 10 déjà venus il y a 90 jours
    vis.run(id, Number(id.split(".")[1]), now);
    const src = i % 2 ? ["", "facebook"] : i % 3 ? ["google.com", ""] : ["", ""];
    ev.run(id, "session_start", "", src[0], src[1], i % 4 ? "desktop" : "mobile", now - 1000);
    ev.run(id, "page_view", "", "", "", "", now - 900);
    if (i < reachHero) ev.run(id, "section_view", "hero:aaaaaa111111", "", "", "", now - 800);
    if (i < reachFeatures) ev.run(id, "section_view", "features:bbbbbb222222", "", "", "", now - 700);
    if (i < formView) ev.run(id, "form_view", "/p/offre/inscription", "", "", "", now - 600);
    if (i < submit) ev.run(id, "form_submit", "Lettre", "", "", "", now - 500);
  }
}
const sections = [{ id: "aaaaaa111111", type: "hero", title: "Offre spéciale" }, { id: "zzzzzz999999", type: "divider" }, { id: "bbbbbb222222", type: "features", name: "Pourquoi nous" }, { id: "cccccc333333", type: "form" }];

describe("calculs", () => {
  test("entonnoir : étapes dans l'ordre de la page, passages, plus forte perte (échantillon suffisant)", () => {
    const { db, A } = freshMarketing();
    seed(db);
    const f = analytics.pageFunnel(A, { slug: "offre", sections });
    assert.deepEqual(f.steps.map((s) => [s.label, s.visitors]), [["Arrivée sur la page", 40], ["Offre spéciale", 35], ["Pourquoi nous", 20], ["Formulaire affiché", 18], ["Formulaire envoyé", 5]]);
    assert.equal(f.steps[2].passage, 57.1);
    assert.equal(f.steps[4].fromStart, 12.5, "formulaire envoyé : 5 sur 40");
    assert.deepEqual(f.worst, { from: "Offre spéciale", to: "Pourquoi nous", lost: 15, rate: 42.9 }, "les étapes de moins de 30 visiteurs ne sont pas jugées");
    assert.equal(f.enough, true);
  });

  test("trop peu de visiteurs : aucune conclusion", () => {
    const { db, A } = freshMarketing();
    seed(db, { visitors: 12, reachHero: 10, reachFeatures: 2, formView: 1, submit: 0 });
    const f = analytics.pageFunnel(A, { slug: "offre", sections });
    assert.equal(f.worst, null);
    assert.equal(f.enough, false);
    assert.equal(f.arrived, 12);
  });

  test("audience : nouveaux / récurrents, provenance (utm, site d'origine, accès direct) avec conversion, appareils", () => {
    const { db, A } = freshMarketing();
    seed(db);
    const a = analytics.audience(A, { days: 30 });
    assert.equal(a.visitors, 40);
    assert.equal(a.newVisitors, 30);
    assert.equal(a.returningVisitors, 10);
    assert.equal(a.converted, 5);
    assert.equal(a.conversion, 12.5);
    const by = Object.fromEntries(a.sources.map((s) => [s.channel, s]));
    assert.equal(by.facebook.sessions, 20);
    assert.equal(by["google.com"].sessions + by["Accès direct"].sessions, 20);
    assert.equal(by.facebook.leads + by["google.com"].leads + by["Accès direct"].leads, 5);
    assert.deepEqual(a.devices.map((d) => [d.device, d.sessions]), [["Ordinateur", 30], ["Mobile", 10]]);
    assert.equal(analytics.audience(A, { days: 30, now: Date.now() + 400 * DAY }).visitors, 0, "hors période : rien");
  });
});

describe("écrans (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("analyse d'une page et audience du tableau de bord, avec de vraies données", async () => {
    seed(db);
    const id = db.prepare("SELECT id FROM mk_landing_pages WHERE slug = 'offre'").get().id;
    db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify([{ id: "aaaaaa111111", type: "hero", title: "Offre spéciale", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }, { id: "bbbbbb222222", type: "features", name: "Pourquoi nous", title: "", intro: "", columns: 3, items: [{ title: "A", text: "" }] }, { id: "cccccc333333", type: "form", heading: "Inscription", intro: "" }]), id);
    const page = (await boss.get(`/marketing/pages/${id}/analyse`)).text;
    assert.match(page, /La plus forte perte se situe entre « Offre spéciale » et « Pourquoi nous »/);
    assert.match(page, /42,9 %/);
    assert.match(page, /5\. Formulaire envoyé<\/span><span class="mk-funnel-num">5 visiteurs · 12,5 %/);
    assert.match((await boss.get(`/marketing/pages/${id}`)).text, new RegExp(`href="/marketing/pages/${id}/analyse"`));
    const dash = (await boss.get("/marketing/site-web")).text;
    assert.match(dash, /Visiteurs mesurés<\/span><span class="mk-stat-value">40</);
    assert.match(dash, /Visiteurs récurrents<\/span><span class="mk-stat-value">10</);
    assert.match(dash, /<th scope="row" data-label="Source">facebook<\/th>/);
  });
});
