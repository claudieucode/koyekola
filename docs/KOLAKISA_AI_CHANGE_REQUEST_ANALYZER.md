# Change Request Analyzer

`src/regen/analyzer.js` — règles **déterministes** sur le français (texte sans accents, minuscules). Aucune IA n'est appelée pour comprendre.

## Sortie
`{ intent, op?, target:{kind, pageHint?, typeHint?, fieldHint?, afterType?}, property?:{name, value|token|direction}, scope:{requested: local|page|global|unspecified, explicitGlobal}, preserve[], ambiguities[], supported, note }`

## Intentions reconnues
`change_style` (fond, espacement, alignement, largeur ; taille de texte) · `rewrite_text` (réécrire, raccourcir, développer, plus professionnel, plus commercial, simplifier, corriger, SEO) · `replace_image` · `add_section` (type + « après les… ») · `change_design` (couleur principale / secondaire / accent, nom de couleur ou `#rrggbb`) · `redesign_page` et `mobile_advice` (non pris en charge, expliqués) · `advice` (question : aucune modification).

## Périmètre et préservation
« uniquement », « cette section », « ce titre » → local ; « toutes les », « du site » → global **explicite** ; « sans modifier les autres pages / images / textes » → liste `preserve`.

## Ambiguïtés
Valeur manquante, page non désignée, plusieurs sections du même type, type de section absent : question + candidats ; aucune opération n'est créée.

## Limites
Couverture limitée aux formulations courantes (voir tests) ; pas de compréhension libre : une phrase hors règles → « je n'ai pas compris » avec des exemples. Les noms de couleurs sont mappés sur une palette courte (marine, bleu, rouge, vert, orange, violet, noir, blanc, gris) ; une couleur absente impose un code `#rrggbb`.
