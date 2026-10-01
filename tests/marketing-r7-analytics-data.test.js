// Marketing R7 — Analytics : données réelles (totaux, tendance, campagnes et liens de la période, isolation).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0 } = require("./marketing-helpers");
const { getAnalyticsOverview, PERIODS, DEFAULT_PERIOD } = require("../src/marketing/analytics");

const DAY = 86_400_000;
let m, A, B, seq;

const ov = (opts = {}) => getAnalyticsOverview(A, opts);

// Insère une campagne « système » minimale ; org par défaut = 1 (A)
const campaign = (name, o = {}) => {
  const v = { status: "sent", finished_at: T0 - DAY, sent_count: 0, unique_open_count: 0, unique_click_count: 0, bounced_count: 0, complained_count: 0, unsubscribed_count: 0, kind: "campaign", org: 1, ...o };
  return Number(
    m.db
      .prepare(
        `INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, kind, status, started_at, finished_at, sent_count, unique_open_count, unique_click_count, bounced_count, complained_count, unsubscribed_count, total_recipients)
         VALUES (?, ?, 'list', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(v.org, name, v.kind, v.status, v.finished_at, v.finished_at, v.sent_count, v.unique_open_count, v.unique_click_count, v.bounced_count, v.complained_count, v.unsubscribed_count, v.sent_count).lastInsertRowid
  );
};

// Un message = un contact + une ligne mk_messages, requis par la clé étrangère de mk_message_events
const msg = (campaignId, { org = 1 } = {}) => {
  seq += 1;
  const contactId = Number(m.db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, ?, 'unknown')").run(org, `c${seq}@ex.fr`).lastInsertRowid);
  return Number(m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email) VALUES (?, ?, ?, ?)").run(org, campaignId, contactId, `c${seq}@ex.fr`).lastInsertRowid);
};

// event(type, campaignId, { org, messageId, bot, at }) : crée un message pour l'événement si aucun n'est fourni
// (fournir le même messageId sur deux appels simule deux événements sur le même envoi, ex. deux ouvertures).
const event = (type, campaignId, { org = 1, messageId, bot = 0, at = T0 - DAY } = {}) => {
  const mid = messageId ?? msg(campaignId, { org });
  m.db.prepare("INSERT INTO mk_message_events (organization_id, message_id, campaign_id, type, bot, occurred_at) VALUES (?, ?, ?, ?, ?, ?)").run(org, mid, campaignId, type, bot, at);
  return mid;
};

const link = (url, campaignId, { org = 1, clicks = 0, uniqueClicks = 0 } = {}) => {
  m.db.prepare("INSERT INTO mk_links (organization_id, campaign_id, url, click_count, unique_click_count) VALUES (?, ?, ?, ?, ?)").run(org, campaignId, url, clicks, uniqueClicks);
};

beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; seq = 0; });

describe("période", () => {
  test("par défaut 30 jours ; une valeur inconnue retombe sur 30 ; 7 et 90 sont acceptés", () => {
    assert.equal(ov().period.days, DEFAULT_PERIOD);
    assert.equal(ov({ days: 999 }).period.days, 30);
    assert.equal(ov({ days: 7 }).period.days, 7);
    assert.equal(ov({ days: 90 }).period.days, 90);
    assert.deepEqual(ov().period.options, PERIODS);
  });
  test("organisation vide : tout à zéro ou « rien à mesurer » (jamais un faux 0 %)", () => {
    const o = ov();
    assert.deepEqual(o.counts, { sent: 0, delivered: 0, bounced: 0, complained: 0, unsubscribed: 0, opens: 0, uniqueOpens: 0, clicks: 0, uniqueClicks: 0 });
    assert.deepEqual(o.rates, { delivery: null, bounce: null, complaint: null, unsubscribe: null, open: null, click: null });
    assert.deepEqual(o.campaigns, { truncated: false, items: [] });
    assert.deepEqual(o.links, []);
  });
});

describe("totaux d'événements", () => {
  test("compte chaque type, calcule les taux sur les envoyés", () => {
    const c1 = campaign("C1", { sent_count: 4 });
    for (let i = 0; i < 4; i++) event("sent", c1);
    event("delivered", c1);
    event("bounced", c1);
    event("complained", c1);
    event("unsubscribed", c1);
    const o = ov();
    assert.deepEqual(o.counts, { sent: 4, delivered: 1, bounced: 1, complained: 1, unsubscribed: 1, opens: 0, uniqueOpens: 0, clicks: 0, uniqueClicks: 0 });
    assert.equal(o.rates.delivery, 25);
    assert.equal(o.rates.bounce, 25);
  });
  test("ouvertures et clics de robot sont exclus (comme les compteurs de campagne)", () => {
    const c1 = campaign("C1");
    event("opened", c1, { bot: 0 });
    event("opened", c1, { bot: 1 });
    event("clicked", c1, { bot: 1 });
    const o = ov();
    assert.equal(o.counts.opens, 1);
    assert.equal(o.counts.clicks, 0);
  });
  test("ouvertures et clics « uniques » : une fois par message, même si plusieurs événements", () => {
    const c1 = campaign("C1");
    const m1 = event("opened", c1);
    event("opened", c1, { messageId: m1 });
    event("opened", c1);
    const o = ov();
    assert.equal(o.counts.opens, 3);
    assert.equal(o.counts.uniqueOpens, 2);
  });
  test("un événement plus ancien que la période n'est pas compté", () => {
    const c1 = campaign("C1");
    event("sent", c1, { at: T0 - 40 * DAY });
    event("sent", c1, { at: T0 - 5 * DAY });
    assert.equal(ov({ days: 30 }).counts.sent, 1);
    assert.equal(ov({ days: 90 }).counts.sent, 2);
  });
});

describe("alerte de seuil (rebonds / plaintes)", () => {
  test("aucun signal sous le seuil minimal d'envois (20)", () => {
    const c1 = campaign("C1");
    for (let i = 0; i < 5; i++) { event("sent", c1); event("bounced", c1); }
    const o = ov();
    assert.equal(o.rates.bounce, 100);
    assert.equal(o.flags.highBounce, false, "moins de 20 envois : pas de signal, même à 100 % de rebonds");
  });
  test("signalé au-delà du seuil minimal d'envois", () => {
    const c1 = campaign("C1");
    for (let i = 0; i < 20; i++) event("sent", c1);
    for (let i = 0; i < 3; i++) event("bounced", c1); // 15 % > 2 %
    const o = ov();
    assert.equal(o.flags.highBounce, true);
    assert.equal(o.flags.highComplaint, false);
  });
});

describe("tendance", () => {
  test("7 jours : sept points, un envoi d'aujourd'hui dans le dernier", () => {
    const c1 = campaign("C1");
    event("sent", c1, { at: T0 - 1000 });
    const t = ov({ days: 7 }).trend;
    assert.equal(t.length, 7);
    assert.equal(t[6].count, 1);
    assert.equal(t.reduce((a, b) => a + b.count, 0), 1);
  });
  test("30 jours : trente points quotidiens", () => {
    assert.equal(ov({ days: 30 }).trend.length, 30);
  });
  test("90 jours : treize points hebdomadaires (sinon illisible)", () => {
    const t = ov({ days: 90 }).trend;
    assert.equal(t.length, 13);
    assert.ok(t.every((p) => typeof p.label === "string" && p.label));
  });
  test("un envoi hors période n'apparaît dans aucun point", () => {
    const c1 = campaign("C1");
    event("sent", c1, { at: T0 - 20 * DAY });
    const t = ov({ days: 7 }).trend;
    assert.equal(t.reduce((a, b) => a + b.count, 0), 0);
  });
});

describe("campagnes de la période", () => {
  test("seules les campagnes terminées dans la fenêtre apparaissent, les plus récentes d'abord", () => {
    campaign("Récente", { finished_at: T0 - DAY, sent_count: 10 });
    campaign("Hier encore", { finished_at: T0 - 2 * DAY, sent_count: 20 });
    campaign("Trop vieille", { finished_at: T0 - 40 * DAY, sent_count: 999 });
    campaign("Pas encore terminée", { finished_at: null, sent_count: 5 });
    const items = ov({ days: 30 }).campaigns.items;
    assert.deepEqual(items.map((i) => i.name), ["Récente", "Hier encore"]);
  });
  test("les campagnes « système » des automatisations n'en font pas partie", () => {
    campaign("Auto", { kind: "automation", sent_count: 10 });
    assert.equal(ov().campaigns.items.length, 0);
  });
  test("taux calculés par campagne (ouverture, clic, rebond)", () => {
    campaign("C", { sent_count: 100, unique_open_count: 40, unique_click_count: 10, bounced_count: 2 });
    const c = ov().campaigns.items[0];
    assert.equal(c.openRate, 40);
    assert.equal(c.clickRate, 10);
    assert.equal(c.bounceRate, 2);
  });
  test("plus de 50 campagnes dans la période : signalé tronqué, limité à 50", () => {
    for (let i = 0; i < 55; i++) campaign(`C${i}`, { finished_at: T0 - DAY - i * 1000 });
    const c = ov().campaigns;
    assert.equal(c.items.length, 50);
    assert.equal(c.truncated, true);
  });
});

describe("liens les plus cliqués", () => {
  test("agrégés sur les campagnes terminées de la période, triés par clics uniques", () => {
    const c1 = campaign("C1", { finished_at: T0 - DAY });
    const c2 = campaign("C2", { finished_at: T0 - 2 * DAY });
    link("https://exemple.fr/a", c1, { clicks: 5, uniqueClicks: 4 });
    link("https://exemple.fr/b", c2, { clicks: 20, uniqueClicks: 15 });
    const l = ov().links;
    assert.equal(l.length, 2);
    assert.equal(l[0].url, "https://exemple.fr/b");
    assert.equal(l[0].uniqueClicks, 15);
  });
  test("un lien jamais cliqué n'apparaît pas", () => {
    const c1 = campaign("C1", { finished_at: T0 - DAY });
    link("https://exemple.fr/jamais", c1, { clicks: 0, uniqueClicks: 0 });
    assert.deepEqual(ov().links, []);
  });
  test("un lien d'une campagne hors période n'apparaît pas", () => {
    const old = campaign("Vieille", { finished_at: T0 - 40 * DAY });
    link("https://exemple.fr/vieux-lien", old, { clicks: 9, uniqueClicks: 9 });
    assert.deepEqual(ov({ days: 30 }).links, []);
  });
});

describe("isolation entre organisations", () => {
  test("les événements, campagnes et liens de l'autre organisation n'apparaissent jamais", () => {
    const cb = campaign("Chez B", { org: 2, sent_count: 50, finished_at: T0 - DAY });
    event("sent", cb, { org: 2 });
    const o = ov();
    assert.equal(o.counts.sent, 0);
    assert.equal(o.campaigns.items.length, 0);
    assert.equal(getAnalyticsOverview(B).counts.sent, 1);
  });
});
