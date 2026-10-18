// R9-3 — migration « ligne dédiée du site maître » : préconditions, application, retour arrière, refus sûrs, atomicité, absence d'effet sur les sites ordinaires. Bases SQLite SYNTHÉTIQUES jetables uniquement.
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
const M = require("../scripts/r9/site-maitre");

const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP)";
const CLI = path.join(__dirname, "..", "scripts", "r9-migrer-site-maitre.js");

describe("R9-3 : ligne dédiée du site maître", () => {
  let dir, n = 0;
  before(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-mig-")); assert.deepEqual(fs.readdirSync(dir), []); });
  // Base synthétique : migrations marketing complètes (jusqu'à 091), 1 organisation, 3 sites secondaires avec leurs données
  const make = (name = `jetable-${++n}.db`, { sites = true } = {}) => {
    const f = path.join(dir, name); const d = new DatabaseSync(f); d.exec("PRAGMA foreign_keys = ON"); d.exec(USERS);
    migrate(d, { dir: MIGRATIONS, dbPath: f, log: quiet });
    d.exec("INSERT INTO users (username, email) VALUES ('u', 'u@ex.cd'), ('v', 'v@ex.cd')");
    d.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')");
    if (sites) {
      d.exec("INSERT INTO mk_sites (organization_id, name, slug, settings) VALUES (1, 'Alpha', 'alpha', '{\"seo\":{\"publicUrl\":\"https://alpha.test\"}}'), (1, 'Bravo', 'bravo', '{}'), (1, 'Charlie', 'charlie', '{}')");
      d.exec("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, seo) VALUES (1, 'Pa', 'pa', 'Pa', 'draft', 1, '{}'), (1, 'Pb', 'pb', 'Pb', 'draft', 2, '{}'), (1, 'P0', 'p0', 'P0', 'draft', NULL, '{}')");
      d.exec("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (1, 1, 'admin'), (2, 2, 'editor')");
      d.exec("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'a@ex.cd', 1), (1, 'p@ex.cd', NULL)");
      d.exec("INSERT INTO seo_redirects (source_path, target, status, enabled, site_id) VALUES ('/x', '/y', 301, 1, NULL), ('/x', '/z', 301, 1, 1)");
    }
    return d;
  };
  const content = (d) => { const o = {}; for (const t of Object.keys(M.tableCounts(d)).filter((x) => !["mk_sites", "schema_migrations", "sqlite_sequence"].includes(x))) o[t] = crypto.createHash("sha256").update(JSON.stringify(d.prepare(`SELECT * FROM "${t}" ORDER BY rowid`).all())).digest("hex"); return o; };

  test("1. base initiale (sans ligne dédiée) : préconditions satisfaites, état « non appliquée » cohérent", () => {
    const d = make(); const p = M.prerequis(d); assert.equal(p.ok, true, p.blocking.join(";")); const e = M.etat(d); assert.equal(e.appliquee, false); assert.equal(e.coherent, true); assert.equal(e.principal, null);
  });
  test("2. application : une seule ligne ajoutée, aucun autre compte de lignes ne change, sites ordinaires et contenus identiques, index et déclencheurs existants conservés", () => {
    const d = make(); const before = { counts: M.tableCounts(d), content: content(d), sites: JSON.stringify(M.secondaries(d)), st: M.structure(d), sig: M.signature(d) };
    const r = M.appliquer(d); assert.ok(r.primaryId > 3);
    const after = M.tableCounts(d); const diff = Object.keys(after).filter((t) => after[t] !== before.counts[t]).sort(); assert.deepEqual(diff, ["mk_sites", "schema_migrations"]);
    assert.equal(after.mk_sites, before.counts.mk_sites + 1); assert.deepEqual(content(d), before.content, "aucune autre table modifiée"); assert.equal(JSON.stringify(M.secondaries(d)), before.sites, "sites ordinaires identiques");
    const st = M.structure(d); for (const i of before.st.index) assert.ok(st.index.includes(i), `index conservé : ${i.slice(0, 60)}`); for (const t of before.st.declencheurs) assert.ok(st.declencheurs.includes(t), "déclencheur conservé");
    assert.equal(st.declencheurs.length, before.st.declencheurs.length + 3); assert.ok(st.index.some((i) => /uq_mk_sites_primary/.test(i)));
    const row = d.prepare("SELECT * FROM mk_sites WHERE is_primary = 1").get(); assert.deepEqual([row.name, row.slug, row.site_type, row.status, row.organization_id], ["Site principal", "principal", "principal", "active", 1]);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'r9' AND version = '092'").get().n, 1); assert.equal(M.etat(d).appliquee, true);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id IS NULL").get().n, 1, "le contenu du principal reste en NULL");
  });
  test("3. NULL et l'identifiant de la ligne dédiée ne sont PAS interchangeables : aucune ligne n'est rattachée au nouvel identifiant", () => {
    const d = make(); const { primaryId } = M.appliquer(d);
    for (const [t, c] of M.siteColumns(d)) assert.equal(d.prepare(`SELECT COUNT(*) n FROM "${t}" WHERE "${c}" = ?`).get(primaryId).n, 0, `${t}.${c}`);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS NULL").get().n, 1);
  });
  test("4. protections de la ligne : suppression, archivage, changement de rôle ou d'organisation refusés ; un seul principal par organisation ; création de sites ordinaires inchangée", () => {
    const d = make(); M.appliquer(d); const id = d.prepare("SELECT id FROM mk_sites WHERE is_primary = 1").get().id;
    assert.throws(() => d.prepare("DELETE FROM mk_sites WHERE id = ?").run(id), /ne peut pas être supprimé/);
    assert.throws(() => d.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(id), /ni archivé ni supprimé/);
    assert.throws(() => d.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = ?").run(id), /ni archivé ni supprimé/);
    assert.throws(() => d.prepare("UPDATE mk_sites SET is_primary = 0 WHERE id = ?").run(id), /figés/);
    assert.throws(() => d.prepare("UPDATE mk_sites SET is_primary = 1 WHERE name = 'Alpha'").run(), /UNIQUE|unique/i);
    assert.throws(() => d.prepare("INSERT INTO mk_sites (organization_id, name, is_primary) VALUES (1, 'Second maître', 1)").run(), /UNIQUE|unique/i);
    assert.equal(d.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Delta')").run().changes, 1);
    assert.equal(d.prepare("UPDATE mk_sites SET status = 'archived' WHERE name = 'Alpha'").run().changes, 1, "les sites ordinaires restent archivables");
  });
  test("5. compatibilité : le moteur de migrations marketing ignore la ligne r9 (aucun refus de démarrage, rien à appliquer)", () => {
    const d = make(); M.appliquer(d); const r = migrate(d, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }); assert.deepEqual(r.applied, []);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'marketing' AND version = '092'").get().n, 0);
    assert.ok(!fs.readdirSync(MIGRATIONS).some((f) => /^092/.test(f)), "la migration n'est pas dans le dossier des migrations automatiques");
  });
  test("6. base déjà migrée : seconde exécution refusée, base inchangée", () => {
    const d = make(); M.appliquer(d); const sig = M.signature(d), counts = M.tableCounts(d);
    assert.throws(() => M.appliquer(d), /déjà appliquée/); assert.equal(M.signature(d), sig); assert.deepEqual(M.tableCounts(d), counts); assert.equal(M.prerequis(d).applied, true);
  });
  test("7. retour arrière : structure, comptes et contenus identiques à l'état initial ; identifiant rendu ; nouvelle application identique", () => {
    const d = make(); const before = { sig: M.signature(d), counts: M.tableCounts(d), content: content(d), sites: JSON.stringify(M.secondaries(d)), st: M.structure(d) };
    const first = M.appliquer(d); const back = M.retour(d); assert.equal(back.retire, first.primaryId);
    assert.deepEqual(M.structure(d), before.st, "colonnes, index et déclencheurs identiques à l'état initial"); assert.equal(M.signature(d), before.sig);
    assert.deepEqual(M.tableCounts(d), before.counts); assert.deepEqual(content(d), before.content); assert.equal(JSON.stringify(M.secondaries(d)), before.sites);
    assert.equal(M.etat(d).appliquee, false); assert.equal(M.etat(d).coherent, true);
    const again = M.appliquer(d); assert.equal(again.primaryId, first.primaryId, "nouvelle migration après retour : même identifiant"); assert.equal(M.etat(d).appliquee, true);
    M.retour(d); assert.equal(M.signature(d), before.sig);
  });
  test("8. retour arrière refusé (et base inchangée) si des données ont été associées au site principal après la migration", () => {
    for (const [label, sql] of [["page", (id) => `INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, seo) VALUES (1, 'N', 'n', 'N', 'draft', ${id}, '{}')`], ["membre", (id) => `INSERT INTO mk_site_members (site_id, user_id, role) VALUES (${id}, 1, 'viewer')`],
      ["contact", (id) => `INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'z@ex.cd', ${id})`], ["redirection", (id) => `INSERT INTO seo_redirects (source_path, target, status, enabled, site_id) VALUES ('/n', '/m', 301, 1, ${id})`]]) {
      const d = make(); const { primaryId } = M.appliquer(d); d.exec(sql(primaryId)); const sig = M.signature(d), counts = M.tableCounts(d);
      assert.throws(() => M.retour(d), /référencent le site principal/, label); assert.equal(M.signature(d), sig, label); assert.deepEqual(M.tableCounts(d), counts, label); assert.equal(M.etat(d).appliquee, true, label);
    }
  });
  test("9. retour arrière refusé si la ligne du principal a été modifiée (nom, réglages, page d'accueil)", () => {
    for (const set of ["name = 'Autre nom'", "settings = '{\"seo\":{\"publicUrl\":\"https://x.test\"}}'", "description = 'modifiée'", "tokens = '{\"a\":1}'"]) {
      const d = make(); M.appliquer(d); d.exec(`UPDATE mk_sites SET ${set} WHERE is_primary = 1`); assert.throws(() => M.retour(d), /modifiée depuis la migration/, set); assert.equal(M.etat(d).appliquee, true);
    }
  });
  test("10. arrêts sûrs avant toute écriture : doublon de nom ou d'adresse, plusieurs organisations, 091 absente, état incohérent, clé étrangère cassée", () => {
    const stop = (d, re) => { const sig = M.signature(d), counts = M.tableCounts(d); const p = M.prerequis(d); assert.equal(p.ok, false); assert.match(p.blocking.join(" | "), re); assert.throws(() => M.appliquer(d), /Refus/); assert.equal(M.signature(d), sig); assert.deepEqual(M.tableCounts(d), counts); };
    let d = make(); d.exec("UPDATE mk_sites SET name = 'SITE principal' WHERE name = 'Alpha'"); stop(d, /doublon potentiel.*nom/);
    d = make(); d.exec("UPDATE mk_sites SET slug = 'principal' WHERE name = 'Bravo'"); stop(d, /doublon potentiel.*adresse lisible/);
    d = make(); d.exec("INSERT INTO mk_organizations (name, slug) VALUES ('O2', 'o2')"); stop(d, /2 organisation\(s\).*D8/);
    d = make(); d.exec("DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '091'"); stop(d, /091/);
    d = make(); d.exec("ALTER TABLE mk_sites ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0"); stop(d, /état incohérent/);
    d = make(); d.exec("PRAGMA foreign_keys = OFF"); d.exec("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (999, 1, 'viewer')"); stop(d, /foreign_key_check/);
  });
  test("11. atomicité : un échec en cours d'application annule TOUT (colonne, index, déclencheurs, ligne, journal)", () => {
    const d = make(); d.exec("CREATE TRIGGER sabotage BEFORE INSERT ON mk_sites BEGIN SELECT RAISE(ABORT, 'sabotage de test'); END"); const sig = M.signature(d), counts = M.tableCounts(d);
    assert.throws(() => M.appliquer(d), /Application annulée.*sabotage/); assert.equal(M.signature(d), sig); assert.deepEqual(M.tableCounts(d), counts); assert.equal(M.etat(d).appliquee, false);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_sites') WHERE name = 'is_primary'").get().n, 0);
  });
  test("12. le retour arrière reste atomique : un échec le laisse dans l'état migré, intact", () => {
    const d = make(); M.appliquer(d); d.exec("CREATE TRIGGER sabotage_del BEFORE DELETE ON schema_migrations BEGIN SELECT RAISE(ABORT, 'sabotage retour'); END"); const sig = M.signature(d), counts = M.tableCounts(d);
    assert.throws(() => M.retour(d), /Retour arrière annulé.*sabotage/); assert.equal(M.signature(d), sig); assert.deepEqual(M.tableCounts(d), counts); assert.equal(M.etat(d).appliquee, true);
  });
  test("13. base sans aucun site secondaire : application et retour arrière corrects", () => {
    const d = make("sans-sites.db", { sites: false }); const sig = M.signature(d); const r = M.appliquer(d); assert.equal(r.primaryId, 1); M.retour(d); assert.equal(M.signature(d), sig);
  });
  test("14. outil en ligne de commande : garde-fous (copie confirmée, nom de copie, -wal), application puis retour sur une copie", () => {
    const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: "utf8", env: { ...process.env, DATA_DIR: path.join(dir, "vivante") } });
    const d = make("copie-cli.db"); d.close(); const f = path.join(dir, "copie-cli.db"); const sha = (x) => crypto.createHash("sha256").update(fs.readFileSync(x)).digest("hex");
    assert.match(run("appliquer", f).stderr, /--copie-confirmee/); const bad = path.join(dir, "production.db"); fs.copyFileSync(f, bad); assert.match(run("appliquer", bad, "--copie-confirmee").stderr, /ne désigne pas une copie/);
    fs.writeFileSync(f + "-wal", "x"); assert.match(run("appliquer", f, "--copie-confirmee").stderr, /n'est pas vide/); fs.writeFileSync(f + "-wal", "");
    const h0 = sha(f); assert.equal(run("prerequis", f, "--copie-confirmee").status, 0); assert.equal(run("etat", f, "--copie-confirmee").status, 0); assert.equal(sha(f), h0, "prerequis et etat en lecture seule");
    const ap = run("appliquer", f, "--copie-confirmee"); assert.equal(ap.status, 0, ap.stderr); assert.match(ap.stdout, /site principal n° \d+ créé/); assert.match(run("etat", f, "--copie-confirmee").stdout, /Appliquée : oui/);
    assert.notEqual(run("appliquer", f, "--copie-confirmee").status, 0);
    const re = run("retour", f, "--copie-confirmee"); assert.equal(re.status, 0, re.stderr); assert.match(re.stdout, /Retour arrière effectué/); assert.match(run("etat", f, "--copie-confirmee").stdout, /Appliquée : non/);
  });
  test("15. code : la migration n'écrit que dans la base reçue, ne supprime que la ligne du principal, aucune suppression de fichier", () => {
    const code = fs.readFileSync(path.join(__dirname, "..", "scripts", "r9", "site-maitre.js"), "utf8") + fs.readFileSync(CLI, "utf8");
    assert.doesNotMatch(code, /rmSync|unlinkSync|rmdirSync/); assert.equal((M.UP.match(/DELETE FROM|DROP TABLE|TRUNCATE/gi) || []).length, 0, "la montée ne supprime rien");
    assert.deepEqual((M.DOWN.match(/DELETE FROM [a-z_]+ WHERE [a-z_ =0-9]+/gi) || []), ["DELETE FROM mk_sites WHERE is_primary = 1"]);
  });
});
