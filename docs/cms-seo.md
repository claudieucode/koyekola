# Palier 11 — Moteur SEO central

Le SEO de KOLAKISA n'a **qu'un seul moteur** : le « SEO CORE » (`src/seo/`, voir `SEO_CORE.md`). Ce palier lui a ajouté
les pages du CMS (`/p/<adresse>`), qui avaient jusque-là leur propre en-tête écrit à la main dans `landing.ejs`.

## Cartographie (audit initial)

| Contenu | Source des réglages | Moteur | Rendu |
|---|---|---|---|
| Accueil, catalogue, blog, pages fixes | `seo_meta` (type `page`) + réglages globaux `seo_settings` | `seo/pages.js` → `resolver.apply/finalize` | `partials/header.ejs` |
| Formations, catégories de formations | colonnes `courses` / `seo_meta` | idem | idem |
| Articles | colonnes de `posts` (`seo_title`, `canonical_url`, `robots_*`, `og_*`…) | `routes/blog.js` → `resolver.finalize` | idem |
| Catégories / étiquettes / auteurs du blog | `seo_meta` (types `blog_category`, `blog_tag`, `author`) | `seo/pages.blogList` | idem |
| **Pages du CMS (`/p/…`)** | `mk_landing_pages.seo` (JSON, versionné avec le brouillon) + `mk_sites.settings` (`seo`, `identity.description`, `extras.noindex`) | **`seo/webPages.js` → `resolver.finalize`** (nouveau) | `partials/seo-head-tags.ejs` (nouveau, partagé) |
| 404, erreurs, espaces privés | — | `seo: { noindex: true }` | idem |

Avant le palier : les pages du CMS publiaient un `<title>` sans nom du site, aucun `og:title` propre, un `twitter:card` sans
titre ni description, aucune directive `nofollow`, aucune donnée structurée hors FAQ, et ne connaissaient pas les réglages du site.

## Source de vérité et priorité

Pour une page du CMS, de la plus forte à la plus faible :

