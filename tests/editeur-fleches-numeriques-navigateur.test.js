// Flèches ▲▼ des champs numériques de l'éditeur de pages (un seul composant : numericControl) dans un VRAI Chrome : toujours visibles (sans survol ni focus),
// contenues dans le champ sans chevaucher la valeur ni l'unité, mêmes dimensions partout, zone cliquable confortable, et valeurs inchangées dans leur logique
// (pas, bornes, négatif, décimales, champ vide). Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "rowbox000001", type: "container",
  styles: { desktop: { display: "flex", gap: "24px", opacity: 0.8, width: "80%", marginTop: "10px", paddingLeft: "12px" } },
  children: [{ id: "h00000000001", type: "heading", props: { text: "A", level: "3" } }] }] }] };
const SIDES = ["Top", "Right", "Bottom", "Left"];
const SPACING = ["margin", "padding"].flatMap((k) => SIDES.map((s) => k + s));
const STYLE_FIELDS = ["gap", "columnGap", "rowGap", "width", "height", "minHeight", "maxWidth", "borderRadius", "opacity", "zIndex", "top"];

describe("flèches ▲▼ des champs numériques (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId;
  const until = async (fn, what, ms = 8000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(80); } };
  // le champ d'une propriété : { box (le cadre), input, up, down, unit } ; cases d'espacement = .pb-boxcell, autres champs = .pb-len
  const parts = (prop) => `(() => { const q = (s) => document.querySelector(s);
    const inp = q('.pb-inspector input[data-prop="${prop}"]') || q('.pb-inspector .pb-style-field[data-prop="${prop}"] .pb-len input:not([type=range])');
    if (!inp) return null; const box = inp.closest(".pb-sp-box") || inp.closest(".pb-len"); return { inp, box, up: box.querySelector('.pb-nstep-btn[data-dir="up"]'), down: box.querySelector('.pb-nstep-btn[data-dir="down"]'), unit: box.querySelector("select") }; })()`;
  const rect = (prop) => page.evaluate(`(() => { const p = ${parts(prop)}; if (!p) return null; const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
    const vis = (e) => e && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().width > 0;
    return { box: r(p.box), inp: r(p.inp), up: r(p.up), down: r(p.down), unit: r(p.unit), upVis: vis(p.up), downVis: vis(p.down), glyph: p.up ? getComputedStyle(p.up, "::before").borderBottomWidth : null }; })()`);
  const val = (prop) => page.evaluate(`(${parts(prop)}).inp.value`);
  const click = async (prop, dir) => { await page.evaluate(`(${parts(prop)}).${dir}.scrollIntoView({ block: "center" })`); const b = await page.evaluate(`(() => { const r = (${parts(prop)}).${dir}.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`); await page.mouse.click(b[0], b[1]); await wait(120); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Flèches" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1200);
    await page.evaluate(() => document.querySelector('[data-pb-layers] .pb-node[data-id="rowbox000001"] > .pb-row-item').click()); await wait(500);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); }); await wait(400);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; })); await wait(400);
    await page.mouse.move(5, 500); await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("les 8 cases d'espacement et tous les champs de style testés : ▲▼ visibles au repos (sans survol, sans focus)", async () => {
    const seen = [];
    for (const prop of [...SPACING, ...STYLE_FIELDS]) {
      const r = await rect(prop);
      if (!r) { assert.ok(!SPACING.includes(prop) && !["gap", "width", "opacity"].includes(prop), `champ introuvable : ${prop}`); continue; }
      seen.push(prop);
      assert.ok(r.upVis && r.downVis, `${prop} : flèches visibles au repos`);
      assert.ok(r.up.w >= 10 && r.up.h >= 5 && r.down.h >= 5, `${prop} : zone des flèches`);
    }
    assert.ok(seen.length >= 14, `champs examinés : ${seen.length} (${seen.join(", ")})`);
  });

  test("les flèches sont contenues dans le champ et ne chevauchent ni la valeur ni l'unité ; ▲ exactement au-dessus de ▼", async () => {
    for (const prop of [...SPACING, "gap", "columnGap", "rowGap", "width", "opacity", "borderRadius"]) {
      const r = await rect(prop); if (!r) continue;
      const inside = (e) => e.l >= r.box.l - 0.5 && e.r <= r.box.r + 0.5 && e.t >= r.box.t - 0.5 && e.b <= r.box.b + 0.5;
      assert.ok(inside(r.up) && inside(r.down), `${prop} : dans le champ`);
      assert.ok(r.up.l >= r.inp.r - 1, `${prop} : à droite de la valeur (${r.up.l} ≥ ${r.inp.r})`);
      if (r.unit) assert.ok(r.up.r <= r.unit.l + 1, `${prop} : à gauche de l'unité`);
      assert.ok(Math.abs(r.up.l - r.down.l) < 0.5 && r.up.b <= r.down.t + 1, `${prop} : ▲ au-dessus de ▼`);
      const mid = (r.up.t + r.down.b) / 2, bmid = (r.box.t + r.box.b) / 2;
      assert.ok(Math.abs(mid - bmid) <= 2, `${prop} : groupe centré verticalement (${mid} / ${bmid})`);
    }
  });

  test("même système partout : mêmes dimensions de flèches dans les deux variantes de champ", async () => {
    const sizes = new Set();
    for (const prop of [...SPACING, "gap", "width", "opacity", "borderRadius"]) { const r = await rect(prop); if (r) sizes.add(`${Math.round(r.up.w)}x${Math.round(r.up.h + r.down.h)}`); }
    assert.ok(sizes.size <= 2, `tailles de flèches : ${[...sizes].join(", ")}`);
  });

  test("▲ / ▼ : le pas, le négatif, les décimales et les bornes sont inchangés", async () => {
    await click("gap", "up"); assert.equal(await val("gap"), "25");
    await click("gap", "down"); assert.equal(await val("gap"), "24");
    await click("marginBottom", "down"); await click("marginBottom", "down");
    assert.ok(/^-?\d/.test(await val("marginBottom")) && Number(await val("marginBottom")) <= 0, `marge basse (négatif autorisé) : ${await val("marginBottom")}`);
    await click("opacity", "up"); assert.equal(await val("opacity"), "0.81", "pas de 0,01 pour l'opacité");
    for (let i = 0; i < 25; i++) await page.evaluate(`(${parts("opacity")}).up.click()`);
    await wait(200); assert.equal(await val("opacity"), "1", "l'opacité ne dépasse pas 1");
    await click("paddingTop", "down"); await click("paddingTop", "down");
    assert.ok(Number(await val("paddingTop") || 0) >= 0, "l'intérieur ne devient pas négatif");
  });

  test("un champ vide reste cohérent : ▲ donne un nombre, jamais NaN ni undefined", async () => {
    const before = await val("height");
    assert.ok(before === "" || !/NaN|undefined/.test(before));
    await click("height", "up");
    const after = await val("height");
    assert.ok(/^\d/.test(after) && !/NaN|undefined/.test(after), `hauteur après ▲ : « ${after} »`);
  });

  test("le clic sur ▲ ne retire pas le focus du champ ; hover et focus ne déplacent pas les flèches", async () => {
    const rel = (r) => [r.up.l - r.box.l, r.up.t - r.box.t, r.up.w, r.box.w, r.box.h]; // relatif au champ (le panneau peut défiler)
    const r0 = await rect("columnGap");
    await page.evaluate(`(${parts("columnGap")}).inp.focus()`); await wait(150);
    const r1 = await rect("columnGap");
    assert.deepEqual(rel(r1), rel(r0), "focus : rien ne bouge");
    await click("columnGap", "up");
    assert.equal(await page.evaluate(`document.activeElement === (${parts("columnGap")}).inp`), true, "focus conservé");
    await page.mouse.move(r1.up.l + 3, r1.up.t + 3); await wait(150);
    const r2 = await rect("columnGap");
    assert.deepEqual(rel(r2), rel(r0), "survol : rien ne bouge");
  });

  test("les valeurs cliquées sont dans le document et enregistrées ; annuler / rétablir restent exacts", async () => {
    await page.mouse.move(5, 500);
    await click("rowGap", "up"); await click("rowGap", "up");
    const draft = () => JSON.parse(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
    const gapOf = () => draft().sections[0].children[0].styles.desktop.rowGap;
    await until(() => gapOf() === "2px", "enregistré à 2px");
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${mod}+z`); await until(async () => (await val("rowGap")) === "1", "annuler = 1");
    await page.keyboard.press(`${mod}+Shift+z`); await until(async () => (await val("rowGap")) === "2", "rétablir = 2");
  });
});
