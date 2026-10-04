// Marketing — heure d'envoi (point 4 de la parité Mailchimp) : envoi à l'heure locale de chaque contact (« Timewarp ») et
// à la meilleure heure de chaque contact d'après son historique réel (« Send Time Optimization »).
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const forms = require("../src/marketing/forms");
const st = require("../src/marketing/sending/sendtime");
const { createProvider } = require("../src/marketing/sending/providers");
const { startServer, Client, loginInstructor } = require("./helpers");

const DAY = 86400000;
const HOUR = 3600000;
const iso = (t) => new Date(t).toISOString().slice(0, 16);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const ymd = (t) => new Date(t).toISOString().slice(0, 10);

describe("fuseaux : conversions et déduction", () => {
  test("même heure de l'horloge dans chaque fuseau, heures d'été/hiver comprises", () => {
    assert.equal(iso(st.zonedToUtc("2026-10-05", 9, 0, "Europe/Paris")), "2026-10-05T07:00", "heure d'été");
    assert.equal(iso(st.zonedToUtc("2026-12-05", 9, 0, "Europe/Paris")), "2026-12-05T08:00", "heure d'hiver");
    assert.equal(iso(st.zonedToUtc("2026-10-05", 9, 0, "Africa/Kinshasa")), "2026-10-05T08:00");
    assert.equal(iso(st.zonedToUtc("2026-10-05", 9, 0, "Africa/Lubumbashi")), "2026-10-05T07:00", "la RD Congo a deux fuseaux");
    assert.equal(iso(st.zonedToUtc("2026-10-05", 9, 0, "Pacific/Kiritimati")), "2026-10-04T19:00", "fuseau le plus en avance du monde");
    assert.equal(iso(st.zonedToUtc("2026-03-29", 2, 30, "Europe/Paris")), "2026-03-29T01:30", "heure inexistante (passage à l'heure d'été) : l'heure juste après");
  });
  test("pays : seulement ceux à fuseau unique ; fuseau invalide refusé", () => {
    assert.equal(st.countryTimeZone("France"), "Europe/Paris");
    assert.equal(st.countryTimeZone("cg"), "Africa/Brazzaville");
    assert.equal(st.countryTimeZone("Côte d'Ivoire"), "Africa/Abidjan");
    assert.equal(st.countryTimeZone("CD"), "", "RD Congo : deux fuseaux, jamais deviné");
    assert.equal(st.countryTimeZone("Canada"), "");
    for (const bad of ["Mars/Base", "x\"><script>", "", "Europe/../../etc"]) assert.equal(st.isTimeZone(bad), false, bad);
    assert.equal(st.isTimeZone("America/Argentina/Buenos_Aires"), true);
  });
});

