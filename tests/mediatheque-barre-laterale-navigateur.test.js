// Médiathèque (VRAI Chrome) : bouton unique de la barre latérale (replier / déployer sans jamais le perdre), renommage d'un dossier principal et d'un sous-dossier,
// thème bleu marine, apparence personnalisée enregistrée par personne et par site. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("médiathèque : barre latérale, renommage et apparence (Chrome)", { skip: SKIP }, () => {
  let env, context, page, S, L, errors = [];
  const F = {};
  const one = (sql, ...a) => env.db.prepare(sql).get(...a);
  const api = (url, json) => env.boss.request(`${L}${url}?site=${S}`, { method: "POST", json });
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForTimeout(300); };
  const sideW = () => page.evaluate(() => Math.round(document.querySelector("[data-mx-side]").getBoundingClientRect().width));
  const mainW = () => page.evaluate(() => Math.round(document.querySelector(".mx-main").getBoundingClientRect().width));
  const state = () => page.getAttribute("[data-mx]", "data-sidebar");

  before(async () => {
    env = await setup({ siteName: "Site barre latérale" }); S = env.site; L = "/marketing/site-web/mediatheque";
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    F.a = JSON.parse((await api("/dossiers", { name: "Drapeau Congo" })).text).folder.id;
    F.b = JSON.parse((await api("/dossiers", { name: "Logos", parent_id: F.a })).text).folder.id;
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("une seule icône de contrôle sur ordinateur : celle du titre est masquée, celle de la barre latérale reste visible", async () => {
    await open();
    assert.equal(await page.locator(".mx-side-mobile").isVisible(), false, "plus d'icône à côté du titre sur ordinateur");
    const b = page.locator("[data-mx-side-collapse]");
    assert.equal(await b.isVisible(), true);
    assert.equal(await b.getAttribute("aria-expanded"), "true");
    assert.match(await b.getAttribute("aria-label"), /Replier/);
  });

  test("replier / déployer 8 fois de suite : le bouton reste visible, dans l'écran, la barre retrouve sa largeur, le contenu récupère l'espace", async () => {
    await open();
    const wOpen = await sideW(), mOpen = await mainW();
    assert.ok(wOpen > 200, `largeur ouverte ${wOpen}`);
    const b = page.locator("[data-mx-side-collapse]");
    for (let i = 0; i < 8; i++) {
      await b.click(); await page.waitForTimeout(260);
      const rail = i % 2 === 0;
      assert.equal(await state(), rail ? "rail" : "open", `étape ${i}`);
      const box = await b.boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1440 && box.height > 20, "bouton visible et dans l'écran");
      assert.equal(await b.isVisible(), true);
      assert.equal(await b.getAttribute("aria-expanded"), rail ? "false" : "true");
      if (rail) { assert.ok((await sideW()) < 100, "bande repliée"); assert.ok((await mainW()) > mOpen + 150, "le contenu récupère l'espace"); }
      else { assert.equal(await sideW(), wOpen); assert.equal(await mainW(), mOpen); }
    }
  });

  test("l'état replié est mémorisé et le bouton reste accessible après rechargement ; Cmd/Ctrl + B fait la même chose", async () => {
    await open();
    await page.click("[data-mx-side-collapse]"); await page.waitForTimeout(700);
    await open();
    assert.equal(await state(), "rail");
    assert.equal(await page.locator("[data-mx-side-collapse]").isVisible(), true);
    await page.keyboard.press("Control+b"); await page.waitForTimeout(300);
    assert.equal(await state(), "open");
  });

  test("un ancien réglage « masquée » est converti en bande repliée (bouton jamais perdu)", async () => {
    await page.waitForTimeout(900); // laisse partir l'enregistrement différé du test précédent
    await api("/preferences", { sidebar: "hidden" });
    await open();
    assert.equal(await state(), "rail");
    assert.equal(await page.locator("[data-mx-side-collapse]").isVisible(), true);
    await api("/preferences", { sidebar: "open" });
  });

  test("renommer un dossier principal et un sous-dossier : menu clic droit sur l'arbre, résultat en base et à l'écran", async () => {
    await open();
    const row = page.locator(`.mx-tree-row[data-mx-folder="${F.a}"]`);
    await row.click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Renommer" }).click();
    const dlg = page.locator("dialog[open], [role=dialog]").last();
    await dlg.locator("input[type=text]").fill("Drapeau RDC"); await dlg.locator("button[type=submit]").click(); await page.waitForTimeout(800);
    assert.equal(one("SELECT name n FROM mk_media_folders WHERE id = ?", F.a).n, "Drapeau RDC");
    assert.equal(await page.locator(`.mx-tree-row[data-mx-folder="${F.a}"]`).getAttribute("data-name"), "Drapeau RDC");
    // sous-dossier
    await open(`?dossier=${F.a}`);
    const sub = page.locator(`.mx-tree-row[data-mx-folder="${F.b}"]`);
    await sub.click({ button: "right" });
    await page.locator(".mx-menu button", { hasText: "Renommer" }).click();
    const dlg2 = page.locator("dialog[open], [role=dialog]").last();
    await dlg2.locator("input[type=text]").fill("Versions horizontales"); await dlg2.locator("button[type=submit]").click(); await page.waitForTimeout(800);
    assert.equal(one("SELECT name n FROM mk_media_folders WHERE id = ?", F.b).n, "Versions horizontales");
  });

  test("thème : barre latérale bleu marine par défaut ; une couleur choisie est appliquée en direct, enregistrée et retrouvée après rechargement ; réinitialiser rétablit", async () => {
    await open();
    const bg = () => page.evaluate(() => getComputedStyle(document.querySelector("[data-mx-side]")).backgroundColor);
    assert.equal(await bg(), "rgb(13, 34, 56)", "bleu marine par défaut");
    await page.click("[data-mx-theme] > summary"); await page.waitForTimeout(150);
    await page.locator('[data-mx-theme-color="sideBg"]').fill("#123456"); await page.waitForTimeout(200);
    assert.equal(await bg(), "rgb(18, 52, 86)", "aperçu en direct");
    await page.locator('[data-mx-theme-range="radius"]').fill("14"); await page.waitForTimeout(900);
    const saved = JSON.parse(one("SELECT data d FROM mk_media_prefs LIMIT 1").d).theme;
    assert.equal(saved.colors.sideBg, "#123456"); assert.equal(saved.radius, 14); assert.equal(saved.mode, "personnalise");
    await open();
    assert.equal(await bg(), "rgb(18, 52, 86)", "persistance après actualisation");
    await page.click("[data-mx-theme] > summary"); await page.click("[data-mx-theme-reset]"); await page.waitForTimeout(900);
    assert.equal(await bg(), "rgb(13, 34, 56)");
    assert.deepEqual(JSON.parse(one("SELECT data d FROM mk_media_prefs LIMIT 1").d).theme.colors, {});
  });

  test("valeurs refusées par le serveur : couleur invalide ignorée, rayon borné", async () => {
    await api("/preferences", { theme: { mode: "personnalise", colors: { sideBg: "javascript:alert(1)", text: "#ABCDEF" }, radius: 999, space: 1, iconSize: 3 } });
    const t = JSON.parse(one("SELECT data d FROM mk_media_prefs LIMIT 1").d).theme;
    assert.deepEqual(t.colors, { text: "#abcdef" }); assert.equal(t.radius, 20); assert.equal(t.space, 80); assert.equal(t.iconSize, 14);
    await api("/preferences", { theme: { mode: "clair", colors: {} } });
  });

  test("responsive : tablette sans débordement, téléphone en tiroir avec icône d'ouverture visible et fermeture accessible", async () => {
    try {
      await page.setViewportSize({ width: 820, height: 900 }); await open();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "tablette");
      await page.setViewportSize({ width: 390, height: 800 }); await open();
      assert.equal(await page.locator(".mx-side-mobile").isVisible(), true, "icône d'ouverture visible sur téléphone");
      for (let i = 0; i < 3; i++) {
        await page.click(".mx-side-mobile"); await page.waitForTimeout(350);
        assert.equal(await page.locator("[data-mx-side]").isVisible(), true, "tiroir ouvert");
        await page.click("[data-mx-side-collapse]"); await page.waitForTimeout(350);
        assert.equal(await page.locator("[data-mx-side]").isVisible(), false, "tiroir fermé par le bouton de la barre");
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), true, "téléphone");
    } finally { await page.setViewportSize({ width: 1440, height: 900 }); }
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
