// Isolation des valeurs responsive dans l'éditeur RÉEL (Chrome) : une valeur posée sur un appareil n'altère jamais celle d'un autre.
// Chaque réglage est posé avec les contrôles de l'inspecteur dans l'ordre ordinateur → tablette → mobile → retour ordinateur → retour
// tablette, puis on vérifie, pour chaque appareil : (1) le document enregistré, (2) le style calculé du canevas à la largeur de l'appareil,
// (3) l'affichage du contrôle ; enfin après rechargement de l'éditeur. ↺ sur un appareil ne retire que la valeur de cet appareil.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : isolation responsive non exécutée sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 12000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }

// [élément, propriété, type de contrôle, CSS, valeurs saisies par appareil, valeur calculée attendue par appareil]
const CASES = [
  ["hed000000001", "fontSize", "nombre", "font-size", { desktop: "40", tablet: "30", mobile: "20" }, { desktop: "40px", tablet: "30px", mobile: "20px" }],
  ["hed000000001", "width", "nombre", "width", { desktop: "60", tablet: "80", mobile: "100" }, null],
  ["hed000000001", "marginTop", "cellule", "margin-top", { desktop: "10", tablet: "20", mobile: "5" }, { desktop: "10px", tablet: "20px", mobile: "5px" }],
  ["hed000000001", "textAlign", "icônes", "text-align", { desktop: "right", tablet: "center", mobile: "left" }, { desktop: "right", tablet: "center", mobile: "left" }],
  ["box000000001", "flexDirection", "icônes", "flex-direction", { desktop: "row", tablet: "column", mobile: "row-reverse" }, { desktop: "row", tablet: "column", mobile: "row-reverse" }],
  ["box000000001", "justifyContent", "icônes", "justify-content", { desktop: "flex-start", tablet: "center", mobile: "flex-end" }, { desktop: "flex-start", tablet: "center", mobile: "flex-end" }],
  ["box000000001", "gap", "nombre", "gap", { desktop: "8", tablet: "16", mobile: "24" }, { desktop: "8px", tablet: "16px", mobile: "24px" }],
  ["img000000001", "width", "nombre", "width", { desktop: "300", tablet: "200", mobile: "100" }, { desktop: "300px", tablet: "200px", mobile: "100px" }],
  ["hed000000002", "textTransform", "icônes", "text-transform", { desktop: "uppercase", tablet: "lowercase", mobile: "capitalize" }, { desktop: "uppercase", tablet: "lowercase", mobile: "capitalize" }],
];

