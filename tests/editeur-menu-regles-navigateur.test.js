// Menu rapide « Règles, guides et magnétisme » (design) dans un VRAI Chrome : surface et couleurs issues des jetons de l'éditeur (clair, sombre, accents variés),
// contraste lisible, coche posée sur l'accent lisible, ligne entière cliquable, clavier, Échap / clic extérieur, « Paramètres… » avec icône (plus d'emoji),
// infobulle du bouton masquée menu ouvert, position dans la fenêtre. Le comportement des réglages est couvert par editeur-regles-magnetisme-navigateur (T17).
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "h00000000001", type: "heading", props: { text: "A", level: "3" } }] }] };

// contraste WCAG entre deux couleurs « rgb(r, g, b) » ou « rgba(…) » (le fond translucide est composé sur le panneau)
const LUM = (c) => { const v = (c.match(/[\d.]+/g) || []).slice(0, 3).map((x) => { x = Number(x) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const CR = (a, b) => { const [x, y] = [LUM(a), LUM(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe("menu rapide Règles / guides / magnétisme : design (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors;
  const btn = () => page.locator("[data-pb-rules-menu]");
  const pop = () => page.locator(".pb-rules-pop");
  const until = async (fn, what, ms = 6000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(60); } };
  const openPop = async () => { if (await pop().isHidden()) { await btn().click(); await until(() => pop().isVisible(), "menu ouvert"); await wait(200); } };
  const closePop = async () => { if (await pop().isVisible()) { await page.keyboard.press("Escape"); await until(() => pop().isHidden(), "menu fermé"); } };
  const theme = async (want) => { const dark = await page.evaluate(() => document.body.getAttribute("data-palette") === "dark"); if ((want === "sombre") !== dark) { await page.locator("[data-pb-theme-toggle]").first().click(); await wait(400); } };
  const accent = (c) => page.evaluate((c) => { if (c) document.body.style.setProperty("--editor-accent", c); else document.body.style.removeProperty("--editor-accent"); }, c);
  const read = () => page.evaluate(() => {
    // le navigateur peut renvoyer oklch(...) : on le ramène en rgb(...) en le peignant sur un pixel
    const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
    const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})`; };
    const p = document.querySelector(".pb-rules-pop"), cs = getComputedStyle(p);
    const row = [...p.querySelectorAll(".pb-pop-row")].find((r) => r.querySelector("input").checked), inp = row.querySelector("input"), ics = getComputedStyle(inp), after = getComputedStyle(inp, "::after");
    const off = [...p.querySelectorAll(".pb-pop-row")].find((r) => !r.querySelector("input").checked);
    return { bg: rgb(cs.backgroundColor), text: rgb(getComputedStyle(row).color), rowBg: rgb(getComputedStyle(row).backgroundColor), boxBg: rgb(ics.backgroundColor), tick: rgb(after.borderRightColor), offText: off ? rgb(getComputedStyle(off).color) : null, radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.borderTopColor };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = Number((await boss.post("/marketing/pages", { name: "Menu règles" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("structure : deux groupes, 5 lignes, « Paramètres… » avec icône et chevron, aucun emoji", async () => {
    await openPop();
    assert.deepEqual(await page.locator(".pb-rules-pop .pb-pop-title").allTextContents(), ["Affichage", "Alignement"]);
    assert.deepEqual((await page.locator(".pb-rules-pop .pb-pop-row").allTextContents()).map((t) => t.trim()), ["Règles", "Guides", "Grille", "Magnétisme", "Guides intelligents"]);
    const more = pop().locator(".pb-pop-more");
    assert.equal((await more.textContent()).trim(), "Paramètres…", "pas de caractère ⚙");
    assert.equal(await more.locator("svg").count(), 2, "icône + chevron (icônes du projet)");
    const r = await pop().boundingBox(); assert.ok(r.width <= 250 && r.height <= 320, `compact (${r.width} × ${r.height})`);
    assert.ok(r.x >= 0 && r.x + r.width <= 1500 && r.y >= 0 && r.y + r.height <= 900, "dans la fenêtre");
    await closePop();
  });

  for (const th of ["clair", "sombre"]) for (const [name, col] of [["accent du thème", null], ["accent violet", "#7c3aed"], ["accent très clair", "#ffe08a"], ["accent très foncé", "#0b1f3a"]]) {
    test(`thème ${th}, ${name} : surface issue des jetons, texte ≥ 4,5:1, coche lisible sur l'accent (≥ 3:1)`, async () => {
      await closePop(); await theme(th); await accent(col); await openPop();
      const v = await read();
      const panel = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--editor-panel").trim());
      assert.ok(v.bg !== "rgb(255, 255, 255)" || th === "clair", "pas de fond blanc en thème sombre");
      assert.ok(CR(v.text, v.bg) >= 4.5, `texte ${v.text} sur ${v.bg} : ${CR(v.text, v.bg).toFixed(2)}`);
      assert.ok(CR(v.offText, v.bg) >= 4.5, "ligne inactive lisible");
      assert.ok(CR(v.tick, v.boxBg) >= 3, `coche ${v.tick} sur ${v.boxBg} : ${CR(v.tick, v.boxBg).toFixed(2)}`);
      assert.equal(th === "sombre", LUM(v.bg) < 0.1, `surface ${v.bg} (jeton --editor-panel ${panel})`);
      assert.ok(v.shadow !== "none" && v.border !== "rgba(0, 0, 0, 0)", "ombre et bordure présentes");
      await accent(null); await closePop();
    });
  }

  test("la ligne entière est cliquable ; réglages réellement changés ; clavier (Tab, Espace) ; Échap ; clic extérieur", async () => {
    await theme("clair"); await openPop();
    const row = pop().locator(".pb-pop-row", { hasText: "Grille" }); const inp = row.locator("input");
    const before = await inp.isChecked();
    const b = await row.boundingBox(); await page.mouse.click(b.x + b.width - 6, b.y + b.height / 2); // en bout de ligne, loin de la case
    assert.equal(await inp.isChecked(), !before, "clic sur la ligne = bascule");
    assert.equal(await page.evaluate(() => !!document.querySelector("[data-pb-frame]").contentDocument.querySelector(".pb-grid-overlay")) , !before, "la grille du canevas suit");
    await page.mouse.click(b.x + b.width - 6, b.y + b.height / 2);
    await inp.focus(); await page.keyboard.press("Space"); assert.equal(await inp.isChecked(), !before, "Espace bascule");
    await page.keyboard.press("Space");
    await page.keyboard.press("Escape"); await until(() => pop().isHidden(), "Échap ferme");
    await openPop(); await page.mouse.click(1400, 700); await until(() => pop().isHidden(), "clic extérieur ferme"); // hors du canevas (l'iframe ne transmet pas ses clics)
  });

  test("« Paramètres… » ouvre le panneau complet ; l'infobulle du bouton ne reste pas affichée menu ouvert", async () => {
    await page.mouse.move(5, 500); await wait(100);
    const bb = await btn().boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await until(() => page.evaluate(() => !document.getElementById("pb-tip").hidden), "infobulle visible", 2000);
    assert.ok(((await page.locator("#pb-tip").textContent()) || "").length < 40, "infobulle courte");
    await btn().click(); await until(() => pop().isVisible(), "menu ouvert");
    await page.mouse.move(bb.x + bb.width / 2 + 2, bb.y + bb.height / 2 + 1); await wait(600);
    assert.equal(await page.evaluate(() => document.getElementById("pb-tip").hidden), true, "pas d'infobulle au-dessus du menu");
    await pop().locator(".pb-pop-more").click();
    assert.equal(await page.locator("[data-pb-rules]").evaluate((d) => d.open), true, "panneau Paramètres ouvert");
    await page.locator("[data-pb-rules] [data-pb-close]").click();
  });

  test("fenêtre étroite : le menu reste entièrement visible", async () => {
    for (const w of [900, 600, 420]) {
      await page.setViewportSize({ width: w, height: 800 }); await wait(250);
      await closePop(); await btn().click(); await until(() => pop().isVisible(), "menu ouvert");
      const r = await pop().boundingBox();
      assert.ok(r.x >= 0 && r.x + r.width <= w + 0.5 && r.y >= 0 && r.y + r.height <= 800, `visible à ${w} px (${Math.round(r.x)}–${Math.round(r.x + r.width)})`);
      await closePop();
    }
    await page.setViewportSize({ width: 1500, height: 900 });
  });

  test("aucune erreur JavaScript", () => assert.deepEqual(errors, []));
});
