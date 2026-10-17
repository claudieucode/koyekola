// R7 (lot 6.0) — Socle d'activation des modules par site, garde des écrans des moteurs secondaires, horloge du test SMS. Bases synthétiques et serveur réel jetables.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after, mock } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));

describe("migration 084 : table additive, sans aucune ligne, aucune donnée de moteur touchée", () => {
  test("créée vide ; rejouée : rien ; organisation cohérente ; champs non modifiables ; nom de module borné", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig84-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "084") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (2, 'Autre', 'autre', '{}')");
      db.exec("INSERT INTO mk_sms_campaigns (organization_id, name, body) VALUES (1, 'Campagne existante', 'texte')");
      const before = rows(db, "SELECT * FROM mk_sms_campaigns");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "084"), ["084"]);
      assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_site_modules").get().n, 0, "aucune ligne : aucun site n'est activé d'office, aucun ne perd quoi que ce soit");
      const stripSite = (r) => r.map(({ site_id, ...rest }) => rest); // la 085 (R7-6.1) ajoute mk_sms_campaigns.site_id : on compare les données existantes
      assert.deepEqual(stripSite(rows(db, "SELECT * FROM mk_sms_campaigns")), stripSite(before));
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      const ins = (site = 1, org = 1, mod = "sms") => db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, ?, ?, 1)").run(site, org, mod);
      ins(); assert.throws(() => ins(), /UNIQUE|PRIMARY/);
      assert.throws(() => ins(2, 1), /même organisation/);
      for (const bad of ["SMS", "x", "a b", "sms;drop", "a".repeat(31)]) assert.throws(() => ins(1, 1, bad), /CHECK|constraint/i, bad);
      assert.throws(() => db.prepare("UPDATE mk_site_modules SET module = 'ai'").run(), /non modifiable/);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : désactivé par défaut, équipe seulement, données conservées (base synthétique)", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    return { ...m, S1: { ...m.A, siteScope: 1 }, S2: { ...m.A, siteScope: 2 } };
  };
  test("sans aucune configuration : tout module est désactivé pour un site, actif pour le site principal ; module inconnu = refusé", () => {
    const w = world();
    for (const k of modules.KEYS) { assert.equal(modules.isEnabled(w.db, 1, 1, k), false, k); assert.equal(modules.isEnabled(w.db, 1, null, k), true, `${k} : site principal`); }
    assert.equal(modules.isEnabled(w.db, 1, 1, "inconnu"), false); assert.equal(modules.isEnabled(w.db, 1, "1", "sms"), false, "identifiant non entier");
    assert.throws(() => modules.assertEnabled(w.S1, "sms"), /pas activé/);
    assert.doesNotThrow(() => modules.assertEnabled(w.A, "sms"), "l'équipe n'est jamais bloquée");
    assert.deepEqual(modules.listFor(w.A, 1).map((m) => m.enabled), [false, false, false, false, false, false]);
  });
  test("activation par l'équipe : un site à la fois, un module à la fois ; idempotente ; journalisée avec le site ; un autre site ou une autre organisation n'est pas touché", () => {
    const w = world();
    assert.deepEqual(modules.setEnabled(w.A, 1, "sms", true), { changed: true, enabled: true });
    assert.deepEqual(modules.setEnabled(w.A, 1, "sms", true), { changed: false, enabled: true });
    assert.equal(modules.isEnabled(w.db, 1, 1, "sms"), true); assert.equal(modules.isEnabled(w.db, 1, 2, "sms"), false); assert.equal(modules.isEnabled(w.db, 1, 1, "ai"), false);
    assert.doesNotThrow(() => modules.assertEnabled(w.S1, "sms")); assert.throws(() => modules.assertEnabled(w.S2, "sms"), /pas activé/);
    assert.deepEqual(rows(w.db, "SELECT action, resource_id, site_id FROM mk_audit_logs WHERE resource_type = 'site_module'"), [{ action: "site_module.enabled", resource_id: "sms", site_id: 1 }]);
    assert.throws(() => modules.setEnabled(w.A, 3, "sms", true), /introuvable/, "site d'une autre organisation");
    assert.throws(() => modules.setEnabled(w.A, 999, "sms", true), /introuvable/);
    assert.throws(() => modules.setEnabled(w.A, 1, "inconnu", true), /inconnu/);
    w.db.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = 2").run();
    assert.throws(() => modules.setEnabled(w.A, 2, "sms", true), /introuvable/, "site supprimé");
  });
  test("une personne limitée à un site ne peut jamais modifier l'activation (ni pour son site, ni pour un autre)", () => {
    const w = world();
    for (const ctx of [w.S1, w.S2, { ...w.A, siteScope: -1 }]) for (const site of [1, 2]) assert.throws(() => modules.setEnabled(ctx, site, "sms", true), /réservée à l'équipe/);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_site_modules")[0].n, 0);
  });
  test("désactiver conserve TOUTES les données du module ; réactiver les retrouve ; l'activation n'est pas une permission (l'isolation des contacts reste en vigueur)", () => {
    const w = world();
    w.db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body) VALUES (1, 'Campagne', 'texte')").run();
    const core = require("../src/marketing/contactcore"); const access = require("../src/marketing/contactcore/siteAccess");
    const other = core.identify(w.A, { email: "autre@x.fr", siteId: 2 }).contact;
    const snapshot = () => JSON.stringify({ c: rows(w.db, "SELECT * FROM mk_sms_campaigns"), k: rows(w.db, "SELECT * FROM mk_contacts") });
    modules.setEnabled(w.A, 1, "sms", true); const before = snapshot();
    modules.setEnabled(w.A, 1, "sms", false);
    assert.equal(snapshot(), before, "aucune donnée touchée par la désactivation");
    assert.deepEqual(rows(w.db, "SELECT enabled FROM mk_site_modules WHERE site_id = 1 AND module = 'sms'"), [{ enabled: 0 }], "la ligne reste, désactivée");
    modules.setEnabled(w.A, 1, "sms", true); assert.equal(snapshot(), before);
    assert.equal(access.canRead(w.S1, other), false, "module activé ≠ accès aux contacts d'un autre site");
  });
  test("routes des six moteurs : déclaration unique ; chaque écran d'administration relève d'un module ; les pages publiques et les autres écrans ne sont pas concernés", () => {
    const cases = { "/sms": "sms", "/sms/campagnes/3": "sms", "/sms/reglages": "sms", "/contacts/5/sms/consentement": "sms", "/reseaux": "social", "/reseaux/reglages": "social", "/score": "scoring", "/score/regles": "scoring", "/ia": "ai", "/ia/etat": "ai", "/revenus": "commerce" };
    for (const [p, m] of Object.entries(cases)) assert.equal(modules.moduleOfPath(p), m, p);
    for (const p of ["/s/abc", "/go/abc", "/contacts", "/contacts/5", "/formulaires", "/pages", "/sondages", "/smsx", "/revenusx", "/"]) assert.equal(modules.moduleOfPath(p), null, p);
    assert.deepEqual(Object.keys(modules.ROUTES).sort(), ["ai", "commerce", "scoring", "sms", "social"], "lms : écrans hors de ce routeur, gardés par leurs propres routes");
  });
});

