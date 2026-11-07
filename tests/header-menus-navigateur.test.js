// Header Builder, lot L3 — menus enrichis (trois niveaux, icônes, descriptions) et TIROIR MOBILE sur le site publié, dans un VRAI Chrome :
// navigation au clavier, focus piégé, Échap, clic extérieur, défilement bloqué, état « Menu ouvert ». Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L3 : menus et tiroir mobile (navigateur)", { skip: SKIP }, () => {
  let env;
  // Menu du site, publié et affecté à l'emplacement « header » : Accueil · Services (› Web (› WordPress, Boutique), Conseil) · Contact
  const buildMenu = () => {
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const item = (parent, pos, label, url, extra = {}) => Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status, icon, description, css_class) VALUES (?, ?, ?, 'custom', ?, ?, 'published', ?, ?, ?)")
      .run(menu, parent, pos, url, label, extra.icon || "", extra.description || "", extra.cssClass || "").lastInsertRowid);
    item(null, 0, "Accueil", "/", { icon: "home" });
    const services = item(null, 1, "Services", "/services", { description: "Tout ce que nous faisons" });
    const web = item(services, 0, "Web", "/web"); item(services, 1, "Conseil", "/conseil");
    item(web, 0, "WordPress", "/wordpress", { cssClass: "mon-lien" }); item(web, 1, "Boutique", "/boutique");
    item(null, 2, "Contact", "/contact");
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
    return menu;
  };
  const withMenu = (extra) => (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", ...extra }; if (n.children) walk(n.children); } }; walk(s.children); };
  const withDrawer = (side) => withMenu({ mobileToggle: true, mobileMode: "drawer", drawerSide: side });

  before(async () => { env = await setup({ siteName: "Site menus" }); buildMenu(); });
  after(async () => { if (env) await env.close(); });

  test("trois niveaux, icône, description, classe CSS : tout est rendu dans l'en-tête publié ; le troisième niveau s'ouvre au survol", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({}));
    const { context, page } = await env.visit();
    assert.equal(await page.locator(".lp-site-header .kw-menu-item").count(), 3, "trois rubriques");
    assert.equal(await page.locator(".lp-site-header .kw-menu-icon svg").count(), 1, "icône de « Accueil »");
    assert.match(await page.locator(".lp-site-header .kw-menu-desc").innerText(), /tout ce que nous faisons/i);
    assert.equal(await page.locator(".lp-site-header .kw-submenu-deep li.mon-lien").count(), 1, "troisième niveau avec sa classe");
    const deep = page.locator(".lp-site-header .kw-submenu-deep").first();
    assert.equal(await deep.isVisible(), false, "fermé au départ");
    await page.locator(".lp-site-header .kw-menu-item", { hasText: "Services" }).first().hover();
    await page.locator(".lp-site-header .kw-submenu > li.has-sub").first().hover();
    assert.equal(await deep.isVisible(), true, "ouvert au survol du deuxième niveau");
    const r = await deep.boundingBox(); assert.ok(r.x + r.width <= 1280 + 1, "reste dans l'écran");
    await context.close();
  });

  test("clavier : Droite/Gauche entre rubriques, Bas ouvre le sous-menu, Bas/Haut dans la liste, Droite entre dans le niveau 3, Gauche en sort, Fin = dernier lien", async () => {
    const { context, page } = await env.visit();
    const focused = () => page.evaluate(() => document.activeElement.textContent.trim().split("\n")[0]);
    await page.locator(".lp-site-header .kw-menu-item > .kw-menu-link", { hasText: "Accueil" }).focus();
    await page.keyboard.press("ArrowRight"); assert.match(await focused(), /^Services/);
    await page.keyboard.press("ArrowDown"); assert.equal(await focused(), "Web", "Bas : premier lien du sous-menu");
    await page.keyboard.press("ArrowDown"); assert.equal(await focused(), "Conseil");
    await page.keyboard.press("ArrowUp"); assert.equal(await focused(), "Web");
    await page.keyboard.press("ArrowRight"); assert.equal(await focused(), "WordPress", "Droite : entre dans le niveau 3");
    await page.keyboard.press("ArrowLeft"); assert.equal(await focused(), "Web", "Gauche : revient à la rubrique");
    await page.keyboard.press("End"); assert.equal(await focused(), "Conseil", "Fin : dernier lien");
    await context.close();
  });

  test("tiroir mobile : bouton « Menu » → panneau à droite avec fond assombri, défilement bloqué, focus dedans, état « menu ouvert » sur l'en-tête", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "sticky" }, withDrawer("right"));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const burger = page.locator(".lp-site-header .kw-menu-burger");
    assert.equal(await burger.isVisible(), true);
    assert.equal(await page.locator(".kw-menu-panel").count(), 0, "fermé : aucun panneau");
    await burger.click();
    const panel = page.locator(".kw-menu-panel[role=dialog][aria-modal=true]"); await panel.waitFor(); await page.waitForTimeout(400); // fin de l'animation d'entrée
    assert.equal(await burger.getAttribute("aria-expanded"), "true");
    const box = await panel.boundingBox(); assert.ok(Math.abs(box.x + box.width - 390) < 2, `à droite (${box.x}+${box.width})`); assert.ok(box.width <= 390 * 0.87 + 1, "pas plus de 86 % de l'écran");
    assert.equal(await page.locator(".kw-menu-backdrop").isVisible(), true, "fond assombri");
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden", "défilement de la page bloqué");
    assert.match(await page.evaluate(() => document.querySelector(".lp-site-header").className), /is-menu-open/);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest(".kw-menu-panel")), true, "le focus est dans le panneau");
    await context.close();
  });

  test("tiroir : Échap, clic sur le fond, bouton Fermer referment ; le focus revient au bouton ; la page se débloque", async () => {
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const burger = page.locator(".lp-site-header .kw-menu-burger");
    const closedOk = async (how) => { assert.equal(await page.locator(".kw-menu-panel").count(), 0, `${how} : panneau retiré`); assert.equal(await burger.getAttribute("aria-expanded"), "false", how); assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "", `${how} : page débloquée`); assert.doesNotMatch(await page.evaluate(() => document.querySelector(".lp-site-header").className), /is-menu-open/, how); };
    await burger.click(); await page.keyboard.press("Escape"); await closedOk("Échap"); assert.equal(await page.evaluate(() => document.activeElement.classList.contains("kw-menu-burger")), true, "focus rendu au bouton");
    await burger.click(); await page.locator(".kw-menu-backdrop").click({ position: { x: 10, y: 400 } }); await closedOk("fond");
    await burger.click(); await page.locator(".kw-menu-close").click(); await closedOk("bouton Fermer");
    await context.close();
  });

  test("tiroir : le focus reste piégé (Tab et Maj+Tab bouclent dans le panneau)", async () => {
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    await page.locator(".lp-site-header .kw-menu-burger").click(); await page.locator(".kw-menu-panel").waitFor();
    const inside = () => page.evaluate(() => !!document.activeElement.closest(".kw-menu-panel"));
    for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); assert.equal(await inside(), true, `Tab n°${i + 1} reste dans le panneau`); }
    for (let i = 0; i < 14; i++) { await page.keyboard.press("Shift+Tab"); assert.equal(await inside(), true, `Maj+Tab n°${i + 1} reste dans le panneau`); }
    await context.close();
  });

  test("tiroir à gauche ; il se ferme si l'écran repasse en grand ; mouvement réduit sans animation", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withDrawer("left"));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 }, reducedMotion: "reduce" });
    await page.locator(".lp-site-header .kw-menu-burger").click(); const panel = page.locator(".kw-menu-panel"); await panel.waitFor();
    assert.ok((await panel.boundingBox()).x < 2, "à gauche"); assert.equal(await panel.evaluate((e) => getComputedStyle(e).animationName), "none", "mouvement réduit : pas d'animation");
    await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(300);
    assert.equal(await page.locator(".kw-menu-panel").count(), 0, "fermé au passage en grand écran");
    assert.equal(await page.locator(".lp-site-header .kw-menu-list").isVisible(), true, "le menu redevient celui de l'en-tête");
    await context.close();
  });

  test("tiroir : les trois niveaux restent utilisables (bascules) et tous les liens sont visibles", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withDrawer("right"));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    await page.locator(".lp-site-header .kw-menu-burger").click(); const panel = page.locator(".kw-menu-panel"); await panel.waitFor();
    await panel.locator('.kw-sub-toggle[aria-label="Sous-menu : Services"]').click();
    assert.equal(await panel.getByRole("link", { name: "Web" }).isVisible(), true);
    await panel.locator('.kw-sub-toggle[aria-label="Sous-menu : Web"]').click();
    assert.equal(await panel.getByRole("link", { name: "WordPress" }).isVisible(), true, "niveau 3 visible");
    assert.equal(await panel.getByRole("link", { name: "Contact" }).isVisible(), true);
    await context.close();
  });

  test("suivi des clics sur trois niveaux : chaque lien redirige vers sa vraie destination", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMenu({}));
    const { context, page } = await env.visit();
    await env.checkTrackedLinks(page, { Accueil: "/", Services: "/services", Web: "/web", Conseil: "/conseil", WordPress: "/wordpress", Boutique: "/boutique", Contact: "/contact" });
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
