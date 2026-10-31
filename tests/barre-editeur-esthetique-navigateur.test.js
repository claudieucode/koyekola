// Refonte esthétique de la barre contextuelle de l'éditeur de pages, dans un VRAI Chrome : contrôles sans contour au repos (pastille de fond),
// aucune commande perdue ni déplacée, focus et valeur conservés après une validation, ajustement « Plus » sans image intermédiaire,
// accordéons stables (mêmes nœuds, gouttière de défilement réservée, chevron sans décalage), mouvement réduit respecté.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : npm install --no-save playwright-core
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

describe("barre contextuelle : refonte esthétique (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const BAR = "[data-pb-context]";
  const fr = () => page.frameLocator("[data-pb-frame]");
  // On passe par l'autre élément d'abord : recliquer sur l'élément déjà sélectionné ouvre l'écriture directe (autre barre)
  const selectNode = async (id) => {
    const other = id === "head00000001" ? "btn000000001" : "head00000001";
    await page.keyboard.press("Escape");
    for (let i = 0; i < 100 && !(await fr().locator(`[data-node-id="${other}"]`).count()); i++) await wait(150); // le canevas se redessine après un changement de largeur
    await fr().locator(`[data-node-id="${other}"]`).first().click({ timeout: 5000 });
    await fr().locator(`[data-node-id="${id}"]`).first().click();
    await page.waitForSelector(`${BAR} select`); await wait(150);
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    const id = Number((await boss.post("/marketing/pages", { name: "Esthétique" })).location.match(/(\d+)$/)[1]);
    const revision = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "btn000000001", type: "button", props: { label: "Acheter", url: "/x" } },
      { id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } }] }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForSelector("[data-pb-frame]");
    await fr().locator('[data-node-id="btn000000001"]').first().waitFor();
    await selectNode("head00000001");
  });
  after(async () => { if (browser) await browser.close(); if (srv) { srv.db().close(); await srv.stop(); } });

  test("aucune commande perdue : tous les réglages d'un titre sont là, dans l'ordre", async () => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await wait(200);
    const labels = await page.$$eval(`${BAR} .pb-ctx-group`, (gs) => gs.map((g) => [...g.querySelectorAll("[aria-label]")].filter((e) => e.matches("select,input,button,.kf-btn")).map((e) => e.getAttribute("aria-label")).join("|")));
    const flat = labels.join("|");
    const order = ["Taille", "Graisse", "Couleur du texte", "Aligner à gauche", "Centrer", "Aligner à droite", "Justifier", "Interligne", "Espacement des lettres", "Casse"];
    let at = -1;
    for (const l of order) { const i = flat.indexOf(l); assert.ok(i > at, `« ${l} » absent ou hors ordre dans : ${flat}`); at = i; }
    assert.equal(await page.locator(`${BAR} .kf-ctx`).count(), 1, "le sélecteur de police est présent");
    assert.equal(await page.locator(`${BAR} .pb-ctx-end .pb-ctx-btn`).innerText(), "Écrire", "« Écrire » reste le dernier groupe");
  });

  test("au repos, les contrôles n'ont pas de contour visible : pastille de fond opaque, hauteur commune de 32 px", async () => {
    const r = await page.$$eval(`${BAR} select, ${BAR} input.pb-ctx-num, ${BAR} .pb-ctx-color, ${BAR} .pb-seg-icons, ${BAR} .pb-ctx-btn, ${BAR} .kf-ctx`, (els) => els.filter((e) => e.offsetParent).map((e) => {
      const cs = getComputedStyle(e); return { c: e.className || e.tagName, border: cs.borderTopColor, bg: cs.backgroundColor, h: Math.round(e.getBoundingClientRect().height) };
    }));
    assert.ok(r.length >= 8, `${r.length} contrôles`);
    for (const x of r) {
      assert.equal(x.h, 32, `${x.c} : ${x.h} px`);
      assert.doesNotMatch(x.bg, /rgba\(.*, 0\)$/, `${x.c} : fond transparent (${x.bg})`);
    }
    const hasBorder = r.filter((x) => x.border !== "rgba(0, 0, 0, 0)" && !/\.pb-ctx-color/.test(x.c));
    assert.deepEqual(hasBorder.map((x) => x.c), [], "contour visible au repos");
  });

  test("le survol assombrit à peine la pastille, sans changer la taille ni la place", async () => {
    const sel = page.locator(`${BAR} select`).first();
    const before = await sel.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, r: JSON.stringify(e.getBoundingClientRect()) }));
    await sel.hover(); await wait(260);
    const after = await sel.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, r: JSON.stringify(e.getBoundingClientRect()) }));
    assert.notEqual(after.bg, before.bg, "le survol doit se voir");
    assert.equal(after.r, before.r, "la géométrie ne bouge pas");
    await page.mouse.move(5, 400);
  });

  test("focus et valeur conservés : taper une taille puis Entrée applique la valeur et garde le champ actif", async () => {
    const size = page.locator(`${BAR} input[aria-label="Taille"]`);
    await size.click(); await size.fill("42"); await page.keyboard.press("Enter");
    await wait(500);
    const a = await page.evaluate(() => ({ label: document.activeElement.getAttribute("aria-label"), val: document.activeElement.value }));
    assert.equal(a.label, "Taille");
    assert.match(a.val, /^42/);
    await fr().locator('[data-node-id="head00000001"]').first().evaluate((e) => getComputedStyle(e).fontSize).then((fs) => assert.equal(fs, "42px"));
  });

  test("« Plus » est ajusté dans la même image : la rangée ne déborde jamais pendant un changement de sélection", async () => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await selectNode("btn000000001"); await wait(200);
    const frames = await page.evaluate(async () => {
      const bar = document.querySelector("[data-pb-context]"), f = document.querySelector("[data-pb-frame]").contentDocument, seen = [];
      const snap = () => seen.push(bar.scrollWidth > bar.clientWidth + 1);
      requestAnimationFrame(snap); requestAnimationFrame(() => requestAnimationFrame(snap));
      f.querySelector('[data-node-id="head00000001"]').dispatchEvent(new MouseEvent("click", { bubbles: true })); // le titre n'est pas un lien : le canevas ne navigue pas
      await new Promise((r) => setTimeout(r, 250));
      return seen;
    });
    assert.deepEqual(frames, [false, false], "une image intermédiaire débordait : " + JSON.stringify(frames));
    await page.setViewportSize({ width: 1600, height: 900 });
  });

  test("accordéons : mêmes nœuds à l'ouverture, aucune reconstruction, gouttière de défilement réservée, chevron sans marge mobile", async () => {
    await selectNode("head00000001");
    await page.getByRole("tab", { name: "Style" }).click();
    await wait(400);
    const r = await page.evaluate(async () => {
      const insp = document.querySelector("[data-pb-inspector]"), accs = [...insp.querySelectorAll("details.pb-acc")], keep = accs.slice();
      let churn = 0; const mo = new MutationObserver((l) => l.forEach((m) => { churn += m.addedNodes.length + m.removedNodes.length; })); mo.observe(insp, { childList: true, subtree: true });
      const widths = new Set([insp.clientWidth]);
      for (const d of accs) { d.querySelector("summary").click(); await new Promise((x) => requestAnimationFrame(() => requestAnimationFrame(x))); widths.add(insp.clientWidth); }
      mo.disconnect();
      const cs = getComputedStyle(insp), chev = getComputedStyle(accs.find((d) => d.open).querySelector("summary"), "::before");
      return { n: accs.length, churn, same: [...insp.querySelectorAll("details.pb-acc")].every((d, i) => d === keep[i]), widths: [...widths], gutter: cs.scrollbarGutter, chevMargin: chev.marginTop };
    });
    assert.ok(r.n >= 4);
    assert.equal(r.churn, 0, "l'inspecteur a été reconstruit à l'ouverture d'un accordéon");
    assert.ok(r.same);
    assert.equal(r.widths.length, 1, "la largeur des champs a bougé : " + r.widths);
    assert.match(r.gutter, /stable/);
    assert.equal(r.chevMargin, "0px", "le chevron change de marge à l'ouverture (décalage de mise en page)");
  });

  test("mouvement réduit : plus aucune transition ni animation dans la barre", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await selectNode("head00000001");
    const r = await page.$$eval(`${BAR} select, ${BAR} .pb-ctx-btn, ${BAR} input.pb-ctx-num`, (els) => els.map((e) => getComputedStyle(e).transitionDuration));
    assert.ok(r.length >= 3);
    for (const d of r) assert.match(d, /^0s(, 0s)*$/, `transition : ${d}`);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("thème sombre : pastilles sombres, texte clair, état actif lisible", async () => {
    await selectNode("head00000001");
    await page.evaluate(() => document.body.setAttribute("data-palette", "dark"));
    await wait(300);
    const d = await page.evaluate((sel) => {
      const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
      const s = document.querySelector(sel + " select"), n = document.querySelector(sel + " input.pb-ctx-num"), name = document.querySelector(sel + " .pb-ctx-name");
      return { selBg: lum(getComputedStyle(s).backgroundColor), selFg: lum(getComputedStyle(s).color), numBg: lum(getComputedStyle(n).backgroundColor), nameFg: lum(getComputedStyle(name).color) };
    }, BAR);
    await page.evaluate(() => document.body.removeAttribute("data-palette"));
    assert.ok(d.selBg < 0.3 && d.numBg < 0.3, `fonds ${d.selBg.toFixed(2)} / ${d.numBg.toFixed(2)}`);
    assert.ok(d.selFg > 0.6 && d.nameFg > 0.5, `textes ${d.selFg.toFixed(2)} / ${d.nameFg.toFixed(2)}`);
  });

  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
