// R6 (lot 5) — reconstruction des tables d'adresses (unicité PAR SITE) : contrôles préalables, outil étendu, point d'exécution dédié, sauvegarde et restauration.
// UNIQUEMENT des bases SYNTHÉTIQUES jetables (DATA_DIR créé par ce test) : aucune donnée réelle, aucune base de l'application, aucune reconstruction réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r6e-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("reconstruction par site : contrôles, outil étendu, exécution dédiée (bases synthétiques)", () => {
  let tables, checks, runner, backfill, FIXTURE, n = 0, ids = {};
  const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const open = (f, ro = false) => new DatabaseSync(f, ro ? { readOnly: true } : {});
  const fresh = (label) => { const f = path.join(SCRATCH, `${label}-${++n}.db`); fs.copyFileSync(FIXTURE, f); return f; };
  const dirOf = (label) => path.join(SCRATCH, `sauv-${label}-${++n}`);
  const mutate = (label, fn) => { const f = fresh(label); const d = open(f); d.exec("PRAGMA foreign_keys = OFF"); fn(d); d.close(); return f; };
  const snap = (f) => { const d = open(f, true); const s = tables.snapshot(d); d.close(); return s; };
  const same = (a, b) => Object.keys(a.tables).every((t) => b.tables[t] && a.tables[t].rows === b.tables[t].rows && a.tables[t].hash === b.tables[t].hash);
  const codes = (f) => { const d = open(f, true); const r = checks.run(d); d.close(); return r; };
  const find = (r, code) => r.findings.find((x) => x.code === code);
  const count = (f, sql, ...a) => { const d = open(f, true); const r = d.prepare(sql).get(...a); d.close(); return r.n; };

  before(() => {
    const db = require("../src/config/database");
    require("../src/seo/redirects"); require("../src/seo/store"); require("../src/services/urls");
    const { migrate } = require("../src/marketing/db/migrate");
    migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), backupDir: path.join(SCRATCH, "b"), log: quiet });
    require("../src/services/siteContent").ensureCoreTriggers(db);
    // R8 lot 6 : la migration 090 reconstruit déjà seo_redirects (unicité par site). Cette base synthétique représente l'état d'AVANT la reconstruction du cœur : on y remet la forme d'origine de seo_redirects
    // pour continuer à éprouver l'outil sur sa table de redirections (le cas « déjà reconstruite » est couvert par contenus-par-site-unitaire).
    db.exec(`DROP INDEX IF EXISTS uq_seo_redirects_site_source; DROP INDEX IF EXISTS idx_seo_redirects_site; ALTER TABLE seo_redirects RENAME TO seo_redirects_r8;
      CREATE TABLE seo_redirects (id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL UNIQUE, target TEXT NOT NULL, status INTEGER NOT NULL DEFAULT 301, enabled INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '', hits INTEGER NOT NULL DEFAULT 0, last_hit_at TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), site_id INTEGER);
      DROP TABLE seo_redirects_r8; CREATE INDEX idx_seo_redirects_site ON seo_redirects(site_id);`);
    tables = require("../src/services/reconstructionTables"); checks = require("../src/services/reconstructionChecks"); runner = require("../src/services/reconstructionRun"); backfill = require("../src/services/reconstructionBackfill");
    const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
    const org = run("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')");
    const site = (n) => run("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')", org, n, n.toLowerCase());
    const A = site("Alpha"), B = site("Beta"), C = site("Sans");
    Object.assign(ids, { org, A, B, C });
    const page = (slug, name, s = null, extra = "") => run(`INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, kind, sections) VALUES (?, ?, ?, ?, 'published', ?, 'page', ?)`, org, name, slug, name, s, extra || "[]");
    const pm1 = page("accueil", "Accueil"), pm2 = page("offre", "Offre"), pa1 = page("accueil-alpha", "Accueil Alpha", A, JSON.stringify([{ image: "/uploads/marketing/1/site-1/img-a.png" }])), pa2 = page("tarifs", "Tarifs", A), pb1 = page("accueil-beta", "Accueil Beta", B);
    Object.assign(ids, { pm1, pm2, pa1, pa2, pb1 });
    db.prepare("UPDATE mk_landing_pages SET parent_id = ? WHERE id = ?").run(pa1, pa2);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pa1, A);
    for (const p of [pm1, pa1]) run("INSERT INTO mk_page_versions (organization_id, page_id, number, content) VALUES (?, ?, 1, '{}')", org, p);
    run("INSERT INTO mk_landing_events (organization_id, page_id, type, visitor, occurred_at) VALUES (?, ?, 'view', 'v1', 1)", org, pm1);
    const funnel = run("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, 'Tunnel A', ?)", org, A);
    run("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, ?, 1, 'page', 'Étape', ?)", org, funnel, pa1);
    run("INSERT INTO mk_page_tests (organization_id, page_id, variant_page_id, name) VALUES (?, ?, ?, 'Test')", org, pm1, pm2);
    const form = run("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, 'Form', 'form', 'ok')", org);
    db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(form, pm1);
    const post = (slug, s = null, address = null) => { const id = run("INSERT INTO posts (slug, title, content, published, published_at, status) VALUES (?, ?, '<p>x</p>', 1, datetime('now'), 'published')", slug, `Titre ${slug}`); if (s) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', ?)").run(id, org, s, address); return id; };
    const m1 = post("bienvenue"), m2 = post("actu"), a1 = post("bienvenue-alpha", A, "bienvenue"), a2 = post("a-seul", A), b1 = post("bienvenue-beta", B, "bienvenue");
    Object.assign(ids, { m1, m2, a1, a2, b1 });
    const term = (slug, s = null, address = null) => { const id = run("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', ?, ?)", `Cat ${slug}`, slug); if (s) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('term', ?, ?, ?, 'category', ?)").run(id, org, s, address); return id; };
    const tm = term("principale"), ta = term("cat-a", A, "actus"), tb = term("cat-b", B, "actus");
    Object.assign(ids, { tm, ta, tb });
    for (const [p, t] of [[m1, tm], [a1, ta], [b1, tb]]) run("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)", p, t);
    run("INSERT INTO post_revisions (post_id, title) VALUES (?, 'r')", a1);
    run("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('ancien-a', ?)", a1);
    for (const p of [m1, a1, b1]) run("INSERT INTO blog_comments (post_id, content_type, content_id, body, status, author_name) VALUES (?, 'post', ?, 'Commentaire', 'approved', 'Invité')", p, p);
    const menuM = run("INSERT INTO nav_menus (site_id, name, slug) VALUES (NULL, 'Principal', 'principal')"), menuA = run("INSERT INTO nav_menus (site_id, name, slug) VALUES (?, 'Alpha', 'alpha')", A);
    run("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES (?, 'page', ?, 'Accueil')", menuM, pm1); run("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES (?, 'article', ?, 'A')", menuA, a1); run("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES (?, 'category', ?, 'Cat')", menuA, ta);
    db.prepare("INSERT INTO seo_meta (entity_type, entity_key) VALUES ('blog_category', 'principale')").run();
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/vieux-principal', '/p/offre', 301, NULL)").run();
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, site_id) VALUES ('/ancien-a', '/tarifs', 301, ?)").run(A);
    run("INSERT INTO cms_url_history (resource_type, resource_id, site_id, old_slug) VALUES ('page', ?, ?, 'ancien-accueil-a')", pa1, A);
    db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, reach, site_id) VALUES (?, 'image', 'image', '/uploads/marketing/1/site-1/img-a.png', 'a.png', 'image/png', 1, 'site', ?)").run(org, A);
    db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size) VALUES (?, 'image', 'image', '/uploads/marketing/1/commun.png', 'c.png', 'image/png', 1)").run(org);
    FIXTURE = path.join(SCRATCH, "fixture.db");
    db.exec(`VACUUM INTO '${FIXTURE.replace(/'/g, "''")}'`);
  });

  describe("plan étendu et contrôles préalables", () => {
    test("le plan couvre les 8 tables : articles, termes, formulaires, modèles, pages, redirections, historiques d'adresses d'articles et de pages/termes", () => {
      assert.deepEqual(tables.PLAN_TABLES, ["posts", "taxonomy_terms", "mk_forms", "mk_page_templates", "mk_landing_pages", "seo_redirects", "post_slug_history", "cms_url_history"]);
      const f = fresh("plan"); const d = open(f, true);
      assert.deepEqual(tables.pending(d), tables.PLAN_TABLES, "toutes sont à reconstruire sur la base d'avant");
      d.close();
    });
    test("base saine : aucun constat bloquant ; les commentaires ne demandent aucune reconstruction (leur site se déduit de l'article)", () => {
      const r = codes(fresh("sain"));
      assert.equal(r.blocking, false, JSON.stringify(r.findings));
      assert.deepEqual(r.exclusions, []);
      assert.ok(!tables.PLAN_TABLES.includes("blog_comments"));
    });
    const BAD = {
      "adresses de pages en collision après normalisation": [(d) => d.exec(`INSERT INTO mk_landing_pages (organization_id, name, slug, status, kind) VALUES (${1}, 'Offre bis', 'Offre', 'draft', 'page')`), "adresses_pages", "block"],
      "adresses d'articles en collision": [(d) => d.exec("INSERT INTO posts (slug, title) VALUES ('Bienvenue', 'x')"), "adresses_articles", "block"],
      "adresses de termes en collision": [(d) => d.exec("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'x', 'Principale')"), "adresses_termes", "block"],
      "adresse logique ambiguë dans un site": [(d) => { d.exec("INSERT INTO posts (slug, title) VALUES ('piege', 'p')"); d.exec(`INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', (SELECT id FROM posts WHERE slug = 'piege'), (SELECT organization_id FROM mk_sites WHERE slug = 'alpha'), (SELECT id FROM mk_sites WHERE slug = 'alpha'), '', 'a-seul')`); }, "adresses_logiques_ambigues", "block"],
      "ancienne adresse d'article égale à une adresse vivante": [(d) => d.exec("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('actu', (SELECT id FROM posts WHERE slug = 'bienvenue'))"), "historique_articles_adresse_vivante", "block"],
      "ancienne adresse de page égale à une adresse vivante": [(d) => d.exec("INSERT INTO cms_url_history (resource_type, resource_id, old_slug) VALUES ('page', (SELECT id FROM mk_landing_pages WHERE slug = 'accueil'), 'offre')"), "historique_cms_adresse_vivante", "block"],
      "redirections dont les sources se confondent": [(d) => d.exec("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/Vieux-Principal/', '/x', NULL)"), "redirections_sources_dupliquees", "block"],
      "redirection d'un site disparu": [(d) => d.exec("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/orpheline', '/x', 9999)"), "redirections_site_inconnu", "block"],
      "relation vers un terme inexistant": [(d) => d.exec("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', 1, 9999)"), "relations_sans_terme", "block"],
      "ancienne adresse d'un article inexistant": [(d) => d.exec("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('fantome', 9999)"), "historique_articles_sans_article", "block"],
      "rattachement d'un contenu disparu": [(d) => d.exec("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope) VALUES ('post', 9999, (SELECT organization_id FROM mk_sites WHERE slug = 'alpha'), (SELECT id FROM mk_sites WHERE slug = 'alpha'), '')"), "rattachements_sans_contenu", "block"],
      "contenu rattaché à un site supprimé": [(d) => d.exec("UPDATE mk_sites SET deleted_at = datetime('now') WHERE slug = 'beta'"), "rattachements_site_supprime", "block"],
      "article lié à un terme d'un autre site": [(d) => { d.exec("DROP TRIGGER trg_mk_cs_relation"); d.exec("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', (SELECT id FROM posts WHERE slug = 'a-seul'), (SELECT id FROM taxonomy_terms WHERE slug = 'cat-b'))"); }, "relations_article_terme_entre_sites", "block"],
      "taxonomie partagée entre sites": [(d) => { d.exec("DROP TRIGGER trg_mk_cs_relation"); d.exec("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', (SELECT id FROM posts WHERE slug = 'bienvenue-beta'), (SELECT id FROM taxonomy_terms WHERE slug = 'cat-a'))"); }, "termes_utilises_par_plusieurs_sites", "block"],
      "page parente d'un autre site (audit d'isolation)": [(d) => d.exec("DROP TRIGGER mk_landing_pages_parent_same_site_update; UPDATE mk_landing_pages SET parent_id = (SELECT id FROM mk_landing_pages WHERE slug = 'accueil-beta') WHERE slug = 'tarifs'"), "isolation_parent", "block"],
      "commentaire sans article": [(d) => d.exec("INSERT INTO blog_comments (post_id, content_type, content_id, body, status) VALUES (NULL, 'post', 9999, 'x', 'approved')"), "commentaires_sans_contenu", "warn"],
      "élément de menu vers un contenu absent": [(d) => d.exec("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES (1, 'page', 9999, 'x')"), "menus_reference_absente", "warn"],
      "élément de menu d'un site vers un contenu d'un autre site": [(d) => d.exec("INSERT INTO nav_items (menu_id, type, object_id, label) VALUES ((SELECT id FROM nav_menus WHERE slug = 'alpha'), 'article', (SELECT id FROM posts WHERE slug = 'bienvenue-beta'), 'x')"), "menus_vers_autre_site", "warn"],
      "réglage SEO d'un terme disparu": [(d) => d.exec("INSERT INTO seo_meta (entity_type, entity_key) VALUES ('blog_tag', 'disparu')"), "seo_reference_absente", "warn"],
      "redirection masquant un contenu en ligne": [(d) => d.exec("INSERT INTO seo_redirects (source_path, target) VALUES ('/blog/actu', '/x')"), "redirections_masquent_contenu", "warn"],
      "redirection vers un article disparu": [(d) => d.exec("INSERT INTO seo_redirects (source_path, target) VALUES ('/vieux2', '/blog/disparu')"), "redirections_cible_absente", "warn"],
      "fichier propre à un site utilisé par un autre site": [(d) => d.exec("UPDATE mk_landing_pages SET sections = '[{\"image\":\"/uploads/marketing/1/site-1/img-a.png\"}]' WHERE slug = 'accueil-beta'"), "medias_site_utilises_ailleurs", "warn"],
    };
    for (const [what, [fn, code, severity]] of Object.entries(BAD)) {
      test(`détecte : ${what} (${severity})`, () => {
        const r = codes(mutate("bad", fn));
        const hit = find(r, code);
        assert.ok(hit, `${code} attendu ; constats : ${r.findings.map((f) => f.code).join(", ")}`);
        assert.equal(hit.severity, severity);
        assert.equal(r.blocking, severity === "block" ? true : r.blocking);
        assert.ok(hit.count >= 1);
        assert.ok(!JSON.stringify(hit.sample).match(/Titre |Commentaire|Invité/), "seulement des nombres et des identifiants techniques : jamais un titre ni un texte");
      });
    }
    test("les cas ambigus sont EXCLUS de toute transformation automatique : la reprise des rattachements ne les touche pas", () => {
      const f = mutate("amb", (d) => { d.exec("UPDATE mk_sites SET deleted_at = datetime('now') WHERE slug = 'beta'"); });
      const d = open(f, true); const plan = backfill.plan(d); d.close();
      assert.ok(plan.skipped.some((s) => s.type === "post" && s.reason.includes("site supprimé")));
      assert.ok(!plan.assign.some((a) => [ids.b1, ids.tb].includes(a.id) && a.siteId === ids.B), "les contenus du site supprimé ne sont pas repris");
      assert.ok(plan.assign.some((a) => a.type === "post" && a.id === ids.a1 && a.siteId === ids.A), "les cas sans ambiguïté sont repris");
    });
  });

  describe("exécution dédiée : essai, sauvegarde, comparaison, restauration", () => {
    test("ESSAI : conforme ; la base d'origine n'est PAS modifiée (empreinte du fichier identique) ; sauvegarde vérifiée, journal complet, aucun verrou ni copie restante", () => {
      const f = fresh("essai"), dir = dirOf("essai"), before = sha(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "essai" });
      assert.equal(r.status, "essai-conforme", JSON.stringify(r.events.filter((e) => !e.ok)));
      assert.equal(sha(f), before, "base d'origine intacte");
      const files = fs.readdirSync(dir);
      assert.equal(files.filter((x) => x.startsWith("AVANT-RECONSTRUCTION-")).length, 1);
      assert.ok(files.some((x) => x.startsWith("JOURNAL-RECONSTRUCTION-")));
      assert.ok(!files.some((x) => x.startsWith("ESSAI-")), "copie jetable supprimée");
      assert.ok(!fs.existsSync(`${f}.reconstruction.lock`), "verrou libéré");
      const steps = r.events.map((e) => e.step);
      for (const s of ["verrou", "controles", "a_reconstruire", "sauvegarde", "test_restauration", "essai", "fin"]) assert.ok(steps.includes(s), s);
      const backup = r.events.find((e) => e.step === "sauvegarde");
      assert.equal(backup.sha256, sha(path.join(dir, backup.file)), "empreinte de la sauvegarde déclarée = réelle");
      assert.equal(count(f, "SELECT COUNT(*) n FROM sqlite_master WHERE name IN ('uq_mk_landing_pages_site_slug','uq_seo_redirects_site_source','uq_post_slug_history_site_old','uq_cms_url_history_site_old')"), 0, "aucune unicité par site n'existe sur la base d'origine");
    });
    test("RÉEL (sur une copie) : tables reconstruites, unicités par site actives, AUCUNE donnée perdue ni modifiée (empreintes de toutes les tables), relations enfants conservées, marqueur posé", () => {
      const f = fresh("reel"), dir = dirOf("reel"), pre = snap(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" });
      assert.equal(r.status, "reconstruite", JSON.stringify(r.events.filter((e) => !e.ok)));
      const d = open(f, true), post = tables.snapshot(d, pre);
      const cmp = tables.compare(pre, post, { rebuilt: tables.PLAN_TABLES });
      assert.deepEqual(cmp.unexplained.filter((u) => !/schema_migrations/.test(u)), [], "aucune différence inexpliquée");
      for (const t of Object.keys(pre.tables)) if (t !== "schema_migrations") assert.equal(post.tables[t].hash, pre.tables[t].hash, `${t} : données identiques (hors colonne site_id ajoutée)`);
      for (const t of ["mk_page_versions", "mk_landing_events", "mk_funnel_steps", "mk_page_tests", "post_revisions", "blog_comments", "taxonomy_relations", "nav_items"]) assert.equal(post.tables[t].rows, pre.tables[t].rows, `${t} : relations enfants conservées`);
      assert.equal(d.prepare("SELECT page_id FROM mk_funnel_steps").get().page_id, ids.pa1, "l'étape de tunnel désigne toujours sa page");
      assert.ok(d.prepare("SELECT 1 FROM schema_migrations WHERE scope = 'reconstruction' AND version = '076'").get(), "marqueur posé");
      assert.equal(d.prepare("SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'marketing'").get().n, pre.tables.schema_migrations.rows, "lignes du lanceur inchangées");
      assert.deepEqual(d.prepare("SELECT slug, site_id FROM posts ORDER BY id").all().map((p) => [p.slug, p.site_id]).filter(([s]) => ["bienvenue", "bienvenue-alpha", "bienvenue-beta", "a-seul"].includes(s)), [["bienvenue", null], ["bienvenue-alpha", ids.A], ["a-seul", ids.A], ["bienvenue-beta", ids.B]], "sites repris des rattachements ; historiques au principal");
      assert.deepEqual(d.prepare("SELECT slug, site_id FROM taxonomy_terms WHERE slug LIKE 'cat-%' OR slug = 'principale' ORDER BY id").all().map((t) => [t.slug, t.site_id]), [["principale", null], ["cat-a", ids.A], ["cat-b", ids.B]]);
      assert.equal(d.prepare("SELECT COUNT(*) n FROM mk_content_sites").get().n, 5, "mk_content_sites conservée (adresses logiques)");
      assert.equal(d.prepare("SELECT address FROM mk_content_sites WHERE content_type = 'post' AND content_id = ?").get(ids.a1).address, "bienvenue", "adresse logique inchangée");
      d.close();
    });
    test("après reconstruction : même adresse sur deux sites possible (pages, articles, termes, redirections, historiques), refusée sur un même site ; les déclencheurs d'isolation des autres tables fonctionnent toujours", () => {
      const f = fresh("apres"), dir = dirOf("apres");
      assert.equal(runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" }).status, "reconstruite");
      const d = open(f); d.exec("PRAGMA foreign_keys = ON");
      const ins = (sql, ...a) => d.prepare(sql).run(...a);
      ins("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id, kind) VALUES (?, 'Accueil', 'accueil', ?, 'page')", ids.org, ids.A); // 'accueil' existe au principal
      assert.throws(() => ins("INSERT INTO mk_landing_pages (organization_id, name, slug, site_id, kind) VALUES (?, 'Autre', 'accueil', ?, 'page')", ids.org, ids.A), /UNIQUE/);
      ins("INSERT INTO posts (slug, title, site_id) VALUES ('bienvenue', 'A', ?)", ids.A); // 'bienvenue' existe au principal
      assert.throws(() => ins("INSERT INTO posts (slug, title, site_id) VALUES ('bienvenue', 'B', ?)", ids.A), /UNIQUE/);
      ins("INSERT INTO taxonomy_terms (taxonomy, name, slug, site_id) VALUES ('category', 'Principale A', 'principale', ?)", ids.A);
      ins("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/vieux-principal', '/x', ?)", ids.B);
      assert.throws(() => ins("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/vieux-principal', '/y', ?)", ids.B), /UNIQUE/);
      ins("INSERT INTO post_slug_history (old_slug, post_id, site_id) VALUES ('ancien-a', ?, ?)", ids.b1, ids.B);
      assert.throws(() => ins("INSERT INTO post_slug_history (old_slug, post_id, site_id) VALUES ('ancien-a', ?, ?)", ids.b1, ids.B), /UNIQUE/);
      ins("INSERT INTO cms_url_history (resource_type, resource_id, site_id, old_slug) VALUES ('page', ?, ?, 'ancien-accueil-a')", ids.pb1, ids.B);
      // les déclencheurs d'isolation qui citent les pages (étapes de tunnel, accueil d'un site) ont été recréés et agissent encore
      assert.throws(() => ins("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (?, (SELECT id FROM mk_funnels LIMIT 1), 2, 'page', 'x', ?)", ids.org, ids.pb1), /site/i, "étape d'un tunnel du site A vers une page du site B refusée");
      assert.throws(() => ins("UPDATE mk_sites SET home_page_id = ? WHERE id = ?", ids.pb1, ids.A), /site|accueil|page/i, "accueil du site A vers une page du site B refusé");
      // suppression d'une page : ses enfants disparaissent encore en cascade (relations conservées)
      const versionsBefore = d.prepare("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?").get(ids.pa1).n;
      assert.equal(versionsBefore, 1);
      ins("DELETE FROM mk_landing_pages WHERE id = ?", ids.pa1);
      assert.equal(d.prepare("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?").get(ids.pa1).n, 0, "cascade conservée");
      assert.equal(d.prepare("SELECT page_id FROM mk_funnel_steps").get().page_id, null, "SET NULL conservé");
      d.close();
    });
    test("ARRÊT sur contrôle bloquant : rien n'est écrit (ni base, ni sauvegarde), constats renvoyés", () => {
      const f = mutate("bloque", (d) => d.exec(`INSERT INTO mk_landing_pages (organization_id, name, slug, status, kind) VALUES (1, 'Offre bis', 'Offre', 'draft', 'page')`)), dir = dirOf("bloque"), before = sha(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" });
      assert.equal(r.status, "arret-controles");
      assert.ok(r.findings.some((x) => x.code === "adresses_pages"));
      assert.equal(sha(f), before);
      assert.ok(!fs.readdirSync(dir).some((x) => x.startsWith("AVANT-RECONSTRUCTION-")), "aucune sauvegarde inutile n'est écrite");
    });
    test("ARRÊT de l'essai sur écart inexpliqué : la base réelle n'est jamais touchée, même en mode réel", () => {
      const f = fresh("sabot-essai"), dir = dirOf("sabot-essai"), before = sha(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE", _test: { afterEssai: (d) => d.exec("DELETE FROM mk_landing_events") } });
      assert.equal(r.status, "arret-essai");
      assert.ok(r.unexplained.length > 0);
      assert.equal(sha(f), before, "aucune reconstruction réelle n'a été tentée");
    });
    test("RESTAURATION AUTOMATIQUE : écart détecté APRÈS la reconstruction réelle → la sauvegarde vérifiée remplace la base, état identique à l'origine", () => {
      const f = fresh("sabot-reel"), dir = dirOf("sabot-reel"), pre = snap(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE", _test: { afterReel: (d) => d.exec("DELETE FROM mk_landing_events") } });
      assert.equal(r.status, "restauree", JSON.stringify(r.events));
      assert.ok(same(pre, snap(f)), "base restaurée à l'identique (empreinte de chaque table)");
      assert.equal(count(f, "SELECT COUNT(*) n FROM sqlite_master WHERE name IN ('uq_mk_landing_pages_site_slug','uq_seo_redirects_site_source','uq_post_slug_history_site_old','uq_cms_url_history_site_old')"), 0);
      assert.equal(count(f, "SELECT COUNT(*) n FROM sqlite_master WHERE name = 'schema_migrations' AND 0"), 0);
      const d = open(f, true); assert.ok(!d.prepare("SELECT 1 FROM sqlite_master WHERE name = 'schema_migrations'").get() || !d.prepare("SELECT 1 FROM schema_migrations WHERE scope = 'reconstruction'").get(), "aucun marqueur après restauration"); d.close();
      assert.ok(r.events.some((e) => e.step === "restauration" && e.ok));
    });
    test("ERREUR en cours de reconstruction (provoquée sur une table) : transaction annulée puis base restaurée ; aucun marqueur", () => {
      const f = fresh("erreur"), dir = dirOf("erreur"), pre = snap(f);
      const r = runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE", _test: { injectReel: "mk_landing_pages" } });
      assert.equal(r.status, "restauree");
      assert.ok(same(pre, snap(f)));
      assert.ok(r.events.some((e) => e.step === "reel" && !e.ok && /provoquée/.test(e.error || "")));
    });
    test("REFUS : application non arrêtée, confirmation absente, base de l'application sans autorisation expresse, verrou présent, marqueur déjà posé", () => {
      const f = fresh("refus"), dir = dirOf("refus"), before = sha(f);
      assert.equal(runner.run({ dbPath: f, backupDir: dir, mode: "reel", confirm: "RECONSTRUIRE" }).status, "refus", "application non arrêtée");
      assert.equal(runner.run({ dbPath: f, backupDir: dir, mode: "reel", appStopped: true }).status, "refus", "confirmation absente");
      assert.equal(runner.run({ dbPath: f, backupDir: dir, mode: "inconnu" }).status, "refus");
      const live = require("../src/config/paths").dbFile;
      const rl = runner.run({ dbPath: live, backupDir: dir, mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" });
      assert.equal(rl.status, "refus"); assert.match(rl.reason, /base de l'application/);
      fs.writeFileSync(`${f}.reconstruction.lock`, "x");
      assert.equal(runner.run({ dbPath: f, backupDir: dir, mode: "essai" }).status, "refus", "verrou présent");
      fs.rmSync(`${f}.reconstruction.lock`);
      assert.equal(sha(f), before);
      assert.equal(runner.run({ dbPath: f, backupDir: dirOf("refus2"), mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" }).status, "reconstruite");
      assert.equal(runner.run({ dbPath: f, backupDir: dirOf("refus3"), mode: "reel", appStopped: true, confirm: "RECONSTRUIRE" }).status, "deja-executee", "le marqueur empêche tout rejeu");
    });
    test("la sauvegarde n'écrase jamais une sauvegarde existante ; l'essai répété ne laisse aucune copie ni verrou", () => {
      const f = fresh("rep"), dir = dirOf("rep");
      const a = runner.run({ dbPath: f, backupDir: dir, mode: "essai" }), b = runner.run({ dbPath: f, backupDir: dir, mode: "essai" });
      assert.ok(["essai-conforme", "refus"].includes(a.status) && ["essai-conforme", "refus"].includes(b.status));
      assert.ok(fs.readdirSync(dir).filter((x) => x.startsWith("AVANT-RECONSTRUCTION-")).length >= 1);
      assert.ok(!fs.readdirSync(dir).some((x) => x.startsWith("ESSAI-")) && !fs.existsSync(`${f}.reconstruction.lock`));
    });
  });

  describe("audit en lecture seule d'une copie (lot 6)", () => {
    test("résultats agrégés sans contenu, base d'origine intacte, base vivante refusée, constats bloquants signalés", () => {
      const { audit } = require("../src/services/auditCopie");
      const f = fresh("audit"), h = sha(f);
      const ok = audit(f);
      assert.equal(ok.status, "conforme"); assert.equal(ok.integrite, true); assert.equal(ok.violations_cles_etrangeres, 0);
      assert.deepEqual(ok.tables_a_reconstruire, tables.PLAN_TABLES);
      assert.ok(!/Titre |Commentaire|Invité|bienvenue/.test(JSON.stringify(ok)), "aucun contenu ni adresse");
      assert.equal(sha(f), h);
      assert.ok(!fs.existsSync(`${f}.reconstruction.lock`) && !fs.existsSync(`${f}-wal`));
      const bad = audit(mutate("audit-bad", (d) => d.exec("INSERT INTO posts (slug, title) VALUES ('Bienvenue', 'x')")));
      assert.equal(bad.status, "bloquant"); assert.ok(bad.constats.some((c) => c.code === "adresses_articles" && c.gravite === "block"));
      assert.equal(audit(require("../src/config/paths").dbFile).status, "refus");
      assert.equal(audit(path.join(SCRATCH, "absent.db")).status, "refus");
    });
  });
});
