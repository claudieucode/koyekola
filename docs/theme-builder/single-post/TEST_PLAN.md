# Plan de tests Article individuel

## Déjà en place (relancés lors de l'audit : seul l'audit statique)
| Contrôle | Commande | Résultat 2026-11-08 |
|---|---|---|
| Audit statique | `node scripts/audit-article-individuel.js --all` | 100 / 100, 0 défaut |
| Serveur réel (100 modèles utilisés puis publiés, bon article, isolation) | `node --test tests/theme-builder-article-individuel.test.js` | non relancé |
| Chrome 100 × 3 largeurs | `node --test tests/theme-builder-article-individuel-navigateur.test.js` | non relancé |
| Moteur / serveur | `tests/single-post-moteur.test.js`, `single-post-serveur.test.js` | non relancés |
| Commentaires | `blog-comments`, `cms-comments`, `cms-comments-navigateur`, `commentaires-01`, `reglages-commentaires` | non relancés |

## À ajouter
* Bibliothèque : 100 exacts, clés et noms uniques, profil de diversité (13 champs), vignette = aperçu.
* Dynamique : chaque étiquette sur un article complet et sur un article **vide** (replis, aucune valeur fictive).
* Commentaires : aucun / ouverts / désactivés / en attente / erreur d'envoi / réponse imbriquée / pagination / anti-spam.
* Fonctionnalités : toc, progression, navigation, partage, copier le lien, recherche, recommandations, sidebar.
* Éditeur : insertion, modification, duplication, suppression, sauvegarde, rechargement, aperçu, publication.
* Responsive : 1920, 1440, 1280, 820, 390 px, plus 1024 et 360 ; aucun débordement ni chevauchement.
* SEO : un seul `h1`, aucun JSON-LD ajouté par le modèle, alt des images.
* Accessibilité : clavier, focus visible, contraste, `prefers-reduced-motion`.
* Non-régression : blog, pages, archives, recherche, header, footer, sidebars, routage.
* Multi-site : isolation des modèles, conditions, données, permissions.

## Résultats du 8 novembre 2026 (après remplacement par la v2)
| Contrôle | Résultat |
|---|---|
| `node scripts/audit-article-individuel.js --all` | 100 / 100, 0 défaut (aucune paire au-dessus de 80 %) |
| `tests/theme-builder-article-individuel.test.js` (serveur réel, 100 modèles utilisés puis publiés, bon article, isolation) | 9 / 9 réussis |
| `tests/theme-builder-article-individuel-navigateur.test.js` (Chrome, 100 modèles × 3 largeurs) | réussi |
| `single-post-moteur`, `single-post-serveur`, `theme-builder-apercu-contenu`, `…contexte-rendu`, `…apercu-vignette`, `blog-comments` | réussis |
| `theme-builder-catalogue`, `…catalogue-public`, `…catalogue-direct-navigateur` | 3 échecs qui concernent la catégorie **En-tête** (« recherche ÉDITORIAL », logo du site, filtre d'identité d'en-tête), pas l'Article individuel ; non liés à ce changement |
Non fait : relecture humaine des 300 rendus ; tests avec 1920 px et 1280 px (le test Chrome existant couvre 1440 / 820 / 390 px).
