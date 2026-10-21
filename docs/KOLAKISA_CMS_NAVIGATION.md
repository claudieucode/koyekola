# KOLAKISA CMS — Architecture de navigation (palier CMS-01/02)

Branche `cms-01-navigation`, issue de `origin/main` (`6adf8df`). Ce document décrit l'état **réel** après ce palier. Il complète `KOLAKISA_CMS_PARITE_AUDIT.md` et `KOLAKISA_CMS_P1_PLAN.md` (audit et plan antérieurs, non refaits).

## 1. Ce qui existait déjà (audit résumé, aucune reconstruction)

- **Un seul registre** : `src/marketing/web/cmsNav.js` (`SECTIONS`). Il produit le menu du gestionnaire central, celui du site principal et celui de chaque site créé (`projectSections`), ainsi que le fil d'Ariane.
- **Une seule coque** : `views/marketing/partials/top.ejs` + `cms-nav.ejs` + `cms-topbar.ejs`, habillage `public/css/cms.css`, comportements `public/js/mk/shell.js` (repli mémorisé, tiroir mobile, sections dépliables).
- **Multi-site** : le site vient de l'adresse vérifiée par le serveur (`/marketing/site-web/sites/<id>/…`), jamais d'un champ client ; permissions par site (`effectivePermissions`), accès « limité à un site » (`req.mk.siteOnly`), modules activables par site (`mk_site_modules`, `siteModules.js`).
- Aucun écran « bientôt » n'existait déjà (test `cms-interface`) : chaque entrée mène à une fonction réelle.

## 2. Changements de ce palier

| Changement | Fichiers |
|---|---|
| Ordre des rubriques aligné sur la référence WordPress : Tableau de bord, Pages, Articles, **Médias, Commentaires, Apparence, Extensions**, Utilisateurs, SEO, Redirections, Tests A/B, **Marketing du site, Navigation**, Outils, Paramètres | `cmsNav.js` |
| Nouvelle rubrique **Extensions** (gestionnaire central, équipe uniquement) : matrice réelle site × module | `cmsNav.js`, `cmsScreens.js`, `cmsData.js` (`moduleMatrix`) |
| Les rubriques `centralOnly` ne reçoivent jamais le cadre d'un site (`isCentralKey`) | `cmsNav.js`, `helpers.js`, `top.ejs` |
| Entrées `teamOnly` : refus **côté serveur** d'un accès limité à un site | `cmsScreens.js` |
| Commande « **Replier le menu** » en bas du panneau (en plus du bouton d'en-tête), même état mémorisé | `top.ejs`, `shell.js`, `cms.css` |
| Tests | `tests/cms-01-navigation.test.js` (nouveau), `tests/cms-interface.test.js` (ordre mis à jour) |

Aucune migration, aucune nouvelle table, aucune nouvelle permission (`sites.modules` existait).

## 3. Registre : champs d'une entrée

`key` (stable), `label`, `href`, `status` (`live`/`preview`), `permission` (ou `anyOf`), `primary` (action principale), `teamOnly` (nouveau : équipe de l'organisation seulement). Une rubrique porte `key`, `label`, `icon`, `items`, `centralOnly`. Dans l'espace d'un site, `ABILITY` dit ce que devient chaque entrée : `link`, `open` (écran ouvert dans le cadre du site), `central` (absente du menu d'un site) ; une entrée non listée apparaît en « Bientôt », grisée, sans action.

Ajouter une rubrique : l'ajouter à `SECTIONS`, lui donner une route (routeur générique `cmsScreens` via `GENERIC_SECTIONS`, ou route propre), puis déclarer son comportement dans `ABILITY` si elle doit s'ouvrir dans un site. Un test (`cms-01-navigation`) vérifie unicité des clés, des adresses et que chaque écran répond 200 avec son entrée courante.

## 4. Matrice WordPress / Kolakisa

| WordPress (capture) | Kolakisa | État |
|---|---|---|
| Tableau de bord (Accueil, Mises à jour) | Site principal › Tableau de bord ; tableau de bord par site | Fonctionnel. Pas de « Mises à jour » : aucun mécanisme de mise à jour d'extensions n'existe (pas de badge fictif) |
| Articles | Articles (tous, ajouter, brouillons, programmés, publiés, corbeille, catégories, étiquettes, auteurs) | Fonctionnel, isolé par site |
| Médias | Médias | Fonctionnel, isolé par site |
| Pages | Pages (Page Builder) + Composants | Fonctionnel |
| Commentaires | Commentaires (tous, en attente, approuvés, indésirables, corbeille) | Fonctionnel, isolé par site |
| Témoignages / WPForms | « Marketing du site » › Formulaires, Contacts, Listes… | Fonctionnel (module propre à Kolakisa) |
| Apparence | Apparence (éditeur, templates, patterns, styles, en-tête, pied de page, menus) | Fonctionnel ; templates/patterns en lecture seule |
| Extensions | **Extensions** (nouveau) : modules par site | Fonctionnel pour l'activation (écran existant par site). Pas de catalogue d'installation ni de mises à jour : à définir |
| Comptes | Utilisateurs (liste, inviter, rôles, permissions, invitations) ; équipe par site | Fonctionnel |
| Outils | Outils (santé, importer, exporter, sauvegardes, diagnostic, maintenance, caches, logs) | Fonctionnel ; sauvegardes/système/journal d'organisation restent centraux |
| Réglages | Paramètres (11 sous-pages) | Fonctionnel |
| Replier le menu | Bouton d'en-tête + « Replier le menu » en bas | Fonctionnel, mémorisé |
| Propre à Kolakisa | SEO, Redirections, Tests A/B, Navigation, Marketing du site | Conservés |

## 5. Points d'attention et reportés

- **Navigation vs Apparence › Menus** : deux entrées pour le **même** écran et le même service (`apparence/menus` est un alias contextuel de `navigation`). Conservé pour ne pas casser les liens existants ; à trancher au palier Apparence.
- **Badges** : aucun. Les compteurs (commentaires en attente, mises à jour) exigent un comptage par site ; non fait pour ne pas risquer de fuite inter-site. À traiter avec le palier Commentaires.
- **Extensions** : pas de catalogue, d'installation ni de mises à jour. Le registre est fermé (`siteModules.MODULES`, 6 modules ; « Formations » activable mais pas encore ouvert aux sites).
- **Tableau de bord** : la rubrique s'appelle encore « Site principal » (libellé historique couvert par des tests).
- Contrôle visuel en navigateur réel et responsive : voir le rapport de tests.
