// Fenêtres (popups) : ciblage par appareil et par type de visiteur (nouveau / déjà venu). Données + rendu (sans serveur) ; la logique d'affichage est du JS public vérifié ici sur le texte du script.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const nodes = require("../src/marketing/pages/nodes");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: nodes.iconNames() };
const norm = (props) => nodes.normalizeNode({ id: "modal0000001", type: "modal", props: { buttonLabel: "Ouvrir", title: "Titre", text: "Contenu", ...props } }, "essai", H, 1, { n: 0, ids: new Set() }).props;

describe("fenêtres : ciblage appareil et visiteur", () => {
  test("valeurs conservées avec un déclencheur automatique ; inconnues écartées ; rien sans déclencheur", () => {
    const p = norm({ auto: "load", device: "mobile", visitor: "returning" });
    assert.deepEqual([p.device, p.visitor], ["mobile", "returning"]);
    const q = norm({ auto: "load", device: "tv", visitor: "vip" });
    assert.ok(!("device" in q) && !("visitor" in q));
    const r = norm({ device: "mobile", visitor: "new" });
    assert.ok(!("device" in r) && !("visitor" in r), "sans ouverture automatique : aucun ciblage");
    assert.ok(!("device" in norm({ auto: "load" })), "réglage absent : aucune clé ajoutée");
  });
  test("le rendu public pose les attributs de ciblage ; le script public applique les deux règles", () => {
    const ejs = fs.readFileSync("views/marketing-public/_node.ejs", "utf8"), js = fs.readFileSync("public/js/landing.js", "utf8");
    assert.match(ejs, /data-kw-auto-device="<%= p\.device %>"/); assert.match(ejs, /data-kw-auto-visitor="<%= p\.visitor %>"/);
    assert.match(js, /data-kw-auto-device/); assert.match(js, /data-kw-auto-visitor/); assert.match(js, /kw-visited/);
    assert.match(js, /max-width: 767px/);
  });
  test("l'éditeur propose les deux réglages (appareil, type de visiteur)", () => {
    const pb = fs.readFileSync("public/js/page-builder.js", "utf8");
    assert.match(pb, /"Appareil", p\.device/); assert.match(pb, /"Type de visiteur", p\.visitor/);
  });
});
