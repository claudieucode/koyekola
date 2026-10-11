# KOLAKISA — Styles enregistrés : rapport de tests

Exécutés (Chrome réel + vrai serveur) : `tests/styles-enregistres.test.js` (6, serveur), `tests/styles-enregistres-navigateur.test.js` (5), `tests/editeur-classes-navigateur.test.js` (3, mis à jour pour le dialogue), `tests/editeur-classes-globales.test.js`, `tests/proprietes-compatibilite-navigateur.test.js`, `tests/widgets-parts.test.js` : **34/34 passent**.

| # (mission) | Scénario | Résultat |
|---|---|---|
| 1, 9 | Tout sélectionner / désélectionner, case globale indéterminée si une catégorie est décochée, enregistrement bloqué si rien n'est coché | testé ✔ |
| 2, 5, 8, 10 | Couleurs seules (sélection de catégorie) : la classe ne contient que `color` et `backgroundColor` ; les autres réglages restent sur l'élément | testé ✔ |
| 3, 4, 6, 7 | Typographie seule (test S4 : `fontSize` seul) ; dimensions, bordures, ombres, mouvement : **garanties par le moteur `pick` (test serveur) mais pas rejouées une à une dans le navigateur** | partiel |
| 11, 13 | Application à un autre titre : seul le fond vient du style, ses propres `paddingTop`/`fontSize` restent | testé ✔ |
| 12 | Application à un bouton : appliqué sans erreur ; l'avertissement de compatibilité n'est pas vérifié par assertion | partiel |
| 14 | Écran : décocher « Mobile » → rien de mobile dans le style, le mobile de l'élément est intact | testé ✔ |
| 15 | Rechargement : styles présents | testé ✔ |
| 16 | Annuler puis rétablir l'enregistrement + application | testé ✔ |
| 17 | Une seule portée existe (le site) ; remplacement d'un style existant avec avertissement | testé ✔ |
| 18 | Séparation des sites / permissions : réutilise les contrôles existants des réglages de site (non retesté ici) | non retesté |
| 19 | Thème clair/sombre : le dialogue n'utilise que les variables `--editor-*` ; **aucun test visuel en thème sombre** | non testé |
| 20 | Écran étroit (390 px) : dialogue contenu dans la fenêtre | testé ✔ |
| 21 | Erreurs : nom invalide / réponse serveur en erreur → message ; **non testé en navigateur** | non testé |
| 22 | Pas de remontage : l'application passe par `change()` / `scheduleRender` existants ; non mesuré | non mesuré |

## Limites
- Les animations d'entrée, de défilement et de souris sont des propriétés du nœud, pas de ses styles : un style enregistré ne les transporte pas (catégorie « mouvement » = transformations et transitions CSS seulement).
- Les parties de widgets (`parts`) ne sont pas incluses dans un style.
- Le style est lié (classe globale) : le modifier met à jour tous les éléments qui l'utilisent ; il n'y a pas de copie détachée.
- Le bouton est dans Avancé → « CSS, classes et attributs » (emplacement des classes existantes).
- Pas de portée « personnelle » ni « globale entre sites » : l'architecture n'en a pas.
- Pas de mesure de performance sur une page à nombreux widgets.
