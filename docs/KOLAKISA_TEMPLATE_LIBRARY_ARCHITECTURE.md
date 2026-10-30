# KOLAKISA — Bibliothèque de modèles : architecture

Principe : **un seul moteur**. Un modèle est une liste de vraies sections du Page Builder (grammaire fermée de `pages/sections.js` et registre `NODE_TYPES` de `pages/nodes.js`). La bibliothèque n'a ni moteur de rendu, ni format de document, ni éditeur propres : elle **classe, présente, contrôle et copie** vers les objets natifs du site.

## 1. Types de ressources et référence
Une référence texte `<préfixe>:<clé ou identifiant>` (validée par `^(pack|page|mine|section|pattern|component|comp|part):([a-z0-9-]{1,60}|\d{1,12})$`) identifie tout modèle.

| Type (`kind`) | Officiel (code livré) | Du site (base) | Ce que l'import crée |
|---|---|---|---|
| `site` — site complet | `pack:<clé>` (`pages/sitePacks.js`) | — | Pages en brouillon + menu + brouillon de styles (options) |
| `page` | `page:<clé>` (`pages/templates.js`) | `mine:<id>` (`mk_page_templates`) | Une page en brouillon |
| `section` | `section:<clé>` (`pages/patterns.js`) | `pattern:<id>` (`appearance_patterns`) | Sections ajoutées au brouillon d'une page choisie |
| `component` | `component:<clé>` (`pages/libraryComponents.js`) | `comp:<id>` (`mk_web_components`) | Un composant du site (jamais branché) |
| `part` — modèle du Theme Builder | `part:<clé>` (`pages/libraryParts.js`) | — | Une page en brouillon, affectation facultative |

## 2. Origines et visibilité
| Origine | Où | Qui voit | Qui modifie |
|---|---|---|---|
| `official` | Code livré (versionné avec le produit) | Tous les sites | **Personne** depuis l'application (aucune route d'écriture ne les accepte : refus « lecture seule ») |
| `site` | Base, `site_id` du créateur, `shared = 0` | Ce site seulement | Ce site (droit `forms.write`) |
| `organization` | `mk_page_templates.shared = 1` | Tous les sites de l'organisation | **Son site d'origine seulement** ; partager / retirer du partage demande `templates.share` (administrateur) |

Non réalisé : modèle « personnel » d'un utilisateur, visible de lui seul à travers ses sites (voir REMAINING_ISSUES).

## 3. Stockage
| Donnée | Table | Détail |
|---|---|---|
| Modèles de page du site | `mk_page_templates` (existante) | + colonnes de la migration 123 : `version`, `format_version`, `keywords`, `sectors` (JSON de clés), `language`, `site_type`, `updated_by` ; `shared` = visibilité ; `created_by` = auteur ; `site_id` = site d'origine ; `updated_at` = date |
| Compositions du site | `appearance_patterns` (existante, corbeille) | inchangée |
| Composants | `mk_web_components` (existante) | inchangée |
| Secteurs | `cms_template_sectors` (nouvelle) | `organization_id` NULL = officiel ; unicité `(COALESCE(organization_id,0), slug)` |
| Journal des imports | `cms_template_imports` (existante) | + `undone_at`, `undone_by` |
| Affectations de thème | `mk_settings` `theme.templates` (existante, 20.3) | inchangée |

Migration `123_bibliotheque_modeles.sql` : **additive** (colonnes avec valeur par défaut, une table, 48 lignes de départ). Annulation : `DROP TABLE cms_template_sectors` ; les colonnes ajoutées sont ignorées par l'ancien code.

## 4. Taxonomie (administrable, non codée en dur)
8 familles et 48 secteurs officiels dans `cms_template_sectors` (Entreprises et services, Création et communication, Commerce, Éducation et formation, Santé et bien-être, Médias et contenus, Restauration et hôtellerie, Organisations et communautés — exactement la liste du cahier des charges). Une organisation ajoute ses secteurs (famille existante ou nouvelle), les désactive ou les retire s'ils ne classent aucun modèle. Les secteurs d'une organisation ne sont jamais visibles d'une autre. Le catalogue officiel référence des **clés** (`pages/libraryMeta.js`) ; un test vérifie que chaque clé existe dans la table. La 2e dimension, `category`, reste un libellé fonctionnel libre (« Vente », « Contact »…), et `siteType` réutilise `SITE_TYPES` du moteur.

## 5. Couches
```
écran (cms-templates.js) ──► routes (web/templatesLibrary.js : droits, site vérifié, JSON)
                                ├─ templateCatalog  : entrées, structure, analyse, requête, détail      (lecture)
                                ├─ templateLibrary  : plan, import, annulation, journal                  (écriture transactionnelle)
                                └─ templateStore    : enregistrer, modifier, partager, fichiers, secteurs (écriture)
                                        └─ pages / patternLibrary / navigation / customizer / themeTemplates (objets natifs)
```
Le site visé (`siteId` : entier ou `null` = principal) vient de `siteTarget` (adresse vérifiée par le serveur) ; il est passé à chaque fonction ; aucune requête n'utilise un identifiant de site venu du corps.

## 6. Recherche, filtres, tri, pagination (côté serveur)
`GET …/catalogue.json` : `q`, `source`, `kind`, `family`, `sector`, `category`, `siteType`, `language`, `compat`, `sort`, `page`, `perPage`. Les paramètres sont normalisés (valeurs inconnues ignorées, `perPage` borné à 48). La recherche ignore casse et accents, exige tous les mots, classe le nom avant les mots-clés, la catégorie et les secteurs, puis la description. Les filtres se cumulent ; les facettes (compteurs) comptent les mêmes éléments que la liste. Tri : pertinence (si recherche), plus récents (date d'ajout réelle), alphabétique, plus utilisés (**nombre réel d'imports non annulés dans l'organisation** ; option absente tant qu'il n'y en a pas). **Pas de tri « recommandés »** : aucune logique de recommandation réelle n'existe, rien n'est inventé.

## 7. Performance
Les listes sont **légères** (aucun contenu de section) ; seules les entrées de la page demandée sont construites pour compter pages et éléments ; seul le filtre « compatibilité » construit tout le catalogue. Les vignettes sont de vraies pages rendues par le moteur (aucune capture stockée), chargées à la demande (`IntersectionObserver`). Mesures dans `KOLAKISA_PROGRAMME20_4_TESTS.md`.
