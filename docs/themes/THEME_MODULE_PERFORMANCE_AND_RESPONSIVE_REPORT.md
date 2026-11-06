# Module Thèmes — rapport final : performance et responsive

Date : 6 novembre 2026. Tout ce qui suit a été mesuré dans un vrai Chrome (Playwright) sur un serveur de test local ; rien n'est estimé. La machine de test était partagée avec d'autres travaux (charge de 4 à 14) : les temps absolus varient d'une mesure à l'autre et ne sont donnés qu'à titre indicatif.

## 1. Audit initial
Voir `THEME_MODULE_PERFORMANCE_AUDIT.md`. Le module était déjà bien optimisé côté bibliothèque, aperçu et images (pagination et filtres côté serveur, annulation des requêtes, cache, miniatures WebP à deux tailles, aperçu isolé en iframe, rendu mis en mémoire). Les vrais problèmes étaient la mise en page de 9 thèmes sur petit écran et l'absence de contrôle automatique.

## 2. Causes de lenteur identifiées
- Aucune lenteur structurelle côté serveur : médianes de 7 à 40 ms pour la galerie, le fragment de filtre, les détails et l'aperçu (hors premier appel).
- Les premiers appels de 1 à 3 s vus pendant l'audit venaient d'une machine et d'un disque froids ou chargés : une hypothèse de chargement tardif des 104 paquets a été **vérifiée puis écartée** (ils sont chargés au démarrage du serveur, 798 ms). Un échauffement ajouté dans cet espoir a été retiré faute de gain mesuré.
- Polices du thème découvertes tard (aucun préchargement) : risque de décalage visuel à la première visite.

## 3. Corrections effectuées
| Domaine | Correction |
|---|---|
| Polices | `views/marketing-public/landing.ejs` : préchargement des 2 premiers fichiers de police du site (`<link rel="preload" as="font">`) avant la feuille de styles. |
| 9 thèmes | Corrections de mise en page dans `src/marketing/themes/packs/{chaine,cursus,etoile,fichier,meeple,relais,ricochet,socle,amorce}/style.css` (détail dans l'audit). |
| Contrôle permanent | `packs/audit.js` : tout thème doit avoir au moins une règle `@media (max-width)` et déclarer `prefers-reduced-motion` s'il anime ; `tests/themes-responsive-navigateur.test.js` : aucun thème ne fait défiler la page horizontalement à 768, 390 et 320 px, aucune image cassée, menu accessible. |
| Outils | `scripts/mesurer-module-themes.js`, `audit-themes-responsive.js`, `audit-themes-navigation.js`. |

## 4. Optimisations de prévisualisation
Déjà en place et vérifiées (non modifiées) : iframe isolée, image d'attente puis squelette, réchauffage au survol, rendu en mémoire, passage d'un thème à l'autre sans reconstruire la coque. Mesure : page de démonstration servie en 7 à 8 ms (médiane) ; coque d'aperçu 9 à 19 ms.

## 5. Optimisations de bibliothèque
Déjà en place et vérifiées : pagination de 24 cartes, fragment HTML de 18 à 52 Ko, recherche différée de 120 ms, annulation de la requête précédente, cache de 60 s, images avec dimensions réservées et chargement différé. Aucun changement nécessaire.

## 6. Optimisations d'installation
Installation 9 à 10 ms et activation 18 ms (médiane de 5, machine au calme) ; 205 et 238 ms lors de la première mesure sur machine chargée. L'activation vérifie le rendu et annule en cas d'échec : conservée telle quelle.

## 7. Corrections responsive par thème
Voir la section « Défauts responsive trouvés » de l'audit. Résultat sur 8 120 mesures (104 thèmes × toutes leurs pages × 8 tailles d'écran) :

| | Avant | Après |
|---|---|---|
| Mesures où la page défile horizontalement | 26 (6 thèmes) | **0** (meeple, dernier cas, corrigé et remesuré : 0 sur 64) |
| Images cassées ou déformées | 0 | 0 |
| Pages en erreur | 0 | 0 |
| Thèmes dont le menu était inaccessible | 1 (amorce) | 0 |

