// R6 (lot 3) — parcours éditorial d'un accès limité à un site : création depuis la liste, éditeur (/formateur/blog) selon les droits articles.* DU SITE (décision A-D9),
// portée de site sur chaque opération, conservation de « ?site= » dans la navigation. Vrai serveur, base d'essai jetable, comptes distincts. Équipe inchangée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("contenus par site : parcours éditorial d'un accès limité", () => {
  let srv, boss, db, orgId, A, B, guestA, authorA, guestB, team;
  let pA1, pAuthor, pB1, pMain, pLink, tA, tB, tMain;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web", E = "/formateur/blog";
  const siteOf = (type, id) => (one("SELECT site_id FROM mk_content_sites WHERE content_type = ? AND content_id = ?", type, id) || {}).site_id ?? null;
  const person = async (siteId, role, teamRole) => {
    const c = await newStudent(srv);
    if (teamRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), teamRole);
    if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role);
    return c;
  };
  const post = (slug, site, author = null, published = 0) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, author_id) VALUES (?, ?, '<p>x</p>', ?, ?, ?)").run(slug, `Titre ${slug}`, published, published ? "published" : "draft", author).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, site);
    return id;
  };
  const term = (slug, site) => {
    const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)").run(`Cat ${slug}`, slug).lastInsertRowid);
    if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, 'category')").run(id, orgId, site);
    return id;
  };
  const state = () => JSON.stringify({ posts: all("SELECT id, title, status, published, content, author_id FROM posts ORDER BY id"), terms: all("SELECT id, name FROM taxonomy_terms ORDER BY id"), rel: all("SELECT * FROM taxonomy_relations ORDER BY content_id, term_id"), cs: all("SELECT * FROM mk_content_sites ORDER BY content_type, content_id") });
  // Enregistrement comme l'éditeur : formulaire multipart + en-tête x-blog-editor
  const save = (client, id, fields, url = `${E}/${id}/modifier`) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) fd.append(k, String(x));
    return client.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  };
  const base = (p) => ({ title: p.title, content: "<p>Texte modifié</p>", content_format: "html", status: "draft", base_updated_at: "" });
  const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    guestA = await person(A, "admin"); authorA = await person(A, "author"); guestB = await person(B, "admin"); team = await person(null, null, "editor");
    pA1 = post("a-un", A, idOf(guestA), 1); pAuthor = post("a-auteur", A, idOf(authorA)); pB1 = post("b-un", B, null, 1); pMain = post("principal", null, null, 1); pLink = post("lien-a", A, null, 1);
    tA = term("alpha", A); tB = term("beta", B); tMain = term("principal");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("création et édition d'un brouillon du site autorisé", () => {
    let draft;
    test("création depuis la liste des articles du site : brouillon rattaché au site, signé par la personne, éditeur ouvert sur CET article", async () => {
      const r = await guestA.post(`${R}/articles`, { title: "Brouillon de Alpha", site: String(A) });
      assert.equal(r.status, 302);
      draft = one("SELECT * FROM posts WHERE title = 'Brouillon de Alpha'");
      assert.ok(draft);
      assert.equal(r.location, `${E}/${draft.id}/modifier`);
      assert.equal(siteOf("post", draft.id), A, "rattaché à son site, écrit avec l'article");
      assert.equal(draft.author_id, idOf(guestA));
      assert.equal(draft.published, 0, "créé en brouillon, jamais en ligne");
    });
    test("ouverture de l'éditeur : propre site, termes du site SEULEMENT, retour vers la liste du site", async () => {
      const r = await guestA.get(`${E}/${draft.id}/modifier`);
      assert.equal(r.status, 200);
      assert.match(r.text, new RegExp(`id="be-form"[^>]*data-site="${A}"`), "le site accompagnera les appels d'API");
      assert.ok(r.text.includes(`/marketing/site-web/articles?site=${A}`), "retour vers la liste du site");
      assert.ok(r.text.includes("Cat alpha"), "terme du site proposé");
      assert.ok(!r.text.includes("Cat beta") && !r.text.includes("Cat principal"), "aucun terme d'un autre site ni du principal");
    });
    test("enregistrement : modification du brouillon (texte, terme du site) ; statut « en ligne » refusé sans droit de publier pour un auteur, permis pour un administrateur du site", async () => {
      const ok = await save(guestA, draft.id, { ...base(draft), content: "<p>Version 2</p>", category_ids: [tA], primary_category_id: tA });
      assert.equal(ok.status, 200, ok.text.slice(0, 200));
      assert.match(one("SELECT content FROM posts WHERE id = ?", draft.id).content, /Version 2/);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = ? AND term_id = ?", draft.id, tA).n, 1);
      // un auteur du site (articles.edit_own, sans articles.publish) ne met rien en ligne
      const before = state();
      const refused = await save(authorA, pAuthor, { ...base(one("SELECT * FROM posts WHERE id = ?", pAuthor)), status: "published" });
      assert.ok(refused.status >= 400, `publication refusée (${refused.status})`);
      assert.equal(state(), before, "aucune écriture après le refus");
      assert.equal((await save(authorA, pAuthor, { ...base(one("SELECT * FROM posts WHERE id = ?", pAuthor)), content: "<p>Brouillon de l'auteur</p>" })).status, 200, "l'auteur modifie son brouillon");
      // l'administrateur du site a articles.publish : la règle actuelle l'y autorise
      const pub = await save(guestA, draft.id, { ...base(one("SELECT * FROM posts WHERE id = ?", draft.id)), status: "published", base_updated_at: one("SELECT updated_at FROM posts WHERE id = ?", draft.id).updated_at });
      assert.equal(pub.status, 200, pub.text.slice(0, 300));
      assert.equal(one("SELECT published FROM posts WHERE id = ?", draft.id).published, 1);
    });
    test("un auteur ne touche pas aux articles d'un autre auteur du même site (règle articles.edit_own existante)", async () => {
      assert.equal((await authorA.get(`${E}/${pA1}/modifier`)).status, 403);
      const before = state();
      assert.ok((await save(authorA, pA1, { ...base(one("SELECT * FROM posts WHERE id = ?", pA1)), content: "<p>Intrusion</p>" })).status >= 400);
      assert.equal(state(), before);
    });
  });

  describe("refus entre sites et falsification", () => {
    test("article d'un autre site, du site principal ou inconnu : même refus (403), lecture et écriture, aucune écriture", async () => {
      const before = state();
      const urls = [pB1, pMain, 999999].flatMap((id) => [[`${E}/${id}/modifier`, "GET"], [`${E}/${id}/apercu`, "GET"], [`${E}/${id}/versions`, "GET"], [`${E}/${id}/autosave`, "POST"]]);
      const bodies = new Map();
      for (const [url, method] of urls) {
        const r = method === "GET" ? await guestA.get(url) : await save(guestA, 0, { title: "x" }, url);
        assert.equal(r.status, 403, `${method} ${url}`);
        const kind = `${method} ${url.replace(/\/\d+\//, "/#/")}`; // même type de requête, identifiant différent
        bodies.set(kind, new Set([...(bodies.get(kind) || []), r.text.replace(/\d+/g, "#")]));
      }
      for (const [kind, set] of bodies) assert.equal(set.size, 1, `${kind} : inconnu, principal et autre site sont indiscernables (aucune fuite d'existence)`);
      for (const id of [pB1, pMain]) assert.ok((await save(guestA, id, { ...base(one("SELECT * FROM posts WHERE id = ?", id)), content: "<p>Piraté</p>" })).status === 403);
      assert.equal(state(), before);
    });
    test("falsification du paramètre « site » : refusée partout (article, API, création)", async () => {
      assert.equal((await guestA.get(`${E}/${pA1}/modifier?site=${B}`)).status, 403, "site différent de celui de l'article");
      assert.equal((await guestA.get(`${E}/api/termes?site=${B}`)).status, 403, "site dont il n'est pas membre");
      assert.equal((await guestA.get(`${E}/api/termes?site=999999`)).status, 403);
      assert.equal((await guestA.get(`${E}/api/termes`)).status, 403, "sans site : refusé");
      assert.equal((await guestA.get(`${E}/api/termes?site=abc`)).status, 403);
      assert.equal((await guestA.post(`${R}/articles`, { title: "Intrus B", site: String(B) })).status, 403);
      assert.equal(one("SELECT COUNT(*) n FROM posts WHERE title = 'Intrus B'").n, 0);
    });
    test("pages annexes de l'éditeur (liste, SEO, médias) et /api/brouillon : réservées, refusées à un accès limité ; /nouveau ne s'ouvre que pour SON site (ARTICLES-02)", async () => {
      for (const url of [`${E}`, `${E}/api/medias?site=${A}`, `${E}/api/blocs?site=${A}`, `${E}/api/brouillon?site=${A}`]) {
        const r = await guestA.get(url);
        assert.equal(r.status, 403, url);
      }
      // ARTICLES-02 : ouverture directe de l'éditeur, mais uniquement pour son propre site (jamais celui d'un autre, jamais sans site)
      assert.equal((await guestA.get(`${E}/nouveau?site=${A}`)).status, 200);
      assert.equal((await guestA.get(`${E}/nouveau?site=${B}`)).status, 403);
      assert.equal((await guestA.get(`${E}/nouveau`)).status, 403);
      assert.equal((await save(guestA, 0, { title: "x" }, `${E}/nouveau?site=${B}`)).status, 403);
      assert.equal((await save(guestA, 0, { title: "x" }, `${E}/api/brouillon?site=${A}`)).status, 403);
    });
    test("classement : terme d'un autre site, du principal, inconnu, ou saisie par noms sur un article de site : refusés sans écriture ; terme du site accepté", async () => {
      const p = one("SELECT * FROM posts WHERE id = ?", pA1);
      const before = state();
      for (const f of [{ category_ids: [tB] }, { category_ids: [tMain] }, { tag_ids: [999999] }, { category_ids: [tA, tB], primary_category_id: tA }, { category: "Libre" }]) {
        const r = await save(guestA, pA1, { ...base(p), ...f });
        assert.ok(r.status >= 400 && r.status < 500, `${JSON.stringify(f)} : refus propre (message), pas une erreur serveur (${r.status})`);
      }
      assert.equal(state(), before, "aucune écriture partielle");
      assert.equal((await save(guestA, pA1, { ...base(p), category_ids: [tA], primary_category_id: tA })).status, 200);
    });
    test("API de l'éditeur : termes du site seulement ; création d'un terme rattachée au site, parent d'un autre site refusé ; liens internes limités aux articles du site", async () => {
      const list = JSON.parse((await guestA.get(`${E}/api/termes?taxonomy=category&site=${A}`)).text).terms.map((t) => t.name);
      assert.ok(list.includes("Cat alpha") && !list.includes("Cat beta") && !list.includes("Cat principal"));
      const mk = (body, site = A) => guestA.request(`${E}/api/termes?site=${site}`, { method: "POST", json: body });
      const created = await mk({ taxonomy: "category", name: "Nouvelle Alpha" });
      assert.equal(created.status, 201);
      assert.equal(siteOf("term", JSON.parse(created.text).term.id), A);
      const n = one("SELECT COUNT(*) n FROM taxonomy_terms").n;
      assert.ok((await mk({ taxonomy: "category", name: "Fille de Beta", parent_id: tB })).status >= 400);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_terms").n, n, "parent d'un autre site : rien n'est créé");
      const links = JSON.parse((await guestA.get(`${E}/api/liens?site=${A}&q=Titre`)).text).results.map((r) => r.title);
      assert.ok(links.includes("Titre lien-a") && !links.includes("Titre b-un") && !links.includes("Titre principal"));
    });
  });

  describe("contrôle SEO et fichiers de l'éditeur", () => {
    test("contrôle SEO : l'article d'un autre site ne peut pas être désigné par son identifiant ; le sien est contrôlé", async () => {
      const seo = (id) => { const fd = new FormData(); fd.append("post_id", String(id)); fd.append("title", "Titre"); fd.append("content", "<p>x</p>"); return guestA.request(`${E}/api/seo-check?site=${A}`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
      assert.equal((await seo(pB1)).status, 403);
      assert.equal((await seo(pMain)).status, 403);
      assert.equal((await seo(pA1)).status, 200);
    });
    test("l'éditeur livré (source ET paquet) et le sélecteur de classement joignent le site de l'article à chaque appel d'API", () => {
      const fs = require("node:fs"), path = require("node:path");
      const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
      assert.match(read("src/editor/blog-editor.js"), /dataset\.site[\s\S]{0,200}formateur\/blog\/api\//);
      assert.match(read("public/js/blog-editor.js"), /getElementById\("be-form"\)\|\|\{dataset:\{\}\}\)\.dataset\.site[\s\S]{0,160}formateur\/blog\/api\//);
      assert.match(read("public/js/taxonomy-picker.js"), /dataset\.site[\s\S]{0,260}formateur\/blog\/api\//);
    });
  });

  describe("droits conformes aux règles existantes (publication, suppression)", () => {
    test("suppression définitive et mise en ligne depuis la liste : selon articles.delete / articles.publish du SITE ; l'auteur n'a ni l'un ni l'autre", async () => {
      assert.equal((await authorA.post(`${R}/articles/${pAuthor}/publier`, {})).status, 403);
      assert.equal((await authorA.post(`${R}/articles/${pAuthor}/supprimer`, {})).status, 403);
      assert.equal((await authorA.post(`${E}/${pAuthor}/supprimer`, {})).status, 403, "l'éditeur ne publie ni ne supprime pour un accès limité");
      assert.equal((await authorA.post(`${E}/${pAuthor}/publier`, {})).status, 403);
      assert.equal(one("SELECT published FROM posts WHERE id = ?", pAuthor).published, 0);
      assert.equal((await authorA.post(`${R}/articles/${pAuthor}/corbeille`, {})).status, 302, "l'auteur met son brouillon à la corbeille (articles.edit_own)");
      assert.equal((await authorA.post(`${R}/articles/${pAuthor}/restaurer`, {})).status, 302);
    });
  });

  describe("navigation : « ?site= » conservé et appliqué sur chaque destination", () => {
    before(() => {
      for (let i = 0; i < 28; i++) post(`pagine-${i}`, A, idOf(guestA));
      for (let i = 0; i < 40; i++) { // plus d'une page de commentaires (30 par page)
        const p = i % 2 ? pA1 : pAuthor;
        db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (?, 'post', ?, ?, 'pending', 'Invité')").run(p, p, `Commentaire page ${i}`);
      }
      for (let i = 0; i < 45; i++) term(`terme-${i}`, A);
    });
    const followAll = async (client, startUrl, mustContain) => {
      const first = await client.get(startUrl);
      assert.equal(first.status, 200, startUrl);
      const internal = [...new Set(hrefs(first.text).filter((h) => h.startsWith("/marketing/site-web/") && !h.startsWith("/marketing/site-web/parametres")))];
      // R8 lot 2 : les liens du menu du site portent le site DANS L'ADRESSE (/sites/<A>/…) ; un lien vers un autre site resterait signalé
      const unscoped = internal.filter((h) => !/[?&]site=\d+/.test(h) && !/^\/marketing\/site-web\/(?:articles|commentaires)\/\d/.test(h) && !h.startsWith(`/marketing/site-web/sites/${A}/`));
      return { first, internal, unscoped, mustContain };
    };
    test("articles : onglets, pagination, réinitialisation et formulaires portent le site ; chaque destination répond 200 et reste limitée au site", async () => {
      const { first, internal, unscoped } = await followAll(guestA, `${R}/articles?site=${A}`);
      assert.deepEqual(unscoped.filter((h) => /articles|commentaires/.test(h)), [], "aucun lien de la liste ne perd le site : " + unscoped.join(" | "));
      assert.ok(internal.some((h) => /page=2/.test(h) && h.includes(`site=${A}`)), "pagination");
      assert.ok(internal.some((h) => /\/articles\/publies/.test(h) && h.includes(`site=${A}`)), "onglets");
      assert.match(first.text, new RegExp(`<form[^>]*method="get"[^>]*>\\s*<input type="hidden" name="site" value="${A}">`), "formulaire de filtre");
      for (const h of internal.filter((x) => /articles/.test(x))) {
        const r = await guestA.get(h);
        if (/\/articles\/ajouter/.test(h)) { assert.equal(r.status, 302, h); assert.equal(r.location, `/formateur/blog/nouveau?site=${A}`); continue; } // ARTICLES-02 : ouvre l'éditeur
        assert.equal(r.status, 200, h);
        assert.ok(!r.text.includes("Titre b-un") && !r.text.includes("Titre principal"), `${h} reste limité au site`);
      }
      const page2 = await guestA.get(internal.find((h) => /page=2/.test(h) && /articles(?!\/)/.test(h) || /page=2/.test(h)));
      assert.equal(page2.status, 200);
      const filtered = await guestA.get(`${R}/articles?site=${A}&q=pagine-1`);
      assert.equal(filtered.status, 200);
      assert.ok(filtered.text.includes("Titre pagine-1") && !filtered.text.includes("Titre b-un"));
    });
    test("retour après une action : l'adresse de retour garde le site même si le formulaire n'en envoie pas", async () => {
      const id = one("SELECT id FROM posts WHERE slug = 'pagine-0'").id;
      const r = await guestA.post(`${R}/articles/${id}/corbeille`, { retour: `${R}/articles/brouillons` });
      assert.equal(r.status, 302);
      assert.match(r.location, new RegExp(`site=${A}`), r.location);
      const r2 = await guestA.post(`${R}/articles/${id}/restaurer`, {});
      assert.match(r2.location, new RegExp(`site=${A}`));
      const bulk = await guestA.post(`${R}/articles/actions`, [["action", "corbeille"], ["ids", String(id)], ["site", String(A)], ["retour", `${R}/articles/corbeille`]]);
      assert.match(bulk.location, new RegExp(`site=${A}`));
    });
    test("termes et commentaires : onglets, pagination et réinitialisation conservent le site, chaque destination applique la portée", async () => {
      for (const [start, other] of [[`${R}/articles/categories?site=${A}`, "Cat beta"], [`${R}/commentaires?site=${A}`, "Commentaire du site Beta"]]) {
        const { first, internal } = await followAll(guestA, start);
        const mine = internal.filter((h) => /articles\/(?:categories|etiquettes)|commentaires/.test(h));
        assert.ok(mine.length > 0);
        const lost = mine.filter((h) => !/[?&]site=\d+/.test(h) && !/commentaires\/\d/.test(h) && !h.startsWith(`/marketing/site-web/sites/${A}/`));
        assert.deepEqual(lost, [], `liens sans site sur ${start} : ${lost.join(" | ")}`);
        for (const h of mine) { const r = await guestA.get(h); assert.equal(r.status, 200, h); assert.ok(!r.text.includes(other), h); }
        assert.ok(first.text.includes(`name="site" value="${A}"`));
      }
      const c = await guestA.get(`${R}/commentaires?site=${A}`);
      assert.ok(hrefs(c.text).some((h) => /page=2/.test(h) && h.includes(`site=${A}`)), "pagination des commentaires");
      const t = await guestA.get(`${R}/articles/categories?site=${A}`);
      assert.ok(hrefs(t.text).some((h) => /page=2/.test(h) && h.includes(`site=${A}`)), "pagination des termes");
      assert.ok(!c.text.includes('class="btn btn-outline btn-sm" href="/marketing/site-web/parametres/commentaires"'), "pas de bouton vers des réglages hors de la portée du site");
    });
  });

  describe("équipe de l'organisation : fonctionnement inchangé", () => {
    test("un éditeur d'équipe ouvre et modifie les articles de tous les sites et du principal dans l'éditeur ; les listes et le filtre d'affichage fonctionnent", async () => {
      for (const id of [pA1, pB1, pMain]) assert.equal((await team.get(`${E}/${id}/modifier`)).status, 200);
      const p = one("SELECT * FROM posts WHERE id = ?", pB1);
      assert.equal((await save(team, pB1, { ...base(p), content: "<p>Par l'équipe</p>", category_ids: [tB], primary_category_id: tB }, `${E}/${pB1}/modifier?site=${B}`)).status, 200);
      assert.match(one("SELECT content FROM posts WHERE id = ?", pB1).content, /Par l'équipe/);
      const all_ = JSON.parse((await team.get(`${E}/api/termes?taxonomy=category`)).text).terms.map((t) => t.name);
      assert.ok(["Cat alpha", "Cat beta", "Cat principal"].every((n) => all_.includes(n)), "sans site : toutes les catégories, comme avant");
      const onlyA = JSON.parse((await team.get(`${E}/api/termes?taxonomy=category&site=${A}`)).text).terms.map((t) => t.name);
      assert.ok(onlyA.includes("Cat alpha") && !onlyA.includes("Cat beta"));
      assert.ok((await team.get(`${R}/articles?q=b-un`)).text.includes("Titre b-un"));
      assert.ok((await team.get(`${R}/articles?site=${B}`)).text.includes("Titre b-un"), "filtre d'affichage par site");
    });
    test("un article du site principal n'accepte que des termes du site principal (invariant), avec un refus clair pour l'équipe", async () => {
      const p = one("SELECT * FROM posts WHERE id = ?", pMain);
      const before = state();
      const refusedTeam = await save(team, pMain, { ...base(p), category_ids: [tA] });
      assert.ok(refusedTeam.status >= 400 && refusedTeam.status < 500, `refus clair (${refusedTeam.status})`);
      assert.equal(state(), before);
      assert.equal((await save(team, pMain, { ...base(p), category_ids: [tMain], primary_category_id: tMain })).status, 200);
    });
    test("le créateur (formateur) garde tous ses droits sur l'éditeur", async () => {
      assert.equal((await boss.get(`${E}/${pB1}/modifier`)).status, 200);
      assert.equal((await boss.get(`${E}/nouveau`)).status, 200);
    });
  });
});
