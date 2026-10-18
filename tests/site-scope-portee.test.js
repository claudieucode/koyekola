// R9-2 — vocabulaire commun de portée (siteScope.isPrimary / scopeKey / sameScope) : comportement identique à l'existant, aucune écriture SQL littérale de l'égalité de portée hors DDL.
const fs = require("node:fs");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const scope = require("../src/services/siteScope");

describe("siteScope : portée principal / site", () => {
  test("isPrimary et scopeKey : le principal est null ou undefined (clé 0), un site garde son identifiant", () => {
    assert.equal(scope.isPrimary(null), true); assert.equal(scope.isPrimary(undefined), true); assert.equal(scope.isPrimary(0), false); assert.equal(scope.isPrimary(3), false); assert.equal(scope.isPrimary("3"), false);
    assert.equal(scope.scopeKey(null), 0); assert.equal(scope.scopeKey(undefined), 0); assert.equal(scope.scopeKey(7), 7); assert.equal(scope.scopeKey("7"), 7);
  });
  test("sameScope : texte exact de l'ancien code, colonne validée (aucune injection)", () => {
    assert.equal(scope.sameScope("site_id"), "COALESCE(site_id, 0) = COALESCE(?, 0)"); assert.equal(scope.sameScope("m.site_id"), "COALESCE(m.site_id, 0) = COALESCE(?, 0)");
    for (const bad of ["site_id) OR (1=1", "a.b.c", "", "site id", "x;DROP TABLE y", null]) assert.throws(() => scope.sameScope(bad), TypeError, String(bad));
  });
  test("sameScope en SQL : le principal (NULL) ne rencontre que le principal ; un site ne rencontre que lui-même ; le principal n'est jamais confondu avec un site", () => {
    const db = new DatabaseSync(":memory:"); db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, site_id INTEGER); INSERT INTO t (site_id) VALUES (NULL), (NULL), (1), (2), (2)");
    const ids = (site) => db.prepare(`SELECT id FROM t WHERE ${scope.sameScope("site_id")} ORDER BY id`).all(site).map((r) => r.id);
    assert.deepEqual(ids(null), [1, 2]); assert.deepEqual(ids(1), [3]); assert.deepEqual(ids(2), [4, 5]); assert.deepEqual(ids(99), []);
    assert.deepEqual(ids(undefined ?? null), [1, 2]);
  });
  test("garde-fou : l'égalité de portée n'est plus écrite à la main dans le code (hors DDL des index et siteScope) ; auditSites réutilise scopeKey", () => {
    const hits = [];
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.js$/.test(e.name) && !/(siteScope|database|reconstructionTables)\.js$/.test(e.name)) { fs.readFileSync(p, "utf8").split("\n").forEach((l, i) => { if (/COALESCE\((\w+\.)?site_id, 0\) = COALESCE\(\?, 0\)/.test(l)) hits.push(`${p}:${i + 1}`); }); } } };
    walk(path.join(__dirname, "..", "src"));
    assert.deepEqual(hits, [], "utiliser siteScope.sameScope(...)");
    assert.match(fs.readFileSync(path.join(__dirname, "..", "src", "services", "auditSites.js"), "utf8"), /scopeKey: KEY/);
  });
});
