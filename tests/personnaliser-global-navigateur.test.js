// Personnaliser › Global (Typographie, Couleurs, Conteneur, Boutons) dans un VRAI Chrome (Playwright, ignoré sans) : chaque réglage agit réellement sur le site prévisualisé (sans rechargement),
// s'enregistre en brouillon, se publie, reste propre à CE site (isolation A / B) et ne touche ni l'éditeur de pages, ni les widgets, ni le Theme Builder.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("personnaliser › global (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId, pageA, pageB;
  const PZ = "/marketing/site-web/personnaliser";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const open = async (width = 1366, height = 900) => {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(12000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|beforeunload/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const go = async (page, site = A) => { await page.goto(`${srv.base}${PZ}?site=${site}`); await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; return d && d.readyState === "complete" && !document.getElementById("pz-stage").classList.contains("is-loading"); }); };
  const rows = (page, name) => page.locator(".kwg-row", { hasText: name });
  const toGlobal = async (page, sub) => { await page.locator(".pz-cat", { hasText: "Global" }).click(); if (sub) await rows(page, sub).click(); };
  const fieldOf = (page, label) => page.locator(".kwg-field", { has: page.locator(".kwg-flabel .kwg-lt", { hasText: label }) }).first();
  const fontBox = async (page, label) => { const f = fieldOf(page, label); const box = f.locator(".kwg-fontbox"); if (!(await box.evaluate((e) => e.classList.contains("is-open")))) await f.locator(".kwg-fontbox > button").click(); return box; };
  const num = async (scope, label, value) => { const i = scope.locator(`input[type=number][aria-label^="${label}"]`).first(); await i.fill(String(value)); await i.blur(); };
  const frameEval = (page, fn, arg) => page.frameLocator("#pz-frame").locator("body").evaluate(fn, arg);
  const settle = (page) => page.waitForTimeout(900);
  const publish = async (page) => {
    await page.waitForFunction(() => !document.getElementById("pz-publish").disabled, null, { timeout: 12000 });
    await page.waitForTimeout(1700);
    await page.click("#pz-publish"); await page.getByRole("button", { name: "Publier maintenant" }).click();
    await page.waitForFunction(() => /Publié/.test(document.getElementById("pz-toast").textContent) && !document.getElementById("pz-toast").hidden, null, { timeout: 15000 });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const sections = JSON.stringify([
      { type: "hero", title: "Grand titre du site", subtitle: "Sous-titre", buttonLabel: "Allons-y", buttonUrl: "/x" },
      { type: "text", markdown: "## Deuxième titre\n\nUn paragraphe avec un [lien](/page) dans le texte." },
      { type: "features", title: "Nos atouts", columns: 3, items: [{ title: "Un", text: "premier" }, { title: "Deux", text: "second" }, { title: "Trois", text: "troisième" }] },
      { type: "button", label: "Un bouton", url: "/z" },
    ]);
    const pageOf = (name, slug, siteId) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, name, slug, name, sections, siteId).lastInsertRowid);
    pageA = pageOf("Accueil Alpha", "accueil-alpha", A); pageB = pageOf("Accueil Beta", "accueil-beta", B);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageB, B);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("Global : quatre lignes, en-tête « Vous personnalisez / Global », navigation interne sans perte", async () => {
    const page = await open(); await go(page);
    await toGlobal(page);
    assert.equal(await page.locator("#pz-detail-kicker").innerText(), "Vous personnalisez"); assert.equal(await page.locator("#pz-detail-title").innerText(), "Global");
    assert.deepEqual(await page.locator(".kwg-row").allInnerTexts(), ["Typographie", "Couleurs", "Conteneur", "Boutons"]);
    await rows(page, "Typographie").click();
    assert.equal(await page.locator("#pz-detail-title").innerText(), "Typographie"); assert.equal(await page.locator("#pz-detail-kicker").innerText(), "Global");
    await page.screenshot({ path: path.join(process.env.PZ_SHOTS || "/tmp", "20-typographie.png") });
    const box = await fontBox(page, "Police H1"); await num(box, "Taille", 51); await settle(page);
    await page.click("#pz-back"); assert.equal(await page.locator("#pz-detail-title").innerText(), "Global");
    assert.match(await rows(page, "Typographie").innerText(), /modifié/, "la modification est signalée");
    await rows(page, "Typographie").click(); const box2 = await fontBox(page, "Police H1");
    assert.equal(await box2.locator('input[type=number][aria-label^="Taille"]').first().inputValue(), "51", "valeur conservée après retour à Global");
    await page.click("#pz-back"); await page.click("#pz-back"); assert.ok(await page.locator("#pz-view-home").isVisible());
    await page.context().close();
  });

  test("Typographie : police, H1, H2, texte, liens, taille mobile seulement — aperçu direct sans rechargement, brouillon, publication, isolation", async () => {
    const page = await open(); await go(page, A);
    await page.evaluate(() => { document.getElementById("pz-frame").contentWindow.__m = 42; });
    await toGlobal(page, "Typographie");
    const h1 = await fontBox(page, "Police H1"); await num(h1, "Taille", 52); await h1.locator(".kwg-field", { hasText: "Graisse" }).locator("select").selectOption("800");
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector("h1"); return e && getComputedStyle(e).fontSize === "52px"; }, null, { timeout: 12000 });
    const h2 = await fontBox(page, "Police H2"); await num(h2, "Taille", 33);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector("h2"); return e && getComputedStyle(e).fontSize === "33px"; }, null, { timeout: 12000 });
    // corps et lien
    const body = fieldOf(page, "Taille du texte courant"); await body.locator("input[type=number]").fill("19"); await body.locator("input[type=number]").blur();
    const link = page.locator(".kwg-group", { hasText: "Liens" }).first();
    const sw = link.locator(".kwg-colorrow", { hasText: "Couleur" }).locator(".kwg-sw").first(); await sw.click();
    await link.getByLabel(/Couleur : saisir HEX/).fill("rgb(200 30 60)"); await link.getByLabel(/Couleur : saisir HEX/).press("Enter");
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const a = d.querySelector(".kw-text a, .lp-text a"); return a && getComputedStyle(a).color === "rgb(200, 30, 60)"; }, null, { timeout: 12000 });
    // mobile seulement : la taille du H1 sur mobile ne change pas celle de l'ordinateur
    await page.getByRole("radio", { name: "Mobile" }).click(); await page.waitForTimeout(400);
    const h1m = await fontBox(page, "Police H1"); await num(h1m, "Taille", 30); await settle(page);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector("h1"); return e && getComputedStyle(e).fontSize === "30px"; }, null, { timeout: 12000 });
    await page.getByRole("radio", { name: "Ordinateur" }).click(); await page.waitForTimeout(500);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; return getComputedStyle(d.querySelector("h1")).fontSize === "52px"; }, null, { timeout: 12000 });
    assert.equal(await page.evaluate(() => document.getElementById("pz-frame").contentWindow.__m), 42, "l'aperçu n'a pas été rechargé");
    await publish(page);
    const g = tokensOf(A).global.typography;
    assert.equal(g.h1.size, 52); assert.equal(g.h1.mobile.size, 30); assert.equal(g.h1.weight, 800); assert.equal(g.h2.size, 33); assert.equal(g.bodyFont.size, 19); assert.equal(g.link.color, "#c81e3c");
    assert.equal(tokensOf(B).global, undefined, "l'autre site n'est pas touché");
    // rendu public : la feuille de style de la page contient les règles
    const html = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(html, /--kw-h1-size:52px/); assert.match(html, /@media \(max-width: 767px\)[\s\S]*--kw-h1-size:30px/);
    assert.doesNotMatch((await boss.get(`/marketing/pages/${pageB}/apercu`)).text, /--kw-h1-size:52px/);
    // persistance après rechargement
    await page.reload(); await go(page, A); await toGlobal(page, "Typographie");
    assert.equal(await (await fontBox(page, "Police H1")).locator('input[type=number][aria-label^="Taille"]').first().inputValue(), "52");
    await page.context().close();
  });

  test("Couleurs : couleur principale (RGB saisi), palette (ajouter / renommer / dupliquer / supprimer), dégradé en fond, états — en direct puis publié", async () => {
    const page = await open(); await go(page, A);
    await toGlobal(page, "Couleurs");
    const main = page.locator(".kwg-colorrow", { hasText: "Couleur principale" }); await main.locator(".kwg-sw").first().click();
    await page.getByLabel(/Couleur principale : saisir HEX/).fill("hsl(210 80% 40%)"); await page.getByLabel(/Couleur principale : saisir HEX/).press("Enter");
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector(".lp-site"); return e && /#1466b8/i.test(getComputedStyle(e).getPropertyValue("--kw-primary")); }, null, { timeout: 12000 });
    await main.locator(".kwg-sw").first().click(); // referme
    // palette : ajouter une couleur, la renommer, la dupliquer, la supprimer
    await page.locator('.kwg-pencil').click();
    await page.locator(".kwg-dot-add").click();
    await page.getByLabel("Nom de la couleur").fill("Mon bleu");
    await page.getByRole("button", { name: "Dupliquer la couleur" }).click();
    const names = async () => page.locator(".kwg-dot:not(.kwg-dot-add)").evaluateAll((els) => els.map((e) => e.title));
    assert.ok((await names()).some((t) => /Mon bleu \(copie\)/.test(t)), `copie présente : ${await names()}`);
    await page.getByRole("button", { name: "Supprimer la couleur" }).click();
    assert.ok(!(await names()).some((t) => /Mon bleu \(copie\)/.test(t)), "copie supprimée");
    // dégradé utilisé comme fond du site
    await page.locator('[data-act="add-gradient"]').click();
    await page.getByRole("button", { name: "Utiliser comme fond du site" }).click();
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector(".lp-site"); return e && /linear-gradient/.test(getComputedStyle(e).backgroundImage); }, null, { timeout: 12000 });
    await page.screenshot({ path: path.join(process.env.PZ_SHOTS || "/tmp", "21-couleurs.png") });
    await publish(page);
    const c = tokensOf(A).global.colors;
    assert.match(c.accent, /^#[0-9a-f]{6}$/); assert.ok(c.siteBgGradient); assert.equal(c.gradients.length, 1); assert.ok(c.palette.some((p) => p.name === "Mon bleu"));
    assert.equal(tokensOf(B).global, undefined);
    const html = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(html, /--site-color-primary:#[0-9a-f]{6}/); assert.match(html, /--site-gradient-g[a-z0-9]+:linear-gradient/);
    await page.context().close();
  });

  test("Conteneur : largeur, marges, largeur mobile — rendu en direct, sans casser les sections", async () => {
    const page = await open(); await go(page, A);
    await toGlobal(page, "Conteneur");
    await num(fieldOf(page, "Largeur de conteneur"), "Largeur de conteneur", 880);
    await num(fieldOf(page, "Marge interne horizontale"), "Marge interne horizontale", 36);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector(".lp-main"); return e && getComputedStyle(e).maxWidth === "880px" && getComputedStyle(e).paddingLeft === "36px"; }, null, { timeout: 12000 });
    // largeur sur mobile uniquement
    await page.getByRole("radio", { name: "Mobile" }).click(); await page.waitForTimeout(400);
    await num(fieldOf(page, "Largeur de conteneur"), "Largeur de conteneur", 340); await settle(page);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector(".lp-main"); return e && getComputedStyle(e).maxWidth === "340px"; }, null, { timeout: 12000 });
    assert.ok(await frameEval(page, () => document.querySelectorAll(".lp-block, .kw-block, section").length >= 3), "les sections sont toujours là");
    await page.getByRole("radio", { name: "Ordinateur" }).click(); await page.waitForTimeout(500);
    await page.waitForFunction(() => getComputedStyle(document.getElementById("pz-frame").contentDocument.querySelector(".lp-main")).maxWidth === "880px", null, { timeout: 12000 });
    await publish(page);
    const ct = tokensOf(A).global.container; assert.equal(ct.width.d, 880); assert.equal(ct.width.m, 340); assert.equal(ct.padX.d, 36); assert.equal(tokensOf(B).global, undefined);
    await page.context().close();
  });

  test("Boutons : couleur, bordure, rayon, survol, ombre, dimensions — aperçu du bouton, site en direct, publication", async () => {
    const page = await open(); await go(page, A);
    await toGlobal(page, "Boutons");
    assert.ok(await page.locator(".kwg-pbtn").isVisible(), "aperçu du bouton dans le panneau");
    const bg = page.locator(".kwg-colorrow", { hasText: "Couleur d'arrière-plan" }); await bg.locator(".kwg-sw").first().click();
    await page.getByLabel(/Couleur d'arrière-plan : saisir HEX/).fill("#116644"); await page.getByLabel(/Couleur d'arrière-plan : saisir HEX/).press("Enter");
    const radius = fieldOf(page, "Rayon de bordure"); await radius.locator(".kwg-sides input").first().fill("22"); await radius.locator(".kwg-sides input").first().blur();
    await num(fieldOf(page, "Élévation au survol"), "Élévation au survol", 3);
    await page.locator(".kwg-toggle", { hasText: "Ombre personnalisée" }).locator("button").click();
    await num(fieldOf(page, "Flou"), "Flou", 18);
    await page.waitForFunction(() => { const d = document.getElementById("pz-frame").contentDocument; const e = d.querySelector(".lp-btn, .kw-btn-primary"); if (!e) return false; const s = getComputedStyle(e); return s.backgroundColor === "rgb(17, 102, 68)" && s.borderTopLeftRadius === "22px" && s.boxShadow !== "none"; }, null, { timeout: 12000 });
    assert.match(await page.locator(".kwg-pbtn").getAttribute("style"), /border-radius:22px/);
    await page.screenshot({ path: path.join(process.env.PZ_SHOTS || "/tmp", "22-boutons.png") });
    await publish(page);
    const b = tokensOf(A).global.buttons.primary; assert.equal(b.normal.bg, "#116644"); assert.equal(b.radius.d.t, 22); assert.equal(b.hoverLift, 3); assert.equal(b.shadowCustom.on, true); assert.equal(b.shadowCustom.blur, 18);
    assert.equal(tokensOf(B).global, undefined);
    const html = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(html, /:hover\{[^}]*transform:translateY\(-3px\)/); assert.match(html, /background:#116644/);
    await page.context().close();
  });

  test("isolation : le site B garde ses propres réglages ; l'éditeur de pages, les widgets et le Theme Builder restent accessibles ; aucune erreur JavaScript", async () => {
    const page = await open(); await go(page, B);
    await toGlobal(page, "Couleurs");
    const main = page.locator(".kwg-colorrow", { hasText: "Couleur principale" }); await main.locator(".kwg-sw").first().click();
    await page.getByLabel(/Couleur principale : saisir HEX/).fill("#aa2244"); await page.getByLabel(/Couleur principale : saisir HEX/).press("Enter");
    await publish(page);
    assert.equal(tokensOf(B).global.colors.accent, "#aa2244"); assert.notEqual(tokensOf(A).global.colors.accent, "#aa2244", "A garde sa valeur");
    for (const u of [`/marketing/pages/${pageA}/editeur`, `/marketing/site-web/widgets?site=${A}`, `/marketing/site-web/apparence/theme-builder?site=${A}`, `/marketing/site-web/styles?site=${A}`]) assert.equal((await boss.get(u)).status, 200, u);
    await page.context().close();
    assert.deepEqual(errors, []);
  });
});
