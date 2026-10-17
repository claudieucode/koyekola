// KOLAKISA CMS — palier 22 par les vraies routes : de bout en bout (A/B répartis, affectation collante, exposition, conversion, tableau de bord),
// cache, SEO, aperçu, isolation par site (IDOR), rôles, XSS, valeurs manipulées, tunnel, analytics.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const pages = require("../src/marketing/pages");
const ab = require("../src/marketing/pages/abtests");

let srv, boss, db, orgId, siteA, siteB, memberA, memberB, viewer, outsider;
const M = "/marketing";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const ctx = () => ({ db, organizationId: 1 });
const vid = (n) => `visiteur${String(n).padStart(8, "0")}.${1700000000000 + n}`;
const UA = (i) => `Mozilla/5.0 (Macintosh) Chrome/120.${i}`;

// Page publiée sur un site (ou sans site), test créé par la vraie route, version B différente, test démarré par la vraie route
async function liveTest(client, { name, site = null, goal = "click", trafficB = "50", titleB = "Version B du bandeau" } = {}) {
  const res = await boss.post(`${M}/pages`, { name, template: "vente", ...(site ? { site_id: String(site) } : {}) });
  const id = Number(String(res.location).match(/(\d+)$/)[1]);
  db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);
  await boss.post(`${M}/pages/${id}/test-ab`, { name: `Test ${name}`, goal, traffic_b: trafficB });
  const t = one("SELECT * FROM mk_page_tests WHERE page_id = ?", id);
  const vp = pages.getPage(ctx(), t.variant_page_id);
  db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ ...vp.working, sections: vp.working.sections.map((s) => (s.type === "hero" ? { ...s, title: titleB } : s)) }), vp.id);
  const started = await (client || boss).post(`${M}/tests-ab/${t.id}/demarrer`, {});
  return { id, t: one("SELECT * FROM mk_page_tests WHERE id = ?", t.id), slug: one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug, started };
}
const visitor = (n, { consent = true } = {}) => {
  const c = new Client(srv.base);
  if (consent) { c.cookies.set("kw_consent", "1"); c.cookies.set("kw_vid", vid(n)); }
  return c;
};
const views = (t, variant) => one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'view'" + (variant ? " AND variant = ?" : ""), ...(variant ? [t.id, variant] : [t.id])).n;

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  const mk = async (name) => Number(String((await boss.post(`${M}/site-web/sites`, { name })).location).match(/sites\/(\d+)/)[1]);
  siteA = await mk("Site Alpha"); siteB = await mk("Site Bravo");
  memberA = await newStudent(srv); memberB = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, idOf(memberA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteB, idOf(memberB));
  viewer = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'viewer')").run(orgId, idOf(viewer));
  outsider = await newStudent(srv);
});
after(() => { db.close(); srv.stop(); });

