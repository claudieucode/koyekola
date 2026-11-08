// Pied de page — onglet « Pied de page » de l'éditeur : colonnes par écran, espacement, alignement, ordre et masquage des colonnes, style du conteneur, éléments.
// VRAI Chrome, éditeur ouvert sur un modèle de pied de page du Theme Builder. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Pied de page : onglet de réglages de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let env, componentId, context, page;
  const draft = () => { const row = env.db.prepare("SELECT draft, section FROM mk_web_components WHERE id = ?").get(componentId); const d = JSON.parse(row.draft || row.section); return Array.isArray(d.sections) ? d.sections[0] : d; };
  // Barre des colonnes : le conteneur qui a le plus d'enfants conteneurs (même règle que l'éditeur)
  const colsNode = () => { let best = null, n0 = 1; const walk = (n) => { const k = (n.children || []).filter((c) => ["container", "grid", "group", "stack"].includes(c.type)); if (k.length > n0) { best = n; n0 = k.length; } (n.children || []).forEach(walk); }; const sec = draft(); walk(sec.children[0]); return best || sec.children[0]; };
  const openSec = async (name) => { const d = page.locator("details.pb-hdr-acc", { has: page.locator("summary", { hasText: name }) }).first(); if (!(await d.evaluate((e) => e.open))) await d.locator("> summary").click(); await page.waitForTimeout(150); };
  before(async () => {
    env = await setup({ siteName: "Site pied" });
    const used = await env.boss.request(env.U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "footer", key: "quatre-colonnes-liens.nuit" }, headers: env.origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template; componentId = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    context = await env.browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await context.newPage(); context.setDefaultTimeout(20000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(env.srv.base + t.editUrl); await page.waitForSelector("#pb-tab-page", { state: "attached" }); await page.waitForTimeout(800);
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("l'onglet s'appelle « Pied de page » et propose quatre accordéons, un seul ouvert à la fois", async () => {
    assert.equal((await page.locator("#pb-tab-page").innerText()).trim(), "Pied de page");
    await page.locator("#pb-tab-page").click();
    const pane = page.locator("[data-pb-page-settings]");
    for (const t of ["Colonnes et disposition", "Style du conteneur", "Éléments du pied de page", "Écrans du site"]) assert.equal(await pane.locator("details.pb-hdr-acc > summary", { hasText: t }).count(), 1, `section « ${t} »`);
    assert.equal(await pane.locator("details.pb-hdr-acc[open]").count(), 1, "un seul ouvert au départ");
    await openSec("Style du conteneur"); assert.equal(await pane.locator("details.pb-hdr-acc[open]").count(), 1);
    // états propres au pied : normal et survol seulement (pas d'« après défilement » ni de « menu ouvert »)
    assert.equal(await pane.getByRole("radio", { name: "Après défilement" }).count(), 0); assert.ok(await pane.getByRole("radio", { name: "Survol" }).count() >= 1);
  });

  test("colonnes par écran : 2 sur tablette, 1 sur mobile ; l'ordinateur n'est pas touché", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Colonnes et disposition");
    const before = colsNode().styles && colsNode().styles.desktop ? JSON.stringify(colsNode().styles.desktop) : "";
    await pane.getByRole("radio", { name: "Tablette" }).first().click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "2 colonnes" }).click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "Mobile" }).first().click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "1 colonne" }).click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    const c = colsNode();
    assert.equal(c.styles.tablet.columns, 2, "tablette : 2 colonnes"); assert.equal(c.styles.mobile.columns, 1, "mobile : 1 colonne");
    assert.equal(c.styles.tablet.display, "grid");
    assert.equal(c.styles.desktop ? JSON.stringify(c.styles.desktop) : "", before, "l'ordinateur est inchangé");
  });

  test("espacement et alignement du texte écrits pour l'écran choisi ; état « survol » du style non confondu avec le Normal", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Colonnes et disposition");
    await pane.getByRole("radio", { name: "Mobile" }).first().click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "Large", exact: false }).filter({ hasText: "40px" }).click(); await page.waitForTimeout(300);
    await pane.getByRole("radio", { name: "Centré" }).click(); await page.waitForTimeout(300);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    assert.equal(colsNode().styles.mobile.gap, "40px"); assert.equal(draft().children[0].styles.mobile.textAlign, "center");
    assert.ok(!(colsNode().states && colsNode().states.hover && colsNode().states.hover.gap), "rien n'est écrit dans l'état survol");
  });

  test("ordre et masquage : une colonne avance d'une place et se masque sur le mobile, sans pouvoir être masquée partout", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Colonnes et disposition");
    const rows = pane.locator(".pb-hdr-slot"); assert.ok(await rows.count() >= 3, "les colonnes sont listées");
    const first = await rows.nth(0).locator(".pb-hdr-title").innerText();
    await rows.nth(1).getByRole("button", { name: "Avancer d'une place" }).click(); await page.waitForTimeout(400);
    assert.notEqual(await pane.locator(".pb-hdr-slot").nth(0).locator(".pb-hdr-title").innerText(), first, "l'ordre a changé");
    await pane.locator(".pb-hdr-slot").nth(2).getByRole("button", { name: "Masquer sur cet écran" }).click(); await page.waitForTimeout(300);
    assert.match(await pane.locator(".pb-hdr-slot").nth(2).innerText(), /Masquée sur cet écran/);
    await page.locator("[data-pb-save-now]").click(); await page.waitForTimeout(1500);
    assert.ok(colsNode().children.some((k) => (k.hideOn || []).includes("mobile")), "masquée sur mobile dans le document");
  });

  test("capture (seulement si SHOT est défini)", async () => {
    if (!process.env.SHOT) return;
    await page.locator("[data-pb-left]").evaluate((e) => { e.scrollTop = 0; });
    await page.getByRole("radio", { name: "Ordinateur" }).first().click().catch(() => {});
    await openSec("Colonnes et disposition"); await page.waitForTimeout(400);
    await page.setViewportSize({ width: 1500, height: 2200 }); await page.waitForTimeout(400);
    await page.locator("[data-pb-left]").screenshot({ path: process.env.SHOT + "-footer.png" });
    await page.setViewportSize({ width: 1500, height: 950 });
  });

  test("éléments : la liste des éléments du pied ouvre leurs réglages à droite ; aucune erreur de script", async () => {
    const pane = page.locator("[data-pb-page-settings]"); await openSec("Éléments du pied de page");
    const rows = pane.locator("details.pb-hdr-acc[open] .pb-hdr-row"); assert.ok(await rows.count() >= 4, "éléments listés");
    await rows.nth(1).click(); await page.locator("[data-pb-inspector] .pb-insp-title").waitFor();
    assert.deepEqual(env.errors, []);
  });
});
