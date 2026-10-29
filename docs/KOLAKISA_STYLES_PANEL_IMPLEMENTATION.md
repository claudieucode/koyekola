# Apparence → Styles : correctif d'alignement — implémentation

Fichiers modifiés : `public/css/cms.css` (bloc « Panneau Styles : mise en page des rangées »), `public/js/cms-styles.js` (placeholder), test `tests/styles-panel-alignement-navigateur.test.js`.

- Rangée de réglage = grille `libellé (souple) | contrôles (largeur propre)` ; l'aide passe sur toute la largeur dessous ; hauteur adaptée au contenu, contrôles toujours alignés à droite.
- Pastille 24 px uniforme avec bordure visible (y compris couleurs claires), sélecteur 40×36, champ hexadécimal 92 px, ↺ 32×32 : `flex: none`, aucune largeur dépendant du libellé.
- Palettes : grille `auto-fill minmax(112px,1fr)`, cartes `min-width: 0`, dimensions inchangées au survol/focus/sélection (aucune transformation).
- Contrastes : colonnes `44px | souple | auto | auto`, libellé qui passe à la ligne.
- Étroit (< 330 px de panneau) : requête de conteneur, contrôles sous le libellé.
- Portée : tous les sélecteurs sont préfixés `.mk-body .mk-st-panel` (spécificité supérieure à `kola-compose.css`) : aucun autre écran n'est modifié. Valeurs enregistrées, palettes, calcul WCAG : inchangés.
