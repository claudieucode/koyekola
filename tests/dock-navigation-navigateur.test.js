// Navigation principale (rail / dock) dans un VRAI Chrome : icônes d'origine conservées (aucune tuile illustrée ni colorée), mêmes liens et noms accessibles, barre en bas par défaut sur
// grand écran (retour à gauche mémorisé), grossissement discret au survol (aucun changement de mise en page, coupé en mouvement réduit), entrée active visible, focus clavier visible,
// barre rapide des téléphones et tablettes avec « Plus ». Ignoré avec la raison si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const dashboard = require("../src/services/dashboard");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("navigation principale (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async (opts = {}, route = "/marketing", init = "") => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    await page.goto(`${srv.base}${route}`, { waitUntil: "load" }); await page.waitForTimeout(400);
    return { context, page };
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("chaque rubrique du rail garde son icône d'origine (trait simple, sans tuile ni couleur ajoutée), avec le même lien et le même nom accessible", async () => {
    const items = dashboard.NAV.flatMap((g) => g.items);
    const { context, page } = await open();
    const links = await page.evaluate(() => [...document.querySelectorAll(".app-rail-list .app-rail-link")].map((a) => ({ href: a.getAttribute("href"), label: a.getAttribute("aria-label"), svg: !!a.querySelector("svg"), tile: !!a.querySelector(".dk, .dk-tile"), bg: getComputedStyle(a).backgroundColor })));
    assert.equal(links.length, items.length);
    items.forEach((it, i) => { assert.equal(links[i].href, it.href); assert.ok(links[i].label.startsWith(it.label), `nom accessible de « ${it.key} » : ${links[i].label}`); assert.ok(links[i].svg, `icône manquante pour « ${it.key} »`); assert.equal(links[i].tile, false, `tuile illustrée présente pour « ${it.key} »`); });
    assert.equal(await page.evaluate(() => document.querySelectorAll(".dk, .dk-tile").length), 0, "aucune icône illustrée dans la page");
    await context.close();
  });

  test("barre en bas par défaut (≥ 1280 px) : centrée sur la zone de contenu, sans recouvrir le menu ; retour à gauche mémorisé", async () => {
    const { context, page } = await open({}, "/marketing/site-web");
    const g = await page.evaluate(() => { const r = document.querySelector(".app-rail").getBoundingClientRect(), s = document.querySelector(".mk-sidebar").getBoundingClientRect(); return { mode: document.documentElement.getAttribute("data-kb-dock"), left: r.left, right: r.right, bottom: r.bottom, h: r.height, w: r.width, sidebarRight: s.right, vw: innerWidth, vh: innerHeight }; });
    assert.equal(g.mode, "bottom"); assert.ok(g.h < 90 && g.w > 300, `barre horizontale compacte (${g.w}×${g.h})`); assert.ok(g.left >= g.sidebarRight - 1, `la barre recouvre le menu latéral (${g.left} < ${g.sidebarRight})`); assert.ok(g.right <= g.vw && g.bottom <= g.vh, "dans la fenêtre");
    await page.click("[data-dock-pos]"); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kb-dock")), null, "retour à gauche");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".app-rail")).flexDirection), "column");
    await page.reload({ waitUntil: "load" }); assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kb-dock")), null, "le choix « à gauche » est mémorisé");
    await page.click("[data-dock-pos]"); assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-kb-dock")), "bottom");
    await context.close();
  });

  test("grossissement au survol : 1,18 (voisines 1,07), sans modifier la mise en page ; absent en mouvement réduit", async () => {
    const { context, page } = await open();
    const box = () => page.evaluate(() => [...document.querySelectorAll(".app-rail-list .app-rail-link")].slice(3, 8).map((a) => ({ w: a.offsetWidth, h: a.offsetHeight, top: a.offsetTop, left: a.offsetLeft, t: getComputedStyle(a).transform })));
    const before = await box();
    await page.locator(".app-rail-list .app-rail-link").nth(5).hover(); await page.waitForTimeout(400);
    const during = await box();
    assert.match(during[2].t, /matrix\(1\.18/); assert.match(during[1].t, /matrix\(1\.07/); assert.match(during[3].t, /matrix\(1\.07/);
    assert.deepEqual(during.map((b) => [b.w, b.h, b.top, b.left]), before.map((b) => [b.w, b.h, b.top, b.left]), "la mise en page (taille et position) ne doit pas bouger");
    await page.mouse.move(700, 300); await page.waitForTimeout(400);
    assert.equal((await box())[2].t, "none", "l'icône retrouve sa taille");
    await context.close();
    const calm = await open({ reducedMotion: "reduce" });
    await calm.page.locator(".app-rail-list .app-rail-link").nth(5).hover(); await calm.page.waitForTimeout(300);
    assert.equal(await calm.page.evaluate(() => getComputedStyle(document.querySelectorAll(".app-rail-list .app-rail-link")[5]).transform), "none");
    await calm.context.close();
  });

  test("entrée active visible, focus clavier visible, infobulle au survol (au-dessus de l'icône en bas)", async () => {
    const { context, page } = await open({ reducedMotion: "reduce" });
    const active = await page.evaluate(() => { const a = document.querySelector('.app-rail-link[aria-current="true"]'); const cs = getComputedStyle(a); return { name: a.getAttribute("aria-label"), bg: cs.backgroundColor, dot: getComputedStyle(a, "::before").content }; });
    assert.equal(active.name, "Marketing"); assert.notEqual(active.bg, "rgba(0, 0, 0, 0)"); assert.notEqual(active.dot, "none");
    let focused = null;
    for (let i = 0; i < 40 && !focused; i += 1) { await page.keyboard.press("Tab"); focused = await page.evaluate(() => { const e = document.activeElement; if (!e || !e.classList.contains("app-rail-link")) return null; const cs = getComputedStyle(e); return { outline: cs.outlineStyle + " " + cs.outlineWidth }; }); }
    assert.ok(focused, "le focus clavier doit atteindre la barre"); assert.match(focused.outline, /solid 2px/);
    await page.locator(".app-rail-list .app-rail-link").nth(2).hover(); await page.waitForTimeout(250);
    const tip = await page.evaluate(() => { const a = document.querySelectorAll(".app-rail-list .app-rail-link")[2]; const r = a.getBoundingClientRect(); return { attr: a.getAttribute("data-tip"), after: getComputedStyle(a, "::after").content, bottom: parseFloat(getComputedStyle(a, "::after").bottom), top: r.top }; });
    assert.ok(tip.attr && tip.after.includes(tip.attr), `infobulle : ${JSON.stringify(tip)}`);
    await context.close();
  });

  test("téléphone et tablette : barre rapide de 5 entrées (4 destinations + Plus) aux icônes d'origine, « Plus » ouvre le menu complet, aucun défilement horizontal", async () => {
    for (const [width, height] of [[320, 640], [390, 800], [768, 1000]]) {
      const { context, page } = await open({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const m = await page.evaluate(() => { const b = document.querySelector(".app-dock-m"), cs = getComputedStyle(b), r = b.getBoundingClientRect(); const links = [...b.querySelectorAll(".app-dock-m-link")]; return { display: cs.display, bottom: Math.round(r.bottom), vh: innerHeight, n: links.length, minH: Math.min(...links.map((l) => l.getBoundingClientRect().height)), minW: Math.min(...links.map((l) => l.getBoundingClientRect().width)), svgs: links.every((l) => l.querySelector("svg")), tiles: b.querySelectorAll(".dk").length, scrollX: document.documentElement.scrollWidth > innerWidth }; });
      assert.equal(m.display, "flex", `barre visible à ${width} px`); assert.equal(m.n, 5); assert.equal(m.bottom, m.vh, "collée en bas"); assert.ok(m.minH >= 48 && m.minW >= 48 || width === 320 && m.minH >= 48 && m.minW >= 44, `cibles ${m.minW}×${m.minH}`); assert.ok(m.svgs && m.tiles === 0, "icônes d'origine"); assert.equal(m.scrollX, false, "aucun défilement horizontal");
      await page.tap("[data-dock-more]"); await page.waitForTimeout(500);
      assert.ok(await page.evaluate(() => document.querySelector(".mk-sidebar").classList.contains("is-open")), "« Plus » doit ouvrir le menu complet");
      assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".app-dock-m")).display), "none", "la barre s'efface quand le tiroir est ouvert");
      await context.close();
    }
    const wide = await open({ viewport: { width: 1024, height: 800 } });
    assert.equal(await wide.page.evaluate(() => getComputedStyle(document.querySelector(".app-dock-m")).display), "none", "pas de barre rapide quand le rail est visible");
    assert.equal(await wide.page.evaluate(() => getComputedStyle(document.querySelector(".app-rail")).flexDirection), "column", "sous 1280 px la barre reste verticale");
    await wide.context.close();
  });
});
