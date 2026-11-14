// SEO › Positions en vrai Chrome : proportions des champs, alignement, états de la connexion Search Console, responsive,
// ET fonctionnement réel (saisie, validation, import CSV, erreurs) vérifié dans la base. Ignoré avec la raison si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.SEO_SHOTS || "";

describe("SEO › Positions (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, siteId, base;
  const SP = "/marketing/site-web/sites";
  const open = async (width = 1400, height = 900, extra = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, ...extra });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); } };
  const box = async (page, sel) => page.locator(sel).evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right }; });
  const rows = (sql, ...a) => db.prepare(sql).all(...a);
  const goto = (page) => page.goto(`${base}/seo/positions`, { waitUntil: "load" });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    siteId = Number(String((await boss.post(SP, { name: "Site Positions" })).location).match(/sites\/(\d+)/)[1]);
    base = `${srv.base}${SP}/${siteId}`;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("bureau : chaque champ a la largeur de sa donnée, hauteurs et boutons alignés, aucun débordement", async () => {
    const page = await open(1400, 900);
    await goto(page);
    assert.equal(await page.locator(".rk-panel").count(), 2, "deux cartes");
    const kw = await box(page, "#ps-kw"), pos = await box(page, "#ps-pos"), url = await box(page, "#ps-url"), date = await box(page, "#ps-date");
    assert.ok(kw.w > pos.w * 2.5, `mot-clé (${kw.w}) bien plus large que position (${pos.w})`);
    assert.ok(pos.w <= 170, `position étroite (${pos.w})`);
    assert.ok(url.w > date.w, "la page est plus large que la date");
    assert.ok(Math.abs(kw.y - pos.y) < 1 && Math.abs(url.y - date.y) < 1, "champs d'une même rangée alignés en haut");
    assert.ok(Math.abs(kw.right - url.right) < 1, "le mot-clé et la page finissent au même bord");
    for (const h of [kw.h, pos.h, url.h, date.h]) assert.ok(Math.abs(h - 40) <= 1, `hauteur uniforme de 40 px (${h})`);
    const save = await box(page, "#ps-add ~ form .btn, form[action$='/seo/positions'] .btn-primary"), imp = await box(page, "form[action$='/positions/import'] .btn-primary");
    assert.ok(Math.abs(save.h - imp.h) < 1 && Math.abs(save.w - imp.w) < 40, "Enregistrer et Importer ont la même taille");
    assert.ok(save.w < 220, `bouton à la largeur de son contenu (${save.w})`);
    const p1 = await box(page, ".rk-panel:nth-of-type(1)"), p2 = await box(page, "#ps-imp"); void p2;
    const cards = await page.locator(".rk-panel").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width }; }));
    assert.ok(Math.abs(cards[0].x - cards[1].x) < 1 && Math.abs(cards[0].w - cards[1].w) < 1, "les deux cartes ont le même alignement et la même largeur"); void p1;
    const csv = await box(page, "#ps-csv"), card2 = cards[1];
    assert.ok(csv.h >= 150, `zone de collage confortable (${csv.h})`); assert.ok(csv.w <= card2.w, "zone de collage dans la carte");
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, "pas de défilement horizontal");
    await shot(page, "positions-bureau");
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });

  test("focus visible et date : même apparence que les autres champs", async () => {
    const page = await open(1400, 900); await goto(page);
    const style = (sel) => page.locator(sel).evaluate((e) => { const c = getComputedStyle(e); return { r: c.borderRadius, b: c.borderTopWidth, h: e.getBoundingClientRect().height, bg: c.backgroundColor, fs: c.fontSize }; });
    const a = await style("#ps-kw"), d = await style("#ps-date");
    assert.deepEqual(d, a, "la date a exactement le style du champ texte");
    await page.focus("#ps-kw");
    const sh = await page.locator("#ps-kw").evaluate((e) => getComputedStyle(e).boxShadow);
    assert.notEqual(sh, "none", "anneau de focus visible");
    await page.context().close();
  });

  test("état de la connexion Search Console : chaque état réel a son indicateur", async () => {
    const page = await open(1400, 900);
    await goto(page);
    assert.match(await page.locator(".rk-gsc").innerText(), /Non connecté/);
    assert.equal(await page.locator(".rk-gsc.is-off").count(), 1);
    assert.equal(await page.locator(".rk-api").count(), 0, "pas de relevé API sans connexion");
    const put = (status, err) => db.prepare("INSERT INTO seo_integrations (name, config, secret, status, checked_at, last_error) VALUES (?, '{}', 'x', ?, datetime('now'), ?) ON CONFLICT(name) DO UPDATE SET status = excluded.status, secret = excluded.secret, last_error = excluded.last_error, checked_at = excluded.checked_at").run(`search_console@site${siteId}`, status, err);
    put("error", "Accès refusé par Google");
    await goto(page);
    assert.match(await page.locator(".rk-gsc").innerText(), /Erreur de connexion/); assert.equal(await page.locator(".rk-gsc.is-err").count(), 1);
    assert.match(await page.locator(".rk-api-note").innerText(), /Accès refusé/, "le détail de l'erreur est affiché");
    put("connected", null);
    await goto(page);
    assert.match(await page.locator(".rk-gsc").innerText(), /Connecté/); assert.equal(await page.locator(".rk-gsc.is-ok").count(), 1);
    assert.equal(await page.locator(".rk-api .btn").count(), 1, "le relevé API apparaît quand la connexion est active");
    await shot(page, "positions-connecte");
    db.prepare("DELETE FROM seo_integrations WHERE name = ?").run(`search_console@site${siteId}`);
    await page.context().close();
  });

  test("ajouter une mesure : enregistrement réel, page facultative, date, validations", async () => {
    const page = await open(1400, 900); await goto(page);
    // Mot-clé vide : le navigateur refuse l'envoi, rien n'est enregistré
    await page.fill("#ps-pos", "5"); await page.click("form[action$='/seo/positions'] .btn-primary");
    assert.equal(rows("SELECT id FROM seo_rank_entries WHERE site_id = ?", siteId).length, 0, "mot-clé obligatoire");
    await page.fill("#ps-kw", "formation yoga en ligne");
    await page.fill("#ps-date", "2026-10-01");
    await Promise.all([page.waitForNavigation(), page.click("form[action$='/seo/positions'] .btn-primary")]);
    assert.match(await page.locator(".mk-flash").first().innerText(), /Mesure enregistrée/);
    let r = rows("SELECT keyword, position, page_url, measured_on FROM seo_rank_entries WHERE site_id = ?", siteId);
    assert.equal(r.length, 1); assert.equal(r[0].keyword, "formation yoga en ligne"); assert.equal(r[0].position, 5); assert.equal(r[0].measured_on, "2026-10-01");
    assert.ok(!r[0].page_url, "page facultative laissée vide");
    // Avec page, et une deuxième mesure pour le même mot-clé
    await page.fill("#ps-kw", "formation yoga en ligne"); await page.fill("#ps-pos", "3,5"); await page.fill("#ps-url", "/p/formation-yoga"); await page.fill("#ps-date", "2026-10-15");
    await Promise.all([page.waitForNavigation(), page.click("form[action$='/seo/positions'] .btn-primary")]);
    r = rows("SELECT position, page_url FROM seo_rank_entries WHERE site_id = ? ORDER BY measured_on", siteId);
    assert.equal(r.length, 2); assert.equal(r[1].position, 3.5); assert.equal(r[1].page_url, "/p/formation-yoga");
    assert.match(await page.locator(".mk-table").innerText(), /5 → 3\.5|5 → 3,5/, "l'historique montre l'évolution");
    // Position invalide : erreur claire du serveur, rien d'enregistré
    await page.fill("#ps-kw", "invalide"); await page.fill("#ps-pos", "0");
    await Promise.all([page.waitForNavigation(), page.click("form[action$='/seo/positions'] .btn-primary")]);
    assert.equal(await page.locator(".mk-flash-error").count(), 1, "message d'erreur affiché");
    assert.equal(rows("SELECT id FROM seo_rank_entries WHERE site_id = ? AND keyword = 'invalide'", siteId).length, 0);
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });

  test("importer un export Search Console : lignes importées, lignes refusées signalées, source tracée", async () => {
    const page = await open(1400, 900); await goto(page);
    const csv = "Requêtes les plus fréquentes,Clics,Impressions,CTR,Position\nyoga doux,10,200,5%,6.2\nméditation,3,90,3%,\"14,8\"\n";
    await page.fill("#ps-csv", csv); await page.fill("#ps-idate", "2026-10-20");
    await Promise.all([page.waitForNavigation(), page.click("form[action$='/positions/import'] .btn-primary")]);
    assert.match(await page.locator(".mk-flash").first().innerText(), /2 mesure\(s\) importée\(s\)/);
    const r = rows("SELECT keyword, position, source, measured_on FROM seo_rank_entries WHERE site_id = ? AND source = 'import-gsc' ORDER BY keyword", siteId);
    assert.deepEqual(r.map((x) => [x.keyword, x.position, x.measured_on]), [["méditation", 14.8, "2026-10-20"], ["yoga doux", 6.2, "2026-10-20"]]);
    await page.fill("#ps-csv", "n'importe quoi sans colonnes");
    await Promise.all([page.waitForNavigation(), page.click("form[action$='/positions/import'] .btn-primary")]);
    assert.equal(await page.locator(".mk-flash-error").count(), 1, "un fichier illisible donne une erreur claire");
    assert.equal(rows("SELECT id FROM seo_rank_entries WHERE site_id = ? AND source = 'import-gsc'", siteId).length, 2, "rien d'ajouté");
    await page.context().close();
  });

  test("tablette et mobile : redistribution, une colonne, aucun débordement, boutons accessibles", async () => {
    const tab = await open(820, 1100); await goto(tab);
    assert.ok((await tab.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, "tablette : pas de débordement");
    const kw = await box(tab, "#ps-kw"), pos = await box(tab, "#ps-pos");
    assert.ok(Math.abs(kw.y - pos.y) < 1, "tablette : mot-clé et position restent sur une rangée");
    await shot(tab, "positions-tablette"); await tab.context().close();
    const mob = await open(390, 844, { hasTouch: true, isMobile: true }); await goto(mob);
    assert.ok((await mob.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, "mobile : pas de débordement");
    const m = { kw: await box(mob, "#ps-kw"), pos: await box(mob, "#ps-pos"), url: await box(mob, "#ps-url"), date: await box(mob, "#ps-date"), btn: await box(mob, "form[action$='/seo/positions'] .btn-primary") };
    assert.ok(m.pos.y > m.kw.y + m.kw.h && m.date.y > m.url.y + m.url.h, "mobile : une seule colonne");
    for (const k of ["kw", "pos", "url", "date"]) assert.ok(Math.abs(m[k].w - m.kw.w) < 1, `mobile : ${k} occupe toute la largeur`);
    assert.ok(m.btn.h >= 44 && m.btn.w >= m.kw.w - 1, "mobile : bouton large et d'au moins 44 px");
    assert.equal(await mob.locator("#ps-kw").evaluate((e) => getComputedStyle(e).fontSize), "16px", "mobile : 16 px (pas de zoom automatique)");
    await shot(mob, "positions-mobile"); await mob.context().close();
  });

  test("mouvement réduit et mode sombre : lisibles, sans animation de champ", async () => {
    const page = await open(1400, 900, { reducedMotion: "reduce", colorScheme: "dark" }); await goto(page);
    assert.equal(await page.locator("#ps-kw").evaluate((e) => parseFloat(getComputedStyle(e).transitionDuration) < 0.001), true, "transition coupée");
    await shot(page, "positions-sombre");
    await page.context().close();
  });
});
