// Grille de l'interface d'administration : UNE définition des marges (barres, fil d'Ariane, contenu) et UN conteneur centré dans la zone de travail.
// Volet statique (CSS) : les marges viennent des jetons --kg-*, jamais de valeurs fixes dupliquées. Volet navigateur (ignoré sans Playwright / Chrome) :
// marges mesurées dans un vrai Chrome — barre et fil d'Ariane alignés, contenu symétrique dans la zone de travail, formulaires centrés, aucun débordement horizontal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const css = (f) => fs.readFileSync(path.join(__dirname, "..", "public", "css", f), "utf8");
const MK = css("marketing.css"), UI = css("kola-ui.css"), BAR = css("adminbar.css");

describe("grille : jetons et règles uniques (CSS)", () => {
  test("les jetons de la grille existent et s'adaptent à cinq largeurs d'écran, sans jamais valoir 0", () => {
    assert.match(MK, /:root \{ --kg-gutter: 20px; --kg-pad: 24px; --kg-max: 2400px; --kg-max-form: 1280px; \}/);
    for (const mq of ["(max-width: 1180px)", "(max-width: 860px)", "(max-width: 480px)"]) assert.ok(MK.includes(`@media ${mq} { :root { --kg-gutter:`), mq);
    for (const [, v] of MK.matchAll(/--kg-(?:gutter|pad): (\d+)px/g)) assert.ok(Number(v) >= 12, `marge latérale trop petite : ${v}px`);
  });
  test("le contenu et la barre du haut lisent les jetons : plus de marge latérale fixe, ni de redéfinition par largeur", () => {
    assert.match(MK, /\.mk-content \{ padding: 20px var\(--kg-pad\) 56px; max-width: var\(--kg-max\); width: 100%; margin-inline: auto;/);
    assert.match(UI, /\.mk-content \{ padding: 20px var\(--kg-pad\) 56px; max-width: var\(--kg-max\); \}/);
    assert.match(UI, /\.mk-content--form \{ max-width: var\(--kg-max-form\); \}/);
    for (const src of [MK, UI]) {
      assert.doesNotMatch(src, /\.mk-content \{[^}]*padding: \d+px \d+px/, "marge latérale fixe sur .mk-content");
      assert.doesNotMatch(src, /\.mk-topbar \{[^}]*padding: 8px (?:10|12|20|32|40)px/, "marge latérale fixe sur .mk-topbar");
    }
    assert.match(BAR, /\.kab \{[^}]*padding: 0 var\(--kg-gutter\)/);
    assert.doesNotMatch(BAR, /\.kab-crumbbar \{/, "plus de barre de chemin globale (CADRE-CMS-01)");
    assert.doesNotMatch(BAR, /\.kab \{ padding: 0 6px/);
  });
  test("le gabarit accepte « layout » (form | wide) et ignore toute autre valeur", () => {
    const top = fs.readFileSync(path.join(__dirname, "..", "views", "marketing", "partials", "top.ejs"), "utf8");
    assert.match(top, /class="mk-content<%= typeof layout !== "undefined" && \/\^\(form\|wide\)\$\/\.test\(layout\)/);
    for (const f of ["settings-group", "settings-advanced", "ai-settings", "send-settings", "sms-settings", "social-settings"]) assert.match(fs.readFileSync(path.join(__dirname, "..", "views", "marketing", `${f}.ejs`), "utf8"), /layout: "form"/, f);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mesures navigateur non exécutées sur cette machine" : false;

describe("grille : marges mesurées dans un vrai navigateur", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, db;
  const PAGES = ["/marketing/site-web/sites", "/marketing/site-web/articles", "/marketing/pages", "/marketing/site-web/parametres", "/marketing/site-web/themes", "/marketing/site-web/widgets"];
  const measure = () => page.evaluate(() => {
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) }; };
    const q = (s) => document.querySelector(s);
    const bar = q(".kab-left"), barR = q(".kab-right"), crumb = q(".mk-cms-crumbs"), content = q(".mk-content"), side = q(".mk-sidebar");
    const cs = getComputedStyle(content);
    return { vw: window.innerWidth, over: document.documentElement.scrollWidth - window.innerWidth, bar: box(bar), barR: box(barR), crumb: box(crumb), content: box(content), side: box(side), padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight), form: /mk-content--form/.test(content.className) };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
  });
  after(async () => { if (browser) await browser.close(); if (srv) { db.close(); await srv.stop(); } });

  for (const [w, gutter] of [[2560, 32], [1920, 32], [1440, 24], [1024, 20], [390, 12]]) {
    test(`${w} px : barre et fil d'Ariane alignés sur la même marge (${gutter}px), contenu symétrique, marges jamais nulles, aucun débordement`, async () => {
      await page.setViewportSize({ width: w, height: 900 });
      for (const url of PAGES) {
        await page.goto(srv.base + url); await page.locator(".mk-content").waitFor();
        const m = await measure();
        assert.equal(m.over, 0, `${url} : défilement horizontal de ${m.over}px`);
        assert.equal(m.bar.l, gutter, `${url} : marge gauche de la barre`);
        assert.equal(m.vw - m.barR.r, gutter, `${url} : marge droite de la barre`);
        if (w > 480 && m.crumb) assert.ok(m.crumb.l >= m.content.l && m.crumb.r <= m.content.r, `${url} : le fil d'Ariane reste dans la zone de contenu`);
        assert.ok(m.padL >= 16 && m.padR >= 16, `${url} : marge latérale du contenu ${m.padL}/${m.padR}`);
        const left = m.content.l - m.side.r, right = m.vw - m.content.r;
        assert.ok(Math.abs(left - right) <= 1 || w <= 1440, `${url} : contenu non centré dans la zone de travail (${left} / ${right})`);
        if (w >= 1920) assert.ok(m.content.w <= (m.form ? 1200 : 1600), `${url} : conteneur trop large (${m.content.w})`);
      }
    });
  }

  test("formulaire (Paramètres) : colonne de 1200 px au plus, centrée dans la zone de travail ; les pages de données gardent toute la largeur utile", async () => {
    await page.setViewportSize({ width: 2560, height: 1000 });
    await page.goto(srv.base + "/marketing/site-web/parametres"); await page.locator(".mk-content").waitFor();
    const f = await measure();
    assert.equal(f.form, true); assert.equal(f.content.w, 1200);
    assert.ok(Math.abs((f.content.l - f.side.r) - (f.vw - f.content.r)) <= 1, "formulaire centré");
    await page.goto(srv.base + "/marketing/site-web/articles"); await page.locator(".mk-content").waitFor();
    const d = await measure();
    assert.equal(d.form, false); assert.equal(d.content.w, 1600);
    assert.ok(Math.abs((d.content.l - d.side.r) - (d.vw - d.content.r)) <= 1, "page de données centrée");
  });

  test("outils plein cadre (éditeur de pages) : l'espace de travail n'est pas réduit", async () => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    const id = Number((await boss.post("/marketing/pages", { name: "Grille" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await page.waitForLoadState("load");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.equal(over, 0);
  });
});
