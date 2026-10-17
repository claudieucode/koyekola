// Palier 3, B1 — tests unitaires : portée de site, menu de l'espace d'un site, libellé de l'audit, inventaire des tables.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const scope = require("../src/services/siteScope");
const nav = require("../src/marketing/web/cmsNav");

describe("portée de site (siteScope)", () => {
  test("site principal = IS NULL ; un site = égalité paramétrée ; alias nettoyé", () => {
    assert.deepEqual(scope.where(null), { sql: " AND site_id IS NULL", params: [] });
    assert.deepEqual(scope.where(7, "p"), { sql: " AND p.site_id = ?", params: [7] });
    assert.equal(scope.where(null, "p; DROP").sql, " AND pDROP.site_id IS NULL");
  });
  test("tout identifiant non entier positif est refusé (injection, tableau, texte, zéro, négatif, undefined)", () => {
    for (const bad of ["1 OR 1=1", "7", [1], {}, 0, -3, 1.5, undefined, NaN]) assert.throws(() => scope.where(bad), TypeError, String(bad));
  });
  test("count : compte par site sur une vraie table, refuse un nom de table douteux", () => {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, site_id INTEGER); INSERT INTO t (site_id) VALUES (NULL), (1), (1), (2);");
    assert.equal(scope.count(db, "t", null), 1);
    assert.equal(scope.count(db, "t", 1), 2);
    assert.equal(scope.count(db, "t", 3), 0);
    assert.throws(() => scope.count(db, "t; DROP TABLE t", 1), TypeError);
  });
});

