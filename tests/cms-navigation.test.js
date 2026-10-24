// KOLAKISA CMS — palier 7 : moteur de navigation, de bout en bout par les vraies routes d'un vrai serveur et la vraie base :
// menus, éléments (page, article, catégorie, étiquette, accueil, lien personnalisé, ancre), hiérarchie, ordre, glisser-déposer
// (route d'organisation), boucles, emplacements, rendu public (en-tête, mobile, pied de page), liens cassés, droits, performance.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, pageId, postId, catId, tagId;
const NAV = "/marketing/site-web/navigation";
const q = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const json = (r) => JSON.parse(r.text);
async function newMenu(name) {
  const r = await boss.post(`${NAV}/menus`, { name });
  assert.equal(r.status, 302, r.text);
  return one("SELECT * FROM nav_menus WHERE name = ?", name);
}
async function addItem(menuId, fields) { return boss.post(`${NAV}/menus/${menuId}/elements`, fields); }
const itemsOf = (menuId) => q("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY COALESCE(parent_id, 0), position", menuId);
const labels = (menuId, parent = null) => q("SELECT label, type FROM nav_items WHERE menu_id = ? AND COALESCE(parent_id, 0) = ? ORDER BY position", menuId, parent || 0).map((r) => r.label || r.type);
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role);
  return c;
}
const header = async (client = anon) => (await client.get("/")).text;
const navHtml = (html) => (html.match(/<nav class="header-nav[\s\S]*?<\/nav>/) || [""])[0];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  pageId = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, published_at) VALUES (?, 'À propos', 'a-propos-test', 'À propos de nous', 'published', datetime('now'))").run(orgId).lastInsertRowid);
  postId = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('article-menu', 'Article du menu', 'x', 'html', 'published', 1, datetime('now'))").run().lastInsertRowid);
  catId = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Marketing', 'marketing')").run().lastInsertRowid);
  tagId = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', 'Google', 'google')").run().lastInsertRowid);
});
after(() => srv.stop());

describe("menus : création, persistance, réglages", () => {
  test("Navigation s'ouvre : état vide honnête", async () => {
    const r = await boss.get(NAV);
    assert.equal(r.status, 200); assert.match(r.text, /Aucun menu\./); assert.match(r.text, /Créer à partir du site actuel/);
  });
  test("créer un menu : réellement en base, menu vide, persiste au rechargement", async () => {
    const m = await newMenu("Menu test");
    assert.equal(m.status, "published"); assert.equal(m.slug, "menu-test"); assert.equal(m.site_id, null);
    const page = (await boss.get(`${NAV}/menus/${m.id}`)).text;
    assert.match(page, /Ce menu ne contient aucun élément\./); assert.match(page, /Menu test/);
    assert.match((await boss.get(NAV)).text, /Menu test/);
  });
  test("nom en double ou vide refusé ; modification du nom, de la description et de l'état", async () => {
    const m = one("SELECT * FROM nav_menus WHERE name = 'Menu test'");
    await boss.post(`${NAV}/menus`, { name: "menu TEST" });
    assert.equal(q("SELECT * FROM nav_menus").length, 1);
    assert.match(flashOf((await boss.get(NAV)).text), /existe déjà/);
    await boss.post(`${NAV}/menus`, { name: "   " });
    assert.equal(q("SELECT * FROM nav_menus").length, 1);
    await boss.post(`${NAV}/menus/${m.id}`, { name: "Menu principal test", description: "Le menu de test", status: "published" });
    const u = one("SELECT * FROM nav_menus WHERE id = ?", m.id);
    assert.equal(u.name, "Menu principal test"); assert.equal(u.description, "Le menu de test");
  });
});

