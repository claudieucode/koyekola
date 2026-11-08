// Theme Builder · catégorie « Fiche produit » : 100 modèles réellement différents, chacun avec sa propre identité à valeurs fixes, valides, sans donnée inventée.
// Sans serveur : le catalogue lui-même et l'audit scripts/audit-fiche-produit.js (mêmes contrôles).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const Catalog = require("../src/themeBuilder/catalog");
const Audit = require("../scripts/audit-fiche-produit");

const TYPE = "single_product";
const entries = Catalog.entries(TYPE);
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const nodesOf = (doc) => { const out = []; doc.sections.forEach((s) => walk(s, (n) => out.push(n))); return out; };
const audit = Audit.run();
const failsOf = (re) => audit.fails.filter((m) => re.test(m));

describe("Fiche produit · le catalogue", () => {
  test("exactement 100 modèles plats, clés et noms uniques, 10 familles de 10, plus aucune clé de l'ancien catalogue 20 × 5", () => {
    assert.equal(entries.length, 100);
    assert.equal(new Set(entries.map((e) => e.key)).size, 100);
    assert.equal(new Set(entries.map((e) => e.name)).size, 100);
    assert.ok(entries.every((e) => e.type === TYPE && e.name && e.desc && e.tags.length >= 4));
    const by = {}; for (const e of entries) (by[e.layoutKey] = by[e.layoutKey] || []).push(e);
    assert.equal(Object.keys(by).length, 10);
    for (const [f, rows] of Object.entries(by)) assert.equal(rows.length, 10, f);
    for (const old of ["image-gauche.clair", "onglets.nuit", "barre-achat.doux", "vitrine.editorial"]) { assert.equal(Catalog.find(TYPE, old), null, old); assert.equal(Catalog.build(TYPE, old, {}), null); }
    assert.equal(Catalog.stats().find((s) => s.type === TYPE).count, 100);
  });
  test("chaque modèle a sa propre identité : 100 skins, aucun jeton du site, deux polices au plus, polices présentes dans la bibliothèque locale", () => {
    assert.equal(Catalog.list(TYPE, { limit: 60 }).skins.length, 100);
    assert.deepEqual(failsOf(/jeton|token|police|couleur fixe|graisse|latin-400/), []);
    for (const e of entries) assert.ok(!JSON.stringify(Catalog.build(TYPE, e.key, {})).includes("token:"), e.key);
  });
  test("contrastes : texte/fond, texte secondaire, bouton et accent ≥ 4,5 pour les 100 identités", () => assert.deepEqual(failsOf(/contraste/), []));
  test("identités toutes distinctes (palette + polices + forme) et quadruplets d'axes uniques", () => assert.deepEqual(failsOf(/en double/), []));
  test("structures réellement différentes : similarité maximale entre deux modèles ≤ 0,70", () => { assert.ok(audit.max <= Audit.MAX_JACCARD, `max ${audit.max}`); assert.deepEqual(failsOf(/similarité/), []); });
  test("construction sans exception, grammaire du Page Builder respectée, grilles repliables, aucune largeur fixe ni !important", () => assert.deepEqual(failsOf(/construction|grammaire|grille|largeur|important|build\(\)/), []));
  test("aucune donnée inventée : pas de prix en dur, d'adresse externe ni d'image factice", () => assert.deepEqual(failsOf(/prix|externe/), []));
  test("widgets boutique : chacun porte ses parties colorées (bouton d'achat compris) quel que soit le thème du site", () => {
    assert.deepEqual(failsOf(/parties|partie bouton/), []);
    let buys = 0;
    for (const e of entries) for (const n of nodesOf(Catalog.build(TYPE, e.key, {}))) if (n.type === "shopbuy") { buys++; const d = n.parts.button.styles.desktop; assert.match(d.backgroundColor, /^#/); assert.match(d.color, /^#/); assert.ok(n.parts.now && n.parts.choice, e.key); }
    // seul « Catalogue sans achat » (j08, demande de devis) n'a volontairement aucun bouton d'achat
    assert.equal(buys >= 99, true);
    assert.ok(!nodesOf(Catalog.build(TYPE, "j08.j08", {})).some((n) => n.type === "shopbuy"));
  });
  test("les 8 galeries, les modes d'achat et les contenus des axes existent réellement dans les arbres", () => {
    const g = new Set(), seen = { bar: 0, sticky: 0, tabs: 0, accordion: 0, specs: 0, reviews: 0, related: 0 };
    for (const e of entries) for (const n of nodesOf(Catalog.build(TYPE, e.key, {}))) {
      if (n.type === "shopgallery") g.add(n.props.layout);
      if (n.type === "tabs") seen.tabs++; if (n.type === "accordion") seen.accordion++; if (n.type === "shopspecs") seen.specs++; if (n.type === "shopreviews") seen.reviews++;
      if (n.type === "shopgrid" && n.props.source === "related") seen.related++;
      if (n.styles && n.styles.desktop && n.styles.desktop.position === "sticky") { seen.sticky++; if (n.styles.desktop.bottom === "0px") seen.bar++; }
    }
    assert.deepEqual([...g].sort(), ["carousel", "grid", "hero", "mosaic", "single", "stack", "thumbs-bottom", "thumbs-left"]);
    for (const [k, v] of Object.entries(seen)) assert.ok(v > 0, k);
  });
  test("l'audit complet ne signale aucun échec", () => assert.deepEqual(audit.fails, []));
});
