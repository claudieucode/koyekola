# KOLAKISA — Procédure de livraison et de déploiement

*Date : 2026-10-29. Décrit le mécanisme **réellement** en place. Il n'existe pas de pipeline de déploiement automatisé avec barrière : voir §1. Les étapes marquées « à faire » sont des recommandations, pas des capacités existantes.*

## 1. Ce qui existe réellement

| Élément | État réel | Source |
|---|---|---|
| Déclenchement du déploiement | **Chaque `git push` sur `main` redéploie automatiquement** sur Hostinger (dépôt GitHub relié dans hPanel, fichier d'entrée `server.js`, Node 24, commande de build **vide**) | `DEPLOIEMENT-HOSTINGER.md` |
| Barrière avant publication | **Aucune.** Aucun bouton de validation, aucun test bloquant | idem |
| Tests automatiques | `.github/workflows/tests.yml` (`npm ci` + `npm test`, Node 24) sur push `main` et pull request — **alerte après coup, pas une barrière** : « Hostinger publie le site dès l'envoi » | `.github/workflows/tests.yml` |
| Préproduction | **Aucune permanente.** Seulement des outils de répétition : `scripts/r9/essai-restauration.js`, `scripts/r9/controles-deploiement.js`, `scripts/recette-r8-copie.js` | `scripts/r9/` |
| Retour arrière automatique | **Aucun** | — |
| Environnements | Développement (local), test (serveurs jetables des tests), **production (kolakisa.com)** | — |

**Conséquence : un push sur `main` EST une mise en production.** Toute la prudence doit donc se faire **avant** le push.

## 2. Opérations qui peuvent interrompre le service

- Le redéploiement redémarre le processus Node. **Le démarrage à froid a été mesuré à 192 s** sur une base neuve (machine chargée) ; sur une base de production avec des migrations en attente, il peut être plus long. `/sante` n'est pas joignable pendant ce temps.
- Des migrations marketing en attente sont appliquées **pendant ce démarrage**, une copie `AVANT-MIGRATION-*` étant d'abord créée (copie de la base entière : durée proportionnelle à sa taille).
- Un bundle d'éditeur non régénéré (voir §3) ne casse pas le démarrage mais livre un éditeur périmé.

## 3. Avant le push (à faire, dans cet ordre)

1. **Branche et commit** : `git status` propre ; `git log origin/main..HEAD` = exactement ce qui doit partir ; la branche descend de `origin/main` actuel (`git fetch`, puis rebase si `main` a avancé). **Pas de `push --force`.**
2. **Tests** : lancer au minimum les fichiers de test des zones modifiées (`node --test tests/<fichier>.test.js`), idéalement `npm test` complet. Noter les échecs connus (`docs/audit-global-palier-24/03-registre-anomalies.md`, G-10).
3. **Bundles** : si `src/editor/` a changé → `npm run build:editor` et/ou `npm run build:automation-flow`, **puis commiter les sorties** (`public/js/course-editor.js`, `blog-editor.js`, `seo-fun.js`, `theme-code-editor.js`, `automation-flow.js`). Rien ne le vérifie automatiquement.
4. **Migrations** : lister les nouveaux fichiers dans `src/marketing/migrations/` (voir §6). Règles : numéro strictement supérieur à la dernière appliquée ; **ne jamais modifier ni supprimer un fichier déjà appliqué** (le module marketing refuserait de démarrer, tout entier) ; prévoir l'annulation (§8).
5. **Variables d'environnement** : si le code lit une nouvelle variable, l'ajouter **d'abord** dans le panneau de l'hébergeur et dans `.env.example`.
6. **Dépendances** : `npm audit --omit=dev` ; ne pas utiliser `npm audit fix` sans relire le diff du verrou (`sharp`).
7. **Sauvegarde préalable** (si la livraison touche aux données, aux migrations ou aux droits) : Mon espace → Centre de gestion → Sauvegardes → **Sauvegarder maintenant**, puis **télécharger** la base **et** l'archive des fichiers (`fichiers.tar`). Les copies automatiques sont sur le même disque que le site.
8. **Capturer l'état avant** (recommandé, existe) : `scripts/r9/controles-deploiement.js` enregistre statut, canonical, robots, sitemap et `/sante` AVANT, puis compare APRÈS.

## 4. Déploiement

1. Confirmer la cible : `origin` = `https://github.com/claudieucode/koyekola.git`, branche `main` ; l'application Hostinger suit bien `main` (hPanel → Déployer une application web).
2. `git push origin <branche>:main` en **fast-forward** uniquement. Si le push est refusé, **ne pas forcer** : `git fetch`, rebaser, retester.
3. Suivre le redéploiement dans hPanel. Prévoir plusieurs minutes (§2).

## 5. Vérifications après déploiement

1. `GET https://<site>/sante` → `{"statut":"ok",…,"versions_images":"ok"}` (peut être injoignable pendant le démarrage).
2. Se connecter en formateur → **Outils → Santé du site** : aucune ligne « critique » nouvelle. Contrôles utiles : migrations (appliquées = livrées), secrets, stockage, worker, fournisseur d'envoi, Stripe, sauvegardes, intégrité de la base.
3. Vérifier que le **nouveau code est servi** : récupérer un fichier modifié (`curl -s https://<site>/css/<fichier>.css | grep <marqueur>`). Le CDN peut retarder de quelques minutes : réessayer.
4. Parcours rapide : page d'accueil, un article, connexion, l'éditeur de pages, une page publique d'un site client si concerné.
5. Journaux de l'hébergeur : chercher `[KOLAKISA]`, `Module marketing INDISPONIBLE`, `Erreur sur`.
6. Contrôles de dépendances externes **si concernées** : paiement (§ checklist C04), envoi d'e-mail réel (C05), worker (C06). **Ils ne sont pas vérifiables sans les secrets de production**.

*Historique d'une vérification réelle (2026-10-29)* : après le push `dc636f93 → b27d7c25`, le nouveau CSS était servi au 4ᵉ essai espacé de 20 s ; `/sante` répondait 200.

## 6. Migrations

| Mécanisme | Où | Comment s'applique |
|---|---|---|
| **Marketing (officiel)** | `src/marketing/migrations/NNN_nom.sql` (99 fichiers ; trous 043, 050-059, 076-078, 092) | **Au démarrage uniquement** (`initMarketing`, `src/marketing/db/migrate.js`). Pas de commande CLI |
| Schéma du LMS | `src/config/database.js` | `CREATE … IF NOT EXISTS` + `ALTER … ADD COLUMN` conditionnels à **chaque** démarrage ; **sans suivi, sans sauvegarde préalable** |
| « R9 » hors runner | `scripts/r9/092_*.sql` + `.down.sql`, pilotée par `scripts/r9/site-maitre.js` | À la main, sur une base passée en argument ; scope `r9` dans `schema_migrations` |

**Garanties du runner marketing** (vérifiées dans `migrate.js`) : ordre numérique ; une transaction par migration (`BEGIN IMMEDIATE`, `ROLLBACK` si échec) ; somme de contrôle SHA-256 de chaque fichier appliqué ; **erreur si un fichier appliqué a été modifié ou supprimé**, ou si une migration en attente a un numéro inférieur à la dernière appliquée ; revérification sous verrou (deux instances qui démarrent ensemble) ; **copie préalable `AVANT-MIGRATION-<date>-v<n>.db`** s'il y a des migrations en attente et des utilisateurs (10 conservées) ; **si la copie échoue, la migration n'est pas appliquée**.

**Lister les migrations en attente** : il n'existe pas de commande. Méthode : comparer les fichiers livrés aux lignes de `schema_migrations` (lecture seule) :

```
node -e 'const {DatabaseSync}=require("node:sqlite");const fs=require("fs");const d=new DatabaseSync(process.argv[1],{readOnly:true});
const done=new Set(d.prepare("select version from schema_migrations where scope=\x27marketing\x27").all().map(r=>r.version));
console.log(fs.readdirSync("src/marketing/migrations").filter(f=>/^\d+_.*\.sql$/.test(f)&&!done.has(f.split("_")[0])).join("\n")||"aucune en attente")' <copie.db>
```

(à exécuter sur une **copie** ; **VÉRIFIÉE** le 2026-10-29 : « aucune en attente » sur une base à jour, « 99 en attente » sur une base jamais migrée ; comparaison par numéro de version.) L'écran Santé affiche un contrôle « Migrations de la base », mais **seulement en nombres** (critique si appliquées < livrées) : il ne détecte ni un trou ni un fichier modifié.

**Échec d'une migration** : l'application **démarre quand même**, le module marketing est **inactif**, `/sante` répond `ok` malgré tout. Il faut lire le journal (« Module marketing INDISPONIBLE ») — c'est une panne silencieuse.

**Vérifications après migration** : journal sans erreur ; Santé → « Migrations de la base » = bon ; `select max(version) from schema_migrations where scope='marketing'` = dernier numéro livré ; ouvrir une page du CMS.

## 7. Domaines et hôtes

À vérifier **avant** de mettre un site client en ligne : `SITE_URL` en https ; `HOTES_AUTORISES`, `PLATFORM_DOMAIN`, `DOMAIN_DNS_A`/`DOMAIN_DNS_CNAME` si multi-sites ; domaine du site **vérifié** (TXT `_kolakisa-verify`) ; certificat HTTPS émis par l'hébergeur (non géré par l'application) ; un hôte inconnu reçoit un **421**. **La redirection http → https n'est pas dans le code** : elle dépend de l'hébergeur (vérifié le 2026-10-29 : `http://kolakisa.com/` → 301 vers `https://kolakisa.com/`).

