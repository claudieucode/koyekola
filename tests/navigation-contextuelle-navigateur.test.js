// Navigation contextuelle dans un VRAI Chrome : « Retour à Mes sites » depuis les espaces (principal, site secondaire) et l'éditeur, menus séparés (central / site),
// et avertissement (beforeunload) quand l'éditeur a des modifications non enregistrées. SHOT_DIR (facultatif) : captures d'écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : navigation contextuelle non exécutée sur cette machine" : false;
const SHOTS = process.env.SHOT_DIR || "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }
const content = () => ({ title: "Ctx", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: "Original", level: "2" } }] }] });

describe("navigation contextuelle dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, page, A, id, dialogs, mode = "normal";
  const SP = "/marketing/site-web/sites", PR = "/marketing/site-web/principal";
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); } };
  const navLabels = () => page.locator(".mk-cms-nav a").allInnerTexts().then((l) => l.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean));
  const builderReady = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    A = Number(String((await boss.post(SP, { name: "Alpha Chrome" })).location).match(/sites\/(\d+)/)[1]);
    id = Number((await boss.post("/marketing/pages", { name: "Page Chrome", template: "", ouvrir: "editeur", site_id: String(A) })).location.match(/pages\/(\d+)/)[1]);
    srv.db().prepare("UPDATE mk_landing_pages SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(content()), id);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage(); dialogs = [];
    page.on("dialog", async (d) => { dialogs.push(d.type()); if (d.type() === "beforeunload" && mode === "stay") await d.dismiss(); else await d.accept(); });
    await page.route(/\/brouillon$/, (route) => (route.request().method() === "PUT" && mode !== "normal" ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "Erreur interne" } }) }) : route.continue()));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("Mes sites : menu central seul ; Ouvrir le principal puis un site : menus distincts, « Retour à Mes sites » ramène au gestionnaire", async () => {
    await page.goto(`${srv.base}${SP}`);
    assert.deepEqual(await navLabels(), ["Mes sites"]); await shot("ctx-1-mes-sites");
    await page.locator('tr[data-site="principal"] a', { hasText: "Ouvrir" }).click(); await page.waitForURL(`**${PR}/tableau-de-bord`);
    let labels = await navLabels(); assert.ok(labels.includes("Tableau de bord") && labels.includes("Pages") && !labels.includes("Mes sites"), labels.join("|"));
    assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Site principal" }).isVisible()); await shot("ctx-2-principal");
    await page.getByRole("link", { name: "Retour à Mes sites" }).click(); await page.waitForURL(`**${SP}`);
    assert.deepEqual(await navLabels(), ["Mes sites"]);
    await page.locator(`a[href="${SP}/${A}/tableau-de-bord"]`, { hasText: "Ouvrir" }).first().click(); await page.waitForURL(`**${SP}/${A}/tableau-de-bord`);
    labels = await navLabels(); assert.ok(labels.includes("Tableau de bord") && !labels.includes("Mes sites")); assert.ok(await page.locator(".mk-site-banner-name", { hasText: "Alpha Chrome" }).isVisible()); await shot("ctx-3-site-secondaire");
    for (const mod of ["pages", "articles", "composants"]) { await page.goto(`${srv.base}${SP}/${A}/${mod}`); await page.getByRole("link", { name: "Retour à Mes sites" }).click(); await page.waitForURL(`**${SP}`); }
  });
  test("éditeur d'une page du site : lien « Retour à Mes sites » ; avec des modifications non enregistrées, l'avertissement s'affiche et on peut rester ; une fois enregistré, retour direct", async () => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur?retour=pages`); await builderReady(); await wait(900);
    const link = page.locator("a[data-mk-back-to-sites]"); assert.equal(await link.count(), 1); assert.equal(await link.getAttribute("href"), SP);
    mode = "500"; dialogs.length = 0;
    await page.locator('[data-pb-layers] .pb-node[data-id="hed000000001"] > .pb-row-item').click(); await wait(300);
    await page.locator("[data-pb-inspector] [role=tab]", { hasText: /^Contenu$/ }).click().catch(() => {}); await wait(200);
    const i = page.locator("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea").first(); await i.fill("Modifié non enregistré"); await i.press("Tab");
    await until(async () => /Erreur d'enregistrement/.test(await page.evaluate(() => document.querySelector("[data-pb-save]").textContent)), { what: "échec d'enregistrement" });
    mode = "stay"; await link.click({ noWaitAfter: true }); await wait(800);
    assert.ok(dialogs.includes("beforeunload"), "avertissement affiché"); assert.match(page.url(), /\/editeur/, "on reste dans l'éditeur, la modification n'est pas perdue");
    mode = "normal"; dialogs.length = 0;
    await until(async () => /^Enregistré à|Tout est enregistré/.test(await page.evaluate(() => document.querySelector("[data-pb-save]").textContent)), { timeout: 30000, what: "enregistré" });
    await link.click(); await page.waitForURL(`**${SP}`); assert.ok(!dialogs.includes("beforeunload"), "aucun avertissement quand tout est enregistré");
    assert.equal(srv.db().prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(id).site_id, A);
    assert.match(String(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(id).draft), /Modifié non enregistré/, "la modification a été enregistrée");
  });
});
