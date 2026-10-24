// CADRE DU CMS (CADRE-CMS-01) : barre globale en haut ; menu latéral et rail sous elle, sur toute la hauteur disponible ; bandeau de contexte + chemin en haut de la
// zone de contenu ; plus de logo en double ; aucun débordement. Structure (HTML, CSS) puis mesures dans un vrai Chrome sur plusieurs pages réelles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mesures navigateur non exécutées sur cette machine" : false;
const SHOTS = process.env.CADRE_SHOTS || "";
const css = (f) => fs.readFileSync(path.join(__dirname, "..", "public", "css", f), "utf8");

describe("cadre du CMS : structure", () => {
  test("CSS : plus de barre de chemin globale fixe ; hauteur disponible calculée avec la hauteur réelle de la barre globale (variables du projet)", () => {
    const BAR = css("adminbar.css");
    assert.doesNotMatch(BAR, /\.kab-crumbbar \{/, "plus de barre de chemin fixe");
    assert.match(BAR, /\.is-cms \{[^}]*--kab-crumb-h: 0px/);
    assert.match(BAR, /\.is-cms \.mk-sidebar \{ top: calc\(var\(--kab-h\) \+ var\(--kab-crumb-h\)\); height: calc\(100vh - var\(--kab-h\) - var\(--kab-crumb-h\)\)/);
    assert.match(BAR, /\.is-cms \.app-rail \{ top: var\(--kab-h\); height: calc\(100vh - var\(--kab-h\)\)/);
    assert.match(BAR, /\.is-cms \.app-rail-brand \{ display: none; \}/, "logo du rail masqué dans le CMS");
    assert.doesNotMatch(css("kola-compose.css") + css("cms.css"), /\.kab-crumbbar \{[^}]*position: fixed/);
    assert.doesNotMatch(css("cms.css").slice(css("cms.css").indexOf("Chemin (fil d'Ariane) dans la zone de contenu")), /margin[^;]*: -\d/, "aucune marge négative pour superposer");
  });
});

describe("cadre du CMS (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, errors, A;
  const SP = "/marketing/site-web/sites";
  const PAGES = ["/tableau-de-bord", "/outils", "/outils/importer", "/outils/disponibles", "/outils/notes", "/articles", "/medias", "/commentaires", "/outils/diagnostic", "/pages"];
  const open = async (width, height, { collapsed = false, dark = false } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? "dark" : "light" });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    await context.addInitScript(({ collapsed, dark }) => { try { if (collapsed) localStorage.setItem("mkSidebar", "collapsed"); else localStorage.removeItem("mkSidebar"); if (dark) localStorage.setItem("kolaTheme", "dark"); } catch (e) { /* noop */ } }, { collapsed, dark });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
  const measure = (page) => page.evaluate(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; };
    const vis = (el) => !!el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().width > 0;
    const q = (s) => document.querySelector(s);
    return {
      vh: window.innerHeight, over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bar: r(q(".kab")), side: r(q(".mk-sidebar")), rail: r(q(".app-rail")), banner: r(q(".mk-site-banner")), crumbs: r(q(".mk-site-banner .mk-cms-crumbs")), content: r(q(".mk-content")),
      barBrands: [...document.querySelectorAll(".kab-brand")].filter(vis).length, railBrand: vis(q(".app-rail-brand")), sideBrand: vis(q(".mk-sidebar-head .mk-brand")), crumbBar: !!q(".kab-crumbbar"),
      firstContentChild: q(".mk-content") && q(".mk-content").firstElementChild && q(".mk-content").firstElementChild.className,
      menuBtn: vis(q(".kab-menu-btn")), sideOverflowX: q(".mk-sidebar") ? q(".mk-sidebar").scrollWidth - q(".mk-sidebar").clientWidth : 0,
    };
  });
  const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg} (${Math.round(a)} ≠ ${Math.round(b)})`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    A = Number(String((await boss.post(SP, { name: "Cadre CMS A" })).location).match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  for (const [w, h, collapsed] of [[1440, 900, false], [1440, 900, true], [1100, 760, false]]) {
    test(`${w}×${h}${collapsed ? " menu replié" : ""} : barre globale en haut, menu et rail sous elle sur toute la hauteur, bandeau de contexte en haut du contenu, un seul logo`, async () => {
      const page = await open(w, h, { collapsed });
      for (const p of PAGES) {
        await page.goto(`${srv.base}${SP}/${A}${p}`);
        await page.locator(".mk-site-banner").waitFor();
        const m = await measure(page);
        const where = `${p}`;
        close(m.bar.t, 0, 1, `${where} : la barre globale est tout en haut`);
        assert.equal(m.crumbBar, false, `${where} : plus de barre de chemin globale`);
        close(m.side.t, m.bar.b, 1.5, `${where} : le menu commence sous la barre globale`);
        close(m.side.b, m.vh, 1.5, `${where} : le menu va jusqu'au bas de la fenêtre`);
        if (m.rail) { close(m.rail.t, m.bar.b, 1.5, `${where} : le rail commence sous la barre globale`); close(m.rail.b, m.vh, 1.5, `${where} : le rail va jusqu'au bas`); }
        close(m.banner.t, m.bar.b, 1.5, `${where} : le bandeau de contexte est collé sous la barre globale`);
        close(m.banner.l, m.side.r, 1.5, `${where} : le bandeau commence à droite du menu (jamais dessous)`);
        assert.ok(m.banner.r <= w + 1, `${where} : le bandeau ne dépasse pas à droite`);
        assert.ok(m.content.l >= m.side.r - 1, `${where} : le contenu est à droite du menu`);
        assert.ok(m.crumbs && m.crumbs.l >= m.banner.l && m.crumbs.r <= m.banner.r + 1, `${where} : le chemin est dans le bandeau`);
        assert.equal(m.firstContentChild.includes("mk-site-banner"), true, `${where} : le bandeau est le premier élément du contenu`);
        assert.equal(m.barBrands, 1, `${where} : un seul logo dans la barre globale`);
        assert.equal(m.railBrand, false, `${where} : logo du rail supprimé`);
        assert.equal(m.sideBrand, false, `${where} : pas de logo dans le menu latéral`);
        assert.ok(m.over <= 0, `${where} : aucun défilement horizontal (${m.over}px)`);
        assert.ok(m.sideOverflowX <= 1, `${where} : le menu ne déborde pas horizontalement`);
      }
      await shot(page, `cadre-${w}${collapsed ? "-replie" : ""}`);
      assert.deepEqual(errors, []);
      await page.context().close();
    });
  }

  test("défilement : le menu et le rail restent sous la barre globale et sur la hauteur disponible ; le menu défile en interne seulement", async () => {
    const page = await open(1440, 600);
    await page.goto(`${srv.base}${SP}/${A}/outils/disponibles`);
    await page.locator(".mk-site-banner").waitFor();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(150);
    const m = await measure(page);
    assert.ok(m.content.t < 0, "la page a bien défilé");
    close(m.side.t, m.bar.b, 1.5, "menu collé sous la barre globale pendant le défilement");
    close(m.side.b, m.vh, 1.5, "menu jusqu'au bas pendant le défilement");
    if (m.rail) close(m.rail.b, m.vh, 1.5, "rail jusqu'au bas pendant le défilement");
    const inner = await page.locator(".mk-sidebar").evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, ov: getComputedStyle(el).overflowY }));
    assert.ok(inner.sh <= inner.ch + 1 || /auto|scroll/.test(inner.ov) || (await page.locator(".mk-sidebar .mk-cms-nav").evaluate((n) => /auto|scroll/.test(getComputedStyle(n).overflowY))), "le menu défile en interne s'il est trop long");
    await shot(page, "cadre-defile");
    await page.context().close();
  });

  test("téléphone (390 px) : bouton de menu dans la barre globale, le menu s'ouvre sous elle ; le chemin passe sous le nom du site ; aucun débordement", async () => {
    const page = await open(390, 844);
    await page.goto(`${srv.base}${SP}/${A}/outils/importer`);
    await page.locator(".mk-site-banner").waitFor();
    let m = await measure(page);
    assert.equal(m.menuBtn, true, "bouton de menu visible dans la barre globale");
    close(m.banner.t, m.bar.b, 1.5, "bandeau sous la barre globale");
    assert.ok(m.over <= 0, `aucun défilement horizontal (${m.over}px)`);
    await page.locator(".kab-menu-btn").click();
    await page.waitForSelector(".mk-sidebar.is-open");
    m = await measure(page);
    close(m.side.t, m.bar.b, 1.5, "tiroir sous la barre globale");
    close(m.side.b, m.vh, 1.5, "tiroir jusqu'au bas");
    await shot(page, "cadre-mobile-menu");
    await page.context().close();
    assert.deepEqual(errors, []);
  });

  test("mode sombre et navigation entre onglets : la structure ne bouge pas", async () => {
    const page = await open(1440, 900, { dark: true });
    await page.goto(`${srv.base}${SP}/${A}/outils/importer`);
    await page.locator(".mk-site-banner").waitFor();
    const first = await measure(page);
    for (const p of ["/articles", "/medias", "/outils/notes"]) {
      await page.click(`.mk-sidebar a[href$="${p}"], .mk-sidebar a[href*="${p}"]`).catch(async () => { await page.goto(`${srv.base}${SP}/${A}${p}`); });
      await page.locator(".mk-site-banner").waitFor();
      const m = await measure(page);
      close(m.side.t, first.side.t, 1, `${p} : le menu ne bouge pas`);
      close(m.banner.t, first.banner.t, 1, `${p} : le bandeau ne bouge pas`);
      close(m.banner.l, first.banner.l, 1, `${p} : le bandeau ne glisse pas`);
    }
    await shot(page, "cadre-sombre");
    await page.context().close();
  });
});
