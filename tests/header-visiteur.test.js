// Header Builder, lot L6 — condition d'affichage « visiteur » (connecté / non connecté) : validation, évaluation, priorité, conflits, description.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../src/themeBuilder/conditions");
const M = require("../src/themeBuilder/match");
const R = require("../src/themeBuilder/resolve");

describe("Condition « visiteur »", () => {
  test("validation : connecté ou non connecté, obligatoire, jamais un autre critère ni une autre valeur", () => {
    assert.deepEqual(C.normalizeOne({ kind: "visitor", state: "in" }, "x"), { kind: "visitor", state: "in" });
    assert.deepEqual(C.normalizeOne({ kind: "visitor", state: "out" }, "x"), { kind: "visitor", state: "out" });
    // ancienne écriture des premiers en-têtes (member / guest) : convertie, jamais conservée telle quelle
    assert.deepEqual(C.normalizeOne({ kind: "visitor", who: "member" }, "x"), { kind: "visitor", state: "in" });
    assert.deepEqual(C.normalizeOne({ kind: "visitor", who: "guest" }, "x"), { kind: "visitor", state: "out" });
    assert.throws(() => C.normalizeOne({ kind: "visitor" }, "x"), /connecté/);
    assert.throws(() => C.normalizeOne({ kind: "visitor", state: "admin" }, "x"), /connecté/);
    assert.throws(() => C.normalizeOne({ kind: "visitor", state: "in", ids: [1] }, "x"), /non pris en charge/);
  });
  test("évaluation : un visiteur connecté correspond à « connecté », jamais à « non connecté » ; sans information : aucune des deux (jamais supposé)", () => {
    const member = { view: "page", visitor: { loggedIn: true } }, guest = { view: "page", visitor: { loggedIn: false } }, none = { view: "page" };
    assert.equal(M.matches({ kind: "visitor", state: "in" }, member), true); assert.equal(M.matches({ kind: "visitor", state: "out" }, member), false);
    assert.equal(M.matches({ kind: "visitor", state: "out" }, guest), true); assert.equal(M.matches({ kind: "visitor", state: "in" }, guest), false);
    assert.equal(M.matches({ kind: "visitor", state: "out" }, none), false, "sans visiteur connu : jamais supposé"); assert.equal(M.matches({ kind: "visitor", state: "in" }, none), false);
  });
  test("priorité : plus précis que « tout le site » et qu'un contenu individuel quelconque, moins qu'un contenu choisi", () => {
    const s = M.scoreOf({ kind: "visitor", state: "in" });
    assert.ok(s > M.scoreOf({ kind: "site" }) && s > M.scoreOf({ kind: "site" }) && s < M.scoreOf({ kind: "page", ids: [3] }) && s < M.scoreOf({ kind: "front_page" }));
  });
  test("description lisible", () => {
    assert.equal(C.describeOne({ kind: "visitor", state: "in" }), "Visiteur connecté"); assert.equal(C.describeOne({ kind: "visitor", state: "out" }), "Visiteur non connecté");
  });
  test("normalisation d'un jeu : « tout le site SAUF les visiteurs non connectés » = en-tête réservé aux membres ; la même condition incluse et exclue est refusée", () => {
    const n = C.normalize({ include: [{ kind: "site" }], exclude: [{ kind: "visitor", state: "out" }] }, "header");
    assert.deepEqual(n.exclude, [{ kind: "visitor", state: "out" }]);
    assert.throws(() => C.normalize({ include: [{ kind: "visitor", state: "in" }], exclude: [{ kind: "visitor", state: "in" }] }, "header"), /incluse et exclue/);
  });
});

describe("En-têtes pour membres et pour invités : choix et conflits", () => {
  const tpl = (id, name, include, exclude = [], at = "2026-11-01 10:00:00") => ({ id, name, type: "header", status: "published", conditions: { include, exclude }, publishedAt: at, siteId: 1 });
  const pick = (pool, ctx) => (R.resolve(pool, { siteId: 1, view: "page", id: 5, parents: [], categories: [], categoryAncestors: [], tags: [], ...ctx }, { type: "header" }).winner || {}).name;
  test("deux en-têtes (invités / membres) : chacun son visiteur, sans conflit ni ambiguïté", () => {
    const pool = [tpl(1, "Invités", [{ kind: "visitor", state: "out" }]), tpl(2, "Membres", [{ kind: "visitor", state: "in" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: false } }), "Invités"); assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres");
    const conflicts = R.conflicts ? R.conflicts(pool) : [];
    assert.deepEqual(conflicts.filter((c) => c.severity === "blocking" || c.kind === "ambiguous"), [], "aucun conflit entre invités et membres");
  });
  test("un en-tête général + un en-tête membres : le membre voit le sien, l'invité voit le général (jamais l'inverse)", () => {
    const pool = [tpl(1, "Général", [{ kind: "site" }]), tpl(2, "Membres", [{ kind: "visitor", state: "in" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres"); assert.equal(pick(pool, { visitor: { loggedIn: false } }), "Général");
  });
  test("une page choisie reste plus précise qu'un réglage de visiteur", () => {
    const pool = [tpl(1, "Page 5 pour tous", [{ kind: "page", ids: [5] }]), tpl(2, "Membres", [{ kind: "visitor", state: "in" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Page 5 pour tous");
  });
  test("l'exclusion des invités retire l'en-tête pour eux", () => {
    const pool = [tpl(1, "Membres seulement", [{ kind: "site" }], [{ kind: "visitor", state: "out" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres seulement"); assert.equal(pick(pool, { visitor: { loggedIn: false } }), undefined);
  });
});
