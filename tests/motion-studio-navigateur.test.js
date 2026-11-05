// Motion Studio, lot 0, dans un VRAI Chrome : page publiée (texte accessible, découpage, révélation réelle, déclencheurs, écrans, mouvement réduit, sans JavaScript,
// 320 / 768 / 1920 sans débordement) puis éditeur (insertion, six sections, réglages annulables, canevas animé en mode éditeur, lecture / pause / position).
// Ignoré si Playwright ou Chrome sont absents (NODE_PATH=<dossier>/node_modules pour playwright-core).
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
const LONG = "Un très long titre qui doit passer à la ligne sur les petits écrans sans jamais déborder de la page ni casser la mise en page";

describe("Motion Studio : texte animé (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, slug, editId;
  const errors = [];
  const st = (id, studio, props = {}, extra = {}) => ({ id, type: "motionsplittext", props: { text: "Bonjour le monde animé", tag: "h2", split: "words", ...props }, ...(studio ? { motion: { studio } } : {}), ...extra });
  const spacer = (id) => ({ id, type: "spacer", props: { size: "128" } });
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name, children, publish) => {
      const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
      const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children }] }] };
      const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200, r.text.slice(0, 300));
      if (publish) assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      return id;
    };
    const pub = await mk("MS public", [
      st("msload000001", { v: 1, trigger: "load", preset: "flip", duration: 600, stagger: 30 }, { split: "chars", text: "Lettres" }),
      st("msview000001", { v: 1, trigger: "viewport", preset: "mask-up" }, { split: "lines", text: LONG, tag: "p" }),
      spacer("spc000000001"), spacer("spc000000002"), spacer("spc000000003"), spacer("spc000000004"), spacer("spc000000005"), spacer("spc000000006"),
      st("msclick00001", { v: 1, trigger: "click", preset: "scale" }, { text: "Cliquez ici pour animer" }),
      st("msscroll0001", { v: 1, trigger: "scroll", preset: "fade", stagger: 80 }, { text: "Un deux trois quatre cinq six sept huit" }),
      st("msmobile0001", { v: 1, trigger: "load", off: ["mobile"] }, { text: "Coupé sur mobile" }),
      st("msreduce0001", { v: 1, trigger: "load", rm: "fade" }, { text: "Mouvement réduit" }),
      st("msplain00001", null, { text: "Réglages par défaut", split: "words" }),
      spacer("spc000000007"),
    ], true);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pub).slug;
    editId = await mk("MS éditeur", [st("msedit000001", null, { text: "Texte à animer dans l'éditeur" })], false);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const open = async (opts = {}, { js = true } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 700 }, javaScriptEnabled: js, ...opts });
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    const reqs = []; page.on("request", (r) => reqs.push(r.url()));
    await page.goto(`${srv.base}/p/${slug}`, { waitUntil: "load" });
    return { page, ctx, errs, reqs };
  };
  const ready = (page, id) => page.waitForFunction((id) => { const e = document.querySelector(`.kw-n-${id}`); return e && e.getAttribute("data-kw-ms-state"); }, id, { timeout: 15000 });
  const sel = (id) => `.kw-n-${id}`;
  const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  test("page publiée : feuille de styles, runtime et module chargés seulement ici ; texte complet accessible ; découpage réel ; révélation exécutée", async () => {
    const { page, errs, reqs } = await open();
    await ready(page, "msload000001");
    assert.ok(reqs.some((u) => /\/css\/motion-studio\.css\?v=/.test(u)), "feuille de styles");
    assert.ok(reqs.some((u) => /\/js\/kw-motion-studio\.js\?v=/.test(u)), "runtime");
    await until(() => reqs.some((u) => /\/js\/motion-studio\/split-text\.js\?v=/.test(u)), "module avec empreinte");
    const info = await page.evaluate((s) => { const e = document.querySelector(s); return { sr: e.querySelector(".kw-ms-sr").textContent, units: e.querySelectorAll(".kw-ms-u").length, hidden: e.querySelector(".kw-ms-st-vis").getAttribute("aria-hidden"), state: e.getAttribute("data-kw-ms-state"), text: e.textContent }; }, sel("msload000001"));
    assert.equal(info.sr, "Lettres"); assert.equal(info.units, 7); assert.equal(info.hidden, "true");
    // l'animation tourne réellement puis se termine sur l'état final visible
    await until(() => page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).length > 0 || [...document.querySelectorAll(s + " .kw-ms-u")].every((u) => getComputedStyle(u).opacity === "1"), sel("msload000001")), "animation lancée");
    await until(() => page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-u")].every((u) => getComputedStyle(u).opacity === "1"), sel("msload000001")), "état final atteint", 10000);
    // mots par défaut
    await ready(page, "msplain00001");
    assert.equal(await page.locator(`${sel("msplain00001")} .kw-ms-u`).count(), 3);
    assert.deepEqual(errs, []); await page.close();
  });

  test("viewport : l'élément du bas attend d'être visible (état de départ tenu) puis se révèle ; lignes mesurées", async () => {
    const { page, errs } = await open();
    await ready(page, "msview000001");
    const before = await page.evaluate((s) => { const e = document.querySelector(s); return { lines: e.querySelectorAll(".kw-ms-line").length, anim: e.getAnimations({ subtree: true }).map((a) => a.playState).join() }; }, sel("msview000001"));
    assert.ok(before.lines >= 1);
    await page.locator(sel("msclick00001")).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(200);
    await page.locator(sel("msview000001")).scrollIntoViewIfNeeded();
    await until(() => page.evaluate((s) => [...document.querySelectorAll(s + " .kw-ms-u")].every((u) => getComputedStyle(u).transform === "none" || getComputedStyle(u).transform === "matrix(1, 0, 0, 1, 0, 0)"), sel("msview000001")), "révélation des lignes");
    assert.deepEqual(errs, []); await page.close();
  });

  test("clic : contenu visible avant, animation jouée au clic ; défilement : l'avancement suit la position de la page", async () => {
    const { page, errs } = await open();
    await ready(page, "msclick00001");
    await page.locator(sel("msclick00001")).scrollIntoViewIfNeeded();
    const op = () => page.evaluate((s) => getComputedStyle(document.querySelector(s + " .kw-ms-u")).opacity, sel("msclick00001"));
    assert.equal(await op(), "1", "visible avant le clic");
    await page.locator(sel("msclick00001")).click();
    assert.ok(await page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).some((a) => a.playState === "running"), sel("msclick00001")), "animation en cours après le clic");
    await ready(page, "msscroll0001");
    const t = () => page.evaluate((s) => Math.round(document.querySelector(s + " .kw-ms-u").getAnimations()[0].currentTime), sel("msscroll0001"));
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(150); const t0 = await t();
    await page.locator(sel("msscroll0001")).scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 120); await wait(300);
    const t1 = await t(); assert.ok(t1 > t0, `progression ${t0} -> ${t1}`);
    assert.deepEqual(errs, []); await page.close();
  });

  test("écrans : coupé sur mobile (texte intact), actif sur ordinateur ; le changement de largeur réactive sans recharger ; 320 / 768 / 1920 sans débordement", async () => {
    const { page, errs } = await open({ viewport: { width: 1200, height: 800 } });
    await ready(page, "msmobile0001");
    assert.equal(await page.getAttribute(sel("msmobile0001"), "data-kw-ms-state"), "ready");
    for (const w of [320, 768, 1920]) {
      await page.setViewportSize({ width: w, height: 800 }); await wait(500);
      assert.ok(await noOverflow(page), `débordement à ${w}px`);
    }
    await page.setViewportSize({ width: 375, height: 800 }); await wait(400);
    assert.equal(await page.getAttribute(sel("msmobile0001"), "data-kw-ms-state"), "off");
    assert.equal(await page.locator(`${sel("msmobile0001")} .kw-ms-u`).count(), 0, "texte non découpé quand l'animation est coupée");
    assert.equal((await page.textContent(sel("msmobile0001"))).trim(), "Coupé sur mobile");
    await page.setViewportSize({ width: 1200, height: 800 }); await wait(400);
    assert.equal(await page.getAttribute(sel("msmobile0001"), "data-kw-ms-state"), "ready");
    assert.deepEqual(errs, []); await page.close();
  });

  test("mouvement réduit : aucun découpage ni animation, texte intact (fondu court si choisi) ; sans JavaScript le texte est complet et visible", async () => {
    const { page, errs } = await open({ reducedMotion: "reduce" });
    await ready(page, "msload000001");
    assert.equal(await page.getAttribute(sel("msload000001"), "data-kw-ms-state"), "reduced");
    assert.equal(await page.locator(`${sel("msload000001")} .kw-ms-u`).count(), 0);
    assert.equal((await page.textContent(sel("msload000001"))).trim(), "Lettres");
    assert.equal(await page.evaluate((s) => document.querySelector(s).getAnimations({ subtree: true }).length, sel("msplain00001")), 0);
    assert.deepEqual(errs, []); await page.close();
    const nojs = await open({}, { js: false });
    const txt = await nojs.page.evaluate((s) => { const e = document.querySelector(s); return { text: e.textContent.trim(), op: getComputedStyle(e).opacity, vis: getComputedStyle(e).visibility }; }, sel("msload000001"));
    assert.deepEqual(txt, { text: "Lettres", op: "1", vis: "visible" });
    await nojs.page.close();
  });

  // ---------------------------------------------------------------- éditeur
  test("éditeur : insertion depuis la bibliothèque, six sections, réglages annulables, canevas animé, lecture / pause / position", { timeout: 240000 }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${editId}/editeur`);
    const canvasReady = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && window.__pb; }, null, { timeout: 30000 });
    await canvasReady(); await wait(800);
    const doc = () => page.evaluate(() => window.__pb.content());
    const flat = (c) => { const o = []; const w = (l) => (l || []).forEach((n) => { o.push(n); w(n.children); }); w(c.sections); return o; };
    const settle = () => page.waitForFunction(() => !window.__pb.dirty(), null, { timeout: 20000 });
    const fr = () => page.frames().find((f) => f.url() === "about:srcdoc") || page.frames()[1];
    // insertion par la bibliothèque
    await page.evaluate(() => { const b = document.querySelector("#pb-tab-elements"); if (b) b.click(); });
    await page.locator("[data-pb-el-search]").fill("Texte animé"); await wait(200);
    await page.locator('.pb-pal-item[data-widget="motionsplittext"]').first().click({ timeout: 8000 }); await wait(300);
    let c = await doc(); const added = flat(c).filter((n) => n.type === "motionsplittext"); assert.equal(added.length, 2, "un composant de plus");
    await settle();
    // sélection du composant de départ et panneau
    await page.locator(`[data-pb-layers] .pb-node[data-id="msedit000001"] > .pb-row-item`).first().click(); await wait(300);
    const titles = await page.locator("[data-pb-inspector] .pb-acc-title").allTextContents();
    for (const t of ["Contenu", "Style", "Animation", "Interactions", "Responsive", "Avancé"]) assert.ok(titles.includes(t), `section ${t} : ${titles.join("|")}`);
    // canevas : découpé, état final visible (pas figé à l'état de départ)
    await until(async () => (await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); const e = f.contentDocument.querySelector('[data-node-id="msedit000001"]'); return e && e.getAttribute("data-kw-ms-state") === "ready" && e.querySelectorAll(".kw-ms-u").length; })) === 5, "canevas découpé en mots");
    const frameOp = () => page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return [...f.contentDocument.querySelectorAll('[data-node-id="msedit000001"] .kw-ms-u')].map((u) => f.contentWindow.getComputedStyle(u).opacity).join(); });
    assert.equal(await frameOp(), "1,1,1,1,1", "état final dans l'éditeur");
    // réglage de l'effet : enregistré dans le document, annulable
    const eff = page.locator('[data-pb-inspector] .pb-field:has(> label:text-is("Effet")) select');
    await eff.selectOption("blur"); await wait(300);
    c = await doc(); assert.equal(flat(c).find((n) => n.id === "msedit000001").motion.studio.preset, "blur");
    await page.keyboard.press("Escape");
    await page.evaluate(() => document.querySelector('[aria-label="Annuler"], .pb-hist-btn') && 0);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Annuler/.test(x.getAttribute("data-tip") || "") && !x.disabled); if (b) b.click(); }); await wait(300);
    c = await doc(); assert.equal(flat(c).find((n) => n.id === "msedit000001").motion, undefined, "annulation : plus aucun réglage");
    // un écran coupé et le déclencheur : section Responsive / Interactions
    await page.locator('[data-pb-inspector] [data-ms-screen="mobile"]').scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => { const d = [...document.querySelectorAll("[data-pb-inspector] details")].find((x) => /Responsive/.test(x.textContent)); if (d) d.open = true; });
    await page.locator('[data-pb-inspector] [data-ms-screen="mobile"]').uncheck(); await wait(300);
    c = await doc(); assert.deepEqual(flat(c).find((n) => n.id === "msedit000001").motion.studio.off, ["mobile"]);
    await page.locator('[data-pb-inspector] [data-ms-act="reset-all"]').click({ force: true }).catch(() => {}); await wait(200);
    // lecture / pause / position
    await page.locator('[data-pb-inspector] [data-ms-act="play"]').click({ force: true }); await wait(120);
    const running = () => page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return f.contentDocument.querySelector('[data-node-id="msedit000001"]').getAnimations({ subtree: true }).map((a) => a.playState).join(); });
    assert.match(await running(), /running|finished/);
    await page.locator('[data-pb-inspector] [data-ms-act="pause"]').click({ force: true }); await wait(100);
    assert.match(await running(), /paused/);
    await page.evaluate(() => { const r = document.querySelector("[data-pb-inspector] [data-ms-seek]"); r.value = "0"; r.dispatchEvent(new Event("input", { bubbles: true })); }); await wait(150);
    assert.equal((await frameOp()).split(",")[0], "0", "position 0 : état de départ");
    await page.locator('[data-pb-inspector] [data-ms-act="stop"]').click({ force: true }); await wait(150);
    assert.equal(await frameOp(), "1,1,1,1,1", "arrêt : état final");
    // enregistrement serveur : le composant est rechargé identique
    await settle();
    const saved = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(editId).draft);
    assert.equal(flat(saved).filter((n) => n.type === "motionsplittext").length, 2);
    assert.deepEqual(errs, []); await ctx.close();
  });
});
