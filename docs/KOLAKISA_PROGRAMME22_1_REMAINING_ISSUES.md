# Palier 22.1 — Limites et problèmes restants

**2026-10-30.**

## Limites de l'audit (ce qui n'a PAS été évalué)
| Sujet | Raison | Conséquence |
|---|---|---|
| Qualité réelle des contenus rédigés par IA | aucun fournisseur configuré ; aucun crédit consommé | note « contenus » partielle (4 pts sur 10 mesurables) |
| Compréhension réelle d'un brief par un modèle | idem | seuls les garde-fous et règles déterministes sont mesurés (4 pts sur 10) |
| Pertinence et qualité des images | aucune image générée, aucun fournisseur réel vérifié | critère « médias » à 0 mesurable |
| Esthétique (originalité, harmonie, personnalité) | pas de navigateur, pas de revue humaine | 8 pts de la qualité visuelle non notés |
| Rendu desktop / laptop / tablette / mobile | Chrome/Playwright absents | responsive noté sur le HTML/CSS seulement |
| Lighthouse, Core Web Vitals, mémoire | idem / non instrumenté | performance = temps serveur local |
| Accessibilité réelle (clavier, lecteur d'écran) | idem | aucune conformité affirmée |
| Panier / checkout / paiement | parcours guidé non relié au moteur de boutique ; paiement jamais vérifié en réel | boutiques plafonnées |
| Studio IA (21.8) rejoué | exige un fournisseur | couvert par les tests du programme 21 |
| Benchmark concurrents | non testés | documenté uniquement |

## Problèmes constatés non corrigés (aucun moteur n'a été modifié, par consigne)
Voir `KOLAKISA_PROGRAMME22_1_QUALITY_AUDIT.md` §4 (Q1 à Q12) et `KOLAKISA_PROGRAMME22_ROADMAP.md` (R1 à R17).

## Héritage du programme 21 (rappel 21.11)
Planificateur non aligné sur la boutique (I1) ; régénération (21.9) et boutique IA (21.10) non branchées sur le studio ; 5 échecs de tests hérités de 20.5 (index de clés étrangères, infobulles, compteur d'entrées fermées) ; ≈ 190 suites navigateur non exécutées.

## Limites du laboratoire lui-même
- Il n'exécute pas l'étape « menu » du studio : la présence d'un menu dans les pages n'est pas notée.
- Le Page Generator est exécuté **sans IA** ; un site généré avec IA aura d'autres résultats (textes, structure du plan).
- La langue du site n'est pas transmise (briefs anglais → titres français).
- Les mesures de temps sont celles d'une machine partagée et varient d'une exécution à l'autre ; ne comparer que des ordres de grandeur.
- Les formules de notation sont des **proxys** documentés ; elles servent à mesurer des progrès, pas à classer des sites entre eux.
