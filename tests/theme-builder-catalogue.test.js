// Catalogue de modèles du Theme Builder : 100 modèles par type, tous VALIDES (grammaire du Page Builder), distincts, utilisables (copie indépendante dans le site), isolés par site.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const siteModules = require("../src/marketing/siteModules");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const store = require("../src/themeBuilder/store");

const { A } = freshMarketing();
const s1 = pages.createSite(A, { name: "Site un" }), s2 = pages.createSite(A, { name: "Site deux" });
siteModules.setEnabled(A, s1.id, "commerce", true); siteModules.setEnabled(A, s2.id, "commerce", true);
const TYPES = process.env.TB_TYPES ? process.env.TB_TYPES.split(",") : Catalog.FILES.filter((t) => { try { require(`../src/themeBuilder/catalog/${t}`); return true; } catch { return false; } });
const strip = (n) => JSON.stringify(n, (k, v) => (k === "id" ? undefined : v));
// structure = arbre des types d'éléments + noms (pas les valeurs) des réglages : deux modèles de même structure ne diffèrent que par leurs valeurs
const shape = (n) => JSON.stringify(n, (k, v) => (k === "id" ? undefined : k === "props" ? Object.keys(v).sort() : k === "styles" ? Object.keys(v.desktop || {}).sort() : v));

describe("catalogue : 100 modèles valides et distincts par type", () => {
  for (const type of TYPES) {
    test(`${type} : 100 modèles, tous acceptés par la grammaire, tous distincts`, () => {
      const all = Catalog.entries(type);
      assert.equal(all.length, 100, "exactement 100 modèles");
      assert.equal(new Set(all.map((e) => e.key)).size, 100, "clés uniques");
      assert.equal(new Set(all.map((e) => e.name)).size, 100, "noms uniques");
      const seen = new Set(), structures = new Set();
      for (const e of all) {
        const b = Catalog.build(type, e.key);
        assert.ok(b, e.key);
        const raw = strip(b.section || b.sections);
        assert.ok(!seen.has(raw), `${e.key} : identique à un autre modèle`); seen.add(raw);
        structures.add(shape(b.section || b.sections));
        // acceptation par la grammaire réelle du Page Builder (composant ou page)
        if (b.kind === "component") pages.createComponent(A, { name: `${type} ${e.key}`, section: JSON.parse(JSON.stringify(b.section)), siteId: s1.id, kind: "standard" });
        else pages.createPage(A, { name: `${type} ${e.key}`, siteId: s1.id, kind: "page", sections: JSON.parse(JSON.stringify(b.sections)) });
      }
      assert.ok(structures.size >= 20, `au moins 20 structures différentes (${structures.size})`);
    });
  }
});
describe("catalogue : liste, filtres, pagination", () => {
  test("liste paginée, recherche sans accents, filtre par identité et par étiquette", () => {
    const t = TYPES[0];
    const p1 = Catalog.list(t, { limit: 24 });
    assert.equal(p1.total, 100); assert.equal(p1.items.length, 24); assert.equal(p1.pages, 5);
    assert.equal(Catalog.list(t, { page: 5, limit: 24 }).items.length, 4);
    assert.ok(!("section" in p1.items[0]) && !("sections" in p1.items[0]), "la liste ne contient jamais les documents");
    assert.equal(Catalog.list(t, { skin: "nuit" }).total, 20);
    assert.ok(Catalog.list(t, { q: "ÉDITORIAL" }).total >= 20);
    assert.equal(Catalog.list(t, { q: "zzzz-inconnu" }).total, 0);
  });
});
describe("catalogue : utiliser un modèle", () => {
  test("types de boutique : refusés tant que le module Commerce est désactivé pour le site", () => {
    const shop = TYPES.find((t) => ["single_product", "product_archive"].includes(t));
    if (!shop) return;
    siteModules.setEnabled(A, s1.id, "commerce", false);
    assert.throws(() => useTemplate(A, s1.id, shop, Catalog.list(shop).items[0].key), /désactivé/);
    siteModules.setEnabled(A, s1.id, "commerce", true);
  });
  for (const type of TYPES) {
    test(`${type} : « Utiliser » crée une copie brouillon indépendante dans le site, isolée de l'autre site`, () => {
      const key = Catalog.list(type).items[7].key;
      const t = useTemplate(A, s1.id, type, key);
      assert.equal(t.status, "draft"); assert.equal(t.type, type);
      assert.equal(store.list(A, s1.id, { type }).filter((x) => x.id === t.id).length, 1);
      assert.equal(store.list(A, s2.id, { type }).length, 0, "l'autre site ne voit rien");
      const t2 = useTemplate(A, s1.id, type, key);
      assert.notEqual(t2.sourceId, t.sourceId, "chaque utilisation crée sa propre copie");
    });
  }
  test("clé inconnue ou type sans catalogue refusés", () => {
    assert.throws(() => useTemplate(A, s1.id, TYPES[0], "nope.nope"), /introuvable/);
    assert.throws(() => useTemplate(A, s1.id, "custom", "x"), /catalogue/);
  });
});
