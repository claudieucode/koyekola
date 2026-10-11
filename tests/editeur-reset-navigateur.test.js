// Réinitialisation intelligente de l'éditeur dans un VRAI Chrome : l'icône n'existe que si le réglage diffère de la dernière version
// enregistrée, chaque champ se restaure seul, l'élément entier aussi (parents sans enfants), écrans séparés, enregistrement réussi /
// échoué, éléments nouveaux sans référence, annulation, et coût sur un document volumineux.
// Ignoré (avec la raison) si Playwright ou Chrome sont absents : `npm i --no-save playwright-core`, ou CHROME_PATH.
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

const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", props: {}, children: [
    { id: "btn000000001", type: "button", props: { label: "Acheter", url: "/catalogue" }, styles: { desktop: { fontSize: "18px" } } },
    { id: "hed000000001", type: "heading", props: { text: "Titre", level: "2" } },
  ] },
] }] };

describe("réinitialisation vers la dernière version enregistrée (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, pageId;
  const db = () => srv.db();
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
  async function openEditor(content = CONTENT) {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: `Reset ${n}` })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    await wait(400);
  }
  const pick = async (id) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); await wait(250); };
  const tab = async (name) => { await page.locator("[data-pb-inspector] [role=tab]", { hasText: name }).click(); await wait(200); };
  const on = (scope = "[data-pb-inspector]") => page.locator(`${scope} .pb-restore.is-on`).count();
  const row = (prop) => page.locator(`[data-pb-inspector] .pb-prop[data-prop="${prop}"]`);
  const rowOn = (prop) => row(prop).locator(".pb-restore.is-on").count();
  const setNum = async (prop, v) => { const i = row(prop).locator("input.pb-len-num"); await i.fill(String(v)); await i.press("Enter"); await wait(200); };
  const field = (label) => page.locator("[data-pb-inspector] .pb-field", { has: page.locator("label", { hasText: new RegExp(`^${label}`) }) }).first();
  const fieldOn = (label) => field(label).locator(".pb-restore.is-on").count();
  const setText = async (label, v) => { const i = field(label).locator("input").first(); await i.fill(v); await wait(150); };
  const head = () => page.locator("[data-pb-inspector] .pb-insp-head-actions .pb-restore");
  const cbarRestore = () => page.locator('.pb-cbar-btn[data-action="restore"]').count();
  const draft = () => { const r = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const find = (id) => { let out = null; const walk = (list) => { for (const x of list || []) { if (x.id === id) out = x; walk(x.children); } }; walk(draft().sections); return out; };
  const saveNow = async () => { await page.locator("[data-pb-save-now]").click(); await wait(700); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("rien n'est modifié : aucune icône nulle part, même après sélection et ouverture des onglets", async () => {
    await openEditor();
    await pick("btn000000001");
    assert.equal(await on(), 0);
    assert.equal(await cbarRestore(), 0);
    await tab("Style"); assert.equal(await on(), 0);
    await tab("Avancé"); assert.equal(await on(), 0);
    assert.equal(await head().count(), 1, "le bouton existe mais reste invisible");
    assert.equal(await page.locator(".pb-restore.is-on").count(), 0);
  });

  test("un réglage de style modifié montre son icône (et seulement la sienne), ramené à l'enregistré il la perd", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    await setNum("fontSize", 30);
    assert.equal(await rowOn("fontSize"), 1);
    assert.equal(await rowOn("lineHeight"), 0);
    assert.equal(await head().filter({ has: page.locator("xpath=self::*") }).locator("xpath=self::*[contains(@class,'is-on')]").count(), 1, "icône de l'élément");
    assert.equal(await cbarRestore(), 1, "icône sur le canvas");
    await setNum("fontSize", 18);            // la valeur enregistrée
    assert.equal(await rowOn("fontSize"), 0);
    assert.equal(await on(), 0);
    assert.equal(await cbarRestore(), 0);
  });

  test("une couleur écrite autrement mais équivalente n'est pas une modification", async () => {
    await openEditor({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "btn000000001", type: "button", props: { label: "Acheter", url: "/c" }, styles: { desktop: { color: "#FF0000" } } }] }] });
    await pick("btn000000001"); await tab("Style");
    assert.equal(await on(), 0);
  });

  test("restaurer un réglage ne touche pas les autres : texte et taille modifiés, seule la taille revient", async () => {
    await openEditor();
    await pick("btn000000001");
    await setText("Texte", "Commander");
    await tab("Style"); await setNum("fontSize", 40);
    await row("fontSize").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await row("fontSize").locator("input.pb-len-num").inputValue(), "18");
    assert.equal(await rowOn("fontSize"), 0);
    await tab("Contenu");
    assert.equal(await field("Texte").locator("input").first().inputValue(), "Commander");
    assert.equal(await fieldOn("Texte"), 1, "le texte reste signalé");
    assert.equal(await head().locator("xpath=self::*[contains(@class,'is-on')]").count(), 1, "l'élément reste modifié");
  });

  test("un champ de contenu : l'icône suit la saisie, la restauration remet le texte enregistré", async () => {
    await openEditor();
    await pick("btn000000001");
    await setText("Texte", "Autre");
    assert.equal(await fieldOn("Texte"), 1);
    assert.equal(await fieldOn("Adresse"), 0);
    await setText("Texte", "Acheter");
    assert.equal(await fieldOn("Texte"), 0, "la saisie revient à l'enregistré : l'icône disparaît tout de suite");
    await setText("Texte", "Zut");
    await field("Texte").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await field("Texte").locator("input").first().inputValue(), "Acheter");
  });

  test("enregistrement demandé : la référence est mise à jour, les icônes disparaissent, une nouvelle modification les ramène", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    await setNum("fontSize", 26);
    assert.equal(await rowOn("fontSize"), 1);
    await wait(1500);                                                   // l'enregistrement automatique n'efface pas l'icône
    assert.equal(await draftFont(), "26px");
    assert.equal(await rowOn("fontSize"), 1, "après l'enregistrement automatique, l'icône reste");
    await saveNow();
    assert.equal(await rowOn("fontSize"), 0);
    assert.equal(await on(), 0);
    await setNum("fontSize", 27);
    assert.equal(await rowOn("fontSize"), 1);
    await row("fontSize").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await row("fontSize").locator("input.pb-len-num").inputValue(), "26", "retour à la dernière valeur enregistrée");
    function draftFont() { return find("btn000000001").styles.desktop.fontSize; }
  });

  test("un enregistrement qui échoue garde les icônes et ne déplace pas la référence", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    await page.route("**/brouillon", (route) => route.request().method() === "PUT" ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "panne" }) }) : route.continue());
    await setNum("fontSize", 33);
    await page.locator("[data-pb-save-now]").click(); await wait(900);
    assert.equal(await rowOn("fontSize"), 1);
    assert.match(await page.locator("[data-pb-save]").innerText(), /rreur|non enregistr/i);
    await page.unroute("**/brouillon");
    await wait(300);
    await row("fontSize").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await row("fontSize").locator("input.pb-len-num").inputValue(), "18");
  });

  test("écrans séparés : une valeur propre à la tablette se restaure sans toucher l'ordinateur", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    await page.locator('[data-pb-inspector] [data-device="tablet"]').first().click(); await wait(300);
    await setNum("fontSize", 12);
    assert.equal(await rowOn("fontSize"), 1);
    await row("fontSize").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await rowOn("fontSize"), 0);
    assert.equal(find("btn000000001").styles.desktop.fontSize, "18px");
    await wait(1300);
    const st = find("btn000000001").styles;
    assert.ok(!st.tablet || st.tablet.fontSize === undefined, "la valeur tablette est retirée");
  });

  test("un parent : son bouton n'annule pas les enfants sans le dire ; le choix « et ses enfants » les inclut", async () => {
    await openEditor();
    await pick("hed000000001"); await tab("Style"); await setNum("fontSize", 50);
    await pick("box000000001"); await tab("Style");
    await page.locator('[data-pb-inspector] .pb-acc[data-group="border"] > summary').click(); await wait(200);
    await setNum("borderRadius", 12);
    await page.locator("[data-pb-inspector] .pb-insp-head-actions .pb-restore.is-on").first().waitFor({ timeout: 4000 });
    await head().first().click(); await wait(300);
    const menu = await page.locator(".pb-menu").innerText();
    assert.match(menu, /seulement/);
    assert.match(menu, /enfant/);
    await page.locator(".pb-menu button, .pb-menu [role=menuitem]", { hasText: /seulement/ }).first().click(); await wait(400);
    await pick("hed000000001"); await tab("Style");
    assert.equal(await rowOn("fontSize"), 1, "l'enfant garde sa modification");
  });

  test("un élément nouveau (dupliqué) n'a aucune référence : aucune icône ; l'annulation défait une réinitialisation", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style"); await setNum("fontSize", 21);
    await row("fontSize").locator(".pb-restore.is-on").click(); await wait(300);
    assert.equal(await row("fontSize").locator("input.pb-len-num").inputValue(), "18");
    await page.locator("[data-pb-undo]").click(); await wait(300);
    assert.equal(await row("fontSize").locator("input.pb-len-num").inputValue(), "21", "l'annulation rétablit la valeur modifiée");
    assert.equal(await rowOn("fontSize"), 1);
    await page.locator("[data-pb-inspector] [aria-label='Actions de la sélection']").click(); await wait(200);
    await page.locator(".pb-menu button, .pb-menu [role=menuitem]", { hasText: /Dupliquer/ }).first().click(); await wait(500);
    await tab("Style"); await setNum("fontSize", 15);
    assert.equal(await rowOn("fontSize"), 0, "la copie n'a pas de valeur enregistrée");
    assert.equal(await on(), 0);
  });

  test("choisir « et ses enfants » restaure aussi les enfants, en une seule annulation", async () => {
    await openEditor();
    await pick("hed000000001"); await tab("Style"); await setNum("fontSize", 50);
    await pick("box000000001"); await tab("Style");
    await page.locator('[data-pb-inspector] .pb-acc[data-group="border"] > summary').click(); await wait(200);
    await setNum("borderRadius", 12);
    await head().first().click(); await wait(300);
    await page.locator(".pb-menu-item", { hasText: /Cet élément et/ }).first().click(); await wait(400);
    assert.equal(await row("borderRadius").locator("input.pb-len-num").inputValue(), "");
    await pick("hed000000001"); await tab("Style");
    assert.equal(await rowOn("fontSize"), 0);
    assert.equal(await on(), 0);
    await page.locator("[data-pb-undo]").click(); await wait(300);
    await pick("hed000000001"); await tab("Style");
    assert.equal(await rowOn("fontSize"), 1, "une seule annulation rétablit parent et enfant");
    await pick("box000000001"); await tab("Style");
    assert.equal(await row("borderRadius").locator("input.pb-len-num").inputValue(), "12");
  });

  test("un groupe de réglages : son icône ne restaure que les réglages modifiés de ce groupe", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    await setNum("fontSize", 40);                                                  // groupe Typographie
    await page.locator('[data-pb-inspector] .pb-acc[data-group="border"] > summary').click(); await wait(200);
    await setNum("borderRadius", 9);                                               // groupe Bordure
    const gt = page.locator('[data-pb-inspector] .pb-acc[data-group="typography"] > summary .pb-restore.is-on');
    const gb = page.locator('[data-pb-inspector] .pb-acc[data-group="border"] > summary .pb-restore.is-on');
    assert.equal(await gt.count(), 1); assert.equal(await gb.count(), 1);
    assert.equal(await page.locator('[data-pb-inspector] .pb-acc[data-group="size"] > summary .pb-restore.is-on').count(), 0);
    await gt.click(); await wait(300);
    assert.equal(await rowOn("fontSize"), 0);
    assert.equal(await rowOn("borderRadius"), 1, "l'autre groupe reste modifié");
    assert.equal(await page.locator('[data-pb-inspector] .pb-acc[data-group="border"]').getAttribute("open") !== null, true, "le groupe ne s'est pas replié");
  });

  test("l'apparition des icônes ne déplace rien : la ligne garde la même hauteur et le même cadre", async () => {
    await openEditor();
    await pick("btn000000001"); await tab("Style");
    const box = () => page.evaluate(() => { const r = document.querySelector('.pb-prop[data-prop="fontSize"]').getBoundingClientRect(); const i = document.querySelector('.pb-prop[data-prop="fontSize"] input').getBoundingClientRect(); const t = document.querySelector("[data-pb-inspector] .pb-insp-tabs").getBoundingClientRect(); return [r.top - t.top, r.height, i.left, i.width, t.height].map(Math.round); });
    const before = await box();
    await setNum("fontSize", 31);
    assert.equal(await rowOn("fontSize"), 1);
    assert.deepEqual(await box(), before);
  });

  test("document volumineux : sélectionner et modifier reste rapide, rien n'est refait pour les autres éléments", async () => {
    const kids = Array.from({ length: 300 }, (_, i) => ({ id: `bt${String(i).padStart(10, "0")}`, type: "button", props: { label: `B${i}`, url: "/x" }, styles: { desktop: { fontSize: "16px", color: "#112233" } } }));
    await openEditor({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: kids }] }] });
    await pick("bt0000000150"); await tab("Style");
    const ms = await page.evaluate(() => new Promise((res) => { const i = document.querySelector('.pb-prop[data-prop="fontSize"] input.pb-len-num'); const t = performance.now(); i.value = "30"; i.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); requestAnimationFrame(() => res(performance.now() - t)); }));
    assert.ok(ms < 400, `modification en ${Math.round(ms)} ms`);
    await wait(300);
    assert.equal(await rowOn("fontSize"), 1);
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
