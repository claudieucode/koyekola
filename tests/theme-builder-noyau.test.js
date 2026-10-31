// Theme Builder (23.1, lot 1) — noyau pur : validation des conditions, évaluation, priorités, exclusions, conflits, explication, conditions personnalisées. Aucun serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const TB = require("../src/themeBuilder");
const { normalize, describe: desc, registerCondition } = TB.conditions;
const { resolve, conflicts, evaluate } = TB.resolve;
const { scoreOf } = TB.match;

let n = 0;
const T = (type, name, cond, o = {}) => ({ id: ++n, type, name, status: "published", publishedAt: "2026-01-01T00:00:00Z", conditions: normalize(cond, type), ...o });
const post = (o = {}) => ({ siteId: 1, view: "post", id: 7, authorId: 3, parents: [], categories: ["Actualités"], categoryAncestors: ["Blog"], tags: ["Promo"], ...o });
const win = (ts, ctx, type) => { const r = resolve(ts, ctx, { type }); return r.winner && r.winner.name; };

describe("Validation des conditions", () => {
  test("schéma fermé : kind inconnu, critère étranger, valeurs invalides et excessives sont refusés", () => {
    for (const bad of [{ include: [{ kind: "eval" }] }, { include: [{ kind: "site", ids: [1] }] }, { include: [{ kind: "post", ids: ["x"] }] }, { include: [{ kind: "post", ids: [0] }] },
      { include: [{ kind: "child_of" }] }, { include: [{ kind: "custom", id: "inconnue" }] }, { include: "site" }, { include: [{ kind: "archive", sub: "zzz" }] },
      { include: Array.from({ length: 21 }, (_, i) => ({ kind: "post", ids: [i + 1] })) }, { include: [{ kind: "post", ids: Array.from({ length: 51 }, (_, i) => i + 1) }] }]) assert.throws(() => normalize(bad), /./, JSON.stringify(bad).slice(0, 60));
  });
  test("une condition impossible pour le type est refusée ; incluse ET exclue = refusée ; doublons refusés", () => {
    assert.throws(() => normalize({ include: [{ kind: "archive" }] }, "single_post"), /ne peut jamais correspondre/);
    assert.throws(() => normalize({ include: [{ kind: "post" }], exclude: [{ kind: "post" }] }), /incluse et exclue/);
    assert.throws(() => normalize({ include: [{ kind: "post" }, { kind: "post" }] }), /double/);
    assert.doesNotThrow(() => normalize({ include: [{ kind: "archive" }] }, "header"), "un type global accepte toute condition");
  });
  test("normalisation : textes nettoyés, doublons retirés, vides ignorés, chaînes séparées par virgules", () => {
    const c = normalize({ include: [{ kind: "post", category: " A , a ,, B\u0000 ", tag: [], ids: "3, 3, 4" }] });
    assert.deepEqual(c.include[0], { kind: "post", ids: [3, 4], category: ["A", "a", "B"] });
    assert.deepEqual(normalize(undefined), { include: [], exclude: [] });
  });
  test("libellés lisibles", () => {
    assert.equal(desc(normalize({})).include, "Tout le site");
    const d = desc(normalize({ include: [{ kind: "post", category: ["Actu"], tag: ["x"] }, { kind: "front_page" }], exclude: [{ kind: "post", ids: [4] }] }));
    assert.equal(d.include, "Articles (catégorie « Actu » ET étiquette « x ») OU Page d'accueil"); assert.match(d.exclude, /n° 4/);
  });
});

