// Étape 2 : notes personnelles, favoris et espace apprenant.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course, eleve, autre;
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const one = (sql, ...a) => q(sql, ...a)[0];
const note = (client, lessonId, content) => client.postJson(`/apprendre/lecon/${lessonId}/note`, { content });
const lessonUrl = (i) => `/apprendre/${course.slug}/${course.lessons[i].id}`;

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Espace apprenant", price: 0, lessons: [{ title: "Intro" }, { title: "Suite" }] });
  eleve = await newStudent(srv);
  await buy(eleve, course);
  autre = await newStudent(srv);
  await buy(autre, course);
});
after(() => srv.stop());

describe("notes personnelles", () => {
  test("une note est enregistrée pour la leçon", async () => {
    const r = await note(eleve, course.lessons[0].id, "Penser à revoir la partie 2");
    assert.equal(r.status, 200);
    assert.deepEqual(JSON.parse(r.text), { saved: true });
    assert.equal(one("SELECT content c FROM lesson_notes WHERE lesson_id = ?", course.lessons[0].id).c, "Penser à revoir la partie 2");
  });
  test("elle est réaffichée dans la leçon, dans un champ correctement libellé", async () => {
    const html = (await eleve.get(lessonUrl(0))).text;
    assert.match(html, /<label[^>]+for="lesson-note"[^>]*>[^<]*Mes notes/);
    assert.match(html, /<textarea[^>]+id="lesson-note"[^>]*>Penser à revoir la partie 2<\/textarea>/);
  });
  test("mettre à jour remplace la note (une seule par leçon)", async () => {
    await note(eleve, course.lessons[0].id, "Version 2");
    assert.equal(q("SELECT * FROM lesson_notes WHERE lesson_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)", course.lessons[0].id, eleve.email).length, 1);
    assert.match((await eleve.get(lessonUrl(0))).text, />Version 2<\/textarea>/);
  });
  test("une note vide supprime la note", async () => {
    await note(eleve, course.lessons[1].id, "à supprimer");
    await note(eleve, course.lessons[1].id, "   \n  ");
    assert.equal(q("SELECT * FROM lesson_notes WHERE lesson_id = ?", course.lessons[1].id).length, 0);
  });
  test("le contenu saisi ne peut jamais casser la page (échappement)", async () => {
    await note(eleve, course.lessons[1].id, "</textarea><script>alert(1)</script>");
    const html = (await eleve.get(lessonUrl(1))).text;
    assert.doesNotMatch(html, /<script>alert\(1\)/);
    assert.match(html, /&lt;\/textarea&gt;&lt;script&gt;/);
  });
  test("les notes sont privées : un autre élève ne les voit pas", async () => {
    const html = (await autre.get(lessonUrl(0))).text;
    assert.doesNotMatch(html, /Version 2/);
    assert.match(html, /<textarea[^>]+id="lesson-note"[^>]*><\/textarea>/);
  });
  test("limite de 10 000 caractères", async () => {
    assert.equal((await note(eleve, course.lessons[0].id, "x".repeat(10001))).status, 400);
    assert.equal((await note(eleve, course.lessons[0].id, "x".repeat(10000))).status, 200);
    assert.equal((await note(eleve, course.lessons[0].id, 12345)).status, 400);
    assert.equal((await eleve.postJson(`/apprendre/lecon/${course.lessons[0].id}/note`, {})).status, 400);
  });
  test("réservées aux inscrits : non inscrit et formateur reçoivent 403", async () => {
    const intrus = await newStudent(srv);
    assert.equal((await note(intrus, course.lessons[0].id, "x")).status, 403);
    assert.equal((await note(prof, course.lessons[0].id, "x")).status, 403);
    assert.doesNotMatch((await prof.get(lessonUrl(0))).text, /id="lesson-note"/);
  });
  test("elles sont retrouvées dans l'espace personnel avec un lien vers la leçon", async () => {
    await note(eleve, course.lessons[0].id, "Ma note visible dans le tableau de bord");
    const html = (await eleve.get("/mes-cours")).text;
    assert.match(html, /<h2[^>]*>Mes notes<\/h2>/);
    assert.match(html, /Ma note visible dans le tableau de bord/);
    assert.match(html, new RegExp(`href="${lessonUrl(0).replace(/\//g, "\\/")}"`));
    assert.doesNotMatch((await autre.get("/mes-cours")).text, /Ma note visible/);
  });
});

