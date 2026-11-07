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
    assert.deepEqual(hs.dataAttrs(legacy("sticky", "")), { "data-kw-scroll": "watch" }, "un en-tête collé suit l'état défilé (styles par état)");
    assert.deepEqual(hs.dataAttrs(legacy("", "")), {}, "un en-tête ordinaire n'a aucun attribut");
  });
  test("réglage existant « hide » (masquer en descendant) : conservé à l'identique dans l'ancien format, converti en masquage réglable dans le bloc header", () => {
    assert.equal(hs.classes(legacy("sticky", "hide")), " kw-theme-sticky kw-theme-fx-hide");
    assert.deepEqual(hs.dataAttrs(legacy("sticky", "hide")), { "data-kw-scroll": "hide" });
    const n = hs.normalize({ mode: "sticky", fx: "hide" }); assert.equal(n.fx, ""); assert.deepEqual(n.hideOnScroll, { enabled: true, tolerance: 6 });
  });
  test("logo ou titre alternatif au défilement (réglage existant) : l'état défilé est suivi (« track »)", () => {
    const sec = { type: "layout", children: [{ id: "a", type: "container", styles: { desktop: { position: "sticky" } }, props: {}, children: [{ id: "l", type: "sitelogo", props: { scrollText: "K" } }] }] };
    assert.deepEqual(hs.dataAttrs(sec), { "data-kw-scroll": "track" }); assert.deepEqual(hs.dataAttrs({ type: "layout", children: [{ id: "a", type: "container", styles: { desktop: { position: "sticky" } }, props: {}, children: [] }] }), { "data-kw-scroll": "watch" });
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

describe("Réglages d'en-tête : fixé, appareils, décalage, masquage", () => {
  test("fixé : classe dédiée ; collé sur certains appareils : classes kw-hdr-no-<appareil> pour les autres", () => {
    assert.equal(hs.classes({ header: { mode: "fixed" }, children: [] }), " kw-theme-fixed");
    assert.equal(hs.classes({ header: { mode: "sticky", stickOn: ["desktop"] }, children: [] }), " kw-theme-sticky kw-hdr-no-tablet kw-hdr-no-mobile");
    assert.equal(hs.classes({ header: { mode: "overlay", stickOn: ["desktop"] }, children: [] }), " kw-theme-overlay", "la superposition n'est pas concernée par « coller sur »");
    assert.equal(hs.classes({ header: { mode: "static", stickOn: ["desktop"] }, children: [] }), "");
  });
  test("attributs publics : seuil, masquage, variables CSS (nombres bornés uniquement)", () => {
    const a = hs.dataAttrs({ header: { mode: "sticky", fx: "shrink", threshold: 30, offset: 24, zIndex: 77, shrink: { height: 40 }, hideOnScroll: { enabled: true, tolerance: 12 } }, children: [] });
    assert.deepEqual(a, { "data-kw-scroll": "shrink", "data-kw-threshold": "30", "data-kw-hide": "1", "data-kw-hide-tol": "12", style: "--kw-hdr-top:24px;--kw-hdr-z:77;--kw-hdr-shrink:40px" });
    const evil = hs.dataAttrs({ header: { mode: "sticky", offset: "1px;background:url(x)", zIndex: "9;x" }, children: [] });
    assert.ok(!evil.style, "aucune valeur non numérique ne passe dans le style");
  });
  test("masquage impossible sur un en-tête ordinaire", () => { assert.deepEqual(hs.dataAttrs({ header: { mode: "static", hideOnScroll: { enabled: true } }, children: [] }), {}); });
});

describe("État de style « Après défilement » (grammaire)", () => {
  const nodes = require("../src/marketing/pages/nodes");
  test("l'état existe, son sélecteur vise l'en-tête défilé", () => {
    const st = nodes.STATES.find((x) => x.key === "scrolled"); assert.ok(st); assert.equal(st.pre, ".lp-site-header.is-scrolled");
  });
  test("le CSS généré préfixe la règle par l'en-tête défilé ; survol, focus et clic sont inchangés", () => {
    const sec = { id: "s1", type: "layout", children: [{ id: "nodeaa1", type: "container", props: {}, styles: { desktop: { backgroundColor: "#ffffff" } }, states: { scrolled: { backgroundColor: "#ff0000" }, hover: { backgroundColor: "#00ff00" } }, children: [] }] };
    const css = nodes.pageCss([sec]);
    assert.match(css, /\.lp-site-header\.is-scrolled \.kw-n-nodeaa1\{[^}]*#ff0000/i);
    assert.match(css, /\.kw-n-nodeaa1:hover\{[^}]*#00ff00/i);
  });
  test("état « Menu ouvert » : règle préfixée par l'en-tête dont le menu est ouvert", () => {
    const sec = { id: "s2", type: "layout", children: [{ id: "nodebb2", type: "container", props: {}, styles: {}, states: { menuOpen: { backgroundColor: "#0000ff" } }, children: [] }] };
    assert.match(nodes.pageCss([sec]), /\.lp-site-header\.is-menu-open \.kw-n-nodebb2\{[^}]*#0000ff/i);
  });
});
