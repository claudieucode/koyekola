// En-têtes « Secteurs » : 12 modèles à IDENTITÉ PROPRE (palette fixe, polices de la bibliothèque, aucune couleur de la charte du site ni de l'administration) et effets au défilement
// (réduction de la rangée, superposé → plein). Statique, puis dans un vrai Chrome sur le site public. Voir docs/theme-builder/kolakisa-header-library.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const Catalog = require("../src/themeBuilder/catalog");
const Header = require("../src/themeBuilder/catalog/header");
const fontLib = require("../src/utils/fontLibrary");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

const BASE = ["clair", "marque", "nuit", "editorial", "doux"];
const sector = Catalog.entries("header").filter((e) => !BASE.includes(e.skinKey));
const doc = (key) => Catalog.build("header", key).section;
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };

describe("En-têtes sectoriels : identité propre", () => {
  test("12 modèles sectoriels, répartis dans leurs familles, chacun avec sa propre identité (12 identités distinctes), identifiants uniques", () => {
    assert.equal(sector.length, 12);
    assert.equal(Header.skins.length, 12);
    assert.equal(new Set(sector.map((e) => e.skinKey)).size, 12);
    const ids = Catalog.entries("header").map((e) => e.layoutId); assert.equal(new Set(ids).size, ids.length, "identifiants de mise en page uniques");
    for (const w of ["restaurant", "ecole", "agence", "cabinet", "portfolio", "saas", "media", "mode", "hotel", "association", "immobilier", "bien-etre"]) assert.ok(sector.some((e) => e.layoutId.startsWith(w)), `secteur « ${w} » absent`);
  });
  test("palettes et polices FIXES : aucune couleur de la charte du site (jetons), polices de la bibliothèque locale, palettes toutes différentes", () => {
    const seen = new Set();
    for (const e of sector) {
      assert.ok(!JSON.stringify(doc(e.key)).includes('"token:'), `${e.key} : couleur de la charte du site`);
      const id = Header.skins.find((s) => s.key === e.skinKey);
      for (const f of [id.font, id.head]) assert.ok(fontLib.isId(f), `${e.key} : police « ${f} » absente de la bibliothèque`);
      for (const c of [id.bg, id.fg, id.accent, id.onAccent]) assert.match(c, /^#[0-9a-f]{6}$/i, `${e.key} : couleur ${c}`);
      const sig = [id.bg, id.accent, id.head].join("|"); assert.ok(!seen.has(sig), `${e.key} : palette et police déjà utilisées`); seen.add(sig);
      assert.notEqual(id.bg.toLowerCase(), "#0b1220", `${e.key} : fond de l'identité « Nuit »`);
    }
    assert.ok(new Set(Header.skins.map((s) => s.head)).size >= 8);
  });
  test("typographie propre : menus, liens, boutons prennent la police de l'identité, logo et titre celle des titres ; menu, compte et logo via les parties du widget (le site impose sa police aux liens)", () => {
    for (const e of sector) {
      const id = Header.skins.find((x) => x.key === e.skinKey);
      walk(doc(e.key).children, (n) => {
        const f = n.styles && n.styles.desktop && n.styles.desktop.fontFamily;
        if (["menu", "link", "button"].includes(n.type)) assert.equal(f, id.font, `${e.key} : ${n.type}`);
        if (["sitelogo", "sitetitle"].includes(n.type)) assert.equal(f, id.head, `${e.key} : ${n.type}`);
        if (n.type === "menu") assert.equal(n.parts.link.styles.desktop.fontFamily, id.font, `${e.key} : lien du menu`);
        if (n.type === "sitelogo") assert.equal(n.parts.text.styles.desktop.fontFamily, id.head, `${e.key} : texte du logo`);
      });
    }
  });
  test("lisibilité : chaque identité a un contraste ≥ 4,5 entre texte et fond, et entre le texte du bouton et sa couleur", () => {
    const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    for (const s of Header.skins) {
      assert.ok(ratio(s.fg, s.bg) >= 4.5, `${s.key} : texte / fond ${ratio(s.fg, s.bg).toFixed(1)}`);
      assert.ok(ratio(s.onAccent, s.accent) >= 4.5, `${s.key} : bouton ${ratio(s.onAccent, s.accent).toFixed(1)}`);
      assert.ok(ratio(s.mute, s.bg) >= 3, `${s.key} : texte secondaire ${ratio(s.mute, s.bg).toFixed(1)}`);
    }
  });
  test("effets au défilement : portés par le conteneur d'en-tête (headerFx), uniquement sur les modèles qui les annoncent ; superposé → plein seulement pour l'hôtel", () => {
    const fx = {};
    for (const e of Catalog.entries("header")) { const root = doc(e.key).children[0]; if (root.props.headerFx) fx[e.layoutId] = [root.props.headerFx, (root.styles.desktop || {}).position]; }
    assert.deepEqual(fx, {
      "ecole-inscriptions": ["shrink", "sticky"], "agence-brutaliste": ["shrink", "sticky"], "portfolio-signature": ["shrink", "sticky"], "saas-violet-essai": ["shrink", "sticky"], "immobilier-recherche": ["shrink", "sticky"],
      "hotel-couverture": ["solid", "absolute"],
    });
  });
  test("coordonnées : textes d'exemple à remplacer, jamais un numéro ou une adresse inventés", () => {
    for (const e of sector) walk(doc(e.key).children, (n) => { if (n.type === "iconlist") for (const it of n.props.items) assert.ok(!/@|\d/.test(it.text) && !it.link, `${e.key} : « ${it.text} »`); });
  });
  test("grammaire : les modèles sectoriels s'enregistrent comme composants et gardent effet et parties de police après rechargement ; une valeur d'effet inconnue est écartée", () => {
    const { A } = freshMarketing(); const site = pages.createSite(A, { name: "Secteurs" });
    for (const e of sector) {
      const c = pages.createComponent(A, { name: `S ${e.key}`, section: JSON.parse(JSON.stringify(Catalog.build("header", e.key).section)), siteId: site.id, kind: "standard" });
      const saved = pages.getComponent(A, c.id);
      assert.equal(saved.section.children[0].props.headerFx, doc(e.key).children[0].props.headerFx, e.key);
      let menus = 0; walk(saved.section.children, (n) => { if (n.type === "menu") { menus += 1; assert.ok(n.parts && n.parts.link, `${e.key} : parties du menu perdues`); } });
    }
    const section = JSON.parse(JSON.stringify(Catalog.build("header", "hotel-couverture.hotel").section)); section.children[0].props.headerFx = "explose";
    const c = pages.createComponent(A, { name: "Effet inconnu", section, siteId: site.id, kind: "standard" });
    assert.equal(pages.getComponent(A, c.id).section.children[0].props.headerFx, undefined);
  });
  test("feuille de style et script : règles « is-scrolled » présentes, mouvement réduit respecté, un seul écouteur passif", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "landing.css"), "utf8");
    assert.match(css, /data-kw-scroll=shrink\]\.is-scrolled/); assert.match(css, /data-kw-scroll=solid\]\.is-scrolled/); assert.match(css, /prefers-reduced-motion: reduce\) \{ \.lp-block\.lp-site-header\[data-kw-scroll\]/);
    const js = fs.readFileSync(path.join(__dirname, "..", "public", "js", "landing.js"), "utf8");
    assert.match(js, /lp-site-header\[data-kw-scroll\]/); assert.match(js, /passive: true/);
  });
});