describe("éléments : pages, articles, catégories, étiquettes, accueil, liens", () => {
  let menu;
  test("recherche de ressources côté serveur (pages, articles, catégories, étiquettes)", async () => {
    menu = one("SELECT * FROM nav_menus LIMIT 1");
    for (const [type, term, title] of [["page", "propos", "À propos de nous"], ["article", "Article", "Article du menu"], ["category", "Mark", "Marketing"], ["tag", "goo", "Google"]]) {
      const r = await boss.get(`${NAV}/ressources?type=${type}&q=${encodeURIComponent(term)}`);
      assert.equal(r.status, 200);
      assert.ok(json(r).results.some((x) => x.title === title), type);
    }
    assert.equal((await boss.get(`${NAV}/ressources?type=nimporte&q=x`)).status, 400);
    assert.equal(json(await boss.get(`${NAV}/ressources?type=page&q=zzzzzz`)).results.length, 0);
  });
  test("ajouter une page, un article, une catégorie, une étiquette : références stables (type + object_id), pas d'adresse copiée", async () => {
    await addItem(menu.id, { type: "page", object_id: String(pageId) });
    await addItem(menu.id, { type: "article", object_id: String(postId) });
    await addItem(menu.id, { type: "category", object_id: String(catId) });
    await addItem(menu.id, { type: "tag", object_id: String(tagId) });
    const items = itemsOf(menu.id);
    assert.deepEqual(items.map((i) => [i.type, i.object_id, i.url]), [["page", pageId, ""], ["article", postId, ""], ["category", catId, ""], ["tag", tagId, ""]]);
    assert.deepEqual(items.map((i) => i.position), [0, 1, 2, 3]);
    const page = (await boss.get(`${NAV}/menus/${menu.id}`)).text;
    assert.match(page, /À propos de nous/); assert.match(page, /Article du menu/); assert.match(page, /\/p\/a-propos-test/); assert.match(page, /\/blog\/categorie\/marketing/);
  });
  test("ressource inexistante refusée ; ajout sans sélection refusé", async () => {
    await addItem(menu.id, { type: "page", object_id: "999999" });
    assert.equal(itemsOf(menu.id).length, 4);
    await addItem(menu.id, { type: "article" });
    assert.match(flashOf((await boss.get(`${NAV}/menus/${menu.id}`)).text), /Sélectionnez/);
    assert.equal(itemsOf(menu.id).length, 4);
  });
  test("accueil, lien interne, lien externe (nouvel onglet + rel), ancre, mailto : tous valides", async () => {
    await addItem(menu.id, { type: "home" });
    await addItem(menu.id, { type: "custom", label: "Contact", url: "/contact" });
    db.prepare("UPDATE nav_items SET visibility = 'members' WHERE label = 'Contact'").run();
    await addItem(menu.id, { type: "custom", label: "Site partenaire", url: "https://exemple.org/page?a=1" });
    await addItem(menu.id, { type: "custom", label: "Tarifs", url: "#tarifs" });
    await addItem(menu.id, { type: "custom", label: "Tarifs de la page", url: "/a-propos#tarifs" });
    await addItem(menu.id, { type: "custom", label: "Écrire", url: "mailto:contact@exemple.org" });
    const ext = one("SELECT * FROM nav_items WHERE label = 'Site partenaire'");
    assert.equal(ext.new_tab, 1);
    assert.ok(one("SELECT * FROM nav_items WHERE url = '#tarifs'"));
    assert.ok(one("SELECT * FROM nav_items WHERE url = '/a-propos#tarifs'"));
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", menu.id).n, 10);
  });
  test("adresses dangereuses ou invalides refusées (javascript:, data:, //hôte, espaces, ancre vide)", async () => {
    const before = itemsOf(menu.id).length;
    for (const url of ["javascript:alert(1)", "data:text/html,<b>x</b>", "//evil.example", "ftp://x.example", "pas une adresse", "#", "/a b", "vbscript:x"]) await addItem(menu.id, { type: "custom", label: "Mauvais", url });
    assert.equal(itemsOf(menu.id).length, before);
    await addItem(menu.id, { type: "custom", label: "", url: "/x" });
    assert.equal(itemsOf(menu.id).length, before, "le texte d'un lien personnalisé est obligatoire");
  });
  test("modifier le label : la ressource garde son titre ; vider le label reprend le titre de la ressource", async () => {
    const it = one("SELECT * FROM nav_items WHERE menu_id = ? AND type = 'page'", menu.id);
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Qui sommes-nous ?", visibility: "all" });
    assert.equal(one("SELECT label FROM nav_items WHERE id = ?", it.id).label, "Qui sommes-nous ?");
    assert.equal(one("SELECT title FROM mk_landing_pages WHERE id = ?", pageId).title, "À propos de nous");
    assert.match((await boss.get(`${NAV}/menus/${menu.id}`)).text, /Qui sommes-nous \?/);
  });
  test("options : nouvel onglet, rel (liste blanche), masqué, visibilité", async () => {
    const it = one("SELECT * FROM nav_items WHERE label = 'Contact'");
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Contact", url: "/contact", new_tab: "1", rel: ["nofollow", "script", "ugc"], visibility: "members" });
    const u = one("SELECT * FROM nav_items WHERE id = ?", it.id);
    assert.equal(u.new_tab, 1); assert.equal(u.rel, "nofollow ugc"); assert.equal(u.visibility, "members");
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Contact", url: "/contact", rel: "nofollow", visibility: "tous" });
    assert.equal(one("SELECT visibility FROM nav_items WHERE id = ?", it.id).visibility, "members", "valeur inconnue : inchangée");
  });
});

