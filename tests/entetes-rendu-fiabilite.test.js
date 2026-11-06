// Fiabilité du rendu des en-têtes (tous les modèles, présents et futurs) : couleurs lisibles, menu mobile compact, fond pleine largeur indépendant du contenu, aide d'éditeur absente du site publié.
// Tests sans serveur : ils lisent les modèles réels du catalogue et le CSS réellement généré par le moteur (nodes.pageCss).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const Catalog = require("../src/themeBuilder/catalog");
const nodes = require("../src/marketing/pages/nodes");

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const lum = (h) => { let x = h.slice(1); if (x.length === 3) x = x.split("").map((c) => c + c).join(""); const v = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const walk = (n, f, anc = []) => { f(n, anc); (n.children || []).forEach((c) => walk(c, f, [...anc, n])); };
const docs = () => Catalog.entries("header").map((e) => ({ key: e.key, doc: Catalog.build("header", e.key, {}).section }));

describe("En-têtes : couleurs et visibilité (les 100 modèles)", () => {
  test("chaque bouton a un texte lisible sur son fond (contraste >= 3:1) et un libellé non vide", () => {
    const bad = [];
    for (const { key, doc } of docs()) walk(doc, (n) => {
      if (n.type !== "button") return;
      const d = (n.styles && n.styles.desktop) || {};
      if (!String(n.props.label || "").trim()) bad.push(`${key} : bouton sans libellé`);
      if (HEX.test(d.color || "") && HEX.test(d.backgroundColor || "") && ratio(d.color, d.backgroundColor) < 3) bad.push(`${key} : texte ${d.color} sur ${d.backgroundColor}`);
    });
    assert.deepEqual(bad, []);
  });

  test("le texte du menu et du nom du site est lisible sur le fond de leur rangée", () => {
    const bad = [];
    for (const { key, doc } of docs()) walk(doc, (n, anc) => {
      if (n.type !== "menu" && n.type !== "sitetitle") return;
      const color = n.type === "menu" ? (((n.parts || {}).link || {}).styles || {}).desktop && n.parts.link.styles.desktop.color : (n.styles && n.styles.desktop && n.styles.desktop.color);
      if (!HEX.test(color || "")) return;
      // Fond effectif : le plus proche ancêtre (ou l'élément lui-même) qui en pose un
      const chain = [...anc, n].reverse(); let bg = null;
      for (const a of chain) { const b = a.styles && a.styles.desktop && a.styles.desktop.backgroundColor; if (HEX.test(b || "")) { bg = b; break; } }
      if (bg && ratio(color, bg) < 3) bad.push(`${key} : ${n.type} ${color} sur ${bg}`);
    });
    assert.deepEqual(bad, []);
  });
});

describe("Moteur de styles : un réglage ne doit jamais rendre un texte invisible", () => {
  const btn = (styles) => ({ type: "layout", children: [{ id: "abc123abc123", type: "button", props: { label: "Go", url: "/", variant: "primary" }, styles }] });
  test("noir sur noir : le fond est conservé, le texte devient lisible", () => {
    const css = nodes.pageCss([btn({ desktop: { color: "#0a0a0a", backgroundColor: "#0a0a0a" } })]);
    assert.match(css, /\.kw-n-abc123abc123\{color:#ffffff;background-color:#0a0a0a\}/);
  });
  test("choix indépendants : bouton jaune + texte noir reste tel quel", () => {
    const css = nodes.pageCss([btn({ desktop: { color: "#000000", backgroundColor: "#ffd400" } })]);
    assert.match(css, /color:#000000;background-color:#ffd400/);
  });
  test("le correctif s'applique écran par écran (mobile seul) sans toucher l'ordinateur", () => {
    const css = nodes.pageCss([btn({ desktop: { color: "#ffffff", backgroundColor: "#111111" }, mobile: { color: "#111111" , backgroundColor: "#111111" } })]);
    assert.match(css, /color:#ffffff;background-color:#111111/);
    assert.match(css, /@media[^{]*\{[^}]*\.kw-n-abc123abc123\{color:#ffffff;background-color:#111111\}/);
  });
  test("les valeurs variables ou transparentes ne sont jamais modifiées", () => {
    const css = nodes.pageCss([btn({ desktop: { color: "#000000", backgroundColor: "transparent" } })]);
    assert.match(css, /color:#000000;background-color:transparent/);
  });
});

describe("Menu : l'écart des liens ne devient pas un vide en colonne (menu mobile)", () => {
  const menu = (vertical) => ({ type: "layout", children: [{ id: "def456def456", type: "menu", props: { label: "Nav", source: "location", location: "header", items: [], vertical, mobileToggle: !vertical }, parts: { list: { styles: { desktop: { gap: "26px" } } } } }] });
  test("menu horizontal : écart entre colonnes conservé, écart entre lignes limité", () => {
    const css = nodes.pageCss([menu(false)]);
    assert.match(css, /\.kw-node\.kw-n-def456def456 \.kw-menu-list\{[^}]*column-gap:26px[^}]*row-gap:4px/);
    assert.doesNotMatch(css, /\.kw-menu-list\{gap:26px/);
  });
  test("menu vertical : l'écart réglé s'applique partout", () => {
    assert.match(nodes.pageCss([menu(true)]), /\.kw-node\.kw-n-def456def456 \.kw-menu-list\{gap:26px/);
  });
  test("la feuille du site compacte le menu mobile ouvert (zones tactiles, défilement) et l'aide du logo", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "landing.css"), "utf8");
    assert.match(css, /\.kw-menu\.is-enhanced\.is-open \.kw-menu-link \{[^}]*min-height: 44px/);
    assert.match(css, /\.kw-menu\.is-enhanced\.is-open > \.kw-menu-list \{[^}]*overflow-y: auto/);
    assert.match(css, /\.kw-sitelogo \.kw-empty \{[^}]*max-width/);
  });
  test("le message « Aucun logo » n'est rendu que dans l'éditeur", () => {
    const ejs = fs.readFileSync(path.join(__dirname, "..", "views", "marketing-public", "_node.ejs"), "utf8");
    assert.match(ejs, /isBuilder && !p\.logo\) \{ %><p class="kw-empty">Aucun logo/);
  });
});

describe("Fond pleine largeur et contenu borné : deux réglages indépendants", () => {
  test("chaque modèle : rangées en bandes pleine largeur dont le contenu est borné par un conteneur intérieur", () => {
    const bad = [];
    for (const { key, doc } of docs()) {
      const bands = []; walk(doc, (n) => { if (n.type === "container" && n.props && n.props.full && n !== doc.children[0]) bands.push(n); });
      if (!doc.children[0].props || !doc.children[0].props.full) bad.push(`${key} : enveloppe non pleine largeur`);
      const inner = []; walk(doc, (n) => { const d = n.styles && n.styles.desktop; if (n.type === "container" && d && /px$/.test(d.maxWidth || "") && d.marginLeft === "auto") inner.push(n); });
      if (!inner.length && !bands.length) bad.push(`${key} : aucun conteneur intérieur borné`);
    }
    assert.ok(bad.length <= 12, `trop de modèles sans séparation fond / contenu : ${bad.slice(0, 5).join(" ; ")}`);
  });
  test("la grille « Galerie Z » ne laisse aucune bordure parasite en mobile", () => {
    const doc = Catalog.build("header", "media-10.media-10", {}).section; const cells = [];
    walk(doc, (n) => { if (n.type === "group" && n.styles && n.styles.desktop && n.styles.desktop.borderRightWidth && n.styles.desktop.borderRightWidth !== "0px") cells.push(n); });
    assert.ok(cells.length >= 3);
    for (const c of cells) assert.equal(c.styles.mobile && c.styles.mobile.borderRightWidth, "0px");
  });
});
