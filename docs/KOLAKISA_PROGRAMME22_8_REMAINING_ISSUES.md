# KOLAKISA — Programme 22.8 : restes à faire et limites

## Non réalisé (demandé par le cahier des charges)
| Phase | Élément | Statut |
|---|---|---|
| 2 / 3 | Container Queries | Non utilisées. Aucune règle du moteur n'en dépend. |
| 3 | Seuils supplémentaires (au-delà de tablette / mobile / grand écran) | Non : exige une évolution du modèle de styles et de l'inspecteur. Les 7 profils sont des repères d'aperçu/d'audit. |
| 3 | CSS des widgets fixant `767px` en dur (menu, galeries, onglets…) | Ne suit pas un seuil mobile personnalisé : écart persistant. |
| 6 | Menus latéral / plein écran, fermeture au clic extérieur, sous-menus tactiles dédiés | Non (un seul mode déroulant, désormais fermable à Échap). |
| 6 | Formulaires mobiles, claviers virtuels, états de chargement/erreur | Non audités. |
| 8 | Résolveur d'images, `<picture>`, point focal, vidéos, intégration avec 22.7 | Non : le `srcset` adaptatif existant est réutilisé tel quel. |
| 9 | Priorisation automatique du contenu mobile | Non (volontaire : l'ordre du DOM n'est jamais réorganisé automatiquement). |
| 10 | Zoom d'aperçu, comparaison côte à côte, détection de débordement dans le canevas, contrôle dédié de la taille fluide dans l'inspecteur | Non : l'éditeur n'a pas été modifié. |
| 11 | Compréhension de demandes en langage naturel | Non : l'assistant est déterministe (aucun appel IA). |
| 12 | Captures d'écran jointes aux constats, écran qui lance Chrome depuis l'administration | Non : l'audit navigateur est un module utilisé par les tests. |
| 13 | Contrastes, labels de formulaires, ARIA, orientation | Non audités ici (le zoom n'est pas bloqué ; le focus du menu est corrigé). |
| 14 | Mesures LCP / INP / CLS, poids des ressources | **Aucune mesure réalisée.** |

## Limites des vérifications
* Chrome seul, émulation de la taille de fenêtre : ni Firefox, ni Safari, ni appareil physique.
* Les corrections statiques ne couvrent que les sections « libres » (`layout`) ; les sections classiques (héros, listes, formulaires) ne sont pas auditées par l'assistant.
* La typographie fluide n'a pas d'aperçu immédiat dans l'éditeur (rendu serveur).
* Régression : voir `KOLAKISA_PROGRAMME22_8_IMPLEMENTATION.md` (échecs préexistants listés).
* Déploiement : non vérifiable depuis cet environnement si l'accès à l'hébergeur manque (voir rapport final).
