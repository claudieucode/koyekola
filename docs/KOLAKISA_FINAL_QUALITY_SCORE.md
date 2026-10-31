# Score de qualité et certification interne — 22.10

*Seuils et pondérations internes à Kolakisa, pas une certification sectorielle. Règle : un critère non testé est « non évalué », jamais noté au hasard ; un score élevé ne compense ni vulnérabilité critique, ni perte de données, ni défaillance de publication.*

| Domaine | Pondération | État de l'évaluation | Base factuelle | Points |
|---|---:|---|---|---|
| Qualité de génération IA | 15 | **Partielle** | socle déterministe mesuré (brief 3,6/4, architecture 9/10 du mesurable) ; compréhension réelle d'un modèle **non évaluée** (aucun fournisseur) | non attribués |
| Qualité visuelle | 15 | **Partielle** | contrastes AA, 19 couleurs primaires/21 ; **1 structure d'accueil sur 21** ; jugement esthétique non refait | non attribués |
| Éditeur visuel | 10 | **Non évalué** | aucun test dédié de fluidité/glisser-déposer dans ce programme | — |
| Intégration CMS | 10 | **Évalué** | pages natives, brouillon, publication, 74 pages lues en HTTP 200 ; publication sans blocage des exemples ; Blog non branché | 7 / 10 (jugement, justifié ci-contre) |
| Widgets et sections | 10 | **Partiel** | sections 6/10 du mesurable au labo ; 22.4 non réalisé ; 59/74 pages avec exemples | non attribués |
| Contenu et SEO | 10 | **Évalué** | contenus 2,8/4 ; SEO-accessibilité 4/5 ; méta description 21/74 ; hreflang émis ; moteur 22.6 non branché à la génération | 5 / 10 |
| Images et médias | 5 | **Évalué** | **0 image** sur 74 pages générées ; 22.7 non branché | 0 / 5 |
| Responsive | 10 | **Partiel** | 22.8 testé en émulation Chrome sur pages de test ; sites générés non rendus sur 7 tailles | non attribués |
| Performance | 5 | **Partiel** | 22.9 ; poids moyen 6,4 Ko/page HTML, médiane 19 ms (serveur local) ; aucun LCP/INP/CLS réel | non attribués |
| Sécurité et multisite | 5 | **Évalué (tests existants rejoués)** | isolation inter-sites testée ; aucune faille critique ou élevée ouverte connue ; paiement/IA réels non vérifiés | 4 / 5 |
| Fiabilité et sauvegarde | 5 | **Évalué** | révisions, conflits, instantanés, refus clairs ; pas de pile d'annulation unifiée | 4 / 5 |

**Points attribués : 20 sur 35 de pondération entièrement évaluée** (les 65 autres points de pondération ne sont pas évalués ou seulement en partie). **Borne basse sur 100 : 20/100.** Ce chiffre ne mesure pas la qualité du produit : il mesure ce qui est **prouvé** ici. Borne basse du laboratoire sur son propre barème : **48,6/100** (75,3 % du mesurable).

## Conditions de certification
| Condition | Résultat |
|---|---|
| Aucun défaut de sécurité critique ou élevé non traité | ✅ aucun connu ouvert |
| Aucun problème bloquant de sauvegarde ou de publication | ✅ |
| Aucun échec critique dans les parcours de génération | ⛔ **4 boutiques plafonnées** (parcours d'achat non démontré), 26 pages non publiables d'origine, 59/74 pages avec textes d'exemple publiables |
| Isolation multisite vérifiée | ✅ (tests existants rejoués) |
| Traçabilité des tests | ✅ (`KOLAKISA_PROGRAMME22_10_FINAL_AUDIT.md`) |

## Niveau
Niveau interne : **« Moins de 60 : niveau non validé »** pour la partie prouvée, avec la réserve que 65 % de la grille n'a pas pu être évaluée. Ce n'est pas un jugement négatif sur le code existant mais sur les preuves disponibles.
