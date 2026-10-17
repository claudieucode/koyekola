// R7 (lot 6.3) — Réseaux sociaux multisite : migration 087 (colonne + autorisations, aucune donnée existante modifiée), autorisation EXPLICITE par site et par réseau (l'activation du module ne suffit pas),
// revérification à l'heure de la publication, cloisonnement, secrets, parcours HTTP réels. API des réseaux factice (aucun appel réel).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const social = require("../src/marketing/social");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const NOW = 1_800_000_000_000;
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
let calls = [], respond = () => ({ status: 200, body: { id: "123_456" } });
const fakeApi = () => { calls = []; social.setFetchForTests(async (url, opts) => { calls.push({ url, body: opts.body }); const r = respond(url, opts); return { status: r.status, json: async () => r.body, headers: { get: () => null } }; }); };
const TOKEN = "EAAB-jeton-facebook-tres-long-SECRET-123";
const PAGE = "1234567890";

describe("migration 087 : une colonne et une table, aucune donnée existante modifiée, aucune autorisation créée", () => {
  test("publications existantes sans site ; aucune autorisation ni activation créée ; déclencheurs d'organisation et d'immutabilité ; rejouée : rien", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig87-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "087") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (2, 'S2', 's2', '{}')");
      db.exec("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (1, 1, 'editor')");
      db.exec("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at) VALUES (1, 'g', 'facebook', 'Historique', 1), (1, 'g', 'linkedin', 'Historique', 2)");
      const before = rows(db, "SELECT * FROM mk_social_posts");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "087"), ["087"]);
      assert.deepEqual(rows(db, "SELECT * FROM mk_social_posts").map(({ site_id, ...r }) => ({ ...r, site_id })), before.map((r) => ({ ...r, site_id: null })), "historique intact, site inconnu non deviné");
      assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_social_site_grants")[0].n, 0, "aucune autorisation créée par la migration");
      assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_site_modules")[0].n, 0, "aucun module activé");
      const ins = (site, org) => db.prepare("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at, site_id) VALUES (?, 'g', 'facebook', 'x', 1, ?)").run(org, site);
      assert.throws(() => ins(2, 1), /même organisation/, "site d'une autre organisation");
      const id = Number(ins(1, 1).lastInsertRowid);
      assert.throws(() => db.prepare("UPDATE mk_social_posts SET site_id = NULL WHERE id = ?").run(id), /ne change jamais/);
      assert.throws(() => db.prepare("INSERT INTO mk_social_site_grants (site_id, organization_id, network) VALUES (2, 1, 'facebook')").run(), /même organisation/);
      assert.throws(() => db.prepare("INSERT INTO mk_social_site_grants (site_id, organization_id, network) VALUES (1, 1, 'tiktok')").run(), /CHECK|constraint/i);
      db.prepare("INSERT INTO mk_social_site_grants (site_id, organization_id, network) VALUES (1, 1, 'facebook')").run();
      assert.throws(() => db.prepare("UPDATE mk_social_site_grants SET network = 'linkedin'").run(), /non modifiable/);
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : autorisation explicite, module requis, cloisonnement, revérification à l'heure de la publication (base synthétique, API factice)", () => {
  const world = () => {
    const m = freshMarketing(); fakeApi(); respond = () => ({ status: 200, body: { id: "123_456" } });
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    const A = m.ctx(1, { now: () => NOW });
    social.saveSocialConfig(A, { facebookPageId: PAGE, facebookToken: TOKEN, instagramUserId: "17841400000000000", linkedinAuthor: "urn:li:organization:5550001", linkedinToken: "AQV-jeton-linkedin-tres-long-SECRET-456" });
    return { ...m, A, S1: { ...A, siteScope: 1 }, S2: { ...A, siteScope: 2 } };
  };
  const post = (ctx, extra = {}) => social.createPosts(ctx, { networks: ["facebook"], body: "Bonjour", ...extra });
  const later = (extra = {}) => ({ scheduledAt: NOW + 3600000, ...extra });

  test("activer le module N'AUTORISE AUCUN compte : sans autorisation par réseau, rien n'est créé ni envoyé ; avec l'autorisation d'un seul réseau, les autres restent refusés (création atomique)", async () => {
    const w = world();
    assert.equal(code(() => post(w.S1)), "module_disabled");
    modules.setEnabled(w.A, 1, "social", true);
    assert.equal(code(() => post(w.S1)), "forbidden", "module activé mais aucune autorisation");
    social.setSiteGrants(w.A, 1, ["facebook"]);
    assert.equal(code(() => social.createPosts(w.S1, { networks: ["facebook", "linkedin"], body: "x" })), "forbidden", "un réseau non autorisé refuse TOUTE la demande");
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_social_posts")[0].n, 0);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_jobs WHERE type = 'social.publish'")[0].n, 0);
    const r = post(w.S1, later()); assert.equal(r.ids.length, 1);
    assert.equal(rows(w.db, "SELECT site_id s FROM mk_social_posts WHERE id = ?", r.ids[0])[0].s, 1);
    assert.equal(code(() => post(w.S2, later())), "module_disabled", "le site 2 n'a ni module ni autorisation");
    assert.equal(calls.length, 0);
  });
  test("autorisations : équipe seulement, site et réseau valides, d'une même organisation ; idempotent ; chaque ajout et retrait est tracé avec le site", () => {
    const w = world();
    assert.equal(code(() => social.setSiteGrants(w.S1, 1, ["facebook"])), "forbidden", "même un administrateur de ce site");
    assert.equal(code(() => social.listSiteGrants(w.S1)), "forbidden");
    assert.equal(code(() => social.setSiteGrants(w.A, 3, ["facebook"])), "not_found", "site d'une autre organisation");
    assert.equal(code(() => social.setSiteGrants(w.A, 99, ["facebook"])), "not_found");
    assert.equal(code(() => social.setSiteGrants(w.A, 1, ["tiktok"])), "invalid_field");
    assert.deepEqual(social.setSiteGrants(w.A, 1, ["facebook", "linkedin"]), { added: ["facebook", "linkedin"], removed: [] });
    assert.deepEqual(social.setSiteGrants(w.A, 1, ["facebook", "linkedin"]), { added: [], removed: [] });
    assert.deepEqual(social.setSiteGrants(w.A, 1, ["facebook"]), { added: [], removed: ["linkedin"] });
    assert.deepEqual(rows(w.db, "SELECT action, site_id FROM mk_audit_logs WHERE action LIKE 'social.grant%' ORDER BY id"), [{ action: "social.grant_added", site_id: 1 }, { action: "social.grant_removed", site_id: 1 }]);
    assert.deepEqual([...social.grantedNetworks(w.db, 1, 2)], [], "l'autorisation d'un site n'est pas celle d'un autre");
    assert.deepEqual(social.listSiteGrants(w.A).map((s) => [s.id, s.networks]), [[1, ["facebook"]], [2, []]]);
  });
  test("site de la publication : un accès limité publie TOUJOURS pour son site (jamais celui de l'appelant) ; l'équipe peut viser un site (alors autorisation exigée) ou l'organisation (historique, sans autorisation)", () => {
    const w = world();
    modules.setEnabled(w.A, 1, "social", true); social.setSiteGrants(w.A, 1, ["facebook"]);
    const a = post(w.S1, later({ siteId: 2 })); assert.equal(rows(w.db, "SELECT site_id s FROM mk_social_posts WHERE id = ?", a.ids[0])[0].s, 1);
    assert.equal(code(() => post(w.A, later({ siteId: 2 }))), "forbidden", "l'équipe publiant POUR le site 2 doit respecter son autorisation");
    assert.equal(code(() => post(w.A, later({ siteId: 3 }))), "not_found", "site d'une autre organisation");
    assert.equal(code(() => post(w.A, later({ siteId: 999 }))), "not_found");
    const b = post(w.A, later({ siteId: 1 })); assert.equal(rows(w.db, "SELECT site_id s FROM mk_social_posts WHERE id = ?", b.ids[0])[0].s, 1);
    const c = post(w.A, later()); assert.equal(rows(w.db, "SELECT site_id s FROM mk_social_posts WHERE id = ?", c.ids[0])[0].s, null, "publication de l'organisation : fonctionnement historique inchangé");
    assert.equal(code(() => post({ ...w.A, siteScope: -1 }, later())), "module_disabled", "site imposé invalide : refusé");
  });
  test("cloisonnement : un site ne voit ni ne touche les publications d'un autre site ni de l'organisation ; l'équipe voit tout ; une autre organisation, rien", () => {
    const w = world();
    for (const s of [1, 2]) { modules.setEnabled(w.A, s, "social", true); social.setSiteGrants(w.A, s, ["facebook"]); }
    const p1 = post(w.S1, later()).ids[0], p2 = post(w.S2, later()).ids[0], po = post(w.A, later()).ids[0];
    assert.deepEqual(social.listPosts(w.S1).map((p) => p.id), [p1]); assert.deepEqual(social.listPosts(w.S2).map((p) => p.id), [p2]);
    assert.deepEqual(social.listPosts(w.A).map((p) => p.id).sort(), [p1, p2, po].sort());
    for (const id of [p2, po]) {
      assert.equal(social.getPost(w.S1, id), null);
      for (const fn of [social.cancelPost, social.retryPost, social.deletePost]) assert.equal(code(() => fn(w.S1, id)), "not_found");
    }
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_social_posts")[0].n, 3, "rien n'a été touché");
    const B = w.ctx(2, { now: () => NOW }); assert.deepEqual(social.listPosts(B), []);
    assert.equal(code(() => social.cancelPost(B, p1)), "not_found");
    social.cancelPost(w.S1, p1); assert.equal(rows(w.db, "SELECT status s FROM mk_social_posts WHERE id = ?", p1)[0].s, "cancelled");
  });
  test("ASYNCHRONE : publication programmée puis autorisation retirée avant l'heure → annulée, JAMAIS envoyée ; même chose pour le module désactivé, le site supprimé ; autorisation intacte → publiée", async () => {
    const w = world();
    for (const s of [1, 2]) { modules.setEnabled(w.A, s, "social", true); social.setSiteGrants(w.A, s, ["facebook", "linkedin"]); }
    const at = NOW + 3600000, run = (ctx, id) => social.publishPost({ ...ctx, now: () => at + 1000, siteScope: undefined }, id); // la tâche d'arrière-plan n'a jamais de siteScope
    const ids = Object.fromEntries(["retire", "module", "supprime", "ok", "organisation", "autreReseau"].map((k) => [k, post(w.S1, { scheduledAt: at, networks: [k === "autreReseau" ? "linkedin" : "facebook"] }).ids[0]]));
    ids.organisation = post(w.A, { scheduledAt: at }).ids[0];
    ids.s2 = post(w.S2, { scheduledAt: at }).ids[0];
    social.setSiteGrants(w.A, 1, ["linkedin"]);              // retire facebook du site 1 (linkedin conservé)
    assert.deepEqual(await run(w.A, ids.retire), { done: true, blocked: true });
    social.setSiteGrants(w.A, 1, ["facebook", "linkedin"]);
    modules.setEnabled(w.A, 1, "social", false);
    assert.deepEqual(await run(w.A, ids.module), { done: true, blocked: true });
    modules.setEnabled(w.A, 1, "social", true);
    w.db.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = 2").run();
    assert.deepEqual(await run(w.A, ids.s2), { done: true, blocked: true }, "site supprimé");
    assert.equal(calls.length, 0, "RIEN n'a été envoyé aux réseaux");
    for (const k of ["retire", "module"]) { const r = rows(w.db, "SELECT status, error FROM mk_social_posts WHERE id = ?", ids[k])[0]; assert.equal(r.status, "cancelled"); assert.match(r.error, /annulée/); }
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'social.blocked' AND site_id = 1")[0].n, 2);
    // autorisations intactes, publication de l'organisation (sans site) : partent normalement
    assert.deepEqual(await run(w.A, ids.ok), { done: true, published: true });
    assert.deepEqual(await run(w.A, ids.organisation), { done: true, published: true });
    assert.deepEqual(await run(w.A, ids.autreReseau), { done: true, published: true });
    assert.equal(calls.length, 3);
    assert.equal(rows(w.db, "SELECT status s FROM mk_social_posts WHERE id = ?", ids.ok)[0].s, "published");
  });
  test("ASYNCHRONE : essai temporaire puis autorisation retirée entre deux essais → le second essai est annulé ; la relance d'un échec revérifie l'autorisation", async () => {
    const w = world(); modules.setEnabled(w.A, 1, "social", true); social.setSiteGrants(w.A, 1, ["facebook"]);
    const id = post(w.S1, { scheduledAt: NOW }).ids[0];
    respond = () => ({ status: 503, body: { error: { message: "indisponible" } } });
    let r = await social.publishPost(w.A, id); assert.equal(r.retry, true); assert.equal(calls.length, 1);
    social.setSiteGrants(w.A, 1, []);
    r = await social.publishPost({ ...w.A, now: () => NOW + 180000 }, id); assert.deepEqual(r, { done: true, blocked: true });
    assert.equal(calls.length, 1, "aucun second appel");
    // relance : un échec réel, puis retrait, puis relance refusée
    social.setSiteGrants(w.A, 1, ["facebook"]);
    const id2 = post(w.S1, { scheduledAt: NOW }).ids[0]; respond = () => ({ status: 400, body: { error: { message: "refusé" } } });
    assert.deepEqual(await social.publishPost(w.A, id2), { done: true, failed: true });
    social.setSiteGrants(w.A, 1, []); assert.equal(code(() => social.retryPost(w.S1, id2)), "forbidden");
    assert.equal(rows(w.db, "SELECT status s FROM mk_social_posts WHERE id = ?", id2)[0].s, "failed");
  });
  test("comptes déconnectés, jetons invalides, erreurs du fournisseur : échec expliqué, aucun jeton dans les messages ni pour un accès limité", async () => {
    const w = world(); modules.setEnabled(w.A, 1, "social", true); social.setSiteGrants(w.A, 1, ["facebook"]);
    respond = () => ({ status: 401, body: { error: { message: `Invalid OAuth access_token=${TOKEN}`, code: 190 } } });
    const a = post(w.S1, { scheduledAt: NOW }).ids[0]; assert.deepEqual(await social.publishPost(w.A, a), { done: true, failed: true });
    const msg = rows(w.db, "SELECT error e FROM mk_social_posts WHERE id = ?", a)[0].e; assert.match(msg, /refusé le jeton/); assert.ok(!msg.includes(TOKEN));
    social.saveSocialConfig(w.A, { clearFacebook: true });                    // l'équipe déconnecte le compte
    assert.equal(code(() => post(w.S1)), "invalid_field", "réseau non relié : création refusée");
    social.saveSocialConfig(w.A, { facebookToken: TOKEN });
    const b = post(w.S1, { scheduledAt: NOW }).ids[0]; social.saveSocialConfig(w.A, { clearFacebook: true });
    assert.deepEqual(await social.publishPost(w.A, b), { done: true, failed: true });
    assert.match(rows(w.db, "SELECT error e FROM mk_social_posts WHERE id = ?", b)[0].e, /refusé le jeton/);
  });
  test("secrets : un accès limité ne lit ni identifiant de page, ni auteur, ni nom, ni jeton ; il ne peut ni enregistrer ni tester un compte ; les lignes lues n'en contiennent aucun", async () => {
    const w = world(); modules.setEnabled(w.A, 1, "social", true); social.setSiteGrants(w.A, 1, ["facebook"]);
    const view = social.getSocialView(w.S1);
    assert.deepEqual(view, { facebook: { connected: true }, instagram: { connected: false }, linkedin: { connected: false } }, "seul « utilisable par mon site » est exposé");
    const dump = JSON.stringify([view, social.listPosts(w.S1)]); for (const s of [TOKEN, PAGE, "5550001", "17841400000000000", "SECRET"]) assert.ok(!dump.includes(s), s);
    assert.equal(code(() => social.saveSocialConfig(w.S1, { facebookToken: "AAAAAAAAAAAAAAAAAAAAAAAA" })), "forbidden");
    assert.equal(code(() => social.saveSocialConfig(w.S1, { clearFacebook: true })), "forbidden");
    await assert.rejects(social.testConnection(w.S1, "facebook"), { code: "forbidden" });
    assert.ok(social.getSocialConfig(w.A).facebook.connected, "le compte n'a pas bougé");
    assert.ok(!JSON.stringify(rows(w.db, "SELECT * FROM mk_audit_logs")).includes(TOKEN), "jamais dans le journal");
  });
  test("données conservées : désactiver le module ou retirer une autorisation ne supprime ni ne modifie aucune publication ; l'équipe les lit toujours", () => {
    const w = world(); modules.setEnabled(w.A, 1, "social", true); social.setSiteGrants(w.A, 1, ["facebook"]);
    const id = post(w.S1, later()).ids[0];
    const snap = () => JSON.stringify(rows(w.db, "SELECT * FROM mk_social_posts"));
    const before = snap();
    modules.setEnabled(w.A, 1, "social", false); social.setSiteGrants(w.A, 1, []);
    assert.equal(snap(), before);
    assert.equal(code(() => social.listPosts(w.S1)), "module_disabled");
    assert.equal(social.getPost(w.A, id).body, "Bonjour");
  });
  test("compatibilité historique : l'équipe publie pour l'organisation sans module ni autorisation, exactement comme avant", async () => {
    const w = world(); const id = post(w.A).ids[0];
    assert.deepEqual(await social.publishPost(w.A, id), { done: true, published: true }); assert.equal(calls.length, 1);
    assert.equal(rows(w.db, "SELECT site_id s FROM mk_social_posts WHERE id = ?", id)[0].s, null);
  });
});

