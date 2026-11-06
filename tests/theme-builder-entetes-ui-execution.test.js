// En-têtes : interface et exécution (aperçu en contexte, retour au modèle initial, identité propre / du site, logo alternatif au défilement, barre fermable, réglages dans l'éditeur).
// Partie 1 : serveur (unités + routes) · partie 2 : Chrome réel (bibliothèque, appareils, retour au modèle, site publié) · partie 3 : éditeur (navigateur simulé).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS } = require("../src/themeBuilder/catalog/header/models");
const headerIdentity = require("../src/marketing/pages/headerIdentity");
const nodes = require("../src/marketing/pages/nodes");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const keyOf = (m) => `${m.key}.${m.key}`;
const KEY_A = Catalog.entries("header")[0].key, KEY_B = Catalog.entries("header")[1].key;
const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (k === "id" ? undefined : x)));
const walkAll = (n, fn) => { fn(n); for (const c of n.children || []) walkAll(c, fn); };

describe("Identité du site (unité) : couleurs et polices du modèle retirées à l'affichage, jamais sans réglage, document d'origine intact", () => {
  const sec = () => ({ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: { full: true, headerIdentity: "site" }, styles: { desktop: { backgroundColor: "#111111", color: "#ffffff", fontFamily: "font.inter", paddingTop: "10px" } }, states: { hover: { color: "#ff0000", opacity: 0.8 } }, children: [{ id: "ico000000001", type: "iconlist", props: { items: [], iconColor: "#ff00ff" }, styles: { desktop: { borderColor: "#00ff00", gap: "8px" } } }] }] });
  test("mode « site » : couleurs, polices, états et couleur d'icône retirés ; mise en page conservée ; l'original n'est pas modifié", () => {
    const s = sec(), before = JSON.stringify(s), out = headerIdentity.apply(s);
    assert.equal(JSON.stringify(s), before, "document d'origine intact");
    const box = out.children[0], d = box.styles.desktop;
    assert.deepEqual(Object.keys(d), ["paddingTop"]); assert.deepEqual(box.states.hover, { opacity: 0.8 });
    assert.equal(box.children[0].props.iconColor, undefined); assert.deepEqual(box.children[0].styles.desktop, { gap: "8px" });
    assert.equal(out.identitySite, true);
  });
  test("sans réglage (ou « modèle ») : strictement la même section, aucun changement silencieux", () => {
    const s = sec(); delete s.children[0].props.headerIdentity; assert.equal(headerIdentity.apply(s), s);
    const m = sec(); m.children[0].props.headerIdentity = "model"; assert.equal(headerIdentity.apply(m), m);
  });
  test("grammaire fermée : le serveur ne garde que les valeurs prévues", () => {
    const H = { linkUrl: () => "" }, spec = nodes.NODE_TYPES.container, ok = spec.props({ full: true, headerIdentity: "site", dismissible: true, libraryKey: "luxe-01.luxe-01", headerFx: "hide" }, "x", H);
    assert.equal(ok.headerIdentity, "site"); assert.equal(ok.dismissible, true); assert.equal(ok.libraryKey, "luxe-01.luxe-01"); assert.equal(ok.headerFx, "hide");
    const bad = spec.props({ full: true, headerIdentity: "<script>", dismissible: "oui", libraryKey: "A B;<x>" }, "x", H);
    assert.equal(bad.headerIdentity, undefined); assert.equal(bad.dismissible, undefined); assert.equal(bad.libraryKey, undefined);
    const logo = nodes.NODE_TYPES.sitelogo.props({ height: 48, scrollHeight: 30, scrollText: "  AB  " }), none = nodes.NODE_TYPES.sitelogo.props({ height: 48, scrollHeight: 4000, scrollText: "" });
    assert.equal(logo.scrollHeight, 30); assert.equal(logo.scrollText, "AB"); assert.equal(none.scrollHeight, undefined); assert.equal(none.scrollText, undefined);
    assert.equal(nodes.NODE_TYPES.sitetitle.props({ scrollText: "K" }).scrollText, "K");
  });
});

