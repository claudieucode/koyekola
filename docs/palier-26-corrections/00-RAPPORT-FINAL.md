# Palier 26 — Corrections transversales, sécurité, performances (rapport final)

Date : 2026-10-11 · Branche `audit-parite-wp` (worktree `KOYEKOLA-audit23`), basée sur `origin/main` (8b261b9). **Rien n'est poussé ni déployé.**

## 1. Résumé exécutif
Les audits des paliers 23 à 25 laissaient peu de défauts réellement corrigeables sans décision humaine : les P1 « code » (G-03 articles multi-auteurs, A25-02, A25-03) étaient déjà corrigés et en ligne. Ce palier a donc :
- **ajouté la visibilité manquante** sur la configuration de production (G-01, G-02, G-08) dans l'écran **Santé** existant (aucun nouvel écran, aucun nouveau moteur) ;
- **corrigé une dépendance vulnérable** (G-17) en ne touchant qu'au verrou du projet ;
- **corrigé la documentation** devenue fausse (G-19) ;
- **vérifié et qualifié** les autres anomalies : plusieurs ne sont plus des défauts (G-10, G-14), d'autres exigent ta décision et sont **laissées bloquées** (aucune migration, aucun droit modifié).

KOLAKISA n'est **pas déclaré prêt pour la production** : l'état réel du worker, du fournisseur d'envoi et de Stripe en production reste à constater par toi (l'écran Santé le montre désormais).

## 2. Base de référence (avant intervention)
- Dépôt : `origin/main` 8b261b9 fusionné ; aucun travail non enregistré à protéger.
- Suite complète (`node --test --test-concurrency=1 "tests/*.test.js"`) : **4048 tests, 4044 réussis, 1 échec, 3 ignorés**. L'échec : « 5 000 lignes importées en quelques secondes » (test de durée, limite 8 s).
- 21 scénarios d'intégration du palier 25 : 177/177 critères. `npm audit --omit=dev` : 1 vulnérabilité haute.
- Charge de la machine pendant les mesures : 8 à 16 (autres sessions) — les durées sont à lire avec cette réserve.

## 3-4. Anomalies traitées et causes racines

| ID | Prio | Cause racine | Statut |
|---|---|---|---|
| G-01 (Stripe webhook absent en prod) | P1 | Variable absente côté hébergeur (déduite du 503) — **confirmée** ; état de la clé inconnu | **CORRIGÉE, VALIDATION INCOMPLÈTE** : contrôle Santé « Paiement en ligne (Stripe) » ; la configuration elle-même reste à faire par toi |
| G-02 (worker / fournisseur inconnus) | P1 | Pas de contrôle du fournisseur d'envoi ; état du worker déjà visible (contrôle existant) | **CORRIGÉE, VALIDATION INCOMPLÈTE** : contrôle « Fournisseur d'envoi » ; valeur de production non vérifiable par moi |
| G-08 (aucun point de santé) | P2 | Faux en partie : `/sante` et l'écran Outils → Santé (30 contrôles) existent déjà | **CORRIGÉE (complétée)** : 2 contrôles ajoutés |
| G-17 (source-map-js, haute) | P3 | Dépendance indirecte de postcss, version 1.2.1 | **CORRIGÉE ET VALIDÉE** : 1.2.2 dans `package-lock.json`, `npm audit --omit=dev` = 0 vulnérabilité |
| G-19 (documentation) | P3 | Mention « éditeur réservé au créateur » devenue fausse | **CORRIGÉE ET VALIDÉE** (relecture) |
| G-10 (suite non verte) | P2 | 2 des 3 échecs d'origine ne se reproduisent plus (O25-03) ; l'import 5 000 lignes dépend de la charge | **NON REPRODUITE** (2) / **REPORTÉE** (1, voir §11) |
| G-14 (variantes d'image) | P2 | Rapport périmé : `src/marketing/media/variants.js` existe (versions réduites des widgets, `/sante` → `versions_images: ok`) | **NON REPRODUITE comme défaut** (traité par une autre session) |
| G-03, A25-02, A25-03 | P1/P2/P3 | — | déjà **CORRIGÉES ET VALIDÉES** (palier 25, en ligne) |
| G-04 (branches non fusionnées) | P1 | `espacement` (10 commits), `inspecteur-editeur` (2), `cms-roles` (1) hors `origin/main` | **BLOQUÉE** : décision par branche, fichiers d'éditeur édités en parallèle |
| G-05 multi-site, G-06 tunnel/paiement, G-07 doublons, G-13 API de contenu, G-15 droits du Lecteur, G-16 événements CMS | P2 | Choix de périmètre ou décisions D1–D10 | **REPORTÉES** : aucune modification incompatible sans ton accord |
| G-09 sauvegarde externe, G-12 copie locale du Page Builder | P2 | Stockage externe + identifiants ; fichier d'éditeur modifié par d'autres sessions | **BLOQUÉES** |
| G-11 CSRF sans jeton / 2FA | P2 | Contrôle Origin/Referer seul | **REPORTÉE** (voir §10) |
| G-18, G-20 | P3 | Limites documentées / confort | **REPORTÉES** |

## 5. Modifications réalisées
- `src/services/tools/health.js` : deux contrôles dans le moteur de santé existant — « Fournisseur d'envoi des e-mails marketing » (lit le réglage réel de l'organisation ; « console » = À surveiller, avec l'impact « messages enregistrés comme envoyés sans l'être ») et « Paiement en ligne (Stripe) » (présence de `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`, **jamais leur valeur** ; clé sans secret de webhook = Critique). Lecture seule.
- `package-lock.json` : `source-map-js` 1.2.1 → 1.2.2 (3 lignes). `npm audit fix` a été essayé, **il retirait `sharp` du verrou** (dangereux pour les images) : je l'ai annulé et n'ai modifié que la ligne nécessaire. `node_modules` partagé non touché.
- `docs/cms-utilisateurs.md` : limites mises à jour.
- `tests/sante-configuration.test.js` (nouveau, 3 tests).

