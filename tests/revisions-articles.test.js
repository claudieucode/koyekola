// Révisions des articles du blog : historique persistant (contenu + réglages), sans doublon, comparaison, restauration
// réelle et réversible (transaction), permissions, pagination, limite configurable.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, newStudent, loginInstructor } = require("./helpers");

let srv, prof, prof2, eleve;
const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a).map((x) => ({ ...x })); db.close(); return r; };
const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
const json = (r) => JSON.parse(r.text);
const save = (client, url, fields) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return client.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
};
const restore = (client, id, rid) => client.request(`/formateur/blog/${id}/versions/${rid}/restaurer`, { method: "POST", headers: { "x-blog-editor": "1", Accept: "application/json" } });
const revs = (id) => q("SELECT id, kind, title, content, meta, note, user_id FROM post_revisions WHERE post_id = ? ORDER BY id", id);
const post = (id) => q("SELECT * FROM posts WHERE id = ?", id)[0];
const base = { content_format: "html", title: "Guide Excel", excerpt: "Résumé v1.", content: "<p>Premier paragraphe.</p><h2>Formules</h2><p>Texte d'origine.</p>", category: "Bureautique", tags: "Excel, tableur", seo_title: "Guide Excel v1", seo_description: "Description v1 du guide Excel pour débutants." };

before(async () => {
  srv = await startServer({ SITE_URL: "", BLOG_MAX_REVISIONS: "6" });
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
  const second = await newStudent(srv);
  run("UPDATE users SET role = 'formateur' WHERE email = ?", second.email);
  prof2 = Object.assign(await new Client(srv.base).login(second.email, "MotDePasseEleve123"), { email: second.email }); // rôle relu à la connexion
});
after(() => srv.stop());

