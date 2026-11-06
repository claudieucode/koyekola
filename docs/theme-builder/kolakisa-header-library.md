> **Document historique.** La bibliothèque décrite ici (100 compositions en rangées, 34 identités) a été remplacée par la bibliothèque « Atelier » : voir [HEADER_LIBRARY_100_MODELS_REPORT.md](HEADER_LIBRARY_100_MODELS_REPORT.md).

# Bibliothèque d'en-têtes du Theme Builder (100 modèles, 34 identités propres)

Documentation technique de la catégorie **En-tête**. Références : [`elementor-header-reference.md`](elementor-header-reference.md) (ce qu'Elementor fait, confirmé / non vérifiable)
et [`kolakisa-header-audit.md`](kolakisa-header-audit.md) (état avant refonte).

## 1. Périmètre

* Un en-tête du Theme Builder est un **composant réutilisable** du site (`mk_web_components`) rattaché à un modèle (`mk_tb_templates`, type `header`) qui porte ses **conditions d'affichage** et son cycle brouillon / publié.
* La bibliothèque est un **catalogue en code** : `src/themeBuilder/catalog/header.js`. Aucune ligne en base tant qu'un modèle n'est pas utilisé. « Utiliser ce modèle » crée une **copie indépendante** (`catalog/use.js`).
* **100 modèles exactement** : 10 familles × 10 compositions. Chaque modèle fixe sa propre identité visuelle (palette et polices **fixes**, 34 identités : voir §3 bis).
  Ce n'est plus un croisement mise en page × couleur (l'ancien 20 × 5) : deux modèles ne partagent jamais la même composition (test `theme-builder-entetes-bibliotheque`).

## 2. Les 10 familles

| Famille (`layoutKey`) | Usage | Exemples de compositions |
|---|---|---|
| `classique` Classique et corporate | site vitrine, entreprise | logo/menu/bouton, menu collé au logo, connexion + inscription, logo central, deux niveaux |
| `centre` Centré et éditorial | média, marque, éditorial | titre de journal, filet double, signature, logo au-dessus du menu |
| `boutique` Boutique et e-commerce | vente en ligne | recherche large, compte + panier, promotion + trois niveaux, rayons |
| `minimal` Minimal et portfolio | créatifs, indépendants | nom + menu, menu seul, pastille flottante, monogramme |
| `saas` SaaS et application | logiciels, services | connexion + essai, annonce « Nouveau », pilule, verre dépoli collant |
| `transparent` Transparent sur visuel | pages à visuel d'ouverture | 10 en-têtes **superposés** (texte clair, sans fond) |
| `collant` Collant au défilement | longues pages | collant classique, verre, liseré, deux rangées |
| `barre` Avec barre supérieure | information, service | réseaux + compte, annonce, date + aide, barre encre |
| `magazine` Magazine et blog | publication | une de magazine, newsletter, grande recherche, rubriques |
| `creatif` Créatif et structure libre | identités fortes | carte ombrée, cadre contour, asymétrique, bicolore, pile centrée |

## 3. Architecture

```
catalog/header.js     définitions (M(...)) + compilation rangées → éléments natifs
catalog/index.js      type « plat » (flat) : entries() / list() / build() ; filtre « mise en page » = famille
catalog/kit.js        identités (SKINS) et constructeurs d'éléments (k.logo, k.menu, k.B…)
catalog/use.js        « Utiliser » : composant + modèle brouillon (copie indépendante)
web/themeBuilder.js   routes /api/bibliotheque/header/:clé/{vignette,apercu,miniature}
web/themeRender.js    previewDoc : MÊME moteur de rendu que le site publié
```

### Schéma d'un modèle

```js
M(famille, identité, clé, libellé, étiquettes, description, rangées, mode)
//   "classique", "clair", "classique-logo-menu-bouton", "Logo, menu et bouton d'action", […], "…", [R(["logo"], [], ["menu", CTA])], undefined|"sticky"|"glass"|"overlay"
```

Clé publique d'un modèle : `<clé>.<identité>` (ex. `classique-logo-menu-bouton.clair`), **ASCII minuscule, chiffres et tirets** (la clé est dans l'adresse de la route ; une clé accentuée casse la route : test).

