// Pied de page — GEL DES IDENTIFIANTS et ALIAS (refonte de la bibliothèque) : les 100 anciens identifiants restent ouvrables (ouverture, « Utiliser », « Revenir au modèle d'origine »),
// ne reparaissent jamais dans la liste dès que leur famille est construite ou redirigée, et aucune autre catégorie du Theme Builder n'est touchée. Sans serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const Catalog = require("../src/themeBuilder/catalog");
const Footer = require("../src/themeBuilder/catalog/footer");
const Ancien = require("../src/themeBuilder/catalog/footer/ancien");
const Aliases = require("../src/themeBuilder/catalog/footer-aliases");
const Kit = require("../src/themeBuilder/catalog/footer/kit-conception");

const { ANCIENS_IDENTIFIANTS, ALIAS } = Aliases;
const listed = () => new Set(Catalog.entries("footer").map((e) => e.key));

describe("Pied de page : identifiants gelés", () => {
  test("la liste figée contient exactement les 100 identifiants de l'ancien catalogue (générée par code, aucune faute de frappe possible)", () => {
    const calcules = Ancien.layouts.map((l) => `${l.key}.${l.keySkin || l.skin}`);
    assert.equal(ANCIENS_IDENTIFIANTS.length, 100);
    assert.equal(new Set(ANCIENS_IDENTIFIANTS).size, 100);
    assert.deepEqual([...ANCIENS_IDENTIFIANTS], calcules);
    assert.ok(Object.isFrozen(ANCIENS_IDENTIFIANTS) && Object.isFrozen(ALIAS), "table figée");
  });
  test("la table d'alias couvre les 100 anciens identifiants et rien d'autre ; chaque cible existe", () => {
    assert.deepEqual(Object.keys(ALIAS).sort(), [...ANCIENS_IDENTIFIANTS].sort());
    for (const [ancien, cible] of Object.entries(ALIAS)) {
      assert.ok(ANCIENS_IDENTIFIANTS.includes(cible) || Footer.layouts.some((l) => l.fullKey === cible), `${ancien} → ${cible} : cible introuvable`);
    }
  });
});

