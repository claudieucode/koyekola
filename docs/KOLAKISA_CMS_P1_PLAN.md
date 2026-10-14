# KOLAKISA — Lot P1 : plan détaillé d'unification de la navigation du CMS (site principal / site créé)

> **Statut : PLAN, rien n'est implémenté.** Aucun code fonctionnel modifié, aucune migration, aucune donnée de production touchée, rien de poussé ni déployé. B2 non commencé.
> **Références :** `docs/KOLAKISA_CMS_PARITE_AUDIT.md` et `docs/preuves/parite-observations.json` (66 entrées du principal, 26 d'un site, observées par sonde sur une base d'essai).
> **Base :** `553539c` (B1 déployé) + `74f9a30` (audit). Les affirmations de ce plan sont soit **lues dans le code** (référence donnée), soit **observées** par la sonde, soit marquées **non vérifiées** (§12).

**Erratum sur l'audit :** l'audit écrivait « Outils : 16 routes sur 25 filtrées par site ». C'est inexact : j'avais compté les lignes simples. Les 21 adresses de `web/tools.js` passent toutes par `withSite` (vérifié ligne à ligne). Le fond de l'audit ne change pas, il se renforce : Outils est entièrement prêt pour un site. L'audit est corrigé dans le même commit.

## 1. Objectif et principe retenu

**Objectif :** un utilisateur qui ouvre un site créé retrouve **la même organisation de menu que dans le CMS principal**, dans l'espace du site (bandeau d'identité, menu du site), avec pour chaque entrée un état **exact** : disponible, héritée, ou « Bientôt » avec le lot qui l'ouvrira.

**Principe : une seule source de navigation, deux contextes.**

- Le registre `SECTIONS` de `src/marketing/web/cmsNav.js` reste **la seule définition** des groupes, libellés, permissions et clés d'écran. Le menu d'un site en est une **projection** : mêmes groupes, mêmes libellés, **mêmes clés** (`outils/importer`, `parametres/lecture`, `corbeille`…).
- Chaque entrée du registre reçoit un champ `site` qui décrit son traitement pour un site (`exposer` | `adapter` | `hérité` | `bientôt:<lot>` | `hors`) et, si besoin, son adresse dans l'espace du site. Le principal ne change pas : il ignore ce champ.
- `buildSiteNav` et `siteSections` (la définition parallèle écrite en B1) **disparaissent** au profit de cette projection. Pas de second registre, pas de second CMS.
- **Les clés étant identiques**, un écran existant qui s'affiche avec `active: "outils/importer"` prend automatiquement la bonne entrée du menu d'un site : c'est ce qui supprime la perte de contexte (§5). Aucun écran n'est réécrit.

## 2. Critères de décision : exposer, adapter ou laisser indisponible

Une entrée est **exposée** dans le menu d'un site seulement si les **six** conditions sont vraies, chacune étant testable :

| # | Condition | Comment on l'établit |
|---|---|---|
| C1 | Les **données** lues et écrites sont filtrées par le site (colonne `site_id` ou rattachement par la page/ressource) | Lecture du service + test A/B sur deux sites : une donnée de A n'apparaît jamais dans B |
| C2 | Le **site vient de l'adresse vérifiée** côté serveur (`/sites/N/…`), jamais d'un champ libre du client | Test : un identifiant d'un autre site ou d'un autre organisme donne 403/404, jamais les données |
| C3 | Les **permissions** sont celles du rôle sur CE site (`effectivePermissions(utilisateur, site)`) | Test par rôle (propriétaire, éditeur, lecteur, sans accès) sur l'écran |
| C4 | Un **membre limité à un site** peut l'ouvrir pour son site, et pas pour un autre | Test avec un compte limité au site A : 200 sur A, 403 sur B |
| C5 | L'écran s'affiche **dans la coque du site** (bandeau + menu du site) et ses actions y ramènent | Test de navigation + Chrome réel |
| C6 | Les **actions** ont un effet réel et limité à ce site (aucun bouton décoratif) | Test de bout en bout de chaque action exposée |

Décision pour chaque entrée :

