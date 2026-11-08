// Header Builder — modèles du menu hamburger sur le SITE PUBLIÉ, dans un VRAI Chrome : plein écran, panneau du bas, tiroirs, bouton (icône seule, points, texte seul),
// taille d'écran choisie, ouverture / fermeture clavier. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder : modèles du menu hamburger (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => {
    env = await setup({ siteName: "Site hamburger" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    for (const [i, [l, u]] of [["Accueil", "/"], ["Services", "/services"], ["Contact", "/contact"]].entries()) db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, ?, 'custom', ?, ?, 'published')").run(menu, i, u, l);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
  });
  after(async () => { if (env) await env.close(); });
  const model = (extra) => (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", mobileToggle: true, ...extra }; if (n.children) walk(n.children); } }; walk(s.children); };
  const mobile = { viewport: { width: 390, height: 800 } };

  test("plein écran : le panneau couvre tout l'écran, le bouton est rond sans texte (nom accessible « Menu »), Échap referme", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ mobileMode: "full", burger: "lines2", burgerText: "", burgerShape: "round" }));
    const { context, page } = await env.visit(mobile);
    const burger = page.locator(".lp-site-header .kw-menu-burger");
    assert.match(await burger.getAttribute("class"), /is-lines2/); assert.match(await burger.getAttribute("class"), /is-round/);
    assert.equal(await burger.getAttribute("aria-label"), "Menu"); assert.equal(await burger.locator(".kw-menu-burger-label").count(), 0, "icône seule");
    await burger.click(); const panel = page.locator(".kw-menu-panel.is-full"); await panel.waitFor(); await page.waitForTimeout(350);
    const b = await panel.boundingBox(); assert.ok(b.x < 1 && b.y < 1 && b.width >= 389 && b.height >= 799, `couvre l'écran (${JSON.stringify(b)})`);
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".kw-menu-panel").count(), 0);
    await context.close();
  });

  test("panneau du bas : collé au bas de l'écran, jamais plus haut que 82 % ; bouton avec le texte « Menu »", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ mobileMode: "sheet", burgerText: "Menu", burgerShape: "box" }));
    const { context, page } = await env.visit(mobile);
    const burger = page.locator(".lp-site-header .kw-menu-burger"); assert.match(await burger.innerText(), /Menu/);
    await burger.click(); const panel = page.locator(".kw-menu-panel.is-sheet"); await panel.waitFor(); await page.waitForTimeout(350);
    const b = await panel.boundingBox(); assert.ok(Math.abs(b.y + b.height - 800) < 2, `collé au bas (${b.y}+${b.height})`); assert.ok(b.height <= 800 * 0.82 + 1);
    await context.close();
  });

  test("tiroir à gauche, bouton « points » ; texte seul : lettres sans icône", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ mobileMode: "drawer", drawerSide: "left", burger: "dots", burgerText: "", burgerShape: "round" }));
    let v = await env.visit(mobile);
    await v.page.locator(".lp-site-header .kw-menu-burger").click(); const panel = v.page.locator(".kw-menu-panel.is-left"); await panel.waitFor(); await v.page.waitForTimeout(350);
    assert.ok((await panel.boundingBox()).x < 2, "à gauche"); await v.context.close();
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ burger: "text", burgerText: "Menu", burgerShape: "plain" }));
    v = await env.visit(mobile);
    const b = v.page.locator(".lp-site-header .kw-menu-burger"); assert.match(await b.getAttribute("class"), /is-text/); assert.equal(await b.locator("span[aria-hidden]").count(), 0, "pas d'icône"); assert.match(await b.innerText(), /menu/i);
    await v.context.close();
  });

  test("le texte du bouton est écrit en TEXTE (jamais en HTML)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ burgerText: "<img src=x onerror=window.__x=1>" }));
    const { context, page } = await env.visit(mobile);
    assert.equal(await page.evaluate(() => window.__x), undefined); assert.equal(await page.locator(".lp-site-header .kw-menu-burger img").count(), 0);
    await context.close();
  });

  test("taille d'écran choisie : à 1023 px le bouton apparaît sur une tablette de 900 px, pas sur un ordinateur de 1280 px", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, model({ menuBreakpoint: 1023, mobileMode: "drawer", drawerSide: "right" }));
    let v = await env.visit({ viewport: { width: 900, height: 800 } });
    assert.equal(await v.page.locator(".lp-site-header .kw-menu-burger").isVisible(), true, "tablette : bouton"); await v.context.close();
    v = await env.visit({ viewport: { width: 1280, height: 800 } });
    assert.equal(await v.page.locator(".lp-site-header .kw-menu-burger").isVisible(), false, "ordinateur : menu étalé"); await v.context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
