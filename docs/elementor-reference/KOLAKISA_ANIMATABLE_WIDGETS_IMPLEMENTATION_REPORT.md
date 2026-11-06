# Rapport d'intégration — widgets animables (5 novembre 2026)

## Constat de départ
L'audit (`KOLAKISA_EDITOR_ANIMATION_AUDIT.md`) montre que Kolakisa avait **déjà** un moteur d'animation complet et centralisé (`node.motion` : 63 animations d'entrée / sortie / attention, 4 déclencheurs, 16 survols, défilement, souris et inclinaison 3D, `prefers-reduced-motion` respecté partout) et la plupart des widgets animables (compteur, barre de progression, titre animé, Lottie, carrousels, boîte retournable, points d'intérêt, marquee…). L'écart avec Elementor se situait dans les **réglages propres à certains widgets**. Ce lot comble les plus utiles ; aucun second moteur n'a été créé.

## A. Widgets effectivement ajoutés (lot 2 : le registre passe de 102 à 104 types)
| Widget | Groupe | Fonction | Composants modifiables | Animations |
|---|---|---|---|---|
| **Avis clients** (`reviews`) | Général | Plusieurs avis réels en grille (1 à 3 colonnes) ou en liste, avec note moyenne calculée à partir des notes saisies | titre, présentation, colonnes, note moyenne affichée ou non ; pour chaque avis (12 au plus) : nom, fonction, note 0-5, texte, date, source, photo ; styles de 8 parties (titre, note moyenne, carte, étoiles, texte, nom, fonction, photo) | mouvement générique de l'élément (entrée, survol, défilement…) |
| **Texte animé (lettre par lettre)** (`splittext`) | Avancé | Un texte qui apparaît lettre par lettre ou mot par mot | texte, balise (h1-h4, p), découpage, 5 effets (montée, fondu, flou, glissement, zoom), décalage 10-300 ms, durée 200-1500 ms, démarrage (à l'écran / au chargement), alignement ; style des lettres | cascade propre ; coupée sous « mouvement réduit » et dans l'éditeur ; texte complet lisible par les lecteurs d'écran |

Contenu de départ des avis : entre crochets (`[Prénom N.]`, `[Écrivez ici l'avis réel…]`) — aucun faux avis.

## B. Widgets existants améliorés (réglages optionnels, anciennes pages inchangées à l'octet près)
| Widget | Nouveaux réglages (éditeur → page publiée) |
|---|---|
| Compteur | délai de départ, courbe du comptage (douce / régulière / rapide puis lente), valeur de départ |
| Barre de progression | durée du remplissage, courbe (si « remplir à l'apparition » est coché) |
| Titre animé | effets glissement, flou, zoom (en plus de fondu et machine à écrire) ; curseur clignotant désactivable |
| Boîte retournable | sens vertical, vitesse du retournement |
| Image à points d'intérêt | pulsation des points |

Tous : valeurs bornées, listes fermées ; une valeur invalide est ignorée sans bloquer l'enregistrement ; la valeur par défaut n'est jamais écrite (aucune donnée superflue, anciennes pages identiques).

### Lot 2 — améliorations de widgets existants et du moteur
| Fonction | Où | Détail |
|---|---|---|
| Défilement continu avec images | widget Défilement continu | image ou logo facultatif par élément, 3 tailles ; texte alternatif sur la liste visible, copie de boucle cachée aux lecteurs d'écran |
| Transitions des carrousels | Diaporama, Carrousel de témoignages, Carrousel média, Carrousel d'images | « Fondu » (un seul élément visible, les autres masqués) ou défilement ; 1 à 4 éléments visibles à la fois (bureau, 1 sur mobile ; pas pour le diaporama) |
| Aperçu Lottie dans l'éditeur | widget Lottie | première image de l'animation affichée dans le canevas (aucune lecture) ; lecture normale sur la page publiée |
| Parallaxe d'arrière-plan | Effets de mouvement de tout élément | 4 amplitudes (légère à très forte), un seul écouteur de défilement passif, coupée dans l'éditeur et en mouvement réduit |

## C. Fonctionnalités d'animation
Inchangées et déjà complètes : entrées/sorties/attention (63), survol (16), clic (déclencheur + action « Rejouer »), défilement, souris, Lottie (lecture réelle en public, encadré dans le canevas), `prefers-reduced-motion`. Ce lot : la pulsation des points est coupée en « mouvement réduit », le compteur reste statique en « mouvement réduit » et dans l'éditeur.

## D. Non intégré (honnêtement)
Effets de carrousel autres que le fondu (cube, coverflow), surlignage animé du titre (cercle, soulignement dessiné), fichiers `.lottie` (seul `.json`), lecture Lottie liée au défilement, retournement par échelle négative, « Progress Tracker » sur un conteneur, durée/courbe réglables du survol, carrousel imbriqué (conteneur en mode carrousel) sans les nouvelles transitions. Détail et priorités : `ELEMENTOR_WIDGETS_TO_KOLAKISA_MAPPING.md`.

## E. Tests
- `tests/widgets-animes-lot2.test.js` : **17/17** (validation, rendu par le vrai serveur — aperçu ET canevas de l'éditeur —, CSS/JS publics).
- **Vérification dans un vrai Chrome** (script `e2e-lot2.js`, 18 contrôles, avec et sans « mouvement réduit ») : fondu du carrousel (une seule diapositive visible, suivant / précédent / boucle), texte animé (caché avant l'arrivée à l'écran, cascade croissante, toutes les lettres visibles ensuite), parallaxe (la position du fond change au défilement, immobile en mouvement réduit), défilement continu actif/coupé, aucune erreur JavaScript. Ce test a révélé et fait corriger un défaut (diapositives non masquées).
- `tests/widgets-animes-reglages.test.js` : **15/15** (validation, rétro-compatibilité, CSS publié, scripts publics, éditeur, rendu par le vrai serveur).
- Avec lui, tous verts : `widgets-parts-regression` (sortie de tous les types inchangée), `widgets-parts-couverture`, `widgets-contrat`, `moteur-mouvement`, `widgets-parts`.
- Non faits : suite complète (~7 800 tests), tests navigateur Chrome (lecture réelle des animations), mesures de performance.

## F. Documentation
`docs/elementor-reference/` : `ELEMENTOR_OVERVIEW.md`, `ELEMENTOR_WIDGETS_CATALOG.md` (≈ 25 fiches détaillées sur 119 ; le reste en listes), `ELEMENTOR_ANIMATIONS_REFERENCE.md`, `ELEMENTOR_REFERENCE_SOURCES.md` (47 sources, points « non confirmés » signalés), `KOLAKISA_EDITOR_ANIMATION_AUDIT.md`, `ELEMENTOR_WIDGETS_TO_KOLAKISA_MAPPING.md`, et ce rapport.
