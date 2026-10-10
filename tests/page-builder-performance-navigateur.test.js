// Page Builder — fiabilité des optimisations de performance : sélection incrémentale des calques (un seul calque sélectionné, états justes),
// calques NON reconstruits par une modification de style (même nœud DOM) mais reconstruits par une modification de structure ou de nom,
// historique intact (annuler / rétablir), canevas mis à jour ; rendu serveur d'une grande page (gabarits compilés une seule fois).
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
async function until(check, { timeout = 10000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
// Page de N éléments : sections libres → conteneurs → titres, textes, boutons, listes, grilles
function content(total) {
  let n = 0;
  const id = (p) => `${p}${String(++n).padStart(9, "0")}`.slice(0, 12);
  const leaf = (i) => [{ id: id("hd"), type: "heading", props: { text: `Titre ${i}`, level: 3 } }, { id: id("tx"), type: "text", props: { html: `<p>Texte ${i}</p>` } }, { id: id("bt"), type: "button", props: { label: `B${i}`, url: "/catalogue" } }, { id: id("li"), type: "list", props: { items: ["a", "b"] } }][i % 4];
  const boxes = []; let made = 0;
  while (made < total) { const box = { id: id("cn"), type: "container", children: [] }; made++; for (let i = 0; i < 6 && made < total; i++) { box.children.push(leaf(made)); made++; } boxes.push(box); }
  // au plus 25 sections libres (limite du produit : 30)
  const per = Math.ceil(boxes.length / 25), sections = []; let s = 0;
  for (let i = 0; i < boxes.length; i += per) sections.push({ id: `sect${String(++s).padStart(8, "0")}`, type: "layout", children: boxes.slice(i, i + per) });
  return { sections };
}

describe("performance du Page Builder : exactitude (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const selected = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-node[aria-selected='true']")].map((l) => l.getAttribute("data-id")));
  const marked = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((r) => r.parentElement.getAttribute("data-id")));
  const rowCount = () => page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length);
  // Identifiants réels lus dans les calques (les identifiants sont numérotés par la page de test) : titres, textes, boutons
  let ids = {};
  const rowIds = (prefix) => page.evaluate((p) => [...document.querySelectorAll("[data-pb-layers] .pb-node[data-id]")].map((l) => l.getAttribute("data-id")).filter((i) => i.startsWith(p)), prefix);
  const clickRow = (id, mods) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(mods ? { modifiers: mods } : {});
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Perf" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: content(120) }, headers: { Origin: srv.base } })).status, 200);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    ids = { hd: await rowIds("hd"), tx: await rowIds("tx"), bt: await rowIds("bt") };
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("sélection incrémentale : un seul calque sélectionné à la fois, cases multiples justes, désélection", async () => {
    await clickRow(ids.hd[0]); await until(async () => (await selected()).length === 1, { what: "une sélection" });
    assert.deepEqual(await selected(), [ids.hd[0]]); assert.deepEqual(await marked(), [ids.hd[0]]);
    await clickRow(ids.tx[0]);
    await until(async () => (await selected())[0] === ids.tx[0], { what: "sélection déplacée" });
    assert.deepEqual(await selected(), [ids.tx[0]]); assert.deepEqual(await marked(), [ids.tx[0]]);
    await clickRow(ids.bt[0], ["Shift"]);
    await until(async () => (await selected()).length === 2, { what: "sélection multiple" });
    assert.deepEqual((await selected()).sort(), [ids.bt[0], ids.tx[0]]); assert.deepEqual((await marked()).sort(), [ids.bt[0], ids.tx[0]]);
    await clickRow(ids.tx[0], ["Shift"]);
    await until(async () => (await selected()).length === 1, { what: "retrait de la sélection" });
    assert.deepEqual(await selected(), [ids.bt[0]]);
    // une seule ligne est atteignable au clavier (tabindex 0)
    assert.equal(await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item")].filter((r) => r.tabIndex === 0).length), 1);
    // sélection depuis le canevas : les calques suivent
    await page.frameLocator("[data-pb-frame]").locator(`[data-node-id="${ids.hd[0]}"]`).click();
    await until(async () => (await selected())[0] === ids.hd[0], { what: "calque suit le canevas" });
    assert.deepEqual(await marked(), [ids.hd[0]]);
  });

  test("une modification de style ne reconstruit pas les calques ; une modification de structure ou de nom, si ; annuler / rétablir exacts", async () => {
    await clickRow(ids.hd[0]);
    const sel = page.locator("[data-pb-context] select", { has: page.locator("option") }).filter({ hasText: /Graisse|Normale|Grasse/ }).first();
    await sel.waitFor();
    await page.evaluate((id) => { window.__row = document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"]`); }, ids.hd[0]);
    const rows0 = await rowCount();
    await sel.selectOption("700");
    await until(() => page.evaluate((id) => { const el = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${id}"]`); return el && /700|bold/.test(getComputedStyle(el).fontWeight); }, ids.hd[0]), { what: "style appliqué dans le canevas" });
    assert.equal(await page.evaluate(() => window.__row.isConnected), true, "les calques n'ont pas été reconstruits par un changement de style");
    assert.equal(await rowCount(), rows0);
    // structure : dupliquer reconstruit (une ligne de plus), annuler la retire, rétablir la ramène
    await page.keyboard.press("Control+d").catch(() => {});
    const dup = page.locator("button[aria-label*='Dupliquer'], button[data-tip*='Dupliquer']").filter({ visible: true }).first();
    if ((await rowCount()) === rows0) await dup.click();
    await until(async () => (await rowCount()) === rows0 + 1, { what: "ligne ajoutée par la duplication" });
    assert.equal(await page.evaluate(() => window.__row.isConnected), false, "structure modifiée : calques reconstruits");
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await rowCount()) === rows0, { what: "annulation" });
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await rowCount()) === rows0 + 1, { what: "rétablissement" });
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await rowCount()) === rows0, { what: "annulation 2" });
    // nom : renommer un calque (double-clic) → le calque affiche le nouveau nom ; Échap rend le calque comme avant (reconstruction forcée)
    const row = page.locator(`[data-pb-layers] .pb-node[data-id="${ids.hd[0]}"] > .pb-row-item`);
    const label0 = await row.locator(".pb-node-name").textContent();
    await row.dblclick();
    await page.locator(".pb-rename").fill("Brouillon annulé");
    await page.keyboard.press("Escape");
    await until(async () => (await page.locator(".pb-rename").count()) === 0, { what: "champ de renommage retiré après Échap" });
    assert.equal(await row.locator(".pb-node-name").textContent(), label0, "Échap : nom inchangé");
    await row.dblclick();
    await page.locator(".pb-rename").fill("Nom changé");
    await page.keyboard.press("Enter");
    await until(async () => (await row.locator(".pb-node-name").textContent()) === "Nom changé", { what: "libellé du calque mis à jour" });
    assert.deepEqual(errors, []);
  });

  test("grande page (400 éléments, limite du produit) : le rendu serveur reste dans le budget (gabarits compilés une seule fois)", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Perf 400" })).location.match(/(\d+)$/)[1]);
    const c = content(400);
    const times = [];
    for (let i = 0; i < 4; i++) { const t = Date.now(); const r = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: c }, headers: { Origin: srv.base } }); assert.equal(r.status, 200, r.text.slice(0, 120)); times.push(Date.now() - t); }
    times.sort((a, b) => a - b);
    // Sans cache de gabarits : ≈ 2 s et plus pour 400 éléments (mesuré) ; avec : quelques centaines de ms. Marge large pour une machine chargée.
    assert.ok(times[1] < 1400, `rendu de 400 éléments : ${times.join(" / ")} ms`);
  });
});
