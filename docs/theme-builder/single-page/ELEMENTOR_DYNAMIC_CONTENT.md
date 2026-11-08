# Contenu dynamique d'une page : Elementor et Kolakisa

## Principe Elementor (C/D)
Les widgets de modèle Single lisent le contenu **courant**. Un aperçu avec un contenu réel est proposé (C). Les balises dynamiques (Pro) injectent titre, extrait, image mise en avant, auteur, dates, champs personnalisés, liens, dans presque tout réglage (le catalogue complet n'a pas été lu : N).

## Kolakisa (constaté)
| Donnée | Disponible pour une page | Détail |
|---|---|---|
| Titre | oui | `{{post.title}}` = titre de la page (H1 du modèle) |
| Contenu | oui | `postcontent` : le contenu propre de la page prend sa place |
| Extrait / description | oui | `{{post.excerpt}}` = description de la page |
| Image mise en avant | non | l'élément image `{{post.image}}` est retiré pour une page |
| Auteur, dates, catégories, commentaires | non pertinents | réservés aux articles (interdits dans les modèles de page par test) |
| URL | partiel | adresse de la page via les liens/partage |
| Champs personnalisés **de page** | **absents** | pas de stockage de champs libres par page |
| Données du site | oui | fiche entreprise (`business.*`, y compris `custom1…6`), nom, logo, coordonnées via `biz*` |
| Menus | oui | `menu` par emplacement |
| Données de modules | oui | cours, produits, formulaires (si module actif) |

## Règles
* Le modèle reste réutilisable : aucun contenu statique de page n'y figure ; les textes d'exemple sont des consignes entre crochets.
* Un champ absent laisse l'emplacement vide ou masque le bloc ; jamais de valeur fictive.
* Contenus conditionnels : visibilité par appareil et audience existent dans le Page Builder (`AUDIENCES`, `scheduleMatches`) ; à vérifier sur les modèles lors de la phase de tests.

## Écart principal à décider
Ajouter des champs personnalisés de page demanderait du stockage (une table ou une colonne) : c'est une décision d'architecture à valider (voir `TARGET_ARCHITECTURE.md`), non engagée.
