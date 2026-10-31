// Enrichissement visuel, palier 3 — vrais serveurs, vraies pages : visuels des écrans de création (IA, assistant, bibliothèque, Site Web, connexion, accueil public),
// miniatures de sites aux couleurs réelles, absence de ressource externe, aucune illustration dans l'éditeur ni dans les écrans denses.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const ejs = require("ejs");
const path = require("node:path");
const { startServer, loginInstructor } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

const count = (t, re) => (t.match(re) || []).length;
const svgs = (t) => t.match(/<svg[\s\S]*?<\/svg>/g) || [];

describe("palier 3 : écrans enrichis", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(async () => { await srv.stop(); });

  test("création de site par IA : visuel, huit étapes réelles, formulaire intact", async () => {
    const r = await boss.get("/marketing/ia/studio"); assert.equal(r.status, 200);
    assert.equal(count(r.text, /class="kx-feature-art"/g), 1);
    assert.match(r.text, /kx-art--ia/);
    const steps = r.text.match(/<ol class="kx-steps"[\s\S]*?<\/ol>/)[0];
    assert.equal(count(steps, /<li>/g), 8);
    for (const s of ["Brief du projet", "Plan du site", "Pages", "Design", "Contenus", "Images et médias", "Prévisualisation", "Publication"]) assert.match(steps, new RegExp(s));
    assert.match(r.text, /id="aibh-go"/); assert.match(r.text, /Analyser mon projet/);
    assert.match(r.text, /kx-art--nouveausite/, "état vide illustré");
  });
  test("les étapes affichées correspondent aux étapes du serveur", () => {
    const { STEPS } = require("../src/marketing/ai/builder/workspace");
    assert.deepEqual(STEPS.map((s) => s.label || s.title), ["Brief du projet", "Plan du site", "Pages", "Design", "Contenus", "Images et médias", "Prévisualisation", "Publication"]);
  });
  test("assistant « Créer un site » : visuel d'en-tête et trois cartes illustrées, choix toujours accessibles", async () => {
    const r = await boss.get("/marketing/site-web/assistant"); assert.equal(r.status, 200);
    assert.equal(count(r.text, /class="kx-card-ill"/g), 3);
    for (const s of ["nouveausite", "bibliotheque", "boutique", "assistant"]) assert.match(r.text, new RegExp(`kx-art--${s}`));
    assert.equal(count(r.text, /name="mode"/g), 3);
    assert.match(r.text, /<strong>Site vierge<\/strong>/);
  });
  test("bibliothèque de modèles et écran Site Web : visuel d'en-tête, fonctionnement inchangé", async () => {
    const t = await boss.get("/marketing/site-web/templates"); assert.equal(t.status, 200);
    assert.match(t.text, /kx-art--bibliotheque/); assert.match(t.text, /data-tp-root/);
    const w = await boss.get("/marketing/site-web"); assert.equal(w.status, 200);
    assert.match(w.text, /kx-art--plateforme/);
  });
  test("connexion et inscription : volet de valeur illustré, formulaires inchangés", async () => {
    const anon = await fetch(`${srv.base}/connexion`).then((r) => r.text());
    assert.match(anon, /class="kv-auth-art"/); assert.match(anon, /kx-art--formations/); assert.match(anon, /action="\/connexion"/);
    const reg = await fetch(`${srv.base}/inscription`).then((r) => r.text());
    assert.match(reg, /class="kv-auth-art"/); assert.match(reg, /type="password"/);
  });
  test("Mes sites : miniature par site (principal compris), aux couleurs du site, accessible", async () => {
    await boss.post("/marketing/site-web/sites", { name: "Site miniature" });
    const r = await boss.get("/marketing/site-web/sites"); assert.equal(r.status, 200);
    const thumbs = r.text.match(/<span class="kx-site-thumb">[\s\S]*?<\/svg>/g) || [];
    assert.ok(thumbs.length >= 2, `${thumbs.length} miniature(s)`);
    for (const t of thumbs) { assert.match(t, /role="img" aria-label="Schéma de mise en page aux couleurs du site /); assert.doesNotMatch(t, /undefined|NaN/); }
    assert.match(r.text, /Site miniature/);
    assert.equal(count(r.text, /<tr data-site=/g), thumbs.length, "une miniature par ligne");
  });
  test("aucune ressource externe ni script dans les visuels ajoutés", async () => {
    for (const url of ["/marketing/ia/studio", "/marketing/site-web/assistant", "/marketing/site-web/sites", "/marketing/site-web"]) {
      const t = await boss.get(url).then((r) => r.text);
      for (const s of svgs(t)) { assert.doesNotMatch(s.replace('xmlns="http://www.w3.org/2000/svg"', ""), /https?:\/\/|<image|<script|\son[a-z]+=/i, url); }
    }
  });
  test("l'éditeur de pages et les écrans de données denses n'ont pas reçu d'illustration décorative d'en-tête", async () => {
    for (const url of ["/marketing/contacts", "/marketing/campagnes"]) { const t = await boss.get(url).then((r) => r.text); assert.equal(count(t, /class="kx-feature-art"/g), 0, url); }
  });
});

describe("miniature de site : sécurité des couleurs", () => {
  const render = (colors, kind) => ejs.renderFile(path.join(__dirname, "../views/marketing/partials/site-thumb.ejs"), { colors, kind, label: "Test" });
  test("une couleur piégée est remplacée par la couleur de la charte, jamais injectée", async () => {
    const html = await render({ primary: 'red" onload="alert(1)', secondary: "#0b2a40;background:url(//x)", accent: "#GGGGGG", background: "<script>", surface: "#ffffff" }, "vitrine");
    assert.doesNotMatch(html, /onload|alert|url\(|<script|#GGGGGG/i);
    assert.match(html, /#0277b6/);
  });
  test("une couleur valide est reprise telle quelle ; type inconnu = vitrine ; les 4 types se rendent", async () => {
    const html = await render({ primary: "#112233" }, "inconnu");
    assert.match(html, /#112233/);
    for (const k of ["vitrine", "blog", "boutique", "formation"]) { const h = await render(null, k); assert.match(h, /^<svg/); assert.doesNotMatch(h, /undefined|NaN/); assert.equal(count(h, /<svg/g), 1); }
  });
});
