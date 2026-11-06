// KOLAKISA CMS → Personnalisation → Types de publication → Publication unique : réglages et moteur de rendu partagé.
//
// UN seul moteur pour tous les thèmes : les réglages vivent par site (site.settings.singlePost) ou pour le site principal (configuration d'apparence « singlePost »).
// Un thème peut fournir ses valeurs par défaut (tokens.pack.singlePost) sans toucher au moteur. Valeurs absentes = affichage d'origine de la page d'article :
// rien ne change pour un site qui n'a rien réglé.
// Ce module est PUR (pas de base de données) sauf `related` / `neighbours` qui reçoivent leurs données par injection : testable sans serveur.
const tokensLib = require("../marketing/pages/tokens");
const fontLib = require("../utils/fontLibrary");

const DEVICES = ["desktop", "tablet", "mobile"];
const TITLE_ITEMS = [["breadcrumb", "Fil d'Ariane"], ["categories", "Catégories"], ["title", "Titre"], ["excerpt", "Extrait"], ["meta", "Métadonnées"], ["image", "Image mise en avant"]];
const META_ITEMS = [["date", "Date"], ["author", "Auteur"], ["readtime", "Temps de lecture"], ["updated", "Mise à jour"], ["comments", "Commentaires"], ["taxonomies", "Étiquettes"]];
const SHARE_NETS = [["facebook", "Facebook"], ["x", "X"], ["linkedin", "LinkedIn"], ["whatsapp", "WhatsApp"], ["pinterest", "Pinterest"], ["telegram", "Telegram"], ["email", "E-mail"], ["copy", "Copier le lien"]];
const SIDES = ["top", "right", "bottom", "left"];
const SEPARATORS = [["/", "/"], ["-", "-"], ["|", "|"], ["•", "•"], ["none", "Aucun"]];
const UNITS = ["px", "em", "rem", "%"];
const bad = (m) => Object.assign(new Error(m), { userMessage: m, isSinglePost: true });

// ---------- Catalogue des champs ----------
// kind : bool | enum | int | float | text | color | order | box | resp | font | csv | shadow
// tab : general | design ; group : section repliable ; showIf : { chemin: valeur } (affiche seulement si…)
const F = [];
const add = (path, kind, label, o = {}) => F.push({ path, kind, label, tab: "general", ...o });

// ===== GÉNÉRAL — zone de titre =====
const G1 = "Article · Zone de titre";
add("titleArea.enabled", "bool", "Zone de titre de l'article", { def: true, group: G1, head: true, help: "Désactivée : le titre reste dans la page (invisible) pour le référencement et l'accessibilité." });
add("titleArea.items", "order", "Éléments de la zone de titre (glisser pour réordonner)", { def: TITLE_ITEMS.map(([id]) => ({ id, visible: true })), ids: TITLE_ITEMS, locked: ["title"], group: G1 });
add("titleArea.align", "enum", "Alignement", { def: "left", options: [["left", "Gauche"], ["center", "Centré"], ["right", "Droite"]], group: G1 });
add("titleArea.excerptWords", "int", "Extrait : mots affichés au plus", { def: 40, min: 5, max: 200, group: G1 });
add("meta.items", "order", "Métadonnées (glisser pour réordonner)", { def: [["date", true], ["author", true], ["readtime", true], ["updated", true], ["comments", false], ["taxonomies", false]].map(([id, visible]) => ({ id, visible })), ids: META_ITEMS, group: G1 });
add("meta.separator", "enum", "Séparateur des métadonnées", { def: "•", options: SEPARATORS, group: G1 });
add("author.prefix", "text", "Auteur : préfixe", { def: "par", max: 30, group: G1 });
add("author.avatar", "bool", "Auteur : afficher l'avatar", { def: false, group: G1 });
add("author.link", "bool", "Auteur : lien vers sa page", { def: true, group: G1 });
add("date.source", "enum", "Date affichée", { def: "published", options: [["published", "Date de publication"], ["modified", "Date de dernière modification"]], group: G1 });
add("date.format", "enum", "Format de date", { def: "long", options: [["long", "15 mars 2026"], ["short", "15/03/2026"], ["iso", "2026-03-15"]], group: G1 });
add("date.updatedOnlyIfDifferent", "bool", "Mise à jour : seulement si modifié un autre jour", { def: true, group: G1 });
add("readingTime.enabled", "bool", "Temps de lecture", { def: true, group: G1 });
add("readingTime.wpm", "int", "Vitesse de lecture (mots par minute)", { def: 200, min: 100, max: 500, group: G1, showIf: { "readingTime.enabled": true } });
add("readingTime.label", "text", "Texte du temps de lecture ({n} = minutes)", { def: "{n} min de lecture", max: 60, group: G1, showIf: { "readingTime.enabled": true } });
add("readingTime.format", "enum", "Format du temps de lecture", { def: "minutes", options: [["minutes", "Minutes arrondies"], ["range", "Fourchette (ex. 4–5 min)"]], group: G1, showIf: { "readingTime.enabled": true } });

