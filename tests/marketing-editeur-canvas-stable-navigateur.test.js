// Stabilité de l'éditeur d'e-mails dans un VRAI Chrome (barres de défilement visibles, comme sur un Mac réglé sur « toujours ») :
// modifier une propriété ne doit déplacer ni le canevas (défilement, zoom, largeur, position du bloc), ni l'inspecteur (défilement, focus).
// Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("éditeur d'e-mails : stabilité du canevas et de l'inspecteur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const open = async (blocks = 0, kind = "heading", viewport = { width: 1500, height: 700 }) => {
    if (context) await context.close();
    const id = Number((await boss.post("/marketing/modeles", { name: `Stable ${Date.now()}`, starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    context = await browser.newContext({ viewport });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.querySelectorAll("[data-mk-block]").length > 0; }), "canevas prêt");
    for (let i = 0; i < blocks; i++) await page.click(`[data-add="${kind}"]`);
    await until(() => page.evaluate((n) => document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]").length >= n, blocks + 1), "blocs rendus");
    await wait(800);
  };
  const selectRow = async (i) => { await page.evaluate((n) => document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]")[n].click(), i); await until(() => page.evaluate(() => !!document.querySelector("#mk-props .mk-ptab")), "réglages ouverts"); };
  const openTab = async (n) => { await page.locator("#mk-props [role=tab]").nth(n).click(); await wait(300); };
  // Chaque rechargement du canevas crée un NOUVEAU document : on compte les documents distincts vus dans l'iframe (plus fiable que l'événement load)
  const loads = () => page.evaluate(() => { const d = document.getElementById("mk-frame").contentDocument; if (d && d !== window.__lastDoc) { window.__lastDoc = d; window.__loads++; } return window.__loads; });
  const countLoads = () => page.evaluate(() => { window.__loads = 0; window.__lastDoc = document.getElementById("mk-frame").contentDocument; });
  const renderedSize = (v) => page.evaluate((px) => { const e = document.getElementById("mk-frame").contentDocument.querySelector("[data-mk-selected] a"); return !!e && getComputedStyle(e).fontSize === px + "px"; }, v);
  // Un bouton sans adresse s'affiche comme un bloc « à compléter » : on lui donne d'abord une adresse pour qu'il soit rendu comme dans un vrai e-mail
  const giveUrl = async () => { const f = page.locator("#mk-props [id$='-url']").first(); await f.fill("https://exemple.fr"); await f.press("Tab"); await until(() => page.evaluate(() => !document.getElementById("mk-frame").contentDocument.querySelector("[data-mk-selected][data-mk-error]")), "bouton rendu"); await wait(300); };
  const edit = async (suffix, value) => { const f = page.locator(`#mk-props [id$='-${suffix}']`).first(); await f.fill(value); await f.press("Tab"); };
  const uncheckShared = async () => { const sm = page.locator("#mk-props [id$='-samestyles']").first(); if (await sm.count() && await sm.isChecked()) await sm.uncheck(); await wait(300); };
  const canvasState = () => page.evaluate(() => { const c = document.getElementById("mk-canvas"), f = document.getElementById("mk-frame"); const sel = f.contentDocument.querySelector("[data-mk-selected]"); const z = parseFloat(f.style.zoom) || 1; return { cs: c.scrollTop, cl: c.scrollLeft, cw: c.clientWidth, zoom: f.style.zoom, left: Math.round(f.getBoundingClientRect().left), selTop: sel ? Math.round(f.getBoundingClientRect().top + sel.getBoundingClientRect().top * z - c.getBoundingClientRect().top) : null /* position dans le canevas (indépendante d'un éventuel défilement de la page par l'outil de test) */ }; });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true, ignoreDefaultArgs: ["--hide-scrollbars"] });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le contenu qui grandit jusqu'à faire apparaître la barre de défilement ne change ni le zoom, ni la largeur, ni la position de l'e-mail", async () => {
    await open(0, "heading", { width: 1500, height: 1100 });
    const before = await canvasState();
    assert.equal(await page.evaluate(() => { const c = document.getElementById("mk-canvas"); return c.scrollHeight > c.clientHeight; }), false, "départ : pas de barre de défilement");
    for (let i = 0; i < 8; i++) { await page.click('[data-add="heading"]'); await wait(150); }
    await until(() => page.evaluate(() => { const c = document.getElementById("mk-canvas"); return c.scrollHeight > c.clientHeight; }), "la barre de défilement apparaît");
    await wait(900);
    const after = await canvasState();
    const gutter = await page.evaluate(() => getComputedStyle(document.getElementById("mk-canvas")).scrollbarGutter);
    assert.equal(after.zoom, before.zoom, "le zoom ne change pas");
    assert.equal(after.cw, before.cw, "la largeur du canevas ne change pas");
    assert.equal(after.left, before.left, "l'e-mail ne se décale pas horizontalement");
    assert.match(gutter, /stable/);
  });

  test("changer une propriété du bloc sélectionné dans un long e-mail : défilement, zoom et position du bloc restent identiques", async () => {
    await open(30, "button");
    await page.evaluate(() => { document.getElementById("mk-canvas").scrollTop = 900; }); await wait(300);
    // bloc visible au milieu de la vue
    const idx = await page.evaluate(() => { const f = document.getElementById("mk-frame"), z = parseFloat(f.style.zoom) || 1, c = document.getElementById("mk-canvas").getBoundingClientRect(); const rows = [...f.contentDocument.querySelectorAll("[data-mk-block]")]; return rows.findIndex((r) => { const t = f.getBoundingClientRect().top + r.getBoundingClientRect().top * z; return t > c.top + 40 && t < c.bottom - 100; }); });
    assert.ok(idx > 0, "un bloc est visible");
    await selectRow(idx); await giveUrl(); await openTab(1); await uncheckShared();
    const before = await canvasState();
    for (const [f, v] of [["fontSize", "22"], ["fontSize", "14"], ["textColor", "#aa2200"], ["fontSize", "24"]]) {
      await edit(f, v);
      if (f === "fontSize") await until(() => renderedSize(v), `rendu mis à jour (${v} px)`); else await until(() => page.evaluate((c) => getComputedStyle(document.getElementById("mk-frame").contentDocument.querySelector("[data-mk-selected] a")).color === c, "rgb(170, 34, 0)"), "couleur rendue");
      await wait(500);
      const s = await canvasState();
      assert.equal(s.cs, before.cs, `défilement du canevas après ${f}=${v}`);
      assert.equal(s.zoom, before.zoom, "zoom");
      assert.ok(Math.abs(s.selTop - before.selTop) <= 2, `position du bloc : ${before.selTop} → ${s.selTop} après ${f}=${v}`);
    }
  });

  test("inspecteur long : un champ qui reconstruit le panneau garde son défilement et son focus", async () => {
    await open(0, "heading");
    await page.click('[data-add="button"]');
    await until(() => page.evaluate(() => document.querySelectorAll("#mk-props .mk-ptab").length === 4), "réglages du bouton");
    await openTab(1);
    // Sections repliables : par défaut seule la première est ouverte ; l'auteur qui veut tout voir utilise « Tout développer »
    await page.click('#mk-props .mk-sec-all:has-text("Tout développer")');
    const scrollable = await page.evaluate(() => { const p = document.getElementById("mk-props"); return p.scrollHeight - p.clientHeight; });
    assert.ok(scrollable > 300, "l'inspecteur défile");
    await page.evaluate(() => { document.getElementById("mk-props").scrollTop = 450; });
    const shape = page.locator('#mk-props button:text-is("Ovale")');
    await shape.scrollIntoViewIfNeeded().catch(() => {});
    const top0 = await page.evaluate(() => document.getElementById("mk-props").scrollTop);
    await shape.click({ force: true });
    await wait(900);
    const after = await page.evaluate(() => { const p = document.getElementById("mk-props"), a = document.activeElement; return { top: p.scrollTop, focus: a ? (a.textContent || a.id).trim() : null }; });
    assert.ok(Math.abs(after.top - top0) <= 2, `défilement de l'inspecteur : ${top0} → ${after.top}`);
    assert.equal(after.focus, "Ovale", "le focus reste sur le bouton utilisé");
  });

  test("annuler / rétablir : le défilement du canevas ne bouge pas", async () => {
    await open(30, "button");
    await page.evaluate(() => { document.getElementById("mk-canvas").scrollTop = 700; }); await wait(300);
    await selectRow(12); await giveUrl(); await openTab(1); await uncheckShared();
    await edit("fontSize", "20"); await until(() => renderedSize("20"), "rendu mis à jour (20 px)");
    const b = await canvasState();
    await page.click("#mk-undo"); await wait(900);
    assert.equal((await canvasState()).cs, b.cs);
    await page.click("#mk-redo"); await wait(900);
    assert.equal((await canvasState()).cs, b.cs);
    assert.deepEqual(errors, []);
  });
});
