# Palier 22.1 — Implémentation : audit de qualité et diagnostic de génération

**2026-10-30 · branche `feat/programme-22-1-audit-qualite` (depuis `origin/main` 90a58e28).** Palier de **diagnostic** : aucun moteur de génération n'a été modifié.

## 1. État réel du programme 21 (vérifié à la date du jour)
Source : rapport 21.11 (déployé) + nouvelle exécution de 14 suites ciblées (275 tests, 275 réussis, 0 échec, dont les nouveaux tests du 22.1).

| Composant | État | Réserve |
|---|---|---|
| AI Core / infrastructure des fournisseurs (21.2) | OPÉRATIONNEL (testé avec fournisseurs simulés) | **Aucun fournisseur réel vérifié** |
| Brief Analyzer (21.3) | OPÉRATIONNEL | Valeurs sans preuve conservées en « déduites » (Q9) |
| Site Planner (21.3) | PARTIEL | Boutique encore déclarée indisponible (I1) |
| Page Generator + Component Mapper (21.4) | OPÉRATIONNEL | Recettes fixes, textes d'exemple, pas de SEO (Q1–Q3) |
| Design Generator (21.5) | OPÉRATIONNEL | 3 directions d'une même teinte (Q7) |
| Content Generator (21.6) | OPÉRATIONNEL | Non chaîné à la génération de pages |
| Media Generator + Asset Manager (21.7) | PARTIEL | Démonstration seulement ; OpenAI non vérifié ; 3 autres fournisseurs non intégrés |
| Interface AI Website Builder / studio (21.8) | OPÉRATIONNEL | Non rejouée sans fournisseur |
| Régénération intelligente (21.9) | OPÉRATIONNEL | Non reliée au studio (I2) |
| Historique | OPÉRATIONNEL | Plusieurs piles d'annulation |
| E-commerce Builder (21.10) + boutique native (20.5) | PARTIEL | Pas de page produit générée, paiement jamais vérifié en réel |
| Aperçu / publication | OPÉRATIONNEL | Espaces réservés non bloqués à la publication (Q2) |
Aucun élément du programme 21 ne **bloque** l'audit du socle déterministe ; l'absence de fournisseur réel **empêche** d'évaluer la qualité rédactionnelle et visuelle des sites rédigés par IA.

## 2. Ce qui a été ajouté
| Fichier | Rôle |
|---|---|
| `tests/quality-lab/scenarios.js` | 15 scénarios de référence (briefs fictifs, pages essentielles attendues) + 6 briefs de test du Brief Analyzer |
| `tests/quality-lab/audit.js` | analyseur statique du HTML (titres, images, liens, champs, repères, SEO, espaces réservés), détection d'affirmations inventées, grille de notation et statuts, plafonnement par défaillance critique |
| `tests/quality-lab/lab.js` | exécution de bout en bout sur un **vrai serveur**, audits hors ligne (garde-fous du Brief Analyzer et du Content Generator, Component Mapper, Media Generator), calcul de la diversité, sonde « pages homonymes » |
| `tests/programme22-1-quality-lab.test.js` | 12 tests (+1 opt-in `QUALITY_LAB=1`) : scénarios, analyseur, notation honnête, garde-fous, cohérence du résultat de référence |
| `docs/quality-lab/results.json` | **résultat de référence** (15 scénarios) à comparer aux prochains paliers |
| `package.json` | script `npm run quality:lab` |
| 13 documents `docs/KOLAKISA_*22*` / `KOLAKISA_AI_*` | audits, notation, feuille de route, limites |

Aucune modification de `src/`, `views/`, `public/`, ni des migrations.

## 3. Reproductibilité
- `npm run quality:lab` (≈ 3 min ; démarrage du serveur ≈ 70 s sur une machine chargée) régénère `docs/quality-lab/results.json`.
- `node --test tests/programme22-1-quality-lab.test.js` (≈ 10 s) vérifie la logique du laboratoire et la cohérence du résultat de référence ; `QUALITY_LAB=1` relance en plus les 15 scénarios.
- Les briefs et les formules ne changent pas d'un palier à l'autre : toute amélioration se lit comme une variation de ces nombres.
- Aucun appel réseau, aucun crédit d'IA, aucune donnée réelle ; les scénarios créent des sites « (labo 22.1) » dans une base de test éphémère.

## 4. Choix de conception
- **Honnêteté des notes** : points « mesurables » séparés des points « non mesurés » ; borne basse (non mesuré = 0) publiée à côté du pourcentage du mesurable ; test dédié qui interdit de compter un critère non mesuré comme réussi.
- **Plafond critique** : une défaillance (publication refusée hors formulaire, lien cassé, affirmation inventée, parcours d'achat non démontré) ramène le statut à « À AMÉLIORER ».
- **Pas de correction de moteur** : les défauts sont diagnostiqués avec leur cause racine ; les corriger ici aurait faussé la référence.

## 5. Tests exécutés
Voir `KOLAKISA_PROGRAMME22_1_QUALITY_AUDIT.md` et le rapport final : 14 suites ciblées (275/275), 7 suites de garde (134/135, échec connu D3 hérité de 20.5), lab complet exécuté 8 fois pendant la mise au point (dernière exécution : 15/15 scénarios, 72 pages). Lint et typecheck : **inexistants dans ce projet**. Build : non requis (aucun code applicatif modifié). Migrations : aucune.
