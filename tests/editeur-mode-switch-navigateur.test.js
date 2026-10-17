// Sélecteur de mode « Éditeur visuel / Éditeur en blocs » dans un VRAI Chrome : état actif fidèle, aucun décalage de la barre au survol / au clic / au focus,
// changement de mode immédiat (clics rapides compris), infobulle (délai, position, titre + raccourci, passage d'un bouton à l'autre), focus clavier visible,
// raccourci Ctrl/⌘ + Maj + E, aucun nouveau rendu du canevas. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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
const mod = process.platform === "darwin" ? "Meta" : "Control";
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "h00000000001", type: "heading", props: { text: "Titre", level: "2" } }] }] };

describe("sélecteur de mode de l'éditeur de pages (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId, renders, errors;
  const until = async (fn, what, ms = 8000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(50); } };
  const btn = (m) => page.locator(`[data-pb-mode="${m}"]`);
  const active = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-mode]")].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.dataset.pbMode));
  const tipState = () => page.evaluate(() => { const t = document.getElementById("pb-tip"); const r = t.getBoundingClientRect(); return { hidden: t.hidden, text: t.textContent, key: (t.querySelector(".pb-tip-key") || {}).textContent || "", x: r.left, y: r.top, w: r.width, h: r.height, pos: getComputedStyle(t).position }; });
  const geo = () => page.evaluate(() => { const r = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.width, q.height].map((v) => Math.round(v * 10) / 10); };
    return { top: r(document.querySelector(".pb-top")), seg: r(document.querySelector(".pb-mode-seg")), a: r(document.querySelector('[data-pb-mode="visual"]')), b: r(document.querySelector('[data-pb-mode="structure"]')), next: [...document.querySelectorAll(".pb-top-right > *, .pb-top-left > *")].map(r) }; });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = []; renders = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => { if (/\/rendu$/.test(r.url())) renders++; });
    pageId = Number((await boss.post("/marketing/pages", { name: "Mode" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("un seul groupe segmenté, un seul mode actif, rôles et noms accessibles", async () => {
    assert.deepEqual(await active(), ["visual"]);
    assert.equal(await page.locator('.pb-mode-seg[role="radiogroup"][aria-label]').count(), 1);
    for (const m of ["visual", "structure"]) { assert.equal(await btn(m).getAttribute("role"), "radio"); assert.ok((await btn(m).textContent()).trim().length > 5, "libellé visible"); }
    const st = await page.evaluate(() => { const g = (m) => getComputedStyle(document.querySelector(`[data-pb-mode="${m}"]`)); return { a: [g("visual").backgroundColor, g("visual").color], i: [g("structure").backgroundColor, g("structure").color], w: [g("visual").fontWeight, g("structure").fontWeight] }; });
    assert.notEqual(st.a[0], st.i[0], "le mode actif a une surface différente");
    assert.notEqual(st.a[0], "rgb(255, 255, 255)", "plus de pastille blanche pleine");
    assert.equal(st.w[0], st.w[1], "même graisse : la largeur ne change pas entre les états");
  });

  test("survol, appui et focus ne déplacent rien (barre, groupe, boutons, voisins)", async () => {
    const base = await geo();
    for (const m of ["structure", "visual"]) {
      await btn(m).hover(); await wait(250);
      assert.deepEqual(await geo(), base, `survol de ${m}`);
    }
    await btn("structure").hover(); await page.mouse.down(); await wait(120);
    assert.deepEqual((await geo()).top, base.top, "barre pendant l'appui");
    assert.deepEqual((await geo()).next, base.next, "voisins pendant l'appui");
    await page.mouse.move(5, 400); await page.mouse.up(); await wait(250); // relâché ailleurs : ce n'est pas un clic
    await btn("visual").focus(); await page.keyboard.press("Tab"); await wait(200);
    assert.deepEqual((await geo()).top, base.top, "barre avec focus clavier");
    assert.deepEqual((await geo()).seg, base.seg, "groupe avec focus clavier");
    assert.deepEqual(await active(), ["visual"], "appui relâché hors du bouton : le mode n'a pas changé");
  });

  test("focus clavier : anneau visible (ombre), pas d'anneau natif", async () => {
    await page.mouse.move(5, 400);
    await btn("visual").focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab"); await wait(250);
    const f = await page.evaluate(() => { const b = document.activeElement; return { which: b.dataset.pbMode, matches: b.matches(":focus-visible"), shadow: getComputedStyle(b).boxShadow, outline: getComputedStyle(b).outlineStyle }; });
    assert.equal(f.which, "visual"); assert.equal(f.matches, true);
    assert.ok(/rgb/.test(f.shadow) && f.shadow !== "none", `anneau : ${f.shadow}`);
    assert.equal(f.outline, "none", "pas de contour natif massif");
  });

  test("clic : le mode change tout de suite ; clics rapides : état toujours cohérent, aucun nouveau rendu du canevas", async () => {
    const r0 = renders;
    await btn("structure").click();
    assert.deepEqual(await active(), ["structure"], "immédiat");
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-canvas]").classList.contains("is-structure")), true);
    for (let i = 0; i < 9; i++) await btn(i % 2 ? "structure" : "visual").click({ delay: 0 });
    await wait(300);
    const now = (await active())[0];
    assert.equal((await active()).length, 1);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-canvas]").classList.contains("is-structure")), now === "structure", "le canevas correspond au mode affiché");
    assert.equal(renders, r0, "changer de mode ne redessine pas le canevas côté serveur");
    await btn("visual").click(); await wait(200);
  });

  test("raccourci Ctrl/⌘ + Maj + E : bascule, le contrôle reflète le vrai mode", async () => {
    await page.mouse.move(5, 400); await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press(`${mod}+Shift+e`); await until(async () => (await active())[0] === "structure", "bascule en blocs");
    await page.keyboard.press(`${mod}+Shift+e`); await until(async () => (await active())[0] === "visual", "retour au visuel");
  });

  test("infobulle : pas avant ~350 ms, puis apparition près du bouton, titre + raccourci, hors flux, fermeture propre", async () => {
    await page.mouse.move(5, 400); await wait(300);
    const base = await geo();
    const b = await btn("structure").boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await wait(120);
    assert.equal((await tipState()).hidden, true, "pas d'infobulle immédiate");
    await until(async () => !(await tipState()).hidden, "infobulle visible", 1500);
    await wait(200);
    const t = await tipState();
    assert.equal(t.pos, "fixed", "hors flux");
    assert.ok(/Ctrl|⌘/.test(t.key) && /basculer/.test(t.key), `raccourci en second plan : « ${t.key} »`);
    assert.ok(/blocs/.test(t.text));
    assert.ok(t.x >= 8 && t.x + t.w <= 1500 - 8 && t.y >= 8, "dans la fenêtre");
    assert.ok(t.y >= b.y + b.height - 2, "sous le bouton, attachée à lui");
    assert.deepEqual(await geo(), base, "l'infobulle ne déplace rien");
    await page.mouse.move(5, 400); await wait(150);
    assert.equal((await tipState()).hidden, true, "fermée dès que la souris part");
  });

  test("passage direct d'un bouton à l'autre : la seconde infobulle arrive vite, sans clignoter", async () => {
    const a = await btn("visual").boundingBox(), b = await btn("structure").boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await until(async () => !(await tipState()).hidden, "première infobulle", 1500);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
    const t0 = Date.now();
    await until(async () => { const t = await tipState(); return !t.hidden && /blocs/.test(t.text); }, "seconde infobulle", 1500);
    assert.ok(Date.now() - t0 < 300, `seconde infobulle en ${Date.now() - t0} ms`);
    await page.mouse.move(5, 400);
  });

  test("fenêtres plus étroites (la barre se replie comme avant) : le sélecteur reste visible et utilisable, la barre ne change pas de hauteur selon l'état", async () => {
    for (const w of [1100, 900, 720]) {
      await page.setViewportSize({ width: w, height: 900 }); await wait(300);
      const read = () => page.evaluate(() => { const s = document.querySelector(".pb-mode-seg").getBoundingClientRect(); const t = document.querySelector(".pb-top").getBoundingClientRect(); return { right: s.right, left: s.left, h: t.height, vw: innerWidth }; });
      const g0 = await read();
      assert.ok(g0.left >= 0 && g0.right <= g0.vw, `visible à ${w} px (${Math.round(g0.left)}–${Math.round(g0.right)})`);
      await btn("structure").hover(); await wait(200);
      await btn("structure").click(); assert.deepEqual(await active(), ["structure"]); await wait(200);
      assert.equal((await read()).h, g0.h, `hauteur de barre identique après survol et clic à ${w} px`);
      await btn("visual").click(); assert.deepEqual(await active(), ["visual"]);
    }
    await page.setViewportSize({ width: 1500, height: 900 });
  });

  test("aucune erreur JavaScript", () => assert.deepEqual(errors, []));
});
