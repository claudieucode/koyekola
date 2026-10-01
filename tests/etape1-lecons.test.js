// Étape 1b : la leçon complète — texte en Markdown, plusieurs pièces jointes (fichiers, images, liens).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const ROOT = path.join(__dirname, "..");
let srv, prof;
before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
});
after(() => srv.stop());

const anon = () => new Client(srv.base);
const rows = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
async function addFile(lessonId, { title, name, type, content = "contenu" }, client = prof) {
  const fd = new FormData();
  if (title !== undefined) fd.append("title", title);
  fd.append("attachment", new Blob([content], { type }), name);
  return client.request(`/formateur/lecons/${lessonId}/pieces-jointes`, { method: "POST", multipart: fd });
}
const onDisk = (webPath) => fs.existsSync(path.join(srv.dir, "uploads", webPath.replace(/^\/uploads\//, "")));

describe("texte de la leçon en Markdown", () => {
  test("mise en forme affichée, HTML saisi neutralisé", async () => {
    const c = await createCourse(prof, srv, {
      title: "Texte riche",
      price: 0,
      lessons: [{ title: "L", preview: true, description: "## Objectif\nComprendre **les bases**.\n\n<script>alert(1)</script>\n\n- point un\n- point deux" }],
    });
    const html = (await anon().get(`/apprendre/${c.slug}/${c.lessons[0].id}`)).text;
    assert.match(html, /<h3>Objectif<\/h3>/);
    assert.match(html, /<strong>les bases<\/strong>/);
    assert.match(html, /<ul><li>point un<\/li><li>point deux<\/li><\/ul>/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
  });
});

describe("pièces jointes", () => {
  let course, lessonId, pdf, png, html, link, eleve, autre;
  before(async () => {
    course = await createCourse(prof, srv, { title: "Pièces jointes", price: 10, lessons: [{ title: "L" }] });
    lessonId = course.lessons[0].id;
    await addFile(lessonId, { title: "Guide PDF", name: "guide.pdf", type: "application/pdf" });
    await addFile(lessonId, { title: "Schéma", name: "schema.png", type: "image/png", content: "PNGDATA" });
    await addFile(lessonId, { title: "Piège", name: "piege.html", type: "text/html", content: "<script>alert(1)</script>" });
    await prof.post(`/formateur/lecons/${lessonId}/liens`, { title: "Documentation", url: "https://exemple.com/doc" });
    const list = rows("SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY position, id", lessonId);
    [pdf, png, html, link] = list;
    eleve = await newStudent(srv);
    await buy(eleve, course);
    autre = await newStudent(srv);
  });

  test("quatre pièces jointes enregistrées dans l'ordre", () => {
    assert.equal(rows("SELECT COUNT(*) n FROM lesson_attachments WHERE lesson_id = ?", lessonId)[0].n, 4);
    assert.deepEqual([pdf.kind, png.kind, html.kind, link.kind], ["file", "file", "file", "link"]);
    assert.deepEqual([pdf.title, link.title], ["Guide PDF", "Documentation"]);
    assert.ok(pdf.position < png.position && png.position < link.position);
    assert.match(pdf.path, /^\/uploads\/resources\/.+\.pdf$/);
  });
  test("le titre par défaut est le nom du fichier", async () => {
    await addFile(lessonId, { name: "sans-titre.zip", type: "application/zip" });
    const last = rows("SELECT title FROM lesson_attachments WHERE lesson_id = ? ORDER BY id DESC LIMIT 1", lessonId)[0];
    assert.equal(last.title, "sans-titre.zip");
  });
  test("la leçon affiche : téléchargement, image en ligne, lien externe sûr", async () => {
    const page = (await eleve.get(`/apprendre/${course.slug}/${lessonId}`)).text;
    assert.match(page, new RegExp(`href="${pdf.path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"[^>]*download`));
    assert.match(page, new RegExp(`<img[^>]+src="${png.path.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"[^>]+alt="Schéma"`));
    assert.match(page, /<a[^>]+href="https:\/\/exemple\.com\/doc"[^>]+rel="noopener noreferrer"/);
    assert.doesNotMatch(page, /<img[^>]+piege\.html/, "un fichier html n'est jamais affiché en ligne");
  });
  test("non inscrit : page refusée, aucune pièce jointe divulguée", async () => {
    const r = await autre.get(`/apprendre/${course.slug}/${lessonId}`);
    assert.equal(r.status, 403);
    assert.doesNotMatch(r.text, /uploads\/resources|exemple\.com\/doc|Guide PDF/);
  });
  test("accès aux fichiers : visiteur 401, non inscrit 403, inscrit et formateur 200", async () => {
    assert.equal((await anon().get(pdf.path)).status, 401);
    assert.equal((await autre.get(pdf.path)).status, 403);
    assert.equal((await eleve.get(pdf.path)).status, 200);
    assert.equal((await prof.get(pdf.path)).status, 200);
  });
  test("une image est servie comme image, un PDF comme téléchargement, un .html jamais comme page", async () => {
    const img = await eleve.get(png.path);
    assert.match(img.headers.get("content-type"), /image\/png/);
    assert.doesNotMatch(img.headers.get("content-disposition") || "", /attachment/);
    const doc = await eleve.get(pdf.path);
    assert.match(doc.headers.get("content-disposition"), /attachment; filename="Guide PDF\.pdf"/, "titre + vraie extension");
    assert.doesNotMatch(doc.headers.get("content-type"), /pdf|html/);
    const trap = await eleve.get(html.path);
    assert.match(trap.headers.get("content-disposition"), /attachment/);
    assert.doesNotMatch(trap.headers.get("content-type"), /html/);
  });
  test("liens : seules les adresses http(s) sont acceptées", async () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://exemple.com/f", "pas une adresse", ""]) {
      const before = rows("SELECT COUNT(*) n FROM lesson_attachments WHERE lesson_id = ?", lessonId)[0].n;
      const r = await prof.post(`/formateur/lecons/${lessonId}/liens`, { title: "X", url: bad });
      assert.equal(r.status, 400, `lien accepté : ${bad}`);
      assert.equal(rows("SELECT COUNT(*) n FROM lesson_attachments WHERE lesson_id = ?", lessonId)[0].n, before);
    }
  });
  test("seul le formateur peut ajouter ou supprimer des pièces jointes", async () => {
    assert.equal((await addFile(lessonId, { name: "x.pdf", type: "application/pdf" }, eleve)).status, 403);
    assert.equal((await eleve.post(`/formateur/pieces-jointes/${pdf.id}/supprimer`, {})).status, 403);
    assert.equal((await eleve.post(`/formateur/lecons/${lessonId}/liens`, { title: "x", url: "https://a.b" })).status, 403);
  });
  test("supprimer une pièce jointe efface la ligne ET le fichier", async () => {
    assert.ok(onDisk(pdf.path), "le fichier existe avant");
    await prof.post(`/formateur/pieces-jointes/${pdf.id}/supprimer`, {});
    assert.equal(rows("SELECT COUNT(*) n FROM lesson_attachments WHERE id = ?", pdf.id)[0].n, 0);
    assert.equal(onDisk(pdf.path), false, "le fichier doit avoir disparu du disque");
    assert.equal((await eleve.get(pdf.path)).status, 404);
  });
  test("le formulaire du programme liste les pièces jointes avec un bouton de suppression", async () => {
    const page = (await prof.get(`/formateur/cours/${course.id}/curriculum?lecon=${lessonId}`)).text;
    assert.match(page, /Schéma/);
    assert.match(page, new RegExp(`/formateur/pieces-jointes/${png.id}/supprimer`));
    assert.match(page, /name="attachment"/);
    assert.match(page, /name="url"/);
  });
  test("une leçon sans pièce jointe n'affiche pas de section vide", async () => {
    const c = await createCourse(prof, srv, { title: "Sans pièce jointe", price: 0, lessons: [{ title: "L", preview: true }] });
    assert.doesNotMatch((await anon().get(`/apprendre/${c.slug}/${c.lessons[0].id}`)).text, /Ressources de la leçon/);
  });
  test("supprimer une formation jamais vendue efface aussi ses pièces jointes du disque", async () => {
    const c = await createCourse(prof, srv, { title: "À nettoyer", price: 0, lessons: [{ title: "L" }] });
    await addFile(c.lessons[0].id, { name: "a.pdf", type: "application/pdf" });
    const p = rows("SELECT path FROM lesson_attachments WHERE lesson_id = ?", c.lessons[0].id)[0].path;
    assert.ok(onDisk(p));
    await prof.post(`/formateur/cours/${c.id}/supprimer`, {});
    assert.equal(onDisk(p), false);
  });
  test("supprimer une leçon efface ses pièces jointes du disque", async () => {
    const c = await createCourse(prof, srv, { title: "Leçon à retirer", price: 0, lessons: [{ title: "L" }] });
    await addFile(c.lessons[0].id, { name: "b.pdf", type: "application/pdf" });
    const p = rows("SELECT path FROM lesson_attachments WHERE lesson_id = ?", c.lessons[0].id)[0].path;
    await prof.post(`/formateur/lecons/${c.lessons[0].id}/supprimer`, {});
    assert.equal(onDisk(p), false);
  });
});

describe("migration des anciennes ressources", () => {
  test("une ancienne « ressource téléchargeable » devient une pièce jointe, une seule fois", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-migr-"));
    const env = { ...process.env, DATA_DIR: path.join(dir, "data"), UPLOADS_DIR: path.join(dir, "uploads") };
    const boot = () => {
      const r = spawnSync(process.execPath, ["-e", 'require("./src/config/database")'], { cwd: ROOT, env, encoding: "utf8" });
      assert.equal(r.status, 0, r.stderr);
    };
    boot(); // crée le schéma
    const db = new DatabaseSync(path.join(dir, "data", "KOYEKOLA.db"));
    db.exec("INSERT INTO users (username, email, password_hash, role) VALUES ('p', 'p@t.l', 'x', 'formateur')");
    db.exec("INSERT INTO courses (instructor_id, title, slug) VALUES (1, 'C', 'c')");
    db.exec("INSERT INTO sections (course_id, title) VALUES (1, 'S')");
    db.exec("INSERT INTO lessons (section_id, title, resource_path, resource_name) VALUES (1, 'L', '/uploads/resources/ancien.pdf', 'Ancien support.pdf')");
    db.close();
    boot(); // simule le démarrage suivant : la migration s'exécute
    boot(); // et un troisième démarrage ne doit rien dupliquer
    const check = new DatabaseSync(path.join(dir, "data", "KOYEKOLA.db"));
    const list = check.prepare("SELECT kind, title, path FROM lesson_attachments").all();
    check.close();
    fs.rmSync(dir, { recursive: true, force: true });
    assert.equal(list.length, 1, JSON.stringify(list));
    assert.equal(list[0].kind, "file");
    assert.equal(list[0].title, "Ancien support.pdf");
    assert.equal(list[0].path, "/uploads/resources/ancien.pdf");
  });
});
