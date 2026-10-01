// Étape 0 : intégrité des données et sécurité. Chaque test correspond à un défaut relevé lors de l'audit.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof;
const VIDEO = Buffer.alloc(2000, 1);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
});
after(() => srv.stop());

describe("brouillons : rien ne doit fuiter avant la publication", () => {
  let draft;
  before(async () => {
    draft = await createCourse(prof, srv, {
      title: "Brouillon secret",
      publish: false,
      lessons: [{ title: "Aperçu du brouillon", preview: true, video: VIDEO }],
    });
  });
  test("leçon d'aperçu d'un brouillon : 404 pour un visiteur", async () => {
    assert.equal((await new Client(srv.base).get(`/apprendre/${draft.slug}/${draft.lessons[0].id}`)).status, 404);
  });
  test("page de lecture d'un brouillon : 404 pour un visiteur", async () => {
    assert.equal((await new Client(srv.base).get(`/apprendre/${draft.slug}`)).status, 404);
  });
  test("vidéo d'aperçu d'un brouillon : 404 pour un visiteur", async () => {
    const path = srv.db().prepare("SELECT video_path FROM lessons WHERE id = ?").get(draft.lessons[0].id).video_path;
    assert.equal((await new Client(srv.base).get(path)).status, 404);
  });
  test("le formateur peut, lui, prévisualiser son brouillon", async () => {
    assert.equal((await prof.get(`/apprendre/${draft.slug}/${draft.lessons[0].id}`)).status, 200);
  });
});

describe("redirections : uniquement vers le site lui-même", () => {
  const cases = [
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["https://evil.example", "/"],
    ["/mes-cours", "/mes-cours"],
  ];
  for (const [redirect, expected] of cases) {
    test(`connexion avec redirect=${redirect} → ${expected}`, async () => {
      const r = await new Client(srv.base).post("/connexion", { email: "prof@test.local", password: "MotDePasseProf123", redirect });
      assert.equal(r.location, expected);
    });
  }
  test("fin de leçon : le paramètre next ne peut pas mener hors du site", async () => {
    const c = await createCourse(prof, srv, { title: "Pour redirection", price: 0 });
    const e = await newStudent(srv);
    await buy(e, c);
    for (const next of ["https://evil.example", "//evil.example"]) {
      const r = await e.post(`/apprendre/lecon/${c.lessons[0].id}/terminer`, { next });
      assert.match(r.location, /^\/apprendre\//, `next=${next} → ${r.location}`);
    }
  });
  test("ajout au panier : un Referer étranger est refusé", async () => {
    const c = await createCourse(prof, srv, { title: "Pour referer", price: 5 });
    const e = await newStudent(srv);
    const r = await e.post(`/panier/ajouter/${c.id}`, {}, { headers: { Referer: "http://evil.example/page" } });
    assert.equal(r.status, 403);
    assert.equal(r.location, null);
  });
  test("ajout au panier : retour à la page précédente du site (chemin local seulement)", async () => {
    const c = await createCourse(prof, srv, { title: "Pour retour", price: 5 });
    const e = await newStudent(srv);
    const r = await e.post(`/panier/ajouter/${c.id}`, {}, { headers: { Referer: `${srv.base}/catalogue?niveau=debutant` } });
    assert.equal(r.location, "/catalogue?niveau=debutant");
  });
});

describe("supprimer une formation vendue : jamais d'effacement de l'historique", () => {
  test("formation déjà achetée : suppression refusée, ventes et inscriptions intactes", async () => {
    const c = await createCourse(prof, srv, { title: "Déjà vendue", price: 40 });
    const e = await newStudent(srv);
    await buy(e, c);
    const count = (sql) => { const db = srv.db(); const n = db.prepare(sql).get(c.id).n; db.close(); return n; };
    await prof.post(`/formateur/cours/${c.id}/supprimer`, {});
    assert.equal(count("SELECT COUNT(*) n FROM courses WHERE id = ?"), 1, "la formation doit toujours exister");
    assert.equal(count("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?"), 1, "l'inscription doit subsister");
    assert.equal(count("SELECT COUNT(*) n FROM order_items WHERE course_id = ?"), 1, "la ligne de vente doit subsister");
    assert.equal((await e.get(`/apprendre/${c.slug}`)).status, 302, "l'étudiant garde son accès");
  });
  test("formation jamais vendue : suppression possible", async () => {
    const c = await createCourse(prof, srv, { title: "Jamais vendue", price: 40 });
    await prof.post(`/formateur/cours/${c.id}/supprimer`, {});
    const db = srv.db();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM courses WHERE id = ?").get(c.id).n, 0);
    db.close();
  });
  test("le tableau de bord n'affiche pas de bouton de suppression pour une formation vendue", async () => {
    const c = await createCourse(prof, srv, { title: "Vendue, tableau de bord", price: 10 });
    await buy(await newStudent(srv), c);
    const page = (await prof.get("/formateur")).text;
    assert.doesNotMatch(page, new RegExp(`/formateur/cours/${c.id}/supprimer`));
  });
});

describe("commande", () => {
  test("une formation dépubliée entre-temps ne peut pas être achetée", async () => {
    const c = await createCourse(prof, srv, { title: "Dépubliée après panier", price: 15 });
    const e = await newStudent(srv);
    await e.post(`/panier/ajouter/${c.id}`, {});
    await prof.post(`/formateur/cours/${c.id}/publier`, {}); // bascule en brouillon
    await e.post("/commande", {});
    const db = srv.db();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?").get(c.id).n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM order_items WHERE course_id = ?").get(c.id).n, 0);
    db.close();
  });
});

