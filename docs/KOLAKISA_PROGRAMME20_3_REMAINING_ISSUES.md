# KOLAKISA — Programme 20.3 : points restants

*Constat de départ : les documents du Programme 20.1 n'existent que sur la branche locale `docs/programme20-1-audit` (non poussée, non fusionnée) ; le Programme 20.2 est sur `origin/feat/programme-20-2-site-builder`, non fusionné, avec 10 tests hérités en échec (registre de menu des sites). 20.3 a donc été bâti sur `origin/main` (décision de l'utilisateur), sans 20.2.*

## Dépendances non satisfaites
| # | Point | Effet |
|---|---|---|
| D1 | 20.2 non fusionné, non validé (10 tests de registre de menu en échec sur main) | L'isolation « par site » repose sur ce que main contient déjà (palier 17), pas sur 20.2 |
| D2 | Affectations de modèles **par organisation**, pas par site du Page Builder (`mk_settings` `theme.templates`) | Deux sites d'une même organisation partagent leurs affectations ; une page de l'autre site peut servir de modèle. Corriger demande une migration (`site_id` sur les affectations) et une décision sur le site public « principal » |

## Fonctions de la spécification non réalisées
| # | Fonction | État |
|---|---|---|
| R1 | Modèle de **page individuelle** générique | Absent (une page du Page Builder porte sa propre mise en page) |
| R2 | Modèles **e-commerce** (produit, archive, catégorie produit) | Absents : pas de boutique dans le dépôt |
| R3 | **Dupliquer** un modèle | Non réalisé : un doublon exact de conditions est refusé par conception ; la page modèle se duplique dans le Page Builder |
| R4 | **Prévisualiser avec un contenu choisi** (article, catégorie) | Partiel : l'éditeur montre le dernier article / la dernière formation ; pas de sélecteur. « Pourquoi ce modèle ? » simule la catégorie et l'article |
| R5 | Archives **par date**, champs personnalisés | Non pris en charge par le CMS |
| R6 | Publier / dépublier **le modèle** | C'est l'état de sa page (« Mettre à jour » / hors ligne), pas un interrupteur propre à l'affectation |
| R7 | Étiquettes saisies : validation par liste | Ni les catégories ni les étiquettes ne sont validées contre le blog (texte libre comparé sans interprétation, comportement historique conservé : une validation stricte a fait échouer 2 tests existants et a été retirée). Seuls les articles précis et exclus doivent exister |
| R8 | Variantes d'un modèle | Aucune notion de variante dans les affectations (les variantes d'en-tête sont un autre mécanisme) |

## Non vérifié
Rendu responsive des modèles aux trois largeurs, contrastes, navigation clavier de l'écran modifié (aucune mesure faite pour 20.3) ; Firefox / Safari ; suite complète `npm test` ; rendu avec plusieurs organisations sur un vrai serveur (l'isolation est testée au niveau du module avec deux organisations, pas par HTTP).

## Pour passer au Programme 20.4
Fusionner et valider 20.2 (et corriger ses 10 tests de registre), décider D2, puis choisir R1/R4.
