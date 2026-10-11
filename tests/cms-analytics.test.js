// KOLAKISA CMS — palier 21 : Analytics central. Vraie base (vraies migrations), vrais moteurs ; aucune donnée injectée à la place d'un moteur dans le test de bout en bout.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, quiet, T0, TEST_KEY } = require("./marketing-helpers");
const engine = require("../src/marketing/analytics/engine");
const attribution = require("../src/marketing/analytics/attribution");
const period = require("../src/marketing/analytics/period");
const visitors = require("../src/marketing/visitors");
const funnelEvents = require("../src/marketing/funnels/events");
const bridge = require("../src/marketing/bridge/events");
const core = require("../src/marketing/contactcore");
const auto = require("../src/marketing/automations");
const templates = require("../src/marketing/templates");
const compliance = require("../src/marketing/compliance");
const tracking = require("../src/marketing/sending/tracking");

let m, A, db, NOW;
const HOUR = 3600000, DAY = 86400000;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
const ctxAt = (extra = {}) => ({ ...A, now: () => NOW, ...extra });
const dash = (opts = {}, extra = {}) => engine.dashboard(ctxAt(extra), { range: "30d", ...opts });
const vid = (n) => `visiteur${String(n).padStart(8, "0")}.${1700000000000 + n}`;
const ua = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/120.0";
const visit = (n, events, { at = NOW - HOUR, session = "sess0001" } = {}) => visitors.record(db, 1, { visitorId: vid(n), sessionId: session, events, userAgent: ua, now: at });
const pv = (path, extra = {}) => ({ t: "page_view", p: path, d: "desktop", ...extra });
const start = (path, extra = {}) => ({ t: "session_start", p: path, d: "desktop", ...extra });

beforeEach(() => {
  m = freshMarketing(); A = m.A; db = m.db; addLmsSchema(db);
  NOW = Date.parse("2026-10-10T15:00:00Z");
  db.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha'), (1, 'Bravo')");
});

describe("périodes et variations", () => {
  test("jours calendaires du fuseau configuré, période précédente de même durée", () => {
    A.settings.set(1, "cms.timezone", "America/Chicago");
    const P = period.resolvePeriod(ctxAt(), { range: "7d", now: NOW });
    assert.equal(P.tz, "America/Chicago"); assert.equal(P.fromYmd, "2026-10-04"); assert.equal(P.toYmd, "2026-10-10"); assert.equal(P.days, 7);
    assert.equal(new Date(P.start).toISOString(), "2026-10-04T05:00:00.000Z");
    assert.equal(P.prevEnd, P.start); assert.equal(P.end - P.start, P.start - P.prevStart);
  });
  test("tous les préréglages et les dates personnalisées ; dates invalides refusées", () => {
    for (const k of Object.keys(period.PRESETS).filter((x) => x !== "custom")) assert.ok(period.resolvePeriod(ctxAt(), { range: k, now: NOW }).days >= 1, k);
    const lm = period.resolvePeriod(ctxAt(), { range: "last_month", now: NOW });
    assert.equal(lm.fromYmd, "2026-09-01"); assert.equal(lm.toYmd, "2026-09-30");
    assert.equal(period.resolvePeriod(ctxAt(), { range: "custom", from: "2026-01-01", to: "2026-01-31" }).days, 31);
    assert.throws(() => period.resolvePeriod(ctxAt(), { range: "custom", from: "2026-02-30", to: "2026-03-01" }), /Dates/);
    assert.throws(() => period.resolvePeriod(ctxAt(), { range: "custom", from: "2026-03-05", to: "2026-03-01" }), /précéder/);
  });
  test("changement d'heure : un jour de 25 h reste UN jour", () => {
    A.settings.set(1, "cms.timezone", "America/Chicago");
    const P = period.resolvePeriod(ctxAt(), { range: "custom", from: "2026-10-31", to: "2026-11-02" });
    const b = period.dayBoundaries(P);
    assert.equal(b.length, 3); assert.equal(b[2].start - b[1].start, 25 * HOUR);
  });
  test("variation relative (nombres) ≠ variation en points (taux) ; pas de division par zéro ; pas de donnée", () => {
    assert.deepEqual(period.delta(12000, 10000), { state: "up", pct: 20 });
    assert.deepEqual(period.delta(19200, 20000), { state: "down", pct: -4 });
    assert.deepEqual(period.delta(5.2, 4.4, "rate"), { state: "up", points: 0.8 });
    assert.deepEqual(period.delta(5, 0), { state: "new" });
    assert.deepEqual(period.delta(0, 0), { state: "flat" });
    assert.deepEqual(period.delta(null, 4), { state: "nodata" });
  });
});