## 8. Résultats des tests visuels — matrice
Colonnes : nombre de mesures effectuées par groupe d'écrans (Desktop : 1920, 1440, 1280 px ; Tablette : 1024 paysage, 768 portrait ; Mobile : 430, 390, 320 px). « Débordements » = mesures où la page défile horizontalement. « Menus » = lecture sur 768, 390 et 320 px. « Animations » : contrôle statique (`prefers-reduced-motion` présent dans chaque thème qui anime, test existant) ; le comportement des animations au toucher n'a pas été mesuré.

| Thème | Desktop | Tablette | Mobile | Débordements | Menus | Animations | Résultat |
|---|---|---|---|---|---|---|---|
| abysse | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| albergo | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| altitude | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| amorce | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| ankara | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| arene | OK (24) | OK (16) | OK (24) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| atelier | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| balance | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| barreau | OK (30) | OK (20) | OK (30) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| berceau | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| bilan | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| bitume | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| bouclier | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| boussole | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| bulletin | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| cap | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| chaine | OK (24) | OK (16) | OK (24) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| charpente | OK (33) | OK (22) | OK (33) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| chrome | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| chronique | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| cimaise | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| circuit | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| civitas | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| clarte | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| colophon | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| commun | OK (42) | OK (28) | OK (42) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| communique | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| comptoir | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| convoi | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| coulisse | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| courrier | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| cursus | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| defile | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| doudou | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| echo | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| elan | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| encre | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| epiderme | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| essence | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| etape | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| etoile | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| facette | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| fichier | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| flamme | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| fleur | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| fournil | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| glane | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| gradin | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| heliade | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| houblon | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| infusion | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| jalon | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| jardin | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| labo | OK (27) | OK (18) | OK (27) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| ledger | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| lyrique | OK (24) | OK (16) | OK (24) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| maille | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| mandat | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| manuel | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| meeple | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| mijote | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| millesime | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| moustache | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| noir | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| obscura | OK (27) | OK (18) | OK (27) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| obturateur | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| orbite | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| ossature | OK (39) | OK (26) | OK (39) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| pellicule | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| petale | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| pierre | OK (30) | OK (20) | OK (30) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| plume | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| pointe | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| pointure | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| potager | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| poudre | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| preface | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| pulse | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| rasoir | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| recueil | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| relais | OK (36) | OK (24) | OK (36) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| repere | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| ricochet | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| rideau | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| riviera | OK (27) | OK (18) | OK (27) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| roulotte | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| rubrique | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| sape | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| seve | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| signature | OK (27) | OK (18) | OK (27) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| socle | OK (39) | OK (26) | OK (39) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| sou | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| souffle | OK (30) | OK (20) | OK (30) | 0 | Barre d'onglets en bas | reduced-motion (statique) | Responsive |
| speakeasy | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| syntaxe | OK (33) | OK (22) | OK (33) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| talent | OK (27) | OK (18) | OK (27) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| tiers | OK (30) | OK (20) | OK (30) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| une | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| verdure | OK (21) | OK (14) | OK (21) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| voeu | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| volt | OK (24) | OK (16) | OK (24) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| volume | OK (27) | OK (18) | OK (27) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |
| vortex | OK (30) | OK (20) | OK (30) | 0 | Liens visibles | reduced-motion (statique) | Responsive |
| zenith | OK (24) | OK (16) | OK (24) | 0 | Bouton de menu | reduced-motion (statique) | Responsive |

