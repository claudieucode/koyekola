// Header Builder, lot L5 (recherche) — loupe → recherche en plein écran, suggestions pendant la frappe, sur le site publié, dans un VRAI Chrome ; route /recherche/suggestions ;
// le widget Recherche existant reste identique. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder L5 : recherche plein écran et suggestions (navigateur)", { skip: SKIP }, () => {
  let env;
  const post = (title, slug, published = 1) => env.db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES (?, ?, '<p>texte</p>', ?, ?, datetime('now'))").run(slug, title, published, published ? "published" : "draft");
  const withSearch = (props) => (s) => { let host = null; const walk = (nodes) => { for (const n of nodes) { if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } }; walk(s.children); host.children.push({ id: "srch000001", type: "search", props }); };

  before(async () => {
    env = await setup({ siteName: "Site recherche" });
    post("Guide du café en grains", "guide-cafe"); post("Brouillon secret café", "brouillon-cafe", 0);
    post("<img src=x onerror=window.__xss=1> café piégé", "cafe-piege");
    for (let i = 1; i <= 8; i++) post(`Dégustation numéro ${i}`, `degustation-${i}`);
  });
  after(async () => { if (env) await env.close(); });

  test("route /recherche/suggestions : publiés seulement, 2 caractères minimum, 6 au plus, JSON sans HTML, jamais en cache", async () => {
    const get = async (q) => { const r = await env.boss.get(`/recherche/suggestions?q=${encodeURIComponent(q)}`); return { status: r.status, body: JSON.parse(r.text), headers: r.headers }; };
    assert.deepEqual((await get("c")).body.results, [], "un seul caractère : rien");
    const c = await get("café"); assert.equal(c.status, 200);
    const titles = c.body.results.map((x) => x.title);
    assert.ok(titles.includes("Guide du café en grains")); assert.ok(!titles.some((t) => /Brouillon/.test(t)), "jamais un brouillon");
    assert.ok(c.body.results.every((x) => x.url && /^\/[^/]/.test(x.url)), "adresses relatives du site");
    assert.equal((await get("Dégustation")).body.results.length, 6, "6 au plus");
    assert.match(String((await env.boss.get("/recherche/suggestions?q=caf")).headers.get("cache-control") || ""), /no-store/);
    assert.deepEqual((await get("zzzzintrouvable")).body.results, []);
  });

  test("loupe → recherche plein écran : la fenêtre s'ouvre, le focus est dans le champ, les suggestions n'affichent que des publiés, le texte est écrit sans exécuter de HTML", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withSearch({ target: "site", skin: "overlay", suggest: true, placeholder: "Rechercher…", button: "Chercher" }));
    const { context, page } = await env.visit();
    const open = page.locator(".lp-site-header .kw-search-open"), dlg = page.locator(".kw-search-dialog");
    assert.equal(await open.isVisible(), true); assert.equal(await dlg.isVisible(), false, "fermée au départ"); assert.equal(await open.getAttribute("aria-haspopup"), "dialog");
    await open.click(); assert.equal(await dlg.isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.type), "search", "le focus est dans le champ");
    await page.keyboard.type("caf");
    const list = page.locator(".kw-search-suggest"); await list.waitFor({ state: "visible" });
    const texts = await list.locator("[role=option]").allInnerTexts();
    assert.ok(texts.some((t) => /Guide du café en grains/.test(t))); assert.ok(!texts.some((t) => /Brouillon/.test(t)));
    assert.ok(texts.some((t) => /<img src=x/.test(t)), "le titre piégé est du TEXTE");
    assert.equal(await page.evaluate(() => window.__xss), undefined, "aucun HTML exécuté");
    assert.match(await page.locator("[data-kw-suggest-status]").innerText(), /suggestions? disponibles?/);
    await context.close();
  });

  test("clavier : Bas / Haut choisissent une suggestion (aria-activedescendant), Entrée l'ouvre ; Échap ferme la liste puis la fenêtre et rend le focus à la loupe", async () => {
    const { context, page } = await env.visit();
    await page.locator(".lp-site-header .kw-search-open").click(); await page.keyboard.type("guide"); await page.locator(".kw-search-suggest").waitFor({ state: "visible" });
    await page.keyboard.press("ArrowDown"); assert.equal(await page.locator('.kw-search-suggest [aria-selected="true"]').count(), 1);
    assert.ok(await page.locator(".kw-search-dialog input[type=search]").getAttribute("aria-activedescendant"));
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".kw-search-suggest").isVisible(), false, "1er Échap : la liste");
    assert.equal(await page.locator(".kw-search-dialog").isVisible(), true, "la fenêtre reste ouverte");
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".kw-search-dialog").isVisible(), false, "2e Échap : la fenêtre");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("kw-search-open")), true, "focus rendu à la loupe");
    await page.locator(".lp-site-header .kw-search-open").click(); await page.keyboard.type("guide"); await page.locator(".kw-search-suggest").waitFor({ state: "visible" });
    await page.keyboard.press("ArrowDown"); await Promise.all([page.waitForURL(/\/blog\/|\/guide-cafe|article/, { timeout: 8000 }).catch(() => null), page.keyboard.press("Enter")]);
    assert.doesNotMatch(page.url(), /\/p\//, "la page a changé : le lien de la suggestion a été suivi");
    await context.close();
  });

  test("fond et bouton Fermer referment ; mouvement réduit sans animation ; un champ vide ou d'un caractère n'affiche aucune suggestion", async () => {
    const { context, page } = await env.visit({ reducedMotion: "reduce" });
    const open = page.locator(".lp-site-header .kw-search-open"), dlg = page.locator(".kw-search-dialog");
    await open.click(); assert.equal(await dlg.evaluate((e) => getComputedStyle(e).animationName), "none");
    await page.keyboard.type("g"); await page.waitForTimeout(400); assert.equal(await page.locator(".kw-search-suggest").isVisible(), false, "1 caractère : rien");
    await page.locator(".kw-search-close").click(); assert.equal(await dlg.isVisible(), false);
    await open.click(); await dlg.click({ position: { x: 5, y: 5 } }); assert.equal(await dlg.isVisible(), false, "clic sur le fond");
    await context.close();
  });

  test("champ dans la page avec suggestions : la liste s'ouvre sous le champ et Échap la ferme", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withSearch({ target: "site", suggest: true, placeholder: "Rechercher…", button: "Chercher" }));
    const { context, page } = await env.visit();
    assert.equal(await page.locator(".lp-site-header .kw-search-open").count(), 0, "pas de loupe : champ dans la page");
    const input = page.locator(".lp-site-header input[type=search]"); await input.fill("guide"); await page.locator(".kw-search-suggest").waitFor({ state: "visible" });
    const ib = await input.boundingBox(), lb = await page.locator(".kw-search-suggest").boundingBox(); assert.ok(lb.y >= ib.y + ib.height - 2, "sous le champ");
    await input.press("Escape"); assert.equal(await page.locator(".kw-search-suggest").isVisible(), false);
    await context.close();
  });

  test("le widget Recherche existant est inchangé (formulaire d'origine, mêmes attributs, mêmes cibles)", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, withSearch({ target: "catalogue", placeholder: "Rechercher…", button: "OK" }));
    const html = (await env.visit()); const form = await html.page.evaluate(() => { const f = document.querySelector(".lp-site-header form[role=search]"); return f ? { action: f.getAttribute("action"), tag: f.tagName, cls: f.className, children: [...f.children].map((c) => c.tagName) } : null; });
    assert.deepEqual({ action: form.action, tag: form.tag, children: form.children }, { action: "/catalogue", tag: "FORM", children: ["LABEL", "INPUT", "BUTTON"] }); assert.match(form.cls, /kw-search/);
    await html.context.close();
  });

  test("aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
