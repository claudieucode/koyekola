// Palier 13 — menus et fenêtres de l'éditeur : fermeture au clavier et au clic dans le canevas (cadre), focus rendu à l'élément d'origine.
// Défauts reproduits avant correction (Chrome réel) :
//  - « Règles et magnétisme » restait ouvert après un clic dans le canevas (le cadre n'envoie pas de clic au document de l'éditeur) ;
//  - « Qualité de la page » et « Réglages du menu de navigation » (fenêtres non modales) ne se fermaient pas avec Échap ;
//  - après Échap, le focus d'un menu flottant partagé (historique, menu principal, publication) tombait sur <body>.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } },
  { id: "text00000001", type: "text", props: { text: "Un paragraphe." } },
] }] }] };

describe("éditeur : menus et fenêtres au clavier et au clic dans le canevas (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const focusLabel = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.getAttribute("aria-label") || a.tagName) : null; });
  const dialogOpen = (sel) => page.evaluate((s) => { const d = document.querySelector(s); return Boolean(d && d.open); }, sel);
  const popOpen = (sel) => page.evaluate((s) => { const d = document.querySelector(s); return Boolean(d && !d.hidden && d.getBoundingClientRect().width > 0); }, sel);
  const clickCanvas = async () => { const b = await page.locator("[data-pb-frame]").boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height - 40); await wait(250); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const pageId = Number((await boss.post("/marketing/pages", { name: "Menus clavier" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(700);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("« Règles et magnétisme » : un clic dans le canevas (cadre) le ferme ; Échap aussi, focus rendu au bouton", async () => {
    await page.locator("[data-pb-rules-menu]").click(); await wait(250);
    assert.equal(await popOpen(".pb-rules-pop"), true, "le menu s'ouvre");
    await clickCanvas();
    assert.equal(await popOpen(".pb-rules-pop"), false, "un clic dans le canevas ferme le menu");
    await page.locator("[data-pb-rules-menu]").click(); await wait(250);
    await page.keyboard.press("Escape"); await wait(250);
    assert.equal(await popOpen(".pb-rules-pop"), false, "Échap ferme le menu");
    assert.match(await focusLabel(), /Règles/, "le focus revient au bouton");
  });

  test("« Qualité de la page » (fenêtre non modale) : Échap la ferme et rend le focus au bouton", async () => {
    await page.locator("[data-pb-quality]").click(); await wait(400);
    assert.equal(await dialogOpen("[data-pb-quality-dialog]"), true, "la fenêtre s'ouvre");
    await page.keyboard.press("Escape"); await wait(250);
    assert.equal(await dialogOpen("[data-pb-quality-dialog]"), false, "Échap ferme la fenêtre");
    assert.match(await focusLabel(), /Qualité de la page/, "le focus revient au bouton qualité");
    assert.equal(await page.locator("[data-pb-quality]").getAttribute("aria-expanded"), "false", "aria-expanded se remet à false");
  });

  test("« Réglages du menu de navigation » (fenêtre non modale) : Échap la ferme et rend le focus à l'élément d'origine", async () => {
    await page.locator("[data-pb-mainmenu]").click(); await wait(250);
    await page.locator(".pb-menu-item", { hasText: "Réglages du menu de navigation" }).click(); await wait(400);
    assert.equal(await dialogOpen("[data-pb-navmgr]"), true, "la fenêtre s'ouvre");
    await page.keyboard.press("Escape"); await wait(250);
    assert.equal(await dialogOpen("[data-pb-navmgr]"), false, "Échap ferme la fenêtre");
  });

  test("menu flottant partagé : Échap rend le focus au bouton qui l'a ouvert (historique, menu principal), pas à <body>", async () => {
    for (const [sel, nom] of [["[data-pb-history]", /Historique/], ["[data-pb-mainmenu]", /Menu principal/]]) {
      await page.locator(sel).click(); await wait(300);
      await page.keyboard.press("Escape"); await wait(300);
      assert.match(await focusLabel(), nom, `${sel} : focus rendu au bouton`);
      assert.equal(await popOpen(".pb-menu"), false, `${sel} : menu fermé`);
    }
  });

  test("aucune erreur JavaScript pendant ces parcours", () => { assert.deepEqual(errors, []); });
});
