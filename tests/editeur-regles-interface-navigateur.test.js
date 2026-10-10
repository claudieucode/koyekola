// Éditeur de pages — « Règles et magnétisme » : INTERFACE (vrai Chrome). Cases compactes (16 px, ligne entière cliquable), champs de 30 px,
// couleurs lues dans les jetons de l'éditeur (clair, sombre, couleur d'accent personnalisée avec texte lisible dessus), en-tête fixe avec X,
// zone de sécurité en grille, ligne « nouveau guide » alignée, bouton destructif discret, aucun débordement de 390 à 1440 px — et mêmes réglages qu'avant.
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
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe("Règles et magnétisme : interface (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId;
  const open = async (viewport = { width: 1440, height: 900 }) => {
    const ctx = await browser.newContext({ viewport });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }, null, { timeout: 30000 });
    await wait(500);
    await page.evaluate(() => window.pbRules.open());
    await wait(300);
    return { ctx, page, errors };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    pageId = Number((await boss.post("/marketing/pages", { name: "Règles UI" })).location.match(/(\d+)$/)[1]);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("cases de 16 px avec ligne cliquable de 30 px ; champs de 30 px ; en-tête fixe avec X ; aucune coupure", async () => {
    const { ctx, page, errors } = await open();
    const m = await page.evaluate(() => {
      const d = document.querySelector("[data-pb-rules]"), r = (e) => e.getBoundingClientRect();
      const cb = d.querySelector(".pb-rules-sec .pb-check input"), row = cb.closest("label");
      const field = d.querySelector(".pb-field input[type=number]"), sel = d.querySelector(".pb-field select");
      const sections = [...d.querySelectorAll(".pb-rules-sec h3")].map((h) => h.textContent);
      return { cb: [r(cb).width, r(cb).height], rowH: r(row).height, rowW: r(row).width, bodyW: r(d.querySelector(".pb-rules-body")).width, field: r(field).height, sel: r(sel).height, dlgW: r(d).width, dlgH: r(d).height, vh: innerHeight, sections, overflowX: d.querySelector(".pb-rules-body").scrollWidth > d.querySelector(".pb-rules-body").clientWidth, head: r(d.querySelector(".pb-modal-head")).height, x: r(d.querySelector("[data-pb-close]")), headR: r(d.querySelector(".pb-modal-head")).right, xLabel: d.querySelector("[data-pb-close]").getAttribute("aria-label"), xIcon: Boolean(d.querySelector("[data-pb-close] svg")), cbAppearance: getComputedStyle(cb).appearance };
    });
    assert.deepEqual(m.cb, [16, 16]);
    assert.ok(m.rowH >= 30 && m.rowW > 300, `ligne cliquable ${m.rowW}×${m.rowH}`);
    assert.equal(m.field, 30); assert.equal(m.sel, 30);
    assert.ok(m.head <= 44 && m.x.right <= m.headR && m.xIcon && /Fermer/.test(m.xLabel), "en-tête compact avec X en icône");
    assert.ok(!m.overflowX && m.dlgH <= m.vh, "ni débordement, ni dépassement de l'écran");
    assert.deepEqual(m.sections.map((s) => s.toLowerCase()), ["affichage", "magnétisme", "unités", "guides", "grille", "précision", "raccourcis"], "mêmes sections, même ordre");
    // cliquer sur le TEXTE de la ligne coche la case (zone interactive > case visuelle)
    const before = await page.evaluate(() => window.pbRules.state().aids.rulers);
    await page.locator(".pb-rules-sec .pb-check").first().click({ position: { x: 150, y: 10 } }); await wait(100);
    assert.notEqual(await page.evaluate(() => window.pbRules.state().aids.rulers), before);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("jetons : fond / texte suivent le thème clair puis sombre ; la couleur d'accent personnalisée colore la case cochée, texte coché lisible", async () => {
    const { ctx, page } = await open();
    const read = () => page.evaluate(() => { const d = document.querySelector("[data-pb-rules]"), cs = (e, p) => getComputedStyle(e)[p], rgb = (v) => v.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); const cb = d.querySelector(".pb-rules-sec .pb-check input:checked") || d.querySelector(".pb-rules-sec .pb-check input"); return { bg: rgb(cs(d, "backgroundColor")), fg: rgb(cs(d.querySelector(".pb-check"), "color")), input: rgb(cs(d.querySelector(".pb-field select"), "backgroundColor")), inputFg: rgb(cs(d.querySelector(".pb-field select"), "color")), cbBg: rgb(cs(cb, "backgroundColor")), tick: rgb(getComputedStyle(cb, "::after").borderRightColor) }; });
    await page.evaluate(() => document.querySelector(".pb-body").setAttribute("data-palette", "light")); await wait(200);
    const light = await read();
    assert.ok(lum(light.bg) > 0.7 && ratio(light.fg, light.bg) >= 7, JSON.stringify(light));
    await page.evaluate(() => document.querySelector(".pb-body").setAttribute("data-palette", "dark")); await wait(200);
    const dark = await read();
    assert.ok(lum(dark.bg) < 0.1 && ratio(dark.fg, dark.bg) >= 7 && ratio(dark.inputFg, dark.input) >= 7, JSON.stringify(dark));
    // couleurs d'accent : la case cochée prend l'accent, la coche reste lisible dessus (clair ou foncé)
    await page.evaluate(() => { const i = document.querySelector("[data-pb-rules] .pb-rules-sec .pb-check input"); if (!i.checked) i.click(); });
    for (const accent of ["#f5d90a", "#c2410c", "#6d28d9", "#0e8a4f"]) {
      await page.evaluate((a) => { const t = window.KWTheme.derive({ accent: a, panel: getComputedStyle(document.querySelector(".pb-body")).getPropertyValue("--editor-panel").trim() }).tokens; Object.keys(t).forEach((k) => document.querySelector(".pb-body").style.setProperty(k, t[k])); }, accent); await wait(450);
      const r = await read();
      assert.ok(ratio(r.tick, r.cbBg) >= 3, `${accent} : coche lisible (${ratio(r.tick, r.cbBg).toFixed(1)})`);
    }
    await ctx.close();
  });

  test("zone de sécurité en grille 2×2 alignée ; « nouveau guide » aligné ; bouton de suppression discret et désactivé sans guide ; guides = icône de suppression", async () => {
    const { ctx, page } = await open();
    const g = await page.evaluate(() => {
      const d = document.querySelector("[data-pb-rules]"), r = (e) => e.getBoundingClientRect();
      const labels = ["Haut", "Bas", "Gauche", "Droite"].map((t) => [...d.querySelectorAll(".pb-field > label")].find((l) => l.textContent === t)).map((l) => r(l.closest(".pb-field")));
      const add = d.querySelector(".pb-rules-add"), kids = [...add.children].map(r);
      const clear = d.querySelector("[data-rules-clear]");
      return { rows: [Math.round(labels[0].top) === Math.round(labels[1].top), Math.round(labels[2].top) === Math.round(labels[3].top), labels[2].top > labels[0].top, Math.round(labels[0].left) === Math.round(labels[2].left)], addTops: kids.map((k) => Math.round(k.bottom)), clearH: r(clear).height, clearDisabled: clear.disabled, clearColor: getComputedStyle(clear).color, addH: kids.map((k) => k.height) };
    });
    assert.deepEqual(g.rows, [true, true, true, true]);
    assert.ok(new Set(g.addTops).size === 1, `les trois contrôles de la ligne partagent le même bord bas (${g.addTops})`);
    assert.ok(g.clearH <= 30 && g.clearDisabled, `bouton compact (${g.clearH}) et désactivé sans guide`);
    await page.locator('[data-pb-rules] .pb-rules-add input[type=text]').fill("320"); await page.keyboard.press("Enter"); await wait(200);
    const after = await page.evaluate(() => ({ rows: document.querySelectorAll("[data-pb-rules] .pb-guide-row").length, icon: Boolean(document.querySelector("[data-pb-rules] .pb-guide-row .pb-icon-btn svg")), clearDisabled: document.querySelector("[data-rules-clear]").disabled, v: window.pbRules.state().guides.v.slice() }));
    assert.deepEqual([after.rows, after.icon, after.clearDisabled, after.v], [1, true, false, [320]]);
    await page.locator("[data-pb-rules] .pb-guide-row .pb-icon-btn").click(); await wait(150);
    assert.deepEqual(await page.evaluate(() => window.pbRules.state().guides.v), []);
    await ctx.close();
  });

  test("tailles : 1280, 1440, tablette et mobile — pas de débordement horizontal, X accessible, contenu qui défile dans la fenêtre", async () => {
    for (const vp of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 820, height: 1100 }, { width: 390, height: 700 }]) {
      const { ctx, page } = await open(vp);
      const m = await page.evaluate(() => { const d = document.querySelector("[data-pb-rules]"), r = d.getBoundingClientRect(), b = d.querySelector(".pb-rules-body"), x = d.querySelector("[data-pb-close]").getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: innerWidth, h: innerHeight, over: b.scrollWidth > b.clientWidth + 1, scrolls: b.scrollHeight > b.clientHeight, xIn: x.right <= r.right && x.left >= r.left && x.top >= r.top, inputsIn: [...d.querySelectorAll("input, select, button")].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= r.right + 0.5) }; });
      assert.ok(m.l >= 0 && m.r <= m.w && m.t >= 0 && m.b <= m.h && !m.over && m.xIn && m.inputsIn, `${vp.width}×${vp.height} : ${JSON.stringify(m)}`);
      if (vp.height <= 720) assert.ok(m.scrolls, "le contenu défile dans la fenêtre");
      await page.keyboard.press("Escape"); await wait(100);
      assert.equal(await page.evaluate(() => document.querySelector("[data-pb-rules]").open), false, "Échap ferme");
      await ctx.close();
    }
  });
});
