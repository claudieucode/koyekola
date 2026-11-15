// Page Conformité : champs alignés sur une ligne (bureau), empilés sur mobile, aucun débordement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Conformité : mise en page (navigateur)", { skip: SKIP }, () => {
  let env, ctx, page;
  before(async () => {
    env = await setup({ siteName: "Site Conformité" });
    ctx = await env.browser.newContext({ viewport: { width: 1500, height: 900 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await ctx.newPage();
  });
  after(async () => { if (ctx) await ctx.close(); if (env) await env.close(); });
  const box = (sel) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });

  test("bureau : adresse, motif et bouton sur une seule ligne, mêmes hauteurs", async () => {
    await page.goto(`${env.srv.base}/marketing/conformite`);
    const a = await box("#s-email"), b = await box("#s-note"), c = await box(".cf-line button.btn");
    assert.equal(a.h, 40); assert.equal(c.h, 40); assert.ok(a.x + a.w < b.x && b.x + b.w < c.x);
    const k1 = await box("#k-label"), k2 = await box("#k-key"), d = await box("#k-desc");
    assert.ok(Math.abs(k1.y - k2.y) < 1, "libellé et clé alignés");
    assert.ok(d.y > k1.y + k1.h && d.w > k1.w * 1.9, "description sur toute la largeur, dessous");
  });
  test("mobile : tout s'empile, aucun défilement horizontal", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(`${env.srv.base}/marketing/conformite`);
    const a = await box("#s-email"), b = await box("#s-note");
    assert.ok(b.y > a.y + a.h - 1, "empilés");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de débordement");
  });
});
