# Extension n°5 — rapport : 30 thèmes classiques et professionnels

Date : 2026-11-05. Bibliothèque : 100 thèmes (70 + 30). Collections : **Blog et publication** (12), **Sites professionnels** (18). Thème recommandé aux débutants : **ossature** (universel).

## Thèmes livrés
| Clé | Collection | Nom | Usage | Pages | Options | Polices (titres / texte) | Couleur principale |
|---|---|---|---|---|---|---|---|
| berceau | blog | Berceau | Magazine famille et parentalité par âge, avec listes à cocher | 11 | 7 | fredoka / kumbh-sans | #c4503a |
| bulletin | blog | Bulletin | Actualités d'entreprise et espace presse | 12 | 8 | league-spartan / pt-sans | #8a5a00 |
| chronique | blog | Chronique | Revue de récits et d'enquêtes en format long | 10 | 8 | dm-serif-text / vollkorn | #8f3a14 |
| courrier | blog | Courrier | Publication indépendante et newsletter | 11 | 8 | petrona / overpass | #334e9a |
| etape | blog | Étape | Blog de voyage et carnet de route | 12 | 8 | besley / fira-sans | #0d6e6e |
| jardin | blog | Jardin | Notes personnelles et jardin numérique | 11 | 8 | faustina / gantari | #4d6b1c |
| mijote | blog | Mijote | Blog de recettes | 11 | 7 | caprasimo / alegreya | #a63a1c |
| obturateur | blog | Obturateur | Photo-journal et blog de photographes | 12 | 8 | familjen-grotesk / heebo | #1c1c1c |
| plume | blog | Plume | Blog personnel minimaliste | 11 | 7 | vollkorn / rethink-sans | #2a6f97 |
| rubrique | blog | Rubrique | Blog magazine multi-catégories | 11 | 8 | besley / pt-sans | #c2410c |
| sou | blog | Sou | Blog de finances personnelles et pédagogie de l'argent | 11 | 8 | aleo / hind | #3b6b2a |
| syntaxe | blog | Syntaxe | Blog technique / carnets de développeurs | 11 | 8 | geist / ibm-plex-serif | #6d3fd8 |
| amorce | pro | Amorce | Landing de lancement | 12 | 7 | league-spartan / dm-sans | #d63209 |
| balance | pro | Balance | Avis, tests et comparatifs (affiliation transparente) | 12 | 8 | arvo / maven-pro | #1c7c54 |
| commun | pro | Commun | Association polyvalente : adhésion, agenda et bénévolat | 14 | 8 | alegreya / plus-jakarta-sans | #6d3fc0 |
| communique | pro | Communiqué | Salle de presse d'entreprise | 12 | 7 | noto-serif-display / source-serif-4 | #5b2a86 |
| comptoir | pro | Comptoir | Vitrine de PME polyvalente | 12 | 7 | bree-serif / karla | #1d6a9c |
| coulisse | pro | Coulisse | Conférence professionnelle | 12 | 7 | league-gothic / sofia-sans | #4cc9f0 |
| defile | pro | Défilé | One-page polyvalent | 10 | 8 | funnel-display / rethink-sans | #5f3dc4 |
| fichier | pro | Fichier | Annuaire / répertoire | 11 | 7 | league-gothic / gantari | #26408b |
| glane | pro | Glane | Curation et veille | 12 | 8 | domine / karla | #1f7a35 |
| gradin | pro | Gradin | Créateur de formations / école en ligne | 12 | 8 | plus-jakarta-sans / fira-sans | #7c2d5b |
| jalon | pro | Jalon | Changelog et feuille de route | 10 | 7 | sofia-sans-condensed / geologica | #0b57a4 |
| mandat | pro | Mandat | Freelance / consultant indépendant | 12 | 8 | baskervville / geologica | #27409c |
| ossature | pro | Ossature | Site professionnel universel : vitrine, offre, blog et bibliothèque de 32 sections | 13 | 9 | geologica / radio-canada | #5a4fcf |
| preface | pro | Préface | Page « bientôt disponible » / préouverture | 11 | 9 | league-spartan / vollkorn | #2a1b6e |
| relais | pro | Relais | Agence généraliste | 12 | 7 | familjen-grotesk / instrument-sans | #17237a |
| repere | pro | Repère | Centre d'aide et base de connaissances | 11 | 7 | plus-jakarta-sans / onest | #5b3fd1 |
| ricochet | pro | Ricochet | Page de liens (link in bio) | 11 | 8 | bagel-fat-one / rethink-sans | #ff6f91 |
| socle | pro | Socle | Corporate / grande entreprise | 13 | 7 | ibm-plex-serif / ibm-plex-sans | #222831 |

