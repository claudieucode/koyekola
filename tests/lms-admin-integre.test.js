// Espace « Formations » intégré au CMS : données réelles, isolation entre sites, publication limitée au site (base jetable, vraies migrations marketing).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const data = require("../src/services/lmsAdminData");

let env;
const ids = {};
before(() => {
  env = freshMarketing();
  const { db } = env;
  db.exec(`
    CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, instructor_id INTEGER NOT NULL, title TEXT NOT NULL, slug TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Autre', level TEXT NOT NULL DEFAULT 'debutant', price_cents INTEGER NOT NULL DEFAULT 0, thumbnail_path TEXT, published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE sections (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, title TEXT NOT NULL DEFAULT 's', position INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, section_id INTEGER NOT NULL, title TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, course_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, course_id));
    CREATE TABLE lesson_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, lesson_id INTEGER NOT NULL, completed_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, lesson_id));
    CREATE TABLE certificates (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, course_id INTEGER, student_name TEXT NOT NULL, course_title TEXT NOT NULL, issued_at TEXT NOT NULL DEFAULT (datetime('now')), revoked_at TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, total_cents INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, course_id INTEGER NOT NULL, price_cents INTEGER NOT NULL DEFAULT 0);
  `);
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'A', 'a', '{}'), (1, 'B', 'b', '{}')");
  [ids.A, ids.B] = db.prepare("SELECT id FROM mk_sites ORDER BY id").all().map((r) => r.id);
  db.exec("INSERT INTO users (username, email, role) VALUES ('prof', 'p@x.fr', 'formateur'), ('alice', 'a@x.fr', 'etudiant'), ('bob', 'b@x.fr', 'etudiant')");
  const mk = (title, price, published) => db.prepare("INSERT INTO courses (instructor_id, title, slug, price_cents, published) VALUES (1, ?, ?, ?, ?)").run(title, title.toLowerCase(), price, published).lastInsertRowid;
  ids.main = mk("Principal", 0, 1); ids.ca = mk("CoursA", 5000, 1); ids.ca2 = mk("BrouillonA", 0, 0); ids.cb = mk("CoursB", 9000, 1);
  db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id) VALUES (?, 1, ?)").run(ids.ca, ids.A);
  db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id) VALUES (?, 1, ?)").run(ids.ca2, ids.A);
  db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id) VALUES (?, 1, ?)").run(ids.cb, ids.B);
  // CoursA : 2 leçons ; alice les termine (100 %), bob en termine une (50 %). CoursB : bob inscrit.
  const sec = db.prepare("INSERT INTO sections (course_id) VALUES (?)").run(ids.ca).lastInsertRowid;
  const l1 = db.prepare("INSERT INTO lessons (section_id, title) VALUES (?, 'l1')").run(sec).lastInsertRowid, l2 = db.prepare("INSERT INTO lessons (section_id, title) VALUES (?, 'l2')").run(sec).lastInsertRowid;
  db.exec(`INSERT INTO enrollments (user_id, course_id) VALUES (2, ${ids.ca}), (3, ${ids.ca}), (3, ${ids.cb})`);
  db.exec(`INSERT INTO lesson_progress (user_id, lesson_id) VALUES (2, ${l1}), (2, ${l2}), (3, ${l1})`);
  db.exec(`INSERT INTO certificates (code, user_id, course_id, student_name, course_title) VALUES ('KOL-A1', 2, ${ids.ca}, 'alice', 'CoursA'), ('KOL-B1', 3, ${ids.cb}, 'bob', 'CoursB')`);
  const o = db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (2, 5000)").run().lastInsertRowid; db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 5000)").run(o, ids.ca);
  const o2 = db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (3, 9000)").run().lastInsertRowid; db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 9000)").run(o2, ids.cb);
});

describe("tableau de bord : chiffres réels et isolés", () => {
  test("site A : seulement ses formations, étudiants, progression et revenus", () => {
    const ov = data.overview(env.db, ids.A);
    assert.equal(ov.courses, 2); assert.equal(ov.published, 1); assert.equal(ov.drafts, 1); assert.equal(ov.paidCourses, 1);
    assert.equal(ov.students, 2); assert.equal(ov.enrollments, 2); assert.equal(ov.completed, 1); assert.equal(ov.inProgress, 1);
    assert.equal(ov.avgProgress, 75); assert.equal(ov.revenueCents, 5000); assert.equal(ov.orders, 1);
  });
  test("site B et site principal ne voient pas les données de A", () => {
    const b = data.overview(env.db, ids.B); assert.equal(b.courses, 1); assert.equal(b.students, 1); assert.equal(b.revenueCents, 9000);
    const main = data.overview(env.db, null); assert.equal(main.courses, 1); assert.equal(main.students, 0); assert.equal(main.revenueCents, 0); assert.equal(main.avgProgress, null);
  });
  test("identifiant de site invalide : rien, jamais « tout »", () => {
    assert.equal(data.overview(env.db, 0).courses, 0);
    assert.equal(data.listCourses(env.db, "x").total, 0);
  });
});

describe("listes isolées", () => {
  test("formations : recherche, statut, tri", () => {
    assert.equal(data.listCourses(env.db, ids.A).total, 2);
    assert.deepEqual(data.listCourses(env.db, ids.A, { status: "draft" }).items.map((c) => c.title), ["BrouillonA"]);
    assert.deepEqual(data.listCourses(env.db, ids.A, { q: "cours" }).items.map((c) => c.title), ["CoursA"]);
    assert.equal(data.listCourses(env.db, ids.A, { q: "CoursB" }).total, 0);
    assert.equal(data.listCourses(env.db, ids.A, { q: "%" }).total, 0); // le joker n'est pas interprété
  });
  test("étudiants : progression par inscription, filtre de formation, jamais d'un autre site", () => {
    const l = data.listStudents(env.db, ids.A);
    assert.equal(l.total, 2);
    assert.deepEqual(l.items.map((r) => [r.username, r.progress]).sort(), [["alice", 100], ["bob", 50]]);
    assert.equal(data.listStudents(env.db, ids.A, { courseId: ids.cb }).total, 0);
    assert.equal(data.listStudents(env.db, ids.B).total, 1);
  });
  test("certificats isolés", () => {
    assert.deepEqual(data.listCertificates(env.db, ids.A).items.map((c) => c.code), ["KOL-A1"]);
    assert.deepEqual(data.listCertificates(env.db, ids.B).items.map((c) => c.code), ["KOL-B1"]);
  });
});

describe("publication", () => {
  test("publier / dépublier une formation de CE site", () => {
    assert.equal(data.setPublished(env.db, ids.A, ids.ca2, true), true);
    assert.equal(env.db.prepare("SELECT published FROM courses WHERE id = ?").get(ids.ca2).published, 1);
    assert.equal(data.setPublished(env.db, ids.A, ids.ca2, false), true);
  });
  test("formation d'un autre site : aucun effet", () => {
    assert.equal(data.setPublished(env.db, ids.A, ids.cb, false), false);
    assert.equal(env.db.prepare("SELECT published FROM courses WHERE id = ?").get(ids.cb).published, 1);
    assert.equal(data.setPublished(env.db, null, ids.ca, false), false);
    assert.equal(data.setPublished(env.db, ids.A, "1 OR 1=1", false), false);
  });
});
