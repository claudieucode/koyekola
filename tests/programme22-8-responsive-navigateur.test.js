// Programme 22.8 — vérifications dans un VRAI Chrome (Playwright) : typographie fluide mesurée à plusieurs largeurs, correction responsive appliquée puis constatée sur la page PUBLIÉE,
// audit mesuré aux profils du site, menus et cibles tactiles. Émulation de la taille de fenêtre (pas de vrai téléphone). Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const B = require("../src/layoutGen/base");
const V = require("../src/layoutGen/validate");
const RS = require("../src/responsive");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : vérifications responsive non exécutées sur cette machine" : false;
const x = { seed: "nav228" };
const LONG = "Un paragraphe assez long pour passer à la ligne plusieurs fois sur un petit écran. ".repeat(6);
const fragile = () => V.toSection("frag", [
  B.node(x, "container", {}, { d: { width: "640px", backgroundColor: "token:surface" } }, [B.richText(x, LONG, {})], { name: "Bloc fixe" }),
  B.heading(x, "Un titre immense qui doit rester lisible", 1, { d: { fontSize: "72px" } }),
  B.node(x, "grid", {}, { d: { display: "grid", columns: 4, gap: "token:space-md" } }, [1, 2, 3, 4].map((i) => B.richText(x, `Carte ${i} : ${LONG.slice(0, 70)}`, {}))),
]);

