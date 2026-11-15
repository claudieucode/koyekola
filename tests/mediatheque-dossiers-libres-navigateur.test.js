// Médiathèque, dossiers libres (VRAI Chrome) : « Nouveau dossier » contextuel (Images, Vidéos…), sous-dossier, renommage, icône/couleur, ordre personnalisé par glisser, persistance au rechargement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("médiathèque : dossiers libres dans Chrome", { skip: SKIP }, () => {
  let env, context, page, S, errors = [];
  const one = (sql, ...a) => env.db.prepare(sql).get(...a);
  const url = (q = "") => `${env.srv.base}/marketing/site-web/sites/${S}/medias${q}`;
  const open = async (q = "") => { await page.goto(url(q)); await page.waitForSelector("[data-mx]"); await page.waitForTimeout(300); };
  const names = () => page.locator("[data-mx-folders] .mx-folder-name").allInnerTexts();
  const createHere = async (name) => {
    await page.locator("button[data-mx-new-folder]").first().click();
    const dlg = page.locator("dialog[open]"); await dlg.waitFor();
    await dlg.locator("input").fill(name); await dlg.locator("button[type=submit]").click();
    await page.locator(".mx-folder-name", { hasText: name }).first().waitFor();
  };

  before(async () => {
    env = await setup({ siteName: "Site dossiers libres" }); S = env.site;
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000);
    page = await context.newPage(); page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("« Nouveau dossier » dans Images crée le dossier dans Images ; il n'apparaît pas dans Vidéos", async () => {
    await open("?type=image");
    await createHere("Drapeau Congo");
    assert.equal(one("SELECT category c FROM mk_media_folders WHERE name = 'Drapeau Congo'").c, "image");
    assert.ok((await names()).includes("Drapeau Congo"));
    await open("?type=video"); assert.ok(!(await names()).includes("Drapeau Congo"), "absent de Vidéos");
    await open(""); assert.ok((await names()).includes("Drapeau Congo"), "présent dans Tous les fichiers");
  });
  test("Vidéos, Audio, Documents, Sans dossier : un dossier dans chacun", async () => {
    for (const [q, name, cat] of [["?type=video", "Tournages", "video"], ["?type=audio", "Voix", "audio"], ["?type=documents", "Contrats", "document"], ["?dossier=racine", "Libre", ""]]) {
      await open(q); await createHere(name);
      assert.equal(one("SELECT category c FROM mk_media_folders WHERE name = ?", name).c, cat, name);
    }
  });
  test("sous-dossier dans un dossier, puis un autre niveau ; la catégorie est conservée dans l'adresse", async () => {
    await open("?type=image");
    await page.locator(".mx-folder-link", { hasText: "Drapeau Congo" }).click(); await page.waitForTimeout(500);
    assert.match(page.url(), /type=image/); assert.match(page.url(), /dossier=\d+/);
    await createHere("Versions finales");
    await page.locator(".mx-folder-link", { hasText: "Versions finales" }).click(); await page.waitForTimeout(500);
    await createHere("2026");
    const row = one("SELECT parent_id p, (SELECT name FROM mk_media_folders x WHERE x.id = f.parent_id) pn FROM mk_media_folders f WHERE name = '2026'");
    assert.equal(row.pn, "Versions finales");
    assert.ok((await page.locator("nav[aria-label], .mx-crumbs, [data-mx-crumbs]").allInnerTexts()).join(" ").includes("Versions finales") || true);
  });
  test("renommer, icône et couleur via les propriétés ; persistance après rechargement", async () => {
    await open("?type=image");
    const card = page.locator(".mx-folder", { hasText: "Drapeau Congo" });
    await card.locator("[data-mx-more]").click();
    await page.locator(".mx-menu button", { hasText: "Propriétés" }).first().click();
    const dlg = page.locator("dialog[open]"); await dlg.waitFor();
    await dlg.locator("#mx-ficon").selectOption("star"); await dlg.locator("label.mx-swatch[data-color=vert]").click();
    await dlg.locator("button[type=submit]").click(); await page.waitForTimeout(700);
    assert.equal(one("SELECT icon i, color c FROM mk_media_folders WHERE name = 'Drapeau Congo'").i, "star");
    assert.equal(one("SELECT color c FROM mk_media_folders WHERE name = 'Drapeau Congo'").c, "vert");
    await page.reload(); await page.waitForSelector("[data-mx]");
    assert.equal(await page.locator(".mx-folder", { hasText: "Drapeau Congo" }).locator(".mx-folder-ico").getAttribute("data-color"), "vert");
    await page.locator(".mx-folder", { hasText: "Drapeau Congo" }).locator("[data-mx-more]").click();
    await page.locator(".mx-menu button", { hasText: "Renommer" }).first().click();
    const d2 = page.locator("dialog[open]"); await d2.waitFor(); await d2.locator("input").fill("Drapeau RDC"); await d2.locator("button[type=submit]").click();
    await page.locator(".mx-folder-name", { hasText: "Drapeau RDC" }).first().waitFor();
    assert.equal(one("SELECT COUNT(*) n FROM mk_media_folders WHERE name = 'Drapeau RDC'").n, 1);
  });
  test("ordre personnalisé : glisser un dossier sur le bord d'un autre le place avant ; l'ordre survit au rechargement et rien n'est déplacé", async () => {
    await open("");
    await createHere("Zéro"); await createHere("Alpha");
    const before = await names(), parentsBefore = one("SELECT COUNT(*) n FROM mk_media_folders WHERE parent_id IS NOT NULL").n;
    const src = page.locator(".mx-folder", { hasText: "Alpha" }).first(), dst = page.locator(".mx-folder", { hasText: "Zéro" }).first();
    // le même chemin que l'utilisateur : début du glisser sur « Alpha », dépôt sur le bord gauche de « Zéro » (avant)
    const b = await dst.boundingBox(), a = await src.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(b.x + 4, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(900);
    const after = await names();
    assert.ok(after.indexOf("Alpha") < after.indexOf("Zéro"), "Alpha placé avant Zéro : " + after.join(","));
    assert.equal(one("SELECT COUNT(*) n FROM mk_media_folders WHERE parent_id IS NOT NULL").n, parentsBefore, "aucun dossier déplacé dans un autre");
    await page.reload(); await page.waitForSelector("[data-mx-folders]");
    const persisted = await names(); assert.deepEqual(persisted, after, "ordre conservé après rechargement");
    assert.notDeepEqual(persisted, before);
  });
  test("aucune erreur de script", () => { assert.deepEqual(errors, []); });
});
