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
- **Inspecteur, mesure A/B** (nouveau code contre `main`, 3 tours alternés, page de 12 images, 24 sélections d'images, CDP `Performance.getMetrics`, machine chargée) : temps de script 144–244 ms contre 168–209 ms ; mises en page forcées 197–231 contre 210–250. **Aucune différence au-delà du bruit de mesure.** Le champ de résolution fait au plus une requête par jeu d'images, ensuite gardée en mémoire.
- Temps de chargement de page avant/après : non mesuré.
- Canevas : le rendu n'ajoute qu'un test par image ; non mesuré à part.
- Galerie : lignes justifiées et filtres = CSS et ~15 lignes de script, non mesurés.
- Risque connu : un pic de visites sur une image jamais demandée déclenche une fabrication unique (déduplication en mémoire) ; la concurrence de `sharp` est limitée à 1.
