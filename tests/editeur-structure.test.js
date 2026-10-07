// Éditeur de pages — canevas, Flexbox, Grille (sans navigateur) : les structures prêtes sont de VRAIS arbres validés par la
// grammaire du serveur et enregistrés tels quels ; les propriétés Flexbox / Grille sont réellement validées et écrites dans le
// CSS ; une case de grille ne crée jamais de colonne en trop sur un petit écran ; le « + » d'une zone vide n'existe que dans l'éditeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const structures = require("../src/marketing/pages/structures");
const { startServer, loginInstructor } = require("./helpers");

const idMaker = () => { let i = 0; return () => `n${String(++i).padStart(11, "0")}`; };
const tag = (tree, next) => { tree.id = next(); (tree.children || []).forEach((c) => tag(c, next)); return tree; };
const walkAll = (list, out = []) => { for (const x of list || []) { out.push(x); walkAll(x.children, out); } return out; };

describe("structures prêtes (sans serveur)", () => {
  test("deux mises en page, des structures pour chacune, envoyées à l'éditeur", () => {
    const spec = nodes.editorSpec();
    assert.deepEqual(spec.structureKinds.map((k) => k.label), ["Flexbox", "Grille"]);
    const flex = spec.structures.filter((s) => s.kind === "flex"), grid = spec.structures.filter((s) => s.kind === "grid");
    assert.ok(flex.length >= 12 && grid.length >= 10, `${flex.length} Flexbox, ${grid.length} Grille`);
    assert.equal(new Set(spec.structures.map((s) => `${s.kind}:${s.key}`)).size, spec.structures.length, "clés uniques");
    for (const s of spec.structures) assert.ok(s.label && s.tree && ["container", "grid"].includes(s.tree.type), s.key);
  });

  test("chaque structure est enregistrée par la vraie sauvegarde et relue à l'identique (Flexbox, Grille, imbrication, écrans)", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Structures", kind: "page" });
    let revision = pages.getPage(A, p.id).revision;
    const next = idMaker();
    for (const s of structures.STRUCTURES) {
      const tree = tag(structures.buildStructure(s.kind, s.key), next);
      revision = pages.saveDraft(A, p.id, { sections: [{ id: next(), type: "layout", children: [tree] }] }, { revision }).revision;
      const back = pages.getPage(A, p.id).working.sections[0].children[0];
      assert.equal(back.type, tree.type, s.key);
      assert.deepEqual(back.styles, tree.styles, `${s.key} : styles (ordinateur, tablette, mobile) conservés`);
      assert.equal(walkAll([back]).length, walkAll([tree]).length, `${s.key} : même nombre d'éléments`);
    }
  });

  test("Flexbox : vraies propriétés (direction, base, croissance, rétrécissement) ; chaque case a son réglage mobile", () => {
    const three = structures.buildStructure("flex", "flex-3");
    assert.equal(three.styles.desktop.display, "flex");
    assert.equal(three.styles.desktop.flexDirection, "row");
    assert.equal(three.styles.mobile.flexDirection, "column", "empilées sur mobile");
    assert.equal(three.styles.tablet.flexWrap, "wrap", "trois colonnes : retour à la ligne sur tablette");
    assert.equal(three.children.length, 3);
    for (const c of three.children) assert.deepEqual([c.styles.desktop.flexBasis, c.styles.desktop.flexGrow, c.styles.desktop.flexShrink], ["33.33%", 0, 1]);
    const asym = structures.buildStructure("flex", "flex-2-33-67");
    assert.deepEqual(asym.children.map((c) => c.styles.desktop.flexBasis), ["33.33%", "66.67%"]);
    const nested = structures.buildStructure("flex", "flex-left-2-right");
    assert.equal(nested.children[1].children.length, 2, "une case contient deux cases (imbrication)");
    assert.equal(nested.children[1].styles.desktop.flexDirection, "column");
    assert.equal(structures.buildStructure("flex", "flex-1").children.length, 0, "une colonne : un conteneur seul");
  });

  test("Grille : colonnes, lignes, écarts, étendues des cases, réglages tablette et mobile", () => {
    const g = structures.buildStructure("grid", "grid-3x2");
    assert.deepEqual([g.type, g.styles.desktop.columns, g.styles.desktop.gridRows, g.children.length], ["grid", 3, 2, 6]);
    assert.equal(g.styles.tablet.columns, 2);
    assert.equal(g.styles.mobile.columns, 1);
    const feature = structures.buildStructure("grid", "grid-feature");
    assert.equal(feature.children[0].styles.desktop.gridRowSpan, 2, "grande case sur deux lignes");
    assert.equal(feature.children[0].styles.mobile.gridRowSpan, 1, "ramenée à une ligne sur mobile");
    const banner = structures.buildStructure("grid", "grid-banner");
    assert.equal(banner.children[0].styles.desktop.gridColumnSpan, 2);
    const tpl = structures.buildStructure("grid", "grid-1-2");
    assert.equal(tpl.styles.desktop.gridTemplate, "1fr 2fr");
    assert.equal(tpl.styles.mobile.gridTemplate, "1fr");
    assert.equal(structures.buildStructure("grid", "inconnue"), null);
  });
});