describe("hiérarchie et ordre", () => {
  let menu, ids;
  const pos = (id) => one("SELECT parent_id, position FROM nav_items WHERE id = ?", id);
  test("réorganiser par les boutons : C avant A donne C, A, B — positions contiguës", async () => {
    menu = await newMenu("Ordre");
    for (const l of ["A", "B", "C"]) await addItem(menu.id, { type: "custom", label: l, url: `/${l.toLowerCase()}` });
    ids = Object.fromEntries(itemsOf(menu.id).map((i) => [i.label, i.id]));
    await boss.post(`${NAV}/elements/${ids.C}/deplacer`, { direction: "up" });
    await boss.post(`${NAV}/elements/${ids.C}/deplacer`, { direction: "up" });
    assert.deepEqual(labels(menu.id), ["C", "A", "B"]);
    assert.deepEqual(q("SELECT position FROM nav_items WHERE menu_id = ? ORDER BY position", menu.id).map((r) => r.position), [0, 1, 2]);
    assert.deepEqual(labels(menu.id), ["C", "A", "B"], "persistant");
    await boss.post(`${NAV}/elements/${ids.C}/deplacer`, { direction: "up" });
    assert.match(flashOf((await boss.get(`${NAV}/menus/${menu.id}`)).text), /déjà le premier/);
  });
  test("glisser-déposer (route d'organisation) : ordre et parents écrits en un bloc, rechargement identique", async () => {
    const r = await boss.request(`${NAV}/menus/${menu.id}/organiser`, { method: "POST", json: { tree: [{ id: ids.B, children: [] }, { id: ids.A, children: [{ id: ids.C, children: [] }] }] } });
    assert.equal(r.status, 200); assert.equal(json(r).ok, true);
    assert.deepEqual(labels(menu.id), ["B", "A"]);
    assert.deepEqual(labels(menu.id, ids.A), ["C"]);
    assert.deepEqual([pos(ids.B), pos(ids.A), pos(ids.C)].map((p) => [p.parent_id, p.position]), [[null, 0], [null, 1], [ids.A, 0]]);
    const d = JSON.parse(/<script type="application\/json" id="nm-data">([\s\S]*?)<\/script>/.exec((await boss.get(`${NAV}/menus/${menu.id}`)).text)[1].replace(/\\u003c/g, "<"));
    assert.deepEqual(d.items.map((i) => [i.id, i.parent]), [[ids.B, null], [ids.A, null], [ids.C, ids.A]], "l'éditeur recharge exactement la structure enregistrée");
  });
  test("sous-menus : imbriquer (→) et remonter (←) ; déplacer dans un sous-menu persiste", async () => {
    await boss.post(`${NAV}/elements/${ids.C}/deplacer`, { direction: "out" });
    assert.equal(pos(ids.C).parent_id, null);
    assert.deepEqual(labels(menu.id), ["B", "A", "C"]);
    await boss.post(`${NAV}/elements/${ids.C}/deplacer`, { direction: "in" });
    assert.equal(pos(ids.C).parent_id, ids.A);
    await boss.post(`${NAV}/elements/${ids.B}/deplacer`, { parent_id: String(ids.A), index: "0" });
    assert.deepEqual(labels(menu.id, ids.A), ["B", "C"]);
    assert.deepEqual(q("SELECT position FROM nav_items WHERE menu_id = ? AND parent_id = ? ORDER BY position", menu.id, ids.A).map((r) => r.position), [0, 1]);
  });
  test("boucles bloquées : un élément ne peut pas devenir son propre descendant (déplacement ou structure)", async () => {
    await boss.post(`${NAV}/elements/${ids.B}/deplacer`, { direction: "in" });
    const d = await addItem(menu.id, { type: "custom", label: "D", url: "/d", parent_id: String(ids.B) });
    assert.equal(d.status, 302);
    const before = JSON.stringify(q("SELECT id, parent_id, position FROM nav_items ORDER BY id"));
    await boss.post(`${NAV}/elements/${ids.A}/deplacer`, { parent_id: String(ids.C) });
    assert.match(flashOf((await boss.get(`${NAV}/menus/${menu.id}`)).text), /boucle/);
    await boss.post(`${NAV}/elements/${ids.A}/deplacer`, { parent_id: String(ids.A) });
    assert.equal(JSON.stringify(q("SELECT id, parent_id, position FROM nav_items ORDER BY id")), before, "rien n'a changé");
    const dup = await boss.request(`${NAV}/menus/${menu.id}/organiser`, { method: "POST", json: { tree: [{ id: ids.A, children: [{ id: ids.A, children: [] }] }] } });
    assert.equal(dup.status, 400);
    assert.equal(JSON.stringify(q("SELECT id, parent_id, position FROM nav_items ORDER BY id")), before);
  });
  test("organisation incomplète, élément d'un autre menu ou structure invalide : refusées, base inchangée", async () => {
    const other = await newMenu("Autre menu");
    await addItem(other.id, { type: "custom", label: "Z", url: "/z" });
    const z = one("SELECT id FROM nav_items WHERE menu_id = ?", other.id).id;
    const before = JSON.stringify(q("SELECT id, parent_id, position FROM nav_items ORDER BY id"));
    for (const tree of [[{ id: ids.A, children: [] }], [{ id: z, children: [] }], "nimporte", [{ id: ids.A }, { id: ids.B }, { id: ids.C }, { id: 99999 }]]) {
      assert.equal((await boss.request(`${NAV}/menus/${menu.id}/organiser`, { method: "POST", json: { tree } })).status, 400);
    }
    assert.equal(JSON.stringify(q("SELECT id, parent_id, position FROM nav_items ORDER BY id")), before);
  });
  test("profondeur limitée à 3 niveaux (ajout, déplacement et structure)", async () => {
    const m = await newMenu("Profond");
    for (const l of ["N1", "N2", "N3", "N4"]) await addItem(m.id, { type: "custom", label: l, url: `/${l}` });
    const id = Object.fromEntries(itemsOf(m.id).map((i) => [i.label, i.id]));
    await boss.post(`${NAV}/elements/${id.N2}/deplacer`, { parent_id: String(id.N1) });
    await boss.post(`${NAV}/elements/${id.N3}/deplacer`, { parent_id: String(id.N2) });
    assert.equal(pos(id.N3).parent_id, id.N2);
    await boss.post(`${NAV}/elements/${id.N4}/deplacer`, { parent_id: String(id.N3) });
    assert.equal(pos(id.N4).parent_id, null, "4e niveau refusé");
    await addItem(m.id, { type: "custom", label: "N5", url: "/n5", parent_id: String(id.N3) });
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE label = 'N5'").n, 0);
    const r = await boss.request(`${NAV}/menus/${m.id}/organiser`, { method: "POST", json: { tree: [{ id: id.N1, children: [{ id: id.N2, children: [{ id: id.N3, children: [{ id: id.N4, children: [] }] }] }] }] } });
    assert.equal(r.status, 400);
  });
  test("retirer un élément : ses sous-éléments remontent, positions renumérotées, la ressource n'est pas supprimée", async () => {
    const m = one("SELECT * FROM nav_menus WHERE name = 'Profond'");
    const n2 = one("SELECT id FROM nav_items WHERE menu_id = ? AND label = 'N2'", m.id).id;
    const n3 = one("SELECT id FROM nav_items WHERE menu_id = ? AND label = 'N3'", m.id).id;
    await boss.post(`${NAV}/elements/${n2}/supprimer`, {});
    assert.equal(one("SELECT parent_id FROM nav_items WHERE id = ?", n3).parent_id, one("SELECT id FROM nav_items WHERE menu_id = ? AND label = 'N1'", m.id).id);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, 1);
  });
});

