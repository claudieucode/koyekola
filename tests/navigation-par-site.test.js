// R8 lot 4 — Navigation et Menus PAR SITE (serveur réel) : les menus, éléments et emplacements d'un site sont les siens ; lecture, écriture, recherche de ressources, emplacements et rendu restent limités au site ;
// un menu ou un élément d'un autre site est introuvable même appelé par son identifiant ; les droits du rôle s'appliquent. Aucune migration : nav_menus / nav_locations portaient déjà site_id.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");

describe("navigation par site", () => {
  let srv, boss, db, A, B, adminA, editorA, viewerA, adminB, anon, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const NAV = "/marketing/site-web/navigation";
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const menu = (name, site) => Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, ?, ?)").run(site, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
  const page = (name, site) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (1, ?, ?, ?, 'published', ?)").run(name, name.toLowerCase().replace(/\W+/g, "-"), name, site).lastInsertRowid);
  const post = (slug, site) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status) VALUES (?, ?, '<p>x</p>', 1, 'published')").run(slug, `Titre ${slug}`).lastInsertRowid); if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, 1, ?)").run(id, site); return id; };
  const term = (slug, site, taxonomy = "category") => { const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES (?, ?, ?)").run(taxonomy, `Terme ${slug}`, slug).lastInsertRowid); if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, 1, ?, ?)").run(id, site, taxonomy); return id; };
  const items = (menuId) => all("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY id", menuId);
  const frame = (html, name) => html.includes(`mk-site-banner-name">${name}<`);
  const canRole = (role, perm) => access.permissionsOf(role).has(perm);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Nav"); B = await mkSite("Bravo Nav");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    ids.mA = menu("Menu Alpha", A); ids.mB = menu("Menu Bravo", B); ids.mP = menu("Menu Principal", null);
    ids.pA = page("Page Alpha", A); ids.pB = page("Page Bravo", B); ids.pP = page("Page Principale", null);
    ids.aA = post("art-alpha", A); ids.aB = post("art-bravo", B); ids.cA = term("cat-alpha", A); ids.cB = term("cat-bravo", B); ids.tA = term("tag-alpha", A, "tag");
    db.prepare("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES (?, 'page', ?, '')").run(ids.mB, ids.pB); ids.iB = one("SELECT id FROM nav_items WHERE menu_id = ?", ids.mB).id;
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'entrée « Navigation » s'ouvre dans le cadre du site (équipe, administrateur, lecteur) ; autre site refusé ; anonyme → connexion ; « Apparence → Menus » mène au même écran", async () => {
    for (const [who, c] of [["équipe", boss], ["administrateur", adminA], ["lecteur", viewerA]]) {
      const r = await c.get(`${SP}/${A}/navigation`); assert.equal(r.status, 200, who); assert.ok(frame(r.text, "Alpha Nav"), `${who} : cadre`);
      assert.match(r.text, /Menu Alpha/); assert.doesNotMatch(r.text, /Menu Bravo|Menu Principal/, `${who} : aucun menu d'un autre site`);
    }
    assert.equal((await adminB.get(`${SP}/${A}/navigation`)).status, 403);
    const a = await anon.get(`${SP}/${A}/navigation`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    assert.ok((await adminA.get(`${SP}/${A}/articles`)).text.includes(`${SP}/${A}/navigation`), "le menu du site porte le lien");
    assert.match((await boss.get(`${NAV}?site=${B}`)).text, /Menu Bravo/);
    const main = (await boss.get(NAV)).text; assert.match(main, /Menu Principal/); assert.doesNotMatch(main, /Menu Alpha|Menu Bravo/, "le site principal ne montre que ses menus");
  });
  test("création : un menu créé dans l'espace d'Alpha appartient à Alpha (même si le corps désigne un autre site) ; le lecteur ne crée rien ; un nom déjà pris par un AUTRE site reste possible", async () => {
    const before = one("SELECT COUNT(*) n FROM nav_menus").n;
    assert.equal((await viewerA.post(`${NAV}/menus?site=${A}`, { site: A, name: "Pirate lecteur" })).status, 403);
    assert.equal((await adminB.post(`${NAV}/menus?site=${A}`, { site: A, name: "Pirate B" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus").n, before);
    const r = await adminA.post(`${NAV}/menus?site=${A}`, { site: B, name: "Menu Bravo", description: "même nom que Bravo" });
    assert.equal(r.status, 302); assert.match(r.location, /\/menus\/\d+.*site=\d+/);
    const created = one("SELECT id, site_id s FROM nav_menus WHERE name = 'Menu Bravo' AND site_id = ?", A); assert.ok(created, "créé pour Alpha"); assert.equal(created.s, A);
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE name = 'Menu Bravo'").n, 2, "deux sites, même nom : permis (unicité par site)");
    assert.equal(canRole("editor", "navigation.write"), (await editorA.post(`${NAV}/menus?site=${A}`, { site: A, name: "Menu éditeur" })).status === 302, "l'éditeur suit exactement son droit navigation.write");
  });
  test("éléments : Alpha n'ajoute que SES pages, articles et catégories (ressource d'un autre site ou du principal refusée, rien d'écrit) ; la recherche ne propose que les ressources d'Alpha", async () => {
    const add = (type, oid, site = A, c = adminA, menuId = ids.mA) => c.post(`${NAV}/menus/${menuId}/elements?site=${site}`, { site, type, object_id: String(oid) });
    await add("page", ids.pB); await add("page", ids.pP); await add("article", ids.aB); await add("category", ids.cB); await add("tag", ids.cB);
    assert.equal(items(ids.mA).length, 0, "aucune ressource étrangère ajoutée");
    await add("page", ids.pA); await add("article", ids.aA); await add("category", ids.cA); await add("tag", ids.tA);
    assert.deepEqual(items(ids.mA).map((i) => [i.type, i.object_id]), [["page", ids.pA], ["article", ids.aA], ["category", ids.cA], ["tag", ids.tA]]);
    for (const [type, q, mine, other] of [["page", "Page", "Page Alpha", "Page Bravo"], ["article", "art", "art-alpha", "art-bravo"], ["category", "Terme", "Terme cat-alpha", "Terme cat-bravo"]]) {
      const r = await adminA.get(`${NAV}/ressources?type=${type}&q=${encodeURIComponent(q)}&site=${A}`); assert.equal(r.status, 200);
      const txt = JSON.stringify(JSON.parse(r.text).results); assert.ok(txt.includes(mine), `${type} : ${mine}`); assert.ok(!txt.includes(other) && !txt.includes("Principale"), `${type} : aucune ressource étrangère`);
    }
    assert.equal((await adminB.get(`${NAV}/ressources?type=page&q=Page&site=${A}`)).status, 403);
    const principal = JSON.parse((await boss.get(`${NAV}/ressources?type=page&q=Page`)).text).results; assert.ok(principal.length >= 3, "le site principal garde sa recherche historique (toutes les pages)");
    const viewerAdd = items(ids.mA).length; await add("page", ids.pA, A, viewerA); assert.equal(items(ids.mA).length, viewerAdd, "le lecteur n'ajoute rien");
  });
  test("accès croisés par identifiant : modifier, déplacer, réorganiser, dupliquer, supprimer un menu ou un élément d'un AUTRE site (même avec le site de l'adresse) est refusé et sans effet", async () => {
    const snap = () => JSON.stringify([all("SELECT id, site_id, name, status FROM nav_menus ORDER BY id"), all("SELECT * FROM nav_items ORDER BY id"), all("SELECT * FROM nav_locations ORDER BY id")].map((x) => x.map((r) => ({ ...r }))));
    const before = snap();
    const attempts = [
      [`${NAV}/menus/${ids.mB}?site=${A}`, { site: A, name: "Piraté" }], [`${NAV}/menus/${ids.mB}/dupliquer?site=${A}`, { site: A }], [`${NAV}/menus/${ids.mB}/supprimer?site=${A}`, { site: A }],
      [`${NAV}/menus/${ids.mB}/elements?site=${A}`, { site: A, type: "home" }], [`${NAV}/elements/${ids.iB}?site=${A}`, { site: A, label: "Piraté" }], [`${NAV}/elements/${ids.iB}/supprimer?site=${A}`, { site: A }],
      [`${NAV}/elements/${ids.iB}/deplacer?site=${A}`, { site: A, direction: "down" }], [`${NAV}/menus/${ids.mP}/supprimer?site=${A}`, { site: A }], [`${NAV}/menus/${ids.mP}/elements`, { type: "home" }],
    ];
    for (const [url, body] of attempts) for (const c of [adminA, editorA]) { const r = await c.post(url, body); assert.ok([302, 403, 404].includes(r.status), `${url} ${r.status}`); }
    const org = await adminA.request(`${NAV}/menus/${ids.mB}/organiser?site=${A}`, { method: "POST", json: { tree: [] } }); assert.ok([403, 404].includes(org.status), `organiser ${org.status}`);
    assert.equal(snap(), before, "aucune donnée d'un autre site modifiée");
    assert.equal((await adminA.get(`${NAV}/menus/${ids.mB}`)).status, 403, "ouvrir le menu d'un autre site par son identifiant : refusé à un membre d'Alpha");
    assert.equal((await adminA.get(`${NAV}/menus/${ids.mP}`)).status, 403, "menu du site principal : refusé à un accès limité");
  });
  test("emplacements : le menu d'Alpha s'affecte à l'en-tête d'ALPHA ; un menu d'un autre site ou du principal est refusé ; l'affectation du site n'a aucun effet sur le principal ni sur Bravo", async () => {
    const loc = (site) => all("SELECT location, menu_id FROM nav_locations WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site).map((r) => ({ ...r }));
    await adminA.post(`${NAV}/emplacements?site=${A}`, { site: A, header: String(ids.mB) }); await adminA.post(`${NAV}/emplacements?site=${A}`, { site: A, header: String(ids.mP) });
    assert.deepEqual(loc(A), [], "menus étrangers refusés");
    await adminA.post(`${NAV}/emplacements?site=${A}`, { site: A, header: String(ids.mA) });
    assert.deepEqual(loc(A), [{ location: "header", menu_id: ids.mA }]); assert.deepEqual(loc(B), []); assert.deepEqual(loc(null), [], "le principal n'est pas touché");
    await viewerA.post(`${NAV}/emplacements?site=${A}`, { site: A, header: "" }); assert.deepEqual(loc(A), [{ location: "header", menu_id: ids.mA }], "le lecteur ne change rien");
    assert.match((await adminA.get(`${SP}/${A}/navigation`)).text, /Menu Alpha/);
  });
  test("« Créer à partir du site actuel » : réservé au site principal (refusé dans un site, aucun menu créé)", async () => {
    const before = one("SELECT COUNT(*) n FROM nav_menus").n;
    await adminA.post(`${NAV}/importer?site=${A}`, { site: A }); await boss.post(`${NAV}/importer?site=${B}`, { site: B });
    assert.equal(one("SELECT COUNT(*) n FROM nav_menus").n, before);
    assert.doesNotMatch((await adminA.get(`${SP}/${A}/navigation`)).text, /Créer à partir du site actuel/);
  });
  test("éditeur d'un menu de site : les liens, formulaires et redirections gardent le site ; chaque lien suivi reste dans le site ; le sélecteur de ressources reçoit le site du menu", async () => {
    const r = await adminA.get(`${NAV}/menus/${ids.mA}?site=${A}`); assert.equal(r.status, 200); assert.ok(frame(r.text, "Alpha Nav"));
    const dataOf = (html) => JSON.parse(/<script type="application\/json" id="nm-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
    const urls = dataOf(r.text).urls;
    for (const k of ["save", "resources", "preview"]) assert.match(urls[k], new RegExp(`[?&]site=${A}$`), `le site du menu est posé par le serveur pour l'éditeur (${k})`);
    const blocks = r.text.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) || []; const mine = blocks.filter((b) => /action="\/marketing\/site-web\/navigation/.test(b)); assert.ok(mine.length >= 2);
    for (const b of mine) assert.match(b, new RegExp(`name="site" value="${A}"`), "formulaire sans site");
    const edit = await adminA.post(`${NAV}/menus/${ids.mA}?site=${A}`, { site: A, name: "Menu Alpha", description: "ok", status: "published" }); assert.equal(edit.status, 302); assert.match(edit.location, new RegExp(`site=${A}`), "retour avec le site");
    const principal = await boss.get(`${NAV}/menus/${ids.mP}`); for (const k of ["save", "resources", "preview"]) assert.doesNotMatch(dataOf(principal.text).urls[k], /site=/, `menu du principal : pas de site (${k})`);
  });
  test("lecture seule : le lecteur voit les menus et leurs éléments sans bouton d'écriture ; les routes d'écriture lui répondent 403 (selon son droit navigation.write)", async () => {
    const r = await viewerA.get(`${NAV}/menus/${ids.mA}?site=${A}`); assert.equal(r.status, canRole("viewer", "navigation.read") ? 200 : 403);
    if (r.status === 200) assert.doesNotMatch(r.text, /data-mk-modal-open="nouveau-menu"|name="label"/);
    assert.equal(canRole("viewer", "navigation.write"), false);
  });
});
