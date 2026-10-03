// Marketing — tests A/B, pages : entrée « Tests A/B » du menu, création, réglage dans le brouillon, lancement, choix du gagnant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss, tplId, tpl2Id, listId;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const flash = async (client, res) => (await client.get(res.location)).text;
const create = async (name) => {
  const res = await boss.post("/marketing/campagnes", { name, target: `list:${listId}`, template_id: String(tplId), category: "", track_clicks: "on", ab: "1" });
  return { res, id: Number(res.location.match(/campagnes\/(\d+)/)[1]) };
};
const abForm = (over = {}) => ({ subject_a: "Votre formation vous attend", template_a: "", subject_b: "-30 % jusqu'à dimanche", template_b: "", subject_c: "", template_c: "", percent: "20", metric: "clicks", wait: "240", ...over });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  const db = srv.db();
  db.exec("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Newsletter')");
  listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Newsletter'").get().id;
  for (let i = 0; i < 20; i++) {
    const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, status) VALUES (1, ?, ?, 'subscribed')").run(`ab${i}@ex.fr`, `P${i}`).lastInsertRowid);
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'Oui')").run(id);
    db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(listId, id);
  }
  db.prepare("INSERT INTO mk_settings (organization_id, key, value) VALUES (1, 'org.address', '12 rue des Écoles')").run();
  db.close();
  tplId = Number((await boss.post("/marketing/modeles", { name: "Modèle AB", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  tpl2Id = Number((await boss.post("/marketing/modeles", { name: "Modèle court", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
});
after(() => srv.stop());

describe("menu et page « Tests A/B »", () => {
  test("entrée visible dans le menu et dans « Créer » ; page vide qui explique le fonctionnement", async () => {
    const html = (await boss.get("/marketing/tests-ab")).text;
    assert.match(html, /<h1>Tests A\/B/);
    assert.match(html, /Aucun test A\/B/);
    assert.match(html, /href="\/marketing\/tests-ab"/, "entrée du menu");
    assert.match(html, /href="\/marketing\/campagnes\/nouvelle\?ab=1"/, "créer un test");
    assert.match(html, /Testez sur une partie de la cible/);
  });
  test("création : page « Créer un test A/B », puis le brouillon s'ouvre sur le réglage du test", async () => {
    const page = (await boss.get("/marketing/campagnes/nouvelle?ab=1")).text;
    assert.match(page, /<h1>Créer un test A\/B<\/h1>/);
    assert.match(page, /<input type="hidden" name="ab" value="1">/);
    const { res, id } = await create("Test objets");
    assert.equal(res.location, `/marketing/campagnes/${id}?ab=1#test-ab`);
    const html = await flash(boss, res);
    assert.match(html, /réglez maintenant les versions de votre test A\/B/);
    assert.match(html, /<details class="mk-cl-item" id="test-ab" open>/);
  });
});

describe("réglage dans le brouillon", () => {
  let id;
  before(async () => { id = (await create("Réglage")).id; });

  test("enregistrer deux versions : la campagne devient un test A/B, l'objet vient des versions", async () => {
    const res = await boss.post(`/marketing/campagnes/${id}/test-ab`, abForm({ template_b: String(tpl2Id) }));
    assert.equal(res.location, `/marketing/campagnes/${id}#test-ab`);
    const html = await flash(boss, res);
    assert.match(html, /Test A\/B enregistré/);
    assert.match(html, /Test A\/B \(2 versions\)/);
    assert.match(html, /Défini par le test A\/B : A « Votre formation vous attend » · B « -30 % jusqu(?:'|&#39;)à dimanche »/);
    assert.match(html, /<strong>20 %<\/strong> de la cible \(≈ 4 contacts\)/);
    assert.match(html, /<option value="\d+" selected>Modèle court<\/option>/, "modèle de la version B conservé");
    const list = (await boss.get("/marketing/campagnes")).text;
    assert.match(list, /Test A\/B · modifié le/);
    assert.match((await boss.get("/marketing/tests-ab")).text, /À préparer/);
  });
  test("erreur claire si deux versions sont identiques ; rien n'est changé", async () => {
    const res = await boss.post(`/marketing/campagnes/${id}/test-ab`, abForm({ subject_b: "Votre formation vous attend" }));
    assert.match(await flash(boss, res), /Deux versions sont identiques/);
    assert.match(sql("SELECT ab_variants FROM mk_campaigns WHERE id = ?", id)[0].ab_variants, /30 %/);
  });
  test("critère « ouvertures » sans suivi des ouvertures : envoi bloqué avec la raison sur la ligne du test", async () => {
    await boss.post(`/marketing/campagnes/${id}/test-ab`, abForm({ metric: "opens" }));
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /<li class="mk-cl-row is-error">\s*<details class="mk-cl-item" id="test-ab" open>/);
    assert.match(html, /activez le suivi des ouvertures/);
    assert.match(html, /data-mk-modal-open="envoyer" disabled>Envoyer/);
  });
  test("retirer le test : la campagne redevient un e-mail classique", async () => {
    const res = await boss.post(`/marketing/campagnes/${id}/test-ab`, { action: "retirer" });
    const html = await flash(boss, res);
    assert.match(html, /Test A\/B retiré/);
    assert.match(html, /E-mail classique · modifié le/);
    assert.equal(sql("SELECT ab_variants FROM mk_campaigns WHERE id = ?", id)[0].ab_variants, "");
  });
  test("droits : un lecteur ne peut ni régler un test ni choisir un gagnant ; un étudiant est refusé", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.post(`/marketing/campagnes/${id}/test-ab`, abForm())).status, 403);
    assert.equal((await viewer.post(`/marketing/campagnes/${id}/gagnant`, { variant: "0" })).status, 403);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/marketing/tests-ab")).status, 200);
  });
});

describe("lancement et gagnant", () => {
  let id;
  before(async () => {
    id = (await create("Lancement AB")).id;
    await boss.post(`/marketing/campagnes/${id}/test-ab`, abForm({ metric: "manual" }));
  });

  test("la fenêtre d'envoi annonce la taille du test ; le lancement tire le groupe de test et met le reste en attente", async () => {
    const draft = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(draft, /<strong>Test A\/B :<\/strong> environ 4 contacts tirés au hasard reçoivent les 2 versions/);
    const res = await boss.post(`/marketing/campagnes/${id}/lancer`, { confirm_count: "20", confirm_ok: "on" });
    assert.match(await flash(boss, res), /Test A\/B : 4 contacts reçoivent les versions, les 16 autres recevront la gagnante/);
    assert.deepEqual(sql("SELECT held, COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? GROUP BY held ORDER BY held", id).map((r) => [r.held, r.n]), [[0, 4], [1, 16]]);
    const report = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(report, /Envoi du test en cours/);
    assert.doesNotMatch(report, />Choisir A</, "pas de choix avant l'envoi du test");
  });
  test("test envoyé (mode manuel) : boutons « Choisir A/B » ; le choix libère le reste avec la version choisie", async () => {
    run("UPDATE mk_campaigns SET status = 'sending', ab_decide_at = ? WHERE id = ?", Date.now(), id);
    const report = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(report, /Choisissez la version gagnante : elle partira aussitôt aux 16 contacts restants/);
    assert.match(report, />Choisir A<\/button>/);
    assert.match(report, />Choisir B<\/button>/);
    const res = await boss.post(`/marketing/campagnes/${id}/gagnant`, { variant: "1" });
    assert.match(await flash(boss, res), /Version B choisie : elle part maintenant au reste de la cible \(16 contacts\)/);
    const c = sql("SELECT ab_winner, ab_decided_by FROM mk_campaigns WHERE id = ?", id)[0];
    assert.deepEqual([c.ab_winner, c.ab_decided_by], [1, "manual"]);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? AND held = 1", id)[0].n, 0);
    const after = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(after, /<strong>Version B gagnante<\/strong> \(choisie par l(?:'|&#39;)équipe\)/);
    assert.doesNotMatch(after, />Choisir A</);
    assert.match((await boss.get("/marketing/tests-ab")).text, /Version B gagnante/);
  });
  test("choisir une version inconnue : refus clair", async () => {
    const other = (await create("Inconnue")).id;
    const res = await boss.post(`/marketing/campagnes/${other}/gagnant`, { variant: "7" });
    assert.match(await flash(boss, res), /test A\/B|Version inconnue/);
  });
});
