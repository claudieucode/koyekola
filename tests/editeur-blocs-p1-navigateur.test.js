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

  test("sélection multiple : Maj+flèches, barre d'actions de groupe, Ctrl+G, dupliquer, monter, supprimer", async () => {
    const page = await open();
    await load(page, "<p>Un</p><p>Deux</p><p>Trois</p><p>Quatre</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.keyboard.press("Shift+ArrowDown");
    await page.keyboard.press("Shift+ArrowDown");
    await page.mouse.move(700, 400);
    await page.waitForFunction(() => /3 blocs sélectionnés/.test(document.querySelector("[data-block-toolbar]").innerText), null, { timeout: 5000 });
    assert.equal(await page.locator(".ProseMirror .is-multi-selected").count(), 3, "les trois blocs sont repérés");
    await page.keyboard.press("ControlOrMeta+g");
    let t = await tops(page);
    assert.deepEqual(t.map((x) => x.type), ["kbGroup", "paragraph"]);
    assert.equal(t[0].text, "UnDeuxTrois");
    await selectNode(page, 0);
    await page.keyboard.press("ControlOrMeta+Shift+d");
    t = await tops(page);
    assert.deepEqual(t.map((x) => x.type), ["kbGroup", "kbGroup", "paragraph"], "Ctrl+Maj+D duplique le groupe");
    await page.keyboard.press("ControlOrMeta+Shift+Alt+y");
    await page.keyboard.press("ControlOrMeta+Shift+Alt+y");
    t = await tops(page);
    assert.deepEqual(t.map((x) => x.type).slice(0, 3), ["kbGroup", "paragraph", "kbGroup"], "Ctrl+Maj+Alt+Y descend le bloc, deux fois (un paragraphe final est ajouté après un groupe)");
    await page.keyboard.press("Shift+Alt+z");
    assert.equal((await tops(page)).filter((x) => x.type === "kbGroup").length, 1, "Maj+Alt+Z supprime le groupe sélectionné");
    await page.context().close();
  });

  test("raccourcis de bloc : insérer avant/après, masquer, renommer, niveaux de titre", async () => {
    const page = await open();
    await load(page, "<p>Premier</p><p>Second</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(10); ed.view.focus(); });
    await page.keyboard.press("ControlOrMeta+Alt+t");
    let t = await tops(page);
    assert.deepEqual(t.map((x) => x.text), ["Premier", "", "Second"], "Ctrl+Alt+T insère un paragraphe avant le bloc courant");
    await page.keyboard.press("ControlOrMeta+Alt+y");
    t = await tops(page);
    assert.equal(t.length, 4, "Ctrl+Alt+Y insère un paragraphe après");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let pos = 0; ed.state.doc.forEach((n, p) => { if (n.textContent === "Second") pos = p; }); ed.commands.setTextSelection(pos + 2); ed.view.focus(); });
    await page.keyboard.press("Shift+Alt+2");
    t = await tops(page);
    assert.deepEqual([t.find((x) => x.text === "Second").type, t.find((x) => x.text === "Second").attrs.level], ["heading", 2], "Maj+Alt+2 : titre de niveau 2");
    await page.keyboard.press("Shift+Alt+0");
    assert.equal((await tops(page)).find((x) => x.text === "Second").type, "paragraph", "Maj+Alt+0 : paragraphe");
    await page.keyboard.press("ControlOrMeta+Shift+h");
    assert.equal((await tops(page)).find((x) => x.text === "Second").attrs.hidden, true, "Ctrl+Maj+H masque le bloc");
    await page.keyboard.press("ControlOrMeta+Shift+h");
    assert.equal((await tops(page)).find((x) => x.text === "Second").attrs.hidden, false, "…et l'affiche de nouveau");
    await page.keyboard.press("ControlOrMeta+Alt+r");
    await page.fill(".wp-modal input", "Ma conclusion");
    await page.getByRole("button", { name: "Enregistrer" }).last().click();
    assert.equal((await tops(page)).find((x) => x.text === "Second").attrs.blockName, "Ma conclusion");
    await page.context().close();
  });

  test("annuler / rétablir : boutons désactivés tant qu'il n'y a rien à défaire ; palette : commandes de bloc", async () => {
    const page = await open();
    await load(page, "<p>Un</p><p>Deux</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.view.dispatch(ed.state.tr.setMeta("addToHistory", false)); ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.waitForTimeout(200);
    const state = () => page.evaluate(() => [document.querySelector("[data-undo]").disabled, document.querySelector("[data-redo]").disabled]);
    await page.keyboard.type("x");
    await page.waitForTimeout(150);
    assert.deepEqual(await state(), [false, true], "après une frappe : annuler possible, rétablir non");
    await page.keyboard.press("ControlOrMeta+z");
    await page.waitForTimeout(150);
    assert.equal((await state())[1], false, "après annulation : rétablir possible");
    // Palette de commandes : « Grouper »
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection({ from: 2, to: 8 }); ed.view.focus(); });
    await page.keyboard.press("ControlOrMeta+Shift+k");
    await page.waitForSelector(".wsp-palette");
    await page.keyboard.type("Grouper");
    await page.waitForTimeout(250);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    assert.equal((await tops(page))[0].type, "kbGroup", "la palette exécute la commande « Grouper »");
    await page.context().close();
  });

  test("vue en liste : Maj+clic sélectionne une plage, glisser-déposer déplace un bloc, mode sans distraction", async () => {
    const page = await open();
    await load(page, "<p>Alpha</p><p>Beta</p><p>Gamma</p><p>Delta</p>");
    await page.click('[data-rail="list"]');
    await page.waitForSelector(".wp-lv-select");
    await page.locator(".wp-lv-select").nth(0).click();
    await page.locator(".wp-lv-select").nth(2).click({ modifiers: ["Shift"] });
    await page.mouse.move(700, 400);
    await page.waitForFunction(() => /3 blocs sélectionnés/.test(document.querySelector("[data-block-toolbar]").innerText), null, { timeout: 5000 });
    // Glisser « Delta » avant « Alpha »
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); });
    const rows = page.locator(".wp-lv-row");
    await rows.nth(3).dragTo(rows.nth(0), { targetPosition: { x: 40, y: 3 } });
    await page.waitForTimeout(300);
    assert.deepEqual((await tops(page)).map((x) => x.text), ["Delta", "Alpha", "Beta", "Gamma"], "le bloc a été déplacé par glisser-déposer");
    await page.keyboard.press("ControlOrMeta+Shift+Backslash");
    assert.equal(await page.evaluate(() => document.querySelector("[data-blog-editor]").classList.contains("is-distraction-free")), true);
    await page.keyboard.press("ControlOrMeta+Shift+Backslash");
    assert.equal(await page.evaluate(() => document.querySelector("[data-blog-editor]").classList.contains("is-distraction-free")), false);
    await page.context().close();
  });

  test("outil d'insertion : un bloc glissé vers l'article est inséré à l'endroit du dépôt", async () => {
    const page = await open();
    await load(page, "<p>Haut</p><p>Bas</p>");
    await page.click("[data-toggle-inserter]");
    await page.waitForSelector(".wp-block-type");
    const source = page.locator(".wp-block-type", { hasText: "Séparateur" }).first();
    const target = page.locator(".ProseMirror > p").nth(0);
    await source.dragTo(target, { targetPosition: { x: 20, y: 18 } });
    await page.waitForTimeout(300);
    const t = await tops(page);
    assert.deepEqual(t.map((x) => x.type).slice(0, 3), ["paragraph", "horizontalRule", "paragraph"], JSON.stringify(t.map((x) => x.type)));
    await page.context().close();
  });

  test("verrouillage d'un bloc imbriqué : le bloc d'une colonne ou d'un groupe est protégé comme un bloc de premier niveau", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="light"><p>Libre</p><p>Protégé</p></div><p>Dehors</p>');
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let at = 0; ed.state.doc.descendants((n, pos) => { if (n.textContent === "Protégé" && n.type.name === "paragraph") at = pos; }); ed.commands.setTextSelection(at + 2); ed.view.focus(); });
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: /Verrouiller/ }).click();
    const locked = await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let l = []; ed.state.doc.descendants((n) => { if (n.attrs && n.attrs.locked) l.push(n.textContent); }); return l; });
    assert.deepEqual(locked, ["Protégé"]);
    // Tout sélectionner puis effacer : le bloc verrouillé empêche l'opération
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.selectAll(); ed.view.focus(); });
    await page.keyboard.press("Backspace");
    const texts = (await tops(page)).map((x) => x.text);
    assert.match(texts.join("|"), /Protégé/, "le bloc verrouillé est toujours là");
    await page.context().close();
  });

  test("modèles : chacun s'insère en copie, et tous survivent à l'enregistrement sans rien perdre", async () => {
    const page = await open();
    await page.fill("#post-title", "Article de modèles");
    await page.click("[data-toggle-inserter]");
    await page.getByRole("tab", { name: "Modèles" }).click();
    await page.waitForSelector(".wp-pattern");
    const ids = await page.locator(".wp-pattern").evaluateAll((els) => els.map((e) => e.dataset.pattern));
    assert.ok(ids.length >= 12, `${ids.length} modèles proposés`);
    for (const id of ids) {
      await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.focus("end")); // le curseur est à la fin de l'article (hors du bloc précédemment inséré)
      await page.locator(`.wp-pattern[data-pattern="${id}"]`).click();
    }
    const types = (await tops(page)).map((x) => x.type);
    for (const need of ["kbCta", "kbGroup", "kbColumns", "callout", "kbSteps", "kbFaq", "kbCompare", "table"]) assert.ok(types.includes(need), `${need} absent après insertion : ${types.join(",")}`);
    const [response] = await Promise.all([page.waitForResponse((r) => /\/formateur\/blog\/(nouveau|\d+\/modifier)/.test(r.url()) && r.request().method() === "POST"), page.click("[data-save]")]);
    const body = await response.json();
    assert.equal(response.status(), 200, JSON.stringify(body));
    assert.deepEqual(body.warnings, [], "aucun élément retiré par le serveur");
    const saved = srv.db().prepare("SELECT content FROM posts WHERE title = ?").get("Article de modèles").content;
    for (const marker of ["kb-cta", "kb-group", "kb-columns", "callout", "kb-steps", "kb-faq", "kb-compare", "<table", "kb-pullquote"]) assert.ok(saved.includes(marker), `${marker} perdu à l'enregistrement`);
    await page.context().close();
  });

  test("aperçu par appareil : la zone d'écriture prend la largeur de l'appareil et les colonnes s'empilent", async () => {
    const page = await open();
    await load(page, '<div class="kb-columns" data-layout="50-50" data-stack="mobile"><div class="kb-column"><p>A</p></div><div class="kb-column"><p>B</p></div></div>');
    const width = () => page.evaluate(() => Math.round(document.querySelector(".wp-content").getBoundingClientRect().width));
    const cols = () => page.evaluate(() => getComputedStyle(document.querySelector(".kb-ed-columns")).gridTemplateColumns.split(" ").length);
    const desktop = await width();
    assert.ok(desktop > 600);
    assert.equal(await cols(), 2);
    await page.click("[data-preview-toggle]");
    await page.getByRole("menuitemradio", { name: "Mobile" }).click();
    await page.waitForTimeout(150);
    assert.ok(await width() <= 392, `largeur mobile : ${await width()}`);
    assert.equal(await cols(), 1, "les colonnes s'empilent en largeur mobile");
    await page.click("[data-preview-toggle]");
    await page.getByRole("menuitemradio", { name: "Tablette" }).click();
    await page.waitForTimeout(150);
    const tablet = await width();
    assert.ok(tablet > 392 && tablet <= 822, `largeur tablette : ${tablet}`);
    await page.click("[data-preview-toggle]");
    await page.getByRole("menuitemradio", { name: "Ordinateur" }).click();
    await page.waitForTimeout(150);
    assert.equal(await width(), desktop);
    await page.context().close();
  });

  test("notes : ajout lié à un bloc (Ctrl+Alt+M), pastille sur le bloc, réponse, résolution, jamais dans le contenu", async () => {
    const page = await open();
    await page.fill("#post-title", "Article avec notes");
    await load(page, "<p>Premier paragraphe</p><p>Second paragraphe</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(25); ed.view.focus(); });
    await page.keyboard.press("ControlOrMeta+Alt+m");
    await page.waitForSelector("[data-note-new]");
    assert.equal(await page.locator("[data-note-link]").isChecked(), true, "la note est liée au bloc sélectionné");
    await page.fill("[data-note-new]", "Peut-on raccourcir ce passage ?");
    await page.click("[data-note-send]");
    await page.waitForSelector(".wp-note");
    assert.match(await page.locator(".wp-note").first().innerText(), /Peut-on raccourcir/);
    assert.match(await page.locator(".wp-note-block").first().innerText(), /Bloc : Paragraphe/);
    await page.waitForSelector(".kb-note-badge");
    assert.match(await page.locator(".kb-note-badge").first().innerText(), /1/);
    await page.locator(".wp-note-replybox textarea").first().fill("Fait, merci.");
    await page.locator(".wp-note-replybox button").first().click();
    await page.waitForSelector(".wp-note-reply");
    await page.locator("[data-note-resolve]").first().click();
    await page.waitForFunction(() => !document.querySelector(".kb-note-badge"));
    assert.equal(await page.locator(".wp-note").count(), 0, "le fil résolu quitte la liste des notes ouvertes");
    await page.getByRole("button", { name: /Résolues \(1\)/ }).click();
    assert.equal(await page.locator(".wp-note.is-resolved").count(), 1);
    // Les notes ne polluent jamais le contenu de l'article
    await page.click("[data-save]");
    await page.waitForFunction(() => /^Enregistré$/.test(document.querySelector("[data-save-state]").textContent.trim()), null, { timeout: 15000 });
    const row = srv.db().prepare("SELECT id, content FROM posts WHERE title = ?").get("Article avec notes");
    assert.doesNotMatch(row.content, /raccourcir|Fait, merci/);
    assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM post_notes WHERE post_id = ?").get(row.id).n, 2);
    await page.context().close();
  });

  test("sans erreur de console pendant ces parcours", () => {
    assert.deepEqual(errors, []);
  });
});
