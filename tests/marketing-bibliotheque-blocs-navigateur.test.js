// Bibliothèque de blocs de l'éditeur d'e-mails dans un VRAI Chrome (Playwright) : grille alignée sur 2 colonnes, recherche (photo, achat, vente,
// social), filtres, catégories repliables, ajout par clic et par glisser-déposer, ensembles réels et modifiables, récents mémorisés,
// annuler / rétablir, duplication, enregistrement puis réouverture à l'identique.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const catalog = require("../src/marketing/templates/catalog");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("bibliothèque de blocs de l'éditeur d'e-mails (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, id;
  const types = () => page.evaluate(() => [].map.call(document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]"), (n) => n.getAttribute("data-mk-block")));
  const count = async () => (await types()).length;
  const until = async (fn, what, ms = 10000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await new Promise((r) => setTimeout(r, 100)); } };
  const open = async () => {
    if (context) await context.close();
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(0, 100)}`); });
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }), "canevas prêt");
  };
  const visibleNames = () => page.evaluate(() => [].filter.call(document.querySelectorAll("#mk-palette .mk-palette-group:not([hidden]):not(#mk-palette-recent) .mk-palette-btn:not([hidden])"), (b) => b.offsetParent).map((b) => b.querySelector(".mk-palette-label").textContent));

  // Ouvre la catégorie du bouton si elle est repliée (comme le ferait l'auteur), puis clique
  const press = async (selector) => {
    const group = page.locator(".mk-palette-group:not(#mk-palette-recent)", { has: page.locator(selector) });
    const toggle = group.locator(".mk-palette-toggle");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    await page.click(selector);
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/modeles", { name: "Bibliothèque", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("cartes sur 2 colonnes alignées, étiquettes sur 2 lignes au plus, aucun débordement horizontal", async () => {
    const m = await page.evaluate(() => {
      const list = [].find.call(document.querySelectorAll("#mk-palette .mk-palette-list:not([hidden])"), (l) => l.querySelectorAll(".mk-palette-btn").length >= 4);
      const btns = [].filter.call(list.querySelectorAll(".mk-palette-btn"), (b) => !b.hidden).map((b) => b.getBoundingClientRect());
      const lefts = [...new Set(btns.map((r) => Math.round(r.left)))], heights = [...new Set(btns.map((r) => Math.round(r.height)))];
      const side = document.querySelector(".mk-b-side");
      const label = list.querySelector(".mk-palette-label");
      return { lefts, heights, n: btns.length, overflow: side.scrollWidth > side.clientWidth + 1, clamp: getComputedStyle(label).webkitLineClamp };
    });
    assert.ok(m.n >= 2);
    assert.equal(m.lefts.length, 2, `colonnes : ${m.lefts}`);
    assert.equal(m.heights.length, 1, `hauteurs : ${m.heights}`);
    assert.equal(m.overflow, false);
    assert.equal(m.clamp, "2");
  });

  test("recherche : photo → Image, achat → Bouton / Formation, vente → Coupon / Offre / Promotion, social → Réseaux sociaux ; aucun résultat → message", async () => {
    const q = (t) => page.fill("#mk-palette-search", t);
    await q("photo"); assert.ok((await visibleNames()).includes("Image"));
    await q("achat"); { const n = await visibleNames(); assert.ok(n.includes("Bouton") && n.includes("Formation"), n.join()); }
    await q("vente"); { const n = await visibleNames(); for (const x of ["Coupon", "Offre", "Promotion limitée"]) assert.ok(n.includes(x), x); }
    await q("social"); assert.equal((await visibleNames())[0], "Réseaux sociaux");
    await q("PRENOM"); assert.ok((await visibleNames()).includes("Message personnalisé"));
    await q("zzzxyz"); assert.deepEqual(await visibleNames(), []); assert.equal(await page.isVisible("#mk-palette-empty"), true);
    await q(""); assert.equal(await page.isVisible("#mk-palette-empty"), false);
    assert.ok((await visibleNames()).length >= 10);
  });

  test("filtres : E-commerce, Essentiels, Dynamique ; retour à Tous", async () => {
    const f = async (key) => { await page.click(`[data-filter="${key}"]`); return visibleNames(); };
    const eco = await f("ecommerce"); assert.ok(eco.includes("Coupon") && eco.includes("Formation") && !eco.includes("Titre"), eco.join());
    const ess = await f("essential"); assert.ok(ess.includes("Titre") && ess.includes("Bouton") && !ess.includes("Coupon"), ess.join());
    const dyn = await f("dynamic"); assert.ok(dyn.includes("Articles") && !dyn.includes("Séparateur"), dyn.join());
    assert.equal(await page.getAttribute('[data-filter="dynamic"]', "aria-pressed"), "true");
    const all = await f("all"); assert.ok(all.length > ess.length);
  });

  test("catégories repliables : clic sur l'en-tête, état annoncé (aria-expanded)", async () => {
    const toggle = page.locator('.mk-palette-group[data-cat="text"] .mk-palette-toggle');
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('.mk-palette-group[data-cat="text"] .mk-palette-list').isHidden(), true);
    await toggle.click();
    assert.equal(await page.locator('.mk-palette-group[data-cat="text"] .mk-palette-list').isVisible(), true);
  });

  test("clic : un bloc simple puis un ensemble réel s'ajoutent après le bloc sélectionné ; annuler / rétablir", async () => {
    const before0 = await count();
    await press('[data-add="heading"]');
    await until(async () => (await count()) === before0 + 1, "titre ajouté");
    await press('[data-add-preset="benefits"]');
    await until(async () => (await count()) === before0 + 3, "ensemble ajouté (2 blocs)");
    assert.deepEqual((await types()).length, before0 + 3);
    await page.click("#mk-undo"); await until(async () => (await count()) === before0 + 1, "annulation d'un seul coup");
    await page.click("#mk-redo"); await until(async () => (await count()) === before0 + 3, "rétablissement");
  });

  test("glisser-déposer depuis la palette vers l'e-mail (vraie opération du navigateur)", async () => {
    const n0 = await count();
    const src = page.locator('[data-add="divider"]');
    const frameBox = await page.locator("#mk-frame").boundingBox();
    await src.dragTo(page.locator("#mk-frame"), { targetPosition: { x: Math.round(frameBox.width / 2), y: Math.round(frameBox.height / 2) } });
    await until(async () => (await count()) === n0 + 1, "bloc déposé");
  });

  test("récents : mémorisés, affichés en tête, toujours là après rechargement", async () => {
    await press('[data-add="quote"]');
    await until(() => page.evaluate(() => !document.getElementById("mk-palette-recent").hidden), "groupe Récents visible");
    const names = () => page.evaluate(() => [].map.call(document.querySelectorAll("#mk-palette-recent-list .mk-palette-label"), (n) => n.textContent));
    assert.equal((await names())[0], "Citation");
    await page.click('#mk-palette-recent-list [data-add="heading"]'); // un récent est aussi cliquable
    assert.equal((await names())[0], "Titre");
    await page.click('[data-filter="recent"]');
    assert.deepEqual((await visibleNames()), []); // seul le groupe Récents reste
    await page.click('[data-filter="all"]');
  });

  test("duplication d'un bloc, enregistrement, réouverture identique", async () => {
    const structure = () => page.evaluate(() => Number(document.getElementById("mk-structure-count").textContent.replace(/\D/g, "")));
    await until(async () => (await count()) === (await structure()), "aperçu à jour");
    const n0 = await count();
    await page.click('#mk-props .mk-b-blocktools button:has-text("Dupliquer")');
    await until(async () => (await count()) === n0 + 1, `bloc dupliqué (avant ${n0}, après ${await count()}, ${errors.join(" / ")})`);
    await page.click("#mk-save");
    await until(() => page.evaluate(() => /Enregistré/.test(document.getElementById("mk-status").textContent)), "enregistrement confirmé");
    const saved = JSON.parse(srv.db().prepare("SELECT blocks FROM mk_templates WHERE id = ?").get(id).blocks);
    const kinds = saved.map((b) => b.type);
    assert.ok(kinds.includes("quote") && kinds.includes("list") && kinds.includes("divider"), kinds.join());
    const before = await types();
    await page.reload(); await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(async () => (await count()) === before.length, "mêmes blocs après rechargement");
    const again = JSON.parse(srv.db().prepare("SELECT blocks FROM mk_templates WHERE id = ?").get(id).blocks).map((b) => b.type);
    assert.deepEqual(again, kinds);
    const recents = await page.evaluate(() => document.querySelectorAll("#mk-palette-recent-list .mk-palette-btn").length);
    assert.ok(recents >= 2, "les récents survivent au rechargement");
  });

  test("tous les ensembles du registre s'insèrent en vrais blocs, sans erreur de script", async () => {
    for (const e of catalog.ENTRIES.filter((x) => x.kind === "preset")) {
      const n0 = await count();
      const expected = catalog.PRESETS[e.key]().length;
      await press(`[data-add-preset="${e.key}"]`);
      await until(async () => (await count()) === n0 + expected, `ensemble ${e.key}`);
    }
    assert.deepEqual(errors, []);
  });

  test("Mes blocs : enregistrer un bloc, le retrouver dans un autre modèle, l'insérer (clic et glisser), le supprimer", async () => {
    // 1. sélectionner un bloc, l'enregistrer sous un nom
    await page.reload(); await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(async () => (await count()) > 0, "e-mail affiché");
    await page.frameLocator("#mk-frame").locator("[data-mk-block]").first().click();
    await page.click('#mk-props .mk-b-blocktools button:has-text("Enregistrer")');
    assert.equal(await page.isVisible("#mk-save-block"), true);
    await page.fill("#mk-save-block-name", "Mon titre maison");
    await page.click('#mk-save-block button[type="submit"]');
    await page.waitForSelector('#mk-palette-mine-list [data-add-saved]');
    assert.equal(await page.textContent("#mk-palette-mine-count"), "1");
    // 2. un autre modèle le propose aussi
    const other = Number((await boss.post("/marketing/modeles", { name: "Autre modèle", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/modeles/${other}`);
    await page.waitForSelector('#mk-palette-mine-list [data-add-saved]');
    await until(async () => (await count()) > 0, "autre e-mail affiché");
    const n0 = await count();
    await page.click('#mk-palette-mine-list [data-add-saved]');
    await until(async () => (await count()) === n0 + 1, "bloc enregistré inséré au clic");
    const fb = await page.locator("#mk-frame").boundingBox();
    await page.locator('#mk-palette-mine-list [data-add-saved]').dragTo(page.locator("#mk-frame"), { targetPosition: { x: Math.round(fb.width / 2), y: Math.round(fb.height / 2) } });
    await until(async () => (await count()) === n0 + 2, "bloc enregistré déposé");
    const ids = await types(); assert.equal(new Set(ids).size, ids.length, "chaque copie a son propre identifiant");
    // 3. le filtre « Mes blocs » ne montre que lui ; suppression avec confirmation
    await page.click('[data-filter="mine"]');
    assert.deepEqual(await visibleNames(), ["Mon titre maison"]);
    await page.click('[data-filter="all"]');
    await page.hover("#mk-palette-mine-list .mk-palette-saved");
    await page.click("#mk-palette-mine-list [data-del-saved]");
    await page.click("dialog[open] .btn-danger");
    await until(() => page.evaluate(() => !document.querySelector("#mk-palette-mine-list [data-add-saved]")), "bloc enregistré supprimé");
    assert.equal(await page.isVisible("#mk-palette-mine-empty"), true);
    assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM mk_saved_blocks").get().n, 0);
    assert.deepEqual(errors, []);
  });
});
