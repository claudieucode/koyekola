# Palier 12 — Adresses, permaliens, redirections, 404, indexation technique

Les adresses publiques de KOLAKISA ont **un seul service central** : `src/services/urls.js`. Aucune route existante n'a changé :
toutes les adresses déjà publiées continuent de répondre.

## Cartographie des routes (audit initial)

| Espace | Routes | Rendu |
|---|---|---|
| Site public (hôte principal) | `/`, `/catalogue`, `/categorie/<x>`, `/cours/<adresse>`, `/blog`, `/blog/<adresse>`, `/blog/categorie/<x>`, `/blog/etiquette/<x>`, `/blog/auteur/<id>`, `/a-propos`, `/faq`, `/contact`, `/cookies` | `routes/*.js` + EJS |
| Pages du CMS | `/p/<adresse>` (+ `/p/<adresse>/clic/<n>`, formulaires, tunnels) | `marketing/web/landingPublic.js` |
| Domaine propre d'un site (nouveau) | `/` = accueil du site, `/<adresse>` = page du site | réécriture interne vers `/p/<adresse>` |
| CMS / administration | `/marketing/**`, `/formateur/**` | protégées par session et permissions |
| API | `/api/v1/**`, `/api/mobile/**`, `/webhooks/**`, `/stripe/**` | jamais redirigeables |
| Authentification | `/connexion`, `/inscription`, `/deconnexion`, `/mot-de-passe-oublie`, `/invitation/**` | jamais redirigeables |
| Tunnels | pages `/p/<adresse>` (étapes), `/t/**`, `/u/**` (suivi, désinscription) | jamais redirigeables |
| Fichiers | `/uploads/**`, `/css`, `/js`, `/img`, `/fonts` | non touchés |
| SEO technique | `/sitemap.xml`, `/sitemap-<groupe>.xml`, `/robots.txt` | `routes/seo.js` |

Ce qui existait déjà et a été conservé : redirections gérées (`seo_redirects`, 301/302, boucles, chaînes, CSV, compteurs), journal des 404,
historiques d'adresses des articles (`post_slug_history`) et des formations (`course_slug_history`), navigation par références d'objets,
modèle de thème 404, plan du site et robots.txt du palier SEO.

Ce qui manquait : historique d'adresses des **pages du CMS** et des **taxonomies**, redirections propres à un site, permissions
dédiées, gestionnaire dans le CMS, liens cassés, domaines des sites, plan du site par domaine, protection des environnements non publics.

## Le service d'URLs (`src/services/urls.js`)

* `resolve(chemin, { hostSite })` → `{ type, id, state, path, row }` ; états : `live`, `draft`, `trashed`, `foreign` (autre site), `moved`, `none`.
* `publicPath / publicUrl / pagePath / pageCanonicalPath` : l'adresse d'une ressource (page, article, formation, termes de toutes les taxonomies
  enregistrées, y compris les futures). Consommé par le canonical (SEO), le plan du site, la navigation et la détection de liens cassés.
