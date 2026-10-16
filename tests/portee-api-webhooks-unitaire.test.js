// R2 — portée de site des clés d'API et des points d'arrivée de webhooks (A-01, A-02) : migration 072 (neutre pour l'existant, garde-fous de la base),
// services (création, liste, révocation), distribution des événements par site. Vraies migrations, base en mémoire ; aucun serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet, T0 } = require("./marketing-helpers");
const keys = require("../src/marketing/api/keys");
const endpoints = require("../src/marketing/webhooks/endpoints");
const { eventHandler, jobHandlers, sendTestEvent } = require("../src/marketing/webhooks/delivery");
const { UnrecoverableError } = require("../src/marketing/queue/worker");

const mkSite = (db, org, name, status = "active") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, ?, ?, '{}', ?)").run(org, name, name.toLowerCase(), status).lastInsertRowid);
const jobs = (db) => db.prepare("SELECT payload FROM mk_jobs WHERE type = 'webhook.deliver' ORDER BY id").all().map((r) => JSON.parse(r.payload));

describe("migration 072 : neutre pour l'existant", () => {
  test("les clés et points d'arrivée déjà en base reçoivent la portée « organization » explicite, sans perte d'accès", () => {
    // Base migrée jusqu'à 071 seulement, avec une clé et un point d'arrivée « d'avant R2 »
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-r2-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "072") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
      const hash = keys.hashOf("mk_live_" + "a".repeat(48));
      db.prepare("INSERT INTO mk_api_keys (organization_id, name, prefix, key_hash, scope) VALUES (1, 'ancienne', 'mk_live_aaaa', ?, 'write')").run(hash);
      db.prepare("INSERT INTO mk_webhook_endpoints (organization_id, name, url, secret, events) VALUES (1, 'ancien', 'https://exemple.fr/h', 'x', '[\"*\"]')").run();
      assert.equal(db.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_api_keys') WHERE name IN ('reach','site_id')").get().n, 0); // base d'avant R2
      assert.deepEqual({ ...db.prepare("SELECT organization_id org, scope FROM mk_api_keys").get() }, { org: 1, scope: "write" });
      // Application de 072 sur cette base existante
      migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
      assert.equal(db.prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1").get().version, "072");
      const key = db.prepare("SELECT reach, site_id, scope, name FROM mk_api_keys").get();
      assert.deepEqual({ ...key }, { reach: "organization", site_id: null, scope: "write", name: "ancienne" });
      const ep = db.prepare("SELECT reach, site_id, events FROM mk_webhook_endpoints").get();
      assert.deepEqual({ ...ep }, { reach: "organization", site_id: null, events: '["*"]' });
      const after = keys.authenticate(db, "mk_live_" + "a".repeat(48));
      assert.deepEqual({ org: after.organizationId, scope: after.scope, reach: after.reach, siteId: after.siteId }, { org: 1, scope: "write", reach: "organization", siteId: null });
      // Les événements de n'importe quel site, ou sans site, atteignent encore ce point d'arrivée historique
      for (const siteId of [null, 1, 99]) assert.equal(endpoints.endpointsFor(db, 1, "contact.created", siteId).length, 1);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("garde-fous de la base (en plus des contrôles du serveur)", () => {
  const m = freshMarketing();
  const A = mkSite(m.db, 1, "Alpha");
  const otherOrgSite = Number(m.db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (2, 'Autre', 'autre', '{}')").run().lastInsertRowid);
  const ins = (table, reach, site, name) => m.db.prepare(`INSERT INTO ${table} (organization_id, name, ${table === "mk_api_keys" ? "prefix, key_hash" : "url, secret"}, reach, site_id) VALUES (1, ?, 'p', ?, ?, ?)`).run(name, `h-${name}`, reach, site);
  for (const table of ["mk_api_keys", "mk_webhook_endpoints"]) {
    test(`${table} : « site » sans site, « organization » avec un site, site d'une autre organisation : refusés`, () => {
      assert.throws(() => ins(table, "site", null, "a1"), /portée incohérente/);
      assert.throws(() => ins(table, "organization", A, "a2"), /portée incohérente/);
      assert.throws(() => ins(table, "site", otherOrgSite, "a3"), /portée incohérente/);
      assert.throws(() => ins(table, "monde", null, "a4"), /CHECK|constraint/i);
    });
    test(`${table} : portée valide acceptée, puis figée (ni élargie, ni déplacée, ni changée d'organisation)`, () => {
      const id = Number(ins(table, "site", A, "ok-" + table).lastInsertRowid);
      assert.throws(() => m.db.prepare(`UPDATE ${table} SET reach = 'organization', site_id = NULL WHERE id = ?`).run(id), /portée figée/);
      assert.throws(() => m.db.prepare(`UPDATE ${table} SET site_id = ? WHERE id = ?`).run(otherOrgSite, id), /portée figée/);
      assert.throws(() => m.db.prepare(`UPDATE ${table} SET organization_id = 2 WHERE id = ?`).run(id), /portée figée/);
      assert.doesNotThrow(() => m.db.prepare(`UPDATE ${table} SET name = ? WHERE id = ?`).run("renommé-" + table, id));
    });
  }
});

describe("clés d'API : services", () => {
  const m = freshMarketing();
  const A = mkSite(m.db, 1, "Alpha"), B = mkSite(m.db, 1, "Beta");
  const otherOrgSite = Number(m.db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (2, 'Autre', 'autre', '{}')").run().lastInsertRowid);

  test("sans site demandé : clé d'organisation, portée explicite ; avec un site : clé limitée à ce site", () => {
    const org = keys.createApiKey(m.A, { name: "org", scope: "read" });
    const siteKey = keys.createApiKey(m.A, { name: "alpha", scope: "write", siteId: A });
    assert.deepEqual([org.reach, org.siteId, siteKey.reach, siteKey.siteId], ["organization", null, "site", A]);
    const auth = keys.authenticate(m.db, siteKey.key);
    assert.deepEqual([auth.reach, auth.siteId, auth.scope], ["site", A, "write"]);
    const listed = keys.listApiKeys(m.A).map((k) => [k.name, k.reach, k.site_id, k.site_name]);
    assert.ok(listed.some((r) => r.join() === ["alpha", "site", A, "Alpha"].join()));
  });
  test("site inexistant ou d'une autre organisation : création refusée, aucune ligne créée", () => {
    const n = () => m.db.prepare("SELECT COUNT(*) n FROM mk_api_keys").get().n;
    const before = n();
    assert.throws(() => keys.createApiKey(m.A, { name: "x1", siteId: 9999 }), /Site introuvable/);
    assert.throws(() => keys.createApiKey(m.A, { name: "x2", siteId: otherOrgSite }), /Site introuvable/);
    assert.equal(n(), before);
  });
  test("un utilisateur à accès limité au site A ne crée que des clés de A, ne voit et ne révoque que celles de A", () => {
    const limited = m.ctx(1, { siteScope: A });
    const mine = keys.createApiKey(limited, { name: "limitee", scope: "read" }); // aucun site demandé : la portée du serveur s'impose, jamais l'organisation
    assert.deepEqual([mine.reach, mine.siteId], ["site", A]);
    assert.throws(() => keys.createApiKey(limited, { name: "vers-beta", siteId: B }), /Site introuvable/);
    const beta = keys.createApiKey(m.A, { name: "beta", siteId: B });
    const names = keys.listApiKeys(limited).map((k) => k.name);
    assert.ok(names.includes("limitee") && names.includes("alpha") && !names.includes("beta") && !names.includes("org"));
    assert.throws(() => keys.revokeApiKey(limited, beta.id), /introuvable/);
    assert.equal(m.db.prepare("SELECT revoked_at FROM mk_api_keys WHERE id = ?").get(beta.id).revoked_at, null);
    assert.doesNotThrow(() => keys.revokeApiKey(limited, mine.id));
  });
  test("site archivé, supprimé (corbeille) : sa clé est refusée ; réactivé : acceptée de nouveau ; clé révoquée : refusée", () => {
    const C = mkSite(m.db, 1, "Gamma");
    const k = keys.createApiKey(m.A, { name: "gamma", siteId: C });
    assert.ok(keys.authenticate(m.db, k.key));
    m.db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
    assert.equal(keys.authenticate(m.db, k.key), null);
    m.db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(C);
    assert.ok(keys.authenticate(m.db, k.key));
    m.db.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = ?").run(C);
    assert.equal(keys.authenticate(m.db, k.key), null);
    m.db.prepare("UPDATE mk_sites SET deleted_at = NULL WHERE id = ?").run(C);
    keys.revokeApiKey(m.A, k.id);
    assert.equal(keys.authenticate(m.db, k.key), null);
  });
  test("création et révocation journalisées avec la portée", () => {
    const rows = m.db.prepare("SELECT action, metadata FROM mk_audit_logs WHERE action IN ('api_key.created','api_key.revoked') ORDER BY id").all();
    assert.ok(rows.some((r) => r.action === "api_key.created" && JSON.parse(r.metadata).reach === "site"));
    assert.ok(rows.some((r) => r.action === "api_key.revoked" && "reach" in JSON.parse(r.metadata)));
  });
});

describe("webhooks : services et distribution par site", () => {
  const m = freshMarketing();
  const A = mkSite(m.db, 1, "Alpha"), B = mkSite(m.db, 1, "Beta");
  const mk = (ctx, name, extra = {}) => endpoints.createEndpoint(ctx, { name, url: `https://exemple.fr/${name}`, events: ["*"], encryptionKey: TEST_KEY, ...extra });
  const orgEp = mk(m.A, "organisation"), aEp = mk(m.A, "alpha", { siteId: A }), bEp = mk(m.A, "beta", { siteId: B });

  test("portée explicite à la création ; site invalide refusé", () => {
    assert.deepEqual([orgEp.reach, orgEp.siteId, aEp.reach, aEp.siteId], ["organization", null, "site", A]);
    assert.throws(() => mk(m.A, "x", { siteId: 9999 }), /Site introuvable/);
    const listed = endpoints.listEndpoints(m.A).map((e) => [e.name, e.reach, e.siteName]);
    assert.ok(listed.some((r) => r.join() === ["alpha", "site", "Alpha"].join()));
  });
  test("distribution : l'organisation reçoit tout, un point de site ne reçoit que SON site (jamais un autre site, ni un événement sans site)", () => {
    const names = (siteId) => endpoints.endpointsFor(m.db, 1, "contact.created", siteId).map((e) => e.name).sort();
    assert.deepEqual(names(A), ["alpha", "organisation"]);
    assert.deepEqual(names(B), ["beta", "organisation"]);
    assert.deepEqual(names(null), ["organisation"]);
    assert.deepEqual(names(12345), ["organisation"]);
  });
  test("bout en bout : émission d'un événement de site → la file ne contient des livraisons que pour les points concernés", async () => {
    m.bus.on("*", eventHandler({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY } }));
    const out = (name, siteId, extra = {}) => m.bus.emit({ organizationId: 1, name, email: "c@ex.fr", siteId, idempotencyKey: `${name}:${siteId}`, ...extra });
    const ea = out("contact.created", A); const eb = out("contact.created", B); const en = out("contact.created", null, { idempotencyKey: "sans-site" });
    for (const e of [ea, eb, en]) await m.bus.dispatch(e.id);
    const byEvent = {};
    for (const p of jobs(m.db)) (byEvent[p.eventId] ||= []).push(p.endpointId);
    assert.deepEqual([...byEvent[ea.id]].sort(), [orgEp.id, aEp.id].sort());
    assert.deepEqual([...byEvent[eb.id]].sort(), [orgEp.id, bEp.id].sort());
    assert.deepEqual(byEvent[en.id], [orgEp.id]);
    assert.ok(jobs(m.db).filter((p) => p.endpointId === aEp.id).every((p) => p.siteId === A));
  });
  test("livraison : un travail mal acheminé vers un point de site (événement d'un autre site) est abandonné sans envoi", async () => {
    const h = jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, lookup: async () => [{ address: "93.184.216.34" }], fetchImpl: async () => { throw new Error("aucun envoi attendu"); } });
    const base = { eventName: "contact.created", eventId: 1, occurredAt: new Date(T0).toISOString(), metadata: {} };
    await assert.rejects(() => h["webhook.deliver"]({ ...base, endpointId: aEp.id, siteId: B }), UnrecoverableError);
    await assert.rejects(() => h["webhook.deliver"]({ ...base, endpointId: aEp.id, siteId: null }), UnrecoverableError);
    let sent = 0;
    const ok = jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, lookup: async () => [{ address: "93.184.216.34" }], fetchImpl: async () => { sent += 1; return { status: 200 }; } });
    await ok["webhook.deliver"]({ ...base, endpointId: aEp.id, siteId: A });
    await ok["webhook.deliver"]({ ...base, endpointId: orgEp.id, siteId: B }); // point d'organisation : comportement historique
    assert.equal(sent, 2);
  });
  test("l'événement de test d'un point de site est livrable à ce point (portée de son site), jamais refusé", async () => {
    sendTestEvent(m.A, aEp.id);
    const p = jobs(m.db).filter((x) => x.eventName === "test.ping" && x.endpointId === aEp.id).pop();
    assert.equal(p.siteId, A);
    let sent = 0;
    const h = jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, lookup: async () => [{ address: "93.184.216.34" }], fetchImpl: async () => { sent += 1; return { status: 200 }; } });
    await h["webhook.deliver"](p);
    assert.equal(sent, 1);
  });
  test("accès limité au site A : crée, voit, révèle, active, supprime et teste les seuls points de A ; ceux de B et de l'organisation sont introuvables", () => {
    const limited = m.ctx(1, { siteScope: A });
    const mine = mk(limited, "limite"); // aucun site demandé : la portée du serveur s'impose
    assert.deepEqual([mine.reach, mine.siteId], ["site", A]);
    assert.throws(() => mk(limited, "vers-beta", { siteId: B }), /Site introuvable/);
    assert.deepEqual(endpoints.listEndpoints(limited).map((e) => e.name).sort(), ["alpha", "limite"]);
    for (const other of [bEp.id, orgEp.id]) {
      assert.throws(() => endpoints.getEndpoint(limited, other), /introuvable/);
      assert.throws(() => endpoints.revealSecret(limited, other, { encryptionKey: TEST_KEY }), /introuvable/);
      assert.throws(() => endpoints.setEnabled(limited, other, false), /introuvable/);
      assert.throws(() => endpoints.deleteEndpoint(limited, other), /introuvable/);
      assert.throws(() => sendTestEvent(limited, other), /introuvable/);
    }
    assert.equal(endpoints.revealSecret(limited, aEp.id, { encryptionKey: TEST_KEY }).startsWith("whsec_"), true);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_webhook_endpoints WHERE id IN (?, ?)").get(bEp.id, orgEp.id).n, 2);
  });
  test("création journalisée avec la portée", () => {
    const rows = m.db.prepare("SELECT metadata FROM mk_audit_logs WHERE action = 'webhook.created'").all().map((r) => JSON.parse(r.metadata));
    assert.ok(rows.some((r) => r.reach === "site" && r.site_id === A) && rows.some((r) => r.reach === "organization"));
  });
});
