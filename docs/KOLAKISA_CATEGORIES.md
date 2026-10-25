# Catégories de formations (espace formateur)

## Modèle réel (inchangé)
Il n'existe **pas de table de catégories** : la catégorie est un texte porté par chaque formation (`courses.category`, défaut « Autre »). Pas de description, d'image,
de hiérarchie ni d'état de publication propres. Une catégorie existe tant qu'une formation la porte. Sa page publique est `/categorie/<slugify(nom)>` et réunit les
formations **publiées de tous les formateurs** portant ce nom. L'isolation est celle de l'espace formateur : on ne voit et ne modifie que ses propres formations (`instructor_id`).

## Ce qui a été fait (aucune migration de données)
- `src/services/courseCategories.js` : liste avec compteurs réels (une requête groupée : total, publiées non archivées, brouillons, archivées), repérage des noms proches
  (« Langue »/« Langues ») et des noms qui mènent à la même page publique, renommage, fusion, conséquences, orthographe canonique, choix du formulaire.
- Page `/formateur/categories` : recherche, tri (nom, nombre de formations, modification récente), filtres (toutes, visibles, non visibles, à vérifier), tableau qui devient une pile de cartes sous 720 px.
- Page `/formateur/categories/modifier?nom=` : conséquences exactes (formations touchées, adresse publique, autres formateurs) ; **renommer vers une catégorie existante = fusion**, refusée tant que la case de confirmation n'est pas cochée.
- Ancienne adresse publique → nouvelle : redirection 301 (`seo_redirects`, note « Catégorie renommée »), **sauf** si un autre formateur utilise encore l'ancien nom ou si seule la casse change ; revenir à l'ancien nom retire la redirection devenue fausse.
- Journal d'activité : `category.renamed` (de, vers, nombre de formations, fusion, redirection).
- **Correctif de fond** : le formulaire de formation n'offrait que 9 catégories fixes ; une catégorie renommée ou créée n'y figurait plus, et l'enregistrement la remplaçait en silence par la première (« Développement »). Le formulaire propose désormais les catégories du formateur, conserve l'actuelle, et permet « Nouvelle catégorie… » (orthographe existante réutilisée : pas de doublon de casse).
- `/formateur/formations?categorie=` : lien depuis le compteur de chaque catégorie.

## Ce qui n'existe pas (et pourquoi)
- **Créer une catégorie vide** : sans table, elle disparaîtrait immédiatement. Elle se crée depuis une formation.
- **Supprimer** : sans table, « supprimer » n'a de sens que comme réaffectation ; c'est la fusion (aucune formation supprimée).
- **Hiérarchie parent/enfant, description, image** : changements métier et de données distincts (table, URL, filtres publics) ; non engagés.

## Tests
`tests/categories-formateur.test.js` (16, HTTP : compteurs, recherche/tri/filtres, renommage, fusion, redirection, isolation entre formateurs, formulaire) ;
`tests/categories-navigateur.test.js` (6, Chrome : 9 largeurs 320 à 1920, noms longs, cibles tactiles, clavier, fusion, sans JavaScript).
