// R9-3 — mode « base réelle » de l'outil (appliquer-reel / retour-reel) : garde-fous exigés AVANT toute écriture (confirmations, application arrêtée, sauvegarde récente et saine de la même base). Bases SYNTHÉTIQUES jetables uniquement ;
// la « base réelle » simulée est un fichier jetable : aucune production n'est jamais ouverte.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const CLI = path.join(__dirname, "..", "scripts", "r9-migrer-site-maitre.js");
const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP)";
describe("R9-3 : mode base réelle (garde-fous)", () => {
  let dir, n = 0;
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: "utf8", env: { ...process.env, DATA_DIR: path.join(dir, "autre-dossier-de-donnees") } });
  const OK = ["--base-reelle-confirmee", "--application-arretee"];
  const make = () => { const f = path.join(dir, `production-simulee-${++n}.db`); const d = new DatabaseSync(f); d.exec("PRAGMA foreign_keys = ON"); d.exec(USERS); migrate(d, { dir: MIGRATIONS, dbPath: f, log: quiet });
    d.exec("INSERT INTO users (username, email) VALUES ('u', 'u@ex.cd')"); d.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')"); d.exec("INSERT INTO mk_sites (organization_id, name, slug) VALUES (1, 'Alpha', 'alpha'), (1, 'Bravo', 'bravo')"); d.close(); return f; };
  const backup = (src, suffix = "") => { const dst = src.replace(".db", `-sauvegarde${suffix}.db`); const d = new DatabaseSync(src, { readOnly: true }); d.exec(`VACUUM INTO '${dst.replace(/'/g, "''")}'`); d.close(); return dst; };
  before(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-reel-")); assert.deepEqual(fs.readdirSync(dir), []); });

  test("refus sans confirmation de base réelle, sans « application arrêtée », sans sauvegarde ; la base n'est pas touchée", () => {
    const f = make(), bk = backup(f), h = sha(f);
    assert.match(run("appliquer-reel", f, "--application-arretee", "--sauvegarde", bk).stderr, /--base-reelle-confirmee/);
    assert.match(run("appliquer-reel", f, "--base-reelle-confirmee", "--sauvegarde", bk).stderr, /--application-arretee/);
    assert.match(run("appliquer-reel", f, ...OK).stderr, /--sauvegarde/);
    assert.equal(sha(f), h);
  });
  test("refus si l'application n'est pas arrêtée (-wal non vide), si la sauvegarde manque, est vide, périmée, corrompue, identique à la base ou ne correspond pas à la base", () => {
    const f = make(), bk = backup(f), h = sha(f);
    fs.writeFileSync(f + "-wal", "x"); assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", bk).stderr, /encore utilisée/); fs.writeFileSync(f + "-wal", "");
    assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", path.join(dir, "absente.db")).stderr, /introuvable/);
    assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", f).stderr, /AUTRE fichier/);
    const empty = path.join(dir, "vide.db"); fs.writeFileSync(empty, ""); assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", empty).stderr, /0 octet/);
    const txt = path.join(dir, "texte.db"); fs.writeFileSync(txt, "pas une base".repeat(100)); assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", txt).stderr, /pas une base SQLite/);
    const old = backup(f, "-vieille"); const t = Date.now() / 1000 - 8 * 3600; fs.utimesSync(old, t, t); assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", old).stderr, /plus de 6 heures/);
    const corrupt = path.join(dir, "corrompue.db"); const buf = Buffer.from(fs.readFileSync(bk)); buf.fill(0x41, 4096, 4096 + 800); fs.writeFileSync(corrupt, buf); assert.notEqual(run("appliquer-reel", f, ...OK, "--sauvegarde", corrupt).status, 0);
    const g = make(), other = backup(g); const d = new DatabaseSync(f); d.exec("INSERT INTO mk_sites (organization_id, name, slug) VALUES (1, 'Charlie', 'charlie')"); d.close();
    assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", other).stderr, /ne correspond pas|mêmes tables/); assert.match(run("appliquer-reel", f, ...OK, "--sauvegarde", bk).stderr, /ne correspond pas à la base \(mk_sites/);
    const d2 = new DatabaseSync(f); assert.equal(d2.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_sites') WHERE name = 'is_primary'").get().n, 0, "aucune écriture"); d2.close(); assert.notEqual(sha(f), h);   // seul l'ajout de Charlie par le test a changé le fichier
  });
  test("avec une sauvegarde récente et saine : application réussie ; seconde exécution refusée ; retour arrière réel avec une NOUVELLE sauvegarde ; les commandes « copie » refusent toujours une base nommée production", () => {
    const f = make(), bk = backup(f);
    const ap = run("appliquer-reel", f, ...OK, "--sauvegarde", bk); assert.equal(ap.status, 0, ap.stderr); assert.match(ap.stdout, /Sauvegarde contrôlée/); assert.match(ap.stdout, /migration R9-3 appliquée : site principal n° \d+/);
    const d = new DatabaseSync(f, { readOnly: true }); assert.equal(d.prepare("SELECT COUNT(*) n FROM mk_sites WHERE is_primary = 1").get().n, 1); d.close();
    assert.notEqual(run("appliquer-reel", f, ...OK, "--sauvegarde", bk).status, 0, "l'ancienne sauvegarde ne correspond plus ; la migration est de toute façon déjà appliquée");
    const bk2 = backup(f, "-2");   // NOUVELLE sauvegarde, faite après l'application
    const re = run("retour-reel", f, ...OK, "--sauvegarde", bk2); assert.equal(re.status, 0, re.stderr); assert.match(re.stdout, /retour arrière R9-3 effectué/);
    const bad = path.join(dir, "production.db"); fs.copyFileSync(f, bad); assert.match(run("appliquer", bad, "--copie-confirmee").stderr, /ne désigne pas une copie/);
  });
  test("le code du mode réel ne supprime rien et ne contacte aucun hôte", () => { const c = fs.readFileSync(CLI, "utf8"); assert.doesNotMatch(c, /rmSync|unlinkSync|rmdirSync|\bssh\b|https?:\/\//); });
});
