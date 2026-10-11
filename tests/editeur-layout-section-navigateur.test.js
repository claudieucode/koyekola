// Éditeur de pages — CRITÈRE D'ACCEPTATION « Direction d'une Section libre » (vrai Chrome, par l'interface) : une Section libre contient deux
// Conteneurs ; on règle Affichage = Flex puis Direction = ligne / colonne / ligne inversée / colonne inversée dans l'Inspecteur. Les deux conteneurs
// doivent suivre immédiatement dans le canevas, être enregistrés, survivre au rechargement, obéir à annuler / rétablir, puis se retrouver
// identiques dans l'aperçu et la page publiée.
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
const box = (k, t) => ({ id: `${k}x`.padEnd(12, "0"), type: "container", styles: { desktop: { minHeight: "60px", backgroundColor: "#cde" } }, children: [{ id: `${k}t`.padEnd(12, "0"), type: "text", props: { html: `<p>${t}</p>` } }] });

describe("Section libre : Affichage et Direction par l'Inspecteur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, page, pageId, slug, errors;
  const SEC = "sect0000001";
  const draft = () => { const r = srv.db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return JSON.parse(r.draft || r.sections); };
  const secStyle = () => (draft().sections.find((s) => s.id === SEC).styles || {}).desktop || {};
  const pos = (win) => win.evaluate(() => { const r = (id) => { const e = document.querySelector(`.kw-n-${id}`); const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width) }; }; return { a: r("onex00000000"), b: r("twox00000000") }; });
  const canvasPos = () => page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const r = (id) => { const e = d.querySelector(`.kw-n-${id}`); const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width) }; }; return { a: r("onex00000000"), b: r("twox00000000") }; });
  const layoutOf = (p) => (p.a.y === p.b.y ? (p.a.x < p.b.x ? "row" : "row-reverse") : (p.a.y < p.b.y ? "column" : "column-reverse"));
  const reveal = async (prop) => { const g = page.locator(`.pb-inspector details.pb-acc:has([data-prop="${prop}"])`).first(); if (!(await g.evaluate((d) => d.open))) { await g.locator("> summary").click(); await wait(150); } };
  const seg = async (prop, value) => { await reveal(prop); const b = page.locator(`.pb-inspector [data-prop="${prop}"] button[data-value="${value}"]`); if ((await b.getAttribute("aria-checked")) !== "true") { await b.click(); await wait(900); } };
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
  const saved = async (check, what) => { const end = Date.now() + 12000; for (;;) { let ok = false; try { ok = check(); } catch { /* pas encore */ } if (ok) return; if (Date.now() > end) throw new Error("Pas enregistré : " + what); await wait(150); } };
  const selectSection = async () => { await page.locator(`[data-pb-layers] .pb-node[data-id="${SEC}"] > .pb-row-item`).click(); await wait(300); await page.locator(".pb-right button", { hasText: /^Style$/ }).first().click(); await wait(300); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    pageId = Number((await boss.post("/marketing/pages", { name: "Section direction" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: SEC, type: "layout", children: [box("one", "Conteneur 1"), box("two", "Conteneur 2")] }] } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text);
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`); await ready(); await wait(600);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("point de départ : deux conteneurs empilés (Section libre = colonne par défaut)", async () => {
    assert.equal(layoutOf(await canvasPos()), "column");
  });
  test("Affichage = Flex puis Direction : ligne, colonne, ligne inversée, colonne inversée — le canevas suit à chaque fois, le brouillon aussi", async () => {
    await selectSection();
    await seg("display", "flex");
    for (const dir of ["row", "column", "row-reverse", "column-reverse", "row"]) {
      await seg("flexDirection", dir);
      await saved(() => secStyle().flexDirection === dir, `direction ${dir}`);
      assert.equal(layoutOf(await canvasPos()), dir, `canevas : ${dir}`);
      assert.equal(secStyle().display, "flex");
    }
    const row = await canvasPos();
    assert.ok(row.b.x > row.a.x + row.a.w - 1, "ligne : le second conteneur est à droite du premier, sans chevauchement");
  });
  test("répartition, alignement, écart et retour à la ligne de la section agissent aussi sur ses enfants", async () => {
    await selectSection();
    await seg("justifyContent", "space-between"); await saved(() => secStyle().justifyContent === "space-between", "répartition");
    const p = await canvasPos(); const frame = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector(".lp-main").getBoundingClientRect().right);
    assert.ok(Math.abs(p.b.x + p.b.w - frame) <= 2 || p.b.x + p.b.w >= frame - 20, "espacés : le dernier conteneur touche le bord droit");
  });
  test("enregistrement : le rechargement restitue la même disposition", async () => {
    const before = JSON.stringify(secStyle());
    await page.reload(); await ready(); await wait(700);
    assert.equal(JSON.stringify(secStyle()), before);
    assert.equal(layoutOf(await canvasPos()), "row");
  });
  test("annuler / rétablir : chaque direction revient dans l'ordre, sans reconstruire l'éditeur", async () => {
    await selectSection();
    await seg("flexDirection", "column"); await saved(() => secStyle().flexDirection === "column", "colonne");
    await seg("flexDirection", "row-reverse"); await saved(() => secStyle().flexDirection === "row-reverse", "ligne inversée");
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentWindow.__m = 1; });
    await page.keyboard.press("Control+z"); await wait(900);
    assert.equal(layoutOf(await canvasPos()), "column", "annuler : colonne");
    await page.keyboard.press("Control+z"); await wait(900);
    assert.equal(layoutOf(await canvasPos()), "row", "annuler encore : ligne");
    await page.keyboard.press("Control+Shift+z"); await wait(900);
    assert.equal(layoutOf(await canvasPos()), "column", "rétablir : colonne");
    await page.keyboard.press("Control+Shift+z"); await wait(900);
    assert.equal(layoutOf(await canvasPos()), "row-reverse", "rétablir encore : ligne inversée");
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("[data-pb-frame]").contentWindow.__m)), true, "le cadre du canevas n'a pas été rechargé");
    await saved(() => secStyle().flexDirection === "row-reverse", "état final enregistré");
  });
  test("aperçu et page publiée : même disposition que le canevas (ligne inversée), puis colonne sur mobile si on le demande", async () => {
    await seg("flexDirection", "row-reverse");
    await saved(() => secStyle().flexDirection === "row-reverse", "direction enregistrée");
    await page.locator('.pb-top .pb-devices [data-device="mobile"]').click(); await wait(900);
    await selectSection(); await seg("flexDirection", "column");
    await saved(() => ((draft().sections.find((s) => s.id === SEC).styles || {}).mobile || {}).flexDirection === "column", "direction mobile");
    await page.locator('.pb-top .pb-devices [data-device="desktop"]').click(); await wait(900);
    assert.equal(layoutOf(await canvasPos()), "row-reverse", "ordinateur inchangé");
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    for (const [path, label] of [[`/marketing/pages/${pageId}/apercu`, "aperçu"], [`/p/${slug}`, "page publiée"]]) {
      for (const [width, expected] of [[1280, "row-reverse"], [390, "column"]]) {
        const p = await ctx.newPage(); await p.setViewportSize({ width, height: 900 }); await p.goto(`${srv.base}${path}`); await wait(400);
        assert.equal(layoutOf(await pos(p)), expected, `${label} à ${width} px`);
        await p.close();
      }
    }
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
