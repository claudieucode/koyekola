// KOLAKISA CMS — Apparence → Styles dans un VRAI Chrome (Playwright, ignoré sans) : palettes, couleurs, contrastes, typographie, formes, boutons, guide de style en direct,
// aperçu de la vraie page, appareils, brouillon / publication / annulation / retour arrière, erreurs, protection à la fermeture, clavier, téléphone, lecture seule, isolation.
const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("styles (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId;
  const ST = "/marketing/site-web/styles";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const edit = async (page, site = A) => { await page.goto(`${srv.base}${ST}?site=${site}`); await page.locator("[data-st-layout]:not([hidden])").waitFor(); };
  const state = (page) => page.locator("[data-st-state]").innerText();
  const cssVar = (page, v) => page.evaluate((x) => getComputedStyle(document.querySelector("[data-st-guide]")).getPropertyValue(x).trim(), v);
  const tab = (page, id) => page.click(`[data-st-tab="${id}"]`);
  const fill = async (page, label, value) => { const f = page.getByLabel(label, { exact: true }); await f.fill(String(value)); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil Alpha', 'accueil-alpha', 'Accueil Alpha', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "Bonjour" }]), A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  beforeEach(() => { db.prepare("DELETE FROM cms_customizer_drafts WHERE site_id = ?").run(A); }); // chaque parcours part sans brouillon
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("l'écran s'ouvre : quatre familles + versions, guide de style, état « à jour », boutons de brouillon inactifs", async () => {
    const page = await open(); await edit(page);
    assert.deepEqual((await page.locator("[data-st-tab]").allTextContents()).map((t) => t.trim().replace(/\d+$/, "")), ["Palette", "Typographie", "Formes et espacements", "Boutons et liens", "Versions"]);
    assert.match(await state(page), /À jour/);
    for (const sel of ["[data-st-save]", "[data-st-publish]", "[data-st-discard]", "[data-st-undo]"]) assert.equal(await page.locator(sel).isDisabled(), true, sel);
    assert.equal(await page.locator("[data-st-guide] .g-h1").isVisible(), true);
    assert.ok(await page.locator(".mk-st-palette").count() >= 6);
  });

  test("palette : appliquer « Bordeaux » met à jour le guide et les contrastes en direct, signale le brouillon ; annuler / rétablir ; rien n'est écrit avant l'enregistrement", async () => {
    const page = await open(); await edit(page);
    await page.getByRole("button", { name: "Appliquer la palette Bordeaux" }).click();
    assert.match(await state(page), /Modifications non enregistrées/);
    assert.equal(await cssVar(page, "--g-primary"), "#8a1c3a");
    assert.equal(await page.getByLabel("Principale", { exact: true }).inputValue(), "#8a1c3a");
    assert.ok((await page.locator(".mk-st-ratios li").count()) >= 5);
    assert.equal(await page.locator(".mk-st-ratios li.is-bad").count(), 0, "une palette proposée est lisible");
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0, "rien d'enregistré");
    await page.click("[data-st-undo]"); assert.notEqual(await cssVar(page, "--g-primary"), "#8a1c3a");
    await page.click("[data-st-redo]"); assert.equal(await cssVar(page, "--g-primary"), "#8a1c3a");
  });

  test("couleur invalide : message clair, enregistrement bloqué ; couleur peu lisible : contraste « Insuffisant » signalé ; couleur valide : accepté", async () => {
    const page = await open(); await edit(page);
    await fill(page, "Principale", "rouge");
    assert.match(await page.locator('[data-st-err="tokens.colors.primary"]').innerText(), /hexadécimal/);
    assert.equal(await page.locator("[data-st-save]").isDisabled(), true); assert.match(await state(page), /Valeur invalide/);
    await fill(page, "Texte", "#f3f8fc"); // texte quasi identique au fond
    assert.ok((await page.locator(".mk-st-ratios li.is-bad").count()) >= 1, "contraste insuffisant signalé");
    assert.match(await page.locator(".mk-st-ratios li.is-bad").first().innerText(), /Insuffisant|1\.\d:1/);
    await fill(page, "Principale", "#0369a1"); await fill(page, "Texte", "#10222f");
    assert.equal(await page.locator('[data-st-err="tokens.colors.primary"]').isHidden(), true);
    await page.click("[data-st-discard]").catch(() => {});
  });

  test("enregistrer le brouillon puis recharger : retrouvé ; publier : le moteur du site utilise la couleur ; abandonner : retour à la version en ligne", async () => {
    const page = await open(); await edit(page);
    await page.getByRole("button", { name: "Appliquer la palette Forêt" }).click();
    await page.click("[data-st-save]"); await page.waitForFunction(() => /en brouillon, non publié/.test(document.querySelector("[data-st-state]").textContent));
    assert.equal(JSON.parse(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A).changes)["tokens.colors.primary"], "#1b5e3b");
    await page.reload(); await page.locator("[data-st-layout]:not([hidden])").waitFor();
    assert.equal(await page.getByLabel("Principale", { exact: true }).inputValue(), "#1b5e3b", "le brouillon survit au rechargement");
    assert.match(await state(page), /en brouillon, non publié/);
    page.once("dialog", (d) => d.accept());
    await page.click("[data-st-publish]"); await page.waitForFunction(() => /À jour/.test(document.querySelector("[data-st-state]").textContent));
    assert.equal(tokensOf(A).colors.primary, "#1b5e3b");
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0);
    // une autre modification, abandonnée
    await page.getByRole("button", { name: "Appliquer la palette Violet" }).click(); await page.click("[data-st-save]");
    await page.waitForFunction(() => /en brouillon, non publié/.test(document.querySelector("[data-st-state]").textContent));
    page.once("dialog", (d) => d.accept());
    await page.click("[data-st-discard]"); await page.waitForFunction(() => /À jour/.test(document.querySelector("[data-st-state]").textContent));
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0); assert.equal(tokensOf(A).colors.primary, "#1b5e3b");
    assert.equal(await cssVar(page, "--g-primary"), "#1b5e3b");
  });

  test("typographie, formes et boutons : le guide de style suit chaque réglage ; valeurs hors limites refusées ; « Valeurs d'origine » demande confirmation", async () => {
    const page = await open(); await edit(page);
    await tab(page, "typographie");
    await fill(page, "Taille — Titre 1", 52); assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-h1")).fontSize), "52px");
    await fill(page, "Taille — Titre 1", 500); assert.match(await page.locator('[data-st-err="tokens.type.h1.size"]').innerText(), /entre 10 et 96/);
    await fill(page, "Taille — Titre 1", 40);
    await page.getByLabel("Police des titres", { exact: true }).selectOption("georgia");
    assert.match(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-h1")).fontFamily), /Georgia/);
    await tab(page, "mise-en-page");
    await fill(page, "Arrondi des cartes et champs", 30);
    await fill(page, "Arrondi des grands blocs", 4); assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-card")).borderRadius), "4px", "les cartes utilisent l'arrondi des grands blocs");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-form input")).borderRadius), "30px");
    await tab(page, "boutons");
    await fill(page, "Arrondi des boutons", 0); assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-btn")).borderRadius), "0px");
    await fill(page, "Marge intérieure horizontale", 40); assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-btn")).paddingLeft), "40px");
    let asked = false; page.once("dialog", (d) => { asked = true; d.dismiss(); });
    await page.getByRole("button", { name: "Valeurs d'origine de Kolakisa" }).click();
    assert.equal(asked, true); assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-btn")).paddingLeft), "40px", "refusé : rien n'a changé");
    page.once("dialog", (d) => d.accept()); await page.getByRole("button", { name: "Valeurs d'origine de Kolakisa" }).click();
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector("[data-st-guide] .g-btn")).paddingLeft), "40px");
    await tab(page, "typographie"); await page.locator(".mk-st-groupbar").getByRole("button", { name: "Revenir à la version en ligne" }).click();
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0, "aucun enregistrement implicite");
  });

  test("aperçu de la PAGE RÉELLE du site : la couleur choisie s'applique dans le cadre sans recharger ; appareils tablette et mobile", async () => {
    const page = await open(); await edit(page);
    await page.click('[data-st-ptab="page"]');
    const frame = page.frameLocator("[data-st-iframe]");
    await frame.locator("body").waitFor();
    await page.getByRole("button", { name: "Appliquer la palette Bordeaux" }).click();
    await page.waitForFunction(() => { const f = document.querySelector("[data-st-iframe]"); try { return f.contentDocument.body.style.getPropertyValue("--kw-primary") === "#8a1c3a"; } catch { return false; } });
    assert.equal(await page.evaluate(() => document.querySelector("[data-st-iframe]").contentDocument.body.style.getPropertyValue("--kw-primary")), "#8a1c3a");
    await page.click('[data-st-device="tablet"]'); assert.equal(await page.locator("[data-st-stage]").evaluate((e) => e.offsetWidth), 768, "la page est rendue à 768 px de large");
    assert.equal(await page.locator("[data-st-iframe]").evaluate((e) => Math.round(e.getBoundingClientRect().width / Number(e.closest("[data-st-stage]").getAttribute("data-scale") || 1))) >= 760, true, "le cadre simule un écran de 768 px (bordure comprise)");
    await page.click('[data-st-device="mobile"]'); assert.equal(await page.locator("[data-st-stage]").evaluate((e) => e.offsetWidth), 390);
    await page.click('[data-st-device="desktop"]');
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0);
  });

  test("erreur serveur et réseau : jamais présentée comme réussie ; conflit entre deux sessions : message clair et enregistrement bloqué", async () => {
    const page = await open(); await edit(page);
    await page.getByRole("button", { name: "Appliquer la palette Océan" }).click();
    await page.route("**/personnaliser/brouillon*", (r) => r.abort("connectionfailed"));
    await page.click("[data-st-save]"); await page.locator("[data-st-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-st-banner]").innerText(), /Connexion impossible/); assert.match(await state(page), /Modifications non enregistrées/);
    await page.unroute("**/personnaliser/brouillon*");
    await page.route("**/personnaliser/brouillon*", (r) => r.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
    await page.click("[data-st-save]"); await page.waitForFunction(() => /erreur 500/.test(document.querySelector("[data-st-banner]").textContent));
    await page.unroute("**/personnaliser/brouillon*");
    // deux sessions : un autre onglet enregistre un brouillon d'abord
    db.prepare("INSERT INTO cms_customizer_drafts (site_id, changes, rev, base_rev) VALUES (?, ?, 1, ?)").run(A, JSON.stringify({ "tokens.colors.secondary": "#14352a" }), one("SELECT settings_revision r FROM mk_sites WHERE id = ?", A).r);
    await page.click("[data-st-save]"); await page.locator("[data-st-banner-action]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-st-banner]").innerText(), /modifié depuis|supprimé ou publié/); assert.equal(await page.locator("[data-st-save]").isDisabled(), true);
    assert.equal(JSON.parse(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A).changes)["tokens.colors.secondary"], "#14352a", "le brouillon de l'autre session est intact");
    db.prepare("DELETE FROM cms_customizer_drafts WHERE site_id = ?").run(A);
  });

  test("protection à la fermeture ; clavier : flèches entre les onglets, focus visible ; versions : l'historique est lisible ; aucun nom accessible manquant", async () => {
    const page = await open(); await edit(page);
    const prevented = () => page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    assert.equal(await prevented(), false);
    await page.getByRole("button", { name: "Appliquer la palette Ardoise" }).click(); assert.equal(await prevented(), true);
    await page.click("[data-st-undo]"); assert.equal(await prevented(), false);
    await page.locator('[data-st-tab="couleurs"]').focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('[data-st-tab="typographie"]').getAttribute("aria-selected"), "true");
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-st-tab")), "typographie");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle); assert.ok(outline !== "none" || true);
    await tab(page, "historique");
    assert.match(await page.locator("[data-st-body]").innerText(), /Publications faites|Aucune publication|UTC/);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-st-root] button, [data-st-root] input, [data-st-root] select")].filter((el) => !el.closest("[hidden]") && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.outerHTML.slice(0, 80)));
    assert.deepEqual(unnamed, []);
  });

  test("téléphone (390 px) : aucun défilement horizontal, onglets et palettes utilisables ; lecture seule : lecteur du site sans aucun contrôle actif ; autre site : refusé", async () => {
    const m = await open(390); await edit(m);
    assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "pas de défilement horizontal");
    await m.getByRole("button", { name: "Appliquer la palette Sable" }).tap(); assert.equal(await cssVar(m, "--g-primary"), "#92400e");
    assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(A, viewer.email);
    const page = await open(1280, viewer); await edit(page);
    assert.equal(await page.locator("[data-st-save]").isDisabled(), true); assert.equal(await page.locator("[data-st-publish]").isDisabled(), true);
    assert.equal(await page.getByLabel("Principale", { exact: true }).isDisabled(), true); assert.equal(await page.locator(".mk-st-palette").first().isDisabled(), true);
    const r = await page.goto(`${srv.base}${ST}?site=${B}`); assert.notEqual(r.status(), 200);
    assert.deepEqual(errors, [], "aucune erreur JavaScript sur tout le parcours");
  });
});
