# Apparence → Styles : limites

- Mesures réalisées dans Chrome (macOS) via Playwright à 1440, 1100, 900 px et zoom CSS 150 %. Firefox/Safari, mobile (< 700 px) et zoom natif du navigateur non testés ; l'empilement du panneau sous l'aperçu en largeur réduite est le comportement existant, non modifié.
- Sans le zoom natif, le zoom 150 % est simulé par `zoom` CSS : approximation.
- La rangée du bouton ↺ n'apparaît qu'après modification ; sa géométrie est réservée côté droit, vérifiée dans le test de stabilité.
- La capture « avant » est celle fournie par l'utilisateur (hors dépôt) ; elle venait de la production, avec d'autres données (pas de couleur Accent affichée).
- Prévisualisation : seule la mise en page a été examinée (aucun défaut de débordement constaté) ; les modes Tablette/Mobile gardent le comportement existant.
- Le calcul WCAG n'a pas été modifié ; non ré-audité au-delà des tests existants.
