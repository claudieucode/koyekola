// KOLAKISA CMS — palier 16 : Email Engine (service). Base en mémoire avec les vraies migrations : isolation par site, cohérence campagne/audience/modèle,
// segments de site, états d'abonnement par audience, événements d'e-mail dans le journal du Contact Core, import par le Contact Core, identité d'expédition.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const segments = require("../src/marketing/segments");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const tracking = require("../src/marketing/sending/tracking");
const webhooks = require("../src/marketing/sending/webhooks");
const { siteIdentity } = require("../src/marketing/sending/builder");
const imports = require("../src/marketing/import");
const { sendableSql } = require("../src/marketing/compliance/sendable");
const core = require("../src/marketing/contactcore");

let m, A, B, db, S1, S2;
const BLOCKS = [{ type: "heading", text: "Bonjour {{contact.first_name | default:\"ami\"}}" }, { type: "text", markdown: "Voici les nouveautés." }];
const draft = (name, extra = {}) => ({ name, kind: "marketing", subject: "Nouveautés", preheader: "x", blocks: BLOCKS, ...extra });
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
const one = (sql, ...a) => db.prepare(sql).get(...a);

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B; db = m.db;
  db.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha'), (1, 'Bravo'), (2, 'Autre organisation')");
  S1 = { ...A, siteScope: 1 }; S2 = { ...A, siteScope: 2 };
});

