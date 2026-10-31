# Feuille de route corrective — 22.10

## Corrigé dans ce programme
| Réf. | P | Correction | Preuve |
|---|---|---|---|
| Q3 (partiel) | P1 | `pageGen.apply` renseigne `seo.description` à partir du but du plan ou d'une phrase réelle du contenu ; **jamais** d'un texte d'exemple (crochets, « Remplacez par », lorem). Sans contenu réel, reste vide. | `tests/page-generator.test.js` (nouveau test, 27/27) |
| Labo | — | 6 scénarios ajoutés (21 au total) | `tests/quality-lab/scenarios.js` |

**Limite du correctif Q3 :** au labo, 0/74 pages gagnent une description, car le parcours sans IA ne produit que des textes d'exemple ; le correctif ne profitera qu'aux plans qui portent un but ou du contenu réel (plan IA, saisie utilisateur).

## Ouvert — P1 (bloquant la certification)
| Réf. | Constat | Cause racine | Action recommandée |
|---|---|---|---|
| Q1 | 21/21 accueils identiques | recette fixe `RECIPES.accueil`; `layoutGen` (22.3) non branché | brancher `layoutGen.composePage` sur la génération d'accueil, par secteur |
| Q2 | 59/74 pages publiées avec exemples | la publication ne consulte pas les détecteurs | bloquer/avertir à la publication via `contentIntel.review` |
| Q4 | 0 image | médias = étape séparée sans fournisseur | brancher le planificateur d'images + fournisseur configuré |
| Q5/I1 | boutique = catalogue de formations ; planificateur « indisponible » | table `TYPE_OF` antérieure à 20.5 | aligner catalogue et registre sur la boutique native |
| Q6 | 26 pages non publiables d'origine | formulaire jamais associé | proposer l'association du formulaire dans le parcours |
| Fournisseur IA | aucune validation réelle | clés non fournies | essai borné avec clé de test et plafond de coût |

## P2
Q7 teintes, Q8 homonymes entre sites, Q9 valeurs inventées conservées, Q10 architectures répétitives, types de pages manquants (chambres, programme, intervenants), hreflang non émis, 22.2/22.4/22.5/22.7/22.8/22.9 à réaliser. **P3 :** Q11, Q12, saisies UI 22.6, menu contextuel éditeur.

## Hors périmètre du code
Webhook Stripe 503 : variables `NODE_ENV`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` à définir par le propriétaire.
