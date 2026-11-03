// Installation et aperçu des thèmes dans un VRAI Chrome : le clic sur « Installer » d'une carte envoie réellement la requête et l'installation est persistante ;
// double clic, erreur serveur, réseau coupé, délai dépassé, session expirée, retour arrière : le bouton est TOUJOURS rendu, jamais bloqué sur « Installation… » ;
// isolation entre sites ; fiche d'un thème : rendu réel en direct dans un cadre isolé (sandbox), mis à l'échelle ; aperçu complet : la largeur de l'appareil est la largeur
// réelle du rendu ; cartes nettes sur écran Retina. Régression visée : deux écouteurs sur le même formulaire (le second annulait l'envoi du premier).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const TH = "/marketing/site-web/themes";

describe("installation et aperçu des thèmes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, B;
  const rows = (site) => db.prepare("SELECT theme_key FROM cms_themes WHERE site_id IS ? ORDER BY theme_key").all(site).map((r) => r.theme_key);
  const open = async (opts = {}, init = "") => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    return { context, page };
  };
  const firstCard = (page) => page.locator("[data-th-card] form[data-th-form] button[type=submit]").first();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    const mk = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase().replace(/ /g, "-")).lastInsertRowid);
    A = mk("Site A"); B = mk("Site B");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("clic sur « Installer » d'une carte : la requête part, le thème est installé pour CE site seulement, l'état survit au rechargement, aucun bouton bloqué", async () => {
    const { context, page } = await open(); const posts = [];
    page.on("request", (r) => { if (r.method() === "POST") posts.push(r.url()); });
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    const before = rows(A);
    const key = await page.evaluate(() => document.querySelector("[data-th-card] form[data-th-form] input[name=key]").value);
    const [resp] = await Promise.all([page.waitForResponse((r) => /\/themes\/installer/.test(r.url()) && r.request().method() === "POST", { timeout: 20000 }), firstCard(page).click()]);
    assert.equal(resp.status(), 200); assert.match(resp.headers()["content-type"] || "", /json/, "réponse JSON { ok, redirect }");
    await page.waitForFunction(() => !document.querySelector("button[aria-busy='true']"), null, { timeout: 15000 }); await page.waitForLoadState("load"); await page.waitForTimeout(500);
    assert.equal(posts.filter((u) => /\/themes\/installer/.test(u)).length, 1, "une seule requête d'installation");
    assert.deepEqual(rows(A), [...before, key].sort(), "le thème est enregistré pour le site A");
    assert.deepEqual(rows(B), [], "aucun thème installé sur le site B (isolation)");
    await page.reload({ waitUntil: "load" });
    assert.equal(await page.locator("button[aria-busy='true']").count(), 0, "aucun bouton resté en cours après rechargement");
    const state = await page.evaluate((k) => { const f = document.querySelector(`form[data-th-form] input[name=key][value="${k}"]`); return f ? "encore proposé à l'installation" : "installé"; }, key);
    assert.equal(state, "installé");
    await context.close();
  });

  test("double clic : une seule installation, bouton rendu à la fin", async () => {
    const { context, page } = await open(); const posts = [];
    page.on("request", (r) => { if (r.method() === "POST" && /\/themes\/installer/.test(r.url())) posts.push(r.url()); });
    await page.goto(`${srv.base}${TH}?site=${B}`, { waitUntil: "load" });
    await firstCard(page).dblclick(); await page.waitForLoadState("load"); await page.waitForTimeout(1500);
    assert.equal(posts.length, 1, `requêtes d'installation : ${posts.length}`);
    assert.equal(rows(B).length, 1);
    await context.close();
  });

  test("erreur serveur, réseau coupé, délai dépassé, session expirée : bouton rendu avec son libellé, message visible, rien d'installé", async () => {
    const cases = [
      ["erreur 500", (r) => r.fulfill({ status: 500, contentType: "text/html", body: "<h1>Erreur</h1>" }), /erreur 500/],
      ["réseau coupé", (r) => r.abort("connectionreset"), /connexion interrompue/],
      ["session expirée", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html>Connexion</html>" }), /session a expiré/],
      ["délai dépassé", () => new Promise(() => {}), /trop de temps/],
    ];
    for (const [name, handler, expected] of cases) {
      const { context, page } = await open({}, "window.__thTimeoutMs = 1500;");
      await page.route("**/themes/installer", handler);
      await page.goto(`${srv.base}${TH}?site=${A}&q=a`, { waitUntil: "load" });
      const before = rows(A);
      const btn = firstCard(page); const label = (await btn.innerText()).trim();
      await btn.click();
      await page.waitForSelector(".mk-th-notice[role=alert]:not([hidden])", { timeout: 8000 }).catch((e) => { throw new Error(`${name} : ${e.message}`); });
      assert.match(await page.locator(".mk-th-notice[role=alert]").innerText(), expected, name);
      assert.equal((await btn.innerText()).trim(), label, `${name} : libellé d'origine rétabli`);
      assert.ok(await btn.isEnabled(), `${name} : bouton de nouveau actif`);
      assert.equal(await page.locator("button[aria-busy='true']").count(), 0, `${name} : plus aucun état « en cours »`);
      assert.deepEqual(rows(A), before, `${name} : rien d'installé`);
      await context.close();
    }
  });

  test("retour arrière (page restaurée du cache) : un bouton resté « en cours » est rendu", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    await page.evaluate(() => { const f = document.querySelector("form[data-th-form]"); f.setAttribute("data-busy-now", "1"); const b = f.querySelector("button[type=submit]"); b.setAttribute("data-label", b.textContent); b.setAttribute("aria-busy", "true"); b.textContent = "Installation…"; b.disabled = true; window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })); });
    const s = await page.evaluate(() => { const b = document.querySelector("form[data-th-form] button[type=submit]"); return { busy: b.getAttribute("aria-busy"), disabled: b.disabled, text: b.textContent.trim() }; });
    assert.deepEqual([s.busy, s.disabled], [null, false]); assert.notEqual(s.text, "Installation…");
    await context.close();
  });

  test("filtres puis installation : les cartes rechargées par la recherche installent aussi (même écouteur délégué)", async () => {
    const { context, page } = await open(); const posts = [];
    page.on("request", (r) => { if (r.method() === "POST" && /\/themes\/installer/.test(r.url())) posts.push(r.url()); });
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    await page.fill("[data-tg-search]", "restaurant"); await page.waitForTimeout(1200);
    const n = await page.locator("[data-th-card] form[data-th-form] button[type=submit]").count();
    if (n) { await firstCard(page).click(); await page.waitForLoadState("load"); await page.waitForTimeout(800); assert.equal(posts.length, 1, "la carte filtrée envoie bien sa requête"); }
    await context.close();
  });

  test("fiche d'un thème : rendu réel en direct dans un cadre isolé et mis à l'échelle ; le cadre ne peut pas toucher l'administration", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${TH}/affiche-vive/details?site=${A}`, { waitUntil: "load" });
    await page.waitForSelector(".mk-td-live.is-live", { timeout: 20000 });
    const g = await page.evaluate(() => { const l = document.querySelector("[data-td-live]"), f = l.querySelector("iframe"); const r = f.getBoundingClientRect(), lr = l.getBoundingClientRect(); return { sandbox: f.getAttribute("sandbox"), scale: parseFloat(getComputedStyle(f).transform.split("(")[1]), fw: f.offsetWidth, lw: Math.round(lr.width), shownW: Math.round(r.width) }; });
    assert.equal(g.sandbox, "allow-scripts", "cadre isolé : pas de allow-same-origin"); assert.equal(g.fw, 1280, "rendu à 1280 px réels"); assert.ok(Math.abs(g.shownW - g.lw) <= 2, `échelle : ${g.shownW} px affichés pour ${g.lw} px de cadre`);
    const frame = page.frames().find((f) => /\/demo\//.test(f.url())); assert.ok(frame, "le cadre du rendu est chargé");
    const inside = await frame.evaluate(() => ({ w: innerWidth, h1: document.querySelectorAll("h1").length, fonts: [...document.fonts].filter((x) => x.status === "loaded").length, parent: (() => { try { void window.parent.document.title; return "accès"; } catch { return "bloqué"; } })() }));
    assert.equal(inside.w, 1280); assert.equal(inside.h1, 1); assert.ok(inside.fonts >= 1, "polices du thème chargées dans le cadre isolé"); assert.equal(inside.parent, "bloqué", "le cadre n'accède pas à l'administration");
    await context.close();
  });

  test("aperçu complet : la largeur de l'appareil est la largeur réelle du rendu (tablette 820, téléphone 390)", async () => {
    const { context, page } = await open();
    await page.goto(`${srv.base}${TH}/affiche-vive/apercu?site=${A}`, { waitUntil: "load" });
    for (const w of [820, 390]) {
      await page.click(`[data-tp-width="${w}px"]`); await page.waitForTimeout(500);
      const frame = page.frames().find((f) => /\/demo\//.test(f.url()));
      assert.equal(await frame.evaluate(() => innerWidth), w, `largeur réelle du rendu à ${w} px`);
      assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), true, `aucun débordement à ${w} px`);
    }
    assert.equal(await page.evaluate(() => document.querySelector("[data-tp-frame]").getAttribute("sandbox")).then((v) => /allow-same-origin/.test(v || "")), false, "cadre sans allow-same-origin");
    await context.close();
  });

  test("cartes nettes sur écran Retina : l'image choisie est la variante 720 px, au moins 1,9 fois la largeur affichée", async () => {
    const { context, page } = await open({ deviceScaleFactor: 2 });
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    await page.evaluate(async () => { for (let y = 0; y < 1400; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } });
    await page.waitForTimeout(800);
    // (naturalWidth d'une image à srcset est exprimé en pixels CSS : on mesure donc la largeur réelle du fichier choisi)
    const imgs = await page.evaluate(async () => { const out = []; for (const i of [...document.querySelectorAll("img.mk-tg-shot")].filter((x) => x.naturalWidth > 0).slice(0, 6)) { const bmp = await createImageBitmap(await (await fetch(i.currentSrc)).blob()); out.push({ src: i.currentSrc.split("/").pop(), natural: bmp.width, shown: Math.round(i.getBoundingClientRect().width) }); } return out; });
    assert.ok(imgs.length >= 3, "des cartes chargées");
    for (const i of imgs) { assert.match(i.src, /-card2\.webp$/, `variante Retina : ${i.src}`); assert.ok(i.natural >= i.shown * 1.9, `${i.src} : ${i.natural} px pour ${i.shown} px affichés`); }
    await context.close();
  });
});
