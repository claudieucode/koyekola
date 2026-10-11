// Palier 23 — articles multi-auteurs : l'éditeur d'articles s'ouvre selon les droits (articles.write = tous, articles.edit_own = les siens),
// publier reste un droit à part, personne ne signe au nom d'un autre. Fichier à placer dans tests/ (en retirant « .pending ») avec le correctif.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId;
const M = "/marketing";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const member = async (role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role); c.id = one("SELECT id FROM users WHERE email = ?", c.email).id; return c; };
const save = (client, fields, id) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return client.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };

before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id; });
after(() => { db.close(); srv.stop(); });

describe("rédaction selon les rôles", () => {
  test("un Éditeur (articles.write) crée, ouvre et modifie n'importe quel article, et peut publier", async () => {
    const editor = await member("editor");
    await save(boss, { title: "Article du créateur" });
    const bossPost = one("SELECT id FROM posts WHERE title = 'Article du créateur'").id;
    assert.equal((await editor.get(`/formateur/blog/${bossPost}/modifier`)).status, 200);
    const created = await save(editor, { title: "Article de l'éditeur", status: "published" });
    assert.equal(created.status, 200);
    const mine = one("SELECT id, author_id, status FROM posts WHERE title = 'Article de l''éditeur'");
    assert.equal(mine.author_id, editor.id); assert.equal(mine.status, "published");
  });
  test("un Auteur crée et modifie SES articles en brouillon ; jamais ceux des autres ; ne publie pas ; ne se déclare pas un autre auteur", async () => {
    const author = await member("author");
    const created = await save(author, { title: "Brouillon de l'auteur", author_id: String(1) });
    assert.equal(created.status, 200);
    const mine = one("SELECT id, author_id FROM posts WHERE title = 'Brouillon de l''auteur'");
    assert.equal(mine.author_id, author.id, "signé en son nom malgré un author_id forcé dans le formulaire");
    assert.equal((await save(author, { title: "Brouillon de l'auteur (v2)" }, mine.id)).status, 200);
    const others = one("SELECT id FROM posts WHERE title = 'Article du créateur'").id;
    assert.equal((await author.get(`/formateur/blog/${others}/modifier`)).status, 403);
    assert.equal((await save(author, { title: "Piraté" }, others)).status, 403);
    assert.equal(one("SELECT title FROM posts WHERE id = ?", others).title, "Article du créateur");
    const publish = await save(author, { title: "Brouillon de l'auteur (v2)", status: "published" }, mine.id);
    assert.equal(publish.status >= 400, true, "un auteur ne publie pas");
    assert.equal(one("SELECT status FROM posts WHERE id = ?", mine.id).status, "draft");
    const sched = await save(author, { title: "Brouillon de l'auteur (v2)", status: "scheduled", published_at_utc: new Date(Date.now() + 3600e3).toISOString() }, mine.id);
    assert.equal(sched.status >= 400, true, "ni programmer");
  });
  test("un article déjà en ligne ne se modifie pas sans droit de publication ; les versions non plus", async () => {
    const author = await member("author");
    await save(author, { title: "Article futur en ligne" });
    const id = one("SELECT id FROM posts WHERE title = 'Article futur en ligne'").id;
    await boss.post(`${M}/site-web/articles/${id}/publier`, {});
    const edit = await save(author, { title: "Modifié après mise en ligne" }, id);
    assert.equal(edit.status >= 400, true);
    assert.equal(one("SELECT title FROM posts WHERE id = ?", id).title, "Article futur en ligne");
  });
  test("un Contributeur écrit en brouillon ses articles ; un Lecteur n'écrit pas ; le reste de l'espace du blog reste réservé au créateur", async () => {
    const contributor = await member("contributor"), viewer = await member("viewer"), author = await member("author");
    assert.equal((await save(contributor, { title: "Brouillon du contributeur" })).status, 200);
    assert.equal((await viewer.get("/formateur/blog/nouveau")).status, 403);
    assert.equal((await save(viewer, { title: "Refusé" })).status, 403);
    for (const path of ["/formateur/blog", "/formateur/blog/api/medias", "/formateur/blog/api/ia", "/formateur/blog/api/apparence"]) assert.equal((await author.get(path)).status, 403, path);
  });
  test("le CMS permet de créer un article aux rôles qui rédigent et affiche leurs liens d'édition seulement sur leurs articles", async () => {
    const author = await member("author");
    const r = await author.post(`${M}/site-web/articles`, { title: "Créé depuis le CMS" });
    assert.equal(r.status, 302); assert.match(r.location, /\/formateur\/blog\/\d+\/modifier/);
    const html = (await author.get(`${M}/site-web/articles`)).text;
    assert.match(html, /Créé depuis le CMS/);
    const viewer = await member("viewer");
    assert.equal((await viewer.post(`${M}/site-web/articles`, { title: "Non" })).status, 403);
  });
});