describe("envoi à l'heure locale et à la meilleure heure (moteur)", () => {
  let m, A, list, tpl, provider;
  const add = (email, { tz = "", country = "" } = {}) => {
    const { contact } = audience.upsertContact(A, { email, country, ...(tz ? { timezone: tz } : {}) });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "Oui, je veux recevoir les e-mails" });
    audience.addToList(A, list.id, [contact.id]);
    return contact;
  };
  const campaign = (name = `C${Math.random()}`) => sending.createCampaign(A, { name, templateId: tpl.id, targetType: "list", targetId: list.id });
  const rec = (cid, email) => m.db.prepare("SELECT r.* FROM mk_campaign_recipients r WHERE r.campaign_id = ? AND r.email = ?").get(cid, email);
  beforeEach(() => {
    m = freshMarketing(); A = m.A;
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    tpl = templates.createTemplate(A, { name: "T", kind: "marketing", subject: "Bonjour", blocks: [{ type: "text", markdown: "Bonjour" }] });
    list = audience.createList(A, { name: "L" });
    provider = createProvider({ provider: "console" }, { log: quiet });
  });

  test("heure locale : chaque destinataire à 9 h chez lui ; ordre des sources contact → compte → pays → défaut", async () => {
    m.db.exec("ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT ''");
    const uid = Number(m.db.prepare("INSERT INTO users (username, email, timezone) VALUES ('el', 'eleve@ex.fr', 'America/New_York')").run().lastInsertRowid);
    add("kin@ex.fr", { tz: "Africa/Kinshasa", country: "France" }); // le fuseau du contact prime sur le pays
    const el = add("eleve@ex.fr");
    m.db.prepare("UPDATE mk_contacts SET lms_user_id = ? WHERE id = ?").run(uid, el.id);
    add("fr@ex.fr", { country: "France" });
    add("rdc@ex.fr", { country: "CD" }); // ambigu → fuseau par défaut
    st.setOrgTimeZone(A, "Africa/Lubumbashi");
    const c = campaign();
    const day = ymd(T0 + 3 * DAY);
    const r = sending.startCampaign(A, c.id, { sendMode: "local", sendDate: day, sendTime: "09:00", now: T0 });
    assert.equal(r.recipients, 4);
    const at = (email) => rec(c.id, email);
    assert.deepEqual([at("kin@ex.fr").send_tz, at("kin@ex.fr").send_basis], ["Africa/Kinshasa", "contact"]);
    assert.deepEqual([at("eleve@ex.fr").send_tz, at("eleve@ex.fr").send_basis], ["America/New_York", "account"]);
    assert.deepEqual([at("fr@ex.fr").send_tz, at("fr@ex.fr").send_basis], ["Europe/Paris", "country"]);
    assert.deepEqual([at("rdc@ex.fr").send_tz, at("rdc@ex.fr").send_basis], ["Africa/Lubumbashi", "default"]);
    for (const e of ["kin@ex.fr", "eleve@ex.fr", "fr@ex.fr", "rdc@ex.fr"]) {
      assert.equal(at(e).next_attempt_at, st.zonedToUtc(day, 9, 0, at(e).send_tz), `${e} : 9 h dans son fuseau`);
    }
    const camp = sending.getCampaign(A, c.id);
    assert.equal(camp.send_mode, "local");
    assert.equal(camp.scheduled_at, Math.min(...["kin@ex.fr", "eleve@ex.fr", "fr@ex.fr", "rdc@ex.fr"].map((e) => at(e).next_attempt_at)));

    // Envoi réel : personne n'est servi avant son heure ; chacun l'est à son heure
    let now = camp.scheduled_at;
    let res = await sending.dispatchBatch(A, c.id, { provider, now });
    assert.ok(!provider.sent.map((x) => x.to).includes("eleve@ex.fr"), "New York pas encore");
    for (let guard = 0; !res.done && guard < 20; guard++) {
      now += res.waitMs || 0; // le moteur indique lui-même combien attendre avant la prochaine heure due
      res = await sending.dispatchBatch(A, c.id, { provider, now });
    }
    assert.equal(provider.sent.length, 4);
    const sentAt = m.db.prepare("SELECT email, sent_at FROM mk_messages").all();
    for (const s of sentAt) assert.ok(s.sent_at >= rec(c.id, s.email).next_attempt_at, `${s.email} : jamais avant son heure`);
  });

  test("heure déjà passée dans certains fuseaux : refus clair, rien n'est lancé ; test A/B : refusé", () => {
    add("kiri@ex.fr", { tz: "Pacific/Kiritimati" });
    add("ny@ex.fr", { tz: "America/New_York" });
    const c = campaign();
    const today = ymd(T0);
    assert.equal(code(() => sending.startCampaign(A, c.id, { sendMode: "local", sendDate: today, sendTime: "00:30", now: T0 })), "too_early");
    assert.equal(sending.getCampaign(A, c.id).status, "draft");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_campaign_recipients").get().n, 0, "aucun destinataire figé");
    assert.equal(code(() => sending.startCampaign(A, c.id, { sendMode: "local", sendDate: "2026-02-30", sendTime: "09:00", now: T0 })), "invalid_field");
    assert.equal(code(() => sending.startCampaign(A, c.id, { sendMode: "local", sendDate: ymd(T0 + 3 * DAY), sendTime: "25:00", now: T0 })), "invalid_field");
  });

  test("meilleure heure : heure personnelle (≥ 3 engagements, robots exclus), sinon heure de l'audience, dans les 24 h du jour choisi", () => {
    st.setOrgTimeZone(A, "Europe/Paris");
    const fan = add("fan@ex.fr", { tz: "Africa/Kinshasa" });
    const others = Array.from({ length: 6 }, (_, i) => add(`o${i}@ex.fr`, { tz: "Europe/Paris" }));
    const fresh = add("nouveau@ex.fr", { tz: "America/New_York" });
    // Historique : anciennes campagnes, une ouverture par message, à des heures locales choisies
    let n = 0;
    const engage = (contact, tz, localHourValue, { bot = 0 } = {}) => {
      const past = sending.createCampaign(A, { name: `Ancienne ${++n}`, templateId: tpl.id, targetType: "list", targetId: list.id });
      const mid = Number(m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, status) VALUES (1, ?, ?, ?, 'sent')").run(past.id, contact.id, contact.email).lastInsertRowid);
      const at = st.zonedToUtc(ymd(T0 - 10 * DAY - n * HOUR), localHourValue, 15, tz);
      m.db.prepare("INSERT INTO mk_message_events (organization_id, message_id, campaign_id, type, bot, occurred_at) VALUES (1, ?, ?, 'opened', ?, ?)").run(mid, past.id, bot, at);
    };
    for (let i = 0; i < 4; i++) engage(fan, "Africa/Kinshasa", 21);
    for (let i = 0; i < 5; i++) engage(fan, "Africa/Kinshasa", 6, { bot: 1 }); // ouvertures de robots : ignorées
    for (const o of others) for (let i = 0; i < 3; i++) engage(o, "Europe/Paris", 8);
    const c = campaign("Optimisée");
    const day = ymd(T0 + 3 * DAY);
    const r = sending.startCampaign(A, c.id, { sendMode: "optimized", sendDate: day, now: T0 });
    assert.equal(r.plan.audienceHour, 8, "heure la plus active de l'audience");
    const at = (e) => rec(c.id, e);
    assert.equal(st.localHour(at("fan@ex.fr").next_attempt_at, "Africa/Kinshasa"), 21, "son heure à lui, robots exclus");
    assert.equal(at("fan@ex.fr").send_basis, "contact:history");
    assert.equal(st.localHour(at("nouveau@ex.fr").next_attempt_at, "America/New_York"), 8, "sans historique : heure de l'audience, dans son fuseau");
    assert.equal(at("nouveau@ex.fr").send_basis, "contact:audience");
    const start = st.zonedToUtc(day, 0, 0, "Europe/Paris");
    for (const row of m.db.prepare("SELECT next_attempt_at FROM mk_campaign_recipients WHERE campaign_id = ?").all(c.id)) {
      assert.ok(row.next_attempt_at >= start && row.next_attempt_at < start + DAY, "dans les 24 h du jour choisi");
    }
    void fresh;
  });

  test("meilleure heure sans historique suffisant : indisponible (comme Mailchimp), aucun lancement", () => {
    add("a@ex.fr"); add("b@ex.fr");
    const c = campaign();
    assert.equal(code(() => sending.startCampaign(A, c.id, { sendMode: "optimized", sendDate: ymd(T0 + 3 * DAY), now: T0 })), "not_enough_data");
    assert.equal(sending.getCampaign(A, c.id).status, "draft");
    assert.equal(code(() => sending.startCampaign(A, c.id, { sendMode: "optimized", sendDate: ymd(T0), now: T0 })), "too_early", "journée déjà commencée");
    const preview = st.sendTimePreview(A, m.db.prepare("SELECT id FROM mk_contacts").all().map((r) => r.id), T0);
    assert.equal(preview.optimizedReady, false);
  });

  test("fiche contact et formulaires : fuseau valide enregistré, invalide refusé (fiche) ou ignoré (formulaire)", () => {
    const c = add("x@ex.fr");
    audience.updateContact(A, c.id, { timezone: "Africa/Kinshasa" });
    assert.equal(audience.getContact(A, c.id).timezone, "Africa/Kinshasa");
    assert.equal(code(() => audience.updateContact(A, c.id, { timezone: "Lune/Base" })), "invalid_field");
    const f = forms.createForm(A, { name: "Lettre", fields: [], consentText: "Oui, envoyez-moi la lettre." });
    forms.setStatus(A, f.id, "published");
    forms.submitForm(A, f.id, { email: "form@ex.fr", tz: "America/Port-au-Prince" });
    forms.submitForm(A, f.id, { email: "bad@ex.fr", tz: "<script>" });
    assert.equal(audience.findByEmail(A, "form@ex.fr").timezone, "America/Port-au-Prince");
    assert.equal(audience.findByEmail(A, "bad@ex.fr").timezone, "", "fuseau invalide ignoré, inscription acceptée");
  });
});

