// Marketing M3b/M3c — suivi (clics, ouvertures, désinscription), retours du fournisseur (webhooks signés), statistiques.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { startServer, Client } = require("./helpers");
const { signToken } = require("../src/marketing/security/tokens");
const { encryptSecret } = require("../src/marketing/security/crypto");
const { verifySvixSignature, parseResendEvent } = require("../src/marketing/sending/providers/resend");
const tracking = require("../src/marketing/sending/tracking");
const webhooks = require("../src/marketing/sending/webhooks");
const stats = require("../src/marketing/sending/stats");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");

const SECRET_BYTES = Buffer.from("secret-de-test-webhook-32-octets!");
const WH_SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const sign = (id, ts, body, secretBytes = SECRET_BYTES) => `v1,${crypto.createHmac("sha256", secretBytes).update(`${id}.${ts}.${body}`).digest("base64")}`;
const ago = (ms = 0) => Math.floor((Date.now() - ms) / 1000);

// Jeu de données commun : campagne envoyée à 2 contacts, 2 liens, messages « sent » avec identifiants fournisseur
function seed(db, orgId = 1) {
  db.exec("INSERT OR IGNORE INTO mk_organizations (id, name, slug) VALUES (1, 'A', 'a'), (2, 'B', 'b')");
  const contact = (email, status = "subscribed") => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, ?, ?)").run(orgId, email, status).lastInsertRowid);
  const c1 = contact(`c1-${Math.random().toString(36).slice(2, 7)}@ex.fr`), c2 = contact(`c2-${Math.random().toString(36).slice(2, 7)}@ex.fr`);
  const camp = Number(db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, sent_count, total_recipients) VALUES (?, ?, 'list', 1, 'sent', 2, 2)").run(orgId, `C-${Math.random().toString(36).slice(2, 8)}`).lastInsertRowid);
  const link1 = Number(db.prepare("INSERT INTO mk_links (organization_id, campaign_id, url) VALUES (?, ?, 'https://ex.fr/a')").run(orgId, camp).lastInsertRowid);
  const link2 = Number(db.prepare("INSERT INTO mk_links (organization_id, campaign_id, url) VALUES (?, ?, 'https://ex.fr/b?x=1&y=2')").run(orgId, camp).lastInsertRowid);
  const msg = (cid, email, pid) => Number(db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, provider_message_id, status, sent_at) VALUES (?, ?, ?, ?, 'resend', ?, 'sent', ?)").run(orgId, camp, cid, email, pid, Date.now()).lastInsertRowid);
  const emailOf = (id) => db.prepare("SELECT email FROM mk_contacts WHERE id = ?").get(id).email;
  const m1 = msg(c1, emailOf(c1), `re_${Math.random().toString(36).slice(2, 8)}`), m2 = msg(c2, emailOf(c2), `re_${Math.random().toString(36).slice(2, 8)}`);
  return { c1, c2, camp, link1, link2, m1, m2, pid1: db.prepare("SELECT provider_message_id p FROM mk_messages WHERE id = ?").get(m1).p };
}
const row = (db, sql, ...a) => db.prepare(sql).get(...a);

