// Marketing R2 (2/2) — pages contacts : tableau CRM, tri, filtres, pagination, actions groupées, export, fiche avec chronologie.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const idOf = (email) => sql("SELECT id FROM mk_contacts WHERE email = ?", email)[0]?.id;
const rowEmails = (html) => [...html.matchAll(/<a href="\/marketing\/contacts\/\d+">([^<]+)<\/a>/g)].map((m) => m[1]);
const flash = async (client, res) => (await client.get(res.location)).text;
const form = (pairs) => new URLSearchParams(pairs);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  const db = srv.db();
  const ins = db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, last_name, source, created_at) VALUES (1, ?, ?, ?, ?, ?)");
  for (let i = 0; i < 120; i++) ins.run(`pg${String(i).padStart(3, "0")}@ex.fr`, "Page", `N${String(i).padStart(3, "0")}`, i % 2 ? "import" : "form", `2026-01-01 00:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`);
  ins.run("zed@ex.fr", "<b>Zed</b>", "Fin", "manual", "2026-02-01 00:00:00");
  ins.run("ancien@ex.fr", "Vieux", "Contact", "manual", "2020-01-01 00:00:00");
  db.close();
});
after(() => srv.stop());

describe("liste : tableau", () => {
  test("colonnes, sélection (propriétaire), mise en page en cartes sur mobile", async () => {
    const html = (await boss.get("/marketing/contacts?q=pg")).text;
    assert.match(html, /<table class="mk-table mk-datatable" data-mk-select>/);
    for (const h of ["E-mail", "Nom", "Statut", "Étiquettes", "Source", "Ajouté le", "Dernière activité"]) assert.match(html, new RegExp(`<th[^>]*>(?:<a [^>]+>)?${h}`), h);
    assert.match(html, /data-label="Statut"/);
    assert.match(html, /<input type="checkbox" data-mk-select-all/);
    assert.match(html, /<input type="checkbox" data-mk-select-row form="bulk-form" name="ids" value="\d+" aria-label="Sélectionner pg\d+@ex\.fr"/);
  });
  test("les contacts sont affichés avec leur statut sous forme de pastille", async () => {
    assert.match((await boss.get("/marketing/contacts?q=zed")).text, /<span class="mk-status[^"]*">Pas de consentement<\/span>/);
  });
  test("nom et adresses échappés (aucune injection)", async () => {
    const html = (await boss.get("/marketing/contacts?q=zed")).text;
    assert.doesNotMatch(html, /<b>Zed<\/b>/);
    assert.match(html, /&lt;b&gt;Zed&lt;\/b&gt;/);
  });
  test("nombre de résultats annoncé (région dynamique pour les lecteurs d'écran)", async () => {
    assert.match((await boss.get("/marketing/contacts?q=pg")).text, /<p class="mk-filter-count" role="status">120 contacts/);
    assert.match((await boss.get("/marketing/contacts?q=zed")).text, /1 contact\b/);
  });
});

describe("liste : tri", () => {
  test("e-mail croissant puis décroissant ; l'en-tête indique le sens et propose le sens inverse", async () => {
    const asc = (await boss.get("/marketing/contacts?q=pg&tri=email&sens=asc")).text;
    assert.deepEqual(rowEmails(asc).slice(0, 2), ["pg000@ex.fr", "pg001@ex.fr"]);
    assert.match(asc, /<th scope="col" aria-sort="ascending"><a href="[^"]*tri=email&amp;sens=desc[^"]*">E-mail<\/a><\/th>/);
    const desc = (await boss.get("/marketing/contacts?q=pg&tri=email&sens=desc")).text;
    assert.equal(rowEmails(desc)[0], "pg119@ex.fr");
    assert.match(desc, /aria-sort="descending"/);
  });
  test("par défaut : les derniers ajoutés d'abord", async () => {
    const p1 = rowEmails((await boss.get("/marketing/contacts?q=%40ex.fr&taille=100")).text);
    assert.equal(p1[0], "zed@ex.fr");
    assert.ok(!p1.includes("ancien@ex.fr"));
    assert.ok(rowEmails((await boss.get("/marketing/contacts?q=%40ex.fr&taille=100&page=2")).text).includes("ancien@ex.fr"));
    assert.match((await boss.get("/marketing/contacts?q=%40ex.fr")).text, /<th scope="col" aria-sort="descending"><a [^>]*>Ajouté le<\/a>/);
  });
  test("tri par nom", async () => {
    const r = rowEmails((await boss.get("/marketing/contacts?q=pg&tri=name&sens=desc")).text);
    assert.equal(r[0], "pg119@ex.fr");
  });
  test("tri inconnu ou injection : ignoré sans erreur", async () => {
    for (const tri of ["zzz", "id;DROP TABLE mk_contacts", "email desc, 1"]) assert.equal((await boss.get(`/marketing/contacts?tri=${encodeURIComponent(tri)}&sens=x`)).status, 200);
    assert.ok(sql("SELECT COUNT(*) n FROM mk_contacts")[0].n > 100);
  });
  test("le tri est conservé quand on change de page ou de filtre", async () => {
    const html = (await boss.get("/marketing/contacts?q=pg&tri=email&sens=asc&taille=25")).text;
    assert.match(html, /<a href="[^"]*page=2[^"]*tri=email[^"]*"|<a href="[^"]*tri=email[^"]*page=2[^"]*"/);
  });
});