describe("trafic : visiteurs, sessions, pages vues, événements", () => {
  test("1 visiteur · 3 sessions · 12 pages vues · 25 événements restent distincts", () => {
    for (const s of ["sessionAAA1", "sessionBBB2", "sessionCCC3"]) {
      const ev = [start("/blog/a"), pv("/blog/a"), pv("/blog/b"), pv("/p/x"), pv("/")];
      for (let i = 0; i < 3; i++) ev.push({ t: "button_click", p: "/", x: `btn${s}${i}` });
      // 1 début + 4 pages + 3 clics = 8 par session → 24 ; une 25e ci-dessous
      visit(1, ev, { session: s, at: NOW - 5 * HOUR });
    }
    visit(1, [{ t: "download", p: "/", x: "guide" }], { session: "sessionAAA1", at: NOW - 4 * HOUR });
    const T = dash().sections.traffic;
    assert.deepEqual(T.kpis, { visitors: 1, sessions: 3, pageViews: 12, events: 25 });
  });
  test("un même lot reçu deux fois ne compte qu'une fois (déduplication)", () => {
    const batch = [start("/"), pv("/"), pv("/blog/a")];
    visit(2, batch); visit(2, batch);
    assert.equal(dash().sections.traffic.kpis.events, 3);
  });
  test("pas de donnée ≠ zéro : trafic vide = noData ; boutique sans commande = vraies valeurs à zéro", () => {
    const d = dash();
    assert.equal(d.sections.traffic.noData, true); assert.equal(d.sections.traffic.kpis, null);
    assert.equal(d.sections.commerce.noData, true); assert.equal(d.sections.commerce.kpis.orders, 0); assert.equal(d.sections.commerce.kpis.avgBasketCents, null, "panier moyen sans commande : indisponible, pas 0");
    assert.equal(d.sections.email.noData, true);
  });
  test("filtres source et appareil ; sources classées par la logique existante ; articles", () => {
    visit(3, [start("/blog/a", { us: "google", um: "cpc", uc: "formation" }), pv("/blog/a")], { session: "sessGoogle1" });
    visit(4, [start("/", { r: "facebook.com", d: "mobile" }), pv("/", { d: "mobile" })], { session: "sessFacebk1" });
    const all = dash().sections.traffic;
    assert.equal(all.kpis.visitors, 2);
    assert.deepEqual(all.sources.map((s) => s.source).sort(), ["paid", "social"]);
    assert.equal(all.sources.find((s) => s.source === "paid").campaign, "formation");
    assert.equal(dash({ source: "paid" }).sections.traffic.kpis.visitors, 1);
    assert.equal(dash({ device: "mobile" }).sections.traffic.kpis.visitors, 1);
    assert.deepEqual(all.articles.map((a) => a.path), ["/blog/a"]);
  });
  test("comparaison : période précédente de même durée", () => {
    visit(5, [start("/"), pv("/")], { at: NOW - 2 * DAY, session: "sessCur0001" });
    visit(6, [start("/"), pv("/"), pv("/b")], { at: NOW - 40 * DAY, session: "sessPrev001" });
    const T = dash().sections.traffic;
    assert.equal(T.kpis.pageViews, 1); assert.equal(T.previous.pageViews, 2); assert.deepEqual(T.deltas.pageViews, { state: "down", pct: -50 });
  });
});