- **Exposer** : C1 à C6 vraies aujourd'hui, ou seulement C5 à garantir (changement de menu, pas de logique).
- **Adapter** : le moteur sait gérer un site mais l'écran ou la route ne filtre pas encore (C1 ou C4 fausse). L'entrée n'est montrée qu'**après** l'adaptation et ses tests. Avant, elle reste « Bientôt ».
- **Hérité** : la valeur existe mais est commune à l'organisation. Affichée en **lecture seule**, avec la mention « commun à tous les sites ». Aucune écriture possible depuis un site.
- **Indisponible** : les données ne sont pas séparées par site (C1 fausse, migration nécessaire) ou la fonction n'existe pas. « Bientôt » + lot. **Aucune donnée, aucune action.**
- **Hors menu d'un site** : fonction d'organisation (sauvegardes de toute la base, informations de plateforme, journal d'organisation). Ne pas la présenter comme propre au site.

## 3. Structure cible : les 14 groupes et chacune des 66 entrées

Bilan sur les 66 entrées du principal : **21 à exposer**, **5 à adapter d'abord**, **5 héritées (lecture seule)**, **31 indisponibles (« Bientôt »)**, **4 hors du menu d'un site**.

`N` = identifiant du site. Les adresses de l'espace d'un site sont toutes de la forme `/marketing/site-web/sites/N/<module>` (décision D14). Les adresses historiques du principal ne changent pas (D15).

### Mes sites — 1 hors du menu d'un site

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Mes sites | **hors du menu d'un site** | `—` | `forms.read` | organisation | Remplacée par le fil d'Ariane « Mes sites » et le sélecteur de site (déjà livrés) |

### Site principal — 1 exposer

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Tableau de bord du site principal | **exposer** | `/sites/N/tableau-de-bord` | `forms.read` | propre au site | Déjà en place |

### Pages — 1 exposer

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Pages | **exposer** | `/sites/N/pages` | `forms.read` | propre au site | Déjà en place |

### Articles — 9 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Tous les articles | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Ajouter | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Brouillons | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Programmés | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Publiés | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Corbeille | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Catégories | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `taxonomies.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Étiquettes | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `taxonomies.read` | posts / taxonomy_* sans site_id | Lot B5 |
| Auteurs | **indisponible (« Bientôt »)** | `/sites/N/articles (écran « Bientôt »)` | `articles.read` | posts / taxonomy_* sans site_id | Lot B5 |

### Médias — 1 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Médias | **indisponible (« Bientôt »)** | `/sites/N/medias (écran « Bientôt »)` | `media.read` | media / mk_media sans site_id | Lot B2 |

### Navigation — 1 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Navigation | **indisponible (« Bientôt »)** | `/sites/N/navigation (écran « Bientôt »)` | `navigation.read` | moteur prêt (nav_menus.site_id), écran limité au principal | Lot P2 |

### Apparence — 4 exposer, 3 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Éditeur du site | **exposer** | `/sites/N/reglages#design` | `appearance.read` | propre au site (design system du site) | Renvoi vers la fiche du site, équivalent par site de l'éditeur ; édition complète au lot P2 |
| Templates | **indisponible (« Bientôt »)** | `/sites/N/modeles (écran « Bientôt »)` | `appearance.read` | mk_page_templates sans site_id | Lot B3 |
| Patterns | **indisponible (« Bientôt »)** | `/sites/N/modeles (écran « Bientôt »)` | `appearance.read` | appearance_patterns : moteur prêt, écran principal | Lots P2 / B3 |
| Styles | **exposer** | `/sites/N/reglages#design` | `appearance.read` | propre au site | Même renvoi |
| En-tête | **exposer** | `/sites/N/reglages#entete` | `appearance.read` | propre au site | Déjà en place (fiche du site) |
| Pied de page | **exposer** | `/sites/N/reglages#entete` | `appearance.read` | propre au site | Même fiche (parties du site : en-tête et pied) |
| Menus | **indisponible (« Bientôt »)** | `/sites/N/navigation (écran « Bientôt »)` | `navigation.read` | voir Navigation | Lot P2 |

### Commentaires — 5 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Tous | **indisponible (« Bientôt »)** | `/sites/N/commentaires (écran « Bientôt »)` | `comments.read` | blog_comments sans site_id | Lot B5 |
| En attente | **indisponible (« Bientôt »)** | `/sites/N/commentaires (écran « Bientôt »)` | `comments.read` | blog_comments sans site_id | Lot B5 |
| Approuvés | **indisponible (« Bientôt »)** | `/sites/N/commentaires (écran « Bientôt »)` | `comments.read` | blog_comments sans site_id | Lot B5 |
| Indésirables | **indisponible (« Bientôt »)** | `/sites/N/commentaires (écran « Bientôt »)` | `comments.read` | blog_comments sans site_id | Lot B5 |
| Corbeille | **indisponible (« Bientôt »)** | `/sites/N/commentaires (écran « Bientôt »)` | `comments.read` | blog_comments sans site_id | Lot B5 |

### Utilisateurs — 1 exposer, 2 adapter d'abord, 2 hérité (lecture seule)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Tous les utilisateurs | **exposer** | `/sites/N/equipe` | `users.view` | accès à CE site (mk_site_members) | « Équipe du site », déjà en place |
| Inviter | **adapter d'abord** | `/sites/N/equipe/inviter` | `users.create` | invitation limitée à CE site | Site imposé par l'adresse ; contrôle serveur « users.create » dans le contexte du site |
| Rôles | **hérité (lecture seule)** | `/sites/N/equipe/roles` | `users.view` | définitions de rôles = organisation | Lecture seule, libellé « commun à tous les sites » |
| Permissions | **hérité (lecture seule)** | `/sites/N/equipe/permissions` | `users.view` | matrice des permissions = organisation | Lecture seule, même libellé |
| Invitations | **adapter d'abord** | `/sites/N/equipe/invitations` | `users.view` | invitations de CE site seulement | À filtrer par site ; filtrage non vérifié aujourd'hui |

### SEO — 9 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Vue générale | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Analyse SEO | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Meta | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Indexation | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Sitemap | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Schema | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Open Graph | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Robots | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |
| Erreurs 404 | **indisponible (« Bientôt »)** | `/sites/N/seo (écran « Bientôt »)` | `forms.read` | seo_meta / seo_settings sans site_id | Lot B6 (les 3 réglages SEO propres au site sont exposés dans Paramètres) |

### Redirections — 1 exposer, 2 adapter d'abord

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Redirections | **exposer** | `/sites/N/redirections` | `redirects.view` | propre au site (seo_redirects.site_id) | Déjà en place |
| Liens cassés | **adapter d'abord** | `/sites/N/liens-casses` | `redirects.view` | liens des pages et menus de CE site | brokenLinks.js : 1 référence de site seulement, filtrage à établir |
| Permaliens et adresses | **adapter d'abord** | `/sites/N/permaliens` | `redirects.view` | structure d'adresses de CE site | Le moteur accepte déjà ?site= ; accès d'un membre limité à ajouter |

### Tests A/B — 1 exposer

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Tests A/B | **exposer** | `/sites/N/tests-ab` | `forms.read` | propre au site (via la page testée) | Écran existant (9 écrans hors coque : voir §5) |

### Outils — 6 exposer, 1 adapter d'abord, 3 hors du menu d'un site, 1 indisponible (« Bientôt »)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Santé du site | **exposer** | `/sites/N/outils` | `tools.view` | propre au site (withSite) | Santé du site |
| Corbeille | **adapter d'abord** | `/sites/N/corbeille` | `revisions.view` | éléments supprimés de CE site | La route n'a AUCUN filtre de site (revisions.trashList) : exposer sans adapter ferait voir la corbeille de tous les sites |
| Importer | **exposer** | `/sites/N/outils/importer` | `tools.import` | propre au site (withSite, journal d'opérations par site) |  |
| Exporter | **exposer** | `/sites/N/outils/exporter` | `tools.export` | propre au site (withSite) |  |
| Sauvegardes | **hors du menu d'un site** | `—` | `tools.view` | copies de la base ENTIÈRE | Lister les sauvegardes d'organisation dans l'espace d'un site serait trompeur |
| Diagnostic | **exposer** | `/sites/N/outils/diagnostic` | `tools.view` | propre au site (withSite) |  |
| Informations système | **hors du menu d'un site** | `—` | `tools.view` | informations de plateforme | Pas une donnée de site |
| Maintenance | **exposer** | `/sites/N/outils/maintenance` | `tools.maintenance` | propre au site (withSite ; tools/maintenance.js) | Portée exacte des actions à confirmer par test |
| Caches | **indisponible (« Bientôt »)** | `—` | `tools.cache` | — | « Bientôt » dans le site principal lui-même : même état |
| Outils de contenu | **exposer** | `/sites/N/outils/contenu` | `tools.content` | propre au site (withSite ; simulation avant remplacement) |  |
| Journal d'activité | **hors du menu d'un site** | `—` | `tools.view` | journal d'audit de l'organisation (auditLog sans filtre de site) | À rouvrir si un filtre par site est établi |

### Paramètres — 6 exposer, 2 indisponible (« Bientôt »), 3 hérité (lecture seule)

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données | Note |
|---|---|---|---|---|---|
| Général | **exposer** | `/sites/N/parametres` | `settings.read` | valeurs du site, défauts hérités (9 réglages) | Groupe Général |
| Lecture | **exposer** | `/sites/N/parametres/lecture` | `settings.read` | valeurs du site (1 réglage) |  |
| Commentaires | **indisponible (« Bientôt »)** | `—` | `settings.read` | 0 réglage propre au site | Dépend du blog (B5) |
| Médias | **indisponible (« Bientôt »)** | `—` | `settings.read` | 0 réglage propre au site | Dépend des médias (B2) |
| Permaliens | **hérité (lecture seule)** | `/sites/N/parametres/permaliens` | `settings.read` | 0 réglage propre au site : valeur du principal | Lecture seule, libellé « hérité » |
| SEO | **exposer** | `/sites/N/parametres/seo` | `settings.read` | valeurs du site (3 réglages) |  |
| Confidentialité | **exposer** | `/sites/N/parametres/confidentialite` | `settings.read` | valeurs du site (1 réglage) |  |
| Indexation | **exposer** | `/sites/N/parametres/indexation` | `settings.read` | valeurs du site (1 réglage) |  |
| Emailing | **exposer** | `/sites/N/parametres/emailing` | `settings.read` | valeurs du site (3 réglages) |  |
| Tunnels | **hérité (lecture seule)** | `/sites/N/parametres/tunnels` | `settings.read` | 0 réglage propre au site : valeur du principal | Lecture seule, libellé « hérité » |
| Avancé | **hérité (lecture seule)** | `/sites/N/parametres/avance` | `settings.read` | indicateurs de plateforme (lecture seule) | Lecture seule |

### Groupes propres au menu d'un site (absents du menu du principal)

Le menu **du principal** ne contient ni Emailing ni Analytics : ils vivent dans le menu **Marketing**. B1 les a mis dans le menu d'un site. Le plan les **garde** dans un groupe distinct « Marketing du site », sans toucher au menu du principal (décision D-P1-1).

| Entrée | Traitement | Adresse dans l'espace du site | Permission | Règle de données |
|---|---|---|---|---|
| Composants | **exposer (déjà en place)** | `/sites/N/composants` | `forms.read` | propres au site + globaux visibles (déjà en place) |
| Listes | **exposer — garantir la coque** | `/sites/N/listes` | `forms.read` | mk_lists.site_id |
| Segments | **exposer — garantir la coque** | `/sites/N/segments` | `forms.read` | mk_segments.site_id |
| Modèles d'e-mail | **exposer — garantir la coque** | `/sites/N/modeles-email` | `forms.read` | mk_templates.site_id |
| Campagnes | **exposer — garantir la coque** | `/sites/N/campagnes` | `forms.read` | mk_campaigns.site_id |
| Automatisations | **exposer — garantir la coque** | `/sites/N/automatisations` | `forms.read` | mk_automations.site_id |
| Tunnels | **exposer — garantir la coque** | `/sites/N/tunnels` | `forms.read` | mk_funnels.site_id |
| Analytics | **exposer — garantir la coque** | `/sites/N/analytics` | `forms.read` | mk_events / mk_conversions .site_id |

## 4. Ce qui est déjà compatible avec un site, et ce qui demande une adaptation

| Catégorie | Éléments | Preuve |
|---|---|---|
| **Déjà compatible, exposition seule** (aucun changement de logique) | Tableau de bord, Pages, Composants, Redirections, Équipe du site, Réglages (fiche), Tests A/B, Santé du site, Outils : Importer, Exporter, Diagnostic, Maintenance*, Contenu ; Paramètres : Général, Lecture, SEO, Confidentialité, Indexation, Emailing ; Emailing ×6, Analytics | `tools.js` : 21 adresses toutes `withSite` ; `settings.js` : `scopeOf` + `defsFor` ; sonde : contenu qui change avec `?site=` pour Emailing, Analytics, Santé, Paramètres, Utilisateurs |
| **À adapter d'abord** | Corbeille (route sans filtre), Liens cassés (filtre à établir), Permaliens (accès d'un membre limité), Inviter et Invitations (site imposé, filtre) | `history.js:100` : `revisions.trashList({type,q,page})` sans site ; `index.js` `siteOfRequest` : aucune règle pour `/corbeille`, `/liens-casses`, `/permaliens`, `/utilisateurs` |
| **Héritées (lecture seule)** | Rôles, Permissions ; Paramètres : Permaliens, Tunnels, Avancé | Rôles = organisation (`roles.manage`) ; 0 réglage de site pour Permaliens/Tunnels (`defsFor({siteId})`) |
| **Indisponibles** | Articles, Catégories/Étiquettes, Auteurs, Commentaires, Médias, SEO (écrans), Modèles/Patterns ; Navigation et Apparence détaillée (P2) ; Paramètres : Commentaires, Médias ; Caches | Inventaire des tables : `a-isoler-B2..B6` ; `appearanceEditor.js` appelle toujours `appearance.*(null)` |
| **Hors menu d'un site** | Mes sites (déjà dans le fil d'Ariane), Sauvegardes, Informations système, Journal d'activité | `cmsScreens.js` : `backups.list()` et `auditLog(ctx,100)` sans filtre de site |

