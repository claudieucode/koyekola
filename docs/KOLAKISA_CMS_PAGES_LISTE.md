# KOLAKISA CMS — Pages → Toutes les pages (palier PAGES-01)

Branche `pages-01-liste`, issue de `main` (`2b7e75f`). Référence : l'écran WordPress « Pages → Toutes les pages ». Ce document décrit l'état **réel**.

## 1. Ce qui existait déjà (réutilisé, rien de recréé)

- Moteur de pages `src/marketing/pages` (table `mk_landing_pages`) : brouillon / publication / versions, programmation (`scheduled_at`), corbeille (`archived_at`), duplication, déplacement de site, page parente, tests A/B.
- Service de liste `src/marketing/pages/cmsPages.js` (recherche, filtres, tri et pagination dans la base, actions groupées page par page), routes `src/marketing/web/landing.js`, éditeur visuel (`/marketing/pages/:id/editeur`), fiche de réglages (`/marketing/pages/:id`), `landing.saveSettings` (nom unique, adresse valide et libre, redirection de l'ancienne adresse).
- Boîte « Nouvelle page » unique (`partials/new-page-dialog.ejs`), CSS et JS de la liste des articles (`.mk-ar-*`, `public/js/cms-articles.js`, `cms-pages.js`).
- Isolation : `ctx.siteScope` (accès limité à un site, imposé par le serveur), `ctx.siteFilter` (site ouvert par l'équipe), garde de portée `routeScopes.js`, `canOn` par site.

## 2. Ce que ce palier ajoute

| Fonction | Détail |
|---|---|
| Disposition WordPress | Titre + « Ajouter une page » (ouvre la boîte de création du site courant puis l'éditeur), « Options de l'écran », « Aide », états `Tous (n) \| Publiées (n) \| Programmées (n) \| Brouillons (n) \| Corbeille (n)`, recherche à droite, actions groupées + filtre de dates, tableau avec pied répété, compteur « n éléments », barre d'actions du bas |
| Colonnes | Case, Titre (mention « — Brouillon / Hors ligne / Programmée / Page d'atterrissage », adresse, « modifications non publiées »), Auteur/autrice (lien vers le filtre réel par auteur), Date (Publié / Programmé / Dernière modification) ; colonne « Site » seulement dans la liste centrale |
| États | `Programmées` ajouté (`scheduled_at` sur une page non publiée) ; `Brouillons` ne contient plus les pages programmées ; compteurs calculés en une requête, **limités au site courant** |
| Tri par colonne | Titre, Auteur, Date : `?orderby=…&order=asc\|desc`, liste fermée côté serveur, `aria-sort`, un clic inverse le sens ; l'ancien `?tri=` reste accepté. La date de tri est la date affichée (publication, programmation ou dernière modification) |
| Filtre par date | Mois réellement présents (`?mois=AAAA-MM`), selon la date affichée, dans le site courant |
| Pagination | `?page=`, nombre par page 5–100 (`?par=`, borné serveur, mémorisé par cookie `mk_pg_par`), recherche/état/mois/tri/auteur conservés |
| Options de l'écran | Colonnes Auteur et Date masquables (mémorisées dans le navigateur, clé propre aux pages) ; nombre par liste |
| Actions de ligne | Modifier (éditeur visuel) \| Réglages \| Modification rapide \| Corbeille \| Afficher / Prévisualiser \| Publier / Mettre hors ligne \| Dupliquer \| Historique \| Restaurer \| Supprimer définitivement (selon l'état et les droits) ; toujours visibles sur écran tactile |
| Modification rapide | Titre, adresse, état (brouillon/publié) ; `POST /marketing/pages/:id/modification-rapide` ; réutilise `saveSettings` (unicité, validation, redirection de l'ancienne adresse d'une page en ligne) et `publish`/`unpublish` |
| Actions groupées | Publier, mettre hors ligne, corbeille, restaurer, supprimer définitivement ; barre du bas (`action2`) ; identifiants en champs répétés **ou** séparés par des virgules ; rapport « n traitées, n refusées » avec motifs |
| Retour aux actions | Les actions de ligne et groupées reviennent à **la liste (mêmes filtres) du site de la page** ; l'adresse de retour n'est acceptée que si elle a la forme d'une liste de pages (jamais une adresse libre) |

## 3. Multisite : un seul écran, le site vient du serveur

- Dans l'espace d'un site, « Pages » n'est plus un tableau minimal propre à l'espace : c'est l'écran partagé `/marketing/pages` **délégué** (`cmsNav.js`, comme Articles). `GET /marketing/site-web/sites/<id>/pages` est réécrit en `GET /marketing/pages?site=<id>` ; le site est fixé par l'adresse vérifiée, jamais par le navigateur.
- `cmsPages.siteClause(ctx)` applique la portée à la liste, aux compteurs, aux auteurs et aux mois : accès limité → son site ; site ouvert par l'équipe → ce site ; sinon (liste centrale de l'organisation) toutes les pages, avec colonne et filtre « Site ».
- `routeScopes.js` : deux règles nouvelles — `GET /pages` (site = `?site=`, revérifié par le contexte de site) et `POST /pages/actions` (site = champ `site`). Les actions sur une page (`/pages/:id/…`) gardent la règle existante : le site est celui **de la page** en base.
- Actions groupées : chaque page est relue en base ; hors portée du site demandé (`siteLimit`) ou de l'accès limité → « page introuvable », aucune écriture. Droit contrôlé page par page (`canOn`).

## 4. Sécurité vérifiée (tests `tests/pages-01-liste.test.js`, 22)

- Accès limité au site A : 403 sur la liste de B (`/sites/B/pages` et `/pages?site=B`), aucune modification rapide ni action groupée sur une page de B, même avec des identifiants forgés.
- Équipe agissant depuis le site A avec des identifiants du site B : seules les pages de A sont traitées, le message indique les refus.
- Lecteur : aucune case, aucun lien d'édition, aucun bouton d'ajout ni d'action groupée. Éditeur : écrit et publie, ne supprime pas définitivement. Administrateur : supprime depuis la corbeille.
- Titres échappés ; `orderby`, `order`, `mois`, `par`, `page` validés ; joker `%` littéral ; adresse de retour libre refusée.
- Les liens et formulaires de la liste d'un site ne pointent jamais vers le principal ni vers un autre site ; une page créée sur A n'apparaît pas sur B.

## 5. Limites connues (non faites, pas simulées)

- **Commentaires** : les pages n'ont pas de commentaires dans le modèle (les commentaires sont rattachés aux articles). La colonne n'est donc **pas affichée** (aucun compteur simulé).
- **Statut « En attente de relecture » et « Privées »** : le modèle des pages n'a ni l'un ni l'autre ; aucun onglet n'est proposé.
- **Mode d'édition (constructeur)** : toutes les pages s'éditent dans l'éditeur visuel KOLAKISA ; seul le type « page d'atterrissage » est signalé. « Modifier avec l'éditeur visuel » n'est donc pas un second lien : « Modifier » ouvre déjà l'éditeur visuel.
- **Recherche** : nom, titre et adresse ; pas dans le contenu des sections (stocké en JSON, non indexé).
- **Modification rapide** : pas de date ni d'auteur ; le changement de site, la page parente et le formulaire se règlent dans la fiche (« Réglages »), qui reste le seul endroit où une page change de site.
- **Fuseau horaire** : les heures sont enregistrées et affichées en UTC (suffixe « UTC »), comme pour les articles ; il n'existe pas de réglage de fuseau par site.
- **Notifications** : seuls les retours d'opérations existent (message mémorisé en session).
- **Liste centrale / site principal** : sans site choisi, l'équipe voit toutes les pages de l'organisation (comportement historique conservé) ; `?site=principal` n'est pas proposé dans l'interface.
- **Contrôle visuel en navigateur réel** (alignements, survol, responsive) : non exécuté ; les tests vérifient le rendu serveur et la logique.
- Aucune migration, aucune nouvelle table, aucune nouvelle permission.