describe("Évaluation et priorité", () => {
  test("sans condition = tout le site ; le plus précis gagne : article précis › catégorie › type › site", () => {
    const ts = [T("single_post", "Général", {}), T("single_post", "Articles", { include: [{ kind: "post" }] }), T("single_post", "Catégorie", { include: [{ kind: "post", category: ["actualités"] }] }), T("single_post", "Précis", { include: [{ kind: "post", ids: [7] }] })];
    assert.equal(win(ts, post(), "single_post"), "Précis");
    assert.equal(win(ts, post({ id: 8 }), "single_post"), "Catégorie");
    assert.equal(win(ts, post({ id: 8, categories: ["Autre"] }), "single_post"), "Articles");
    assert.equal(win([ts[0]], post({ categories: [] }), "single_post"), "Général");
  });
  test("exclusion : l'emporte toujours, même sur une inclusion plus précise", () => {
    const ts = [T("single_post", "A", { include: [{ kind: "post", ids: [7] }], exclude: [{ kind: "post", category: ["Actualités"] }] }), T("single_post", "B", {})];
    assert.equal(win(ts, post(), "single_post"), "B");
    const r = resolve(ts, post(), { type: "single_post" }); assert.match(r.explain.find((e) => e.name === "A").reason, /Exclu/);
  });
  test("OU entre inclusions ; ET entre critères d'une condition ; catégorie parente (childCategory) ; étiquette sans casse", () => {
    const t = T("single_post", "X", { include: [{ kind: "post", ids: [999] }, { kind: "post", category: ["Nope"], tag: ["promo"] }, { kind: "post", childCategory: ["blog"] }] });
    assert.equal(win([t], post(), "single_post"), "X", "3e inclusion (sous-catégorie)");
    assert.equal(win([t], post({ categoryAncestors: [] }), "single_post"), null, "ET : catégorie absente");
  });
  test("pages enfants : direct vs descendants ; auteur ; page d'accueil", () => {
    const pg = (o) => ({ siteId: 1, view: "page", id: 20, authorId: 5, parents: [10, 2], ...o });
    const direct = T("single_page", "Direct", { include: [{ kind: "child_of", parent: 10, direct: true }] }), any = T("single_page", "Desc", { include: [{ kind: "child_of", parent: 2 }] });
    assert.equal(win([direct, any], pg(), "single_page"), "Direct"); assert.equal(win([direct, any], pg({ parents: [30, 2] }), "single_page"), "Desc"); assert.equal(win([direct, any], pg({ parents: [] }), "single_page"), null);
    const home = T("single_page", "Accueil", { include: [{ kind: "front_page" }] }), all = T("single_page", "Pages", { include: [{ kind: "page" }] });
    assert.equal(win([home, all], { siteId: 1, view: "front", id: 1 }, "single_page"), "Accueil");
    const au = T("single_page", "Auteur", { include: [{ kind: "author", ids: [5] }] }); assert.equal(win([au], pg(), "single_page"), "Auteur"); assert.equal(win([au], pg({ authorId: 6 }), "single_page"), null);
  });
  test("archives : sous-types, nom de catégorie, sous-catégories ; recherche ; 404 ; produits", () => {
    const arc = (k, name, anc = []) => ({ siteId: 1, view: "archive", archive: { kind: k, name, ancestors: anc } });
    const gen = T("archive", "Toutes", {}), cat = T("archive", "Cat Actu", { include: [{ kind: "archive", sub: "category", names: ["actualités"] }] }), kids = T("archive", "Sous-Blog", { include: [{ kind: "archive", sub: "category", names: ["blog"], child: true }] }), tag = T("archive", "Tag", { include: [{ kind: "archive", sub: "tag" }] });
    assert.equal(win([gen, cat, kids, tag], arc("category", "Actualités"), "archive"), "Cat Actu");
    assert.equal(win([gen, cat, kids, tag], arc("category", "Sport", ["Blog"]), "archive"), "Sous-Blog");
    assert.equal(win([gen, cat, kids, tag], arc("tag", "x"), "archive"), "Tag"); assert.equal(win([gen, cat, kids, tag], arc("author", "Zoé"), "archive"), "Toutes");
    assert.equal(win([T("search_results", "Rech", {})], { siteId: 1, view: "search" }, "search_results"), "Rech");
    assert.equal(win([T("not_found", "404", {})], { siteId: 1, view: "not_found" }, "not_found"), "404");
    const prod = T("single_product", "Fiche", { include: [{ kind: "product", category: ["chaussures"] }] });
    assert.equal(win([prod], { siteId: 1, view: "product", id: 3, categories: ["Chaussures"] }, "single_product"), "Fiche");
    assert.equal(win([T("product_archive", "Boutique", { include: [{ kind: "product_archive", sub: "shop" }] })], { siteId: 1, view: "product_archive", archive: { kind: "shop" } }, "product_archive"), "Boutique");
  });
  test("brouillon/archivé jamais appliqués ; type incompatible avec la vue ; en-tête global sur toute vue", () => {
    assert.equal(win([T("single_post", "B", {}, { status: "draft" })], post(), "single_post"), null);
    assert.equal(win([T("single_post", "A", {}, { status: "archived" })], post(), "single_post"), null);
    assert.equal(evaluate(T("single_post", "P", {}), { siteId: 1, view: "archive" }).state, "incompatible");
    for (const view of ["front", "post", "archive", "not_found", "product"]) assert.equal(win([T("header", "H", {})], { siteId: 1, view }, "header"), "H", view);
  });
  test("égalité de précision : plus récent d'abord, puis plus petit identifiant ; déterministe", () => {
    const a = T("header", "Ancien", {}, { publishedAt: "2026-01-01T00:00:00Z" }), b = T("header", "Récent", {}, { publishedAt: "2026-06-01T00:00:00Z" });
    assert.equal(win([a, b], { siteId: 1, view: "post" }, "header"), "Récent"); assert.equal(win([b, a], { siteId: 1, view: "post" }, "header"), "Récent");
    const c = T("header", "C", {}, { publishedAt: "2026-06-01T00:00:00Z" }); assert.equal(win([c, b], { siteId: 1, view: "post" }, "header"), "Récent", "id le plus petit");
  });
  test("explication : un état et une raison pour chaque modèle, un seul gagnant", () => {
    const ts = [T("single_post", "G", {}), T("single_post", "C", { include: [{ kind: "post", category: ["Actualités"] }] }), T("single_post", "Z", { include: [{ kind: "post", category: ["Zzz"] }] }), T("single_post", "D", {}, { status: "draft" })];
    const r = resolve(ts, post(), { type: "single_post" }); assert.equal(r.explain.filter((e) => e.state === "winner").length, 1);
    assert.deepEqual(r.explain.map((e) => e.state), ["candidate", "winner", "not_matching", "inactive"]); assert.ok(r.explain.every((e) => e.reason));
    assert.match(r.explain[0].reason, /plus précis/);
  });
});

