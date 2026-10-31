# Qualité de la génération IA — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

## Ce qui est alimenté par un modèle et ce qui est déterministe
| Capacité | Moteur | Source |
|---|---|---|
| Analyse du brief, questions, classification | règles + modèle (simulé) | `ai/builder/brief.js` ; **qualité réelle d'un modèle jamais mesurée** |
| Plan de site | règles (catalogue 20.6) + modèle | labo : déterministe |
| Pages / sections / widgets | **règles** (`pageGen/mapper.js`) | labo |
| Contenu | modèle (simulé) + anti-invention | `contentGen` |
| Direction artistique | règles (couleurs, polices, contrastes) | `designGen` |
| Images | planificateur + fournisseur (non vérifié) | `aiMedia` |
| Régénération | règles lexicales | `regen` |
| Évaluation éditoriale | règles | `contentIntel` |

**Aucun appel à un fournisseur d'IA réel n'a été fait** (aucune dépense). Les cases « comprend réellement les instructions », « questions pertinentes », « cohérence rédactionnelle » ne peuvent donc **pas** être notées : ⚪.

## Garde-fous mesurés (labo, cas de briefs)
Briefs courts, vagues, incomplets, complexes, contradictoires : voir `results.json › brief`. Constat 22.1 Q9 toujours valable : un modèle qui invente est déclassé mais sa valeur est conservée (« Tokyo » en « déduite »).
