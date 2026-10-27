// KOLAKISA — fonctions d'éditeur de Gutenberg (lot « parité ») dans un VRAI Chrome : transformations, verrous partiels, lasso, fil d'Ariane, vue en liste repliable,
// « Modifier en HTML », zoom arrière, « [[ », espace insécable, aperçu au survol, guide de bienvenue, recherche et remplacement, plan du document, mentions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const zlib = require("node:zlib");

// PNG minimal (w × h, noir) pour tester l'outil d'image avec un vrai fichier
const png = (w, h) => {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.alloc((w * 3 + 1) * h))), chunk("IEND", Buffer.alloc(0))]);
};

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("éditeur d'articles — fonctions de Gutenberg (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async (url = "/formateur/blog/nouveau") => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}${url}`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  const load = (page, html) => page.evaluate((h) => { document.querySelector(".ProseMirror").editor.commands.setContent(h); return true; }, html);
  const html = (page) => page.evaluate(() => document.querySelector(".ProseMirror").editor.getHTML());
  const tops = (page) => page.evaluate(() => { const out = []; document.querySelector(".ProseMirror").editor.state.doc.forEach((n, pos) => out.push({ type: n.type.name, pos, size: n.nodeSize, text: n.textContent, attrs: n.attrs })); return out; });
  const selectNode = (page, i) => page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1; let n = 0; ed.state.doc.forEach((_, pos) => { if (n++ === k) at = pos; }); ed.commands.setNodeSelection(at); ed.view.focus(); return at; }, i);
  const selectText = (page, i) => page.evaluate((k) => { const ed = document.querySelector(".ProseMirror").editor; let at = -1; let n = 0; ed.state.doc.forEach((_, pos) => { if (n++ === k) at = pos; }); ed.commands.setTextSelection(at + 1); ed.view.focus(); return at; }, i);
  const OPTIONS = '[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]';
  const menu = async (page, label) => { await page.locator(OPTIONS).first().click(); await page.getByRole("menuitem", { name: label }).first().click(); };
  const transform = async (page, label) => { await menu(page, /Transformer en/); await page.getByRole("menuitem", { name: label, exact: true }).first().click(); };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); errors = []; browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("transformer : texte ↔ préformaté ↔ vers, liste → paragraphes, image → couverture, groupe → colonnes, détails → groupe", async () => {
    const page = await open();
    await load(page, "<p>Un<br>Deux<br>Trois</p>");
    await selectText(page, 0);
    await transform(page, "Préformaté");
    let t = await tops(page);
    assert.equal(t[0].type, "kbPreformatted"); assert.equal(t[0].text, "Un\nDeux\nTrois");
    await selectText(page, 0); await transform(page, "Vers");
    assert.equal((await tops(page))[0].type, "kbVerse");
    await selectText(page, 0); await transform(page, "Paragraphes (un par ligne)");
    t = await tops(page);
    assert.deepEqual(t.map((x) => `${x.type}:${x.text}`).slice(0, 3), ["paragraph:Un", "paragraph:Deux", "paragraph:Trois"]);
    // liste → paragraphes séparés
    await load(page, "<ul><li><p>a</p></li><li><p>b</p></li></ul>");
    await selectText(page, 0); await transform(page, "Paragraphes séparés (un par élément)");
    assert.deepEqual((await tops(page)).map((x) => `${x.type}:${x.text}`).slice(0, 2), ["paragraph:a", "paragraph:b"]);
    // image → couverture (la légende devient le texte)
    await load(page, '<figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"><figcaption>Légende</figcaption></figure>');
    await selectNode(page, 0); await transform(page, "Couverture");
    t = await tops(page);
    assert.equal(t[0].type, "kbCover"); assert.equal(t[0].attrs.src, "/uploads/thumbnails/a.png"); assert.equal(t[0].text, "Légende");
    // couverture → image + texte séparés
    await selectNode(page, 0); await transform(page, "Image + texte séparés");
    assert.deepEqual((await tops(page)).map((x) => x.type).slice(0, 2), ["kbImage", "paragraph"]);
    // groupe de 3 blocs → 3 colonnes
    await load(page, '<div class="kb-group" data-bg="none" data-pad="m"><p>A</p><p>B</p><p>C</p></div>');
    await selectNode(page, 0); await transform(page, "Colonnes (3)");
    t = await tops(page);
    assert.equal(t[0].type, "kbColumns"); assert.equal(t[0].attrs.layout, "33-33-33");
    // détails → groupe (titre + contenu)
    await load(page, '<details class="kb-accordion"><summary>Titre</summary><div class="kb-accordion-body"><p>Corps</p></div></details>');
    await selectNode(page, 0); await transform(page, "Groupe (titre + contenu)");
    t = await tops(page);
    assert.equal(t[0].type, "kbGroup"); assert.match(t[0].text, /TitreCorps/);
    // Lire la suite ↔ Page suivante
    await load(page, '<div class="kb-more"></div>');
    await selectNode(page, 0); await transform(page, "Page suivante");
    assert.equal((await tops(page))[0].type, "kbNextPage");
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("verrous partiels : le déplacement et la suppression se verrouillent séparément, le contenu reste modifiable", async () => {
    const page = await open();
    await load(page, "<p>Premier</p><p>Second</p><p>Troisième</p>");
    await selectText(page, 1);
    await menu(page, /Options de verrouillage/);
    await page.getByLabel("Empêcher le déplacement").check();
    await page.getByLabel("Empêcher la suppression").check();
    await page.locator("dialog").getByRole("button", { name: "Appliquer" }).click();
    let t = await tops(page);
    assert.deepEqual([t[1].attrs.locked, t[1].attrs.lockMove, t[1].attrs.lockRemove], [false, true, true]);
    // le contenu reste modifiable
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let at = 0; let k = 0; ed.state.doc.forEach((n, pos) => { if (k++ === 1) at = pos + n.nodeSize - 1; }); ed.commands.setTextSelection(at); ed.view.focus(); });
    await page.keyboard.type(" modifié");
    assert.equal((await tops(page))[1].text, "Second modifié");
    // déplacement refusé (le bloc, mais aussi le voisin qui l'enjamberait)
    await page.keyboard.press("Alt+ArrowUp");
    assert.deepEqual((await tops(page)).map((x) => x.text), ["Premier", "Second modifié", "Troisième"]);
    await selectText(page, 0); await page.keyboard.press("Alt+ArrowDown");
    assert.deepEqual((await tops(page)).map((x) => x.text), ["Premier", "Second modifié", "Troisième"], "un bloc voisin ne peut pas enjamber un bloc verrouillé contre le déplacement");
    // suppression refusée
    await selectText(page, 1);
    await page.keyboard.press("Shift+Alt+z");
    assert.equal((await tops(page)).length, 3);
    // un autre bloc se supprime et s'insère normalement : l'ordre relatif du bloc verrouillé est conservé
    await selectText(page, 2); await page.keyboard.press("Shift+Alt+z");
    assert.deepEqual((await tops(page)).map((x) => x.text), ["Premier", "Second modifié"]);
    // « verrou complet » (contenu) toujours disponible ; l'enregistrement conserve les attributs
    const out = await html(page);
    assert.match(out, /data-lock-move="true"/); assert.match(out, /data-lock-remove="true"/);
    await load(page, out);
    assert.equal((await tops(page))[1].attrs.lockMove, true);
    await page.context().close();
  });

  test("verrou appliqué aux blocs internes d'un groupe", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="none"><p>Interne un</p><p>Interne deux</p></div>');
    await selectNode(page, 0);
    await menu(page, /Options de verrouillage/);
    await page.getByLabel("Empêcher la suppression").check();
    await page.getByLabel("Appliquer aussi aux blocs qu'il contient").check();
    await page.locator("dialog").getByRole("button", { name: "Appliquer" }).click();
    const inner = await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const out = []; ed.state.doc.firstChild.descendants((n) => { if (n.type.name === "paragraph") out.push(n.attrs.lockRemove); return true; }); return out; });
    assert.deepEqual(inner, [true, true]);
    await page.context().close();
  });

  test("lasso : glisser depuis la marge entoure plusieurs blocs et les sélectionne", async () => {
    const page = await open();
    await load(page, "<p>Un</p><p>Deux</p><p>Trois</p><p>Quatre</p>");
    const boxes = await page.evaluate(() => [...document.querySelector(".ProseMirror").children].map((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    const canvas = await page.locator("[data-canvas]").boundingBox();
    const startX = canvas.x + 12; // marge gauche de la zone d'écriture
    await page.mouse.move(startX, boxes[0].y - 4);
    await page.mouse.down();
    await page.mouse.move(startX + 60, boxes[0].y + 10, { steps: 4 });
    await page.mouse.move(boxes[2].x + 40, boxes[2].y + boxes[2].h / 2, { steps: 8 });
    assert.ok(await page.locator(".wp-lasso").count(), "le rectangle du lasso est affiché pendant le glissement");
    await page.mouse.up();
    const sel = await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const { from, to } = ed.state.selection; const kids = []; ed.state.doc.forEach((n, pos) => kids.push({ pos, end: pos + n.nodeSize })); return kids.filter((k) => k.end > from && k.pos < to).length; });
    assert.equal(sel, 3, "trois blocs sélectionnés");
    await page.context().close();
  });

  test("fil d'Ariane : Document › Groupe › Paragraphe, chaque étape se sélectionne", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="none"><p>Dedans</p></div><p>Dehors</p>');
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(3); ed.view.focus(); });
    const bar = page.locator("[data-breadcrumb]");
    await page.waitForFunction(() => document.querySelector("[data-breadcrumb]").textContent.includes("Paragraphe"));
    assert.match((await bar.innerText()).replace(/\s+/g, " "), /Document › Groupe › Paragraphe/);
    assert.equal(await bar.locator(".is-current").innerText(), "Paragraphe");
    await bar.getByRole("button", { name: "Groupe" }).click();
    const sel = await page.evaluate(() => document.querySelector(".ProseMirror").editor.state.selection.node && document.querySelector(".ProseMirror").editor.state.selection.node.type.name);
    assert.equal(sel, "kbGroup");
    await page.context().close();
  });

  test("vue en liste : replier un groupe, « Alt + clic » replie les autres, « Tout replier / Tout déplier »", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="none"><p>A1</p></div><div class="kb-group" data-bg="none"><p>B1</p></div><div class="kb-group" data-bg="none"><p>C1</p></div>');
    await page.click("[data-toggle-inserter]");
    await page.click('[data-rail="list"]').catch(() => {});
    await page.waitForSelector(".wp-list-view .wp-lv-toggle");
    const toggles = page.locator(".wp-lv-toggle");
    assert.equal(await toggles.count(), 3);
    const visible = () => page.evaluate(() => [...document.querySelectorAll(".wp-lv-children")].map((u) => getComputedStyle(u).display !== "none"));
    assert.deepEqual(await visible(), [true, true, true]);
    await toggles.nth(0).click();
    assert.deepEqual(await visible(), [false, true, true]);
    await page.locator(".wp-lv-toggle").nth(1).click({ modifiers: ["Alt"] });
    assert.deepEqual(await visible(), [false, true, false], "Alt + clic : seul le bloc cliqué reste déplié");
    await page.getByRole("button", { name: "Tout déplier" }).click();
    assert.deepEqual(await visible(), [true, true, true]);
    await page.getByRole("button", { name: "Tout replier" }).click();
    assert.deepEqual(await visible(), [false, false, false]);
    assert.equal(await page.locator(".wp-lv-toggle").first().getAttribute("aria-expanded"), "false");
    await page.context().close();
  });

  test("Modifier en HTML : le code du bloc est relu par les règles de l'éditeur (le script est retiré), Annuler défait", async () => {
    const page = await open();
    await load(page, "<p>Avant</p>");
    await selectText(page, 0);
    await menu(page, /Modifier en HTML/);
    const ta = page.getByLabel("HTML du bloc");
    assert.match(await ta.inputValue(), /<p[^>]*>Avant<\/p>/);
    await ta.fill('<h2>Nouveau titre</h2><script>alert(1)</script><p onclick="x()">Texte</p>');
    await page.locator("dialog").getByRole("button", { name: "Appliquer" }).click();
    const t = await tops(page);
    assert.deepEqual(t.map((x) => `${x.type}:${x.text}`).slice(0, 2), ["heading:Nouveau titre", "paragraph:Texte"]);
    assert.doesNotMatch(await html(page), /script|onclick/);
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.view.focus());
    await page.keyboard.press("ControlOrMeta+z");
    assert.equal((await tops(page))[0].text, "Avant");
    await page.context().close();
  });

  test("zoom arrière (Ctrl+Maj+0), espace insécable (Ctrl+Maj+Espace), « [[ » ouvre la recherche de liens, guillemets ` ` → code", async () => {
    const page = await open();
    await load(page, "<p>Texte</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.focus("end"); });
    await page.waitForFunction(() => document.querySelector(".ProseMirror") === document.activeElement); // le focus de Tiptap est différé d'une image
    await page.keyboard.press("ControlOrMeta+Shift+0");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".wp-content")).zoom), "0.55");
    await page.keyboard.press("ControlOrMeta+Shift+0");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".wp-content")).zoom), "1");
    await page.keyboard.press("ControlOrMeta+Shift+Space");
    assert.match((await tops(page))[0].text, /Texte $/);
    await page.keyboard.type("a `code` b");
    assert.match(await html(page), /<code>code<\/code>/);
    await page.keyboard.type(" [[");
    await page.getByLabel("Rechercher ou saisir l'URL").waitFor();
    assert.doesNotMatch((await tops(page))[0].text, /\[/, "les deux crochets sont retirés");
    await page.context().close();
  });

  test("aperçu au survol dans l'outil d'insertion : le bloc tel qu'il sera inséré, sans rien modifier dans l'article", async () => {
    const page = await open();
    await load(page, "<p>Intact</p>");
    await page.click("[data-toggle-inserter]");
    await page.locator(".wp-block-type", { hasText: "Citation" }).first().hover();
    const box = page.locator(".wp-block-preview");
    await box.waitFor();
    assert.match(await box.innerText(), /Citation/);
    assert.ok(await box.locator("blockquote").count(), "la citation est dessinée dans l'aperçu");
    await page.locator(".wp-block-type", { hasText: "Image" }).first().hover();
    assert.match(await box.innerText(), /Choisissez le contenu/);
    await page.mouse.move(900, 600);
    await box.waitFor({ state: "hidden" });
    assert.deepEqual((await tops(page)).map((x) => x.text), ["Intact"], "l'article n'a pas bougé");
    assert.equal(await page.locator("dialog").count(), 0, "aucune fenêtre ouverte par l'aperçu");
    await page.context().close();
  });

  test("guide de bienvenue : quatre écrans, navigation, fermeture ; accessible depuis le menu ⋮", async () => {
    const page = await open();
    await page.locator('button[aria-label="Options"][aria-haspopup], [data-options-toggle], [data-menu="options"]').first().click().catch(async () => { await page.locator(".wp-header button[aria-haspopup='menu']").last().click(); });
    await page.getByRole("menuitem", { name: "Guide de bienvenue" }).click();
    const dlg = page.locator("dialog .wp-welcome");
    await dlg.waitFor();
    assert.match(await dlg.locator(".wp-welcome-title").innerText(), /Bienvenue/);
    for (let i = 0; i < 3; i++) await dlg.getByRole("button", { name: /Suivant/ }).click();
    assert.match(await dlg.locator(".wp-welcome-title").innerText(), /plusieurs/);
    await dlg.getByRole("button", { name: "Précédent" }).click();
    assert.match(await dlg.locator(".wp-welcome-title").innerText(), /Régler/);
    await page.context().close();
  });

  test("rechercher / remplacer : compteur, remplacement un par un et global, bloc verrouillé épargné", async () => {
    const page = await open();
    await load(page, '<p>chat chien chat</p><p data-locked="true">chat verrouillé</p><p>un chat</p>');
    await page.evaluate(() => document.querySelector(".ProseMirror").editor.commands.focus("start"));
    await page.keyboard.press("ControlOrMeta+Shift+f");
    const q = page.getByLabel("Rechercher dans l'article");
    await q.fill("chat");
    assert.match(await page.locator(".wp-find-count").innerText(), /1 \/ 4/);
    await page.getByLabel("Remplacer par").fill("lynx");
    await page.getByRole("button", { name: "Tout remplacer" }).click();
    assert.deepEqual((await tops(page)).map((x) => x.text), ["lynx chien lynx", "chat verrouillé", "un lynx"]);
    await page.context().close();
  });

  test("copier, couper, coller des blocs : un groupe copié se colle en entier (aucune perte), couper le retire, coller le remet", async () => {
    const page = await open();
    await load(page, '<div class="kb-group" data-bg="light" data-pad="m" id="mon-groupe"><p>Dans le groupe</p></div><p>Fin</p>');
    await selectNode(page, 0);
    await page.keyboard.press("ControlOrMeta+c");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(ed.state.doc.content.size - 1); ed.view.focus(); });
    await page.keyboard.press("ControlOrMeta+v");
    let t = await tops(page);
    assert.equal(t.filter((x) => x.type === "kbGroup").length, 2, "le groupe est collé une seconde fois");
    assert.match(t.find((x, i) => x.type === "kbGroup" && i > 0).text, /Dans le groupe/);
    // couper retire le premier groupe, coller le remet
    await selectNode(page, 0);
    await page.keyboard.press("ControlOrMeta+x");
    assert.equal((await tops(page)).filter((x) => x.type === "kbGroup").length, 1);
    await page.keyboard.press("ControlOrMeta+v");
    assert.equal((await tops(page)).filter((x) => x.type === "kbGroup").length, 2);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("image : recadrer et pivoter de 90° crée une nouvelle image aux bonnes dimensions (l'originale reste)", async () => {
    const fd = new FormData(); fd.append("article_image", new Blob([png(60, 30)], { type: "image/png" }), "base.png"); fd.append("width", "60"); fd.append("height", "30");
    const media = JSON.parse((await boss.request("/formateur/blog/api/medias", { method: "POST", multipart: fd })).text).media;
    const page = await open();
    await load(page, `<figure class="kb-image" data-align="center"><img src="${media.path}" alt="Base"></figure>`);
    await selectNode(page, 0);
    await page.click('[data-sidebar-tab="bloc"]');
    await page.mouse.move(1300, 500);
    await page.getByRole("button", { name: "Recadrer…" }).click();
    const preview = page.locator(".wp-crop-img");
    await page.waitForFunction(() => document.querySelector(".wp-crop-img") && document.querySelector(".wp-crop-img").naturalWidth === 60);
    await page.getByRole("button", { name: /Pivoter à droite/ }).click();
    await page.waitForFunction(() => document.querySelector(".wp-crop-img").naturalWidth === 30 && document.querySelector(".wp-crop-img").naturalHeight === 60);
    assert.equal(await preview.evaluate((el) => [el.naturalWidth, el.naturalHeight].join("x")), "30x60", "l'image affichée est tournée");
    await page.getByRole("button", { name: "Appliquer le recadrage" }).click();
    await page.waitForFunction((old) => { let src = ""; document.querySelector(".ProseMirror").editor.state.doc.descendants((n) => { if (n.type.name === "kbImage") src = n.attrs.src; return true; }); return src && src !== old; }, media.path, { timeout: 15000 });
    const now = (await tops(page))[0].attrs.src;
    const dims = await page.evaluate(async (u) => { const i = new Image(); i.src = u; await i.decode(); return [i.naturalWidth, i.naturalHeight]; }, now);
    assert.deepEqual(dims, [24, 48], "zone conservée par défaut (80 %) de l'image tournée 30 × 60");
    assert.ok((await fetch(`${srv.base}${media.path}`)).ok, "l'image d'origine est conservée");
    await page.context().close();
  });

  test("plan du document : liste les titres, un clic place le curseur dans le titre", async () => {
    const page = await open();
    await load(page, "<h2>Introduction</h2><p>x</p><h3>Détail</h3><p>y</p><h2>Conclusion</h2>");
    await page.click("[data-toggle-inserter]");
    await page.click('[data-rail="list"]').catch(() => {});
    await page.getByRole("tab", { name: "Plan" }).click();
    const items = page.locator(".wp-outline li button");
    assert.equal(await items.count(), 3);
    assert.match((await items.allInnerTexts()).join(" | "), /Introduction.*Détail.*Conclusion/s);
    await items.nth(2).click();
    assert.equal(await page.evaluate(() => document.querySelector(".ProseMirror").editor.state.selection.$from.parent.textContent), "Conclusion");
    await page.context().close();
  });
});