describe("garde des écrans (décision d'accès) : indépendante de la portée des routes, prête pour les sous-lots", () => {
  test("accès limité : refusé si module désactivé, activé pour un AUTRE site, site absent ou invalide ; autorisé seulement si activé pour SON site ; équipe et écrans hors module jamais refusés", () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const deny = (mk, p) => modules.denies(mk, p, m.db, 1);
    const lim = (siteId) => ({ siteOnly: true, siteId });
    assert.equal(deny(lim(1), "/sms/campagnes/3"), true, "désactivé par défaut");
    modules.setEnabled(m.A, 2, "sms", true);
    assert.equal(deny(lim(1), "/sms/campagnes/3"), true, "activé pour un autre site seulement");
    assert.equal(deny(lim(2), "/sms/campagnes/3"), false, "activé pour son site");
    assert.equal(deny(lim(2), "/reseaux"), true, "un autre module du même site reste désactivé");
    for (const bad of [null, undefined, -1, 0, "2", 99]) assert.equal(deny(lim(bad), "/sms"), true, `site ${String(bad)}`);
    assert.equal(deny({ siteOnly: false, siteId: null }, "/sms"), false, "équipe");
    assert.equal(deny(lim(1), "/contacts"), false, "écran hors module");
    modules.setEnabled(m.A, 2, "sms", false);
    assert.equal(deny(lim(2), "/sms"), true, "désactivation immédiate");
  });
});

