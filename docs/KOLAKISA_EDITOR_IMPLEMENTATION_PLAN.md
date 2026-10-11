# Plan d'implémentation et état par palier

| Palier | Contenu | État au 10 octobre 2026 |
|---|---|---|
| 0 | Audit initial, état de référence | **Fait** (`KOLAKISA_EDITOR_INITIAL_AUDIT.md`) |
| 1 | Documentation Elementor + matrice | **Fait partiellement** : 18 documents, échantillon de 8 widgets lus ; pages non lues listées dans `16-official-sources.md` |
| 2 | Images : résolutions, service commun, rendu, persistance | **Fait** (Image, Galerie, Carrousel, Boîte d'image, Points d'intérêt, fond d'image, photo de témoignage) |
| 3 | Widgets incomplets | **Fait** pour les écarts trouvés : galerie complétée, contour du texte, visionneuse du widget Image |
| 4 | Mise en page / manipulation | Rien à corriger trouvé : raccourcis, menu contextuel, copier/coller du style déjà présents (audit initial) |
| 5 | Styles | Contour du texte ajouté (typographie) ; reste déjà couvert par les audits existants |
| 6 | Responsive | Galerie : colonnes plafonnées à 2 sur téléphone, lignes justifiées plus basses ; points de rupture personnalisés **reportés** |
| 7 | Interactions | Aucun écart nouveau trouvé (moteur de mouvement déjà présent) ; légende au survol respecte « réduire les animations » |
| 8 | Persistance / publication | Vérifié de bout en bout pour chaque ajout : enregistrement, rechargement, page publiée |
| 9 | Optimisation, contrôle final | Mesures A/B de l'éditeur (voir rapport de performance) ; tests de régression (voir rapport de tests) |
