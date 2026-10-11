# KOLAKISA — Palier 1 : Site Manager

## Ce qui existait (audit du palier 0, vérifié)
`mk_sites` (id, organization_id, name, status active/archived, tokens, settings, home_page_id…), `mk_site_members` (rôle par site), création / duplication / archivage / restauration (`src/marketing/pages/index.js`), écrans `/marketing/site-web/sites[/:id]`, contrôle d'accès `web/index.js` + `cmsAccess.js`. Le Site Manager **réutilise** tout cela : aucune nouvelle entité « site ».

## Modèle de données (migration 070, additive et réversible)
`mk_sites` reçoit : `slug` (identifiant lisible, unique par organisation via index partiel), `description`, `site_type`, `deleted_at`, `deleted_by`. L'identifiant numérique `id` ne change jamais (renommage, changement de slug). Les sites existants reçoivent leur slug au premier affichage (code, sans perte). Retour arrière : en-tête du fichier SQL.
Le « site maître » n'est pas une ligne de `mk_sites` (ses contenus ont `site_id NULL`) : il ne peut donc pas être supprimé ni archivé par le Site Manager.

## Parcours
Menu « Site Web » → **Mes sites** (`/marketing/site-web/sites`, première entrée du menu, lien de la marque du CMS) → **Ouvrir** → espace du site (`/marketing/site-web/sites/:id`) avec bandeau « Espace d'administration du site … », identifiant, retour « ← Mes sites ». Le tableau de bord de statistiques existant reste accessible sous « Site principal » (`/marketing/site-web`).

## Fonctions
Liste (nom, identifiant, type, description, état, domaine si configuré, pages, en ligne, date de création) ; recherche (nom, identifiant, description) ; filtres Actifs / Archivés / Supprimés / Tous avec compteurs ; création (nom, identifiant, description, type) ; réglages (mêmes champs + page d'accueil) ; duplication « réglages + pages (brouillons) » ou « réglages seulement » ; archivage / restauration ; suppression logique (corbeille) réservée à un site archivé, avec saisie du nom, récupération possible.
Non copié par la duplication : médias, tunnels, articles, contacts (jamais).

## Routes
Modifiées : `GET/POST /marketing/site-web/sites`, `POST /sites/:id`, `POST /sites/:id/dupliquer` (champ `contenu`). Ajoutées : `POST /sites/:id/supprimer`, `POST /sites/:id/recuperer`.

## Permissions (côté serveur)
Lecture `forms.read`, écriture `forms.write`, suppression `forms.write` + `pages.delete` **et** appartenance à l'équipe (un membre limité à un site ne peut ni créer ni supprimer). Un membre d'un seul site est redirigé vers « Mes sites » et reçoit 403 sur tout autre site (contrôle existant de `web/index.js`, testé).

## Tests
`tests/gestionnaire-de-sites.test.js` : 14 tests (vraies routes, vraie base) — accès, état vide, validation, création, unicité, actualisation, recherche (caractères spéciaux), ouverture/retour, réglages et persistance, slug des anciens sites, duplication, filtres, suppression sécurisée/corbeille/récupération, permissions (déconnecté, sans accès, membre d'un site). `tests/cms-interface.test.js` mis à jour pour les nouveaux libellés du menu.

## Limites connues / non fait
- Pas de rendu vérifié dans un navigateur réel (pages rendues et testées côté serveur uniquement) ; l'ouverture de la fenêtre « Créer un site » réutilise le composant existant.
- Pas de rechargement partiel ni d'état de chargement : écrans rendus par le serveur ; pas de pagination (tri par date, toute la liste).
- Domaine, SEO et modules non gérés depuis cet espace (signalé « À venir »).
- Le propriétaire est la création par `created_by` + l'accès via `mk_org_members`/`mk_site_members` ; pas de rôle `owner` par site.
- Isolation des articles, taxonomies, médias, contacts : **Palier 2**.

## À traiter au Palier 2
Contexte de site unique côté serveur ; `site_id` sur `posts`, `taxonomy_*`, médias ; unicité des slugs de pages par site ; vidage définitif de la corbeille ; site principal explicite.
