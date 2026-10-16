// R6 (lot 1) — vrai serveur, base d'essai : la migration 075 et les déclencheurs sont posés au démarrage ; rattacher des contenus à des sites ne change AUCUNE page publique
// (/blog, article, flux RSS, sitemap) ; l'intégrité article ↔ terme est tenue par la base ; les routes existantes d'administration du blog continuent de fonctionner.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("contenus par site : serveur réel", () => {
  let srv, boss, db, orgId, A, B, p1, p2, p3, t1, t2;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const pub = (path) => new Client(srv.base).get(path, { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
  const snapshotPublic = async () => JSON.stringify(await Promise.all(["/blog", "/blog/premier", "/blog/second", "/blog/troisieme", "/blog/feed.xml", "/sitemap.xml", "/blog/categorie/actus"].map(async (p) => { const r = await pub(p); return [p, r.status, r.text.replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/, "")]; })));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const post = (slug) => Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, published_at, status) VALUES (?, ?, '<p>Contenu public</p>', 'Résumé', 1, datetime('now'), 'published')").run(slug, `Titre ${slug}`).lastInsertRowid);
    p1 = post("premier"); p2 = post("second"); p3 = post("troisieme");
    t1 = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Actus', 'actus')").run().lastInsertRowid);
    t2 = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Autre', 'autre')").run().lastInsertRowid);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(p1, t1);
  });
  after(() => { db.close(); return srv.stop(); });

  test("au démarrage : la table d'association et les 9 déclencheurs d'intégrité existent ; aucun contenu n'est rattaché", () => {
    assert.ok(one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='mk_content_sites'"));
    assert.equal(one("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_mk_cs_%' AND name NOT IN ('trg_mk_cs_insert', 'trg_mk_cs_update')").n, 9);
    assert.equal(one("SELECT COUNT(*) n FROM mk_content_sites").n, 0);
    assert.ok(one("SELECT 1 FROM schema_migrations WHERE version = '075'"));
  });

  test("rattacher des contenus à des sites ne change AUCUNE page publique (liste, articles, catégorie, flux RSS, sitemap) ni aucune adresse", async () => {
    await snapshotPublic(); // passage d'échauffement : les consultations alimentent la section « populaires » du blog (compteur de vues), sans rapport avec le rattachement
    const before = await snapshotPublic();
    assert.equal(await snapshotPublic(), before, "témoin : sans aucun changement, deux lectures successives sont identiques");
    assert.ok(JSON.parse(before).filter(([p, s]) => ["/blog", "/blog/premier", "/blog/second"].includes(p)).every(([, s]) => s === 200), "pages témoins accessibles");
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', 'bienvenue')").run(p2, orgId, A);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', 'bienvenue')").run(p3, orgId, B);
    const afterSnap = await snapshotPublic();
    const b = JSON.parse(before), a = JSON.parse(afterSnap);
    for (let i = 0; i < b.length; i++) {
      if (a[i][2] === b[i][2] && a[i][1] === b[i][1]) continue;
      let k = 0; while (k < b[i][2].length && b[i][2][k] === a[i][2][k]) k++;
      assert.fail(`${b[i][0]} a changé (statut ${b[i][1]} → ${a[i][1]}) près de : « ${JSON.stringify(b[i][2].slice(Math.max(0, k - 120), k + 120))} » → « ${JSON.stringify(a[i][2].slice(Math.max(0, k - 120), k + 120))} »`);
    }
    assert.deepEqual([one("SELECT slug FROM posts WHERE id = ?", p2).slug, one("SELECT slug FROM posts WHERE id = ?", p3).slug], ["second", "troisieme"]);
  });

  test("la base refuse une relation entre un article d'un site et un terme d'un autre site ; l'administration du blog existante (catégories et articles) continue de fonctionner sur le site principal", async () => {
    assert.throws(() => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', ?, ?)").run(p2, t2), /même site/);
    const r = await boss.get("/marketing/site-web/articles");
    assert.equal(r.status, 200);
    const tx = await boss.get("/marketing/site-web/articles/categories"); assert.ok(tx.status < 400, `catégories : ${tx.status}`);
    assert.equal(one("SELECT COUNT(*) n FROM taxonomy_relations WHERE content_id = ? AND term_id = ?", p1, t1).n, 1, "relation historique intacte");
  });
});
