// Header Builder — logo du site sur le SITE PUBLIÉ, dans un VRAI Chrome : lien personnalisé (suivi des clics → vraie destination), nouvel onglet, hauteur libre, style de l'image au survol.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder : logo du site (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => { env = await setup({ siteName: "Site logo" }); });
  after(async () => { if (env) await env.close(); });
  // Le modèle de test n'a pas de logo (il affiche le titre du site) : on en ajoute un, comme le ferait l'éditeur
  const logo = (props, parts) => (s) => {
    let found = false, host = null;
    const walk = (nodes) => { for (const n of nodes) { if (n.type === "sitelogo") { found = true; n.props = { ...n.props, ...props }; if (parts) n.parts = parts; } if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } };
    walk(s.children);
    if (!found) host.children.unshift({ id: "lgo0000001aa", type: "sitelogo", props: { height: 48, link: true, ...props }, ...(parts ? { parts } : {}) });
  };

  test("lien personnalisé : le logo mène à l'adresse choisie (via le suivi des clics) et s'ouvre dans un nouvel onglet", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, href: "https://exemple.com/promo", newTab: true }));
    const { context, page } = await env.visit();
    const a = page.locator(".lp-site-header a.kw-sitelogo-link");
    assert.equal(await a.count(), 1);
    assert.equal(await a.getAttribute("target"), "_blank"); assert.match(await a.getAttribute("rel"), /noopener/);
    const { Client } = require("./helpers");
    const r = await new Client(env.srv.base).request(await a.getAttribute("href"), { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/120" } });
    assert.equal(r.location, "https://exemple.com/promo", "le clic compté redirige vers l'adresse choisie");
    await context.close();
  });

  test("sans adresse : le logo mène à l'accueil du site, dans le même onglet", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, href: undefined, newTab: undefined }));
    const { context, page } = await env.visit();
    const a = page.locator(".lp-site-header a.kw-sitelogo-link"); assert.equal(await a.getAttribute("target"), null);
    await context.close();
  });

  test("hauteur libre (73 px) appliquée à l'image du logo ; aucune erreur de script", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, height: 73 }));
    const { context, page } = await env.visit();
    const img = page.locator(".lp-site-header .kw-sitelogo-img").first();
    if (await img.count()) assert.equal(Math.round((await img.boundingBox()).height), 73);
    await context.close();
    assert.deepEqual(env.errors, []);
  });
});

describe("Header Builder : menu, recherche, compte, nouveaux réglages (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => {
    env = await setup({ siteName: "Site widgets 2" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const item = (parent, pos, label, url) => Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, ?, 'custom', ?, ?, 'published')").run(menu, parent, pos, url, label).lastInsertRowid);
    item(null, 0, "Accueil", "/"); const s = item(null, 1, "Services", "/services"); item(s, 0, "Web", "/web"); item(null, 2, "Contact", "/contact");
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
  });
  after(async () => { if (env) await env.close(); });
  const withNode = (type, props, extra = {}) => (s) => { let found = false, host = null; const walk = (nodes) => { for (const n of nodes) { if (n.type === type) { found = true; n.props = { ...n.props, ...props }; } if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } }; walk(s.children); if (!found) host.children.push({ id: ("wdx" + type + "01").slice(0, 12).padEnd(10, "0") + "aa", type, props: { ...(extra.base || {}), ...props } }); };

  test("menu : indicateur « plus » et animation « fondu » appliqués sur le site publié", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withNode("menu", { source: "location", location: "header", indicator: "plus", submenuAnim: "fade" }));
    const { context, page } = await env.visit();
    const nav = page.locator(".lp-site-header nav.kw-menu"); assert.match(await nav.getAttribute("class"), /kw-ind-plus/); assert.match(await nav.getAttribute("class"), /kw-sa-fade/);
    const before = await page.locator(".lp-site-header .kw-sub-toggle").first().evaluate((e) => getComputedStyle(e, "::before").content);
    assert.match(before, /\+/, "le bouton du sous-menu affiche un plus");
    await context.close();
  });

  test("recherche : loupe dans le champ (minimal) et loupe seule ; compte : icône seule avec nom accessible", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => { withNode("search", { target: "catalogue", placeholder: "Chercher…", button: "Lancer la recherche", buttonType: "inline" }, { base: { target: "catalogue" } })(s); withNode("account", { look: "icon", login: "Se connecter" }, { base: { showCart: false } })(s); });
    const { context, page } = await env.visit();
    const form = page.locator(".lp-site-header form.kw-search-minimal"); assert.equal(await form.count(), 1);
    const go = form.locator("button.kw-search-go.is-inline"); assert.equal(await go.getAttribute("aria-label"), "Lancer la recherche"); assert.equal(await go.locator("svg").count(), 1);
    const fb = await form.locator("input").boundingBox(), gb = await go.boundingBox(); assert.ok(gb.x >= fb.x && gb.x + gb.width <= fb.x + fb.width + 1, "la loupe est DANS le champ");
    const acc = page.locator(".lp-site-header .kw-account-link").first(); assert.equal(await acc.locator("svg").count(), 1, "icône"); assert.match(await acc.locator(".sr-only").innerText(), /connecter/i, "nom lu par les lecteurs d'écran");
    await context.close();
    assert.deepEqual(env.errors, []);
  });
});

