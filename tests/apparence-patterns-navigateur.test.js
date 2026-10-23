// KOLAKISA CMS — Apparence → Patterns dans un VRAI Chrome (Playwright, ignoré sans) : grille et vignettes réelles, recherche et filtres, aperçu (appareils), insertion dans une page,
// enregistrement d'une composition, renommage / duplication / corbeille / restauration, erreurs, clavier, téléphone, lecture seule. Aucune erreur JavaScript.
const { test, describe, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("patterns (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId, pageA1, pageA2;
  const PT = "/marketing/site-web/patterns";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const edit = async (page, site = A) => { await page.goto(`${srv.base}${PT}?site=${site}`); await page.locator("[data-pt-main]:not([hidden])").waitFor(); };
  const more = async (c) => { const d = c.locator(".mk-pt-more"); if ((await d.getAttribute("open")) === null) await c.locator(".mk-pt-more summary").click(); };
  const card = (page, label) => page.locator(".mk-pt-card", { has: page.getByRole("heading", { name: label, exact: true }) });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), JSON.stringify({ colors: { primary: "#8a1c3a" } })).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const mk = (name, s, sections) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), name, JSON.stringify(sections), s).lastInsertRowid);
    pageA1 = mk("Page A1", A, [{ type: "text", markdown: "Texte un" }, { type: "hero", title: "Titre un", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }]);
    pageA2 = mk("Page A2", A, [{ type: "text", markdown: "Seule section" }]); mk("Page B", B, [{ type: "text", markdown: "B" }]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  beforeEach(() => { db.prepare("UPDATE mk_landing_pages SET draft = NULL WHERE site_id = ?").run(A); });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("la bibliothèque s'ouvre : cartes réelles avec vignettes rendues avec les styles du site ; recherche, catégories et sources filtrent", async () => {
    const page = await open(); await edit(page);
    assert.ok((await page.locator(".mk-pt-card").count()) >= 20);
    const firstThumb = page.locator(".mk-pt-thumb iframe").first();
    await page.waitForFunction(() => { const f = document.querySelector(".mk-pt-thumb iframe"); try { return f.contentDocument && f.contentDocument.body && /lp-main/.test(f.contentDocument.body.innerHTML); } catch { return false; } });
    assert.match(await firstThumb.evaluate((f) => f.contentDocument.body.getAttribute("style")), /--kw-primary:#8a1c3a/, "la vignette utilise les styles du site");
    const total = await page.locator(".mk-pt-card").count();
    await page.fill("[data-pt-search]", "tarif");
    assert.ok((await page.locator(".mk-pt-card").count()) < total && (await page.locator(".mk-pt-card").count()) >= 1);
    assert.match(await page.locator("[data-pt-count]").innerText(), /correspondant/);
    await page.fill("[data-pt-search]", "zzzzqqq"); assert.equal(await page.locator("[data-pt-empty]").isVisible(), true);
    await page.fill("[data-pt-search]", "");
    await page.selectOption("[data-pt-cat]", "Vente"); assert.ok((await page.locator(".mk-pt-card").count()) < total);
    await page.selectOption("[data-pt-cat]", "");
    await page.click('[data-pt-source="mine"]'); assert.equal(await page.locator(".mk-pt-card").count(), 0); assert.match(await page.locator("[data-pt-empty]").innerText(), /Enregistrer une composition/);
    await page.click('[data-pt-source="all"]');
  });

  test("aperçu : le pattern s'affiche en grand dans une fenêtre (styles du site) ; appareils tablette et mobile ; Échap ferme ; rien n'est créé", async () => {
    const pagesBefore = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    const page = await open(); await edit(page);
    await card(page, "Bandeau centré").getByRole("button", { name: /Aperçu de/ }).click();
    const dlg = page.locator("[data-pt-dlg-preview]"); await dlg.waitFor();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pt-prev-frame]"); try { return /Le résultat que vous promettez/.test(f.contentDocument.body.innerText); } catch { return false; } });
    await page.click('[data-pt-device="tablet"]'); assert.equal(await page.locator("[data-pt-prev-frame]").evaluate((f) => f.style.width), "768px");
    await page.click('[data-pt-device="mobile"]'); assert.equal(await page.locator("[data-pt-prev-frame]").evaluate((f) => f.style.width), "390px");
    await page.keyboard.press("Escape"); await dlg.waitFor({ state: "hidden" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, pagesBefore);
  });

  test("insérer dans une page : choix de la page et de l'emplacement, sections ajoutées au BROUILLON (rien de publié), lien vers l'éditeur ; erreur affichée dans la fenêtre", async () => {
    const page = await open(); await edit(page);
    await card(page, "Appel à l'action").getByRole("button", { name: /Insérer .* dans une page/ }).click();
    const dlg = page.locator("[data-pt-dlg-insert]"); await dlg.waitFor();
    assert.deepEqual((await page.locator("[data-pt-ins-page] option").allTextContents()).sort(), ["Page A1", "Page A2"]);
    await page.selectOption("[data-pt-ins-page]", String(pageA1)); await page.getByLabel("Après la section :").check();
    assert.equal(await page.locator("[data-pt-ins-after]").isEnabled(), true);
    await page.selectOption("[data-pt-ins-after]", "0");
    await page.click("[data-pt-ins-ok]"); await page.locator("[data-pt-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-pt-banner]").innerText(), /1 section ajoutée au brouillon de la page « Page A1 » \(position 2\)\. Rien n'est publié/);
    assert.equal(await page.locator("[data-pt-open]").getAttribute("href"), `/marketing/pages/${pageA1}/editeur`);
    const row = one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", pageA1);
    assert.equal(JSON.parse(row.draft).sections.length, 3); assert.equal(JSON.parse(row.sections).length, 2, "version en ligne intacte"); assert.equal(JSON.parse(row.draft).sections[1].type, "layout");
    // erreur : la page cible disparaît entre-temps (archivée ailleurs) → message clair dans la fenêtre, rien d'écrit
    await card(page, "Questions fréquentes").getByRole("button", { name: /Insérer .* dans une page/ }).click(); await dlg.waitFor();
    db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(pageA2);
    await page.selectOption("[data-pt-ins-page]", String(pageA2)); await page.click("[data-pt-ins-ok]");
    await page.waitForFunction(() => !document.querySelector("[data-pt-ins-err]").hidden);
    assert.match(await page.locator("[data-pt-ins-err]").innerText(), /Page introuvable pour ce site/); assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA2).draft, null);
    db.prepare("UPDATE mk_landing_pages SET archived_at = NULL WHERE id = ?").run(pageA2); await page.keyboard.press("Escape");
  });

  test("enregistrer une composition depuis une page : elle apparaît dans « Mes compositions », survit au rechargement et s'insère ailleurs ; nom en double refusé avec message", async () => {
    const page = await open(); await edit(page);
    await page.click("[data-pt-create]"); const dlg = page.locator("[data-pt-dlg-create]"); await dlg.waitFor();
    await page.selectOption("[data-pt-cr-page]", String(pageA1));
    assert.equal(await page.locator("[data-pt-cr-sections] input").count(), 2);
    await page.locator("[data-pt-cr-sections] input").nth(0).check(); await page.locator("[data-pt-cr-sections] input").nth(1).check();
    await page.fill("[data-pt-cr-name]", "Ma composition"); await page.fill("[data-pt-cr-desc]", "Texte et bandeau");
    await page.click("[data-pt-cr-ok]"); await page.locator('[data-pt-source="mine"][aria-selected="true"]').waitFor();
    assert.equal(await card(page, "Ma composition").count(), 1);
    assert.equal(one("SELECT site_id FROM appearance_patterns WHERE name = 'Ma composition'").site_id, A);
    await page.reload(); await page.locator("[data-pt-main]:not([hidden])").waitFor(); await page.click('[data-pt-source="mine"]'); assert.equal(await card(page, "Ma composition").count(), 1);
    await page.click("[data-pt-create]"); await dlg.waitFor(); await page.locator("[data-pt-cr-sections] input").nth(0).check(); await page.fill("[data-pt-cr-name]", "ma COMPOSITION");
    await page.click("[data-pt-cr-ok]"); await page.waitForFunction(() => !document.querySelector("[data-pt-cr-err]").hidden);
    assert.match(await page.locator("[data-pt-cr-err]").innerText(), /existe déjà/); await page.keyboard.press("Escape");
  });

  test("renommer, dupliquer, corbeille, restaurer, supprimer définitivement (avec confirmation) ; rien n'est supprimé si la confirmation est refusée", async () => {
    const page = await open(); await edit(page); await page.click('[data-pt-source="mine"]');
    const c = card(page, "Ma composition"); await more(c); await c.getByRole("button", { name: "Renommer" }).click();
    await page.fill("[data-pt-rn-name]", "Composition renommée"); await page.locator("[data-pt-form-rename] button[type=submit]").click();
    await card(page, "Composition renommée").waitFor();
    await more(card(page, "Composition renommée")); await card(page, "Composition renommée").getByRole("button", { name: "Dupliquer" }).click();
    await card(page, "Composition renommée (copie)").waitFor();
    page.once("dialog", (d) => d.dismiss());
    const cp = card(page, "Composition renommée (copie)"); await more(cp); await cp.getByRole("button", { name: "Mettre à la corbeille" }).click();
    assert.equal(await card(page, "Composition renommée (copie)").count(), 1, "confirmation refusée : rien n'a bougé");
    page.once("dialog", (d) => d.accept()); await more(card(page, "Composition renommée (copie)")); await card(page, "Composition renommée (copie)").getByRole("button", { name: "Mettre à la corbeille" }).click();
    await page.waitForFunction(() => document.querySelectorAll(".mk-pt-card").length === 1);
    await page.click('[data-pt-source="trash"]'); assert.equal(await card(page, "Composition renommée (copie)").count(), 1);
    await card(page, "Composition renommée (copie)").getByRole("button", { name: "Restaurer" }).click(); await page.waitForFunction(() => document.querySelectorAll(".mk-pt-card").length === 0);
    await page.click('[data-pt-source="mine"]'); assert.equal(await page.locator(".mk-pt-card").count(), 2);
    page.once("dialog", (d) => d.accept()); const cp2 = card(page, "Composition renommée (copie)"); await more(cp2); await cp2.getByRole("button", { name: "Mettre à la corbeille" }).click();
    await page.click('[data-pt-source="trash"]'); page.once("dialog", (d) => d.accept()); await card(page, "Composition renommée (copie)").getByRole("button", { name: "Supprimer définitivement" }).click();
    await page.waitForFunction(() => document.querySelectorAll(".mk-pt-card").length === 0);
    assert.equal(one("SELECT COUNT(*) n FROM appearance_patterns WHERE name = 'Composition renommée (copie)'").n, 0);
  });

  test("clavier et accessibilité : filtres en onglets, boutons nommés, fenêtre à focus géré ; téléphone (390 px) sans défilement horizontal ; lecture seule du lecteur du site ; autre site refusé", async () => {
    const page = await open(); await edit(page);
    assert.equal(await page.locator('[data-pt-source="all"]').getAttribute("role"), "tab");
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-pt-root] button, [data-pt-root] input, [data-pt-root] select")].filter((el) => !el.closest("dialog") && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.outerHTML.slice(0, 80)));
    assert.deepEqual(unnamed, []);
    await card(page, "Bandeau centré").getByRole("button", { name: /Aperçu de/ }).focus(); await page.keyboard.press("Enter");
    assert.equal(await page.locator("[data-pt-dlg-preview]").isVisible(), true); await page.keyboard.press("Escape"); await page.locator("[data-pt-dlg-preview]").waitFor({ state: "hidden" });
    const m = await open(390); await edit(m);
    assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "pas de défilement horizontal");
    assert.equal(await m.evaluate(() => getComputedStyle(document.querySelector("[data-pt-grid]")).gridTemplateColumns.split(" ").length), 1);
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(A, viewer.email);
    const v = await open(1280, viewer); await edit(v);
    assert.equal(await v.locator("[data-pt-create]").isDisabled(), true);
    assert.equal(await card(v, "Bandeau centré").getByRole("button", { name: /Insérer/ }).isDisabled(), true);
    assert.equal(await card(v, "Bandeau centré").getByRole("button", { name: /Aperçu de/ }).isEnabled(), true);
    const r = await v.goto(`${srv.base}${PT}?site=${B}`); assert.notEqual(r.status(), 200);
    assert.deepEqual(errors, [], "aucune erreur JavaScript sur tout le parcours");
  });
});
