// Conteneur en mode « onglets » / « carrousel » (onglets et carrousels imbriqués) : validation, compatibilité des pages existantes, rendu publié
// et comportements réels dans Chrome (changement d'onglet au clic et au clavier, navigation du carrousel), éditeur (réglages, canevas ordinaire).
// Ignoré côté navigateur si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const { startServer, loginInstructor } = require("./helpers");

const kid = (id, text, name) => ({ id, type: "container", ...(name ? { name } : {}), props: {}, children: [{ id: id + "h", type: "heading", props: { text, level: "3" } }, { id: id + "t", type: "text", props: { html: `<p>Contenu de ${text}</p>` } }] });
const page = (props, children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props, children }] }] });

describe("mode d'affichage du conteneur (sans serveur)", () => {
  const { A } = freshMarketing();
  let n = 0;
  const save = (props) => { const p = pages.createPage(A, { name: `Imbriqué ${++n}`, kind: "page" }); return pages.saveDraft(A, p.id, page(props, [kid("on000000001", "Un")]), { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].props; };
  test("compatibilité : un conteneur sans mode reste exactement comme avant (aucune clé ajoutée)", () => {
    assert.deepEqual(save({}), {});
    assert.deepEqual(save({ full: true }), { full: true });
  });
  test("onglets : style et onglet de départ bornés ; valeurs inconnues ramenées au défaut ; mode inconnu ignoré", () => {
    assert.deepEqual(save({ mode: "tabs" }), { mode: "tabs", tabsLook: "line", tabsStart: 1 });
    assert.deepEqual(save({ mode: "tabs", tabsLook: "pills", tabsStart: 3 }), { mode: "tabs", tabsLook: "pills", tabsStart: 3 });
    assert.deepEqual(save({ mode: "tabs", tabsLook: "flashy", tabsStart: 99 }), { mode: "tabs", tabsLook: "line", tabsStart: 1 });
    assert.deepEqual(save({ mode: "accordeon" }), {});
  });
  test("carrousel : points, boucle, lecture automatique et délai bornés", () => {
    assert.deepEqual(save({ mode: "carousel" }), { mode: "carousel", dots: true, loop: false, autoplay: false, interval: 5 });
    assert.deepEqual(save({ mode: "carousel", dots: false, loop: true, autoplay: true, interval: 9 }), { mode: "carousel", dots: false, loop: true, autoplay: true, interval: 9 });
    assert.equal(save({ mode: "carousel", interval: 500 }).interval, 5);
  });
});

describe("page publiée et navigateur", () => {
  let srv, boss, db, chromium = null;
  try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
  const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
  const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
  let browser, tabsSlug, carSlug, tabsPageId;
  const publish = async (name, content) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return { id, slug: db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    const t = await publish("Onglets imbriqués", page({ mode: "tabs", tabsLook: "pills", tabsStart: 2 }, [kid("on000000001", "Présentation", "Présentation"), kid("on000000002", "Programme", "Programme"), kid("on000000003", "Tarifs")]));
    tabsSlug = t.slug; tabsPageId = t.id;
    carSlug = (await publish("Carrousel imbriqué", page({ mode: "carousel", dots: true, loop: false, autoplay: false, interval: 5 }, [kid("ca000000001", "Un"), kid("ca000000002", "Deux"), kid("ca000000003", "Trois")]))).slug;
    if (!SKIP) browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("rendu publié : onglets nommés (nom de l'enfant, sinon « Onglet N »), carrousel en diapositives branchées sur le script du site", async () => {
    const tabs = (await boss.get(`/p/${tabsSlug}`)).text;
    assert.match(tabs, /class="kw-node kw-container kw-n-box000000001 kw-ntabs is-pills" data-kw-ntabs data-kw-tabs-look="pills" data-kw-tabs-start="2"/);
    assert.deepEqual([...tabs.matchAll(/class="kw-ntab-panel" data-kw-title="([^"]*)"/g)].map((m) => m[1]), ["Présentation", "Programme", "Onglet 3"]);
    const car = (await boss.get(`/p/${carSlug}`)).text;
    assert.match(car, /kw-ncarousel" role="region" aria-roledescription="carrousel" aria-label="Carrousel" data-kw-carousel data-kw-dots/);
    assert.equal((car.match(/class="kw-carousel-slide kw-ncar-slide"/g) || []).length, 3);
    assert.match(car, /<div class="kw-carousel-track"><div class="kw-carousel-slide kw-ncar-slide"/);
  });

  test("onglets (Chrome) : l'onglet de départ est ouvert ; un clic change vraiment de panneau ; flèches et Début / Fin au clavier ; un seul panneau visible", { skip: SKIP }, async () => {
    const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/p/${tabsSlug}`); await page.waitForSelector(".kw-ntabs.is-enhanced");
    const visible = () => page.evaluate(() => [...document.querySelectorAll(".kw-ntab-panel")].map((p) => !p.hidden));
    const selected = () => page.evaluate(() => [...document.querySelectorAll(".kw-ntab")].map((t) => t.getAttribute("aria-selected")));
    assert.deepEqual(await visible(), [false, true, false], "onglet de départ = 2");
    assert.deepEqual(await selected(), ["false", "true", "false"]);
    assert.equal(await page.locator('[role="tablist"] [role="tab"]').count(), 3);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll(".kw-ntab")].map((t) => t.textContent)), ["Présentation", "Programme", "Onglet 3"]);
    await page.locator(".kw-ntab", { hasText: "Onglet 3" }).click();
    assert.deepEqual(await visible(), [false, false, true]);
    assert.equal(await page.locator(".kw-ntab-panel:not([hidden])").first().isVisible(), true);
    await page.locator(".kw-ntab[aria-selected=true]").focus();
    await page.keyboard.press("ArrowRight"); assert.deepEqual(await visible(), [true, false, false], "flèche droite : retour au premier (boucle)");
    await page.keyboard.press("End"); assert.deepEqual(await visible(), [false, false, true]);
    await page.keyboard.press("Home"); assert.deepEqual(await visible(), [true, false, false]);
    // chaque onglet est relié à son panneau (accessibilité)
    const linked = await page.evaluate(() => [...document.querySelectorAll(".kw-ntab")].every((t) => { const p = document.getElementById(t.getAttribute("aria-controls")); return p && p.getAttribute("aria-labelledby") === t.id; }));
    assert.equal(linked, true);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test("carrousel (Chrome) : suivant / précédent / points naviguent vraiment entre les diapositives", { skip: SKIP }, async () => {
    const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
    await page.goto(`${srv.base}/p/${carSlug}`); await page.waitForSelector(".kw-ncarousel.is-enhanced, .kw-ncarousel .kw-carousel-btn");
    const track = page.locator(".kw-ncarousel .kw-carousel-track").first();
    const pos = () => track.evaluate((t) => Math.round(t.scrollLeft));
    const until = async (fn) => { const end = Date.now() + 8000; while (Date.now() < end) { if (await fn()) return true; await page.waitForTimeout(100); } throw new Error("délai"); };
    const settled = async () => { let last = -1; await until(async () => { const a = await pos(); const ok = a === last; last = a; if (!ok) await page.waitForTimeout(250); return ok; }); };
    assert.equal(await pos(), 0);
    await page.locator(".kw-ncarousel .kw-carousel-btn.is-next").click(); await until(async () => (await pos()) > 100);
    await page.locator(".kw-ncarousel .kw-carousel-dot").nth(2).click(); await until(async () => (await pos()) > (await track.evaluate((t) => t.clientWidth)));
    await settled(); // défilement doux terminé : sinon « précédent » part d'une position intermédiaire et peut retomber au début (bouton désactivé)
    await page.locator(".kw-ncarousel .kw-carousel-btn.is-prev").click(); await settled(); assert.ok((await pos()) > 5, "une diapositive en arrière, pas encore au début");
    await page.locator(".kw-ncarousel .kw-carousel-btn.is-prev").click(); await until(async () => (await pos()) < 5);
    assert.equal(await page.locator(".kw-ncarousel .kw-carousel-dot").count(), 3);
    await page.close();
  });

  test("éditeur (Chrome) : réglage « Affichage des éléments à l'intérieur » enregistré ; le canevas garde un conteneur ordinaire avec son repère ; les enfants restent modifiables", { skip: SKIP }, async () => {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${srv.base}/marketing/pages/${tabsPageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 40000 });
    await page.waitForTimeout(2500);
    // canevas : conteneur ordinaire (enfants visibles ensemble), repère « Onglets », aucun onglet interactif
    const canvas = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const b = d.querySelector('[data-node-id="box000000001"]'); return { mode: b.getAttribute("data-kw-mode"), panels: d.querySelectorAll(".kw-ntab-panel").length, tabs: d.querySelectorAll(".kw-ntab").length, headings: d.querySelectorAll(".kw-heading").length }; });
    assert.equal(canvas.mode, "tabs"); assert.equal(canvas.panels, 0); assert.equal(canvas.tabs, 0); assert.equal(canvas.headings, 3, "les trois enfants sont modifiables dans le canevas");
    await page.evaluate(() => document.querySelector('[data-pb-layers] .pb-node[data-id="box000000001"] > .pb-row-item').click());
    await page.waitForSelector("[data-pb-inspector] select");
    const sel = page.locator("[data-pb-inspector] select").filter({ has: page.locator('option[value="carousel"]') }).first();
    assert.equal(await sel.inputValue(), "tabs");
    await sel.selectOption("carousel"); await page.waitForTimeout(900);
    await page.keyboard.press("Control+s"); await page.waitForTimeout(2200);
    const saved = JSON.parse(db.prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(tabsPageId).draft || "null");
    const box = saved.sections[0].children[0];
    assert.equal(box.props.mode, "carousel");
    assert.equal(box.props.tabsLook, undefined, "les réglages des onglets sont retirés");
    await sel.selectOption(""); await page.waitForTimeout(900); await page.keyboard.press("Control+s"); await page.waitForTimeout(2200);
    const back = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(tabsPageId).draft);
    assert.deepEqual(back.sections[0].children[0].props, {}, "retour à un conteneur ordinaire : aucune clé résiduelle");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
});
