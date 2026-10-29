// Page publique d'un formulaire (/f/…) centrée + interrupteur de l'éditeur d'e-mails : un seul contrôle, une seule apparence.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");

test("la page du formulaire public utilise la carte centrée (et non la carte auth collée à gauche)", () => {
  assert.match(read("views/marketing-public/form.ejs"), /class="auth-page kv-form-page"[\s\S]*class="auth-card kv-form-card"/);
  const css = read("public/css/kola-v3.css");
  assert.match(css, /\.kv-form-card \{[^}]*max-width: 640px;[^}]*margin-inline: auto/);
  assert.match(css, /\.kv-form-page \{[^}]*display: flex;[^}]*justify-content: center/);
});

test("le consentement marketing n'est jamais pré-coché ni facultatif rendu obligatoire côté vue", () => {
  const f = read("views/marketing-public/_signup-fields.ejs");
  assert.match(f, /name="consent" value="1" required>/);
  assert.doesNotMatch(f, /name="consent"[^>]*checked/);
});

test("l'interrupteur .mk-fx-switch n'hérite plus du style « case à cocher » de kola-pages.css", () => {
  const css = read("public/css/kola-pages.css");
  const rules = css.split("\n").filter((l) => /^\.mk-content input\[type=checkbox\]:not\(\.mk-switch-input\)/.test(l));
  assert.ok(rules.length >= 6);
  for (const l of rules) assert.match(l, /:not\(\.mk-fx-switch\)/, l.slice(0, 90));
});