describe("isolation par site (audiences, segments, modèles, campagnes)", () => {
  test("une personne limitée au site 1 ne voit, ne modifie et ne supprime que les données du site 1", () => {
    const principal = audience.createList(A, { name: "Principale" });
    const a = audience.createList(A, { name: "Alpha liste", siteId: 1 });
    const b = audience.createList(A, { name: "Bravo liste", siteId: 2 });
    assert.deepEqual(audience.listLists(S1).map((l) => l.name), ["Alpha liste"]);
    assert.deepEqual(audience.listLists(S2).map((l) => l.name), ["Bravo liste"]);
    assert.equal(audience.listLists(A).length, 3, "l'équipe de l'organisation voit tout");
    assert.equal(audience.getList(S1, b.id), null, "IDOR : liste d'un autre site");
    assert.equal(audience.getList(S1, principal.id), null, "les données sans site ne sont pas visibles d'un site");
    assert.ok(audience.getList(S1, a.id));
    assert.equal(code(() => audience.removeFromList(S1, b.id, [1])), "not_found");
    assert.equal(code(() => audience.deleteList(S1, b.id)) === null && audience.getList(A, b.id) !== null, true, "suppression hors site sans effet");
    assert.ok(audience.getList(A, b.id), "la liste du site 2 existe toujours");
  });
  test("création dans un site : le site est imposé (jamais celui demandé) ; un site d'une autre organisation est refusé", () => {
    const l = audience.createList(S1, { name: "Forcée", siteId: 2 });
    assert.equal(l.site_id, 1);
    assert.equal(code(() => audience.createList(A, { name: "X", siteId: 3 })), "not_found");
    assert.equal(code(() => audience.createList(A, { name: "Y", siteId: "abc" })), "not_found");
    const s = segments.createSegment(S2, { name: "Seg", definition: { op: "and", rules: [{ field: "email", cmp: "contains", value: "x" }] }, siteId: 1 });
    assert.equal(s.site_id, 2);
    const t = templates.createTemplate(S1, draft("Modèle S1", { siteId: 2 }));
    assert.equal(t.site_id, 1);
  });
  test("filtre d'affichage de l'équipe (siteFilter) : un site, ou « principal »", () => {
    audience.createList(A, { name: "P" }); audience.createList(A, { name: "A1", siteId: 1 });
    assert.deepEqual(audience.listLists({ ...A, siteFilter: 1 }).map((l) => l.name), ["A1"]);
    assert.deepEqual(audience.listLists({ ...A, siteFilter: "principal" }).map((l) => l.name), ["P"]);
    templates.createTemplate(A, draft("T-principal")); templates.createTemplate(A, draft("T-alpha", { siteId: 1 }));
    assert.deepEqual(templates.listTemplates({ ...A, siteFilter: 1 }).map((t) => t.name), ["T-alpha"]);
    assert.deepEqual(templates.searchTemplates(S1, {}).map((t) => t.name), ["T-alpha"]);
  });
  test("campagne : le site est celui de l'audience ; une audience ou un segment d'un autre site est refusé ; modèle d'un autre site refusé", () => {
    const tplP = templates.createTemplate(A, draft("T-principal")), tplA = templates.createTemplate(A, draft("T-alpha", { siteId: 1 })), tplB = templates.createTemplate(A, draft("T-bravo", { siteId: 2 }));
    const listA = audience.createList(A, { name: "L-alpha", siteId: 1 }), listB = audience.createList(A, { name: "L-bravo", siteId: 2 }), listP = audience.createList(A, { name: "L-principale" });
    const c = sending.createCampaign(A, { name: "Camp A", templateId: tplA.id, targetType: "list", targetId: listA.id });
    assert.equal(c.site_id, 1, "site dérivé de l'audience");
    assert.equal(sending.createCampaign(A, { name: "Camp P", templateId: tplP.id, targetType: "list", targetId: listP.id }).site_id, null);
    // modèle de l'organisation (sans site) utilisable par un site ; modèle d'un autre site : non
    assert.ok(sending.createCampaign(A, { name: "Camp A2", templateId: tplP.id, targetType: "list", targetId: listA.id }));
    assert.match(code(() => sending.createCampaign(A, { name: "X", templateId: tplB.id, targetType: "list", targetId: listA.id })), /invalid_field/);
    assert.match(code(() => sending.createCampaign(A, { name: "Y", templateId: tplA.id, targetType: "list", targetId: listB.id, siteId: 1 })), /invalid_field/);
    assert.match(code(() => sending.createCampaign(A, { name: "Z", templateId: tplP.id, targetType: "list", targetId: listA.id, siteId: null })), /invalid_field/, "campagne sans site vers une audience de site");
    // modification : changer de cible vers un autre site est refusé
    assert.match(code(() => sending.updateCampaign(A, c.id, { targetType: "list", targetId: listB.id })), /invalid_field/);
    assert.match(code(() => sending.updateCampaign(A, c.id, { templateId: tplB.id })), /invalid_field/);
    // personne limitée à un site : ne voit que ses campagnes, ne peut cibler ni utiliser que son site
    assert.deepEqual(sending.listCampaigns(S1).map((x) => x.name).sort(), ["Camp A", "Camp A2"]);
    assert.equal(sending.getCampaign(S2, c.id), null, "IDOR : campagne d'un autre site");
    assert.equal(code(() => sending.createCampaign(S2, { name: "Intrus", templateId: tplA.id, targetType: "list", targetId: listA.id })), "not_found");
    assert.equal(sending.searchCampaigns(S1, {}).total, 2);
    assert.equal(sending.searchCampaigns(S2, {}).total, 0);
    assert.equal(sending.campaignStatusCounts(S2).all, 0);
    // duplication : même site, brouillon neuf
    const copy = sending.duplicateCampaign(A, c.id);
    assert.equal(copy.site_id, 1); assert.equal(copy.status, "draft"); assert.notEqual(copy.id, c.id);
    assert.equal(code(() => sending.duplicateCampaign(S2, c.id)), "not_found", "IDOR : dupliquer la campagne d'un autre site");
  });
  test("segment de site : n'atteint que les contacts de ce site (origine ou événement), même si ses règles sont plus larges", () => {
    const c1 = core.identify(A, { email: "a1@x.fr", siteId: 1 }).contact, c2 = core.identify(A, { email: "b1@x.fr", siteId: 2 }).contact, c3 = core.identify(A, { email: "p1@x.fr" }).contact;
    core.recordEvent(A, { type: "page.viewed", contactId: c3.id, siteId: 1 });
    const def = { op: "and", rules: [{ field: "email", cmp: "contains", value: "x.fr" }] };
    const seg = segments.createSegment(A, { name: "Tous x.fr (alpha)", definition: def, siteId: 1 });
    const got = segments.evaluateSegment(A, seg.id).rows.map((r) => r.email).sort();
    assert.deepEqual(got, ["a1@x.fr", "p1@x.fr"]);
    assert.ok(!got.includes(c2.email));
  });
  test("audience d'une campagne de site par segment : jamais un contact d'un autre site", () => {
    const x = core.identify(A, { email: "alpha@x.fr", siteId: 1 }).contact, y = core.identify(A, { email: "bravo@x.fr", siteId: 2 }).contact;
    for (const c of [x, y]) compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" });
    const seg = segments.createSegment(A, { name: "Tous abonnés (alpha)", definition: { op: "and", rules: [{ field: "status", cmp: "eq", value: "subscribed" }] }, siteId: 1 });
    const tpl = templates.createTemplate(A, draft("T"));
    const camp = sending.createCampaign(A, { name: "Seg alpha", templateId: tpl.id, targetType: "segment", targetId: seg.id });
    assert.equal(camp.site_id, 1);
    const summary = sending.audienceSummary(A, { targetType: "segment", targetId: seg.id, category: "" });
    assert.equal(summary.total ?? summary.sendable ?? summary.count, 1, JSON.stringify(summary));
  });
});