### Rangées et zones

Une **rangée** = une bande pleine largeur : `R(gauche, centre, droite, options)`. Chaque zone est une liste de **codes d'éléments** :

| Code | Élément natif | Mobile |
|---|---|---|
| `logo:44` / `title:24` | `sitelogo` (hauteur) / `sitetitle` (taille) | visible |
| `menu`, `menu:sm`, `menu:lg`, `menu:caps` | `menu` : **menu affecté à « En-tête »** (Apparence → Menus), repliable (`mobileToggle`), un niveau de sous-menu | visible (bouton) |
| `search:wide` / `search:mini` / `search:wide:catalogue` | `search` (cible blog ou catalogue) | `wide` : ligne entière ; `mini` : masqué |
| `account`, `cart` | `account` (sans panier) / `minicart` (compteur) | visible |
| `cta|libellé|/adresse` | bouton plein | visible |
| `cta2|…`, `link|…` | bouton contour, lien | **masqués** |
| `social`, `date`, `note|texte`, `tag|texte` | réseaux, date du jour, texte, pastille | **masqués** (suffixe `:keep` pour les garder) |
| `~` | cale invisible (zone vide) | — |
| suffixe `@m` / `@tm` | masque l'élément sur mobile / tablette et mobile | — |

Options d'une rangée : `bg` (`alt`, `accent`, `ink`), `pad` (`xs`, `sm`, `lg`, `xl`), `rule` (`none`, `thin`, `accent`, `thick`, `double`), `inn` (style de la zone de contenu), `card` / `pill` / `frame` (carte, pastille, cadre).

Règles de composition (`band()` dans `header.js`) :

* **Trois zones** : si le centre est court (logo, titre, date, texte, pastille, réseaux), les deux côtés se partagent la place à parts égales (`flex-basis: 0; flex-grow: 1`) : le centre est vraiment centré.
  Si le centre est long (menu, recherche large) : répartition `space-between`, sans retour à la ligne forcé.
* Une rangée dont **tout** le contenu est masqué sur mobile est elle-même masquée (`hideOn`).
* Toutes les rangées sont dans **un seul conteneur** pleine largeur (`wrap()`), sans espace entre rangées. C'est ce conteneur qui porte le comportement.

## 3 bis. Identités propres : 34 identités, aucune couleur de la charte du site (4 novembre 2026)

**Les 100 modèles** portent désormais leur propre identité, déclarée dans `catalog/header.js` (`IDENT2` pour les 22 identités par ambiance, `IDENT` pour les 12 sectorielles ; exportées en `skins`, `ownSkins: true`) :
couleurs en **valeurs fixes** (jamais un jeton `token:…` : le test le vérifie sur les 100 documents), polices de la **bibliothèque locale** (au moins 18 polices de titres et 14 polices de texte différentes), arrondis, graisses, casse et densité propres.
Les cinq anciennes identités (clair, marque, nuit, éditorial, doux) ne sont plus utilisées par les en-têtes.

* **22 palettes par ambiance** : claire (Lumière, Terre cuite, Sauge, Corail, Gris indigo), couleur (Cobalt, Émeraude, Prune, Brique), sombre (Minuit violet, Graphite et lime, Forêt de nuit, Bordeaux de nuit), éditoriale (Journal, Revue verte, Gazette, Atlas, Manuscrit), douce (Rose poudré, Menthe, Ciel, Lavande).
* **Affectation** : un modèle reçoit, à tour de rôle dans l'ordre du catalogue, l'une des palettes de l'ambiance de son ancienne identité (une ambiance sombre reste sombre, une colorée reste colorée). Son **suffixe de clé d'origine est conservé** (`keySkin`) : `classique-logo-menu-bouton.clair` existe toujours, avec la palette « Lumière ».
* **Filtre « identité »** : 34 entrées (22 + 12).
* La police est posée sur tous les éléments de texte ; pour le menu, le compte, le logo et la **recherche** elle passe par les **parties** du widget (`parts.link`, `parts.text`, `parts.field`, `parts.button`), car le site impose sa police et ses couleurs aux liens et aux boutons (sans cela le bouton « Rechercher » restait bleu).