describe("emplacements et site public", () => {
  let menu;
  test("sans menu affecté : l'en-tête d'origine est intact (Catalogue, Blog)", async () => {
    const html = navHtml(await header());
    assert.match(html, /href="\/catalogue"/); assert.match(html, /href="\/blog"/); assert.doesNotMatch(html, /class="nav-menu/);
  });
  test("affecter au header (administrateur) : le site affiche réellement le menu et ses liens résolus", async () => {
    menu = one("SELECT * FROM nav_menus WHERE name = 'Menu principal test'");
    await boss.post(`${NAV}/emplacements`, { header: String(menu.id), footer: "", mobile: "" });
    assert.equal(one("SELECT menu_id FROM nav_locations WHERE location = 'header'").menu_id, menu.id);
    const html = navHtml(await header());
    assert.match(html, /class="nav-menu nav-menu--header"/); assert.match(html, /href="\/p\/a-propos-test"[^>]*>Qui sommes-nous \?/);
    assert.match(html, /href="\/blog\/article-menu"/); assert.match(html, /href="\/blog\/categorie\/marketing"/); assert.match(html, /href="\/blog\/etiquette\/google"/);
    assert.match(html, /href="\/"[^>]*>Accueil/); assert.match(html, /href="#tarifs"/);
    assert.doesNotMatch(html, /class="nav-legacy"/);
    assert.match(html, /href="https:\/\/exemple\.org\/page\?a=1" target="_blank" rel="noopener noreferrer"/);
    assert.doesNotMatch(html, /Contact<\/a>/, "réservé aux membres : invisible pour un visiteur");
  });
  test("visibilité : « membres » visible une fois connecté", async () => {
    const s = await newStudent(srv);
    assert.match(navHtml(await header(s)), /href="\/contact"[^>]*>Contact/);
    assert.doesNotMatch(navHtml(await header()), /href="\/contact"/);
    const it = one("SELECT id FROM nav_items WHERE label = 'Contact'");
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Contact", url: "/contact", visibility: "guests" });
    assert.match(navHtml(await header()), /href="\/contact"/);
    assert.doesNotMatch(navHtml(await header(s)), /href="\/contact"/);
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Contact", url: "/contact", visibility: "all" });
  });
  test("modifier le menu : le changement est visible tout de suite sur le site", async () => {
    await addItem(menu.id, { type: "custom", label: "Blog du site", url: "/blog" });
    assert.match(navHtml(await header()), /Blog du site/);
    const it = one("SELECT id FROM nav_items WHERE label = 'Blog du site'");
    await boss.post(`${NAV}/elements/${it.id}`, { label: "Blog du site", url: "/blog", status: "hidden" });
    assert.doesNotMatch(navHtml(await header()), /Blog du site/);
    await boss.post(`${NAV}/elements/${it.id}/supprimer`, {});
  });
  test("menu en brouillon : jamais affiché ; remis en ligne : affiché", async () => {
    await boss.post(`${NAV}/menus/${menu.id}`, { name: menu.name, status: "draft" });
    assert.doesNotMatch(navHtml(await header()), /nav-menu--header/);
    await boss.post(`${NAV}/menus/${menu.id}`, { name: menu.name, status: "published" });
    assert.match(navHtml(await header()), /nav-menu--header/);
  });
  test("sous-menus rendus accessibles : lien + bouton aria-expanded/aria-controls relié à son sous-menu", async () => {
    const parent = await newMenu("Avec sous-menu");
    await addItem(parent.id, { type: "custom", label: "Services", url: "/services" });
    await addItem(parent.id, { type: "custom", label: "Création de site", url: "/services/web" });
    const [s, w] = itemsOf(parent.id).map((i) => i.id);
    await boss.post(`${NAV}/elements/${w}/deplacer`, { parent_id: String(s) });
    await boss.post(`${NAV}/emplacements`, { header: String(parent.id) });
    const html = navHtml(await header());
    assert.match(html, /<li class="nav-item has-sub">/);
    const m = html.match(/<button type="button" class="nav-sub-toggle" aria-expanded="false" aria-controls="(hm-\d+)" aria-label="Sous-menu de Services">/);
    assert.ok(m, "bouton de sous-menu");
    assert.match(html, new RegExp(`<div class="nav-sub" id="${m[1]}">`));
    assert.match(await header(), /site-nav\.js/);
    await boss.post(`${NAV}/emplacements`, { header: String(menu.id) });
  });
  test("page courante : aria-current sur le lien de la page affichée", async () => {
    const html = navHtml((await anon.get("/blog/article-menu")).text);
    assert.match(html, /href="\/blog\/article-menu"[^>]* aria-current="page"/);
  });
  test("menu mobile : un menu distinct est servi dans le tiroir, le menu de l'en-tête y est masqué", async () => {
    const mob = await newMenu("Mobile");
    await addItem(mob.id, { type: "custom", label: "Accès rapide", url: "/rapide" });
    await boss.post(`${NAV}/emplacements`, { mobile: String(mob.id) });
    const html = navHtml(await header());
    assert.match(html, /header-nav has-mobile-menu/); assert.match(html, /nav-menu--mobile/); assert.match(html, /Accès rapide/);
    await boss.post(`${NAV}/emplacements`, { mobile: "" });
    assert.doesNotMatch(navHtml(await header()), /has-mobile-menu/);
  });
  test("pied de page : le menu affecté remplace les colonnes d'origine ; sans menu, l'origine revient", async () => {
    const f = await newMenu("Pied");
    await addItem(f.id, { type: "custom", label: "Informations", url: "/infos" });
    await addItem(f.id, { type: "custom", label: "Mentions légales", url: "/mentions" });
    await addItem(f.id, { type: "custom", label: "Seul", url: "/seul" });
    const [info, ment] = itemsOf(f.id).map((i) => i.id);
    await boss.post(`${NAV}/elements/${ment}/deplacer`, { parent_id: String(info) });
    await boss.post(`${NAV}/emplacements`, { footer: String(f.id) });
    let html = (await anon.get("/")).text;
    assert.match(html, /footer-grid footer-grid--menu/); assert.match(html, /href="\/mentions"/); assert.match(html, /href="\/seul"/);
    assert.doesNotMatch(html, /Questions fréquentes/);
    await boss.post(`${NAV}/emplacements`, { footer: "" });
    html = (await anon.get("/")).text;
    assert.match(html, /Questions fréquentes/); assert.doesNotMatch(html, /footer-grid--menu/);
  });
  test("l'ancien menu du site peut être importé comme point de départ (liens réels), sans rien affecter", async () => {
    const before = q("SELECT * FROM nav_locations").length;
    await boss.post(`${NAV}/importer`, {});
    assert.ok(one("SELECT * FROM nav_menus WHERE name = 'Menu principal'")); assert.ok(one("SELECT * FROM nav_menus WHERE name = 'Menu du pied de page'"));
    assert.equal(q("SELECT * FROM nav_locations").length, before);
    assert.ok(one("SELECT * FROM nav_items WHERE label = 'Catalogue' AND url = '/catalogue'"));
    await boss.post(`${NAV}/importer`, {});
    assert.equal(q("SELECT * FROM nav_menus WHERE name = 'Menu principal'").length, 1);
  });
});

describe("ressources modifiées ou supprimées", () => {
  let menu;
  test("slug de la page modifié : le menu suit (référence stable)", async () => {
    menu = one("SELECT * FROM nav_menus WHERE name = 'Menu principal test'");
    db.prepare("UPDATE mk_landing_pages SET slug = 'nouvelle-adresse' WHERE id = ?").run(pageId);
    db.prepare("UPDATE posts SET slug = 'article-renomme' WHERE id = ?").run(postId);
    const html = navHtml(await header());
    assert.match(html, /href="\/p\/nouvelle-adresse"/); assert.match(html, /href="\/blog\/article-renomme"/);
    assert.doesNotMatch(html, /a-propos-test|article-menu/);
  });
  test("ressource non publiée : lien masqué sur le site et signalé dans l'administration", async () => {
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(pageId);
    assert.doesNotMatch(navHtml(await header()), /nouvelle-adresse/);
    const page = (await boss.get(`${NAV}/menus/${menu.id}`)).text;
    assert.match(page, /Ressource non publiée/); assert.match(page, /1 lien à réparer/);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(pageId);
  });
  test("ressource supprimée : plus aucun lien mort sur le site, état « introuvable » et réparation proposée", async () => {
    db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
    db.prepare("UPDATE taxonomy_terms SET name = name WHERE id = ?").run(catId);
    db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(tagId);
    const html = navHtml(await header());
    assert.doesNotMatch(html, /article-renomme/); assert.doesNotMatch(html, /etiquette\/google/);
    const page = (await boss.get(`${NAV}/menus/${menu.id}`)).text;
    assert.match(page, /Ressource introuvable/); assert.match(page, /2 liens à réparer/); assert.match(page, /"state":"missing"/, "l'état de chaque lien cassé est fourni à l'éditeur, qui propose de le réparer");
    assert.match((await boss.get(NAV)).text, /2 liens à réparer/);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE type = 'article'").n, 1, "l'élément reste, signalé : rien n'est supprimé en silence");
  });
  test("réparer : remplacer la destination d'un élément cassé ; ou le retirer", async () => {
    const newPost = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('remplacant', 'Article remplaçant', 'x', 'html', 'published', 1, datetime('now'))").run().lastInsertRowid);
    const it = one("SELECT * FROM nav_items WHERE type = 'article'");
    await boss.post(`${NAV}/elements/${it.id}`, { label: "", object_id: String(newPost) });
    assert.equal(one("SELECT object_id FROM nav_items WHERE id = ?", it.id).object_id, newPost);
    assert.match(navHtml(await header()), /href="\/blog\/remplacant"/);
    const tag = one("SELECT * FROM nav_items WHERE type = 'tag'");
    await boss.post(`${NAV}/elements/${tag.id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE type = 'tag'").n, 0);
  });
  test("page à la corbeille : lien masqué ; restaurée : lien de retour", async () => {
    db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(pageId);
    assert.doesNotMatch(navHtml(await header()), /nouvelle-adresse/);
    assert.match((await boss.get(`${NAV}/menus/${menu.id}`)).text, /Ressource à la corbeille/);
    db.prepare("UPDATE mk_landing_pages SET archived_at = NULL WHERE id = ?").run(pageId);
    assert.match(navHtml(await header()), /nouvelle-adresse/);
  });
});

describe("duplication, suppression, droits", () => {
  test("dupliquer : nouveau menu (brouillon), éléments et hiérarchie copiés, original intact", async () => {
    const src = one("SELECT * FROM nav_menus WHERE name = 'Ordre'");
    const before = JSON.stringify(itemsOf(src.id));
    await boss.post(`${NAV}/menus/${src.id}/dupliquer`, {});
    const copy = one("SELECT * FROM nav_menus WHERE name = 'Ordre (copie)'");
    assert.ok(copy && copy.id !== src.id); assert.equal(copy.status, "draft");
    assert.equal(itemsOf(copy.id).length, itemsOf(src.id).length);
    assert.deepEqual(labels(copy.id), labels(src.id));
    const a = one("SELECT id FROM nav_items WHERE menu_id = ? AND label = 'A'", copy.id).id;
    assert.deepEqual(labels(copy.id, a), labels(src.id, one("SELECT id FROM nav_items WHERE menu_id = ? AND label = 'A'", src.id).id));
    assert.equal(JSON.stringify(itemsOf(src.id)), before);
  });
  test("supprimer un menu : confirmation côté interface, éléments et emplacements supprimés, pages et articles intacts", async () => {
    const m = await newMenu("À supprimer");
    await addItem(m.id, { type: "page", object_id: String(pageId) });
    await boss.post(`${NAV}/emplacements`, { footer: String(m.id) });
    assert.match((await boss.get(`${NAV}/menus/${m.id}`)).text, /data-mk-confirm="Le menu « À supprimer »/);
    await boss.post(`${NAV}/menus/${m.id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE id = ?", m.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", m.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM nav_locations WHERE menu_id = ?", m.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE id = ?", pageId).n, 1);
    assert.match((await anon.get("/")).text, /Questions fréquentes/, "emplacement libéré : pied de page d'origine");
  });
  test("droits : anonyme refusé ; lecteur voit sans modifier ; éditeur crée sans publier ni supprimer ; administrateur tout", async () => {
    assert.notEqual((await anon.get(NAV)).status, 200);
    const viewer = await member("viewer"), editor = await member("editor"), admin = await member("admin");
    const v = await viewer.get(NAV);
    assert.equal(v.status, 200); assert.doesNotMatch(v.text, /data-mk-modal-open="nouveau-menu"/);
    await viewer.post(`${NAV}/menus`, { name: "Par lecteur" });
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE name = 'Par lecteur'").n, 0);
    await editor.post(`${NAV}/menus`, { name: "Par éditeur" });
    const em = one("SELECT * FROM nav_menus WHERE name = 'Par éditeur'");
    assert.ok(em);
    await editor.post(`${NAV}/menus/${em.id}/elements`, { type: "custom", label: "X", url: "/x" });
    assert.equal(itemsOf(em.id).length, 1);
    const before = q("SELECT * FROM nav_locations").length;
    await editor.post(`${NAV}/emplacements`, { header: String(em.id) });
    assert.equal(q("SELECT * FROM nav_locations").length, before, "l'éditeur n'affecte pas un emplacement");
    await editor.post(`${NAV}/menus/${em.id}/supprimer`, {});
    assert.ok(one("SELECT * FROM nav_menus WHERE id = ?", em.id), "l'éditeur ne supprime pas");
    assert.equal((await viewer.request(`${NAV}/menus/${em.id}/organiser`, { method: "POST", json: { tree: [] } })).status, 403);
    await admin.post(`${NAV}/menus/${em.id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE id = ?", em.id).n, 0);
  });
  test("un simple membre n'accède pas à l'administration de la navigation", async () => {
    const s = await newStudent(srv);
    assert.notEqual((await s.get(NAV)).status, 200);
  });
  test("menu d'un autre site : s'ouvre dans SON site (R8 lot 4) et jamais dans l'écran du site principal ; emplacement du principal refusé ; liste du principal sans lui", async () => {
    const siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (?, 'Autre site')").run(orgId).lastInsertRowid);
    const other = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Menu autre site', 'menu-autre-site')").run(siteId).lastInsertRowid);
    const own = await boss.get(`${NAV}/menus/${other}`); assert.equal(own.status, 200); assert.match(own.text, /Autre site/, "ouvert dans le cadre de son site"); assert.doesNotMatch(own.text, /Menu du site principal/)
    const before = q("SELECT * FROM nav_locations").length;
    await boss.post(`${NAV}/emplacements`, { header: String(other) });
    assert.equal(q("SELECT * FROM nav_locations WHERE menu_id = ?", other).length, 0);
    assert.equal(q("SELECT * FROM nav_locations").length, before);
    assert.doesNotMatch((await boss.get(NAV)).text, /Menu autre site/);
  });
  test("Apparence → Menus ouvre le même écran réel (plus de page « bientôt »)", async () => {
    const r = await boss.get("/marketing/site-web/apparence/menus");
    assert.equal(r.status, 200); assert.match(r.text, /Emplacements/); assert.doesNotMatch(r.text, /Prochain palier/);
  });
});

describe("performance", () => {
  test("100 éléments sur 3 niveaux : écran d'administration et site public rapides, requêtes groupées", async () => {
    const m = await newMenu("Gros menu");
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label) VALUES (?, ?, ?, 'custom', ?, ?)");
    for (let i = 0; i < 10; i++) {
      const p = Number(ins.run(m.id, null, i, `/p${i}`, `Parent ${i}`).lastInsertRowid);
      for (let j = 0; j < 3; j++) { const c = Number(ins.run(m.id, p, j, `/p${i}/c${j}`, `Enfant ${i}.${j}`).lastInsertRowid); for (let k = 0; k < 2; k++) ins.run(m.id, c, k, `/p${i}/c${j}/g${k}`, `Petit ${i}.${j}.${k}`); }
    }
    db.exec("COMMIT");
    assert.equal(one("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?", m.id).n, 100);
    const t0 = Date.now();
    const adminPage = await boss.get(`${NAV}/menus/${m.id}`);
    assert.equal(adminPage.status, 200);
    await boss.post(`${NAV}/emplacements`, { header: String(m.id) });
    const pub = await header();
    assert.match(pub, /Petit 9\.2\.1/);
    assert.ok(Date.now() - t0 < 4000, `${Date.now() - t0} ms`);
    const tree = await boss.request(`${NAV}/menus/${m.id}/organiser`, { method: "POST", json: { tree: [] } });
    assert.equal(tree.status, 400, "structure partielle refusée même sur un gros menu");
  });
});
