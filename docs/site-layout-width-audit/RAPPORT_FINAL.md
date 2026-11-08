# Rapport final — largeurs des sites publiés

Branche `largeurs-site-architecture` (partie de `origin/main`). Mesures faites dans Chrome (Playwright), pas seulement lues dans le code.

## Cause confirmée par reproduction
`src/marketing/themes/packs/base.css` (règle ligne 4) plafonnait **tout** bloc de premier niveau sans `.pk-bleed` à `--pk-max` (1280 px, `!important`). Les en-têtes et pieds de page du Theme Builder (classe `lp-part-bleed`, donc conçus pour toucher les bords) étaient pris dans ce plafond.
Mesure avant correction (en-tête et pied de la bibliothèque, base.css injectée) : 375 / 768 / 1280 px → pleine largeur ; **1920 px → 1280 px de large, décalé de 320 px ; 2560 px → 1280 px, décalé de 640 px**. C'est exactement ce que montre la première capture (fond de page visible de chaque côté).

## Corrections livrées
1. `packs/base.css` : `:not(.lp-part-bleed)` ajouté à la règle de plafond. Le fond des parties globales traverse l'écran ; leur contenu garde son alignement (le conteneur « bande » recentre son contenu sur la largeur des conteneurs du site) ; le contenu du corps de page garde sa colonne.
   Après : en-tête et pied à 100 % de la fenêtre à 375, 768, 1280, 1920 et 2560 px, `scrollWidth == clientWidth`, un seul en-tête et un seul pied.
2. `public/css/style.css` : jeton `--kw-w-wide` qui pilote `.container-wide` : 1240 px comme avant jusqu'à 1799 px, 1520 px au-delà. Mesuré : à 1440 px rien ne change ; à 1920 et 2560 px le contenu passe de 1240 à 1520 px et la grille des formations de 4 à 5 colonnes ; aucun débordement horizontal ; en-tête et pied des pages classiques déjà à 100 %.
3. Test `tests/parties-pleine-largeur-navigateur.test.js` : réussit avec la correction, **échoue sans** (vérifié).

## Tests exécutés (résultats réels)
- `header-isolation` + `theme-builder-entetes-corpo-navigateur` : 11/11.
- `accueil-catalogue-navigateur` + `a-propos-navigateur` + nouveau test : 19/19.
- Mesure des 130 démos de thèmes à 1920 px : aucun débordement horizontal ; à 390 px, 2 thèmes débordent (`corde-et-bois`, `performance-pure`) — présents avant ma modification, non traités.

## Non traité volontairement (à décider séparément)
- **Colonne par défaut de 760 px** (`landing.css:26`) et colonnes internes de 720-880 px de nombreux thèmes : les relever change l'aspect de sites déjà publiés ; ce sont des choix d'identité de thème.
- **Onze thèmes** dont leur propre CSS plafonne les blocs d'en-tête/pied (`abysse`, `volume`, `seve`, `moustache`, `pointe`, `lyrique`, `jardin`, `manuel`, `millesime`, `speakeasy`, `cimaise`) : sélecteurs `:not(.pk-bleed)` propres à chaque thème, à revoir thème par thème.
- Vues EJS à 900 / 620 px (`.container`, `.container-narrow`), boutique à 1120 px (`.sh-main`) : volontairement étroites pour la lecture / les formulaires, ou à traiter avec la boutique.
- Éditeur : les contrôles « Largeur du contenu » (encadrée / fond pleine largeur / pleine largeur / personnalisée) existent déjà ; aucune modification faite.
- Tests complets du dépôt et audits `audit-interface` / `audit-qualite` / `audit-responsive` : voir la fin de la conversation pour leur état.

## Complément (2e capture) : sections ordinaires
Après la première correction, l'en-tête et le pied étaient pleine largeur, mais les sections du corps (bandeaux avec fond ou image) restaient dans une boîte de 1280 px. `packs/base.css` : le bloc d'une section ordinaire occupe maintenant 100 % de la largeur (fond et image s'étalent) ; son contenu garde exactement sa position, calculée par une marge latérale `max(gouttière, (100 % − --pk-max)/2 + gouttière)`. Test navigateur ajouté (5 largeurs : bloc à 100 %, texte à la même place, aucun débordement). Les 130 démos de thèmes : largeur des blocs inchangée (elles utilisent `.pk-bleed`), mêmes 2 débordements préexistants à 390 px.