describe("câblage de la garde dans le routeur d'administration", () => {
  test("le routeur appelle la garde avant les écrans (vérification de source : aucun écran de moteur n'est encore atteignable par HTTP pour un accès limité, la garde ne peut donc pas être exercée de bout en bout avant R7-6.1)", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "src", "marketing", "web", "index.js"), "utf8");
    assert.match(src, /require\("\.\.\/siteModules"\)\.denies\(req\.mk, req\.path, db, orgId\)\) return res\.status\(403\)/);
    assert.ok(src.indexOf("siteModules\").denies") < src.indexOf("admin.use(require(\"./siteSpace\").attach)"), "avant tout routeur d'écran");
  });
});

describe("test SMS : la double confirmation ne dépend plus de la date réelle", () => {
  test("horloge cohérente : la confirmation créée avec l'horloge du contexte se confirme avec cette horloge, même si l'heure réelle est des années plus tard ; avec l'heure réelle d'un autre temps elle est expirée (cause de l'ancien échec)", () => {
    const forms = require("../src/marketing/forms");
    const m = freshMarketing(); const NOON = 1_791_201_600_000; // 05/10/2026 12:00
    const ctx = m.ctx(1, { baseUrl: "https://k.test", now: () => NOON });
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    const f = forms.createForm(ctx, { name: "Lettre", fields: [], consentText: "Je veux la lettre", listId: null, doubleOptin: true });
    forms.updateForm(ctx, f.id, { name: "Lettre", fields: [], consentText: "Je veux la lettre", listId: null, smsConsentText: "J'accepte de recevoir des SMS de KOLAKISA.", doubleOptin: true });
    forms.setStatus(ctx, f.id, "published");
    const submit = (email) => forms.submitForm(ctx, f.id, { email, consent: "1", sms_consent: "1", sms_phone: "0812345684" });
    const real = Date.now;
    try {
      Date.now = () => 1_900_000_000_000; // « aujourd'hui » dans plusieurs années
      const a = submit("a@x.cd"); assert.equal(a.pending, true);
      assert.equal(forms.confirmSubscription(ctx, a.token, { now: ctx.now() }).ok, true, "horloge cohérente : confirmé");
      const b = submit("b@x.cd");
      assert.equal(forms.confirmSubscription(ctx, b.token, { now: Date.now() }).ok, false, "heure réelle lointaine : expirée (comportement attendu : 7 jours de validité inchangés)");
    } finally { Date.now = real; }
    assert.ok(Date.now() < 1_900_000_000_000, "horloge restaurée");
  });
});

