// R8 lot 4 — Navigation par site (service et rendu, sans serveur) : portée des ressources, recherche, ajout/mise à jour validés, emplacements par site, et menu des pages d'un SITE dans le Page Builder
// (menus du site d'abord, repli sur le comportement d'avant). Le service lit la base de l'application : dossier de données JETABLE créé ici (jamais data/ du projet).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r8nav-"));
process.env.DATA_DIR = path.join(SCRATCH, "data"); process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("navigation par site : service et widget « Menu du CMS »", () => {
  let db, nav, W, S1, S2, p1, p2, pp, a1, a2, c1, c2, mS1, mS2, mP;
  const code = (fn) => { try { fn(); } catch (e) { return e.message; } return null; };
  before(() => {
    db = require("../src/config/database"); migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    nav = require("../src/services/navigation");
    const org = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org-r8nav')").run().lastInsertRowid);
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, n.toLowerCase()).lastInsertRowid);
    S1 = site("Un"); S2 = site("Deux");
    const page = (n, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'published', ?)").run(org, n, n.toLowerCase().replace(/\W+/g, "-"), n, s).lastInsertRowid);
    p1 = page("Page Un", S1); p2 = page("Page Deux", S2); pp = page("Page Principal", null);
    const post = (slug, s) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status) VALUES (?, ?, 'x', 1, 'published')").run(slug, slug).lastInsertRowid); if (s) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, org, s); return id; };
    a1 = post("art-un", S1); a2 = post("art-deux", S2);
    const term = (slug, s) => { const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)").run(slug, slug).lastInsertRowid); db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('term', ?, ?, ?, 'category')").run(id, org, s); return id; };
    c1 = term("cat-un", S1); c2 = term("cat-deux", S2);
    mS1 = nav.create({ name: "Menu Un", siteId: S1 }).id; mS2 = nav.create({ name: "Menu Deux", siteId: S2 }).id; mP = nav.create({ name: "Menu P" }).id;
    W = require("../src/marketing/pages/widgets/site.js").find((d) => d.type === "cmsmenu");
  });

  test("inSiteScope : page, article, catégorie du site seulement ; le site principal garde sa portée historique (aucune restriction)", () => {
    assert.deepEqual([nav.inSiteScope("page", p1, S1), nav.inSiteScope("page", p2, S1), nav.inSiteScope("page", pp, S1)], [true, false, false]);
    assert.deepEqual([nav.inSiteScope("article", a1, S1), nav.inSiteScope("article", a2, S1)], [true, false]);
    assert.deepEqual([nav.inSiteScope("category", c1, S1), nav.inSiteScope("category", c2, S1)], [true, false]);
    assert.equal(nav.inSiteScope("page", p2, null), true); assert.equal(nav.inSiteScope("home", 0, S1), true);
  });
  test("add / updateItem : une ressource étrangère est refusée dans un menu de site et rien n'est écrit ; mise à jour d'un élément existant dont la cible ne change pas : permise (données historiques)", () => {
    assert.match(code(() => nav.add(mS1, { type: "page", object_id: p2 })), /n'appartient pas à ce site/);
    assert.match(code(() => nav.add(mS1, { type: "article", object_id: a2 })), /n'appartient pas/); assert.match(code(() => nav.add(mS1, { type: "category", object_id: c2 })), /n'appartient pas/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?").get(mS1).n, 0);
    const it = nav.add(mS1, { type: "page", object_id: p1 });
    assert.match(code(() => nav.updateItem(it.id, { object_id: p2 })), /n'appartient pas/); assert.equal(nav.itemRow(it.id).object_id, p1);
    db.prepare("INSERT INTO nav_items (menu_id, type, object_id) VALUES (?, 'page', ?)").run(mS1, pp); const old = db.prepare("SELECT id FROM nav_items WHERE menu_id = ? AND object_id = ?").get(mS1, pp).id;
    assert.equal(code(() => nav.updateItem(old, { label: "renommé" })), null, "cible inchangée : permis");
    assert.equal(code(() => nav.add(mP, { type: "page", object_id: p2 })), null, "menu du site principal : comportement historique");
  });
  test("search : bornée au site (pages, articles, catégories) ; sans site : historique", () => {
    const titles = (type, siteId) => nav.search(type, "", 50, { siteId }).map((r) => r.title);
    assert.deepEqual(titles("page", S1), ["Page Un"]); assert.ok(titles("page", null).length >= 3);
    assert.deepEqual(titles("article", S1), ["art-un"]); assert.deepEqual(titles("category", S2), ["cat-deux"]);
  });
  test("emplacements : par site ; un menu d'un autre site refusé ; l'affectation d'un site ne change ni l'autre site ni le principal", () => {
    assert.match(code(() => nav.assign("header", mS2, { siteId: S1 })), /autre site/);
    nav.assign("header", mS1, { siteId: S1 });
    assert.deepEqual(nav.assignments({ siteId: S1 }), { header: mS1 }); assert.deepEqual(nav.assignments({ siteId: S2 }), {}); assert.deepEqual(nav.assignments(), {});
  });
  test("widget « Menu du CMS » : une page d'un site utilise d'abord ses menus ; sans menu propre, repli sur le menu du principal (comportement d'avant) ; une page du principal n'utilise jamais le menu d'un site", () => {
    nav.add(mS1, { type: "custom", url: "/un", label: "Lien Un" }); nav.add(mP, { type: "custom", url: "/principal", label: "Lien Principal" });
    nav.assign("header", mP, { siteId: null });
    const labels = (page) => ((W.data({}, { location: "header" }, { page, visitor: null }).menu || { items: [] }).items || []).map((i) => i.label || i.title);
    assert.ok(labels({ site_id: S1 }).includes("Lien Un") && !labels({ site_id: S1 }).includes("Lien Principal"), "site avec menu propre");
    assert.ok(labels({ site_id: S2 }).includes("Lien Principal"), "site sans menu propre : repli historique");
    assert.ok(labels({ site_id: null }).includes("Lien Principal") && !labels({ site_id: null }).includes("Lien Un"), "page du principal : menu du principal");
    assert.ok(!labels({ site_id: S2 }).includes("Lien Un"), "jamais le menu d'un autre site");
    const named = (page) => (W.data({}, { location: "name", menuName: "Menu Un" }, { page, visitor: null }).menu || { items: [] }).items.map((i) => i.label);
    assert.ok(named({ site_id: S1 }).includes("Lien Un") && !named({ site_id: S1 }).includes("Lien Principal"), "menu précis d'un site");
  });
});