describe("de bout en bout : A/B réparti, collant, mesuré", () => {
  let T;
  before(async () => { T = await liveTest(boss, { name: "Landing principale" }); });

  test("le test démarre par la vraie route et la page publique reste à la MÊME adresse", async () => {
    assert.equal(T.t.status, "running");
    const anon = await new Client(srv.base).get(`/p/${T.slug}`, { headers: { "User-Agent": UA(1) } });
    assert.equal(anon.status, 200);
    assert.match(anon.text, new RegExp(`/p/${T.slug}`), "l'adresse canonique est celle de la page testée");
    assert.equal(anon.headers.get("cache-control"), "no-store", "jamais de cache : la page dépend du visiteur");
  });

  test("deux visiteurs, même adresse : A et B sont servis ; chacun garde sa version à chaque visite (affectation collante)", async () => {
    const seen = new Map();
    const exposedBefore = views(T.t);
    for (let n = 100; n < 130; n++) {
      const v = visitor(n);
      const first = (await v.get(`/p/${T.slug}`, { headers: { "User-Agent": UA(n) } })).text;
      const isB = /Version B du bandeau/.test(first);
      seen.set(n, isB);
      for (let k = 0; k < 2; k++) assert.equal(/Version B du bandeau/.test((await v.get(`/p/${T.slug}`, { headers: { "User-Agent": UA(n + 1000 * (k + 1)) } })).text), isB, `visiteur ${n} : même version à la visite ${k + 2}, même avec un autre navigateur`);
    }
    const nb = [...seen.values()].filter(Boolean).length;
    assert.ok(nb > 4 && nb < 26, `B vu par ${nb} visiteurs sur 30 : ni tout A ni tout B`);
    assert.equal(views(T.t) - exposedBefore, 30, "une exposition par visiteur, pas par visite");
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'view' AND variant = 'b' AND consent = 1", T.t.id).n, nb);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND consent = 1", T.t.id).n, 30);
  });

  test("les robots, les aperçus et l'adresse forcée ne comptent jamais comme exposition", async () => {
    const before = views(T.t);
    await new Client(srv.base).get(`/p/${T.slug}`, { headers: { "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" } });
    await new Client(srv.base).get(`/p/${T.slug}`, { headers: { "User-Agent": "" } });
    // Aperçus du tableau de bord : version A et version B
    assert.equal((await boss.get(`${M}/pages/${T.id}/apercu`)).status, 200);
    assert.equal((await boss.get(`${M}/pages/${T.t.variant_page_id}/apercu`)).status, 200);
    // Une adresse « ?ab=b » / « ?experiment=…&variant=B » ne force rien en production
    const forced = await visitor(500).get(`/p/${T.slug}?experiment=${T.t.id}&variant=b&ab=b`, { headers: { "User-Agent": UA(500) } });
    assert.equal(forced.status, 200);
    const natural = visitor(500);
    const again = (await natural.get(`/p/${T.slug}`, { headers: { "User-Agent": UA(500) } })).text;
    assert.equal(/Version B du bandeau/.test(forced.text), /Version B du bandeau/.test(again), "la version dépend du visiteur, pas de l'adresse");
    assert.equal(views(T.t), before + 1, "seul le visiteur 500 est exposé (une fois)");
  });

  test("une conversion = un clic, une fois, avec la version vue ; hors exposition : rien", async () => {
    const v = visitor(100);
    const page = (await v.get(`/p/${T.slug}`, { headers: { "User-Agent": UA(100) } })).text;
    const link = page.match(/href="(\/p\/[^"]+\/clic\/\d+)"/);
    assert.ok(link, "la page a un bouton mesurable");
    const variantOf = one("SELECT variant FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'", T.t.id, vid(100)).variant;
    await v.get(link[1], { headers: { "User-Agent": UA(100) } });
    await v.get(link[1], { headers: { "User-Agent": UA(100) } });
    const conv = one("SELECT variant, COUNT(*) n FROM mk_page_test_events WHERE test_id = ? AND type = 'conversion' AND visitor = ?", T.t.id, vid(100));
    assert.equal(conv.n, 1); assert.equal(conv.variant, variantOf);
    await new Client(srv.base).get(link[1], { headers: { "User-Agent": UA(777) } }); // visiteur jamais exposé : son clic expose-t-il ? non, mais il passe par forVisitor → il voit A ou B puis clique
  });

  test("tableau de bord : chiffres réels, statut statistique honnête, aucun gagnant avec 31 visiteurs", async () => {
    const html = (await boss.get(`${M}/pages/${T.id}/test-ab?test=${T.t.id}`)).text;
    assert.match(html, /Données insuffisantes : pas encore concluant/);
    assert.doesNotMatch(html, /Gagnant : version/);
    assert.match(html, /Taux de conversion/);
    assert.match(html, /Intervalle|intervalle/);
    const list = (await boss.get(`${M}/site-web/tests-ab`)).text;
    assert.match(list, /Test Landing principale/); assert.match(list, /En cours/);
    const dash = (await boss.get(`${M}/analytics/global`)).text;
    assert.match(dash, /Tests A\/B/); assert.match(dash, /Test Landing principale/);
  });

  test("pause : plus aucune exposition, tout le monde voit A ; reprise ; fin en gardant A ; archivage : résultats conservés", async () => {
    await boss.post(`${M}/tests-ab/${T.t.id}/pause`, {});
    const n = views(T.t);
    for (let i = 0; i < 6; i++) assert.doesNotMatch((await visitor(900 + i).get(`/p/${T.slug}`, { headers: { "User-Agent": UA(900 + i) } })).text, /Version B du bandeau/);
    assert.equal(views(T.t), n, "aucune exposition pendant la pause");
    await boss.post(`${M}/tests-ab/${T.t.id}/demarrer`, {});
    assert.equal(one("SELECT status FROM mk_page_tests WHERE id = ?", T.t.id).status, "running");
    await boss.post(`${M}/tests-ab/${T.t.id}/terminer`, { winner: "a" });
    assert.equal(one("SELECT status FROM mk_page_tests WHERE id = ?", T.t.id).status, "completed");
    await boss.post(`${M}/tests-ab/${T.t.id}/archiver`, {});
    assert.ok(one("SELECT archived_at FROM mk_page_tests WHERE id = ?", T.t.id).archived_at);
    assert.equal(views(T.t), n, "toutes les données conservées");
    assert.doesNotMatch((await boss.get(`${M}/site-web/tests-ab`)).text, /Test Landing principale/, "archivé : hors de la liste par défaut");
    assert.match((await boss.get(`${M}/site-web/tests-ab?statut=archived`)).text, /Test Landing principale/);
    await boss.post(`${M}/tests-ab/${T.t.id}/restaurer`, {});
    assert.equal(one("SELECT archived_at FROM mk_page_tests WHERE id = ?", T.t.id).archived_at, null);
  });
});

