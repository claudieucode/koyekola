# Bibliothèque de thèmes Kolakisa (Apparence → Thèmes)

Cette bibliothèque propose **360 thèmes complets** (21 catégories). Le catalogue est partagé ; l'état (installé, actif), les réglages et les pages créées sont **propres à chaque site**.

## Ce qu'est un thème
Un thème est un paquet de **données** (aucun code n'est exécuté) :
1. des **jetons de design** (couleurs, polices, rayons, ombres, boutons) : c'est ce que l'activation applique au site, avec le moteur d'apparence existant (`services/themes.js` → réglages du site, ou apparence publiée du site principal) ;
2. un **site de démonstration** : 4 à 6 pages utiles au métier + une page de recherche et une page « introuvable » (ajoutées automatiquement), composées de **vraies sections du Page Builder** (donc modifiables dans l'éditeur existant : aucun éditeur parallèle) ;
3. des **visuels originaux** générés par Kolakisa ;
4. des métadonnées : catégorie, styles, type de site, modules requis, aperçus.

## Où est le code
| Élément | Fichier |
|---|---|
| Fiches des 360 thèmes | `src/marketing/themes/library/specs/*.js` (guide d'écriture : `specs/README.md`) |
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
- `node scripts/themes-check.js --strict` : 360 thèmes, répartition exacte, chaque page validée par le moteur du Page Builder, contrastes WCAG AA, diversité (mises en page, polices, teintes), aucune fiche écartée.
- `scripts/themes-responsive.js` : chaque thème, 3 pages × 3 largeurs (1440, 820, 390 px) en vrai Chrome : pas de défilement horizontal, pas d'erreur de page, pas d'image cassée, un seul titre de niveau 1, police de titre chargée.
- Tests : `themes-bibliotheque.test.js` (catalogue, 360 fiches, aperçus WebP réels et tous différents, visuels), `themes-bibliotheque-http.test.js` (galerie, filtres, aperçu, installation, activation, pages de démonstration, droits, isolation), `themes-bibliotheque-navigateur.test.js` (Chrome réel), `apparence-themes.test.js` (parcours historique adapté).

## Limites connues (dites honnêtement)
- Les visuels sont des illustrations, pas des photographies.
- L'activation applique les **jetons** (couleurs, polices, formes) ; la structure d'une page vient des pages de démonstration, que l'on ajoute volontairement. L'en-tête et le pied de page d'un thème sont des sections de ces pages, pas des parties globales du site.
- Boutiques : le module e-commerce n'existe pas encore ; les thèmes de boutique montrent un catalogue de démonstration et le déclarent (`modules`). Aucun panier ni paiement n'est simulé. Les listes d'articles (`misc:posts`) et de formations (`misc:courses`) lisent les vrais contenus du site et sont vides tant qu'il n'y en a pas.
- Les textes, personnes, entreprises et coordonnées des démonstrations sont fictifs.

---

# Réparation du gestionnaire de thèmes (installation, aperçu, responsive) — référence

## 1. Cause racine du chargement infini de « Installer le thème » (confirmée par reproduction dans Chrome)
`public/js/cms-themes.js` posait **deux écouteurs `submit`** sur chaque formulaire de carte (un à l'initialisation, un second dans `wire()` après chaque chargement des cartes). Les deux utilisaient le même drapeau `data-busy-now` : le premier le posait, le second le voyait déjà posé et **annulait l'envoi** (`preventDefault`). Résultat : le bouton passait à « Installation… » (désactivé, sablier) et **aucune requête ne partait** : spinner éternel. Le test navigateur d'origine passait parce qu'il n'installait que depuis la fiche du thème (formulaires hors de la grille).
Reproduction avant correction : clic sur « Installer » d'une carte → `POST envoyés = []`, bouton `aria-busy="true"` désactivé. Après : une requête, thème enregistré, bouton jamais bloqué.

## 2. Cycle de vie d'une action (installer, utiliser, revenir, supprimer)
Un **seul** écouteur délégué sur la racine (`[data-th-root]`) valable pour les cartes d'origine comme pour celles rechargées par les filtres. États :
| État | Interface | Terminal ? |
|---|---|---|
| prêt | bouton avec son libellé | — |
| en cours | `aria-busy`, libellé « Installation… », bouton désactivé, région `aria-live` « Opération en cours… », second clic ignoré | non |
| réussi | le serveur répond `{ ok, redirect }` ; le script va à l'adresse (message de succès affiché par la bibliothèque) | oui |
| échec | bouton **rendu avec son libellé d'origine**, message `role="alert"` : erreur HTTP (« erreur 500 »), connexion interrompue, session expirée (réponse non JSON), **délai dépassé (45 s)** ; rien n'est modifié, on peut réessayer | oui |
| retour arrière (page restaurée du cache) | `pageshow` (`persisted`) rend tout bouton resté « en cours » | oui |
Réglage réservé aux tests : `window.__thTimeoutMs`.

## 3. Contrat frontend ↔ backend
- Requête : `POST /marketing/site-web/themes/installer` (et `/:key/activer`, `/revenir`, `/:key/supprimer`, `/:key/demo`), corps `application/x-www-form-urlencoded` (champs du formulaire dont `site` et `key`), en-têtes `X-Requested-With: kolakisa-fetch` et `Accept: application/json`.
- Réponse : le routeur (`src/marketing/web/themes.js`) transforme toute redirection d'une requête portant cet en-tête en `200 {"ok":true,"redirect":"<adresse>"}` ; l'adresse mène à la bibliothèque, où le message éclair (succès **ou** erreur métier) est affiché. Erreurs HTTP (403, 500…) : statut non 2xx. Sans l'en-tête (formulaire classique, JavaScript absent) : redirection ordinaire, comportement inchangé.
- Droits : `appearance.styles` (installer), `appearance.publish` (activer, revenir, supprimer), vérifiés **côté serveur** ; écriture limitée au site de la requête (`siteTarget`), jamais à un autre site. L'installation est idempotente (un thème déjà installé n'est pas dupliqué) ; installer n'active pas, activer n'écrase aucun contenu.

## 4. Aperçu : trois choses distinctes, toujours nommées comme telles
| Élément | Nature | Où |
|---|---|---|
| Vignette de carte | **image de présentation** (WebP issu d'une capture à 2×, variantes 480 et 720 px choisies par `srcset` selon la densité de l'écran) | galerie |
| Rendu en direct | **vrai rendu** du site de démonstration du thème, dans un cadre mis à l'échelle (1280 px virtuels) | fiche d'un thème |
| Aperçu complet | **vrai rendu** pleine page, largeur d'appareil réelle (téléphone 390, tablette 820, ordinateur) : la largeur du cadre est la largeur du viewport du rendu, pas un zoom | `…/apercu` |
La capture de la fiche n'est qu'une **image de présentation** affichée le temps du chargement ou si le rendu échoue (légende explicite après 15 s). Les rendus sont dans des cadres `sandbox="allow-scripts"` **sans `allow-same-origin`** (origine opaque : ni cookies, ni DOM de l'administration, ni API) ; `/fonts/*` envoie `Access-Control-Allow-Origin: *` (polices publiques) pour que le thème s'y affiche avec ses vraies polices. Aucun aperçu n'écrit quoi que ce soit.
Génération des images : `PX_ONLY=home,mobile node scripts/themes-previews.js [clés]` (capture à 2×, puis `-card` 480×300, `-card2` 720×450, `-phone` 192×416, `-home` 1440, `-mobile` 390).

## 5. Responsive des thèmes
`PX_WIDTHS=… node scripts/themes-responsive.js [clés]` : 3 pages × 9 largeurs (320, 360, 390, 430, 768, 1024, 1280, 1440, 1920) par thème ; échec si défilement horizontal, éléments hors cadre, image cassée, ≠ 1 titre, police du thème non chargée, erreur de page ; indicatifs : textes < 11 px, cibles tactiles < 36 px sur téléphone.

## 6. Tests
`tests/themes-installation-navigateur.test.js` : installation depuis une carte (requête, persistance, isolation entre sites, rechargement), double clic, erreur 500, réseau coupé, session expirée, délai dépassé, retour arrière, installation depuis une carte filtrée, rendu en direct isolé (sandbox, échelle, polices, cadre sans accès à l'administration), largeur réelle de l'aperçu, cartes nettes en Retina.
