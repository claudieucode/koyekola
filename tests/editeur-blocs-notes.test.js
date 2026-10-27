// KOLAKISA — notes de travail d'un article (commentaires entre rédacteurs) : fils, réponses, résolution, suppression, isolation par site, jamais publiées.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("notes d'un article", () => {
  let srv, boss, db, A, B, adminA, postA, postB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const json = (r) => JSON.parse(r.text);
  const form = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); return fd; };
  const make = async (title, qs) => json(await boss.request(`/formateur/blog/nouveau${qs}`, { method: "POST", multipart: form({ title, content: '<p data-block-id="bblock001">Texte</p>', content_format: "html", status: "published" }), headers: { "x-blog-editor": "1" } }));
  const notes = (who, id) => who.get(`/formateur/blog/${id}/notes`);
  const post = (who, id, body) => who.postJson(`/formateur/blog/${id}/notes`, body);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, one("SELECT id FROM users WHERE email = ?", adminA.email).id);
    postA = await make("Article Alpha", `?site=${A}`);
    postB = await make("Article Beta", `?site=${B}`);
  });
  after(() => srv.stop());

  test("créer une note sur un bloc, répondre, lister : fil avec réponse et auteur", async () => {
    const r = await post(boss, postA.id, { body: "Peut-on reformuler ce passage ?", blockId: "bblock001" });
    assert.equal(r.status, 200, r.text);
    const rootId = json(r).id;
    const reply = await post(boss, postA.id, { body: "Oui, voici une proposition.", parentId: rootId });
    assert.equal(reply.status, 200, reply.text);
    const list = json(await notes(boss, postA.id));
    assert.equal(list.notes.length, 1);
    assert.equal(list.notes[0].blockId, "bblock001");
    assert.equal(list.notes[0].replies.length, 1);
    assert.equal(list.notes[0].replies[0].blockId, "bblock001", "la réponse suit le bloc de la note racine");
    assert.ok(list.notes[0].author);
  });

  test("validations : note vide, trop longue, bloc invalide, réponse à une réponse ou à une note d'un autre article", async () => {
    assert.equal((await post(boss, postA.id, { body: "   " })).status, 400);
    assert.equal((await post(boss, postA.id, { body: "x".repeat(2001) })).status, 400);
    assert.equal((await post(boss, postA.id, { body: "ok", blockId: "<script>" })).status, 400);
    const root = json(await notes(boss, postA.id)).notes[0];
    assert.equal((await post(boss, postA.id, { body: "x", parentId: root.replies[0].id })).status, 404, "pas de réponse à une réponse");
    const other = json(await post(boss, postB.id, { body: "Note de Beta" })).id;
    assert.equal((await post(boss, postA.id, { body: "x", parentId: other })).status, 404, "pas de réponse à une note d'un autre article");
  });

  test("résoudre et rouvrir un fil", async () => {
    const root = json(await notes(boss, postA.id)).notes[0];
    let r = json(await boss.postJson(`/formateur/blog/${postA.id}/notes/${root.id}/resoudre`, { resolved: true }));
    assert.equal(r.notes[0].resolved, true);
    r = json(await boss.postJson(`/formateur/blog/${postA.id}/notes/${root.id}/resoudre`, { resolved: false }));
    assert.equal(r.notes[0].resolved, false);
    assert.equal((await boss.postJson(`/formateur/blog/${postA.id}/notes/${root.replies[0].id}/resoudre`, {})).status, 404, "une réponse ne se résout pas seule");
  });

  test("isolation : un administrateur de site lit et écrit sur les articles de SON site seulement", async () => {
    assert.equal((await post(adminA, postA.id, { body: "Note de l'admin Alpha" })).status, 200);
    assert.equal((await notes(adminA, postB.id)).status, 403);
    assert.equal((await post(adminA, postB.id, { body: "Intrusion" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM post_notes WHERE body = 'Intrusion'").n, 0);
  });

  test("suppression : l'auteur supprime ses notes ; qui peut modifier tous les articles de ce site modère ; supprimer un fil supprime ses réponses", async () => {
    const list = json(await notes(adminA, postA.id)).notes;
    const bossNote = list.find((n) => n.body.startsWith("Peut-on"));
    const adminNote = list.find((n) => n.body.startsWith("Note de l'admin"));
    assert.equal((await adminA.request(`/formateur/blog/${postA.id}/notes/${adminNote.id}/supprimer`, { method: "POST" })).status, 200, "l'auteur supprime sa note");
    assert.equal((await adminA.request(`/formateur/blog/${postB.id}/notes/${bossNote.id}/supprimer`, { method: "POST" })).status, 403, "pas hors de son site");
    assert.equal((await adminA.request(`/formateur/blog/${postA.id}/notes/${bossNote.id}/supprimer`, { method: "POST" })).status, 200, "droit de modération sur les articles de son site");
    assert.equal(one("SELECT COUNT(*) n FROM post_notes WHERE post_id = ?", postA.id).n, 0, "le fil et sa réponse ont disparu");
    assert.equal((await boss.request(`/formateur/blog/${postA.id}/notes/99999/supprimer`, { method: "POST" })).status, 404);
  });

  test("les notes ne sont jamais publiées (page, flux, plan du site)", async () => {
    await post(boss, postA.id, { body: "SECRET-DE-TRAVAIL-123" });
    for (const path of [`/blog/${postA.slug}`, "/blog", "/sitemap.xml", "/blog/feed.xml", "/feed.xml"]) {
      const res = await fetch(`${srv.base}${path}`);
      assert.doesNotMatch(await res.text(), /SECRET-DE-TRAVAIL-123/, path);
    }
    assert.doesNotMatch(one("SELECT content FROM posts WHERE id = ?", postA.id).content, /SECRET-DE-TRAVAIL/);
    assert.equal(one("SELECT COUNT(*) n FROM post_revisions WHERE content LIKE '%SECRET-DE-TRAVAIL%'").n, 0);
  });

  test("le débit des notes est limité (429 au-delà de 40 en 10 minutes par personne)", async () => {
    const p = await make("Article éphémère", "");
    let limited = 0;
    for (let i = 0; i < 60; i++) if ((await post(boss, p.id, { body: `Note ${i}` })).status === 429) limited++;
    assert.ok(limited >= 10, `requêtes limitées : ${limited}`);
  });

  test("supprimer un article supprime ses notes", async () => {
    const p = await make("Article à supprimer", "");
    db.prepare("INSERT INTO post_notes (post_id, body) VALUES (?, 'orpheline')").run(p.id);
    db.prepare("DELETE FROM posts WHERE id = ?").run(p.id);
    assert.equal(one("SELECT COUNT(*) n FROM post_notes WHERE post_id = ?", p.id).n, 0);
  });
});
