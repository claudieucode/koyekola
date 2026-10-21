// R5 — médias par site : migration 074 (neutre pour l'existant) et service (portée, téléversement par site, partage explicite, écriture limitée).
// Vraies migrations dans une base d'essai ; dossier de fichiers jetable créé par ce test (jamais uploads/ du projet) ; aucun serveur.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r5-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

const withUsersTable = (db) => db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
const pdf = (tag) => Buffer.from(`%PDF-1.4\n% ${tag}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`.repeat(2));

describe("migration 074 : neutre pour l'existant", () => {
  test("les médias déjà en base restent communs, sans site, avec la même adresse ; les contraintes refusent les portées incohérentes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-r5-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "074") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA foreign_keys = ON");
      withUsersTable(db);
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}'), (2, 'Autre', 'autre', '{}')");
      db.exec("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size) VALUES (1, 'document', 'pdf', '/uploads/marketing/1/1-aa.pdf', 'a.pdf', 'application/pdf', 10), (1, 'document', 'pdf', '/uploads/marketing/1/2-bb.pdf', 'b.pdf', 'application/pdf', 20)");
      assert.equal(db.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_media') WHERE name = 'reach'").get().n, 0); // base d'avant R5
      const before = db.prepare("SELECT id, path, name, size FROM mk_media ORDER BY id").all().map((r) => ({ ...r }));
      migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
      assert.ok(db.prepare("SELECT version FROM schema_migrations WHERE version = '074'").get());
      const after = db.prepare("SELECT id, path, name, size, reach, site_id FROM mk_media ORDER BY id").all();
      assert.deepEqual(after.map(({ reach, site_id, ...r }) => ({ ...r })), before);
      assert.ok(after.every((r) => r.reach === "shared" && r.site_id === null));
      const ins = (reach, site, org = 1, p = "x") => db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, reach, site_id) VALUES (?, 'document', 'pdf', ?, 'n', 'application/pdf', 1, ?, ?)").run(org, `/uploads/marketing/${org}/${p}`, reach, site);
      assert.throws(() => ins("site", null, 1, "c1"), /site|constraint/i, "portée « site » sans site");
      assert.throws(() => ins("shared", 1, 1, "c2"), /site|constraint/i, "média commun avec un site");
      assert.throws(() => ins("site", 3, 1, "c3"), /site|constraint/i, "site d'une autre organisation");
      assert.throws(() => ins("tout", null, 1, "c4"), /CHECK|constraint/i, "portée inconnue");
      ins("site", 1, 1, "ok");
      assert.throws(() => db.prepare("UPDATE mk_media SET site_id = 2 WHERE path = '/uploads/marketing/1/ok'").run(), /site|constraint/i, "pas de passage direct d'un site à un autre");
      db.prepare("UPDATE mk_media SET reach = 'shared', site_id = NULL WHERE path = '/uploads/marketing/1/ok'").run(); // via « commun » : permis
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("service médias : portée de site", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  withUsersTable(db);
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}'), (2, 'Autre', 'autre', '{}')");
  const media = require("../src/marketing/media");
  const team = { db, organizationId: 1, userId: null };
  const onlyA = { db, organizationId: 1, userId: null, siteScope: 1 };
  const onlyB = { db, organizationId: 1, userId: null, siteScope: 2 };
  const up = (ctx, tag, siteId) => media.saveUpload(ctx, { buffer: pdf(tag), originalName: `${tag}.pdf`, declaredType: "application/pdf", siteId });
  const diskOf = (m) => path.join(SCRATCH, m.path.replace(/^\/uploads\//, "uploads/"));
  let common, mineA, mineB;

  test("téléversements : commun par défaut (historique), dans le dossier du site pour un site, imposé pour un accès limité", () => {
    common = up(team, "commun");
    assert.deepEqual([common.reach, common.siteId], ["shared", null]);
    assert.match(common.path, /^\/uploads\/marketing\/1\/\d+-[0-9a-f]{12}\.pdf$/);
    mineA = up(team, "a", 1);
    assert.deepEqual([mineA.reach, mineA.siteId], ["site", 1]);
    assert.match(mineA.path, /^\/uploads\/marketing\/1\/site-1\/\d+-[0-9a-f]{12}\.pdf$/);
    mineB = up(onlyB, "b"); // l'accès limité n'a pas le choix du site
    assert.deepEqual([mineB.reach, mineB.siteId], ["site", 2]);
    assert.throws(() => up(onlyB, "x", 1), /introuvable/i, "un accès limité ne téléverse pas dans un autre site");
    assert.throws(() => up(team, "y", 3), /introuvable/i, "site d'une autre organisation");
    for (const m of [common, mineA, mineB]) assert.ok(fs.existsSync(diskOf(m)), m.path);
  });

  test("visibilité (MEDIA-01, une médiathèque par site) : l'équipe voit tout sans site choisi ; un accès limité ne voit QUE son site, jamais les communs ; le filtre d'affichage montre la médiathèque du site choisi", () => {
    const names = (ctx, o) => media.listMedia(ctx, o).items.map((m) => m.name).sort();
    assert.deepEqual(names(team), ["a.pdf", "b.pdf", "commun.pdf"]);
    assert.deepEqual(names(onlyA), ["a.pdf"]);
    assert.deepEqual(names(onlyB), ["b.pdf"]);
    assert.deepEqual(names({ ...team, siteFilter: 2 }), ["b.pdf"]);
    assert.deepEqual(names({ ...team, siteFilter: "principal" }), ["commun.pdf"]);
    assert.deepEqual(names(team, { reach: "site", siteId: 1 }), ["a.pdf"]);
    assert.equal(media.getMedia(onlyA, mineB.id), null, "lecture par identifiant d'un média d'un autre site : introuvable");
    assert.equal(media.getMedia(onlyA, common.id), null, "un média commun n'est plus proposé dans la médiathèque d'un site");
    assert.equal(media.mediaCounts(onlyA).all, 1, "les compteurs suivent la même visibilité que la liste");
    assert.equal(media.mediaCounts(team).all, 3);
    assert.deepEqual(media.mediaMonths(onlyA).map((m) => m.n), [1], "les mois proposés ne viennent que des fichiers visibles");
  });

  test("écriture : un accès limité ne modifie que les médias de son site, jamais les communs ni ceux d'un autre site", () => {
    for (const run of [() => media.updateMedia(onlyA, common.id, { alt: "x" }), () => media.trashMedia(onlyA, common.id), () => media.deleteMedia(onlyA, common.id)]) assert.throws(run, /introuvable/i, "un média commun est hors de la médiathèque d'un site : introuvable, aucune écriture");
    assert.throws(() => media.updateMedia(onlyA, mineB.id, { alt: "x" }), /introuvable/i);
    assert.equal(media.updateMedia(onlyA, mineA.id, { alt: "texte" }).alt, "texte");
    assert.ok(media.trashMedia(onlyA, mineA.id).deletedAt);
    assert.ok(media.restoreMedia(onlyA, mineA.id));
    assert.equal(media.getMedia(team, common.id).alt || "", "", "le média commun n'a pas bougé");
  });

  test("partage : réservé à l'équipe, jamais de site à site, « commun → site » refusé si un autre site l'utilise", () => {
    assert.throws(() => media.setMediaScope(onlyA, mineA.id, { reach: "shared" }), /équipe/i);
    // un contenu de Beta utilise le média propre à Alpha : le rapport d'isolation le signale
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, sections) VALUES (1, 'PB', 'pb', 'PB', 'draft', 2, ?)").run(JSON.stringify([{ image: mineA.path }]));
    const report = media.crossSiteUsage(team);
    assert.equal(report.length, 1);
    assert.equal(report[0].media.id, mineA.id);
    // site → site direct : refusé ; via « commun » : permis
    assert.throws(() => media.setMediaScope(team, mineA.id, { reach: "site", siteId: 2 }), /commun/i);
    const shared = media.setMediaScope(team, mineA.id, { reach: "shared" });
    assert.deepEqual([shared.reach, shared.siteId, shared.path], ["shared", null, mineA.path], "l'adresse publique ne change pas");
    assert.ok(fs.existsSync(diskOf(shared)), "aucun fichier déplacé ni perdu");
    // commun → site : refusé car la page de Beta l'utilise ; permis vers Beta
    assert.throws(() => media.setMediaScope(team, mineA.id, { reach: "site", siteId: 1 }), /hors de ce site/i);
    const toB = media.setMediaScope(team, mineA.id, { reach: "site", siteId: 2 });
    assert.deepEqual([toB.reach, toB.siteId], ["site", 2]);
    assert.equal(media.crossSiteUsage(team).length, 0);
  });
});
