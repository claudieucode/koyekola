// Personnalisateur → Types de publication → Page individuelle : déclaration des réglages (catalogue fermé du personnalisateur).
// Chaque réglage vit dans mk_sites.settings.pageSingle (pages/pageSingle.js : validation et rendu) ; rien n'est affiché ici qui ne soit rendu par le site public.
// `tab` : onglet du panneau (general | design) ; `group` : regroupement visuel ; `variant` : présentation (thumbs = vignettes, segmented = boutons) ; `device`/`side` : marges.
const P = "settings.pageSingle";
const PANEL = "type-page";

function register(add) {
  const o = (tab, extra = {}) => ({ scope: ["site"], tab, ...extra });
  add(`${P}.title.enabled`, PANEL, "toggle", "Page Zone de titre", o("general", { group: "title", help: "Affiche le titre de la page au-dessus de son contenu. Désactivée : aucun espace vide ; le titre reste dans les métadonnées SEO. Une page qui a déjà son propre titre de niveau 1 n'en reçoit pas un second." }));
  add(`${P}.title.align`, PANEL, "select", "Zone de titre : alignement", o("general", { group: "title", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], showIf: { [`${P}.title.enabled`]: true } }));
  add(`${P}.container.layout`, PANEL, "select", "Mise en page du conteneur", o("general", { group: "container", variant: "thumbs", thumb: "container", options: [["default", "Défaut du thème"], ["full", "Pleine largeur"], ["boxed", "Encadré (largeur standard)"], ["narrow", "Étroit (lecture)"], ["wide", "Large"]] }));
  add(`${P}.container.style`, PANEL, "select", "Style de conteneur", o("general", { group: "container", variant: "segmented", options: [["default", "Par défaut"], ["open", "Ouvert"], ["boxed-all", "Encadré - Tout"]], help: "Par défaut : le thème. Ouvert : sans cadre. Encadré - Tout : fond, bordure, rayon et ombre autour de tout le contenu." }));
  add(`${P}.sidebar.layout`, PANEL, "select", "Mise en page de colonne latérale", o("general", { group: "sidebar", variant: "thumbs", thumb: "sidebar", options: [["default", "Défaut du thème (sans colonne)"], ["none", "Sans colonne latérale"], ["left", "Colonne à gauche"], ["right", "Colonne à droite"]], help: "La colonne affiche la zone de widgets « Barre latérale » (Apparence → Widgets). Sans widget dans cette zone, aucune colonne vide n'est affichée sur le site." }));
  add(`${P}.sidebar.style`, PANEL, "select", "Style de colonne latérale", o("general", { group: "sidebar", variant: "segmented", options: [["default", "Par défaut"], ["open", "Ouvert"], ["boxed-all", "Encadré - Tout"]] }));
  add(`${P}.sidebar.width`, PANEL, "number", "Colonne latérale : largeur", o("general", { group: "sidebar", min: 200, max: 480, unit: "px" }));
  add(`${P}.sidebar.gap`, PANEL, "number", "Colonne latérale : espace avec le contenu", o("general", { group: "sidebar", min: 0, max: 96, unit: "px" }));
  add(`${P}.sidebar.stack`, PANEL, "select", "Colonne latérale sur tablette et mobile", o("general", { group: "sidebar", options: [["after", "Après le contenu"], ["before", "Avant le contenu"], ["hidden", "Masquée"]] }));
  add(`${P}.content.widthMode`, PANEL, "select", "Largeur du contenu", o("general", { group: "width", variant: "segmented", options: [["default", "Par défaut"], ["custom", "Personnalisé"]], help: "Par défaut : la largeur du site (Mise en page). Personnalisé : la largeur de ce réglage, sans jamais dépasser l'écran." }));
  add(`${P}.content.width`, PANEL, "number", "Largeur personnalisée — ordinateur", o("general", { group: "width", min: 240, max: 2400, unit: "px", nullable: true, showIf: { [`${P}.content.widthMode`]: "custom" } }));
  add(`${P}.content.tabletWidth`, PANEL, "number", "Largeur personnalisée — tablette", o("general", { group: "width", min: 240, max: 2400, unit: "px", nullable: true, showIf: { [`${P}.content.widthMode`]: "custom" } }));
  add(`${P}.content.mobileWidth`, PANEL, "number", "Largeur personnalisée — mobile", o("general", { group: "width", min: 240, max: 2400, unit: "px", nullable: true, showIf: { [`${P}.content.widthMode`]: "custom" } }));
  // Design : espacement (marge interne = padding, marge externe = margin du conteneur de la page), par appareil
  for (const [prop, label] of [["padding", "Marge interne"], ["margin", "Marge externe"]]) {
    for (const [dev, devLabel] of [["desktop", "ordinateur"], ["tablet", "tablette"], ["mobile", "mobile"]]) {
      for (const [side, sideLabel] of [["top", "en haut"], ["right", "à droite"], ["bottom", "en bas"], ["left", "à gauche"]]) {
        add(`${P}.${prop}.${dev}.${side}`, PANEL, "number", `${label} — ${devLabel}, ${sideLabel}`, o("design", { group: prop, device: dev, side, min: 0, max: 400, unit: "px", nullable: true }));
      }
    }
  }
  add(`${P}.title.size`, PANEL, "number", "Titre : taille", o("design", { group: "titleStyle", min: 16, max: 96, unit: "px", nullable: true }));
  add(`${P}.title.color`, PANEL, "color", "Titre : couleur", o("design", { group: "titleStyle", allowEmpty: true }));
  add(`${P}.title.paddingY`, PANEL, "number", "Titre : espace au-dessus et en dessous", o("design", { group: "titleStyle", min: 0, max: 240, unit: "px", nullable: true }));
  add(`${P}.container.background`, PANEL, "color", "Conteneur : arrière-plan", o("design", { group: "box", allowEmpty: true }));
  add(`${P}.container.borderWidth`, PANEL, "number", "Conteneur : épaisseur de bordure", o("design", { group: "box", min: 0, max: 12, unit: "px", nullable: true }));
  add(`${P}.container.borderColor`, PANEL, "color", "Conteneur : couleur de bordure", o("design", { group: "box", allowEmpty: true }));
  add(`${P}.container.radius`, PANEL, "number", "Conteneur : rayon des angles", o("design", { group: "box", min: 0, max: 64, unit: "px", nullable: true }));
  add(`${P}.container.shadow`, PANEL, "select", "Conteneur : ombre", o("design", { group: "box", options: [["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]] }));
}
module.exports = { register, PANEL };
