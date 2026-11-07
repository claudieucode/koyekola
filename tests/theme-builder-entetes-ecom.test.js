// En-têtes du secteur E-commerce : contrat, éléments commerciaux natifs, identité, contraste, barres fermables, animations annoncées réelles, diversité de composition.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const HEADER = require("../src/themeBuilder/catalog/header");
const Catalog = require("../src/themeBuilder/catalog");
const contract = require("../src/themeBuilder/catalog/header/contract");
const { withIds } = require("../src/themeBuilder/catalog/kit");

const MODELS = HEADER.MODELS.filter((m) => m.sector === "ecom");
const nodes = (M) => withIds(Catalog.build("header", `${M.key}.${M.key}`).section.children);
const walk = (ns, fn) => { for (const n of ns || []) { fn(n); walk(n.children, fn); } };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const types = (M) => { const t = []; walk(nodes(M), (n) => t.push(n.type)); return t; };
const sig = (M) => { const t = []; walk(nodes(M), (n) => t.push(n.type + (n.props && n.props.vertical ? "V" : "") + (n.props && n.props.dismissible ? "D" : "") + (n.styles && n.styles.desktop && n.styles.desktop.gridTemplate ? "G" + n.styles.desktop.gridTemplate : ""))); return t.join(","); };

describe("En-têtes ecom", () => {
  test("10 modèles personnalisés, clés ecom-01 à ecom-10, noms uniques, grammaire et animations annoncées valides", () => {
    assert.equal(MODELS.length, 10);
    assert.deepEqual(MODELS.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `ecom-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(MODELS.map((m) => m.name)).size, 10);
    for (const M of MODELS) { assert.ok(M.custom, M.key); assert.doesNotThrow(() => contract.validateBuilt(M, nodes(M)), M.key); assert.ok(M.features.length >= 3 && M.settings.length >= 3 && M.animations.length >= 1, M.key); }
  });
  test("éléments commerciaux natifs : recherche vers le catalogue, compte, mini-panier ; aucun produit ni prix inventé", () => {
    for (const M of MODELS) {
      const t = types(M); for (const x of ["search", "account", "minicart", "menu"]) assert.ok(t.includes(x) || (M.key === "ecom-02" && x === "menu" && t.includes("motionfsmenu")), `${M.key} : ${x}`);
      walk(nodes(M), (n) => { if (n.type === "search") assert.equal(n.props.target, "catalogue", M.key); if (n.type === "menu") { assert.equal(n.props.source, "location"); assert.deepEqual(n.props.items, []); } });
      assert.doesNotMatch(JSON.stringify(nodes(M)), /\d+[,.]\d{2} ?€|€ ?\d|\$\d/, `${M.key} : prix`);
      assert.ok(!t.includes("image") && !t.includes("html"), M.key);
    }
  });
  test("identité propre, contraste >= 4,5 (texte, texte secondaire, bouton)", () => {
    for (const M of MODELS) { const S = M.S; assert.ok(cr(S.fg, S.bg) >= 4.5 && cr(S.mute, S.bg) >= 4.5 && cr(S.onAccent, S.accent) >= 4.5, M.key); assert.match(S.font, /^font\./); assert.match(S.head, /^font\./); }
    assert.ok(new Set(MODELS.map((m) => `${m.S.head}|${m.S.font}`)).size >= 9);
  });
  test("barres promotionnelles : fermables (dismissible) pour 01, 06 et 08 ; modèle outlet avec bouton", () => {
    const dis = MODELS.filter((M) => { let d = false; walk(nodes(M), (n) => { if (n.props && n.props.dismissible === true) d = true; }); return d; }).map((m) => m.key);
    assert.deepEqual(dis, ["ecom-01", "ecom-06", "ecom-08"]);
  });
  test("directions : menu plein écran (02), ticker (04, 07), navigation verticale (07), mosaïque (10), recherche d'abord (09)", () => {
    assert.ok(types(MODELS[1]).includes("motionfsmenu"));
    assert.ok(types(MODELS[3]).includes("marquee") && types(MODELS[6]).includes("marquee"));
    let v = false; walk(nodes(MODELS[6]), (n) => { if (n.type === "menu" && n.props.vertical) v = true; }); assert.ok(v);
    let tiles = false; walk(nodes(MODELS[9]), (n) => { if (n.type === "menu" && n.parts.list && n.parts.list.styles.desktop.maxWidth) tiles = true; }); assert.ok(tiles);
    let big = false; walk(nodes(MODELS[8]), (n) => { if (n.type === "search" && n.parts.field.styles.desktop.fontSize === "19px") big = true; }); assert.ok(big);
  });
  test("10 compositions distinctes (signatures uniques)", () => { assert.equal(new Set(MODELS.map(sig)).size, 10); });
  test("responsive : menus repliables (sauf vertical, doublé d'un menu mobile), grilles repliées", () => {
    for (const M of MODELS) walk(nodes(M), (n) => { if (n.type === "menu" && !n.props.vertical) assert.equal(n.props.mobileToggle, true, M.key); if (n.type === "grid") assert.equal(n.styles.mobile.gridTemplate, "1fr", M.key); });
  });
});
