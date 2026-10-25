// Catégories de formations (espace formateur) : liste et compteurs réels, recherche / tri / filtres, renommage, fusion confirmée,
// redirection de l'ancienne adresse publique, isolation entre formateurs, formulaire de formation (catégorie conservée / nouvelle).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, eleve;
const q = (sql, ...a) => { const db = srv.db(); try { return db.prepare(sql).all(...a); } finally { db.close(); } };
const one = (sql, ...a) => q(sql, ...a)[0];
const setCat = (id, cat, extra = "") => { const db = srv.db(); db.prepare(`UPDATE courses SET category = ? ${extra} WHERE id = ?`).run(cat, id); db.close(); };

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
  const a = await createCourse(prof, srv, { title: "Excel 1", price: 10 });
  const b = await createCourse(prof, srv, { title: "Excel 2", price: 10 });
  const c = await createCourse(prof, srv, { title: "Brouillon compta", price: 10, publish: false });
  const d = await createCourse(prof, srv, { title: "Anglais", price: 10 });
  setCat(a.id, "Bureautique"); setCat(b.id, "Bureautique"); setCat(c.id, "Comptabilité"); setCat(d.id, "Langue");
  const db = srv.db(); db.prepare("INSERT INTO courses (instructor_id, title, slug, category, published) VALUES ((SELECT instructor_id FROM courses LIMIT 1), 'Espagnol', 'espagnol-x', 'Langues', 1)").run(); db.close();
  srv.ids = { a, b, c, d };
});
after(() => srv.stop());

