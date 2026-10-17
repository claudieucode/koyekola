// Éditeur de pages — PALETTE DE COMMANDES (vrai Chrome) : en-tête avec bouton de fermeture, marges, fermeture (X, Échap, clic sur le fond, Ctrl/⌘+K),
// focus automatique et restitué, navigation clavier, sélection distincte du survol, catégories / icônes / raccourcis, recherche par synonymes,
// état vide, récentes, liste seule défilante, petit écran, ouvertures/fermetures rapides.
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

describe("palette de commandes de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId;
  const open = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ...opts });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }, null, { timeout: 30000 });
    await wait(500);
    return { ctx, page, errors };
  };
  const isOpen = (page) => page.evaluate(() => document.querySelector("[data-pb-command-dialog]").open);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    pageId = Number((await boss.post("/marketing/pages", { name: "Palette" })).location.match(/(\d+)$/)[1]);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("ouverture : focus dans le champ, centrée, marges internes, bouton de fermeture visible, rôles d'accessibilité", async () => {
    const { ctx, page, errors } = await open();
    await page.locator("[data-pb-command]").click();
    await wait(250);
    assert.ok(await isOpen(page));
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), "pb-cmd-q", "le champ a le focus sans clic");
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const d = r("[data-pb-command-dialog]"), f = r(".pb-cmd-field"), i = r(".pb-cmd-input"), x = r(".pb-cmd-head .pb-icon-btn"), l = r(".pb-cmd-list"), first = r(".pb-cmd-item");
      return { dLeft: d.left, dRight: innerWidth - d.right, dTop: d.top, fieldLeft: f.left - d.left, fieldRight: d.right - f.right, inputH: i.height, xVisible: x.width >= 28 && x.right <= d.right && x.top >= d.top, xRight: d.right - x.right, itemLeft: first.left - l.left, itemH: first.height, listTop: l.top - i.bottom, aria: document.querySelector("[data-pb-command-dialog]").getAttribute("aria-labelledby"), closeLabel: document.querySelector(".pb-cmd-head .pb-icon-btn").getAttribute("aria-label") };
    });
    assert.ok(Math.abs(m.dLeft - m.dRight) < 2, `centrée horizontalement (${m.dLeft} / ${m.dRight})`);
    assert.ok(m.fieldLeft >= 12 && m.fieldRight >= 12, `le champ n'est plus collé aux bords (${m.fieldLeft} / ${m.fieldRight})`);
    assert.ok(m.inputH >= 44, `champ haut (${m.inputH})`);
    assert.ok(m.xVisible && m.xRight >= 6, "bouton X visible, dans la boîte, dans l'en-tête");
    assert.ok(m.itemLeft >= 6 && m.itemH >= 38, `lignes aérées (${m.itemLeft} / ${m.itemH})`);
    assert.ok(m.listTop >= 8, `air entre le champ et la liste (${m.listTop})`);
    assert.equal(m.aria, "pb-cmd-title");
    assert.match(m.closeLabel, /Fermer/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("fermeture : bouton X, Échap, clic sur le fond, Ctrl+K ; un clic dedans ne ferme pas ; le focus revient à l'icône de recherche", async () => {
    const { ctx, page } = await open();
    const btn = page.locator("[data-pb-command]");
    await btn.click(); await wait(200);
    await page.locator(".pb-cmd-head .pb-icon-btn").click(); await wait(50);
    assert.ok(!(await isOpen(page)), "X ferme tout de suite");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute("data-pb-command")), true, "focus rendu à l'icône qui l'a ouverte");
    await btn.click(); await wait(200);
    await page.keyboard.press("Escape"); await wait(50);
    assert.ok(!(await isOpen(page)), "Échap ferme");
    await btn.click(); await wait(200);
    await page.locator(".pb-cmd-input").click(); await page.locator(".pb-cmd-list").click({ position: { x: 4, y: 4 }, force: true }); await page.locator(".pb-cmd-head h2").click();
    assert.ok(await isOpen(page), "cliquer dans la boîte (champ, liste, en-tête) ne ferme pas");
    await page.mouse.click(8, 500); await wait(50);
    assert.ok(!(await isOpen(page)), "clic sur le fond ferme");
    await page.keyboard.press("Control+k"); await wait(150);
    assert.ok(await isOpen(page), "Ctrl+K ouvre");
    await page.keyboard.press("Control+k"); await wait(50);
    assert.ok(!(await isOpen(page)), "Ctrl+K ferme");
    // glisser depuis l'intérieur jusqu'au fond (sélection de texte) ne ferme pas
    await btn.click(); await wait(200);
    const b = await page.locator(".pb-cmd-input").boundingBox();
    await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down(); await page.mouse.move(8, 500); await page.mouse.up();
    assert.ok(await isOpen(page), "appui dedans, relâché dehors : reste ouverte");
    await ctx.close();
  });

  test("recherche, synonymes, navigation clavier, sélection distincte du survol, Entrée exécute, état vide", async () => {
    const { ctx, page } = await open();
    await page.keyboard.press("Control+k"); await wait(200);
    const n0 = await page.locator(".pb-cmd-item").count();
    assert.ok(n0 >= 20, `commandes présentes (${n0})`);
    const cats = await page.locator(".pb-cmd-cat").allTextContents();
    assert.ok(["Créer", "Édition", "Page", "Affichage", "Interface"].every((c) => cats.includes(c)), `catégories : ${cats.join(", ")}`);
    assert.ok(await page.locator(".pb-cmd-item .pb-cmd-ico svg").count() > 5, "icônes réutilisées");
    await page.locator(".pb-cmd-input").fill("conteneur");
    const labels = await page.locator(".pb-cmd-item .pb-cmd-label").allTextContents();
    assert.ok(labels.length >= 1 && labels.every((l) => /conteneur/i.test(l)), labels.join(" | "));
    await page.locator(".pb-cmd-input").fill("container");
    assert.ok((await page.locator(".pb-cmd-item .pb-cmd-label").allTextContents()).some((l) => /Conteneur/.test(l)), "synonyme anglais");
    await page.locator(".pb-cmd-input").fill("dup");
    await page.locator(".pb-cmd-input").fill("");
    await page.locator(".pb-cmd-input").fill("ajouter");
    const active = () => page.evaluate(() => { const a = document.querySelectorAll(".pb-cmd-item.is-active"); return { n: a.length, id: a[0] && a[0].id, sel: a[0] && a[0].getAttribute("aria-selected"), ad: document.querySelector("#pb-cmd-q").getAttribute("aria-activedescendant") }; });
    assert.deepEqual(await active(), { n: 1, id: "pb-cmd-0", sel: "true", ad: "pb-cmd-0" });
    const before = await page.evaluate(() => { window.__li = document.querySelector("#pb-cmd-2"); return true; });
    await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown");
    assert.deepEqual(await active(), { n: 1, id: "pb-cmd-2", sel: "true", ad: "pb-cmd-2" });
    assert.ok(await page.evaluate(() => window.__li === document.querySelector("#pb-cmd-2")), "la navigation ne reconstruit pas la liste");
    await page.keyboard.press("ArrowUp");
    assert.equal((await active()).id, "pb-cmd-1");
    await wait(200);
    const st = await page.evaluate(() => { const a = getComputedStyle(document.querySelector(".pb-cmd-item.is-active")), o = getComputedStyle(document.querySelector("#pb-cmd-5")); return { a: a.backgroundColor, o: o.backgroundColor, h1: document.querySelector("#pb-cmd-1").offsetHeight, h5: document.querySelector("#pb-cmd-5").offsetHeight }; });
    assert.notEqual(st.a, st.o, "la ligne sélectionnée se distingue des autres");
    assert.equal(st.h1, st.h5, "même hauteur");
    await page.locator("#pb-cmd-5").hover(); await wait(150);
    const hov = await page.evaluate(() => ({ h: document.querySelector("#pb-cmd-5").offsetHeight, top: document.querySelector("#pb-cmd-6").getBoundingClientRect().top, a: getComputedStyle(document.querySelector("#pb-cmd-5")).backgroundColor }));
    assert.equal(hov.h, st.h5, "le survol ne change pas la hauteur");
    assert.notEqual(hov.a, st.o, "le survol a un retour visuel");
    await page.locator(".pb-cmd-input").fill("zzzzqx");
    assert.equal(await page.locator(".pb-cmd-item").count(), 0);
    assert.match(await page.locator(".pb-cmd-empty").textContent(), /Aucune commande trouvée[\s\S]*autre terme/);
    // Entrée exécute : « Aperçu » ouvre la fenêtre d'aperçu
    await page.locator(".pb-cmd-input").fill("aperçu");
    await page.keyboard.press("Enter"); await wait(300);
    assert.ok(!(await isOpen(page)), "la palette se ferme");
    assert.ok(await page.evaluate(() => [...document.querySelectorAll("dialog")].some((d) => d.open && d.querySelector("#pb-preview-title"))), "la commande s'est exécutée");
    await ctx.close();
  });

  test("récentes, raccourcis affichés, liste seule défilante (en-tête et champ fixes), petit écran, ouvertures rapides sans erreur", async () => {
    const { ctx, page, errors } = await open();
    await page.keyboard.press("Control+k"); await wait(200);
    await page.locator(".pb-cmd-input").fill("zoom : 100"); await page.keyboard.press("Enter"); await wait(200);
    await page.keyboard.press("Control+k"); await wait(200);
    assert.equal(await page.locator(".pb-cmd-cat").first().textContent(), "Récentes");
    assert.match(await page.locator(".pb-cmd-item .pb-cmd-label").first().innerText(), /Zoom : 100/);
    assert.ok((await page.locator(".pb-cmd-kbd").allTextContents()).some((t) => /Ctrl\+S|⌘S/.test(t)), "raccourcis à droite");
    const geo = await page.evaluate(() => { const l = document.querySelector(".pb-cmd-list"); return { scrollable: l.scrollHeight > l.clientHeight, fieldTop: document.querySelector(".pb-cmd-field").getBoundingClientRect().top }; });
    assert.ok(geo.scrollable, "la liste dépasse et défile");
    await page.evaluate(() => { document.querySelector(".pb-cmd-list").scrollTop = 400; });
    assert.equal(await page.evaluate(() => Math.round(document.querySelector(".pb-cmd-field").getBoundingClientRect().top)), Math.round(geo.fieldTop), "le champ ne bouge pas quand la liste défile");
    await page.keyboard.press("Escape");
    for (let i = 0; i < 8; i++) { await page.keyboard.press("Control+k"); await wait(40); await page.keyboard.press("Escape"); await wait(40); }
    await page.keyboard.press("Control+k"); await wait(200);
    assert.ok(await isOpen(page));
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 360, height: 420 }); await wait(200);
    await page.keyboard.press("Control+k"); await wait(250);
    const sm = await page.evaluate(() => { const d = document.querySelector("[data-pb-command-dialog]").getBoundingClientRect(), x = document.querySelector(".pb-cmd-head .pb-icon-btn").getBoundingClientRect(), i = document.querySelector(".pb-cmd-input").getBoundingClientRect(); return { l: d.left, r: d.right, t: d.top, b: d.bottom, w: innerWidth, h: innerHeight, xin: x.right <= d.right && x.top >= d.top, iin: i.left >= d.left && i.right <= d.right }; });
    assert.ok(sm.l >= 0 && sm.r <= sm.w && sm.t >= 0 && sm.b <= sm.h && sm.xin && sm.iin, JSON.stringify(sm));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test("mouvement réduit : aucune animation d'ouverture ; thème sombre : la palette suit les jetons de l'éditeur", async () => {
    const { ctx, page } = await open({ reducedMotion: "reduce" });
    await page.locator("[data-pb-command]").click(); await wait(60);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-pb-command-dialog]")).opacity), "1");
    await page.keyboard.press("Escape");
    await page.evaluate(() => { document.querySelector(".pb-body").setAttribute("data-palette", "dark"); });
    await page.keyboard.press("Control+k"); await wait(100);
    const c = await page.evaluate(() => { const g = (s, p) => getComputedStyle(document.querySelector(s))[p]; const rgb = (v) => v.match(/\d+/g).map(Number); return { bg: rgb(g("[data-pb-command-dialog]", "backgroundColor")), fg: rgb(g(".pb-cmd-label", "color")) }; });
    const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    assert.ok(lum(c.fg) > lum(c.bg) + 0.4, `texte clair sur fond sombre (${c.bg} / ${c.fg})`);
    await ctx.close();
  });
});
