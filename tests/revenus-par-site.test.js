// R7 (lot 6.5) — Revenus des e-mails multisite : migration 089 (colonne de l'attribution, reprise sans rien deviner), revenu attribué aux e-mails DU site, vue globale de l'équipe inchangée,
// ventes totales et réglages réservés à l'équipe, module requis, parcours HTTP réels.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, addLmsSchema, TEST_KEY, MIGRATIONS, quiet, T0 } = require("./marketing-helpers");
const core = require("../src/marketing/contactcore");
const revenue = require("../src/marketing/revenue");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const DAY = 86_400_000;
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };

describe("migration 089 : une colonne, montants et commandes intacts, reprise sans rien deviner", () => {
  test("le site vient de la campagne cliquée (à défaut de l'automatisation) quand elle en portait déjà un ; sinon NULL ; déclencheurs ; rejouée : rien", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig89-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "089") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'S3', 's3', '{}')");
      const camp = (site) => Number(db.prepare("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status) VALUES (1, ?, '', 'list', 1, 'sent')").run(`C${Math.random()}`).lastInsertRowid) && Number(db.prepare("SELECT MAX(id) m FROM mk_campaigns").get().m);
      const c1 = camp(), c2 = camp(), c3 = camp();
      db.exec(`UPDATE mk_campaigns SET site_id = 1 WHERE id = ${c1}; UPDATE mk_campaigns SET site_id = 2 WHERE id = ${c3}`);
      db.exec("INSERT INTO mk_automations (organization_id, name, trigger_event, steps, site_id) VALUES (1, 'Auto S2', 'contact.created', '[]', 2)");
      const attr = (order, campaignId, automationId, cents) => db.prepare("INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, campaign_id, automation_id, amount_cents, ordered_at, clicked_at, created_at) VALUES (1, ?, 1, ?, ?, ?, 1, 1, 1)").run(order, campaignId, automationId, cents);
      attr(1, c1, null, 4900); attr(2, c2, null, 1999); attr(3, c2, 1, 700); attr(4, null, null, 333); attr(5, 9999, null, 10);
      const before = rows(db, "SELECT id, order_id, amount_cents, campaign_id, automation_id FROM mk_order_attributions ORDER BY id");
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "089"), ["089"]);
      assert.deepEqual(rows(db, "SELECT id, order_id, amount_cents, campaign_id, automation_id FROM mk_order_attributions ORDER BY id"), before, "montants et références intacts");
      assert.deepEqual(rows(db, "SELECT site_id FROM mk_order_attributions ORDER BY id").map((r) => r.site_id), [1, null, 2, null, null], "campagne du site 1 → 1 ; campagne sans site → NULL ; sans site de campagne → site de l'automatisation ; sans campagne ou campagne inconnue → NULL");
      assert.throws(() => db.prepare("UPDATE mk_order_attributions SET site_id = NULL WHERE id = 1").run(), /ne change jamais/);
      assert.throws(() => db.prepare("INSERT INTO mk_order_attributions (organization_id, order_id, amount_cents, ordered_at, clicked_at, created_at, site_id) VALUES (1, 77, 1, 1, 1, 1, 3)").run(), /même organisation/);
      assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service : revenu attribué au site de l'e-mail, vue globale de l'équipe inchangée, ventes totales et réglages à l'équipe (base synthétique)", () => {
  const world = () => {
    const m = freshMarketing(); addLmsSchema(m.db);
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    const A = m.ctx(1, { now: () => T0 + 10 * DAY });
    const mk = (email, siteId) => core.identify(A, { email, ...(siteId ? { siteId } : {}) }).contact;
    const c1 = mk("c1@x.fr", 1), c2 = mk("c2@x.fr", 2), org = mk("org@x.fr"), outside = mk("hors@x.fr", 2);
    let n = 0;
    // Envoie un e-mail (campagne du site `siteId`) et enregistre le clic humain du contact
    const click = (contact, siteId, at = T0 + DAY, { automation = false } = {}) => {
      const camp = Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status, site_id) VALUES (1, ?, '', 'list', 1, 'sent', ?)").run(`Campagne ${++n}`, siteId ?? null).lastInsertRowid);
      const msg = Number(m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email) VALUES (1, ?, ?, ?)").run(camp, contact.id, contact.email).lastInsertRowid);
      m.db.prepare("INSERT INTO mk_message_events (organization_id, message_id, campaign_id, type, bot, occurred_at) VALUES (1, ?, ?, 'clicked', 0, ?)").run(msg, camp, at);
      return camp;
    };
    return { ...m, A, S1: { ...A, siteScope: 1 }, S2: { ...A, siteScope: 2 }, c1, c2, org, outside, click };
  };
  const order = (w, contact, id, cents) => revenue.attributeOrder(w.A, { orderId: id, contactId: contact.id, amountCents: cents, orderedAt: T0 + 2 * DAY });

  test("attribution : le site est celui de la campagne cliquée (relu en base), jamais une valeur de requête ; montants, fenêtre et règles inchangés ; campagne sans site → NULL", () => {
    const w = world();
    w.click(w.c1, 1); const a = order(w, w.c1, 501, 4900);
    assert.deepEqual([a.amount_cents, a.site_id, a.order_id], [4900, 1, 501]);
    w.click(w.org, null); assert.equal(order(w, w.org, 502, 1999).site_id, null);
    assert.equal(order(w, w.c2, 503, 1000), null, "aucun clic : aucune attribution (règle historique)");
    assert.equal(order(w, w.c1, 501, 4900), null, "une commande n'est attribuée qu'une fois");
    assert.equal(revenue.attributeOrder({ ...w.S2, siteScope: 2 }, { orderId: 504, contactId: w.c1.id, amountCents: 100, orderedAt: T0 + 2 * DAY }).site_id, 1, "un contexte qui prétend être un autre site n'y change rien : le site vient de la campagne cliquée")
  });
  test("vue de l'équipe : tous les revenus, ventes totales et part, acheteurs ; identique à avant R7-6.5", () => {
    const w = world();
    w.click(w.c1, 1); order(w, w.c1, 1, 4900); w.click(w.c2, 2); order(w, w.c2, 2, 1250); w.click(w.org, null); order(w, w.org, 3, 777);
    w.db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (1, 10000)").run();
    const o = revenue.revenueOverview(w.A, { days: 30 });
    assert.deepEqual([o.totals.cents, o.totals.orders, o.totals.buyers], [6927, 3, 3]);
    assert.equal(o.recent.length, 3); assert.ok(o.recent.every((r) => r.email));
    assert.equal(o.byCampaign.reduce((n, r) => n + r.cents, 0), 6927);
  });
  test("accès limité : seulement les revenus attribués à SON site, module « commerce » requis, ventes totales masquées, acheteurs hors périmètre masqués ; autre site et organisation invisibles", () => {
    const w = world();
    w.click(w.c1, 1); order(w, w.c1, 1, 4900); w.click(w.c1, 1, T0 + DAY + 1); /* deuxième clic : même commande déjà attribuée */
    w.click(w.outside, 2); order(w, w.outside, 2, 1250);
    w.click(w.c2, 2); order(w, w.c2, 3, 800); w.click(w.org, null); order(w, w.org, 4, 777);
    w.db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (1, 99999)").run();
    assert.equal(code(() => revenue.revenueOverview(w.S1, {})), "module_disabled");
    modules.setEnabled(w.A, 1, "commerce", true); modules.setEnabled(w.A, 2, "commerce", true);
    const o1 = revenue.revenueOverview(w.S1, { days: 30 });
    assert.deepEqual([o1.totals.cents, o1.totals.orders], [4900, 1]); assert.equal(o1.sales, null); assert.equal(o1.share, null);
    assert.deepEqual(o1.byCampaign.map((r) => r.cents), [4900]);
    assert.ok(o1.recent.every((r) => r.hidden !== true) && o1.recent[0].email === "c1@x.fr");
    const o2 = revenue.revenueOverview(w.S2, { days: 30 });
    assert.deepEqual([o2.totals.cents, o2.totals.orders], [2050, 2], "site 2 : ses deux commandes attribuées, pas celles du site 1 ni de l'organisation");
    assert.deepEqual(o2.recent.map((r) => [r.amount_cents, Boolean(r.hidden), r.email]).sort(), [[800, false, "c2@x.fr"], [1250, false, "hors@x.fr"]].sort(), "contacts du site 2 : lisibles");
    w.db.prepare("DELETE FROM mk_contact_sites WHERE contact_id = ? AND site_id = 2").run(w.outside.id);
    const o2b = revenue.revenueOverview(w.S2, { days: 30 });
    assert.equal(o2b.totals.cents, 2050, "le total (agrégat de l'e-mail du site) ne change pas"); const hidden = o2b.recent.find((r) => r.amount_cents === 1250);
    assert.deepEqual([hidden.hidden, hidden.email], [true, null], "acheteur hors du périmètre de contacts : identité masquée, montant conservé");
    assert.equal(code(() => revenue.revenueOverview({ ...w.A, siteScope: -1 }, {})), "module_disabled", "site imposé invalide");
    assert.equal(revenue.revenueOverview(w.A, { days: 30 }).totals.cents, 4900 + 1250 + 800 + 777, "vue de l'équipe inchangée");
  });
  test("par automatisation : un site ne voit que les revenus de SES automatisations (le site de l'attribution suit celui de l'automatisation)", () => {
    const w = world(); modules.setEnabled(w.A, 1, "commerce", true);
    const au = (name, site) => Number(w.db.prepare("INSERT INTO mk_automations (organization_id, name, trigger_event, steps, site_id) VALUES (1, ?, 'contact.created', '[]', ?)").run(name, site).lastInsertRowid);
    const a1 = au("AUTO-SITE-1", 1), a2 = au("AUTO-SITE-2", 2), a0 = au("AUTO-ORG", null);
    let i = 0;
    for (const [id, site, cents] of [[a1, 1, 300], [a2, 2, 500], [a0, null, 900]]) w.db.prepare("INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, automation_id, amount_cents, ordered_at, clicked_at, created_at, site_id) VALUES (1, ?, ?, ?, ?, ?, ?, 1, ?)").run(800 + ++i, w.c1.id, id, cents, T0 + 5 * DAY, T0 + 5 * DAY, site);
    const o = revenue.revenueOverview(w.S1, { days: 30 });
    assert.deepEqual(o.byAutomation.map((r) => [r.name, r.cents]), [["AUTO-SITE-1", 300]]); assert.equal(o.totals.cents, 300);
    assert.equal(revenue.revenueOverview(w.A, { days: 30 }).byAutomation.length, 3, "l'équipe voit les trois");
  });
  test("fenêtre d'attribution : réglage réservé à l'équipe ; module désactivé ensuite : données conservées, équipe inchangée", () => {
    const w = world(); modules.setEnabled(w.A, 1, "commerce", true);
    assert.equal(code(() => revenue.setWindowDays(w.S1, 3)), "forbidden"); assert.equal(revenue.getWindowDays(w.A), 7);
    assert.equal(revenue.setWindowDays(w.A, 3), 3);
    w.click(w.c1, 1); order(w, w.c1, 1, 4900); const before = JSON.stringify(rows(w.db, "SELECT * FROM mk_order_attributions"));
    modules.setEnabled(w.A, 1, "commerce", false);
    assert.equal(JSON.stringify(rows(w.db, "SELECT * FROM mk_order_attributions")), before);
    assert.equal(code(() => revenue.revenueOverview(w.S1, {})), "module_disabled");
    assert.equal(revenue.revenueOverview(w.A, { days: 30 }).totals.cents, 4900);
  });
});

