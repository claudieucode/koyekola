// R7 (lot 4) — Journal d'audit central avec site facultatif (option C, 16/10/2026) : migration additive, attribution du site côté serveur, lecture filtrée.
// Bases synthétiques et serveur réel jetables ; réponses HTTP et lignes réellement retournées vérifiées.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const { recordAudit, listAudit, scopeSql } = require("../src/marketing/audit");

const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const withUsers = (db) => db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");

describe("migration 082 : additive, journal toujours en écriture seule", () => {
  test("les lignes existantes sont conservées sans site (aucune réattribution) ; rejouée : rien ; écriture seule inchangée ; compatibilité des anciens appels", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig82-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "082") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); withUsers(db);
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}')");
      db.exec("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata) VALUES (1, 7, 'page.published', 'landing', '1', '{\"a\":1}'), (1, NULL, 'auth.login_failed', 'auth', NULL, '{}')");
      const before = rows(db, "SELECT id, organization_id, user_id, action, resource_type, resource_id, metadata, created_at FROM mk_audit_logs ORDER BY id");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "082"), ["082"]);
      assert.deepEqual(rows(db, "SELECT id, organization_id, user_id, action, resource_type, resource_id, metadata, created_at FROM mk_audit_logs ORDER BY id"), before, "lignes inchangées");
      assert.deepEqual(rows(db, "SELECT site_id FROM mk_audit_logs").map((r) => r.site_id), [null, null], "aucune réattribution");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      assert.throws(() => db.prepare("UPDATE mk_audit_logs SET site_id = 1").run(), /lecture seule/);
      assert.throws(() => db.prepare("DELETE FROM mk_audit_logs").run(), /lecture seule/);
      // ancien appel (sans site) : accepté, ligne sans site
      recordAudit(db, { organizationId: 1, userId: 7, action: "campaign.created", resourceType: "campaign", resourceId: 5, metadata: {} });
      assert.equal(rows(db, "SELECT site_id FROM mk_audit_logs ORDER BY id DESC LIMIT 1")[0].site_id, null);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("écriture : le site vient du serveur (ressource relue en base, site imposé, appelant interne), jamais d'un site arbitraire", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    m.db.exec("INSERT INTO mk_landing_pages (organization_id, name, slug, title, site_id) VALUES (1, 'P1', 'p1', 't', 1), (1, 'PM', 'pm', 't', NULL)");
    m.db.exec("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'c@x.fr', 2)");
    return m;
  };
  const last = (db) => rows(db, "SELECT * FROM mk_audit_logs ORDER BY id DESC LIMIT 1")[0];
  const { audit } = require("../src/marketing/audience/shared");

  test("site de la ressource relu en base (page, contact, site) ; ressource du site principal = sans site ; ressource inconnue = sans site", () => {
    const { db } = world();
    recordAudit(db, { organizationId: 1, userId: 7, action: "page.published", resourceType: "landing", resourceId: 1 }); assert.equal(last(db).site_id, 1);
    recordAudit(db, { organizationId: 1, userId: 7, action: "page.published", resourceType: "landing", resourceId: 2 }); assert.equal(last(db).site_id, null);
    recordAudit(db, { organizationId: 1, userId: 7, action: "contact.updated", resourceType: "contact", resourceId: 1 }); assert.equal(last(db).site_id, 2);
    recordAudit(db, { organizationId: 1, userId: 7, action: "site.updated", resourceType: "site", resourceId: 2 }); assert.equal(last(db).site_id, 2);
    recordAudit(db, { organizationId: 1, userId: 7, action: "page.published", resourceType: "landing", resourceId: 999 }); assert.equal(last(db).site_id, null);
    recordAudit(db, { organizationId: 1, userId: 7, action: "settings.updated", resourceType: "settings" }); assert.equal(last(db).site_id, null);
  });
  test("site imposé à un accès limité (ctx.siteScope) pour une ressource non relisible ; l'équipe (sans siteScope, même avec un filtre d'affichage) n'en reçoit pas", () => {
    const { db, A } = world();
    audit({ ...A, siteScope: 1 }, "settings.updated", "settings", null, {}); assert.equal(last(db).site_id, 1);
    audit({ ...A, siteFilter: 2 }, "settings.updated", "settings", null, {}); assert.equal(last(db).site_id, null, "un filtre d'affichage n'est pas un site d'événement");
    audit({ ...A, siteScope: 1 }, "contact.updated", "contact", 1, {}); assert.equal(last(db).site_id, 2, "la ressource relue en base l'emporte sur le site imposé");
  });
  test("tentative hors portée d'une clé d'API de site : la ligne de sécurité porte le site de la clé (donc invisible des autres sites)", () => {
    const { db } = world();
    require("../src/marketing/api/scope").auditDenied(db, { organizationId: 1, keyId: 4, siteId: 2 }, "POST /contacts", "contact d'un autre site");
    const r = last(db); assert.equal(r.action, "api_key.out_of_scope"); assert.equal(r.site_id, 2);
    assert.equal(listAudit(db, 1, { scope: { siteScope: 1 } }).some((x) => x.action === "api_key.out_of_scope"), false);
    assert.equal(listAudit(db, 1, { scope: { siteScope: 2 } }).some((x) => x.action === "api_key.out_of_scope"), true);
  });
  test("site falsifié : un site inconnu, supprimé de l'organisation, d'une autre organisation ou non entier n'est jamais enregistré", () => {
    const { db } = world();
    for (const forged of [999, 3, "1", "1; DROP TABLE x", -1, 1.5, null, {}]) {
      recordAudit(db, { organizationId: 1, userId: 7, action: "settings.updated", resourceType: "settings", siteId: forged, fallbackSiteId: forged });
      assert.equal(last(db).site_id, null, JSON.stringify(forged));
    }
    recordAudit(db, { organizationId: 1, userId: 7, action: "api_key.out_of_scope", resourceType: "api_key", resourceId: 4, siteId: 2 }); assert.equal(last(db).site_id, 2, "appelant interne : site valide conservé");
  });
});

