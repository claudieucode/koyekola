// Aperçu de l'e-mail dans un VRAI Chrome : le cadre n'est jamais visible tant que son rendu n'est pas prêt (pas de cadre vide à taille par défaut,
// pas d'agrandissement en plusieurs temps, pas d'ancien contenu remplacé sous les yeux) ; rouvrir un aperçu inchangé ne recharge rien ;
// un modèle modifié se recharge UNE fois, caché jusqu'au rendu complet ; « Actualiser » force le rechargement.
// Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("aperçu de l'e-mail : stable, sans état intermédiaire visible (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, requests;
  const until = async (fn, what, ms = 20000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  // Échantillonne le cadre à chaque image affichée ; ne retient que les images où il est VISIBLE (visibility, opacité du dialogue ignorée)
  const watch = (ms) => page.evaluate((ms) => new Promise((res) => {
    const f = document.getElementById("mk-preview-frame"), dev = document.getElementById("mk-pv-device"), dlg = document.getElementById("mk-preview-dialog");
    const out = { frames: 0, visible: 0, bad: [], docs: new Set() }; const t0 = performance.now(); let lastDoc = null;
    (function tick() {
      const d = f.contentDocument; if (d !== lastDoc) { out.docs.add(out.docs.size); lastDoc = d; }
      out.frames++;
      if (dlg.open && getComputedStyle(dev).visibility !== "hidden") {
        out.visible++;
        const r = f.getBoundingClientRect(), body = d && d.body;
        const why = [];
        if (!body || !body.children.length) why.push("document vide");
        if (r.height < 400) why.push(`hauteur ${Math.round(r.height)}`);
        if (dlg.getAttribute("aria-busy") === "true") why.push("occupé");
        if (why.length) out.bad.push(`${Math.round(performance.now() - t0)}ms ${why.join(", ")} (${Math.round(r.width)}x${Math.round(r.height)})`);
      }
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res({ frames: out.frames, visible: out.visible, bad: out.bad.slice(0, 5), docs: out.docs.size });
    })();
  }), ms);
  const openPreview = () => page.click("#mk-open-preview");
  const closePreview = async () => { await page.keyboard.press("Escape"); await until(() => page.evaluate(() => !document.getElementById("mk-preview-dialog").open), "aperçu fermé"); };
  const srcdocs = () => page.evaluate(() => window.__src.length);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const id = Number((await boss.post("/marketing/modeles", { name: "Aperçu stable", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 850 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = []; requests = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => { if (/modeles\/apercu/.test(r.url()) && r.method() === "POST") requests++; });
    await page.addInitScript(() => { const d = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc"); window.__src = []; Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", { set(v) { if (this.id === "mk-preview-frame") window.__src.push(String(v).length); return d.set.call(this, v); }, get() { return d.get.call(this); } }); });
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.querySelectorAll("[data-mk-block]").length > 0; }), "canevas prêt");
    for (let i = 0; i < 6; i++) { await page.click('[data-add="text"]'); await wait(120); }
    await wait(1200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("première ouverture : le cadre n'est visible qu'une fois prêt (taille réelle, document rempli, plus occupé)", async () => {
    await page.evaluate(() => { window.__src.length = 0; });
    const w = watch(3500); await openPreview();
    await until(() => page.evaluate(() => document.getElementById("mk-preview-dialog").getAttribute("data-ready") === "true"), "aperçu prêt");
    const r = await w;
    assert.ok(r.visible > 3, `le cadre doit finir visible (${r.visible} images)`);
    assert.deepEqual(r.bad, [], "états intermédiaires visibles");
    assert.equal(await srcdocs(), 1, "un seul chargement du document");
  });

  test("fermer puis rouvrir un aperçu inchangé : aucun rechargement, aucune requête, même document", async () => {
    await closePreview();
    const req0 = requests; await page.evaluate(() => { window.__src.length = 0; });
    const w = watch(2000); await openPreview(); const r = await w;
    assert.equal(await srcdocs(), 0, "aucun srcdoc");
    assert.equal(requests, req0, "aucune requête d'aperçu");
    assert.equal(r.docs, 1, "le document ne change pas");
    assert.ok(r.visible > 3);
    assert.deepEqual(r.bad, []);
  });

  test("modèle modifié puis aperçu rouvert : un seul rechargement, caché jusqu'au rendu complet, jamais l'ancien contenu", async () => {
    await closePreview();
    await page.evaluate(() => { document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]")[2].click(); });
    await wait(500); await page.keyboard.press("Escape");
    await page.click('[data-add="heading"]'); await wait(900);
    await page.evaluate(() => { window.__src.length = 0; });
    const req0 = requests;
    const w = watch(3500); await openPreview();
    await until(() => page.evaluate(() => document.getElementById("mk-preview-dialog").getAttribute("data-ready") === "true"), "aperçu prêt");
    const r = await w;
    assert.equal(await srcdocs(), 1, "un seul rechargement");
    assert.equal(requests, req0 + 1, "une seule requête");
    assert.deepEqual(r.bad, [], "états intermédiaires visibles");
    assert.equal(await page.evaluate(() => document.getElementById("mk-preview-frame").contentDocument.querySelectorAll("h2").length > 0), true, "le nouveau titre est dans l'aperçu");
  });

  test("« Actualiser » force le rechargement ; changer d'appareil ne recharge rien et ne montre aucun état intermédiaire", async () => {
    await page.evaluate(() => { window.__src.length = 0; });
    const w1 = watch(1800); await page.evaluate(() => document.querySelector("[data-pdevice='mobile']").click()); const r1 = await w1;
    assert.equal(await srcdocs(), 0, "changer d'appareil ne recharge pas");
    assert.deepEqual(r1.bad, []);
    await page.click("#mk-pv-refresh");
    await until(() => page.evaluate(() => document.getElementById("mk-preview-dialog").getAttribute("data-ready") === "true" && window.__src.length === 1), "actualisation faite");
    assert.deepEqual(errors, []);
  });
});
