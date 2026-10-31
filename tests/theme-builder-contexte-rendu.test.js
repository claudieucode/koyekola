// Theme Builder : résolution des modèles de PAGE et des parties globales pour TOUS les types (service, contextes réels : catégorie, étiquette, auteur, archive, recherche, 404,
// page statique), conditions combinées (inclusion, exclusion, priorité), isolation entre sites, invalidation du cache, repli journalisé d'un composant sans version publiée.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const R = require("../src/themeBuilder/render"), store = require("../src/themeBuilder/store");

const { A } = freshMarketing();
const s1 = pages.createSite(A, { name: "Site un" }), s2 = pages.createSite(A, { name: "Site deux" });
const doc = (name) => ({ title: name, sections: [{ id: "sect00000003", type: "layout", children: [{ id: "hed000000003", type: "heading", props: { text: name, level: "2" } }] }] });
// Crée et publie un modèle de PAGE ; renvoie l'identifiant de sa page
const page = (site, type, name, conditions = {}, publish = true) => {
  const t = store.create(A, site, { type, name, conditions });
  pages.saveDraft(A, t.sourceId, doc(name), { revision: pages.requirePage(A, t.sourceId).revision });
  if (publish) store.publish(A, site, t.id);
  return t;
};
const pick = (site, fam, o) => { const r = R.pickRegion(A, site, fam, o); return r && r.id; };

describe("modèles de page : contexte réel de chaque famille", () => {
  test("article : identifiant précis › catégorie › étiquette › auteur › général ; exclusion ; brouillon et autre site ignorés", () => {
    const gen = page(s1.id, "single_post", "Article général");
    const cat = page(s1.id, "single_post", "Article actualités", { include: [{ kind: "post", category: ["Actualités"] }] });
    const tag = page(s1.id, "single_post", "Article promo", { include: [{ kind: "post", tag: ["promo"] }] });
    const aut = page(s1.id, "single_post", "Article de l'auteur 7", { include: [{ kind: "post", author: [7] }] });
    const one = page(s1.id, "single_post", "Article n°42", { include: [{ kind: "post", ids: [42] }] });
    const sans = page(s1.id, "single_post", "Article sauf promo", { include: [{ kind: "post", category: ["Blog"] }], exclude: [{ kind: "post", tag: ["promo"] }] });
    page(s1.id, "single_post", "Article brouillon", { include: [{ kind: "post", category: ["Secret"] }] }, false);
    const other = page(s2.id, "single_post", "Article du site deux", { include: [{ kind: "post", category: ["Actualités"] }] });
    assert.equal(pick(s1.id, "single_post", { category: "Divers", postId: 1 }), gen.sourceId);
    assert.equal(pick(s1.id, "single_post", { category: "Actualités", postId: 1 }), cat.sourceId);
    assert.equal(pick(s1.id, "single_post", { category: "Divers", tags: ["promo"], postId: 1 }), tag.sourceId);
    assert.equal(pick(s1.id, "single_post", { category: "Divers", authorId: 7, postId: 1 }), aut.sourceId);
    assert.equal(pick(s1.id, "single_post", { category: "Actualités", tags: ["promo"], authorId: 7, postId: 42 }), one.sourceId, "l'identifiant est le plus précis");
    assert.equal(pick(s1.id, "single_post", { category: "Blog", postId: 5 }), sans.sourceId);
    assert.equal(pick(s1.id, "single_post", { category: "Blog", tags: ["promo"], postId: 5 }), tag.sourceId, "exclusion : le modèle « sauf promo » est écarté");
    assert.equal(pick(s1.id, "single_post", { category: "Secret", postId: 6 }), gen.sourceId, "brouillon ignoré");
    assert.equal(pick(s2.id, "single_post", { category: "Actualités" }), other.sourceId); assert.notEqual(pick(s2.id, "single_post", { category: "Actualités" }), cat.sourceId, "isolation");
    assert.equal(pick(null, "single_post", {}), null, "site principal : ancien système");
  });
  test("catégorie parente : « enfants de » un nom de catégorie via les ancêtres de l'article", () => {
    const parent = page(s1.id, "single_post", "Article sous Guides", { include: [{ kind: "post", childCategory: ["Guides"] }] });
    assert.equal(pick(s1.id, "single_post", { category: "Tutoriels", categories: ["Guides"], postId: 8 }), parent.sourceId);
  });
  test("archives : liste du blog, catégorie (avec enfants), étiquette, auteur ; le plus précis gagne ; recherche et 404 ; ordre des familles", () => {
    const all = page(s1.id, "archive", "Archives toutes");
    const blog = page(s1.id, "archive", "Archives blog", { include: [{ kind: "archive", sub: "blog" }] });
    const cat = page(s1.id, "archive", "Archives catégorie Actus", { include: [{ kind: "archive", sub: "category", names: ["Actus"] }] });
    const kids = page(s1.id, "archive", "Archives Guides et enfants", { include: [{ kind: "archive", sub: "category", names: ["Guides"], child: true }] });
    const tag = page(s1.id, "archive", "Archives étiquette", { include: [{ kind: "archive", sub: "tag", names: ["promo"] }] });
    const aut = page(s1.id, "archive", "Archives auteurs", { include: [{ kind: "archive", sub: "author" }] });
    const search = page(s1.id, "search_results", "Résultats de recherche");
    const nf = page(s1.id, "not_found", "Page 404");
    assert.equal(pick(s1.id, "blog_archive", {}), blog.sourceId);
    assert.equal(pick(s1.id, ["category_archive", "blog_archive"], { category: "Actus" }), cat.sourceId);
    assert.equal(pick(s1.id, ["category_archive", "blog_archive"], { category: "Autre" }), all.sourceId, "catégorie sans modèle propre : le général");
    assert.equal(pick(s1.id, ["category_archive", "blog_archive"], { category: "Tutoriels", categories: ["Guides"] }), kids.sourceId, "enfants d'une catégorie");
    assert.equal(pick(s1.id, ["tag_archive", "blog_archive"], { tag: "promo" }), tag.sourceId);
    assert.equal(pick(s1.id, ["author_archive", "blog_archive"], { authorId: 3 }), aut.sourceId);
    assert.equal(pick(s1.id, ["search_results", "blog_archive"], {}), search.sourceId);
    assert.equal(pick(s1.id, "not_found", {}), nf.sourceId);
    assert.equal(pick(s2.id, "not_found", {}), null, "aucun modèle 404 sur l'autre site");
  });
  test("page statique (à-propos) : modèle « Page individuelle » du site ; produit et archives produits inchangés ; famille inconnue ignorée", () => {
    const st = page(s1.id, "single_page", "Page individuelle");
    assert.equal(pick(s1.id, "static_page", {}), st.sourceId);
    assert.equal(pick(s1.id, "famille_inconnue", {}), null);
    assert.equal(R.regionContext(1, "famille_inconnue"), null);
    const c = R.regionContext(1, "category_archive", { category: "Actus", categories: ["Guides"], authorId: 4 });
    assert.deepEqual([c.view, c.archive.kind, c.archive.name, c.archive.ancestors], ["archive", "category", "Actus", ["Guides"]]);
    assert.equal(R.regionContext(1, "author_archive", { authorId: 4 }).archive.authorId, 4);
    assert.equal(R.regionContext(1, "search_results", {}).view, "search");
  });
});

