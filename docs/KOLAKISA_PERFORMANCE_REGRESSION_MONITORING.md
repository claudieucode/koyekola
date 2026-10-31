# Détection des régressions

`src/perfEngine/regress.js`, appliquée entre deux rapports d'une page (automatiquement après chaque analyse, ou à la demande avec seuils configurables).

## Règles
1. **Comparabilité** : même nature (`kind`), même environnement ; en laboratoire, même profil. Sinon la métrique est *écartée avec la raison* (jamais comparée).
2. **Double seuil** : le seuil relatif **et** le plancher absolu doivent être dépassés (+200 % sur 2 Ko = stable ; +5 Ko sur 1 Mo = stable).
3. **Bruit** : en laboratoire, moins de 3 relevés (le plus petit des deux rapports) ou variation inférieure à l'étendue mesurée → **« incertain »**, jamais « régression ».
4. **Jamais bloquant** : `blocking` vaut toujours `false`. Aucune publication n'est empêchée.

## Seuils par défaut (configurables par appel)
| Métrique | Relatif | Plancher |
|---|---|---|
| HTML gzip | 20 % | 5 000 o |
| JS | 10 % | 10 000 o |
| CSS | 15 % | 8 000 o |
| Requêtes | 20 % | 4 |
| Images | 25 % | 3 |
| DOM | 20 % | 150 |
| Scripts bloquants / domaines externes | — | 1 |
| LCP / INP / CLS / TTFB | 15 % / 15 % / 25 % / 30 % | 200 ms / 50 ms / 0,02 / 100 ms |

## Limite
Seule l'analyse statique alimente l'historique. Les comparaisons LCP/INP/CLS existent dans le moteur (testées) mais attendent des rapports de laboratoire ou terrain, non ingérés aujourd'hui.
