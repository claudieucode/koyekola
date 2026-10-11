# Rapport de tests — moteur de propriétés et de contrôles

## Suite complète (`node --test --test-concurrency=2 "tests/*.test.js"`, jsdom et playwright-core disponibles)

* **4 840 tests : 4 830 réussis, 3 ignorés** (anciens, sans lien), le reste = fichiers interrompus ou corrigés ci-dessous.
* Premier passage : 3 échecs réels + 1 fichier interrompu à la main :
  * `editeur-widgets` : ancien test qui exigeait que la position du séparateur soit effacée sans texte → mis à jour (c'est le défaut D3 corrigé) ;
  * `inspecteur-navigateur` : test jsdom périmé (la section s'appelle « Typographie », plus « Couleurs »), jamais exécuté avant ce chantier → mis à jour ;
  * `editeur-structure-grande-page-navigateur` : « le serveur de test s'est arrêté » pendant que j'arrêtais un processus bloqué → rejoué seul : vert ;
  * `editeur-stabilite-navigateur` : fichier resté bloqué plus d'une heure dans la suite complète (aucune sortie) ; **je l'ai arrêté à la main**. Rejoué seul : 4/4 verts en 44 s. Cause du blocage non établie (non reproduit).
* Après correction : ces fichiers rejoués → 32/32 verts (`editeur-widgets`, `inspecteur-navigateur`, `editeur-structure-grande-page-navigateur`) et 4/4 (`editeur-stabilite-navigateur`). **La suite complète n'a pas été relancée en entier après ces trois corrections de tests.**

## Nouveaux tests

| Fichier | Résultat |
|---|---|
| `controles-contrat.test.js` | 9/9 |
| `controles-coherence.test.js` | 7/7 |
| `controles-matrice-navigateur.test.js` | 10/10 (la dernière série complète a eu 9 réussis + « couleur » corrigé puis réussi seul) ; ≈ 24 min |
| `controles-contenu-navigateur.test.js` | 16/16 types représentatifs (≈ 6 min) |
| Suites jsdom réparées : `controles-numeriques-navigateur`, `effets-inspecteur-navigateur` | 24/24 |

## Couverture réelle de la matrice navigateur

* 81 des 110 propriétés de style pilotées une par une depuis l'inspecteur (169 combinaisons propriété × élément : conteneur grille, enfant de flex, titre, bouton, image), relues dans le document, le CSS généré, et rétablies (« vide » = hérite).
* Les 29 autres (cellules d'espacement, bordures / arrondis déliés, structure de grille, bascules flex, ordre, lignes maximum) sont atteintes par des contrôles spécialisés dont les tests sont **préexistants** ; l'inventaire cite les fichiers qui les mentionnent. Ils n'ont pas été re-pilotés par la matrice : **validés seulement par ces tests préexistants**.
* Contenu des éléments : les 79 types instanciables ont été parcourus une fois pendant l'audit (109 listes, 118 cases, 221 champs) ; seuls restent « sans effet » les cas annoncés en limites L3 / L4.

## Non testé

Safari, Firefox, appareils tactiles, plus d'une heure de session, pages de 400 éléments pendant un geste continu.
