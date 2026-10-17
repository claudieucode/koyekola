// Inspecteur de qualité web (Chrome réel, vrai serveur) : contrôles sur le rendu réel rattachés aux éléments, états honnêtes, corrections natives
// vérifiées après coup, discrétion (pas de focus volé, pas de calcul à chaque frappe), audit complet 3 écrans + SEO, performance.
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
  { id: "head00000001", type: "heading", props: { text: "Titre principal", level: 1 } },
  { id: "head00000002", type: "heading", props: { text: "Titre trop profond", level: 4 }, styles: { desktop: { color: "#cccccc" } } },
  { id: "imag00000001", type: "image", props: { src: "https://127.0.0.1:1/photo.jpg", alt: "photo.jpg" } },
  { id: "wide00000001", type: "container", styles: { desktop: { width: "900px", backgroundColor: "#eeeeee", paddingTop: "10px" } }, children: [{ id: "text00000001", type: "text", props: { html: "<p>Un bloc trop large pour un mobile</p>" } }] },
] }] };

describe("inspecteur de qualité web (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, pageId, errors;
  const db = () => srv.db();
  const draft = () => JSON.parse(db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId).draft);
  const find = (id, list = draft().sections) => { for (const x of list || []) { if (x.id === id) return x; const f = find(id, x.children || []); if (f) return f; } return null; };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
    await wait(600);
  };
  const dlg = () => page.locator("[data-pb-quality-dialog]");
  const openReport = async () => { if (!(await dlg().evaluate((d) => d.open))) await page.locator("[data-pb-quality]").click(); await until(() => dlg().evaluate((d) => d.open)); };
  const rules = () => page.evaluate(() => window.pbQuality.state.issues.map((i) => i.rule));
  const card = (rule) => page.locator(`.pb-q-card[data-q-rule="${rule}"]`).first();

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    pageId = Number((await boss.post("/marketing/pages", { name: "Qualité" })).location.match(/(\d+)$/)[1]);
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

  test("indicateur discret dans la barre ; le premier contrôle est « partiel » (écran affiché seulement), jamais « conforme »", async () => {
    assert.equal(await page.locator("[data-pb-quality]").count(), 1);
    await until(() => page.evaluate(() => window.pbQuality.state.status !== "idle"), { what: "premier contrôle", timeout: 8000 });
    await openReport();
    const status = await page.locator(".pb-q-status").innerText();
    assert.match(status, /Partiel/);
    assert.doesNotMatch(status, /conforme/i);
    assert.match(await page.locator(".pb-q-meta").first().innerText(), /écran ordinateur seulement/);
    assert.equal(await dlg().evaluate((d) => d.matches(":modal")), false, "le rapport ne bloque pas la page");
  });

  test("problèmes réels détectés et rattachés aux bons éléments : titre sauté, contraste, texte alternatif qui est un nom de fichier", async () => {
    const issues = await page.evaluate(() => window.pbQuality.state.issues.map((i) => ({ rule: i.rule, node: i.nodeId, cat: i.cat, sev: i.sev })));
    const by = (r) => issues.find((i) => i.rule === r);
    assert.equal(by("heading-order").node, "head00000002");
    assert.equal(by("contrast").node, "head00000002");
    assert.equal(by("img-alt-file").node, "imag00000001");
    assert.equal(by("img-alt-file").sev, "important");
    assert.equal(by("contrast").cat, "a11y");
    for (const r of ["heading-order", "contrast", "img-alt-file"]) await card(r).waitFor();
    assert.match(await card("contrast").innerText(), /WCAG 1\.4\.3[\s\S]*Correction/);
  });

  test("« Voir » sélectionne l'élément concerné sans recharger la page", async () => {
    await card("heading-order").locator("[data-q-go]").click();
    await until(() => page.evaluate(() => window.pbNav.selection().join(",") === "head00000002"), { what: "sélection" });
  });

  test("correction du contraste : modification native → contrôle relancé → problème disparu et compté « corrigé » (vérifié)", async () => {
    await card("contrast").locator("[data-q-fix]").click();
    await until(() => page.evaluate(() => window.pbQuality.state.issues.every((i) => i.rule !== "contrast")), { what: "contraste corrigé", timeout: 8000 });
    await until(() => page.evaluate(() => window.pbQuality.state.fixed === 1));
    await until(() => (find("head00000002").styles.desktop.color || "") !== "#cccccc", { what: "enregistrement" , timeout: 8000}).catch(async (e) => { throw new Error(e.message + " | " + (await page.locator("[data-pb-save]").innerText()) + " | " + (await page.locator("[data-pb-toast]").innerText()) + " | " + JSON.stringify(find("head00000002").styles)); });
    const c = find("head00000002").styles.desktop.color;
    assert.match(c, /^#[0-9a-f]{6}$/);
    await page.locator("[data-pb-undo]").click();
    await until(() => page.evaluate(() => window.pbQuality.state.issues.some((i) => i.rule === "contrast")), { what: "contraste revenu après annulation", timeout: 8000 });
  });

  test("audit complet : 3 écrans + SEO ; le débordement mobile n'apparaît qu'ici ; l'écran de départ est restauré", async () => {
    await page.locator("[data-q-full]").click();
    await until(() => page.evaluate(() => window.pbQuality.state.status === "done"), { what: "audit complet", timeout: 20000 });
    assert.equal(await page.evaluate(() => document.querySelector('.pb-top .pb-devices [aria-checked="true"]').dataset.device), "desktop");
    const r = await page.evaluate(() => window.pbQuality.state.issues.map((i) => i.rule + ":" + i.bp));
    assert.ok(r.includes("overflow-x:mobile"), r.join(" "));
    assert.ok(r.includes("fixed-width-model:mobile") && r.includes("fixed-width-model:tablet"), "largeur fixe de 900 px détectée dans le modèle");
    assert.ok(r.some((x) => x.startsWith("seo-")), "constats SEO du moteur existant");
    await until(async () => /point\(s\)|Contrôles effectués/.test(await page.locator(".pb-q-status").innerText()), { what: "texte de l'audit complet" });
    assert.match(await page.locator(".pb-q-meta").first().innerText(), /3 écrans \+ SEO/);
  });

  test("correction responsive : écrite seulement dans l'écran concerné, ordinateur intact", async () => {
    await page.locator(".pb-q-chip", { hasText: "Responsive" }).click();
    await card("fixed-width-model").locator("[data-q-fix]").click();
    await until(() => (find("wide00000001").styles || {}).mobile || (find("wide00000001").styles || {}).tablet, { what: "écran corrigé", timeout: 8000 }).catch(async (e) => { throw new Error(e.message + " | " + (await page.locator("[data-pb-save]").innerText()) + " | " + (await page.locator("[data-pb-toast]").innerText()) + " | " + JSON.stringify(find("wide00000001").styles) + " | " + (await page.locator(".pb-q-card").count())); });
    const st = find("wide00000001").styles;
    assert.equal(st.desktop.width, "900px");
    assert.ok((st.mobile && st.mobile.width === "100%") || (st.tablet && st.tablet.width === "100%"));
  });

  test("ignorer un point : masqué, mémorisé après rechargement, réaffichable", async () => {
    await page.locator(".pb-q-chip", { hasText: "Tout" }).click();
    const n = await page.locator(".pb-q-card").count();
    await card("img-alt-file").locator("[data-q-ignore]").click();
    await until(async () => (await page.locator(".pb-q-card").count()) === n - 1, { what: "carte masquée" });
    await open(); await openReport();
    await until(() => page.evaluate(() => window.pbQuality.state.status !== "idle"), { timeout: 8000 });
    assert.equal(await page.locator('.pb-q-card[data-q-rule="img-alt-file"]').count(), 0);
    await page.locator(".pb-q-card").first().waitFor();
    await page.getByRole("button", { name: /Afficher les ignorés/ }).click();
    await page.locator('.pb-q-card[data-q-rule="img-alt-file"]').waitFor();
  });

  test("résultats obsolètes quand la page change et que les contrôles continus sont coupés ; jamais présentés comme actuels", async () => {
    await page.locator("[data-q-continuous]").uncheck();
    await page.locator("[data-pb-quality-dialog] .pb-icon-btn").click();
    await page.locator("#pb-tab-page").click();
    const title = page.locator("[data-pb-page-settings] .pb-field:has(> label:text-is(\"Titre de la page (onglet du navigateur)\")) input");
    await title.fill("Un autre titre");
    await until(() => page.locator("[data-pb-quality]").getAttribute("data-state").then((s) => s === "stale"), { what: "obsolète" });
    await openReport();
    assert.match(await page.locator(".pb-q-status").innerText(), /Obsolète/);
    await page.locator("[data-q-continuous]").check();
    await until(() => page.evaluate(() => window.pbQuality.state.status !== "stale"), { what: "recalcul après réactivation", timeout: 8000 });
  });

  test("discret : la saisie n'est pas interrompue (focus conservé) et le contrôle ne tourne pas à chaque frappe", async () => {
    await page.locator("[data-pb-quality-dialog] .pb-icon-btn").click();
    const title = page.locator("[data-pb-page-settings] .pb-field:has(> label:text-is(\"Titre de la page (onglet du navigateur)\")) input");
    await title.click();
    const before = await page.evaluate(() => window.pbQuality.state.runs);
    for (const ch of "Saisie continue de test") { await page.keyboard.type(ch); await wait(25); }
    await wait(3500);
    const after = await page.evaluate(() => ({ runs: window.pbQuality.state.runs, focus: document.activeElement && document.activeElement.tagName, value: document.activeElement && document.activeElement.value }));
    assert.equal(after.focus, "INPUT");
    assert.match(after.value, /Saisie continue de test$/);
    assert.ok(after.runs - before <= 2, `contrôles lancés pendant la saisie : ${after.runs - before}`);
  });

  test("règles HTML / accessibilité sur un document de test : identifiants en double, interactifs imbriqués, champ sans libellé, lien sans nom, plusieurs H1", async () => {
    const found = await page.evaluate(() => {
      const f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-9999px;width:800px;height:600px"; document.body.appendChild(f);
      const d = f.contentDocument; d.open(); d.write('<!doctype html><html lang="fr"><body><h1>A</h1><h1>B</h1><p id="x">1</p><p id="x">2</p><a href="/a"><button>ok</button></a><a href="/vide"></a><input type="text"><label>Nom <input type="text"></label><h2></h2><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="><span role="button">faux bouton</span><a href="/b">cliquez ici</a></body></html>'); d.close();
      const r = window.pbQuality.checkDocument(d, { bp: "desktop" }).map((i) => i.rule);
      f.remove(); return r;
    });
    for (const r of ["dup-id", "nested-interactive", "field-label", "control-name", "h1-many", "empty-heading", "not-focusable", "link-generic", "img-alt"]) assert.ok(found.includes(r), `règle ${r} : ${found.join(",")}`);
    assert.equal(found.filter((r) => r === "field-label").length, 1, "le champ entouré d'un label n'est pas signalé");
  });

  test("performance : contrôle local d'une grande page rapide, ne bloque pas l'éditeur", async () => {
    const kids = []; for (let i = 0; i < 250; i++) kids.push({ id: ("k" + i + "x").padEnd(12, "0"), type: "text", props: { html: `<p>Paragraphe ${i} avec du texte</p>` } });
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const d = draft(); d.sections = [{ id: "sect00000001", type: "layout", children: kids }];
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: d }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open();
    const ms = await page.evaluate(async () => { const t = performance.now(); window.pbQuality.runLocal(); return { dt: performance.now() - t, ms: window.pbQuality.state.ms }; });
    assert.ok(ms.dt < 1500, `contrôle local de 250 éléments : ${Math.round(ms.dt)} ms`);
    console.log(`    mesure : contrôle local, 250 éléments = ${Math.round(ms.dt)} ms`);
  });

  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