* Moteur de slugs : `normalizeSlug`, `checkSlug`, `uniqueSlug`, `isReserved` (liste des routes techniques).
* Historique : table **`cms_url_history`** (`resource_type`, `resource_id`, `site_id`, `old_slug`, `reason`, date ; unique par type + ancienne adresse).
  L'ancienne adresse redirige vers l'adresse **courante** de la ressource, calculée à chaque demande : il ne peut donc **jamais** y avoir de chaîne.
  Pages : `cmsPages.slugChanged` ; taxonomies : abonnement aux événements `term.updated / merged / deleted` (le service des taxonomies n'a pas été modifié).
  Articles et formations gardent leurs tables (lues par le résolveur).
* Domaines : `siteForHost(hôte)` ne reconnaît que les adresses publiques enregistrées dans les réglages des sites. Un hôte inconnu n'est jamais un site.

## Règles

* **Changement d'adresse** : l'ancienne adresse n'est mémorisée que si la ressource a été en ligne ; elle redirige (301) vers l'adresse courante.
  Reprendre une ancienne adresse la fait sortir de l'historique ; une copie (duplication) n'en crée aucune.
* **Corbeille** : une ressource à la corbeille répond 404, son ancienne adresse aussi (jamais de redirection vers une page non servie) ;
  la restauration retrouve ses redirections.
* **Révisions** : l'adresse n'est pas versionnée (palier 10) : restaurer une version ne change jamais l'adresse et ne crée aucune redirection.
* **Adresses réservées** : une page d'un site ne peut pas porter le nom d'une route du site (`blog`, `connexion`…), puisqu'elle peut être servie à la racine d'un domaine.
* **Casse et barre finale** : `/Blog/` → `/blog`, `/p/Page/` → `/p/page` (301, requête conservée), uniquement pour les adresses de contenu public.
* **Pagination et paramètres** : `?page=N` est une vraie page ; tris et filtres ne modifient pas l'adresse canonique.

## Domaines des sites

L'adresse publique d'un site (Réglages du site → Référencement) est son domaine. Sur ce domaine : `/` = page d'accueil du site, `/<adresse>` = page
du site, `/p/<adresse>` redirige vers l'adresse propre, une page d'un autre site est introuvable, le plan du site et robots.txt sont ceux du site,
le canonical utilise le domaine du site. Un domaine ne peut servir qu'**un seul** site. Le DNS et l'alias d'hébergement du domaine restent à la charge
de l'hébergeur ; le CMS n'invente rien tant que l'alias n'existe pas.
Limite assumée : les adresses de pages restent uniques sur tout KOLAKISA (`mk_landing_pages.slug` UNIQUE) ; deux sites ne peuvent donc pas avoir chacun une page `/about`.

## Redirections (CMS → Redirections)

Un seul moteur (`src/seo/redirects.js`), deux accès : le gestionnaire du CMS et l'Espace SEO (créateur). Liste, recherche, filtres (type, état, site), tri,
pagination ; création, modification, activation, suppression, test. **Le test interroge le vrai serveur** (`src/seo/probe.js`) : étapes, codes, verdict.
Refusés à l'enregistrement : source = destination, boucles, espaces techniques (administration, API, connexion…), adresses invalides ou `//autre-site`,
types autres que 301/302. Les chaînes sont détectées (y compris via l'historique) et corrigeables en un clic.
Permissions : `redirects.view`, `redirects.create`, `redirects.edit` (éditeur et plus), `redirects.delete` et `redirects.external` (administrateur). Une destination
sur un site extérieur ne peut être créée ni modifiée que par un administrateur (anti-redirection malveillante). Aucune route « redirect?url= » n'existe.

## 404

Toute adresse inconnue répond **HTTP 404** avec la page d'erreur du site (ou le modèle 404 de l'Apparence), `noindex, nofollow`, et alimente le journal des 404.
Les sondes internes (test de redirection, liens cassés) n'y entrent pas.

## Liens cassés

Pas de robot d'exploration : seulement les liens connus (menus, boutons et liens des pages en ligne, liens des articles publiés), vérifiés auprès du vrai serveur.
Distingue « cassé » (404, corbeille, non publié, ressource supprimée) et « redirigé » (à mettre à jour). Le rapport est conservé en base.

## Plan du site, robots.txt, environnement

* `/sitemap.xml` : seulement les contenus publiés, indexables, non redirigés ; `lastmod` = date réelle de modification (jamais la date du jour) ; au-delà de 5 000 adresses
  c'est un index de sous-plans `/sitemap-pages.xml`, `-articles`, `-formations`, `-taxonomies`. Un plan par domaine de site (ses pages seulement).
* `robots.txt` dynamique par hôte (ligne `Sitemap:` du bon domaine). Cache public de 5 minutes.
* Environnement non public (adresse locale ou privée, ou `ALLOW_INDEXING=0`) : `X-Robots-Tag: noindex, nofollow` et `robots.txt` fermé.

## Volontairement non fait

* Permaliens configurables (changer `/blog/…` ou `/p/…`) : la structure est affichée, pas modifiable — changer la forme casserait les liens déjà partagés.
* Adresses de pages identiques sur deux sites (contrainte d'unicité globale).
* Redirection automatique www / non-www, http / https : dépend de l'hébergement (le canonical porte la préférence).
* Sous-domaines automatiques : un site se rattache à un domaine complet.
