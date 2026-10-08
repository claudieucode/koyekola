// Réglages du site (lot 1) dans un VRAI navigateur (Chrome piloté par Playwright) contre un vrai serveur : on ouvre le
// panneau depuis le menu principal de l'éditeur, on règle une couleur et une police comme le ferait une personne, puis on
// relit le résultat dans le canevas, en base, après fermeture/réouverture, avec annuler/rétablir, et sur petit écran.
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

describe("réglages du site : panneau de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, siteId, pageId;
  const db = () => srv.db();
  const tokens = () => JSON.parse(db().prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(siteId).tokens);
  const panel = () => page.locator(".ss-panel");
  const status = () => panel().locator(".ss-status");
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-body"); }, null, { timeout: 15000 });
  const canvasVar = (name) => page.evaluate((n) => getComputedStyle(document.querySelector("[data-pb-frame]").contentDocument.body).getPropertyValue(n).trim(), name);
  const saved = () => until(async () => /Enregistré|À jour/.test(await status().innerText()), { what: "« Enregistré »" });
  async function openPanel() {
    await page.locator("[data-pb-mainmenu]").click();
    await page.locator(".pb-menu-item", { hasText: "Réglages du site" }).click();
    await panel().waitFor({ state: "visible" });
    await until(async () => (await status().innerText()).trim() !== "Chargement…", { what: "réglages chargés" });
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    siteId = Number((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location.match(/(\d+)$/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil navigateur", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
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

  test("N1 le menu principal propose « Réglages du site » et ouvre le vrai panneau (écran d'accueil complet)", async () => {
    await openPanel();
    assert.equal((await panel().locator("h2").innerText()).trim(), "Réglages du site");
    const entries = await panel().locator(".ss-entry .ss-entry-label").allInnerTexts();
    assert.deepEqual(entries, ["Couleurs globales", "Polices globales", "Typographie", "Boutons", "Images", "Champs de formulaire", "Identité du site", "Arrière-plan", "Mise en page", "Visionneuse", "Transitions de page", "CSS personnalisé", "Réglages supplémentaires"]);
    // Rien de simulé : toutes les entrées ouvrent un vrai écran (aucun bouton inactif)
    assert.equal(await panel().locator(".ss-entry[disabled]").count(), 0);
  });

  test("N2 Couleurs globales : changer la couleur principale l'enregistre et met à jour le canevas", async () => {
    await panel().locator(".ss-entry", { hasText: "Couleurs globales" }).click();
    assert.equal((await panel().locator("h2").innerText()).trim(), "Couleurs globales");
    assert.equal(await panel().locator(".ss-colors").first().locator("li").count(), 10, "les dix couleurs du système");
    const hex = panel().locator("input[aria-label='Code hexadécimal de « Principale »']");
    assert.equal(await canvasVar("--kw-primary"), "#0277b6");
    await hex.fill("#6b1e2e");
    await until(async () => tokens().colors.primary === "#6b1e2e", { what: "couleur enregistrée en base" });
    await saved();
    await until(async () => (await canvasVar("--kw-primary")) === "#6b1e2e", { what: "canevas mis à jour avec la nouvelle couleur" });
  });

  test("N3 une valeur invalide est signalée et n'enregistre rien", async () => {
    const hex = panel().locator("input[aria-label='Code hexadécimal de « Accent »']");
    const before_ = tokens().colors.accent;
    await hex.fill("rouge");
    assert.equal(await hex.getAttribute("aria-invalid"), "true");
    await wait(900);
    assert.equal(tokens().colors.accent, before_);
    await hex.blur();
    assert.equal(await hex.inputValue(), before_, "le champ revient à la dernière valeur valide");
  });

  test("N4 couleur personnalisée : ajout, renommage, utilisation réelle dans un élément, suppression refusée tant qu'elle est utilisée", async () => {
    await panel().getByRole("button", { name: "Ajouter une couleur" }).click();
    const name = panel().locator(".ss-name").first();
    await name.fill("Sable chaud");
    await name.blur();
    await until(async () => tokens().customColors.length === 1 && tokens().customColors[0].label === "Sable chaud", { what: "couleur personnalisée enregistrée" });
    const key = tokens().customColors[0].key;
    await saved();
    await until(async () => (await canvasVar(`--kw-${key}`)) === "#6b1e2e", { what: "variable de la couleur dans le canevas" });
    // Un widget qui l'utilise : enregistré par l'API (comme le fait l'éditeur), puis l'usage est compté
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: "2" }, styles: { desktop: { color: `token:${key}` } } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    await panel().locator("[aria-label='Fermer les réglages du site']").click();
    await panel().waitFor({ state: "hidden" });
    await openPanel();
    await panel().locator(".ss-entry", { hasText: "Couleurs globales" }).click();
    assert.match(await panel().locator(`[data-usage='${key}']`).innerText(), /Utilisée dans 1 page/);
    await panel().getByRole("button", { name: /Supprimer la couleur/ }).click();
    assert.equal(tokens().customColors.length, 1, "supprimer une couleur utilisée est refusé");
    assert.match(await page.locator("[data-pb-toast]").innerText(), /utilisée dans 1 page/);
  });

  test("N4b la couleur personnalisée est proposée dans le sélecteur de couleur d'un élément et s'applique réellement", async () => {
    const key = tokens().customColors[0].key;
    await panel().locator("[aria-label='Fermer les réglages du site']").click();
    await page.reload();
    await ready();
    // Le titre de la page utilise déjà la couleur (N4) : on le sélectionne dans le canevas, comme une personne
    await page.frameLocator("[data-pb-frame]").locator("h2").first().click();
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click().catch(() => {});
    const colorBtn = page.locator("[data-pb-inspector] .pb-color-btn").first();
    await colorBtn.waitFor();
    await colorBtn.click();
    const swatch = page.locator(`.pb-cpop-token[data-token='${key}']`);
    await swatch.waitFor({ timeout: 5000 });
    assert.match(await swatch.getAttribute("data-tip"), /Sable chaud/, "le nom de la couleur personnalisée est affiché");
    assert.equal(await swatch.evaluate((el) => el.classList.contains("is-on")), true, "elle est reconnue comme la couleur actuelle de l'élément");
    // Le titre est réellement coloré par la variable du site dans le canevas
    const color = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return getComputedStyle(d.querySelector("h2")).color; });
    assert.equal(color, "rgb(107, 30, 46)", "la couleur du titre suit la couleur personnalisée du site");
    await page.keyboard.press("Escape");
  });

  test("N5 Polices globales : la police des titres est enregistrée, relue après réouverture, et appliquée au canevas", async () => {
    await openPanel();
    await panel().locator(".ss-entry", { hasText: "Polices globales" }).click();
    assert.equal(await panel().locator(".ss-field select").count(), 4, "titres, texte, boutons, liens");
    await panel().locator("#ss-font-heading").selectOption("georgia");
    await until(async () => tokens().fonts.heading === "georgia", { what: "police enregistrée" });
    await saved();
    await until(async () => /Georgia/.test(await canvasVar("--kw-font-heading")), { what: "canevas mis à jour avec la police" });
    // fermer, recharger toute la page, rouvrir : la valeur est conservée (vraie persistance)
    await panel().locator("[aria-label='Fermer les réglages du site']").click();
    await page.reload();
    await ready();
    await openPanel();
    await panel().locator(".ss-entry", { hasText: "Polices globales" }).click();
    assert.equal(await panel().locator("#ss-font-heading").inputValue(), "georgia");
    await panel().locator("[aria-label='Retour aux réglages du site']").click();
    await panel().locator(".ss-entry", { hasText: "Couleurs globales" }).click();
    assert.equal(await panel().locator("input[aria-label='Code hexadécimal de « Principale »']").inputValue(), "#6b1e2e");
  });

  test("N6 Annuler / Rétablir : la couleur revient puis est rétablie, en base comme dans le canevas", async () => {
    const hex = panel().locator("input[aria-label='Code hexadécimal de « Secondaire »']");
    const original = tokens().colors.secondary;
    await hex.fill("#112233");
    await until(async () => tokens().colors.secondary === "#112233", { what: "modification enregistrée" });
    await panel().getByRole("button", { name: /Annuler la dernière modification/ }).click();
    await until(async () => tokens().colors.secondary === original, { what: "annulation enregistrée" });
    assert.equal(await panel().locator("input[aria-label='Code hexadécimal de « Secondaire »']").inputValue(), original);
    await panel().getByRole("button", { name: /Rétablir la modification/ }).click();
    await until(async () => tokens().colors.secondary === "#112233", { what: "rétablissement enregistré" });
  });

  test("N7 deux onglets : un réglage modifié ailleurs déclenche un conflit clair, rien n'est écrasé", async () => {
    const rev = db().prepare("SELECT settings_revision r FROM mk_sites WHERE id = ?").get(siteId).r;
    const t = tokens();
    t.colors.muted = "#555555";
    const other = await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { tokens: t, revision: rev }, headers: { Origin: srv.base } });
    assert.equal(other.status, 200, other.text);
    await panel().locator("input[aria-label='Code hexadécimal de « Texte »']").fill("#101010");
    await until(async () => /Conflit/.test(await status().innerText()), { what: "conflit signalé" });
    assert.notEqual(tokens().colors.text, "#101010", "la modification obsolète n'a rien écrasé");
    assert.equal(tokens().colors.muted, "#555555", "la modification de l'autre onglet est intacte");
    await panel().getByRole("button", { name: "Recharger les réglages du site" }).click();
    await until(async () => (await panel().locator("input[aria-label='Code hexadécimal de « Texte discret »']").inputValue()) === "#555555", { what: "réglages rechargés" });
  });

  test("N8 petit écran : le panneau tient dans l'écran, sans défilement horizontal ni bouton hors écran", async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    await wait(300);
    const box = await panel().boundingBox();
    assert.ok(box.width <= 390 && box.x >= 0, `panneau dans l'écran (${JSON.stringify(box)})`);
    const overflow = await panel().evaluate((el) => el.querySelector(".ss-body").scrollWidth > el.querySelector(".ss-body").clientWidth + 1);
    assert.equal(overflow, false, "aucun débordement horizontal dans le panneau");
    for (const sel of ["[aria-label='Fermer les réglages du site']", "[aria-label='Retour aux réglages du site']"]) {
      const b = await panel().locator(sel).boundingBox();
      assert.ok(b && b.x >= 0 && b.x + b.width <= 391, `${sel} visible dans l'écran`);
    }
    await page.setViewportSize({ width: 1500, height: 900 });
  });

  test("N9 aucune erreur JavaScript ni erreur de console pendant tout le parcours", async () => {
    assert.deepEqual(errors, [], `erreurs navigateur : ${errors.join(" | ")}`);
  });
});
