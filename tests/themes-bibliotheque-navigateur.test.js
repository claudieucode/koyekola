// Apparence → Thèmes en vrai Chrome : galerie (recherche instantanée, catégories, style, pagination, images chargées), aperçu complet par page et par appareil, installation et
// utilisation d'un thème, rendu réel sur le site, ordinateur / tablette / téléphone sans débordement, mouvement réduit, aucune erreur de console.
// Nécessite playwright-core et Chrome : sinon le parcours est ignoré avec un message explicite (rien n'est prétendu vérifié).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const library = require("../src/marketing/themes/library");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.TH_SHOTS || "";

describe("Thèmes : navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, pageA;
  const TH = "/marketing/site-web/themes";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const specs = library.load().specs;
  const open = async (width = 1400, height = 900, extra = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, ...extra });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false }); } };
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const orgId = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site Chrome', 'site-chrome', '{}')").run(orgId).lastInsertRowid);
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-chrome', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "Contenu du site" }]), A).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("galerie : cartes avec aperçus réels chargés après défilement, aucun débordement, ordinateur puis téléphone", async () => {
    for (const [w, h, name] of [[1400, 900, "bureau"], [820, 1100, "tablette"], [375, 740, "mobile"]]) {
      const page = await open(w, h);
      await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
      assert.match(await page.locator("h1").first().innerText(), /Thèmes/);
      assert.ok((await page.locator("[data-th-card]").count()) >= 12, "au moins douze cartes");
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      const broken = await page.evaluate(() => [...document.querySelectorAll(".mk-tg-shot")].filter((i) => i.tagName === "IMG" && i.complete && i.naturalWidth === 0).length);
      assert.equal(broken, 0, "aucun aperçu cassé");
      const loaded = await page.evaluate(() => [...document.querySelectorAll("img.mk-tg-shot")].filter((i) => i.naturalWidth > 300).length);
      assert.ok(loaded >= 8, `${loaded} aperçus réellement chargés`);
      assert.ok((await overflow(page)) <= 1, `pas de défilement horizontal (${name}) : ${await overflow(page)} px`);
      await shot(page, `galerie-${name}`);
      await page.context().close();
    }
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("recherche instantanée, catégories, style et pagination : mise à jour sans rechargement, adresse mise à jour, état annoncé", async () => {
    const page = await open();
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    const marker = await page.evaluate(() => { window.__same = "oui"; return window.__same; });
    const first = specs.find((s) => s.category === "restaurant");
    await page.fill("#th-q", first.name);
    await page.waitForFunction((n) => /trouvé/.test(document.querySelector("[data-th-status]").textContent) && document.querySelector("[data-th-card] h3 a").textContent.includes(n), first.name, { timeout: 15000 });
    assert.equal(await page.evaluate(() => window.__same), marker, "la page n'a pas été rechargée");
    assert.match(page.url(), /q=/);
    await page.fill("#th-q", "zzzintrouvablezzz");
    await page.waitForFunction(() => /Aucun thème ne correspond/.test(document.querySelector("[data-tg-results]").textContent), null, { timeout: 15000 });
    await page.fill("#th-q", "");
    await page.waitForFunction(() => document.querySelectorAll("[data-th-card]").length >= 12, null, { timeout: 15000 });
    await page.click('[data-tg-catlink="restaurant"]');
    await page.waitForFunction(() => /categorie=restaurant/.test(location.search), null, { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll("[data-th-card]").length >= 1, null, { timeout: 15000 });
    const names = await page.$$eval("[data-th-card] .mk-tg-cat", (els) => els.map((e) => e.textContent.trim()));
    assert.ok(names.length >= 6 && names.every((n) => /Restaurants/.test(n)), `catégorie « Restaurants » : ${names.length} thèmes`);
    assert.equal(await page.getAttribute('[data-tg-catlink="restaurant"]', "aria-current"), "true");
    await page.click('[data-tg-catlink=""]');
    await page.selectOption("#th-style", "sombre");
    await page.waitForFunction(() => /style=sombre/.test(location.search), null, { timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll("[data-th-card]").length >= 1, null, { timeout: 15000 });
    await shot(page, "galerie-filtres");
    await page.selectOption("#th-style", "");
    await page.waitForFunction(() => document.querySelectorAll("[data-th-card]").length >= 12, null, { timeout: 15000 });
    if (specs.length > 24) {
      const before = await page.$eval("[data-th-card] h3 a", (e) => e.textContent);
      await page.click(".mk-tg-pager a[rel=next]");
      await page.waitForFunction((b) => document.querySelector("[data-th-card] h3 a").textContent !== b, before, { timeout: 15000 });
      assert.match(await page.locator(".mk-tg-pager").first().innerText(), /Page 2 sur/);
    }
    await page.context().close();
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("aperçu complet : pages du site de démonstration, changement d'appareil, rendu dans le cadre, polices du thème chargées", async () => {
    const s = specs.find((x) => x.pages.length >= 6) || specs[0];
    const page = await open();
    await page.goto(`${srv.base}${TH}/${s.key}/apercu?site=${A}`, { waitUntil: "load" });
    const frame = page.frameLocator("[data-tp-frame]");
    await frame.locator("main, body").first().waitFor({ timeout: 20000 });
    assert.match(await frame.locator("body").innerText(), new RegExp(s.brand.split(" ")[0]));
    assert.equal(await page.locator('[data-tp-width="100%"]').getAttribute("aria-pressed"), "true");
    await page.click('[data-tp-width="390px"]');
    assert.equal(await page.locator('[data-tp-width="390px"]').getAttribute("aria-pressed"), "true");
    await page.waitForFunction(() => document.querySelector("[data-tp-frame]").getBoundingClientRect().width < 420, null, { timeout: 5000 });
    const inner = await page.frames().find((f) => f !== page.mainFrame());
    assert.ok((await inner.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "aucun débordement dans le cadre mobile");
    await shot(page, "apercu-mobile");
    await page.click('[data-tp-width="100%"]');
    await page.click(`[data-tp-page="${s.pages[1].key}"]`);
    await page.waitForURL(new RegExp(`page=${s.pages[1].key}`));
    assert.match(await page.frameLocator("[data-tp-frame]").locator("h1").first().innerText(), /\S/);
    const font = require("../src/utils/fontLibrary").byId(s.tokens.fonts.heading);
    if (font) assert.equal(await page.frames().find((f) => f !== page.mainFrame()).evaluate((fam) => [...document.fonts].some((f) => f.family.replace(/["']/g, "") === fam && f.status === "loaded"), font.family), true, "police de titre chargée");
    await shot(page, "apercu-bureau");
    await page.context().close();
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("installer puis utiliser un thème : l'interface reflète l'état réel et le site public prend le thème", async () => {
    const s = specs.find((x) => x.tokens.colors.primary.toLowerCase() !== "#0277b6") || specs[0];
    const page = await open();
    await page.goto(`${srv.base}${TH}/${s.key}/details?site=${A}`, { waitUntil: "load" });
    assert.match(await page.locator("body").innerText(), /Disponible/);
    await page.click('button:has-text("Installer")');
    await page.waitForURL(/themes\?site=/);
    assert.match(await page.locator("body").innerText(), /installé/);
    await page.goto(`${srv.base}${TH}/${s.key}/details?site=${A}`, { waitUntil: "load" });
    page.once("dialog", (d) => d.accept());
    await page.check('input[name="demo"]');
    await page.click('button:has-text("Utiliser ce thème")');
    await page.waitForURL(/themes\?site=/);
    const text = await page.locator("body").innerText();
    assert.match(text, /activé/); assert.match(text, /pages de démonstration ont été ajoutées en brouillon/);
    assert.match(text, /thème actif/i);
    const row = one("SELECT theme_key FROM cms_themes WHERE site_id = ? AND active = 1", A);
    assert.equal(row.theme_key, s.key);
    const pub = await open(1200, 800);
    await pub.goto(`${srv.base}/marketing/pages/${pageA}/apercu`, { waitUntil: "load" });
    const primary = await pub.evaluate(() => getComputedStyle(document.querySelector(".lp-body")).getPropertyValue("--kw-primary").trim().toLowerCase());
    assert.equal(primary, s.tokens.colors.primary.toLowerCase(), "le rendu du site utilise la couleur du thème");
    await shot(page, "theme-actif");
    await pub.context().close(); await page.context().close();
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("mouvement réduit respecté ; aucun décalage de mise en page au chargement de la galerie", async () => {
    const reduced = await open(1400, 900, { reducedMotion: "reduce" });
    await reduced.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" });
    assert.ok(parseFloat(await reduced.evaluate(() => getComputedStyle(document.querySelector(".mk-tg-card")).transitionDuration)) <= 0.00001, "aucune transition perceptible en mouvement réduit");
    await reduced.context().close();
    const page = await open();
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    await page.goto(`${srv.base}${TH}?site=${A}`, { waitUntil: "load" }); await page.waitForTimeout(800);
    const cls = await page.evaluate(() => window.__cls || 0);
    assert.ok(cls < 0.1, `décalage de mise en page ${cls} < 0,1`);
    await page.context().close();
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});