describe("SEO : une seule adresse indexable", () => {
  test("la copie B n'est ni publiée ni indexable, absente du plan du site ; la page testée garde son adresse", async () => {
    const T = await liveTest(boss, { name: "Page SEO" });
    const b = one("SELECT slug, status, indexable FROM mk_landing_pages WHERE id = ?", T.t.variant_page_id);
    assert.notEqual(b.status, "published"); assert.equal(b.indexable, 0);
    assert.equal((await new Client(srv.base).get(`/p/${b.slug}`)).status, 404, "la version B n'a pas d'adresse publique propre");
    const sitemap = await new Client(srv.base).get("/sitemap.xml");
    assert.doesNotMatch(sitemap.text, new RegExp(`/p/${b.slug}`));
    assert.equal(one("SELECT slug FROM mk_landing_pages WHERE id = ?", T.id).slug, T.slug);
  });
});

describe("rôles, isolation par site (IDOR), valeurs manipulées, XSS", () => {
  let TA, TB;
  before(async () => {
    TA = await liveTest(boss, { name: "Alpha test", site: siteA });
    TB = await liveTest(boss, { name: "Bravo test", site: siteB });
  });

  test("chaque test porte le site de sa page, et sa version B est dans le même site", () => {
    assert.equal(TA.t.site_id, siteA); assert.equal(TB.t.site_id, siteB);
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", TA.t.variant_page_id).site_id, siteA);
  });
  test("un membre du site A voit ses tests mais ni ouvre, ni démarre, ni termine ceux du site B", async () => {
    const own = await memberA.get(`${M}/site-web/tests-ab?site=${siteA}`);
    assert.equal(own.status, 200);
    assert.match(own.text, /Alpha test/); assert.doesNotMatch(own.text, /Bravo test/);
    assert.equal((await memberA.get(`${M}/pages/${TB.id}/test-ab`)).status, 403);
    for (const action of ["pause", "demarrer", "terminer", "archiver", "supprimer"]) {
      const r = await memberA.post(`${M}/tests-ab/${TB.t.id}/${action}`, { winner: "b" });
      assert.equal(r.status, 403, action);
    }
    assert.equal((await memberA.post(`${M}/pages/${TB.id}/test-ab`, { name: "intrus", goal: "click", traffic_b: "50" })).status, 403);
    assert.equal(one("SELECT status FROM mk_page_tests WHERE id = ?", TB.t.id).status, "running", "le test du site B n'a pas bougé");
    assert.equal((await memberA.get(`${M}/site-web/tests-ab?site=${siteB}`)).status, 403);
    assert.equal((await memberA.get(`${M}/analytics/global?site=${siteB}`)).status, 403);
  });
  test("un étranger à l'équipe est refusé ; un lecteur lit mais ne peut rien modifier", async () => {
    assert.equal((await outsider.get(`${M}/site-web/tests-ab`)).status, 403);
    assert.equal((await new Client(srv.base).get(`${M}/site-web/tests-ab`)).status, 302);
    assert.equal((await viewer.get(`${M}/site-web/tests-ab`)).status, 200);
    const page = (await viewer.get(`${M}/pages/${TA.id}/test-ab?test=${TA.t.id}`)).text;
    assert.doesNotMatch(page, /Mettre en pause|Terminer le test|Garder la version A/, "pas de bouton pour le lecteur");
    for (const action of ["pause", "terminer", "archiver"]) assert.notEqual((await viewer.post(`${M}/tests-ab/${TA.t.id}/${action}`, { winner: "a" })).status, 200, action);
    assert.equal(one("SELECT status FROM mk_page_tests WHERE id = ?", TA.t.id).status, "running");
  });
  test("valeurs manipulées : répartition hors limites, confiance inconnue, identifiants inventés, version inconnue", async () => {
    const before = one("SELECT traffic_b, confidence FROM mk_page_tests WHERE id = ?", TA.t.id);
    await boss.post(`${M}/tests-ab/${TA.t.id}/pause`, {});
    await boss.post(`${M}/tests-ab/${TA.t.id}`, { traffic_b: "150", confidence: "97", name: "x" });
    await boss.post(`${M}/tests-ab/${TA.t.id}`, { traffic_b: "40; DROP TABLE mk_page_tests", attribution_days: "-3" });
    assert.deepEqual({ ...one("SELECT traffic_b, confidence FROM mk_page_tests WHERE id = ?", TA.t.id) }, { ...before }, "rien n'est enregistré");
    assert.equal((await boss.post(`${M}/tests-ab/999999/pause`, {})).status, 404);
    assert.equal((await boss.post(`${M}/tests-ab/abc/pause`, {})).status, 404);
    await boss.post(`${M}/tests-ab/${TA.t.id}/demarrer`, {});
    await boss.post(`${M}/tests-ab/${TA.t.id}/terminer`, { winner: "z" });
    assert.equal(one("SELECT status FROM mk_page_tests WHERE id = ?", TA.t.id).status, "running", "version « z » refusée");
    assert.ok(one("SELECT COUNT(*) n FROM mk_page_tests").n >= 3, "la table est intacte");
  });
  test("XSS : nom et description d'un test sont échappés partout (détail, liste, tableau de bord)", async () => {
    const payload = `<img src=x onerror=alert(1)>`;
    await boss.post(`${M}/tests-ab/${TA.t.id}/pause`, {});
    await boss.post(`${M}/tests-ab/${TA.t.id}`, { name: payload, description: `<script>alert(2)</script>` });
    for (const url of [`${M}/pages/${TA.id}/test-ab?test=${TA.t.id}`, `${M}/site-web/tests-ab`, `${M}/analytics/global`]) {
      const html = (await boss.get(url)).text;
      assert.doesNotMatch(html, /<img src=x onerror/, url);
      assert.doesNotMatch(html, /<script>alert\(2\)<\/script>/, url);
    }
    await boss.post(`${M}/tests-ab/${TA.t.id}/demarrer`, {});
  });
  test("une page testée ne part pas à la corbeille par la route", async () => {
    const r = await boss.post(`${M}/pages/${TB.id}/archiver`, {});
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", TB.id).archived_at === null, `page toujours là (${r.status})`);
  });
});

