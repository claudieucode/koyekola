# Programme 20.1 — Architecture : actuelle, cible, contrats

Fondée sur `KOLAKISA_PROGRAMME20_1_AUDIT.md` (état réel du code au commit `b27d7c25`). **Conception uniquement : rien n'est développé.** Les affirmations sur le code citent l'audit ; les propositions sont marquées « PROPOSITION ».

## 1. Principe directeur
Le Site Builder, le Theme Builder et le Template Studio ne sont **pas** trois nouveaux produits : ce sont trois **couches d'orchestration et de gestion** posées sur ce qui existe déjà et fonctionne — un seul éditeur (`public/js/page-builder.js`), un seul rendu (gabarit `marketing-public/landing` + même viewModel pour page publique, aperçu et canevas), une seule publication (brouillon → `preflight` → publication, révisions, 409), un seul contexte d'administration par site (`siteContext`). Interdits : second éditeur, second moteur de rendu, second système de publication, second système de modèles.

## 2. Architecture actuelle (réelle)
| Couche | Existant vérifié | Remarque |
|---|---|---|
| Sites | `mk_sites` ; site principal = `site_id NULL` ; contexte d'administration par site recalculé à chaque requête (`siteContext.resolve`, `/site-web/sites/<id>/…`) ; équipe + `mk_site_members` (mode « plafond ») ; `mk_site_modules` (6 modules) ; `mk_site_domains` (registre, vérification TXT) ; création = 1 ligne sans page ; duplication ; archivage/corbeille | Création d'un site **vierge uniquement** côté serveur ; 5 packs de site existent (`pages/sitePacks.js`) |
| Pages | `mk_landing_pages` (contenu en ligne + brouillon JSON + `revision`), `mk_page_versions` + `cms_revisions`, aperçu connecté, publication avec `preflight`, `mk_page_templates` (« Mes modèles ») | `slug` UNIQUE globalement, noms uniques par organisation (voir risque R1) |
| Éditeur | un éditeur (8 644 lignes + 10 modules), canevas en iframe rendu serveur, 94 types d'éléments (67 intégrés + 27 déclaratifs), 16 types de sections, limites 30/400/8, historique 150, autosave 1 s, responsive 4 modes | Une page à la fois |
| Rendu | EJS partagé ; pas de cache HTML de sortie ; en-tête/pied d'un site = composants globaux, **site principal = autre système** (`appearance`) | Deux formats dans une page (sections plates + arbres de nœuds) |
| Thèmes | 160 thèmes = paquets JSON de **jetons** (sans en-tête/pied/modèle) ; identité par site déjà présente (jetons, polices, personnalisateur 107 réglages) ; thème actif par site (`cms_themes`) | Deux stockages du même schéma : `mk_sites.tokens` (sites) vs `appearance_configs` (principal) |
| Theme Builder | en-tête/pied par site (composants), variantes d'en-tête par page, composants globaux (brouillon, aperçu privé, « Mettre à jour » avec révision) ; **modèles à conditions** : `pages/themeTemplates.js` (9 familles, conditions catégorie/étiquette/article/public, score déterministe + `explain()`), rendu `web/themeRender.js` | Modèles de thème = **réglage d'organisation** (`mk_settings`), pas par site |
| Bibliothèque | 5 packs de site, ≈20 gabarits de pages, patterns, `kolakisa-page@1` (import = brouillons, transaction, idempotence), `kolakisa-site-bundle@1` (pages, menus, redirections, réglages + médias) | **5 stockages** de « morceau réutilisable » (composants, patterns, reusableBlocks, `mk_page_templates`, blocs d'e-mail) |
| Commerce | Stripe Checkout réel (formations), commande idempotente, tunnels order/upsell/downsell | **Pas** de produit générique ; `orders`/`offers`/`coupons`/`enrollments` sans `site_id` : boutique unique (site principal) |
| Sécurité | permissions par rôle (`organizations.js`), `routeScopes.js` classe chaque route, isolation vérifiée au Palier 17 | **Aucune** permission dédiée « créer un site / gérer thèmes / importer un modèle » : tout passe par `forms.write` |

## 3. Architecture cible (PROPOSITION)
```
        ┌───────────────────────────── SITE BUILDER (orchestration) ─────────────────────────────┐
        │  Tableau de bord « Mes sites » (existant, étendu) · Assistant de création (nouveau)    │
        │  État de préparation du site (checklist calculée) · Publication du site                │
        └───────┬───────────────────────────┬─────────────────────────────┬──────────────────────┘
                │                           │                             │
        THEME BUILDER                 TEMPLATE STUDIO               SERVICES EXISTANTS (inchangés)
   (modèles + conditions,        (catalogue unifié, formats,       pages · composants · rendu · éditeur
    par SITE)                     import/export, aperçu)           révisions · domaines · modules · permissions
                │                           │
                └──────────► moteur de rendu EXISTANT (themeRender, landing, composants) ◄────────┘
```

### 3.1 Site Builder
- **Réutilise** : `sites.ejs`/espace de site, `createSite`, `duplicateSite`, `siteDomains`, `siteModules`, `siteUsers`, éditeur, aperçu, publication de pages (`publishPages`), `siteBundle`.
- **Ajoute** (PROPOSITION) : un **assistant de création** (service `siteWizard`) qui enchaîne des appels aux services existants dans une transaction : `createSite` → application d'un **kit** (pack de site ou futur « kit Template Studio ») → application de l'identité (jetons) → activation de modules → pages en **brouillon** ; et une **checklist de publication** calculée (pages publiées, en-tête/pied présents, domaine vérifié, SEO minimal, `preflight` de chaque page) — lecture seule, aucune donnée nouvelle.
- **N'ajoute pas** : de second tableau de bord, de second état de site. Le statut d'un site reste `active/archived/deleted` (+ « préparation » **calculée**, pas stockée, en 20.2 ; stockée seulement si 20.6 le justifie).

### 3.2 Theme Builder
- **Étend** `pages/themeTemplates.js` (déjà : familles, conditions, score, `explain()`), pas de moteur parallèle.
- Changements proposés, par ordre de risque croissant : (1) **portée par site** des modèles de thème (aujourd'hui réglage d'organisation `mk_settings` clé `theme.templates`) : stocker par site avec repli sur l'organisation — migration additive + lecture compatible ; (2) **conditions** : exclusion et combinaisons ET/OU, priorité explicite, « modèle par défaut », rapport de conflits via `explain()` ; (3) **nouvelles familles** : page individuelle commune (`static_page` existe côté liste ; à confirmer en 20.3), 404 (existe : `not_found`), recherche (existe : `search_results`), archives de types personnalisés (si types de contenu), **produit/catalogue** (voir 3.5, dépend du commerce) ; (4) **aperçu avec données réelles** : choisir un contenu réel du site dans l'éditeur de modèle (le rendu existant est réutilisé).
- **Convergence en-tête/pied** : le site principal utilise `appearance`, les autres des composants : 20.3 doit **choisir** une source de vérité (PROPOSITION : composants globaux, avec adaptateur de lecture pour le principal) avant d'ajouter des types de modèles.

### 3.3 Template Studio
- **Catalogue unifié en lecture** (service `templateCatalog`, PROPOSITION) : une vue **sans migration de données** qui agrège les 5 stockages existants avec une forme commune `{ kind, scope(site|org|platform), name, category, tags, version, requires{modules,widgets,formatVersion}, preview, source }`. Chaque entrée reste stockée là où elle est ; le catalogue sait la lister, la prévisualiser et l'insérer. Les doublons de concept sont documentés, pas fusionnés en 20.4.
- **Format de modèle** (PROPOSITION) : enveloppe `kolakisa-template@1` = métadonnées + **charge utile native** (sections/nœuds exactement comme stockés par le Page Builder, c'est-à-dire le contenu de `kolakisa-page@1`) ; les kits de site réutilisent `kolakisa-site-bundle@1` (pages, menus, redirections, réglages, médias) **étendu** d'un bloc thème (jetons) et d'un bloc modèles/composants. Aucune conversion manuelle de widget : la charge utile **est** le format de l'éditeur.
- **Import** : mêmes garde-fous que l'import de page existant — validation stricte (`normalizeSection`, listes blanches, bornes 30/400/8, HTML assaini, CSS validé, URL de médias réécrites), exécution dans une transaction avec jeton d'idempotence, **création en brouillon**, jamais d'écrasement, contrôle de compatibilité (`requires`) avant écriture, rapport d'erreurs lisible. Permissions : nouvelle permission dédiée (§5).
- **Versions et variantes** : une entrée de catalogue porte un numéro de version ; variante = entrée liée (`variantOf`). Aucun historique de composants n'existe aujourd'hui : à ajouter **avant** d'annoncer des versions de composants.

### 3.4 Modèle de rendu
Aucun nouveau moteur. Tout contenu (page, modèle de thème, composant, kit) est rendu par le gabarit et le viewModel existants. Le canevas de l'éditeur de modèles utilise le rendu serveur existant (`POST /rendu`) avec un contenu d'aperçu réel.

### 3.5 E-commerce (dépendance, pas une livraison)
Le commerce actuel vend des **formations** ; il n'y a ni produit générique, ni stock, ni variantes, ni TVA, ni achat invité, ni isolation par site. Conséquences de conception : les modèles « produit / catalogue / panier / paiement / compte » restent **des habillages visuels** tant que les services transactionnels correspondants n'existent pas. En 20.5 : (a) habiller ce qui existe (catalogue et page de formation, panier, commande, confirmation, compte) avec des modèles ; (b) **décision à prendre par le propriétaire** avant 20.5 : commerce par site (ajouter `site_id` aux tables de commande — migration lourde) ou boutique unique du site principal (modèles de vente limités au site principal) ; (c) produits génériques = chantier distinct, hors Programme 20.

## 4. Modèles de données envisagés (aucune migration créée)
| Entité | Responsabilité | Propriétaire / portée | Contraintes clés | Permissions | Risque de migration |
|---|---|---|---|---|---|
| `mk_sites` (existant) | identité d'un site, statut | organisation | slug unique | `sites.*` (à créer) | faible : colonnes additives (ex. kit d'origine) |
| `mk_theme_templates` (nouveau, **ou** clé `theme.templates` par site dans `mk_settings`) | modèles structurels à conditions | **site** (NULL = principal) | index unique `COALESCE(site_id,0)` + nom ; JSON borné | `themes.manage` | moyen : lecture avec repli sur l'ancien réglage d'organisation, copie paresseuse ; ne rien supprimer |
| `mk_template_catalog` (nouveau, **optionnel**) | métadonnées des entrées du catalogue (version, catégorie, tags, source, plateforme/site) | plateforme (kits fournis) ou site | clé `(source, source_id)` | `templates.manage` / `templates.import` | faible si purement additif ; **peut être évité** en 20.4 (catalogue calculé) |
| `mk_landing_pages` (existant) | pages | site | **slug UNIQUE global** et noms uniques par organisation → à corriger (R1) | existantes | **élevé** : reconstruction de table ; la procédure « R6 lot 5 » existe (manuelle) |
| `mk_web_components` (existant) | en-têtes/pieds/composants | site ou global | noms uniques par organisation ; **pas d'historique** | `appearance.parts` | moyen : ajouter une table de versions |
| Styles globaux | jetons du site | site | schéma unique, deux stockages | `appearance.styles` | moyen : adaptateur de lecture plutôt que migration |
| `mk_site_domains` (existant) | domaines | site | hôte vérifié unique | `sites.domains` | aucun |

Règle : **extension avant création**, colonnes `NULL` = principal, index uniques `COALESCE(site_id,0)`, migrations additives numérotées à partir du **dernier numéro réel de `origin/main` au moment de l'écriture** (114 au commit audité ; des sessions parallèles peuvent en ajouter — vérifier avant chaque migration).

## 5. Permissions (PROPOSITION)
Ajouter à `PERMISSIONS` (`src/marketing/organizations.js`), rôle minimal proposé : `sites.create` (admin, équipe seulement, refusée aux accès limités à un site), `sites.publish` (éditeur, ou réutiliser `pages.publish`), `themes.manage` (admin), `templates.use` (éditeur), `templates.manage` (admin), `templates.import` (admin). Les routes sont déclarées dans `routeScopes.js` (un test échoue si une route montée n'est pas classée). Tout identifiant de site vient du serveur (`siteContext`), jamais du corps de requête.

## 6. Contrats entre services (anti-circularité)
- `siteWizard` → appelle `pages.createSite`, `sitePacks.apply`, `themes.apply`, `siteModules.set`, `siteDomains.*` ; **n'est appelé par aucun** de ces services.
- `templateCatalog` → lit `pages/sitePacks`, `mk_page_templates`, `patternLibrary`, `reusableBlocks`, composants ; expose `list / get / preview / instantiate(ctx, entry, target)` ; `instantiate` délègue à `importPage`/`createComponent`/`applyPack` (jamais d'écriture directe).
- `themeTemplates` (Theme Builder) → dépend de `themeRender` et du viewModel ; **ne dépend pas** du catalogue.
- Sens des dépendances : Site Builder → {Theme Builder, Template Studio} → services de contenu existants → base. Aucune flèche inverse.
- Toute écriture passe par un service qui reçoit `ctx` (organisation, site, permissions) et vérifie `inScope`/`assertSiteScope` (défense en profondeur, cf. Palier 17).

## 7. Isolation multi-sites (exigences non négociables)
Chaque nouvelle ressource a un propriétaire (`site_id` ou plateforme) ; lecture/écriture/duplication/import/export vérifient le site côté **serveur** ; une entrée de catalogue « plateforme » est en lecture seule pour un site ; l'import écrit uniquement dans le site cible validé ; un test d'isolation par entité (accès croisé A→B) est un critère d'acceptation de chaque phase ; les 5 constats du Palier 17 à ne pas reproduire : portée vérifiée dans le service et pas seulement dans la route, message identique « introuvable » pour hors-périmètre, permission dédiée par action sensible, pas de liste non filtrée par site (cf. P2 de l'audit), pas de nom unique global qui fuit l'existence.

## 8. Stratégie de rendu et de publication
Publication d'un site = publication de ses pages par le mécanisme existant (`publishPages`, `preflight`) précédée de la **checklist**. Publication d'un modèle de thème : brouillon → aperçu privé → « Mettre à jour » avec révision (modèle des composants existant), jamais diffusion directe. Pas de cache HTML aujourd'hui : en introduire un n'est pas prévu avant l'audit de performance 20.7.

## 9. Risques architecturaux (voir aussi GAP_ANALYSIS)
R1 unicité globale des slugs/noms (bloquant pour les kits qui créent `/contact`, `Accueil`) ; R2 deux systèmes d'en-tête/pied ; R3 deux stockages des styles ; R4 commerce non isolé par site ; R5 cinq stockages de morceaux réutilisables (confusion de produit) ; R6 modèles de thème au niveau organisation ; R7 numéros de migration en collision entre sessions parallèles ; R8 deux formats de contenu dans une page ; R9 documents obsolètes (comptes de widgets, lignes de code) → toute décision doit s'appuyer sur le code.
