// Refonte de « Mon espace » : barre latérale, vue d'ensemble, formations, fiche de gestion, catégories, apparence.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const dashboard = require("../src/services/dashboard");

let srv, prof, eleve, cours, brouillon;
const one = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).get(...a);
  db.close();
  return r;
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  cours = await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
  brouillon = await createCourse(prof, srv, { title: "Brouillon secret", price: 10, publish: false });
  eleve = await newStudent(srv);
  await buy(eleve, cours);
});
after(() => srv.stop());

describe("Mise en page de l'espace", () => {
  test("barre latérale avec les rubriques et la rubrique active", async () => {
    const r = await prof.get("/formateur");
    assert.equal(r.status, 200);
    assert.match(r.text, /class="dash[" ]/);
    for (const g of ["Tableau de bord", "Contenu", "Communication", "Croissance", "Site", "Personnalisation"]) assert.match(r.text, new RegExp(`>${g}<`));
    for (const href of ["/formateur/formations", "/formateur/chapitres", "/formateur/categories", "/formateur/messages", "/formateur/blog", "/marketing", "/formateur/seo", "/formateur/faq", "/formateur/pages/a-propos", "/formateur/apparence", "/formateur/profil"]) assert.match(r.text, new RegExp(`href="${href}"`), href);
    assert.match(r.text, /href="\/formateur"[^>]*aria-current="page"/);
    assert.match(r.text, /Déconnexion/);
    assert.match(r.text, /class="dash-footer"/);
    assert.doesNotMatch(r.text, /class="site-footer"/, "le pied de page public n'est pas affiché dans l'espace");
  });

  test("rubrique active selon l'adresse", () => {
    assert.equal(dashboard.activeKey("/formateur/cours/3/curriculum"), "chapters");
    assert.equal(dashboard.activeKey("/formateur/cours/3/modifier"), "courses");
    assert.equal(dashboard.activeKey("/formateur/blog/4/modifier"), "blog");
    assert.equal(dashboard.activeKey("/formateur/pages/a-propos"), "about");
  });

  test("le site public garde son en-tête et son pied de page", async () => {
    const r = await prof.get("/");
    assert.doesNotMatch(r.text, /class="dash[" ]/);
    assert.match(r.text, /class="site-footer"/);
  });

  test("toutes les pages de l'espace s'affichent", async () => {
    for (const url of ["/formateur/formations", "/formateur/formations?statut=brouillons", "/formateur/formations?q=excel", `/formateur/cours/${cours.id}`, `/formateur/cours/${cours.id}/etudiants`, `/formateur/cours/${cours.id}/ventes`, `/formateur/cours/${cours.id}/modifier`, `/formateur/cours/${cours.id}/curriculum`, `/formateur/cours/${cours.id}/faq`, "/formateur/chapitres", "/formateur/categories", "/formateur/apparence", "/formateur/profil", "/formateur/messages", "/formateur/blog", "/formateur/seo", "/formateur/faq", "/formateur/pages/a-propos"]) {
      const r = await prof.get(url);
      assert.equal(r.status, 200, url);
      assert.match(r.text, /class="dash[" ]/, url);
    }
  });

  test("un élève n'a pas accès à l'espace formateur", async () => {
    for (const url of ["/formateur", "/formateur/formations", "/formateur/apparence", `/formateur/cours/${cours.id}/ventes`]) {
      const r = await eleve.get(url);
      assert.notEqual(r.status, 200, url);
    }
    const r = await eleve.postJson("/formateur/apparence", { theme: "noir" });
    assert.notEqual(r.status, 200);
    const anonyme = await new Client(srv.base).get("/formateur");
    assert.equal(anonyme.status, 302);
  });
});

