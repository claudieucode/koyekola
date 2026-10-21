# KOLAKISA CMS — Correctif critique multisite MS-ROUTING-MEDIA-01

Branche `fix-ms-routing-media-01`, issue de `origin/main` (`2b7e75f`). Ce document sépare ce qui est **prouvé** (reproduit par un test, qui échouait avant le correctif et passe après) de ce qui est **hypothèse**.

## 1. Problèmes reproduits (avant correctif, sur `main`)

| # | Observation | Preuve |
|---|---|---|
| 1 | Dans le menu d'un site, « Ajouter un fichier média » pointe vers `/sites/<id>/medias` = **la médiathèque** (même adresse que « Médiathèque »), pas vers la page de téléversement ; `/sites/<id>/medias/ajouter` répond **404** | exploration sur `main` : liens `[["Médiathèque", …/sites/1/medias], ["Ajouter un fichier média", …/sites/1/medias]]` |
| 2 | La page de téléversement n'existait que sous l'adresse historique `/marketing/site-web/mediatheque/ajouter?site=<id>` et s'y affichait **sans le cadre du site** (aucun bandeau, menu central) ; ses liens (« Ouvrir la médiathèque », « méthode du navigateur », retour du formulaire) menaient à l'adresse du **site principal** | exploration : bannière absente sur `?site=<id>/ajouter` ; code des liens |
| 3 | **Fuite entre sites** : pour l'équipe, la médiathèque visée par une page d'éditeur ou par l'API **sans « ?site= »** était celle de **tous les sites** : la page d'un site A citait les médias du **principal et du site B** (`/marketing/pages/<id>`), `liste.json` et `medias.json` sans site renvoyaient tout | exploration : « page de A (vue) : PRINCIPAL.png, ALPHA.png, BETA.png » ; « liste sans site : BETA, ALPHA, PRINCIPAL » |
| 4 | Un envoi depuis l'éditeur de pages / d'e-mails d'un site, sans site désigné par le client, atterrissait dans la médiathèque **commune** | lecture du code (`siteOfUpload`) et du client (`page-builder.js`, `marketing-editor.js` n'envoyaient aucun site) |

## 2. Cause racine (prouvée par la lecture du code et les tests)

**Combinaison de deux défauts d'architecture** :

1. **Routage** : l'entrée de menu `mediatheque/ajouter` n'avait pas de sous-page déclarée (`sub`), et `medias` n'était pas dans la liste fermée `NESTED` de `siteSpace.js` ; la page vivait sur une adresse historique non rangée dans le cadre d'un site. Résultat : lien faux, cadre perdu, puis chaque lien suivant partait vers l'adresse du principal.
2. **Contexte** : le « site visé » d'une requête d'équipe ne venait que de `?site=` / de l'adresse (`ctx.siteFilter`), jamais du **contenu édité** (page, article, modèle). Sans lui, la visibilité retombait sur `1 = 1` : **tous les médias de tous les sites** — une valeur par défaut globale. Les clients (Page Builder, éditeur d'e-mails, sélecteur) n'envoyaient pas non plus le site.

Données : il n'y a **pas** de stockage partagé — chaque site a son dossier (`/uploads/marketing/<org>/site-<id>/`) et ses fiches (`site_id`). La fuite était donc de la **catégorie 2** de la demande : fichiers distincts, mais requêtes / interface qui affichaient les résultats de plusieurs sites.

## 3. Corrections (à la source, pour tous les sites actuels et futurs)

**Routage**
- `cmsNav.js` : `NESTED.medias = ["ajouter"]` et `ABILITY["mediatheque/ajouter"].sub = "ajouter"` → le menu d'un site mène à `/sites/<id>/medias/ajouter`, délégué par `siteSpace` vers la page avec le site **fixé par l'adresse** (le « site » du client est écrasé).
- La page de téléversement et la médiathèque construisent **tous** leurs liens à partir d'une seule fonction `spaceBase(ctx)` : `/sites/<id>/medias` pour un site, adresse historique pour le principal. Retour du formulaire « méthode du navigateur » : même cadre. Aucune adresse n'est codée en dur ; aucun domaine n'intervient (les liens sont relatifs, testé avec des domaines publics différents).
- Route inconnue (`/sites/<id>/mediatheque/ajouter`, `/sites/<id>/medias/inconnue`, site inexistant) : **404 explicite**, sans redirection ; accès refusé : 403 sans redirection.

