// Inspecteur du menu (Header Builder) : les groupes « Mouvement du menu » et « Style d'un lien (individuel) » s'affichent, se règlent, et les valeurs sont enregistrées dans le document ; les autres liens ne sont pas touchés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
describe("Header Builder : inspecteur du menu (navigateur)", { skip: SKIP }, () => {
  let env, editUrl, componentId, context, page; const logs = [];
  before(async () => {
    env = await setup({ siteName: "Site inspecteur menu" });
    const db = env.db, menu = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    for (const [i, [l, u]] of [["Accueil", "/"], ["Services", "/services"]].entries()) db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, ?, 'custom', ?, ?, 'published')").run(menu, i, u, l);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menu);
    const r = await env.publishHeader("luxe-01.luxe-01", { mode: "sticky" }, () => {});
    editUrl = r.template.editUrl; componentId = r.componentId;
    context = await env.browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await context.newPage(); page.on("console", (m) => logs.push(m.type() + " " + m.text().slice(0, 300))); page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
    await page.goto(env.srv.base + editUrl); await page.waitForSelector("#pb-tab-page");
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });
  test("réglage d'un seul lien et du mouvement : affichés, enregistrés, autres liens intacts, aucune erreur de script", async () => {
    const items = page.locator("[data-pb-layers] [role=treeitem]"); const n = await items.count(); let ok = false;
    for (let i = 0; i < n && !ok; i++) { const t = (await items.nth(i).innerText()).replace(/\s+/g, " "); if (!/Menu de navigation · Navigation principale/.test(t) || /Groupe/.test(t.slice(0, 7))) continue; await items.nth(i).click({ timeout: 30000 }); await page.waitForTimeout(2500); ok = /Modifier Menu/.test(await page.locator("[data-pb-inspector]").innerText()); }
    assert.ok(ok, "le menu est sélectionné");
    const insp = page.locator("[data-pb-inspector]");
    const sums = await insp.locator("details.pb-hdr-acc > summary").allInnerTexts();
    for (const t of ["Mouvement du menu", "Style d'un lien (individuel)", "Bouton mobile (hamburger)"]) assert.ok(sums.some((x) => x.includes(t)), `groupe « ${t} » affiché : ${JSON.stringify(sums)}`);
    await insp.locator("details.pb-hdr-acc > summary", { hasText: "Mouvement du menu" }).click(); await page.waitForTimeout(500);
    await insp.getByLabel("Animation d'ouverture", { exact: true }).selectOption("slide-up"); await page.waitForTimeout(600);
    const del = insp.getByLabel("Délai de fermeture (ms)", { exact: true }); await del.fill("350"); await del.press("Enter"); await page.waitForTimeout(600);
    await insp.locator("details.pb-hdr-acc > summary", { hasText: "Style d'un lien (individuel)" }).click(); await page.waitForTimeout(500);
    await insp.getByLabel("Lien", { exact: true }).selectOption("p1"); await page.waitForTimeout(600);
    const col = insp.getByLabel("Couleur du texte", { exact: true }); await col.fill("#c2410c"); await col.press("Tab"); await page.waitForTimeout(700);
    await insp.getByLabel("État", { exact: true }).selectOption("hover"); await page.waitForTimeout(600);
    const bg = insp.getByLabel("Fond", { exact: true }); await bg.fill("#fff7ed"); await bg.press("Tab"); await page.waitForTimeout(700);
    await insp.getByRole("button", { name: "Copier le style de ce lien" }).click(); await page.waitForTimeout(300);
    await insp.getByLabel("Lien", { exact: true }).selectOption("p2"); await page.waitForTimeout(600);
    await insp.getByRole("button", { name: "Coller seulement la typographie" }).click(); await page.waitForTimeout(700);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(2000);
    const mid = JSON.parse(env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId).draft);
    let m0 = null; const w0 = (l) => (l || []).forEach((x) => { if (x.type === "menu") m0 = x; w0(x.children); }); w0(mid.children || mid.sections || []);
    assert.equal(JSON.stringify((m0.props.itemStyles || {}).p2 || {}).includes("#c2410c"), false, "la typographie seule ne colle aucune couleur");
    await insp.getByRole("button", { name: "Coller seulement les couleurs" }).click(); await page.waitForTimeout(700);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(2000);
    const draft = JSON.parse(env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId).draft);
    let menu = null; const w = (l) => (l || []).forEach((x) => { if (x.type === "menu") menu = x; w(x.children); }); w(draft.children || draft.sections || []);
    assert.ok(menu, "menu trouvé dans le document");
    assert.equal(menu.props.itemStyles.p1.link.styles.desktop.color, "#c2410c");
    assert.equal(menu.props.itemStyles.p1.link.states.hover.backgroundColor, "#fff7ed");
    assert.equal(menu.props.menuMotion.enter, "slide-up"); assert.equal(menu.props.menuMotion.closeDelay, 350);
    assert.equal(menu.props.itemStyles.p2.link.styles.desktop.color, "#c2410c", "couleurs collées sur le lien 3");
    assert.equal(menu.props.itemStyles.p0, undefined, "les autres liens ne sont pas touchés");
    // visibilité par écran : cases à cocher du lien « Services » (p1)
    await insp.getByLabel("Lien", { exact: true }).selectOption("p1"); await page.waitForTimeout(600);
    await insp.getByLabel("Masquer sur mobile (moins de 768 px)").check(); await page.waitForTimeout(600);
    await insp.getByLabel("Masquer sur tablette (768 à 1023 px)").check(); await page.waitForTimeout(600);
    await insp.getByLabel("Masquer sur tablette (768 à 1023 px)").uncheck(); await page.waitForTimeout(600);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(2000);
    const d3 = JSON.parse(env.db.prepare("SELECT draft FROM mk_web_components WHERE id = ?").get(componentId).draft);
    let menu3 = null; const w3 = (l) => (l || []).forEach((x) => { if (x.type === "menu") menu3 = x; w3(x.children); }); w3(d3.children || d3.sections || []);
    assert.deepEqual(menu3.props.itemStyles.p1.hide, ["mobile"], "masqué sur mobile seulement");
    assert.equal(menu3.props.itemStyles.p1.link.styles.desktop.color, "#c2410c", "le style du lien est conservé");
    assert.equal(menu3.props.itemStyles.p0, undefined, "les autres liens ne sont pas touchés");
    assert.deepEqual(logs.filter((l) => /^(error|PAGEERROR)/.test(l)), [], "aucune erreur de script");
  });
});
