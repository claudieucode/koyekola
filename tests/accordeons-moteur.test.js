// Moteur commun des accordéons (logique pure, sans navigateur) : trois modes, états conservés, règle de normalisation, aucun nom en dur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const K = require("../public/js/accordion-engine.js");

const run = (mode, start, steps) => { let st = start.slice(); const out = []; for (const [i, opening] of steps) { st = K.plan(mode, st, i, opening); out.push(st.slice()); } return out; };
const A = 0, B = 1, C = 2, D = 3;

describe("accordéons : logique des trois modes", () => {
  test("« Un seul ouvert » : ouvrir A, B, C → toujours une seule section ouverte", () => {
    assert.deepEqual(run("one", [false, false, false], [[A, true], [B, true], [C, true]]), [[true, false, false], [false, true, false], [false, false, true]]);
  });
  test("« Plusieurs ouverts » : chaque état est conservé ; ouvrir n'ouvre ni ne ferme les autres", () => {
    assert.deepEqual(run("many", [false, false, false], [[A, true], [B, true], [C, true], [B, false]]), [[true, false, false], [true, true, false], [true, true, true], [true, false, true]]);
    assert.deepEqual(K.plan("many", [true, false, true], B, true), [true, true, true], "A et C restent ouverts quand B s'ouvre");
  });
  test("« Fermer ceux situés en dessous » : A, C, B, D — le dessus reste, le dessous se ferme", () => {
    assert.deepEqual(run("below", [false, false, false, false], [[A, true], [C, true], [B, true], [D, true]]),
      [[true, false, false, false], [true, false, true, false], [true, true, false, false], [true, true, false, true]]);
    assert.deepEqual(K.plan("below", [true, true, true, false, false], 1, true), [true, true, false, false, false], "exemple de la mission : ouvrir Espacement referme Dimensions");
  });
  test("fermer une section ne modifie jamais les autres, dans aucun mode", () => {
    for (const m of ["one", "many", "below"]) assert.deepEqual(K.plan(m, [true, true, true], B, false), [true, false, true], m);
  });
  test("la logique ne mute pas le tableau reçu", () => {
    const st = [true, false]; K.plan("one", st, 1, true); K.normalize("one", [true, true], 1); assert.deepEqual(st, [true, false]);
  });
});

describe("accordéons : passage à « un seul ouvert » (règle explicite et stable)", () => {
  test("la dernière section ouverte par la personne est gardée", () => { assert.deepEqual(K.normalize("one", [true, true, false], 1), [false, true, false]); });
  test("sans indication : la première ouverte dans l'ordre est gardée", () => { assert.deepEqual(K.normalize("one", [false, true, true], -1), [false, true, false]); });
  test("indication sur une section fermée : on retombe sur la première ouverte", () => { assert.deepEqual(K.normalize("one", [true, true, false], 2), [true, false, false]); });
  test("rien à faire s'il y a au plus une section ouverte ; les autres modes ne touchent à rien", () => {
    assert.deepEqual(K.normalize("one", [false, true, false], 0), [false, true, false]);
    assert.deepEqual(K.normalize("many", [true, true, true], 0), [true, true, true]);
    assert.deepEqual(K.normalize("below", [true, true, true], 0), [true, true, true]);
  });
});

describe("accordéons : le moteur ne dépend d'aucun nom de section", () => {
  test("aucun libellé de section dans le moteur (identifiants / groupes logiques seulement)", () => {
    const src = fs.readFileSync(path.join(__dirname, "../public/js/accordion-engine.js"), "utf8");
    for (const nom of ["Mise en page", "Espacement", "Dimensions", "Couleurs", "Bordure", "Typographie", "layout", "spacing"]) assert.equal(src.includes(nom), false, nom);
  });
  test("mode inconnu → comportement historique (plusieurs ouverts) ; trois modes publiés avec libellé et description courts", () => {
    assert.deepEqual(K.MODES, ["many", "one", "below"]);
    assert.equal(K.DEFAULT_MODE, "many");
    for (const m of K.MODES) { assert.equal(typeof K.LABELS[m][0], "string"); assert.ok(K.LABELS[m][1].length < 70, m); }
    assert.deepEqual(K.LABELS.one, ["Un seul ouvert", "L’ouverture d’une section ferme les autres."]);
    assert.equal(K.LABELS.below[0], "Fermer ceux situés en dessous");
  });
});