describe("propriétés Flexbox et Grille (validation et CSS réel)", () => {
  const css = (styles, parent = {}) => nodes.pageCss([{ id: "sect00000001", type: "layout", children: [{ id: "grid00000001", type: "grid", styles: parent, children: [{ id: "cell00000001", type: "container", styles, children: [] }] }] }]);
  const save = (A, id, styles) => { const p = pages.getPage(A, id); return pages.saveDraft(A, id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", styles, children: [] }] }] }, { revision: p.revision }).content.sections[0].children[0]; };

  test("toutes les propriétés demandées existent et sont validées (valeurs refusées, bornes)", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Propriétés", kind: "page" });
    const out = save(A, p.id, { desktop: { display: "flex", flexDirection: "column-reverse", flexWrap: "wrap-reverse", justifyContent: "space-evenly", alignItems: "baseline", alignContent: "space-between", gap: "20px", rowGap: "10px", columnGap: "30px", width: "50%", height: "200px", minWidth: "100px", maxWidth: "900px", minHeight: "50px", maxHeight: "500px", flexGrow: 0, flexShrink: 0, flexBasis: "25%", order: -3, alignSelf: "end", paddingTop: "8px", marginLeft: "auto", position: "relative", overflow: "hidden" } });
    const d = out.styles.desktop;
    assert.deepEqual([d.flexDirection, d.flexWrap, d.justifyContent, d.alignItems, d.alignContent], ["column-reverse", "wrap-reverse", "space-evenly", "baseline", "space-between"]);
    assert.deepEqual([d.flexGrow, d.flexShrink, d.flexBasis, d.order, d.alignSelf], [0, 0, "25%", -3, "end"], "flex-grow 0 est une valeur valide");
    assert.deepEqual([d.minWidth, d.maxWidth, d.minHeight, d.maxHeight, d.overflow, d.position], ["100px", "900px", "50px", "500px", "hidden", "relative"]);
    for (const [key, value] of [["flexGrow", 99], ["flexShrink", -1], ["order", 50], ["order", 1.5], ["flexBasis", "x"], ["alignContent", "diagonal"], ["justifySelf", "left"], ["gridColumnStart", 0], ["gridColumnStart", 14], ["gridRowEnd", "a"]]) {
      assert.throws(() => save(A, p.id, { desktop: { [key]: value } }), /valeur invalide/, `${key} = ${value}`);
    }
    const rows = save(A, p.id, { desktop: { display: "grid", gridRowsTemplate: "200px 1fr" } });
    assert.equal(rows.styles.desktop.gridRowsTemplate, "200px 1fr");
    assert.throws(() => save(A, p.id, { desktop: { gridRowsTemplate: "abc" } }), /valeur invalide/);
    assert.match(css({ desktop: { display: "grid", gridRows: 2, gridRowsTemplate: "200px 1fr" } }, { desktop: { gridRows: 2, gridRowsTemplate: "200px 1fr" } }), /grid-template-rows:repeat\(2, auto\);grid-template-rows:200px minmax\(0, 1fr\)/, "les hauteurs personnalisées sont écrites après le nombre de lignes");
    const g = save(A, p.id, { desktop: { display: "grid", justifySelf: "center", gridColumnStart: 2, gridColumnEnd: 4, gridRowStart: 1, gridRowEnd: 3 }, tablet: { order: 2 }, mobile: { order: 1 } });
    assert.deepEqual([g.styles.desktop.gridColumnStart, g.styles.desktop.gridColumnEnd, g.styles.desktop.gridRowStart, g.styles.desktop.gridRowEnd, g.styles.tablet.order, g.styles.mobile.order], [2, 4, 1, 3, 2, 1], "propriétés par écran conservées");
  });

  test("le CSS écrit reflète chaque propriété (flex, grille, placement en une seule déclaration, écrans)", () => {
    const c = css({ desktop: { flexGrow: 0, flexShrink: 2, flexBasis: "30%", order: -1, alignSelf: "center", justifySelf: "end", alignContent: "space-around" }, tablet: { order: 3 } });
    for (const part of ["flex-grow:0", "flex-shrink:2", "flex-basis:30%", "order:-1", "align-self:center", "justify-self:end", "align-content:space-around"]) assert.ok(c.includes(part), part);
    assert.match(c, /@media \(max-width: 1023px\)\{[^}]*order:3/);
    const place = (set) => css({ desktop: set }).split("\n").find((l) => l.startsWith(".kw-n-cell00000001"));
    assert.equal(place({ gridColumnSpan: 3 }), ".kw-n-cell00000001{grid-column:span 3}");
    assert.equal(place({ gridColumnStart: 2, gridColumnSpan: 3 }), ".kw-n-cell00000001{grid-column:2 / span 3}", "début + occupées : « 2 / span 3 »");
    assert.equal(place({ gridColumnStart: 2, gridColumnEnd: 5 }), ".kw-n-cell00000001{grid-column:2 / 5}");
    assert.equal(place({ gridColumnEnd: 4 }), ".kw-n-cell00000001{grid-column:auto / 4}");
    assert.equal(place({ gridRowStart: 2, gridRowSpan: 2 }), ".kw-n-cell00000001{grid-row:2 / span 2}");
  });

  test("une case de grille ne crée jamais de colonne en trop sur tablette ou mobile (ramenée au nombre de colonnes de l'écran)", () => {
    const grid = { desktop: { columns: 4 }, tablet: { columns: 3 }, mobile: { columns: 1 } };
    const rules = (set) => css({ desktop: set }, grid).split("\n").filter((l) => l.startsWith("@media")).join(" ");
    // occupe 2 colonnes : tient sur tablette (3 colonnes), ramenée à 1 sur mobile
    const wide = rules({ gridColumnSpan: 2 });
    assert.doesNotMatch(wide.split("@media (max-width: 767px)")[0], /cell00000001\{grid-column/, "tablette : aucune correction");
    assert.match(wide, /max-width: 767px\)\{[^}]*\}[^@]*cell00000001\{grid-column:span 1\}|cell00000001\{grid-column:span 1\}/);
    // colonne 3 sur 2 colonnes : déborde de 3 colonnes (tablette) → réduite à 1 ; hors de la grille mobile → automatique
    const placed = rules({ gridColumnStart: 3, gridColumnSpan: 2 });
    assert.match(placed, /@media \(max-width: 1023px\)\{[^@]*cell00000001\{grid-column:3 \/ span 1\}/);
    assert.match(placed, /@media \(max-width: 767px\)\{[^@]*cell00000001\{grid-column:auto\}/);
    // valeur propre au mobile, qui tient : jamais écrasée
    const own = css({ desktop: { gridColumnSpan: 3 }, mobile: { gridColumnSpan: 1 } }, { desktop: { columns: 3 }, mobile: { columns: 2 } });
    assert.match(own, /max-width: 767px\)\{[^@]*cell00000001\{grid-column:span 1\}/);
    assert.doesNotMatch(own.split("max-width: 767px")[1].replace(/\{grid-column:span 1\}/, ""), /cell00000001\{grid-column:span 2\}/);
  });
});

describe("« + » du canevas et éditeur (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const newPage = async (name, sections) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const revision = Number(db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision);
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision, content: { sections } }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200, r.text.slice(0, 120));
    return id;
  };
  const render = async (id, sections) => (await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: { sections } }, headers: { Origin: srv.base } })).text;

  test("page vide : un seul « + » ; section ou conteneur vide : un « + » ; jamais sur l'aperçu ni la page publiée", async () => {
    const id = await newPage("Vide", []);
    const empty = await render(id, []);
    assert.equal((empty.match(/data-kw-add/g) || []).length, 1);
    assert.match(empty, /data-kw-add="root"/);
    assert.doesNotMatch(empty, /Déposez des éléments|Section libre vide/, "plus de texte décoratif");
    const section = await render(id, [{ id: "sect00000001", type: "layout", children: [] }]);
    assert.equal((section.match(/data-kw-add/g) || []).length, 1, "section libre vide");
    const boxes = await render(id, [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "cont00000002", type: "container", children: [] }, { id: "cont00000003", type: "grid", children: [] }] }] }]);
    assert.equal((boxes.match(/data-kw-add/g) || []).length, 2, "un « + » par zone vide (le conteneur qui contient quelque chose n'en a pas)");
    // aperçu : jamais de « + »
    const preview = (await boss.get(`/marketing/pages/${id}/apercu`)).text;
    assert.doesNotMatch(preview, /data-kw-add|kw-empty-page/);
  });

  test("l'éditeur contient la fenêtre « Quelle mise en page utiliser ? », les structures et le panneau Structure détachable", async () => {
    const id = await newPage("Éditeur", []);
    const html = (await boss.get(`/marketing/pages/${id}/editeur`)).text;
    for (const part of ["data-pb-layout", "Quelle mise en page utiliser ?", "data-pb-layers-dock", "data-pb-layers-close", "data-pb-layers-open", "data-pb-layers-add", "data-pb-page-row", "Structure"]) assert.ok(html.includes(part), part);
    assert.match(html, /"structureKinds":\[\{"key":"flex","label":"Flexbox"/);
    assert.equal((html.match(/"kind":"grid","key":"grid-/g) || []).length >= 10, true);
  });
});