describe("suivi : service", () => {
  let m, ctx, s;
  beforeEach(() => { m = freshMarketing(); ctx = m.A; s = seed(m.db); });
  test("clic : destination lue en base, événement, compteurs (total et uniques par message)", () => {
    assert.equal(tracking.recordClick(ctx, { messageId: s.m1, linkId: s.link2, userAgent: "Mozilla/5.0 (iPhone)" }), "https://ex.fr/b?x=1&y=2");
    tracking.recordClick(ctx, { messageId: s.m1, linkId: s.link2, userAgent: "Mozilla/5.0" });
    tracking.recordClick(ctx, { messageId: s.m2, linkId: s.link2, userAgent: "Mozilla/5.0" });
    const c = row(m.db, "SELECT click_count, unique_click_count FROM mk_campaigns WHERE id = ?", s.camp);
    assert.deepEqual([c.click_count, c.unique_click_count], [3, 2]);
    const l = row(m.db, "SELECT click_count, unique_click_count FROM mk_links WHERE id = ?", s.link2);
    assert.deepEqual([l.click_count, l.unique_click_count], [3, 2]);
    const msg = row(m.db, "SELECT click_count, first_click_at FROM mk_messages WHERE id = ?", s.m1);
    assert.equal(msg.click_count, 2);
    assert.ok(msg.first_click_at);
    assert.equal(row(m.db, "SELECT COUNT(*) n FROM mk_message_events WHERE type = 'clicked'").n, 3);
  });
  test("robots (antivirus, aperçus de liens, absence de navigateur) : événement gardé, statistiques inchangées, redirection quand même", () => {
    for (const ua of ["", undefined, "curl/8.0", "Mozilla/5.0 (compatible; Googlebot/2.1)", "python-requests/2.31", "Mozilla/5.0 HeadlessChrome/120"]) {
      assert.equal(tracking.recordClick(ctx, { messageId: s.m1, linkId: s.link1, userAgent: ua }), "https://ex.fr/a");
    }
    assert.equal(row(m.db, "SELECT click_count FROM mk_campaigns WHERE id = ?", s.camp).click_count, 0);
    assert.equal(row(m.db, "SELECT COUNT(*) n FROM mk_message_events WHERE type = 'clicked' AND bot = 1").n, 6);
  });
  test("le lien doit appartenir à la campagne du message ; lien d'une autre organisation : rien", () => {
    const other = seed(m.db, 2);
    assert.equal(tracking.recordClick(ctx, { messageId: s.m1, linkId: other.link1, userAgent: "Mozilla/5.0" }), null);
    assert.equal(tracking.recordClick(ctx, { messageId: s.m1, linkId: 999999, userAgent: "Mozilla/5.0" }), null);
    // message d'une autre campagne : la redirection reste possible (le lien existe) mais aucun événement n'est attribué à tort
    const twin = seed(m.db, 1);
    assert.equal(tracking.recordClick(ctx, { messageId: twin.m1, linkId: s.link1, userAgent: "Mozilla/5.0" }), "https://ex.fr/a");
    assert.equal(row(m.db, "SELECT click_count FROM mk_campaigns WHERE id = ?", twin.camp).click_count, 0);
  });
  test("message effacé (contact supprimé) : le lien continue de rediriger, sans rien enregistrer", () => {
    m.db.prepare("DELETE FROM mk_messages WHERE id = ?").run(s.m1);
    assert.equal(tracking.recordClick(ctx, { messageId: s.m1, linkId: s.link1, userAgent: "Mozilla/5.0" }), "https://ex.fr/a");
    assert.equal(row(m.db, "SELECT click_count FROM mk_campaigns WHERE id = ?", s.camp).click_count, 0);
  });
  test("ouverture : première ouverture = unique ; robots ignorés dans les chiffres", () => {
    tracking.recordOpen(ctx, { messageId: s.m1, userAgent: "Mozilla/5.0" });
    tracking.recordOpen(ctx, { messageId: s.m1, userAgent: "Mozilla/5.0" });
    tracking.recordOpen(ctx, { messageId: s.m1, userAgent: "curl/8" });
    const c = row(m.db, "SELECT open_count, unique_open_count FROM mk_campaigns WHERE id = ?", s.camp);
    assert.deepEqual([c.open_count, c.unique_open_count], [2, 1]);
    assert.equal(row(m.db, "SELECT last_open_at FROM mk_contacts WHERE id = ?", s.c1).last_open_at !== null, true);
  });
  test("désinscription attribuée à la campagne : une seule fois par message", () => {
    assert.equal(tracking.recordUnsubscribe(ctx, { messageId: s.m1 }), true);
    assert.equal(tracking.recordUnsubscribe(ctx, { messageId: s.m1 }), false);
    assert.equal(row(m.db, "SELECT unsubscribed_count FROM mk_campaigns WHERE id = ?", s.camp).unsubscribed_count, 1);
    assert.equal(tracking.recordUnsubscribe(m.B, { messageId: s.m2 }), false, "autre organisation");
  });
  test("le clic met à jour last_click_at du contact", () => {
    tracking.recordClick(ctx, { messageId: s.m1, linkId: s.link1, userAgent: "Mozilla/5.0" });
    assert.ok(row(m.db, "SELECT last_click_at FROM mk_contacts WHERE id = ?", s.c1).last_click_at);
  });
});

