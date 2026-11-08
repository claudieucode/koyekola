# Feuille de route par petites étapes

Après **chaque** étape : changements, fichiers, fonctions ajoutées, tests lancés, résultats, problèmes, puis **attente de votre validation**.

| Étape | Périmètre | Livrable |
|---|---|---|
| 1 | Audit et documentation (**terminée, cette livraison**) | 11 documents |
| 2 | Choix voie A/B, liste finale des 100 concepts | décision |
| 3 | Contexte dynamique : champs personnalisés, replis | étiquette + tests |
| 4 | Premier modèle complet de bout en bout | 1 modèle publié sur un site de test |
| 5 | Widgets principaux (Post Info, TOC, navigation) | options + tests |
| 6 | Commentaires : états (aucun, désactivés, modération, erreur) | tests navigateur |
| 7 | Articles liés : règles documentées | doc + tests |
| 8 | Sidebars centrales en colonne | rendu + tests |
| 9 | Responsive : matrice 5 largeurs | rapport |
| 10 | Aperçus et vignettes fidèles | contrôle automatique |
| 11 | Modèles par groupes de 10 | 10 fichiers de mise en page |
| 12 | Diversité après chaque groupe | matrice mise à jour |
| 13 | Tests globaux + non-régression | rapport |
| 14 | Audit final | rapport final |

Chaque étape est indépendante, annulable (un commit par étape) et sans effet sur les articles existants.

## État au 8 novembre 2026
* Étapes 1 et 2 : faites (documents, voie B).
* Étape 3 (contexte dynamique) : vérification faite — le CMS ne stocke **aucun champ personnalisé** d'article, donc aucune étiquette `post.field.*` n'a été créée (elle afficherait toujours du vide). Les replis existants sont conservés : un champ vide laisse l'emplacement vide, jamais de valeur fictive.
* Étapes 4, 10, 11, 12 : faites ensemble — les 100 modèles v2 sont dans `single_post/v2/`, avec contrôle de diversité automatique (0 paire au-dessus de 80 %), vignettes et aperçus produits par la même fonction `build()`.
* Étapes 5 à 9 : widgets, commentaires, articles liés, sidebars : **utilisés tels quels** (aucun widget modifié). Les écarts restants avec Elementor sont dans `FEATURE_PARITY_MATRIX.md` et ne sont pas traités ici (Post Info avancé, flèches de navigation, sidebar centrale en colonne, réactions, champs personnalisés).
* Étapes 13 et 14 : tests lancés, résultats dans `TEST_PLAN.md`.