describe("Header Builder : style individuel de chaque lien du menu (navigateur)", { skip: SKIP }, () => {
  let env, ids = {};
  before(async () => {
    env = await setup({ siteName: "Site liens individuels" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const item = (parent, pos, label, url) => Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, ?, 'custom', ?, ?, 'published')").run(menu, parent, pos, url, label).lastInsertRowid);
    ids.a = item(null, 0, "Accueil", "/"); ids.b = item(null, 1, "Boutique", "/boutique"); ids.c = item(null, 2, "Contact", "/contact");
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
  });
  after(async () => { if (env) await env.close(); });
  const withMenu = (props) => (s) => { let found = false, host = null; const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") { found = true; n.props = { ...n.props, ...props }; } if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } }; walk(s.children); if (!found) host.children.push({ id: "men0000001aa", type: "menu", props: { label: "Navigation", ...props } }); };

  test("seul « Boutique » est personnalisé (normal, survol, écran mobile) ; Accueil et Contact restent identiques", async () => {
    const itemStyles = { ["m" + ids.b]: { link: { styles: { desktop: { color: "#c2410c", fontWeight: "800", backgroundColor: "#fff7ed", borderRadius: "999px" }, mobile: { fontSize: "21px" } }, states: { hover: { color: "#ffffff", backgroundColor: "#7c2d12" } } } } };
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({ source: "location", location: "header", itemStyles }));
    const { context, page } = await env.visit();
    const link = (t) => page.locator(".lp-site-header .kw-menu-link", { hasText: t }).first();
    const css = (loc, p) => loc.evaluate((e, q) => getComputedStyle(e)[q], p);
    assert.equal(await css(link("Boutique"), "color"), "rgb(194, 65, 12)");
    assert.equal(await css(link("Boutique"), "fontWeight"), "800");
    assert.notEqual(await css(link("Accueil"), "color"), "rgb(194, 65, 12)", "Accueil n'est pas touché");
    assert.notEqual(await css(link("Contact"), "backgroundColor"), "rgb(255, 247, 237)", "Contact n'est pas touché");
    await link("Boutique").hover();
    await page.waitForTimeout(400);
    assert.equal(await css(link("Boutique"), "backgroundColor"), "rgb(124, 45, 18)", "état survol propre à ce lien");
    await context.close();
    assert.deepEqual(env.errors, []);
  });

  test("visibilité par écran : « Boutique » masqué sur tablette et mobile (barre et panneau), visible sur ordinateur ; les autres liens restent", async () => {
    const itemStyles = { ["m" + ids.b]: { hide: ["tablet", "mobile", "inconnu"] } };
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({ source: "location", location: "header", mobileToggle: true, mobileMode: "drawer", itemStyles }));
    const shown = async (width) => {
      const { context, page } = await env.visit({ viewport: { width, height: 800 } });
      const vis = await page.evaluate(() => { const v = (t) => { const a = [...document.querySelectorAll(".lp-site-header .kw-menu-item")].find((e) => e.textContent.includes(t)); return a ? getComputedStyle(a).display !== "none" : null; }; return { boutique: v("Boutique"), accueil: v("Accueil") }; });
      let inPanel = null;
      if (width < 768) { await page.locator(".lp-site-header .kw-menu-burger").first().click(); await page.waitForSelector(".kw-menu-panel"); inPanel = await page.evaluate(() => [...document.querySelectorAll(".kw-menu-panel li")].filter((e) => getComputedStyle(e).display !== "none").map((e) => e.textContent.trim().slice(0, 20))); }
      await context.close(); return { ...vis, inPanel };
    };
    const desk = await shown(1280), tab = await shown(900), mob = await shown(390);
    assert.equal(desk.boutique, true, "visible sur ordinateur"); assert.equal(tab.boutique, false, "masqué sur tablette"); assert.equal(mob.boutique, false, "masqué sur mobile");
    assert.equal(desk.accueil, true); assert.ok(tab.accueil !== false, "Accueil reste visible sur tablette");
    assert.ok(mob.inPanel && mob.inPanel.length >= 1 && !mob.inPanel.some((t) => /Boutique/.test(t)), "absent du panneau mobile : " + JSON.stringify(mob.inPanel));
    assert.deepEqual(env.errors, []);
  });

  test("menu mobile : le tiroir prend le fond, la largeur, le fond assombri et la fermeture réglés ; liens du panneau stylés", async () => {
    const panelStyles = { panel: { styles: { desktop: { backgroundColor: "#0f172a", width: "300px" } } }, backdrop: { styles: { desktop: { backgroundColor: "#7c2d12cc" } } }, links: { styles: { desktop: { color: "#fde68a", fontSize: "22px" } } }, close: { styles: { desktop: { color: "#fbbf24" } } } };
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({ source: "location", location: "header", mobileToggle: true, mobileMode: "drawer", drawerSide: "right", panelStyles }));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    await page.locator(".lp-site-header .kw-menu-burger").first().click();
    await page.waitForSelector(".kw-menu-panel");
    const css = (sel, q) => page.locator(sel).first().evaluate((e, p) => getComputedStyle(e)[p], q);
    assert.equal(await css(".kw-menu-panel", "backgroundColor"), "rgb(15, 23, 42)");
    assert.equal(Math.round((await page.locator(".kw-menu-panel").first().boundingBox()).width), 300);
    assert.equal(await css(".kw-menu-backdrop", "backgroundColor"), "rgba(124, 45, 18, 0.8)");
    assert.equal(await css(".kw-menu-panel .kw-menu-link", "color"), "rgb(253, 230, 138)");
    assert.equal(await css(".kw-menu-panel .kw-menu-close", "color"), "rgb(251, 191, 36)");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".kw-menu-panel").count(), 0, "Échap ferme le panneau");
    await context.close();
    assert.deepEqual(env.errors, []);
  });

  test("mouvement du menu : le sous-menu s'ouvre en glissant, reste ouvert pendant le délai de fermeture, puis se ferme ; les éléments arrivent en cascade ; le lien se soulève au survol", async () => {
    const db = env.db, menu = Number(db.prepare("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'").get(env.site).menu_id);
    db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, 0, 'custom', '/chaussures', 'Chaussures', 'published')").run(menu, ids.b);
    db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, 1, 'custom', '/sacs', 'Sacs', 'published')").run(menu, ids.b);
    const menuMotion = { enter: "slide-up", duration: 200, openDelay: 0, closeDelay: 600, distance: 14, cascade: 90, linkHover: "lift", hoverDistance: 6 };
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({ source: "location", location: "header", menuMotion }));
    const { context, page } = await env.visit();
    const sub = page.locator(".lp-site-header .kw-menu-item.has-sub > .kw-submenu").first();
    assert.equal(await sub.evaluate((e) => getComputedStyle(e).visibility), "hidden", "fermé au départ");
    const top = page.locator(".lp-site-header .kw-menu-item.has-sub > .kw-menu-link").first();
    const before = await top.evaluate((e) => getComputedStyle(e).transform);
    await top.hover(); await page.waitForTimeout(500);
    assert.equal(await sub.evaluate((e) => getComputedStyle(e).visibility), "visible");
    assert.equal(await sub.evaluate((e) => getComputedStyle(e).opacity), "1");
    const delays = await sub.locator("> li").evaluateAll((ls) => ls.map((l) => getComputedStyle(l).transitionDelay));
    assert.notEqual(delays[0], delays[1], "cascade : délais différents");
    assert.notEqual(await top.evaluate((e) => getComputedStyle(e).transform), before, "le lien se soulève au survol");
    await page.mouse.move(5, 700); await page.waitForTimeout(250);
    assert.equal(await sub.evaluate((e) => getComputedStyle(e).visibility), "visible", "toujours ouvert pendant le délai de fermeture");
    await page.waitForTimeout(1100);
    assert.equal(await sub.evaluate((e) => getComputedStyle(e).visibility), "hidden", "fermé après le délai");
    await context.close();
    assert.deepEqual(env.errors, []);
  });
  test("hamburger : taille, épaisseur, durée et animation de l'icône réglées ; l'icône tourne à l'ouverture", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({ source: "location", location: "header", mobileToggle: true, burgerAnim: "spin", burgerSize: 30, burgerThickness: 4, burgerSpeed: 100 }));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const ico = page.locator(".lp-site-header .kw-menu-burger > span[aria-hidden]").first();
    const st = () => ico.evaluate((e) => { const c = getComputedStyle(e); return { w: c.width, bt: c.borderTopWidth, tr: c.transform }; });
    const a = await st();
    assert.equal(a.w, "30px"); assert.equal(a.bt, "4px");
    await page.locator(".lp-site-header .kw-menu-burger").first().click();
    await page.waitForTimeout(400);
    assert.notEqual((await st()).tr, a.tr, "l'icône a tourné");
    await context.close();
    assert.deepEqual(env.errors, []);
  });
});
