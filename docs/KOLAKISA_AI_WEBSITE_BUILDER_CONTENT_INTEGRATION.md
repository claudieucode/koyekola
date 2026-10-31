# Intégration au constructeur de sites (AI Website Builder)

## Les douze étapes demandées et leur état
| # | Étape | Où |
|---|---|---|
| 1-3 | Comprendre secteur, cible, objectifs | constructeur 21.3 (analyse du brief) — existant |
| 4-5 | Structure éditoriale, plan des pages | constructeur 21.4/21.8 — existant ; **genre de page** ajouté par 22.6 (`kinds.plan`) |
| 6 | Intentions de recherche | `intent.analyze` à partir du mot-clé principal de chaque page |
| 7 | Générer les contenus | Content Generator 21.6 — existant, non réécrit |
| 8 | Métadonnées | Content Generator (SEO de contenu 21.6) — existant |
| 9 | Maillage interne | `linking.propose` — propositions à accepter/refuser |
| 10 | Cohérence éditoriale | `quality.evaluate` (voix, adresse, termes à éviter) |
| 11 | Contrôle SEO | `quality.evaluate` + `technical.check` |
| 12 | Éléments à compléter | `CI.review` → `toComplete` (route `…/api/revue`) |

## Ce qui est réellement branché
- L'écran **Contenu et qualité SEO** d'un site (lien depuis la vue générale SEO) appelle `dashboard` et `evaluatePage` sur les **pages natives** produites par le constructeur : aucun contenu parallèle, tout reste modifiable dans l'éditeur visuel.
- `CI.review(ctx, siteId)` est appelable après une génération ; il ne modifie rien.

## Ce qui n'est PAS branché
- Le constructeur 21.8 n'appelle pas automatiquement la revue après sa génération, et son écran n'affiche pas les « éléments à compléter » : l'API existe, l'appel automatique reste à faire.
- Le plan de pages du constructeur ne reçoit pas encore le genre de page 22.6.


## Mise à jour : contrôle éditorial après génération
`workspace.applyPages` appelle `contentIntel.review` après l'application des pages en brouillon et renvoie `editorial` (`toComplete` limité à 30 lignes, `total`, `analyzed`, `optimized`, `toImprove`). L'étape « Pages » du constructeur affiche ces éléments sous « À compléter avant de publier ». Lecture seule : aucun texte n'est modifié ni inventé ; une erreur du contrôle renvoie `null` sans bloquer l'application. Test : `tests/programme21-8-ai-builder-http.test.js`.
