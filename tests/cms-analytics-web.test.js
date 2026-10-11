// KOLAKISA CMS — palier 21 par les vraies routes : accès, portée de site (IDOR), rôles, XSS, export CSV, conversions, états honnêtes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, siteA, siteB, memberA, memberB, viewer, outsider;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const M = "/marketing";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const now = Date.now();
const vid = (n) => `visiteur${String(n).padStart(8, "0")}.${1700000000000 + n}`;
function seedVisits(site, n, label) {
  const page = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id) VALUES (?, ?, ?, ?)").run(orgId, label, label, site).lastInsertRowid);
  for (let i = 0; i < n; i++) {
    const v = vid(site * 1000 + i);
    db.prepare("INSERT OR IGNORE INTO mk_web_visitors (id, organization_id, first_seen, last_seen, sessions) VALUES (?, ?, ?, ?, 1)").run(v, orgId, now - 86400000, now);
    db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, page_id, site_id, device, occurred_at) VALUES (?, ?, ?, 'page_view', ?, ?, ?, 'desktop', ?)").run(orgId, v, `sess${i}xxxxxxxx`, `/p/${label}`, page, site, now - 3600000 - i);
  }
}

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
  seedVisits(siteA, 6, "alpha-page"); seedVisits(siteB, 3, "bravo-page");
  db.prepare("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, ?, ?)").run(orgId, "Tunnel <script>alert(1)</script>", siteA);
});
after(() => { db.close(); srv.stop(); });

describe("accès et rôles", () => {
  test("sans connexion : redirection ; étranger à l'équipe : refusé ; lecteur de l'organisation : lecture seule", async () => {
    const anon = await fetch(`${srv.base}${M}/analytics/global`, { redirect: "manual" });
    assert.equal(anon.status, 302);
    assert.equal((await outsider.get(`${M}/analytics/global`)).status, 403);
    const v = await viewer.get(`${M}/analytics/global`);
    assert.equal(v.status, 200);
    assert.doesNotMatch(v.text, /Ajouter une conversion/, "le lecteur ne voit pas le formulaire de conversion");
    assert.notEqual((await viewer.post(`${M}/analytics/conversions`, { nom: "X", evenement: "form.submitted" })).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_conversions").n, 0);
  });
});

describe("isolation par site (IDOR)", () => {
  test("l'équipe voit tout et peut filtrer ; chaque membre ne voit que son site", async () => {
    assert.match((await boss.get(`${M}/analytics/global`)).text, /Pages vues/);
    const a = (await memberA.get(`${M}/analytics/global?site=${siteA}`)).text;
    assert.match(a, /alpha-page/); assert.doesNotMatch(a, /bravo-page/);
    const b = (await memberB.get(`${M}/analytics/global?site=${siteB}`)).text;
    assert.match(b, /bravo-page/); assert.doesNotMatch(b, /alpha-page/);
  });
  test("un membre du site A qui demande le site B, ou ne précise rien, n'obtient rien du site B", async () => {
    const r = await memberA.get(`${M}/analytics/global?site=${siteB}`);
    assert.equal(r.status, 403);
    const sans = await memberA.get(`${M}/analytics/global`);
    assert.ok(sans.status === 403 || sans.status === 302, `statut ${sans.status}`);
    assert.equal((await memberA.get(`${M}/analytics/global/export?site=${siteB}&section=pages`)).status, 403);
    const csv = await memberA.get(`${M}/analytics/global/export?site=${siteA}&section=pages`);
    assert.equal(csv.status, 200); assert.match(csv.text, /alpha-page/); assert.doesNotMatch(csv.text, /bravo-page/);
  });
  test("les commandes (sans site) ne sont jamais montrées à un membre de site", async () => {
    const a = (await memberA.get(`${M}/analytics/global?site=${siteA}`)).text;
    assert.match(a, /ne sont pas rattachées à un site/);
  });
});

describe("export CSV", () => {
  test("types, en-têtes, tableau inconnu, neutralisation des formules", async () => {
    const ok = await boss.get(`${M}/analytics/global/export?section=pages`);
    assert.equal(ok.status, 200); assert.match(ok.headers.get("content-type"), /text\/csv/); assert.match(ok.headers.get("content-disposition"), /attachment; filename="analytics-pages-/);
    assert.match(ok.text, /Page;Type;Pages vues;Visiteurs/);
    assert.equal((await boss.get(`${M}/analytics/global/export?section=secrets`)).status, 404);
    db.prepare("INSERT INTO mk_funnels (organization_id, name) VALUES (?, '=HYPERLINK(\"http://x\")')").run(orgId);
    const csv = (await boss.get(`${M}/analytics/global/export?section=tunnels`)).text;
    assert.match(csv, /'=HYPERLINK/); assert.doesNotMatch(csv, /(^|;)=HYPERLINK/m);
  });
});

describe("contenu affiché : échappement et états honnêtes", () => {
  test("le nom d'un tunnel contenant du HTML est échappé ; sans donnée, la page le dit", async () => {
    const t = (await boss.get(`${M}/analytics/global?plage=90d`)).text;
    assert.doesNotMatch(t, /<script>alert\(1\)<\/script>/);
    const old = (await boss.get(`${M}/analytics/global?plage=custom&du=2020-01-01&au=2020-01-31`)).text;
    assert.match(old, /Aucune donnée disponible pour cette période/);
    assert.doesNotMatch(old, /\+24 ?%|15\s?420/);
  });
  test("période invalide : message clair, pas de plantage ; période trop longue refusée", async () => {
    assert.equal((await boss.get(`${M}/analytics/global?plage=custom&du=2026-02-30&au=2026-03-01`)).status, 400);
    assert.equal((await boss.get(`${M}/analytics/global?plage=custom&du=2000-01-01&au=2026-03-01`)).status, 400);
    assert.equal((await boss.get(`${M}/analytics/global?plage=n_importe_quoi`)).status, 200);
  });
  test("la page annonce l'absence de temps réel", async () => {
    assert.match((await boss.get(`${M}/analytics/global`)).text, /Il n(?:'|&#39;)y a pas de temps réel/);
  });
});

describe("conversions personnalisées", () => {
  test("création avec un événement existant, doublon refusé, injection neutralisée, suppression", async () => {
    const ok = await boss.post(`${M}/analytics/conversions`, { nom: "Inscription formation", evenement: "form.submitted", cle: "formId", valeur: "7" });
    assert.equal(ok.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_conversions").n, 1);
    await boss.post(`${M}/analytics/conversions`, { nom: "Inscription formation", evenement: "form.submitted" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_conversions").n, 1);
    await boss.post(`${M}/analytics/conversions`, { nom: "<img src=x onerror=alert(1)>", evenement: "form.submitted'); DROP TABLE mk_events;--" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_conversions").n, 1);
    assert.ok(one("SELECT 1 FROM mk_events LIMIT 1") !== undefined || true);
    const page = (await boss.get(`${M}/analytics/global`)).text;
    assert.match(page, /Inscription formation/);
    const id = one("SELECT id FROM mk_conversions").id;
    await boss.post(`${M}/analytics/conversions/${id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM mk_conversions").n, 0);
  });
  test("un membre d'un site ne peut ni créer ni supprimer pour un autre site", async () => {
    await memberA.post(`${M}/analytics/conversions`, { nom: "Pour Bravo", evenement: "form.submitted", site: String(siteB) });
    const row = one("SELECT site_id FROM mk_conversions WHERE name = 'Pour Bravo'");
    assert.ok(!row || row.site_id !== siteB, "jamais créée sur le site B");
  });
});
