# KOLAKISA — Programme 20.4 : bibliothèque professionnelle de modèles, implémentation

*Branche `programme20-4`, issue de `origin/main` (bd794900) puis fusionnée avec `origin/main` 01247a32 (Programmes 20.3, 20.5, palier 19). 2026-10-30. Statut final : voir la fin du document.*

## 1. Audit préalable (état réel, vérifié)

### 1.1 Programmes 20.1, 20.2, 20.3
| Programme | État réel constaté | Conséquence |
|---|---|---|
| 20.1 | **Aucun document « Programme 20.1 »** dans le dépôt (le Programme 20.2 le constatait déjà). Les socles équivalents existent : `KOLAKISA_CORE_*`, `KOLAKISA_COMPONENTS_*`, `KOLAKISA_ADMIN_MULTISITE.md`. | Rien à fusionner ; les systèmes réels ont été audités directement dans le code. |
| 20.2 (Site Builder) | Branche `origin/feat/programme-20-2-site-builder` (`1dc4a813`), **non fusionnée dans `main`**, avec 10 tests hérités en échec (registre de menu des sites, voir ses `REMAINING_ISSUES`). | 20.4 s'appuie sur `main`, comme 20.3 : création d'un site = écran « Mes sites » existant ; la bibliothèque importe dans un site existant. |
| 20.3 (Theme Builder) | **Sur `main`** (`06f6a2b4`) : modèles de thème avec exclusions, modification, conflits signalés ; statut « validé avec réserves » (affectations par organisation, pas par site : D2). | Les modèles de thème de la bibliothèque s'appuient dessus (`themeTemplates.add`) ; la limite D2 est reprise et signalée à l'écran. Ses tests (`theme-builder-regles`, `theme-builder-routes-20-3`) sont rejoués dans la suite de 20.4. |

### 1.2 Ce qui existait déjà (réutilisé, rien reconstruit)
| Besoin | Existant | Décision |
|---|---|---|
| Écran « Apparence → Templates », 5 packs de site, 23 gabarits de pages, « Mes modèles », aperçu réel, importation transactionnelle idempotente, journal | `services/templateLibrary.js`, `web/templatesLibrary.js`, `pages/sitePacks.js`, `pages/templates.js`, `mk_page_templates`, `cms_template_imports` | **Étendu**, pas remplacé |
| Sections réutilisables : catalogue, enregistrement depuis une page, insertion dans un brouillon, corbeille | `services/patternLibrary.js`, `pages/patterns.js`, `appearance_patterns` | La bibliothèque de sections EST celle-ci : importer une section appelle `patternLibrary.insert` |
| Composants réutilisables (global / standard), en-tête et pied de page | `pages.createComponent`, `mk_web_components` | L'import d'un composant appelle `createComponent` |
| Modèles du Theme Builder | `pages/themeTemplates.js` | L'affectation appelle `themeTemplates.add` |
| Moteur de rendu, grammaire fermée des sections, registre des éléments, droits des éléments réservés | `pages/sections.js`, `pages/nodes.js` (`NODE_TYPES`, `lockedWidgetChanges`) | Source unique de la validation de compatibilité |
| Aperçu transitoire (jamais une page publiée) | `web/sectionPreview.js` | Réutilisé pour tous les types |
| Permissions, isolation par site, journal d'audit, transactions imbriquées | `organizations.js`, `siteTarget.js`, `routeScopes.js`, `audit.js`, `db/tx.js` | Réutilisés ; 2 droits ajoutés |

### 1.3 Fonctionnalités partielles ou absentes avant 20.4
Partielles : catalogue limité à 5 packs et 23 pages (aucun secteur), recherche par nom seulement côté navigateur, pas de tri, pas de pagination, pas de détail, importation limitée aux pages et aux packs. Absentes : sections / composants / modèles de thème dans la bibliothèque, taxonomie des secteurs, compatibilité des éléments, confirmation, annulation, métadonnées et versions des modèles enregistrés, partage entre sites, fichiers de modèle.

### 1.4 Risques d'importation identifiés (et traitement)
Éléments inconnus ou retirés (→ analyse bloquante, cause nommée), éléments réservés (HTML : `pages.code`), formulaires / composants d'un autre site, médias d'un autre site, ressources externes (→ confirmation), écriture partielle (→ une transaction), double soumission (→ jeton d'idempotence), écrasement de noms (→ numérotation), fuite entre sites (→ site vérifié par le serveur, tests d'isolation).