describe("états d'abonnement par audience", () => {
  test("un contact peut être abonné à une audience et désabonné d'une autre ; l'état suit les sources de vérité", () => {
    const news = audience.createList(A, { name: "Newsletter" }), photo = audience.createList(A, { name: "Photoshop" });
    const c = core.identify(A, { email: "john@x.fr" }).contact;
    assert.equal(audience.subscriptionState(A, news.id, c.id), "not_member");
    audience.addToList(A, news.id, [c.id]); audience.addToList(A, photo.id, [c.id]);
    assert.equal(audience.subscriptionState(A, news.id, c.id), "pending", "membre sans consentement = en attente, jamais abonné");
    compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" });
    assert.equal(audience.subscriptionState(A, news.id, c.id), "subscribed");
    compliance.unsubscribe(A, c.id, { scope: "list", listId: news.id, source: "lien" });
    assert.equal(audience.subscriptionState(A, news.id, c.id), "unsubscribed");
    assert.equal(audience.subscriptionState(A, photo.id, c.id), "subscribed", "l'autre audience n'est pas touchée");
    const rows = audience.subscriptionsOf(A, c.id);
    assert.deepEqual(rows.map((r) => [r.name, r.state]), [["Newsletter", "unsubscribed"], ["Photoshop", "subscribed"]]);
  });
  test("protégé : rebond, plainte, blocage manuel, fiche archivée — jamais abonné ; « abonné » ⇔ joignable (règle unique d'envoi)", () => {
    const l = audience.createList(A, { name: "L" });
    const mk = (email) => { const c = core.identify(A, { email }).contact; compliance.recordConsent(A, c.id, { source: "form", textShown: "J'accepte", ip: "" }); audience.addToList(A, l.id, [c.id]); return c; };
    const ok = mk("ok@x.fr"), blocked = mk("bloque@x.fr"), archived = mk("archive@x.fr"), unsub = mk("desinscrit@x.fr");
    compliance.addSuppression(A, { email: "bloque@x.fr", reason: "manual" });
    core.setRecordStatus(A, archived.id, "archived");
    compliance.unsubscribe(A, unsub.id, { scope: "all", source: "lien" });
    assert.equal(audience.subscriptionState(A, l.id, ok.id), "subscribed");
    assert.equal(audience.subscriptionState(A, l.id, blocked.id), "suppressed");
    assert.equal(audience.subscriptionState(A, l.id, archived.id), "suppressed");
    assert.equal(audience.subscriptionState(A, l.id, unsub.id), "unsubscribed");
    const s = sendableSql("c", { listId: l.id });
    const reachable = db.prepare(`SELECT c.id FROM mk_list_members m JOIN mk_contacts c ON c.id = m.contact_id WHERE m.list_id = ? AND ${s.sql}`).all(l.id, ...s.params).map((r) => r.id);
    const subscribed = audience.listSubscribers(A, l.id, { state: "subscribed" }).rows.map((r) => r.id);
    assert.deepEqual(subscribed.sort(), reachable.sort());
    assert.deepEqual(audience.stateCounts(A, l.id), { subscribed: 1, pending: 0, unsubscribed: 1, suppressed: 2, total: 4 });
  });
  test("liste des abonnés : filtre par état, pagination par curseur, état inconnu refusé, audience d'un autre site invisible", () => {
    const l = audience.createList(A, { name: "Grande", siteId: 1 });
    const ids = [];
    for (let i = 0; i < 7; i++) ids.push(core.identify(A, { email: `m${i}@x.fr` }).contact.id);
    audience.addToList(A, l.id, ids);
    const p1 = audience.listSubscribers(A, l.id, { state: "pending", limit: 3 });
    assert.equal(p1.rows.length, 3); assert.ok(p1.nextAfterId);
    const p2 = audience.listSubscribers(A, l.id, { state: "pending", limit: 10, afterId: p1.nextAfterId });
    assert.equal(p2.rows.length, 4); assert.equal(p2.nextAfterId, null);
    assert.equal(audience.listSubscribers(A, l.id, { state: "subscribed" }).rows.length, 0);
    assert.equal(code(() => audience.listSubscribers(A, l.id, { state: "nimporte" })), "invalid_field");
    assert.equal(code(() => audience.stateCounts(S2, l.id)), "not_found", "audience d'un autre site");
    assert.equal(audience.subscriptionsOf(S2, ids[0]).length, 0, "ses audiences d'un autre site ne sont pas listées");
  });
});

