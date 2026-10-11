# Rapport d'implémentation — moteur de propriétés et de contrôles

*Branche `controles-proprietes` (partie de `830b7d8`). Principe tenu : aucune réécriture, aucun changement d'interface, de thème ni de modèle de données ; les corrections suivent les défauts démontrés par l'audit.*

## 1. Fichiers de production modifiés (3 fichiers, 14 lignes utiles)

| Fichier | Modification | Défaut |
|---|---|---|
| `src/marketing/pages/nodes.js` | `textStrokeColor` : `out: colorCss` (la couleur du site devient `var(--kw-…)`) | D1 |
| `src/marketing/pages/nodes.js` | séparateur : la position du texte est conservée même sans texte | D3 |
| `src/marketing/pages/nodes.js` | `backgroundPosition`, `objectPosition` : quatre coins ajoutés (validateur + libellés) | D5 |
| `public/js/page-builder.js` | `NUM` : `columnCount` [1–6], `lineClamp` [1–10] ; `NUMCFG` : entiers | D2 |
| `public/js/page-builder.js` | champ « image dynamique » : messages explicites (saisie invalide, champ vidé) | D4 |

## 2. Tests ajoutés ou réparés

| Fichier | Nature | Exécutable sans navigateur |
|---|---|---|
| `tests/controles-contrat.test.js` (9 tests) | contrat des 110 propriétés + rapprochement des tables de l'interface (bornes, entiers, unités) avec le serveur | oui |
| `tests/controles-coherence.test.js` (7 tests) | bout en bout sur vrai serveur : références de couleur, vide / invalide, unités, écrans, valeurs inconnues, position du séparateur, quatre coins | oui |
| `tests/controles-matrice-navigateur.test.js` (10 tests) | **inspecteur réel dans Chrome** : chaque réglage piloté, relu dans le document, le CSS généré et après rechargement ; écrans et états ; couleur ; police ; accessibilité ; couverture | Chrome + playwright-core |
| `tests/controles-contenu-navigateur.test.js` (16 tests ; 79 avec `CONTENU_COMPLET=1`) | listes, cases et champs de contenu des éléments, persistance après rechargement | Chrome + playwright-core |
| `tests/controles-numeriques-navigateur.test.js` | 2 tests périmés remis à jour (unités de largeur ; bloc Espacement) | jsdom |
| `tests/effets-inspecteur-navigateur.test.js` | 1 test périmé remis à jour (le « grand écran » est le 4ᵉ écran) | jsdom |

**Chaque défaut a un test dédié.** Échec observé *avant* la correction, puis succès *après* : D1 (contrat + cohérence, correction retirée puis remise), D2 (contrat, idem), D4 (matrice de contenu, échec constaté avant d'écrire le message). D3 et D5 : l'échec avant correction découle directement de l'ancien code (position écartée sans texte ; valeur « top left » refusée en 422) mais n'a pas été rejoué en retirant la correction.

## 3. Outil

`scripts/build-controls-inventory.js` régénère `docs/KOLAKISA_PROPERTY_CONTROLS_INVENTORY.md` à partir du code et des résultats de la matrice (`docs/property-controls/matrice-resultats.json`). Aucune case remplie à la main.

## 4. Fonctionnalités ajoutées

Une seule : les quatre positions de coin (haut gauche, haut droit, bas gauche, bas droit) pour la position du fond et le point focal de l'image. Tout le reste est correction ou test.

## 5. Contrôles préservés sans modification

Les 105 autres propriétés de style, les 8 composées, le sélecteur de police, les cellules d'espacement, l'arrondi et l'épaisseur déliés, les curseurs, le sélecteur de couleur : leur comportement est inchangé et désormais couvert par la matrice. L'interface (panneaux, thème, libellés) n'a pas bougé.

## 6. Décisions écartées (et pourquoi)

* *Unifier tous les contrôles dans une nouvelle bibliothèque* : l'audit montre un système déjà piloté par une source unique ; une réécriture n'aurait apporté que du risque (interdit par la mission).
* *Rendre la case « nouvel onglet » dynamique* : exigerait d'écouter le champ d'adresse ; le libellé annonce déjà la contrainte (voir limites L3).
* *Rendre invalides les paires incomplètes (bouton sans adresse)* : aurait refusé des pages existantes ; noté en limite L4.
* *Ajouter `calc()`, `clamp()`, `vmin`…* : contraire à la grammaire fermée choisie pour la sécurité (limite L1).
