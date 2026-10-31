# Intelligence visuelle avancée — architecture et honnêteté

## Principe
Un seul module (`src/imageIntel`) au-dessus de la médiathèque et d'`aiMedia`. Il **mesure** ce qui se mesure (pixels) et **applique des règles** là où le contenu est connu (métadonnées, secteur, rôle). Il ne prétend jamais reconnaître le sujet d'une image.

## Ce que chaque « moteur » demandé est réellement
| Moteur demandé | Réalité | Limite |
|---|---|---|
| Image Intelligence Core | `index.js` (façade) | — |
| Visual Context Analyzer | `brief.visualBrief` : secteur, rôle, facette, ambiance, teinte | secteurs par mots-clés (11) ; texte de section lu par expressions régulières |
| Image Content Analyzer | **non fait** : `subject: null` | aucun modèle de vision n'est branché |
| Image Relevance Engine | `relevance.rank` d'après descriptions/étiquettes | sans description : « non évaluable » |
| Visual Asset Classifier | classes d'ALT et rôles ; pas de classification par contenu | idem |
| Image Quality Analyzer | `analyzer` : flou, sombre, surexposé, petit, lourd | seuils de départ, à calibrer sur de vraies photos |
| Image Composition Analyzer | point d'intérêt par contraste local + côté calme | heuristique, **pas** une détection de sujet |
| Image Style Analyzer | luminosité, saturation, contraste, teintes | pas de style « photographique / illustration » |
| Brand Visual Matching | `brand.match` | repères d'ambiance, pas des règles esthétiques |
| Image Placement Planner | `brief` + `aiMedia.planner` | 2 emplacements natifs seulement (bandeau, section Image) |
| Image Variant Selector | `crop.perDevice` + variantes existantes | pas de nouveau fichier par défaut |
| Asset Recommendation Engine | `recommend` | classement sur 40 images maximum |
| Visual Consistency Validator | `brand.consistency` | ≥ 3 images analysées |

## Garanties
Lecture seule (aucune écriture, aucune migration, aucune tâche de génération) ; images d'un seul site ; analyses en mémoire (clé = fichier + date + taille, 300 entrées) ; fichiers > 25 Mo refusés ; décompression limitée à 60 millions de pixels.
