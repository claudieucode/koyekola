// Marketing — fondations : chiffrement, paramètres, journal d'audit, organisations/permissions, dépôt isolé par organisation.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { encryptSecret, decryptSecret, parseKey } = require("../src/marketing/security/crypto");
const { createSettings } = require("../src/marketing/settings");
const { recordAudit, listAudit } = require("../src/marketing/audit");
const { ensureDefaultOrganization, syncInstructorMembers, membershipsOf, can, roleAtLeast, PERMISSIONS } = require("../src/marketing/organizations");
const { createRepository } = require("../src/marketing/db/repository");
const { startServer, loginInstructor } = require("./helpers");

const MIGRATIONS = path.join(__dirname, "..", "src", "marketing", "migrations");
const KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"; // clé de TEST (64 hex)
const quiet = { log() {}, warn() {} };

// Base LMS minimale + migrations marketing réelles
function freshDb() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, role TEXT NOT NULL DEFAULT 'etudiant')");
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  return db;
}

describe("chiffrement des secrets (AES-256-GCM)", () => {
  test("aller-retour ; deux chiffrements du même texte diffèrent ; le clair n'apparaît pas", () => {
    const a = encryptSecret("re_cle_secrete_123", KEY, "ctx");
    const b = encryptSecret("re_cle_secrete_123", KEY, "ctx");
    assert.notEqual(a, b);
    assert.doesNotMatch(a, /re_cle_secrete/);
    assert.match(a, /^v1:/);
    assert.equal(decryptSecret(a, KEY, "ctx"), "re_cle_secrete_123");
  });
  test("caractères spéciaux et texte long", () => {
    const text = "é€🙂\n" + "x".repeat(5000);
    assert.equal(decryptSecret(encryptSecret(text, KEY, "c"), KEY, "c"), text);
  });
  test("un secret modifié, une mauvaise clé ou un mauvais contexte sont refusés", () => {
    const token = encryptSecret("secret", KEY, "org1:cle");
    const parts = token.split(":");
    parts[3] = Buffer.from("altere").toString("base64");
    assert.throws(() => decryptSecret(parts.join(":"), KEY, "org1:cle"));
    assert.throws(() => decryptSecret(token, "ff".repeat(32), "org1:cle"));
    assert.throws(() => decryptSecret(token, KEY, "org2:cle"), "copier un secret vers une autre organisation doit échouer");
    assert.throws(() => decryptSecret("n-importe-quoi", KEY, "org1:cle"), /invalide|format/i);
  });
  test("formats de clé : 64 hexadécimaux ou 32 octets en base64 ; le reste est refusé avec une aide", () => {
    assert.equal(parseKey(KEY).length, 32);
    assert.equal(parseKey(Buffer.alloc(32, 7).toString("base64")).length, 32);
    for (const bad of [undefined, "", "trop-court", "zz".repeat(32), "aa".repeat(31)]) assert.throws(() => parseKey(bad), /ENCRYPTION_KEY/);
    assert.throws(() => parseKey("court"), /randomBytes|openssl|générez/i);
  });
});

