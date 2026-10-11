// Compatibilité des réglages avec les PARTIES des widgets (cause : « placement dans le parent » proposé pour une partie, ex. alignSelf sur
// « Question + réponse » d'un accordéon placé dans un conteneur Flexbox). Chrome réel, vrai serveur :
//  1. le cas exact de l'accordéon ; 2. alignSelf reste utilisable sur le widget ; 3. AUCUNE partie d'aucun widget n'offre un réglage que le registre refuse ;
//  4. un réglage incompatible reçu quand même est écarté (reste enregistré), le client se nettoie et prévient sans bloquer.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const nodes = require("../src/marketing/pages/nodes");
const parts = require("../src/marketing/pages/parts");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const NOISE = /^(filter-|shadow-|gradient-|overlay-|transform-|mask-|backgroundType|backgroundImage|shadow$)/; // sous-contrôles des réglages composés
const groupOf = (k) => (k === "backgroundColor" ? "background" : (nodes.STYLE_PROPS[k] || nodes.COMPOSED[k] || {}).group);

describe("compatibilité des réglages et des parties (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors, kids = [];
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const find = (id, list = draft().sections) => { for (const x of list || []) { if (x.id === id) return x; const f = find(id, x.children || []); if (f) return f; } return null; };
  const rev = () => db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
  const put = (children) => boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev(), content: { sections: [{ id: "sect00000001", type: "layout", children }] } }, headers: { Origin: srv.base } });
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => document.querySelector("[data-pb-frame]")?.contentDocument?.querySelector("[data-node-id]"));
    await wait(700);
  };
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const styleTab = async () => { const t = page.locator("[data-pb-inspector] .pb-insp-tabs").getByRole("tab", { name: "Style" }); if (await t.count()) await t.click(); await wait(200); };
  const openAll = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] details.pb-acc").forEach((d) => { d.open = true; }));
  const offered = () => page.evaluate(() => [...new Set([...document.querySelectorAll("[data-pb-inspector] [data-prop]")].map((e) => e.dataset.prop))]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Compat" })).location.match(/(\d+)$/)[1]);
    const spec = nodes.editorSpec();
    const cands = Object.keys(parts.PARTS).filter((t) => spec.types.find((x) => x.type === t)).map((t, i) => ({ id: (t + "x").padEnd(11, "0").slice(0, 11) + String.fromCharCode(97 + (i % 26)), type: t, props: (spec.types.find((x) => x.type === t).blank || {}).props || {} }));
    const inFlex = (list) => [{ id: "cont00000001", type: "container", styles: { desktop: { display: "flex", flexDirection: "column" } }, children: list }];
    for (const k of cands) { if ((await put(inFlex(kids.concat([k])))).status === 200) kids.push(k); }
    assert.ok(kids.some((k) => k.type === "accordion"), "l'accordéon est dans le jeu de test");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const accId = () => kids.find((k) => k.type === "accordion").id;

  test("cas exact : accordéon dans un conteneur Flexbox, partie « Question + réponse » : plus de « Alignement dans le parent » ; un réglage de la partie s'enregistre sans erreur", async () => {
    await row(accId()).click(); await wait(400); await styleTab();
    await page.locator('[data-pb-inspector] [data-part="item"]').click(); await wait(300);
    await openAll(); await wait(200);
    const props = await offered();
    assert.ok(!props.includes("alignSelf"), `réglages proposés : ${props.join(",")}`);
    assert.ok(props.includes("borderRadius") && props.includes("backgroundType"), `les réglages légitimes de la partie restent proposés : ${props.join(",")}`);
    const rad = page.locator('[data-pb-inspector] [data-prop="borderRadius"] input').first();
    await rad.scrollIntoViewIfNeeded(); await rad.fill("14"); await rad.press("Enter");
    await until(() => (find(accId()).parts?.item?.styles?.desktop?.borderRadius || "").startsWith("14"), { what: "partie enregistrée", timeout: 8000 });
    assert.doesNotMatch(await page.locator("[data-pb-save]").innerText(), /Non enregistré|Erreur/);
    assert.equal(find(accId()).parts.item.styles.desktop.alignSelf, undefined);
  });

  test("le widget lui-même garde « Alignement dans le parent » (usage légitime) et l'écrit sur le widget", async () => {
    await page.locator('[data-pb-inspector] [data-part=""]').click(); await wait(300);
    await openAll(); await wait(200);
    assert.ok((await offered()).includes("alignSelf"), "alignSelf proposé pour le widget enfant de Flexbox");
    const sel = page.locator('[data-pb-inspector] [data-prop="alignSelf"]').first();
    await sel.scrollIntoViewIfNeeded();
    const btn = sel.locator('button[data-value="center"]');
    if (await btn.count()) await btn.click(); else await sel.locator("select").selectOption("center");
    await until(() => find(accId()).styles?.desktop?.alignSelf === "center", { what: "alignSelf du widget enregistré", timeout: 8000 });
    assert.equal(((find(accId()).parts || {}).item || { styles: { desktop: {} } }).styles.desktop.alignSelf, undefined, "rien dans la partie");
  });

  test("toutes les parties de tous les widgets du jeu de test : aucun réglage proposé que le registre refuserait", async () => {
    const bad = {};
    for (const k of kids) {
      await row(k.id).click().catch(() => {}); await wait(220); await styleTab();
      for (const part of Object.keys(parts.PARTS[k.type])) {
        const chip = page.locator(`[data-pb-inspector] [data-part="${part}"]`);
        if (!(await chip.count())) { bad[`${k.type}.${part}`] = "puce absente"; continue; }
        await chip.click(); await wait(120); await openAll();
        const def = parts.PARTS[k.type][part];
        const wrong = (await offered()).filter((o) => !NOISE.test(o) && !parts.allows(def, o, groupOf));
        if (wrong.length) bad[`${k.type}.${part}`] = wrong;
      }
    }
    assert.deepEqual(bad, {}, `${kids.length} widgets contrôlés`);
    console.log(`    contrôlé : ${kids.length} widgets, ${kids.reduce((n, k) => n + Object.keys(parts.PARTS[k.type]).length, 0)} parties`);
  });

  test("réglage incompatible reçu quand même (ancien document, copie, outil) : écarté sans bloquer l'enregistrement ; le document de l'éditeur est nettoyé ; message en français", async () => {
    await open();
    await page.evaluate((id) => { window.pbNav.change(function () { const it = window.pbNav.byId(id); it.parts = Object.assign({}, it.parts, { question: { styles: { desktop: { alignSelf: "center", color: "#336699" } } } }); }, { label: "test" }); }, accId());
    await until(() => find(accId()).parts?.question?.styles?.desktop?.color === "#336699", { what: "enregistrement malgré le réglage inapplicable", timeout: 8000 });
    const q = find(accId()).parts.question.styles.desktop;
    assert.equal(q.alignSelf, undefined, "écarté côté serveur");
    assert.equal(q.color, "#336699", "le reste est conservé");
    assert.match(await page.locator("[data-pb-toast]").innerText(), /n'existe pas pour la partie/);
    const local = await page.evaluate((id) => window.pbNav.byId(id).parts.question.styles.desktop, accId());
    assert.equal(local.alignSelf, undefined, "le document de l'éditeur est nettoyé");
    assert.doesNotMatch(await page.locator("[data-pb-save]").innerText(), /Non enregistré|Erreur/);
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
