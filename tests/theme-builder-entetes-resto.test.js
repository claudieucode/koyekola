// En-têtes du secteur « resto » (10 modèles sur mesure). Partie 1 : unitaire (contrat, nœuds, identité, contraste, animations annoncées réelles, composition distincte,
// aucune donnée inventée, modification + sauvegarde + relecture). Partie 2 : vrai Chrome (3 largeurs sans défaut, menu bureau et mobile, défilement annoncé, installation dans un site,
// rendu public sans double en-tête). Matrice : docs/theme-builder/headers-secteurs/resto.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");
const { MODELS } = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const { withIds } = require("../src/themeBuilder/catalog/kit");
const { startServer, loginInstructor } = require("./helpers");

const RESTO = MODELS.filter((m) => m.sector === "resto");
const keyOf = (m) => `${m.key}.${m.key}`;
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const doc = (m) => Catalog.build("header", keyOf(m)).section;
const nodesOf = (m) => { const out = []; walk(doc(m).children, (n) => out.push(n)); return out; };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Signature de composition : structure (types imbriqués) + nombre de rangées, sans styles
const shape = (n) => `${n.type}${n.children ? `(${n.children.map(shape).join(",")})` : ""}`;

describe("En-têtes resto : contrat et identité", () => {
  test("10 modèles sur mesure (clés resto-01 à resto-10), noms et direction artistique distincts, chacun sa propre architecture", () => {
    assert.equal(RESTO.length, 10);
    assert.deepEqual(RESTO.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `resto-${String(i + 1).padStart(2, "0")}`));
    assert.ok(RESTO.every((m) => m.custom), "tous les modèles du secteur sont sur mesure");
    assert.equal(new Set(RESTO.map((m) => m.name)).size, 10); assert.equal(new Set(RESTO.map((m) => m.art)).size, 10);
    assert.equal(new Set(RESTO.map((m) => m.arch)).size, 10, "une architecture par modèle");
    assert.equal(new Set(RESTO.map((m) => `${m.S.head}|${m.S.font}`)).size, 10, "dix couples de polices");
    assert.equal(new Set(RESTO.map((m) => `${m.S.bg}|${m.S.accent}`)).size, 10, "dix palettes");
  });
  test("identité : couleurs fixes, polices locales, contraste ≥ 4,5 (texte, texte secondaire, bouton)", () => {
    for (const m of RESTO) {
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(m.S[c], /^#[0-9a-f]{6}$/i, `${m.key} ${c}`);
      assert.match(m.S.font, /^font\.[a-z0-9-]+$/); assert.match(m.S.head, /^font\.[a-z0-9-]+$/);
      assert.ok(contrast(m.S.fg, m.S.bg) >= 4.5, `${m.key} texte`); assert.ok(contrast(m.S.mute, m.S.bg) >= 4.5, `${m.key} secondaire`); assert.ok(contrast(m.S.onAccent, m.S.accent) >= 4.5, `${m.key} bouton`);
      assert.ok(!/token:/.test(JSON.stringify(doc(m))), `${m.key} : jeton du site`);
    }
  });
  test("les polices d'un modèle existent dans la bibliothèque locale", () => {
    const dir = require("path").join(__dirname, "..", "public", "fonts", "library");
    for (const m of RESTO) for (const f of [m.S.head, m.S.font]) assert.ok(fs.existsSync(require("path").join(dir, f.replace(/^font\./, ""))), `${m.key} : police ${f} absente`);
  });
});

