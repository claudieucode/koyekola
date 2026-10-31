// Correctifs issus de la relecture adverse de l'intégration Mailchimp : chaque test reproduit le scénario d'échec décrit, et échouerait sans la correction.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");
const connection = require("../src/marketing/mailchimp/connection");
const sync = require("../src/marketing/mailchimp/sync");
const inbound = require("../src/marketing/mailchimp/inbound");
const composite = require("../src/marketing/mailchimp/composite");
const operations = require("../src/marketing/mailchimp/operations");
const client = require("../src/marketing/mailchimp/client");
const contacts = require("../src/marketing/audience/contacts");
const consent = require("../src/marketing/compliance/consent");
const lists = require("../src/marketing/audience/lists");

describe("correctifs de la relecture adverse", () => {
  let fake, m, ctx, remote, listId;
  const one = (sql, ...a) => m.db.prepare(sql).get(...a);
  const all = (sql, ...a) => m.db.prepare(sql).all(...a);
  const form = (obj) => { const p = new URLSearchParams(); const walk = (o, pre) => { for (const [k, v] of Object.entries(o)) { const key = pre ? `${pre}[${k}]` : k; if (v && typeof v === "object") walk(v, key); else p.append(key, String(v)); } }; walk(obj, ""); return p.toString(); };
  const hook = (type, data, at) => form({ type, fired_at: at, data: { list_id: remote.id, ...data } });
  const consented = (c, email) => { const { contact } = contacts.upsertContact(c, { email, source: "form" }); consent.recordConsent(c, contact.id, { source: "form", textShown: "Je m'inscris." }); return contacts.getContact(c, contact.id); };

  before(async () => { process.env.ENCRYPTION_KEY = TEST_KEY; fake = await createFakeMailchimp(); });
  after(() => fake.close());
  beforeEach(async () => {
    m = freshMarketing();
    ctx = { ...m.A, env: { MAILCHIMP_API_BASE: fake.base }, mailchimp: { sleep: async () => {} } };
    for (const k of ["lists", "members", "campaigns", "reports", "webhooks"]) fake.state[k].clear(); fake.state.coll = {}; fake.reset();
    remote = fake.addList("Newsletter");
    await connection.connect(ctx, fake.key);
    await sync.syncAll(ctx);
    listId = lists.createList(ctx, { name: "Abonnés" }).id;
    sync.linkAudience(ctx, remote.id, { localListId: listId });
  });

  test("1. une synchronisation n'émet aucun événement « abonné » ni « ajouté à la liste » (aucune série de bienvenue ne part)", async () => {
    fake.addMember(remote.id, "ana@exemple.fr"); fake.addMember(remote.id, "bob@exemple.fr");
    await sync.syncAll(ctx);
    assert.equal(contacts.findByEmail(ctx, "ana@exemple.fr").status, "subscribed");
    const names = () => all("SELECT name FROM mk_events WHERE name IN ('contact.subscribed', 'list.member_added', 'contact.created')").map((r) => r.name);
    assert.deepEqual(names(), [], "aucun événement déclencheur pour les contacts venus de Mailchimp");
    consented(ctx, "temoin@exemple.fr"); // témoin : un abonnement ordinaire, lui, émet bien l'événement
    assert.ok(names().includes("contact.subscribed"));
  });

  test("2. une audience NON liée n'importe jamais de consentement : subscribe, upemail et profile sont ignorés, unsubscribe et cleaned restent appliqués", async () => {
    const other = fake.addList("Événement B2B"); await sync.syncAll(ctx);
    const h = (type, data, at) => form({ type, fired_at: at, data: { list_id: other.id, ...data } });
    assert.equal((await inbound.receive(ctx, h("subscribe", { email: "salon@exemple.fr" }, "u1"))).status, "ignored");
    assert.equal(contacts.findByEmail(ctx, "salon@exemple.fr"), null);
    assert.equal((await inbound.receive(ctx, h("upemail", { new_email: "n@exemple.fr", old_email: "o@exemple.fr" }, "u2"))).status, "ignored");
    const lea = consented(ctx, "lea@exemple.fr");
    assert.equal((await inbound.receive(ctx, h("profile", { email: "lea@exemple.fr", merges: { FNAME: "X" } }, "u3"))).status, "ignored");
    assert.equal((await inbound.receive(ctx, h("unsubscribe", { email: "lea@exemple.fr" }, "u4"))).status, "applied");
    assert.equal(contacts.getContact(ctx, lea.id).status, "unsubscribed", "une désinscription reste toujours respectée");
    assert.equal((await inbound.receive(ctx, h("cleaned", { email: "dur@exemple.fr", reason: "hard" }, "u5"))).status, "applied");
  });

  test("3. désinscrit de LA liste liée : jamais réajouté à la liste, et son désabonnement est renvoyé à Mailchimp (pull et push)", async () => {
    const zoe = consented(ctx, "zoe@exemple.fr");
    consent.unsubscribe(ctx, zoe.id, { scope: "list", listId, source: "preference_center" });
    assert.equal(contacts.getContact(ctx, zoe.id).status, "subscribed", "désinscrite de la liste seulement");
    fake.addMember(remote.id, "zoe@exemple.fr", "subscribed");
    fake.reset();
    const r = await sync.syncAll(ctx, { full: true });
    assert.equal(r.summary.conflicts, 1);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_list_members WHERE list_id = ? AND contact_id = ?", listId, zoe.id).n, 0);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("zoe@exemple.fr")).status, "unsubscribed");
    // côté push : abonnée chez Mailchimp (miroir), puis désinscrite de la liste → désabonnée
    const ana = consented(ctx, "ana@exemple.fr"); lists.addToList(ctx, listId, [ana.id]);
    await sync.syncAll(ctx);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("ana@exemple.fr")).status, "subscribed");
    consent.unsubscribe(ctx, ana.id, { scope: "list", listId, source: "preference_center" });
    await sync.syncAll(ctx);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("ana@exemple.fr")).status, "unsubscribed");
  });

  test("4. les clients d'une même organisation se partagent le plafond de connexions simultanées", async () => {
    fake.setDelay(30);
    const key = fake.key, env = { MAILCHIMP_API_BASE: fake.base };
    const a = client.createClient({ apiKey: key, env, maxConcurrent: 3, limiterKey: "test:org-partagee" }), b = client.createClient({ apiKey: key, env, maxConcurrent: 3, limiterKey: "test:org-partagee" });
    await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? a : b).get("/lists")));
    assert.ok(fake.maxInflight <= 3, `pic ${fake.maxInflight}`);
    fake.reset(); fake.setDelay(30);
    const c = client.createClient({ apiKey: key, env, maxConcurrent: 3 }), d = client.createClient({ apiKey: key, env, maxConcurrent: 3 });
    await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? c : d).get("/lists")));
    assert.ok(fake.maxInflight > 3, "sans clé partagée, chaque client a son propre plafond (comportement de repli des tests)");
    fake.setDelay(0);
    const real = connection.clientFor(ctx), real2 = connection.clientFor(ctx);
    assert.notEqual(real, real2); // deux clients, un seul plafond : voir le test ci-dessus ; la clé est « mc:<organisation> »
  });

  test("7. le curseur n'avance pas tant que le désabonnement n'est pas parti : il est renvoyé à la passe suivante", async () => {
    const zoe = consented(ctx, "zoe@exemple.fr"); consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
    fake.addMember(remote.id, "zoe@exemple.fr", "subscribed");
    const before = one("SELECT members_cursor FROM mk_mc_audiences WHERE remote_id = ?", remote.id).members_cursor;
    fake.reset();
    // l'envoi du désabonnement (POST du lot) échoue : 500, jamais rejoué pour un POST
    fake.failNext(200, { body: { members: [] } }); // 1re requête = lecture des membres : réponse vide forcée → on cible plutôt la suivante
    fake.reset();
    const realPost = fake.requests; void realPost;
    let failed = false;
    const original = ctx.mailchimp;
    ctx.mailchimp = { ...original, fetchImpl: async (url, init) => { if (init.method === "POST" && /\/lists\/[0-9a-f]{10}$/.test(new URL(url).pathname.replace("/3.0", "")) && !failed) { failed = true; return new Response(JSON.stringify({ title: "Internal Server Error", status: 500, detail: "x" }), { status: 500, headers: { "Content-Type": "application/json" } }); } return fetch(url, init); } };
    const r1 = await sync.syncAll(ctx);
    assert.ok(failed, "l'envoi a bien échoué");
    assert.equal(r1.status, "partial");
    assert.equal(one("SELECT members_cursor FROM mk_mc_audiences WHERE remote_id = ?", remote.id).members_cursor, before, "curseur inchangé");
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("zoe@exemple.fr")).status, "subscribed");
    ctx.mailchimp = original;
    const r2 = await sync.syncAll(ctx);
    assert.equal(r2.status, "ok");
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("zoe@exemple.fr")).status, "unsubscribed", "renvoyé à la passe suivante");
  });

  test("8. une adresse secondaire (alias) d'un contact désinscrit est écartée d'un import CSV", async () => {
    const zoe = consented(ctx, "zoe@exemple.fr"); consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
    m.db.prepare("INSERT INTO mk_contact_aliases (organization_id, contact_id, email) VALUES (1, ?, 'zoe.alias@exemple.fr')").run(zoe.id);
    const r = await composite.importMembers(ctx, remote.id, { rows: [{ email: "zoe.alias@exemple.fr" }, { email: "ok@exemple.fr" }], attestConsent: true });
    assert.equal(r.blocked, 1); assert.equal(r.created, 1);
    assert.equal(fake.state.members.get(remote.id).has(fake.md5("zoe.alias@exemple.fr")), false);
  });

  test("9. la synchronisation rend la main au reste du site entre deux lots de contacts", async () => {
    for (let i = 0; i < 450; i++) fake.addMember(remote.id, `u${i}@exemple.fr`);
    let ticks = 0;
    const timer = setInterval(() => { ticks++; }, 1);
    const r = await sync.syncAll(ctx);
    clearInterval(timer);
    assert.equal(r.summary.pulled, 450);
    assert.ok(ticks >= 2, `${ticks} passages de la boucle d'événements pendant la lecture`);
  });

  test("10. changement d'adresse d'une personne désinscrite : la nouvelle adresse hérite de la désinscription et Mailchimp est corrigé", async () => {
    const old = consented(ctx, "ancienne@exemple.fr"); consent.unsubscribe(ctx, old.id, { source: "preference_center" });
    fake.addMember(remote.id, "nouvelle@exemple.fr", "subscribed");
    fake.reset();
    const r = await inbound.receive(ctx, hook("upemail", { new_email: "nouvelle@exemple.fr", old_email: "ancienne@exemple.fr" }, "v1"));
    assert.equal(r.status, "applied");
    const fresh = contacts.findByEmail(ctx, "nouvelle@exemple.fr");
    assert.equal(fresh.status, "unsubscribed");
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("nouvelle@exemple.fr")).status, "unsubscribed");
    // conflit sur la nouvelle adresse seule : renvoyé à Mailchimp, pas annoncé comme « enregistrée »
    const lea = consented(ctx, "lea@exemple.fr"); consent.unsubscribe(ctx, lea.id, { source: "preference_center" });
    const r2 = await inbound.receive(ctx, hook("upemail", { new_email: "lea@exemple.fr", old_email: "inconnue@exemple.fr" }, "v2"));
    assert.match(one("SELECT detail FROM mk_mc_events WHERE id = ?", r2.id).detail, /Conflit/);
  });

  test("11. une personne effacée chez Kolakisa est supprimée définitivement chez Mailchimp et jamais réimportée", async () => {
    const lea = consented(ctx, "lea@exemple.fr"); lists.addToList(ctx, listId, [lea.id]);
    await sync.syncAll(ctx);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("lea@exemple.fr")).status, "subscribed");
    contacts.deleteContact(ctx, lea.id);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_erased").n, 1);
    assert.doesNotMatch(JSON.stringify(all("SELECT * FROM mk_mc_erased")), /lea@exemple/, "seules des empreintes sont conservées");
    fake.reset();
    await sync.syncAll(ctx, { full: true });
    assert.equal(contacts.findByEmail(ctx, "lea@exemple.fr"), null, "jamais réimportée");
    assert.ok(fake.requests.some((q) => q.method === "POST" && q.path === `/lists/${remote.id}/members/${fake.md5("lea@exemple.fr")}/actions/delete-permanent`));
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_mc_erased").n, 0, "l'empreinte est retirée une fois Mailchimp nettoyé");
  });

  test("11 bis. l'effacement retire aussi l'ancienne adresse d'un événement « changement d'adresse »", async () => {
    consented(ctx, "ancienne@exemple.fr");
    await inbound.receive(ctx, hook("upemail", { new_email: "nouvelle@exemple.fr", old_email: "ancienne@exemple.fr" }, "w1"));
    const old = contacts.findByEmail(ctx, "ancienne@exemple.fr");
    contacts.deleteContact(ctx, old.id);
    assert.doesNotMatch(JSON.stringify(all("SELECT payload, email FROM mk_mc_events")), /ancienne@exemple/);
  });

  test("12 et 13. un événement reçu mais jamais appliqué est retraité (doublon, ou passe de rattrapage)", async () => {
    const body = hook("unsubscribe", { email: "lea@exemple.fr" }, "x1");
    const lea = consented(ctx, "lea@exemple.fr");
    const rec = inbound.record(ctx, inbound.parseForm(body)); // enregistré puis « interrompu » avant l'application
    assert.equal(one("SELECT status FROM mk_mc_events WHERE id = ?", rec.id).status, "received");
    assert.equal(contacts.getContact(ctx, lea.id).status, "subscribed");
    const again = await inbound.receive(ctx, body); // Mailchimp ne rejoue pas, mais un doublon relance le traitement
    assert.equal(again.duplicate, true); assert.equal(again.status, "applied");
    assert.equal(contacts.getContact(ctx, lea.id).status, "unsubscribed");
    const bob = consented(ctx, "bob@exemple.fr");
    const rec2 = inbound.record(ctx, inbound.parseForm(hook("unsubscribe", { email: "bob@exemple.fr" }, "x2")));
    m.db.prepare("UPDATE mk_mc_events SET received_at = datetime('now', '-5 minutes') WHERE id = ?").run(rec2.id);
    const out = await inbound.retryPending(ctx);
    assert.equal(out.applied, 1);
    assert.equal(contacts.getContact(ctx, bob.id).status, "unsubscribed");
  });

  test("14. plus de membres que le plafond de lecture : chaque passe reprend là où la précédente s'est arrêtée, rien n'est sauté", async () => {
    const t0 = Date.now() - 3600_000;
    for (let i = 0; i < 7; i++) { const mem = fake.addMember(remote.id, `m${i}@exemple.fr`); mem.last_changed = new Date(t0 + i * 60_000).toISOString(); }
    ctx.limits = { maxPull: 3 };
    const seen = new Set();
    for (let pass = 0; pass < 6; pass++) { await sync.syncAll(ctx); for (const c of all("SELECT email FROM mk_contacts")) seen.add(c.email); if (seen.size === 7) break; }
    assert.equal(seen.size, 7, "les 7 membres sont finalement importés");
  });

  test("15. un envoi refusé par Mailchimp est mémorisé : il n'est pas retenté à chaque passe", async () => {
    const lea = consented(ctx, "lea@exemple.fr"); lists.addToList(ctx, listId, [lea.id]);
    fake.state.members.get(remote.id).set(fake.md5("lea@exemple.fr"), { id: "x", email_address: "lea@exemple.fr", status: "archived", merge_fields: {}, last_changed: new Date(Date.now() - 86400000).toISOString() });
    // Mailchimp répond « déjà membre » (update_existing faux) pour une personne archivée chez lui
    await sync.syncAll(ctx);
    const row = one("SELECT mc_status FROM mk_mc_members WHERE contact_id = ?", lea.id);
    assert.ok(row && ["refused", "archived"].includes(row.mc_status), `état mémorisé : ${row && row.mc_status}`);
    fake.reset();
    await sync.syncAll(ctx);
    assert.equal(fake.requests.filter((q) => q.method === "POST" && q.path === `/lists/${remote.id}`).length, 0, "pas de nouvel envoi");
  });

  test("17. un import interrompu au milieu renvoie un rapport partiel au lieu de tout perdre", async () => {
    const rows = Array.from({ length: 1100 }, (_, i) => ({ email: `p${i}@exemple.fr` }));
    let posts = 0;
    ctx.mailchimp = { sleep: async () => {}, fetchImpl: async (url, init) => { if (init.method === "POST" && ++posts === 2) return new Response(JSON.stringify({ title: "Internal Server Error", status: 500, detail: "x" }), { status: 500, headers: { "Content-Type": "application/json" } }); return fetch(url, init); } };
    const r = await composite.importMembers(ctx, remote.id, { rows, attestConsent: true });
    assert.equal(r.created, 500); assert.match(r.aborted, /Import interrompu après 500 ligne/);
  });

  test("24. les opérations génériques n'abonnent jamais une adresse que Kolakisa tient pour désinscrite, rebondie ou supprimée", async () => {
    const zoe = consented(ctx, "zoe@exemple.fr"); consent.unsubscribe(ctx, zoe.id, { source: "preference_center" });
    m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'rebond@exemple.fr', 'bounced')").run();
    fake.reset();
    const refused = async (id, args) => assert.rejects(operations.run(ctx, id, args), (e) => e.code === "consent_blocked" && /le plus restrictif/.test(e.message));
    await refused("members.add", { params: { listId: remote.id }, body: { email_address: "zoe@exemple.fr", status: "subscribed" } });
    await refused("members.upsert", { params: { listId: remote.id, hash: "rebond@exemple.fr" }, body: { email_address: "rebond@exemple.fr", status_if_new: "subscribed" } });
    await refused("members.update", { params: { listId: remote.id, hash: "zoe@exemple.fr" }, body: { status: "subscribed" } });
    await refused("audiences.batchSubscribe", { params: { listId: remote.id }, body: { members: [{ email_address: "ok@exemple.fr", status: "subscribed" }, { email_address: "zoe@exemple.fr", status: "pending" }] } });
    assert.equal(fake.requests.length, 0, "rien n'est parti");
    await operations.run(ctx, "members.update", { params: { listId: remote.id, hash: "zoe@exemple.fr" }, body: { status: "unsubscribed" } }).catch(() => {}); // désabonner reste permis
    assert.equal(fake.requests.length, 1);
    const { BY_ID } = require("../src/marketing/mailchimp/catalog");
    assert.equal(BY_ID.has("batches.create"), false, "le lot générique, qui contourne les confirmations, n'existe plus");
  });

  test("25. profil sans champs prénom/nom : les noms locaux ne sont pas effacés ; charge trop grosse : JSON toujours valide", async () => {
    const lea = consented(ctx, "lea@exemple.fr"); contacts.updateContact(ctx, lea.id, { first_name: "Léa" });
    assert.equal((await inbound.receive(ctx, hook("profile", { email: "lea@exemple.fr", merges: { PHONE: "0102" } }, "y1"))).status, "ignored");
    assert.equal(contacts.getContact(ctx, lea.id).first_name, "Léa");
    const big = hook("subscribe", { email: "gros@exemple.fr", merges: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`F${i}`, "x".repeat(1900)])) }, "y2");
    const rec = inbound.record(ctx, inbound.parseForm(big));
    assert.doesNotThrow(() => JSON.parse(one("SELECT payload FROM mk_mc_events WHERE id = ?", rec.id).payload));
    assert.equal(JSON.parse(one("SELECT payload FROM mk_mc_events WHERE id = ?", rec.id).payload).data.truncated, true);
  });

  test("25 bis. régénérer le jeton met à jour les webhooks déjà installés chez Mailchimp", async () => {
    await sync.syncAll(ctx);
    await inbound.install(ctx, remote.id, { SITE_URL: "https://k.test" });
    const hookRow = [...fake.state.webhooks.values()][0];
    const before = hookRow.url;
    connection.rotateWebhookToken(ctx);
    const r = await inbound.refreshWebhooks(ctx, { SITE_URL: "https://k.test" });
    assert.equal(r.updated, 1);
    assert.notEqual(hookRow.url, before);
    assert.equal(hookRow.url, connection.webhookUrl(ctx, { SITE_URL: "https://k.test" }));
  });

  test("25 ter. un chemin « . » est refusé avant tout appel", async () => {
    await assert.rejects(operations.run(ctx, "campaigns.get", { params: { campaignId: "." } }), (e) => e.code === "invalid_request");
    await assert.rejects(client.createClient({ apiKey: fake.key, env: { MAILCHIMP_API_BASE: fake.base } }).request("GET", "/campaigns/."), (e) => e.code === "invalid_request");
  });
});
