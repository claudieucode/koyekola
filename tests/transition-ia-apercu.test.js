// R7 (clôture) — APERÇU de la transition IA (086) sur une COPIE de base : script en lecture seule sur l'original, rapport par site (inclus/exclu + raison), et déroulé complet sur une base fichier :
// pas de réactivation d'un module désactivé volontairement, exécution unique, sites créés ensuite non activés, sites exclus restent désactivés. Base fichier jetable, aucune base réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const transitions = require("../src/marketing/transitions");

const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))";
const SCRIPT = path.join(__dirname, "..", "scripts", "previsualiser-transition-ia.js");
const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

describe("aperçu de la transition IA sur une copie de base d'AVANT R7 (080–089 non appliquées)", () => {
  let tmp, original, ids;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "apercu-ia-test-"));
    original = path.join(tmp, "avant.db");
    // base d'avant 080 : migrations < 080 seulement
    const dir = path.join(tmp, "m"); fs.mkdirSync(dir);
    for (const f of fs.readdirSync(MIGRATIONS)) if (f.slice(0, 3) < "080") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
    const db = new DatabaseSync(original); db.exec(USERS);
    migrate(db, { dir, dbPath: original, backupDir: path.join(tmp, "bk"), log: quiet });
    for (let i = 1; i <= 8; i++) db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(i, `u${i}`, `u${i}@x.fr`);
    db.exec("UPDATE users SET status = 'suspended' WHERE id = 6");
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
    db.exec("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, 5, 'editor')");
    db.exec("INSERT INTO mk_roles (organization_id, key, name, permissions) VALUES (1, 'redacteur', 'Rédacteur', '[\"forms.write\"]')");
    const site = (org, name, extra = "") => { const r = db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, name.toLowerCase()); if (extra) db.exec(`UPDATE mk_sites SET ${extra} WHERE id = ${r.lastInsertRowid}`); return Number(r.lastInsertRowid); };
    const member = (s, u, role) => db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(s, u, role);
    ids = { editeur: site(1, "Editeur"), perso: site(1, "Perso"), lecteur: site(1, "Lecteur"), suspendu: site(1, "Suspendu"), equipe: site(1, "Equipe"), vide: site(1, "Vide"), archive: site(1, "Archive", "status = 'archived'"), supprime: site(1, "Supprime", "deleted_at = datetime('now')"), autre: site(2, "Autre") };
    member(ids.editeur, 1, "editor"); member(ids.editeur, 2, "viewer"); member(ids.perso, 3, "redacteur"); member(ids.lecteur, 4, "viewer"); member(ids.suspendu, 6, "admin");
    member(ids.equipe, 5, "editor"); member(ids.archive, 1, "editor"); member(ids.supprime, 1, "editor"); member(ids.autre, 7, "author");
    db.close();
  });
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  test("le script ne modifie JAMAIS l'original (empreinte identique), n'active rien, supprime sa copie, et produit les nombres et les raisons", () => {
    const h = hash(original), sizeDir = fs.readdirSync(tmp).sort().join();
    const out = JSON.parse(execFileSync(process.execPath, [SCRIPT, original, "--json"], { encoding: "utf8" }));
    assert.equal(hash(original), h, "original intact");
    assert.equal(fs.readdirSync(tmp).sort().join(), sizeDir, "aucun fichier laissé à côté de l'original");
    assert.deepEqual([out.sitesTotal, out.inclus, out.exclus], [9, 2, 7]);
    const by = Object.fromEntries(out.sites.map((s) => [s.siteId, s]));
    assert.deepEqual([ids.editeur, ids.perso].map((i) => by[i].decision), ["inclus", "inclus"]);
    assert.deepEqual(by[ids.editeur].people, 1); assert.deepEqual(by[ids.editeur].memberReasons, { "rôle « viewer » sans forms.write": 1 }, "le lecteur du site est écarté mais l'éditeur suffit");
    assert.match(by[ids.lecteur].reason, /aucun membre avec accès réel/); assert.deepEqual(by[ids.lecteur].memberReasons, { "rôle « viewer » sans forms.write": 1 });
    assert.match(by[ids.suspendu].reason, /aucun membre avec accès réel/); assert.deepEqual(by[ids.suspendu].memberReasons, { "compte non actif": 1 });
    assert.deepEqual(by[ids.equipe].memberReasons, { "membre de l'équipe (non soumis à l'activation)": 1 });
    assert.equal(by[ids.vide].reason, "aucun membre"); assert.match(by[ids.archive].reason, /non actif \(archived\)/); assert.equal(by[ids.supprime].reason, "site supprimé");
    assert.deepEqual(by[ids.autre].memberReasons, { "rôle « author » sans forms.write": 1 }, "autre organisation : jugé avec SES rôles");
    assert.deepEqual(out.exclusParRaison, { "aucun membre avec accès réel au studio IA": 4, "aucun membre": 1, "site non actif (archived)": 1, "site supprimé": 1 });
    assert.ok(out.migrationsAppliqueesALaCopie.includes("086"), "les migrations ont été appliquées à la COPIE seulement");
    const check = new DatabaseSync(original, { readOnly: true });
    assert.equal(check.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name = 'mk_site_modules'").get().n, 0, "l'original n'a pas reçu les migrations");
    check.close();
  });
  test("déroulé sur une copie fichier migrée : exécution unique ; un module désactivé volontairement n'est jamais réactivé ; un site créé ensuite n'est pas activé ; les exclus restent désactivés", () => {
    const copy = path.join(tmp, "copie.db"); fs.copyFileSync(original, copy);
    const db = new DatabaseSync(copy); db.exec("PRAGMA foreign_keys = ON");
    migrate(db, { dir: MIGRATIONS, dbPath: copy, backupDir: path.join(tmp, "bk2"), log: quiet });
    db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, 1, 'ai', 0)").run(ids.perso); // l'équipe l'avait désactivé volontairement
    const before = transitions.aiEligibilityDetail(db).find((d) => d.siteId === ids.perso);
    assert.match(before.alreadyRow, /désactivé volontairement/);
    assert.deepEqual(transitions.runAiOnce(db, { log: {} }), { done: true, enabled: 1 }, "seul « Editeur » est activé");
    const on = () => db.prepare("SELECT site_id FROM mk_site_modules WHERE module = 'ai' AND enabled = 1 ORDER BY site_id").all().map((r) => r.site_id);
    assert.deepEqual(on(), [ids.editeur]);
    assert.deepEqual(transitions.runAiOnce(db, { log: {} }), { done: false, reason: "déjà exécutée" });
    const neuf = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Neuf', 'neuf', '{}')").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, 1, 'editor')").run(neuf);
    transitions.runAiOnce(db, { log: {} });
    assert.deepEqual(on(), [ids.editeur], "site créé après la transition : pas d'activation automatique");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'transition' AND version = '086'").get().n, 1);
    db.close();
  });
});