describe("téléversements", () => {
  test("une ressource .html est servie en téléchargement, jamais exécutée dans le site", async () => {
    const c = await createCourse(prof, srv, {
      title: "Ressource html",
      price: 0,
      lessons: [{ title: "L", resource: { name: "piege.html", type: "text/html", content: "<script>alert(1)</script>" } }],
    });
    const e = await newStudent(srv);
    await buy(e, c);
    const db = srv.db();
    const path = db.prepare("SELECT path FROM lesson_attachments WHERE lesson_id = ?").get(c.lessons[0].id).path;
    db.close();
    const r = await e.get(path);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-disposition") || "", /attachment/);
    assert.doesNotMatch(r.headers.get("content-type") || "", /html/);
  });

  async function uploadThumbnail(title, filename, type) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("category", "Test");
    fd.append("level", "debutant");
    fd.append("price", "0");
    fd.append("thumbnail", new Blob(["x".repeat(50)], { type }), filename);
    const r = await prof.request("/formateur/cours/nouveau", { method: "POST", multipart: fd });
    const db = srv.db();
    const row = db.prepare("SELECT thumbnail_path FROM courses WHERE title = ?").get(title);
    db.close();
    return { r, row };
  }
  test("miniature : l'extension vient du type réel, pas du nom envoyé (evil.html déclaré image/png)", async () => {
    const { row } = await uploadThumbnail("Miniature piégée", "evil.html", "image/png");
    assert.ok(row && row.thumbnail_path, "une image PNG valide en apparence est acceptée");
    assert.match(row.thumbnail_path, /\.png$/);
  });
  test("miniature SVG refusée (peut contenir du script)", async () => {
    const { row } = await uploadThumbnail("Miniature svg", "a.svg", "image/svg+xml");
    assert.ok(!row || !row.thumbnail_path, "aucune miniature SVG ne doit être enregistrée");
  });
  test("vidéo dont le type n'est pas vidéo : refusée", async () => {
    const c = await createCourse(prof, srv, { title: "Faux type vidéo", price: 0, lessons: [{ title: "L" }] });
    const fd = new FormData();
    fd.append("title", "L");
    fd.append("video", new Blob(["<html>"], { type: "text/html" }), "x.mp4");
    await prof.request(`/formateur/lecons/${c.lessons[0].id}/modifier`, { method: "POST", multipart: fd });
    const db = srv.db();
    assert.equal(db.prepare("SELECT video_path FROM lessons WHERE id = ?").get(c.lessons[0].id).video_path, null);
    db.close();
  });
});

describe("erreurs et comptes", () => {
  test("une URL mal formée ne révèle aucun message technique", async () => {
    const r = await new Client(srv.base).get("/cours/%E0%A4%A");
    assert.ok(r.status === 400 || r.status === 404);
    assert.doesNotMatch(r.text, /decode|URIError|Failed to/i);
  });
  test("mot de passe de 6 caractères refusé, 8 acceptés", async () => {
    const c = new Client(srv.base);
    assert.equal((await c.post("/inscription", { username: "court", email: "court@test.local", password: "123456" })).status, 400);
    assert.equal((await c.post("/inscription", { username: "ok8", email: "ok8@test.local", password: "12345678" })).status, 302);
  });
});
