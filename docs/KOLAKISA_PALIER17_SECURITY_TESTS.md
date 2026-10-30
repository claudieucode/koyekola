# Palier 17 — tests de sécurité (résultats exacts)

Machine locale, Node `node:test`, vrai serveur et base temporaire par fichier, 2026-10-29. Aucun test contre la production.

## Tests ajoutés
- `tests/palier17-securite.test.js` (vrai serveur) — **15/15 réussis**. Refus ET accès légitime : liste d'un site ↔ contact d'un autre site (4), connexion mobile d'un compte suspendu (1), composants global/autre site/déplacement (3), import CSV de redirections vers l'extérieur (2), journal d'activité, statut d'un compte hors organisation, duplication de site par un accès limité, clé d'API ↔ état du créateur (5).
  **Preuve de reproduction** : sur le code d'avant correction (fichiers source remis à l'état d'origine), **7 des 15 échouent** (8 réussissent : accès légitimes et refus déjà en place).
- `tests/palier17-ssrf-csv-unitaire.test.js` — **10/10** : 127.0.0.1, localhost, 169.254.169.254, 10.x, 192.168.x, `[::1]`, identifiants dans l'URL refusés, **0 requête reçue** par un serveur local d'écoute ; formules CSV (`= + - @`) neutralisées.
- Adaptation d'un test existant : `tests/seo-audit.test.js` démarre son serveur avec `KOLA_TEST_ALLOW_LOOPBACK=1` (mécanisme déjà utilisé par `importateurs.test.js`, actif en `NODE_ENV=test` seulement) car il vérifie un « lien externe cassé » sur un serveur local, désormais bloqué comme en production. Aucune assertion supprimée. `tests/fixtures/inventaire-tables-sites.json` : ajout de `mk_site_domains`, `mk_media_folders`, `seo_rank_entries` (isolées par site ; les deux dernières appartiennent à d'autres chantiers et faisaient déjà échouer le test sur `main`).

## Non-régression
1. Suite large (65 fichiers touchant isolation, contacts, listes, SEO, sites, comptes, API, composants, historique, formulaires, imports, SMS, tunnels), concurrence 2, **avant** rebase sur `e98b0cfa` : 2057 tests, **2016 réussis, 10 échecs, 31 annulés**. Tri des échecs :
   - `authentification` des clés d'API (4) : **causés par ma modification** (base de test sans table `users`) → corrigé (requête tolérante) ; `marketing-api-keys` 30/30 ensuite.
   - `seo-audit` « externe cassé » (1) : **causé par ma modification** (SSRF) → test adapté ci-dessus ; 10/10.
   - `admin-multisite` « aucune route… modifiée » : compare `git diff` d'un état non commité ; réussi après commit.
   - Délais de démarrage de serveur de 240 s (santé du site, sessions mobile S1, SEO core, onglets État/Informations…) : machine saturée par la concurrence ; **relancés en séquentiel : 89/90** (le 90e = le test `git diff` ci-dessus).
   - `audit-corrections` D3 (index de clé étrangère `mk_media.folder_id`, `mk_media_folders.site_id`) et `listes-deroulantes` (`dashboard.css`, `.bl-tools select { background }`) : **échecs préexistants sur `main`**, hors périmètre (le second reproduit sans mes changements ; le premier vient de la migration 112) — **non corrigés**.
   - Inventaire des tables : corrigé (voir ci-dessus).
2. Après rebase : `site-espace-unitaire`, `admin-multisite`, `palier17-*`, `marketing-api-keys`, `seo-audit`, `cms-seo` : 112 tests, 111 réussis, 1 échec (inventaire `seo_rank_entries`, corrigé ensuite : `site-espace-unitaire` 12/12).

## Non exécuté / non annulé / ignoré
Aucun test ignoré. 31 tests annulés dans la suite large (délais ci-dessus) : 21 des fichiers concernés relancés en séquentiel, le reste de la suite complète (≈ 5000 tests du dépôt) **n'a pas été exécuté** : seuls les fichiers liés aux zones modifiées l'ont été. Non testés : concurrence réelle, production, navigateurs.