\* La portée exacte de « Maintenance » (ce que chaque action touche) est à confirmer par un test avant exposition (§12).

## 5. Les neuf écrans qui perdent le contexte du site

**Cause commune (lue dans le code et observée) :** `top.ejs` choisit la coque d'après la clé `active` de l'écran. Les écrans d'Emailing et d'Analytics utilisent des clés du menu Marketing (`campaigns`, …), ceux de Tests A/B et d'Outils la clé du CMS principal (`pagetests`, `outils`). Le menu d'un site de B1 utilise ses propres clés (`espace/tests-ab`…). **Aucune ne correspond** : `buildSiteNav` renvoie `null` et l'écran retombe sur le menu Marketing ou celui du principal, sans bandeau. Le **site reste correct** (le filtre `?site=` fonctionne) ; c'est le **cadre** qui disparaît.

**Correctif commun :** (1) clés identiques entre registre et projection (§1) ; (2) un site « en contexte » peut aussi venir de la requête vérifiée (`req.mk.siteId`, déjà calculé par `siteOfRequest`), pas seulement du chemin ; (3) le bandeau et le menu du site s'affichent dès qu'un écran **déclaré propre au site** est servi dans un contexte de site. Règle de sécurité : le site n'est **jamais** pris dans un paramètre libre non vérifié ; un écran d'organisation qui accepte `?site=` comme simple filtre (liste des utilisateurs, par exemple) n'active **pas** l'espace du site.

