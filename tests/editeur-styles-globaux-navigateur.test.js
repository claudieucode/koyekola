// Éditeur — coller le style (fusion non destructive, compatible, par groupe, Ctrl/⌘ + Maj + V, annuler) et valeurs globales du site pour les longueurs
// (espacements, rayons, tailles de texte : référence réelle « token:… », rendu avec repli, retour à une valeur propre). Chrome réel, vrai serveur.
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
async function until(check, { timeout = 12000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Source", level: 2 }, styles: { desktop: { color: "#ff0000", fontWeight: "700", fontSize: "30px" }, mobile: { fontSize: "22px" } } },
  { id: "head00000002", type: "heading", props: { text: "Cible", level: 2 }, styles: { desktop: { paddingTop: "33px", color: "#0000ff" } } },
  { id: "spac00000001", type: "spacer", props: { size: "32" } },
] }] }] };

describe("styles : coller le style et valeurs du site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const search = (id, list) => { for (const x of list || []) { if (x.id === id) return x; const f = search(id, x.children); if (f) return f; } return null; };
  const find = (id) => search(id, draft().sections);
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement" });
  const canvasStyle = (id, prop) => page.evaluate(([i, p]) => { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${i}"]`); return el ? getComputedStyle(el)[p] : null; }, [id, prop]);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Styles" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("coller le style : fusion (les réglages propres de la cible restent), tous écrans, annulable ; Ctrl+Maj+V ; éléments inapplicables ignorés sans erreur", async () => {
    await row("head00000001").click(); await wait(300);
    await page.keyboard.press("Control+Alt+c");
    await row("head00000002").click(); await wait(300);
    await page.keyboard.press("Control+Shift+v");
    await saved();
    const b = find("head00000002");
    assert.equal(b.styles.desktop.paddingTop, "33px", "réglage propre de la cible conservé (avant : effacé)");
    assert.equal(b.styles.desktop.color, "#ff0000"); assert.equal(b.styles.desktop.fontWeight, "700"); assert.equal(b.styles.desktop.fontSize, "30px");
    assert.equal(b.styles.mobile.fontSize, "22px", "réglage de l'écran mobile collé aussi");
    assert.equal(b.props.text, "Cible", "le contenu n'est jamais touché");
    await until(async () => (await canvasStyle("head00000002", "color")) === "rgb(255, 0, 0)", { what: "canevas mis à jour" });
    assert.equal(await canvasStyle("head00000002", "paddingTop"), "33px");
    // annuler : une seule étape, la cible retrouve ses valeurs d'origine
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await canvasStyle("head00000002", "color")) === "rgb(0, 0, 255)", { what: "annulation" });
    await saved();
    assert.equal(find("head00000002").styles.desktop.fontWeight, undefined);
    // cible incompatible (espace) : rien d'applicable → message, aucun changement, aucune erreur
    await row("spac00000001").click(); await wait(300);
    await page.keyboard.press("Control+Shift+v");
    await wait(500);
    assert.equal(find("spac00000001").styles, undefined, "aucun réglage de texte posé sur un espace");
    assert.deepEqual(errors, []);
  });

  test("coller par groupe : « couleurs seulement » ne copie ni la graisse ni la taille", async () => {
    await row("head00000001").click(); await wait(300);
    await page.keyboard.press("Control+Alt+c");
    await row("head00000002").click(); await wait(300);
    await page.keyboard.press("Control+k");
    await page.locator(".pb-cmd-input, [data-pb-cmd-input], input[type=search]:visible").first().fill("couleurs seulement");
    await page.keyboard.press("Enter");
    await saved();
    const b = find("head00000002");
    assert.equal(b.styles.desktop.color, "#ff0000");
    assert.equal(b.styles.desktop.fontWeight, undefined, "la graisse n'est pas copiée"); assert.equal(b.styles.desktop.fontSize, undefined, "la taille n'est pas copiée");
    assert.equal(b.styles.desktop.paddingTop, "33px");
  });

  test("valeur du site pour un espacement : référence réelle (token:), rendu avec repli, pastille, retour à une valeur propre, annulation", async () => {
    await row("head00000002").click(); await wait(300);
    await page.locator("[data-pb-inspector]").getByRole("tab", { name: "Style" }).click(); await wait(300);
    await page.evaluate(() => { const n = document.querySelector('[data-pb-inspector] [aria-label="Intérieur haut"]'); let d = n.closest("details"); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } });
    const btn = page.locator('[data-pb-inspector] [aria-label="Intérieur : valeur du site (4 côtés)"]').first();
    await btn.scrollIntoViewIfNeeded(); await btn.click();
    await page.locator(".pb-menu button, [role=menuitem]", { hasText: "Espacement L" }).first().click();
    await saved();
    for (const side of ["Top", "Right", "Bottom", "Left"]) assert.equal(find("head00000002").styles.desktop["padding" + side], "token:space-lg", "la référence est enregistrée (pas une copie du nombre) : " + side);
    await until(async () => (await canvasStyle("head00000002", "paddingTop")) === "32px", { what: "valeur du jeton rendue (repli 32 px hors site) ; obtenu : " + (await canvasStyle("head00000002", "paddingTop")) + " / règle : " + (await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return [...d.querySelectorAll("style")].map((x) => (x.textContent.match(/head00000002[^}]*\}/g) || []).join("|")).join("~").slice(0, 300); })) });
    assert.equal(await page.locator('[data-pb-inspector] [aria-label^="Intérieur haut"]').first().getAttribute("placeholder"), "L", "la case affiche le nom du jeton");
    // retour à des valeurs propres
    await btn.click();
    await page.locator(".pb-menu button, [role=menuitem]", { hasText: "Revenir à des valeurs propres" }).first().click();
    await saved();
    assert.equal(find("head00000002").styles.desktop.paddingTop, undefined);
    // annuler : le lien au jeton revient
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await canvasStyle("head00000002", "paddingTop")) === "32px", { what: "annulation du retour" });
    // rayon et taille de texte : même mécanisme (bouton « lien » à côté du nombre)
    const fs0 = page.locator('[data-pb-inspector] .pb-lenwrap:has([aria-label="Taille"]) .pb-tokbtn, [data-pb-inspector] .pb-lenwrap .pb-tokbtn[aria-label*="Taille"]').first();
    if (await fs0.count()) { await fs0.scrollIntoViewIfNeeded(); await fs0.click(); await page.locator(".pb-menu button, [role=menuitem]", { hasText: "Taille H3" }).first().click(); await saved(); assert.equal(find("head00000002").styles.desktop.fontSize, "token:h3-size"); await until(async () => (await canvasStyle("head00000002", "fontSize")) !== "" && (await canvasStyle("head00000002", "fontSize")) !== "30px", { what: "taille du jeton rendue" }); }
    assert.deepEqual(errors, []);
  });
});
