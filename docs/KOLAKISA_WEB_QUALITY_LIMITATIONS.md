# Qualité web et formats — limites connues

1. **Pas une certification.** Les contrôles automatiques détectent une partie des problèmes WCAG/SEO/performance ; une liste de contrôles manuels est affichée dans le rapport.
2. **Pas de validateur W3C.** Contrôles structurels sur le DOM rendu seulement (doublons d'id, imbrication interactive, titres vides, langue).
3. **Contraste** : calculé sur des fonds unis/superposés ; texte sur image ou dégradé non vérifié (ignoré, pas faussement « conforme »). Échantillon de 400 éléments de texte.
4. **Focus visible et navigation clavier complète** : non automatisables sans interaction ; listés en contrôles manuels. Seuls les défauts détectables statiquement (rôle bouton non focalisable, tabindex positif) sont signalés.
5. **Chevauchements** d'éléments : non détectés (risque de faux positifs trop élevé).
6. **Performance** : estimations statiques (dimensions d'image, chargement différé) clairement séparées des observations ; CLS/LCP lus dans l'éditeur ne représentent pas la page publiée. Pas de poids réel des fichiers.
7. **Audit en continu** : écran affiché seulement ; les autres écrans exigent l'audit complet (le cadre change de largeur quelques secondes).
8. **Format au niveau page uniquement.** Pas de format de site hérité par toutes les pages, pas de bibliothèque de formats personnalisés réutilisables (le format « Personnalisé » est propre à la page).
9. **Points de rupture** : non gérés par le format (ils restent ceux du site).
10. **Verrou** : porte sur les éléments de premier niveau. Un élément imbriqué déplacé au premier niveau avec une largeur est refusé à l'enregistrement (message d'erreur) plutôt que corrigé automatiquement. La restauration d'une ancienne version remplace tout le contenu, verrou compris (action explicite).
11. **Aucun rôle « bloquant »** n'est émis : aucune règle ne justifie d'empêcher une publication ; la gravité existe pour de futures règles configurables.
12. **IA** : qualité réelle des corrections non mesurée sans clé en production ; l'IA ne reçoit pas d'image.
