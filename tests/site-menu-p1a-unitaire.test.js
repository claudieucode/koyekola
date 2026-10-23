// Palier 3, lot P1a — inventaire du registre et de sa projection (aucun serveur) : ce qui est ouvert pour un site est exactement ce que le plan annonce.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const nav = require("../src/marketing/web/cmsNav");

const site = { siteId: 5, principal: false, base: "/marketing/site-web/sites/5", name: "Site Cinq", listHref: "/marketing/site-web/sites" };
const principal = { siteId: null, principal: true, base: "/marketing/site-web/principal", name: "Site principal", listHref: "/marketing/site-web/sites" };
const all = () => true;
const flat = (sections) => sections.flatMap((s) => s.items.map((i) => ({ ...i, group: s.key })));

describe("projection du registre (menu d'un site)", () => {
  test("les groupes du registre (sauf ceux, entièrement centraux, d'« Extensions ») sont tous présents, une fois, dans l'ordre du registre ; « Marketing du site » vient avant Outils", () => {
    const groups = nav.siteSections(site).map((s) => s.key);
    const registry = nav.SECTIONS.filter((s) => !s.centralOnly && s.key !== "extensions").map((s) => s.key); // « Mes sites » est le gestionnaire central ; « Extensions » est une fonction centrale (menu du principal seulement)
    assert.equal(nav.SECTIONS.length, 14); assert.equal(registry.length, 12);
    assert.deepEqual(groups.filter((g) => g !== "marketing"), registry);
    assert.equal(new Set(groups).size, groups.length);
    assert.equal(groups.indexOf("marketing"), groups.indexOf("outils") - 1);
  });
  test("chaque groupe emprunte son libellé et son icône au registre (pas de définition parallèle)", () => {
    for (const s of nav.siteSections(site)) { const reg = nav.SECTIONS.find((x) => x.key === s.key); if (reg) { assert.equal(s.label, reg.label, s.key); assert.equal(s.icon, reg.icon, s.key); } }
  });
  test("tout module ouvert par la table d'aptitude existe ; tout module délégué porte la clé de l'écran existant et figure parmi les écrans propres au site", () => {
    for (const [key, a] of Object.entries(nav.ABILITY)) { assert.ok(nav.ALL.some((i) => i.key === key), `clé hors registre : ${key}`); if (a.mode === "open") assert.ok(nav.SITE_MODULES[a.module], `module inconnu : ${a.module}`); }
    for (const [mod, m] of Object.entries(nav.SITE_MODULES)) if (m.kind === "delegate") { assert.ok(m.reg, mod); assert.ok(nav.isSiteScopedKey(m.reg), mod); assert.equal(nav.DELEGATED[mod], m.to); }
    for (const k of ["dashboard", "utilisateurs", "parametres", "seo"]) assert.equal(nav.isSiteScopedKey(k), false, `${k} n'ouvre pas l'espace d'un site`);
    assert.equal(nav.isSiteScopedKey("apparence"), true, "« Éditeur du site » (Apparence) est un écran partagé ouvert dans le cadre du site");
    // « landing » (écran d'UNE page et son éditeur) prend le cadre du site de la page, mais seulement si le serveur a vérifié un site (voir creation-page-contexte-site) : la liste centrale « ?site= » reste centrale
    assert.equal(nav.isSiteScopedKey("landing"), true);
    for (const k of ["navigation", "apparence/menus", "forms", "contacts", "articles", "articles/brouillons", "articles/categories", "articles/auteurs", "mediatheque", "commentaires", "commentaires/en-attente"]) assert.equal(nav.isSiteScopedKey(k), true, `${k} : contenu isolé par site (R5/R6), ouvert dans le cadre du site (R8 lot 2)`);
  });
  test("C1 : les entrées du registre non ouvertes à un site sont toutes visibles, grisées « Bientôt », sans lien ; une clé absente de la table est « Bientôt »", () => {
    const items = flat(nav.siteSections(site));
    for (const k of ["seo/meta", "utilisateurs/roles", "outils/importer", "outils/exporter", "corbeille"]) {
      const i = items.find((x) => x.key === k); assert.ok(i, k); assert.equal(i.status, "preview", k); assert.equal(i.disabled, true, k); assert.equal(i.href, null, k);
      assert.equal(i.label, nav.ALL.find((x) => x.key === k).label, `${k} : libellé du registre`);
    }
  });
  test("ce qui est réservé à l'administration centrale ou à un lot suivant n'a AUCUN lien dans un site", () => {
    const hrefs = flat(nav.siteSections(site)).map((i) => i.href || "").join(" ");
    for (const w of ["sauvegardes", "logs", "systeme", "outils/importer", "exporter", "diagnostic", "maintenance", "roles", "permissions", "invitations", "liens-casses", "/permaliens", "/parametres/"]) assert.ok(!hrefs.includes(w), `ne doit pas apparaître : ${w}`);
    assert.ok(!flat(nav.siteSections(site)).some((i) => i.href === `${site.base}/corbeille`), "la corbeille du site (Outils) reste fermée ; seules celles des articles et des commentaires sont ouvertes");
    const keys = flat(nav.siteSections(site)).map((i) => i.key);
    for (const k of ["outils/sauvegardes", "outils/systeme", "outils/logs"]) assert.ok(!keys.includes(k), `${k} reste dans l'administration centrale`);
  });
  test("aucun lien ne mène à un autre site ; les liens partagés passent par l'adresse du site (jamais par « ?site= »)", () => {
    const items = flat(nav.siteSections(site)).filter((i) => i.href);
    for (const i of items) { if (i.key === "apparence/personnaliser") { assert.equal(i.href, `${nav.BASE}/personnaliser?site=5`, "écran plein cadre : le site du menu, jamais un autre"); continue; } assert.ok(!/[?&]site=/.test(i.href), i.href); assert.ok(!/sites\/(?!5\/)\d+/.test(i.href), i.href); }
    for (const m of ["listes", "segments", "modeles-email", "campagnes", "automatisations", "tunnels", "tests-ab", "analytics", "outils"]) assert.ok(items.some((i) => i.href === `${site.base}/${m}`), m);
  });
  test("chaque entrée disparaît si l'utilisateur n'en a pas le droit (permission du registre ou du module d'origine)", () => {
    assert.deepEqual(nav.buildSiteNav({ can: () => false, active: "espace/pages", space: site }).sections, []);
    const r = nav.buildSiteNav({ can: (p) => p === "forms.read", active: "espace/pages", space: site });
    const keys = flat(r.sections).map((i) => i.key);
    assert.ok(keys.includes("landing") && keys.includes("pagetests"));
    for (const k of ["espace/listes", "espace/campagnes", "espace/analytics", "outils", "utilisateurs", "redirections"]) assert.ok(!keys.includes(k), k);
  });
  test("chaque écran existant retrouve son entrée par la clé qu'il porte déjà", () => {
    const expected = { pagetests: "pagetests", outils: "outils", lists: "espace/listes", segments: "espace/segments", templates: "espace/modeles-email", campaigns: "espace/campagnes", automations: "espace/automatisations", funnels: "espace/tunnels", "analytics-global": "espace/analytics", landing: "landing", sitedash: "sitedash", redirections: "redirections", utilisateurs: "utilisateurs" };
    for (const [active, key] of Object.entries(expected)) assert.equal(nav.buildSiteNav({ can: all, active, space: site }).current.key, key, active);
    assert.equal(nav.buildSiteNav({ can: all, active: "seo/meta", space: site }).current.disabled, true, "entrée grisée du menu, sans écran");
    assert.equal(nav.buildSiteNav({ can: all, active: "articles/ajouter", space: site }).current.href, `${site.base}/articles/ajouter`, "ouverte (équipe)");
  });
});