describe("signature des webhooks (Svix / Resend)", () => {
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "re_1" } });
  const headers = (id, ts, sig) => ({ "svix-id": id, "svix-timestamp": String(ts), "svix-signature": sig });
  test("signature valide acceptée ; plusieurs signatures (rotation de secret) : une bonne suffit", () => {
    const ts = ago();
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", ts, sign("m1", ts, body)), secret: WH_SECRET }), true);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", ts, `v1,AAAA ${sign("m1", ts, body)}`), secret: WH_SECRET }), true);
  });
  test("refus : corps modifié, autre secret, identifiant modifié, horodatage périmé ou futur, en-têtes absents, secret invalide", () => {
    const ts = ago();
    const good = sign("m1", ts, body);
    assert.equal(verifySvixSignature({ rawBody: body + " ", headers: headers("m1", ts, good), secret: WH_SECRET }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", ts, sign("m1", ts, body, Buffer.from("autre"))), secret: WH_SECRET }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m2", ts, good), secret: WH_SECRET }), false);
    const old = ago(10 * 60000);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", old, sign("m1", old, body)), secret: WH_SECRET }), false);
    const future = ago(-10 * 60000);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", future, sign("m1", future, body)), secret: WH_SECRET }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: {}, secret: WH_SECRET }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", ts, "v2,xxx"), secret: WH_SECRET }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", ts, good), secret: "" }), false);
    assert.equal(verifySvixSignature({ rawBody: body, headers: headers("m1", "pas-un-nombre", good), secret: WH_SECRET }), false);
  });
  test("analyse des événements : livré, rebond permanent/temporaire, plainte ; le reste ignoré", () => {
    const p = (type, extra = {}) => parseResendEvent({ type, created_at: "2027-01-15T08:00:00Z", data: { email_id: "re_9", ...extra } });
    assert.deepEqual([p("email.delivered").kind, p("email.delivered").providerMessageId], ["delivered", "re_9"]);
    assert.deepEqual([p("email.bounced", { bounce: { type: "Permanent" } }).kind, p("email.bounced", { bounce: { type: "Permanent" } }).hard], ["bounced", true]);
    assert.equal(p("email.bounced", { bounce: { type: "Transient" } }).hard, false);
    assert.equal(p("email.bounced", {}).hard, false, "type inconnu : jamais de suppression à tort");
    assert.equal(p("email.complained").kind, "complained");
    for (const t of ["email.opened", "email.clicked", "email.sent", "email.delivery_delayed", "domain.updated"]) assert.equal(p(t).kind, "ignored", t);
    assert.equal(parseResendEvent({ type: "email.delivered", data: {} }).kind, "ignored");
    assert.equal(parseResendEvent(null).kind, "ignored");
  });
});

