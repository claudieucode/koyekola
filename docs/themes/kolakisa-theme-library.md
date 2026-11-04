# Bibliothèque de thèmes Kolakisa — refonte à 360 thèmes

> Document de référence de la refonte. Statut au 2026-11-03 : **en cours** (phases 1 à 4 engagées ; les sections marquées « À compléter » seront remplies à la livraison).
> Référence Elementor : `docs/themes/elementor-theme-system-reference.md`.

## 1. Rapport d'audit initial (phase 2)

### 1.1 État constaté
| Élément | Constat | Source |
|---|---|---|
| Bibliothèque | 160 thèmes, 21 catégories, `themes-check --strict` : « Aucun problème » | `src/marketing/themes/library/index.js`, `scripts/themes-check.js` |
| Fiches | 21 fichiers `specs/*.js` (≈ 7 000 lignes), données pures, validées par une grammaire fermée | `specs/README.md` |
| Moteur | 85 variantes de blocs (`compose.js`), visuels SVG originaux (`art.js`), 16 motifs | `library/compose.js`, `library/art.js` |
| Catalogue installable | exactement les 160 manifestes de la bibliothèque (les 5 thèmes historiques sont remplacés par des fiches de même clé) | `src/marketing/themes/catalog.js:69-72` |
| Installation par site | table `cms_themes` (migration 094) : **chaque site conserve un instantané du manifeste** (`manifest`, `checksum`) et ses jetons déjà appliqués | `src/services/themes.js`, `migrations/094_themes_par_site.sql` |
| Galerie / aperçu | facettes exactes, filtres sans rechargement, aperçu isolé en `iframe sandbox`, pagination 24 | `docs/KOLAKISA_THEMES_GALERIE.md` |
| Vignettes | WebP réels par thème (6 variantes : home, inner, mobile, card, card2, phone) — 960 fichiers dans `public/img/theme-previews/` | `scripts/themes-previews.js` |
| Tests | `themes-bibliotheque*.test.js` (valeur « 160 » codée en dur), `themes-galerie-refonte`, `apparence-themes`, `themes-installation-navigateur` | `tests/` |