describe("En-têtes sectoriels : comportement au défilement dans un vrai Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, pHotel, pAgence;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
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
  const adopt = async (key, pageId) => {
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() });
    assert.equal(u.status, 200, u.text.slice(0, 200));
    const t = JSON.parse(u.text).template;
    // « Utiliser » crée un brouillon sans condition : on l'affecte à UNE page avant de publier (deux en-têtes publiés sur tout le site se disputeraient)
    const c = await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() });
    assert.equal(c.status, 200, c.text.slice(0, 200));
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Défilement" })).location.match(/sites\/(\d+)/)[1]);
    pHotel = await mkPage("Hotel"); pAgence = await mkPage("Agence");
    await adopt("hotel-couverture.hotel", pHotel); await adopt("agence-brutaliste.agence", pAgence);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (pageId, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pageId)}`, { waitUntil: "load" });
    return { ctx, pg, errors };
  };
  const BAND = ".lp-site-header .kw-full .kw-full";
  const bg = (pg) => pg.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor, BAND);
  const scrolled = (pg) => pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled"));

  test("hôtel (superposé → plein) : transparent et fixé en haut ; après défilement, fond plein, texte du site, toujours visible ; retour en haut = transparent", async () => {
    const { ctx, pg, errors } = await open(pHotel);
    assert.equal(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "solid");
    assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "fixed");
    assert.match(await bg(pg), /rgba\(0, 0, 0, 0\)|transparent/);
    await pg.evaluate(() => window.scrollTo(0, 600)); await scrolled(pg); await pg.waitForTimeout(350);
    assert.doesNotMatch(await bg(pg), /rgba\(0, 0, 0, 0\)/);
    assert.equal(await pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top)), 0, "reste visible en haut de l'écran");
    const link = await pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header .kw-menu a, .lp-site-header .kw-link, .lp-site-header .kw-sitetitle")).color);
    assert.notEqual(link, "rgb(255, 255, 255)", "le texte blanc a laissé la place au texte du site");
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-scrolled"));
    assert.deepEqual(errors, []); await ctx.close();
  });
  test("agence (collant → réduit) : la rangée se réduit au défilement, puis retrouve sa taille ; collant en haut", async () => {
    const { ctx, pg, errors } = await open(pAgence);
    assert.equal(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    const pad = () => pg.evaluate((s) => parseFloat(getComputedStyle(document.querySelector(s)).paddingTop), BAND);
    const before = await pad();
    await pg.evaluate(() => window.scrollTo(0, 700)); await scrolled(pg); await pg.waitForTimeout(350);
    const after = await pad(); assert.ok(after < before && after <= 6.5, `rangée réduite (${before} → ${after})`);
    assert.equal(await pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top)), 0, "collé en haut");
    await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await pg.waitForTimeout(350);
    assert.equal(await pad(), before);
    assert.deepEqual(errors, []); await ctx.close();
  });
  test("mouvement réduit : aucune transition sur la rangée ; mobile : pas de débordement horizontal", async () => {
    const r = await open(pAgence, { width: 1280, height: 700 }, true);
    assert.equal(await r.pg.evaluate((s) => getComputedStyle(document.querySelector(s)).transitionDuration, BAND), "0s");
    await r.ctx.close();
    for (const id of [pHotel, pAgence]) {
      const m = await open(id, { width: 390, height: 800 });
      assert.ok(await m.pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "pas de défilement horizontal");
      assert.deepEqual(m.errors, []); await m.ctx.close();
    }
  });
});
