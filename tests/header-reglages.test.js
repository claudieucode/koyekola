// Header Builder, lot L0 : réglages d'en-tête (section.header) — validation, compatibilité avec l'ancien format, passage par le normaliseur de sections.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const hs = require("../src/marketing/pages/headerSettings");
const { TYPES } = require("../src/marketing/pages/sections");

const legacy = (pos, fx) => ({ type: "layout", children: [{ id: "a", type: "container", styles: { desktop: pos ? { position: pos } : {} }, props: fx ? { headerFx: fx } : {}, children: [] }] });

describe("Réglages d'en-tête : validation", () => {
  test("valeurs inconnues ignorées, bornes appliquées, listes fermées", () => {
    const n = hs.normalize({ mode: "zzz", fx: "bling", offset: 9999, threshold: -5, zIndex: 500, stickOn: ["x"], shrink: { height: 1 }, hideOnScroll: { enabled: "true", tolerance: 999 } });
    assert.equal(n.mode, "static"); assert.equal(n.fx, ""); assert.equal(n.offset, 200); assert.equal(n.threshold, 0); assert.equal(n.zIndex, 100);
    assert.deepEqual(n.stickOn, ["desktop", "tablet", "mobile"]); assert.equal(n.shrink.height, 24); assert.deepEqual(n.hideOnScroll, { enabled: true, tolerance: 100 });
  });
  test("un en-tête ordinaire n'a jamais d'effet de défilement", () => { assert.equal(hs.normalize({ mode: "static", fx: "shrink" }).fx, ""); });
  test("valeurs non numériques ou non objet : valeurs par défaut, jamais d'exception", () => {
    assert.equal(hs.normalize("x"), null); assert.equal(hs.normalize([]), null); assert.equal(hs.normalize(null), null);
    assert.equal(hs.normalize({ mode: "sticky", offset: "abc", threshold: {} }).offset, 0);
    assert.deepEqual(hs.normalize({ mode: "sticky", stickOn: ["tablet", "tablet", "mobile"] }).stickOn, ["tablet", "mobile"]);
  });
  test("aucun champ libre : seules les clés du schéma ressortent", () => {
    const n = hs.normalize({ mode: "sticky", html: "<script>", css: "x{}", onclick: "evil()" });
    assert.deepEqual(Object.keys(n).sort(), ["fx", "hideOnScroll", "mode", "offset", "shrink", "stickOn", "threshold", "v", "zIndex"]);
  });
});

describe("Réglages d'en-tête : lecture", () => {
  test("ancien format identique : collant, superposé, ordinaire, avec effet", () => {
    assert.equal(hs.classes(legacy("sticky", "")), " kw-theme-sticky");
    assert.equal(hs.classes(legacy("absolute", "")), " kw-theme-overlay");
    assert.equal(hs.classes(legacy("", "shrink")), "");
    assert.equal(hs.classes(legacy("sticky", "shrink")), " kw-theme-sticky kw-theme-fx-shrink");
    assert.deepEqual(hs.dataAttrs(legacy("sticky", "both")), { "data-kw-scroll": "both" });
    assert.deepEqual(hs.dataAttrs(legacy("sticky", "")), {});
  });
  test("le bloc header l'emporte sur le premier enfant ; déplacer ou retirer le premier enfant ne change plus rien", () => {
    const s = { ...legacy("sticky", "shrink"), header: { mode: "overlay", fx: "solid", threshold: 40 } };
    assert.equal(hs.classes(s), " kw-theme-overlay kw-theme-fx-solid");
    assert.deepEqual(hs.dataAttrs(s), { "data-kw-scroll": "solid", "data-kw-threshold": "40" });
    assert.equal(hs.classes({ type: "layout", header: { mode: "sticky" }, children: [] }), " kw-theme-sticky");
  });
  test("section absente ou invalide : en-tête ordinaire", () => { assert.equal(hs.classes(null), ""); assert.equal(hs.classes({}), ""); assert.equal(hs.resolve(undefined).mode, "static"); });
});

describe("Réglages d'en-tête : normaliseur de sections", () => {
  const norm = (raw) => TYPES.layout.normalize({}, raw, "section 1", { n: 0, ids: new Set() });
  test("le bloc header est conservé, validé et ne contient que le schéma", () => {
    const out = norm({ type: "layout", header: { mode: "sticky", fx: "both", offset: 12, evil: "x" }, children: [] });
    assert.equal(out.header.mode, "sticky"); assert.equal(out.header.offset, 12); assert.equal("evil" in out.header, false);
  });
  test("sans bloc header : la section reste comme avant (aucune clé ajoutée)", () => {
    const out = norm({ type: "layout", children: [] }); assert.equal("header" in out, false);
  });
  test("un bloc invalide est ignoré sans erreur", () => { assert.equal("header" in norm({ type: "layout", header: "x", children: [] }), false); });
});