describe("parties globales : en-tête et pied de page par contexte", () => {
  const mkPart = (site, type, name, cond = {}, publish = true) => { const t = store.create(A, site, { type, name, conditions: cond }); return publish ? store.publish(A, site, t.id).template : t; };
  test("résolution par vue : global, accueil, article, archive ; exclusion ; autre site ; sans modèle → aucune partie (repli historique)", () => {
    assert.deepEqual(R.resolveParts(A, s2.id, R.defaultContext(s2.id, "/")), { header: null, footer: null });
    assert.equal(R.hasParts(A, s2.id), false);
    const g = mkPart(s2.id, "header", "En-tête global"), home = mkPart(s2.id, "header", "En-tête accueil", { include: [{ kind: "front_page" }] }), foot = mkPart(s2.id, "footer", "Pied sauf 404", { exclude: [{ kind: "not_found" }] });
    assert.equal(R.hasParts(A, s2.id), true);
    const ctx = (v) => ({ siteId: s2.id, view: v, id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [] });
    assert.equal(R.resolveParts(A, s2.id, ctx("front")).header.id, home.id, "accueil : le plus précis");
    for (const v of ["page", "post", "archive", "search", "not_found", "product"]) assert.equal(R.resolveParts(A, s2.id, ctx(v)).header.id, g.id, v);
    assert.equal(R.resolveParts(A, s2.id, ctx("post")).footer.id, foot.id); assert.equal(R.resolveParts(A, s2.id, ctx("not_found")).footer, null, "exclusion de la 404");
    assert.equal(R.resolveParts(A, s1.id, ctx("front")).header, null, "aucun en-tête de l'autre site");
    assert.equal(R.defaultContext(5, "/").view, "front"); assert.equal(R.defaultContext(5, "/boutique").view, "page", "chemin complet, pas celui d'un routeur monté");
  });
  test("cache : publication, archivage et restauration changent la résolution immédiatement", () => {
    const t = mkPart(s2.id, "header", "En-tête temporaire", { include: [{ kind: "post" }] });
    const c = { siteId: s2.id, view: "post", id: 1, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [] };
    assert.equal(R.resolveParts(A, s2.id, c).header.id, t.id);
    store.archive(A, s2.id, t.id); assert.notEqual((R.resolveParts(A, s2.id, c).header || {}).id, t.id);
    store.restore(A, s2.id, t.id); assert.notEqual((R.resolveParts(A, s2.id, c).header || {}).id, t.id, "restauré = brouillon : jamais appliqué");
    store.publish(A, s2.id, t.id); assert.equal(R.resolveParts(A, s2.id, c).header.id, t.id);
  });
  test("un modèle dont le composant n'a plus de version publiée : repli sur l'ancien en-tête, journalisé une seule fois", () => {
    const s3 = pages.createSite(A, { name: "Site trois" });
    const t = mkPart(s3.id, "header", "En-tête orphelin");
    A.db.prepare("DELETE FROM mk_web_components WHERE id = ?").run(t.sourceId); // le document a disparu
    const logs = []; const orig = console.warn; console.warn = (m) => logs.push(String(m));
    try {
      const pg = pages.createPage(A, { name: "Page orpheline", siteId: s3.id, kind: "page" });
      const a = pages.withSiteParts(A, { id: pg.id, site_id: s3.id }, [], { themeBuilder: true }); const b = pages.withSiteParts(A, { id: pg.id, site_id: s3.id }, [], { themeBuilder: true });
      assert.deepEqual(a, b); assert.equal(a.length, 0, "aucun en-tête historique choisi : rien ne s'affiche, la page reste servie");
    } finally { console.warn = orig; }
    assert.equal(logs.filter((l) => /Theme Builder/.test(l)).length, 1, "journalisé une seule fois");
  });
});
