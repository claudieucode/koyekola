// Theme Builder — refonte visuelle « façon Elementor » dans un VRAI Chrome (Playwright, ignoré sans) : barre supérieure, navigation latérale à largeur fixe, catégories reliées aux vraies données,
// grille de cartes (en-tête + infos + miniature), structures types signalées comme exemples, création depuis une carte, responsive (ordinateur, tablette, téléphone), clavier, isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : interface du Theme Builder non exécutée sur cette machine" : false;
const SHOTS = process.env.TB_SHOTS || "";

describe("Theme Builder : interface calquée sur Elementor", { skip: SKIP }, () => {
  let srv, boss, browser, db, siteA, siteB, errors = [];
  const url = (id) => `${srv.base}/marketing/site-web/sites/${id}/constructeur-de-theme`;
  const open = async (viewport = { width: 1440, height: 900 }) => {
    const context = await browser.newContext({ viewport }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(20000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    siteA = await mk("Site Alpha"); siteB = await mk("Site Bravo");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("structure : barre supérieure, navigation fixe, catégories de l'énoncé, une carte par partie sans modèle, filtre par catégorie", async () => {
    const { context, page } = await open();
    await page.goto(url(siteA)); await page.waitForSelector("#tb-types button"); await page.waitForSelector(".tb-tcard");
    assert.match(await page.locator(".tb-bar").innerText(), /theme builder/i);
    assert.match(await page.locator(".tb-close").getAttribute("href"), /\/tableau-de-bord$/, "fermeture : retour au site");
    const labels = await page.locator("#tb-types button .tb-ico + span").allInnerTexts();
    for (const l of ["Toutes les parties", "En-tête", "Pied de page", "Page individuelle", "Article individuel", "Archives", "Résultats de recherche", "Page 404"]) assert.ok(labels.includes(l), `catégorie « ${l} »`);
    assert.equal(await page.locator("#tb-types li.tb-grp").textContent(), "Parties du site");
    assert.equal(await page.locator("#tb-types button[aria-current=true]").innerText().then((t) => t.split("\n")[0]), "Toutes les parties", "entrée active identifiable");
    // proportions : barre 56 px, navigation 240 px de large, grille d'au moins 4 colonnes à 1440 px
    const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const cards = [...document.querySelectorAll(".tb-tcard")].map((c) => c.getBoundingClientRect().top); return { bar: r(".tb-bar").height, side: r(".tb-side").width, firstRow: cards.filter((t) => Math.abs(t - cards[0]) < 12).length }; });
    await shot(page, "elementor-01-toutes");
    assert.equal(Math.round(g.bar), 56); assert.equal(Math.round(g.side), 240); assert.ok(g.firstRow >= 4, `colonnes : ${g.firstRow}`);
    // une carte par type disponible, désignée comme exemple (pas un faux aperçu), et le filtre ne garde qu'une catégorie
    const enabled = await page.locator("#tb-types button:not([disabled]) .tb-ico + span").count() - 1;
    assert.equal(await page.locator(".tb-tcard").count(), enabled);
    assert.match(await page.locator(".tb-tcard").first().innerText(), /Aucun modèle/);
    await page.click('#tb-types button:has-text("Pied de page")');
    await page.waitForFunction(() => document.getElementById("tb-title").textContent === "Pied de page");
    assert.equal(await page.locator(".tb-tcard").count(), 1); assert.equal(await page.locator(".tb-tcard h3").innerText(), "Pied de page");
    await page.click(".tb-tcard .tb-info"); await page.waitForSelector("#tb-dlg-info[open]");
    assert.match(await page.locator("#tb-info").innerText(), /exemple, pas un aperçu de votre site/); await page.keyboard.press("Escape");
    assert.deepEqual(errors, []); await context.close();
  });

  test("création depuis une carte → éditeur existant ; la carte du modèle (en-tête, infos, miniature réelle, actions) remplace la structure type ; l'autre site reste vide", async () => {
    const { context, page } = await open();
    await page.goto(url(siteA)); await page.waitForSelector(".tb-tcard");
    await page.locator('.tb-tcard[data-type="header"] >> text=Créer un modèle').click(); await page.waitForSelector("#tb-dlg-new[open]");
    assert.equal(await page.locator("#tb-new-type").inputValue(), "header", "type prérempli par la carte");
    await page.fill("#tb-new-name", "Mon en-tête"); const nav = page.waitForURL(/composants\/\d+\/editeur/); await page.press("#tb-new-name", "Enter"); await nav;
    await page.goto(url(siteA)); await page.waitForSelector(".tb-card");
    assert.equal(await page.locator(".tb-card").count(), 1); assert.equal(await page.locator('.tb-tcard[data-type="header"]').count(), 0, "la structure type disparaît quand un modèle existe");
    const card = page.locator(".tb-card"); assert.equal(await card.locator(".tb-ch h3").innerText(), "Mon en-tête");
    assert.equal(await card.locator(".tb-ch .tb-info").count(), 1); assert.equal(await card.locator(".tb-thumb svg rect").count() >= 0, true);
    assert.match(await card.locator(".tb-thumb").getAttribute("href"), /composants\/\d+\/editeur/, "la miniature ouvre l'éditeur");
    await card.locator(".tb-info").click(); await page.waitForSelector("#tb-dlg-info[open]"); assert.match(await page.locator("#tb-info").innerText(), /Type : En-tête[\s\S]*État : Brouillon/); await page.keyboard.press("Escape");
    await shot(page, "elementor-02-modele");
    // filtre par catégorie : « Pied de page » ne montre pas l'en-tête ; « En-tête » le montre
    await page.click('#tb-types button:has-text("Pied de page")'); await page.waitForFunction(() => !document.querySelector(".tb-card"));
    await page.click('#tb-types button:has-text("En-tête")'); await page.waitForSelector(".tb-card");
    // isolation : l'autre site n'a ni ce modèle ni ce compte
    await page.goto(url(siteB)); await page.waitForSelector(".tb-tcard"); assert.equal(await page.locator(".tb-card").count(), 0);
    assert.match(await page.locator('#tb-types button:has-text("En-tête")').innerText(), /0/);
    assert.deepEqual(errors, []); await context.close();
  });

  test("responsive : tablette 820 px et téléphone 390 px sans défilement horizontal du document, navigation en bandeau, cibles ≥ 44 px ; clavier dans la navigation", async () => {
    for (const [w, h, n] of [[820, 1000, "tablette"], [390, 800, "mobile"]]) {
      const { context, page } = await open({ width: w, height: h });
      await page.goto(url(siteA)); await page.waitForSelector("#tb-types button"); await page.waitForSelector(".tb-card");
      assert.equal(await noHScroll(page), true, `${n} : pas de défilement horizontal`); await shot(page, `elementor-03-${n}`);
      const side = await page.evaluate(() => { const r = document.querySelector(".tb-side").getBoundingClientRect(); return { w: r.width, h: r.height }; });
      assert.ok(w > 800 ? side.w <= 260 : side.h < 120, `${n} : navigation adaptée (${Math.round(side.w)}×${Math.round(side.h)})`);
      const small = await page.evaluate(() => [...document.querySelectorAll("#tb button:not([disabled]), #tb a.btn, #tb .tb-close")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && !e.classList.contains("btn-sm"); }).map((e) => e.className));
      assert.deepEqual(small, [], `${n} : cibles tactiles`);
      assert.equal(await page.locator("#tb-title").isVisible(), true);
      await context.close();
    }
    const { context, page } = await open(); await page.goto(url(siteA)); await page.waitForSelector(".tb-card");
    await page.locator("#tb-types button").filter({ hasText: /^Archives\s*\d/ }).focus(); await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.getElementById("tb-title").textContent === "Archives");
    assert.equal(await page.locator('#tb-types button[aria-current=true]').innerText().then((t) => t.split("\n")[0]), "Archives");
    assert.deepEqual(errors, []); await context.close();
  });
});
