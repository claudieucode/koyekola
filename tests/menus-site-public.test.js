// KOLAKISA CMS — Le menu ENREGISTRÉ dans Apparence → Menus est celui qui s'AFFICHE sur le site public (en-tête, pied de page, aperçu), pour tous les sites.
// Cas de reproduction : un site dont l'en-tête, composé dans le Page Builder avec le widget « Menu » resté à sa valeur par défaut (Programme / Blog), affichait ces deux liens au lieu du menu affecté à « En-tête du site »
// (et « <site> · Cookies » en bas). Vérifié ici contre un vrai serveur : rendu public, aperçu, isolation entre sites, sites neufs, starter pack, aucun repli vers le menu d'un autre site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("menus : administration → site public", () => {
  let srv, boss, db, anon, A, B, adminB;
  const R = "/marketing/site-web";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const origin = () => ({ Origin: srv.base });
  const slug = (id) => one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug;
  const mkSite = async (name) => Number((await boss.post(`${R}/sites`, { name })).location.match(/(\d+)(#.*)?$/)[1]);
  const mkPage = async (site, name) => { const id = Number((await boss.post("/marketing/pages", { name, site_id: String(site) })).location.match(/(\d+)$/)[1]); db.prepare("UPDATE mk_landing_pages SET kind = 'page' WHERE id = ?").run(id); /* une page de SITE (pas une page d'atterrissage) */ await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: origin() }); return id; };
  // Menu d'un site : créé, rempli (éléments dans l'ordre, un sous-menu possible), publié, affecté
  const mkMenu = async (site, name, items, { locations = [], status = "published" } = {}) => {
    const created = await boss.post(`${R}/navigation/menus${site ? `?site=${site}` : ""}`, { name });
    const id = Number(created.location.match(/menus\/(\d+)|menu=(\d+)/).slice(1).find(Boolean));
    await saveMenu(site, id, items, status);
    for (const loc of locations) assign(site, loc, id); // une affectation par emplacement (comme l'écran Menus : chaque emplacement est enregistré séparément)
    return id;
  };
  const saveMenu = async (site, id, items, status = "published") => {
    const revision = one("SELECT revision FROM nav_menus WHERE id = ?", id).revision;
    const r = await boss.request(`${R}/navigation/menus/${id}/enregistrer${site ? `?site=${site}` : ""}`, { method: "POST", json: { revision, status, items }, headers: origin() });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const assign = (site, location, menuId) => { db.prepare("DELETE FROM nav_locations WHERE site_id IS ? AND location = ?").run(site, location); if (menuId) db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, ?, ?)").run(site, location, menuId); };
  const link = (label, url, children) => ({ type: "custom", label, url, ...(children ? { children } : {}) });
  // En-tête composé dans le Page Builder avec le widget Menu à son ancienne valeur par défaut (liste de démonstration), ou avec la nouvelle (source : emplacement)
  const mkHeader = async (site, name, menuProps) => {
    const section = { type: "layout", children: [{ type: "container", props: { full: true }, children: [{ type: "sitelogo", props: { height: 40 } }, { type: "menu", props: menuProps }] }] };
    const c = await boss.request(`${R}/composants`, { method: "POST", json: { name, section, siteId: site }, headers: origin() }); assert.equal(c.status, 201, c.text.slice(0, 160));
    const id = JSON.parse(c.text).component.id; assert.equal((await boss.post(`${R}/sites/${site}/parties`, { header: String(id), footer: "" })).status, 302); return id;
  };
  const DEMO = { label: "Menu de la page", items: [{ label: "Programme", url: "/catalogue" }, { label: "Blog", url: "/blog" }] };
  const html = async (id, client = anon) => (await client.get(`/p/${slug(id)}`)).text;
  // Zones : « pied de page » = le menu automatique du bas (nav.lp-foot-nav) ; « en-tête » = tout autre menu de navigation (celui d'un en-tête composé, ou l'en-tête automatique), le premier dans la page
  const navBlocks = (page) => [...page.matchAll(/<nav class="([^"]*)"[^>]*>([\s\S]*?)<\/nav>/g)].filter((m) => /kw-menu-list/.test(m[2])).map((m) => ({ cls: m[1], inner: m[2], at: m.index }));
  const zoneNav = (page, zone) => navBlocks(page).find((b) => (zone === "footer") === /lp-foot-nav/.test(b.cls));
  const labels = (page, zone) => (zoneNav(page, zone) ? [...zoneNav(page, zone).inner.matchAll(/<a class="kw-menu-link"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]) : []);
  const hrefs = (page, zone) => (zoneNav(page, zone) ? [...zoneNav(page, zone).inner.matchAll(/<a class="kw-menu-link" href="([^"]*)"/g)].map((m) => m[1]) : []);
  const headerNavCount = (page) => navBlocks(page).filter((b) => !/lp-foot-nav/.test(b.cls)).length;
  const beforeContent = (page, zone) => { const nav = zoneNav(page, zone); const content = page.indexOf('class="lp-section lp-text"'); return Boolean(nav) && content > -1 && (zone === "footer" ? nav.at > content : nav.at < content); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("teste second"); B = await mkSite("second site");
    adminB = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')").run(B, adminB.email);
  });
  after(() => { db.close(); return srv.stop(); });

  test("reproduction : l'en-tête (widget Menu resté à la liste de démonstration) affiche le menu AFFECTÉ — « tarifs », « page teste deux », « Defilements deux » — et plus « Programme » / « Blog »", async () => {
    const page = await mkPage(A, "Accueil"); await mkHeader(A, "En-tête teste second", DEMO);
    const before = await html(page); assert.deepEqual(labels(before, "header"), [], "aucun menu affecté : rien (ni liste de démonstration, ni menu d'un autre site)");
    assert.ok(!/>Programme<|>Blog</.test(before), "la liste de démonstration n'est plus affichée");
    const menu = await mkMenu(A, "Menu principal", [link("tarifs", "/tarifs"), link("page teste deux", "/deux"), link("Defilements deux", "/defilements")], { locations: ["header"] });
    const out = await html(page); assert.deepEqual(labels(out, "header"), ["tarifs", "page teste deux", "Defilements deux"], "libellés et ordre enregistrés");
    assert.deepEqual(hrefs(out, "header").map((h) => h.replace(/\/clic\/\d+.*/, "/clic")), ["/p/" + slug(page) + "/clic", "/p/" + slug(page) + "/clic", "/p/" + slug(page) + "/clic"], "liens comptés comme les autres liens de la page");
    assert.ok(beforeContent(out, "header"), "le menu est AVANT le contenu de la page (zone d'en-tête), pas en bas de page");
    assert.deepEqual(labels(out, "footer"), [], "rien dans le pied de page"); assert.match(out, /<footer class="lp-foot">.*teste second.*Cookies/s, "la ligne légale (nom du site · Cookies) reste, distincte du menu");
    assert.equal((out.match(/Cookies/g) || []).length, 1, "pas rendue deux fois");
    // le clic suivi mène bien à l'adresse du menu (l'ordre des liens est celui affiché)
    const click = await anon.request(`/p/${slug(page)}/clic/2`, { redirect: "manual" }); assert.ok([302, 303].includes(click.status)); assert.match(click.headers.get("location") || "", /\/deux$/, "le 2e lien mène à « /deux »");
    void menu;
  });

  test("en-tête et pied de page indépendants : deux menus différents, ou le même menu aux deux emplacements ; affectation persistante après rechargement ; menu en brouillon = rien", async () => {
    const page = one("SELECT id FROM mk_landing_pages WHERE site_id = ? ORDER BY id LIMIT 1", A).id;
    const footer = await mkMenu(A, "Menu pied", [link("Mentions", "/mentions"), link("Contact", "/contact")], { locations: ["footer"] });
    // le pied de page ne compose pas son propre composant : le menu affecté s'y affiche (automatiquement)
    let out = await html(page); assert.deepEqual(labels(out, "header"), ["tarifs", "page teste deux", "Defilements deux"]); assert.deepEqual(labels(out, "footer"), ["Mentions", "Contact"], "pied de page : SON menu");
    assert.match(out, /class="lp-foot-nav"/);
    // le même menu aux deux emplacements
    const main = one("SELECT id FROM nav_menus WHERE site_id = ? AND name = 'Menu principal'", A).id; assign(A, "footer", main); out = await html(page);
    assert.deepEqual(labels(out, "footer"), ["tarifs", "page teste deux", "Defilements deux"]); assert.deepEqual(labels(out, "header"), ["tarifs", "page teste deux", "Defilements deux"]);
    // persistance : relecture de la base, puis nouvelle lecture publique
    assert.deepEqual(db.prepare("SELECT location, menu_id FROM nav_locations WHERE site_id = ? ORDER BY location").all(A).map((r) => ({ ...r })), [{ location: "footer", menu_id: main }, { location: "header", menu_id: main }]);
    assign(A, "footer", footer);
    // brouillon : un menu non publié n'est JAMAIS affiché
    const rev = one("SELECT revision FROM nav_menus WHERE id = ?", footer).revision; await boss.request(`${R}/navigation/menus/${footer}/enregistrer?site=${A}`, { method: "POST", json: { revision: rev, status: "draft", items: [link("Mentions", "/mentions")] }, headers: origin() });
    assert.deepEqual(labels(await html(page), "footer"), [], "menu en brouillon : rien"); await saveMenu(A, footer, [link("Mentions", "/mentions"), link("Contact", "/contact")], "published");
    assert.deepEqual(labels(await html(page), "footer"), ["Mentions", "Contact"]);
  });

  test("modifier, réordonner, sous-menu, retirer : la page publiée suit IMMÉDIATEMENT (aucun cache obsolète) ; désaffecter = disparition, sans repli", async () => {
    const page = one("SELECT id FROM mk_landing_pages WHERE site_id = ? ORDER BY id LIMIT 1", A).id, main = one("SELECT id FROM nav_menus WHERE site_id = ? AND name = 'Menu principal'", A).id;
    await saveMenu(A, main, [link("Defilements deux", "/defilements", [link("Détail", "/detail")]), link("tarifs", "/tarifs")]);
    let out = await html(page); assert.deepEqual(labels(out, "header"), ["Defilements deux", "Détail", "tarifs"], "ordre modifié et sous-menu rendu");
    assert.match(zoneNav(out, "header").inner, /<ul class="kw-submenu" id="[^"]*"><li><a class="kw-menu-link" href="[^"]*">Détail<\/a>/, "sous-menu imbriqué sous son parent"); assert.match(zoneNav(out, "header").inner, /has-sub/);
    await saveMenu(A, main, [link("Nouveau seul", "/seul")]); assert.deepEqual(labels(await html(page), "header"), ["Nouveau seul"], "éléments retirés : disparus");
    assign(A, "header", null); out = await html(page); assert.deepEqual(labels(out, "header"), [], "désaffecté : l'en-tête n'affiche plus rien (pas de menu par défaut)"); assign(A, "header", main);
    assert.deepEqual(labels(await html(page), "header"), ["Nouveau seul"], "ré-affecté");
  });

  test("aperçu = site public : même structure de navigation pour la page enregistrée (l'aperçu est le même moteur de rendu)", async () => {
    const page = one("SELECT id FROM mk_landing_pages WHERE site_id = ? ORDER BY id LIMIT 1", A).id, main = one("SELECT id FROM nav_menus WHERE site_id = ? AND name = 'Menu principal'", A).id;
    await saveMenu(A, main, [link("Un", "/un"), link("Deux", "/deux", [link("Deux-un", "/deux-un")])]);
    const pub = await html(page); const pre = await boss.get(`/marketing/pages/${page}/apercu`);
    assert.equal(pre.status, 200); assert.deepEqual(labels(pre.text, "header"), labels(pub, "header")); assert.match(pre.text, /Aperçu/, "l'aperçu est signalé comme tel");
    assert.deepEqual(labels(pub, "header"), ["Un", "Deux", "Deux-un"]);
  });

  test("isolation : un site SANS menu n'affiche rien — ni celui d'un autre site, ni celui du site principal ; modifier le menu de A ne change pas B ; chaque site a le sien", async () => {
    const pageB = await mkPage(B, "Accueil B"); await mkHeader(B, "En-tête B", DEMO);
    // un menu du SITE PRINCIPAL affecté à l'en-tête : ne doit jamais apparaître chez B
    const mainMenu = await mkMenu(null, "Principal plateforme", [link("Plateforme", "/plateforme")], { locations: ["header"] }); void mainMenu;
    assert.deepEqual(labels(await html(pageB), "header"), [], "Beta n'affiche ni le menu d'Alpha ni celui du site principal");
    const mB = await mkMenu(B, "Menu Beta", [link("Beta un", "/b1"), link("Beta deux", "/b2")], { locations: ["header"] });
    const pageA = one("SELECT id FROM mk_landing_pages WHERE site_id = ? ORDER BY id LIMIT 1", A).id;
    const aBefore = labels(await html(pageA), "header"); assert.deepEqual(labels(await html(pageB), "header"), ["Beta un", "Beta deux"]);
    await saveMenu(B, mB, [link("Beta modifié", "/b3")]); assert.deepEqual(labels(await html(pageA), "header"), aBefore, "Alpha inchangé"); assert.deepEqual(labels(await html(pageB), "header"), ["Beta modifié"]);
    // les droits : l'administrateur de Beta ne lit ni ne modifie le menu d'Alpha
    const main = one("SELECT id FROM nav_menus WHERE site_id = ? AND name = 'Menu principal'", A).id;
    const read = await adminB.get(`${R}/apparence/menus?menu=${main}&site=${A}`); assert.notEqual(read.status, 200, "lecture refusée"); const w = await adminB.request(`${R}/navigation/menus/${main}/enregistrer?site=${A}`, { method: "POST", json: { revision: 1, items: [] }, headers: origin() }); assert.notEqual(w.status, 200);
    assert.deepEqual(labels(await html(pageA), "header"), aBefore, "écriture refusée : Alpha intact");
  });

  test("un site NEUF : aucune navigation imposée (pas de menu, pas d'affectation, pas de lien de démonstration) ; son premier menu affecté s'affiche aussitôt, sans composant d'en-tête (en-tête automatique)", async () => {
    const C = await mkSite("site neuf"); assert.equal(one("SELECT COUNT(*) AS n FROM nav_menus WHERE site_id = ?", C).n, 0); assert.equal(one("SELECT COUNT(*) AS n FROM nav_locations WHERE site_id = ?", C).n, 0);
    const page = await mkPage(C, "Accueil C"); let out = await html(page); assert.ok(!/lp-autohead|Programme|>Blog</.test(out), "rien sans menu affecté");
    await mkMenu(C, "Menu neuf", [link("Accueil", "/"), link("Contact", "/contact")], { locations: ["header", "footer"] });
    out = await html(page); assert.match(out, /<header class="lp-autohead">/); assert.deepEqual(labels(out, "header"), ["Accueil", "Contact"]); assert.deepEqual(labels(out, "footer"), ["Accueil", "Contact"]);
    assert.equal(headerNavCount(out), 1, "un seul menu d'en-tête");
    // un en-tête composé qui montre DÉJÀ le menu (widget Menu → emplacement) : pas d'en-tête automatique en double
    await mkHeader(C, "En-tête C", { label: "Navigation", source: "location", location: "header", items: [] });
    out = await html(page); assert.ok(!/lp-autohead/.test(out), "pas d'en-tête automatique quand l'en-tête composé affiche déjà le menu"); assert.deepEqual(labels(out, "header"), ["Accueil", "Contact"], "le menu apparaît"); assert.equal(headerNavCount(out), 1, "une seule fois");
    // en-tête retiré pour cette page (exception) : respecté
    db.prepare("UPDATE mk_landing_pages SET header_mode = 'none' WHERE id = ?").run(page); assert.deepEqual(labels(await html(page), "header"), [], "en-tête retiré de la page : aucun menu d'en-tête");
  });

  test("une liste MANUELLE explicite n'est jamais écrasée ; le nouveau widget Menu n'embarque plus de liens de démonstration ; source « menu précis » limitée au site", async () => {
    const pageNodes = require("../src/marketing/pages/nodes");
    const blank = pageNodes.PALETTE.menu ? pageNodes.PALETTE.menu.blank() : null; assert.ok(blank, "widget Menu présent"); assert.equal(blank.props.source, "location"); assert.deepEqual(blank.props.items, []); assert.ok(!JSON.stringify(blank).includes("Programme"));
    assert.equal(pageNodes.isDemoMenu(DEMO), true); assert.equal(pageNodes.isDemoMenu({ label: "Menu de la page", items: [{ label: "Programme", url: "/catalogue" }, { label: "Blog", url: "/blog" }, { label: "Contact", url: "/contact" }] }), false);
    const D = await mkSite("site manuel"); const page = await mkPage(D, "Accueil D");
    await mkHeader(D, "En-tête D", { label: "Menu", items: [{ label: "Programme officiel", url: "/programme" }, { label: "Blog", url: "/blog" }] }); // modifié (un mot) : explicite
    await mkMenu(D, "Menu D", [link("Autre", "/autre")], { locations: ["header"] });
    assert.deepEqual(labels(await html(page), "header"), ["Programme officiel", "Blog"], "la liste écrite à la main est respectée");
    const E = await mkSite("site nommé"); const pe = await mkPage(E, "Accueil E"); await mkHeader(E, "En-tête E", { label: "Navigation", source: "name", menuName: "Menu partage", items: [] });
    await mkMenu(A, "Menu partage", [link("Chez Alpha", "/alpha")]); assert.deepEqual(labels(await html(pe), "header"), [], "un menu du même nom chez Alpha n'est jamais lu par un autre site");
    await mkMenu(E, "Menu partage", [link("Chez Echo", "/echo")]); assert.deepEqual(labels(await html(pe), "header"), ["Chez Echo"]);
  });

  test("starter pack : le menu du pack est créé DANS le site, affecté à l'en-tête s'il est libre (persistant) ; un menu déjà affecté n'est pas remplacé ; aucun autre site n'est touché", async () => {
    const P = await mkSite("site pack"), Q = await mkSite("site pack deux");
    const refs = await boss.request(`${R}/templates.json?site=${P}`, { headers: origin() }); void refs;
    const imp = (site) => boss.request(`${R}/templates/importer?site=${site}`, { method: "POST", json: { ref: "pack:formation-en-ligne", importKey: "k" + site + Date.now(), menu: true, site }, headers: origin() });
    const r1 = await imp(P); assert.ok([200, 201].includes(r1.status), r1.text.slice(0, 200));
    const m1 = one("SELECT m.id FROM nav_menus m WHERE m.site_id = ?", P); assert.ok(m1, "menu créé dans le site"); assert.equal(one("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'", P).menu_id, m1.id, "affectation explicite et persistante");
    assert.equal(one("SELECT COUNT(*) AS n FROM nav_menus WHERE site_id = ?", Q).n, 0, "aucun menu créé chez un autre site"); assert.equal(one("SELECT COUNT(*) AS n FROM nav_locations WHERE site_id = ?", Q).n, 0);
    const r2 = await imp(P); assert.ok([200, 201].includes(r2.status), r2.text.slice(0, 200)); assert.equal(one("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'", P).menu_id, m1.id, "un menu déjà affecté n'est jamais remplacé");
    assert.equal(one("SELECT COUNT(*) AS n FROM nav_menus WHERE site_id = ?", P).n, 2, "le second import ajoute un menu (nouveau nom), sans toucher au premier");
  });
});
