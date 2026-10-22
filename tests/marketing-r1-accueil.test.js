// Marketing R1 — Accueil : données réelles (aperçu), graphique SVG, alertes, préparation à l'envoi, page rendue.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { freshMarketing, TEST_KEY, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const config = require("../src/marketing/sending/config");
const { getOverview } = require("../src/marketing/overview");
const { barChart } = require("../src/marketing/web/charts");

const DAY = 86_400_000;
const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
let m, A, B;
const ov = (over = {}) => getOverview(A, { workerOn: false, smtpAvailable: false, keyOk: true, ...over });
const subscribed = (email, createdMs = T0 - DAY) => {
  const { contact } = audience.upsertContact(A, { email });
  compliance.recordConsent(A, contact.id, PROOF);
  m.db.prepare("UPDATE mk_contacts SET created_at = ? WHERE id = ?").run(sqlDate(createdMs), contact.id);
  return contact;
};
const campaign = (name, o = {}) => {
  const v = { status: "sent", started_at: T0 - 2 * DAY, finished_at: T0 - 2 * DAY + 60_000, sent_count: 0, unique_click_count: 0, bounced_count: 0, complained_count: 0, unsubscribed_count: 0, kind: "campaign", org: 1, ...o };
  return Number(m.db.prepare(
    `INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, kind, status, started_at, finished_at, sent_count, unique_click_count, bounced_count, complained_count, unsubscribed_count, total_recipients)
     VALUES (?, ?, 'list', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(v.org, name, v.kind, v.status, v.started_at, v.finished_at, v.sent_count, v.unique_click_count, v.bounced_count, v.complained_count, v.unsubscribed_count, v.sent_count).lastInsertRowid);
};

beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("aperçu : contacts", () => {
  test("organisation vide : tout à zéro, huit semaines de croissance, aucune alerte", () => {
    const o = ov();
    assert.deepEqual([o.contacts.total, o.contacts.sendable, o.contacts.newInPeriod, o.contacts.unsubscribedInPeriod, o.contacts.blocked], [0, 0, 0, 0, 0]);
    assert.equal(o.growth.length, 8);
    assert.ok(o.growth.every((g) => g.count === 0 && typeof g.label === "string" && g.label));
    assert.deepEqual(o.alerts, []);
    assert.deepEqual(o.activity, []);
    assert.equal(o.campaigns.sentInPeriod, 0);
    assert.equal(o.campaigns.clickRate, null, "aucun message envoyé : pas de taux (jamais « 0 % »)");
  });
  test("totaux par statut, joignables (consentement prouvé) et bloqués", () => {
    subscribed("a@ex.fr"); subscribed("b@ex.fr");
    audience.upsertContact(A, { email: "c@ex.fr" }); // sans consentement
    const u = audience.upsertContact(A, { email: "d@ex.fr" }).contact;
    m.db.prepare("UPDATE mk_contacts SET status = 'bounced' WHERE id = ?").run(u.id);
    const s = audience.upsertContact(A, { email: "e@ex.fr" }).contact;
    m.db.prepare("UPDATE mk_contacts SET status = 'suppressed' WHERE id = ?").run(s.id);
    const o = ov();
    assert.equal(o.contacts.total, 5);
    assert.equal(o.contacts.sendable, 2);
    assert.equal(o.contacts.byStatus.unknown, 1);
    assert.equal(o.contacts.blocked, 2);
  });
  test("« abonné » sans preuve de consentement n'est PAS compté comme joignable", () => {
    const c = audience.upsertContact(A, { email: "x@ex.fr" }).contact;
    m.db.prepare("UPDATE mk_contacts SET status = 'subscribed' WHERE id = ?").run(c.id);
    assert.equal(ov().contacts.sendable, 0);
  });
  test("période de 30 jours : un contact de 31 jours n'est pas « nouveau », un de 29 jours l'est", () => {
    subscribed("vieux@ex.fr", T0 - 31 * DAY); subscribed("recent@ex.fr", T0 - 29 * DAY);
    const o = ov();
    assert.equal(o.contacts.total, 2);
    assert.equal(o.contacts.newInPeriod, 1);
  });
  test("croissance : nouveaux contacts par semaine, la semaine en cours en dernier", () => {
    subscribed("s0@ex.fr", T0 - 1 * DAY);
    subscribed("s0b@ex.fr", T0 - 2 * DAY);
    subscribed("s1@ex.fr", T0 - 9 * DAY);
    subscribed("s7@ex.fr", T0 - 55 * DAY);
    subscribed("hors@ex.fr", T0 - 70 * DAY);
    const g = ov().growth.map((x) => x.count);
    assert.equal(g.length, 8);
    assert.equal(g[7], 2);
    assert.equal(g[6], 1);
    assert.equal(g[0], 1);
    assert.equal(g.reduce((a, b) => a + b, 0), 4, "un contact plus ancien que 8 semaines n'est pas dans le graphique");
  });
  test("désinscriptions de la période", () => {
    const a = subscribed("a@ex.fr"), b = subscribed("b@ex.fr");
    m.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?").run(sqlDate(T0 - 3 * DAY), a.id);
    m.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?").run(sqlDate(T0 - 40 * DAY), b.id);
    assert.equal(ov().contacts.unsubscribedInPeriod, 1);
  });
  test("isolation : l'autre organisation n'apparaît nulle part", () => {
    audience.upsertContact(B, { email: "b@ex.fr" });
    campaign("Chez B", { org: 2, sent_count: 50, status: "failed" });
    const o = ov();
    assert.equal(o.contacts.total, 0);
    assert.equal(o.campaigns.recent.length, 0);
    assert.deepEqual(o.alerts, []);
  });
});

describe("aperçu : campagnes", () => {
  test("agrégats sur la période : envoyées, messages, taux de clic, rebonds, plaintes, désinscriptions", () => {
    campaign("C1", { sent_count: 100, unique_click_count: 10, bounced_count: 1, complained_count: 0, unsubscribed_count: 2 });
    campaign("C2", { sent_count: 100, unique_click_count: 30, bounced_count: 3, complained_count: 1, unsubscribed_count: 0, started_at: T0 - 5 * DAY });
    campaign("Ancienne", { sent_count: 999, started_at: T0 - 45 * DAY, finished_at: T0 - 45 * DAY });
    campaign("Brouillon", { status: "draft", started_at: null, finished_at: null });
    const c = ov().campaigns;
    assert.equal(c.sentInPeriod, 2);
    assert.equal(c.messagesInPeriod, 200);
    assert.equal(c.clickRate, 20);
    assert.equal(c.bounceRate, 2);
    assert.equal(c.complaintRate, 0.5);
    assert.equal(c.unsubscribed, 2);
  });
  test("les campagnes « système » des automatisations ne sont pas des campagnes", () => {
    campaign("Auto", { kind: "automation", sent_count: 10 });
    const o = ov();
    assert.equal(o.campaigns.sentInPeriod, 0);
    assert.equal(o.campaigns.recent.length, 0);
  });
  test("récentes : cinq maximum, la plus récente d'abord, avec son taux de clic", () => {
    for (let i = 1; i <= 7; i++) campaign(`C${i}`, { sent_count: 10, unique_click_count: i, started_at: T0 - (10 - i) * DAY });
    const r = ov().campaigns.recent;
    assert.equal(r.length, 5);
    assert.equal(r[0].name, "C7");
    assert.equal(r[0].clickRate, 70);
    assert.deepEqual(Object.keys(r[0]).sort(), ["clickRate", "id", "name", "sent", "status", "when"].sort());
  });
  test("un brouillon apparaît parmi les récentes, sans taux", () => {
    const id = campaign("Brouillon", { status: "draft", started_at: null, finished_at: null });
    const r = ov().campaigns.recent.find((x) => x.id === id);
    assert.equal(r.status, "draft");
    assert.equal(r.clickRate, null);
  });
});

describe("aperçu : automatisations", () => {
  test("compte les scénarios par état, les passages en cours et en échec", () => {
    const ins = (name, status) => Number(m.db.prepare("INSERT INTO mk_automations (organization_id, name, status, trigger_event) VALUES (1, ?, ?, 'lms.user_registered')").run(name, status).lastInsertRowid);
    const a = ins("A", "active"); ins("B", "paused"); ins("C", "draft");
    const contact = subscribed("z@ex.fr");
    const run = (status, cid) => m.db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, status, steps, wake_at, entered_at) VALUES (1, ?, ?, ?, '[]', 0, 0)").run(a, cid, status);
    run("running", contact.id);
    const c2 = subscribed("y@ex.fr"); run("failed", c2.id);
    const au = ov().automations;
    assert.deepEqual([au.active, au.paused, au.draft, au.running, au.failedRuns], [1, 1, 1, 1, 1]);
  });
});

describe("aperçu : préparation à l'envoi", () => {
  const item = (o, key) => o.readiness.items.find((i) => i.key === key);
  test("configuration par défaut : rien n'est prêt, chaque point dit quoi faire", () => {
    const o = getOverview({ ...A, baseUrl: "" }, { workerOn: false, smtpAvailable: false, keyOk: false });
    assert.equal(o.readiness.ready, false);
    for (const key of ["key", "provider", "sender", "address", "worker", "https", "template", "audience"]) {
      const i = item(o, key);
      assert.ok(i, key);
      assert.equal(i.ok, false, key);
      assert.ok(i.label && i.detail, key);
    }
    assert.equal(o.readiness.done, 0);
    assert.equal(o.readiness.total, 8);
  });
  test("chaque point passe au vert quand la configuration est faite", () => {
    config.saveSendingConfig(A, { provider: "smtp", from: "KOLAKISA <no-reply@k.test>" });
    templates.setOrgAddress(A, "12 rue des Écoles\n75005 Paris");
    templates.createTemplate(A, { name: "M", subject: "S", blocks: [{ type: "text", markdown: "Bonjour" }] });
    subscribed("a@ex.fr");
    const o = ov({ workerOn: true, smtpAvailable: true });
    assert.equal(o.readiness.ready, true, JSON.stringify(o.readiness.items.filter((i) => !i.ok)));
    assert.equal(o.readiness.done, 8);
  });
  test("fournisseur SMTP choisi mais serveur SMTP non configuré : signalé", () => {
    config.saveSendingConfig(A, { provider: "smtp", from: "K <no-reply@k.test>" });
    assert.equal(item(ov({ smtpAvailable: false }), "provider").ok, false);
    assert.match(item(ov({ smtpAvailable: false }), "provider").detail, /SMTP/);
  });
  test("fournisseur « console » : mode test, présenté comme tel", () => {
    assert.match(item(ov(), "provider").detail, /test|aucun message/i);
  });
  test("jamais de promesse de délivrabilité : la note dit ce que la vérification ne couvre pas", () => {
    assert.match(ov().readiness.note, /SPF|DKIM|DMARC/);
    assert.match(ov().readiness.note, /ne garantit/i);
  });
});

describe("aperçu : alertes", () => {
  test("clé de chiffrement absente : erreur", () => {
    assert.ok(ov({ keyOk: false }).alerts.some((a) => a.level === "error" && /ENCRYPTION_KEY/.test(a.text)));
  });
  test("traitement en arrière-plan désactivé alors que des envois ou scénarios l'attendent : avertissement humain, détail technique séparé", () => {
    assert.equal(ov().alerts.length, 0, "rien n'attend : pas d'alerte");
    m.db.prepare("INSERT INTO mk_automations (organization_id, name, status, trigger_event) VALUES (1, 'Actif', 'active', 'contact.created')").run();
    const a = ov({ workerOn: false }).alerts.find((x) => /indisponible/.test(x.text));
    assert.ok(a, "un message humain (sans jargon) doit être présent");
    assert.doesNotMatch(a.text, /MARKETING_WORKER/, "le nom de la variable d'environnement ne doit pas s'imposer dans le message principal");
    assert.match(a.detail, /MARKETING_WORKER/, "le détail technique reste disponible, à part");
    assert.equal(ov({ workerOn: true }).alerts.length, 0);
  });
  test("travaux définitivement en échec : erreur, réservée à qui gère la file", () => {
    m.db.prepare("INSERT INTO mk_jobs (organization_id, type, payload, state, run_at, created_at, updated_at) VALUES (1, 'x', '{}', 'dead', 0, 0, 0)").run();
    assert.ok(ov().alerts.some((a) => a.level === "error" && /échec définitif|définitivement/i.test(a.text)));
    assert.ok(!ov({ can: (p) => p !== "queue.manage" }).alerts.some((a) => /définitivement|échec définitif/i.test(a.text)));
  });
  test("campagne en échec sur la période : erreur avec lien vers la campagne", () => {
    const id = campaign("Ratée", { status: "failed" });
    const a = ov().alerts.find((x) => /Ratée/.test(x.text));
    assert.ok(a);
    assert.equal(a.level, "error");
    assert.equal(a.href, `/marketing/campagnes/${id}`);
  });
  test("taux de rebond élevé (seuil 2 %, au moins 20 messages) et plaintes (0,1 %)", () => {
    campaign("Sale", { sent_count: 100, bounced_count: 5, complained_count: 1 });
    const texts = ov().alerts.map((a) => a.text).join("|");
    assert.match(texts, /rebond/i);
    assert.match(texts, /plainte/i);
  });
  test("pas d'alerte de rebond sous 20 messages (statistique trop faible)", () => {
    campaign("Petite", { sent_count: 10, bounced_count: 5 });
    assert.ok(!ov().alerts.some((a) => /rebond/i.test(a.text)));
  });
  test("passages d'automatisation en échec : avertissement", () => {
    const a = Number(m.db.prepare("INSERT INTO mk_automations (organization_id, name, status, trigger_event) VALUES (1, 'S', 'paused', 'contact.created')").run().lastInsertRowid);
    const c = subscribed("p@ex.fr");
    m.db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, status, steps, wake_at, entered_at) VALUES (1, ?, ?, 'failed', '[]', 0, 0)").run(a, c.id);
    assert.ok(ov().alerts.some((x) => x.level === "warn" && /scénario|passage/i.test(x.text) && x.href === `/marketing/automatisations/${a}`));
  });
  test("les alertes graves passent avant les avertissements", () => {
    m.db.prepare("INSERT INTO mk_automations (organization_id, name, status, trigger_event) VALUES (1, 'Actif', 'active', 'contact.created')").run();
    const levels = ov({ keyOk: false }).alerts.map((a) => a.level);
    assert.deepEqual(levels, [...levels].sort((x, y) => (x === "error" ? 0 : 1) - (y === "error" ? 0 : 1)));
  });
});

describe("aperçu : activité récente", () => {
  test("mélange campagnes terminées, imports et événements, du plus récent au plus ancien, dix au plus", () => {
    campaign("Terminée", { started_at: T0 - 3 * DAY, finished_at: T0 - 3 * DAY + 5000, sent_count: 42 });
    m.db.prepare("INSERT INTO mk_imports (organization_id, filename, status, total_rows, created_count, created_at) VALUES (1, 'liste.csv', 'done', 30, 28, ?)").run(sqlDate(T0 - 1 * DAY));
    m.db.prepare("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, created_at) VALUES (1, 'lms.user_registered', 'n@ex.fr', 'lms', ?, ?)").run(T0 - 2 * DAY, T0 - 2 * DAY);
    const a = ov().activity;
    assert.equal(a.length, 3);
    assert.deepEqual(a.map((x) => x.at), [...a.map((x) => x.at)].sort((x, y) => y - x));
    assert.match(a[0].text, /liste\.csv/);
    assert.match(a[1].text, /compte est créé/i);
    assert.match(a[2].text, /Terminée/);
    assert.match(a[2].text, /42/);
  });
  test("dix éléments au maximum", () => {
    for (let i = 0; i < 15; i++) m.db.prepare("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, created_at) VALUES (1, 'lms.order_completed', 'n@ex.fr', 'lms', ?, ?)").run(T0 - i * 1000, T0);
    assert.equal(ov().activity.length, 10);
  });
  test("un événement de nom inconnu est affiché tel quel, sans planter", () => {
    m.db.prepare("INSERT INTO mk_events (organization_id, name, email, source, occurred_at, created_at) VALUES (1, 'x.inconnu', 'n@ex.fr', 'api', ?, ?)").run(T0, T0);
    assert.match(ov().activity[0].text, /x\.inconnu/);
  });
});

describe("graphique SVG", () => {
  const items = [{ label: "S-7", count: 0 }, { label: "S-6", count: 3 }, { label: "S-5", count: 10 }];
  test("un rectangle par valeur, accessible, sans dépendance", () => {
    const svg = barChart(items, { title: "Nouveaux contacts par semaine" });
    assert.match(svg, /^<svg[^>]+role="img"[^>]+aria-label="Nouveaux contacts par semaine : S-7 0, S-6 3, S-5 10"/);
    assert.equal((svg.match(/<rect /g) || []).length, 3);
    assert.match(svg, /class="mk-chart"/);
    assert.doesNotMatch(svg, /<script|onclick|<foreignObject/i);
  });
  test("hauteurs proportionnelles ; valeur nulle = petite barre plate mais VISIBLE (pas confondue avec le trait d'axe)", () => {
    const heights = [...barChart(items, { title: "t" }).matchAll(/<rect [^>]*height="([\d.]+)"/g)].map((x) => Number(x[1]));
    assert.equal(heights[2] > heights[1] && heights[1] > heights[0], true);
    assert.equal(heights[0], 3, "assez épaisse pour se voir, plus discrète que les valeurs réelles");
    assert.match(barChart(items, { title: "t" }), /class="mk-bar is-zero"/);
  });
  test("tout à zéro : pas de division par zéro, aucun NaN", () => {
    const svg = barChart([{ label: "a", count: 0 }, { label: "b", count: 0 }], { title: "t" });
    assert.doesNotMatch(svg, /NaN|Infinity/);
  });
  test("libellés échappés (aucune injection)", () => {
    const svg = barChart([{ label: '"><script>alert(1)</script>', count: 1 }], { title: '<b>"x"</b>' });
    assert.doesNotMatch(svg, /<script>|<b>/);
    assert.match(svg, /&lt;script&gt;/);
  });
  test("liste vide : SVG valide sans barre", () => {
    const svg = barChart([], { title: "t" });
    assert.match(svg, /^<svg/);
    assert.equal((svg.match(/<rect /g) || []).length, 0);
  });
  test("beaucoup de barres (ex. 30 jours) : une barre chacune, mais des libellés espacés (sinon illisibles sur 480px)", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}/09`, count: i }));
    const svg = barChart(many, { title: "t" });
    assert.equal((svg.match(/<rect /g) || []).length, 30, "une barre par jour, aucune n'est retirée");
    const labels = (svg.match(/<text class="mk-chart-label"/g) || []).length;
    assert.ok(labels <= 11, `${labels} libellés affichés : devrait être espacé`);
    assert.match(svg, /30\/09/, "le dernier point garde toujours son libellé");
    assert.equal((svg.match(/<text class="mk-chart-value"/g) || []).length, 0, "au-delà du seuil, les valeurs au-dessus des barres se chevaucheraient aussi");
  });
  test("régression : les deux derniers libellés ne sont jamais collés l'un à l'autre", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ label: `${i + 1}`, count: 1 }));
    const svg = barChart(many, { title: "t" });
    const shown = [...svg.matchAll(/<text class="mk-chart-label"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
    assert.deepEqual(shown, [1, 4, 7, 10, 13, 16, 19, 22, 25, 30], "le point 28 (trop proche de 30) doit être retiré, jamais empilé à côté");
  });
  test("régression : le premier et le dernier libellé ne sont jamais centrés sur leur barre (sinon rognés par le bord du viewBox)", () => {
    const svg = barChart(items, { title: "t" }); // S-7, S-6, S-5
    const anchors = [...svg.matchAll(/<text class="mk-chart-label" x="[\d.]+" y="[\d.]+" text-anchor="(\w+)">/g)].map((m) => m[1]);
    assert.deepEqual(anchors, ["start", "middle", "end"]);
  });
  test("peu de barres (huit semaines, comme l'Accueil) : chaque barre garde son libellé, comportement inchangé", () => {
    const svg = barChart(items, { title: "t" });
    assert.equal((svg.match(/<text class="mk-chart-label"/g) || []).length, 3);
  });
});

