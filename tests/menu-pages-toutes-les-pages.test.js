// Menu « Pages » du CMS : un groupe déployable « Toutes les pages » ; « Composants » n'est plus affiché mais sa route et son fil d'Ariane restent.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nav = require("../src/marketing/web/cmsNav");

const all = () => true;
const principal = { siteId: null, principal: true, base: `${nav.BASE}/principal`, name: "Site principal", status: "active" };
const site = { siteId: 5, principal: false, base: `${nav.BASE}/sites/5`, name: "Site Cinq", status: "active" };
const pagesOf = (r) => r.sections.find((s) => s.key === "pages");

describe("menu Pages → Toutes les pages", () => {
  for (const [nom, space] of [["site principal", principal], ["site ordinaire", site]]) {
    test(`${nom} : « Pages » est un groupe (pas un lien direct) avec la seule entrée « Toutes les pages »`, () => {
      const r = nav.buildSiteNav({ can: all, active: "espace/pages", space });
      const g = pagesOf(r);
      assert.ok(g, "groupe Pages présent");
      assert.equal(g.label, "Pages");
      assert.equal(g.flat, false, "le groupe reste déployable");
      assert.deepEqual(g.items.map((i) => i.label), ["Toutes les pages"]);
      assert.equal(g.items[0].current, true, "entrée active sur la liste des pages");
      assert.equal(g.open, true);
      assert.ok(!r.sections.flatMap((s) => s.items).some((i) => i.label === "Composants"), "plus de « Composants » dans le menu");
    });
  }
  test("« Toutes les pages » mène à la liste réelle des pages du site courant", () => {
    const g = pagesOf(nav.buildSiteNav({ can: all, active: "espace/pages", space: site }));
    assert.match(g.items[0].href, /^\/marketing\/site-web\/sites\/5\/pages$/);
    const p = pagesOf(nav.buildSiteNav({ can: all, active: "espace/pages", space: principal }));
    assert.equal(p.items[0].href, "/marketing/pages");
  });
  test("la route « Composants » reste résolvable : groupe Pages ouvert, fil d'Ariane conservé, aucune entrée affichée", () => {
    const r = nav.buildCmsNav({ can: all, active: "espace/composants", space: site });
    assert.deepEqual(r.trail.map((t) => t.label), ["Site Web", "Mes sites", "Site Cinq", "Pages", "Composants"]);
    assert.equal(pagesOf(r).open, true);
    assert.deepEqual(pagesOf(r).items.map((i) => i.label), ["Toutes les pages"]);
  });
  test("sans le droit de lecture des pages, le groupe n'apparaît pas ; les autres groupes sont inchangés", () => {
    const r = nav.buildSiteNav({ can: (p) => p !== "forms.read", active: "espace/tableau-de-bord", space: site });
    assert.ok(!pagesOf(r));
    const withAll = nav.buildSiteNav({ can: all, active: "espace/pages", space: site });
    assert.deepEqual(withAll.sections.map((s) => s.key).filter((k) => k !== "pages"), nav.buildSiteNav({ can: all, active: "espace/tableau-de-bord", space: site }).sections.map((s) => s.key).filter((k) => k !== "pages"));
  });
});
