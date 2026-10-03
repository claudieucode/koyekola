// Marketing — revenus, pages : « Analytics → Revenus », réglage de la fenêtre, revenus dans le rapport de campagne et d'automatisation.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss, campId, autoId;
const run = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).run(...args); db.close(); return r; };
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  const tplId = Number((await boss.post("/marketing/modeles", { name: "Modèle", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  run("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Clients')");
  const listId = sql("SELECT id FROM mk_lists WHERE name = 'Clients'")[0].id;
  campId = Number(run("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, status, sent_count, total_recipients) VALUES (1, 'Promo Excel', ?, 'list', ?, 'sent', 4, 4)", tplId, listId).lastInsertRowid);
  autoId = Number(run("INSERT INTO mk_automations (organization_id, name, trigger_event) VALUES (1, 'Bienvenue', 'lms.user_registered')").lastInsertRowid);
  const sysId = Number(run("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, status, kind, automation_id) VALUES (1, 'auto:1', ?, 'list', ?, 'sending', 'automation', ?)", tplId, listId, autoId).lastInsertRowid);
  const contact = Number(run("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, 'acheteuse@ex.fr', 'subscribed')").lastInsertRowid);
  const now = Date.now();
  const add = (orderId, cents, campaign, automation) => run(
    "INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, campaign_id, automation_id, amount_cents, ordered_at, clicked_at, created_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)",
    orderId, contact, campaign, automation, cents, now - 3600000, now - 7200000, now);
  add(1, 4900, campId, null);
  add(2, 2900, campId, null);
  add(3, 1500, sysId, autoId);
});
after(() => srv.stop());

describe("page « Revenus »", () => {
  test("totaux, classement par campagne et par automatisation, dernières ventes (adresse masquée)", async () => {
    const html = (await boss.get("/marketing/revenus")).text;
    assert.match(html, /<h1>Revenus<\/h1>/);
    assert.match(html, /href="\/marketing\/revenus"/, "entrée du menu Analytics");
    assert.match(html, /93,00 €/, "4900 + 2900 + 1500 centimes");
    assert.match(html, /3 commandes · 1 acheteur/);
    assert.match(html, /<a href="\/marketing\/campagnes\/\d+">Promo Excel<\/a><\/td>\s*<td class="mk-num" data-label="Commandes">2<\/td>\s*<td class="mk-num" data-label="Revenus"><strong>78,00 €<\/strong>/);
    assert.match(html, /19,50 €/, "78 € / 4 destinataires");
    assert.match(html, /Bienvenue<\/a><\/td>\s*<td class="mk-num" data-label="Commandes">1<\/td>/);
    assert.doesNotMatch(html, /acheteuse@ex\.fr/, "adresse masquée");
    assert.match(html, /dernier e-mail cliqué<\/strong> par l(?:'|&#39;)acheteur dans les <strong>7 jours/);
  });
  test("période : 30 jours par défaut, 90 jours et 12 mois ; valeur inconnue ignorée", async () => {
    assert.match((await boss.get("/marketing/revenus?periode=90")).text, /href="\/marketing\/revenus\?periode=90" aria-current="page"/);
    assert.match((await boss.get("/marketing/revenus?periode=abc")).text, /href="\/marketing\/revenus\?periode=30" aria-current="page"/);
  });
  test("fenêtre d'attribution : réglable par un administrateur (1 à 30 jours), refus clair hors bornes", async () => {
    let res = await boss.post("/marketing/revenus/fenetre", { days: "14" });
    assert.match((await boss.get(res.location)).text, /Fenêtre d(?:'|&#39;)attribution : 14 jours/);
    assert.match((await boss.get("/marketing/revenus")).text, /dans les <strong>14 jours/);
    res = await boss.post("/marketing/revenus/fenetre", { days: "45" });
    assert.match((await boss.get(res.location)).text, /entre 1 et 30/);
    await boss.post("/marketing/revenus/fenetre", { days: "7" });
  });
  test("droits : un lecteur voit la page sans le réglage ; il ne peut pas le modifier ; un étudiant est refusé", async () => {
    const viewer = await member("viewer");
    const html = (await viewer.get("/marketing/revenus")).text;
    assert.match(html, /<h1>Revenus<\/h1>/);
    assert.doesNotMatch(html, /action="\/marketing\/revenus\/fenetre"/);
    assert.equal((await viewer.post("/marketing/revenus/fenetre", { days: "3" })).status, 403);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/marketing/revenus")).status, 200);
  });
});

describe("revenus dans les rapports", () => {
  test("rapport de campagne : carte « Revenus générés » avec le revenu par destinataire", async () => {
    const html = (await boss.get(`/marketing/campagnes/${campId}`)).text;
    assert.match(html, /Revenus générés \(2 commandes\)<\/span><span class="mk-stat-value">78,00 €/);
    assert.match(html, /19,50 € par destinataire/);
  });
  test("page de l'automatisation : revenus générés", async () => {
    const html = (await boss.get(`/marketing/automatisations/${autoId}`)).text;
    assert.match(html, /15,00 €<\/div><div class="label">Revenus générés \(1 commande\)/);
  });
});
