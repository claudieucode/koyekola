// Marketing M1f (1/3) — interface /marketing : accès par rôle, tableau de bord, contacts, listes, étiquettes, propriétés, conformité.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const contact = (email) => sql("SELECT * FROM mk_contacts WHERE email = ?", email)[0];
const follow = async (client, res) => (res.location ? client.get(res.location) : res);
const post = async (client, url, form) => follow(client, await client.post(url, form));
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("accès", () => {
  test("visiteur anonyme : renvoyé vers la connexion, avec retour prévu", async () => {
    const r = await new Client(srv.base).get("/marketing/contacts");
    assert.equal(r.status, 302);
    assert.match(r.location, /^\/connexion\?redirect=%2Fmarketing%2Fcontacts/);
  });
  test("étudiant (pas membre de l'équipe) : accès refusé partout, écritures comprises", async () => {
    const s = await newStudent(srv);
    for (const url of ["/marketing", "/marketing/contacts", "/marketing/listes", "/marketing/conformite", "/marketing/proprietes"]) {
      assert.equal((await s.get(url)).status, 403, url);
    }
    assert.equal((await s.post("/marketing/contacts", { email: "intrus@ex.fr" })).status, 403);
    assert.equal(contact("intrus@ex.fr"), undefined);
  });
  test("propriétaire : tableau de bord accessible", async () => {
    const r = await boss.get("/marketing");
    assert.equal(r.status, 200);
    assert.match(r.text, /<title>[^<]*Marketing/);
  });
  test("lecteur (viewer) : peut consulter, ne peut rien modifier, ne voit pas les boutons d'action", async () => {
    const v = await member("viewer");
    const page = await v.get("/marketing/contacts");
    assert.equal(page.status, 200);
    assert.doesNotMatch(page.text, /Ajouter un contact/);
    assert.equal((await v.post("/marketing/contacts", { email: "lecteur@ex.fr" })).status, 403);
    assert.equal((await v.post("/marketing/conformite/suppression", { email: "x@ex.fr" })).status, 403);
    assert.equal(contact("lecteur@ex.fr"), undefined);
  });
  test("éditeur : crée des contacts mais ne gère pas la conformité ni l'effacement", async () => {
    const e = await member("editor");
    const c = (await post(e, "/marketing/contacts", { email: "editeur@ex.fr" }));
    assert.equal(c.status, 200);
    assert.ok(contact("editeur@ex.fr"));
    assert.equal((await e.post("/marketing/conformite/suppression", { email: "x@ex.fr", reason: "manual" })).status, 403);
    assert.equal((await e.post(`/marketing/contacts/${contact("editeur@ex.fr").id}/effacer`, { confirm: "on" })).status, 403);
  });
  test("le rôle est relu à chaque requête : retirer l'accès prend effet immédiatement", async () => {
    const v = await member("viewer");
    assert.equal((await v.get("/marketing")).status, 200);
    run("DELETE FROM mk_org_members WHERE user_id = (SELECT id FROM users WHERE email = ?)", v.email);
    assert.equal((await v.get("/marketing")).status, 403);
  });
  test("l'origine étrangère est refusée pour les écritures (protection CSRF de l'app)", async () => {
    const r = await boss.request("/marketing/contacts", { method: "POST", form: { email: "csrf@ex.fr" }, headers: { origin: "https://evil.example" } });
    assert.equal(r.status, 403);
    assert.equal(contact("csrf@ex.fr"), undefined);
  });
});

describe("tableau de bord", () => {
  test("affiche les compteurs par statut et les états vides sans erreur", async () => {
    const r = await boss.get("/marketing");
    assert.match(r.text, /Contacts/);
    assert.match(r.text, /Abonnés/);
    assert.match(r.text, /Pas de consentement/i);
  });
  test("signale que l'envoi n'est pas encore disponible et l'état de la clé de chiffrement", async () => {
    const r = await boss.get("/marketing");
    assert.match(r.text, /envoi/i);
    assert.match(r.text, /clé de chiffrement/i);
  });
});

