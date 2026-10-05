// CRM : la fiche élève (Centre de gestion) et la fiche contact (Marketing) se lisent mutuellement, sans rien dupliquer.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, prof, payant, gratuit;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const userId = (email) => sql("SELECT id FROM users WHERE email = ?", email)[0].id;
// Contact marketing lié au compte (le pont ne tourne pas dans les tests : on pose la ligne comme le fait la synchronisation)
// (le site crée déjà la fiche à l'inscription : on la complète si elle existe, sinon on la crée)
const linkContact = (email, { contactEmail = email } = {}) => {
  const existing = sql("SELECT id FROM mk_contacts WHERE organization_id = 1 AND email = ?", email)[0];
  if (existing && contactEmail === email) {
    run("UPDATE mk_contacts SET status = 'subscribed', lms_user_id = ? WHERE id = ?", userId(email), existing.id);
    return existing.id;
  }
  if (existing) run("DELETE FROM mk_contacts WHERE id = ?", existing.id); // l'identifiant de compte est ensuite porté par une autre adresse
  const info = run("INSERT INTO mk_contacts (organization_id, email, source, status, lms_user_id) VALUES (1, ?, 'lms', 'subscribed', ?)", contactEmail, userId(email));
  return Number(info.lastInsertRowid);
};

before(async () => {
  // Pas de SITE_URL en https : « en ligne » refuserait le paiement de démonstration utilisé pour acheter dans ce test
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
  prof = await loginInstructor(srv);
  payant = await createCourse(prof, srv, { title: "Formation CRM payante", price: 40 });
  gratuit = await createCourse(prof, srv, { title: "Formation CRM gratuite", price: 0 });
});
after(() => srv.stop());

test("client : la fiche élève montre la relation, le statut marketing, les étiquettes et les listes, avec le lien vers le contact", async () => {
  const e = await newStudent(srv);
  await buy(e, payant);
  const contactId = linkContact(e.email);
  run("INSERT INTO mk_tags (organization_id, name) VALUES (1, 'VIP')");
  run("INSERT INTO mk_contact_tags (organization_id, contact_id, tag_id) VALUES (1, ?, (SELECT id FROM mk_tags WHERE name = 'VIP'))", contactId);
  run("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Clients 2026')");
  run("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, (SELECT id FROM mk_lists WHERE name = 'Clients 2026'), ?)", contactId);

  const page = await prof.get(`/formateur/gestion/eleves/${userId(e.email)}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /<span class="badge">Client<\/span>/);
  assert.match(page.text, /Statut marketing : <strong>Abonné<\/strong>/);
  assert.match(page.text, /Étiquettes : VIP/);
  assert.match(page.text, /Listes : Clients 2026/);
  assert.match(page.text, new RegExp(`href="/marketing/contacts/${contactId}"`));
});

test("la fiche contact marketing montre le compte lié : relation, formations, achats, lien vers la fiche élève", async () => {
  const e = await newStudent(srv);
  await buy(e, payant);
  const contactId = linkContact(e.email);
  const page = await prof.get(`/marketing/contacts/${contactId}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /Compte KOLAKISA/);
  assert.match(page.text, /<span class="badge">Client<\/span>/);
  assert.match(page.text, /Formation CRM payante/);
  assert.match(page.text, /40,00 € <\/strong> d'achats|40,00 €<\/strong> d'achats/);
  assert.match(page.text, new RegExp(`href="/formateur/gestion/eleves/${userId(e.email)}"`));
});

test("étudiant : inscrit à une formation gratuite, sans achat", async () => {
  const e = await newStudent(srv);
  run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", userId(e.email), gratuit.id);
  const contactId = linkContact(e.email);
  assert.match((await prof.get(`/formateur/gestion/eleves/${userId(e.email)}`)).text, /<span class="badge">Étudiant<\/span>/);
  const fiche = (await prof.get(`/marketing/contacts/${contactId}`)).text;
  assert.match(fiche, /<span class="badge">Étudiant<\/span>/);
  assert.match(fiche, /\(gratuite\)/);
});

test("élève sans fiche contact : message clair, la page reste affichée", async () => {
  const e = await newStudent(srv);
  await buy(e, payant);
  run("DELETE FROM mk_contacts WHERE email = ?", e.email); // la synchronisation a pu créer la fiche : on la retire
  const page = await prof.get(`/formateur/gestion/eleves/${userId(e.email)}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /Pas de fiche contact marketing pour ce compte/);
});

test("contact sans compte (prospect) : aucun bloc « Compte KOLAKISA »", async () => {
  const info = run("INSERT INTO mk_contacts (organization_id, email, source, status) VALUES (1, 'prospect@ex.fr', 'form', 'subscribed')");
  const page = await prof.get(`/marketing/contacts/${Number(info.lastInsertRowid)}`);
  assert.equal(page.status, 200);
  assert.doesNotMatch(page.text, /Compte KOLAKISA/);
});

test("lien périmé (identifiant de compte réutilisé, adresse différente) : le compte d'un autre n'est JAMAIS affiché", async () => {
  const autre = await newStudent(srv);
  await buy(autre, payant);
  const contactId = linkContact(autre.email, { contactEmail: "ancien.proprietaire@ex.fr" }); // même identifiant, autre adresse
  const page = await prof.get(`/marketing/contacts/${contactId}`);
  assert.equal(page.status, 200);
  assert.doesNotMatch(page.text, /Compte KOLAKISA|Formation CRM payante/);
  assert.doesNotMatch(page.text, new RegExp(autre.email.replace(".", "\\.")));
});

test("accès : un élève ne voit ni la fiche élève ni la fiche contact", async () => {
  const e = await newStudent(srv);
  const contactId = linkContact(e.email);
  for (const url of [`/formateur/gestion/eleves/${userId(e.email)}`, `/marketing/contacts/${contactId}`]) {
    const r = await e.get(url);
    assert.notEqual(r.status, 200, url);
    assert.doesNotMatch(r.text, /Relation et contact|Compte KOLAKISA/);
  }
  const anonyme = await new Client(srv.base).get(`/marketing/contacts/${contactId}`);
  assert.equal(anonyme.status, 302);
});
