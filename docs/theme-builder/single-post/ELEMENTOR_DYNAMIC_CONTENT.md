# Contenu dynamique : Elementor et Kolakisa

## Principe Elementor (C/D)
Les widgets Single lisent l'article **courant** (celui de la requête). Dans l'éditeur, un réglage d'aperçu fournit un article d'exemple (C). Les balises dynamiques (Pro) injectent titre, extrait, image, auteur, dates, termes, URL et champs personnalisés dans n'importe quel réglage (N pour le catalogue complet).

## Principe Kolakisa (constaté)
* Public : `render.js` résout `{{post.*}}` depuis l'article de la requête (vue `post`). Aucune valeur d'exemple n'est injectée.
* Aperçu : article choisi (« Aperçu avec ») ou plus récent publié ; sans article, état explicite.
* Isolation : testée (article A ≠ A2 ≠ autre site).

## Table des champs
| Donnée demandée | Étiquette / widget | Repli si vide |
|---|---|---|
| Titre | `{{post.title}}` | — (toujours présent) |
| Contenu | `postcontent` | — |
| Image mise en avant | `{{post.image}}` | emplacement vide (jamais d'image factice) |
| Extrait | `{{post.excerpt}}` | vide |
| Auteur, avatar, bio, lien | `{{post.author}}`, `author_avatar`, `author_bio`, `author_url` | vide |
| Dates | `{{post.date}}`, `{{post.modified}}` | — |
| Temps de lecture | `{{post.reading_time}}` (calculé) | — |
| Catégories, étiquettes | `{{post.category}}`, `{{post.tags}}`, `postterms` | vide |
| Commentaires | `{{post.comments}}` (nombre), `postcomments` | voir `TEST_PLAN.md` |
| URL, slug, id, lectures | `post.url`, `slug`, `id`, `views` | — |
| SEO | `post.seo_title`, `post.seo_description` | — |
| **Champs personnalisés / taxonomies libres** | **absent** | à décider (voir feuille de route, étape 3) |
| Image de partage | non exposée comme étiquette | à vérifier |

## Règle de repli recommandée
Une donnée absente masque son bloc ou affiche un libellé neutre modifiable ; jamais de valeur fictive.
