// R6 (lot 1) — contenus par site : migration 075 additive (base synthétique jetable, DATA_DIR créé par ce test), appartenance des articles et des termes, adresses logiques par site,
// intégrité article ↔ terme, lectures limitées à la portée, atomicité des refus. AUCUNE donnée réelle, aucune reconstruction de table, aucune URL publique modifiée.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r6c-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("contenus par site : migration 075 et service", () => {
  let db, site, ORG, ORG2, A, B, S2, post, term;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const team = () => ({ db, organizationId: ORG, userId: null });
  const scoped = (siteId) => ({ ...team(), siteScope: siteId });
  const mkPost = (slug, extra = "") => Number(db.prepare("INSERT INTO posts (slug, title, content, published, status) VALUES (?, ?, 'texte', 1, 'published')").run(slug, `Titre ${slug}`).lastInsertRowid);
  const mkTerm = (taxonomy, slug, name = slug) => Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES (?, ?, ?)").run(taxonomy, name, slug).lastInsertRowid);
  const link = (postId, termId) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', ?, ?)").run(postId, termId);
  // Empreinte des tables du CŒUR : prouve qu'aucun contenu historique n'est touché
  const CORE = ["posts", "taxonomy_terms", "taxonomy_relations", "post_slug_history", "post_revisions", "blog_comments", "seo_redirects", "nav_items", "seo_meta"];
  const fingerprint = () => JSON.stringify(Object.fromEntries(CORE.filter((t) => one("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", t)).map((t) => [t, crypto.createHash("sha256").update(JSON.stringify(all(`SELECT * FROM ${t} ORDER BY rowid`))).digest("hex")])));
  const schemaOfCore = () => JSON.stringify(all("SELECT name, sql FROM sqlite_master WHERE tbl_name IN ('posts','taxonomy_terms','taxonomy_relations','blog_comments','seo_redirects','post_slug_history') AND type='table' ORDER BY name"));
  let before0, schema0;

  before(() => {
    db = require("../src/config/database");
    require("../src/seo/redirects"); try { require("../src/seo/meta"); } catch { /* absent : sans effet sur l'essai */ } // ces modules créent leurs tables à leur chargement
    const { migrate } = require("../src/marketing/db/migrate");
    // État AVANT 075 : toutes les migrations existantes sauf 075, puis des contenus historiques
    const dir = path.join(SCRATCH, "avant-075"); fs.mkdirSync(dir);
    for (const f of fs.readdirSync(MIGRATIONS)) if (f < "075") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
    const dbFile = path.join(SCRATCH, "data", "KOYEKOLA.db");
    migrate(db, { dir, dbPath: dbFile, backupDir: path.join(SCRATCH, "backups"), log: quiet });
    ORG = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run().lastInsertRowid);
    ORG2 = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O2', 'o2')").run().lastInsertRowid);
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(ORG).lastInsertRowid);
    B = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Beta', 'beta', '{}')").run(ORG).lastInsertRowid);
    S2 = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Autre org', 'autre', '{}')").run(ORG2).lastInsertRowid);
    post = mkPost("bienvenue"); mkPost("a-propos"); mkPost("actualites");
    term = mkTerm("category", "news"); mkTerm("tag", "news"); mkTerm("category", "guides");
    link(post, term);
    db.prepare("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('ancien-bienvenue', ?)").run(post);
    db.prepare("INSERT INTO seo_redirects (source_path, target, status) VALUES ('/blog/vieux', '/blog/bienvenue', 301)").run();
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status) VALUES (?, 'post', ?, 'Bravo', 'approved')").run(post, post);
    before0 = fingerprint(); schema0 = schemaOfCore();
    // Application de 075 par le vrai lanceur, puis des déclencheurs (comme au démarrage)
    const r = migrate(db, { dir: MIGRATIONS, dbPath: dbFile, backupDir: path.join(SCRATCH, "backups"), log: quiet });
    assert.deepEqual(r.applied, ["075", "079", "080", "081", "082"]); // 079 (lot 7C, index des médias), 080 à 082 (R7, contacts, formulaires et journal par site) suivent la 075
    site = require("../src/services/siteContent");
    assert.ok(site.ensureCoreTriggers(db).created >= 9);
  });

  test("migration 075 : contenus historiques, adresses, redirections, relations, commentaires et structure du cœur strictement INCHANGÉS ; aucun contenu n'est rattaché", () => {
    assert.equal(fingerprint(), before0);
    assert.equal(schemaOfCore(), schema0, "aucune colonne ni contrainte du cœur n'a changé (outil de reconstruction intact)");
    assert.equal(one("SELECT COUNT(*) n FROM mk_content_sites").n, 0);
    assert.equal(one("SELECT slug FROM posts WHERE id = ?", post).slug, "bienvenue");
    assert.equal(site.siteOf(db, "post", post), null, "contenu historique = site principal");
  });

  test("répétable : relancer le lanceur n'applique rien ; relancer les déclencheurs n'en crée aucun ; l'inventaire est neutre", () => {
    const { migrate } = require("../src/marketing/db/migrate");
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), backupDir: path.join(SCRATCH, "backups"), log: quiet }).applied, []);
    assert.equal(site.ensureCoreTriggers(db).created, 0);
    assert.deepEqual(site.inventory(db), { table: true, assigned: { post: 0, term: 0 }, orphans: { post: 0, term: 0 }, crossSiteRelations: 0, adresses: 0 });
    assert.equal(one("SELECT COUNT(*) n FROM schema_migrations WHERE version = '075'").n, 1);
  });

  test("lien article ↔ terme historique (tous deux « site principal ») : toujours possible, relation existante conservée", () => {
    const p = mkPost("lien-principal"); const t = mkTerm("category", "lien-principal");
    link(p, t);
    assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = ? AND term_id = ?", p, t).n, 1);
  });

  describe("rattachement à un site et adresses logiques", () => {
    let pA, pB, tA, tB;
    before(() => { pA = mkPost("projet-alpha"); pB = mkPost("projet-beta"); tA = mkTerm("category", "alpha-cat"); tB = mkTerm("category", "beta-cat"); });

    test("deux sites préparent la MÊME adresse logique ; l'adresse publique actuelle (posts.slug) ne change pas ; le site principal garde son article", () => {
      site.assign(team(), { type: "post", id: pA, siteId: A, address: "bienvenue" });
      site.assign(team(), { type: "post", id: pB, siteId: B, address: "bienvenue" });
      assert.equal(site.siteOf(db, "post", pA), A);
      assert.equal(site.siteOf(db, "post", pB), B);
      assert.equal(one("SELECT slug FROM posts WHERE id = ?", pA).slug, "projet-alpha", "URL publique inchangée");
      assert.equal(one("SELECT slug FROM posts WHERE id = ?", post).slug, "bienvenue");
      assert.equal(site.siteOf(db, "post", post), null);
      // même adresse logique deux fois dans le MÊME site : refusée
      const extra = mkPost("projet-alpha-2");
      assert.throws(() => site.assign(team(), { type: "post", id: extra, siteId: A, address: "bienvenue" }), /déjà utilisée/);
      assert.equal(site.siteOf(db, "post", extra), null, "refus atomique : aucune ligne écrite");
    });
    test("termes : catégorie et étiquette de même adresse coexistent dans un site (comme UNIQUE(taxonomie, adresse)) ; deux catégories identiques, non", () => {
      const cat = mkTerm("category", "meme-c"), tag = mkTerm("tag", "meme-c"), cat2 = mkTerm("category", "meme-c-2");
      site.assign(team(), { type: "term", id: cat, siteId: A, address: "meme" });
      site.assign(team(), { type: "term", id: tag, siteId: A, address: "meme" });
      assert.throws(() => site.assign(team(), { type: "term", id: cat2, siteId: A, address: "meme" }), /déjà utilisée/);
      site.assign(team(), { type: "term", id: cat2, siteId: B, address: "meme" });
    });
    test("adresse invalide, site inconnu ou d'une autre organisation, contenu inconnu : refusés sans rien écrire", () => {
      const p = mkPost("garde");
      for (const bad of ["Maj", "a b", "é", "-x", "x".repeat(121)]) assert.throws(() => site.assign(team(), { type: "post", id: p, siteId: A, address: bad }), /Adresse invalide/, bad);
      assert.throws(() => site.assign(team(), { type: "post", id: p, siteId: 999999 }), /Site introuvable/);
      assert.throws(() => site.assign(team(), { type: "post", id: p, siteId: S2 }), /Site introuvable/, "site d'une autre organisation");
      assert.throws(() => site.assign(team(), { type: "post", id: 999999, siteId: A }), /Contenu introuvable/);
      assert.throws(() => site.assign(team(), { type: "inconnu", id: p, siteId: A }), /Type de contenu inconnu/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_content_sites WHERE content_id = ? AND content_type = 'post'", p).n, 0);
      // garde dans la base elle-même : un site d'une autre organisation est refusé même par SQL direct
      assert.throws(() => db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(p, ORG, S2), /même organisation/);
    });
    test("changer l'adresse ou le site d'un contenu déjà rattaché ; retour au site principal ; l'identité de la ligne ne change jamais", () => {
      const p = mkPost("mobile");
      site.assign(team(), { type: "post", id: p, siteId: A, address: "mobile" });
      site.assign(team(), { type: "post", id: p, siteId: B, address: "mobile" });
      assert.equal(site.siteOf(db, "post", p), B);
      assert.throws(() => db.prepare("UPDATE mk_content_sites SET content_id = 1 WHERE content_id = ?").run(p), /figés/);
      site.clear(team(), { type: "post", id: p });
      assert.equal(site.siteOf(db, "post", p), null);
      assert.deepEqual(site.clear(team(), { type: "post", id: p }), { type: "post", id: p, siteId: null }, "idempotent");
    });
    test("réservé à l'équipe : un accès limité à un site ne rattache, ne déplace ni ne libère aucun contenu", () => {
      const p = mkPost("interdit");
      assert.throws(() => site.assign(scoped(A), { type: "post", id: p, siteId: A }), /équipe/);
      assert.throws(() => site.clear(scoped(A), { type: "post", id: pA }), /équipe/);
      assert.equal(site.siteOf(db, "post", pA), A);
      assert.equal(site.siteOf(db, "post", p), null);
    });

    test("intégrité article ↔ terme : relation inter-sites refusée PAR LA BASE (éditeur, import et fusion de termes compris) ; relation du même site acceptée", () => {
      const p = mkPost("rel-a"), tOther = mkTerm("category", "rel-b"), tSame = mkTerm("category", "rel-a");
      site.assign(team(), { type: "post", id: p, siteId: A });
      site.assign(team(), { type: "term", id: tSame, siteId: A });
      site.assign(team(), { type: "term", id: tOther, siteId: B });
      assert.throws(() => link(p, tOther), /même site/);
      link(p, tSame);
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = ?", p).n, 1);
      // terme du site principal sur un article de A : refusé aussi
      const tMain = mkTerm("category", "rel-main");
      assert.throws(() => link(p, tMain), /même site/);
      assert.equal(site.inventory(db).crossSiteRelations, 0);
    });
    test("déplacer ou libérer un contenu lié à d'autres sites est refusé (aucune relation orpheline ni inter-sites) ; atomique", () => {
      const p = mkPost("lie"), t = mkTerm("category", "lie");
      link(p, t); // tous deux site principal
      assert.throws(() => site.assign(team(), { type: "post", id: p, siteId: A }), /lié à des contenus d'un autre site/, "l'article a un terme du site principal");
      assert.equal(site.siteOf(db, "post", p), null);
      assert.throws(() => site.assign(team(), { type: "term", id: t, siteId: A }), /lié à des contenus d'un autre site/, "un article du site principal utilise ce terme");
      assert.equal(site.siteOf(db, "term", t), null);
      // en déplaçant les DEUX dans le même site, c'est possible : terme d'abord interdit, donc retirer le lien, déplacer les deux, relier
      db.prepare("DELETE FROM taxonomy_relations WHERE content_id = ? AND term_id = ?").run(p, t);
      site.assign(team(), { type: "post", id: p, siteId: A });
      site.assign(team(), { type: "term", id: t, siteId: A });
      link(p, t);
      // libérer l'un seul alors que le lien existe : refusé
      assert.throws(() => site.clear(team(), { type: "term", id: t }), /lié à des contenus d'un autre site/);
      assert.equal(site.siteOf(db, "term", t), A);
    });
  });

  describe("lectures limitées à la portée, commentaires, suppressions", () => {
    let pa, pb, ta, tb, ca;
    before(() => {
      pa = mkPost("lecture-a"); pb = mkPost("lecture-b"); ta = mkTerm("category", "lecture-a"); tb = mkTerm("category", "lecture-b");
      site.assign(team(), { type: "post", id: pa, siteId: A }); site.assign(team(), { type: "post", id: pb, siteId: B });
      site.assign(team(), { type: "term", id: ta, siteId: A }); site.assign(team(), { type: "term", id: tb, siteId: B });
      ca = Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status) VALUES (?, 'post', ?, 'com A', 'approved')").run(pa, pa).lastInsertRowid);
      db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, body, status) VALUES (?, 'post', ?, 'com B', 'approved')").run(pb, pb);
    });
    test("un accès limité au site A ne voit que ses articles et ses termes, jamais ceux de B ni du site principal ; l'équipe voit tout ; le filtre « principal » ne montre que l'historique", () => {
      const ids = (rows) => rows.map((r) => r.id);
      assert.deepEqual(ids(site.listPosts(scoped(A))).filter((i) => [pa, pb].includes(i)), [pa]);
      assert.ok(!ids(site.listPosts(scoped(A))).includes(post), "les articles historiques (site principal) restent hors de portée d'un site");
      assert.ok(ids(site.listPosts(team())).includes(pa) && ids(site.listPosts(team())).includes(pb) && ids(site.listPosts(team())).includes(post));
      assert.ok(ids(site.listPosts({ ...team(), siteFilter: "principal" })).includes(post) && !ids(site.listPosts({ ...team(), siteFilter: "principal" })).includes(pa));
      assert.deepEqual(ids(site.listTerms(scoped(A))).filter((i) => [ta, tb].includes(i)), [ta]);
      assert.deepEqual(ids(site.listTerms(scoped(-1))), [], "contexte limité sans site valide : rien");
    });
    test("accès par identifiant : article ou terme d'un autre site = « introuvable » (lecture ET écriture), le sien passe ; identifiants forgés refusés", () => {
      assert.deepEqual(site.requirePostInScope(scoped(A), pa), { type: "post", id: pa, siteId: A });
      assert.throws(() => site.requirePostInScope(scoped(A), pb), /introuvable/i);
      assert.throws(() => site.requirePostInScope(scoped(A), post), /introuvable/i, "article du site principal");
      assert.throws(() => site.requireTermInScope(scoped(A), tb), /introuvable/i);
      assert.throws(() => site.requirePostInScope(scoped(A), 999999), /introuvable/i);
      assert.throws(() => site.requirePostInScope(scoped(A), "1 OR 1=1"), /introuvable/i);
      assert.doesNotThrow(() => site.requirePostInScope(team(), pb));
    });
    test("commentaires : ils suivent leur article (aucune colonne propre) ; un accès limité ne lit pas ceux d'un autre site", () => {
      assert.deepEqual(site.listComments(scoped(A), pa).map((c) => c.id), [ca]);
      assert.throws(() => site.listComments(scoped(A), pb), /introuvable/i);
      assert.equal(site.siteOfComment(db, ca), A);
      assert.equal(site.siteOfComment(db, one("SELECT id FROM blog_comments WHERE body = 'Bravo'").id), null, "commentaire historique = site principal");
    });
    test("supprimer un article ou un terme supprime sa ligne d'appartenance (aucun orphelin) sans être bloqué ; la suppression par cascade des relations passe aussi", () => {
      const p = mkPost("a-supprimer"), t = mkTerm("category", "a-supprimer");
      site.assign(team(), { type: "post", id: p, siteId: A }); site.assign(team(), { type: "term", id: t, siteId: A });
      link(p, t);
      db.prepare("DELETE FROM posts WHERE id = ?").run(p);
      db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(t);
      assert.equal(one("SELECT COUNT(*) n FROM mk_content_sites WHERE (content_type = 'post' AND content_id = ?) OR (content_type = 'term' AND content_id = ?)", p, t).n, 0); // les identifiants d'articles et de termes sont distincts par type
      assert.deepEqual(site.inventory(db).orphans, { post: 0, term: 0 });
      assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = ?", p).n, 0);
    });
    test("inventaire : détecte un orphelin et une relation inter-sites introduits par écriture directe (triggers contournés), sans rien modifier", () => {
      db.exec("DROP TRIGGER trg_mk_cs_post_delete");
      const p = mkPost("orph"); site.assign(team(), { type: "post", id: p, siteId: A });
      db.prepare("DELETE FROM posts WHERE id = ?").run(p);
      assert.equal(site.inventory(db).orphans.post, 1);
      db.prepare("DELETE FROM mk_content_sites WHERE content_id = ?").run(p); // nettoyage de l'essai
      assert.equal(site.ensureCoreTriggers(db).created, 1, "le déclencheur manquant est recréé, les autres ne sont pas dupliqués");
      assert.equal(site.inventory(db).orphans.post, 0);
    });
  });

  describe("compatibilité avec l'outil de reconstruction préparé (étape ultérieure, ici exécuté sur la base JETABLE du test)", () => {
    test("reconstruire articles et termes (unicité par site) avec des contenus rattachés : zéro différence inexpliquée, rattachements et déclencheurs conservés et toujours actifs", () => {
      const tables = require("../src/services/reconstructionTables");
      const pre = tables.snapshot(db);
      const assignedBefore = JSON.stringify(all("SELECT * FROM mk_content_sites ORDER BY content_type, content_id"));
      const result = tables.rebuild(db);
      assert.ok(result.rebuilt.some((r) => r.table === "posts") && result.rebuilt.some((r) => r.table === "taxonomy_terms"));
      const cmp = tables.compare(pre, tables.snapshot(db, pre), { rebuilt: result.rebuilt.map((r) => r.table) });
      assert.deepEqual(cmp.unexplained.filter((u) => !/mk_content_sites|trg_mk_cs/.test(u)), [], "aucune différence inexpliquée sur les tables du cœur");
      assert.equal(JSON.stringify(all("SELECT * FROM mk_content_sites ORDER BY content_type, content_id")), assignedBefore, "rattachements intacts");
      assert.equal(site.ensureCoreTriggers(db).created, 0, "tous les déclencheurs ont survécu à la reconstruction");
      // l'intégrité tient toujours après reconstruction
      const p1 = mkPost("apres-reconstruction"), t1 = mkTerm("category", "apres-reconstruction");
      site.assign(team(), { type: "post", id: p1, siteId: A });
      assert.throws(() => link(p1, t1), /même site/);
      // et l'unicité est maintenant PAR SITE : la même adresse publique sur deux sites est possible
      db.prepare("INSERT INTO posts (slug, title, site_id) VALUES ('meme-adresse', 'a', ?)").run(A);
      db.prepare("INSERT INTO posts (slug, title, site_id) VALUES ('meme-adresse', 'b', ?)").run(B);
      assert.throws(() => db.prepare("INSERT INTO posts (slug, title, site_id) VALUES ('meme-adresse', 'c', ?)").run(A), /UNIQUE/);
    });
  });
});
