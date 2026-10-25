// « Mes formations » (espace élève, /mes-cours) : états réels (à commencer / en cours / terminée), progression persistée, ordre par activité,
// reprise vers la bonne leçon, isolation entre élèves, état vide, présence des contrôles de recherche et de filtre.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, a, b, cNew, cStarted, cDone;
before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  cNew = await createCourse(prof, srv, { title: "Zèbre neuf", lessons: [{ title: "N1" }, { title: "N2" }] });
  cStarted = await createCourse(prof, srv, { title: "Alpha en cours", lessons: [{ title: "S1" }, { title: "S2" }, { title: "S3" }, { title: "S4" }] });
  cDone = await createCourse(prof, srv, { title: "Beta terminée", lessons: [{ title: "D1" }, { title: "D2" }] });
  a = await newStudent(srv); b = await newStudent(srv);
  for (const c of [cNew, cStarted, cDone]) await buy(a, c);
  const db = srv.db();
  const uid = db.prepare("SELECT id FROM users WHERE email = ?").get(a.email).id;
  db.prepare("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(uid, cStarted.lessons[0].id);
  db.prepare("INSERT INTO lesson_state (user_id, lesson_id, updated_at) VALUES (?, ?, ?)").run(uid, cStarted.lessons[1].id, Date.now());
  for (const l of cDone.lessons) db.prepare("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(uid, l.id);
  db.close();
});
after(() => srv.stop());

const cardOf = (html, title) => { const c = html.split("<article ").find((x) => x.includes(`data-title="${title.toLowerCase()}"`)); return c ? { status: (c.match(/data-status="(\w+)"/) || [])[1], html: c } : null; };

describe("Mes formations", () => {
  test("états, progression et ordre viennent des données enregistrées", async () => {
    const html = (await a.get("/mes-cours")).text;
    assert.equal(cardOf(html, "Alpha en cours").status, "started");
    assert.equal(cardOf(html, "Zèbre neuf").status, "new");
    assert.equal(cardOf(html, "Beta terminée").status, "finished");
    assert.match(cardOf(html, "Alpha en cours").html, /aria-valuenow="25"/);
    assert.match(html, /1 \/ 4 sous-chapitres/);
    const order = [...html.matchAll(/<article class="mc-card"[^>]*data-status="(\w+)"/g)].map((m) => m[1]);
    assert.deepEqual(order, ["started", "new", "finished"], "en cours, puis à commencer, puis terminées");
  });
  test("reprise : le bandeau mène à la dernière leçon ouverte, les cartes à la route de reprise", async () => {
    const html = (await a.get("/mes-cours")).text;
    assert.match(html, new RegExp(`class="btn btn-primary btn-lg mc-resume-cta"`));
    assert.match(html, new RegExp(`href="/apprendre/${cStarted.slug}/${cStarted.lessons[1].id}"`));
    assert.match(html, new RegExp(`href="/certificat/${cDone.slug}"`));
    assert.match(html, /Continuer/); assert.match(html, /Commencer/);
  });
  test("recherche et filtres : contrôles présents, accessibles, script chargé", async () => {
    const html = (await a.get("/mes-cours")).text;
    assert.match(html, /data-mc-q/); assert.match(html, /aria-pressed="true"/); assert.match(html, /role="status"/);
    assert.match(html, /\/js\/mes-cours\.js/);
    assert.match(html, /Toutes <b>3<\/b>/); assert.match(html, /Terminées <b>1<\/b>/);
  });
  test("isolation : un autre élève ne voit ni les formations ni la progression", async () => {
    const html = (await b.get("/mes-cours")).text;
    assert.match(html, /Vous n(?:'|&#39;)avez pas encore de formation/);
    assert.doesNotMatch(html, /Alpha en cours|Zèbre neuf|Beta terminée|mc-card/);
  });
  test("accès réservé aux comptes connectés", async () => {
    const { Client } = require("./helpers");
    const r = await new Client(srv.base).get("/mes-cours");
    assert.equal(r.status, 302);
  });
  test("le script de filtre ne contient pas d'appel réseau", () => {
    const js = fs.readFileSync(path.join(__dirname, "../public/js/mes-cours.js"), "utf8");
    assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|innerHTML/);
  });
});
