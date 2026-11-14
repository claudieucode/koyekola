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

  test("deux cartes empilées, état « Non connecté » venu du serveur, zone JSON de taille raisonnable, aucune coquille &quot;", async () => {
    await page.goto(url);
    for (const b of ["search_console", "analytics"]) {
      assert.match(await card(b).locator("[data-gx-pill]").innerText(), /Non connecté/);
      const h = await card(b).locator("textarea").evaluate((e) => e.getBoundingClientRect().height);
      assert.ok(h >= 90 && h <= 200, `zone JSON compacte (${h}px)`);
      assert.ok(!(await card(b).locator("textarea").getAttribute("placeholder")).includes("&quot;"));
      assert.ok((await card(b).locator("h2").evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) <= 18, "titre de carte de taille raisonnable");
      assert.ok((await card(b).locator(".sx-ico").evaluate((e) => e.getBoundingClientRect().width)) <= 40, "icône compacte");
    }
    const tops = await page.locator("[data-gx-card]").evaluateAll((l) => l.map((e) => e.getBoundingClientRect().top));
    assert.ok(tops[1] > tops[0] + 200, "cartes l'une sous l'autre");
    assert.ok(await page.locator(".mk-seo-tabs").evaluate((e) => getComputedStyle(e).flexWrap === "nowrap"), "onglets sur une seule ligne");
    if (process.env.GX_SHOTS) await page.screenshot({ path: process.env.GX_SHOTS + "/gx-desktop.png", fullPage: true });
  });

  test("fichier .json choisi : lu dans la zone de saisie, validé avec l'e-mail du compte", async () => {
    const c = card("analytics");
    await c.locator('input[type=file]').setInputFiles({ name: "cle.json", mimeType: "application/json", buffer: Buffer.from(key) });
    await page.waitForTimeout(300);
    assert.match(await c.locator("[data-sx-drop-name]").innerText(), /cle\.json/);
    assert.match(await c.locator("[data-gx-json-state]").innerText(), /JSON valide.*svc@projet/s);
    await c.locator("textarea").fill("");
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
    if (process.env.GX_SHOTS) await page.screenshot({ path: process.env.GX_SHOTS + "/gx-mobile.png", fullPage: true });
    assert.deepEqual(env.errors, []);
  });
});

describe("SEO › Positions et Export / import : mise en page (navigateur)", { skip: SKIP }, () => {
  let env, ctx, page, base;
  before(async () => {
    env = await setup({ siteName: "Site positions" });
    ctx = await env.browser.newContext({ viewport: { width: 1500, height: 1000 } });
    await ctx.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    page = await ctx.newPage(); page.on("pageerror", (e) => env.errors.push(e.message)); base = `${env.srv.base}/marketing/site-web/sites/${env.site}/seo`;
  });
  after(async () => { if (ctx) await ctx.close(); if (env) await env.close(); });

  test("positions : formulaire en grille (champs de même hauteur), mesure enregistrée, tableau, import par fichier", async () => {
    await page.goto(base + "/positions");
    const hs = await page.locator("form[action$='/seo/positions'] input").evaluateAll((l) => l.map((e) => Math.round(e.getBoundingClientRect().height)));
    assert.equal(new Set(hs).size, 1, "champs de même hauteur : " + hs);
    const kw = await page.locator("#ps-kw").evaluate((e) => e.getBoundingClientRect().width), pos = await page.locator("#ps-pos").evaluate((e) => e.getBoundingClientRect().width);
    assert.ok(kw > pos * 1.5, `mot-clé plus large que la position (${kw}/${pos})`);
    await page.fill("#ps-kw", "chaussures test"); await page.fill("#ps-pos", "12"); await page.fill("#ps-url", "/chaussures");
    await Promise.all([page.waitForNavigation(), page.getByRole("button", { name: "Enregistrer la mesure" }).click()]);
    assert.ok(await page.locator(".sx-table tbody tr", { hasText: "chaussures test" }).count() === 1);
    assert.equal(await page.locator(".sx-table .sx-pos").first().innerText(), "12");
    const csv = "Requêtes les plus fréquentes,Clics,Impressions,CTR,Position\nrandonnée alpes,10,200,5%,8.4\n";
    await page.locator("[data-sx-drop] input[type=file]").setInputFiles({ name: "Requetes.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.waitForTimeout(300);
    assert.match(await page.locator("#ps-csv").inputValue(), /randonnée alpes/);
    await Promise.all([page.waitForNavigation(), page.getByRole("button", { name: "Importer", exact: true }).click()]);
    assert.ok(await page.locator(".sx-table tbody tr", { hasText: "randonnée alpes" }).count() === 1, "l'import est confirmé par le serveur : la ligne est dans le tableau");
    if (process.env.GX_SHOTS) await page.screenshot({ path: process.env.GX_SHOTS + "/px-positions.png", fullPage: true });
  });

  test("export / import : export et import séparés, aperçu d'un import, aucun débordement sur mobile", async () => {
    await page.goto(base + "/transfert");
    assert.ok(await page.locator("#tr-export").count() === 1 && await page.locator("#tr-import").count() === 1);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Télécharger/ }).click()]);
    assert.match(dl.suggestedFilename(), /\.json$/);
    await page.fill("#tr-json", '{"format":"kolakisa-seo","version":1,"settings":{},"redirects":[]}');
    await page.getByRole("button", { name: "Vérifier / importer" }).first().click(); await page.waitForLoadState("load");
    assert.ok(await page.locator('[role="status"], [role="alert"]').count() >= 1, "un résultat ou une erreur du serveur s'affiche (aucun succès inventé)");
    if (process.env.GX_SHOTS) await page.screenshot({ path: process.env.GX_SHOTS + "/px-transfert.png", fullPage: true });
    for (const t of ["transfert", "positions", "connexions"]) {
      await page.setViewportSize({ width: 390, height: 900 }); await page.goto(`${base}/${t}`); await page.waitForTimeout(150);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${t} : pas de défilement horizontal sur mobile`);
    }
    assert.deepEqual(env.errors, []);
  });
});
