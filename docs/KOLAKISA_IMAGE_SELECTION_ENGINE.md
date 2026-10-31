# Sélection intelligente des images

`brief.visualBrief({ sectorText, role, sectionText, mood, hue, index, side })` produit la fiche ; `relevance.rank(candidats, fiche)` classe.

## Secteurs couverts (par mots-clés)
immobilier, technologie, santé, restauration, portfolio (variété volontaire), boutique/mode, formation, construction, hôtellerie, association, blog ; sinon « générique ».

## Facettes (exemple immobilier)
« Visitez nos intérieurs : salon et cuisine » → facette `interior` : on privilégie salon/cuisine/chambre et on **écarte** immeuble/façade. « Le quartier et ses jardins » → `exterior`. Un bien présenté par sa façade n'est donc pas choisi quand le texte parle d'intérieurs (test : le salon passe avant l'immeuble).

## Score de pertinence (0–100)
+ mots communs avec le sujet attendu (≤ 40) + correspondance de facette (≤ 35) − éléments à éviter (30) ± orientation (10/8) − qualité (flou, petite, sombre : 10) ± côté calme pour le texte (10/5). Preuve indiquée : « métadonnées » ou « métadonnées + pixels ».

## Cas sans information
Une image sans description ni nom parlant est **non évaluable** (score 0, `evaluable: false`) ; elle est classée au-dessus d'une image dont la description la désigne comme hors sujet.

## Limite essentielle
Une photo de salon mal nommée n'est pas reconnue comme salon. Tant qu'aucun modèle de vision n'est branché, la qualité du classement dépend des descriptions saisies (ou générées avec la consigne).
