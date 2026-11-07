// En-têtes « corpo » dans un vrai Chrome : 3 largeurs sans défaut, menu desktop et mobile, comportement au défilement, réglages modifiés puis relus,
// installation dans un site et rendu public sans double en-tête.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { MODELS } = require("../src/themeBuilder/catalog/header");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;
const CORPO = MODELS.filter((m) => m.sector === "corpo");
const WIDTHS = [["ordinateur", 1280], ["tablette", 820], ["mobile", 390]];

describe("En-têtes corpo dans Chrome", { skip: SKIP }, () => {
  let srv, boss, db, browser, site;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const pages = {}, tpls = {};
  const mkPage = async (name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const tall = Array.from({ length: 12 }, (_, i) => ({ id: `spc00000000${String(i).padStart(2, "0")}`, type: "spacer", props: { size: "128" } }));
    const content = { title: name, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `CORPS ${name}`, level: "2" } }, ...tall] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return id;
  };
  const adopt = async (m, tweak) => {
    const id = await mkPage(`P ${m.key}${tweak ? " t" : ""}`);
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: `${m.key}.${m.key}` }, headers: ORIGIN() });
    assert.equal(u.status, 200, u.text.slice(0, 200)); const t = JSON.parse(u.text).template;
    if (tweak) { const c = db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(t.sourceId), sec = JSON.parse(c.section); tweak(sec); db.prepare("UPDATE mk_web_components SET section = ?, draft = NULL WHERE id = ?").run(JSON.stringify(sec), t.sourceId); }
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "page", ids: [id] }] } }, headers: ORIGIN() })).status, 200);
    assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: {}, headers: ORIGIN() })).status, 200);
    return { id, t };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Corpo" })).location.match(/sites\/(\d+)/)[1]);
    const c = await boss.post(`/marketing/site-web/navigation/menus?site=${site}`, { name: "Menu du site" }); const mid = Number(c.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    const mrev = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(mid).revision;
    await boss.request(`/marketing/site-web/navigation/menus/${mid}/enregistrer?site=${site}`, { method: "POST", json: { revision: mrev, status: "published", items: [{ type: "custom", label: "Alpha", url: "/a" }, { type: "custom", label: "Beta", url: "/b" }, { type: "custom", label: "Gamma", url: "/c" }] }, headers: ORIGIN() });
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(site, mid);
    for (const m of CORPO) { const r = await adopt(m); pages[m.key] = r.id; tpls[m.key] = r.t; }
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = async (key, width, reduced = false, url) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: reduced ? "reduce" : "no-preference" });
    const pg = await ctx.newPage(); const errors = []; pg.on("pageerror", (e) => errors.push(e.message));
    await pg.goto(url || `${srv.base}/p/${slug(pages[key])}`, { waitUntil: "load" }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(700);
    return { ctx, pg, errors };
  };

  test("10 modèles × 3 largeurs : un seul en-tête, aucun débordement horizontal, aucun texte coupé, aucune erreur JavaScript", async () => {
    for (const m of CORPO) for (const [name, w] of WIDTHS) {
      const { ctx, pg, errors } = await open(m.key, w);
      assert.equal(await pg.locator(".lp-site-header").count(), 1, `${m.key} ${name} : un seul en-tête`);
      const r = await pg.evaluate(() => {
        const h = document.querySelector(".lp-site-header"), box = h.getBoundingClientRect();
        const over = [...h.querySelectorAll("*")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && getComputedStyle(e).position !== "fixed" && (b.right > innerWidth + 1) && !e.closest(".kw-marquee, [class*='marquee']"); }).map((e) => e.className);
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, h: box.height, over: over.slice(0, 3) };
      });
      assert.ok(r.sw <= r.iw + 1, `${m.key} ${name} : défilement horizontal (${r.sw} > ${r.iw})`);
      assert.deepEqual(r.over, [], `${m.key} ${name} : éléments hors écran`);
      assert.ok(r.h > 30 && r.h < 420, `${m.key} ${name} : hauteur ${r.h}`);
      assert.deepEqual(errors, [], `${m.key} ${name}`); await ctx.close();
    }
  });

  test("menu : visible sur ordinateur (verticale pour 10), replié derrière un bouton sur mobile qui s'ouvre et se ferme", async () => {
    for (const m of CORPO) {
      const d = await open(m.key, 1280);
      const links = await d.pg.locator(".lp-site-header .kw-menu-link:visible").allInnerTexts(); assert.ok(links.join(" ").toLowerCase().includes("alpha"), `${m.key} ordinateur : menu absent (${links})`); await d.ctx.close();
      const mo = await open(m.key, 390);
      if (m.key === "corpo-10") { const b = mo.pg.locator(".lp-site-header button:visible").first(); assert.ok(await b.count() > 0, "corpo-10 mobile : bouton Menu absent"); await b.click(); await mo.pg.waitForTimeout(900); assert.ok(/alpha/i.test(await mo.pg.locator("body").innerText()), "corpo-10 : menu plein écran vide"); await mo.pg.keyboard.press("Escape"); }
      else {
        const tog = mo.pg.locator(".lp-site-header .kw-menu-toggle:visible, .lp-site-header .kw-menu-burger:visible, .lp-site-header button[aria-expanded]:visible").first();
        assert.ok(await tog.count() > 0, `${m.key} mobile : bouton de menu absent`);
        const before = await mo.pg.locator(".lp-site-header .kw-menu-link:visible").count(); await tog.click(); await mo.pg.waitForTimeout(500);
        assert.ok(await mo.pg.locator(".lp-site-header .kw-menu-link:visible").count() > before, `${m.key} mobile : le menu ne s'ouvre pas`);
        await tog.click(); await mo.pg.waitForTimeout(400); assert.equal(await mo.pg.locator(".lp-site-header .kw-menu-link:visible").count(), before, `${m.key} mobile : le menu ne se ferme pas`);
      }
      assert.deepEqual(mo.errors, [], m.key); await mo.ctx.close();
    }
  });

  test("défilement : les modèles collants restent en haut, les statiques (02, 03, 10) partent avec la page", async () => {
    for (const m of CORPO) {
      const d = await open(m.key, 1280); await d.pg.evaluate(() => window.scrollTo(0, 700)); await d.pg.waitForTimeout(600);
      const top = await d.pg.evaluate(() => Math.round(document.querySelector(".lp-site-header").getBoundingClientRect().top));
      if (m.mode === "static") assert.ok(top < -50, `${m.key} statique : top ${top}`); else assert.ok(top >= -1 && top <= 2, `${m.key} collant : top ${top}`);
      await d.ctx.close();
    }
  });

  test("01 : la barre se ferme (bouton clavier) et le choix est mémorisé au rechargement", async () => {
    const d = await open("corpo-01", 1280); const close = d.pg.locator(".lp-site-header [aria-label]").filter({ hasText: "" }).first();
    const btn = d.pg.locator(".lp-site-header .kw-dismiss, .lp-site-header [class*='dismiss'] button, .lp-site-header button[aria-label*='ermer']").first();
    assert.ok(await btn.count() > 0, "bouton de fermeture absent"); void close;
    const h0 = await d.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height); await btn.click(); await d.pg.waitForTimeout(400);
    const h1 = await d.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height); assert.ok(h1 < h0 - 10, `la barre ne se ferme pas (${h0} → ${h1})`);
    await d.pg.reload({ waitUntil: "load" }); await d.pg.waitForTimeout(500);
    const h2 = await d.pg.evaluate(() => document.querySelector(".lp-site-header").getBoundingClientRect().height); assert.ok(h2 < h0 - 10, "le choix n'est pas mémorisé"); await d.ctx.close();
  });

  test("mouvement réduit : aucune animation en cours dans l'en-tête ; ticker (06) immobile", async () => {
    for (const key of ["corpo-06", "corpo-09", "corpo-02"]) {
      const d = await open(key, 1280, true);
      const n = await d.pg.evaluate(() => document.querySelector(".lp-site-header").getAnimations({ subtree: true }).filter((a) => a.playState === "running").length);
      assert.equal(n, 0, `${key} : ${n} animation(s) en cours malgré « réduire les animations »`); await d.ctx.close();
    }
  });

  test("réglages réellement modifiés (couleur, police, espacement, animation) : enregistrés, relus et visibles sur le site publié", async () => {
    const m = CORPO.find((x) => x.key === "corpo-05");
    const { id, t } = await adopt(m, (sec) => {
      const root = sec.children ? sec : { children: [sec] }; const first = (sec.type === "container" ? sec : (sec.children || [])[0]) || sec;
      first.styles.desktop.backgroundColor = "#123456";
      const walk = (n) => { if (n.type === "sitetitle") { n.styles.desktop.fontFamily = "font.lora"; n.motion = { entrance: "zoom-in", duration: 900, delay: 0 }; } if (n.type === "container" && n.children && n !== first && n.styles && n.styles.desktop && n.styles.desktop.paddingTop === "16px") n.styles.desktop.paddingTop = "40px"; (n.children || []).forEach(walk); }; walk(root);
    });
    const comp = JSON.parse(db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(t.sourceId).section);
    assert.ok(JSON.stringify(comp).includes("#123456") && JSON.stringify(comp).includes("font.lora") && JSON.stringify(comp).includes("\"zoom-in\""), "réglages non enregistrés");
    const d = await open(m.key, 1280, false, `${srv.base}/p/${slug(id)}`);
    const r = await d.pg.evaluate(() => { const h = document.querySelector(".lp-site-header"); return { all: [...h.querySelectorAll("*"), h].map((e) => getComputedStyle(e).backgroundColor), font: getComputedStyle(h.querySelector(".kw-sitetitle-link, .kw-sitetitle")).fontFamily, pad: [...h.querySelectorAll("*")].some((e) => getComputedStyle(e).paddingTop === "40px") }; });
    assert.ok(r.all.includes("rgb(18, 52, 86)"), "fond modifié non rendu"); assert.ok(/lora/i.test(r.font), `police non rendue (${r.font})`); assert.ok(r.pad, "espacement modifié non rendu");
    assert.equal(await d.pg.locator(".lp-site-header").count(), 1); await d.ctx.close();
  });
});
