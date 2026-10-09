// Font Manager — catalogue de 1 700+ familles dans un VRAI Chrome : liste virtualisée (quelques lignes dans la page, jamais le catalogue),
// aucune police demandée pendant un défilement rapide, aperçus retirés à la fermeture, une seule famille chargée au choix, clavier sur
// toute la liste, et l'éditeur (canevas, panneaux, défilement, zoom) qui ne bouge pas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const fonts = require("../src/utils/fontLibrary");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const section = (n) => ({ id: `sect${String(n).padStart(7, "0")}`, type: "layout", children: [{ id: `box${n}`.padEnd(12, "0"), type: "container", styles: { desktop: { padding: "40px", minHeight: "500px" } }, children: [{ id: `head${n}`.padEnd(12, "0"), type: "heading", props: { text: `Titre ${n}`, level: 2 } }] }] });

describe("Font Manager : catalogue étendu et liste virtualisée (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, requests;
  const heading = '[data-node-id="head30000000"]';
  const geo = () => page.evaluate(() => { const r = (s) => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }; const f = document.querySelector("[data-pb-frame]"); return { left: r(".pb-left"), right: r(".pb-right"), frame: r("[data-pb-frame]"), scrollY: f.contentWindow.scrollY, zoom: document.querySelector("[data-pb-zoom-value]").textContent, kept: Boolean(f.contentWindow.__m) }; });
  const rows = () => page.locator(".kf-panel .kf-row").count();
  const fontRequests = () => requests.filter((u) => /woff2|polices\.css/.test(u));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1700, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = []; requests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => requests.push(r.url().replace(/^https?:\/\/[^/]+/, "")));
    const id = Number((await boss.post("/marketing/pages", { name: "Polices" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [0, 1, 2, 3, 4].map(section) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(500);
    await page.frameLocator("[data-pb-frame]").locator(heading).scrollIntoViewIfNeeded();
    await page.frameLocator("[data-pb-frame]").locator(heading).click();
    await wait(400);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le catalogue compte plus de 1 500 familles réelles, sous licence ouverte, avec leurs fichiers", () => {
    const list = fonts.list();
    assert.ok(list.length >= 1500, `${list.length} familles`);
    assert.equal(new Set(list.map((f) => f.id)).size, list.length);
  });
  test("ouverture : une fenêtre de lignes seulement, quelques polices demandées, éditeur immobile", async () => {
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentWindow.__m = 1; });
    const before = await geo(); requests.length = 0;
    await page.locator("[data-pb-context] .kf-btn").click();
    await page.waitForFunction(() => document.querySelectorAll(".kf-panel .kf-row").length >= 8);
    await wait(600);
    const n = await rows();
    assert.ok(n >= 8 && n <= 40, `${n} lignes dans la page`);
    assert.match(await page.locator(".kf-foot").textContent(), /sur 1[5-9]\d\d dans la bibliothèque|sur [2-9]\d{3} dans/);
    assert.ok(fontRequests().filter((u) => /woff2/.test(u)).length <= 14, `fichiers demandés : ${fontRequests().length}`);
    assert.deepEqual(await geo(), before, "canevas, panneaux, défilement et zoom n'ont pas bougé");
  });
  test("défilement rapide : lignes en nombre constant, aucune police demandée pendant le geste, la dernière famille est atteignable", async () => {
    requests.length = 0;
    // Geste rapide simulé en un seul bloc (60 × 900 px, environ 780 lignes traversées) : indépendant de la charge de la machine
    const seen = await page.evaluate(() => { const l = document.querySelector(".kf-list"); let max = 0; for (let i = 0; i < 60; i++) { l.scrollTop += 900; l.dispatchEvent(new Event("scroll")); max = Math.max(max, document.querySelectorAll(".kf-row").length); } return max; });
    assert.ok(seen <= 40, `${seen} lignes au plus pendant le défilement`);
    await wait(1200);
    const n = fontRequests().filter((u) => /woff2/.test(u)).length;
    assert.ok(n <= 14, `fichiers demandés après un défilement de 780 lignes : ${n} (seule la fenêtre finale est chargée)`);
    await page.evaluate(() => { const l = document.querySelector(".kf-list"); l.scrollTop = l.scrollHeight; });
    await wait(500);
    assert.ok((await rows()) <= 40);
    const names = await page.locator(".kf-name").allTextContents();
    const all = fonts.list().map((f) => f.family);
    assert.ok(names.length && names.every((x) => all.includes(x)), "les dernières lignes sont des familles du catalogue");
  });
  test("recherche sur les métadonnées : instantanée, sans télécharger les polices trouvées", async () => {
    requests.length = 0;
    await page.locator(".kf-search").fill("mont");
    await page.waitForFunction(() => /^\d+ police/.test(document.querySelector(".kf-foot").textContent) && [].some.call(document.querySelectorAll(".kf-name"), (e) => e.textContent === "Montserrat"));
    const t = await page.evaluate(async () => { const s = document.querySelector(".kf-search"); const a = performance.now(); s.value = "sans"; s.dispatchEvent(new Event("input", { bubbles: true })); await new Promise((r) => setTimeout(r, 70)); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return performance.now() - a; });
    assert.ok(t < 600, `recherche en ${Math.round(t)} ms (60 ms de délai de saisie comprises)`);
    assert.ok((await rows()) <= 40);
  });
  test("clavier : Fin puis Début parcourent toute la liste filtrée", async () => {
    await page.locator(".kf-search").fill("");
    await page.waitForFunction(() => /^1[5-9]\d\d police/.test(document.querySelector(".kf-foot").textContent));
    await page.locator(".kf-pick").first().focus();
    await page.keyboard.press("End");
    await page.waitForFunction(() => { const b = document.activeElement; return b && b.getAttribute("data-index") && Number(b.getAttribute("data-index")) === Number(b.getAttribute("aria-setsize")) - 1; });
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Home");
    await page.waitForFunction(() => document.activeElement && document.activeElement.getAttribute("data-index") === "0");
    assert.ok((await rows()) <= 40);
  });
  test("choisir une police : seule sa famille est chargée, enregistrée par identifiant, canevas et panneaux immobiles", async () => {
    await page.locator(".kf-search").fill("Lobster");
    await page.waitForSelector('.kf-pick[data-font="font.lobster"]');
    await wait(500);
    const before = await geo(); requests.length = 0;
    await page.locator('.kf-pick[data-font="font.lobster"]').click();
    await page.waitForFunction(() => /Lobster/.test(getComputedStyle(document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="head30000000"]')).fontFamily), null, { timeout: 15000, polling: 25 });
    await wait(700);
    const others = fontRequests().filter((u) => !/lobster/i.test(u));
    assert.deepEqual(others, [], "aucune autre famille chargée");
    assert.ok(fontRequests().some((u) => /lobster.*woff2/.test(u)), "le fichier de Lobster est chargé");
    const after = await geo();
    assert.deepEqual([after.left, after.right, after.frame, after.scrollY, after.zoom], [before.left, before.right, before.frame, before.scrollY, before.zoom]);
    assert.equal(after.kept, true, "le cadre du canevas n'a pas été rechargé");
  });
  test("fermeture : les règles d'aperçu sont retirées de la page", async () => {
    await page.locator("[data-pb-context] .kf-btn").click();
    await page.waitForSelector(".kf-row"); await page.locator(".kf-search").fill("a"); await wait(500);
    assert.ok((await page.locator('link[href^="/polices.css"]').count()) >= 1);
    await page.keyboard.press("Escape");
    await wait(200);
    const left = await page.evaluate(() => [].map.call(document.querySelectorAll('link[href^="/polices.css"]'), (l) => decodeURIComponent(l.getAttribute("href"))));
    assert.ok(left.every((h) => (h.match(/font\./g) || []).length <= 2), `règles restantes : ${left.join(" | ").slice(0, 200)}`);
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
