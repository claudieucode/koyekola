# KOLAKISA — Navigation principale illustrée (rail / dock)

Composant unique : `views/partials/app-rail.ejs` (inclus par la coque Marketing / CMS `marketing/partials/top.ejs` et par la coque « Mon espace » / SEO `partials/dash-open.ejs`). Données : `dashboard.NAV` (`src/services/dashboard.js`) via `res.locals.appRail` — **mêmes routes, mêmes clés, mêmes badges, mêmes permissions qu'avant** ; rien n'a été ajouté ni renommé.

## Icônes illustrées (`src/utils/dockIcons.js`, helper EJS `dockIcon(clé)`)
Tuiles à plat de 40 × 40, glyphe blanc, une touche d'or (`#f4b740`) — même langage que les illustrations (aplats, formes géométriques, une seule étincelle chaude). SVG en ligne : aucune requête, net en Retina, taille fixe donc aucun décalage de mise en page ; couleurs en classes `.dk-*` (`app-rail.css`). Une clé sans glyphe retombe sur l'icône monochrome habituelle (`icon()`).
La couleur désigne la **famille** de la rubrique, pas la rubrique : marine (contenu, structure, FAQ, à propos) · lagon (messages, blog, support, site) · baie (Marketing) · émeraude (SEO, centre de gestion, journal) · violet (apparence) · ardoise (réglages, déconnexion, plus). Ajouter une rubrique : ajouter sa clé et son glyphe dans `GLYPHS` (le test `dock-navigation-navigateur` échoue si une rubrique de `NAV` n'a pas d'icône).

## Comportement
| Contexte | Disposition |
|---|---|
| Grand écran (≥ 961 px) | colonne de tuiles à gauche (comme avant, même encombrement de 64 px). Survol / focus : l'icône à 1,16, ses deux voisines à 1,06 (`transform` seul, aucune dimension de mise en page, aucune boucle) ; infobulle ; entrée active = anneau blanc + liseré (visible sans animation) ; badge rouge discret en coin ; focus clavier = contour ciel de 3 px. |
| Option « barre en bas » (≥ 1360 px, pointeur précis) | bouton de bascule en bas du rail (`localStorage.kbDock`) ; dock centré **sur la zone de contenu** (jamais sur le menu latéral), le contenu réserve 96 px, les barres d'enregistrement collantes remontent. Défaut = colonne : les barres collantes, éditeurs et fenêtres partagent déjà le bas de l'écran, et 15 rubriques tiennent mieux en colonne. |
| Tablette et téléphone (< 961 px ; < 761 px dans « Mon espace ») | le rail devient un tiroir (inchangé) ; une **barre rapide** de 5 entrées (Accueil, Marketing, Messages avec badge, Gestion, Plus) reste à portée de pouce : cibles ≥ 56 px, texte 12 px, « Plus » ouvre le menu complet existant (même bouton ☰, même focus, même fermeture), la barre s'efface quand le tiroir ou le clavier virtuel est ouvert, marge de sécurité en bas (`env(safe-area-inset-bottom)`). |
| Mouvement réduit / niveaux `lite` et `off` (`kb-motion.js`) | aucun grossissement ; la navigation reste identique. Tactile (`hover: none`) : aucune fonction ne dépend du survol. |
Hauteur d'écran réduite : tuiles de 34 px (≤ 860 px de haut) puis 30 px (≤ 740 px).

## Accessibilité
Liens et boutons natifs ; nom accessible = libellé de la rubrique (+ « n non lu(s) ») ; icônes `aria-hidden` ; l'infobulle n'est jamais le seul moyen de comprendre (le nom accessible existe) ; `aria-current` sur l'entrée active ; contraste des tuiles et anneaux ≥ 3:1 sur le marine.

## Fichiers
`src/utils/dockIcons.js` · `src/middlewares/locals.js` (helper) · `views/partials/app-rail.ejs` · `public/css/app-rail.css` (tuiles, survol, barre rapide, dock en bas) · `public/js/kb-dock.js` (« Plus » et bascule de position : deux gestionnaires de clic) · `tests/dock-navigation-navigateur.test.js`.
