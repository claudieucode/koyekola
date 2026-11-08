// Pieds de page : IDENTITÉ PROPRE (palette fixe, polices de la bibliothèque locale), aucune couleur de la charte du site ni de l'administration. Statique.
// Voir docs/theme-builder/kolakisa-footer-library.md.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const Catalog = require("../src/themeBuilder/catalog");
const Footer = require("../src/themeBuilder/catalog/footer");
const fontLib = require("../src/utils/fontLibrary");

const BASE = ["clair", "marque", "nuit", "editorial", "doux"];
const all = Catalog.entries("footer");
const doc = (key) => Catalog.build("footer", key).section;
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };

describe("Pieds de page : identité propre", () => {
  test("100 modèles, aucune identité du site, au moins 30 identités distinctes, clés de modèles uniques", () => {
    assert.equal(all.length, 100);
    assert.ok(all.every((e) => !BASE.includes(e.skinKey)));
    assert.ok(new Set(all.map((e) => e.skinKey)).size >= 30);
    assert.equal(new Set(all.map((e) => e.layoutId)).size, 100);
  });
  test("couleurs fixes (aucun jeton du site) et polices de la bibliothèque locale", () => {
    for (const e of all) assert.ok(!JSON.stringify(doc(e.key)).includes('"token:'), `${e.key} : couleur de la charte du site`);
    for (const id of Footer.skins) {
      for (const f of [id.font, id.head]) assert.ok(fontLib.isId(f), `${id.key} : police « ${f} » absente`);
      for (const c of [id.bg, id.fg, id.accent, id.onAccent]) assert.match(c, /^#[0-9a-f]{6}$/i, `${id.key} : couleur ${c}`);
    }
  });
  test("typographie propre : texte, liens, boutons ; menu, compte, logo et recherche via les parties du widget", () => {
    for (const e of all) {
      const id = Footer.skins.find((x) => x.key === e.skinKey);
      walk(doc(e.key).children, (n) => {
        const f = n.styles && n.styles.desktop && n.styles.desktop.fontFamily;
        // la police du texte, ou celle des titres de la MÊME identité (un grand lien d'index ou de pied-affiche prend la police de titre) : jamais une police étrangère à l'identité
        if (["menu", "link", "button"].includes(n.type)) assert.ok(f === id.font || f === id.head, `${e.key} : ${n.type} ${f} (identité ${id.font} / ${id.head})`);
        if (["sitelogo", "sitetitle"].includes(n.type)) assert.equal(f, id.head, `${e.key} : ${n.type}`);
        if (n.type === "menu") assert.equal(n.parts.link.styles.desktop.fontFamily, id.font, `${e.key} : lien du menu`);
        if (n.type === "sitelogo") assert.equal(n.parts.text.styles.desktop.fontFamily, id.head, `${e.key} : texte du logo`);
      });
    }
  });
  test("contraste du texte sur le fond d'au moins 4,5 pour chaque identité", () => {
    const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    for (const id of Footer.skins) {
      assert.ok(ratio(id.fg, id.bg) >= 4.5, `${id.key} : texte/fond ${ratio(id.fg, id.bg).toFixed(2)}`);
      assert.ok(ratio(id.mute, id.bg) >= 4.5, `${id.key} : texte secondaire/fond ${ratio(id.mute, id.bg).toFixed(2)}`);
      assert.ok(ratio(id.onAccent, id.accent) >= 4.5, `${id.key} : bouton ${ratio(id.onAccent, id.accent).toFixed(2)}`);
    }
  });
});
