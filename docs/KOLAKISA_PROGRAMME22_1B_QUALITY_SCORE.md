# KOLAKISA — Grille de notation de la qualité de génération (programme 22.1)

Cette grille est la **référence mesurable** des paliers 22.x. Elle est appliquée par `scripts/quality-lab-navigateur/score.js` aux mesures du laboratoire ; elle ne dépend d'aucun avis personnel non documenté.

## Principes

1. **100 points, 10 critères** (pondération de la mission).
2. **Honnêteté de la couverture.** Un critère n'est noté que sur ce qui a été réellement mesuré. Ce qui exige un vrai modèle de langage ou un jugement humain est **« non évalué »** : ses points sortent du dénominateur. La note est donc « points obtenus / points évalués, ramenée sur 100 », toujours accompagnée de la **couverture** (points évalués sur 100).
3. **Une note ne masque jamais une défaillance critique.** Toute défaillance critique plafonne le statut à « À AMÉLIORER », même si le total dépasse 70 (voir « Défaillances critiques »).
4. **Reproductible.** Mêmes briefs (empreinte vérifiée par test), mêmes moteurs, mêmes formats d'écran : la note ne bouge que si le produit change.

## Statuts

| Statut | Note |
|---|---|
| EXCELLENT | 90 à 100 |
| TRÈS BON | 80 à 89 |
| SATISFAISANT | 70 à 79 |
| À AMÉLIORER | 50 à 69 |
| INSUFFISANT | moins de 50 |

## Barème des critères

| Critère | Points | Comment il est noté | Évalué au 22.1 ? |
|---|---:|---|---|
| Compréhension du brief | 10 | Jugement du modèle sur des briefs variés (extraction, ambiguïtés, questions). Les garde-fous déterministes sont testés à part (tests unitaires). | **Non** (IA simulée) |
| Architecture du site | 10 | 10 − 3 par page bloquée (max 3 pages) − 1 en cas de conflit de noms avec un autre site ; boutiques : − 4 si les pages éditoriales n'ont pas pu être créées. | Oui (mesure) |
| Qualité visuelle | 20 | **6 points de lisibilité mesurée** (contraste AA calculé, images valides, texte ≥ 12 px) + **14 points de structure visible** : 7 contrôles de 2 points sur l'accueil — navigation entre les pages, titre du bandeau différent du nom de la page, bouton d'action, rythme (≥ 3 types de blocs), image, accueil sans texte d'exemple, pied de page utile. La part « goût » (originalité, harmonie) **n'est pas chiffrée** (voir `VISUAL_QUALITY_AUDIT`). | Oui (partiel) |
| Qualité des sections | 10 | 10 − 1,5 par page publiée contenant des textes d'exemple − 0,15 par texte d'exemple. | Oui |
| Qualité des contenus | 10 | Rédaction, ton, exactitude : exige le modèle. | **Non** |
| Qualité des médias | 10 | 4 (images présentes) + 3 (aucune image sans attribut `alt`) + 3 (aucune image cassée). La pertinence n'est pas notée (visuels d'attente). | Oui (partiel) |
| Responsive design | 10 | 10 − 2,5 par page qui déborde (4 formats) − 0,3 par cible tactile < 32 px sur mobile (max 3) − 0,3 par page à texte coupé. | Oui |
| Expérience utilisateur | 10 | 10 − 2 par page de conversion non publiable (max 2) − 0,7 par lien cassé − erreurs console/réseau (max 3) − 3 sans navigation − 1,5 sans bouton d'action. **Boutiques** : 4 points = parcours d'achat simulé réussi aux 3 formats + 6 points sur la même logique de liens et de pages. | Oui |
| SEO et accessibilité | 5 | 5 − 2,5 × part de pages sans titre/description/H1 unique/langue − étiquettes ou `alt` manquants (max 1,5) − 0,5 sans sitemap. | Oui (partiel) |
| Performance technique | 5 | 5 − 1 par page de plus de 500 Ko ou 60 requêtes − 1 par page de plus de 3 s. Mesures locales, réseau non limité. | Oui |

