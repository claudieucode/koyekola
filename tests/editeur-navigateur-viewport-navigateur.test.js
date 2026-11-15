// Zoom, outil Main, zoom par zone et Navigator Studio de l'éditeur de pages, en VRAI Chrome.
// Vérifie le comportement (niveaux de zoom 10-400 %, transition, molette ancrée, main depuis la barre, zoom par zone, miniature RÉELLE, rectangle exact,
// navigation par clic et glisser, redimensionnement, flottant / ancré, verrouillage, historique, mode sombre, fermetures répétées sans fuite)
// et l'EXACTITUDE des coordonnées. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

function content() {
  const boxes = [];
  for (let i = 0; i < 20; i++) {
    const kids = [];
    for (let j = 0; j < 8; j++) {
      const id = `w${String(i).padStart(3, "0")}${String(j).padStart(3, "0")}00`;
      kids.push(j % 3 === 0 ? { id: `h${id}`, type: "heading", props: { text: `Titre ${i}-${j}`, level: "3" } }
        : j % 3 === 1 ? { id: `t${id}`, type: "text", props: { html: `<p>Paragraphe ${i}-${j} avec un texte assez long pour passer à la ligne.</p>` } }
          : { id: `b${id}`, type: "button", props: { label: `Bouton ${i}-${j}`, url: "/contact" } });
    }
    boxes.push({ id: `box${String(i).padStart(9, "0")}`, type: "container", props: {}, children: [{ id: `in${String(i).padStart(10, "0")}`, type: "container", props: {}, children: kids }] });
  }
  return { sections: [{ id: "sect00000001", type: "layout", children: boxes }] };
}

