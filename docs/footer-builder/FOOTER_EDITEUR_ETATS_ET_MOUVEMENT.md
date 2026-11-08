# Éditeur du pied : états par écran, mouvement réduit, options de pied (chantier D)

Écarts traités : 23 (réglages du pied), 24 (états par écran), 28 (mouvement réduit général), 40 (retour en haut). Tests : `tests/footer-editeur-etats.test.js`.

## 1. États par écran (survol, focus, clic)

### Modèle de données (rétro-compatible)
`states` reste un objet plat `{ clé: réglages }`. La clé sans écran (`hover`, `focus`, `active`) est l'état de l'**ordinateur** : c'est exactement l'ancien format, lu et écrit tel quel. Les autres écrans ajoutent un suffixe :

| Clé | Écran |
|---|---|
| `hover` | ordinateur (et tous les écrans plus petits qui n'ont pas de réglage propre) |
| `hover@wide` | grand écran |
| `hover@tablet` | tablette |
| `hover@mobile` | mobile |

Pas de migration : les anciennes données n'ont que `hover`, `focus`, `active`. Une clé inconnue (`hover@xxl`, `pressed`) est ignorée à l'enregistrement, jamais écrite. Tout le code qui parcourt `states` (presse-papiers de style, réinitialisation, classes globales, modèles, parties de widgets) traite chaque clé comme un jeu de réglages ordinaire : rien d'autre n'a dû changer.

### CSS généré (`src/marketing/pages/nodes.js`)
* `STATE_SCOPES` = états × écrans ; `stateRules()` écrit les règles de **tous** les éléments, parties de widgets et classes globales.
* L'ordinateur est écrit dans le corps de la feuille (sortie identique à avant pour les anciennes données), chaque autre écran dans **sa** requête de média, qui arrive après. L'héritage ordinateur → tablette → mobile est donc la cascade CSS : un écran qui ne règle que la couleur garde le reste de l'ordinateur. Le grand écran hérite de l'ordinateur seulement (jamais de la tablette), comme pour l'état normal.
* Isolation : chaque règle porte l'identifiant de l'élément (`.kw-n-<id>`) ; régler le survol mobile d'un bouton n'écrit rien pour ses voisins ni pour l'ordinateur (testé en CSS et dans Chrome).

### Interface (`public/js/page-builder.js`)
* Le sélecteur d'état existant (groupe de boutons radio « État de l'élément ») et le sélecteur d'écran se combinent : choisir **Mobile** puis **Survol** écrit dans `hover@mobile`. Le point d'entrée unique est `styleSet()`/`stateKey()` : tous les champs, l'historique, l'enregistrement et « restaurer » en profitent.
* Valeurs héritées affichées en gris (`inheritedValue`) : sur Mobile en survol, la valeur de la tablette puis de l'ordinateur.
* Indicateurs : pastille sur chaque bouton d'état qui a des réglages (nombre pour l'écran dans le libellé lu par les lecteurs d'écran, total dans l'infobulle) ; icônes d'écran à côté d'un champ qui a une valeur propre sur un autre écran, **aussi en mode état** ; le bouton « Régler : Survol (n, tous écrans) » dans l'onglet Avancé ; la fiche d'un élément liste « survol (mobile) ».
* Note explicative sous le sélecteur : dit sur quel écran le style s'applique et que les autres écrans ne changent pas.
* **Aperçu immédiat dans le canevas** : tant qu'un état est choisi et un seul élément sélectionné, l'élément est affiché dans cet état sans survol réel (`forceStatePreview` : les règles `.kw-n-<id>:hover` de la page sont recopiées avec une classe `.pb-force-state`, requêtes de média comprises, donc l'aperçu suit l'écran choisi). La balise `<style id="pb-force-state">` est ignorée par la mise à jour incrémentale du canevas. Limite : pas pour les parties d'un widget.
* **Focus visible au clavier** : l'état focus utilise déjà `:focus-visible` (jamais au clic de souris). Un contour réglé par l'auteur sur cet état reçoit une classe doublée (`.kw-n-x.kw-n-x:focus-visible`) pour l'emporter sur le contour par défaut du site (`landing.css`) : **seul changement de sortie CSS pour d'anciennes données**, et uniquement quand l'état focus règle un contour.
* **Conserver le contour de focus** : garde-fou toujours actif (`keepFocusRing`). Si un état focus supprime le contour (style « aucun » ou épaisseur 0) sans le remplacer par un autre repère visible (ombre, bordure, fond, dégradé, soulignement), la suppression est écartée et le reste s'applique. Il n'y a pas de case à cocher : une case « supprimer le contour » serait un piège d'accessibilité ; le garde-fou ne lève que si un remplaçant est réglé.

Accessibilité : les sélecteurs sont des boutons natifs (tabulation, Entrée/Espace), `role="radiogroup"` / `role="radio"` avec `aria-checked` correct, libellés explicites, contour de focus visible sur les boutons d'état. La pastille est positionnée dans le coin du bouton (aucun décalage du panneau).

## 2. Mouvement réduit général

Avant : entrées, défilement, souris, vidéo de fond, survols préconfigurés et chaque composant avaient leur règle ; **pas** les transitions ni transformations posées à la main.

