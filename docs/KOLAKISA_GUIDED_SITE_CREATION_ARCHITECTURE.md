# Création guidée de site — architecture (programme 20.6)

## Principe
L'assistant est une **couche d'orchestration**. Il ne reconstruit ni le CMS, ni le Site Builder, ni le Theme Builder, ni la Template Library, ni l'éditeur : chaque étape appelle le service qui existe déjà. Il ne garde que sa **progression**.

| Étape | Service réutilisé (non modifié) |
|---|---|
| Création du site | `pages.createSite` (+ adresse de plateforme si configurée) |
| Modèle professionnel | `services/templateLibrary.importTemplate` (une transaction, jeton d'idempotence, aucun contenu remplacé) |
| Informations | `pages.updateSite` + `seo/settings.saveForSite` (SEO local du site) |
| Identité visuelle | `pages.updateSite` (jetons du site), `pages.saveSiteDesign` (logo), `services/stylePalettes`, `tokens.FONTS`, médiathèque `/site-web/medias` |
| Pages | `pages.createPage` (gabarits `pages/templates.js`), `landing.renamePage`, `pages.archivePage` (corbeille réversible), `pages.setHomePage` |
| Navigation | `services/navigation` (menu du site, affectation à l'en-tête s'il est libre) |
| Contenus | `pages.requirePage` / `pages.saveDraft` (brouillon, contrôle de révision) |
| Fonctionnalités | `marketing/siteModules.setEnabled` (équipe seulement) |
| Aperçu | aperçu de page du Page Builder (`/marketing/pages/:id/apercu`) dans un cadre à la largeur de l'appareil |
| Domaine | `services/siteDomains` (lecture ; la gestion reste dans l'écran Domaines) |
| Publication | `pages.publish` (contrôle de publication du moteur, page par page) |

## Code
- `src/siteWizard/catalog.js` — catalogues purs : 18 types de sites, fonctionnalités, pays/langues/devises, styles, étapes.
- `src/siteWizard/index.js` — service (ctx → base, organisation, portée du site).
- `src/marketing/web/siteWizard.js` — routes ; `views/marketing/site-wizard*.ejs` ; `public/js/site-wizard.js`, `public/css/site-wizard.css`.
- Accueil : `/marketing/site-web/assistant` (famille « organisation » de `routeScopes`). Assistant : `/marketing/site-web/sites/:id/assistant` (le site vient du **chemin**, famille « espace-du-site »).

## Données
Table `mk_site_wizard` (une ligne par site : mode, catégorie, étape courante, états d'étapes, réponses, révision). Elle est créée **à la demande** (`CREATE TABLE IF NOT EXISTS`) : les migrations 114 et 115 sont figées par un test et aucune migration n'est ajoutée. Aucune donnée n'est supprimée ni migrée. Clé étrangère `ON DELETE CASCADE` vers `mk_sites`.
Les réponses sans autre domicile (entreprise, secteur, pays, langue, fuseau, devise, plan de navigation, brouillons de formulaire) y sont gardées. Le nom, la description, le SEO local, les styles, les pages, le menu et les modules vont dans **leurs** tables d'origine.

## Sécurité et isolation
- Le site est celui de l'**adresse** ; `access()` vérifie l'organisation et la portée de la personne (accès limité à un site → le sien seulement). Un autre site répond « introuvable ».
- Toute page désignée par un formulaire (`pageId`) est revérifiée : elle doit appartenir au site de l'adresse.
- Droits : `forms.read` (voir), `forms.write` (modifier), `pages.publish`, `navigation.write` (menu), `sites.modules` + équipe (modules), `sites.domains` (domaines). La **création** d'un site est réservée à l'équipe.
- Sauvegarde automatique : révision comparée (conflit → 409, rien d'écrasé) ; le brouillon n'a aucun effet sur le site.
- Publication : jamais implicite (`confirm === true` exigé par le service lui-même), aucun DNS touché.

## Internationalisation
Les pays, langues et devises sont des **tables** (`catalog.js`). Formats de date, d'heure, de nombre et de devise produits par `Intl` selon le pays. Un pays → langue, fuseau et devise **proposés**, modifiables. Aucune règle fiscale ni juridique n'est codée ; l'assistant ne prétend à aucune conformité.
Pays : FR, BE, CH, LU, CA, SN, CI, CM, CD, MA, DZ, TN, GB, US, DE, ES, IT, PT. Langues : fr, en, es, de, it, pt (langue du site : **l'interface de l'assistant reste en français**).
