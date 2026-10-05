// Cohérence des chiffres entre le Centre de gestion, le tableau de bord et le module Marketing :
// même définition pour le chiffre d'affaires, le panier moyen (commandes PAYANTES) et le début de mois (heure de Paris).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// Base isolée, créée AVANT de charger l'application (qui lit DATA_DIR à l'import)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-an-"));
process.env.DATA_DIR = path.join(dir, "data");
process.env.UPLOADS_DIR = path.join(dir, "uploads");
process.env.NODE_ENV = "test";
const seed = spawnSync(process.execPath, [path.join(__dirname, "..", "src", "config", "seed.js")], { env: process.env });
assert.equal(seed.status, 0, "seed de la base isolée");

const db = require("../src/config/database");
const common = require("../src/services/gestion/common");
const analytics = require("../src/services/gestion/analytics");
const dashboard = require("../src/services/dashboard");

let prof, course, student;
const addOrder = (total, at) => {
  const o = db.prepare("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, ?, ?)").run(student, total, at);
  db.prepare("INSERT INTO order_items (order_id, course_id, price_cents, list_price_cents) VALUES (?, ?, ?, ?)").run(o.lastInsertRowid, course.id, total, course.price_cents);
};
// Ce que le module Marketing considère comme « ventes » : commandes payantes uniquement
const marketing = () => db.prepare("SELECT COUNT(*) orders, COALESCE(SUM(total_cents), 0) cents FROM orders WHERE total_cents > 0").get();
const gestion = () => analytics.report(prof, common.period({ periode: "perso", du: "2020-01-01", au: "2030-12-31" })).kpis;

before(() => {
  prof = db.prepare("SELECT id FROM users WHERE role = 'formateur'").get().id;
  course = db.prepare("SELECT id, price_cents FROM courses WHERE instructor_id = ? AND price_cents > 0 LIMIT 1").get(prof);
  student = db.prepare("SELECT id FROM users WHERE role = 'etudiant' LIMIT 1").get().id;
});
after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("chiffre d'affaires : identique dans les trois sources", () => {
  const m = marketing();
  assert.equal(gestion().revenue, m.cents);
  assert.equal(dashboard.stats(prof).revenueCents, m.cents);
});

test("une commande gratuite compte comme commande mais ne baisse JAMAIS le panier moyen", () => {
  const avant = gestion();
  addOrder(0, "2026-10-02 10:00:00"); // code promo à 100 %
  const apres = gestion();
  assert.equal(apres.orders, avant.orders + 1, "la commande gratuite est une commande");
  assert.equal(apres.revenue, avant.revenue);
  assert.equal(apres.average, avant.average, "panier moyen inchangé");
  const m = marketing();
  assert.equal(apres.average, Math.round(m.cents / m.orders), "même panier moyen que le module Marketing");
});

test("aucune commande payante : panier moyen indisponible (null), jamais 0 ni NaN", () => {
  db.exec("DELETE FROM order_items; DELETE FROM orders");
  addOrder(0, "2026-10-02 10:00:00");
  const k = gestion();
  assert.equal(k.orders, 1);
  assert.equal(k.average, null);
});

test("début de mois à l'heure de Paris : une vente à 00:30 (Paris) le 1er compte dans le nouveau mois", () => {
  db.exec("DELETE FROM order_items; DELETE FROM orders");
  addOrder(3999, "2026-09-30 22:30:00"); // 22:30 UTC le 30/09 = 00:30 le 1er octobre à Paris
  const now = new Date("2026-10-15T12:00:00Z");
  assert.equal(dashboard.stats(prof, now).revenueMonthCents, 3999, "tableau de bord : octobre");
  const octobre = analytics.report(prof, common.period({ periode: "perso", du: "2026-10-01", au: "2026-10-31" }, now)).kpis.revenue;
  assert.equal(octobre, 3999, "Centre de gestion : octobre");
  // et inversement : une vente à 21:30 UTC le 30/09 (23:30 Paris) reste en septembre
  db.exec("DELETE FROM order_items; DELETE FROM orders");
  addOrder(1000, "2026-09-30 21:30:00");
  assert.equal(dashboard.stats(prof, now).revenueMonthCents, 0);
});
