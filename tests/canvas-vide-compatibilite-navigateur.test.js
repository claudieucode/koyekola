// Canvas vide, mode guidé : compatibilité avec Flexbox, widgets, vues responsive, verrou (contenu libre / format protégé) et erreurs d'enregistrement
// (Chrome réel, vrai serveur). Complète canvas-vide-choix-navigateur.test.js.
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
const CONTENT = (theme) => ({ theme, sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "flex00000001", type: "container", styles: { desktop: { display: "flex", flexDirection: "row", gap: "20px" } }, children: [
    { id: "text00000001", type: "text", props: { html: "<p>Colonne A</p>" } },
    { id: "text00000002", type: "text", props: { html: "<p>Colonne B</p>" } },
  ] },
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } },
] }] });

describe("canvas vide guidé : compatibilité (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, id;
  const db = () => srv.db();
  const row = () => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = () => { const r = row(); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]") }; };
  const put = (content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row().revision, content }, headers: { Origin: srv.base } });
  const inFrame = (fn, arg) => page.evaluate(([src, a]) => { const d = document.querySelector("[data-pb-frame]").contentDocument; return new Function("d", "a", src)(d, a); }, [`return (${fn.toString()})(d, a)`, arg]);
  const open = async () => {
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
    // page créée par l'écran de choix, mode guidé « compact » verrouillé
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    await page.locator("#lp-name").fill("Guidée compat");
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    id = Number(page.url().match(/pages\/(\d+)/)[1]);
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator("[data-pb-cat-next]").click();
    await page.locator('[data-pb-start-format="compact"]').click();
    await page.locator("[data-pb-start-continue]").click();
    await until(() => (draft().theme || {}).layout, { what: "format enregistré" });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Flexbox et widgets : un conteneur flex avec widgets s'affiche en ligne, sous la largeur du format (960 px)", async () => {
    const r = await put(CONTENT(draft().theme));
    assert.equal(r.status, 200, r.text.slice(0, 200));
    await open();
    const m = await inFrame((d) => {
      const c = d.querySelector('[data-node-id="flex00000001"]'), a = d.querySelector('[data-node-id="text00000001"]'), b = d.querySelector('[data-node-id="text00000002"]');
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return { display: getComputedStyle(c).display, sameRow: Math.abs(ra.top - rb.top) < 2, width: Math.round(c.getBoundingClientRect().width) };
    });
    assert.equal(m.display, "flex"); assert.ok(m.sameRow, "les deux widgets sont côte à côte");
    assert.ok(m.width <= 960, `largeur du contenu plafonnée par le format : ${m.width}`);
  });

  test("verrou : le contenu courant reste modifiable (texte, couleur, ajout de widget), la largeur d'un élément de premier niveau est refusée", async () => {
    const d = draft();
    d.sections[0].children[1].props.text = "Titre modifié";
    d.sections[0].children[0].styles.desktop.backgroundColor = "#eeeeee";
    d.sections[0].children[0].children.push({ type: "text", props: { html: "<p>Ajouté</p>" } });
    let r = await put(d);
    assert.equal(r.status, 200, r.text.slice(0, 200));
    const d2 = draft();
    d2.sections[0].children[1].styles = { desktop: { width: "300px" } };
    r = await put(d2);
    assert.equal(r.status, 422); assert.match(JSON.parse(r.text).error.message, /Format verrouillé/);
    assert.equal((draft().sections[0].children[1].styles || {}).desktop, undefined, "rien n'a été écrit");
  });

  test("vues responsive : tablette et téléphone changent la largeur du canevas, le contenu reste affiché, sans erreur", async () => {
    await open();
    const w = (n) => page.evaluate(() => document.querySelector("[data-pb-frame-wrap]").getBoundingClientRect().width);
    const desk = await w();
    for (const dev of ["tablet", "mobile"]) {
      await page.locator(`[data-device="${dev}"]`).first().click();
      await until(async () => (await page.locator("[data-pb-frame-wrap]").getAttribute("data-device")) === dev, { what: dev });
      await wait(300);
      const now = await w();
      assert.ok(now < desk, `${dev} : ${now} < ${desk}`);
      assert.equal(await inFrame((d) => d.querySelectorAll("[data-node-id]").length >= 4), true, `${dev} : contenu présent`);
    }
    await page.locator('[data-device="desktop"]').first().click();
  });

  test("erreur d'enregistrement : l'éditeur garde le contenu, rien n'est perdu côté serveur, aucune erreur de script", async () => {
    await open();
    const before = JSON.stringify(draft().sections);
    await page.route("**/brouillon", (route) => route.request().method() === "PUT" ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "panne simulée" } }) }) : route.continue());
    await page.locator('[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await inFrame((d) => d.querySelector('[data-node-id="head00000001"]') === null)), { what: "titre supprimé dans l'éditeur" });
    await wait(2500);
    assert.equal(JSON.stringify(draft().sections), before, "serveur inchangé");
    assert.equal(await inFrame((d) => d.querySelector('[data-node-id="flex00000001"]') !== null), true, "le reste du contenu est intact");
    await page.unroute("**/brouillon");
    await page.keyboard.press("Control+z");
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
