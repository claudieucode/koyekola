// Menu Marketing : « Site Web » est un lien direct vers « Mes sites » ET un accordéon dont le chevron est un bouton distinct.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");
const nav = require("../src/marketing/web/nav");
const cmsNav = require("../src/marketing/web/cmsNav");

describe("menu Marketing → Site Web : lien direct + accordéon", () => {
  let srv, boss;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("le libellé est un lien vers « Mes sites » ; le chevron est un bouton séparé, relié au sous-menu, avec un nom accessible", async () => {
    const html = (await boss.get("/marketing")).text;
    const g = html.match(/<div class="mk-nav-group mk-nav-split[^"]*" data-mk-group="site">[\s\S]*?<div class="mk-nav-sub" id="mk-sub-site">[\s\S]*?<\/div>\s*<\/div>/)[0];
    assert.match(g, /<a class="mk-nav-link mk-nav-split-link" href="\/marketing\/site-web\/sites"/);
    assert.match(g, /<button type="button" class="mk-nav-caret-btn" aria-expanded="false" aria-controls="mk-sub-site" aria-label="Afficher ou masquer les sous-menus de Site Web">/);
    assert.doesNotMatch(g.match(/<a class="mk-nav-link mk-nav-split-link"[\s\S]*?<\/a>/)[0], /<button/, "le lien ne contient pas le bouton");
    for (const label of ["Mes sites", "Pages", "Tests A/B"]) assert.match(g, new RegExp(`<a class="mk-nav-sublink" href="[^"]+">${label.replace("/", "\\/")}</a>`), `sous-menu ${label}`);
    assert.doesNotMatch(html, /class="mk-nav-head"[^>]*aria-controls="mk-sub-site"/, "plus de bouton unique qui ne fait que déplier");
  });
  test("les autres rubriques gardent leur en-tête d'accordéon d'origine (Campagnes, SMS, Automatisations, Audience…)", async () => {
    const html = (await boss.get("/marketing")).text;
    for (const k of ["campaigns", "sms", "automations", "audience", "analytics"]) assert.match(html, new RegExp(`data-mk-group="${k}">\\s*<button type="button" class="mk-nav-head"`), k);
    assert.equal((html.match(/mk-nav-split-link/g) || []).length, 1, "un seul lien scindé : Site Web");
  });
  test("la cible du lien existe, répond 200 et affiche « Mes sites » ; aucune redirection intermédiaire", async () => {
    const r = await boss.get("/marketing/site-web/sites"); assert.equal(r.status, 200); assert.match(r.text, /<h1>Mes sites<\/h1>/);
  });
  test("accordéon ouvert d'office sur une route de Site Web ; entrée active mise en évidence ; fermé ailleurs", () => {
    const can = () => true;
    const on = nav.buildNav({ can, active: "landing" }).sections.find((s) => s.key === "site");
    assert.equal(on.open, true); assert.ok(on.items.some((i) => i.key === "landing" && i.current));
    const off = nav.buildNav({ can, active: "campaigns" }).sections.find((s) => s.key === "site");
    assert.equal(off.open, false);
  });
  test("fil d'Ariane du CMS : « Site Web » mène directement à « Mes sites », sans page intermédiaire", () => {
    const space = { siteId: 5, principal: false, base: `${cmsNav.BASE}/sites/5`, name: "Site Cinq" };
    const t = cmsNav.buildCmsNav({ can: () => true, active: "espace/pages", space }).trail;
    assert.deepEqual([t[0].label, t[0].href], ["Site Web", "/marketing/site-web/sites"]);
    const c = cmsNav.buildCmsNav({ can: () => true, active: "sites" }).trail; assert.equal(c[0].href, "/marketing/site-web/sites");
  });
  test("ancienne adresse /marketing/site-web : toujours servie (compatibilité, aucune boucle de redirection) ; protégée par les mêmes droits", async () => {
    const r = await boss.get("/marketing/site-web"); assert.equal(r.status, 200);
    const anon = await new Client(srv.base).get("/marketing/site-web"); assert.equal(anon.status, 302); assert.match(anon.location, /connexion/);
  });
  test("script : le chevron bascule l'accordéon sans navigation ; le lien n'est jamais intercepté", () => {
    const js = fs.readFileSync(path.join(__dirname, "..", "public/js/mk/shell.js"), "utf8");
    assert.match(js, /\$\$\("\.mk-nav-caret-btn", sidebar\)/); assert.match(js, /btn\.setAttribute\("aria-expanded"/);
    assert.doesNotMatch(js.slice(js.indexOf('.mk-nav-caret-btn'), js.indexOf('$$(".mk-nav-head", sidebar)')), /preventDefault|location\./);
  });
});