## 8. Retour arrière

**Il n'existe pas de bouton de retour arrière.** Options, de la plus sûre à la plus risquée :

1. **Code seul** (aucune migration dans la livraison) : `git revert <commit>` puis push normal. Redéploiement complet (§2).
2. **Livraison avec migration** : le code ancien **ne sait pas toujours lire** un schéma migré. Avant de revenir au code, évaluer la migration. Retours arrière SQL **manuels** existants : `scripts/migrations-retour-arriere/090_seo_par_site.down.sql`, `091_imports_par_site.down.sql` et `scripts/r9/092_site_maitre_ligne_dediee.down.sql` — jamais rejoués automatiquement, conçus « hors production, après sauvegarde » (`090` demande un `ROLLBACK`/`COMMIT` manuel et ne supprime pas sa ligne de `schema_migrations`). **Pour les 97 autres migrations marketing (sur 99), il n'y a aucun retour arrière.**
3. **Restauration de la copie `AVANT-MIGRATION-*.db`** : serveur arrêté, `npm run restaurer -- <fichier> --confirmer` (voir `KOLAKISA_BACKUP_AND_RESTORE.md`). **Perd toutes les données écrites depuis la copie.** Réservé aux incidents graves, avec accord explicite.

Ne **jamais** modifier l'historique d'une migration déjà appliquée pour « simplifier » un retour.

## 9. Ce qu'il manque avant une mise en production « à risque »

- Une **préproduction minimale** : une seconde application Hostinger suivant une branche `preprod`, avec sa propre base **copiée** de production via `scripts/copie-base-audit.js` (aucun secret de production, `SMTP_HOST` vide, `MARKETING_WORKER` absent, `ALLOW_INDEXING=0`). Non existante aujourd'hui.
- Une **barrière CI** : protéger `main` (pull request obligatoire + test vert) ; tant que ce n'est pas fait, un push direct déploie sans contrôle.
- Un contrôle CI que les **bundles** sont à jour.
- Une **commande** « migrations en attente » et un `/sante` qui reflète `marketing.ready`.
