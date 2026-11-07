# Réparation du rendu et du responsive des en-têtes : rapport

Modèle de reproduction : « Galerie Z » (`media-10`), site « teste second ». Captures du client : bouton noir sans texte, menu mobile aux liens très espacés, grille desktop écrasée dans le canvas.

## Ce qui a été reproduit (vrai Chrome, serveur réel)
- Aperçu desktop et mobile de `media-10`, `luxe-09`, `media-01` : couleurs calculées de chaque lien et bouton.
- **Le bouton neuf du modèle est correct** (texte blanc `rgb(255,255,255)` sur fond `rgb(10,10,10)`, libellé « S'abonner », 111 × 48 px, opacité 1). Les dimensions du rectangle noir de la capture (111 × 48 px) correspondent exactement à ce bouton : c'est donc bien lui, mais son texte a pris la couleur de son fond dans le site du client.
- Cause probable non démontrable ici : la configuration du site « teste second » (réglages enregistrés) n'est pas accessible depuis cette machine. Le moteur acceptait un texte et un fond identiques sans rien corriger ; c'est cette faille qui est réparée.

## Causes racines traitées
1. **Aucune garantie de lisibilité** : le moteur de styles (`src/marketing/pages/nodes.js`, `pageCss`) écrivait tel quel un texte et un fond identiques ou presque. Il corrige maintenant, écran par écran, un texte dont le contraste avec le fond du même élément est inférieur à 2:1 (fond conservé, texte blanc ou presque noir). Les couleurs en variables, transparentes ou dégradées ne sont jamais modifiées ; « bouton jaune + texte noir » est conservé.
2. **Menu mobile aux espaces énormes** : le réglage « Écart » de la liste (26 px) s'appliquait aussi entre les lignes quand la liste passe en colonne. Pour un menu horizontal, il devient un écart entre colonnes ; l'écart entre lignes est limité à 4 px. Un menu vertical garde son écart.
3. **Menu mobile ouvert** (`public/css/landing.css`) : pile compacte, zones tactiles de 44 px, sous-menus à bouton 44 px, défilement interne si la liste dépasse l'écran.
4. **Aide d'éditeur « Aucun logo »** : elle n'est rendue que dans l'éditeur (vérifié par test) ; elle ne dépasse plus 18 rem, ce qui évitait de comprimer la navigation dans la grille du canvas (cause de l'écart entre canvas et site publié).
5. **Grille « Galerie Z »** (`catalog/header/arch.js`) : cellules sans largeur minimale (`min-width: 0`) et bordure droite supprimée en mobile (le trait noir parasite des captures).

## Fichiers modifiés
`src/marketing/pages/nodes.js`, `public/css/landing.css`, `src/themeBuilder/catalog/header/arch.js`, `tests/entetes-rendu-fiabilite.test.js` (nouveau), ce rapport.

## Tests
- `tests/entetes-rendu-fiabilite.test.js` : 12 réussis, 0 échec. Pour les **100 modèles** du catalogue : chaque bouton a un libellé et un contraste >= 3:1 ; texte du menu et nom du site lisibles sur le fond de leur rangée ; enveloppe pleine largeur. Moteur : noir sur noir corrigé, jaune + noir conservé, correction par écran, transparent intact, écart du menu horizontal et vertical, feuille mobile, message du logo réservé à l'éditeur. Ces contrôles font office de barrière pour les futurs modèles du catalogue.
- `tests/theme-builder-entetes-atelier.test.js` (rendu par le vrai moteur) : 20 réussis, 0 échec.
- `tests/theme-builder-entetes-atelier-navigateur.test.js` (vrai Chrome) : 6 réussis, 0 échec. 100 modèles à 1280 / 820 / 390 px sans débordement ni chevauchement ; site publié : un seul en-tête, menu mobile qui s'ouvre et se referme, clavier, mouvement réduit, collant / se cache / se réduit.

## Ce qui n'est PAS fait ou PAS prouvé
- Les contrôles du panneau de style (couleurs séparées logo / liens / bouton / icônes, états hover/focus/active, réglages par écran) existent déjà dans le moteur de parties (`parts.js`) ; je ne les ai pas réaudités un par un ni testés dans l'éditeur.
- Fond pleine largeur / contenu borné : l'architecture existante les sépare déjà (bande `full` + conteneur intérieur borné). Aucune nouvelle option « contenu pleine largeur / personnalisé » n'a été ajoutée dans l'inspecteur.
- Compositions de navigation supplémentaires (plein écran, latérale, overlay, mega menu) : non créées.
- Pas de comparaison visuelle canvas / site publié automatisée ; pas de test de persistance de bout en bout ni de test clavier ajoutés.
- Le site « teste second » n'a pas pu être inspecté : si le bouton reste noir après redéploiement, il faut m'envoyer le réglage de texte du bouton.
