# Kolakisa Motion Studio : rapport d'implémentation

Date : 2026-11-05. Branche de travail `motion-studio`, fusionnée dans `main`.

## A. Composants réellement disponibles (45)
Tous sont dans la bibliothèque de l'éditeur (groupe « Avancé »), ont un panneau Motion Studio (sections Contenu / Style / Animation / Interactions / Responsive / Avancé selon pertinence), sont sauvegardés, annulables/rétablissables, rendus à l'identique sur le site publié, lisibles sans JavaScript et respectent `prefers-reduced-motion`. Aucune dépendance npm ni CDN : moteur maison CSS + Web Animations API.

| Catégorie | Composants |
|---|---|
| Texte (13) | Texte animé (lettres/mots/lignes), Révélation de texte, Titre à mot souligné, Texte cinétique, Machine à écrire, Texte rotatif, Texte dégradé, Texte masqué par image, Brouillage de texte, Compteur animé, Bande liée au défilement, Texte circulaire, Liste/grille en cascade |
| Visuels et médias (9) | Révélation d'image (8 masques), Parallaxe d'image, Tracé SVG, Carte inclinée 3D, Bouton animé, Bouton magnétique, Fond animé (dégradé, mesh, grain), Curseur personnalisé, Lecteur Lottie (.json et .lottie) |
| Storytelling et sections (12) | Hero animé, Cartes empilées, Histoire collante, Section épinglée à scènes, Galerie horizontale, Séquence d'images au défilement, Chronologie animée, Étapes de processus, Menu plein écran, Témoignages animés, Bande de logos, Portfolio filtrable |
| Données et interface (11) | Progression circulaire, Jauge, Barres multiples, Graphique animé, Comparaison de données, Carte de métrique, Onglets animés, Notification animée, Chargement et squelettes, Retour de formulaire animé (partiel), Interrupteurs et cases |

Fonctions transversales : schéma versionné `motion.studio` v1 (migrable, valeurs invalides ignorées), runtime partagé `public/js/kw-motion-studio.js` (déclencheurs viewport/chargement/clic/survol/défilement, nettoyage, écrans coupés, lecture/pause dans le canevas), **timeline visuelle de page** (`motionScenes` v1 : scènes, pistes, pas, synchronisation, durée, délai, courbes, lecture/pause sur le canevas), transitions de page (View Transitions, désactivées par défaut) et de sections, défilement fluide maison (désactivé par défaut), bouton « Dupliquer l'élément » dans les listes, médiathèque acceptant les fichiers Lottie (contrôle strict), correctif de sécurité sur les chemins média Lottie.

## B. Effets
Voir les catalogues ; implémentés : ~30 effets de révélation de texte/image, tracés, parallaxe, scroll-linked, épinglage/sticky, inclinaison, magnétisme, curseur, fonds animés, boucles avec pause, comptage, morphing de listes (filtres), transitions de page/section, défilement fluide.

## C. Non intégrés
| Élément | Raison | Suite |
|---|---|---|
| Rive, 3D/WebGL, shaders, Product 3D viewer, Text 3D | Lot 5 conditionnel, lourd (WASM 0,9 Mo, Three ~195 ko) ; à ne livrer qu'après validation des lots précédents | bloc à la demande + alternative légère |
| GSAP | Licence interdisant les outils d'animation visuels concurrents de Webflow : avis juridique écrit nécessaire | décision humaine |
| Accordéon, Modale/Tiroir, Info-bulle animés | Existent déjà ; les enrichir touche le code partagé | à enrichir |
| Comparateur avant/après, barre de progression de lecture | Existants suffisants | — |
| Morphing SVG, réorganisation de layout animée (Flip), transitions de distorsion | non faits | futur |
| Bibliothèque de presets de timeline prêts à l'emploi | non faits | futur |
| Éléments d'un composant partagé ciblables par une scène | limite du modèle | futur |

## D. Tests
**Commandes** (machine très lente ; base de départ migrée `KOYEKOLA_TEST_SEED_DB`, `--test-concurrency=1`) :
- `node --test tests/motion-studio*.test.js tests/widgets-contrat.test.js tests/editeur-conformite-widgets.test.js tests/moteur-mouvement.test.js tests/cms-seo-navigateur.test.js` : 358 tests, 353 réussis, 5 échecs (tous dans `motion-studio-t-navigateur`, causés par des attentes erronées du test, corrigés ensuite : 15/15 réussis ; `motion-studio-t` + `motion-studio` : 70/70).
- Non-régression : un défaut réel causé par le Motion Studio a été trouvé et corrigé (le panneau « Page » de l'éditeur débordait de 12 px à 1400 px à cause de la section « Scènes et mouvement » ; test SEO repassé au vert).
- Suite complète `npm test` : lancée mais interrompue avant la fin (machine saturée, plusieurs heures) ; les tests navigateur du dépôt hors Motion Studio échouent en nombre sur cette machine. Comparaison avec une copie propre de `main` : Assistant IA et Styles (5 échecs sur 13) identiques ; 6 autres fichiers navigateur (catégories, commentaires, contacts, SEO, templates, outils CMS) : 10 échecs sur `main` contre 11 avec le Motion Studio, le onzième étant le débordement SEO corrigé depuis. Les autres fichiers navigateur de la suite complète n'ont pas été comparés un à un.
- Échecs connus avant ce chantier : `anti-rose`, `refonte-design` (`lp-foot-legal`), `effacer-donnees` (SMTP).
- Tests visuels : captures de contrôle par les agents (900 px) ; tests Chrome sur 320 / 768 / 1920 px sans débordement pour chaque lot.

Tests écrits : `tests/motion-studio*.test.js` (unitaires) et `tests/motion-studio-*-navigateur.test.js` (Chrome réel). Par lot : lot 0 28 + 6 navigateur ; timeline 33 + 14 ; textes 42 ; visuels 49 + 13 ; storytelling 33 + 15 ; données 63 + 13.

Limites de vérification : machine très saturée ; les tests d'éditeur sur vrai serveur du lot textes (T) n'ont pas pu démarrer et ont été validés seulement par un banc d'essai léger ; Lighthouse non disponible ; aucun test sur appareils réels ; le sélecteur de fichier Lottie du panneau n'est pas branché (saisie du chemin /uploads/…).

## E. Problèmes connus (par priorité)
1. Tests d'éditeur du lot textes à relancer sur machine libre.
2. Léger clignotement possible avant démarrage du script (déclencheurs viewport/chargement).
3. Nouveaux fichiers non minifiés (liste blanche figée par un test).
4. Composants dans l'en-tête/pied du Theme Builder : CSS/runtime non chargés.
5. Breakpoints du runtime fixes (767/1023 px).
6. Le champ image ne lie pas le chemin à l'organisation (faille de fond signalée ; corrigée seulement pour Lottie).
7. Menu plein écran et notification : aperçu statique dans le canevas.
8. Un `overflow` sur un parent casse le sticky.

## F. Documentation
`docs/motion-studio/` : référence motion web, technologies, catalogues composants/effets, patterns, matrice, sources (43), audit, contrat de composant, ce rapport.

## G. Git et déploiement
Travail fait sur une branche isolée `motion-studio`, fusionnée dans `main` puis poussée. Déploiement : la connexion Hostinger ne répond pas depuis cette session ; à faire dans hPanel (Déploiements → Redéployer, branche `main`). Rien n'a été vérifié en ligne.