describe("multi-site : portée imposée", () => {
  test("le site A ne voit que A, le site B que B, l'organisation voit A + B", () => {
    const sites = db.prepare("SELECT id FROM mk_sites ORDER BY id").all().map((s) => s.id);
    const pageA = run("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id) VALUES (1, 'PA', 'page-a', ?)", sites[0]);
    const pageB = run("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id) VALUES (1, 'PB', 'page-b', ?)", sites[1]);
    void pageA; void pageB;
    for (let i = 1; i <= 4; i++) visit(10 + i, [start("/p/page-a"), pv("/p/page-a")], { session: `sessA${i}0000` });
    for (let i = 1; i <= 2; i++) visit(20 + i, [start("/p/page-b"), pv("/p/page-b")], { session: `sessB${i}0000` });
    assert.equal(dash({}, { siteScope: sites[0] }).sections.traffic.kpis.visitors, 4);
    assert.equal(dash({}, { siteScope: sites[1] }).sections.traffic.kpis.visitors, 2);
    assert.equal(dash().sections.traffic.kpis.visitors, 6);
    assert.equal(dash({}, { siteFilter: sites[0] }).sections.traffic.kpis.visitors, 4);
    assert.equal(dash({}, { siteScope: 999 }).sections.traffic.noData, true, "un site sans donnée ne voit rien des autres");
    // les commandes de la boutique ne sont pas rattachées à un site : jamais montrées à une portée de site
    assert.ok(dash({}, { siteScope: sites[0] }).sections.commerce.unavailable);
  });
});

describe("tunnels : calculs sur données réelles", () => {
  function funnel(name, n = 3) {
    const f = Number(db.prepare("INSERT INTO mk_funnels (organization_id, name) VALUES (1, ?)").run(name).lastInsertRowid);
    for (let i = 1; i <= n; i++) db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name) VALUES (1, ?, ?, 'landing', ?)").run(f, i, `Étape ${i}`);
    return db.prepare("SELECT s.id, s.name, s.position, s.type, f.id AS funnel_id, f.name AS funnel_name, f.site_id, 1 AS first_position, ? AS last_position FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE f.id = ? ORDER BY s.position").all(n, f);
  }
  test("entrées → étapes → terminés : taux d'étape et conversion globale", () => {
    const steps = funnel("Lancement");
    // 10 entrées ; 7 atteignent l'étape 2 ; 2 l'étape 3 (dernière = terminé) — 1 seulement la termine
    for (let i = 1; i <= 10; i++) {
      const c = core.identify(ctxAt(), { email: `t${i}@x.fr`, source: "form" }).contact;
      const at = NOW - 3 * HOUR;
      funnelEvents.emitJourney(ctxAt(), c, [steps[0]], { sessionId: `s${i}`, at });
      if (i <= 7) funnelEvents.emitJourney(ctxAt(), c, [steps[1]], { sessionId: `s${i}`, at: at + 1000 });
      if (i === 1) funnelEvents.emitJourney(ctxAt(), c, [steps[2]], { sessionId: `s${i}`, at: at + 2000 });
    }
    const F = dash().sections.funnels.rows[0];
    assert.equal(F.entered, 10); assert.deepEqual(F.steps.map((s) => s.contacts), [10, 7, 1]);
    assert.equal(F.steps[1].fromStart, 70); assert.equal(F.steps[2].fromPrevious, 14.29);
    assert.equal(F.completed, 1); assert.equal(F.conversion, 10);
  });
});

