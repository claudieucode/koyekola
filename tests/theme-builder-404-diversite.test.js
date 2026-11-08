// Page 404 — bibliothèque de 100 concepts : chaque modèle est un concept distinct, valide, responsive, et il fait de la vraie page introuvable du site un VRAI 404.
// Portes de diversité (docs/theme-builder/404/TEST_PLAN.md §2) : axes déclarés comparés deux à deux ET arbres réellement construits comparés deux à deux.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Catalog = require("../src/themeBuilder/catalog");


const ALL = Catalog.entries("not_found");
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("not_found", key); return { type: "layout", children: b.sections[0].children }; };
const ALLOWED_URL = /^\/(|blog|catalogue|contact|boutique|compte)$/;
const AXES = ["C", "N", "M", "A", "R", "P", "T", "D"], STRUCT = [0, 1, 2, 3, 4, 7];

// Signature d'arbre : types, imbrication, sens des flex, colonnes des grilles — sans valeurs ni identifiants
const sig = (n) => `${n.type}${n.styles && n.styles.desktop && n.styles.desktop.flexDirection === "row" ? "~" : ""}${n.styles && n.styles.desktop && n.styles.desktop.columns ? "#" + n.styles.desktop.columns : ""}${(n.children || []).length ? "(" + n.children.map(sig).join(",") + ")" : ""}`;
// Sac de jetons (type + disposition) pour comparer deux compositions
const bag = (n) => { const m = new Map(); walk(n, (x) => { const d = (x.styles && x.styles.desktop) || {}; const t = `${x.type}|${d.flexDirection || ""}|${d.columns || ""}|${d.alignItems || ""}|${d.justifyContent || ""}`; m.set(t, (m.get(t) || 0) + 1); }); return m; };
const jaccard = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };

describe("Page 404 : catalogue", () => {
  test("exactement 100 modèles, 15 familles toutes représentées", () => { assert.equal(ALL.length, 100); const fam = {}; ALL.forEach((e) => { fam[e.layoutKey] = (fam[e.layoutKey] || 0) + 1; }); assert.equal(Object.keys(fam).length, 15); assert.ok(Math.min(...Object.values(fam)) >= 5 && Math.max(...Object.values(fam)) <= 8, JSON.stringify(fam)); });
  test("métadonnées : codes 404-NNN consécutifs, clés et noms uniques, famille connue, axes complets", () => {
    assert.ok(ALL.length >= 1);
    assert.equal(new Set(ALL.map((e) => e.key)).size, ALL.length, "clés uniques");
    assert.equal(new Set(ALL.map((e) => e.name)).size, ALL.length, "noms uniques");
    ALL.forEach((e, i) => {
      assert.equal(e.code, `404-${String(i + 1).padStart(3, "0")}`, `code de ${e.key}`);
      assert.match(e.key, /^[a-z0-9.-]{3,80}$/, `clé ${e.key}`);
      assert.ok(e.desc && e.desc.length > 20, `description de ${e.key}`);
      assert.ok(e.layoutLabel, `famille de ${e.key}`);
      for (const a of ["C", "N", "P", "T", "D"]) assert.ok(Number.isInteger(e.axes[a]), `${e.key} : axe ${a}`); for (const a of ["M", "A", "R"]) assert.ok(typeof e.axes[a] === "string" && e.axes[a], `${e.key} : axe ${a}`);
    });
  });
  test("densité : l'axe D déclaré correspond au nombre réel d'éléments de contenu (≤ 6 · 7–12 · 13–22 · > 22)", () => {
    const WRAP = new Set(["layout", "container", "stack", "group", "grid", "columns", "column", "root"]);
    for (const e of ALL) { let n = 0; walk(docOf(e.key), (x) => { if (!WRAP.has(x.type)) n += 1; }); const d = n <= 6 ? 1 : n <= 12 ? 2 : n <= 22 ? 3 : 4; assert.equal(e.axes.D, d, `${e.key} : ${n} éléments de contenu → D=${d}`); }
  });
  test("chaque modèle : un seul h1, une action utile, liens vers des pages standard, aucune position absolue/fixe, aucune image factice", () => {
    for (const e of ALL) {
      const doc = docOf(e.key); let h1 = 0, actions = 0; const bad = [];
      walk(doc, (n) => {
        if ((n.type === "heading" && n.props && n.props.level === "1" && n.props.tag !== "p") || (n.type !== "heading" && n.props && (n.props.tag === "h1" || n.props.titleTag === "h1"))) h1 += 1;
        if (["button", "link", "search", "menu"].includes(n.type)) actions += 1;
        if (["button", "link"].includes(n.type) && n.props && !ALLOWED_URL.test(n.props.url || "")) bad.push(n.props.url);
        for (const d of Object.values(n.styles || {})) if (d && (d.position === "absolute" || d.position === "fixed")) bad.push("position:" + d.position);
        if (n.type === "image") bad.push("image");
      });
      assert.equal(h1, 1, `${e.key} : un seul h1`); assert.ok(actions >= 1, `${e.key} : au moins une action`); assert.deepEqual(bad, [], `${e.key}`);
    }
  });
});

describe("Page 404 : portes de diversité", () => {
  test("axes déclarés : pour toute paire, ≥ 5 axes différents sur 8 et ≥ 3 axes structurels sur 6", () => {
    const bad = [];
    for (let i = 0; i < ALL.length; i++) for (let j = i + 1; j < ALL.length; j++) {
      let t = 0, s = 0; AXES.forEach((a, k) => { if (ALL[i].axes[a] !== ALL[j].axes[a]) { t += 1; if (STRUCT.includes(k)) s += 1; } });
      if (t < 5 || s < 3) bad.push(`${ALL[i].key} ≈ ${ALL[j].key} (${t}/8, ${s}/6)`);
    }
    assert.deepEqual(bad, []);
  });
  test("arbres construits : tous différents ; deux compositions ne se ressemblent jamais à plus de 85 % (sac de types et de dispositions)", () => {
    const docs = ALL.map((e) => ({ key: e.key, doc: docOf(e.key) }));
    assert.equal(new Set(docs.map((d) => sig(d.doc))).size, docs.length, "signatures d'arbre toutes distinctes");
    const close = [];
    for (let i = 0; i < docs.length; i++) for (let j = i + 1; j < docs.length; j++) { const s = jaccard(bag(docs[i].doc), bag(docs[j].doc)); if (s > 0.85) close.push(`${docs[i].key} ≈ ${docs[j].key} (${Math.round(s * 100)} %)`); }
    assert.deepEqual(close, []);
  });
  test("aucune valeur d'axe de composition ne domine : au plus 20 % des modèles partagent la même composition (à partir de 10 modèles)", () => {
    if (ALL.length < 10) return;
    const c = {}; ALL.forEach((e) => { c[e.axes.C] = (c[e.axes.C] || 0) + 1; });
    assert.ok(Math.max(...Object.values(c)) <= Math.ceil(ALL.length * 0.2), JSON.stringify(c)); assert.ok(Object.keys(c).length >= 12, `compositions distinctes : ${Object.keys(c).length}`);
  });
});

