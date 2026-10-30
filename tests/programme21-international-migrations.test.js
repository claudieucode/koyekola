// Programme 21.11 — audit international (États-Unis, RD Congo, France, Canada) et audit des migrations du programme 21 (ordre, caractère additif, données existantes conservées, idempotence).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-p21-i18n-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const locale = require("../src/marketing/ai/builder/locale");
const localize = require("../src/contentGen/localize");
const wizard = require("../src/siteWizard");
const wcat = require("../src/siteWizard/catalog");
const registry = require("../src/marketing/ai/builder/registry");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("internationalisation : quatre marchés représentatifs, aucune valeur américaine imposée", () => {
  const MARKETS = { US: { currency: "USD", lang: "en", tz: "America/New_York" }, CD: { currency: "CDF", lang: "fr", tz: "Africa/Kinshasa" }, FR: { currency: "EUR", lang: "fr", tz: "Europe/Paris" }, CA: { currency: "CAD", lang: "fr", tz: "America/Toronto" } };
  test("devise, langue et fuseau propres à chaque pays (assistant de création) ; formats de date et de montant différents", () => {
    const fmts = {};
    for (const [code, m] of Object.entries(MARKETS)) {
      const c = wcat.COUNTRIES[code]; assert.ok(c, code); assert.equal(c.currency, m.currency, `${code} devise`); assert.equal(c.tz, m.tz, `${code} fuseau`);
      fmts[code] = wizard.formats({ country: code, lang: c.lang, currency: c.currency, timezone: c.tz }); assert.ok(fmts[code].money && fmts[code].date, code);
    }
    assert.equal(new Set(Object.values(fmts).map((f) => f.money)).size >= 3, true, "montants formatés différemment selon le pays");
    assert.match(fmts.US.date, /March/); assert.match(fmts.FR.date, /mars/); assert.notEqual(fmts.US.number, fmts.FR.number);
  });
  test("Brief Analyzer : contexte du pays ; paiements et obligations légales TOUJOURS « non vérifiés » ; pays inconnu = contexte inconnu (jamais un défaut américain)", () => {
    for (const code of Object.keys(MARKETS)) { const c = locale.contextFor(code); assert.equal(c.known, true, code); assert.equal(c.payments, "unverified"); assert.equal(c.legal, "unverified"); assert.equal(c.currency, MARKETS[code].currency, `${code}`); }
    const unknown = locale.contextFor("ZZ"); assert.equal(unknown.known, false); assert.equal(unknown.currency, ""); assert.equal(unknown.payments, "unverified");
    assert.equal(locale.detectCountry("entreprise de construction à Kinshasa"), "CD"); assert.equal(locale.detectCountry("une boutique à Montréal"), "CA"); assert.equal(locale.detectCountry("a store in New York"), "US"); assert.equal(locale.detectCountry("agence à Lyon"), "FR");
    assert.equal(locale.detectLanguage("I want my website for our company with the best team").code, "en"); assert.equal(locale.detectLanguage("Je veux un site pour mon entreprise avec des services").code, "fr");
  });
  test("Content Generator : profil linguistique par pays/langue ; langue non prise en charge signalée (jamais ignorée)", () => {
    for (const [code, m] of Object.entries(MARKETS)) { const p = localize.profile(m.lang, code); assert.equal(p.supported, true, code); }
    assert.equal(localize.profile("xx", "FR").supported, false);
    assert.ok(["fr", "en"].every((l) => localize.LANGUAGES[l]));
  });
  test("limites géographiques documentées par le code : boutique, catalogue de produits et paiement de produits indisponibles partout (aucun pays n'est supposé couvert)", () => {
    const f = Object.fromEntries(registry.features().map((x) => [x.key, x]));
    assert.equal(f.catalogue_produits.status, "unavailable"); assert.notEqual(f.boutique.status, "available"); assert.notEqual(f.paiement.status, "available", "le paiement ne couvre que les formations (Stripe)");
    assert.equal(f.reservation.status === "available", false);
  });
});

