// Barre principale (rail) : une seule rubrique active, clairement colorée ; menu « Créer » : fermeture nette (sans image résiduelle ni saut).
// Navigateur réel (Playwright + Chrome) : on mesure image par image ce qui reste affiché après la fermeture.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { startServer, loginInstructor } = require("./helpers.js");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("barre principale et menu « Créer » (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async (path = "/marketing", reducedMotion = "no-preference") => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.errors = [];
    page.on("pageerror", (e) => page.errors.push(String(e)));
    await page.goto(`${srv.base}${path}`);
    await page.waitForSelector(".mk-create-btn");
    return page;
  };
  // Trace image par image : le menu est-il encore rendu ? la barre latérale et le bouton bougent-ils ?
  const startTrace = (page) => page.evaluate(() => {
    const menu = document.getElementById("mk-create-menu"), btn = document.querySelector(".mk-create-btn"), side = document.getElementById("mk-sidebar");
    const rect = (e) => { const r = e.getBoundingClientRect(); return [r.top, r.left, r.width, r.height].map(Math.round).join(","); };
    window.__trace = { frames: [], on: true };
    const tick = () => { if (!window.__trace.on) return; const m = menu.getBoundingClientRect(); window.__trace.frames.push({ hidden: menu.hidden, drawn: m.width > 0 && m.height > 0, btn: rect(btn), side: rect(side) }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const stopTrace = (page) => page.evaluate(() => { window.__trace.on = false; return window.__trace.frames; });
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("rail : une seule rubrique active, fond coloré visible ; le Centre de gestion n'a plus de faux état actif", async () => {
    for (const path of ["/marketing", "/marketing/campagnes", "/formateur/messages"]) {
      const page = await open(path === "/formateur/messages" ? "/marketing" : path).catch(() => null);
      if (!page) continue;
      const info = await page.evaluate(() => {
        const links = [...document.querySelectorAll(".app-rail-link")];
        const active = links.filter((a) => a.getAttribute("aria-current") === "true");
        const bg = (a) => getComputedStyle(a).backgroundColor;
        const gest = links.find((a) => a.dataset.tip === "Centre de gestion");
        return { active: active.length, activeBg: active[0] ? bg(active[0]) : "", activeRing: active[0] ? getComputedStyle(active[0]).boxShadow : "", others: links.filter((a) => a.getAttribute("aria-current") !== "true" && bg(a) !== "rgba(0, 0, 0, 0)").map((a) => a.dataset.tip), gestBg: gest ? bg(gest) : null };
      });
      assert.equal(info.active, 1, `${path} : une seule rubrique active`);
      assert.notEqual(info.activeBg, "rgba(0, 0, 0, 0)", "la rubrique active a un fond");
      assert.match(info.activeRing, /inset/, "liseré d'accent comme le menu du module");
      assert.deepEqual(info.others, [], "aucune autre icône n'a un fond d'état actif");
      if (info.gestBg !== null) assert.equal(info.gestBg, "rgba(0, 0, 0, 0)", "le Centre de gestion n'a pas de fond permanent");
      assert.deepEqual(page.errors, []);
      await page.context().close();
    }
  });

  test("rail : l'état actif suit la route (rechargement, précédent / suivant), pas le dernier clic", async () => {
    const page = await open("/marketing");
    const activeTip = () => page.evaluate(() => [...document.querySelectorAll(".app-rail-link[aria-current='true']")].map((a) => a.dataset.tip));
    const first = await activeTip();
    assert.equal(first.length, 1);
    await page.reload(); await page.waitForSelector(".mk-create-btn");
    assert.deepEqual(await activeTip(), first, "après rechargement");
    await page.goto(`${srv.base}/marketing/campagnes`); await page.waitForSelector(".mk-create-btn");
    assert.equal((await activeTip()).length, 1, "autre page : toujours une seule rubrique active");
    await page.goBack(); await page.waitForSelector(".mk-create-btn");
    assert.deepEqual(await activeTip(), first, "après retour arrière");
    await page.context().close();
  });

  for (const how of ["Échap", "clic extérieur", "second clic sur le bouton"]) {
    test(`menu « Créer » : fermeture par ${how} — rien ne reste affiché à l'image suivante, la barre ne bouge pas`, async () => {
      const page = await open();
      await page.click(".mk-create-btn");
      await page.waitForFunction(() => document.getElementById("mk-create-menu").getBoundingClientRect().height > 100);
      await page.waitForTimeout(350); // fin de l'animation d'entrée
      await startTrace(page);
      await page.waitForTimeout(100);
      if (how === "Échap") await page.keyboard.press("Escape");
      else if (how === "clic extérieur") await page.mouse.click(900, 600);
      else await page.click(".mk-create-btn");
      await page.waitForTimeout(450);
      const frames = await stopTrace(page);
      const closedAt = frames.findIndex((f) => f.hidden);
      assert.ok(closedAt >= 0, "le menu se ferme");
      assert.deepEqual(frames.slice(closedAt).filter((f) => f.drawn), [], "dès qu'il est fermé, le menu n'est plus dessiné (pas de fondu à une autre position)");
      assert.equal(new Set(frames.map((f) => f.side)).size, 1, "la barre latérale ne change ni de taille ni de position");
      assert.equal(new Set(frames.slice(Math.max(0, closedAt - 1)).map((f) => f.btn)).size, 1, "à la fermeture, le bouton « Créer » ne bouge pas (même sous le pointeur)");
      assert.equal(await page.getAttribute(".mk-create-btn", "aria-expanded"), "false");
      assert.deepEqual(page.errors, []);
      await page.context().close();
    });
  }

  test("menu « Créer » : ouvertures et fermetures rapides, jamais deux ouvertures ; une option mène à sa page", async () => {
    const page = await open();
    for (let i = 0; i < 8; i++) await page.click(".mk-create-btn", { delay: 0 });
    assert.equal(await page.evaluate(() => document.getElementById("mk-create-menu").hidden), true, "8 clics : fermé");
    await page.click(".mk-create-btn");
    assert.equal(await page.evaluate(() => document.querySelectorAll(".mk-create-menu:not([hidden])").length), 1);
    // interagir dans le menu ne le ferme pas
    await page.hover("#mk-create-menu a:nth-child(2)");
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.evaluate(() => document.getElementById("mk-create-menu").hidden), false);
    const href = await page.getAttribute("#mk-create-menu a:nth-child(1)", "href");
    await Promise.all([page.waitForURL((u) => u.pathname === new URL(href, srv.base).pathname), page.click("#mk-create-menu a:nth-child(1)")]);
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });

  test("mouvement réduit : le menu s'ouvre et se ferme sans animation ni image résiduelle", async () => {
    const page = await open("/marketing", "reduce");
    await page.click(".mk-create-btn");
    await page.waitForFunction(() => document.getElementById("mk-create-menu").getBoundingClientRect().height > 100);
    await startTrace(page);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const frames = await stopTrace(page);
    assert.deepEqual(frames.filter((f) => f.hidden && f.drawn), []);
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById("mk-create-menu")).animationName), "none");
    await page.context().close();
  });
});
