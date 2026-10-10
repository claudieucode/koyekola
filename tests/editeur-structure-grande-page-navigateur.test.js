// Panneau Structure sur une grande page (360 éléments) : les lignes hors de la zone visible ne sont pas stylées (content-visibility) SANS rien changer au comportement :
// l'élément sélectionné dans le canevas devient visible dans l'arbre, la navigation clavier et la recherche fonctionnent, et le coût d'ouverture du panneau reste borné
// (28,8 ms de recalcul de style avant, 3,1 ms après ; seuil du test 15 ms pour absorber une machine chargée). Vrai Chrome.
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
const pad = (n, w = 8) => String(n).padStart(w, "0");
const CONTENT = { sections: Array.from({ length: 6 }, (_, s) => ({ id: `sect${pad(s + 1)}`, type: "layout", children: Array.from({ length: 3 }, (_, c) => ({
  id: `cn${pad(s * 3 + c + 1, 10)}`, type: "container", name: `Boîte ${s * 3 + c + 1}`, children: Array.from({ length: 19 }, (_, k) => ({ id: `hd${pad((s * 3 + c) * 19 + k + 1, 10)}`, type: "heading", props: { text: `Titre numéro ${(s * 3 + c) * 19 + k + 1}`, level: "3" } })) })) })) };

describe("Structure sur une grande page (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, cdp, pageId;
  const until = async (fn, what, ms = 10000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(80); } };
  const rows = () => page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node[data-id]").length);
  const visibleInTree = (id) => page.evaluate((id) => { const r = document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`); const t = document.querySelector("[data-pb-layers]").getBoundingClientRect(); if (!r) return false; const b = r.getBoundingClientRect(); return b.height > 10 && b.top >= t.top - 1 && b.bottom <= t.bottom + 1; }, id);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); cdp = await context.newCDPSession(page); await cdp.send("Performance.enable");
    pageId = Number((await boss.post("/marketing/pages", { name: "Grande page" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 60000 });
    await wait(1500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("l'arbre contient toutes les lignes et les lignes sont contenues (content-visibility auto, 30 px estimés)", async () => {
    assert.ok((await rows()) >= 350, `lignes : ${await rows()}`);
    const cs = await page.evaluate(() => { const n = document.querySelector("[data-pb-layers] .pb-node"); const c = getComputedStyle(n); return { cv: c.contentVisibility, size: c.containIntrinsicSize }; });
    assert.equal(cs.cv, "auto"); assert.match(cs.size, /30px/);
  });

  test("un élément sélectionné dans le canevas, très bas dans la page, devient visible et sélectionné dans l'arbre", async () => {
    const id = `hd${pad(300, 10)}`;
    await page.frameLocator("[data-pb-frame]").locator(`[data-node-id="${id}"]`).click({ position: { x: 6, y: 4 } }); // Playwright tient compte du zoom de la page
    await until(async () => (await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"]`).getAttribute("aria-selected")) === "true", "ligne sélectionnée");
    await until(() => visibleInTree(id), "ligne visible dans la zone de l'arbre");
  });

  test("navigation clavier dans l'arbre (flèches) et recherche : comportement inchangé", async () => {
    const id = `hd${pad(300, 10)}`;
    await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).focus();
    await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown");
    const focused = await page.evaluate(() => document.activeElement.closest(".pb-node") && document.activeElement.closest(".pb-node").getAttribute("data-id"));
    assert.equal(focused, `hd${pad(302, 10)}`, "deux lignes plus bas");
    const q = page.locator("[data-pb-layers-q]"); await q.fill("numéro 250");
    await until(async () => (await rows()) < 20, "filtre appliqué");
    assert.ok((await page.locator(`[data-pb-layers] .pb-node[data-id="hd${pad(250, 10)}"]`).count()) === 1, "l'élément cherché est là");
    await q.fill(""); await until(async () => (await rows()) >= 350, "toutes les lignes reviennent");
  });

  test("ouvrir / fermer le panneau : recalcul de style borné (≤ 15 ms par basculement, 28,8 ms avant l'optimisation)", async () => {
    const m = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
    const per = [];
    for (let r = 0; r < 3; r++) { const m0 = await m(); for (let i = 0; i < 6; i++) { await page.locator("[data-pb-layers-open]").first().click(); await wait(150); } const m1 = await m(); per.push((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000 / 6); }
    per.sort((a, b) => a - b);
    assert.ok(per[1] <= 15, `recalcul de style par basculement : ${per[1].toFixed(1)} ms`);
    if (await page.locator("[data-pb-layers]").evaluate((e) => e.closest(".is-closed") !== null || e.classList.contains("is-closed"))) await page.locator("[data-pb-layers-open]").first().click();
  });
});
