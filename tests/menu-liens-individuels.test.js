// Menu : réglages INDIVIDUELS de chaque lien (couleurs, typographie, états, écrans, sous-menu, icône, badge) — sans serveur : validation, enregistrement, règles CSS, indépendance des autres liens.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");

const items = [{ label: "Accueil", url: "/" }, { label: "Boutique", url: "/boutique", children: [{ label: "Chaussures", url: "/c" }] }, { label: "Contact", url: "/contact" }];
const doc = (itemStyles) => [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [{ id: "menu00000001", type: "menu", props: { label: "Navigation", items, ...(itemStyles ? { itemStyles } : {}) } }] }] }];
const save = (itemStyles) => { const { A } = freshMarketing(); const p = pages.createPage(A, { name: "Menu", kind: "page" }); return pages.saveDraft(A, p.id, { sections: doc(itemStyles) }, { revision: pages.getPage(A, p.id).revision }); };
const rich = { p1: { link: { styles: { desktop: { color: "#c2410c", fontWeight: "700", letterSpacing: "1px", backgroundColor: "#fff7ed", borderRadius: "999px", paddingLeft: "14px" }, mobile: { fontSize: "18px" } }, states: { hover: { color: "#7c2d12", backgroundColor: "#ffedd5" }, focus: { color: "#000" } }, current: { desktop: { color: "#9a3412" } } }, sub: { styles: { desktop: { backgroundColor: "#111827", borderRadius: "12px" } } }, badge: { styles: { desktop: { backgroundColor: "#dc2626", color: "#fff" } } } } };

describe("menu : réglages individuels des liens", () => {
  test("enregistrés et relus à l'identique ; autres liens inchangés", () => {
    const r = save(rich);
    const menu = r.content.sections[0].children[0].children[0];
    assert.deepEqual(Object.keys(menu.props.itemStyles), ["p1"]);
    assert.equal(menu.props.itemStyles.p1.link.styles.desktop.color, "#c2410c");
    assert.equal(menu.props.itemStyles.p1.link.states.hover.backgroundColor, "#ffedd5");
  });
  test("règles CSS : uniquement le lien visé, états, écran, page courante, sous-menu, badge", () => {
    const css = nodes.pageCss(save(rich).content.sections);
    assert.match(css, /\.kw-node\.kw-n-menu00000001 li\[data-ik="p1"\]>\.kw-menu-link\{[^}]*color:#c2410c/);
    assert.match(css, /li\[data-ik="p1"\]>\.kw-menu-link:hover\{[^}]*#ffedd5/);
    assert.match(css, /li\[data-ik="p1"\]>\.kw-menu-link:focus-visible\{/);
    assert.match(css, /@media[^{]*\{[^]*li\[data-ik="p1"\]>\.kw-menu-link\{[^}]*font-size:18px/);
    assert.match(css, /li\[data-ik="p1"\]>\.kw-menu-link\[aria-current\]\{[^}]*#9a3412/);
    assert.match(css, /li\[data-ik="p1"\]>\.kw-submenu\{[^}]*#111827/);
    assert.match(css, /li\[data-ik="p1"\]>\.kw-menu-link \.kw-menu-badge\{[^}]*#dc2626/);
    assert.doesNotMatch(css, /data-ik="p0"|data-ik="p2"/, "les autres liens ne reçoivent aucune règle");
  });
  test("clé du menu du CMS (m12) : sélecteur par identifiant", () => {
    const css = nodes.pageCss(save({ m12: { link: { styles: { desktop: { color: "#0a0" } } } } }).content.sections);
    assert.match(css, /li\[data-mid="12"\]>\.kw-menu-link\{[^}]*color:#0a0/);
  });
  test("valeurs et clés invalides refusées (aucun CSS libre)", () => {
    assert.throws(() => save({ "x;}body{": { link: { styles: { desktop: { color: "#fff" } } } } }), /identifiant de lien invalide/);
    assert.throws(() => save({ p0: { link: { styles: { desktop: { color: "url(javascript:1)" } } } } }));
    assert.throws(() => save("nimporte"), /invalides/);
  });
  test("sans réglage : aucun attribut de style ajouté ; rendu du lien inchangé", () => {
    const css = nodes.pageCss(save(null).content.sections);
    assert.doesNotMatch(css, /data-ik/);
  });
});

describe("menu : réglages du panneau mobile", () => {
  const withPanel = (panelStyles) => { const { A } = freshMarketing(); const p = pages.createPage(A, { name: "Panneau", kind: "page" }); const d = doc(null); d[0].children[0].children[0].props.panelStyles = panelStyles; return pages.saveDraft(A, p.id, { sections: d }, { revision: pages.getPage(A, p.id).revision }); };
  test("panneau, fond assombri, fermeture et liens : règles rattachées au menu, états inclus", () => {
    const css = nodes.pageCss(withPanel({ panel: { styles: { desktop: { backgroundColor: "#0f172a", width: "320px" } } }, backdrop: { styles: { desktop: { backgroundColor: "#00000099" } } }, close: { styles: { desktop: { color: "#fff" } }, states: { hover: { color: "#fbbf24" } } }, links: { styles: { desktop: { fontSize: "22px", color: "#e2e8f0" } } } }).content.sections);
    assert.match(css, /\.kw-menu-panel\.kw-pn-menu00000001\{[^}]*#0f172a/);
    assert.match(css, /\.kw-menu-backdrop\.kw-pn-menu00000001\{[^}]*#00000099/);
    assert.match(css, /\.kw-menu-panel\.kw-pn-menu00000001 \.kw-menu-close:hover\{[^}]*#fbbf24/);
    assert.match(css, /\.kw-menu-panel\.kw-pn-menu00000001 \.kw-menu-link\{[^}]*font-size:22px/);
  });
  test("partie inconnue refusée", () => assert.throws(() => withPanel({ nimporte: { styles: { desktop: { color: "#fff" } } } }), /pas une partie du panneau/));
});
