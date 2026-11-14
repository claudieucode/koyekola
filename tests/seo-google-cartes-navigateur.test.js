// SEO › Google : cartes Search Console et GA4 dans un vrai Chrome. Aucune connexion Google simulée comme réussie : l'adresse de Google est volontairement injoignable,
// donc une clé bien formée est enregistrée mais la vérification échoue et la carte doit afficher « Connexion impossible » (jamais « Connecté »).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
process.env.SEO_GOOGLE_TOKEN_URL = "http://127.0.0.1:9/token"; process.env.SEO_GSC_URL = "http://127.0.0.1:9"; process.env.SEO_GA4_URL = "http://127.0.0.1:9";
const { setup, SKIP } = require("./header-aides");

describe("SEO › Google : cartes (navigateur)", { skip: SKIP }, () => {
  let env, ctx, page, url, key;
  before(async () => {
    env = await setup({ siteName: "Site Google" });
    ctx = await env.browser.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await ctx.newPage(); page.on("pageerror", (e) => env.errors.push(e.message));
    url = `${env.srv.base}/marketing/site-web/sites/${env.site}/seo/connexions`;
    const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    key = JSON.stringify({ type: "service_account", client_email: "svc@projet.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) }, null, 2);
  });
  after(async () => { if (ctx) await ctx.close(); if (env) await env.close(); });
  const card = (b) => page.locator(`[data-gx-card="${b}"]`);

  test("deux cartes, état « Non connecté » venu du serveur, champs larges, aucune coquille &quot; dans le texte d'aide", async () => {
    await page.goto(url);
    for (const b of ["search_console", "analytics"]) {
      assert.match(await card(b).locator("[data-gx-pill]").innerText(), /Non connecté/);
      const w = await card(b).locator("textarea").evaluate((e) => e.getBoundingClientRect().width), cw = await card(b).evaluate((e) => e.getBoundingClientRect().width);
      assert.ok(w > cw * 0.85, `zone JSON large (${w}/${cw})`);
      assert.ok((await card(b).locator("textarea").evaluate((e) => e.getBoundingClientRect().height)) >= 180, "zone JSON haute");
      assert.ok(!(await card(b).locator("textarea").getAttribute("placeholder")).includes("&quot;"));
    }
    const boxes = await page.locator("[data-gx-card]").evaluateAll((l) => l.map((e) => e.getBoundingClientRect().left));
    assert.ok(Math.abs(boxes[0] - boxes[1]) > 300, "deux cartes côte à côte sur ordinateur");
    await page.screenshot({ path: process.env.GX_SHOTS ? process.env.GX_SHOTS + "/gx-desktop.png" : "/dev/null" });
  });

  test("JSON : invalide signalé, valide confirmé avec l'e-mail du compte ; un envoi invalide est bloqué", async () => {
    const c = card("search_console"), ta = c.locator("textarea"), st = c.locator("[data-gx-json-state]");
    await ta.fill("{ pas du json"); assert.match(await st.innerText(), /JSON invalide/); assert.equal(await ta.getAttribute("aria-invalid"), "true");
    await ta.fill('{"type":"autre"}'); assert.match(await st.innerText(), /compte de service/);
    await c.locator("input[name=property]").fill("sc-domain:exemple.com");
    await c.locator("[data-gx-save]").click(); await page.waitForTimeout(300);
    assert.equal(page.url(), url, "l'envoi d'un JSON invalide est bloqué");
    await ta.fill(key); assert.match(await st.innerText(), /JSON valide.*svc@projet\.iam\.gserviceaccount\.com/s);
  });

  test("enregistrement d'une clé bien formée : Google injoignable → « Connexion impossible » (jamais « Connecté ») ; clé jamais réaffichée ; configuration conservée", async () => {
    const c = card("search_console");
    await Promise.all([page.waitForNavigation({ timeout: 60000 }), c.locator("[data-gx-save]").click()]);
    const pill = await card("search_console").locator("[data-gx-pill]").innerText();
    assert.doesNotMatch(pill, /^Connecté/); assert.match(pill, /Connexion impossible|Non vérifié/);
    assert.equal(await card("search_console").locator("input[name=property]").inputValue(), "sc-domain:exemple.com", "la propriété est conservée");
    const html = await page.content();
    assert.ok(!html.includes("PRIVATE KEY") && !html.includes("svc@projet.iam"), "la clé n'est jamais renvoyée dans la page");
    assert.equal(await card("search_console").locator("textarea").inputValue(), "");
    assert.match(await card("search_console").locator("[data-gx-json-state]").innerText(), /jamais réaffichée/);
    assert.ok(await card("search_console").getByRole("button", { name: "Vérifier la connexion" }).count() === 1);
    assert.match(await card("analytics").locator("[data-gx-pill]").innerText(), /Non connecté/, "l'autre carte n'est pas touchée");
  });

  test("GA4 : identifiant non numérique refusé ; mobile : une colonne, aucun débordement horizontal", async () => {
    await card("analytics").locator("input[name=propertyId]").fill("abc");
    assert.equal(await card("analytics").locator("input[name=propertyId]").evaluate((e) => e.validity.valid), false);
    await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de défilement horizontal");
    const lefts = await page.locator("[data-gx-card]").evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().left)));
    assert.equal(lefts[0], lefts[1], "une seule colonne");
    await page.screenshot({ path: process.env.GX_SHOTS ? process.env.GX_SHOTS + "/gx-mobile.png" : "/dev/null", fullPage: true });
    assert.deepEqual(env.errors, []);
  });
});
