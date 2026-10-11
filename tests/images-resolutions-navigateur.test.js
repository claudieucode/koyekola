// Résolution d'image dans l'éditeur (Chrome réel, vrai serveur) : le contrôle propose les tailles réellement disponibles,
// le canevas change immédiatement, le choix est enregistré, relu après rechargement, sans erreur de script ni remontage du canevas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null, sharp = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
try { sharp = require("sharp"); } catch { /* sharp absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME || !sharp ? "Playwright, Chrome ou sharp absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("résolution d'image : éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id, media;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft);
  const imageNode = () => draft().sections[0].children[0].children[0];
  const frameSrc = () => page.evaluate(() => { const i = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="imag00000001"] img'); return i ? i.getAttribute("src") : null; });
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
  };
  const select = async () => { await page.locator('[data-pb-layers] .pb-node[data-id="imag00000001"] > .pb-row-item').click(); await page.locator("[data-pb-resolution] select").waitFor({ timeout: 8000 }); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const buf = await sharp({ create: { width: 1400, height: 900, channels: 3, background: { r: 10, g: 90, b: 180 } } }).jpeg().toBuffer();
    const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/jpeg" }), "grande.jpg");
    const up = await boss.request("/marketing/site-web/mediatheque/televerser", { method: "POST", multipart: fd });
    assert.equal(up.status, 201, up.text); media = JSON.parse(up.text).media;
    const created = await boss.post("/marketing/pages", { name: "Résolution éditeur", template: "", ouvrir: "editeur" });
    id = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { title: "x", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "imag00000001", type: "image", props: { src: media.path, alt: "Grande" } }] }] }] } } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le contrôle propose l'original (dimensions réelles) puis uniquement les tailles plus petites, plus « Adaptative »", async () => {
    await select();
    const opts = await page.locator("[data-pb-resolution] select option").allInnerTexts();
    assert.match(opts[0], /Taille originale \(1400 × 900 px\)/);
    assert.deepEqual(opts.slice(1).map((o) => o.replace(/ \(.*/, "")), ["Miniature", "Petite", "Moyenne", "Grande", "Adaptative"], "pas de « Très grande » (1600 px) : plus grande que l'original de 1400 px");
  });

  test("choisir « Moyenne » : le canevas charge la version 640 px tout de suite, le choix est enregistré, et le canevas n'est pas remonté", async () => {
    await page.evaluate(() => { window.__frameBefore = document.querySelector("[data-pb-frame]"); });
    await page.locator("[data-pb-resolution] select").selectOption("medium");
    await until(async () => /\/v\/640\//.test((await frameSrc()) || ""), { what: "version 640 dans le canevas" });
    await until(() => imageNode().props.size === "medium", { what: "choix enregistré" });
    assert.equal(await page.evaluate(() => window.__frameBefore === document.querySelector("[data-pb-frame]")), true);
    const w = await page.evaluate(() => { const i = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="imag00000001"] img'); return i.complete ? i.naturalWidth : 0; });
    assert.ok(w === 0 || w === 640, `largeur chargée : ${w}`);
  });

  test("rechargement : le choix est restauré dans le contrôle et dans le canevas ; revenir à l'original le retire", async () => {
    await open(); await select();
    assert.equal(await page.locator("[data-pb-resolution] select").inputValue(), "medium");
    assert.match((await frameSrc()) || "", /\/v\/640\//);
    await page.locator("[data-pb-resolution] select").selectOption("full");
    await until(async () => (await frameSrc()) === media.path, { what: "original dans le canevas" });
    await until(() => imageNode().props.size === undefined, { what: "choix retiré" });
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