1. réglage SEO de la page (panneau SEO de l'éditeur) ;
2. titre et description de la page ; image du bandeau ;
3. réglages SEO du site (Réglages du site → Référencement ; description du site dans Identité) ;
4. réglages globaux de KOLAKISA (Mon espace → SEO → Réglages : modèle de titre, description par défaut, image par défaut, organisation).

Chaque valeur finale est calculée **une seule fois**, par `webPages.inputs()` puis `resolver.finalize()`. Le HTML public, l'aperçu
de l'éditeur, l'analyse et le plan du site lisent ce résultat (ou `webPages.indexing()` pour l'indexation) : il n'y a pas de
deuxième calcul côté navigateur.

## Données

Aucune nouvelle table, aucune migration : les colonnes existantes sont réutilisées.

* `mk_landing_pages.seo` (JSON) : `title`, `description`, `canonical`, `noindex`, `ogImage` (existants) + `nofollow`, `noarchive`,
  `nosnippet`, `noimageindex`, `ogTitle`, `ogDescription`, `twitterCard`, `focusKeyword` (palier 11). Validées par `pages.normalizeSeo`
  (https obligatoire pour le canonical, image de la médiathèque ou https, longueurs bornées, caractères de contrôle retirés).
* `mk_sites.settings.seo` : `title` (nom du site dans les résultats), `ogImage`, `publicUrl` (https, sans chemin), `follow`.
  Validé par `siteSettings.normalizeSettings` (comme tous les réglages du site : révision, historique annuler/rétablir).
* La description du site est `identity.description`, l'interdiction d'indexer tout le site est `extras.noindex` : **une seule source chacune**.

## Révisions

Le SEO d'une page fait partie de son contenu : brouillons, versions publiées, historique commun (palier 10) et restauration le
contiennent déjà. Tester : SEO V1 → V2 → restauration de V1 (`tests/cms-seo.test.js`). Les articles gardent leur versionnage
(`seo_title`, `canonical_url`… sont dans le contenu versionné de l'article).

## Permissions (palier 9)

* `seo.view` : voir l'aperçu et l'analyse d'une page (éditeur et plus).
* `seo.edit` : modifier les réglages SEO d'une page et du site (éditeur et plus ; retirable dans un rôle personnalisé).

Vérifiées **côté serveur** : sauvegarde du brouillon (JSON et formulaire de la fiche), réglages du site (SEO, description du site, noindex),
analyse. Un rôle sans `seo.edit` peut continuer à enregistrer le contenu tant que les réglages SEO ne changent pas (sauvegarde automatique).
Les articles se modifient avec le compte créateur uniquement : leur SEO n'est donc pas ouvert à d'autres rôles.

## Multi-site

* `publicUrl` d'un site : toutes les adresses absolues de ses pages (canonical, `og:url`, JSON-LD, plan du site) l'utilisent ;
  sans `publicUrl`, `SITE_URL` (ou l'hôte de la requête en local). Jamais d'adresse codée en dur.
* `siteBase(req)` lit `req.seoBase` (posé par `webPages.inputs`, propre à la requête) avant `SITE_URL`.
* Un site réglé en `noindex` rend toutes ses pages `noindex, nofollow` et les retire du plan du site.
* KOLAKISA ne sert pas encore ses sites sur des domaines propres (le menu « Domaine » gère les domaines d'**envoi d'e-mails**) :
  `publicUrl` prépare ce cas sans le simuler.

## Aperçu et analyse (éditeur de pages → onglet Page)

`POST /marketing/pages/:id/seo/analyse` (permission `seo.view`) :

* sans `analyse: true` : aperçu des résultats de recherche avec les valeurs **non enregistrées** de l'éditeur (même moteur que la page publique) ;
* avec `analyse: true` : rend le brouillon enregistré et contrôle indexation, titre, description, canonical, image de partage, H1, hiérarchie
  des titres, longueur du texte, textes alternatifs, liens internes/externes, mot-clé principal (facultatif, jamais publié).

La note est `(bon + ½ × à améliorer) / nombre de contrôles` : un repère interne, présenté comme tel. Aucun contrôle ne bloque
l'enregistrement. Les longueurs (titre ≈ 60, description ≈ 160) sont des repères, les moteurs tronquent différemment.

## Données structurées

Graphe unique par page (`seo/schema.js`) : `Organization` + `WebSite` + `WebPage` (+ `BreadcrumbList` site → page quand la page n'est pas
l'accueil du site) + `FAQPage` seulement si la page contient réellement une section FAQ. Aucun `Product`/`Article` inventé.
Sérialisation par `JSON.stringify` avec `<`, `>`, `&` échappés (`utils/seo.jsonLdTags`). Pas de données structurées sur une page non indexée.

## Plan du site et robots.txt (préparation)

`seo/sitemap.entries()` est la source unique (`{ included, excluded + raison }`) pour le plan du site, l'audit et l'espace SEO : pages du CMS
indexables (hors noindex de page, hors site noindex, hors canonical vers une autre adresse), articles, catégories, étiquettes (réglage), etc.
`robots.txt` est généré dynamiquement (`seo/robots.js`) avec la ligne `Sitemap:`. Le sitemap complet par site et les redirections
restent au palier URLs/Redirections (le moteur de redirections existant est lu par le plan du site).

## Volontairement non fait

* SEO des taxonomies personnalisées : le SEO des catégories/étiquettes passe par `seo_meta` (types `blog_category`, `blog_tag`).
  Les taxonomies enregistrées par `registerTaxonomy` n'ont pas encore de page publique : rien à référencer pour l'instant.
* Stratégie d'indexation des résultats de recherche configurable : les résultats internes (blog `?q=`, catalogue filtré) sont publiés en `noindex, follow`.
* Plan du site séparé par site / domaine propre, redirections : palier suivant.
