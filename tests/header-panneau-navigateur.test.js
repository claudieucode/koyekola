// Header Builder — l'onglet « En-tête » de l'éditeur : réglages du conteneur rendus dans l'onglet (écran, état, groupes), accès aux éléments, écriture réelle du style.
// VRAI Chrome, éditeur ouvert sur un modèle d'en-tête du Theme Builder. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder : onglet « En-tête » de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let env, editUrl, componentId, context, page;
  before(async () => {
    env = await setup({ siteName: "Site panneau" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    for (const [i, [l, u]] of [["Accueil", "/"], ["Services", "/services"], ["Contact", "/contact"]].entries()) db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, ?, 'custom', ?, ?, 'published')").run(menu, i, u, l);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
    const r = await env.publishHeader("luxe-01.luxe-01", { mode: "sticky" });
    componentId = r.componentId; editUrl = r.template.editUrl;
    context = await env.browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await context.newPage(); context.setDefaultTimeout(20000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(env.srv.base + editUrl); await page.waitForSelector("#pb-tab-page");
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  const openSec = async (name) => { const d = page.locator("details.pb-hdr-acc", { has: page.locator("summary", { hasText: name }) }).first(); if (!(await d.evaluate((e) => e.open))) await d.locator("> summary").click(); await page.waitForTimeout(150); };

  test("six sections en accordéon : une seule ouverte à la fois, celle ouverte ferme les autres", async () => {
    await page.locator("#pb-tab-page").click();
    const names = ["Réglages du conteneur", "Rangées collées", "Style du conteneur", "Écrans du site", "Éléments de l'en-tête", "Comportement au défilement"];
    const pane = page.locator("[data-pb-page-settings]");
    for (const n of names) assert.equal(await pane.locator("details.pb-hdr-acc > summary", { hasText: n }).count(), 1, `section « ${n} »`);
    const openCount = () => pane.locator("details.pb-hdr-acc[open]").count();
    assert.equal(await openCount(), 1, "une seule section ouverte au départ");
    for (const n of names) { await openSec(n); assert.equal(await openCount(), 1, `après ouverture de « ${n} » : une seule ouverte`); assert.equal(await pane.locator("details.pb-hdr-acc[open] > summary", { hasText: n }).count(), 1); }
    await pane.locator("details.pb-hdr-acc[open] > summary").click(); assert.equal(await openCount(), 0, "on peut tout refermer");
  });

  test("l'onglet s'appelle « En-tête » et montre le style du conteneur avec écran, état et groupes dépliables", async () => {
    assert.equal((await page.locator("#pb-tab-page").innerText()).trim(), "En-tête");
    await page.locator("#pb-tab-page").click();
    const pane = page.locator("[data-pb-page-settings]");
    await openSec("Style du conteneur");
    for (const t of ["Mise en page", "Taille", "Espacements", "Fond, bordure et ombre", "Avancé"]) assert.ok(await pane.locator("summary", { hasText: t }).count() >= 1, `groupe « ${t} »`);
    for (const t of ["Normal", "Après défilement", "Menu ouvert"]) assert.ok(await pane.getByRole("radio", { name: t }).count() >= 1, `état « ${t} »`);
    for (const t of ["Ordinateur", "Tablette", "Mobile"]) assert.ok(await pane.getByRole("radio", { name: t }).count() >= 1, `écran « ${t} »`);
  });

  test("un réglage fait dans l'onglet s'écrit dans l'en-tête, par écran et par état (marge interne haut)", async () => {
    const pane = page.locator("[data-pb-page-settings]");
    await openSec("Style du conteneur");
    const openGroup = async (name) => { const d = pane.locator("details.pb-acc", { has: page.locator("summary", { hasText: name }) }).first(); if (!(await d.evaluate((e) => e.open))) await d.locator("> summary").click(); };
    await openGroup("Espacements");
    const input = pane.locator('[data-prop="paddingTop"] input').first();
    await input.waitFor(); await input.fill("37"); await input.press("Enter"); await page.waitForTimeout(500);
    await pane.getByRole("radio", { name: "Après défilement" }).click();
    await openGroup("Espacements");
    const input2 = pane.locator('[data-prop="paddingTop"] input').first(); await input2.waitFor(); await input2.fill("11"); await input2.press("Enter"); await page.waitForTimeout(500);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    const row = env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId), draft = JSON.parse(row.draft);
    const sec = Array.isArray(draft.sections) ? draft.sections[0] : draft, root = sec.children[0];
    assert.equal(root.styles.desktop.paddingTop, "37px", JSON.stringify(root.styles.desktop).slice(0, 200));
    assert.equal(root.states.scrolled.paddingTop, "11px", "état « après défilement » écrit à part : " + JSON.stringify(root.states || {}).slice(0, 200));
  });

  test("aperçu sur le canevas : l'état choisi (après défilement, menu ouvert) est montré sur l'en-tête, puis retiré en revenant à « Normal »", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Style du conteneur");
    const cls = () => page.frameLocator("iframe[data-pb-frame]").locator(".lp-main > .lp-block").first().evaluate((e) => e.className);
    await pane.getByRole("radio", { name: "Après défilement" }).click(); await page.waitForTimeout(300);
    assert.match(await cls(), /is-scrolled/, "aperçu défilé");
    await pane.getByRole("radio", { name: "Menu ouvert" }).click(); await page.waitForTimeout(300);
    const c2 = await cls(); assert.match(c2, /is-menu-open/); assert.doesNotMatch(c2, /is-scrolled/);
    await pane.getByRole("radio", { name: "Normal" }).click(); await page.waitForTimeout(300);
    assert.doesNotMatch(await cls(), /is-scrolled|is-menu-open/, "retour à l'aperçu normal");
  });

  test("menu hamburger : aperçu RÉEL et cliquable (le vrai menu s'ouvre), et le canevas passe sur l'écran mobile", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Menu mobile");
    await pane.locator(".pb-hdr-tile", { hasText: "Plein écran" }).click();
    const live = page.frameLocator(".pb-hdr-live-frame");
    await live.locator(".kw-menu-burger").waitFor({ timeout: 15000 });
    assert.match(await live.locator(".kw-menu-burger").getAttribute("class"), /is-lines2/, "le bouton du modèle choisi");
    await live.locator(".kw-menu-panel.is-full").waitFor({ timeout: 5000 }); // ouvert automatiquement après le choix
    assert.ok(await live.locator(".kw-menu-panel.is-full a", { hasText: "Services" }).count() >= 1, "les vrais liens du menu sont dans le panneau");
    await live.locator(".kw-menu-close").dispatchEvent("click"); await page.waitForTimeout(300); assert.equal(await live.locator(".kw-menu-panel").count(), 0, "se referme");
    await pane.getByRole("button", { name: "Ouvrir / fermer le menu" }).click(); await live.locator(".kw-menu-panel.is-full").waitFor(); // le bouton de l'éditeur ouvre le même menu
    assert.equal(await page.locator('.pb-top .pb-devices button[data-device="mobile"]').getAttribute("aria-checked"), "true", "le canevas est passé sur Mobile");
    const canvas = page.frameLocator("iframe[data-pb-frame]");
    await canvas.locator(".kw-menu-burger").first().waitFor({ timeout: 8000 });
  });

  test("menu hamburger : le choix d'un modèle s'applique aux menus de l'en-tête et se retrouve dans le document ; la taille d'écran aussi", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Menu mobile");
    const tile = (name) => pane.locator(".pb-hdr-tile", { hasText: name }).first();
    await tile("Tiroir à gauche").click(); await page.waitForTimeout(300);
    assert.equal(await tile("Tiroir à gauche").getAttribute("aria-checked"), "true", "tuile active");
    await pane.locator(".pb-hdr-tile", { hasText: "Tablette et mobile" }).click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    const draft = JSON.parse(env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId).draft);
    const menus = []; (function walk(l) { (l || []).forEach((n) => { if (n.type === "menu") menus.push(n); if (n.children) walk(n.children); }); })((Array.isArray(draft.sections) ? draft.sections[0] : draft).children);
    assert.ok(menus.length >= 1, "l'en-tête a un menu");
    for (const m of menus) { assert.equal(m.props.mobileToggle, true); assert.equal(m.props.mobileMode, "drawer"); assert.equal(m.props.drawerSide, "left"); assert.equal(m.props.menuBreakpoint, 1023); assert.equal(m.props.burgerShape, "plain"); }
    await tile("Menu étalé").click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    const d2 = JSON.parse(env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId).draft); const m2 = []; (function walk(l) { (l || []).forEach((n) => { if (n.type === "menu") m2.push(n); if (n.children) walk(n.children); }); })((Array.isArray(d2.sections) ? d2.sections[0] : d2).children);
    for (const m of m2) { assert.ok(!m.props.mobileToggle, "menu étalé : plus de bouton"); assert.equal(m.props.mobileMode, undefined); assert.equal(m.props.menuBreakpoint, undefined); }
  });

  test("les boutons d'éléments listent les éléments de l'en-tête et ouvrent leurs réglages à droite", async () => {
    const pane = page.locator("[data-pb-page-settings]");
    await openSec("Réglages du conteneur"); const btns = pane.locator(".pb-hdr-row");
    assert.ok(await btns.count() >= 5, "lignes d'accès aux réglages");
    await pane.locator(".pb-hdr-row", { hasText: "Après défilement" }).first().click();
    await page.locator("[data-pb-inspector] .pb-insp-title").waitFor();
    assert.match(await page.locator("[data-pb-inspector]").innerText(), /Après défilement/);
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
