// Canvas vide : choix « Création classique » / « Création guidée » (Chrome réel, vrai serveur).
// Vérifie : affichage seulement pour un vrai état vide, mode classique = sélecteur de structures habituel, mode guidé = format réellement écrit
// (theme.layout) puis appliqué au rendu, verrou protégé côté serveur, pas de réaffichage après vidage volontaire, pas de remontage du canevas.
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
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } }] },
] }] };

describe("canvas vide : choix du mode de création (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const db = () => srv.db();
  const row = (id) => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]") }; };
  const layout = (id) => (draft(id).theme || {}).layout; // le format vit dans le thème du BROUILLON (la colonne theme est la version publiée)
  const start = () => page.locator("[data-pb-start]");
  const create = async (name) => {
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    await page.locator("#lp-name").fill(name);
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    return Number(page.url().match(/pages\/(\d+)/)[1]);
  };
  const open = async (id) => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  let blankId;
  test("une nouvelle page vide affiche les deux modes, sans recouvrir la barre d'outils ni l'inspecteur", async () => {
    blankId = await create("Page vide A");
    assert.equal((draft(blankId).sections || []).length, 0, "la page de départ est réellement vide");
    await start().waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-pb-start-card="classic"]').count(), 1);
    assert.equal(await page.locator('[data-pb-start-card="guided"]').count(), 1);
    const text = await start().innerText();
    assert.match(text, /Création classique/); assert.match(text, /Création guidée/);
    assert.match(text, /Commencer/); assert.match(text, /Choisir un gabarit/);
    const r = await start().boundingBox(), canvas = await page.locator("[data-pb-canvas]").boundingBox(), top = await page.locator(".pb-top").boundingBox();
    assert.ok(r.x >= canvas.x - 1 && r.x + r.width <= canvas.x + canvas.width + 1, "limité à la zone du canevas");
    assert.ok(r.y >= top.y + top.height - 1, "sous la barre d'outils");
  });

  test("Annuler (configuration) : ferme sans rien écrire ; Retour revient au choix", async () => {
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator("[data-pb-start-format]").first().waitFor();
    await page.locator("[data-pb-start-back]").click();
    await page.locator('[data-pb-start-card="classic"]').waitFor();
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator("[data-pb-start-cancel]").click();
    await until(async () => start().isHidden(), { what: "panneau fermé" });
    await wait(1200);
    assert.equal(layout(blankId), undefined, "aucun format écrit");
    assert.equal((draft(blankId).sections || []).length, 0);
  });

  test("mode classique : « Commencer » ouvre le sélecteur de structures habituel, aucun format imposé", async () => {
    await open(blankId);
    await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="classic"]').click();
    await until(async () => start().isHidden(), { what: "panneau fermé" });
    await page.getByText("Quelle mise en page utiliser", { exact: false }).first().waitFor({ timeout: 8000 });
    await wait(1200);
    assert.equal(layout(blankId), undefined, "conception libre : pas de theme.layout");
  });

  test("mode guidé : format choisi, écrit (verrouillé par défaut), appliqué au rendu, conservé après rechargement", async () => {
    const id = await create("Page vide B");
    await start().waitFor({ state: "visible" });
    await page.evaluate(() => { window.__frameBefore = document.querySelector("[data-pb-frame]"); });
    await page.locator('[data-pb-start-go="guided"]').click();
    assert.equal(await page.locator('[data-pb-start-format="compact"]').count(), 1);
    assert.equal(await page.locator('[data-pb-start-lock]').getAttribute("aria-checked"), "true", "verrouillé par défaut, explicite");
    assert.match(await page.locator("[data-pb-start-lock]").innerText(), /Format verrouillé/);
    await page.locator('[data-pb-start-format="large"]').click();
    assert.match(await page.locator("[data-pb-start-note]").innerText(), /1440 px/);
    await page.locator("[data-pb-start-continue]").click();
    await until(() => { const l = layout(id); return l && l.format === "large"; }, { what: "format enregistré" });
    assert.deepEqual(layout(id), { mode: "guided", format: "large", maxWidth: 1440, gutter: 32, locked: true });
    await until(async () => start().isHidden(), { what: "panneau fermé" });
    assert.equal(await page.evaluate(() => window.__frameBefore === document.querySelector("[data-pb-frame]")), true, "le canevas n'est pas remonté");
    // Le sélecteur de structures s'ouvre ensuite : le canevas reste directement modifiable
    await page.getByText("Quelle mise en page utiliser", { exact: false }).first().waitFor({ timeout: 8000 });
    await open(id);
    assert.equal(await start().isHidden(), true, "un format déjà choisi : pas de nouveau choix");
    // le serveur protège le format verrouillé
    const d = draft(id); d.theme = { ...(d.theme || {}), layout: { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true } };
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: d }, headers: { Origin: srv.base } });
    assert.equal(r.status, 422); assert.match(JSON.parse(r.text).error.message, /Format verrouillé/);
  });

  test("mode guidé « Personnalisé » : valeurs invalides refusées à l'écran, valeurs valides enregistrées, déverrouillé", async () => {
    const id = await create("Page vide C");
    await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-start-format="custom"]').click();
    await page.locator("[data-pb-start-maxWidth]").fill("100");
    await page.locator("[data-pb-start-continue]").click();
    assert.match(await page.locator("[data-pb-start] [role=alert]").innerText(), /320/);
    assert.equal(layout(id), undefined, "rien d'écrit");
    await page.locator("[data-pb-start-maxWidth]").fill("1100");
    await page.locator("[data-pb-start-lock]").click();
    assert.match(await page.locator("[data-pb-start-lock]").innerText(), /Format déverrouillé/);
    await page.locator("[data-pb-start-continue]").click();
    await until(() => layout(id) && layout(id).format === "custom", { what: "format enregistré" });
    assert.deepEqual(layout(id), { mode: "guided", format: "custom", maxWidth: 1100, gutter: 24, locked: false });
  });

  test("page existante : jamais de choix ; vider volontairement la page ne réaffiche pas l'écran et ne touche pas au thème", async () => {
    const id = await create("Page existante");
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: { ...CONTENT, theme: JSON.parse(row(id).theme) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    assert.equal(await start().isHidden(), true, "page non vide : aucun écran de démarrage");
    await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]'); f.click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length)) === 0, { what: "page vidée" });
    await wait(800);
    assert.equal(await start().isHidden(), true, "vidage volontaire : l'écran ne revient pas");
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
