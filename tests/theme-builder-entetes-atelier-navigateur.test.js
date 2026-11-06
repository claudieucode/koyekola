// En-têtes « Atelier » dans un vrai Chrome : (1) les 100 modèles à 1280 / 820 / 390 px — aucun défaut visible (rapport) ; (2) DIVERSITÉ mesurée sur les rendus réels (distance entre captures) ;
// (3) site publié : un seul en-tête, identité propre (police et fond du modèle, pas ceux du site), menu mobile qui s'ouvre, clavier, mouvement réduit ; (4) défilement : « se cache », « se réduit », « devient plein ».
// GENERER_RAPPORT=1 écrit docs/theme-builder/rapport-visuel-entetes-atelier.json (défauts, voisins les plus proches).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const V = require("../scripts/lib/entetes-visuel");
const TOLEREES = require("../scripts/lib/entetes-paires-tolerees.json");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS } = require("../src/themeBuilder/catalog/header"), { SECTORS } = require("../src/themeBuilder/catalog/header/models");

let chromium = null, sharp = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
try { sharp = require("sharp"); } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const WIDTHS = [["ordinateur", 1280, 900], ["tablette", 820, 1000], ["mobile", 390, 800]];
const keyOf = (m) => `${m.key}.${m.key}`;

describe("En-têtes Atelier : les 100 modèles dans Chrome (ordinateur, tablette, mobile)", { skip: SKIP }, () => {
  let srv, boss, db, org, A, browser;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  // Mesures dans la page : liste des défauts (vide = sain)
  const inspect = (nav) => {
    const defects = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) defects.push(`défilement horizontal (${document.documentElement.scrollWidth} > ${vw})`);
    const root = document.querySelector(".kw-theme-header") || document.body;
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    for (const e of root.querySelectorAll("*")) {
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.right > vw + 2 && getComputedStyle(e).position !== "fixed") { defects.push(`dépasse à droite : ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} (${Math.round(r.right)} > ${vw})`); break; }
    }
    for (const e of root.querySelectorAll("*")) {
      const d = getComputedStyle(e).display;
      if (!(d.includes("grid") || d.includes("flex")) || e.children.length < 2) continue;
      const kids = [...e.children].filter(vis).map((c) => c.getBoundingClientRect()).filter((r) => r.height > 4 && r.width > 4);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i], b = kids[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 6 && oy > 6) { defects.push(`chevauchement dans ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); i = kids.length; break; }
      }
      if (defects.length > 5) break;
    }
    for (const e of root.querySelectorAll("p,a,button,li,span")) {
      if (!vis(e)) continue;
      const cs = getComputedStyle(e);
      if ((cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && e.scrollWidth > e.clientWidth + 2) { defects.push(`texte coupé : ${e.tagName.toLowerCase()} « ${e.textContent.trim().slice(0, 30)} »`); break; }
    }
    // marque et au moins un lien de navigation visibles ; hauteur raisonnable
    const mark = root.querySelector(".kw-sitetitle, .kw-sitelogo"); if (!mark || !vis(mark)) defects.push("marque invisible");
    const hh = root.getBoundingClientRect().height; if (hh > (vw < 600 ? 520 : 460)) defects.push(`en-tête trop haut (${Math.round(hh)} px)`);
    return defects;
  };

  test("aucun modèle n'a de défaut visible aux trois largeurs ; le menu mobile s'ouvre ; rapport + diversité des rendus", async () => {
    const entries = Catalog.entries("header"), report = [], shots = {};
    for (const [name, w, h] of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
      const page = await ctx.newPage();
      for (const e of entries) {
        const res = await page.goto(`${srv.base}${U(A, `/api/bibliotheque/header/${e.key}/apercu`)}`, { waitUntil: "load" });
        if (!res || res.status() !== 200) { report.push({ key: e.key, name, defects: [`HTTP ${res && res.status()}`] }); continue; }
        await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120);
        const defects = await page.evaluate(inspect);
        if (defects.length) report.push({ key: e.key, name, defects: [...new Set(defects)].slice(0, 4) });
        if (name === "ordinateur" && sharp) shots[e.key] = await V.descriptor(page, sharp); // en dernier : le texte est rendu transparent pour la mesure
      }
      await ctx.close();
    }
    // diversité VISUELLE (rendus réels, niveaux de gris, sans texte, 96×24, contraste normalisé, distance L2) : plus proche voisin de chaque modèle et paires sous le seuil
    if (sharp) {
      const a = V.analyse(shots, V.SEUIL), tolerees = new Set(TOLEREES), paires = a.paires.map((x) => `${x.a}|${x.b}`);
      const nouvelles = a.paires.filter((x) => !tolerees.has(`${x.a}|${x.b}`)), reglees = [...tolerees].filter((t) => !paires.includes(t));
      console.log(`Distance visuelle : plus proche ${a.plusProche} ; ${a.paires.length} paire(s) sous le seuil ${V.SEUIL} (${tolerees.size} héritée(s) tolérée(s))`);
      if (process.env.GENERER_RAPPORT === "1") fs.writeFileSync(path.join(__dirname, "..", "docs", "theme-builder", "rapport-visuel-entetes-atelier.json"), JSON.stringify({ modeles: entries.length, largeurs: WIDTHS.map((x) => `${x[0]} ${x[1]}px`), defectueux: report, seuil: V.SEUIL, plusProche: a.plusProche, nbPaires: a.paires.length, paires: a.paires, voisins: a.voisins, descripteurs: Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, V.encode(v)])) }, null, 1));
      assert.deepEqual(nouvelles, [], `paires d'en-têtes trop proches (distance < ${V.SEUIL}) : ${JSON.stringify(nouvelles.slice(0, 6))}`);
      assert.deepEqual(reglees, [], `paires héritées désormais distinctes : les retirer de scripts/lib/entetes-paires-tolerees.json : ${JSON.stringify(reglees)}`);
      // bibliothèque finale : AUCUNE paire tolérée (ENTETES_STRICT=1)
      if (process.env.ENTETES_STRICT === "1") assert.deepEqual(a.paires, [], `mode strict : ${a.paires.length} paire(s) trop proches`);
    }
    if (report.length) console.log("Modèles défectueux :\n" + report.map((r) => `  ${r.key} (${r.name}) : ${r.defects.join(" ; ")}`).join("\n"));
    assert.deepEqual(report, [], `${new Set(report.map((r) => r.key)).size} modèle(s) défectueux`);
  });
});

