// Header Builder, lot L4 — MÉGA-MENU : un panneau composé dans l'éditeur s'ouvre depuis une rubrique du menu (survol, clic, clavier), avec son propre style, en pleine largeur
// ou sous la rubrique, en accordéon sur mobile ; jamais le panneau d'un autre site. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L4 : méga-menu (navigateur)", { skip: SKIP }, () => {
  let env, servicesId, panelId, otherSite, otherPanel;
  const panelSection = (label) => ({ type: "layout", children: [{ id: "pnl1" + label.slice(0, 3).toLowerCase() + "aa", type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "row", gap: "24px", backgroundColor: "#eef2ff", paddingTop: "20px", paddingBottom: "20px" } }, children: [
    { id: "pnh" + label.slice(0, 3).toLowerCase() + "aa", type: "heading", props: { text: `Panneau ${label}`, level: "3" } },
    { id: "pnb" + label.slice(0, 3).toLowerCase() + "aa", type: "button", props: { label: "Tout voir", url: "/tout-voir" } }] }] });
  const createComponent = async (name, siteId, section) => {
    const r = await env.boss.request("/marketing/site-web/composants", { method: "POST", json: { name, section, kind: "standard", global: false, siteId }, headers: env.origin });
    assert.equal(r.status, 201, r.text.slice(0, 300)); return JSON.parse(r.text).component.id;
  };
  const withMega = (extra) => (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", mega: { [String(servicesId)]: panelId }, ...extra }; if (n.children) walk(n.children); } }; walk(s.children); };

  before(async () => {
    env = await setup({ siteName: "Site méga" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const item = (parent, pos, label, url) => Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, ?, ?, 'custom', ?, ?, 'published')").run(menu, parent, pos, url, label).lastInsertRowid);
    item(null, 0, "Accueil", "/"); servicesId = item(null, 1, "Services", "/services"); item(null, 2, "Contact", "/contact");
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
    panelId = await createComponent("Méga-menu · Services", env.site, panelSection("Services"));
    otherSite = Number((await env.boss.post("/marketing/site-web/sites", { name: "Autre site" })).location.match(/sites\/(\d+)/)[1]);
    otherPanel = await createComponent("Méga-menu · Autre site", otherSite, panelSection("Etranger"));
  });
  after(async () => { if (env) await env.close(); });

  const servicesItem = (page) => page.locator(".lp-site-header .kw-menu-item.has-mega");

  test("au survol : le panneau s'ouvre sous la rubrique, avec son propre style ; il se referme quand on le quitte", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({}));
    const { context, page } = await env.visit();
    assert.equal(await servicesItem(page).count(), 1, "une seule rubrique a un panneau");
    const panel = page.locator(".lp-site-header .kw-mega"); assert.equal(await panel.isVisible(), false, "fermé au départ");
    assert.equal(await panel.getAttribute("role"), "group"); assert.equal(await panel.getAttribute("aria-label"), "Services");
    await servicesItem(page).hover();
    assert.equal(await panel.isVisible(), true, "ouvert au survol");
    assert.match(await panel.innerText(), /Panneau Services/); assert.equal(await panel.getByRole("link", { name: "Tout voir" }).isVisible(), true);
    assert.equal(await panel.locator("[class*=kw-n-]").first().evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(238, 242, 255)", "le style du panneau (fond) est appliqué");
    const item = await servicesItem(page).boundingBox(), box = await panel.boundingBox();
    assert.ok(box.y >= item.y + item.height - 2, "sous la rubrique"); assert.ok(box.x + box.width <= 1281, "reste dans l'écran");
    await page.mouse.move(5, 700); await page.waitForTimeout(150); assert.equal(await panel.isVisible(), false, "refermé");
    await context.close();
  });

  test("clavier : Bas sur la rubrique entre dans le panneau ; Échap le referme et rend le focus à la rubrique", async () => {
    const { context, page } = await env.visit();
    await servicesItem(page).locator("> .kw-menu-link").focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => !!document.activeElement.closest(".kw-mega")), true, "focus dans le panneau");
    assert.equal(await page.locator(".lp-site-header .kw-mega").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".lp-site-header .kw-mega").isVisible(), false, "Échap referme");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("kw-sub-toggle")), true, "focus rendu au bouton de la rubrique");
    await context.close();
  });

  test("ouverture au clic : le survol n'ouvre pas ; le bouton ouvre ; un clic ailleurs et le focus qui sort referment", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({ megaTrigger: "click" }));
    const { context, page } = await env.visit();
    const panel = page.locator(".lp-site-header .kw-mega"), toggle = servicesItem(page).locator("> .kw-sub-toggle");
    await servicesItem(page).hover(); assert.equal(await panel.isVisible(), false, "le survol n'ouvre pas en mode clic");
    await toggle.click(); assert.equal(await panel.isVisible(), true, "le clic ouvre"); assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }))); /* clic hors du menu (le panneau recouvre le contenu : un vrai clic y toucherait un lien) */ assert.equal(await panel.isVisible(), false, "un clic ailleurs referme");
    await toggle.click(); assert.equal(await panel.isVisible(), true);
    await page.locator(".lp-site-header .kw-menu-item", { hasText: "Contact" }).locator("> .kw-menu-link").focus(); assert.equal(await panel.isVisible(), false, "le focus qui sort referme");
    await context.close();
  });

  test("pleine largeur : le panneau couvre toute la largeur de l'en-tête", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({ megaWidth: "full" }));
    const { context, page } = await env.visit();
    await servicesItem(page).hover();
    const head = await page.locator(".lp-site-header").boundingBox(), box = await page.locator(".lp-site-header .kw-mega").boundingBox();
    assert.ok(Math.abs(box.x - head.x) < 2 && Math.abs(box.width - head.width) < 2, `panneau ${Math.round(box.x)}+${Math.round(box.width)} / en-tête ${Math.round(head.x)}+${Math.round(head.width)}`);
    await context.close();
  });

  test("mobile : le panneau s'ouvre en accordéon sous la rubrique (dans le flux, sans déborder)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({ mobileToggle: true }));
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    await page.locator(".lp-site-header .kw-menu-burger").click();
    const toggle = servicesItem(page).locator("> .kw-sub-toggle"); await toggle.click();
    const panel = page.locator(".lp-site-header .kw-mega"); assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.evaluate((e) => getComputedStyle(e).position), "static", "dans le flux");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "aucun défilement horizontal");
    await context.close();
  });

  test("isolation : le panneau d'un AUTRE site n'est jamais affiché ; un panneau retiré ou inexistant ne casse pas le menu", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", mega: { [String(servicesId)]: otherPanel } }; if (n.children) walk(n.children); } }; walk(s.children); });
    const a = await env.visit(); assert.equal(await a.page.locator(".lp-site-header .has-mega").count(), 0, "pas de panneau étranger"); assert.equal(await a.page.locator(".lp-site-header .kw-menu-item").count(), 3, "le menu reste complet");
    assert.doesNotMatch(await a.page.content(), /Panneau Etranger/); await a.context.close();
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", mega: { [String(servicesId)]: 999999 } }; if (n.children) walk(n.children); } }; walk(s.children); });
    const b = await env.visit(); assert.equal(await b.page.locator(".lp-site-header .has-mega").count(), 0, "composant inexistant : ignoré"); assert.equal(await b.page.locator(".lp-site-header .kw-menu-item").count(), 3); await b.context.close();
  });

  test("un panneau modifié et republié s'affiche à jour ; un composant devenu un autre type de contenu est ignoré", async () => {
    const comp = JSON.parse((await env.boss.get(`/marketing/site-web/composants/${panelId}.json`)).text).component;
    const section = JSON.parse(JSON.stringify(comp.draft || comp.section)); section.children[0].children[0].props.text = "Titre modifié";
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${panelId}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: comp.revision, content: { title: comp.name, sections: [section] } } })).status, 200);
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({}));
    let v = await env.visit(); await servicesItem(v.page).hover(); assert.doesNotMatch(await v.page.locator(".lp-site-header .kw-mega").innerText(), /Titre modifié/, "brouillon non publié : pas visible"); await v.context.close();
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${panelId}/mettre-a-jour`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    v = await env.visit(); await servicesItem(v.page).hover(); assert.match(await v.page.locator(".lp-site-header .kw-mega").innerText(), /Titre modifié/, "publié : visible"); await v.context.close();
  });

  test("suivi des clics : chaque lien du menu et du panneau redirige vers sa vraie destination (ordre du gabarit = ordre de linksOf)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withMega({}));
    const { context, page } = await env.visit();
    await env.checkTrackedLinks(page, { Accueil: "/", Services: "/services", Contact: "/contact", "Tout voir": "/tout-voir" });
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