describe("boutique : revenu brut, net, panier moyen, clients", () => {
  test("brut = paiements confirmés, remboursements à leur date, net = brut − remboursements ; nouveaux et récurrents", () => {
    const u1 = run("INSERT INTO users (username, email) VALUES ('a', 'a@x.fr')"), u2 = run("INSERT INTO users (username, email) VALUES ('b', 'b@x.fr')");
    const course = run("INSERT INTO courses (title, slug) VALUES ('Final Cut <b>Pro</b>', 'fcp')");
    const at = (d) => new Date(NOW - d * DAY).toISOString().slice(0, 19).replace("T", " ");
    const o1 = run("INSERT INTO orders (user_id, total_cents, created_at, discount_cents) VALUES (?, 10000, ?, 500)", u1, at(2));
    run("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 10000)", o1, course);
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 5000, ?)", u2, at(1));
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 5000, ?)", u1, at(1)); // u1 : client récurrent
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 0, ?)", u2, at(1)); // commande gratuite : ni revenu ni panier moyen
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 7000, ?)", u2, at(60)); // période précédente ou plus ancienne
    run("INSERT INTO order_refunds (order_id, stripe_refund_id, amount_cents, created_at) VALUES (?, 're_1', 2500, ?)", o1, at(0));
    const C = dash().sections.commerce;
    assert.equal(C.kpis.grossCents, 20000); assert.equal(C.kpis.refundCents, 2500); assert.equal(C.kpis.netCents, 17500);
    assert.equal(C.kpis.orders, 4); assert.equal(C.kpis.paidOrders, 3); assert.equal(C.kpis.avgBasketCents, Math.round(20000 / 3));
    assert.equal(C.kpis.discountCents, 500);
    assert.equal(C.kpis.newCustomers, 1, "u1 est nouveau ; u2 avait déjà acheté 60 jours avant"); assert.equal(C.kpis.returningCustomers, 1);
    assert.equal(C.products[0].title, "Final Cut <b>Pro</b>"); assert.equal(C.products[0].cents, 10000);
  });
});

describe("attribution : premier et dernier contact", () => {
  test("google/cpc/formation puis e-mail avant l'achat ; achat sans visite connue = non attribué", () => {
    const u = run("INSERT INTO users (username, email) VALUES ('buyer', 'buyer@x.fr')");
    bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    const c = one("SELECT id FROM mk_contacts WHERE lms_user_id = ?", u).id;
    visit(30, [start("/p/x", { us: "google", um: "cpc", uc: "formation" })], { at: NOW - 5 * DAY, session: "sessFirst001" });
    visit(30, [start("/p/x", { us: "news", um: "email", uc: "octobre" })], { at: NOW - 1 * DAY, session: "sessLast0001" });
    visitors.linkVisitor(db, 1, vid(30), c);
    const at = new Date(NOW - 12 * HOUR).toISOString().slice(0, 19).replace("T", " ");
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 4900, ?)", u, at);
    const u2 = run("INSERT INTO users (username, email) VALUES ('inconnu', 'inconnu@x.fr')");
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 1000, ?)", u2, at);
    const P = period.resolvePeriod(ctxAt(), { range: "30d", now: NOW });
    const last = attribution.bySource(ctxAt(), P, { model: "last" }), first = attribution.bySource(ctxAt(), P, { model: "first" });
    assert.equal(last.rows.find((r) => r.source === "email").revenueCents, 4900);
    assert.equal(first.rows.find((r) => r.source === "paid").revenueCents, 4900); assert.equal(first.rows.find((r) => r.source === "paid").campaign, "formation");
    assert.equal(last.rows.find((r) => r.source === "unattributed").revenueCents, 1000);
    assert.equal(last.attributed, 1); assert.equal(last.orders, 2);
  });
});

