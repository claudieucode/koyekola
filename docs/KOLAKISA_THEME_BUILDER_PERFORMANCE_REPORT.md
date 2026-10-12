# Mission 9 — Theme Builder : performance

**Conditions :** MacBook/iMac 4 cœurs très chargé pendant toute la mission (charge moyenne 24 à 40 mesurée à la fin ; une autre session lançait ses propres tests). Chiffres **indicatifs** : ils comparent « avec / sans » dans les mêmes conditions, pas des valeurs absolues. Aucun seuil de test n'a été créé ni modifié.

## Rendu public (serveur de test réel, médiane de 40 requêtes après échauffement)
| Page | Sans modèle | Avec modèle (31 éléments : 30 titres + contenu de l'article) |
|---|---|---|
| Article du blog | 10,1 ms | 12,2 ms |
| Page 404 | 7,5 ms | 8,1 ms |

Le modèle est bien appliqué dans ces mesures (le texte « Titre 29 » est présent dans la réponse). Surcoût observé : environ +2 ms (article) et +0,6 ms (404), de l'ordre du bruit de mesure sur cette machine.
La sélection du modèle (`pick`) lit le réglage JSON et au plus une ligne de page par candidat, sans boucle ; `explain` n'est appelée qu'à la demande de l'écran « Pourquoi ce modèle ? ».

## Éditeur d'un composant (Chrome réel)
- Rafale de 6 saisies à 120 ms d'intervalle : **1 enregistrement**, 6 rendus d'aperçu (un par saisie, comme pour une page), 1 845 ms jusqu'à « enregistré ». Aucune erreur de script.
- Aucun nouvel écouteur ni chargement en boucle n'a été ajouté par la mission (les changements côté navigateur sont deux lignes dans le gestionnaire d'enregistrement et le bouton « Mettre à jour »). **Le nombre d'écouteurs n'a pas été mesuré** : non vérifié.

## Non mesuré
- Éditeur d'un modèle très chargé (centaines de widgets) : le comportement du canevas est celui du palier 8 (correction du cadre qui disparaît), non remesuré ici.
- Le test de fluidité de la mission 6, intermittent sous charge (palier 8, cause non démontrée), n'a pas été relancé ; son seuil est intact.
