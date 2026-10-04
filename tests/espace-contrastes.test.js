// « Mon espace » : contrastes garantis par le calcul des jetons, pour chaque thème prédéfini ET pour des couleurs
// personnalisées quelconques. Garde-fou contre le retour de textes clairs sur cartes blanches (ou l'inverse).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const d = require("../src/services/dashboard");

const PAIRS = (t) => [
  ["texte / carte", t["--dash-text"], t["--dash-card"]], ["texte / fond", t["--dash-text"], t["--dash-bg"]],
  ["texte secondaire / carte", t["--dash-muted"], t["--dash-card"]], ["texte secondaire / fond", t["--dash-muted"], t["--dash-bg"]],
  ["lien / carte", t["--dash-accent-text"], t["--dash-card"]], ["lien / fond", t["--dash-accent-text"], t["--dash-bg"]],
  ["texte sur accent plein", t["--dash-accent-on"], t["--dash-accent"]], ["bouton principal", t["--dash-button-text"], t["--dash-button"]],
  ["menu / barre latérale", t["--dash-sidebar-text"], t["--dash-sidebar"]], ["entrée active du menu", t["--dash-active-text"], t["--dash-active-bg"]],
  ["succès / carte", t["--dash-success"], t["--dash-card"]], ["avertissement / carte", t["--dash-warning"], t["--dash-card"]], ["danger / carte", t["--dash-danger"], t["--dash-card"]],
];
const check = (label, t) => { for (const [what, fg, bg] of PAIRS(t)) { const r = d.ratio(fg, bg); assert.ok(r >= 4.5, `${label} — ${what} : ${r.toFixed(2)} (${fg} sur ${bg})`); } };

test("chaque thème prédéfini : texte, liens, boutons, menu et états lisibles (≥ 4,5)", () => {
  for (const key of Object.keys(d.THEMES)) check(key, d.tokens({ theme: key, colors: {} }));
});

test("couleurs personnalisées quelconques : contrastes toujours garantis", () => {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const hex = () => `#${[0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, "0")).join("")}`;
  for (let i = 0; i < 1000; i++) {
    const colors = { primary: hex(), accent: hex(), sidebar: hex(), bg: hex(), card: hex(), button: hex() };
    check(`personnalisé ${JSON.stringify(colors)}`, d.tokens({ theme: "perso", colors }));
  }
});

test("pont vers les composants communs : les variables du site suivent le thème dans Mon espace", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "dashboard.css"), "utf8");
  for (const v of ["--card: var(--dash-card)", "--primary: var(--dash-text)", "--muted: var(--dash-muted)", "--accent: var(--dash-accent-text)"]) assert.ok(css.includes(v), v);
  assert.doesNotMatch(css, /(?<![-a-z])color: var\(--dash-accent\)/, "l'accent « fond » n'est jamais utilisé comme couleur de texte");
  const site = fs.readFileSync(path.join(__dirname, "..", "public", "css", "style.css"), "utf8");
  for (const sel of [".btn-secondary {", ".btn-outline {", ".btn-danger {", ".chapter-block {", ".accordion-item {"]) {
    const rule = site.slice(site.indexOf(sel), site.indexOf("}", site.indexOf(sel)));
    assert.match(rule, /background: var\(--card\)/, `${sel} suit la carte du thème`);
  }
});
