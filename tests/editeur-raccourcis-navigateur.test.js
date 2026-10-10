// Raccourcis clavier de l'éditeur de pages dans un VRAI Chrome : dupliquer, annuler, rétablir, copier-coller, supprimer, enregistrer.
// Preuve pour la matrice de parité (P-01 à P-04, D-01). Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "ht0000000001", type: "heading", props: { text: "Premier titre", level: "2" } },
  { id: "ht0000000002", type: "heading", props: { text: "Second titre", level: "2" } }] }] };

describe("éditeur de pages : raccourcis clavier (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId;
  const count = () => page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length);
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(150); } };
  const select = async (nid) => { await page.evaluate((nid) => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); document.querySelector(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); }, nid); await wait(300); await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); };
  const mod = process.platform === "darwin" ? "Meta" : "Control";

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 850 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Raccourcis" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Ctrl+D duplique, Ctrl+Z annule, Ctrl+Maj+Z rétablit", async () => {
    await select("ht0000000001");
    const n0 = await count();
    await page.keyboard.press(`${mod}+d`); await until(async () => (await count()) === n0 + 1, "duplication");
    await page.keyboard.press(`${mod}+z`); await until(async () => (await count()) === n0, "annulation");
    await page.keyboard.press(`${mod}+Shift+z`); await until(async () => (await count()) === n0 + 1, "rétablissement");
    await page.keyboard.press(`${mod}+z`); await until(async () => (await count()) === n0, "retour à l'état initial");
  });

  test("Ctrl+C puis Ctrl+V colle une copie ; Suppr la retire", async () => {
    await select("ht0000000002");
    const n0 = await count();
    await page.keyboard.press(`${mod}+c`); await page.keyboard.press(`${mod}+v`);
    await until(async () => (await count()) === n0 + 1, "collage");
    await page.keyboard.press("Delete"); await until(async () => (await count()) === n0, "suppression de la copie");
  });

  test("Ctrl+S enregistre le brouillon sur le serveur", async () => {
    await select("ht0000000001");
    await page.keyboard.press(`${mod}+d`); await until(async () => (await count()) === 4 || (await count()) > 3, "duplication avant enregistrement");
    await page.keyboard.press(`${mod}+s`);
    await until(() => {
      const row = srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId);
      return row && JSON.stringify(row).split("Premier titre").length - 1 >= 2;
    }, "brouillon enregistré avec la copie");
  });

  test("le collage fonctionne aussi dans une autre page (presse-papiers de l'éditeur)", async () => {
    await select("ht0000000002");
    await page.keyboard.press(`${mod}+c`);
    const id2 = Number((await boss.post("/marketing/pages", { name: "Autre page" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${id2}/editeur`);
    await page.waitForFunction(() => document.querySelector("[data-pb-layers]"), null, { timeout: 30000 });
    await wait(1500);
    const n0 = await count();
    await page.keyboard.press(`${mod}+v`);
    await until(async () => (await count()) > n0, "collage dans une autre page", 8000);
  });
});
