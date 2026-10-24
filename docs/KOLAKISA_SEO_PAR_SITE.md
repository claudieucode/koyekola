# SEO d'un site — les neuf rubriques (CMS partagé, données isolées par site)

Rubrique **SEO** de l'espace d'un site (`/marketing/site-web/sites/<id>/seo/…`). Le moteur SEO est **commun** (`src/seo/`) ; chaque site n'y lit et n'y écrit que **ses** données.

| Rubrique | Adresse | Ce qu'elle fait réellement |
|---|---|---|
| Vue générale | `/seo` | Chiffres lus dans la base pour ce site (pages, indexables, doublons, 404, redirections), état par rubrique, dernière analyse. Aucune note avant la première analyse. |
| Analyse SEO | `/seo/analyse` | Analyse en arrière-plan des pages en ligne du site (mêmes règles que l'audit central), progression réelle, filtres gravité/type/adresse, lien vers l'éditeur, historique et comparaison avec l'analyse précédente. Une seule analyse à la fois sur la plateforme ; relance évitée si rien n'a changé depuis moins de 15 min. |
| Meta | `/seo/meta` | Modèles du site (nom, séparateur, modèle de titre, description par défaut), aperçu de l'extrait, tableau des titres et descriptions réellement publiés par page (hérités ou personnalisés), doublons. |
| Indexation | `/seo/indexation` | `noindex` / suivi des liens de tout le site (confirmation explicite pour fermer le site, contrôle de révision, journal), directive réellement publiée par page, conflits avec robots.txt et le plan du site. |
| Sitemap | `/seo/sitemap` | Plan du site de ce site (domaine propre ou plan du domaine principal), validation XML réelle, exclusions motivées, régénération et date de dernier contrôle. |
| Schema | `/seo/schema` | Organisation du site, JSON-LD réel de chaque page, validation (propriétés obligatoires, références), propriétés recommandées manquantes. Rien d'inventé. |
| Open Graph | `/seo/open-graph` | Langue de partage, image de partage choisie dans la médiathèque **du site**, aperçu de partage par page. |
| Robots | `/seo/robots` | Fichier réellement servi, règles propres au site, aperçu et validation avant publication, confirmation pour un blocage large, historique et retour arrière. |
| Erreurs 404 | `/seo/404` | Journal du site, états (à traiter, traitée, revenue en ligne, ignorée), redirection 301/302 avec destination vérifiée, détection de boucle, contrôle de reprise, purge de l'historique ancien. |

## Règles d'isolation (à conserver)
1. Le site vient **uniquement** de l'adresse vérifiée par le serveur (`req.seoSpace`), jamais d'un champ de formulaire ni d'un `?site=`.
2. Chaque requête SQL est bornée (`site_id = ?`). Les analyses d'un site (`seo_audits.site_id`) ne sont ni listées au central ni lisibles depuis un autre site.
3. Les écrans du **CMS central** (site principal) ne lisent que les données du site principal (`site_id IS NULL`).
4. Droits : lecture `seo.view`, écriture `seo.edit` (redirections : `redirects.*`). Site archivé : lecture seule.
5. Protection contre les abus : le journal 404 est borné à 1 500 adresses par site.

## Fichiers
`src/seo/siteTools.js` (service commun), `src/marketing/web/siteSeo.js` (routes), `views/marketing/site-seo/` (vues), `public/js/cms-seo-site.js`, section « SEO d'un site » de `public/css/cms.css`, migration `101_seo_outils_par_site.sql` (additive).

## Limites connues
- Les contenus de type article ou catégorie rattachés à un site gardent leur propre éditeur SEO ; la rubrique **Meta** liste les **pages** du site.
- Pas de type `Product` : le module e-commerce n'existe pas encore.
- Aucun service tiers (Search Console, PageSpeed) n'est appelé depuis l'espace d'un site : ces intégrations restent dans la suite centrale.
- L'analyse lit au plus 400 pages par site ; les tableaux sont bornés à 500 pages (annoncé à l'écran).
- Un site sans domaine propre est listé dans le plan et le `robots.txt` du domaine principal ; ses règles robots propres ne s'appliquent qu'avec un domaine propre.
