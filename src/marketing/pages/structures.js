// Structures prêtes de l'éditeur de pages (sélecteur « Quelle mise en page utiliser ? » : Flexbox ou Grille).
// Chaque structure est un VRAI arbre d'éléments de la grammaire existante (nodes.js) : des conteneurs Flexbox
// (display:flex, direction, base de taille, écart…) ou une Grille (colonnes, lignes, cases à étendue), avec leurs
// réglages tablette et mobile. Rien n'est « dessiné » : l'éditeur insère exactement cet arbre, qui est ensuite
// validé, enregistré et rendu comme tout autre contenu. La miniature du sélecteur est elle-même dessinée à partir
// de cet arbre (mêmes valeurs, en petit), jamais d'une image à part.
const GAP = "24px";

const R = (...cells) => ({ dir: "row", cells });
const C = (...cells) => ({ dir: "column", cells });
const w = (percent, spec = {}) => ({ ...spec, w: percent });

// Structures Flexbox : [clé, libellé, spécification]
const FLEX = [
  ["flex-1", "Une colonne", C()],
  ["flex-2", "Deux colonnes", R(w(50), w(50))],
  ["flex-2-33-67", "Deux colonnes · un tiers, deux tiers", R(w(33.33), w(66.67))],
  ["flex-2-67-33", "Deux colonnes · deux tiers, un tiers", R(w(66.67), w(33.33))],
  ["flex-2-25-75", "Deux colonnes · colonne latérale à gauche", R(w(25), w(75))],
  ["flex-2-75-25", "Deux colonnes · colonne latérale à droite", R(w(75), w(25))],
  ["flex-3", "Trois colonnes", R(w(33.33), w(33.33), w(33.33))],
  ["flex-3-25-50-25", "Trois colonnes · centre large", R(w(25), w(50), w(25))],
  ["flex-4", "Quatre colonnes", R(w(25), w(25), w(25), w(25))],
  ["flex-rows-2", "Deux lignes", C({}, {})],
  ["flex-rows-3", "Trois lignes", C({}, {}, {})],
  ["flex-top-2", "Une ligne puis deux colonnes", C({}, R(w(50), w(50)))],
  ["flex-2-bottom", "Deux colonnes puis une ligne", C(R(w(50), w(50)), {})],
  ["flex-header-3-footer", "En-tête, trois colonnes, pied", C({}, R(w(33.33), w(33.33), w(33.33)), {})],
  ["flex-left-2-right", "Grande case à gauche, deux à droite", R(w(50), w(50, C({}, {})))],
  ["flex-2-left-right", "Deux cases à gauche, grande à droite", R(w(50, C({}, {})), w(50))],
];

// Structures Grille : [clé, libellé, { cols (nombre ou « 1fr 2fr »), rows, cells: [{ col, row }] }]
const cells = (n, extra = {}) => Array.from({ length: n }, () => ({ ...extra }));
const GRID = [
  ["grid-2", "Deux colonnes", { cols: 2, rows: 1, cells: cells(2) }],
  ["grid-3", "Trois colonnes", { cols: 3, rows: 1, cells: cells(3) }],
  ["grid-4", "Quatre colonnes", { cols: 4, rows: 1, cells: cells(4) }],
  ["grid-2x2", "Deux colonnes, deux lignes", { cols: 2, rows: 2, cells: cells(4) }],
  ["grid-3x2", "Trois colonnes, deux lignes", { cols: 3, rows: 2, cells: cells(6) }],
  ["grid-2x3", "Deux colonnes, trois lignes", { cols: 2, rows: 3, cells: cells(6) }],
  ["grid-3x3", "Trois colonnes, trois lignes", { cols: 3, rows: 3, cells: cells(9) }],
  ["grid-1-2", "Deux colonnes · un tiers, deux tiers", { cols: "1fr 2fr", rows: 1, cells: cells(2) }],
  ["grid-2-1", "Deux colonnes · deux tiers, un tiers", { cols: "2fr 1fr", rows: 1, cells: cells(2) }],
  ["grid-banner", "Bandeau puis deux cases", { cols: 2, rows: 2, cells: [{ col: 2 }, {}, {}] }],
  ["grid-feature", "Grande case à gauche, quatre à droite", { cols: 3, rows: 2, cells: [{ row: 2 }, {}, {}, {}, {}] }],
  ["grid-sidebar", "Colonne latérale haute, deux cases", { cols: "1fr 3fr", rows: 2, cells: [{ row: 2 }, {}, {}] }],
];