// ===== GÉNÉRAL — mise en page =====
const G2 = "Mise en page";
add("container.layout", "enum", "Mise en page du conteneur", { def: "default", thumbs: "container", group: G2, options: [["default", "Par défaut (thème du site)"], ["full", "Pleine largeur"], ["narrow", "Contenu étroit, centré"], ["wide", "Contenu large"]] });
add("container.style", "enum", "Style de conteneur", { def: "default", segmented: true, group: G2, help: "Par défaut : le style du thème. Ouvert : sans cadre. Encadré : bordure et fond autour de tout.", options: [["default", "Par défaut"], ["open", "Ouvert"], ["boxed", "Encadré - Tout"]] });
add("sidebar.layout", "enum", "Mise en page de colonne latérale", { def: "default", thumbs: "sidebar", group: G2, options: [["default", "Par défaut (thème du site)"], ["none", "Sans colonne latérale"], ["left", "Colonne à gauche"], ["right", "Colonne à droite"]] });
add("sidebar.style", "enum", "Style de colonne latérale", { def: "default", segmented: true, group: G2, options: [["default", "Par défaut"], ["open", "Ouvert"], ["boxed", "Encadré - Tout"]], showIf: { "sidebar.layout": ["default", "left", "right"] } });
add("sidebar.width", "int", "Largeur de la colonne latérale", { def: 272, min: 200, max: 480, unit: "px", group: G2, showIf: { "sidebar.layout": ["default", "left", "right"] } });
add("sidebar.gap", "int", "Espace entre contenu et colonne", { def: 32, min: 0, max: 120, unit: "px", group: G2, showIf: { "sidebar.layout": ["default", "left", "right"] } });
add("sidebar.mobile", "enum", "Colonne latérale sur mobile", { def: "after", options: [["after", "Après le contenu"], ["before", "Avant le contenu"], ["hidden", "Masquée"]], group: G2, showIf: { "sidebar.layout": ["default", "left", "right"] } });
add("content.width", "enum", "Largeur du contenu", { def: "default", segmented: true, group: G2, options: [["default", "Par défaut"], ["custom", "Personnalisé"]] });
add("content.widthPx", "int", "Largeur personnalisée", { def: 1200, min: 480, max: 1920, unit: "px", slider: true, group: G2, showIf: { "content.width": "custom" } });
add("imageShadow.enabled", "bool", "Ombre portée des images dans le contenu", { def: false, group: G2 });

