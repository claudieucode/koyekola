// États au survol pour davantage de types, accélération des transitions, dimensions intrinsèques (fit-content, min-content, max-content) :
// du contrôle de l'inspecteur jusqu'au rendu du canevas, à l'enregistrement, au rechargement, à Annuler / Rétablir et à la page publiée. Vrai Chrome.
// Le serveur n'accepte QUE ces trois mots-clés (liste fermée) : calc(), clamp() et le CSS libre restent refusés.
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
const mod = process.platform === "darwin" ? "Meta" : "Control";
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", styles: { desktop: { display: "block" } }, children: [{ id: "head00000001", type: "heading", props: { text: "Court", level: "3" } }] },
  { id: "head00000002", type: "heading", props: { text: "Un titre", level: "2" } },
] }] };

describe("contrôles complétés : états, accélération, dimensions intrinsèques (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, pageId, errors;
  const until = async (fn, what, ms = 8000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error("délai dépassé : " + what); await wait(80); } };
  const draftNode = (id) => { const f = (ns) => { for (const n of ns || []) { if (n.id === id) return n; const x = f(n.children); if (x) return x; } return null; }; const r = srv.db().prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(pageId); return f(JSON.parse(r.draft || "null").sections); };
  const open = async () => {
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, null, { timeout: 30000 });
    await wait(1000);
  };
  const pick = async (id) => {
    await page.evaluate((id) => document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(), id); await wait(450);
    await page.evaluate(() => { const t = [...document.querySelectorAll(".pb-inspector [role=tab]")].find((x) => /^Style/.test(x.textContent.trim())); if (t) t.click(); }); await wait(300);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; })); await wait(300);
  };
  const computed = (id, prop) => page.evaluate(([id, prop]) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${id}"]`); return getComputedStyle(e)[prop]; }, [id, prop]);
  const field = (prop) => page.locator(`.pb-inspector .pb-style-field[data-prop="${prop}"]`).first();
  const saved = () => until(() => page.evaluate(() => /Enregistré/.test(document.querySelector("[data-pb-save]").textContent)), "enregistrement");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    pageId = Number((await boss.post("/marketing/pages", { name: "Contrôles" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT }, headers: { Origin: srv.base } })).status, 200);
    await open();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("états : un titre propose « Survol » ; une valeur réglée au survol est enregistrée, rechargée, annulable et publiée", async () => {
    await pick("head00000002");
    const seg = page.locator(".pb-state-seg");
    assert.equal(await seg.count(), 1, "sélecteur d'état présent pour un titre");
    assert.deepEqual((await seg.locator("button").allTextContents()).map((t) => t.trim()), ["Normal", "Survol"], "survol seulement (pas de focus ni de clic pour un texte)");
    await seg.locator("button", { hasText: "Survol" }).click(); await wait(400);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details.pb-acc").forEach((d) => { d.open = true; })); await wait(300);
    const num = field("opacity").locator("input:not([type=range])").first();
    await num.scrollIntoViewIfNeeded(); await num.fill("0.5"); await num.press("Enter");
    await until(() => (draftNode("head00000002").states || {}).hover?.opacity === 0.5, "états.hover.opacity enregistré");
    assert.equal(draftNode("head00000002").styles?.desktop?.opacity, undefined, "la valeur normale n'a pas été touchée");
    await page.keyboard.press(`${mod}+z`).catch(() => {});
    await open(); await pick("head00000002");
    await page.locator(".pb-state-seg button", { hasText: "Survol" }).click(); await wait(300);
    assert.equal(await field("opacity").locator("input:not([type=range])").first().inputValue(), "0.5", "valeur au survol conservée après rechargement");
    const html = await (async () => { assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200); return (await boss.get(`/p/${srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug}`)).text; })();
    assert.ok(/\.kw-n-head00000002:hover\{opacity:0\.5\}/.test(html), "règle :hover dans la page publiée");
  });

  test("accélération : le choix est enregistré, appliqué au rendu du canevas et recharge identique", async () => {
    await open(); // la publication a changé la révision : on rouvre l'éditeur
    await pick("cont00000001");
    const dur = field("transitionDuration").locator("input:not([type=range])").first();
    await dur.scrollIntoViewIfNeeded(); await dur.fill("300"); await dur.press("Enter");
    await until(() => draftNode("cont00000001").styles?.desktop?.transitionDuration === 300, "durée enregistrée");
    const sel = field("transitionEasing").locator("select").first();
    await sel.scrollIntoViewIfNeeded(); await sel.selectOption("linear");
    await until(() => draftNode("cont00000001").styles?.desktop?.transitionEasing === "linear", "accélération enregistrée");
    await until(async () => /linear/.test(await computed("cont00000001", "transitionTimingFunction")), "rendu : transition-timing-function = linear");
    await open(); await pick("cont00000001");
    assert.equal(await field("transitionEasing").locator("select").first().inputValue(), "linear", "rechargé");
  });

  test("dimensions intrinsèques : fit-content réduit vraiment la boîte ; min/max-content ; « auto » et les nombres fonctionnent comme avant", async () => {
    await open(); await pick("cont00000001");
    const unit = field("width").locator("select").first();
    const options = await unit.locator("option").allTextContents();
    for (const kw of ["auto", "fit-content", "min-content", "max-content"]) assert.ok(options.includes(kw), `option ${kw}`);
    const before = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').getBoundingClientRect().width);
    await unit.scrollIntoViewIfNeeded(); await unit.selectOption("fit-content");
    await until(() => draftNode("cont00000001").styles?.desktop?.width === "fit-content", "width: fit-content enregistré");
    const after = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').getBoundingClientRect().width);
    assert.ok(after < before - 20 && after > 0, `la boîte se réduit à son contenu (${Math.round(before)} → ${Math.round(after)} px)`);
    // min-content dans « Largeur min. » par la liste, puis saisie directe du mot-clé dans « Largeur max. »
    const minU = field("minWidth").locator("select").first(); await minU.scrollIntoViewIfNeeded(); await minU.selectOption("min-content");
    await until(() => draftNode("cont00000001").styles?.desktop?.minWidth === "min-content", "min-width: min-content");
    const maxIn = field("maxWidth").locator("input:not([type=range])").first(); await maxIn.scrollIntoViewIfNeeded(); await maxIn.fill("max-content"); await maxIn.press("Enter");
    await until(() => draftNode("cont00000001").styles?.desktop?.maxWidth === "max-content", "max-width: max-content saisi");
    // annuler / rétablir
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press(`${mod}+z`); await until(() => draftNode("cont00000001").styles?.desktop?.maxWidth === undefined, "annuler");
    await page.keyboard.press(`${mod}+Shift+z`); await until(() => draftNode("cont00000001").styles?.desktop?.maxWidth === "max-content", "rétablir");
    // rechargement : valeurs et affichage fidèles
    await saved(); await open(); await pick("cont00000001");
    assert.equal(await field("width").locator("select").first().inputValue(), "fit-content");
    assert.equal(await field("minWidth").locator("select").first().inputValue(), "min-content");
    // retour à « auto » puis à un nombre : comportement inchangé
    const unit2 = field("width").locator("select").first(); await unit2.selectOption("auto");
    await until(() => draftNode("cont00000001").styles?.desktop?.width === "auto", "auto");
    await unit2.selectOption("px"); const wIn = field("width").locator("input:not([type=range])").first(); await wIn.fill("320"); await wIn.press("Enter");
    await until(() => draftNode("cont00000001").styles?.desktop?.width === "320px", "320px");
    // width: 320px est plafonné par max-width: max-content (le contenu est court) : le rendu obéit bien aux DEUX réglages
    await until(async () => { const w = parseFloat(await computed("cont00000001", "width")); return w > 0 && w < 320; }, "rendu : largeur plafonnée par max-content");
  });

  test("publication : mots-clés dans la page publiée ; le serveur refuse calc(), clamp() et le CSS libre", async () => {
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
    const pub = (await boss.get(`/p/${srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug}`)).text;
    assert.ok(/min-width:min-content/.test(pub) && /max-width:max-content/.test(pub), "mots-clés présents dans le CSS publié");
    for (const bad of ["calc(100% - 10px)", "clamp(1px, 2px, 3px)", "fit-content(10px)", "inherit"]) {
      const content = JSON.parse(JSON.stringify(CONTENT)); content.sections[0].children[0].styles = { desktop: { width: bad } };
      const r = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision, content }, headers: { Origin: srv.base } });
      assert.notEqual(r.status, 200, `refusé : ${bad}`);
    }
  });

  test("aucune erreur JavaScript", () => assert.deepEqual(errors, []));
});
