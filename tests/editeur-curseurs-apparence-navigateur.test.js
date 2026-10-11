// Apparence des curseurs (polish visuel) dans un VRAI Chrome, thèmes clair et sombre : piste fine, poignée petite, zone cliquable confortable, piste jamais
// blanche, partie active dessinée (--pb-fill) et qui suit la valeur, jetons communs, focus visible. Le comportement (valeur, annulation…) est testé
// par editeur-ecart-curseur-navigateur et controles-numeriques-*.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "rowbox000001", type: "container", styles: { desktop: { display: "flex", gap: "50px", opacity: 0.5 } },
  children: [{ id: "h00000000001", type: "heading", props: { text: "A", level: "3" } }, { id: "h00000000002", type: "heading", props: { text: "B", level: "3" } }] }] }] };

describe("curseurs de l'éditeur : apparence (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page;
  const until = async (fn, what, ms = 10000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(120); } };
  // Chrome ne sait pas lire le style calculé des pseudo-éléments internes d'un curseur : on lit les JETONS (résolus par le navigateur, par thème)
  // et les RÈGLES de la feuille de style qui les emploient ; la hauteur réelle de la zone cliquable est mesurée sur l'élément.
  const look = () => page.evaluate(() => {
    const r = document.querySelector('.pb-style-field[data-prop="gap"] input[type=range]');
    const tok = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
    const rules = [];
    for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch { continue; } for (const x of rs) if (x.selectorText && /pb-nc-range/.test(x.selectorText)) rules.push(x); }
    const rule = (re) => rules.find((x) => re.test(x.selectorText));
    const num = (v) => parseFloat(v);
    return {
      hit: r.getBoundingClientRect().height, track: num(tok("--pb-slider-track-height")), thumb: num(tok("--pb-slider-thumb-size")),
      trackColor: tok("--pb-slider-track-color"), progress: tok("--pb-slider-progress-color"),
      trackBg: (rule(/webkit-slider-runnable-track/) || { style: { background: "" } }).style.background,
      appearance: getComputedStyle(r).appearance, fill: r.style.getPropertyValue("--pb-fill"),
      thumbRule: Boolean(rule(/webkit-slider-thumb/)), focusRule: Boolean(rule(/focus-visible::-webkit-slider-thumb/)), hoverRule: Boolean(rule(/hover::-webkit-slider-thumb/)),
    };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    const id = Number((await boss.post("/marketing/pages", { name: "Curseurs" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1200);
    await page.evaluate(() => document.querySelector('[data-pb-layers] .pb-node[data-id="rowbox000001"] > .pb-row-item').click()); await wait(500);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab], .pb-inspector .pb-tab")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); }); await wait(400);
    if (!(await page.locator('.pb-style-field[data-prop="gap"]').first().isVisible())) await page.locator(".pb-inspector").getByText("Mise en page", { exact: false }).first().click();
    await until(() => page.locator('.pb-style-field[data-prop="gap"] input[type=range]').first().isVisible(), "curseur Écart visible");
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const theme of ["clair", "sombre"]) {
    test(`thème ${theme} : piste fine, poignée petite, zone cliquable confortable, piste non blanche, partie active à la bonne place`, async () => {
      const dark = await page.evaluate(() => document.body.getAttribute("data-palette") === "dark");
      if ((theme === "sombre") !== dark) { await page.locator("[data-pb-theme-toggle]").first().click(); await wait(500); }
      const l = await look();
      assert.equal(l.appearance, "none", "apparence du navigateur retirée");
      assert.ok(l.track >= 3 && l.track <= 5, `piste ${l.track}px`);
      assert.ok(l.thumb >= 10 && l.thumb <= 14, `poignée ${l.thumb}px`);
      assert.ok(l.hit >= 14, `zone cliquable ${l.hit}px`);
      assert.ok(/linear-gradient/.test(l.trackBg) && /--pb-fill/.test(l.trackBg), "partie parcourue dessinée à partir de --pb-fill");
      assert.ok(!/^(#fff|#ffffff|white)$/i.test(l.trackColor) && l.trackColor !== "", `piste jamais blanche : ${l.trackColor}`);
      assert.ok(l.thumbRule && l.focusRule && l.hoverRule, "poignée, survol et focus définis");
      assert.ok(l.fill === "50%", `partie active à 50 % pour 50 sur 0–100 : ${l.fill}`);
    });
  }

  test("la partie active suit la valeur saisie dans le champ ; la valeur hors plage ne change pas", async () => {
    const f = page.locator('.pb-style-field[data-prop="gap"]').first();
    const num = f.locator("input:not([type=range])").first();
    await num.fill("20"); await num.press("Enter");
    await until(async () => (await look()).fill === "20%", "partie active à 20 %");
    await num.fill("300"); await num.press("Enter"); await wait(300);
    assert.equal(await num.inputValue(), "300", "la valeur saisie hors plage est conservée");
    assert.equal((await look()).fill, "100%");
  });

  test("le focus clavier est reconnu (:focus-visible) et l'anneau est défini sans changer la taille de la piste", async () => {
    const r = page.locator('.pb-style-field[data-prop="gap"] input[type=range]').first();
    await r.focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.matches(":focus-visible")), true, "le curseur a le focus clavier visible");
    assert.ok((await look()).focusRule, "anneau de focus défini");
    assert.equal((await look()).track, 4);
  });
});
