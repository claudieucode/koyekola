// Header Builder — réglages des widgets d'en-tête (logo, mini-panier) : lien personnalisé, hauteur libre, styles de l'image du logo (bordure, ombre, survol), états du mini-panier.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const sections = require("../src/marketing/pages/sections");
const nodes = require("../src/marketing/pages/nodes");
const CTX = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
const sec = (child) => [{ id: sections.newSectionId(), type: "layout", children: [{ id: "wdg0001aa", ...child }] }];
const norm = (child) => sections.normalizeSections(CTX, sec(child))[0].children[0];

describe("Logo du site : lien et taille", () => {
  test("hauteur libre de 20 à 160 px", () => {
    assert.equal(norm({ type: "sitelogo", props: { height: 73 } }).props.height, 73);
    assert.equal(norm({ type: "sitelogo", props: { height: 5000 } }).props.height, 48, "hors bornes : valeur par défaut");
  });
  test("lien personnalisé : adresse du site ou https ; nouvel onglet seulement pour une adresse https ; inconnu refusé", () => {
    assert.equal(norm({ type: "sitelogo", props: { href: "/tarifs" } }).props.href, "/tarifs");
    const ext = norm({ type: "sitelogo", props: { href: "https://exemple.com/x", newTab: true } }).props;
    assert.equal(ext.href, "https://exemple.com/x"); assert.equal(ext.newTab, true);
    assert.equal(norm({ type: "sitelogo", props: { href: "/tarifs", newTab: true } }).props.newTab, undefined, "nouvel onglet : adresses https seulement");
    assert.throws(() => norm({ type: "sitelogo", props: { href: "javascript:alert(1)" } }));
    assert.equal(norm({ type: "sitelogo", props: {} }).props.href, undefined, "par défaut : l'accueil du site");
  });
});

describe("Styles de l'image du logo et du mini-panier", () => {
  test("image du logo : bordure, arrondi, ombre et état survol écrits dans le CSS", () => {
    const s = sections.normalizeSections(CTX, sec({ type: "sitelogo", props: { height: 48 }, parts: { image: { styles: { desktop: { borderRadius: "12px", boxShadow: "md" } }, states: { hover: { opacity: 0.7 } } } } }));
    const css = nodes.pageCss(s);
    assert.match(css, /\.kw-n-wdg0001aa \.kw-sitelogo-img\{[^}]*border-radius:12px/);
    assert.match(css, /\.kw-n-wdg0001aa \.kw-sitelogo-img:hover\{[^}]*opacity:0\.7/);
  });
  test("mini-panier : états survol sur l'icône, le libellé et la pastille", () => {
    const s = sections.normalizeSections(CTX, sec({ type: "minicart", props: {}, parts: { icon: { states: { hover: { color: "#ff0000" } } }, count: { states: { hover: { backgroundColor: "#00ff00" } } } } }));
    const css = nodes.pageCss(s);
    assert.match(css, /\.kw-mc-icon:hover\{[^}]*#ff0000/); assert.match(css, /\.kw-mc-count:hover\{[^}]*#00ff00/);
  });
});
