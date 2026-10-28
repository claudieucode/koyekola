// KOLAKISA — Funnel Studio (interface des tunnels de vente) : structure de systeme.io (liste de gestion, fenêtre de création à quatre types,
// espace d'un tunnel à onglets avec menu de gauche), finition Kolakisa, bouton « Créer » discret. Données réelles uniquement.
// Partie statique + HTTP (vrai serveur) + navigateur (VRAI Chrome). Captures : FS_SHOTS=<dossier>.
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

describe("Funnel Studio — bouton « Créer » de la barre latérale (CSS)", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "kola-brand.css"), "utf8");
  const bloc = css.slice(css.indexOf("le bouton « Créer » : action principale mais discrète"));
  test("discret : 36 px, teinte azur sans dégradé, reflet, ombre ni mouvement", () => {
    assert.ok(css.includes("action principale mais discrète"));
    const regles = bloc.slice(0, bloc.indexOf("@media (prefers-reduced-motion"));
    assert.match(regles, /min-height: 36px/);
    assert.doesNotMatch(regles, /linear-gradient|translateY|scale\(/);
    assert.match(regles, /box-shadow: none/);
    assert.match(regles, /:focus-visible \{ outline: 2px solid/, "focus clavier visible");
    assert.doesNotMatch(bloc.slice(0, 2500), /box-shadow: inset|0 6px 14px/, "plus d'ombre ni de reflet");
  });
});