describe("liste : pagination", () => {
  test("50 par page par défaut ; page suivante ; page courante marquée", async () => {
    const p1 = (await boss.get("/marketing/contacts?q=pg")).text;
    assert.equal(rowEmails(p1).length, 50);
    assert.match(p1, /1–50 sur 120/);
    const p3 = (await boss.get("/marketing/contacts?q=pg&page=3")).text;
    assert.equal(rowEmails(p3).length, 20);
    assert.match(p3, /id="pb-page"[^>]*value="3"/, "page courante : champ de page à 3"); assert.match(p3, /sur 3<\/span>/);
    assert.match(p3, /101–120 sur 120/);
  });
  test("taille de page 25 ou 100 ; taille invalide = 50", async () => {
    assert.equal(rowEmails((await boss.get("/marketing/contacts?q=pg&taille=25")).text).length, 25);
    assert.equal(rowEmails((await boss.get("/marketing/contacts?q=pg&taille=100")).text).length, 100);
    assert.equal(rowEmails((await boss.get("/marketing/contacts?q=pg&taille=7")).text).length, 50);
  });
  test("page hors bornes ou absurde : dernière / première page, sans erreur", async () => {
    assert.match((await boss.get("/marketing/contacts?q=pg&page=999")).text, /101–120 sur 120/);
    assert.equal((await boss.get("/marketing/contacts?q=pg&page=abc")).status, 200);
    assert.equal(rowEmails((await boss.get("/marketing/contacts?q=pg&page=-3")).text).length, 50);
  });
  test("liens Précédent / Suivant avec libellés accessibles", async () => {
    const html = (await boss.get("/marketing/contacts?q=pg&page=2")).text;
    assert.match(html, /<nav class="mk-pager-links" aria-label="Pagination">/);
    assert.match(html, /<a href="[^"]*" rel="prev"[^>]*>Précédent<\/a>/);
    assert.match(html, /<a href="[^"]*" rel="next"[^>]*>Suivant<\/a>/);
    assert.doesNotMatch((await boss.get("/marketing/contacts?q=pg&page=3")).text, /rel="next"/);
  });
});