// ===== GÉNÉRAL — image mise en avant =====
const G3 = "Image mise en avant";
add("featured.size", "enum", "Taille", { def: "preset", options: [["preset", "Prédéfinie (largeur du contenu)"], ["original", "Originale"], ["custom", "Personnalisée"]], group: G3 });
add("featured.width", "int", "Largeur", { def: 1200, min: 100, max: 2400, unit: "px", group: G3, showIf: { "featured.size": "custom" } });
add("featured.height", "int", "Hauteur (0 = selon le ratio)", { def: 0, min: 0, max: 1600, unit: "px", group: G3, showIf: { "featured.size": "custom" } });
add("featured.ratio", "enum", "Ratio", { def: "16/9", options: [["auto", "Naturel"], ["16/9", "16:9"], ["4/3", "4:3"], ["3/2", "3:2"], ["1/1", "Carré 1:1"], ["21/9", "Panoramique 21:9"]], group: G3 });
add("featured.fit", "enum", "Ajustement (object-fit)", { def: "cover", options: [["cover", "Remplir (recadrer)"], ["contain", "Contenir (entier)"]], group: G3 });
add("featured.position", "enum", "Position (object-position)", { def: "center", options: [["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]], group: G3 });
add("featured.align", "enum", "Alignement de l'image", { def: "center", options: [["left", "Gauche"], ["center", "Centré"], ["right", "Droite"]], group: G3 });

// ===== GÉNÉRAL — publications similaires =====
const G4 = "Publications similaires";
add("related.enabled", "bool", "Publications similaires", { def: true, group: G4, head: true });
add("related.title", "text", "Titre de la section", { def: "Vous pourriez également aimer", max: 100, group: G4, showIf: { "related.enabled": true } });
add("related.text", "text", "Texte d'introduction (facultatif)", { def: "", max: 240, group: G4, showIf: { "related.enabled": true } });
add("related.count", "int", "Nombre de publications", { def: 3, min: 1, max: 12, group: G4, showIf: { "related.enabled": true } });
add("related.match", "enum", "Correspondance", { def: "both", options: [["both", "Catégorie et étiquettes"], ["category", "Catégorie seulement"], ["tags", "Étiquettes seulement"]], group: G4, showIf: { "related.enabled": true } });
add("related.excludeCategories", "csv", "Catégories exclues (noms, séparés par des virgules)", { def: "", max: 200, group: G4, showIf: { "related.enabled": true } });
add("related.order", "enum", "Ordre", { def: "relevance", options: [["relevance", "Pertinence"], ["recent", "Plus récentes"], ["title", "Titre A → Z"]], group: G4, showIf: { "related.enabled": true } });
add("related.layout", "enum", "Disposition", { def: "grid", options: [["grid", "Grille"], ["list", "Liste"], ["masonry", "Maçonnerie (colonnes)"]], group: G4, showIf: { "related.enabled": true } });
add("related.columns", "int", "Colonnes (ordinateur)", { def: 3, min: 1, max: 4, group: G4, showIf: { "related.enabled": true } });
add("related.gap", "int", "Espacement entre cartes", { def: 20, min: 0, max: 80, unit: "px", group: G4, showIf: { "related.enabled": true } });
for (const [k, label, d] of [["image", "Image", true], ["category", "Catégorie", true], ["title", "Titre", true], ["author", "Auteur", false], ["date", "Date", true], ["excerpt", "Extrait", true], ["more", "Lire la suite", true]]) add(`related.card.${k}`, "bool", `Carte : ${label}`, { def: d, group: G4, showIf: { "related.enabled": true } });
add("related.position", "enum", "Position", { def: "end", options: [["before-comments", "Avant les commentaires"], ["after-comments", "Après les commentaires"], ["end", "En fin d'article (sous la page)"]], group: G4, showIf: { "related.enabled": true } });

// ===== GÉNÉRAL — commentaires =====
const G5 = "Commentaires";
add("comments.enabled", "bool", "Commentaires", { def: true, group: G5, head: true, help: "Affiche ou masque la section. L'ouverture des commentaires de chaque article et la modération restent dans le module Commentaires." });
add("comments.showCount", "bool", "Afficher le nombre de commentaires", { def: true, group: G5, showIf: { "comments.enabled": true } });
add("comments.title", "text", "Titre de la section", { def: "Commentaires", max: 60, group: G5, showIf: { "comments.enabled": true } });
add("comments.placeholder", "text", "Texte du champ de commentaire", { def: "", max: 140, group: G5, showIf: { "comments.enabled": true } });
add("comments.submitLabel", "text", "Texte du bouton d'envoi", { def: "", max: 40, group: G5, showIf: { "comments.enabled": true } });
add("comments.emptyText", "text", "Message s'il n'y a aucun commentaire", { def: "", max: 140, group: G5, showIf: { "comments.enabled": true } });
add("comments.position", "enum", "Position", { def: "after-content", options: [["after-content", "Après le contenu et la navigation"], ["before-nav", "Avant la navigation"]], group: G5, showIf: { "comments.enabled": true } });

// ===== GÉNÉRAL — boîte d'auteur =====
const G6 = "Boîte d'auteur";
add("authorBox.enabled", "bool", "Boîte d'auteur avec partage social", { def: true, group: G6, head: true });
add("authorBox.title", "text", "Titre", { def: "À propos de l'auteur", max: 60, group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.position", "enum", "Position", { def: "after-share", options: [["before-content", "Avant le contenu"], ["after-content", "Après le contenu"], ["after-share", "Après le partage"], ["after-nav", "Après la navigation"]], group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.align", "enum", "Alignement", { def: "left", options: [["left", "Gauche"], ["center", "Centré"]], group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.avatarSize", "int", "Taille de l'avatar", { def: 72, min: 32, max: 160, unit: "px", group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.bio", "bool", "Afficher la biographie", { def: true, group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.recent", "int", "Publications récentes de l'auteur (0 = aucune)", { def: 0, min: 0, max: 5, group: G6, showIf: { "authorBox.enabled": true } });
add("authorBox.social", "bool", "Afficher ses profils sociaux (s'il en a renseigné)", { def: true, group: G6, showIf: { "authorBox.enabled": true } });

// ===== GÉNÉRAL — navigation entre articles =====
const G7 = "Navigation entre publications";
add("postNav.enabled", "bool", "Navigation entre publications", { def: true, group: G7, head: true });
add("postNav.mode", "enum", "Ordre de navigation", { def: "chronological", options: [["chronological", "Chronologique"], ["category", "Dans la même catégorie"]], group: G7, showIf: { "postNav.enabled": true } });
add("postNav.position", "enum", "Position", { def: "after-author", options: [["after-share", "Après le partage"], ["after-author", "Après la boîte d'auteur"], ["after-comments", "Après les commentaires"]], group: G7, showIf: { "postNav.enabled": true } });
add("postNav.style", "enum", "Style", { def: "cards", options: [["cards", "Cartes"], ["links", "Liens simples"]], group: G7, showIf: { "postNav.enabled": true } });
add("postNav.titles", "bool", "Afficher les titres", { def: true, group: G7, showIf: { "postNav.enabled": true } });
add("postNav.images", "bool", "Afficher les images", { def: false, group: G7, showIf: { "postNav.enabled": true } });
add("postNav.align", "enum", "Alignement", { def: "spread", options: [["spread", "Aux deux extrémités"], ["center", "Centré"]], group: G7, showIf: { "postNav.enabled": true } });

// ===== GÉNÉRAL — chargement automatique =====
const G8 = "Chargement automatique des publications précédentes";
add("autoload.enabled", "bool", "Charger automatiquement l'article précédent en fin de lecture", { def: false, group: G8, head: true });
add("autoload.max", "int", "Nombre maximal d'articles chargés", { def: 3, min: 1, max: 10, group: G8, showIf: { "autoload.enabled": true } });
add("autoload.updateUrl", "bool", "Mettre à jour l'adresse et le titre de l'onglet", { def: true, group: G8, showIf: { "autoload.enabled": true } });
add("autoload.loadingText", "text", "Texte de chargement", { def: "Chargement de l'article suivant…", max: 80, group: G8, showIf: { "autoload.enabled": true } });
add("autoload.errorText", "text", "Message d'erreur", { def: "Impossible de charger l'article suivant. Réessayez.", max: 120, group: G8, showIf: { "autoload.enabled": true } });
add("autoload.endText", "text", "Message en fin de liste", { def: "Vous avez tout lu.", max: 80, group: G8, showIf: { "autoload.enabled": true } });

// ===== GÉNÉRAL — partage social =====
const G9 = "Partage social";
add("share.enabled", "bool", "Partage social", { def: true, group: G9, head: true });
for (const [k, label] of SHARE_NETS) add(`share.nets.${k}`, "bool", label, { def: ["facebook", "x", "linkedin", "whatsapp", "email", "copy"].includes(k), group: G9, showIf: { "share.enabled": true } });
add("share.before", "bool", "Afficher avant le contenu", { def: true, group: G9, showIf: { "share.enabled": true } });
add("share.after", "bool", "Afficher après le contenu", { def: true, group: G9, showIf: { "share.enabled": true } });
add("share.floating", "bool", "Afficher flottant (ordinateur)", { def: true, group: G9, showIf: { "share.enabled": true } });
add("share.labels", "bool", "Afficher les libellés", { def: false, group: G9, showIf: { "share.enabled": true } });
add("share.style", "enum", "Style des boutons", { def: "round", options: [["round", "Ronds"], ["square", "Carrés"], ["pill", "Capsules"]], group: G9, showIf: { "share.enabled": true } });
add("share.size", "int", "Taille des boutons", { def: 36, min: 24, max: 64, unit: "px", group: G9, showIf: { "share.enabled": true } });
add("share.gap", "int", "Espacement des boutons", { def: 8, min: 0, max: 32, unit: "px", group: G9, showIf: { "share.enabled": true } });
add("share.label", "text", "Texte d'invitation", { def: "Partager", max: 60, group: G9, showIf: { "share.enabled": true } });

// ===== DESIGN =====
const D = (path, kind, label, o = {}) => add(path, kind, label, { tab: "design", ...o });
const DS = "Espacement de publication";
D("design.spacing.outer", "box", "Extérieur (marges)", { responsive: true, def: null, group: DS });
D("design.spacing.inner", "box", "À l'intérieur (paddings)", { responsive: true, def: null, group: DS });
const DS2 = "Espacements étendus";
for (const [k, label] of [["title", "Titre"], ["meta", "Métadonnées"], ["image", "Image principale"], ["blocks", "Entre les blocs de contenu"], ["paragraphs", "Entre paragraphes"], ["headings", "Titres secondaires"], ["images", "Images du contenu"], ["quotes", "Citations"], ["nav", "Navigation"], ["related", "Publications similaires"], ["comments", "Commentaires"], ["author", "Boîte d'auteur"]]) D(`design.space.${k}`, "resp", `Espacement — ${label}`, { min: 0, max: 200, unit: "px", def: null, group: DS2 });

const FONT_GROUPS = [["title", "Titre de l'article"], ["subheadings", "Sous-titres"], ["content", "Contenu"], ["paragraphs", "Paragraphes"], ["quotes", "Citations"], ["lists", "Listes"], ["links", "Liens"], ["captions", "Légendes"], ["meta", "Métadonnées"], ["author", "Auteur"], ["readtime", "Temps de lecture"], ["nav", "Navigation"], ["related", "Publications similaires"], ["comments", "Commentaires"]];
for (const [k, label] of FONT_GROUPS) {
  const g = `Typographie — ${label}`;
  D(`design.type.${k}.font`, "font", "Police", { def: "", group: g });
  D(`design.type.${k}.size`, "resp", "Taille", { min: 8, max: 96, unit: "px", def: null, group: g });
  D(`design.type.${k}.weight`, "enum", "Graisse", { def: "", options: [["", "Héritée"], ["400", "Normale"], ["500", "Moyenne"], ["600", "Demi-grasse"], ["700", "Grasse"], ["800", "Très grasse"]], group: g });
  D(`design.type.${k}.lineHeight`, "float", "Hauteur de ligne", { min: 1, max: 3, step: 0.05, def: null, group: g });
  D(`design.type.${k}.letterSpacing`, "float", "Espacement des lettres (px)", { min: -3, max: 12, step: 0.1, def: null, group: g });
  D(`design.type.${k}.transform`, "enum", "Casse", { def: "", options: [["", "Héritée"], ["none", "Normale"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Capitales aux mots"]], group: g });
  if (["title", "subheadings", "paragraphs", "quotes", "meta", "captions", "comments"].includes(k)) D(`design.type.${k}.align`, "enum", "Alignement", { def: "", options: [["", "Hérité"], ["left", "Gauche"], ["center", "Centré"], ["right", "Droite"], ["justify", "Justifié"]], group: g });
}
const COLOR_GROUPS = [["titleArea", "Zone de titre", ["bg", "text"]], ["title", "Titre", ["text"]], ["meta", "Métadonnées", ["text", "link", "linkHover"]], ["content", "Contenu", ["text", "bg"]], ["links", "Liens", ["text", "hover", "focus", "active"]], ["quotes", "Citations", ["text", "bg", "border"]], ["captions", "Légendes", ["text"]], ["author", "Auteur", ["text", "bg", "link", "linkHover"]], ["nav", "Navigation", ["text", "bg", "hover", "focus"]], ["related", "Publications similaires", ["text", "bg", "link", "linkHover"]], ["comments", "Commentaires", ["text", "bg", "link", "linkHover"]], ["share", "Partage social", ["text", "bg", "hover", "focus"]]];
const COLOR_LABELS = { text: "Texte", bg: "Fond", border: "Bordure", link: "Lien", linkHover: "Lien au survol", hover: "Survol", focus: "Focus", active: "Actif" };
for (const [k, label, props] of COLOR_GROUPS) for (const p of props) D(`design.color.${k}.${p}`, "color", COLOR_LABELS[p], { def: "", group: `Couleurs — ${label}` });
const BORDER_GROUPS = [["container", "Conteneur"], ["authorBox", "Boîte d'auteur"], ["related", "Publications similaires"], ["comments", "Commentaires"]];
for (const [k, label] of BORDER_GROUPS) {
  const g = `Bordures — ${label}`;
  D(`design.border.${k}.width`, "box", "Épaisseur (px)", { def: null, group: g, max: 20, noUnit: true });
  D(`design.border.${k}.color`, "color", "Couleur", { def: "", group: g });
  D(`design.border.${k}.radius`, "box", "Rayons (haut-gauche, haut-droite, bas-droite, bas-gauche)", { def: null, group: g, max: 80, corners: true, noUnit: true });
}
D("design.radius.images", "int", "Rayon des images du contenu", { def: null, nullable: true, min: 0, max: 60, unit: "px", group: "Rayons" });
D("design.radius.buttons", "int", "Rayon des boutons (partage, navigation)", { def: null, nullable: true, min: 0, max: 60, unit: "px", group: "Rayons" });
const SH = "Ombre des images du contenu";
D("design.shadow.images.x", "int", "Décalage horizontal", { def: 0, min: -60, max: 60, unit: "px", group: SH });
D("design.shadow.images.y", "int", "Décalage vertical", { def: 8, min: -60, max: 60, unit: "px", group: SH });
D("design.shadow.images.blur", "int", "Flou", { def: 24, min: 0, max: 120, unit: "px", group: SH });
D("design.shadow.images.spread", "int", "Extension", { def: 0, min: -40, max: 80, unit: "px", group: SH });
D("design.shadow.images.color", "color", "Couleur", { def: "#000000", group: SH });
D("design.shadow.images.opacity", "int", "Opacité", { def: 20, min: 0, max: 100, unit: "%", group: SH });
const SH2 = "Ombre du conteneur";
D("design.shadow.container.x", "int", "Décalage horizontal", { def: 0, min: -60, max: 60, unit: "px", group: SH2 });
D("design.shadow.container.y", "int", "Décalage vertical", { def: 0, min: -60, max: 60, unit: "px", group: SH2 });
D("design.shadow.container.blur", "int", "Flou", { def: 0, min: 0, max: 120, unit: "px", group: SH2 });
D("design.shadow.container.spread", "int", "Extension", { def: 0, min: -40, max: 80, unit: "px", group: SH2 });
D("design.shadow.container.color", "color", "Couleur", { def: "#000000", group: SH2 });
D("design.shadow.container.opacity", "int", "Opacité", { def: 0, min: 0, max: 100, unit: "%", group: SH2 });

// ---------- Valeurs par défaut et lecture/écriture par chemin ----------
const get = (obj, path) => path.split(".").reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), obj);
const set = (obj, path, value) => { const ks = path.split("."); let n = obj; for (const k of ks.slice(0, -1)) { if (!n[k] || typeof n[k] !== "object") n[k] = {}; n = n[k]; } n[ks[ks.length - 1]] = value; };
const clone = (v) => JSON.parse(JSON.stringify(v));
const BY_PATH = new Map(F.map((f) => [f.path, f]));
function defaults() { const o = {}; for (const f of F) set(o, f.path, clone(f.def === undefined ? null : f.def)); return o; }
const DEFAULTS = Object.freeze(defaults());

// ---------- Validation ----------
const num = (v, lo, hi, label, strict, fallback, { int = true } = {}) => {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || (int && !Number.isInteger(n)) || n < lo || n > hi) { if (strict) throw bad(`${label} : un nombre${int ? " entier" : ""} entre ${lo} et ${hi} est attendu.`); return fallback; }
  return n;
};
const hex = (v, label, strict) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "") return "";
  if (/^#[0-9a-f]{6}$/.test(s) || /^token:[a-z0-9-]{1,24}$/.test(s)) return s;
  if (strict) throw bad(`${label} : code hexadécimal attendu (ex. #0277b6).`);
  return "";
};
const fontOk = (v) => { const s = String(v ?? "").trim(); return s === "" || (/^[a-zA-Z0-9:_-]{1,64}$/.test(s) && (tokensLib.FONTS[s] || fontLib.isId(s) || fontLib.isCustomId(s) || fontLib.isTokenId(s))); };
function cleanOne(f, raw, strict) {
  const label = f.label;
  switch (f.kind) {
    case "bool": if (raw === undefined || raw === null) return f.def; return raw === true || raw === 1 || raw === "1" || raw === "true" || raw === "on";
    case "enum": { const hit = f.options.find(([v]) => String(v) === String(raw ?? "")); if (!hit) { if (strict && raw !== undefined && raw !== null) throw bad(`${label} : choix inconnu.`); return f.def; } return hit[0]; }
    case "int": return num(raw, f.min, f.max, label, strict, f.def, { int: true });
    case "float": return raw === "" || raw === null || raw === undefined ? null : num(raw, f.min, f.max, label, strict, null, { int: false });
    case "text": case "csv": { const s = String(raw ?? f.def ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim(); if (s.length > f.max) { if (strict) throw bad(`${label} : ${f.max} caractères au plus.`); return s.slice(0, f.max); } return s; }
    case "color": return raw === undefined || raw === null ? (f.def || "") : hex(raw, label, strict);
    case "font": { if (!fontOk(raw)) { if (strict) throw bad(`${label} : police inconnue.`); return ""; } return String(raw ?? "").trim(); }
    case "order": {
      const ids = f.ids.map(([id]) => id);
      const list = Array.isArray(raw) ? raw : [];
      const seen = new Set(); const out = [];
      for (const it of list) { const id = it && typeof it === "object" ? String(it.id) : String(it); if (!ids.includes(id) || seen.has(id)) { if (strict && !ids.includes(id)) throw bad(`${label} : élément inconnu « ${id.slice(0, 30)} ».`); continue; } seen.add(id); out.push({ id, visible: it && typeof it === "object" ? it.visible !== false && it.visible !== 0 && it.visible !== "0" : true }); }
      for (const d of f.def) if (!seen.has(d.id)) out.push({ ...d }); // éléments manquants : remis à leur place d'origine, jamais perdus
      for (const id of f.locked || []) { const e = out.find((x) => x.id === id); if (e) e.visible = true; } // le titre reste toujours visible
      return out;
    }
    case "resp": {
      if (raw === null || raw === undefined || raw === "") return null;
      if (typeof raw !== "object") { const n = num(raw, f.min, f.max, label, strict, null); return n === null ? null : { desktop: n, tablet: null, mobile: null }; }
      const o = {}; let any = false;
      for (const d of DEVICES) { const v = raw[d]; o[d] = v === "" || v === null || v === undefined ? null : num(v, f.min, f.max, `${label} (${d})`, strict, null); if (o[d] !== null) any = true; }
      return any ? o : null;
    }
    case "box": {
      if (raw === null || raw === undefined || raw === "") return null;
      const clean = (b) => { const o = {}; let any = false; for (const s of SIDES) { const v = b && b[s]; o[s] = v === "" || v === null || v === undefined ? null : num(v, f.corners || f.noUnit ? 0 : -400, f.max || 400, `${label} (${s})`, strict, null); if (o[s] !== null) any = true; } if (!any) return null; o.unit = f.noUnit ? "px" : (UNITS.includes(b && b.unit) ? b.unit : "px"); o.linked = Boolean(b && b.linked); return o; };
      if (f.responsive) { if (typeof raw !== "object") return null; const o = {}; let any = false; for (const d of DEVICES) { o[d] = raw[d] ? clean(raw[d]) : null; if (o[d]) any = true; } return any ? o : null; }
      return clean(raw);
    }
    default: return f.def;
  }
}
// strict : une valeur refusée lève une erreur claire (Personnaliser) ; sinon repli sur la valeur d'origine (lecture d'une configuration ancienne)
function normalize(input, { strict = false } = {}) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const out = {};
  for (const f of F) set(out, f.path, cleanOne(f, get(src, f.path), strict));
  return out;
}
const cleanField = (f, raw) => cleanOne(f, raw, true);
// Forme stockée : null tant que rien n'a changé par rapport aux valeurs d'origine (les sites qui n'ont rien réglé ne stockent rien)
function compact(input, { strict = false } = {}) {
  if (input === null || input === undefined) return null;
  const n = normalize(input, { strict });
  return JSON.stringify(n) === JSON.stringify(DEFAULTS) ? null : n;
}
// Résultat pour le rendu : défauts du thème (facultatifs) < réglages du site
function resolve(stored, themeDefaults = null) {
  const base = themeDefaults && typeof themeDefaults === "object" ? { ...clone(DEFAULTS) } : clone(DEFAULTS);
  const t = themeDefaults && typeof themeDefaults === "object" ? normalize(themeDefaults, { strict: false }) : null;
  const s = normalize(stored, { strict: false });
  if (!t) return s;
  const out = clone(base);
  for (const f of F) {
    const sv = get(s, f.path), tv = get(t, f.path), dv = get(DEFAULTS, f.path);
    set(out, f.path, JSON.stringify(sv) !== JSON.stringify(dv) ? sv : tv);
  }
  return out;
}
// Ce que le Customizer sait régler (pour construire le panneau et valider chaque changement)
const controls = () => F.map((f) => ({ ...f, id: f.path }));

// ---------- Aides de rendu ----------
const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
// Mots du texte réel de l'article : balises, scripts, styles, code, légendes et contenus non textuels ignorés
function countWords(html) {
  const text = String(html || "").replace(/<(script|style|pre|code|figure|svg|iframe|video|audio|table)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
  const m = text.match(WORD);
  return m ? m.length : 0;
}
function readingTime(html, cfg) {
  const rt = cfg.readingTime;
  if (!rt.enabled) return null;
  const words = countWords(html);
  if (!words) return null;
  const minutes = Math.max(1, Math.ceil(words / rt.wpm));
  const fmt = (n) => rt.label.includes("{n}") ? rt.label.replace("{n}", String(n)) : `${rt.label} ${n}`.trim();
  if (rt.format === "range") { const lo = Math.max(1, Math.floor(words / rt.wpm)); return { minutes, words, text: lo < minutes ? fmt(`${lo}–${minutes}`) : fmt(minutes) }; }
  return { minutes, words, text: fmt(minutes) };
}
const DATE_FORMATS = { long: (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }), short: (d) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }), iso: (d) => d.toISOString().slice(0, 10) };
function formatDate(value, format) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(value)) ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return "";
  return (DATE_FORMATS[format] || DATE_FORMATS.long)(d);
}
// Éléments à afficher, dans l'ordre choisi ; sans valeur réelle → pas d'élément (jamais de séparateur orphelin)
function metaParts(cfg, data) {
  const out = [];
  for (const it of cfg.meta.items) {
    if (!it.visible) continue;
    if (it.id === "date") { const v = data.date; if (v) out.push({ id: "date", text: v.text, iso: v.iso }); }
    else if (it.id === "author") { if (data.author) out.push({ id: "author", name: data.author.name, url: data.author.url, avatar: data.author.avatar || "" }); }
    else if (it.id === "readtime") { if (data.readTime) out.push({ id: "readtime", text: data.readTime.text }); }
    else if (it.id === "updated") { if (data.updated) out.push({ id: "updated", text: data.updated.text, iso: data.updated.iso }); }
    else if (it.id === "comments") { if (Number.isInteger(data.commentCount) && data.commentCount > 0) out.push({ id: "comments", text: `${data.commentCount} commentaire${data.commentCount > 1 ? "s" : ""}` }); }
    else if (it.id === "taxonomies") { if (data.tags && data.tags.length) out.push({ id: "taxonomies", items: data.tags }); }
  }
  return out;
}
// Liens de partage de l'URL réelle de l'article ; « copy » est géré par le navigateur (confirmation visible)
function shareLinks(cfg, { url, title }) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title || "");
  const map = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`, x: `https://x.com/intent/post?url=${u}&text=${t}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`, pinterest: `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`, telegram: `https://t.me/share/url?url=${u}&text=${t}`, email: `mailto:?subject=${t}&body=${u}`,
  };
  return SHARE_NETS.filter(([k]) => cfg.share.nets[k]).map(([k, label]) => ({ id: k, label, href: k === "copy" ? null : map[k] }));
}

