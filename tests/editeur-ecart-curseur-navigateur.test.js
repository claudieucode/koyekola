// Contrôle « Écart » du conteneur : le curseur ajouté au champ numérique existant règle la VRAIE gouttière (Flexbox, colonne, Grille), reste
// synchronisé avec le champ, ne ramène pas silencieusement une valeur hors plage, ne crée qu'UNE étape d'annulation par geste, survit au rechargement,
// et vaut par écran. Vrai Chrome. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const mod = process.platform === "darwin" ? "Meta" : "Control";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const kid = (id, text) => ({ id, type: "heading", props: { text, level: "3" } });
const box = (id, styles, n = 3) => ({ id, type: "container", styles: { desktop: styles }, children: Array.from({ length: n }, (_, i) => kid(id.slice(0, 6) + "k" + i + "000000".slice(0, 5), "Enfant " + i)) });
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  box("rowbox000001", { display: "flex", flexDirection: "row", gap: "24px" }),
  box("colbox000001", { display: "flex", flexDirection: "column", gap: "24px" }),
  box("grid00000001", { display: "grid", gridTemplate: "1fr 1fr", gap: "10px", rowGap: "30px", columnGap: "12px" }, 4),
  box("bigbox000001", { display: "flex", flexDirection: "row", gap: "150px" }),
] }] };

