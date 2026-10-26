# API d'extension, droits et validation

## Droits [Doc / Connu]
- Chaque réglage, section, panneau peut exiger une capacité (`capability`) ; par défaut la plupart des options ne sont visibles que des administrateurs. [Doc]
- La capacité standard du Customizer est `edit_theme_options` ; le CSS additionnel exige `edit_css`. [Connu]
- `theme_supports` conditionne un objet à une fonctionnalité du thème. [Doc]

## Validation et assainissement [Doc]
- `sanitize_callback` (serveur) obligatoire en pratique ; `sanitize_js_callback` côté client ; `validate` JS ne remplace jamais le serveur.
- Les valeurs par défaut doivent être identiques dans la déclaration et à la lecture.

## Sécurité du CSS/JS personnalisé [Connu]
- WordPress filtre le CSS additionnel (`wp_strip_all_tags`) ; seul un compte autorisé peut l'écrire. Le HTML/JS libre n'est pas proposé par le Customizer.

## Extension [Doc]
- Hook `customize_register` ; sous-classes de contrôle/section/panneau ; actions `customize_preview_init`, `customize_controls_enqueue_scripts` ; filtre `customize_control_active`.
- Éditeur de site : `theme.json` (paramètres, styles, modèles personnalisés, parties), variations de styles. [Doc partielle]

## Enseignements pour Kolakisa [Déduit]
- Catalogue **fermé** de réglages, chacun avec type, bornes, droit éventuel et portée de site (déjà en place dans `services/customizer.js`).
- Toute valeur validée par le moteur de rendu lui-même ; refus explicite plutôt que correction silencieuse.
- CSS libre : préfixé, sans `@`, sans ressource externe, droit dédié ; aucun JavaScript.
