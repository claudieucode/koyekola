# Programme 20.2 — Intégration du Site Builder (implémentation)

Branche `feat/programme-20-2-site-builder`, issue de `origin/main` b27d7c25. 2026-10-29.

## Constat d'audit : les documents du Programme 20.1 n'existent pas
Aucun document « Programme 20.1 » dans le dépôt. Les documents les plus proches ont servi de base : `KOLAKISA_PALIER_1_SITE_MANAGER.md`, `KOLAKISA_ADMIN_MULTISITE.md`, `KOLAKISA_MULTISITE_DOMAINES.md`, `KOLAKISA_PALIER17_SITE_ISOLATION.md`. Chaque affirmation a été revérifiée sur le code et sur un serveur réel (captures Chrome, ouverture des pages par un compte autorisé et par un compte d'un autre site).

## Ce qui existait déjà et a été réutilisé tel quel (vérifié à l'exécution)
| Besoin du programme | Existant | Vérification |
|---|---|---|
| Tableau de bord central « Mes sites » | `/marketing/site-web/sites` (`web/siteWeb.js`, `views/marketing/sites.ejs`) : données réelles (pages, en ligne, équipe, contacts, domaine, modules, date), recherche, filtres Actifs / Archivés / Supprimés, état vide, site principal | capture Chrome avec 2 sites créés, 0 débordement à 1360 et 390 px |
| Créer / configurer / dupliquer / archiver / restaurer / supprimer | `pages.createSite`, `updateSite`, `/dupliquer`, `/archiver`, `/restaurer`, `/supprimer` | `gestionnaire-de-sites.test.js` |
| Contexte d'administration par site | `/marketing/site-web/sites/:id/...` + `cmsAccess` / `siteContext` : bandeau « Vous êtes dans le site … », menu du site, retour « Mes sites » | capture de l'espace d'un site |
| Domaines | `web/siteDomains.js`, `services/siteDomains.js` : preuve de propriété (TXT), DNS, adresse de plateforme **non proposée** si `PLATFORM_DOMAIN` est absent | capture : le message dit explicitement ce qui n'est pas disponible |
| Modules par site | `web/siteModules.js`, `marketing/siteModules.js` | `modules-par-site.test.js` |
| Pages, éditeur, brouillon, publication | `pages/index.js`, `web/landing.js`, éditeur `page-builder.js` ; sauvegarde conditionnelle sur la révision (409 en cas de conflit) | tests existants + palier 16 |
| Isolation | `siteContext`, `cmsAccess`, `siteScope`, contrôles par route | 82 fichiers de tests liés aux sites (voir le rapport de tests) |

## Modifications apportées (les seules)
1. **Création d'un site atomique** — `src/marketing/pages/index.js` `createSite` : l'insertion du site, l'écriture du journal et l'adresse de plateforme sont dans une seule transaction (`transaction()` du dépôt, imbriquable). Avant : si l'écriture du journal échouait après l'insertion, le site restait créé sans que l'utilisateur en soit informé. Preuve : le test d'atomicité échoue sans le correctif (mutation vérifiée) et passe avec.
2. **Prévention de la double soumission** — `public/js/mk/shell.js` : attribut générique `data-mk-once` (un seul envoi, bouton marqué occupé, rétabli au retour par l'historique) ; posé sur le formulaire « Créer un site ». Avant : deux clics rapides créaient le site puis affichaient une erreur « Un site porte déjà ce nom » qui masquait le succès.
3. **États réels dans la liste** — `views/marketing/sites.ejs` : pastille **« Publié »** (au moins une page du site est en ligne) ou **« En préparation »** (aucune), calculées à partir des pages réelles ; aucune pastille pour un site archivé ou supprimé.
4. **Accès aux réglages depuis la liste** — entrée « Réglages » ajoutée au menu ⋮ de chaque site actif (même route et même droit `forms.read` que l'existant).

## Écarts de la spécification NON comblés (et pourquoi)
- **Champs de création langue / pays / fuseau / identité graphique / domaine** : le modèle `mk_sites` n'a pas ces colonnes (champs : nom, identifiant, description, type, design system). Les ajouter créerait des paramètres sans source de vérité ; le domaine se règle juste après dans « Domaines ». Non fait.
- **Création à partir d'un modèle** : il n'y a pas de modèles de site ; la **duplication** d'un site existant (menu ⋮) joue ce rôle. Non fait.
- **Changement rapide de site dans une même page** : dans le CMS, le site est dans l'adresse (`/sites/:id/...`), il n'y a pas d'état de site « actif » à désynchroniser ; le sélecteur à mémoire de session existe pour `/formateur` (voir `KOLAKISA_ADMIN_MULTISITE.md`).
- **Lien « Voir le site » public dans la liste** : non ajouté, car un site sans domaine ni page en ligne n'a pas d'adresse publique fiable à proposer.
