// Propriétés de style ajoutées (retour à la ligne, curseur, contour, fusion, débordement par axe, pistes de grille automatiques…) :
// validation, enregistrement, publication (ordinateur, tablette, mobile, survol), refus des valeurs invalides, et épaisseurs sans pourcentage.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const n = require("../src/marketing/pages/nodes.js");

const H = new Proxy({}, { get: () => (x) => x });
const NEW = {
  whiteSpace: ["nowrap", "white-space:nowrap"], textWrap: ["balance", "text-wrap:balance"], overflowWrap: ["anywhere", "overflow-wrap:anywhere"], textOverflow: ["ellipsis", "text-overflow:ellipsis"],
  visibility: ["hidden", "visibility:hidden"], cursor: ["pointer", "cursor:pointer"], pointerEvents: ["none", "pointer-events:none"], mixBlendMode: ["multiply", "mix-blend-mode:multiply"],
  overflowX: ["auto", "overflow-x:auto"], overflowY: ["hidden", "overflow-y:hidden"],
  outlineWidth: ["2px", "outline-width:2px"], outlineStyle: ["dashed", "outline-style:dashed"], outlineColor: ["#336699", "outline-color:"], outlineOffset: ["4px", "outline-offset:4px"],
  gridAutoRows: ["120px", "grid-auto-rows:120px"], gridAutoColumns: ["1fr", "grid-auto-columns:"],
};
const css = (styles, states) => n.pageCss([{ type: "layout", children: [n.normalizeNode({ id: "aaaaaaaaaaaa", type: "container", children: [], styles, states }, "x", H, 1, { n: 0, ids: new Set() })] }], { tablet: 1023, mobile: 767 });

describe("propriétés de style complétées", () => {
  test("les 16 nouvelles propriétés sont dans le registre et décrites pour l'éditeur (étiquette + type de contrôle)", () => {
    const spec = n.editorSpec().styleProps; const by = Object.fromEntries(spec.map((p) => [p.key, p]));
    for (const k of Object.keys(NEW)) { assert.ok(n.STYLE_PROPS[k], `${k} : registre`); assert.ok(by[k] && by[k].label, `${k} : étiquette`); assert.ok(["enum", "color", "length", "text", "number"].includes(by[k].kind), `${k} : contrôle ${by[k].kind}`); }
    assert.equal(Object.keys(n.STYLE_PROPS).length, 110); // 104 + contour du texte (2) + colonnes de texte (1) + sens d'écriture, découpe du fond, décalage d'ancre (3)
  });
  test("chaque propriété : valeur acceptée, publiée sur ordinateur, tablette, mobile et au survol", () => {
    for (const [k, [v, decl]] of Object.entries(NEW)) {
      const out = css({ desktop: { [k]: v }, tablet: { [k]: v }, mobile: { [k]: v } }, { hover: { [k]: v } });
      const base = out.split("@media")[0];
      assert.ok(base.includes(decl), `${k} : ordinateur (${decl})`);
      assert.ok(/@media \(max-width: 1023px\)\{[^}]*\}/.test(out) && out.split("@media (max-width: 1023px)")[1].split("@media")[0].includes(decl.split(":")[0] + ":"), `${k} : tablette`);
      assert.ok(out.split("@media (max-width: 767px)")[1].includes(decl.split(":")[0] + ":"), `${k} : mobile`);
      assert.match(out, new RegExp(":hover\\{[^}]*" + decl.split(":")[0].replace(/-/g, "\\-") + ":"), `${k} : survol`);
    }
  });
  test("valeurs invalides refusées (aucune publication silencieuse d'un CSS faux)", () => {
    for (const [k, bad] of [["whiteSpace", "n'importe-quoi"], ["cursor", "url(x)"], ["mixBlendMode", "bleu"], ["overflowX", "10px"], ["outlineStyle", "ridge"], ["outlineColor", "pas-une-couleur"], ["gridAutoRows", "calc(1px+2px)"], ["textOverflow", "fade"]]) {
      assert.throws(() => css({ desktop: { [k]: bad } }), /valeur invalide/, `${k} = ${bad}`);
    }
  });
  test("les épaisseurs de bordure et de contour refusent le pourcentage (CSS invalide) mais gardent px, rem, em", () => {
    for (const k of ["borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "outlineWidth"]) {
      assert.throws(() => css({ desktop: { [k]: "10%" } }), /valeur invalide/, `${k} en %`);
      for (const ok of ["2px", "0.1rem", "0.2em", "0"]) assert.doesNotThrow(() => css({ desktop: { [k]: ok } }), `${k} = ${ok}`);
    }
  });
  test("« overflow » puis les axes : les axes sont écrits après (ils l'emportent), et les propriétés existantes sont inchangées", () => {
    const out = css({ desktop: { overflowX: "scroll", overflow: "hidden", borderWidth: "1px", gap: "12px" } });
    assert.ok(out.indexOf("overflow:hidden") < out.indexOf("overflow-x:scroll"), "axes après overflow");
    assert.ok(out.includes("border-width:1px") && out.includes("gap:12px"));
  });
});
