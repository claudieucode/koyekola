// Palier 12 — la migration « révision des composants » (ex-071 de la branche widgets-catalogue, collision avec 071_isolation_des_sites) porte le numéro 114 :
// elle s'applique APRÈS toutes les migrations déjà déployées (le runner refuse un numéro plus ancien que la dernière appliquée), ajoute une colonne sans toucher aux données.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");

const DIR = path.join(__dirname, "..", "src", "marketing", "migrations");
const quiet = { log() {}, warn() {} };

test("aucun numéro de migration en double, et l'ancien nom en collision n'existe plus", () => {
  const nums = fs.readdirSync(DIR).filter((f) => /^\d+_.+\.sql$/.test(f)).map((f) => f.split("_")[0]);
  assert.equal(new Set(nums).size, nums.length, "deux migrations portent le même numéro");
  assert.ok(!fs.readdirSync(DIR).some((f) => /^071_composants_revision/.test(f)));
  assert.ok(fs.existsSync(path.join(DIR, "114_composants_revision.sql")));
});

test("mise à niveau d'une base déjà migrée jusqu'à 113 : 114 puis les suivantes (115…) s'appliquent seules, les composants existants sont conservés avec la révision 0", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p12-mig-"));
  const before = path.join(tmp, "avant"); fs.mkdirSync(before);
  for (const f of fs.readdirSync(DIR)) if (parseInt(f, 10) < 114) fs.copyFileSync(path.join(DIR, f), path.join(before, f));
  const db = new DatabaseSync(path.join(tmp, "t.db"));
  db.exec("PRAGMA foreign_keys = ON");
  const r1 = migrate(db, { dir: before, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet });
  assert.ok(r1.applied.length > 50 && !r1.applied.includes("114"));
  db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run();
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  db.prepare("INSERT INTO mk_web_components (organization_id, name, section) VALUES (?, 'Existant', '{}')").run(org);
  const r2 = migrate(db, { dir: DIR, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet });
  assert.deepEqual(r2.applied, ["114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130"]); // 130 = index de cms_theme_settings ; 129 = réglages par thème et par site ; 128 = Theme Builder du site principal (site_id nullable) ; 127 = index des clés étrangères de la boutique ; 126 = e-mail de notification de formulaire ; 125 = intégration Mailchimp (API Marketing v3 et Transactional) ; 124 = Theme Builder par site (Programme 23.1) ; 123 = bibliothèque professionnelle de modèles (Programme 20.4) ; 122 = constructeur de boutique par IA (Programme 21.10) ; 121 = boutique (Programme 20.5) ; 120 = interface Assistant IA (Programme 21.8) ; 119 = cours par site (LMS universel) ; 118 = contenus IA (Programme 21.6) ; 115 = index des clés étrangères des médias (Palier 18) ; 116 = journal et quotas du Kolakisa AI Core (Programme 21.2) ; 117 = plans de site préparés par l'IA (Programme 21.3)
  const row = db.prepare("SELECT name, revision FROM mk_web_components").get();
  assert.deepEqual({ ...row }, { name: "Existant", revision: 0 });
  assert.deepEqual(migrate(db, { dir: DIR, dbPath: path.join(tmp, "t.db"), backupDir: path.join(tmp, "sauv"), log: quiet }).applied, [], "idempotent");
  db.close(); fs.rmSync(tmp, { recursive: true, force: true });
});
