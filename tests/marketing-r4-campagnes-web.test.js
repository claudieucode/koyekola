// Marketing R4 (2/2) — pages campagnes : liste par onglets, création guidée en 7 étapes, brouillon, test, duplication, blocage.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss, tplId, listId;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const campId = (name) => sql("SELECT id FROM mk_campaigns WHERE name = ?", name)[0]?.id;
const flash = async (client, res) => (await client.get(res.location)).text;
const rowNames = (html) => [...html.matchAll(/<a href="\/marketing\/campagnes\/\d+">([^<]+)<\/a>/g)].map((m) => m[1]);
const insert = (name, status, extra = {}) => run(
  "INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, status, sent_count, unique_click_count, total_recipients) VALUES (1, ?, ?, 'list', ?, ?, ?, ?, ?)",
  name, tplId, listId, status, extra.sent ?? 0, extra.clicks ?? 0, extra.recipients ?? 0);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  const db = srv.db();
  db.exec("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Newsletter')");
  listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Newsletter'").get().id;
  for (let i = 0; i < 3; i++) {
    const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, status) VALUES (1, ?, ?, 'subscribed')").run(`w${i}@ex.fr`, `P${i}`).lastInsertRowid);
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'Oui')").run(id);
    db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, ?, ?)").run(listId, id);
  }
  db.prepare("INSERT INTO mk_settings (organization_id, key, value) VALUES (1, 'org.address', '12 rue des Écoles')").run();
  db.close();
  tplId = Number((await boss.post("/marketing/modeles", { name: "Modèle R4", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
});
after(() => srv.stop());

describe("liste : état vide, onglets, effectifs", () => {
  test("aucune campagne : état vide avec l'action de création", async () => {
    const html = (await boss.get("/marketing/campagnes")).text;
    assert.match(html, /class="mk-empty"/);
    assert.match(html, /Aucune campagne/);
    assert.match(html, /href="\/marketing\/campagnes\/nouvelle"/);
  });
  test("onglets par statut avec effectifs, onglet courant marqué", async () => {
    insert("Brouillon A", "draft"); insert("Brouillon B", "draft"); insert("Prog", "scheduled");
    insert("Cours", "sending"); insert("Pause", "paused"); insert("Fin 1", "sent", { sent: 200, clicks: 50, recipients: 210 }); insert("Fin 2", "sent", { sent: 10, clicks: 1, recipients: 10 });
    insert("Annulée", "cancelled"); insert("Ratée", "failed");
    const html = (await boss.get("/marketing/campagnes")).text;
    assert.match(html, /<nav class="mk-tabs" aria-label="Filtrer par statut">/);
    for (const [label, n] of [["Toutes", 9], ["Brouillons", 2], ["Programmées", 1], ["En cours", 2], ["Envoyées", 2], ["Interrompues", 2]]) {
      assert.match(html, new RegExp(`<a class="mk-tab"[^>]*>${label} <span class="mk-tab-count">${n}</span></a>`), label);
    }
    assert.match(html, /<a class="mk-tab" href="\/marketing\/campagnes" aria-current="page">Toutes/);
  });
  test("chaque onglet filtre la liste", async () => {
    const of = async (s) => rowNames((await boss.get(`/marketing/campagnes?statut=${s}`)).text).sort();
    assert.deepEqual(await of("draft"), ["Brouillon A", "Brouillon B"]);
    assert.deepEqual(await of("running"), ["Cours", "Pause"]);
    assert.deepEqual(await of("sent"), ["Fin 1", "Fin 2"]);
    assert.deepEqual(await of("stopped"), ["Annulée", "Ratée"]);
    assert.match((await boss.get("/marketing/campagnes?statut=sent")).text, /<a class="mk-tab" href="[^"]*statut=sent[^"]*" aria-current="page">Envoyées/);
  });
  test("onglet inconnu ou injection : toutes les campagnes, sans erreur", async () => {
    for (const s of ["zzz", "sent'; DROP TABLE mk_campaigns;--", ""]) {
      const r = await boss.get(`/marketing/campagnes?statut=${encodeURIComponent(s)}`);
      assert.equal(r.status, 200);
      assert.equal(rowNames(r.text).length, 9);
    }
    assert.ok(sql("SELECT COUNT(*) n FROM mk_campaigns")[0].n >= 9);
  });
});

describe("liste : tableau, recherche, tri, pagination", () => {
  test("colonnes à la Mailchimp : statut en pastille, destinataires, ouvertures, clics ; bouton Modifier / Voir le rapport", async () => {
    const html = (await boss.get("/marketing/campagnes")).text;
    assert.match(html, /<table class="mk-table mk-datatable">/);
    for (const h of ["Campagne", "Statut", "Destinataires", "Ouvertures", "Clics", "Créée le"]) assert.match(html, new RegExp(`<th[^>]*>(?:<a [^>]+>)?${h}`), h);
    assert.match(html, /E-mail classique · /);
    assert.match(html, /<a class="btn btn-outline btn-sm" href="\/marketing\/campagnes\/\d+">Modifier<\/a>/, "brouillon : Modifier");
    assert.match(html, /<a class="btn btn-outline btn-sm" href="\/marketing\/campagnes\/\d+">Voir le rapport<\/a>/, "envoyée : rapport");
    assert.match(html, /non suivies/, "ouvertures non suivies : jamais un faux 0 %");
    assert.match(html, /<span class="mk-status mk-status-ok">Envoyée<\/span>/);
    assert.match(html, /25 %/);
    assert.match(html, /Modèle R4/);
    assert.match(html, /Liste « Newsletter »/);
  });
  test("recherche par nom : filtre, échappement, nombre de résultats annoncé", async () => {
    const html = (await boss.get("/marketing/campagnes?q=brouillon")).text;
    assert.deepEqual(rowNames(html).sort(), ["Brouillon A", "Brouillon B"]);
    assert.match(html, /<p class="mk-filter-count" role="status">2 campagnes/);
    assert.match(html, /<label class="sr-only" for="f-q">/);
    assert.match(html, /<input id="f-q" type="search" name="q" value="brouillon"/);
  });
  test("la recherche se combine avec l'onglet et est conservée dans les liens des onglets", async () => {
    const html = (await boss.get("/marketing/campagnes?statut=draft&q=A")).text;
    assert.deepEqual(rowNames(html), ["Brouillon A"]);
    assert.match(html, /<a class="mk-tab" href="[^"]*q=A[^"]*">Toutes/);
  });
  test("tri par nom (sens indiqué dans l'en-tête), tri inconnu ignoré", async () => {
    const asc = (await boss.get("/marketing/campagnes?tri=name&sens=asc")).text;
    assert.equal(rowNames(asc)[0], "Annulée");
    assert.match(asc, /<th scope="col" aria-sort="ascending"><a href="[^"]*tri=name&amp;sens=desc[^"]*">Campagne<\/a><\/th>/);
    for (const tri of ["zzz", "id;DROP TABLE x", "name desc,1"]) assert.equal((await boss.get(`/marketing/campagnes?tri=${encodeURIComponent(tri)}`)).status, 200);
    assert.match((await boss.get("/marketing/campagnes")).text, /aria-sort="descending"><a [^>]*>Créée le/);
  });
  test("pagination : taille 10, page suivante, hors bornes ramené, pager accessible", async () => {
    for (let i = 0; i < 12; i++) insert(`Pagine ${String(i).padStart(2, "0")}`, "draft");
    const p1 = (await boss.get("/marketing/campagnes?q=pagine&taille=10")).text;
    assert.equal(rowNames(p1).length, 10);
    assert.match(p1, /1–10 sur 12/);
    assert.match(p1, /<nav class="mk-pager-links" aria-label="Pagination">/);
    assert.match(p1, /rel="next"[^>]*>Suivant<\/a>/);
    assert.equal(rowNames((await boss.get("/marketing/campagnes?q=pagine&taille=10&page=2")).text).length, 2);
    assert.match((await boss.get("/marketing/campagnes?q=pagine&taille=10&page=99")).text, /11–12 sur 12/);
    assert.equal((await boss.get("/marketing/campagnes?page=abc&taille=zz")).status, 200);
    run("DELETE FROM mk_campaigns WHERE name LIKE 'Pagine %'");
  });
  test("aucun résultat de recherche : message et lien pour réinitialiser", async () => {
    const html = (await boss.get("/marketing/campagnes?q=introuvable-xyz")).text;
    assert.match(html, /Aucune campagne ne correspond/);
    assert.match(html, /<a [^>]*href="\/marketing\/campagnes"[^>]*>Réinitialiser/);
  });
  test("noms hostiles échappés", async () => {
    insert("<img src=x onerror=alert(1)>", "draft");
    const html = (await boss.get("/marketing/campagnes")).text;
    assert.doesNotMatch(html, /<img src=x onerror/);
    assert.match(html, /&lt;img src=x/);
    run("DELETE FROM mk_campaigns WHERE name LIKE '<img%'");
  });
  test("avertissements conservés : fournisseur « console » et traitement en arrière-plan", async () => {
    const html = (await boss.get("/marketing/campagnes")).text;
    assert.match(html, /Fournisseur « console »/);
    assert.match(html, /MARKETING_WORKER/);
  });
});

describe("liste : droits et duplication", () => {
  test("lecteur : consultation sans bouton de création ni de duplication ; éditeur : peut dupliquer", async () => {
    const v = await member("viewer");
    const vh = (await v.get("/marketing/campagnes")).text;
    assert.doesNotMatch(vh, /dupliquer|campagnes\/nouvelle/);
    const e = await member("editor");
    assert.match((await e.get("/marketing/campagnes")).text, /\/dupliquer/);
  });
  test("dupliquer : copie en brouillon, ouverture de la copie, message clair", async () => {
    const id = campId("Fin 1");
    const res = await boss.post(`/marketing/campagnes/${id}/dupliquer`, {});
    assert.match(res.location, /^\/marketing\/campagnes\/\d+$/);
    assert.match(await flash(boss, res), /Campagne dupliquée/);
    const copy = sql("SELECT status, sent_count, template_id FROM mk_campaigns WHERE name = 'Copie de Fin 1'")[0];
    assert.deepEqual([copy.status, copy.sent_count, copy.template_id], ["draft", 0, tplId]);
    await boss.post(`/marketing/campagnes/${id}/dupliquer`, {});
    assert.ok(campId("Copie de Fin 1 (2)"));
  });
  test("lecteur et étudiant refusés, identifiant inconnu = 404, rien créé", async () => {
    const id = campId("Fin 1");
    const n = sql("SELECT COUNT(*) n FROM mk_campaigns")[0].n;
    assert.equal((await (await member("viewer")).post(`/marketing/campagnes/${id}/dupliquer`, {})).status, 403);
    assert.equal((await (await newStudent(srv)).post(`/marketing/campagnes/${id}/dupliquer`, {})).status, 403);
    assert.equal((await boss.post("/marketing/campagnes/999999/dupliquer", {})).status, 404);
    assert.equal((await boss.post("/marketing/campagnes/abc/dupliquer", {})).status, 404);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaigns")[0].n, n);
  });
});

describe("création : page « Créer un e-mail » (à la Mailchimp)", () => {
  test("une seule carte : nom, destinataires, modèle ; suivi des clics activé par défaut", async () => {
    const html = (await boss.get("/marketing/campagnes/nouvelle")).text;
    assert.match(html, /<h1>Créer un e-mail<\/h1>/);
    assert.match(html, /<form action="\/marketing\/campagnes" method="post"/);
    for (const name of ["name", "target", "template_id", "category"]) assert.match(html, new RegExp(`name="${name}"`), name);
    assert.match(html, /<input type="hidden" name="track_clicks" value="on">/);
    assert.match(html, new RegExp(`value="list:${listId}"`));
    assert.match(html, /Modèle R4/);
    assert.doesNotMatch(html, /mk-stepper|mk-wizard/, "plus d'assistant en sept étapes");
  });
  test("la suite (liste de contrôle avant l'envoi) est expliquée ; rien ne part à cette étape", async () => {
    const html = (await boss.get("/marketing/campagnes/nouvelle")).text;
    assert.match(html, /liste de contrôle/);
    assert.match(html, /Rien ne part à cette étape/);
  });
  test("sans modèle marketing : message explicite avec lien vers les modèles", async () => {
    const fs = require("node:fs"), path = require("node:path");
    assert.match(fs.readFileSync(path.join(__dirname, "..", "views", "marketing", "campaign-new.ejs"), "utf8"), /Aucun modèle marketing/);
  });
  test("création : vers la liste de contrôle du brouillon, message clair", async () => {
    const res = await boss.post("/marketing/campagnes", { name: "Carte unique", template_id: String(tplId), target: `list:${listId}`, category: "", track_clicks: "on" });
    assert.match(res.location, /^\/marketing\/campagnes\/\d+$/);
    assert.match(await flash(boss, res), /complétez la liste de contrôle/);
    run("DELETE FROM mk_campaigns WHERE name = 'Carte unique'");
  });
  test("erreur à la création : les champs saisis sont conservés", async () => {
    const res = await boss.post("/marketing/campagnes", { name: "Test conservé", template_id: String(tplId), target: "tous:1", category: "", track_clicks: "on" });
    assert.equal(res.location, "/marketing/campagnes/nouvelle");
    const html = await flash(boss, res);
    assert.match(html, /liste ou un segment/);
    assert.match(html, /name="name"[^>]*value="Test conservé"/);
    const again = (await boss.get("/marketing/campagnes/nouvelle")).text;
    assert.doesNotMatch(again, /value="Test conservé"/, "le brouillon de saisie n'est affiché qu'une fois");
  });
  test("lecteur refusé", async () => {
    assert.equal((await (await member("viewer")).get("/marketing/campagnes/nouvelle")).status, 403);
  });
});

describe("création guidée : effectif de l'étape « Destinataires »", () => {
  const preview = (client, body) => client.postJson("/marketing/campagnes/apercu-cible", body);
  test("joignables, total de la cible, exclusions", async () => {
    const r = await preview(boss, { target: `list:${listId}`, category: "" });
    const j = JSON.parse(r.text);
    assert.equal(r.status, 200);
    assert.deepEqual([j.sendable, j.targetTotal], [3, 3]);
    assert.ok(j.excluded && typeof j.excluded.total === "number");
  });
  test("segment et catégorie acceptés ; cible inconnue ou invalide : 400 clair", async () => {
    run("INSERT INTO mk_segments (organization_id, name, definition) VALUES (1, 'Tous', ?)", JSON.stringify({ op: "and", rules: [{ field: "email", cmp: "contains", value: "@" }] }));
    const seg = sql("SELECT id FROM mk_segments WHERE name = 'Tous'")[0].id;
    assert.equal(JSON.parse((await preview(boss, { target: `segment:${seg}` })).text).sendable, 3);
    for (const body of [{ target: "list:999999" }, { target: "n'importe quoi" }, { target: `list:${listId}`, category: "inconnue" }, {}]) {
      const r = await preview(boss, body);
      assert.equal(r.status, 400, JSON.stringify(body));
      assert.ok(JSON.parse(r.text).error);
    }
  });
  test("réservé aux membres qui peuvent créer des campagnes", async () => {
    assert.equal((await preview(await member("viewer"), { target: `list:${listId}` })).status, 403);
    assert.equal((await preview(await newStudent(srv), { target: `list:${listId}` })).status, 403);
    assert.equal((await preview(await member("editor"), { target: `list:${listId}` })).status, 200);
  });
});

describe("brouillon : liste de contrôle (à la Mailchimp)", () => {
  let id;
  before(async () => {
    const res = await boss.post("/marketing/campagnes", { name: "Guidée", template_id: String(tplId), target: `list:${listId}`, category: "", track_clicks: "on" });
    id = Number(res.location.match(/(\d+)$/)[1]);
  });
  test("sept éléments : destinataires, expéditeur, objet, contenu, test A/B (facultatif), paramètres et suivi, heure d'envoi", async () => {
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /<ol class="mk-cl" aria-label="Préparation de la campagne">/);
    assert.equal((html.match(/<li class="mk-cl-row/g) || []).length, 7);
    for (const t of ["Destinataires", "Expéditeur", "Objet", "Contenu", "Test A/B", "Paramètres et suivi", "Heure d(?:'|&#39;)envoi"]) assert.match(html, new RegExp(`<span class="mk-cl-title">${t}`), t);
    assert.match(html, /<li class="mk-cl-row is-done">\s*<details class="mk-cl-item" id="destinataires"/);
    assert.match(html, /3 contacts joignables<\/strong> sur 3/);
    assert.match(html, /Modèle « Modèle R4 »/);
    assert.match(html, /<iframe src="\/marketing\/modeles\/\d+\/apercu"/, "vignette du contenu");
  });
  test("en-tête : Terminer plus tard, Envoyer un test, Envoyer ; autres actions dans un menu", async () => {
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, />Terminer plus tard<\/a>/);
    assert.match(html, /data-mk-modal-open="test">Envoyer un test<\/button>/);
    assert.match(html, /data-mk-modal-open="envoyer">Envoyer<\/button>/);
    assert.match(html, /role="menuitem" data-mk-modal-open="renommer">Renommer/);
  });
  test("modifier une ligne ne change que son réglage (les autres repartent tels quels)", async () => {
    const r = await boss.post(`/marketing/campagnes/${id}`, { name: "Guidée", target: `list:${listId}`, template_id: String(tplId), category: "", track_clicks: "on", track_opens: "on" });
    assert.match(await flash(boss, r), /Campagne mise à jour/);
    const row = sql("SELECT track_opens, track_clicks, template_id FROM mk_campaigns WHERE id = ?", id)[0];
    assert.deepEqual([row.track_opens, row.track_clicks, row.template_id], [1, 1, tplId]);
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /suivi des ouvertures : activé/);
    assert.match(html, /<input type="hidden" name="track_opens" value="on">/, "le réglage conservé repart avec les autres formulaires");
  });
  test("aperçu du contenu : document isolé, sans script", async () => {
    const r = await boss.get(`/marketing/modeles/${tplId}/apercu`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-security-policy"), /default-src 'none'/);
    assert.equal((await (await newStudent(srv)).get(`/marketing/modeles/${tplId}/apercu`)).status, 403);
  });
  test("test : envoyé seulement à un membre de l'équipe, jamais à une adresse libre", async () => {
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /<form action="\/marketing\/campagnes\/\d+\/test" method="post"/);
    assert.match(html, /<select id="t-to" name="to">[\s\S]*prof@test\.local/);
    assert.doesNotMatch(html, /<input[^>]*name="to"/);
    const bad = await boss.post(`/marketing/campagnes/${id}/test`, { to: "inconnu@exemple.fr" });
    assert.match(await flash(boss, bad), /membre de l(?:'|&#39;)équipe/);
  });
  test("test sans messagerie configurée : message clair, rien de journalisé", async () => {
    const res = await boss.post(`/marketing/campagnes/${id}/test`, { to: "prof@test.local" });
    assert.match(await flash(boss, res), /Aucun service d(?:'|&#39;)envoi configuré/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'campaign.test_sent'")[0].n, 0);
    assert.doesNotMatch((await boss.get(`/marketing/campagnes/${id}`)).text, /a déjà été envoyé/);
  });
  test("un test d'une autre campagne ne compte pas pour celle-ci ; un test journalisé est signalé", async () => {
    const other = campId("Fin 2");
    run("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata) VALUES (1, 1, 'campaign.test_sent', 'campaign', ?, '{}')", other);
    assert.doesNotMatch((await boss.get(`/marketing/campagnes/${id}`)).text, /a déjà été envoyé/);
    run("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata) VALUES (1, 1, 'campaign.test_sent', 'campaign', ?, '{}')", id);
    assert.match((await boss.get(`/marketing/campagnes/${id}`)).text, /Un e-mail de test a déjà été envoyé pour cette campagne/);
  });
  test("limite : 10 tests par heure et par utilisateur", async () => {
    const c = await loginInstructor(srv);
    let last;
    for (let i = 0; i < 11; i++) last = await flash(c, await c.post(`/marketing/campagnes/${id}/test`, { to: "prof@test.local" }));
    assert.match(last, /10 par heure/);
  });
  test("lecteur : ni test ni envoi ni modification ; étudiant refusé", async () => {
    const html = (await (await member("viewer")).get(`/marketing/campagnes/${id}`)).text;
    assert.doesNotMatch(html, /\/test"|\/lancer"|mk-cl-panel/);
    assert.equal((await (await member("viewer")).post(`/marketing/campagnes/${id}/test`, { to: "prof@test.local" })).status, 403);
    assert.equal((await (await newStudent(srv)).post(`/marketing/campagnes/${id}/test`, { to: "prof@test.local" })).status, 403);
  });
});

describe("blocage de l'envoi", () => {
  test("contrôle en erreur : étape « Envoi » bloquée, bouton désactivé avec la raison, serveur qui refuse", async () => {
    run("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Vide R4')");
    const empty = sql("SELECT id FROM mk_lists WHERE name = 'Vide R4'")[0].id;
    await boss.post("/marketing/campagnes", { name: "Bloquée", template_id: String(tplId), target: `list:${empty}` });
    const id = campId("Bloquée");
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /<li class="mk-cl-row is-error">\s*<details class="mk-cl-item" id="destinataires" open>/);
    assert.match(html, /<span class="mk-cl-error">Aucun contact joignable/);
    assert.match(html, /data-mk-modal-open="envoyer" disabled>Envoyer<\/button>/);
    assert.match(html, /<button type="submit" class="btn btn-primary btn-sm" disabled>Lancer la campagne<\/button>/);
    assert.match(html, /l(?:'|&#39;)envoi sera possible quand tous les éléments ci-dessous seront prêts/);
    const r = await boss.post(`/marketing/campagnes/${id}/lancer`, { confirm_count: "0", confirm_ok: "on" });
    assert.match(await flash(boss, r), /Aucun contact joignable/);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "draft");
  });
  test("contrôle réussi : bouton actif ; la confirmation par le nombre de destinataires reste exigée", async () => {
    const id = campId("Guidée");
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /data-mk-modal-open="envoyer">Envoyer<\/button>/);
    assert.match(html, /<button type="submit" class="btn btn-primary btn-sm">Lancer la campagne<\/button>/);
    const r = await boss.post(`/marketing/campagnes/${id}/lancer`, { confirm_ok: "on" });
    assert.match(await flash(boss, r), /nombre de destinataires/i);
    assert.equal(sql("SELECT status FROM mk_campaigns WHERE id = ?", id)[0].status, "draft");
  });
});

describe("campagne lancée : page de suivi", () => {
  test("chiffres, progression et statut dans les composants du système", async () => {
    const id = campId("Fin 1");
    run("UPDATE mk_campaigns SET delivered_count = 190, bounced_count = 4, open_count = 90, unique_open_count = 80, click_count = 70, unsubscribed_count = 2 WHERE id = ?", id);
    const html = (await boss.get(`/marketing/campagnes/${id}`)).text;
    assert.match(html, /<span class="mk-status mk-status-ok">Envoyée<\/span>/);
    assert.match(html, /class="mk-stats/);
    assert.match(html, /<div class="mk-progress" role="progressbar"/);
    assert.match(html, /Ouvertures détectées/);
    assert.match(html, /indicatif/);
    assert.doesNotMatch(html, /class="dashboard-stat/);
  });
  test("le parcours en sept étapes n'est affiché que pour les brouillons", async () => {
    assert.doesNotMatch((await boss.get(`/marketing/campagnes/${campId("Fin 1")}`)).text, /<li class="mk-step/);
  });
  test("bouton de duplication sur une campagne lancée (éditeurs)", async () => {
    assert.match((await boss.get(`/marketing/campagnes/${campId("Fin 1")}`)).text, /\/dupliquer/);
  });
});
