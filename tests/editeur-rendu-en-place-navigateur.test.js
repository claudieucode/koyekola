// Éditeur de pages — MISE À JOUR DU CANEVAS EN PLACE (vrai Chrome) : une modification ne recharge plus le cadre du canevas
// (le défilement, les images déjà chargées et les écouteurs restent) ; seules les sections modifiées sont remplacées. Ce qui sort
// du cadre simple (sections interactives : onglets…) recharge le cadre en entier, comme avant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const section = (n) => ({ id: `sect${String(n).padStart(7, "0")}`, type: "layout", children: [{ id: `box${n}`.padEnd(12, "0"), type: "container", styles: { desktop: { padding: "40px", minHeight: "600px" } }, children: [
  { id: `head${n}`.padEnd(12, "0"), type: "heading", props: { text: `Titre ${n}`, level: 2 } },
  { id: `text${n}`.padEnd(12, "0"), type: "text", props: { html: `<p>Paragraphe ${n}</p>` } },
] }] });
const CONTENT = { sections: [0, 1, 2, 3, 4, 5].map(section).concat([{ id: "sect0000099", type: "layout", children: [{ id: "tabs00000000", type: "tabs", props: { items: [{ title: "Onglet A", text: "Contenu A" }, { title: "Onglet B", text: "Contenu B" }] } }] }]) };

describe("canevas mis à jour en place (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id;
  const fr = () => page.frameLocator("[data-pb-frame]");
  const mark = () => page.evaluate(() => { document.querySelector("[data-pb-frame]").contentWindow.__m = 1; });
  const survived = () => page.evaluate(() => Boolean(document.querySelector("[data-pb-frame]").contentWindow.__m));
  const heading = (n) => `[data-node-id="${`head${n}`.padEnd(12, "0")}"]`;
  const text = (n) => page.evaluate((sel) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(sel); return e ? e.textContent : null; }, heading(n));
  const until = (fn, what) => page.waitForFunction(fn, null, { timeout: 8000, polling: 25 }).catch(() => { throw new Error("Délai dépassé : " + what); });
  const sections = () => page.evaluate(() => [].map.call(document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-section-id]"), (e) => e.getAttribute("data-section-id")));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 800 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    id = Number((await boss.post("/marketing/pages", { name: "En place" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await page.waitForTimeout(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("changer un texte : le canevas se met à jour sans recharger le cadre, le défilement reste", async () => {
    await fr().locator(heading(4)).scrollIntoViewIfNeeded();
    await fr().locator(heading(4)).click();
    const y = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
    assert.ok(y > 100, `page défilée (${y})`);
    await mark();
    const field = page.locator(".pb-right input[type=text]").first();
    await field.fill("Nouveau titre");
    await page.waitForFunction(() => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="head40000000"]'); return e && e.textContent === "Nouveau titre"; }, null, { timeout: 8000, polling: 25 });
    assert.equal(await survived(), true, "le cadre n'a pas été rechargé");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY), y, "défilement conservé");
    // Les autres sections n'ont pas été touchées, la sélection est restée dessinée
    assert.equal(await text(0), "Titre 0");
    assert.equal(await fr().locator(heading(4)).evaluate((e) => e.classList.contains("is-selected")), true);
  });
  test("dupliquer, annuler, supprimer : éléments ajoutés ou retirés en place, dans le bon ordre", async () => {
    await mark();
    const heads = () => page.evaluate(() => [].map.call(document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="heading"]'), (e) => e.getAttribute("data-node-id")));
    await fr().locator(heading(2)).click();
    const before = await heads();
    await page.keyboard.press("Control+d");
    await page.waitForFunction((n) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="heading"]').length === n + 1, before.length, { timeout: 8000, polling: 25 });
    assert.equal(await survived(), true);
    const dup = await heads();
    assert.deepEqual(dup.filter((h) => before.includes(h)), before, "l'ordre des éléments existants est conservé");
    await page.keyboard.press("Control+z");
    await page.waitForFunction((n) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="heading"]').length === n, before.length, { timeout: 8000, polling: 25 });
    assert.deepEqual(await heads(), before);
    await fr().locator(heading(2)).click();
    await page.keyboard.press("Delete");
    await page.waitForFunction((n) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="heading"]').length === n - 1, before.length, { timeout: 8000, polling: 25 });
    assert.equal(await survived(), true);
    await page.keyboard.press("Control+z");
    await page.waitForFunction((n) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="heading"]').length === n, before.length, { timeout: 8000, polling: 25 });
    assert.deepEqual(await heads(), before);
    assert.equal(await survived(), true);
  });
  test("le canevas en place est identique à un rechargement complet", async () => {
    await page.waitForTimeout(500);
    const same = await page.evaluate(async () => {
      const f = document.querySelector("[data-pb-frame]");
      const live = [].map.call(f.contentDocument.querySelectorAll("[data-section-id]"), (e) => e.outerHTML.replace(/\s+is-selected/g, "").replace(/\s+/g, " "));
      const html = await (await fetch(location.pathname.replace(/\/editeur$/, "/rendu"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: JSON.parse(document.getElementById("pb-boot").textContent).content }) })).text();
      const norm = (h) => h.replace(/\s+is-selected/g, "").replace(/\s+draggable="true"/g, "").replace(/\s+/g, " ").trim();
      const fresh = [].map.call(new DOMParser().parseFromString(html, "text/html").querySelectorAll("[data-section-id]"), (e) => norm(e.outerHTML));
      return { live: live.map(norm), fresh };
    });
    assert.equal(same.live.length, 7);
    // Les onglets sont « améliorés » par landing.js au chargement (classe is-enhanced) : seules les sections simples sont comparées
    // (la section 4 a reçu un nouveau titre, absent du contenu de départ relu ici)
    const keep = [0, 1, 2, 3, 5];
    assert.deepEqual(keep.map((i) => same.live[i]), keep.map((i) => same.fresh[i]));
  });
  test("une section interactive (onglets) recharge le cadre en entier et fonctionne", async () => {
    await mark();
    await fr().locator('[data-node-id="tabs00000000"]').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+d");
    await until(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll('[data-node-type="tabs"]').length === 2, "onglets dupliqués");
    await until(() => !document.querySelector("[data-pb-frame]").contentWindow.__m, "cadre rechargé");
    assert.equal(await survived(), false);
    await until(() => document.querySelector("[data-pb-frame]").contentDocument.body.classList.contains("lp-builder"), "cadre prêt");
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
