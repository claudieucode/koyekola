# Feuille de route par petites étapes

Après **chaque** étape : changements, fichiers, ce qui fonctionne, tests, défauts, puis attente de votre validation (sauf instruction contraire de votre part).

| Étape | Périmètre | Livrable |
|---|---|---|
| 1 | Étude et documentation (**faite, cette livraison**) | 11 documents |
| 2 | Décisions : cadre ou page complète (A/B), champs de page (1/2), seuil 0,70 | décisions |
| 3 | Audit statique `scripts/audit-page-individuelle.js` + test de diversité | outils de contrôle |
| 4 | Premier modèle complet de bout en bout (ex. n° 29 Landing page) | 1 modèle publié sur un site de test |
| 5 | Widgets principaux : formulaire, onglets, pricing, compte à rebours, carte | vérification des réglages |
| 6 | Contenus dynamiques : titre, description, données entreprise | tests |
| 7 | Formulaires et interactions réels | tests navigateur |
| 8 | Responsive : 1920 / 1440 / 1280 / 1024 / 820 / 390 / 360 | rapport |
| 9 | Aperçus et vignettes fidèles ; « Aperçu avec » | tests |
| 10 | Modèles par groupes de 10 (10 groupes) | fichiers de mise en page |
| 11 | Contrôle de diversité après chaque groupe | matrice |
| 12 | Tests globaux et non-régression | rapport |
| 13 | Audit final, documentation, bascule du catalogue (annulable) | rapport final |

Chaque étape est un commit indépendant et annulable. Aucune page, aucun média ni aucun modèle de site n'est modifié.
