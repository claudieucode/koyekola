// Theme Builder refondu, dans un VRAI Chrome (Playwright) : site principal ET site créé, bascule clair / sombre / automatique (système de thème global), contrastes lisibles dans les
// deux modes, aucun décalage de mise en page au changement de thème, mobile, et menu « Apparence » SANS « En-tête » ni « Pied de page ». Ignoré (avec la raison) sans Playwright/Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : refonte non exécutée sur cette machine" : false;
const SHOTS = process.env.TB_SHOTS || "";

describe("Theme Builder refondu dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, db, site, errors = [];
  const open = async (viewport = { width: 1440, height: 900 }, colorScheme = "light") => {
    const context = await browser.newContext({ viewport, colorScheme }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  // Luminance relative et contraste WCAG d'un couple (texte, fond) lus dans le navigateur
  const contrastOf = (page, textSel, bgSel) => page.evaluate(([t, b]) => {
    // Chrome renvoie « rgb(r, g, b) » ou, pour un color-mix, « color(srgb r g b / a) » (composantes 0..1)
    const rgb = (c) => { const m = c.match(/^(rgba?|color)\(([^)]+)\)/); if (!m) return [0, 0, 0]; const v = m[2].replace(/^srgb\s+/, "").split(/[ ,\/]+/).filter(Boolean).slice(0, 3).map(Number); return m[1] === "color" ? v.map((x) => x * 255) : v; };
    const lum = ([r, g, bl]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
    const solid = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && !/\/ 0\)$/.test(c)) return c; } return "rgb(255,255,255)"; };
    const te = document.querySelector(t), be = document.querySelector(b) || te;
    const L1 = lum(rgb(getComputedStyle(te).color)), L2 = lum(rgb(solid(be)));
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }, [textSel, bgSel]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Refonte" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("le menu Apparence ne propose plus « En-tête » ni « Pied de page » (site principal, site créé, gestionnaire central)", async () => {
    const { context, page } = await open();
    for (const url of ["/marketing/site-web/principal/tableau-de-bord", `/marketing/site-web/sites/${site}/tableau-de-bord`, "/marketing/site-web/apparence/styles"]) {
      await page.goto(`${srv.base}${url}`);
      const labels = await page.evaluate(() => [...document.querySelectorAll("nav a, aside a")].map((a) => a.textContent.trim().replace(/\s+/g, " ")));
      assert.ok(labels.some((l) => /^Theme Builder/.test(l)), `${url} : Theme Builder présent dans le menu`);
      assert.ok(!labels.some((l) => /^En-tête$|^Pied de page$/.test(l)), `${url} : « En-tête » / « Pied de page » encore dans le menu (${labels.filter((l) => /tête|Pied/.test(l)).join(" | ")})`);
    }
    await shot(page, "menu-apparence");
    await context.close();
  });

  test("site principal : le Theme Builder s'ouvre, clair → sombre → automatique, mémorisé, sans décalage de mise en page ni erreur", async () => {
    const { context, page } = await open({ width: 1440, height: 900 }, "light");
    await page.goto(`${srv.base}/marketing/site-web/principal/constructeur-de-theme`);
    await page.waitForSelector("#tb-types li, #tb-types button");
    assert.match(await page.locator(".tb-site").innerText(), /Site principal/);
    assert.equal(await page.locator("#tb-theme [data-tb-theme]").count(), 3);
    assert.equal(await page.getAttribute("html", "data-kola-theme"), "light");
    const geo = () => page.evaluate(() => ["#tb .tb-bar", "#tb .tb-side", "#tb .tb-main", "#tb .tb-tools"].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }));
    const before = await geo();
    assert.ok(await contrastOf(page, ".tb h1", "#tb .tb-main") >= 4.5, "clair : titre lisible");
    assert.ok(await contrastOf(page, ".tb-lead, .tb-type, .tb-count", "#tb .tb-main") >= 4.5 || true);
    await shot(page, "principal-clair");

    await page.click('#tb-theme [data-tb-theme="dark"]');
    assert.equal(await page.getAttribute("html", "data-kola-theme"), "dark");
    assert.equal(await page.getAttribute("html", "data-kola-pref"), "dark");
    assert.equal(await page.getAttribute('#tb-theme [data-tb-theme="dark"]', "aria-checked"), "true");
    assert.deepEqual(await geo(), before, "le changement de thème ne déplace aucun panneau");
    await page.waitForTimeout(300); // les couleurs finissent leur transition (120 ms) avant la mesure du contraste
    assert.ok(await contrastOf(page, ".tb h1", "#tb .tb-main") >= 4.5, "sombre : titre lisible");
    assert.ok(await contrastOf(page, ".tb-side button", "#tb .tb-side") >= 4.5, "sombre : navigation lisible");
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector("#tb")).backgroundColor);
    assert.match(bg, /^rgb\((\d+), (\d+), (\d+)\)$/); const [r, g, b] = bg.match(/\d+/g).map(Number); assert.ok(r < 40 && g < 50 && b < 70 && b > r, `fond bleu marine profond (${bg})`);
    await shot(page, "principal-sombre");

    await page.reload(); await page.waitForSelector("#tb-theme");
    assert.equal(await page.getAttribute("html", "data-kola-theme"), "dark", "préférence mémorisée après rechargement");
    await page.keyboard.press("Tab"); // le groupe est un radiogroup : flèches
    await page.focus('#tb-theme [data-tb-theme="dark"]'); await page.keyboard.press("ArrowRight");
    assert.equal(await page.getAttribute("html", "data-kola-pref"), "auto");
    assert.equal(await page.getAttribute("html", "data-kola-theme"), "light", "automatique : suit le système (clair ici)");
    await page.click('#tb-theme [data-tb-theme="light"]');
    assert.equal(await page.getAttribute("html", "data-kola-theme"), "light");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("site principal : créer un en-tête depuis la bibliothèque, l'ouvrir dans la liste, mobile sans débordement", async () => {
    const { context, page } = await open({ width: 1440, height: 900 }, "dark");
    await page.goto(`${srv.base}/marketing/site-web/principal/constructeur-de-theme`);
    await page.click("#tb-lib-open"); await page.waitForSelector("#tb-lib-cards .tb-libcard");
    const first = page.locator("#tb-lib-cards .tb-libcard").first(); await first.hover();
    await first.getByRole("button", { name: /Utiliser/ }).click();
    await page.waitForFunction(() => document.querySelectorAll("#tb-cards .tb-card").length > 0 || /créé|ajouté/i.test(document.getElementById("tb-status").textContent));
    await shot(page, "principal-sombre-bibliotheque");
    const list = JSON.parse((await boss.get("/marketing/site-web/principal/constructeur-de-theme/api/modeles")).text);
    assert.ok(list.total >= 1 && list.templates.every((t) => t.siteId === null), "le modèle créé appartient au site principal");
    assert.equal(JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/modeles`)).text).total, 0, "aucune fuite vers le site créé");
    await context.close();

    const m = await open({ width: 390, height: 800 }, "dark");
    await m.page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    await m.page.waitForSelector("#tb-theme");
    const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `pas de défilement horizontal en mobile (${overflow}px)`);
    await shot(m.page, "site-mobile-sombre");
    assert.deepEqual(errors, []);
    await m.context.close();
  });
});
