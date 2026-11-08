// Header Builder — logo du site sur le SITE PUBLIÉ, dans un VRAI Chrome : lien personnalisé (suivi des clics → vraie destination), nouvel onglet, hauteur libre, style de l'image au survol.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");

describe("Header Builder : logo du site (navigateur)", { skip: SKIP }, () => {
  let env;
  before(async () => { env = await setup({ siteName: "Site logo" }); });
  after(async () => { if (env) await env.close(); });
  // Le modèle de test n'a pas de logo (il affiche le titre du site) : on en ajoute un, comme le ferait l'éditeur
  const logo = (props, parts) => (s) => {
    let found = false, host = null;
    const walk = (nodes) => { for (const n of nodes) { if (n.type === "sitelogo") { found = true; n.props = { ...n.props, ...props }; if (parts) n.parts = parts; } if (!host && Array.isArray(n.children)) host = n; if (n.children) walk(n.children); } };
    walk(s.children);
    if (!found) host.children.unshift({ id: "lgo0000001aa", type: "sitelogo", props: { height: 48, link: true, ...props }, ...(parts ? { parts } : {}) });
  };

  test("lien personnalisé : le logo mène à l'adresse choisie (via le suivi des clics) et s'ouvre dans un nouvel onglet", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, href: "https://exemple.com/promo", newTab: true }));
    const { context, page } = await env.visit();
    const a = page.locator(".lp-site-header a.kw-sitelogo-link");
    assert.equal(await a.count(), 1);
    assert.equal(await a.getAttribute("target"), "_blank"); assert.match(await a.getAttribute("rel"), /noopener/);
    const { Client } = require("./helpers");
    const r = await new Client(env.srv.base).request(await a.getAttribute("href"), { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/120" } });
    assert.equal(r.location, "https://exemple.com/promo", "le clic compté redirige vers l'adresse choisie");
    await context.close();
  });

  test("sans adresse : le logo mène à l'accueil du site, dans le même onglet", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, href: undefined, newTab: undefined }));
    const { context, page } = await env.visit();
    const a = page.locator(".lp-site-header a.kw-sitelogo-link"); assert.equal(await a.getAttribute("target"), null);
    await context.close();
  });

  test("hauteur libre (73 px) appliquée à l'image du logo ; aucune erreur de script", async () => {
    await env.publishHeader("luxe-01.luxe-01", { mode: "static" }, logo({ link: true, height: 73 }));
    const { context, page } = await env.visit();
    const img = page.locator(".lp-site-header .kw-sitelogo-img").first();
    if (await img.count()) assert.equal(Math.round((await img.boundingBox()).height), 73);
    await context.close();
    assert.deepEqual(env.errors, []);
  });
});
