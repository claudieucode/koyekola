// KOLAKISA CMS — palier 1 : la coque (menu latéral, barre du haut, écrans). Par les vraies routes d'un vrai serveur.
// Garanties : chaque écran du registre s'ouvre dans la coque CMS, les écrans « bientôt » le disent et ne simulent rien,
// les écrans existants (pages, sites, tests A/B) y entrent sans changer, le Page Builder garde sa propre page, et les
// autres sections du Marketing gardent leur menu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const cmsNav = require("../src/marketing/web/cmsNav");

let srv, boss, db;
const unique = [...new Set(cmsNav.ALL.map((i) => i.href))];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
});
after(() => srv.stop());

describe("registre et menu", () => {
  test("le registre couvre la structure cible (14 rubriques) sans adresse en double", () => {
    assert.deepEqual(cmsNav.SECTIONS.map((s) => s.label), ["Tableau de bord", "Sites", "Pages", "Articles", "Médias", "Navigation", "Apparence", "Commentaires", "Utilisateurs", "SEO", "Redirections", "Tests A/B", "Outils", "Paramètres"]);
    assert.equal(unique.length, cmsNav.ALL.length);
    assert.deepEqual(cmsNav.SECTIONS.find((s) => s.key === "apparence").items.map((i) => i.label), ["Éditeur du site", "Templates", "Patterns", "Styles", "En-tête", "Pied de page", "Menus"]);
  });

  test("chaque écran du registre répond 200 dans la coque CMS, avec son menu ouvert sur la bonne entrée", async () => {
    for (const item of cmsNav.ALL) {
      const res = await boss.get(item.href);
      assert.equal(res.status, 200, item.href);
      assert.match(res.text, /class="mk-body is-cms"/, `${item.href} : coque CMS`);
      assert.match(res.text, /aria-label="Sections du CMS"/);
      assert.match(res.text, new RegExp(`href="${item.href.replace(/[/]/g, "\\/")}"[^>]*aria-current="page"`), `${item.href} : entrée active`);
      assert.doesNotMatch(res.text, /Menu marketing/, `${item.href} : plus le menu Marketing`);
    }
  });

  test("une adresse inconnue du CMS reste une vraie 404", async () => {
    assert.equal((await boss.get("/marketing/site-web/rubrique-inconnue")).status, 404);
    assert.equal((await boss.get("/marketing/site-web/articles/inconnue")).status, 404);
  });

  test("les autres sections du Marketing gardent leur menu (pas de coque CMS)", async () => {
    for (const href of ["/marketing", "/marketing/campagnes", "/marketing/tunnels", "/marketing/contacts"]) {
      const res = await boss.get(href);
      assert.equal(res.status, 200, href);
      assert.doesNotMatch(res.text, /is-cms/, href);
      assert.match(res.text, /Menu marketing/);
    }
  });

  test("le menu CMS propose le retour au Marketing", async () => {
    assert.match((await boss.get("/marketing/site-web")).text, /class="mk-cms-back" href="\/marketing"/);
  });
});

