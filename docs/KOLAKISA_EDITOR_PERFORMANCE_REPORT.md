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

## Poids ajouté aux pages publiques (mesuré, fichiers du dépôt)
| Fichier | Avant | Après | Compressé (gzip) avant → après |
|---|---|---|---|
| `public/css/landing.css` | 97 029 o | 108 247 o | 21 762 → 24 261 o (+2,5 Ko) |
| `public/js/landing.js` | 31 705 o | 34 658 o | 8 518 → 9 332 o (+0,8 Ko) |
| `public/js/page-builder.js` (éditeur seulement) | 663 620 o | 678 838 o | non mesuré |
Le coût est payé par toutes les pages publiques (CSS et script partagés) ; il n'a pas été mesuré en temps de chargement.
Aucun gain de performance n'est annoncé pour les nouvelles fonctions (animations CSS pures, un seul `setInterval` par diaporama de fond, désactivés si « réduire les animations »).
