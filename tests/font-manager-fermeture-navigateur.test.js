// Sélecteur de police (éditeur d'e-mails) : fermeture par clic extérieur — y compris dans le canevas (iframe), la toolbar, la structure,
// la palette, l'inspecteur, une zone vide —, ESC et choix d'une police ; reste ouvert pour la recherche, les catégories et le défilement ;
// la fermeture ne déplace ni le canevas ni les panneaux et conserve la sélection du bloc.
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
async function until(check, { timeout = 10000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("fermeture du sélecteur de police (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const open = () => page.locator(".kf-panel");
  const isOpen = async () => (await open().count()) === 1;
  // Le sélecteur de la barre d'outils du bloc sélectionné (« Police du titre ») : celui qu'un auteur utilise en écrivant
  const trigger = () => page.locator(".kf-ctx:visible").first();
  const selectBlock = async () => { await page.frameLocator("#mk-frame").locator("[data-mk-block]").first().click(); await trigger().waitFor(); };
  const openPicker = async () => { if (await isOpen()) return; if (!(await trigger().count())) await selectBlock(); await trigger().click(); await open().waitFor(); };
  const closedBy = async (what, action) => {
    await openPicker();
    await action();
    await until(async () => (await open().count()) === 0, { what: `fermeture : ${what}` });
  };
  // Clic réel dans l'iframe du canevas, en un point que la fenêtre du sélecteur ne recouvre pas
  const clickCanvas = async (corner) => {
    const f = await page.locator("#mk-frame").boundingBox();
    const p = await open().boundingBox().catch(() => null);
    const pts = corner === "block" ? [[f.x + f.width / 2, f.y + 60], [f.x + f.width / 2, f.y + 200]] : [[f.x + f.width - 12, f.y + f.height - 12], [f.x + 12, f.y + f.height - 12]];
    const free = pts.find(([x, y]) => !p || x < p.x || x > p.x + p.width || y < p.y || y > p.y + p.height) || pts[0];
    await page.mouse.click(free[0], free[1]);
  };
  // Positions qui ne doivent pas bouger : défilement du canevas et largeur des colonnes
  const geometry = () => page.evaluate(() => {
    const f = document.getElementById("mk-frame"), doc = f && f.contentDocument, r = (id) => { const e = document.getElementById(id); return e ? Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().left) : ""; };
    return { frameScroll: doc ? [doc.scrollingElement.scrollTop, doc.scrollingElement.scrollLeft] : null, frame: r("mk-frame"), props: r("mk-props"), palette: r("mk-palette"), selected: (doc ? doc.querySelectorAll("[data-mk-selected]").length : 0) + document.querySelectorAll("#mk-structure .is-selected, #mk-structure [aria-selected='true']").length };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const id = Number((await boss.post("/marketing/modeles", { name: "Fermeture polices", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }), { what: "canevas prêt" });
    // un bloc dans le message pour avoir un vrai canevas à cliquer
    const group = page.locator(".mk-palette-group:not(#mk-palette-recent)", { has: page.locator('[data-add="heading"]') }).first();
    const toggle = group.locator(".mk-palette-toggle");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    await group.locator('[data-add="heading"]').first().click();
    await until(() => page.evaluate(() => document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]").length >= 1), { what: "bloc ajouté" });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("clic extérieur : canevas (dans l'iframe), bloc du canevas, zone vide du canevas", async () => {
    await selectBlock();
    await closedBy("bloc du canevas", () => clickCanvas("block"));
    await closedBy("zone vide du canevas", () => clickCanvas("empty"));
  });
  test("clic extérieur : toolbar, panneau Blocs (palette), panneau de droite, structure, bouton d'aperçu, zone vide de l'éditeur", async () => {
    await closedBy("toolbar (enregistrer)", () => page.locator("#mk-save").click({ force: true }).catch(() => {}));
    await closedBy("palette de blocs", () => page.locator("#mk-palette .mk-palette-search, #mk-palette").first().click({ position: { x: 4, y: 4 }, force: true }));
    await closedBy("panneau de droite", () => page.locator("#mk-props").click({ position: { x: 4, y: 4 }, force: true }));
    // Onglets du panneau de gauche (réels) : Structure, Styles (inspecteur) ; le clic sur un onglet est un clic extérieur
    for (const key of ["structure", "styles", "blocks"]) {
      const tab = page.locator(`#tab-${key}`);
      if (await tab.count()) await closedBy(`onglet ${key}`, () => tab.click());
    }
    await closedBy("ligne de la structure", async () => { await page.locator("#tab-structure").click(); await page.locator("#mk-structure li").first().click(); });
    await closedBy("zone vide de l'éditeur", () => page.mouse.click(2, 600));
    await closedBy("autre contrôle de la barre d'outils (taille, couleur, gras…)", async () => {
      const panelBox = await open().boundingBox();
      const boxes = await page.locator(".mk-tb-btn:visible, .mk-tb-num:visible, .mk-tb-select:visible").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
      const free = boxes.find(([x, y]) => x < panelBox.x || x > panelBox.x + panelBox.width || y < panelBox.y || y > panelBox.y + panelBox.height);
      assert.ok(free, "un contrôle de la barre d'outils hors de la fenêtre du sélecteur");
      await page.mouse.click(free[0], free[1]);
    });
  });
  test("reste ouvert : recherche (clic et saisie), catégories, défilement de la liste, clic sur le fond du sélecteur", async () => {
    await openPicker();
    await open().locator(".kf-search").click();
    assert.equal(await isOpen(), true);
    await open().locator(".kf-search").fill("serif");
    await wait(150);
    assert.equal(await isOpen(), true);
    await open().locator(".kf-chip", { hasText: "Serif" }).first().click();
    assert.equal(await isOpen(), true, "une catégorie sert de filtre : le sélecteur reste ouvert");
    await open().locator(".kf-search").fill("");
    await until(async () => (await open().locator(".kf-row").count()) >= 8, { what: "liste (fenêtre de lignes virtualisée)" });
    await open().locator(".kf-list").evaluate((l) => { l.scrollTop = 600; });
    await open().locator(".kf-list").hover();
    await page.mouse.wheel(0, 400);
    await wait(150);
    assert.equal(await isOpen(), true, "défilement : reste ouvert");
    await open().locator(".kf-foot").click();
    assert.equal(await isOpen(), true);
    await trigger().click();
    await until(async () => !(await isOpen()), { what: "second clic sur le champ : ferme" });
  });
  test("choix d'une police : sélectionnée puis fermeture ; ESC ; réouverture normale", async () => {
    await openPicker();
    await open().locator(".kf-search").fill("Lora");
    await open().locator('.kf-pick[data-font="font.lora"]').click();
    await until(async () => !(await isOpen()), { what: "fermeture après choix" });
    await until(async () => (await trigger().locator(".kf-btn-name").textContent()) === "Lora", { what: `libellé Lora (affiché : ${await page.locator(".kf-ctx:visible .kf-btn-name").allTextContents()})` });
    await openPicker();
    await page.keyboard.press("Escape");
    await until(async () => !(await isOpen()), { what: "ESC ferme" });
    await openPicker();
    assert.equal(await isOpen(), true, "réouverture normale");
    await open().locator(".kf-search").fill("Arial");
    await open().locator('.kf-pick:has-text("Arial")').first().click();
    await until(async () => !(await isOpen()), { what: "choix d'une police historique" });
    assert.equal(await trigger().locator(".kf-btn-name").textContent(), "Arial");
  });
  test("la fermeture ne bouge ni le canevas, ni les panneaux, ni la sélection du bloc", async () => {
    await selectBlock();
    await openPicker();
    const before = await geometry();
    await page.mouse.click(2, 600);
    await until(async () => !(await isOpen()), { what: "fermeture" });
    const after = await geometry();
    assert.deepEqual(after, before);
    assert.deepEqual(errors, []);
  });
});
