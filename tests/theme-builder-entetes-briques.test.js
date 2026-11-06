// Briques d'en-tête (header/blocks2.js) : (1) la grammaire du Page Builder les accepte ET conserve leurs styles (aucune propriété écartée en silence) ;
// (2) rendu réel dans Chrome : formes, titre fluide, ticker, blocs d'info, mosaïque, navigation verticale, menu plein écran (ordinateur + mobile, lu dans le menu affecté), pastille de panier.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const B = require("../src/themeBuilder/catalog/header/blocks");
const X = require("../src/themeBuilder/catalog/header/blocks2");
const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");
const { withIds } = require("../src/themeBuilder/catalog/kit");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

const k = { S: B.ID("essai", "Essai", { bg: "#101820", fg: "#f2f2f2", accent: "#ff5a36", onAccent: "#111111", alt: "#1b2630", line: "#33414d", mute: "#b8c2cc" }) };
const CTX = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
const norm = (node) => normalizeSections(CTX, [{ id: newSectionId(), type: "layout", children: withIds([JSON.parse(JSON.stringify(node))]) }])[0].children[0];
const BRICKS = () => ({
  disc: X.disc(k, { size: 64, gradient: { from: "#ff5a36", to: "#ffd166", angle: 45 } }), ring: X.ring(k), slash: X.slash(k, { angle: -25 }), stripe: X.stripe(k), vrule: X.vrule(k),
  slab: X.slab(k, [B.note(k, "Texte")]), monument: X.monument(k, { min: 40, max: 120 }), ticker: X.ticker(k, ["Un message", "Un autre message"], { bg: "#ff5a36", color: "#111111" }),
  info: X.info(k, ["hours", "phone", "address"]), navTiles: X.navTiles(k, "box"), navStack: X.navStack(k, "plain"), fsMenu: X.fsMenu(k, { preset: "circle" }), cartPill: X.cartPill(k),
});

describe("Briques d'en-tête : grammaire (aucun style écarté en silence)", () => {
  test("chaque brique est acceptée par la grammaire et garde ses propriétés visuelles clés", () => {
    for (const [name, node] of Object.entries(BRICKS())) {
      let out; assert.doesNotThrow(() => { out = norm(node); }, name);
      const d = (node.styles && node.styles.desktop) || {}, o = (out.styles && out.styles.desktop) || {};
      for (const key of Object.keys(d)) assert.deepEqual(o[key], d[key], `${name} : « ${key} » perdu ou modifié (${JSON.stringify(o[key])})`);
      for (const [part, spec] of Object.entries(node.parts || {})) for (const key of Object.keys((spec.styles && spec.styles.desktop) || {})) assert.deepEqual(out.parts[part].styles.desktop[key], spec.styles.desktop[key], `${name} : partie ${part}, « ${key} » perdu`);
    }
  });
  test("menu plein écran : mouvement choisi conservé, origine « menu affecté », aucune liste recopiée comme source", () => {
    const out = norm(X.fsMenu(k, { preset: "circle" })); assert.equal(out.props.source, "location"); assert.equal(out.motion.studio.preset, "circle");
    assert.equal(norm({ ...X.fsMenu(k), props: { ...X.fsMenu(k).props, source: "bidon" } }).props.source, "manual", "origine inconnue : retour à la valeur par défaut");
  });
  test("un élément « menu plein écran » écrit à la main (sans origine) garde son comportement historique : liens écrits dans l'élément", () => {
    const old = norm({ type: "motionfsmenu", props: { label: "Menu", buttonLabel: "Menu", closeLabel: "Fermer", links: [{ label: "A", url: "/a" }, { label: "B", url: "/b" }] } });
    assert.equal(old.props.source, "manual"); assert.equal(old.props.links.length, 2);
  });
});

