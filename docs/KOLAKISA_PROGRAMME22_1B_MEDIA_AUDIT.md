# KOLAKISA — Audit de la qualité des médias générés (programme 22.1)

## Périmètre réel

Le Media Generator (21.7) a été exercé **avec son seul fournisseur opérationnel : « démonstration »**. Ce fournisseur produit localement des **visuels d'attente** (dégradés déterministes, marqués « démonstration »), sans IA et sans coût. Le fournisseur OpenAI Images est écrit mais « **jamais appelé en réel, non vérifié** » (le code le dit lui-même) ; aucun autre fournisseur d'images n'est intégré. Il n'existe donc **aucune image d'IA réelle** à juger : pertinence, composition et cohérence stylistique d'un vrai fournisseur sont **non évaluées**. La mission interdit d'appeler un service payant sans configuration ni autorisation : aucun appel n'a été fait.

## 1. Ce qui a été mesuré

| Contrôle | Résultat |
|---|---|
| Besoins en images planifiés depuis la structure réelle des pages | 5 à 12 par site (tableau « Génération », colonne médias) |
| Images effectivement générées dans le laboratoire | 1 par site : le bandeau de l'accueil (par choix du protocole : un visuel d'attente par site) |
| Rattachement natif dans la page | ✔ chemin `/uploads/marketing/<org>/site-<id>/…` validé par le moteur |
| Image cassée à l'affichage | **0** sur 15 sites (4 formats) — tableau « Responsive » |
| Texte alternatif | Présent sur toutes les images affichées ; **générique** (« Visuel d'attente — <type de site> ») : sans valeur descriptive |
| Provenance | ✔ chaque média porte sa provenance (« démonstration ») et un avertissement d'attente |
| Gestion des médias existants | Non évaluée ici (couverte par les tests 21.7 : bibliothèque, import, restauration) |

### Constats visuels

- Le visuel d'attente est un **dégradé violet en diagonale**, sans rapport avec la marque ni la palette appliquée (bleu) : il rompt la cohérence d'ensemble et ne peut pas passer pour une image finale (D-M1).
- Ratios et résolutions : miniatures de 128 à 192 px de côté étirées sur la largeur du bandeau — acceptable pour un visuel d'attente, **inacceptable pour une publication**.
- **Variantes responsive** : aucune image multi-résolution (`srcset`) n'est produite ; la même miniature sert sur tous les formats.

## 2. Limites réelles des fournisseurs (documentées, non testées)

| Sujet | État |
|---|---|
| OpenAI Images | adaptateur testé **uniquement contre un faux serveur** ; prix non vérifiés (`unverified`) ; formats 1:1, 3:2, 2:3 |
| Gemini / Imagen, Stability, Black Forest Labs | **non intégrés** |
| Droits et provenance | le système exige une provenance et un avertissement ; la licence d'une image d'IA dépend du fournisseur (non vérifiée) |
| Coût | plafond et autorisation de dépense existent (`spendAuthorized`) ; **jamais exercés en réel** |

## 3. Causes racines

- Un seul fournisseur utilisable, qui produit des visuels d'attente : **dépendance externe non résolue** (origine 8).
- Le plan d'images (`planner.js`) décrit des besoins, mais le **parcours par défaut n'en génère qu'un à la demande** : rien n'est lancé automatiquement.
- Le texte alternatif n'est pas rédigé à partir du contenu de la section.

## 4. Recommandations

P1 : vérifier **un** fournisseur d'images réel avec une clé de test et un plafond de dépense, puis évaluer 15 jeux d'images à l'aveugle. P2 : texte alternatif descriptif (à partir de l'objectif de la section) ; teinte des visuels d'attente alignée sur la palette ; variantes responsive (`srcset`). P3 : bibliothèque d'images libres de droits à titre de repli.

## 5. Ce qui n'est pas évalué

Pertinence, cadrage, cohérence stylistique et qualité d'images produites par un vrai modèle ; coût réel ; délais de génération réels ; comportement en cas d'erreur du fournisseur (testé seulement avec des erreurs simulées en 21.7).