describe("Historique des révisions", () => {
  let id;
  test("création, modifications, réglages enregistrés avec chaque révision, pas de doublon", async () => {
    id = json(await save(prof, "/formateur/blog/nouveau", base)).id;
    let r = revs(id);
    assert.equal(r.length, 1);
    assert.equal(r[0].kind, "create");
    assert.equal(JSON.parse(r[0].meta).category, "Bureautique");
    // Modification du contenu et des réglages
    await save(prof, `/formateur/blog/${id}/modifier`, { ...base, title: "Guide Excel (v2)", content: "<p>Premier paragraphe.</p><h2>Formules</h2><p>Texte réécrit.</p><p>Nouveau paragraphe.</p>", category: "Informatique", tags: "Excel", seo_title: "Guide Excel v2", status: "draft" });
    r = revs(id);
    assert.equal(r.length, 2);
    assert.equal(r[1].kind, "save");
    assert.match(r[1].note, /Titre modifié · Contenu modifié \(\+\d+ mots\).*Référencement modifié · Catégorie modifiée · Étiquettes modifiées/);
    const meta = JSON.parse(r[1].meta);
    assert.deepEqual([meta.category, meta.tags, meta.seo_title, meta.status], ["Informatique", "Excel", "Guide Excel v2", "draft"]);
    // Même enregistrement sans aucun changement (Cmd+S répété) : aucune révision en plus
    await save(prof, `/formateur/blog/${id}/modifier`, { ...base, title: "Guide Excel (v2)", content: "<p>Premier paragraphe.</p><h2>Formules</h2><p>Texte réécrit.</p><p>Nouveau paragraphe.</p>", category: "Informatique", tags: "Excel", seo_title: "Guide Excel v2", status: "draft" });
    assert.equal(revs(id).length, 2, "pas de doublon");
    // La sauvegarde automatique ne crée pas de révision (brouillon temporaire, table à part)
    await save(prof, `/formateur/blog/${id}/autosave`, { title: "Frappe en cours", content: "<p>Brouillon.</p>" });
    assert.equal(revs(id).length, 2);
    // Publication : révision de type « Publication »
    await save(prof, `/formateur/blog/${id}/modifier`, { ...base, title: "Guide Excel (v2)", content: "<p>Premier paragraphe.</p><h2>Formules</h2><p>Texte réécrit.</p><p>Nouveau paragraphe.</p>", category: "Informatique", tags: "Excel", seo_title: "Guide Excel v2", status: "published" });
    assert.equal(revs(id).at(-1).kind, "publish");
  });

  test("liste paginée (API) avec auteur, type, total ; persistante (rechargement de l'éditeur)", async () => {
    const page1 = json(await prof.get(`/formateur/blog/${id}/versions?limite=2`));
    assert.equal(page1.total, 3);
    assert.equal(page1.revisions.length, 2);
    assert.equal(page1.more, true);
    assert.equal(page1.revisions[0].kindLabel, "Publication");
    assert.equal(page1.revisions[0].author, "Prof");
    const page2 = json(await prof.get(`/formateur/blog/${id}/versions?limite=2&avant=${page1.revisions[1].id}`));
    assert.deepEqual(page2.revisions.map((r) => r.kindLabel), ["Création"]);
    assert.equal(page2.more, false);
    const editor = await prof.get(`/formateur/blog/${id}/modifier`);
    assert.match(editor.text, /"revisionTotal":3/);
  });

  test("détail d'une révision : contenu, réglages, état actuel pour la comparaison", async () => {
    const first = revs(id)[0];
    const v = json(await prof.get(`/formateur/blog/${id}/versions/${first.id}`));
    assert.equal(v.title, "Guide Excel");
    assert.match(v.content, /Texte d'origine/);
    assert.equal(v.meta.category, "Bureautique");
    assert.equal(v.current.meta.category, "Informatique");
    assert.match(v.current.content, /Texte réécrit/);
    assert.equal(v.isCurrent, false);
    assert.match(v.html, /Texte d&#39;origine|Texte d'origine/);
    const last = revs(id).at(-1);
    assert.equal(json(await prof.get(`/formateur/blog/${id}/versions/${last.id}`)).isCurrent, true);
  });

  test("restauration réelle, persistante et réversible (l'état d'avant est gardé, la restauration est une révision)", async () => {
    const before = post(id);
    const first = revs(id)[0];
    const r = await restore(prof, id, first.id);
    assert.equal(r.status, 200);
    const after = post(id);
    // Contenu et réglages rendus
    assert.equal(after.title, "Guide Excel");
    assert.match(after.content, /Texte d'origine/);
    assert.deepEqual([after.excerpt, after.category, after.tags, after.seo_title], ["Résumé v1.", "Bureautique", "Excel, tableur", "Guide Excel v1"]);
    // État de publication et adresse : inchangés (l'article reste en ligne, les liens restent valides)
    assert.deepEqual([after.status, after.published, after.slug, after.published_at], [before.status, before.published, before.slug, before.published_at]);
    // L'état d'avant était déjà la dernière révision : pas de doublon « avant restauration » ; la restauration est ajoutée
    const list = revs(id);
    assert.equal(list.length, 4);
    assert.equal(list.at(-1).kind, "restore");
    assert.match(list.at(-1).note, /Restauration de la version du/);
    assert.match(list.at(-2).content, /Texte réécrit/, "l'état d'avant la restauration reste dans l'historique");
    // Sauvegarde automatique en attente effacée (sinon elle écraserait la restauration à l'ouverture)
    assert.equal(q("SELECT COUNT(*) n FROM post_autosaves WHERE post_id = ?", id)[0].n, 0);
    // Page publique : contenu restauré
    assert.match((await prof.get(`/blog/${after.slug}`)).text, /Texte d&#39;origine|Texte d'origine/);
    // Réversible : on revient à l'état d'avant la restauration
    await restore(prof, id, list.at(-2).id);
    assert.match(post(id).content, /Texte réécrit/);
    assert.equal(post(id).category, "Informatique");
  });

  test("restaurer la version actuelle : refusé, rien n'est écrit", async () => {
    const n = revs(id).length;
    const r = await restore(prof, id, revs(id).at(-1).id);
    assert.equal(r.status, 409);
    assert.equal(json(r).error, "Cette version est déjà la version actuelle.");
    assert.equal(revs(id).length, n);
  });

  test("état actuel absent de l'historique (modifié hors éditeur) : gardé en « Avant restauration »", async () => {
    run("UPDATE posts SET content = '<p>Modifié hors éditeur.</p>' WHERE id = ?", id);
    const target = revs(id)[0];
    await restore(prof, id, target.id);
    const list = revs(id);
    assert.equal(list.at(-2).kind, "before_restore");
    assert.match(list.at(-2).content, /Modifié hors éditeur/);
    assert.equal(list.at(-1).kind, "restore");
  });

  test("limite configurable (BLOG_MAX_REVISIONS) : les plus récentes sont gardées", async () => {
    for (let i = 0; i < 8; i++) await save(prof, `/formateur/blog/${id}/modifier`, { ...base, content: `<p>Version ${i}.</p>`, status: "published" });
    const list = revs(id);
    assert.equal(list.length, 6);
    assert.match(list.at(-1).content, /Version 7/);
  });
});

describe("Sécurité et intégrité", () => {
  let a, b;
  before(async () => {
    a = json(await save(prof, "/formateur/blog/nouveau", { ...base, title: "Article A" })).id;
    b = json(await save(prof, "/formateur/blog/nouveau", { ...base, title: "Article B" })).id;
    await save(prof, `/formateur/blog/${a}/modifier`, { ...base, title: "Article A (v2)" });
  });

  test("un élève ou un visiteur n'accède à aucune révision et ne peut rien restaurer", async () => {
    const rid = revs(a)[0].id;
    for (const url of [`/formateur/blog/${a}/versions`, `/formateur/blog/${a}/versions/${rid}`]) assert.notEqual((await eleve.get(url)).status, 200, url);
    const r = await restore(eleve, a, rid);
    assert.notEqual(r.status, 200);
    assert.equal(post(a).title, "Article A (v2)");
  });

  test("une révision d'un autre article n'est ni lue ni restaurée", async () => {
    const ridOfA = revs(a)[0].id;
    assert.equal((await prof.get(`/formateur/blog/${b}/versions/${ridOfA}`)).status, 404);
    assert.equal((await restore(prof, b, ridOfA)).status, 404);
    assert.equal(post(b).title, "Article B");
  });

  test("identifiants invalides et article inexistant", async () => {
    assert.equal((await prof.get(`/formateur/blog/${a}/versions/abc`)).status, 404);
    assert.equal((await prof.get(`/formateur/blog/${a}/versions/-1`)).status, 404);
    assert.equal((await restore(prof, 999999, revs(a)[0].id)).status, 404);
  });

  test("article supprimé : ses révisions aussi (pas de révision orpheline)", async () => {
    await prof.post(`/formateur/blog/${b}/supprimer`, {}); // corbeille, puis suppression définitive
    await prof.post(`/formateur/blog/${b}/supprimer-definitivement`, {});
    assert.equal(q("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", b)[0].n, 0);
  });

  test("article sans révision (ancien article) : liste vide, éditeur fonctionnel", async () => {
    run("DELETE FROM post_revisions WHERE post_id = ?", a);
    const r = json(await prof.get(`/formateur/blog/${a}/versions`));
    assert.deepEqual([r.revisions.length, r.total, r.more], [0, 0, false]);
    assert.equal((await prof.get(`/formateur/blog/${a}/modifier`)).status, 200);
    // Le prochain enregistrement recrée l'historique
    await save(prof, `/formateur/blog/${a}/modifier`, { ...base, title: "Article A (v3)" });
    assert.equal(revs(a).length, 1);
  });

  test("plusieurs formateurs : chaque révision garde son auteur ; un autre formateur peut restaurer (même droit que l'édition)", async () => {
    await save(prof2, `/formateur/blog/${a}/modifier`, { ...base, title: "Article A (par le second formateur)" });
    const list = json(await prof.get(`/formateur/blog/${a}/versions`)).revisions;
    assert.equal(list[0].author, prof2.email.replace("@test.local", ""));
    assert.equal(list[1].author, "Prof");
    assert.equal((await restore(prof2, a, list[1].id)).status, 200);
    assert.equal(post(a).title, "Article A (v3)");
    assert.equal(json(await prof.get(`/formateur/blog/${a}/versions`)).revisions[0].author, prof2.email.replace("@test.local", ""));
  });

  test("révision antérieure aux réglages versionnés : seuls titre, résumé et contenu sont restaurés", async () => {
    run("INSERT INTO post_revisions (post_id, user_id, title, excerpt, content, content_format, note) VALUES (?, NULL, 'Ancien titre', '', '<p>Ancien contenu.</p>', 'html', 'Ancienne révision')", a);
    const old = revs(a).at(-1);
    const cat = post(a).category;
    assert.equal((await restore(prof, a, old.id)).status, 200);
    assert.deepEqual([post(a).title, post(a).category], ["Ancien titre", cat]);
  });
});

describe("Image mise en avant", () => {
  const fs = require("fs");
  const path = require("path");
  const withCover = (url, fields, name) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    fd.append("thumbnail", new Blob([Buffer.alloc(90, name.length)], { type: "image/webp" }), name);
    return prof.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
  };
  const onDisk = (p) => fs.existsSync(path.join(srv.dir, "uploads", p.replace(/^\/uploads\//, "")));
  test("remplacée : l'ancienne reste restaurable ; restaurée ; libérée quand l'article est supprimé", async () => {
    const fields = { ...base, title: "Article illustré" };
    const id = json(await withCover("/formateur/blog/nouveau", fields, "a.webp")).id;
    const first = post(id).cover_path;
    await withCover(`/formateur/blog/${id}/modifier`, fields, "bb.webp");
    const second = post(id).cover_path;
    assert.notEqual(first, second);
    assert.ok(onDisk(first), "ancienne image gardée (citée par une révision)");
    await restore(prof, id, revs(id)[0].id);
    assert.equal(post(id).cover_path, first, "image d'origine restaurée");
    await prof.post(`/formateur/blog/${id}/supprimer`, {}); // corbeille, puis suppression définitive
    await prof.post(`/formateur/blog/${id}/supprimer-definitivement`, {});
    assert.equal(onDisk(first), false);
    assert.equal(onDisk(second), false, "plus aucun article ni révision : images libérées");
  });
});
