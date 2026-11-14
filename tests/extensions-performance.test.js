// Extensions — performance : le moteur ne doit pas ralentir les sites. Chargement du registre, contrôle d'activation en cache, coût d'une requête hors extension, chargement paresseux des étapes d'extension.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const registry = require("../src/extensions/registry");
const state = require("../src/extensions/state");
const activation = require("../src/extensions/activation");
const runtime = require("../src/extensions/runtime");

describe("performance du moteur d'extensions", () => {
  test("registre : chargé UNE fois (même objet ensuite) et rapide", () => {
    const t0 = process.hrtime.bigint();
    const first = registry.load();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.equal(registry.load(), first, "un seul registre en mémoire");
    assert.ok(ms < 500, `chargement du registre : ${ms.toFixed(1)} ms`);
  });
  test("contrôle d'activation : servi par le cache (>99 % de lectures sans requête de liste), 20 000 contrôles en moins de 2 s", () => {
    const w = freshMarketing();
    w.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'a', 'a@x.fr')");
    w.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}')");
    activation.enable(w.A, 1, "commerce");
    state.isEnabled(w.db, 1, 1, "commerce");
    const h0 = state.stats.hits, m0 = state.stats.misses;
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 20000; i++) assert.equal(state.isEnabled(w.db, 1, 1, i % 2 ? "commerce" : "lms"), i % 2 === 1);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.ok(state.stats.hits - h0 >= 19990 && state.stats.misses - m0 <= 5, `hits ${state.stats.hits - h0}, miss ${state.stats.misses - m0}`);
    assert.ok(ms < 2000, `20 000 contrôles : ${ms.toFixed(0)} ms`);
  });
  test("garde publique : une requête qui n'appartient à aucune extension ne coûte aucune requête SQL ; un domaine du principal non plus", () => {
    let queries = 0;
    const db = { prepare() { queries += 1; throw new Error("aucune requête attendue"); } };
    const guard = runtime.publicGuard(db);
    let passed = 0;
    for (const [site, path] of [[{ id: 4 }, "/"], [{ id: 4 }, "/blog/article"], [{ id: 4 }, "/a-propos"], [null, "/catalogue"], [undefined, "/boutique"]]) guard({ kwSite: site, path }, {}, () => { passed += 1; });
    assert.equal(passed, 5); assert.equal(queries, 0);
  });
  test("une extension désactivée n'ajoute rien aux autres sites : l'état d'un site ne lit que SA ligne (clé organisation + site)", () => {
    const w = freshMarketing();
    w.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'a', 'a@x.fr')");
    w.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    activation.enable(w.A, 1, "lms");
    assert.deepEqual(state.enabledIds(w.db, 1, 2), []); assert.deepEqual(state.enabledIds(w.db, 1, 1), ["lms"]);
  });
  test("l'étape de cycle de vie n'est chargée qu'à l'activation (pas au démarrage du registre)", () => {
    const resolved = Object.keys(require.cache).filter((f) => /tests[\\/]fixtures[\\/]extension-lifecycle/.test(f));
    const before = resolved.length;
    const w = freshMarketing();
    w.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'a', 'a@x.fr')");
    w.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}')");
    const restore = registry.override(registry.createRegistry([{ id: "paresseuse", name: "Paresseuse", description: "Extension de test à chargement paresseux.", icon: "plug", version: "1.0.0", publisher: "Test", category: "outils", availability: "available", maintenance: "stable", scope: "optional", compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [], entry: { lifecycle: "tests/fixtures/extension-lifecycle-ok.js" }, adminRoutes: [], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/README.md" }]));
    try {
      assert.equal(Object.keys(require.cache).filter((f) => /extension-lifecycle/.test(f)).length, before, "le registre n'a pas chargé le fichier");
      activation.enable(w.A, 1, "paresseuse");
      assert.ok(Object.keys(require.cache).some((f) => /extension-lifecycle-ok/.test(f)), "chargé à l'activation");
    } finally { restore(); }
  });
});
