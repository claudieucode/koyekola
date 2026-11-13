// BAS DE PAGE VARIÉ (footer/v2/bas.js) : remarque du propriétaire « le bas est répété et identique pour chaque pied ».
//  · chaque modèle v2 a un plan de bas UNIQUE (ligne © × filet × barre de la plateforme) ; le plan ne dépend que du numéro ft2-NNN ;
//  · le bas du modèle (rangée « copyright + mentions légales ») est retrouvé et modifié ; le filet qui le précède n'est jamais supprimé ;
//  · les jetons --ft-legal-* de la barre de la plateforme survivent au nettoyage des jetons (footerFrontier.normalizeVars) ;
//  · la feuille de style prévoit chaque jeton, et rien ne change sans jeton (rendu historique).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), path = require("path");
const V2 = require("../src/themeBuilder/catalog/footer/v2");
const Bas = require("../src/themeBuilder/catalog/footer/v2/bas");
const FF = require("../src/marketing/pages/footerFrontier");
const { kit } = require("../src/themeBuilder/catalog/kit");
const skins = new Map(V2.skins.map((s) => [s.key, s]));
const construit = (e) => e.build(kit(skins.get(e.skin)), {});

describe("Pied v2 : bas de page varié", () => {
  test("plan unique : 512 combinaisons distinctes pour les numéros 1 à 512, donc jamais deux modèles identiques", () => {
    const vus = new Set();
    for (let n = 1; n <= Bas.TOTAL; n++) vus.add(JSON.stringify(Bas.planUnique(`ft2-${String(n).padStart(3, "0")}`)));
    assert.equal(vus.size, Bas.TOTAL);
    assert.ok(V2.nouveaux.length <= Bas.TOTAL, "assez de combinaisons pour tous les modèles");
  });
  test("tous les modèles : bas du modèle retrouvé (sauf le pied d'une ligne), jetons de barre conservés par le nettoyeur", () => {
    const sans = [];
    for (const e of V2.nouveaux) {
      if (!Bas.trouveBas(construit(e))) sans.push(e.fullKey);
      const n = FF.normalizeVars(e.ftVars);
      assert.equal(Object.keys(n).length, Object.keys(e.ftVars).length, `${e.fullKey} : un jeton a été retiré`);
    }
    assert.deepEqual(sans, ["ft2-096-juste-une-ligne"], "seul le pied d'une ligne n'a pas de rangée © / mentions");
  });
  test("le filet avant la rangée © reste présent (widget déclaré) quel que soit le plan ; aucun arrondi ajouté", () => {
    for (const e of V2.nouveaux) {
      const json = JSON.stringify(construit(e));
      assert.ok(!/"borderRadius":"[1-9]/.test(JSON.stringify(Bas.appliquerBas([{ type: "container", children: [{ type: "divider" }, { type: "group", children: [{ type: "copyright" }, { type: "bizlegal" }] }] }], e.fullKey, {}).arbre)), e.fullKey);
      if ((e.model.widgets || []).includes("divider")) assert.ok(/"type":"divider"/.test(json), `${e.fullKey} : filet supprimé`);
    }
  });
  test("variété réelle : au moins 6 présentations de ligne, 8 filets et 8 barres de plateforme utilisés", () => {
    const s = new Set(), r = new Set(), p = new Set();
    for (const e of V2.nouveaux) { const x = Bas.planUnique(e.fullKey); s.add(x.s); r.add(x.r); p.add(x.p); }
    assert.ok(s.size >= 6 && r.size >= 8 && p.size >= 8, JSON.stringify([s.size, r.size, p.size]));
  });
  test("feuille de style : chaque jeton --ft-legal-* utilisé est lu par landing.css (barre de la plateforme)", () => {
    const css = fs.readFileSync(path.join(__dirname, "../public/css/landing.css"), "utf8");
    const jetons = new Set(Bas.BARRES.flatMap((b) => Object.keys(b)));
    for (const j of jetons) assert.ok(css.includes(`var(${j}`), `${j} non lu par la feuille de style`);
    const ejs = fs.readFileSync(path.join(__dirname, "../views/marketing-public/_foot-legal.ejs"), "utf8");
    assert.equal((ejs.match(/lp-foot-sep/g) || []).length, 2, "séparateurs repérables");
  });
});
