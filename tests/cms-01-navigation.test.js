// KOLAKISA CMS — palier CMS-01/02 : structure du panneau latéral (ordre inspiré de WordPress), rubrique Extensions (modules par site),
// commande « Replier le menu », isolation des sites. Vrai serveur jetable ; aucune donnée simulée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const cmsNav = require("../src/marketing/web/cmsNav");

const labels = (arr) => arr.map((s) => s.label);

describe("registre : ordre des rubriques et absence de doublon", () => {
  test("ordre cible : Médias, Commentaires, Apparence, Extensions, Utilisateurs, …, Tests A/B, Outils, Paramètres (Navigation n'est plus une entrée : Apparence → Menus)", () => {
    assert.deepEqual(labels(cmsNav.SECTIONS), ["Mes sites", "Site principal", "Pages", "Articles", "Médias", "Commentaires", "Apparence", "Extensions", "Comptes", "Boutique", "Formation", "SEO", "Redirections", "Tests A/B", "Outils", "Paramètres"]);
  });
  test("clés de rubrique et clés d'entrée uniques ; aucune adresse en double", () => {
    const sk = cmsNav.SECTIONS.map((s) => s.key); assert.equal(new Set(sk).size, sk.length);
    const ik = cmsNav.ALL.map((i) => i.key); assert.equal(new Set(ik).size, ik.length);
    const hrefs = cmsNav.ALL.map((i) => i.href); assert.equal(new Set(hrefs).size, hrefs.length);
  });
  test("Extensions est réservée à l'équipe (permission sites.modules) : présente dans le menu du principal ET de chaque site, jamais proposée à un accès limité à un site", () => {
    const e = cmsNav.itemOf("extensions");
    assert.equal(e.teamOnly, true); assert.equal(e.permission, "sites.modules");
    const keysOf = (space) => cmsNav.projectSections(space).flatMap((s) => s.items.map((i) => i.key));
    assert.ok(keysOf({ principal: true, base: "/p" }).includes("extensions"), "Extensions dans le menu du principal");
    assert.ok(keysOf({ siteId: 4, principal: false, base: "/s/4", name: "S" }).includes("extensions"), "Extensions dans l'espace de chaque site (équipe)");
    assert.ok(!keysOf({ siteId: 4, principal: false, base: "/s/4", name: "S", limited: true }).includes("extensions"), "jamais pour un accès limité à un site");
    const item = cmsNav.projectSections({ siteId: 4, principal: false, base: "/s/4", name: "S" }).flatMap((x) => x.items).find((i) => i.key === "extensions/gestion");
    assert.equal(item.href, "/s/4/extensions/gestion", "l'adresse est celle de CE site");
    assert.deepEqual(cmsNav.buildCmsNav({ can: () => true, active: "sites" }).sections.map((s) => s.key), ["sites"], "le menu central reste « Mes sites » seulement");
  });
  test("« Marketing du site » vient juste avant Outils, dans le menu du principal comme dans celui d'un site", () => {
    for (const space of [{ principal: true, base: "/p" }, { siteId: 4, principal: false, base: "/s/4", name: "S" }]) {
      const order = cmsNav.projectSections(space).map((s) => s.key);
      assert.equal(order.indexOf("marketing") + 1, order.indexOf("outils"));
      assert.ok(order.indexOf("tests") < order.indexOf("marketing") && !order.includes("navigation"), "plus d'entrée autonome « Navigation »");
    }
  });
  test("chaque entrée du registre a une permission, un libellé, une icône de rubrique et une adresse sous /marketing", () => {
    for (const s of cmsNav.SECTIONS) assert.ok(s.icon && s.label, s.key);
    for (const i of cmsNav.ALL) { assert.ok(i.permission || i.anyOf, i.key); assert.match(i.href, i.external ? /^\/formateur$/ : /^\/marketing\//, i.key); } // entrée d'extension « external » : son propre espace (Formation → /formateur)
  });
});

describe("de bout en bout : écran Extensions et pied de panneau", () => {
  let srv, db, boss, A, B, adminA, orgAdmin;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    orgAdmin = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'admin')").run(idOf(orgAdmin));
  });
  after(() => { db.close(); return srv.stop(); });
  const EXT = "/marketing/site-web/extensions";

  test("l'équipe ouvre Extensions dans la coque CMS (cadre du site principal) : entrée active, un tableau site × module", async () => {
    const r = await boss.get(EXT); assert.equal(r.status, 200);
    assert.match(r.text, /<aside class="mk-sidebar"/); assert.match(r.text, /Menu du CMS/); assert.match(r.text, /Site principal/);
    assert.match(r.text, /href="\/marketing\/site-web\/extensions"[^>]*aria-current="page"/);
    for (const l of ["SMS", "Intelligence artificielle", "Kolakisa Commerce", "Kolakisa LMS"]) assert.match(r.text, new RegExp(l));
    const manage = (await boss.get(`${EXT}/gestion`)).text;
    for (const l of ["Site Alpha", "Site Bravo"]) assert.match(manage, new RegExp(l), "Gestion : le choix du site propose les sites de l'organisation");
    for (const slug of ["", "/activees", "/desactivees", "/gestion", "/historique"]) assert.match((await boss.get(EXT + slug)).text, /Historique et activité/, "les cinq rubriques sont dans le menu");
    assert.doesNotMatch(r.text, /mk-cms-soon/, "aucune interface simulée");
  });
  test("l'état affiché est l'état réel et propre à chaque site : activer un module pour A ne l'affiche pas pour B", async () => {
    const enabledList = async (site) => { const t = (await boss.get(`${EXT}/activees?site=${site}`)).text; return t.slice(t.indexOf("<tbody>") >= 0 ? t.indexOf("<tbody>") : 0); };
    assert.doesNotMatch(await enabledList(A), /<strong>SMS<\/strong>/, "désactivé par défaut");
    assert.equal((await boss.post(`/marketing/site-web/sites/${A}/modules/sms`, { etat: "activer" })).status, 302);
    assert.match(await enabledList(A), /<strong>SMS<\/strong>/); assert.doesNotMatch(await enabledList(B), /<strong>SMS<\/strong>/);
    await boss.post(`/marketing/site-web/sites/${A}/modules/sms`, { etat: "desactiver" });
    assert.doesNotMatch(await enabledList(A), /<strong>SMS<\/strong>/, "désactiver est répercuté");
  });
  test("un administrateur d'organisation y accède ; une personne limitée à un site (même administrateur) est refusée côté serveur, quels que soient les paramètres", async () => {
    assert.equal((await orgAdmin.get(EXT)).status, 200);
    for (const q of ["", `?site=${A}`, `?site=${B}`, `?siteId=${B}`]) {
      const r = await adminA.get(EXT + q); assert.ok([302, 403].includes(r.status), `${q} ${r.status}`); assert.doesNotMatch(r.text, /Site Bravo|Modules activés par site/);
    }
  });
  test("un site créé n'a pas Extensions dans son menu ; le cadre d'un site n'est jamais plaqué sur l'écran central", async () => {
    const dash = await boss.get(`/marketing/site-web/sites/${A}/tableau-de-bord`); assert.equal(dash.status, 200);
    assert.match(dash.text, new RegExp(`/sites/${A}/extensions`), "le menu du site propose Extensions (équipe)");
    const ext = (await boss.get(EXT)).text; assert.match(ext, /<li><a href="\/marketing\/site-web\/principal\/tableau-de-bord">Site principal<\/a><\/li>\s*<li>Extensions<\/li>\s*<li aria-current="page">Toutes les extensions<\/li>/, "fil d'Ariane : Site principal › Extensions › Toutes les extensions"); assert.doesNotMatch(ext, new RegExp(`/sites/${A}/tableau-de-bord`.replace(/\//g, "\\/") + '"[^>]*aria-current'), "aucun site créé n'est l'espace courant");
  });
  test("pied du panneau : « Retour au Marketing » puis commande « Replier le menu » accessible (bouton, libellé, état)", async () => {
    const html = (await boss.get(EXT)).text;
    assert.match(html, /class="mk-cms-foot"/);
    assert.match(html, /<button type="button" class="mk-cms-fold" data-mk-sidebar-collapse aria-pressed="false" aria-label="Réduire le menu"/);
    assert.match(html, /Replier le menu/); assert.match(html, /class="mk-cms-back" href="\/marketing"/);
    assert.ok(html.indexOf("mk-cms-back") < html.indexOf("mk-cms-fold"));
  });
  test("tous les écrans du registre s'ouvrent encore (200) avec leur entrée courante après le changement d'ordre", async () => {
    for (const item of cmsNav.ALL) {
      if (item.external) continue; // entrée d'extension qui ouvre son propre espace (ex. /formateur) : hors cadre du CMS
      const r = await boss.get(item.href);
      if (item.fullscreen) { assert.equal(r.status, 200, item.key); assert.match(r.text, /id="kwc-boot"/, item.key); continue; } // écran plein cadre : hors coque du CMS
      // ARTICLES-02 : « Ajouter un article » ouvre directement l'éditeur (redirection), il n'a plus d'écran de cadre
      if (item.key === "articles/ajouter") { assert.equal(r.status, 302); assert.equal(r.location, "/formateur/blog/nouveau"); continue; }
      assert.equal(r.status, 200, `${item.key} ${r.status}`);
      assert.match(r.text, /aria-current="page"/, item.key);
    }
  });
});