describe("lecture : politique stricte par site (service)", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const put = (action, siteId) => m.db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata, site_id) VALUES (1, 7, ?, 'x', '1', '{}', ?)").run(action, siteId);
    put("a.org", null); put("a.site1", 1); put("a.site2", 2); put("api_key.out_of_scope", 2); put("auth.login_failed", null); put("a.site1b", 1);
    return m;
  };
  const actions = (rows_) => rows_.map((r) => r.action).sort();
  test("équipe : tout ; filtre d'affichage (site, principal) ; accès limité : SEULEMENT son site ; jamais l'organisation, l'historique, ni les événements de sécurité des autres sites", () => {
    const { db } = world();
    assert.equal(listAudit(db, 1, { limit: 50 }).length, 6);
    assert.deepEqual(actions(listAudit(db, 1, { scope: { siteFilter: 2 } })), ["a.site2", "api_key.out_of_scope"]);
    assert.deepEqual(actions(listAudit(db, 1, { scope: { siteFilter: "principal" } })), ["a.org", "auth.login_failed"]);
    assert.deepEqual(actions(listAudit(db, 1, { scope: { siteScope: 1 } })), ["a.site1", "a.site1b"]);
    assert.deepEqual(actions(listAudit(db, 1, { scope: { siteScope: 2 } })), ["a.site2", "api_key.out_of_scope"]);
    for (const bad of [-1, 0, 99, "1", NaN]) assert.deepEqual(listAudit(db, 1, { scope: { siteScope: bad } }), [], `siteScope ${bad}`);
    // un filtre d'affichage ne peut pas ÉLARGIR un accès limité
    assert.deepEqual(actions(listAudit(db, 1, { scope: { siteScope: 1, siteFilter: 2 } })), ["a.site1", "a.site1b"]);
  });
  test("pagination, filtres de ressource et recherche ne contournent pas la politique ; aucune fuite par le total", () => {
    const { db } = world();
    const ids = listAudit(db, 1, { scope: { siteScope: 1 } }).map((r) => r.id);
    assert.equal(ids.length, 2);
    assert.deepEqual(listAudit(db, 1, { scope: { siteScope: 1 }, beforeId: ids[0] }).map((r) => r.id), [ids[1]]);
    assert.deepEqual(listAudit(db, 1, { scope: { siteScope: 1 }, resourceType: "x", resourceId: 1 }).length, 2);
    assert.deepEqual(listAudit(db, 1, { scope: { siteScope: 1 }, beforeId: 1 }), []);
    assert.deepEqual(listAudit(db, 1, { scope: { siteScope: 1 }, limit: 1 }).length, 1);
    const s = scopeSql({ siteScope: 1 }, "l"); assert.equal(s.sql, "l.site_id = ?"); assert.deepEqual(s.params, [1]);
  });
});