## 6. Corrections validées — preuves
- `node --test tests/sante-configuration.test.js` : 3/3 (par défaut console = À surveiller et Stripe « non configuré » = Information ; clé sans webhook = Critique ; clé + secret = Bon ; secret seul = À surveiller ; **les valeurs secrètes n'apparaissent jamais dans le rapport**).
- `npm audit --omit=dev` : 0 vulnérabilité.

## 7. Partielles ou bloquées
G-01/G-02 : le code montre l'état, mais **je ne peux pas lire la production**. Pour savoir : lance l'analyse de santé sur kolakisa.com (Marketing → Site web → Outils → Santé). G-04, G-05, G-06, G-09, G-12, G-15 : voir tableau.

## 8-9. Tests et non-régression
`cms-outils` + `sante-configuration` + `integration-globale` (21 scénarios) + `audit-corrections` (migrations) + `cms-articles-multi-auteurs` : **85/85**. Seul fichier de code modifié : `health.js` (lecture seule). Page Builder, formats de documents, routes, permissions : **non touchés**.

## 10. Sécurité
- Corrigé : G-17.
- Revérifié dans le code (sans modification nécessaire) : redirections externes (chemins relatifs seulement, `javascript:`/`data:` refusés), SVG refusé au téléversement, webhook Stripe signé (503 si non configuré, rejet sans signature), erreurs sans fuite de secret (test ci-dessus).
- **G-11 non modifiée volontairement** : une requête POST sans `Origin` ni `Referer` est acceptée. Les navigateurs modernes envoient `Origin` sur tout POST, donc le gain est faible ; refuser l'absence casserait des clients légitimes (outils, tests, intégrations) et toucherait la connexion de tout le monde. À décider avec la double authentification (politique de sécurité).
- Risques restants : pas de 2FA, pas de jeton CSRF, Lecteur voit contacts/revenus (G-15).

## 11. Performances
Une seule mesure utile : l'import de 5 000 contacts met ~8-9 s sous charge machine 8-16 (CPU ~7 s ; profil : recherche d'e-mail et insertion). **Identique sur l'ancien commit 20f3ba1** : ce n'est pas une régression. Je n'ai **pas optimisé** (gain non prouvé hors charge, cœur du Contact Core) et je n'ai pas relâché la limite du test. Aucune autre optimisation n'est revendiquée.

## 12. Migrations et données
Aucune migration ; aucune donnée modifiée ; aucune opération en production.

## 13. Régressions
Aucune détectée. Incident évité : `npm audit fix --package-lock-only` retirait `sharp` du verrou ; annulé avant tout commit.

## 14. Anomalies restantes (par priorité)
P1 : G-01/G-02 (à constater en production), G-04 (branches). P2 : G-05, G-06, G-07, G-09, G-11, G-12, G-13, G-15, G-16 et le test de durée de G-10. P3 : G-18, G-20.

## 15. Critères de sortie à satisfaire pour le palier 27
1. Écran Santé consulté en **production** : worker actif, fournisseur ≠ console, Stripe + webhook = Bon.
2. Paiement de test (clés de test) → commande + accès + événement, remboursement de test.
3. Un e-mail réel de test reçu (compte de test).
4. Décision sur les branches non fusionnées et, si oui, suite Chrome éditeur verte.
5. Sauvegarde hors serveur choisie, restauration à blanc.
6. Décisions D1–D10 (multi-site, droits du Lecteur, 2FA/CSRF, doublons).
7. Suite complète verte sur une machine peu chargée.

## 16. Décisions nécessaires de ta part
- Branches `espacement`, `inspecteur-editeur`, `cms-roles` : fusionner ou abandonner ?
- Multi-site du blog/médias/contacts (D1), droits du Lecteur (D3), 2FA/CSRF (D-sécurité), API de contenu (D5), événements du CMS (G-16) : oui/non ?
- Stockage externe pour les sauvegardes ?
- Authorisation de pousser/déployer ces corrections (rien n'est poussé).

---
## Addendum (même jour) — réussite à 100 % de la suite, poussée autorisée par l'utilisateur
- **G-10 corrigée ET VALIDÉE** (import 5 000 lignes) : cause réelle trouvée par profil CPU — le dépôt de données refaisait à chaque ligne la lecture du schéma (`sqlite_master` + `PRAGMA table_info`) et re-préparait ses requêtes. Correctifs : `src/marketing/db/repository.js` (colonnes en mémoire, invalidées par `PRAGMA schema_version` ; requêtes préparées gardées), `src/marketing/audience/contacts.js` (`findByEmail`). **Mesure : 8,1 s → 2,7 s de CPU** pour 5 000 contacts, à charge machine comparable. Validation et isolation par organisation inchangées ; test `tests/repository-cache-schema.test.js` (colonne ajoutée après coup reconnue, colonne inconnue refusée, table `sqlite_master` refusée).
- **Fiabilité des tests** : `tests/helpers.js` — `startServer` recommence sur un autre port si le port tiré au hasard est occupé (un test avait été annulé par `EADDRINUSE`, cause : autre programme de la machine).
- **Suite complète finale : 4052 tests, 4049 réussis, 0 échec, 0 annulé, 3 ignorés** (contre 4048 / 4044 / 1 échec au départ).