### Les 12 modèles sectoriels

| Secteur | Modèle (famille) | Identité | Particularité |
|---|---|---|---|
| Restaurant | `restaurant-reservation` (classique) | beige chaud, bordeaux, Playfair Display / Lato | barre de coordonnées, logo central, « Réserver une table » |
| École | `ecole-inscriptions` (classique) | blanc, vert d'eau, ambre, Nunito | bandeau d'annonce ; **se réduit au défilement** |
| Cabinet | `cabinet-confiance` (classique) | gris-vert, vert sapin, Lora / Source Sans 3 | coordonnées, rendez-vous |
| Portfolio | `portfolio-signature` (minimal) | crème, noir, Instrument Serif / DM Sans | nom en grand, menu discret ; **se réduit** |
| Bien-être | `bien-etre-pastille` (minimal) | vert doux, Lora / Nunito Sans | pastille arrondie |
| Agence | `agence-brutaliste` (créatif) | noir, jaune acide, Space Grotesk | capitales, filet épais ; **se réduit** |
| Mode | `mode-boutique-promo` (boutique) | rose poudré, prune, Cormorant / Jost | bandeau promotionnel, compte et panier |
| SaaS | `saas-violet-essai` (saas) | blanc, violet, Plus Jakarta Sans / Inter | connexion + essai ; **se réduit** |
| Média | `media-une-du-jour` (magazine) | papier, rouge, Libre Baskerville / Source Sans 3 | date, recherche, double filet |
| Hôtel | `hotel-couverture` (transparent) | pierre noire, or, Cinzel / Lato | superposé à la couverture, **devient plein au défilement** |
| Immobilier | `immobilier-recherche` (collant) | blanc, cyan, Manrope | large recherche ; **se réduit** |
| Association | `association-don` (barre) | crème, orange brûlé, Quicksand | bandeau d'engagement, « Faire un don » |

