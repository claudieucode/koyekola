# Catégorie « Site » de l'éditeur de pages

Tout ce qui est listé ici est **réel** : enregistré dans la page, lu depuis la base à l'affichage (contenu publié seulement),
échappé, testé sur un vrai serveur. Ce qui n'existe pas est dit comme tel en bas de page.

## Architecture (une seule, partagée)

| Brique | Fichier | Rôle |
|---|---|---|
| Moteur de requêtes | `src/marketing/pages/query.js` | UNE description de requête (source, filtres, tri, nombre, pagination) pour la boucle de la grille ET tous les widgets. `registerQuerySource` ajoute un type de contenu sans toucher aux widgets. Tri choisi dans une liste fermée, valeurs en paramètres SQL. |
| Sources de requête | `query.js` | articles, formations, pages, auteurs, catégories, étiquettes |
| Étiquettes dynamiques | `src/marketing/pages/dynamic.js` | `{{post.*}}`, `{{author.*}}`, `{{term.*}}`, `{{archive.*}}`, `{{course.*}}`, `{{user.*}}`, `{{query.*}}`… utilisables dans n'importe quel texte, image ou lien |
| Widgets à données | `src/marketing/pages/widgets/site.js` | `data(ctx, réglages, env)` : le serveur fournit au gabarit les données du moment (article courant, archive, visiteur) |
| Contexte | `themeRender.postScope`, `blog.js` (scope `archive`) | article courant complet (id, auteur, étiquettes…) et archive affichée |
| Sous-catégories | `nodes.js` (`SITE_SUBS`) | Navigation et identité · Contenu de l'article · Archives et recherche · Listes dynamiques · Compte et panier |

La recherche, les favoris et les récents de la bibliothèque s'appliquent à tous ces éléments.

## Boucle de la grille (déjà existante, étendue)

Sources : articles, formations, pages, auteurs, catégories, étiquettes — 1 à 48 éléments — tri, étiquettes, « exclure l'élément
courant », « suivre l'archive » — pagination : aucune, page x/y, précédent/suivant, numéros, « Voir plus », défilement infini
(les deux derniers par un petit script ; sans JavaScript le lien reste une vraie page suivante).

## Inventaire

| Élément | Existait avant | Nouveau | Fonctionnel | Backend | Frontend | Responsive | Données dynamiques | Tests |
|---|---|---|---|---|---|---|---|---|
| Menu, fil d'Ariane, recherche, logo, titre du site, copyright, filtre par catégorie | oui | – | oui | oui | oui | oui | oui | existants |
| Compte du visiteur (connexion, panier) | oui | – | oui | oui | oui | oui | oui | existants |
| Liste dynamique (récents, populaires, commentés, liés, même auteur, archive, hasard ; pages ; auteurs ; catégories ; nuage d'étiquettes ; formations) | non | **oui** | oui | `query.js` | `querylist.ejs` | oui | oui | site-widgets, query-builder |
| Informations de l'article (auteur, dates, catégorie, lecture, commentaires, lectures) | non | **oui** | oui | `site.js` | `postmeta.ejs` | oui | oui | site-widgets |
| Catégorie et étiquettes (liens) | non | **oui** | oui | oui | `postterms.ejs` | oui | oui | site-widgets |
| Article précédent / suivant | page du blog seulement | **oui (widget)** | oui | `query.neighbours` | `postnav.ejs` | oui | oui | site-widgets |
| Boîte auteur | page du blog seulement | **oui (widget)** | oui | oui | `authorbox.ejs` | oui | oui | site-widgets |
| En-tête d'archive (titre, description, nombre) | non | **oui** | oui | scope `archive` | `archiveinfo.ejs` | oui | oui | site-widgets |
| Commentaires de l'article (liste + formulaire) | page du blog seulement | **oui (widget)** | oui — publie par la route existante du blog | oui | `postcomments.ejs` | oui | oui | site-widgets |
| Mini-panier | dans « Compte du visiteur » | **oui** | oui | oui | `minicart.ejs` | oui | oui | site-widgets |
| 14 raccourcis « contenu de l'article » (titre, résumé, image à la une, dates, auteur, photo auteur, catégorie, étiquettes, lecture, commentaires, lectures, lire la suite, retour au blog) | non | **oui** | oui | éléments existants + étiquettes | idem | oui | oui | site-widgets |
| 4 raccourcis archive / recherche (titre, description, nombre, résultats de recherche) | non | **oui** | oui | idem | idem | oui | oui | site-widgets |
| 12 raccourcis « listes dynamiques » | non | **oui** | oui | `query.js` | `querylist.ejs` | oui | oui | site-widgets |
| Contenu de l'article, sommaire (table des matières) | oui | – | oui | oui | oui | oui | oui | existants |

## Ce qui n'existe PAS (faute de moteur) — dit franchement

- **Champs personnalisés (type ACF) et métadonnées libres** : le projet n'a pas ce moteur ; aucun widget « champ personnalisé ».
- **Produits / panier détaillé / paiement dans un widget** : seuls les formations et le compteur du panier existent ; pas de liste du panier en widget.
- **Modèles de page « Auteur », « Résultats de recherche », « Formation »** : l'archive (catégorie, étiquette, auteur) et la recherche passent par
  le modèle « Liste du blog » existant (le scope `archive` indique laquelle) ; pas de modèle séparé.
- **Widgets SEO (titre/description SEO en widget)** : le moteur SEO existe mais n'est pas exposé en widget ; le fil d'Ariane existant est conservé.
- **Boîte de connexion / déconnexion en widget séparé** : couverte par « Compte du visiteur ».
- **Commentaires imbriqués (réponses), modération depuis la page** : non (le blog n'en a pas).
- **Carrousel de boucle** : la grille existante et les cartes ; pas de diaporama de résultats.