Maintenant, **une seule règle générée par page** (dans `pageCss`, donc identique sur le site public, l'aperçu et le canevas) :

```css
@media (prefers-reduced-motion:reduce){ .kw-node:not([data-kw-motion-always],[data-kw-motion-always] *), … *{transition:none!important} }
```
* Écrite seulement si la page contient au moins une transition (`transitionDuration` d'un élément, d'une partie, d'une classe) : une page sans transition garde exactement la même feuille.
* Les **changements d'état instantanés restent** : la couleur ou l'ombre au survol sans durée change toujours (seule la transition disparaît).
* Une **transformation posée sur un état** (survol, focus, clic) est un mouvement : elle n'est écrite que sous `@media (prefers-reduced-motion:no-preference)`. Une transformation fixe de l'état normal (rotation décorative, centrage) n'est pas un mouvement et reste.
* Classes globales : même traitement (`transition:none!important` sous `reduce`, transformation d'état sous `no-preference`).
* Animations d'entrée, défilement, souris : déjà neutralisés (`landing.css` l. 671, `kw-effects.js`, `landing.js`) ; non modifiés.
* **Option « garder malgré le mouvement réduit »** : elle existait déjà (`motion.alwaysMotion`, case « Respecter les préférences système de mouvement réduit » décochée dans Effets de mouvement, attribut `data-kw-motion-always`). Désactivée par défaut. Justification : seulement pour un mouvement qui porte l'information (ex. une jauge qui se remplit). L'élément et ses descendants échappent à la règle générale et à l'exception sur les transformations d'état.

Preuve navigateur : `Emulation.setEmulatedMedia` (méthode `emulateMedia` ajoutée au pilote `tests/helpers-chrome-cdp.js`, ajout sans effet sur les autres tests).

## 3. Options du pied

| Demande | État | Où |
|---|---|---|
| Largeur pleine / encadrée du conteneur principal | **Déjà exposée** | Inspecteur d'un conteneur, « Largeur du contenu » : encadrée, fond pleine largeur + contenu encadré, pleine largeur, personnalisée (`page-builder.js` ~l. 4231) |
| Barre inférieure activable avec séparation | **Ajoutée** : bloc « Barre du bas (copyright, mentions, retour en haut) », catégorie « Pied de page » de la bibliothèque de blocs (`patterns.js`, clé `footer-bar`, classée dans `libraryMeta.js`) | Trait en haut (`border-top`), copyright automatique + informations légales (données de l'entreprise) + retour en haut en ligne ; colonne centrée sur mobile ; « activable » = l'œil de l'arborescence la masque sans la supprimer |
| Retour en haut : réglages exposés | **Déjà exposés** par le schéma du widget : mode (bouton fixé / lien en ligne), coin, texte lu par les lecteurs d'écran, afficher le texte, seuil de défilement | Testé : le catalogue de l'éditeur contient ces 5 champs |
| Visibilité par appareil | **Déjà exposée** : « Masqué sur » (ordinateur, tablette, mobile, grand écran) sur tout élément | Onglet Avancé |
| Image / vidéo de fond | **Déjà exposées** : image, dégradé et voile dans le groupe « Fond » ; vidéo de fond (`.mp4`/`.webm`, début, fin, une seule lecture, image de secours, pause en mouvement réduit) dans l'onglet Avancé de tout conteneur | |
| Pied « collant » | **Exclu volontairement** | Voir ci-dessous |

### Pourquoi pas de pied collant
Un pied fixé en bas de l'écran masque du contenu (surtout sur mobile, où il peut prendre la moitié de l'écran), recouvre la cible quand on tabule au clavier (échec du critère « focus non masqué », WCAG 2.4.11), se superpose au bouton « Retour en haut » fixé et aux bandeaux de consentement, et les barres du navigateur mobile qui apparaissent/disparaissent le font sauter. Les pieds du catalogue sont de grands blocs d'information, pas des barres d'action. Si un besoin réel apparaît (petite barre d'action mobile), il devra être traité à part : hauteur plafonnée, jamais sur les liens de navigation, masqué quand le clavier est utilisé.

## 4. Limites connues
* L'aperçu forcé d'un état ne couvre pas les parties de widgets (menu, carte…) : leur survol se voit en passant la souris.
* Les clés `hover@…` sont aussi lues par le Studio IA (`ai/studio.js`) seulement pour l'ordinateur : il ne propose pas encore d'états par écran.
* Le garde-fou de focus ne juge pas le contraste du repère de remplacement.
* La règle générale de mouvement réduit couvre les transitions ; les animations CSS posées uniquement par du « CSS personnalisé » d'un élément ne sont pas neutralisées (le CSS personnalisé est de la responsabilité de l'auteur).
* Les pieds du catalogue (chantier F) n'utilisent pas encore d'états par écran.

## 5. Fichiers touchés
`src/marketing/pages/nodes.js` (états par écran, mouvement réduit, focus), `src/marketing/pages/parts.js` (état de partie), `src/marketing/pages/patterns.js` + `libraryMeta.js` (barre du bas), `public/js/page-builder.js` (clé d'état par écran, héritage, indicateurs, aperçu forcé), `public/css/page-builder.css` (pastille d'état), `tests/footer-editeur-etats.test.js` (nouveau), `tests/helpers-chrome-cdp.js` (méthode `emulateMedia`).
