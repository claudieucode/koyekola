# KOLAKISA — Programme 22.1 : limites et reste à faire

## Ce que ce palier n'a PAS fait (et pourquoi)

| # | Point | Raison | Conséquence |
|---|---|---|---|
| L1 | Évaluation de la **compréhension du brief par un modèle de langage** | Aucun fournisseur d'IA configuré ni vérifié ; la mission interdit tout appel payant non autorisé | Critère « compréhension du brief » (10 points) non noté |
| L2 | Évaluation de la **rédaction** (titres, paragraphes, FAQ, SEO rédactionnel, multilingue) | Idem | Critère « contenus » (10 points) non noté ; la couverture maximale de la grille est **80/100** |
| L3 | Évaluation des **images d'un vrai fournisseur** | Seul le fournisseur « démonstration » est utilisable ; OpenAI jamais appelé | Pertinence et qualité d'image non évaluées |
| L4 | **Benchmark par essais réels** des concurrents | Aucun compte ni clé ; essais externes hors périmètre | Benchmark **documentaire** seulement, à vérifier |
| L5 | **Lighthouse / Core Web Vitals / axe-core** | Non installés dans le projet ; ajout hors périmètre | Performance et accessibilité mesurées par des contrôles maison, **sans valeur de conformité** |
| L6 | Pilotage de l'**interface du studio (21.8)** | Le laboratoire appelle les mêmes services ; les suites navigateur du 21.8 sont existantes | Fidélité de l'interface non rejouée ici |
| L7 | Régénération (21.9) et historique | Hors des 15 scénarios du palier | Couverts par les tests 21.9 existants (rejoués) |
| L8 | Firefox, Safari, lecteurs d'écran | Seul Chrome est présent | Non testés |
| L9 | Mesures de performance **en production** | Aucun déploiement de sites générés en production ; machine locale très chargée | Chiffres comparables entre exécutions, **pas des temps réels** |
| L10 | Correction des défauts | Le palier établit le diagnostic ; la mission demande de ne pas reconstruire les moteurs | Défauts D-G1 à D-X1 **ouverts**, listés dans la feuille de route |

## Défauts ouverts

Voir le registre de `KOLAKISA_PROGRAMME22_1B_QUALITY_AUDIT.md` (D-G1 P0 ; D-N1, D-C1, D-G2, D-S1, D-V1, D-B1, D-U1 P1 ; D-M1, D-B2, D-R1 P2 ; D-X1 P3) et la feuille de route `KOLAKISA_PROGRAMME22_1B_ROADMAP.md`.

## Précautions pour les paliers suivants

- Les tests marqués « ÉTAT 22.1 » **décrivent un défaut** : ils doivent être **inversés** à la correction, pas supprimés ni affaiblis.
- Les briefs de référence sont **figés** par empreinte ; les modifier invalide la comparaison (mettre à jour l'empreinte et refaire une mesure de référence).
- Le laboratoire exige Chrome et `playwright-core` (`NODE_PATH` vers un `node_modules` qui le contient) ; il lance un serveur par lot : compter une dizaine de minutes sur une machine chargée.
- `scripts/quality-lab-navigateur/generate.js` utilise un fournisseur d'IA **simulé** ; le brancher sur un fournisseur réel est une décision de coût à faire valider par le propriétaire.
- Le dossier `docs/quality-lab-navigateur/` contient des **résultats de mesure** (JSON, captures JPEG) : ne pas les éditer à la main.

## Hygiène du dépôt

- `docs/_p20_parts/` (brouillons non suivis du programme 20.1) reste non suivi : le hook de la machine interdit la suppression dans `Downloads`.
- Les worktrees de travail (`KOYEKOLA-programme20-5`, `KOYEKOLA-base205`, `KOYEKOLA-programme22-1`) restent sur disque pour la même raison ; ils ne sont pas versionnés.
