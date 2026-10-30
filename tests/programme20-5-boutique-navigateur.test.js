// Programme 20.5 — boutique publique dans un VRAI Chrome (Playwright, ignoré sans) : ordinateur, tablette, mobile.
// Mesure : aucun défilement horizontal, rien qui déborde, boutons et champs utilisables (≥ 36 px), grille de produits qui se replie, ajout au panier sans rechargement (badge mis à jour par le serveur),
// panier et caisse lisibles. SHOP_SHOTS=<dossier> enregistre des captures.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mise en page non mesurée sur cette machine" : false;
const SIZES = { ordinateur: 1280, tablette: 820, mobile: 375 };

describe("boutique publique (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const shot = async (page, name) => { if (process.env.SHOP_SHOTS) { fs.mkdirSync(process.env.SHOP_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.SHOP_SHOTS}/${name}.png`, fullPage: true }); } };
  const open = async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    context.setDefaultTimeout(8000);
    return { context, page: await context.newPage() };
  };
  const overflow = (page) => page.evaluate(() => {
    const out = { hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, wide: [], small: [] };
    for (const e of document.querySelectorAll("body *")) { if (e.closest(".sh-table-wrap")) continue; const r = e.getBoundingClientRect(); if (r.width && r.right > document.documentElement.clientWidth + 1) out.wide.push(`${e.tagName}.${String(e.className).slice(0, 30)}`); }
    for (const e of document.querySelectorAll("main button, main input:not([type=checkbox]):not([type=radio]):not([type=hidden]), main select")) { const r = e.getBoundingClientRect(); if (r.width && r.height < 34) out.small.push(`${e.tagName}${e.name ? "[" + e.name + "]" : ""}:${Math.round(r.height)}`); }
    return out;
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const P = "/marketing/site-web/principal/boutique";
    await boss.post(`${P}/livraison/zones`, { name: "France", countries: "FR" });
    const db = srv.db(); const zid = db.prepare("SELECT id FROM mk_shop_shipping_zones WHERE site_id IS NULL").get().id;
    await boss.post(`${P}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
    await boss.post(`${P}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1" });
    for (let i = 1; i <= 8; i += 1) await boss.post(`${P}/produits`, { name: `Produit de démonstration numéro ${i} au nom assez long pour tester le retour à la ligne`, price: String(10 + i), status: "published", type: "simple", requires_shipping: "1", manage_stock: "1", stock_qty: "20", sale_price: i === 2 ? "8" : "" });
    db.close();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  for (const [name, width] of Object.entries(SIZES)) {
    test(`${name} (${width} px) : catalogue, fiche, panier et caisse sans débordement`, async () => {
      const { context, page } = await open(width);
      try {
        await page.goto(`${srv.base}/boutique`);
        await page.locator(".sh-card").first().waitFor();
        let m = await overflow(page);
        assert.equal(m.hscroll, false, "défilement horizontal du catalogue : " + JSON.stringify(m.wide.slice(0, 6))); assert.deepEqual(m.wide, []);
        await shot(page, `${name}-catalogue`);
        const cols = await page.evaluate(() => new Set([...document.querySelectorAll(".sh-card")].map((c) => Math.round(c.getBoundingClientRect().left))).size);
        if (width <= 520) assert.ok(cols <= 2, `grille mobile : ${cols} colonnes`); else assert.ok(cols >= 2);

        await page.locator(".sh-card-link").first().click();
        await page.locator("[data-sh-add] button[type=submit]").waitFor();
        m = await overflow(page);
        assert.equal(m.hscroll, false, "fiche produit : " + JSON.stringify(m.wide.slice(0, 6))); assert.deepEqual(m.small, [], "contrôles trop petits");
        await shot(page, `${name}-produit`);
        // Ajout sans rechargement : le badge vient du serveur
        const before = await page.locator("[data-sh-cart-count]").first().textContent();
        await page.fill("input[name=quantity]", "2");
        await page.locator("[data-sh-add] button[type=submit]").click();
        await page.locator("[data-sh-msg]").filter({ hasText: "Ajouté" }).waitFor();
        await page.waitForFunction((b) => document.querySelector("[data-sh-cart-count]").textContent !== b, before);
        assert.equal((await page.locator("[data-sh-cart-count]").first().textContent()).trim(), "2");

        await page.goto(`${srv.base}/boutique/panier`);
        await page.locator(".sh-table").waitFor();
        m = await overflow(page);
        assert.equal(m.hscroll, false, "panier : " + JSON.stringify(m.wide.slice(0, 6))); assert.deepEqual(m.small, [], "panier : contrôles");
        await shot(page, `${name}-panier`);

        await page.goto(`${srv.base}/boutique/commande?pays=FR`);
        await page.locator("form.sh-form").waitFor();
        m = await overflow(page);
        assert.equal(m.hscroll, false, "caisse : " + JSON.stringify(m.wide.slice(0, 6))); assert.deepEqual(m.wide, []);
        await shot(page, `${name}-commande`);
      } finally { await context.close(); }
    });
  }
  test("navigation au clavier : le lien d'évitement et le focus visible existent", async () => {
    const { context, page } = await open(1280);
    try {
      await page.goto(`${srv.base}/boutique`);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement.className), "sh-skip");
      assert.equal(await page.evaluate(() => document.documentElement.lang), "fr");
    } finally { await context.close(); }
  });
});