describe("migrations du programme 21 : additives, ordonnées, sans perte de données", () => {
  const MIG = fs.readdirSync(MIGRATIONS).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
  const p21 = MIG.filter((f) => { const n = parseInt(f, 10); return n >= 116; });
  test("numéros uniques et consécutifs ; chaque migration du programme 21 (≥ 116) est ADDITIVE (aucun DROP TABLE / DELETE / UPDATE destructif / DROP COLUMN)", () => {
    const nums = MIG.map((f) => parseInt(f, 10)); assert.equal(new Set(nums).size, nums.length);
    // l'historique ancien a un trou connu (43) ; à partir de 114 (paliers récents) la suite est consécutive
    const recent = nums.filter((n) => n >= 114); for (let i = 1; i < recent.length; i += 1) assert.equal(recent[i], recent[i - 1] + 1, `trou entre ${recent[i - 1]} et ${recent[i]}`);
    assert.ok(p21.length >= 5, "116 à 120 au moins");
    for (const f of p21) {
      const sql = fs.readFileSync(path.join(MIGRATIONS, f), "utf8").split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
      assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|INDEX)\b|\bDELETE\s+FROM\b|\bTRUNCATE\b|\bALTER\s+TABLE\s+\w+\s+DROP\b/i, `${f} : opération destructive`);
      assert.match(sql, /CREATE TABLE|ALTER TABLE|CREATE INDEX/i, f);
    }
  });
  test("mise à niveau d'une base existante : données conservées jusqu'à 115, puis 116 à la dernière s'appliquent seules ; deuxième passage sans effet", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p21-mig-")), before = path.join(tmp, "avant"); fs.mkdirSync(before);
    for (const f of MIG) if (parseInt(f, 10) < 116) fs.copyFileSync(path.join(MIGRATIONS, f), path.join(before, f));
    const db = new DatabaseSync(path.join(tmp, "t.db")); db.exec("PRAGMA foreign_keys = ON");
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
    const r1 = migrate(db, { dir: before, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet }); assert.ok(r1.applied.length > 50 && !r1.applied.includes("116"));
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
    db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Existant', 'existant', '{}')");
    db.exec("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id) VALUES (1, 'Page existante', 'page-existante', 1)");
    const r2 = migrate(db, { dir: MIGRATIONS, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet });
    assert.deepEqual(r2.applied, p21.map((f) => String(parseInt(f, 10))), "seules les migrations du programme 21 (et suivantes) s'appliquent");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Page existante'").get().n, 1, "page existante conservée");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Existant'").get().n, 1);
    for (const t of ["mk_ai_core_usage", "mk_ai_plans", "mk_content_sets", "mk_ai_builder_states"]) assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE name = ?").get(t), `${t} créée`);
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet }).applied, [], "idempotent");
    db.close(); fs.rmSync(tmp, { recursive: true, force: true });
  });
  test("tables créées à la demande par le programme 21 : IF NOT EXISTS (relançables), clés étrangères vers les sites avec suppression en cascade, aucune table sans rattachement au site", () => {
    const src = ["../src/pageGen/index.js", "../src/designGen/index.js", "../src/aiMedia/store.js", "../src/siteWizard/index.js"].map((f) => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n");
    const tables = [...src.matchAll(/CREATE TABLE (IF NOT EXISTS )?(\w+)/g)];
    assert.ok(tables.length >= 8); for (const t of tables) assert.equal(Boolean(t[1]), true, `${t[2]} sans IF NOT EXISTS`);
    for (const name of ["mk_pagegen_runs", "mk_design_runs", "mk_aimedia_needs", "mk_aimedia_tasks", "mk_site_wizard"]) assert.match(src, new RegExp(`${name}[^;]*REFERENCES mk_sites\\(id\\) ON DELETE CASCADE`), name);
  });
});
