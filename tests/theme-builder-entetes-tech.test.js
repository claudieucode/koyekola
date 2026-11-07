// En-têtes du secteur « tech » (tech-01 à tech-10) : contrat, nœuds natifs, identité, contraste, animations annoncées réelles, modification + sauvegarde + relecture, installation dans un site.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const { MODELS } = require("../src/themeBuilder/catalog/header");

const TECH = MODELS.filter((m) => m.sector === "tech");
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const doc = (m) => Catalog.build("header", `${m.key}.${m.key}`).section;
const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const sig = (m) => { const out = []; walk(doc(m).children, (n) => out.push(`${n.type}${n.styles && n.styles.desktop && n.styles.desktop.gridTemplate ? ":" + n.styles.desktop.gridTemplate : ""}`)); return out.join(","); };

describe("En-têtes tech : contrat et identité", () => {
  test("10 modèles sur mesure (tech-01 à tech-10), noms et compositions distincts", () => {
    assert.equal(TECH.length, 10);
    assert.deepEqual(TECH.map((m) => m.key), Array.from({ length: 10 }, (_, i) => `tech-${String(i + 1).padStart(2, "0")}`));
    for (const m of TECH) assert.equal(m.custom, true, m.key);
    assert.equal(new Set(TECH.map((m) => m.name)).size, 10); assert.equal(new Set(TECH.map(sig)).size, 10);
    assert.equal(new Set(TECH.map((m) => m.art)).size, 10);
  });
  test("identité propre : 4 couleurs fixes, 2 polices locales, contraste >= 4,5 (texte, texte secondaire, bouton)", () => {
    for (const m of TECH) {
      const S = m.S;
      for (const c of ["bg", "fg", "alt", "accent"]) assert.match(S[c], /^#[0-9a-f]{6}$/i, `${m.key} ${c}`);
      assert.match(S.font, /^font\./); assert.match(S.head, /^font\./);
      assert.ok(contrast(S.fg, S.bg) >= 4.5 && contrast(S.mute, S.bg) >= 4.5 && contrast(S.onAccent, S.accent) >= 4.5, `${m.key} : contraste`);
    }
    assert.ok(new Set(TECH.map((m) => `${m.S.head}|${m.S.font}`)).size >= 9, "couples de polices");
  });
  test("au plus 2 modèles « marque / menu / bouton » alignés : jamais la même architecture", () => {
    assert.equal(new Set(TECH.map((m) => m.arch)).size, 10);
  });
  test("animations annoncées réelles (entrée ou survol présents dans les nœuds) et réglages listés", () => {
    for (const m of TECH) {
      const seen = new Set(); walk(doc(m).children, (n) => { if (n.motion) { if (n.motion.entrance) seen.add(n.motion.entrance); if (n.motion.hover) seen.add(n.motion.hover); } });
      for (const a of m.animations) assert.ok(seen.has(a), `${m.key} : « ${a} » absente`);
      assert.ok(m.features.length >= 3 && m.settings.length >= 4, m.key);
    }
  });
  test("responsive conçu : grilles repliées, menu repliable (sauf liste verticale doublée), pas de texte inventé ressemblant à une donnée réelle", () => {
    for (const m of TECH) {
      const first = doc(m).children[0]; let menus = 0, collapsible = 0;
      walk(doc(m).children, (n) => {
        if (n.type === "grid") { assert.ok(n.styles.tablet && n.styles.mobile && n.styles.mobile.gridTemplate === "1fr", `${m.key} : grille`); }
        if (n.type === "menu") { menus++; if (n.props.mobileToggle) collapsible++; }
        if (n.type === "motionfsmenu") collapsible++;
        assert.ok(!/\+33|@[a-z]+\.[a-z]{2,}|\d{2} \d{2} \d{2}/i.test(JSON.stringify(n.props || {})), `${m.key} : donnée inventée`);
      });
      assert.ok(collapsible >= 1, `${m.key} : navigation repliable absente`);
      assert.equal(first.type, "container");
    }
  });
  test("comportements annoncés : superposé, se réduit, se cache", () => {
    const by = Object.fromEntries(TECH.map((m) => [m.key, m.mode]));
    assert.equal(by["tech-02"], "overlay"); assert.equal(by["tech-05"], "stickyshrink"); assert.equal(by["tech-07"], "stickyhide"); assert.equal(by["tech-10"], "stickyhide");
    assert.equal(doc(TECH[4]).children[0].props.headerFx, "shrink"); assert.equal(doc(TECH[6]).children[0].props.headerFx, "hide");
  });
});

describe("En-têtes tech : modification, sauvegarde, relecture, installation", () => {
  const { A } = freshMarketing();
  const site = pages.createSite(A, { name: "Tech" });
  test("modifier une couleur, une police, un espacement et une animation puis sauvegarder et relire", () => {
    const t = useTemplate(A, site.id, "header", "tech-03.tech-03"); assert.equal(t.status, "draft");
    const comp = pages.getComponent(A, t.sourceId); const s = JSON.parse(JSON.stringify(comp.section));
    const bands = s.children[0].children; const b = bands[0]; b.styles.desktop.backgroundColor = "#123456"; b.styles.desktop.paddingTop = "20px";
    let font = 0, motion = 0; walk(s.children, (n) => { if (n.type === "sitetitle") { n.styles.desktop.fontFamily = "font.sora"; font++; n.motion = { entrance: "zoom-in", duration: 900, delay: 50 }; motion++; } });
    assert.ok(font && motion); pages.saveComponentDraft(A, t.sourceId, s);
    pages.publishComponent(A, t.sourceId); const back = pages.getComponent(A, t.sourceId).section; const txt = JSON.stringify(back);
    assert.ok(txt.includes("#123456") && txt.includes("font.sora") && txt.includes("\"20px\"") && txt.includes("zoom-in") && txt.includes("900"), "modifications perdues");
  });
  test("les 10 modèles s'installent comme copies indépendantes et gardent leur identité", () => {
    for (const m of TECH) {
      const t = useTemplate(A, site.id, "header", `${m.key}.${m.key}`); const comp = pages.getComponent(A, t.sourceId);
      assert.ok(JSON.stringify(comp.section).includes(m.S.head), m.key);
    }
  });
});