| # | Écran | Adresse actuelle | Coque actuelle | Site déterminé par | Membre limité à un site | Spécifique à traiter | Test dédié |
|---|---|---|---|---|---|---|---|
| 1 | Listes | `/marketing/listes?site=N` | Marketing | `?site=` (liste) ou site de la ressource (détail) — `siteOfRequest`, regex campagnes/listes/segments/modeles/automatisations/tunnels | Autorisé pour son site (règle existante, Palier 16) | Le sélecteur de site de la page (`sitesList`, `siteFilter`) doit être **figé** sur le site du contexte, pas proposer d'autres sites | navigation + A/B + membre limité |
| 2 | Segments | `/marketing/segments?site=N` | Marketing | idem | idem | idem | navigation + A/B + membre limité |
| 3 | Modèles d'e-mail | `/marketing/modeles?site=N` | Marketing | idem | idem | idem ; ne pas confondre avec « Modèles de pages » (B3) | navigation + A/B + membre limité |
| 4 | Campagnes | `/marketing/campagnes?site=N` | Marketing | idem | idem | idem ; le détail `/campagnes/ID` prend le site de la campagne | navigation + A/B + membre limité |
| 5 | Automatisations | `/marketing/automatisations?site=N` | Marketing | idem | idem | idem ; historique et simulation par ID | navigation + A/B + membre limité |
| 6 | Tunnels | `/marketing/tunnels?site=N` | Marketing | idem | idem | idem ; rattachement des étapes aux pages d'un site à vérifier par test | navigation + A/B + membre limité |
| 7 | Tests A/B | `/marketing/site-web/tests-ab?site=N` | CMS principal (clé `pagetests`) | `?site=` en GET ; site de la page pour une expérience | Autorisé en GET pour son site (Palier 22) | Clé du registre déjà CMS : le correctif de clé suffit | navigation + A/B + membre limité |
| 8 | Analytics | `/marketing/analytics/global?site=N` | Marketing | `?site=` en GET | Autorisé en GET pour son site (Palier 21) | Export : adresse reconnue comme l'écran (`siteOfRequest`) ; écrans de comparaison à vérifier | navigation + A/B + membre limité |
| 9 | Santé du site | `/marketing/site-web/outils?site=N` | CMS principal (clé `outils`) | `?site=` (`withSite`) | Autorisé (règle `outils`/`parametres`) | Le sélecteur de site de la page Outils doit rester sur ce site | navigation + A/B + membre limité |

