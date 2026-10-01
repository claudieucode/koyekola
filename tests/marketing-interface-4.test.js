// Marketing M3e — pages /marketing/envoi (réglages) et /marketing/campagnes : accès, contrôle avant envoi, confirmation, suivi.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const follow = async (client, res) => (res.location ? client.get(res.location) : res);
const post = async (client, url, form) => follow(client, await client.post(url, form));
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const campId = (name) => sql("SELECT id FROM mk_campaigns WHERE name = ?", name)[0]?.id;
const PAGE = "Bonjour {{contact.first_name | default:\"ami\"}} [Site](https://ex.fr/a)";

async function seedAudience(server, prefix, n = 3) {
  const db = server.db();
  db.exec("INSERT OR IGNORE INTO mk_lists (organization_id, name) VALUES (1, 'Newsletter')");
  const listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Newsletter'").get().id;
  for (let i = 0; i < n; i++) {
    const email = `${prefix}${i}@ex.fr`;
    const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, status) VALUES (1, ?, ?, 'subscribed')").run(email, `P${i}`).lastInsertRowid);
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'J''accepte la newsletter')").run(id);
    db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(listId, id);
  }
  db.prepare("INSERT OR IGNORE INTO mk_settings (organization_id, key, value) VALUES (1, 'org.address', '12 rue des Écoles')").run();
  db.close();
  return listId;
}
async function seedTemplate(client, name) {
  const res = await client.post("/marketing/modeles", { name, starter: "blank", kind: "marketing" });
  return Number(res.location.match(/(\d+)$/)[1]);
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("réglages d'envoi /marketing/envoi", () => {
  test("accès : administrateur seulement pour modifier ; lecteur refusé ; étudiant refusé", async () => {
    assert.equal((await boss.get("/marketing/envoi")).status, 200);
    const ed = await member("editor");
    assert.equal((await ed.post("/marketing/envoi", { provider: "console" })).status, 403);
    const s = await newStudent(srv);
    assert.equal((await s.get("/marketing/envoi")).status, 403);
  });
  test("page : fournisseur par défaut « console » avec avertissement, adresse du webhook, état des prérequis", async () => {
    const r = await boss.get("/marketing/envoi");
    assert.match(r.text, /console/i);
    assert.match(r.text, /rien n(&#39;|')est réellement envoyé/i);
    assert.match(r.text, /https:\/\/k\.test\/webhooks\/email\/resend\/1/);
    assert.match(r.text, /ENCRYPTION_KEY/);
  });
  test("enregistrement : clé chiffrée, jamais réaffichée ; valeurs invalides refusées avec un message", async () => {
    const ok = await post(boss, "/marketing/envoi", { provider: "resend", from: "KOYEKOLA <no-reply@k.test>", reply_to: "aide@k.test", rate: "100", daily: "2000", api_key: "re_SECRET_1234", webhook_secret: "whsec_dGVzdC1zZWNyZXQ=" });
    assert.match(ok.text, /Réglages d(&#39;|')envoi enregistrés/);
    assert.doesNotMatch(ok.text, /re_SECRET_1234|whsec_dGVzdC1zZWNyZXQ/);
    assert.match(ok.text, /Clé enregistrée/);
    const raw = sql("SELECT value, is_secret FROM mk_settings WHERE key = 'email.api_key'")[0];
    assert.equal(raw.is_secret, 1);
    assert.ok(!raw.value.includes("SECRET_1234"));
    assert.match((await post(boss, "/marketing/envoi", { provider: "pigeon" })).text, /Fournisseur inconnu/);
    assert.match((await post(boss, "/marketing/envoi", { provider: "smtp", from: "nimporte" })).text, /Expéditeur invalide/);
    assert.match((await post(boss, "/marketing/envoi", { provider: "smtp", from: "a@k.test", rate: "0" })).text, /Débit/);
    // remettre la console pour la suite
    await post(boss, "/marketing/envoi", { provider: "console", clear_api_key: "on", clear_webhook_secret: "on" });
    assert.equal(sql("SELECT COUNT(*) n FROM mk_settings WHERE key = 'email.api_key'")[0].n, 0);
  });
  test("audit sans aucun secret", async () => {
    const rows = sql("SELECT action, metadata FROM mk_audit_logs WHERE action = 'sending.configured'");
    assert.ok(rows.length >= 2);
    assert.ok(!rows.some((r) => /SECRET|whsec/.test(r.metadata)));
  });
});

describe("campagnes : création et accès", () => {
  let tplId, listId;
  before(async () => { tplId = await seedTemplate(boss, "Modèle campagne"); listId = await seedAudience(srv, "camp", 3); });

  test("lecteur : consulte ; éditeur : crée des brouillons mais ne lance pas ; étudiant : rien", async () => {
    const v = await member("viewer");
    assert.equal((await v.get("/marketing/campagnes")).status, 200);
    assert.doesNotMatch((await v.get("/marketing/campagnes")).text, /Nouvelle campagne/);
    assert.equal((await v.get("/marketing/campagnes/nouvelle")).status, 403);
    const s = await newStudent(srv);
    assert.equal((await s.get("/marketing/campagnes")).status, 403);
  });
  test("création d'un brouillon depuis le formulaire", async () => {
    const form = await boss.get("/marketing/campagnes/nouvelle");
    assert.equal(form.status, 200);
    assert.match(form.text, /Modèle campagne/);
    assert.match(form.text, /value="list:\d+"/);
    const res = await boss.post("/marketing/campagnes", { name: "Ma campagne", template_id: String(tplId), target: `list:${listId}`, category: "", track_clicks: "on" });
    assert.equal(res.status, 302);
    assert.match(res.location, /^\/marketing\/campagnes\/\d+$/);
    const row = sql("SELECT status, track_clicks, track_opens, target_type FROM mk_campaigns WHERE name = 'Ma campagne'")[0];
    assert.deepEqual([row.status, row.track_clicks, row.track_opens, row.target_type], ["draft", 1, 0, "list"]);
  });
  test("erreurs claires : nom double, cible invalide, modèle inconnu", async () => {
    assert.match((await post(boss, "/marketing/campagnes", { name: "ma campagne", template_id: String(tplId), target: `list:${listId}` })).text, /porte déjà ce nom/);
    assert.match((await post(boss, "/marketing/campagnes", { name: "X1", template_id: String(tplId), target: "tous:1" })).text, /liste ou un segment/);
    assert.match((await post(boss, "/marketing/campagnes", { name: "X2", template_id: "9999", target: `list:${listId}` })).text, /Modèle introuvable/);
    assert.equal(campId("X1"), undefined);
  });
  test("nom hostile : échappé dans la page", async () => {
    await post(boss, "/marketing/campagnes", { name: "<img src=x onerror=alert(1)>", template_id: String(tplId), target: `list:${listId}` });
    const page = await boss.get("/marketing/campagnes");
    assert.doesNotMatch(page.text, /<img src=x onerror/);
    assert.match(page.text, /&lt;img src=x/);
  });
  test("brouillon : contrôle avant envoi affiché (audience, avertissements) et modifiable", async () => {
    const id = campId("Ma campagne");
    const page = await boss.get(`/marketing/campagnes/${id}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<ol class="mk-cl" aria-label="Préparation de la campagne">/); // liste de contrôle (à la Mailchimp)
    assert.match(page.text, /3 contacts? joignables?/);
    assert.match(page.text, /Fournisseur « console »/);
    assert.match(page.text, /MARKETING_WORKER/);
    const upd = await post(boss, `/marketing/campagnes/${id}`, { name: "Ma campagne renommée", template_id: String(tplId), target: `list:${listId}`, track_opens: "on", track_clicks: "on" });
    assert.match(upd.text, /Campagne mise à jour/);
    assert.equal(sql("SELECT track_opens FROM mk_campaigns WHERE id = ?", id)[0].track_opens, 1);
  });
  test("introuvable : 404 propre", async () => {
    assert.equal((await boss.get("/marketing/campagnes/999999")).status, 404);
    assert.equal((await boss.get("/marketing/campagnes/abc")).status, 404);
  });
});

describe("lancement : garde-fous", () => {
  let id;
  before(async () => { id = campId("Ma campagne renommée"); });

  test("l'éditeur ne peut pas lancer (droit d'administrateur)", async () => {
    const ed = await member("editor");
    assert.equal((await ed.post(`/marketing/campagnes/${id}/lancer`, { confirm_count: "3", confirm_ok: "on" })).status, 403);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "draft");
  });
  test("confirmation obligatoire : nombre exact de destinataires ET case cochée, sinon rien ne part", async () => {
    let r = await post(boss, `/marketing/campagnes/${id}/lancer`, { confirm_ok: "on" });
    assert.match(r.text, /nombre de destinataires/i);
    r = await post(boss, `/marketing/campagnes/${id}/lancer`, { confirm_count: "2", confirm_ok: "on" });
    assert.match(r.text, /nombre de destinataires/i);
    r = await post(boss, `/marketing/campagnes/${id}/lancer`, { confirm_count: "3" });
    assert.match(r.text, /cochez/i);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "draft");
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ?", id)[0].n, 0);
  });
  test("contrôle bloquant : liste sans contact joignable → refus avec la raison", async () => {
    const tpl = sql("SELECT id FROM mk_templates LIMIT 1")[0].id;
    run("INSERT OR IGNORE INTO mk_lists (organization_id, name) VALUES (1, 'Vide')");
    const empty = sql("SELECT id FROM mk_lists WHERE name = 'Vide'")[0].id;
    await post(boss, "/marketing/campagnes", { name: "Sans public", template_id: String(tpl), target: `list:${empty}` });
    const cid = campId("Sans public");
    const page = await boss.get(`/marketing/campagnes/${cid}`);
    assert.match(page.text, /Aucun contact joignable/);
    const r = await post(boss, `/marketing/campagnes/${cid}/lancer`, { confirm_count: "0", confirm_ok: "on" });
    assert.match(r.text, /Aucun contact joignable/);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", cid)[0].status, "draft");
  });
  test("lancement valide : campagne programmée, destinataires figés, travail en file, avertissement si le worker est éteint", async () => {
    const r = await post(boss, `/marketing/campagnes/${id}/lancer`, { confirm_count: "3", confirm_ok: "on" });
    assert.match(r.text, /Campagne lancée/);
    assert.match(r.text, /MARKETING_WORKER/);
    const row = sql("SELECT status, total_recipients FROM mk_campaigns WHERE id = ?", id)[0];
    assert.deepEqual([row.status, row.total_recipients], ["scheduled", 3]);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'campaign.dispatch'")[0].n, 1);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? AND status = 'queued'", id)[0].n, 3);
  });
  test("une campagne lancée n'est plus modifiable ni relançable ni supprimable", async () => {
    assert.match((await post(boss, `/marketing/campagnes/${id}`, { name: "Trop tard", template_id: "1", target: "list:1" })).text, /Seul un brouillon/);
    assert.match((await post(boss, `/marketing/campagnes/${id}/lancer`, { confirm_count: "3", confirm_ok: "on" })).text, /déjà été lancée/);
    assert.match((await post(boss, `/marketing/campagnes/${id}/supprimer`, {})).text, /ne se supprime pas/);
  });
  test("pause, reprise, annulation depuis l'interface", async () => {
    assert.match((await post(boss, `/marketing/campagnes/${id}/pause`, {})).text, /mise en pause/i);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "paused");
    assert.match((await post(boss, `/marketing/campagnes/${id}/reprendre`, {})).text, /reprise/i);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "scheduled");
    assert.match((await post(boss, `/marketing/campagnes/${id}/annuler`, {})).text, /annulée/i);
    const row = sql("SELECT status, skipped_count FROM mk_campaigns WHERE id = ?", id)[0];
    assert.deepEqual([row.status, row.skipped_count], ["cancelled", 3]);
  });
  test("programmation à une date : refusée dans le passé, acceptée dans le futur (UTC)", async () => {
    const tpl = sql("SELECT id FROM mk_templates LIMIT 1")[0].id;
    const listId = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    await post(boss, "/marketing/campagnes", { name: "Programmée", template_id: String(tpl), target: `list:${listId}` });
    const cid = campId("Programmée");
    const past = await post(boss, `/marketing/campagnes/${cid}/lancer`, { confirm_count: "3", confirm_ok: "on", send_at_utc: "2020-01-01T10:00:00.000Z" });
    assert.match(past.text, /dans le futur/);
    const future = new Date(Date.now() + 2 * 86400000).toISOString();
    const ok = await post(boss, `/marketing/campagnes/${cid}/lancer`, { confirm_count: "3", confirm_ok: "on", send_at_utc: future });
    assert.match(ok.text, /programmée/i);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", cid)[0].status, "scheduled");
    assert.match((await post(boss, `/marketing/campagnes/${cid}/annuler`, {})).text, /annulée/i);
  });
  test("statistiques : compteurs, taux, liens, limites du suivi annoncées", async () => {
    run("UPDATE mk_campaigns SET status = 'sent', sent_count = 100, delivered_count = 96, bounced_count = 4, unique_click_count = 20, click_count = 30, unique_open_count = 50, open_count = 70 WHERE id = ?", id);
    run("INSERT OR IGNORE INTO mk_links (organization_id, campaign_id, url, click_count, unique_click_count) VALUES (1, ?, 'https://ex.fr/a', 30, 20)", id);
    const page = await boss.get(`/marketing/campagnes/${id}`);
    assert.match(page.text, /Rapport de campagne/);
    assert.match(page.text, /20 %/);
    assert.match(page.text, /https:\/\/ex\.fr\/a/);
    assert.match(page.text, /Apple Mail/);
    assert.match(page.text, /Taux de rebond de 4 %/);
  });
});

describe("de bout en bout avec un vrai worker (fournisseur console)", () => {
  let e2e, client;
  before(async () => {
    e2e = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MARKETING_WORKER: "on" });
    client = await loginInstructor(e2e);
  });
  after(() => e2e.stop());

  test("lancer une campagne : le worker envoie tous les messages, suivi et désinscription compris", async () => {
    const listId = await seedAudience(e2e, "e2e", 3);
    const tplRes = await client.post("/marketing/modeles", { name: "E2E", starter: "newsletter", kind: "marketing" });
    const tplId = Number(tplRes.location.match(/(\d+)$/)[1]);
    await client.post("/marketing/campagnes", { name: "E2E", template_id: String(tplId), target: `list:${listId}`, track_clicks: "on", track_opens: "on" });
    const db0 = e2e.db(); const cid = db0.prepare("SELECT id FROM mk_campaigns WHERE name = 'E2E'").get().id; db0.close();
    const r = await client.post(`/marketing/campagnes/${cid}/lancer`, { confirm_count: "3", confirm_ok: "on" });
    assert.equal(r.status, 302);
    let row;
    for (let i = 0; i < 40; i++) {
      const db = e2e.db(); row = db.prepare("SELECT status, sent_count FROM mk_campaigns WHERE id = ?").get(cid); db.close();
      if (row.status === "sent") break;
      await new Promise((res) => setTimeout(res, 250));
    }
    assert.deepEqual([row.status, row.sent_count], ["sent", 3]);
    const db = e2e.db();
    const msgs = db.prepare("SELECT id, status, provider, provider_message_id, subject FROM mk_messages WHERE campaign_id = ?").all(cid);
    assert.equal(msgs.length, 3);
    assert.ok(msgs.every((m) => m.status === "sent" && m.provider === "console" && m.provider_message_id.startsWith("console-")));
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_links WHERE campaign_id = ?").get(cid).n >= 1);
    db.close();
    const page = await client.get(`/marketing/campagnes/${cid}`);
    assert.match(page.text, /Envoyée|terminée/i);
  });
});
