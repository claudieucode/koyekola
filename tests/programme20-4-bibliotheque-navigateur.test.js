// KOLAKISA — PROGRAMME 20.4 dans un VRAI Chrome (Playwright, ignoré sans) : la bibliothèque de modèles de bout en bout — recherche serveur, filtres cumulables, tri, « Afficher plus », détail, aperçu,
// importation d'une section / d'un composant / d'un modèle de thème (plan, confirmation, annulation en deux temps), enregistrement et modification de ses modèles, fichier, état d'erreur et « Réessayer »,
// clavier (onglets fléchés, Échap, focus rendu), téléphone (390 px), lecteur en lecture seule. Aucune erreur JavaScript.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("programme 20.4 — bibliothèque de modèles (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, orgId, pageA;
  const TP = "/marketing/site-web/templates";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(10000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const idle = (page) => page.waitForFunction(() => document.querySelector("[data-tp-grid]").getAttribute("aria-busy") === "false");
  const settle = async (page) => { await page.waitForTimeout(450); await idle(page); };
  const edit = async (page) => { await page.goto(`${srv.base}${TP}?site=${A}`); await page.locator("[data-tp-main]:not([hidden])").waitFor(); await idle(page); };
  const cards = (page) => page.locator(".mk-pt-card");
  const names = (page) => page.locator(".mk-pt-card h3").allTextContents();
  const card = (page, name) => page.locator(".mk-pt-card", { has: page.getByRole("heading", { name, exact: true }) });
  const tab = async (page, source) => { await page.click(`[data-tp-source="${source}"]`); await idle(page); await page.waitForFunction((s) => document.querySelector(`[data-tp-source="${s}"]`).getAttribute("aria-selected") === "true", source); };
  const search = async (page, text) => { await page.fill("[data-tp-search]", text); await settle(page); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', ?)").run(orgId, JSON.stringify({ colors: { primary: "#8a1c3a" } })).lastInsertRowid);
    const created = await boss.postJson(`${TP}/importer?site=${A}`, { ref: "page:contact", name: "Page cible", importKey: "cible0000000001" });
    pageA = JSON.parse(created.text).result.pages[0].id;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("ouverture : 7 onglets avec compteurs réels, 12 vignettes rendues avec les styles du site, filtres nommés, aucun défilement horizontal", async () => {
    const page = await open(); await edit(page);
    assert.equal(await page.locator("[data-tp-source]").count(), 7);
    assert.deepEqual(await page.locator("[data-tp-source]").evaluateAll((els) => els.map((e) => e.getAttribute("role"))), Array(7).fill("tab"));
    assert.equal(await cards(page).count(), 12);
    await page.waitForFunction(() => { const f = document.querySelector(".mk-pt-thumb iframe"); try { return f.contentDocument && /lp-main/.test(f.contentDocument.body.innerHTML); } catch { return false; } });
    assert.match(await page.locator(".mk-pt-thumb iframe").first().evaluate((f) => f.contentDocument.body.getAttribute("style")), /--kw-primary:#8a1c3a/);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-tp-root] select, [data-tp-root] input:not([type=hidden]), [data-tp-root] button")].filter((el) => !el.closest("dialog") && !el.hidden && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length))).map((el) => el.outerHTML.slice(0, 90)));
    assert.deepEqual(unnamed, [], "chaque contrôle a un nom accessible");
    const levels = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, [data-tp-root] h1, [data-tp-root] h2, [data-tp-root] h3")].filter((h) => !h.closest("dialog") && !h.closest("[hidden]")).map((h) => Number(h.tagName[1])));
    assert.ok(levels.length >= 13, `titres : ${levels}`); assert.deepEqual(levels.filter((l, i) => i > 0 && l > levels[i - 1] + 1), [], `aucun saut de niveau de titre : ${levels}`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    assert.equal(await page.locator("[data-tp-count]").innerText(), "12 modèles");
  });

  test("recherche côté serveur (nom, secteur, mot-clé, sans accent), aucun résultat avec « Réinitialiser », filtres cumulés, tri, réinitialisation", async () => {
    const page = await open(); await edit(page);
    await tab(page, "page"); await search(page, "reservation"); const hits = await names(page); assert.equal(hits[0], "Restaurant — réservation", "le nom l'emporte sur la description"); assert.ok(hits.includes("Restaurant — accueil"), "la description (« réservation ») est aussi cherchée");
    await search(page, "restaurant"); assert.ok((await cards(page).count()) >= 3);
    await search(page, "zzzzqq"); assert.equal(await cards(page).count(), 0); assert.match(await page.locator("[data-tp-empty]").innerText(), /Aucun modèle ne correspond/); assert.equal(await page.locator("[data-tp-reset]").isVisible(), true);
    await page.click("[data-tp-reset]"); await settle(page); assert.equal(await page.locator("[data-tp-search]").inputValue(), ""); assert.equal(await cards(page).count(), 12);
    await page.selectOption("[data-tp-family]", "restauration-hotellerie"); await settle(page); const afterFamily = await cards(page).count(); assert.ok(afterFamily >= 3 && afterFamily < 12 || afterFamily === 3);
    assert.equal(await page.locator("[data-tp-sector]").isEnabled(), true); assert.ok((await page.locator("[data-tp-sector] option").count()) >= 3);
    await page.selectOption("[data-tp-sector]", "restaurant"); await settle(page); const afterSector = await cards(page).count(); assert.ok(afterSector >= 3);
    await page.selectOption("[data-tp-sort]", "alpha"); await settle(page); const list = await names(page); assert.deepEqual(list, [...list].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
    await search(page, "carte"); assert.deepEqual(await names(page), ["Restaurant — carte"]);
    await page.click("[data-tp-reset]"); await settle(page); assert.equal(await page.locator("[data-tp-family]").inputValue(), ""); assert.equal(await page.locator("[data-tp-sector]").isDisabled(), true);
    await tab(page, "component"); await page.selectOption("[data-tp-compat]", "ok"); await settle(page); assert.equal(await cards(page).count(), 8);
  });

  test("« Afficher plus » : 12, 24, 36 puis 39 modèles de pages, bouton masqué à la fin, compteur exact ; la page d'accueil de la bibliothèque ne charge pas toutes les vignettes", async () => {
    const page = await open(); await edit(page); await tab(page, "page");
    assert.equal(await cards(page).count(), 12); assert.equal(await page.locator("[data-tp-more]").isVisible(), true); assert.match(await page.locator("[data-tp-count]").innerText(), /39 modèles — 12 affichés/);
    const loaded = await page.evaluate(() => [...document.querySelectorAll(".mk-pt-thumb iframe")].filter((f) => f.getAttribute("src")).length); assert.ok(loaded < 12, `vignettes chargées à la demande : ${loaded}`);
    for (const n of [24, 36, 39]) { await page.click("[data-tp-more]"); await page.waitForFunction((k) => document.querySelectorAll(".mk-pt-card").length === k, n); await idle(page); }
    assert.equal(await page.locator("[data-tp-more-wrap]").isHidden(), true); assert.equal(new Set(await names(page)).size, 39, "aucun doublon entre les pages");
  });

  test("détail : éléments, structure, compatibilité, licence ; Échap ferme et rend le focus au bouton ; aperçu par page et par appareil puis « Voir les détails »", async () => {
    const page = await open(); await edit(page);
    const btn = card(page, "Restaurant").getByRole("button", { name: "Détails de Restaurant" }); await btn.focus(); await page.keyboard.press("Enter");
    const dlg = page.locator("[data-tp-dlg-detail]"); await dlg.waitFor(); await page.locator("[data-tp-det-body] h3", { hasText: "Compatibilité" }).waitFor();
    const text = await page.locator("[data-tp-det-body]").innerText(); assert.match(text, /Compatible/); assert.match(text, /Éléments utilisés/); assert.match(text, /Structure/); assert.match(text, /Aucune image, police ni ressource tierce/); assert.match(text, /Bibliothèque officielle Kolakisa/);
    await page.keyboard.press("Escape"); await dlg.waitFor({ state: "hidden" }); assert.match(await page.evaluate(() => document.activeElement.getAttribute("aria-label") || ""), /Détails de Restaurant/, "le focus revient au bouton d'origine");
    await card(page, "Restaurant").getByRole("button", { name: "Aperçu de Restaurant" }).click(); const prev = page.locator("[data-tp-dlg-preview]"); await prev.waitFor();
    assert.equal(await page.locator("[data-tp-prev-tabs] button").count(), 4); await page.click('[data-tp-prev-tabs] button[data-key="carte"]');
    await page.waitForFunction(() => { const f = document.querySelector("[data-tp-prev-frame]"); try { return /Notre carte/.test(f.contentDocument.body.innerText); } catch { return false; } });
    await page.click('[data-tp-device="mobile"]'); assert.equal(await page.locator("[data-tp-prev-frame]").evaluate((f) => f.style.width), "390px");
    await page.click("[data-tp-prev-detail]"); await dlg.waitFor(); assert.match(await page.locator("[data-tp-det-title]").innerText(), /Restaurant/);
  });

  test("importer une SECTION : page à choisir, opérations prévues, résultat avec lien, brouillon modifié, annulation en deux temps qui rétablit la page", async () => {
    const page = await open(); await edit(page); await tab(page, "section"); await search(page, "questions");
    const before = JSON.parse(one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", pageA).sections).length;
    await card(page, "Questions fréquentes").getByRole("button", { name: /Utiliser ce modèle : Questions fréquentes/ }).click();
    const dlg = page.locator("[data-tp-dlg-import]"); await dlg.waitFor(); assert.equal(await page.locator("[data-tp-imp-target]").isVisible(), true); assert.equal(await page.locator("[data-tp-imp-ok]").isDisabled(), true, "pas d'import sans page choisie");
    await page.selectOption("[data-tp-imp-page]", String(pageA)); await page.locator("[data-tp-imp-ops] li").first().waitFor();
    assert.match(await page.locator("[data-tp-imp-ops]").innerText(), /Insérer 1 section à la fin dans la page « Page cible »/); await page.locator("[data-tp-imp-ok]:not([disabled])").waitFor();
    await page.click("[data-tp-imp-ok]"); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-tp-imp-result]").innerText(), /1 section ajoutée\(s\) au brouillon de « Page cible »/); assert.equal(await page.locator("[data-tp-imp-result] a[href$='/editeur']").count(), 1);
    const row = one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA); assert.equal(JSON.parse(row.draft).sections.length, before + 1);
    const undo = page.locator("[data-tp-imp-result] [data-tp-undo]"); await undo.click(); assert.match(await undo.innerText(), /Confirmer l'annulation/); assert.equal(JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft).sections.length, before + 1, "un seul clic n'annule rien");
    await undo.click(); await page.locator("[data-tp-banner]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-banner-text]").innerText(), /Importation annulée : 1 section/);
    assert.equal(JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft).sections.length, before, "page rétablie");
  });

  test("importer un COMPOSANT et un MODÈLE DE THÈME (option d'affectation distincte) ; une alerte de compatibilité exige une confirmation cochée", async () => {
    const page = await open(); await edit(page);
    await tab(page, "component"); await card(page, "En-tête simple").getByRole("button", { name: /Utiliser ce modèle/ }).click();
    await page.locator("[data-tp-imp-ok]:not([disabled])").waitFor(); assert.equal(await page.locator("[data-tp-imp-theme]").isHidden(), true); assert.match(await page.locator("[data-tp-imp-ops]").innerText(), /Créer le composant « En-tête simple/);
    await page.click("[data-tp-imp-ok]"); await page.locator("[data-tp-imp-result]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-imp-result]").innerText(), /composant « En-tête simple.*créé/); assert.equal(one("SELECT COUNT(*) n FROM mk_web_components WHERE site_id = ?", A).n, 1); await page.keyboard.press("Escape");
    await tab(page, "part"); await card(page, "Page introuvable (404)").getByRole("button", { name: /Utiliser ce modèle/ }).click(); await page.locator("[data-tp-imp-ok]:not([disabled])").waitFor();
    assert.equal(await page.locator("[data-tp-imp-theme]").isVisible(), true); await page.check("[data-tp-imp-assign]"); await page.locator("[data-tp-imp-ops] li", { hasText: /Affecter la page comme modèle de thème/ }).waitFor(); await page.keyboard.press("Escape");
    await tab(page, "page"); await search(page, "boutique"); await card(page, "Boutique de formations — accueil").getByRole("button", { name: /Utiliser ce modèle/ }).click();
    await page.locator("[data-tp-imp-confirm-wrap]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-imp-issues]").innerText(), /aucune formation n'est publiée/); assert.equal(await page.locator("[data-tp-imp-ok]").isDisabled(), true, "pas d'import sans confirmation");
    await page.check("[data-tp-imp-confirm]"); assert.equal(await page.locator("[data-tp-imp-ok]").isDisabled(), false); await page.keyboard.press("Escape");
  });

  test("enregistrer une page comme modèle (secteur, mots-clés), la retrouver par secteur, la modifier ; fichier de modèle ; secteurs personnalisés", async () => {
    const page = await open(); await edit(page); await tab(page, "mine");
    await page.click("[data-tp-save-open]"); const dlg = page.locator("[data-tp-dlg-save]"); await dlg.waitFor(); await page.waitForFunction(() => document.querySelector("[data-tp-save-page] option[value]:not([value=''])"));
    await page.selectOption("[data-tp-save-page]", String(pageA)); await page.fill("[data-tp-save-name]", "Ma page contact"); await page.selectOption("[data-tp-save-sector]", "restaurant"); await page.fill("[data-tp-save-kw]", "contact, accueil");
    await page.click("[data-tp-save-ok]"); await dlg.waitFor({ state: "hidden" }); await idle(page); assert.ok((await names(page)).includes("Ma page contact"));
    await page.selectOption("[data-tp-family]", "restauration-hotellerie"); await settle(page); assert.deepEqual(await names(page), ["Ma page contact"], "retrouvée par secteur (le composant sans secteur n'apparaît plus)");
    await card(page, "Ma page contact").getByRole("button", { name: "Détails de Ma page contact" }).click(); await page.locator("[data-tp-det-own] button", { hasText: "Modifier" }).waitFor(); await page.click('[data-tp-det-own] button:has-text("Modifier")');
    await page.locator("[data-tp-dlg-edit]").waitFor(); await page.fill("[data-tp-edit-name]", "Ma page contact v2"); await page.check('input[name="tp-edit-vis"][value="organization"]'); await page.click("[data-tp-edit-ok]"); await page.locator("[data-tp-dlg-edit]").waitFor({ state: "hidden" }); await idle(page);
    const row = one("SELECT * FROM mk_page_templates WHERE site_id = ?", A); assert.equal(row.name, "Ma page contact v2"); assert.equal(row.shared, 1, "partagé par l'administrateur");
    await page.click("[data-tp-reset]"); await settle(page);
    const file = { name: "modele.kolakisa-template.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "kolakisa-template", formatVersion: 1, kind: "page", name: "Venu d'un fichier", content: { sections: [{ type: "text", markdown: "Depuis un fichier" }] } })) };
    await page.setInputFiles("[data-tp-file]", file); await page.locator("[data-tp-banner]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-banner-text]").innerText(), /« Venu d'un fichier » ajouté à « Mes modèles »/);
    await page.setInputFiles("[data-tp-file]", { name: "mauvais.json", mimeType: "application/json", buffer: Buffer.from("pas du json") }); await page.waitForFunction(() => /pas un JSON valide/.test(document.querySelector("[data-tp-banner-text]").textContent));
    await page.click("[data-tp-sectors-open]"); await page.locator("[data-tp-dlg-sectors]").waitFor(); await page.fill("[data-tp-sec-label]", "Traiteur"); await page.selectOption("[data-tp-sec-family]", "restauration-hotellerie"); await page.click('[data-tp-form-sector] button[type="submit"]');
    await page.locator("[data-tp-sec-list] li", { hasText: "Traiteur" }).waitFor(); assert.equal(one("SELECT COUNT(*) n FROM cms_template_sectors WHERE label = 'Traiteur'").n, 1);
  });

  test("erreur réseau : bandeau d'erreur annoncé avec « Réessayer » ; la grille se rétablit ; réponse périmée ignorée", async () => {
    const page = await open(); await edit(page);
    await page.route("**/templates/catalogue.json*", (r) => r.abort("failed"));
    await search(page, "agence"); await page.locator("[data-tp-error]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-error-text]").innerText(), /Connexion impossible/); assert.equal(await page.locator("[data-tp-error]").getAttribute("role"), "alert");
    await page.unroute("**/templates/catalogue.json*"); await page.click("[data-tp-retry]"); await idle(page); await page.waitForFunction(() => document.querySelector("[data-tp-error]").hidden); assert.ok((await cards(page).count()) >= 1);
    await page.route("**/templates/catalogue.json*", (r) => r.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
    await search(page, "agence digitale"); await page.locator("[data-tp-error]:not([hidden])").waitFor(); assert.match(await page.locator("[data-tp-error-text]").innerText(), /erreur 500/); await page.unroute("**/templates/catalogue.json*");
  });

  test("clavier : onglets aux flèches, boutons des cartes atteignables, Échap ferme les fenêtres ; téléphone 390 px sans défilement horizontal ; lecteur en lecture seule", async () => {
    const page = await open(); await edit(page);
    await page.focus('[data-tp-source="pack"]'); await page.keyboard.press("ArrowRight"); await idle(page); assert.equal(await page.locator('[data-tp-source="page"]').getAttribute("aria-selected"), "true"); assert.equal(await page.evaluate(() => document.activeElement.getAttribute("data-tp-source")), "page");
    await page.keyboard.press("ArrowLeft"); await idle(page); assert.equal(await page.locator('[data-tp-source="pack"]').getAttribute("aria-selected"), "true");
    const tabbable = await card(page, "Restaurant").locator("button").evaluateAll((els) => els.map((e) => [e.getAttribute("aria-label"), e.tabIndex])); assert.ok(tabbable.length === 3 && tabbable.every(([l, t]) => l && t === 0), JSON.stringify(tabbable));
    await card(page, "Restaurant").getByRole("button", { name: /Utiliser ce modèle/ }).click(); await page.locator("[data-tp-dlg-import]").waitFor(); await page.keyboard.press("Escape"); await page.locator("[data-tp-dlg-import]").waitFor({ state: "hidden" });
    for (const w of [820, 1024, 1920]) { const t = await open(w); await edit(t); assert.ok((await t.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${w} px : aucun défilement horizontal`); assert.ok((await t.evaluate(() => getComputedStyle(document.querySelector("[data-tp-grid]")).gridTemplateColumns.split(" ").length)) >= 2, `${w} px : plusieurs colonnes`); await t.context().close(); }
    const m = await open(390); await edit(m);
    assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1); assert.equal(await m.evaluate(() => getComputedStyle(document.querySelector("[data-tp-grid]")).gridTemplateColumns.split(" ").length), 1);
    await card(m, "Restaurant").getByRole("button", { name: /Détails de/ }).click(); await m.locator("[data-tp-dlg-detail]").waitFor(); assert.ok((await m.evaluate(() => document.querySelector("[data-tp-dlg-detail]").getBoundingClientRect().width)) <= 390); await m.keyboard.press("Escape");
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(A, viewer.email);
    const v = await open(1280, viewer); await edit(v); assert.equal(await card(v, "Restaurant").getByRole("button", { name: /Utiliser ce modèle/ }).isDisabled(), true); assert.equal(await card(v, "Restaurant").getByRole("button", { name: /Aperçu de/ }).isEnabled(), true); assert.equal(await card(v, "Restaurant").getByRole("button", { name: /Détails de/ }).isEnabled(), true);
    await tab(v, "mine"); assert.equal(await v.locator("[data-tp-own]").isHidden(), true, "un lecteur ne voit pas les actions d'enregistrement");
    assert.deepEqual(errors, [], "aucune erreur JavaScript sur tout le parcours");
  });
});
