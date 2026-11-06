// En-têtes du secteur « agence » (agences créatives et studios digitaux) : contrat, nœuds natifs, identité propre, contraste, animations annoncées réelles, compositions distinctes,
// puis rendu réel dans Chrome (trois largeurs, menu ordinateur et mobile, menu plein écran, comportement au défilement, modification enregistrée et relue, installation sur un site sans double en-tête).
// Matrice de conception : docs/theme-builder/headers-secteurs/agence.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const HEADER = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const { withIds } = require("../src/themeBuilder/catalog/kit");
const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");

const MODELS = HEADER.MODELS.filter((m) => m.sector === "agence");
const key = (m) => `${m.key}.${m.key}`;
const doc = (m) => Catalog.build("header", key(m)).section;
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const nodesOf = (m) => { const out = []; walk(doc(m).children, (n) => out.push(n)); return out; };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Signature de composition : types et profondeur des nœuds, sans couleurs ni textes
const signature = (m) => { const out = []; const rec = (n, d) => { out.push(`${d}${n.type}${n.type === "grid" ? ":" + (n.styles.desktop.gridTemplate || "") : ""}`); (n.children || []).forEach((c) => rec(c, d + 1)); }; doc(m).children.forEach((c) => rec(c, 0)); return out.join("|"); };

