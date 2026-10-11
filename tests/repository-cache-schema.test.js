// Palier 26 : le dépôt garde en mémoire les colonnes des tables mais reste exact quand le schéma change.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { createRepository } = require("../src/marketing/db/repository");

test("une colonne ajoutée après un premier appel est reconnue ; une colonne inconnue reste refusée ; une table créée plus tard est trouvée", () => {
  const m = freshMarketing();
  const repo = createRepository(m.db, m.A.organizationId);
  assert.throws(() => repo.table("mk_inexistante_p26"), /Table introuvable/);
  m.db.exec("CREATE TABLE mk_inexistante_p26 (id INTEGER PRIMARY KEY, organization_id INTEGER NOT NULL, a TEXT)");
  const t = repo.table("mk_inexistante_p26");
  assert.equal(t.insert({ a: "x" }).a, "x");
  assert.throws(() => t.insert({ b: "y" }), /Colonne inconnue/);
  m.db.exec("ALTER TABLE mk_inexistante_p26 ADD COLUMN b TEXT");
  assert.equal(repo.table("mk_inexistante_p26").insert({ b: "y" }).b, "y");
  assert.throws(() => repo.table("sqlite_master"), /Nom de table invalide/);
});
