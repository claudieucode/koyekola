// Enrichissement visuel, palier 4 — états vides illustrés des modules, vignette de repli des formations, feuille d'illustrations dans l'espace formateur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, createCourse } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

describe("palier 4 : états vides et repli de vignette", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(async () => { await srv.stop(); });

  test("panier vide, notifications vides, menus vides : illustration + message et action conservés", async () => {
    const cart = await boss.get("/panier"); assert.equal(cart.status, 200);
    assert.match(cart.text, /Votre panier est vide/); assert.match(cart.text, /class="kv-empty-ill"[^>]*>\s*<svg[^>]*kx-art--boutique/); assert.match(cart.text, /href="\/catalogue"/);
    const notif = await boss.get("/notifications"); assert.equal(notif.status, 200);
    assert.match(notif.text, /Aucune notification pour l'instant/); assert.match(notif.text, /kx-art--commentaires/);
    const nav = await boss.get("/marketing/site-web/navigation"); assert.equal(nav.status, 200);
    assert.match(nav.text, /Aucun menu\./); assert.match(nav.text, /kx-art--navigation/); assert.match(nav.text, /data-mk-modal-open="nouveau-menu"/);
  });
  test("recherche sans résultat : illustration et lien vers le catalogue", async () => {
    const r = await boss.get("/catalogue?q=zzzintrouvablezzz"); assert.equal(r.status, 200);
    assert.match(r.text, /kx-art--recherche/);
  });
  test("espace formateur : aucune formation → scène + bouton de création ; la feuille des illustrations est chargée", async () => {
    const r = await boss.get("/formateur/formations"); assert.equal(r.status, 200);
    assert.match(r.text, /Vous n'avez pas encore de formation/); assert.match(r.text, /kx-art--formations/); assert.match(r.text, /href="\/formateur\/cours\/nouveau"/);
    assert.match(r.text, /\/css\/kola-art\.css/, "sans cette feuille la scène s'afficherait en formes noires");
  });
  test("formation sans vignette : scène de repli, jamais d'image inventée ; avec vignette : image inchangée", async () => {
    await createCourse(boss, srv, { title: "Sans image" });
    const cat = await fetch(`${srv.base}/catalogue`).then((r) => r.text());
    const card = cat.match(/<a href="\/cours\/[^"]+" class="course-card">[\s\S]*?<\/div>\s*<div class="course-body">/)[0];
    assert.match(card, /course-thumb-art/); assert.match(card, /kx-art--formations/); assert.doesNotMatch(card, /<img/);
    srv.db().prepare("UPDATE courses SET thumbnail_path = '/uploads/vignette.jpg' WHERE title = 'Sans image'").run();
    const cat2 = await fetch(`${srv.base}/catalogue`).then((r) => r.text());
    const card2 = cat2.match(/<a href="\/cours\/[^"]+" class="course-card">[\s\S]*?<\/div>\s*<div class="course-body">/)[0];
    assert.match(card2, /<img src="\/uploads\/vignette\.jpg"/); assert.doesNotMatch(card2, /course-thumb-art/);
  });
  test("états vides de la boutique : une scène, le texte d'origine est conservé", () => {
    for (const [f, t] of [["produits", "Aucun produit pour l'instant."], ["commandes", "Aucune commande."], ["clients", "Aucun client."], ["categories", "Aucune catégorie."]]) {
      const v = read(`views/marketing/boutique/${f}.ejs`);
      assert.match(v, new RegExp(`class="mk-empty"><%- illu\\("boutique"`), f); assert.ok(v.includes(`<p>${t}</p>`), f);
    }
  });
  test("aucune illustration dans les tableaux de données (journal, ventes, audit)", () => {
    for (const f of ["journal", "ventes", "audit-sites", "activite"]) assert.doesNotMatch(read(`views/gestion/${f}.ejs`), /illu\(/, f);
  });
});