### 1.2 Risques identifiés et réponses
| # | Risque | Réponse retenue |
|---|---|---|
| R1 | Suppression de l'ancien catalogue = sites ayant installé/activé un ancien thème | Les lignes `cms_themes` ne sont **jamais** supprimées par la refonte. Le thème actif a déjà ses jetons appliqués aux réglages du site, le manifeste est un instantané : le site reste identique. Un thème retiré du catalogue s'affiche comme « thème historique installé » (à vérifier par test, section 6). |
| R2 | Collision de clés entre anciens et nouveaux thèmes (même clé, contenu différent → mise à jour silencieuse de l'instantané) | **Aucune clé, nom ni marque de l'ancienne bibliothèque n'est réutilisé** (liste de contrôle générée depuis les 160 fiches). |
| R3 | Diversité : 360 thèmes sans doublons recolorés | Contrôle automatique existant (`verify.js` : similarité ≤ 0,72, paires de polices uniques, contrastes AA) étendu au lot complet ; briefs de diversité par lot (secteur, polices, couleurs, enchaînement d'accueil). |
| R4 | Performance de la galerie avec 360 thèmes | Pagination serveur (24/page) et aperçus chargés au défilement déjà en place ; mesure à refaire (section 8). |
| R5 | Tests codés en dur sur 160 | Adaptés à `TARGET_TOTAL` / aux nouvelles répartitions. |
| R6 | Images : aucune photo tierce redistribuable | On conserve la politique existante : illustrations vectorielles originales (`art.js`). |
| R7 | Destruction irréversible | Les anciennes fiches restent dans l'historique git ; une copie hors dépôt est faite avant suppression (section 5). La nouvelle bibliothèque est construite dans `specs-v2/` puis substituée **seulement après** validation complète. |
| R8 | Déploiement | La branche courante est `fix-apercu-vignette-theme-builder` et la cible de déploiement n'est pas confirmée : **aucun déploiement automatique**, voir section 10. |

## 2. Catégories conservées (21)
Les 21 catégories de `CATEGORIES` sont conservées avec leurs clés, libellés et rôle.

| Clé | Libellé | Rôle |
|---|---|---|
| entreprise | Entreprises et services professionnels | cabinets, conseil, services B2B |
| agence | Agences créatives, marketing et communication | agences, studios, collectifs |
| portfolio | Portfolios, photographie et arts | artistes, photographes, créatifs |
| boutique | Boutiques e-commerce et marques | catalogues de marques (module e-commerce non installé : démonstration déclarée) |
| restaurant | Restaurants, cafés et gastronomie | restauration, cartes, réservations |
| tourisme | Hôtels, tourisme et voyages | hébergements, agences, excursions |
| immobilier | Immobilier et architecture | agences, promoteurs, architectes |
| education | Éducation, formation et e-learning | écoles, formations, MOOC (catalogue réel `misc:courses`) |
| sante | Santé, bien-être et cabinets professionnels | cabinets, soins, bien-être |
| tech | Technologie, SaaS et startups | produits numériques |
| finance | Finance, comptabilité et conseil | cabinets comptables, banque, patrimoine |
| mode | Mode, beauté et cosmétiques | créateurs, salons, marques de beauté |
| association | Associations, ONG et organisations communautaires | causes, dons, bénévolat |
| magazine | Blogs, magazines et publications | contenus éditoriaux (`misc:posts`) |
| evenement | Événementiel, mariage et divertissement | événements, salles, mariages |
| industrie | Industrie, construction et artisanat | industriels, BTP, artisans |
| auto | Automobile et mobilité | garages, concessions, mobilité |
| agriculture | Agriculture et alimentation | producteurs, circuits courts |
| sport | Sport, fitness et coaching | clubs, coachs, salles |
| createur | Sites personnels et créateurs de contenu | sites personnels, podcasts, newsletters |
| local | Services locaux et petites entreprises | artisans, commerces de proximité |

## 3. Tableau de répartition des 360 thèmes (phase 4)

Principe : conserver les proportions de la bibliothèque précédente (160 → 360, facteur 2,25) puis ajuster selon les besoins réels. Ajustements : **boutique −2** (le module e-commerce n'étant pas installé, ces thèmes ne sont que des vitrines de démonstration : il ne faut pas en multiplier la part), entreprise −1, agence −1, tech −1 (arrondi pour obtenir exactement 360).

| Catégorie | Avant | Après | Part | Justification |
|---|---:|---:|---:|---|
| entreprise | 12 | 26 | 7,2 % | catégorie la plus générique : 26 types de services différents |
| agence | 10 | 22 | 6,1 % | marketing, branding, contenu, growth |
| portfolio | 10 | 23 | 6,4 % | photographes, illustrateurs, architectes, musiciens |
| boutique | 14 | 30 | 8,3 % | plus grande catégorie mais plafonnée (vitrines, pas de panier) |
| restaurant | 8 | 18 | 5,0 % | restauration, cafés, boulangeries, bars |
| tourisme | 8 | 18 | 5,0 % | hôtels, voyages, excursions |
| immobilier | 8 | 18 | 5,0 % | agences, promoteurs, architectes d'intérieur |
| education | 10 | 23 | 6,4 % | écoles, MOOC, formations |
| sante | 8 | 18 | 5,0 % | cabinets, bien-être |
| tech | 10 | 22 | 6,1 % | SaaS, apps, IA |
| finance | 6 | 14 | 3,9 % | |
| mode | 8 | 18 | 5,0 % | mode + beauté |
| association | 6 | 14 | 3,9 % | |
| magazine | 8 | 18 | 5,0 % | |
| evenement | 6 | 14 | 3,9 % | |
| industrie | 6 | 14 | 3,9 % | |
| auto | 4 | 9 | 2,5 % | |
| agriculture | 4 | 9 | 2,5 % | |
| sport | 4 | 9 | 2,5 % | |
| createur | 4 | 9 | 2,5 % | |
| local | 6 | 14 | 3,9 % | |
| **Total** | **160** | **360** | 100 % | |

**Audit interne de cohérence de la répartition** : somme = 360 ✔ ; 21 catégories toutes conservées ✔ ; aucune catégorie < 9 thèmes ✔ ; part maximale 8,3 % (boutique) ✔ ; la répartition est appliquée dans `CATEGORIES` au moment de la substitution (section 5).

## 4. Architecture des modèles
Inchangée (voir `docs/KOLAKISA_THEMES.md`) : un thème = jetons de design + site de démonstration en vraies sections du Page Builder + visuels originaux + métadonnées. Nouveauté technique : `KOLAKISA_THEME_SPECS_DIR` permet de charger un autre dossier de fiches (construction de `specs-v2/` sans toucher à l'ancienne bibliothèque).

## 5–11. À compléter à la livraison
Suppression et migration, liste complète des 360 thèmes, système de design, règles de rendu et responsive, tests exécutés, rapport de vérification visuelle, limites, maintenance.
