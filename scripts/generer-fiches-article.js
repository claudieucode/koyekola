#!/usr/bin/env node
// Génère docs/theme-builder/single-post/refonte-v3/05_FICHES_100_MODELES.md à partir du CATALOGUE RÉEL (widgets effectivement posés, éléments collants, grilles…) : la fiche ne peut donc pas décrire autre chose que le modèle.
const fs = require("fs"), path = require("path");
const Catalog = require("../src/themeBuilder/catalog");
const D = require("../src/themeBuilder/catalog/single_post");
const { ARCH } = require("../src/themeBuilder/catalog/single_post/v3/concepts");
const { TEMPLATE } = require("../src/themeBuilder/catalog/single_post/v3/h");
const fam = Object.fromEntries(D.families.map((f) => [f.key, f.label]));
const stat = (doc) => {
  const types = {}; let n = 0, grids = 0, sticky = 0, cols = 0, maxCols = 1;
  (function walk(x) {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== "object") return;
    if (x.type) { n += 1; types[x.type] = (types[x.type] || 0) + 1; const d = x.styles && x.styles.desktop; if (x.type === "grid") { grids += 1; const m = String((d && d.gridTemplate) || "").split(/\s+/).filter(Boolean).length || Number(d && d.columns) || 2; maxCols = Math.max(maxCols, m); } if (d && d.position === "sticky") sticky += 1; if (d && d.columnCount) cols = Number(d.columnCount); }
    for (const v of Object.values(x)) if (v && typeof v === "object") walk(v);
  })(doc);
  return { types, n, grids, sticky, maxCols: Math.max(maxCols, cols || 1) };
};
const lines = [];
lines.push("# Fiches de conception — les 100 modèles « Article individuel » v3", "", "Fichier **généré** par `node scripts/generer-fiches-article.js` à partir du catalogue réel : les widgets, grilles et éléments collants listés sont ceux qui sont effectivement posés dans chaque modèle. Les médias riches (galerie, vidéo, audio, tableau, code, carte) se placent dans le contenu de l'article avec les blocs de l'éditeur d'article ; ils ne sont pas simulés par le modèle.", "");
lines.push("## Matrice de diversité", "", "| # | Clé | Nom | Direction artistique | Archétype | Titre | Image | Colonnes max | Grilles | Collant | Éléments | Widgets d'accompagnement |", "|---|---|---|---|---|---|---|---|---|---|---|---|");
const rows = [];
for (const e of Catalog.entries("single_post")) {
  const l = D.layouts.find((x) => x.key === e.layoutId), c = l.concept, s = D.skins.find((x) => x.key === e.skinKey), doc = Catalog.build("single_post", e.key).sections, st = stat(doc);
  const widgets = Object.keys(st.types).filter((t) => TEMPLATE.has(t) && t !== "postcontent").sort();
  rows.push({ e, c, s, st, widgets });
  lines.push(`| ${c.id.slice(3)} | \`${e.key}\` | ${c.name} | ${c.dir} | ${ARCH[c.arch][0]} | ${c.title} | ${c.hero} | ${st.maxCols} | ${st.grids} | ${st.sticky} | ${st.n} | ${widgets.join(", ") || "—"} |`);
}
lines.push("", "## Fiches", "");
for (const { e, c, s, st, widgets } of rows) {
  const content = c.widgets.filter((w) => !TEMPLATE.has(w) && w !== "postcontent");
  const interact = [st.sticky ? "éléments collants pendant la lecture" : null, widgets.includes("readingprogress") ? "barre de progression de lecture" : null, widgets.includes("toc") ? "sommaire à ancres" : null, widgets.includes("postnav") ? "navigation précédent / suivant" : null].filter(Boolean);
  lines.push(`### ${c.id} — ${c.name}`, "",
    `- **Clé** : \`${e.key}\` · **Direction artistique** : ${c.dir} · **Secteur cible** : ${c.sector}`,
    `- **Usage éditorial** : ${c.sig}`,
    `- **Composition** : ${ARCH[c.arch][0]} — ${ARCH[c.arch][1]}`,
    `- **Structure générale** : ${c.cols} ; ${st.maxCols > 1 ? `jusqu'à ${st.maxCols} colonnes` : "colonne unique"}, ${st.grids} grille(s), variante d'ouverture ${c.v[0]}, de fin ${c.v[1]}, de corps ${c.v[2]}`,
    `- **Titre** : ${c.title} · **Sous-titre** : chapô = extrait de l'article (\`{{post.excerpt}}\`) · **Image principale** : ${c.hero}`,
    `- **Largeur de lecture** : ${c.readW} px · **Métadonnées** : ${c.metaNote} · **Auteur** : ${c.authorNote} · **Sidebar** : ${c.side}`,
    `- **Widgets d'accompagnement posés** : ${widgets.join(", ") || "aucun"} · **Blocs à placer dans le contenu** : ${content.join(", ") || "aucun"}`,
    `- **Fonctionnalités** : ${c.features.join(", ")} · **Interactions** : ${interact.join(", ") || "lecture simple, sans animation"}`,
    `- **Couleurs** : fond ${s.bg}, texte ${s.fg}, accent ${s.accent}, surface ${s.alt} · **Typographies** : titres ${s.head.slice(5)}, texte ${s.font.slice(5)}`,
    `- **Espacements et formes** : arrondi ${s.radius}, bordure ${s.bw}, écart ${s.gap}, rembourrage ${s.pad}`,
    `- **Responsive** : grilles repliées en 1 colonne sous 640 px${st.sticky ? ", éléments collants remis dans le flux" : ""}, titre réduit (78 % puis 56 %), images en pleine largeur`,
    `- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion`, "");
}
fs.writeFileSync(path.join(__dirname, "../docs/theme-builder/single-post/refonte-v3/05_FICHES_100_MODELES.md"), lines.join("\n"));
console.log(`${rows.length} fiches écrites`);
