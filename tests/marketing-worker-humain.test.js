// Refonte §17 — message « traitement automatique indisponible » humanisé PARTOUT (MARKETING_WORKER ≠ on) :
// la phrase lisible par un non-technicien vient d'abord ; le nom de la variable d'environnement n'apparaît
// que dans un détail technique replié (<details>), jamais dans le message principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss, tplId, listId, campId, autoId;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const follow = async (client, res) => (res.location ? client.get(res.location) : res);
const post = async (client, url, form) => follow(client, await client.post(url, form));
const upload = (client, url, csv, name = "contacts.csv") => {
  const fd = new FormData();
  fd.append("file", new Blob([csv], { type: "text/csv" }), name);
  return client.request(url, { method: "POST", multipart: fd });
};

// Retire les détails repliés : ce qui reste est ce que l'utilisateur lit d'emblée
const visible = (html) => html.replace(/<details[\s\S]*?<\/details>/g, "");
const HUMAN = /traitement automatique est temporairement indisponible/i;
function assertHumanized(html, where) {
  assert.match(html, HUMAN, `${where} : message humain présent`);
  assert.doesNotMatch(visible(html), /MARKETING_WORKER/, `${where} : la variable n'apparaît pas hors du détail replié`);
  assert.match(html, /<details class="mk-flash-details"><summary>Détails techniques<\/summary>[\s\S]*?MARKETING_WORKER/, `${where} : détail technique disponible, replié`);
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  run("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Humain')");
  listId = sql("SELECT id FROM mk_lists WHERE name = 'Humain'")[0].id;
  for (let i = 0; i < 2; i++) {
    run("INSERT INTO mk_contacts (organization_id, email, status) VALUES (1, ?, 'subscribed')", `h${i}@ex.fr`);
    run("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, (SELECT id FROM mk_contacts WHERE email = ?), 'granted', 'form', 'Oui')", `h${i}@ex.fr`);
    run("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, (SELECT id FROM mk_contacts WHERE email = ?))", listId, `h${i}@ex.fr`);
  }
  run("INSERT INTO mk_settings (organization_id, key, value) VALUES (1, 'org.address', '1 rue Test')");
  tplId = Number((await boss.post("/marketing/modeles", { name: "Modèle H", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  run("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, status) VALUES (1, 'Camp H', ?, 'list', ?, 'draft')", tplId, listId);
  campId = sql("SELECT id FROM mk_campaigns WHERE name = 'Camp H'")[0].id;
  const res = await boss.post("/marketing/automatisations", { name: "Auto H", kind: "transactional", trigger_event: "lms.user_registered" });
  autoId = Number(res.location.match(/(\d+)/)[1]);
});
after(() => srv.stop());

describe("message humanisé quand le traitement en arrière-plan est éteint", () => {
  test("contrôle avant envoi d'une campagne", async () => {
    assertHumanized((await boss.get(`/marketing/campagnes/${campId}`)).text, "campagne");
  });
  test("vérifications d'un scénario", async () => {
    assertHumanized((await boss.get(`/marketing/automatisations/${autoId}`)).text, "scénario");
  });
  test("réglages d'envoi et page Événements", async () => {
    assertHumanized((await boss.get("/marketing/envoi")).text, "réglages d'envoi");
    assertHumanized((await boss.get("/marketing/evenements")).text, "événements");
  });
  test("liste de préparation de l'accueil", async () => {
    assertHumanized((await boss.get("/marketing")).text, "accueil");
  });
  test("message après lancement d'une campagne", async () => {
    const r = await post(boss, `/marketing/campagnes/${campId}/lancer`, { confirm_count: "2", confirm_ok: "on" });
    assert.match(r.text, /Campagne lancée/);
    assertHumanized(r.text, "lancement");
  });
  test("refus d'un gros import", async () => {
    const big = "email\n" + Array.from({ length: 5001 }, (_, i) => `gh${i}@imp.test`).join("\n");
    const res = await upload(boss, "/marketing/importer", big);
    const id = Number(res.location.match(/\/importer\/(\d+)/)[1]);
    const r = await post(boss, `/marketing/importer/${id}/lancer`, { map_0: "email" });
    assertHumanized(r.text, "import");
    assert.equal(sql("SELECT status FROM mk_imports WHERE id = ?", id)[0].status, "previewed");
  });
});