describe("Vue d'ensemble et formations", () => {
  test("indicateurs réels : formations, publiées, élèves, revenus", async () => {
    const r = await prof.get("/formateur");
    const kpi = (label) => (r.text.match(new RegExp(`kpi-label">${label}</span><span class="kpi-value">([^<]+)<`)) || [])[1];
    assert.equal(kpi("Formations créées"), "2");
    assert.equal(kpi("Publiées"), "1");
    assert.equal(kpi("Élèves inscrits"), "1");
    assert.match(kpi("Revenus"), /^49,00\s€$/);
    assert.match(r.text, /49,00\s€/);
    assert.match(r.text, /Nouvelle formation/);
  });

  test("carte de formation : Modifier, Aperçu et menu ⋯ avec les actions", async () => {
    const r = await prof.get("/formateur/formations");
    assert.match(r.text, new RegExp(`href="/formateur/cours/${cours.id}/modifier"`));
    assert.match(r.text, new RegExp(`href="/cours/${cours.slug}"`));
    assert.match(r.text, /class="dmenu-btn"/);
    assert.match(r.text, new RegExp(`action="/formateur/cours/${cours.id}/dupliquer"`));
    assert.match(r.text, new RegExp(`href="/formateur/cours/${cours.id}/curriculum"`));
    assert.match(r.text, new RegExp(`href="/formateur/cours/${cours.id}/faq"`));
    assert.match(r.text, /data-confirm=/);
  });

  test("filtres par statut et recherche", async () => {
    const pub = await prof.get("/formateur/formations?statut=publiees");
    assert.match(pub.text, /Excel avancé/);
    assert.doesNotMatch(pub.text, /Brouillon secret/);
    const dr = await prof.get("/formateur/formations?statut=brouillons");
    assert.match(dr.text, /Brouillon secret/);
    assert.doesNotMatch(dr.text, /Excel avancé/);
    const q = await prof.get("/formateur/formations?q=excel");
    assert.match(q.text, /Excel avancé/);
    assert.doesNotMatch(q.text, /Brouillon secret/);
  });

  test("fiche de gestion : onglets, élèves et ventes", async () => {
    const hub = await prof.get(`/formateur/cours/${cours.id}`);
    assert.match(hub.text, /class="course-tabs"/);
    const el = await prof.get(`/formateur/cours/${cours.id}/etudiants`);
    assert.match(el.text, new RegExp(eleve.email.split("@")[0]));
    const ve = await prof.get(`/formateur/cours/${cours.id}/ventes`);
    assert.match(ve.text, /49,00\s€/);
  });

  test("la fiche d'une formation d'un autre formateur est refusée", async () => {
    const r = await prof.get("/formateur/cours/99999");
    assert.notEqual(r.status, 200);
  });
});

describe("Catégories", () => {
  test("renommer une catégorie met à jour les formations du formateur", async () => {
    const r = await prof.post("/formateur/categories/renommer", { from: "Test", to: "Bureautique" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", cours.id).category, "Bureautique");
    const page = await prof.get("/formateur/categories");
    assert.match(page.text, /Bureautique/);
  });

  test("nom vide refusé", async () => {
    const r = await prof.post("/formateur/categories/renommer", { from: "Bureautique", to: "  " });
    assert.match(r.location, /erreur=/);
    assert.equal(one("SELECT category FROM courses WHERE id = ?", cours.id).category, "Bureautique");
  });
});

describe("Apparence", () => {
  test("thème par défaut, puis thème prédéfini enregistré et appliqué", async () => {
    let page = await prof.get("/formateur/apparence");
    assert.match(page.text, /data-theme="bleu-fonce"/);
    assert.match(page.text, /--dash-sidebar: #ffffff/);
    const r = await prof.postJson("/formateur/apparence", { theme: "noir" });
    assert.equal(r.status, 200);
    assert.equal(JSON.parse(r.text).prefs.theme, "noir");
    page = await prof.get("/formateur");
    assert.match(page.text, /--dash-sidebar: #0b0d0f/);
  });

  test("couleurs personnalisées : seuls les codes #RRGGBB valides sont gardés", async () => {
    const r = await prof.postJson("/formateur/apparence", { theme: "perso", colors: { primary: "#FF5500", sidebar: "#102030", bg: "red", button: "javascript:alert(1)", hack: "#000000" } });
    const prefs = JSON.parse(r.text).prefs;
    assert.equal(prefs.theme, "perso");
    assert.deepEqual(prefs.colors, { primary: "#ff5500", sidebar: "#102030" });
    const page = await prof.get("/formateur");
    assert.match(page.text, /--dash-primary: #ff5500/);
    assert.match(page.text, /--dash-sidebar: #102030/);
    assert.match(page.text, /--dash-sidebar-text: #d6dee6/, "texte clair sur une barre foncée");
  });

  test("thème inconnu → thème par défaut ; réinitialisation", async () => {
    let r = await prof.postJson("/formateur/apparence", { theme: "<script>" });
    assert.equal(JSON.parse(r.text).prefs.theme, "clair");
    r = await prof.postJson("/formateur/apparence", { theme: "clair", colors: {} });
    assert.deepEqual(JSON.parse(r.text).prefs, { theme: "clair", colors: {} });
  });

  test("texte lisible sur un fond personnalisé foncé", () => {
    const t = dashboard.tokens({ theme: "perso", colors: { bg: "#101418" } });
    assert.equal(t["--dash-text"], "#e8ecef");
    const c = dashboard.tokens({ theme: "perso", colors: { bg: "#fafafa", button: "#ffe066" } });
    assert.equal(c["--dash-text"], "#102a3a");
    assert.equal(c["--dash-button-text"], "#102a3a");
  });
});