describe("retours du fournisseur : effets", () => {
  let m, ctx, s;
  beforeEach(() => { m = freshMarketing(); ctx = m.A; s = seed(m.db); });
  const event = (kind, over = {}) => ({ kind, providerMessageId: s.pid1, hard: false, at: Date.now(), dedupeKey: `wh:${Math.random()}`, ...over });
  test("livré : statut, date, compteur ; rejeu identique sans effet", () => {
    const e = event("delivered", { dedupeKey: "wh:same" });
    assert.equal(webhooks.applyEvent(ctx, e), "applied");
    assert.equal(webhooks.applyEvent(ctx, e), "duplicate");
    assert.equal(row(m.db, "SELECT status FROM mk_messages WHERE id = ?", s.m1).status, "delivered");
    assert.equal(row(m.db, "SELECT delivered_count FROM mk_campaigns WHERE id = ?", s.camp).delivered_count, 1);
  });
  test("rebond permanent : message « bounced », contact « bounced », liste de suppression, compteur", () => {
    assert.equal(webhooks.applyEvent(ctx, event("bounced", { hard: true })), "applied");
    assert.equal(row(m.db, "SELECT status FROM mk_messages WHERE id = ?", s.m1).status, "bounced");
    assert.equal(row(m.db, "SELECT status FROM mk_contacts WHERE id = ?", s.c1).status, "bounced");
    assert.equal(row(m.db, "SELECT reason FROM mk_suppressions WHERE email = (SELECT email FROM mk_contacts WHERE id = ?)", s.c1).reason, "bounced");
    assert.equal(row(m.db, "SELECT bounced_count FROM mk_campaigns WHERE id = ?", s.camp).bounced_count, 1);
  });
  test("rebond temporaire : enregistré, MAIS pas de suppression ni de changement du contact", () => {
    webhooks.applyEvent(ctx, event("bounced", { hard: false }));
    assert.equal(row(m.db, "SELECT status FROM mk_contacts WHERE id = ?", s.c1).status, "subscribed");
    assert.equal(row(m.db, "SELECT COUNT(*) n FROM mk_suppressions").n, 0);
    assert.equal(row(m.db, "SELECT COUNT(*) n FROM mk_message_events WHERE type = 'bounced'").n, 1);
  });
  test("plainte : contact « complained », suppression, compteur, jamais réabonnable", () => {
    webhooks.applyEvent(ctx, event("complained"));
    assert.equal(row(m.db, "SELECT status FROM mk_contacts WHERE id = ?", s.c1).status, "complained");
    assert.equal(row(m.db, "SELECT complained_count FROM mk_campaigns WHERE id = ?", s.camp).complained_count, 1);
    assert.equal(compliance.recordConsent(ctx, s.c1, { source: "form", textShown: "Je veux me réabonner" }).ok, false);
  });
  test("message inconnu, ignoré, ou d'une autre organisation : sans effet ni erreur", () => {
    assert.equal(webhooks.applyEvent(ctx, event("delivered", { providerMessageId: "re_inconnu" })), "unknown_message");
    assert.equal(webhooks.applyEvent(ctx, event("ignored")), "ignored");
    assert.equal(webhooks.applyEvent(m.B, event("bounced", { hard: true })), "unknown_message");
    assert.equal(row(m.db, "SELECT status FROM mk_contacts WHERE id = ?", s.c1).status, "subscribed");
  });
  test("ordre inversé : un « livré » tardif n'écrase pas un rebond ou une plainte", () => {
    webhooks.applyEvent(ctx, event("bounced", { hard: true }));
    webhooks.applyEvent(ctx, event("delivered"));
    assert.equal(row(m.db, "SELECT status FROM mk_messages WHERE id = ?", s.m1).status, "bounced");
  });
});

describe("statistiques d'une campagne", () => {
  test("compteurs, taux (avec dénominateur explicite), liens, alertes de délivrabilité, limites annoncées", () => {
    const m = freshMarketing(); const ctx = m.A; const s = seed(m.db);
    m.db.prepare("UPDATE mk_campaigns SET sent_count = 200, delivered_count = 190, bounced_count = 6, complained_count = 1, unsubscribed_count = 2, unique_click_count = 40, click_count = 55, unique_open_count = 80, open_count = 120 WHERE id = ?").run(s.camp);
    m.db.prepare("UPDATE mk_links SET click_count = 30, unique_click_count = 25 WHERE id = ?").run(s.link1);
    const r = stats.campaignStats(ctx, s.camp);
    assert.deepEqual([r.counts.sent, r.counts.delivered, r.counts.bounced, r.counts.uniqueClicks, r.counts.uniqueOpens], [200, 190, 6, 40, 80]);
    assert.equal(r.rates.bounce, 3);
    assert.equal(r.rates.complaint, 0.5);
    assert.equal(r.rates.click, 20);
    assert.equal(r.rates.unsubscribe, 1);
    assert.equal(r.links[0].url, "https://ex.fr/a");
    assert.equal(r.links[0].uniqueClicks, 25);
    assert.ok(r.alerts.some((a) => a.code === "bounce_high"));
    assert.ok(r.alerts.some((a) => a.code === "complaint_high"));
    assert.ok(r.notes.some((n) => /Apple/.test(n)), "limite du suivi d'ouverture annoncée");
  });
  test("aucun envoi : taux nuls sans division par zéro ; autre organisation : introuvable", () => {
    const m = freshMarketing(); const s = seed(m.db);
    m.db.prepare("UPDATE mk_campaigns SET sent_count = 0 WHERE id = ?").run(s.camp);
    assert.deepEqual(Object.values(stats.campaignStats(m.A, s.camp).rates), [0, 0, 0, 0, 0, 0]);
    assert.throws(() => stats.campaignStats(m.B, s.camp), (e) => e.code === "not_found");
  });
});

