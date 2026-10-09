// Réglages du site (lots 2 et 3), tous les écrans du panneau dans un VRAI navigateur contre un vrai serveur : on règle
// comme le ferait une personne, puis on relit l'effet réel dans le canevas (styles calculés par le navigateur), en base,
// après rechargement, avec annuler, et sur petit écran.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}

const VIEWS = ["Couleurs globales", "Polices globales", "Typographie", "Boutons", "Images", "Champs de formulaire", "Identité du site", "Arrière-plan", "Mise en page", "Visionneuse", "Transitions de page", "CSS personnalisé", "Réglages supplémentaires", "Référencement (SEO)"];

describe("réglages du site : tous les écrans du panneau (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, siteId, pageId;
  const db = () => srv.db();
  const site = () => db().prepare("SELECT name, tokens, settings FROM mk_sites WHERE id = ?").get(siteId);
  const tokens = () => JSON.parse(site().tokens);
  const settings = () => JSON.parse(site().settings);
  const panel = () => page.locator(".ss-panel");
  const status = () => panel().locator(".ss-status");
  const frame = () => page.frameLocator("[data-pb-frame]");
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-body") && f.contentDocument.querySelector(".kw-button"); }, null, { timeout: 20000 });
  const style = (selector, prop, hover = false) => page.evaluate(({ selector, prop }) => { const d = document.querySelector("[data-pb-frame]").contentDocument; const el = d.querySelector(selector); return el ? getComputedStyle(el)[prop] : null; }, { selector, prop });
  const saved = () => until(async () => /Enregistré|À jour/.test(await status().innerText()), { what: "« Enregistré »" });
  const goHome = async () => { if (await panel().locator("[aria-label='Retour aux réglages du site']").isVisible()) await panel().locator("[aria-label='Retour aux réglages du site']").click(); };
  const open = async (name) => { await goHome(); await panel().locator(".ss-entry", { has: page.locator(".ss-entry-label", { hasText: new RegExp(`^${name.replace(/[()]/g, "\\$&")}$`) }) }).click(); assert.equal((await panel().locator("h2").innerText()).trim(), name); };
  const field = (label, within) => (within || panel()).locator(".ss-field", { hasText: label }).first();
  const group = async (title) => { const d = panel().locator("details", { hasText: title }).first(); if (!(await d.evaluate((el) => el.open))) await d.locator("summary").click(); return d; };
  async function openPanel() {
    await page.locator("[data-pb-mainmenu]").click();
    await page.locator(".pb-menu-item", { hasText: "Réglages du site" }).click();
    await panel().waitFor({ state: "visible" });
    await until(async () => (await status().innerText()).trim() !== "Chargement…", { what: "réglages chargés" });
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Site écrans" })).location.match(/(\d+)$/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Page écrans", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Un titre", level: "2" } },
      { id: "btn000000001", type: "button", props: { label: "Je commence", url: "/catalogue" } },
      { id: "img000000001", type: "image", props: { src: "/uploads/thumbnails/exemple.png", alt: "Exemple" } },
    ] }] }] };
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("E1 les 14 écrans s'ouvrent depuis l'accueil du panneau, chacun avec son titre et un bouton Retour ; aucune entrée inactive", async () => {
    await openPanel();
    const labels = await panel().locator(".ss-entry .ss-entry-label").allInnerTexts();
    assert.deepEqual(labels, VIEWS);
    assert.equal(await panel().locator(".ss-entry[disabled]").count(), 0, "aucun bouton inactif ni « pas encore disponible »");
    for (const name of VIEWS) {
      await open(name);
      assert.ok((await panel().locator(".ss-body > *").count()) > 1, `${name} : contenu affiché`);
      await panel().locator("[aria-label='Retour aux réglages du site']").click();
      assert.equal((await panel().locator("h2").innerText()).trim(), "Réglages du site");
    }
  });

  test("E2 Typographie : Titre 2 en majuscules avec espacement → enregistré et appliqué dans le canevas", async () => {
    await open("Typographie");
    const d = await group("Titre 2");
    await field("Casse", d).locator("select").selectOption("uppercase");
    await field("Espacement des lettres", d).locator("input").fill("0.08");
    await until(async () => tokens().type.h2.transform === "uppercase" && tokens().type.h2.letterSpacing === 0.08, { what: "typographie enregistrée" });
    await saved();
    await until(async () => (await style("h2.kw-heading", "textTransform")) === "uppercase", { what: "majuscules dans le canevas" });
    assert.match(await style("h2.kw-heading", "letterSpacing"), /^(\d+(\.\d+)?)px$/, "espacement des lettres non nul");
    assert.notEqual(await style("h2.kw-heading", "letterSpacing"), "normal");
  });

  test("E3 Boutons : marge verticale, et fond au survol (couleur libre) → appliqués dans le canevas", async () => {
    await open("Boutons");
    await field("Marge intérieure verticale").locator("input").fill("22");
    const hover = await group("Au survol");
    await field("Fond", hover).locator("select").selectOption("#");
    await field("Fond", hover).locator("input[type=color]").fill("#112233");
    await until(async () => tokens().buttons.paddingY === 22 && tokens().buttons.hover.bg === "#112233", { what: "boutons enregistrés" });
    await saved();
    await until(async () => (await style(".kw-button", "paddingTop")) === "22px", { what: "marge du bouton dans le canevas" });
    await frame().locator(".kw-button").hover();
    await until(async () => (await style(".kw-button", "backgroundColor")) === "rgb(17, 34, 51)", { what: "fond au survol dans le canevas" });
  });

  test("E4 Images : rayon des coins et ombre → appliqués à l'image du canevas", async () => {
    await open("Images");
    await field("Rayon des coins").locator("input").fill("20");
    await field("Ombre").locator("select").selectOption("lg");
    await until(async () => tokens().images.radius === 20 && tokens().images.shadow === "lg", { what: "images enregistrées" });
    await saved();
    await until(async () => (await style(".kw-image img", "borderTopLeftRadius")) === "20px", { what: "rayon dans le canevas" });
    assert.notEqual(await style(".kw-image img", "boxShadow"), "none");
  });

  test("E5 Champs de formulaire : réglages enregistrés (rayon, couleur de focus liée à la couleur principale du site)", async () => {
    await open("Champs de formulaire");
    await field("Rayon des coins").locator("input").fill("3");
    await field("Couleur au focus").locator("select").selectOption("token:primary");
    await until(async () => tokens().forms.radius === 3 && tokens().forms.focusColor === "token:primary", { what: "champs enregistrés" });
  });

  test("E6 Identité : le nom et la description sont enregistrés ; « Choisir une image » ouvre la vraie médiathèque", async () => {
    await open("Identité du site");
    await panel().locator(".ss-field", { hasText: "Nom du site" }).locator("input").fill("Maison Nakewenze");
    await field("Description du site").locator("textarea").fill("Pièces choisies pour durer.");
    await until(async () => site().name === "Maison Nakewenze" && settings().identity.description === "Pièces choisies pour durer.", { what: "identité enregistrée" });
    await panel().locator(".ss-field", { hasText: "Logo" }).first().getByRole("button", { name: "Choisir une image" }).click();
    await page.locator("[data-pb-media]").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-pb-media]").evaluate((d) => d.open), false, "médiathèque refermée");
  });

  test("E7 Arrière-plan : couleur libre → appliquée au fond de la page du canevas", async () => {
    await open("Arrière-plan");
    await field("Couleur de fond").locator("select").selectOption("#");
    await field("Couleur de fond").locator("input[type=color]").fill("#336699");
    await until(async () => settings().background.color === "#336699", { what: "arrière-plan enregistré" });
    await saved();
    await until(async () => (await style("body", "backgroundColor")) === "rgb(51, 102, 153)", { what: "fond du canevas" });
    await panel().locator(".ss-toggle", { hasText: "Utiliser un dégradé" }).locator("input").check();
    assert.ok(await panel().locator(".ss-field", { hasText: "Angle" }).count(), "les réglages du dégradé apparaissent");
    await until(async () => settings().background.gradient.enabled === true, { what: "dégradé enregistré" });
    await saved();
    await until(async () => /linear-gradient/.test(await style("body", "backgroundImage")), { what: "dégradé dans le canevas" });
  });

  test("E8 Mise en page : largeur du contenu et marges → appliquées ; points de rupture enregistrés", async () => {
    await open("Mise en page");
    await field("Largeur du contenu").locator("input").fill("900");
    await field("Marges latérales").locator("input").fill("40");
    await field("Tablette : jusqu'à").locator("input").fill("1100");
    await until(async () => settings().layout.contentWidth === 900 && settings().layout.gutter === 40 && settings().layout.breakpoints.tablet === 1100, { what: "mise en page enregistrée" });
    await saved();
    await until(async () => (await style(".lp-main", "maxWidth")) === "900px" && (await style(".lp-main", "paddingLeft")) === "40px", { what: "largeur et marges dans le canevas" });
  });

  test("E9 Visionneuse et Transitions : réglages enregistrés", async () => {
    await open("Visionneuse");
    await panel().locator(".ss-toggle", { hasText: "Flèches précédent / suivant" }).locator("input").uncheck();
    await field("Opacité du fond").locator("input").fill("55");
    await field("Animation d'ouverture").locator("select").selectOption("zoom");
    await until(async () => settings().lightbox.arrows === false && settings().lightbox.overlayOpacity === 55 && settings().lightbox.animation === "zoom", { what: "visionneuse enregistrée" });
    await open("Transitions de page");
    await field("Type").locator("select").selectOption("fade");
    await field("Durée").locator("input").fill("450");
    await until(async () => settings().transitions.type === "fade" && settings().transitions.duration === 450, { what: "transition enregistrée" });
  });

  test("E10 CSS personnalisé : appliqué dans le canevas ; un CSS invalide est refusé avec un message clair et rien n'est écrasé", async () => {
    await open("CSS personnalisé");
    const area = panel().locator("textarea");
    await area.fill(".kw-button { letter-spacing: 3px; }");
    await until(async () => settings().customCss.includes("letter-spacing"), { what: "CSS enregistré" });
    await saved();
    await until(async () => (await style(".kw-button", "letterSpacing")) === "3px", { what: "CSS appliqué dans le canevas" });
    await area.fill("@import url(x);");
    await until(async () => /Non enregistré/.test(await status().innerText()), { what: "refus signalé" });
    assert.match(await status().innerText(), /@/);
    assert.ok(settings().customCss.includes("letter-spacing"), "le CSS valide est conservé");
    await area.fill(".kw-button { letter-spacing: 3px; }");
    await saved();
  });

  test("E11 Réglages supplémentaires : langue, défilement doux, indexation → enregistrés puis relus après rechargement de l'éditeur", async () => {
    await open("Réglages supplémentaires");
    await field("Langue des pages").locator("select").selectOption("en");
    await panel().locator(".ss-toggle", { hasText: "Défilement doux" }).locator("input").check();
    await panel().locator(".ss-toggle", { hasText: "ne pas indexer" }).locator("input").check();
    await until(async () => settings().extras.language === "en" && settings().extras.smoothScroll && settings().extras.noindex, { what: "réglages supplémentaires enregistrés" });
    await saved();
    await panel().locator("[aria-label='Fermer les réglages du site']").click();
    await page.reload();
    await ready();
    await openPanel();
    await open("Réglages supplémentaires");
    assert.equal(await field("Langue des pages").locator("select").inputValue(), "en");
    assert.equal(await panel().locator(".ss-toggle", { hasText: "Défilement doux" }).locator("input").isChecked(), true);
    await open("Mise en page");
    assert.equal(await field("Largeur du contenu").locator("input").inputValue(), "900", "valeurs des autres écrans conservées");
    await open("Typographie");
    const d = await group("Titre 2");
    assert.equal(await field("Casse", d).locator("select").inputValue(), "uppercase");
  });

  test("E12 Annuler : la dernière modification de mise en page est défaite, en base comme dans le panneau", async () => {
    await open("Mise en page");
    await field("Marges latérales").locator("input").fill("64");
    await until(async () => settings().layout.gutter === 64, { what: "marges enregistrées" });
    await panel().getByRole("button", { name: /Annuler la dernière modification/ }).click();
    await until(async () => settings().layout.gutter === 40, { what: "annulation enregistrée" });
    assert.equal(await field("Marges latérales").locator("input").inputValue(), "40");
  });

  test("E12b la page PUBLIÉE, ouverte sans compte, reflète tous les réglages (styles calculés par le navigateur)", async () => {
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const visitor = await browser.newContext({ viewport: { width: 1400, height: 900 }, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" });
    const pub = await visitor.newPage();
    const pubErrors = [];
    pub.on("pageerror", (e) => pubErrors.push(e.message));
    await pub.goto(`${srv.base}/p/${slug}`);
    const get = (sel, prop) => pub.evaluate(({ sel, prop }) => getComputedStyle(document.querySelector(sel))[prop], { sel, prop });
    assert.equal(await pub.evaluate(() => document.documentElement.lang), "en");
    assert.equal(await get("h2.kw-heading", "textTransform"), "uppercase");
    assert.equal(await get(".kw-button", "paddingTop"), "22px");
    assert.equal(await get(".kw-button", "letterSpacing"), "3px", "CSS personnalisé du site");
    assert.equal(await get(".kw-image img", "borderTopLeftRadius"), "20px");
    assert.match(await get("body", "backgroundImage"), /linear-gradient/);
    assert.equal(await get(".lp-main", "maxWidth"), "900px");
    assert.equal(await get(".lp-main", "paddingLeft"), "40px");
    assert.equal(await pub.locator("body").getAttribute("data-kw-lb-arrows"), "0");
    assert.equal(await pub.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow");
    assert.match(await pub.locator('meta[property="og:site_name"]').getAttribute("content"), /Maison Nakewenze/);
    await pub.locator(".kw-button").hover();
    await until(async () => (await get(".kw-button", "backgroundColor")) === "rgb(17, 34, 51)", { what: "fond au survol sur le site publié (après la transition d'origine)" });
    assert.equal(await pub.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => /view-transition/i.test(r.cssText) || r.constructor.name === "CSSViewTransitionRule"); } catch { return false; } })), true, "règle de transition de page présente");
    assert.deepEqual(pubErrors, []);
    await visitor.close();
  });

  test("E13 petit écran : chaque écran du panneau tient dans la largeur, sans défilement horizontal", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await wait(300);
    for (const name of VIEWS) {
      await open(name);
      const w = await panel().evaluate((el) => ({ panel: el.getBoundingClientRect().width, scroll: el.querySelector(".ss-body").scrollWidth, client: el.querySelector(".ss-body").clientWidth }));
      assert.ok(w.panel <= 390, `${name} : panneau ${w.panel}px`);
      assert.ok(w.scroll <= w.client + 1, `${name} : défilement horizontal (${w.scroll} > ${w.client})`);
    }
    await page.setViewportSize({ width: 1500, height: 900 });
  });

  test("E14 aucune erreur JavaScript ni de console pendant tout le parcours", async () => {
    assert.deepEqual(errors, [], `erreurs navigateur : ${errors.join(" | ")}`);
  });
});
