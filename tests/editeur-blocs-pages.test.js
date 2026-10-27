// KOLAKISA — éditeur de blocs pour une page du site (« À propos ») : la page n'est pas un article (jamais listée, publiée, exportée), son contenu en blocs s'affiche
// avec la mise en page de la page, les versions se restaurent, le retour au texte simple est possible, seul le compte créateur y accède.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("page « À propos » avec l'éditeur de blocs", () => {
  let srv, boss, db, post, student;
  const json = (r) => JSON.parse(r.text);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const get = async (path) => { const r = await fetch(`${srv.base}${path}`, { redirect: "manual" }); return { status: r.status, text: await r.text() }; };
  const form = (fields) => { const fd = new FormData(); Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); return fd; };
  const save = (id, title, content, extra = {}) => boss.request(`/formateur/blog/${id}/modifier`, { method: "POST", multipart: form({ title, content, content_format: "html", rev: "", ...extra }), headers: { "x-blog-editor": "1" } });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    student = await newStudent(srv);
  });
  after(() => srv.stop());

  test("tant que l'éditeur de blocs n'est pas utilisé, la page publique est celle d'avant (texte Markdown)", async () => {
    const before = await get("/a-propos");
    assert.equal(before.status, 200);
    assert.match(before.text, /Comment se déroule une formation/);
    assert.doesNotMatch(before.text, /article-content/);
  });

  test("ouvrir l'éditeur de blocs crée la ligne support (hors ligne, « dans la corbeille », contenu = texte actuel converti) et redirige vers l'éditeur", async () => {
    const r = await boss.request("/formateur/pages/a-propos/blocs", { redirect: "manual" });
    assert.equal(r.status, 302);
    post = one("SELECT * FROM posts WHERE page_key = 'a-propos'");
    assert.ok(post);
    assert.equal(r.headers.get("location"), `/formateur/blog/${post.id}/modifier`);
    assert.deepEqual([post.published, post.status, post.content_format, post.deleted_from_status], [0, "draft", "html", "page"]);
    assert.ok(post.deleted_at, "marquée « corbeille » : exclue de toutes les listes d'articles");
    assert.match(post.content, /<h2>Comment se déroule une formation<\/h2>/);
    // un second passage ne crée pas de doublon
    await boss.request("/formateur/pages/a-propos/blocs", { redirect: "manual" });
    assert.equal(one("SELECT COUNT(*) n FROM posts WHERE page_key = 'a-propos'").n, 1);
  });

  test("l'éditeur s'ouvre en « mode page » : pas de bouton Publier, pas de réglages d'article ; l'aperçu est la page avec sa mise en page", async () => {
    const page = (await boss.get(`/formateur/blog/${post.id}/modifier`)).text;
    assert.match(page, /data-page-mode="a-propos"/);
    assert.match(page, /Page du site : « À propos »/);
    assert.match(page, /"pageKey":"a-propos"/);
    const prev = (await boss.get(`/formateur/blog/${post.id}/apercu`)).text;
    assert.match(prev, /class="container-wide about"/);
    assert.match(prev, /Comment se déroule une formation/);
  });

  test("enregistrer publie tout de suite : titre, introduction, sections et blocs s'affichent avec la mise en page de la page", async () => {
    const content = '<p>Notre introduction.</p><h2>Notre mission</h2><div class="kb-columns" data-layout="50-50"><div class="kb-column"><p>Colonne un</p></div><div class="kb-column"><p>Colonne deux</p></div></div><p class="kb-button" data-align="center"><a href="/catalogue" class="btn btn-primary">Voir le catalogue</a></p><h2>Nos valeurs</h2><ul><li><p>Clarté</p></li></ul><div class="kb-latest" data-count="3"></div>';
    const r = await save(post.id, "Qui sommes-nous ?", content, { seo_description: "Notre histoire en bref." });
    assert.equal(r.status, 200, r.text);
    const j = json(r);
    assert.deepEqual([j.status, j.published, j.pageKey], ["draft", 0, "a-propos"]);
    const html = (await get("/a-propos")).text;
    assert.match(html, /<h1>Qui sommes-nous \?<\/h1>/);
    assert.match(html, /about-lead markdown article-content"><p>Notre introduction\.<\/p>/);
    assert.match(html, /<h2 id="ap-notre-mission">Notre mission<\/h2>/);
    assert.match(html, /<div class="kb-columns" data-layout="50-50">/);
    assert.match(html, /<h2 id="ap-nos-valeurs">Nos valeurs<\/h2>/);
    assert.match(html, /name="description" content="Notre histoire en bref\."/);
    assert.doesNotMatch(html, /Comment se déroule une formation/, "le texte Markdown n'est plus utilisé");
    assert.equal(one("SELECT published FROM posts WHERE id = ?", post.id).published, 0, "la ligne support n'est jamais publiée");
  });

  test("la page n'est JAMAIS un article : absente du blog, des flux, du plan du site, de toutes les listes ; aucune action d'article ne l'atteint", async () => {
    const title = "Qui sommes-nous ?";
    for (const p of ["/blog", "/blog?q=Notre+mission", "/blog/feed.xml", "/sitemap.xml", "/blog/page-a-propos", "/blog/auteur/1"]) {
      const r = await get(p);
      assert.doesNotMatch(r.text, /page-a-propos/, p);
      if (!/sitemap|feed/.test(p)) assert.doesNotMatch(r.text, /Qui sommes-nous \?/, p);
    }
    assert.equal((await get("/blog/page-a-propos")).status, 404);
    for (const etat of ["toutes", "brouillons", "publies", "programmes", "corbeille"]) {
      const list = (await boss.get(`/formateur/blog?etat=${etat}`)).text;
      assert.doesNotMatch(list, new RegExp(title.replace("?", "\\?")), `liste ${etat}`);
    }
    // aucune action d'article (publier, corbeille, copie, suppression définitive) ne l'atteint
    for (const action of ["publier", "depublier", "supprimer", "restaurer", "dupliquer", "supprimer-definitivement"]) await boss.request(`/formateur/blog/${post.id}/${action}`, { method: "POST" });
    const row = one("SELECT * FROM posts WHERE id = ?", post.id);
    assert.ok(row, "toujours là");
    assert.deepEqual([row.published, row.status, row.page_key], [0, "draft", "a-propos"]);
    assert.equal(one("SELECT COUNT(*) n FROM posts WHERE title LIKE '%(copie)%'").n, 0);
    const links = JSON.parse((await boss.get("/formateur/blog/api/liens?q=Qui+sommes")).text);
    assert.ok(!JSON.stringify(links).includes("page-a-propos") && !JSON.stringify(links).includes("Qui sommes-nous"), "la page n'est pas proposée comme article à lier");
    const bulk = await boss.request("/formateur/blog/actions", { method: "POST", json: { action: "publier", ids: [post.id] } });
    assert.ok(bulk.status < 500);
    assert.equal(one("SELECT published FROM posts WHERE id = ?", post.id).published, 0);
  });

  test("seul le compte créateur y accède : un élève est refusé, partout", async () => {
    for (const path of [`/formateur/blog/${post.id}/modifier`, `/formateur/blog/${post.id}/apercu`, "/formateur/pages/a-propos/blocs", "/formateur/pages/a-propos"]) {
      const r = await student.request(path, { redirect: "manual" });
      assert.notEqual(r.status, 200, path);
    }
    const w = await student.request(`/formateur/blog/${post.id}/modifier`, { method: "POST", multipart: form({ title: "Pirate", content: "<p>x</p>", content_format: "html" }), headers: { "x-blog-editor": "1" } });
    assert.notEqual(w.status, 200);
    assert.notEqual(one("SELECT title FROM posts WHERE id = ?", post.id).title, "Pirate");
  });

  test("restaurer une version de la page la republie aussitôt (versions et restauration comme pour un article)", async () => {
    await save(post.id, "Titre deux", "<p>Deuxième version</p><h2>Autre section</h2><p>x</p>");
    assert.match((await get("/a-propos")).text, /Deuxième version/);
    const rev = one("SELECT id FROM post_revisions WHERE post_id = ? AND title = 'Qui sommes-nous ?' ORDER BY id DESC", post.id).id;
    const rr = await boss.request(`/formateur/blog/${post.id}/versions/${rev}/restaurer`, { method: "POST", json: {}, headers: { "x-blog-editor": "1" } });
    assert.equal(rr.status, 200, rr.text);
    const html = (await get("/a-propos")).text;
    assert.match(html, /Notre introduction/); assert.doesNotMatch(html, /Deuxième version/);
    assert.equal(one("SELECT published FROM posts WHERE id = ?", post.id).published, 0);
  });

  test("« Revenir au texte simple » réaffiche le texte Markdown ; le contenu en blocs et son historique sont conservés", async () => {
    const r = await boss.request("/formateur/pages/a-propos/texte-simple", { method: "POST", redirect: "manual" });
    assert.equal(r.status, 302);
    const html = (await get("/a-propos")).text;
    assert.match(html, /Comment se déroule une formation/);
    assert.doesNotMatch(html, /Notre introduction/);
    assert.ok(one("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?", post.id).n >= 2, "l'historique est conservé");
    // republier depuis l'éditeur remet les blocs en ligne
    await save(post.id, "Qui sommes-nous ?", "<p>De retour en blocs.</p><h2>Section</h2><p>y</p>");
    assert.match((await get("/a-propos")).text, /De retour en blocs/);
  });

  test("le script d'un bloc « HTML personnalisé » n'est conservé que pour le compte créateur, et la page n'affiche pas de code d'un autre", async () => {
    const customHtml = require("../src/utils/customHtml");
    process.env.ENCRYPTION_KEY = TEST_KEY;
    const code = customHtml.encode("<p id=\"widget-page\">Widget</p>");
    await save(post.id, "Page avec code", `<p>Intro</p><div class="kb-html" data-code="${code}"></div><h2>S</h2><p>z</p>`);
    assert.match((await get("/a-propos")).text, /<p id="widget-page">Widget<\/p>/);
    db.prepare("UPDATE site_pages SET content_html = ? WHERE slug = 'a-propos'").run(`<p>Intro</p><div class="kb-html" data-code="${customHtml.encode("<script>pirate()</script>")}" data-sig="faux"></div>`);
    assert.doesNotMatch((await get("/a-propos")).text, /pirate/);
  });
});

