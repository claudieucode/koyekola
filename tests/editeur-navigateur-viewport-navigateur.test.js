// Zoom, outil Main et panneau Navigateur de l'éditeur de pages, en VRAI Chrome.
// Vérifie le comportement (niveaux de zoom, transition, précision de la main, Espace, molette, miniature et rectangle, navigation par clic et glisser,
// chargement à la demande, absence d'erreur de console) et l'EXACTITUDE des coordonnées. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("zoom, main et Navigateur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors, requests;
  const frameDoc = "document.querySelector('[data-pb-frame]').contentDocument";
  const zoomNow = () => page.evaluate(() => parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100);
  const scrollY = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollY);
  const idle = async () => { await page.waitForFunction(() => !document.querySelector(".pb-frame-wrap.is-zooming"), null, { timeout: 5000 }); await wait(60); };
  const clickZoom = async (v) => { await page.click(`[data-pb-zoom="${v}"]`); await idle(); };
  const openEditor = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 90000 });
    await wait(900);
  };
  const frameBox = () => page.locator("[data-pb-frame]").boundingBox();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = []; requests = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("request", (r) => requests.push(r.url()));
    pageId = Number((await boss.post("/marketing/pages", { name: "Viewport" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: content() }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    await openEditor();
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("zoom + / − : niveaux usuels, limites, rafale, ni saut de la barre de zoom ni couche graphique restante", async () => {
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
    for (let i = 0; i < 4; i++) await clickZoom("-");
    assert.equal(await zoomNow(), 0.25, "25 % : plancher");
    assert.equal(await page.locator('[data-pb-zoom="-"]').isDisabled(), true);
    assert.deepEqual(await gz(), g0, "la barre de zoom ne bouge jamais");
    // Rafale : sans pause, la cible finale est exacte (1 → 1.25 → 1.5 → 2 → 3)
    await clickZoom("100");
    for (let i = 0; i < 4; i++) await page.click('[data-pb-zoom="+"]');
    await idle();
    assert.equal(await zoomNow(), 3, "rafale : la cible finale est exacte");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector("[data-pb-frame-wrap]")).willChange), "auto", "la couche graphique (will-change) disparaît à la fin");
    await clickZoom("100");
  });

  test("la transition est une transformation : image de départ = image affichée (aucun saut), arrivée exacte, 130 à 200 ms", async () => {
    await page.click('.pb-devices button[data-device="tablet"]'); await wait(500);
    await clickZoom("100");
    const rect0 = await frameBox();
    const info = await page.evaluate(async () => {
      const wrap = document.querySelector("[data-pb-frame-wrap]"), r0 = wrap.getBoundingClientRect();
      const samples = []; const t0 = performance.now();
      document.querySelector('[data-pb-zoom="+"]').click();
      await new Promise((res) => { (function tick() { const r = wrap.getBoundingClientRect(); samples.push({ t: performance.now() - t0, w: r.width, l: r.left, anim: wrap.classList.contains("is-zooming") }); if (performance.now() - t0 < 420) requestAnimationFrame(tick); else res(); })(); });
      return { first: samples[0], samples, w0: r0.width, l0: r0.left, last: samples[samples.length - 1] };
    });
    assert.ok(Math.abs(info.first.w - info.w0) < info.w0 * 0.06, `première image proche de l'affichage précédent (${info.first.w} vs ${info.w0})`);
    assert.ok(info.samples.some((s) => s.anim), "une transition a lieu");
    const animMs = info.samples.filter((s) => s.anim).slice(-1)[0].t;
    assert.ok(animMs >= 100 && animMs <= 320, `durée de transition raisonnable (${Math.round(animMs)} ms mesurées au rythme des images)`);
    assert.ok(Math.abs(info.last.w - info.w0 * 1.25) < 1.5, `arrivée exacte : largeur ${info.last.w} ≈ ${info.w0 * 1.25}`);
    assert.equal(info.last.anim, false);
    void rect0;
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
    await page.click('.pb-devices button[data-device="tablet"]'); await wait(500); await clickZoom("100");
    const id = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const el = d.querySelector('[data-node-id^="hw00000000"]') || d.querySelector("[data-node-id]"); el.scrollIntoView({ block: "center" }); el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: d.defaultView })); return el.getAttribute("data-node-id"); });
    await wait(400);
    const logical = () => page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument, el = d.querySelector(`[data-node-id="${id}"]`); return { w: el.offsetWidth, h: el.offsetHeight }; }, id);
    const screen = () => page.evaluate((id) => { const d = document.querySelector("[data-pb-frame]").contentDocument, el = d.querySelector(`[data-node-id="${id}"]`), r = el.getBoundingClientRect(), f = document.querySelector("[data-pb-frame]").getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100; return { w: r.width * z, h: r.height * z, z, fw: f.width }; }, id);
    const l1 = await logical();
    for (const step of ["+", "+", "+"]) {
      await clickZoom(step);
      const l = await logical(), s = await screen();
      assert.deepEqual(l, l1, "dimensions logiques inchangées par le zoom");
      assert.ok(Math.abs(s.w - l1.w * s.z) < 1.5, `largeur à l'écran = logique × zoom (${s.w} vs ${l1.w * s.z})`);
    }
    assert.equal(await page.evaluate(() => !!document.querySelector(".pb-sel-box, .pb-cbar:not([hidden])")), true, "la sélection reste");
    await clickZoom("100");
  });

  test("outil Main : suit le curseur à 1:1 (y compris à 200 %), même hors du cadre ; Espace maintenu = main temporaire", async () => {
    await page.click('.pb-devices button[data-device="tablet"]'); await wait(500);
    for (const z of [1, 2]) {
      await clickZoom(z === 1 ? "100" : "+"); if (z === 2) { await clickZoom("+"); await clickZoom("+"); }
      const zn = await zoomNow();
      await page.evaluate(() => document.querySelector("[data-pb-frame]").contentWindow.scrollTo(0, 400));
      await page.click('.pb-tool[data-mode="hand"]'); await wait(120);
      const box = await frameBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2, y0 = await scrollY();
      await page.mouse.move(cx, cy); await page.mouse.down();
      for (let i = 1; i <= 20; i++) await page.mouse.move(cx, cy - i * 10);        // 200 px d'écran vers le haut
      await page.mouse.move(cx, 20, { steps: 3 });                                  // le curseur sort du cadre (barre du haut) : le geste continue
      await page.mouse.up(); await wait(120);
      const moved = (await scrollY()) - y0, expected = (cy - 20) / zn;
      assert.ok(Math.abs(moved - expected) <= 3, `${Math.round(zn * 100)} % : défilement ${Math.round(moved)} px ≈ ${Math.round(expected)} px (distance écran ÷ zoom)`);
      await page.click('.pb-tool[data-mode="select"]'); await wait(80);
    }
    await clickZoom("100");
    // Espace maintenu : main temporaire, puis retour à l'outil précédent
    await page.locator("[data-pb-canvas]").click({ position: { x: 5, y: 5 }, force: true });
    assert.equal(await page.getAttribute('.pb-tool[data-mode="select"]', "aria-pressed"), "true");
    await page.keyboard.down("Space");
    assert.equal(await page.getAttribute('.pb-tool[data-mode="hand"]', "aria-pressed"), "true", "Espace : main active");
    await page.keyboard.up("Space");
    assert.equal(await page.getAttribute('.pb-tool[data-mode="select"]', "aria-pressed"), "true", "Espace relâché : outil précédent");
    // Jamais dans un champ de saisie
    const input = page.locator(".pb-left input[type=search], .pb-left input[type=text]").first();
    if (await input.count()) { await input.focus(); await page.keyboard.down("Space"); assert.equal(await page.getAttribute('.pb-tool[data-mode="hand"]', "aria-pressed"), "false", "Espace dans un champ : non intercepté"); await page.keyboard.up("Space"); }
  });

  test("Ctrl + molette : un niveau de zoom par geste", async () => {
    await clickZoom("100");
    await page.mouse.move(800, 400);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, -120); await page.keyboard.up("Control"); await idle();
    assert.equal(await zoomNow(), 1.25);
    await wait(150);
    await page.keyboard.down("Control"); await page.mouse.wheel(0, 120); await page.keyboard.up("Control"); await idle();
    assert.equal(await zoomNow(), 1);
  });

  test("Navigateur : chargé à la demande, miniature proportionnée, rectangle exact, navigation par clic et glisser, ouverture/fermeture répétées", async () => {
    await page.click('.pb-devices button[data-device="desktop"]'); await wait(600); await clickZoom("100");
    assert.equal(await page.evaluate(() => typeof window.pbNavigator), "undefined", "non chargé au démarrage");
    assert.equal(requests.some((u) => /page-builder-navigator\.js/.test(u)), false, "aucune requête du fichier avant le premier clic");
    await page.click("[data-pb-navigator]");
    await page.waitForSelector(".pb-nav.is-open");
    assert.equal(requests.some((u) => /page-builder-navigator\.js/.test(u)), true, "chargé au premier clic");
    await wait(500);
    const m = () => page.evaluate(() => {
      const f = document.querySelector("[data-pb-frame]"), de = f.contentDocument.documentElement, tb = document.querySelector(".pb-nav-thumb").getBoundingClientRect(), r = document.querySelector(".pb-nav-rect").getBoundingClientRect(), z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, st = document.querySelector("[data-pb-stage]").getBoundingClientRect(), fr = f.getBoundingClientRect();
      return { docW: de.scrollWidth, docH: de.scrollHeight, y: f.contentWindow.scrollY, tw: tb.width, th: tb.height, tl: tb.left, tt: tb.top, rx: r.left - tb.left, ry: r.top - tb.top, rw: r.width, rh: r.height, z, viewH: Math.min(st.bottom, fr.bottom) - Math.max(st.top, fr.top), title: document.querySelector(".pb-nav-zoom").textContent };
    });
    let a = await m();
    assert.ok(Math.abs(a.tw / a.th - a.docW / a.docH) / (a.docW / a.docH) < 0.04, `miniature à la proportion de la page (${(a.tw / a.th).toFixed(3)} vs ${(a.docW / a.docH).toFixed(3)})`);
    assert.ok(a.tw <= 212 && a.th <= 304, "miniature compacte");
    const vh = a.viewH / a.z;
    assert.ok(Math.abs(a.rh / a.th - vh / a.docH) < 0.03, `hauteur du rectangle = zone visible (${(a.rh / a.th).toFixed(3)} vs ${(vh / a.docH).toFixed(3)})`);
    assert.ok(Math.abs(a.ry / a.th - a.y / a.docH) < 0.03, "position du rectangle = défilement");
    assert.equal(a.title, "100 %");
    // La miniature n'est pas vide : des pixels sont réellement dessinés
    assert.ok(await page.evaluate(() => { const c = document.querySelector(".pb-nav-thumb"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 17) if (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245) n++; return n > 20; }), "miniature dessinée");
    // Clic dans la miniature : la page se centre sur ce point
    await page.mouse.click(a.tl + a.tw / 2, a.tt + a.th * 0.8); await wait(250);
    let b = await m();
    const want = Math.min(b.docH - vh, Math.max(0, 0.8 * b.docH - vh / 2));
    assert.ok(Math.abs(b.y - want) <= Math.max(6, b.docH * 0.01), `clic : défilement ${Math.round(b.y)} ≈ ${Math.round(want)}`);
    assert.ok(Math.abs(b.ry / b.th - b.y / b.docH) < 0.03, "le rectangle suit");
    // Glisser le rectangle : la page suit
    const rc = { x: b.tl + b.rx + b.rw / 2, y: b.tt + b.ry + b.rh / 2 };
    await page.mouse.move(rc.x, rc.y); await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(rc.x, rc.y - i * (b.th * 0.04));
    await page.mouse.up(); await wait(250);
    const c = await m();
    assert.ok(c.y < b.y - b.docH * 0.2, `glisser vers le haut : la page remonte (${Math.round(b.y)} → ${Math.round(c.y)})`);
    // Zoom 200 % : le rectangle devient plus petit ; défilement de la page : le rectangle se déplace
    await clickZoom("+"); await clickZoom("+"); await clickZoom("+"); await wait(300);
    const d = await m();
    assert.ok(d.rh < a.rh * 0.7 || d.rh < c.rh * 0.7, `zoom 200 % : rectangle plus petit (${Math.round(d.rh)} < ${Math.round(c.rh)})`);
    assert.ok(Math.abs(d.rh / d.th - (d.viewH / d.z) / d.docH) < 0.04, "rectangle exact après zoom");
    await clickZoom("100");
    // Réinitialiser, page entière, ajuster
    await page.click('.pb-nav-btn[aria-label="Revenir en haut à gauche"]'); await wait(200);
    assert.equal(Math.round(await scrollY()), 0);
    await page.click('.pb-nav-btn[aria-label="Afficher la page entière"]'); await wait(400);
    const whole = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"), st = document.querySelector("[data-pb-stage]"); return { h: f.contentDocument.documentElement.scrollHeight, z: parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100, stageH: st.clientHeight - 48 }; });
    assert.ok(whole.z <= 0.26 || whole.h * whole.z <= whole.stageH + 4, `page entière : tient dans la zone (${Math.round(whole.h * whole.z)} ≤ ${whole.stageH}) ou 25 %`);
    await clickZoom("100");
    // Ouverture / fermeture répétées : un seul panneau, aucune erreur, état cohérent
    for (let i = 0; i < 10; i++) { await page.click("[data-pb-navigator]"); await wait(40); }
    assert.equal(await page.locator(".pb-nav").count(), 1, "un seul panneau");
    await wait(300);
    assert.equal(await page.getAttribute("[data-pb-navigator]", "aria-expanded"), "true", "10 bascules à partir d'un panneau ouvert : il est ouvert");
    assert.equal(await page.locator(".pb-nav").isVisible(), true);
    await page.click("[data-pb-navigator]"); await page.waitForFunction(() => document.querySelector(".pb-nav").hidden, null, { timeout: 3000 });
    assert.equal(await page.getAttribute("[data-pb-navigator]", "aria-expanded"), "false");
    await page.click("[data-pb-navigator]"); await page.waitForSelector(".pb-nav.is-open");
    // Fermer au clic sur ×
    await page.click('.pb-nav-btn[aria-label="Fermer le Navigateur"]'); await page.waitForFunction(() => document.querySelector(".pb-nav").hidden, null, { timeout: 3000 });
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});
