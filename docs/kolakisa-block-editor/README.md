# Éditeur de blocs Kolakisa — parité fonctionnelle avec Gutenberg

Mission commencée le 2026-10-27. Périmètre : éditeur d'articles Tiptap (voir `DECISIONS_TECHNIQUES.md` DT-1).

| Document | Contenu | État |
|---|---|---|
| `GUTENBERG_REFERENCE.md` | Versions (WP 7.1.3, Gutenberg 24.2.0), périmètre, sources | rédigé (agent, non relu intégralement) |
| `INVENTAIRE_BLOCS.md` | 120 `block.json` du cœur | rédigé (variations/transformations extraites par regex : à vérifier) |
| `INVENTAIRE_INTERFACE.md` | Interface, commandes, raccourcis | rédigé |
| `REGLAGES_ET_TRANSFORMATIONS.md` | Supports, conversions | rédigé ; table des conversions « de mémoire » |
| `API_ET_EXTENSIBILITE.md` | Registre, API, extensibilité | rédigé |
| `PERSISTANCE_ET_COMPATIBILITE.md` | Sérialisation, blocs inconnus, révisions, choix du format | rédigé |
| `AUDIT_EXISTANT.md` | État réel de Kolakisa avant intervention | **fait** |
| `MATRICE_PARITE.md` | Parité capacité par capacité, avec statut final et preuve | **v3 (parité complète)** |
| `PLAN_IMPLEMENTATION.md` | Lots P0 → P5, blocages | **fait** |
| `DECISIONS_TECHNIQUES.md` | Choix et limites | **fait** |
| `JOURNAL_IMPLEMENTATION.md` | Ce qui a été fait, avec résultats de tests | tenu à jour |
| `ARCHITECTURE_CIBLE.md` | Registre central, supports, blocs inconnus, sites | **fait** |
| `PLAN_TESTS.md` | Tests de la mission et limites | **fait** |

Les documents de référence Gutenberg ont été produits par recherche documentaire automatisée ; chacun se termine par ses « points non vérifiés ». Ils ne remplacent pas une vérification dans les `block.json` avant d'implémenter un bloc.
