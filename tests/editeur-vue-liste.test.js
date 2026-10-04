// Éditeur d'articles → Structure de l'article : identité des blocs, blocs masqués (jamais publiés), corbeille des blocs.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { sanitizeBlogHtml, renderBlogHtml, blogPlainText } = require("../src/utils/blogHtml");

describe("Filtre de sécurité et page publique", () => {
  test("identifiant de bloc et masquage : conservés seulement avec des valeurs strictes", () => {
    const out = sanitizeBlogHtml('<p data-block-id="babcdefgh" data-hidden="true">A</p><p data-block-id="BAD" data-hidden="oui">B</p><p data-block-id="b12345678&quot;onload=x">C</p><p><strong data-block-id="bzzzzzzzz">D</strong></p>');
    assert.match(out, /<p data-block-id="babcdefgh" data-hidden="true">A<\/p>/);
    assert.match(out, /<p>B<\/p>/);
    assert.match(out, /<p>C<\/p>/);
    assert.match(out, /<strong>D<\/strong>/);
  });
  test("un bloc masqué n'est jamais publié (y compris dans une colonne), les repères internes sont retirés", () => {
    const html = '<p data-block-id="b00000001">Visible</p><p data-block-id="b00000002" data-hidden="true">Secret masqué</p><div class="kb-columns"><div class="kb-column" data-block-id="b00000003"><h2 data-block-id="b00000004" data-hidden="true">Titre masqué</h2><p>Gauche</p></div><div class="kb-column"><p>Droite</p></div></div>';
    const r = renderBlogHtml(html);
    assert.match(r.html, /Visible/);
    assert.doesNotMatch(r.html, /Secret masqué|Titre masqué/);
    assert.doesNotMatch(r.html, /data-block-id|data-hidden/);
    assert.ok(!r.toc.some((t) => /masqué/.test(t.text)), "absent du sommaire");
    assert.doesNotMatch(blogPlainText(html), /masqué/, "absent du texte (extrait, temps de lecture)");
  });
  test("le retrait des blocs masqués ne désactive pas l'échappement", () => {
    const r = renderBlogHtml('<p data-block-id="b00000001">&lt;script&gt;alert(1)&lt;/script&gt; &amp;</p><p data-hidden="true">x</p>');
    assert.match(r.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp;/);
    assert.doesNotMatch(r.html, /<script>/);
  });
});

describe("Corbeille des blocs", () => {
  let srv, prof, postId;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const item = (blockId, extra = {}) => ({ blockId, type: "paragraph", label: "Paragraphe", preview: "Texte supprimé", node: { type: "paragraph", attrs: { blockId }, content: [{ type: "text", text: "Texte supprimé" }] }, parentId: null, prevId: "b00000001", nextId: null, position: 1, ...extra });
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Corbeille", content: '<p data-block-id="b00000001">Un</p><p data-block-id="b00000002">Deux</p>', status: "draft" })) fd.append(k, v);
    postId = JSON.parse((await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text).id;
  });
  after(() => srv.stop());

  test("ajout, liste (plus récent d'abord), contenu exact et place d'origine conservés", async () => {
    assert.equal((await prof.postJson(`/formateur/blog/${postId}/corbeille`, item("b0000000a"))).status, 200);
    assert.equal((await prof.postJson(`/formateur/blog/${postId}/corbeille`, item("b0000000b", { parentId: "b00000009", prevId: null, nextId: "b00000002", position: 0 }))).status, 200);
    const { items } = JSON.parse((await prof.get(`/formateur/blog/${postId}/corbeille`)).text);
    assert.deepEqual(items.map((i) => i.blockId).sort(), ["b0000000a", "b0000000b"]);
    const b = items.find((i) => i.blockId === "b0000000b");
    assert.equal(b.parentId, "b00000009");
    assert.equal(b.nextId, "b00000002");
    assert.equal(b.node.content[0].text, "Texte supprimé");
    assert.ok(b.deletedAt);
  });
  test("données invalides refusées", async () => {
    for (const bad of [item("pas-un-id"), item("b0000000c", { type: "image" }), item("b0000000d", { prevId: "<x>" }), item("b0000000e", { node: { type: "x y" } })]) {
      const r = await prof.postJson(`/formateur/blog/${postId}/corbeille`, bad);
      assert.equal(r.status, 400, JSON.stringify(bad).slice(0, 80));
    }
  });
  test("suppression définitive d'un élément, puis de toute la corbeille", async () => {
    assert.equal((await prof.request(`/formateur/blog/${postId}/corbeille/b0000000a`, { method: "DELETE" })).status, 200);
    assert.equal(q("SELECT COUNT(*) n FROM blog_block_trash WHERE block_id = 'b0000000a'")[0].n, 0);
    await prof.request(`/formateur/blog/${postId}/corbeille`, { method: "DELETE" });
    assert.equal(q("SELECT COUNT(*) n FROM blog_block_trash WHERE post_id = ?", postId)[0].n, 0);
  });
  test("enregistrer l'article retire de la corbeille les blocs de nouveau présents (restaurés ou « Annuler »)", async () => {
    await prof.postJson(`/formateur/blog/${postId}/corbeille`, item("b00000002"));
    await prof.postJson(`/formateur/blog/${postId}/corbeille`, item("b0000000f"));
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Corbeille", content: '<p data-block-id="b00000001">Un</p><p data-block-id="b00000002">Deux restauré</p>', status: "draft" })) fd.append(k, v);
    await prof.request(`/formateur/blog/${postId}/modifier`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
    assert.deepEqual(q("SELECT block_id FROM blog_block_trash WHERE post_id = ?", postId).map((r) => r.block_id), ["b0000000f"]);
    assert.match(q("SELECT content FROM posts WHERE id = ?", postId)[0].content, /data-block-id="b00000002"/);
  });
  test("réservé au formateur ; supprimer l'article vide sa corbeille", async () => {
    const eleve = await newStudent(srv);
    assert.notEqual((await eleve.get(`/formateur/blog/${postId}/corbeille`)).status, 200);
    assert.notEqual((await eleve.postJson(`/formateur/blog/${postId}/corbeille`, item("b0000000g"))).status, 200);
    const db = srv.db(); db.exec("PRAGMA foreign_keys = ON"); db.prepare("DELETE FROM posts WHERE id = ?").run(postId); db.close();
    assert.equal(q("SELECT COUNT(*) n FROM blog_block_trash WHERE post_id = ?", postId)[0].n, 0);
  });
});
