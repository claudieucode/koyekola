// Programme 20.7 — scénarios d'intégration du Site Builder par accès direct aux routes (vrai serveur, base d'essai jetable) :
// gestion de plusieurs sites, droits d'une personne limitée à un site, repli du Theme Builder, prix d'un panier calculé par le serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("Programme 20.7 : intégration Site Builder", () => {
  let srv, boss, db, orgId, A, B, editorA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const count = (sql, ...a) => one(sql, ...a).n;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
  });
  after(() => { db.close(); return srv.stop(); });

  test("scénarios A et G : deux sites créés par la route réelle sont vides et indépendants", async () => {
    for (const name of ["Site Alpha", "Site Beta"]) {
      const r = await boss.post("/marketing/site-web/sites", { name, slug: name.toLowerCase().replace(/\s+/g, "-"), site_type: "vitrine" });
      assert.ok([200, 302, 303].includes(r.status), `création de ${name} : ${r.status}`);
    }
    A = one("SELECT id FROM mk_sites WHERE name = 'Site Alpha'").id; B = one("SELECT id FROM mk_sites WHERE name = 'Site Beta'").id;
    assert.notEqual(A, B);
    for (const s of [A, B]) {
      assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", s), 0, "un site neuf ne contient aucune page");
      assert.equal(count("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ?", s), 0, "ni menu");
    }
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Accueil Alpha', 'accueil-alpha', 'Accueil Alpha', '[]', 'draft', 'page', ?)").run(orgId, A);
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", B), 0, "une page créée dans A n'apparaît pas dans B");
  });

  test("création, archivage et restauration d'un site : états cohérents et slug unique", async () => {
    const dup = await boss.post("/marketing/site-web/sites", { name: "Autre Alpha", slug: "site-alpha" });
    assert.notEqual(dup.status, 500);
    assert.equal(count("SELECT COUNT(*) n FROM mk_sites WHERE slug = 'site-alpha'"), 1, "le slug reste unique");
    await boss.post(`/marketing/site-web/sites/${B}/archiver`, {});
    assert.ok(one("SELECT archived_at a FROM mk_sites WHERE id = ?", B).a, "archivé");
    await boss.post(`/marketing/site-web/sites/${B}/restaurer`, {});
    assert.equal(one("SELECT archived_at a FROM mk_sites WHERE id = ?", B).a, null, "restauré");
  });

  test("personne limitée au site A : ne crée aucun site, ne supprime pas son site, ne touche pas aux modèles de thème (réglage d'organisation)", async () => {
    editorA = await newStudent(srv);
    const uid = one("SELECT id FROM users WHERE email = ?", editorA.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, uid);
    const sitesBefore = count("SELECT COUNT(*) n FROM mk_sites");
    const settingsBefore = JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key = 'theme.templates'").all());
    const pageA = one("SELECT id FROM mk_landing_pages WHERE site_id = ?", A).id;
    for (const [path, body] of [
      ["/marketing/site-web/sites", { name: "Pirate", slug: "pirate" }],
      [`/marketing/site-web/sites/${A}/supprimer`, {}],
      [`/marketing/site-web/sites/${B}/archiver`, {}],
      ["/marketing/site-web/modeles-de-theme", { type: "not_found", page_id: String(pageA) }],
    ]) {
      const r = await editorA.post(path, body);
      assert.notEqual(r.status, 500, path);
    }
    assert.equal(count("SELECT COUNT(*) n FROM mk_sites"), sitesBefore, "aucun site créé ni supprimé");
    assert.equal(one("SELECT deleted_at d FROM mk_sites WHERE id = ?", A).d, null, "site A intact");
    assert.equal(one("SELECT archived_at a FROM mk_sites WHERE id = ?", B).a, null, "site B non archivé");
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE key = 'theme.templates'").all()), settingsBefore, "modèles de thème inchangés");
    const get = await editorA.get("/marketing/site-web/modeles-de-theme");
    assert.notEqual(get.status, 200, "l'écran des modèles de thème est réservé à l'équipe tant qu'il n'est pas propre à chaque site");
  });

  test("Theme Builder : sans modèle le site garde son affichage d'origine (repli explicite) ; un brouillon n'est jamais retenu ; un modèle publié gagne", async () => {
    const solved = async () => (await boss.get("/marketing/site-web/modeles-de-theme/resolution.json?type=not_found")).json || JSON.parse((await boss.get("/marketing/site-web/modeles-de-theme/resolution.json?type=not_found")).text);
    let out = await solved();
    assert.match(out.fallback || "", /affichage d'origine/, "repli annoncé quand aucun modèle n'existe");
    const pid = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind) VALUES (?, '404 modèle', 'modele-404', '404', '[]', 'draft', 'page')").run(orgId).lastInsertRowid);
    await boss.post("/marketing/site-web/modeles-de-theme", { type: "not_found", page_id: String(pid) });
    out = await solved();
    assert.match(out.fallback || "", /affichage d'origine/, "un modèle en brouillon ne s'applique pas");
    db.prepare("UPDATE mk_landing_pages SET status = 'published', published_at = datetime('now') WHERE id = ?").run(pid);
    out = await solved();
    assert.equal(out.fallback || "", "", "publié : le modèle s'applique");
  });

  test("E-commerce : le prix du panier vient de la base, pas du navigateur", async () => {
    const course = await createCourse(boss, srv, { title: "Formation prix", price: 20 });
    const student = await newStudent(srv);
    const id = course.id || course;
    await student.post(`/panier/ajouter/${id}`, { price_cents: "1", price: "0.01", total: "1" });
    const cart = await student.get("/panier");
    assert.equal(cart.status, 200);
    assert.doesNotMatch(cart.text, /0[,.]01\s*€|€\s*0[,.]01/);
    assert.match(cart.text, /20/);
  });

  test("anonyme : panier et commande exigent une connexion", async () => {
    const anon = new Client(srv.base);
    for (const p of ["/panier", "/commande"]) {
      const r = await anon.get(p);
      assert.ok([301, 302, 303, 401, 403].includes(r.status), `${p} → ${r.status}`);
    }
  });
});
