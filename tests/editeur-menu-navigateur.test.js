// Éditeur de pages — « Réglages du menu » (gestionnaire du menu de navigation) dans un VRAI navigateur contre un vrai serveur.
// Le gestionnaire n'a pas de données propres : il modifie le widget « Menu de navigation » du document. Chaque scénario clique
// comme une personne, puis relit le résultat dans le canevas, dans Structure, dans le brouillon en base et sur la page publiée.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés.
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
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}

describe("réglages du menu de navigation (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, otherId;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const menuOf = (c) => nodesOf(c.sections).find((x) => x.type === "menu").props;
  const flat = (p) => p.items.map((i) => i.label + (i.children ? `[${i.children.map((c) => c.label).join(",")}]` : ""));
  const saved = (check, what) => until(() => { const m = menuOf(draft()); return check(m) ? m : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const mgr = () => page.locator("[data-pb-navmgr]");
  const labels = () => mgr().locator("[data-nav-label]").evaluateAll((els) => els.map((e) => e.value));
  const canvasLinks = () => frame().locator(".kw-menu-link").allTextContents();
  const ready = async () => {
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(250);
  };
  const openManager = async () => {
    if (!(await mgr().evaluate((d) => d.open))) {
      await page.locator("[data-pb-mainmenu]").click();
      await page.locator(".pb-menu-item", { hasText: "Réglages du menu de navigation" }).click();
    }
    await until(async () => (await mgr().locator("[data-nav-list]").count()) > 0, { what: "gestionnaire affiché" });
  };
  const put = async (id, content) => {
    const revision = Number(db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision);
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text.slice(0, 150));
  };
  const row = (path) => mgr().locator(`.pb-nav-row[data-nav-path="${path}"]`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    // une autre page PUBLIÉE : elle est proposée dans « Ajouter la page »
    otherId = Number((await boss.post("/marketing/pages", { name: "Tarifs" })).location.match(/(\d+)$/)[1]);
    await put(otherId, { sections: [{ id: "sect00000002", type: "layout", children: [{ id: "head00000001", type: "heading", props: { text: "Tarifs", level: 2 } }] }] });
    assert.equal((await boss.request(`/marketing/pages/${otherId}/publier.json`, { method: "POST", json: {} })).status, 200);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil menu" })).location.match(/(\d+)$/)[1]);
    await put(pageId, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "menu00000001", type: "menu", props: { label: "Principal", items: [
      { label: "Accueil", url: "/" }, { label: "Formations", url: "/catalogue" }, { label: "Blog", url: "/blog" }, { label: "Contact", url: "/contact" }] } }] }] });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 1600 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
    page.on("dialog", (d) => d.accept());
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("1-2. « Réglages du menu de navigation » est dans le menu principal et ouvre le vrai menu de la page", async () => {
    await page.locator("[data-pb-mainmenu]").click();
    const entry = page.locator(".pb-menu-item", { hasText: "Réglages du menu de navigation" });
    assert.equal(await entry.count(), 1);
    assert.ok(await page.locator(".pb-menu-item", { hasText: "Réglages de la page" }).count(), "les entrées existantes sont conservées");
    await entry.click();
    await until(async () => (await labels()).length === 4, { what: "4 liens affichés" });
    assert.deepEqual(await labels(), ["Accueil", "Formations", "Blog", "Contact"]);
    assert.deepEqual(await canvasLinks(), ["Accueil", "Formations", "Blog", "Contact"], "mêmes données que le canevas");
  });

  test("3. ajouter une page publiée et un lien personnalisé : ils apparaissent dans le canevas et sont enregistrés", async () => {
    await mgr().locator("[data-nav-addpage]").click();
    await until(async () => (await labels()).includes("Tarifs"), { what: "page ajoutée" });
    await mgr().locator("[data-nav-addlink]").click();
    await until(async () => (await labels()).includes("Nouveau lien"), { what: "lien ajouté" });
    const m = await saved((p) => p.items.length === 6, "6 liens");
    assert.equal(m.items[4].url, `/p/${db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(otherId).slug}`);
    assert.deepEqual((await canvasLinks()).slice(4), ["Tarifs", "Nouveau lien"]);
  });

  test("4-5. renommer et changer l'adresse : le canevas, le lien et le brouillon suivent", async () => {
    await row("5").locator("[data-nav-label]").fill("Webinaires");
    await row("5").locator("[data-nav-url]").fill("https://exemple.org/webinaires");
    await saved((p) => p.items[5].label === "Webinaires" && p.items[5].url === "https://exemple.org/webinaires", "nom et adresse");
    await until(async () => (await canvasLinks()).includes("Webinaires"), { what: "canevas mis à jour" });
    assert.equal(await frame().locator("a.kw-menu-link", { hasText: "Webinaires" }).getAttribute("href"), "https://exemple.org/webinaires");
  });

  test("6. réordonner (boutons puis glisser-déposer) : le nouvel ordre est réel et enregistré", async () => {
    await row("2").getByRole("button", { name: "Monter" }).click();           // Blog avant Formations
    await saved((p) => flat(p).slice(0, 3).join() === "Accueil,Blog,Formations", "Blog monté");
    // glisser « Contact » sur le haut de « Blog »
    const src = row("3").locator(".pb-nav-grip"), dst = row("1");
    const box = await dst.boundingBox();
    await src.dragTo(dst, { targetPosition: { x: box.width / 2, y: 3 } });
    await saved((p) => flat(p).slice(0, 4).join() === "Accueil,Contact,Blog,Formations", "Contact glissé");
    assert.deepEqual((await canvasLinks()).slice(0, 4), ["Accueil", "Contact", "Blog", "Formations"]);
  });

  test("7. sous-menu : placer dans un sous-menu, glisser dedans, en sortir ; la hiérarchie est réelle", async () => {
    await row("2").getByRole("button", { name: /Placer dans le sous-menu/ }).click();   // Blog sous Contact
    await saved((p) => flat(p)[1] === "Contact[Blog]", "Blog sous Contact");
    const dst = row("1"), src = row("2");                                                   // Formations → au milieu de Contact
    const box = await dst.boundingBox();
    await src.locator(".pb-nav-grip").dragTo(dst, { targetPosition: { x: box.width / 2, y: box.height / 2 } });
    await saved((p) => flat(p)[1] === "Contact[Blog,Formations]", "Formations dans Contact");
    assert.equal(await frame().locator(".kw-submenu .kw-menu-link").count(), 2, "sous-menu dessiné dans le canevas");
    await row("1.1").getByRole("button", { name: "Sortir du sous-menu" }).click();
    await saved((p) => flat(p)[1] === "Contact[Blog]" && p.items[2].label === "Formations", "Formations sortie");
  });

  test("8. retirer un lien du menu : le lien disparaît, la page est conservée", async () => {
    const before = db().prepare("SELECT COUNT(*) AS n FROM mk_landing_pages").get().n;
    await row("3").getByRole("button", { name: /Retirer du menu/ }).click();      // Tarifs
    await saved((p) => !flat(p).includes("Tarifs"), "Tarifs retiré");
    assert.equal(db().prepare("SELECT COUNT(*) AS n FROM mk_landing_pages").get().n, before, "aucune page supprimée");
    assert.equal(db().prepare("SELECT status FROM mk_landing_pages WHERE id = ?").get(otherId).status, "published");
    assert.ok(!(await canvasLinks()).includes("Tarifs"));
  });

  test("9. Structure : « Voir » sélectionne le menu dans les calques et dans l'inspecteur", async () => {
    await mgr().locator(".pb-nav-btn-text").click();
    await until(async () => (await page.evaluate(() => window.__pb.selection())).includes("menu00000001"), { what: "menu sélectionné" });
    assert.ok(await page.locator("[data-pb-layers] .pb-node.is-selected, [data-pb-layers] .pb-node[aria-selected='true']").count(), "calque du menu sélectionné");
  });

  test("10. annuler / rétablir : chaque opération du gestionnaire est dans l'historique", async () => {
    const start = flat(menuOf(draft())).join();
    const original = (await labels()).join();
    await row("0").getByRole("button", { name: "Descendre" }).click();
    await until(async () => (await labels()).join() !== original, { what: "déplacé" });
    const moved = (await labels()).join();
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await labels()).join() === original, { what: "annulé" });
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await labels()).join() === moved, { what: "rétabli" });
    await page.locator("[data-pb-undo]").click();
    await saved((p) => flat(p).join() === start, "état d'origine rétabli");
  });

  test("11-12. recharger : tout est conservé ; menu replié sur mobile", async () => {
    await mgr().locator('[data-nav-opt="mobileToggle"]').check();
    await saved((p) => p.mobileToggle === true, "menu replié sur mobile");
    const expected = flat(menuOf(draft())).join();
    await page.reload();
    await ready();
    await openManager();
    assert.equal((await mgr().locator("[data-nav-label]").evaluateAll((els) => els.map((e) => e.value))).length, menuOf(draft()).items.length + (menuOf(draft()).items.filter((i) => i.children).reduce((a, i) => a + i.children.length, 0)));
    assert.equal(flat(menuOf(draft())).join(), expected);
    assert.ok(await mgr().locator('[data-nav-opt="mobileToggle"]').isChecked());
  });

  test("12b. afficher sur : décocher Tablette masque le menu sur tablette (publié) ; jamais masqué partout", async () => {
    await mgr().locator('[data-nav-screen="tablet"]').uncheck();
    await until(() => nodesOf(draft().sections).find((x) => x.type === "menu").hideOn?.includes("tablet"), { what: "masqué sur tablette enregistré" });
    await mgr().locator('[data-nav-screen="mobile"]').uncheck();
    await mgr().locator('[data-nav-screen="desktop"]').click();
    assert.ok(await mgr().locator('[data-nav-screen="desktop"]').isChecked(), "au moins un écran reste coché");
    await mgr().locator('[data-nav-screen="mobile"]').check();
    await mgr().locator('[data-nav-screen="tablet"]').check();
    await until(() => !nodesOf(draft().sections).find((x) => x.type === "menu").hideOn, { what: "de nouveau visible partout" });
  });

  test("13-14. aperçu et page publiée : même menu, même ordre, même hiérarchie", async () => {
    const m = menuOf(draft());
    await until(async () => { const r = await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} }); return r.status === 200; }, { what: "publication" });
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    const links = [...html.split("kw-menu-list")[1].matchAll(/class="kw-menu-link" href="([^"]*)">([^<]*)</g)].map((x) => x[2]);
    const expected = m.items.flatMap((i) => [i.label, ...(i.children || []).map((c) => c.label)]);
    assert.deepEqual(links, expected);
    assert.match(html, /data-kw-menu-toggle/);
    assert.match(html, /has-sub/);
    const canvas = await canvasLinks();
    assert.deepEqual(canvas, expected, "éditeur = site publié");
  });

  test("15. aucune erreur dans la console", () => { assert.deepEqual(errors, []); });
});
