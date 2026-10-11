# Style Studio — rapport de tests

Chrome réel + vrai serveur, exécutés en série (`--test-concurrency=1`) : `styles-enregistres.test.js` (6), `styles-enregistres-navigateur.test.js` (6), `styles-studio-navigateur.test.js` (5), `editeur-classes-*` (5), `editeur-menu-navigateur`, `format-mise-en-page-navigateur`, `proprietes-compatibilite-navigateur` : **tous verts**, avec une exception : le test « réglage incompatible reçu quand même » de `proprietes-compatibilite-navigateur` est instable (il échoue aussi sans mes modifications, vérifié ; il passe seul). Lancer deux fichiers navigateur en parallèle provoque des échecs dus à la charge.

| # | Test | Statut |
|---|---|---|
| 1,7 | Style complet / plusieurs catégories (états et écrans compris) | ✔ E1 |
| 2 | Couleurs seules | ✔ (enregistres S2) |
| 3,4,5,6 | Typographie, dimensions, bordures, effets seuls | serveur ✔ (`pick`) ; navigateur : typographie seule ✔ ; les autres **non rejoués** dans Chrome |
| 8,9,10 | Remplacer / Compléter, propriétés non concernées intactes | ✔ E2 |
| 11,12,13 | Redéfinir, éléments liés suivent, réglages propres conservés | ✔ E3 |
| 14 | Dissocier : apparence identique (couleur, fond, taille, rayon) | ✔ E4 |
| 15,16 | Widget compatible ✔ ; partiellement compatible (bouton) : appliqué sans erreur, **avertissement non vérifié par assertion** | partiel |
| 17,18 | Écrans (mobile exclu) ✔ ; état survol enregistré ✔ ; **application d'un survol/tablette non rendue-vérifiée** | partiel |
| 19 | Rechargement | ✔ |
| 20 | Annuler / rétablir (enregistrer+appliquer, dissocier) | ✔ |
| 21 | Portée : site seulement (la seule qui existe) | ✔ |
| 22 | Menu contextuel calques, barre flottante, bibliothèque | ✔ (menu du canevas non testé séparément : même fonction `openMenu`) |
| 23 | Thème sombre | **non testé** (variables `--editor-*` uniquement) |
| 24 | Performance sur grande page | **non mesurée** |
| 25 | Fonctionnalités existantes | ✔ suites listées ci-dessus |