describe("contacts", () => {
  test("création : contact « inconnu », message de confirmation, jamais abonné d'office", async () => {
    const page = await post(boss, "/marketing/contacts", { email: " Nouveau@Exemple.FR ", first_name: "Awa", last_name: "Koffi", country: "TG" });
    assert.equal(page.status, 200);
    const c = contact("nouveau@exemple.fr");
    assert.deepEqual([c.status, c.first_name, c.source], ["unknown", "Awa", "manual"]);
    assert.match(page.text, /Contact créé/);
    assert.match(page.text, /Pas de consentement/i);
  });
  test("e-mail invalide ou doublon : message clair, rien créé de plus", async () => {
    const bad = await post(boss, "/marketing/contacts", { email: "pas-un-email" });
    assert.match(bad.text, /@/);
    await post(boss, "/marketing/contacts", { email: "doublon@exemple.fr" });
    const dup = await post(boss, "/marketing/contacts", { email: "DOUBLON@exemple.fr" });
    assert.match(dup.text, /existe déjà/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'doublon@exemple.fr'")[0].n, 1);
  });
  test("liste : recherche, filtre par statut, pagination, échappement HTML des noms", async () => {
    await post(boss, "/marketing/contacts", { email: "xss@exemple.fr", first_name: "<script>alert(1)</script>" });
    for (let i = 0; i < 55; i++) run("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (1, ?, 'Pagine')", `pagine${i}@exemple.fr`);
    const p1 = await boss.get("/marketing/contacts?q=pagine");
    assert.equal(p1.status, 200);
    assert.equal((p1.text.match(/>pagine\d+@exemple\.fr</g) || []).length, 50);
    const next = p1.text.match(/<a href="(\/marketing\/contacts\?[^"]*page=2[^"]*)" rel="next"/)?.[1].replace(/&amp;/g, "&");
    assert.ok(next, "lien page suivante");
    const p2 = await boss.get(next);
    assert.equal((p2.text.match(/>pagine\d+@exemple\.fr</g) || []).length, 5);
    const xss = await boss.get("/marketing/contacts?q=xss%40exemple");
    assert.doesNotMatch(xss.text, /<script>alert\(1\)/);
    assert.match(xss.text, /&lt;script&gt;/);
    assert.equal((await boss.get("/marketing/contacts?status=subscribed&q=pagine")).text.includes("pagine1@exemple.fr"), false);
    assert.equal((await boss.get("/marketing/contacts?status=nimporte")).status, 200, "filtre invalide ignoré, pas d'erreur");
  });
  test("fiche : modification des champs ; l'e-mail et le statut ne sont pas éditables", async () => {
    await post(boss, "/marketing/contacts", { email: "fiche@exemple.fr" });
    const id = contact("fiche@exemple.fr").id;
    const page = await boss.get(`/marketing/contacts/${id}`);
    assert.doesNotMatch(page.text, /name="email"/);
    assert.doesNotMatch(page.text, /name="status"/);
    const res = await post(boss, `/marketing/contacts/${id}`, { first_name: "Léa", company: "Acme", status: "subscribed", email: "autre@exemple.fr" });
    assert.match(res.text, /Contact mis à jour|modifié/i);
    const c = contact("fiche@exemple.fr");
    assert.deepEqual([c.first_name, c.company, c.status], ["Léa", "Acme", "unknown"]);
    assert.equal(contact("autre@exemple.fr"), undefined);
  });
  test("fiche introuvable ou d'un autre identifiant : 404 propre", async () => {
    assert.equal((await boss.get("/marketing/contacts/999999")).status, 404);
    assert.equal((await boss.get("/marketing/contacts/abc")).status, 404);
  });
  test("étiquettes et listes depuis la fiche", async () => {
    await post(boss, "/marketing/contacts", { email: "tag@exemple.fr" });
    const id = contact("tag@exemple.fr").id;
    await post(boss, "/marketing/listes", { name: "Salon 2027" });
    const listId = sql("SELECT id FROM mk_lists WHERE name = 'Salon 2027'")[0].id;
    let page = await post(boss, `/marketing/contacts/${id}/etiquettes`, { name: "VIP" });
    assert.match(page.text, /VIP/);
    page = await post(boss, `/marketing/contacts/${id}/listes`, { list_id: String(listId) });
    assert.match(page.text, /Salon 2027/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE contact_id = ?", id)[0].n, 1);
    await post(boss, `/marketing/contacts/${id}/etiquettes/retirer`, { name: "VIP" });
    await post(boss, `/marketing/contacts/${id}/listes/retirer`, { list_id: String(listId) });
    assert.equal(sql("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?", id)[0].n, 0);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE contact_id = ?", id)[0].n, 0);
  });
  test("consentement enregistré par l'équipe : preuve obligatoire ; abonne ; historique visible", async () => {
    await post(boss, "/marketing/contacts", { email: "consent@exemple.fr" });
    const id = contact("consent@exemple.fr").id;
    const refus = await post(boss, `/marketing/contacts/${id}/consentement`, { text: "" });
    assert.match(refus.text, /preuve/i);
    assert.equal(contact("consent@exemple.fr").status, "unknown");
    const ok = await post(boss, `/marketing/contacts/${id}/consentement`, { text: "Formulaire papier signé au salon, le 3 mars 2027" });
    assert.match(ok.text, /Abonné/);
    assert.match(ok.text, /Formulaire papier signé/);
    assert.equal(sql("SELECT source FROM mk_consents WHERE contact_id = ?", id)[0].source, "admin");
  });
  test("désinscription manuelle, puis l'équipe ne peut PAS réabonner (seule la personne le peut)", async () => {
    await post(boss, "/marketing/contacts", { email: "desinscrit@exemple.fr" });
    const id = contact("desinscrit@exemple.fr").id;
    await post(boss, `/marketing/contacts/${id}/consentement`, { text: "Consentement recueilli à l'oral (noté)" });
    const un = await post(boss, `/marketing/contacts/${id}/desinscrire`, {});
    assert.match(un.text, /Désinscrit/);
    const again = await post(boss, `/marketing/contacts/${id}/consentement`, { text: "Je le réabonne quand même" });
    assert.match(again.text, /désinscrit/i);
    assert.match(again.text, /lui-même|elle-même|la personne/i);
    assert.equal(contact("desinscrit@exemple.fr").status, "unsubscribed");
  });
  test("blocage de l'adresse depuis la fiche ; le statut devient « bloqué »", async () => {
    await post(boss, "/marketing/contacts", { email: "bloque@exemple.fr" });
    const id = contact("bloque@exemple.fr").id;
    const r = await post(boss, `/marketing/contacts/${id}/supprimer-adresse`, { note: "demande écrite" });
    assert.match(r.text, /Bloqué/);
    assert.equal(sql("SELECT reason FROM mk_suppressions WHERE email = 'bloque@exemple.fr'")[0].reason, "manual");
  });
  test("effacement : case de confirmation obligatoire ; option pour garder l'adresse bloquée", async () => {
    await post(boss, "/marketing/contacts", { email: "efface@exemple.fr" });
    const id = contact("efface@exemple.fr").id;
    const sans = await post(boss, `/marketing/contacts/${id}/effacer`, {});
    assert.match(sans.text, /confirm/i);
    assert.ok(contact("efface@exemple.fr"));
    const ok = await post(boss, `/marketing/contacts/${id}/effacer`, { confirm: "on", suppress: "on" });
    assert.equal(ok.status, 200);
    assert.equal(contact("efface@exemple.fr"), undefined);
    assert.equal(sql("SELECT reason FROM mk_suppressions WHERE email = 'efface@exemple.fr'")[0].reason, "erasure");
  });
  test("les actions sensibles sont dans le journal d'audit, sans adresse e-mail", async () => {
    const rows = sql("SELECT action, metadata FROM mk_audit_logs WHERE resource_type IN ('contact','suppression')");
    assert.ok(rows.length >= 5);
    assert.ok(rows.some((r) => r.action === "contact.deleted"));
    assert.ok(!rows.some((r) => /@exemple\.fr/.test(r.metadata)));
  });
});

describe("listes, étiquettes, propriétés", () => {
  test("liste : création, nom unique, ajout de contacts par e-mail (inconnus signalés), retrait, suppression", async () => {
    await post(boss, "/marketing/contacts", { email: "membre1@exemple.fr" });
    await post(boss, "/marketing/contacts", { email: "membre2@exemple.fr" });
    const created = await post(boss, "/marketing/listes", { name: "Newsletter" });
    assert.match(created.text, /Newsletter/);
    assert.match((await post(boss, "/marketing/listes", { name: "newsletter" })).text, /existe|porte déjà/);
    const listId = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    const added = await post(boss, `/marketing/listes/${listId}/ajouter`, { emails: "membre1@exemple.fr\nMEMBRE2@exemple.fr\ninconnu@exemple.fr\npas-un-email" });
    assert.match(added.text, /2 contacts? ajouté/);
    assert.match(added.text, /inconnu@exemple\.fr/);
    assert.match(added.text, /pas-un-email/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE list_id = ?", listId)[0].n, 2);
    const m1 = contact("membre1@exemple.fr").id;
    await post(boss, `/marketing/listes/${listId}/retirer`, { contact_id: String(m1) });
    assert.equal(sql("SELECT COUNT(*) n FROM mk_list_members WHERE list_id = ?", listId)[0].n, 1);
    await post(boss, `/marketing/listes/${listId}/supprimer`, {});
    assert.equal(sql("SELECT COUNT(*) n FROM mk_lists WHERE id = ?", listId)[0].n, 0);
    assert.ok(contact("membre2@exemple.fr"), "les contacts restent");
  });
  test("étiquettes : création, comptage, suppression", async () => {
    await post(boss, "/marketing/etiquettes", { name: "Webinaire" });
    const page = await boss.get("/marketing/etiquettes");
    assert.match(page.text, /Webinaire/);
    const id = sql("SELECT id FROM mk_tags WHERE name = 'Webinaire'")[0].id;
    await post(boss, `/marketing/etiquettes/${id}/supprimer`, {});
    assert.equal(sql("SELECT COUNT(*) n FROM mk_tags WHERE id = ?", id)[0].n, 0);
  });
  test("propriétés : définition (choix multiple avec options), valeurs saisies sur la fiche et validées", async () => {
    const r = await post(boss, "/marketing/proprietes", { key: "niveau", label: "Niveau", type: "select", options: "débutant\nconfirmé" });
    assert.match(r.text, /Niveau/);
    assert.match((await post(boss, "/marketing/proprietes", { key: "Mauvaise Clé", label: "x", type: "text" })).text, /Clé invalide/);
    await post(boss, "/marketing/contacts", { email: "prop@exemple.fr" });
    const id = contact("prop@exemple.fr").id;
    const page = await boss.get(`/marketing/contacts/${id}`);
    assert.match(page.text, /name="prop_niveau"/);
    const ok = await post(boss, `/marketing/contacts/${id}/proprietes`, { prop_niveau: "confirmé" });
    assert.match(ok.text, /confirmé/);
    const bad = await post(boss, `/marketing/contacts/${id}/proprietes`, { prop_niveau: "expert" });
    assert.match(bad.text, /liste autorisée|invalide/i);
    assert.equal(sql("SELECT value_text FROM mk_contact_property_values WHERE contact_id = ?", id)[0].value_text, "confirmé");
  });
});

describe("conformité", () => {
  test("liste de suppression : ajout, doublon ignoré, retrait d'un blocage manuel ; rebond/plainte non levables", async () => {
    const add = await post(boss, "/marketing/conformite/suppression", { email: "stop@exemple.fr", note: "demande par courrier" });
    assert.match(add.text, /stop@exemple\.fr/);
    assert.equal(sql("SELECT reason FROM mk_suppressions WHERE email = 'stop@exemple.fr'")[0].reason, "manual");
    const rem = await post(boss, "/marketing/conformite/suppression/retirer", { email: "stop@exemple.fr" });
    assert.match(rem.text, /retiré|levé/i);
    run("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'plainte@exemple.fr', 'complained')");
    const page = await boss.get("/marketing/conformite");
    assert.match(page.text, /plainte@exemple\.fr/);
    const refus = await post(boss, "/marketing/conformite/suppression/retirer", { email: "plainte@exemple.fr" });
    assert.match(refus.text, /ne peut pas être levé/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_suppressions WHERE email = 'plainte@exemple.fr'")[0].n, 1);
  });
  test("catégories de préférences : création, clé validée", async () => {
    const ok = await post(boss, "/marketing/conformite/categories", { key: "promotions", label: "Promotions", description: "Offres et réductions" });
    assert.match(ok.text, /Promotions/);
    assert.match((await post(boss, "/marketing/conformite/categories", { key: "Promo!", label: "x" })).text, /Clé invalide/);
  });
});
