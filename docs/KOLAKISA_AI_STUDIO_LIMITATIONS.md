# IA Kolakisa — limites connues (honnêtes)

1. **Pas de capture d'image envoyée au modèle.** Le socle `runJson` ne transporte que du texte. En « Corriger », l'IA reçoit les tracés, les éléments réellement recouverts et leurs mesures/styles — pas l'image des pixels. Ajouter l'image demande d'étendre `aiCore.runJson` aux blocs image.
2. **Qualité des réponses non mesurée en conditions réelles.** Les tests utilisent un faux serveur d'API : ils prouvent le contrat, la validation et l'interface, pas la pertinence créative du modèle. Aucune clé `ANTHROPIC_API_KEY` n'a été essayée en production.
3. **Annotation sur la zone visible.** Le défilement est bloqué pendant le tracé (faire défiler avant) ; un zoom/redimensionnement conserve les tracés, un défilement non.
4. **Pas d'images/vidéos créées par l'IA.** Elle n'invente ni médias ni adresses ; elle propose des éléments sans média.
5. **Responsive : règles, pas de jugement esthétique.** Sept familles de constats (débordement, largeur fixe, texte, tactile, colonnes, retour à la ligne, marges). Les cas sans règle sûre sont signalés « à traiter à la main ».
6. **Annulation d'un aperçu** : si la page est modifiée pendant l'aperçu, l'aperçu est conservé et l'annulation passe par Ctrl+Z.
7. **Une demande à la fois par page** (verrou en mémoire du processus : non partagé entre plusieurs instances du serveur).
8. **Historique de conversation** limité aux 6 derniers échanges, conservé dans l'onglet (perdu au rechargement de la page).
9. Éléments « sections » de l'ancien format (hors `layout`) : lisibles par l'IA, modifiables seulement par `set_props`.
