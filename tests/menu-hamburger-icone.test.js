// Menu : réglages de l'icône du bouton hamburger (animation, taille, épaisseur, durée) — validation et rendu.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");

const doc = (extra) => [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [{ id: "menu00000001", type: "menu", props: { label: "Navigation", items: [{ label: "Accueil", url: "/" }], mobileToggle: true, ...extra } }] }] }];
const menuOf = (extra) => { const { A } = freshMarketing(); const p = pages.createPage(A, { name: "Menu", kind: "page" }); return pages.saveDraft(A, p.id, { sections: doc(extra) }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0].props; };

describe("hamburger : icône", () => {
  test("valeurs valides conservées", () => {
    const p = menuOf({ burgerAnim: "spin", burgerSize: 26, burgerThickness: 3, burgerSpeed: 0 });
    assert.equal(p.burgerAnim, "spin"); assert.equal(p.burgerSize, 26); assert.equal(p.burgerThickness, 3); assert.equal(p.burgerSpeed, 0);
  });
  test("valeurs hors limites ou inconnues ignorées", () => {
    const p = menuOf({ burgerAnim: "boom", burgerSize: 999, burgerThickness: 0, burgerSpeed: -5 });
    for (const k of ["burgerAnim", "burgerSize", "burgerThickness", "burgerSpeed"]) assert.equal(p[k], undefined, k);
  });
  test("sans bouton mobile, rien n'est conservé", () => {
    assert.equal(menuOf({ mobileToggle: false, burgerAnim: "spin" }).burgerAnim, undefined);
  });
});
