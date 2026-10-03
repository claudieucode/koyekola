// Commentaires des articles : réservés aux membres connectés, texte brut, modération par l'auteur du commentaire ou un formateur
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("commentaires des articles du blog", () => {
  let srv, prof, slug, postId;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const anon = () => new Client(srv.base);
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    run("INSERT INTO posts (slug, title, content, content_format, published, published_at, status) VALUES ('article-commente', 'Article commenté', '<p>Contenu.</p>', 'html', 1, datetime('now'), 'published')");
    slug = "article-commente";
    postId = q("SELECT id FROM posts WHERE slug = ?", slug)[0].id;
  });
  after(() => srv.stop());

  test("visiteur : invité à s'inscrire ou se connecter (retour à l'article), envoi refusé", async () => {
    const page = (await anon().get(`/blog/${slug}`)).text;
    assert.match(page, /id="commentaires"/);
    assert.match(page, /href="\/inscription\?redirect=%2Fblog%2Farticle-commente%23commentaires"/);
    assert.match(page, /href="\/connexion\?redirect=%2Fblog%2Farticle-commente%23commentaires"/);
    assert.doesNotMatch(page, /name="body"/);
    const r = await anon().post(`/blog/${slug}/commentaires`, { body: "Bonjour" });
    assert.equal(r.status, 302);
    assert.match(r.location, /^\/connexion\?redirect=/);
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments")[0].n, 0);
  });

  test("inscription depuis l'article : retour à l'article, formulaire de commentaire affiché", async () => {
    const c = anon();
    const r = await c.post("/inscription", { username: "lecteur1", email: "lecteur1@test.local", password: "MotDePasseLecteur1", redirect: `/blog/${slug}#commentaires` });
    assert.equal(r.location, `/blog/${slug}#commentaires`);
    const page = (await c.get(`/blog/${slug}`)).text;
    assert.match(page, /<textarea id="comment-body" name="body"/);
    assert.match(page, /Publié sous le nom <strong>lecteur1<\/strong>/);
    // redirection externe refusée
    const evil = await anon().post("/inscription", { username: "lecteur2", email: "lecteur2@test.local", password: "MotDePasseLecteur2", redirect: "//evil.example" });
    assert.equal(evil.location, "/mes-cours");
  });

  test("membre : publie un commentaire (texte brut, échappé), sans doublon ; vide refusé avec texte conservé", async () => {
    const student = await newStudent(srv);
    const r = await student.post(`/blog/${slug}/commentaires`, { body: "  Super article <script>alert(1)</script>\n\nMerci !  " });
    assert.match(r.location, /^\/blog\/article-commente#commentaire-\d+$/);
    await student.post(`/blog/${slug}/commentaires`, { body: "Super article <script>alert(1)</script>\n\nMerci !" });
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments")[0].n, 1, "double envoi ignoré");
    const page = (await anon().get(`/blog/${slug}`)).text;
    assert.match(page, /Super article &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(page, /<script>alert\(1\)<\/script>/);
    assert.match(page, /Commentaires <span class="article-comments-count">\(1\)<\/span>/);
    assert.match(page, /"commentCount":1/);
    await student.post(`/blog/${slug}/commentaires`, { body: "   " });
    const after = (await student.get(`/blog/${slug}`)).text;
    assert.match(after, /Votre commentaire est vide/);
    const long = "x".repeat(2001);
    await student.post(`/blog/${slug}/commentaires`, { body: long });
    const kept = (await student.get(`/blog/${slug}`)).text;
    assert.match(kept, /dépasse 2000 caractères/);
    assert.match(kept, new RegExp(`>${long}</textarea>`), "texte conservé pour correction");
  });

  test("anti-abus : au plus 6 commentaires par 10 minutes et par membre", async () => {
    const student = await newStudent(srv);
    for (let i = 1; i <= 6; i++) await student.post(`/blog/${slug}/commentaires`, { body: `Message numéro ${i}` });
    await student.post(`/blog/${slug}/commentaires`, { body: "Message numéro 7" });
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments WHERE body = 'Message numéro 7'")[0].n, 0);
    assert.match((await student.get(`/blog/${slug}`)).text, /réessayez dans quelques minutes/);
  });

  test("suppression : par son auteur ou un formateur ; pas par un autre membre", async () => {
    const a = await newStudent(srv);
    const b = await newStudent(srv);
    await a.post(`/blog/${slug}/commentaires`, { body: "À supprimer bientôt" });
    const id = q("SELECT id FROM blog_comments WHERE body = 'À supprimer bientôt'")[0].id;
    assert.doesNotMatch((await b.get(`/blog/${slug}`)).text, new RegExp(`/blog/commentaires/${id}/supprimer`), "pas de bouton pour les autres");
    assert.equal((await b.post(`/blog/commentaires/${id}/supprimer`, {})).status, 403);
    assert.equal((await anon().post(`/blog/commentaires/${id}/supprimer`, {})).status, 403);
    assert.match((await a.get(`/blog/${slug}`)).text, new RegExp(`/blog/commentaires/${id}/supprimer`));
    assert.equal((await a.post(`/blog/commentaires/${id}/supprimer`, {})).status, 302);
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments WHERE id = ?", id)[0].n, 0);
    await b.post(`/blog/${slug}/commentaires`, { body: "Modéré par le formateur" });
    const id2 = q("SELECT id FROM blog_comments WHERE body = 'Modéré par le formateur'")[0].id;
    assert.match((await prof.get(`/blog/${slug}`)).text, new RegExp(`/blog/commentaires/${id2}/supprimer`));
    await prof.post(`/blog/commentaires/${id2}/supprimer`, {});
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments WHERE id = ?", id2)[0].n, 0);
  });

  test("commentaires désactivés sur l'article : section absente, envoi sans effet ; article non publié : 404", async () => {
    run("UPDATE posts SET comments_enabled = 0 WHERE id = ?", postId);
    const student = await newStudent(srv);
    assert.doesNotMatch((await student.get(`/blog/${slug}`)).text, /id="commentaires"/);
    await student.post(`/blog/${slug}/commentaires`, { body: "Ne doit pas passer" });
    assert.equal(q("SELECT COUNT(*) n FROM blog_comments WHERE body = 'Ne doit pas passer'")[0].n, 0);
    run("UPDATE posts SET comments_enabled = 1, published = 0, status = 'draft' WHERE id = ?", postId);
    assert.equal((await student.post(`/blog/${slug}/commentaires`, { body: "Brouillon" })).status, 404);
    run("UPDATE posts SET published = 1, status = 'published' WHERE id = ?", postId);
  });

  test("option de l'éditeur « Autoriser les commentaires » enregistrée", async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ title: "Option", content: "<p>x</p>", content_format: "html", comments_enabled: "0" })) fd.append(k, v);
    const r = JSON.parse((await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text);
    assert.equal(q("SELECT comments_enabled FROM posts WHERE id = ?", r.id)[0].comments_enabled, 0);
    assert.match((await prof.get(`/formateur/blog/${r.id}/modifier`)).text, /name="comments_enabled" value="1" >/);
  });
});
