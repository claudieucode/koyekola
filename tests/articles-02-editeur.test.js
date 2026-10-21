// KOLAKISA CMS — ARTICLES-02 : « Ajouter un article » ouvre directement l'éditeur de blocs, dans le site administré ;
// l'article n'existe en base qu'au premier enregistrement ; droits et isolation par site vérifiés côté serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("articles-02 : éditeur ouvert directement", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = async (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, await idOf(c), role); return c; };
  const save = (client, url, fields) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return client.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
  const count = () => one("SELECT COUNT(*) n FROM posts").n;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => srv.stop());

  test("« Ajouter un article » redirige vers l'éditeur, sans formulaire intermédiaire ni création en base", async () => {
    const n = count();
    const r = await boss.get(`${R}/articles/ajouter`);
    assert.equal(r.status, 302); assert.equal(r.location, "/formateur/blog/nouveau");
    const editor = await boss.get(r.location);
    assert.equal(editor.status, 200);
    assert.match(editor.text, /id="be-form"/); assert.match(editor.text, /action="\/formateur\/blog\/nouveau"/);
    assert.equal(count(), n, "ouvrir l'éditeur ne crée aucun article");
  });

  test("dans un site : le site suit jusqu'à l'enregistrement, et l'article naît dans ce site", async () => {
    const r = await boss.get(`${R}/sites/${A}/articles/ajouter`);
    assert.equal(r.location, `/formateur/blog/nouveau?site=${A}`);
    const editor = await boss.get(r.location);
    assert.match(editor.text, new RegExp(`data-site="${A}"`)); assert.match(editor.text, new RegExp(`action="/formateur/blog/nouveau\\?site=${A}"`));
    const out = JSON.parse((await save(boss, r.location, { title: "Né dans Alpha" })).text);
    assert.ok(out.ok && out.id);
    assert.equal(one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", out.id).s, A);
    assert.equal(one("SELECT status FROM posts WHERE id = ?", out.id).status, "draft");
    const reopen = await boss.get(`/formateur/blog/${out.id}/modifier`);
    assert.equal(reopen.status, 200); assert.match(reopen.text, /Né dans Alpha/);
  });

  test("sans site : l'article reste au site principal (aucun rattachement)", async () => {
    const out = JSON.parse((await save(boss, "/formateur/blog/nouveau", { title: "Principal" })).text);
    assert.equal(one("SELECT COUNT(*) n FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", out.id).n, 0);
  });

  test("site falsifié ou inexistant : refusé, rien n'est créé", async () => {
    const n = count();
    for (const bad of ["99999", "abc", "1;DROP", "-1"]) {
      assert.notEqual((await boss.get(`/formateur/blog/nouveau?site=${bad}`)).status, 200, bad);
      const r = await save(boss, `/formateur/blog/nouveau?site=${bad}`, { title: "Pirate" });
      assert.notEqual(r.status, 200, bad);
    }
    assert.equal(count(), n);
  });

  test("administrateur du site A : crée dans A ; ne peut ni viser B ni créer sans site", async () => {
    const ok = JSON.parse((await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Par l'admin A" })).text);
    assert.equal(one("SELECT site_id s FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?", ok.id).s, A);
    const n = count();
    assert.equal((await adminA.get(`/formateur/blog/nouveau?site=${B}`)).status, 403);
    assert.equal((await save(adminA, `/formateur/blog/nouveau?site=${B}`, { title: "Vers B" })).status, 403);
    assert.equal((await adminA.get("/formateur/blog/nouveau")).status, 403, "pas de site précisé : refusé");
    assert.equal(count(), n);
  });

  test("lecteur et anonyme : l'éditeur et la création sont refusés", async () => {
    const n = count();
    assert.equal((await viewerA.get(`${R}/sites/${A}/articles/ajouter`)).status, 403);
    assert.equal((await viewerA.get(`/formateur/blog/nouveau?site=${A}`)).status, 403);
    assert.equal((await save(viewerA, `/formateur/blog/nouveau?site=${A}`, { title: "Pirate lecteur" })).status, 403);
    const anon = new (require("./helpers").Client)(srv.base || boss.base);
    assert.ok([302, 401, 403].includes((await anon.get(`${R}/articles/ajouter`)).status));
    assert.ok([302, 401, 403].includes((await save(anon, "/formateur/blog/nouveau", { title: "Anonyme" })).status));
    assert.equal(count(), n);
  });

  test("article d'un autre site : l'administrateur de B ne l'ouvre ni ne le modifie par son identifiant", async () => {
    const id = JSON.parse((await save(adminA, `/formateur/blog/nouveau?site=${A}`, { title: "Secret A" })).text).id;
    assert.equal((await adminB.get(`/formateur/blog/${id}/modifier`)).status, 403);
    assert.equal((await save(adminB, `/formateur/blog/${id}/modifier?site=${B}`, { title: "Piraté" })).status, 403);
    assert.equal(one("SELECT title FROM posts WHERE id = ?", id).title, "Secret A");
  });

  test("brouillon, publication et rechargement : le contenu enregistré est celui rouvert", async () => {
    const out = JSON.parse((await save(boss, `/formateur/blog/nouveau?site=${A}`, { title: "Cycle", content: "<h2>Titre</h2><p>Corps</p>" })).text);
    const pub = JSON.parse((await save(boss, `/formateur/blog/${out.id}/modifier`, { title: "Cycle", content: "<h2>Titre</h2><p>Corps</p>", status: "published" })).text);
    assert.equal(pub.status, "published");
    const row = one("SELECT * FROM posts WHERE id = ?", out.id);
    assert.match(row.content, /<h2>Titre<\/h2>/);
    assert.equal((await boss.get(`/formateur/blog/${out.id}/modifier`)).status, 200);
  });
});
