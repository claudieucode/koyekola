// Section Comptes : le contenu occupe la largeur disponible (grands écrans), s'empile sur mobile, jamais de débordement horizontal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Comptes : mise en page (navigateur)", { skip: SKIP }, () => {
  let env, ctx, page, S;
  before(async () => {
    env = await setup({ siteName: "Site Comptes" });
    ctx = await env.browser.newContext({ viewport: { width: 1920, height: 1000 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await ctx.newPage(); page.on("pageerror", (e) => env.errors.push(e.message));
    S = `/marketing/site-web/sites/${env.site}`;
  });
  after(async () => { if (ctx) await ctx.close(); if (env) await env.close(); });
  const PAGES = ["equipe", "equipe-ajouter", "equipe-inviter", "equipe-invitations", "equipe-roles", "equipe-permissions", "equipe-profil"];
  const measure = () => page.evaluate(() => {
    const main = document.querySelector("main.mk-content"), m = main.getBoundingClientRect();
    const inner = main.querySelector(".mk-su, .ac, .mk-pf") || main;
    const w = inner.getBoundingClientRect().width, cs = getComputedStyle(main);
    const avail = m.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return { w, avail, over: document.documentElement.scrollWidth - window.innerWidth };
  });
  for (const width of [1920, 1440, 1280]) {
    test(`${width} px : chaque page occupe l'essentiel de la largeur, sans débordement`, async () => {
      await page.setViewportSize({ width, height: 1000 });
      for (const p of PAGES) {
        await page.goto(`${env.srv.base}${S}/${p}`);
        const r = await measure();
        assert.ok(r.w >= Math.min(r.avail, 1720) * 0.97, `${p} : ${Math.round(r.w)} px sur ${Math.round(r.avail)} disponibles`);
        assert.ok(r.over <= 1, `${p} : débordement horizontal`);
        if (process.env.CP_SHOTS) await page.screenshot({ path: `${process.env.CP_SHOTS}/${width}-${p}.png` });
      }
    });
  }
  for (const width of [768, 390]) {
    test(`${width} px : aucun débordement horizontal`, async () => {
      await page.setViewportSize({ width, height: 900 });
      for (const p of PAGES) {
        await page.goto(`${env.srv.base}${S}/${p}`);
        assert.ok((await measure()).over <= 1, `${p} déborde à ${width} px`);
        if (process.env.CP_SHOTS) await page.screenshot({ path: `${process.env.CP_SHOTS}/${width}-${p}.png` });
      }
    });
  }
  test("ajout : les deux cartes sont côte à côte en grand écran", async () => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await page.goto(`${env.srv.base}${S}/equipe-ajouter`);
    const cards = await page.locator(".ac-card").evaluateAll((l) => l.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y })));
    assert.ok(cards.length >= 2 && Math.abs(cards[0].y - cards[1].y) < 2 && cards[1].x > cards[0].x + 400, JSON.stringify(cards));
    assert.equal(env.errors.length, 0, env.errors.join(" | "));
  });

  test("permissions : accordéons verticaux pleine largeur, en-tête gris très clair, compteurs justes, ouverture/fermeture, état conservé au changement de rôle", async () => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`${env.srv.base}${S}/equipe-permissions`);
    const geo = await page.locator("[data-perm-acc] > details").evaluateAll((l) => l.map((e) => { const r = e.getBoundingClientRect(), sm = getComputedStyle(e.querySelector("summary")); return { x: Math.round(r.x), w: Math.round(r.width), y: r.y, bg: sm.backgroundColor }; }));
    assert.ok(geo.length >= 8, "toutes les catégories");
    assert.ok(geo.every((g) => g.x === geo[0].x && g.w === geo[0].w), "même colonne, même largeur");
    assert.ok(geo.every((g, i) => i === 0 || g.y > geo[i - 1].y), "empilées verticalement");
    
    // compteurs = nombre réel de ✓ dans la catégorie
    const ok = await page.locator("[data-perm-acc] > details").evaluateAll((l) => l.every((d) => { const m = d.querySelector(".mk-su-title small").textContent.match(/(\d+) permissions? accord\S+ sur (\d+)/); return +m[1] === d.querySelectorAll("li.is-on").length && +m[2] === d.querySelectorAll("li").length; }));
    assert.ok(ok, "compteurs cohérents avec les permissions affichées");
    assert.equal(await page.locator("[data-perm-acc] > details[open]").count(), 0, "tout replié au départ, comme Confidentialité");
    assert.equal(await page.locator("[data-perm-acc] summary").first().evaluate((e) => getComputedStyle(e).backgroundColor), "rgb(235, 240, 247)");
    if (process.env.CP_SHOTS) await page.screenshot({ path: `${process.env.CP_SHOTS}/perm-ferme.png` });
    // ouverture / fermeture
    const first = page.locator("[data-perm-acc] > details").first(), sum = first.locator("summary");
    const was = await first.evaluate((d) => d.open);
    await sum.click(); assert.equal(await first.evaluate((d) => d.open), !was);
    await sum.click(); assert.equal(await first.evaluate((d) => d.open), was);
    // tout replier puis changement de rôle : l'état est conservé
    await page.getByRole("button", { name: "Tout replier" }).click();
    assert.equal(await page.locator("[data-perm-acc] > details[open]").count(), 0);
    const other = await page.locator("#su-pr option:not(:checked)").last().getAttribute("value");
    await Promise.all([page.waitForNavigation(), page.selectOption("#su-pr", other)]);
    assert.equal(await page.locator("[data-perm-acc] > details[open]").count(), 0, "catégories restées repliées après changement de rôle");
    await page.getByRole("button", { name: "Tout déplier" }).click();
    assert.equal(await page.locator("[data-perm-acc] > details:not([open])").count(), 0);
    await page.waitForTimeout(600);
    if (process.env.CP_SHOTS) await page.screenshot({ path: `${process.env.CP_SHOTS}/perm-accordeons.png`, fullPage: false });
    // mobile : une seule colonne interne
    await page.setViewportSize({ width: 390, height: 900 });
    const cols = await page.locator("[data-perm-acc] ul").first().evaluate((u) => getComputedStyle(u).gridTemplateColumns.split(" ").length);
    assert.equal(cols, 1);
    assert.equal(env.errors.length, 0, env.errors.join(" | "));
  });
});
