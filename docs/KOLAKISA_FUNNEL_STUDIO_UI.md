# Funnel Studio — phase 1 (interface)

Écran : **Marketing → Tunnels** (`/marketing/tunnels`). Vue : `views/marketing/funnels.ejs` ; styles : `public/css/funnel-studio.css` (chargé seulement sur cet écran, drapeau `funnelStudio` de `partials/top.ejs`) ; script : `public/js/funnel-studio.js` (recherche, affichage seulement) ; tests : `tests/funnel-studio-ui.test.js`.

## Audit : ce qui existait déjà

Le module Tunnels est **fonctionnel** (liste, archives, création réelle depuis des modèles, page de tunnel, statistiques sur 30 jours : `src/marketing/web/funnels.js`, `src/marketing/funnels/*`). La phase 1 n'a donc **rien remplacé** : la nouvelle interface habille ce module, avec ses vraies données. Aucune route, aucune migration, aucune écriture ajoutée.

| Réutilisé | Où |
|---|---|
| Coque Marketing, barre principale et secondaire (entrée « Tunnels » + raccourci « Créer un tunnel ») | `partials/top.ejs`, `src/marketing/web/nav.js` : inchangés |
| Indicateurs `kx-kpis` / `mk-stat` / `kx-kpi-icon` | `public/css/kola-compose.css` |
| Onglets `mk-tabs`, état vide `mk-empty` + `illu("filter")`, boutons `btn*`, `icon-btn` | design system existant |
| Menu déroulant `data-mk-dropdown` (clavier, positionnement flottant, Échap) | `public/js/mk/shell.js` |
| Boîte « Nouveau tunnel » (formulaire, modèles, site) et `modal-reopen` | conservées telles quelles |
| Filtre de site `partials/site-filter` | conservé |

## Réalisé

- En-tête : « Funnel Studio », « Tunnels de vente », sous-titre, **Modèles** et **Créer un tunnel** (bouton scindé avec menu).
- Cinq indicateurs : Tunnels, Visiteurs, Contacts générés, Ventes, Taux de conversion. Valeurs **calculées depuis les vrais rapports** (entrées, inscriptions, conversion pondérée) ; « — » quand la source manque ; **Ventes** signalées « Bientôt / Pas encore raccordées ».
- Liste : une carte par tunnel (nom, description, état Actif/Archivé, nombre d'étapes, date de modification, entrées / inscriptions / conversion, emplacement « Domaine : — », ouvrir) ; recherche côté navigateur ; onglets Tunnels / Archivés.
- État vide professionnel avec « Créer le premier tunnel ».
- Colonne « studio » : Activité récente (vide, dite telle) et « Dans le studio » (Étapes, Modèles de pages, Réglages, Performances détaillées : inactifs, « Bientôt »).
- Responsive : 5 colonnes d'indicateurs ≥ 1240 px, auto-ajusté ensuite, 2 colonnes ≤ 560 px ; colonne studio sous la liste ≤ 1180 px.

## Interactions volontairement décoratives (aucune opération métier)

- Les 5 types de tunnel du menu « Créer » (`aria-disabled`, sans lien ni formulaire).
- Bouton « Filtres », bouton d'actions de chaque carte, « Domaine : — », indicateur Ventes, zones du studio.

## Conservées et fonctionnelles

« Créer un tunnel », « Modèles » et « Créer le premier tunnel » ouvrent la **vraie** boîte de création existante (aucun changement de comportement) ; onglets, liens vers chaque tunnel, recherche.

## Préparer la suite

- Types de tunnel : brancher chaque entrée du menu sur `templates.catalog()` (déjà chargé dans la vue).
- Ventes : `funnelReport` calcule déjà `steps[].sales` pour les étapes de paiement ; à agréger quand le palier paiement sera raccordé.
- Domaine / URL : à lire de la première étape (page publiée) dans le modèle de `listFunnels`.
- Actions de carte : dupliquer / renommer / archiver existent côté route ; à exposer dans un `data-mk-dropdown`.
- Zones du studio : reliées à la page de tunnel (`funnel.ejs`) puis à l'éditeur de pages existant (à réutiliser, jamais à remplacer).
