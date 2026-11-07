# Rapport — Ergonomie de l'éditeur Kolakisa

## Demandé
Harmoniser les espacements, dimensions et alignements de tout l'éditeur (pas seulement les deux captures fournies), avec un système réutilisable.

## Méthode
Audit automatique dans un vrai Chrome (script de mesure) : pour chaque état de l'éditeur (aucune sélection, onglets Éléments / Blocs / Page, un widget sélectionné, boîte de réglages de la page), on mesure l'écart entre chaque paire de contrôles voisins (boutons, champs, listes déroulantes) et la taille des zones cliquables.

## Constats (avant)
- Boutons collés : « Ouvrir les styles globaux » / « En-tête et pied de page » (0 px), « Annuler / Rétablir » et « Réglages de la page » (≈ 4 px), segments d'écran (2 px).
- Rangées d'icônes à 0–2 px : drapeaux de la liste, boutons d'outils du rail, barre flottante d'actions sur le canevas (1 px), barre de zoom (1 px), entrées du menu marketing (1 px), barre d'administration (2 px).
- Zones cliquables trop petites : boutons de repli (18 × 24 px), fil d'Ariane (18 px de haut).

## Corrigé
Système de jetons dans `public/css/page-builder.css` (échelle 4 / 8 / 12 / 16 / 24 px ; hauteurs de contrôles 30 / 34 / 40 px) appliqué à :
- sections d'inspecteur en colonne avec écart de 8 px ; boutons empilés (`.pb-btn-stack`, nouveau regroupement dans `page-builder.js`) ;
- rangées d'icônes, rail d'outils, barre de zoom, barre flottante, liste des enfants, fil d'Ariane, boutons de repli ;
- hauteurs de boutons et de champs, rythme vertical entre champs, cases à cocher et leurs libellés ;
- pieds de fenêtres de dialogue (actions alignées à droite, écart de 8 px) ;
- barre d'administration (`adminbar.css`), barre d'applications (`app-rail.css`) et menu latéral du marketing (`marketing.css`).

Conservés volontairement soudés (comportement voulu) : groupes segmentés (écran, apparence), bouton « Publier » avec son menu, onglets Contenu / Style / Avancé, petits boutons +/- empilés dans les champs numériques.

## Non couvert
Les écrans liés à un site (Theme Builder, styles globaux, médias, templates) n'ont pas pu être mesurés automatiquement : aucun site n'existe dans la base de test. Ils bénéficient des mêmes règles partagées (`.btn`, `.pb-field`, dialogues) mais n'ont pas été vérifiés un par un.
