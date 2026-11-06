#!/usr/bin/env node
// Audit de la bibliothèque d'en-têtes « Atelier » (100 modèles) : unicité de la STRUCTURE (pas des couleurs), identité propre, éléments natifs, mouvement, réglages.
// Usage : node scripts/audit-entetes-atelier.js [--json] [--rapport]   (--rapport écrit docs/theme-builder/HEADER_LIBRARY_100_MODELS_REPORT.md)
const fs = require("fs");
const path = require("path");
const Catalog = require("../src/themeBuilder/catalog");
const { MODELS, SECTORS } = require("../src/themeBuilder/catalog/header/models");

// Signature de COMPOSITION : types d'éléments, mise en page (flex/grille/position/filets/formes), style de navigation, sans couleur, police, ni texte
const LAYOUT_KEYS = ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gridTemplate", "position", "borderStyle", "borderTopWidth", "borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderWidth", "borderRadius", "boxShadow", "maxWidth", "width", "height", "backdropBlur", "textTransform", "fontStyle"];
const shape = (n) => {
  const d = (n.styles && n.styles.desktop) || {}, st = LAYOUT_KEYS.filter((k) => d[k] !== undefined).map((k) => `${k}=${k === "width" || k === "maxWidth" || k === "height" ? String(d[k]).replace(/\d+/g, "#") : d[k]}`).join(",");
  const link = n.parts && n.parts.link && n.parts.link.styles ? Object.keys(n.parts.link.styles.desktop || {}).filter((k) => /border|padding|borderRadius|textDecoration/.test(k)).sort().join("+") : "";
  const sub = (n.children || []).map(shape).join(",");
  return `${n.type}{${st}${link ? `|${link}` : ""}${n.props && n.props.vertical ? "|v" : ""}${n.hideOn ? "|h" + n.hideOn.join("") : ""}}[${sub}]`;
};
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => Catalog.build("header", key, {}).section;

function audit() {
  const entries = Catalog.entries("header"), rows = [], sigs = new Map();
  for (const e of entries) {
    const M = MODELS.find((x) => `${x.key}.${x.key}` === e.key), doc = docOf(e.key);
    const types = new Set(), motion = new Set(), hovers = new Set(); let nodes = 0;
    walk(doc, (n) => { nodes++; types.add(n.type); if (n.motion && n.motion.entrance) motion.add(n.motion.entrance); if (n.motion && n.motion.hover) hovers.add(n.motion.hover); });
    const sig = shape(doc); (sigs.get(sig) || sigs.set(sig, []).get(sig)).push(e.key);
    const first = doc.children[0], mode = first.styles.desktop.position === "sticky" ? "collant" : first.styles.desktop.position === "absolute" ? "superposé" : "statique";
    rows.push({ key: e.key, name: M.name, sector: M.sector, art: M.art, arch: M.arch, mode, fx: (first.props && first.props.headerFx) || "", desc: M.desc, types: [...types], nodes, motion: [...motion], hovers: [...hovers], palette: [M.S.bg, M.S.fg, M.S.accent], fonts: [M.S.head, M.S.font], nav: M.V.nav || "plain", act: M.V.act || "", sig });
  }
  const dup = [...sigs.values()].filter((v) => v.length > 1);
  return { count: entries.length, rows, duplicates: dup, distinct: sigs.size };
}
module.exports = { audit, shape, docOf, MODELS, SECTORS };


