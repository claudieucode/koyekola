// Marketing R7 — Analytics : page rendue (onglets de période, état vide, chiffres, campagnes, liens, permissions).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("page Analytics", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
  const member = async (role) => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
    return c;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("est dans le registre de navigation, en dehors de « à venir »", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /href="\/marketing\/analytics"/);
  });

  test("sans aucun envoi : état vide explicite, pas de tableau", async () => {
    const res = await boss.get("/marketing/analytics");
    assert.equal(res.status, 200);
    assert.match(res.text, /<h1>Analytics<\/h1>/);
    assert.match(res.text, /Aucun envoi sur cette période/);
    assert.doesNotMatch(res.text, /mk-datatable/);
  });

  test("onglets de période : 30 jours actif par défaut, les trois choix sont proposés", async () => {
    const html = (await boss.get("/marketing/analytics")).text;
    assert.match(html, /<a class="mk-tab" href="\/marketing\/analytics\?periode=30"[^>]*aria-current="page"/);
    for (const d of [7, 30, 90]) assert.match(html, new RegExp(`href="/marketing/analytics\\?periode=${d}"`));
  });

  test("une période inconnue dans l'adresse retombe sur 30 jours sans erreur", async () => {
    const res = await boss.get("/marketing/analytics?periode=abc");
    assert.equal(res.status, 200);
    assert.match(res.text, /periode=30"[^>]*aria-current="page"/);
  });

  test("avec des envois : cartes de chiffres, graphique, campagnes et liens de la période (nom échappé)", async () => {
    const now = Date.now();
    const db = srv.db();
    const campaignId = Number(
      db
        .prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, kind, status, started_at, finished_at, sent_count, unique_open_count, unique_click_count, bounced_count, total_recipients) VALUES (1, ?, 'list', 1, 'campaign', 'sent', ?, ?, 100, 40, 10, 1, 100)")
        .run("<script>alert(1)</script>", now - 1000, now).lastInsertRowid
    );
    const contactId = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, 'x@ex.fr', 'unknown')").run().lastInsertRowid);
    const messageId = Number(db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email) VALUES (1, ?, ?, 'x@ex.fr')").run(campaignId, contactId).lastInsertRowid);
    db.prepare("INSERT INTO mk_message_events (organization_id, message_id, campaign_id, type, bot, occurred_at) VALUES (1, ?, ?, 'sent', 0, ?)").run(messageId, campaignId, now - 1000);
    db.prepare("INSERT INTO mk_links (organization_id, campaign_id, url, click_count, unique_click_count) VALUES (1, ?, 'https://exemple.fr/promo', 3, 2)").run(campaignId);
    db.close();

    const html = (await boss.get("/marketing/analytics")).text;
    assert.doesNotMatch(html, /Aucun envoi sur cette période/);
    assert.match(html, /mk-stats/);
    assert.match(html, /mk-chart/);
    assert.match(html, /mk-datatable/);
    assert.match(html, /40 %/); // taux d'ouverture de la campagne
    assert.match(html, /exemple\.fr\/promo/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
    assert.match(html, /&lt;script&gt;alert\(1\)/);
  });

  test("lecteur : la page est accessible (analytics.read = droit minimal)", async () => {
    const viewer = await member("viewer");
    const res = await viewer.get("/marketing/analytics");
    assert.equal(res.status, 200);
    assert.match(res.text, /<h1>Analytics<\/h1>/);
  });

  test("non membre de l'équipe marketing : accès refusé", async () => {
    const outsider = await newStudent(srv);
    const res = await outsider.get("/marketing/analytics");
    assert.equal(res.status, 403);
  });
});
