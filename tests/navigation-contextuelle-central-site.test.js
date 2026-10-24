// Navigation contextuelle : le gestionnaire central « Mes sites » (gestion des sites) est SÉPARÉ des espaces d'administration (principal et sites secondaires).
// Même système de menu pour le principal et les sites ; « Mes sites » n'est jamais une entrée du menu d'un site : on y revient par « Retour à Mes sites » (en-tête du site).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("navigation contextuelle central / site", () => {
  let srv, boss, db, A, B, adminA, adminB, anon;
  const SP = "/marketing/site-web/sites", PR = "/marketing/site-web/principal";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const nav = (html) => (html.match(/<nav[^>]*mk-cms-nav[\s\S]*?<\/nav>/) || [""])[0];
  const links = (html) => [...nav(html).matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], label: m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() }));
  const back = (html) => [...html.matchAll(/<a [^>]*data-mk-back-to-sites[^>]*>/g)].map((m) => (m[0].match(/href="([^"]+)"/) || [])[1]);
  const banner = (html) => (html.match(/mk-site-banner-name[^>]*>([^<]*)/) || [])[1] || null;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Ctx"); B = await mkSite("Bravo Ctx");
    adminA = await newStudent(srv); adminB = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, one("SELECT id FROM users WHERE email = ?", adminA.email).id);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(B, one("SELECT id FROM users WHERE email = ?", adminB.email).id);
  });
  after(() => { db.close(); return srv.stop(); });

  test("1. Mes sites : navigation centrale uniquement (aucun menu de contenu, aucun tableau de bord de site), principal listé avec son badge et « Ouvrir »", async () => {
    const r = await boss.get(SP); assert.equal(r.status, 200);
    assert.deepEqual(links(r.text).map((l) => l.label), ["Mes sites"]);
    assert.doesNotMatch(nav(r.text), /Pages|Articles|Tableau de bord|Apparence|Paramètres/);
    assert.equal(banner(r.text), null, "pas de bandeau de site dans le gestionnaire");
    const row = (r.text.match(/<tr data-site="principal">[\s\S]*?<\/tr>/) || [""])[0];
    assert.match(row, /Principal/); assert.match(row, new RegExp(`href="${PR}/tableau-de-bord"[^>]*>Ouvrir`));
    assert.match(r.text, new RegExp(`href="${SP}/${A}/tableau-de-bord"[^>]*>Ouvrir`)); assert.match(r.text, new RegExp(`href="${SP}/${B}/tableau-de-bord"[^>]*>Ouvrir`));
  });
  test("2. Site principal : menu propre au principal (tableau de bord de son espace, pages, articles), sans « Mes sites », avec « Retour à Mes sites »", async () => {
    const r = await boss.get(`${PR}/tableau-de-bord`); const l = links(r.text);
    assert.equal(banner(r.text), "Site principal");
    assert.ok(l.some((x) => x.label === "Tableau de bord" && x.href === `${PR}/tableau-de-bord`));
    assert.ok(l.some((x) => x.label === "Toutes les pages") && l.some((x) => x.label === "Tous les articles"));
    assert.ok(!l.some((x) => x.label === "Mes sites" || x.href === SP), "« Mes sites » n'est pas une entrée du menu");
    assert.deepEqual(back(r.text), [SP], "action « Retour à Mes sites » dans l'en-tête");
    assert.match(r.text, /Retour à Mes sites/);
  });
  test("3. Site secondaire : menu propre à CE site, sans « Mes sites », avec « Retour à Mes sites »", async () => {
    const r = await boss.get(`${SP}/${A}/tableau-de-bord`); const l = links(r.text);
    assert.equal(banner(r.text), "Alpha Ctx");
    assert.ok(l.some((x) => x.label === "Tableau de bord" && x.href === `${SP}/${A}/tableau-de-bord`) && l.some((x) => x.label === "Toutes les pages" && x.href === `${SP}/${A}/pages`));
    assert.ok(!l.some((x) => x.label === "Mes sites" || x.href === SP));
    assert.deepEqual(back(r.text), [SP]);
  });
  test("4. Aucun mélange : le menu d'un site ne mène ni à un autre site ni au principal, et inversement ; le central ne montre aucun contenu", async () => {
    const a = links((await boss.get(`${SP}/${A}/tableau-de-bord`)).text), p = links((await boss.get(`${PR}/tableau-de-bord`)).text);
    assert.ok(!a.some((x) => x.href.includes(`/sites/${B}/`) || x.href.startsWith(PR)), "Alpha ne renvoie ni vers Bravo ni vers le principal");
    assert.ok(!p.some((x) => /\/sites\/\d+\//.test(x.href)), "le principal ne renvoie vers aucun site secondaire");
  });
  test("5. « Retour à Mes sites » depuis chaque espace et écran (tableau de bord, pages, articles, médias, réglages, écrans historiques du principal) → Mes sites directement", async () => {
    const screens = [`${PR}/tableau-de-bord`, `${PR}/pages`, `${SP}/${A}/tableau-de-bord`, `${SP}/${A}/pages`, `${SP}/${A}/articles`, `${SP}/${A}/medias`, `${SP}/${A}/reglages`, `${SP}/${B}/pages`,
      "/marketing/pages", "/marketing/site-web/articles", "/marketing/site-web/parametres", "/marketing/site-web"];
    for (const url of screens) {
      const r = await boss.get(url); assert.ok([200, 302].includes(r.status), `${url} ${r.status}`);
      const page = r.status === 302 ? await boss.get(r.location) : r;
      assert.deepEqual(back(page.text), [SP], `${url} : « Retour à Mes sites » présent`);
      assert.ok(!links(page.text).some((x) => x.label === "Mes sites"), `${url} : pas de « Mes sites » dans le menu`);
    }
    const go = await boss.get(SP); assert.equal(go.status, 200, "le retour mène directement au gestionnaire (aucun détour par un tableau de bord)");
  });
  test("6. Écrans historiques du principal : cadre du principal (menu du principal, jamais le menu complet « central »), sans faux bandeau de site", async () => {
    for (const url of ["/marketing/pages", "/marketing/site-web/articles"]) {
      const r = await boss.get(url); const l = links(r.text);
      assert.ok(l.some((x) => x.label === "Tableau de bord" && x.href === `${PR}/tableau-de-bord`), url);
      assert.equal(banner(r.text), null, url);
    }
  });
  test("7. Création, ouverture, modification, enregistrement d'une page dans le bon site, persistance et contexte conservé", async () => {
    const dlg = (await adminA.get(`${SP}/${A}/pages`)).text; assert.match(dlg, /<dialog[^>]*id="nouvelle"/);
    const c = await adminA.post("/marketing/pages", { name: "Page Ctx", ouvrir: "editeur", template: "", layoutMode: "free", site_id: String(A) });
    const id = one("SELECT id FROM mk_landing_pages WHERE name = 'Page Ctx'").id; assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", id).site_id, A);
    assert.equal(c.location, `/marketing/pages/${id}/editeur?retour=pages`);
    let screen = await adminA.get(`/marketing/pages/${id}`); assert.equal(banner(screen.text), "Alpha Ctx"); assert.deepEqual(back(screen.text), ["/marketing/site-web/mes-sites"], "accès limité : retour à SA liste");
    assert.ok(links(screen.text).some((x) => x.href === `${SP}/${A}/tableau-de-bord`));
    await adminA.post(`/marketing/pages/${id}`, { name: "Page Ctx", slug: "page-ctx-v2", site_id: String(B), action: "save" });
    assert.equal(one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug, "page-ctx-v2"); assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", id).site_id, A);
    screen = await adminA.get(`/marketing/pages/${id}`); assert.equal(banner(screen.text), "Alpha Ctx", "contexte conservé après rechargement");
    assert.match((await adminA.get(`${SP}/${A}/pages`)).text, /page-ctx-v2/);
  });
  test("8. Permissions : pas d'accès intersite, pas de lien de retour pour un anonyme, accès limité sans les menus des autres sites", async () => {
    assert.equal((await adminA.get(`${SP}/${B}/tableau-de-bord`)).status, 403);
    assert.equal((await adminA.get(`${PR}/tableau-de-bord`)).status, 403);
    assert.equal((await adminB.get(`${SP}/${A}/pages`)).status, 403);
    const own = await adminA.get(`${SP}/${A}/tableau-de-bord`);
    assert.deepEqual(back(own.text), ["/marketing/site-web/mes-sites"], "un accès limité revient à SA liste de sites");
    const ms = await adminA.get("/marketing/site-web/mes-sites"); assert.equal(ms.status, 200);
    assert.ok(!/Alpha Ctx[\s\S]*Bravo Ctx/.test(ms.text) && !/Bravo Ctx/.test(ms.text), "Mes sites ne liste que les sites de l'utilisateur");
    const a = await anon.get(SP); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
  });
  test("9. Persistance du contexte pendant la navigation interne (tableau de bord → pages → articles du même site)", async () => {
    for (const mod of ["tableau-de-bord", "pages", "articles", "composants"]) {
      const r = await boss.get(`${SP}/${A}/${mod}`); assert.equal(r.status, 200, mod); assert.equal(banner(r.text), "Alpha Ctx", mod);
      assert.ok(!links(r.text).some((x) => x.href.includes(`/sites/${B}/`)), mod);
    }
  });
});