describe("Funnel Studio — liste et espace d'un tunnel", () => {
  let srv, boss, browser;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); if (!SKIP) browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });
  const count = () => srv.db().prepare("SELECT COUNT(*) AS n FROM mk_funnels").get().n;
  const idOf = (name) => srv.db().prepare("SELECT id FROM mk_funnels WHERE name = ?").get(name).id;

  test("état vide : titre, invitation à créer, aucune statistique inventée, pas de tableau de bord générique", async () => {
    const html = (await boss.get("/marketing/tunnels")).text;
    assert.match(html, /<h1>Tunnels de vente<\/h1>/);
    assert.match(html, /css\/funnel-studio\.css/);
    assert.match(html, /Aucun tunnel/);
    assert.match(html, /Créer le premier tunnel/);
    assert.doesNotMatch(html, /kx-kpis|Dans le studio|Activité récente|Pas encore raccordées/, "la liste n'est plus un tableau de bord décoratif");
    assert.equal(count(), 0, "aucun tunnel fictif");
  });

  test("« Créer » ouvre une fenêtre à la manière de systeme.io : nom, site, quatre types ; autres modèles repliés ; création réelle conservée", async () => {
    const html = (await boss.get("/marketing/tunnels")).text;
    assert.match(html, /<button type="button" class="fs-create" data-mk-modal-open="nouveau"/);
    const types = [...html.matchAll(/<label class="fs-type[^"]*"><input type="radio" name="template" value="([^"]*)"([^>]*)>/g)];
    assert.deepEqual(types.map((m) => m[1]), ["aimant", "vente-commande", "", "webinaire"], "audience, vente, personnalisé, webinaire");
    assert.match(types.find((m) => m[1] === "vente-commande")[2], /disabled/, "« Vendre » exige une formation publiée (aucune ici)");
    assert.match(types.find((m) => m[1] === "")[2], /checked/, "tunnel vide coché par défaut");
    assert.match(html, /<details class="fs-more">/);
    assert.match(html, /value="vente-formation" disabled/);
    assert.match(html, /name="name"[^>]*required/);
    assert.equal(count(), 0);
  });

  test("avec un tunnel réel : ligne de liste (nom, adresse, étapes, visiteurs, inscriptions, conversion, état), menu « ⋯ » aux actions réelles, filtre", async () => {
    await boss.post("/marketing/tunnels", { name: "Guide Photoshop", template: "aimant" });
    assert.equal(count(), 1);
    const html = (await boss.get("/marketing/tunnels")).text;
    assert.match(html, /<a href="\/marketing\/tunnels\/\d+">Guide Photoshop<\/a>/);
    assert.match(html, /<code>\/p\/[^<]+<\/code>/, "adresse d'entrée réelle de la première étape");
    assert.match(html, /fs-badge is-(live|part|off)">/, "état de publication réel");
    for (const col of ["Tunnel", "Étapes", "Visiteurs", "Inscriptions", "Conversion", "État"]) assert.match(html, new RegExp(`role="columnheader"[^>]*>${col}<`));
    const menu = html.slice(html.indexOf('class="mk-menu" id="fs-menu-'), html.indexOf("</div>", html.indexOf('class="mk-menu" id="fs-menu-')) + 6);
    assert.match(menu, /Ouvrir le tunnel/);
    assert.match(menu, /#fn-settings/);
    assert.match(menu, /\/dupliquer/);
    assert.match(menu, /\/archiver/);
    assert.match(menu, /aria-disabled="true"[^>]*>[^]*Partager[^]*Bientôt/, "« Partager » est visible mais inactif");
    assert.match(html, /data-fs-filter/);
    assert.match((await boss.get("/marketing/tunnels?vue=archives")).text, /Aucun tunnel archivé/);
  });

  test("actions réelles : dupliquer crée une copie, archiver la range dans « Archivés », restaurer la rend", async () => {
    const id = idOf("Guide Photoshop");
    const avant = count();
    await boss.post(`/marketing/tunnels/${id}/dupliquer`, { pages: "copy" });
    assert.equal(count(), avant + 1, "une copie existe");
    await boss.post(`/marketing/tunnels/${id}/archiver`, {});
    const arch = (await boss.get("/marketing/tunnels?vue=archives")).text;
    assert.match(arch, /Guide Photoshop/);
    assert.match(arch, /fs-badge is-archived">Archivé/);
    assert.match(arch, /\/restaurer/);
    await boss.post(`/marketing/tunnels/${id}/restaurer`, {});
    assert.match((await boss.get("/marketing/tunnels")).text, /<a href="\/marketing\/tunnels\/\d+">Guide Photoshop<\/a>/);
  });

  test("espace d'un tunnel : fil d'Ariane vers la liste, onglets, menu de gauche (parcours + Ajouter une étape), formulaires réels intacts", async () => {
    const id = idOf("Guide Photoshop");
    const html = (await boss.get(`/marketing/tunnels/${id}`)).text;
    assert.match(html, /class="fs-crumb"[^>]*><a href="\/marketing\/tunnels">[^]*Tunnels de vente<\/a>/);
    for (const [k, label] of [["steps", "Étapes"], ["stats", "Statistiques"], ["auto", "Automatisations"], ["settings", "Paramètres"]]) assert.match(html, new RegExp(`role="tab"[^>]*data-fs-tab="${k}">${label}`));
    for (const k of ["steps", "stats", "auto", "settings"]) assert.match(html, new RegExp(`data-fs-panel="${k}"`));
    assert.match(html, /class="fs-rail"/);
    assert.match(html, /<a class="fs-rail-add" href="#ajouter">/);
    assert.match(html, /class="fs-rail-item/);
    assert.match(html, /<form class="mk-form mk-flow-add" id="ajouter" action="\/marketing\/tunnels\/\d+\/etapes" method="post">/, "ajout d'étape réel conservé");
    assert.match(html, /fs-badge is-(live|part|off)">/);
    assert.match(html, /\/marketing\/pages\/\d+\/editeur/, "édition de page par l'éditeur existant");
  });

  test("navigateur : liste et espace d'un tunnel sans débordement ni erreur à 1440, 1280, 1024, 768 et 390 px ; menu, fenêtre, onglets, clavier, bouton « Créer »", { skip: SKIP }, async () => {
    const shots = process.env.FS_SHOTS;
    if (shots) fs.mkdirSync(shots, { recursive: true });
    const open = async (width, url, reduced = "no-preference") => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage();
      page.errors = [];
      page.on("pageerror", (e) => page.errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
      await page.goto(`${srv.base}${url}`);
      await page.waitForSelector(".fs, .fs-ws");
      return { page, context };
    };
    await boss.post("/marketing/tunnels", { name: "Lettre hebdo", template: "newsletter" });
    const avant = count();
    const id = idOf("Guide Photoshop");
    for (const width of [1440, 1280, 1024, 768, 390]) {
      for (const [nom, url] of [["liste", "/marketing/tunnels"], ["tunnel", `/marketing/tunnels/${id}`]]) {
        const { page, context } = await open(width, url);
        await page.waitForTimeout(400);
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, over: [...document.querySelectorAll(".fs *, .fs-ws *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1 && !e.closest(".fs-ws-tabs"); }).map((e) => e.className || e.tagName).slice(0, 5) }));
        assert.ok(m.sw <= m.iw, `${nom} ${width}px : débordement horizontal (${m.sw} > ${m.iw})`);
        assert.deepEqual(m.over, [], `${nom} ${width}px : éléments hors écran`);
        assert.deepEqual(page.errors, [], `${nom} ${width}px : erreurs JavaScript`);
        if (shots) await page.screenshot({ path: path.join(shots, `${nom}-${width}.png`), fullPage: true });
        await context.close();
      }
    }
    // Bouton « Créer » de la barre latérale : discret (36 px, plus de dégradé)
    { const { page, context } = await open(1440, "/marketing/tunnels");
      const b = await page.evaluate(() => { const el = document.querySelector(".mk-sidebar .mk-create-btn"); const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { h: Math.round(r.height), bg: cs.backgroundImage, shadow: cs.boxShadow }; });
      assert.ok(b.h >= 34 && b.h <= 38, `hauteur ${b.h}px`);
      assert.equal(b.bg, "none");
      assert.equal(b.shadow, "none");
      await context.close(); }
    // Liste : « Créer » ouvre la fenêtre, un type se coche, Échap ferme ; rien n'est créé sans validation
    const { page, context } = await open(1440, "/marketing/tunnels");
    await page.click(".fs-bar .fs-create");
    await page.waitForSelector("dialog#nouveau[open]");
    await page.click('.fs-type:has(input[value="webinaire"])');
    assert.equal(await page.evaluate(() => document.querySelector('#nouveau input[name="template"]:checked').value), "webinaire");
    if (shots) await page.screenshot({ path: path.join(shots, "creer-fenetre.png") });
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog#nouveau", { state: "hidden" });
    assert.equal(count(), avant, "aucun tunnel créé sans validation");
    // Menu « ⋯ » d'une ligne : s'ouvre sans déplacer la liste, se ferme avec Échap
    const top = await page.evaluate(() => document.querySelector(".fs-table").getBoundingClientRect().top);
    await page.click(".fs-card >> nth=0 >> button[aria-haspopup]");
    await page.waitForSelector(".mk-menu:not([hidden])");
    assert.equal(await page.evaluate(() => document.querySelector(".fs-table").getBoundingClientRect().top), top, "le menu ne déplace rien");
    assert.equal(await page.locator(".mk-menu:not([hidden]) [role=menuitem]").count() >= 4, true);
    if (shots) await page.screenshot({ path: path.join(shots, "menu-ligne.png") });
    await page.keyboard.press("Escape");
    // Recherche et filtre
    await page.fill("#fs-search", "lettre");
    await page.waitForFunction(() => [...document.querySelectorAll(".fs-card")].filter((c) => !c.hidden).length === 1);
    await page.fill("#fs-search", "zzz");
    await page.waitForFunction(() => !document.querySelector("[data-fs-nomatch]").hidden);
    assert.deepEqual(page.errors, []);
    assert.equal(count(), avant);
    await context.close();
    // Espace d'un tunnel : onglets (clic, clavier, ancre) et menu de gauche
    const t = await open(1440, `/marketing/tunnels/${id}`);
    assert.equal(await t.page.getAttribute('[data-fs-ws]', "data-active"), "steps");
    assert.equal(await t.page.isVisible("#fn-panel-steps"), true);
    assert.equal(await t.page.isVisible("#fn-panel-stats"), false);
    await t.page.click('[data-fs-tab="stats"]');
    assert.equal(await t.page.isVisible("#fn-panel-stats"), true);
    assert.equal(await t.page.isVisible("#fn-panel-steps"), false);
    await t.page.focus('[data-fs-tab="stats"]');
    await t.page.keyboard.press("ArrowRight");
    assert.equal(await t.page.getAttribute('[data-fs-ws]', "data-active"), "auto");
    await t.page.keyboard.press("End");
    assert.equal(await t.page.getAttribute('[data-fs-ws]', "data-active"), "settings");
    await t.page.click('[data-fs-tab="steps"]');
    await t.page.click(".fs-rail-add");
    assert.equal(await t.page.isVisible("#ajouter"), true, "« Ajouter une étape » mène au vrai formulaire");
    await t.context.close();
    // Ancre profonde : les réglages s'ouvrent directement (lien du menu « ⋯ »)
    const d = await open(1280, `/marketing/tunnels/${id}#fn-settings`);
    assert.equal(await d.page.getAttribute('[data-fs-ws]', "data-active"), "settings");
    assert.equal(await d.page.isVisible("#fn-panel-settings"), true);
    assert.deepEqual(d.page.errors, []);
    await d.context.close();
    // Mouvement réduit : aucune transition sur le bouton « Créer » de la page
    const r = await open(1280, "/marketing/tunnels", "reduce");
    assert.equal(await r.page.evaluate(() => getComputedStyle(document.querySelector(".fs-bar .fs-create")).transitionDuration), "0s");
    await r.context.close();
  });
});
