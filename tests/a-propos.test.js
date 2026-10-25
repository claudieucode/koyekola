// Page « À propos » : découpage du contenu éditable (titre, introduction, sections), texte par défaut limité aux fonctions réelles, sécurité du rendu,
// liens existants, SEO, éditeur réservé au formateur, persistance.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");
const { parse, DEFAULT_ABOUT, DEFAULT_TITLE } = require("../src/services/aboutPage");

describe("découpage du contenu (fonction pure)", () => {
  test("titre, introduction, introduction suivie d'un texte, sections", () => {
    const d = parse("# Notre école\n\nPremière phrase.\n\nSuite du texte.\n\n## Histoire\n\nHier.\n\n## Mission\n\n- **A.** un\n- **B.** deux");
    assert.equal(d.title, "Notre école");
    assert.match(d.lead, /Première phrase/); assert.doesNotMatch(d.lead, /Suite/);
    assert.match(d.intro, /Suite du texte/);
    assert.deepEqual(d.sections.map((s) => s.title), ["Histoire", "Mission"]);
    assert.match(d.sections[1].html, /<ul>/);
  });
  test("sans titre : titre vide (le titre par défaut s'applique) ; contenu vide : rien d'inventé", () => {
    assert.equal(parse("Juste un texte.").title, "");
    const e = parse("");
    assert.equal(e.lead, ""); assert.deepEqual(e.sections, []);
  });
  test("deuxième titre de niveau 1 = section ; titres en double = identifiants distincts ; # dans un bloc de code ignoré", () => {
    const d = parse("# T\n\nIntro\n\n# Autre\n\ntexte\n\n## Autre\n\nencore\n\n```\n# pas un titre\n```");
    assert.equal(d.sections.length, 2);
    assert.notEqual(d.sections[0].id, d.sections[1].id);
    assert.match(d.sections[1].html, /# pas un titre/);
  });
  test("HTML saisi neutralisé", () => {
    const d = parse("Intro <img src=x onerror=alert(1)>\n\n## S <script>alert(1)</script>\n\n<script>alert(2)</script> et [lien](javascript:alert(3))");
    const all = d.lead + d.sections.map((s) => s.html).join("");   // les titres restent du texte brut : la vue les échappe (vérifié sur la page rendue plus bas)
    assert.doesNotMatch(all, /<script|<img|href="javascript/i);
  });
  test("texte par défaut : aucune date, aucun chiffre, aucun témoignage, aucune promesse de fonction absente", () => {
    assert.doesNotMatch(DEFAULT_ABOUT, /\b(19|20)\d{2}\b|\d+\s?(%|clients|élèves|pays|formations)|témoign|numéro un|meilleure/i);
    assert.match(DEFAULT_TITLE, /KOLAKISA/);
  });
});

describe("page publique et éditeur", () => {
  let srv, prof, eleve;
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); eleve = await newStudent(srv); await createCourse(prof, srv, { title: "Excel", price: 10 }); });
  after(async () => { if (srv) await srv.stop(); });
  const db = () => srv.db();

  test("rendu par défaut : un seul h1, sections, chiffre réel du catalogue, liens existants", async () => {
    const r = await new Client(srv.base).get("/a-propos");
    assert.equal(r.status, 200);
    assert.equal((r.text.match(/<h1[ >]/g) || []).length, 1);
    assert.match(r.text, /<h1>KOLAKISA, la plateforme pour apprendre à votre rythme<\/h1>/);
    assert.match(r.text, /Comment se déroule une formation/);
    assert.match(r.text, /1 formation au catalogue/);
    assert.match(r.text, /<title>[^<]*À propos/);
    assert.match(r.text, /rel="canonical" href="[^"]*\/a-propos"/);
    assert.match(r.text, /"@type":"AboutPage"/);
    for (const href of ["/catalogue", "/contact", "/faq"]) {
      assert.match(r.text, new RegExp(`href="${href}"`), href);
      assert.equal((await new Client(srv.base).get(href)).status, 200, href);
    }
  });

  test("contenu saisi : titre, introduction et sections repris, HTML neutralisé, description SEO utilisée", async () => {
    const r = await prof.post("/formateur/pages/a-propos", { content: "# Mon école\n\nNous aidons à apprendre.\n\n## Notre mission\n\nTransmettre. <script>alert(1)</script>\n\n## Titre <img src=x onerror=alert(2)>\n\nfin", seo_description: "Description sur mesure" });
    assert.equal(r.status, 302);
    const p = await new Client(srv.base).get("/a-propos");
    assert.match(p.text, /<h1>Mon école<\/h1>/);
    assert.match(p.text, /Nous aidons à apprendre/);
    assert.match(p.text, /<h2 id="ap-notre-mission">Notre mission<\/h2>/);
    assert.doesNotMatch(p.text, /<script>alert\(1\)|<img src=x/);
    assert.match(p.text, /Titre &lt;img src=x onerror=alert\(2\)&gt;/);
    assert.match(p.text, /content="Description sur mesure"/);
  });

  test("pas de carte « créateur » sans biographie ; avec biographie : affichée, texte seulement", async () => {
    assert.doesNotMatch((await new Client(srv.base).get("/a-propos")).text, /about-section--person/);
    const d = db(); d.prepare("UPDATE users SET bio = ? WHERE role = 'formateur'").run("Formateur <b>passionné</b>."); d.close();
    const t = (await new Client(srv.base).get("/a-propos")).text;
    assert.match(t, /about-section--person/); assert.match(t, /Formateur &lt;b&gt;passionné&lt;\/b&gt;\./);
  });

  test("éditeur : réservé au formateur (élève 403, visiteur redirigé) ; contenu trop long refusé sans perte", async () => {
    assert.equal((await eleve.get("/formateur/pages/a-propos")).status, 403);
    assert.equal((await eleve.post("/formateur/pages/a-propos", { content: "piraté" })).status, 403);
    assert.equal((await new Client(srv.base).get("/formateur/pages/a-propos")).status, 302);
    const before = (await new Client(srv.base).get("/a-propos")).text;
    const r = await prof.post("/formateur/pages/a-propos", { content: "x".repeat(20001), seo_description: "" });
    assert.match(r.location, /erreur=/);
    assert.equal((await new Client(srv.base).get("/a-propos")).text.includes("Mon école"), true, "l'ancien contenu est conservé");
    assert.ok(before);
  });

  test("contenu vidé : retour au texte par défaut", async () => {
    await prof.post("/formateur/pages/a-propos", { content: "", seo_description: "" });
    assert.match((await new Client(srv.base).get("/a-propos")).text, /KOLAKISA, la plateforme pour apprendre/);
  });
});
