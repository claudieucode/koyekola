# Programme 21.5 — limites

- **Brief Analyzer et Site Planner (21.1, 21.3) absents** : le brief est analysé localement ; le type de site vient de l'assistant de création.
- **AI Core 21.2 non branché en production** : le port IA utilise le socle en service (`ai.call`).
- **Aperçu** : cartes d'échantillon (palette, titre, texte, bouton, carte) calculées avec les valeurs proposées ; l'aperçu réel de la page se fait dans le personnalisateur après application au brouillon (pas de second moteur de rendu).
- **Non générés** : mode sombre, couleur dédiée des titres, navigation, `xs`/`xxl`, compositions absentes du CMS (bandeau scindé, galerie, grilles asymétriques, filtres).
- **Polices** : seulement les 5 intégrées ; pas de police téléversée par le site ni de police externe.
- **Protection** : la détection compare à la valeur par défaut du moteur et aux valeurs déjà écrites par le générateur ; un réglage manuel identique par hasard à une valeur par défaut est considéré comme non manuel.
- **Régénération partielle** (un seul élément) : possible en choisissant d'autres réglages à remplacer ; pas d'interface dédiée.
- **Site principal** non concerné (écran par site).
- Rendu visuel non vérifié dans un navigateur.
## Prérequis pour 21.6
Brief Analyzer/Site Planner branchés sur `designGen.generate`; AI Core activé derrière le port; sélection de médiathèque pour imagerie; mode sombre.
