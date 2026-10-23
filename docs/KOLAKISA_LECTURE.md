# KOLAKISA CMS — Paramètres → Lecture

Écran : **Paramètres → Lecture** (`/marketing/site-web/parametres/lecture`, ou « Lecture » dans le cadre d'un site). Réglages **propres à chaque site** (le site principal a les siens).

## 1. Référence : « Réglages de lecture » de WordPress

| Réglage WordPress | Comportement natif | Dépend d'un thème / d'une extension ? |
|---|---|---|
| La page d'accueil affiche : derniers articles / page statique | `show_on_front` = `posts` ou `page` ; avec `page`, `page_on_front` = page d'accueil, `page_for_posts` = page des articles | Le thème décide du rendu (modèles `front-page`, `home`). |
| Page d'accueil / page des articles | Pages publiées uniquement ; WordPress affiche un avertissement si les deux sont la même page (la page des articles gagne et le contenu de la page n'apparaît pas). Le contenu de la « page des articles » n'est pas affiché : seule son adresse sert. | — |
| Nombre d'articles par page d'archive (`posts_per_page`, 10 par défaut) | Appliqué à l'accueil en mode articles, à la page des articles, aux catégories, étiquettes, auteurs, dates et à la recherche. | Un thème peut modifier la requête. |
| Éléments dans les flux (`posts_per_rss`, 10 par défaut) | Nombre d'éléments des flux RSS/Atom (articles, commentaires). Indépendant de `posts_per_page`. | — |
| Texte complet / extrait dans les flux (`rss_use_excerpt`) | Modifie le XML réellement produit (`description` / `content:encoded`). N'influe pas sur les pages du site. | — |
| Visibilité pour les moteurs de recherche (`blog_public`) | Demande de ne pas indexer : balise `noindex` (et `robots.txt` en `Disallow` côté WordPress). **Ce n'est pas un mécanisme de confidentialité** ; les moteurs peuvent l'ignorer. | Les extensions SEO l'étendent (plan du site, en-têtes). |

## 2. Audit de KOLAKISA avant la mission

| Fonction | État | Constat |
|---|---|---|
| Page d'accueil statique (site principal et sites) | **Opérationnelle** | `homepage_page` / `mk_sites.home_page_id`, rendu à la racine, adresse `/p/<adresse>` redirigée vers `/`, repli sur l'accueil standard si la page n'est plus publiée. **Conservée telle quelle.** |
| Mode « derniers articles » à l'accueil | **Absente** | Aucun réglage de mode. |
| Page des articles | **Absente** | Le blog était fixé à `/blog`. |
| Articles par page | **Défectueuse** | Stocké (site principal seulement) ; **un site à domaine propre utilisait la valeur du site principal**. |
| Éléments du flux | **Absente** | 20 articles, valeur fixe. |
| Texte complet / extrait du flux | **Absente** | Extrait uniquement. |
| Visibilité pour les moteurs de recherche | **Opérationnelle** | Paramètres → Indexation : balise, en-tête `X-Robots-Tag`, `robots.txt`, plan du site, SEO ; réglage propre à chaque site. **Conservée, non dupliquée.** |
| Moteur de réglages (validation, droits, confirmation des réglages sensibles, journal, isolation par site) | **Opérationnel** | Réutilisé tel quel pour tous les nouveaux réglages. |

## 3. Décisions

- **Un seul stockage par valeur.** Les nouveaux réglages sont des définitions du moteur de réglages existant : site principal → table `mk_settings` (clés `cms.*`) ; site → bloc `reading` de `mk_sites.settings` (validé strictement). Aucune migration SQL.
- **Visibilité : on relie, on ne duplique pas.** L'écran Lecture affiche l'état du réglage d'Indexation (même valeur, même module SEO) avec l'avertissement et un lien pour le modifier. Aucun `robots.txt` Disallow n'est ajouté (il empêcherait de lire le `noindex`).
- **Site principal : trois modes**, pas deux. « Accueil standard de KOLAKISA (formations) » reste le mode par défaut : il évite de changer la page d'accueil d'un site existant. Un site du CMS a deux modes (page statique / derniers articles), la page statique étant son comportement actuel.
- **Compatibilité :** pour un site principal qui a déjà une page d'accueil choisie, le mode est déduit « page statique » (aucun changement visible).
- **Réversibilité :** changer de mode ne supprime jamais la page d'accueil ni la page des articles enregistrées.
- **Page des articles** : son adresse affiche la liste des articles (titre de la page comme titre, pagination `?page=`) ; `/blog` y redirige (301). Les archives (`/blog/categorie/…`) gardent leurs adresses. Le contenu éditorial de cette page n'est pas affiché (comme WordPress). Active seulement avec une page statique à l'accueil.
- **Flux** : `/blog/feed.xml` (et `/feed`) ; `content:encoded` en CDATA pour le texte complet ; `Cache-Control: public, no-cache` (revalidation à chaque lecture : un changement de réglage est visible immédiatement).
- **Articles par page** : appliqué à la liste du blog, à l'accueil en mode articles, à la page des articles et aux archives. Les résultats de la page « Recherche » (`/recherche`, 30 résultats) et les flux gardent leurs propres limites.

## 4. Cohérence et sécurité

- Validation serveur : entiers de 1 à 50 (articles par page, éléments du flux), choix fermés (mode, contenu du flux), pages **publiées, non archivées, ni étape de tunnel, appartenant au bon site**.
- Conflits refusés : mode « page statique » sans page ; même page pour l'accueil et les articles.
- Page choisie devenue indisponible : jamais une accueil vide ni une erreur ; l'accueil de secours reprend et l'écran signale le problème.
- `show_on_front` est un réglage **sensible** (confirmation explicite, permission `settings.sensitive`) ; tous écrivent dans le journal d'activité.
- Le site vient de l'adresse vérifiée par le serveur ; un site forgé donne 404 ; un accès limité à un site ne modifie pas un autre.

## 5. Fichiers

`src/services/settings/index.js` (définitions, cohérence) · `src/marketing/pages/siteSettings.js` (bloc `reading`) · `src/services/urls.js` (valeurs de lecture d'un site, adresse effective de l'accueil) · `src/middlewares/siteHost.js` (accueil en mode articles, page des articles) · `src/routes/blog.js` (par page, flux) · `src/marketing/web/settings.js` (état de visibilité, adresse du flux) · `views/marketing/partials/reading-fields.ejs`, `views/marketing/settings-group.ejs` · `public/js/cms-lecture.js` · `public/css/kola-pages.css` · test `tests/reglages-lecture.test.js`.

## 6. Limites connues

- Les modèles de thème « Liste du blog » du Page Builder s'appliquent à la liste affichée à l'accueil ou sur la page des articles comme sur `/blog`.
- Un seul flux est exposé (articles du blog). Pas de flux Atom ni de flux de commentaires : le périmètre du réglage est donc ce flux unique.
- Le plan du site (sitemap) liste encore `/blog` comme adresse du blog.
