// Corrections de l'audit (octobre 2026) :
// - B1 : en production, sans paiement réel branché, aucune commande payante (sinon toute formation payante est gratuite) ;
// - B5 : plus aucun champ de carte bancaire factice ;
// - M2 : suppression d'une formation, d'un chapitre, d'une leçon : la base d'abord, les fichiers ensuite ;
// - M3 : en-tête de la FAQ d'une formation (statut et lien « Aperçu »).
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const G = "/formateur/gestion";

describe("B1 / B5 : production sans paiement réel", () => {
  let srv, prof;
  before(async () => { srv = await startServer({ NODE_ENV: "production" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("formation payante : pas de bouton d'achat, un lien vers le contact", async () => {
    const course = await createCourse(prof, srv, { title: "Payante prod", price: 49 });
    const s = await newStudent(srv);
    const page = (await s.get(`/cours/${course.slug}`)).text;
    assert.match(page, /L'achat en ligne ouvre bientôt/);
    assert.match(page, /href="\/contact" class="btn btn-primary btn-block">Nous contacter pour la suivre/);
    assert.doesNotMatch(page, /Acheter maintenant/);
    // Visiteur non connecté : même message (pas d'invitation à se connecter pour un achat impossible)
    const visitor = (await new Client(srv.base).get(`/cours/${course.slug}`)).text;
    assert.match(visitor, /L'achat en ligne ouvre bientôt/);
    assert.doesNotMatch(visitor, /Se connecter pour acheter/);
  });

  test("commande payante forcée (panier puis POST) : refusée, aucune inscription, aucune commande", async () => {
    const course = await createCourse(prof, srv, { title: "Payante forcée", price: 30 });
    const s = await newStudent(srv);
    await s.post(`/panier/ajouter/${course.id}`, {});
    const checkout = (await s.get("/commande")).text;
    assert.match(checkout, /Le paiement en ligne ouvre bientôt/);
    assert.doesNotMatch(checkout, /<form action="\/commande" method="post"/, "aucun bouton de commande");
    const r = await s.post("/commande", {});
    assert.equal(r.status, 302);
    assert.equal(r.location, "/commande");
    assert.match((await s.get("/commande")).text, /role="alert">Le paiement en ligne n(&#39;|')est pas encore ouvert/);
    const db = srv.db();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.email = ?").get(s.email).n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?").get(s.email).n, 0);
    db.close();
  });

  test("formation gratuite : inscription toujours possible", async () => {
    const course = await createCourse(prof, srv, { title: "Gratuite prod", price: 0 });
    const s = await newStudent(srv);
    assert.match((await s.get(`/cours/${course.slug}`)).text, /Acheter maintenant/);
    await s.post(`/panier/ajouter/${course.id}`, {});
    assert.match((await s.get("/commande")).text, /Confirmer l'inscription/);
    const r = await s.post("/commande", {});
    assert.match(r.location, /^\/commande\/confirmation\/\d+$/);
  });

  test("code promo à 100 % : la commande à 0 € passe", async () => {
    const course = await createCourse(prof, srv, { title: "Payante offerte", price: 25 });
    assert.equal((await prof.post(`${G}/ventes/coupons`, { code: "OFFERT100", kind: "percent", value: "100", active: "on" })).status, 302);
    const s = await newStudent(srv);
    await s.post(`/panier/ajouter/${course.id}`, {});
    await s.post("/commande/code-promo", { code: "OFFERT100" });
    assert.match((await s.get("/commande")).text, /Confirmer l'inscription/);
    const r = await s.post("/commande", {});
    assert.match(r.location, /^\/commande\/confirmation\/\d+$/);
  });
});

describe("B1 : fermé par défaut, quel que soit l'environnement", () => {
  for (const env of [{ NODE_ENV: "development" }, { NODE_ENV: "" }, { NODE_ENV: "production", PAIEMENT_SIMULE: "" }]) {
    test(`NODE_ENV=${JSON.stringify(env.NODE_ENV)} : pas d'achat payant`, async () => {
      const srv = await startServer(env);
      try {
        const prof = await loginInstructor(srv);
        const course = await createCourse(prof, srv, { title: "Payante défaut", price: 12 });
        assert.match((await new Client(srv.base).get(`/cours/${course.slug}`)).text, /L'achat en ligne ouvre bientôt/);
      } finally { await srv.stop(); }
    });
  }
  test("PAIEMENT_SIMULE=1 : mode démonstration ouvert", async () => {
    const srv = await startServer({ NODE_ENV: "production", PAIEMENT_SIMULE: "1" });
    try {
      const prof = await loginInstructor(srv);
      const course = await createCourse(prof, srv, { title: "Payante démo", price: 12 });
      const s = await newStudent(srv);
      assert.match((await s.get(`/cours/${course.slug}`)).text, /Acheter maintenant/);
    } finally { await srv.stop(); }
  });
});

describe("B5 / M2 / M3 : mode démonstration (tests)", () => {
  let srv, prof;
  before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
  after(() => srv.stop());

  test("B5 : la page de paiement n'affiche aucun champ de carte", async () => {
    const course = await createCourse(prof, srv, { title: "Démo", price: 19 });
    const s = await newStudent(srv);
    await s.post(`/panier/ajouter/${course.id}`, {});
    const page = (await s.get("/commande")).text;
    assert.doesNotMatch(page, /Numéro de carte|CVC|Date d'expiration|Nom sur la carte/);
    assert.match(page, /Mode démonstration : aucun paiement réel/);
    assert.match(page, /Confirmer la commande de .* \(démonstration\)/);
    assert.match((await s.post("/commande", {})).location, /^\/commande\/confirmation\/\d+$/);
  });

  test("M3 : l'en-tête de la FAQ d'une formation publiée affiche son vrai statut et un lien « Aperçu » valide", async () => {
    const course = await createCourse(prof, srv, { title: "Avec FAQ", price: 10 });
    const page = (await prof.get(`/formateur/cours/${course.id}/faq`)).text;
    assert.doesNotMatch(page, /href="\/cours\/"/, "plus de lien vers /cours/ (404)");
    assert.match(page, new RegExp(`href="/cours/${course.slug}"`));
    assert.doesNotMatch(page, /Brouillon/);
  });

  test("M2 : supprimer une leçon efface la fiche puis sa vidéo", async () => {
    const course = await createCourse(prof, srv, { title: "Avec vidéo", publish: false, lessons: [{ title: "Vidéo", video: Buffer.from("fausse vidéo") }] });
    const db = srv.db();
    const { video_path } = db.prepare("SELECT video_path FROM lessons WHERE id = ?").get(course.lessons[0].id);
    assert.ok(video_path);
    const file = path.join(srv.dir, "uploads", video_path.replace(/^\/?(uploads\/)?/, ""));
    const exists = () => fs.existsSync(file) || fs.readdirSync(path.join(srv.dir, "uploads"), { recursive: true }).some((f) => String(f).endsWith(path.basename(video_path)));
    assert.ok(exists(), "fichier présent avant suppression");
    await prof.post(`/formateur/lecons/${course.lessons[0].id}/supprimer`, {});
    assert.equal(db.prepare("SELECT COUNT(*) n FROM lessons WHERE id = ?").get(course.lessons[0].id).n, 0);
    assert.ok(!exists(), "fichier effacé après la fiche");
    db.close();
  });

  test("M2 : supprimer une formation sans élève efface tout ; une formation avec élèves (même gratuite) est protégée", async () => {
    const empty = await createCourse(prof, srv, { title: "Vide", publish: false });
    assert.equal((await prof.post(`/formateur/cours/${empty.id}/supprimer`, {})).status, 302);
    const db = srv.db();
    assert.equal(db.prepare("SELECT COUNT(*) n FROM courses WHERE id = ?").get(empty.id).n, 0);
    const free = await createCourse(prof, srv, { title: "Gratuite suivie", price: 0 });
    const s = await newStudent(srv);
    await buy(s, free);
    const r = await prof.post(`/formateur/cours/${free.id}/supprimer`, {});
    assert.equal(r.status, 409);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM courses WHERE id = ?").get(free.id).n, 1);
    db.close();
  });
});

describe("D2 / D3 : base de données", () => {
  let srv;
  before(async () => { srv = await startServer(); });
  after(() => srv.stop());

  test("D2 : journal WAL actif", () => {
    const db = srv.db();
    assert.equal(db.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
    db.close();
  });

  test("D3 : toutes les clés étrangères des tables du site et des tables marketing à fort volume ont un index", () => {
    const db = srv.db();
    // organization_id : une seule organisation, jamais supprimée ; tables marketing peu volumineuses : non concernées
    const ignored = /^(organization_id)$/;
    const missing = [];
    for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()) {
      const firstCols = db.prepare(`PRAGMA index_list("${name}")`).all().map((i) => db.prepare(`PRAGMA index_info("${i.name}")`).all()[0]?.name);
      const pk = db.prepare(`PRAGMA table_info("${name}")`).all().find((c) => c.pk === 1)?.name;
      for (const fk of db.prepare(`PRAGMA foreign_key_list("${name}")`).all()) {
        if (ignored.test(fk.from) || firstCols.includes(fk.from) || pk === fk.from) continue;
        missing.push(`${name}.${fk.from}`);
      }
    }
    db.close();
    assert.deepEqual(missing, []);
  });
});

describe("finitions de l'audit", () => {
  let srv, prof;
  before(async () => { srv = await startServer({ SITE_URL: "https://kolakisa.test" }); prof = await loginInstructor(srv); });
  after(() => srv.stop());
  // Derrière le proxy de l'hébergeur, le domaine demandé arrive dans X-Forwarded-Host (trust proxy)
  const get = (url, host) => fetch(srv.base + url, { headers: { "x-forwarded-host": host }, redirect: "manual" });

  test("www.<domaine> redirige (301) vers le domaine de SITE_URL, chemin et paramètres gardés ; le domaine lui-même ne redirige pas", async () => {
    const r = await get("/catalogue?q=excel", "www.kolakisa.test");
    assert.equal(r.status, 301);
    assert.equal(r.headers.get("location"), "https://kolakisa.test/catalogue?q=excel");
    assert.equal((await get("/catalogue", "kolakisa.test")).status, 200);
    // Règle des domaines (palier 2, décision validée) : un hôte inconnu ne sert plus le site principal
    assert.equal((await get("/catalogue", "autre.test")).status, 421);
  });

  test("catalogue filtré ou trié : non indexé (liens suivis) ; catalogue seul : indexable", async () => {
    assert.doesNotMatch((await prof.get("/catalogue")).text, /name="robots"/);
    for (const q of ["?q=excel", "?level=debutant", "?sort=price_asc"]) assert.match((await prof.get("/catalogue" + q)).text, /<meta name="robots" content="noindex, follow">/, q);
  });

  test("éditeur d'article : un titre de page <h1> (lecteurs d'écran)", async () => {
    const page = (await prof.get("/formateur/blog/nouveau")).text;
    assert.equal((page.match(/<h1\b/g) || []).length, 1);
    assert.match(page, /<h1 class="sr-only">Nouvel article<\/h1>/);
  });

  test("sélecteur d'image SEO : une valeur hostile est échappée dans l'aperçu", () => {
    const ejs = require("ejs");
    const html = ejs.render(fs.readFileSync(path.join(__dirname, "../views/seo/_image-select.ejs"), "utf8"), { id: "i", name: "n", value: '/x.png" onerror="alert(1)', media: [] });
    assert.doesNotMatch(html, /" onerror="/);
    assert.match(html, /src="\/x.png&#34; onerror=&#34;alert\(1\)"/);
  });

  test("S3 : politique de sécurité du contenu (plugins interdits, <base> et cadres étrangers bloqués)", async () => {
    const r = await prof.get("/catalogue");
    assert.equal(r.headers.get("content-security-policy"), "object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
    // Doublon dans la page : le CDN de l'hébergeur remplace l'en-tête HTTP
    assert.match(r.text, /<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'">/);
  });
});
