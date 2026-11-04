# Theme Builder : unique gestionnaire de l'en-tête et du pied de page

État au 3 novembre 2026. Ce document décrit ce qui a été supprimé, ce qui le remplace, et ce qui reste à faire.

## Pourquoi les suppressions précédentes n'avaient pas abouti

Les entrées « En-tête » et « Pied de page » du menu **Design → Apparence** étaient enregistrées à deux endroits de `src/marketing/web/cmsNav.js` :
le registre `SECTIONS` (les deux `leaf(...)`) et la table `ABILITY` (qui dit ce qu'elle devient dans un site).
Le travail précédent n'avait traité que le menu **d'un site créé** (`mode: "central"` dans `ABILITY`, redirections 301). Le menu du **site principal**,
qui reprend le registre tel quel (`projectItem` : `if (space.principal) …`), affichait donc toujours les deux entrées, avec leurs écrans (`appearanceEditor.js`,
`views/marketing/appearance-editor.ejs`) et leurs actions POST.

La raison de fond : le Theme Builder n'existait pas pour le site principal (`site_id` obligatoire en base, entrée de menu `siteOnly`),
donc supprimer les écrans aurait supprimé toute édition de l'en-tête et du pied de kolakisa.com.

## Ce qui a été fait

| Élément | Avant | Après |
|---|---|---|
| Menu Apparence (site principal, sites, gestionnaire central) | « En-tête », « Pied de page » | absents ; « Theme Builder » présent partout |
| `/marketing/site-web/apparence/en-tete` et `/pied-de-page` (GET) | écrans d'édition | redirection 301 vers le Theme Builder du site principal (`?type=header` / `?type=footer`) |
| Mêmes adresses (POST) | enregistrement du brouillon | supprimées (404) |
| Personnalisateur | panneaux « En-tête » et « Pied de page » | une seule ligne « Theme Builder » (les réglages stockés restent en base) |
| Éditeur du site (`siteEditor`), Réglages généraux, Confidentialité | liens vers les anciens écrans | liens vers le Theme Builder |
| Base de données | `mk_tb_templates.site_id NOT NULL` | nullable : `NULL` = site principal (migration `128_theme_builder_site_principal.sql`, modèles et versions recopiés tels quels) |
| Rendu public du site principal | habillage d'apparence uniquement | en-tête, pied, barre latérale et modèles personnalisés du Theme Builder s'ils sont publiés ; sinon habillage d'origine |

## Ce que le Theme Builder pilote désormais

Site principal **et** sites créés : création, composition (Page Builder), conditions d'affichage, versions, aperçu, publication, archivage, import/export.
Les données restent isolées : chaque requête filtre `organization_id` ET `site_id IS ?` ; un modèle du principal est introuvable (404) par l'adresse d'un site, et réciproquement ;
un accès limité à un site ne voit jamais le site principal.

## Interface

Refonte visuelle du Theme Builder : barre marine, panneaux étagés, barre d'outils en panneau, cartes à ombre douce sans déplacement, états de focus nets.
Clair / sombre / automatique : l'interrupteur de la barre pilote `<html data-kola-theme>` / `data-kola-pref` et la clé `kolaTheme`, c'est-à-dire le système de thème global de l'administration (aucun système parallèle).

## Points restant à traiter

* Les **réglages d'apparence du principal** (logo, bandeau d'annonce, bouton d'action, recherche/panier/compte, marque et mentions du pied) restent en base et continuent d'habiller le site
  tant qu'aucun modèle d'en-tête / de pied n'est publié dans le Theme Builder. Ils ne sont plus modifiables : ils n'ont **pas** été convertis automatiquement en modèles
  (ce sont des réglages structurés, pas des documents du Page Builder). Les reproduire se fait avec un modèle de la bibliothèque.
* Un modèle d'en-tête ou de pied publié pour le site principal s'applique à toutes ses pages du Page Builder, pages d'atterrissage comprises (comme pour un site créé).
