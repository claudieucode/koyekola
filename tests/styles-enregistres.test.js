// Styles enregistrés : catégories (serveur) – chaque propriété visuelle a une catégorie, la structure n'en a jamais, la sélection est respectée.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nodes = require("../src/marketing/pages/nodes");
const sp = require("../src/marketing/pages/stylePresets");

describe("styles enregistrés : catégories", () => {
  test("toute clé de catégorie existe dans la grammaire des styles (aucune catégorie fictive)", () => {
    for (const c of sp.CATEGORIES) for (const k of c.keys) assert.ok(nodes.STYLE_PROPS[k] || nodes.COMPOSED[k], `${c.id} : « ${k} » inconnue`);
  });
  test("une clé n'appartient qu'à une catégorie ; la structure et le contexte parent n'en ont aucune", () => {
    const seen = new Set();
    for (const c of sp.CATEGORIES) for (const k of c.keys) { assert.ok(!seen.has(k), `${k} en double`); seen.add(k); }
    for (const k of ["display", "flexDirection", "alignSelf", "gridColumnSpan", "order", "position", "zIndex", "top", "visibility", "pointerEvents", "overflow", "backgroundImage", "flexGrow"]) assert.equal(sp.categoryOf(k), null, k);
  });
  test("toute propriété hors catégorie est structurelle ou fonctionnelle (layout, position, comportement, contenu)", () => {
    const outside = [...Object.keys(nodes.STYLE_PROPS), ...Object.keys(nodes.COMPOSED)].filter((k) => !sp.categoryOf(k));
    const ok = (k) => (nodes.STYLE_PROPS[k] || nodes.COMPOSED[k]).group;
    for (const k of outside) assert.ok(["layout", "position", "effects", "background"].includes(ok(k)) || ["flexGrow", "flexShrink", "flexBasis"].includes(k), `${k} (${ok(k)}) devrait avoir une catégorie`);
    assert.ok(outside.filter((k) => ok(k) === "effects").every((k) => ["overflow", "overflowX", "overflowY", "visibility", "cursor", "pointerEvents"].includes(k)));
  });
  test("pick : seules les catégories, propriétés, écrans et états choisis ; l'entrée n'est pas modifiée ; vide ≠ absent conservé", () => {
    const styles = { desktop: { color: "#111", fontSize: "20px", paddingTop: "8px", display: "flex", opacity: 0 }, mobile: { color: "#222" } };
    const states = { hover: { color: "#333", borderRadius: "4px" } };
    const snap = JSON.stringify([styles, states]);
    const a = sp.pick(styles, states, { categories: ["colors"] });
    assert.deepEqual(a.styles, { desktop: { color: "#111" }, mobile: { color: "#222" } });
    assert.deepEqual(a.states, { hover: { color: "#333" } });
    const b = sp.pick(styles, states, { categories: ["colors", "typography"], screens: ["desktop"], stateKeys: [] });
    assert.deepEqual(b, { styles: { desktop: { color: "#111", fontSize: "20px" } }, states: {} });
    assert.deepEqual(sp.pick(styles, states, { categories: ["colors", "typography"], only: ["fontSize"] }).styles, { desktop: { fontSize: "20px" } });
    assert.equal(sp.pick(styles, states, { categories: ["objects"] }).styles.desktop.opacity, 0, "une valeur 0 est conservée");
    assert.deepEqual(sp.pick(styles, states, { categories: [] }), { styles: {}, states: {} });
    assert.equal(JSON.stringify([styles, states]), snap);
  });
  test("la classe globale conserve et valide ses métadonnées (type source, catégories, date) sans accepter n'importe quoi", () => {
    const out = nodes.normalizeClassDefs([{ name: "a", styles: { desktop: { color: "#fff" } }, meta: { source: "heading", categories: ["colors", "x"], updated: "2026-10-10", evil: "<b>" } }, { name: "b", meta: { source: "n'importe", categories: "x", updated: "hier" } }], {});
    assert.deepEqual(out[0].meta, { source: "heading", categories: ["colors"], updated: "2026-10-10" });
    assert.equal(out[1].meta, undefined);
  });
  test("l'éditeur reçoit la même liste de catégories que le serveur", () => {
    assert.deepEqual(nodes.editorSpec().presetCategories.map((c) => c.id), sp.CATEGORIES.map((c) => c.id));
  });
});
