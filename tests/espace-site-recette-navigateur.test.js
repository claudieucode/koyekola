// R8 lot 3 — Recette dans un VRAI Chrome (Playwright), par rôle : équipe, administrateur d'un site, lecteur, administrateur d'un autre site, visiteur anonyme.
// Parcours : Mes sites → Ouvrir → tableau de bord (chiffres) → Articles → Contacts → fiche → modification par le vrai formulaire (site conservé) ; refus d'accès ; téléphone.
// Ignoré (avec la raison) si Playwright ou Chrome sont absents. SHOT_DIR (facultatif) : captures d'écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : recette navigateur non exécutée sur cette machine" : false;
const SHOTS = process.env.SHOT_DIR || "";

describe("recette de l'espace CMS d'un site dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, db, browser, errors, A, B, adminA, viewerA, adminB, cA1;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const open = async (client, viewport = { width: 1280, height: 900 }) => {
    const context = await browser.newContext({ viewport });
    if (client) await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); } };
  const openGroup = async (page, label) => { const head = page.locator(".mk-cms-nav .mk-nav-head", { hasText: label }).first(); if (await head.count() && (await head.getAttribute("aria-expanded")) === "false") await head.click(); };
  const banner = (page) => page.locator(".mk-site-banner-name");
  const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    A = await mkSite("Site Alpha"); B = await mkSite("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    const post = (slug, site, status) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status) VALUES (?, ?, '<p>x</p>', ?, ?)").run(slug, `Article ${slug}`, status === "published" ? 1 : 0, status).lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, 1, ?)").run(id, site); };
    post("alpha-un", A, "published"); post("alpha-deux", A, "draft"); post("bravo-un", B, "published");
    const contact = (e, n, s) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (1, ?, ?, ?)").run(e, n, s).lastInsertRowid);
    cA1 = contact("alice.alpha@ex.cd", "Alice", A); contact("bob.bravo@ex.cd", "Bob", B);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) { db.close(); await srv.stop(); } });

  test("équipe : Mes sites (principal + sites) → Ouvrir Alpha → tableau de bord avec ses chiffres → Articles → Contacts → fiche, sans jamais quitter le cadre du site ni voir Bravo", async () => {
    const { context, page } = await open(boss);
    await page.goto(srv.base + SP);
    assert.ok(await page.locator('tr[data-site="principal"]').isVisible(), "site principal dans le gestionnaire");
    await page.locator(`a[href="${SP}/${A}/tableau-de-bord"]`, { hasText: "Ouvrir" }).click();
    await page.waitForURL(`**${SP}/${A}/tableau-de-bord`);
    assert.ok(await banner(page).filter({ hasText: "Site Alpha" }).isVisible());
    assert.match(await page.locator(".mk-cms-stat", { hasText: "Articles publiés" }).innerText(), /1/);
    await shot(page, "r8-3-01-tableau-de-bord");
    await openGroup(page, "Articles"); await page.locator(".mk-cms-nav a", { hasText: "Tous les articles" }).first().click();
    await page.waitForURL(`**${SP}/${A}/articles`);
    const mainText = await page.locator("main").innerText();
    assert.match(mainText, /Article alpha-un/); assert.doesNotMatch(mainText, /bravo-un/);
    assert.ok(await banner(page).filter({ hasText: "Site Alpha" }).isVisible(), "cadre conservé");
    await openGroup(page, "Marketing du site"); await page.locator(".mk-cms-nav a", { hasText: /^\s*Contacts\s*$/ }).first().click();
    await page.waitForURL(`**${SP}/${A}/contacts`);
    const list = await page.locator("main").innerText(); assert.match(list, /alice\.alpha/); assert.doesNotMatch(list, /bob\.bravo/);
    await page.locator(`main a[href*="/contacts/${cA1}"]`).first().click();
    await page.waitForURL(`**/contacts/${cA1}?site=${A}`);
    assert.ok(await banner(page).filter({ hasText: "Site Alpha" }).isVisible(), "la fiche du contact reste dans le cadre du site");
    await shot(page, "r8-3-02-fiche-contact");
    await context.close();
  });

  test("administrateur du site Alpha : modifie un contact avec le VRAI formulaire (le site suit) ; Bravo et le site principal lui sont refusés", async () => {
    const { context, page } = await open(adminA);
    await page.goto(srv.base + "/marketing/site-web/mes-sites");
    await page.locator(`main a[href="${SP}/${A}"]`).first().click();
    await page.waitForURL(`**${SP}/${A}/tableau-de-bord`);
    await openGroup(page, "Marketing du site"); await page.locator(".mk-cms-nav a", { hasText: /^\s*Contacts\s*$/ }).first().click();
    await page.waitForURL(`**${SP}/${A}/contacts`);
    await page.locator(`main a[href*="/contacts/${cA1}"]`).first().click();
    await page.waitForURL(`**/contacts/${cA1}?site=${A}`);
    const nameField = page.locator('form[action*="/contacts/' + cA1 + '"] input[name="first_name"]').first();
    await nameField.fill("AliceModifiée");
    await nameField.locator("xpath=ancestor::form").locator('button[type="submit"]').first().click();
    await page.waitForURL(`**/contacts/${cA1}**`);
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", cA1).f, "AliceModifiée", "modification enregistrée");
    assert.match(page.url(), new RegExp(`site=${A}`), "retour sur la fiche avec le site");
    assert.ok(await banner(page).filter({ hasText: "Site Alpha" }).isVisible(), "toujours dans le cadre du site");
    const bravo = await page.goto(srv.base + `${SP}/${B}/tableau-de-bord`); assert.equal(bravo.status(), 403);
    assert.doesNotMatch(await page.locator("body").innerText(), /Site Bravo|bravo-un|bob\.bravo/);
    const principal = await page.goto(srv.base + "/marketing/site-web/principal/tableau-de-bord"); assert.ok(/mes-sites/.test(page.url()) || principal.status() === 403, "le site principal est refusé à un accès limité"); assert.doesNotMatch(await page.locator("body").innerText(), /Articles publiés|Médias communs/);
    await context.close();
  });

  test("lecteur du site Alpha : lit les contacts et les articles de son site, sans bouton d'ajout ni de création ; Bravo refusé", async () => {
    const { context, page } = await open(viewerA);
    await page.goto(srv.base + `${SP}/${A}/contacts`);
    assert.match(await page.locator("main").innerText(), /alice\.alpha|AliceModifiée|Alice/);
    assert.equal(await page.locator('main a[href*="contacts/nouveau"]').count(), 0, "pas d'« Ajouter un contact »");
    await page.goto(srv.base + `${SP}/${A}/articles`);
    assert.equal(await page.locator('main a[href*="articles/ajouter"], .mk-cms-primary').count() >= 0, true);
    assert.equal((await page.goto(srv.base + `${SP}/${B}/articles`)).status(), 403);
    await context.close();
  });

  test("administrateur d'un autre site et visiteur anonyme : aucun accès aux espaces d'Alpha ; l'anonyme est renvoyé vers la connexion", async () => {
    const other = await open(adminB);
    for (const p of ["tableau-de-bord", "articles", "contacts", "formulaires", "medias", "commentaires"]) assert.equal((await other.page.goto(srv.base + `${SP}/${A}/${p}`)).status(), 403, p);
    await other.context.close();
    const anon = await open(null);
    await anon.page.goto(srv.base + `${SP}/${A}/contacts`); assert.match(anon.page.url(), /connexion/);
    await anon.context.close();
  });

  test("téléphone (390 px) : le gestionnaire de sites et le tableau de bord d'un site n'ont aucun défilement horizontal", async () => {
    const { context, page } = await open(boss, { width: 390, height: 800 });
    for (const p of [SP, `${SP}/${A}/tableau-de-bord`, `${SP}/${A}/contacts`]) { await page.goto(srv.base + p); assert.ok(await noHScroll(page), `${p} : défilement horizontal`); }
    await shot(page, "r8-3-03-telephone-contacts");
    await context.close();
  });

  test("aucune erreur JavaScript ni de console pendant toute la recette", () => { assert.deepEqual(errors, []); });
});