describe("page Accueil", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
  const member = async (role) => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
    return c;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("le texte périmé « envoi pas encore disponible » a disparu ; les blocs attendus sont là", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.doesNotMatch(html, /pas encore disponible|jalon suivant/);
    for (const marker of ["mk-kpis", "mk-chart", "mk-readiness", "mk-activity"]) assert.ok(html.includes(marker), marker);
    assert.match(html, /<h1>Accueil<\/h1>/);
    assert.match(html, /30 derniers jours/);
  });
  test("préparation à l'envoi : points à faire listés avec un lien vers le bon réglage", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /Préparez vos envois/);
    assert.match(html, /href="\/marketing\/envoi"/);
    assert.match(html, /ne garantit/);
  });
  test("sans contact joignable ni campagne : guide de premiers pas avec actions", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /Créez votre premier envoi/);
    assert.match(html, /href="\/marketing\/importer"/);
    assert.match(html, /href="\/marketing\/contacts\/nouveau"/);
  });
  test("après une campagne et un contact joignable : le guide disparaît, la campagne est listée (nom échappé)", async () => {
    run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, started_at, finished_at, sent_count, unique_click_count, total_recipients) VALUES (1, ?, 'list', 1, 'sent', ?, ?, 10, 2, 10)", "<script>alert(9)</script>", Date.now() - 1000, Date.now());
    run("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, 'ok@ex.fr', 'subscribed')");
    run("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, (SELECT id FROM mk_contacts WHERE email = 'ok@ex.fr'), 'granted', 'form', 'Oui')");
    const html = (await boss.get("/marketing")).text;
    assert.doesNotMatch(html, /Créez votre premier envoi/);
    assert.doesNotMatch(html, /<script>alert\(9\)/);
    assert.match(html, /&lt;script&gt;alert\(9\)/);
    assert.match(html, /20 %/);
  });
  test("répartition des contacts par statut (aucune information perdue par rapport à l'ancien tableau de bord)", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /Répartition des contacts/);
    for (const label of ["Abonnés", "Pas de consentement", "Désinscrits", "Bloqués"]) assert.match(html, new RegExp(`mk-status[^"]*">${label}</span>\\s*(?:</span>)?\\s*<strong>\\d+</strong>`), label);
  });
  test("le contact créé par l'interface est compté dans les nouveaux contacts", async () => {
    const before = Number((await boss.get("/marketing")).text.match(/Nouveaux contacts<\/span><span class="mk-kpi-value">(\d+)/)[1]);
    await boss.post("/marketing/contacts", { email: "nouveau@ex.fr" });
    const after = Number((await boss.get("/marketing")).text.match(/Nouveaux contacts<\/span><span class="mk-kpi-value">(\d+)/)[1]);
    assert.equal(after, before + 1);
  });
  test("lecteur : chiffres visibles, mais ni actions rapides ni préparation à l'envoi (réglages réservés aux administrateurs)", async () => {
    const viewer = await member("viewer");
    const html = (await viewer.get("/marketing")).text;
    assert.equal((await viewer.get("/marketing")).status, 200);
    assert.match(html, /mk-kpis/);
    assert.doesNotMatch(html, /Préparez vos envois/);
    assert.doesNotMatch(html, /href="\/marketing\/contacts\/nouveau"|href="\/marketing\/importer"|href="\/marketing\/envoi"/);
  });
  test("éditeur : actions rapides de création, sans les réglages d'envoi", async () => {
    const ed = await member("editor");
    const html = (await ed.get("/marketing")).text;
    assert.match(html, /href="\/marketing\/contacts\/nouveau"/);
    assert.match(html, /href="\/marketing\/campagnes\/nouvelle"/);
    assert.doesNotMatch(html, /href="\/marketing\/envoi"/);
  });
  test("l'étudiant reste refusé", async () => {
    assert.equal((await (await newStudent(srv)).get("/marketing")).status, 403);
  });
});
