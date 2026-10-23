// KOLAKISA — Design system v3 « Marine, à plat » : site public, espace élève, authentification, pages d'erreur, compte.
// Vérifie la STRUCTURE réelle des pages refondues (pas seulement des classes CSS), la préservation des fonctions (formulaires, liens, routes) et le périmètre du nouveau style.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, createCourse, buy, Client } = require("./helpers");

const CSS = fs.readFileSync(path.join(__dirname, "..", "public", "css", "kola-v3.css"), "utf8");
const rule = (sel) => { const m = new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(CSS); return m ? m[1] : null; };

describe("design v3 : pages publiques, élève, authentification, erreurs, compte", () => {
  let srv, boss, student, anon, course;
  before(async () => {
    srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); student = await newStudent(srv); anon = new Client(srv.base);
    course = await createCourse(boss, srv, { title: "Montage vidéo v3", price: 30 });
  });
  after(() => srv.stop());
  const text = async (c, u) => (await c.get(u)).text;

  describe("authentification", () => {
    test("connexion, inscription, mot de passe oublié et réinitialisation : volet de valeur + formulaire d'origine intact", async () => {
      for (const [u, field] of [["/connexion", 'name="email"'], ["/inscription", 'name="username"'], ["/mot-de-passe-oublie", 'name="email"']]) {
        const h = await text(anon, u);
        assert.match(h, /class="kv-auth"/, u); assert.match(h, /class="kv-auth-aside"[\s\S]*<h2>/, u); assert.match(h, /class="kv-auth-main"[\s\S]*class="auth-card"/, u);
        assert.ok(h.includes(field), `${u} : champ conservé`); assert.match(h, /<form [^>]*method="post"/, u);
        assert.equal((h.match(/<h1/g) || []).length, 1, `${u} : un seul h1`);
      }
      assert.match(await text(anon, "/connexion"), /action="\/connexion"[\s\S]*name="password"/);
      assert.match(await text(anon, "/inscription"), /action="\/inscription"/);
    });
    test("la connexion fonctionne toujours (parcours réel) et mène à l'espace élève", async () => {
      const c = new Client(srv.base);
      const r = await c.post("/connexion", { email: student.email, password: "MotDePasseEleve123" });
      assert.equal(r.status, 302);
      assert.equal((await c.get("/mes-cours")).status, 200);
    });
    test("les promesses du volet sont réelles : « Mon compte » permet de télécharger et de supprimer ses données", async () => {
      const t = await text(student, "/mon-compte");
      assert.match(t, /mes-donnees\.json/); assert.match(t, /action="\/mon-compte\/supprimer"/);
    });
  });

  describe("pages d'erreur", () => {
    test("404 : code, titre, phrase utile (plus de doublon), recherche et liens de sortie", async () => {
      const r = await anon.get("/page-qui-n-existe-pas");
      assert.equal(r.status, 404);
      assert.match(r.text, /class="code">Erreur 404</); assert.match(r.text, /<h1>Page introuvable<\/h1>/);
      assert.match(r.text, /kv-error-msg">La page demandée n(?:'|&#39;)existe pas ou a été déplacée\./);
      assert.match(r.text, /class="kv-error-search"[\s\S]*action="\/catalogue"/); assert.match(r.text, /href="\/"/); assert.match(r.text, /href="\/support"/);
      assert.doesNotMatch(r.text, /Oups|Une erreur est survenue/);
    });
    test("403 : titre et sortie adaptés (connexion proposée), message d'origine conservé", async () => {
      const r = await student.get("/formateur/cours");
      assert.ok([302, 403, 404].includes(r.status), String(r.status));
      if (r.status === 403) { assert.match(r.text, /Erreur 403/); assert.match(r.text, /Accès refusé/); assert.doesNotMatch(r.text, /class="btn btn-outline">Se connecter/, "déjà connecté : pas de bouton de connexion"); assert.match((await anon.get("/formateur/cours")).text, /Se connecter|connexion/i); assert.match(r.text, /Réservé au compte créateur\./); }
    });
  });

  describe("espace élève", () => {
    test("panier vide : composition centrée (une colonne), icône, appel à l'action ; panier garni : récapitulatif conservé", async () => {
      const empty = await text(student, "/panier");
      assert.match(empty, /cart-layout cart-layout--empty/); assert.match(empty, /class="kv-empty-ico"[^>]*aria-hidden="true"/); assert.match(empty, /Votre panier est vide/); assert.doesNotMatch(empty, /summary-card/);
      await student.post(`/panier/ajouter/${course.id}`, {});
      const full = await text(student, "/panier");
      assert.doesNotMatch(full, /cart-layout--empty/); assert.match(full, /summary-card/); assert.match(full, /Passer la commande/); assert.match(full, /Montage vidéo v3/);
    });
    test("Mes formations : en-tête avec actions, liste, certificats, notifications — états vides soignés", async () => {
      const mc = await text(student, "/mes-cours");
      assert.match(mc, /kv-pagehead/); assert.match(mc, /href="\/mes-certificats"/); assert.match(mc, /Explorer le catalogue/);
      assert.match(mc, /Vous n(?:'|&#39;)avez pas encore de formation/);
      const cert = await text(student, "/mes-certificats");
      assert.match(cert, /Aucun certificat pour l(?:'|&#39;)instant/); assert.match(cert, /Vous n(?:'|&#39;)avez pas encore de certificat/); assert.match(cert, /href="\/mes-cours"/);
      const notif = await text(student, "/notifications");
      assert.match(notif, /kv-pagehead/); assert.match(notif, /class="kv-list"|Aucune notification pour l(?:'|&#39;)instant/);
    });
    test("Mon compte : navigation de sections dont chaque ancre existe, sections et formulaires d'origine", async () => {
      const t = await text(student, "/mon-compte");
      assert.match(t, /class="kv-account-nav"/);
      for (const id of ["acc-info", "acc-data", "acc-delete"]) { assert.ok(t.includes(`href="#${id}"`), `lien #${id}`); assert.ok(t.includes(`id="${id}"`), `cible #${id}`); }
      assert.match(t, /action="\/mon-compte\/confirmer-email"/);
    });
  });

  describe("catalogue et fiche d'une formation", () => {
    test("recherche sans résultat : état vide avec icône ; fiche : résumé sans doublon du titre, données réelles conservées", async () => {
      assert.match(await text(anon, "/catalogue?q=zzzzzz-introuvable"), /kv-empty-ico[\s\S]*Aucune formation ne correspond/);
      const t = await text(anon, `/cours/${course.slug}`);
      const box = t.slice(t.indexOf('class="course-summary"'), t.indexOf('id="apprendre"'));
      assert.match(box, /<span class="eyebrow">Résumé de la formation<\/span>/); assert.match(box, /<h2 id="summaryTitle" class="sr-only">Montage vidéo v3<\/h2>/, "titre conservé comme nom accessible, masqué visuellement");
      assert.doesNotMatch(box.replace(/<h2 id="summaryTitle"[^>]*>[^<]*<\/h2>/, ""), /Montage vidéo v3/, "plus de doublon visible du titre");
      assert.match(box, /summary-stats/);
    });
    test("recherche du site : état vide proposé et formulaire conservé", async () => {
      const t = await text(anon, "/recherche?q=zzzzzz");
      assert.match(t, /class="kv-error-search"[\s\S]*action="\/recherche"|action="\/recherche"[\s\S]*kv-error-search/); assert.match(t, /Aucun résultat/);
    });
  });

  describe("pages d'information et d'état", () => {
    test("FAQ vide : état vide structuré (plus de texte nu éclaté dans un conteneur flex) ; lien de contact conservé", async () => {
      const t = await text(anon, "/faq");
      assert.match(t, /<div class="empty-state">[\s\S]*kv-empty-ico[\s\S]*<h3>Aucune question pour le moment<\/h3>[\s\S]*<p>N(?:'|&#39;)hésitez pas à <a href="\/contact">nous écrire<\/a>\.<\/p>/);
      assert.match(t, /class="page-cta">Vous ne trouvez pas votre réponse/);
      assert.match(rule("p.empty-state"), /display:\s*block/); assert.match(rule(".page-cta"), /display:\s*block/);
    });
    test("confirmation d'adresse (lien invalide) : carte d'état centrée avec icône, titre et sortie — plus de carte pleine largeur sans marge", async () => {
      const t = await text(anon, "/confirmer-email/jeton-invalide");
      assert.match(t, /class="container kv-narrow"[\s\S]*kv-state-ico is-warn[\s\S]*<h1>Lien invalide ou expiré<\/h1>/); assert.doesNotMatch(t, /container-wide section-tight account-page/);
      assert.match(t, /href="\/connexion\?redirect=%2Fmon-compte"/);
    });
    test("les mises en page du compte ne s'appliquent qu'à Mon compte (sélecteur .kv-account .account-page)", () => {
      assert.ok(rule(".kv-account .account-page")); assert.equal(rule(".account-page"), null);
    });
  });

  describe("marque, pied de page et périmètre du style", () => {
    test("pastille de marque à l'initiale (en-tête et pied), feuille v3 chargée sur le site public et PAS sur l'espace formateur ni le CMS", async () => {
      const h = await text(anon, "/");
      assert.match(h, /class="logo" data-initial="K"/); assert.match(h, /<footer class="site-footer"[\s\S]*class="logo" data-initial="K"/); assert.match(h, /kola-v3\.css/);
      assert.doesNotMatch(await text(boss, "/formateur"), /kola-v3\.css/);
      assert.doesNotMatch(await text(boss, "/marketing/site-web/principal/tableau-de-bord"), /kola-v3\.css/);
    });
    test("à plat : la marque, le pied de page, les cartes, le bandeau de formation et celui de l'accueil n'ont ni dégradé, ni halo, ni ombre décorative", () => {
      assert.doesNotMatch(rule(".logo::before"), /gradient|shadow:\s*0 [1-9]/);
      assert.match(rule(".logo::before"), /box-shadow:\s*none/);
      assert.match(rule(".site-footer::before"), /content:\s*none/); assert.match(rule(".site-footer"), /border-radius:\s*0/);
      assert.match(rule(".course-hero"), /background:\s*var\(--primary\)/); assert.match(rule(".course-hero::before, .course-hero::after"), /content:\s*none/);
      assert.match(rule(".hero-stage::before"), /content:\s*none/); assert.match(rule(".card"), /box-shadow:\s*none/);
      assert.doesNotMatch(CSS.replace(/\.hero-slides::after[^}]*\}/, ""), /radial-gradient/);
    });
    test("la couleur d'action suit Apparence → Personnaliser : la feuille n'impose aucune couleur codée en dur pour la marque, les boutons ni les liens", () => {
      assert.match(rule(".logo::before"), /background:\s*var\(--accent\)/);   // le texte blanc de la pastille est le seul littéral
      for (const sel of [".kv-tabs a[aria-current=\"page\"]", ".kv-count", ".kv-account-nav a:hover"]) { const r = rule(sel); assert.ok(r, sel); assert.doesNotMatch(r, /#[0-9a-f]{3,6}\b/i, `${sel} : jetons seulement`); }
    });
    test("responsive et mouvement réduit prévus ; focus clavier visible", () => {
      assert.match(CSS, /@media \(max-width: 860px\)[\s\S]*\.kv-auth \{ grid-template-columns: 1fr/); assert.match(CSS, /prefers-reduced-motion: reduce/); assert.match(CSS, /:focus-visible \{ outline: 2px solid var\(--accent\)/);
    });
  });
});
