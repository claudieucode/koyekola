// Constructeur de formations du CMS : opérations réelles, isolation entre sites (les deux conventions de rattachement), règles de suppression (base jetable).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const b = require("../src/services/lmsBuilderData");

let env, db;
const ids = {}, S = (siteId) => ({ db, organizationId: 1, siteId });
before(() => {
  env = freshMarketing(); db = env.db;
  db.exec(`
    CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, instructor_id INTEGER NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, subtitle TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Autre', level TEXT NOT NULL DEFAULT 'debutant', price_cents INTEGER NOT NULL DEFAULT 0, thumbnail_path TEXT, published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), site_id INTEGER);
    CREATE TABLE sections (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', video_path TEXT, video_url TEXT, duration_minutes INTEGER NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0, is_preview INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, course_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, course_id INTEGER NOT NULL, price_cents INTEGER NOT NULL DEFAULT 0);
  `);
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'A', 'a', '{}'), (1, 'B', 'b', '{}')");
  [ids.A, ids.B] = db.prepare("SELECT id FROM mk_sites ORDER BY id").all().map((r) => r.id);
});

describe("création et rattachement", () => {
  test("création sur un site : écrit les DEUX conventions ; visible seulement de ce site", () => {
    const id = b.createCourse(db, S(ids.A), 1, { title: "  Ma  formation ", price: "19,90", level: "avance", category: "Photo" });
    ids.a1 = id;
    const c = db.prepare("SELECT * FROM courses WHERE id = ?").get(id);
    assert.equal(c.title, "Ma formation"); assert.equal(c.price_cents, 1990); assert.equal(c.level, "avance"); assert.equal(c.site_id, ids.A);
    assert.equal(db.prepare("SELECT site_id FROM mk_course_sites WHERE course_id = ?").get(id).site_id, ids.A);
    assert.ok(b.courseOf(db, ids.A, id)); assert.equal(b.courseOf(db, ids.B, id), null); assert.equal(b.courseOf(db, null, id), null);
  });
  test("formation créée sur le principal : aucune ligne de site", () => {
    ids.m1 = b.createCourse(db, S(null), 1, { title: "Principale" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_course_sites WHERE course_id = ?").get(ids.m1).n, 0);
    assert.ok(b.courseOf(db, null, ids.m1)); assert.equal(b.courseOf(db, ids.A, ids.m1), null);
  });
  test("ancienne convention seule (courses.site_id sans ligne mk) : lue par le bon site", () => {
    const id = Number(db.prepare("INSERT INTO courses (instructor_id, title, slug, site_id) VALUES (1, 'Héritée', 'heritee', ?)").run(ids.B).lastInsertRowid);
    assert.ok(b.courseOf(db, ids.B, id)); assert.equal(b.courseOf(db, ids.A, id), null); assert.equal(b.courseOf(db, null, id), null);
  });
  test("titre vide refusé, slug unique, identifiant de site forgé : rien", () => {
    assert.throws(() => b.createCourse(db, S(null), 1, { title: "   " }), /obligatoire/);
    const x = b.createCourse(db, S(null), 1, { title: "Principale" });
    assert.equal(db.prepare("SELECT slug FROM courses WHERE id = ?").get(x).slug, "principale-2");
    assert.equal(b.courseOf(db, "1 OR 1=1", ids.m1), null); assert.equal(b.courseOf(db, 0, ids.m1), null);
  });
});

describe("programme : chapitres et leçons", () => {
  test("ajout, renommage, ordre et suppression", () => {
    const s1 = b.addSection(db, ids.A, ids.a1, "Un"), s2 = b.addSection(db, ids.A, ids.a1, "Deux");
    assert.deepEqual(b.curriculum(db, ids.a1).map((s) => s.title), ["Un", "Deux"]);
    b.moveSection(db, ids.A, s2, "haut"); assert.deepEqual(b.curriculum(db, ids.a1).map((s) => s.title), ["Deux", "Un"]);
    assert.equal(b.renameSection(db, ids.A, s1, " Premier "), ids.a1); assert.equal(b.curriculum(db, ids.a1)[1].title, "Premier");
    const l1 = b.addLesson(db, ids.A, s1, "L1").id, l2 = b.addLesson(db, ids.A, s1, "L2").id, l3 = b.addLesson(db, ids.A, s2, "L3").id;
    b.moveLesson(db, ids.A, l2, "haut"); assert.deepEqual(b.curriculum(db, ids.a1)[1].lessons.map((l) => l.title), ["L2", "L1"]);
    b.moveLesson(db, ids.A, l2, "haut"); // en tête du chapitre : passe en fin du chapitre précédent
    const cur = b.curriculum(db, ids.a1); assert.deepEqual(cur[0].lessons.map((l) => l.title), ["L3", "L2"]); assert.deepEqual(cur[1].lessons.map((l) => l.title), ["L1"]);
    b.deleteLesson(db, ids.A, l3); assert.deepEqual(b.curriculum(db, ids.a1)[0].lessons.map((l) => [l.title, l.position]), [["L2", 0]]);
    b.deleteSection(db, ids.A, s2); assert.deepEqual(b.curriculum(db, ids.a1).map((s) => [s.title, s.position]), [["Premier", 0]]);
    ids.l1 = l1;
  });
  test("leçon : lien vidéo http(s) seulement, durée bornée, changement de chapitre", () => {
    assert.throws(() => b.updateLesson(db, ids.A, ids.l1, { title: "x", video_url: "javascript:alert(1)" }), /Lien vidéo invalide/);
    assert.equal(b.updateLesson(db, ids.A, ids.l1, { title: " Leçon un ", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", duration_minutes: "99999", is_preview: "1", description: "Texte" }), ids.a1);
    const l = db.prepare("SELECT * FROM lessons WHERE id = ?").get(ids.l1);
    assert.equal(l.title, "Leçon un"); assert.equal(l.duration_minutes, 10000); assert.equal(l.is_preview, 1); assert.match(l.video_url, /^https:/);
  });
  test("un autre site ne peut ni lire ni modifier un chapitre ou une leçon", () => {
    const sec = b.curriculum(db, ids.a1)[0].id;
    assert.equal(b.sectionOf(db, ids.B, sec), null); assert.equal(b.lessonOf(db, ids.B, ids.l1), null);
    assert.equal(b.addSection(db, ids.B, ids.a1, "Intrus"), null); assert.equal(b.addLesson(db, ids.B, sec, "Intrus"), null);
    assert.equal(b.renameSection(db, ids.B, sec, "x"), null); assert.equal(b.moveSection(db, null, sec, "bas"), null);
    assert.equal(b.updateLesson(db, ids.B, ids.l1, { title: "x" }), null); assert.equal(b.moveLesson(db, ids.B, ids.l1, "bas"), null);
    assert.equal(b.deleteLesson(db, ids.B, ids.l1), null); assert.equal(b.deleteSection(db, ids.B, sec), null);
    assert.equal(b.updateCourse(db, ids.B, ids.a1, { title: "Volée" }), false); assert.equal(db.prepare("SELECT title FROM courses WHERE id = ?").get(ids.a1).title, "Ma formation");
    assert.deepEqual(b.deleteCourse(db, ids.B, ids.a1), { ok: false, reason: "not_found" });
  });
});

describe("duplication et suppression", () => {
  test("duplication : brouillon, même site, programme copié, original intact", () => {
    const n = b.duplicateCourse(db, S(ids.A), 1, ids.a1);
    const c = db.prepare("SELECT * FROM courses WHERE id = ?").get(n);
    assert.equal(c.published, 0); assert.match(c.title, /\(copie\)$/); assert.ok(b.courseOf(db, ids.A, n)); assert.equal(b.courseOf(db, ids.B, n), null);
    assert.equal(b.curriculum(db, n)[0].lessons[0].title, "Leçon un"); assert.equal(b.curriculum(db, ids.a1)[0].lessons.length, 1);
    assert.equal(b.duplicateCourse(db, S(ids.B), 1, ids.a1), null);
    ids.copy = n;
  });
  test("formation suivie ou achetée : suppression refusée ; sinon supprimée avec son programme", () => {
    db.prepare("INSERT INTO enrollments (user_id, course_id) VALUES (1, ?)").run(ids.a1);
    assert.deepEqual(b.deleteCourse(db, ids.A, ids.a1), { ok: false, reason: "used" }); assert.ok(b.courseOf(db, ids.A, ids.a1));
    assert.deepEqual(b.deleteCourse(db, ids.A, ids.copy), { ok: true });
    assert.equal(b.courseOf(db, ids.A, ids.copy), null);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM sections WHERE course_id = ?").get(ids.copy).n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_course_sites WHERE course_id = ?").get(ids.copy).n, 0);
  });
});