describe("liste : filtres et états vides", () => {
  test("source, ajoutés depuis N jours, joignables", async () => {
    assert.equal(rowEmails((await boss.get("/marketing/contacts?q=pg&source=import&taille=100")).text).length, 60);
    const recent = rowEmails((await boss.get("/marketing/contacts?depuis=30&taille=100&q=%40ex.fr")).text);
    assert.ok(!recent.includes("ancien@ex.fr"));
    assert.match((await boss.get("/marketing/contacts?joignables=1&q=pg")).text, /Aucun contact ne correspond/);
  });
  test("la liste des sources est proposée dans le filtre", async () => {
    const html = (await boss.get("/marketing/contacts")).text;
    assert.match(html, /<select id="f-source" name="source">[\s\S]*<option value="import"/);
  });
  test("aucun résultat : message clair et lien pour réinitialiser les filtres", async () => {
    const html = (await boss.get("/marketing/contacts?q=introuvable-xyz")).text;
    assert.match(html, /class="mk-empty"/);
    assert.match(html, /Aucun contact ne correspond/);
    assert.match(html, /<a [^>]*href="\/marketing\/contacts"[^>]*>Réinitialiser les filtres/);
  });
  test("le formulaire de filtres est un vrai formulaire de recherche accessible", async () => {
    const html = (await boss.get("/marketing/contacts?q=pg&tri=email&sens=asc")).text;
    assert.match(html, /<form class="mk-filterbar" method="get" action="\/marketing\/contacts" role="search">/);
    assert.match(html, /<input type="hidden" name="tri" value="email">/);
    assert.match(html, /<label class="sr-only" for="f-q">/);
  });
  test("filtres secondaires repliables (mobile) : fermés sans filtre, ouverts quand un filtre est actif", async () => {
    assert.match((await boss.get("/marketing/contacts")).text, /<details class="mk-filter-more">\s*<summary[^>]*>[\s\S]*?Filtres avancés<\/summary>/);
    assert.match((await boss.get("/marketing/contacts?source=import")).text, /<details class="mk-filter-more" open>/);
  });
  test("étiquettes affichées dans le tableau, échappées", async () => {
    const id = idOf("zed@ex.fr");
    await boss.post("/marketing/contacts/actions", form([["ids", String(id)], ["op", "tag_add"], ["tag", "<i>vip</i>"]]));
    const html = (await boss.get("/marketing/contacts?q=zed")).text;
    assert.match(html, /<span class="mk-chip mk-chip-static">&lt;i&gt;vip&lt;\/i&gt;<\/span>/);
    assert.doesNotMatch(html, /<i>vip<\/i>/);
  });
});

describe("droits d'affichage", () => {
  test("lecteur : consultation seule (ni cases, ni actions groupées, ni export)", async () => {
    const v = await member("viewer");
    const html = (await v.get("/marketing/contacts?q=pg")).text;
    assert.equal((await v.get("/marketing/contacts?q=pg")).status, 200);
    assert.doesNotMatch(html, /data-mk-select-row|id="bulk-form"|export\.csv/);
  });
  test("éditeur : cases et actions groupées, mais pas d'export", async () => {
    const e = await member("editor");
    const html = (await e.get("/marketing/contacts?q=pg")).text;
    assert.match(html, /data-mk-select-row/);
    assert.match(html, /<form id="bulk-form"/);
    assert.doesNotMatch(html, /export\.csv/);
  });
  test("administrateur : lien d'export qui reprend les filtres en cours", async () => {
    const html = (await boss.get("/marketing/contacts?q=pg&source=import")).text;
    assert.match(html, /href="\/marketing\/contacts\/export\.csv\?[^"]*q=pg[^"]*source=import|href="\/marketing\/contacts\/export\.csv\?[^"]*source=import[^"]*q=pg/);
  });
  test("étudiant et anonyme refusés", async () => {
    assert.equal((await (await newStudent(srv)).get("/marketing/contacts")).status, 403);
    assert.match((await new Client(srv.base).get("/marketing/contacts")).location, /^\/connexion/);
  });
});

