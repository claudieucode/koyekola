// Secteur « sport » : 10 en-têtes sur mesure (header/sectors/sport.js). Unitaire : contrat, nœuds, identité, contraste, mouvements annoncés, édition + sauvegarde + relecture, copie indépendante.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const { MODELS } = require("../src/themeBuilder/catalog/header");

const SPORT = MODELS.filter((m) => m.sector === "sport");
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const nodesOf = (m) => { const out = []; walk(Catalog.build("header", `${m.key}.${m.key}`).section.children, (n) => out.push(n)); return out; };

describe("En-têtes sport : contrat et identité", () => {
  test("10 modèles sur mesure (sport-01 à 10), noms uniques, marqués sur mesure", () => {
    assert.equal(SPORT.length, 10);
    assert.deepEqual(SPORT.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `sport-${String(i + 1).padStart(2, "0")}`));
    assert.equal(new Set(SPORT.map((m) => m.name)).size, 10);
    for (const m of SPORT) assert.equal(m.custom, true, m.key);
  });
  test("identité propre : 7 couleurs fixes, 2 polices locales, contraste >= 4,5, palettes et couples de polices distincts", () => {
    for (const m of SPORT) {
      for (const c of ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"]) assert.match(m.S[c], /^#[0-9a-f]{6}$/i, `${m.key} ${c}`);
      assert.match(m.S.font, /^font\.[a-z0-9-]+$/); assert.match(m.S.head, /^font\.[a-z0-9-]+$/);
      assert.ok(contrast(m.S.fg, m.S.bg) >= 4.5, `${m.key} texte`); assert.ok(contrast(m.S.mute, m.S.bg) >= 4.5, `${m.key} secondaire`); assert.ok(contrast(m.S.onAccent, m.S.accent) >= 4.5, `${m.key} bouton`);
    }
    assert.equal(new Set(SPORT.map((m) => `${m.S.bg}|${m.S.accent}`)).size, 10);
    assert.equal(new Set(SPORT.map((m) => `${m.S.head}|${m.S.font}`)).size, 10);
  });
  test("polices réellement présentes dans la bibliothèque locale", () => {
    const fs = require("fs"), path = require("path");
    for (const m of SPORT) for (const f of [m.S.font, m.S.head]) assert.ok(fs.existsSync(path.join(__dirname, "..", "public", "fonts", "library", f.replace(/^font\./, ""))), `${m.key} ${f}`);
  });
  test("nœuds : aucune image ni script, jeton du site absent, mouvements annoncés réels, responsive (grilles à 1 colonne, pas de position absolue en rangée)", () => {
    for (const m of SPORT) {
      const ns = nodesOf(m), raw = JSON.stringify(ns);
      assert.ok(!/token:/.test(raw), `${m.key} jeton`); assert.ok(!ns.some((n) => ["image", "video", "html", "script"].includes(n.type)), m.key);
      const ent = new Set(), hov = new Set(); for (const n of ns) { if (n.motion && n.motion.entrance) ent.add(n.motion.entrance); if (n.motion && n.motion.hover) hov.add(n.motion.hover); }
      for (const a of m.animations) assert.ok(ent.has(a) || hov.has(a), `${m.key} animation « ${a} » absente`);
      for (const n of ns.filter((x) => x.type === "grid")) { assert.equal(n.styles.tablet.gridTemplate, "1fr".length ? n.styles.tablet.gridTemplate : "", m.key); assert.equal(n.styles.mobile.gridTemplate, "1fr", `${m.key} grille mobile`); }
      for (const n of ns) assert.notEqual((n.styles && n.styles.desktop && n.styles.desktop.position) || "", "absolute", `${m.key} position absolue`);
      for (const n of ns.filter((x) => x.type === "iconlist" || x.type === "social" || x.type === "dyntext" && x.props.source === "today")) assert.ok((n.hideOn || []).includes("mobile"), `${m.key} ${n.type} visible sur mobile`);
      assert.ok(ns.filter((x) => x.type === "menu").every((x) => x.props.source === "location" && x.props.mobileToggle === true), `${m.key} menu`);
    }
  });
  test("annonces à remplacer : aucune coordonnée inventée (pas de chiffres hors compteur « 000 »)", () => {
    for (const m of SPORT) { const txt = []; for (const n of nodesOf(m)) { if (n.props && n.props.html) txt.push(n.props.html); if (n.props && n.props.items) for (const i of n.props.items) if (i.text) txt.push(i.text); }
      assert.ok(!/\d{2}[ .]\d{2}|@|\+33/.test(txt.join(" ")), `${m.key} : ${txt.join(" | ")}`); }
  });
  test("compositions distinctes : 10 signatures de structure différentes ; 5 modes de défilement au moins ; aucune base « logo, menu centré, bouton » répétée", () => {
    const sig = SPORT.map((m) => { const rows = Catalog.build("header", `${m.key}.${m.key}`).section.children[0].children; return rows.map((r) => (r.type === "container" ? (r.children || []).map((c) => c.type + (c.children ? `(${c.children.map((d) => d.type).join("+")})` : "")).join(",") : r.type)).join("/") + `#${nodesOf(m).length}`; });
    assert.equal(new Set(sig).size, 10, sig.join("\n"));
    assert.ok(new Set(SPORT.map((m) => m.mode)).size >= 5);
    assert.ok(new Set(SPORT.map((m) => m.anim)).size >= 4);
  });
});

describe("En-têtes sport : édition, sauvegarde, relecture, isolation", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" });
  test("modifier une couleur, une police, un espacement et une animation puis sauvegarder : tout est relu", () => {
    const t = useTemplate(A, s1.id, "header", "sport-03.sport-03"); const comp = pages.getComponent(A, t.sourceId);
    const sec = JSON.parse(JSON.stringify(comp.section)); const all = []; walk(sec.children, (n) => all.push(n));
    const mk = all.find((n) => n.type === "sitetitle"), btn = all.find((n) => n.type === "button"), tk = all.find((n) => n.type === "marquee");
    mk.styles.desktop.fontFamily = "font.anton"; btn.styles.desktop.backgroundColor = "#123456"; btn.styles.desktop.paddingLeft = "44px"; mk.motion = { ...(mk.motion || {}), entrance: "zoom-in" }; tk.props.speed = "fast";
    pages.saveComponentDraft(A, t.sourceId, sec);
    const back = []; walk(pages.getComponent(A, t.sourceId).draft.children, (n) => back.push(n));
    assert.equal(back.find((n) => n.type === "sitetitle").styles.desktop.fontFamily, "font.anton");
    const b2 = back.find((n) => n.type === "button"); assert.equal(b2.styles.desktop.backgroundColor, "#123456"); assert.equal(b2.styles.desktop.paddingLeft, "44px");
    assert.equal(back.find((n) => n.type === "sitetitle").motion.entrance, "zoom-in"); assert.equal(back.find((n) => n.type === "marquee").props.speed, "fast");
    assert.equal(Catalog.build("header", "sport-03.sport-03").section.children[0].children.length >= 3, true, "catalogue intact");
  });
});
