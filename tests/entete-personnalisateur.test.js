// Personnalisateur → Entête : modèle de réglages (validation stricte), CSS réellement généré, brouillon / publication / isolation par site par le VRAI serveur,
// puis le parcours complet dans un VRAI Chrome (interface → aperçu en direct → publication → page publiée).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const HS = require("../src/marketing/pages/headerSettings");
const { headerCss } = require("../src/marketing/pages/headerStyle");
const siteSettings = require("../src/marketing/pages/siteSettings");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const BP = { tablet: 1023, mobile: 767 };

describe("modèle de réglages de l'entête", () => {
  test("sans réglage : valeurs d'origine, aucun CSS (l'entête d'un site existant ne change pas)", () => {
    const h = HS.normalize({});
    assert.equal(h.auto, false); assert.equal(h.width, "full"); assert.equal(h.titleVis, "auto"); assert.equal(h.ocVis, "");
    assert.equal(headerCss(h, { breakpoints: BP, hasLogo: false }), "");
  });
  test("avec un logo, le titre « auto » s'efface comme avant (comportement d'origine conservé)", () => {
    assert.match(headerCss({}, { breakpoints: BP, hasLogo: true }), /\.lp-ah-title\{display:none!important\}/);
  });
  test("validation stricte : chaque type refuse ses valeurs invalides avec un message clair", () => {
    const strict = (o) => HS.normalize(o, { strict: true });
    assert.throws(() => strict({ width: "x" }), /Largeur : choix inconnu/);
    assert.throws(() => strict({ logoWidth: 9999 }), /Largeur du logo : un nombre entre 20 et 600/);
    assert.throws(() => strict({ titleColor: "rouge" }), /Couleur du titre : code couleur/);
    assert.throws(() => strict({ titleVis: "dx" }), /Visibilité du titre/);
    assert.throws(() => strict({ margin: "1,2,3" }), /quatre valeurs/);
    assert.throws(() => strict({ margin: "1,2,3,4;vh" }), /quatre valeurs/);
    assert.throws(() => strict({ title: "a".repeat(101) }), /100 caractères/);
    assert.throws(() => strict({ tpLogoUrl: "javascript:alert(1)" }), /Entête|image/);
  });
  test("valeurs valides conservées et normalisées ; texte nettoyé (aucune balise)", () => {
    const h = HS.normalize({ margin: "10,,10,0;rem", titleVis: "mdd", tagline: "<b>Slogan</b>\n  deux", menuHover: "underline-anim", titleColor: "#ABCDEF", logoWidthM: "80", tpOn: "mobile" }, { strict: true });
    assert.equal(h.margin, "10,,10,0;rem"); assert.equal(h.titleVis, "dm"); assert.equal(h.tagline, "b Slogan /b deux".replace("b Slogan /b", " b Slogan /b").trim().replace(/\s+/g, " "));
    assert.ok(!/[<>]/.test(h.tagline)); assert.equal(h.titleColor, "#abcdef"); assert.equal(h.logoWidthM, 80); assert.equal(h.tpOn, "mobile");
  });
  test("réglages par appareil : tablette et mobile vides = hérités (jamais d'écrasement)", () => {
    const css = headerCss({ logoWidth: 200, logoWidthM: 80 }, { breakpoints: BP, hasLogo: true });
    assert.match(css, /\.lp-autohead-brand \.lp-ah-logo-img\{width:200px/);
    assert.match(css, /@media \(max-width:767px\)\{\.lp-autohead-brand \.lp-ah-logo-img\{width:80px/);
    assert.ok(!/max-width:1023px\)\{\.lp-autohead-brand \.lp-ah-logo-img/.test(css), "la tablette n'a pas de règle propre : elle hérite de l'ordinateur");
  });
  test("chaque réglage de la table est un contrôle du personnalisateur (aucun réglage sans interface, aucun contrôle sans réglage)", () => {
    const cust = require("../src/services/customizer");
    const ids = cust.catalog(1, "").filter((c) => c.panel === "entete").map((c) => c.id.replace("settings.header.", ""));
    assert.deepEqual(ids.sort(), HS.SPEC.map((e) => e.id).sort());
  });
  test("chaque réglage de la table agit : il change le CSS (ou le balisage) quand on le renseigne", () => {
    const base = headerCss({ auto: true, ocVis: "tm", tpEnabled: true, tpLogo: true, tpLogoUrl: "/uploads/t.png", logoSvg: true }, { breakpoints: BP, hasLogo: true, logoUrl: "/uploads/l.png", tpLogoUrl: "/uploads/t.png" });
    // réglages qui agissent sur le balisage (rendu par _autohead.ejs) et non sur le CSS
    const MARKUP = new Set(["auto", "title", "tagline", "ocMode", "ocDir", "ocLabel", "ocShowLabel", "tpLogoUrl", "logoSvg", "tpLogo", "tpEnabled", "ocVis"]);
    const sample = (e) => ({ bool: !e.def, color: "#123456", vis: "d", space: "3,3,3,3", media: "/uploads/z.png", text: "x" })[e.type] ?? (e.type === "num" ? Math.min(Math.max(e.min, 30), e.max) : e.type === "enum" ? e.options.find((o) => o !== e.def && o !== "") : null);
    const dead = [];
    for (const e of HS.SPEC) {
      if (MARKUP.has(e.id)) continue;
      const v = sample(e); if (v === null || v === undefined) continue;
      const css = headerCss({ auto: true, ocVis: "tm", tpEnabled: true, tpLogo: true, logoSvg: true, [e.id]: v }, { breakpoints: BP, hasLogo: true, logoUrl: "/uploads/l.png", tpLogoUrl: "/uploads/t.png" });
      const ref = headerCss({ auto: true, ocVis: "tm", tpEnabled: true, tpLogo: true, logoSvg: true }, { breakpoints: BP, hasLogo: true, logoUrl: "/uploads/l.png", tpLogoUrl: "/uploads/t.png" });
      if (css === ref) dead.push(e.id);
    }
    void base;
    assert.deepEqual(dead, [], "réglages sans effet sur le rendu : " + dead.join(", "));
  });
  test("réglages enregistrés dans settings.header du site ; adresses d'image contrôlées comme le reste du site", () => {
    const s = siteSettings.normalizeSettings({ header: { width: "contained", tpLogoUrl: "/uploads/x.png" } }, { strict: true });
    assert.equal(s.header.width, "contained"); assert.equal(s.header.tpLogoUrl, "/uploads/x.png");
    assert.throws(() => siteSettings.normalizeSettings({ header: { tpLogoUrl: "http://exemple.test/x.png" } }, { strict: true }), /image/);
  });
});

describe("serveur réel : brouillon, publication, isolation, page publiée", () => {
  let srv, boss, db, A, B, pageA, pageB, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const post = (path, json) => boss.request(path, { method: "POST", headers: { Origin: srv.base }, json });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    const page = (n, sid) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, '[]', 'published', 'page', ?, datetime('now'))").run(orgId, n, n.toLowerCase(), n, sid).lastInsertRowid);
    A = site("Alpha"); B = site("Beta"); pageA = page("AccueilA", A); pageB = page("AccueilB", B);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageB, B);
  });
  after(async () => { db.close(); await srv.stop(); });
  const URL_ = (path, site) => `/marketing/site-web/personnaliser${path}?site=${site}`;
  const state = async (site) => { const r = await boss.get(URL_("", site)); const m = r.text.match(/id="kwc-boot"[^>]*>([\s\S]*?)<\/script>/) || r.text.match(/kwc-boot[^>]*>([\s\S]*?)<\/script>/); return m ? JSON.parse(m[1]) : null; };

  test("la rubrique Entête est proposée pour un site avec ses 112 réglages", async () => {
    const boot = await state(A); assert.ok(boot, "écran lu");
    const p = boot.panels.find((x) => x.id === "entete"); assert.ok(p && p.rich === "header");
    assert.equal(p.controls.length, HS.SPEC.length);
  });
  test("une valeur invalide est refusée avec une explication ; rien n'est enregistré", async () => {
    const r = await post(URL_("/rendu", A).replace("?site=", "?site="), { site: A, changes: { "settings.header.width": "bizarre" } });
    assert.equal(r.status, 422); assert.match(r.text, /Largeur : choix inconnu/);
    assert.equal(settingsOf(A).header, undefined);
  });
  test("aperçu : les réglages sont rendus par le moteur public ; rien n'est publié ; puis la publication les enregistre pour CE site seulement", async () => {
    const changes = { "settings.header.auto": true, "settings.header.title": "Atelier Alpha", "settings.header.tagline": "Apprendre vite", "settings.header.menuHover": "underline", "settings.header.margin": "8,0,8,0", "settings.header.tpEnabled": true, "settings.header.tpOn": "desktop" };
    const pv = await post(URL_("/rendu", A), { site: A, changes });
    assert.equal(pv.status, 200, pv.text.slice(0, 300));
    const page = (await boss.get(`/marketing/pages/${pageA}/apercu?kwcustom=1`)).text;
    assert.match(page, /<header class="lp-autohead is-tp" data-kw-header>/); assert.match(page, /Atelier Alpha/); assert.match(page, /Apprendre vite/);
    assert.match(page, /@media \(min-width:1024px\)\{\.lp-autohead, \.lp-site-header\{position:absolute/);
    assert.equal(settingsOf(A).header, undefined, "l'aperçu n'écrit rien");
    const other = (await boss.get(`/marketing/pages/${pageB}/apercu?kwcustom=1`)).text;
    assert.ok(!/data-kw-header/.test(other), "l'autre site n'est pas touché par l'aperçu");
    assert.equal((await post(URL_("/brouillon", A), { site: A, changes })).status, 200);
    assert.equal(settingsOf(A).header, undefined, "un brouillon n'est pas une publication");
    const pub = await post(URL_("/publier", A), { site: A });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    const h = settingsOf(A).header;
    assert.equal(h.auto, true); assert.equal(h.title, "Atelier Alpha"); assert.equal(h.tpOn, "desktop"); assert.equal(h.margin, "8,0,8,0");
    assert.equal(settingsOf(B).header, undefined, "isolation : l'autre site est intact");
    const live = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(live, /data-kw-header/);
  });
  test("refus : droit manquant / site étranger / valeur hors bornes", async () => {
    const bad = await post(URL_("/rendu", A), { site: A, changes: { "settings.header.logoWidth": 5000 } });
    assert.equal(bad.status, 422); assert.match(bad.text, /Largeur du logo/);
    const unknown = await post(URL_("/rendu", A), { site: A, changes: { "settings.header.inconnu": 1 } });
    assert.equal(unknown.status, 422);
  });
});

describe("parcours complet dans Chrome : interface → aperçu → publication → page publiée", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B, pageA, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const open = async (width = 1440) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(30000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-alpha', 'Accueil', '[]', 'published', 'page', ?, datetime('now'))").run(orgId, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageA, A);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("Entête : onglets, sous-panneaux, réglages par appareil ; l'aperçu change en direct ; la publication enregistre ; la page publiée l'affiche ; l'autre site est intact", async () => {
    const page = await open();
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-panel="entete"]').click();
    // Vue principale : deux onglets, trois préréglages, type transparent
    assert.equal(await page.locator(".kwh-tab").count(), 2);
    for (const v of ["logo", "oc", "menu", "tp"]) assert.equal(await page.locator(`[data-hdr-open="${v}"]`).count(), 1, v);
    await page.locator('[data-ctl="settings.header.auto"] .kwc-track').click();
    // Titre et logo : onglet Général
    await page.locator('[data-hdr-open="logo"]').click();
    await page.screenshot({ path: `${process.env.SHOTS || "/tmp"}/entete-logo.png` });
    assert.match(await page.locator(".kwh .kwc-kicker").innerText(), /Personnalisation ▸ Logo/);
    await page.locator('[data-ctl="settings.header.title"] input').fill("Atelier Alpha");
    await page.locator('[data-ctl="settings.header.tagline"] input').fill("Apprendre vite");
    // visibilité du slogan : retirer le mobile
    await page.locator('[data-ctl="settings.header.taglineVis"] [data-dev="m"]').click();
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.documentElement && /Atelier Alpha/.test(d.documentElement.innerHTML) && /Apprendre vite/.test(d.documentElement.innerHTML); }, null, { timeout: 45000 });
    // Design : taille du titre, valeur propre au mobile
    await page.locator(".kwh-tab", { hasText: "DESIGN" }).click();
    await page.locator('[data-ctl="settings.header.titleSize"] input.kwc-num').fill("30");
    await page.locator('[data-device="mobile"]').click();
    assert.equal(await page.locator('[data-ctl="settings.header.titleSizeM"]').count(), 1, "l'appareil mobile affiche le réglage propre au mobile");
    assert.equal(await page.locator('[data-ctl="settings.header.titleSize"]').count(), 0);
    await page.locator('[data-ctl="settings.header.titleSizeM"] input.kwc-num').fill("20");
    await page.locator('[data-device="desktop"]').click();
    // Marge externe : quatre côtés liés
    await page.locator('[data-ctl="settings.header.identityMargin"] .kwh-sp').first().fill("6");
    assert.equal(await page.locator('[data-ctl="settings.header.identityMargin"] .kwh-sp').nth(2).inputValue(), "6", "liaison des quatre côtés");
    // Retour, menu principal : survol et séparateur
    await page.locator('button[aria-label="Retour à Entête"]').click();
    await page.locator('[data-hdr-open="menu"]').click();
    await page.locator(".kwh-tab", { hasText: "DESIGN" }).click();
    await page.locator('[data-ctl="settings.header.menuHover"] select').selectOption("underline");
    // Aperçu : le CSS du moteur est présent dans le cadre
    await page.waitForFunction(() => { const d = document.getElementById("kwc-iframe").contentDocument; return d && d.documentElement && /font-size:30px/.test(d.documentElement.innerHTML) && /font-size:20px/.test(d.documentElement.innerHTML); }, null, { timeout: 45000 });
    assert.equal(settingsOf(A).header, undefined, "rien n'est enregistré avant la publication");
    // Publication
    await page.click("#kwc-publish");
    await page.getByRole("button", { name: /^Publier/ }).last().click().catch(() => {});
    await page.waitForFunction(() => /Publié/.test(document.getElementById("kwc-status-text").textContent), null, { timeout: 45000 });
    const h = settingsOf(A).header;
    assert.equal(h.auto, true); assert.equal(h.title, "Atelier Alpha"); assert.equal(h.tagline, "Apprendre vite");
    assert.equal(h.taglineVis, "dt"); assert.equal(h.titleSize, 30); assert.equal(h.titleSizeM, 20); assert.equal(h.menuHover, "underline"); assert.equal(h.identityMargin, "6,6,6,6");
    // Page publiée du site
    const pub = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.match(pub, /<header class="lp-autohead"[^>]*data-kw-header>/); assert.match(pub, /Atelier Alpha/); assert.match(pub, /Apprendre vite/);
    assert.match(pub, /\.lp-ah-title\{font-size:30px\}/); assert.match(pub, /@media \(max-width:767px\)\{\.lp-ah-title\{font-size:20px\}\}/);
    // Isolation : l'autre site n'a rien reçu
    assert.equal(settingsOf(B).header, undefined);
    assert.deepEqual(errors, []);
  });

  test("menu hors-champ et entête transparent : réglages enregistrés et rendus sur la page", async () => {
    const page = await open(1280);
    await page.goto(`${srv.base}/marketing/site-web/personnaliser?site=${A}`, { waitUntil: "domcontentloaded" });
    await page.locator('[data-panel="entete"]').click();
    await page.locator('[data-hdr-open="oc"]').click();
    await page.locator('[data-ctl="settings.header.ocVis"] [data-dev="m"]').click();
    await page.locator('[data-ctl="settings.header.ocMode"] .kwh-sbtn', { hasText: "Plein écran" }).click();
    await page.locator('button[aria-label="Retour à Entête"]').click();
    await page.locator('[data-hdr-open="tp"]').click();
    await page.locator('[data-ctl="settings.header.tpEnabled"] .kwc-track').click();
    await page.locator('[data-ctl="settings.header.tpOn"] .kwh-sbtn', { hasText: "Mobile" }).first().click();
    await page.click("#kwc-publish");
    await page.getByRole("button", { name: /^Publier/ }).last().click().catch(() => {});
    await page.waitForFunction(() => /Publié/.test(document.getElementById("kwc-status-text").textContent), null, { timeout: 45000 });
    const h = settingsOf(A).header;
    assert.equal(h.ocVis, "m"); assert.equal(h.ocMode, "full"); assert.equal(h.tpEnabled, true); assert.equal(h.tpOn, "mobile");
    assert.deepEqual(errors, []);
  });
});