## 2. Ce qui a été développé

### 2.1 Catalogue officiel (contenu réel, sans image ni faux contenu)
**99 modèles officiels** : 12 sites complets (56 pages au total), 39 gabarits de page, 34 sections, 8 composants, 6 modèles du Theme Builder. Ajouts de 20.4 : 7 packs (agence digitale, portfolio créatif, restaurant, immobilier, blog et magazine, boutique de formations, association), 16 gabarits par secteur, 11 sections par secteur, 8 composants (2 en-têtes, 2 pieds de page, bandeaux, cartes, bloc de chiffre), 6 modèles du Theme Builder (article, liste du blog, archive de catégorie, page d'auteur, résultats de recherche, 404). Tous utilisent les éléments natifs du Page Builder ; tous les textes sont des consignes entre crochets (« [Prix réel] »).

### 2.2 Taxonomie administrable
Table `cms_template_sectors` (migration `117`) : 8 familles, 48 secteurs officiels (en lecture seule), secteurs personnalisés par organisation (droit `templates.categories`). Les modèles référencent des **clés**, jamais des libellés.

### 2.3 Services et routes
| Fichier | Rôle |
|---|---|
| `services/templateCatalog.js` | Entrées officielles et du site, structure réelle d'un modèle, **analyse de compatibilité**, requête (recherche, filtres, tri, pagination, facettes), détail |
| `services/templateLibrary.js` | Plan, importation (5 types), annulation, journal |
| `services/templateStore.js` | Enregistrer (page / sections / composant), modifier, partager, supprimer, fichiers de modèle, versions de format, secteurs |
| `web/templatesLibrary.js` | 17 routes sous `/marketing/site-web/templates/…` (voir `KOLAKISA_TEMPLATE_IMPORT_EXPORT.md`) |
| `pages/libraryMeta.js`, `libraryComponents.js`, `libraryParts.js` | Classement et contenu officiels |
| `views/marketing/apparence-templates.ejs`, `public/js/cms-templates.js`, `cms.css` | Écran |

### 2.4 Écran
Onglets (Sites complets, Pages, Sections, Composants, Thème, Mes modèles, Imports) avec compteurs réels ; recherche ; filtres secteur → spécialité, catégorie, type de site, compatibilité ; tri ; « Afficher plus » ; cartes (aperçu vivant du moteur, type, catégorie, secteurs, état de compatibilité) avec **Aperçu / Détails / Utiliser ce modèle** ; fenêtres de détail, d'aperçu (pages × appareils), d'import (opérations prévues, avertissements, confirmation), d'enregistrement, de modification, de secteurs ; états de chargement, d'erreur (« Réessayer »), vide ; clavier (flèches entre onglets, Échap, focus rendu).

## 3. Tests existants modifiés (et pourquoi)
| Test | Modification | Raison |
|---|---|---|
| `site-web-modeles.test.js` | Attend 39 gabarits (les 23 historiques inchangés et dans le même ordre) | Ajout volontaire de 16 gabarits |
| `apparence-templates.test.js` | La liste vient de `catalogue.json` au lieu du JSON embarqué ; la page embarque la 1re page de résultats | La liste est désormais servie par le serveur (pagination) ; mêmes assertions |
| `apparence-templates-navigateur.test.js` | 12 cartes par page au lieu de 5 ; recherche / filtres attendus après la réponse du serveur ; bouton « Utiliser ce modèle : X » au lieu de « Importer X » ; modèles retrouvés par la recherche | Pagination, recherche côté serveur, libellé demandé par le cahier des charges |
| `inventaire-tables-sites.json` | `cms_template_sectors` classée « plateforme » | Test d'inventaire des tables |

Aucune assertion n'a été supprimée ni assouplie pour faire disparaître un échec.

## 4. Bugs trouvés par les tests pendant le développement
Référence inconnue ou modèle d'un autre site → erreur 500 au lieu de 422 (corrigé) ; focus clavier perdu quand la barre d'onglets est reconstruite (corrigé) ; doublon de nom d'un modèle renvoyait 422 au lieu de 409 (corrigé) ; identifiant de composition renvoyé `undefined` (corrigé).

## 5. Statut
Voir `KOLAKISA_PROGRAMME20_4_TESTS.md` (preuves) et `KOLAKISA_PROGRAMME20_4_REMAINING_ISSUES.md` (réserves). Statut retenu : **VALIDÉ AVEC RÉSERVES**.
