// Pont LMS → événements : un certificat délivré devient l'événement « lms.certificate_issued » (automatisations, segments, webhooks).
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema } = require("./marketing-helpers");
const bridge = require("../src/marketing/bridge/events");
const { TRIGGERS } = require("../src/marketing/automations/catalog");

let m, A, ids;
const run = (sql, ...a) => Number(m.db.prepare(sql).run(...a).lastInsertRowid);
const events = (name) => m.db.prepare("SELECT * FROM mk_events WHERE name = ? ORDER BY id").all(name).map((e) => ({ ...e, metadata: JSON.parse(e.metadata) }));

beforeEach(() => {
  m = freshMarketing(); A = m.A;
  addLmsSchema(m.db);
  m.db.exec("CREATE TABLE certificates (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, user_id INTEGER, course_id INTEGER, course_title TEXT, issued_at TEXT DEFAULT (datetime('now')))");
  const course = run("INSERT INTO courses (title, slug) VALUES ('Final Cut Pro', 'final-cut-pro')");
  ids = { course, user: run("INSERT INTO users (username, email, role) VALUES ('diplomee', 'diplomee@ex.fr', 'etudiant')") };
  bridge.syncLmsEvents(A); // initialisation : l'historique ne déclenche rien
});

test("certificat délivré → événement avec la formation et le code ; rejouer la lecture ne crée aucun doublon", () => {
  run("INSERT INTO certificates (code, user_id, course_id, course_title) VALUES ('KLK-ABCD-EFGH-JKMN', ?, ?, 'Final Cut Pro')", ids.user, ids.course);
  const r = bridge.syncLmsEvents(A);
  assert.equal(r.emitted.certificates, 1);
  const [e] = events("lms.certificate_issued");
  assert.deepEqual([e.metadata.courseId, e.metadata.title, e.metadata.slug, e.metadata.certificateCode], [ids.course, "Final Cut Pro", "final-cut-pro", "KLK-ABCD-EFGH-JKMN"]);
  // « plantage » : curseur remis en arrière, la clé d'idempotence évite le doublon
  m.db.prepare("UPDATE mk_bridge_cursors SET last_id = 0 WHERE source = 'certificates'").run();
  bridge.syncLmsEvents(A);
  assert.equal(events("lms.certificate_issued").length, 1);
});

test("les certificats déjà existants avant la première lecture ne déclenchent RIEN (pas de rattrapage massif)", () => {
  const fresh = freshMarketing();
  addLmsSchema(fresh.db);
  fresh.db.exec("CREATE TABLE certificates (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, user_id INTEGER, course_id INTEGER, course_title TEXT, issued_at TEXT DEFAULT (datetime('now')))");
  const u = Number(fresh.db.prepare("INSERT INTO users (username, email, role) VALUES ('ancienne', 'ancienne@ex.fr', 'etudiant')").run().lastInsertRowid);
  fresh.db.prepare("INSERT INTO certificates (code, user_id, course_id, course_title) VALUES ('KLK-AAAA-BBBB-CCCC', ?, 1, 'Ancienne')").run(u);
  const r = bridge.syncLmsEvents(fresh.A);
  assert.ok(r.initialized.includes("certificates"));
  assert.equal(fresh.db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'lms.certificate_issued'").get().n, 0);
});

test("sans table « certificates » (base du LMS ancienne) : le pont continue de fonctionner", () => {
  const old = freshMarketing();
  addLmsSchema(old.db); // pas de table certificates
  assert.doesNotThrow(() => bridge.syncLmsEvents(old.A));
});

test("l'événement est proposé comme déclencheur d'automatisation, de segment et de webhook", () => {
  assert.equal(TRIGGERS["lms.certificate_issued"].label, "Un certificat est délivré");
  assert.ok(TRIGGERS["lms.certificate_issued"].filters.some(([k]) => k === "courseId"));
  assert.match(require("fs").readFileSync(require.resolve("../src/marketing/webhooks/catalog.js"), "utf8"), /lms\.certificate_issued/);
  assert.match(require("fs").readFileSync(require.resolve("../src/marketing/segments/catalog.js"), "utf8"), /lms\.certificate_issued/);
});
