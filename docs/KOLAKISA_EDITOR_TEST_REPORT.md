# Rapport de tests — 10 octobre 2026

## Suite complète (`node --test --test-concurrency=2 "tests/*.test.js"`, 359 fichiers) — passage final, 11 octobre 2026, code final fusionné avec `origin/main`
**4 719 tests : 4 719 réussis, 0 échec, 0 annulé, 0 ignoré.**
Historique des passages complets de la mission : 4 665 (5 échecs réels, corrigés) → 4 691 (5 annulés par délai, rejoués OK) → 4 711 (1 échec réel, corrigé) → 4 711 (0 échec) → **4 719 (0 échec)**. Échecs réels trouvés en route : liste des réseaux de partage et nombre de propriétés (tests à mettre à jour), ombre noire (hors mission), classes sans style et apostrophes dans deux gabarits, sauts de niveau de titre, **masquage « ordinateur » devant couvrir le grand écran** (compatibilité des pages existantes).

## Tests ajoutés pendant la mission (tous réussis)
- `images-resolutions.test.js` 13 · `images-resolutions-sans-sharp.test.js` 1 · `images-resolutions-navigateur.test.js` 4 · `galerie-options-navigateur.test.js` 5
- `elementor-parite-navigateur.test.js` 8 : Appel à l'action, Playlist vidéo, Bouton flottant, séparateur de forme, 12 animations de survol (animation ou transformation réellement observée au survol), formes de masque, lettrine et colonnes (styles calculés), réglages dans l'inspecteur
- `elementor-parite-2-navigateur.test.js` 11 : compte à rebours (minuteur par visiteur mémorisé, masquer, rediriger, unités masquées, refus d'adresses dangereuses), séparateur des milliers, 4 réseaux de partage, début / fin de vidéo, jours et heures d'affichage, magnétisme de défilement, diaporama de fond, Ken Burns, liste d'icônes en ligne, dégradé radial, bordures double et gravée, vidéo de fond (début, fin, secours, lecture unique), collage depuis le presse-papiers du système
- Cas ajoutés à des tests existants : contour du texte et colonnes de texte (propriétés restantes), filet de sécurité des widgets régénéré (nouveaux types et Ken Burns du diaporama).

- `elementor-parite-3-navigateur` 11, `elementor-parite-4-editeur-navigateur` 6 (réglages atteignables dans l'inspecteur), `elementor-parite-5-grand-ecran-navigateur` 7 (styles propres, héritage, masquage, seuil réglable, aperçu dans l'éditeur).

## Ce que les tests ne prouvent pas
- Tout est vérifié sur **Chrome** ; Safari et Firefox non testés.
- Le **chargement de `sharp` sur Hostinger** est vérifié après déploiement par `/sante` (`versions_images`) ; le repli sans `sharp` est testé.
- Le responsive est vérifié par le CSS et par des tests à 1 400 px et 420 px (écran de démarrage) ; les nouveaux widgets ne sont pas mesurés à 390 px en navigateur.
- Aucun test de charge sur la fabrication d'images.

## Tests ajoutés dans la dernière passe
`boucle-carte-inseree` (2), `classes-export-import-navigateur` (4), `elementor-parite-3-navigateur` (+1 : clics, pages vues, provenance), `elementor-parite-4-editeur-navigateur` (+2 : note, boucle), `images-resolutions` (+1 : `/sante`).
