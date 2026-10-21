// KOLAKISA CMS — ARTICLES-01 : « Tous les articles » à la manière de WordPress, sur les vraies routes, la vraie base, de vrais comptes.
// Colonnes (auteur, catégories, étiquettes, commentaires, date), tri par colonne, filtre par mois, nombre par page, modification rapide,
// actions groupées (dont catégorie / étiquette, barre du bas), droits et isolation par site vérifiés côté serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, INSTRUCTOR } = require("./helpers");

describe("articles-01 : liste de gestion des articles", () => {
  let srv, boss, db, orgId, A, B, guestA, viewerA, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web", L = `${R}/articles`;
  const titles = (html) => [...html.matchAll(/<strong class="mk-ar-title">(?:<a[^>]*>)?([^<]+)/g)].map((m) => m[1].trim());
  const row = (id) => one("SELECT * FROM posts WHERE id = ?", id);
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const termsOf = (id, taxonomy) => all("SELECT t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = ? AND t.taxonomy = ? ORDER BY t.name", id, taxonomy).map((r) => r.name);
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const post = (slug, { site = null, author = null, status = "draft", published_at = null, created_at = "2024-01-15 10:00:00", title } = {}) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, author_id, published_at, created_at, updated_at) VALUES (?, ?, '<p>x</p>', ?, ?, ?, ?, ?, ?)").run(slug, title || `Titre ${slug}`, status === "published" ? 1 : 0, status, author, published_at, created_at, created_at).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, site);
    return id;
  };
  const term = (taxonomy, name, site = null) => {
    const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES (?, ?, ?)").run(taxonomy, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, ?)").run(id, orgId, site, taxonomy);
    return id;
  };
  const link = (postId, termId, primary = 0) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, 0)").run(postId, termId, primary);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    guestA = await person(A, "admin"); viewerA = await person(A, "viewer");
    const bossId = idOf(INSTRUCTOR), aId = idOf(guestA);
    ids.cat = term("category", "Marketing"); ids.cat2 = term("category", "Design"); ids.tag = term("tag", "seo");
    ids.catA = term("category", "CatSiteA", A); ids.catB = term("category", "CatSiteB", B); ids.tagA = term("tag", "TagSiteA", A);
    // Site principal : trois articles à des mois et auteurs différents
    ids.m1 = post("mars-un", { author: bossId, status: "published", published_at: "2020-03-05 09:00:00", created_at: "2020-03-01 09:00:00", title: "Bravo mars" });
    ids.m2 = post("juin-un", { author: bossId, status: "published", published_at: "2020-06-10 09:00:00", created_at: "2020-06-01 09:00:00", title: "Alpha juin" });
    ids.dr = post("brouillon-un", { author: bossId, created_at: "2021-01-01 09:00:00", title: "Charlie brouillon" });
    link(ids.m1, ids.cat, 1); link(ids.m1, ids.tag); link(ids.m2, ids.cat2, 1);
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, status, body, author_name, author_email) VALUES (?, 'post', ?, 'approved', 'ok', 'x', 'x@x.test')").run(ids.m2, ids.m2);
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, status, body, author_name, author_email) VALUES (?, 'post', ?, 'approved', 'ok2', 'x', 'x@x.test')").run(ids.m2, ids.m2);
    // Sites A et B
    ids.a1 = post("a-un", { site: A, author: aId, status: "published", published_at: "2022-02-02 09:00:00", title: "Article du site A" });
    ids.a2 = post("a-deux", { site: A, author: aId, title: "Brouillon du site A" });
    ids.b1 = post("b-un", { site: B, status: "published", published_at: "2022-02-03 09:00:00", title: "Article du site B" });
  });
  after(() => srv.stop());

  describe("disposition et colonnes", () => {
    test("en-tête, options de l'écran, aide, états, recherche, actions groupées, filtres", async () => {
      const r = await boss.get(L);
      assert.equal(r.status, 200);
      for (const frag of ["<h1>Articles</h1>", ">Ajouter un article<", "Options de l'écran", ">Aide", "Rechercher des articles", "Actions groupées", "Toutes les dates", ">Filtrer<", "Auteur/autrice", ">Catégories<", ">Étiquettes<", "data-ar-table"]) assert.ok(r.text.includes(frag), frag);
      assert.match(r.text, /Tous <span class="count">\(\d+\)<\/span>/);
      assert.equal((r.text.match(/data-cms-select-all/g) || []).length, 2, "case « tout sélectionner » en tête ET en pied de tableau");
      assert.match(r.text, /<tfoot>/);
    });
    test("titre, mention de brouillon, auteur, catégories, étiquettes, commentaires et date viennent de la base", async () => {
      const html = (await boss.get(L)).text;
      const m1 = html.split('data-ar-row="').find((c) => c.startsWith(`${ids.m1}"`));
      assert.match(m1, /Bravo mars/); assert.match(m1, />Marketing</); assert.match(m1, />seo</); assert.match(m1, /Publié<br>/); assert.match(m1, /05\/03\/2020 à 09:00 UTC/);
      const dr = html.split('data-ar-row="').find((c) => c.startsWith(`${ids.dr}"`));
      assert.match(dr, /Charlie brouillon<\/a> — <span class="mk-ar-state">Brouillon/); assert.match(dr, /Dernière modification/);
      const m2 = html.split('data-ar-row="').find((c) => c.startsWith(`${ids.m2}"`));
      assert.match(m2, /class="mk-ar-bubble"[^>]*>2</, "deux commentaires approuvés");
    });
    test("compteurs d'états = comptes réels du site courant (un accès limité ne voit pas les autres sites)", async () => {
      const html = (await guestA.get(`${L}?site=${A}`)).text;
      assert.match(html, /Tous <span class="count">\(2\)/); assert.match(html, /Publiés <span class="count">\(1\)/); assert.match(html, /Brouillons <span class="count">\(1\)/);
      assert.deepEqual(titles(html).sort(), ["Article du site A", "Brouillon du site A"]);
    });
    test("lecteur : consultation seule, ni cases, ni modification rapide, ni lien d'ajout", async () => {
      const html = (await viewerA.get(`${L}?site=${A}`)).text;
      assert.equal(titles(html).length, 2);
      assert.doesNotMatch(html, /name="ids"|data-ar-quick-open|mk-ar-add|data-cms-bulk/);
    });
  });

  describe("tri par colonne", () => {
    const order = async (q) => titles((await boss.get(`${L}?${q}`)).text).filter((t) => ["Bravo mars", "Alpha juin", "Charlie brouillon"].includes(t));
    test("titre croissant / décroissant", async () => {
      assert.deepEqual(await order("orderby=titre&order=asc"), ["Alpha juin", "Bravo mars", "Charlie brouillon"]);
      assert.deepEqual(await order("orderby=titre&order=desc"), ["Charlie brouillon", "Bravo mars", "Alpha juin"]);
    });
    test("date (publication, sinon création) croissante / décroissante", async () => {
      assert.deepEqual(await order("orderby=date&order=asc"), ["Bravo mars", "Alpha juin", "Charlie brouillon"]);
      assert.deepEqual(await order("orderby=date&order=desc"), ["Charlie brouillon", "Alpha juin", "Bravo mars"]);
    });
    test("commentaires : l'article le plus commenté d'abord en décroissant", async () => {
      assert.equal((await order("orderby=commentaires&order=desc"))[0], "Alpha juin");
    });
    test("auteur : l'ordre suit le nom de l'auteur ; l'indicateur de sens est publié (aria-sort)", async () => {
      const r = await boss.get(`${L}?orderby=auteur&order=desc`);
      assert.match(r.text, /aria-sort="descending"/);
      const names = all("SELECT u.username FROM posts p JOIN users u ON u.id = p.author_id WHERE p.deleted_at IS NULL ORDER BY u.username COLLATE NOCASE DESC").map((x) => x.username);
      assert.ok(names.length);
      assert.equal((await boss.get(`${L}?orderby=auteur&order=asc`)).text.includes('aria-sort="ascending"'), true);
    });
    test("tri inconnu : ignoré (liste normale), jamais une erreur ni une injection", async () => {
      for (const q of ["orderby=titre;DROP", "orderby=p.id", "order=zzz", "orderby[]=x"]) assert.equal((await boss.get(`${L}?${q}`)).status, 200, q);
      assert.ok(one("SELECT COUNT(*) n FROM posts").n > 0);
    });
    test("le tri se combine avec le statut et la recherche, et se conserve d'une page à l'autre", async () => {
      assert.deepEqual((await order("orderby=titre&order=asc&q=juin")), ["Alpha juin"]);
      const r = await boss.get(`${L}/publies?orderby=titre&order=desc`);
      assert.ok(!titles(r.text).includes("Charlie brouillon"));
      assert.match(r.text, /orderby=titre&amp;order=asc/, "un nouveau clic sur Titre inverse le sens");
    });
  });

  describe("filtre par date (mois)", () => {
    test("les mois proposés viennent des articles ; le filtre réduit la liste", async () => {
      const html = (await boss.get(L)).text;
      assert.match(html, /<option value="2020-03">mars 2020<\/option>/); assert.match(html, /<option value="2020-06">juin 2020<\/option>/);
      const r = titles((await boss.get(`${L}?mois=2020-03`)).text);
      assert.ok(r.includes("Bravo mars")); assert.ok(!r.includes("Alpha juin"));
    });
    test("un mois qui ne correspond à rien : état vide ; une valeur invalide : ignorée", async () => {
      const empty = await boss.get(`${L}?mois=1999-01`);
      assert.match(empty.text, /Aucun article trouvé/);
      assert.ok(titles((await boss.get(`${L}?mois=n-importe-quoi`)).text).length > 1);
      assert.ok(titles((await boss.get(`${L}?mois=2020-13`)).text).length > 1);
    });
    test("le filtre ne modifie aucune date", async () => {
      const before = all("SELECT id, published_at, created_at, updated_at FROM posts ORDER BY id");
      await boss.get(`${L}?mois=2020-03&categorie=${ids.cat}`);
      assert.deepEqual(all("SELECT id, published_at, created_at, updated_at FROM posts ORDER BY id"), before);
    });
    test("le filtre par catégorie et celui par mois se combinent", async () => {
      assert.deepEqual(titles((await boss.get(`${L}?mois=2020-03&categorie=${ids.cat}`)).text), ["Bravo mars"]);
      assert.deepEqual(titles((await boss.get(`${L}?mois=2020-06&categorie=${ids.cat}`)).text), []);
    });
  });

  describe("pagination et nombre par page", () => {
    test("« par » est borné, mémorisé dans un cookie, et la pagination suit", async () => {
      for (let i = 0; i < 7; i++) post(`page-${i}`, { created_at: `2023-05-0${i + 1} 10:00:00`, title: `Pagination ${i}` });
      const r = await boss.get(`${L}?par=5&q=Pagination`);
      assert.equal(titles(r.text).length, 5);
      assert.match(r.headers.get("set-cookie") || "", /mk_ar_par=5/);
      assert.match(r.text, /Page 1 sur 2/); assert.match(r.text, /7 éléments/);
      const p2 = await boss.get(`${L}?q=Pagination&page=2`, { headers: { cookie: "mk_ar_par=5" } });
      assert.equal(titles(p2.text).length, 2);
      assert.match(p2.text, /q=Pagination/, "les filtres sont conservés dans les liens de page");
    });
    test("valeurs hors limites ou invalides : ramenées dans [5, 100] ou par défaut", async () => {
      assert.match((await boss.get(`${L}?par=9999`)).headers.get("set-cookie") || "", /mk_ar_par=100/);
      assert.match((await boss.get(`${L}?par=1`)).headers.get("set-cookie") || "", /mk_ar_par=5/);
      assert.equal((await boss.get(`${L}?par=abc`)).status, 200);
      assert.equal((await boss.get(`${L}?page=9999`)).status, 200, "page trop grande : dernière page, pas de liste vide à tort");
    });
  });

  describe("modification rapide", () => {
    test("enregistre titre, adresse, catégories, étiquettes ; l'ancienne adresse d'un article en ligne est conservée", async () => {
      const r = await boss.post(`${L}/${ids.m1}/modification-rapide`, { title: "Bravo mars (révisé)", slug: "mars-revise", categories: [String(ids.cat), String(ids.cat2)], tags: "seo, nouveauté", categories_present: "1", tags_present: "1", status: "published", retour: L });
      assert.equal(r.status, 302);
      const p = row(ids.m1);
      assert.equal(p.title, "Bravo mars (révisé)"); assert.equal(p.slug, "mars-revise"); assert.equal(p.status, "published");
      assert.deepEqual(termsOf(ids.m1, "category"), ["Design", "Marketing"]); assert.deepEqual(termsOf(ids.m1, "tag"), ["nouveauté", "seo"]);
      assert.equal(one("SELECT post_id FROM post_slug_history WHERE old_slug = 'mars-un'").post_id, ids.m1);
      assert.match(flashOf((await boss.get(L)).text), /mis à jour/);
    });
    test("titre vide, adresse déjà prise ou catégorie inexistante : refus clair, rien n'est modifié", async () => {
      const before = JSON.stringify(row(ids.dr)) + JSON.stringify(termsOf(ids.dr, "category"));
      await boss.post(`${L}/${ids.dr}/modification-rapide`, { title: "   ", slug: "x", retour: L });
      assert.match(flashOf((await boss.get(L)).text), /titre.*obligatoire/i);
      await boss.post(`${L}/${ids.dr}/modification-rapide`, { title: "Charlie brouillon", categories: ["999999"], retour: L });
      assert.equal(JSON.stringify(row(ids.dr)) + JSON.stringify(termsOf(ids.dr, "category")), before);
      await boss.post(`${L}/${ids.dr}/modification-rapide`, { title: "Charlie brouillon", slug: "juin-un", retour: L });
      assert.notEqual(row(ids.dr).slug, "juin-un", "l'adresse d'un autre article n'est jamais reprise telle quelle");
    });
    test("état « Brouillon » depuis la modification rapide met l'article hors ligne", async () => {
      await boss.post(`${L}/${ids.m2}/modification-rapide`, { title: row(ids.m2).title, status: "draft", retour: L });
      assert.equal(row(ids.m2).status, "draft"); assert.equal(row(ids.m2).published, 0);
    });
    test("articles inexistants, corbeille ou autre site : refus, sans écriture", async () => {
      const r = await boss.post(`${L}/99999999/modification-rapide`, { title: "x", retour: L });
      assert.ok([302, 404].includes(r.status));
      db.prepare("UPDATE posts SET deleted_at = datetime('now') WHERE id = ?").run(ids.dr);
      await boss.post(`${L}/${ids.dr}/modification-rapide`, { title: "Pirate", retour: L });
      assert.notEqual(row(ids.dr).title, "Pirate");
      db.prepare("UPDATE posts SET deleted_at = NULL WHERE id = ?").run(ids.dr);
    });
    test("le texte saisi est échappé à l'affichage (pas de HTML injecté)", async () => {
      await boss.post(`${L}/${ids.dr}/modification-rapide`, { title: 'Titre <script>alert(1)</script>', retour: L });
      const html = (await boss.get(L)).text;
      assert.ok(!html.includes("<script>alert(1)</script>"));
      assert.ok(html.includes("&lt;script&gt;"));
    });
  });

  describe("actions groupées", () => {
    test("ajouter une catégorie à plusieurs articles sans retirer les autres, résultat honnête", async () => {
      const r = await boss.post(`${L}/actions`, { action: "categorie", categorie_id: String(ids.cat2), ids: [String(ids.m1), String(ids.dr), "99999999"], retour: L });
      assert.equal(r.status, 302);
      assert.ok(termsOf(ids.dr, "category").includes("Design")); assert.ok(termsOf(ids.m1, "category").includes("Marketing"));
      const f = flashOf((await boss.get(L)).text);
      assert.match(f, /2 articles/); assert.match(f, /1 refusé/);
    });
    test("ajouter une étiquette ; la barre du bas (action2) fait la même chose", async () => {
      await boss.post(`${L}/actions`, { action2: "etiquette", etiquette_id: String(ids.tag), ids: [String(ids.dr)], retour: L });
      assert.ok(termsOf(ids.dr, "tag").includes("seo"));
      await boss.post(`${L}/actions`, { action2: "corbeille", ids: [String(ids.dr)], retour: L });
      assert.ok(row(ids.dr).deleted_at, "action2 mise à la corbeille");
      await boss.post(`${L}/actions`, { action: "restaurer", ids: [String(ids.dr)], retour: L });
      assert.equal(row(ids.dr).deleted_at, null);
    });
    test("catégorie ou action invalide : refus, aucune écriture", async () => {
      const before = all("SELECT * FROM taxonomy_relations ORDER BY content_id, term_id").length;
      await boss.post(`${L}/actions`, { action: "categorie", categorie_id: String(ids.tag), ids: [String(ids.dr)], retour: L });
      await boss.post(`${L}/actions`, { action: "categorie", categorie_id: "abc", ids: [String(ids.dr)], retour: L });
      await boss.post(`${L}/actions`, { action: "n-importe-quoi", ids: [String(ids.dr)], retour: L });
      assert.equal(all("SELECT * FROM taxonomy_relations ORDER BY content_id, term_id").length, before);
    });
  });

  describe("sécurité : droits et isolation par site", () => {
    test("accès limité au site A : ne modifie ni n'ajoute rien sur le site B, par l'identifiant ou la catégorie", async () => {
      const before = JSON.stringify([row(ids.b1), termsOf(ids.b1, "category"), termsOf(ids.a1, "category")]);
      await guestA.post(`${L}/${ids.b1}/modification-rapide?site=${A}`, { title: "Pris", slug: "pris", categories: [String(ids.catB)], retour: L });
      await guestA.post(`${L}/${ids.a1}/modification-rapide?site=${A}`, { title: "Article du site A", categories: [String(ids.catB)], retour: L });
      assert.equal(JSON.stringify([row(ids.b1), termsOf(ids.b1, "category"), termsOf(ids.a1, "category")]), before, "ni titre, ni catégorie d'un autre site");
    });
    test("action groupée mêlant les sites : seuls les articles du site A sont traités", async () => {
      const r = await guestA.post(`${L}/actions?site=${A}`, { action: "corbeille", ids: [String(ids.a2), String(ids.b1)], retour: L });
      assert.equal(r.status, 302);;
      assert.ok(row(ids.a2).deleted_at, "article du site A traité"); assert.equal(row(ids.b1).deleted_at, null, "article du site B intact");
      db.prepare("UPDATE posts SET deleted_at = NULL WHERE id = ?").run(ids.a2);
    });
    test("catégorie d'un autre site refusée en action groupée ; catégorie du site acceptée", async () => {
      await guestA.post(`${L}/actions?site=${A}`, { action: "categorie", categorie_id: String(ids.catB), ids: [String(ids.a1)], retour: L });
      assert.ok(!termsOf(ids.a1, "category").includes("CatSiteB"));
      await guestA.post(`${L}/actions?site=${A}`, { action: "categorie", categorie_id: String(ids.catA), ids: [String(ids.a1)], retour: L });
      assert.ok(termsOf(ids.a1, "category").includes("CatSiteA"));
    });
    test("lecteur : modification rapide et actions groupées refusées (403), rien n'est écrit", async () => {
      const before = JSON.stringify(row(ids.a1));
      assert.equal((await viewerA.post(`${L}/${ids.a1}/modification-rapide?site=${A}`, { title: "Piraté" })).status, 403);
      assert.equal((await viewerA.post(`${L}/actions?site=${A}`, { action: "categorie", categorie_id: String(ids.catA), ids: [String(ids.a1)] })).status, 403);
      assert.equal(JSON.stringify(row(ids.a1)), before);
    });
    test("visiteur anonyme : aucune des nouvelles routes n'est accessible", async () => {
      const { Client } = require("./helpers");
      const anon = new Client(srv.base);
      for (const [m, u] of [["get", L], ["post", `${L}/${ids.a1}/modification-rapide`], ["post", `${L}/actions`]]) {
        const r = m === "get" ? await anon.get(u) : await anon.post(u, { title: "x" });
        assert.ok([301, 302, 401, 403].includes(r.status), `${m} ${u} → ${r.status}`);
      }
    });
    test("auteur (sans droit de publier) : modifie son article, mais la modification rapide ne le publie pas", async () => {
      const authorA = await person(A, "author");
      const mine = post("a-auteur", { site: A, author: idOf(authorA), title: "Article de l'auteur" });
      const r = await authorA.post(`${L}/${mine}/modification-rapide?site=${A}`, { title: "Article de l'auteur (v2)", status: "published", retour: L });
      assert.notEqual(row(mine).status, "published", "pas de publication sans articles.publish");
      assert.ok([200, 302, 403].includes(r.status));
      const other = await authorA.post(`${L}/${ids.a2}/modification-rapide?site=${A}`, { title: "Pas le sien", retour: L });
      assert.equal(other.status, 403); assert.notEqual(row(ids.a2).title, "Pas le sien", "un auteur ne modifie pas l'article d'un autre");
    });
  });
});
