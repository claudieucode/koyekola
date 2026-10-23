// KOLAKISA CMS — Apparence → Menus : éditeur enregistré en un seul bloc (tout ou rien, version contrôlée), validation, emplacements, aperçu, rendu PUBLIC par site,
// isolation entre deux sites (+ le principal), permissions, sources d'extensions, performance. Vraies routes, vraie base, vrais comptes — aucune donnée simulée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const navigation = require("../src/services/navigation");

describe("apparence-menus : éditeur, enregistrement, emplacements, rendu public, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, anon, pageA, pageB, postId, catId, menuId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const NAV = "/marketing/site-web/navigation";
  const q = (site) => (site ? `?site=${site}` : "");
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const HA = "alpha.menus.test", HB = "beta.menus.test";
  const onHost = (host) => ({ headers: { "x-forwarded-host": host, "User-Agent": "Mozilla/5.0 (test)" } });
  const data = (html) => JSON.parse(/<script type="application\/json" id="nm-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const menu = (name, site = null) => Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, ?, ?)").run(site, name, name.toLowerCase().replace(/\W+/g, "-")).lastInsertRowid);
  const rev = (id) => one("SELECT revision FROM nav_menus WHERE id = ?", id).revision;
  const save = (c, id, body, site = null) => c.postJson(`${NAV}/menus/${id}/enregistrer${q(site)}`, body);
  const items = (id) => all("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY COALESCE(parent_id, 0), position", id);
  const custom = (label, url, extra = {}) => ({ key: `k${label}`, type: "custom", label, url, ...extra });
  const ok = async (c, id, body, site = null) => { const r = await save(c, id, { revision: rev(id), ...body }, site); assert.equal(r.status, 200, r.text); return JSON.parse(r.text); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (nm, host) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, settings) VALUES (?, ?, ?, '{}', ?)").run(orgId, nm, nm.toLowerCase(), JSON.stringify({ seo: { publicUrl: `https://${host}` } })).lastInsertRowid);
    A = site("Alpha", HA); B = site("Beta", HB);
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, `Titre ${slug}`, s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B);
    postId = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES ('article-menu', 'Article du menu', '<p>x</p>', 1, 'published', datetime('now'))").run().lastInsertRowid);
    catId = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Actualités', 'actualites')").run().lastInsertRowid);
    require("../src/services/urls").invalidateSites();
    menuId = menu("Menu de test");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("éditeur", () => {
    test("la page contient l'éditeur, ses données réelles (menu, version, emplacements du registre, types) et rien de factice", async () => {
      const r = await boss.get(`${NAV}/menus/${menuId}`);
      assert.equal(r.status, 200);
      for (const f of ["data-nm-save", "data-nm-undo", "data-nm-redo", "data-nm-preview", "data-nm-sections", "data-nm-tree", "Structure du menu", "Réglages du menu", "Annuler", "Rétablir"]) assert.ok(r.text.includes(f), f);
      const d = data(r.text);
      assert.equal(d.menu.name, "Menu de test"); assert.equal(d.menu.revision, 1); assert.deepEqual(d.items, []);
      assert.deepEqual(d.locations.map((l) => l.key), Object.keys(navigation.LOCATIONS));
      assert.deepEqual(Object.keys(d.types).sort(), ["article", "category", "custom", "home", "page", "tag"]);
      assert.equal(d.maxDepth, 3); assert.equal(d.canWrite, true); assert.equal(d.canPublish, true);
      assert.match(d.urls.save, /\/enregistrer$/);
      assert.match(r.text, /cms-navigation\.js/);
    });
    test("la liste : recherche, tri, dernière modification, aperçu / dupliquer / supprimer (confirmation) et état vide de recherche", async () => {
      menu("Zèbre"); menu("Alpha liste");
      const r = await boss.get(NAV);
      for (const f of ["Créer un menu", "Modifié", "Aperçu", "Dupliquer", "data-mk-confirm", 'name="q"', 'name="sort"']) assert.ok(r.text.includes(f), f);
      const names = (html) => [...html.matchAll(/<th scope="row" data-label="Menu"><span class="mk-tx-name"><a [^>]*>([^<]+)</g)].map((m) => m[1]);
      assert.deepEqual(names(r.text).filter((n) => ["Alpha liste", "Zèbre"].includes(n)), ["Alpha liste", "Zèbre"], "tri par nom");
      assert.deepEqual(names((await boss.get(`${NAV}?q=z%C3%A8bre`)).text), ["Zèbre"], "recherche");
      assert.match((await boss.get(`${NAV}?q=introuvable-xyz`)).text, /Aucun menu ne correspond/);
      db.prepare("UPDATE nav_menus SET updated_at = '2030-01-01 00:00:00' WHERE name = 'Alpha liste'").run();
      assert.equal(names((await boss.get(`${NAV}?sort=recent`)).text)[0], "Alpha liste", "tri par dernière modification");
      db.prepare("DELETE FROM nav_menus WHERE name IN ('Zèbre', 'Alpha liste')").run();
    });
  });

  describe("enregistrement", () => {
    test("ajouter une page, un article, une catégorie, un lien personnalisé : tout est écrit en base, références stables, version incrémentée", async () => {
      const v0 = rev(menuId);
      const out = await ok(boss, menuId, { items: [
        { key: "a", type: "page", object_id: pageA },
        { key: "b", type: "article", object_id: postId },
        { key: "c", type: "category", object_id: catId },
        custom("Contact", "/contact"),
      ] });
      assert.equal(out.revision, v0 + 1); assert.equal(out.count, 4); assert.equal(Object.keys(out.idMap).length, 4);
      const rows = items(menuId);
      assert.deepEqual(rows.map((r) => [r.type, r.position]), [["page", 0], ["article", 1], ["category", 2], ["custom", 3]]);
      assert.equal(rows[0].object_id, pageA); assert.equal(rows[0].url, "", "aucune adresse copiée pour une ressource");
      assert.equal(rows[3].url, "/contact");
    });
    test("réorganiser, créer un sous-menu, modifier un libellé : persiste ; le titre de la ressource n'est jamais touché", async () => {
      const cur = items(menuId);
      const [p, a, c, k] = cur;
      const out = await ok(boss, menuId, { items: [
        { id: k.id, type: "custom", label: "Nous contacter", url: "/contact", children: [] },
        { id: p.id, type: "page", object_id: pageA, label: "Notre page", children: [{ id: a.id, type: "article", object_id: postId }, { id: c.id, type: "category", object_id: catId }] },
      ] });
      assert.equal(out.created, 0); assert.equal(out.removed, 0);
      const rows = items(menuId), by = (id) => rows.find((r) => r.id === id);
      assert.equal(by(k.id).position, 0); assert.equal(by(p.id).position, 1); assert.equal(by(p.id).label, "Notre page");
      assert.equal(by(a.id).parent_id, p.id); assert.equal(by(c.id).parent_id, p.id); assert.equal(by(a.id).position, 0); assert.equal(by(c.id).position, 1);
      assert.equal(one("SELECT title FROM mk_landing_pages WHERE id = ?", pageA).title, "Titre page-alpha");
      const d = data((await boss.get(`${NAV}/menus/${menuId}`)).text);
      assert.deepEqual(d.items.map((i) => [i.id, i.parent]), [[k.id, null], [p.id, null], [a.id, p.id], [c.id, p.id]], "persistance après rechargement");
    });
    test("retirer un élément du menu ne supprime pas le contenu ; les sous-éléments absents de l'envoi disparaissent avec lui", async () => {
      const cur = items(menuId), p = cur.find((r) => r.type === "page");
      await ok(boss, menuId, { items: [{ id: cur.find((r) => r.type === "custom").id, type: "custom", label: "Nous contacter", url: "/contact" }] });
      assert.equal(items(menuId).length, 1);
      assert.ok(one("SELECT id FROM mk_landing_pages WHERE id = ?", pageA), "la page existe toujours");
      assert.ok(one("SELECT id FROM posts WHERE id = ?", postId)); assert.ok(one("SELECT id FROM taxonomy_terms WHERE id = ?", catId)); void p;
    });
    test("options : titre, classes CSS, nouvel onglet, rel, visibilité, masqué ; nom, description, état du menu", async () => {
      const k = items(menuId)[0];
      await ok(boss, menuId, { name: "Menu renommé", description: "Desc", status: "draft", items: [{ id: k.id, type: "custom", label: "Nous contacter", url: "https://exemple.org/page", title_attr: "Écrire à l'équipe", css_class: "btn  cta-lien", new_tab: true, rel: "nofollow bogus", visibility: "members", status: "hidden" }] });
      const r = items(menuId)[0], m = one("SELECT * FROM nav_menus WHERE id = ?", menuId);
      assert.deepEqual([m.name, m.description, m.status], ["Menu renommé", "Desc", "draft"]);
      assert.deepEqual([r.title_attr, r.css_class, r.new_tab, r.rel, r.visibility, r.status], ["Écrire à l'équipe", "btn cta-lien", 1, "nofollow", "members", "hidden"], "rel filtré par liste blanche");
      await ok(boss, menuId, { name: "Menu de test", status: "published", items: [{ id: r.id, type: "custom", label: "Nous contacter", url: "/contact" }] });
    });
    test("nom vide ou déjà pris refusé ; rien n'est écrit", async () => {
      const other = menu("Autre menu");
      const before = JSON.stringify([items(menuId), rev(menuId)]);
      const kk = items(menuId);
      for (const name of ["", "  ", "autre MENU"]) { const r = await save(boss, menuId, { revision: rev(menuId), name, items: kk.map((i) => ({ id: i.id, type: i.type, label: i.label, url: i.url })) }); assert.equal(r.status, 400, name); }
      assert.equal(JSON.stringify([items(menuId), rev(menuId)]), before); void other;
    });
  });

  describe("validation : tout ou rien", () => {
    const snapshot = () => JSON.stringify([all("SELECT * FROM nav_items ORDER BY id"), all("SELECT id, name, revision FROM nav_menus ORDER BY id")]);
    test("adresses dangereuses refusées (javascript:, data:, vbscript:, //hôte, espaces, retours à la ligne, ancre vide)", async () => {
      const before = snapshot();
      for (const url of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.example", "/\\evil.example", "java\nscript:alert(1)", "/a b", "#", "ftp://x.example/f", "http://sans-point"]) {
        const r = await save(boss, menuId, { revision: rev(menuId), items: [custom("Piège", url)] });
        assert.equal(r.status, 400, url); assert.equal(JSON.parse(r.text).ok, false);
      }
      assert.equal(snapshot(), before, "aucune écriture, aucune version consommée");
    });
    test("classes CSS invalides, trop nombreuses ; champ inconnu ; types, options et visibilité inconnus refusés", async () => {
      const before = snapshot();
      const bad = [{ css_class: "ok <script>" }, { css_class: "a b c d e f" }, { css_class: "9début" }, { css_class: 'x" onclick="y' }, { visibility: "tous" }, { status: "supprimé" }, { onclick: "x" }, { type: "inconnu" }];
      for (const extra of bad) { const r = await save(boss, menuId, { revision: rev(menuId), items: [custom("Option", "/x", extra)] }); assert.equal(r.status, 400, JSON.stringify(extra)); }
      assert.equal(snapshot(), before);
    });
    test("profondeur limitée à 3 niveaux, éléments en double (boucle), élément inconnu ou d'un autre menu refusés", async () => {
      const before = snapshot();
      const deep = { ...custom("n1", "/1"), children: [{ ...custom("n2", "/2"), children: [{ ...custom("n3", "/3"), children: [custom("n4", "/4")] }] }] };
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: [deep] })).status, 400);
      const good = { ...custom("n1", "/1"), children: [{ ...custom("n2", "/2"), children: [custom("n3", "/3")] }] };
      const g = await save(boss, menuId, { revision: rev(menuId), items: [good] }); assert.equal(g.status, 200, g.text);
      const rows = items(menuId);
      const dup = [{ id: rows[0].id, type: "custom", label: "x", url: "/x", children: [{ id: rows[0].id, type: "custom", label: "x", url: "/x" }] }];
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: dup })).status, 400, "même élément deux fois");
      const foreign = menu("Menu étranger"); db.prepare("INSERT INTO nav_items (menu_id, type, url, label) VALUES (?, 'custom', '/e', 'E')").run(foreign);
      const fid = one("SELECT id FROM nav_items WHERE menu_id = ?", foreign).id;
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: [{ id: fid, type: "custom", label: "E", url: "/e" }] })).status, 400, "élément d'un autre menu");
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: [{ id: 999999, type: "custom", label: "?", url: "/q" }] })).status, 400, "identifiant inconnu");
      assert.equal(items(foreign).length, 1, "l'autre menu est intact");
      const nb = items(menuId).length; assert.equal(nb, 3, "la structure valide est restée telle quelle");
    });
    test("ressource inexistante ou liste invalide refusée ; plus de 300 éléments refusé ; JSON invalide ; version absente", async () => {
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: [{ key: "z", type: "page", object_id: 987654 }] })).status, 400);
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: [{ key: "z", type: "page" }] })).status, 400, "sans sélection");
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: "nope" })).status, 400);
      assert.equal((await save(boss, menuId, { items: [] })).status, 400, "version manquante");
      assert.equal((await save(boss, menuId, { revision: "1", items: [] })).status, 400, "version non entière");
      const many = Array.from({ length: 301 }, (_, i) => custom(`L${i}`, `/l${i}`));
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: many })).status, 400);
      const raw = await boss.request(`${NAV}/menus/${menuId}/enregistrer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{pas du json" });
      assert.ok(raw.status >= 400 && raw.status < 500, `JSON invalide → ${raw.status}`);
    });
  });

  describe("conflits et doubles envois", () => {
    test("version périmée : 409, message explicite, rien n'est écrit ; recharger donne la nouvelle version", async () => {
      const stale = rev(menuId);
      await ok(boss, menuId, { name: "Menu de test", items: [custom("Version 2", "/v2")] });
      const before = JSON.stringify(items(menuId));
      const r = await save(boss, menuId, { revision: stale, items: [custom("Version périmée", "/vieux")] });
      assert.equal(r.status, 409); const d = JSON.parse(r.text); assert.equal(d.conflict, true); assert.match(d.error, /modifié ailleurs/);
      assert.equal(JSON.stringify(items(menuId)), before);
      assert.equal(data((await boss.get(`${NAV}/menus/${menuId}`)).text).menu.revision, rev(menuId));
    });
    test("deux enregistrements simultanés avec la même version : un seul réussit, l'autre est un conflit", async () => {
      const v = rev(menuId);
      const [r1, r2] = await Promise.all([save(boss, menuId, { revision: v, items: [custom("Course 1", "/c1")] }), save(boss, menuId, { revision: v, items: [custom("Course 2", "/c2")] })]);
      assert.deepEqual([r1.status, r2.status].sort(), [200, 409]);
      assert.equal(items(menuId).length, 1); assert.equal(rev(menuId), v + 1);
    });
    test("les anciennes routes (ajout, déplacement, organisation) incrémentent aussi la version : un éditeur ouvert ailleurs est averti", async () => {
      const v = rev(menuId);
      await boss.post(`${NAV}/menus/${menuId}/elements`, { type: "custom", label: "Ancien", url: "/ancien" });
      assert.ok(rev(menuId) > v);
      const v2 = rev(menuId); await boss.post(`${NAV}/menus/${menuId}/emplacements-inconnu`, {});
      const r = await save(boss, menuId, { revision: v, items: [] }); assert.equal(r.status, 409);
      assert.equal(rev(menuId), v2);
    });
  });

  describe("emplacements", () => {
    test("affecter, remplacer et libérer des emplacements depuis l'éditeur ; un menu peut occuper plusieurs emplacements", async () => {
      const m2 = menu("Menu mobile"); const cur = items(menuId);
      const keep = cur.map((i) => ({ id: i.id, type: i.type, label: i.label, url: i.url }));
      await ok(boss, menuId, { items: keep, locations: { header: true, footer: true } });
      assert.deepEqual(all("SELECT location FROM nav_locations WHERE menu_id = ? ORDER BY location", menuId).map((r) => r.location), ["footer", "header"]);
      await ok(boss, m2, { items: [], locations: { header: true } });
      assert.equal(one("SELECT menu_id FROM nav_locations WHERE location = 'header' AND site_id IS NULL").menu_id, m2, "l'emplacement est remplacé");
      await ok(boss, menuId, { items: keep, locations: { header: false, footer: false } });
      assert.equal(one("SELECT menu_id FROM nav_locations WHERE location = 'header'").menu_id, m2, "décocher ne libère pas l'emplacement d'un AUTRE menu");
      assert.equal(all("SELECT * FROM nav_locations WHERE menu_id = ?", menuId).length, 0);
      await ok(boss, m2, { items: [], locations: { header: false } });
      assert.equal(all("SELECT * FROM nav_locations").length, 0);
      db.prepare("DELETE FROM nav_menus WHERE id = ?").run(m2);
    });
    test("emplacement inconnu ou structure invalide : refusé ; l'éditeur sans droit de publication ne change aucun emplacement (403) mais peut enregistrer sans les toucher", async () => {
      const cur = items(menuId).map((i) => ({ id: i.id, type: i.type, label: i.label, url: i.url }));
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: cur, locations: { sidebar: true } })).status, 400);
      assert.equal((await save(boss, menuId, { revision: rev(menuId), items: cur, locations: ["header"] })).status, 400);
      const mA = menu("Menu Alpha éditeur", A);
      const before = all("SELECT * FROM nav_locations");
      const r = await save(editorA, mA, { revision: rev(mA), items: [], locations: { header: true } }, A);
      assert.equal(r.status, 403, r.text); assert.deepEqual(all("SELECT * FROM nav_locations"), before);
      const r2 = await save(editorA, mA, { revision: rev(mA), items: [custom("Par éditeur", "/e")], locations: { header: false } }, A);
      assert.equal(r2.status, 200, r2.text);
      const r3 = await save(adminA, mA, { revision: rev(mA), items: [custom("Par éditeur", "/e")].map((x, i) => ({ ...x, id: items(mA)[i].id })), locations: { header: true } }, A);
      assert.equal(r3.status, 200, r3.text);
      assert.equal(one("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'", A).menu_id, mA);
    });
  });

  describe("aperçu et rendu public", () => {
    test("aperçu : rendu du menu enregistré (masqués et non publiés exclus), échappé ; autre site introuvable", async () => {
      const m = menu("Menu aperçu");
      await ok(boss, m, { items: [custom("<b>Gras</b> & co", "/gras"), { ...custom("Caché", "/cache"), status: "hidden" }, { key: "p", type: "page", object_id: pageA, children: [custom("Enfant", "/enfant")] }] });
      const r = await boss.get(`${NAV}/menus/${m}/apercu`); assert.equal(r.status, 200);
      const { html } = JSON.parse(r.text);
      assert.match(html, /&lt;b&gt;Gras&lt;\/b&gt; &amp; co/); assert.doesNotMatch(html, /<b>Gras/); assert.doesNotMatch(html, /Caché/);
      assert.match(html, /Titre page-alpha/); assert.match(html, /Enfant/);
      const lim = await adminA.get(`${NAV}/menus/${m}/apercu${q(A)}`); assert.ok(lim.status === 403 || lim.status === 404, `accès limité au site A : le menu du principal n'est pas lisible (${lim.status})`);
      assert.equal((await anon.get(`${NAV}/menus/${m}/apercu`)).status === 200, false);
    });
    test("rendu public : classes et titre du lien, libellé échappé, élément masqué absent, menu en brouillon jamais affiché", async () => {
      const m = menu("Menu public");
      await ok(boss, m, { items: [custom("Offre <i>spéciale</i>", "/offre", { css_class: "mise-en-avant", title_attr: 'Voir "l\'offre" <ici>' }), { ...custom("Invisible", "/invisible"), status: "hidden" }], locations: { header: true } });
      const html = (await anon.get("/")).text, nav = (html.match(/<nav class="header-nav[\s\S]*?<\/nav>/) || [""])[0];
      assert.match(nav, /<li class="nav-item mise-en-avant">/); assert.match(nav, /title="Voir &quot;l'offre&quot; &lt;ici&gt;"/);
      assert.match(nav, /Offre &lt;i&gt;spéciale&lt;\/i&gt;/); assert.doesNotMatch(nav, /Invisible/); assert.doesNotMatch(nav, /<i>spéciale/);
      await ok(boss, m, { status: "draft", items: items(m).map((i) => ({ id: i.id, type: i.type, label: i.label, url: i.url, css_class: i.css_class, title_attr: i.title_attr, status: i.status })) });
      assert.doesNotMatch((await anon.get("/")).text, /Offre/, "brouillon : retour à l'affichage d'origine");
      db.prepare("DELETE FROM nav_locations").run();
    });
    test("contenu supprimé ou non publié : jamais de lien mort sur le site, signalé dans l'éditeur", async () => {
      const m = menu("Menu contenus");
      await ok(boss, m, { items: [{ key: "p", type: "page", object_id: pageA }, custom("Stable", "/stable")], locations: { header: true } });
      assert.match((await anon.get("/")).text, /Titre page-alpha/);
      db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(pageA);
      const gone = (await anon.get("/")).text; assert.doesNotMatch(gone, /Titre page-alpha/); assert.match(gone, /Stable/);
      const d = data((await boss.get(`${NAV}/menus/${m}`)).text); assert.equal(d.items.find((i) => i.type === "page").resource.state, "unpublished");
      db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(pageA);
      db.prepare("DELETE FROM nav_locations").run();
    });
  });

  describe("isolation entre sites", () => {
    let mA, mB;
    before(() => { mA = menu("Menu Alpha", A); mB = menu("Menu Beta", B); db.prepare("INSERT INTO nav_items (menu_id, type, url, label) VALUES (?, 'custom', '/secret-beta', 'Secret de Beta')").run(mB); });
    test("un administrateur du site A lit et enregistre SES menus, jamais ceux de B ou du principal, même en forgeant l'identifiant ou le paramètre", async () => {
      assert.equal((await adminA.get(`${NAV}/menus/${mA}${q(A)}`)).status, 200);
      for (const [path, site] of [[`${NAV}/menus/${mB}`, B], [`${NAV}/menus/${mB}`, A], [`${NAV}/menus/${mB}`, null], [`${NAV}/menus/${menuId}`, A], [`${NAV}/menus/${menuId}`, null]]) {
        const g = await adminA.get(`${path}${q(site)}`); assert.ok(g.status === 403 || g.status === 404, `GET ${path}${q(site)} → ${g.status}`);
        assert.doesNotMatch(g.text, /Secret de Beta/);
        const before = JSON.stringify([rev(mB), items(mB), items(menuId)]);
        const s = await save(adminA, path.split("/menus/")[1], { revision: 1, items: [custom("Intrus", "/intrus")] }, site);
        assert.ok(s.status === 403 || s.status === 404, `save ${path}${q(site)} → ${s.status}`);
        assert.equal(JSON.stringify([rev(mB), items(mB), items(menuId)]), before);
      }
      assert.equal((await boss.post(`${NAV}/menus/${mB}/enregistrer${q(A)}`, {})).status === 200, false);
      // l'équipe de l'organisation peut agir sur tout menu, mais le site est TOUJOURS celui du menu : un paramètre « site » forgé n'y change rien
      const forged = await save(boss, mB, { revision: rev(mB), items: items(mB).map((i) => ({ id: i.id, type: i.type, label: i.label, url: i.url })), locations: { footer: true } }, A);
      assert.equal(forged.status, 200, forged.text);
      assert.equal(one("SELECT site_id FROM nav_locations WHERE menu_id = ?", mB).site_id, B, "l'emplacement est celui du site du menu, pas du paramètre");
      assert.equal(all("SELECT * FROM nav_locations WHERE site_id = ?", A).length, 0);
      db.prepare("DELETE FROM nav_locations").run();
    });
    test("ressources d'un autre site : refusées à l'enregistrement et absentes de la recherche ; emplacement d'un menu étranger refusé", async () => {
      const r = await save(adminA, mA, { revision: rev(mA), items: [{ key: "p", type: "page", object_id: pageB }] }, A);
      assert.equal(r.status, 400); assert.match(JSON.parse(r.text).error, /n'appartient pas à ce site/);
      assert.equal(items(mA).length, 0);
      const s = JSON.parse((await adminA.get(`${NAV}/ressources${q(A)}&type=page&q=`)).text).results.map((x) => x.id);
      assert.ok(s.includes(pageA) && !s.includes(pageB));
      const bad = await save(boss, mA, { revision: rev(mA), items: [], locations: { header: true } }, A); assert.equal(bad.status, 200);
      assert.equal(one("SELECT site_id FROM nav_locations WHERE menu_id = ?", mA).site_id, A);
      db.prepare("DELETE FROM nav_locations").run();
    });
    test("rendu public par domaine : le site A montre SON menu, B (sans menu) garde son en-tête d'origine, le principal garde le sien ; aucune fuite entre les trois", async () => {
      await ok(boss, mA, { items: [custom("Lien public Alpha", "/lien-alpha")], locations: { header: true } }, A);
      await ok(boss, menuId, { items: [custom("Lien du principal", "/lien-principal")], locations: { header: true } });
      const nav = (h) => (h.match(/<nav class="header-nav[\s\S]*?<\/nav>/) || [""])[0];
      // le serveur garde la liste des domaines de sites quelques secondes : attendre qu'il connaisse ceux créés par ce test
      for (let i = 0; i < 20 && (await anon.get("/contact", onHost(HA))).status !== 200; i += 1) await new Promise((r) => setTimeout(r, 500));
      const a = nav((await anon.get("/contact", onHost(HA))).text), b = nav((await anon.get("/contact", onHost(HB))).text), p = nav((await anon.get("/contact")).text);
      assert.ok(a && b && p, "les trois hôtes servent la page avec l'en-tête");
      assert.match(a, /Lien public Alpha/); assert.doesNotMatch(a, /Lien du principal|Secret de Beta/);
      assert.doesNotMatch(b, /Lien public Alpha|Lien du principal|Secret de Beta/);
      assert.match(p, /Lien du principal/); assert.doesNotMatch(p, /Lien public Alpha|Secret de Beta/);
      db.prepare("DELETE FROM nav_locations").run();
    });
  });

  describe("permissions", () => {
    test("anonyme : refusé ; lecteur : voit l'éditeur sans pouvoir enregistrer (403) ; éditeur : enregistre ; la lecture seule ne montre aucun contrôle d'ajout", async () => {
      const mine = menu("Menu droits", A);
      assert.notEqual((await anon.get(`${NAV}/menus/${mine}${q(A)}`)).status, 200);
      assert.equal((await save(anon, mine, { revision: 1, items: [] }, A)).status === 200, false);
      const v = await viewerA.get(`${NAV}/menus/${mine}${q(A)}`); assert.equal(v.status, 200);
      assert.equal(data(v.text).canWrite, false); assert.match(v.text, /Lecture seule/);
      assert.equal((await save(viewerA, mine, { revision: rev(mine), items: [custom("Non", "/non")] }, A)).status, 403);
      assert.equal(items(mine).length, 0);
      assert.equal((await save(editorA, mine, { revision: rev(mine), items: [custom("Oui", "/oui")] }, A)).status, 200);
      const stranger = await newStudent(srv); assert.notEqual((await stranger.get(`${NAV}/menus/${mine}`)).status, 200);
    });
    test("l'enregistrement est journalisé (qui, combien d'éléments)", async () => {
      const row = one("SELECT * FROM mk_audit_logs WHERE action = 'menu.saved' ORDER BY id DESC LIMIT 1");
      assert.ok(row); assert.equal(row.resource_type, "menu"); assert.match(row.metadata, /items/);
    });
  });

  describe("recherche de ressources et performance", () => {
    test("pagination : 'hasMore' et 'offset' parcourent toute la liste sans doublon ni perte", async () => {
      const ins = db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, 'published', 'page', ?, datetime('now', ?))");
      for (let i = 0; i < 45; i += 1) ins.run(orgId, `pg${i}`, `pagination-${i}`, `Pagination ${i}`, A, `-${i} minutes`);
      const got = []; let offset = 0, more = true, guard = 0;
      while (more && guard++ < 10) { const d = JSON.parse((await adminA.get(`${NAV}/ressources${q(A)}&type=page&q=pagination&offset=${offset}`)).text); got.push(...d.results.map((r) => r.id)); offset += d.results.length; more = d.hasMore; }
      assert.equal(got.length, 45); assert.equal(new Set(got).size, 45);
      assert.equal(JSON.parse((await adminA.get(`${NAV}/ressources${q(A)}&type=page&q=pagination`)).text).results.length, 20);
      assert.equal((await adminA.get(`${NAV}/ressources${q(A)}&type=inconnu`)).status, 400);
    });
    test("menu volumineux : 300 éléments sur 3 niveaux enregistrés, ouverts et rendus rapidement ; au-delà de 300 refusé", async () => {
      const m = menu("Menu volumineux");
      const tree = Array.from({ length: 10 }, (_, a) => ({ ...custom(`R${a}`, `/r${a}`), children: Array.from({ length: 9 }, (_, b) => ({ ...custom(`R${a}-${b}`, `/r${a}/${b}`), children: Array.from({ length: 2 }, (_, c) => custom(`R${a}-${b}-${c}`, `/r${a}/${b}/${c}`)) })) }));
      const total = 10 + 90 + 180; assert.equal(total, 280);
      const t0 = Date.now(); const out = await ok(boss, m, { items: tree, locations: { header: true } }); const tSave = Date.now() - t0;
      assert.equal(out.count, 280); assert.equal(items(m).length, 280);
      const t1 = Date.now(); const ed = await boss.get(`${NAV}/menus/${m}`); const tOpen = Date.now() - t1;
      assert.equal(data(ed.text).items.length, 280);
      const t2 = Date.now(); const pub = await anon.get("/"); const tPub = Date.now() - t2;
      assert.match(pub.text, /R9-8-1/);
      assert.ok(tSave < 3000 && tOpen < 3000 && tPub < 3000, `save ${tSave} ms, éditeur ${tOpen} ms, public ${tPub} ms`);
      db.prepare("DELETE FROM nav_locations").run();
    });
  });
});
