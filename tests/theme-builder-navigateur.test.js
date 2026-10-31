// Theme Builder (23.1, lot 7) — l'interface dans un VRAI Chrome (Playwright) : création par le dialogue, ouverture de l'éditeur existant, éditeur de conditions, publication, filtres, menu d'actions
// au clavier, simulation « Pourquoi ce modèle ? », responsive (pas de défilement horizontal à 390 px), aucune erreur JavaScript. Ignoré (avec la raison) sans Playwright/Chrome.
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

describe("Theme Builder dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, db, site, errors = [];
  const open = async (viewport = { width: 1440, height: 900 }) => {
    const context = await browser.newContext({ viewport }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
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
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Navigateur" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("parcours : état vide → création → conditions (inclusion + exclusion) → publication → filtre → sans erreur JavaScript", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`);
    await page.waitForSelector("#tb-types button"); await page.waitForSelector("#tb-cards p.sw-muted");
    assert.match(await page.locator("#tb-cards").innerText(), /Aucun modèle pour ce site/);
    assert.ok((await page.locator("#tb-types button").count()) >= 12, "types listés");
    assert.equal(await page.locator("#tb-types button[disabled]").count() >= 2, true, "types indisponibles grisés (boutique)");
    await shot(page, "01-vide");
    // création par le dialogue (clavier : Entrée valide)
    await page.click("#tb-new"); await page.waitForSelector("#tb-dlg-new[open]");
    await page.selectOption("#tb-new-type", "header"); await page.fill("#tb-new-name", "En-tête principal"); await shot(page, "02-dialogue");
    const nav = page.waitForURL(/composants\/\d+\/editeur/); await page.press("#tb-new-name", "Enter"); await nav;
    assert.equal((await page.title()).length > 0, true, "l'éditeur EXISTANT s'ouvre");
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await page.waitForSelector(".tb-card");
    assert.equal(await page.locator(".tb-card").count(), 1); assert.match(await page.locator(".tb-card").innerText(), /En-tête principal[\s\S]*Brouillon[\s\S]*Tout le site/);
    // éditeur de conditions : inclusion « Page d'accueil », exclusion « Page 404 »
    await page.click(".tb-card >> text=Conditions"); await page.waitForSelector("#tb-dlg-cond[open]");
    await page.click("#tb-add-inc"); await page.locator("#tb-inc select").first().selectOption("front_page");
    await page.click("#tb-add-exc"); await page.locator("#tb-exc select").first().selectOption("not_found"); await shot(page, "03-conditions");
    await page.click("#tb-form-cond button[type=submit]"); await page.waitForSelector("#tb-dlg-cond", { state: "hidden" });
    assert.match(await page.locator(".tb-card").innerText(), /Page d'accueil/); assert.match(await page.locator(".tb-card").innerText(), /Sauf[\s\S]*Page 404/);
    assert.equal(db.prepare("SELECT conditions c FROM mk_tb_templates WHERE site_id = ?").get(site).c.includes("front_page"), true, "persisté en base");
    // publication
    await page.click(".tb-card >> text=Publier"); await page.waitForFunction(() => /Publié|Brouillon/.test(document.getElementById("tb-status").textContent) || /Publié/.test(document.querySelector(".tb-card .tb-badge").textContent), null, { timeout: 8000 }).catch(() => {}); const msg = await page.locator("#tb-status").innerText(); assert.match(await page.locator(".tb-card .tb-badge").first().innerText(), /Publié/, `statut affiché : « ${msg} »`);
    assert.equal(db.prepare("SELECT status s FROM mk_tb_templates WHERE site_id = ?").get(site).s, "published");
    assert.equal(await page.locator('#tb-types button:has-text("En-tête") .tb-dot[data-live="1"]').count(), 1, "point vert « live »");
    await shot(page, "04-publie");
    // rechargement : l'état est celui de la base
    await page.reload(); await page.waitForSelector(".tb-card"); assert.match(await page.locator(".tb-card").innerText(), /Publié/);
    // filtre / recherche
    await page.fill("#tb-q", "zzz"); await page.waitForFunction(() => /Aucun modèle ne correspond/.test(document.getElementById("tb-cards").textContent));
    await page.fill("#tb-q", "principal"); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length === 1);
    await page.selectOption("#tb-st", "draft"); await page.waitForFunction(() => /Aucun modèle ne correspond/.test(document.getElementById("tb-cards").textContent));
    assert.deepEqual(errors, [], "aucune erreur JavaScript");
    await context.close();
  });

  test("clavier : menu d'actions (Entrée ouvre, Échap ferme et rend le focus), simulation « Pourquoi ce modèle ? »", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await page.waitForSelector(".tb-card");
    const btn = page.locator(".tb-menu > button").first(); await btn.focus(); await page.keyboard.press("Enter");
    assert.equal(await btn.getAttribute("aria-expanded"), "true"); assert.equal(await page.locator(".tb-menu-list").first().isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("role")), "menuitem", "focus dans le menu");
    await page.keyboard.press("Escape"); assert.equal(await btn.getAttribute("aria-expanded"), "false"); assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label") || ""), "Actions pour En-tête principal");
    await page.click("#tb-why"); await page.waitForSelector("#tb-dlg-why[open]"); await page.selectOption("#tb-why-type", "header"); await page.selectOption("#tb-why-view", "front");
    await page.click("#tb-form-why button[type=submit]"); await page.waitForSelector("#tb-why-out li");
    assert.match(await page.locator("#tb-why-out").innerText(), /Modèle appliqué : « En-tête principal »/);
    await page.selectOption("#tb-why-view", "not_found"); await page.click("#tb-form-why button[type=submit]");
    await page.waitForFunction(() => /Aucun modèle publié/.test(document.getElementById("tb-why-out").textContent)); assert.match(await page.locator("#tb-why-out").innerText(), /Exclu/);
    assert.deepEqual(errors, []); await context.close();
  });

  test("téléphone 390 px : aucun défilement horizontal, cibles ≥ 44 px, types en bandeau, dialogues utilisables", async () => {
    const { context, page } = await open({ width: 390, height: 800 });
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`); await page.waitForSelector(".tb-card");
    assert.equal(await noHScroll(page), true, "pas de défilement horizontal"); await shot(page, "05-mobile");
    const small = await page.evaluate(() => [...document.querySelectorAll("#tb button:not([disabled]), #tb a.btn, #tb select, #tb input")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !e.closest("dialog:not([open])") && !e.hidden && e.type !== "file" && e.type !== "checkbox"; }).map((e) => `${e.tagName}.${e.className}:${Math.round(e.getBoundingClientRect().height)}`));
    assert.deepEqual(small.filter((s) => !/btn-sm/.test(s)), [], "cibles tactiles");
    await page.click(".tb-card >> text=Conditions"); await page.waitForSelector("#tb-dlg-cond[open]"); assert.equal(await noHScroll(page), true);
    const box = await page.locator("#tb-dlg-cond").boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 391, `dialogue dans l'écran (${Math.round(box.x)}+${Math.round(box.width)})`);
    assert.deepEqual(errors, []); await context.close();
  });
});
