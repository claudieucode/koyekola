# Mission 9 — Theme Builder : matrice fonctionnelle

> **Mise à jour (mission 9.1, commit `4189ed9`)** : l'en-tête, le pied de page et les variantes d'un site ne s'appliquent plus à chaque enregistrement. Ils ont maintenant un brouillon, un aperçu privé et un bouton « Mettre à jour » (voir `KOLAKISA_SITE_HEADER_FOOTER_DRAFT_*.md`). Les passages ci-dessous qui parlent d'application directe décrivent l'état *avant* 9.1.

Statuts : VALIDÉE (démontrée par un test que j'ai exécuté) · PARTIELLE · DÉFECTUEUSE · ABSENTE · BLOQUÉE · NON TESTÉE.
« M9 » = test ajouté par cette mission ; « existant » = test d'avant la mission, **rejoué** avec succès.

## A. Types de modèles
| Fonction | Statut | Preuve / remarque |
|---|---|---|
| En-tête d'un site du Page Builder : créer, modifier, associer, appliquer aux pages | VALIDÉE | existant `site-web-entete` ; M9 navigateur : canevas = page publiée (320 / 768 / 1440 px) |
| En-tête : prévisualisation **avant** publication | VALIDÉE depuis 9.1 | brouillon + aperçu privé + « Mettre à jour » (test serveur et Chrome) ; la mention « application directe » ci-contre est périmée |
| Pied de page d'un site : affiché une fois, jamais hors de son site, retiré proprement | VALIDÉE | M9 serveur |
| En-tête / pied de page du site public (blog) | PARTIELLE | configuration structurée (logo, liens, mentions) avec brouillon → publication ; pas d'édition par widgets du catalogue (L5) |
| Article individuel (`single_post`) : titre, contenu, auteur, date, catégorie, image, champs `{{post.…}}` | VALIDÉE | existant `editeur-modeles-theme` ; M9 : un seul document HTML |
| Page individuelle générique | ABSENTE | voir INVENTORY 1.4 |
| Page À propos (`static_page`) | PARTIELLE | seule page statique couverte |
| Liste du blog, archive de catégorie / étiquette / auteur | PARTIELLE | choix du modèle validé (existant + M9 « Pourquoi ») ; rendu public de chaque famille non rejoué une par une par cette mission, sauf la liste du blog (existant) |
| Résultats de recherche | PARTIELLE | recherche du blog seulement ; requête sans résultat non testée par M9 |
| Page 404 | VALIDÉE | M9 : modèle affiché, **statut HTTP 404 conservé**, un seul `<html>` |
| Fiche formation (`single_course`) | NON TESTÉE | non exercée par cette mission |
| Archive vide / pagination des archives | NON TESTÉE | non exercées |

## B. Gestion des modèles
| Fonction | Statut | Preuve / remarque |
|---|---|---|
| Lister, distinguer type / état | VALIDÉE | existant « écran d'administration » |
| Créer / affecter | VALIDÉE | existant + M9 (entrées invalides refusées sans effet) |
| Renommer | PARTIELLE | se fait en renommant la **page** modèle ; pas de nom propre à l'affectation |
| Rechercher / filtrer | ABSENTE | liste ≤ 30 lignes ; jugé inutile à cette échelle |
| Dupliquer une affectation | ABSENTE | on duplique la page-modèle ; l'affectation se recrée |
| Duplication d'une page-modèle / d'un site : identifiants uniques, contenu conservé | VALIDÉE | M9 : composants d'un site copié = copie propre, 0 identifiant commun |
| Copier un site : en-tête, pied de page, variantes, exceptions | VALIDÉE | M9 (**était DÉFECTUEUSE**, T4) |
| Associer au bon site | PARTIELLE | les modèles de thème sont un réglage de l'organisation (site public) : pas de rattachement à un autre site possible ; les composants refusent l'autre site (existant + M9) |
| Retirer une affectation | VALIDÉE | existant |
| Supprimer / archiver une page-modèle avec protection | VALIDÉE | M9 (**était DÉFECTUEUSE**, T6) : refus listant le modèle, ou détachement explicite sans référence orpheline |
| Dépublier un modèle | VALIDÉE | existant : « sans modèle en ligne, affichage d'origine » |

## C. Conditions d'affichage
| Fonction | Statut | Preuve |
|---|---|---|
| Tout le site / catégorie / étiquette / article précis / public | VALIDÉE | existant + M9 |
| Une page déterminée (hors article) | ABSENTE | non prévu par le moteur |
| Priorité déterministe (article 8 › catégorie 4 › étiquette 2 › public 1 › général ; ancienneté) | VALIDÉE | existant + M9 `explain` |
| Comprendre pourquoi un modèle est ou n'est pas appliqué | VALIDÉE | M9 (**était ABSENTE**, T7) : écran + JSON |
| Doublon de conditions refusé ; étape de tunnel refusée ; page archivée refusée | VALIDÉE | existant + M9 |
| Plusieurs en-têtes / pieds de page incompatibles | VALIDÉE | un seul de chaque par site (colonne unique) ; M9 : une seule occurrence rendue |
| Modèles qui se référencent circulairement | VALIDÉE (par construction) | un composant ne peut pas contenir un composant ; un modèle ne rend que sa page |

## D. Identifiants et styles
| Fonction | Statut | Preuve |
|---|---|---|
| Identifiants régénérés à la copie / au détachement d'un composant | VALIDÉE | M9 + existant |
| Références sans orphelines (suppression de composant, de page-modèle) | VALIDÉE | existant (composants) + M9 (page-modèle) |
| Identifiants des sous-éléments à la duplication d'une **page** | PARTIELLE | seules les sections reçoivent de nouveaux identifiants ; les éléments gardent les leurs (uniques dans leur page, jamais partagés entre pages) |
| Jetons du site (couleurs, polices) appliqués aux modèles | VALIDÉE | existant `cms-appearance` (« --kw-primary » dans le modèle) |
| Classes globales / polices dans les modèles | NON TESTÉE | non rejouées par cette mission (suites d'origine passent) |

## E. Widgets et contenu imbriqué
| Fonction | Statut | Preuve |
|---|---|---|
| Boutons texte + adresse : diaporama | VALIDÉE | M9 navigateur : refus expliqué, valeur conservée, correction enregistrée |
| Boutons texte + adresse : bandeau, appel à l'action | PARTIELLE | refus explicite côté serveur (sondé), parcours éditeur non rejoué |
| Onglets / accordéons avec widgets imbriqués | ABSENTE | contenu texte seulement (L3) |

## F. Sauvegarde, historique, publication (composants et pages-modèles)
| Scénario | Statut | Preuve |
|---|---|---|
| Publier sans modification en attente | VALIDÉE | M9 (« version identique » : `changed:false`, pas de version en double) |
| Publier pendant un enregistrement en cours | VALIDÉE | M9 navigateur (**était DÉFECTUEUSE**, T8) |
| Échec réseau pendant l'enregistrement | VALIDÉE | M9 navigateur : message, travail gardé, reprise |
| Session expirée | VALIDÉE | M9 navigateur : message « Session expirée », reprise |
| Deuxième onglet / conflit de révision | VALIDÉE | M9 serveur + navigateur (**était DÉFECTUEUSE**, T1/T2) |
| Publication de deux composants distincts | VALIDÉE | M9 serveur |
| Modifier un composant utilisé par plusieurs pages | VALIDÉE | M9 serveur (2 pages mises à jour, les autres intactes) |
| Publier puis retirer un composant global | VALIDÉE | existant `composants-cycle-de-vie` |
| Restaurer une version précédente — **page** modèle | VALIDÉE | existant (palier 7) |
| Restaurer une version précédente — **composant** | ABSENTE | un composant n'a qu'un compteur de version, pas d'historique (L6) |
| Rendu public = modèle publié ; repli si rien ne s'applique | VALIDÉE | existant + M9 |
| Aucun doublon `<html>/<head>/<body>`, feuille de style du site au plus une fois | VALIDÉE | M9 (page avec modèle ; 404) |

## G. Sécurité (détail dans le rapport de sécurité)
Droits côté serveur sur affectation / retrait / enregistrement / mise à jour / suppression de composant : VALIDÉE (M9, rôle lecteur). Entrées invalides : VALIDÉE (M9). Isolation entre organisations : NON TESTÉE par M9 (requêtes toutes filtrées par `organization_id`, relues).
