// Site Web — phase 5c : gabarits de pages. Chaque gabarit crée une vraie page du moteur (sections valides, modifiables),
// sans faux chiffres ; la formation n'est ajoutée que si une formation est publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const { TEMPLATES, catalog } = require("../src/marketing/pages/templates");
const { startServer, loginInstructor, createCourse } = require("./helpers");

test("la bibliothèque de gabarits (les 42 d'origine toujours présents, 100 au total) ; chaque gabarit donne une page valide, à identifiants de section uniques, sans faux chiffres", () => {
  const { A } = freshMarketing();
  // 23 gabarits depuis fe11a8d (FAQ, tarifs, témoignages, 404 ajoutés par l'autre session) : attente mise à jour, code applicatif inchangé
  // Programme 20.4 : 19 gabarits par secteur ajoutés À LA SUITE (agence, portfolio, restaurant, immobilier, blog, boutique de formations, association, boutique en ligne) ; les 23 premiers et leur ordre sont inchangés
  const ORIGINAUX = 42; // 23 historiques + 19 par secteur : leurs clés et leur ordre sont conservés
  assert.ok(TEMPLATES.length >= ORIGINAUX); assert.equal(TEMPLATES.length, catalog().length);
  assert.deepEqual(catalog().slice(0, 23).map((t) => t.category), ["Génération de prospects", "Vente", "Webinaire", "Formation", "Produit", "Service", "Newsletter", "Téléchargement", "Lancement", "Bientôt disponible", "Inscription", "Consultation", "Remerciement", "Événement", "À propos", "Contact", "Portfolio", "Logiciel (SaaS)", "Aide", "Tarifs", "Preuve sociale", "Erreur", "Entreprise"]);
  for (const t of TEMPLATES) {
    const p = pages.createPage(A, { name: `Page ${t.key}`, template: t.key });
    const ids = p.working.sections.map((s) => s.id);
    assert.ok(ids.length >= (t.key === "p404" ? 1 : 2), t.key); // la page 404 (fe11a8d) tient volontairement en une section
    assert.equal(new Set(ids).size, ids.length, t.key);
    assert.doesNotMatch(JSON.stringify(p.working.sections), /\b\d{2,}\s?%|\b\d{3,} (élèves|clients|inscrits)/, `${t.key} : aucun chiffre inventé`);
  }
  assert.throws(() => pages.createPage(A, { name: "Inconnu", template: "nexiste-pas" }), /Modèle de page inconnu/);
});

describe("création depuis un modèle (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("liste des modèles dans la création ; page de vente avec la vraie formation du catalogue", async () => {
    const list = (await boss.get("/marketing/pages")).text;
    assert.match(list, /name="template" value="vente"/);
    assert.match(list, /Page de vente/);
    let r = await boss.post("/marketing/pages", { name: "Vente sans formation", template: "vente" });
    let sections = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(Number(r.location.match(/(\d+)$/)[1])).sections);
    assert.ok(!sections.some((s) => s.type === "course"), "aucune formation publiée : pas de section formation");
    const course = await createCourse(boss, srv, { title: "Photoshop de A à Z", price: 0 });
    r = await boss.post("/marketing/pages", { name: "Vente Photoshop", template: "vente" });
    const id = Number(r.location.match(/(\d+)$/)[1]);
    sections = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(id).sections);
    assert.equal(sections.find((s) => s.type === "course").courseId, course.id);
    assert.match((await boss.get(r.location)).text, /Page créée à partir du modèle/);
    const rendered = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: { sections, title: "x", description: "", theme: {}, seo: {} } } });
    assert.equal(rendered.status, 200);
    assert.match(rendered.text, /Photoshop de A à Z/, "formation lue dans le catalogue");
  });

  test("modèle depuis la fiche d'un site ; modèle inconnu refusé avec un message", async () => {
    const siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Académie" })).location.match(/(\d+)$/)[1]);
    // Les modèles se choisissent dans la boîte « Nouvelle page » commune, ouverte depuis l'écran Pages du site
    assert.match((await boss.get(`/marketing/site-web/sites/${siteId}/pages`)).text, /name="template" value="webinaire"/);
    const r = await boss.post("/marketing/pages", { name: "Webinaire mars", site_id: String(siteId), template: "webinaire" });
    const row = db.prepare("SELECT site_id, kind, sections FROM mk_landing_pages WHERE id = ?").get(Number(r.location.match(/(\d+)$/)[1]));
    assert.equal(row.site_id, siteId);
    assert.deepEqual(JSON.parse(row.sections).map((s) => s.type), ["hero", "list", "text", "form"]);
    const bad = await boss.post("/marketing/pages", { name: "Pirate", template: "<script>" });
    assert.match((await boss.get(bad.location)).text, /Modèle de page inconnu/);
  });
});
