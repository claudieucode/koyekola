// R6 — portée de site dans le SERVICE des pages (défense en profondeur derrière la garde des routes) : un contexte limité à un site (ctx.siteScope)
// ne lit, ne crée, ne duplique, ne déplace ni n'importe hors de son site. Vraies migrations dans une base d'essai jetable (DATA_DIR créé par ce test) ; aucun serveur.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r6-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("service des pages : portée de site", () => {
  let db, pages, ORG, A, B, pageA, pageB;
  const team = () => ({ db, organizationId: ORG, userId: null, can: () => true });
  const scoped = (siteId) => ({ ...team(), siteScope: siteId });
  before(() => {
    db = require("../src/config/database");
    const { migrate } = require("../src/marketing/db/migrate");
    migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), log: quiet });
    pages = require("../src/marketing/pages");
    ORG = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run().lastInsertRowid);
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'A', 'a', '{}')").run(ORG).lastInsertRowid);
    B = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'B', 'b', '{}')").run(ORG).lastInsertRowid);
    pageA = pages.createPage(team(), { name: "Page A", siteId: A }).id;
    pageB = pages.createPage(team(), { name: "Page B", siteId: B }).id;
  });

  test("lecture : une page d'un autre site est introuvable, la sienne est lisible ; l'équipe lit tout", () => {
    assert.ok(pages.getPage(scoped(A), pageA));
    assert.equal(pages.getPage(scoped(A), pageB), null);
    assert.throws(() => pages.requirePage(scoped(A), pageB), /introuvable/i);
    assert.ok(pages.getPage(team(), pageB));
    assert.equal(pages.getPage(scoped(-1), pageA), null, "contexte limité sans site valide : rien n'est lisible");
  });
  test("écriture : créer, dupliquer, déplacer, importer hors de son site est refusé ; dans son site, permis", () => {
    const n = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
    assert.throws(() => pages.createPage(scoped(A), { name: "Intrus", siteId: B }), /accessible/i);
    assert.throws(() => pages.createPage(scoped(A), { name: "Sans site", siteId: null }), /accessible/i);
    assert.throws(() => pages.duplicatePage(scoped(A), pageA, { siteId: B }), /accessible/i);
    assert.throws(() => pages.movePage(scoped(A), pageA, B), /accessible/i);
    assert.throws(() => pages.movePage(scoped(A), pageA, null), /accessible/i);
    assert.throws(() => pages.movePage(scoped(A), pageB, A), /introuvable/i);
    assert.throws(() => pages.importPage(scoped(A), { format: pages.EXPORT_FORMAT, name: "x", content: { sections: [] } }, { siteId: B }), /accessible/i);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, n, "rien n'a été créé");
    assert.equal(db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(pageA).site_id, A);
    const own = pages.createPage(scoped(A), { name: "Dans A", siteId: A });
    assert.equal(own.site_id, A);
    assert.equal(pages.duplicatePage(scoped(A), pageA).site_id, A);
  });
  test("déplacement par l'équipe : refusé pour une page à la corbeille ; permis sinon, contenu inchangé", () => {
    const p = pages.createPage(team(), { name: "Mobile", siteId: A }).id;
    const content = db.prepare("SELECT sections, draft FROM mk_landing_pages WHERE id = ?").get(p);
    pages.movePage(team(), p, B);
    assert.deepEqual({ ...db.prepare("SELECT sections, draft FROM mk_landing_pages WHERE id = ?").get(p) }, { ...content });
    assert.equal(db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(p).site_id, B);
    pages.archivePage(team(), p);
    assert.throws(() => pages.movePage(team(), p, A), /corbeille/i);
  });
});
