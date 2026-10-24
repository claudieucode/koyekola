# Bibliothèque de thèmes Kolakisa (Apparence → Thèmes)

Cette bibliothèque propose **160 thèmes complets** (21 catégories). Le catalogue est partagé ; l'état (installé, actif), les réglages et les pages créées sont **propres à chaque site**.

## Ce qu'est un thème
Un thème est un paquet de **données** (aucun code n'est exécuté) :
1. des **jetons de design** (couleurs, polices, rayons, ombres, boutons) : c'est ce que l'activation applique au site, avec le moteur d'apparence existant (`services/themes.js` → réglages du site, ou apparence publiée du site principal) ;
2. un **site de démonstration** : 4 à 6 pages utiles au métier + une page de recherche et une page « introuvable » (ajoutées automatiquement), composées de **vraies sections du Page Builder** (donc modifiables dans l'éditeur existant : aucun éditeur parallèle) ;
3. des **visuels originaux** générés par Kolakisa ;
4. des métadonnées : catégorie, styles, type de site, modules requis, aperçus.

## Où est le code
| Élément | Fichier |
|---|---|
| Fiches des 160 thèmes | `src/marketing/themes/library/specs/*.js` (guide d'écriture : `specs/README.md`) |
| Moteur de composition (85 variantes de mise en page) | `src/marketing/themes/library/compose.js` |
| Visuels SVG originaux (16 motifs, palette du thème) | `src/marketing/themes/library/art.js`, servis par `/themes-art/<thème>/<emplacement>.svg` |
| Registre, catégories, contrôles de fiche | `src/marketing/themes/library/index.js` (`problems()` doit être vide) |
| Contrôles de qualité (pages valides, contrastes AA, diversité) | `src/marketing/themes/library/verify.js`, `scripts/themes-check.js` |
| Catalogue installable | `src/marketing/themes/catalog.js` (les manifestes de la bibliothèque y sont ajoutés) |
| Installation, activation, galerie filtrable, pages de démonstration | `src/services/themes.js` |
| Écrans : galerie, fiche, aperçu | `src/marketing/web/themes.js`, vues `themes.ejs`, `themes-detail.ejs`, `themes-preview.ejs` |
| Aperçu complet isolé et visuels publics | `src/marketing/web/themeDemo.js`, `themeArtPublic.js` |
| Aperçus WebP (accueil, page intérieure, mobile) | `public/img/theme-previews/<clé>-{home,inner,mobile}.webp`, produits par `scripts/themes-previews.js` |
| Audit responsive | `scripts/themes-responsive.js` |
| Registre des ressources (polices, licences, visuels) | `scripts/themes-registre.js` → `docs/KOLAKISA_THEMES_REGISTRE.md` |

## Parcours utilisateur
- **Galerie** : recherche instantanée (nom, secteur, style, sans tenir compte des accents), catégories, style, affichage (tous / installés / disponibles), tri (pertinence, nom, nouveautés), pagination côté serveur (fonctionne aussi sans JavaScript), thèmes recommandés, thème actif en tête avec « Personnaliser » (le personnalisateur existant : aucun second panneau).
- **Prévisualiser** : le site de démonstration complet, **isolé** (aucune page, aucun média ni article du site n'est lu ; rien n'est écrit), page par page, avec choix de l'appareil. « Voir ce thème avec le contenu de mon site » reprend l'aperçu historique.
- **Installer** puis **Utiliser ce thème** : deux actions distinctes. À l'activation, on peut ajouter les **pages de démonstration en brouillon** (jamais publiées, jamais en remplacement : les noms sont libres) et un menu.
- **Changer de thème ne supprime jamais de contenu** : seules les couleurs, polices et formes changent ; « Revenir au thème précédent » rétablit l'apparence d'avant ; les couleurs personnalisées du site sont conservées.
- Droits : `appearance.read` (voir), `appearance.styles` (installer), `appearance.publish` (activer, supprimer), `forms.write` (pages de démonstration). Un accès limité à un site ne touche que ce site.

## Multi-sites
Le moteur et le catalogue sont partagés (aucune copie du moteur par site). Chaque site a ses propres lignes d'installation (`cms_themes.site_id`), son thème actif et ses jetons ; le site vient de l'adresse vérifiée par le serveur. L'aperçu isolé n'utilise aucune donnée du site.

## Images et licences
Tous les visuels des thèmes sont des **illustrations vectorielles originales générées par Kolakisa** : pas de photographie, pas d'image tierce, aucune attribution. Conditions relues le 23/10/2026 : Pexels interdit de « redistribuer ou vendre les photos sur d'autres plateformes » et de vendre des copies non modifiées (la page ne traite pas de l'inclusion dans une bibliothèque de thèmes distribuée) ; Unsplash interdit de compiler ses images « pour reproduire un service similaire ou concurrent ». Aucun droit de redistribution dans un produit n'étant établi, aucune photo tierce n'est livrée : les photos réelles se choisissent dans la médiathèque du site (remplacement en un clic dans l'éditeur). Polices : bibliothèque de polices libres de Kolakisa (licences dans son manifeste), hébergées localement. Le détail par thème est dans `KOLAKISA_THEMES_REGISTRE.md`.

## Contrôles et tests
- `node scripts/themes-check.js --strict` : 160 thèmes, répartition exacte, chaque page validée par le moteur du Page Builder, contrastes WCAG AA, diversité (mises en page, polices, teintes), aucune fiche écartée.
- `scripts/themes-responsive.js` : chaque thème, 3 pages × 3 largeurs (1440, 820, 390 px) en vrai Chrome : pas de défilement horizontal, pas d'erreur de page, pas d'image cassée, un seul titre de niveau 1, police de titre chargée.
- Tests : `themes-bibliotheque.test.js` (catalogue, 160 fiches, aperçus WebP réels et tous différents, visuels), `themes-bibliotheque-http.test.js` (galerie, filtres, aperçu, installation, activation, pages de démonstration, droits, isolation), `themes-bibliotheque-navigateur.test.js` (Chrome réel), `apparence-themes.test.js` (parcours historique adapté).

## Limites connues (dites honnêtement)
- Les visuels sont des illustrations, pas des photographies.
- L'activation applique les **jetons** (couleurs, polices, formes) ; la structure d'une page vient des pages de démonstration, que l'on ajoute volontairement. L'en-tête et le pied de page d'un thème sont des sections de ces pages, pas des parties globales du site.
- Boutiques : le module e-commerce n'existe pas encore ; les thèmes de boutique montrent un catalogue de démonstration et le déclarent (`modules`). Aucun panier ni paiement n'est simulé. Les listes d'articles (`misc:posts`) et de formations (`misc:courses`) lisent les vrais contenus du site et sont vides tant qu'il n'y en a pas.
- Les textes, personnes, entreprises et coordonnées des démonstrations sont fictifs.
