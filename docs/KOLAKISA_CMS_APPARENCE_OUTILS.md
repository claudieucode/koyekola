# KOLAKISA CMS — Apparence : Éditeur du site, Templates, Patterns, Styles (mission APPARENCE-OUTILS)

Branche `apparence-outils-01`, issue de `main` (`b1bf7f3`). Ce document est le **registre d'avancement** (un statut honnête par fonctionnalité, relié à son code et à sa preuve de test) et l'audit qui justifie l'architecture.

Statuts : **À développer** · **En cours** · **Implémentée** · **Testée** (test automatisé exécuté) · **Vérifiée visuellement** (parcours Chrome exécuté) · **Bloquée** (justification).

## 1. Audit initial

Dans l'**espace d'un site**, « Templates », « Patterns » et « Styles » étaient « BIENTÔT » (aucune entrée dans `ABILITY` de `cmsNav.js`) et « Éditeur du site » ouvrait seulement l'ancre `#design` des Réglages du site. Dans l'administration du **site principal**, d'anciens écrans existent (`/site-web/apparence/*`, palier 8) mais ils ne visent que le principal (`appearance.*(null, …)`).

| Moteur existant | Réalité | Par site ? | Réutilisé par |
|---|---|---|---|
| Moteur de design d'un site : `mk_sites.tokens` + `mk_sites.settings` (`pages.saveSiteDesign`, révision, conflits) | opérationnel | oui | Styles |
| Moteur de design du principal : `appearance_configs` (`services/appearance.js`) | opérationnel | `site_id` NULL | Styles |
| **Personnaliser** : `services/customizer.js` (catalogue fermé de réglages, brouillon `cms_customizer_drafts` verrou optimiste, publication, versions `cms_customizer_versions`, aperçu CSS recalculé) | opérationnel | oui | Styles (même brouillon, mêmes routes) |
| Modèles de pages : `pages/templates.js` (18 gabarits faits de vraies sections), `mk_page_templates` « Mes modèles » (privés à un site, migration 093) | opérationnel | oui | Templates |
| Patterns : `pages/patterns.js` (22 compositions intégrées), `appearance_patterns` (compositions enregistrées, `site_id`, corbeille) | opérationnel | oui (table) | Patterns |
| Page Builder : `pages.*` (pages, brouillon / publication / versions, composants, parties du site `siteParts`) | opérationnel | oui | Éditeur du site, Templates, Patterns |
| Thèmes, Polices, Menus, Widgets, Médiathèque | opérationnels | oui | liens et cohérence |
| Anciens écrans `/site-web/apparence/{styles,templates,patterns,en-tete,pied-de-page}` | opérationnels pour le **principal** seulement ; formulaires, sans aperçu en direct | non | conservés (non supprimés) |