describe("En-têtes resto : nœuds, animations, composition", () => {
  test("nœuds acceptés par la grammaire, animations annoncées présentes, features / réglages renseignés", () => {
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    for (const m of RESTO) {
      assert.doesNotThrow(() => normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: doc(m).children }]), m.key);
      assert.doesNotThrow(() => contract.validateBuilt(m, withIds(Catalog.build("header", keyOf(m)).section.children)), m.key);
      assert.ok(m.features.length >= 3 && m.settings.length >= 4 && m.animations.length >= 1, m.key);
      const entr = new Set(), hov = new Set(); walk(doc(m).children, (n) => { if (n.motion && n.motion.entrance) entr.add(n.motion.entrance); if (n.motion && n.motion.hover) hov.add(n.motion.hover); });
      for (const a of m.animations) assert.ok(entr.has(a) || hov.has(a), `${m.key} : animation « ${a} » annoncée mais absente`);
      assert.ok(entr.size >= 1 && (hov.size >= 1 || !m.hover), `${m.key} : mouvements`);
    }
  });
  test("éléments natifs, menus = menu affecté, boutons vers une page connue, bouton Réserver présent, aucune donnée inventée, aucun média", () => {
    for (const m of RESTO) {
      const ns = nodesOf(m);
      for (const n of ns) {
        assert.ok(!["image", "video", "html", "gallery", "carousel"].includes(n.type), `${m.key} : ${n.type}`);
        if (n.type === "menu") { assert.equal(n.props.source, "location"); assert.deepEqual(n.props.items, []); }
        if (n.type === "button") assert.match(n.props.url, /^\/(catalogue|inscription|contact|blog|connexion)$/);
      }
      assert.ok(ns.some((n) => n.type === "button" && /Réserver/.test(n.props.label)), `${m.key} : pas de bouton Réserver`);
      assert.ok(ns.some((n) => n.type === "menu" || n.type === "motionfsmenu"), `${m.key} : pas de navigation`);
      assert.doesNotMatch(JSON.stringify(doc(m)), /\d{2}[ .]\d{2}[ .]\d{2}[ .]\d{2}|@[a-z0-9-]+\.(com|fr)|\brue |avenue |\+\d{2}/i, `${m.key} : coordonnée inventée`);
    }
  });
  test("responsive : pas de position dans une rangée ; menu replié sur mobile (sauf liste verticale doublée par un menu replié) ; grilles repliées ; secondaires masqués sur mobile", () => {
    for (const m of RESTO) {
      const d = doc(m), first = d.children[0];
      walk(first.children, (n) => { const p = n.styles && n.styles.desktop && n.styles.desktop.position; assert.ok(!p || p === "static" || p === "relative", `${m.key} : position ${p}`); });
      let toggles = 0;
      walk(d.children, (n) => {
        if (n.type === "menu" && !n.props.vertical) { assert.equal(n.props.mobileToggle, true, `${m.key} : menu non repliable`); toggles++; }
        if (n.type === "grid") { assert.equal(n.styles.mobile.gridTemplate, "1fr"); assert.ok(n.styles.tablet); }
        if (["social", "date", "iconlist"].includes(n.type)) assert.deepEqual(n.hideOn && n.hideOn.includes("mobile"), true, `${m.key} : ${n.type} visible sur mobile`);
        const w = n.styles && n.styles.desktop && n.styles.desktop.width; if (n.type !== "search" && w && /px$/.test(w) && !["group", "divider", "stack"].includes(n.type)) assert.ok(parseInt(w) <= 260, `${m.key} : largeur ${w}`);
      });
      if (m.key === "resto-06") { let vertical = 0; walk(d.children, (n) => { if (n.type === "menu" && n.props.vertical) vertical++; }); assert.equal(vertical, 1); assert.equal(toggles, 1, "carte verticale remplacée par un menu replié sur mobile"); } else assert.ok(toggles >= 1 || nodesOf(m).some((n) => n.type === "motionfsmenu"), m.key);
    }
  });
  test("compositions réellement différentes : dix signatures de structure distinctes, nombre de rangées et familles de navigation variés", () => {
    const sig = RESTO.map((m) => shape({ type: "root", children: doc(m).children })); assert.equal(new Set(sig).size, 10);
    const rows = RESTO.map((m) => doc(m).children[0].children.length); assert.ok(new Set(rows).size >= 2, "au moins deux nombres de rangées différents");
    const navs = RESTO.map((m) => { const n = nodesOf(m).find((x) => x.type === "menu" || x.type === "motionfsmenu"); return n.type === "motionfsmenu" ? "fsmenu" : `${n.props.vertical ? "v" : "h"}|${JSON.stringify(n.parts.link.styles.desktop.borderStyle || "")}|${JSON.stringify(n.parts.link.states && Object.keys(n.parts.link.states.hover || {}).join())}`; });
    assert.ok(new Set(navs).size >= 6, `navigations trop proches : ${navs}`);
    const modes = new Set(RESTO.map((m) => m.mode)); for (const x of ["sticky", "stickyshrink", "stickyhide", "overlaysolid", "static"]) assert.ok(modes.has(x), x);
    const ex = (f) => RESTO.some((m) => nodesOf(m).some(f));
    assert.ok(ex((n) => n.type === "marquee") && ex((n) => n.type === "motionfsmenu") && ex((n) => n.styles && n.styles.desktop && n.styles.desktop.transform) && ex((n) => n.styles && n.styles.desktop && n.styles.desktop.fontSize && /^fluid:/.test(n.styles.desktop.fontSize)), "briques variées (ticker, menu plein écran, inclinaison, titre fluide)");
  });
  test("les 10 mouvements d'entrée / survol utilisés existent dans l'éditeur (réglables, désactivables)", () => {
    const entr = new Set(), hov = new Set(); for (const m of RESTO) walk(doc(m).children, (n) => { if (n.motion && n.motion.entrance) entr.add(n.motion.entrance); if (n.motion && n.motion.hover) hov.add(n.motion.hover); });
    assert.ok(entr.size >= 5, [...entr].join()); assert.ok(hov.size >= 6, [...hov].join());
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    const out = normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: doc(RESTO[0]).children }]); let seen = 0; walk(out[0].children, (n) => { if (n.motion && n.motion.entrance) { seen++; assert.ok(n.motion.duration >= 100); } }); assert.ok(seen >= 2);
  });
});

