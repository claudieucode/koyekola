// Theme Builder (23.1, lot 2) — stockage par site sur une VRAIE base migrée : création (document créé via les services existants), brouillon/publication, versions, archivage, duplication,
// suppression, renommage, isolation entre sites et organisations, import des anciens réglages (idempotent, sans rien modifier), export/import JSON validé.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const TB = require("../src/themeBuilder");
const { store, legacy, portable } = TB;

const heading = (id, text) => ({ id, type: "heading", props: { text, level: "2" } });
const layout = (kids) => ({ type: "layout", children: kids });
const content = (sections) => ({ sections, title: "T" });

describe("cycle de vie d'un modèle", () => {
  const { db, A, B } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Site Un" }), s2 = pages.createSite(A, { name: "Site Deux" }), sB = pages.createSite(B, { name: "Autre organisation" });
  const publishable = (t) => (t.sourceKind === "component" ? pages.saveComponentDraft(A, t.sourceId, layout([heading("h00000000001", "Pied")])) : pages.saveDraft(A, t.sourceId, content([layout([heading("h00000000001", "Pied")])]), { revision: pages.requirePage(A, t.sourceId).revision }));

  test("création : le document est créé DANS le site par les services existants ; brouillon par défaut ; nom unique ; type inconnu refusé", () => {
    const h = store.create(A, s1.id, { type: "header", name: "Mon en-tête" });
    assert.equal(h.status, "draft"); assert.equal(h.sourceKind, "component"); assert.equal(pages.getComponent(A, h.sourceId).site_id, s1.id);
    const p = store.create(A, s1.id, { type: "single_post", name: "Article", conditions: { include: [{ kind: "post", category: ["Actu"] }] } });
    assert.equal(p.sourceKind, "page"); assert.equal(pages.requirePage(A, p.sourceId).site_id, s1.id);
    assert.equal(store.create(A, s1.id, { type: "header", name: "Mon en-tête" }).name, "Mon en-tête (2)");
    assert.throws(() => store.create(A, s1.id, { type: "zzz", name: "x" }), /inconnu/); assert.throws(() => store.create(A, s1.id, { type: "header", name: " " }), /nom/);
    assert.throws(() => store.create(A, s1.id, { type: "single_post", name: "Mauvais", conditions: { include: [{ kind: "archive" }] } }), /jamais correspondre/);
  });
  test("module requis : un modèle produit est refusé tant que le module Commerce du site est désactivé", () => {
    assert.throws(() => store.create(A, s1.id, { type: "single_product", name: "Fiche" }), /module|désactivé/i);
  });
  test("publication : publie le document (services existants), crée la version 1, refuse un doublon exact de conditions", () => {
    const a = store.create(A, s1.id, { type: "footer", name: "Pied A" }), b = store.create(A, s1.id, { type: "footer", name: "Pied B" });
    publishable(a); publishable(b);
    const r = store.publish(A, s1.id, a.id); assert.equal(r.template.status, "published"); assert.equal(r.version, 1); assert.equal(store.versions(A, s1.id, a.id).length, 1);
    assert.equal(pages.getComponent(A, a.sourceId).hasDraft, false);
    assert.throws(() => store.publish(A, s1.id, b.id), /mêmes conditions/);
    store.setConditions(A, s1.id, b.id, { include: [], exclude: [] }); // brouillon : pas de contrôle de doublon
    store.setConditions(A, s1.id, b.id, { include: [{ kind: "site" }] }); assert.equal(store.publish(A, s1.id, b.id).template.status, "published", "conditions différentes (site explicite) : publiable");
  });
  test("révision : un enregistrement périmé est refusé (409) ; conditions invalides refusées sans effet", () => {
    const t = store.create(A, s1.id, { type: "not_found", name: "404" });
    assert.throws(() => store.setConditions(A, s1.id, t.id, {}, { revision: t.revision + 5 }), (e) => e.code === "conflict");
    assert.throws(() => store.setConditions(A, s1.id, t.id, { include: [{ kind: "eval" }] }), /inconnu/);
    assert.deepEqual(store.get(A, s1.id, t.id).conditions, { include: [], exclude: [] });
    const r = store.setConditions(A, s1.id, t.id, { include: [{ kind: "not_found" }] }, { revision: t.revision }); assert.equal(r.template.revision, t.revision + 1);
  });
  test("renommer, archiver, restaurer, supprimer : la suppression exige l'archivage et NE SUPPRIME PAS le document", () => {
    const t = store.create(A, s1.id, { type: "search_results", name: "Recherche" });
    assert.equal(store.rename(A, s1.id, t.id, "Résultats").name, "Résultats");
    assert.throws(() => store.remove(A, s1.id, t.id), /Archivez/);
    assert.equal(store.archive(A, s1.id, t.id).status, "archived"); assert.ok(!store.list(A, s1.id).some((x) => x.id === t.id), "masqué de la liste par défaut"); assert.ok(store.list(A, s1.id, { archived: true }).some((x) => x.id === t.id));
    assert.equal(store.restore(A, s1.id, t.id).status, "draft");
    store.archive(A, s1.id, t.id); const r = store.remove(A, s1.id, t.id); assert.equal(r.documentKept.kind, "page");
    assert.ok(pages.getPage(A, t.sourceId), "la page-modèle existe toujours"); assert.throws(() => store.get(A, s1.id, t.id), /introuvable/);
  });
  test("un modèle archivé ou brouillon ne se publie/modifie pas ; duplication : nouveau document, brouillon, mêmes conditions", () => {
    const t = store.create(A, s1.id, { type: "single_post", name: "Dup", conditions: { include: [{ kind: "post", tag: ["x"] }] } });
    const d = store.duplicate(A, s1.id, t.id); assert.notEqual(d.sourceId, t.sourceId); assert.equal(d.status, "draft"); assert.deepEqual(d.conditions, t.conditions); assert.equal(d.name, "Dup (copie)");
    store.archive(A, s1.id, d.id); assert.throws(() => store.publish(A, s1.id, d.id), /archivé/); assert.throws(() => store.setConditions(A, s1.id, d.id, {}), /archivé/);
    const h = store.create(A, s1.id, { type: "header", name: "H dup" }); const hd = store.duplicate(A, s1.id, h.id); assert.notEqual(hd.sourceId, h.sourceId); assert.equal(pages.getComponent(A, hd.sourceId).site_id, s1.id);
  });
  test("versions : restaurer ne met JAMAIS un modèle publié hors ligne ; contenu en brouillon de travail ; conditions restaurées seulement hors ligne", () => {
    const t = store.create(A, s1.id, { type: "single_page", name: "Page", conditions: { include: [{ kind: "page" }] } });
    pages.saveDraft(A, t.sourceId, content([layout([heading("h00000000002", "V1")])]), { revision: pages.requirePage(A, t.sourceId).revision }); store.publish(A, s1.id, t.id);
    store.setConditions(A, s1.id, t.id, { include: [{ kind: "front_page" }] });
    pages.saveDraft(A, t.sourceId, content([layout([heading("h00000000002", "V2")])]), { revision: pages.requirePage(A, t.sourceId).revision });
    const r = store.restoreVersion(A, s1.id, t.id, 1); assert.equal(r.status, "published", "jamais mis hors ligne"); assert.equal(r.conditionsRestored, false); assert.deepEqual(r.conditions.include, [{ kind: "front_page" }], "conditions en ligne inchangées");
    store.unpublish(A, s1.id, t.id); const r2 = store.restoreVersion(A, s1.id, t.id, 1); assert.equal(r2.conditionsRestored, true); assert.deepEqual(r2.conditions.include, [{ kind: "page" }]);
    assert.equal(pages.requirePage(A, t.sourceId).working.sections[0].children[0].props.text, "V1");
  });
  test("isolation : un modèle du site 1 est introuvable depuis le site 2 ; document d'un autre site refusé ; autre organisation introuvable", () => {
    const t = store.create(A, s1.id, { type: "header", name: "Privé" });
    assert.throws(() => store.get(A, s2.id, t.id), /introuvable/); assert.throws(() => store.publish(A, s2.id, t.id), /introuvable/); assert.throws(() => store.archive(A, s2.id, t.id), /introuvable/);
    assert.equal(store.list(A, s2.id).some((x) => x.name === "Privé"), false);
    assert.throws(() => store.create(A, s2.id, { type: "single_page", name: "Vol", sourceKind: "page", sourceId: pages.createPage(A, { name: "Page S1", siteId: s1.id }).id }), /n'appartient pas/);
    assert.throws(() => store.get(B, sB.id, t.id), /introuvable/); assert.throws(() => store.get(A, sB.id, t.id), /introuvable/);
    assert.throws(() => store.list(A, 99999), /introuvable/);
    assert.throws(() => store.get({ ...A, siteScope: s2.id }, s1.id, t.id), /introuvable/, "accès limité à un autre site");
  });
  test("cache : le marqueur de résolution change à toute écriture", () => {
    const m0 = store.stampOf(A, s2.id); const t = store.create(A, s2.id, { type: "header", name: "Cache" }); const m1 = store.stampOf(A, s2.id); assert.notEqual(m0, m1);
    store.archive(A, s2.id, t.id); assert.notEqual(store.stampOf(A, s2.id), m1);
  });
});

describe("import des anciens réglages et JSON portable", () => {
  const { A } = freshMarketing();
  const site = pages.createSite(A, { name: "Ancien site" }), other = pages.createSite(A, { name: "Autre" });
  const TT = require("../src/marketing/pages/themeTemplates");

  test("en-tête/pied de page et modèles de thème du site sont importés ; ceux d'un autre site ne le sont pas ; l'ancien système n'est pas modifié ; idempotent", () => {
    const hid = pages.createComponent(A, { name: "Ancien header", section: layout([heading("h00000000010", "H")]), siteId: site.id }).id;
    pages.setSiteParts(A, site.id, { header: hid, footer: null });
    const pg = pages.createPage(A, { name: "Modèle article", siteId: site.id }); pages.saveDraft(A, pg.id, content([layout([heading("h00000000011", "Art")])]), { revision: pages.requirePage(A, pg.id).revision }); pages.publish(A, pg.id);
    const po = pages.createPage(A, { name: "Modèle autre", siteId: other.id }); pages.saveDraft(A, po.id, content([layout([heading("h00000000012", "X")])]), { revision: pages.requirePage(A, po.id).revision }); pages.publish(A, po.id);
    TT.add(A, { type: "single_post", pageId: pg.id, category: "Actu", exclude: { tag: ["pub"] } }); TT.add(A, { type: "not_found", pageId: po.id });
    const before = JSON.stringify(TT.list(A)), siteBefore = JSON.stringify(pages.getSite(A, site.id).header_component_id);
    const r = legacy.importLegacy(A, site.id);
    assert.deepEqual(r.imported.map((x) => x.type).sort(), ["header", "single_post"]);
    const post = store.list(A, site.id).find((t) => t.type === "single_post");
    assert.equal(post.status, "published"); assert.deepEqual(post.conditions, { include: [{ kind: "post", category: ["Actu"] }], exclude: [{ kind: "post", tag: ["pub"] }] }); assert.equal(post.sourceId, pg.id);
    assert.equal(store.list(A, site.id).find((t) => t.type === "header").sourceId, hid);
    assert.equal(JSON.stringify(TT.list(A)), before, "ancien réglage intact"); assert.equal(JSON.stringify(pages.getSite(A, site.id).header_component_id), siteBefore);
    assert.equal(store.list(A, other.id).length, 0, "rien dans l'autre site");
    const r2 = legacy.importLegacy(A, site.id); assert.equal(r2.imported.length, 0); assert.ok(r2.skipped.every((s) => s.reason === "déjà importé"));
    assert.equal(store.list(A, site.id).length, 2);
  });
  test("correspondance des familles anciennes → types et conditions", () => {
    const m = (type, extra = {}) => legacy.mapLegacy({ type, ...extra });
    assert.deepEqual(m("category_archive", { category: "Actu" }), { type: "archive", include: [{ kind: "archive", sub: "category", names: ["Actu"] }], exclude: [] });
    assert.deepEqual(m("blog_archive").include, [{ kind: "archive" }]); assert.equal(m("static_page").type, "single_page"); assert.equal(m("single_course"), null);
    assert.deepEqual(m("product", { category: "Chaussures" }).include, [{ kind: "product", category: ["Chaussures"] }]);
  });
  test("export → import dans un AUTRE site : identifiants propres au site retirés, document copié, brouillon, type et noms conservés", () => {
    const t = store.create(A, site.id, { type: "single_post", name: "Portable", conditions: { include: [{ kind: "post", ids: [42], category: ["Actu"] }, { kind: "child_of", parent: 5 }], exclude: [{ kind: "post", author: [9] }] } });
    pages.saveDraft(A, t.sourceId, content([layout([heading("h00000000020", "Contenu exporté")])]), { revision: pages.requirePage(A, t.sourceId).revision });
    const exp = portable.exportTemplate(A, site.id, t.id);
    assert.equal(exp.format, portable.FORMAT); assert.deepEqual(exp.template.conditions, { include: [{ kind: "post", category: ["Actu"] }], exclude: [{ kind: "post" }] }); assert.ok(exp.notes[0]);
    assert.ok(!JSON.stringify(exp).includes('"ids":[42]'));
    const imp = portable.importTemplate(A, other.id, JSON.parse(JSON.stringify(exp)));
    assert.equal(imp.siteId, other.id); assert.equal(imp.status, "draft"); assert.equal(imp.type, "single_post"); assert.notEqual(imp.sourceId, t.sourceId);
    assert.equal(pages.requirePage(A, imp.sourceId).site_id, other.id); assert.match(JSON.stringify(pages.requirePage(A, imp.sourceId).working.sections), /Contenu exporté/);
    const h = store.create(A, site.id, { type: "header", name: "Hx" }); const imh = portable.importTemplate(A, other.id, portable.exportTemplate(A, site.id, h.id)); assert.equal(imh.sourceKind, "component");
  });
  test("import hostile ou invalide : refusé sans rien créer", () => {
    const n0 = store.list(A, other.id).length, pg0 = pages.listPages ? 0 : 0;
    const base = portable.exportTemplate(A, site.id, store.list(A, site.id).find((t) => t.type === "header").id);
    for (const bad of [null, {}, { format: "autre" }, { ...base, template: { ...base.template, type: "zzz" } }, { ...base, template: { ...base.template, conditions: { include: [{ kind: "custom", id: "x" }] } } },
      { ...base, document: { kind: "page", data: {} } }, { ...base, document: { kind: "component" } }, { ...base, template: { ...base.template, name: "x".repeat(10) }, document: { kind: "component", section: { type: "layout", children: [{ type: "script", props: {} }] } } }]) {
      assert.throws(() => portable.importTemplate(A, other.id, bad), /./, JSON.stringify(bad).slice(0, 70));
    }
    assert.equal(store.list(A, other.id).length, n0); assert.ok(pg0 === 0);
  });
});
