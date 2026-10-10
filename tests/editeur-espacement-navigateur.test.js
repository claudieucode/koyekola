// Éditeur — contrôle d'espacement (marge + intérieur) : schéma de boîte, liaison réelle et indépendante, unités, responsive, sauvegarde,
// rechargement, annuler/rétablir, anciennes pages. Chrome réel, vrai serveur.
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
async function until(check, { timeout = 12000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } },
  { id: "head00000002", type: "heading", props: { text: "Ancien", level: 2 }, styles: { desktop: { marginTop: "10px", marginBottom: "2rem", paddingLeft: "12px" }, mobile: { marginTop: "5px" } } },
  { id: "butt00000001", type: "button", props: { label: "Bouton", url: "/x" } },
] }] }] };
const SIDE = { Top: "t", Right: "r", Bottom: "b", Left: "l" };

describe("espacement : marge + intérieur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const search = (id, list) => { for (const x of list || []) { if (x.id === id) return x; const f = search(id, x.children); if (f) return f; } return null; };
  const st = (id, bp = "desktop") => ((search(id, draft().sections) || {}).styles || {})[bp] || {};
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement" });
  const canvas = (id, prop) => page.evaluate(([i, p]) => { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${i}"]`); return el ? getComputedStyle(el)[p] : null; }, [id, prop]);
  const cellSel = (kind, side) => `[data-pb-inspector] .pb-box-input.is-${kind[0]}${SIDE[side]}`;
  const cell = (kind, side) => page.locator(cellSel(kind, side)).first();
  const val = (kind, side) => cell(kind, side).inputValue();
  const type = async (kind, side, text) => { const c = cell(kind, side); await c.scrollIntoViewIfNeeded(); await c.click(); await c.fill(text); await page.keyboard.press("Enter"); await wait(150); };
  const link = (kind) => page.locator(`[data-pb-inspector] .pb-link-btn[data-link="${kind}"]`).first();
  const linked = async (kind) => (await link(kind).getAttribute("aria-pressed")) === "true";
  const setLink = async (kind, want) => { if ((await linked(kind)) !== want) { await link(kind).click(); await wait(200); } };
  const unitSel = (kind) => page.locator(`[data-pb-inspector] .pb-spacing-head select[aria-label^="${kind === "margin" ? "Marge" : "Intérieur"}"]`).first();
  const pick = async (id) => {
    await row(id).click(); await wait(300);
    const tab = page.locator("[data-pb-inspector]").getByRole("tab", { name: "Style" }); if (await tab.count()) await tab.click();
    await wait(200);
    await page.evaluate(() => { const n = document.querySelector("[data-pb-inspector] .pb-spacing"); let d = n && n.closest("details"); while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); } });
    await page.locator("[data-pb-inspector] .pb-spacing").first().scrollIntoViewIfNeeded();
  };
  const screen = async (name) => { await page.locator(`[data-pb-inspector] [role=tab], [data-pb-inspector] .pb-seg button`, { hasText: name }).first().click(); await wait(400); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Espacement" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("schéma : deux barres (liaison + unité) en haut, trois zones, 8 valeurs, pas de débordement", async () => {
    await pick("head00000001");
    for (const k of ["margin", "padding"]) { assert.equal(await link(k).count(), 1); assert.equal(await unitSel(k).count(), 1); }
    for (const k of ["margin", "padding"]) for (const s of Object.keys(SIDE)) assert.equal(await cell(k, s).count(), 1, `${k} ${s}`);
    const dims = await page.evaluate(() => { const b = document.querySelector("[data-pb-inspector] .pb-spacing"); const i = document.querySelector("[data-pb-inspector]"); return { w: b.scrollWidth, cw: b.clientWidth, h: b.getBoundingClientRect().height, iw: i.clientWidth }; });
    assert.ok(dims.w <= dims.cw + 1, `pas de débordement horizontal (${dims.w} > ${dims.cw})`);
    assert.ok(dims.h < 200, `hauteur compacte (${dims.h} px)`);
    assert.equal(await page.locator("[data-pb-inspector] .pb-boxmodel .pb-box-pad").count(), 1, "zone intérieure");
    assert.equal(await page.locator("[data-pb-inspector] .pb-boxmodel .pb-box-core").count(), 1, "zone contenu");
  });

  test("marges déliées : 4 valeurs indépendantes → schéma, canevas, sauvegarde ; les paddings restent intacts", async () => {
    await pick("head00000001");
    await setLink("margin", false);
    await type("margin", "Top", "10"); await type("margin", "Right", "20"); await type("margin", "Bottom", "30"); await type("margin", "Left", "40");
    await saved();
    const s = st("head00000001");
    assert.deepEqual([s.marginTop, s.marginRight, s.marginBottom, s.marginLeft], ["10px", "20px", "30px", "40px"]);
    assert.equal(s.paddingTop, undefined, "la marge n'écrit jamais dans le padding");
    assert.deepEqual(await Promise.all(Object.keys(SIDE).map((x) => val("margin", x))), ["10", "20", "30", "40"]);
    await until(async () => (await canvas("head00000001", "marginTop")) === "10px" && (await canvas("head00000001", "marginLeft")) === "40px", { what: "canevas (marges)" });
    assert.equal(await canvas("head00000001", "paddingTop"), "0px");
  });

  test("marges liées : une saisie met à jour les 4 côtés ; la liaison des marges ne touche pas celle de l'intérieur", async () => {
    await pick("head00000001");
    await setLink("padding", false);
    await setLink("margin", true);
    assert.equal(await linked("padding"), false, "liaison indépendante");
    await type("margin", "Left", "24");
    await saved();
    const s = st("head00000001");
    assert.deepEqual([s.marginTop, s.marginRight, s.marginBottom, s.marginLeft], ["24px", "24px", "24px", "24px"]);
    assert.deepEqual(await Promise.all(Object.keys(SIDE).map((x) => val("margin", x))), ["24", "24", "24", "24"]);
    await until(async () => (await canvas("head00000001", "marginBottom")) === "24px", { what: "canevas lié" });
    assert.equal(await linked("padding"), false);
    // délier : les valeurs deviennent modifiables séparément
    await setLink("margin", false);
    await type("margin", "Top", "5");
    await saved();
    assert.deepEqual([st("head00000001").marginTop, st("head00000001").marginRight], ["5px", "24px"]);
  });

  test("intérieur : liaison, valeurs indépendantes, négatif refusé ; la marge reste intacte", async () => {
    await pick("head00000001");
    await setLink("padding", true);
    await type("padding", "Top", "16");
    await saved();
    let s = st("head00000001");
    assert.deepEqual([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft], ["16px", "16px", "16px", "16px"]);
    assert.equal(s.marginRight, "24px", "le padding n'écrit jamais dans la marge");
    await setLink("padding", false);
    await type("padding", "Right", "8"); await type("padding", "Bottom", "0");
    await saved();
    s = st("head00000001");
    assert.deepEqual([s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft], ["16px", "8px", "0", "16px"]);
    await until(async () => (await canvas("head00000001", "paddingRight")) === "8px", { what: "canevas (intérieur)" });
    // padding négatif : refusé, valeur inchangée
    await type("padding", "Left", "-5"); await wait(300);
    assert.equal(st("head00000001").paddingLeft, "16px", "aucun padding négatif enregistré");
    // marge négative : acceptée (valide en CSS)
    await setLink("margin", false);
    await type("margin", "Bottom", "-8"); await saved();
    assert.equal(st("head00000001").marginBottom, "-8px");
    assert.equal(await canvas("head00000001", "marginBottom"), "-8px");
  });

  test("unités : px / % / rem / em — la valeur et le rendu changent vraiment, rien n'est effacé", async () => {
    await pick("head00000001");
    await setLink("padding", false);
    await type("padding", "Top", "2"); await saved();
    const before = { ...st("head00000001") };
    await unitSel("padding").selectOption("rem"); await saved();
    assert.match(await page.locator(".pb-toast, [data-pb-toast], [role=status]").allTextContents().then((a) => a.join(" ")), /nombres sont conservés/, "la règle est annoncée");
    const s = st("head00000001");
    assert.equal(s.paddingTop, "2rem");
    assert.equal(s.paddingRight, before.paddingRight === undefined ? undefined : before.paddingRight.replace("px", "rem"), "toutes les valeurs posées changent d'unité, aucune n'est perdue");
    assert.equal(await canvas("head00000001", "paddingTop"), "32px", "2rem = 32 px réels au rendu");
    assert.equal(st("head00000001").marginRight, "24px", "l'unité de l'intérieur ne touche pas la marge");
    await unitSel("padding").selectOption("%"); await saved();
    assert.equal(st("head00000001").paddingTop, "2%");
    await unitSel("padding").selectOption("px"); await saved();
    assert.equal(st("head00000001").paddingTop, "2px");
    const opts = await unitSel("margin").locator("option").allTextContents();
    assert.deepEqual(opts, ["px", "%", "rem", "em"]);
  });

  test("responsive : mobile a ses propres valeurs, celles d'ordinateur sont préservées", async () => {
    await pick("head00000001");
    const desk = { ...st("head00000001") };
    await page.locator("[data-pb-inspector] button, [data-pb-inspector] [role=tab], [data-pb-inspector] label", { hasText: /^Mobile$/ }).first().click(); await wait(500);
    await setLink("margin", false);
    await type("margin", "Top", "3"); await saved();
    assert.equal(st("head00000001", "mobile").marginTop, "3px");
    assert.equal(st("head00000001").marginTop, desk.marginTop, "ordinateur inchangé");
    assert.equal(await val("margin", "Top"), "3");
    await page.locator("[data-pb-inspector] button, [data-pb-inspector] [role=tab], [data-pb-inspector] label", { hasText: /^Ordinateur$/ }).first().click(); await wait(500);
    assert.equal(await val("margin", "Top"), String(parseFloat(desk.marginTop)), "le schéma suit l'écran actif");
  });

  test("annuler / rétablir : le schéma, le canevas et la sauvegarde restent cohérents ; rechargement fidèle", async () => {
    await pick("head00000001");
    await setLink("padding", false);
    await type("padding", "Top", "50"); await saved();
    assert.equal(await canvas("head00000001", "paddingTop"), "50px");
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await canvas("head00000001", "paddingTop")) !== "50px", { what: "annulation" }); await saved();
    assert.notEqual(st("head00000001").paddingTop, "50px");
    await pick("head00000001");
    assert.notEqual(await val("padding", "Top"), "50", "le schéma suit l'annulation");
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await canvas("head00000001", "paddingTop")) === "50px", { what: "rétablissement" }); await saved();
    assert.equal(st("head00000001").paddingTop, "50px");
    // rechargement : le contrôle affiche ce qui est réellement enregistré
    const expected = st("head00000001");
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await pick("head00000001");
    assert.equal(await val("padding", "Top"), "50");
    assert.equal(await val("margin", "Left"), String(parseFloat(expected.marginLeft)));
    assert.equal(await canvas("head00000001", "paddingTop"), "50px");
  });

  test("anciennes pages : valeurs existantes (px, rem, mobile) affichées telles quelles et conservées ; autres types d'éléments", async () => {
    await pick("head00000002");
    assert.equal(await val("margin", "Top"), "10");
    assert.equal(await val("margin", "Bottom"), "2rem");
    assert.equal(await val("padding", "Left"), "12");
    assert.equal(await canvas("head00000002", "marginBottom"), "32px");
    const s = st("head00000002");
    assert.deepEqual([s.marginTop, s.marginBottom, s.paddingLeft, st("head00000002", "mobile").marginTop], ["10px", "2rem", "12px", "5px"], "aucune donnée réécrite par la simple ouverture");
    // bouton et conteneur : même contrôle, mêmes propriétés
    await pick("butt00000001");
    await setLink("margin", true); await type("margin", "Top", "9"); await saved();
    assert.equal(st("butt00000001").marginLeft, "9px");
    assert.equal(await canvas("butt00000001", "marginTop"), "9px");
    await pick("cont00000001");
    assert.equal(await page.locator("[data-pb-inspector] .pb-spacing").count(), 1);
    await setLink("padding", false); await type("padding", "Top", "7"); await saved();
    assert.equal(st("cont00000001").paddingTop, "7px");
    assert.deepEqual(errors, []);
  });
});