describe("événements d'e-mail dans le journal du Contact Core", () => {
  function seed() {
    const c = core.identify(A, { email: "lecteur@x.fr", siteId: 1 }).contact;
    const camp = Number(db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, sent_count, total_recipients, site_id) VALUES (1, 'Camp journal', 'list', 1, 'sent', 1, 1, 1)").run().lastInsertRowid);
    const link = Number(db.prepare("INSERT INTO mk_links (organization_id, campaign_id, url) VALUES (1, ?, 'https://ex.fr/a')").run(camp).lastInsertRowid);
    const msg = Number(db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, provider_message_id, status, sent_at) VALUES (1, ?, ?, 'lecteur@x.fr', 'resend', 're_abc', 'sent', 1)").run(camp, c.id).lastInsertRowid);
    return { c, camp, link, msg };
  }
  test("clic, ouverture, livraison, rebond et plainte : événements idempotents portant la campagne (objet) et le site", () => {
    const s = seed();
    tracking.recordClick(A, { messageId: s.msg, linkId: s.link, userAgent: "Mozilla/5.0 (iPhone)" });
    tracking.recordOpen(A, { messageId: s.msg, userAgent: "Mozilla/5.0 (Mac)" });
    webhooks.applyEvent(A, { kind: "delivered", providerMessageId: "re_abc", dedupeKey: "wh:1" });
    webhooks.applyEvent(A, { kind: "delivered", providerMessageId: "re_abc", dedupeKey: "wh:1" }); // rejoué
    webhooks.applyEvent(A, { kind: "bounced", hard: true, providerMessageId: "re_abc", dedupeKey: "wh:2" });
    const ev = db.prepare("SELECT name, object_type, object_id, site_id FROM mk_events WHERE contact_id = ? AND name LIKE 'email.%' ORDER BY id").all(s.c.id);
    assert.deepEqual(ev.map((e) => e.name), ["email.clicked", "email.opened", "email.delivered", "email.bounced"]);
    for (const e of ev) { assert.equal(e.object_type, "campaign"); assert.equal(e.object_id, String(s.camp)); assert.equal(e.site_id, 1); }
    assert.equal(core.eventsOf(A, s.c.id, { siteId: 1, type: "email.bounced" }).events.length, 1);
    // la compteur de livraison n'est pas gonflé par le webhook rejoué
    assert.equal(one("SELECT delivered_count FROM mk_campaigns WHERE id = ?", s.camp).delivered_count, 1);
    // un rebond permanent protège l'adresse
    assert.equal(audience.subscriptionState(A, audience.createList(A, { name: "Z" }).id, s.c.id), "not_member");
    assert.ok(one("SELECT 1 FROM mk_suppressions WHERE email = 'lecteur@x.fr'"));
  });
});

