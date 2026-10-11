# Preuves, méthode et limites (palier 24)

**Aucun code du produit, aucune migration, aucune configuration, aucune dépendance n'a été modifié.** Les seuls fichiers créés sont des rapports (`docs/audit-global-palier-24/`) et des sondes de lecture (`audit-global/`). Toutes les sondes tournent sur un **serveur de test jetable** (base temporaire supprimée à l'arrêt). Les seules requêtes vers la production sont des lectures simples et trois requêtes **négatives** (sans signature, sans clé, sans connexion) qui sont rejetées avant tout traitement.

## Sondes écrites pour ce palier (`audit-global/`)
| Fichier | Ce qu'il fait | Sortie |
|---|---|---|
| `sonde-base.js` | Inventaire de la base d'un serveur de test : 155 tables, colonnes `site_id` / `organization_id`, clés étrangères, `integrity_check`, `foreign_key_check` | `resultats/sortie-base.txt`, `tables.json` |
| `sonde-ecrans.js` | Parcourt 107 écrans d'administration (GET) en créateur : codes 5xx, mentions « bientôt », commandes désactivées, liens `#`, données fictives | `resultats/sortie-ecrans.txt`, `ecrans.json` |
| `sonde-surface-publique.js` | 32 requêtes négatives sur la surface publique : webhooks, API, suivi, jetons, liens courts, traversée de dossiers, fichiers sensibles | `resultats/sortie-surface-publique.txt` |

## Sondes et rapports du palier 23 réutilisés (`audit-parite/`, `docs/audit-parite-wordpress/`)
Matrice de permissions (360 routes × 6 profils), scénarios SEO/URL/menus/paramètres/XSS, audit navigateur (24 écrans × 2 largeurs), contraste, export/import, sondes de décoration. Ils restent valables : le code a seulement reçu depuis les corrections listées dans `docs/audit-parite-wordpress/07-corrections.md`.

## Suites automatisées
- **Suite complète** (`node --test --test-concurrency=1 "tests/*.test.js"`, sans Chrome) : **4 020 tests, 4 014 réussis, 3 échecs (voir G-10), 3 ignorés** (2026-10-11, après les corrections du palier 23).
- **Tests Chrome** : les **96 fichiers** ont été relancés un par un (60 au palier 23, 36 au palier 24 ; résultats dans `audit-global/resultats/chrome-lot1.txt` et `chrome-lot2.txt`). Tous réussissent quand ils tournent seuls ; 2 ont échoué une fois sous charge au premier passage ; 1 test ignoré (`elementor-parite-2-navigateur` : 11 tests, 10 réussis, 1 ignoré).
- Un échec isolé de plus (`5 000 lignes importées`) passe seul (30/30) : lenteur de la machine.

## Production (lecture seule)
`GET /` (200, en-têtes de sécurité dont HSTS), `GET /robots.txt` (Sitemap déclaré), `GET /sitemap.xml` (200), `GET /blog/feed.xml` et `/recherche` (200, ajoutés au palier 23), `GET /api/v1/contacts` sans clé (401), `GET /commande` non connecté (302 vers la connexion), `POST /stripe/webhook` sans signature (**503**).

## Ce que cet audit ne peut PAS établir (NON VÉRIFIÉ — PREUVE INSUFFISANTE)
- Les **variables d'environnement de production** (worker, fournisseur d'envoi, clés Stripe/Twilio/IA, SMTP) : jamais lues ni modifiées. Seul le comportement observable de l'extérieur est cité.
- L'**envoi réel** d'e-mails et de SMS, les paiements réels, les webhooks signés des fournisseurs.
- Les **données de production** (volumes, contenus, comptes) : non consultées.
- Les **sauvegardes de l'hébergeur** et leur restauration.
- Les **performances en production** (les mesures viennent d'une machine de développement chargée avec une base de test).
- Les **86 types de widgets** un par un (banc d'essai documenté, non rejoué), le **clavier** écran par écran, la **fidélité visuelle** éditeur/public.
- La **revue SQL** ligne à ligne des 182 gabarits à fragment dynamique (recherche automatique seulement).

## Contradictions avec les rapports précédents
1. `docs/cms-utilisateurs.md` : « chaque case correspond à une vérification réelle côté serveur » — vrai pour la plupart, **faux en pratique pour `articles.edit_own`** (aucune rédaction possible hors créateur) → G-03.
2. Rapport du palier 23 (phase 1) : « une page publiée n'est pas indexée par défaut » — vrai au moment de l'audit ; **corrigé** ensuite pour les pages de site (palier 23, phase 2).
3. Mémoire du projet : « palier 9 en double (`cms-roles`) » — confirmé : la copie parallèle porte encore un commit absent de main.
4. `CLAUDE.md` à la racine : décrit un autre projet (Nakewenze / Supabase) et ne correspond plus au dépôt KOYEKOLA → G-19.