describe("conversions séparées et personnalisées", () => {
  test("chaque type est compté à part ; conversion personnalisée = événement existant + filtre ; doublon et événement invalide refusés", () => {
    const c = core.identify(ctxAt(), { email: "cv@x.fr", source: "form" }).contact;
    const rec = (type, metadata = {}) => core.recordEvent(ctxAt(), { contactId: c.id, type, source: "test", occurredAt: NOW - HOUR, metadata });
    rec("form.submitted"); rec("purchase.completed", { courseId: 7 }); rec("purchase.completed", { courseId: 9 });
    engine.createConversion(ctxAt(), { name: "Achat Premium", event: "purchase.completed", filterKey: "courseId", filterValue: "7" });
    assert.throws(() => engine.createConversion(ctxAt(), { name: "Achat Premium", event: "purchase.completed" }), /déjà/);
    assert.throws(() => engine.createConversion(ctxAt(), { name: "X", event: "Pas Valide!" }), /invalide/);
    const V = dash().sections.conversions.rows;
    assert.equal(V.find((r) => r.key === "purchase").events, 2); assert.equal(V.find((r) => r.key === "form").events, 1);
    assert.equal(V.find((r) => r.label === "Achat Premium").events, 1);
  });
  test("une conversion d'un site n'est ni lisible ni supprimable depuis un autre site", () => {
    const sites = db.prepare("SELECT id FROM mk_sites ORDER BY id").all().map((s) => s.id);
    const id = engine.createConversion(ctxAt({ siteScope: sites[0] }), { name: "Alpha seule", event: "form.submitted" });
    assert.ok(dash({}, { siteScope: sites[0] }).sections.conversions.rows.some((r) => r.label === "Alpha seule"));
    assert.ok(!dash({}, { siteScope: sites[1] }).sections.conversions.rows.some((r) => r.label === "Alpha seule"));
    assert.equal(engine.deleteConversion(ctxAt({ siteScope: sites[1] }), id), false);
    assert.equal(engine.deleteConversion(ctxAt({ siteScope: sites[0] }), id), true);
  });
});

describe("robustesse, conservation, volume", () => {
  test("une section en erreur est signalée, les autres restent calculées (jamais un tableau vide qui cache une panne)", () => {
    const broken = { ...ctxAt(), db: { prepare: (sql) => { if (/mk_automation_runs/.test(sql)) throw new Error("boom"); return db.prepare(sql); } } };
    const quietLog = console.error; console.error = () => {};
    try { const d = engine.dashboard(broken, { range: "30d" }); assert.ok(d.sections.automations.error); assert.equal(d.sections.traffic.noData, true); } finally { console.error = quietLog; }
  });
  test("conservation : durée réglable, appliquée une fois par jour, sans toucher au récent", () => {
    visit(40, [start("/"), pv("/")], { at: NOW - 100 * DAY, session: "sessOld0001" });
    visit(41, [start("/"), pv("/")], { at: NOW - 2 * DAY, session: "sessNew0001" });
    A.settings.set(1, "cms.analytics_retention_days", "60");
    const first = bridge.purgeVisits(db, 1, NOW);
    assert.equal(first.events, 2); assert.equal(one("SELECT COUNT(*) n FROM mk_web_visitors").n, 1);
    assert.equal(bridge.purgeVisits(db, 1, NOW + HOUR), null, "une seule purge par jour");
    assert.equal(one("SELECT COUNT(*) n FROM mk_web_events").n, 2);
  });
  test("volume : 100 000 événements de visite + 20 000 du journal — temps mesuré", () => {
    db.exec("BEGIN");
    const vins = db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen, sessions) VALUES (?, 1, ?, ?, 1)");
    for (let i = 0; i < 5000; i++) vins.run(vid(i), NOW - 30 * DAY, NOW);
    const ins = db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, device, occurred_at) VALUES (1, ?, ?, ?, ?, 'desktop', ?)");
    for (let i = 0; i < 100000; i++) ins.run(vid(i % 5000), `s${i % 9000}xxxxxxxx`, i % 6 === 0 ? "session_start" : "page_view", `/blog/a${i % 300}`, NOW - (i % (25 * 24)) * HOUR - i);
    const ev = db.prepare("INSERT INTO mk_events (organization_id, name, source, occurred_at, created_at, metadata) VALUES (1, ?, 'test', ?, ?, '{}')");
    for (let i = 0; i < 20000; i++) ev.run(i % 3 ? "form.submitted" : "purchase.completed", NOW - (i % 600) * HOUR, NOW);
    db.exec("COMMIT");
    const t0 = process.hrtime.bigint();
    const d = dash();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`[perf] tableau de bord sur 100 000 visites + 20 000 événements : ${Math.round(ms)} ms`);
    assert.ok(d.sections.traffic.kpis.pageViews > 50000);
    assert.ok(ms < 15000, `trop lent : ${ms} ms`);
  });
});

