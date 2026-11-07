# Module Thèmes — audit de performance et de responsive

Date de l'audit : 6 novembre 2026. Méthode : mesures réelles (serveur de test local, Chrome piloté par Playwright), aucune estimation. Les scripts sont dans `scripts/` et relançables : `mesurer-module-themes.js` (temps serveur), `audit-themes-responsive.js` (mise en page, LCP, CLS), `audit-themes-navigation.js` (menu sur petit écran), `audit-editeur-modeles.js` (éditeur).

## Ce qui était déjà bien fait (vérifié, non modifié)

| Domaine | Constat |
|---|---|
| Bibliothèque | Recherche, filtres, tri et pagination (24 cartes) faits côté serveur ; fragment HTML (`?fragment=1`) au lieu d'un rechargement ; requête précédente annulée (`AbortController`) ; cache de 40 réponses pendant 60 s ; saisie différée de 120 ms ; barre de chargement seulement si la réponse dépasse 150 ms. |
| Images | Miniatures WebP à deux tailles (`srcset` 480/720 px), dimensions réservées (`width`/`height`), chargement différé sauf les 3 premières cartes (`fetchpriority`), `decoding="async"`. 80 thèmes sur 104 ont des aperçus ; les autres affichent une pastille de couleurs. |
| Aperçu | Page de démonstration isolée dans une iframe, rendu gardé en mémoire (60 entrées, 10 min) et en cache HTTP privé (120 s), réchauffage d'un thème au survol du bouton « Prévisualiser », image d'attente (poster) puis squelette. |
| Thèmes | Chaque thème est un dossier autonome : CSS confinée à `body[data-kw-pack="clé"]`, animation en JavaScript chargée seulement pour le thème actif, CSS ≤ 50 Ko, JS ≤ 80 Ko, `prefers-reduced-motion` obligatoire (tests existants). |
| Serveur | Compression gzip, gabarits compilés une fois, fichiers versionnés (`?v=…`). |

## Mesures avant correction (temps serveur, médiane de 7 essais)

| Opération | Médiane | Premier appel |
|---|---|---|
| Galerie (page complète, 24 cartes) | 26 ms | 2 675 ms (machine chargée, disque froid) |
| Galerie (fragment, une catégorie) | 18 ms | 19 ms |
| Galerie (recherche, fragment) | 22 ms | 22 ms |
| Détails d'un thème | 10 ms | 43 ms |
| Aperçu (coque) | 9 ms | 52 ms |
| Aperçu (page de démonstration) | 8 ms | **985 ms** |
| Installation d'un thème | 206 ms | 754 ms |
| Activation d'un thème | 238 ms | 263 ms |
| Personnalisateur (page) | 26 ms | **809 ms** |

Poids : galerie 112 Ko (non compressé), fragment 18 à 52 Ko, aperçu 38 à 111 Ko, personnalisateur 227 Ko (compressé par gzip en ligne).

## Causes racines

| # | Gravité | Cause | Où | Effet |
|---|---|---|---|---|
| P1 | Écartée | Hypothèse examinée : chargement des 104 paquets au premier appel. **Fausse** : les routes du module les chargent déjà au démarrage du serveur (798 ms mesurés, `require` de `web/themes.js`). Un échauffement supplémentaire a été essayé puis retiré (aucun gain mesuré). | `src/marketing/web/themes.js` | Les premiers appels de l'audit initial (2,7 s, 1 s) venaient du disque et de la machine froids ou chargés ; à froid sur machine calme : galerie 123 ms, aperçu 68 ms. |
| P2 | Moyenne | Polices du thème découvertes tard : le navigateur ne demande le fichier de police qu'après avoir lu la feuille de styles du thème. | `views/marketing-public/landing.ejs` | Texte qui change de police à l'affichage : décalage de mise en page (CLS de 0,10 à 0,44 mesuré à la première visite de 9 thèmes ; 0,000 aux visites suivantes). |
| P3 | Moyenne | Défauts de mise en page sur petits écrans dans 9 thèmes (voir ci-dessous). | `src/marketing/themes/packs/*/style.css` | Défilement horizontal, contenu hors écran, menu sans accès. |
| P4 | Faible | Installation (≈ 205 ms) et activation (≈ 240 ms) : écritures SQLite transactionnelles avec vérification du rendu et journal d'audit. | `src/services/themes.js` | Acceptable ; non modifié pour ne pas affaiblir la vérification qui annule une activation défaillante. |
| P5 | Faible | Aucun contrôle automatique de mise en page sur petit écran à la création d'un thème. | `packs/audit.js`, tests | Les défauts P3 sont passés inaperçus. |

## Défauts responsive trouvés (104 thèmes × toutes les pages × 8 tailles d'écran = 8 120 mesures)

| Thème | Page(s) | Défaut | Cause | Correction |
|---|---|---|---|---|
| chaine | toutes | Libellé du bouton « S'abonner » dépasse de 80 px | `white-space: nowrap` | Retour à la ligne et taille réduite sous 640 px |
| etoile | toutes | Planches de navigation dépassent de l'écran (tablette, mobile) | Rangée `flex` sans défilement ni retour à la ligne | Rangée défilante dans son cadre sous 1100 px |
| fichier | fiche | Contenu 440 px dans un écran de 390 px (défilement horizontal jusqu'à 158 px) | Colonne `1fr` qui ne rétrécit pas sous son contenu | `minmax(0, 1fr)` et `min-width: 0` |
| relais | étude | Même défaut (jusqu'à 67 px) | idem | idem |
| socle | groupe, implantations | Même défaut (jusqu'à 108 px), tableau de la carte hors écran | idem | idem, tableau défilant dans son cadre |
| cursus | accueil | Tampon décoratif dépasse de l'écran (jusqu'à 57 px) | Élément positionné en absolu animé | Découpe de la zone sous 640 px |
| meeple | jeu | Illustration dépasse de 2 à 3 px | Image vectorielle sans largeur maximale | `max-width: 100%` |
| ricochet | blocs | Citation décalée de 4 px | Marge négative | Marge supprimée |
| amorce | toutes | Sous 760 px le menu est caché sans bouton de remplacement : pages inaccessibles | `display: none` sans alternative | Menu en rangée défilante sous le logo |

Faux positifs écartés après vérification : éléments volontairement hors écran (liens « aller au contenu »), bandeau défilant (`volt`), décors vectoriels coupés (`etoile`, `chaine`), en-tête de tableau masqué pour les lecteurs d'écran (`millesime`), barre d'onglets en bas de l'écran (`souffle`, hors zone de mesure, présente et fonctionnelle).