describe("heure d'envoi : pages et comptes", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("inscription et connexion : fuseau du navigateur enregistré (valide seulement), mis à jour à la connexion", async () => {
    const v = new Client(srv.base);
    await v.post("/inscription", { username: "tzuser", email: "tz@test.local", password: "MotDePasseEleve123", tz: "Africa/Kinshasa" });
    const db = srv.db();
    assert.equal(db.prepare("SELECT timezone FROM users WHERE email = 'tz@test.local'").get().timezone, "Africa/Kinshasa");
    const w = new Client(srv.base);
    await w.post("/connexion", { email: "tz@test.local", password: "MotDePasseEleve123", tz: "Europe/Paris" });
    assert.equal(db.prepare("SELECT timezone FROM users WHERE email = 'tz@test.local'").get().timezone, "Europe/Paris");
    await new Client(srv.base).post("/connexion", { email: "tz@test.local", password: "MotDePasseEleve123", tz: "\"><img src=x>" });
    assert.equal(db.prepare("SELECT timezone FROM users WHERE email = 'tz@test.local'").get().timezone, "Europe/Paris", "valeur invalide ignorée");
    assert.match((await new Client(srv.base).get("/connexion")).text, /name="tz" data-tz/);
  });

  test("fenêtre d'envoi : choix « heure locale » → campagne programmée par fuseau, résumée dans le rapport", async () => {
    const db = srv.db();
    db.exec("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Fuseaux')");
    const listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Fuseaux'").get().id;
    for (const [email, tz] of [["k@ex.fr", "Africa/Kinshasa"], ["p@ex.fr", "Europe/Paris"], ["n@ex.fr", "America/New_York"]]) {
      const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, status, timezone) VALUES (1, ?, 'subscribed', ?)").run(email, tz).lastInsertRowid);
      db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'Oui')").run(id);
      db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(listId, id);
    }
    db.prepare("INSERT OR REPLACE INTO mk_settings (organization_id, key, value) VALUES (1, 'org.address', '12 rue des Écoles')").run();
    const tplId = Number((await boss.post("/marketing/modeles", { name: "Fuseaux", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    const id = Number((await boss.post("/marketing/campagnes", { name: "Par fuseau", template_id: String(tplId), target: `list:${listId}`, category: "" })).location.match(/(\d+)$/)[1]);
    const page = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(page, /value="local"/);
    assert.match(page, /3 fuseaux différents/);
    assert.match(page, /Meilleure heure indisponible/, "pas d'historique : option indisponible, expliquée");
    const day = new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10);
    const r = await boss.post(`/marketing/campagnes/${id}/lancer`, { send_mode: "local", local_date: day, local_time: "09:00", confirm_count: "3", confirm_ok: "on" });
    assert.equal(r.status, 302);
    const c = db.prepare("SELECT status, send_mode FROM mk_campaigns WHERE id = ?").get(id);
    assert.deepEqual([c.status, c.send_mode], ["scheduled", "local"]);
    const ny = db.prepare("SELECT next_attempt_at FROM mk_campaign_recipients WHERE campaign_id = ? AND email = 'n@ex.fr'").get(id).next_attempt_at;
    assert.equal(ny, st.zonedToUtc(day, 9, 0, "America/New_York"));
    const report = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(report, /Heure locale : 09:00 le/);
    assert.match(report, /3 fuseaux/);
  });

  test("réglages : fuseau par défaut enregistré ; fuseau inconnu refusé", async () => {
    const ok = await boss.post("/marketing/envoi/fuseau", { timezone: "Africa/Kinshasa" });
    assert.equal(ok.status, 302);
    const page = await boss.get("/marketing/envoi");
    assert.match(page.text, /<option value="Africa\/Kinshasa" selected>/);
    await boss.post("/marketing/envoi/fuseau", { timezone: "Lune/Base" });
    assert.match((await boss.get("/marketing/envoi")).text, /Fuseau horaire inconnu/);
  });
});
