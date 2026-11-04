// KOLAKISA CMS — palier 8 : parcours en vrai Chrome (styles → brouillon → aperçu → publication → rendu réel du site, en-tête,
// pied de page, templates, insertion d'un pattern dans le Page Builder, responsive).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });

describe("apparence (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors;
  const AP = "/marketing/site-web/apparence";
  const open = async (width = 1280, cookies = false) => {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    if (cookies) await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("styles : changer la couleur dans l'interface, enregistrer, aperçu (iframe tablette/mobile), publier — la couleur change sur le vrai site", async () => {
    const admin = await open(1400, true);
    await admin.goto(`${srv.base}${AP}/styles`);
    await admin.locator("#c-primary").evaluate((el) => { el.value = "#cc0033"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await admin.locator("#b-radius").fill("28");
    await admin.click("form.mk-ap-form button[type=submit]");
    await admin.waitForSelector("text=Styles enregistrés");
    assert.equal(JSON.parse(db.prepare("SELECT draft FROM appearance_configs").get().draft).tokens.colors.primary, "#cc0033");
    // aperçu : cadre à la taille du téléphone
    await admin.goto(`${srv.base}${AP}?url=${encodeURIComponent("/blog")}#apercu`);
    await admin.click("[data-ap-device='375']");
    const w = await admin.locator("[data-ap-frame]").evaluate((f) => f.getBoundingClientRect().width);
    assert.ok(w <= 376, `largeur du cadre ${w}`);
    const color = await admin.frameLocator("[data-ap-frame]").locator(".btn-primary").first().evaluate((b) => getComputedStyle(b).backgroundColor);
    assert.match(color, /rgb\(204, 0, 51\)/, "le brouillon est visible dans l'aperçu");
    // publication
    await admin.click("text=Publier sur le site");
    await admin.waitForSelector("text=Apparence publiée");
    const visitor = await open(1280);
    await visitor.goto(srv.base);
    assert.match(await visitor.locator(".btn-primary").first().evaluate((b) => getComputedStyle(b).backgroundColor), /rgb\(204, 0, 51\)/);
    assert.equal(await visitor.locator(".btn").first().evaluate((b) => getComputedStyle(b).borderRadius), "28px");
    await visitor.reload();
    assert.match(await visitor.locator(".btn-primary").first().evaluate((b) => getComputedStyle(b).backgroundColor), /rgb\(204, 0, 51\)/, "persistance");
  });

  test("en-tête : l'ancienne adresse mène au Theme Builder (seul gestionnaire) ; le site public reste sans débordement en mobile (375) et tablette (820)", async () => {
    const admin = await open(1400, true);
    await admin.goto(`${srv.base}${AP}/en-tete`);
    await admin.waitForURL(/\/principal\/constructeur-de-theme/);
    assert.equal(await admin.locator("#tb-theme [data-tb-theme]").count(), 3, "Theme Builder ouvert");
    for (const width of [820, 375]) {
      const page = await open(width);
      await page.goto(srv.base);
      assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, `${width}px : pas de défilement horizontal`);
    }
  });
  test("templates : l'écran adapte les conditions à la famille choisie ; template 404 appliqué sur une vraie 404", async () => {
    const page = Number((await boss.post("/marketing/pages", { name: "Modèle 404 nav" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(page).revision;
    await boss.request(`/marketing/pages/${page}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [layout([{ id: "head00000030", type: "heading", props: { text: "PERDU DANS LE NAVIGATEUR", level: 1 } }])] } } });
    await boss.postJson(`/marketing/pages/${page}/publier.json`, {});
    const admin = await open(1400, true);
    await admin.goto(`${srv.base}${AP}/templates`);
    await admin.selectOption("#tt-type", "tag_archive");
    assert.equal(await admin.locator("[data-ap-cond=tag]").isVisible(), true);
    assert.equal(await admin.locator("[data-ap-cond=category]").isVisible(), false);
    await admin.selectOption("#tt-type", "not_found");
    assert.equal(await admin.locator("[data-ap-cond=tag]").isVisible(), false);
    await admin.selectOption("#tt-page", String(page));
    await admin.click("form[data-ap-template-form] button[type=submit]");
    await admin.waitForSelector("text=Template enregistré");
    const visitor = await open(1280);
    const res = await visitor.goto(`${srv.base}/inexistante-navigateur`);
    assert.equal(res.status(), 404);
    assert.match(await visitor.locator("body").innerText(), /PERDU DANS LE NAVIGATEUR/);
  });

  test("patterns : créer depuis une section dans l'interface, puis l'insérer depuis l'onglet « Blocs » du Page Builder", async () => {
    const src = Number((await boss.post("/marketing/pages", { name: "Source pattern" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(src).revision;
    await boss.request(`/marketing/pages/${src}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [layout([{ id: "head00000031", type: "heading", props: { text: "Titre du pattern", level: 2 } }])] } } });
    const admin = await open(1400, true);
    await admin.goto(`${srv.base}${AP}/patterns`);
    await admin.selectOption("#pt-page", String(src));
    await admin.click("text=Voir ses sections");
    await admin.check("input[name=section_index]");
    await admin.fill("#pt-name", "Bandeau titre");
    await admin.click("text=Enregistrer comme pattern");
    await admin.waitForSelector("text=Pattern « Bandeau titre » enregistré");
    assert.ok(db.prepare("SELECT 1 FROM appearance_patterns WHERE name = 'Bandeau titre'").get());
    const editor = await open(1600, true);
    await editor.goto(`${srv.base}/marketing/pages/${src}/editeur`);
    await editor.waitForTimeout(2000);
    await editor.locator("button", { hasText: /^Blocs$/ }).first().click();
    const item = editor.locator("text=Bandeau titre").first();
    await item.waitFor({ state: "visible", timeout: 8000 });
    assert.equal(await item.isVisible(), true, "le pattern est proposé dans les blocs du Page Builder");
    // insertion réelle : la section du pattern s'ajoute au canevas (copie indépendante) — on compte les titres « Titre du pattern »
    const count = async () => { let n = 0; for (const f of editor.frames()) n += await f.evaluate(() => (document.body ? (document.body.innerText.match(/Titre du pattern/g) || []).length : 0)).catch(() => 0); return n; };
    const before = await count();
    await item.click();
    await editor.waitForTimeout(1200);
    const after = await count();
    assert.ok(after > before, `le pattern est inséré dans la page (${before} → ${after})`);
    assert.deepEqual(errors.filter((e) => !/WebSocket|favicon/.test(e)), []);
  });
});