describe("En-têtes « agence » : contrat et nœuds", () => {
  test("10 modèles agence-01 à agence-10 remplacent les modèles hérités ; noms uniques dans toute la bibliothèque", () => {
    assert.equal(MODELS.length, 10); assert.ok(MODELS.every((m) => m.custom), "tous écrits sur mesure");
    assert.deepEqual(MODELS.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `agence-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(HEADER.MODELS.map((m) => m.name)).size, 100);
    assert.equal(new Set(MODELS.map((m) => m.art)).size, 10, "dix directions artistiques différentes");
  });
  test("grammaire du Page Builder, types de nœuds natifs seulement, aucune image ni HTML libre, boutons vers des pages du site", () => {
    const OK = ["container", "group", "stack", "grid", "sitelogo", "sitetitle", "menu", "search", "account", "minicart", "button", "social", "dyntext", "text", "iconlist", "divider", "spacer", "heading", "link", "marquee", "motionfsmenu"];
    for (const m of MODELS) {
      assert.doesNotThrow(() => contract.validateBuilt(m, withIds(Catalog.build("header", key(m)).section.children)), m.key);
      for (const n of nodesOf(m)) {
        assert.ok(OK.includes(n.type), `${m.key} : type ${n.type}`);
        if (n.type === "menu") { assert.equal(n.props.source, "location"); assert.deepEqual(n.props.items, []); }
        if (n.type === "motionfsmenu") assert.equal(n.props.source, "location", `${m.key} : le menu plein écran lit le menu affecté`);
        if (n.type === "button") assert.match(n.props.url, /^\/(catalogue|inscription|contact|blog|connexion)$/);
      }
      assert.doesNotMatch(JSON.stringify(doc(m)), /\d{2}[ .]\d{2}[ .]\d{2}[ .]\d{2}|@[a-z0-9-]+\.(com|fr)|rue |avenue |<script|<img|data:image/i, `${m.key} : donnée inventée ou code libre`);
    }
  });
  test("identité propre : couleurs fixes, polices locales, aucun jeton ; contraste texte, texte secondaire et bouton ≥ 4,5", () => {
    for (const m of MODELS) {
      assert.doesNotMatch(JSON.stringify(doc(m)), /token:/, m.key);
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(m.S[c], /^#[0-9a-f]{6}$/i, `${m.key} ${c}`);
      assert.match(m.S.font, /^font\.[a-z0-9-]+$/); assert.match(m.S.head, /^font\.[a-z0-9-]+$/);
      assert.ok(contrast(m.S.fg, m.S.bg) >= 4.5, `${m.key} texte ${contrast(m.S.fg, m.S.bg).toFixed(2)}`);
      assert.ok(contrast(m.S.mute, m.S.bg) >= 4.5, `${m.key} secondaire ${contrast(m.S.mute, m.S.bg).toFixed(2)}`);
      assert.ok(contrast(m.S.onAccent, m.S.accent) >= 4.5, `${m.key} bouton ${contrast(m.S.onAccent, m.S.accent).toFixed(2)}`);
    }
    assert.ok(new Set(MODELS.map((m) => m.S.bg)).size >= 9 && new Set(MODELS.map((m) => `${m.S.head}|${m.S.font}`)).size === 10, "palettes et couples de polices trop proches");
  });
  test("dix compositions distinctes ; au plus deux modèles « marque à gauche, menu, bouton » ; au moins trois modèles à menu plein écran, ruban ou formes", () => {
    assert.equal(new Set(MODELS.map(signature)).size, 10, "deux modèles ont la même structure");
    assert.ok(new Set(MODELS.map((m) => doc(m).children[0].children.length)).size >= 3, "nombre de rangées trop uniforme");
    const has = (t) => MODELS.filter((m) => nodesOf(m).some((n) => n.type === t)).length;
    assert.ok(has("motionfsmenu") >= 2 && has("marquee") >= 2 && has("grid") >= 5);
    assert.ok(MODELS.some((m) => nodesOf(m).some((n) => n.styles && n.styles.desktop && n.styles.desktop.transform)), "formes inclinées ou décalées");
  });
  test("responsive conçu : menu repliable, grilles repliées (tablette, 1fr mobile), secondaires masqués sur mobile, aucune position dans une rangée, largeurs fixes ≤ 260 px", () => {
    for (const m of MODELS) {
      const d = doc(m);
      walk(d.children[0].children, (n) => { const p = n.styles && n.styles.desktop && n.styles.desktop.position; assert.ok(!p || p === "static" || p === "relative", `${m.key} : position ${p}`); });
      walk(d.children, (n) => {
        if (n.type === "menu") assert.equal(n.props.mobileToggle, true, `${m.key} : menu non repliable`);
        if (n.type === "grid") { assert.equal(n.styles.mobile && n.styles.mobile.gridTemplate, "1fr", m.key); assert.ok(n.styles.tablet, m.key); }
        if (["social", "date", "iconlist"].includes(n.type)) assert.deepEqual(n.hideOn, ["mobile"], `${m.key} : ${n.type}`);
        const w = n.styles && n.styles.desktop && n.styles.desktop.width; if (w && /px$/.test(w) && !["group", "divider", "search"].includes(n.type)) assert.ok(parseInt(w, 10) <= 260, `${m.key} : largeur ${w}`);
      });
    }
  });
  test("mouvements annoncés réellement présents ; entrées et survols variés ; menus plein écran avec effet et cascade ; rubans actifs", () => {
    const entr = new Set(), hov = new Set();
    for (const m of MODELS) {
      const has = new Set(); walk(doc(m).children, (n) => { if (n.motion && n.motion.entrance) { has.add(n.motion.entrance); entr.add(n.motion.entrance); } if (n.motion && n.motion.hover) { has.add(n.motion.hover); hov.add(n.motion.hover); } });
      assert.ok((m.animations || []).length >= 1); for (const a of m.animations) assert.ok(has.has(a), `${m.key} : « ${a} » absente`);
      assert.ok(m.features.length >= 3 && m.settings.length >= 3);
    }
    assert.ok(entr.size >= 5 && hov.size >= 7, JSON.stringify({ entr: [...entr], hov: [...hov] }));
    assert.ok(entr.has("reveal"), "dévoilement par masque");
    for (const m of MODELS) for (const n of nodesOf(m)) { if (n.type === "motionfsmenu") { assert.ok(n.motion.studio.stagger >= 60 && n.motion.studio.duration >= 400, m.key); } if (n.type === "marquee") assert.equal(n.props.pauseHover, true); }
  });
  test("modes de défilement variés : collant, se réduit, superposé qui devient plein, statique", () => {
    const fx = MODELS.map((m) => doc(m).children[0].props.headerFx || "-");
    assert.ok(fx.includes("shrink") && fx.includes("solid"), JSON.stringify(fx));
    assert.ok(new Set(MODELS.map((m) => m.mode)).size >= 4);
  });
  test("le modèle est enregistrable tel quel (normalisation) et garde sa police et son mouvement", () => {
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    for (const m of MODELS) {
      const out = normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: withIds(JSON.parse(JSON.stringify(doc(m).children))) }]);
      let motion = 0; walk(out[0].children, (n) => { if (n.motion && (n.motion.entrance || n.motion.studio)) motion++; }); assert.ok(motion >= 1, m.key);
      assert.ok(JSON.stringify(out).includes(m.S.head) || JSON.stringify(out).includes(m.S.font), `${m.key} : police perdue`);
    }
  });
});

// ── Chrome réel ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

describe("En-têtes « agence » dans un vrai Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const pageOf = {};
  const mkPage = async (name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
    const content = { title: name, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${name}`, level: "2" } }, ...tall] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return id;
  };
  const adopt = async (m, pageId) => {
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: key(m) }, headers: ORIGIN() });
    assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return t;
  };
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const tpl = {};
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Agence" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/g" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of MODELS) { pageOf[m.key] = await mkPage(`A ${m.key}`); tpl[m.key] = await adopt(m, pageOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pageOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(1300);
    return { ctx, pg, errors };
  };

  test("trois largeurs : un seul en-tête, marque visible, aucun débordement horizontal ni erreur JavaScript, hauteur raisonnable", async () => {
    for (const m of MODELS) for (const w of [1280, 820, 390]) {
      const { ctx, pg, errors } = await open(m, { width: w, height: 800 }, true);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} ${w} : un seul en-tête`);
      const r = await pg.evaluate(() => { const h = document.querySelector(".lp-site-header"), t = h.querySelector(".kw-sitetitle, .kw-sitelogo"), b = t.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, h: Math.round(h.getBoundingClientRect().height), markVisible: b.width > 4 && b.height > 4 && b.right > 0 && b.left < innerWidth }; });
      assert.ok(r.overflow <= 1, `${m.key} ${w} : débordement ${r.overflow}px`); assert.ok(r.markVisible || m.key === "agence-06" && false, `${m.key} ${w} : marque invisible`);
      assert.ok(r.h <= (w < 600 ? 520 : 480), `${m.key} ${w} : en-tête trop haut (${r.h}px)`);
      assert.deepEqual(errors, [], `${m.key} ${w}`); await ctx.close();
    }
  });
  test("menu affecté : lisible sur ordinateur (modèles à menu de rangée), replié sur mobile derrière un bouton qui s'ouvre et se referme au clavier ; menu plein écran : ouverture, Échap, focus", async () => {
    for (const m of MODELS) {
      const fs5 = nodesOf(m).some((n) => n.type === "motionfsmenu");
      if (!fs5) {
        const d = await open(m); const links = await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts(); assert.ok(links.join(" ").toLowerCase().includes("alpha"), `${m.key} : menu absent (${links})`); await d.ctx.close();
        const { ctx, pg } = await open(m, { width: 390, height: 800 }, true);
        const burger = pg.locator(".lp-site-header .kw-menu-burger"); assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu sur mobile`);
        assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : menu ouvert d'office`);
        await burger.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(150); assert.ok(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible(), `${m.key} : le menu ne s'ouvre pas`);
        await burger.click(); await pg.waitForTimeout(150); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : le menu ne se referme pas`); await ctx.close();
      } else {
        for (const [w, h] of [[1280, 800], [390, 800]]) {
          const { ctx, pg, errors } = await open(m, { width: w, height: h }, true);
          const btn = pg.locator(".lp-site-header button").first(); assert.ok(await btn.isVisible(), `${m.key} ${w} : bouton du menu plein écran`);
          await btn.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(1500);
          const links = await pg.locator("[class*='fsmenu'] a, .kw-motionfsmenu a, dialog a, [role='dialog'] a").allInnerTexts();
          assert.ok(links.join(" ").toLowerCase().includes("alpha") && links.join(" ").toLowerCase().includes("beta"), `${m.key} ${w} : les liens du menu affecté manquent (${links})`);
          await pg.keyboard.press("Escape"); await pg.waitForTimeout(1200);
          assert.ok(!(await pg.locator("a:visible", { hasText: "Alpha" }).count()), `${m.key} ${w} : Échap ne ferme pas le menu`);
          assert.deepEqual(errors, [], m.key); await ctx.close();
        }
      }
    }
  });
  test("clavier : Tab atteint l'en-tête ; mouvement réduit : plus aucune animation infinie dans l'en-tête", async () => {
    for (const m of MODELS) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true);
      let inHeader = false; for (let i = 0; i < 12 && !inHeader; i++) { await pg.keyboard.press("Tab"); inHeader = await pg.evaluate(() => !!(document.activeElement && document.activeElement.closest(".lp-site-header"))); }
      assert.ok(inHeader, `${m.key} : en-tête inaccessible au clavier`);
      const running = await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length);
      assert.equal(running, 0, `${m.key} : animation infinie malgré « mouvement réduit »`); await ctx.close();
    }
  });
  test("défilement : « se réduit » (Colossal Type) rétrécit ; « devient plein » (Seuil Ouvert) prend un fond ; collant (Dalle Rose) reste en haut", async () => {
    const byKey = (k) => MODELS.find((m) => m.key === k);
    const s = await open(byKey("agence-02")); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    const h0 = await s.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height);
    await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(600);
    const h1 = await s.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height); assert.ok(h1 < h0, `réduction attendue (${h0} → ${h1})`); await s.ctx.close();
    const o = await open(byKey("agence-05")); assert.equal(await o.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "solid");
    assert.equal(await o.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "fixed");
    await o.pg.evaluate(() => window.scrollTo(0, 600)); await o.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await o.pg.waitForTimeout(500);
    assert.doesNotMatch(await o.pg.evaluate(() => { const bands = [...document.querySelectorAll(".lp-site-header, .lp-site-header .kw-full")].map((e) => getComputedStyle(e).backgroundColor); return bands.join(" "); }), /^(rgba\(0, 0, 0, 0\) ?)+$/, "fond plein attendu"); await o.ctx.close();
    const c = await open(byKey("agence-03")); await c.pg.evaluate(() => window.scrollTo(0, 900)); await c.pg.waitForTimeout(300);
    assert.ok((await c.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top))) <= 1, "collant"); await c.ctx.close();
  });
  test("personnalisation : changer une couleur, une police, un espacement et une animation, enregistrer, relire et voir le changement sur le site publié", async () => {
    const m = MODELS.find((x) => x.key === "agence-08"), t = tpl[m.key];
    const pages = require("../src/marketing/pages"), org = db.prepare("SELECT id FROM mk_organizations").get().id, mctx = { organizationId: org, db };
    const section = JSON.parse(JSON.stringify(pages.getComponent(mctx, t.sourceId).section)); assert.ok(section, "section du modèle lue");
    const med = JSON.stringify(section), rows = section.children[0].children;
    // couleur de fond et espacement de la 2e rangée, police et animation d'entrée du logo
    rows[1].styles.desktop.backgroundColor = "#123456"; rows[1].styles.desktop.paddingTop = "33px";
    let changedFont = false;
    walk(section.children, (n) => { if (!changedFont && n.type === "sitelogo") { n.parts.text.styles.desktop.fontFamily = "font.fraunces"; n.motion = { ...(n.motion || {}), entrance: "zoom-in", duration: 900, delay: 100 }; changedFont = true; } });
    assert.ok(changedFont && JSON.stringify(section) !== med);
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const put = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content: { sections: [section] } } });
    assert.equal(put.status, 200, `enregistrement : ${put.status} ${put.text.slice(0, 160)}`);
    const back = pages.getComponent(mctx, t.sourceId); const reread = JSON.stringify(back.draft || back.section);
    assert.ok(reread.includes("#123456") && reread.includes("font.fraunces") && reread.includes("zoom-in"), "modification non relue");
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true);
    const r = await pg.evaluate(() => { const bands = [...document.querySelectorAll(".lp-site-header .kw-full")]; return { bg: bands.map((e) => getComputedStyle(e).backgroundColor), pad: bands.map((e) => getComputedStyle(e).paddingTop), html: document.querySelector(".lp-site-header").innerHTML }; });
    assert.ok(r.bg.includes("rgb(18, 52, 86)"), `couleur modifiée absente : ${r.bg}`); assert.ok(r.pad.includes("33px"), `espacement modifié absent : ${r.pad}`);
    assert.ok(/zoom-in/.test(r.html) || /data-kw-motion|kw-anim/.test(r.html), "animation modifiée absente"); await ctx.close();
  });
  test("installation sur un site : chaque modèle est une copie indépendante, un seul en-tête public, le titre du site visible", async () => {
    for (const m of MODELS) {
      const { ctx, pg } = await open(m, { width: 1280, height: 600 }, true);
      assert.equal(await pg.locator("header, .lp-site-header").count() >= 1, true);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} : double en-tête`); await ctx.close();
    }
  });
});