**Contexte du site**
- `src/marketing/media/requestContext.js` (source unique) : accès limité → site imposé par le serveur ; site explicite vérifié ou « principal » → tel quel ; média désigné par son identifiant → la médiathèque **de ce média** ; vue d'ensemble de l'équipe **seulement sur demande** (`?portee=tous`) ; **sinon la médiathèque du site principal — jamais « tous les sites »**. Utilisé par la page, l'API JSON, l'éditeur de pages, l'API de modèles d'e-mails et le composeur social.
- `media.forSite(ctx, siteId)` : les listes d'images affichées par le serveur dans l'éditeur / la vue d'une page (`landing.js`, sections et « blocs de départ ») viennent de **la médiathèque du site de la page**.
- Clients : balise `mk-media-site` (site vérifié, ou `principal`) émise par la coque, le Page Builder, l'éditeur d'articles et l'éditeur d'e-mails ; `KWMedia`, `page-builder.js` et `marketing-editor.js` l'envoient à chaque appel (le serveur le revérifie). `KWMedia` lit aussi `/sites/<id>/` dans l'adresse.
- Images de l'**ancien blog** (sans propriétaire de site) : plus proposées dans la médiathèque d'un site ni dans l'éditeur d'un article de site.

**Stockage / miniatures** : `variants.js` accepte les images des dossiers de site et range leurs versions réduites **dans le dossier de ce site** (`…/site-<id>/v/<largeur>/`) ; un nom demandé dans le dossier d'un autre site ne sert rien.

## 4. Diagnostic des données existantes (aucune modification)

`GET /marketing/site-web/mediatheque/diagnostic.json` (équipe de l'organisation, lecture seule, `no-store`) signale : média « de site » sans site, commun rattaché à un site, site inconnu / supprimé, adresse hors dossier, organisation incohérente, **dossier ≠ propriétaire**, **fiche sans fichier**, **fichier sans fiche** (propriétaire indéterminé : conservé, non attribué), **références entre sites**, **communs cités par un site** (à attribuer par l'équipe), **doublons de contenu**. Il ne réattribue, ne déplace et ne supprime rien (testé : fiches et fichiers identiques avant / après).
**Migration : aucune** (le modèle impose déjà `site_id` et un dossier par site ; les triggers 074 interdisent les états incohérents). Les médias communs historiques restent le catalogue du principal ; l'attribution à un site passe par `setMediaScope` (équipe), après vérification des usages.
Les anomalies **effectives de la production** n'ont **pas** pu être relevées d'ici (pas d'accès à la base de production) : le diagnostic est à lancer par l'équipe.

## 5. Tests

`tests/ms-routing-media-01.test.js` (24) : A navigation (3 sites à domaines différents, accès limité, autre site 403) · B navigation directe (adresse du site, adresse historique, 404 explicites, principal inchangé) · C importation (API et méthode du navigateur, retour dans le même site) · D isolation avec B (page, API, recherche, compteurs, identifiants forgés, actions groupées) · E principal (jamais dans un site ; défaut de l'équipe = principal ; vue d'ensemble explicite) · F éditeurs (pages, éditeur visuel, `medias.json`, articles, e-mails) · G versions réduites et caches · H principal · diagnostic. **Sur `main` : 15 échecs / 24 ; sur la branche : 23 réussis, 1 ignoré** (voir limites).
Tests existants adaptés : `medias-par-site`, `media-01`, `media-02` (liens dans le cadre du site ; défaut de l'équipe = principal).

## 6. Limites et hypothèses

- **Non testé ici** : fabrication réelle des versions réduites (le module `sharp` est absent sur cette machine ; le test réel est ignoré, les adresses et le comportement sans `sharp` sont testés).
- **Hypothèse** : le comportement « redirige vers le site principal » rapporté vient du point 2 (page sans cadre → liens vers le principal) ; un lien d'ancien favori ou un cache de navigateur peut encore mener à l'adresse historique du principal, qui reste valide.
- Les anciens **médias communs** ne sont plus proposés dans un site : un site qui les utilisait dans ses pages les garde affichés (adresse publique), mais doit les réimporter pour les choisir de nouveau (ou l'équipe les lui attribue).
- Le sélecteur d'e-mails **sans site désigné** montre le principal ; pour un modèle de site, le site est désormais envoyé (testé côté serveur ; l'éditeur d'e-mails réel en navigateur n'est pas testé ici).
- Aucune tâche asynchrone de traitement n'existe pour les médias (versions réduites à la demande, synchrones) : rien à propager.
