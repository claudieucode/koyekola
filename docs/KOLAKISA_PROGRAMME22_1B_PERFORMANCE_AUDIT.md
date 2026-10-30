# KOLAKISA — Audit de performance de la génération et des sites générés (programme 22.1)

## Conditions de mesure (à lire avant les chiffres)

- Machine de développement **très chargée** (charge système > 40 pendant une partie des mesures, d'autres sessions exécutant leurs propres suites).
- Serveur Kolakisa local (Node 24, SQLite), **réseau non limité**, pas de compression par un serveur frontal, cache navigateur vide à chaque contexte, Chrome 150 sans limitation du processeur.
- Fournisseur d'IA **simulé** : les durées de génération **excluent** le temps d'un vrai modèle (qui dominera en production : plusieurs secondes à minutes).
- Les chiffres sont **comparables entre deux exécutions du laboratoire**, **pas des temps de production** ; aucune valeur Lighthouse ou Core Web Vitals de terrain n'est annoncée (outils non installés). FCP et durées de chargement viennent de l'API Performance de Chrome.

## Génération (vrais moteurs, IA simulée)

<!--TABLE:Génération-->
| Scénario | Pages | Publiées | Conflit inter-sites | Pages bloquées | Médias (besoins/bandeaux) | Durées ms (pages/design/médias/publication) |
| --- | ---: | ---: | --- | --- | --- | --- |
| entreprise | 5 | 4 | non | Contact | 6/1 | 102 / 34 / 412 / 90 |
| immobilier | 5 | 3 | oui | Contact (2), Estimer mon bien | 12/1 | 21 / 30 / 923 / 47 |
| construction | 5 | 4 | oui | Demander un devis | 9/1 | 8 / 11 / 452 / 152 |
| tech | 4 | 3 | oui | Contact (4) | 5/1 | 138 / 32 / 1498 / 10 |
| photo | 4 | 3 | oui | Réserver | 8/1 | 7 / 18 / 193 / 24 |
| portfolio | 4 | 3 | oui | Contact (5) | 8/1 | 45 / 16 / 62 / 106 |
| institution | 5 | 4 | oui | Contact (6) | 6/1 | 6 / 5 / 51 / 17 |
| restaurant | 5 | 4 | oui | Réserver (2) | 6/1 | 5 / 11 / 42 / 19 |
| blog | 4 | 3 | oui | Lettre d'information | 5/1 | 7 / 126 / 78 / 5 |
| boutique | 9 | 8 | non | Contact | — | 85 / — / — / 569 |
| mode | 8 | 7 | non | Contact | — | 124 / — / — / 153 |
| informatique | 8 | 7 | non | Contact | — | 771 / — / — / 1352 |
| services | 4 | 3 | oui | Devis | 5/1 | 4 / 7 / 122 / 17 |
| education | 5 | 4 | oui | Inscription | 6/1 | 29 / 12 / 32 / 6 |
| sante | 5 | 4 | oui | Rendez-vous | 6/1 | 6 / 41 / 43 / 13 |
<!--/TABLE-->

Lecture : plan, pages, design, application des pages et publication se comptent **en millisecondes à dizaines de millisecondes** pour 4 à 5 pages ; la **génération du visuel d'attente** (≈ 30 à 500 ms par site, jusqu'à ≈ 1,5 s) domine, à cause de l'écriture des fichiers ; la publication de la boutique (≈ 150 ms à 1,4 s pour 8 produits et 8 pages) pèse davantage que celle des sites vitrines (5 à 150 ms). Ces durées sont cohérentes avec la mesure du programme 21.11 (12 pages × 8 sections en 17,7 ms). Le goulot réel de production sera le fournisseur d'IA (hors périmètre).

## Sites générés (bureau)

<!--TABLE:Performance mesurée-->
| Scénario | chargement médian ms | chargement max ms | FCP médian ms | transfert max Ko | requêtes max | décodé max Ko | mémoire JS Mo (max) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| entreprise | 136 | 168 | 128 | 116 | 7 | 263 | 1.5 |
| immobilier | 103 | 171 | 116 | 118 | 8 | 264 | 1.5 |
| construction | 153 | 243 | 144 | 118 | 8 | 265 | 1.5 |
| tech | 161 | 180 | 168 | 117 | 8 | 263 | 1.5 |
| photo | 117 | 160 | 140 | 118 | 8 | 263 | 1.5 |
| portfolio | 87 | 165 | 88 | 118 | 8 | 264 | 1.5 |
| institution | 117 | 180 | 148 | 119 | 8 | 265 | 1.5 |
| restaurant | 156 | 157 | 136 | 118 | 8 | 264 | 1.5 |
| blog | 132 | 169 | 148 | 118 | 8 | 264 | 1.5 |
| boutique | 132 | 325 | 144 | 113 | 7 | 260 | 1.5 |
| mode | 101 | 196 | 116 | 113 | 7 | 260 | 1.5 |
| informatique | 113 | 164 | 124 | 113 | 7 | 260 | 1.5 |
| services | 160 | 179 | 176 | 118 | 8 | 265 | 1.5 |
| education | 127 | 205 | 156 | 118 | 8 | 264 | 1.5 |
| sante | 138 | 289 | 140 | 118 | 8 | 264 | 1.5 |
<!--/TABLE-->

Lecture : **chargement médian de 87 à 161 ms (maximum observé 325 ms)**, **FCP médian de 88 à 176 ms**, **≈ 118 Ko transférés pour la première page** (dont la feuille de style commune, ≈ 100 Ko) et **7 ou 8 requêtes** ; **aucune page n'a dépassé 500 Ko ni 60 requêtes** ; mémoire JavaScript ≈ 1,5 Mo. Les pages suivantes d'un même site tombent à 2–3 Ko (feuille de style en cache). **Aucune image lourde** : les visuels d'attente sont des miniatures (voir `MEDIA`) — ce qui **fausse favorablement** la mesure : une vraie image de bandeau (200 Ko à 1 Mo) changerait le poids et le LCP. Le LCP et le CLS **n'ont pas été mesurés** (pas de vrai contenu).

## Enregistrement, aperçu, publication

- **Enregistrement des pages** (`applyPages`) : de l'ordre de la dizaine de millisecondes (tableau « Génération », colonne pages).
- **Publication** : 5 à 152 ms pour 3 à 5 pages (sites vitrines) ; 153 ms à 1,4 s pour une boutique de 8 pages et 6 produits.
- **Aperçu** : non mesuré séparément (l'aperçu est la page native).

## Causes racines et recommandations

Aucun problème de performance **mesuré** ; risques identifiés non mesurés : (1) poids des images réelles (P2, 22.7), (2) feuille de style commune de ≈ 100 Ko chargée sur toute page (à segmenter ? P3), (3) génération par IA séquentielle page par page (à paralléliser sous plafond de coût ? P2, 22.6). Recommandation : intégrer Lighthouse hors production et fixer un **budget de ressources** (poids, requêtes, LCP) par type de page, appliqué au laboratoire (22.7).

## Ce qui n'est pas évalué

Temps de génération avec un vrai modèle ; consommation mémoire du serveur sous charge ; comportement avec 50 pages ou 500 produits (partiellement couvert par les tests de performance 21.11) ; réseau mobile lent ; mise en cache d'un serveur frontal.