**Adresses :** chaque écran devient joignable en `/sites/N/<module>` (D14). Le moyen retenu est une **délégation interne** : une règle placée avant les routeurs existants réécrit `/sites/N/campagnes` en `/campagnes?site=N` pour le routeur existant et fixe le contexte de site. Les écrans et leurs formulaires ne sont pas réécrits. Les anciennes adresses `?site=` continuent de fonctionner (compatibilité). Après un enregistrement, la redirection d'un écran existant mène à l'adresse historique avec `?site=N` : le cadre du site doit y rester (point de test).

## 6. Outils, Paramètres, Utilisateurs, Redirections, Corbeille

### 6.1 Outils (`web/tools.js`, `services/tools/*`)

| Écran | Route (historique) | Permission | Données | Décision |
|---|---|---|---|---|
| Santé du site | GET /site-web/outils ; POST /outils/sante | `tools.view`, `tools.health` | par site (`withSite`) | exposer |
| Importer | GET/POST /outils/importer ; /importer/:id[/confirmer|/defaire] | `tools.import` | par site ; opération rattachée à son site (`runs.site_id`) | exposer |
| Exporter | GET/POST /outils/exporter ; /exporter/:id[/fichier] | `tools.export` | par site | exposer ; vérifier que l'export d'un site ne contient que ce site (test) |
| Diagnostic | GET /outils/diagnostic ; POST /integrite, /corriger | `tools.view`, `tools.health`, `tools.content` | par site | exposer |
| Maintenance | GET/POST /outils/maintenance | `tools.maintenance` | par site (`tools/maintenance.js`) | exposer après test de portée |
| Outils de contenu | GET /outils/contenu ; POST /simuler, /remplacer/:id, /action | `tools.content` | par site ; simulation avant remplacement | exposer |
| Opérations (suivi) | GET /outils/operations/:id.json ; POST /annuler | `tools.view` | le site de l'opération décide des droits (IDOR traité) | exposer (support des écrans ci-dessus) |
| Caches | GET/POST /outils/cache | `tools.cache` | n/a | indisponible (« Bientôt » aussi dans le principal) |
| Informations système | GET /outils/systeme | `tools.view` | plateforme | hors menu d'un site |
| Sauvegardes, Journal | `cmsScreens.js` (génériques) | `tools.view` | organisation, sans filtre de site | hors menu d'un site |

### 6.2 Paramètres (`web/settings.js`, `services/settings/index.js`)

Le moteur est déjà à deux portées : `defsFor({siteId})` renvoie les réglages **propres à un site**, avec les défauts de l'organisation. Mesure (lecture directe du moteur) :

| Groupe | Réglages propres à un site | Réglages du principal | Décision |
|---|---|---|---|
| Général | 9 | 7 | exposer |
| Lecture | 1 | 2 | exposer |
| SEO | 3 | 5 | exposer (3 réglages) |
| Confidentialité | 1 | 2 | exposer |
| Indexation | 1 | 1 | exposer |
| Emailing | 3 | 3 | exposer |
| Commentaires | 0 | 6 | indisponible (dépend du blog, B5) |
| Médias | 0 | 4 | indisponible (dépend des médias, B2) |
| Permaliens | 0 | 1 | hérité, lecture seule |
| Tunnels | 0 | 3 | hérité, lecture seule |
| Avancé | — | — | hérité, lecture seule (plateforme) |

