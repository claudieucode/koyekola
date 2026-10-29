# Palier 13 — Audit UX/UI de l'éditeur visuel

Date : 2026-10-29. Branche `palier13`, créée depuis `origin/main` (0aecfd96, qui contient le Palier 12). Méthode : lecture du code (`public/js/page-builder*.js`, `views/marketing/page-builder.ejs`) **et** mesures dans Chrome réel (vrai serveur, base de test) avec `scripts/ux/audit-editeur-navigateur.js`. L'éditeur est en JavaScript sans framework : les « clés React » et remontages de composants du brief ne s'appliquent pas ; la stabilité se mesure sur le DOM.

## Faits observés (46 mesures, 1920 → 1024 px)

| Zone | Mesure | Résultat |
|---|---|---|
| Barre du haut | Position et taille de chaque commande avant/après sélection, ouverture et fermeture des panneaux (clé = libellé) | **Aucun déplacement** |
| Canevas | Cadre (x, y, l, h) avant/après sélection | Identique |
| Canevas | Défilement à la sélection | Conservé si l'élément est visible. Un saut 120 → 0 observé : l'élément était hors écran (haut −31 px), donc **voulu** |
| Panneaux | Dimensions après fermeture puis réouverture (éléments, calques) ; barre d'outils verticale pendant la bascule | Identiques |
| Fluidité | CLS cumulé (sélection + bascules) ; CLS au changement de thème | 0 ; 0 |
| Thème | Le cadre du canevas est-il reconstruit au changement de thème ? | Non (même document) |
| Parcours | Dupliquer (Ctrl+D), annuler, rétablir, supprimer (Suppr) | Corrects |
| Sauvegarde | « Non enregistré » juste après la modification, puis « Enregistré à HH:MM », brouillon en base cohérent | Correct |
| Aperçu | Ouvrir, Échap, retour : sélection conservée, focus rendu à « Aperçu » | Correct |
| Couleur | Ouverture, Échap, clic dans le canevas | Correct |
| Accessibilité des commandes | Zones < 24×24 px ; commandes sans nom accessible | 0 ; 0 |
| Erreurs JavaScript | Pendant tout le parcours | 0 |

## Défauts reproduits avant correction

| # | Gravité | Défaut | Cause racine |
|---|---|---|---|
| U1 | Moyenne | « Règles et magnétisme » reste ouvert après un clic dans le canevas | Fermeture sur `click` du document de l'éditeur ; le canevas est un `iframe` dont les clics n'atteignent pas ce document. Le menu principal compense par `window blur`, pas celui-ci |
| U2 | Moyenne | « Qualité de la page » ne se ferme pas avec Échap ; le focus reste dans la fenêtre | Fenêtre non modale (`dialog.show()`) : le navigateur ne gère pas Échap pour ce mode ; aucun écouteur clavier |
| U3 | Moyenne | « Réglages du menu de navigation » : même défaut | Idem |
| U4 | Faible à moyenne | Après Échap sur l'historique, le menu principal ou la publication, le focus tombe sur `<body>` | Le menu flottant est partagé par plusieurs boutons et aucun ne mémorisait l'élément d'origine |

Fréquence : 100 % reproductible (4 échecs sur 4 avant correction). Impact : utilisateur clavier qui perd sa place (U2–U4), menu orphelin au-dessus du canevas (U1).

## Constats non corrigés (hors périmètre ou volontaires)

- **Barre du haut à 1024×640 : 156 px (3 lignes)**, soit 24 % de la hauteur. Relève de la refonte responsive (Palier 14).
- Les panneaux **IA** et **Qualité** restent ouverts après un clic extérieur : ce sont des panneaux persistants qui suivent l'édition, pas des menus. Comportement conservé.
- Non audités dans ce palier : Firefox, Safari, lecteur d'écran, mode sombre au-delà de la mesure de basculement, glisser-déposer, clavier tactile.
