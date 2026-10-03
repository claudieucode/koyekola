// KOLAKISA SEO CORE — lot 2 : redirections, journal 404, robots.txt, plan du site. Vérifié sur les vraies réponses HTTP.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, createCourse } = require("./helpers");

describe("SEO technique : redirections, 404, robots.txt, sitemap", () => {
  let srv, prof, course;
  const anon = () => new Client(srv.base);
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const addRedirect = (source, target, status = "301") => prof.post("/formateur/seo/redirections", { source, target, status });
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
    run("INSERT INTO posts (slug, title, content, content_format, published, published_at, status, category, tags) VALUES ('guide', 'Guide', '<p>x</p>', 'html', 1, datetime('now'), 'published', 'Bureautique', 'excel')");
  });
  after(() => srv.stop());

  test("redirection 301 : exécutée par le serveur, paramètres conservés, utilisations comptées, journalisée", async () => {
    assert.equal((await addRedirect("/ancien-guide/", "/blog/guide")).status, 302);
    const r = await anon().get("/ancien-guide?utm=x");
    assert.equal(r.status, 301);
    assert.equal(r.location, "/blog/guide?utm=x");
    assert.equal(q("SELECT hits FROM seo_redirects WHERE source_path = '/ancien-guide'")[0].hits, 1);
    assert.equal(q("SELECT COUNT(*) n FROM seo_changes WHERE entity_type = 'redirect'")[0].n, 1);
    assert.match((await prof.get("/formateur/seo/redirections")).text, /\/ancien-guide/);
  });

  test("302 temporaire, vers une adresse externe ; désactivée = plus de redirection ; suppression", async () => {
    await addRedirect("/promo", "https://exemple.org/offre", "302");
    const r = await anon().get("/promo");
    assert.deepEqual([r.status, r.location], [302, "https://exemple.org/offre"]);
    const id = q("SELECT id FROM seo_redirects WHERE source_path = '/promo'")[0].id;
    await prof.post(`/formateur/seo/redirections/${id}`, { source: "/promo", target: "https://exemple.org/offre", status: "302", enabled: "0" });
    assert.equal((await anon().get("/promo")).status, 404);
    await prof.post(`/formateur/seo/redirections/${id}/supprimer`, {});
    assert.equal(q("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/promo'")[0].n, 0);
  });

  test("refusées : espace privé, accueil, identique, doublon, boucle, destination invalide", async () => {
    for (const [source, target, re] of [["/formateur/blog", "/blog", /espace technique ou privé/], ["/connexion", "/", /espace technique ou privé/], ["/", "/blog", /accueil ne peut pas/], ["/x", "/x", /identiques/], ["/ancien-guide", "/autre", /existe déjà/], ["/a", "javascript:alert(1)", /Destination invalide/]]) {
      const r = await addRedirect(source, target);
      assert.equal(r.status, 400, source);
      assert.match(r.text, re, source);
    }
    await addRedirect("/boucle-a", "/boucle-b");
    const loop = await addRedirect("/boucle-b", "/boucle-a");
    assert.equal(loop.status, 400);
    assert.match(loop.text, /Boucle de redirection : \/boucle-b → \/boucle-a → \/boucle-b/);
  });

  test("chaîne A → B → C détectée puis raccourcie en A → C (y compris via un changement d'adresse de formation)", async () => {
    await addRedirect("/etape-1", "/etape-2");
    await addRedirect("/etape-2", "/blog/guide");
    assert.match((await prof.get("/formateur/seo/redirections")).text, /\/etape-1 → \/etape-2 → \/blog\/guide/);
    const id = q("SELECT id FROM seo_redirects WHERE source_path = '/etape-1'")[0].id;
    await prof.post(`/formateur/seo/redirections/${id}/raccourcir`, {});
    assert.equal(q("SELECT target FROM seo_redirects WHERE id = ?", id)[0].target, "/blog/guide");
    // changement d'adresse d'une formation (historique existant) suivi d'une redirection manuelle : chaîne vue
    run("INSERT INTO course_slug_history (old_slug, course_id) VALUES ('excel-ancien', ?)", course.id);
    await addRedirect(`/cours/${course.slug}`, "/catalogue");
    assert.match((await prof.get("/formateur/seo/redirections")).text, new RegExp(`/cours/excel-ancien → /cours/${course.slug} → /catalogue`));
    run("DELETE FROM seo_redirects WHERE source_path = ?", `/cours/${course.slug}`);
    run("DELETE FROM course_slug_history WHERE old_slug = 'excel-ancien'");
    await addRedirect("/rafraichir-cache", "/blog"); // une modification par l'administration recharge les redirections du serveur
  });

  test("import CSV (avec erreurs ligne par ligne) et export CSV", async () => {
    const r = await prof.post("/formateur/seo/redirections/import", { csv: "source,destination,type\n/import-1,/blog,301\n/import-2;/faq;302\n/formateur,/blog,301" });
    assert.match(r.text, /2 redirection\(s\) importée\(s\)/);
    assert.match(r.text, /Ligne 3 \(\/formateur\)/);
    assert.equal((await anon().get("/import-2")).status, 302);
    const csv = await prof.get("/formateur/seo/redirections.csv");
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.text, /\/import-1,\/blog,301/);
  });

  test("journal 404 : personnes et robots distingués, bruit ignoré, action Ignorer, redirection qui résout l'erreur", async () => {
    const human = new Client(srv.base);
    await human.request("/page-perdue", { headers: { "User-Agent": "Mozilla/5.0 (Macintosh)", Referer: "https://exemple.org/lien" } });
    await human.request("/page-perdue", { headers: { "User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" } });
    await human.request("/wp-login.php", { headers: { "User-Agent": "Mozilla/5.0" } });
    await new Promise((r) => setTimeout(r, 50));
    const row = q("SELECT * FROM seo_404 WHERE path = '/page-perdue'")[0];
    assert.deepEqual([row.hits_human, row.hits_bot, row.last_referrer], [1, 1, "https://exemple.org/lien"]);
    assert.equal(q("SELECT COUNT(*) n FROM seo_404 WHERE path = '/wp-login.php'")[0].n, 0, "bruit des robots non journalisé");
    const page = (await prof.get("/formateur/seo/erreurs-404")).text;
    assert.match(page, /\/page-perdue/);
    assert.match(page, /href="\/formateur\/seo\/redirections\?source=%2Fpage-perdue"/);
    await prof.post("/formateur/seo/erreurs-404/action", { path: "/page-perdue", action: "ignorer" });
    assert.doesNotMatch((await prof.get("/formateur/seo/erreurs-404")).text, /<code>\/page-perdue<\/code>/);
    assert.match((await prof.get("/formateur/seo/erreurs-404?filtre=ignored")).text, /\/page-perdue/);
    await addRedirect("/page-perdue", "/blog");
    assert.equal(q("SELECT COUNT(*) n FROM seo_404 WHERE path = '/page-perdue'")[0].n, 0, "résolue par la redirection");
  });

  test("robots.txt : règles supplémentaires publiées, règles invalides refusées, conflit avec le plan du site détecté", async () => {
    const bad = await prof.post("/formateur/seo/reglages", { robots_custom: "Disallow: /x\nNimporte: quoi" });
    assert.equal(bad.status, 400);
    assert.match(bad.text, /doit suivre une ligne User-agent/);
    await prof.post("/formateur/seo/reglages", { robots_custom: "User-agent: GPTBot\nDisallow: /" });
    const txt = (await anon().get("/robots.txt")).text;
    assert.match(txt, /User-agent: GPTBot\nDisallow: \//);
    assert.match(txt, /Disallow: \/formateur/);
    assert.match(txt, /Sitemap: https:\/\/kolakisa\.test\/sitemap\.xml/);
    assert.match((await prof.get("/formateur/seo/technique")).text, /Aucun conflit/);
    await prof.post("/formateur/seo/reglages", { robots_custom: "User-agent: *\nDisallow: /blog" });
    const tech = (await prof.get("/formateur/seo/technique")).text;
    assert.match(tech, /Conflit : \d+ adresse\(s\) du plan du site interdite\(s\) à Google/);
    assert.match(tech, /<li>\/blog\/guide<\/li>/);
    await prof.post("/formateur/seo/reglages", { robots_custom: "" });
  });

  test("sitemap : contenus indexables seulement ; exclusions expliquées ; images réelles ; étiquettes sur réglage", async () => {
    let xml = (await anon().get("/sitemap.xml")).text;
    assert.match(xml, new RegExp(`/cours/${course.slug}<`));
    assert.doesNotMatch(xml, /\/blog\/etiquette\//);
    // formation en noindex : retirée du plan du site, raison visible
    await prof.post(`/formateur/seo/contenus/course/${course.id}`, { robots_index: "0" });
    xml = (await anon().get("/sitemap.xml")).text;
    assert.doesNotMatch(xml, new RegExp(`/cours/${course.slug}<`));
    assert.match((await prof.get("/formateur/seo/technique")).text, /Réglée en noindex/);
    await prof.post(`/formateur/seo/contenus/course/${course.id}`, { robots_index: "" });
    // étiquettes indexées sur décision de l'administrateur
    await prof.post("/formateur/seo/reglages", { index_blog_tags: "1" });
    assert.match((await anon().get("/sitemap.xml")).text, /\/blog\/etiquette\/excel</);
    await prof.post("/formateur/seo/reglages", { index_blog_tags: "0" });
    // adresse redirigée : exclue
    await addRedirect("/blog/categorie/bureautique", "/blog");
    assert.doesNotMatch((await anon().get("/sitemap.xml")).text, /\/blog\/categorie\/bureautique</);
    // image de formation : seulement si le fichier existe
    run("UPDATE courses SET thumbnail_path = '/uploads/thumbnails/absente.png' WHERE id = ?", course.id);
    assert.doesNotMatch((await anon().get("/sitemap.xml")).text, /absente\.png/);
  });
});
