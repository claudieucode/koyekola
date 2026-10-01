// Marketing M2d — pages /marketing/modeles : liste, création, éditeur par blocs, enregistrement, aperçu, historique.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const templates = require("../src/marketing/templates");
const starters = require("../src/marketing/templates/starters");

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
const tplId = (name) => sql("SELECT id FROM mk_templates WHERE name = ?", name)[0]?.id;
const editorData = (html) => JSON.parse(html.match(/<script type="application\/json" id="mk-editor-data">([\s\S]*?)<\/script>/)[1]);

before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" }); boss = await loginInstructor(srv); });
after(() => srv.stop());

describe("modèles de départ", () => {
  test("chaque modèle de départ est valide pour le moteur et prêt à l'envoi", () => {
    const db = new (require("node:sqlite").DatabaseSync)(":memory:");
    db.close();
    const { freshMarketing } = require("./marketing-helpers");
    const m = freshMarketing();
    assert.ok(Object.keys(starters.STARTERS).length >= 3);
    for (const [key, s] of Object.entries(starters.STARTERS)) {
      assert.ok(s.label && s.description, key);
      const t = templates.createTemplate(m.A, { ...s.template, name: key });
      assert.equal(templates.templateReadiness(m.A, t.id).ready, true, key);
    }
  });
});

describe("accès", () => {
  test("anonyme : connexion ; étudiant : 403 ; lecteur : consulte sans modifier", async () => {
    const { Client } = require("./helpers");
    assert.match((await new Client(srv.base).get("/marketing/modeles")).location, /^\/connexion/);
    const s = await newStudent(srv);
    assert.equal((await s.get("/marketing/modeles")).status, 403);
    assert.equal((await s.postJson("/marketing/modeles/apercu", { template: {} })).status, 403);
    await post(boss, "/marketing/modeles", { name: "Pour lecteur", starter: "blank", kind: "marketing" });
    const v = await member("viewer");
    const list = await v.get("/marketing/modeles");
    assert.equal(list.status, 200);
    assert.match(list.text, /Pour lecteur/);
    assert.doesNotMatch(list.text, /Créer un modèle/);
    const editor = await v.get(`/marketing/modeles/${tplId("Pour lecteur")}`);
    assert.equal(editor.status, 200);
    assert.equal(editorData(editor.text).readOnly, true);
    assert.equal((await v.postJson(`/marketing/modeles/${tplId("Pour lecteur")}`, { template: { subject: "x" }, version: 1 })).status, 403);
    assert.equal((await v.post("/marketing/modeles", { name: "Intrus", starter: "blank" })).status, 403);
    assert.equal(tplId("Intrus"), undefined);
  });
  test("origine étrangère refusée pour l'enregistrement JSON (protection CSRF)", async () => {
    const id = tplId("Pour lecteur");
    const r = await boss.request(`/marketing/modeles/${id}`, { method: "POST", json: { template: { subject: "pirate" }, version: 1 }, headers: { origin: "https://evil.example" } });
    assert.equal(r.status, 403);
  });
});

describe("liste et création", () => {
  test("liste vide puis remplie ; choix du modèle de départ affiché", async () => {
    const r = await boss.get("/marketing/modeles");
    assert.equal(r.status, 200);
    assert.match(r.text, /Créer un modèle/);
    for (const key of Object.keys(starters.STARTERS)) assert.match(r.text, new RegExp(`value="${key}"`));
  });
  test("création depuis un modèle de départ : enregistré, ouvert dans l'éditeur", async () => {
    const res = await boss.post("/marketing/modeles", { name: "Ma newsletter", starter: "newsletter", kind: "marketing" });
    assert.equal(res.status, 302);
    assert.match(res.location, /^\/marketing\/modeles\/\d+$/);
    const page = await boss.get(res.location);
    assert.equal(page.status, 200);
    const data = editorData(page.text);
    assert.equal(data.template.name, "Ma newsletter");
    assert.ok(data.template.blocks.length >= 3);
    assert.equal(data.template.version, 1);
    assert.equal(data.readOnly, false);
  });
  test("nom en double, vide, modèle de départ inconnu : message clair", async () => {
    assert.match((await post(boss, "/marketing/modeles", { name: "ma newsletter", starter: "blank" })).text, /porte déjà ce nom/);
    assert.match((await post(boss, "/marketing/modeles", { name: "  ", starter: "blank" })).text, /obligatoire/);
    assert.match((await post(boss, "/marketing/modeles", { name: "Bizarre", starter: "inexistant" })).text, /départ|inconnu/i);
    assert.equal(tplId("Bizarre"), undefined);
  });
  test("modèle introuvable : 404 propre", async () => {
    assert.equal((await boss.get("/marketing/modeles/999999")).status, 404);
    assert.equal((await boss.get("/marketing/modeles/abc")).status, 404);
  });
});