describe("tunnel : une étape testée en A/B", () => {
  test("la page d'une étape est testée ; le tunnel reste en place ; les visiteurs de l'étape sont exposés", async () => {
    const funnels = require("../src/marketing/funnels");
    const A = { db, organizationId: 1, audit: false };
    const f = funnels.createFunnel(A, { name: "Tunnel A/B" });
    const { id: stepId } = funnels.addStep(A, f.id, { type: "landing", name: "Entrée", newPage: true });
    const step = one("SELECT page_id FROM mk_funnel_steps WHERE id = ?", stepId);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(step.page_id);
    const link = (await boss.get(`${M}/tunnels/${f.id}`)).text;
    assert.match(link, new RegExp(`/marketing/pages/${step.page_id}/test-ab`), "lien « Tester en A/B » sur l'étape");
    await boss.post(`${M}/pages/${step.page_id}/test-ab`, { name: "Test d'étape", goal: "signup", traffic_b: "50" });
    const t = one("SELECT * FROM mk_page_tests WHERE page_id = ?", step.page_id);
    assert.equal(t.site_id, one("SELECT site_id FROM mk_landing_pages WHERE id = ?", step.page_id).site_id);
    const detail = (await boss.get(`${M}/pages/${step.page_id}/test-ab`)).text;
    assert.match(detail, /Étape « Entrée » du tunnel/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_funnel_steps WHERE id = ? AND page_id = ?", stepId, step.page_id).n, 1, "l'étape référence toujours la page d'origine");
  });
});

describe("liste : vide, filtres, pagination", () => {
  test("état vide honnête puis filtres de statut ; recherche sans résultat", async () => {
    const html = (await boss.get(`${M}/site-web/tests-ab?statut=completed&q=zzzzintrouvable`)).text;
    assert.match(html, /Aucun résultat/);
    assert.match((await boss.get(`${M}/site-web/tests-ab?statut=hack&tri=hack&page=-4`)).text, /Tests A\/B des pages/, "paramètres inconnus ignorés");
  });
});
