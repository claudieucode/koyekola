// Offres (prix promo avec dates) : prix effectif. Sans offre, le prix est EXACTEMENT celui d'avant (parité).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Base isolée, créée AVANT de charger l'application (qui lit DATA_DIR à l'import)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-pr-"));
process.env.DATA_DIR = path.join(dir, "data");
process.env.UPLOADS_DIR = path.join(dir, "uploads");
process.env.NODE_ENV = "test";
assert.equal(spawnSync(process.execPath, [path.join(__dirname, "..", "src", "config", "seed.js")], { env: process.env }).status, 0, "seed de la base isolée");

const db = require("../src/config/database");
const pricing = require("../src/services/pricing");

const NOW = new Date("2026-10-10T12:00:00Z");
const at = (s) => s; // dates SQL UTC « AAAA-MM-JJ HH:MM:SS »
let prof, course, others;
const clearOffers = () => db.exec("DELETE FROM offers");
const offer = (price, { name = "Offre", starts = null, ends = null, active = 1, courseId = course.id } = {}) =>
  Number(db.prepare("INSERT INTO offers (course_id, instructor_id, name, price_cents, starts_at, ends_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)").run(courseId, prof, name, price, starts, ends, active).lastInsertRowid);
const price = (c = course, now = NOW) => pricing.effectivePrice(c, now).price_cents;

before(() => {
  prof = db.prepare("SELECT id FROM users WHERE role = 'formateur'").get().id;
  course = db.prepare("SELECT * FROM courses WHERE instructor_id = ? AND price_cents > 1000 ORDER BY id LIMIT 1").get(prof);
  others = db.prepare("SELECT * FROM courses WHERE id <> ?").all(course.id);
});
after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("parité : sans aucune offre, le prix effectif de CHAQUE formation est son prix standard", () => {
  clearOffers();
  const all = db.prepare("SELECT * FROM courses").all();
  assert.ok(all.length >= 3, "plusieurs formations de démonstration");
  for (const c of all) {
    const p = pricing.effectivePrice(c, NOW);
    assert.equal(p.price_cents, c.price_cents, c.title);
    assert.equal(p.list_price_cents, c.price_cents);
    assert.equal(p.offer, null);
  }
});

test("une offre active baisse le prix ; le prix barré est le prix standard", () => {
  clearOffers();
  const id = offer(course.price_cents - 500, { name: "Lancement", ends: at("2026-10-31 22:00:00") });
  const p = pricing.effectivePrice(course, NOW);
  assert.equal(p.price_cents, course.price_cents - 500);
  assert.equal(p.list_price_cents, course.price_cents);
  assert.deepEqual(p.offer, { id, name: "Lancement", ends_at: "2026-10-31 22:00:00" });
});

test("période : future, expirée ou désactivée = ignorée ; début inclus, fin exclue", () => {
  clearOffers();
  const standard = course.price_cents;
  offer(100, { starts: at("2026-10-11 00:00:00") });                       // pas encore commencée
  offer(100, { ends: at("2026-10-10 11:59:59") });                         // déjà finie
  offer(100, { active: 0 });                                                // désactivée
  assert.equal(price(), standard, "aucune des trois ne s'applique");
  clearOffers();
  offer(100, { starts: at("2026-10-10 12:00:00") });
  assert.equal(price(), 100, "début inclus (à la seconde près)");
  clearOffers();
  offer(100, { ends: at("2026-10-10 12:00:00") });
  assert.equal(price(), standard, "fin exclue");
});

test("plusieurs offres actives : la moins chère l'emporte, à égalité la plus ancienne", () => {
  clearOffers();
  const a = offer(3000, { name: "A" });
  offer(2000, { name: "B" });
  const c = offer(2000, { name: "C" });
  void a; void c;
  const p = pricing.effectivePrice(course, NOW);
  assert.equal(p.price_cents, 2000);
  assert.equal(p.offer.name, "B");
});

test("une offre ne peut JAMAIS augmenter le prix (prix égal ou supérieur : ignorée)", () => {
  clearOffers();
  offer(course.price_cents);
  offer(course.price_cents + 5000);
  const p = pricing.effectivePrice(course, NOW);
  assert.equal(p.price_cents, course.price_cents);
  assert.equal(p.offer, null);
});

test("une offre à 0 € rend la formation gratuite pendant sa période", () => {
  clearOffers();
  offer(0);
  assert.equal(price(), 0);
});

test("liste (une requête) et fragment SQL (tri/filtre du catalogue) : mêmes prix que la fonction unitaire", () => {
  clearOffers();
  offer(course.price_cents - 1000, { name: "Promo" });
  offer(1, { courseId: others[0].id, ends: at("2026-10-09 00:00:00") }); // expirée
  offer(others[1].price_cents + 999, { courseId: others[1].id });         // plus chère : ignorée
  const all = db.prepare("SELECT * FROM courses").all();
  for (const now of [NOW, new Date("2026-01-01T00:00:00Z"), new Date("2030-01-01T00:00:00Z")]) {
    const bulk = pricing.effectivePrices(all, now);
    const sqlRows = db.prepare(`SELECT c.id, ${pricing.effectivePriceSql("c")} AS p FROM courses c`).all(...pricing.nowParams(now));
    for (const c of all) {
      const single = pricing.effectivePrice(c, now);
      assert.deepEqual(bulk.get(c.id), single, `liste = unitaire (${c.title})`);
      assert.equal(sqlRows.find((r) => r.id === c.id).p, single.price_cents, `SQL = unitaire (${c.title})`);
    }
  }
  assert.equal(pricing.effectivePrices([], NOW).size, 0);
});

test("contraintes : prix négatif et période inversée refusés ; la formation supprimée emporte ses offres", () => {
  clearOffers();
  assert.throws(() => offer(-1), /CHECK/);
  assert.throws(() => offer(100, { starts: at("2026-10-10 00:00:00"), ends: at("2026-10-09 00:00:00") }), /CHECK/);
  const temp = Number(db.prepare("INSERT INTO courses (instructor_id, title, slug, price_cents) VALUES (?, 'Temp', 'temp-offres', 5000)").run(prof).lastInsertRowid);
  offer(100, { courseId: temp });
  db.prepare("DELETE FROM courses WHERE id = ?").run(temp);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM offers WHERE course_id = ?").get(temp).n, 0);
});

test("module Marketing (e-mails, pages d'atterrissage) : le prix lu est le prix effectif, avec le prix habituel à côté", () => {
  clearOffers();
  const { getCourse } = require("../src/marketing/bridge/catalog");
  const ctx = { db, organizationId: 1 };
  assert.equal(getCourse(ctx, course.id).price_cents, course.price_cents, "sans offre : prix standard");
  offer(course.price_cents - 700, { name: "Promo e-mail" });
  const c = getCourse(ctx, course.id);
  assert.equal(c.price_cents, course.price_cents - 700);
  assert.equal(c.standard_price_cents, course.price_cents);
  clearOffers();
});

test("module Marketing sur une base sans table d'offres (ancienne base) : retombe sur le prix standard", () => {
  const { getCourse } = require("../src/marketing/bridge/catalog");
  const { DatabaseSync } = require("node:sqlite");
  const old = new DatabaseSync(":memory:");
  old.exec("CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, slug TEXT, subtitle TEXT, price_cents INTEGER, thumbnail_path TEXT, published INTEGER)");
  old.prepare("INSERT INTO courses VALUES (1, 'Ancienne', 'ancienne', '', 1234, '', 1)").run();
  const c = getCourse({ db: old, organizationId: 1 }, 1);
  assert.equal(c.price_cents, 1234);
  old.close();
});