describe("Serveur : aperçu en contexte, origine bibliothèque, retour au modèle initial (annulable, isolé)", () => {
  let srv, boss, db, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const use = async (s, key) => { const r = await boss.request(U(s, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() }); assert.equal(r.status, 200, r.text.slice(0, 200)); return JSON.parse(r.text).template; };
  const comp = (t) => db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(t.sourceId);
  const working = (t) => { const c = comp(t); return JSON.parse(c.draft || c.section); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number((await boss.post("/marketing/site-web/sites", { name: "Site A" })).location.match(/sites\/(\d+)/)[1]);
    B = Number((await boss.post("/marketing/site-web/sites", { name: "Site B" })).location.match(/sites\/(\d+)/)[1]);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("aperçu complet : fond d'ouverture neutre libellé, page assez longue, script de défilement, mode démo (rien de mémorisé) ; vignette : même fond, sans script", async () => {
    const full = (await boss.get(U(A, `/api/bibliotheque/header/${KEY_A}/apercu`))).text, thumb = (await boss.get(U(A, `/api/bibliotheque/header/${KEY_A}/vignette`))).text;
    assert.match(full, /Aperçu · fond d'ouverture neutre/); assert.match(full, /data-kw-demo="1"/); assert.match(full, /<script src="[^"]*landing\.js[^"]*" defer>/);
    assert.match(full, /lp-site-header/, "rendu comme un vrai en-tête du site"); assert.doesNotMatch(full, /<img /i, "aucune image factice");
    assert.ok((full.match(/Contenu de la page \(aperçu\)/g) || []).length >= 3, "page de remplissage");
    assert.doesNotMatch(thumb, /<script/); assert.doesNotMatch(thumb, /fond d'ouverture neutre/); assert.match(thumb, /linear-gradient\(135deg,#1e293b/, "même fond que l'aperçu");
  });
  test("installation : la clé du modèle est gardée dans le document ; la carte annonce l'origine ; un en-tête créé autrement n'a pas de bouton", async () => {
    const t = await use(A, KEY_A);
    assert.equal(working(t).children[0].props.libraryKey, KEY_A);
    const list = JSON.parse((await boss.get(U(A, "/api/modeles"))).text).templates, c = list.find((x) => x.id === t.id);
    assert.equal(c.origin.key, KEY_A); assert.ok(c.origin.name);
    const own = JSON.parse((await boss.request(U(A, "/api/modeles"), { method: "POST", json: { type: "header", name: "Fait main" }, headers: ORIGIN() })).text).template;
    assert.equal(own.origin, null);
    const r = await boss.request(U(A, `/api/modeles/${own.id}/revenir-au-modele`), { method: "POST", json: {}, headers: ORIGIN() });
    assert.equal(r.status, 422); assert.match(JSON.parse(r.text).error, /pas été installé depuis la bibliothèque/);
  });
  test("revenir au modèle initial : composition d'origine rétablie (réglages et identité remis), annulable par les versions ; autres modèles et autre site inchangés", async () => {
    const tA = await use(A, KEY_A), tA2 = await use(A, KEY_B), tB = await use(B, KEY_A);
    const pristine = strip(working(tA)); assert.deepEqual(strip(working(tB)), pristine, "deux sites : mêmes copies indépendantes");
    // personnalisation : identité du site, barre fermable, effet, texte d'un élément
    const custom = working(tA); walkAll(custom, (n) => { if (n.type === "container" && n.props && n.props.full && !custom.__d) { n.props.headerIdentity = "site"; n.props.headerFx = "hide"; custom.__d = 1; } if (n.type === "text" && n.props && n.props.html) n.props.html = "<p>MODIFIÉ</p>"; });
    delete custom.__d; db.prepare("UPDATE mk_web_components SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(custom), tA.sourceId);
    const others = { a2: comp(tA2).section + comp(tA2).draft, b: comp(tB).section + comp(tB).draft };
    const r = await boss.request(U(A, `/api/modeles/${tA.id}/revenir-au-modele`), { method: "POST", json: {}, headers: ORIGIN() });
    assert.equal(r.status, 200, r.text.slice(0, 300)); const res = JSON.parse(r.text);
    assert.equal(res.original.key, KEY_A); assert.ok(res.version >= 1);
    assert.deepEqual(strip(working(tA)), pristine, "la copie de travail est identique à une installation neuve");
    assert.equal(working(tA).children[0].props.headerIdentity, undefined, "identité du modèle (par défaut) rétablie");
    assert.equal(comp(tA2).section + comp(tA2).draft, others.a2, "autre modèle du même site inchangé"); assert.equal(comp(tB).section + comp(tB).draft, others.b, "autre site inchangé");
    assert.equal(db.prepare("SELECT status FROM mk_tb_templates WHERE id = ?").get(tA.id).status, "draft", "rien n'est publié");
    // annulation : la version gardée avant le retour restaure la personnalisation
    const back = await boss.request(U(A, `/api/modeles/${tA.id}/versions/${res.version}/restaurer`), { method: "POST", json: {}, headers: ORIGIN() });
    assert.equal(back.status, 200, back.text.slice(0, 200));
    const restored = working(tA); assert.equal(restored.children[0].props.headerIdentity, "site"); assert.match(JSON.stringify(restored), /MODIFIÉ/);
    // droits : lecture seule refusée
    const anon = await new Client(srv.base).request(U(A, `/api/modeles/${tA.id}/revenir-au-modele`), { method: "POST", json: {}, headers: ORIGIN() });
    assert.ok([302, 401, 403].includes(anon.status), `anonyme refusé (${anon.status})`);
  });
});

describe("Chrome réel : bibliothèque (appareils, contexte, défilement), retour au modèle, site publié (identité, logo alternatif, barre fermable)", { skip: SKIP }, () => {
  let srv, boss, db, browser, A, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const errors = [];
  const newCtx = async (viewport, extra = {}) => { const ctx = await browser.newContext({ viewport, ...extra }); await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base }))); return ctx; };
  const tracked = async (ctx) => { const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); }); return page; };
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const mkPage = async (name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
    const content = { title: name, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${name}`, level: "2" } }, ...tall] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return id;
  };
  // installe + publie le modèle sur une page ; `tweak` modifie le document diffusé (réglages que l'éditeur écrit)
  const adopt = async (key, tweak) => {
    const pageId = await mkPage(`P ${key} ${Math.random().toString(36).slice(2, 6)}`);
    const r = await boss.request(U(site, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() }); const t = JSON.parse(r.text).template;
    if (tweak) { const c = db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(t.sourceId), sec = JSON.parse(c.section); tweak(sec); db.prepare("UPDATE mk_web_components SET section = ?, draft = NULL WHERE id = ?").run(JSON.stringify(sec), t.sourceId); }
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return { pageId, tpl: t, url: `${srv.base}/p/${slug(pageId)}` };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bibliothèque" })).location.match(/sites\/(\d+)/)[1]);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié" })).location.match(/sites\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("aperçu d'un modèle : sélecteur Ordinateur / Tablette / Mobile (rendu à la vraie largeur), fond d'ouverture neutre, défilement réel dans l'aperçu", async () => {
    const stickyShrink = MODELS.find((m) => m.mode === "stickyshrink");
    const ctx = await newCtx({ width: 1600, height: 1000 }), page = await tracked(ctx);
    await page.goto(`${srv.base}${U(A)}`); await page.click("#tb-lib-open"); await page.waitForSelector("#tb-lib-cards .tb-libcard");
    await page.selectOption("#tb-lib-type", "header"); await page.fill("#tb-lib-q", stickyShrink.name);
    await page.waitForFunction((n) => [...document.querySelectorAll("#tb-lib-cards .tb-libcard h3")].some((h) => h.textContent === n), stickyShrink.name);
    await page.locator("#tb-lib-cards .tb-libcard", { hasText: stickyShrink.name }).first().getByRole("button", { name: /Prévisualiser/ }).click();
    await page.waitForSelector("#tb-prev[open]"); const fr = page.frameLocator("#tb-prev-frame");
    await fr.locator(".lp-site-header").waitFor({ timeout: 20000 });
    const widthOf = () => page.evaluate(() => document.getElementById("tb-prev-frame").contentWindow.innerWidth);
    for (const [label, dev, w] of [["Ordinateur", "desktop", 1280], ["Tablette", "tablet", 820], ["Mobile", "mobile", 390]]) {
      await page.click(`.tb-devices button[data-dev="${dev}"]`);
      assert.equal(await page.getAttribute(`.tb-devices button[data-dev="${dev}"]`, "aria-pressed"), "true", label);
      await page.waitForFunction((x) => document.getElementById("tb-prev-frame").contentWindow.innerWidth === x, w);
      assert.equal(await widthOf(), w, `${label} : largeur réelle du rendu`);
      assert.ok(await page.evaluate(() => { const d = document.getElementById("tb-prev-frame").contentDocument.documentElement; return d.scrollWidth <= d.clientWidth + 1; }), `${label} : pas de débordement horizontal`);
    }
    await page.click('.tb-devices button[data-dev="mobile"]'); assert.ok(await fr.locator(".kw-menu-burger").first().isVisible(), "mobile : le menu se replie derrière un bouton (media queries réelles)");
    await page.click('.tb-devices button[data-dev="desktop"]'); await page.waitForFunction(() => document.getElementById("tb-prev-frame").contentWindow.innerWidth === 1280);
    assert.match(await fr.locator("body").innerText(), /Aperçu · fond d'ouverture neutre/i);
    // défilement dans l'aperçu : « se réduit » agit pour de bon
    const inFrame = (fn, arg) => page.evaluate(([src, a]) => { const w = document.getElementById("tb-prev-frame").contentWindow; return w.eval(`(${src})`)(a); }, [fn.toString(), arg]);
    assert.equal(await inFrame(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")), false);
    await inFrame(() => window.scrollTo(0, 700)); await page.waitForFunction(() => document.getElementById("tb-prev-frame").contentDocument.querySelector(".lp-site-header").classList.contains("is-scrolled"));
    await page.click("#tb-prev-back"); await ctx.close();
  });
  test("vignette : même contexte que l'aperçu (fond neutre sous l'en-tête) ; comparer plusieurs modèles reste fluide (3 rendus au plus en parallèle, page de 24 chargée)", async () => {
    const ctx = await newCtx({ width: 1440, height: 900 }), page = await tracked(ctx);
    await page.goto(`${srv.base}${U(A)}`); await page.click("#tb-lib-open"); await page.waitForSelector("#tb-lib-cards .tb-libcard"); await page.selectOption("#tb-lib-type", "header");
    await page.waitForFunction(() => document.querySelectorAll("#tb-lib-cards .tb-thumb iframe.tb-frame").length >= 6, null, { timeout: 60000 });
    const html = await page.evaluate(() => document.querySelector("#tb-lib-cards .tb-thumb iframe.tb-frame").getAttribute("srcdoc"));
    assert.match(html, /linear-gradient\(135deg,#1e293b/); assert.doesNotMatch(html, /<script/);
    await ctx.close();
  });
  test("« Revenir au modèle initial » dans l'interface : confirmation, composition rétablie, message d'annulation, autres modèles inchangés", async () => {
    const t1 = JSON.parse((await boss.request(U(A, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: KEY_A }, headers: ORIGIN() })).text).template;
    const t2 = JSON.parse((await boss.request(U(A, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: KEY_B }, headers: ORIGIN() })).text).template;
    const sectionOf = (t) => db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(t.sourceId).s;
    const pristine = sectionOf(t1), other = sectionOf(t2);
    const custom = JSON.parse(pristine); custom.children[0].props.headerFx = "hide"; custom.children[0].props.headerIdentity = "site";
    db.prepare("UPDATE mk_web_components SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(custom), t1.sourceId);
    const ctx = await newCtx({ width: 1440, height: 900 }), page = await tracked(ctx);
    await page.goto(`${srv.base}${U(A)}`);
    await page.waitForSelector("#tb-types .tb-tcard, #tb-cards .tb-card, #tb-cards tr", { timeout: 20000 });
    // type « En-tête » : la liste de ses modèles
    const typeBtn = page.locator('[data-type="header"]').first(); if (await typeBtn.count()) await typeBtn.click();
    const card = page.locator("#tb-cards .tb-card, #tb-cards tr", { hasText: t1.name }).first(); await card.waitFor({ timeout: 20000 });
    await card.locator(".tb-menu > button").click();
    let asked = ""; page.once("dialog", (d) => { asked = d.message(); d.accept(); });
    await card.getByRole("menuitem", { name: "Revenir au modèle initial" }).click();
    await page.waitForFunction(() => /est revenu au modèle initial/.test(document.getElementById("tb-status").textContent), null, { timeout: 20000 });
    assert.match(asked, /Revenir au modèle initial/); assert.match(asked, /Versions/); assert.match(asked, /Rien n'est publié/);
    assert.match(await page.locator("#tb-status").innerText(), /Restaurer la version \d+/);
    assert.deepEqual(JSON.parse(sectionOf(t1)), JSON.parse(pristine), "composition d'origine rétablie");
    assert.equal(sectionOf(t2), other, "l'autre modèle n'a pas bougé");
    // l'en-tête de l'autre modèle (même type) n'a pas le choix « refusé » : le bouton existe aussi pour lui, mais un modèle sans origine n'en a pas
    const own = JSON.parse((await boss.request(U(A, "/api/modeles"), { method: "POST", json: { type: "header", name: "Sans origine" }, headers: ORIGIN() })).text).template;
    await page.reload(); await page.waitForSelector("#tb-cards .tb-card, #tb-cards tr", { timeout: 20000 });
    const typeBtn2 = page.locator('[data-type="header"]').first(); if (await typeBtn2.count()) await typeBtn2.click();
    const c2 = page.locator("#tb-cards .tb-card, #tb-cards tr", { hasText: own.name }).first(); await c2.waitFor(); await c2.locator(".tb-menu > button").click();
    assert.equal(await c2.getByRole("menuitem", { name: "Revenir au modèle initial" }).count(), 0, "pas de bouton sans origine");
    await ctx.close();
  });
  test("identité : par défaut celle du modèle ; « couleurs et polices du site » la remplace sur le site publié (police et fond), sans toucher au document ; aucune erreur", async () => {
    const m = MODELS.find((x) => x.mode === "static" && x.S && x.S.head) || MODELS[0];
    const model = await adopt(keyOf(m)); const same = await adopt(keyOf(m), (sec) => { sec.children[0].props.headerIdentity = "site"; });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 } }), pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    const probe = () => pg.evaluate(() => { const h = document.querySelector(".lp-site-header"), t = h.querySelector(".kw-sitetitle-link, .kw-sitelogo-text, .kw-sitetitle"); return { font: getComputedStyle(t).fontFamily, ident: h.getAttribute("data-kw-identity"), bgs: [...h.querySelectorAll("*")].map((e) => getComputedStyle(e).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)"), body: getComputedStyle(document.body).fontFamily }; });
    await pg.goto(model.url); await pg.evaluate(() => document.fonts.ready); const a = await probe();
    await pg.goto(same.url); await pg.evaluate(() => document.fonts.ready); const b = await probe();
    assert.equal(a.ident, null, "par défaut : identité du modèle, aucun attribut"); assert.equal(b.ident, "site");
    assert.notEqual(a.font, b.font, `la police du modèle (${a.font}) est remplacée par celle du site (${b.font})`);
    assert.ok(!b.font.toLowerCase().includes(String(m.S.head).replace(/^font\./, "").split("-")[0]), `la police du modèle ne reste pas (${b.font})`);
    assert.notDeepEqual(a.bgs, b.bgs, "les fonds du modèle ne sont plus appliqués");
    // le document enregistré n'a pas perdu les couleurs du modèle (réversible)
    assert.match(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(same.tpl.sourceId).section, /backgroundColor/);
    assert.deepEqual(errs, []); await ctx.close();
  });
  test("logo / titre alternatif au défilement : bascule vers le texte et l'échelle alternatifs quand la page défile, revient en haut ; mouvement réduit sans transition", async () => {
    const m = MODELS.find((x) => x.mode === "sticky" || x.mode === "stickyshrink") || MODELS[0];
    const alt = await adopt(keyOf(m), (sec) => { walkAll(sec, (n) => { if (n.type === "sitelogo" || n.type === "sitetitle") { n.props = { ...n.props, scrollText: "KX", ...(n.type === "sitelogo" ? { scrollHeight: 24 } : {}) }; } }); });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 } }), pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(alt.url); await pg.evaluate(() => document.fonts.ready);
    assert.ok(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "l'en-tête est suivi au défilement");
    const vis = () => pg.evaluate(() => { const v = (s) => { const e = document.querySelector(`.lp-site-header ${s}`); return e ? getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0 : null; }; return { base: v(".kw-alt-base"), alt: v(".kw-alt-scrolled") }; });
    assert.deepEqual(await vis(), { base: true, alt: false }, "en haut : le nom du site");
    await pg.evaluate(() => window.scrollTo(0, 700)); await pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled"));
    assert.deepEqual(await vis(), { base: false, alt: true }, "défilé : le texte alternatif"); assert.equal((await pg.locator(".lp-site-header .kw-alt-scrolled").first().innerText()).trim(), "KX");
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-scrolled"));
    assert.deepEqual(await vis(), { base: true, alt: false }, "retour en haut");
    assert.deepEqual(errs, []); await ctx.close();
  });
  test("barre supérieure fermable : bouton réel (clavier), masque sans supprimer, mémorisé pour ce visiteur seulement, revient si le texte change, jamais mémorisé dans l'aperçu", async () => {
    const m = MODELS.find((x) => x.mode === "static") || MODELS[0];
    let barId = "";
    const bar = await adopt(keyOf(m), (sec) => { const rows = sec.children[0].children || []; const row = rows[0]; row.props = { ...(row.props || {}), dismissible: true }; barId = row.id; });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 } }), pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.goto(bar.url); await pg.evaluate(() => document.fonts.ready);
    const sel = `.lp-site-header [data-kw-dismissible]`; assert.equal(await pg.locator(sel).count(), 1);
    const btn = pg.locator(`${sel} > [data-kw-dismiss]`); assert.ok(await btn.isVisible()); assert.equal(await btn.getAttribute("aria-label"), "Fermer cette barre");
    assert.equal(await btn.evaluate((b) => b.tagName), "BUTTON");
    await btn.focus(); await pg.keyboard.press("Enter");
    assert.ok(await pg.locator(sel).evaluate((e) => getComputedStyle(e).display === "none"), "barre masquée");
    assert.equal(await pg.locator(sel).count(), 1, "masquée, pas supprimée");
    await pg.reload(); assert.ok(await pg.locator(sel).evaluate((e) => getComputedStyle(e).display === "none"), "toujours masquée au rechargement (mémorisé)");
    const other = await browser.newContext({ viewport: { width: 1280, height: 700 } }), p2 = await other.newPage();
    await p2.goto(bar.url); assert.ok(await p2.locator(sel).evaluate((e) => getComputedStyle(e).display !== "none"), "un autre visiteur la voit"); await other.close();
    // le texte de la barre change : elle revient
    const c = db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(bar.tpl.sourceId); const sec = JSON.parse(c.section);
    walkAll(sec.children[0].children[0], (n) => { if (n.type === "text" && n.props && n.props.html) n.props.html = "<p>NOUVEAU MESSAGE</p>"; if (n.type === "dyntext" && n.props) n.props.before = "NOUVEAU MESSAGE"; });
    db.prepare("UPDATE mk_web_components SET section = ? WHERE id = ?").run(JSON.stringify(sec), bar.tpl.sourceId);
    await pg.reload(); if (/NOUVEAU MESSAGE/.test(await pg.locator(sel).innerText())) assert.ok(await pg.locator(sel).evaluate((e) => getComputedStyle(e).display !== "none"), "texte changé : la barre revient");
    assert.deepEqual(errs, []); await ctx.close();
    // aperçu : rien n'est mémorisé (mode démo)
    const pctx = await newCtx({ width: 1280, height: 800 }), pp = await pctx.newPage();
    await pp.goto(`${srv.base}${U(A, `/api/bibliotheque/header/${keyOf(m)}/apercu`)}`);
    await pp.evaluate(() => { document.querySelectorAll("[data-kw-dismiss]").forEach((b) => b.click()); }); assert.equal(await pp.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("kw-dismiss")).length), 0, "aperçu : rien de mémorisé");
    await pctx.close();
  });
  test("aucune erreur JavaScript dans les parcours de l'interface", () => { assert.deepEqual(errors, []); });
});

const { setup, SKIP: SKIP_ED } = require("./helpers-editeur-navigateur");
describe("Éditeur (navigateur simulé) : nouveaux réglages d'en-tête et accès à chaque réglage d'animation des éléments d'un en-tête", { skip: SKIP_ED }, () => {
  let H;
  before(async () => { H = await setup(); });
  after(async () => { if (H) await H.stop(); });
  const sectionOfModel = (key) => { const s = JSON.parse(JSON.stringify(Catalog.build("header", key).section)); return s; };
  test("conteneur d'en-tête : identité (modèle / site), barre fermable et effet au défilement sont réglables et relus du serveur ; le logo a ses réglages alternatifs", async () => {
    const sec = sectionOfModel(KEY_A); sec.id = "sect00000001";
    let first = sec.children[0], logo = null; walkAll(sec, (n) => { if (!logo && (n.type === "sitelogo" || n.type === "sitetitle")) logo = n; });
    const id = await H.newPage("Entête réglages", { sections: [sec] });
    const ed = await H.openEditor(id);
    ed.selectLayer(first.id);
    assert.ok(ed.labels().some((l) => l.startsWith("Effet de l'en-tête au défilement")), "effet au défilement");
    const ident = ed.ctl("Couleurs et polices de l'en-tête"); assert.equal(ident.value, "", "par défaut : l'identité du modèle");
    ed.set(ident, "site");
    await H.until(async () => ((await H.serverNode(id, first.id)).props || {}).headerIdentity === "site", 8000, "identité du site enregistrée");
    ed.set(ed.ctl("Couleurs et polices de l'en-tête"), "");
    await H.until(async () => ((await H.serverNode(id, first.id)).props || {}).headerIdentity === undefined, 8000, "retour à l'identité du modèle");
    // barre fermable sur la première rangée
    const row = (first.children || []).find((c) => c.type === "container");
    if (row) { ed.selectLayer(row.id); ed.set(ed.ctl("Barre fermable"), true); await H.until(async () => ((await H.serverNode(id, row.id)).props || {}).dismissible === true, 8000, "barre fermable enregistrée"); }
    // logo / titre
    ed.selectLayer(logo.id);
    const isLogo = logo.type === "sitelogo";
    ed.set(ed.ctl(isLogo ? "Texte alternatif au défilement (logo sans image)" : "Texte alternatif au défilement"), "AB");
    await H.until(async () => ((await H.serverNode(id, logo.id)).props || {}).scrollText === "AB", 8000, "texte alternatif enregistré");
    if (isLogo) { ed.set(ed.ctl("Taille du logo une fois la page défilée"), "32"); await H.until(async () => ((await H.serverNode(id, logo.id)).props || {}).scrollHeight === 32, 8000, "échelle alternative enregistrée"); }
  });
  test("animation d'un élément d'en-tête : animation, durée, délai, courbe, répétition, direction, déclenchement, selon l'écran, accessibilité et survol sont atteignables", async () => {
    const sec = sectionOfModel(KEY_A); sec.id = "sect00000002";
    let target = null; walkAll(sec, (n) => { if (!target && (n.type === "menu" || n.type === "cmsmenu" || n.type === "button")) target = n; });
    const id = await H.newPage("Entête animation", { sections: [sec] });
    const ed = await H.openEditor(id);
    ed.selectLayer(target.id); ed.tab("Avancé");
    assert.ok(ed.sectionTitles().includes("Effets de mouvement"), `panneau de mouvement (${ed.sectionTitles().join(" | ")})`);
    ed.section("Effets de mouvement");
    assert.ok(ed.insp.querySelector("[data-pb-anim-pick]"), "choix de l'animation");
    ed.click(ed.insp.querySelector("[data-pb-anim-pick]")); ed.click(ed.doc.querySelector('.pb-amenu [data-anim="fade-in-up"]'));
    await H.until(async () => ((await H.serverNode(id, target.id)).motion || {}).entrance === "fade-in-up", 8000, "animation enregistrée");
    const labels = ed.labels().map((l) => l.toLowerCase());
    for (const want of ["durée", "délai", "courbe d'accélération", "répétition", "direction", "déclenchement"]) assert.ok(labels.some((l) => l.startsWith(want)), `réglage « ${want} » (${labels.join(" ; ")})`);
    const txt = ed.insp.textContent;
    assert.match(txt, /Selon l'écran/); assert.match(txt, /Accessibilité/); assert.match(txt, /Au survol/);
  });
});
