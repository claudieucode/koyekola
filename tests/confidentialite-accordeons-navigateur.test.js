// CONFIDENTIALITÉ → Guide de politique : accordéons en vrai Chrome (ouverture/fermeture rapides, ARIA, clavier, clics rapides successifs, mouvement réduit).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { launch, SKIP } = require("./helpers-chrome-cdp");

describe("Guide de confidentialité : accordéons (navigateur)", { skip: SKIP }, () => {
  let srv, boss, chrome, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    site = Number(String((await boss.post("/marketing/site-web/sites", { name: "Accordéons" })).location).match(/sites\/(\d+)/)[1]);
    chrome = await launch();
  });
  after(async () => { if (chrome) await chrome.close(); await srv.stop(); });
  const open = async (reduced) => {
    const page = await chrome.newPage({ width: 1440, height: 900, cookies: [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })) });
    if (reduced) await page.emulateMedia([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(`${srv.base}/marketing/site-web/parametres/confidentialite?site=${site}`);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".mk-pv-tab")].find((x) => /Guide/.test(x.textContent)); if (t) t.click(); });
    await page.waitFor(() => [...document.querySelectorAll("[data-pv-acc-btn]")].some((b) => b.offsetParent), "accordéons visibles");
    return page;
  };
  test("ARIA, ouverture et fermeture fluides, clics rapides successifs, clavier", async () => {
    const page = await open(false);
    const r = await page.evaluate(async () => {
      const wait = (ms) => new Promise((x) => setTimeout(x, ms));
      const btns = [...document.querySelectorAll("[data-pv-acc-btn]")].filter((b) => b.offsetParent);
      const out = { n: btns.length, aria: true, settle: [], maxFrame: 0, closedHidden: true, openOk: true, closeOk: true };
      for (const b of btns) { const p = document.getElementById(b.getAttribute("aria-controls")); if (!p || p.getAttribute("role") !== "region" || p.getAttribute("aria-labelledby") !== b.id) out.aria = false; if (getComputedStyle(p).visibility !== "hidden") out.closedHidden = false; }
      for (const b of btns.slice(0, 4)) {
        const p = document.getElementById(b.getAttribute("aria-controls")), inner = p.firstElementChild; let last = performance.now(); const t0 = last; let h0 = -1, since = t0;
        b.click();
        await new Promise((res) => { const tick = (n) => { out.maxFrame = Math.max(out.maxFrame, n - last); last = n; const h = Math.round(inner.getBoundingClientRect().height); if (h !== h0) { h0 = h; since = n; } if (n - since > 80 || n - t0 > 1500) { out.settle.push(Math.round(since - t0)); res(); } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
        if (!(b.getAttribute("aria-expanded") === "true" && getComputedStyle(p).visibility === "visible" && inner.getBoundingClientRect().height > 20)) out.openOk = false;
        b.click(); await wait(300);
        if (!(b.getAttribute("aria-expanded") === "false" && getComputedStyle(p).visibility === "hidden")) out.closeOk = false;
      }
      // ouvertures / fermetures très rapides (pendant l'animation) : l'état final reste cohérent
      const b = btns[0]; for (let i = 0; i < 7; i++) { b.click(); await wait(30); } await wait(400);
      const p = document.getElementById(b.getAttribute("aria-controls"));
      out.rapidCoherent = (b.getAttribute("aria-expanded") === "true") === (getComputedStyle(p).visibility === "visible");
      return out;
    });
    console.log("ACCORDEONS", JSON.stringify(r));
    assert.ok(r.n >= 8, "8 accordéons"); assert.ok(r.aria, "aria-controls / region / labelledby"); assert.ok(r.closedHidden, "fermés = masqués");
    assert.ok(r.openOk && r.closeOk, "états ouvert / fermé"); assert.ok(r.rapidCoherent, "clics rapides cohérents");
    assert.ok(Math.max(...r.settle) <= 450, `ouverture trop lente : ${r.settle}`);
    const k = await page.evaluate(() => { const b = [...document.querySelectorAll("[data-pv-acc-btn]")].filter((x) => x.offsetParent && x.getAttribute("aria-expanded") === "false")[0]; b.focus(); return b.id; });
    await page.pressActivation("Enter"); await page.waitFor((id) => document.getElementById(id).getAttribute("aria-expanded") === "true", "ouvert au clavier", 5000, k);
    await page.pressActivation("Enter"); await page.waitFor((id) => document.getElementById(id).getAttribute("aria-expanded") === "false", "fermé au clavier", 5000, k);
    assert.deepEqual(page.errors, []);
  });
  test("mouvement réduit : aucune transition", async () => {
    const page = await open(true);
    const d = await page.evaluate(() => getComputedStyle(document.querySelector(".mk-pv-acc-panel")).transitionDuration);
    assert.match(d, /^0s(, 0s)*$/);
  });
});