describe("de bout en bout (serveur réel) : routes ouvertes aux sites, autorisation par réseau, cloisonnement, secrets, rôles", () => {
  let srv, db, boss, A, B, adminA, editorA, adminB, readerA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const S = "/marketing/reseaux";
  const FUTURE = new Date(Date.now() + 7 * 86400000).toISOString();
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    await boss.post(`${S}/reglages`, { facebook_page_id: PAGE, facebook_token: TOKEN });
    db.prepare("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at, site_id) VALUES (1, 'g', 'facebook', 'PUBLICATION-ORG-SECRETE', ?, NULL)").run(Date.now() + 9e8);
  });
  after(() => { db.close(); return srv.stop(); });
  const status = (id) => one("SELECT status s FROM mk_social_posts WHERE id = ?", id).s;

  test("module désactivé : l'écran du site est refusé à l'administrateur, à l'éditeur et à tout rôle ; l'équipe garde son accès", async () => {
    for (const c of [adminA, editorA, readerA]) for (const p of [S, `${S}/1/annuler`]) { const r = await c[p.endsWith("annuler") ? "post" : "get"](`${p}?site=${A}`); assert.ok([403, 404].includes(r.status), `${p} ${r.status}`); assert.doesNotMatch(r.text, /PUBLICATION-/); }
    assert.equal((await boss.get(S)).status, 200);
  });
  test("module activé SANS autorisation : l'écran s'ouvre mais aucun réseau n'est utilisable ; la création est refusée et ne crée rien", async () => {
    assert.equal((await boss.post(`${M(A)}/social`, { etat: "activer" })).status, 302);
    const page = await adminA.get(`${S}?site=${A}`); assert.equal(page.status, 200);
    assert.match(page.text, /Aucun réseau autorisé pour ce site/); assert.doesNotMatch(page.text, /PUBLICATION-ORG-SECRETE/);
    const r = await adminA.post(`${S}?site=${A}`, { site: A, networks: "facebook", body: "Bonjour" });
    assert.equal(r.status, 302); assert.equal(one("SELECT COUNT(*) n FROM mk_social_posts WHERE site_id IS NOT NULL").n, 0);
    assert.equal((await readerA.get(`${S}?site=${A}`)).status, 403, "rôle sans campaigns.read");
  });
  test("l'équipe autorise Facebook pour le site A : l'administrateur et l'éditeur publient POUR LEUR SITE (même si le corps désigne B) ; un site non autorisé ou un autre administrateur ne le peuvent pas", async () => {
    assert.equal((await adminA.post(`${S}/reglages/sites?site=${A}`, { site: A, site_id: A, networks: "facebook" })).status, 403, "un administrateur de site n'accorde rien");
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_site_grants").n, 0);
    assert.equal((await boss.post(`${S}/reglages/sites`, { site_id: A, networks: "facebook" })).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_site_grants WHERE site_id = ? AND network = 'facebook'", A).n, 1);
    const r1 = await adminA.post(`${S}?site=${A}`, { site: A, for_site: B, site_id: B, networks: "facebook", body: "Post Alpha admin", when: "later", send_at_utc: FUTURE });
    assert.equal(r1.status, 302);
    const r2 = await editorA.post(`${S}?site=${A}`, { site: A, networks: "facebook", body: "Post Alpha editeur", when: "later", send_at_utc: FUTURE }); assert.equal(r2.status, 302);
    assert.deepEqual(db.prepare("SELECT body, site_id FROM mk_social_posts WHERE site_id IS NOT NULL ORDER BY id").all().map((r) => ({ ...r })), [{ body: "Post Alpha admin", site_id: A }, { body: "Post Alpha editeur", site_id: A }]);
    await adminA.post(`${S}?site=${A}`, { site: A, networks: "linkedin", body: "Refusé LinkedIn", when: "later", send_at_utc: FUTURE });
    await adminA.post(`${S}?site=${A}`, { site: A, networks: ["facebook", "linkedin"], body: "Refusé aussi", when: "later", send_at_utc: FUTURE });
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_posts WHERE body LIKE 'Refusé%'").n, 0);
    assert.equal((await adminB.get(`${S}?site=${A}`)).status, 403, "administrateur d'un autre site");
    assert.equal((await adminB.post(`${S}?site=${A}`, { site: A, networks: "facebook", body: "PIRATE" })).status, 403);
    assert.equal((await adminB.get(`${S}?site=${B}`)).status, 403, "module non activé pour B");
  });
  test("cloisonnement : un autre site ne voit ni ne modifie les publications d'Alpha ni celles de l'organisation, par aucune route directe", async () => {
    await boss.post(`${M(B)}/social`, { etat: "activer" });                       // B : module activé, aucune autorisation
    const pageB = await adminB.get(`${S}?site=${B}`); assert.equal(pageB.status, 200);
    assert.doesNotMatch(pageB.text, /Post Alpha|PUBLICATION-ORG-SECRETE/);
    const alpha = one("SELECT id FROM mk_social_posts WHERE body = 'Post Alpha admin'").id, org = one("SELECT id FROM mk_social_posts WHERE body = 'PUBLICATION-ORG-SECRETE'").id;
    for (const id of [alpha, org]) for (const action of ["annuler", "relancer", "supprimer"]) for (const q of [`?site=${B}`, `?site=${A}`, ""]) {
      const r = await adminB.post(`${S}/${id}/${action}${q}`, { site: B }); assert.ok([302, 403, 404].includes(r.status), `${action} ${q} ${r.status}`); assert.doesNotMatch(r.text, /PUBLICATION-ORG|Post Alpha/);
    }
    assert.equal(status(alpha), "scheduled"); assert.equal(status(org), "scheduled");
    for (const action of ["annuler", "supprimer"]) assert.ok([302, 403, 404].includes((await adminA.post(`${S}/${org}/${action}?site=${A}`, { site: A })).status));
    assert.equal(status(org), "scheduled", "la publication de l'organisation n'est pas touchable par un site");
    assert.equal((await adminB.post(`${S}?site=${B}`, { site: B, networks: "facebook", body: "Pas autorisé B" })).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_posts WHERE body = 'Pas autorisé B'").n, 0);
    // pré-remplissage « partager une campagne » : une campagne d'un autre site ou de l'organisation n'est jamais lisible (objet, aperçu, lien)
    const camp = (name, subject, site) => Number(db.prepare("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status, kind, finished_at, site_id) VALUES (1, ?, ?, 'list', 1, 'sent', 'campaign', 1, ?)").run(name, JSON.stringify({ kind: "marketing", subject, preheader: "", blocks: [{ type: "text", markdown: "Bonjour" }] }), site).lastInsertRowid);
    const own = camp("CA", "SUJET-ALPHA-VISIBLE", A), other = camp("CB", "SUJET-BRAVO-SECRET", B), orgc = camp("CO", "SUJET-ORG-SECRET", null);
    assert.match((await adminA.get(`${S}?site=${A}&campagne=${own}`)).text, /SUJET-ALPHA-VISIBLE/, "sa propre campagne : pré-remplie");
    for (const id of [other, orgc]) assert.doesNotMatch((await adminA.get(`${S}?site=${A}&campagne=${id}`)).text, /SUJET-(BRAVO|ORG)-SECRET/);
    assert.match((await boss.get(`${S}?campagne=${other}`)).text, /SUJET-BRAVO-SECRET/, "l'équipe garde l'accès historique");
  });
  test("secrets : ni le jeton, ni l'identifiant de page ne sont dans les pages d'un site ; les réglages, le test de connexion et les autorisations sont fermés aux sites ; l'équipe voit le tableau des autorisations mais jamais le jeton", async () => {
    for (const c of [adminA, editorA]) {
      const p = await c.get(`${S}?site=${A}`); assert.equal(p.status, 200);
      for (const s of [TOKEN, PAGE, "SECRET"]) assert.ok(!p.text.includes(s), s);
      for (const route of ["/reglages", "/reglages/sites", "/reglages/tester/facebook"]) for (const m of ["get", "post"]) for (const q of ["", `?site=${A}`]) {
        const x = await c[m](`${S}${route}${q}`, { site: A, facebook_token: "AAAAAAAAAAAAAAAAAAAAAAAAAAA", clear_facebook: "1", site_id: A, networks: "linkedin" }); assert.ok([302, 403, 404].includes(x.status), `${m} ${route}${q} ${x.status}`);
        if (x.status === 200) assert.ok(false);
      }
    }
    assert.match(String(db.prepare("SELECT value FROM mk_settings WHERE key = 'social.facebook.token'").get().value), /^v1:/, "jeton chiffré en base");
    const team = await boss.get(`${S}/reglages`); assert.equal(team.status, 200);
    assert.match(team.text, /Sites autorisés à publier/); assert.match(team.text, /Site Alpha/); assert.ok(!team.text.includes(TOKEN));
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_site_grants").n, 1, "aucune modification par les sites");
    const api = await boss.request("/api/v1/social"); assert.ok([401, 404].includes(api.status), "aucune API sociale exposée");
  });
  test("l'équipe voit toutes les publications avec leur site ; annuler sa propre publication de site fonctionne ; retrait de l'autorisation puis désactivation du module : données conservées, accès refusé", async () => {
    const team = (await boss.get(S)).text;
    assert.match(team, /PUBLICATION-ORG-SECRETE/); assert.match(team, /Post Alpha admin/); assert.match(team, /Site Alpha/);
    const id = one("SELECT id FROM mk_social_posts WHERE body = 'Post Alpha editeur'").id;
    assert.equal((await editorA.post(`${S}/${id}/annuler?site=${A}`, { site: A })).status, 302); assert.equal(status(id), "cancelled");
    const before = one("SELECT COUNT(*) n FROM mk_social_posts").n;
    await boss.post(`${S}/reglages/sites`, { site_id: A });                       // aucun réseau coché = retrait
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_site_grants").n, 0);
    await adminA.post(`${S}?site=${A}`, { site: A, networks: "facebook", body: "Après retrait", when: "later", send_at_utc: FUTURE });
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_posts WHERE body = 'Après retrait'").n, 0);
    assert.equal((await boss.post(`${M(A)}/social`, { etat: "desactiver" })).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM mk_social_posts").n, before);
    assert.equal((await adminA.get(`${S}?site=${A}`)).status, 403);
    assert.match((await boss.get(S)).text, /Post Alpha admin/);
  });
});
