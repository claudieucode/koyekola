// KOLAKISA — Funnel Studio, phase 1 (interface) : l'écran Tunnels réel, sans fausses données, avec éléments inactifs inoffensifs.
// Partie HTTP (vrai serveur) + partie navigateur (VRAI Chrome : cinq largeurs, débordements, menu, recherche, mouvement réduit).
// Captures : FS_SHOTS=<dossier> pour les enregistrer.
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

describe("Funnel Studio — interface des tunnels", () => {
  let srv, boss, browser;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); if (!SKIP) browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });
  const count = () => srv.db().prepare("SELECT COUNT(*) AS n FROM mk_funnels").get().n;

  test("état vide : titre, indicateurs sans chiffre inventé, invitation à créer, zones du studio signalées « Bientôt »", async () => {
    const html = (await boss.get("/marketing/tunnels")).text;
    assert.match(html, /Funnel Studio/);
    assert.match(html, /<h1>Tunnels de vente<\/h1>/);
    assert.match(html, /css\/funnel-studio\.css/);
    for (const label of ["Tunnels", "Visiteurs", "Contacts générés", "Ventes", "Taux de conversion"]) assert.match(html, new RegExp(`mk-stat-label">${label}`));
    assert.match(html, /Aucun tunnel/);
    assert.match(html, /Créer le premier tunnel/);
    assert.match(html, /Pas encore raccordées/, "les ventes sont signalées non raccordées");
    assert.match(html, /Dans le studio/);
    assert.equal((html.match(/class="fs-soon"/g) || []).length >= 8, true, "types, ventes, filtres et zones du studio marqués « Bientôt »");
    // Aucun tunnel fictif : la base reste vide
    assert.equal(count(), 0);
    // Création réelle conservée : la boîte, ses modèles et l'indisponibilité du modèle formation
    assert.match(html, /name="template" value="aimant"/);
    assert.match(html, /value="vente-formation" disabled/);
  });

  test("les éléments décoratifs sont inactifs : aucun lien, aucun envoi de formulaire, aucune écriture", async () => {
    const html = (await boss.get("/marketing/tunnels")).text;
    const soon = html.match(/<button[^>]*class="[^"]*fs-menu-item[^"]*"[^>]*>/g) || [];
    assert.equal(soon.length, 5, "cinq types de tunnel d'exemple");
    for (const b of soon) assert.match(b, /aria-disabled="true"/);
    assert.doesNotMatch(html.slice(html.indexOf('class="fs-create-menu') || 0, html.indexOf("</header>")), /href=|<form|type="submit"/);
  });

  test("avec un tunnel réel : carte (nom, étapes, état, modification), indicateurs calculés depuis les vrais chiffres, recherche, archives", async () => {
    await boss.post("/marketing/tunnels", { name: "Guide Photoshop", template: "aimant" });
    assert.equal(count(), 1);
    const html = (await boss.get("/marketing/tunnels")).text;
    assert.match(html, /<a href="\/marketing\/tunnels\/\d+">Guide Photoshop<\/a>/);
    assert.match(html, /fs-badge is-active">Actif/);
    assert.match(html, /\d+ étapes?/);
    assert.match(html, /Modifié le /);
    assert.match(html, /data-fs-search/);
    assert.match(html, /Domaine : —/, "emplacement réservé, sans valeur inventée");
    assert.match((await boss.get("/marketing/tunnels?vue=archives")).text, /Aucun tunnel archivé/);
  });

  test("navigateur : cinq largeurs sans débordement ni erreur ; menu « Créer » inoffensif ; recherche ; mouvement réduit", { skip: SKIP }, async () => {
    const shots = process.env.FS_SHOTS;
    if (shots) fs.mkdirSync(shots, { recursive: true });
    const open = async (width, reduced = "no-preference") => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage();
      page.errors = [];
      page.on("pageerror", (e) => page.errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
      await page.goto(`${srv.base}/marketing/tunnels`);
      await page.waitForSelector(".fs");
      return { page, context };
    };
    // Un tunnel existe déjà (test précédent) ; on en ajoute un second au nom proche pour la recherche
    await boss.post("/marketing/tunnels", { name: "Lettre hebdo", template: "newsletter" });
    const before = count();
    for (const width of [1440, 1280, 1024, 768, 390]) {
      const { page, context } = await open(width);
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, main: document.querySelector(".fs").getBoundingClientRect().width, over: [...document.querySelectorAll(".fs *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1; }).map((e) => e.className || e.tagName).slice(0, 5) }));
      assert.ok(m.sw <= m.iw, `${width}px : débordement horizontal (${m.sw} > ${m.iw})`);
      assert.deepEqual(m.over, [], `${width}px : éléments hors écran`);
      assert.deepEqual(page.errors, [], `${width}px : erreurs JavaScript`);
      if (shots) { await page.waitForTimeout(900); await page.screenshot({ path: path.join(shots, `tunnels-${width}.png`), fullPage: true }); }
      await context.close();
    }
    const { page, context } = await open(1440);
    // Menu : s'ouvre sans déplacer la page, un type d'exemple ne fait rien, Échap ferme
    const top = await page.evaluate(() => document.querySelector(".fs-kpis").getBoundingClientRect().top);
    await page.click(".fs-create-caret");
    await page.waitForSelector("#fs-create-menu:not([hidden])");
    assert.equal(await page.evaluate(() => document.querySelector(".fs-kpis").getBoundingClientRect().top), top, "le menu ne déplace aucun panneau");
    if (shots) await page.screenshot({ path: path.join(shots, "tunnels-menu-ouvert.png") });
    const url = page.url();
    await page.click("#fs-create-menu .fs-menu-item >> nth=0", { force: true }); // inactif : Playwright le refuse sans force, c'est voulu
    assert.equal(page.url(), url, "un type d'exemple ne navigue pas");
    assert.equal(count(), before, "aucun tunnel créé par le menu");
    await page.keyboard.press("Escape");
    await page.waitForSelector("#fs-create-menu", { state: "hidden" });
    // Bouton principal : vraie boîte de création conservée
    await page.click(".fs-create-main");
    await page.waitForSelector("dialog#nouveau[open]");
    await page.keyboard.press("Escape");
    // Recherche : filtre l'affichage sans requête
    await page.fill("#fs-search", "lettre");
    await page.waitForFunction(() => [...document.querySelectorAll(".fs-card")].filter((c) => !c.hidden).length === 1);
    await page.fill("#fs-search", "zzz");
    await page.waitForFunction(() => !document.querySelector("[data-fs-nomatch]").hidden);
    assert.deepEqual(page.errors, []);
    assert.equal(count(), before);
    await context.close();
    // Mouvement réduit : aucune transition sur la flèche, page identique
    const r = await open(1280, "reduce");
    assert.equal(await r.page.evaluate(() => getComputedStyle(document.querySelector(".fs-create-caret svg")).transitionDuration), "0s");
    await r.context.close();
  });
});
