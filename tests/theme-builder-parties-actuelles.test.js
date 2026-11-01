// Theme Builder — le pied de page / l'en-tête QUE LE SITE AFFICHE doivent être modifiables : adoption des parties actuelles, remplacement explicite à la publication, isolation par site.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const { store, legacy } = require("../src/themeBuilder");

const text = (id, t) => ({ id, type: "heading", props: { text: t, level: "2" } });
const layout = (kids) => ({ type: "layout", children: kids });

describe("parties actuelles du site", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" }), s2 = pages.createSite(A, { name: "Deux" });
  const real = pages.createComponent(A, { name: "Pied réel", site_id: s1.id, section: layout([text("f00000000001", "Hello dribbblers")]) });
  pages.publishComponent(A, real.id);
  pages.setSiteParts(A, s1.id, { header: null, footer: real.id });

  test("adoptSiteParts reprend le pied affiché (publié, tout le site), une seule fois, sans toucher au document", () => {
    const first = legacy.adoptSiteParts(A, s1.id);
    assert.equal(first.length, 1); assert.equal(first[0].type, "footer");
    assert.equal(legacy.adoptSiteParts(A, s1.id).length, 0, "idempotent");
    const t = store.list(A, s1.id).find((x) => x.type === "footer");
    assert.equal(t.status, "published"); assert.equal(t.sourceId, real.id);
    assert.equal(pages.getComponent(A, real.id).section.children[0].props.text, "Hello dribbblers");
  });
  test("isolation : l'autre site n'adopte rien", () => {
    assert.equal(legacy.adoptSiteParts(A, s2.id).length, 0); assert.equal(store.list(A, s2.id).length, 0);
  });
  test("un nouveau pied identique est refusé sans remplacement, accepté avec : l'ancien repasse en brouillon, rien n'est supprimé", () => {
    const n = store.create(A, s1.id, { type: "footer", name: "Une ligne" });
    pages.saveComponentDraft(A, n.sourceId, layout([text("f00000000002", "Nouveau")]));
    assert.throws(() => store.publish(A, s1.id, n.id), /mêmes conditions/);
    const r = store.publish(A, s1.id, n.id, { replace: true });
    assert.equal(r.template.status, "published"); assert.deepEqual(r.replaced.map((o) => o.name), ["Pied réel"]);
    const old = store.list(A, s1.id).find((x) => x.sourceId === real.id);
    assert.equal(old.status, "draft"); assert.ok(pages.getComponent(A, real.id), "document de l'ancien pied conservé");
  });
  test("replace n'agit jamais sur un autre site ni un autre type", () => {
    const h = store.create(A, s1.id, { type: "header", name: "Entête" });
    pages.saveComponentDraft(A, h.sourceId, layout([text("h00000000001", "H")]));
    const r = store.publish(A, s1.id, h.id, { replace: true });
    assert.deepEqual(r.replaced, []); assert.equal(store.list(A, s1.id).filter((x) => x.type === "footer" && x.status === "published").length, 1);
  });
});