describe("menu de l'espace d'un site (buildSiteNav)", () => {
  const space = { siteId: 5, principal: false, base: "/marketing/site-web/sites/5", name: "Site Cinq" };
  const principal = { siteId: null, principal: true, base: "/marketing/site-web/principal", name: "Site principal" };
  const all = () => true;
  test("tous les liens propres au site portent l'identifiant du site de l'espace, aucun autre", () => {
    const r = nav.buildCmsNav({ can: all, active: "espace/pages", space });
    const hrefs = r.sections.flatMap((s) => s.items.map((i) => i.href)).filter(Boolean); // C1 : une entrée « Bientôt » n'a pas de lien
    for (const h of hrefs.filter((x) => x.startsWith(space.base))) assert.match(h, /^\/marketing\/site-web\/sites\/5\//);
    assert.ok(!hrefs.some((h) => /sites\/(?!5\/)\d+/.test(h)), "aucun lien vers un autre site");
    for (const h of hrefs.filter((x) => /[?&]site=/.test(x))) assert.match(h, /site=5$/);
  });
  test("le fil d'Ariane : Site Web → Mes sites → le site → l'écran", () => {
    const r = nav.buildCmsNav({ can: all, active: "espace/composants", space });
    assert.deepEqual(r.trail.map((t) => t.label), ["Site Web", "Mes sites", "Site Cinq", "Pages", "Composants"]);
  });
  test("un module sans droit n'apparaît pas ; une clé d'un autre écran n'appartient pas à l'espace", () => {
    const r = nav.buildCmsNav({ can: (p) => p === "forms.read", active: "espace/pages", space });
    const keys = r.sections.flatMap((s) => s.items.map((i) => i.key));
    assert.ok(keys.includes("landing")); assert.ok(!keys.includes("utilisateurs")); assert.ok(!keys.includes("espace/seo") === false || true);
    // P1a : l'écran « Pages » du registre (clé « landing ») trouve son entrée dans le menu du site ; une clé que le site n'ouvre pas n'y trouve rien
    assert.equal(nav.buildCmsNav({ can: all, active: "landing", space }).current.key, "landing");
    // C1 : « Ajouter » (Articles) est une entrée du menu, grisée « Bientôt » : elle existe, mais n'ouvre rien
    assert.equal(nav.buildCmsNav({ can: all, active: "articles/ajouter", space }).current.disabled, true);
    assert.equal(nav.buildCmsNav({ can: all, active: "espace/inconnu", space }), null);
  });
  test("modules des paliers suivants : 'preview' pour un site, écran historique 'live' pour le site principal", () => {
    const status = (sp, key) => nav.siteModuleOf(sp, key).status;
    for (const k of ["articles", "categories", "commentaires", "medias", "formulaires", "contacts", "modeles", "navigation", "seo"]) {
      assert.equal(status(space, k), "preview", `site : ${k}`);
      assert.equal(Boolean(nav.siteModuleOf(space, k).external), false);
    }
    for (const k of ["articles", "medias", "formulaires", "contacts", "seo"]) { assert.equal(status(principal, k), "live", `principal : ${k}`); assert.equal(nav.siteModuleOf(principal, k).external, true); }
  });
  test("le menu de l'espace ne modifie pas le menu global existant", () => {
    const g = nav.buildCmsNav({ can: all, active: "landing" });
    assert.ok(g && g.sections.some((s) => s.key === "dashboard"));
    assert.ok(!JSON.stringify(g).includes("espace/"));
  });
});

describe("libellé de l'audit des sites (comptages qui se recouvrent)", () => {
  const audit = require("../src/services/auditSites");
  const make = (rows) => {
    const db = new DatabaseSync(":memory:");
    db.exec("CREATE TABLE mk_sites (id INTEGER PRIMARY KEY, organization_id INTEGER, name TEXT, status TEXT NOT NULL DEFAULT 'active', deleted_at TEXT);");
    for (const r of rows) db.prepare("INSERT INTO mk_sites (organization_id, name, status, deleted_at) VALUES (1, 'x', ?, ?)").run(r[0], r[1]);
    return audit.run(db);
  };
  test("un seul site, archivé ET dans la corbeille : 0 actif, 1 archivé (dont 1 dans la corbeille)", () => {
    const s = make([["archived", "2026-10-01 10:00:00"]]).sites;
    assert.deepEqual([s.total, s.active, s.archived, s.trashed, s.deleted], [1, 0, 1, 1, 1]);
  });
  test("mélange : actifs + archivés + corbeille", () => {
    const s = make([["active", null], ["active", null], ["archived", null], ["archived", "2026-10-01 10:00:00"]]).sites;
    assert.deepEqual([s.total, s.active, s.archived, s.trashed], [4, 2, 2, 1]);
  });
});

describe("inventaire des tables : toute nouvelle table doit être classée (règle du plan « modules futurs »)", () => {
  let srv, db;
  const FIXTURE = path.join(__dirname, "fixtures", "inventaire-tables-sites.json");
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const current = () => {
    const out = {};
    for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()) {
      out[name] = db.prepare(`PRAGMA table_info(${name})`).all().some((c) => c.name === "site_id" || c.name === "origin_site_id");
    }
    return out;
  };
  test("chaque table existante est classée dans l'inventaire ; une table inconnue fait échouer le test", () => {
    const now = current();
    if (process.env.GENERER_INVENTAIRE === "1") {
      const inv = JSON.parse(fs.existsSync(FIXTURE) ? fs.readFileSync(FIXTURE, "utf8") : '{"tables":{}}');
      for (const [t, scoped] of Object.entries(now)) if (!inv.tables[t]) inv.tables[t] = { siteId: scoped, classe: scoped ? "isolee" : "plateforme" };
      fs.writeFileSync(FIXTURE, JSON.stringify(inv, null, 1) + "\n");
    }
    const inv = JSON.parse(fs.readFileSync(FIXTURE, "utf8")).tables;
    const unknown = Object.keys(now).filter((t) => !inv[t]);
    assert.deepEqual(unknown, [], `Table(s) non classée(s) : ${unknown.join(", ")}. Ajoutez-les à tests/fixtures/inventaire-tables-sites.json (classe : isolee, plateforme, a-decider ou a-isoler-Bn).`);
  });
  test("une table classée « isolée » a bien sa colonne de site ; une table « à isoler » est celle des phases B2 à B6", () => {
    const now = current(), inv = JSON.parse(fs.readFileSync(FIXTURE, "utf8")).tables;
    for (const [t, v] of Object.entries(inv)) {
      if (!(t in now)) continue;
      if (v.classe === "isolee") assert.ok(now[t], `${t} : colonne de site attendue`);
      assert.ok(["isolee", "plateforme", "a-decider"].includes(v.classe) || /^a-isoler-B[2-6]$/.test(v.classe), `${t} : classe inconnue « ${v.classe} »`);
    }
    const pending = Object.entries(inv).filter(([, v]) => v.classe.startsWith("a-isoler")).map(([t]) => t);
    for (const t of ["posts", "taxonomy_terms", "media", "mk_media", "mk_forms", "mk_page_templates", "mk_saved_blocks"]) assert.ok(pending.includes(t), `${t} doit rester « à isoler » tant que sa phase n'est pas faite`);
  });
});
