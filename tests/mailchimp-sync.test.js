// Synchronisation Mailchimp ↔ Kolakisa (logique, sans navigateur) : miroirs, import des membres avec preuve de consentement, règle « le plus restrictif gagne »,
// envoi vers Mailchimp, incrémental, idempotence, isolation entre organisations, webhooks entrants, opérations composées, Transactionnel.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");
const connection = require("../src/marketing/mailchimp/connection");
const sync = require("../src/marketing/mailchimp/sync");
const inbound = require("../src/marketing/mailchimp/inbound");
const composite = require("../src/marketing/mailchimp/composite");
const transactional = require("../src/marketing/mailchimp/transactional");
const contacts = require("../src/marketing/audience/contacts");
const consent = require("../src/marketing/compliance/consent");
const lists = require("../src/marketing/audience/lists");

describe("synchronisation Mailchimp", () => {
  let fake, m, ctx, ctxB, listId, remote;
  const quick = { sleep: async () => {} };
  const one = (sql, ...a) => m.db.prepare(sql).get(...a);
  const all = (sql, ...a) => m.db.prepare(sql).all(...a);
  const form = (obj) => { const p = new URLSearchParams(); const walk = (o, pre) => { for (const [k, v] of Object.entries(o)) { const key = pre ? `${pre}[${k}]` : k; if (v && typeof v === "object") walk(v, key); else p.append(key, String(v)); } }; walk(obj, ""); return p.toString(); };
  const consentedContact = (c, email, extra = {}) => { const { contact } = contacts.upsertContact(c, { email, source: "form", ...extra }); consent.recordConsent(c, contact.id, { source: "form", textShown: "Je m'inscris à la lettre." }); return contacts.getContact(c, contact.id); };

  before(async () => { process.env.ENCRYPTION_KEY = TEST_KEY; fake = await createFakeMailchimp(); });
  after(() => fake.close());
  beforeEach(async () => {
    m = freshMarketing();
    ctx = { ...m.A, env: { MAILCHIMP_API_BASE: fake.base }, mailchimp: quick };
    ctxB = { ...m.B, env: { MAILCHIMP_API_BASE: fake.base }, mailchimp: quick };
    fake.state.lists.clear(); fake.state.members.clear(); fake.state.campaigns.clear(); fake.state.reports.clear(); fake.state.webhooks.clear(); fake.reset();
    remote = fake.addList("Newsletter");
    await connection.connect(ctx, fake.key);
    await sync.syncAll(ctx);
    listId = lists.createList(ctx, { name: "Abonnés" }).id;
  });

  describe("connexion", () => {
    test("clé validée en direct, chiffrée au repos, jamais renvoyée ; jeton de webhook créé", () => {
      const row = one("SELECT value, is_secret FROM mk_settings WHERE organization_id = 1 AND key = 'mailchimp.api_key'");
      assert.equal(row.is_secret, 1);
      assert.match(row.value, /^v1:/);
      assert.ok(!row.value.includes("0123456789abcdef"));
      const st = connection.status(ctx);
      assert.equal(st.connected, true);
      assert.equal(st.account.name, "Société Démo");
      assert.equal(st.account.dc, "us21");
      assert.equal(JSON.stringify(st).includes("0123456789abcdef"), false);
      assert.equal(st.webhookTokenSet, true);
      assert.equal(JSON.stringify(st).includes(connection.webhookToken(ctx)), false);
    });
    test("clé refusée ou mal formée : rien n'est enregistré", async () => {
      await assert.rejects(connection.connect(ctxB, "pas-une-cle"), (e) => e.code === "key_format");
      await assert.rejects(connection.connect(ctxB, "ffffffffffffffffffffffffffffffff-us21"), (e) => e.code === "auth_invalid" && /refusée/.test(e.message));
      assert.equal(connection.status(ctxB).connected, false);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_settings WHERE organization_id = 2 AND key LIKE 'mailchimp.%'").n, 0);
    });
    test("la clé de l'organisation A est illisible depuis l'organisation B", () => {
      assert.throws(() => connection.clientFor(ctxB), (e) => e.code === "not_connected");
      const stored = one("SELECT value FROM mk_settings WHERE organization_id = 1 AND key = 'mailchimp.api_key'").value;
      m.db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (2, 'mailchimp.api_key', ?, 1)").run(stored);
      assert.throws(() => connection.secretKey(ctxB), /illisible/);
    });
    test("déconnexion : clé et jeton effacés, ancien jeton refusé", () => {
      const token = connection.webhookToken(ctx);
      assert.equal(connection.tokenMatches(ctx, token), true);
      connection.disconnect(ctx);
      assert.equal(connection.status(ctx).connected, false);
      assert.equal(connection.tokenMatches(ctx, token), false);
    });
    test("jeton : comparaison exacte, rotation invalide l'ancien", () => {
      const token = connection.webhookToken(ctx);
      assert.equal(connection.tokenMatches(ctx, token + "x"), false);
      assert.equal(connection.tokenMatches(ctx, ""), false);
      assert.equal(connection.tokenMatches(ctx, undefined), false);
      connection.rotateWebhookToken(ctx);
      assert.equal(connection.tokenMatches(ctx, token), false);
      assert.equal(connection.tokenMatches(ctx, connection.webhookToken(ctx)), true);
    });
    test("adresse du webhook : HTTPS obligatoire", () => {
      assert.equal(connection.webhookUrl(ctx, { SITE_URL: "http://k.test" }), null);
      assert.match(connection.webhookUrl(ctx, { SITE_URL: "https://k.test/" }), /^https:\/\/k\.test\/webhooks\/mailchimp\/1\/[0-9a-f]{48}$/);
    });
  });

  describe("audiences et campagnes (miroirs)", () => {
    test("les audiences sont lues avec leurs statistiques ; une audience supprimée chez Mailchimp disparaît", async () => {
      const second = fake.addList("Clients");
      fake.addMember(second.id, "x@exemple.fr");
      await sync.syncAll(ctx);
      const rows = all("SELECT remote_id, name, member_count FROM mk_mc_audiences WHERE organization_id = 1 ORDER BY name");
      assert.deepEqual(rows.map((r) => r.name), ["Clients", "Newsletter"]);
      assert.equal(rows.find((r) => r.name === "Clients").member_count, 1);
      fake.state.lists.delete(second.id);
      await sync.syncAll(ctx);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_audiences WHERE organization_id = 1").n, 1);
    });
    test("campagnes : statut et chiffres du rapport (envoyées dans les 7 derniers jours)", async () => {
      const c = fake.addCampaign({ recipients: { list_id: remote.id } });
      fake.setReport(c.id, { emails_sent: 200, opens: { unique_opens: 80, open_rate: 0.4 }, clicks: { unique_clicks: 20, click_rate: 0.1 }, bounces: { hard_bounces: 2, soft_bounces: 3 }, unsubscribed: 1, abuse_reports: 0, ecommerce: { total_revenue: 150.5 } });
      const r = await sync.syncAll(ctx);
      assert.equal(r.status, "ok");
      const row = one("SELECT * FROM mk_mc_campaigns WHERE remote_id = ?", c.id);
      assert.equal(row.status, "sent");
      assert.equal(row.title, "Campagne");
      const rep = JSON.parse(row.report);
      assert.equal(rep.emailsSent, 200); assert.equal(rep.openRate, 0.4); assert.equal(rep.revenue, 150.5); assert.equal(rep.hardBounces, 2);
    });
    test("un rapport introuvable n'interrompt pas la synchronisation", async () => {
      fake.addCampaign({});
      const r = await sync.syncAll(ctx);
      assert.equal(r.status, "ok");
    });
  });

  describe("liaison et import des membres (preuve de consentement)", () => {
    test("liaison : liste existante, ou création ; une liste ne se lie qu'à une audience", async () => {
      const other = fake.addList("Autre"); await sync.syncAll(ctx);
      assert.deepEqual(sync.linkAudience(ctx, remote.id, { localListId: listId }), { remoteId: remote.id, localListId: listId });
      assert.throws(() => sync.linkAudience(ctx, other.id, { localListId: listId }), (e) => e.code === "already_linked");
      const created = sync.linkAudience(ctx, other.id, { create: true });
      assert.ok(created.localListId > listId);
      assert.throws(() => sync.linkAudience(ctx, "inconnue", { create: true }), (e) => e.code === "not_found");
      assert.throws(() => sync.linkAudience(ctx, remote.id, { localListId: 9999 }), (e) => e.code === "not_found");
      assert.throws(() => sync.linkAudience(ctxB, remote.id, { create: true }), (e) => e.code === "not_found");
    });

    test("statuts Mailchimp → Kolakisa : subscribed (avec preuve), unsubscribed, cleaned, pending, archived", async () => {
      fake.addMember(remote.id, "ana@exemple.fr", "subscribed", { FNAME: "Ana", LNAME: "Diallo" }, ["client"]);
      fake.addMember(remote.id, "bob@exemple.fr", "unsubscribed");
      fake.addMember(remote.id, "carl@exemple.fr", "cleaned");
      fake.addMember(remote.id, "dan@exemple.fr", "pending");
      fake.addMember(remote.id, "eve@exemple.fr", "archived");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      const r = await sync.syncAll(ctx);
      assert.equal(r.status, "ok");
      const ana = contacts.findByEmail(ctx, "ana@exemple.fr");
      assert.equal(ana.status, "subscribed");
      assert.equal(ana.first_name, "Ana"); assert.equal(ana.source, "mailchimp");
      const proof = one("SELECT source, text_shown, action FROM mk_consents WHERE contact_id = ?", ana.id);
      assert.equal(proof.source, "mailchimp"); assert.match(proof.text_shown, /audience Mailchimp « Newsletter »/); assert.equal(proof.action, "granted");
      assert.equal(consent.isSendable(ctx, ana.id, { listId }).ok, true);
      assert.ok(one("SELECT 1 AS x FROM mk_list_members WHERE list_id = ? AND contact_id = ?", listId, ana.id));
      assert.deepEqual(all("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ?", ana.id).map((t) => t.name), ["client"]);
      assert.equal(contacts.findByEmail(ctx, "bob@exemple.fr").status, "unsubscribed");
      assert.ok(one("SELECT 1 AS x FROM mk_suppressions WHERE organization_id = 1 AND email = 'carl@exemple.fr' AND reason = 'bounced'"));
      const dan = contacts.findByEmail(ctx, "dan@exemple.fr");
      assert.equal(dan.status, "unknown"); assert.equal(consent.isSendable(ctx, dan.id).ok, false);
      assert.equal(contacts.findByEmail(ctx, "eve@exemple.fr"), null);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_members WHERE organization_id = 1").n, 3, "correspondance pour ana, bob, dan ; carl (cleaned) n'a pas de fiche : liste de suppression seulement");
    });

    test("audience NON liée : lue (effectif) mais aucun contact importé", async () => {
      fake.addMember(remote.id, "nolink@exemple.fr");
      await sync.syncAll(ctx);
      assert.equal(contacts.findByEmail(ctx, "nolink@exemple.fr"), null);
      assert.equal(one("SELECT member_count FROM mk_mc_audiences WHERE organization_id = 1").member_count, 1);
    });

    test("LE PLUS RESTRICTIF GAGNE : une personne désinscrite ou rebondie chez Kolakisa n'est JAMAIS réabonnée, son désabonnement est renvoyé à Mailchimp", async () => {
      const { contact: zoe } = contacts.upsertContact(ctx, { email: "zoe@exemple.fr", source: "form" });
      consent.recordConsent(ctx, zoe.id, { source: "form", textShown: "Inscription" });
      consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
      const { contact: max } = contacts.upsertContact(ctx, { email: "max@exemple.fr", source: "form" });
      m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'max@exemple.fr', 'complained')").run();
      m.db.prepare("UPDATE mk_contacts SET status = 'complained' WHERE id = ?").run(max.id);
      fake.addMember(remote.id, "zoe@exemple.fr", "subscribed");
      fake.addMember(remote.id, "max@exemple.fr", "subscribed");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      fake.reset();
      const r = await sync.syncAll(ctx);
      assert.equal(r.summary.conflicts, 2);
      assert.equal(contacts.findByEmail(ctx, "zoe@exemple.fr").status, "unsubscribed");
      assert.equal(contacts.findByEmail(ctx, "max@exemple.fr").status, "complained");
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_list_members WHERE list_id = ?", listId).n, 0);
      const push = fake.requests.find((q) => q.method === "POST" && q.path === `/lists/${remote.id}`);
      assert.ok(push, "le désabonnement doit être renvoyé à Mailchimp");
      assert.deepEqual(push.body.members.map((x) => [x.email_address, x.status]).sort(), [["max@exemple.fr", "unsubscribed"], ["zoe@exemple.fr", "unsubscribed"]]);
      assert.equal(push.body.update_existing, true);
      assert.equal(fake.state.members.get(remote.id).get(fake.md5("zoe@exemple.fr")).status, "unsubscribed");
      assert.equal(r.summary.pushedUnsubscribe, 2);
    });

    test("désinscrit chez Mailchimp → désinscrit chez Kolakisa (même si Kolakisa le croyait abonné)", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr");
      lists.addToList(ctx, listId, [lea.id]);
      fake.addMember(remote.id, "lea@exemple.fr", "unsubscribed");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      await sync.syncAll(ctx);
      assert.equal(contacts.getContact(ctx, lea.id).status, "unsubscribed");
      assert.equal(consent.isSendable(ctx, lea.id).ok, false);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_members WHERE contact_id = ? AND mc_status = 'unsubscribed'", lea.id).n, 1);
    });

    test("Kolakisa → Mailchimp : un contact consenti de la liste liée est abonné chez Mailchimp ; pas de doublon à la synchronisation suivante", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr", { first_name: "Léa" });
      const nope = contacts.upsertContact(ctx, { email: "nope@exemple.fr" }).contact; // sans consentement
      lists.addToList(ctx, listId, [lea.id, nope.id]);
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      const r = await sync.syncAll(ctx);
      assert.equal(r.summary.pushedSubscribe, 1);
      const remoteLea = fake.state.members.get(remote.id).get(fake.md5("lea@exemple.fr"));
      assert.equal(remoteLea.status, "subscribed");
      assert.equal(remoteLea.merge_fields.FNAME, "Léa");
      assert.equal(fake.state.members.get(remote.id).has(fake.md5("nope@exemple.fr")), false, "sans consentement : jamais poussé");
      fake.reset();
      const r2 = await sync.syncAll(ctx);
      assert.equal(r2.summary.pushedSubscribe, 0);
      assert.equal(fake.requests.filter((q) => q.method === "POST" && q.path === `/lists/${remote.id}`).length, 0);
    });

    test("un contact désinscrit chez Kolakisa et abonné chez Mailchimp (connu du miroir) est désabonné chez Mailchimp", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr");
      lists.addToList(ctx, listId, [lea.id]);
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      await sync.syncAll(ctx);
      consent.unsubscribe(ctx, lea.id, { source: "preference_center" });
      const r = await sync.syncAll(ctx);
      assert.equal(r.summary.pushedUnsubscribe, 1);
      assert.equal(fake.state.members.get(remote.id).get(fake.md5("lea@exemple.fr")).status, "unsubscribed");
    });

    test("incrémental : seuls les membres modifiés depuis le curseur sont relus ; « full » relit tout ; idempotent", async () => {
      fake.addMember(remote.id, "a1@exemple.fr"); fake.addMember(remote.id, "a2@exemple.fr");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      const first = await sync.syncAll(ctx);
      assert.equal(first.summary.pulled, 2);
      assert.equal(first.summary.created, 2);
      for (const mem of fake.state.members.get(remote.id).values()) mem.last_changed = new Date(Date.now() - 3600_000).toISOString(); // modifiés il y a une heure : avant le curseur
      fake.reset();
      const second = await sync.syncAll(ctx);
      assert.equal(second.summary.pulled, 0);
      const get = fake.requests.find((q) => q.path === `/lists/${remote.id}/members`);
      assert.ok(get.query.since_last_changed, "le curseur est transmis");
      assert.match(get.query.since_last_changed, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00$/);
      fake.addMember(remote.id, "a3@exemple.fr");
      assert.equal((await sync.syncAll(ctx)).summary.pulled, 1);
      const full = await sync.syncAll(ctx, { full: true });
      assert.equal(full.summary.pulled, 3);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_contacts WHERE organization_id = 1 AND source = 'mailchimp'").n, 3);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_consents WHERE organization_id = 1 AND source = 'mailchimp'").n, 3, "un seul consentement par personne, même après relecture");
    });

    test("adresse invalide ou membre défectueux : compté, les autres sont traités", async () => {
      fake.state.members.get(remote.id).set("zz", { id: "zz", email_address: "pas-un-email", status: "subscribed", merge_fields: {}, last_changed: new Date().toISOString() });
      fake.addMember(remote.id, "ok@exemple.fr");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      const r = await sync.syncAll(ctx);
      assert.equal(contacts.findByEmail(ctx, "ok@exemple.fr").status, "subscribed");
      assert.equal(r.summary.skipped >= 1, true);
    });

    test("verrou : une seconde synchronisation simultanée est refusée ; un verrou périmé (30 min) est ignoré", async () => {
      m.db.prepare("UPDATE mk_mc_state SET running_since = datetime('now') WHERE organization_id = 1").run();
      assert.deepEqual(await sync.syncAll(ctx), { skipped: "already_running" });
      m.db.prepare("UPDATE mk_mc_state SET running_since = datetime('now', '-2 hours') WHERE organization_id = 1").run();
      assert.equal((await sync.syncAll(ctx)).status, "ok");
      assert.equal(sync.state(ctx).running, false);
    });

    test("panne : clé révoquée → état « error » enregistré avec un message français, verrou levé ; panne d'une audience → « partial »", async () => {
      fake.failNext(401, { times: 20, body: { title: "API Key Invalid", status: 401, detail: "x" } });
      const r = await sync.syncAll(ctx);
      assert.equal(r.status, "error");
      assert.match(r.error, /clé d'API Mailchimp est refusée/);
      const st = sync.state(ctx);
      assert.equal(st.status, "error"); assert.equal(st.running, false); assert.ok(st.lastSyncAt);
      fake.reset();
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      fake.failNext(500, { times: 20, body: { title: "Internal Server Error", status: 500, detail: "x" } });
      const r2 = await sync.syncAll(ctx);
      assert.ok(["error", "partial"].includes(r2.status));
      fake.reset();
      assert.equal((await sync.syncAll(ctx)).status, "ok");
    });

    test("isolation : l'organisation B ne voit ni les miroirs ni les contacts de A", async () => {
      fake.addMember(remote.id, "ana@exemple.fr");
      sync.linkAudience(ctx, remote.id, { localListId: listId });
      await sync.syncAll(ctx);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_audiences WHERE organization_id = 2").n, 0);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_members WHERE organization_id = 2").n, 0);
      assert.equal(contacts.findByEmail(ctxB, "ana@exemple.fr"), null);
      assert.equal(sync.state(ctxB).status, "never");
      assert.equal(sync.audienceRow(ctxB, remote.id), undefined);
    });
  });

  describe("webhooks entrants", () => {
    const hook = (type, data, extra = {}) => form({ type, fired_at: extra.fired_at || "2026-10-30 10:00:00", data: { list_id: remote.id, ...data } });
    let audienceReady;
    beforeEach(async () => { sync.linkAudience(ctx, remote.id, { localListId: listId }); audienceReady = true; });

    test("analyse du formulaire imbriqué data[merges][FNAME], clés dangereuses retirées", () => {
      const p = inbound.parseForm("type=subscribe&data%5Bmerges%5D%5BFNAME%5D=Ana&data%5B__proto__%5D%5Bx%5D=1&constructor%5Bprototype%5D%5By%5D=2");
      assert.deepEqual(p, { type: "subscribe", data: { merges: { FNAME: "Ana" } } });
      assert.equal({}.x, undefined); assert.equal({}.y, undefined);
      assert.throws(() => inbound.parseForm("a=" + "x".repeat(70000)), (e) => e.code === "too_large");
    });

    test("subscribe : contact créé avec preuve de consentement et ajouté à la liste liée", async () => {
      const r = await inbound.receive(ctx, hook("subscribe", { id: "u1", email: "nouveau@exemple.fr", merges: { FNAME: "Nina", LNAME: "Roy" } }));
      assert.equal(r.status, "applied");
      const c = contacts.findByEmail(ctx, "nouveau@exemple.fr");
      assert.equal(c.status, "subscribed"); assert.equal(c.first_name, "Nina");
      assert.ok(one("SELECT 1 AS x FROM mk_list_members WHERE list_id = ? AND contact_id = ?", listId, c.id));
      const ev = one("SELECT * FROM mk_mc_events WHERE organization_id = 1");
      assert.equal(ev.status, "applied"); assert.equal(ev.event_type, "subscribe"); assert.ok(JSON.parse(ev.payload).data.merges.FNAME === "Nina");
    });

    test("idempotence : le même événement reçu deux fois n'est appliqué qu'une fois", async () => {
      const body = hook("subscribe", { email: "dup@exemple.fr" });
      assert.equal((await inbound.receive(ctx, body)).status, "applied");
      assert.deepEqual(await inbound.receive(ctx, body), { ok: true, duplicate: true });
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_events").n, 1);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_consents WHERE source = 'mailchimp'").n, 1);
    });

    test("unsubscribe : contact désinscrit ; contact inconnu créé désinscrit (jamais joignable)", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr");
      await inbound.receive(ctx, hook("unsubscribe", { email: "lea@exemple.fr", action: "unsub", reason: "manual" }));
      assert.equal(contacts.getContact(ctx, lea.id).status, "unsubscribed");
      await inbound.receive(ctx, hook("unsubscribe", { email: "inconnu@exemple.fr" }, { fired_at: "2026-10-30 10:01:00" }));
      assert.equal(contacts.findByEmail(ctx, "inconnu@exemple.fr").status, "unsubscribed");
    });

    test("profile : prénom et nom mis à jour (Mailchimp fait autorité) ; contact inconnu ignoré", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr", { first_name: "Léa" });
      const r = await inbound.receive(ctx, hook("profile", { email: "lea@exemple.fr", merges: { FNAME: "Léana", LNAME: "Petit" } }));
      assert.equal(r.status, "applied");
      assert.equal(contacts.getContact(ctx, lea.id).first_name, "Léana");
      const r2 = await inbound.receive(ctx, hook("profile", { email: "personne@exemple.fr", merges: { FNAME: "X" } }));
      assert.equal(r2.status, "ignored");
    });

    test("cleaned : liste de suppression (rebond dur, ou plainte si raison « abuse »)", async () => {
      consentedContact(ctx, "rebond@exemple.fr");
      await inbound.receive(ctx, hook("cleaned", { email: "rebond@exemple.fr", reason: "hard" }));
      assert.equal(contacts.findByEmail(ctx, "rebond@exemple.fr").status, "bounced");
      await inbound.receive(ctx, hook("cleaned", { email: "abus@exemple.fr", reason: "abuse" }));
      assert.equal(one("SELECT reason FROM mk_suppressions WHERE email = 'abus@exemple.fr'").reason, "complained");
    });

    test("upemail : la nouvelle adresse est abonnée (preuve), l'ancienne désinscrite", async () => {
      const old = consentedContact(ctx, "ancienne@exemple.fr", { first_name: "Sam" });
      const r = await inbound.receive(ctx, hook("upemail", { new_id: "n1", new_email: "nouvelle@exemple.fr", old_email: "ancienne@exemple.fr" }));
      assert.equal(r.status, "applied");
      const fresh = contacts.findByEmail(ctx, "nouvelle@exemple.fr");
      assert.equal(fresh.status, "subscribed"); assert.equal(fresh.first_name, "Sam");
      assert.equal(contacts.getContact(ctx, old.id).status, "unsubscribed");
    });

    test("campaign : statut de la campagne mis à jour ; campagne inconnue ignorée", async () => {
      const c = fake.addCampaign({ status: "sending", recipients: { list_id: remote.id } });
      await sync.syncAll(ctx);
      assert.equal(one("SELECT status FROM mk_mc_campaigns WHERE remote_id = ?", c.id).status, "sending");
      const r = await inbound.receive(ctx, form({ type: "campaign", fired_at: "2026-10-30 11:00:00", data: { id: c.id, subject: "Nouvel objet", status: "sent", reason: "", list_id: remote.id } }));
      assert.equal(r.status, "applied");
      const row = one("SELECT status, subject, report_synced_at FROM mk_mc_campaigns WHERE remote_id = ?", c.id);
      assert.equal(row.status, "sent"); assert.equal(row.subject, "Nouvel objet"); assert.equal(row.report_synced_at, null);
      const r2 = await inbound.receive(ctx, form({ type: "campaign", fired_at: "2026-10-30 11:00:01", data: { id: "inconnue1", status: "sent", list_id: remote.id } }));
      assert.equal(r2.status, "ignored");
    });

    test("conflit : « subscribe » pour une personne désinscrite chez Kolakisa → elle reste désinscrite et Mailchimp est corrigé", async () => {
      const zoe = consentedContact(ctx, "zoe@exemple.fr");
      consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
      fake.addMember(remote.id, "zoe@exemple.fr", "subscribed");
      fake.reset();
      const r = await inbound.receive(ctx, hook("subscribe", { email: "zoe@exemple.fr" }));
      assert.equal(r.status, "applied");
      assert.equal(contacts.getContact(ctx, zoe.id).status, "unsubscribed");
      const patch = fake.requests.find((q) => q.method === "PATCH");
      assert.equal(patch.path, `/lists/${remote.id}/members/${fake.md5("zoe@exemple.fr")}`);
      assert.deepEqual(patch.body, { status: "unsubscribed" });
      assert.match(one("SELECT detail FROM mk_mc_events ORDER BY id DESC").detail, /Conflit/);
    });

    test("audience inconnue, type inconnu, adresse invalide : enregistrés puis ignorés, rien d'écrit", async () => {
      const before = one("SELECT COUNT(*) AS n FROM mk_contacts").n;
      assert.equal((await inbound.receive(ctx, form({ type: "subscribe", fired_at: "x1", data: { list_id: "ffffffffff", email: "a@exemple.fr" } }))).status, "ignored");
      assert.equal((await inbound.receive(ctx, form({ type: "bizarre", fired_at: "x2", data: { list_id: remote.id } }))).ignored, true);
      assert.equal((await inbound.receive(ctx, hook("subscribe", { email: "pas un email" }, { fired_at: "x3" }))).status, "ignored");
      assert.equal((await inbound.receive(ctx, "")).ignored, true);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_contacts").n, before);
    });

    test("rejeu : un événement échoué ou ignoré peut être retraité ; le compteur de rejeux augmente ; un autre organisation ne le voit pas", async () => {
      await inbound.receive(ctx, hook("profile", { email: "tard@exemple.fr", merges: { FNAME: "Tard" } }));
      const ev = one("SELECT id, status FROM mk_mc_events");
      assert.equal(ev.status, "ignored");
      consentedContact(ctx, "tard@exemple.fr");
      const r = await inbound.replay(ctx, ev.id);
      assert.equal(r.status, "applied");
      assert.equal(contacts.findByEmail(ctx, "tard@exemple.fr").first_name, "Tard");
      assert.equal(one("SELECT replays FROM mk_mc_events WHERE id = ?", ev.id).replays, 1);
      await assert.rejects(inbound.replay(ctxB, ev.id), (e) => e.code === "not_found");
      assert.equal(inbound.list(ctxB).length, 0);
    });

    test("droit à l'effacement : effacer le contact retire l'adresse et la charge des événements Mailchimp reçus, et sa correspondance", async () => {
      const lea = consentedContact(ctx, "lea@exemple.fr");
      await inbound.receive(ctx, hook("profile", { email: "lea@exemple.fr", merges: { FNAME: "Léa" } }, { fired_at: "e1" }));
      await inbound.receive(ctx, hook("subscribe", { email: "autre@exemple.fr" }, { fired_at: "e2" }));
      m.db.prepare("INSERT INTO mk_mc_members (organization_id, audience_remote_id, contact_id, subscriber_hash, mc_status) VALUES (1, ?, ?, 'h', 'subscribed')").run(remote.id, lea.id);
      assert.ok(one("SELECT 1 AS x FROM mk_mc_events WHERE email = 'lea@exemple.fr'"));
      assert.equal(contacts.deleteContact(ctx, lea.id), true);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_events WHERE email = 'lea@exemple.fr'").n, 0);
      assert.doesNotMatch(JSON.stringify(all("SELECT payload FROM mk_mc_events")), /lea@exemple\.fr/);
      assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_members WHERE contact_id = ?", lea.id).n, 0);
      assert.ok(one("SELECT 1 AS x FROM mk_mc_events WHERE email = 'autre@exemple.fr'"), "les autres personnes ne sont pas touchées");
    });

    test("journal : liste filtrable, charge complète, lecture incrémentale (after)", async () => {
      await inbound.receive(ctx, hook("subscribe", { email: "a@exemple.fr" }, { fired_at: "t1" }));
      await inbound.receive(ctx, hook("cleaned", { email: "b@exemple.fr", reason: "hard" }, { fired_at: "t2" }));
      const rows = inbound.list(ctx);
      assert.deepEqual(rows.map((r) => r.type), ["cleaned", "subscribe"]);
      assert.equal(rows[0].payload.data.email, "b@exemple.fr");
      assert.equal(inbound.list(ctx, { type: "subscribe" }).length, 1);
      assert.equal(inbound.list(ctx, { afterId: rows[1].id }).length, 1);
      assert.equal(inbound.list(ctx, { status: "failed" }).length, 0);
    });

    test("installation du webhook chez Mailchimp : adresse avec jeton, sources « api » désactivée, une seule fois", async () => {
      await sync.syncAll(ctx);
      const url = connection.webhookUrl(ctx, { SITE_URL: "https://k.test" });
      const first = await inbound.install(ctx, remote.id, { SITE_URL: "https://k.test" });
      assert.equal(first.created, true);
      const w = [...fake.state.webhooks.values()][0];
      assert.equal(w.url, url);
      assert.deepEqual(w.sources, { user: true, admin: true, api: false });
      assert.deepEqual(Object.keys(w.events).sort(), ["campaign", "cleaned", "profile", "subscribe", "unsubscribe", "upemail"]);
      assert.equal((await inbound.install(ctx, remote.id, { SITE_URL: "https://k.test" })).created, false);
      assert.equal(fake.state.webhooks.size, 1);
      await assert.rejects(inbound.install(ctx, remote.id, { SITE_URL: "" }), (e) => e.code === "webhook_url" && /SITE_URL/.test(e.message));
    });
  });

  describe("opérations composées", () => {
    test("import CSV : sans attestation de consentement → « pending » (Mailchimp demande la confirmation) ; avec → « subscribed »", async () => {
      const rows = [{ email: "a@exemple.fr", FNAME: "Ana" }, { email: "B@Exemple.fr", FNAME: "Bob", tags: "vip, presse" }];
      const r = await composite.importMembers(ctx, remote.id, { rows, tags: ["import"] });
      assert.equal(r.status, "pending"); assert.equal(r.created, 2);
      const mem = fake.state.members.get(remote.id).get(fake.md5("b@exemple.fr"));
      assert.equal(mem.status, "pending");
      assert.deepEqual(mem.tags.map((t) => t.name).sort(), ["import", "presse", "vip"]);
      const r2 = await composite.importMembers(ctx, remote.id, { rows: [{ email: "c@exemple.fr" }], attestConsent: true });
      assert.equal(r2.status, "subscribed");
      assert.equal(fake.state.members.get(remote.id).get(fake.md5("c@exemple.fr")).status, "subscribed");
    });
    test("import CSV : adresses invalides, doublons et personnes désinscrites/rebondies chez Kolakisa écartés, 5000 lignes au plus", async () => {
      const zoe = consentedContact(ctx, "zoe@exemple.fr"); consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
      m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'rebond@exemple.fr', 'bounced')").run();
      const r = await composite.importMembers(ctx, remote.id, { rows: [{ email: "ok@exemple.fr" }, { email: "ok@exemple.fr" }, { email: "pas-un-email" }, { email: "zoe@exemple.fr" }, { email: "rebond@exemple.fr" }], attestConsent: true });
      assert.equal(r.created, 1); assert.equal(r.duplicates, 1); assert.equal(r.invalid.length, 1); assert.equal(r.invalid[0].line, 3); assert.equal(r.blocked, 2);
      assert.equal(fake.state.members.get(remote.id).has(fake.md5("zoe@exemple.fr")), false);
      await assert.rejects(composite.importMembers(ctx, remote.id, { rows: [] }), (e) => e.code === "invalid_request");
      await assert.rejects(composite.importMembers(ctx, remote.id, { rows: Array.from({ length: 5001 }, (_, i) => ({ email: `u${i}@exemple.fr` })) }), (e) => /5000 lignes/.test(e.message));
    });
    test("import CSV : lots de 500 ; mise à jour sans réabonner (status_if_new)", async () => {
      const rows = Array.from({ length: 1200 }, (_, i) => ({ email: `u${i}@exemple.fr` }));
      fake.reset();
      const r = await composite.importMembers(ctx, remote.id, { rows, attestConsent: true });
      assert.equal(r.created, 1200);
      assert.deepEqual(fake.requests.filter((q) => q.method === "POST").map((q) => q.body.members.length), [500, 500, 200]);
      fake.addMember(remote.id, "gone@exemple.fr", "unsubscribed");
      const r2 = await composite.importMembers(ctx, remote.id, { rows: [{ email: "gone@exemple.fr", FNAME: "G" }], attestConsent: true, updateExisting: true });
      assert.equal(r2.updated, 1);
      assert.equal(fake.state.members.get(remote.id).get(fake.md5("gone@exemple.fr")).status, "unsubscribed");
    });
    test("export CSV : en-têtes français, BOM, formules neutralisées, numéros intacts", async () => {
      fake.addMember(remote.id, "x@exemple.fr", "subscribed", { FNAME: "=HYPERLINK(\"http://evil\")", LNAME: "+33 6 12 34 56 78" }, ["a", "b"]);
      const out = await composite.exportMembers(ctx, remote.id, "subscribed");
      assert.equal(out.count, 1);
      assert.ok(out.csv.startsWith("\uFEFFemail,statut,prénom,nom,tags,inscrit le"));
      assert.match(out.csv, /"'=HYPERLINK\(""http:\/\/evil""\)"/);
      assert.match(out.csv, /\+33 6 12 34 56 78/);
      assert.doesNotMatch(out.csv, /'\+33/);
      await assert.rejects(composite.exportMembers(ctx, remote.id, "nimporte"), (e) => e.code === "invalid_request");
    });
    test("existence d'un contact par adresse ou empreinte", async () => {
      fake.addMember(remote.id, "la@exemple.fr", "unsubscribed");
      assert.deepEqual(await composite.memberExists(ctx, remote.id, "LA@exemple.fr"), { exists: true, status: "unsubscribed", email: "la@exemple.fr" });
      assert.deepEqual(await composite.memberExists(ctx, remote.id, fake.md5("la@exemple.fr")), { exists: true, status: "unsubscribed", email: "la@exemple.fr" });
      assert.deepEqual(await composite.memberExists(ctx, remote.id, "absent@exemple.fr"), { exists: false });
      await assert.rejects(composite.memberExists(ctx, remote.id, "n'importe quoi"), (e) => e.code === "invalid_request");
    });
    test("aperçu de modèle : balises de fusion remplacées et échappées, inconnues signalées, liens de désabonnement inertes", () => {
      const r = composite.renderTemplate('<h1>Bonjour *|FNAME|*</h1><a href="*|UNSUB|*">x</a> *|INCONNU|*', { FNAME: "<script>alert(1)</script>" });
      assert.match(r.html, /&lt;script&gt;/); assert.doesNotMatch(r.html, /<script>/);
      assert.match(r.html, /href="#desabonnement"/);
      assert.deepEqual(r.unknown, ["INCONNU"]);
      assert.throws(() => composite.renderTemplate("   "), (e) => e.code === "invalid_request");
    });
    test("comparaison de campagnes (2 à 10) et rebonds durs / mous", async () => {
      const a = fake.addCampaign({}), b = fake.addCampaign({});
      const rep = (id, open) => ({ id, campaign_title: `C${id}`, emails_sent: 100, opens: { open_rate: open, unique_opens: open * 100 }, clicks: { click_rate: 0.1 }, bounces: { hard_bounces: 1, soft_bounces: 2 }, unsubscribed: 1, ecommerce: { total_revenue: 10 } });
      fake.setReport(a.id, rep(a.id, 0.3)); fake.setReport(b.id, rep(b.id, 0.5));
      const cmp = await composite.compare(ctx, [a.id, b.id]);
      assert.equal(cmp.best.openRate, b.id);
      assert.equal(cmp.campaigns[0].bounces, 3);
      await assert.rejects(composite.compare(ctx, [a.id]), (e) => /2 à 10/.test(e.message));
    });
    test("tableau de bord : totaux issus des miroirs, alertes (rebonds, désabonnements, plaintes) au-delà des seuils, sans appel réseau avec live:false", async () => {
      fake.addMember(remote.id, "a@exemple.fr");
      const c = fake.addCampaign({ recipients: { list_id: remote.id } });
      fake.setReport(c.id, { emails_sent: 1000, opens: { unique_opens: 400, open_rate: 0.4 }, clicks: { unique_clicks: 50, click_rate: 0.05 }, bounces: { hard_bounces: 40, soft_bounces: 30 }, unsubscribed: 20, abuse_reports: 3, ecommerce: { total_revenue: 99 } });
      await sync.syncAll(ctx);
      fake.reset();
      const d = await composite.dashboard(ctx, { live: false });
      assert.equal(fake.requests.length, 0);
      assert.equal(d.totals.audiences, 1); assert.equal(d.totals.contacts, 1); assert.equal(d.totals.campaigns, 1); assert.equal(d.totals.revenue, 99);
      assert.equal(Math.round(d.totals.avgOpenRate * 100), 40);
      assert.equal(d.alerts.length, 3);
      assert.ok(d.alerts.some((a) => /rebond/.test(a.text)) && d.alerts.some((a) => /Désabonnements/.test(a.text)) && d.alerts.some((a) => /Plaintes/.test(a.text)));
      assert.equal(d.recentCampaigns[0].id, c.id);
    });
  });

  describe("Mailchimp Transactional (Mandrill)", () => {
    const tctx = () => ({ ...ctx, env: { MAILCHIMP_API_BASE: fake.base, MANDRILL_API_BASE: fake.mandrillBase }, mailchimp: quick });
    beforeEach(() => { process.env.MANDRILL_API_BASE = fake.mandrillBase; connection.saveTransactionalKey(ctx, fake.mandrillKey); });
    after(() => { delete process.env.MANDRILL_API_BASE; });
    const msg = (to = "client@exemple.fr") => ({ subject: "Reçu", from_email: "contact@exemple.fr", from_name: "Société", html: "<p>Merci</p>", to: [{ email: to, type: "to" }] });

    test("clé : format vérifié, chiffrée, effaçable ; sans clé : not_connected", async () => {
      assert.throws(() => connection.saveTransactionalKey(ctx, "x y"), (e) => e.code === "key_format");
      assert.equal(connection.status(ctx).transactionalKeySet, true);
      assert.match(one("SELECT value FROM mk_settings WHERE key = 'mailchimp.transactional_key'").value, /^v1:/);
      connection.saveTransactionalKey(ctx, "");
      await assert.rejects(transactional.run(ctx, "users.ping", {}), (e) => e.code === "not_connected");
    });
    test("ping, informations du compte, recherche de messages", async () => {
      assert.equal((await transactional.run(ctx, "users.ping")).PING, "PONG!");
      assert.equal((await transactional.run(ctx, "users.info")).reputation, 90);
      const found = await transactional.run(ctx, "messages.search", { query: "email:client@exemple.fr" });
      assert.equal(found[0].subject, "Reçu");
    });
    test("envoi : confirmation obligatoire, un envoi n'est jamais réessaie après une erreur 5xx", async () => {
      await assert.rejects(transactional.run(ctx, "messages.send", { message: msg() }), (e) => e.code === "confirm_required");
      assert.equal(fake.requests.filter((q) => q.path.includes("messages/send")).length, 0);
      const r = await transactional.run(ctx, "messages.send", { message: msg(), confirm: true });
      assert.equal(r[0].status, "sent");
      assert.equal(fake.requests.at(-1).body.confirm, undefined, "la confirmation n'est pas transmise à Mandrill");
      assert.equal(fake.requests.at(-1).body.key, fake.mandrillKey);
    });
    test("destinataire en rebond dur / plainte : refusé avant tout appel ; désinscrit du marketing : autorisé (transactionnel)", async () => {
      m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'mort@exemple.fr', 'bounced')").run();
      fake.reset();
      await assert.rejects(transactional.run(ctx, "messages.send", { message: msg("mort@exemple.fr"), confirm: true }), (e) => e.code === "recipient_blocked");
      assert.equal(fake.requests.length, 0);
      const zoe = consentedContact(ctx, "zoe@exemple.fr"); consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
      assert.equal((await transactional.run(ctx, "messages.send", { message: msg("zoe@exemple.fr"), confirm: true }))[0].status, "sent");
    });
    test("validation : champs inconnus, destinataires invalides ou trop nombreux, message vide, nom de modèle injecté", async () => {
      const bad = (body, re) => assert.rejects(transactional.run(ctx, "messages.send", { confirm: true, ...body }), (e) => e.code === "invalid_request" && re.test(e.message));
      await bad({ message: msg(), extra: 1 }, /Champ « extra »/);
      await bad({ message: { ...msg(), bizarre: 1 } }, /message\.bizarre/);
      await bad({ message: { ...msg(), to: [] } }, /destinataire/);
      await bad({ message: { ...msg(), to: [{ email: "nope" }] } }, /invalide/);
      await bad({ message: { ...msg(), to: Array.from({ length: 51 }, (_, i) => ({ email: `u${i}@exemple.fr` })) } }, /50 destinataires/);
      await bad({ message: { subject: "x", from_email: "contact@exemple.fr", to: [{ email: "a@exemple.fr" }] } }, /vide/);
      await bad({}, /message/);
      await assert.rejects(transactional.run(ctx, "templates.render", { template_name: "../x" }), (e) => e.code === "invalid_request");
      await assert.rejects(transactional.run(ctx, "inconnu.op", {}), (e) => e.code === "unknown_operation");
    });
    test("modèle introuvable, clé refusée, crédits épuisés : codes et messages français", async () => {
      await assert.rejects(transactional.run(ctx, "messages.sendTemplate", { template_name: "inconnu", message: msg(), confirm: true }), (e) => e.code === "not_found" && /introuvable/.test(e.message));
      connection.saveTransactionalKey(ctx, "mauvaise-cle-1234567890");
      await assert.rejects(transactional.run(ctx, "users.ping", {}), (e) => e.code === "auth_invalid" && /Mandrill\) est refusée/.test(e.message));
      connection.saveTransactionalKey(ctx, fake.mandrillKey);
      await assert.rejects(transactional.run(ctx, "rejects.add", { email: "a@exemple.fr" }), (e) => e.code === "quota" && /crédits/.test(e.message));
    });
    test("rendu d'un modèle avec variables ; suppression d'un modèle demande confirmation", async () => {
      const r = await transactional.run(ctx, "templates.render", { template_name: "recu", template_content: [], merge_vars: [{ name: "NOM", content: "Camille" }] });
      assert.equal(r.html, "<p>Bonjour Camille</p>");
      await assert.rejects(transactional.run(ctx, "templates.delete", { name: "recu" }), (e) => e.code === "confirm_required");
    });
  });
});
