// Modèles du Theme Builder (archive, 404…) — onglet de réglages de l'éditeur : colonnes de la grille de résultats par écran, alignement, ordre et masquage des blocs, style, éléments.
// VRAI Chrome. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Modèles du Theme Builder : onglet de réglages de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let env, context;
  const adopt = async (type, key) => {
    const used = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type, key }, headers: env.origin });
    assert.equal(used.status, 200, `${type} : ${used.text.slice(0, 160)}`);
    const t = JSON.parse(used.text).template; return { editUrl: t.editUrl, cid: Number(t.editUrl.match(/(?:composants|pages)\/(\d+)/)[1]) };
  };
  const draftOf = (cid) => {
    const row = env.db.prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(cid);
    const d = row.draft ? JSON.parse(row.draft) : {}; const list = (Array.isArray(d.sections) ? d.sections : JSON.parse(row.sections || "[]")).filter((x) => x && x.type === "layout");
    return list.find((x) => firstOf(x, "grid")) || list[0];
  };
  const firstOf = (node, type) => { let found = null; (function w(n) { if (!found && n.type === type) found = n; (n.children || []).forEach(w); })(node); return found; };
  const open = async (t) => {
    const page = await context.newPage(); page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(env.srv.base + t.editUrl); await page.waitForSelector("#pb-tab-page", { state: "attached" }); await page.waitForTimeout(800);
    await page.locator("#pb-tab-page").click(); return page;
  };
  const openSec = async (page, name) => { const d = page.locator("details.pb-hdr-acc", { has: page.locator("summary", { hasText: name }) }).first(); if (!(await d.evaluate((e) => e.open))) await d.locator("> summary").click(); await page.waitForTimeout(150); };
  before(async () => {
    env = await setup({ siteName: "Site modèles" });
    context = await env.browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(20000);
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("archive : l'onglet s'appelle « Archive » ; les colonnes de la grille de résultats se règlent par écran sans toucher l'ordinateur", async () => {
    const t = await adopt("archive", "blog.grille"); const page = await open(t);
    assert.equal((await page.locator("#pb-tab-page").innerText()).trim(), "Archive");
    const pane = page.locator("[data-pb-page-settings]");
    for (const n of ["Disposition", "Style du conteneur", "Éléments du modèle", "Écrans du site"]) assert.equal(await pane.locator("details.pb-hdr-acc > summary", { hasText: n }).count(), 1, `section « ${n} »`);
    await openSec(page, "Disposition");
    const before = JSON.stringify((firstOf(draftOf(t.cid), "grid").styles || {}).desktop || {});
    await pane.getByRole("radio", { name: "Tablette" }).first().click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "2 colonnes" }).click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "Mobile" }).first().click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "1 colonne" }).click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    const grid = firstOf(draftOf(t.cid), "grid");
    assert.equal(grid.styles.tablet.columns, 2); assert.equal(grid.styles.mobile.columns, 1);
    assert.equal(JSON.stringify(grid.styles.desktop || {}), before, "ordinateur inchangé");
    await page.close();
  });

  test("page 404 : pas de grille de résultats (aucun choix de colonnes), mais alignement et ordre des blocs réglables", async () => {
    const t = await adopt("not_found", "page-blanche"); const page = await open(t);
    assert.equal((await page.locator("#pb-tab-page").innerText()).trim(), "Page 404");
    const pane = page.locator("[data-pb-page-settings]"); await openSec(page, "Disposition");
    assert.equal(await pane.getByRole("radiogroup", { name: "Nombre de colonnes" }).count(), 0, "pas de choix de colonnes");
    await pane.getByRole("radio", { name: "Centré" }).click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    assert.equal(draftOf(t.cid).children[0].styles.desktop.textAlign, "center");
    assert.ok(await pane.locator(".pb-hdr-slot").count() >= 1, "blocs listés pour l'ordre et le masquage");
    await page.close();
    assert.deepEqual(env.errors, []);
  });
});