// ── Rapport Markdown ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const ARCH_LABEL = { classic: "Classique : marque, navigation, actions", centre: "Marque centrée, navigation à gauche, actions à droite (grille 1fr/auto/1fr)", monument: "Nom du site monumental + navigation dessous", twolevel: "Deux niveaux : barre d'information + rangée principale", pill: "Pilule flottante détachée du bord", sidebrand: "Bloc de marque coloré à gauche (grille asymétrique)", cells: "Cellules à filets épais (grille de 4 cases)", index: "Index : marque minuscule + libellé + navigation fine", shop3: "Boutique à 3 étages : bandeau, recherche/compte/panier, catégories", shopc: "Boutique centrée : recherche | marque | compte-panier + catégories", shopm: "Boutique compacte + ruban promo", mega: "Méga-barre : barre sombre + rangée + navigation en blocs pleine largeur", vertical: "Navigation verticale : grande marque + liens empilés", frame: "Cadre épais autour de l'en-tête", masthead: "Mât de magazine : date, accroche, titre, filets épais", saas: "SaaS : pastille d'annonce + rangée principale", twotone: "Deux tons : demi-fond coloré pour la marque", badge: "Médaillon : marque dans un disque coloré", searchfirst: "Recherche d'abord : recherche centrale + puces", slab: "Dalle : navigation étirée en onglets, liseré épais", contactfirst: "Coordonnées et rendez-vous en haut + marque/navigation", booking: "Réservation : message, ornements autour de la marque, bouton", mono: "Ligne unique en monospace, filet noir", sport: "Sport : majuscules lourdes, liseré d'accent épais", luxe: "Luxe : marque espacée centrée, navigation fine, filets", coords: "Colonnes à filets fins + cellule de coordonnées", glass: "Superposé en verre dépoli sur le visuel d'ouverture", stackc: "Pile centrée : marque, navigation ornée de filets", tagline: "Marque + filet + accroche + navigation + actions", dual: "Double action : navigation centrée, contour + plein + pastille", dock: "Dock étroit centré en pilule", ticker: "Trois messages en haut + marque centrée entre deux navigations", bigcta: "Gros bouton d'action arrondi", boxnav: "Navigation en cases contour", navgrid: "Grille de navigation : marque + liens utiles + onglets", slim: "Barre ultra fine" };
function rapport(r, extra = "") {
  const L = [];
  L.push("# Bibliothèque d'en-têtes « Atelier » : rapport des 100 modèles", "", `Généré par \`node scripts/audit-entetes-atelier.js --rapport\` à partir du catalogue réel (${r.count} modèles, ${r.distinct} compositions distinctes, ${new Set(r.rows.map((x) => x.arch)).size} architectures).`, "");
  L.push("## 1. Audit de l'ancienne bibliothèque (avant refonte)", "",
    "* **Un seul moule.** Les 100 modèles précédents étaient construits par le même moteur de « rangées » (trois zones : gauche, centre, droite). Seuls changeaient le nombre de rangées, quelques filets et les couleurs : à l'œil, presque tous lisaient « logo + menu + bouton ».",
    "* **Identités partagées.** 34 identités seulement pour 100 modèles (22 palettes + 12 sectorielles) : chaque palette servait à 3 modèles environ.",
    "* **Défauts visibles.** Le bouton de recherche passait sous le champ dans plusieurs modèles (largeur trop étroite) ; barre promotionnelle à texte gris sur fond d'accent (contraste insuffisant).",
    "* **Mouvement.** Seuls « se réduit » et « devient plein » existaient ; aucun mouvement d'entrée, aucun survol, aucun « se cache en descendant » ; aucun réglage dans l'éditeur pour l'effet d'en-tête.",
    "* **Polices.** Les polices propres d'un modèle n'étaient chargées dans l'aperçu que si le site les utilisait déjà (correction dans `themeRender.wrapHtml`).", "");
  L.push("## 2. Méthode : matrice de conception et règle anti-répétition", "",
    "1. **Secteurs** : 10 secteurs × 10 directions artistiques (`src/themeBuilder/catalog/header/models.js`).",
    "2. **Architectures** : 36 compositions (`header/arch.js`) — grille, nombre de rangées, place de la marque, forme (pilule, cadre, cellules, médaillon, dock), filets, navigation (soulignée, pilule, case, onglet, bloc, mono, fine, verticale).",
    "3. **Identité propre** : 4 couleurs fixes + 2 polices de la bibliothèque locale par modèle ; contraste ≥ 4,5 vérifié (texte, texte secondaire, bouton).",
    "4. **Règle anti-répétition** : la *signature de composition* (types d'éléments, grille, position, filets, formes, style de navigation, éléments masqués ; sans couleur ni police ni texte) doit être unique pour les 100 modèles (test bloquant). Un contrôle visuel mesure en plus la distance entre rendus réels dans Chrome (`rapport-visuel-entetes-atelier.json`).", "");
  const per = {}; for (const x of r.rows) (per[x.arch] = per[x.arch] || []).push(x.key.split(".")[0]);
  L.push("### Architectures et modèles qui les utilisent", "", "| Architecture | Description | Modèles |", "|---|---|---|");
  for (const [a, ks] of Object.entries(per).sort((x, y) => y[1].length - x[1].length)) L.push(`| \`${a}\` | ${ARCH_LABEL[a] || ""} | ${ks.join(", ")} |`);
  L.push("");
  L.push("## 3. Composants, fonctionnalités et réglages (communs à tous les modèles)", "",
    "* **Composants natifs** : conteneurs flex/grille, logo ou titre du site, menu AFFECTÉ à l'emplacement « En-tête » (aucun lien inventé), recherche, compte, mini-panier, boutons, réseaux, date, textes, séparateurs, liste d'icônes (coordonnées à remplacer).",
    "* **Réglages** (tous modifiables dans l'éditeur du Page Builder, élément par élément) : largeur, hauteur, largeur max., alignement, espacements, arrière-plan et transparence, bordures, ombres, rayons, position collante/superposée, z-index ; logo (image, taille, lien) ; navigation (typographie, couleur, espacement, survol, focus, états actifs, sous-menus) ; boutons (texte, lien, couleurs, bordure, rayon, taille, icône) ; barre supérieure ; menu mobile ; mouvement.",
    "* **Mouvement** : entrée du logo, de la navigation et des actions (natif : fondu, glissement, zoom, révélation) avec durée, délai, courbe, déclencheur, répétition et coupure par écran ; survol des boutons (16 effets natifs) ; effets d'en-tête au défilement : *se réduit*, *devient plein*, *se cache en descendant et revient en remontant* (réglage ajouté dans l'éditeur : conteneur pleine largeur → « Effet de l'en-tête au défilement »). Toutes les animations respectent « réduire les animations ».",
    "* **Identité et autonomie** : les couleurs et polices sont posées sur les éléments (pas de jeton du site) ; changer la charte du site ne change pas l'en-tête installé. Modifier une couleur ou une police dans l'éditeur ne perd pas le reste de l'identité. Le catalogue n'est jamais modifié par une copie.", "");
  L.push("## 4. Les 100 modèles", "", "| N° | Identifiant | Nom | Secteur | Direction artistique | Architecture | Comportement | Navigation | Actions | Palette (fond / texte / accent) | Polices (titres / texte) | Entrée | Survol |", "|---:|---|---|---|---|---|---|---|---|---|---|---|---|");
  const sec = Object.fromEntries(SECTORS.map((x) => [x.key, x.label]));
  r.rows.forEach((x, i) => L.push(`| ${i + 1} | \`${x.key}\` | ${x.name} | ${sec[x.sector]} | ${x.art} | \`${x.arch}\` | ${x.mode}${x.fx ? ` · ${x.fx}` : ""} | ${x.nav} | ${x.act || "—"} | ${x.palette.join(" / ")} | ${x.fonts.map((f) => f.replace("font.", "")).join(" / ")} | ${x.motion[0] || "—"} | ${x.hovers[0] || "—"} |`));
  L.push("", "### Descriptions", "");
  r.rows.forEach((x, i) => L.push(`${i + 1}. **${x.name}** (\`${x.key}\`) — ${x.desc}`));
  L.push("", extra);
  return L.join("\n");
}

