// Theme Builder — identité Kolakisa, retour, aperçu réel, modes grille/liste, miniatures à la demande, préférences (Chrome réel via Playwright, ignoré sans).
// Le serveur est réel ; les 26 modèles du site « Alpha » servent aussi à comparer le poids de la liste complète et de la liste légère.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : interface du Theme Builder non exécutée sur cette machine" : false;
const N = 26;

describe("Theme Builder : identité Kolakisa, retour, aperçu, grille/liste", { skip: SKIP }, () => {
  let srv, boss, browser, siteA, siteB, errors = [], first;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const url = (s, q = "") => `${srv.base}${U(s)}${q}`;
  const json = (r) => JSON.parse(r.text);
  const open = async (opt = {}) => {
    errors.length = 0;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opt }); await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(20000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    siteA = await mk("Site Alpha"); siteB = await mk("Site Bravo");
    for (let i = 0; i < N; i += 1) { const r = await boss.request(U(siteA, "/api/modeles"), { method: "POST", json: { type: i % 2 ? "single_page" : "header", name: `Modèle ${String(i).padStart(2, "0")}` } }); const t = json(r).template; if (!first) first = t; }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("liste légère et miniature à la demande : la liste n'ouvre aucun document, la miniature renvoie le filaire d'un seul modèle, d'un seul site", async () => {
    const full = await boss.get(U(siteA, "/api/modeles")), light = await boss.get(U(siteA, "/api/modeles?leger=1"));
    const f = json(full), l = json(light);
    assert.equal(f.templates.length, N); assert.equal(l.templates.length, N);
    assert.ok(f.templates.every((t) => t.thumb) && l.templates.every((t) => !t.thumb), "la version légère ne contient aucune miniature");
    assert.ok(l.templates.every((t) => t.previewUrl && t.editUrl), "mais garde les liens d'aperçu et d'édition");
    assert.ok(light.text.length < full.text.length * 0.8, `poids : ${light.text.length} octets contre ${full.text.length}`);
    const m = json(await boss.get(U(siteA, `/api/modeles/${first.id}/miniature`)));
    assert.match(m.thumb, /^<svg /); assert.equal(m.documentMissing, false);
    assert.equal((await boss.get(U(siteB, `/api/modeles/${first.id}/miniature`))).status, 404, "un autre site ne lit pas la miniature");
    // mesure indicative (non bloquante) : médiane de 9 requêtes
    const med = async (p) => { const t = []; for (let i = 0; i < 9; i += 1) { const s = process.hrtime.bigint(); await boss.get(p); t.push(Number(process.hrtime.bigint() - s) / 1e6); } return t.sort((a, b) => a - b)[4]; };
    const a = await med(U(siteA, "/api/modeles")), b = await med(U(siteA, "/api/modeles?leger=1"));
    console.log(`MESURE liste de ${N} modèles : complète ${a.toFixed(1)} ms / ${full.text.length} o ; légère ${b.toFixed(1)} ms / ${light.text.length} o`);
  });

  test("identité : barre marine Kolakisa, titre en police d'affichage, pas de bleu Elementor, jetons de la charte (clair et sombre)", async () => {
    const { context, page } = await open();
    await page.goto(url(siteB)); await page.waitForSelector("#tb-types button"); await page.waitForSelector(".tb-tcard");
    const c = await page.evaluate(() => { const g = (s, p) => getComputedStyle(document.querySelector(s))[p]; return { bar: g(".tb-bar", "backgroundColor"), logo: g(".tb-logo", "backgroundColor"), h1: g("#tb-title", "fontFamily"), radius: g(".tb-tcard", "borderTopLeftRadius") }; });
    assert.equal(c.bar, "rgb(6, 25, 42)", "barre = marine profond de la charte"); assert.equal(c.logo, "rgb(2, 119, 182)", "logo = bleu d'action");
    assert.equal(c.radius, "12px"); assert.ok(/Bricolage|system-ui|sans-serif/.test(c.h1));
    await page.evaluate(() => document.documentElement.setAttribute("data-kola-theme", "dark"));
    const d = await page.evaluate(() => getComputedStyle(document.querySelector(".tb")).backgroundColor);
    assert.equal(d, "rgb(13, 21, 36)", "mode sombre : fond de la charte, pas de blanc forcé");
    assert.deepEqual(errors, []); await context.close();
  });

  test("miniatures différées : seules les cartes visibles demandent leur miniature, le défilement charge les autres", async () => {
    const { context, page } = await open(); const asked = new Set();
    page.on("request", (r) => { const m = r.url().match(/modeles\/(\d+)\/(?:miniature|vignette)/); if (m) asked.add(m[1]); });
    await page.goto(url(siteA)); await page.waitForSelector(".tb-card"); await page.waitForFunction(() => document.querySelectorAll('.tb-thumb[data-state="ok"]').length >= 3);
    await page.waitForTimeout(400);
    const first = asked.size; assert.ok(first > 0 && first < N, `demandées au premier affichage : ${first} sur ${N}`);
    for (let y = 0; y < 12; y += 1) { await page.evaluate((k) => { const m = document.querySelector(".tb-main"); m.scrollTop = k * 500; }, y); await page.waitForTimeout(120); }
    await page.waitForFunction((n) => document.querySelectorAll('.tb-thumb[data-state="ok"]').length >= n, N, { timeout: 15000 });
    assert.ok(asked.size >= N - 1, `après défilement : ${asked.size}`);
    console.log(`MESURE miniatures : ${first}/${N} requêtes au premier affichage, ${asked.size}/${N} après défilement`);
    assert.deepEqual(errors, []); await context.close();
  });

  test("grille et liste : bascule instantanée, mêmes données et actions, choix conservé à la navigation et après rechargement ; raccourci v", async () => {
    const { context, page } = await open();
    await page.goto(url(siteA)); await page.waitForSelector(".tb-card");
    assert.equal(await page.locator("#tb-cards").getAttribute("data-view"), "grid"); assert.equal(await page.locator("article.tb-card").count(), N);
    await page.click("#tb-v-list"); await page.waitForSelector("table.tb-table");
    assert.equal(await page.locator("#tb-v-list").getAttribute("aria-pressed"), "true"); assert.equal(await page.locator("tr.tb-card").count(), N);
    const heads = await page.locator("table.tb-table th").allInnerTexts(); assert.deepEqual(heads.map((h) => h.toLowerCase()), ["modèle", "type", "état", "s'affiche", "modifié", "actions"]);
    const row = page.locator("tr.tb-card").first(); assert.match(await row.innerText(), /Modèle \d\d[\s\S]*Brouillon/);
    for (const b of ["Modifier", "Aperçu"]) assert.ok(await row.getByText(b, { exact: true }).count() >= 1, b);
    await page.click('#tb-types button:has-text("En-tête")'); await page.waitForFunction(() => document.getElementById("tb-title").textContent === "En-tête");
    assert.equal(await page.locator("#tb-cards").getAttribute("data-view"), "list", "le mode survit à la navigation");
    await page.reload(); await page.waitForSelector("tr.tb-card"); assert.equal(await page.locator("#tb-v-list").getAttribute("aria-pressed"), "true", "le mode survit au rechargement");
    await page.keyboard.press("v"); await page.waitForSelector("article.tb-card"); assert.equal(await page.locator("#tb-v-grid").getAttribute("aria-pressed"), "true");
    // la même page en liste sur téléphone : fiches empilées, pas de défilement horizontal
    await page.setViewportSize({ width: 390, height: 800 }); await page.click("#tb-v-list"); await page.waitForSelector("tr.tb-card");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true);
    assert.deepEqual(errors, []); await context.close();
  });

  test("retour : bouton réel (catégorie → toutes les parties), historique du navigateur, adresse partageable, garde contre la perte de saisie", async () => {
    const { context, page } = await open();
    await page.goto(url(siteA)); await page.waitForSelector(".tb-card");
    assert.equal(await page.locator("#tb-back").isHidden(), true, "pas de retour à la racine");
    await page.click('#tb-types button:has-text("En-tête")'); await page.waitForFunction(() => document.getElementById("tb-title").textContent === "En-tête");
    assert.match(page.url(), /\?type=header/); assert.equal(await page.locator("#tb-back").isVisible(), true);
    await page.fill("#tb-q", "Modèle 04"); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length === 1); assert.match(page.url(), /q=Mod/);
    await page.click("#tb-back");
    await page.waitForFunction(() => document.getElementById("tb-title").textContent.startsWith("Personnalisez"));
    assert.doesNotMatch(page.url(), /type=/, "retour à la vue précédente");
    await page.goForward(); await page.waitForFunction(() => document.getElementById("tb-title").textContent === "En-tête"); // Suivant du navigateur : retrouve la catégorie
    await page.goBack(); await page.waitForFunction(() => document.getElementById("tb-title").textContent.startsWith("Personnalisez")); // Précédent : retour aux parties
    await page.goto(url(siteA, "?type=single_page")); await page.waitForFunction(() => document.getElementById("tb-title").textContent === "Page individuelle"); // adresse copiée = même vue
    // garde : conditions modifiées puis tentative de navigation par Précédent → confirmation, refus = on reste
    const asked = []; page.on("dialog", (d) => { asked.push(d.message()); d.dismiss(); });
    await page.locator(".tb-card").first().getByText("Conditions").click(); await page.waitForSelector("#tb-dlg-cond[open]");
    await page.click("#tb-add-inc"); await page.keyboard.press("Escape");
    await page.waitForTimeout(200); assert.equal(await page.locator("#tb-dlg-cond").evaluate((d) => d.open), true, "Échap refusé : la fenêtre modifiée reste ouverte");
    assert.ok(asked.some((m) => /pas enregistrées/.test(m)), "confirmation demandée");
    page.removeAllListeners("dialog"); page.on("dialog", (d) => d.accept()); await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("tb-dlg-cond").open);
    assert.deepEqual(errors, []); await context.close();
  });

  test("aperçu réel : le modèle enregistré s'affiche dans une vue dédiée, 3 largeurs d'appareil, retour à la liste ; page d'exemple pour un composant", async () => {
    const { context, page } = await open();
    await boss.request("/marketing/pages", { method: "POST", form: { name: "Accueil Alpha", site_id: siteA, kind: "page" } });
    await page.goto(url(siteA, "?type=header")); await page.waitForSelector(".tb-card");
    await page.locator(".tb-card").first().getByRole("button", { name: /Aperçu de/ }).click(); await page.waitForSelector("#tb-prev[open]");
    assert.match(await page.locator("#tb-prev-h").innerText(), /Aperçu — Modèle/);
    await page.waitForFunction(() => document.getElementById("tb-prev-load").hidden, null, { timeout: 30000 });
    const src = await page.locator("#tb-prev-frame").getAttribute("src"); assert.match(src, /\/marketing\/site-web\/composants\/\d+\/apercu/);
    assert.equal(await page.locator("#tb-prev-pagew").isVisible(), true, "un composant se prévisualise dans une page d'exemple");
    const w = {}; for (const d of ["desktop", "tablet", "mobile"]) { await page.click(`.tb-devices [data-dev="${d}"]`); w[d] = await page.evaluate(() => Math.round(document.getElementById("tb-prev-frame").getBoundingClientRect().width)); }
    assert.ok(w.desktop > w.tablet && w.tablet > w.mobile, JSON.stringify(w)); assert.ok(w.mobile <= 400);
    assert.equal(await page.locator('.tb-devices [data-dev="mobile"]').getAttribute("aria-pressed"), "true");
    assert.match(await page.locator("#tb-prev-edit").getAttribute("href"), /composants\/\d+\/editeur/);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => !document.getElementById("tb-prev").open);
    assert.equal(await page.locator("#tb-prev-frame").getAttribute("src"), null, "l'aperçu libère la page chargée");
    // modèle de type page : aperçu direct de la page enregistrée
    await page.goto(url(siteA, "?type=single_page")); await page.waitForSelector(".tb-card");
    await page.locator(".tb-card").first().getByRole("button", { name: /Aperçu de/ }).click(); await page.waitForSelector("#tb-prev[open]");
    assert.match(await page.locator("#tb-prev-frame").getAttribute("src"), /\/marketing\/pages\/\d+\/apercu/); assert.equal(await page.locator("#tb-prev-pagew").isHidden(), true);
    await page.click("#tb-prev-back"); await page.waitForFunction(() => !document.getElementById("tb-prev").open);
    assert.deepEqual(errors, []); await context.close();
  });

  test("raccourcis et mouvement réduit : / cherche, n crée, Échap efface ; aucune animation avec prefers-reduced-motion", async () => {
    const { context, page } = await open({ reducedMotion: "reduce" });
    await page.goto(url(siteA)); await page.waitForSelector(".tb-card");
    await page.keyboard.press("/"); assert.equal(await page.evaluate(() => document.activeElement.id), "tb-q");
    await page.keyboard.type("zzz"); await page.waitForSelector("#tb-cards .tb-empty"); assert.match(await page.locator("#tb-cards").innerText(), /Aucun modèle ne correspond/);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => document.querySelectorAll(".tb-card").length > 0);
    await page.locator("body").click({ position: { x: 5, y: 300 } }); await page.keyboard.press("n"); await page.waitForSelector("#tb-dlg-new[open]"); await page.keyboard.press("Escape");
    const an = await page.evaluate(() => { const c = document.querySelector(".tb-card"); const s = getComputedStyle(c); return { anim: s.animationName, dur: s.animationDuration, opacity: s.opacity, tr: getComputedStyle(document.querySelector(".tb-side button")).transitionDuration }; });
    assert.equal(an.anim, "none"); assert.equal(an.opacity, "1"); assert.match(an.tr, /^0s/);
    assert.deepEqual(errors, []); await context.close();
  });
});
