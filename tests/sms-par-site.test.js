// R7 (lot 6.1) — SMS par site : migration 085, campagnes bornées au site, destinataires recoupés avec les contacts lisibles du site, STOP commun, prix confidentiel, module activé requis
// (y compris en arrière-plan), routes ouvertes aux sites. Bases synthétiques et serveur réel jetables ; fournisseur simulé : aucun vrai SMS.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const core = require("../src/marketing/contactcore");
const sms = require("../src/marketing/sms");
const modules = require("../src/marketing/siteModules");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const NOON = Date.UTC(2026, 9, 5, 11);
const proof = { source: "form", textShown: "J'accepte de recevoir les SMS de KOLAKISA." };
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const fakeProvider = () => { const sent = []; let n = 0; return { name: "fake", capabilities: { statusCallbacks: true }, sent, async send(message) { sent.push(message); return { providerMessageId: `SM${++n}` }; } }; };

describe("migration 085 : une colonne, aucune donnée existante modifiée", () => {
  test("campagnes, messages, liste STOP et consentements existants inchangés (site NULL) ; rejouée : rien ; site de la même organisation ; le site d'une campagne ne change jamais", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig85-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "085") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (2, 'Autre', 'autre', '{}')");
      db.exec("INSERT INTO mk_contacts (organization_id, email, sms_phone, sms_status) VALUES (1, 'x@x.fr', '+243812345671', 'subscribed')");
      db.exec("INSERT INTO mk_sms_campaigns (organization_id, name, body) VALUES (1, 'Existante', 'texte')");
      db.exec("INSERT INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, updated_at) VALUES (1, 1, 1, '+243812345671', 1)");
      db.exec("INSERT INTO mk_sms_suppressions (organization_id, phone, reason) VALUES (1, '+243899999999', 'stop')");
      const snap = () => JSON.stringify({ m: rows(db, "SELECT * FROM mk_sms_messages"), s: rows(db, "SELECT * FROM mk_sms_suppressions"), c: rows(db, "SELECT * FROM mk_contacts") });
      const before = snap(); const campBefore = rows(db, "SELECT * FROM mk_sms_campaigns");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "085"), ["085"]);
      assert.equal(snap(), before);
      assert.deepEqual(rows(db, "SELECT * FROM mk_sms_campaigns").map(({ site_id, ...r }) => ({ ...r, site_id })), campBefore.map((r) => ({ ...r, site_id: null })), "campagnes historiques : site NULL, rien d'autre");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      assert.equal(rows(db, "SELECT COUNT(*) n FROM pragma_table_info('mk_sms_suppressions') WHERE name = 'site_id'")[0].n, 0, "la liste STOP reste commune à l'organisation");
      assert.throws(() => db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body, site_id) VALUES (1, 'X', 'x', 2)").run(), /même organisation/);
      db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body, site_id) VALUES (1, 'Site', 'x', 1)").run();
      assert.throws(() => db.prepare("UPDATE mk_sms_campaigns SET site_id = NULL WHERE name = 'Site'").run(), /ne change jamais/);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : campagnes de site, destinataires bornés, STOP commun, prix confidentiel, arrière-plan (base synthétique)", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const A = m.ctx(1, { baseUrl: "https://k.test" });
    const mk = (email, phone, siteId) => { const c = core.identify(A, { email, phone, ...(siteId ? { siteId } : {}) }).contact; sms.recordSmsConsent(A, c.id, { ...proof, phone }); return audience.getContact(A, c.id); };
    const a1 = mk("a1@x.cd", "0812345671", 1), a2 = mk("a2@x.cd", "0812345672", 1), b1 = mk("b1@x.cd", "0812345673", 2), org = mk("org@x.cd", "0812345674");
    A.settings.set(1, "sms.price_per_segment", "0.05"); A.settings.set(1, "sms.currency", "USD");
    const list1 = audience.createList(A, { name: "Liste S1", siteId: 1 }), list2 = audience.createList(A, { name: "Liste S2", siteId: 2 });
    audience.addToList(A, list1.id, [a1.id, a2.id, b1.id]); // b1 (site 2) dans la liste du site 1 : DOIT être exclu
    audience.addToList(A, list2.id, [b1.id]);
    modules.setEnabled(A, 1, "sms", true);
    return { ...m, A, S1: { ...A, siteScope: 1 }, S2: { ...A, siteScope: 2 }, a1, a2, b1, org, list1, list2 };
  };
  test("module requis : un accès limité dont le module est désactivé n'a aucun accès au service (lecture, création, liste) ; l'équipe n'est jamais bloquée", () => {
    const w = world();
    assert.throws(() => sms.listSmsCampaigns(w.S2, {}), /pas activé/);
    assert.throws(() => sms.createSmsCampaign(w.S2, { name: "X", targetType: "list", targetId: w.list2.id }), /pas activé/);
    assert.doesNotThrow(() => sms.listSmsCampaigns(w.A, {}));
    assert.doesNotThrow(() => sms.listSmsCampaigns(w.S1, {}));
  });
  test("création : le site est celui du serveur (jamais une valeur de requête) ; l'équipe choisit ; « tous les abonnés » refusé à un accès limité ; liste d'un autre site refusée ; chaque campagne reste dans son site", () => {
    const w = world();
    const own = sms.createSmsCampaign(w.S1, { name: "Site 1", siteId: 2 /* ignoré */ });
    assert.equal(own.site_id, 1);
    assert.throws(() => sms.createSmsCampaign(w.S1, { name: "Tous", targetType: "all" }), /réservé à l'équipe/);
    assert.throws(() => sms.updateSmsCampaign(w.S1, own.id, { targetType: "all" }), /réservé à l'équipe/);
    assert.throws(() => sms.updateSmsCampaign(w.S1, own.id, { targetType: "list", targetId: w.list2.id }), /introuvable/, "liste d'un autre site : introuvable pour un accès limité");
    assert.equal(sms.updateSmsCampaign(w.S1, own.id, { targetType: "list", targetId: w.list1.id }).target_id, w.list1.id);
    const teamSite = sms.createSmsCampaign(w.A, { name: "Équipe pour S1", siteId: 1 }); assert.equal(teamSite.site_id, 1);
    assert.throws(() => sms.updateSmsCampaign(w.A, teamSite.id, { targetType: "list", targetId: w.list2.id }), /n'appartient pas au site/, "même l'équipe ne mélange pas les sites dans une campagne de site");
    const orgCampaign = sms.createSmsCampaign(w.A, { name: "Organisation" }); assert.equal(orgCampaign.site_id, null); assert.equal(orgCampaign.target_type, "all");
    // lecture croisée
    assert.equal(sms.getSmsCampaign(w.S1, orgCampaign.id), null, "campagne d'organisation : introuvable d'un accès limité");
    modules.setEnabled(w.A, 2, "sms", true);
    const other = sms.createSmsCampaign(w.S2, { name: "Site 2" });
    assert.equal(sms.getSmsCampaign(w.S1, other.id), null, "campagne d'un autre site : introuvable (identifiant falsifié)");
    for (const fn of [(c) => sms.updateSmsCampaign(w.S1, c, { name: "pirate" }), (c) => sms.deleteSmsCampaign(w.S1, c), (c) => sms.duplicateSmsCampaign(w.S1, c), (c) => sms.pauseSmsCampaign(w.S1, c), (c) => sms.cancelSmsCampaign(w.S1, c), (c) => sms.smsCampaignReport(w.S1, c), (c) => sms.smsRecipients(w.S1, c)]) assert.throws(() => fn(other.id), /introuvable/);
    assert.deepEqual(sms.listSmsCampaigns(w.S1, {}).rows.map((r) => r.name).sort(), ["Site 1", "Équipe pour S1"], "les campagnes du site 1 (créées par l'accès limité ou par l'équipe), jamais celles de l'organisation ni du site 2");
    assert.deepEqual(sms.listSmsCampaigns(w.A, {}).rows.map((r) => r.name).sort(), ["Organisation", "Site 1", "Site 2", "Équipe pour S1"]);
    assert.equal(sms.duplicateSmsCampaign(w.S1, own.id).site_id, 1, "la copie reste dans le site");
  });
  test("destinataires : cible recoupée avec les contacts LISIBLES du site (un contact d'un autre site présent dans la liste est exclu) ; campagne d'organisation inchangée ; rattachement accepté inclus", () => {
    const w = world();
    const c = sms.createSmsCampaign(w.S1, { name: "Bornée", targetType: "list", targetId: w.list1.id, body: "Bonjour {{prenom}}" });
    const check = sms.smsPreflight(w.S1, c.id, { workerOn: true });
    assert.equal(check.audience.sendable, 2, "a1 et a2 seulement (b1 est du site 2)");
    sms.startSmsCampaign(w.S1, c.id, { workerOn: true, now: NOON });
    assert.deepEqual(rows(w.db, "SELECT contact_id FROM mk_sms_messages WHERE campaign_id = ? ORDER BY contact_id", c.id).map((r) => r.contact_id), [w.a1.id, w.a2.id].sort((x, y) => x - y));
    // un contact rattaché (demande acceptée, R7-5) devient joignable par le site
    w.db.prepare("INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, 1, 1, 'activity')").run(w.b1.id);
    const c2 = sms.createSmsCampaign(w.S1, { name: "Après rattachement", targetType: "list", targetId: w.list1.id, body: "Salut" });
    assert.equal(sms.smsPreflight(w.S1, c2.id, { workerOn: true }).audience.sendable, 3);
    // campagne d'organisation (équipe) : tous les abonnés, comportement historique
    const o = sms.createSmsCampaign(w.A, { name: "Organisation", body: "Salut" });
    assert.equal(sms.smsPreflight(w.A, o.id, { workerOn: true }).audience.sendable, 4);
    // équipe pour un site avec « tous » = tous les abonnés DE CE SITE
    const t = sms.createSmsCampaign(w.A, { name: "Tous du site 1", siteId: 1, body: "Salut" });
    assert.equal(sms.smsPreflight(w.A, t.id, { workerOn: true }).audience.sendable, 3);
  });
  test("prix confidentiel : l'accès limité voit le nombre de segments, jamais le prix, le coût ni la devise (estimation, contrôle, campagne, rapport, réglages) ; l'équipe voit tout", async () => {
    const w = world();
    const c = sms.createSmsCampaign(w.S1, { name: "Prix", targetType: "list", targetId: w.list1.id, body: "Bonjour" });
    const lim = sms.estimateSmsCampaign(w.S1, c.id), team = sms.estimateSmsCampaign(w.A, c.id);
    assert.ok(lim.segments > 0 && lim.segments === team.segments, "segments visibles");
    assert.deepEqual([lim.cost, lim.price, lim.currency], [null, null, ""]);
    assert.ok(team.cost > 0 && team.price === 0.05 && team.currency === "USD");
    const pf = sms.smsPreflight(w.S1, c.id, { workerOn: true });
    assert.equal(JSON.stringify(pf).includes("0.05"), false); assert.ok(!pf.config.accountSid && pf.config.pricePerSegment === "" && pf.config.currency === "");
    assert.equal(pf.warnings.some((x) => x.key === "price"), false);
    sms.startSmsCampaign(w.S1, c.id, { workerOn: true, now: NOON });
    assert.deepEqual([sms.getSmsCampaign(w.S1, c.id).price_per_segment, sms.getSmsCampaign(w.S1, c.id).currency], ["", ""]);
    assert.equal(sms.getSmsCampaign(w.A, c.id).price_per_segment, "0.05", "figé à l'envoi, visible de l'équipe");
    const provider = fakeProvider();
    await sms.dispatchSmsBatch(w.A, c.id, { provider, now: NOON });
    const rl = sms.smsCampaignReport(w.S1, c.id), rt = sms.smsCampaignReport(w.A, c.id);
    assert.equal(rl.cost, null); assert.ok(rt.cost > 0); assert.equal(rl.campaign.segments_count, rt.campaign.segments_count); assert.ok(rl.campaign.segments_count > 0);
    assert.equal(JSON.stringify(rl).includes("0.05"), false);
  });
  test("STOP commun à l'organisation : un STOP reçu par une campagne du site 1 bloque le numéro pour une campagne du site 2 ; le changement de site ou de module ne le contourne pas", async () => {
    const w = world();
    modules.setEnabled(w.A, 2, "sms", true);
    sms.addSmsSuppression({ ...w.A, audit: false }, { phone: w.b1.sms_phone, reason: "stop", note: "STOP reçu via le site 1", source: "provider" });
    const c2 = sms.createSmsCampaign(w.S2, { name: "Site 2", targetType: "list", targetId: w.list2.id, body: "Salut" });
    assert.equal(sms.smsPreflight(w.S2, c2.id, { workerOn: true }).audience.sendable, 0, "le numéro bloqué n'est joignable par aucun site");
    modules.setEnabled(w.A, 2, "sms", false); modules.setEnabled(w.A, 2, "sms", true);
    assert.equal(sms.smsPreflight(w.S2, c2.id, { workerOn: true }).audience.sendable, 0);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_sms_suppressions")[0].n, 1);
  });
  test("arrière-plan : si le module est désactivé après le lancement, la tâche met la campagne en pause AVANT tout envoi ; réactivé, la reprise envoie ; un destinataire non rattaché est ignoré", async () => {
    const w = world();
    const c = sms.createSmsCampaign(w.S1, { name: "Async", targetType: "list", targetId: w.list1.id, body: "Salut" });
    sms.startSmsCampaign(w.S1, c.id, { workerOn: true, now: NOON });
    modules.setEnabled(w.A, 1, "sms", false);
    const provider = fakeProvider();
    const handlers = sms.smsJobHandlers({ db: w.db, providerFor: () => provider, now: () => NOON, settings: w.A.settings });
    await handlers["sms.dispatch"]({ organizationId: 1, campaignId: c.id });
    assert.equal(provider.sent.length, 0, "rien n'a été envoyé");
    const paused = rows(w.db, "SELECT status, error FROM mk_sms_campaigns WHERE id = ?", c.id)[0]; assert.equal(paused.status, "paused"); assert.match(paused.error, /module SMS/);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM mk_sms_messages WHERE campaign_id = ? AND status = 'queued'", c.id)[0].n, 2, "messages conservés");
    modules.setEnabled(w.A, 1, "sms", true);
    w.db.prepare("DELETE FROM mk_contact_sites WHERE contact_id = ? AND site_id = 1").run(w.a2.id); // le destinataire n'est plus rattaché au site
    sms.resumeSmsCampaign(w.S1, c.id, { now: NOON });
    await handlers["sms.dispatch"]({ organizationId: 1, campaignId: c.id });
    assert.deepEqual(provider.sent.map((m) => m.to), [w.a1.sms_phone], "seul le destinataire rattaché reçoit le SMS");
    assert.equal(rows(w.db, "SELECT reason FROM mk_sms_messages WHERE contact_id = ? AND campaign_id = ?", w.a2.id, c.id)[0].reason, "out_of_scope");
  });
  test("désactiver le module conserve campagnes, messages et rapports : l'équipe les lit toujours, l'accès limité n'y accède plus", () => {
    const w = world();
    const c = sms.createSmsCampaign(w.S1, { name: "Gardée", targetType: "list", targetId: w.list1.id, body: "Salut" });
    sms.startSmsCampaign(w.S1, c.id, { workerOn: true, now: NOON });
    const snap = () => JSON.stringify({ c: rows(w.db, "SELECT * FROM mk_sms_campaigns"), m: rows(w.db, "SELECT * FROM mk_sms_messages") });
    const before = snap(); modules.setEnabled(w.A, 1, "sms", false);
    assert.equal(snap(), before); assert.throws(() => sms.getSmsCampaign(w.S1, c.id), /pas activé/);
    assert.equal(sms.getSmsCampaign(w.A, c.id).name, "Gardée"); assert.equal(sms.smsRecipients(w.A, c.id).length, 2);
  });
});

describe("de bout en bout (serveur réel) : routes ouvertes aux sites, garde commune, prix masqué, rôles", () => {
  let srv, db, boss, A, B, adminA, editorA, adminB, readerA, ipN = 0;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const count = (sql, ...a) => one(sql, ...a).n;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const S = "/marketing/sms";
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Lecteur contacts", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Lecteur contacts'").key);
    await boss.post("/marketing/sms/reglages", { provider: "console", sender: "KOLAKISA", price_per_segment: "0.0731", currency: "USD" });
    db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body, site_id) VALUES (1, 'CAMPAGNE-ORG-SECRETE', 'texte', NULL), (1, 'CAMPAGNE-BRAVO', 'texte', ?)").run(B);
  });
  after(() => { db.close(); return srv.stop(); });
  const campOf = (name) => one("SELECT id FROM mk_sms_campaigns WHERE name = ?", name).id;

  test("module désactivé : l'écran SMS du site est refusé (garde commune) à l'administrateur, à l'éditeur et à tout rôle ; l'équipe garde son accès", async () => {
    for (const c of [adminA, editorA, readerA]) for (const p of [S, `${S}/abonnes`, `${S}/campagnes/${campOf("CAMPAGNE-BRAVO")}`]) {
      const r = await c.get(`${p}${p.includes("?") ? "&" : "?"}site=${A}`); assert.ok([403, 404].includes(r.status), `${p} ${r.status}`); assert.doesNotMatch(r.text, /CAMPAGNE-/);
    }
    assert.equal((await boss.get(S)).status, 200);
  });
  test("module activé pour le site A : l'administrateur et l'éditeur ouvrent le SMS de leur site ; le rôle sans droit de campagne (lecture des contacts seulement), l'administrateur de B et les campagnes d'autres sites restent refusés", async () => {
    assert.equal((await boss.post(`${M(A)}/sms`, { etat: "activer" })).status, 302);
    for (const c of [adminA, editorA]) { const r = await c.get(`${S}?site=${A}`); assert.equal(r.status, 200); assert.doesNotMatch(r.text, /CAMPAGNE-ORG-SECRETE|CAMPAGNE-BRAVO/); }
    const rr = await readerA.get(`${S}?site=${A}`); assert.equal(rr.status, 403, "rôle sans campaigns.read");
    assert.equal((await adminB.get(`${S}?site=${A}`)).status, 403, "administrateur d'un autre site");
    assert.equal((await adminB.get(`${S}?site=${B}`)).status, 403, "module non activé pour B");
    for (const name of ["CAMPAGNE-ORG-SECRETE", "CAMPAGNE-BRAVO"]) {
      const id = campOf(name);
      for (const [method, p, body] of [["get", `${S}/campagnes/${id}?site=${A}`], ["post", `${S}/campagnes/${id}?site=${A}`, { name: "PIRATE", site: A }], ["post", `${S}/campagnes/${id}/lancer?site=${A}`, { confirm_count: "1", confirm_cost: "on", site: A }], ["post", `${S}/campagnes/${id}/supprimer?site=${A}`, { site: A }], ["post", `${S}/campagnes/${id}/annuler?site=${A}`, { site: A }]]) {
        const r = await adminA[method](p, body); assert.ok([403, 404, 302].includes(r.status), `${method} ${p} ${r.status}`); assert.doesNotMatch(r.text, /CAMPAGNE-(ORG|BRAVO)/);
      }
      assert.equal(one("SELECT name n FROM mk_sms_campaigns WHERE id = ?", id).n, name);
    }
  });
  test("création et modification : la campagne prend le site A même si le corps de la requête désigne B ; « tous les abonnés » refusé ; liste d'un autre site refusée ; réglages, test et blocages (organisation) fermés", async () => {
    const r = await adminA.post(`${S}/campagnes?site=${A}`, { name: "Campagne Alpha", site: B, site_id: B }); assert.equal(r.status, 302);
    const c = one("SELECT id, site_id s FROM mk_sms_campaigns WHERE name = 'Campagne Alpha'"); assert.equal(c.s, A);
    const listB = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste Bravo', ?)").run(B).lastInsertRowid);
    const listA = Number(db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste Alpha', ?)").run(A).lastInsertRowid);
    for (const target of ["all", `list:${listB}`]) { await adminA.post(`${S}/campagnes/${c.id}?site=${A}`, { name: "Campagne Alpha", body: "Bonjour", target, site: A }); assert.equal(one("SELECT target_type t FROM mk_sms_campaigns WHERE id = ?", c.id).t, "all", `cible ${target} refusée`); }
    await adminA.post(`${S}/campagnes/${c.id}?site=${A}`, { name: "Campagne Alpha", body: "Bonjour", target: `list:${listA}`, site: A });
    assert.deepEqual({ ...one("SELECT target_type t, target_id i FROM mk_sms_campaigns WHERE id = ?", c.id) }, { t: "list", i: listA });
    const page = await adminA.get(`${S}/campagnes/${c.id}?site=${A}`); assert.equal(page.status, 200);
    assert.doesNotMatch(page.text, /Tous les abonnés SMS/, "option réservée à l'équipe absente");
    for (const p of ["/reglages", "/blocages"]) for (const m of ["get", "post"]) { const x = await adminA[m](`${S}${p}?site=${A}`, { site: A }); assert.ok([302, 403, 404].includes(x.status), `${m} ${p} ${x.status}`); }
    assert.ok([302, 403, 404].includes((await adminA.post(`${S}/test?site=${A}`, { site: A })).status));
  });
  test("prix : la page de la campagne montre le nombre de SMS facturés aux administrateurs de site, jamais le prix (0,0731), la devise, le coût ni le fournisseur ; l'équipe voit le coût", async () => {
    const c = one("SELECT id FROM mk_sms_campaigns WHERE name = 'Campagne Alpha'").id;
    const contact = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, sms_status, sms_phone, origin_site_id) VALUES (1, 'abonne.alpha@ex.cd', 'Ana', 'subscribed', '+243812345678', ?)").run(A).lastInsertRowid);
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, channel_address) VALUES (1, ?, 'sms', 'granted', 'form', 'preuve valable', '+243812345678')").run(contact);
    const listA = one("SELECT id FROM mk_lists WHERE name = 'Liste Alpha'").id;
    db.prepare("INSERT OR IGNORE INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(listA, contact);
    // (le menu latéral commun liste encore « Réglages SMS » à qui a settings.read : lien mort pour un accès limité, repris avec les menus en R8 ; on contrôle donc le CONTENU de la page)
    const content = (html) => html.slice(html.indexOf("mk-back"));
    const lim = content((await adminA.get(`${S}/campagnes/${c}?site=${A}`)).text);
    assert.match(lim, /SMS facturés \(segments\)/); assert.doesNotMatch(lim, /0[,.]0731|USD|Coût estimé|Twilio|Mode essai|Réglages SMS/);
    const team = (await boss.get(`${S}/campagnes/${c}`)).text; assert.match(team, /Coût estimé/); assert.match(team, /0[,.]0731|USD/);
    const listing = content((await adminA.get(`${S}?site=${A}`)).text); assert.doesNotMatch(listing, /Twilio|Mode essai|Réglages SMS|0[,.]0731/);
  });
  test("abonnés : un accès limité ne voit que les abonnés lisibles par son site ; le nombre de numéros bloqués (STOP, commun) n'est pas communiqué ; aucune API SMS", async () => {
    db.prepare("INSERT INTO mk_contacts (organization_id, email, sms_status, sms_phone, origin_site_id) VALUES (1, 'abonne.bravo@ex.cd', 'subscribed', '+243812345679', ?)").run(B);
    db.prepare("INSERT INTO mk_sms_suppressions (organization_id, phone, reason) VALUES (1, '+243800000001', 'stop')").run();
    const t = (await adminA.get(`${S}/abonnes?site=${A}`)).text;
    assert.match(t, /abonne\.alpha@ex\.cd/); assert.doesNotMatch(t, /abonne\.bravo@ex\.cd/);
    assert.match(t, /Numéros bloqués<\/span><span class="mk-stat-value">0</, "taille de la liste STOP (commune) non communiquée à un site");
    const teamPage = (await boss.get(`${S}/abonnes`)).text;
    assert.match(teamPage, /abonne\.bravo@ex\.cd/); assert.match(teamPage, /Numéros bloqués<\/span><span class="mk-stat-value">1</, "l'équipe voit la taille de la liste STOP");
    const api = await new Client(srv.base).request("/api/v1/sms", { headers: { authorization: "Bearer mk_live_" + "0".repeat(48) } });
    assert.ok([401, 404].includes(api.status), "aucune API SMS exposée");
  });
  test("module désactivé après usage : les données restent (équipe), l'accès limité est refusé ; historique : les campagnes de l'organisation restent intactes", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_sms_campaigns");
    assert.equal((await boss.post(`${M(A)}/sms`, { etat: "desactiver" })).status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_sms_campaigns"), before);
    assert.equal((await adminA.get(`${S}?site=${A}`)).status, 403);
    const team = (await boss.get(S)).text; assert.match(team, /CAMPAGNE-ORG-SECRETE/); assert.match(team, /Campagne Alpha/);
  });
});
