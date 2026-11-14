// Menu principal du CMS : « Boutique » est UNE seule entrée (lien direct vers l'espace Boutique) ; ses rubriques (Commandes, Clients, Réglages…)
// ne sont plus dupliquées dans ce menu (elles sont dans la navigation secondaire de l'espace Boutique) ; routes, droits et fil d'Ariane inchangés.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nav = require("../src/marketing/web/cmsNav");

const site = { siteId: 5, principal: false, base: "/marketing/site-web/sites/5", name: "Site Cinq", listHref: "/marketing/site-web/sites" };
const principal = { siteId: null, principal: true, base: "/marketing/site-web/principal", name: "Site principal", listHref: "/marketing/site-web/sites" };
const all = () => true;
const ECRANS = ["boutique", "boutique/commandes", "boutique/clients", "boutique/reglages"];

describe("Boutique : une seule entrée dans le menu principal", () => {
  for (const [nom, space] of [["site créé", site], ["site principal", principal]]) {
    test(`${nom} : un lien « Boutique » direct, sans sous-menus`, () => {
      const r = nav.buildSiteNav({ can: all, active: "boutique", space });
      const s = r.sections.find((x) => x.key === "boutique");
      assert.equal(s.flat, true, "section aplatie (aucun sous-menu)");
      assert.equal(s.items.length, 1);
      assert.equal(s.items[0].label, "Boutique");
      assert.match(s.items[0].href, /\/boutique$/, "mène à l'espace Boutique (rubrique par défaut)");
      const labels = r.sections.flatMap((x) => x.items.map((i) => i.label));
      for (const l of ["Commandes", "Clients", "Réglages de la boutique"]) assert.ok(!labels.includes(l), `${l} ne doit plus être dans le menu principal`);
    });
    test(`${nom} : l'entrée reste active sur tous les écrans de la Boutique (anciennes adresses comprises)`, () => {
      for (const active of ECRANS) {
        const r = nav.buildSiteNav({ can: all, active, space });
        assert.ok(r, active);
        const s = r.sections.find((x) => x.key === "boutique");
        assert.equal(s.items[0].current, true, `${active} : « Boutique » actif`);
        assert.equal(r.current.key, active, `${active} : l'écran courant est résolu`);
      }
    });
    test(`${nom} : les adresses des anciens écrans sont conservées dans le registre et le fil d'Ariane`, () => {
      const hrefs = Object.fromEntries(ECRANS.map((k) => [k, nav.buildSiteNav({ can: all, active: k, space }).current.href]));
      assert.match(hrefs["boutique/commandes"], /\/boutique\/commandes$/);
      assert.match(hrefs["boutique/clients"], /\/boutique\/clients$/);
      assert.match(hrefs["boutique/reglages"], /\/boutique\/reglages$/);
      const t = nav.buildSiteNav({ can: all, active: "boutique/commandes", space }).trail.map((x) => x.label);
      assert.deepEqual(t.slice(-2), ["Boutique", "Commandes"]);
    });
  }
  test("sans le droit shop.read, la Boutique n'apparaît pas", () => {
    const r = nav.buildSiteNav({ can: (p) => p !== "shop.read", active: "sitedash", space: site });
    assert.ok(!r.sections.some((x) => x.key === "boutique"));
  });
  test("le registre garde les 4 écrans (routes et droits inchangés)", () => {
    for (const k of ECRANS) { const i = nav.ALL.find((x) => x.key === k); assert.ok(i, k); assert.equal(i.permission, "shop.read", k); }
  });
});
