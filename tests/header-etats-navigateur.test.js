// Header Builder, lot L1 — états et comportements d'un en-tête sur le SITE PUBLIÉ, dans un VRAI Chrome : fixé (avec espaceur), coller sur certains appareils, décalage,
// masquage en descendant / réapparition en remontant, style « Après défilement », réduction des animations. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : états d'en-tête non exécutés sur cette machine" : false;
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }, { id: `${id}s`.slice(0, 20), type: "spacer", props: { size: "32" } }] });

describe("Header Builder L1 : états et comportements (navigateur)", { skip: SKIP }, () => {
  let srv, boss, db, browser, site, pageId, errors = [];
  const origin = { Origin: "" };
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const slug = () => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  // Prépare l'en-tête publié du site : modèle du catalogue + bloc `header` (et, au besoin, un état « Après défilement » sur la première bande) écrits comme l'éditeur les écrit.
  const publishHeader = async (key, header, mutate) => {
    const used = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template, cid = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    const comp = JSON.parse((await boss.get(`/marketing/site-web/composants/${cid}.json`)).text).component;
    const section = JSON.parse(JSON.stringify(comp.draft || comp.section));
    if (header) section.header = header; if (mutate) mutate(section);
    const put = await boss.request(`/marketing/site-web/composants/${cid}/brouillon`, { method: "PUT", headers: origin, json: { revision: comp.revision, content: { title: comp.name, sections: [section] } } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/site-web/composants/${cid}/mettre-a-jour`, { method: "POST", json: {}, headers: origin })).status, 200);
    const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: origin });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    return t;
  };
  const visit = async (opts = {}) => {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 }, reducedMotion: opts.reducedMotion || "no-preference" });
    const page = await context.newPage(); context.setDefaultTimeout(15000);
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    await page.goto(`${srv.base}/p/${slug()}`); await page.waitForSelector(".lp-site-header"); await page.addStyleTag({ content: "body, .lp-main{min-height:4000px}" });
    return { context, page };
  };
  const scrollTo = async (page, y) => { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(260); };
  const hdr = (page, prop) => page.evaluate((p) => { const h = document.querySelector(".lp-site-header"); return p === "rect" ? h.getBoundingClientRect().toJSON() : p === "class" ? h.className : getComputedStyle(h)[p]; }, prop);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base; boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site états" })).location.match(/sites\/(\d+)/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: "Accueil", sections: [sect("sect00000001", "CORPS DE PAGE")] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: origin })).status, 200);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("en-tête FIXÉ : reste en haut de l'écran au défilement, dans le flux (le contenu n'est pas recouvert et ne saute pas)", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "fixed" });
    const { context, page } = await visit();
    assert.equal(await hdr(page, "position"), "sticky", "réalisé avec la position collée : aucun saut de contenu");
    assert.equal(await page.locator(".kw-hdr-spacer").count(), 0, "aucun espaceur ajouté après coup");
    const hh = (await hdr(page, "rect")).height;
    const bodyTop = await page.evaluate(() => [...document.querySelectorAll(".lp-block")].find((b) => /CORPS DE PAGE/.test(b.textContent) && !b.classList.contains("lp-site-header")).getBoundingClientRect().top);
    assert.ok(bodyTop >= hh - 2, `le contenu (${bodyTop}) commence sous l'en-tête (${hh})`);
    await scrollTo(page, 600); assert.ok(Math.abs((await hdr(page, "rect")).top) < 1, "reste collé en haut");
    await context.close();
  });

  test("« Coller sur » : collé sur ordinateur seulement → collé à 1280 px, ordinaire sur mobile (390 px)", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", stickOn: ["desktop"] });
    const d = await visit(); assert.equal(await hdr(d.page, "position"), "sticky"); await d.context.close();
    const m = await visit({ viewport: { width: 390, height: 800 } }); assert.equal(await hdr(m.page, "position"), "static", "redevient ordinaire sur mobile"); await m.context.close();
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", stickOn: ["mobile"] });
    const t = await visit({ viewport: { width: 1280, height: 800 } }); assert.equal(await hdr(t.page, "position"), "static", "ordinaire sur ordinateur"); await t.context.close();
  });

  test("décalage depuis le haut : l'en-tête collé s'arrête à 24 px du bord, niveau d'empilement appliqué", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", offset: 24, zIndex: 77 });
    const { context, page } = await visit(); await scrollTo(page, 700);
    const r = await hdr(page, "rect"); assert.ok(Math.abs(r.top - 24) < 1.5, `top = ${r.top}`);
    assert.equal(await hdr(page, "zIndex"), "77");
    await context.close();
  });

  test("masquage : disparaît en descendant, réapparaît en remontant, reste visible quand le clavier y a le focus ; jamais masqué en haut de page", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", hideOnScroll: { enabled: true, tolerance: 8 } });
    const { context, page } = await visit();
    assert.ok(!/is-hidden/.test(await hdr(page, "class")), "visible en haut de page");
    await scrollTo(page, 300); await scrollTo(page, 700); assert.match(await hdr(page, "class"), /is-hidden/, "masqué en descendant");
    assert.ok((await hdr(page, "rect")).bottom <= 1, "sorti de l'écran");
    await scrollTo(page, 600); assert.ok(!/is-hidden/.test(await hdr(page, "class")), "réapparaît en remontant");
    await scrollTo(page, 1400); assert.match(await hdr(page, "class"), /is-hidden/);
    await page.evaluate(() => document.querySelector(".lp-site-header a").focus()); await page.waitForTimeout(150);
    assert.ok(!/is-hidden/.test(await hdr(page, "class")), "le focus clavier révèle l'en-tête");
    await scrollTo(page, 0); assert.ok(!/is-hidden/.test(await hdr(page, "class")), "visible en haut de page");
    await context.close();
  });

  test("réduction des animations : le masquage se fait sans transition", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", hideOnScroll: { enabled: true, tolerance: 8 } });
    const { context, page } = await visit({ reducedMotion: "reduce" });
    assert.match(await hdr(page, "transitionDuration"), /^0s/);
    await context.close();
    const n = await visit(); assert.doesNotMatch(await hdr(n.page, "transitionDuration"), /^0s$/); await n.context.close();
  });

  test("style « Après défilement » : appliqué seulement une fois le seuil franchi, retiré en haut de page", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky", threshold: 50 }, (s) => { s.children[0].states = { ...(s.children[0].states || {}), scrolled: { backgroundColor: "#ff0000" } }; });
    const { context, page } = await visit();
    const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".lp-site-header .kw-node")).backgroundColor);
    assert.notEqual(await bg(), "rgb(255, 0, 0)", "pas rouge en haut");
    await scrollTo(page, 20); assert.notEqual(await bg(), "rgb(255, 0, 0)", "pas rouge sous le seuil");
    await scrollTo(page, 120); assert.equal(await bg(), "rgb(255, 0, 0)", "rouge après le seuil");
    await scrollTo(page, 0); assert.notEqual(await bg(), "rgb(255, 0, 0)", "retiré en haut");
    await context.close();
  });

  test("sans réglage particulier, un en-tête collé garde l'état « défilé » suivi (styles par état) sans effet visuel imposé", async () => {
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky" });
    const { context, page } = await visit();
    assert.equal(await page.evaluate(() => document.querySelector(".lp-site-header").getAttribute("data-kw-scroll")), "watch");
    await scrollTo(page, 100); assert.match(await hdr(page, "class"), /is-scrolled/); await scrollTo(page, 0); assert.doesNotMatch(await hdr(page, "class"), /is-scrolled/);
    await context.close();
  });

  test("logos par état : logo « en haut de page » tant que la page n'a pas défilé, logo principal après, logo mobile sur petit écran ; un seul affiché à la fois", async () => {
    db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ identity: { logoUrl: "/uploads/logo-principal.png" } }), site);
    const withLogos = (s) => { const walk = (n) => { for (const c of n) { if (c.type === "sitelogo") { c.props = { ...(c.props || {}), logoTop: "https://img.test/logo-haut.png", logoMobile: "https://img.test/logo-mobile.png" }; } if (c.children) walk(c.children); } }; walk(s.children); };
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "sticky" }, withLogos);
    const shown = (page) => page.evaluate(() => [...document.querySelectorAll(".lp-site-header .kw-sitelogo-set img")].filter((i) => getComputedStyle(i).display !== "none").map((i) => i.getAttribute("src").split("/").pop()));
    const { context, page } = await visit();
    assert.deepEqual(await shown(page), ["logo-haut.png"], "en haut de page : logo d'en-tête");
    await scrollTo(page, 200); assert.deepEqual(await shown(page), ["logo-principal.png"], "après défilement : logo principal");
    await scrollTo(page, 0); assert.deepEqual(await shown(page), ["logo-haut.png"], "retour en haut : logo d'en-tête");
    await context.close();
    const m = await visit({ viewport: { width: 390, height: 800 } }); assert.deepEqual(await shown(m.page), ["logo-mobile.png"], "mobile : logo mobile"); await m.context.close();
    // En-tête ordinaire (pas d'état « défilé ») : jamais le logo « en haut de page » (il remplacerait le logo principal pour toujours)
    await publishHeader("classique-logo-menu-bouton.clair", { mode: "static" }, withLogos);
    const o = await visit(); assert.deepEqual(await shown(o.page), ["logo-principal.png"]); await o.context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
