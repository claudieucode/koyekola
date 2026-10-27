// Titan XXIII — rattachement des formations aux sites (migration 112, services/lmsSites). Base jetable avec les vraies migrations.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema } = require("./marketing-helpers");
const modules = require("../src/marketing/siteModules");
const lms = require("../src/services/lmsSites");

let env;
const ids = {};
before(() => {
  env = freshMarketing();
  addLmsSchema(env.db);
  const { db } = env;
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Design', 'design', '{}'), (1, 'Video', 'video', '{}'), (2, 'Autre org', 'autre', '{}')");
  [ids.A, ids.B, ids.C] = db.prepare("SELECT id FROM mk_sites ORDER BY id").all().map((r) => r.id);
  for (const t of ["Principal", "Cours A", "Cours B"]) db.prepare("INSERT INTO courses (title, slug) VALUES (?, ?)").run(t, t.toLowerCase().replace(" ", "-"));
  [ids.main, ids.ca, ids.cb] = db.prepare("SELECT id FROM courses ORDER BY id").all().map((r) => r.id);
});

const team = (extra = {}) => ({ ...env.A, ...extra });
const listIds = (siteId) => { const s = lms.scopeSql(siteId); return env.db.prepare(`SELECT id FROM courses WHERE ${s.sql} ORDER BY id`).all(...s.params).map((r) => r.id); };

describe("migration 112", () => {
  test("table vide à la création : toutes les formations existantes restent au site principal", () => {
    assert.equal(env.db.prepare("SELECT COUNT(*) n FROM mk_course_sites").get().n, 0);
    assert.deepEqual(listIds(null), [ids.main, ids.ca, ids.cb]);
  });
  test("organisation cohérente et champs figés", () => {
    assert.throws(() => env.db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id) VALUES (?, 1, ?)").run(ids.ca, ids.C), /même organisation/);
  });
});

describe("isolation par site", () => {
  test("activation obligatoire : sans module « lms », aucun rattachement", () => {
    assert.throws(() => lms.assignCourse(team(), ids.ca, ids.A), (e) => e.code === "module_disabled");
    modules.setEnabled(team(), ids.A, "lms", true); modules.setEnabled(team(), ids.B, "lms", true);
  });
  test("une formation rattachée n'apparaît que sur son site (jamais sur le principal ni sur l'autre site)", () => {
    assert.deepEqual(lms.assignCourse(team(), ids.ca, ids.A), { changed: true });
    assert.deepEqual(lms.assignCourse(team(), ids.cb, ids.B), { changed: true });
    assert.deepEqual(listIds(ids.A), [ids.ca]);
    assert.deepEqual(listIds(ids.B), [ids.cb]);
    assert.deepEqual(listIds(null), [ids.main], "le site principal ne voit plus les formations des sites");
  });
  test("idempotent ; pas de déplacement silencieux vers un autre site", () => {
    assert.deepEqual(lms.assignCourse(team(), ids.ca, ids.A), { changed: false });
    assert.throws(() => lms.assignCourse(team(), ids.ca, ids.B), (e) => e.code === "conflict");
    assert.equal(lms.siteOfCourse(env.db, ids.ca), ids.A);
  });
  test("une personne limitée au site A ne peut rien rattacher au site B ; site d'une autre organisation introuvable", () => {
    assert.throws(() => lms.assignCourse(team({ siteScope: ids.A }), ids.main, ids.B), (e) => e.code === "forbidden");
    assert.throws(() => lms.assignCourse(team(), ids.main, ids.C), (e) => e.code === "not_found");
  });
  test("belongsTo : un identifiant de formation d'un autre site est refusé, quel que soit l'identifiant envoyé", () => {
    assert.equal(lms.belongsTo(env.db, ids.ca, ids.A), true);
    assert.equal(lms.belongsTo(env.db, ids.ca, ids.B), false);
    assert.equal(lms.belongsTo(env.db, ids.ca, null), false);
    assert.equal(lms.belongsTo(env.db, ids.main, null), true);
    assert.equal(lms.belongsTo(env.db, ids.main, ids.A), false);
    assert.equal(lms.belongsTo(env.db, 99999, null), false);
  });
  test("identifiant de site invalide ou injecté : aucune formation, jamais « toutes »", () => {
    for (const bad of [0, -1, 1.5, "1 OR 1=1", NaN]) assert.deepEqual(listIds(bad), [], String(bad));
  });
  test("désactiver le module ne supprime rien : les formations restent rattachées", () => {
    modules.setEnabled(team(), ids.A, "lms", false);
    assert.equal(lms.siteOfCourse(env.db, ids.ca), ids.A);
    assert.deepEqual(listIds(ids.A), [ids.ca]);
  });
  test("purgeOrphans ne retire que les lignes dont la formation a disparu", () => {
    env.db.prepare("INSERT INTO mk_course_sites (course_id, organization_id, site_id) VALUES (777, 1, ?)").run(ids.B);
    assert.equal(lms.purgeOrphans(env.db), 1);
    assert.equal(env.db.prepare("SELECT COUNT(*) n FROM mk_course_sites").get().n, 2);
  });
});
