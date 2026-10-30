# Programme 20.1 — Rapport final

## Statut : **VALIDÉ AVEC RÉSERVES**
L'audit est exploitable et l'architecture est cohérente avec le code réel ; aucune lacune ne bloque la conception de 20.2. Les réserves (ci-dessous) sont explicites. Rien n'a été développé, aucune migration créée, aucun déploiement, aucun changement de design.

## Ce qui a été fait (preuves)
| Livrable | Fichier | Nature |
|---|---|---|
| Audit | `KOLAKISA_PROGRAMME20_1_AUDIT.md` | état du dépôt, tests exécutés, problèmes, + 3 revues détaillées (noyau, widgets/thèmes, commerce/modules/permissions/données) avec chemins `fichier:ligne` |
| Étude des références | `KOLAKISA_PROGRAMME20_1_REFERENCE_STUDY.md` | Elementor, WordPress, WooCommerce ; chaque point [CONFIRMÉ] (URL officielle) / [PARTIEL] / [HYPOTHÈSE] ; 13 choix de conception pour Kolakisa séparés des faits |
| Architecture | `KOLAKISA_PROGRAMME20_1_ARCHITECTURE.md` | actuelle, cible (Site Builder / Theme Builder / Template Studio), entités, contrats, isolation, permissions |
| Écarts | `KOLAKISA_PROGRAMME20_1_GAP_ANALYSIS.md` | 24 écarts G1–G24 classés P0/P1/P2 avec phase et critères |
| Feuille de route | `KOLAKISA_PROGRAMME20_ROADMAP.md` | 20.1 à 20.7 : objectifs, périmètre, dépendances, tests, critères, risques, prérequis + décisions D1–D4 |
| Rapport final | ce fichier | |

Tests exécutés : 60 fichiers CMS non navigateur → **856 tests, 851 réussis, 5 échoués, 0 annulé, 0 ignoré**. Les 5 échecs sont des tests de comptage du menu rendus obsolètes par le lot SEO d'une autre session (4 entrées ajoutées) ; non corrigés, hors périmètre. **Non exécutés** : tests navigateur (≈ 176), ≈ 600 autres fichiers, tout test en production.

## Architecture réelle découverte (résumé)
Un moteur central unique, des sites = lignes `mk_sites` (principal = `site_id NULL`) avec contexte d'administration indépendant recalculé à chaque requête ; **un seul** éditeur (8 644 lignes, 94 types d'éléments, canevas iframe rendu serveur, autosave, historique, responsive) ; **un seul** rendu partagé par page publique, aperçu et canevas ; publication avec `preflight` et révisions ; 160 thèmes (jetons) ; identité graphique par site déjà présente ; modèles de thème **à conditions** déjà implémentés (9 familles, score déterministe) mais au niveau **organisation** ; en-tête/pied par site via composants ; 5 packs de site, ≈ 20 gabarits, import/export de page et de site (`kolakisa-site-bundle@1`) ; modules par site ; domaines vérifiés par TXT ; commerce = **formations** via Stripe réel.

## Réutilisable tel quel
Éditeur, rendu, publication, révisions, `siteContext`, `siteDomains`, `siteModules`, `siteBundle`, `importPage`, `sitePacks`, `themeTemplates` (moteur de conditions), composants globaux (brouillon/aperçu/mise à jour), thèmes et personnalisateur.

## Partiel ou absent
Partiel : création de site (vierge seulement), modèles de thème (par organisation), format de kit (sans thème/modèles/composants), duplication de site, module `lms`, HTTPS des domaines clients. Absent : permissions dédiées, historique des composants, catalogue unifié de templates, exclusions/ET-OU dans les conditions, modèles produit/catalogue, produit générique, TVA, commerce par site.

## Écarts majeurs et risques
1. **G1/P1 (bloquant)** : slugs et noms uniques globalement — aucun kit complet ne s'installe sur deux sites ; migration à risque, état de production inconnu.
2. **Commerce** (G14/G15) : décision du propriétaire requise avant 20.5.
3. Deux systèmes d'en-tête/pied et deux stockages de styles (convergence à décider).
4. Collisions de numéros de migration entre sessions parallèles (41 worktrees).
5. Documents obsolètes (comptes, lignes).

## Décisions architecturales recommandées
D1 autoriser slugs/noms identiques sur des sites différents ; D2 composants globaux comme source unique d'en-tête/pied ; D3 boutique unique du site principal pour 20.5 (produits génériques hors Programme 20) ; D4 cinq permissions dédiées ; catalogue de templates **calculé** (lecture unifiée) avant toute migration ; format `kolakisa-template@1` enveloppant le format natif de l'éditeur.

## Réserves (pourquoi « avec réserves »)
- Aucun test navigateur ni exécution de l'éditeur : constats sur l'éditeur issus de la lecture du code.
- Étude de référence : priorité des conditions Elementor **non vérifiée** (hypothèse), format JSON d'export Elementor non confirmé, plusieurs pages officielles inaccessibles ; fonctions payantes non affirmées.
- État de la base de production, de l'hébergeur et de la reconstruction R6 inconnu.
- P2 (fuite de noms de pages publiées) lu dans le code, **non reproduit par test**.
- Une affirmation erronée d'une revue (« `siteBundle` n'existe pas ») a été détectée et corrigée ; d'autres erreurs de lecture restent possibles dans les parties non relues par le relecteur.

## Git
Commit dédié sur la branche `docs/programme20-1-audit` (documents uniquement, `docs/KOLAKISA_PROGRAMME20_*`). **Non poussé, non fusionné, non déployé** : un push sur `main` déclenche le déploiement automatique, exclu pendant cette phase.

## Conditions pour démarrer le Programme 20.2
1. Revue et validation de ces documents par le propriétaire.
2. Réponses à D1–D4.
3. Sauvegarde de la base de production et vérification de l'état de la reconstruction R6 (ou renoncement à G1 en production) avant toute migration d'unicité.
4. Partir d'un `origin/main` à jour et revérifier le dernier numéro de migration.
5. Décider du sort des 5 tests de menu obsolètes (les mettre à jour est une tâche à part, par leur propriétaire).
