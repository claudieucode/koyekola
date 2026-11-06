// En-têtes du secteur « media » : contrat, nœuds natifs, identité fixe, contraste, animations annoncées réelles, composition distincte.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const Catalog = require("../src/themeBuilder/catalog");
const HEADER = require("../src/themeBuilder/catalog/header");
const contract = require("../src/themeBuilder/catalog/header/contract");
const { withIds } = require("../src/themeBuilder/catalog/kit");

const MEDIA = HEADER.MODELS.filter((m) => m.sector === "media");
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); walk(n.children, fn); } };
const nodesOf = (M) => withIds(Catalog.build("header", `${M.key}.${M.key}`).section.children);
const shape = (nodes) => { const out = []; walk(nodes, (n) => out.push(n.type)); return out.join(">"); };

describe("En-têtes media", () => {
  test("10 modèles sur mesure, clés media-01 à media-10, remplaçant les jumeaux hérités", () => {
    assert.equal(MEDIA.length, 10);
    assert.deepEqual(MEDIA.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `media-${String(i + 1).padStart(2, "0")}`));
    for (const M of MEDIA) assert.equal(M.custom, true, M.key);
    assert.equal(new Set(MEDIA.map((m) => m.name)).size, 10);
  });
  test("identité fixe : 4+ couleurs #rrggbb, polices locales, 2 polices distinctes, contraste ≥ 4,5 (texte, secondaire, bouton)", () => {
    for (const M of MEDIA) {
      const S = M.S;
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(S[c], /^#[0-9a-f]{6}$/i, `${M.key} ${c}`);
      assert.match(S.font, /^font\./); assert.match(S.head, /^font\./); assert.notEqual(S.font, S.head, M.key);
      assert.ok(ratio(S.fg, S.bg) >= 4.5, `${M.key} texte/fond ${ratio(S.fg, S.bg).toFixed(2)}`);
      assert.ok(ratio(S.mute, S.bg) >= 4.5, `${M.key} secondaire/fond ${ratio(S.mute, S.bg).toFixed(2)}`);
      assert.ok(ratio(S.onAccent, S.accent) >= 4.5, `${M.key} bouton ${ratio(S.onAccent, S.accent).toFixed(2)}`);
    }
  });
  test("les polices existent dans la bibliothèque locale", () => {
    const fs = require("fs"), path = require("path");
    for (const M of MEDIA) for (const f of [M.S.font, M.S.head]) assert.ok(fs.existsSync(path.join(__dirname, "..", "public", "fonts", "library", f.replace("font.", ""))), `${M.key} ${f}`);
  });
  test("nœuds acceptés par la grammaire, animations annoncées réelles, au moins 3 fonctionnalités", () => {
    for (const M of MEDIA) { assert.doesNotThrow(() => contract.validateBuilt(M, nodesOf(M)), M.key); assert.ok(M.features.length >= 3 && M.animations.length >= 1, M.key); }
  });
  test("aucune image, vidéo, HTML libre ni donnée inventée : seulement des nœuds natifs, menus affectés, consignes à remplacer", () => {
    const OK = new Set("container group stack grid sitelogo sitetitle menu search account minicart button social dyntext text iconlist divider spacer heading link marquee motionfsmenu".split(" "));
    for (const M of MEDIA) walk(nodesOf(M), (n) => {
      assert.ok(OK.has(n.type), `${M.key} : ${n.type}`);
      if (n.type === "menu") assert.equal(n.props.source, "location");
      if (n.type === "iconlist") for (const it of n.props.items) assert.doesNotMatch(it.text, /\d{2}|@/, `${M.key} : coordonnée inventée`);
    });
  });
  test("responsive : grilles repliées (tablette + 1fr mobile), pas de position dans une rangée, date/réseaux/infos masqués sur mobile", () => {
    for (const M of MEDIA) {
      const root = nodesOf(M)[0];
      walk(root.children, (n) => {
        const p = n.styles && n.styles.desktop && n.styles.desktop.position; assert.ok(!p || p === "static" || p === "relative", `${M.key} position`);
        if (n.type === "grid") { assert.equal(n.styles.mobile && n.styles.mobile.gridTemplate !== undefined ? n.styles.mobile.gridTemplate.startsWith("1fr") : false, true, `${M.key} grille mobile`); assert.ok(n.styles.tablet, `${M.key} grille tablette`); }
        if (["social", "date", "iconlist"].includes(n.type)) assert.deepEqual(n.hideOn, ["mobile"], `${M.key} ${n.type}`);
        if (n.type === "menu" && !n.props.vertical) assert.equal(n.props.mobileToggle, true, M.key);
      });
    }
  });
  test("compositions distinctes : 10 signatures de structure différentes", () => {
    assert.equal(new Set(MEDIA.map((M) => shape(nodesOf(M)))).size, 10);
  });
  test("briques propres au métier : ticker (02), menu plein écran (08), égaliseur animé (05), mosaïque (06), menu vertical (07)", () => {
    const by = (k) => nodesOf(MEDIA.find((m) => m.key === k)); const has = (k, t, f = () => true) => { let r = false; walk(by(k), (n) => { if (n.type === t && f(n)) r = true; }); return r; };
    assert.ok(has("media-02", "marquee")); assert.ok(has("media-08", "motionfsmenu", (n) => n.props.source === "location"));
    assert.ok(has("media-07", "menu", (n) => n.props.vertical === true)); assert.ok(has("media-06", "menu", (n) => n.parts.list.styles.desktop.flexWrap === "wrap"));
    let bars = 0; walk(by("media-05"), (n) => { if (n.motion && n.motion.entrance === "fade-in-up" && n.type === "container") bars++; }); assert.ok(bars >= 10);
  });
  test("comportements au défilement annoncés portés par l'enveloppe", () => {
    const fx = { "media-01": null, "media-02": null, "media-04": "shrink", "media-08": "hide" };
    for (const [k, v] of Object.entries(fx)) { const root = nodesOf(MEDIA.find((m) => m.key === k))[0]; assert.equal(root.props.headerFx || null, v, k); }
  });
});