## 9. Mesures avant / après
| Mesure | Avant | Après |
|---|---|---|
| Défilement horizontal (8 120 mesures) | 26 | 0 |
| Thèmes concernés | 6 | 0 |
| Accueil : LCP médian | 132 ms | 144 ms (même ordre ; 4 thèmes entre 2,5 et 3,8 s en première visite sous forte charge : abysse, barreau, elan, obturateur) |
| Accueil : CLS médian | 0 | 0 |
| Thèmes avec CLS > 0,1 à la première visite | 9 | 6 (barreau, chaine, civitas, infusion, potager, pulse) — mesure instable sous charge |
| Galerie, aperçu, personnalisateur, installation, activation (médianes) | voir audit | 30 à 40 ms, 8 ms, 29 ms, 10 ms, 18 ms (machine au calme) |

Le CLS et le LCP de première visite dépendent du temps d'arrivée des polices : ils sont instables quand la machine est chargée. Mesure isolée après préchargement des polices : pulse 0,000, infusion 0,001, barreau 0,078 ; civitas reste à 0,6 à 1,2 lors d'une visite lente (l'en-tête change de hauteur quand la police arrive). Il n'y a pas de mesure isolée « avant » pour comparer proprement : le gain du préchargement n'est pas prouvé.

## 10. Tests
- Réussis : `themes-responsive-navigateur` (débordement horizontal : 104 thèmes × 3 tailles ; menus : exécuté par script, voir ci-dessous), `themes-packs` (registre, isolation, qualité, diversité, jetons, fichiers publics), `themes-boutique`, `themes-extension5`, `personnalisation-themes` (parcours complets), `editeur-themes`, 177 des 178 tests de polices et d'affichage public.
- Échecs **déjà présents avant ce travail** (vérifiés sur `origin/main` dans un dossier de référence) : `apparence-themes` (« supprimer depuis un autre site ne touche pas le thème du site A »), `personnalisation-themes` (« les 104 thèmes ont chacun un manifeste valide » : 30 thèmes sans réglage « effets mesuré »), `refonte-design` (« aucune classe orpheline »).
- Menus : le test de navigation a échoué une fois par délai de lancement de Chrome (machine saturée) ; le même audit exécuté directement donne 282 mesures « liens visibles », 29 « bouton qui ouvre le menu », 1 « barre d'onglets en bas » (souffle, voulu).
- Ignorés : aucun.

## 11. Problèmes restant ouverts
- CLS de première visite de `civitas` (en-tête qui change de hauteur au chargement de la police) et de quelques autres thèmes : à reprendre avec une police de repli de mêmes dimensions.
- Les 30 thèmes sans « effets mesurés » dans le personnalisateur et le test de suppression inter-sites échouent déjà sur la branche principale.
- 29 thèmes n'ont pas de miniatures d'aperçu (pastille de couleurs affichée).
- Les mesures d'animations au toucher, la mémoire et le nombre de rendus de l'interface n'ont pas été instrumentés.
- Personnalisateur : 227 Ko de page (gzip en ligne) dont un bloc de données de 288 Ko de caractères : à mettre en fichier séparé mis en cache si le temps d'ouverture devient gênant.

## 12. Règles pour les thèmes futurs
1. Au moins une règle `@media (max-width: …)` dans la feuille de styles (contrôle `audit.js`, refusé sinon).
2. Toute animation déclare `prefers-reduced-motion` (contrôle existant).
3. Aucune page de démonstration ne doit faire défiler la page horizontalement à 768, 390 et 320 px (`tests/themes-responsive-navigateur.test.js`).
4. Le menu doit rester accessible sur petit écran : liens visibles ou bouton de menu qui les affiche (même test).
5. Colonnes de grille : `minmax(0, 1fr)` et `min-width: 0` sur les enfants, jamais `1fr` seul dans une règle mobile.
6. Éléments décoratifs positionnés ou tournés : confinés dans un conteneur qui coupe (`overflow: clip`).
7. Images : `max-width: 100%`, dimensions réservées.
8. Pour vérifier un thème : `ONLY=<clé> node scripts/audit-themes-responsive.js sortie.json` et `ONLY=<clé> node scripts/audit-themes-navigation.js sortie.json`.