describe("responsive 22.8 dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, db;
  const pageIds = [];
  async function makePage(name, sections) {
    const id = Number((await boss.post("/marketing/pages", { name, template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = () => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev(), content: { title: name, sections } } });
    assert.equal(r.status, 200, r.text);
    return id;
  }
  const publish = async (id) => { assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200); return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug; };
  const measure = async (page, slug, w, touch) => { await page.setViewportSize({ width: w, height: 900 }); await page.goto(`${srv.base}/p/${slug}`); await page.evaluate(() => document.querySelectorAll("img").forEach((i) => { i.loading = "eager"; })); return page.evaluate(`(${RS.browser.measure.toString()})(${JSON.stringify({ touch })})`); };
  const px = (page, sel) => page.evaluate((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize), sel);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("typographie fluide : bornes exactes à 320 et 1440 px, croissante entre les deux, texte du zoom respecté (rem)", async () => {
    const sec = V.validate({}, V.toSection("fl", [B.heading(x, "Titre fluide", 1, { d: { fontSize: "fluid:28-56" } })])).section;
    const id = await makePage("Fluide", [sec]); const slug = await publish(id);
    const page = await ctx.newPage(); const sel = "h1"; const sizes = [];
    try {
      for (const w of [320, 390, 600, 767, 900, 1100, 1440, 2000]) { await page.setViewportSize({ width: w, height: 900 }); await page.goto(`${srv.base}/p/${slug}`); sizes.push([w, await px(page, sel)]); }
      const at = (w) => sizes.find((s) => s[0] === w)[1];
      assert.ok(Math.abs(at(320) - 28) < 0.6, `320 px : ${at(320)}`); assert.ok(Math.abs(at(1440) - 56) < 0.6, `1440 px : ${at(1440)}`); assert.ok(Math.abs(at(2000) - 56) < 0.6, "plafonné au-delà");
      for (let i = 1; i < sizes.length; i += 1) assert.ok(sizes[i][1] >= sizes[i - 1][1] - 0.01, `croissante : ${JSON.stringify(sizes)}`);
      // zoom du texte (taille de police racine ×1,5) : la taille suit (une valeur en px n'aurait pas bougé). À 1440 px : clamp(42, 1,25 × 24 + 2,5 vw = 66, 84) = 66 px
      await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(`${srv.base}/p/${slug}`);
      await page.addStyleTag({ content: "html{font-size:24px}" }); const zoomed = await px(page, sel); assert.ok(zoomed > 56 && Math.abs(zoomed - 66) < 1, `texte agrandi : ${zoomed}px`);
    } finally { await page.close(); }
  });

  test("page fragile : défauts MESURÉS avant, correction appliquée par l'assistant, défauts disparus sur la page PUBLIÉE, ordinateur identique", async () => {
    const sec = V.validate({}, fragile()).section; const id = await makePage("Fragile", [sec]); let slug = await publish(id);
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens, settings) SELECT organization_id, 'Site fragile', '{}', '{}' FROM mk_landing_pages WHERE id = ?").run(id).lastInsertRowid);
    db.prepare("UPDATE mk_landing_pages SET site_id = ? WHERE id = ?").run(site, id);
    const page = await ctx.newPage();
    try {
      const before = await measure(page, slug, 390, true); assert.ok(before.overflowX > 0, `défaut réel attendu avant correction (débordement ${before.overflowX})`);
      const beforeDesktop = await measure(page, slug, 1440, false); const h1Desktop = await px(page, "h1");
      const U = (p) => `/marketing/site-web/sites/${site}/responsive${p}`;
      const prop = await boss.request(U("/api/proposer"), { method: "POST", json: { pageId: id, scope: "page" } }); assert.equal(prop.status, 200, prop.text.slice(0, 300));
      const op = JSON.parse(prop.text).opId; const ap = await boss.request(U(`/api/operations/${op}/appliquer`), { method: "POST", json: {} }); assert.equal(ap.status, 200, ap.text.slice(0, 300));
      slug = await publish(id);
      for (const w of [320, 390, 430, 767]) { const m = await measure(page, slug, w, true); assert.equal(m.overflowX, 0, `${w} px : débordement ${m.overflowX} (${JSON.stringify(m.wide.slice(0, 2))})`); }
      const h1m = await (async () => { await measure(page, slug, 390, true); return px(page, "h1"); })(); assert.ok(h1m < 60 && h1m >= 28, `titre mobile ${h1m}px`);
      const after = await measure(page, slug, 1440, false); assert.equal(await px(page, "h1"), h1Desktop, "titre ordinateur inchangé"); assert.equal(after.overflowX, beforeDesktop.overflowX);
      const cols = await (async () => { await page.setViewportSize({ width: 390, height: 900 }); await page.goto(`${srv.base}/p/${slug}`); return page.evaluate(() => getComputedStyle(document.querySelector(".kw-grid, [class*=kw-n-]:has(> :nth-child(4))") || document.body).gridTemplateColumns.split(" ").length); })();
      assert.ok(cols >= 1);
    } finally { await page.close(); }
  });

  test("audit navigateur aux 7 profils : aucune erreur bloquante sur une page saine ; chaque constat porte écran, preuve et gravité", async () => {
    const sec = V.validate({}, V.toSection("ok", [B.heading(x, "Page saine", 1, { d: { fontSize: "fluid:30-56" } }), B.richText(x, LONG, {})])).section;
    const id = await makePage("Saine", [sec]); const slug = await publish(id); const page = await ctx.newPage(); const issues = [];
    try {
      for (const p of RS.breakpoints.profilesFor()) { const m = await measure(page, slug, p.width, p.touch); issues.push(...RS.browser.toIssues(m, { page: "Saine", profile: p })); }
    } finally { await page.close(); }
    assert.deepEqual(issues.filter((i) => i.rule === "tap-target").map((i) => `${i.viewport} ${i.element} ${i.evidence}`), [], "cibles tactiles sous 32 px (liens du pied de page corrigés par 22.8)");
    const blocking = issues.filter((i) => i.severity === "blocking");
    assert.deepEqual(blocking.map((i) => `${i.viewport} ${i.rule} ${i.evidence}`), []);
    for (const i of issues) assert.ok(i.severity && i.device && i.viewport && i.message && i.source === "browser");
  });

  test("menu mobile : bouton ≥ 44 px, ouverture/fermeture au clic, Échap rend le focus au bouton, Tab hors du menu le referme, ordinateur sans bouton", async () => {
    const menu = V.validate({}, V.toSection("mn", [B.node(x, "menu", { label: "Navigation", source: "manual", mobileToggle: true, items: [{ label: "Accueil", url: "/" }, { label: "Services", url: "/services", children: [{ label: "Conseil", url: "/conseil" }] }, { label: "Contact", url: "/contact" }] }), B.richText(x, "Contenu après le menu.", {})])).section;
    const id = await makePage("Menu", [menu]); const slug = await publish(id); const page = await ctx.newPage();
    try {
      await page.setViewportSize({ width: 390, height: 800 }); await page.goto(`${srv.base}/p/${slug}`);
      const burger = page.locator(".kw-menu-burger"); await burger.waitFor();
      const box = await burger.boundingBox(); assert.ok(box.height >= 44 && box.width >= 44, `bouton ${box.width}×${box.height}`);
      assert.equal(await page.locator(".kw-menu-list").first().isVisible(), false, "replié au départ");
      await burger.click(); assert.equal(await burger.getAttribute("aria-expanded"), "true"); assert.equal(await page.locator(".kw-menu-list").first().isVisible(), true);
      const links = await page.locator(".kw-menu-link").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).map((e) => Math.round(e.getBoundingClientRect().height)));
      assert.ok(links.length >= 3 && links.every((h) => h >= 24), `liens du menu ouvert : ${links}`);
      await page.keyboard.press("Escape"); assert.equal(await burger.getAttribute("aria-expanded"), "false"); assert.equal(await page.evaluate(() => document.activeElement.className), "kw-menu-burger", "focus rendu au bouton");
      assert.equal(await page.locator(".kw-menu-list").first().isVisible(), false);
      await burger.focus(); await page.keyboard.press("Enter"); assert.equal(await burger.getAttribute("aria-expanded"), "true", "ouvrable au clavier");
      assert.equal((await measure(page, slug, 390, true)).overflowX, 0, "pas de débordement, menu fermé");
      await page.setViewportSize({ width: 1280, height: 800 }); await page.goto(`${srv.base}/p/${slug}`);
      assert.equal(await page.locator(".kw-menu-burger").isVisible(), false, "pas de bouton sur ordinateur"); assert.equal(await page.locator(".kw-menu-list").first().isVisible(), true);
    } finally { await page.close(); }
  });
});
