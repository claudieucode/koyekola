// Navigation principale illustrée (rail / dock) dans un VRAI Chrome : icônes illustrées pour chaque rubrique du rail, liens et noms accessibles inchangés,
// grossissement discret au survol (pas de changement de mise en page, coupé en mouvement réduit), entrée active visible sans animation, focus clavier visible,
// dock en bas (option, grands écrans), barre rapide des téléphones et tablettes avec « Plus ». Ignoré avec la raison si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const dashboard = require("../src/services/dashboard");
const { GLYPHS } = require("../src/utils/dockIcons");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("navigation principale illustrée (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async (opts = {}, route = "/marketing", init = "") => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    await page.goto(`${srv.base}${route}`, { waitUntil: "load" }); await page.waitForTimeout(400);
    return { context, page };
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("chaque rubrique du rail a son icône illustrée, avec le même lien et le même nom accessible qu'avant", async () => {
    const items = dashboard.NAV.flatMap((g) => g.items);
    for (const it of items) assert.ok(GLYPHS[it.key], `icône illustrée manquante pour « ${it.key} »`);
    const { context, page } = await open();
    const links = await page.evaluate(() => [...document.querySelectorAll(".app-rail-list .app-rail-link")].map((a) => ({ href: a.getAttribute("href"), label: a.getAttribute("aria-label"), tile: !!a.querySelector("svg.dk"), hidden: a.querySelector("svg").getAttribute("aria-hidden") })));
    assert.equal(links.length, items.length);
    items.forEach((it, i) => { assert.equal(links[i].href, it.href); assert.ok(links[i].label.startsWith(it.label), `nom accessible de « ${it.key} » : ${links[i].label}`); assert.ok(links[i].tile, `tuile de « ${it.key} »`); assert.equal(links[i].hidden, "true"); });
    await context.close();
  });

  test("grossissement au survol : 1,16 (voisines 1,06), sans modifier la mise en page ; absent en mouvement réduit", async () => {
    const { context, page } = await open();
    const box = () => page.evaluate(() => [...document.querySelectorAll(".app-rail-list .app-rail-link")].slice(3, 8).map((a) => ({ w: a.offsetWidth, h: a.offsetHeight, top: a.offsetTop, t: getComputedStyle(a).transform })));
    const before = await box();
    await page.locator(".app-rail-list .app-rail-link").nth(5).hover(); await page.waitForTimeout(400);
    const during = await box();
    assert.match(during[2].t, /matrix\(1\.16/); assert.match(during[1].t, /matrix\(1\.06/); assert.match(during[3].t, /matrix\(1\.06/);
    assert.deepEqual(during.map((b) => [b.w, b.h, b.top]), before.map((b) => [b.w, b.h, b.top]), "la mise en page (taille et position) ne doit pas bouger");
    await context.close();
    const calm = await open({ reducedMotion: "reduce" });
    await calm.page.locator(".app-rail-list .app-rail-link").nth(5).hover(); await calm.page.waitForTimeout(300);
    assert.equal(await calm.page.evaluate(() => getComputedStyle(document.querySelectorAll(".app-rail-list .app-rail-link")[5]).transform), "none");
    await calm.context.close();
  });

  test("entrée active visible sans animation (anneau), focus clavier visible, infobulle au survol", async () => {
    const { context, page } = await open({ reducedMotion: "reduce" });
    const active = await page.evaluate(() => { const a = document.querySelector('.app-rail-link[aria-current="true"]'); const cs = getComputedStyle(a); return { name: a.getAttribute("aria-label"), outline: cs.outlineStyle + " " + cs.outlineWidth }; });
    assert.equal(active.name, "Marketing"); assert.match(active.outline, /solid 2px/);
    await page.keyboard.press("Tab");
    let focused = null;
    for (let i = 0; i < 30 && !focused; i += 1) { const f = await page.evaluate(() => { const e = document.activeElement; if (!e || !e.classList.contains("app-rail-link")) return null; const cs = getComputedStyle(e); return { outline: cs.outlineStyle + " " + cs.outlineWidth, label: e.getAttribute("aria-label") }; }); if (f) focused = f; else await page.keyboard.press("Tab"); }
    assert.ok(focused, "le focus clavier doit atteindre le rail"); assert.match(focused.outline, /solid 3px/);
    await page.locator(".app-rail-list .app-rail-link").nth(2).hover(); await page.waitForTimeout(250);
    const tip = await page.evaluate(() => { const a = document.querySelectorAll(".app-rail-list .app-rail-link")[2]; return { attr: a.getAttribute("data-tip"), after: getComputedStyle(a, "::after").content }; });
    assert.ok(tip.attr && tip.after.includes(tip.attr), `infobulle : ${JSON.stringify(tip)}`);
    await context.close();
  });

  test("dock en bas (option, ≥ 1360 px) : centré sur la zone de contenu, sans recouvrir le menu ; choix mémorisé ; retour à gauche", async () => {
    const { context, page } = await open({}, "/marketing/site-web");
    await page.click("[data-dock-pos]"); await page.waitForTimeout(300);
    const g = await page.evaluate(() => { const r = document.querySelector(".app-rail").getBoundingClientRect(), s = document.querySelector(".mk-sidebar").getBoundingClientRect(), pad = parseFloat(getComputedStyle(document.querySelector(".mk-main")).paddingBottom); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, vw: innerWidth, vh: innerHeight, sidebarRight: s.right, pad, mode: document.documentElement.getAttribute("data-kb-dock") }; });
    assert.equal(g.mode, "bottom"); assert.ok(g.left >= g.sidebarRight, `le dock recouvre le menu latéral (${g.left} < ${g.sidebarRight})`); assert.ok(g.right <= g.vw && g.bottom <= g.vh, "dans la fenêtre"); assert.ok(g.pad >= 90, "le contenu réserve la hauteur du dock");
    await page.reload({ waitUntil: "load" }); assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kb-dock")), "bottom", "le choix est mémorisé");
    await page.click("[data-dock-pos]"); assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kb-dock")), null, "retour à gauche");
    await context.close();
  });

  test("téléphone et tablette : barre rapide de 5 entrées (4 destinations + Plus), « Plus » ouvre le menu complet, aucun défilement horizontal", async () => {
    for (const [width, height] of [[390, 800], [768, 1000]]) {
      const { context, page } = await open({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const m = await page.evaluate(() => { const b = document.querySelector(".app-dock-m"), cs = getComputedStyle(b), r = b.getBoundingClientRect(); return { display: cs.display, bottom: Math.round(r.bottom), vh: innerHeight, n: b.children.length, minH: Math.min(...[...b.children].map((c) => c.getBoundingClientRect().height)), minW: Math.min(...[...b.children].map((c) => c.getBoundingClientRect().width)), railHidden: getComputedStyle(document.querySelector(".app-rail")).visibility, over: document.documentElement.scrollWidth - innerWidth }; });
      assert.equal(m.display, "flex", `barre visible à ${width} px`); assert.equal(m.n, 5); assert.equal(m.bottom, m.vh, "collée en bas"); assert.ok(m.minH >= 48 && m.minW >= 48, `cibles ${m.minW}×${m.minH}`); assert.equal(m.railHidden, "hidden"); assert.ok(m.over <= 1, `débordement ${m.over}`);
      await page.tap("[data-dock-more]"); await page.waitForTimeout(500);
      assert.ok(await page.evaluate(() => document.querySelector(".mk-sidebar").classList.contains("is-open")), "« Plus » doit ouvrir le menu complet");
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".app-dock-m")).display), "none", "la barre s'efface quand le tiroir est ouvert");
      await context.close();
    }
    const wide = await open({ viewport: { width: 1024, height: 800 } });
    assert.equal(await wide.page.evaluate(() => getComputedStyle(document.querySelector(".app-dock-m")).display), "none", "pas de barre rapide quand le rail est visible");
    await wide.context.close();
  });
});
