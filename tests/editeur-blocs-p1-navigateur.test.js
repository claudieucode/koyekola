// KOLAKISA — éditeur d'articles (parité Gutenberg) : commandes de bloc dans un VRAI Chrome — grouper / dégrouper, transformer, copier-coller les styles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("éditeur d'articles — commandes de bloc (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForSelector(".ProseMirror");
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  // Contenu de départ + sélection : positions des blocs de premier niveau
  const load = (page, html) => page.evaluate((h) => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent(h); return true; }, html);
  const tops = (page) => page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const out = []; ed.state.doc.forEach((n, pos) => out.push({ type: n.type.name, pos, size: n.nodeSize, text: n.textContent, attrs: n.attrs })); return out; });
  const selectText = (page, fromBlock, toBlock) => page.evaluate(([a, b]) => {
    const ed = document.querySelector(".ProseMirror").editor; const nodes = []; ed.state.doc.forEach((n, pos) => nodes.push({ n, pos }));
    ed.commands.setTextSelection({ from: nodes[a].pos + 1, to: nodes[b].pos + nodes[b].n.nodeSize - 1 }); ed.view.focus(); return true;
  }, [fromBlock, toBlock]);
  const selectNode = (page, index) => page.evaluate((i) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1; let k = 0; ed.state.doc.forEach((n, pos) => { if (k++ === i) at = pos; }); ed.commands.setNodeSelection(at); ed.view.focus(); return at; }, index);
  const menu = async (page, label) => {
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: label }).first().click();
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("grouper deux blocs puis dégrouper : le contenu est conservé et « Annuler » défait l'opération", async () => {
    const page = await open();
    await load(page, "<p>Un</p><p>Deux</p><p>Trois</p>");
    await selectText(page, 0, 1);
    await menu(page, /Grouper ces 2 blocs/);
    let t = await tops(page);
    assert.deepEqual(t.map((x) => x.type), ["kbGroup", "paragraph"]);
    assert.match(t[0].text, /UnDeux/);
    await selectNode(page, 0);
    await menu(page, "Dégrouper");
    t = await tops(page);
    assert.deepEqual(t.map((x) => `${x.type}:${x.text}`), ["paragraph:Un", "paragraph:Deux", "paragraph:Trois"]);
    await page.keyboard.press("ControlOrMeta+z");
    assert.equal((await tops(page))[0].type, "kbGroup", "Annuler rétablit le groupe");
    await page.context().close();
  });

  test("un bloc verrouillé ne se groupe pas : message clair, rien ne bouge", async () => {
    const page = await open();
    await load(page, '<p data-locked="true">Verrouillé</p><p>Libre</p>');
    await selectText(page, 0, 1);
    const hasGroup = await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; return ed.state.doc.firstChild.attrs.locked; });
    assert.equal(hasGroup, true);
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    assert.equal(await page.getByRole("menuitem", { name: /Grouper/ }).count(), 0, "l'entrée « Grouper » n'est pas proposée");
    assert.deepEqual((await tops(page)).map((x) => x.type), ["paragraph", "paragraph"]);
    await page.context().close();
  });

  test("transformer un paragraphe en encadré, puis l'encadré en groupe", async () => {
    const page = await open();
    await load(page, "<p>Conseil du jour</p>");
    await selectNode(page, 0).catch(() => {});
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await menu(page, /Transformer en/);
    await page.getByRole("menuitem", { name: "Encadré Conseil" }).click();
    let t = await tops(page);
    assert.equal(t[0].type, "callout");
    assert.equal(t[0].attrs.type, "conseil");
    assert.equal(t[0].text, "Conseil du jour");
    await selectNode(page, 0);
    await menu(page, /Transformer en/);
    await page.getByRole("menuitem", { name: /^Groupe$/ }).click();
    t = await tops(page);
    assert.equal(t[0].type, "kbGroup");
    assert.equal(t[0].text, "Conseil du jour");
    await page.context().close();
  });

  test("copier les styles d'un groupe et les coller sur un autre", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="dark" data-pad="l" data-border="true"><p>A</p></div><div class="kb-group" data-bg="none" data-pad="s"><p>B</p></div>');
    await selectNode(page, 0);
    await menu(page, "Copier les styles");
    await selectNode(page, 1);
    await menu(page, "Coller les styles");
    const t = await tops(page);
    assert.deepEqual([t[1].attrs.bg, t[1].attrs.pad, t[1].attrs.border], ["dark", "l", "true"]);
    assert.equal(t[1].text, "B", "le contenu n'est pas copié, seulement la présentation");
    await page.context().close();
  });

  test("ancre HTML et classes supplémentaires : saisies dans le panneau Bloc, enregistrées, publiées", async () => {
    const page = await open();
    await page.fill("#post-title", "Article avec ancre");
    await load(page, "<p>Premier</p><p>Second</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.click('[data-sidebar-tab="bloc"]');
    await page.click('[data-panel-advanced] button[aria-controls="be-adv-body"]');
    await page.mouse.move(1300, 500); // la saisie masque les panneaux tant que la souris ne bouge pas
    await page.fill("#be-anchor", "Tarifs 2026");
    await page.press("#be-anchor", "Tab");
    await page.fill("#be-xclass", "bandeau promo");
    await page.press("#be-xclass", "Tab");
    const t = await tops(page);
    assert.equal(t[0].attrs.anchor, "tarifs-2026");
    assert.equal(t[0].attrs.xclass, "kb-x-bandeau kb-x-promo");
    // L'ancre est unique : le second bloc ne peut pas la reprendre
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let p2 = 0; ed.state.doc.forEach((n, pos) => { if (pos > 0 && !p2) p2 = pos; }); ed.commands.setTextSelection(p2 + 1); ed.view.focus(); });
    await page.fill("#be-anchor", "tarifs-2026");
    await page.press("#be-anchor", "Tab");
    assert.match(await page.locator("#be-anchor-note").innerText(), /déjà utilisée/);
    assert.equal((await tops(page))[1].attrs.anchor, null);
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 15000 });
    const row = srv.db().prepare("SELECT content, slug FROM posts WHERE title = ?").get("Article avec ancre");
    assert.match(row.content, /<p [^>]*id="tarifs-2026"[^>]*data-class="kb-x-bandeau kb-x-promo"|<p [^>]*data-class="kb-x-bandeau kb-x-promo"[^>]*id="tarifs-2026"/);
    await page.context().close();
  });

  test("nouveaux blocs : l'éditeur et le serveur parlent le même HTML (aller-retour sans perte)", async () => {
    const samples = [
      ["Préformaté", '<pre class="kb-preformatted">ligne 1\n  ligne 2</pre>', /<pre class="kb-preformatted"[^>]*>ligne 1\n {2}ligne 2<\/pre>/],
      ["Vers", '<pre class="kb-verse">vers 1\nvers 2</pre>', /<pre class="kb-verse"[^>]*>vers 1\nvers 2<\/pre>/],
      ["Lire la suite", '<div class="kb-more" data-label="Suite"></div>', /<div class="kb-more"[^>]*data-label="Suite"/],
      ["Fichier", '<div class="kb-file" data-url="/uploads/blog/1-0123456789abcdef.pdf" data-title="Guide" data-download="true"></div>', /<div class="kb-file"[^>]*data-url="\/uploads\/blog\/1-0123456789abcdef\.pdf"/],
      ["Couverture", '<div class="kb-cover" data-src="/uploads/thumbnails/a.png" data-overlay="60" data-height="l" data-alt="Fond"><h2>Titre</h2></div>', /<div class="kb-cover"[^>]*data-overlay="60"[^>]*><h2[^>]*>Titre<\/h2><\/div>/],
      ["Média et texte", '<div class="kb-mediatext" data-side="right" data-width="33"><figure class="kb-image" data-align="center"><img src="/uploads/thumbnails/a.png" alt="x"></figure><div class="kb-mediatext-body"><p>Texte</p></div></div>', /<div class="kb-mediatext"[^>]*data-side="right"[^>]*><figure[^>]*><img[^>]*><\/figure><div class="kb-mediatext-body"><p>Texte<\/p><\/div><\/div>/],
      ["Tableau légendé", '<table data-caption="Tarifs"><tbody><tr><td><p>1</p></td></tr></tbody></table>', /<table[^>]*data-caption="Tarifs"/],
      ["Séparateur à points", '<hr data-variant="dots">', /<hr[^>]*data-variant="dots"/],
      ["Image ronde", '<figure class="kb-image" data-align="center" data-variant="circle"><img src="/uploads/thumbnails/a.png" alt="x"></figure>', /<figure class="kb-image"[^>]*data-variant="circle"/],
    ];
    const page = await open();
    await page.fill("#post-title", "Aller-retour des blocs");
    await load(page, samples.map((x) => x[1]).join(""));
    const types = (await tops(page)).map((x) => x.type);
    assert.deepEqual(types.slice(0, 9), ["kbPreformatted", "kbVerse", "kbMore", "kbFile", "kbCover", "kbMediaText", "table", "horizontalRule", "kbImage"]);
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 15000 });
    const saved = srv.db().prepare("SELECT content FROM posts WHERE title = ?").get("Aller-retour des blocs").content;
    for (const [name, , re] of samples) assert.match(saved, re, `${name} : perdu ou déformé à l'enregistrement\n${saved}`);
    // Rechargé depuis la base, l'éditeur retrouve les mêmes blocs
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    assert.deepEqual((await tops(page)).map((x) => x.type).slice(0, 9), types.slice(0, 9));
    await page.context().close();
  });

  test("Lire la suite, Préformaté : Entrée insère un retour à la ligne dans le bloc ; deux lignes vides en sortent", async () => {
    const page = await open();
    await load(page, '<pre class="kb-preformatted">a</pre>');
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(ed.state.doc.firstChild.nodeSize - 1); ed.view.focus(); });
    await page.keyboard.press("Enter");
    await page.keyboard.type("b");
    let t = await tops(page);
    assert.equal(t[0].type, "kbPreformatted");
    assert.equal(t[0].text, "a\nb");
    await page.keyboard.press("Enter"); await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
    t = await tops(page);
    assert.equal(t[0].text, "a\nb", "les lignes vides de sortie sont retirées");
    assert.equal(t[1].type, "paragraph", "le curseur est sorti du bloc");
    await page.context().close();
  });

  test("sans erreur de console pendant ces parcours", () => {
    assert.deepEqual(errors, []);
  });
});
