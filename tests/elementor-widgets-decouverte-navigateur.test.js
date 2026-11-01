// Découvrabilité des widgets Elementor dans l'éditeur RÉEL (Chrome) : pour chacun des widgets officiels de la table docs/widgets-elementor/elementor-widgets-2026-11.json,
// la recherche de la bibliothèque, saisie avec le NOM ELEMENTOR, doit proposer l'entrée Kolakisa correspondante, et un clic doit l'ajouter au canevas (nouvel élément du bon type).
// Les widgets sans équivalent (kolakisa : null) sont comptés à part et leur absence est documentée, jamais masquée. Ignoré (avec la raison) sans Playwright/Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor } = require("./helpers");
const MAP = require("../src/marketing/pages/elementorWidgets.json");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const mapped = MAP.widgets.filter((w) => w.kolakisa);
// Éléments qui demandent un choix à l'insertion (boîte de dialogue) : leur présence dans la bibliothèque est vérifiée, leur ajout est couvert par leurs tests propres
const ASKS = (key) => { const p = nodes.PALETTE[key]; const sc = nodes.editorSpec().shortcuts.find((s) => s.key === key); return Boolean((p && p.asks) || (sc && sc.provider)); };

describe("widgets Elementor : trouvables par leur nom dans la bibliothèque de l'éditeur", { skip: SKIP }, () => {
  let srv, boss, browser, page, id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Découverte", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 });
    await wait(600);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("la table officielle est cohérente : chaque clé Kolakisa existe dans le registre ou parmi les raccourcis", () => {
    const spec = nodes.editorSpec(); const keys = new Set([...spec.types.map((t) => t.type), ...spec.shortcuts.map((s) => s.key)]);
    const bad = mapped.filter((w) => !keys.has(w.kolakisa)).map((w) => `${w.name} → ${w.kolakisa}`);
    assert.deepEqual(bad, [], "clés absentes du registre");
    assert.equal(MAP.widgets.length, new Set(MAP.widgets.map((w) => w.name)).size, "noms uniques");
  });

  test("recherche par le nom Elementor : l'entrée Kolakisa est proposée, visible et activable (sauf choix demandé à l'insertion)", { timeout: 900000 }, async () => {
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    const search = page.locator("[data-pb-el-search]");
    const missing = [], disabled = [];
    for (const w of mapped) {
      await search.fill(w.name.replace(/ \(.*\)$/, "")); await wait(60);
      const item = page.locator(`.pb-pal-item[data-widget="${w.kolakisa}"]`).first();
      if (!(await item.count())) { missing.push(`${w.name} (${w.kolakisa})`); continue; }
      if (await item.isDisabled()) disabled.push(`${w.name} (${w.kolakisa})`);
    }
    await search.fill("");
    assert.deepEqual(missing, [], "introuvables par leur nom Elementor");
    assert.deepEqual(disabled, [], "présents mais inactifs");
  });

  test("un clic dans la bibliothèque ajoute un élément du bon type (hors choix demandé à l'insertion)", { timeout: 900000 }, async () => {
    const failed = [];
    const seen = new Set();
    let n = 0;
    for (const w of mapped) {
      // l'éditeur plafonne une page à 30 sections : une page neuve toutes les 12 insertions
      if (n && n % 12 === 0) {
        const db = srv.db(); db.prepare("UPDATE mk_landing_pages SET draft = NULL, sections = '[]' WHERE id = ?").run(id); db.close();
        await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
        await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 60000 }); await wait(600);
        n += 1;
      }
      const key = w.kolakisa; if (seen.has(key) || ASKS(key)) continue; seen.add(key); n += 1;
      const spec = nodes.editorSpec().shortcuts.find((s) => s.key === key); const expect = spec ? spec.type : key;
      const before = await page.evaluate(() => { let n = 0; const walk = (l) => { for (const x of l || []) { n += 1; walk(x.children); } }; walk(window.__pb.content().sections); return n; });
      await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
      await page.locator("[data-pb-el-search]").fill(w.name.replace(/ \(.*\)$/, "")); await wait(80);
      const item = page.locator(`.pb-pal-item[data-widget="${key}"]`).first();
      if (!(await item.count()) || (await item.isDisabled())) { failed.push(`${w.name} : entrée absente ou inactive`); continue; }
      await item.click({ timeout: 8000 }).catch(() => failed.push(`${w.name} : clic impossible`)); await wait(120);
      await page.keyboard.press("Escape"); await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach((d) => d.close()); });
      const types = await page.evaluate(() => { const out = []; const walk = (l) => { for (const x of l || []) { out.push(x.type); walk(x.children); } }; walk(window.__pb.content().sections); return out; });
      if (types.length <= before || !types.includes(expect)) failed.push(`${w.name} : aucun élément « ${expect} » ajouté` + (process.env.WDEBUG ? ` [avant ${before}, après ${types.length}, dialogue ${await page.locator("dialog[open], .pb-modal, [role=dialog]").count()}, sel ${await page.evaluate(() => window.__pb.selection().join())}, toast ${await page.locator(".pb-toast, [data-pb-toast]").allInnerTexts().then((a) => a.join("|").slice(0, 120))}]` : ""));
    }
    assert.deepEqual(failed, [], "ajout depuis la bibliothèque");
  });

  test("widgets sans équivalent déclaré : liste exacte, aucun masqué", () => {
    const none = MAP.widgets.filter((w) => !w.kolakisa).map((w) => w.name).sort();
    assert.deepEqual(none, ["Facebook Comments", "Shortcode", "Template"]);
  });
});