Chaque thème : 14 axes décrits (`dna`), 3 variantes d'en-tête, 2 de pied, 3 de liste, 2 de page/article (options), mode sombre ou clair, page de blocs, recherche avec état vide, 404 conçue, contact avec le formulaire du CMS, mentions légales et confidentialité, feuille d'impression, `prefers-reduced-motion`, réglage « Animations » (moteur partagé), et un composant signature fonctionnel côté navigateur.

## Vérifications réelles
- `tests/themes-extension5.test.js` (5 tests) : 30 thèmes, 12/18 par collection, 14 axes, pages obligatoires, ≥ 7 options, **jamais plus de 4 axes identiques entre deux nouveaux thèmes**, paires de polices et couleurs principales distinctes, audit de contenu (filtre de sécurité, liens, titres, alt) et de diversité sur les 100 thèmes, poids CSS/JS, reduced-motion, impression.
- Un conflit réel a été trouvé et corrigé : « rubrique » et « gradin » avaient la même couleur principale ; « bulletin » et « communique » étaient trop proches d'un thème existant (convoi). Contrastes recalculés ≥ 5,4:1.
- Agents de lot : rendu Chrome headless sur une partie des pages, à 375 et 1280 px, sans débordement horizontal sur les pages mesurées ; correctifs de grilles mobiles faits.

## Notes d'auto-évaluation (moyenne des lots, /10)
Originalité 7,5 · Adéquation 8,3 · Lecture 8,2 · Typographie 7,7 · Navigation 7,9 · Variantes 7,6 · Mobile 6,8 · Signature 8,2 · Contenus 7,9. Seuil « moyenne ≥ 8 et aucune note < 7 » : **non atteint** pour le mobile (6 à 7, mesures incomplètes) et l'originalité de socle (5), rubrique et defile (6), gradin/ossature mobile (6).

## Ce qui n'est pas prouvé (à ne pas déclarer terminé)
- Pas de Lighthouse, LCP, CLS, INP ni mesure 4G lente.
- Rendu mobile mesuré seulement sur une partie des pages ; captures non regardées pour plusieurs thèmes ; pas de planche de silhouettes.
- Pas de test de parcours bout en bout dans le vrai CMS (installation d'un thème sur un site, formulaires envoyés, commentaires).
- Pas d'axe « Delta E » : la distance de couleur est approchée (distance RGB).
- Mode sombre et variantes d'options relus dans le CSS, pas tous vus à l'écran.

## Limites du CMS (voir EXTENSION5_PHASE0_CAPACITES.md)
- Les données de démonstration (articles, sessions, fiches, liens, communiqués) sont **écrites dans les pages du thème** (champ `contentModel`/`declare`) : ce n'est pas un type de contenu du CMS. Les cartes de liste mènent à une seule page d'exemple.
- Pas de données structurées Recipe, Event ni Review ; pas d'archives par date ; pas de multilingue.
- Le filtre de sécurité des blocs HTML retire `id`, `nav`, `button`, `input`, `h1`, `style`, `tabindex` : contournements par rôles ARIA et JavaScript ; sans JavaScript, les filtres et calculateurs ne sont pas actifs (le contenu reste lisible).
- Catalogue : les catégories n'ont pas « blog » ni « conférence » ; `collection` n'est pas encore un filtre de la galerie (voir plus bas).
- `scripts/themes-check.js` est cassé depuis avant (fichier `library/verify.js` absent).
- Les images sont des illustrations SVG, pas des photos.
