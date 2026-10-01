// Marketing M1f (2/3, partie 2) — pages segments et assistant d'import CSV.
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
const upload = (client, url, csv, name = "contacts.csv") => {
  const fd = new FormData();
  fd.append("file", new Blob([csv], { type: "text/csv" }), name);
  return client.request(url, { method: "POST", multipart: fd });
};
const AND = (...rules) => JSON.stringify({ op: "and", rules });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY });
  boss = await loginInstructor(srv);
  for (const [email, country, status] of [["a@fr.test", "FR", "subscribed"], ["b@fr.test", "FR", "unknown"], ["c@tg.test", "TG", "subscribed"]]) {
    run("INSERT INTO mk_contacts (organization_id, email, country, status) VALUES (1, ?, ?, ?)", email, country, status);
    // Un contact « abonné » a toujours une preuve de consentement (sans elle, il n'est pas joignable)
    if (status === "subscribed") run("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, (SELECT id FROM mk_contacts WHERE email = ?), 'granted', 'form', 'J''accepte')", email);
  }
});
after(() => srv.stop());

describe("segments", () => {
  test("page vide : état vide et bouton de création", async () => {
    const r = await boss.get("/marketing/segments");
    assert.equal(r.status, 200);
    assert.match(r.text, /Aucun segment/);
    assert.match(r.text, /Nouveau segment/);
  });
  test("création : définition validée, enregistrée, effectif affiché sur la liste", async () => {
    const def = AND({ field: "country", cmp: "eq", value: "FR" });
    const page = await post(boss, "/marketing/segments", { name: "Français", description: "Tous les FR", definition: def });
    assert.equal(page.status, 200);
    assert.match(page.text, /Segment enregistré/);
    assert.equal(sql("SELECT name FROM mk_segments")[0].name, "Français");
    const list = await boss.get("/marketing/segments");
    assert.match(list.text, /Français/);
    assert.match(list.text, />\s*2\s*</, "effectif = 2 contacts");
  });
  test("définition invalide : message précis, rien n'est enregistré", async () => {
    const bad = await post(boss, "/marketing/segments", { name: "Cassé", definition: AND({ field: "mot_de_passe", cmp: "eq", value: "x" }) });
    assert.match(bad.text, /champ/i);
    const empty = await post(boss, "/marketing/segments", { name: "Vide", definition: JSON.stringify({ op: "and", rules: [] }) });
    assert.match(empty.text, /vide/i);
    const notJson = await post(boss, "/marketing/segments", { name: "Pas du JSON", definition: "{oups" });
    assert.match(notJson.text, /JSON|illisible/i);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_segments WHERE name IN ('Cassé', 'Vide', 'Pas du JSON')")[0].n, 0);
  });
  test("édition : la page contient le catalogue (JSON échappé) et le constructeur", async () => {
    const id = sql("SELECT id FROM mk_segments WHERE name = 'Français'")[0].id;
    const r = await boss.get(`/marketing/segments/${id}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /id="mk-catalog"/);
    assert.match(r.text, /marketing-segments\.js/);
    assert.match(r.text, /name="definition"/);
  });
  test("un libellé de propriété hostile ne casse pas la page (pas de </script> injecté)", async () => {
    await post(boss, "/marketing/proprietes", { key: "hostile", label: "</script><img src=x onerror=alert(1)>", type: "text" });
    const r = await boss.get("/marketing/segments/nouveau");
    assert.doesNotMatch(r.text, /<img src=x onerror/);
    const blob = r.text.match(/<script type="application\/json" id="mk-catalog">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(blob, "bloc catalogue");
    assert.ok(JSON.parse(blob).some((f) => f.field === "property:hostile"), "le JSON reste valide et complet");
  });
  test("aperçu (JSON) : total, échantillon borné, sans fuite d'autres colonnes", async () => {
    const r = await boss.postJson("/marketing/segments/apercu", { definition: JSON.parse(AND({ field: "country", cmp: "eq", value: "FR" })) });
    assert.equal(r.status, 200);
    const body = JSON.parse(r.text);
    assert.equal(body.total, 2);
    assert.equal(body.sendable, 1);
    assert.ok(body.rows.length <= 10);
    assert.deepEqual(Object.keys(body.rows[0]).sort(), ["email", "id", "name", "status"]);
    const bad = await boss.postJson("/marketing/segments/apercu", { definition: { op: "and", rules: [] } });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.text).error, /vide/i);
  });
  test("modification et suppression", async () => {
    const id = sql("SELECT id FROM mk_segments WHERE name = 'Français'")[0].id;
    const upd = await post(boss, `/marketing/segments/${id}`, { name: "Togolais", description: "", definition: AND({ field: "country", cmp: "eq", value: "TG" }) });
    assert.match(upd.text, /Segment enregistré/);
    assert.equal(sql("SELECT name FROM mk_segments WHERE id = ?", id)[0].name, "Togolais");
    await post(boss, `/marketing/segments/${id}/supprimer`, {});
    assert.equal(sql("SELECT COUNT(*) n FROM mk_segments WHERE id = ?", id).length && sql("SELECT COUNT(*) n FROM mk_segments WHERE id = ?", id)[0].n, 0);
  });
  test("permissions : le lecteur voit et prévisualise, ne crée ni ne supprime ; l'étudiant n'a rien", async () => {
    const v = await member("viewer");
    assert.equal((await v.get("/marketing/segments")).status, 200);
    assert.doesNotMatch((await v.get("/marketing/segments")).text, /Nouveau segment/);
    assert.equal((await v.post("/marketing/segments", { name: "Intrus", definition: AND({ field: "country", cmp: "eq", value: "FR" }) })).status, 403);
    assert.equal((await v.postJson("/marketing/segments/apercu", { definition: JSON.parse(AND({ field: "country", cmp: "eq", value: "FR" })) })).status, 200);
    const s = await newStudent(srv);
    assert.equal((await s.get("/marketing/segments")).status, 403);
    assert.equal((await s.postJson("/marketing/segments/apercu", { definition: {} })).status, 403);
  });
  test("le script du constructeur est servi", async () => {
    const r = await boss.get("/js/marketing-segments.js");
    assert.equal(r.status, 200);
    assert.match(r.text, /mk-catalog/);
  });
});

describe("assistant d'import", () => {
  const CSV = "E-mail,Prénom,Nom\nnouveau1@imp.test,Awa,Koffi\nnouveau2@imp.test,Jean,Martin\npas-un-email,X,Y\nNOUVEAU1@imp.test,Doublon,Z\n";
  let importId;

  test("page d'accueil de l'import : formulaire d'envoi et limites annoncées", async () => {
    const r = await boss.get("/marketing/importer");
    assert.equal(r.status, 200);
    assert.match(r.text, /type="file"/);
    assert.match(r.text, /CSV/);
    assert.match(r.text, /10 Mo/);
    assert.match(r.text, /Excel/i);
  });
  test("envoi du fichier : aperçu avec colonnes, échantillon et correspondance suggérée ; rien n'est importé", async () => {
    const res = await upload(boss, "/marketing/importer", CSV);
    assert.equal(res.status, 302);
    importId = Number(res.location.match(/\/importer\/(\d+)/)[1]);
    const page = await boss.get(res.location);
    assert.equal(page.status, 200);
    assert.match(page.text, /nouveau1@imp\.test/);
    assert.match(page.text, /<select[^>]*name="map_0"[\s\S]*?<option value="email" selected/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE '%@imp.test'")[0].n, 0);
  });
  test("fichier absent, vide ou illisible : message clair", async () => {
    const none = await boss.request("/marketing/importer", { method: "POST", multipart: new FormData() });
    assert.equal(none.status, 302);
    assert.match((await boss.get(none.location)).text, /fichier/i);
    const empty = await upload(boss, "/marketing/importer", "");
    assert.match((await boss.get(empty.location)).text, /fichier|en-têtes|vide/i);
  });
  test("analyse à blanc : rapport (créations, invalides, doublons) sans rien écrire", async () => {
    const r = await boss.post(`/marketing/importer/${importId}/analyser`, { map_0: "email", map_1: "first_name", map_2: "last_name", update_existing: "fill" });
    assert.equal(r.status, 200);
    assert.match(r.text, /2 contacts? à créer/i);
    assert.match(r.text, /1 ligne invalide|1 invalide/i);
    assert.match(r.text, /1 doublon/i);
    assert.match(r.text, /ligne 4/i);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE '%@imp.test'")[0].n, 0);
  });
  test("correspondance sans colonne e-mail : refusée avec explication", async () => {
    const r = await boss.post(`/marketing/importer/${importId}/analyser`, { map_0: "ignore", map_1: "first_name", map_2: "last_name" });
    assert.match(r.text, /e-mail/i);
    assert.equal(r.status, 400);
  });
  test("consentement déclaré sans preuve : refus, rien n'est lancé", async () => {
    const r = await post(boss, `/marketing/importer/${importId}/lancer`, { map_0: "email", map_1: "first_name", map_2: "last_name", consent_declared: "on", consent_text: "oui" });
    assert.match(r.text, /preuve|consentement/i);
    assert.equal(sql("SELECT status FROM mk_imports WHERE id = ?", importId)[0].status, "previewed");
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE '%@imp.test'")[0].n, 0);
  });
  test("exécution : contacts créés « sans consentement », rapport final, fichier de rejets téléchargeable", async () => {
    const r = await post(boss, `/marketing/importer/${importId}/lancer`, { map_0: "email", map_1: "first_name", map_2: "last_name", update_existing: "fill" });
    assert.equal(r.status, 200);
    assert.match(r.text, /Import terminé/);
    const rows = sql("SELECT email, status, source FROM mk_contacts WHERE email LIKE '%@imp.test' ORDER BY email");
    assert.deepEqual(rows.map((x) => [x.email, x.status, x.source]), [["nouveau1@imp.test", "unknown", "import"], ["nouveau2@imp.test", "unknown", "import"]]);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_consents WHERE contact_id IN (SELECT id FROM mk_contacts WHERE email LIKE '%@imp.test')")[0].n, 0);
    const csv = await boss.get(`/marketing/importer/${importId}/rejets.csv`);
    assert.equal(csv.status, 200);
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.headers.get("content-disposition"), /attachment/);
    assert.match(csv.text, /pas-un-email/);
  });
  test("relancer le même import : refusé", async () => {
    const r = await post(boss, `/marketing/importer/${importId}/lancer`, { map_0: "email", map_1: "first_name", map_2: "last_name" });
    assert.match(r.text, /terminé|déjà/i);
  });
  test("consentement déclaré valide : abonne les nouveaux contacts avec preuve", async () => {
    const res = await upload(boss, "/marketing/importer", "email\nabonne1@imp.test\n");
    const id = Number(res.location.match(/\/importer\/(\d+)/)[1]);
    await post(boss, `/marketing/importer/${id}/lancer`, { map_0: "email", consent_declared: "on", consent_text: "Inscrits au salon de mars 2027, formulaire papier signé" });
    assert.equal(sql("SELECT status FROM mk_contacts WHERE email = 'abonne1@imp.test'")[0].status, "subscribed");
    assert.match(sql("SELECT text_shown FROM mk_consents WHERE source = 'import'")[0].text_shown, /formulaire papier signé/);
  });
  test("gros fichier sans worker : refusé avec explication, import non démarré", async () => {
    const big = "email\n" + Array.from({ length: 5001 }, (_, i) => `gros${i}@imp.test`).join("\n");
    const res = await upload(boss, "/marketing/importer", big);
    const id = Number(res.location.match(/\/importer\/(\d+)/)[1]);
    const r = await post(boss, `/marketing/importer/${id}/lancer`, { map_0: "email" });
    assert.match(r.text, /MARKETING_WORKER/);
    assert.equal(sql("SELECT status FROM mk_imports WHERE id = ?", id)[0].status, "previewed");
  });
  test("permissions : le lecteur ne peut ni envoyer ni lancer ; un import est introuvable hors de son organisation", async () => {
    const v = await member("viewer");
    assert.equal((await v.get("/marketing/importer")).status, 403);
    assert.equal((await upload(v, "/marketing/importer", "email\nx@y.test\n")).status, 403);
    assert.equal((await boss.get("/marketing/importer/999999")).status, 404);
    assert.equal((await boss.get("/marketing/importer/abc")).status, 404);
  });
  test("nom de fichier hostile : affiché échappé", async () => {
    const res = await upload(boss, "/marketing/importer", "email\nz@imp.test\n", "<script>alert(1)</script>.csv");
    const page = await boss.get(res.location);
    assert.doesNotMatch(page.text, /<script>alert\(1\)<\/script>/);
  });
  test("le tableau de bord liste les imports récents", async () => {
    assert.match((await boss.get("/marketing")).text, /contacts\.csv/);
  });
});
