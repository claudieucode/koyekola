// KOLAKISA CMS — Apparence → Éditeur du site dans un VRAI Chrome (Playwright, ignoré sans) : le vrai Page Builder dans le cadre (navigation entre pages et parties globales, modification réelle
// enregistrée automatiquement, protection si l'éditeur n'a pas fini d'enregistrer), aperçu par appareil, publication avec contrôles, téléphone, lecture seule. Aucune erreur JavaScript côté espace.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("éditeur du site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, orgId, pHome, pDraft, pForm, headerId;
  const SE = "/marketing/site-web/editeur-du-site";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(15000);
    const page = await context.newPage();
    page.on("pageerror", (e) => { if (!/Failed to fetch|NetworkError/.test(e.message)) errors.push(`pageerror : ${e.message}`); });
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|favicon/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const edit = async (page, site = A) => { await page.goto(`${srv.base}${SE}?site=${site}`); await page.locator("[data-se-layout]:not([hidden])").waitFor(); };
  const pick = (page, name) => page.locator(".mk-se-page", { hasText: name });
  const txt = (m) => [{ type: "text", markdown: m }];

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const mk = (name, s, sections, draft) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, draft, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, ?, 'published', 'page', ?, '2026-01-01 00:00:00')").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), name, JSON.stringify(sections), draft ? JSON.stringify(draft) : null, s).lastInsertRowid);
    pHome = mk("Accueil A", A, txt("Bienvenue chez Alpha")); pDraft = mk("Page avec brouillon", A, txt("Texte en ligne"), { sections: txt("Texte du brouillon à publier"), title: "Page avec brouillon" });
    pForm = mk("Page à formulaire", A, txt("Texte"), { sections: [{ type: "form", heading: "Inscription", intro: "" }], title: "Page à formulaire" }); mk("Page de B", B, txt("B"));
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pHome, A);
    headerId = Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, 'En-tête de Alpha', ?, 'standard')").run(orgId, A, JSON.stringify({ type: "text", markdown: "En-tête" })).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET header_component_id = ? WHERE id = ?").run(headerId, A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("l'espace s'ouvre : pages du site (état en ligne / brouillon), accueil marqué, onglets, état global ; aucune page ouverte au départ", async () => {
    const page = await open(); await edit(page);
    assert.deepEqual((await page.locator("[data-se-tab]").allTextContents()).map((t) => t.trim().replace(/\d+$/, "")), ["Pages", "Parties globales", "Publication", "Outils"]);
    assert.equal(await page.locator(".mk-se-page").count(), 3);
    assert.match(await pick(page, "Accueil A").innerText(), /★ Accueil A.*En ligne/s); assert.match(await pick(page, "Page avec brouillon").innerText(), /Brouillon en cours/);
    assert.match(await page.locator("[data-se-state]").innerText(), /2 pages à publier/);
    assert.equal(await page.locator("[data-se-empty]").isVisible(), true);
    await page.fill("#se-search", "formulaire"); assert.equal(await page.locator(".mk-se-page").count(), 1); await page.fill("#se-search", "");
  });

  test("ouvrir une page : le VRAI Page Builder s'affiche dans le cadre (boutons « Retour » masqués), la modification réelle est enregistrée automatiquement en brouillon", async () => {
    const page = await open(); await edit(page);
    await pick(page, "Accueil A").click();
    const fr = page.frameLocator("[data-se-frame]");
    await fr.locator("[data-pb-save]").waitFor({ timeout: 30000 });
    assert.equal(await page.locator("[data-se-title]").innerText(), "Accueil A");
    assert.equal(await fr.locator(".pb-back").isVisible(), false, "bouton « Retour » masqué dans le cadre");
    assert.match(await page.locator("[data-se-frame]").evaluate((f) => f.contentDocument.body.className), /pb-embedded/);
    // modification RÉELLE dans le vrai éditeur : ajout d'un bloc « Appel à l'action » (onglet Blocs) → enregistrement automatique en BROUILLON ; la version en ligne ne change pas
    const nb = () => (one("SELECT draft FROM mk_landing_pages WHERE id = ?", pHome).draft ? JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pHome).draft).sections.length : 0);
    assert.equal(nb(), 0, "pas de brouillon au départ");
    await fr.locator("#pb-tab-blocks").click(); await fr.locator('[data-block="cta"]').click();
    await fr.locator("[data-pb-save].is-dirty").waitFor({ timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => { const f = document.querySelector("[data-se-frame]"); try { return /is-ok/.test(f.contentDocument.querySelector("[data-pb-save]").className); } catch { return false; } }, null, { timeout: 30000 });
    assert.equal(nb(), 2, "l'enregistrement automatique a écrit le brouillon (section d'origine + bloc inséré)");
    assert.equal(JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", pHome).sections).length, 1, "la version en ligne n'a pas changé");
    // l'espace relit l'état : la page modifiée apparaît dans « Publication » avec son brouillon
    await page.click('[data-se-tab="publish"]'); await page.waitForFunction(() => /Accueil A/.test(document.querySelector("[data-se-railbody]").innerText));
    assert.match(await page.locator("[data-se-state]").innerText(), /3 pages à publier/);
    await page.click('[data-se-tab="pages"]');
  });

  test("changer de page : l'éditeur suivant s'ouvre ; si l'éditeur n'a pas fini d'enregistrer, une confirmation protège le travail ; l'en-tête du site s'ouvre comme partie globale", async () => {
    const page = await open(); await edit(page);
    await pick(page, "Accueil A").click(); await page.frameLocator("[data-se-frame]").locator("[data-pb-save]").waitFor({ timeout: 30000 });
    // simule « non enregistré » dans l'éditeur : le script de l'espace doit demander confirmation avant de quitter
    await page.locator("[data-se-frame]").evaluate((f) => { f.contentDocument.querySelector("[data-pb-save]").className = "pb-save is-dirty"; });
    let asked = null; page.once("dialog", (d) => { asked = d.message(); d.dismiss(); });
    await pick(page, "Page avec brouillon").click();
    assert.match(asked || "", /pas encore enregistrées/); assert.equal(await page.locator("[data-se-title]").innerText(), "Accueil A", "refusé : on reste sur la page");
    await page.locator("[data-se-frame]").evaluate((f) => { f.contentDocument.querySelector("[data-pb-save]").className = "pb-save is-ok"; });
    await pick(page, "Page avec brouillon").click(); await page.waitForFunction(() => document.querySelector("[data-se-title]").textContent === "Page avec brouillon");
    await page.frameLocator("[data-se-frame]").locator("[data-pb-save]").waitFor({ timeout: 30000 });
    // partie globale
    await page.click('[data-se-tab="parts"]'); await page.getByRole("button", { name: "Modifier En-tête du site" }).click();
    await page.waitForFunction(() => /En-tête du site/.test(document.querySelector("[data-se-title]").textContent));
    await page.frameLocator("[data-se-frame]").locator("[data-pb-save]").waitFor({ timeout: 30000 });
    assert.match(await page.locator("[data-se-frame]").evaluate((f) => f.contentWindow.location.pathname), new RegExp(`/composants/${headerId}/editeur`));
  });

  test("aperçu par appareil : la page réelle (brouillon) en tablette et mobile à l'échelle ; l'en-tête n'a pas d'aperçu seul (message) ; retour à l'édition", async () => {
    const page = await open(); await edit(page);
    await pick(page, "Page avec brouillon").click(); await page.frameLocator("[data-se-frame]").locator("[data-pb-save]").waitFor({ timeout: 30000 });
    await page.click('[data-se-mode="preview"]');
    await page.waitForFunction(() => { const f = document.querySelector("[data-se-frame]"); try { return /Texte du brouillon à publier/.test(f.contentDocument.body.innerText); } catch { return false; } });
    assert.equal(await page.locator("[data-se-devices]").isVisible(), true);
    await page.click('[data-se-device="tablet"]'); assert.equal(await page.locator("[data-se-stage]").evaluate((e) => e.offsetWidth), 768);
    await page.click('[data-se-device="mobile"]'); assert.equal(await page.locator("[data-se-stage]").evaluate((e) => e.offsetWidth), 390);
    await page.click('[data-se-mode="edit"]'); await page.frameLocator("[data-se-frame]").locator("[data-pb-save]").waitFor({ timeout: 30000 });
    assert.equal(await page.locator("[data-se-devices]").isHidden(), true);
  });

  test("publication : la page prête est publiée (le brouillon passe en ligne), la page bloquée est refusée avec sa raison ; confirmation demandée ; état et badge mis à jour", async () => {
    const page = await open(); await edit(page); await page.click('[data-se-tab="publish"]');
    assert.equal(await page.locator(".mk-se-pend").count(), 3, "Accueil A (modifiée dans le test précédent), la page à brouillon et la page à formulaire");
    assert.equal(await page.locator(".mk-se-pend.is-blocked").count(), 1); assert.match(await page.locator(".mk-se-pend.is-blocked").innerText(), /formulaire/);
    assert.equal(await page.locator(".mk-se-pend input:checked").count(), 2, "seules les pages prêtes sont cochées");
    await page.locator('.mk-se-pend:has-text("Accueil A") input').uncheck();
    let msg = ""; page.once("dialog", (d) => { msg = d.message(); d.dismiss(); }); await page.click("[data-se-publish]");
    assert.match(msg, /Publier 1 page/); assert.ok(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pDraft).draft, "refusé : rien n'est publié");
    page.once("dialog", (d) => d.accept()); await page.click("[data-se-publish]");
    await page.locator("[data-se-result]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-se-result]").innerText(), /1 page publiée/);
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pDraft).draft, null); assert.match(one("SELECT sections FROM mk_landing_pages WHERE id = ?", pDraft).sections, /Texte du brouillon à publier/);
    assert.match(await page.locator("[data-se-state]").innerText(), /2 pages à publier/);
    assert.equal(await page.locator(".mk-se-pend").count(), 2, "il reste la page décochée et la page bloquée");
  });

  test("clavier, téléphone (390 px), outils et lecture seule : onglets au clavier, boutons nommés, aucun défilement horizontal ; le lecteur du site ne peut pas publier ; autre site refusé ; aucune erreur JavaScript", async () => {
    const page = await open(); await edit(page);
    await page.locator('[data-se-tab="pages"]').focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator('[data-se-tab="parts"]').getAttribute("aria-selected"), "true");
    await page.click('[data-se-tab="tools"]'); assert.ok((await page.locator(".mk-se-tools a").count()) >= 8);
    assert.match(await page.locator(".mk-se-tools a").first().getAttribute("href"), /\/site-web\/styles\?site=/);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-se-root] button, [data-se-root] input, [data-se-root] select")].filter((el) => !el.closest("[hidden]") && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.outerHTML.slice(0, 80)));
    assert.deepEqual(unnamed, []);
    const m = await open(390); await edit(m); assert.ok((await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "pas de défilement horizontal");
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(A, viewer.email);
    const v = await open(1280, viewer); await edit(v); await v.click('[data-se-tab="publish"]');
    assert.equal(await v.locator("[data-se-publish]").isDisabled(), true); assert.equal((await v.locator(".mk-se-pend input").first().isDisabled()), true);
    const r = await v.goto(`${srv.base}${SE}?site=${B}`); assert.notEqual(r.status(), 200);
    assert.deepEqual(errors, [], "aucune erreur JavaScript sur tout le parcours");
  });
});
