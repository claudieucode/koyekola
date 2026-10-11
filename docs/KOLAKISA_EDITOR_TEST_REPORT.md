# Rapport de tests — 10 octobre 2026

## Suite complète (`node --test --test-concurrency=2 "tests/*.test.js"`, 353 fichiers) — dernier passage sur le code final fusionné avec `origin/main`
**4 691 tests : 4 686 réussis, 0 échec, 5 annulés** — les 5 annulés sont dans un seul fichier (`editeur-rendu-en-place-navigateur`) qui a dépassé son délai de 188 s sous charge ; **rejoué seul : 5/5 réussis**. Donc 4 691 sur 4 691 au sens strict après ce rejeu (pas dans un même passage ininterrompu).
Premier passage de la suite complète sur la version précédente : 4 665 tests, **5 échecs réels**, tous corrigés ensuite :
1. `editeur-partage` (liste des réseaux de partage : 5 → 9, test mis à jour) ;
2. `proprietes-style-completes` (104 → 107 propriétés de style, test mis à jour) ;
3. `refonte-design` « ombres teintées » : **échec déjà présent sur `main`** (ombre noire dans `page-builder.css`, session voisine) — corrigé en passant ;
4. `refonte-design` « aucune classe orpheline » : **défaut de mon code** (classes sans style : `kw-cta-button`, `kw-vp-side`, et une apostrophe mal placée dans deux gabarits qui faisait lire un faux nom de classe) — corrigé ;
5. `rendu-accessibilité` (86 widgets) : **défaut de mon code** (titre de playlist et titre du bouton d'action créaient un saut de niveau de titre) — corrigé (titre de playlist en paragraphe, titre d'action H2 par défaut).

## Tests ajoutés pendant la mission (tous réussis)
- `images-resolutions.test.js` 13 · `images-resolutions-sans-sharp.test.js` 1 · `images-resolutions-navigateur.test.js` 4 · `galerie-options-navigateur.test.js` 5
- `elementor-parite-navigateur.test.js` 8 : Appel à l'action, Playlist vidéo, Bouton flottant, séparateur de forme, 12 animations de survol (animation ou transformation réellement observée au survol), formes de masque, lettrine et colonnes (styles calculés), réglages dans l'inspecteur
- `elementor-parite-2-navigateur.test.js` 11 : compte à rebours (minuteur par visiteur mémorisé, masquer, rediriger, unités masquées, refus d'adresses dangereuses), séparateur des milliers, 4 réseaux de partage, début / fin de vidéo, jours et heures d'affichage, magnétisme de défilement, diaporama de fond, Ken Burns, liste d'icônes en ligne, dégradé radial, bordures double et gravée, vidéo de fond (début, fin, secours, lecture unique), collage depuis le presse-papiers du système
- Cas ajoutés à des tests existants : contour du texte et colonnes de texte (propriétés restantes), filet de sécurité des widgets régénéré (nouveaux types et Ken Burns du diaporama).

## Ce que les tests ne prouvent pas
- Tout est vérifié sur **Chrome** ; Safari et Firefox non testés.
- Le **chargement de `sharp` sur Hostinger** n'est vérifiable qu'après déploiement (le repli sans `sharp` est testé).
- Le responsive est vérifié par le CSS et par des tests à 1 400 px et 420 px (écran de démarrage) ; les nouveaux widgets ne sont pas mesurés à 390 px en navigateur.
- Aucun test de charge sur la fabrication d'images.
