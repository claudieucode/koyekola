# IA Kolakisa — rapport de tests (2026-10-10)

Faux serveur d'API local + vrai SDK + Chrome réel. Aucune vraie clé Anthropic utilisée.

| # | Scénario | Fichier | Résultat |
|---|---|---|---|
| 1 | Bouton unique, grande fenêtre ↔ panneau sans perdre le texte, mode mémorisé après rechargement | ia-studio-navigateur | ✔ |
| 2 | Créer/modifier : proposition, différences avant→après, aperçu sans enregistrement, application en UNE étape, Ctrl+Z | ia-studio-navigateur | ✔ |
| 3 | Rejet sans effet ; suppression bloquée sans case de confirmation | ia-studio-navigateur | ✔ |
| 4 | Question de clarification ; valeur invalide refusée avec message | ia-studio-navigateur | ✔ |
| 5 | Responsive : mesure réelle, corrections cochables, écrites sur mobile seulement, ordinateur intact | ia-studio-navigateur | ✔ |
| 6 | Corriger : annotation → élément réel, mesures envoyées, correction appliquée, aucune annotation enregistrée | ia-studio-navigateur | ✔ |
| 7 | Crayon, flèche, cercle, rectangle, texte, gomme, annuler, tout effacer, Échap | ia-studio-navigateur | ✔ |
| 8 | Sans clé : 503 explicite, analyse responsive disponible | ia-studio-navigateur | ✔ |
| 9 | Permissions : lecture seule refusée (403) | ia-studio-navigateur | ✔ |
| 10 | Moteur : périmètre, élément inexistant, suppression à confirmer, identifiants créés par le serveur, type inconnu, conflit de révision, plafond, journal sans texte | ia-studio.test | ✔ (10 tests) |
| 11 | Aucune erreur de script pendant le parcours | ia-studio-navigateur | ✔ |

Total ciblé : 38 tests (dont les deux fichiers voisins affectés) passent.

Suite complète lancée en parallèle (2 fichiers à la fois) : 2 échecs de charge (« moteur de création du canevas » T10, « médiathèque » contraste) ; les deux fichiers repassent seuls. Mesure de performance chiffrée (temps de réponse du modèle, coût) : non réalisée, faute de vraie clé.