const prune = (styles) => {
  const out = {};
  for (const [bp, set] of Object.entries(styles)) if (set && Object.keys(set).length) out[bp] = set;
  return out;
};

// ---------- Flexbox ----------
// ctx : { inRow, count } — place de la case dans son parent (largeur en % si le parent est une ligne)
function flexNode(spec, ctx) {
  const row = spec.dir === "row";
  const desktop = { display: "flex", flexDirection: spec.dir || "column", gap: GAP };
  if (row) { desktop.flexWrap = "nowrap"; desktop.alignItems = "stretch"; }
  const tablet = {}, mobile = {};
  if (row) {
    if (spec.cells.length >= 3) tablet.flexWrap = "wrap"; // 3 colonnes et plus : deux par ligne sur tablette
    mobile.flexDirection = "column";
  }
  if (ctx && ctx.inRow) {
    // Base de taille en %, sans croissance, rétrécissable (l'écart entre colonnes est absorbé : pas de retour à la ligne forcé)
    Object.assign(desktop, { flexBasis: `${spec.w}%`, flexGrow: 0, flexShrink: 1, minWidth: "0" });
    if (ctx.count >= 3) Object.assign(tablet, { flexBasis: "45%", flexGrow: 1 });
    Object.assign(mobile, { flexBasis: "auto", flexGrow: 0 });
  }
  const children = (spec.cells || []).map((c) => flexNode({ dir: "column", cells: [], ...c }, { inRow: row, count: spec.cells.length }));
  return { type: "container", styles: prune({ desktop, tablet, mobile }), children };
}

// ---------- Grille ----------
function gridTree(g) {
  const numeric = typeof g.cols === "number";
  const colCount = numeric ? g.cols : g.cols.split(" ").length;
  const desktop = { display: "grid", gap: GAP };
  if (numeric) desktop.columns = g.cols; else desktop.gridTemplate = g.cols;
  if (g.rows > 1) desktop.gridRows = g.rows;
  const tablet = {}, mobile = {};
  if (colCount >= 3) tablet.columns = 2;
  if (numeric) mobile.columns = 1; else mobile.gridTemplate = "1fr";
  const kids = g.cells.map((c) => {
    const d = {}, t = {}, m = {};
    if (c.col) { d.gridColumnSpan = c.col; if (c.col > 2) t.gridColumnSpan = 2; m.gridColumnSpan = 1; }
    if (c.row) { d.gridRowSpan = c.row; m.gridRowSpan = 1; }
    return { type: "container", styles: prune({ desktop: d, tablet: t, mobile: m }), children: [] };
  });
  return { type: "grid", styles: prune({ desktop, tablet, mobile }), children: kids };
}

const STRUCTURES = [
  ...FLEX.map(([key, label, spec]) => ({ kind: "flex", key, label, tree: flexNode(spec, null) })),
  ...GRID.map(([key, label, spec]) => ({ kind: "grid", key, label, tree: gridTree(spec) })),
];
const KINDS = [
  { key: "flex", label: "Flexbox", hint: "Conteneurs souples : lignes et colonnes qui s'adaptent à leur contenu." },
  { key: "grid", label: "Grille", hint: "Colonnes et lignes précises, avec des cases qui peuvent en occuper plusieurs." },
];

// Copie indépendante de l'arbre d'une structure (l'appelant lui donne ses identifiants)
function buildStructure(kind, key) {
  const s = STRUCTURES.find((x) => x.kind === kind && x.key === key);
  return s ? JSON.parse(JSON.stringify(s.tree)) : null;
}

module.exports = { STRUCTURES, KINDS, buildStructure };
