# Typographie Kolakisa — rapport de test

## Vérification navigateur (Chrome headless, `style.css` réel)
Police calculée de `var(--font-display)` et `var(--font-body)` : `Arial, "Helvetica Neue", Helvetica, "Liberation Sans"…`. Taille inchangée (h1 44 px) et graisse demandée 800 conservée (rendue en Arial Bold).

## Tests automatiques
- `typographie-arial` (nouveau) 5/5 ; `site-web-fondations` 22/22 ; `blog-mode-document` ; lot réglages/thème/éditeur/polices-par-site/apparence-templates : 133 réussis, 1 échec corrigé (attente « bricolage » → « arial » du pack), à relancer.
- `refonte-design` : 4 échecs (couleurs, ombres, classes orphelines), **identiques sur `main` avant mes changements** ; le test des polices passe.

## Non réalisé
Captures avant/après de chaque écran admin (connexion requise) ; test de charge visuel responsive page par page.
