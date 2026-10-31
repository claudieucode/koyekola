// Enrichissement visuel, palier 2 — scènes de création de site ajoutées à src/utils/illustrations.js.
// Contrat : rendues sans valeur manquante, aux couleurs de la charte (aucune couleur en dur, jamais de rose), sans ressource externe,
// accessibles (décoratives ou nommées), légères, avec des alias résolus et sans casser les alias existants.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { illu, resolve, NAMES } = require("../src/utils/illustrations");

const NOUVELLES = ["editeur", "ia", "bibliotheque", "boutique", "publication", "assistant", "nouveausite", "plateforme", "connexion"];

describe("scènes du palier 2", () => {
  test("les 9 scènes existent et se rendent sans valeur manquante", () => {
    for (const n of NOUVELLES) {
      assert.ok(NAMES.includes(n), n);
      const svg = illu(n);
      assert.match(svg, new RegExp(`^<svg class="kx-art kx-art--${n}"`), n);
      assert.doesNotMatch(svg, /NaN|undefined|null|\[object/, n);
      assert.match(svg, /viewBox="0 0 320 210"/);
    }
  });
  test("aucune couleur en dur, aucune ressource externe, aucun script", () => {
    for (const n of NOUVELLES) {
      const svg = illu(n);
      assert.doesNotMatch(svg, /#[0-9a-f]{3,6}\b/i, `${n} : couleur en dur`);
      assert.doesNotMatch(svg, /\b(rgb|hsl)a?\(/i, n);
      assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"', ""), /https?:|href=|<image|<script|on[a-z]+=/i, n);
    }
  });
  test("légères : moins de 4 Ko chacune", () => {
    for (const n of NOUVELLES) assert.ok(illu(n).length < 4000, `${n} : ${illu(n).length} octets`);
  });
  test("décoratives par défaut, nommées avec un label (accessibilité)", () => {
    for (const n of NOUVELLES) {
      assert.match(illu(n), /aria-hidden="true"/);
      assert.match(illu(n, { label: "Texte \"alternatif\"" }), /role="img" aria-label="Texte &quot;alternatif&quot;"/);
    }
  });
  test("balises équilibrées (SVG bien formé)", () => {
    for (const n of NOUVELLES) {
      const svg = illu(n);
      const open = (svg.match(/<(g|svg)[ >]/g) || []).length, close = (svg.match(/<\/(g|svg)>/g) || []).length;
      assert.equal(open, close, n);
    }
  });
  test("alias : nouveaux noms résolus, anciens inchangés", () => {
    const attendu = { "page-builder": "editeur", ia: "ia", sparkles: "ia", gabarits: "bibliotheque", shop: "boutique", panier: "boutique", publier: "publication", wizard: "assistant", "nouveau-site": "nouveausite", kolakisa: "plateforme", login: "connexion", lock: "connexion" };
    for (const [alias, scene] of Object.entries(attendu)) assert.equal(resolve(alias), scene, alias);
    for (const [alias, scene] of Object.entries({ modeles: "email", pages: "pages", sites: "dashboard", formations: "formations", inconnu: "accueil", filter: "automatisations", users: "utilisateurs" })) assert.equal(resolve(alias), scene, alias);
  });
  test("39 scènes au total, toutes rendues (aucune régression des anciennes)", () => {
    assert.equal(NAMES.length, 39);
    for (const n of NAMES) assert.doesNotMatch(illu(n), /NaN|undefined/, n);
  });
  test("la feuille de style couvre toutes les classes utilisées par les scènes", () => {
    const css = fs.readFileSync(path.join(__dirname, "../public/css/kola-art.css"), "utf8");
    const classes = new Set();
    for (const n of NOUVELLES) for (const m of illu(n).matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).filter((c) => !c.startsWith("kx-art")).forEach((c) => classes.add(c));
    for (const c of classes) assert.match(css, new RegExp(`\\.kx-art \\.${c}\\b`), `classe .${c} non stylée`);
  });
});
