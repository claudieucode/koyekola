# Isolation des propriétés : rapport final

Détail et classification : voir ISOLATION_PROPRIETES_AUDIT.md.

## Résumé
- Le défaut « le flou de l'image floute tout le conteneur » n'a PAS été reproduit dans ce dépôt (éditeur réel dans Chrome, CSS publié, balayage de 131 types de widgets x 13 réglages). Seule l'image est floue.
- Défaut réel trouvé et corrigé : l'historique (Annuler) fusionnait deux éléments. `public/js/page-builder.js`, `setStyles` (clé de regroupement sans identifiant d'élément ; couleur : clé `color:<propriété>` ligne ~3508). Un seul Annuler rendait la couleur d'origine au titre ET au texte. Même faiblesse dans `setProp`.
- Correction : la clé contient les identifiants, la partie, l'écran, l'état (3 lignes). Pas de migration, pas d'API changée.

## Tests (tests/isolation-proprietes.test.js, 28 tests)
- Avant correction : (8) historique en échec ("le titre garde sa couleur quand on annule celle du texte") et (9) en échec par ricochet ; (1) et (10) passent déjà.
- Après : 28/28 passent (Chrome réel, 3 niveaux d'imbrication, mobile, survol, parties, structure, héritage voulu, duplication, rechargement).
- Non-régression : controles-contrat, editeur-regles-magnetisme, effets-serveur, programme22-9-minify, widgets-animes-lot2/reglages, proprietes-style-completes, editeur-classes-globales : 84/84 passent après. Non relancés « avant » (changement limité au client).
- Outil ajouté : tests/helpers-chrome-cdp.js (pilote Chrome sans dépendance), car Playwright et jsdom sont absents de cette machine : les anciens tests *-navigateur sont donc ignorés ici.

## Familles vérifiées (Chrome, page publiée, comparaison à la même page sans réglage)
image, titre, texte, bouton, conteneur/carte, iconbox (parties). Balayage large : 131 types, aucun voisin ni parent touché.

## Limites
- Les 18 types qui demandent des réglages obligatoires (embed, carousel, lottie...) n'ont pas été balayés.
- Tablette, états focus/actif, animations d'entrée, CSS perso, classes globales : lus dans le code (tous écrits sur `.kw-n-<id>`), pas testés dans Chrome.
- Théme Builder (en-têtes/pieds) et cmsPages : non testés dans un navigateur.
- Hypothèses non vérifiées pour le symptôme : clic qui a sélectionné le conteneur ou une sélection multiple (Maj/Ctrl/Cmd + clic), classe globale partagée, composant global lié, version déployée différente.
- Échecs préexistants de la CI de main (cms-interface, D2/D3, migration 081, agent-ia, infobulles) : non touchés.