describe("Liste des catégories", () => {
  test("compteurs réels : formations, publiées, brouillons", async () => {
    const r = await prof.get("/formateur/categories");
    assert.equal(r.status, 200);
    assert.match(r.text, /Bureautique/);
    assert.match(r.text, /2 publiées/);
    assert.match(r.text, /0 publiée · 1 brouillon/);
    assert.match(r.text, /Non visible/);
    assert.match(r.text, /href="\/categorie\/bureautique"/);
    assert.doesNotMatch(r.text, /href="\/categorie\/comptabilite"/, "pas de lien public pour une catégorie sans formation publiée");
  });
  test("noms proches signalés (« Langue » / « Langues »)", async () => {
    const r = await prof.get("/formateur/categories");
    assert.match(r.text, /Nom proche de « Langues »/);
    const f = await prof.get("/formateur/categories?filtre=verifier");
    assert.match(f.text, /Langue/); assert.doesNotMatch(f.text, />Bureautique</);
  });
  test("recherche, tri et filtre", async () => {
    assert.doesNotMatch((await prof.get("/formateur/categories?q=compta")).text, />Bureautique</);
    assert.match((await prof.get("/formateur/categories?q=compta")).text, /Comptabilité/);
    assert.match((await prof.get("/formateur/categories?q=zzz")).text, /Aucune catégorie ne correspond/);
    const t = (await prof.get("/formateur/categories?tri=formations")).text;
    assert.ok(t.indexOf(">Bureautique<") < t.indexOf(">Comptabilité<"), "plus de formations d'abord");
    const m = (await prof.get("/formateur/categories?filtre=masquees")).text;
    assert.match(m, /Comptabilité/); assert.doesNotMatch(m, />Bureautique</);
  });
  test("requête hostile : paramètres inconnus ignorés, pas d'injection", async () => {
    const r = await prof.get("/formateur/categories?q=%3Cscript%3E&tri=x%27--&filtre=%27");
    assert.equal(r.status, 200);
    assert.doesNotMatch(r.text, /<script>alert|<script>"/);
    assert.doesNotMatch(r.text, /&lt;script&gt;.*&lt;script&gt;/);
  });
  test("lien vers les formations de la catégorie", async () => {
    const r = await prof.get("/formateur/formations?statut=toutes&categorie=Bureautique");
    assert.match(r.text, /Excel 1/); assert.doesNotMatch(r.text, /Brouillon compta/);
  });
  test("un élève n'accède pas à la page", async () => {
    for (const u of ["/formateur/categories", "/formateur/categories/modifier?nom=Bureautique"]) assert.notEqual((await eleve.get(u)).status, 200, u);
    const r = await eleve.post("/formateur/categories/renommer", { from: "Bureautique", to: "Pirate" });
    assert.notEqual(r.status, 200); assert.equal(one("SELECT COUNT(*) n FROM courses WHERE category = 'Pirate'").n, 0);
  });
});

describe("Renommer, fusionner", () => {
  test("renommage simple + redirection de l'ancienne adresse publique", async () => {
    const r = await prof.post("/formateur/categories/renommer", { from: "Bureautique", to: "Outils bureautiques" });
    assert.equal(r.status, 302); assert.match(r.location, /ok=/);
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE category = 'Outils bureautiques'").n, 2);
    const red = await prof.get("/categorie/bureautique", { redirect: "manual" });
    assert.equal(red.status, 301); assert.match(red.location, /\/categorie\/outils-bureautiques$/);
    assert.equal((await prof.get("/categorie/outils-bureautiques")).status, 200);
  });
  test("nom vide, trop long, identique : refusés, rien ne change", async () => {
    for (const to of ["  ", "x".repeat(61), "Outils bureautiques", "!!!"]) {
      const r = await prof.post("/formateur/categories/renommer", { from: "Outils bureautiques", to });
      assert.match(r.location, /erreur=/, JSON.stringify(to).slice(0, 20));
    }
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE category = 'Outils bureautiques'").n, 2);
  });
  test("catégorie inconnue : refusée", async () => {
    assert.match((await prof.post("/formateur/categories/renommer", { from: "Fantôme", to: "X" })).location, /erreur=/);
    assert.match((await prof.get("/formateur/categories/modifier?nom=Fant%C3%B4me")).location, /erreur=/);
  });
  test("renommer vers une catégorie existante = fusion, à confirmer", async () => {
    const r = await prof.post("/formateur/categories/renommer", { from: "Langue", to: "langues" });
    assert.match(r.location, /fusion=Langues/);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", srv.ids.d.id).category, "Langue", "rien n'a bougé sans confirmation");
    const page = await prof.get(r.location);
    assert.match(page.text, /existe déjà : fusionner/);
    const ok = await prof.post("/formateur/categories/renommer", { from: "Langue", to: "langues", merge: "1" });
    assert.match(ok.location, /ok=/);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", srv.ids.d.id).category, "Langues");
    assert.equal(one("SELECT COUNT(*) n FROM courses").n, 5, "aucune formation supprimée");
  });
  test("changement de casse seul : pas de redirection parasite", async () => {
    await prof.post("/formateur/categories/renommer", { from: "Comptabilité", to: "comptabilité" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/categorie/comptabilite'").n, 0);
  });
  test("revenir à l'ancien nom retire la redirection devenue fausse", async () => {
    await prof.post("/formateur/categories/renommer", { from: "Outils bureautiques", to: "Bureautique" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/categorie/bureautique'").n, 0, "la redirection inverse a disparu");
    assert.equal(one("SELECT target FROM seo_redirects WHERE source_path = '/categorie/outils-bureautiques'").target, "/categorie/bureautique", "et l'adresse intermédiaire mène au nom retrouvé");
    assert.equal((await prof.get("/categorie/bureautique")).status, 200);
  });
  test("journal d'activité", () => assert.ok(one("SELECT COUNT(*) n FROM audit_log WHERE action = 'category.renamed'").n >= 3));
});

describe("Isolation entre formateurs", () => {
  test("un autre formateur ne voit ni ne modifie mes catégories ; l'ancienne adresse reste si lui l'utilise", async () => {
    const st = await newStudent(srv);
    const db = srv.db(); db.prepare("UPDATE users SET role = 'formateur' WHERE email = ?").run(st.email); db.close();
    const other = await new Client(srv.base).login(st.email, "MotDePasseEleve123");
    const c = await createCourse(other, srv, { title: "Autre cours", price: 5 });
    setCat(c.id, "Bureautique");
    assert.doesNotMatch((await other.get("/formateur/categories")).text, /Comptabilité/);
    const r = await other.post("/formateur/categories/renommer", { from: "Comptabilité", to: "Piraté" });
    assert.match(r.location, /erreur=/);
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE category = 'Piraté'").n, 0);
    // je renomme « Bureautique » alors qu'il l'utilise encore : pas de redirection (sa page publique reste valable)
    await prof.post("/formateur/categories/renommer", { from: "Bureautique", to: "Bureau" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/categorie/bureautique'").n, 0);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", c.id).category, "Bureautique", "son cours est intact");
  });
});

describe("Formulaire de formation", () => {
  test("une catégorie renommée reste sélectionnée (plus de bascule silencieuse vers la première)", async () => {
    const id = srv.ids.c.id;
    const page = await prof.get(`/formateur/cours/${id}/modifier`);
    assert.match(page.text, /<option value="comptabilité" selected>/);
    assert.match(page.text, /Nouvelle catégorie…/);
  });
  test("enregistrer sans toucher la catégorie la conserve ; nouvelle catégorie créée ; orthographe existante réutilisée", async () => {
    const id = srv.ids.c.id;
    const base = { title: "Brouillon compta", level: "debutant", price: "10", category: "comptabilité" };
    await prof.post(`/formateur/cours/${id}/modifier`, base);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", id).category, "comptabilité");
    await prof.post(`/formateur/cours/${id}/modifier`, { ...base, category: "__nouvelle", category_new: "  Gestion   de projet " });
    assert.equal(one("SELECT category FROM courses WHERE id = ?", id).category, "Gestion de projet");
    await prof.post(`/formateur/cours/${id}/modifier`, { ...base, category: "__nouvelle", category_new: "gestion DE projet" });
    assert.equal(one("SELECT category FROM courses WHERE id = ?", id).category, "Gestion de projet", "pas de doublon de casse");
    await prof.post(`/formateur/cours/${id}/modifier`, { ...base, category: "__nouvelle", category_new: "" });
    assert.equal(one("SELECT category FROM courses WHERE id = ?", id).category, "Autre", "nouvelle catégorie vide : Autre");
  });
});
