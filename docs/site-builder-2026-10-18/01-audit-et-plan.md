# Site builder multisite — Phase 0 : audit ciblé, matrice et plan (2026-10-18)

Base : `main` = d208843 (en production). Branche de travail : `site-builder-vierge`. Aucun push, aucune migration réelle, `.env` intact.
Méthode : lecture du code + sondes exécutées sur bases jetables (pas de déduction depuis la présence d'un fichier).

## 1. Parcours réel de création d'un site (sonde)
`POST /marketing/site-web/sites` → `pages.createSite` : **une seule ligne `mk_sites` + une ligne de journal**. Mesure : delta de toutes les tables de la base = `mk_sites +1`, `mk_audit_logs +1`. Donc : aucune page, article, menu, composant, formulaire, modèle, média copié ; `header_component_id`, `footer_component_id`, `home_page_id` = NULL ; aucun domaine.
Seule valeur « préremplie » : le design system par défaut (`DEFAULT_TOKENS` : palette bleue, polices) — valeurs techniques de départ, pas du contenu (à confirmer : voir plan F).
Parcours de création de page du principal vs sites : unifiés dans la session (même boîte « Nouvelle page », même route, site transmis par l'espace et revérifié) ; contexte conservé (correctifs déployés c973f4e, d208843).

## 2. Matrice (état réel)

Légende : ✅ existant et fonctionnel (preuve de test) · 🟡 existant mais incomplet · ❌ absent · 🔴 défectueux (corrigé dans cette étape = ✔ B/C).

| Fonction | État | Preuve / remarque |
|---|---|---|
| Création de site strictement vide | ✅ | `site-builder-vierge` B1 (delta de toutes les tables) |
| Identifiant de site, `site_id` partout, résolution serveur du site (adresse), permissions, accès limité | ✅ | `routeScopes`, `siteContext`, ~100 tests R2–R9 |
| Pages (brouillon/publié/versions/restauration) par site | ✅ | `cms-pages`, `cms-revisions`, `persistance-navigateur` |
| Éditeur visuel commun (sections/conteneurs, styles, états, responsive, annuler/rétablir, aperçu, enregistrement) | ✅ | page-builder.js + ≈ 300 tests navigateur ; même éditeur principal/sites |
| Composants réutilisables par site ou globaux explicites | ✅ | `mk_web_components.site_id`, refus « autre site » |
| En-tête / pied de page d'un site (composant choisi, exceptions par page, variantes) | ✅ | `setSiteParts`, `setPageHeader`, `withSiteParts` ; NULL par défaut = rien |
| Menus par site (`nav_menus.site_id`) | ✅ | R8 lot 4 |
| Médias par site | ✅ | migration 074/079 |
| Design system par site (couleurs, polices, boutons, liens, largeurs, breakpoints, classes globales) | ✅ | `mk_sites.tokens/settings`, panneau Réglages |
| Hiérarchie défaut → site → modèle/composant → élément → responsive | 🟡 | tokens + classes + valeurs responsive existent ; la couche « modèle/composant » est partielle (pas de style de modèle de page) |
| **Modèles de pages enregistrés (« Mes modèles »)** | 🔴 → ✔ | étaient communs à tous les sites (aucun `site_id`) ; désormais privés au site (migration 093) |
| Bibliothèque de gabarits/sections intégrés (lecture seule) | ✅ | `templates.catalog`, `patterns`, `structures` |
| Importer/exporter une page (JSON) dans un site | 🟡 | `importPage` revalide ; réécriture d'identifiants/liens/médias source non vérifiée de bout en bout |
| Kits/modèles de SITE complets (import volontaire) | ❌ | aucun |
| **Theme Builder (« Modèles de thème »)** | 🟡 | 8 familles (article, listes blog, auteur, formation, catégorie, étiquette, recherche, 404), conditions + priorité déterministe (`pick`) ; **réglage d'organisation** (`mk_settings theme.templates`), donc non lié à un site ; la page-modèle peut venir de n'importe quel site |
| Modèle « page standard », archives/listes propres à un site, 404 propre à un site | ❌ | seul le 404 du principal existe |
| Visibilité des modèles d'en-tête/pied sur les pages publiées | ✅ | `withSiteParts` au rendu public |
| Aperçu privé d'une page | ✅ | `/pages/:id/apercu` |
| **Aperçu privé d'un SITE (vierge ou non)** | ❌ → ✔ | route `…/apercu` : état vide explicite ou aperçu de la page d'accueil/première page |
| États du site (non construit / en construction / brouillon / publié / domaine en attente / HTTPS actif) | 🟡 | seulement actif/archivé ; l'état « non construit » est déduit (aucune page) ; états de domaine : voir rapport domaines |
| **Vitrine d'un site non publié** | 🔴 → ✔ | affichait l'habillage KOLAKISA (catalogue, blog, connexion, recherche) et le modèle 404 du principal ; message neutre « pas encore publié » |
| Domaines indépendants (routage, 421, isolation) | ✅/🟡 | voir `docs/domaines-multisite-2026-10-18` (vérification de propriété, DNS, HTTPS, www : ❌) |
| Formulaires/inscriptions liés à l'hôte | 🔴 (non traité) | `/f/<form d'un autre site>` répond sur le domaine d'un autre site (rapport domaines, E4) |
| Réconciliation avec la procédure « reconstruction » (unicité par site) | ✅ | outil existant R6 lot 5 compatible avec la migration 093 (tests) |

## 3. Plan priorisé (ordre imposé A→I)

| Étape | Contenu | Fichiers principaux | Dépendances | Statut |
|---|---|---|---|---|
| A | Audit + plan | ce document | — | **fait** |
| B | Cycle de création et isolation : modèles de pages privés | `migrations/093`, `pages/index.js`, `web/siteWeb.js`, `web/routeScopes.js`, `web/siteSpace.js`, `web/landing.js`, `public/js/page-builder.js` | reconstruction R6 lot 5 (compatible) | **fait** (testé) |
| C | Site vierge + aperçu + vitrine vide neutre | `web/siteSpace.js` (aperçu), `middlewares/siteHost.js`, `views/site-public-error.ejs` | — | **fait** (testé) |
| D | Consolidation de l'éditeur commun | audit fonctionnel des commandes listées par site secondaire (parcours Chrome) | B, C | à faire |
| E | Theme Builder par site : table `mk_theme_templates(site_id…)`, types « page standard », archives, recherche, 404 par site, conditions, priorité (réutiliser `themeTemplates.pick`) ; reprise des affectations actuelles au principal | `pages/themeTemplates.js`, `web/themeRender.js`, écran « Modèles de thème » | migration (nouvelle), reconstruction | à faire |
| F | Design system : hiérarchie complète (couche modèle), vérifier « modification globale ne touche que les éléments liés », décider si `DEFAULT_TOKENS` doit être proposé plutôt qu'appliqué | `pages/tokens.js`, `themeCss.js`, `siteSettings.js` | E | à faire |
| G | Bibliothèque : sections enregistrées par site, import volontaire d'un modèle/kit avec réécriture d'identifiants et signalement des médias/liens non importables, aperçu avant import, annulation | `pages/index.js` (importPage), nouveaux services | B | à faire |
| H | Publication + domaines : états de domaine, vérification DNS/propriété, HTTPS, sous-domaine provisoire, formulaires liés à l'hôte (voir rapport domaines §3) | `services/urls.js`, `middlewares/siteHost.js`, migration `mk_site_domains` | autorisation migration | à faire |
| I | Bout en bout (15 scénarios de la mission) + non-régression | tests | D–H | à faire |

## 4. Étapes B et C : ce qui a été fait
- **B — modèles de pages privés** : migration additive 093 (`site_id`, `shared` ; les modèles existants restent communs `shared=1` pour ne rien faire disparaître, tout nouveau modèle est privé à son site). Le même nom ne peut pas écraser le modèle d'un autre site (refus 409). Routes d'enregistrement / lecture / suppression classées dans `routeScopes` : un accès limité à un site peut enregistrer et lire les modèles DE SON site, jamais ceux d'un autre. Créer une page avec un modèle d'un autre site est refusé. La procédure de reconstruction R6 lot 5 reste applicable (test ajusté : −2 différences attendues, comme pour `mk_forms`).
- **C — site vierge** : aperçu privé du site (`/sites/<id>/apercu`, `/principal/apercu`) ; état vide explicite avec action « Créer la première page » ; bouton « Aperçu du site » sur le tableau de bord ; vitrine d'un site non publié = message neutre sans habillage ni modèle 404 du principal (HTTP 404, `noindex`).
