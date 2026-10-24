// Correction de parité, lot C1 — UNE définition du menu (le registre SECTIONS), deux présentations (principal, site). Aucun serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nav = require("../src/marketing/web/cmsNav");

const site = { siteId: 5, principal: false, base: "/marketing/site-web/sites/5", name: "Site Cinq", listHref: "/marketing/site-web/sites" };
const principal = { siteId: null, principal: true, base: "/marketing/site-web/principal", name: "Site principal", listHref: "/marketing/site-web/sites" };
const all = () => true;
const CENTRAL = ["extensions", "outils/sauvegardes", "outils/systeme", "outils/logs"]; // décision D2 : administration centrale, hors du menu d'un site
const EXTENSIONS = ["espace/composants"]; // décision D3 : composants propres à chaque site (groupe Pages)
const registryKeys = nav.SECTIONS.flatMap((s) => s.items.map((i) => i.key));
// Rubrique dont toutes les entrées sont centrales (« Extensions ») : absente du menu d'un site, présente dans celui du principal
const siteGroups = () => nav.SECTIONS.filter((s) => !s.centralOnly && !s.items.every((i) => CENTRAL.includes(i.key)));

describe("C1 — une seule définition, deux présentations", () => {
  test("le principal et le site sortent de la MÊME fonction", () => {
    assert.equal(nav.siteSections, nav.projectSections);
    assert.equal(nav.principalSections, nav.projectSections);
  });
  test("mêmes groupes (clé, libellé, icône), dans le même ordre ; seul « Marketing du site » s'ajoute, avant Outils — dans les deux présentations", () => {
    // « Mes sites » (centralOnly) n'est PAS une rubrique du menu d'un espace : il est le gestionnaire central
    const reg = (space) => nav.SECTIONS.filter((s) => !s.centralOnly && (space.principal || !s.items.every((i) => CENTRAL.includes(i.key)))).map((s) => [s.key, s.label, s.icon]);
    for (const space of [site, principal]) {
      const got = nav.projectSections(space);
      assert.deepEqual(got.filter((g) => g.key !== "marketing").map((g) => [g.key, g.label, g.icon]), reg(space), space.principal ? "principal" : "site");
      assert.equal(got.findIndex((g) => g.key === "marketing"), got.findIndex((g) => g.key === "outils") - 1, "Marketing du site vient juste avant Outils");
    }
  });
  test("mêmes sous-entrées (clés), mêmes libellés, même ordre : le site = le registre − l'administration centrale (+ Composants)", () => {
    const sg = nav.projectSections(site);
    for (const reg of siteGroups()) {
      const g = sg.find((x) => x.key === reg.key);
      const expected = reg.items.filter((i) => !CENTRAL.includes(i.key));
      const got = g.items.filter((i) => !EXTENSIONS.includes(i.key));
      assert.deepEqual(got.map((i) => i.key), expected.map((i) => i.key), `${reg.key} : clés et ordre`);
      assert.deepEqual(got.map((i) => i.label), expected.map((i) => i.label).map((l, n) => (expected[n].key === "sitedash" ? "Tableau de bord" : l)), `${reg.key} : libellés`);
    }
    const dash = sg.find((x) => x.key === "dashboard").items[0];
    assert.equal(dash.label, "Tableau de bord", "seule différence de libellé : le tableau de bord d'un site n'est pas « du site principal »");
  });
  test("le principal : toutes les entrées du registre, libellés et adresses historiques inchangés (69 + Composants + 10 Marketing)", () => {
    const pg = nav.projectSections(principal);
    const items = pg.flatMap((g) => g.items);
    for (const reg of nav.ALL.filter((i) => i.key !== "sites")) { const got = items.find((i) => i.key === reg.key); assert.ok(got, reg.key); assert.equal(got.permission, reg.permission);
      // seule différence : dans son espace, le principal a le même « Tableau de bord » que les autres sites ; « Mes sites » n'est pas une entrée d'espace
      if (reg.key === "sitedash") { assert.equal(got.label, "Tableau de bord"); assert.equal(got.href, `${principal.base}/tableau-de-bord`); } else { assert.equal(got.label, reg.label); assert.equal(got.href, reg.href); } }
    assert.ok(!items.some((i) => i.key === "sites"), "pas de « Mes sites » dans le menu du principal")
    assert.equal(nav.ALL.length, 77); // FICHIERS-THEMES : + « Éditeur de fichiers »;  // ADMIN-NOTES : + « Admin Notes » // // WIDGETS : + « Widgets » ; PERSONNALISER : + « Personnaliser » (écran plein cadre) // POLICES : + « Polices » ; THEMES : + « Thèmes » ; MEDIA-01 : + « Ajouter un fichier média »
    assert.equal(items.length, 76 + 1 + 10); // EFFACER-DONNEES : + « Effacer les données » ; THEMES : + « Thèmes » ; 66 entrées de registre (sans « Mes sites ») ; R8 lot 6D : + « Importer des contacts » dans Marketing
  });
  test("les quatre fonctions centrales (Extensions, Sauvegardes, Informations système, Journal) n'apparaissent pas dans un site, et seulement elles ont disparu", () => {
    const keys = nav.projectSections(site).flatMap((g) => g.items).map((i) => i.key);
    for (const k of CENTRAL) assert.ok(!keys.includes(k), k);
    assert.deepEqual(registryKeys.filter((k) => !keys.includes(k)), ["sites", ...CENTRAL], "« Mes sites » (gestionnaire central) + les fonctions centrales");
  });
  test("les clés d'un site sont celles du registre (plus Composants et le groupe Marketing) : pas de clé inventée", () => {
    const keys = nav.projectSections(site).flatMap((g) => g.items.map((i) => i.key));
    const extra = keys.filter((k) => !registryKeys.includes(k));
    assert.deepEqual(extra.filter((k) => !EXTENSIONS.includes(k)).filter((k) => !/^espace\/(listes|segments|modeles-email|campagnes|automatisations|tunnels|analytics|formulaires|contacts|importer)$/.test(k)), []);
  });
  test("aucune entrée n'est ouverte à un site par défaut : une NOUVELLE entrée du registre est « Bientôt » dans un site et normale dans le principal", () => {
    const grp = nav.SECTIONS.find((s) => s.key === "pages");
    const fake = { key: "faux/nouvel-ecran", label: "Nouvel écran", href: "/marketing/site-web/faux", status: "live", permission: "forms.read" };
    grp.items.push(fake);
    try {
      const inSite = nav.projectSections(site).flatMap((g) => g.items).find((i) => i.key === "faux/nouvel-ecran");
      assert.equal(inSite.disabled, true); assert.equal(inSite.href, null); assert.equal(inSite.status, "preview");
      const inMain = nav.projectSections(principal).flatMap((g) => g.items).find((i) => i.key === "faux/nouvel-ecran");
      assert.equal(inMain.href, fake.href); assert.ok(!inMain.disabled);
    } finally { grp.items.pop(); }
  });
  test("exactement les écrans dont l'isolation est démontrée sont ouverts ; tout le reste est grisé", () => {
    const items = nav.projectSections(site).flatMap((g) => g.items).filter((i) => registryKeys.includes(i.key));
    const live = items.filter((i) => !i.disabled).map((i) => i.key).sort();
    assert.deepEqual(live, ["apparence", "apparence/en-tete", "apparence/fichiers", "apparence/menus", "apparence/personnaliser", "apparence/pied-de-page", "apparence/patterns", "apparence/polices", "apparence/styles", "apparence/templates", "apparence/themes", "apparence/widgets", "articles", "articles/ajouter", "articles/auteurs", "articles/brouillons", "articles/categories", "articles/corbeille", "articles/etiquettes", "articles/programmes", "articles/publies", "commentaires", "commentaires/approuves", "commentaires/corbeille", "commentaires/en-attente", "commentaires/indesirables", "corbeille", "landing", "mediatheque", "mediatheque/ajouter", "outils", "outils/cache", "outils/contenu", "outils/diagnostic", "outils/donnees", "outils/effacer-donnees", "outils/notes", "outils/exporter", "outils/importer", "outils/maintenance", "pagetests", "parametres", "parametres/avance", "parametres/ecriture", "parametres/commentaires", "parametres/connecteurs", "parametres/confidentialite", "parametres/emailing", "parametres/indexation", "parametres/lecture", "parametres/medias", "parametres/permaliens", "parametres/seo", "parametres/tunnels", "redirections", "seo", "seo/404", "seo/analyse", "seo/meta", "seo/indexation", "seo/sitemap", "seo/schema", "seo/open-graph", "seo/robots", "sitedash", "utilisateurs", "utilisateurs/ajouter", "utilisateurs/invitations", "utilisateurs/permissions", "utilisateurs/roles"].sort()); // R8 lot 6C : + SEO du site et erreurs 404 ; R8 lot 2 : + médias, articles, commentaires (isolation R5/R6)
    for (const i of items.filter((x) => x.disabled)) { assert.equal(i.href, null, i.key); assert.equal(i.status, "preview", i.key); assert.ok(i.phase, `${i.key} : lot annoncé`); }
    for (const k of ["redirections/liens-casses", "redirections/permaliens"]) assert.equal(items.find((i) => i.key === k).disabled, true, k);
  });
  test("chaque entrée ouverte garde la permission de l'écran d'origine (celle du registre)", () => {
    for (const i of nav.projectSections(site).flatMap((g) => g.items).filter((x) => registryKeys.includes(x.key))) assert.equal(i.permission, nav.ALL.find((r) => r.key === i.key).permission, i.key);
  });
  test("aucun aplatissement : Utilisateurs, Outils et Paramètres gardent leur titre de groupe et toutes leurs sous-entrées, même grisées", () => {
    const r = nav.buildSiteNav({ can: all, active: "landing", space: site });
    const g = Object.fromEntries(r.sections.map((s) => [s.key, s]));
    for (const [k, n] of [["utilisateurs", 5], ["outils", 11], ["parametres", 13], ["apparence", 12], ["articles", 9], ["commentaires", 5], ["seo", 9], ["redirections", 3]]) {
      assert.equal(g[k].flat, false, `${k} ne doit pas être aplati`); assert.equal(g[k].items.length, n, k);
      assert.equal(g[k].label, nav.SECTIONS.find((s) => s.key === k).label, k);
    }
  });
  test("le même groupe se présente de la même façon dans le principal et dans un site (aplatissement = nombre d'entrées visibles, comme dans le registre)", () => {
    const a = nav.buildSiteNav({ can: all, active: "landing", space: site }).sections, b = nav.buildSiteNav({ can: all, active: "landing", space: principal }).sections;
    for (const g of a.filter((x) => x.key !== "marketing" && x.key !== "pages" && x.key !== "outils")) assert.equal(g.flat, b.find((x) => x.key === g.key).flat, g.key);
  });
  test("entrée active : un écran ouvert met en évidence SA propre entrée, qui est celle du registre", () => {
    for (const [active, key] of Object.entries({ landing: "landing", sitedash: "sitedash", pagetests: "pagetests", outils: "outils", redirections: "redirections", utilisateurs: "utilisateurs", "espace/reglages": "parametres", "espace/equipe": "utilisateurs", "espace/pages": "landing" })) {
      const r = nav.buildSiteNav({ can: all, active, space: site });
      assert.equal(r.current.key, key, active);
      assert.equal(r.sections.flatMap((s) => s.items).filter((i) => i.current).length, 1, `${active} : une seule entrée active`);
    }
  });
});
