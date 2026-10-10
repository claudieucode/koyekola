// Éditeur de pages — MOUVEMENT (vrai Chrome) : panneaux sans transition de grille ni écriture par pixel, jetons et mouvements du moteur de micro-interactions
// (opacity / scale / translate seulement, durées courtes, sortie plus courte que l'entrée), apparitions du menu, des fenêtres, des panneaux, des
// éléments créés et de la Structure, sortie du menu sans jamais retarder l'état logique, mouvement réduit respecté, manipulation directe jamais animée.
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
const ID = (s) => (s + "x").padEnd(12, "0");
const CONTENT = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: ID("cont"), type: "container", children: [{ id: ID("head"), type: "heading", props: { text: "Titre", level: 2 } }, { id: ID("txt"), type: "text", props: { html: "<p>Texte</p>" } }] }] }] };

describe("mouvement et micro-interactions de l'éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, pageId;
  const open = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ...opts });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(700);
    return { ctx, page, errors };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    pageId = Number((await boss.post("/marketing/pages", { name: "Mouvement" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("jetons : durées courtes (80 à 220 ms), sortie plus courte que l'entrée ; mouvements limités à opacity, scale et translate", async () => {
    const { ctx, page } = await open();
    const t = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement); const ms = (n) => parseFloat(cs.getPropertyValue(n)); return { fast: ms("--kol-motion-fast"), normal: ms("--kol-motion-normal"), panel: ms("--kol-motion-panel"), leave: ms("--kol-motion-leave"), scale: parseFloat(cs.getPropertyValue("--kol-motion-scale")), ease: cs.getPropertyValue("--kol-motion-ease").trim() }; });
    assert.deepEqual([t.fast, t.normal, t.panel, t.leave], [100, 150, 190, 90]);
    assert.ok(t.leave < t.normal && t.scale >= 0.96 && t.scale < 1, `micro-zoom ${t.scale}`);
    assert.match(t.ease, /^cubic-bezier\(/, "courbe d'accélération / décélération naturelle, pas linéaire, pas de rebond (valeurs entre 0 et 1)");
    const props = await page.evaluate(() => { const out = {}; const walk = (doc) => { for (const sheet of doc.styleSheets) { let rules; try { rules = sheet.cssRules; } catch { continue; } for (const r of rules) if (r.type === CSSRule.KEYFRAMES_RULE && /^kol-/.test(r.name)) { const set = new Set(); for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) set.add(k.style[i]); out[r.name] = [...set].sort(); } } }; walk(document); walk(document.querySelector("[data-pb-frame]").contentDocument); return out; });
    assert.ok(Object.keys(props).length >= 9, `mouvements du moteur : ${Object.keys(props).join(", ")}`);
    for (const [name, list] of Object.entries(props)) assert.ok(list.every((p) => ["opacity", "scale", "translate"].includes(p)), `${name} n'anime que opacity / scale / translate (${list.join(", ")})`);
    await ctx.close();
  });

  test("panneaux : plus de transition sur la grille, glisser une poignée n'écrit les préférences qu'une fois, la largeur choisie est conservée", async () => {
    const { ctx, page } = await open();
    assert.ok(!/grid-template-columns/.test(await page.evaluate(() => getComputedStyle(document.querySelector("[data-pb-main]")).transitionProperty)), "plus d'animation de la largeur des colonnes (coûteuse : la zone du canevas était recalculée à chaque image)");
    await page.evaluate(() => { window.__writes = 0; const si = Storage.prototype.setItem; Storage.prototype.setItem = function (k) { if (/pb:panels/.test(k)) window.__writes++; return si.apply(this, arguments); }; });
    const hb = await page.locator('[data-pb-resize="left"]').boundingBox();
    await page.mouse.move(hb.x + 3, hb.y + 200); await page.mouse.down();
    for (let i = 1; i <= 60; i++) await page.mouse.move(hb.x + 3 + i * 2, hb.y + 200);
    await page.mouse.up(); await wait(300);
    assert.ok(await page.evaluate(() => window.__writes) <= 2, "une écriture (au relâchement), pas une par pixel");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pb:panels")).left);
    const width = await page.evaluate(() => Math.round(document.querySelector("[data-pb-left]").getBoundingClientRect().width));
    assert.ok(Math.abs(saved - 260 - 120) <= 4 && Math.abs(width - saved) <= 1, `largeur enregistrée ${saved}, affichée ${width}`);
    await ctx.close();
  });

  test("menu principal : apparition en micro-zoom, état logique fermé tout de suite, sortie inerte puis effacée, réouverture immédiate sans résidu", async () => {
    const { ctx, page } = await open();
    await page.locator("[data-pb-mainmenu]").click(); await wait(30);
    const a = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector("[data-pb-menu]")); return { name: cs.animationName, dur: cs.animationDuration }; });
    assert.equal(a.name, "kol-pop-in"); assert.equal(a.dur, "0.15s");
    await wait(250);
    await page.keyboard.press("Escape");
    const s = await page.evaluate(() => { const m = document.querySelector("[data-pb-menu]"); return { hidden: m.hidden, leaving: m.classList.contains("kol-leaving"), inert: m.hasAttribute("inert"), pe: getComputedStyle(m).pointerEvents, shown: getComputedStyle(m).display !== "none" }; });
    assert.equal(s.hidden, true, "l'état logique est fermé immédiatement");
    assert.deepEqual([s.leaving, s.inert, s.pe, s.shown], [true, true, "none", true], "sortie visuelle : inerte, sans capter de clic");
    await wait(300);
    assert.deepEqual(await page.evaluate(() => { const m = document.querySelector("[data-pb-menu]"); return [m.classList.contains("kol-leaving"), m.hasAttribute("inert"), getComputedStyle(m).display]; }), [false, false, "none"], "sortie terminée");
    // fermer puis rouvrir sans attendre
    await page.locator("[data-pb-mainmenu]").click(); await page.keyboard.press("Escape"); await page.locator("[data-pb-mainmenu]").click(); await wait(30);
    assert.deepEqual(await page.evaluate(() => { const m = document.querySelector("[data-pb-menu]"); return [m.hidden, m.classList.contains("kol-leaving"), m.hasAttribute("inert")]; }), [false, false, false], "réouvert : plus de résidu de sortie");
    await ctx.close();
  });

  test("fenêtre (dialog), notification, barre d'actions, bulles : apparitions du moteur ; sélection et poignées jamais animées", async () => {
    const { ctx, page } = await open();
    await page.locator("[data-pb-mainmenu]").click(); await page.locator(".pb-menu-item", { hasText: "Raccourcis clavier" }).click(); await wait(40);
    const d = await page.evaluate(() => { const dl = document.querySelector("dialog[open]"); const cs = getComputedStyle(dl); const bd = getComputedStyle(dl, "::backdrop"); return { name: cs.animationName, dur: cs.animationDuration, backdrop: bd.animationName }; });
    assert.deepEqual([d.name, d.dur, d.backdrop], ["kol-scale-in", "0.15s", "kol-fade-in"]);
    await page.keyboard.press("Escape"); await wait(100);
    const t = await page.evaluate(() => { const el = document.querySelector("[data-pb-toast]"); el.hidden = false; const cs = getComputedStyle(el); const r = { name: cs.animationName, dur: cs.animationDuration }; el.hidden = true; return r; });
    assert.deepEqual([t.name, t.dur], ["kol-rise-in", "0.15s"]);
    await page.frameLocator("[data-pb-frame]").locator(`[data-node-id="${ID("head")}"]`).click(); await wait(500);
    const bar = await page.evaluate(() => { const b = document.querySelector(".pb-cbar"); const cs = getComputedStyle(b); const fd = document.querySelector("[data-pb-frame]").contentDocument; const sel = [...fd.querySelectorAll(".pb-sel-box, .pb-sel-badge, .pb-handle")].map((e) => fd.defaultView.getComputedStyle(e).animationName); return { visible: !b.hidden, name: cs.animationName, sel }; });
    assert.equal(bar.visible, true); assert.equal(bar.name, "kol-scale-in");
    assert.ok(bar.sel.length >= 2 && bar.sel.every((n) => n === "none"), `cadre de sélection et poignées sans animation (${bar.sel.join(",")})`);
    await ctx.close();
  });

  test("panneau rouvert : apparition par opacity / translate, la grille change tout de suite", async () => {
    const { ctx, page } = await open();
    const tog = page.locator('.pb-tool[aria-label="Panneau des éléments"]');
    await tog.click(); await wait(100);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-main]").classList.contains("is-left-hidden")), true);
    await tog.click(); await wait(20);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-left]").classList.contains("kol-in-panel-left")), true, "apparition posée à la réouverture");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-main]").classList.contains("is-left-hidden")), false, "mise en page immédiate");
    await wait(400);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-left]").classList.contains("kol-in-panel-left")), false, "classe retirée à la fin");
    await ctx.close();
  });

  test("création d'un widget : présent tout de suite, apparition courte sans décalage de mise en page, ligne de Structure qui apparaît, aucun saut de défilement", async () => {
    const { ctx, page } = await open();
    await page.locator(`[data-pb-layers] .pb-node[data-id="${ID("cont")}"] > .pb-row-item`).click(); await wait(300);
    const y0 = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
    await page.evaluate(() => { window.__seen = { canvas: null, row: null, layout: null }; const d = document.querySelector("[data-pb-frame]").contentDocument; const mo = new MutationObserver(() => { d.querySelectorAll(".kol-in-appear").forEach((e) => { if (!window.__seen.canvas) window.__seen.canvas = { id: e.getAttribute("data-node-id") || e.getAttribute("data-section-id"), offset: [e.offsetWidth, e.offsetHeight, e.offsetTop] }; }); }); mo.observe(d.body, { attributes: true, subtree: true, attributeFilter: ["class"] }); const mo2 = new MutationObserver(() => { document.querySelectorAll("[data-pb-layers] .kol-in-fade").forEach((e) => { if (!window.__seen.row) window.__seen.row = e.dataset.id; }); }); mo2.observe(document.querySelector("[data-pb-layers]"), { attributes: true, subtree: true, attributeFilter: ["class"] }); });
    const before = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
    await page.locator("[data-pb-left] button", { hasText: /^Titre$/ }).first().click();
    await page.waitForFunction((n) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length > n, before, { timeout: 5000, polling: 16 });
    await wait(450);
    const seen = await page.evaluate(() => window.__seen);
    assert.ok(seen.canvas, "le nouvel élément du canevas a porté l'apparition");
    assert.ok(seen.row, "la nouvelle ligne de Structure a porté l'apparition");
    const after = await page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument; const e = d.querySelector(`[data-node-id="${id}"]`); return { still: e.classList.contains("kol-in-appear"), offset: [e.offsetWidth, e.offsetHeight, e.offsetTop], y: d.defaultView.scrollY }; }, seen.canvas.id);
    assert.equal(after.still, false, "classe retirée à la fin de l'animation");
    assert.deepEqual(after.offset, seen.canvas.offset, "la mise en page (taille, position) ne bouge pas pendant l'animation : seuls opacity et scale changent");
    assert.equal(after.y, y0, "le défilement ne bouge pas");
    await ctx.close();
  });

  test("mouvement réduit : jetons à 0, plus aucune apparition ni sortie", async () => {
    const { ctx, page, errors } = await open({ reducedMotion: "reduce" });
    assert.deepEqual(await page.evaluate(() => { const cs = getComputedStyle(document.documentElement); return ["--kol-motion-fast", "--kol-motion-normal", "--kol-motion-panel", "--kol-motion-leave"].map((n) => parseFloat(cs.getPropertyValue(n))); }), [0, 0, 0, 0]);
    assert.equal(await page.evaluate(() => window.KolMotion.reduced()), true);
    await page.locator("[data-pb-mainmenu]").click(); await wait(30);
    assert.ok(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("[data-pb-menu]")).animationDuration)) <= 0.001, "animation de durée nulle");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-menu]").classList.contains("kol-leaving")), false, "pas de sortie animée");
    await page.locator(`[data-pb-layers] .pb-node[data-id="${ID("cont")}"] > .pb-row-item`).click(); await wait(300);
    const n = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
    await page.locator("[data-pb-left] button", { hasText: /^Texte$/ }).first().click();
    await page.waitForFunction((k) => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length > k, n, { timeout: 5000 });
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".kol-in-appear").length), 0, "aucune apparition animée");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});
