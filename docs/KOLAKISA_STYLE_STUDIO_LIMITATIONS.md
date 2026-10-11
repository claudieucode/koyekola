# Style Studio — limites

- Portée : **site uniquement**. Pas de style « page » ni de style partagé entre sites (aucune infrastructure pour cela ; rien de simulé).
- Les styles sont **liés** : modifier ou redéfinir un style met à jour tous les éléments qui l'utilisent, y compris sur les autres pages du site. « Dissocier » est la copie.
- La suppression dissocie les éléments de **la page ouverte** ; les autres pages du site qui utilisent le style perdent son apparence (annoncé dans la confirmation).
- Hors style, volontairement : mise en page / Flexbox / grille / placement dans le parent (dépendent du contexte), position, image de fond (contenu), animations d'entrée / défilement / souris (propriétés du nœud), parties de widgets, CSS libre et attributs.
- Pas de style de caractère (pas de sélection de caractères stylée dans le moteur de texte) : les styles de texte s'appliquent à un bloc entier.
- Valeurs en jetons de design (`var(...)`) : conservées telles quelles ; l'aperçu les ignore si le navigateur ne les résout pas.
- Aperçu : échantillon « Aa » avec les propriétés d'aspect (dimensions, marges, transformations exclues pour rester lisible).
- Le bouton principal est dans Avancé → classes, dans les menus et dans la palette ; pas de panneau latéral dédié.
- Non testés : thème sombre, performance sur grande page, rendu de chaque catégorie une à une dans Chrome.