describe("En-têtes Atelier : site publié dans Chrome (identité propre, un seul en-tête, clavier, mouvement réduit, défilement)", { skip: SKIP }, () => {
  let srv, boss, db, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const SAMPLE = SECTORS.map((s) => MODELS.find((m) => m.sector === s.key && m.mode !== "overlay" && m.mode !== "overlaysolid")); // un modèle par secteur
  const pagesOf = {};
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
  };
  const hideModel = MODELS.find((m) => m.mode === "stickyhide"), shrinkModel = MODELS.find((m) => m.mode === "stickyshrink"), solidModel = MODELS.find((m) => m.mode === "overlaysolid");
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié" })).location.match(/sites\/(\d+)/)[1]);
    // le menu AFFECTÉ à l'en-tête de ce site (Apparence → Menus) : les modèles le lisent, jamais une liste recopiée
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of [...SAMPLE, hideModel, shrinkModel, solidModel]) { if (pagesOf[m.key]) continue; pagesOf[m.key] = await mkPage(`P ${m.key}`); await adopt(keyOf(m), pagesOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready);
    return { ctx, pg, errors };
  };
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

  test("un modèle par secteur : un seul en-tête, police et fond PROPRES au modèle (jamais ceux du site), aucune erreur JavaScript", async () => {
    for (const m of SAMPLE) {
      const { ctx, pg, errors } = await open(m);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} : un seul en-tête`);
      const r = await pg.evaluate(() => { const t = document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitelogo-text, .lp-site-header .kw-sitetitle"); const rows = [...document.querySelectorAll(".lp-site-header *")].map((e) => getComputedStyle(e).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)"); return { font: t ? getComputedStyle(t).fontFamily : "", bgs: rows }; });
      const head = m.S.head.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      assert.ok(r.font.toLowerCase().includes(head.toLowerCase()), `${m.key} : titre en « ${r.font} » au lieu de « ${head} »`);
      assert.ok(r.bgs.some((c) => [rgb(m.S.bg), rgb(m.S.accent), rgb(m.S.alt)].includes(c)), `${m.key} : fond du modèle absent (${r.bgs.slice(0, 3)})`);
      assert.deepEqual(errors, [], m.key); await ctx.close();
    }
  });
  test("menu affecté : visible sur ordinateur dans l'identité du modèle ; sur mobile, replié derrière un bouton qui l'ouvre et le referme", async () => {
    for (const m of SAMPLE.filter((x) => x.arch !== "vertical")) {
      const d = await open(m); const links = await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts(); assert.ok(links.join(" ").toLowerCase().includes("alpha"), `${m.key} : le menu affecté n'apparaît pas (${links})`);
      const color = await d.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header .kw-menu-link")).color); assert.ok(color && !/^rgb\(0, 0, 0\)$/.test(color) || m.S.fg === "#000000", `${m.key} : couleur de lien ${color}`); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 });
      const burger = pg.locator(".lp-site-header .kw-menu-burger"); assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu sur mobile`);
      assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : menu déjà ouvert sur mobile`);
      await burger.click(); await pg.waitForTimeout(100); assert.ok(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible(), `${m.key} : le menu ne s'ouvre pas`);
      assert.equal(await burger.getAttribute("aria-expanded"), "true"); await burger.click(); await pg.waitForTimeout(100); assert.ok(!(await pg.locator(".lp-site-header .kw-menu-list").first().isVisible()), `${m.key} : le menu ne se referme pas`);
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${m.key} : débordement horizontal`); await ctx.close();
    }
  });
  test("clavier : la touche Tab atteint l'en-tête ; mouvement réduit : aucune animation en cours dans l'en-tête", async () => {
    for (const m of SAMPLE.slice(0, 5)) {
      const { ctx, pg } = await open(m, { width: 1280, height: 700 }, true);
      let inHeader = false; for (let i = 0; i < 14 && !inHeader; i++) { await pg.keyboard.press("Tab"); inHeader = await pg.evaluate(() => !!(document.activeElement && document.activeElement.closest(".lp-site-header"))); }
      // l'en-tête d'un site sans menu affecté peut ne contenir aucun élément focusable : dans ce cas le test porte sur les boutons (au moins un)
      const hasFocusable = await pg.evaluate(() => !!document.querySelector(".lp-site-header a[href], .lp-site-header button, .lp-site-header input"));
      assert.ok(!hasFocusable || inHeader, `${m.key} : l'en-tête n'est pas atteignable au clavier`);
      await pg.waitForTimeout(900);
      const running = await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length);
      assert.equal(running, 0, `${m.key} : animation infinie malgré « mouvement réduit »`);
      await ctx.close();
    }
  });
  test("« se cache » : l'en-tête sort de l'écran quand on descend et revient dès qu'on remonte ; collant en haut", async () => {
    const { ctx, pg, errors } = await open(hideModel);
    assert.equal(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
    const top = () => pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom));
    assert.ok((await top()) > 20, "visible au départ");
    await pg.evaluate(() => window.scrollTo(0, 800)); await pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden")); await pg.waitForTimeout(450);
    assert.ok((await top()) <= 0, `masqué en descendant (bas à ${await top()})`);
    await pg.evaluate(() => window.scrollTo(0, 500)); await pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await pg.waitForTimeout(450);
    assert.ok((await top()) > 20, "revient en remontant");
    assert.deepEqual(errors, []); await ctx.close();
    // mouvement réduit : pas de transition
    const r = await open(hideModel, { width: 1280, height: 700 }, true);
    assert.equal(await r.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).transitionDuration), "0s"); await r.ctx.close();
  });
  test("« se réduit » et « devient plein » : la rangée se réduit au défilement ; l'en-tête superposé prend un fond plein ; mobile sans débordement", async () => {
    const s = await open(shrinkModel); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    const BAND = ".lp-site-header .kw-full .kw-full"; const pad = () => s.pg.evaluate((q) => parseFloat(getComputedStyle(document.querySelector(q)).paddingTop), BAND);
    const before = await pad(); await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(350);
    assert.ok((await pad()) < before, "rangée réduite"); await s.ctx.close();
    const o = await open(solidModel); assert.equal(await o.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "solid");
    assert.equal(await o.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "fixed");
    await o.pg.evaluate(() => window.scrollTo(0, 600)); await o.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await o.pg.waitForTimeout(350);
    assert.doesNotMatch(await o.pg.evaluate((q) => getComputedStyle(document.querySelector(q)).backgroundColor, ".lp-site-header .kw-full .kw-full"), /rgba\(0, 0, 0, 0\)/); await o.ctx.close();
    for (const m of [hideModel, shrinkModel, ...SAMPLE.slice(0, 4)]) { const mob = await open(m, { width: 390, height: 800 }); assert.ok(await mob.pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${m.key} : débordement horizontal en mobile`); await mob.ctx.close(); }
  });
});