describe("espace du site principal", () => {
  test("le menu complet du registre est conservé : toutes les entrées, mêmes adresses historiques, plus Composants et Marketing du site", () => {
    const r = nav.buildSiteNav({ can: all, active: "espace/pages", space: principal });
    const hrefs = new Set(flat(r.sections).map((i) => i.href));
    // Le tableau de bord du principal est celui de SON espace ; « Mes sites » n'est pas une entrée d'espace
    for (const it of nav.ALL.filter((i) => i.key !== "sites" && i.key !== "sitedash")) assert.ok(hrefs.has(it.href), it.href);
    assert.ok(hrefs.has(`${principal.base}/tableau-de-bord`)); assert.ok(!hrefs.has(`${nav.BASE}/sites`));
    assert.equal(nav.ALL.length, 71); // WIDGETS : + « Widgets » ; PERSONNALISER : + « Personnaliser » (écran plein cadre) // POLICES : + « Polices » ; THEMES : + « Thèmes » ; MEDIA-01 : + « Ajouter un fichier média »
    assert.equal(r.sections.length, 14);
    assert.equal(flat(r.sections).length, 70 + 1 + 10); // THEMES : + « Thèmes » ; R8 lot 6D : + « Importer des contacts » dans Marketing
  });
  test("le menu global du principal (hors espace) est inchangé et ne contient aucune clé d'espace", () => {
    const g = nav.buildCmsNav({ can: all, active: "sites" });
    assert.deepEqual(g.sections.map((s) => s.key), ["sites"], "le menu central ne contient que « Mes sites » (gestion des sites)");
    assert.ok(!JSON.stringify(g).includes("espace/"));
  });
});
