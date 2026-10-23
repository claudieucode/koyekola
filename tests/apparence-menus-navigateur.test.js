// KOLAKISA CMS — Apparence → Menus dans un VRAI Chrome (Playwright, ignoré sans) : créer, ajouter par la recherche, glisser-déposer à la souris, boutons et clavier (Alt + flèches),
// options d'un élément, retrait / annulation, enregistrement groupé, échec réseau et serveur, conflit de version, protection à la fermeture, aperçu, emplacements,
// rendu public, téléphone (390 px), lecture seule, menu volumineux. Aucune erreur JavaScript sur tout le parcours.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("menus (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, menuId, orgId;
  const NAV = "/marketing/site-web/navigation";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const open = async (width = 1280, client = boss) => {
    const context = await browser.newContext({ viewport: { width, height: 1200 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000); // un contrôle introuvable échoue vite (au lieu d'attendre 30 s)
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const edit = async (page, id = menuId) => { await page.goto(`${srv.base}${NAV}/menus/${id}`); await page.locator("[data-nm-layout]:not([hidden])").waitFor(); };
  const rows = (page) => page.locator(".mk-nm-item > .mk-nm-row .mk-nm-label");
  const names = async (page) => (await rows(page).allTextContents()).map((t) => t.trim());
  const depths = (page) => page.evaluate(() => [...document.querySelectorAll(".mk-nm-item")].map((li) => Number(li.getAttribute("aria-level"))));
  const dbTree = (id = menuId) => all("SELECT i.id, i.parent_id, i.position, i.type, i.label, i.url, i.object_id FROM nav_items i WHERE i.menu_id = ? ORDER BY COALESCE(i.parent_id, 0), i.position", id);
  const openPanel = async (li) => { const t = li.locator(":scope > .mk-nm-row .mk-nm-toggle"); if ((await t.getAttribute("aria-expanded")) !== "true") await t.click(); };
  const top = (page, n) => page.locator(".mk-nm-tree > .mk-nm-item").nth(n);
  const state = (page) => page.locator("[data-nm-state]").innerText();
  const saveClick = async (page) => { await Promise.all([page.waitForResponse((r) => r.url().includes("/enregistrer")), page.click("[data-nm-save]")]); await page.waitForFunction(() => /enregistré à|Aucune modification/.test(document.querySelector("[data-nm-state]").textContent)); };
  const handleOf = (page, n) => page.locator(".mk-nm-item").nth(n).locator(":scope > .mk-nm-row [data-act=drag]");
  // glisser-déposer à la souris (même séquence qu'un utilisateur) : poignée de la ligne « from » vers la ligne « to », à une fraction de sa hauteur
  async function dnd(page, from, to, frac) {
    const h = await handleOf(page, from).boundingBox(), t = await page.locator(".mk-nm-item").nth(to).locator(":scope > .mk-nm-row").boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 8, { steps: 3 });
    await page.mouse.move(t.x + t.width / 3, t.y + t.height * frac, { steps: 8 });
    await page.mouse.up();
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const page = (slug, title) => db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, kind, published_at) VALUES (?, ?, ?, ?, 'published', 'page', datetime('now'))").run(orgId, slug, slug, title);
    page("tarifs", "Nos tarifs"); page("equipe", "Notre équipe");
    db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES ('article-un', 'Premier article', '<p>x</p>', 1, 'published', datetime('now'))").run();
    db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Actualités', 'actualites')").run();
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("créer un menu depuis la liste, puis ajouter une page, un article, une catégorie et un lien personnalisé : l'indicateur passe à « non enregistré », l'enregistrement écrit tout, le rechargement le retrouve", async () => {
    const page = await open();
    await page.goto(`${srv.base}${NAV}`);
    assert.match(await page.locator("h1").first().innerText(), /Menus/);
    await page.click("[data-mk-modal-open=nouveau-menu]");
    await page.fill("#menu-name", "Menu principal");
    await page.click("#nouveau-menu button[type=submit]");
    await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    menuId = one("SELECT id FROM nav_menus WHERE name = 'Menu principal'").id;
    assert.equal(await state(page), "Aucune modification."); assert.equal(await page.locator("[data-nm-save]").isDisabled(), true);
    assert.equal(await page.locator("[data-nm-empty]").isVisible(), true, "état vide explicite");
    // Pages : la section est ouverte, la recherche est côté serveur
    await page.fill("#nm-pk-page-q", "tarifs");
    await page.waitForFunction(() => document.querySelectorAll("[data-type=page] .mk-nm-results li").length === 1); // la recherche (serveur) remplace la liste initiale
    assert.deepEqual((await page.locator("[data-type=page] .mk-nm-results li").allTextContents()).map((t) => t.trim()), ["Nos tarifs/p/tarifs"]);
    await page.locator("[data-type=page] .mk-nm-results input[type=checkbox]").first().check();
    await page.locator("[data-type=page] button", { hasText: "Ajouter au menu" }).click();
    assert.equal(await state(page), "Modifications non enregistrées"); assert.equal(await page.locator("[data-nm-save]").isEnabled(), true);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", menuId).n, 0, "rien n'est écrit tant qu'on n'enregistre pas");
    await page.locator("[data-type=article] summary").click();
    await page.locator("[data-type=article] .mk-nm-results input[type=checkbox]").first().check();
    await page.locator("[data-type=article] button", { hasText: "Ajouter au menu" }).click();
    await page.locator("[data-type=category] summary").click();
    await page.locator("[data-type=category] .mk-nm-results input[type=checkbox]").first().check();
    await page.locator("[data-type=category] button", { hasText: "Ajouter au menu" }).click();
    await page.locator(".mk-nm-section summary", { hasText: "Liens personnalisés" }).click();
    await page.fill("#nm-cu-label", "Contact"); await page.fill("#nm-cu-url", "javascript:alert(1)");
    await page.locator(".mk-nm-section", { hasText: "Texte du lien" }).locator("button", { hasText: "Ajouter au menu" }).click();
    assert.match(await page.locator(".mk-nm-err").innerText(), /Adresse invalide/, "adresse dangereuse refusée dès la saisie");
    assert.equal(await page.locator(".mk-nm-item").count(), 3);
    await page.fill("#nm-cu-url", "/contact");
    await page.locator(".mk-nm-section", { hasText: "Texte du lien" }).locator("button", { hasText: "Ajouter au menu" }).click();
    assert.deepEqual(await names(page), ["Nos tarifs", "Premier article", "Actualités", "Contact"]);
    await saveClick(page);
    assert.match(await state(page), /Menu enregistré à \d\d:\d\d/);
    assert.deepEqual(dbTree().map((r) => [r.type, r.label || null]), [["page", null], ["article", null], ["category", null], ["custom", "Contact"]]);
    await page.reload(); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.deepEqual(await names(page), ["Nos tarifs", "Premier article", "Actualités", "Contact"], "persistance après rechargement");
  });

  test("boutons ↑ ↓ → ← et Alt + flèches : réordonner, créer un sous-menu, remonter ; boutons impossibles désactivés ; positions annoncées ; rien d'écrit avant l'enregistrement", async () => {
    const page = await open(); await edit(page);
    const item = (n) => page.locator(".mk-nm-item").nth(n);
    assert.equal(await item(0).locator(":scope > .mk-nm-row [data-act=up]").isDisabled(), true, "le premier ne monte pas");
    assert.equal(await item(0).locator(":scope > .mk-nm-row [data-act=out]").isDisabled(), true, "un élément de premier niveau ne remonte pas");
    assert.equal(await item(0).locator(":scope > .mk-nm-row [data-act=in]").isDisabled(), true, "rien au-dessus où imbriquer");
    await item(1).locator(":scope > .mk-nm-row [data-act=up]").click();
    assert.deepEqual((await names(page)).slice(0, 2), ["Premier article", "Nos tarifs"]);
    assert.match(await page.locator("[data-nm-live]").innerText(), /Premier article.*niveau 1, position 1 sur 4/);
    await item(1).locator(":scope > .mk-nm-row [data-act=in]").click();
    assert.deepEqual(await depths(page), [1, 2, 1, 1], "« Nos tarifs » devient le sous-élément de « Premier article »");
    assert.equal(await page.evaluate(() => document.activeElement.closest("li.mk-nm-item").querySelector(".mk-nm-label").textContent.trim()), "Nos tarifs", "le focus reste sur l'élément déplacé");
    await item(1).locator(":scope > .mk-nm-row [data-act=out]").click();
    assert.deepEqual(await depths(page), [1, 1, 1, 1]);
    // clavier seul : Alt + flèche bas sur le bouton de l'élément
    await page.locator(".mk-nm-item").nth(0).locator(":scope > .mk-nm-row .mk-nm-toggle").focus();
    await page.keyboard.press("Alt+ArrowDown");
    assert.equal((await names(page))[0], "Nos tarifs");
    await page.keyboard.press("Alt+ArrowRight");
    assert.deepEqual(await depths(page), [1, 2, 1, 1]);
    await page.keyboard.press("Alt+ArrowLeft");
    await page.keyboard.press("Alt+ArrowUp");
    assert.deepEqual(await names(page), ["Premier article", "Nos tarifs", "Actualités", "Contact"]);
    assert.deepEqual(dbTree().map((r) => r.label || r.type), ["page", "article", "category", "Contact"], "la base n'a pas bougé");
    await page.click("[data-nm-save]"); await page.waitForFunction(() => /enregistré à/.test(document.querySelector("[data-nm-state]").textContent));
    assert.deepEqual(dbTree().map((r) => r.type), ["article", "page", "category", "custom"]);
  });

  test("glisser-déposer à la souris : avant, après, DANS un élément (sous-menu) ; la profondeur maximale refuse le dépôt ; Échap annule ; l'ordre est écrit à l'enregistrement", async () => {
    const page = await open(); await edit(page);
    const start = await names(page);
    await dnd(page, 3, 0, 0.1); // « Contact » avant le premier
    assert.deepEqual(await names(page), [start[3], ...start.slice(0, 3)]);
    await dnd(page, 1, 0, 0.5); // « Premier article » dans « Contact »
    assert.deepEqual(await depths(page), [1, 2, 1, 1]);
    assert.equal(await state(page), "Modifications non enregistrées");
    // Échap pendant un glissement : rien ne change
    const h = await handleOf(page, 2).boundingBox();
    await page.mouse.move(h.x + 10, h.y + 10); await page.mouse.down(); await page.mouse.move(h.x + 10, h.y - 90, { steps: 6 }); await page.keyboard.press("Escape"); await page.mouse.up();
    assert.deepEqual(await depths(page), [1, 2, 1, 1]);
    assert.equal(await page.locator(".is-dragging").count(), 0);
    const expected = await names(page);
    await saveClick(page);
    await page.reload(); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.deepEqual(await names(page), expected, "l'ordre et l'imbrication survivent au rechargement");
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ? AND parent_id IS NOT NULL", menuId).n, 1);
    // profondeur : on imbrique le dernier élément tant que c'est permis ; « → » se désactive avant le 4e niveau
    const last = page.locator(".mk-nm-item").last();
    for (let i = 0; i < 6 && (await last.locator(":scope > .mk-nm-row [data-act=in]").isEnabled()); i += 1) await last.locator(":scope > .mk-nm-row [data-act=in]").click();
    assert.equal(await last.locator(":scope > .mk-nm-row [data-act=in]").isDisabled(), true);
    assert.ok(Math.max(...(await depths(page))) <= 3, "jamais plus de 3 niveaux");
    await page.click("[data-nm-undo]");
  });

  test("options d'un élément : libellé, titre, classes CSS, nouvel onglet, masqué ; le libellé change sans toucher au titre de la page ; classes invalides refusées par le serveur sans rien écrire", async () => {
    const page = await open(); await edit(page);
    await page.locator(".mk-nm-item").filter({ hasText: "Nos tarifs" }).first().locator(":scope > .mk-nm-row .mk-nm-toggle").click();
    const panel = page.locator(".mk-nm-panel:not([hidden])");
    await panel.getByLabel("Libellé de navigation").fill("Tarifs 2026");
    assert.ok((await names(page)).includes("Tarifs 2026"), "la ligne suit le libellé en direct");
    await panel.locator("summary", { hasText: "Options avancées" }).click();
    await panel.getByLabel(/Attribut « title »/).fill("Voir les tarifs");
    await panel.getByLabel("Classes CSS supplémentaires").fill("btn cta");
    await panel.getByLabel("Ouvrir dans un nouvel onglet").check();
    await saveClick(page);
    const r = one("SELECT * FROM nav_items WHERE menu_id = ? AND type = 'page'", menuId);
    assert.deepEqual([r.label, r.title_attr, r.css_class, r.new_tab], ["Tarifs 2026", "Voir les tarifs", "btn cta", 1]);
    assert.equal(one("SELECT title FROM mk_landing_pages WHERE slug = 'tarifs'").title, "Nos tarifs", "le titre de la page est intact");
    // classe invalide : le serveur refuse, le bandeau l'explique, rien n'est écrit, la saisie est conservée
    await panel.getByLabel("Classes CSS supplémentaires").fill('x" onclick="y');
    await Promise.all([page.waitForResponse((x) => x.url().includes("/enregistrer")), page.click("[data-nm-save]")]);
    assert.match(await page.locator("[data-nm-banner]").innerText(), /Classe CSS invalide/);
    assert.equal(one("SELECT css_class FROM nav_items WHERE id = ?", r.id).css_class, "btn cta");
    assert.equal(await state(page), "Modifications non enregistrées");
    await panel.getByLabel("Classes CSS supplémentaires").fill("btn cta");
    await page.locator(".mk-nm-item").filter({ hasText: "Tarifs 2026" }).first().locator(":scope > .mk-nm-row .mk-nm-toggle").click(); // referme sans rien perdre
  });

  test("retirer un élément (sans supprimer la page), annuler, rétablir, dupliquer ; les sous-éléments remontent", async () => {
    const page = await open(); await edit(page);
    const before = await names(page);
    const first = page.locator(".mk-nm-item").nth(0);
    await openPanel(first);
    await first.locator(":scope > .mk-nm-panel [data-act=remove]").click();
    assert.equal((await names(page)).length, before.length - 1);
    assert.equal(await page.locator("[data-nm-undo]").isEnabled(), true);
    await page.click("[data-nm-undo]"); assert.deepEqual(await names(page), before, "annulation");
    await page.click("[data-nm-redo]"); assert.equal((await names(page)).length, before.length - 1, "rétablissement");
    await page.click("[data-nm-undo]");
    const leaf = page.locator(".mk-nm-item").last(); // dernier élément = jamais un parent : la copie ajoute exactement un élément
    await openPanel(leaf);
    await leaf.locator(":scope > .mk-nm-panel [data-act=dup]").click();
    assert.equal((await names(page)).length, before.length + 1, "dupliqué");
    assert.equal(await state(page), "Modifications non enregistrées");
    await saveClick(page);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", menuId).n, before.length + 1);
    // retrait enregistré : le contenu existe toujours
    const last = page.locator(".mk-nm-item").last();
    await openPanel(last); await last.locator(":scope > .mk-nm-panel [data-act=remove]").click(); await saveClick(page);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", menuId).n, before.length);
    assert.ok(one("SELECT id FROM mk_landing_pages WHERE slug = 'tarifs'") && one("SELECT id FROM posts WHERE slug = 'article-un'"));
  });

  test("échec d'enregistrement : jamais présenté comme réussi (réseau coupé puis erreur 500), modifications conservées, « Réessayer » aboutit ; double clic = un seul envoi", async () => {
    const page = await open(); await edit(page);
    await top(page, 1).locator(":scope > .mk-nm-row [data-act=up]").click();
    const moved = await names(page);
    await page.route("**/enregistrer*", (route) => route.abort("connectionfailed"));
    await page.click("[data-nm-save]");
    await page.locator("[data-nm-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-nm-banner]").innerText(), /n'est PAS enregistré/);
    assert.equal(await state(page), "Modifications non enregistrées"); assert.deepEqual(await names(page), moved);
    await page.unroute("**/enregistrer*");
    await page.route("**/enregistrer*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false }) }));
    await page.locator("[data-nm-banner-action]").click();
    await page.waitForFunction(() => /erreur 500/.test(document.querySelector("[data-nm-banner]").textContent));
    assert.equal(await state(page), "Modifications non enregistrées");
    await page.unroute("**/enregistrer*");
    let posts = 0; page.on("request", (rq) => { if (rq.url().includes("/enregistrer")) posts += 1; });
    await page.locator("[data-nm-banner-action]").click();
    await page.waitForFunction(() => /enregistré à/.test(document.querySelector("[data-nm-state]").textContent));
    assert.ok(await page.locator("[data-nm-banner]").isHidden());
    assert.equal(posts, 1);
    await top(page, 1).locator(":scope > .mk-nm-row [data-act=up]").click();
    posts = 0; await page.locator("[data-nm-save]").dblclick(); await page.waitForFunction(() => /enregistré à/.test(document.querySelector("[data-nm-state]").textContent));
    assert.equal(posts, 1, "le double clic n'envoie qu'une requête");
  });

  test("conflit : le menu modifié ailleurs bloque l'enregistrement (409), le message est clair, « Recharger la page » rend la dernière version ; rien n'est écrasé", async () => {
    const page = await open(); await edit(page);
    await top(page, 1).locator(":scope > .mk-nm-row [data-act=up]").click();
    db.prepare("UPDATE nav_menus SET revision = revision + 1, description = 'changé ailleurs' WHERE id = ?").run(menuId); // un autre onglet a enregistré
    const before = JSON.stringify(dbTree());
    await page.click("[data-nm-save]");
    await page.locator("[data-nm-banner]:not([hidden])").waitFor();
    assert.match(await page.locator("[data-nm-banner]").innerText(), /modifié ailleurs/);
    assert.equal(await page.locator("[data-nm-save]").isDisabled(), true, "plus d'enregistrement possible sur une version périmée");
    assert.equal(JSON.stringify(dbTree()), before);
    await Promise.all([page.waitForNavigation(), page.locator("[data-nm-banner-action]").click()]);
    await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.equal(await page.inputValue("[data-nm-desc]"), "changé ailleurs"); assert.equal(await state(page), "Aucune modification.");
  });

  test("protection à la fermeture : modifications non enregistrées → confirmation du navigateur ; sans modification → aucune", async () => {
    const page = await open(); await edit(page);
    const prevented = () => page.evaluate(() => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    assert.equal(await prevented(), false);
    const initial = await page.inputValue("[data-nm-desc]");
    await page.fill("[data-nm-desc]", "brouillon de description");
    assert.equal(await prevented(), true);
    page.once("dialog", (d) => d.dismiss());
    await page.locator(".mk-nm-tabs a", { hasText: "Tous les menus" }).click(); // lien interne : confirmation, refusée → on reste
    assert.match(page.url(), /\/menus\/\d+/);
    await page.fill("[data-nm-desc]", initial);
    assert.equal(await prevented(), false, "revenir à la valeur enregistrée supprime l'alerte");
  });

  test("aperçu, emplacement et site public : le menu enregistré s'affiche réellement dans l'en-tête, avec ses classes et son titre ; le brouillon n'apparaît jamais", async () => {
    const page = await open(); await edit(page);
    await page.locator("[data-nm-locations] label", { hasText: "En-tête du site" }).click();
    await page.click("[data-nm-preview]");
    const dlg = page.locator("[data-nm-dialog]"); await dlg.waitFor();
    assert.match(await dlg.innerText(), /version ENREGISTRÉE/); assert.ok((await dlg.locator("a").count()) >= 1);
    await page.click("[data-nm-dialog-close]");
    await saveClick(page);
    assert.equal(one("SELECT menu_id FROM nav_locations WHERE location = 'header' AND site_id IS NULL").menu_id, menuId);
    await page.click("[data-nm-preview]"); await dlg.waitFor();
    assert.match(await dlg.innerText(), /Rendu du menu/); assert.match(await dlg.innerText(), /Tarifs 2026/);
    await page.click("[data-nm-dialog-close]");
    const pub = await (await open()).context().newPage();
    await pub.goto(srv.base);
    const link = pub.locator("#headerNav .nav-menu a", { hasText: "Tarifs 2026" }).first();
    assert.equal(await link.getAttribute("title"), "Voir les tarifs");
    assert.match(await link.locator("xpath=..").getAttribute("class"), /btn cta/);
    assert.equal(await link.getAttribute("target"), "_blank"); assert.match(await link.getAttribute("rel"), /noopener/);
    await page.selectOption("[data-nm-status]", "draft"); await saveClick(page);
    await pub.goto(srv.base); assert.equal(await pub.locator("#headerNav .nav-menu a", { hasText: "Tarifs 2026" }).count(), 0, "brouillon : jamais affiché");
    await page.selectOption("[data-nm-status]", "published"); await saveClick(page);
  });

  test("téléphone (390 px) : une seule colonne, aucun défilement horizontal, boutons de déplacement tactiles, l'ajout d'un élément et le déplacement fonctionnent", async () => {
    const page = await open(390); await edit(page);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "pas de défilement horizontal");
    const cols = await page.evaluate(() => getComputedStyle(document.querySelector("[data-nm-layout]")).gridTemplateColumns.split(" ").length);
    assert.equal(cols, 1);
    const addTop = (await page.locator(".mk-nm-add").boundingBox()).y, treeTop = (await page.locator("[data-nm-tree]").boundingBox()).y;
    assert.ok(addTop < treeTop, "le panneau d'ajout passe au-dessus de la structure");
    const b = await top(page, 1).locator(":scope > .mk-nm-row [data-act=up]").boundingBox();
    assert.ok(b.width >= 40 && b.height >= 38, `cible tactile ${b.width}×${b.height}`);
    const first = (await names(page))[0];
    await top(page, 1).locator(":scope > .mk-nm-row [data-act=up]").tap();
    assert.notEqual((await names(page))[0], first);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    await page.locator(".mk-nm-item").nth(0).locator(":scope > .mk-nm-row .mk-nm-toggle").click();
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, "panneau d'options ouvert : toujours pas de débordement");
    await page.locator("[data-nm-undo]").click();
  });

  test("clavier : tout est atteignable par Tab, les boutons ont un nom accessible et un focus visible, Entrée ouvre le panneau d'un élément (aria-expanded), les annonces passent par une zone vocale", async () => {
    const page = await open(); await edit(page);
    const toggle = page.locator(".mk-nm-item").first().locator(":scope > .mk-nm-row .mk-nm-toggle");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await toggle.focus(); await page.keyboard.press("Enter");
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.equal(await page.evaluate(() => document.activeElement.className.includes("mk-nm-toggle") || document.activeElement.tagName === "INPUT"), true);
    for (let i = 0; i < 40 && !(await page.evaluate(() => document.activeElement.classList.contains("mk-nm-mv"))); i += 1) await page.keyboard.press("Tab");
    const focusStyle = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { cls: document.activeElement.className, outline: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
    assert.ok(focusStyle.cls.includes("mk-nm-mv") && focusStyle.outline !== "none" && focusStyle.width >= 2, `focus visible au clavier : ${JSON.stringify(focusStyle)}`);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-nm] button, [data-nm] input, [data-nm] select")].filter((el) => !el.closest("[hidden]") && !(el.getAttribute("aria-label") || el.textContent.trim() || (el.labels && el.labels.length) || el.getAttribute("placeholder"))).map((el) => el.outerHTML.slice(0, 80)));
    assert.deepEqual(unnamed, [], "contrôle sans nom accessible");
    assert.equal(await page.locator("[data-nm-live]").getAttribute("aria-live"), "assertive");
    assert.equal(await page.locator("[data-nm-tree]").getAttribute("aria-label"), "Éléments du menu");
    assert.equal(await page.locator("[data-nm-state]").getAttribute("role"), "status");
    await toggle.click();
  });

  test("lecture seule (lecteur d'un site) : l'éditeur affiche la structure sans poignée, sans boutons de déplacement, sans panneau d'ajout ; le menu d'un autre site est introuvable", async () => {
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Lecture', 'lecture', '{}')").run(orgId).lastInsertRowid);
    const other = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Autre', 'autre', '{}')").run(orgId).lastInsertRowid);
    const viewer = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'viewer')").run(site, viewer.email);
    const mine = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu du site', 'menu-du-site')").run(site).lastInsertRowid);
    db.prepare("INSERT INTO nav_items (menu_id, type, url, label) VALUES (?, 'custom', '/a', 'Lien A')").run(mine);
    const theirs = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu étranger', 'menu-etranger')").run(other).lastInsertRowid);
    const page = await open(1280, viewer);
    await page.goto(`${srv.base}${NAV}/menus/${mine}?site=${site}`); await page.locator("[data-nm-layout]:not([hidden])").waitFor();
    assert.deepEqual(await names(page), ["Lien A"]);
    for (const sel of [".mk-nm-handle", ".mk-nm-mv", ".mk-nm-add", "[data-nm-save]"]) assert.equal(await page.locator(sel).count(), 0, sel);
    assert.match(await page.locator("[data-nm]").innerText(), /Lecture seule/);
    assert.equal(await page.locator("[data-nm-name]").isDisabled(), true);
    const r = await page.goto(`${srv.base}${NAV}/menus/${theirs}?site=${site}`);
    assert.ok(r.status() === 403 || r.status() === 404, `menu d'un autre site : ${r.status()}`);
    assert.doesNotMatch(await page.content(), /Menu étranger/);
  });

  test("menu volumineux (280 éléments sur 3 niveaux) : l'éditeur s'ouvre vite et un déplacement reste instantané ; aucune erreur JavaScript sur tout le parcours", async () => {
    const m = Number(db.prepare("INSERT INTO nav_menus (name, slug) VALUES ('Gros menu', 'gros-menu')").run().lastInsertRowid);
    const ins = db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label) VALUES (?, ?, ?, 'custom', ?, ?)");
    for (let a = 0; a < 10; a += 1) { const pa = Number(ins.run(m, null, a, `/r${a}`, `R${a}`).lastInsertRowid); for (let b = 0; b < 9; b += 1) { const pb = Number(ins.run(m, pa, b, `/r${a}/${b}`, `R${a}-${b}`).lastInsertRowid); for (let c = 0; c < 2; c += 1) ins.run(m, pb, c, `/r${a}/${b}/${c}`, `R${a}-${b}-${c}`); } }
    const page = await open(); const t0 = Date.now(); await edit(page, m); const tOpen = Date.now() - t0;
    assert.equal(await page.locator(".mk-nm-item").count(), 280);
    const t1 = await page.evaluate(() => { const b = document.querySelectorAll(".mk-nm-item")[1].querySelector(":scope > .mk-nm-row [data-act=up]") ; const t = performance.now(); b.click(); return performance.now() - t; });
    assert.ok(tOpen < 6000, `ouverture ${tOpen} ms`); assert.ok(t1 < 800, `déplacement ${Math.round(t1)} ms`);
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    assert.deepEqual(errors, []);
  });
});