// ---------- Publications similaires et navigation (données injectées : `candidates` = articles publiés du même site) ----------
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
function related(post, candidates, cfg, { parseTags }) {
  const r = cfg.related;
  if (!r.enabled) return [];
  const excluded = new Set(String(r.excludeCategories || "").split(",").map(slug).filter(Boolean));
  const cat = slug(post.category);
  const tags = new Set(parseTags(post.tags).map(slug));
  const seen = new Set([post.id]);
  const rows = [];
  for (const p of candidates) {
    if (!p || seen.has(p.id)) continue; // jamais l'article lu, jamais de doublon
    seen.add(p.id);
    if (excluded.size && excluded.has(slug(p.category))) continue;
    let score = 0;
    if (r.match !== "tags" && cat && slug(p.category) === cat) score += 3;
    if (r.match !== "category") for (const t of parseTags(p.tags)) if (tags.has(slug(t))) score += 2;
    rows.push({ p, score });
  }
  let list = rows.filter((x) => x.score > 0);
  // Pas assez de pertinentes : état vide plutôt que des articles sans rapport quand une correspondance est exigée par l'ordre « pertinence »
  if (r.order === "relevance") list.sort((a, b) => b.score - a.score || String(b.p.published_at).localeCompare(String(a.p.published_at)));
  else if (r.order === "recent") list.sort((a, b) => String(b.p.published_at).localeCompare(String(a.p.published_at)));
  else list.sort((a, b) => String(a.p.title).localeCompare(String(b.p.title), "fr"));
  return list.slice(0, r.count).map((x) => x.p);
}