describe("zoom, main, zoom par zone et Navigator Studio (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors, requests, cdp;
  const zoomNow = () => page.evaluate(() => parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100);
  const scrollY = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
  const idle = async () => { await page.waitForFunction(() => !document.querySelector(".pb-frame-wrap.is-zooming"), null, { timeout: 5000 }); await wait(60); };
  const clickZoom = async (v) => { await page.click(`[data-pb-zoom="${v}"]`); await idle(); };
  const openEditor = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 90000 });
    await wait(900);
  };
  const setDevice = async (d) => { await page.click(`.pb-devices button[data-device="${d}"]`); await wait(600); };
  const frameBox = () => page.locator("[data-pb-frame]").boundingBox();
  const panel = () => page.locator(".pb-nvs");
  const openNav = async () => { if (!(await page.locator(".pb-nvs.is-open").count())) { await page.click("[data-pb-navigator]"); await page.waitForSelector(".pb-nvs.is-open"); } await wait(300); };
  const closeNav = async () => { if (await page.locator(".pb-nvs.is-open").count()) { await page.click('.pb-nvs-btn[data-nav="close"]'); await page.waitForFunction(() => document.querySelector(".pb-nvs").hidden, null, { timeout: 3000 }); } };
  const thumbReady = () => page.waitForFunction(() => { const f = document.querySelector(".pb-nvs-frame"); return f && f.contentDocument && f.contentDocument.readyState === "complete" && f.contentDocument.body && f.contentDocument.body.textContent.length > 20; }, null, { timeout: 20000 });
  const pbox = () => panel().boundingBox();
  async function shotIf(name) { if (process.env.NAV_SHOTS) { fs.mkdirSync(process.env.NAV_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.NAV_SHOTS}/${name}.png` }); } }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = []; requests = [];
    page.setDefaultNavigationTimeout(120000); page.setDefaultTimeout(60000);
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("request", (r) => requests.push(r.url()));
    pageId = Number((await boss.post("/marketing/pages", { name: "Viewport" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: content() }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    await openEditor();
    cdp = await context.newCDPSession(page); await cdp.send("Performance.enable");
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("zoom + / − : niveaux usuels de 10 à 400 %, limites, rafale, barre de zoom immobile, couche graphique libérée ; Navigator non chargé au démarrage", async () => {
    assert.equal(await page.evaluate(() => typeof window.pbNavigator), "undefined", "Navigator non chargé au démarrage");
    assert.equal(requests.some((u) => /page-builder-navigator\.js/.test(u)), false, "aucune requête du fichier avant le premier clic");
    await clickZoom("100");
    assert.equal(await zoomNow(), 1);
    const gz = () => page.locator(".pb-gizmo").boundingBox();
    const g0 = await gz();
    const seen = [];
    for (let i = 0; i < 4; i++) { await clickZoom("+"); seen.push(await zoomNow()); }
    assert.deepEqual(seen, [1.25, 1.5, 2, 3], "niveaux usuels vers l'avant");
    await clickZoom("+"); assert.equal(await zoomNow(), 4);
    assert.equal(await page.locator('[data-pb-zoom="+"]').isDisabled(), true, "400 % : bouton + désactivé");
    const down = [];
    for (let i = 0; i < 6; i++) { await clickZoom("-"); down.push(await zoomNow()); }
    assert.deepEqual(down, [3, 2, 1.5, 1.25, 1, 0.75], "niveaux usuels vers l'arrière");
    for (let i = 0; i < 5; i++) await clickZoom("-");
    assert.equal(await zoomNow(), 0.1, "10 % : plancher");
    assert.equal(await page.locator('[data-pb-zoom="-"]').isDisabled(), true);
    assert.deepEqual(await gz(), g0, "la barre de zoom ne bouge jamais");
    await clickZoom("100");
    for (let i = 0; i < 4; i++) await page.click('[data-pb-zoom="+"]');
    await idle();
    assert.equal(await zoomNow(), 3, "rafale : la cible finale est exacte");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-pb-frame-wrap]")).willChange), "auto", "la couche graphique disparaît à la fin");
    await clickZoom("100");
  });

  test("zoom personnalisé et valeurs intermédiaires : tapé dans le Navigator, 10 à 400 %, borné", async () => {
    await openNav();
    for (const [typed, want] of [["150", 1.5], ["87", 0.87], ["5", 0.1], ["999", 4]]) {
      await page.fill(".pb-nvs-zoom-input", typed); await page.press(".pb-nvs-zoom-input", "Enter"); await idle();
      assert.equal(await zoomNow(), want, `${typed} → ${want}`);
    }
    await clickZoom("100"); await closeNav();
  });

  test("la transition est une transformation : image de départ = image affichée (aucun saut), arrivée exacte", async () => {
    await setDevice("tablet"); await clickZoom("100");
    const info = await page.evaluate(async () => {
      const wrap = document.querySelector("[data-pb-frame-wrap]"), r0 = wrap.getBoundingClientRect();
      const samples = []; const t0 = performance.now();
      document.querySelector('[data-pb-zoom="+"]').click();
      await new Promise((res) => { (function tick() { const r = wrap.getBoundingClientRect(); samples.push({ t: performance.now() - t0, w: r.width, anim: wrap.classList.contains("is-zooming") }); if (performance.now() - t0 < 420) requestAnimationFrame(tick); else res(); })(); });
      return { first: samples[0], samples, w0: r0.width, last: samples[samples.length - 1] };
    });
    assert.ok(Math.abs(info.first.w - info.w0) < info.w0 * 0.06, `première image proche de l'affichage précédent (${info.first.w} vs ${info.w0})`);
    assert.ok(info.samples.some((s) => s.anim), "une transition a lieu");
    assert.ok(Math.abs(info.last.w - info.w0 * 1.25) < 1.5, `arrivée exacte : largeur ${info.last.w} ≈ ${info.w0 * 1.25}`);
    assert.equal(info.last.anim, false);
    await clickZoom("100");
  });

  test("mouvement réduit : le zoom est immédiat, sans transition", async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: "reduce" });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const p = await ctx.newPage();
    await p.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await p.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 90000 });
    await wait(2000);
    await p.click('[data-pb-zoom="100"]'); await wait(300);
    const r = await p.evaluate(async () => { document.querySelector('[data-pb-zoom="+"]').click(); const a = document.querySelector(".pb-frame-wrap").classList.contains("is-zooming"); await new Promise((x) => requestAnimationFrame(x)); return { animating: a, label: document.querySelector("[data-pb-zoom-value]").textContent }; });
    assert.equal(r.animating, false); assert.equal(r.label, "125 %");
    await ctx.close();
  });

  test("zoom : les dimensions réelles ne changent pas, la sélection suit exactement (écran = logique × zoom)", async () => {
    await setDevice("tablet"); await clickZoom("100");
    const id = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const el = d.querySelector('[data-node-id^="hw00000000"]') || d.querySelector("[data-node-id]"); el.scrollIntoView({ block: "center" }); el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: d.defaultView })); return el.getAttribute("data-node-id"); });
    await wait(400);
    const logical = () => page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument, el = d.querySelector(`[data-node-id="${id}"]`); return { w: el.offsetWidth, h: el.offsetHeight }; }, id);
    const screen = () => page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument, el = d.querySelector(`[data-node-id="${id}"]`), r = el.getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100; return { w: r.width * z, z }; }, id);
    const l1 = await logical();
    for (const step of ["+", "+", "+"]) { await clickZoom(step); const l = await logical(), s = await screen(); assert.deepEqual(l, l1, "dimensions logiques inchangées par le zoom"); assert.ok(Math.abs(s.w - l1.w * s.z) < 1.5, "largeur à l'écran = logique × zoom"); }
    assert.equal(await page.evaluate(() => !!document.querySelector(".pb-cbar:not([hidden])")), true, "la sélection reste");
    await clickZoom("100");
  });

  test("outil Main depuis la barre du bas : vraie icône main, état actif, suit le curseur 1:1 (100 % et 200 %), même hors du cadre ; Espace ; touche H", async () => {
    await setDevice("tablet");
    assert.equal((await page.locator("[data-pb-pan] svg path").count()) >= 3, true, "icône de main (pas des flèches)");
    for (const z of [1, 2]) {
      await clickZoom("100"); if (z === 2) { await clickZoom("+"); await clickZoom("+"); await clickZoom("+"); }
      const zn = await zoomNow();
      await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 400));
      assert.equal(await page.getAttribute("[data-pb-pan]", "aria-pressed"), "false", "main inactive");
      await page.click("[data-pb-pan]"); await wait(120);
      assert.equal(await page.getAttribute("[data-pb-pan]", "aria-pressed"), "true", "main active");
      const box = await frameBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2, y0 = await scrollY();
      await page.mouse.move(cx, cy); await page.mouse.down();
      for (let i = 1; i <= 20; i++) await page.mouse.move(cx, cy - i * 10);
      await page.mouse.move(cx, 20, { steps: 3 });
      await page.mouse.up(); await wait(120);
      const moved = (await scrollY()) - y0, expected = (cy - 20) / zn;
      assert.ok(Math.abs(moved - expected) <= 3, `${Math.round(zn * 100)} % : défilement ${Math.round(moved)} px ≈ ${Math.round(expected)} px`);
      await page.click("[data-pb-pan]"); await wait(80);
      assert.equal(await page.getAttribute("[data-pb-pan]", "aria-pressed"), "false", "on quitte la main");
    }
    await clickZoom("100");
    await page.locator("[data-pb-canvas]").click({ position: { x: 5, y: 5 }, force: true });
    await page.keyboard.down("Space");
    assert.equal(await page.getAttribute('.pb-tool[data-mode="hand"]', "aria-pressed"), "true", "Espace : main active");
    await page.keyboard.up("Space");
    assert.equal(await page.getAttribute('.pb-tool[data-mode="select"]', "aria-pressed"), "true", "Espace relâché : outil précédent");
    await page.keyboard.press("h"); assert.equal(await page.getAttribute("[data-pb-pan]", "aria-pressed"), "true", "touche H");
    await page.keyboard.press("v");
  });

  test("zoom par zone : rectangle visible, la zone encadrée remplit la vue et se centre ; clic = un niveau, Alt+clic = arrière ; Échap annule ; Z", async () => {
    await setDevice("tablet"); await clickZoom("100");
    await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 0));
    await page.click("[data-pb-zoomarea]");
    assert.equal(await page.getAttribute("[data-pb-zoomarea]", "aria-pressed"), "true");
    const box = await frameBox();
    const sel = '[data-node-id^="bw000002"]';
    const targetOf = () => page.evaluate((sel) => { const d = document.querySelector("[data-pb-frame]").contentDocument, f = document.querySelector("[data-pb-frame]").getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, el = d.querySelector(sel) || d.querySelector("[data-node-id]"), r = el.getBoundingClientRect(); return { l: f.left + r.left * z, t: f.top + r.top * z, w: r.width * z, h: r.height * z }; }, sel);
    const target = await targetOf();
    await page.mouse.move(target.l - 6, target.t - 6); await page.mouse.down(); await page.mouse.move(target.l + target.w + 6, target.t + target.h + 6, { steps: 6 });
    assert.equal(await page.locator(".pb-area:not([hidden])").count(), 1, "rectangle de sélection visible pendant le dessin");
    const ab = await page.locator(".pb-area").boundingBox();
    assert.ok(Math.abs(ab.x - (target.l - 6)) <= 2 && Math.abs(ab.width - (target.w + 12)) <= 3, `rectangle aligné sur le pointeur (${Math.round(ab.x)}, ${Math.round(ab.width)})`);
    await page.keyboard.press("Escape"); await page.mouse.up(); await wait(150);
    assert.equal(await zoomNow(), 1, "Échap : aucun zoom");
    assert.equal(await page.locator(".pb-area:not([hidden])").count(), 0);
    await page.mouse.move(target.l - 6, target.t - 6); await page.mouse.down(); await page.mouse.move(target.l + target.w + 6, target.t + target.h + 6, { steps: 6 }); await page.mouse.up(); await idle();
    const z1 = await zoomNow();
    assert.ok(z1 > 1.5, `zoom augmenté (${z1})`);
    const c = await page.evaluate((sel) => { const d = document.querySelector("[data-pb-frame]").contentDocument, el = d.querySelector(sel) || d.querySelector("[data-node-id]"), f = document.querySelector("[data-pb-frame]").getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, r = el.getBoundingClientRect(), st = document.querySelector("[data-pb-stage]").getBoundingClientRect(); return { cx: f.left + (r.left + r.width / 2) * z, cy: f.top + (r.top + r.height / 2) * z, scx: st.left + st.width / 2, scy: st.top + st.height / 2 }; }, sel);
    assert.ok(Math.abs(c.cx - c.scx) <= 60 && Math.abs(c.cy - c.scy) <= 60, `zone centrée dans la vue (écart ${Math.round(c.cx - c.scx)}, ${Math.round(c.cy - c.scy)})`);
    await page.keyboard.down("Alt"); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.keyboard.up("Alt"); await idle();
    assert.ok((await zoomNow()) < z1, "Alt + clic : zoom arrière");
    const z2 = await zoomNow(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await idle();
    assert.ok((await zoomNow()) > z2, "clic : un niveau en avant");
    await page.keyboard.press("v"); assert.equal(await page.getAttribute("[data-pb-zoomarea]", "aria-pressed"), "false");
    await page.keyboard.press("z"); assert.equal(await page.getAttribute("[data-pb-zoomarea]", "aria-pressed"), "true", "touche Z");
    await page.keyboard.press("v"); await clickZoom("100");
  });

  test("Ctrl + molette : zoom progressif, le point sous le curseur reste sous le curseur (largeur fixe)", async () => {
    await setDevice("tablet"); await clickZoom("100");
    await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 600));
    await wait(200);
    const box = await frameBox(), px = box.x + box.width * 0.4, py = box.y + box.height * 0.5;
    const probe = () => page.evaluate(([x, y]) => { const f = document.querySelector("[data-pb-frame]"), fr = f.getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, d = f.contentDocument, el = d.elementFromPoint((x - fr.left) / z, (y - fr.top) / z), n = el && el.closest("[data-node-id]"); return { id: n ? n.getAttribute("data-node-id") : null, z }; }, [px, py]);
    const before = await probe();
    await page.mouse.move(px, py);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, -100); await page.keyboard.up("Control"); await idle(); await wait(250);
    const mid = await probe();
    assert.ok(mid.z > before.z && mid.z < 2, `zoom progressif (${before.z} → ${mid.z})`);
    assert.notEqual(Math.round(mid.z * 100) % 25, 0, "valeur intermédiaire (pas forcément un niveau usuel)");
    assert.equal(mid.id, before.id, "le même élément reste sous le curseur");
    await page.keyboard.down("Control"); await page.mouse.wheel(0, 100); await page.keyboard.up("Control"); await idle(); await wait(250);
    assert.ok((await zoomNow()) < mid.z, "molette inverse : zoom arrière");
    await clickZoom("100");
  });

  test("Navigator Studio : miniature RÉELLE (mêmes textes, mêmes couleurs), sans script, chargé à la demande", async () => {
    await setDevice("desktop"); await clickZoom("100");
    await openNav(); await thumbReady();
    assert.equal(requests.some((u) => /page-builder-navigator\.js/.test(u)), true, "chargé au premier clic");
    const cmp = await page.evaluate(() => {
      const main = document.querySelector("[data-pb-frame]").contentDocument, th = document.querySelector(".pb-nvs-frame").contentDocument;
      const h = (d) => { const e = d.querySelector("h3"); const c = getComputedStyle(e); return { text: e.textContent, color: c.color, size: c.fontSize, family: c.fontFamily }; };
      return { main: h(main), thumb: h(th), mainBody: main.body.textContent.replace(/\s+/g, " ").slice(0, 200), thBody: th.body.textContent.replace(/\s+/g, " ").slice(0, 200), scripts: th.querySelectorAll("script").length, sandbox: document.querySelector(".pb-nvs-frame").getAttribute("sandbox"), overlay: th.querySelectorAll(".pb-sel-box,.pb-handle").length };
    });
    assert.deepEqual(cmp.thumb, cmp.main, "titre : même texte, même couleur, même taille, même police");
    assert.equal(cmp.thBody, cmp.mainBody, "même contenu texte");
    assert.equal(cmp.scripts, 0, "aucun script dans la miniature");
    assert.equal(cmp.sandbox, "allow-same-origin", "cadre isolé : scripts interdits");
    assert.equal(cmp.overlay, 0, "aucune surcouche d'édition dans la miniature");
    const w = await page.evaluate(() => ({ main: document.querySelector("[data-pb-frame]").contentDocument.documentElement.clientWidth, th: parseFloat(document.querySelector(".pb-nvs-frame").style.width) }));
    assert.equal(w.th, w.main, "miniature à la largeur réelle de la page");
    await shotIf("navigator-miniature");
    await closeNav();
    assert.equal(await page.locator(".pb-nvs-frame").count(), 0, "cadre retiré à la fermeture (mémoire rendue)");
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("rectangle de navigation exact, clic et glisser dans la miniature, mise à jour au changement de contenu", async () => {
    await setDevice("desktop"); await clickZoom("100"); await openNav(); await thumbReady();
    const m = () => page.evaluate(() => {
      const f = document.querySelector("[data-pb-frame]"), tb = document.querySelector(".pb-nvs-thumbbox").getBoundingClientRect(), r = document.querySelector(".pb-nvs-rect").getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, st = document.querySelector("[data-pb-stage]").getBoundingClientRect(), fr = f.getBoundingClientRect(), th = document.querySelector(".pb-nvs-frame");
      return { docW: parseFloat(th.style.width), docH: parseFloat(th.style.height), y: f.contentWindow.scrollY, tw: tb.width, th: tb.height, tl: tb.left, tt: tb.top, rx: r.left - tb.left, ry: r.top - tb.top, rw: r.width, rh: r.height, z, viewH: Math.min(st.bottom, fr.bottom) - Math.max(st.top, fr.top), viewW: Math.min(st.right, fr.right) - Math.max(st.left, fr.left) };
    });
    const a = await m();
    assert.ok(Math.abs(a.tw / a.th - a.docW / a.docH) / (a.docW / a.docH) < 0.04, `miniature à la proportion de la page (${(a.tw / a.th).toFixed(3)} vs ${(a.docW / a.docH).toFixed(3)})`);
    const vh = a.viewH / a.z;
    assert.ok(Math.abs(a.rh / a.th - vh / a.docH) < 0.03, "hauteur du rectangle = zone visible");
    assert.ok(Math.abs(a.rw / a.tw - (a.viewW / a.z) / a.docW) < 0.03, "largeur du rectangle = zone visible");
    await page.mouse.click(a.tl + a.tw / 2, a.tt + a.th * 0.8); await wait(250);
    const b = await m();
    const want = Math.min(b.docH - vh, Math.max(0, 0.8 * b.docH - vh / 2));
    assert.ok(Math.abs(b.y - want) <= Math.max(6, b.docH * 0.01), `clic : défilement ${Math.round(b.y)} ≈ ${Math.round(want)}`);
    const rc = { x: b.tl + b.rx + b.rw / 2, y: b.tt + b.ry + b.rh / 2 };
    await page.mouse.move(rc.x, rc.y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(rc.x, rc.y - i * (b.th * 0.04));
    await page.mouse.up(); await wait(250);
    const c = await m();
    assert.ok(c.y < b.y - b.docH * 0.2, `glisser vers le haut : la page remonte (${Math.round(b.y)} → ${Math.round(c.y)})`);
    assert.match(await page.evaluate(() => document.querySelector(".pb-nvs-frame").contentDocument.body.textContent), /Titre 0-0/);
    await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; d.defaultView.scrollTo(0, 0); const el = d.querySelector('[data-node-id^="hw00000000"]'); el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: d.defaultView })); });
    await wait(300); await page.keyboard.press("Delete");
    await page.waitForFunction(() => { const f = document.querySelector(".pb-nvs-frame"); return f && f.contentDocument && f.contentDocument.body && !/Titre 0-0/.test(f.contentDocument.body.textContent) && f.contentDocument.body.textContent.length > 20; }, null, { timeout: 20000 });
    await page.keyboard.press("Control+z"); await wait(600);
    await closeNav();
  });

  test("panneau : redimensionnement par les bords et coins, bornes, déplacement, verrouillage, réduire / agrandir / restaurer, mémorisation", async () => {
    await openNav(); await thumbReady();
    const b0 = await pbox();
    const handle = async (dir) => { const r = await page.locator(`.pb-nvs-rs-${dir}`).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
    const drag = async (from, dx, dy) => { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + dx, from.y + dy, { steps: 6 }); await page.mouse.up(); await wait(150); };
    await drag(await handle("nw"), -80, -70);
    const b1 = await pbox(); assert.ok(b1.width > b0.width + 60 && b1.height > b0.height + 50, `coin haut-gauche : plus grand (${Math.round(b0.width)}×${Math.round(b0.height)} → ${Math.round(b1.width)}×${Math.round(b1.height)})`);
    assert.ok(Math.abs(b1.x + b1.width - (b0.x + b0.width)) <= 2 && Math.abs(b1.y + b1.height - (b0.y + b0.height)) <= 2, "le coin opposé reste fixe");
    await drag(await handle("e"), -60, 0); const b2 = await pbox(); assert.ok(b2.width < b1.width - 40, "bord droit : plus étroit");
    await drag(await handle("s"), 0, -50); const b3 = await pbox(); assert.ok(b3.height < b2.height - 30, "bord bas : plus bas");
    await drag(await handle("se"), -600, -600); const b4 = await pbox(); assert.ok(b4.width >= 220 && b4.height >= 186, `dimensions minimales respectées (${Math.round(b4.width)}×${Math.round(b4.height)})`);
    await drag(await handle("se"), 3000, 3000); const b5 = await pbox(); const cv = await page.locator("[data-pb-canvas]").boundingBox(); assert.ok(b5.x + b5.width <= cv.x + cv.width + 1 && b5.y + b5.height <= cv.y + cv.height + 1, "jamais plus grand que le canevas");
    await drag(await handle("se"), -3000, -3000);
    const ratio = await page.evaluate(() => { const t = document.querySelector(".pb-nvs-thumbbox").getBoundingClientRect(), f = document.querySelector(".pb-nvs-frame"); return { box: t.width / t.height, doc: parseFloat(f.style.width) / parseFloat(f.style.height) }; });
    assert.ok(Math.abs(ratio.box - ratio.doc) / ratio.doc < 0.05, "proportions conservées après redimensionnement");
    const hd = await page.locator(".pb-nvs-head").boundingBox(), p0 = await pbox();
    await page.mouse.move(hd.x + 60, hd.y + 10); await page.mouse.down(); await page.mouse.move(hd.x + 60 - 150, hd.y + 10 - 120, { steps: 6 }); await page.mouse.up(); await wait(150);
    const p1 = await pbox(); assert.ok(p1.x < p0.x - 100 && p1.y < p0.y - 80, "déplacement libre");
    await page.click('.pb-nvs-btn[data-nav="lock"]'); assert.equal(await page.getAttribute('.pb-nvs-btn[data-nav="lock"]', "aria-pressed"), "true");
    const hd2 = await page.locator(".pb-nvs-head").boundingBox();
    await page.mouse.move(hd2.x + 60, hd2.y + 10); await page.mouse.down(); await page.mouse.move(hd2.x + 160, hd2.y + 90, { steps: 4 }); await page.mouse.up(); await wait(120);
    const p2 = await pbox(); assert.ok(Math.abs(p2.x - p1.x) <= 1 && Math.abs(p2.y - p1.y) <= 1, "position verrouillée");
    await page.click('.pb-nvs-btn[data-nav="lock"]');
    await page.click('.pb-nvs-btn[data-nav="min"]'); await wait(150);
    assert.ok((await pbox()).height < 60, "réduit : seul l'en-tête reste"); await page.click('.pb-nvs-btn[data-nav="min"]'); await wait(150);
    assert.ok(Math.abs((await pbox()).height - p2.height) <= 2, "restauré à la taille précédente");
    await page.click('.pb-nvs-btn[data-nav="max"]'); await wait(200);
    const mx = await pbox(); assert.ok(mx.width > p2.width + 80 && mx.height > p2.height + 80, "agrandi");
    await page.click('.pb-nvs-btn[data-nav="max"]'); await wait(200);
    assert.ok(Math.abs((await pbox()).width - p2.width) <= 2, "taille précédente restaurée");
    const saved = await page.evaluate(() => localStorage.getItem("pb:navigator-ui"));
    assert.ok(saved && saved.length < 400 && !/data:image|base64/.test(saved), `préférences légères (${saved && saved.length} octets)`);
    await shotIf("navigator-panneau");
    await closeNav();
    await page.reload(); await openEditor(); await openNav();
    const p3 = await pbox(); assert.ok(Math.abs(p3.x - p2.x) <= 2 && Math.abs(p3.width - p2.width) <= 2, "disposition retrouvée après rechargement");
    await closeNav();
  });

  test("mode ancré : colonne à droite qui RÉSERVE sa place ; détacher ; rétablir la disposition par défaut", async () => {
    await openNav(); await thumbReady();
    const st0 = await page.locator("[data-pb-stage]").boundingBox();
    await page.click('.pb-nvs-btn[data-nav="dock"]'); await wait(400);
    const cv = await page.locator("[data-pb-canvas]").boundingBox(), pd = await pbox(), st1 = await page.locator("[data-pb-stage]").boundingBox();
    assert.ok(Math.abs(pd.x + pd.width - (cv.x + cv.width)) <= 2 && Math.abs(pd.height - cv.height) <= 2, "colonne collée au bord droit, pleine hauteur");
    assert.ok(st1.width < st0.width - 150 && st1.x + st1.width <= pd.x + 1, "le canevas se réduit : rien n'est masqué");
    const g = await page.locator(".pb-gizmo").boundingBox(); assert.ok(g.x + g.width <= pd.x + 1, "la barre de zoom se décale");
    const w0 = pd.width; await page.mouse.move(pd.x + 1, pd.y + 200); await page.mouse.down(); await page.mouse.move(pd.x - 70, pd.y + 200, { steps: 5 }); await page.mouse.up(); await wait(200);
    assert.ok((await pbox()).width > w0 + 50, "largeur de la colonne ajustable");
    await shotIf("navigator-ancre");
    await page.click('.pb-nvs-btn[data-nav="dock"]'); await wait(400);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-canvas]").classList.contains("has-nav-dock")), false, "détaché : la place est rendue");
    if (!(await page.evaluate(() => document.querySelector(".pb-nvs-adv").open))) await page.click(".pb-nvs-adv > summary");
    await page.click('.pb-nvs-btn[data-nav="reset"]'); await wait(300);
    const d = await pbox(); assert.ok(Math.abs(d.width - 288) <= 2, "disposition par défaut rétablie");
    await closeNav();
  });

  test("commandes du Navigator : ajustements, page entière, historique de vues, navigation rapide, sections", async () => {
    await setDevice("desktop"); await clickZoom("100"); await openNav(); await thumbReady();
    if (!(await page.evaluate(() => document.querySelector(".pb-nvs-adv").open))) await page.click(".pb-nvs-adv > summary");
    await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 0));
    await page.click('.pb-nvs-btn[aria-label="Aller à la fin de la page"]');
    await page.waitForFunction(() => { const w = document.querySelector("[data-pb-frame]").contentWindow; return w.scrollY > w.document.documentElement.scrollHeight - w.innerHeight - 5; }, null, { timeout: 8000 });
    const endY = await scrollY(); assert.ok(endY > 1000, `fin de page (${Math.round(endY)})`);
    await page.click('.pb-nvs-btn[aria-label="Aller au début de la page"]');
    await page.waitForFunction(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY < 5, null, { timeout: 8000 });
    await page.click('.pb-nvs-btn[aria-label="Vue précédente"]'); await wait(900);
    assert.ok((await scrollY()) > 1000, "vue précédente : on retrouve la fin de page");
    await page.click('.pb-nvs-btn[aria-label="Vue suivante"]'); await wait(900);
    assert.ok((await scrollY()) < 50, "vue suivante : retour au début");
    await page.click('.pb-nvs-btn[aria-label="Aller au milieu de la page"]'); await wait(2500);
    const mid = await scrollY(); assert.ok(mid > 300 && mid < endY, "milieu de page");
    assert.ok((await page.locator(".pb-nvs-select option").count()) >= 2, "liste des sections");
    await page.selectOption(".pb-nvs-select", { index: 1 }); await wait(700);
    await page.click('.pb-nvs-btn[aria-label="Ajuster à la largeur : la page remplit la largeur"]'); await idle();
    await page.click('.pb-nvs-btn[aria-label="Afficher la page entière"]'); await wait(500);
    const whole = await page.evaluate(() => ({ h: document.querySelector("[data-pb-frame]").contentDocument.documentElement.scrollHeight, z: parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, stageH: document.querySelector("[data-pb-stage]").clientHeight - 48 }));
    assert.ok(whole.z <= 0.11 || whole.h * whole.z <= whole.stageH + 4, `page entière visible (${Math.round(whole.h * whole.z)} ≤ ${whole.stageH}) ou 10 %`);
    await page.click('.pb-nvs-btn[aria-label="Niveaux de zoom prédéfinis"]'); await page.waitForSelector(".pb-menu:not([hidden]) .pb-menu-item");
    assert.ok((await page.locator(".pb-menu:not([hidden]) .pb-menu-item").count()) >= 16, "menu des niveaux : ajustements + 12 niveaux");
    await page.keyboard.press("Escape");
    await clickZoom("100"); await closeNav();
  });

  test("responsive : le Navigator représente la page à la largeur réelle de chaque écran ; mode sombre lisible", async () => {
    for (const [d, w] of [["tablet", 820], ["mobile", 390]]) {
      await setDevice(d); await clickZoom("100"); await openNav(); await thumbReady();
      const r = await page.evaluate(() => ({ th: parseFloat(document.querySelector(".pb-nvs-frame").style.width), main: document.querySelector("[data-pb-frame]").contentDocument.documentElement.clientWidth }));
      assert.equal(r.th, r.main, `${d} : miniature à la largeur du canevas`); assert.equal(r.main, w);
      await closeNav();
    }
    await setDevice("desktop"); await openNav(); await thumbReady();
    const light = await page.evaluate(() => { const s = getComputedStyle(document.querySelector(".pb-nvs")); return { bg: s.backgroundColor, fg: s.color }; });
    await page.click("[data-pb-theme-toggle]"); await wait(500);
    const dark = await page.evaluate(() => { const s = getComputedStyle(document.querySelector(".pb-nvs")); return { bg: s.backgroundColor, fg: s.color }; });
    const lum = (c) => { const m = c.match(/\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
    assert.notEqual(light.bg, dark.bg, "le panneau suit le mode sombre de l'éditeur");
    assert.ok(Math.abs(lum(dark.bg) - lum(dark.fg)) > 0.5, `texte lisible en mode sombre (${dark.bg} / ${dark.fg})`);
    await shotIf("navigator-sombre");
    await page.click("[data-pb-theme-toggle]"); await wait(300);
    await closeNav();
  });

  test("ouvertures / fermetures répétées : un seul panneau, aucun cadre restant, pas de fuite mémoire ni d'écouteurs", async () => {
    const heap = async () => { await cdp.send("HeapProfiler.collectGarbage").catch(() => {}); const m = (await cdp.send("Performance.getMetrics")).metrics; const g = (n) => (m.find((x) => x.name === n) || {}).value || 0; return { mb: g("JSHeapUsedSize") / 1048576, listeners: g("JSEventListeners") }; };
    await setDevice("desktop"); await openNav(); await thumbReady(); await closeNav(); await wait(500);
    const h0 = await heap();
    for (let i = 0; i < 15; i++) { await page.click("[data-pb-navigator]"); await wait(120); await page.click("[data-pb-navigator]"); await wait(120); }
    await openNav(); await thumbReady();
    assert.equal(await page.locator(".pb-nvs").count(), 1, "un seul panneau");
    assert.equal(await page.locator(".pb-nvs-frame").count(), 1, "un seul cadre d'aperçu");
    await closeNav(); await wait(700);
    assert.equal(await page.locator(".pb-nvs-frame").count(), 0, "aucun cadre après fermeture");
    const h1 = await heap();
    assert.ok(h1.mb - h0.mb < 12, `mémoire stable (+${(h1.mb - h0.mb).toFixed(1)} Mo)`);
    assert.ok(h1.listeners - h0.listeners < 60, `écouteurs stables (+${h1.listeners - h0.listeners})`);
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});