**Conséquence** : aucun second moteur. Chaque outil est un écran **partagé** (comme Thèmes / Widgets : le site vient de l'adresse vérifiée par le serveur, jamais du navigateur) branché sur les services ci-dessus.

## 2. Règle de priorité Styles / Personnaliser

**Une seule source de vérité** : Styles et Personnaliser écrivent **le même brouillon** (`cms_customizer_drafts`) par les **mêmes routes** (`/site-web/personnaliser/*`) et publient dans les mêmes moteurs. Une couleur modifiée dans l'un apparaît dans l'autre ; il n'existe pas deux valeurs concurrentes. Styles présente les réglages sous forme de **système de design** (palette, échelle typographique, formes, boutons, contrastes) ; Personnaliser reste l'outil d'identité, d'en-tête, de pied de page et de CSS additionnel.

## 3. Registre

| # | Fonctionnalité | Statut | Code | Preuve |
|---|---|---|---|---|
| S1 | Styles : écran partagé par site (site vérifié par le serveur, lecture seule hors droits) | Testée · Vérifiée visuellement | `web/styles.js`, `views/marketing/styles.ejs`, `public/js/cms-styles.js` | `apparence-styles` « écran » ; navigateur « l'écran s'ouvre », « lecture seule » |
| S2 | Styles : palette (couleurs globales, aperçu des teintes, réinitialisation) | Testée · Vérifiée visuellement | `services/stylePalettes.js` | palettes AA ; navigateur « palette » |
| S3 | Styles : vérification de contraste (paires texte / fond, AA) | Testée · Vérifiée visuellement | `cms-styles.js` (contrastes WCAG) + alertes du serveur | navigateur « couleur invalide / peu lisible » |
| S4 | Styles : typographie (polices, échelle H1–H3 / texte, aperçu en direct) | Testée · Vérifiée visuellement | onglet Typographie | navigateur « typographie, formes et boutons » |
| S5 | Styles : formes et espacements (arrondis, ombres, espacements, conteneurs) | Testée · Vérifiée visuellement | onglet Formes et espacements | idem |
| S6 | Styles : boutons et liens (états normal / survol / focus) | Testée · Vérifiée visuellement | onglet Boutons et liens (états normal / survol / focus dans le guide) | idem |
| S7 | Styles : brouillon, annulation, publication, versions (partagés avec Personnaliser) | Testée · Vérifiée visuellement | routes `/personnaliser/*` partagées | `apparence-styles` « brouillon partagé et publication » ; navigateur « enregistrer… publier… abandonner » |
| S8 | Styles : aperçu réel de la page (bureau / tablette / mobile) | Testée · Vérifiée visuellement | onglet « Page du site » (cadre réel, CSS recalculé) | navigateur « aperçu de la PAGE RÉELLE » |
| S9 | Styles : validation des valeurs, conflits de version | Testée · Vérifiée visuellement | validation serveur de Personnaliser | `apparence-styles` « validation et conflits » ; navigateur « erreur serveur et réseau » |
| P1 | Patterns : bibliothèque par site (intégrés + compositions du site), recherche, catégories | Testée · Vérifiée visuellement | `services/patternLibrary.js`, `web/patternsLibrary.js`, `views/marketing/patterns.ejs`, `public/js/cms-patterns.js` | `apparence-patterns` ; `apparence-patterns-navigateur` |
| P2 | Patterns : aperçu réel avant insertion | Testée · Vérifiée visuellement | `web/sectionPreview.js` (rendu réel des sections, vignettes paresseuses) | navigateur patterns |
| P3 | Patterns : insertion dans une page du site (sections natives modifiables) | Testée · Vérifiée visuellement | `patternLibrary.insert` (sections natives ajoutées au brouillon) | `apparence-patterns` ; `apparence-parcours` étape 3 |
| P4 | Patterns : enregistrer une composition depuis une page ; renommer ; dupliquer ; supprimer / restaurer | Testée · Vérifiée visuellement | `createFromPage`, `rename`, `duplicate`, `trashOne`, `restoreOne`, `purgeOne` | `apparence-patterns` ; navigateur patterns |
| P5 | Patterns : isolation par site | Testée | `ownRow` / `pageOf` + `siteTarget` | `apparence-patterns` « permissions et isolation » |
| T1 | Templates : bibliothèque (gabarits de pages, « Mes modèles », packs de site), recherche, catégories | Testée · Vérifiée visuellement | `services/templateLibrary.js`, `pages/sitePacks.js` (5 packs), `web/templatesLibrary.js`, `views/marketing/apparence-templates.ejs`, `public/js/cms-templates.js` | `apparence-templates` ; navigateur templates |
| T2 | Templates : aperçu avant importation | Testée · Vérifiée visuellement | GET `/templates/apercu` | navigateur templates |
| T3 | Templates : importation réelle d'une page ou d'un pack (pages, sections, menu) | Testée · Vérifiée visuellement | `importTemplate` (migration 098, pages, sections, menu, brouillon de styles ; rien n'est publié) | `apparence-templates` ; `apparence-parcours` étape 1 |
| T4 | Templates : importation idempotente (aucune duplication à la relance) et sans écrasement | Testée | clé d'idempotence, transaction, noms numérotés, retour arrière (déclencheur SQLite) | `apparence-templates` « idempotence » et « atomicité » |
| T5 | Templates : isolation par site | Testée | `cms_template_imports.site_id` + `siteTarget` | `apparence-templates` « isolation » |
| E1 | Éditeur du site : espace de travail par site avec aperçu réel et appareils | Testée · Vérifiée visuellement | `services/siteEditor.js`, `web/siteEditor.js`, `views/marketing/site-editor.ejs`, `public/js/cms-site-editor.js` | `apparence-editeur-site` ; navigateur éditeur |
| E2 | Éditeur du site : pages, parties globales (composants), menus, styles — accès directs au vrai éditeur | Testée · Vérifiée visuellement | Page Builder réel en cadre (`?cadre=1`, classe `pb-embedded`), composants globaux | navigateur éditeur « ouvrir une page », « changer de page » |
| E3 | Éditeur du site : état des brouillons et publication selon les droits | Testée · Vérifiée visuellement | `pending` (brouillons ET nouvelles pages), `publishPages` page par page avec contrôles | `apparence-editeur-site` ; navigateur « publication » ; `apparence-parcours` étape 5 |
| X1 | Menu Apparence : plus de « BIENTÔT » pour ces quatre entrées, dans l'espace d'un site comme dans l'administration | Testée | `cmsNav` (ABILITY, SITE_MODULES, FRAMED) ; tests de garde mis à jour | `entrees-fermees-preuves`, `menu-site-inventaire`, `site-espace`, `site-menu-*` |
| X2 | Isolation multisite et permissions (serveur) | Testée | `siteTarget`, `routeScopes`, permissions par route | tests d'isolation de chaque module + `apparence-parcours` étape 6 (site B inchangé octet pour octet) |
| X3 | Parcours transversal Templates → Éditeur → Patterns → Styles → aperçu → publication | Testée | — | `apparence-parcours` (6 étapes, vraies routes et vraie base) |

## 4. Limites connues

- Les cinq packs de site ne contiennent aucune image : les images se choisissent ensuite dans la médiathèque du site (aucune image sous licence incertaine n'est embarquée).
- Pas de « favoris » dans Templates ni Patterns.
- L'import de styles fusionne avec le brouillon Personnaliser existant ; il n'est jamais publié automatiquement.
- Le menu importé n'est affecté à aucun emplacement : c'est à vous de le décider (Menus).
- L'enregistrement automatique de l'Éditeur du site s'appuie sur l'indicateur du Page Builder (`[data-pb-save]`) ; la confirmation avant de quitter protège les modifications non enregistrées.
- Les anciens écrans `/site-web/apparence/*` du site principal restent accessibles mais ne sont plus liés dans le menu.
- Les vérifications visuelles ont été faites avec Chrome piloté par Playwright (bureau, tablette, mobile 390 px) ; pas d'autres navigateurs.
- Échecs déjà présents sur `main` avant cette mission (non causés par elle) : `marketing-r0-coque` (« une section sans entrée visible… »), `portee-des-routes`, `seo-import-migrations`, `cms-appearance`.
