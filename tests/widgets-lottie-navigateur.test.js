// Animation Lottie dans un VRAI Chrome : la bibliothèque est chargée à la demande (pas au chargement de la page), l'animation est réellement lue
// (SVG dessiné, images qui avancent), démarrage au survol / au clic / à l'arrivée à l'écran, « réduire les animations » = première image sans lecture,
// adresse introuvable = état d'erreur sans casser la page. Ignoré si Playwright ou Chrome sont absents.
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
const ANIM = { v: "5.5.7", fr: 30, ip: 0, op: 90, w: 100, h: 100, nm: "t", ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: "s", sr: 1, ks: { o: { a: 0, k: 100 }, r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 90, s: [360] }] }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, ao: 0, shapes: [{ ty: "gr", it: [{ ty: "rc", d: 1, s: { a: 0, k: [40, 40] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 } }, { ty: "fl", c: { a: 0, k: [1, 0, 0, 1] }, o: { a: 0, k: 100 } }, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }], ip: 0, op: 90, st: 0, bounds: { l: 0, t: 0, b: 100, r: 100 } }] };

describe("animation Lottie (navigateur)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug;
  const lot = (id, extra, y = 0) => ({ id, type: "lottie", props: { src: "https://anim.exemple.test/a.json", alt: `Animation ${id}`, trigger: "viewport", loop: true, speed: 1, height: 200, align: "center", ...extra }, ...(y ? {} : {}) });
  const spacer = (id) => ({ id, type: "spacer", props: { size: "128" } });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const id = Number((await boss.post("/marketing/pages", { name: "Lottie" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [
      lot("lotload00001", { trigger: "load" }), spacer("spc000000001"), spacer("spc000000002"), spacer("spc000000003"), spacer("spc000000004"), spacer("spc000000005"), spacer("spc000000006"), spacer("spc000000007"), spacer("spc000000008"),
      lot("lothover0001", { trigger: "hover" }), lot("lotclick0001", { trigger: "click", loop: false }), lot("lotview00001", { trigger: "viewport" }), lot("loterror0001", { src: "https://anim.exemple.test/absente.json" })] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });
  const open = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 700 }, ...opts });
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    const hits = [];
    await page.route("https://anim.exemple.test/**", (route) => { hits.push(route.request().url()); if (/absente/.test(route.request().url())) return route.fulfill({ status: 404, body: "" }); return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(ANIM) }); });
    await page.goto(`${srv.base}/p/${slug}`);
    return { page, errors, hits, ctx };
  };
  const state = (page, id) => page.evaluate((id) => { const e = document.querySelector(`.kw-n-${id} [data-kw-lottie]`); return e ? e.getAttribute("data-kw-state") : null; }, id);
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };

  test("chargement à la demande : la page charge la bibliothèque et l'animation « au chargement » seulement ; celles plus bas attendent d'être proches de l'écran", async () => {
    const { page, errors } = await open();
    await until(async () => (await state(page, "lotload00001")) === "playing", "animation « au chargement » lue");
    assert.equal(await page.evaluate(() => !!window.lottie), true, "bibliothèque chargée");
    assert.equal(await state(page, "lothover0001"), null, "l'animation du bas n'est pas démarrée");
    assert.equal(await page.evaluate(() => document.querySelectorAll('.kw-n-lotload00001 svg').length), 1, "SVG dessiné");
    // les images avancent réellement
    const f1 = await page.evaluate(() => document.querySelector(".kw-n-lotload00001 [data-kw-lottie]")._kwAnim.currentFrame);
    await wait(400);
    const f2 = await page.evaluate(() => document.querySelector(".kw-n-lotload00001 [data-kw-lottie]")._kwAnim.currentFrame);
    assert.notEqual(f1, f2, "l'animation avance");
    assert.deepEqual(errors, []);
    await page.close();
  });

  test("arrivée à l'écran, survol et clic : démarrage au bon moment, pause au départ du survol", async () => {
    const { page, errors } = await open();
    await page.locator(".kw-n-lothover0001").scrollIntoViewIfNeeded();
    await until(async () => (await state(page, "lothover0001")) === "loaded", "animation du survol chargée (en attente)");
    const hover = page.locator(".kw-n-lothover0001 [data-kw-lottie]");
    await hover.hover(); await until(async () => (await state(page, "lothover0001")) === "playing", "lecture au survol");
    await page.mouse.move(2, 2); await until(async () => (await state(page, "lothover0001")) === "paused", "pause au départ de la souris");
    const click = page.locator(".kw-n-lotclick0001 [data-kw-lottie]");
    await click.scrollIntoViewIfNeeded(); await until(async () => (await state(page, "lotclick0001")) === "loaded", "animation du clic chargée");
    await click.click(); await until(async () => (await state(page, "lotclick0001")) === "playing", "lecture au clic");
    await click.click(); await until(async () => (await state(page, "lotclick0001")) === "paused", "pause au second clic");
    await page.locator(".kw-n-lotview00001").scrollIntoViewIfNeeded(); await until(async () => (await state(page, "lotview00001")) === "playing", "lecture à l'arrivée à l'écran");
    assert.deepEqual(errors, []);
    await page.close();
  });

  test("adresse introuvable : état d'erreur sans casser la page ; « réduire les animations » : première image, aucune lecture", async () => {
    const a = await open();
    await a.page.locator(".kw-n-loterror0001").scrollIntoViewIfNeeded();
    await until(async () => (await state(a.page, "loterror0001")) === "error", "état d'erreur");
    assert.equal(await state(a.page, "lotload00001"), "playing", "les autres animations ne sont pas touchées");
    assert.deepEqual(a.errors, []);
    await a.page.close();
    const r = await open({ reducedMotion: "reduce" });
    await until(async () => (await state(r.page, "lotload00001")) === "loaded", "chargée sans lecture");
    await wait(500);
    assert.equal(await state(r.page, "lotload00001"), "loaded", "pas de lecture");
    assert.equal(await r.page.evaluate(() => document.querySelector(".kw-n-lotload00001 [data-kw-lottie]")._kwAnim.isPaused), true);
    await r.page.close();
  });

  test("performance : une page sans animation Lottie ne télécharge jamais la bibliothèque", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Sans Lottie" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [{ id: "hed000000001", type: "heading", props: { text: "Une page simple", level: "2" } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const plain = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const ctx = await browser.newContext(); const page = await ctx.newPage(); const urls = [];
    page.on("request", (r) => urls.push(r.url()));
    await page.goto(`${srv.base}/p/${plain}`); await page.waitForTimeout(1500);
    assert.equal(urls.some((u) => /\/vendor\/lottie/.test(u)), false, "aucune requête vers la bibliothèque");
    assert.equal(await page.evaluate(() => !!window.lottie), false);
    await ctx.close();
  });
});
