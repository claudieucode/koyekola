// Panneau « Structure » de l'éditeur d'e-mails dans un VRAI Chrome (vraie souris) : survoler ou sélectionner une carte ne fait bouger AUCUNE autre
// carte (la zone d'actions flotte au survol au lieu d'entrer dans le flux), le survol ne change pas de carte en boucle, une modification ne
// reconstruit que la carte concernée, et sélection, glisser-déposer, duplication et annuler / rétablir fonctionnent toujours.
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
const TYPES = ["heading", "text", "heading", "image", "text", "text", "list", "text", "text", "button"];

describe("Structure de l'éditeur d'e-mails : stable au survol et à la sélection (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const items = () => page.evaluate(() => [...document.querySelectorAll("#mk-structure .mk-structure-item")].map((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), height: Math.round(r.height), id: e.getAttribute("data-id") }; }));
  const names = () => page.evaluate(() => [...document.querySelectorAll("#mk-structure .mk-structure-name")].map((e) => e.textContent));
  const count = () => page.evaluate(() => document.querySelectorAll("#mk-structure .mk-structure-item").length);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const id = Number((await boss.post("/marketing/modeles", { name: "Structure stable", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true, ignoreDefaultArgs: ["--hide-scrollbars"] });
    context = await browser.newContext({ viewport: { width: 1500, height: 850 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.querySelectorAll("[data-mk-block]").length > 0; }), "canevas prêt");
    for (const t of TYPES) { await page.evaluate((t) => document.querySelector(`[data-add="${t}"]`).click(), t); await wait(120); }
    await until(async () => (await count()) === TYPES.length + 2, "blocs créés");
    await page.click("#tab-structure"); await wait(700);
    await page.mouse.move(5, 5); await wait(200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("survol lent de toute la liste : aucune carte ne change de taille ni de place, le survol avance sans aller-retour", async () => {
    const rest = await items();
    const x = await page.evaluate(() => { const r = document.querySelector("#mk-structure .mk-structure-item").getBoundingClientRect(); return Math.round(r.left + r.width / 2); });
    await page.evaluate(() => { window.__rec = []; (function tick() { const els = [...document.querySelectorAll("#mk-structure .mk-structure-item")]; window.__rec.push([els.findIndex((e) => e.matches(":hover")), els.map((e) => Math.round(e.getBoundingClientRect().top) + ":" + Math.round(e.getBoundingClientRect().height)).join(" ")]); window.__stop || requestAnimationFrame(tick); })(); });
    const first = rest[0], last = rest[rest.length - 1];
    const bottom = await page.evaluate(() => Math.round(document.querySelector(".mk-b-side").getBoundingClientRect().bottom) - 6); // jusqu'au bas du panneau visible
    for (let y = first.top + 15; y < Math.min(last.top + last.height, bottom); y += 6) { await page.mouse.move(x, y); await wait(16); }
    await page.evaluate(() => { window.__stop = true; });
    const rec = await page.evaluate(() => window.__rec);
    const layouts = new Set(rec.map((r) => r[1]));
    assert.equal(layouts.size, 1, `la mise en page change pendant le survol (${layouts.size} états)`);
    const hov = rec.map((r) => r[0]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
    let flips = 0; for (let i = 2; i < hov.length; i++) if (hov[i] === hov[i - 2] && hov[i] !== hov[i - 1]) flips++;
    assert.equal(flips, 0, `allers-retours de survol : ${hov.join(",")}`);
    assert.ok(hov.filter((v) => v >= 0).length >= 5, "les cartes visibles ont bien été survolées");
  });

  test("survoler une carte fait apparaître ses actions sans déplacer les autres ; les actions flottantes fonctionnent (dupliquer, annuler, rétablir)", async () => {
    const rest = await items();
    const box = await page.evaluate(() => { const r = document.querySelectorAll("#mk-structure .mk-structure-item")[3].getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 20) }; });
    await page.mouse.move(box.x, box.y); await wait(300);
    assert.deepEqual(await items(), rest, "les cartes bougent au survol");
    const vis = await page.evaluate(() => { const a = document.querySelectorAll("#mk-structure .mk-structure-item")[3].querySelector(".mk-structure-actions"); const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); return { display: cs.display, position: cs.position, h: Math.round(r.height) }; });
    assert.equal(vis.display, "flex"); assert.equal(vis.position, "absolute"); assert.ok(vis.h > 20);
    const n0 = await count();
    await page.locator("#mk-structure .mk-structure-item").nth(3).locator('button[aria-label^="Dupliquer"], button[data-tip="Dupliquer"]').first().click();
    await until(async () => (await count()) === n0 + 1, "bloc dupliqué");
    await page.click("#mk-undo"); await until(async () => (await count()) === n0, "annulation");
    await page.click("#mk-redo"); await until(async () => (await count()) === n0 + 1, "rétablissement");
    await page.click("#mk-undo"); await until(async () => (await count()) === n0, "annulation finale");
  });

  test("sélections successives (1 → 10) : la liste ne défile pas, aucune autre carte ne bouge d'un clic à l'autre au-delà de la carte sélectionnée", async () => {
    const st0 = await page.evaluate(() => document.querySelector(".mk-b-side").scrollTop);
    const rows = await items();
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      await page.evaluate((i) => document.querySelectorAll("#mk-structure .mk-structure-btn")[i].click(), i); await wait(250);
      const sel = await page.evaluate(() => [...document.querySelectorAll("#mk-structure .mk-structure-item")].map((e) => e.classList.contains("is-selected")));
      assert.equal(sel.filter(Boolean).length, 1, "une seule carte sélectionnée");
      assert.equal(sel[i], true);
      const now = await items();
      // les cartes AVANT la sélectionnée ne bougent pas
      for (let k = 0; k < i; k++) assert.deepEqual(now[k], rows[k], `la carte ${k + 1} bouge quand on sélectionne la ${i + 1}`);
    }
    assert.equal(await page.evaluate(() => document.querySelector(".mk-b-side").scrollTop), st0, "défilement de la liste");
  });

  test("modifier un bloc ne reconstruit que sa carte : les autres gardent leur élément DOM", async () => {
    await page.evaluate(() => { [...document.querySelectorAll("#mk-structure .mk-structure-item")].forEach((e, i) => { e.__marque = i; }); });
    const lastIndex = (await count()) - 1;
    await page.evaluate(() => document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]")[document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]").length - 1].click());
    await until(() => page.evaluate(() => !!document.querySelector("#mk-props [id$='-url']")), "réglages du bouton");
    const f = page.locator("#mk-props [id$='-url']").first(); await f.fill("https://exemple.fr/x"); await f.press("Tab");
    await until(() => page.evaluate(() => [...document.querySelectorAll("#mk-structure .mk-structure-sum")].some((e) => /exemple\.fr/.test(e.textContent))), "résumé mis à jour");
    await wait(600);
    const kept = await page.evaluate(() => [...document.querySelectorAll("#mk-structure .mk-structure-item")].map((e) => e.__marque));
    assert.equal(kept.filter((v, i) => v === i).length, kept.length - 1, `cartes conservées : ${kept.join(",")}`);
    assert.equal(kept[lastIndex], undefined, "seule la carte modifiée est recréée");
  });

  test("glisser-déposer d'une carte par sa poignée : l'ordre change vraiment, sans erreur", async () => {
    const before = await names();
    const grip = page.locator("#mk-structure .mk-structure-item").nth(1).locator(".mk-structure-grip");
    const target = page.locator("#mk-structure .mk-structure-item").nth(4);
    const tb = await target.boundingBox();
    await grip.dragTo(target, { targetPosition: { x: Math.round(tb.width / 2), y: Math.round(tb.height - 5) } });
    await until(async () => JSON.stringify((await names()).map((n) => n.replace(/^\d+\. /, ""))) !== JSON.stringify(before.map((n) => n.replace(/^\d+\. /, ""))), "ordre changé");
    assert.deepEqual(errors, []);
  });
});