Permission : `settings.read` (écriture selon le moteur). Règle d'héritage : un réglage non renseigné pour le site affiche la valeur héritée **avec la mention de son origine** ; « Réinitialiser » (`POST /parametres/reinitialiser`) ramène à l'héritage. Les groupes à 0 réglage ne sont pas inventés : ils sont soit hérités soit indisponibles.

### 6.3 Utilisateurs (`web/users.js`, `services/cmsAccess.js`)

Les rôles et leurs permissions sont **une seule définition pour l'organisation**. Un utilisateur a un rôle d'organisation et/ou des rôles **par site** (`mk_site_members`). Dans l'espace d'un site :

| Écran | Décision | Règle |
|---|---|---|
| Équipe du site | exposer (en place) | Les personnes qui ont accès à CE site |
| Inviter | adapter | Invitation **limitée à ce site** ; le site vient de l'adresse ; rôle choisi parmi les rôles autorisés à l'inviteur (garde-fous d'escalade existants) |
| Invitations | adapter | Invitations en attente **de ce site** seulement ; renvoyer/révoquer contrôlé dans le contexte du site |
| Rôles, Permissions | hérité | Lecture seule, mention « commun à tous les sites » ; aucune création/édition de rôle depuis un site (`roles.manage` reste d'organisation) |

### 6.4 Redirections, Liens cassés, Permaliens (`web/urls.js`, `seo/redirects.js`, `services/urls.js`, `services/brokenLinks.js`)

- **Redirections :** déjà en place, filtrée par `seo_redirects.site_id` (`redirects.view`, `create`, `edit`, `delete`).
- **Liens cassés :** analyse des pages et menus ; `brokenLinks.js` ne référence le site qu'une fois → **adapter** : n'analyser et ne montrer que les liens des pages de ce site (menus : voir P2).
- **Permaliens :** le moteur accepte déjà `?site=` ; il manque la règle d'accès d'un membre limité (`siteOfRequest`) → couverte par l'adresse `/sites/N/permaliens`.

### 6.5 Corbeille (`web/history.js`, `services/revisions.js`)

Le service `revisions` porte `site_id` (`cms_revisions`) mais la route `GET /site-web/corbeille` appelle `trashList({type,q,page})` **sans site** et `trashCounts()` sans site. **Exposer l'entrée telle quelle ferait apparaître, dans l'espace d'un site, les éléments supprimés de tous les sites.** Adaptation requise avant exposition : filtre de site sur la liste, les compteurs et les actions groupées (`POST /corbeille/actions` : chaque identifiant doit être revérifié contre le site) ; permission `revisions.view` + permission de chaque type. Tant que cette adaptation et ses tests ne sont pas faits, l'entrée reste « Bientôt ».

## 7. Réutilisation : pas de deuxième CMS

| On réutilise | On ne crée pas |
|---|---|
| Le registre `SECTIONS` (source unique), ses clés et ses permissions | Un second registre de menu |
| Les écrans et routeurs existants (`tools`, `settings`, `urls`, `users`, `campaigns`, …) et leurs formulaires | Des copies d'écrans « version site » |
| `siteContext.resolve` / `effectivePermissions(utilisateur, site)` pour décider du site et des droits | Une nouvelle logique de droits |
| Le bandeau `site-banner.ejs`, `cms-screen.ejs`, `cms.css`, la barre du haut et le sélecteur de site de B1 | Un nouveau cadre visuel |
| `siteScope.js` (B1) pour les filtres des écrans propres à P1 | Un autre mécanisme de filtrage |

Ce qui est **supprimé** : `buildSiteNav`/`siteSections` (définition parallèle de B1), remplacés par la projection. Ce qui est **ajouté** : le champ `site` du registre, la règle de délégation `/sites/N/<module>`, l'extension de `siteOfRequest` pour les modules nouvellement exposés, quelques adaptations de routes (§6).

## 8. Plan de tests

**Principe :** aucune entrée n'est exposée sans ses tests ; le test d'inventaire ci-dessous rend l'oubli impossible.

| Famille | Contenu | Critère |
|---|---|---|
| **Inventaire généré du registre** | Pour chaque entrée du registre et chaque contexte (principal, site) : traitement déclaré, réponse attendue (200 / 403 / écran « Bientôt »), coque du site, état affiché = état réel | 100 % des entrées couvertes ; échec si une entrée « exposée » ne répond pas ou sort de la coque |
| **Navigation** | Menu identique en structure (14 groupes + « Marketing du site ») ; entrée active correcte sur chaque écran ; fil d'Ariane ; retour après chaque action | 0 entrée sans état ; 0 écran exposé hors coque |
| **Autorisations** | Pour chaque module exposé : propriétaire, éditeur, lecteur du site, rôle d'organisation, utilisateur sans accès, **compte limité au site A** | 200/403 conformes à la matrice des permissions ; 0 élévation de droits |
| **Isolation A/B** | Deux sites avec des données distinctes ; sur chaque module exposé : lister, ouvrir, modifier, supprimer, exporter ; identifiants du site B envoyés depuis le site A (IDOR) ; ligne du site A jamais dans une réponse du site B ni du principal | 0 fuite sur 100 % des modules exposés ; chaque test nommé d'après le module |
| **Adaptations (§6)** | Corbeille filtrée (liste, compteurs, actions groupées) ; Inviter/Invitations limités au site ; Liens cassés ; Permaliens avec compte limité | Chaque adaptation a un test d'échec avant correctif et de réussite après |
| **Héritage** | Paramètres hérités en lecture seule ; écriture refusée côté serveur (pas seulement bouton masqué) | POST sur un réglage hérité → refus |
| **Compatibilité du principal** | Toutes les adresses historiques ; menu du principal inchangé ; tests de menu existants inchangés | 0 test existant modifié sans justification écrite |
| **Chrome réel** | Menu du site : bureau et téléphone 375 px sans défilement horizontal ; bascule de site depuis un écran partagé ; chaque écran exposé garde le bandeau ; 0 erreur console | Captures conservées dans `docs/preuves/` |
| **Suite complète** | Après chaque sous-lot ; échecs préexistants (SMS « double confirmation » ; décalage de 46 px du canvas) restent documentés tels quels, jamais masqués | Aucune nouvelle régression ; comparaison chiffrée avec `553539c` (5051 tests, 5046 réussis, 2 échecs) |

## 9. Livraison en trois sous-lots, risques, retour arrière, preuves

| Sous-lot | Contenu | Pourquoi dans cet ordre | Migration |
|---|---|---|---|
| **P1a** | Projection du registre, clés communes, coque du site garantie sur les écrans **déjà** exposés (Emailing ×6, Tests A/B, Analytics, Santé), délégation `/sites/N/<module>` | Règle l'incohérence visible sans ajouter de logique ni de nouvelle donnée | aucune |
| **P1b** | Exposition des modules compatibles : Outils (Importer, Exporter, Diagnostic, Maintenance, Contenu), Paramètres (6 groupes + 3 hérités), Rôles/Permissions hérités | Pur gain de menu, déjà filtré par site | aucune |
| **P1c** | Adaptations puis exposition : Corbeille, Inviter, Invitations, Liens cassés, Permaliens | Seul sous-lot qui modifie de la logique : isolé pour limiter le risque | aucune |

Chaque sous-lot : tests ciblés → sécurité → Chrome réel → suite complète → rapport → **autorisation avant tout push/déploiement**.

### Risques

| Risque | Gravité | Mitigation |
|---|---|---|
| Régression du menu ou des routes du site principal | Haute | Le principal n'utilise pas le champ `site` ; tests de menu et d'adresses historiques inchangés ; comparaison avant/après de la sortie du menu du principal |
| Fuite entre sites sur un écran nouvellement exposé | Haute | Critères C1-C6 ; test A/B par module ; l'entrée « adapter » reste « Bientôt » tant que son test n'est pas vert |
| Corbeille exposée sans filtre | Haute | Classée « adapter » ; interdite avant adaptation et test (§6.5) |
| Site pris dans un paramètre libre | Haute | Le site vient de l'adresse/`req.mk.siteId` vérifiés ; un filtre `?site=` d'écran d'organisation n'active pas l'espace du site (test dédié) |
| Redirection après action vers une adresse sans cadre de site | Moyenne | Test de parcours complet par écran exposé ; cadre dérivé aussi de `req.mk.siteId` |
| Double définition (registre + projection) qui divergent | Moyenne | Une seule source ; le test d'inventaire compare le registre au menu rendu |
| Membre limité à un site : 403 inattendu sur un module exposé | Moyenne | Adresses `/sites/N/…` (déjà reconnues par `siteOfRequest`) ; test C4 par module |
| Ressources d'un autre site ouvertes par identifiant (IDOR) dans les écrans partagés | Haute | Contrôle du site de la ressource (déjà fait pour campagnes, listes, tests A/B, opérations) ; test d'IDOR par module |

### Retour arrière

- Aucune migration, aucune donnée modifiée par P1 : le retour arrière est un simple `git revert` du sous-lot concerné, sans effet sur les données de production.
- Les trois sous-lots sont indépendants et commités séparément : on peut revenir sur P1c sans toucher à P1a/P1b.
- Les adresses historiques n'étant jamais retirées, un retour arrière ne casse aucun lien existant.

### Preuves attendues pour valider chaque sous-lot

1. Résultats exacts des tests ciblés et de la suite complète (nombres réussis/échoués/ignorés/annulés, liste des échecs, comparaison avec `553539c`).
2. Rapport d'inventaire du registre : pour chaque entrée, traitement déclaré / réponse observée / coque.
3. Rapport d'isolation A/B par module.
4. Captures Chrome (bureau et téléphone) du menu du site et de chaque écran exposé.
5. Confirmation d'absence de migration et de modification de données de production.
6. Fichiers modifiés et commits.

## 10. Dépendances avec la suite

| Lot | Dépendance avec P1 |
|---|---|
| **P2 — Apparence et Menus par site** | Réutilise les clés et la projection de P1 : les entrées « Menus », « Éditeur du site », « Styles », « Patterns » passent de « Bientôt »/renvoi à « exposées » **sans changer le menu**. Prérequis propres à P2 : câbler `appearanceEditor.js` et `navigation.js` sur le site de l'adresse (aujourd'hui `null`), et **vérifier le rendu public** d'une apparence/menu par site (non étudié). Liens cassés dépendront aussi des menus de site. |
| **B2 — Médias** | Entrée « Médias » : « Bientôt » → exposée. Paramètres › Médias (0 réglage de site) : à rouvrir. Dépend du plan B2 (migration, essai de reconstruction). |
| **B3 — Modèles et blocs** | Entrées Templates et Patterns. |
| **B4 — Formulaires et contacts** | Groupe Formulaires/Contacts : entrées absentes du menu du principal CMS (elles sont dans Marketing) : à traiter avec D-P1-1. |
| **B5 — Blog** | 9 entrées Articles, 5 Commentaires, Paramètres › Commentaires. |
| **B6 — SEO** | 9 entrées SEO ; Paramètres › SEO reste exposé (3 réglages). |

Grâce au champ `site` du registre, **ouvrir un lot ultérieur = changer l'état de ses entrées et fournir ses tests** ; le menu ne se reconstruit plus.

## 11. Critères d'acceptation mesurables (P1 complet)

| # | Critère | Mesure |
|---|---|---|
| A1 | Structure identique | Le menu d'un site contient les **14 groupes** du principal dans le même ordre, plus « Marketing du site » |
| A2 | Aucune entrée sans état | Chacune des 66 entrées a un traitement parmi les 5 ; **0 entrée « exposée » qui ne répond pas** ; **0 entrée « Bientôt » qui affiche une donnée ou une action** |
| A3 | Entrées exposées | 21 exposées + 5 après adaptation (soit 26) ; 5 héritées en lecture seule ; 31 « Bientôt » ; 4 hors menu |
| A4 | Coque | **0 écran du menu d'un site hors du cadre du site** (aujourd'hui 9 sur 26) |
| A5 | Isolation | 0 fuite A/B sur 100 % des modules exposés, y compris par identifiant (IDOR) et par compte limité au site |
| A6 | Permissions | Chaque module exposé testé pour 5 profils ; 0 écart avec la matrice |
| A7 | Principal intact | Toutes les adresses historiques répondent comme avant ; menu du principal identique ; tests existants inchangés |
| A8 | Aucune migration, aucune donnée de production modifiée | Vérifiable par `git diff` (aucun fichier de migration) |
| A9 | Suite complète | Aucune nouvelle régression ; comparaison chiffrée avec `553539c` |
| A10 | Chrome réel | Bureau et 375 px sans défilement horizontal ; 0 erreur console |

