# Theme Builder — refonte compacte de l'interface

Périmètre : uniquement l'écran Theme Builder (`views/marketing/theme-builder.ejs` inchangé, `public/css/theme-builder.css`, `public/js/theme-builder.js`).
Aucune route, API, structure de données ni règle de publication n'a été modifiée. Aucun bouton, filtre, menu, compteur ni catégorie n'a été retiré.

## Constat de départ (capture fournie)

- Cartes de ~540 px de haut, dont une miniature de 255 px, des boutons de 44 px répartis sur deux ou trois lignes (« ⋯ » seul sur une 3e ligne).
- Structures types (« Aucun modèle ») aussi grandes que les modèles réels, avec bordure pointillée.
- Compteurs de la navigation désalignés : le point « publié » n'occupait de la place que sur la ligne concernée.
- Libellés longs de la navigation sur deux lignes, titre sur deux lignes, filtres de 44 px avec un bouton « Pourquoi ce modèle ? » plus bas que les champs.

## Ce qui a changé

| Zone | Avant | Après |
|---|---|---|
| Barre supérieure | 56 px, logo 30 px | 48 px, logo 26 px, nom du site plus discret |
| Navigation | lignes de 44 px, point « publié » sans place réservée, libellés sur 2 lignes | lignes de 36 px, place du point toujours réservée (compteurs alignés), libellé tronqué avec `title`, largeur fixe 240 px |
| En-tête | titre ~2 lignes, texte à 98 % de la largeur | titre sur une ligne, texte limité à 62 caractères, actions groupées à droite |
| Filtres | champs de 44 px, bouton désaligné | champs de 36 px alignés sur une même ligne, libellés réduits, grille/liste de 32 px |
| Carte d'un modèle | ~540 px, 3 lignes de boutons | ~250 px : nom + infos + menu ⋯ ; miniature 200 × 92 ; type + statut ; « S'affiche » + « Conditions » ; modifié ; actions |
| Actions | 5 boutons de 44 px | « Modifier » (principal), « Aperçu » (secondaire), « Publier/Republier » à droite, 30 px, sur une seule ligne ; « Conditions » rangé avec la ligne qu'il modifie ; le menu ⋯ passe dans l'en-tête de la carte |
| Structure type | carte pleine, bordure pointillée | ~150 px, bordure pleine discrète, « Aucun modèle » et « Créer un modèle » sur une ligne, alignée en haut (ne s'étire pas) |
| Grille | colonnes de 240 px, espace 20 px | colonnes de 262 px, espace 14 px (4 colonnes à 1440 px, 6 à 2000 px) |

Cibles tactiles : les hauteurs compactes (30–36 px) s'appliquent aux écrans larges avec souris. En dessous de 900 px ou avec un pointeur tactile, tout revient à 44 px (règle `@media (max-width: 900px), (pointer: coarse)`).

Le menu ⋯ s'ouvre désormais vers le bas depuis l'en-tête ; la carte concernée passe au-dessus des suivantes (`:has(.tb-menu-list:not([hidden]))`). Le mode liste conserve son menu dans la colonne Actions.

## Ce qui n'a pas changé

Logique JS (chargement, cache, miniatures paresseuses, filtres, tri, URL, raccourcis `/ n v`, conditions, publication, versions, aperçu, bibliothèque), identifiants et attributs d'accessibilité, mode liste, jetons `--kb-*` (clair/sombre), mouvement réduit.

## Tests

- Nouveau : `tests/theme-builder-refonte-compacte-navigateur.test.js` (vrai Chrome) : hauteurs de cartes, ordre interne, actions sur une ligne, navigation uniforme, filtres alignés, menu ⋯ / Aperçu / Conditions / grille-liste, structure type, téléphone 390 px, mouvement réduit + thème sombre, aucune erreur de script.
- Adapté : `tests/theme-builder-elementor-ui.test.js` (barre de 48 px au lieu de 56 px).

## Limites

- Les hauteurs ont été vérifiées dans Chrome uniquement.
- Le mode liste et la bibliothèque de modèles n'ont reçu que les ajustements communs (boutons, champs) ; leur disposition n'a pas été repensée.