Modèles retirés (les plus proches d'un autre de leur famille) : `classique-sobre`, `classique-filet-accent`, `classique-lien-contact`, `minimal-pile-a-droite`, `minimal-titre-puis-menu`, `creatif-pile-gauche`, `boutique-compacte`, `saas-collant-fin`, `blog-minimal-recherche`, `collant-filet-accent`, `barre-connexion-discrete`, `superpose-pastille`.
Les en-têtes déjà utilisés par des sites sont des **copies indépendantes** : aucun n'est touché ; les clés retirées répondent 404 dans la bibliothèque.

## 4 bis. Effets au défilement (propriété `headerFx`)

Propriété de conteneur validée par la grammaire (`nodes.js`, `container`) : `shrink`, `solid` ou `both`, lue sur le **premier conteneur** de l'en-tête (comme la position).

| Valeur | Effet | Condition |
|---|---|---|
| `shrink` | la rangée se réduit (remplissage vertical 6 px, logo ≤ 32 px) dès 8 px de défilement, puis retrouve sa taille en haut de page | en-tête collant ou superposé |
| `solid` | un en-tête **superposé** (transparent, texte clair) se fixe en haut (`position: fixed`) et prend le fond et le texte du site (`--kw-background`, `--kw-text`) | en-tête superposé |
| `both` | les deux | — |

Mécanisme : `_sections.ejs` / `themeRender.partMode` ajoutent `kw-theme-fx-<valeur>` et `data-kw-scroll` à l'enveloppe ; `landing.js` pose `is-scrolled` (un écouteur passif, une image à la fois) ; `landing.css` porte les règles sur les **rangées** (transition 0,2 s, supprimée si le visiteur demande moins de mouvement ; boutons laissés dans leurs couleurs).
Sans la propriété rien ne change. Ne pas confondre avec `motion.scrollFx` (effets de mouvement d'un élément).

## 4. Comportements

| Mode | Déclaration | Effet |
|---|---|---|
| Collant (`sticky`) | conteneur d'en-tête : `position: sticky; top: 0; z-index: 50`, ombre | tout l'en-tête reste en haut |
| Verre dépoli (`glass`) | idem + première bande `backdrop-filter` flou + fond translucide | collant translucide |
| Superposé (`overlay`) | conteneur : `position: absolute; top/left/right: 0; z-index: 40` ; texte clair, fond transparent | posé sur le visuel d'ouverture de la page |

Le rendu lit la position sur le **premier enfant** de la section d'en-tête et la reporte sur l'enveloppe qui défile :

* pages du Page Builder : `_sections.ejs` ajoute `kw-theme-sticky` / `kw-theme-overlay` à l'enveloppe `lp-site-header` ; règles dans `public/css/landing.css` ;
* blog, recherche, 404… : `themeRender.partMode` (même vocabulaire de classes).

> **Cause racine corrigée avec cette refonte.** Sur les pages du Page Builder, `position: sticky` posé sur la bande restait dans une enveloppe de la hauteur de la bande : l'en-tête « collant » **ne collait jamais** (mesuré dans un navigateur : `top` passait de 32 à −1468 px après défilement). La position est maintenant portée par l'enveloppe (hors éditeur : l'éditeur garde le rendu historique).
> Autre défaut corrigé : la colonne de la page (`.lp-main`, 32 px de marge haute) laissait un espace au-dessus de tout en-tête ; `:has(> .lp-site-header:first-child)` le retire (idem pour le pied).

### Responsive

* Retour à la ligne (`flex-wrap`) dans les rangées et les zones ; **aucune position absolue à l'intérieur d'une rangée** (test).
* Marges latérales réduites sur tablette (20 px) et mobile (14 px) ; zones à base `auto` sur mobile.
* Menu : `mobileToggle` — replié derrière un bouton sur petit écran. Éléments secondaires masqués (tableau ci-dessus).
* Vérifié par mesure dans un navigateur : 100 modèles × 3 largeurs (1280 / 820 / 390 px), aucun débordement horizontal, aucun chevauchement (voir §8).

## 5. Menu d'exemple (aperçu de la bibliothèque seulement)

Règle de la plateforme : sans menu affecté, un site n'affiche **rien** (jamais de menu par défaut, jamais le menu d'un autre site).
Un aperçu sans menu rendrait tous les modèles vides ; l'aperçu et la vignette **de la bibliothèque** (`previewDoc(…, { sampleMenu: true })`, `landing.viewModel` → `page.demoMenu`) affichent donc un menu d'exemple (Accueil, Services ▾ Conseil / Accompagnement, Blog, Contact).
Il n'apparaît **jamais** sur un site, une copie, ni dans l'éditeur (test).

## 6. Aperçu des en-têtes superposés

Un en-tête superposé a un texte clair : sur le fond blanc d'un aperçu, il disparaît. `previewDoc` le pose donc sur un visuel sombre de remplissage (aperçu et vignette).

## 7. Règles d'affichage, enregistrement, publication

Inchangées, communes à tous les types (`store.js`, `conditions.js`, `resolve.js`) : conditions à la publication, « mêmes conditions → remplacement explicite », brouillon / version publiée, isolation par site, copie indépendante du catalogue.
Les en-têtes **déjà utilisés par des sites ne sont ni supprimés ni modifiés** : ils sont des copies (voir l'audit §5). Les anciennes clés du catalogue (`classique.clair`…) répondent 404.

## 8. Tests et vérifications

| Fichier | Contrôle |
|---|---|
| `tests/theme-builder-entetes-bibliotheque.test.js` | 100 exactement, 10 × 10, 20 par identité, clés ASCII, anciennes clés absentes, 100 compositions distinctes, logo/titre + menu, aucun contenu factice, responsive (menu repliable, secondaires masqués, pas d'absolu), collant / superposé sur le conteneur, liste et filtres, utilisation (copie indépendante, isolation), 100 aperçus + vignettes (200), menu d'exemple absent des copies |
| `tests/theme-builder-catalogue.test.js` | 100 modèles valides par la vraie grammaire du Page Builder (tous types) |
| `tests/theme-builder-catalogue-public.test.js` | un en-tête de la bibliothèque habille accueil, blog, article, 404 d'un site, pas l'autre |
| `tests/theme-builder-en-tete-collant-public.test.js` | page publiée : classes `kw-theme-sticky` / `kw-theme-overlay` sur l'enveloppe, pas d'effet dans l'éditeur |
| Contrôle visuel par lots (navigateur) | 100 modèles × 3 largeurs : capture, débordement horizontal, chevauchements, éléments hors écran ; en pages publiées : collage réel au défilement, superposition, sous-menu au survol, menu mobile |

Le contrôle visuel est `scripts/audit-entetes.js` (Playwright, non installé par défaut : `npm i --no-save playwright-core` ; les tests navigateur se désactivent sans lui). Résultats, défauts trouvés et corrigés : [`kolakisa-header-library-verification.md`](kolakisa-header-library-verification.md). Liste des 100 modèles : [`kolakisa-header-library-modeles.md`](kolakisa-header-library-modeles.md).

## 9. Limites connues

* Effets de défilement limités à « réduit » et « superposé → plein » (voir §4 bis) ; pas de pointeurs de menu configurables, ni de sous-menus à plusieurs niveaux (grammaire `menu`).
* Le collant d'un en-tête **à plusieurs rangées** colle en bloc (Elementor v3 permet de ne coller qu'une section).
* L'aperçu de la bibliothèque ne charge pas le script du menu mobile : le menu y est montré déployé ; sur le site et dans l'éditeur il se replie derrière un bouton.
* Les liens de boutons du catalogue (`/catalogue`, `/contact`, `/inscription`, `/connexion`, `/blog`, `/faq`) sont des pages de la plateforme ; à adapter si le site n'a pas ces pages. Les réseaux sociaux pointent vers les accueils des réseaux (à remplacer).
* Les textes de messages (« Une offre à mettre en avant… ») sont des **textes d'exemple à modifier**.
* Le démarrage du serveur de test dépasse 2 minutes depuis la refonte de la bibliothèque de thèmes (360 thèmes) : `TEST_START_TIMEOUT_MS` permet de l'allonger.

## 10. Ajouter ou modifier un modèle

1. Ajouter une ligne `M("famille", "identité", "clé-unique", "Nom unique", ["étiquettes"], "Description.", [R(…)], mode?)` dans `LAYOUTS` (`catalog/header.js`).
2. Respecter : clé ASCII (`[a-z0-9-]`), nom unique, une composition **différente** des 100 autres, 10 modèles par famille, 20 par identité (sinon `theme-builder-entetes-bibliotheque` échoue : pour en ajouter, retirer d'abord un modèle).
3. Un nouvel élément : l'ajouter dans `item()` (jamais de lien de navigation inventé : le menu lit l'emplacement « En-tête »).
4. Lancer `node --test tests/theme-builder-entetes-bibliotheque.test.js tests/theme-builder-catalogue.test.js`, puis le contrôle visuel.

## 11. Décisions techniques

* **Catalogue plat plutôt que 20 × 5** : seule façon d'avoir 100 compositions distinctes ; `catalog/index.js` reste compatible avec les autres types (croisement inchangé).
* **Rangées/zones compilées plutôt que 100 arbres écrits à la main** : une grammaire courte garantit l'alignement (flex, jamais d'absolu), l'adaptation mobile et la cohérence ; chaque modèle reste modifiable dans l'éditeur (éléments natifs).
* **Position portée par l'enveloppe** : la seule façon de rendre `sticky` effectif dans une page qui fait défiler un bloc plus grand que la bande.
* **Menu d'exemple réservé à la bibliothèque** : préserve la règle « sans menu affecté, rien » sur les sites.

## 12. Éléments du cahier des charges non proposés (et pourquoi)

| Demande | État | Raison |
|---|---|---|
| Sélecteur de langue ou de région | **non proposé** | le site public n'a pas de versions traduites à commuter : un sélecteur serait un contrôle sans effet |
| Favoris / liste de souhaits | **non proposé** | pas de fonction « favoris » côté visiteur (ni table, ni route) |
| Coordonnées | proposé | liste d'icônes `contact` : textes d'exemple à remplacer, aucun numéro inventé |
| Menu mobile et hamburger, sous-menus, clavier | déjà fournis | `landing.js` : bouton, Échap, retour du focus, fermeture à la sortie |
| Aperçu responsive avant publication, dupliquer, renommer, publier, archiver | déjà fournis | interface du Theme Builder (boutons Ordinateur / Tablette / Mobile) |