## 12. Éléments non vérifiés

- Le filtrage de **Liens cassés**, **Invitations** et la portée exacte de **Maintenance** par site : établis seulement par la forme du code, à confirmer par test avant exposition.
- Les clés `active` exactes de chacun des six écrans d'Emailing et des écrans de comparaison d'Analytics : seul `campaigns` est relevé ; les autres seront relevés au sous-lot P1a.
- Le comportement exact des **redirections après action** des écrans partagés dans le cadre d'un site.
- La possibilité de **figer** le sélecteur de site interne des écrans d'Emailing et d'Outils sans modifier leurs vues.
- Le rendu **visuel connecté en production** (la sonde est locale).
- Le **rendu public** d'une apparence ou d'un menu par site (P2).
- Aucune parité avec les extensions tierces de WordPress n'est revendiquée.

## 13. Décisions nécessaires avant toute implémentation

| # | Décision | Recommandation |
|---|---|---|
| **D-P1-1** | Garder « Marketing du site » (Emailing + Analytics + Composants) dans le menu d'un site alors que le menu du principal n'en a pas | **Oui**, groupe distinct ; ne pas modifier le menu du principal |
| **D-P1-2** | Groupes dont tout est indisponible (Articles, Commentaires, SEO) : une ligne « Bientôt » par groupe, ou chaque sous-entrée visible | **Une ligne par groupe**, avec l'écran « Bientôt » listant ce qui viendra ; évite ~25 liens sans effet |
| **D-P1-3** | Rôles et Permissions dans un site : lecture seule héritée, ou absents | **Lecture seule héritée**, pour comprendre les droits de l'équipe du site |
| **D-P1-4** | Sauvegardes, Informations système, Journal d'activité : hors du menu d'un site | **Oui** (fonctions d'organisation) ; le Journal pourra rouvrir si un filtre par site est établi |
| **D-P1-5** | Paramètres sans réglage de site (Commentaires, Médias) : « Bientôt » ; (Permaliens, Tunnels, Avancé) : hérités | **Oui** |
| **D-P1-6** | Adresses `/sites/N/<module>` pour tous les modules (délégation interne) | **Oui** (cohérent avec D14 et utile aux comptes limités à un site) |
| **D-P1-7** | Livrer P1a, P1b, P1c séparément, chacun avec suite complète et autorisation | **Oui** |
| **D-P1-8** | Corbeille : adapter dans P1c, ou la laisser « Bientôt » jusqu'à P2 | **P1c** si vous acceptez qu'elle touche `history.js`/`revisions` ; sinon « Bientôt » |