describe("routes publiques /t/… et /webhooks/… (serveur réel)", () => {
  let srv, anon, s;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const clickUrl = (m, l) => `/t/c/${signToken({ o: 1, m, l, k: "click" }, TEST_KEY)}`;
  const openUrl = (m) => `/t/o/${signToken({ o: 1, m, k: "open" }, TEST_KEY)}.gif`;
  const wh = (client, body, { id = `m-${Math.random()}`, ts = ago(), secret = SECRET_BYTES, org = 1 } = {}) =>
    client.request(`/webhooks/email/resend/${org}`, { method: "POST", headers: { "content-type": "application/json", "svix-id": id, "svix-timestamp": String(ts), "svix-signature": sign(id, ts, body, secret) }, form: undefined, multipart: body });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY });
    anon = new Client(srv.base);
    const db = srv.db();
    s = seed(db);
    db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (1, 'email.webhook_secret', ?, 1)").run(encryptSecret(WH_SECRET, TEST_KEY, "1:email.webhook_secret"));
    db.close();
  });
  after(() => srv.stop());

  test("clic : redirection 302 vers l'adresse LUE EN BASE, en-têtes de confidentialité, compteurs", async () => {
    const r = await anon.get(clickUrl(s.m1, s.link2), { headers: { "user-agent": "Mozilla/5.0 (Macintosh)" } });
    assert.equal(r.status, 302);
    assert.equal(r.location, "https://ex.fr/b?x=1&y=2");
    assert.equal(r.headers.get("referrer-policy"), "no-referrer");
    assert.match(r.headers.get("cache-control"), /no-store|no-cache/);
    assert.equal(q("SELECT click_count, unique_click_count FROM mk_campaigns WHERE id = ?", s.camp)[0].click_count, 1);
  });
  test("clic d'un robot : redirigé, non compté", async () => {
    const before = q("SELECT click_count FROM mk_campaigns WHERE id = ?", s.camp)[0].click_count;
    const r = await anon.get(clickUrl(s.m2, s.link1), { headers: { "user-agent": "curl/8.0" } });
    assert.equal(r.status, 302);
    assert.equal(q("SELECT click_count FROM mk_campaigns WHERE id = ?", s.camp)[0].click_count, before);
  });
  test("jetons invalides, falsifiés, d'un autre type ou avec un autre lien : 404 neutre, jamais de redirection", async () => {
    const good = clickUrl(s.m1, s.link1);
    const forged = `/t/c/${Buffer.from(JSON.stringify({ o: 1, m: s.m1, l: s.link2, k: "click" })).toString("base64url")}.${good.split(".")[1]}`;
    for (const url of ["/t/c/abc.def", "/t/c/", forged, `/t/c/${signToken({ o: 1, m: s.m1, l: s.link1, k: "open" }, TEST_KEY)}`, `/t/c/${signToken({ o: 1, m: s.m1, l: s.link1, k: "click" }, "f".repeat(64))}`]) {
      const r = await anon.get(url);
      assert.equal(r.status, 404, url.slice(0, 30));
      assert.equal(r.location, null);
    }
  });
  test("aucune redirection ouverte : impossible de fournir une destination dans l'adresse", async () => {
    const r = await anon.get(`${clickUrl(s.m1, s.link1)}?url=https://evil.example&to=https://evil.example`);
    assert.equal(r.location, "https://ex.fr/a");
  });
  test("pixel d'ouverture : GIF transparent, jamais d'erreur (même jeton invalide), pas de cache", async () => {
    const r = await anon.get(openUrl(s.m1), { headers: { "user-agent": "Mozilla/5.0" } });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "image/gif");
    assert.match(r.headers.get("cache-control"), /no-store|no-cache/);
    assert.equal(q("SELECT unique_open_count FROM mk_campaigns WHERE id = ?", s.camp)[0].unique_open_count, 1);
    const bad = await anon.get("/t/o/n-importe-quoi.gif");
    assert.equal(bad.status, 200);
    assert.equal(bad.headers.get("content-type"), "image/gif");
  });
  test("désinscription depuis le lien d'un message : attribuée à la campagne", async () => {
    const tok = compliance.unsubscribeToken({ organizationId: 1 }, s.c2, TEST_KEY, { messageId: s.m2 });
    const r = await anon.post(`/u/${tok}`, {});
    assert.equal(r.status, 200);
    assert.equal(q("SELECT unsubscribed_count FROM mk_campaigns WHERE id = ?", s.camp)[0].unsubscribed_count, 1);
    assert.equal(q("SELECT status FROM mk_contacts WHERE id = ?", s.c2)[0].status, "unsubscribed");
    await anon.post(`/u/${tok}`, {});
    assert.equal(q("SELECT unsubscribed_count FROM mk_campaigns WHERE id = ?", s.camp)[0].unsubscribed_count, 1);
  });

  test("webhook signé : livré puis rebond permanent → suppression ; rejeu sans effet", async () => {
    const delivered = JSON.stringify({ type: "email.delivered", created_at: new Date().toISOString(), data: { email_id: s.pid1 } });
    const ok = await wh(anon, delivered, { id: "evt-1" });
    assert.equal(ok.status, 200);
    await wh(anon, delivered, { id: "evt-1" });
    assert.equal(q("SELECT delivered_count FROM mk_campaigns WHERE id = ?", s.camp)[0].delivered_count, 1);
    const bounce = JSON.stringify({ type: "email.bounced", created_at: new Date().toISOString(), data: { email_id: s.pid1, bounce: { type: "Permanent" } } });
    assert.equal((await wh(anon, bounce, { id: "evt-2" })).status, 200);
    assert.equal(q("SELECT status FROM mk_contacts WHERE id = ?", s.c1)[0].status, "bounced");
    assert.equal(q("SELECT COUNT(*) n FROM mk_suppressions WHERE reason = 'bounced'")[0].n, 1);
  });
  test("webhook refusé : mauvaise signature, horodatage périmé, corps non JSON, organisation inconnue ou sans secret", async () => {
    const body = JSON.stringify({ type: "email.complained", data: { email_id: s.pid1 } });
    assert.equal((await wh(anon, body, { secret: Buffer.from("mauvais") })).status, 400);
    assert.equal((await wh(anon, body, { ts: ago(3600000) })).status, 400);
    assert.equal((await wh(anon, "pas du json")).status, 400);
    assert.equal((await wh(anon, body, { org: 2 })).status, 404);
    assert.equal((await wh(anon, body, { org: 999 })).status, 404);
    assert.equal((await anon.get("/webhooks/email/resend/1")).status, 404);
    assert.equal(q("SELECT COUNT(*) n FROM mk_suppressions WHERE reason = 'complained'")[0].n, 0, "aucun effet sans signature valide");
  });
  test("webhook pour un message inconnu : 200 (pas de tempête de renvois) sans effet", async () => {
    const body = JSON.stringify({ type: "email.bounced", data: { email_id: "re_inconnu", bounce: { type: "Permanent" } } });
    assert.equal((await wh(anon, body)).status, 200);
  });
});
