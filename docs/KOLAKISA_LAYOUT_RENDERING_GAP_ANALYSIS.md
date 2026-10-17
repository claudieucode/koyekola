# Analyse des lacunes (hiérarchisée par impact)

| P | Lacune | Impact réel | Décision |
|---|---|---|---|
| **P1** | Choix à mots-clés (flex, alignement, affichage…) sans aperçu immédiat | Perceptible à chaque geste de mise en page | **Corrigé** (D1) |
| **P2** | Élément masqué qui occupe sa place dans la mise en page de l'éditeur | La mise en page éditée diffère du publié tant qu'un élément masqué existe parmi des frères flex / grille ; confusion possible | Documenté (limite) : correction possible = le sortir du flux dans l'éditeur (`position:absolute` fantôme) mais le « voir en transparence à sa place » est le comportement de référence d'Elementor ; à décider avec l'utilisateur |
| **P2** | Aperçu immédiat absent pour ombres préréglées, polices, états (survol…), parties de widgets, écrans ≠ affiché | ~90 – 270 ms au lieu d'instantané | Non traité ; chaque famille demande de dupliquer la logique de `out()` côté client (risque de divergence) |
| **P2** | Latence de 90 – 270 ms même avec aperçu pour les clics suivants si la page est grande | Inconfort sur 380 éléments / 7 niveaux (268 ms avant → 100 ms) | Mesuré, amélioré pour les listes |
| **P3** | Pas de `grid-template-areas`, sous-grilles, requêtes de conteneur | Parité Elementor Pro avancée | Écart connu, hors périmètre (évolution du modèle) |
| **P3** | `calc()` / `clamp()` refusés | Mises en page fluides avancées | Restriction de sécurité conservée (aucune analyse de sécurité nouvelle faite) |
| **P3** | Cassures responsive personnalisées | Mission 4 | Reporté |
| **—** | Test intermittent `controles-numeriques-navigateur` | Fiabilité de la suite | Non reproduit (5 essais) : cause inconnue, surveillé |
