# Mission 9 — Theme Builder : inventaire

*Relevé dans le code (branche `theme-builder`, départ `19f0bcf`). Les états viennent de la matrice fonctionnelle.*

## 1. Types de modèles

### 1.1 Modèles de thème du site public (`themeTemplates.TYPES`, 9 familles)
| Famille | Remplace | Appelée par | Conditions possibles |
|---|---|---|---|
| `single_post` Article du blog | en-tête, image, texte de l'article | `routes/blog.js:340` | catégorie, étiquette, article précis, public |
| `blog_archive` Liste du blog | liste des articles (accueil, catégories) | `blog.js:178` | catégorie, public |
| `category_archive` Archive de catégorie | liste d'une catégorie | `blog.js:178` | catégorie, public |
| `tag_archive` Archive d'étiquette | liste d'une étiquette | `blog.js:178` | étiquette, public |
| `author_archive` Page d'un auteur | liste d'un auteur | `blog.js:178` | public |
| `search_results` Résultats de recherche | liste lors d'une recherche **du blog** | `blog.js:178` | public |
| `static_page` Page du site (À propos) | texte de **/a-propos** uniquement | `routes/pages.js:40` | public |
| `single_course` Fiche d'une formation | en-tête de la fiche | `routes/courses.js:248` | catégorie, public |
| `not_found` Page introuvable (404) | page d'erreur 404 (statut conservé) | `server.js:186` | public |

Chaque famille retombe sur l'affichage d'origine si aucun modèle **en ligne** ne convient. Limite : 30 affectations (`MAX_TEMPLATES`).

### 1.2 Parties globales
| Élément | Portée | Mécanisme |
|---|---|---|
| En-tête d'un site du Page Builder | pages du site (exceptions : aucun / variante) | composant du site + `mk_sites.header_component_id` |
| Pied de page d'un site du Page Builder | pages du site | composant + `mk_sites.footer_component_id` |
| En-tête / pied de page du site public (blog…) | site public | Apparence › En-tête / Pied de page (configuration structurée, brouillon → publication) |

### 1.3 Composants réutilisables
`standard` (copies indépendantes) ou `global` (instances liées, copie de travail + « Mettre à jour », compteur de version). Portée : tous les sites ou un site.

### 1.4 Types non pris en charge (documentés, non ajoutés)
| Type Elementor | Dépendance manquante | Décision recommandée |
|---|---|---|
| Page individuelle générique (modèle commun à toutes les pages) | Les pages du Page Builder portent chacune leur mise en page ; aucun gabarit de « contenu de page » | Concevoir d'abord un élément « contenu de la page » (voir L4) |
| Recherche globale du site | Aucun moteur de recherche global | Attendre le moteur de recherche (le modèle `search_results` couvre le blog) |
| Archive de type de contenu personnalisé | Pas de types de contenu personnalisés | Hors périmètre |
| Pop-up / formulaire de connexion / panier comme modèles | Pas de moteur de modèle pour ces écrans | Hors périmètre |

## 2. Fonctions de gestion
| Fonction | Où | Remarque |
|---|---|---|
| Lister / créer / retirer une affectation | CMS › Site Web › Modèles de thème ; Apparence › Templates | deux écrans, mêmes données (`forms.write` / `appearance.templates`, tous deux rôle « éditeur ») |
| **Expliquer une résolution** | « Pourquoi ce modèle ? » + `GET …/modeles-de-theme/resolution.json` | ajouté par cette mission |
| Protection d'une page-modèle | `archivePage` → `themeTemplates.guardPageRemoval` | ajouté par cette mission |
| Composants : créer, brouillon, mettre à jour, abandonner, supprimer (choix instances / détacher) | `pages/index.js`, routes `site-web/composants/*` | **révision ajoutée** (migration 071) |
| Parties de site : choisir, variantes, exceptions par page, vue d'ensemble | `setSiteParts`, `createHeaderVariant`, `setPageHeader`, `headerOverview` | copie de site et déplacement de page corrigés |

## 3. Données
- `mk_settings` clé `theme.templates` (JSON, par organisation) — inchangé.
- `mk_web_components` : colonnes `kind`, `draft`, `version` (067), `variant_of` (044), **`revision` (071, ajoutée)**.
- `mk_sites.header_component_id / footer_component_id`, `mk_landing_pages.header_mode / header_component_id` — inchangés.
