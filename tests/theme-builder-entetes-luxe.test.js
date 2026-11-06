// En-têtes du secteur « luxe » : contrat, nœuds, identité, contraste, animations annoncées réelles, responsive de conception (unitaire) ;
// puis dans Chrome : trois largeurs sans défaut, menu desktop / mobile, défilement annoncé, modification enregistrée et relue, installation + rendu public sans double en-tête.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const HEADER = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const { withIds } = require("../src/themeBuilder/catalog/kit");

const MODELS = HEADER.MODELS.filter((m) => m.sector === "luxe");
const keyOf = (m) => `${m.key}.${m.key}`;
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n.children) walk(n.children, fn); } };
const nodesOf = (m) => withIds(Catalog.build("header", keyOf(m)).section.children);

describe("En-têtes luxe : contrat et conception (unitaire)", () => {
  test("10 modèles sur mesure luxe-01 à luxe-10, tous valides au contrat, noms et directions distincts", () => {
    assert.equal(MODELS.length, 10); assert.ok(MODELS.every((m) => m.custom), "tous écrits sur mesure");
    assert.deepEqual(MODELS.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `luxe-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(MODELS.map((m) => m.name)).size, 10); assert.equal(new Set(MODELS.map((m) => m.art)).size, 10);
    assert.equal(new Set(MODELS.map((m) => m.S.head + m.S.font)).size, 10, "10 paires de polices distinctes");
    assert.equal(new Set(MODELS.map((m) => m.S.bg + m.S.accent)).size, 10, "10 palettes distinctes");
    for (const m of MODELS) assert.doesNotThrow(() => contract.validateBuilt(m, nodesOf(m)), m.key);
  });
  test("identité fixe : couleurs #rrggbb, polices locales, contraste texte / secondaire / bouton >= 4,5", () => {
    for (const m of MODELS) {
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(m.S[c], /^#[0-9a-f]{6}$/i, `${m.key} ${c}`);
      assert.match(m.S.font, /^font\.[a-z0-9-]+$/); assert.match(m.S.head, /^font\.[a-z0-9-]+$/);
      assert.ok(ratio(m.S.fg, m.S.bg) >= 4.5, `${m.key} texte`); assert.ok(ratio(m.S.mute, m.S.bg) >= 4.5, `${m.key} texte secondaire`); assert.ok(ratio(m.S.onAccent, m.S.accent) >= 4.5, `${m.key} bouton`);
    }
  });
  test("animations annoncées réelles ; mode et entrée valides ; fonctionnalités et réglages renseignés", () => {
    for (const m of MODELS) {
      const nodes = nodesOf(m), seen = new Set(); walk(nodes, (n) => { if (n.motion && n.motion.entrance) seen.add(n.motion.entrance); if (n.motion && n.motion.hover) seen.add(n.motion.hover); });
      assert.ok(m.animations.length >= 1 && m.animations.every((a) => seen.has(a)), `${m.key} : ${m.animations} / ${[...seen]}`);
      assert.ok(m.features.length >= 3 && m.settings.length >= 3, m.key); assert.ok(contract.MODES.includes(m.mode)); assert.ok(contract.ANIMS.includes(m.anim));
    }
  });
  test("règles de composition : pas de position absolue dans une rangée, grilles repliées, éléments masqués sur mobile, menu repliable, largeur fixe <= 260 px, aucune donnée inventée", () => {
    for (const m of MODELS) {
      const nodes = nodesOf(m); let menus = 0, vertical = 0, brandish = 0;
      walk(nodes, (n) => {
        const d = (n.styles && n.styles.desktop) || {};
        if (n.type === "grid") { assert.ok(n.styles.tablet, `${m.key} grille sans tablette`); assert.equal(n.styles.mobile && n.styles.mobile.gridTemplate, "1fr", `${m.key} grille non repliée`); }
        if (["social", "date", "iconlist"].includes(n.type)) assert.deepEqual(n.hideOn, ["mobile"]);
        if (n.type === "menu") { menus++; if (n.props.vertical) vertical++; else assert.equal(n.props.mobileToggle, true, `${m.key} menu non repliable`); assert.equal(n.props.source, "location"); }
        if (n.type === "sitetitle" || n.type === "sitelogo") brandish++;
        if (d.width && /px$/.test(d.width) && !["search", "group", "divider", "grid", "container"].includes(n.type)) assert.ok(parseInt(d.width) <= 260);
        if (n.type === "grid" && /px/.test(d.gridTemplate || "")) assert.ok(parseInt(/(\d+)px/.exec(d.gridTemplate)[1]) <= 260, `${m.key} colonne fixe`);
        assert.ok(!(d.position === "absolute" && n.type !== "container"), `${m.key} position absolue`);
        if (n.type === "button") assert.match(n.props.url, /^\/(catalogue|inscription|contact|blog|connexion)$/);
      });
      assert.ok(menus >= 1 && brandish >= 1, m.key);
      assert.ok(menus - vertical >= 1 || m.key === "luxe-04", `${m.key} : au moins un menu repliable`);
      const json = JSON.stringify(nodes); assert.ok(!/<script|<img|<iframe|onclick/i.test(json), m.key);
    }
  });
  test("silhouettes : signatures de composition distinctes (rangées, grilles, éléments)", () => {
    const sig = (m) => { const parts = []; walk(nodesOf(m), (n) => { if (["grid", "marquee", "menu"].includes(n.type) || (n.type === "container" && n.props && n.props.full)) parts.push(n.type + (n.type === "grid" ? (n.styles.desktop.gridTemplate || "") : "") + (n.props && n.props.vertical ? "v" : "")); }); const cnt = {}; walk(nodesOf(m), (n) => { cnt[n.type] = (cnt[n.type] || 0) + 1; }); return parts.join(">") + JSON.stringify(cnt); };
    assert.equal(new Set(MODELS.map(sig)).size, 10, JSON.stringify(MODELS.map(sig)));
  });
  test("catalogue : exposé dans la bibliothèque (type header, famille luxe), clé de modèle conservée", () => {
    const e = Catalog.entries("header").filter((x) => x.key.startsWith("luxe-")); assert.equal(e.length, 10);
    assert.ok(fs.existsSync(`${__dirname}/../docs/theme-builder/headers-secteurs/luxe.md`));
  });
});

// ── Chrome réel ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

describe("En-têtes luxe dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, org, A, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const pagesOf = {};
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
    const u = await boss.request(U(site, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() });
    assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié luxe" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  const inspect = () => {
    const defects = [], vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) defects.push(`défilement horizontal (${document.documentElement.scrollWidth} > ${vw})`);
    const root = document.querySelector(".kw-theme-header") || document.body;
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    for (const e of root.querySelectorAll("*")) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.right > vw + 2) { defects.push(`dépasse à droite : ${e.tagName.toLowerCase()}`); break; } }
    for (const e of root.querySelectorAll("*")) {
      const d = getComputedStyle(e).display; if (!(d.includes("grid") || d.includes("flex")) || e.children.length < 2) continue;
      const kids = [...e.children].filter(vis).map((c) => c.getBoundingClientRect()).filter((r) => r.height > 4 && r.width > 4);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i], b = kids[j]; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 6 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 6) { defects.push(`chevauchement dans ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); i = kids.length; break; } }
    }
    const mark = root.querySelector(".kw-sitetitle, .kw-sitelogo"); if (!mark || !vis(mark)) defects.push("marque invisible");
    return defects;
  };

  test("trois largeurs (1280 / 820 / 390) : aucun défaut (débordement, chevauchement, marque invisible), menu mobile qui s'ouvre et se referme", async () => {
    const bad = [];
    for (const [w, h] of [[1280, 900], [820, 1000], [390, 800]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
      await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
      const page = await ctx.newPage();
      for (const m of MODELS) {
        await page.goto(`${srv.base}${U(A, `/api/bibliotheque/header/${keyOf(m)}/apercu`)}`, { waitUntil: "load" });
        await page.evaluate(async () => { await document.fonts.ready; }); await page.waitForTimeout(150);
        const d = await page.evaluate(inspect); if (d.length) bad.push(`${m.key} @${w} : ${[...new Set(d)].slice(0, 3).join(" ; ")}`);
      }
      await ctx.close();
    }
    assert.deepEqual(bad, []);
  });

  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    if (!pagesOf[m.key]) { pagesOf[m.key] = await mkPage(`P ${m.key}`); pagesOf[m.key + ":t"] = await adopt(keyOf(m), pagesOf[m.key]); }
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready);
    return { ctx, pg, errors };
  };

  test("site publié : un seul en-tête par modèle, menu affecté visible sur ordinateur, menu mobile ouvert / fermé, aucune erreur JavaScript", async () => {
    for (const m of MODELS) {
      const d = await open(m);
      assert.equal(await d.pg.locator(".lp-site-header").count(), 1, `${m.key} : un seul en-tête`);
      const links = (await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").toLowerCase(); assert.ok(links.includes("alpha"), `${m.key} : menu affecté absent`);
      assert.deepEqual(d.errors, [], m.key); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 });
      const burger = pg.locator(".lp-site-header .kw-menu-burger").first();
      if (m.key === "luxe-04") { /* navigation verticale masquée sur mobile : la version repliable prend le relais */ }
      assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu sur mobile`);
      const list = pg.locator(".lp-site-header .kw-menu-list:visible").first();
      await burger.click(); await pg.waitForTimeout(120); assert.equal(await burger.getAttribute("aria-expanded"), "true", `${m.key} : le menu ne s'ouvre pas`);
      assert.ok(await list.isVisible(), `${m.key} : liste invisible après ouverture`);
      await burger.click(); await pg.waitForTimeout(120); assert.equal(await burger.getAttribute("aria-expanded"), "false", `${m.key} : le menu ne se referme pas`);
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${m.key} : débordement horizontal mobile`); await ctx.close();
    }
  });

  test("identité propre : police de titre et couleur de fond du modèle (jamais ceux du site)", async () => {
    const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    for (const m of MODELS) {
      const { ctx, pg } = await open(m);
      const r = await pg.evaluate(() => { const t = document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitetitle"); return { font: t ? getComputedStyle(t).fontFamily : "", bgs: [...document.querySelectorAll(".lp-site-header *")].map((e) => getComputedStyle(e).backgroundColor) }; });
      const head = m.S.head.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      assert.ok(r.font.toLowerCase().includes(head.toLowerCase().replace(/ /g, "")) || r.font.toLowerCase().includes(head.toLowerCase()), `${m.key} : « ${r.font} » au lieu de « ${head} »`);
      if (m.mode !== "overlay") assert.ok(r.bgs.some((c) => [rgb(m.S.bg), rgb(m.S.accent), rgb(m.S.alt)].includes(c)), `${m.key} : fond du modèle absent`);
      await ctx.close();
    }
  });

  test("défilement annoncé : luxe-02 se cache et revient ; luxe-03 collant ; luxe-08 et luxe-10 se réduisent ; luxe-09 superposé", async () => {
    const byKey = (k) => MODELS.find((m) => m.key === k);
    const a = await open(byKey("luxe-02")); assert.equal(await a.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
    const bottom = () => a.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom));
    await a.pg.evaluate(() => window.scrollTo(0, 800)); await a.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden")); await a.pg.waitForTimeout(450);
    assert.ok((await bottom()) <= 0, "masqué en descendant");
    await a.pg.evaluate(() => window.scrollTo(0, 500)); await a.pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await a.pg.waitForTimeout(450);
    assert.ok((await bottom()) > 20, "revient en remontant"); await a.ctx.close();
    for (const k of ["luxe-03", "luxe-06"]) { const s = await open(byKey(k)); await s.pg.evaluate(() => window.scrollTo(0, 900)); await s.pg.waitForTimeout(300); assert.ok((await s.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top))) <= 1, `${k} collant`); await s.ctx.close(); }
    for (const k of ["luxe-08", "luxe-10"]) {
      const s = await open(byKey(k)); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
      const pad = () => s.pg.evaluate(() => [...document.querySelectorAll(".lp-site-header .kw-full .kw-full")].reduce((t, e) => t + parseFloat(getComputedStyle(e).paddingTop), 0));
      const before = await pad(); await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(350);
      assert.ok((await pad()) < before, `${k} se réduit`); await s.ctx.close();
    }
    const o = await open(byKey("luxe-09")); assert.equal(await o.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "solid"); assert.equal(await o.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "fixed"); await o.ctx.close();
  });

  test("mouvement réduit : aucune animation infinie dans l'en-tête ; clavier : Tab atteint l'en-tête", async () => {
    for (const m of MODELS.slice(0, 4)) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true);
      let inHeader = false; for (let i = 0; i < 14 && !inHeader; i++) { await pg.keyboard.press("Tab"); inHeader = await pg.evaluate(() => !!(document.activeElement && document.activeElement.closest(".lp-site-header"))); }
      assert.ok(inHeader, `${m.key} : en-tête non atteignable au clavier`); await pg.waitForTimeout(600);
      assert.equal(await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((x) => x.playState === "running" && x.effect && x.effect.getTiming().iterations === Infinity).length), 0, m.key);
      await ctx.close();
    }
  });

  test("modification réelle enregistrée puis relue : couleur, police, espacement et animation d'un en-tête installé, rendus sur la page publiée", async () => {
    const m = MODELS.find((x) => x.key === "luxe-01"); const { ctx: c0 } = await open(m); await c0.close();
    const t = pagesOf[m.key + ":t"], pid = pagesOf[m.key];
    const comp = db.prepare("SELECT id, revision, COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(t.template ? t.template.sourceId : t.sourceId);
    const edited = JSON.parse(comp.s); let n = 0;
    walk([edited], (x) => {
      if (x.type === "container" && x.props && x.props.full && x.styles && x.styles.desktop && x.styles.desktop.backgroundColor === m.S.bg && n === 0) { x.styles.desktop.backgroundColor = "#123456"; x.styles.desktop.paddingTop = "41px"; n++; }
      if (x.type === "sitetitle") { x.parts.link.styles.desktop.fontFamily = "font.lora"; x.styles.desktop.fontFamily = "font.lora"; x.motion = { ...(x.motion || {}), entrance: "zoom-in", duration: 900, delay: 0 }; }
    });
    assert.equal(n, 1, "rangée trouvée");
    const save = await boss.request(`/marketing/site-web/composants/${comp.id}/brouillon`, { method: "PUT", json: { revision: comp.revision, content: { sections: [edited] } }, headers: ORIGIN() });
    assert.equal(save.status, 200, save.text.slice(0, 200));
    // relecture : le brouillon enregistré porte les quatre modifications
    const back = JSON.parse(db.prepare("SELECT COALESCE(draft, section) s FROM mk_web_components WHERE id = ?").get(comp.id).s); let ok = { bg: false, font: false, anim: false }; walk([back], (x) => { if (x.type === "container" && x.styles && x.styles.desktop && x.styles.desktop.backgroundColor === "#123456" && x.styles.desktop.paddingTop === "41px") ok.bg = true; if (x.type === "sitetitle") { ok.font = x.styles.desktop.fontFamily === "font.lora"; ok.anim = x.motion.entrance === "zoom-in"; } });
    assert.deepEqual(ok, { bg: true, font: true, anim: true });
    const pub = await boss.request(U(site, `/api/modeles/${t.template ? t.template.id : t.id}/publier`), { method: "POST", json: { replace: true }, headers: ORIGIN() }); assert.equal(pub.status, 200, pub.text.slice(0, 200));
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 700 }, reducedMotion: "reduce" }); const pg = await ctx.newPage();
    await pg.goto(`${srv.base}/p/${slug(pid)}`, { waitUntil: "load" });
    const r = await pg.evaluate(() => { const b = document.querySelector(".lp-site-header .kw-full .kw-full"); return { bg: getComputedStyle(b).backgroundColor, pad: getComputedStyle(b).paddingTop, font: getComputedStyle(document.querySelector(".lp-site-header .kw-sitetitle")).fontFamily }; });
    assert.equal(r.bg, "rgb(18, 52, 86)"); assert.equal(r.pad, "41px"); assert.ok(/lora/i.test(r.font), r.font); await ctx.close();
  });
});
