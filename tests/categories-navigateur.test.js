// Catégories de formations dans un VRAI Chrome : aux 9 largeurs (320 à 1920 px), noms très longs, aucun défilement horizontal, aucun débordement hors cadre,
// aucun chevauchement de texte, cibles tactiles ≥ 40 px (écrans tactiles), parcours clavier du renommage et de la fusion, aucune erreur de console.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, loginInstructor, createCourse } = require("./helpers");
const { measure } = require("../scripts/lib/auditMeasure");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const LONG = "Une catégorie au nom exceptionnellement long pour vérifier que rien ne déborde sur mobile";

describe("catégories (navigateur)", { skip: SKIP }, () => {
  let srv, prof, browser;
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    const db0 = srv.db();
    const names = ["Bureautique", "Langue", "Langues", LONG, "Comptabilité", "Photographie"];
    for (const [i, n] of names.entries()) {
      const c = await createCourse(prof, srv, { title: `Formation ${i}`, price: 10, publish: i !== 4 });
      db0.prepare("UPDATE courses SET category = ? WHERE id = ?").run(n, c.id);
    }
    db0.close();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });
  const open = async (width, touch) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
    await context.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    return { context, page, errors };
  };

  for (const url of ["/formateur/categories", "/formateur/categories/modifier?nom=" + encodeURIComponent(LONG), "/formateur/categories?q=zzz"]) {
    test(`${url.slice(0, 40)} : 9 largeurs sans débordement ni chevauchement`, async () => {
      for (const width of WIDTHS) {
        const touch = width <= 768; const { context, page, errors } = await open(width, touch);
        await page.goto(srv.base + url, { waitUntil: "load" });
        if (process.env.CAT_SHOTS && (width === 390 || width === 1280)) await page.screenshot({ path: `${process.env.CAT_SHOTS}/${url.includes('modifier') ? 'edit' : url.includes('zzz') ? 'vide' : 'liste'}-${width}.png`, fullPage: true });
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(over <= 1, `${url} @${width} : défilement horizontal de ${over}px`);
        const geom = (await page.evaluate(measure)).filter((g) => (g.kind === "h-scroll" || g.kind === "hors-cadre" || g.kind === "chevauchement") && !/sr-only|skip|mk-nav-head × button\.mk-cms-fold/.test(g.sel));
        assert.deepEqual(geom, [], `${url} @${width}`);
        if (touch) {
          const small = await page.evaluate(() => [...document.querySelectorAll("main a.btn, main button, main input:not([type=hidden]), main select")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width && cs.visibility !== "hidden" && !e.hidden && r.height < 40; }).map((e) => e.tagName + "." + e.className + ":" + Math.round(e.getBoundingClientRect().height)));
          assert.deepEqual(small, [], `${url} @${width} : cibles tactiles < 40 px`);
        }
        assert.deepEqual(errors, [], `${url} @${width} : erreurs de console`);
        await context.close();
      }
    });
  }

  test("nom très long : lisible, coupé proprement, hauteur de ligne bornée", async () => {
    const { context, page } = await open(360, true);
    await page.goto(srv.base + "/formateur/categories", { waitUntil: "load" });
    const t = await page.locator(".cat-title", { hasText: "exceptionnellement" }).boundingBox();
    assert.ok(t.width <= 360 && t.height < 200, JSON.stringify(t));
    await context.close();
  });

  test("clavier : Tab jusqu'à « Modifier », fusion à confirmer avec une case à cocher, focus visible", async () => {
    const { context, page } = await open(1280, false);
    await page.goto(srv.base + "/formateur/categories", { waitUntil: "load" });
    await page.getByRole("link", { name: /Modifier la catégorie Langue$/ }).focus();
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== "none" || s.boxShadow !== "none"; });
    assert.ok(ring, "anneau de focus visible");
    await page.keyboard.press("Enter");
    await page.waitForURL(/modifier/);
    await page.fill("#cat-to", "Langues"); await page.keyboard.press("Enter");
    await page.waitForURL(/fusion=Langues/);
    assert.ok(await page.getByText("existe déjà : fusionner ?").isVisible());
    assert.equal(await page.getByRole("button", { name: "Fusionner" }).count(), 1);
    await page.getByRole("button", { name: "Fusionner" }).click();   // case non cochée : la validation du navigateur bloque l'envoi
    assert.match(page.url(), /modifier/);
    await page.getByLabel(/Oui, fusionner/).check(); await page.getByRole("button", { name: "Fusionner" }).click();
    await page.waitForURL(/\/formateur\/categories\?ok=/);
    assert.ok(await page.getByRole("status").filter({ hasText: "fusionnée" }).isVisible());
    await context.close();
  });

  test("tri : le sélecteur recharge la liste sans bouton (JS), le bouton « Appliquer » existe sans JS", async () => {
    const { context, page } = await open(1280, false);
    await page.goto(srv.base + "/formateur/categories", { waitUntil: "load" });
    await page.selectOption("#cat-tri", "formations"); await page.waitForURL(/tri=formations/);
    await context.close();
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    await nojs.addCookies([...prof.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const p2 = await nojs.newPage(); await p2.goto(srv.base + "/formateur/categories", { waitUntil: "load" });
    assert.ok(await p2.locator("[data-cat-apply]").isVisible(), "sans JavaScript, le bouton Appliquer reste visible");
    await nojs.close();
  });
});