describe("éditeur de pages : curseur du contrôle « Écart » (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId;
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(120); } };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1200);
  };
  // sélectionne le conteneur, ouvre l'onglet « Style » puis la section « Mise en page » (si elle est repliée)
  const select = async (nid) => {
    await page.evaluate((nid) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`).click(), nid); await wait(500);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab], .pb-inspector .pb-tab")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); });
    await wait(400);
    await page.evaluate(() => { if (document.querySelector('.pb-inspector .pb-style-field[data-prop="gap"]')) return; const a = [...document.querySelectorAll(".pb-inspector summary, .pb-inspector .pb-acc-head, .pb-inspector button")].find((x) => /^Mise en page/.test(x.textContent.trim())); if (a) a.click(); });
    await until(() => page.locator('.pb-inspector .pb-style-field[data-prop="gap"]').count(), "ligne Écart visible", 8000);
  };
  // ligne « Écart entre enfants » (ou colonnes / lignes) de l'inspecteur
  const field = (prop) => page.locator(`.pb-style-field[data-prop="${prop}"]`).first();
  const canvas = (nid, props) => page.evaluate(([nid, props]) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${nid}"]`); const cs = getComputedStyle(e); return props.map((p) => cs.getPropertyValue(p)); }, [nid, props]);
  const gapsReal = (nid, dir) => page.evaluate(([nid, dir]) => { // espace réel mesuré entre le 1er et le 2e enfant
    const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${nid}"]`);
    const k = [...e.children].filter((c) => c.getBoundingClientRect().width); const a = k[0].getBoundingClientRect(), b = k[1].getBoundingClientRect();
    return Math.round(dir === "row" ? b.left - a.right : b.top - a.bottom);
  }, [nid, dir]);
  const saved = async () => { const r = srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId); return JSON.parse(r.draft || "null"); };
  const nodeSaved = async (nid) => { const d = await saved(); const f = (ns) => { for (const n of ns || []) { if (n.id === nid) return n; const x = f(n.children); if (x) return x; } return null; }; return f(d && d.sections); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    pageId = Number((await boss.post("/marketing/pages", { name: "Écart" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Flexbox horizontal : le curseur règle la vraie gouttière, le champ suit, un geste = une étape d'annulation", async () => {
    await select("rowbox000001");
    const f = field("gap"), range = f.locator("input[type=range]"), num = f.locator("input:not([type=range])").first();
    assert.equal(await num.inputValue(), "24");
    assert.equal(await range.inputValue(), "24");
    assert.equal(await gapsReal("rowbox000001", "row"), 24);
    await range.fill("40");
    await until(async () => (await gapsReal("rowbox000001", "row")) === 40, "gouttière réelle 40");
    assert.equal(await num.inputValue(), "40");
    assert.deepEqual(await canvas("rowbox000001", ["column-gap", "row-gap"]), ["40px", "40px"]);
    // un VRAI glissement de souris (appui, plusieurs déplacements, relâchement) = une seule étape d'annulation
    const r = await range.boundingBox();
    await page.mouse.move(r.x + r.width * 0.4, r.y + r.height / 2); await page.mouse.down();
    for (const k of [0.45, 0.5, 0.55, 0.6]) await page.mouse.move(r.x + r.width * k, r.y + r.height / 2, { steps: 3 });
    await page.mouse.up(); await wait(400);
    const after = Number(await field("gap").locator("input:not([type=range])").first().inputValue());
    assert.ok(after > 40 && after <= 100, `le glissement a changé la valeur : ${after}`);
    assert.equal(await gapsReal("rowbox000001", "row"), after, "gouttière réelle = valeur affichée");
    await page.keyboard.press("Escape");
    await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press(`${mod}+z`);
    // un seul Annuler ramène avant le geste (24), pas 41 ni 40
    await until(async () => (await gapsReal("rowbox000001", "row")) === 40, "un seul Annuler défait tout le glissement (retour à 40)");
    await page.keyboard.press(`${mod}+Shift+z`);
    await until(async () => (await gapsReal("rowbox000001", "row")) === after, "rétablir = valeur du glissement");
  });

  test("champ numérique → curseur et canevas ; la valeur est enregistrée puis identique après rechargement", async () => {
    await select("rowbox000001");
    const f = field("gap"), range = f.locator("input[type=range]"), num = f.locator("input:not([type=range])").first();
    await num.fill("12"); await num.press("Enter");
    await until(async () => (await gapsReal("rowbox000001", "row")) === 12, "champ → canevas");
    assert.equal(await range.inputValue(), "12");
    await page.keyboard.press(`${mod}+s`);
    await until(async () => { const n = await nodeSaved("rowbox000001"); return n && n.styles.desktop.gap === "12px"; }, "brouillon enregistré à 12px");
    await open(); await select("rowbox000001");
    assert.equal(await field("gap").locator("input:not([type=range])").first().inputValue(), "12");
    assert.equal(await field("gap").locator("input[type=range]").inputValue(), "12");
    assert.equal(await gapsReal("rowbox000001", "row"), 12);
  });

  test("Flexbox en colonne : l'écart est vertical, sans marge ni remplissage ajoutés aux enfants", async () => {
    await select("colbox000001");
    const range = field("gap").locator("input[type=range]");
    await range.fill("60");
    await until(async () => (await gapsReal("colbox000001", "col")) === 60, "écart vertical 60");
    await until(async () => { const x = await nodeSaved("colbox000001"); return x && x.styles.desktop.gap === "60px"; }, "écart enregistré");
    const x = await nodeSaved("colbox000001");
    assert.equal(Object.keys(x.children[1].styles || {}).length, 0, "les enfants n'ont reçu aucun style");
  });

  test("valeur enregistrée hors plage du curseur (150 px) : conservée telle quelle à l'ouverture et à la lecture", async () => {
    await select("bigbox000001");
    const f = field("gap"), num = f.locator("input:not([type=range])").first();
    assert.equal(await num.inputValue(), "150", "le champ montre la vraie valeur");
    assert.equal(await gapsReal("bigbox000001", "row"), 150);
    await wait(500);
    const x = await nodeSaved("bigbox000001");
    assert.ok(!x || x.styles.desktop.gap === "150px", "la valeur n'a pas été réécrite");
    await num.fill("300"); await num.press("Enter");
    await until(async () => (await gapsReal("bigbox000001", "row")) === 300, "saisie 300 px au-delà du curseur");
  });

  test("Grille : écarts lignes / colonnes séparés conservés, le curseur règle chacun", async () => {
    await select("grid00000001");
    const col = field("columnGap"), row = field("rowGap");
    assert.equal(await col.locator("input:not([type=range])").first().inputValue(), "12");
    assert.equal(await row.locator("input:not([type=range])").first().inputValue(), "30");
    await col.locator("input[type=range]").fill("44");
    await until(async () => (await canvas("grid00000001", ["column-gap"]))[0] === "44px", "écart colonnes 44");
    assert.equal((await canvas("grid00000001", ["row-gap"]))[0], "30px", "l'écart des lignes n'a pas bougé");
  });

  test("écran tablette : la valeur écrite cible l'écran actif, l'ordinateur est intact", async () => {
    await select("rowbox000001");
    await page.locator('button[data-device="tablet"]').first().click();
    await wait(500);
    const range = field("gap").locator("input[type=range]");
    await range.fill("7");
    await until(async () => { const x = await nodeSaved("rowbox000001"); return x && x.styles.tablet && x.styles.tablet.gap === "7px"; }, "valeur tablette enregistrée");
    const x = await nodeSaved("rowbox000001");
    assert.equal(x.styles.desktop.gap, "12px", "ordinateur inchangé");
  });
});
