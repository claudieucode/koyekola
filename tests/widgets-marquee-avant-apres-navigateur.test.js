// Palier 11 : « Défilement continu » et « Avant / Après » dans un vrai Chrome, sur la page publiée :
// curseur au clavier et au doigt (événements réels), animation, pause, préférence « réduire les animations ».
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

// deux petites images réelles (data URI refusées par le serveur : on sert des pixels depuis le serveur de test via /favicon si besoin) ;
// ici des adresses https quelconques suffisent : la mise en page ne dépend pas du chargement, le cadre a un format fixe
const IMG = "https://exemple.fr/a.jpg", IMG2 = "https://exemple.fr/b.jpg";

describe("Défilement continu et Avant / Après (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, url;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db();
    const id = Number((await boss.post("/marketing/pages", { name: "Palier 11" })).location.match(/(\d+)$/)[1]);
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [
      { id: "wmarquee0001", type: "marquee", props: { items: [{ text: "Alpha" }, { text: "Bêta" }, { text: "Gamma" }], speed: "normal", direction: "left", separator: "•", pauseHover: true, label: "Annonces" } },
      { id: "wbeforeaft01", type: "beforeafter", props: { before: IMG, beforeAlt: "Avant", after: IMG2, afterAlt: "Après", beforeLabel: "Avant", afterLabel: "Après", position: 50, ratio: "16 / 9" } },
    ] }] }] };
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    url = `${srv.base}/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, ...opts });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "load" });
    return { ctx, page, errors };
  };

  test("Avant / Après : le curseur se règle au clavier ; la ligne et le rognage suivent ; aucun script cassé", async () => {
    const { ctx, page, errors } = await open();
    const range = page.locator(".kw-compare-range");
    assert.equal(await page.locator(".kw-compare-stage").evaluate((e) => Math.round(e.getBoundingClientRect().width / e.getBoundingClientRect().height * 100)), 178, "format 16:9");
    await range.focus();
    await page.keyboard.press("Home");
    assert.equal(await page.locator("[data-kw-compare]").evaluate((e) => e.style.getPropertyValue("--kw-cmp-pos")), "0%");
    await page.keyboard.press("End");
    assert.equal(await page.locator("[data-kw-compare]").evaluate((e) => e.style.getPropertyValue("--kw-cmp-pos")), "100%");
    for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowLeft");
    assert.equal(await page.locator("[data-kw-compare]").evaluate((e) => e.style.getPropertyValue("--kw-cmp-pos")), "80%");
    // la ligne est réellement à 80 % de la largeur de la scène, l'image « Avant » est rognée à droite de cette ligne
    const geo = await page.evaluate(() => { const s = document.querySelector(".kw-compare-stage").getBoundingClientRect(), b = document.querySelector(".kw-compare-bar").getBoundingClientRect(); return { pct: Math.round((b.left + b.width / 2 - s.left) / s.width * 100), clip: getComputedStyle(document.querySelector(".kw-compare-before")).clipPath }; });
    assert.equal(geo.pct, 80); assert.match(geo.clip, /inset\(/);
    assert.equal(await range.getAttribute("aria-label").then((x) => /Comparer/.test(x)), true);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("Avant / Après : un glisser à la souris déplace le curseur (le champ natif couvre la scène)", async () => {
    const { ctx, page } = await open();
    const box = await page.locator(".kw-compare-stage").boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    const pos = Number((await page.locator("[data-kw-compare]").evaluate((e) => e.style.getPropertyValue("--kw-cmp-pos"))).replace("%", ""));
    assert.ok(pos >= 15 && pos <= 25, `position ${pos}`);
    await ctx.close();
  });

  test("Défilement continu : la piste bouge, la case Pause la fige, la copie de la boucle est cachée aux lecteurs d'écran", async () => {
    const { ctx, page } = await open();
    const x = () => page.locator(".kw-marquee-track").evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
    const a = await x(); await page.waitForTimeout(400); const b = await x();
    assert.notEqual(a, b, "la piste avance");
    assert.ok(b < a, "vers la gauche");
    await page.locator(".kw-marquee-pause").focus(); await page.keyboard.press("Space");
    assert.equal(await page.locator(".kw-marquee-track").evaluate((e) => getComputedStyle(e).animationPlayState), "paused");
    const c = await x(); await page.waitForTimeout(300); assert.equal(await x(), c, "figée");
    assert.equal(await page.locator(".kw-marquee-list[aria-hidden=true]").count(), 1);
    // la boucle est continue : chaque liste couvre au moins la largeur visible
    const w = await page.evaluate(() => ({ view: document.querySelector(".kw-marquee-view").clientWidth, list: document.querySelector(".kw-marquee-list").getBoundingClientRect().width }));
    assert.ok(w.list >= w.view - 1, JSON.stringify(w));
    await ctx.close();
  });

  test("Défilement continu : avec « réduire les animations », rien ne bouge et tous les textes restent lisibles (une seule liste)", async () => {
    const { ctx, page } = await open({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".kw-marquee-track").evaluate((e) => getComputedStyle(e).animationName), "none");
    assert.equal(await page.locator(".kw-marquee-list[aria-hidden=true]").evaluate((e) => getComputedStyle(e).display), "none");
    const visible = await page.locator(".kw-marquee-list:not([aria-hidden=true]) .kw-marquee-item").evaluateAll((els) => els.map((e) => ({ t: e.textContent.trim(), ok: e.getBoundingClientRect().right <= innerWidth + 1 && e.getBoundingClientRect().left >= -1 })));
    assert.equal(visible.length, 3); assert.ok(visible.every((v) => v.ok), JSON.stringify(visible));
    await ctx.close();
  });

  test("mobile 390 px : ni l'un ni l'autre ne fait déborder la page", async () => {
    const { ctx, page } = await open({ viewport: { width: 390, height: 800 } });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await ctx.close();
  });
});