// ---------- Bout en bout : le parcours réel traverse les vrais moteurs, Analytics le reconstruit ----------
describe("parcours complet (aucun événement injecté à la place d'un moteur)", () => {
  test("visite UTM → formulaire → tunnel → commande → scénario → e-mail → suivi : le tableau de bord retrouve chaque étape", async () => {
    NOW = Date.now(); // parcours réel : horloge réelle partout (le bus de test est normalement figé)
    const realBus = require("../src/marketing/events/bus").createEventBus(db, { log: quiet, now: () => Date.now() });
    A = { ...A, bus: realBus }; m = { ...m, bus: realBus };
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    const tpl = templates.createTemplate(A, { name: "Merci", kind: "transactional", subject: "Merci pour votre achat", blocks: [{ type: "text", markdown: "Commande {{event.order_id}}" }] });
    const sent = [];
    const provider = { name: "capture", capabilities: {}, async send(msg) { sent.push(msg); return { providerMessageId: `ok-${sent.length}` }; } };
    m.bus.on("*", auto.eventHandler({ db, settings: A.settings, log: quiet }));
    const a = auto.createAutomation(A, { name: "Après achat", kind: "transactional", triggerEvent: "purchase.completed", steps: [{ type: "email", templateId: tpl.id }] });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const handlers = auto.jobHandlers({ db, bus: m.bus, settings: A.settings, providerFor: () => provider, now: () => Date.now() + 60000, env: { SITE_URL: "https://k.test", ENCRYPTION_KEY: TEST_KEY }, log: quiet });
    const pump = async () => { for (const e of db.prepare("SELECT id FROM mk_events WHERE processed_at IS NULL ORDER BY id").all()) await m.bus.dispatch(e.id); };

    // Entonnoir : une page de tunnel du Site Web (2 étapes) et un compte client
    const page1 = run("INSERT INTO mk_landing_pages (organization_id, name, slug) VALUES (1, 'Accueil', 'accueil')"), page2 = run("INSERT INTO mk_landing_pages (organization_id, name, slug) VALUES (1, 'Vente', 'vente')");
    const f = Number(db.prepare("INSERT INTO mk_funnels (organization_id, name) VALUES (1, 'Tunnel formation')").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (1, ?, 1, 'landing', 'Accueil', ?), (1, ?, 2, 'page', 'Vente', ?)").run(f, page1, f, page2);
    const u = run("INSERT INTO users (username, email) VALUES ('eve', 'eve@x.fr')");
    bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    const contact = one("SELECT * FROM mk_contacts WHERE lms_user_id = ?", u);

    // 1. Le visiteur arrive par une publicité Google, voit deux pages, clique (suivi réel du navigateur, avec accord)
    const t0 = NOW - 3 * HOUR;
    visitors.record(db, 1, { visitorId: vid(77), sessionId: "sessionReel1", userAgent: ua, now: t0, events: [start("/p/accueil", { us: "google", um: "cpc", uc: "formation" }), pv("/p/accueil"), { t: "button_click", p: "/p/accueil", x: "cta-principal" }, pv("/p/vente")] });
    // 2. Il envoie un formulaire (enregistré par le serveur) et devient un contact connu : son parcours passé est rejoué avec les vraies dates
    visitors.recordFormSubmit(db, 1, { visitorId: vid(77), contactId: contact.id, path: "/p/accueil", formName: "Inscription", now: t0 + 60000 });
    funnelEvents.replayVisitor(ctxAt(), vid(77), contact.id);
    core.recordEvent(ctxAt(), { contactId: contact.id, type: "form.submitted", source: "form", occurredAt: t0 + 60000, idempotencyKey: "form.submitted:reel:1" });
    // 3. Il achète : commande réelle, lue par le pont → purchase.completed → scénario → e-mail transactionnel
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 9900, ?)", u, new Date(NOW - HOUR).toISOString().slice(0, 19).replace("T", " "));
    bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    await pump();
    const runRow = one("SELECT id FROM mk_automation_runs WHERE automation_id = ?", a.id);
    await handlers["automation.run"]({ organizationId: 1, runId: runRow.id });
    assert.equal(sent.length, 1);
    // 4. Suivi de l'e-mail : ouverture et clic réels du destinataire
    const msg = one("SELECT * FROM mk_messages WHERE contact_id = ?", contact.id);
    tracking.recordOpen(ctxAt(), { messageId: msg.id, userAgent: ua, at: NOW });

    const d = dash();
    const S = d.sections;
    assert.equal(S.traffic.kpis.visitors, 1); assert.equal(S.traffic.kpis.pageViews, 2); assert.equal(S.traffic.sessions === undefined, true);
    assert.equal(S.traffic.sources[0].source, "paid"); assert.equal(S.traffic.sources[0].campaign, "formation");
    const conv = (k) => S.conversions.rows.find((r) => r.key === k);
    assert.equal(conv("form").events, 1); assert.equal(conv("purchase").events, 1);
    const F = S.funnels.rows.find((r) => r.name === "Tunnel formation");
    assert.equal(F.entered, 1); assert.deepEqual(F.steps.map((s) => s.contacts), [1, 1]); assert.equal(F.completed, 1); assert.equal(F.purchases, 1); assert.equal(F.revenueCents, 9900);
    assert.equal(S.commerce.kpis.grossCents, 9900); assert.equal(S.commerce.kpis.orders, 1);
    assert.equal(S.attribution.rows[0].source, "paid", "dernier contact = la publicité Google"); assert.equal(S.attribution.rows[0].revenueCents, 9900);
    assert.equal(S.contacts.newCustomers, 1);
    assert.equal(S.email.sent, 1, "l'envoi est lu dans le journal de l'Email Engine"); assert.equal(S.email.uniqueOpens, 1);
    assert.equal(S.automations.started, 1); assert.equal(S.automations.completed, 1);
  });

  test("attribution de bout en bout (google/cpc/formation → formulaire → tunnel → achat) : premier et dernier contact", () => {
    const u = run("INSERT INTO users (username, email) VALUES ('att', 'att@x.fr')");
    bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    const c = one("SELECT id FROM mk_contacts WHERE lms_user_id = ?", u).id;
    visit(88, [start("/p/x", { us: "google", um: "cpc", uc: "formation" })], { at: NOW - 3 * DAY, session: "sessAttr0001" });
    visitors.linkVisitor(db, 1, vid(88), c);
    run("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 3000, ?)", u, new Date(NOW - HOUR).toISOString().slice(0, 19).replace("T", " "));
    for (const model of ["first", "last"]) assert.equal(dash({ model }).sections.attribution.rows[0].campaign, "formation", model);
  });

  test("abandon puis achat : un achat réalisé n'est pas compté comme abandon final", () => {
    const abandon = require("../src/marketing/funnels/abandon");
    const u = run("INSERT INTO users (username, email) VALUES ('ab', 'ab@x.fr')"); bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    const c = one("SELECT id FROM mk_contacts WHERE lms_user_id = ?", u).id;
    core.recordEvent(ctxAt(), { contactId: c, type: "lms.checkout_started", source: "site", occurredAt: NOW - 10 * HOUR });
    assert.equal(abandon.sweep(ctxAt(), { now: NOW, checkoutHours: 1 }).checkouts, 1);
    assert.equal(dash().sections.commerce.abandonedCheckouts, 1);
    const u2 = run("INSERT INTO users (username, email) VALUES ('ab2', 'ab2@x.fr')"); bridge.syncLmsEvents(ctxAt(), { limit: 50 });
    const c2 = one("SELECT id FROM mk_contacts WHERE lms_user_id = ?", u2).id;
    core.recordEvent(ctxAt(), { contactId: c2, type: "lms.checkout_started", source: "site", occurredAt: NOW - 10 * HOUR });
    core.recordEvent(ctxAt(), { contactId: c2, type: "purchase.completed", source: "commerce", occurredAt: NOW - 9 * HOUR });
    assert.equal(abandon.sweep(ctxAt(), { now: NOW, checkoutHours: 1 }).checkouts, 0);
    assert.equal(dash().sections.commerce.abandonedCheckouts, 1);
  });
});
