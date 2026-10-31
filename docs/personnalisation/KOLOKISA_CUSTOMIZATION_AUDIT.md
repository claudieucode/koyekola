# Audit de la personnalisation Kolakisa (31/10/2026)

Base : `origin/main` `1199f633`. Lu dans le code : `src/services/customizer.js` (561 l.), `public/js/customizer.js` (603 l.), `src/marketing/web/customizer.js`, `src/marketing/pages/{siteSettings,nodes}.js`, `views/marketing-public/_node.ejs`, `public/js/page-builder.js`, docs Theme Builder et brouillon en-tête/pied.

## 1. Ce qui existe déjà (non reconstruit)
| Brique | État |
|---|---|
| Personnaliser par site | Catalogue fermé de 134 réglages pour un site (60 pour le site principal) (jetons : couleurs, typographie, boutons, images, formulaires, arrière-plan, appareils, mode sombre, palette), aperçu de la vraie page, brouillon, publication, 40 versions, planification, lien de partage, annuler/rétablir, droits `appearance.*` |
| Isolation | Brouillons, versions, session et médias **par site**, vérifiés côté serveur (`target()`) |
| Theme Builder | Modèles de thème avec conditions (9 familles), composants globaux, en-tête et pied d'un site = composants du Page Builder avec brouillon + « Mettre à jour » et exceptions par page, 100 versions de page |
| Menus | Écran Navigation existant (plusieurs menus, imbriqués, emplacements) ; le Personnaliser les liste et rafraîchit l'aperçu |
| Style d'un élément | **Page Builder** : styles locaux par nœud (`.kw-n-<id>`), états hover/focus, points de rupture, classes globales nommées (`settings.classes`) ; position collante disponible comme style |

## 2. Cause du problème « mes changements touchent tout le site »
**Cause architecturale, prouvée dans `public/js/customizer.js` (`pickTarget`).**
1. Le Personnaliser ne sait écrire que des **jetons de site** (catalogue fermé). Chaque réglage est global par construction (comme dans WordPress).
2. Le bouton « Sélectionner un élément » **rattache un clic à un réglage global d'après la balise** : un `h2` ouvre « Taille — Titre 2 », un `button` ouvre « Boutons », un `img` « Rayon des images ». L'utilisateur croit modifier *cet élément* ; il modifie **tous ceux de même nature, sur toutes les pages**.
3. **Aucune portée n'était affichée** (ni au clic, ni à la publication), et aucune voie vers la modification locale n'était proposée, alors que le moteur de rendu la sait faire (`.kw-n-<id>` dans le Page Builder).
4. Les sélecteurs CSS des jetons sont génériques par nature (balises) : c'est voulu pour un thème, mais invisible pour la personne.
Le moteur lui-même n'a pas de fuite : une modification locale n'écrit que la règle de son élément (test `personnalisation-ciblee.test.js`) et un autre site reste octet pour octet identique.

## 3. Correctif livré (22.11)
- Le sélecteur annonce : « **Portée : modification GLOBALE** — tous les titres de niveau 2 du site « X » (N sur cette page) », compte réel dans l'aperçu.
- Si l'élément porte une identité (`kw-n-<id>`), lien **« Modifier seulement cet élément »** vers `/marketing/pages/<id>/editeur#element=<id>` : l'éditeur ouvre avec cet élément sélectionné (lien direct ajouté à `page-builder.js`). Sinon le message dit qu'aucune voie locale n'existe pour cet élément.
- Note permanente en tête du Personnaliser et rappel de portée dans la fenêtre de publication.

## 4. Écarts restants (non traités)
| Réf. | Écart |
|---|---|
| E1 | Les éléments qui ne sont pas des nœuds du Page Builder (sections de modèles : héros, listes, formulaires ; en-tête/pied *structurés* du site principal) n'ont pas d'identité de nœud → pas de voie locale depuis le Personnaliser. |
| E2 | Aucun réglage dédié « en-tête collant / ombre / hauteur » dans le Personnaliser : possible seulement via les styles du conteneur dans le Page Builder (`position: sticky`). |
| E3 | La modification locale se fait dans l'éditeur de pages (brouillon + publication de la **page**), pas dans le brouillon du Personnaliser : deux circuits de publication distincts. |
| E4 | Pas de barre d'annonce, fil d'Ariane ou barre latérale dédiés : non audités en profondeur. |
| E5 | Le site principal garde un catalogue réduit (son moteur ne rend pas les réglages ajoutés aux sites). |
| E6 | Pas de comparaison automatique « avant/après » de la portée lors du changement d'un jeton (seul le nombre d'éléments de la page affichée est donné). |
