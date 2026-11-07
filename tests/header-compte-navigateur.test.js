// Header Builder, lot L5 (compte) — menu déroulant du compte visiteur : un visiteur connecté voit Mon compte / Panier / Se déconnecter ; un invité garde les liens habituels ;
// clavier, Échap, clic extérieur. Le widget existant reste identique. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const { newStudent } = require("./helpers");

describe("Header Builder L5 : menu du compte (navigateur)", { skip: SKIP }, () => {
  let env, student;
  const withAccount = (props) => (s) => { let host = null; const walk = (nodes) => { for (const n of nodes) { if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } }; walk(s.children); host.children.push({ id: "acct000001", type: "account", props }); };
  const visitAs = async (client) => {
    const context = await env.browser.newContext({ viewport: { width: 1280, height: 800 } });
    if (client) await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(`${env.srv.base}/p/${env.slug()}`); await page.waitForSelector(".lp-site-header"); return { context, page };
  };
  before(async () => { env = await setup({ siteName: "Site compte" }); student = await newStudent(env.srv); await env.publishHeader("classique-logo-menu-bouton.clair", { mode: "static" }, withAccount({ skin: "menu", showCart: true, login: "Se connecter", account: "Mon compte", cart: "Panier" })); });
  after(async () => { if (env) await env.close(); });

  test("visiteur connecté : un bouton « Mon compte » ouvre un menu (compte, panier, déconnexion) ; Échap le ferme et rend le focus", async () => {
    const { context, page } = await visitAs(student);
    const d = page.locator(".lp-site-header .kw-account-details"), list = page.locator(".lp-site-header .kw-account-list");
    assert.equal(await list.isVisible(), false, "fermé au départ");
    await d.locator("summary").click(); assert.equal(await list.isVisible(), true);
    assert.deepEqual((await list.locator("a, button").allInnerTexts()).map((t) => t.trim().split("\n")[0]), ["Mon compte", "Panier", "Se déconnecter"]);
    assert.equal(await list.locator("form[action='/deconnexion'][method=post]").count(), 1, "la déconnexion est un formulaire POST");
    await page.keyboard.press("Escape"); assert.equal(await list.isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.tagName), "SUMMARY", "le focus revient au titre");
    await d.locator("summary").click(); await page.evaluate(() => document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }))); assert.equal(await list.isVisible(), false, "clic extérieur");
    await context.close();
  });

  test("clavier : Entrée ouvre, Tab parcourt les liens, Tab hors du menu le referme", async () => {
    const { context, page } = await visitAs(student);
    await page.locator(".lp-site-header .kw-account-summary").focus(); await page.keyboard.press("Enter");
    assert.equal(await page.locator(".kw-account-list").isVisible(), true);
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); await page.waitForTimeout(120);
    assert.equal(await page.locator(".kw-account-list").isVisible(), false, "le focus qui sort referme");
    await context.close();
  });

  test("invité : les liens habituels (Se connecter), aucun menu déroulant ; le widget sans option est inchangé", async () => {
    const { context, page } = await visitAs(null);
    assert.equal(await page.locator(".lp-site-header .kw-account-details").count(), 0, "pas de menu pour un invité");
    assert.match(await page.locator(".lp-site-header .kw-account").innerText(), /Se connecter/);
    await context.close();
    await env.publishHeader("classique-logo-menu-bouton.clair", { mode: "static" }, withAccount({ showCart: true, login: "Se connecter", account: "Mon compte", cart: "Panier" }));
    const m = await visitAs(student); assert.equal(await m.page.locator(".lp-site-header .kw-account-details").count(), 0, "sans l'option « menu » : lien simple, comme avant");
    assert.match(await m.page.locator(".lp-site-header .kw-account").innerText(), /Mon compte/); await m.context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
