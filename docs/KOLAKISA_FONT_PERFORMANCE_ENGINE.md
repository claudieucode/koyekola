# Polices

## Constaté
Bibliothèque locale WOFF2 (`/fonts/library`, cache 30 j immutable). Pages du LMS : préchargement de `figtree-latin` et `bricolage-grotesque-latin`. Les `@font-face` générés pour un site (`fontFacesFor`) sont dans le HTML de la page.

## Fait (détection seulement)
`font-display` absent, Google Fonts (connexions externes), plus de 4 familles. Ce sont des **constats** de l'analyseur ; rien n'est modifié automatiquement.

## Non fait
Sous-ensembles de caractères, préchargement automatique des polices critiques des sites, polices de remplacement ajustées (size-adjust). Aucune mesure de décalage de police (CLS) n'a été prise. Licences : aucune police ajoutée ni convertie.
