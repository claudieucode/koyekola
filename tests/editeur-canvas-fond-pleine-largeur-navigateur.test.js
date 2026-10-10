// Éditeur de pages — mode de conteneur « Fond pleine largeur, contenu encadré » (vrai Chrome) : le fond occupe toute la largeur du parent,
// le contenu est centré à la largeur des conteneurs du site (réglable), l'intérieur choisi reste un minimum, le réglage se choisit dans
// l'Inspecteur et s'enregistre ; les autres modes ne changent pas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const idFrom = (loc) => Number(loc.match(/(\d+)$/)[1]);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("conteneur « fond pleine largeur, contenu encadré » (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, siteId, pageId, slug;
  const content = { sections: [{ id: "sect0000001", type: "layout", children: [
    { id: "bandx0000000", type: "container", props: { band: true }, styles: { desktop: { backgroundColor: "#336699", paddingLeft: "30px", paddingRight: "30px" } }, children: [{ id: "bandtx000000", type: "text", props: { html: "<p>Dans le bandeau</p>" } }] },
    { id: "boxedx000000", type: "container", styles: { desktop: { backgroundColor: "#993366" } }, children: [{ id: "boxedtx00000", type: "text", props: { html: "<p>Dans l'encadré</p>" } }] },
    { id: "fullx0000000", type: "container", props: { full: true }, styles: { desktop: { backgroundColor: "#339966" } }, children: [{ id: "fulltx000000", type: "text", props: { html: "<p>Dans la pleine largeur</p>" } }] },
  ] }] };
  const measure = (page, ids) => page.evaluate((ids) => Object.fromEntries(ids.map((id) => { const e = document.querySelector(`.kw-n-${id}`); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [id, { x: Math.round(r.x), w: Math.round(r.width), pl: cs.paddingLeft, pr: cs.paddingRight }]; })), ids);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Fond large" })).location);
    pageId = idFrom((await boss.post("/marketing/pages", { name: "Bandeau", site_id: String(siteId) })).location);
    const url = `/marketing/site-web/sites/${siteId}/reglages.json`;
    const cur = JSON.parse((await boss.get(url)).text);
    cur.settings.layout = { fullWidth: true, contentWidth: 760, containerWidth: 800, gutter: 0, breakpoints: { tablet: 1023, mobile: 767 } };
    const r = await boss.request(url, { method: "PUT", json: { tokens: cur.tokens, settings: cur.settings, revision: cur.revision } });
    assert.equal(r.status, 200, r.text);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("page publiée : le fond couvre toute la largeur, le contenu est centré à 800 px, comme dans un conteneur encadré", async () => {
    const page = await ctx.newPage(); await page.goto(`${srv.base}/p/${slug}`); await wait(300);
    const m = await measure(page, ["bandx0000000", "boxedx000000", "fullx0000000"]);
    const main = m.fullx0000000.w;
    assert.ok(main > 1000, `la page est large (${main} px)`);
    assert.equal(m.bandx0000000.w, main, `le fond du bandeau couvre toute la largeur du parent ${JSON.stringify(m)}`);
    assert.equal(m.boxedx000000.w, 800, "un conteneur encadré est limité à 800 px (réglage du site)");
    const text = await page.evaluate(() => { const r = (id) => { const b = document.querySelector(`.kw-n-${id}`).getBoundingClientRect(); return [Math.round(b.x), Math.round(b.width)]; }; return { band: r("bandtx000000"), boxed: r("boxedtx00000") }; });
    assert.deepEqual(text.band, text.boxed, "le texte du bandeau est exactement aligné sur celui du conteneur encadré (même position, même largeur)");
    assert.equal(m.fullx0000000.w, main, "pleine largeur inchangée");
    await page.close();
  });
  test("sur un écran étroit, l'intérieur choisi (30 px) reste le minimum ; rien ne déborde", async () => {
    const page = await ctx.newPage(); await page.setViewportSize({ width: 500, height: 900 }); await page.goto(`${srv.base}/p/${slug}`); await wait(300);
    const m = await measure(page, ["bandx0000000"]);
    assert.equal(m.bandx0000000.pl, "30px"); assert.equal(m.bandx0000000.pr, "30px");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.close();
  });
  test("éditeur : le mode se choisit dans l'Inspecteur (Général), s'enregistre et le canevas suit ; les autres modes sont inchangés", async () => {
    const page = await ctx.newPage(); await page.setViewportSize({ width: 1700, height: 1000 });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 }); await wait(800);
    const draft = () => { const r = srv.db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return JSON.parse(r.draft || r.sections); };
    const find = (list, id) => { for (const x of list || []) { if (x.id === id) return x; const f = find(x.children, id); if (f) return f; } return null; };
    await page.locator('[data-pb-layers] .pb-node[data-id="boxedx000000"] > .pb-row-item').click(); await wait(300);
    await page.locator(".pb-right button", { hasText: /^Général$/ }).first().click(); await wait(300);
    const sel = page.locator(".pb-inspector select").filter({ has: page.locator('option[value="band"]') }).first();
    assert.equal(await sel.inputValue(), "boxed");
    await sel.selectOption("band"); await wait(1500);
    const n = find(draft().sections, "boxedx000000");
    assert.equal(n.props.band, true); assert.equal(n.props.full, undefined);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="boxedx000000"]').classList.contains("kw-band")), true, "le canevas applique le mode");
    await sel.selectOption("full"); await wait(1200);
    const n2 = find(draft().sections, "boxedx000000"); assert.equal(n2.props.full, true); assert.equal(n2.props.band, undefined, "un seul mode à la fois");
    await sel.selectOption("boxed"); await wait(1200);
    const n3 = find(draft().sections, "boxedx000000"); assert.ok(!(n3.props && (n3.props.full || n3.props.band)), "retour à l'encadré d'origine");
    await page.close();
  });
  test("un conteneur ordinaire de l'éditeur naît avec un écart de 20 px, sans toucher aux conteneurs existants", async () => {
    const page = await ctx.newPage(); await page.setViewportSize({ width: 1700, height: 1000 });
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector("[data-node-id]"), null, { timeout: 30000 }); await wait(800);
    const before = JSON.stringify(JSON.parse(srv.db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId).draft || "null"));
    await page.locator('[data-pb-layers] .pb-node[data-id="fullx0000000"] > .pb-row-item').click(); await wait(300);
    await page.locator("[data-pb-left] button", { hasText: /^Conteneur$/ }).first().click(); await wait(1500);
    const d = JSON.parse(srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
    const flat = (l, o = []) => { for (const x of l || []) { o.push(x); flat(x.children, o); } return o; };
    const created = flat(d.sections).find((x) => x.type === "container" && !["bandx0000000", "boxedx000000", "fullx0000000"].includes(x.id));
    assert.equal(created.styles.desktop.gap, "20px");
    for (const id of ["bandx0000000", "boxedx000000", "fullx0000000"]) assert.equal(flat(d.sections).find((x) => x.id === id).styles.desktop.gap, undefined, `${id} : écart d'origine conservé`);
    void before;
    await page.close();
  });
});
