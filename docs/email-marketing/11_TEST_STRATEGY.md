# 11 — Stratégie de test

## Environnement

Tests `node:test` avec un vrai serveur démarré sur un dossier de données temporaire (`tests/helpers.js`) ou une base en mémoire avec les vraies migrations (`freshMarketing`, deux organisations A et B pour les contrôles d'isolation). Aucun test n'écrit dans une base réelle ni n'envoie un e-mail réel : les fournisseurs sont simulés (`scripted`, `fetchImpl`, `lookup` injectés).

```
NODE_PATH=…/KOYEKOLA-deploy/node_modules TEST_START_TIMEOUT_MS=600000 \
  node --test tests/<fichier>.test.js
```

Sur une machine chargée, lancer par petits groupes ; le démarrage d'un serveur de test peut prendre plus de 60 s.

## Couverture par type

| Type | Exemples | Remarque |
|---|---|---|
| Unitaire (règles pures) | `marketing-reputation` (assess), `marketing-ab-preuve`, `marketing-linkcheck` | sans base ni réseau |
| Intégration (base réelle en mémoire) | `contacts-fusion-refus`, `marketing-automations`, `marketing-campaigns`, `marketing-conformite` | transactions, contraintes, isolation A/B |
| Web (serveur réel) | `marketing-mobile-auth`, `marketing-linkcheck-route` | permissions, limitation de débit, codes HTTP |
| Navigateur (Playwright) | `*-navigateur.test.js` | **non lancés pour cette mission** ; ignorés sans Chrome |
| Sécurité | SSRF webhooks (`marketing-webhooks-durcissement`), réinscription par un tiers, usurpation d'expéditeur, XSS d'e-mail (audit) | pas de test d'intrusion externe |
| Charge | non réalisée | aucune capacité de volume n'est affirmée |

## Tests ajoutés ou adaptés par cette mission

| Fichier | Nature |
|---|---|
| `marketing-webhooks-durcissement.test.js` | nouveau |
| `marketing-mobile-auth.test.js` | nouveau |
| `contacts-fusion-refus.test.js` | nouveau (fusion, réinscription, export CSV, audience) |
| `marketing-ab-preuve.test.js` | nouveau |
| `marketing-reputation.test.js` | nouveau |
| `marketing-linkcheck.test.js`, `marketing-linkcheck-route.test.js` | nouveaux |
| `marketing-automations.test.js` | +5 tests (message réservé, levée de réservation, transactionnel) ; 4 tests existants adaptés : ils créaient des scénarios « transactionnels » avec des déclencheurs qui ne sont pas des événements de service, ils sont passés en type « marketing » |
| `marketing-providers.test.js` | 1 test adapté et complété (classification SMTP) |
| `cms-email-engine.test.js` | 1 test adapté : il encodait l'ancien défaut (domaine « pending » accepté) |

Aucun test n'a été supprimé. Chaque adaptation suit un changement de comportement voulu et documenté.

## Résultats

Voir la section « Résultats » ajoutée à la fin de ce fichier après la dernière exécution.

## Résultats (dernière exécution, arbre fusionné avec `main`)

Suite complète hors tests navigateur : **439 fichiers, 6 339 tests, 6 311 réussis, 28 échecs** à la première exécution complète après correction de la numérotation de migration. Analyse des 28 échecs :

| Origine | Nombre | Détail |
|---|---|---|
| Déjà en échec sur `origin/main` propre (même machine, même jour) | 22 | `blog-medias-protection`, `editeur-conformite-widgets`, `grille-interface` (6), `listes-deroulantes`, `marketing-templates-blocks` (seuil de 3 s dépassé sur une machine lente), `messages-boite`, `portee-des-routes`, `r9-lancer-recette-prod` (4, branche git `r8-recette-outil` absente), `refonte-design` (2), `registre-pages`, `revisions-articles` (2), `site-espace` |
| Causés par cette mission, tests adaptés puis repassés | 5 | `marketing-interface-5` (2 tests, 22/22 après correction), `marketing-pont-lms` (1), `site-web-automatisations` (1), `site-menu-p1a` (1, plafond de migration relevé à 111) |
| Chrome sous charge, repassé séparément | 1 | `moteur-mouvement-chrome` |

Une première exécution complète avait échoué en masse (1 845 échecs) : la fusion avec `main` avait apporté une seconde migration numérotée 110, et le module marketing refuse de démarrer avec deux migrations de même numéro. La migration de cette mission a été renumérotée 111 ; c'est la suite complète qui l'a révélé.

Les 22 échecs préexistants ne sont pas corrigés ici : ils n'appartiennent pas à cette mission.

Tests navigateur (Playwright) : non lancés.