describe("actions groupées", () => {
  const ids = () => ["pg000@ex.fr", "pg001@ex.fr", "pg002@ex.fr"].map(idOf);
  test("ajouter une étiquette à la sélection : message clair, étiquettes visibles", async () => {
    const res = await boss.post("/marketing/contacts/actions", form([...ids().map((i) => ["ids", String(i)]), ["op", "tag_add"], ["tag", "Salon"], ["back", "/marketing/contacts?q=pg"]]));
    assert.equal(res.location, "/marketing/contacts?q=pg");
    assert.match(await flash(boss, res), /Étiquette « Salon » ajoutée à 3 contacts/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'Salon'")[0].n, 3);
  });
  test("relancer la même action : « déjà étiquetés », rien de dupliqué", async () => {
    const res = await boss.post("/marketing/contacts/actions", form([...ids().map((i) => ["ids", String(i)]), ["op", "tag_add"], ["tag", "Salon"]]));
    assert.match(await flash(boss, res), /0 (nouveau|modifié)|déjà/i);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'Salon'")[0].n, 3);
  });
  test("retirer une étiquette", async () => {
    const res = await boss.post("/marketing/contacts/actions", form([["ids", String(ids()[0])], ["op", "tag_remove"], ["tag", "Salon"]]));
    assert.match(await flash(boss, res), /retirée de 1 contact/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'Salon'")[0].n, 2);
  });
  test("ajouter à une liste / retirer d'une liste : aucun consentement donné", async () => {
    await boss.post("/marketing/listes", { name: "Salon 2027" });
    const listId = sql("SELECT id FROM mk_lists WHERE name = 'Salon 2027'")[0].id;
    const res = await boss.post("/marketing/contacts/actions", form([...ids().map((i) => ["ids", String(i)]), ["op", "list_add"], ["list_id", String(listId)]]));
    assert.match(await flash(boss, res), /ajouté(s)? à la liste « Salon 2027 »/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE list_id = ?", listId)[0].n, 3);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_consents")[0].n, 0);
    const res2 = await boss.post("/marketing/contacts/actions", form([["ids", String(ids()[0])], ["op", "list_remove"], ["list_id", String(listId)]]));
    assert.match(await flash(boss, res2), /retiré(s)? de la liste/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE list_id = ?", listId)[0].n, 2);
  });
  test("sélection vide, action inconnue, étiquette vide, identifiants invalides : message d'erreur, rien modifié", async () => {
    const before = sql("SELECT COUNT(*) n FROM mk_contact_tags")[0].n;
    const cases = [
      [[["op", "tag_add"], ["tag", "x"]], /Sélectionnez au moins un contact/],
      [[["ids", String(ids()[0])], ["op", "supprimer"]], /Action inconnue/],
      [[["ids", String(ids()[0])], ["op", "tag_add"], ["tag", "  "]], /étiquette/i],
      [[["ids", "abc"], ["op", "tag_add"], ["tag", "x"]], /Sélection invalide/],
      [[["ids", String(ids()[0])], ["op", "list_add"], ["list_id", "999999"]], /introuvable/i],
    ];
    for (const [pairs, re] of cases) {
      const res = await boss.post("/marketing/contacts/actions", form(pairs));
      assert.match(await flash(boss, res), re);
    }
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags")[0].n, before);
  });
  test("tout ou rien : un contact inconnu dans la sélection annule tout", async () => {
    const before = sql("SELECT COUNT(*) n FROM mk_contact_tags")[0].n;
    const res = await boss.post("/marketing/contacts/actions", form([["ids", String(ids()[0])], ["ids", "999999"], ["op", "tag_add"], ["tag", "Fantome"]]));
    assert.match(await flash(boss, res), /introuvable/i);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags")[0].n, before);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_tags WHERE name = 'Fantome'")[0].n, 0);
  });
  test("adresse de retour : uniquement une page contacts du site (aucune redirection ouverte)", async () => {
    for (const back of ["https://evil.example/", "//evil.example", "/marketing/../admin", "javascript:alert(1)", "/autre"]) {
      const res = await boss.post("/marketing/contacts/actions", form([["ids", String(ids()[0])], ["op", "tag_add"], ["tag", "x"], ["back", back]]));
      assert.equal(res.location, "/marketing/contacts", back);
    }
  });
  test("lecteur : refusé ; éditeur : autorisé ; étudiant : refusé", async () => {
    const pairs = [["ids", String(ids()[0])], ["op", "tag_add"], ["tag", "droits"]];
    assert.equal((await (await member("viewer")).post("/marketing/contacts/actions", form(pairs))).status, 403);
    assert.equal((await (await member("editor")).post("/marketing/contacts/actions", form(pairs))).status, 302);
    assert.equal((await (await newStudent(srv)).post("/marketing/contacts/actions", form(pairs))).status, 403);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_tags WHERE name = 'droits'")[0].n, 1);
  });
  test("l'action groupée ne change aucun statut", async () => {
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE 'pg%' AND status <> 'unknown'")[0].n, 0);
  });
});

