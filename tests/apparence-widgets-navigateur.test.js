// Apparence → Widgets dans un VRAI Chrome : parcours complet de l'éditeur (ajout, réglages, annuler / rétablir, glisser-déposer, déplacements, désactivés,
// enregistrement, persistance, protections, erreurs serveur, conflit, clavier, panneau, responsive). Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("widgets : éditeur dans un vrai navigateur", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, db, url;
  const zone = (k) => page.locator(`[data-zone="${k}"]`);
  const blocks = (k) => zone(k).locator(".mk-wd-block");
  const state = () => page.locator("[data-wd-state]");
  const stateText = async () => (await state().innerText()).trim();
  const openInserter = async () => { if ((await page.locator("[data-wd-inserter]").getAttribute("aria-pressed")) !== "true") await page.locator("[data-wd-inserter]").click(); await page.locator("[data-wd-search]").waitFor(); };
  const add = async (zoneKey, label) => {
    await openInserter();
    await page.selectOption("#wd-zone-target", zoneKey);
    await page.locator(".mk-wd-item", { hasText: label }).first().click();
  };
  // Glisser-déposer avec de vrais événements de souris (le navigateur produit dragstart / dragover / drop)
  const dnd = async (source, target, at = {}) => {
    await source.scrollIntoViewIfNeeded(); await target.scrollIntoViewIfNeeded();
    const a = await source.boundingBox(), b = await target.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 6, a.y + a.height / 2 + 6, { steps: 3 });
    await page.mouse.move(b.x + (at.x ?? b.width / 2), b.y + (at.y ?? b.height / 2), { steps: 12 });
    await page.mouse.up();
  };
  const settle = () => page.waitForFunction(() => !document.querySelector('.mk-wd-preview[aria-busy="true"]'));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1400, height: 1700 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    url = `${srv.base}/marketing/site-web/widgets`;
    await page.goto(url);
    await page.locator(".mk-wd-zone").first().waitFor();
  });
  after(async () => { if (browser) await browser.close(); if (srv) { db.close(); await srv.stop(); } });

  test("ouverture : quatre sections (trois zones + désactivés), état vide compréhensible, bouton Enregistrer inactif, aucune erreur", async () => {
    assert.equal(await page.locator(".mk-wd-zone").count(), 4);
    assert.match(await zone("sidebar").innerText(), /Colonne latérale principale/);
    assert.match(await zone("inactive").innerText(), /ne seront pas affichés sur votre site/);
    assert.match(await zone("footer-1").innerText(), /Cette zone est vide/);
    assert.equal(await page.locator("[data-wd-save]").isDisabled(), true);
    assert.equal(await page.locator("[data-wd-undo]").isDisabled(), true);
    assert.deepEqual(errors, []);
  });

  test("zones repliables : replier cache le contenu sans le perdre, déplier le restitue", async () => {
    await zone("footer-2").locator(".mk-wd-zone-toggle").click();
    assert.equal(await zone("footer-2").locator(".mk-wd-zone-body").isVisible(), false);
    assert.equal(await zone("footer-2").locator(".mk-wd-zone-toggle").getAttribute("aria-expanded"), "false");
    await zone("footer-2").locator(".mk-wd-zone-toggle").click();
    assert.equal(await zone("footer-2").locator(".mk-wd-zone-body").isVisible(), true);
  });

  test("catalogue : recherche instantanée (sans accent), catégories, état vide explicite", async () => {
    await openInserter();
    assert.equal(await page.locator(".mk-wd-item").count(), 18);
    await page.fill("[data-wd-search]", "etiquet");
    assert.equal(await page.locator(".mk-wd-item").count(), 1); assert.match(await page.locator(".mk-wd-item").innerText(), /Nuage d'étiquettes/);
    await page.fill("[data-wd-search]", "zzzzz");
    assert.match(await page.locator(".mk-wd-list").innerText(), /Aucun bloc ne correspond/);
    await page.fill("[data-wd-search]", "");
    await page.locator(".mk-wd-chip", { hasText: "Médias" }).click();
    assert.equal(await page.locator(".mk-wd-item").count(), 4);
    await page.locator(".mk-wd-chip", { hasText: "Tous" }).click();
  });

  test("ajouter un bloc dans une zone précise : il apparaît, est sélectionné, ses réglages s'ouvrent, l'état devient « non enregistré »", async () => {
    await add("footer-1", "Paragraphe");
    assert.equal(await blocks("footer-1").count(), 1);
    assert.equal(await page.locator('[data-wd-tab="settings"]').getAttribute("aria-selected"), "true");
    await page.locator("#wd-pane-settings textarea").fill("Bonjour depuis le pied de page");
    await settle();
    assert.match(await blocks("footer-1").first().innerText(), /Bonjour depuis le pied de page/, "l'aperçu est le rendu serveur");
    assert.match(await stateText(), /Modifications non enregistrées/);
    assert.equal(await page.locator("[data-wd-save]").isDisabled(), false);
    assert.match(await zone("footer-1").locator(".mk-wd-count").innerText(), /1 bloc/);
  });

  test("Annuler / Rétablir : la saisie, puis l'ajout, puis retour", async () => {
    await page.locator("[data-wd-undo]").click();
    await settle();
    assert.doesNotMatch(await blocks("footer-1").first().innerText(), /Bonjour depuis/);
    await page.locator("[data-wd-undo]").click();
    assert.equal(await blocks("footer-1").count(), 0);
    assert.match(await stateText(), /^$|Enregistré/, "retour à l'état enregistré : plus de modifications");
    assert.equal(await page.locator("[data-wd-save]").isDisabled(), true);
    await page.locator("[data-wd-redo]").click(); await page.locator("[data-wd-redo]").click(); await settle();
    assert.equal(await blocks("footer-1").count(), 1);
    await page.waitForTimeout(500); await settle();
    assert.match(await blocks("footer-1").first().innerText(), /Bonjour depuis le pied de page/, await blocks("footer-1").first().innerHTML());
  });

  test("autres blocs et réglages : titre, liste, bouton, articles récents (données réelles)", async () => {
    await add("footer-1", "Titre");
    await page.locator("#wd-pane-settings input[type=text]").first().fill("Mon titre");
    await add("footer-2", "Bouton");
    await page.locator("#wd-pane-settings input[type=text]").first().fill("Nous écrire");
    await page.locator("#wd-pane-settings input[type=url]").fill("/contact");
    await add("sidebar", "Recherche");
    await settle();
    assert.match(await zone("footer-2").innerText(), /Nous écrire/);
    assert.equal(await zone("footer-2").locator("a").count(), 1);
    assert.equal(await blocks("footer-1").count(), 2);
  });

  test("glisser-déposer : un bloc passe au-dessus d'un autre, la position est visible, l'ordre change", async () => {
    const before = await blocks("footer-1").locator(".mk-wd-block-name").allTextContents();
    assert.deepEqual(before, ["Paragraphe", "Titre"]);
    await dnd(blocks("footer-1").nth(1).locator("[data-card]"), blocks("footer-1").nth(0).locator("[data-card]"), { x: 40, y: 4 });
    assert.deepEqual(await blocks("footer-1").locator(".mk-wd-block-name").allTextContents(), ["Titre", "Paragraphe"]);
  });

  test("glisser-déposer entre zones, puis depuis le catalogue ; déposer un nouveau bloc dans « désactivés » est refusé", async () => {
    await dnd(blocks("footer-1").nth(0).locator("[data-card]"), blocks("footer-2").nth(0).locator("[data-card]"), { y: 4 });
    assert.equal(await blocks("footer-1").count(), 1); assert.equal(await blocks("footer-2").count(), 2);
    await openInserter();
    await dnd(page.locator(".mk-wd-item", { hasText: "Séparateur" }).first(), blocks("sidebar").nth(0).locator("[data-card]"), { y: 4 });
    assert.equal(await blocks("sidebar").count(), 2);
    await dnd(page.locator(".mk-wd-item", { hasText: "Séparateur" }).first(), zone("inactive").locator(".mk-wd-emptyhint"));
    assert.equal(await blocks("inactive").count(), 0, "un nouveau bloc ne va pas dans les désactivés");
  });

  test("menu d'actions du bloc : déplacer vers une zone, dupliquer, désactiver, restaurer", async () => {
    await blocks("sidebar").nth(0).locator("[data-card]").click();
    await blocks("sidebar").nth(0).locator('select[aria-label="Déplacer vers une autre zone"]').selectOption("footer-1");
    assert.equal(await blocks("sidebar").count(), 1); assert.equal(await blocks("footer-1").count(), 2);
    await blocks("footer-1").nth(1).locator("[data-card]").click();
    await blocks("footer-1").nth(1).locator('button[aria-label="Dupliquer"]').click();
    assert.equal(await blocks("footer-1").count(), 3);
    await blocks("footer-1").nth(2).locator("[data-card]").click();
    await blocks("footer-1").nth(2).locator('button[aria-label^="Désactiver"]').click();
    assert.equal(await blocks("footer-1").count(), 2); assert.equal(await blocks("inactive").count(), 1);
    assert.match(await zone("inactive").innerText(), /séparateur/i);
    await blocks("inactive").nth(0).locator("[data-card]").click();
    await blocks("inactive").nth(0).locator('select[aria-label="Restaurer dans une zone"]').selectOption("footer-2");
    assert.equal(await blocks("inactive").count(), 0); assert.equal(await blocks("footer-2").count(), 3);
  });

  test("clavier : Alt+↓ déplace, Suppr supprime (Ctrl+Z rétablit), sans interférer avec la saisie", async () => {
    const names = () => blocks("footer-2").locator(".mk-wd-block-name").allTextContents();
    const first = await names();
    await blocks("footer-2").nth(0).locator("[data-card]").focus();
    await page.keyboard.press("Alt+ArrowDown");
    const after = await names(); assert.deepEqual(after, [first[1], first[0], first[2]]);
    await page.keyboard.press("Delete");
    assert.equal(await blocks("footer-2").count(), 2);
    await page.keyboard.press("Control+z");
    assert.equal(await blocks("footer-2").count(), 3);
    await blocks("footer-2").nth(0).locator("[data-card]").click();
    const field = page.locator("#wd-pane-settings input, #wd-pane-settings textarea").first(); const orig = await field.inputValue(); await field.fill(orig + "x"); await field.press("Control+z");
    assert.equal(await blocks("footer-2").count(), 3, "Ctrl+Z dans un champ n'annule pas l'éditeur");
    await field.fill(orig);
  });

  test("structure : l'arborescence des zones et blocs, cliquer sélectionne le bloc", async () => {
    await page.locator("[data-wd-structure]").click();
    assert.match(await page.locator('[data-wd-pane="structure"]').innerText(), /Section 1 de pied de page \(2\)/);
    await page.locator(".mk-wd-tree-item").first().click();
    assert.equal(await page.locator('[data-wd-tab="settings"]').getAttribute("aria-selected"), "true");
    assert.equal(await page.locator(".mk-wd-block.is-selected").count(), 1);
  });

  test("panneau : se ferme et se rouvre sans perdre la sélection ni recharger", async () => {
    const selected = await page.locator(".mk-wd-block.is-selected").getAttribute("data-block");
    await page.locator("[data-wd-panel-toggle]").click();
    assert.equal(await page.locator("[data-wd-panel]").isVisible(), false);
    assert.equal(await page.locator(".mk-wd-block.is-selected").getAttribute("data-block"), selected);
    await page.locator("[data-wd-panel-toggle]").click();
    assert.equal(await page.locator("[data-wd-panel]").isVisible(), true);
  });

  test("protection : quitter avec des modifications non enregistrées est signalé", async () => {
    const prevented = await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    assert.equal(prevented, true);
  });

  test("erreur serveur : l'enregistrement échoue, rien n'est annoncé comme réussi, les modifications sont conservées, « Réessayer » fonctionne", async () => {
    await page.route("**/widgets/enregistrer*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Erreur de test du serveur." }) }));
    await page.locator("[data-wd-save]").click();
    await page.locator("[data-wd-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-wd-banner]").innerText(), /Erreur de test du serveur/);
    assert.match(await stateText(), /Modifications non enregistrées/);
    assert.doesNotMatch(await stateText(), /Enregistré à/);
    await page.unroute("**/widgets/enregistrer*");
    await page.locator("[data-wd-banner] button", { hasText: "Réessayer" }).click();
    await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-wd-state]").textContent));
    assert.equal(await page.locator("[data-wd-banner]").isHidden(), true);
  });

  test("enregistré : persiste après actualisation (ordre, zones, réglages) et apparaît sur le site public", async () => {
    const snap = async () => ({ f1: await blocks("footer-1").locator(".mk-wd-block-name").allTextContents(), f2: await blocks("footer-2").locator(".mk-wd-block-name").allTextContents(), sb: await blocks("sidebar").locator(".mk-wd-block-name").allTextContents() });
    const mine = await snap();
    await page.reload(); await page.locator(".mk-wd-zone").first().waitFor(); await settle();
    assert.deepEqual(await snap(), mine);
    assert.equal(await page.locator("[data-wd-save]").isDisabled(), true);
    const pub = (await new Client(srv.base).get("/blog")).text;
    assert.match(pub, /Bonjour depuis le pied de page/); assert.match(pub, /Nous écrire/); assert.match(pub, /kw-widget-search/);
  });

  test("double clic sur Enregistrer : une seule écriture", async () => {
    await add("sidebar", "Séparateur");
    const rev = db.prepare("SELECT revision FROM cms_widget_layouts WHERE site_id IS NULL").get().revision;
    await page.locator("[data-wd-save]").dblclick();
    await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-wd-state]").textContent));
    assert.equal(db.prepare("SELECT revision FROM cms_widget_layouts WHERE site_id IS NULL").get().revision, rev + 1);
  });

  test("conflit : modifié ailleurs → message clair, aucun écrasement, Enregistrer bloqué", async () => {
    await add("footer-1", "Espace");
    db.prepare("UPDATE cms_widget_layouts SET revision = revision + 1 WHERE site_id IS NULL").run();
    const before = db.prepare("SELECT layout FROM cms_widget_layouts WHERE site_id IS NULL").get().layout;
    await page.locator("[data-wd-save]").click();
    await page.locator("[data-wd-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-wd-banner]").innerText(), /modifiés ailleurs/);
    assert.equal(db.prepare("SELECT layout FROM cms_widget_layouts WHERE site_id IS NULL").get().layout, before);
    assert.equal(await page.locator("[data-wd-save]").isDisabled(), true);
  });

  test("lecture seule : un lecteur ne voit ni boutons d'édition ni glisser-déposer, mais voit les aperçus", async () => {
    const reader = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const { newStudent } = require("./helpers");
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    const siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Lecture', 'lecture', '{}')").run(orgId).lastInsertRowid);
    const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(siteId, db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id);
    await reader.addCookies([...c.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const p = await reader.newPage();
    await p.goto(`${srv.base}/marketing/site-web/sites/${siteId}/widgets`);
    await p.locator(".mk-wd-zone").first().waitFor();
    assert.equal(await p.locator("[data-wd-save]").isDisabled(), true);
    assert.equal(await p.locator("[data-wd-inserter]").isDisabled(), true);
    assert.equal(await p.locator(".mk-wd-add").count(), 0);
    assert.equal(await p.locator('[draggable="true"]').count(), 0);
    assert.match(await p.locator(".mk-wd-site").innerText(), /consulter les widgets/);
    await reader.close();
  });

  test("site d'un autre : l'éditeur du site A ne montre rien du principal (et inversement)", async () => {
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    const sid = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Autre', 'autre', '{}')").run(orgId).lastInsertRowid);
    await page.goto(`${srv.base}/marketing/site-web/sites/${sid}/widgets`);
    await page.locator(".mk-wd-zone").first().waitFor();
    assert.equal(await page.locator(".mk-wd-block").count(), 0);
    assert.match(await page.locator(".mk-wd-site").innerText(), /Autre/);
  });

  test("responsive : pas de défilement horizontal à 1400, 900 et 390 px ; capture d'écran enregistrée", async () => {
    await page.goto(url); await page.locator(".mk-wd-zone").first().waitFor(); await settle();
    for (const w of [1400, 900, 390]) {
      await page.setViewportSize({ width: w, height: 900 });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 1, `défilement horizontal de ${over}px à ${w}px`);
      assert.ok(await page.locator("[data-wd-save]").isVisible(), `Enregistrer visible à ${w}px`);
    }
    await page.setViewportSize({ width: 1400, height: 1000 });
    if (process.env.WD_SHOT) await page.screenshot({ path: process.env.WD_SHOT, fullPage: false });
    assert.deepEqual(errors, [], "aucune erreur JavaScript pendant tout le parcours");
  });
});