describe("paramètres par organisation", () => {
  let db, settings;
  beforeEach(() => {
    db = freshDb();
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
    settings = createSettings(db, { encryptionKey: KEY });
  });
  test("lecture/écriture par organisation, valeur par défaut, suppression", () => {
    settings.set(1, "sending.rate_per_minute", "100");
    assert.equal(settings.get(1, "sending.rate_per_minute"), "100");
    assert.equal(settings.get(2, "sending.rate_per_minute"), null, "l'organisation B ne voit pas le réglage de A");
    assert.equal(settings.get(2, "sending.rate_per_minute", "60"), "60");
    settings.set(1, "sending.rate_per_minute", "200");
    assert.equal(settings.get(1, "sending.rate_per_minute"), "200");
    settings.remove(1, "sending.rate_per_minute");
    assert.equal(settings.get(1, "sending.rate_per_minute"), null);
  });
  test("un secret est stocké chiffré, relu en clair côté serveur, jamais listé en clair", () => {
    settings.set(1, "provider.api_key", "re_super_secret", { secret: true });
    const raw = db.prepare("SELECT value, is_secret FROM mk_settings WHERE key = 'provider.api_key'").get();
    assert.equal(raw.is_secret, 1);
    assert.doesNotMatch(raw.value, /re_super_secret/);
    assert.equal(settings.get(1, "provider.api_key"), "re_super_secret");
    const listed = settings.list(1).find((s) => s.key === "provider.api_key");
    assert.equal(listed.secret, true);
    assert.doesNotMatch(JSON.stringify(settings.list(1)), /re_super_secret/);
  });
  test("le secret d'une organisation ne se lit pas depuis une autre (contexte lié à l'organisation et au nom)", () => {
    settings.set(1, "provider.api_key", "secret-de-A", { secret: true });
    const stolen = db.prepare("SELECT value FROM mk_settings WHERE organization_id = 1").get().value;
    db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (2, 'provider.api_key', ?, 1)").run(stolen);
    assert.throws(() => settings.get(2, "provider.api_key"));
  });
  test("sans ENCRYPTION_KEY : on refuse d'enregistrer un secret (jamais en clair), avec un message clair", () => {
    const noKey = createSettings(db, { encryptionKey: undefined });
    assert.throws(() => noKey.set(1, "provider.api_key", "x", { secret: true }), /ENCRYPTION_KEY/);
    noKey.set(1, "sending.rate_per_minute", "50"); // un réglage non secret reste possible
    assert.equal(noKey.get(1, "sending.rate_per_minute"), "50");
  });
  test("noms et valeurs validés", () => {
    for (const bad of ["", "A majuscule", "x'; DROP TABLE mk_settings;--", "a".repeat(80)]) assert.throws(() => settings.set(1, bad, "v"), /nom de réglage/i);
    assert.throws(() => settings.set(1, "ok.key", "x".repeat(9000)), /trop long/i);
    assert.throws(() => settings.set(0, "ok.key", "v"), /organisation/i);
  });
});

