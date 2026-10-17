# Inventaire des fonctionnalités de mise en page et de rendu

*Statuts : **Opérationnel** (stockage → CSS → navigateur vérifié par un test de cette mission ou des précédentes) · **Partiel** · **Défectueux** · **Absent** · **Non testé** · **Limité volontairement**.*

| Domaine | Fonctionnalité | Statut | Preuve |
|---|---|---|---|
| Structure | Sections, conteneurs, colonnes, grille, pile, groupe, imbrication ≤ 8 niveaux, ≤ 400 éléments | Opérationnel | missions 1 ; mesures de ce rapport (380 éléments sur 7 niveaux) |
| Structure | Conteneur vide = zone d'édition | Opérationnel (canevas seulement, voulu) | parité |
| Structure | Déplacement entre parents sans perdre identité / réglages | Opérationnel | tests `editeur-structure*`, mission 1 |
| Affichage | `display` (bloc, flex, grille, en ligne, bloc en ligne, flex en ligne, aucun) | Opérationnel | priorité CSS ; parité ; aperçu immédiat |
| Flexbox | direction, retour à la ligne, justification, alignement, répartition des lignes, `gap` ligne / colonne, grow / shrink / basis, ordre, alignement individuel | Opérationnel | matrice (mission 2), parité, aperçu |
| Grille | colonnes / lignes (nombre ou pistes `fr px % auto`), pistes automatiques, remplissage, placement et étendue d'un enfant, alignements | Opérationnel | parité (3 écrans), tests préexistants |
| Grille | 2 colonnes max. sur tablette / 1 sur mobile par défaut | Opérationnel | `pageCss`, tests préexistants |
| Dimensions | largeur, hauteur, min / max, `auto`, `fit-content`, `min-content`, `max-content`, px % rem em vw vh | Opérationnel | matrice, priorité, parité |
| Dimensions | `calc()`, `clamp()`, `min()`, `max()`, `minmax()`, `ch`, `vmin`, `vmax` | **Limité volontairement** (sécurité) | mission 2 L1 |
| Espacements | marges / intérieurs 4 côtés liés ou non, négatifs pour marges et décalages, valeur du site (`token:`) | Opérationnel | mission 2 + parité |
| Position | statique, relative, collante, absolue, fixe ; haut / droite / bas / gauche ; `z-index` ; origine de transformation | Opérationnel | parité (absolu, z-index), priorité |
| Débordement | `overflow`, `overflow-x/y` (visible, masqué, auto, défilement, coupé), `visibility`, `pointer-events` | Opérationnel | parité, priorité |
| Responsive | valeurs propres par écran (ordinateur, grand écran, tablette, mobile), héritage, ↺ | Opérationnel | parité 3 écrans, mission 2 |
| Responsive | règles de bascule avancées (ordre inversé par écran, masquage par écran, taille des cassures personnalisée) | Partiel | **mission 4** |
| Éléments masqués | Masqués dans le publié ; en transparence dans l'éditeur | Opérationnel mais **occupent leur place dans la mise en page de l'éditeur** | mesuré (+35 px) |
| Rendu | Même générateur CSS et mêmes gabarits canevas / publié | Opérationnel | parité |
| Rendu | Aperçu immédiat avant rendu serveur : nombres, couleurs, **24 listes de mise en page** | Opérationnel (listes ajoutées ici) | `layout-apercu-immediat-navigateur` |
| Rendu | Aperçu immédiat pour les autres propriétés (ombres préréglées, polices, états, parties de widgets) | Partiel : attendent le rendu serveur (≈ 90 – 270 ms) | mesure |
| Rendu | Élément corrompu isolé (page non cassée) | Opérationnel | mission 1 |
| CSS | Sélecteurs `.kw-n-<id>` stables, sans collision, ordre des règles cohérent | Opérationnel | priorité |
| CSS | Nettoyage des règles inutiles | Opérationnel : seules les clés présentes écrivent une règle | architecture |
| Compatibilité | Anciennes pages rechargées | Opérationnel | tests préexistants (aucun échec en suite complète) |
| Alignement avancé | `justify-items` / `justify-self` en flex | Limité par CSS (propriétés de grille) | n/a |
| Absent | `grid-template-areas`, sous-grilles, requêtes de conteneur, `aspect-ratio` libre (7 préréglages), `clip-path` libre | Absent | écarts |
