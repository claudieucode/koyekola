// Éditeur de pages — APERÇU (vrai Chrome) : grande fenêtre immersive (≈ 98 % de la fenêtre), en-tête de hauteur stable, Ordinateur / Tablette / Mobile
// (la largeur du cadre change vraiment les requêtes média), plein écran (Échap sort d'abord du plein écran), fermeture (X, Échap) avec retour du focus,
// défilement isolé, éditeur inchangé après fermeture, rendu des modifications, page vide / très longue, petit écran, état d'erreur.
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

  test("grande fenêtre : ≈ 98 % de la largeur, ≥ 94 % de la hauteur ; cadre ordinateur pleine largeur ; en-tête de 44 px ; bandeau compact", async () => {
    const { ctx, page, errors } = await open(shortId);
    await showPreview(page);
    for (const [w, h] of [[1920, 1080], [1280, 720]]) {
      await page.setViewportSize({ width: w, height: h }); await wait(200);
      const d = await box(page, "[data-pb-preview-dialog]");
      assert.ok(d.w >= w * 0.97 && d.h >= h * 0.94, `${w}×${h} : boîte ${d.w}×${d.h}`);
      assert.ok(d.x >= 4 && w - d.r >= 4, "une petite marge reste visible");
    }
    await page.setViewportSize({ width: 1920, height: 1080 }); await wait(200);
    const f = await box(page, "[data-pb-preview-frame]"), st = await box(page, ".pb-preview-stage");
    assert.ok(f.w > 1500 && f.w >= st.w - 17, `cadre ordinateur ${f.w} (scène ${st.w}) : plus de plafond à 1280 px`);
    assert.equal((await box(page, ".pb-preview-head")).h, 44);
    const bar = await page.evaluate(() => document.querySelector("[data-pb-preview-frame]").contentDocument.querySelector(".lp-preview-bar").getBoundingClientRect().height);
    assert.ok(bar > 0 && bar <= 30, `bandeau compact (${bar})`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("Ordinateur / Tablette / Mobile : largeur réelle du cadre et requêtes média ; l'en-tête garde sa hauteur", async () => {
    const { ctx, page } = await open(shortId);
    await showPreview(page);
    const m = () => page.evaluate(() => { const f = document.querySelector("[data-pb-preview-frame]"); return { w: Math.round(f.getBoundingClientRect().width), inner: f.contentWindow.innerWidth, mobile: f.contentWindow.matchMedia("(max-width: 767px)").matches, head: document.querySelector(".pb-preview-head").getBoundingClientRect().height, text: f.contentDocument.body.textContent }; });
    const desk = await m(); assert.ok(!desk.mobile && /Titre de l'aperçu/.test(desk.text));
    await page.locator('[data-preview-device="tablet"]').click(); await wait(500);
    const tab = await m(); assert.equal(tab.w, 820); assert.equal(tab.inner, 820 - 0);
    await page.locator('[data-preview-device="mobile"]').click(); await wait(500);
    const mob = await m(); assert.equal(mob.w, 390); assert.ok(mob.mobile, "les requêtes média du mobile s'appliquent");
    assert.equal(await page.locator('[data-preview-device="mobile"]').getAttribute("aria-checked"), "true");
    await page.locator('[data-preview-device="desktop"]').click(); await wait(500);
    const back = await m(); assert.ok(back.w > 1500 && !back.mobile);
    assert.deepEqual([desk.head, tab.head, mob.head, back.head], [44, 44, 44, 44], "la barre ne bouge pas");
    // transition courte : au milieu du passage, la largeur est intermédiaire (pas de saut) et le tout dure moins de 300 ms
    await page.locator('[data-preview-device="tablet"]').click(); await wait(60);
    const mid = await m(); await wait(400);
    assert.ok(mid.w > 820 && mid.w < back.w, `largeur intermédiaire pendant la transition (${mid.w})`);
    await ctx.close();
  });

  test("fermeture : X, Échap ; focus rendu au bouton Aperçu ; cadre vidé ; ouvertures/fermetures répétées sans erreur ; lien d'onglet ; éditeur inchangé", async () => {
    const { ctx, page, errors } = await open(longId);
    const before = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); f.contentWindow.scrollTo(0, 300); return { y: Math.round(f.contentWindow.scrollY), insp: document.querySelector("[data-pb-inspector]").innerHTML.length, scroll: document.scrollingElement.scrollTop, zoom: (document.querySelector("[data-pb-zoom-label]") || {}).textContent }; });
    await showPreview(page);
    const link = page.locator(".pb-preview-open");
    assert.equal(await link.getAttribute("target"), "_blank"); assert.match(await link.getAttribute("href"), new RegExp(`/marketing/pages/${longId}/apercu$`));
    await page.locator('[data-pb-preview-dialog] [data-pb-close]').click(); await wait(50);
    assert.ok(!(await isOpen(page)), "X ferme tout de suite");
    assert.equal(await page.evaluate(() => document.activeElement.hasAttribute("data-pb-preview")), true, "focus rendu au bouton Aperçu");
    assert.match(await page.evaluate(() => document.querySelector("[data-pb-preview-frame]").getAttribute("src")), /about:blank/);
    await showPreview(page); await page.keyboard.press("Escape"); await wait(50);
    assert.ok(!(await isOpen(page)), "Échap ferme");
    for (let i = 0; i < 5; i++) { await page.locator("[data-pb-preview]").click(); await wait(120); await page.keyboard.press("Escape"); await wait(60); }
    await showPreview(page); await page.keyboard.press("Escape"); await wait(100);
    const after = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return { y: Math.round(f.contentWindow.scrollY), insp: document.querySelector("[data-pb-inspector]").innerHTML.length, scroll: document.scrollingElement.scrollTop, zoom: (document.querySelector("[data-pb-zoom-label]") || {}).textContent }; });
    assert.deepEqual(after, before, "défilement du canevas, inspecteur, zoom : identiques");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("défilement isolé sur une page très longue ; la boîte garde sa taille ; l'éditeur derrière ne défile pas", async () => {
    const { ctx, page } = await open(longId);
    const y0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
    await showPreview(page);
    const d0 = await box(page, "[data-pb-preview-dialog]");
    await page.mouse.move(960, 600); await page.mouse.wheel(0, 1500); await wait(400);
    const s = await page.evaluate(() => ({ inner: document.querySelector("[data-pb-preview-frame]").contentWindow.scrollY, doc: document.scrollingElement.scrollTop, canvas: document.querySelector("[data-pb-frame]").contentWindow.scrollY }));
    assert.ok(s.inner > 300, `l'aperçu défile (${s.inner})`);
    assert.equal(s.doc, 0); assert.equal(s.canvas, y0, "le canevas derrière n'a pas bougé");
    const d1 = await box(page, "[data-pb-preview-dialog]"); assert.deepEqual([d1.w, d1.h], [d0.w, d0.h]);
    assert.equal((await box(page, ".pb-preview-head")).h, 44);
    await ctx.close();
  });

  test("plein écran : bouton, Échap sort du plein écran puis ferme ; mémorisé", async () => {
    const { ctx, page } = await open(shortId);
    await showPreview(page);
    const btn = page.locator("[data-pb-preview-full]");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    await btn.click(); await wait(100);
    const f = await box(page, "[data-pb-preview-dialog]");
    assert.deepEqual([Math.round(f.w), Math.round(f.h)], [1920, 1080]);
    assert.equal(await btn.getAttribute("aria-pressed"), "true"); assert.match(await btn.getAttribute("aria-label"), /Quitter/);
    await page.locator('[data-pb-preview-dialog] .pb-preview-head').click({ position: { x: 300, y: 20 } });
    await page.keyboard.press("Escape"); await wait(100);
    assert.ok(await isOpen(page), "premier Échap : sort du plein écran seulement");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    assert.ok((await box(page, "[data-pb-preview-dialog]")).w < 1920);
    await btn.click(); await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await wait(100);
    assert.ok(!(await isOpen(page)), "second Échap : ferme");
    await showPreview(page);
    assert.equal(await page.locator("[data-pb-preview-full]").getAttribute("aria-pressed"), "false", "l'état mémorisé est celui du dernier choix (sorti)");
    await ctx.close();
  });

  test("modification enregistrée puis aperçu : le rendu la reflète ; page vide ; erreur de chargement", async () => {
    const { ctx, page } = await open(shortId);
    await page.evaluate(async ({ id }) => {
      const rev = (await (await fetch(`/marketing/pages/${id}/editeur`)).text()).match(/"revision":\s*(\d+)/);
      window.__rev = rev ? Number(rev[1]) : null;
    }, { id: shortId });
    // on modifie le brouillon côté serveur comme le ferait l'enregistrement automatique, puis on ouvre l'aperçu
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(shortId).revision;
    const changed = { sections: [section(1, "Titre modifié 12345")] };
    assert.equal((await boss.request(`/marketing/pages/${shortId}/brouillon`, { method: "PUT", json: { revision: rev, content: changed }, headers: { Origin: srv.base } })).status, 200);
    await showPreview(page);
    assert.match(await page.evaluate(() => document.querySelector("[data-pb-preview-frame]").contentDocument.body.textContent), /Titre modifié 12345/);
    await page.keyboard.press("Escape");
    await page.route(/\/apercu\?t=/, (r) => r.abort());
    await page.locator("[data-pb-preview]").click(); await wait(800);
    assert.equal(await page.locator("[data-pb-preview-error]").isVisible(), true, "état d'erreur lisible, pas une zone blanche");
    await page.unroute(/\/apercu\?t=/);
    await page.locator("[data-pb-preview-retry]").click(); await wait(1200);
    assert.equal(await page.locator("[data-pb-preview-error]").isVisible(), false, "« Réessayer » recharge");
    await ctx.close();
    const e = await open(emptyId);
    await showPreview(e.page);
    const ok = await e.page.evaluate(() => { const f = document.querySelector("[data-pb-preview-frame]"); const r = f.getBoundingClientRect(); return { w: r.width, h: r.height, err: !document.querySelector("[data-pb-preview-error]").hidden }; });
    assert.ok(ok.w > 1500 && ok.h > 500 && !ok.err, JSON.stringify(ok));
    await e.ctx.close();
  });

  test("petite fenêtre : la boîte occupe toute la fenêtre, tous les contrôles restent accessibles ; thème sombre lisible", async () => {
    const { ctx, page } = await open(shortId, { width: 390, height: 700 });
    await showPreview(page);
    const m = await page.evaluate(() => { const d = document.querySelector("[data-pb-preview-dialog]").getBoundingClientRect(); const inside = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.left >= d.left && r.right <= d.right + 0.5 && r.top >= d.top && r.bottom <= d.bottom; }; return { w: d.width, h: d.height, vw: innerWidth, vh: innerHeight, controls: ["[data-preview-device=desktop]", "[data-preview-device=mobile]", ".pb-preview-open", "[data-pb-preview-full]", "[data-pb-preview-dialog] [data-pb-close]"].map(inside) }; });
    assert.equal(m.w, m.vw); assert.equal(m.h, m.vh); assert.ok(m.controls.every(Boolean), JSON.stringify(m.controls));
    await ctx.close();
    const d = await open(shortId);
    await d.page.evaluate(() => document.querySelector(".pb-body").setAttribute("data-palette", "dark"));
    await showPreview(d.page);
    const bg = await d.page.evaluate(() => getComputedStyle(document.querySelector("[data-pb-preview-dialog]")).backgroundColor.match(/\d+/g).map(Number));
    assert.ok(bg[0] < 80, `en-tête sombre (${bg})`);
    await d.ctx.close();
  });
});