describe("isolation des valeurs responsive (inspecteur réel, Chrome)", { skip: SKIP }, () => {
  let srv, boss, browser, page, id, errors = [];
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const find = (nodes, nid) => { for (const n of nodes || []) { if (n.id === nid) return n; const f = find(n.children, nid); if (f) return f; } return null; };
  const styles = (nid) => ((find(JSON.parse(row().draft || row().sections).sections, nid) || {}).styles) || {};
  const computed = (nid, css) => page.evaluate(({ nid, css }) => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector(`[data-node-id="${nid}"]`); return e ? f.contentWindow.getComputedStyle(e).getPropertyValue(css) : null; }, { nid, css });
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(900);
  };
  const device = async (d) => { await page.locator(`[role="radio"][data-device="${d}"]`).first().click(); await wait(700); };
  const select = async (nid) => {
    await page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(); await wait(250);
    await page.locator("[data-pb-inspector] [role=tab]", { hasText: /^Style$/ }).click(); await wait(150);
    for (let i = 0; i < 2; i++) { await page.$$eval("[data-pb-inspector] details", (ds) => ds.forEach((d) => { d.open = true; })); await wait(200); }
  };
  const set = async (prop, kind, value) => {
    const r = page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"]`).first();
    if (kind === "cellule") { const i = page.locator(`[data-pb-inspector] input[data-prop="${prop}"]`).first(); await i.fill(value); await i.press("Enter"); }
    else if (kind === "nombre") { const i = r.locator("input.pb-len-num").first(); await i.fill(value); await i.press("Enter"); }
    else if (kind === "icônes") await r.locator(`button[role="radio"][data-value="${value}"]`).click();
    else await r.locator("select").first().selectOption(value);
  };
  const shown = async (prop, kind) => {
    const r = page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"]`).first();
    if (kind === "cellule") return page.locator(`[data-pb-inspector] input[data-prop="${prop}"]`).first().inputValue();
    if (kind === "nombre") return r.locator("input.pb-len-num").first().inputValue();
    if (kind === "icônes") return r.locator('button[role="radio"][aria-checked="true"]').first().getAttribute("data-value").catch(() => null);
    return r.locator("select").first().inputValue();
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Isolation", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const content = { title: "Isolation", sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "box000000001", type: "container", props: {}, styles: { desktop: { display: "flex" } }, children: [
        { id: "hed000000001", type: "heading", props: { text: "Un titre", level: "2" } },
        { id: "hed000000002", type: "heading", props: { text: "Autre titre", level: "3" } },
        { id: "img000000001", type: "image", props: { src: "https://example.com/a.jpg", alt: "a" } } ] } ] }] };
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content } });
    assert.equal(r.status, 200, r.text);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [nid, prop, kind, css, input, expected] of CASES) {
    test(`${nid.slice(0, 3)} › ${prop} : ordinateur → tablette → mobile → retour, sans que l'un écrase l'autre ; identique après rechargement`, async () => {
      await open(); await select(nid);
      const norm = (v) => (kind === "nombre" || kind === "cellule" ? `${v}px` : v);
      const want = (d) => norm(input[d], d);
      // 1. ordinateur, tablette, mobile
      for (const d of ["desktop", "tablet", "mobile"]) { await device(d); await select(nid); await set(prop, kind, input[d]); await until(() => styles(nid)[d] && String(styles(nid)[d][prop]) === want(d), { what: `${prop} ${d} enregistré` }); }
      // 2. retour ordinateur puis tablette : rien n'a été écrasé
      for (const d of ["desktop", "tablet"]) {
        await device(d); await select(nid);
        for (const dd of ["desktop", "tablet", "mobile"]) assert.equal(String(styles(nid)[dd][prop]), want(dd), `${prop} ${dd} altéré après passage sur ${d}`);
        assert.equal(String(await shown(prop, kind)), kind === "nombre" ? input[d] : input[d], `le contrôle affiche la valeur de ${d}`);
        if (expected) await until(async () => (await computed(nid, css)) === expected[d], { what: `${prop} calculé ${d}` });
      }
      // 3. rechargement : mêmes valeurs
      await open();
      for (const d of ["desktop", "tablet", "mobile"]) {
        await device(d); await select(nid);
        assert.equal(String(styles(nid)[d][prop]), want(d));
        assert.equal(String(await shown(prop, kind)), input[d], `après rechargement, le contrôle affiche ${d}`);
        if (expected) assert.equal(await computed(nid, css), expected[d], `${prop} calculé ${d} après rechargement`);
      }
      // 4. ↺ sur le mobile : seule la valeur du mobile disparaît ; le mobile hérite alors de la tablette
      await device("mobile"); await select(nid);
      if (kind === "cellule") await page.locator(`[data-pb-inspector] input[data-prop="${prop}"]`).first().fill("").then(() => page.keyboard.press("Enter")); else await page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"] .pb-reset`).first().click();
      await until(() => !styles(nid).mobile || styles(nid).mobile[prop] === undefined, { what: `${prop} mobile effacé` });
      assert.equal(String(styles(nid).desktop[prop]), want("desktop"));
      assert.equal(String(styles(nid).tablet[prop]), want("tablet"));
      if (expected) await until(async () => (await computed(nid, css)) === expected.tablet, { what: "le mobile hérite de la tablette" });
      assert.deepEqual(errors, [], "erreurs de script");
    });
  }
});
