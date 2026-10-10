// Parties stylables des widgets (carte, image, date, titre…) : validation par la grammaire fermée, restriction aux groupes de chaque partie,
// CSS généré (écrans, états, spécificité), contrat avec les gabarits, spec envoyée à l'éditeur, nombre de lignes maximum.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const n = require("../src/marketing/pages/nodes");
const { PARTS } = require("../src/marketing/pages/parts");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const norm = (raw) => n.normalizeNode(raw, "test", H, 1, { n: 0, ids: new Set() });
const posts = (parts) => ({ id: "posts0000001", type: "posts", props: { count: 3 }, ...(parts ? { parts } : {}) });
const css = (node) => n.pageCss([{ id: "sect00000001", type: "layout", children: [node] }]);

describe("parties stylables : validation", () => {
  test("une page sans partie est inchangée (pas de clé « parts »)", () => {
    assert.equal(Object.hasOwn(norm(posts()), "parts"), false);
    assert.equal(Object.hasOwn(norm(posts({})), "parts"), false);
  });
  test("les réglages d'une partie sont validés et conservés par écran et par état", () => {
    const node = norm(posts({ card: { styles: { desktop: { borderRadius: "20px", backgroundColor: "#ffffff", paddingTop: "12px" }, mobile: { paddingTop: "8px" } }, states: { hover: { boxShadow: "lg" } } }, title: { styles: { desktop: { fontSize: "22px", fontWeight: "700", lineHeight: 1.2 } } } }));
    assert.equal(node.parts.card.styles.desktop.borderRadius, "20px");
    assert.equal(node.parts.card.styles.mobile.paddingTop, "8px");
    assert.equal(node.parts.card.states.hover.boxShadow, "lg");
    assert.equal(node.parts.title.styles.desktop.fontSize, "22px");
  });
  test("refusés : partie inconnue, valeur hors grammaire, réglage hors des groupes de la partie, état non proposé, type sans parties", () => {
    assert.throws(() => norm(posts({ footer: { styles: { desktop: { color: "#000000" } } } })), /n'est pas une partie stylable/);
    assert.throws(() => norm(posts({ card: { styles: { desktop: { borderRadius: "calc(1px + 2px)" } } } })), /./);
    assert.throws(() => norm(posts({ title: { styles: { desktop: { backgroundColor: "#ff0000" } } } })), /n'est pas disponible pour cette partie/);
    assert.throws(() => norm(posts({ excerpt: { states: { hover: { color: "#ff0000" } } } })), /état « hover » n'est pas disponible/);
    assert.throws(() => norm({ id: "head00000001", type: "heading", props: { text: "T", level: 2 }, parts: { x: { styles: { desktop: { color: "#000000" } } } } }), /n'est pas une partie stylable/);
    assert.throws(() => norm(posts("oops")), /parties invalides/);
  });
  test("aucune injection : valeurs et sélecteurs ne sont jamais recopiés tels quels", () => {
    for (const bad of ["red;}body{display:none", "url(javascript:alert(1))", "expression(1)", "</style><script>"]) {
      assert.throws(() => norm(posts({ title: { styles: { desktop: { color: bad } } } })), /./, bad);
    }
    const out = css(norm(posts({ title: { styles: { desktop: { color: "#112233" } } } })));
    assert.ok(!/script|javascript|expression/i.test(out));
  });
});

describe("parties stylables : CSS généré", () => {
  const node = norm(posts({
    card: { styles: { desktop: { borderRadius: "20px" }, tablet: { paddingTop: "10px" }, mobile: { paddingTop: "6px" } }, states: { hover: { boxShadow: "lg" } } },
    excerpt: { styles: { desktop: { lineClamp: 3, color: "#334455" } } },
  }));
  const out = css(node);
  test("une règle par écran et par état, sur le sélecteur du registre, avec une spécificité supérieure aux styles par défaut", () => {
    assert.match(out, /\.kw-node\.kw-n-posts0000001 \.kw-post-card\{border-radius:20px\}/);
    assert.match(out, /@media \(max-width: 1023px\)\{[^@]*\.kw-node\.kw-n-posts0000001 \.kw-post-card\{padding-top:10px\}/);
    assert.match(out, /@media \(max-width: 767px\)\{[^@]*\.kw-node\.kw-n-posts0000001 \.kw-post-card\{padding-top:6px\}/);
    assert.match(out, /\.kw-node\.kw-n-posts0000001 \.kw-post-card:hover\{box-shadow:/);
  });
  test("nombre de lignes maximum : coupe l'extrait proprement", () => {
    assert.match(out, /\.kw-post-excerpt\{[^}]*-webkit-line-clamp:3[^}]*display:-webkit-box[^}]*\}|\.kw-post-excerpt\{[^}]*display:-webkit-box[^}]*-webkit-line-clamp:3[^}]*\}|\.kw-post-excerpt\{[^}]*-webkit-line-clamp:3/);
    assert.match(out, /\.kw-post-excerpt\{[^}]*overflow:hidden/);
    assert.throws(() => norm(posts({ excerpt: { styles: { desktop: { lineClamp: 99 } } } })), /./);
  });
  test("sans partie stylée, aucune règle de partie n'est écrite", () => {
    assert.ok(!/kw-post-card/.test(css(norm(posts()))));
  });
});

describe("parties stylables : contrat avec les gabarits et l'éditeur", () => {
  const tpl = fs.readFileSync(path.join(__dirname, "..", "views", "marketing-public", "_node.ejs"), "utf8");
  const widgetsDir = path.join(__dirname, "..", "views", "marketing-public", "widgets");
  const all = tpl + fs.readdirSync(widgetsDir).map((f) => fs.readFileSync(path.join(widgetsDir, f), "utf8")).join("\n");
  test("chaque sélecteur déclaré correspond à des classes / balises présentes dans le gabarit du widget", () => {
    for (const [type, defs] of Object.entries(PARTS)) {
      assert.ok(n.NODE_TYPES[type], `type inconnu : ${type}`);
      for (const [key, d] of Object.entries(defs)) {
        assert.ok(d.label && d.select && d.groups, `${type}.${key} incomplet`);
        for (const cls of d.select.match(/\.[a-z][a-z0-9-]+/g) || []) assert.ok(all.includes(cls.slice(1)), `${type}.${key} : classe ${cls} absente des gabarits`);
        for (const g of Object.keys(d.groups)) assert.ok(Object.values(n.STYLE_PROPS).some((p) => p.group === g) || Object.values(n.COMPOSED).some((p) => p.group === g), `${type}.${key} : groupe ${g} inconnu`);
        for (const [g, spec] of Object.entries(d.groups)) if (Array.isArray(spec)) for (const k of spec) assert.ok(n.STYLE_PROPS[k] || n.COMPOSED[k], `${type}.${key} : réglage ${k} inconnu`);
        for (const s of d.states) assert.ok(n.STATES.some((x) => x.key === s), `${type}.${key} : état ${s} inconnu`);
      }
    }
  });
  test("la spec de l'éditeur expose les parties (sans sélecteur CSS)", () => {
    const t = n.editorSpec().types.find((x) => x.type === "posts");
    assert.deepEqual(t.parts.map((p) => p.key), ["card", "image", "body", "date", "title", "excerpt"]);
    assert.ok(t.parts.every((p) => !("select" in p)));
    assert.equal(n.editorSpec().types.find((x) => x.type === "heading").parts, undefined);
  });
  test("le nombre de lignes maximum est une propriété du groupe typographie avec son libellé", () => {
    const p = n.editorSpec().styleProps.find((x) => x.key === "lineClamp");
    assert.ok(p && p.group === "typography" && p.kind === "number" && p.label === "Lignes maximum");
  });
});