describe("Pied de page : les anciens identifiants restent ouvrables", () => {
  test("les 100 anciens identifiants sont résolus par Catalog.find et Catalog.build, avec ou sans formulaire, sans erreur", () => {
    for (const id of ANCIENS_IDENTIFIANTS) {
      const meta = Catalog.find("footer", id);
      assert.ok(meta, `find ${id}`);
      for (const env of [{}, { formId: 7 }]) {
        const doc = Catalog.build("footer", id, env);
        assert.ok(doc && doc.kind === "component" && doc.section && doc.section.children.length >= 1, `build ${id}`);
      }
      assert.ok(Catalog.thumbDoc("footer", id), `vignette ${id}`);
    }
  });
  test("une clé inconnue reste introuvable (aucune résolution « magique »)", () => {
    for (const k of ["", "n-importe-quoi", "ligne-copyright-menu", "ligne-copyright-menu.inconnu", "ft-minimalistes-99-fantome", "__proto__", "constructor"]) assert.equal(Catalog.find("footer", k), null, k);
    assert.equal(Footer.resolveAlias("constructor"), null);
  });
  test("règle : un ancien identifiant n'est listé que si sa famille n'est pas construite et qu'il n'est pas redirigé ; jamais deux fois", () => {
    const entrees = Catalog.entries("footer"), cles = entrees.map((e) => e.key);
    assert.equal(new Set(cles).size, cles.length, "aucun doublon dans la liste");
    assert.ok(entrees.length >= 1, "la liste n'est jamais vide");
    const construites = new Set(Footer.familles.filter((f) => f.built).map((f) => f.key));
    for (const id of ANCIENS_IDENTIFIANTS) {
      const e = Catalog.find("footer", id), redirige = ALIAS[id] !== id;
      const attendu = !redirige && !construites.has(e.layoutKey);
      assert.equal(cles.includes(id), attendu, `${id} listé=${cles.includes(id)} attendu=${attendu}`);
    }
  });
  test("simulation : toutes les familles construites → 0 ancien listé, les 100 restent ouvrables par le catalogue assemblé", () => {
    const familles = Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: 0, built: true, models: [] }));
    const sim = Footer.assemble({ familles });
    assert.equal(sim.layouts.filter((l) => l.legacy).length, 0);
    assert.equal(sim.hiddenLayouts.length, 100);
    for (const id of ANCIENS_IDENTIFIANTS) { assert.equal(sim.resolveAlias(id), id); assert.ok(sim.hiddenLayouts.some((l) => l.fullKey === id), id); }
  });
  test("simulation : une famille construite masque ses anciens (sans toucher aux autres) ; un alias redirige vers le nouveau modèle", () => {
    const modele = (nn) => Kit.modele({ id: Kit.identifiantModele("minimalistes", nn, "essai"), name: `Essai ${nn}`, family: "minimalistes", description: "Modèle d'essai.", tags: ["essai"], identity: "neutre", structure: { rows: [Kit.L(["copy"], ["menuh"], { pad: "sm" })] } }, "minimalistes");
    const familles = Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: k === "minimalistes" ? 1 : 0, built: k === "minimalistes", models: k === "minimalistes" ? [modele(1)] : [] }));
    const avant = Footer.assemble({ familles: Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: 0, built: false, models: [] })) });
    const sim = Footer.assemble({ familles });
    const mini = ANCIENS_IDENTIFIANTS.filter((id) => avant.layouts.find((l) => l.fullKey === id).family === "minimalistes");
    assert.ok(mini.length >= 5);
    for (const id of mini) assert.ok(!sim.layouts.some((l) => l.fullKey === id), `${id} ne doit plus être listé`);
    assert.equal(sim.layouts.length, avant.layouts.length - mini.length + 1);
    const alias = { ...ALIAS, [mini[0]]: "ft-minimalistes-01-essai" };
    const redir = Footer.assemble({ familles, alias });
    assert.equal(redir.resolveAlias(mini[0]), "ft-minimalistes-01-essai");
    assert.equal(redir.resolveAlias("ft-minimalistes-01-essai"), null, "un nouvel identifiant n'est pas un alias");
  });
  test("un nouveau modèle ne peut pas reprendre un ancien identifiant ni un identifiant déjà pris", () => {
    const base = { name: "X", family: "minimalistes", description: "d", tags: ["t"], identity: "neutre", structure: { rows: [Kit.Z(["copy:c"])] } };
    assert.throws(() => Kit.modele({ ...base, id: "ligne-copyright-menu.clair" }, "minimalistes"), /identifiant invalide/);
    const famille = (models) => Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: 0, models: k === "minimalistes" ? models : [] }));
    const m = { ...base, id: "ft-minimalistes-01-x" };
    assert.throws(() => Footer.assemble({ familles: famille([m, m]) }), /en double/);
  });
});

describe("Pied de page : les autres catégories ne sont pas touchées, un seul registre", () => {
  test("aucun ancien identifiant de pied n'est résolu dans une autre catégorie ; elles ne portent ni alias ni marqueur d'ancien modèle", () => {
    for (const type of Catalog.types().filter((t) => t !== "footer")) {
      const e = Catalog.entries(type);
      assert.ok(e.length >= 1, type);
      assert.ok(e.every((x) => !x.legacy), `${type} : marqueur legacy inattendu`);
      for (const id of ANCIENS_IDENTIFIANTS.slice(0, 20)) assert.equal(Catalog.find(type, id), null, `${type} / ${id}`);
    }
    assert.equal(Catalog.find("header", "ft-minimalistes-01-x"), null);
  });
  test("un seul registre et un seul cache : l'alias et l'identifiant direct donnent le même document ; le module n'est chargé qu'une fois", () => {
    const id = ANCIENS_IDENTIFIANTS[0];
    assert.equal(Catalog.build("footer", id), Catalog.build("footer", id), "même objet en cache");
    assert.equal(require("../src/themeBuilder/catalog/footer"), Footer);
    assert.equal(require("../src/themeBuilder/catalog/footer-aliases"), Aliases);
    assert.deepEqual(Catalog.entries("footer").map((e) => e.key), Catalog.entries("footer").map((e) => e.key));
  });
  test("la liste servie (Catalog.list) est exactement les entrées du code, sans doublon, filtres de famille cohérents", () => {
    const l = Catalog.list("footer", { limit: 60 }), p2 = Catalog.list("footer", { limit: 60, page: 2 });
    const cles = [...l.items, ...p2.items].map((e) => e.key);
    assert.deepEqual(cles, Catalog.entries("footer").map((e) => e.key));
    assert.deepEqual(l.layouts.map((x) => x.key).sort(), [...new Set(Catalog.entries("footer").map((e) => e.layoutKey))].sort());
  });
});
