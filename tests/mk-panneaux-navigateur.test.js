// Éditeur d'e-mails — panneaux : sections repliables (état par défaut, mémorisation, tout développer / réduire, valeurs conservées, rien d'enregistré
// dans le message) et apparence des panneaux (Clair, Sombre, Bleu Kolakisa, Personnalisé avec couleurs extrêmes : contrastes mesurés dans Chrome,
// persistance, réinitialisation, canevas et contenu intacts). Chrome réel contre un vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const KW = require("../public/js/page-builder-theme.js");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 100, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("panneaux de l'éditeur d'e-mails (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, id;
  const db = () => srv.db();
  const open = async () => {
    // Même navigateur (mêmes préférences mémorisées) : « ouvrir » = charger de nouveau la page, comme un F5
    if (!context) {
      context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      page = await context.newPage();
      page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    }
    await page.goto(`${srv.base}/marketing/modeles/${id}`);
    await page.waitForSelector("#mk-palette .mk-palette-btn");
    await until(() => page.evaluate(() => { const f = document.getElementById("mk-frame"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.children.length > 0; }), { what: "canevas prêt" });
  };
  const addBlock = async (type) => {
    const group = page.locator(".mk-palette-group:not(#mk-palette-recent)", { has: page.locator(`[data-add="${type}"]`) }).first();
    const toggle = group.locator(".mk-palette-toggle");
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    await group.locator(`[data-add="${type}"]`).first().click();
  };
  const secs = () => page.locator("#mk-props .mk-b-section.is-collapsible");
  const openStates = () => page.evaluate(() => [...document.querySelectorAll("#mk-props .mk-b-section.is-collapsible")].map((s) => [s.querySelector(".mk-sec-label").textContent, s.querySelector(".mk-sec-btn").getAttribute("aria-expanded") === "true"]));
  const template = () => db().prepare("SELECT blocks, theme, version FROM mk_templates WHERE id = ?").get(id);
  // Contraste mesuré : couleur du texte contre le fond réel (en remontant les parents) pour tout texte visible des panneaux
  const audit = async () => { await wait(300); return page.evaluate(auditInPage); };
  const auditInPage = () => {
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
    const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3]));
    const bgOf = (e) => { let stack = []; for (let n = e; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } } let base = [255, 255, 255]; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
    const bad = [];
    const roots = [...document.querySelectorAll(".mk-b-rail, .mk-b-side, .mk-b-props")];
    for (const root of roots) for (const e of root.querySelectorAll("*")) {
      if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      if (e.closest("[hidden], [disabled], [aria-disabled='true'], .mk-b-status")) continue;
      const fg = parse(cs.color); if (!fg) continue;
      const bg = bgOf(e), f = over(fg, bg);
      const L1 = lum(f) + 0.05, L2 = lum(bg) + 0.05, ratio = Math.max(L1, L2) / Math.min(L1, L2);
      if (ratio < 3) bad.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 30)} « ${e.textContent.trim().slice(0, 24)} » ${ratio.toFixed(2)}`);
    }
    // Icônes : couleur du trait (currentColor) contre le fond, au moins 3:1 (élément graphique)
    for (const root of roots) for (const e of root.querySelectorAll("svg")) {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (r.width < 4 || cs.display === "none" || cs.visibility === "hidden" || e.closest("[hidden], [disabled], [aria-disabled='true']")) continue;
      const stroke = cs.stroke && cs.stroke !== "none" ? cs.stroke : cs.color, fg = parse(stroke) || parse(cs.color);
      if (!fg) continue;
      const bg = bgOf(e), f = over(fg, bg), L1 = lum(f) + 0.05, L2 = lum(bg) + 0.05, ratio = Math.max(L1, L2) / Math.min(L1, L2);
      if (ratio < 3) bad.push(`icône ${(e.closest("button") && e.closest("button").getAttribute("aria-label")) || e.parentElement.className} ${ratio.toFixed(2)}`);
    }
    return bad;
  };
  const frameLook = () => page.evaluate(() => { const f = document.getElementById("mk-frame"), d = f.contentDocument; return { bg: getComputedStyle(d.body).backgroundColor, scroll: [d.scrollingElement.scrollTop, d.scrollingElement.scrollLeft], box: JSON.stringify(f.getBoundingClientRect()), html: d.body.innerHTML.length }; });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/modeles", { name: "Panneaux", starter: "blank", kind: "marketing" })).location.match(/(\d+)$/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
    await open();
    await addBlock("button");
    await until(() => page.evaluate(() => document.getElementById("mk-frame").contentDocument.querySelectorAll("[data-mk-block]").length >= 1), { what: "bloc ajouté" });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("sections du panneau droit : titre = vrai bouton aria-expanded, première ouverte, autres fermées, mémorisation, changement de bloc", async () => {
    await page.frameLocator("#mk-frame").locator("[data-mk-block]").first().click();
    await page.locator("#mk-ptab-styles, #mk-tab-styles").first().click();
    await until(async () => (await secs().count()) >= 2, { what: "sections du bloc" });
    const states = await openStates();
    assert.equal(states[0][1], true, "première section ouverte"); assert.ok(states.slice(1).every((s) => s[1] === false), "les autres sont fermées : " + JSON.stringify(states));
    const btn = secs().nth(1).locator(".mk-sec-btn");
    assert.equal(await btn.evaluate((b) => b.tagName), "BUTTON");
    const bodyId = await btn.getAttribute("aria-controls");
    assert.equal(await page.locator(`#${bodyId}`).isHidden(), true);
    await btn.click();
    assert.equal(await btn.getAttribute("aria-expanded"), "true"); assert.equal(await page.locator(`#${bodyId}`).isVisible(), true);
    await btn.focus(); await page.keyboard.press("Space");
    assert.equal(await btn.getAttribute("aria-expanded"), "false", "clavier : espace");
    await page.keyboard.press("Enter");
    assert.equal(await btn.getAttribute("aria-expanded"), "true", "clavier : entrée");
    // la mémoire : fermer la 1re, aller sur l'onglet Contenu puis revenir ; recharger la page
    await secs().first().locator(".mk-sec-btn").click();
    await page.locator("#mk-tab-content").click(); await page.locator("#mk-tab-styles").click();
    const again = await openStates();
    assert.equal(again[0][1], false, "section fermée : le reste fermée après changement d'onglet"); assert.equal(again[1][1], true);
    await open(); await page.frameLocator("#mk-frame").locator("[data-mk-block]").first().click(); await page.locator("#mk-tab-styles").click();
    await until(async () => (await secs().count()) >= 2, { what: "sections après F5" });
    assert.deepEqual((await openStates()).map((s) => s[1]).slice(0, 2), [false, true], "mémorisé après rechargement");
  });
  test("tout développer / tout réduire ; valeurs conservées section fermée ; rien d'enregistré dans le message ; canevas immobile", async () => {
    const before = template(), look0 = await frameLook(), status0 = await page.locator("#mk-status").getAttribute("data-state");
    await page.locator("#mk-props .mk-sec-all", { hasText: "Tout développer" }).click();
    assert.ok((await openStates()).every((s) => s[1]), "tout ouvert");
    // une valeur saisie reste quand la section est repliée puis rouverte
    const input = page.locator("#mk-props .mk-sec-body:visible input[type='number']").first();
    if (await input.count()) { const v = await input.inputValue(); await page.locator("#mk-props .mk-sec-all", { hasText: "Tout réduire" }).click(); assert.ok((await openStates()).every((s) => !s[1]), "tout fermé"); await page.locator("#mk-props .mk-sec-all", { hasText: "Tout développer" }).click(); assert.equal(await page.locator("#mk-props .mk-sec-body:visible input[type='number']").first().inputValue(), v); }
    else { await page.locator("#mk-props .mk-sec-all", { hasText: "Tout réduire" }).click(); assert.ok((await openStates()).every((s) => !s[1])); }
    assert.deepEqual(template(), before, "le message enregistré n'a pas changé");
    assert.equal(await page.locator("#mk-status").getAttribute("data-state"), status0, "aucune modification créée par l'ouverture / fermeture");
    const look1 = await frameLook();
    assert.deepEqual(look1, look0, "canevas : défilement, position et contenu inchangés");
  });
  test("panneau gauche : volets Styles et Message en sections repliables, première ouverte", async () => {
    await page.locator("#tab-styles").click();
    const st = await page.evaluate(() => [...document.querySelectorAll("#pane-styles .mk-b-section.is-collapsible")].map((s) => s.querySelector(".mk-sec-btn").getAttribute("aria-expanded") === "true"));
    assert.deepEqual(st, [true, false, false]);
    assert.ok(await page.locator("#pane-styles .mk-sec-all").first().isVisible());
    await page.locator("#pane-styles .mk-sec-btn", { hasText: "Typographie" }).click();
    assert.equal(await page.locator("#t-font").isVisible(), true, "le sélecteur de police apparaît dans la section ouverte");
    await page.locator("#tab-blocks").click();
    assert.ok(await page.locator("#mk-palette .mk-palette-toggle").count() > 2, "palette : catégories repliables d'origine conservées");
  });
  test("apparence : 4 modes appliqués aux seuls panneaux ; canevas et message intacts ; persistance ; réinitialisation", async () => {
    const t0 = template(), look0 = await frameLook();
    const bgOf = (sel) => page.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor, sel);
    const light = await bgOf(".mk-b-side");
    await page.locator("#mk-panel-theme").click();
    const skins = page.locator(".mk-pt-skin");
    assert.deepEqual(await skins.allTextContents(), ["Clair", "Sombre", "Bleu Kolakisa", "Personnalisé"]);
    for (const name of ["Sombre", "Bleu Kolakisa", "Personnalisé"]) {
      await page.locator(".mk-pt-skin", { hasText: name }).click();
      const side = await bgOf(".mk-b-side"), props = await bgOf(".mk-b-props"), rail = await bgOf(".mk-b-rail");
      assert.notEqual(side, light, `${name} : panneau gauche modifié`); assert.equal(side, props, `${name} : même surface des deux panneaux`); assert.notEqual(rail, "rgba(0, 0, 0, 0)");
      assert.deepEqual(await frameLook(), look0, `${name} : canevas intact`);
      assert.deepEqual(template(), t0, `${name} : message intact`);
      assert.deepEqual(await audit(), [], `${name} : textes lisibles`);
    }
    // persistance : F5
    await page.locator(".mk-pt-skin", { hasText: "Bleu Kolakisa" }).click();
    await page.keyboard.press("Escape");
    await open();
    assert.notEqual(await bgOf(".mk-b-side"), light, "thème conservé après F5");
    assert.equal(await page.evaluate(() => document.querySelector(".mk-b-side").getAttribute("data-mk-themed")), "dark");
    // réinitialiser
    await page.locator("#mk-panel-theme").click();
    await page.locator(".mk-pt-reset").click();
    assert.equal(await bgOf(".mk-b-side"), light, "retour à l'apparence d'origine");
    assert.equal(await page.evaluate(() => document.querySelector(".mk-b-side").hasAttribute("data-mk-themed")), false);
    assert.deepEqual(errors, []);
  });
  test("personnalisé : couleurs extrêmes (blanc, noir, gris, bleus, rouge, vert, jaune, saturées) → texte et accent toujours lisibles", async () => {
    const cases = [["#ffffff", "#ffffff"], ["#000000", "#000000"], ["#808080", "#808080"], ["#dbeafe", "#bfdbfe"], ["#0a1f44", "#0b3d91"], ["#ff0000", "#ff0000"], ["#00a000", "#00ff00"], ["#ffff00", "#ffff00"], ["#ff00ff", "#00ffff"], ["#7a7a00", "#ffd700"]];
    if (await page.locator(".mk-pt-pop").isHidden()) await page.locator("#mk-panel-theme").click();
    await page.locator(".mk-pt-skin", { hasText: "Personnalisé" }).click();
    for (const [panel, accent] of cases) {
      await page.evaluate(([p, a]) => { const [pc, ac] = document.querySelectorAll(".mk-pt-color"); for (const [el, v] of [[pc, p], [ac, a]]) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); } }, [panel, accent]);
      const bad = await audit();
      assert.deepEqual(bad, [], `panneau ${panel} / accent ${accent} : ${bad.slice(0, 3).join(" | ")}`);
      // calcul pur du générateur : textes ≥ 4,5:1 (7:1 quand le fond le permet), accent visible ≥ 3:1, texte sur accent ≥ 4,5:1
      const r = KW.derive({ accent, panel }).report;
      assert.ok(r.text >= 4.5 && r.secondary >= 4.5 && r.accent >= 3 && r.onAccent >= 4.5, `${panel}/${accent} : ${JSON.stringify(r)}`);
    }
    await page.evaluate(() => { const t = document.querySelectorAll(".mk-pt-color")[2]; t.value = "#ff0000"; t.dispatchEvent(new Event("input", { bubbles: true })); });
    assert.deepEqual(await audit(), [], "texte choisi trop proche du fond : corrigé automatiquement");
    await page.locator(".mk-pt-reset").click();
    assert.deepEqual(errors, []);
  });
});
