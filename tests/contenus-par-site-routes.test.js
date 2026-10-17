// R6 (lot 2) — routes d'administration des articles, des termes et des commentaires, protégées par la portée de site : vrai serveur, vraie base d'essai, vrais comptes distincts.
// Accès limité à un site (mk_site_members) vs équipe de l'organisation ; listes ET opérations par identifiant ; refus sans écriture ; droits de l'équipe inchangés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("contenus par site : routes d'administration (articles, termes, commentaires)", () => {
  let srv, boss, db, orgId, A, B, guestA, guestB, editor;
  let pA1, pA2, pB1, pMain, tA, tB, tMain, cA, cB, cMain;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web";
  const pairs = (action, ids, extra = []) => [["action", action], ...ids.map((i) => ["ids", String(i)]), ...extra];
  const siteOf = (type, id) => (one("SELECT site_id FROM mk_content_sites WHERE content_type = ? AND content_id = ?", type, id) || {}).site_id ?? null;
  const person = async (siteId, role, teamRole) => {
    const c = await newStudent(srv);
    if (teamRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), teamRole);
    if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role);
    return c;
  };
  const post = (slug, site) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status) VALUES (?, ?, '<p>x</p>', 0, 'draft')").run(slug, `Titre ${slug}`).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, site);
    return id;
  };
  const term = (slug, site) => {
    const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)").run(`Cat ${slug}`, slug).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, 'category')").run(id, orgId, site);
    return id;
  };
  const comment = (postId, body) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (?, 'post', ?, ?, 'pending', 'Invité')").run(postId, postId, body).lastInsertRowid);
  const trashed = (id) => Boolean(one("SELECT deleted_at FROM posts WHERE id = ?", id).deleted_at);
  const statusOf = (id) => one("SELECT status FROM blog_comments WHERE id = ?", id).status;
  const state = () => JSON.stringify({ posts: all("SELECT id, title, status, published, deleted_at FROM posts ORDER BY id"), terms: all("SELECT id, name, slug, parent_id FROM taxonomy_terms ORDER BY id"), rel: all("SELECT * FROM taxonomy_relations ORDER BY content_id, term_id"), com: all("SELECT id, status FROM blog_comments ORDER BY id"), cs: all("SELECT * FROM mk_content_sites ORDER BY content_type, content_id") });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    pA1 = post("a-un", A); pA2 = post("a-deux", A); pB1 = post("b-un", B); pMain = post("principal");
    tA = term("alpha", A); tB = term("beta", B); tMain = term("principal");
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(pA1, tA);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(pB1, tB);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(pMain, tMain);
    cA = comment(pA1, "Commentaire du site Alpha"); cB = comment(pB1, "Commentaire du site Beta"); cMain = comment(pMain, "Commentaire principal");
    guestA = await person(A, "admin"); guestB = await person(B, "admin"); editor = await person(null, null, "editor");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("articles", () => {
    test("liste : un accès limité à A ne voit que les articles de A (et ses effectifs) ; B refusé ; sans site, redirigé ; l'équipe voit tout, ou filtre par site", async () => {
      const a = await guestA.get(`${R}/articles?site=${A}`);
      assert.equal(a.status, 200);
      assert.ok(a.text.includes("Titre a-un") && a.text.includes("Titre a-deux"));
      assert.ok(!a.text.includes("Titre b-un") && !a.text.includes("Titre principal"), "aucun article d'un autre site ni du site principal");
      assert.equal((await guestA.get(`${R}/articles?site=${B}`)).status, 403, "le site B lui est fermé");
      const noSite = await guestA.get(`${R}/articles`);
      assert.equal(noSite.status, 302, "sans site : renvoyé vers « Mes sites »");
      const team = (await boss.get(`${R}/articles`)).text;
      assert.ok(["a-un", "b-un", "principal"].every((s) => team.includes(`Titre ${s}`)), "l'équipe voit tous les contenus (comportement historique)");
      const filtered = (await boss.get(`${R}/articles?site=${B}`)).text;
      assert.ok(filtered.includes("Titre b-un") && !filtered.includes("Titre a-un"), "filtre d'affichage de l'équipe");
    });
    test("par identifiant : actions refusées sur un article d'un autre site ou du site principal (403), aucune écriture ; sur le sien, elles passent", async () => {
      const before = state();
      for (const [id, action] of [[pB1, "corbeille"], [pMain, "corbeille"], [pB1, "publier"], [pMain, "dupliquer"], [pB1, "supprimer"], [pB1, "restaurer"]]) {
        const r = await guestA.post(`${R}/articles/${id}/${action}`, { site: String(A) });
        assert.equal(r.status, 403, `${action} #${id}`);
      }
      assert.equal(state(), before, "aucune écriture");
      assert.equal((await guestA.post(`${R}/articles/${pA1}/corbeille`, {})).status, 302);
      assert.ok(trashed(pA1));
      assert.equal((await guestA.post(`${R}/articles/${pA1}/restaurer`, {})).status, 302);
      assert.ok(!trashed(pA1));
    });
    test("actions groupées : seuls les articles du site passent ; ceux d'un autre site ou du site principal sont « introuvables » et intacts", async () => {
      const r = await guestA.post(`${R}/articles/actions?site=${A}`, pairs("corbeille", [pA2, pB1, pMain]));
      assert.equal(r.status, 302);
      assert.ok(trashed(pA2), "l'article du site est traité");
      assert.ok(!trashed(pB1) && !trashed(pMain), "les autres ne sont pas touchés");
      await guestA.post(`${R}/articles/actions?site=${A}`, pairs("restaurer", [pA2]));
      assert.ok(!trashed(pA2));
      assert.equal((await guestA.post(`${R}/articles/actions`, pairs("corbeille", [pB1]))).status, 403, "sans site : refusé");
    });
    test("création : refusée à un accès limité (éditeur non ouvert, A-D9) sans rien écrire ; l'équipe crée dans le site choisi (rattachement écrit avec l'article) ou sur le site principal", async () => {
      const n = one("SELECT COUNT(*) n FROM posts").n, ncs = one("SELECT COUNT(*) n FROM mk_content_sites").n;
      const refused = await guestA.post(`${R}/articles`, { title: "Intrus", site: String(A) });
      assert.equal(refused.status, 403);
      assert.equal((await guestA.get(`${R}/articles/ajouter?site=${A}`)).status, 403);
      assert.deepEqual([one("SELECT COUNT(*) n FROM posts").n, one("SELECT COUNT(*) n FROM mk_content_sites").n], [n, ncs]);
      const mine = await boss.post(`${R}/articles`, { title: "Créé pour Beta", site: String(B) });
      assert.equal(mine.status, 302);
      const created = one("SELECT id FROM posts WHERE title = 'Créé pour Beta'");
      assert.equal(siteOf("post", created.id), B);
      assert.equal((await boss.post(`${R}/articles`, { title: "Créé sur le principal" })).status, 302);
      assert.equal(siteOf("post", one("SELECT id FROM posts WHERE title = 'Créé sur le principal'").id), null, "sans site : site principal, aucune ligne");
    });
    test("droits de l'équipe inchangés : un éditeur d'équipe agit sur les articles de tous les sites et du principal", async () => {
      assert.equal((await editor.post(`${R}/articles/${pB1}/corbeille`, {})).status, 302);
      assert.ok(trashed(pB1));
      assert.equal((await editor.post(`${R}/articles/${pB1}/restaurer`, {})).status, 302);
      assert.equal((await editor.post(`${R}/articles/${pMain}/corbeille`, {})).status, 302);
      assert.ok(trashed(pMain));
      await editor.post(`${R}/articles/${pMain}/restaurer`, {});
      assert.ok(!trashed(pMain));
      const lst = (await editor.get(`${R}/articles`)).text;
      assert.ok(lst.includes("Titre b-un") && lst.includes("Titre principal"));
    });
  });

  describe("termes de taxonomie", () => {
    test("liste : seulement les termes du site ; B refusé", async () => {
      const a = (await guestA.get(`${R}/articles/categories?site=${A}`)).text;
      assert.ok(a.includes("Cat alpha") && !a.includes("Cat beta") && !a.includes("Cat principal"));
      const flat = (await guestA.get(`${R}/articles/categories?site=${A}&q=Cat`)).text; // recherche : liste à plat (autre chemin de lecture que l'arbre)
      assert.ok(flat.includes("Cat alpha") && !flat.includes("Cat beta") && !flat.includes("Cat principal"));
      const tags = (await guestA.get(`${R}/articles/etiquettes?site=${A}`)).text;
      assert.ok(!tags.includes("Cat beta"));
      assert.equal((await guestA.get(`${R}/articles/categories?site=${B}`)).status, 403);
      const team = (await boss.get(`${R}/articles/categories`)).text;
      assert.ok(["alpha", "beta", "principal"].every((s) => team.includes(`Cat ${s}`)));
    });
    test("création : le terme est rattaché au site de la personne ; parent d'un autre site refusé sans écriture ; modification, suppression et fusion d'un terme d'un autre site refusées", async () => {
      const r = await guestA.post(`${R}/articles/termes`, { taxonomy: "category", name: "Nouvelle de Alpha", site: String(A) });
      assert.equal(r.status, 302);
      const created = one("SELECT id FROM taxonomy_terms WHERE name = 'Nouvelle de Alpha'");
      assert.ok(created);
      assert.equal(siteOf("term", created.id), A, "rattaché au site, écrit avec le terme");
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      await guestA.post(`${R}/articles/termes`, { taxonomy: "category", name: "Fille de Beta", parent_id: String(tB), site: String(A) });
      await guestA.post(`${R}/articles/termes`, { taxonomy: "category", name: "Fille du principal", parent_id: String(tMain), site: String(A) });
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n, "parent d'un autre site : rien n'est créé");
      const before = state();
      assert.equal((await guestA.post(`${R}/articles/termes/${tB}`, { name: "Piraté" })).status, 403);
      assert.equal((await guestA.post(`${R}/articles/termes/${tB}/supprimer`, {})).status, 403);
      assert.equal((await guestA.post(`${R}/articles/termes/${tMain}/fusionner`, { target_id: String(tA) })).status, 403);
      // fusion de MON terme vers un terme d'un autre site : refusée par la route, rien ne bouge
      await guestA.post(`${R}/articles/termes/${tA}/fusionner`, { target_id: String(tB), taxonomy: "category", site: String(A) });
      await guestA.post(`${R}/articles/termes/${tA}/supprimer`, { reassign_to: String(tB), site: String(A) });
      assert.equal(state(), before, "aucune écriture : les termes, leurs relations et leurs rattachements sont intacts");
      // Terme SANS relation : la base ne s'y opposerait pas ; seule la route refuse la destination d'un autre site (fusion et réassignation)
      const unused = term("inutilise-a", A);
      const m = await guestA.post(`${R}/articles/termes/${unused}/fusionner`, { target_id: String(tB), site: String(A) });
      assert.equal(m.status, 302, "refus signalé par un message, pas une erreur serveur");
      assert.ok(one("SELECT 1 FROM taxonomy_terms WHERE id = ?", unused), "fusion vers un autre site refusée : le terme existe toujours");
      await guestA.post(`${R}/articles/termes/${unused}/supprimer`, { reassign_to: String(tB), site: String(A) });
      assert.ok(one("SELECT 1 FROM taxonomy_terms WHERE id = ?", unused), "réassignation vers un autre site refusée : rien n'est supprimé");
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?", tB).n, 1, "le terme de l'autre site n'a reçu aucun lien");
    });
    test("actions groupées : seuls les termes du site sont supprimés ; l'équipe ne peut pas fusionner entre deux sites (la base l'interdirait aussi)", async () => {
      const t1 = term("jetable-a", A), tOther = tB;
      await guestA.post(`${R}/articles/termes/actions?site=${A}`, pairs("supprimer", [t1, tOther], [["taxonomy", "category"]]));
      assert.ok(!one("SELECT 1 FROM taxonomy_terms WHERE id = ?", t1), "terme du site supprimé");
      assert.ok(one("SELECT 1 FROM taxonomy_terms WHERE id = ?", tOther), "terme d'un autre site intact");
      const before = state();
      await boss.post(`${R}/articles/termes/${tA}/fusionner`, { target_id: String(tB) });
      assert.equal(state(), before, "fusion inter-sites refusée, rien n'est écrit");
    });
  });

  describe("commentaires", () => {
    test("liste : seulement les commentaires des articles du site ; B refusé ; l'équipe voit tout", async () => {
      const a = (await guestA.get(`${R}/commentaires?site=${A}`)).text;
      assert.ok(a.includes("Commentaire du site Alpha") && !a.includes("Commentaire du site Beta") && !a.includes("Commentaire principal"));
      assert.equal((await guestA.get(`${R}/commentaires?site=${B}`)).status, 403);
      const team = (await boss.get(`${R}/commentaires`)).text;
      assert.ok(["Alpha", "Beta"].every((s) => team.includes(`Commentaire du site ${s}`)) && team.includes("Commentaire principal"));
    });
    test("modération : refusée (403) sur un commentaire d'un autre site ou du principal, aucune écriture ; sur le sien, elle passe ; groupée : seuls les siens", async () => {
      const before = state();
      for (const [id, action] of [[cB, "approuver"], [cMain, "corbeille"], [cB, "supprimer"]]) assert.equal((await guestA.post(`${R}/commentaires/${id}/${action}`, {})).status, 403);
      assert.equal((await guestA.post(`${R}/commentaires/${cB}/repondre`, { body: "Intrusion" })).status, 403);
      assert.equal(state(), before);
      assert.equal((await guestA.post(`${R}/commentaires/${cA}/approuver`, {})).status, 302);
      assert.equal(statusOf(cA), "approved");
      await guestA.post(`${R}/commentaires/actions?site=${A}`, pairs("indesirable", [cA, cB, cMain]));
      assert.equal(statusOf(cA), "spam");
      assert.deepEqual([statusOf(cB), statusOf(cMain)], ["pending", "pending"], "les commentaires des autres sites ne sont pas touchés");
    });
    test("effacement d'un invité (vaut pour tous les sites) : réservé à l'équipe ; un accès limité est refusé ; l'équipe garde la fonction", async () => {
      assert.equal((await guestA.post(`${R}/commentaires/effacer-invite?site=${A}`, { email: "x@y.z", confirm: "1", site: String(A) })).status, 403);
      assert.equal((await boss.post(`${R}/commentaires/effacer-invite`, { email: "inconnu@exemple.fr", confirm: "1" })).status, 302);
    });
    test("droits de l'équipe inchangés : modération sur les commentaires de tous les sites", async () => {
      assert.equal((await editor.post(`${R}/commentaires/${cB}/approuver`, {})).status, 302);
      assert.equal(statusOf(cB), "approved");
    });
  });

  test("contenus historiques (sans rattachement) : inchangés pour l'équipe, jamais visibles ni modifiables par un accès limité", async () => {
    assert.equal(siteOf("post", pMain), null);
    assert.equal(siteOf("term", tMain), null);
    assert.equal(one("SELECT slug FROM posts WHERE id = ?", pMain).slug, "principal");
    for (const g of [guestA, guestB]) assert.equal((await g.post(`${R}/articles/${pMain}/publier`, {})).status, 403);
  });
});