describe("éditeur", () => {
  test("page : données JSON échappées (un nom hostile ne casse pas la balise), catalogue de variables, aperçu isolé (iframe sandbox), script servi", async () => {
    await post(boss, "/marketing/modeles", { name: "</script><img src=x onerror=alert(1)>", starter: "blank" });
    const id = tplId("</script><img src=x onerror=alert(1)>");
    const page = await boss.get(`/marketing/modeles/${id}`);
    assert.doesNotMatch(page.text, /<img src=x onerror/);
    const data = editorData(page.text);
    assert.equal(data.template.name, "</script><img src=x onerror=alert(1)>");
    assert.ok(data.variables.some((v) => v.path === "contact.first_name"));
    assert.match(page.text, /<iframe[^>]*sandbox=""/);
    assert.match(page.text, /marketing-editor\.js/);
    assert.equal((await boss.get("/js/marketing-editor.js")).status, 200);
  });
  test("enregistrement : version incrémentée, contenu normalisé, avertissements renvoyés", async () => {
    const id = tplId("Ma newsletter");
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const tpl = { ...data.template, subject: "Objet modifié", blocks: [...data.template.blocks, { type: "divider", style: "x" }] };
    const r = await boss.postJson(`/marketing/modeles/${id}`, { template: tpl, version: 1 });
    assert.equal(r.status, 200);
    const body = JSON.parse(r.text);
    assert.deepEqual([body.ok, body.version], [true, 2]);
    assert.ok(Array.isArray(body.warnings));
    const saved = sql("SELECT subject, version, blocks FROM mk_templates WHERE id = ?", id)[0];
    assert.deepEqual([saved.subject, saved.version], ["Objet modifié", 2]);
    assert.ok(!saved.blocks.includes('"style"'), "champ inconnu supprimé");
  });
  test("conflit : enregistrer depuis une version périmée renvoie 409 sans rien écraser", async () => {
    const id = tplId("Ma newsletter");
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const r = await boss.postJson(`/marketing/modeles/${id}`, { template: { ...data.template, subject: "Périmé" }, version: 1 });
    assert.equal(r.status, 409);
    assert.match(JSON.parse(r.text).error, /modifié/);
    assert.equal(sql("SELECT subject FROM mk_templates WHERE id = ?", id)[0].subject, "Objet modifié");
  });
  test("modèle invalide : 400 avec le message du moteur (numéro de bloc), rien d'enregistré", async () => {
    const id = tplId("Ma newsletter");
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const r = await boss.postJson(`/marketing/modeles/${id}`, { template: { ...data.template, blocks: [{ type: "text", markdown: "ok" }, { type: "text", markdown: "{{secret.cle}}" }] }, version: 2 });
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /Bloc 2.*secret\.cle/s);
    assert.equal(sql("SELECT version FROM mk_templates WHERE id = ?", id)[0].version, 2);
    const noVersion = await boss.postJson(`/marketing/modeles/${id}`, { template: data.template });
    assert.equal(noVersion.status, 400);
  });
  test("renommer vers un nom pris : refusé", async () => {
    const id = tplId("Ma newsletter");
    const data = editorData((await boss.get(`/marketing/modeles/${id}`)).text);
    const r = await boss.postJson(`/marketing/modeles/${id}`, { template: { ...data.template, name: "Pour lecteur" }, version: 2 });
    assert.equal(r.status, 400);
    assert.match(JSON.parse(r.text).error, /porte déjà/);
  });
  test("aperçu d'un brouillon : HTML, objet, texte, avertissements ; hostile : jamais actif ; erreur : 400", async () => {
    const r = await boss.postJson("/marketing/modeles/apercu", { template: { kind: "marketing", subject: "Salut {{contact.first_name}}", preheader: "", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}}" }] } });
    assert.equal(r.status, 200);
    const body = JSON.parse(r.text);
    assert.equal(body.subject, "Salut Awa");
    assert.match(body.html, /Bonjour Awa/);
    assert.match(body.text, /Bonjour Awa/);
    assert.ok(body.warnings.some((w) => w.code === "preheader_missing"));
    const bad = await boss.postJson("/marketing/modeles/apercu", { template: { blocks: [{ type: "script" }] } });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.text).error, /type/i);
  });
  test("aperçu avec un vrai contact : données du contact, liens de désinscription factices (jamais un vrai jeton)", async () => {
    run("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (1, 'apercu@ex.fr', '<b>Zoé</b>')");
    const id = sql("SELECT id FROM mk_contacts WHERE email = 'apercu@ex.fr'")[0].id;
    const r = await boss.postJson("/marketing/modeles/apercu", { contactId: id, template: { subject: "S", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name}}" }] } });
    const body = JSON.parse(r.text);
    assert.match(body.html, /Bonjour &lt;b&gt;Zoé&lt;\/b&gt;/);
    assert.match(body.html, /exemple\.invalid/);
    const other = await boss.postJson("/marketing/modeles/apercu", { contactId: 999999, template: { blocks: [] } });
    assert.equal(other.status, 400);
  });
  test("le lecteur peut prévisualiser mais pas enregistrer", async () => {
    const v = await member("viewer");
    const r = await v.postJson("/marketing/modeles/apercu", { template: { subject: "x", blocks: [{ type: "divider" }] } });
    assert.equal(r.status, 200);
  });
});

