// Accueil persistant et « Reprendre mon travail » (Chrome réel, vrai serveur).
// Vérifie : l'icône Accueil rouvre l'écran de démarrage sans toucher au document, à l'historique ni à l'enregistrement ; « Reprendre mon travail »
// ramène le travail intact ; classique / guidé depuis l'accueil AJOUTENT sans rien effacer ; format verrouillé respecté ; aucun raccourci actif dessous.
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

describe("accueil persistant et reprise du travail (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const db = () => srv.db();
  const row = (id) => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]") }; };
  const layout = (id) => (draft(id).theme || {}).layout;
  const start = () => page.locator("[data-pb-start]");
  const home = () => page.locator("[data-pb-home]");
  const nodes = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
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
  const withContent = async (name, theme) => {
    const id = await create(name);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: { ...CONTENT, theme: theme || JSON.parse(row(id).theme) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    return id;
  };
  const deleteContainer = async () => {
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await nodes()) === 0, { what: "page vidée" });
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

  test("l'icône Accueil est accessible (libellé, infobulle) et rouvre l'écran sans toucher au document ni à l'enregistrement", async () => {
    const id = await withContent("Accueil A");
    assert.equal(await start().isHidden(), true);
    assert.match(await home().getAttribute("aria-label"), /Accueil/);
    assert.match(await home().getAttribute("data-tip"), /Accueil/);
    const revision = row(id).revision;
    await home().click();
    await start().waitFor({ state: "visible" });
    assert.equal(await home().getAttribute("aria-pressed"), "true");
    const text = await start().innerText();
    assert.match(text, /Reprendre mon travail/); assert.match(text, /Création classique/); assert.match(text, /Création guidée/);
    await wait(1500);
    assert.equal(row(id).revision, revision, "ouvrir l'accueil n'enregistre rien");
    assert.equal(draft(id).sections[0].children[0].children[0].props.text, "Titre");
    await page.locator("[data-pb-home-resume]").click();
    await start().waitFor({ state: "hidden" });
    assert.equal(await home().getAttribute("aria-pressed"), "false");
    assert.equal(await nodes() > 0, true, "le canevas est intact");
    assert.equal(await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"]').count(), 1);
  });

  test("Accueil : un second clic referme ; Échap referme ; aucun raccourci n'agit sur la page cachée (Suppr)", async () => {
    await home().click(); await start().waitFor({ state: "visible" });
    await home().click(); await start().waitFor({ state: "hidden" });
    await home().click(); await start().waitFor({ state: "visible" });
    await page.keyboard.press("Delete");
    await wait(300);
    assert.equal(await nodes() > 0, true, "Suppr n'a rien supprimé sous l'accueil");
    await page.locator("[data-pb-home-resume]").focus();
    await page.keyboard.press("Escape");
    await start().waitFor({ state: "hidden" });
  });

  test("modifications non enregistrées : passer par l'accueil ne les perd pas, l'historique reste, l'enregistrement se fait ensuite", async () => {
    const id = await withContent("Accueil B");
    await page.locator("[data-pb-mode='structure']").count(); // présent
    await deleteContainer();
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), false);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.match(await start().innerText(), /Reprendre mon travail/, "page vidée : l'accueil propose bien la reprise");
    await page.locator("[data-pb-home-resume]").click(); await start().waitFor({ state: "hidden" });
    assert.equal(await nodes(), 0, "la page vidée reste vidée (aucune réinitialisation)");
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    // Annuler / Rétablir fonctionnent après la navigation
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await nodes()) > 0, { what: "annulation après accueil" });
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await nodes()) === 0, { what: "rétablissement après accueil" });
  });

  test("page vidée puis rechargée : l'accueil reste atteignable par l'icône ; rien n'est modifié", async () => {
    const id = await withContent("Accueil C");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await open(id);
    assert.equal(await home().isVisible(), true);
    await home().click(); // la page est vide mais possède une section : travail existant
    await start().waitFor({ state: "visible" });
    assert.equal((draft(id).sections || []).length, 1, "rien n'a été modifié");
  });

  test("page entièrement vide (aucune section) : l'écran de démarrage reste affiché, l'icône ne le duplique pas", async () => {
    const id = await create("Accueil D");
    await start().waitFor({ state: "visible" });
    await home().click();
    assert.equal(await start().locator("[data-pb-start-card]").count(), 2, "un seul écran, pas de doublon");
    assert.equal(await start().locator("[data-pb-home-resume]").count(), 0, "rien à reprendre sur une page vierge");
    assert.equal((draft(id).sections || []).length, 0);
  });

  test("Création classique depuis l'accueil : AJOUTE une structure sans effacer l'existant", async () => {
    const id = await withContent("Accueil E");
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="classic"]').click();
    await start().waitFor({ state: "hidden" });
    await page.getByText("Quelle mise en page utiliser", { exact: false }).first().waitFor({ timeout: 8000 });
    assert.equal(await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"]').count(), 1, "contenu existant conservé");
    assert.equal(layout(id), undefined);
  });

  test("Création guidée depuis l'accueil : gabarit appliqué à la page existante, contenu conservé, annulable", async () => {
    const id = await withContent("Accueil F");
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-start-format="compact"]').click();
    await page.locator("[data-pb-start-continue]").click();
    await until(() => { const l = layout(id); return l && l.format === "compact"; }, { what: "format enregistré" });
    await start().waitFor({ state: "hidden" });
    assert.equal(draft(id).sections[0].children[0].children[0].props.text, "Titre", "contenu conservé");
    assert.equal(await home().getAttribute("aria-pressed"), "false");
  });

  test("format verrouillé : la création guidée est désactivée depuis l'accueil, le travail reste repris normalement", async () => {
    const id = await withContent("Accueil G", { layout: { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true } });
    await home().click(); await start().waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-pb-start-go="guided"]').isDisabled(), true);
    assert.match(await start().innerText(), /verrouillé/);
    await page.locator("[data-pb-home-resume]").click(); await start().waitFor({ state: "hidden" });
    assert.deepEqual(layout(id), { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true });
  });

  test("petite largeur (téléphone) : l'icône Accueil reste atteignable et l'écran sans débordement", async () => {
    await withContent("Accueil H");
    await page.setViewportSize({ width: 420, height: 900 });
    await wait(300);
    assert.equal(await home().isVisible(), true);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => { const e = document.querySelector("[data-pb-start]"); return e.scrollWidth <= e.clientWidth + 1; }), true);
    await page.setViewportSize({ width: 1600, height: 950 });
  });

  test("historique conservé après rechargement : Annuler et Rétablir fonctionnent encore, et l'écran de démarrage ne revient pas", async () => {
    const id = await withContent("Accueil I");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await wait(1200); // l'historique est copié dans le navigateur après une courte pause
    await open(id);
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), false, "Annuler disponible après rechargement");
    assert.equal(await nodes(), 0);
    assert.equal(await start().isHidden(), true, "page vidée volontairement : pas de retour à l'écran de choix");
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await nodes()) > 0, { what: "annulation après rechargement" });
    assert.equal(await page.locator("[data-pb-redo]").isDisabled(), false);
    await wait(1200);
    await open(id); // Rétablir aussi survit à un rechargement
    assert.equal(await page.locator("[data-pb-redo]").isDisabled(), false, "Rétablir disponible après rechargement");
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await nodes()) === 0, { what: "rétablissement après rechargement" });
  });

  test("historique écarté si la page a changé ailleurs : jamais appliqué à un autre contenu", async () => {
    const id = await withContent("Accueil J");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await wait(1200);
    const other = { ...draft(id), sections: [{ id: "sect00000009", type: "layout", children: [{ id: "cont00000009", type: "container", children: [] }] }] };
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: other }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), true, "historique d'un autre contenu écarté");
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