describe("import par le Contact Core", () => {
  test("un import normalise le téléphone, fixe le cycle de vie et l'origine, ne consent à rien, et donne à une audience de site son site d'origine", () => {
    const list = audience.createList(A, { name: "Import alpha", siteId: 1 });
    const csv = "E-mail,Prénom,Téléphone\nmarie@ex.fr,Marie,+243 81 234 5678\njean@ex.fr,Jean,\n";
    const p = imports.previewImport(A, { filename: "c.csv", data: Buffer.from(csv, "utf8") });
    const rep = imports.runImport(A, p.id, { mapping: ["email", "first_name", "phone"], options: { listId: list.id } });
    assert.equal(rep.created, 2);
    const c = one("SELECT * FROM mk_contacts WHERE email = 'marie@ex.fr'");
    assert.equal(c.normalized_phone, "+243812345678"); assert.equal(c.source, "import"); assert.equal(c.origin_site_id, 1); assert.equal(c.status, "unknown");
    assert.equal(c.source_detail, `liste:${list.id}`);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_consents").get().n, 0);
    assert.equal(audience.subscriptionState(A, list.id, c.id), "pending");
  });
});

describe("identité d'expédition par site", () => {
  const settings = (m_) => m_.A.settings;
  test("l'adresse du site est utilisée seulement si son domaine est déclaré ou celui de l'organisation ; sinon repli sur l'organisation", () => {
    const set = (k, v) => A.settings.set(1, k, v);
    set("email.from", "KOLAKISA <hello@kola.fr>");
    set("email.site_1.from_name", "Alpha"); set("email.site_1.from_address", "news@kola.fr"); set("email.site_1.reply_to", "reponse@kola.fr");
    const cfg = { from: "KOLAKISA <hello@kola.fr>", replyTo: "org@kola.fr" };
    assert.deepEqual(siteIdentity(A, { site_id: 1 }, cfg), { from: "Alpha <news@kola.fr>", replyTo: "reponse@kola.fr" });
    set("email.site_1.from_address", "news@autre-domaine.fr");
    assert.equal(siteIdentity(A, { site_id: 1 }, cfg).from, "KOLAKISA <hello@kola.fr>", "domaine non autorisé : l'identité de l'organisation est conservée");
    db.prepare("INSERT INTO mk_sending_domains (organization_id, domain, status, token) VALUES (1, 'autre-domaine.fr', 'pending', 'tok')").run();
    assert.equal(siteIdentity(A, { site_id: 1 }, cfg).from, "KOLAKISA <hello@kola.fr>", "domaine déclaré mais NON vérifié (pending) : refusé, sinon n'importe qui usurperait un domaine (audit B5)");
    db.prepare("UPDATE mk_sending_domains SET status = 'verified' WHERE domain = 'autre-domaine.fr'").run();
    assert.match(siteIdentity(A, { site_id: 1 }, cfg).from, /news@autre-domaine\.fr/, "domaine dont la propriété est prouvée : accepté");
    assert.deepEqual(siteIdentity(A, { site_id: null }, cfg), cfg, "site principal : identité de l'organisation");
    assert.deepEqual(siteIdentity(A, { site_id: 2 }, cfg), cfg, "site sans identité propre : celle de l'organisation");
    // injection d'en-têtes dans le nom
    set("email.site_2.from_name", "Pirate>\r\nBcc: x@evil.fr"); set("email.site_2.from_address", "a@kola.fr");
    const f = siteIdentity(A, { site_id: 2 }, cfg).from;
    assert.match(f, /^[^<>\r\n]+ <a@kola\.fr>$/, "une seule ligne, une seule adresse : pas d'injection d'en-tête");
    void settings;
  });
});
