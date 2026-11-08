// Header Builder — barre d'en-tête collée en BAS de l'écran : fixée au bas, place réservée dans la page (aucun saut de contenu), sous-menus vers le haut,
// retour à un en-tête ordinaire sur les appareils décochés. Dans un VRAI Chrome ; ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder : barre en bas (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => { env = await setup({ siteName: "Site bas" }); });
  after(async () => { if (env) await env.close(); });

  test("fixée au bas de l'écran, avec la hauteur réservée à sa place d'origine ; elle reste en bas après défilement", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "sticky", edge: "bottom", reserve: 96 });
    const { context, page } = await env.visit();
    const head = page.locator(".lp-site-header");
    const holder = await head.boundingBox();
    assert.ok(Math.abs(holder.height - 96) < 1.5, `place réservée ${holder.height}`);
    const bar = await head.locator("> .kw-layout").boundingBox();
    assert.ok(Math.abs(bar.y + bar.height - 800) < 2, `barre collée au bas de l'écran (${bar.y}+${bar.height})`);
    await page.evaluate(() => window.scrollTo(0, 300)); await page.waitForTimeout(150);
    const after = await head.locator("> .kw-layout").boundingBox();
    assert.ok(Math.abs(after.y + after.height - 800) < 2, "toujours en bas après défilement");
    await context.close();
  });

  test("appareil décoché : redevient un en-tête ordinaire en haut de page", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "sticky", edge: "bottom", reserve: 96, stickOn: ["desktop", "tablet"] });
    const { context, page } = await env.visit({ viewport: { width: 390, height: 800 } });
    const box = await page.locator(".lp-site-header > .kw-layout").boundingBox();
    assert.ok(box.y < 5, `en haut sur mobile (${box.y})`);
    await context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
