// Couverture des widgets par le système de parties : chaque type du registre déclare ses parties OU figure (justifié) parmi les widgets à racine seule.
// Un futur widget qui n'est dans aucune des deux listes fait échouer ce test : il ne peut pas être ajouté sans décision explicite.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const n = require("../src/marketing/pages/nodes");
const { PARTS, ROOT_ONLY } = require("../src/marketing/pages/parts");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const norm = (raw) => n.normalizeNode(raw, "test", H, 1, { n: 0, ids: new Set() });
const types = Object.keys(n.NODE_TYPES);
const PROBES = [["fontSize", "19px"], ["color", "#123456"], ["borderRadius", "9px"], ["opacity", "0.9"], ["width", "123px"], ["gap", "7px"], ["paddingTop", "11px"], ["backgroundColor", "#abcdef"]];

describe("couverture des parties stylables", () => {
  test("chaque type du registre a des parties ou une justification « racine seule »", () => {
    const orphan = types.filter((t) => !PARTS[t] && !ROOT_ONLY[t]);
    assert.deepEqual(orphan, [], `widgets sans parties ni justification : ${orphan.join(", ")}`);
  });
  test("aucun type n'est à la fois couvert et déclaré « racine seule » ; aucune entrée ne vise un type inconnu", () => {
    for (const t of Object.keys(ROOT_ONLY)) { assert.ok(n.NODE_TYPES[t], `type inconnu : ${t}`); assert.ok(!PARTS[t], `${t} est dans les deux listes`); assert.ok(ROOT_ONLY[t].length > 8, `${t} : justification vide`); }
    for (const t of Object.keys(PARTS)) assert.ok(n.NODE_TYPES[t], `type inconnu : ${t}`);
  });
  test("générique : pour chaque partie de chaque widget, un réglage par écran et par état est validé, enregistré, relu (import/export, duplication) et écrit dans le CSS", () => {
    let checked = 0, withoutContent = 0;
    for (const [type, defs] of Object.entries(PARTS)) {
      const b = n.PALETTE[type].blank();
      for (const [key, def] of Object.entries(defs)) {
        // premier réglage d'essai réellement proposé par la partie (selon ses groupes) : la validation écarte les autres
        let node = null, style = null, rejected = false;
        for (const [k, v] of PROBES) {
          const raw = { id: "cov000000001", type, props: b.props || {}, ...(n.NODE_TYPES[type].container ? { children: [] } : {}), parts: { [key]: { styles: { desktop: { [k]: v }, mobile: { [k]: v } } } } };
          let got;
          try { got = norm(raw); }
          catch (e) { if (!/ : |\./.test(e.message) || /undefined|TypeError|Cannot read/i.test(e.message)) assert.fail(`${type}.${key} : ${e.message}`); rejected = true; break; }
          if (got.parts && got.parts[key]) { node = got; style = { [k]: v }; break; }
        }
        if (rejected) { withoutContent++; continue; }                     // contenu de départ refusé (média, adresse… à fournir) : couvert par les tests de rendu navigateur
        assert.ok(node, `${type}.${key} : aucun réglage d'essai accepté par la partie`);
        const copy = norm(JSON.parse(JSON.stringify(node)));               // export puis import / duplication
        assert.deepEqual(copy.parts, node.parts, `${type}.${key} : perdue à l'aller-retour`);
        const css = n.pageCss([{ id: "sect00000001", type: "layout", children: [node] }]);
        assert.ok(css.includes(`.kw-node.kw-n-cov000000001 ${def.select}{`), `${type}.${key} : règle absente du CSS`);
        assert.ok(css.includes("@media"), `${type}.${key} : règle mobile absente`);
        checked++;
      }
    }
    assert.ok(checked > 150, `trop peu de parties vérifiées : ${checked}`);
    assert.ok(withoutContent < checked / 4, `trop de widgets sans contenu de départ valide : ${withoutContent}`);
  });
});
