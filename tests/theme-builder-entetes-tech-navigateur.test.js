// En-têtes « tech » dans un vrai Chrome : 3 largeurs sans défaut, site publié (un seul en-tête, identité propre), menu ordinateur et mobile, panneau latéral de tech-10, défilement (se cache / se réduit).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { MODELS } = require("../src/themeBuilder/catalog/header");

let chromium = null; try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const TECH = MODELS.filter((m) => m.sector === "tech" && (!process.env.ONLY || m.key === process.env.ONLY)), by = (k) => TECH.find((m) => m.key === k);
const keyOf = (m) => `${m.key}.${m.key}`;
const WIDTHS = [["ordinateur", 1280], ["tablette", 820], ["mobile", 390]];

describe("En-têtes tech dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, A;
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
    const u = await boss.request(U(site, "/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: ORIGIN() }); assert.equal(u.status, 200); const t = JSON.parse(u.text).template;
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [pageId] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(site, `/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Publié tech" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of TECH) { pagesOf[m.key] = await mkPage(`P ${m.key}`); await adopt(keyOf(m), pagesOf[m.key]); }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  const inspect = () => {
    const defects = [], vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) defects.push("défilement horizontal");
    const root = document.querySelector(".kw-theme-header") || document.body;
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    for (const e of root.querySelectorAll("*")) { if (!vis(e) || e.closest(".kw-marquee")) continue; if (e.getBoundingClientRect().right > vw + 2 && getComputedStyle(e).position !== "fixed") { defects.push(`dépasse à droite : ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); break; } }
    for (const e of root.querySelectorAll("*")) {
      const d = getComputedStyle(e).display; if (!(d.includes("grid") || d.includes("flex")) || e.children.length < 2) continue;
      const kids = [...e.children].filter(vis).map((c) => c.getBoundingClientRect()).filter((r) => r.height > 4 && r.width > 4);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i], b = kids[j]; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 6 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 6) { defects.push(`chevauchement dans ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); i = kids.length; break; } }
    }
    for (const e of root.querySelectorAll("p,a,button,li,span")) { if (!vis(e)) continue; const cs = getComputedStyle(e); if ((cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && e.scrollWidth > e.clientWidth + 2) { defects.push(`texte coupé « ${e.textContent.trim().slice(0, 30)} »`); break; } }
    const mark = root.querySelector(".kw-sitetitle, .kw-sitelogo"); if (!mark || !vis(mark)) defects.push("marque invisible");
    return defects;
  };

  test("les 10 modèles aux 3 largeurs (aperçu) : aucun défaut visible", async () => {
    const report = [];
    for (const [name, w] of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" }); await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base }))); const page = await ctx.newPage();
      for (const m of TECH) {
        const res = await page.goto(`${srv.base}${U(A, `/api/bibliotheque/header/${keyOf(m)}/apercu`)}`, { waitUntil: "load" }); assert.equal(res.status(), 200, m.key);
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); }); await page.waitForTimeout(150);
        const d = await page.evaluate(inspect); if (d.length) report.push(`${m.key} ${name} : ${[...new Set(d)].join(" ; ")}`);
      }
      await ctx.close();
    }
    assert.deepEqual(report, []);
  });

  const open = async (m, viewport = { width: 1280, height: 700 }, reduced = false) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: reduced ? "reduce" : "no-preference" }); const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(`${srv.base}/p/${slug(pagesOf[m.key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); return { ctx, pg, errors };
  };
  test("site publié : un seul en-tête, police propre, aucune erreur JavaScript ; menu visible sur ordinateur et replié sur mobile", async () => {
    for (const m of TECH) {
      const d = await open(m); assert.equal(await d.pg.locator(".lp-site-header").count(), 1, `${m.key} : un seul en-tête`);
      const head = m.S.head.replace(/^font\./, "").split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join(" ");
      const font = await d.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header .kw-sitetitle-link, .lp-site-header .kw-sitelogo-text, .lp-site-header .kw-sitetitle")).fontFamily); assert.ok(font.toLowerCase().includes(head.toLowerCase()), `${m.key} : ${font}`);
      if (m.key !== "tech-10") { const links = (await d.pg.locator(".lp-site-header .kw-menu-link").allInnerTexts()).join(" ").toLowerCase(); assert.ok(links.includes("alpha"), `${m.key} : menu absent`); }
      assert.deepEqual(d.errors, [], m.key); await d.ctx.close();
      const { ctx, pg } = await open(m, { width: 390, height: 800 });
      await pg.waitForTimeout(1500); // fin des animations d'entrée (un élément qui glisse dépasse pendant 600 ms)
      const over = await pg.evaluate(() => { const vw = document.documentElement.clientWidth; return document.documentElement.scrollWidth <= vw + 1 ? "" : [...document.querySelectorAll(".lp-site-header *")].filter((e) => e.getBoundingClientRect().right > vw + 1).slice(0, 4).map((e) => { const ch = []; for (let a = e; a && !a.classList.contains("lp-site-header"); a = a.parentElement) ch.push(`${a.tagName}${Math.round(a.getBoundingClientRect().width)}${getComputedStyle(a).display[0]}`); return `${e.tagName}.${String(e.className).slice(0, 40)}:${Math.round(e.getBoundingClientRect().right)} <- ${ch.join(">")}`; }).join(" | "); });
      assert.equal(over, "", `${m.key} : débordement mobile`);
      if (m.key !== "tech-10") {
        const burger = pg.locator(".lp-site-header .kw-menu-burger:visible").first(); assert.ok(await burger.isVisible(), `${m.key} : pas de bouton de menu`);
        await burger.click(); await pg.waitForTimeout(150); assert.ok(await pg.locator(".lp-site-header .kw-menu-list:visible").count() >= 1, `${m.key} : le menu ne s'ouvre pas`);
      }
      await ctx.close();
    }
  });
  test("tech-10 : le bouton ouvre le panneau latéral (liens du menu affecté), Échap le referme", async () => {
    for (const vp of [{ width: 1280, height: 700 }, { width: 390, height: 800 }]) {
      const { ctx, pg } = await open(by("tech-10"), vp);
      await pg.waitForSelector(".kw-ms-live"); const toggle = pg.locator(".kw-ms-fm-toggle"); assert.ok(await toggle.isVisible(), "bouton absent"); assert.equal(await pg.locator(".kw-ms-fm-panel").isVisible(), false);
      await toggle.click(); await pg.waitForTimeout(900); assert.ok(await pg.locator(".kw-ms-fm-panel").isVisible(), "panneau fermé");
      assert.deepEqual((await pg.locator(".kw-ms-fm-link").allInnerTexts()).map((t) => t.replace(/\d+/g, "").trim().toLowerCase()), ["alpha", "beta", "gamma"]);
      await pg.keyboard.press("Escape"); await pg.waitForTimeout(900); assert.equal(await pg.locator(".kw-ms-fm-panel").isVisible(), false, "panneau non refermé"); await ctx.close();
    }
  });
  test("défilement : tech-07 et tech-10 se cachent en descendant et reviennent ; tech-05 réduit sa rangée ; tech-02 superposé", async () => {
    for (const k of ["tech-07", "tech-10"]) {
      const { ctx, pg } = await open(by(k)); assert.equal(await pg.getAttribute(".lp-site-header", "data-kw-scroll"), "hide");
      const bottom = () => pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().bottom));
      await pg.evaluate(() => window.scrollTo(0, 800)); await pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-hidden")); await pg.waitForTimeout(450); assert.ok((await bottom()) <= 0, `${k} masqué`);
      await pg.evaluate(() => window.scrollTo(0, 500)); await pg.waitForFunction(() => !document.querySelector(".lp-site-header").classList.contains("is-hidden")); await pg.waitForTimeout(450); assert.ok((await bottom()) > 20, `${k} revient`); await ctx.close();
    }
    const s = await open(by("tech-05")); assert.equal(await s.pg.getAttribute(".lp-site-header", "data-kw-scroll"), "shrink");
    const pad = () => s.pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".lp-site-header .kw-full .kw-full")).paddingTop)); const before = await pad();
    await s.pg.evaluate(() => window.scrollTo(0, 700)); await s.pg.waitForFunction(() => document.querySelector(".lp-site-header").classList.contains("is-scrolled")); await s.pg.waitForTimeout(350); assert.ok((await pad()) < before, "rangée réduite"); await s.ctx.close();
    const g = await open(by("tech-02")); assert.equal(await g.pg.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header")).position), "absolute"); await g.ctx.close();
  });
  test("mouvement réduit : aucune animation infinie dans l'en-tête (ticker de tech-09 immobile)", async () => {
    for (const k of ["tech-09", "tech-02"]) {
      const { ctx, pg } = await open(by(k), { width: 1280, height: 700 }, true); await pg.waitForTimeout(800);
      assert.equal(await pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect && a.effect.getTiming().iterations === Infinity).length), 0, k); await ctx.close();
    }
  });
});