describe("journal d'audit", () => {
  let db;
  beforeEach(() => {
    db = freshDb();
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
  });
  test("enregistre qui, quoi, sur quelle ressource, quand", () => {
    recordAudit(db, { organizationId: 1, userId: 7, action: "campaign.created", resourceType: "campaign", resourceId: 42, metadata: { name: "Black Friday" } });
    const [row] = listAudit(db, 1);
    assert.equal(row.user_id, 7);
    assert.equal(row.action, "campaign.created");
    assert.equal(row.resource_type, "campaign");
    assert.equal(row.resource_id, "42");
    assert.deepEqual(row.metadata, { name: "Black Friday" });
    assert.match(row.created_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
  test("action système (sans utilisateur) acceptée ; format d'action imposé", () => {
    recordAudit(db, { organizationId: 1, userId: null, action: "job.retried", resourceType: "job", resourceId: "9" });
    assert.equal(listAudit(db, 1)[0].user_id, null);
    for (const bad of ["Creation", "campagne", "a.b.c", "x; DROP", ""]) assert.throws(() => recordAudit(db, { organizationId: 1, action: bad, resourceType: "x" }), /action/i);
  });
  test("les valeurs sensibles sont masquées (à tous les niveaux) et rien de secret n'est écrit", () => {
    recordAudit(db, { organizationId: 1, userId: 1, action: "settings.updated", resourceType: "setting", metadata: { api_key: "re_123", nested: { password: "p", Authorization: "Bearer x", ok: "visible" }, list: [{ token: "t" }] } });
    const raw = db.prepare("SELECT metadata FROM mk_audit_logs").get().metadata;
    assert.doesNotMatch(raw, /re_123|"p"|Bearer x|"t"/);
    assert.match(raw, /visible/);
    assert.match(raw, /masqué/);
  });
  test("métadonnées trop volumineuses : tronquées, jamais d'échec de l'action métier", () => {
    recordAudit(db, { organizationId: 1, userId: 1, action: "contacts.imported", resourceType: "import", metadata: { rows: "x".repeat(20000) } });
    const row = listAudit(db, 1)[0];
    assert.equal(row.metadata._tronque, true);
  });
  test("le journal est en écriture seule : modification et suppression interdites", () => {
    recordAudit(db, { organizationId: 1, userId: 1, action: "segment.deleted", resourceType: "segment", resourceId: 3 });
    assert.throws(() => db.exec("UPDATE mk_audit_logs SET action = 'segment.created'"), /lecture seule/i);
    assert.throws(() => db.exec("DELETE FROM mk_audit_logs"), /lecture seule/i);
  });
  test("chaque organisation ne voit que son journal ; pagination et filtre par ressource", () => {
    for (let i = 0; i < 5; i++) recordAudit(db, { organizationId: 1, userId: 1, action: "list.created", resourceType: "list", resourceId: i });
    recordAudit(db, { organizationId: 2, userId: 2, action: "list.created", resourceType: "list", resourceId: 1 });
    assert.equal(listAudit(db, 1).length, 5);
    assert.equal(listAudit(db, 2).length, 1);
    const page1 = listAudit(db, 1, { limit: 2 });
    const page2 = listAudit(db, 1, { limit: 2, beforeId: page1[1].id });
    assert.equal(page1.length, 2);
    assert.ok(page2[0].id < page1[1].id);
    assert.equal(listAudit(db, 1, { resourceType: "list", resourceId: 3 }).length, 1);
  });
  test("une organisation qui a un journal ne peut pas être supprimée (traçabilité)", () => {
    recordAudit(db, { organizationId: 1, userId: 1, action: "list.created", resourceType: "list" });
    assert.throws(() => db.exec("DELETE FROM mk_organizations WHERE id = 1"));
  });
});

describe("organisations, rôles et permissions", () => {
  test("organisation par défaut créée une seule fois ; le formateur du LMS en devient propriétaire", () => {
    const db = freshDb();
    db.exec("INSERT INTO users (username, email, role) VALUES ('claire', 'c@x.fr', 'formateur'), ('julie', 'j@x.fr', 'etudiant')");
    const org = ensureDefaultOrganization(db, { name: "KOLAKISA" });
    assert.equal(ensureDefaultOrganization(db, { name: "KOLAKISA" }).id, org.id);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_organizations").get().n, 1);
    syncInstructorMembers(db, org.id);
    syncInstructorMembers(db, org.id); // idempotent
    assert.deepEqual(membershipsOf(db, 1).map((m) => [m.organization_id, m.role]), [[org.id, "owner"]]);
    assert.deepEqual(membershipsOf(db, 2), [], "un étudiant n'a aucun accès au marketing");
  });
  test("un rôle déjà attribué n'est jamais rétrogradé par la synchronisation", () => {
    const db = freshDb();
    db.exec("INSERT INTO users (username, email, role) VALUES ('claire', 'c@x.fr', 'formateur')");
    const org = ensureDefaultOrganization(db, { name: "K" });
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, 1, 'admin')").run(org.id);
    syncInstructorMembers(db, org.id);
    assert.equal(membershipsOf(db, 1)[0].role, "admin");
  });
  test("hiérarchie des rôles et matrice de permissions", () => {
    assert.ok(roleAtLeast("owner", "admin") && roleAtLeast("admin", "editor") && roleAtLeast("editor", "viewer"));
    assert.ok(!roleAtLeast("viewer", "editor") && !roleAtLeast("editor", "admin"));
    assert.equal(can("viewer", "contacts.read"), true);
    assert.equal(can("viewer", "contacts.write"), false);
    assert.equal(can("editor", "contacts.write"), true);
    assert.equal(can("editor", "campaigns.send"), false);
    assert.equal(can("admin", "campaigns.send"), true);
    assert.equal(can("admin", "members.manage"), false);
    assert.equal(can("owner", "members.manage"), true);
    assert.equal(can("owner", "permission.inexistante"), false, "permission inconnue = refusée");
    assert.equal(can("intrus", "contacts.read"), false, "rôle inconnu = refusé");
    assert.equal(can(undefined, "contacts.read"), false);
    for (const [permission, min] of Object.entries(PERMISSIONS)) assert.ok(["viewer", "editor", "admin", "owner"].includes(min), permission);
  });
  test("un rôle invalide est refusé par la base", () => {
    const db = freshDb();
    const org = ensureDefaultOrganization(db, { name: "K" });
    assert.throws(() => db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, 1, 'superadmin')").run(org.id));
  });
});

describe("dépôt de données : chaque requête est limitée à l'organisation", () => {
  let db, A, B;
  before(() => {
    db = freshDb();
    db.exec(`
      CREATE TABLE mk_things (id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL REFERENCES mk_organizations(id), name TEXT NOT NULL, score INTEGER, note TEXT);
      CREATE TABLE mk_no_org (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
      INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b');
    `);
    A = createRepository(db, 1).table("mk_things");
    B = createRepository(db, 2).table("mk_things");
  });
  beforeEach(() => db.exec("DELETE FROM mk_things"));

  test("insert impose l'organisation ; get/list/count ne voient que leurs lignes", () => {
    const a = A.insert({ name: "a1", score: 5 });
    const b = B.insert({ name: "b1", score: 9 });
    assert.equal(a.organization_id, 1);
    assert.equal(b.organization_id, 2);
    assert.equal(A.get(a.id).name, "a1");
    assert.equal(A.get(b.id), null, "A ne lit pas la ligne de B");
    assert.deepEqual(A.list().rows.map((r) => r.name), ["a1"]);
    assert.equal(B.count(), 1);
  });
  test("update et remove ne peuvent pas toucher une ligne d'une autre organisation", () => {
    const b = B.insert({ name: "b1", score: 1 });
    assert.equal(A.update(b.id, { name: "piraté" }), null);
    assert.equal(A.remove(b.id), false);
    assert.equal(B.get(b.id).name, "b1");
    assert.equal(B.update(b.id, { name: "ok" }).name, "ok");
    assert.equal(B.remove(b.id), true);
  });
  test("on ne peut ni fournir une autre organisation ni en changer", () => {
    assert.throws(() => A.insert({ name: "x", organization_id: 2 }), /organization_id/);
    const a = A.insert({ name: "x" });
    assert.throws(() => A.update(a.id, { organization_id: 2 }), /organization_id/);
    assert.throws(() => A.update(a.id, { id: 999 }), /\bid\b/);
    assert.throws(() => A.list({ where: { organization_id: 2 } }), /organization_id/);
  });
  test("filtres : égalité, null, liste, comparaison, texte ; tri et pagination par curseur", () => {
    for (let i = 1; i <= 7; i++) A.insert({ name: `n${i}`, score: i, note: i % 2 ? null : "pair" });
    assert.deepEqual(A.list({ where: { score: 3 } }).rows.map((r) => r.name), ["n3"]);
    assert.equal(A.list({ where: { note: null } }).rows.length, 4);
    assert.deepEqual(A.list({ where: { score: [1, 2] } }).rows.map((r) => r.name), ["n1", "n2"]);
    assert.deepEqual(A.list({ where: { score: { op: ">=", value: 6 } } }).rows.map((r) => r.name), ["n6", "n7"]);
    assert.deepEqual(A.list({ where: { name: { op: "like", value: "n1%" } } }).rows.map((r) => r.name), ["n1"]);
    assert.deepEqual(A.list({ orderBy: { column: "score", direction: "desc" }, limit: 2 }).rows.map((r) => r.score), [7, 6]);
    const p1 = A.list({ limit: 3 });
    const p2 = A.list({ limit: 3, afterId: p1.nextAfterId });
    assert.deepEqual([...p1.rows, ...p2.rows].map((r) => r.name), ["n1", "n2", "n3", "n4", "n5", "n6"]);
    assert.equal(A.list({ limit: 100 }).nextAfterId, null, "plus de page suivante");
  });
  test("la limite est plafonnée (jamais 100 000 lignes d'un coup)", () => {
    assert.throws(() => A.list({ limit: 5000 }), /limite/i);
    assert.throws(() => A.list({ limit: 0 }), /limite/i);
  });
  test("injection SQL : colonnes, opérateurs, tris et tables inconnus refusés ; les valeurs ne sont jamais interprétées", () => {
    A.insert({ name: "normal" });
    assert.throws(() => A.list({ where: { "name; DROP TABLE mk_things;--": 1 } }), /colonne/i);
    assert.throws(() => A.list({ where: { name: { op: "= 1 OR 1=1 --", value: "x" } } }), /opérateur/i);
    assert.throws(() => A.list({ orderBy: "name; DROP TABLE mk_things" }), /colonne/i);
    assert.throws(() => A.list({ orderBy: { column: "name", direction: "sideways" } }), /direction/i);
    assert.throws(() => A.insert({ "name) VALUES (1); --": "x" }), /colonne/i);
    assert.throws(() => createRepository(db, 1).table("users"), /mk_/);
    assert.throws(() => createRepository(db, 1).table("mk_things; DROP TABLE users"), /table/i);
    assert.throws(() => createRepository(db, 1).table("mk_inexistante"), /introuvable|inconnue/i);
    assert.throws(() => createRepository(db, 1).table("mk_no_org"), /organization_id/);
    assert.equal(A.list({ where: { name: "x' OR '1'='1" } }).rows.length, 0, "la valeur est traitée comme du texte");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_things").get().n, 1, "la table est intacte");
  });
  test("types de valeurs : objets refusés (à sérialiser explicitement), booléens en 0/1", () => {
    assert.throws(() => A.insert({ name: { a: 1 } }), /valeur/i);
    assert.throws(() => A.insert({ name: "x", score: Symbol("x") }), /valeur/i);
    assert.equal(A.insert({ name: "b", score: true }).score, 1);
  });
  test("organisation invalide refusée", () => {
    for (const bad of [0, -1, 1.5, "1", null, undefined, NaN]) assert.throws(() => createRepository(db, bad), /organisation/i);
  });
});

describe("intégration au serveur", () => {
  let srv;
  before(async () => {
    srv = await startServer();
    await loginInstructor(srv); // le formateur est créé au démarrage : le serveur l'a déjà synchronisé
  });
  after(() => srv.stop());
  const q = (sql, ...a) => {
    const db = srv.db();
    const r = db.prepare(sql).all(...a);
    db.close();
    return r;
  };
  test("au démarrage : migration 001 appliquée, organisation KOLAKISA créée, le formateur en est propriétaire", () => {
    assert.deepEqual(q("SELECT version, name FROM schema_migrations WHERE scope = 'marketing' ORDER BY version").map((r) => r.version).slice(0, 1), ["001"]);
    const orgs = q("SELECT id, name, slug FROM mk_organizations");
    assert.deepEqual(orgs.map((o) => [o.name, o.slug]), [["KOLAKISA", "koyekola"]]);
    const members = q("SELECT role FROM mk_org_members WHERE organization_id = ?", orgs[0].id);
    assert.deepEqual(members.map((m) => m.role), ["owner"]);
  });
  test("la migration 002 (événements et file) est appliquée ; le worker n'est pas démarré par défaut", () => {
    // toutes les migrations du dossier sont appliquées, dans l'ordre (la liste grandit à chaque jalon)
    assert.deepEqual(q("SELECT version FROM schema_migrations WHERE scope = 'marketing' ORDER BY version").map((r) => r.version), require("../src/marketing/db/migrate").listMigrations(require("../src/marketing").MIGRATIONS_DIR).map((x) => x.version));
    assert.deepEqual(q("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('mk_events', 'mk_jobs') ORDER BY name").map((r) => r.name), ["mk_events", "mk_jobs"]);
    assert.equal(q("SELECT COUNT(*) n FROM mk_jobs")[0].n, 0, "aucun travail créé sans fonctionnalité qui en demande");
  });
  test("les tables du LMS sont intactes (aucune table existante modifiée)", () => {
    const users = q("PRAGMA table_info(users)").map((c) => c.name);
    assert.deepEqual(users, ["id", "username", "email", "password_hash", "role", "bio", "created_at", "avatar_path"]);
  });
});