describe("En-têtes resto : utilisation, modification, sauvegarde, relecture", () => {
  const { A } = freshMarketing(); const s1 = pages.createSite(A, { name: "Resto" });
  test("« Utiliser » copie le modèle ; une couleur, une police, un espacement et une animation modifiés sont enregistrés puis relus", () => {
    for (const m of [RESTO[0], RESTO[3], RESTO[8]]) {
      const t = useTemplate(A, s1.id, "header", keyOf(m)); const comp = pages.getComponent(A, t.sourceId);
      const before = JSON.stringify(Catalog.build("header", keyOf(m)));
      const section = JSON.parse(JSON.stringify(comp.section)); const band = section.children[0].children[0], inn = band.children[0];
      band.styles.desktop.backgroundColor = "#123456"; band.styles.desktop.paddingTop = "31px";
      let title; walk(section.children, (n) => { if (!title && n.type === "sitetitle") title = n; }); title.styles.desktop.fontFamily = "font.lora"; title.motion = { entrance: "zoom-in", duration: 900, delay: 50 };
      pages.saveComponentDraft(A, t.sourceId, section); pages.publishComponent(A, t.sourceId);
      const back = pages.getComponent(A, t.sourceId).section; let t2; walk(back.children, (n) => { if (!t2 && n.type === "sitetitle") t2 = n; });
      assert.equal(back.children[0].children[0].styles.desktop.backgroundColor, "#123456", m.key); assert.equal(back.children[0].children[0].styles.desktop.paddingTop, "31px");
      assert.equal(t2.styles.desktop.fontFamily, "font.lora"); assert.equal(t2.motion.entrance, "zoom-in"); assert.equal(t2.motion.duration, 900); assert.ok(inn);
      assert.equal(JSON.stringify(Catalog.build("header", keyOf(m))), before, "catalogue intact");
    }
  });
});

// ── Chrome ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const WIDTHS = [["ordinateur", 1280, 900], ["tablette", 820, 1000], ["mobile", 390, 800]];