describe("Conflits", () => {
  test("doublon exact = bloquant ; même précision sur contexte commun = avertissement ; disjoints = rien", () => {
    const a = T("header", "A", {}), b = T("header", "B", {}); assert.equal(conflicts([a, b])[0].severity, "blocking");
    const c = T("single_post", "C", { include: [{ kind: "post", category: ["X"] }] }), d = T("single_post", "D", { include: [{ kind: "post", category: ["Y"] }] }), e = T("single_post", "E", { include: [{ kind: "post", tag: ["t"] }] });
    assert.equal(conflicts([c, d]).length, 0, "catégories disjointes"); const w = conflicts([c, e]); assert.equal(w.length, 1); assert.equal(w[0].severity, "warning"); assert.ok(w[0].suggestion);
    assert.equal(conflicts([T("single_post", "P", { include: [{ kind: "post", ids: [1] }] }), T("single_post", "Q", { include: [{ kind: "post", ids: [2] }] })]).length, 0);
    assert.equal(conflicts([T("single_post", "G", {}), T("single_post", "S", { include: [{ kind: "post", ids: [1] }] })]).length, 0, "précisions différentes : pas de conflit");
    assert.equal(conflicts([T("header", "H", {}), T("footer", "F", {})]).length, 0, "types différents");
    assert.equal(conflicts([T("header", "H1", {}), T("header", "H2", {}, { status: "draft" })]).length, 0, "brouillon ignoré");
  });
});

describe("Conditions personnalisées", () => {
  test("enregistrées côté serveur seulement ; erreur dans check = ne correspond pas ; jamais saisies librement", () => {
    registerCondition("jour_ferie", { label: "Jours fériés", score: 55, check: (ctx, a) => a.on === true });
    assert.throws(() => registerCondition("jour_ferie", { label: "x", check() {} }), /déjà pris/);
    const t = T("header", "Noël", { include: [{ kind: "custom", id: "jour_ferie", args: { on: true } }] });
    assert.equal(win([t], { siteId: 1, view: "post" }, "header"), "Noël"); assert.equal(scoreOf(t.conditions.include[0]), 55);
    registerCondition("casse", { label: "Casse", check() { throw new Error("boum"); } });
    assert.equal(win([T("header", "K", { include: [{ kind: "custom", id: "casse" }] })], { siteId: 1, view: "post" }, "header"), null);
    assert.throws(() => normalize({ include: [{ kind: "custom", id: "fonction()" }] }), /inconnue/);
  });
});
