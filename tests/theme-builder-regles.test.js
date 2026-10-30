// Programme 20.3 — règles d'affichage des modèles de thème, testées sans serveur (base SQLite en mémoire) :
// exclusions, priorité déterministe, égalités signalées, modification des conditions, repli, entrées hostiles.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const themeTemplates = require("../src/marketing/pages/themeTemplates");

function makeCtx(organizationId = 1, store = new Map()) {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE mk_landing_pages (id INTEGER PRIMARY KEY, organization_id INTEGER, name TEXT, slug TEXT, status TEXT, kind TEXT, archived_at TEXT);
           CREATE TABLE posts (id INTEGER PRIMARY KEY, deleted_at TEXT);
           INSERT INTO posts (id) VALUES (1), (2), (3);`);
  const page = (id, name, status = "published", org = organizationId) => db.prepare("INSERT INTO mk_landing_pages (id, organization_id, name, slug, status, kind) VALUES (?, ?, ?, ?, ?, 'page')").run(id, org, name, `p${id}`, status);
  const settings = { get: (org, key, d) => store.get(`${org}:${key}`) ?? d, set: (org, key, v) => store.set(`${org}:${key}`, v) };
  return { db, page, store, ctx: { db, organizationId, settings } };
}

describe("Theme Builder — règles d'affichage (20.3)", () => {
  let c;
  beforeEach(() => { c = makeCtx(); [1, 2, 3, 4].forEach((i) => c.page(i, `Modèle ${i}`)); });

  test("sans modèle : aucun résultat (repli sur l'affichage d'origine)", () => {
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { category: "Actu" }), null);
  });

  test("le plus précis gagne : article précis > catégorie > général", () => {
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 1 });
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 2, category: "Actu" });
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 3, postId: 2 });
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 2 }).id, 3);
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 1 }).id, 2);
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Autre"], postId: 1 }).id, 1);
  });

  test("exclusion : un modèle général ne s'applique pas à une catégorie exclue, et le repli est signalé", () => {
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 1, exclude: { category: ["Actu"] } });
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 1 }), null);
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Guides"], postId: 1 }).id, 1);
    const why = themeTemplates.explain(c.ctx, "single_post", { categories: ["Actu"], postId: 1 });
    assert.equal(why.winner, null);
    assert.match(why.candidates[0].reason, /exclue/);
    assert.match(why.fallback, /affichage d'origine/);
  });

  test("exclusion d'un article précis et d'une étiquette ; l'exclusion l'emporte sur l'inclusion", () => {
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 1, category: "Actu", exclude: { postId: [3], tag: ["brouillon-idee"] } });
    assert.ok(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 1 }));
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 3 }), null);
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["Actu"], postId: 1, tags: ["Brouillon-Idee"] }), null);
  });

  test("une exclusion sur un critère non pris en charge par la famille est ignorée, un article inexistant est refusé", () => {
    const e = themeTemplates.add(c.ctx, { type: "not_found", pageId: 1, exclude: { category: ["Actu"] } });
    assert.equal(e.exclude, undefined);
    assert.throws(() => themeTemplates.add(c.ctx, { type: "single_post", pageId: 2, exclude: { postId: [999] } }), /introuvable/);
    assert.throws(() => themeTemplates.add(c.ctx, { type: "single_post", pageId: 2, exclude: { postId: ["1; DROP TABLE posts"] } }), /introuvable/);
  });

  test("égalité de précision : le plus ancien gagne, et l'ajout signale le modèle concerné", () => {
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 1, category: "A" });
    const second = themeTemplates.add(c.ctx, { type: "single_post", pageId: 2, category: "B" });
    assert.deepEqual(second.conflicts.map((x) => x.pageName), ["Modèle 1"]);
    assert.equal(themeTemplates.pick(c.ctx, "single_post", { categories: ["A", "B"] }).id, 1, "ordre d'ancienneté, jamais aléatoire");
    const alone = themeTemplates.add(c.ctx, { type: "single_post", pageId: 3, postId: 1 });
    assert.deepEqual(alone.conflicts, [], "pas de signalement quand la précision diffère");
  });

  test("doublon exact refusé, mais mêmes inclusions avec exclusions différentes autorisées", () => {
    themeTemplates.add(c.ctx, { type: "single_post", pageId: 1 });
    assert.throws(() => themeTemplates.add(c.ctx, { type: "single_post", pageId: 2 }), /existe déjà/);
    assert.ok(themeTemplates.add(c.ctx, { type: "single_post", pageId: 2, exclude: { category: ["Actu"] } }));
  });

  test("modification : les conditions changent, l'identifiant et l'ancienneté sont conservés, aucun faux doublon avec soi-même", () => {
    const a = themeTemplates.add(c.ctx, { type: "single_post", pageId: 1, category: "A" });
    const b = themeTemplates.update(c.ctx, a.id, { exclude: { tag: ["x"] } });
    assert.equal(b.id, a.id);
    assert.equal(b.createdAt, a.createdAt);
    assert.deepEqual(b.exclude, { tag: ["x"] });
    assert.equal(themeTemplates.read(c.ctx).length, 1);
    assert.equal(themeTemplates.update(c.ctx, a.id, { category: "A" }).category, "A", "ré-enregistrer les mêmes conditions est permis");
    assert.throws(() => themeTemplates.update(c.ctx, "deadbeef", {}), /introuvable/);
  });

  test("modification : une page archivée, une étape de tunnel ou une page d'un autre site sont refusées", () => {
    const a = themeTemplates.add(c.ctx, { type: "not_found", pageId: 1 });
    c.db.prepare("UPDATE mk_landing_pages SET archived_at = '2026-01-01' WHERE id = 2").run();
    c.db.prepare("UPDATE mk_landing_pages SET kind = 'step' WHERE id = 3").run();
    c.page(9, "Autre organisation", "published", 2);
    assert.throws(() => themeTemplates.update(c.ctx, a.id, { pageId: 2 }), /non archivée/);
    assert.throws(() => themeTemplates.update(c.ctx, a.id, { pageId: 3 }), /tunnel/);
    assert.throws(() => themeTemplates.update(c.ctx, a.id, { pageId: 9 }), /Choisissez une page/);
    assert.equal(themeTemplates.read(c.ctx)[0].pageId, 1, "rien n'a été modifié après les refus");
  });

  test("brouillon, hors ligne ou page supprimée : le modèle n'est pas utilisé publiquement", () => {
    themeTemplates.add(c.ctx, { type: "not_found", pageId: 1 });
    c.db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = 1").run();
    assert.equal(themeTemplates.pick(c.ctx, "not_found"), null);
    c.db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = 1").run();
    assert.ok(themeTemplates.pick(c.ctx, "not_found"));
    c.db.prepare("DELETE FROM mk_landing_pages WHERE id = 1").run();
    assert.equal(themeTemplates.pick(c.ctx, "not_found"), null);
  });

  test("isolation : les modèles d'une organisation ne sont pas visibles d'une autre, et ses pages ne peuvent pas servir de modèle", () => {
    themeTemplates.add(c.ctx, { type: "not_found", pageId: 1 });
    const other = makeCtx(2, c.store);
    other.page(1, "Page de l'autre organisation", "published", 2);
    assert.deepEqual(themeTemplates.read(other.ctx), []);
    assert.equal(themeTemplates.pick(other.ctx, "not_found"), null);
    assert.throws(() => themeTemplates.add(c.ctx, { type: "not_found", pageId: 77 }), /Choisissez une page/);
  });

  test("type inconnu et réglage corrompu : refus net / liste vide, jamais d'exception", () => {
    assert.throws(() => themeTemplates.add(c.ctx, { type: "../../etc", pageId: 1 }), /inconnu/);
    c.store.set("1:theme.templates", "{pas du json");
    assert.deepEqual(themeTemplates.read(c.ctx), []);
    assert.equal(themeTemplates.pick(c.ctx, "single_post"), null);
  });
});
