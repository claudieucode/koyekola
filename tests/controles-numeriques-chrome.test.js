// Contrôles numériques dans un VRAI navigateur (Chrome piloté par Playwright) : vraie souris (glissement, ▲▼), vrai clavier
// (sélection, saisie, flèches, Maj, Suppr dans un champ), vrai rendu (style calculé dans le canevas après PX → REM), curseur.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
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
async function until(check, { timeout = 12000, every = 120, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    let v = null;
    try { v = await check(); } catch { /* on réessaie */ }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`);
    await wait(every);
  }
}

describe("contrôles numériques de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const styleOf = (id, dev = "desktop") => { const n = nodesOf(draft().sections).find((x) => x.id === id); return n && n.styles && n.styles[dev] ? n.styles[dev] : {}; };
  const savedStyle = (id, key, expected, dev = "desktop") => until(() => styleOf(id, dev)[key] === expected, { what: `${key} = ${expected}` });
  const field = (prop) => page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"] input.pb-len-num`);
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  const H1 = "hed000000001";
  const openAll = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details").forEach((d) => { d.open = true; }));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Num Chrome" })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [{ id: H1, type: "heading", props: { text: "Un titre", level: "2" } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await page.locator(`[data-pb-layers] .pb-node[data-id="${H1}"] > .pb-row-item`).click();
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click();
    await openAll();
    await field("fontSize").waitFor();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("saisie réelle : sélectionner tout, taper, Entrée ; ▲▼ à la souris sans perdre le focus ; Maj + flèche", async () => {
    const f = field("fontSize");
    await f.click();
    await page.keyboard.press(`${mod}+A`);
    await page.keyboard.type("32");
    await page.keyboard.press("Enter");
    await savedStyle(H1, "fontSize", "32px");
    await f.focus();
    await page.locator('.pb-prop[data-prop="fontSize"] .pb-nstep-btn[data-dir="up"]').click();
    await savedStyle(H1, "fontSize", "33px");
    assert.equal(await f.evaluate((e) => document.activeElement === e), true, "le champ garde le focus après un clic sur ▲");
    await page.locator('.pb-prop[data-prop="fontSize"] .pb-nstep-btn[data-dir="down"]').click();
    await savedStyle(H1, "fontSize", "32px");
    await f.focus();
    await page.keyboard.press("ArrowUp"); await savedStyle(H1, "fontSize", "33px");
    await page.keyboard.press("Shift+ArrowUp"); await savedStyle(H1, "fontSize", "43px");
    await page.keyboard.press("ArrowDown"); await savedStyle(H1, "fontSize", "42px");
  });

  test("édition de texte intacte : Retour arrière / Suppr dans le champ n'effacent pas l'élément sélectionné ; coller une valeur ; sélection à la souris", async () => {
    const f = field("fontSize");
    await f.click({ clickCount: 3 }); // triple clic : sélection du contenu
    assert.equal(await f.evaluate((e) => e.selectionStart === 0 && e.selectionEnd === e.value.length), true);
    await page.keyboard.press("Backspace");
    assert.equal(await f.inputValue(), "");
    await page.keyboard.press("Delete");
    assert.ok(nodesOf(draft().sections).some((x) => x.id === H1), "l'élément n'a pas été supprimé");
    await page.keyboard.insertText("28"); // « coller »
    await page.keyboard.press("Tab");
    await savedStyle(H1, "fontSize", "28px");
    assert.ok(await frame().locator(`[data-node-id="${H1}"]`).count(), "l'élément est toujours dans le canevas");
  });

  test("PX → REM : le rendu réel du canevas change (taille calculée = nombre × taille de base), le CSS publié aussi", async () => {
    const px = await frame().locator(`[data-node-id="${H1}"]`).evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    assert.equal(px, 28);
    await field("fontSize").fill("2");
    await field("fontSize").press("Enter");
    await savedStyle(H1, "fontSize", "2px");
    await page.locator('.pb-prop[data-prop="fontSize"] select.pb-len-unit').selectOption("rem");
    await savedStyle(H1, "fontSize", "2rem");
    const real = await until(async () => {
      const r = await frame().locator(`[data-node-id="${H1}"]`).evaluate((e) => ({ fs: parseFloat(getComputedStyle(e).fontSize), root: parseFloat(getComputedStyle(e.ownerDocument.documentElement).fontSize) }));
      return Math.abs(r.fs - 2 * r.root) < 0.01 ? r : null;
    }, { what: "taille calculée = 2 rem" });
    assert.ok(real.fs > 0);
  });

  test("glissement à la souris sur le libellé : la valeur suit en direct, une seule étape d'annulation ; le texte du champ reste sélectionnable", async () => {
    await field("fontSize").fill("20"); await field("fontSize").press("Enter");
    await field("fontSize").evaluate((e) => e.blur());
    const sel = page.locator('.pb-prop[data-prop="fontSize"] select.pb-len-unit');
    await sel.selectOption("px");
    await savedStyle(H1, "fontSize", "20px");
    const label = page.locator('.pb-prop[data-prop="fontSize"] label.pb-scrub');
    const box = await label.boundingBox();
    const x = box.x + 6, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + 40, y, { steps: 8 });
    await page.mouse.move(x + 80, y, { steps: 8 });
    await page.mouse.up();
    const after = await until(() => { const v = parseInt(styleOf(H1).fontSize, 10); return v > 20 ? v : null; }, { what: "valeur modifiée par le glissement" });
    assert.equal(after, 40, "80 px de glissement = 20 pas de 1 (4 px par pas)");
    assert.equal(await field("fontSize").inputValue(), "40");
    assert.equal(await frame().locator(`[data-node-id="${H1}"]`).evaluate((e) => parseFloat(getComputedStyle(e).fontSize)), 40, "rendu réel");
    await page.locator("[data-pb-undo]").click();
    await savedStyle(H1, "fontSize", "20px");
  });

  test("curseur réel : l'opacité suit le curseur, rendu réel ; capture d'écran du panneau", async () => {
    await openAll();
    const range = page.locator('.pb-prop[data-prop="opacity"] input[type="range"]');
    await range.waitFor();
    await range.fill("0.3");
    await savedStyle(H1, "opacity", 0.3);
    assert.equal(await frame().locator(`[data-node-id="${H1}"]`).evaluate((e) => getComputedStyle(e).opacity), "0.3");
    await openAll();
    const out = process.env.NUM_SHOT || "";
    if (out) await page.locator("[data-pb-inspector]").screenshot({ path: out });
  });

  test("aucune erreur JavaScript ni de console", () => { assert.deepEqual(errors, []); });
});
