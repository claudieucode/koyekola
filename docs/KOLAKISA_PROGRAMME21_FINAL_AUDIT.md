# Programme 21 — audit final (21.11)

Audit fait sur `origin/main` au commit `904709af` puis corrigé dans la branche `feat/programme-21-11-validation`. Chaque ligne s'appuie sur du code lu ou un test exécuté ; aucune ligne ne repose sur un document seul.

## Constat principal
**Les paliers 21.9 (régénération intelligente et historique) et 21.10 (intégration e-commerce) n'existent pas dans le dépôt** : aucun module, aucune route, aucune migration, aucun document, aucune branche distante correspondante. Le programme 21 n'est donc **pas complet**. De plus Kolakisa **n'a pas de catalogue de produits natif** (voir `KOLAKISA_PROGRAMME21_INTEGRATION_MATRIX.md`) : une boutique de matériel informatique ne peut pas être construite, avec ou sans IA.

## État des paliers
| Palier | Statut réel | Preuve principale |
|---|---|---|
| 21.1 audit et architecture | OPÉRATIONNEL (documentaire) ; « AI Orchestrator » = PARTIELLEMENT (pas de module unique, orchestration répartie) | `docs/KOLAKISA_PROGRAMME21_1_*.md` |
| 21.2 AI Core | PARTIELLEMENT OPÉRATIONNEL : testé avec fournisseurs simulés, aucune connexion réelle, branché seulement pour les médias | `tests/ai-core*.test.js` (56 tests) |
| 21.3 Brief Analyzer + Site Planner | OPÉRATIONNEL (clé d'IA requise, qualité réelle non évaluée) | 30 tests |
| 21.4 Page Generator + Component Mapper | OPÉRATIONNEL | 26 tests + scénario vitrine |
| 21.5 Design Generator | OPÉRATIONNEL | 25 tests + 9 ambiances × 12 teintes vérifiées |
| 21.6 Content Generator | OPÉRATIONNEL (clé d'IA requise) | 30 tests |
| 21.7 Media Generator + Asset Manager | PARTIELLEMENT : fournisseur d'images réel non vérifié, démonstration seulement | 21 tests |
| 21.8 interface | OPÉRATIONNEL (studio `/marketing/ia/studio`, autre session) ; ma réalisation alternative non déployée | 28 tests + navigateur non exécuté |
| 21.9 régénération et historique | **NON IMPLÉMENTÉ** (éléments épars : annuler/rétablir du plan, annulation des pages et du design, versions de champs, versions natives de pages) | aucun code |
| 21.10 e-commerce | **NON IMPLÉMENTÉ** et **BLOQUÉ PAR UNE DÉPENDANCE** (pas de catalogue produits, livraison, taxes) | registre 21.3, schéma de base |

## Défauts trouvés et corrigés dans ce palier
| Id | Gravité | Défaut | Correction | Preuve |
|---|---|---|---|---|
| F1 | P1 | Le studio IA et l'API des plans lisaient briefs, plans et états avec le seul droit `forms.read` : un rôle quasi sans droit (« Rien » = `forms.read` seul) voyait les projets IA. La matrice R7 des routes de moteur échouait. | `templates.read` exigé en plus sur toutes les lectures (studio, API plans) | `r7-coherence-moteurs` 6/6 |
| F2 | P2 | La publication groupée du studio n'exigeait la confirmation que dans la boîte de dialogue du navigateur : un appel direct publiait toutes les pages prêtes. | Confirmation exigée par le **service** (`confirm_required`, 422), ordre : droit → accès au projet → confirmation → blocages ; le client l'envoie | tests studio 28/28 + vitrine |
| F3 | P3 | La feuille de style du studio contenait une teinte rose (`#fdecee`) interdite par l'audit « anti-rose » de la charte. | teinte remplacée | `anti-rose` 3/3 |
| F4 | — | Tests périmés par l'ouverture du module « Formations » aux sites (LMS multi-sites) et libellé du catalogue de l'assistant 20.6. | tests et libellé mis à jour (palier précédent, commit `dd0d37d8`) | 50/50 |

## Défauts constatés NON corrigés
Voir `KOLAKISA_PROGRAMME21_REMAINING_ISSUES.md`.