if (require.main === module) {
  const r = audit();
  if (process.argv.includes("--rapport")) { const extra = fs.existsSync(path.join(__dirname, "..", "docs", "theme-builder", ".entetes-atelier-resultats.md")) ? fs.readFileSync(path.join(__dirname, "..", "docs", "theme-builder", ".entetes-atelier-resultats.md"), "utf8") : ""; fs.writeFileSync(path.join(__dirname, "..", "docs", "theme-builder", "HEADER_LIBRARY_100_MODELS_REPORT.md"), rapport(r, extra)); console.log("rapport écrit"); process.exit(0); }
  if (process.argv.includes("--json")) { console.log(JSON.stringify({ count: r.count, distinct: r.distinct, duplicates: r.duplicates, rows: r.rows.map(({ sig, ...x }) => x) }, null, 1)); process.exit(0); }
  console.log(`${r.count} modèles, ${r.distinct} compositions distinctes, ${r.duplicates.length} groupe(s) identique(s)`);
  for (const d of r.duplicates) console.log("  identiques :", d.join(", "));
  const byArch = {}; for (const x of r.rows) byArch[x.arch] = (byArch[x.arch] || 0) + 1;
  console.log("architectures :", Object.keys(byArch).length, JSON.stringify(byArch));
  process.exit(r.count === 100 && r.duplicates.length === 0 ? 0 : 1);
}