// ---------- CSS ----------
const px = (n) => `${n}px`;
const colorValue = (v) => (v && v.startsWith("token:") ? `var(--kw-${v.slice(6)}, currentColor)` : v);
function boxCss(b, dev, prop) {
  const v = b && b[dev];
  if (!v) return "";
  const u = v.unit || "px";
  return SIDES.some((s) => v[s] !== null && v[s] !== undefined) ? SIDES.map((s) => (v[s] === null || v[s] === undefined ? "" : `${prop}-${s}:${v[s]}${u};`)).join("") : "";
}
const BP = { tablet: "(max-width: 1023px)", mobile: "(max-width: 767px)" };
function css(cfgIn, { breakpoints } = {}) {
  const cfg = cfgIn && cfgIn.titleArea ? cfgIn : normalize(cfgIn);
  const bps = { tablet: breakpoints && breakpoints.tablet ? `(max-width: ${breakpoints.tablet}px)` : BP.tablet, mobile: breakpoints && breakpoints.mobile ? `(max-width: ${breakpoints.mobile}px)` : BP.mobile };
  const out = { desktop: [], tablet: [], mobile: [] };
  const rule = (dev, sel, decl) => { if (decl) out[dev].push(`${sel}{${decl}}`); };
  const P = ".sp-page";
  const d = cfg.design;
  // Espacements
  const SPACE = { title: ".sp-header .post-title", meta: ".sp-header .article-meta", image: ".sp-header .article-cover", blocks: ".sp-content > *", paragraphs: ".sp-content p", headings: ".sp-content h2,.sp-content h3,.sp-content h4", images: ".sp-content img,.sp-content figure", quotes: ".sp-content blockquote", nav: ".sp-nav", related: ".sp-related", comments: ".sp-comments", author: ".sp-authorbox" };
  for (const dev of DEVICES) {
    rule(dev, `${P} .sp-article`, boxCss(d.spacing.outer, dev, "margin") + boxCss(d.spacing.inner, dev, "padding"));
    for (const [k, sel] of Object.entries(SPACE)) { const v = d.space[k] && d.space[k][dev]; if (v !== null && v !== undefined) rule(dev, sel.split(",").map((s) => `${P} ${s.trim()}`).join(","), k === "blocks" || k === "paragraphs" || k === "headings" || k === "images" || k === "quotes" ? `margin-block:${px(v)} !important;` : `margin-bottom:${px(v)};`); }
  }
  // Typographie
  const TYPE = { title: ".sp-header .post-title", subheadings: ".sp-content h2,.sp-content h3,.sp-content h4", content: ".sp-content", paragraphs: ".sp-content p", quotes: ".sp-content blockquote", lists: ".sp-content ul,.sp-content ol", links: ".sp-content a", captions: ".sp-content figcaption,.sp-header .article-cover figcaption", meta: ".sp-header .article-meta", author: ".sp-authorbox", readtime: ".sp-header .article-minutes", nav: ".sp-nav", related: ".sp-related", comments: ".sp-comments" };
  for (const [k, sel] of Object.entries(TYPE)) {
    const t = d.type[k]; const full = sel.split(",").map((s) => `${P} ${s.trim()}`).join(",");
    const fam = t.font ? (tokensLib.FONTS[t.font] ? tokensLib.FONTS[t.font].stack : fontLib.resolve(t.font)) : null;
    const base = [fam ? `font-family:${fam};` : "", t.weight ? `font-weight:${t.weight};` : "", t.lineHeight ? `line-height:${t.lineHeight};` : "", t.letterSpacing !== null && t.letterSpacing !== undefined ? `letter-spacing:${t.letterSpacing}px;` : "", t.transform ? `text-transform:${t.transform};` : "", t.align ? `text-align:${t.align};` : ""].join("");
    rule("desktop", full, base);
    for (const dev of DEVICES) if (t.size && t.size[dev] !== null && t.size[dev] !== undefined) rule(dev, full, `font-size:${px(t.size[dev])};`);
  }
  // Couleurs
  const C = d.color; const cv = colorValue;
  const col = (sel, prop, v) => (v ? `${sel}{${prop}:${cv(v)};}` : "");
  const push = (s) => { if (s) out.desktop.push(s); };
  push(col(`${P} .sp-header`, "background", C.titleArea.bg)); push(col(`${P} .sp-header`, "color", C.titleArea.text)); push(col(`${P} .sp-header .post-title`, "color", C.title.text));
  push(col(`${P} .sp-header .article-meta`, "color", C.meta.text)); push(col(`${P} .sp-header .article-meta a`, "color", C.meta.link)); push(col(`${P} .sp-header .article-meta a:hover`, "color", C.meta.linkHover));
  push(col(`${P} .sp-content`, "color", C.content.text)); push(col(`${P} .sp-content`, "background", C.content.bg));
  push(col(`${P} .sp-content a`, "color", C.links.text)); push(col(`${P} .sp-content a:hover`, "color", C.links.hover)); push(col(`${P} .sp-content a:focus-visible`, "outline-color", C.links.focus)); push(col(`${P} .sp-content a:active`, "color", C.links.active));
  push(col(`${P} .sp-content blockquote`, "color", C.quotes.text)); push(col(`${P} .sp-content blockquote`, "background", C.quotes.bg)); push(col(`${P} .sp-content blockquote`, "border-color", C.quotes.border));
  push(col(`${P} .sp-content figcaption,${P} .sp-header .article-cover figcaption`, "color", C.captions.text));
  push(col(`${P} .sp-authorbox`, "color", C.author.text)); push(col(`${P} .sp-authorbox`, "background", C.author.bg)); push(col(`${P} .sp-authorbox a`, "color", C.author.link)); push(col(`${P} .sp-authorbox a:hover`, "color", C.author.linkHover));
  push(col(`${P} .sp-nav`, "color", C.nav.text)); push(col(`${P} .sp-nav a`, "background", C.nav.bg)); push(col(`${P} .sp-nav a:hover`, "color", C.nav.hover)); push(col(`${P} .sp-nav a:focus-visible`, "outline-color", C.nav.focus));
  push(col(`${P} .sp-related`, "color", C.related.text)); push(col(`${P} .sp-related .sp-card`, "background", C.related.bg)); push(col(`${P} .sp-related a`, "color", C.related.link)); push(col(`${P} .sp-related a:hover`, "color", C.related.linkHover));
  push(col(`${P} .sp-comments`, "color", C.comments.text)); push(col(`${P} .sp-comments`, "background", C.comments.bg)); push(col(`${P} .sp-comments a`, "color", C.comments.link)); push(col(`${P} .sp-comments a:hover`, "color", C.comments.linkHover));
  push(col(`${P} .sp-share a,${P} .sp-share button`, "color", C.share.text)); push(col(`${P} .sp-share a,${P} .sp-share button`, "background", C.share.bg)); push(col(`${P} .sp-share a:hover,${P} .sp-share button:hover`, "background", C.share.hover)); push(col(`${P} .sp-share a:focus-visible,${P} .sp-share button:focus-visible`, "outline-color", C.share.focus));
  // Bordures et rayons
  const BSEL = { container: `${P} .sp-article`, authorBox: `${P} .sp-authorbox`, related: `${P} .sp-related .sp-card`, comments: `${P} .sp-comments` };
  for (const [k, sel] of Object.entries(BSEL)) {
    const b = d.border[k];
    if (b.width) push(`${sel}{${SIDES.map((s) => (b.width.top === undefined ? "" : `border-${s}-width:${b.width[s] === null ? 0 : b.width[s]}px;`)).join("")}border-style:solid;${b.color ? `border-color:${cv(b.color)};` : ""}}`);
    else if (b.color) push(`${sel}{border-color:${cv(b.color)};}`);
    if (b.radius) push(`${sel}{border-radius:${[b.radius.top, b.radius.right, b.radius.bottom, b.radius.left].map((v) => px(v === null ? 0 : v)).join(" ")};}`);
  }
  if (d.radius.images !== null) push(`${P} .sp-content img{border-radius:${px(d.radius.images)};}`);
  if (d.radius.buttons !== null) push(`${P} .sp-share a,${P} .sp-share button,${P} .sp-nav a{border-radius:${px(d.radius.buttons)};}`);
  // Ombres : seulement les images éditoriales du contenu (pas d'avatars, d'icônes ni de logos)
  const sh = (s) => `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${shadowColor(s.color, s.opacity)}`;
  if (cfg.imageShadow.enabled) push(`${P} .sp-content img:not(.emoji):not([width="16"]):not([width="24"]):not([width="32"]),${P} .sp-content figure.wp-block-image img{box-shadow:${sh(d.shadow.images)};}`);
  if (d.shadow.container.opacity > 0) push(`${P} .sp-article{box-shadow:${sh(d.shadow.container)};}`);
  // Largeur du contenu et colonnes
  const vars = [];
  if (cfg.content.width === "custom") vars.push(`--sp-content-width:${cfg.content.widthPx}px`);
  vars.push(`--sp-sidebar-width:${cfg.sidebar.width}px`, `--sp-gap:${cfg.sidebar.gap}px`, `--sp-related-cols:${cfg.related.columns}`, `--sp-related-gap:${cfg.related.gap}px`, `--sp-share-size:${cfg.share.size}px`, `--sp-share-gap:${cfg.share.gap}px`, `--sp-avatar:${cfg.authorBox.avatarSize}px`);
  out.desktop.unshift(`${P}{${vars.join(";")}}`);
  // Image mise en avant
  const fi = cfg.featured;
  out.desktop.push(`${P} .sp-header .article-cover{text-align:${fi.align};}${P} .sp-header .article-cover img{object-fit:${fi.fit};object-position:${fi.position};${fi.size === "custom" ? `width:100%;max-width:${fi.width}px;${fi.height ? `height:${fi.height}px;` : (fi.ratio !== "auto" ? `aspect-ratio:${fi.ratio};height:auto;` : "height:auto;")}` : (fi.size === "original" ? "width:auto;max-width:100%;height:auto;" : `width:100%;height:auto;${fi.ratio !== "auto" ? `aspect-ratio:${fi.ratio};` : ""}`)}${fi.align === "center" ? "margin-inline:auto;" : fi.align === "right" ? "margin-left:auto;" : ""}}`);
  const parts = [out.desktop.join("\n")];
  for (const dev of ["tablet", "mobile"]) if (out[dev].length) parts.push(`@media ${bps[dev]}{\n${out[dev].join("\n")}\n}`);
  return parts.filter(Boolean).join("\n").replace(/[<>]/g, "");
}
function shadowColor(c, opacity) {
  const m = /^#([0-9a-f]{6})$/.exec(c || "");
  if (!m) return `rgba(0,0,0,${(opacity || 0) / 100})`;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${(opacity || 0) / 100})`;
}
// Attributs de mise en page posés sur la page (le CSS statique lit ces attributs)
function layoutAttrs(cfg) {
  return { container: cfg.container.layout, containerStyle: cfg.container.style, sidebar: cfg.sidebar.layout, sidebarStyle: cfg.sidebar.style, sidebarMobile: cfg.sidebar.mobile, content: cfg.content.width, related: cfg.related.layout, titleAlign: cfg.titleArea.align, shareStyle: cfg.share.style };
}

module.exports = { cleanField, compact, F, DEFAULTS, DEVICES, TITLE_ITEMS, META_ITEMS, SHARE_NETS, SEPARATORS, UNITS, SIDES, normalize, resolve, controls, countWords, readingTime, formatDate, metaParts, shareLinks, related, css, layoutAttrs, get, set, defaultsOf: () => clone(DEFAULTS), byPath: (p) => BY_PATH.get(p) };