describe("de bout en bout (serveur réel) : écran des revenus ouvert aux sites en lecture seule, isolation, rôles", () => {
  let srv, db, boss, A, B, adminA, editorA, adminB, readerA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const S = "/marketing/revenus";
  let n = 0;
  const contact = (email, site) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, ?, ?)").run(email, site).lastInsertRowid);
  const campaign = (name, site) => Number(db.prepare("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status, site_id) VALUES (1, ?, '', 'list', 1, 'sent', ?)").run(name, site).lastInsertRowid);
  const attr = (contactId, campaignId, site, cents) => db.prepare("INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, campaign_id, amount_cents, ordered_at, clicked_at, created_at, site_id) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)").run(5000 + ++n, contactId, campaignId, cents, Date.now() - DAY, Date.now() - DAY, Date.now(), site);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    const ca = contact("acheteur.alpha@ex.cd", A), cb = contact("acheteur.bravo@ex.cd", B), co = contact("acheteur.org@ex.cd", null);
    attr(ca, campaign("CAMPAGNE-ALPHA", A), A, 12345); attr(cb, campaign("CAMPAGNE-BRAVO", B), B, 22222); attr(co, campaign("CAMPAGNE-ORG", null), null, 33333);
    attr(co, campaign("CAMPAGNE-ALPHA-2", A), A, 5555);   // acheteur sans site, attribué à une campagne d'Alpha : montant visible, identité masquée
    db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (1, 987654)").run();
  });
  after(() => { db.close(); return srv.stop(); });

  test("module désactivé : l'écran du site est refusé à l'administrateur, à l'éditeur et à tout rôle ; l'équipe garde la vue globale", async () => {
    for (const c of [adminA, editorA, readerA]) { const r = await c.get(`${S}?site=${A}`); assert.ok([403, 404].includes(r.status), `${r.status}`); assert.doesNotMatch(r.text, /CAMPAGNE-|123[,.]45/); }
    const team = (await boss.get(S)).text; for (const s of ["CAMPAGNE-ALPHA", "CAMPAGNE-BRAVO", "CAMPAGNE-ORG"]) assert.match(team, new RegExp(s));
    assert.match(team, /Part des ventes du site/);
  });
  test("module activé : l'administrateur et l'éditeur voient les revenus attribués aux e-mails DE LEUR SITE seulement, sans ventes totales ni réglage ; le rôle sans droit d'analyse reste refusé", async () => {
    assert.equal((await boss.post(`${M(A)}/commerce`, { etat: "activer" })).status, 302);
    for (const c of [adminA, editorA]) {
      const r = await c.get(`${S}?site=${A}`); assert.equal(r.status, 200);
      assert.match(r.text, /CAMPAGNE-ALPHA/); assert.match(r.text, /123[,.]45/); assert.match(r.text, /\(hors de votre périmètre\)/);
      assert.doesNotMatch(r.text, /CAMPAGNE-BRAVO|CAMPAGNE-ORG|222[,.]22|333[,.]33|9\s?876[,.]54|Part des ventes du site|name="days"|acheteur\.(bravo|org)/);
    }
    assert.equal((await readerA.get(`${S}?site=${A}`)).status, 403, "rôle sans analytics.read");
  });
  test("réglage : la fenêtre d'attribution reste à l'équipe (même avec un site falsifié) ; rien ne change", async () => {
    const win = () => db.prepare("SELECT value FROM mk_settings WHERE key = 'revenue.window_days'").get();
    const before = JSON.stringify(win() ?? null);
    for (const c of [adminA, editorA]) for (const q of ["", `?site=${A}`, `?site=${B}`]) { const r = await c.post(`${S}/fenetre${q}`, { days: "30", site: A }); assert.ok([302, 403, 404].includes(r.status), `${q} ${r.status}`); }
    assert.equal(JSON.stringify(win() ?? null), before);
    assert.equal((await boss.post(`${S}/fenetre`, { days: "9" })).status, 302); assert.equal(win().value, "9", "l'équipe règle toujours la fenêtre");
  });
  test("isolation : l'administrateur de B ne voit jamais les revenus d'Alpha ni de l'organisation ; paramètres de site falsifiés refusés ; aucune API de revenus", async () => {
    assert.equal((await adminB.get(`${S}?site=${B}`)).status, 403, "module non activé pour B");
    assert.equal((await adminB.get(`${S}?site=${A}`)).status, 403);
    assert.equal((await boss.post(`${M(B)}/commerce`, { etat: "activer" })).status, 302);
    const b = await adminB.get(`${S}?site=${B}`); assert.equal(b.status, 200);
    assert.match(b.text, /CAMPAGNE-BRAVO/); assert.match(b.text, /222[,.]22/); assert.doesNotMatch(b.text, /CAMPAGNE-ALPHA|CAMPAGNE-ORG|123[,.]45|333[,.]33/);
    assert.equal((await adminA.get(`${S}?site=${B}`)).status, 403);
    for (const q of ["?site=abc", "?site=-1", `?site=${A}&site=${B}`, ""]) { const r = await adminA.get(`${S}${q}`); assert.ok([302, 403, 404].includes(r.status) || (r.status === 200 && !/CAMPAGNE-(BRAVO|ORG)|222[,.]22|333[,.]33/.test(r.text)), `${q} ${r.status}`); }
    const api = await boss.request("/api/v1/revenus"); assert.ok([401, 404].includes(api.status));
  });
  test("module désactivé après usage : attributions conservées, équipe inchangée, accès du site refusé", async () => {
    const before = one("SELECT COUNT(*) n, SUM(amount_cents) s FROM mk_order_attributions");
    assert.equal((await boss.post(`${M(A)}/commerce`, { etat: "desactiver" })).status, 302);
    assert.deepEqual({ ...one("SELECT COUNT(*) n, SUM(amount_cents) s FROM mk_order_attributions") }, { ...before });
    assert.equal((await adminA.get(`${S}?site=${A}`)).status, 403);
    assert.match((await boss.get(S)).text, /CAMPAGNE-ALPHA/);
  });
});
