// Stabilité de l'éditeur de pages dans un VRAI Chrome (barres de défilement visibles, vrais clics) : sélectionner / modifier un élément ne
// décale ni la barre du haut, ni les panneaux, ni le canevas ; le défilement du canevas survit au passage en mode Structure ;
// valider une valeur dans l'inspecteur ne déplace rien. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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
const kid = (id, type, props) => ({ id, type, props });
const N = (i) => String(i).padStart(10, "0");
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  ...Array.from({ length: 30 }, (_, i) => ({ id: `bx${N(i)}`, type: "container", props: {}, children: [kid(`ht${N(i)}`, "heading", { text: `Titre ${i}`, level: "3" }), kid(`tx${N(i)}`, "text", { html: `<p>Un paragraphe ${i} assez long pour prendre de la place sur la page et faire défiler.</p>` }), kid(`bt${N(i)}`, "button", { label: `Bouton ${i}`, url: "/x" })] })),
  kid("im0000000001", "image", { src: "https://exemple.fr/p.jpg", alt: "Photo" }), kid("sp0000000001", "spacer", { height: 20 })] }] };

describe("éditeur de pages : stabilité de l'interface (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 40000 });
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const geo = () => page.evaluate(() => { const g = (s) => { const q = document.querySelector(s).getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)].join(","); }; const f = document.querySelector("[data-pb-frame]"); return { header: g("header.pb-top"), left: g("[data-pb-left]"), right: g("[data-pb-right]"), stage: g("[data-pb-stage]"), frame: g("[data-pb-frame]"), fy: Math.round(f.contentWindow.scrollY), zoom: document.querySelector("[data-pb-zoom-value]").textContent }; });
  const selTop = (nid) => page.evaluate((nid) => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector(`[data-node-id="${nid}"]`); const z = parseFloat(getComputedStyle(f).zoom) || 1; return e ? Math.round(f.getBoundingClientRect().top + e.getBoundingClientRect().top * z) : null; }, nid);
  const selectTree = (nid) => page.evaluate((nid) => { const r = document.querySelector(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`); r.scrollIntoView({ block: "center" }); r.click(); }, nid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true, ignoreDefaultArgs: ["--hide-scrollbars"] });
    context = await browser.newContext({ viewport: { width: 1500, height: 850 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = Number((await boss.post("/marketing/pages", { name: "Stabilité" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready(); await wait(2500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("sélectionner des éléments de types différents ne décale ni la barre du haut, ni les panneaux, ni le canevas", async () => {
    await page.keyboard.press("Escape"); await wait(300);
    const base = await geo();
    for (const nid of ["bx" + N(3), "ht" + N(3), "tx" + N(3), "bt" + N(3), "im0000000001", "sp0000000001", "sect00000001"]) {
      await selectTree(nid); await wait(450);
      const g = await geo();
      for (const k of ["header", "left", "right", "stage"]) assert.equal(g[k], base[k], `${k} bouge à la sélection de ${nid} : ${base[k]} → ${g[k]}`);
    }
  });

  test("passer en mode Structure puis revenir : le canevas retrouve son défilement et l'élément sélectionné sa place", async () => {
    await selectTree("tx" + N(14)); await wait(800);
    const before = await geo(), top = await selTop("tx" + N(14));
    assert.ok(before.fy > 300, "le canevas est défilé");
    await page.locator("[data-pb-mode]").nth(1).click(); await wait(600);
    await page.locator("[data-pb-mode]").nth(0).click(); await wait(900);
    const after = await geo();
    assert.equal(after.fy, before.fy, "défilement du canevas");
    assert.ok(Math.abs((await selTop("tx" + N(14))) - top) <= 2, "position de l'élément");
    assert.equal(after.frame, before.frame);
  });

  test("valider une valeur dans l'inspecteur : ni le canevas, ni les panneaux, ni le zoom ne bougent", async () => {
    await selectTree("ht" + N(14)); await wait(600);
    await page.locator("[data-pb-inspector]").getByRole("tab", { name: "Style" }).click(); await wait(400);
    await page.evaluate(() => { const n = document.querySelector('[data-pb-inspector] [aria-label="Intérieur haut"]'); let d = n.closest("details"); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } });
    const f = page.locator('[data-pb-inspector] [aria-label="Intérieur haut"]').first();
    await f.scrollIntoViewIfNeeded(); await wait(300);
    const before = await geo();
    await f.click(); await f.press("Control+a"); await page.keyboard.type("48"); await page.keyboard.press("Enter");
    await until(() => page.evaluate(() => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="ht0000000014"]'); return e && getComputedStyle(e).paddingTop === "48px"; }), "padding rendu (48 px)");
    await wait(500);
    const after = await geo();
    for (const k of ["header", "left", "right", "stage", "frame", "fy", "zoom"]) assert.equal(after[k], before[k], `${k} : ${before[k]} → ${after[k]}`);
  });

  test("changer d'écran puis revenir à l'ordinateur : même zoom, même place de l'élément sélectionné", async () => {
    await selectTree("tx" + N(14)); await wait(700);
    const before = await geo(), top = await selTop("tx" + N(14));
    await page.locator(".pb-devices button").nth(2).click(); await wait(700);
    await page.locator(".pb-devices button").nth(0).click(); await wait(900);
    const after = await geo();
    assert.equal(after.zoom, before.zoom);
    assert.equal(after.frame, before.frame);
    assert.ok(Math.abs((await selTop("tx" + N(14))) - top) <= 3, "position de l'élément");
    assert.deepEqual(errors, []);
  });
});
