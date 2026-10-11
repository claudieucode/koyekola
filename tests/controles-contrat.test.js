// Contrat des propriétés de style (STYLE_PROPS / STYLE_UI / editorSpec) : la source de vérité qui fabrique les contrôles de l'inspecteur.
// Rapide (sans navigateur) : chaque propriété est éprouvée avec des valeurs valides, invalides et hostiles.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const nodes = require("../src/marketing/pages/nodes");

const { STYLE_PROPS, STYLE_UI } = nodes;
const spec = nodes.editorSpec();
const css = (p, v) => (p.out ? p.out(v) : v);

describe("contrat des propriétés de style", () => {
  test("chaque propriété a un libellé, un groupe connu, une propriété CSS et un type de contrôle cohérent", () => {
    const groups = new Set(Object.keys(spec.groups));
    for (const p of spec.styleProps) {
      assert.ok(STYLE_UI[p.key] && STYLE_UI[p.key][0], `${p.key} : pas de libellé`);
      assert.ok(groups.has(p.group), `${p.key} : groupe « ${p.group} » inconnu`);
      assert.match(p.css, /^-?[a-z][a-z-]*$/, `${p.key} : propriété CSS invalide`);
      assert.equal(p.kind === "enum", Boolean(p.options), `${p.key} : « enum » si et seulement si une liste d'options existe`);
    }
  });

  test("toute option proposée par une liste est acceptée par le serveur (aucune option qui semble fonctionner sans l'être)", () => {
    for (const p of spec.styleProps) for (const [v] of p.options || []) assert.notEqual(STYLE_PROPS[p.key].check(v), null, `${p.key} : l'option « ${v} » est refusée`);
  });

  test("les validateurs sont idempotents et ne produisent jamais NaN / undefined / null dans le CSS", () => {
    const samples = ["0", "1", "2", "0.5", "10px", "1.5rem", "50%", "-5px", "auto", "10vh", "2em", "fit-content", "token:space-md", "token:primary", "#fff", "#aabbcc80", "transparent", "2fr 1fr", "center", "400", "ease"];
    for (const [k, p] of Object.entries(STYLE_PROPS)) for (const s of samples) {
      const r = p.check(s);
      if (r === null) continue;
      assert.equal(String(p.check(r)), String(r), `${k} : check(${s}) n'est pas idempotent`);
      assert.doesNotMatch(String(css(p, r)), /undefined|NaN|null|\[object/, `${k} : sortie CSS douteuse pour ${s}`);
    }
  });

  test("valeurs invalides ou hostiles : refusées sans exception, jamais d'injection CSS", () => {
    const bad = ["abc", "NaN", "Infinity", "1e9", "99999px", "10 px", "10pt", ";color:red", "10px;color:red", "}body{", "url(javascript:1)", "expression(1)", "--x", "calc(1px + 2px)", "<script>", "\\", "10px !important"];
    for (const [k, p] of Object.entries(STYLE_PROPS)) for (const b of bad) {
      let r;
      assert.doesNotThrow(() => { r = p.check(b); }, `${k} : check lève une exception sur « ${b} »`);
      if (r !== null) assert.doesNotMatch(String(css(p, r)), /[;{}<>\\]|url\(|expression|!important/i, `${k} : « ${b} » ouvre une injection`);
    }
  });

  test("toute propriété qui accepte une couleur du site (token:…) la convertit en variable CSS : la référence est conservée à l'affichage", () => {
    for (const [k, p] of Object.entries(STYLE_PROPS)) {
      const r = p.check("token:primary");
      if (r === null) continue;
      assert.equal(css(p, r), "var(--kw-primary)", `${k} : « token:primary » n'est pas converti en var(--kw-primary)`);
    }
  });

  test("toute propriété qui accepte une valeur du site de longueur (token:space-…) la convertit en var() avec repli", () => {
    for (const [k, p] of Object.entries(STYLE_PROPS)) {
      const r = p.check("token:space-md");
      if (r === null) continue;
      assert.match(String(css(p, r)), /^var\(--kw-space-md, \d+px\)$/, `${k} : jeton de longueur mal converti`);
    }
  });

  test("bornes : chaque nombre refuse ce qui dépasse sa plage et ne tronque jamais silencieusement", () => {
    const cases = { opacity: [0, 1], lineHeight: [0.8, 3], zIndex: [-100, 9999], order: [-20, 20], columns: [1, 12], flexGrow: [0, 20], transitionDuration: [0, 2000], backdropBlur: [1, 40], columnCount: [1, 6], lineClamp: [1, 10] };
    for (const [k, [min, max]] of Object.entries(cases)) {
      const p = STYLE_PROPS[k];
      assert.notEqual(p.check(String(min)), null, `${k} : le minimum ${min} doit être accepté`);
      assert.notEqual(p.check(String(max)), null, `${k} : le maximum ${max} doit être accepté`);
      assert.equal(p.check(String(max + 1)), null, `${k} : ${max + 1} doit être refusé`);
      assert.equal(p.check(String(min - 1)), null, `${k} : ${min - 1} doit être refusé`);
    }
  });
});

// ---------- Tables de l'interface (public/js/page-builder.js) rapprochées du serveur ----------
// Le client est un script de navigateur (pas un module) : ses tables de configuration sont lues dans le texte du fichier, puis évaluées.
describe("contrat entre l'interface (page-builder.js) et le serveur", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "js", "page-builder.js"), "utf8");
  // Extrait l'objet littéral `var NOM = { … };` en comptant les accolades (les tables tiennent sur une ou plusieurs lignes)
  const table = (name) => {
    const at = source.indexOf(`var ${name} = {`);
    assert.ok(at >= 0, `table « ${name} » introuvable dans page-builder.js : le test doit suivre le code`);
    let depth = 0, i = source.indexOf("{", at);
    const start = i;
    for (; i < source.length; i++) { if (source[i] === "{") depth++; else if (source[i] === "}" && --depth === 0) break; }
    return (0, eval)(`(${source.slice(start, i + 1)})`);
  };
  const NUM = table("NUM");
  const NUMCFG = table("NUMCFG");
  const UNITS = table("UNITS");
  for (const side of ["Top", "Right", "Bottom", "Left"]) { UNITS[`margin${side}`] = ["px", "%", "rem", "em", "auto"]; UNITS[`padding${side}`] = ["px", "%", "rem", "em"]; }
  const KEYWORDS = new Set(["auto", "fit-content", "min-content", "max-content"]);

  test("chaque nombre sans unité a, côté interface, EXACTEMENT les bornes et le caractère entier du serveur", () => {
    for (const p of spec.styleProps.filter((x) => x.kind === "number")) {
      const entry = NUM[p.key];
      assert.ok(entry, `${p.key} : aucune borne côté interface (le champ accepterait n'importe quoi que le serveur refuse)`);
      const [min, max, step] = entry, srv = STYLE_PROPS[p.key];
      assert.notEqual(srv.check(String(min)), null, `${p.key} : minimum ${min} refusé par le serveur`);
      assert.notEqual(srv.check(String(max)), null, `${p.key} : maximum ${max} refusé par le serveur`);
      assert.equal(srv.check(String(max + step)), null, `${p.key} : l'interface s'arrête à ${max} alors que le serveur accepte plus`);
      assert.equal(srv.check(String(Math.round((min - step) * 1000) / 1000)), null, `${p.key} : l'interface s'arrête à ${min} alors que le serveur accepte moins`);
      const serverWantsInteger = srv.check(String(min + 0.5)) === null && max - min > 1;
      assert.equal(Boolean((NUMCFG[p.key] || {}).integer), serverWantsInteger, `${p.key} : entier côté interface ≠ entier côté serveur`);
    }
  });

  test("toute unité proposée par un menu d'unités est acceptée par le serveur pour cette propriété", () => {
    for (const p of spec.styleProps.filter((x) => x.kind === "length")) {
      for (const u of UNITS[p.key] || ["px", "%", "rem", "em"]) {
        const sample = KEYWORDS.has(u) ? u : `1${u}`;
        assert.notEqual(STYLE_PROPS[p.key].check(sample), null, `${p.key} : l'unité « ${u} » est proposée mais refusée par le serveur`);
      }
    }
  });
});