const fs = require("node:fs");
let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("page « À propos » — éditeur de blocs dans Chrome", { skip: SKIP }, () => {
  let srv, boss, browser;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("depuis la page de réglages : « Passer à l'éditeur de blocs », modification, enregistrement, la page publique suit ; pas de bouton Publier", async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/formateur/pages/a-propos`);
    await page.getByRole("link", { name: "Passer à l'éditeur de blocs" }).click();
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    assert.equal(await page.locator('[data-publish]').isVisible(), false, "pas de bouton Publier pour une page");
    assert.match(await page.locator(".wp-page-card").innerText(), /n'est pas un article/);
    await page.fill("#post-title", "À propos de nous");
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.setContent('<p>Texte d\'ouverture écrit dans l\'éditeur.</p><h2>Notre équipe</h2><div class="kb-group" data-bg="light" data-pad="m"><p>Un groupe dans la page</p></div><div class="kb-latest" data-count="2"></div>'));
    await page.locator("[data-save]").click();
    await page.waitForFunction(() => /Enregistré/.test(document.querySelector("[data-save-state]").textContent));
    const html = await (await fetch(`${srv.base}/a-propos`)).text();
    assert.match(html, /<h1>À propos de nous<\/h1>/);
    assert.match(html, /Texte d'ouverture écrit dans l'éditeur\./);
    assert.match(html, /<h2 id="ap-notre-equipe">Notre équipe<\/h2>/);
    assert.match(html, /<div class="kb-group" data-bg="light" data-pad="m"><p>Un groupe dans la page<\/p><\/div>/);
    // la page des réglages signale que l'éditeur de blocs est utilisé
    await page.goto(`${srv.base}/formateur/pages/a-propos`);
    assert.match(await page.locator(".page-blocks-card").innerText(), /écrite avec l'éditeur de blocs/);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