describe("En-têtes resto : Chrome (trois largeurs, menus, défilement, site publié)", { skip: SKIP }, () => {
  let srv, boss, db, org, A, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  const inspect = () => {
    const defects = [], vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) defects.push(`défilement horizontal (${document.documentElement.scrollWidth} > ${vw})`);
    const root = document.querySelector(".kw-theme-header") || document.body;
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    for (const e of root.querySelectorAll("*")) { if (!vis(e) || e.closest(".kw-marquee")) continue; const r = e.getBoundingClientRect(); if (r.right > vw + 2 && getComputedStyle(e).position !== "fixed") { defects.push(`dépasse à droite : ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} (${Math.round(r.right)} > ${vw})`); break; } }
    for (const e of root.querySelectorAll("*")) {
      const d = getComputedStyle(e).display; if (!(d.includes("grid") || d.includes("flex")) || e.children.length < 2) continue;
      const kids = [...e.children].filter(vis).map((c) => c.getBoundingClientRect()).filter((r) => r.height > 4 && r.width > 4);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i], b = kids[j]; const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ox > 6 && oy > 6) { defects.push(`chevauchement dans ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); i = kids.length; break; } }
      if (defects.length > 5) break;
    }
    for (const e of root.querySelectorAll("p,a,button,li,span")) { if (!vis(e)) continue; const cs = getComputedStyle(e); if ((cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && e.scrollWidth > e.clientWidth + 2) { defects.push(`texte coupé : « ${e.textContent.trim().slice(0, 30)} »`); break; } }
    const mark = root.querySelector(".kw-sitetitle, .kw-sitelogo"); if (!mark || !vis(mark)) defects.push("marque invisible");
    const reserve = [...root.querySelectorAll("a,button")].find((b) => /Réserver/.test(b.textContent) && vis(b)); if (!reserve) defects.push("bouton Réserver invisible");
    const hh = root.getBoundingClientRect().height; if (hh > (vw < 600 ? 520 : 460)) defects.push(`en-tête trop haut (${Math.round(hh)} px)`);
    return defects;
  };

  test("aucun défaut visible aux trois largeurs (débordement, chevauchement, texte coupé, marque et Réserver visibles)", async () => {
    const report = [];
    for (const [name, w, h] of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
      await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
      const page = await ctx.newPage();
      for (const m of RESTO) {
        const res = await page.goto(`${srv.base}${U(A, `/api/bibliotheque/header/${keyOf(m)}/apercu`)}`, { waitUntil: "load" });
        if (!res || res.status() !== 200) { report.push({ key: m.key, name, defects: [`HTTP ${res && res.status()}`] }); continue; }
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); await document.fonts.ready; }); await page.waitForTimeout(120);
        const defects = await page.evaluate(inspect); if (defects.length) report.push({ key: m.key, name, defects: [...new Set(defects)].slice(0, 4) });
      }
      await ctx.close();
    }
    if (report.length) console.log("Modèles défectueux :\n" + report.map((r) => `  ${r.key} (${r.name}) : ${r.defects.join(" ; ")}`).join("\n"));
    assert.deepEqual(report, []);
  });

  // ── site publié ──
  const pagesOf = {}; const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
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
    const u = await boss.request(U(site, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() }); assert.equal(u.status, 200, u.text.slice(0, 200));
    const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
  };
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); return { ctx, pg, errors };
  };
  test("installation dans un site puis rendu public : un seul en-tête, police et fond propres au modèle, menu du site, aucune erreur JavaScript", async () => {
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Resto publié" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of RESTO) { pagesOf[m.key] = await mkPage(`P ${m.key}`); await adopt(keyOf(m), pagesOf[m.key]); }
    const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    for (const m of RESTO) {
      const { ctx, pg, errors } = await open(m);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} : un seul en-tête`);
      const r = await pg.evaluate(() => { const t = document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitelogo-text, .lp-site-header .kw-sitetitle"); return { font: t ? getComputedStyle(t).fontFamily : "", bgs: [...document.querySelectorAll(".lp-site-header *")].map((e) => getComputedStyle(e).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)") }; });
      const head = m.S.head.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      assert.ok(r.font.toLowerCase().includes(head.toLowerCase()), `${m.key} : titre en « ${r.font} » au lieu de « ${head} »`);
      if (m.mode !== "overlaysolid") assert.ok(r.bgs.some((c) => [rgb(m.S.bg), rgb(m.S.accent), rgb(m.S.alt)].includes(c)), `${m.key} : fond du modèle absent`);
      assert.deepEqual(errors, [], m.key); await ctx.close();
    }
  });
  test("menu : visible sur ordinateur (liens du menu affecté), replié derrière un bouton sur mobile qui l'ouvre et le referme ; menu plein écran du n° 2 ouvert et fermé au clavier", async () => {
    for (const m of RESTO.filter((x) => x.key !== "resto-02")) {
      const d = await open(m); const links = await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts(); assert.ok(links.join(" ").toLowerCase().includes("alpha"), `${m.key} : menu affecté absent (${links})`); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 });
      const burger = pg.locator(".lp-site-header .kw-menu-burger").first(); assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu sur mobile`);
      assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list:visible").count()), `${m.key} : menu ouvert d'office`);
      await burger.click(); await pg.waitForTimeout(120); assert.ok(await pg.locator(".lp-site-header .kw-menu-list:visible").count(), `${m.key} : le menu ne s'ouvre pas`);
      await burger.click(); await pg.waitForTimeout(120); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list:visible").count()), `${m.key} : le menu ne se referme pas (élément sous le bouton : ${await pg.evaluate(() => { const b = document.querySelector(".lp-site-header .kw-menu-burger").getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return e && e.className; })})`);
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${m.key} : débordement mobile`); await ctx.close();
    }
    const m2 = RESTO.find((x) => x.key === "resto-02"), { ctx, pg, errors } = await open(m2);
    const btn = pg.locator(".lp-site-header button").filter({ hasText: "Menu" }).first(); assert.ok(await btn.isVisible(), "bouton Menu");
    await btn.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(900);
    assert.ok(await pg.evaluate(() => /alpha/i.test(document.body.innerText) && [...document.querySelectorAll("[role=dialog],.kw-fsmenu,.mo-fsmenu,[class*=fsmenu]")].some((e) => { const r = e.getBoundingClientRect(); return r.width > 300 && getComputedStyle(e).visibility !== "hidden"; })), "menu plein écran non ouvert");
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(700);
    assert.deepEqual(errors, []); await ctx.close();
  });
  test("défilement annoncé : « se cache » (n° 4), « se réduit » (n° 2 et 7), « devient plein » (n° 9, superposé) ; mouvement réduit sans animation infinie", async () => {
    const by = (k) => RESTO.find((m) => m.key === k);
    const h = await open(by("resto-04")); assert.equal(await h.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
    const top = () => h.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom));
    assert.ok((await top()) > 20); await h.pg.evaluate(() => window.scrollTo(0, 800)); await h.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden")); await h.pg.waitForTimeout(450); assert.ok((await top()) <= 0, "masqué en descendant");
    await h.pg.evaluate(() => window.scrollTo(0, 500)); await h.pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await h.pg.waitForTimeout(450); assert.ok((await top()) > 20, "revient en remontant"); await h.ctx.close();
    for (const k of ["resto-02", "resto-07"]) {
      const s = await open(by(k)); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
      const hh = () => s.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height); const before = await hh();
      await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(400);
      assert.ok((await hh()) < before, `${k} : en-tête non réduit (${before} → ${await hh()})`); await s.ctx.close();
    }
    const o = await open(by("resto-09")); assert.equal(await o.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "solid"); assert.equal(await o.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "fixed");
    await o.pg.evaluate(() => window.scrollTo(0, 600)); await o.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await o.pg.waitForTimeout(400);
    assert.doesNotMatch(await o.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header .kw-full .kw-full")).backgroundColor), /rgba\(0, 0, 0, 0\)/); await o.ctx.close();
    for (const m of RESTO) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true); await pg.waitForTimeout(700);
      const running = await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length);
      assert.equal(running, 0, `${m.key} : animation infinie malgré « mouvement réduit »`); await ctx.close();
    }
  });
});