describe("de bout en bout (serveur réel) : activation réservée à l'équipe, six moteurs fermés aux sites tant que leur lot n'est pas livré, équipe inchangée", () => {
  let srv, db, boss, A, B, adminA, editorA, orgAdmin, orgEditor;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor");
    orgAdmin = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'admin')").run(idOf(orgAdmin));
    orgEditor = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'editor')").run(idOf(orgEditor));
  });
  after(() => { db.close(); return srv.stop(); });
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const enabledNow = (site, mod) => (one("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = ?", site, mod) || {}).e === 1;

  test("l'équipe (Super administrateur, administrateur d'organisation) ouvre l'écran, active et désactive ; les six modules apparaissent désactivés par défaut", async () => {
    const page = await boss.get(M(A)); assert.equal(page.status, 200);
    for (const l of ["SMS", "Intelligence artificielle", "Réseaux sociaux", "Score des contacts", "Commerce", "Formations"]) assert.match(page.text, new RegExp(l));
    assert.equal((page.text.match(/Désactivé/g) || []).length >= 6, true);
    assert.equal((await boss.post(`${M(A)}/sms`, { etat: "activer" })).status, 302); assert.equal(enabledNow(A, "sms"), true);
    assert.equal((await orgAdmin.get(M(A))).status, 200, "administrateur d'organisation : permission sites.modules");
    assert.equal((await orgAdmin.post(`${M(A)}/ai`, { etat: "activer" })).status, 302); assert.equal(enabledNow(A, "ai"), true);
    assert.equal((await boss.post(`${M(A)}/sms`, { etat: "desactiver" })).status, 302); assert.equal(enabledNow(A, "sms"), false);
    assert.equal(enabledNow(B, "sms"), false, "l'autre site n'est pas touché");
  });
  test("une personne limitée au site (administrateur ou éditeur du site) ne peut ni ouvrir l'écran ni modifier l'activation, par aucune voie directe ni paramètre falsifié", async () => {
    for (const client of [adminA, editorA, orgEditor]) {
      for (const q of ["", `?site=${A}`, `?site=${B}`]) { const r = await client.get(M(A) + q); assert.ok([302, 403].includes(r.status), `GET ${q} ${r.status}`); assert.doesNotMatch(r.text, /Modules de/); }
      for (const body of [{ etat: "activer" }, { etat: "activer", site: A, site_id: A, enabled: "1", module: "scoring" }]) {
        const r = await client.post(`${M(A)}/scoring`, body); assert.ok([302, 403].includes(r.status), String(r.status));
      }
    }
    assert.equal(enabledNow(A, "scoring"), false); assert.equal(enabledNow(B, "scoring"), false);
    for (const bad of ["inconnu", "SMS", "x"]) { const r = await boss.post(`${M(A)}/${bad}`, { etat: "activer" }); assert.ok([302, 404].includes(r.status)); }
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_modules WHERE module NOT IN ('sms', 'ai', 'social', 'scoring', 'commerce', 'lms')").n, 0);
    assert.equal((await boss.post(`${M(A)}/sms`, { etat: "n'importe quoi" })).status, 302); assert.equal(enabledNow(A, "sms"), false, "état inconnu : rien");
    assert.equal((await boss.get(M(99999))).status, 404);
  });
  test("les moteurs dont le sous-lot n'est PAS livré restent FERMÉS aux personnes limitées à un site — avec ou sans module activé ; les réglages et blocages SMS (organisation) restent fermés ; aucune donnée n'est affichée", async () => {
    db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body) VALUES (1, 'CAMPAGNE-SECRETE', 'texte')").run();
    db.prepare("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at) VALUES (1, 'g', 'facebook', 'PUBLICATION-SECRETE', 1)").run();
    for (const mod of modules.KEYS) await boss.post(`${M(A)}/${mod}`, { etat: "activer" });
    const routes = ["/sms/reglages", "/sms/blocages", "/sms/test", "/reseaux/reglages", "/score/regles", "/score/recalculer", "/ia", "/revenus/fenetre"];
    for (const client of [adminA, editorA]) for (const r of routes) for (const q of ["", `?site=${A}`]) {
      const res = await client.get(`/marketing${r}${q}`);
      assert.ok([302, 403, 404].includes(res.status), `${r}${q} -> ${res.status}`);
      assert.doesNotMatch(res.text, /CAMPAGNE-SECRETE|PUBLICATION-SECRETE/);
    }
    for (const client of [adminA, editorA]) { const res = await client.get(`/marketing/reseaux?site=${A}`); assert.doesNotMatch(res.text, /PUBLICATION-SECRETE/, "R7-6.3 : /reseaux est ouvert au site, mais les publications de l'organisation (sans site) restent invisibles"); }
    for (const mod of modules.KEYS) await boss.post(`${M(A)}/${mod}`, { etat: "desactiver" });
  });
  test("compatibilité : l'équipe garde exactement l'accès historique aux écrans des moteurs, avec ou sans activation de site", async () => {
    for (const r of ["/sms", "/reseaux", "/score", "/ia", "/revenus"]) { const res = await boss.get(`/marketing${r}`); assert.equal(res.status, 200, r); }
    await boss.post(`${M(A)}/sms`, { etat: "activer" }); await boss.post(`${M(A)}/sms`, { etat: "desactiver" });
    for (const r of ["/sms", "/reseaux", "/score", "/ia", "/revenus"]) assert.equal((await boss.get(`/marketing${r}`)).status, 200, `${r} après activation / désactivation`);
  });
  test("journal : l'activation d'un module est consignée avec le site ; l'administrateur du site (audit.read) voit SES événements, jamais ceux de l'autre site", async () => {
    await boss.post(`${M(B)}/commerce`, { etat: "activer" }); await boss.post(`${M(A)}/commerce`, { etat: "activer" });
    const logs = (await adminA.get(`/marketing/site-web/outils/logs?site=${A}`)); assert.equal(logs.status, 200);
    assert.match(logs.text, /site_module\.enabled/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'site_module.enabled' AND site_id = ?", B) .n >= 1, true);
    assert.equal((logs.text.match(/site_module\.enabled/g) || []).length, one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'site_module.enabled' AND site_id = ?", A).n);
  });
});
