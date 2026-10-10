// Éditeur — canevas : la création d'éléments met le canevas à jour EN PLACE (le cadre n'est pas rechargé) ; une section interactive (onglets,
// accordéon, compteur) recharge le cadre en DOUBLE TAMPON (un seul cadre, jamais vide, défilement conservé). Chrome réel, vrai serveur.
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
async function until(check, { timeout = 12000, every = 10, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } },
  { id: "head00000002", type: "heading", props: { text: "Bas de page", level: 2 }, styles: { desktop: { paddingTop: "1800px" } } },
] }] }] };

describe("éditeur : canevas sans rechargement ni blanc (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const countNodes = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Fluidité" })).location.match(/(\d+)$/)[1]);
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
    await wait(600);
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("créer un conteneur, une liste, un badge, une grille : le cadre n'est JAMAIS rechargé (feuilles de style réconciliées en place)", async () => {
    for (const type of ["container", "list", "badge", "grid"]) {
      const n0 = await countNodes();
      await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; d.__garde = 1; });
      await page.evaluate((t) => window.pbNav.addElement(t), type);
      await until(async () => (await countNodes()) > n0, { what: `${type} visible dans le canevas` });
      assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.__garde), 1, `${type} : le document du cadre est resté en place (pas de rechargement)`);
    }
    await saved();
    assert.equal(draft().sections[0].children[0].children.length > 1, true, "les éléments créés sont enregistrés");
  });

  test("section interactive (onglets, accordéon, compteur) : double tampon — un seul cadre, jamais vide, défilement conservé, ancien cadre retiré", async () => {
    // on sélectionne l'élément du bas (le nouvel élément s'insère près de lui, donc reste à l'écran), puis on défile
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000002"] > .pb-row-item').click(); await wait(400);
    await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; d.defaultView.scrollTo(0, 1500); });
    await wait(300);
    const y0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
    assert.ok(y0 > 300, `la page est défilée (${y0})`);
    for (const type of ["tabs", "accordion", "counter"]) {
      const r = await page.evaluate(async (t) => {
        const f0 = document.querySelector("[data-pb-frame]"); let swap = false, vides = 0, deux = 0;
        window.pbNav.addElement(t);
        await new Promise((res) => { const t0 = performance.now(); const iv = setInterval(() => {
          const fs = document.querySelectorAll("[data-pb-frame]"); if (fs.length !== 1) deux++;
          const f = fs[0], d = f && f.contentDocument; if (f !== f0) swap = true;
          if (!d || !d.body || !d.querySelector("[data-node-id]")) vides++;
          if (performance.now() - t0 > 1500 || (swap && performance.now() - t0 > 400)) { clearInterval(iv); res(); } }, 2); });
        return { swap, vides, deux, ancienRetire: !f0.isConnected, y: document.querySelector("[data-pb-frame]").contentWindow.scrollY, frames: document.querySelectorAll("iframe.pb-frame").length };
      }, type);
      assert.equal(r.swap, true, `${type} : cadre remplacé`);
      assert.equal(r.deux, 0, `${type} : jamais deux cadres identifiés`);
      assert.equal(r.frames, 1, `${type} : un seul cadre dans la page`);
      assert.equal(r.ancienRetire, true);
      assert.ok(r.vides <= 3, `${type} : cadre jamais vide (${r.vides} relevés à 2 ms)`);
      assert.ok(Math.abs(r.y - y0) <= 2, `${type} : défilement conservé (${y0} → ${r.y})`);
    }
    // l'éditeur reste pleinement utilisable avec le nouveau cadre : sélection par clic dans le canevas, puis dans l'inspecteur
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click(); await wait(300);
    assert.equal(await page.evaluate(() => (window.pbNav.selection() || [])[0]), "head00000001");
    assert.equal(await page.evaluate(() => !!document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="head00000001"].is-selected')), true, "le repère de sélection suit dans le nouveau cadre");
    await saved();
    assert.deepEqual(errors, []);
  });

});
