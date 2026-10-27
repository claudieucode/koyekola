// KOLAKISA — réglages propres à chaque bloc (parité Gutenberg) : style de liste, citation, pied de tableau, lightbox, aperçu PDF, couverture, média et texte,
// groupe Ligne/Pile/Grille, colonnes libres, espaceur libre. Règles du serveur + aller-retour dans un VRAI Chrome + page publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");

describe("réglages propres à chaque bloc — serveur", () => {
  test("style de liste : valeurs fermées, propres à chaque type de liste", () => {
    assert.match(sanitizeBlogHtml('<ol data-ltype="upper-roman"><li><p>a</p></li></ol>'), /<ol data-ltype="upper-roman">/);
    assert.doesNotMatch(sanitizeBlogHtml('<ol data-ltype="disc"><li><p>a</p></li></ol>'), /data-ltype/, "puce de liste à puces refusée sur une liste numérotée");
    assert.match(sanitizeBlogHtml('<ul data-ltype="square"><li><p>a</p></li></ul>'), /<ul data-ltype="square">/);
    assert.doesNotMatch(sanitizeBlogHtml('<ul data-ltype="url(x)"><li><p>a</p></li></ul>'), /data-ltype/);
  });
  test("citation : champ séparé, rendu en <cite>, texte nettoyé", () => {
    const html = renderBlogHtml('<blockquote data-cite="Victor Hugo&#10;&lt;b&gt;"><p>Q</p></blockquote>').html;
    assert.match(html, /<blockquote><p>Q<\/p><cite>Victor Hugo &lt;b&gt;<\/cite><\/blockquote>/);
  });
  test("tableau : le pied devient un <tfoot>, la disposition fixe est conservée", () => {
    const html = renderBlogHtml('<table data-footer="true" data-fixed="true"><tbody><tr><td><p>a</p></td></tr><tr><td><p>Total</p></td></tr></tbody></table>').html;
    assert.match(html, /<tbody><tr><td><p>a<\/p><\/td><\/tr><\/tbody><tfoot><tr><td><p>Total<\/p><\/td><\/tr><\/tfoot>/);
    assert.match(html, /data-fixed="true"/);
    assert.doesNotMatch(renderBlogHtml('<table data-footer="true"><tbody><tr><td><p>seule</p></td></tr></tbody></table>').html, /tfoot/, "une seule ligne : pas de pied");
  });
  test("image et galerie : agrandissement par un vrai bouton accessible, jamais sur une image avec lien", () => {
    const one = renderBlogHtml('<figure class="kb-image" data-lightbox="true"><img src="/uploads/thumbnails/a.png" alt="Chat"></figure>').html;
    assert.match(one, /<button type="button" class="kb-lightbox-trigger" aria-label="Agrandir l'image : Chat" aria-haspopup="dialog"><img /);
    const gal = renderBlogHtml('<div class="kb-gallery" data-columns="2" data-lightbox="true" data-natural="true"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="A"></figure><figure class="kb-image"><img src="/uploads/thumbnails/b.png" alt="B"></figure></div>').html;
    assert.equal((gal.match(/kb-lightbox-trigger/g) || []).length, 2);
    assert.match(sanitizeBlogHtml('<figure class="kb-image" data-fit="contain"><img src="/uploads/thumbnails/a.png" alt=""></figure>'), /data-fit="contain"/);
    assert.doesNotMatch(sanitizeBlogHtml('<figure class="kb-image" data-fit="evil"><img src="/uploads/thumbnails/a.png" alt=""></figure>'), /data-fit/);
  });
  test("audio et vidéo : boucle et préchargement limités à une liste", () => {
    const a = renderBlogHtml('<div class="kb-audio" data-src="/uploads/blog/a.mp3" data-loop="true" data-preload="auto"></div>').html;
    assert.match(a, /<audio [^>]*preload="auto"[^>]*loop/);
    assert.match(renderBlogHtml('<div class="kb-audio" data-src="/uploads/blog/a.mp3" data-preload="evil"></div>').html, /preload="none"/);
    assert.match(renderBlogHtml('<div class="kb-video" data-url="/uploads/blog/v.mp4" data-preload="none"></div>').html, /preload="none"/);
  });
  test("fichier : l'aperçu intégré n'existe que pour un PDF", () => {
    assert.match(renderBlogHtml('<div class="kb-file" data-url="/uploads/blog/a.pdf" data-preview="true"></div>').html, /<iframe class="kb-file-preview" src="\/uploads\/blog\/a\.pdf"/);
    assert.doesNotMatch(renderBlogHtml('<div class="kb-file" data-url="/uploads/blog/a.zip" data-preview="true"></div>').html, /iframe/);
  });
  test("couverture : point focal par pas de 5, teinte et position fermées", () => {
    const html = renderBlogHtml('<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-fx="25" data-fy="70" data-fixed="true" data-shade="navy" data-pos="bl"><p>t</p></div>').html;
    assert.match(html, /object-position: 25% 70%/); assert.match(html, /data-fixed="true"/); assert.match(html, /data-shade="navy"/); assert.match(html, /data-pos="bl"/);
    const bad = sanitizeBlogHtml('<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-fx="23" data-fy="900" data-shade="red" data-pos="zz"><p>t</p></div>');
    assert.doesNotMatch(bad, /data-fx|data-fy|data-shade|data-pos/);
  });
  test("média et texte, groupe, colonne, espaceur : valeurs fermées", () => {
    assert.match(sanitizeBlogHtml('<div class="kb-mediatext" data-width="66" data-valign="bottom" data-crop="true" data-stack="never"><p>x</p></div>'), /data-width="66" data-valign="bottom" data-crop="true" data-stack="never"/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-mediatext" data-width="12" data-valign="x"><p>x</p></div>'), /data-width|data-valign/);
    assert.match(sanitizeBlogHtml('<div class="kb-group" data-layout="grid" data-gridcols="3" data-justify="between" data-valign="top"><p>x</p></div>'), /data-layout="grid"[^>]*data-gridcols="3"/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-group" data-layout="flex;position:fixed" data-gridcols="9"><p>x</p></div>'), /data-layout|data-gridcols|position/);
    assert.match(sanitizeBlogHtml('<div class="kb-spacer" data-size="m" data-px="75"></div>'), /data-px="75"/);
    for (const bad of ["7", "500", "-5", "1e3", "10px"]) assert.doesNotMatch(sanitizeBlogHtml(`<div class="kb-spacer" data-size="m" data-px="${bad}"></div>`), /data-px/, bad);
  });
  test("colonnes libres : le serveur calcule la grille, les colonnes sans largeur se partagent le reste", () => {
    const html = renderBlogHtml('<div class="kb-columns" data-layout="custom"><div class="kb-column" data-basis="20"><p>a</p></div><div class="kb-column"><p>b</p></div><div class="kb-column"><p>c</p></div></div>').html;
    assert.match(html, /--kb-cols: 20fr 40fr 40fr/);
    assert.doesNotMatch(html, /data-basis/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-columns" data-layout="custom"><div class="kb-column" data-basis="99"><p>a</p></div><div class="kb-column"><p>b</p></div></div>'), /data-basis/);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("réglages propres à chaque bloc — éditeur et site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const json = (r) => JSON.parse(r.text);
  const newPage = async (url) => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(url);
    return page;
  };
  const open = async () => { const page = await newPage(`${srv.base}/formateur/blog/nouveau`); await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor); return page; };
  const roundTrip = (page, html) => page.evaluate((h) => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent(h); return ed.getHTML(); }, html);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("chaque réglage survit à l'aller-retour éditeur → HTML enregistré (aucune perte silencieuse)", async () => {
    const page = await open();
    const cases = [
      ['<ol data-ltype="lower-roman"><li><p>a</p></li></ol>', /data-ltype="lower-roman"/],
      ['<ul data-ltype="square"><li><p>a</p></li></ul>', /data-ltype="square"/],
      ['<blockquote data-cite="Victor Hugo"><p>q</p></blockquote>', /data-cite="Victor Hugo"/],
      ['<table data-footer="true" data-fixed="true"><tbody><tr><td><p>a</p></td></tr><tr><td><p>t</p></td></tr></tbody></table>', /data-footer="true"[^>]*data-fixed="true"|data-fixed="true"[^>]*data-footer="true"/],
      ['<figure class="kb-image" data-lightbox="true" data-fit="contain"><img src="/uploads/thumbnails/a.png" alt="x"></figure>', /data-lightbox="true"/],
      ['<div class="kb-gallery" data-columns="2" data-natural="true" data-lightbox="true"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure></div>', /data-natural="true"[^>]*data-lightbox="true"|data-lightbox="true"[^>]*data-natural="true"/],
      ['<div class="kb-audio" data-src="/uploads/blog/a.mp3" data-loop="true" data-preload="metadata"></div>', /data-loop="true"[^>]*data-preload="metadata"|data-preload="metadata"[^>]*data-loop="true"/],
      ['<div class="kb-file" data-url="/uploads/blog/a.pdf" data-preview="true"></div>', /data-preview="true"/],
      ['<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-overlay="40" data-height="m" data-fx="25" data-fy="70" data-fixed="true" data-shade="navy" data-pos="bl"><p>t</p></div>', /data-fx="25"[^>]*data-fy="70"[^>]*data-fixed="true"[^>]*data-shade="navy"[^>]*data-pos="bl"/],
      ['<div class="kb-mediatext" data-side="left" data-width="66" data-valign="bottom" data-crop="true"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure><div class="kb-mediatext-body"><p>t</p></div></div>', /data-width="66"[^>]*data-valign="bottom"[^>]*data-crop="true"/],
      ['<div class="kb-group" data-bg="none" data-pad="m" data-layout="grid" data-gridcols="3"><p>a</p><p>b</p></div>', /data-layout="grid"[^>]*data-gridcols="3"/],
      ['<div class="kb-columns" data-layout="custom"><div class="kb-column" data-basis="30" data-valign="center"><p>a</p></div><div class="kb-column"><p>b</p></div></div>', /data-basis="30"[^>]*data-valign="center"/],
      ['<div class="kb-spacer" data-size="m" data-px="75"></div>', /data-px="75"/],
    ];
    for (const [html, re] of cases) {
      const out = await roundTrip(page, html);
      assert.match(out, re, `perdu à l'aller-retour : ${html.slice(0, 60)} → ${out}`);
    }
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("l'éditeur affiche réellement les réglages (liste en chiffres romains, colonnes libres, espaceur à 75 px, groupe en grille)", async () => {
    const page = await open();
    await roundTrip(page, '<ol data-ltype="upper-roman"><li><p>a</p></li></ol><div class="kb-spacer" data-size="m" data-px="75"></div><div class="kb-columns" data-layout="custom"><div class="kb-column" data-basis="25"><p>a</p></div><div class="kb-column"><p>b</p></div></div><div class="kb-group" data-bg="none" data-pad="m" data-layout="grid" data-gridcols="2"><p>a</p><p>b</p><p>c</p></div>');
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(`.ProseMirror ${s}`);
      const cols = getComputedStyle(q(".kb-ed-columns")).gridTemplateColumns.split(" ").map((x) => parseFloat(x));
      return { list: getComputedStyle(q("ol")).listStyleType, spacer: getComputedStyle(q(".kb-ed-spacer")).height, ratio: cols[0] / cols[1], group: getComputedStyle(q(".kb-ed-group")).display, gcols: getComputedStyle(q(".kb-ed-group")).gridTemplateColumns.split(" ").length };
    });
    assert.equal(r.list, "upper-roman"); assert.equal(r.spacer, "75px"); assert.equal(r.group, "grid"); assert.equal(r.gcols, 2);
    assert.ok(Math.abs(r.ratio - 25 / 75) < 0.02, `colonnes 25/75 attendu, obtenu ${r.ratio}`);
    await page.context().close();
  });

  test("panneau Bloc : on règle le style de liste, la citation et le pied de tableau à la souris", async () => {
    const page = await open();
    await roundTrip(page, '<ol><li><p>a</p></li></ol><blockquote><p>Citation</p></blockquote><table><tbody><tr><td><p>1</p></td></tr><tr><td><p>2</p></td></tr></tbody></table>');
    const selectBlock = async (i) => { await page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = 0; let n = 0; ed.state.doc.forEach((_, pos) => { if (n++ === k) at = pos; }); ed.commands.setTextSelection(at + 2); ed.view.focus(); }, i); await page.mouse.move(1300, 500 + i); };
    await page.click('[data-sidebar-tab="bloc"]');
    await selectBlock(0);
    await page.getByLabel("Style de numérotation").selectOption("lower-alpha");
    await selectBlock(1);
    await page.getByLabel("Citation (auteur, source)").fill("Victor Hugo");
    await page.waitForTimeout(450);
    await selectBlock(2);
    await page.getByLabel("Dernière ligne = pied de tableau (totaux)").check();
    const out = await page.evaluate(() => document.querySelector(".ProseMirror").editor.getHTML());
    assert.match(out, /<ol[^>]*data-ltype="lower-alpha"/); assert.match(out, /data-cite="Victor Hugo"/); assert.match(out, /data-footer="true"/);
    await page.context().close();
  });

  test("site public : l'image s'agrandit (boîte de dialogue), Échap la ferme et le focus revient au bouton ; la galerie se parcourt aux flèches", async () => {
    const fd = new FormData();
    const content = '<figure class="kb-image" data-lightbox="true"><img src="/uploads/thumbnails/a.png" alt="Premier"><figcaption>Légende un</figcaption></figure><div class="kb-gallery" data-columns="2" data-lightbox="true"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="G1"></figure><figure class="kb-image"><img src="/uploads/thumbnails/b.png" alt="G2"></figure></div>';
    for (const [k, v] of Object.entries({ content_format: "html", title: "Article lightbox", content, status: "published" })) fd.append(k, v);
    const saved = json(await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }));
    const page = await newPage(`${srv.base}/blog/${saved.slug}`);
    const triggers = page.locator(".article-content .kb-lightbox-trigger");
    assert.equal(await triggers.count(), 3);
    await triggers.first().click();
    const dialog = page.getByRole("dialog", { name: "Image agrandie" });
    await dialog.waitFor();
    assert.match(await dialog.locator("figcaption").innerText(), /Légende un/);
    assert.equal(await dialog.locator(".kb-lightbox-nav").first().isHidden(), true, "image seule : pas de flèches");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => document.activeElement.className), "kb-lightbox-trigger", "le focus revient au bouton");
    await triggers.nth(1).click();
    await dialog.waitFor();
    assert.equal(await dialog.locator("img").getAttribute("alt"), "G1");
    await page.keyboard.press("ArrowRight");
    assert.equal(await dialog.locator("img").getAttribute("alt"), "G2");
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    await page.context().close();
  });
});
