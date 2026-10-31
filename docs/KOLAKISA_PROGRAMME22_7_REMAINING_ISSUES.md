# Programme 22.7 — Restes à faire (classés)

| Réf. | Priorité | Sujet | Détail |
|---|---|---|---|
| I-1 | P1 | Aucun modèle de vision | Le sujet d'une image n'est pas reconnu : pertinence = descriptions saisies. Brancher un modèle de vision (avec accord de dépense et clé de test plafonnée) pour décrire les images importées. |
| I-2 | P1 | Génération de pages sans images (22.1 M1) | Le Page Generator ne déclenche toujours pas `aiMedia.plan` + `recommend`. Brancher la planification des besoins après « Appliquer » puis proposer les images. |
| I-3 | P1 | Aucune interface | Les 4 routes renvoient du JSON ; ni écran, ni aperçu, ni curseur de point focal dans le Media Manager. |
| I-4 | P1 | Fournisseur réel non vérifié | OpenAI Images jamais appelé ; Google/Stability/BFL non intégrés ; aucune source de photos libres. Valider avec une clé de test plafonnée, relire les conditions et tester Unsplash/Pexels/Pixabay avant toute intégration. |
| I-5 | P2 | Seuils non calibrés | Flou, sombre, surexposé, cohérence : seuils posés sur des images synthétiques. À calibrer sur ≥ 50 photographies réelles. |
| I-6 | P2 | Éditeur d'images absent | Rotation, retournement, luminosité, contraste, saturation, température, netteté : rien n'existe. Première étape : recadrage + rotation + export en nouveau média. |
| I-7 | P2 | Rendu responsive non constaté | Aucun navigateur : cadrages par appareil calculés, pas vus. Pas de `<picture>`, pas de point focal par appareil dans la page. |
| I-8 | P2 | AVIF | Non généré dans le rendu public. |
| I-9 | P3 | Format 16:9 de génération | Les fournisseurs n'offrent que 1:1, 3:2, 2:3 ; un bandeau est un cadrage de 3:2 (22.1 M4). |
| I-10 | P3 | ALT « (image générée) » | Conservé (tests existants) ; à décider (22.1 M3). |
| I-11 | P3 | Recherche par sujet / images semblables | Seuls les doublons stricts et la recherche textuelle existent. |
| I-12 | P3 | Favoris, collections, remplacement depuis le diagnostic | Non faits. |
| I-13 | info | Antérieur à 22.2, 22.4, 22.5 | Ces paliers sont absents de `main` : leur interaction éventuelle n'a pas été testée. |
| I-14 | info | Échec hérité | Test D3 (index de clés étrangères des tables `mk_shop_*`, palier 20.5) : voir `TESTS`. |
