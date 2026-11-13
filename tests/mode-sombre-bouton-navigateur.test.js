// Mode sombre avec bouton : le réglage « toggle » est accepté, le CSS prévoit le choix du visiteur, et le bouton fonctionne (choix mémorisé).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const ss = require("../src/marketing/pages/siteSettings");

describe("mode sombre : bouton du visiteur", { skip: SKIP }, () => {
  let env;
  before(async () => { env = await setup({ siteName: "Site sombre" }); });
  after(async () => { if (env) await env.close(); });

  test("réglages : « toggle » accepté, valeur inconnue refusée ; CSS et attribut du bouton", () => {
    const s = ss.normalizeSettings({ dark: { mode: "toggle", background: "#101820", text: "#eeeeee" } }, { strict: true });
    assert.equal(s.dark.mode, "toggle");
    const css = ss.layoutCss(s);
    assert.match(css, /html:not\(\[data-kw-dark="0"\]\) \.lp-site/);
    assert.match(css, /html\[data-kw-dark="1"\] \.lp-site/);
    assert.match(ss.siteAssets({}, s, () => "").lightboxAttrs, /data-kw-dark-toggle="1"/);
    assert.doesNotMatch(ss.siteAssets({}, ss.normalizeSettings({ dark: { mode: "auto" } }, { strict: true }), () => "").lightboxAttrs, /data-kw-dark-toggle/);
    assert.throws(() => ss.normalizeSettings({ dark: { mode: "bizarre" } }, { strict: true }));
  });

  test("dans le navigateur : bouton présent, bascule clair / sombre, choix mémorisé au rechargement", async () => {
    const url = `/marketing/site-web/sites/${env.site}/reglages.json`;
    const cur = JSON.parse((await env.boss.get(url)).text);
    const r = await env.boss.request(url, { method: "PUT", json: { tokens: cur.tokens, settings: { ...cur.settings, dark: { mode: "toggle", background: "#101820", surface: "#18222c", text: "#f1f1f1", muted: "", primary: "" } }, revision: cur.revision } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    assert.equal((await env.boss.request(`/marketing/pages/${env.pageId}/publier.json`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    const context = await env.browser.newContext({ viewport: { width: 1280, height: 800 } }); const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => env.errors.push(`pageerror : ${e.message}`));
    await page.goto(`${env.srv.base}/p/${env.slug()}`); await page.waitForSelector(".kw-dark-toggle");
    try {
      assert.equal(await page.locator(".kw-dark-toggle").count(), 1);
      const bg = () => page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--kw-background").trim() || getComputedStyle(document.body).backgroundColor);
      const before = await page.evaluate(() => document.documentElement.getAttribute("data-kw-dark"));
      assert.equal(before, null);
      await page.click(".kw-dark-toggle");
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kw-dark")), "1");
      assert.match(await bg(), /#101820|rgb\(16, 24, 32\)/);
      await page.reload(); await page.waitForSelector(".kw-dark-toggle");
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kw-dark")), "1", "choix mémorisé");
      await page.click(".kw-dark-toggle");
      assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kw-dark")), "0");
      assert.doesNotMatch(await bg(), /#101820|rgb\(16, 24, 32\)/);
    } finally { await context.close(); }
    assert.deepEqual(env.errors, []);
  });
});
