// Éditeur — états (survol) ouverts à tous les widgets visibles, typographie héritée depuis les conteneurs, nouvelles propriétés (retour à la ligne,
// curseur, fusion, contour…) : contrôle réel → modèle → canevas → enregistrement → rechargement → page publiée. Chrome réel, vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: 2 } }, { id: "list00000001", type: "list", props: { items: ["Un", "Deux"] } }], styles: { desktop: { paddingTop: "10px" } } },
  { id: "spac00000001", type: "spacer", props: { size: "40" } },
  { id: "badg00000001", type: "badge", props: { text: "Nouveau" } },
] }] };

describe("états, typographie des conteneurs et nouvelles propriétés (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const find = (id, list = draft().sections) => { for (const x of list || []) { if (x.id === id) return x; const f = find(id, x.children); if (f) return f; } return null; };
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), { what: "enregistrement", every: 100 });
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
  };
  const styleTab = async () => { const t = page.locator("[data-pb-inspector] .pb-insp-tabs").getByRole("tab", { name: "Style" }); if (await t.count()) await t.click(); await wait(250); };
  const select = async (id) => { await row(id).click(); await wait(400); await styleTab(); };
  const openAll = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details.pb-acc").forEach((d) => { d.open = true; }));
  // règle un contrôle « enum » : boutons segmentés ou liste déroulante, selon le contrôle
  const setEnum = async (prop, value) => {
    await openAll(); await wait(150);
    const c = page.locator(`[data-pb-inspector] [data-prop="${prop}"]`).first();
    await c.scrollIntoViewIfNeeded();
    const b = c.locator(`button[data-value="${value}"]`);
    if (await b.count()) await b.click(); else await c.locator("select").selectOption(value);
    await wait(350);
  };
  const cs = (id, prop) => page.evaluate(([i, p]) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${i}"]`); return e ? getComputedStyle(e)[p] : null; }, [id, prop]);
  const publish = async () => { assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200); const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug; return (await boss.get(`/p/${slug}`)).text; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "États" })).location.match(/(\d+)$/)[1]);
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: CONTENT }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("états : un titre, une liste et un badge ont maintenant l'état « Survol » ; un espace n'en a pas ; le réglage va dans l'état, pas dans le style normal ; publié et relu après rechargement", async () => {
    const hasState = (id) => page.evaluate(() => [...document.querySelectorAll('[data-pb-inspector] [role="radiogroup"][aria-label="État de l\'élément"] button')].map((b) => b.textContent.trim()));
    await select("head00000001");
    assert.deepEqual(await hasState(), ["Normal", "Survol"]);
    await select("list00000001"); assert.deepEqual(await hasState(), ["Normal", "Survol"]);
    await select("badg00000001"); assert.deepEqual(await hasState(), ["Normal", "Survol"]);
    await select("spac00000001"); assert.deepEqual(await hasState(), [], "pas d'état pour un espace");
    await select("head00000001");
    await page.locator('[data-pb-inspector] [aria-label="État de l\'élément"] button', { hasText: "Survol" }).click(); await wait(400);
    await setEnum("textTransform", "uppercase"); await saved();
    const n = find("head00000001");
    assert.equal(n.states.hover.textTransform, "uppercase", "enregistré dans l'état survol");
    assert.equal((n.styles && n.styles.desktop && n.styles.desktop.textTransform) || undefined, undefined, "le style normal n'est pas touché");
    assert.equal(await cs("head00000001", "textTransform"), "none", "l'élément au repos garde son apparence");
    const html = await publish();
    assert.match(html, /\.kw-n-head00000001:hover\{[^}]*text-transform:uppercase/, "règle de survol dans la page publiée");
    await open(); await select("head00000001");
    await page.locator('[data-pb-inspector] [aria-label="État de l\'élément"] button', { hasText: "Survol" }).click(); await wait(400);
    assert.equal(await page.locator('[data-pb-inspector] [data-prop="textTransform"] button[data-value="uppercase"]').getAttribute("aria-checked"), "true", "relu après rechargement");
  });

  test("conteneur : la typographie est disponible et héritée par les enfants (canevas et page publiée)", async () => {
    await select("cont00000001");
    await openAll(); await wait(200);
    assert.equal(await page.locator('[data-pb-inspector] details.pb-acc[data-group="typography"]').count(), 1, "section Typographie sur le conteneur");
    await setEnum("textAlign", "center"); await saved();
    assert.equal(find("cont00000001").styles.desktop.textAlign, "center");
    await until(async () => (await cs("head00000001", "textAlign")) === "center", { what: "le titre enfant hérite" });
    assert.equal(await cs("list00000001", "textAlign"), "center");
    await page.keyboard.press("Control+z"); await until(async () => (await cs("head00000001", "textAlign")) !== "center", { what: "annulation" }); await saved();
    await page.keyboard.press("Control+Shift+z"); await until(async () => (await cs("head00000001", "textAlign")) === "center", { what: "rétablissement" }); await saved();
    assert.match(await publish(), /\.kw-n-cont00000001\{[^}]*text-align:center/);
  });

  test("nouvelles propriétés : retour à la ligne, curseur, fusion, contour apparaissent dans l'inspecteur, agissent dans le canevas, s'enregistrent et sont publiées", async () => {
    await open(); // la publication a changé la révision côté serveur : on repart d'un éditeur à jour
    await select("head00000001");
    await setEnum("whiteSpace", "nowrap"); await saved();
    assert.equal(await cs("head00000001", "whiteSpace"), "nowrap", "canevas");
    await setEnum("cursor", "pointer"); await saved();
    assert.equal(await cs("head00000001", "cursor"), "pointer");
    await setEnum("mixBlendMode", "multiply"); await saved();
    assert.equal(await cs("head00000001", "mixBlendMode"), "multiply");
    await setEnum("outlineStyle", "dashed"); await saved();
    // le contour de sélection de l'éditeur utilise aussi « outline » : on vérifie le contour de l'auteur sur un élément non sélectionné
    await saved(); await select("list00000001"); await wait(300);
    assert.equal(await cs("head00000001", "outlineStyle"), "dashed", "contour de l'auteur visible quand l'élément n'est pas sélectionné");
    await select("head00000001");
    const s = find("head00000001").styles.desktop;
    assert.deepEqual([s.whiteSpace, s.cursor, s.mixBlendMode, s.outlineStyle], ["nowrap", "pointer", "multiply", "dashed"]);
    const html = await publish();
    for (const decl of ["white-space:nowrap", "cursor:pointer", "mix-blend-mode:multiply", "outline-style:dashed"]) assert.ok(html.includes(decl), decl);
    await open(); await select("head00000001");
    assert.equal(await page.locator('[data-pb-inspector] [data-prop="whiteSpace"] button[data-value="nowrap"], [data-pb-inspector] [data-prop="whiteSpace"] select').first().evaluate((e) => e.tagName === "SELECT" ? e.value : e.getAttribute("aria-checked")), await page.locator('[data-pb-inspector] [data-prop="whiteSpace"] select').count() ? "nowrap" : "true", "relu après rechargement");
    assert.deepEqual(errors, []);
  });
});
