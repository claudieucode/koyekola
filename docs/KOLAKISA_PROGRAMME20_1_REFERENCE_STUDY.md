# Programme 20.1 — Étude des logiciels de référence (Elementor, WordPress, WooCommerce)

Date de consultation : 2026-10-29. Rédigé à partir de pages officielles lues via WebFetch/WebSearch, et des documents locaux cités ci-dessous. Aucun contenu protégé ni code propriétaire n'est reproduit ; tout est reformulé.

Légende : **[CONFIRMÉ]** = lu dans une source officielle (URL citée) ; **[PARTIEL]** = vu en partie (résumé de recherche, article tronqué, ou page qui ne couvre pas tout le point) ; **[HYPOTHÈSE]** = non vérifié dans la documentation publique lue.

## 0. Ce qui existe déjà localement (cité, non refait)

- `docs/elementor-reference/` (20 fichiers, vérifications du 2026-10-10, ~180 articles d'aide lus ; chaque fichier a une section « Non vérifié ») : interface (`01`), conteneurs (`02`), widgets (`03`–`04k`), styles globaux (`06`), responsive (`08`), historique/révisions (`11`), **Theme Builder, conditions, étiquettes dynamiques, kits (`12-cms-integrations.md`)**, disponibilité gratuit/Pro (`15`), registre de sources (`16`), écarts avec Kolakisa (`18`).
- `docs/KOLAKISA_ELEMENTOR_FEATURE_INVENTORY.md` : 109 lignes de parité Elementor ↔ Kolakisa (52 existantes, 49 ajoutées, 1 autre module, 7 exclues).
- `docs/KOLAKISA_THEME_BUILDER_AUDIT.md` et `docs/KOLAKISA_THEME_BUILDER_INVENTORY.md` : 9 familles de modèles de thème du site public (`single_post`, `blog_archive`, `category_archive`, `tag_archive`, `author_archive`, `search_results`, `static_page`, `single_course`, `not_found`), conditions (catégorie, étiquette, article, public), priorité déterministe, parties globales en-tête/pied (brouillon puis « Mettre à jour »), composants `standard`/`global`, limite de 30 affectations. Types explicitement non pris en charge : modèle commun de page, recherche globale, archives de types personnalisés, pop-up/connexion/panier comme modèles.
- Autres fichiers voisins : `KOLAKISA_THEME_BUILDER_FUNCTIONAL_MATRIX.md`, `_LIMITATIONS.md`, `KOLAKISA_CMS_CONNECTEURS_REFERENCE_WORDPRESS.md`.

Cette étude ajoute surtout : la hiérarchie et les modèles WordPress (thèmes classiques/de blocs), le multisite, les rôles, WooCommerce, et des précisions Elementor sur conditions, import/export, réglages du site et aperçu, relues le 2026-10-29.

## 1. Sources réellement consultées

**Lues avec contenu utile**
- https://developer.wordpress.org/themes/basics/template-hierarchy/
- https://developer.wordpress.org/themes/block-themes/
- https://developer.wordpress.org/themes/global-settings-and-styles/ (page d'introduction seulement)
- https://wordpress.org/documentation/article/roles-and-capabilities/ (table des rôles, sommaire ; lecture partielle du détail)
- https://developer.wordpress.org/advanced-administration/multisite/
- https://wordpress.org/documentation/article/site-editor/
- https://wordpress.org/documentation/article/template-editor/
- https://wordpress.org/documentation/article/revisions/
- https://developers.elementor.com/docs/ (sommaire)
- https://developers.elementor.com/docs/themes/index.html (Theme Locations)
- https://developers.elementor.com/docs/theme-conditions/ (page d'introduction)
- https://elementor.com/help/conditions/ (partiel : seul le début de l'article est revenu)
- https://elementor.com/help/header-site-part/ (partiel)
- https://elementor.com/help/customize-the-search-results-archive/
- https://elementor.com/help/import-and-export-elementor-website-templates/
- https://elementor.com/help/site-settings/
- https://elementor.com/help/revision-history-undo-and-redo/
- https://elementor.com/help/loop-grid/ (partiel)

**Vues seulement par extrait de recherche** : https://elementor.com/blog/single-archive-builder/ , https://elementor.com/help/dynamic-content/ , https://woocommerce.com/document/woocommerce-store-editing/templates/ , https://woocommerce.com/document/woocommerce-store-editing/customizing-product-pages/ , https://developer.woocommerce.com/2023/07/07/woocommerce-blocks-10-6-0-release-notes/ .

**Inaccessibles (HTTP 404 ou contenu vide)** : https://elementor.com/help/theme-builder/ (rien après le décalage demandé), https://developer.wordpress.org/themes/templates/templates-and-template-parts/ (404), https://developer.wordpress.org/themes/templates/template-editor/ (404), https://developer.woocommerce.com/docs/theming/block-theme-development/theming-woocommerce-block-templates/ (404). La page de WordPress sur `theme.json` n'a pas livré les détails (cascade, palettes) : ils restent non vérifiés ici.

**Réserve de méthode** : les pages d'aide Elementor sont très longues ; l'outil de lecture a parfois renvoyé le début ou un résumé. Tout point non retrouvé est marqué [PARTIEL] ou [HYPOTHÈSE]. Rien n'est affirmé sur les fonctions payantes d'Elementor au-delà de ce que ces pages disent.

## 2. ELEMENTOR

### 2.1 Éditeur visuel (organisation, parcours, états)
- Panneau de widgets/réglages à gauche, canevas, Navigator, barre d'outils, menus contextuels, raccourcis : [CONFIRMÉ] par lecture antérieure, voir `elementor-reference/01-editor-interface.md` (sources dans `16-official-sources.md`, ex. https://elementor.com/help/hotkeys/ , https://elementor.com/help/right-click/).
- Historique : un panneau (icône à gauche de la barre d'outils) avec deux onglets. « Actions » = actions de la session en cours, un clic ramène à l'état d'alors ; « Révisions » = versions enregistrées ou publiées. Annuler/Rétablir par Cmd/Ctrl+Z et Maj+Z. [CONFIRMÉ] https://elementor.com/help/revision-history-undo-and-redo/ . L'article lu ne donne ni limite du nombre de révisions ni traitement explicite des brouillons : [PARTIEL].
- Responsive : points de rupture, héritage descendant, visibilité par appareil, contrôles responsifs : [CONFIRMÉ] antérieur (`08-responsive-system.md`, https://developers.elementor.com/docs/editor-controls/responsive-control.html). Non relu le 2026-10-29.

### 2.2 Réglages du site, couleurs et polices globales (kit)
- Accès : logo Elementor dans la barre supérieure > Site Settings, ou Elementor > Editor > Customize. [CONFIRMÉ] https://elementor.com/help/site-settings/
- Design System : couleurs globales (Primary, Secondary, Text, Accent + couleurs personnalisées réutilisables), polices globales (mêmes quatre rôles + styles ajoutés). [CONFIRMÉ] idem.
- Theme Style : styles par défaut des éléments HTML (fonds, titres, boutons, images, champs), appliqués seulement si l'élément n'a pas de définition propre ; permet aussi de styler en-tête et pied. [CONFIRMÉ] idem.
- Réglages : identité du site (nom, description, logo, favicon), arrière-plan (et version mobile), mise en page globale (polices génériques, largeur du contenu, espacement par défaut des widgets, modèle de page par défaut), lightbox, CSS personnalisé. [CONFIRMÉ] idem.
- Modèle de données conceptuel : un « kit » unique par site portant ces réglages. [HYPOTHÈSE] pour le détail technique du stockage (les pages lues parlent de réglages, pas de la structure interne ; voir `elementor-reference/06-style-system.md` pour ce qui avait été relevé).
- Publication des réglages du site / points de rupture : l'article lu n'en parle pas : [PARTIEL].

### 2.3 Theme Builder
- Principe : remplacer des zones du thème par des conceptions faites dans l'éditeur. Les « Theme Locations » intégrées : **Header** (remplace `header.php`), **Footer** (`footer.php`), **Single** (contenu de `singular.php`, `single.php`, `page.php`, `attachment.php`, `404.php`), **Archive** (`archive.php`, `taxonomy.php`, `author.php`, `date.php`, `search.php`). Un thème peut supporter un sous-ensemble ou définir ses propres locations. [CONFIRMÉ] https://developers.elementor.com/docs/themes/index.html . La page présente cela comme une capacité d'Elementor Pro 2.0.
- Types de modèles côté éditeur : en-tête, pied, single, archive, 404, résultats de recherche (traité comme une archive). [CONFIRMÉ] pour le lien entre résultats de recherche et archive (https://elementor.com/help/customize-the-search-results-archive/) ; la liste exhaustive des cartes de l'écran Theme Builder n'a pas pu être relue (page `help/theme-builder/` vide) : [PARTIEL]. Loop item : voir 2.5. Produit/boutique avec WooCommerce : l'article de conditions cite une catégorie « WooCommerce » : [PARTIEL].
- Création d'un en-tête : WP Admin > Elementor > Theme Builder, « + » sur la carte Header, bibliothèque de modèles facultative ; à la publication, on choisit où il s'affiche ; « Edit Conditions » pour modifier ; réglage de balise HTML (`header`) pour l'accessibilité ; export/suppression/renommage dans le menu à trois points. [CONFIRMÉ] https://elementor.com/help/header-site-part/ . Collant (sticky) et aperçu : non traités par l'article : [PARTIEL].
- Conditions d'affichage : « Include / Exclude » à gauche, cible à droite ; « Entire Site » ; trois familles (Singular, Archives, WooCommerce) ; plusieurs conditions par modèle ; un avertissement s'affiche si deux parties de site entrent en conflit ; accès par la flèche près de Publier > Display Conditions. [CONFIRMÉ] https://elementor.com/help/conditions/ ; combinaison de plusieurs conditions incluses/exclues aussi confirmée par https://developers.elementor.com/docs/theme-conditions/ (qui cite aussi les popups et le code personnalisé comme usages).
- **Priorité / spécificité** entre modèles concurrents : les pages lues ne la décrivent pas ; seul l'avertissement de conflit est confirmé. [HYPOTHÈSE] qu'une règle plus spécifique l'emporte sur « Entire Site » ; à ne pas attribuer à Elementor sans vérification.
- Développeurs : conditions enregistrables par code ; notions de structure, groupe, données, vérification, sous-conditions listées mais non détaillées dans la page lue. [PARTIEL] https://developers.elementor.com/docs/theme-conditions/
- Aperçu avec contenu dynamique : icône d'engrenage en bas à gauche > Preview Settings ; on choisit un contenu existant pour remplir les widgets dynamiques pendant la conception ; pour les résultats de recherche, saisie d'un terme (et test d'un terme sans résultat), bouton « Apply & Preview ». [CONFIRMÉ] https://elementor.com/help/customize-the-search-results-archive/ ; généralisation à tous les types [PARTIEL] (extrait de recherche).
- Contenu dynamique : l'extrait de recherche indique qu'il nécessite Elementor Pro (https://elementor.com/help/dynamic-content/) : [PARTIEL].
- Publication : bouton Publish puis Save & Close ; la condition « Include + Search Results » est requise pour le modèle de recherche. [CONFIRMÉ] idem.
- États d'erreur et cas limites : conflit de conditions (avertissement) ; recherche sans résultat à prévisualiser ; un type de modèle incompatible avec le contenu n'affiche pas les éléments (cas des produits dans un modèle d'articles, côté boucles). [CONFIRMÉ] https://elementor.com/help/loop-grid/ (partiel).
- Permissions : [PARTIEL] ; voir `elementor-reference/` (« user-roles-and-classes » relevé pour les classes V4). Rien de vérifié sur les rôles du Theme Builder.

### 2.4 Bibliothèque de modèles, kits, import/export
- Export « Modèles de site » : Elementor > Éditeur > Accueil > Outils > Modèles de site > Exporter. On nomme, on choisit : Contenu (pages, articles, types personnalisés, menus, taxonomies, médias), Modèles (en-têtes, pieds, modèles Theme Builder, widgets globaux), Réglages (couleurs/polices globales, style du thème, mise en page, lightbox, arrière-plans, expériences actives) ; fichiers personnalisés, code personnalisé et export de thèmes réservés aux forfaits Pro et plus ; extensions : toutes à sélectionner pour réussir ; sortie ZIP ou bibliothèque cloud. [CONFIRMÉ] https://elementor.com/help/import-and-export-elementor-website-templates/
- Import : sauvegarde recommandée ; ZIP ou bibliothèque cloud (forfait Advanced ou plus) ; on choisit modèles / contenu / réglages (import complet = les trois) ; confirmation spéciale pour l'import SVG. [CONFIRMÉ] idem.
- Limites : options selon le forfait ; options de contenu granulaires selon le forfait Expert ; « médias dans le cloud » interdit l'export ZIP. [CONFIRMÉ] idem.
- Le **JSON** n'est pas mentionné dans cet article (ZIP et cloud seulement) ; l'export JSON de modèles individuels existe-t-il : [HYPOTHÈSE] ici, voir `elementor-reference/12-cms-integrations.md`. « Template Kits » (marché) : non consulté.

### 2.5 Boucles (Loop)
- Loop Grid : on crée un modèle d'élément (loop item) qui définit l'affichage de chaque entrée ; colonnes, éléments par page, masonry, hauteur égale, modèle alternatif ; requête (source, inclure/exclure, tri, filtre par date ou profondeur de catégorie, ignorer les épinglés). [CONFIRMÉ] https://elementor.com/help/loop-grid/ (partiel). Associé à des forfaits payants selon l'article.

### 2.6 Limites générales Elementor à retenir
- Une partie notable (Theme Builder, contenu dynamique, certains exports) est présentée comme payante dans les pages lues ; les périmètres exacts par forfait ne sont pas vérifiés ici : [PARTIEL].

## 3. WORDPRESS

### 3.1 Hiérarchie des modèles
- Principe : WordPress détermine le type de requête, parcourt une liste du plus spécifique au plus général, prend le premier fichier existant, sinon `index.php` (seul fichier obligatoire) ; un thème enfant remplace les fichiers du parent de même nom. [CONFIRMÉ] https://developer.wordpress.org/themes/basics/template-hierarchy/
- Accueil : `front-page`, puis `home` (derniers articles) ou `page` (page statique), puis `index`. Article : `single-{type}-{slug}`, `single-{type}`, `single`, `singular`, `index`. Page : modèle choisi, `page-{slug}`, `page-{id}`, `page`, `singular`, `index`. Catégorie : `category-{slug}`, `category-{id}`, `category`, `archive`, `index`. Type personnalisé : `archive-{type}`, `archive`, `index`. Recherche : `search`, `index`. 404 : `404`, `index`. [CONFIRMÉ] idem.
- Équivalent côté blocs : modèles de base Front Page, Blog Home, All Archives (repli des archives), Pages, Single Posts, Index (repli général), 404, Search. [CONFIRMÉ] https://wordpress.org/documentation/article/template-editor/

### 3.2 Thèmes classiques vs thèmes de blocs
- Thème de blocs : entièrement construit en blocs ; templates `.html` ; `theme.json` pour réglages et styles globaux ; styles pilotés par `theme.json` et modifiables dans l'éditeur (variations) ; modifiable et exportable depuis l'éditeur de site. Thème classique : templates `.php`, Customizer, peu de conventions communes. « Hybride » = thème classique qui adopte certaines fonctions de blocs ; ce n'est pas un type officiel. [CONFIRMÉ] https://developer.wordpress.org/themes/block-themes/
- `theme.json` : « pièce fondatrice » du thème de blocs, non strictement obligatoire ; couleurs, typographie par défaut, styles côté public. [CONFIRMÉ] https://developer.wordpress.org/themes/global-settings-and-styles/ . Cascade des niveaux (cœur, thème, enfant, utilisateur) et schéma : [PARTIEL] non lus.
- Emplacement exact des fichiers `templates/` et `parts/` et stockage en base des modifications d'utilisateur : [HYPOTHÈSE] ici (pages détaillées en 404). Fait confirmé : les changements de l'éditeur « prennent le pas » sur les fichiers du thème, et la fonction « réinitialiser » rétablit l'état d'origine (https://wordpress.org/documentation/article/template-editor/).

### 3.3 Site Editor et Template Editor
- Disponibilité : Site Editor seulement avec un thème de blocs (Apparence > Éditeur). Éditeur de modèles aussi disponible avec un thème classique qui l'active. [CONFIRMÉ] https://wordpress.org/documentation/article/site-editor/ et template-editor.
- Écrans : Identité, Styles, Pages, Navigation, Patterns (motifs synchronisés et parties de modèle), Templates. [CONFIRMÉ] site-editor.
- Barre d'outils : insertion, annuler/rétablir, vue en liste, palette de commandes, **Aperçu** (avec enregistrement de styles responsifs pour un format d'écran), réglages, Styles, **Enregistrer** (liste tout ce qui a changé : motifs, menus, modèles, parties ; on peut enregistrer tout ou une partie ; modifier en-tête/pied touche toutes les pages qui l'utilisent). Mode code, export du thème en ZIP, zoom arrière. [CONFIRMÉ] site-editor.
- Gestion des modèles : créer (Front Page, Pages, archives d'auteur, de catégorie, de date, d'étiquette, « Single item: Post », modèle personnalisé), partir d'un motif ou de zéro ; modèle par catégorie précise ou « toutes les catégories » (repli) ; un modèle personnalisé n'est assigné à rien tant qu'on ne l'affecte pas à une page/article, et le changement ne touche que cette page ; renommer/supprimer seulement ses propres modèles personnalisés ; réinitialiser un modèle modifié du thème. [CONFIRMÉ] template-editor.
- Parties de modèle : bloc de zones répétées (en-tête, pied, barre latérale), réutilisables dans les modèles, gérées sous Patterns. [CONFIRMÉ] site-editor.
- Styles globaux : variations de style du thème, palettes, typographie, mise en page, apparence par bloc pour tout le site ; révisions de styles et réinitialisation via le menu à trois points ; « appliquer globalement » un style de bloc à tous les blocs du même type (depuis 6.2). [CONFIRMÉ] site-editor.
- Limites : `page` dédiée à la liste exhaustive des types de modèles proposés « selon le thème » ; certaines options (modèle personnalisé) dépendent du thème. [CONFIRMÉ] template-editor.

### 3.4 Révisions, brouillons, aperçu
- Une révision est enregistrée à chaque brouillon sauvegardé ou mise à jour publiée ; écran de révisions avec curseur, indicateurs de couleur (ajout/suppression/modification), restauration ; ancien écran avec comparaison de deux révisions. Autosave : au plus une par utilisateur et par contenu, ne remplace pas le contenu publié, avertissement de récupération à la réouverture. Stockage dans la table des articles (type `revision`, statut `inherit`, enfant du contenu). Limite réglable (`WP_POST_REVISIONS`, par défaut illimité). Pas d'interface de suppression. [CONFIRMÉ] https://wordpress.org/documentation/article/revisions/
- Révisions des modèles de blocs en tant que telles : [HYPOTHÈSE] (non lu) ; seules les révisions de styles globaux sont confirmées (site-editor).

### 3.5 Multisite
- Plusieurs sites dans une installation, nécessite la réécriture d'URL ; réseau par chemins (sous-répertoires) ou par domaines/sous-domaines ; tables propres à chaque site, table des utilisateurs partagée ; thèmes et extensions partageables. [CONFIRMÉ] https://developer.wordpress.org/advanced-administration/multisite/ . Association de domaines, détail du Super Admin et gestion réseau des thèmes : non détaillés par cette page : [PARTIEL].

### 3.6 Rôles et capacités
- Rôles : Super Admin (multisite), Administrator, Editor, Author, Contributor, Subscriber ; un Editor publie et gère les articles, dont ceux des autres ; le Super Admin possède les capacités réseau (`manage_network`, `manage_network_users`, `manage_network_themes`, `manage_network_plugins`, `manage_network_options`), que les autres rôles n'ont pas dans la table lue. Capacités liées aux thèmes : `switch_themes`, `edit_themes`, `edit_theme_options`, `install_themes` ; `unfiltered_html` (contrôle l'HTML non filtré). [CONFIRMÉ] https://wordpress.org/documentation/article/roles-and-capabilities/ (sommaire et table ; descriptions fines de chaque capacité : [PARTIEL]).
- Quel rôle peut ouvrir le Site Editor : [HYPOTHÈSE] (lié à `edit_theme_options`, non vérifié dans la page lue).

### 3.7 Extensions
- Extensions partageables en multisite (voir 3.5). Écosystème d'extensions en général : non étudié ici.

## 4. WOOCOMMERCE (séparation modèle visuel / fonction transactionnelle)

- Avec un thème de blocs, les modèles WooCommerce se modifient dans Apparence > Éditeur > Templates, section WooCommerce : produit unique, catalogue, archives (catégorie, étiquette, attribut, marque), résultats de recherche produit, bientôt disponible, confirmation de commande, panier, paiement. [PARTIEL] extraits de recherche de https://woocommerce.com/document/woocommerce-store-editing/templates/ et https://developer.woocommerce.com/2023/07/07/woocommerce-blocks-10-6-0-release-notes/ (panier/paiement/confirmation ajoutés aux modèles de l'éditeur en 10.6.0).
- Avec un thème classique, pas d'éditeur de site pour ces modèles ; les blocs restent utilisables dans pages et articles. [PARTIEL] idem.
- Séparation observée : la disposition (modèle, blocs) est modifiable ; le contenu dynamique d'un produit se modifie sur le produit lui-même ; un modèle personnalisé peut cibler un produit précis. La logique de paiement, de panier et de commande reste portée par les blocs/extension, pas par le modèle. [PARTIEL] (première partie confirmée par extrait ; la dernière phrase est une interprétation : [HYPOTHÈSE]).
- Compte client (« Mon compte ») : aucun résultat ne dit s'il est éditable dans l'éditeur de site : non vérifié. Documentation de thème de blocs WooCommerce (URL 404) : inaccessible.

## 5. Tableau de synthèse

| Sujet | Elementor | WordPress |
|---|---|---|
| Unité de gabarit | modèle Theme Builder avec conditions | modèle (fichier ou en base) choisi par hiérarchie fixe |
| Sélection | conditions include/exclude, avertissement de conflit | hiérarchie du plus spécifique au plus général, repli `index` |
| Parties globales | en-tête, pied (locations) | parties de modèle |
| Styles globaux | kit : couleurs, polices, Theme Style | `theme.json` + Styles de l'éditeur |
| Aperçu | Preview Settings (contenu réel) | Aperçu + vue du modèle dans l'éditeur |
| Historique | actions + révisions | révisions + autosave + révisions de styles |
| Transfert | export/import ZIP (réglages, modèles, contenu) | export du thème en ZIP |

## 6. CHOIX DE CONCEPTION PROPOSÉS POUR KOLAKISA

*(Propositions de l'équipe, non attribuées à Elementor ni à WordPress. Elles s'appuient sur l'existant décrit en section 0.)*

1. **Séparer trois couches** : (a) gabarit visuel (modèle), (b) règle d'affectation (conditions), (c) fonction transactionnelle (paiement, panier, compte), qui reste un module Kolakisa que le modèle ne fait qu'habiller. Inspiré de la séparation observée pour WooCommerce, mais décision propre à Kolakisa.
2. **Règle de résolution déterministe et affichable** : ordre unique documenté (le plus spécifique d'abord : élément précis > taxonomie > type > « tout le site » ; à égalité, priorité numérique puis ancienneté), identique pour toutes les familles, avec l'écran « Pourquoi ce modèle ? » déjà présent. Comme la priorité Elementor n'est pas documentée dans les pages lues, la règle est entièrement la nôtre.
3. **Conditions include/exclude** avec détection de conflit à l'enregistrement (avertissement bloquant seulement si deux modèles actifs ont exactement la même portée et priorité).
4. **Repli garanti** : si aucun modèle ne convient, rendu d'origine ; un modèle absent ou en brouillon ne casse jamais une page (comme le fonctionnement actuel).
5. **Brouillon, aperçu privé, publication** pour tout modèle et partie globale, avec révisions (version et auteur), restauration et une seule « sauvegarde automatique » par utilisateur et par élément, sans écraser le publié.
6. **Aperçu avec contenu réel** : sélecteur « prévisualiser avec cet article/cette catégorie/ce terme de recherche » et cas « aucun résultat » proposé par défaut pour les archives et la recherche.
7. **Styles globaux par site** (couleurs, polices, largeurs, espacements, style des éléments de base) hérités par les modèles, surchargeables au niveau d'un bloc ; une seule source par site pour éviter la dérive visuelle entre sites d'un même réseau.
8. **Multi-sites** : modèles et parties globales avec portée « site » ou « réseau » ; un site peut surcharger un modèle de réseau (copie liée avec retour à l'original, comme la réinitialisation des modèles de thème WordPress) ; affectation toujours résolue dans le site courant (site_id), jamais par domaine seul.
9. **Import/export** d'un « kit de site » en un seul fichier signé et versionné, avec choix modèles / réglages / contenu, aperçu de ce qui sera écrasé, et sauvegarde automatique avant import. Pas de promesse de compatibilité avec les kits Elementor.
10. **Permissions** : séparer « modifier le contenu », « modifier les modèles/parties globales » et « modifier les styles globaux / HTML libre » ; le droit d'HTML non filtré reste réservé aux rôles élevés (par analogie avec `unfiltered_html`, sans copier le modèle de rôles WordPress).
11. **États d'erreur explicites** : condition vers une cible supprimée, modèle d'un type incompatible avec le contenu, limite d'affectations atteinte, import partiel ; message en français avec action proposée.
12. **Types à ajouter après les 9 familles actuelles**, par ordre : modèle commun de page (après conception d'un bloc « contenu de la page »), élément de boucle, recherche globale (quand le moteur existe). Pop-up, connexion, panier restent hors périmètre du Programme 20.1 tant que le moteur transactionnel n'est pas séparé.
13. **Responsive** : points de rupture définis au niveau du site, héritage du grand écran vers le petit, aperçu par appareil dans l'éditeur de modèle.

## 7. Questions ouvertes à vérifier avant décision

- Priorité exacte entre conditions Elementor (non documentée dans les pages lues).
- Format réel d'export d'un modèle seul (JSON ?) et contenu des « Template Kits » du marché.
- Stockage et révisions des modèles de blocs WordPress (pages détaillées en 404).
- Cascade `theme.json` (cœur / thème / enfant / utilisateur).
- Éditabilité du modèle « Mon compte » WooCommerce.
