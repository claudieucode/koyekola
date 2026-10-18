// Correction R8/R9 de la navigation : « Mes sites » est l'UNIQUE entrée centrale. Le site principal y figure (badge « Principal », bouton « Ouvrir » vers son vrai espace) ;
// plus d'entrée parallèle « Tableau de bord du site principal » dans le menu central ; chaque espace garde son menu ; aucun accès intersite.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("navigation : Mes sites sans entrée redondante", () => {
  let srv, boss, db, A, B, adminA, anon;
  const SP = "/marketing/site-web/sites", PR = "/marketing/site-web/principal";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const nav = (html) => (html.match(/<nav[^>]*mk-cms-nav[\s\S]*?<\/nav>/) || [""])[0];
  const links = (html) => [...nav(html).matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], label: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() }));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Nav"); B = await mkSite("Bravo Nav");
    adminA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, one("SELECT id FROM users WHERE email = ?", adminA.email).id);
  });
  after(() => { db.close(); return srv.stop(); });

  test("menu central (Mes sites, Pages, dashboard principal servi) : « Mes sites » seul, aucune entrée « Tableau de bord du site principal »", async () => {
    for (const url of [SP, "/marketing/site-web", "/marketing/pages", "/marketing/site-web/articles"]) {
      const r = await boss.get(url); assert.equal(r.status, 200, url);
      const l = links(r.text);
      assert.ok(l.some((x) => x.label === "Mes sites" && x.href === SP), `« Mes sites » présent sur ${url}`);
      assert.ok(!l.some((x) => /Tableau de bord du site principal/.test(x.label)), `pas d'entrée redondante sur ${url}`);
      assert.ok(!/Tableau de bord du site principal/.test(nav(r.text)), url);
    }
  });
  test("le tableau de bord du principal reste fonctionnel (adresse centrale et espace)", async () => {
    assert.equal((await boss.get("/marketing/site-web")).status, 200);
    assert.equal((await boss.get(`${PR}/tableau-de-bord`)).status, 200);
  });
  test("le site principal reste dans « Mes sites » (badge Principal) et « Ouvrir » mène à son espace CMS", async () => {
    const r = await boss.get(SP); const row = (r.text.match(/<tr data-site="principal">[\s\S]*?<\/tr>/) || [""])[0];
    assert.match(row, /Principal/); assert.match(row, new RegExp(`href="${PR}/tableau-de-bord"[^>]*>Ouvrir`));
    const open = await boss.get(`${PR}/tableau-de-bord`); assert.equal(open.status, 200);
    assert.match(open.text, /mk-site-banner-name[^>]*>Site principal/);
    const l = links(open.text);
    assert.ok(l.some((x) => x.label === "Mes sites" && x.href === SP), "retour vers Mes sites");
    assert.ok(l.some((x) => /Tableau de bord/.test(x.label)), "le principal garde son tableau de bord DANS son propre espace");
  });
  test("les autres sites gardent leur navigation propre (tableau de bord et pages DE CE site, rien d'un autre)", async () => {
    const r = await boss.get(`${SP}/${A}/tableau-de-bord`); const l = links(r.text);
    assert.ok(l.some((x) => x.label === "Tableau de bord" && x.href === `${SP}/${A}/tableau-de-bord`));
    assert.ok(l.some((x) => x.label === "Pages" && x.href === `${SP}/${A}/pages`));
    assert.ok(!l.some((x) => x.href.includes(`/sites/${B}/`) || x.href.startsWith(PR) || /du site principal/.test(x.label)), "aucun lien vers un autre site ou le principal");
  });
  test("permissions : un accès limité au site A voit son espace, pas Bravo ni le principal ; l'anonyme est renvoyé à la connexion", async () => {
    assert.equal((await adminA.get(`${SP}/${A}/tableau-de-bord`)).status, 200);
    assert.equal((await adminA.get(`${SP}/${B}/tableau-de-bord`)).status, 403);
    assert.equal((await adminA.get(`${PR}/tableau-de-bord`)).status, 403);
    assert.ok(!/Tableau de bord du site principal/.test(nav((await adminA.get(`${SP}/${A}/tableau-de-bord`)).text)));
    const a = await anon.get(SP); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
  });
});