describe("favoris", () => {
  test("ajouter puis retirer une formation des favoris", async () => {
    const r1 = await eleve.post(`/favoris/${course.id}`, {});
    assert.equal(r1.status, 302);
    assert.equal(q("SELECT * FROM favorites WHERE course_id = ?", course.id).length, 1);
    await eleve.post(`/favoris/${course.id}`, {});
    assert.equal(q("SELECT * FROM favorites WHERE course_id = ?", course.id).length, 0);
  });
  test("le bouton de la fiche reflète l'état (aria-pressed)", async () => {
    const off = (await eleve.get(`/cours/${course.slug}`)).text;
    assert.match(off, /aria-pressed="false"[^>]*>[^<]*<[^>]*>[^<]*Ajouter aux favoris|Ajouter aux favoris/);
    await eleve.post(`/favoris/${course.id}`, {});
    const on = (await eleve.get(`/cours/${course.slug}`)).text;
    assert.match(on, /aria-pressed="true"/);
    assert.match(on, /Retirer des favoris/);
  });
  test("ils apparaissent dans l'espace personnel avec un lien vers la fiche", async () => {
    const html = (await eleve.get("/mes-cours")).text;
    assert.match(html, /<h2[^>]*>Mes favoris<\/h2>/);
    assert.match(html, new RegExp(`href="/cours/${course.slug}"`));
  });
  test("chaque élève a ses propres favoris", async () => {
    assert.doesNotMatch((await autre.get("/mes-cours")).text, /<h2[^>]*>Mes favoris<\/h2>/);
  });
  test("un visiteur est invité à se connecter", async () => {
    const visiteur = new Client(srv.base);
    const r = await visiteur.post(`/favoris/${course.id}`, {});
    assert.equal(r.status, 302);
    assert.match(r.location, /\/connexion/);
    assert.match((await visiteur.get(`/cours/${course.slug}`)).text, /href="\/connexion\?redirect=[^"]*"[^>]*>[^<]*(<[^>]*>[^<]*)*Ajouter aux favoris/);
  });
  test("on ne peut pas mettre en favori une formation non publiée", async () => {
    const brouillon = await createCourse(prof, srv, { title: "Brouillon favori", price: 0, publish: false });
    const r = await autre.post(`/favoris/${brouillon.id}`, {});
    assert.equal(r.status, 404);
    assert.equal(q("SELECT * FROM favorites WHERE course_id = ?", brouillon.id).length, 0);
  });
  test("une redirection ne peut pas mener hors du site", async () => {
    const r = await eleve.post(`/favoris/${course.id}`, {}, { headers: { Referer: `${srv.base}/catalogue` } });
    assert.equal(r.location, "/catalogue");
  });
});

describe("espace apprenant : en cours / terminées", () => {
  let terminee, enCours, etudiant;
  before(async () => {
    terminee = await createCourse(prof, srv, { title: "Déjà finie", price: 0, lessons: [{ title: "A" }, { title: "B" }] });
    enCours = await createCourse(prof, srv, { title: "Encore en route", price: 0, lessons: [{ title: "C" }, { title: "D" }, { title: "E" }] });
    etudiant = await newStudent(srv);
    await buy(etudiant, terminee);
    await buy(etudiant, enCours);
    for (const l of terminee.lessons) await etudiant.post(`/apprendre/lecon/${l.id}/terminer`, {});
    await etudiant.post(`/apprendre/lecon/${enCours.lessons[0].id}/terminer`, {});
  });

  test("les formations sont réparties entre « En cours » et « Terminées »", async () => {
    const html = (await etudiant.get("/mes-cours")).text;
    const sections = html.split(/<h2[^>]*>/);
    const bloc = (titre) => sections.find((s) => s.startsWith(titre)) || "";
    assert.match(bloc("En cours"), /Encore en route/);
    assert.doesNotMatch(bloc("En cours"), /Déjà finie/);
    assert.match(bloc("Terminées"), /Déjà finie/);
    assert.doesNotMatch(bloc("Terminées"), /Encore en route/);
  });
  test("progression affichée pour chaque formation en cours", async () => {
    const html = (await etudiant.get("/mes-cours")).text;
    assert.match(html, /1 \/ 3 sous-chapitres terminés \(33%\)/);
  });
  test("une formation terminée propose le certificat", async () => {
    const html = (await etudiant.get("/mes-cours")).text;
    assert.match(html, new RegExp(`href="/certificat/${terminee.slug}"`));
  });
  test("un nouvel élève sans formation voit un message et un lien vers le catalogue", async () => {
    const neuf = await newStudent(srv);
    const html = (await neuf.get("/mes-cours")).text;
    assert.match(html, /href="\/catalogue"/);
    assert.doesNotMatch(html, /<h2[^>]*>En cours<\/h2>/);
  });
});
