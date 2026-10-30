# KOLAKISA — Programme 22.1B : réalisation

> **Pourquoi « 1B » ?** Un audit 22.1 (autre session, commit `89e5ff88`) était déjà sur `main` avec les mêmes noms de fichiers. Rien n'a été écrasé : ce palier est livré à part, sous le suffixe 1B, et se lit comme son **complément** (voir `KOLAKISA_PROGRAMME22_1B_QUALITY_AUDIT.md` §1 bis).

Palier de **diagnostic** : aucun moteur de génération n'a été modifié. Il ajoute un laboratoire de mesure, une suite de tests reproductibles et la documentation de l'audit.

## Livrables

| Livrable | Fichier |
|---|---|
| 15 scénarios de référence (briefs figés, plans de référence, IA simulée) | `scripts/quality-lab-navigateur/scenarios.js` |
| Génération des sites vitrines avec les vrais moteurs | `scripts/quality-lab-navigateur/generate.js` |
| Génération des boutiques (constructeur 21.10 + moteur 20.5) et parcours d'achat simulé | `scripts/quality-lab-navigateur/shop.js` |
| Audit dans Chrome (4 formats) : débordements, cibles, texte, images, SEO, accessibilité, contraste, performance, liens | `scripts/quality-lab-navigateur/browser.js` |
| Grille de notation de 100 points | `scripts/quality-lab-navigateur/score.js` |
| Orchestration : un lot « vitrines » + un serveur par boutique, fusion, notation | `run.js`, `run-all.js`, `merge.js` |
| Tableaux Markdown calculés et insertion dans les rapports | `summarize.js`, `fill-docs.js` |
| 15 tests déterministes (garde-fous du brief, mapper, design, conflit inter-sites, formulaires, adresses réservées) | `tests/programme22-1b-lab-navigateur.test.js` |
| Résultats bruts conservés pour comparaison | `docs/quality-lab-navigateur/` (`parts/*.json`, `generation.json`, `audit.json`, `scores.json`, `captures/*.jpg`) |
| Documentation (13 fichiers) | `docs/KOLAKISA_PROGRAMME22_1_*.md`, `docs/KOLAKISA_AI_*_AUDIT.md`, `KOLAKISA_PROGRAMME22_1B_QUALITY_SCORE.md`, `KOLAKISA_PROGRAMME22_1B_ROADMAP.md` |

Aucune migration. Aucun fichier de `src/` modifié.

## Comment lancer le laboratoire

```
NODE_PATH=/Users/imac/ClaudeProjects/KOYEKOLA-blocs-gutenberg/node_modules \
  node scripts/quality-lab-navigateur/run-all.js          # ≈ 10 à 25 minutes selon la charge de la machine
node scripts/quality-lab-navigateur/fill-docs.js           # recalcule les tableaux des rapports
node --test tests/programme22-1b-lab-navigateur.test.js   # 15 tests
```

Prérequis : Chrome (`/Applications/Google Chrome.app` ou `CHROME_PATH`), `playwright-core`. Aucun réseau externe, aucune clé, aucun coût.

## Décisions de conception

1. **IA simulée, mesures réelles.** Le fournisseur d'IA est remplacé par des plans de référence écrits à la main ; tout le reste (garde-fous, générateurs, rendu, publication, navigateur) est le vrai code. Ce choix interdit toute conclusion sur l'intelligence d'un modèle et le dit partout.
2. **Briefs figés par empreinte** (SHA-256 dans le test) : toute comparaison future part des mêmes textes.
3. **Un serveur par boutique** : le défaut D-G1 (doublons à l'échelle de l'organisation) empêchait de créer trois boutiques dans une même organisation ; chaque boutique est donc mesurée isolément, et le défaut est documenté et testé à part.
4. **Moteurs en processus, rendu en serveur séparé.** `DATA_DIR` et `UPLOADS_DIR` du processus de mesure désignent ceux du serveur de test **avant** le chargement des moteurs ; rien n'est écrit dans le dépôt ni dans une base réelle.
5. **Notation par couverture.** Les critères non mesurables sortent du dénominateur (couverture maximale 80/100) ; une défaillance critique plafonne le statut.
6. **Pas de correction dans ce palier**, même évidente : la mission demande un diagnostic ; les corrections sont priorisées dans la feuille de route.

## Résultats des tests (exécutés le 2026-10-30 sur le code de `origin/main` `3abf0fd1`)

| Passe | Fichiers | Tests | Réussis | Échecs |
|---|---|---|---|---|
| Laboratoire 22.1 (déterministe) | 1 | 15 | 15 | 0 |
| État réel du programme 21 et du moteur de boutique : `ai-core`, `ai-core-adapters`, `ai-media`, `programme20-5-boutique-moteur` et `-builder`, `programme21-3`, `-6`, `-9`, `-10`, `-integration-vitrine`, `-international-migrations`, `-performance`, `-securite-multisite`, `-securite-regen-boutique` (+ le test 22.1 de l'époque, 14 tests) | 15 | 283 | 283 | 0 |
| Garde-fous transverses : `anti-rose`, `isolation-des-sites` | 2 | 31 | 31 | 0 |
| **Laboratoire complet** (12 sites vitrines + 3 boutiques, 4 formats, parcours d'achat) | — | 15 scénarios | 15 générés, 15 audités | 0 échec d'exécution |

Précisions :

- Les suites **navigateur** existantes des programmes 21 et 20.5 n'ont pas été rejouées (Chrome est utilisé uniquement par le laboratoire).
- **Lint, typecheck** : n'existent pas dans le projet (déjà constaté en 21.10 et 21.11). `node --check` passe sur tous les scripts du laboratoire et le test.
- **Build** : aucune modification applicative (`src/`, `views/`, `public/`) : `build:editor` et `build:automation-flow` n'ont pas été relancés.
- **Migrations** : aucune ajoutée ni modifiée.
- La machine était très chargée (autres sessions de tests en parallèle) : les durées sont indicatives.

## Résultat du laboratoire (référence du 22.1)

Notes sur points évalués (couverture 80/100) : de **58 à 75 sur 100**, **tous les sites « À AMÉLIORER »** ; 5 sites sont **plafonnés** par une défaillance critique malgré une note ≥ 70. Aucun site « SATISFAISANT » ou au-dessus. Voir `KOLAKISA_PROGRAMME22_1B_QUALITY_SCORE.md`.

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
