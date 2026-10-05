// Rapports comparatifs (point 9 de la parité Mailchimp) : campagnes e-mail et SMS terminées d'une période, filtrées,
// comparées côte à côte ou regroupées ; taux recalculés sur les totaux ; étiquettes de campagne ; rapports enregistrés
// (période glissante) ; export CSV ; pages web.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compare = require("../src/marketing/analytics/compare");
const { startServer, loginInstructor } = require("./helpers");

const NOW = Date.UTC(2026, 9, 5, 12); // lundi 5 octobre 2026, 14 h à Paris
const DAY = 86400000;
let m, A, list;

// Campagne e-mail terminée (compteurs réels de mk_campaigns)
function email(name, { at, sent = 100, delivered = sent, opens = 0, clicks = 0, bounced = 0, complained = 0, unsub = 0, target = ["list", list.id], tags = [], status = "sent" }) {
  return m.db.prepare(
    `INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, started_at, finished_at, sent_count, delivered_count, unique_open_count, unique_click_count, bounced_count, complained_count, unsubscribed_count, report_tags)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).get(name, target[0], target[1], status, at, at + 600000, sent, delivered, opens, clicks, bounced, complained, unsub, JSON.stringify(tags)).id;
}
function smsCampaign(name, { at, sent = 50, delivered = sent, clicks = 0, unsub = 0, kind = "campaign" }) {
  return m.db.prepare(
    `INSERT INTO mk_sms_campaigns (organization_id, name, status, target_type, started_at, finished_at, sent_count, delivered_count, click_count, unsubscribe_count, kind)
     VALUES (1, ?, 'sent', 'all', ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).get(name, at, at + 600000, sent, delivered, clicks, unsub, kind).id;
}
const revenue = (campaignId, cents) => m.db.prepare("INSERT INTO mk_order_attributions (organization_id, order_id, campaign_id, amount_cents, ordered_at, clicked_at, created_at) VALUES (1, ?, ?, ?, ?, ?, ?)").run(Math.floor(Math.random() * 1e9), campaignId, cents, NOW, NOW - 3600000, NOW);

function fresh() {
  m = freshMarketing();
  A = m.ctx(1, { now: () => NOW });
  list = audience.createList(A, { name: "Abonnés" });
}

describe("rapports comparatifs : calculs", () => {
  beforeEach(fresh);

  test("par campagne : seules les campagnes TERMINÉES de la période ; taux par campagne ; meilleur repéré", () => {
    const a = email("Newsletter septembre", { at: NOW - 10 * DAY, sent: 200, opens: 80, clicks: 20, bounced: 2, unsub: 1 });
    const b = email("Promo rentrée", { at: NOW - 20 * DAY, sent: 100, opens: 50, clicks: 15 });
    email("Trop ancienne", { at: NOW - 200 * DAY });
    email("Brouillon", { at: NOW - 5 * DAY, status: "draft" });
    m.db.prepare("UPDATE mk_campaigns SET finished_at = NULL WHERE name = 'Brouillon'").run();
    email("En cours", { at: NOW - 2 * DAY, status: "sending" });
    smsCampaign("Système", { at: NOW - 3 * DAY, kind: "automation" });
    const r = compare.compareReport(A, {});
    assert.deepEqual(r.lines.map((l) => l.label), ["Newsletter septembre", "Promo rentrée"], "les plus récentes d'abord");
    assert.equal(r.filters.to, "2026-10-05");
    assert.equal(r.filters.from, "2026-07-08", "90 jours par défaut");
    const [la, lb] = r.lines;
    assert.deepEqual([la.metrics.openRate, la.metrics.clickRate, la.metrics.clickToOpen, la.metrics.bounceRate, la.metrics.unsubscribeRate], [40, 10, 25, 1, 0.5]);
    assert.deepEqual([lb.metrics.openRate, lb.metrics.clickRate], [50, 15]);
    assert.equal(r.best.openRate, 50);
    assert.equal(r.best.clickRate, 15);
    assert.equal(r.best.bounceRate, 0, "plus bas = meilleur");
    assert.equal(la.link, `/marketing/campagnes/${a}`);
    assert.equal(lb.key, `e:${b}`);
    // Total : taux recalculés sur les SOMMES (jamais la moyenne des taux)
    assert.equal(r.totals.metrics.openRate, Math.round((130 / 300) * 10000) / 100);
    assert.equal(r.totals.metrics.clickRate, Math.round((35 / 300) * 10000) / 100);
  });

  test("e-mail + SMS : ouverture/rebond n'existent que pour l'e-mail (dénominateur = e-mails envoyés), jamais de faux 0 %", () => {
    email("Mail", { at: NOW - DAY, sent: 100, opens: 40, clicks: 10, bounced: 4 });
    smsCampaign("Texto", { at: NOW - 2 * DAY, sent: 100, clicks: 30, unsub: 2 });
    const r = compare.compareReport(A, {});
    const sms = r.lines.find((l) => l.channel === "sms");
    assert.deepEqual([sms.metrics.openRate, sms.metrics.bounceRate, sms.metrics.clickToOpen, sms.metrics.revenuePerSent], [null, null, null, null]);
    assert.equal(sms.metrics.clickRate, 30);
    assert.equal(sms.link.startsWith("/marketing/sms/campagnes/"), true);
    assert.equal(r.totals.metrics.openRate, 40, "40 ouvertures / 100 e-mails, pas / 200 envois");
    assert.equal(r.totals.metrics.bounceRate, 4);
    assert.equal(r.totals.metrics.clickRate, 20);
    assert.equal(r.totals.metrics.clickToOpen, 25, "clics e-mail seulement / ouvertures");
    assert.equal(compare.compareReport(A, { channel: "sms" }).lines.length, 1);
    assert.equal(compare.compareReport(A, { channel: "email" }).hasSms, false);
    const none = compare.compareReport(A, { from: "2026-01-01", to: "2026-01-31" });
    assert.equal(none.selectedCount, 0);
    assert.equal(none.totals.metrics.openRate, null);
  });

  test("filtres : période (fuseau de l'organisation), audience, étiquette, nom, sélection ; période inversée corrigée", () => {
    const seg = m.db.prepare("INSERT INTO mk_segments (organization_id, name, definition) VALUES (1, 'Actifs', '{}') RETURNING id").get().id;
    email("A liste", { at: Date.UTC(2026, 8, 30, 22, 30), tags: ["Newsletter"] }); // 1er octobre 0 h 30 à Paris
    const s = email("B segment", { at: NOW - 3 * DAY, target: ["segment", seg], tags: ["Promo"] });
    smsCampaign("C sms", { at: NOW - 3 * DAY });
    assert.deepEqual(compare.compareReport(A, { from: "2026-10-01", to: "2026-10-01" }).lines.map((l) => l.label), ["A liste"], "jour local, pas UTC");
    assert.deepEqual(compare.compareReport(A, { target: `segment:${seg}` }).lines.map((l) => l.label), ["B segment"]);
    assert.equal(compare.compareReport(A, { target: `segment:${seg}` }).lines[0].targetLabel, "Segment « Actifs »");
    assert.deepEqual(compare.compareReport(A, { target: "sms-all" }).lines.map((l) => l.label), ["C sms"]);
    assert.deepEqual(compare.compareReport(A, { tag: "promo" }).lines.map((l) => l.label), ["B segment"], "étiquette sans tenir compte de la casse");
    assert.deepEqual(compare.compareReport(A, { q: "liste" }).lines.map((l) => l.label), ["A liste"]);
    const sel = compare.compareReport(A, { ids: `e:${s},x:1,e:999` });
    assert.deepEqual(sel.lines.map((l) => l.label), ["B segment"]);
    assert.equal(sel.rows.length, 3, "la sélection ne réduit que la comparaison");
    const inv = compare.compareReport(A, { from: "2026-10-05", to: "2026-09-01" });
    assert.deepEqual([inv.filters.from, inv.filters.to], ["2026-09-01", "2026-10-05"]);
    assert.match(inv.filters.warning, /inversées/);
    const junk = compare.normalizeFilters(A, { from: "2026-02-30", channel: "fax", groupBy: "x", metric: "y", target: "list:abc" });
    assert.deepEqual([junk.channel, junk.groupBy, junk.metric, junk.target], ["all", "campaign", "clickRate", ""]);
    assert.equal(junk.from, "2026-07-08");
    assert.deepEqual(compare.compareReport(A, {}).tags, ["Newsletter", "Promo"]);
  });

  test("regroupements : mois, jour, heure (heure locale), audience, canal, étiquette (une campagne compte dans chacune)", () => {
    email("Sept 1", { at: Date.UTC(2026, 8, 7, 7), sent: 100, clicks: 10, tags: ["Newsletter", "Promo"] }); // lundi 9 h Paris
    email("Sept 2", { at: Date.UTC(2026, 8, 14, 7), sent: 300, clicks: 60, tags: ["Newsletter"] }); // lundi 9 h
    email("Oct", { at: Date.UTC(2026, 9, 1, 16), sent: 100, clicks: 5 }); // jeudi 18 h
    smsCampaign("Sms", { at: Date.UTC(2026, 9, 1, 16), sent: 50, clicks: 5 });
    const month = compare.compareReport(A, { groupBy: "month" });
    assert.deepEqual(month.lines.map((l) => [l.label, l.campaigns, l.metrics.clickRate]), [["septembre 2026", 2, 17.5], ["octobre 2026", 2, 6.67]]);
    assert.deepEqual(compare.compareReport(A, { groupBy: "weekday" }).lines.map((l) => [l.label, l.campaigns]), [["Lundi", 2], ["Jeudi", 2]]);
    assert.deepEqual(compare.compareReport(A, { groupBy: "hour" }).lines.map((l) => l.label), ["9 h – 10 h", "18 h – 19 h"]);
    assert.deepEqual(compare.compareReport(A, { groupBy: "channel" }).lines.map((l) => [l.label, l.sums.sent]), [["E-mail", 500], ["SMS", 50]]);
    assert.deepEqual(compare.compareReport(A, { groupBy: "target" }).lines.map((l) => l.label), ["Liste « Abonnés »", "Tous les abonnés SMS"]);
    const tag = compare.compareReport(A, { groupBy: "tag" });
    assert.deepEqual(tag.lines.map((l) => [l.label, l.campaigns]), [["Sans étiquette", 2], ["Newsletter", 2], ["Promo", 1]]);
    assert.equal(tag.totals.campaigns, 4, "le total compte chaque campagne une fois");
  });

  test("revenus attribués par campagne et revenu par e-mail envoyé", () => {
    const a = email("Vente", { at: NOW - DAY, sent: 200, clicks: 20 });
    revenue(a, 4900); revenue(a, 5100);
    const r = compare.compareReport(A, {});
    assert.deepEqual([r.lines[0].metrics.revenueCents, r.lines[0].metrics.revenuePerSent, r.lines[0].sums.orders], [10000, 50, 2]);
  });

  test("étiquettes de campagne : ajout, doublon ignoré, retrait, 5 au plus, campagne système refusée", () => {
    const a = email("Une", { at: NOW - DAY });
    const s = smsCampaign("Deux", { at: NOW - DAY });
    const sys = smsCampaign("Système", { at: NOW - DAY, kind: "automation" });
    assert.equal(compare.tagCampaigns(A, [`e:${a}`, `s:${s}`, `s:${sys}`], "  Promo  rentrée "), 2);
    assert.equal(compare.tagCampaigns(A, [`e:${a}`], "promo rentrée"), 0, "même étiquette (casse ignorée)");
    assert.deepEqual(compare.compareReport(A, {}).lines.map((l) => l.tags), [["Promo rentrée"], ["Promo rentrée"]]);
    assert.equal(compare.tagCampaigns(A, [`s:${s}`], "PROMO RENTRÉE", "remove"), 1);
    for (const t of ["b", "c", "d", "e"]) compare.tagCampaigns(A, [`e:${a}`], t);
    assert.throws(() => compare.tagCampaigns(A, [`e:${a}`], "f"), /5 étiquettes au plus/);
    assert.throws(() => compare.tagCampaigns(A, [], "x"), /Cochez/);
    assert.throws(() => compare.tagCampaigns(A, [`e:${a}`], " "), /obligatoire/);
    assert.throws(() => compare.tagCampaigns(A, [`e:${a}`], "x".repeat(41)), /trop longue/);
    assert.equal(m.db.prepare("SELECT report_tags FROM mk_sms_campaigns WHERE id = ?").get(sys).report_tags, "[]");
  });

  test("rapports enregistrés : période fixe ou glissante, même nom = mise à jour, suppression", () => {
    const fixed = compare.saveReport(A, { name: "Septembre", filters: { from: "2026-09-01", to: "2026-09-30", groupBy: "weekday", channel: "email" } });
    assert.equal(fixed.updated, false);
    const s = compare.getSavedReport(A, fixed.id);
    assert.deepEqual(compare.filtersOfSaved(A, s).from, "2026-09-01");
    const rolling = compare.saveReport(A, { name: "Trimestre", filters: { from: "2026-07-08", to: "2026-10-05", tag: "Promo" } });
    const later = { ...A, now: () => NOW + 10 * DAY };
    const f = compare.normalizeFilters(later, compare.filtersOfSaved(later, compare.getSavedReport(A, rolling.id)));
    assert.deepEqual([f.from, f.to, f.tag], ["2026-07-18", "2026-10-15", "Promo"], "90 jours glissants");
    assert.equal(compare.saveReport(A, { name: "septembre", filters: { groupBy: "month" } }).updated, true, "même nom (casse ignorée) = mise à jour");
    assert.equal(compare.listSavedReports(A).length, 2);
    assert.throws(() => compare.saveReport(A, { name: " ", filters: {} }), /nom/);
    compare.deleteSavedReport(A, fixed.id);
    assert.deepEqual(compare.listSavedReports(A).map((r) => r.name), ["Trimestre"]);
    assert.equal(compare.getSavedReport(m.B, rolling.id), null, "jamais lu par une autre organisation");
  });

  test("export CSV : en-têtes, virgule décimale, formules neutralisées", () => {
    email("=HYPERLINK(\"x\")", { at: NOW - DAY, sent: 3, clicks: 1 });
    const csv = compare.toCsv(compare.compareReport(A, {}));
    const [head, line] = csv.replace("\ufeff", "").split("\r\n");
    assert.match(head, /^Campagne;Canal;Date;Audience;Étiquettes;Envoyés/);
    assert.match(line, /^"'=HYPERLINK\(""x""\)";E-mail;2026-10-04;Liste « Abonnés »;;3;/);
    assert.match(line, /;33,33;/);
    const grouped = compare.toCsv(compare.compareReport(A, { groupBy: "channel" })).split("\r\n");
    assert.match(grouped[0], /^\ufeffCanal;Campagnes;Envoyés/);
  });
});

describe("rapports comparatifs : pages web", () => {
  let srv, boss;
  const sql = (fn) => { const db = srv.db(); try { return fn(db); } finally { db.close(); } };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    sql((db) => {
      const listId = db.prepare("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Web') RETURNING id").get().id;
      const at = Date.now() - 2 * DAY;
      for (const [name, sent, clicks] of [["Web A", 100, 10], ["Web B", 100, 30]]) {
        db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, started_at, finished_at, sent_count, delivered_count, unique_click_count) VALUES (1, ?, 'list', ?, 'sent', ?, ?, ?, ?, ?)").run(name, listId, at, at + 1000, sent, sent, clicks);
      }
    });
  });
  after(() => srv.stop());

  test("page : menu, filtres, tableau, meilleur taux en gras, graphique", async () => {
    const r = await boss.get("/marketing/analytics/comparer");
    assert.equal(r.status, 200);
    assert.match(r.text, /href="\/marketing\/analytics\/comparer"[^>]*>[\s\S]{0,200}Rapports comparatifs/);
    assert.match(r.text, /Campagnes côte à côte/);
    assert.match(r.text, /class="mk-num mk-cmp-best" data-label="Taux de clic">30 %/);
    assert.match(r.text, /name="ids" value="e:\d+"/);
    assert.match(r.text, /class="mk-sv-bars"/);
    const g = await boss.get("/marketing/analytics/comparer?groupBy=month&metric=sent");
    assert.match(g.text, /Par mois/);
    assert.match(g.text, /<td class="mk-num" data-label="Campagnes">2<\/td>/);
  });

  test("étiqueter des campagnes cochées, comparer seulement les cochées, enregistrer, exporter, supprimer", async () => {
    const ids = sql((db) => db.prepare("SELECT id FROM mk_campaigns WHERE name LIKE 'Web %' ORDER BY id").all().map((x) => `e:${x.id}`));
    let r = await boss.post("/marketing/analytics/comparer/etiqueter", { ids: ids[0], tag: "Newsletter", op: "add", query: "channel=email" });
    assert.equal(r.status, 302);
    assert.equal(r.location, "/marketing/analytics/comparer?channel=email");
    let page = await boss.get(r.location);
    assert.match(page.text, /Étiquette « Newsletter » ajoutée à 1 campagne\./);
    assert.match(page.text, /<option value="Newsletter">Newsletter<\/option>/);
    page = await boss.get(`/marketing/analytics/comparer?query=${encodeURIComponent("channel=email&groupBy=campaign")}&ids=${ids[1]}&groupBy=campaign`);
    assert.match(page.text, /Sélection : 1 campagne/);
    assert.doesNotMatch(page.text, />Web A<\/a>/);
    r = await boss.post("/marketing/analytics/comparer/enregistrer", { name: "Mes newsletters", query: "tag=Newsletter&groupBy=campaign" });
    assert.match(r.location, /^\/marketing\/analytics\/comparer\?rapport=\d+$/);
    page = await boss.get(r.location);
    assert.match(page.text, /<h1>Mes newsletters<\/h1>/);
    assert.match(page.text, />Web A<\/a>/);
    assert.doesNotMatch(page.text, />Web B<\/a>/);
    const id = /rapport=(\d+)/.exec(r.location)[1];
    const csv = await boss.get(`/marketing/analytics/comparer/export.csv?rapport=${id}`);
    assert.equal(csv.headers.get("content-type"), "text/csv; charset=utf-8");
    assert.match(csv.text, /Web A/);
    assert.doesNotMatch(csv.text, /Web B/);
    r = await boss.post(`/marketing/analytics/rapports/${id}/supprimer`);
    assert.equal(r.location, "/marketing/analytics/comparer");
    assert.equal((await boss.get(`/marketing/analytics/comparer?rapport=${id}`)).status, 404);
    // Adresse de retour : jamais hors du rapport (une valeur étrange est ignorée)
    r = await boss.post("/marketing/analytics/comparer/etiqueter", { ids: ids[0], tag: "X", query: "//evil.example/<x>" });
    assert.equal(r.location, "/marketing/analytics/comparer");
  });
});
