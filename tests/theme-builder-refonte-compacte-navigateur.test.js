// Theme Builder : refonte compacte de l'interface, dans un VRAI Chrome : cartes nettement plus basses, structures types sans grandes cartes vides, actions sur une seule ligne,
// navigation latérale uniforme (hauteurs, compteurs alignés, largeur fixe), filtres alignés sur une ligne, menu ⋯ dans l'en-tête de carte, cibles de 44 px sur téléphone.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : npm install --no-save playwright-core
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : interface du Theme Builder non exécutée sur cette machine" : false;

describe("Theme Builder : refonte compacte (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, site, errors = [];
  const url = () => `${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme`;
  const open = async (viewport = { width: 1440, height: 900 }, opt = {}) => {
    const context = await browser.newContext({ viewport, ...opt }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(20000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    await page.goto(url()); await page.waitForSelector("#tb-types button"); await page.waitForSelector(".tb-card");
    return { context, page };
  };
  const api = (page, p, b) => page.evaluate(async ([p, b]) => (await fetch(`${document.getElementById("tb").dataset.base}/api${p}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json(), [p, b]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site compact" })).location.match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const { context, page } = await (async () => { const context = await browser.newContext(); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }))); const page = await context.newPage(); await page.goto(url()); await page.waitForSelector("#tb-types button"); return { context, page }; })();
    const a = await api(page, "/modeles", { type: "footer", name: "Pied nuit" }); const b = await api(page, "/modeles", { type: "header", name: "En-tête du site" });
    assert.ok(a.ok && b.ok); assert.ok((await api(page, `/modeles/${b.template.id}/publier`, { revision: b.template.revision })).ok);
    await context.close();
  });
  after(async () => { if (browser) await browser.close(); if (srv) { srv.db().close(); await srv.stop(); } });

  test("cartes compactes : un modèle existant < 340 px de haut, une structure type < 200 px, grille d'au moins 4 colonnes à 1440 px", async () => {
    const { context, page } = await open();
    const r = await page.evaluate(() => {
      const h = (s) => [...document.querySelectorAll(s)].map((c) => Math.round(c.getBoundingClientRect().height));
      const tops = [...document.querySelectorAll(".tb-card, .tb-tcard")].map((c) => c.getBoundingClientRect().top);
      return { card: h(".tb-card"), ghost: h(".tb-tcard"), cols: tops.filter((t) => Math.abs(t - tops[0]) < 12).length };
    });
    assert.ok(r.card.length === 2 && r.card.every((x) => x < 340), `modèles : ${r.card}`);
    assert.ok(r.ghost.length >= 5 && r.ghost.every((x) => x < 200), `structures types : ${r.ghost}`);
    assert.ok(r.cols >= 4, `colonnes : ${r.cols}`);
    await context.close();
  });

  test("structure d'une carte : nom + menu, aperçu, type + statut, conditions, date, puis actions ; « Modifier » est l'action principale", async () => {
    const { context, page } = await open();
    const card = page.locator(".tb-card").first();
    const y = (sel) => card.locator(sel).first().evaluate((e) => e.getBoundingClientRect().top);
    const order = [await y(".tb-ch h3"), await y(".tb-thumb"), await y(".tb-type"), await y(".tb-cond"), await y(".tb-meta > span:last-child"), await y(".tb-actions")];
    assert.deepEqual([...order].sort((p, q) => p - q), order, `ordre vertical : ${order}`);
    assert.equal(await card.locator(".tb-ch .tb-menu > button").count(), 1, "le menu ⋯ est dans l'en-tête");
    assert.equal(await card.locator(".tb-actions .tb-menu").count(), 0);
    const bg = (sel) => card.locator(sel).first().evaluate((e) => getComputedStyle(e).backgroundColor);
    assert.equal(await bg(".tb-actions a.btn-primary"), "rgb(2, 119, 182)", "Modifier = bleu d'action Kolakisa");
    assert.notEqual(await bg(".tb-actions .btn-outline"), await bg(".tb-actions a.btn-primary"));
    await context.close();
  });

  test("actions sur une seule ligne, sans retour à la ligne, et toutes présentes (Modifier, Aperçu, Conditions, Publier / Republier)", async () => {
    const { context, page } = await open();
    const r = await page.evaluate(() => [...document.querySelectorAll(".tb-card")].map((c) => {
      const b = [...c.querySelectorAll(".tb-actions .btn")]; return { labels: b.map((x) => x.textContent.trim()), tops: new Set(b.map((x) => Math.round(x.getBoundingClientRect().top))).size, cond: Boolean([...c.querySelectorAll(".tb-cond .btn")].find((x) => x.textContent === "Conditions")), h: [...b].map((x) => Math.round(x.getBoundingClientRect().height)) };
    }));
    for (const c of r) { assert.equal(c.tops, 1, `retour à la ligne : ${c.labels}`); assert.ok(c.cond, "Conditions présent"); assert.ok(c.labels.includes("Modifier") && c.labels.includes("Aperçu") && c.labels.some((l) => /Publier|Republier/.test(l)), c.labels.join("|")); assert.ok(c.h.every((x) => x === 30), `hauteurs : ${c.h}`); }
    assert.ok(r.some((c) => c.labels.includes("Republier")) && r.some((c) => c.labels.includes("Publier")), "états Publié et Brouillon");
    await context.close();
  });

  test("navigation latérale : hauteurs uniformes, compteurs alignés, largeur fixe quand on change de catégorie, libellés longs tronqués proprement", async () => {
    const { context, page } = await open();
    const m = () => page.evaluate(() => { const b = [...document.querySelectorAll("#tb-types button")]; return { w: Math.round(document.querySelector(".tb-side").getBoundingClientRect().width), h: [...new Set(b.map((x) => Math.round(x.getBoundingClientRect().height)))], right: [...new Set(b.map((x) => Math.round(x.querySelector(".tb-count").getBoundingClientRect().right)))], dots: [...new Set(b.filter((x) => x.querySelector(".tb-dot")).map((x) => Math.round(x.querySelector(".tb-dot").getBoundingClientRect().left)))], over: b.filter((x) => x.scrollWidth > x.clientWidth + 1).length }; });
    const a = await m(); assert.equal(a.w, 240); assert.deepEqual(a.h, [36], `hauteurs : ${a.h}`); assert.equal(a.right.length, 1, `compteurs désalignés : ${a.right}`); assert.equal(a.dots.length, 1); assert.equal(a.over, 0, "libellé qui déborde");
    await page.click('#tb-types button:has-text("En-tête")'); await page.waitForFunction(() => document.getElementById("tb-title").textContent === "En-tête");
    const b = await m(); assert.equal(b.w, 240); assert.deepEqual(b.right, a.right, "les compteurs ne bougent pas à la sélection");
    assert.equal(await page.locator('#tb-types button:has-text("Résultats de recherche")').getAttribute("title"), "Résultats de recherche");
    await context.close();
  });

  test("filtres : recherche, état, tri, « Pourquoi ce modèle ? » et grille/liste sur une même ligne, champs de 36 px", async () => {
    const { context, page } = await open();
    const r = await page.evaluate(() => { const q = (s) => document.querySelector(s).getBoundingClientRect(); const els = ["#tb-q", "#tb-st", "#tb-sort", "#tb-why"].map(q); return { bottoms: els.map((e) => Math.round(e.bottom)), h: [q("#tb-q"), q("#tb-st"), q("#tb-sort")].map((e) => Math.round(e.height)), viewsTop: Math.round(q(".tb-views").top), formTop: Math.round(q("#tb-tools").top), formBottom: Math.round(q("#tb-tools").bottom) }; });
    assert.equal(new Set(r.bottoms).size, 1, `champs non alignés : ${r.bottoms}`); assert.deepEqual(r.h, [36, 36, 36]);
    assert.ok(r.viewsTop >= r.formTop && r.viewsTop < r.formBottom, "sélecteur grille/liste dans la même rangée");
    await page.fill("#tb-q", "nuit"); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length === 1);
    await page.selectOption("#tb-st", "published"); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length === 0);
    await page.fill("#tb-q", ""); await page.selectOption("#tb-st", ""); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length === 2);
    await context.close();
  });

  test("menu ⋯, Aperçu, Conditions, grille/liste : tout fonctionne depuis la nouvelle disposition", async () => {
    const { context, page } = await open();
    const card = page.locator('.tb-card:has-text("Pied nuit")');
    await card.locator(".tb-ch .tb-menu > button").click();
    const list = card.locator(".tb-menu-list"); assert.equal(await list.isVisible(), true);
    const box = await list.boundingBox(); assert.ok(box.y >= 0 && box.y + box.height <= 900, "menu visible dans la fenêtre");
    const items = await list.locator("button").allInnerTexts(); for (const l of ["Aperçu", "Renommer", "Dupliquer", "Archiver", "Exporter (JSON)", "Versions", "Où est-il utilisé ?"]) assert.ok(items.includes(l), `entrée « ${l} » : ${items}`);
    await page.keyboard.press("Escape"); assert.equal(await list.isVisible(), false);
    await card.locator(".tb-cond .btn", { hasText: "Conditions" }).click(); await page.waitForSelector("#tb-dlg-cond[open]"); await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#tb-dlg-cond[open]"));
    await card.getByRole("button", { name: /^Aperçu de/ }).click(); await page.waitForSelector("#tb-prev[open]"); await page.click("#tb-prev-back");
    await page.click("#tb-v-list"); await page.waitForSelector(".tb-table"); assert.equal(await page.locator(".tb-table tr.tb-card").count(), 2);
    await page.click("#tb-v-grid"); await page.waitForSelector(".tb-card:not(tr)");
    await context.close();
  });

  test("structure type (sans modèle) : bouton « Créer un modèle » sur la ligne du nom, bordure discrète (non pointillée)", async () => {
    const { context, page } = await open();
    const g = page.locator('.tb-tcard[data-type="archive"]');
    const r = await g.evaluate((c) => { const t = c.querySelector(".tb-type").getBoundingClientRect(), b = c.querySelector(".tb-actions .btn").getBoundingClientRect(); return { sameRow: Math.abs((t.top + t.bottom) / 2 - (b.top + b.bottom) / 2) < 8, style: getComputedStyle(c).borderTopStyle, h: Math.round(c.getBoundingClientRect().height) }; });
    assert.ok(r.sameRow, "texte et bouton alignés"); assert.equal(r.style, "solid"); assert.ok(r.h < 200);
    await g.getByRole("button", { name: /Créer un modèle/ }).click(); await page.waitForSelector("#tb-dlg-new[open]"); assert.equal(await page.locator("#tb-new-type").inputValue(), "archive");
    await context.close();
  });

  test("téléphone 390 px : aucun défilement horizontal, cibles tactiles ≥ 44 px, actions toutes accessibles", async () => {
    const { context, page } = await open({ width: 390, height: 800 }, { hasTouch: true, isMobile: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
    const small = await page.evaluate(() => [...document.querySelectorAll("#tb button:not([disabled]), #tb a.btn, #tb select, #tb input")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 43.5 && !e.closest("dialog:not([open])") && !e.hidden && e.type !== "file" && e.type !== "checkbox"; }).map((e) => `${e.tagName}.${e.className}:${Math.round(e.getBoundingClientRect().height)}`));
    assert.deepEqual(small, [], "cibles trop petites");
    const wrapped = await page.evaluate(() => [...document.querySelectorAll(".tb-card .tb-actions")].some((a) => [...a.children].some((x) => x.getBoundingClientRect().right > a.getBoundingClientRect().right + 1)));
    assert.equal(wrapped, false, "boutons qui sortent de la carte");
    await context.close();
  });

  test("mouvement réduit et thème sombre : aucune transition, fonds et textes de la charte", async () => {
    const { context, page } = await open({ width: 1440, height: 900 }, { reducedMotion: "reduce" });
    const d = await page.evaluate(() => [...document.querySelectorAll(".tb-card, .tb-side button, .tb .btn")].slice(0, 12).map((e) => getComputedStyle(e).transitionDuration + "|" + getComputedStyle(e).animationName));
    for (const x of d) assert.match(x, /^0s(, 0s)*\|none$/, x);
    await page.evaluate(() => document.documentElement.setAttribute("data-kola-theme", "dark")); await page.waitForTimeout(250);
    const c = await page.evaluate(() => { const lum = (s) => { const m = s.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; }; return { bg: lum(getComputedStyle(document.querySelector(".tb")).backgroundColor), card: lum(getComputedStyle(document.querySelector(".tb-card")).backgroundColor), txt: lum(getComputedStyle(document.querySelector(".tb-card .tb-meta")).color) }; });
    assert.ok(c.bg < 0.2 && c.card < 0.3 && c.txt > 0.5, JSON.stringify(c));
    await context.close();
  });

  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