describe("lecture de bout en bout (serveur réel) : écran « Journal d'activité » et tableau de bord", () => {
  const { startServer, loginInstructor, newStudent } = require("./helpers");
  let srv, db, boss, A, B, adminA, editorA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const put = (action, siteId, resourceType = "x") => db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata, site_id) VALUES (1, NULL, ?, ?, '1', '{}', ?)").run(action, resourceType, siteId);
  const LOGS = "/marketing/site-web/outils/logs";
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
    B = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location.match(/sites\/(\d+)/)[1]);
    adminA = await newStudent(srv); editorA = await newStudent(srv); adminB = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, idOf(editorA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(B, idOf(adminB));
    put("zz_alpha.event", A); put("zz_alpha.security", A, "api_key"); put("zz_bravo.event", B); put("zz_bravo.refus_acces", B, "api_key");
    put("zz_org.event", null); put("zz_historique.event", null);
  });
  after(() => { db.close(); return srv.stop(); });
  const seen = (html) => ["zz_alpha.event", "zz_alpha.security", "zz_bravo.event", "zz_bravo.refus_acces", "zz_org.event", "zz_historique.event"].filter((a) => html.includes(a));

  test("équipe de l'organisation : tout le journal", async () => {
    const r = await boss.get(LOGS);
    assert.equal(r.status, 200); assert.deepEqual(seen(r.text).length, 6);
  });
  test("administrateur du site A (accès limité, permission audit.read) : seulement les lignes du site A — ni le site B, ni ses refus d'accès, ni l'organisation, ni l'historique", async () => {
    const r = await adminA.get(`${LOGS}?site=${A}`);
    assert.equal(r.status, 200);
    assert.deepEqual(seen(r.text), ["zz_alpha.event", "zz_alpha.security"]);
  });
  test("éditeur du site A (sans audit.read) : écran refusé ; l'administrateur du site B ne lit pas le site A (403)", async () => {
    const e = await editorA.get(`${LOGS}?site=${A}`); assert.equal(e.status, 403); assert.deepEqual(seen(e.text), []);
    const b = await adminB.get(`${LOGS}?site=${A}`); assert.equal(b.status, 403); assert.deepEqual(seen(b.text), []);
  });
  test("administrateur du site B demandant le site A, éditeur du site A, paramètres forgés : jamais de ligne d'un autre site", async () => {
    for (const [client, q] of [[adminB, `site=${A}`], [adminB, `site=${B}`], [editorA, `site=${A}`], [adminA, `site=${A}&siteFilter=${B}&site_id=${B}&beforeId=0&limit=500`], [adminA, `site=${A}&site=${B}`]]) {
      const r = await client.get(`${LOGS}?${q}`);
      assert.doesNotMatch(r.text, /zz_org|zz_historique/, q);
      if (client === adminB) assert.doesNotMatch(r.text, /zz_alpha/, `adminB ${q}`);
      if (client === adminA || client === editorA) assert.doesNotMatch(r.text, /zz_bravo/, `site A ${q}`);
    }
  });
  test("écritures réelles : un formulaire créé par l'équipe pour B, par l'administrateur de A, une page du site B — chaque ligne de journal porte le bon site ; un site forgé dans la requête est ignoré", async () => {
    const last = (action) => one("SELECT site_id s, user_id u FROM mk_audit_logs WHERE action = ? ORDER BY id DESC LIMIT 1", action);
    await boss.post("/marketing/formulaires", { name: "Form Journal B", consentText: "J'accepte ceci.", site: B });
    assert.equal(last("form.created").s, B);
    await adminA.post(`/marketing/formulaires?site=${A}`, { name: "Form Journal A", consentText: "J'accepte ceci.", site: A });
    assert.equal(last("form.created").s, A);
    await adminA.post(`/marketing/formulaires?site=${A}`, { name: "Form Journal Triche", consentText: "J'accepte ceci.", site: B, site_id: B, siteId: B });
    assert.equal(last("form.created").s, A, "le site de l'événement est celui du formulaire créé (donc du serveur), pas celui de la requête");
    await boss.post("/marketing/pages", { name: "Page Journal B", site_id: B, kind: "page" });
    assert.equal(last("landing.created").s, B);
    await boss.post("/marketing/formulaires", { name: "Form Journal Principal", consentText: "J'accepte ceci." });
    assert.equal(last("form.created").s, null, "formulaire du site principal : sans site");
  });
  test("tableau de bord (activité récente) : un accès limité n'y voit que son site", async () => {
    for (const [client, other] of [[adminA, /zz_bravo|zz_org|zz_historique/], [adminB, /zz_alpha|zz_org|zz_historique/]]) {
      const site = client === adminA ? A : B;
      for (const p of [`/marketing/site-web?site=${site}`, `/marketing/site-web/sites/${site}`, `/marketing?site=${site}`]) {
        const r = await client.get(p);
        assert.doesNotMatch(r.text, other, p);
      }
    }
  });
});