**Couverture maximale du 22.1 : 80 points sur 100** (brief et contenus non évalués).

## Défaillances critiques

Elles sont listées à côté de la note et plafonnent le statut :

- aucune navigation entre les pages publiées ;
- textes d'exemple publiés ;
- page de conversion (contact, devis, réservation…) non publiable ;
- images cassées ; défilement horizontal sur mobile ;
- parcours d'achat simulé défectueux (boutiques) ;
- (non mesurées par cette grille mais à traiter en priorité) : faille de sécurité, perte de données, fuite entre sites : elles rendraient le site INSUFFISANT quel que soit son aspect.

## Résultats du 22.1

<!--TABLE:Notes par scénario-->
| Scénario | Note /100 (sur points évalués) | Couverture | Statut | Critique |
| --- | ---: | ---: | --- | --- |
| entreprise | 64 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| immobilier | 63 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Contact (2), Estimer mon bien |
| construction | 65 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Demander un devis |
| tech | 63 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Contact (4) |
| photo | 72 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Réserver |
| portfolio | 71 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, page(s) de conversion non publiable(s) : Contact (5) |
| institution | 63 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Contact (6) |
| restaurant | 71 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Réserver (2) |
| blog | 75 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, page(s) de conversion non publiable(s) : Lettre d'information |
| boutique | 58 | 80/100 | À AMÉLIORER | aucune navigation : 8 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| mode | 58 | 80/100 | À AMÉLIORER | aucune navigation : 7 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| informatique | 58 | 80/100 | À AMÉLIORER | aucune navigation : 7 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| services | 66 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Devis |
| education | 63 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Inscription |
| sante | 66 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Rendez-vous |
<!--/TABLE-->

<!--TABLE:Détail des critères-->
| Scénario | brief | architecture | visuel | sections | contenus | medias | responsive | ux | seo | perf |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| entreprise | — | 7/10 | 8/20 | 5.1/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| immobilier | — | 3/10 | 10/20 | 7.6/10 | — | 10/10 | 8.2/10 | 1.5/10 | 5/5 | 5/5 |
| construction | — | 6/10 | 10/20 | 5.1/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| tech | — | 6/10 | 10/20 | 2.5/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| photo | — | 6/10 | 12/20 | 7.6/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| portfolio | — | 6/10 | 12/20 | 10/10 | — | 10/10 | 8.8/10 | 1.1/10 | 4.2/5 | 5/5 |
| institution | — | 6/10 | 10/20 | 3.4/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| restaurant | — | 6/10 | 12/20 | 7.6/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| blog | — | 6/10 | 12/20 | 10/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| boutique | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.3/5 | 5/5 |
| mode | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.2/5 | 5/5 |
| informatique | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.2/5 | 5/5 |
| services | — | 6/10 | 10/20 | 5.1/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| education | — | 6/10 | 10/20 | 3.4/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| sante | — | 6/10 | 10/20 | 6/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
<!--/TABLE-->

## Comment re-mesurer après une amélioration

1. `NODE_PATH=…/KOYEKOLA-blocs-gutenberg/node_modules node scripts/quality-lab-navigateur/run-all.js --out docs/quality-lab-navigateur`
2. `node scripts/quality-lab-navigateur/fill-docs.js` met à jour les tableaux des rapports.
3. Inverser (pas supprimer) les tests « ÉTAT 22.1 » de `tests/programme22-1b-lab-navigateur.test.js` correspondant aux défauts corrigés.
4. Comparer `docs/quality-lab-navigateur/scores.json` à la référence du 22.1 conservée dans l'historique Git.

## Ce que cette note ne dit pas

Elle ne dit rien de la qualité des textes écrits par un modèle, de la pertinence des images d'un fournisseur réel, ni de la conformité WCAG ou d'une obligation légale. Un site « TRÈS BON » ici peut être décevant à lire. Quand un fournisseur d'IA sera vérifié, les critères « brief » et « contenus » devront être évalués par une relecture humaine documentée avant d'être inclus dans la note.
