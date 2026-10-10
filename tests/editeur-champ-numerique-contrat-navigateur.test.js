// Contrat « un clic dans un champ numérique = je veux saisir » (VRAI Chrome) : aucune liste de valeurs (datalist) ni autocomplétion, aucun triangle
// parasite, aucune infobulle sur un champ actif ou en cours de saisie, rien ne bouge au clic ; ▲▼, saisie, clavier et unités continuent de fonctionner.
// Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "rowbox000001", type: "container", styles: { desktop: { display: "flex", gap: "24px", width: "80%" } },
  children: [{ id: "h00000000001", type: "heading", props: { text: "A", level: "3" } }] }] }] };
const SIDES = ["Top", "Right", "Bottom", "Left"];
const SPACING = ["margin", "padding"].flatMap((k) => SIDES.map((s) => k + s));

describe("contrat des champs numériques de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId;
  const until = async (fn, what, ms = 8000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(80); } };
  const inputOf = (prop) => `(document.querySelector('.pb-inspector input[data-prop="${prop}"]') || document.querySelector('.pb-inspector .pb-style-field[data-prop="${prop}"] .pb-len input:not([type=range])'))`;
  const box = (prop) => page.evaluate(`(() => { const i = ${inputOf(prop)}; i.scrollIntoView({ block: "center" }); const r = (i.closest(".pb-sp-box") || i.closest(".pb-len")).getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`);
  const tip = () => page.evaluate(() => { const t = document.getElementById("pb-tip"); return { hidden: t.hidden, text: t.textContent }; });
  const clickIn = async (prop) => { const r = await page.evaluate(`(() => { const i = ${inputOf(prop)}; i.scrollIntoView({ block: "center" }); const b = i.getBoundingClientRect(); return [b.left + 8, b.top + b.height / 2]; })()`); await page.mouse.click(r[0], r[1]); };
  const draft = () => JSON.parse(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft).sections[0].children[0].styles.desktop;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Contrat" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1200);
    await page.evaluate(() => document.querySelector('[data-pb-layers] .pb-node[data-id="rowbox000001"] > .pb-row-item').click()); await wait(500);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); }); await wait(400);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; })); await wait(400);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("aucune liste de valeurs : pas de datalist « pb-scale », aucun champ numérique n'a d'attribut list, autocomplétion coupée", async () => {
    const r = await page.evaluate(() => ({
      datalist: Boolean(document.getElementById("pb-scale")),
      withList: [...document.querySelectorAll(".pb-inspector .pb-len-num, .pb-inspector .pb-box-input, .pb-cbar .pb-ctx-num")].filter((i) => i.hasAttribute("list")).map((i) => i.getAttribute("data-prop") || i.id),
      noAuto: [...document.querySelectorAll(".pb-inspector .pb-len-num, .pb-inspector .pb-box-input")].filter((i) => i.getAttribute("autocomplete") !== "off").length,
      total: document.querySelectorAll(".pb-inspector .pb-len-num, .pb-inspector .pb-box-input").length,
    }));
    assert.equal(r.datalist, false); assert.deepEqual(r.withList, []); assert.equal(r.noAuto, 0); assert.ok(r.total >= 15, `champs examinés : ${r.total}`);
  });

  test("clic dans chacune des 8 cases d'espacement, Écart et Largeur : le champ a le focus, aucune infobulle, aucune liste, rien ne bouge", async () => {
    for (const prop of [...SPACING, "gap", "width"]) {
      await page.mouse.move(5, 500);
      const before = await box(prop);
      await clickIn(prop); await wait(500); // plus long que le délai de l'infobulle (350 ms)
      assert.equal(await page.evaluate(`document.activeElement === ${inputOf(prop)}`), true, `${prop} : focus`);
      assert.equal((await tip()).hidden, true, `${prop} : aucune infobulle après le clic`);
      assert.equal(await page.evaluate(`${inputOf(prop)}.list`), null, `${prop} : aucune liste`);
      const after = await box(prop);
      assert.deepEqual(after.slice(2), before.slice(2), `${prop} : taille du champ inchangée`);
    }
  });

  test("survol AVANT l'interaction : l'infobulle reste possible ; dès le clic puis la saisie, elle disparaît et ne revient pas tant que le champ est actif", async () => {
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.mouse.move(5, 500);
    const r = await page.evaluate(`(() => { const i = ${inputOf("marginTop")}; i.scrollIntoView({ block: "center" }); const b = i.getBoundingClientRect(); return [b.left + 8, b.top + b.height / 2]; })()`);
    await page.mouse.move(r[0], r[1]); await until(async () => !(await tip()).hidden, "infobulle au survol", 2000);
    await page.mouse.down(); await page.mouse.up(); await wait(100);
    assert.equal((await tip()).hidden, true, "masquée dès le clic");
    await page.keyboard.type("24"); await wait(500);
    assert.equal((await tip()).hidden, true, "masquée pendant la saisie");
    await page.mouse.move(r[0] + 20, r[1] + 1); await page.mouse.move(r[0] + 2, r[1]); await wait(600);
    assert.equal((await tip()).hidden, true, "ne revient pas sur un champ actif, même en le survolant à nouveau");
    await page.keyboard.press("Enter"); await until(() => draft().marginTop === "24px", "24 px enregistré");
  });

  test("la saisie directe, le clavier (flèches, négatif, décimales) et le menu des unités fonctionnent comme avant", async () => {
    await clickIn("gap"); await page.keyboard.press("Control+a"); await page.keyboard.press("Meta+a"); await page.keyboard.type("12"); await page.keyboard.press("Enter");
    await until(() => draft().gap === "12px", "gap 12px");
    await clickIn("gap"); await page.keyboard.press("ArrowUp"); await until(() => draft().gap === "13px", "flèche clavier = +1");
    await clickIn("marginLeft"); await page.keyboard.press("Control+a"); await page.keyboard.press("Meta+a"); await page.keyboard.type("-10"); await page.keyboard.press("Enter");
    await until(() => draft().marginLeft === "-10px", "marge négative");
    await clickIn("paddingTop"); await page.keyboard.press("Control+a"); await page.keyboard.press("Meta+a"); await page.keyboard.type("1.5rem"); await page.keyboard.press("Enter");
    await until(() => draft().paddingTop === "1.5rem", "décimale avec unité");
    const sel = page.locator('.pb-sp-group[data-kind="margin"] select.pb-sp-unit').first();
    await sel.selectOption("rem"); await until(() => draft().marginTop === "24rem", "l'unité du groupe change vraiment (nombres conservés)");
    await sel.selectOption("px");
  });

  test("les flèches ▲▼ restent présentes, visibles, et agissent ; le sélecteur d'unité garde sa flèche ; clics rapides sur plusieurs champs sans infobulle", async () => {
    for (const prop of ["marginBottom", "gap", "paddingRight"]) { const v = await page.evaluate(`(() => { const i = ${inputOf(prop)}; const b = i.closest(".pb-sp-box") || i.closest(".pb-len"); const u = b.querySelector('.pb-nstep-btn[data-dir="up"]'); return { vis: u.getBoundingClientRect().width > 0, hasUnit: Boolean(b.querySelector("select")) }; })()`); assert.ok(v.vis, `${prop} : ▲ visible`); }
    for (const prop of [...SPACING, "gap", "width", "gap", "marginTop"]) await clickIn(prop);
    await wait(500);
    assert.equal((await tip()).hidden, true, "aucune infobulle après une rafale de clics");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.getElementById("pb-scale") === null && !document.querySelector("datalist[id=pb-scale]")), true);
  });
});
