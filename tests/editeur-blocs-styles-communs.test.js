// KOLAKISA — réglages de style communs des blocs (typographie, couleur, dimensions, espacement, bordure, ombre) : règles du serveur + parcours dans un VRAI Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { sanitizeBlogHtml, renderBlogHtml } = require("../src/utils/blogHtml");
const { STYLE_PROPS, cleanValue, styleDataOf } = require("../src/shared/blockStyles");

describe("réglages de style communs — serveur", () => {
  test("valeurs de liste conservées, couleurs #rrggbb normalisées, tout le reste retiré", () => {
    const out = sanitizeBlogHtml('<p data-lh="tight" data-fw="bold" data-color="#AA0000" data-bgc="red" data-mt="xl" data-bdw="3" data-shadow="deep" data-evil="x" data-fz="999">A</p>');
    assert.match(out, /data-lh="tight"/); assert.match(out, /data-fw="bold"/); assert.match(out, /data-color="#aa0000"/);
    assert.match(out, /data-mt="xl"/); assert.match(out, /data-shadow="deep"/);
    assert.doesNotMatch(out, /data-bgc|data-bdw|data-evil|data-fz/);
  });
  test("une couleur piégée (url, expression, variable) est refusée", () => {
    for (const bad of ["url(javascript:alert(1))", "#12345", "#gggggg", "red;position:fixed", "var(--x)", "expression(1)"]) {
      assert.equal(cleanValue("color", bad), "", bad);
      assert.doesNotMatch(sanitizeBlogHtml(`<p data-color="${bad}">x</p>`), /data-color/, bad);
    }
  });
  test("la typographie ne s'applique qu'aux blocs de texte ; l'espace entre blocs internes qu'aux conteneurs", () => {
    const out = sanitizeBlogHtml('<div class="kb-spacer" data-size="m" data-fw="bold" data-bgap="m" data-mt="s"></div><div class="kb-group" data-bgap="m" data-fw="bold"><p>x</p></div>');
    assert.doesNotMatch(out.split("</div>")[0], /data-fw|data-bgap/);
    assert.match(out, /data-mt="s"/);
    assert.match(out, /class="kb-group" data-bgap="m"/);
    assert.doesNotMatch(out, /class="kb-group"[^>]*data-fw/);
  });
  test("à l'affichage les couleurs libres deviennent des variables CSS (jamais un style libre)", () => {
    const r = renderBlogHtml('<p data-color="#112233" data-bgc="#ffeedd" data-bdc="#00ff00" style="position:fixed">x</p><div class="kb-group" data-linkc="#0000ff"><p>y</p></div>');
    assert.match(r.html, /--kb-color: #112233/); assert.match(r.html, /--kb-bgc: #ffeedd/); assert.match(r.html, /--kb-linkc: #0000ff/);
    assert.doesNotMatch(r.html, /position/);
  });
  test("un bloc remplacé par son lecteur (vidéo) garde ses réglages de style", () => {
    const r = renderBlogHtml('<div class="kb-video" data-url="https://youtu.be/dQw4w9WgXcQ" data-mt="l" data-shadow="sharp" data-bgc="#eeeeee"></div>');
    assert.match(r.html, /data-mt="l"/); assert.match(r.html, /data-shadow="sharp"/); assert.match(r.html, /--kb-bgc: #eeeeee/);
  });
  test("chaque réglage a une description complète (libellé, groupe, valeurs ou couleur) et un nom d'attribut unique", () => {
    const attrs = new Set();
    for (const p of STYLE_PROPS) {
      assert.ok(p.label && p.group && /^data-[a-z]+$/.test(p.attr), p.key);
      assert.ok(p.color || (p.values && p.values.length > 1), p.key);
      assert.ok(!attrs.has(p.attr), `attribut en double ${p.attr}`); attrs.add(p.attr);
    }
    assert.deepEqual(styleDataOf({ lh: "loose", fw: "evil", color: "#ABCDEF" }), { "data-lh": "loose", "data-color": "#abcdef" });
  });
  test("chaque valeur de liste a une règle CSS publique (aucun réglage « décoratif » sans effet)", () => {
    const css = fs.readFileSync("public/css/style.css", "utf8");
    for (const p of STYLE_PROPS.filter((x) => !x.color)) {
      for (const [v] of p.values.filter(([x]) => x)) {
        assert.ok(css.includes(`[${p.attr}="${v}"]`) || (p.attr === "data-mt" || p.attr === "data-mb") && css.includes(`[${p.attr}="${v}"]`), `règle CSS manquante : ${p.attr}="${v}"`);
      }
    }
    for (const p of STYLE_PROPS.filter((x) => x.color)) assert.ok(css.includes(`[${p.attr}]`) || p.key === "bdc" && css.includes("--kb-bdc"), `règle CSS manquante pour ${p.attr}`);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("réglages de style communs — éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  const load = (page, html) => page.evaluate((h) => { document.querySelector(".ProseMirror").editor.commands.setContent(h); return true; }, html);
  const html = (page) => page.evaluate(() => document.querySelector(".ProseMirror").editor.getHTML());
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("panneau Bloc : interligne, graisse, couleur, marge, bordure et ombre se règlent, s'affichent et s'enregistrent", async () => {
    const page = await open();
    await load(page, "<p>Premier</p><p>Second</p>");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setTextSelection(2); ed.view.focus(); });
    await page.click('[data-sidebar-tab="bloc"]');
    await page.mouse.move(1300, 500);
    for (const g of ["Typographie", "Couleur", "Espacement", "Bordure et ombre"]) await page.getByRole("button", { name: new RegExp(`^${g}`) }).click();
    const pick = async (label, value) => { await page.getByLabel(label, { exact: true }).selectOption(value); await page.mouse.move(1300 + Math.random() * 5, 520); };
    await pick("Interligne", "airy");
    await pick("Graisse", "bold");
    await pick("Marge haute", "xl");
    await pick("Épaisseur de la bordure", "4");
    await pick("Ombre", "deep");
    await page.getByLabel("Couleur de fond", { exact: true }).evaluate((el) => { el.value = "#ffeedd"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.waitForTimeout(400);
    const out = await html(page);
    for (const re of [/data-lh="airy"/, /data-fw="bold"/, /data-mt="xl"/, /data-bdw="4"/, /data-shadow="deep"/, /data-bgc="#ffeedd"/]) assert.match(out, re);
    // Rendu réel dans l'éditeur : l'interligne, la graisse et la couleur de fond sont appliqués
    const css = await page.evaluate(() => { const p = document.querySelector(".ProseMirror p"); const c = getComputedStyle(p); return { lh: c.lineHeight, fs: c.fontSize, fw: c.fontWeight, bg: c.backgroundColor, bw: c.borderTopWidth, mt: c.marginTop }; });
    assert.equal(css.fw, "700"); assert.equal(css.bg, "rgb(255, 238, 221)"); assert.equal(css.bw, "4px");
    assert.ok(Math.abs(parseFloat(css.lh) / parseFloat(css.fs) - 2) < 0.05, `interligne ${css.lh} / ${css.fs}`);
    assert.ok(parseFloat(css.mt) > 40, `marge haute ${css.mt}`);
    // Aller-retour : le HTML enregistré, relu par l'éditeur, garde les réglages
    await load(page, out);
    assert.match(await html(page), /data-lh="airy"/);
    assert.deepEqual(errors, []);
    await page.context().close();
  });

  test("un bloc dessiné par sa propre vue (image) reçoit aussi ses réglages ; copier/coller les styles les reprend", async () => {
    const page = await open();
    await load(page, '<figure class="kb-image" data-shadow="sharp" data-mb="l"><img src="/uploads/thumbnails/a.png" alt="x"></figure><p>Cible</p><p data-fw="bold" data-lh="loose" data-color="#112233">Source</p>');
    const dom = await page.evaluate(() => { const f = document.querySelector(".ProseMirror .kb-ed-image"); return { shadow: f.getAttribute("data-shadow"), mb: f.getAttribute("data-mb") }; });
    assert.deepEqual(dom, { shadow: "sharp", mb: "l" });
    // Copier les styles d'un paragraphe réglé, les coller sur un autre : les réglages communs suivent, pas le texte
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let at = 0; let k = 0; ed.state.doc.forEach((n, pos) => { if (k++ === 2) at = pos; }); ed.commands.setNodeSelection(at); ed.view.focus(); });
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: "Copier les styles" }).first().click();
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; let at = 0; let k = 0; ed.state.doc.forEach((n, pos) => { if (k++ === 1) at = pos; }); ed.commands.setNodeSelection(at); ed.view.focus(); });
    await page.locator('[data-block-toolbar] button[aria-label="Options"], [data-top-toolbar] button[aria-label="Options"]').first().click();
    await page.getByRole("menuitem", { name: "Coller les styles" }).first().click();
    const target = await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const n = ed.state.doc.child(1); return { text: n.textContent, fw: n.attrs.fw, lh: n.attrs.lh, color: n.attrs.color }; });
    assert.deepEqual(target, { text: "Cible", fw: "bold", lh: "loose", color: "#112233" });
    await page.context().close();
  });
});
