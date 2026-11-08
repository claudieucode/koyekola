// En-têtes de la bibliothèque : sur tablette, une grille à DEUX colonnes dont le nombre de cases visibles est impair ne laisse plus de trou ;
// la dernière case visible occupe la ligne entière. Le mobile (une colonne) et les cases masquées ne sont pas touchés. Unitaire : aucun navigateur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { grid } = require("../src/themeBuilder/catalog/header/blocks");

const cell = (extra = {}) => ({ type: "stack", styles: { desktop: {} }, ...extra });
const span = (node, dev) => node.styles && node.styles[dev] && node.styles[dev].gridColumnSpan;

describe("En-têtes : dernière ligne de grille complète sur tablette", () => {
  test("3 cases sur 2 colonnes : la 3e occupe 2 colonnes sur tablette, 1 sur mobile (une colonne)", () => {
    const g = grid("auto 1fr auto", [cell(), cell(), cell()], {}, { gridTemplate: "1fr 1fr" }, { gridTemplate: "1fr" });
    assert.equal(span(g.children[2], "tablet"), 2);
    assert.equal(span(g.children[2], "mobile"), 1);
    assert.equal(span(g.children[0], "tablet"), undefined);
    assert.equal(span(g.children[1], "tablet"), undefined);
  });
  test("le mobile garde deux colonnes : la dernière case s'étale aussi", () => {
    const g = grid("1fr 1fr", [cell(), cell(), cell()], {}, { gridTemplate: "1fr 1fr" });
    assert.equal(span(g.children[2], "tablet"), 2);
    assert.equal(span(g.children[2], "mobile"), 2);
  });
  test("nombre pair de cases, ou une seule colonne : rien n'est ajouté", () => {
    const pair = grid("1fr 1fr", [cell(), cell()], {}, { gridTemplate: "1fr 1fr" });
    assert.equal(span(pair.children[1], "tablet"), undefined);
    const une = grid("1fr 1fr 1fr", [cell(), cell(), cell()], {}, { gridTemplate: "1fr" });
    assert.equal(span(une.children[2], "tablet"), undefined);
  });
  test("trois colonnes ou plus : composition d'auteur, inchangée", () => {
    const g = grid("1fr 1fr 1fr", [cell(), cell(), cell(), cell()], {}, { gridTemplate: "1fr 1fr 1fr" });
    assert.equal(span(g.children[3], "tablet"), undefined);
  });
  test("une case masquée sur tablette ne compte pas : 3 cases dont une masquée = nombre pair visible, rien à étaler", () => {
    const g = grid("1fr 1fr 1fr", [cell(), cell(), cell({ hideOn: ["tablet", "mobile"] })], {}, { gridTemplate: "1fr 1fr" });
    assert.equal(span(g.children[1], "tablet"), undefined);
    assert.equal(span(g.children[2], "tablet"), undefined);
  });
  test("sans réglage de tablette ni de mobile : la grille n'est pas modifiée", () => {
    const g = grid("1fr 1fr", [cell(), cell(), cell()], {});
    assert.equal(span(g.children[2], "tablet"), undefined);
    assert.equal(span(g.children[2], "mobile"), undefined);
  });
});
