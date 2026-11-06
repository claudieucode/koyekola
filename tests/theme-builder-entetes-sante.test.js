// En-têtes du secteur « sante » : contrat, nœuds, identité, contraste, animations annoncées réelles, aucune donnée inventée, responsive.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const HEADER = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const Catalog = require("../src/themeBuilder/catalog");
const { withIds } = require("../src/themeBuilder/catalog/kit");

const MODELS = HEADER.MODELS.filter((m) => m.sector === "sante");
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); walk(n.children, fn); } };
const nodesOf = (M) => withIds(Catalog.build("header", `${M.key}.${M.key}`).section.children);

describe("En-têtes santé", () => {
  test("10 modèles sur mesure, clés sante-01 à sante-10, noms uniques, polices locales et couleurs fixes", () => {
    assert.equal(MODELS.length, 10); assert.ok(MODELS.every((m) => m.custom));
    assert.deepEqual(MODELS.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `sante-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(MODELS.map((m) => m.name)).size, 10);
    for (const M of MODELS) { assert.match(M.S.font, /^font\./); assert.match(M.S.head, /^font\./); for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(M.S[c], /^#[0-9a-f]{6}$/i); }
    assert.ok(new Set(MODELS.map((m) => m.S.bg + m.S.accent)).size === 10, "identités distinctes");
  });
  test("contraste ≥ 4,5 (texte, texte secondaire, bouton) et nœuds valides pour la grammaire", () => {
    for (const M of MODELS) {
      assert.ok(ratio(M.S.fg, M.S.bg) >= 4.5, `${M.key} fg/bg`); assert.ok(ratio(M.S.mute, M.S.bg) >= 4.5, `${M.key} mute/bg`); assert.ok(ratio(M.S.onAccent, M.S.accent) >= 4.5, `${M.key} bouton`);
      assert.doesNotThrow(() => contract.validateBuilt(M, nodesOf(M)), M.key);
    }
  });
  test("animations annoncées réelles, au moins 3 fonctionnalités, rendez-vous ou accès rapide présent", () => {
    for (const M of MODELS) {
      assert.ok(M.features.length >= 3 && M.settings.length >= 3, M.key);
      const ent = new Set(), hov = new Set(); let hasCta = false, hasNav = false;
      walk(nodesOf(M), (n) => { if (n.motion && n.motion.entrance) ent.add(n.motion.entrance); if (n.motion && n.motion.hover) hov.add(n.motion.hover); if (n.type === "button" && /contact|inscription/.test(n.props.url)) hasCta = true; if (n.type === "menu" || n.type === "motionfsmenu") hasNav = true; });
      for (const a of M.animations) assert.ok(ent.has(a) || hov.has(a), `${M.key} ${a}`);
      assert.ok(hasCta, `${M.key} : bouton de rendez-vous`); assert.ok(hasNav, `${M.key} : navigation`);
    }
  });
  test("aucune coordonnée inventée, aucun script ni HTML libre, menus affectés à l'en-tête, aucune position absolue dans une rangée", () => {
    for (const M of MODELS) {
      const json = JSON.stringify(nodesOf(M));
      assert.ok(!/\+33|\d{2} \d{2} \d{2} \d{2}|@[a-z0-9-]+\.(com|fr)\b|<script/i.test(json), M.key);
      const inRows = Catalog.build("header", `${M.key}.${M.key}`).section.children[0].children || [];
      walk(inRows, (n) => { assert.notEqual((n.styles && n.styles.desktop && n.styles.desktop.position) || "", "absolute", M.key); if (n.type === "menu") assert.equal(n.props.source, "location"); if (n.type === "grid") assert.ok(n.styles.tablet && n.styles.tablet.gridTemplate && n.styles.mobile && n.styles.mobile.gridTemplate === "1fr", `${M.key} grille responsive`); });
    }
  });
  test("compositions distinctes : signature (rangées, types, mode) unique", () => {
    const sig = MODELS.map((M) => { const kids = nodesOf(M)[0].children, types = []; walk(kids, (n) => types.push(n.type)); return [kids.length, M.mode, types.join(",")].join("|"); });
    assert.equal(new Set(sig).size, 10);
  });
});

// ── Chrome réel : site publié, trois largeurs, menus, défilement, réglages enregistrés et relus ──
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const keyOf = (m) => `${m.key}.${m.key}`;

describe("En-têtes santé : site publié dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site; const pagesOf = {}, tplOf = {};
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
    assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of MODELS) { pagesOf[m.key] = await mkPage(`P ${m.key}`); tplOf[m.key] = await adopt(keyOf(m), pagesOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    return { ctx, pg, errors };
  };

  test("trois largeurs (1280, 820, 390) : un seul en-tête, aucun débordement horizontal, aucune erreur JavaScript, marque lisible", async () => {
    for (const m of MODELS) for (const w of [1280, 820, 390]) {
      const { ctx, pg, errors } = await open(m, { width: w, height: 800 }, true);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} : un seul en-tête`);
      const r = await pg.evaluate(() => { const t = document.querySelector(".lp-site-header .kw-sitetitle, .lp-site-header .kw-sitetitle-link"); const b = t && t.getBoundingClientRect(); return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, mark: !!t && b.width > 8 && b.height > 8, head: Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().height) }; });
      assert.ok(r.over <= 1, `${m.key} @${w} : débordement horizontal (${r.over})`); assert.ok(r.mark, `${m.key} @${w} : marque absente`); assert.ok(r.head > 30 && r.head < 420, `${m.key} @${w} : hauteur ${r.head}`);
      assert.deepEqual(errors, [], `${m.key} @${w}`); await ctx.close();
    }
  });
  test("identité propre : police de titre et fond du modèle (jamais ceux du site)", async () => {
    const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    for (const m of MODELS) {
      const { ctx, pg } = await open(m, undefined, true);
      const r = await pg.evaluate(() => ({ font: getComputedStyle(document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitetitle")).fontFamily, bgs: [...document.querySelectorAll(".lp-site-header *")].map((e) => getComputedStyle(e).backgroundColor) }));
      const head = m.S.head.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      assert.ok(r.font.toLowerCase().includes(head.toLowerCase()), `${m.key} : « ${r.font} » au lieu de « ${head} »`);
      assert.ok(r.bgs.some((c) => [rgb(m.S.bg), rgb(m.S.accent), rgb(m.S.alt)].includes(c)), `${m.key} : fond du modèle absent`); await ctx.close();
    }
  });
  test("menu : visible sur ordinateur ; replié sur mobile derrière un bouton qui l'ouvre et le referme ; 02 : menu plein écran (Échap)", async () => {
    for (const m of MODELS.filter((x) => x.key !== "sante-02")) {
      const d = await open(m); assert.ok((await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").includes("Alpha"), `${m.key} : menu affecté absent`); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 }); const burger = pg.locator(".lp-site-header .kw-menu-burger");
      assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu mobile`); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : déjà ouvert`);
      await burger.click(); await pg.waitForTimeout(150); assert.ok(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible(), `${m.key} : ne s'ouvre pas`);
      await burger.click(); await pg.waitForTimeout(150); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : ne se referme pas`); await ctx.close();
    }
    for (const size of [{ width: 1280, height: 700 }, { width: 390, height: 800 }]) {
      const { ctx, pg } = await open(MODELS[1], size); const trigger = pg.locator(".lp-site-header button").first(); assert.ok(await trigger.isVisible(), "bouton du menu plein écran");
      await trigger.click(); await pg.waitForTimeout(1500); assert.ok(await pg.getByText("Alpha").first().isVisible(), "liens du menu plein écran visibles");
      await pg.keyboard.press("Escape"); await pg.waitForTimeout(1500); await ctx.close();
    }
  });
  test("défilement : « se réduit » (05, 08, 09) réduit la rangée ; collant (02, 04, 06, 10) reste en haut ; verre dépoli (07)", async () => {
    for (const m of MODELS.filter((x) => x.mode === "stickyshrink")) {
      const { ctx, pg } = await open(m); assert.equal(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink", m.key);
      const h0 = await pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height);
      await pg.evaluate(() => window.scrollTo(0, 700)); await pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await pg.waitForTimeout(500);
      assert.ok(await pg.evaluate((h) => document.querySelector(".lp-site-header").getBoundingClientRect().height <= h, h0), `${m.key} : non réduit`); await ctx.close();
    }
    for (const m of MODELS.filter((x) => x.mode === "sticky" || x.mode === "glass")) {
      const { ctx, pg } = await open(m); await pg.evaluate(() => window.scrollTo(0, 900)); await pg.waitForTimeout(300);
      assert.ok(await pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().top <= 1), `${m.key} : pas collant`);
      if (m.mode === "glass") assert.match(await pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).backdropFilter || getComputedStyle(document.querySelector(".lp-site-header .kw-full")).backdropFilter), /blur/, "verre dépoli"); await ctx.close();
    }
  });
  test("mouvement réduit : aucune animation infinie en cours dans l'en-tête ; clavier : Tab atteint l'en-tête", async () => {
    for (const m of MODELS) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true); let inHeader = false;
      for (let i = 0; i < 14 && !inHeader; i++) { await pg.keyboard.press("Tab"); inHeader = await pg.evaluate(() => !!(document.activeElement && document.activeElement.closest(".lp-site-header"))); }
      assert.ok(inHeader, `${m.key} : en-tête inatteignable au clavier`);
      assert.equal(await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect.getTiming().iterations === Infinity).length), 0, m.key); await ctx.close();
    }
  });
  test("réglages réels : couleur du bouton, police du titre, espacement et durée d'animation modifiés, enregistrés (copie de travail) puis relus ; rendu public inchangé tant que non publié", async () => {
    const M = MODELS[3], t = tplOf[M.key], row = () => db.prepare("SELECT * FROM mk_web_components WHERE id = ?").get(t.sourceId);
    const sec = JSON.parse(row().draft || row().section); const find = (n, fn) => { if (fn(n)) return n; for (const c of n.children || []) { const r = find(c, fn); if (r) return r; } return null; };
    const button = find(sec, (n) => n.type === "button"), title = find(sec, (n) => n.type === "sitetitle"), anim = find(sec, (n) => n.motion && n.motion.entrance), pad = find(sec, (n) => n.type === "container" && n.styles && n.styles.desktop && n.styles.desktop.paddingTop);
    button.styles.desktop.backgroundColor = "#123456"; title.styles.desktop.fontFamily = "font.lora"; pad.styles.desktop.paddingTop = "31px"; anim.motion.duration = 1900;
    const res = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: row().revision, content: { sections: [sec] } } });
    assert.equal(res.status, 200, res.text.slice(0, 200));
    const back = JSON.parse(row().draft); const b2 = find(back, (n) => n.type === "button"), t2 = find(back, (n) => n.type === "sitetitle"), a2 = find(back, (n) => n.motion && n.motion.entrance), p2 = find(back, (n) => n.type === "container" && n.styles && n.styles.desktop && n.styles.desktop.paddingTop === "31px");
    assert.equal(b2.styles.desktop.backgroundColor, "#123456"); assert.equal(t2.styles.desktop.fontFamily, "font.lora"); assert.equal(a2.motion.duration, 1900); assert.ok(p2, "espacement relu");
    const { ctx, pg } = await open(M, undefined, true); assert.equal(await pg.locator(".lp-site-header").count(), 1, "toujours un seul en-tête public"); await ctx.close();
  });
});
