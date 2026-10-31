# Programme 22.7 — Tests

## Nouveau : `tests/programme22-7-image-intelligence.test.js` (33 tests, tous verts)
Images synthétiques fabriquées avec sharp (résultats vérifiables), base en mémoire avec vraies migrations, vrai serveur pour les routes. Aucun appel réseau, aucune image d'IA, aucune dépense.

| Bloc | Couvre |
|---|---|
| Analyse de pixels | luminosité/contraste/teinte, netteté (bruit vs aplat vs flou), point d'intérêt et côté calme, poids/format/orientation, fichier invalide ou vide refusé, sujet jamais deviné |
| Recadrage | cover dans l'image, point focal analysé puis manuel, contain/fill/custom, mode inconnu, variante mobile conseillée |
| Fiche et propositions | 5 secteurs demandés, facette intérieur/extérieur, côté sujet/texte, ratios générables, propositions différentes (similarité < 0,7), témoignage refusé, consigne du planificateur |
| Pertinence et marque | salon avant immeuble, image sans description non évaluable, pixels pris en compte, teinte proche/éloignée/neutre, cohérence (avertissement) vs portfolio (information) |
| ALT, licences, optimisation | 4 classes d'ALT, contrôles, licences (inconnue ≠ libre de droits), sources externes non intégrées, dérivation WebP sans toucher l'original, transparence et animation préservées, SVG |
| Médiathèque réelle | inspection, cache, isolation entre sites, diagnostic (doublon, inutilisée, petite, licence), recommandations, envoi de SVG refusé, aucune tâche de génération |
| Web | lecture par l'équipe et un lecteur du site, 403/404 pour l'administrateur d'un autre site, 404 image inconnue, aucune dépense |

## Régression
- Médias et paliers 21 liés : `ai-media`, `marketing-medias`, `explorateur-medias`, `editeur-medias-variantes`, `programme21-integration-vitrine`, `programme21-8-ai-builder-http`, `programme22-1-quality-lab` : **97/97**.
- Garde : `audit-corrections`, `etape0-design`, `marketing-migrations`, `marketing-r0-coque`, `ia-par-site`, `programme22-6*`, `programme22-3*`, `programme21-*` : **390/391**. Seul échec : **D3** (index de clés étrangères des tables `mk_shop_*`, hérité du palier 20.5, présent avant ce palier, sans lien avec les images).

## Non exécuté
Lint et typecheck : inexistants dans le projet. Build : aucun code d'interface modifié. Suites navigateur (Playwright/Chrome absents) : non exécutées, donc rendu visuel, `srcset` réel et fluidité de l'éditeur **non constatés**. Performance : pas de mesure chiffrée dédiée (analyse bornée à 3 en parallèle ; durées non relevées). Les 30 thèmes de test de la mission ne sont pas tous couverts : upload/format/taille/stockage/rendu publié reposent sur les suites existantes de la médiathèque ; génération d'image réelle, édition d'image et persistance d'un cadrage ne sont pas testés (non développés).
