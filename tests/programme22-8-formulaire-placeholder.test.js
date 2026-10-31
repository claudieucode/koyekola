// Parité Elementor (lot 3) : texte indicatif (placeholder) par champ de formulaire — normalisation et rendu public échappé.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const ejs = require("ejs");
const fields = require("../src/marketing/forms/fields");

const form = { fields: ["first_name", "country"] };
const defs = [{ name: "prop_logiciel", type: "select", options: ["A", "B"], label: "Logiciel" }, { name: "prop_niveau", type: "text", label: "Niveau" }, { name: "prop_age", type: "number", label: "Âge" }, { name: "prop_jour", type: "date", label: "Jour" }];

test("le texte indicatif est nettoyé, borné, et réservé aux champs de saisie libre", () => {
  const s = fields.normalizeFieldSettings({
    first_name: { placeholder: "  Votre\u0000 prénom " },
    prop_niveau: { placeholder: "x".repeat(200) },
    prop_age: { placeholder: "18" },
    prop_logiciel: { placeholder: "refusé (liste)" },
    prop_jour: { placeholder: "refusé (date)" },
    country: { placeholder: "   " },
  }, form, defs);
  assert.equal(s.first_name.placeholder, "Votre  prénom");
  assert.equal(s.prop_niveau.placeholder.length, 80);
  assert.equal(s.prop_age.placeholder, "18");
  assert.equal(s.prop_logiciel, undefined);
  assert.equal(s.prop_jour, undefined);
  assert.equal(s.country, undefined, "vide = aucun réglage");
});

test("le rendu public affiche le texte indicatif échappé (pas d'injection d'attribut)", async () => {
  const file = path.join(__dirname, "..", "views", "marketing-public", "_signup-fields.ejs");
  const html = await ejs.renderFile(file, {
    form: { fields: ["first_name"], consentText: "OK", smsConsentText: "", fileField: {}, fieldSettings: { first_name: { placeholder: 'Prénom" onfocus="alert(1)<b>' }, prop_niveau: { placeholder: "Ex. débutant" } } },
    fieldCatalog: { first_name: "Prénom" },
    propertyDefs: [{ key: "niveau", name: "prop_niveau", type: "text", label: "Niveau", options: [] }],
    values: {}, prefix: "t", asset: (x) => x,
  });
  assert.match(html, /placeholder="Prénom&quot; onfocus=&quot;alert\(1\)&lt;b>"/);
  assert.doesNotMatch(html, /placeholder="Prénom" onfocus/);
  assert.match(html, /placeholder="Ex\. débutant"/);
});