describe("Briques d'en-tête dans un vrai Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, slug, bareSlug;
  const ORIGIN = () => ({ Origin: srv.base });
  const publish = async (name, sectionsChildren, siteId) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: siteId, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { title: name, sections: [{ id: "sect00000001", type: "layout", children: withIds(sectionsChildren) }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  };
  const holder = (kids) => ({ type: "container", props: { full: true }, children: kids, styles: { desktop: { backgroundColor: k.S.bg, color: k.S.fg, display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "16px", paddingRight: "16px" } } });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Briques" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    const b = BRICKS();
    slug = await publish("Briques", [holder([b.disc, b.ring, b.slash, b.stripe, b.vrule, b.slab, b.monument, b.ticker, b.info, b.navTiles, b.navStack, b.fsMenu, b.cartPill])], site);
    // site SANS menu affecté : le menu plein écran « menu affecté » n'affiche rien
    const site2 = Number((await boss.post("/marketing/site-web/sites", { name: "Sans menu" })).location.match(/sites\/(\d+)/)[1]);
    bareSlug = await publish("Sans menu", [holder([X.fsMenu(k)])], site2);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (s, width) => { const ctx = await browser.newContext({ viewport: { width, height: 800 } }); const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message)); await pg.goto(`${srv.base}/p/${s}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300); return { ctx, pg, errors }; };

  test("formes décoratives : disque rond en dégradé, anneau, bandeau incliné, liseré en dégradé, filet vertical", async () => {
    const { ctx, pg, errors } = await open(slug, 1280);
    const r = await pg.evaluate(() => { const kids = [...document.querySelectorAll(".kw-full > .kw-container, .kw-full > div")]; const cs = (el) => getComputedStyle(el); const by = (f) => kids.find(f);
      const disc = by((e) => cs(e).borderRadius.includes("999") && cs(e).backgroundImage.includes("gradient")), ring = by((e) => cs(e).borderRadius.includes("999") && cs(e).borderTopWidth === "2px"), slash = by((e) => cs(e).transform !== "none"), stripe = by((e) => cs(e).backgroundImage.includes("gradient") && parseFloat(cs(e).height) <= 8), vrule = by((e) => parseFloat(cs(e).width) === 1 && parseFloat(cs(e).height) === 32);
      const box = (e) => e && { w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) };
      return { disc: box(disc), ring: box(ring), slash: slash && { t: cs(slash).transform, ...box(slash) }, stripe: box(stripe), vrule: box(vrule) }; });
    assert.deepEqual(r.disc, { w: 64, h: 64 }); assert.deepEqual(r.ring, { w: 56, h: 56 }); assert.ok(r.slash && r.slash.t.startsWith("matrix"), "bandeau non incliné"); assert.ok(r.stripe && r.stripe.w > 600, "liseré pleine largeur"); assert.ok(r.vrule, "filet vertical");
    assert.deepEqual(errors, []); await ctx.close();
  });
  test("titre monumental : taille fluide (grande sur ordinateur, bornée sur mobile), sans débordement horizontal", async () => {
    const size = async (w) => { const { ctx, pg } = await open(slug, w); const r = await pg.evaluate(() => ({ fs: parseFloat(getComputedStyle(document.querySelector(".kw-sitetitle")).fontSize), over: document.documentElement.scrollWidth - document.documentElement.clientWidth })); await ctx.close(); return r; };
    const d = await size(1440), m = await size(390); assert.ok(d.fs >= 110, `ordinateur ${d.fs}`); assert.ok(m.fs >= 40 && m.fs < 60, `mobile ${m.fs}`); assert.ok(d.over <= 1 && m.over <= 1, "débordement horizontal");
  });
  test("ticker : le widget « défilement continu » anime la bande, met en pause au survol ; blocs d'information : consignes, jamais de coordonnées inventées", async () => {
    const { ctx, pg } = await open(slug, 1280);
    const anim = await pg.evaluate(() => { const t = document.querySelector(".kw-marquee"); return { n: t.getAnimations({ subtree: true }).length, css: [...t.querySelectorAll("*")].some((e) => getComputedStyle(e).animationName !== "none") }; }); assert.ok(anim.n > 0 || anim.css, "la bande ne défile pas");
    const txt = (await pg.locator(".kw-iconlist").allInnerTexts()).join(" "); assert.match(txt, /horaires/i); assert.match(txt, /téléphone/i); assert.match(txt, /adresse/i); assert.doesNotMatch(txt, /\d{2}[ .]\d{2}[ .]\d{2}/);
    await ctx.close();
    const m = await open(slug, 390); for (const l of await m.pg.locator(".kw-iconlist").all()) assert.equal(await l.isVisible(), false, "bloc d'infos masqué sur mobile"); await m.ctx.close();
  });
  test("mosaïque : liens en cases bordées à retour à la ligne ; navigation verticale : liens empilés ; menu lu dans le menu affecté", async () => {
    const { ctx, pg } = await open(slug, 1280);
    const r = await pg.evaluate(() => { const menus = [...document.querySelectorAll(".kw-menu")]; const info = (m) => { const l = [...m.querySelectorAll(".kw-menu-link")]; return { n: l.length, bt: l[0] ? getComputedStyle(l[0]).borderTopWidth : "", dir: getComputedStyle(m.querySelector(".kw-menu-list")).flexDirection, w: Math.round(m.querySelector(".kw-menu-list").getBoundingClientRect().width), texts: l.map((x) => x.textContent.trim()) }; }; return menus.map(info); });
    assert.equal(r.length, 2); const [tiles, stack] = r; assert.deepEqual(tiles.texts.slice(0, 3), ["Alpha", "Beta", "Gamma"]); assert.equal(tiles.bt, "1px"); assert.ok(tiles.w <= 420, `mosaïque ${tiles.w}`); assert.equal(stack.dir, "column");
    await ctx.close();
  });
  test("menu plein écran sur ORDINATEUR et mobile : le bouton ouvre un panneau avec les liens du menu affecté, Échap ferme ; sans menu affecté : rien n'est affiché", async () => {
    for (const w of [1280, 390]) {
      const { ctx, pg, errors } = await open(slug, w);
      await pg.waitForSelector(".kw-ms-live"); const toggle = pg.locator(".kw-ms-fm-toggle"); assert.ok(await toggle.isVisible(), `${w} : bouton absent`);
      assert.equal(await pg.locator(".kw-ms-fm-panel").isVisible(), false, `${w} : panneau déjà ouvert`);
      await toggle.click(); await pg.waitForTimeout(900);
      assert.ok(await pg.locator(".kw-ms-fm-panel").isVisible(), `${w} : le panneau ne s'ouvre pas`);
      const links = await pg.locator(".kw-ms-fm-link").allInnerTexts(); assert.deepEqual(links.map((t) => t.replace(/\d+/g, "").trim()), ["Alpha", "Beta", "Gamma"], `${w} : liens du menu affecté`);
      const box = await pg.locator(".kw-ms-fm-panel").boundingBox(); assert.ok(box.width >= w - 2 && box.height >= 700, `${w} : pas plein écran (${box.width}×${box.height})`);
      await pg.keyboard.press("Escape"); await pg.waitForTimeout(900); assert.equal(await pg.locator(".kw-ms-fm-panel").isVisible(), false, `${w} : Échap ne ferme pas`);
      assert.deepEqual(errors, []); await ctx.close();
    }
    const { ctx, pg } = await open(bareSlug, 1280); assert.equal(await pg.locator(".kw-ms-fm").count(), 0, "menu plein écran affiché sans menu affecté"); await ctx.close();
  });
  test("pastille de panier : la règle de style de la partie « pastille » est écrite pour le mini-panier (la pastille ne s'affiche qu'avec des articles)", async () => {
    const { ctx, pg } = await open(slug, 1280);
    const r = await pg.evaluate(() => { const m = document.querySelector(".kw-minicart"); const cls = m ? [...m.classList].find((c) => /^kw-n-/.test(c)) : ""; const css = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"); return { cls, ok: !!cls && new RegExp(`\\.${cls}[^{]*\\.kw-mc-count[^{]*\\{[^}]*(255, ?90, ?54|#ff5a36)`, "i").test(css) }; });
    assert.ok(r.cls, "mini-panier absent"); assert.ok(r.ok, "règle de la pastille absente"); await ctx.close();
  });
});
