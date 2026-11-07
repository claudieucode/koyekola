// Header Builder, lot L6 — condition d'affichage « visiteur » (connecté / non connecté) : validation, évaluation, priorité, conflits, description.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../src/themeBuilder/conditions");
const M = require("../src/themeBuilder/match");
const R = require("../src/themeBuilder/resolve");

describe("Condition « visiteur »", () => {
  test("validation : connecté ou non connecté, obligatoire, jamais un autre critère ni une autre valeur", () => {
    assert.deepEqual(C.normalizeOne({ kind: "visitor", who: "member" }, "x"), { kind: "visitor", who: "member" });
    assert.deepEqual(C.normalizeOne({ kind: "visitor", who: "guest" }, "x"), { kind: "visitor", who: "guest" });
    assert.throws(() => C.normalizeOne({ kind: "visitor" }, "x"), /visiteur connecté/);
    assert.throws(() => C.normalizeOne({ kind: "visitor", who: "admin" }, "x"), /visiteur connecté/);
    assert.throws(() => C.normalizeOne({ kind: "visitor", who: "member", ids: [1] }, "x"), /non pris en charge/);
  });
  test("évaluation : un visiteur connecté correspond à « connecté », jamais à « non connecté » ; sans information : non connecté", () => {
    const member = { view: "page", visitor: { loggedIn: true } }, guest = { view: "page", visitor: { loggedIn: false } }, none = { view: "page" };
    assert.equal(M.matches({ kind: "visitor", who: "member" }, member), true); assert.equal(M.matches({ kind: "visitor", who: "guest" }, member), false);
    assert.equal(M.matches({ kind: "visitor", who: "guest" }, guest), true); assert.equal(M.matches({ kind: "visitor", who: "member" }, guest), false);
    assert.equal(M.matches({ kind: "visitor", who: "guest" }, none), true, "sans visiteur connu : non connecté"); assert.equal(M.matches({ kind: "visitor", who: "member" }, none), false);
  });
  test("priorité : plus précis que « tout le site » et qu'un contenu individuel quelconque, moins qu'un contenu choisi", () => {
    const s = M.scoreOf({ kind: "visitor", who: "member" });
    assert.ok(s > M.scoreOf({ kind: "site" }) && s > M.scoreOf({ kind: "singular" }) && s < M.scoreOf({ kind: "page", ids: [3] }) && s < M.scoreOf({ kind: "front_page" }));
  });
  test("description lisible", () => {
    assert.equal(C.describeOne({ kind: "visitor", who: "member" }), "Visiteurs connectés"); assert.equal(C.describeOne({ kind: "visitor", who: "guest" }), "Visiteurs non connectés");
  });
  test("normalisation d'un jeu : « tout le site SAUF les visiteurs non connectés » = en-tête réservé aux membres ; la même condition incluse et exclue est refusée", () => {
    const n = C.normalize({ include: [{ kind: "site" }], exclude: [{ kind: "visitor", who: "guest" }] }, "header");
    assert.deepEqual(n.exclude, [{ kind: "visitor", who: "guest" }]);
    assert.throws(() => C.normalize({ include: [{ kind: "visitor", who: "member" }], exclude: [{ kind: "visitor", who: "member" }] }, "header"), /incluse et exclue/);
  });
});

describe("En-têtes pour membres et pour invités : choix et conflits", () => {
  const tpl = (id, name, include, exclude = [], at = "2026-11-01 10:00:00") => ({ id, name, type: "header", status: "published", conditions: { include, exclude }, publishedAt: at, siteId: 1 });
  const pick = (pool, ctx) => (R.resolve(pool, { siteId: 1, view: "page", id: 5, parents: [], categories: [], categoryAncestors: [], tags: [], ...ctx }, { type: "header" }).winner || {}).name;
  test("deux en-têtes (invités / membres) : chacun son visiteur, sans conflit ni ambiguïté", () => {
    const pool = [tpl(1, "Invités", [{ kind: "visitor", who: "guest" }]), tpl(2, "Membres", [{ kind: "visitor", who: "member" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: false } }), "Invités"); assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres");
    const conflicts = R.conflicts ? R.conflicts(pool) : [];
    assert.deepEqual(conflicts.filter((c) => c.severity === "blocking" || c.kind === "ambiguous"), [], "aucun conflit entre invités et membres");
  });
  test("un en-tête général + un en-tête membres : le membre voit le sien, l'invité voit le général (jamais l'inverse)", () => {
    const pool = [tpl(1, "Général", [{ kind: "site" }]), tpl(2, "Membres", [{ kind: "visitor", who: "member" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres"); assert.equal(pick(pool, { visitor: { loggedIn: false } }), "Général");
  });
  test("une page choisie reste plus précise qu'un réglage de visiteur", () => {
    const pool = [tpl(1, "Page 5 pour tous", [{ kind: "page", ids: [5] }]), tpl(2, "Membres", [{ kind: "visitor", who: "member" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Page 5 pour tous");
  });
  test("l'exclusion des invités retire l'en-tête pour eux", () => {
    const pool = [tpl(1, "Membres seulement", [{ kind: "site" }], [{ kind: "visitor", who: "guest" }])];
    assert.equal(pick(pool, { visitor: { loggedIn: true } }), "Membres seulement"); assert.equal(pick(pool, { visitor: { loggedIn: false } }), undefined);
  });
});
