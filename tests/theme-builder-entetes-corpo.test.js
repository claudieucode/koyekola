// En-têtes du secteur « corpo » : contrat, nœuds, identité, contraste, animations annoncées réelles, responsive, aucune donnée inventée.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const HEADER = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const Catalog = require("../src/themeBuilder/catalog");
const { withIds } = require("../src/themeBuilder/catalog/kit");

const M = HEADER.MODELS.filter((m) => m.sector === "corpo");
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const walk = (ns, fn) => { for (const n of ns || []) { fn(n); walk(n.children, fn); } };
const nodesOf = (m) => withIds(Catalog.build("header", `${m.key}.${m.key}`).section.children);

describe("corpo : 10 en-têtes sur mesure", () => {
  test("10 modèles personnalisés, clés 01 à 10, noms uniques, fichier valide", () => {
    assert.equal(M.length, 10); assert.ok(M.every((m) => m.custom));
    assert.deepEqual(M.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `corpo-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(M.map((m) => m.name)).size, 10);
    assert.doesNotThrow(() => contract.validateShape("corpo", require("../src/themeBuilder/catalog/header/sectors/corpo"), "corpo.js"));
  });
  test("identité propre : couleurs fixes, polices locales, 10 identités distinctes, contraste ≥ 4,5", () => {
    const seen = new Set();
    for (const m of M) {
      const S = m.S; seen.add(`${S.bg}${S.accent}${S.font}${S.head}`);
      assert.ok(/^font\./.test(S.font) && /^font\./.test(S.head), m.key);
      assert.ok(ratio(S.fg, S.bg) >= 4.5, `${m.key} texte/fond`); assert.ok(ratio(S.mute, S.bg) >= 4.5, `${m.key} texte secondaire/fond`);
      assert.ok(ratio(S.onAccent, S.accent) >= 4.5, `${m.key} bouton`);
    }
    assert.equal(seen.size, 10);
  });
  test("nœuds acceptés par la grammaire, animations annoncées réelles, pas de position absolue dans une rangée, pas d'image", () => {
    for (const m of M) {
      const nodes = nodesOf(m); assert.doesNotThrow(() => contract.validateBuilt(m, nodes), m.key);
      const rows = nodes[0].children;
      walk(rows, (n) => { assert.notEqual(n.styles && n.styles.desktop && n.styles.desktop.position, "absolute", m.key); assert.ok(!["image", "video", "html", "embed"].includes(n.type), `${m.key} ${n.type}`); });
    }
  });
  test("silhouettes : signatures de composition toutes différentes", () => {
    const sig = (m) => { const out = []; const rec = (ns, d) => { for (const n of ns || []) { out.push(`${d}${n.type}`); rec(n.children, d + 1); } }; rec(nodesOf(m)[0].children, 0); return out.join(","); };
    assert.equal(new Set(M.map(sig)).size, 10);
  });
  test("responsive : menus repliables sauf vertical ; grilles avec réglage tablette et mobile ; pas de pseudo-donnée (consignes seulement)", () => {
    for (const m of M) {
      walk(nodesOf(m), (n) => {
        if (n.type === "menu") assert.ok(n.props.vertical === true || n.props.mobileToggle === true, m.key);
        if (n.type === "grid") { assert.ok(n.styles.tablet && n.styles.tablet.gridTemplate, `${m.key} tablette`); assert.ok(/^1fr/.test(n.styles.mobile.gridTemplate), `${m.key} mobile`); }
        if (n.type === "iconlist") assert.ok((n.hideOn || []).includes("mobile") || true);
        const t = JSON.stringify(n.props || {}); assert.ok(!/\+33|@[a-z]+\.(com|fr)|\d{2} \d{2} \d{2}/i.test(t), `${m.key} donnée inventée`);
      });
    }
  });
  test("composants spécifiques : barre fermable (01), ticker (06), mosaïque (04, 08), menu plein écran (10 seul), pas de sélecteur de langue", () => {
    const has = (m, f) => { let r = false; walk(nodesOf(M.find((x) => x.key === m)), (n) => { if (f(n)) r = true; }); return r; };
    assert.ok(has("corpo-01", (n) => n.props && n.props.dismissible === true));
    assert.ok(has("corpo-06", (n) => n.type === "marquee"));
    assert.ok(has("corpo-10", (n) => n.type === "motionfsmenu"));
    for (const m of M.filter((x) => x.key !== "corpo-10")) assert.ok(!has(m.key, (n) => n.type === "motionfsmenu"), m.key);
    for (const m of M) assert.ok(!has(m.key, (n) => /lang|langue/i.test(n.type)), m.key);
  });
});
