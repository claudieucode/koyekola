# Rapport de performance — résolutions d'image

## Mesuré (machine i5 de 2015, **très chargée** pendant la mesure : charge système 10 à 21)
Fabrication d'une version (première visite seulement), image synthétique 3000 × 2000, JPEG 973 Ko, `sharp` :
| Taille | Temps de fabrication |
|---|---|
| 150 px | 19 ms |
| 320 px | 23 ms |
| 640 px | 52 ms |
| 1024 px | 149 ms |
| 1600 px | 383 ms |
Ensuite la version est servie par le dossier statique (mêmes en-têtes, cache 30 jours) : aucun calcul.

## Non mesuré / limites honnêtes
- **Poids des fichiers** : l'image synthétique est très compressible (versions de 0,1 à 66 Ko) : ces poids **ne sont pas représentatifs d'une photo**. Aucun gain de poids réel n'est annoncé ; il dépend de l'image.
- Coût de l'inspecteur : une requête `resolutions.json` par sélection d'un widget image (résultat gardé en mémoire dans l'éditeur) ; non chiffré.
- Temps de chargement de page avant/après : non mesuré.
- Aucune régression mesurée sur le canevas ; non comparée chiffres à l'appui (le rendu n'ajoute qu'un test par image).
- Risque connu : un pic de visites sur une image jamais demandée déclenche une fabrication unique (déduplication en mémoire) ; la concurrence de `sharp` est limitée à 1.