describe("historique, duplication, suppression, adresse", () => {
  test("versions listées et restauration : nouvelle version créée", async () => {
    const id = tplId("Ma newsletter");
    const page = await boss.get(`/marketing/modeles/${id}`);
    assert.deepEqual(editorData(page.text).versions.map((v) => v.version), [1]);
    const res = await boss.post(`/marketing/modeles/${id}/restaurer`, { version: "1" });
    assert.equal(res.status, 302);
    const row = sql("SELECT version, subject FROM mk_templates WHERE id = ?", id)[0];
    assert.equal(row.version, 3);
    assert.notEqual(row.subject, "Objet modifié");
    assert.match((await boss.get(res.location)).text, /Version restaurée/);
    assert.match((await post(boss, `/marketing/modeles/${id}/restaurer`, { version: "99" })).text, /n(&#39;|')existe plus/);
  });
  test("duplication et suppression", async () => {
    const id = tplId("Ma newsletter");
    const dup = await post(boss, `/marketing/modeles/${id}/dupliquer`, {});
    assert.match(dup.text, /Copie de Ma newsletter/);
    const copyId = tplId("Copie de Ma newsletter");
    const del = await post(boss, `/marketing/modeles/${copyId}/supprimer`, {});
    assert.match(del.text, /supprimé/i);
    assert.equal(tplId("Copie de Ma newsletter"), undefined);
    assert.ok(tplId("Ma newsletter"));
  });
  test("adresse du pied de page : enregistrée (administrateur), visible dans l'aperçu", async () => {
    const r = await post(boss, "/marketing/modeles/adresse", { address: "12 rue des Écoles\n75005 Paris" });
    assert.match(r.text, /Adresse enregistrée/);
    const p = await boss.postJson("/marketing/modeles/apercu", { template: { subject: "S", blocks: [{ type: "divider" }] } });
    assert.match(JSON.parse(p.text).html, /12 rue des Écoles/);
    assert.ok(!JSON.parse(p.text).warnings.some((w) => w.code === "address_missing"));
    const editor = await member("editor");
    assert.equal((await editor.post("/marketing/modeles/adresse", { address: "x" })).status, 403);
  });
  test("journal d'audit : actions enregistrées, sans le contenu des modèles", async () => {
    const rows = sql("SELECT action, metadata FROM mk_audit_logs WHERE resource_type = 'template'");
    for (const a of ["template.created", "template.updated", "template.restored", "template.deleted"]) assert.ok(rows.some((r) => r.action === a), a);
    assert.ok(!rows.some((r) => /Objet modifié|Bonjour/.test(r.metadata)));
  });
  test("le menu marketing contient l'entrée « Modèles »", async () => {
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/modeles"/);
  });
});

describe("e-mail de test", () => {
  test("la page propose l'envoi aux membres de l'équipe uniquement", async () => {
    const id = tplId("Ma newsletter");
    const page = await boss.get(`/marketing/modeles/${id}`);
    assert.match(page.text, new RegExp(`action="/marketing/modeles/${id}/test"`));
    assert.match(page.text, /<option value="prof@test\.local" selected>/);
  });
  test("messagerie non configurée : message clair, aucune erreur", async () => {
    const id = tplId("Ma newsletter");
    const r = await post(boss, `/marketing/modeles/${id}/test`, { to: "prof@test.local" });
    assert.equal(r.status, 200);
    assert.match(r.text, /Messagerie non configurée/);
  });
  test("adresse hors équipe : refusée", async () => {
    const id = tplId("Ma newsletter");
    const r = await post(boss, `/marketing/modeles/${id}/test`, { to: "victime@exemple.fr" });
    assert.match(r.text, /membre de l(&#39;|')équipe/);
  });
  test("le lecteur ne peut pas envoyer de test ; l'étudiant non plus", async () => {
    const id = tplId("Ma newsletter");
    const v = await member("viewer");
    assert.equal((await v.post(`/marketing/modeles/${id}/test`, { to: v.email })).status, 403);
    const s = await newStudent(srv);
    assert.equal((await s.post(`/marketing/modeles/${id}/test`, { to: s.email })).status, 403);
  });
  test("limitation : au plus 10 tentatives par heure et par utilisateur", async () => {
    const editor = await member("editor");
    const id = tplId("Ma newsletter");
    let last;
    for (let i = 0; i < 11; i++) last = await post(editor, `/marketing/modeles/${id}/test`, { to: editor.email });
    assert.match(last.text, /Trop d(&#39;|')envois de test/);
  });
});
