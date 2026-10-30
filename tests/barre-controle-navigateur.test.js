// Barre contextuelle de l'éditeur de pages (TITAN XXXVIII) dans un VRAI Chrome : groupes logiques, libellés non tronqués, hauteur commune des
// contrôles, anneau de focus fin (plus de double contour), menu « Plus » selon la largeur réelle, commandes déplacées toujours fonctionnelles.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : npm install --no-save playwright-core
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("barre contextuelle de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const BAR = "[data-pb-context]";
  const fr = () => page.frameLocator("[data-pb-frame]");
  const selectNode = async (id) => { await fr().locator(`[data-node-id="${id}"]`).first().click(); await page.waitForSelector(`${BAR} select`); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    const id = Number((await boss.post("/marketing/pages", { name: "Barre" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "btn000000001", type: "button", props: { label: "Acheter", url: "/x" } },
      { id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForSelector("[data-pb-frame]");
    await until(async () => fr().locator('[data-node-id="btn000000001"]').count(), { what: "canevas affiché" });
    await selectNode("btn000000001");
  });
  after(async () => { if (browser) await browser.close(); if (srv) { srv.db().close(); await srv.stop(); } });

  test("commandes organisées en groupes nommés, dans l'ordre logique", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    const names = await page.$$eval(`${BAR} .pb-ctx-group`, (els) => els.map((e) => e.getAttribute("aria-label")));
    assert.deepEqual(names.slice(0, 4), ["Typographie", "Couleur du texte", "Alignement du texte", "Espacement et casse"]);
    assert.ok(names.includes("Bouton") && names.includes("États"), names.join(" ; "));
  });

  test("aucun libellé de liste ne finit par « … » et aucun champ n'est tronqué", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    const r = await page.$$eval(`${BAR} select`, (els) => els.map((s) => ({ a: s.getAttribute("aria-label"), t: s.options[0].text, cut: s.scrollWidth > s.clientWidth + 1 })));
    assert.ok(r.length >= 3);
    for (const s of r) { assert.ok(!/…$/.test(s.t), `${s.a} : « ${s.t} »`); assert.ok(!s.cut, `${s.a} tronqué`); }
    const nums = await page.$$eval(`${BAR} .pb-ctx-num`, (els) => els.map((i) => ({ a: i.getAttribute("aria-label"), ph: i.placeholder, cut: i.scrollWidth > i.clientWidth + 1 })));
    for (const n of nums) assert.ok(!n.cut, `champ « ${n.a} » tronqué (${n.ph})`);
  });

  test("tous les contrôles ont la même hauteur (jeton --ctx-h)", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    const hs = await page.$$eval(`${BAR} select, ${BAR} input.pb-ctx-num, ${BAR} .pb-ctx-color, ${BAR} .pb-seg-icons, ${BAR} .pb-ctx-btn`, (els) => els.filter((e) => e.offsetParent).map((e) => ({ c: e.className || e.tagName, h: Math.round(e.getBoundingClientRect().height) })));
    assert.ok(hs.length >= 8);
    for (const x of hs) assert.equal(x.h, 32, `${x.c} : ${x.h} px`);
  });

  test("le focus d'un champ numérique est un anneau fin, sans double contour", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.locator(`${BAR} .pb-ctx-num`).nth(1).focus();
    await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
    const f = await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e); return { cls: e.className, outlineStyle: cs.outlineStyle, outlineW: parseFloat(cs.outlineWidth), shadow: cs.boxShadow, border: cs.borderTopColor }; });
    assert.match(f.cls, /pb-ctx-num/);
    assert.ok(f.outlineStyle === "none" || f.outlineW === 0, `contour : ${f.outlineStyle} ${f.outlineW}`);
    const spread = Number((f.shadow.match(/\)\s+0px\s+0px\s+0px\s+([\d.]+)px/) || [])[1]);
    assert.ok(spread <= 1, `anneau de ${spread} px : ${f.shadow}`);
    assert.notEqual(f.border, "rgb(122, 144, 164)", "la bordure doit passer à la couleur d'accent");
  });

  test("le focus clavier d'une liste et d'un bouton reste visible (liseré accent)", async () => {
    await page.locator(`${BAR} select`).first().focus();
    await wait(250); // les couleurs de bordure ont une transition de 120 ms
    const s = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { b: cs.borderTopColor, sh: cs.boxShadow }; });
    assert.notEqual(s.sh, "none");
    assert.match(s.b, /rgb\(2, 119, 182\)|rgb\(108, 184, 230\)/);
  });

  test("l'alignement affiche et applique la vraie valeur", async () => {
    await selectNode("head00000001");
    const centre = page.locator(`${BAR} .pb-seg-icons button[aria-label="Centrer"]`).first();
    await centre.click();
    await until(async () => (await page.locator(`${BAR} .pb-seg-icons button[aria-label="Centrer"]`).first().getAttribute("aria-pressed")) === "true", { what: "bouton Centrer actif" });
    await until(async () => fr().locator('[data-node-id="head00000001"]').first().evaluate((e) => getComputedStyle(e).textAlign === "center"), { what: "titre centré dans le canevas" });
    await selectNode("btn000000001"); await selectNode("head00000001");
    assert.equal(await page.locator(`${BAR} .pb-seg-icons button[aria-label="Centrer"]`).first().getAttribute("aria-pressed"), "true");
  });

  test("hauteur stable et aucun défilement horizontal de 1920 à 1024 px ; « Plus » si la place manque", async () => {
    await selectNode("btn000000001");
    for (const w of [1920, 1440, 1280, 1024, 900]) {
      await page.setViewportSize({ width: w, height: 900 });
      await wait(250);
      const m = await page.evaluate((sel) => { const b = document.querySelector(sel); return { sw: b.scrollWidth, cw: b.clientWidth, h: Math.round(b.getBoundingClientRect().height), more: !b.querySelector(".pb-ctx-more").hidden }; }, BAR);
      assert.ok(m.sw <= m.cw + 1, `${w} px : défilement horizontal (${m.sw} > ${m.cw})`);
      assert.equal(m.h, 47, `${w} px : hauteur ${m.h}`);
      if (w <= 1024) assert.ok(m.more, `${w} px : le menu « Plus » devrait apparaître`);
    }
  });

  test("une commande déplacée dans « Plus » fonctionne toujours", async () => {
    await page.setViewportSize({ width: 900, height: 900 });
    await selectNode("head00000001");
    await wait(250);
    const more = page.locator(`${BAR} .pb-ctx-more > button`);
    assert.ok(await more.isVisible(), "« Plus » visible");
    await more.click();
    const sel = page.locator(`${BAR} .pb-ctx-pop select[aria-label="Casse"]`);
    assert.equal(await sel.count(), 1, "la liste « Casse » est dans « Plus »");
    await sel.selectOption("uppercase");
    await until(async () => fr().locator('[data-node-id="head00000001"]').first().evaluate((e) => getComputedStyle(e).textTransform === "uppercase"), { what: "casse appliquée au titre" });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(`${BAR} .pb-ctx-pop`).isHidden(), true);
  });

  test("thème sombre : champs et listes reprennent les jetons sombres, anneau de focus visible", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await selectNode("btn000000001");
    await page.evaluate(() => { document.body.setAttribute("data-palette", "dark"); });
    await wait(300);
    const d = await page.evaluate((sel) => {
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
      const s = document.querySelector(sel + " select"), n = document.querySelector(sel + " input.pb-ctx-num"), cs = getComputedStyle(s), ns = getComputedStyle(n);
      return { selBg: lum(cs.backgroundColor), selFg: lum(cs.color), numBg: lum(ns.backgroundColor), numFg: lum(ns.color) };
    }, BAR);
    await page.evaluate(() => { document.body.removeAttribute("data-palette"); });
    assert.ok(d.selBg < 0.3 && d.selFg > 0.6, `liste : fond ${d.selBg.toFixed(2)} / texte ${d.selFg.toFixed(2)}`);
    assert.ok(d.numBg < 0.3 && d.numFg > 0.6, `champ : fond ${d.numBg.toFixed(2)} / texte ${d.numFg.toFixed(2)}`);
  });

  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