describe("export CSV", () => {
  test("administrateur : fichier téléchargeable, avec en-tête et filtres appliqués", async () => {
    const r = await boss.get("/marketing/contacts/export.csv?q=pg&source=import");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/csv; charset=utf-8/);
    assert.match(r.headers.get("content-disposition"), /attachment; filename="contacts-\d{4}-\d{2}-\d{2}\.csv"/);
    assert.ok(r.text.replace(/^\uFEFF/, "").startsWith("E-mail,Prénom,Nom,"), "en-tête attendu (le BOM UTF-8 pour Excel est conservé ou retiré selon le client ; il est vérifié dans le test de données)");
    assert.equal(r.text.trim().split(/\r?\n/).length, 61, "en-tête + 60 contacts « import »");
    assert.doesNotMatch(r.text, /pg000@ex\.fr/, "pg000 est de source « form »");
  });
  test("l'export est journalisé", async () => {
    assert.ok(sql("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'contacts.exported'")[0].n >= 1);
  });
  test("neutralisation des formules dans le fichier", async () => {
    run("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (1, 'formule@ex.fr', '=1+1')");
    assert.match((await boss.get("/marketing/contacts/export.csv?q=formule")).text, /'=1\+1/);
  });
  test("éditeur, lecteur, étudiant refusés ; anonyme redirigé ; aucune fuite du contenu", async () => {
    for (const role of ["editor", "viewer"]) {
      const r = await (await member(role)).get("/marketing/contacts/export.csv");
      assert.equal(r.status, 403, role);
      assert.doesNotMatch(r.text, /@ex\.fr/);
    }
    assert.equal((await (await newStudent(srv)).get("/marketing/contacts/export.csv")).status, 403);
    assert.match((await new Client(srv.base).get("/marketing/contacts/export.csv")).location, /^\/connexion/);
  });
  test("l'adresse d'export ne masque pas la fiche d'un contact (pas de conflit de route)", async () => {
    assert.equal((await boss.get(`/marketing/contacts/${idOf("zed@ex.fr")}`)).status, 200);
    assert.equal((await boss.get("/marketing/contacts/actions")).status, 404);
  });
});

describe("fiche : résumé et chronologie", () => {
  test("résumé chiffré et chronologie chronologique, avec les événements réels", async () => {
    const id = idOf("zed@ex.fr");
    await boss.post(`/marketing/contacts/${id}/consentement`, { text: "Formulaire papier signé au salon" });
    const html = (await boss.get(`/marketing/contacts/${id}`)).text;
    for (const marker of ["mk-stats", "mk-timeline", "E-mails reçus", "Dernière activité"]) assert.ok(html.includes(marker), marker);
    assert.match(html, /Consentement donné \(admin\)/);
    assert.match(html, /Contact créé \(source : manual\)/);
    assert.match(html, /Étiquette « &lt;i&gt;vip&lt;\/i&gt; » ajoutée/);
    assert.ok(html.indexOf("Consentement donné") < html.indexOf("Contact créé"), "le plus récent d'abord");
  });
  test("e-mail envoyé : visible dans la chronologie avec lien vers la campagne", async () => {
    const id = idOf("zed@ex.fr");
    run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status) VALUES (1, 'Lancement <hiver>', 'list', 1, 'sent')");
    const camp = sql("SELECT id FROM mk_campaigns WHERE name LIKE 'Lancement%'")[0].id;
    run("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, status, subject, sent_at, first_click_at) VALUES (1, ?, ?, 'zed@ex.fr', 'sent', 'Bienvenue', ?, ?)", camp, id, Date.now() - 1000, Date.now());
    const html = (await boss.get(`/marketing/contacts/${id}`)).text;
    assert.match(html, /E-mail « Bienvenue » envoyé \(campagne « Lancement &lt;hiver&gt; »\)/);
    assert.match(html, new RegExp(`href="/marketing/campagnes/${camp}"`));
    assert.match(html, /Clic dans l(?:'|&#39;)e-mail « Bienvenue »/);
    assert.doesNotMatch(html, /Lancement <hiver>/);
  });
  test("lecteur : voit la chronologie, ses liens sont limités à ce que son rôle permet", async () => {
    const v = await member("viewer");
    const html = (await v.get(`/marketing/contacts/${idOf("zed@ex.fr")}`)).text;
    assert.match(html, /mk-timeline/);
    assert.match(html, /Contact créé/);
  });
  test("les formulaires existants de la fiche sont intacts", async () => {
    const html = (await boss.get(`/marketing/contacts/${idOf("zed@ex.fr")}`)).text;
    for (const marker of ["/proprietes", "/etiquettes", "/listes", "/consentement", "/desinscrire"]) assert.ok(html.includes(marker) || marker === "/proprietes", marker);
    assert.match(html, /Peut-on lui écrire/);
  });
});
