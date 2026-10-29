# KOLAKISA — Palier 19 : rapport final

*Date : 2026-10-29. Branche `docs/palier-19-production`, issue de `origin/main` (`b27d7c25`). Rapport fondé sur des commandes réellement exécutées ; ce qui ne l'a pas été est écrit comme tel.*

## 1. Statut final : **BLOQUÉ** (pour la préparation à la production)

- Les **livrables documentaires sont complets** (sept documents, `.env.example` complété, lien dans le README).
- **Aucune conclusion « prête pour la production » n'est possible** : une anomalie P1 est **toujours ouverte et mesurée en ligne** (webhook de paiement : 503), et plusieurs critères exigent des secrets ou un accès à la production que ce palier n'avait pas (`BLOCKED`).
- **Kolakisa n'est pas déclaré prêt pour la production.** Ce palier ne signifie ni un déploiement, ni un audit de sécurité indépendant, ni que tous les modules sont commercialisables.

## 2. Point de départ : l'hypothèse du « Palier 18 » ne tient pas

La consigne supposait un rapport de « Palier 18 » (audit global). **Il n'existe pas dans ce dépôt** : le palier 18 est le chantier **CMS ↔ Tunnel** (commit `1d096aa`). L'audit global est le **palier 24**, suivi des paliers 25 (21 scénarios d'intégration) et 26 (corrections transversales), plus les **critères de sortie du palier 27** (`docs/audit-global-palier-24/08-criteres-sortie-palier-27.md`), qui couvrent exactement l'objet de ce palier. Je les ai donc pris comme base, avec les audits de sécurité du palier 17. Les dates de ces rapports (11 octobre) sont antérieures de 18 jours.

## 3. Travaux réalisés

1. **État du dépôt** : branche, commit, modifications locales (arbre propre), documents des paliers précédents lus.
2. **Quatre explorations en lecture seule** (variables d'environnement, migrations/sauvegarde/santé/journaux, sécurité, déploiement) puis **vérification dans le code** des points décisifs. Une hypothèse de l'exploration s'est révélée **fausse** à l'essai (voir §6).
3. **Sept documents** + `.env.example` (variables manquantes, commentaire SMTP corrigé) + README.
4. **Essais réels** (§4).
5. **Correction de dépendances** : `package-lock.json` seul (§5).
6. Aucun code applicatif modifié.

## 4. Commandes exécutées et résultats

| Commande / essai | Résultat |
|---|---|
| `git fetch`, `git switch -c docs/palier-19-production origin/main` | OK |
| `curl https://kolakisa.com/sante` | **200** `{"statut":"ok","formations":1,"versions_images":"ok"}` |
| `curl -X POST https://kolakisa.com/stripe/webhook` (sans signature, corps `{}`) | **503** (attendu : 400) |
| `curl http://kolakisa.com/` | 301 → `https://kolakisa.com/` ; HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP minimale présents |
| `npm ci` (depuis le verrou, copie jetable) | code 0 (y compris `--omit=dev --ignore-scripts`) |
| `npm audit --omit=dev` (avant) | **6 vulnérabilités (2 hautes : `multer`, `body-parser` ; 3 moyennes ; 1 basse)** |
| `npm update multer body-parser nodemailer qs sanitize-html deepmerge` (copie jetable) | `package.json` inchangé ; `sharp` conservé dans le verrou ; `npm audit` : **0 vulnérabilité** |
| 14 fichiers de test ciblés (téléversements, e-mail, assainissement, paiement, sécurité P17, santé, import, e-mail marketing) **avec les nouvelles versions** | **172 / 172 réussis**, 0 échec, 0 ignoré (422 s) |
| `scripts/sauvegarde.js` sur données jetables | base vérifiée (`integrity_check`), archive des fichiers vérifiée |
| `scripts/restaurer.js` sans `--confirmer`, puis avec | à blanc : « AUCUNE MODIFICATION FAITE » ; réel : base et fichiers restaurés ; `integrity_check` ok, données et fichier retrouvés |
| Restauration d'une sauvegarde inexistante | refus clair |
| Démarrage d'un vrai serveur sur la base restaurée | copie `AVANT-MIGRATION-*` créée, **99 migrations appliquées (dernière : 114)**, 188 tables, `/sante` ok, **192 s de démarrage** |
| Commande « migrations en attente » (rédigée pour ce palier) | « aucune en attente » sur base à jour ; « 99 en attente » sur base jamais migrée |
| Essai de panne : table `courses` renommée après démarrage, ancien et nouveau code | **HTTP 500** dans les deux cas, rétablissement automatique après réparation |
| `audit-qualite.js` | 120 routes × 2 thèmes : **3 contrastes insuffisants, 0 commande sans nom, 4 focus invisibles**, 60 dialogues |
| `audit-interface.js` | 120 routes, 480 mesures, 0 échec de chargement ; **27 boutons étirés, 112 chevauchements, 359 textes coupés** |
| `audit-editeurs.js` (nouveau code **et** ancien code) | résultats **identiques** pour l'éditeur de pages (24 à 36 problèmes, « bouge au clic ») : **non-régression** ; problèmes dans la palette de gauche |
| Vérification des chemins cités dans les documents | aucun chemin complet erroné ; noms abrégés conservés ; aucun secret détecté (motifs `sk_`, `whsec_`, 64 hexadécimaux) |

Non exécutés : la suite complète `npm test` (654 fichiers, plusieurs minutes chacun pour le démarrage du serveur), les scénarios d'intégration du palier 25, tout accès SSH ou hPanel.

## 5. Correction réalisée

**Dépendances vulnérables** (`package-lock.json` uniquement, 54 lignes) : `multer` 2.4.0 → 2.5.0, `body-parser` 1.20.8 → 1.20.9, `nodemailer` 10.0.10 → 10.3.1, `qs` 6.16.0 → 6.16.2, `sanitize-html` 2.17.7 → 2.18.1 (qui retire `deepmerge`) et une mise à jour transitive 1.7.1 → 1.7.2. Méthode **ciblée** (pas de `npm audit fix` : il retirait `sharp` au palier 26). Validée par `npm audit` (0) et 172 tests. **Reste à valider** : suite complète, et comportement en production (redéploiement). ⚠️ Pousser ce verrou sur `main` **déploie** ces versions en ligne.

## 6. Constats et corrections de mes propres hypothèses

- **Hypothèse fausse, abandonnée** : l'exploration prétendait que `/sante` laisserait la requête « en attente » si la base tombait. **Mesuré : HTTP 500.** Le correctif `try/catch` que j'avais écrit n'a aucun effet (l'erreur vient d'un intergiciel antérieur) : **annulé, aucun code modifié**.
- **Défaut réel découvert, non corrigé** : en cas d'erreur précoce, `views/error.ejs` échoue (`icon is not defined`) ; Express renvoie alors sa page par défaut, qui **montre la pile et les chemins si `NODE_ENV` ≠ `production`**. L'application se croit en production dès que `SITE_URL` est en https, pas Express. **`NODE_ENV=production` est obligatoire en ligne** ; sa valeur de production est inconnue.
- **Numérotation** : voir §2.
- **Démarrage à froid de 192 s** : mesuré, cause non isolée, probablement aggravé par la charge de la machine (autres sessions).
- **`.env.example`** affirmait que sans SMTP « le contenu s'affiche dans les logs » : vrai **hors production seulement** (en production, seul un avertissement). Corrigé.
- **Variables « fantômes »** `TRUST_PROXY` et `COOKIE_SECURE` : affichées par le diagnostic, jamais lues par le code.

## 7. État des migrations

99 fichiers (`src/marketing/migrations/`, 001 à 114 avec trous), appliqués **au démarrage** avec copie préalable `AVANT-MIGRATION-*`, somme de contrôle, une transaction par migration. **Aucune commande CLI** (commande de lecture fournie, vérifiée). Schéma du LMS : `IF NOT EXISTS` à chaque démarrage, sans suivi. Retours arrière SQL : **3 fichiers manuels** (090, 091, 092), aucun automatique. Un échec de migration laisse l'application démarrer avec le **module marketing inactif, sans alerte**. **Aucune migration modifiée ni ajoutée** par ce palier.

## 8. Sauvegardes et restauration

Opérationnel : sauvegarde automatique quotidienne de la **base seule**, **sur le même disque** ; sauvegarde complète en ligne de commande (base + fichiers, vérifiées) ; restauration en ligne de commande, serveur arrêté, avec garde-fous. **Vérifié sur des données jetables.** Non prouvé : base de production réelle, cohérence base/médias réelle, séparation des sites après restauration. **Aucune copie hors site.** Aucune restauration n'a été faite sur la production.

## 9. Contrôles de sécurité

En place (revue de code + observation) : cookies `httpOnly`/`SameSite=Lax`/`secure:auto`, session régénérée à la connexion, refus de démarrer sans secret de session solide, secrets en base chiffrés (AES-256-GCM), `bcrypt` coût 10, en-têtes de base, limiteurs de débit (14 points), isolation par domaine/hôte (421), erreurs sans pile en fonctionnement normal, aucun secret dans les journaux examinés. **Lacunes** : pas de CSRF par jeton, CSP sans `script-src`, pas de 2FA, inscription sans limite, compteurs de connexion en mémoire, téléversements sans contrôle de signature (miniatures/blog/vidéos), 13 limites du palier 17 ouvertes. **Aucun audit de sécurité indépendant n'a eu lieu.**

## 10. Risques résiduels

Voir le registre R1 à R13 dans `KOLAKISA_PRODUCTION_READINESS_CHECKLIST.md`. Les plus lourds : **paiement non enregistrable (R1, mesuré)**, **perte du disque (R2)**, **push direct sur `main` = production sans barrière (R3)**, **échec de migration silencieux (R4)**, **worker et e-mail non vérifiables (R5)**, **`NODE_ENV` inconnu (R6)**.

## 11. Éléments non vérifiés

Variables d'environnement de production ; envoi d'e-mail réel ; worker de production ; paiement et webhook signé ; certificat HTTPS d'un domaine client ; restauration d'une vraie base de production ; suite complète des 654 fichiers ; scénarios du palier 25 ; performance (hors démarrage) ; comparaison de `audit-qualite` et `audit-interface` à une base de référence ; procédures SSH de `scripts/r9/` ; comportement sous une autre panne de base (verrou, disque plein) ; jetons dans les URL journalisées.

## 12. Git

- Un commit dédié sur la branche locale `docs/palier-19-production` (documents, `.env.example`, README, `package-lock.json`).
- **Aucun push, aucune fusion, aucun déploiement** : la livraison sur `main` redéploie la production, et la mise à jour du verrou change les versions de paquets en ligne. Ce n'est pas dans l'autorisation donnée pour la mission précédente.

## 13. Recommandation de mise en production

**Ne pas déclarer Kolakisa prêt.** Ordre recommandé :
1. **Propriétaire** : définir `NODE_ENV=production`, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (clés de **test** d'abord) et déclarer le webhook ; consulter **Outils → Santé** (worker, fournisseur d'envoi, secrets, stockage, sauvegardes).
2. **Propriétaire** : mettre en place une **copie hors site** régulière (base + `fichiers.tar`) et conserver `ENCRYPTION_KEY` à part.
3. **Dev** : protéger `main` (pull request + test vert), créer une préproduction, lancer `npm test` complet, livrer le verrou mis à jour via cette voie.
4. **Dev** : sonde externe sur `/sante` (alerte sur tout code ≠ 200) ; étendre `/sante` à `marketing.ready`.
5. **Propriétaire** : trancher D1–D10 et G-04 (branches non fusionnées).

## 14. Prochaines étapes

Rejouer le palier 25 sur le code actuel ; rédiger les correctifs de sécurité décidés (CSRF, CSP, 2FA, limites d'inscription) ; corriger `views/error.ejs` ; isoler la cause du démarrage de 192 s ; ajouter la vérification des bundles à la CI.