describe("honnêteté : rien n'est simulé", () => {
  test("un écran « bientôt » le dit, désactive ses commandes et n'invente aucune donnée", async () => {
    for (const href of ["/marketing/site-web/navigation", "/marketing/site-web/parametres", "/marketing/site-web/outils/cache"]) {
      const html = (await boss.get(href)).text;
      assert.match(html, /Prochain palier\./, href);
      assert.match(html, /disabled/, href);
      assert.doesNotMatch(html, /<form[^>]*action="\/marketing[^"]*"[^>]*method="post"/, `${href} : aucun envoi réel`);
    }
  });

  test("les écrans de données montent un état vide quand la base est vide", async () => {
    assert.match((await boss.get("/marketing/site-web/articles")).text, /Aucun article/);
    assert.match((await boss.get("/marketing/site-web/commentaires")).text, /Aucun commentaire/);
    assert.match((await boss.get("/marketing/site-web/redirections")).text, /Aucune redirection/);
    assert.match((await boss.get("/marketing/site-web/mediatheque")).text, /Aucun fichier/);
  });

  test("les écrans lisent les vraies données (article, commentaire, redirection)", async () => {
    const author = db.prepare("SELECT id FROM users WHERE role = 'formateur'").get().id;
    const post = db.prepare("INSERT INTO posts (slug, title, content, status, published, published_at, author_id, category, tags) VALUES ('mon-article', 'Mon article réel', 'x', 'published', 1, datetime('now'), ?, 'Vidéo', 'montage, son')").run(author).lastInsertRowid;
    db.prepare("INSERT INTO blog_comments (post_id, user_id, body) VALUES (?, ?, 'Un vrai commentaire')").run(post, author);
    db.prepare("INSERT INTO seo_redirects (source_path, target, status) VALUES ('/ancien', '/nouveau', 301)").run();
    assert.match((await boss.get("/marketing/site-web/articles")).text, /Mon article réel/);
    assert.match((await boss.get("/marketing/site-web/articles/publies")).text, /Mon article réel/);
    assert.doesNotMatch((await boss.get("/marketing/site-web/articles/brouillons")).text, /Mon article réel/);
    assert.match((await boss.get("/marketing/site-web/articles/categories")).text, /Vidéo/);
    assert.match((await boss.get("/marketing/site-web/articles/etiquettes")).text, /montage/);
    assert.match((await boss.get("/marketing/site-web/commentaires")).text, /Un vrai commentaire/);
    assert.match((await boss.get("/marketing/site-web/redirections")).text, /\/ancien[\s\S]*\/nouveau/);
    assert.match((await boss.get("/marketing/site-web")).text, /Mon article réel/);
  });

  test("écrans en lecture seule : aucune écriture n'est possible par ces adresses", async () => {
    const res = await boss.post("/marketing/site-web/navigation", { title: "x" }); // écran encore en lecture seule : aucune écriture possible
    assert.equal(res.status, 404);
  });
});

describe("existant conservé", () => {
  test("Pages : même liste, onglets d'état, actions réelles ; le Page Builder garde sa propre page", async () => {
    const created = await boss.post("/marketing/pages", { name: "Ma page CMS", template: "" });
    assert.equal(created.status, 302);
    const id = Number(created.location.match(/(\d+)$/)[1]);
    const list = (await boss.get("/marketing/pages")).text;
    assert.match(list, /is-cms/);
    assert.match(list, /Ma page CMS/);
    for (const tab of ["Toutes", "Publiées", "Brouillons", "Corbeille"]) assert.match(list, new RegExp(`${tab} <span class="mk-tab-count">`));
    assert.match((await boss.get("/marketing/pages?etat=brouillons")).text, /Ma page CMS/);
    assert.doesNotMatch((await boss.get("/marketing/pages?etat=publiees")).text, /Ma page CMS/);
    assert.match((await boss.get("/marketing/pages?q=cms")).text, /Ma page CMS/);
    assert.doesNotMatch((await boss.get("/marketing/pages?q=zzz")).text, /Ma page CMS/);
    const editor = await boss.get(`/marketing/pages/${id}/editeur`);
    assert.equal(editor.status, 200);
    assert.doesNotMatch(editor.text, /is-cms/, "l'éditeur n'est pas dans la coque CMS");
    // Corbeille = archivage réel, restaurable
    assert.equal((await boss.post(`/marketing/pages/${id}/archiver`, {})).status, 302);
    assert.match((await boss.get("/marketing/pages?vue=archivees")).text, /Ma page CMS/);
    assert.equal((await boss.post(`/marketing/pages/${id}/restaurer`, {})).status, 302);
    assert.match((await boss.get("/marketing/pages")).text, /Ma page CMS/);
  });

  test("Sites et Tests A/B : écrans existants dans la coque CMS", async () => {
    assert.match((await boss.get("/marketing/site-web/sites")).text, /is-cms/);
    assert.match((await boss.get("/marketing/site-web/tests-ab")).text, /is-cms/);
  });
});

describe("droits", () => {
  test("un compte sans accès au marketing ne voit aucun écran du CMS", async () => {
    const student = await newStudent(srv);
    const res = await student.get("/marketing/site-web/articles");
    assert.ok([302, 403].includes(res.status), `statut ${res.status}`);
    assert.doesNotMatch(res.text || "", /is-cms/);
  });
});
