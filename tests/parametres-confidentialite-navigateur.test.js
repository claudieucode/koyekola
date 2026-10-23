// KOLAKISA CMS — Paramètres → Confidentialité dans un VRAI Chrome (Playwright, ignoré sans) : onglets sans rechargement ni perte de saisie, création réelle d'une page (la base est relue),
// confirmation avant un doublon, association enregistrée et persistante, erreur serveur (valeur conservée), accordéons (souris + clavier), téléphone (390 px). Aucune erreur JavaScript.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("paramètres → confidentialité (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, errors, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const settings = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const open = async (width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 600 });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const go = async (page, query = "") => { await page.goto(`${srv.base}${R}/parametres/confidentialite?site=${A}${query}`); await page.locator("[data-pv-root]").waitFor(); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, site_id, kind, name, slug, status, sections) VALUES (?, ?, 'page', 'Mentions légales', 'mentions', 'published', '[]')").run(orgId, A);
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });

  test("onglets sans rechargement : la saisie du sélecteur survit au changement d'onglet ; la protection de sortie prévient", async () => {
    const page = await open(); await go(page);
    assert.equal(await page.locator('[data-pv-tab="reglages"]').getAttribute("aria-selected"), "true");
    await page.evaluate(() => { window.__marker = "same-document"; });
    await page.selectOption("[data-pv-select]", { label: "Mentions légales" });
    assert.equal(await page.locator("[data-pv-use]").isDisabled(), false, "modification détectée");
    await page.click('[data-pv-tab="guide"]');
    assert.equal(await page.locator('[data-pv-panel="guide"]').isVisible(), true); assert.equal(await page.locator('[data-pv-panel="reglages"]').isVisible(), false);
    assert.equal(await page.evaluate(() => window.__marker), "same-document", "aucun rechargement");
    assert.match(page.url(), /onglet=guide/);
    await page.click('[data-pv-tab="reglages"]');
    assert.equal(await page.locator("[data-pv-select] option:checked").innerText(), "Mentions légales", "saisie conservée");
    const prevented = await page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    assert.equal(prevented, true, "sortie protégée tant que la sélection n'est pas enregistrée");
    await page.context().close();
  });

  test("créer une page : bouton → VRAIE page en base, associée, état mis à jour ; second clic → demande de confirmation, aucun doublon silencieux ; ouvrir l'éditeur", async () => {
    const page = await open(); await go(page);
    assert.match(await page.locator("[data-pv-state-label]").innerText(), /Aucune page sélectionnée|non associée/);
    await page.click("[data-pv-create]");
    await page.waitForFunction(() => /Page créée/.test(document.querySelector("[data-pv-flash]").textContent));
    const row = one("SELECT * FROM mk_landing_pages WHERE site_id = ? AND name = 'Politique de confidentialité'", A);
    assert.ok(row, "page créée en base"); assert.equal(row.status, "draft"); assert.equal(settings(A).general.privacyPageId, row.id);
    assert.match(await page.locator("[data-pv-state-label]").innerText(), /pas encore publiée/);
    assert.equal(await page.locator("[data-pv-select] option:checked").innerText(), "Politique de confidentialité (brouillon)");
    const n = one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ?", A).n;
    await page.click("[data-pv-create]");
    await page.locator("[data-pv-exists]").waitFor({ state: "visible" });
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ?", A).n, n, "aucune page créée sans confirmation");
    await page.click("[data-pv-exists-cancel]");
    await page.goto(`${srv.base}${R}/parametres/confidentialite?site=${A}`);
    await page.click('[data-pv-state-links] a:has-text("Modifier")'); await page.waitForURL(/\/editeur/);
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });

  test("associer une page publiée : enregistrement réel, état « publiée », persistance au rechargement ; erreur serveur = valeur conservée, rien d'écrit", async () => {
    const page = await open(); await go(page);
    await page.selectOption("[data-pv-select]", { label: "Mentions légales" });
    await page.click("[data-pv-use]");
    await page.waitForFunction(() => /enregistrée/.test(document.querySelector("[data-pv-flash]").textContent));
    const id = one("SELECT id FROM mk_landing_pages WHERE site_id = ? AND name = 'Mentions légales'", A).id;
    assert.equal(settings(A).general.privacyPageId, id); assert.match(await page.locator("[data-pv-state-label]").innerText(), /publiée et associée/);
    await page.reload(); await page.locator("[data-pv-root]").waitFor();
    assert.equal(await page.locator("[data-pv-select] option:checked").innerText(), "Mentions légales", "sélection persistante");
    // refus du serveur (page supprimée entre-temps) : message exploitable, sélection conservée
    const ghost = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, site_id, kind, name, slug, status, sections) VALUES (?, ?, 'page', 'Fantôme', 'fantome', 'published', '[]')").run(orgId, A).lastInsertRowid);
    await page.reload(); await page.locator("[data-pv-root]").waitFor();
    await page.selectOption("[data-pv-select]", { label: "Fantôme" });
    db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(ghost);
    await page.click("[data-pv-use]");
    await page.waitForFunction(() => /introuvable/i.test(document.querySelector("[data-pv-flash]").textContent));
    assert.match(await page.locator("[data-pv-flash]").getAttribute("class"), /is-error/); assert.equal(settings(A).general.privacyPageId, id, "rien n'a été écrit");
    assert.equal(await page.locator("[data-pv-select] option:checked").innerText(), "Fantôme", "la valeur saisie n'est pas réinitialisée");
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });

  test("guide : accordéons à la souris et au clavier (aria-expanded, contenu masqué quand fermé), onglets aux flèches, lien vers le réglage", async () => {
    const page = await open(); await go(page, "&onglet=guide");
    assert.equal(await page.locator('[data-pv-panel="guide"]').isVisible(), true);
    const btn = page.locator("#pv-acc-general-btn"), body = page.locator("#pv-acc-general");
    assert.equal(await btn.getAttribute("aria-expanded"), "false"); assert.equal(await body.locator(".mk-pv-acc-content").isVisible(), false, "fermé = non visible (hors ordre de tabulation)");
    await btn.click(); assert.equal(await btn.getAttribute("aria-expanded"), "true"); await body.locator(".mk-pv-acc-content").waitFor({ state: "visible" });
    await btn.click(); assert.equal(await btn.getAttribute("aria-expanded"), "false");
    const forms = page.locator("#pv-acc-forms-btn"); await forms.focus(); await page.keyboard.press("Enter");
    assert.equal(await forms.getAttribute("aria-expanded"), "true"); await page.keyboard.press("Space"); assert.equal(await forms.getAttribute("aria-expanded"), "false");
    const chips = await page.locator(".mk-pv-acc .mk-pv-chip").allInnerTexts(); assert.ok(chips.some((c) => /Recommandation générale/.test(c)) && chips.some((c) => /Non détecté/.test(c)));
    await page.locator('[data-pv-tab="guide"]').focus(); await page.keyboard.press("ArrowLeft");
    assert.equal(await page.locator('[data-pv-tab="reglages"]').getAttribute("aria-selected"), "true", "flèches : changement d'onglet");
    await page.click('[data-pv-tab="guide"]'); await page.click("#pv-acc-media-btn");
    const href = await page.locator("#pv-acc-media [data-pv-link]").getAttribute("href"); assert.match(href, /\/sites\/\d+\/medias/);
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });

  test("téléphone (390 px) : aucun défilement horizontal, onglets et boutons accessibles", async () => {
    const page = await open(390); await go(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "pas de défilement horizontal (réglages)");
    await page.click('[data-pv-tab="guide"]'); await page.click("#pv-acc-forms-btn");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "pas de défilement horizontal (guide)");
    const box = await page.locator("[data-pv-tab='reglages']").boundingBox(); assert.ok(box.height >= 36);
    assert.equal(errors.length, 0, errors.join("\n"));
    await page.context().close();
  });
});
