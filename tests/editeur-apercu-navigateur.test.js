// Éditeur de pages — APERÇU (vrai Chrome) : l'apparence habituelle de la fenêtre est conservée (largeur plafonnée à 1400 px, hauteur 100vh - 48 px,
// en-tête d'origine) et un seul bouton s'ajoute : Plein écran (même fenêtre redimensionnée, appareil / défilement / éditeur inchangés, Échap sort du plein écran).
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
const ID = (s) => (s + "x").padEnd(12, "0");
const section = (n, text) => ({ id: ID("sec" + n), type: "layout", children: [{ id: ID("con" + n), type: "container", children: [{ id: ID("hd" + n), type: "heading", props: { text, level: 2 } }, { id: ID("tx" + n), type: "text", props: { html: "<p>Paragraphe " + n + "</p>" } }] }] });
const SHORT = { sections: [section(1, "Titre de l'aperçu")] };
const LONG = { sections: Array.from({ length: 30 }, (_, i) => { const sec = section(i + 1, "Section " + (i + 1)); sec.children[0].children.push({ id: ID("sp" + (i + 1)), type: "spacer", props: { height: 400 } }); return sec; }) };

describe("aperçu de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const mkPage = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, `${name} : ${JSON.stringify(r.body || r.text || "").slice(0, 300)}`);
    return id;
  };
  const open = async (pageId, viewport = { width: 1920, height: 1080 }, opts = {}) => {
    const ctx = await browser.newContext({ viewport, ...opts });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }, null, { timeout: 30000 });
    await wait(500);
    return { ctx, page, errors };
  };
  const isOpen = (page) => page.evaluate(() => document.querySelector("[data-pb-preview-dialog]").open);
  const showPreview = async (page) => { await page.locator("[data-pb-preview]").click(); await page.waitForFunction(() => { const d = document.querySelector("[data-pb-preview-dialog]"); const f = document.querySelector("[data-pb-preview-frame]"); return d.open && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0 && /apercu/.test(f.src); }, null, { timeout: 15000 }); await wait(300); };
  const box = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom }; }, sel);
  let shortId, longId, emptyId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    shortId = await mkPage("Aperçu court", SHORT); longId = await mkPage("Aperçu long", LONG); emptyId = await mkPage("Aperçu vide", { sections: [] });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("apparence d'origine : 1400 px de large au plus, 100vh - 48 px de haut, en-tête d'origine avec ses boutons à leur place + un seul bouton ajouté", async () => {
    const { ctx, page, errors } = await open(shortId);
    await showPreview(page);
    const d = await box(page, "[data-pb-preview-dialog]");
    assert.equal(Math.round(d.w), 1400); assert.equal(Math.round(d.h), 1080 - 48);
    const head = await page.evaluate(() => [...document.querySelectorAll(".pb-preview-modal .pb-modal-head > *")].map((e) => e.getAttribute("data-preview-device") || e.getAttribute("data-pb-preview-full") !== null && "full" || e.getAttribute("data-pb-close") !== null && "close" || e.className || e.tagName));
    assert.deepEqual(head, ["H2", "pb-devices", "pb-modal-spacer", "btn btn-ghost btn-sm", "full", "close"].map((x, i) => (i === 1 ? "pb-devices" : x)), head.join(" | "));
    assert.equal(await page.locator(".pb-preview-modal a").innerText(), "Ouvrir dans un onglet");
    assert.equal(await page.locator("[data-pb-preview-full]").getAttribute("aria-label"), "Plein écran");
    const f = await box(page, "[data-pb-preview-frame]"); assert.ok(f.w <= 1280, `cadre ordinateur plafonné à 1280 (${f.w})`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("plein écran : toute la fenêtre, même appareil, cadre non rechargé ; bouton ou Échap pour sortir ; retour exact à la taille normale", async () => {
    const { ctx, page } = await open(longId);
    await showPreview(page);
    const normal = await box(page, "[data-pb-preview-dialog]");
    for (const dev of ["desktop", "tablet", "mobile"]) {
      await page.locator(`[data-preview-device="${dev}"]`).click(); await wait(100);
      await page.evaluate(() => { document.querySelector("[data-pb-preview-frame]").__same = true; });
      const btn = page.locator("[data-pb-preview-full]");
      await btn.click(); await wait(150);
      const f = await box(page, "[data-pb-preview-dialog]");
      assert.deepEqual([Math.round(f.w), Math.round(f.h)], [1920, 1080], `${dev} : plein écran`);
      assert.equal(await btn.getAttribute("aria-pressed"), "true"); assert.match(await btn.getAttribute("aria-label"), /Quitter le plein écran/);
      assert.equal(await page.locator(`[data-preview-device="${dev}"]`).getAttribute("aria-checked"), "true", "l'appareil reste le même");
      const w = (await box(page, "[data-pb-preview-frame]")).w;
      if (dev === "desktop") assert.ok(w > 1500, `cadre ordinateur plein écran (${w})`); else assert.equal(Math.round(w), dev === "tablet" ? 820 : 390);
      assert.ok(await page.evaluate(() => document.querySelector("[data-pb-preview-frame]").__same === true), "cadre non recréé");
      await btn.click(); await wait(150);
      const back = await box(page, "[data-pb-preview-dialog]");
      assert.deepEqual([back.w, back.h], [normal.w, normal.h], `${dev} : retour exact`);
      assert.equal(await btn.getAttribute("aria-label"), "Plein écran");
    }
    await page.locator("[data-pb-preview-full]").click(); await wait(100);
    await page.locator(".pb-preview-modal .pb-modal-head").click({ position: { x: 300, y: 20 } });
    await page.keyboard.press("Escape"); await wait(100);
    assert.ok(await isOpen(page), "premier Échap : sort du plein écran seulement");
    assert.deepEqual([(await box(page, "[data-pb-preview-dialog]")).w, (await box(page, "[data-pb-preview-dialog]")).h], [normal.w, normal.h]);
    await page.keyboard.press("Escape"); await wait(100);
    assert.ok(!(await isOpen(page)), "second Échap : ferme");
    await page.locator("[data-pb-preview]").click(); await wait(300);
    assert.equal(await page.locator("[data-pb-preview-full]").getAttribute("aria-pressed"), "false", "toujours ouvert en taille normale");
    await ctx.close();
  });

  test("plein écran sur une page longue : le défilement reste celui de l'aperçu ; à la sortie l'éditeur est exactement comme avant", async () => {
    const { ctx, page, errors } = await open(longId);
    const before = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); f.contentWindow.scrollTo(0, 300); return { y: Math.round(f.contentWindow.scrollY), insp: document.querySelector("[data-pb-inspector]").innerHTML.length, scroll: document.scrollingElement.scrollTop, zoom: (document.querySelector("[data-pb-zoom-label]") || {}).textContent }; });
    await showPreview(page);
    await page.locator("[data-pb-preview-full]").click(); await wait(150);
    await page.mouse.move(960, 600); await page.mouse.wheel(0, 1500); await wait(400);
    const s = await page.evaluate(() => ({ inner: document.querySelector("[data-pb-preview-frame]").contentWindow.scrollY, doc: document.scrollingElement.scrollTop, canvas: Math.round(document.querySelector("[data-pb-frame]").contentWindow.scrollY) }));
    assert.ok(s.inner > 300, `l'aperçu défile (${s.inner})`); assert.equal(s.doc, 0); assert.equal(s.canvas, before.y, "le canevas derrière ne bouge pas");
    const kept = await page.evaluate(() => Math.round(document.querySelector("[data-pb-preview-frame]").contentWindow.scrollY));
    await page.locator("[data-pb-preview-full]").click(); await wait(150);
    assert.equal(await page.evaluate(() => Math.round(document.querySelector("[data-pb-preview-frame]").contentWindow.scrollY)), kept, "la position dans l'aperçu est conservée en sortant du plein écran");
    await page.keyboard.press("Escape"); await wait(100);
    const after = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return { y: Math.round(f.contentWindow.scrollY), insp: document.querySelector("[data-pb-inspector]").innerHTML.length, scroll: document.scrollingElement.scrollTop, zoom: (document.querySelector("[data-pb-zoom-label]") || {}).textContent }; });
    assert.deepEqual(after, before);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("fermeture inchangée : X, Échap, focus rendu au bouton Aperçu, cadre vidé", async () => {
    const { ctx, page } = await open(shortId);
    await showPreview(page);
    await page.locator("[data-pb-preview-dialog] [data-pb-close]").click(); await wait(50);
    assert.ok(!(await isOpen(page)));
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-pb-preview")), true);
    assert.match(await page.evaluate(() => document.querySelector("[data-pb-preview-frame]").getAttribute("src")), /about:blank/);
    await showPreview(page); await page.keyboard.press("Escape"); await wait(50);
    assert.ok(!(await isOpen(page)));
    await ctx.close();
  });
});
