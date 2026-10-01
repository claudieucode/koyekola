// Marketing M1f (2/3, partie 1) — catalogue des champs proposés par l'éditeur de segments.
// Invariant : tout ce que l'interface propose est accepté par le moteur (sinon l'utilisateur tomberait sur des erreurs).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const segments = require("../src/marketing/segments");
const { fieldCatalog, sampleValue } = require("../src/marketing/segments/catalog");

let m, A;
beforeEach(() => {
  m = freshMarketing(); A = m.A;
  audience.defineProperty(A, { key: "niveau", label: "Niveau", type: "select", options: ["débutant", "confirmé"] });
  audience.defineProperty(A, { key: "age", label: "Âge", type: "number" });
  audience.defineProperty(A, { key: "naissance", label: "Naissance", type: "date" });
  audience.defineProperty(A, { key: "etudiant", label: "Étudiant", type: "boolean" });
  audience.defineProperty(A, { key: "ville", label: "Ville", type: "text" });
  audience.createList(A, { name: "Newsletter" });
});

describe("catalogue", () => {
  test("contient les champs standard, les propriétés de l'organisation, avec libellés français", () => {
    const cat = fieldCatalog(A);
    const byField = Object.fromEntries(cat.map((f) => [f.field, f]));
    for (const f of ["email", "first_name", "status", "created_at", "last_open_at", "tag", "list", "property:niveau", "property:age"]) assert.ok(byField[f], f);
    assert.equal(byField["email"].label, "E-mail");
    assert.equal(byField["property:niveau"].label, "Niveau");
    assert.deepEqual(byField["property:niveau"].options, ["débutant", "confirmé"]);
  });
  test("chaque comparateur porte un libellé et un type de valeur", () => {
    for (const f of fieldCatalog(A)) {
      assert.ok(f.cmps.length, f.field);
      for (const c of f.cmps) {
        assert.ok(c.label && c.label !== c.cmp && !c.label.includes("_"), `${f.field}.${c.cmp} sans libellé français`);
        assert.ok(["none", "text", "textlist", "date", "days", "number", "range", "status", "select", "list"].includes(c.value), `${f.field}.${c.cmp}: ${c.value}`);
      }
    }
  });
  test("INVARIANT : chaque (champ, comparateur) proposé, avec une valeur plausible, est accepté par le moteur", () => {
    const cat = fieldCatalog(A);
    let n = 0;
    for (const f of cat) {
      for (const c of f.cmps) {
        const rule = { field: f.field, cmp: c.cmp, ...(c.value === "none" ? {} : { value: sampleValue(f, c, A) }) };
        assert.doesNotThrow(() => segments.validateDefinition(A, { op: "and", rules: [rule] }), `${f.field} ${c.cmp}`);
        segments.countSegment(A, { op: "and", rules: [rule] });
        n++;
      }
    }
    assert.ok(n > 60, `seulement ${n} combinaisons vérifiées`);
  });
  test("le catalogue suit les propriétés créées après coup", () => {
    audience.defineProperty(A, { key: "pays_origine", label: "Pays d'origine", type: "text" });
    assert.ok(fieldCatalog(A).some((f) => f.field === "property:pays_origine"));
  });
  test("le catalogue n'expose aucun champ sensible ni d'autre organisation", () => {
    audience.defineProperty(m.B, { key: "secretb", label: "Secret B", type: "text" });
    const fields = fieldCatalog(A).map((f) => f.field);
    assert.ok(!fields.includes("property:secretb"));
    assert.ok(!fields.some((f) => /password|token|ip/.test(f)));
  });
});
