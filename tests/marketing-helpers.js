// Aides communes aux tests du module marketing : base en mémoire avec les vraies migrations.
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { createEventBus } = require("../src/marketing/events/bus");
const { createSettings } = require("../src/marketing/settings");

const MIGRATIONS = path.join(__dirname, "..", "src", "marketing", "migrations");
const TEST_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const quiet = { log() {}, warn() {}, error() {} };
const T0 = 1_800_000_000_000;

// Renvoie { db, bus, ctx(orgId?), ctxB } : deux organisations pour tester l'isolation
function freshMarketing() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
  const bus = createEventBus(db, { log: quiet, now: () => T0 });
  const settings = createSettings(db, { encryptionKey: TEST_KEY });
  const ctx = (organizationId = 1, extra = {}) => ({ db, organizationId, userId: 7, bus, settings, tokenKey: TEST_KEY, baseUrl: "https://k.test", now: () => T0, log: quiet, ...extra });
  return { db, bus, ctx, A: ctx(1), B: ctx(2) };
}

// Tables du LMS utilisées par le pont (mêmes noms et colonnes que src/config/database.js)
function addLmsSchema(db) {
  db.exec(`
    CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE sections (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL);
    CREATE TABLE lessons (id INTEGER PRIMARY KEY AUTOINCREMENT, section_id INTEGER NOT NULL, title TEXT NOT NULL);
    CREATE TABLE enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, course_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, course_id));
    CREATE TABLE lesson_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, lesson_id INTEGER NOT NULL, completed_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, lesson_id));
    CREATE TABLE reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL, user_id INTEGER NOT NULL, rating INTEGER NOT NULL, comment TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(course_id, user_id));
    CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, total_cents INTEGER NOT NULL DEFAULT 0, coupon_code TEXT, discount_cents INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE order_refunds (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id), stripe_refund_id TEXT NOT NULL UNIQUE, amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'eur', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE checkout_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, stripe_session_id TEXT, stripe_payment_intent TEXT, status TEXT NOT NULL DEFAULT 'pending', total_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'eur', order_id INTEGER, failure_reason TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, course_id INTEGER NOT NULL, price_cents INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE favorites (user_id INTEGER NOT NULL, course_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, course_id));
  `);
}

module.exports = { addLmsSchema, freshMarketing, TEST_KEY, quiet, T0, MIGRATIONS };
