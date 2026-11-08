# Plan de tests Page individuelle

## Déjà en place
| Contrôle | Commande | Résultat 2026-11-08 |
|---|---|---|
| Mesure de diversité (ad hoc, non versionnée) | script d'audit de cette étude | 100 modèles, max 0,92, 4 paires ≥ 0,80, 26 entre 0,60 et 0,80 |
| Bibliothèque, API, utilisation des 100, publication, conditions, isolation | `node --test tests/theme-builder-page-individuelle-100.test.js` | non relancé |
| Chrome (3 largeurs, débordement) | `tests/theme-builder-page-individuelle-navigateur.test.js` | non relancé |
| Catalogue général, aperçus | `theme-builder-catalogue*.test.js`, `…apercu-*.test.js` | non relancés (3 échecs préexistants côté En-tête, voir audit Article) |

## À ajouter
* Bibliothèque : 100 exacts, clés/noms uniques, similarité ≤ 0,70, profil de diversité (14 champs), vignette = aperçu.
* Contenu : un seul H1 et un `postcontent` ; aucune étiquette d'article ; aucune donnée inventée ; textes d'exemple entre crochets.
* Fonctionnalités : formulaires réels (envoi, erreur, anti-spam), onglets, accordéons, compte à rebours, carte, navigation interne, ancres, liens.
* Éditeur : insertion, modification de chaque élément, duplication, suppression, déplacement, sauvegarde, rechargement, aperçu, publication.
* Rendu : 1920, 1440, 1280, 1024, 820, 390, 360 ; aucun débordement ni chevauchement ; images proportionnées.
* Conditions : toutes, page précise, enfants, accueil, exclusion, priorités, conflits, dépublication.
* SEO / accessibilité : H1 unique, alt, clavier, focus, contraste, `prefers-reduced-motion`.
* Non-régression : articles, archives, recherche, header, footer, widgets, routage ; pages à sections historiques et tunnels inchangés.
* Multi-site : isolation, permissions, copies, affectations.
