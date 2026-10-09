// Font Manager dans un VRAI Chrome : chaque famille de la bibliothèque se charge réellement (rendu, pas seulement un fichier), le
// sélecteur de l'éditeur de pages (recherche, choix, enregistrement, canevas, rafraîchissement F5), le sélecteur de l'éditeur d'e-mails.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const fonts = require("../src/utils/fontLibrary");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("Font Manager (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, emailId;
  const db = () => srv.db();
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    pageId = Number((await boss.post("/marketing/pages", { name: "Polices" })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre de test", level: 1 } }, { id: "text00000001", type: "text", props: { html: "<p>Paragraphe</p>" } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } })).status, 200);
    emailId = Number((await boss.post("/marketing/modeles", { name: "Polices e-mail", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("VALIDATION : chacune des familles de la bibliothèque se charge et se rend réellement dans Chrome", async () => {
    const p = await context.newPage();
    await p.goto(`${srv.base}/polices/manifeste.json`);
    const ids = fonts.list().map((f) => f.id);
    const result = await p.evaluate(async (all) => {
      const failed = [];
      for (let i = 0; i < all.length; i += 40) {
        const batch = all.slice(i, i + 40);
        const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/polices.css?f=" + batch.join(",");
        await new Promise((res, rej) => { link.onload = res; link.onerror = rej; document.head.appendChild(link); });
      }
      const m = await (await fetch("/polices/manifeste.json")).json();
      await Promise.all(m.families.map(async (f) => {
        try {
          const w = f.weights.includes(400) ? 400 : f.weights[0];
          const got = await document.fonts.load(`${w} 24px '${f.family}'`, "Abc éàç");
          if (!got.length || !got.some((x) => x.status === "loaded")) failed.push(f.family);
        } catch { failed.push(f.family); }
      }));
      return { failed, total: m.families.length, loaded: [...document.fonts].filter((x) => x.status === "loaded").length };
    }, ids);
    assert.deepEqual(result.failed, [], `familles non chargées : ${result.failed.slice(0, 10).join(", ")}`);
    assert.ok(result.total >= 360 && result.loaded >= result.total, `${result.loaded} faces chargées pour ${result.total} familles`);
    // Rendu réel : la même phrase mesurée avec une police de la bibliothèque est plus large qu'avec le repli, et deux polices diffèrent
    const widths = await p.evaluate(() => {
      const w = (family) => { const s = document.createElement("span"); s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:32px ${family}`; s.textContent = "The quick brown fox jumps over the lazy dog"; document.body.appendChild(s); const r = s.getBoundingClientRect().width; s.remove(); return r; };
      return { inter: w("'Inter', serif"), lobster: w("'Lobster', serif"), mono: w("'Roboto Mono', serif"), fallback: w("serif") };
    });
    assert.ok(new Set([widths.inter, widths.lobster, widths.mono, widths.fallback].map(Math.round)).size === 4, JSON.stringify(widths));
    await p.close();
  });

  test("éditeur de pages : le sélecteur propose la bibliothèque, recherche, choix, enregistrement stable, canevas, F5", async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await page.locator(`[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item`).click();
    const ctx = page.locator("[data-pb-context] .kf-btn");
    await ctx.waitFor();
    await ctx.click();
    const panel = page.locator(".kf-panel");
    await panel.waitFor();
    // liste virtualisée : une fenêtre de lignes seulement, jamais la bibliothèque entière
    await until(async () => { const n = await panel.locator(".kf-row").count(); return n >= 8 && n <= 40; }, { what: "liste affichée (fenêtre de lignes)" });
    assert.match(await panel.locator(".kf-foot").textContent(), /sur \d+ dans la bibliothèque/);
    // recherche instantanée : nom, puis mot de catégorie
    await panel.locator(".kf-search").fill("mont");
    await until(async () => (await panel.locator(".kf-name").allTextContents()).some((t) => t === "Montserrat"), { what: "Montserrat trouvé" });
    await panel.locator(".kf-search").fill("script");
    await until(async () => { const n = Number(((await panel.locator(".kf-foot").textContent()).match(/^(\d+) police/) || [])[1]); return n > 5 && n < 800; }, { what: "cursives trouvées" });
    await panel.locator(".kf-search").fill("monospace");
    await until(async () => (await panel.locator(".kf-name").allTextContents()).includes("Roboto Mono"), { what: "monospace" });
    // l'aperçu d'une ligne utilise sa propre famille (chargée à la demande)
    await panel.locator(".kf-search").fill("Playfair");
    const row = panel.locator('.kf-pick[data-font="font.playfair-display"]');
    await row.waitFor();
    await until(() => page.evaluate(() => document.fonts.check("16px 'Playfair Display'")), { what: "aperçu chargé à la demande" });
    assert.match(await row.locator(".kf-sample").evaluate((e) => getComputedStyle(e).fontFamily), /Playfair Display/);
    await panel.locator(".kf-search").fill("Montserrat");
    await panel.locator('.kf-pick[data-font="font.montserrat"]').click();
    // enregistré par identifiant stable
    const draft = () => { const r = db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : null; };
    const find = (list, id) => { for (const x of list || []) { if (x.id === id) return x; const f = find(x.children, id); if (f) return f; } return null; };
    await until(() => { const d = draft(); const n = d && find(d.sections, "head00000001"); return n && n.styles && n.styles.desktop && n.styles.desktop.fontFamily === "font.montserrat"; }, { what: "police enregistrée dans le brouillon" });
    // canevas : le titre est réellement rendu avec Montserrat
    const frame = page.frameLocator("[data-pb-frame]");
    await until(async () => /Montserrat/.test(await frame.locator('[data-node-id="head00000001"]').first().evaluate((e) => getComputedStyle(e).fontFamily)), { what: "titre rendu en Montserrat dans le canevas" });
    await until(() => frame.locator("h1").first().evaluate(() => document.fonts.check("16px 'Montserrat'")), { what: "fichier Montserrat chargé dans le canevas" });
    // F5 : la police est toujours là (brouillon et bouton)
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(500);
    await page.locator(`[data-pb-layers] .pb-node[data-id="head00000001"] > .pb-row-item`).click();
    await until(async () => (await page.locator("[data-pb-context] .kf-btn .kf-btn-name").textContent()) === "Montserrat", { what: "Montserrat toujours sélectionné après F5" });
    assert.equal(find(draft().sections, "head00000001").styles.desktop.fontFamily, "font.montserrat");
    assert.deepEqual(errors, []);
  });

  test("éditeur d'e-mails : police principale choisie dans la bibliothèque, enregistrée, avec repli ; aperçu rendu", async () => {
    await page.goto(`${srv.base}/marketing/modeles/${emailId}`);
    await page.waitForSelector("#t-font.kf-btn", { state: "attached" });
    // l'onglet « Styles » contient le champ : on l'ouvre comme l'auteur
    const tab = page.locator('[data-mk-tab="styles"], #mk-tab-styles, button:has-text("Styles")').first();
    if (await tab.count()) await tab.click().catch(() => {});
    const btn = page.locator("#t-font");
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ force: true });
    const panel = page.locator(".kf-panel");
    await panel.waitFor();
    await until(async () => (await panel.locator(".kf-row").count()) >= 8, { what: "liste" });
    assert.match(await panel.locator(".kf-meta").nth(0).textContent(), /e-mail compatible|réglage du site/);
    await panel.locator(".kf-search").fill("Lora");
    const pick = panel.locator('.kf-pick[data-font="font.lora"]');
    await pick.waitFor();
    assert.match(await pick.locator(".kf-meta").textContent(), /e-mail : compatibilité limitée/, "honnêteté sur la compatibilité e-mail");
    await pick.click();
    await page.click("#mk-save");
    await until(() => page.evaluate(() => /Enregistré/.test(document.getElementById("mk-status").textContent)), { what: "enregistrement" });
    const saved = JSON.parse(db().prepare("SELECT theme FROM mk_templates WHERE id = ?").get(emailId).theme);
    assert.equal(saved.fontFamily, "font.lora");
    await page.reload();
    await page.waitForSelector("#t-font.kf-btn", { state: "attached" });
    await until(async () => (await page.locator("#t-font .kf-btn-name").textContent()) === "Lora", { what: "Lora toujours sélectionné après F5" });
    assert.deepEqual(errors, []);
  });
});
