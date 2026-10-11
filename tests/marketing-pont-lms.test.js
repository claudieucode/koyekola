// Marketing M1e — pont avec le LMS : comptes existants → contacts « unknown », case facultative à l'inscription.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { freshMarketing, quiet } = require("./marketing-helpers");
const { startServer, Client } = require("./helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const bridge = require("../src/marketing/bridge/lms");
const { initMarketing } = require("../src/marketing");

let m, A;
const addUser = (username, email, role = "etudiant") => Number(m.db.prepare("INSERT INTO users (username, email, role) VALUES (?, ?, ?)").run(username, email, role).lastInsertRowid);
const count = (t, where = "1=1") => m.db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${where}`).get().n;

beforeEach(() => { m = freshMarketing(); A = m.A; });

describe("synchronisation des comptes existants", () => {
  test("chaque compte devient un contact « unknown » lié au compte, SANS consentement ni événement", () => {
    const id = addUser("Awa", "Awa@Exemple.fr");
    addUser("Prof", "prof@exemple.fr", "formateur");
    const r = bridge.syncLmsUsers(A);
    assert.deepEqual([r.created, r.linked, r.skipped], [2, 0, 0]);
    const c = audience.findByEmail(A, "awa@exemple.fr");
    assert.deepEqual([c.status, c.source, c.lms_user_id, c.first_name], ["unknown", "lms", id, "Awa"]);
    assert.equal(count("mk_consents"), 0);
    assert.equal(count("mk_events"), 0);
    assert.equal(compliance.isSendable(A, c.id).ok, false);
  });
  test("idempotente : relancer ne crée rien de plus", () => {
    addUser("Awa", "awa@exemple.fr");
    bridge.syncLmsUsers(A);
    assert.deepEqual(bridge.syncLmsUsers(A), { created: 0, linked: 0, skipped: 0 });
    assert.equal(count("mk_contacts"), 1);
  });
  test("un contact déjà présent (même e-mail) est RELIÉ au compte sans changer son statut", () => {
    const { contact } = audience.upsertContact(A, { email: "awa@exemple.fr" });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "J'accepte la newsletter" });
    const id = addUser("Awa", "awa@exemple.fr");
    assert.deepEqual(bridge.syncLmsUsers(A), { created: 0, linked: 1, skipped: 0 });
    const c = audience.getContact(A, contact.id);
    assert.deepEqual([c.lms_user_id, c.status], [id, "subscribed"]);
  });
  test("une adresse en liste de suppression reste bloquée ; une adresse invalide est ignorée", () => {
    compliance.addSuppression(A, { email: "bloque@exemple.fr", reason: "manual" });
    addUser("Bob", "bloque@exemple.fr");
    addUser("Cass", "pas-un-email");
    const r = bridge.syncLmsUsers(A);
    assert.deepEqual([r.created, r.skipped], [1, 1]);
    assert.equal(audience.findByEmail(A, "bloque@exemple.fr").status, "suppressed");
  });
  test("borné par « limit » (les gros sites se synchronisent par paquets)", () => {
    for (let i = 0; i < 7; i++) addUser(`u${i}`, `u${i}@exemple.fr`);
    assert.equal(bridge.syncLmsUsers(A, { limit: 3 }).created, 3);
    assert.equal(bridge.syncLmsUsers(A, { limit: 100 }).created, 4);
  });
  test("une seule entrée d'audit pour toute la synchronisation, sans adresse", () => {
    addUser("Awa", "awa@exemple.fr");
    bridge.syncLmsUsers(A);
    const rows = m.db.prepare("SELECT action, metadata FROM mk_audit_logs").all();
    assert.deepEqual(rows.map((r) => r.action), ["lms.synced"]);
    assert.ok(!/@/.test(rows[0].metadata));
  });
  test("isolation : les comptes sont synchronisés dans l'organisation demandée seulement", () => {
    addUser("Awa", "awa@exemple.fr");
    bridge.syncLmsUsers(A);
    assert.equal(audience.listContacts(m.B, {}).rows.length, 0);
  });
  test("au démarrage du module, les comptes existants sont synchronisés", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
    db.prepare("INSERT INTO users (username, email) VALUES ('Awa', 'awa@exemple.fr')").run();
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mk-pont-"));
    const mk = initMarketing({ db, dbFile: ":memory:", dataDir, log: quiet });
    assert.equal(mk.ready, true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE status = 'unknown' AND source = 'lms'").get().n, 1);
    // relancer le module (redémarrage du serveur) ne crée pas de doublon
    initMarketing({ db, dbFile: ":memory:", dataDir, log: quiet });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 1);
  });
});

describe("inscription", () => {
  test("case décochée : contact « unknown », aucun consentement", () => {
    const id = addUser("Awa", "awa@exemple.fr");
    const r = bridge.registerLmsUser(A, { id, username: "Awa", email: "awa@exemple.fr" }, { optIn: false });
    assert.equal(r.subscribed, false);
    const c = audience.findByEmail(A, "awa@exemple.fr");
    assert.deepEqual([c.status, c.source, c.lms_user_id], ["unknown", "signup", id]);
    assert.equal(count("mk_consents"), 0);
  });
  test("case cochée : abonné avec une preuve (texte exact affiché, IP tronquée) et événements émis", () => {
    const id = addUser("Awa", "awa@exemple.fr");
    const r = bridge.registerLmsUser(A, { id, username: "Awa", email: "awa@exemple.fr" }, { optIn: true, ip: "203.0.113.57" });
    assert.equal(r.subscribed, true);
    const c = audience.findByEmail(A, "awa@exemple.fr");
    assert.equal(c.status, "subscribed");
    const [proof] = compliance.consentHistory(A, c.id);
    assert.deepEqual([proof.source, proof.text_shown, proof.ip], ["signup", bridge.SIGNUP_CONSENT_TEXT, "203.0.113.0"]);
    assert.deepEqual(m.db.prepare("SELECT name FROM mk_events ORDER BY id").all().map((e) => e.name), ["contact.created", "user.registered", "contact.subscribed"]); // Contact Core : l'inscription est journalisée
    assert.equal(compliance.isSendable(A, c.id).ok, true);
  });
  test("un ancien désinscrit qui coche la case lui-même se réabonne (c'est bien la personne) ; un supprimé, jamais", () => {
    const { contact } = audience.upsertContact(A, { email: "awa@exemple.fr" });
    compliance.unsubscribe(A, contact.id, { source: "link" });
    const id = addUser("Awa", "awa@exemple.fr");
    assert.equal(bridge.registerLmsUser(A, { id, username: "Awa", email: "awa@exemple.fr" }, { optIn: true }).subscribed, true);
    const { contact: b } = audience.upsertContact(A, { email: "bob@exemple.fr" });
    compliance.addSuppression(A, { email: "bob@exemple.fr", reason: "complained" });
    const idB = addUser("Bob", "bob@exemple.fr");
    assert.equal(bridge.registerLmsUser(A, { id: idB, username: "Bob", email: "bob@exemple.fr" }, { optIn: true }).subscribed, false);
    assert.equal(audience.getContact(A, b.id).status, "complained");
  });
  test("le texte de consentement est explicite et sans case pré-cochée implicite", () => {
    assert.match(bridge.SIGNUP_CONSENT_TEXT, /recevoir/i);
    assert.match(bridge.SIGNUP_CONSENT_TEXT, /désinscrire/i);
    assert.ok(bridge.SIGNUP_CONSENT_TEXT.length >= 40);
  });
  test("registerLmsUserSafely : une panne du marketing ne remonte jamais (l'inscription ne doit pas échouer)", () => {
    const logs = [];
    const broken = { ready: true, organizationId: 1, bus: null };
    const fakeDb = { exec() { throw new Error("base cassée"); }, prepare() { throw new Error("base cassée"); } };
    const r = bridge.registerLmsUserSafely(broken, fakeDb, { id: 1, username: "A", email: "a@b.fr" }, { optIn: true }, { error: (...a) => logs.push(a.join(" ")) });
    assert.equal(r.ok, false);
    assert.match(logs.join(""), /base cassée/);
    assert.deepEqual(bridge.registerLmsUserSafely({ ready: false }, fakeDb, { id: 1, username: "A", email: "a@b.fr" }, { optIn: true }, quiet), { ok: false, skipped: true });
    assert.deepEqual(bridge.registerLmsUserSafely(undefined, fakeDb, { id: 1, username: "A", email: "a@b.fr" }, {}, quiet), { ok: false, skipped: true });
  });
});

describe("parcours réel via le serveur", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };

  test("la page d'inscription propose une case facultative, JAMAIS pré-cochée, avec le texte de preuve", async () => {
    const html = (await new Client(srv.base).get("/inscription")).text;
    const box = html.match(/<input[^>]*name="marketing_optin"[^>]*>/)?.[0];
    assert.ok(box, "case présente");
    assert.match(box, /type="checkbox"/);
    assert.doesNotMatch(box, /checked|required/);
    assert.ok(html.replace(/&#39;/g, "'").includes(bridge.SIGNUP_CONSENT_TEXT.replace(/&/g, "&amp;")), "texte exact affiché");
  });
  test("inscription sans case cochée : compte créé, contact « unknown », aucune preuve", async () => {
    const c = new Client(srv.base);
    const r = await c.post("/inscription", { username: "sansoptin", email: "sansoptin@test.local", password: "MotDePasseEleve123" });
    assert.equal(r.status, 302);
    const [contact] = q("SELECT id, status, source, lms_user_id FROM mk_contacts WHERE email = 'sansoptin@test.local'");
    assert.deepEqual([contact.status, contact.source], ["unknown", "signup"]);
    assert.equal(contact.lms_user_id, q("SELECT id FROM users WHERE email = 'sansoptin@test.local'")[0].id);
    assert.equal(q("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", contact.id)[0].n, 0);
  });
  test("inscription avec la case cochée : abonné avec une preuve complète", async () => {
    const c = new Client(srv.base);
    const r = await c.post("/inscription", { username: "avecoptin", email: "avecoptin@test.local", password: "MotDePasseEleve123", marketing_optin: "on" });
    assert.equal(r.status, 302);
    const [contact] = q("SELECT id, status FROM mk_contacts WHERE email = 'avecoptin@test.local'");
    assert.equal(contact.status, "subscribed");
    const [proof] = q("SELECT source, action, text_shown FROM mk_consents WHERE contact_id = ?", contact.id);
    assert.deepEqual([proof.source, proof.action, proof.text_shown], ["signup", "granted", bridge.SIGNUP_CONSENT_TEXT]);
  });
  test("une valeur quelconque autre que « on » ne vaut PAS consentement", async () => {
    const c = new Client(srv.base);
    await c.post("/inscription", { username: "faux", email: "faux@test.local", password: "MotDePasseEleve123", marketing_optin: "1" });
    assert.equal(q("SELECT status FROM mk_contacts WHERE email = 'faux@test.local'")[0].status, "unknown");
  });
  test("le formateur créé au démarrage est déjà un contact « unknown » (aucun e-mail possible)", () => {
    const [c] = q("SELECT status, source FROM mk_contacts WHERE email = 'prof@test.local'");
    assert.deepEqual([c.status, c.source], ["unknown", "lms"]);
  });
  test("l'inscription refusée (mot de passe trop court) ne crée aucun contact", async () => {
    const c = new Client(srv.base);
    const r = await c.post("/inscription", { username: "court", email: "court@test.local", password: "abc", marketing_optin: "on" });
    assert.equal(r.status, 400);
    assert.equal(q("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'court@test.local'")[0].n, 0);
  });
});
