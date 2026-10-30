# KOLAKISA — Installation, configuration et démarrage

*Date : 2026-10-29. Chaque commande porte son statut : **VÉRIFIÉE** (exécutée pendant le palier 19, résultat noté), **LUE** (présente dans `package.json` ou un script, non exécutée) ou **NON TESTÉE**. Aucun secret n'apparaît dans ce document.*

## 1. Prérequis

| Prérequis | Valeur | Source |
|---|---|---|
| Node.js | **≥ 22.12.0** (recommandé : 24) ; version paire/LTS préférable (le contrôle de santé avertit si la version majeure est impaire) | `package.json` → `engines` ; `src/services/tools/health.js` |
| npm | fourni avec Node | — |
| `tar` | requis par `npm run sauvegarde` / `restaurer` (présent sur macOS et Linux) | `scripts/sauvegarde.js` |
| Git | pour récupérer le code | — |
| Chrome + `playwright-core` | **facultatifs**, seulement pour les tests « navigateur » (ils sont ignorés avec un message s'ils sont absents) | `tests/*-navigateur.test.js` |
| `sharp` | dépendance **optionnelle** : sans elle, les images d'origine sont servies | `package.json` ; `/sante` → `versions_images` |

Aucune base de données à installer : SQLite est intégré à Node.

## 2. Installation

```
git clone https://github.com/claudieucode/koyekola.git
cd koyekola
npm ci
```

- `npm ci` : **VÉRIFIÉE** (depuis le verrou `package-lock.json` du dépôt, code de sortie 0, y compris avec `--omit=dev --ignore-scripts`). Préférer `npm ci` à `npm install` : il reproduit exactement le verrou.
- Ne lancez **jamais** `npm audit fix` sans relire le diff du verrou : au palier 26, il retirait `sharp` du verrou (image cassée). Voir `docs/palier-26-corrections/00-RAPPORT-FINAL.md`.

## 3. Configuration

1. Copier le modèle : `cp .env.example .env` (le fichier `.env` est ignoré par git ; **ne le commitez jamais**).
2. Renseigner au minimum les variables du §5. Le code lit `.env` au démarrage via `dotenv` (`server.js`, première ligne).
3. En production, ces valeurs se saisissent dans le panneau de l'hébergeur (pas dans un fichier du dépôt) : voir `DEPLOIEMENT-HOSTINGER.md`.

Générer des secrets (à exécuter localement, ne rien coller dans un document) :

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Utile pour `ENCRYPTION_KEY` (64 caractères hexadécimaux) et pour `SESSION_SECRET`.

## 4. Base de données

- **Rien à créer** : le fichier `KOLAKISA.db` est créé dans `DATA_DIR` (par défaut `data/`) au premier démarrage, avec le schéma du LMS puis les **99 migrations marketing** (VÉRIFIÉ : toutes appliquées sur une base neuve, dernière version 114).
- Il n'existe **pas de commande** « migrer » : les migrations s'appliquent **au démarrage** (voir `KOLAKISA_DEPLOYMENT_RUNBOOK.md` §6).
- Créer le premier compte formateur **sans rien effacer** : renseigner `FORMATEUR_EMAIL`, `FORMATEUR_USERNAME` et `FORMATEUR_PASSWORD` au premier démarrage (le compte n'est créé que si aucun formateur n'existe), puis **supprimer `FORMATEUR_PASSWORD`** de la configuration. Alternative : `npm run creer-formateur -- email pseudo motdepasse` (LUE).
- ⚠️ **`npm run seed` est destructif** (efface et peuple une base de démonstration, avec des mots de passe connus). **Local uniquement, jamais en ligne.**

## 5. Variables d'environnement

Inventaire établi en lisant le code (`process.env.*` dans `server.js`, `src/`, `scripts/`). « Prod » = utilité en production. **Seule `SESSION_SECRET` bloque le démarrage.**

### 5.1 Minimum de production

| Variable | Rôle réel | Si absente ou mauvaise |
|---|---|---|
| `NODE_ENV=production` | Mode strict : secret de session exigé, cache de vues activé, **et Express masque les piles d'erreur** | Sans elle, l'application se croit en production si `SITE_URL` est en https, **mais Express non** : sur certaines erreurs, une pile d'erreur et des chemins de fichiers peuvent s'afficher (voir `KOLAKISA_OPERATIONS_AND_TROUBLESHOOTING.md` §6). **Obligatoire en ligne** |
| `SESSION_SECRET` | Signe les sessions ; sert aussi de repli à plusieurs signatures (`antispam`, `emailVerification`…) | **Production : le serveur refuse de démarrer** (absente, < 16 caractères, ou valeur d'exemple). Si elle change, toutes les sessions sont invalidées |
| `SITE_URL` (avec `https://`) | Adresse publique : liens absolus, redirection `www`, hôtes autorisés, sitemap, détection de la production | Liens faux ; santé « critique » si invalide ; **pas de redirection `www` ni de politique d'hôte** |
| `ENCRYPTION_KEY` | AES-256-GCM des secrets stockés en base (fournisseurs, Google) et signature des jetons web (désinscription, suivi). **64 hexadécimaux ou 44 en base64** | Le serveur démarre, mais le marketing et les connecteurs échouent. **Si elle change, les secrets déjà chiffrés deviennent illisibles : la conserver** |
| `DATA_DIR` | Dossier de la base (**absolu, hors du dossier de l'application, sur un volume qui survit aux redéploiements**) | Base perdue au redéploiement ; santé « critique » |
| `UPLOADS_DIR` | Dossier des fichiers envoyés (**chemin absolu obligatoire** ; un chemin relatif est **ignoré** silencieusement) | Médias perdus au redéploiement |

### 5.2 Selon les fonctions utilisées

| Variable | Rôle | Remarque |
|---|---|---|
| `PORT` | Port d'écoute (3002 par défaut) | L'hébergeur l'impose en général |
| `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_SECURE` (`true` pour 465), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `CONTACT_EMAIL` | Envoi d'e-mails | **Sans `SMTP_HOST`, aucun e-mail ne part** : en production un avertissement est journalisé ; **hors production, le corps de l'e-mail (y compris les liens de réinitialisation) est affiché dans la console** |
| `MARKETING_WORKER=on` | Démarre le worker marketing et le pont boutique | **Valeur exacte `on`** (`ON`/`true` ne marchent pas). Sans lui : aucun envoi programmé, aucune automatisation |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiement par carte et webhook signé | Les deux ensemble. Sans elles, les commandes payantes sont **refusées en ligne**. Le webhook répond **503** tant que le secret est absent |
| `ANTHROPIC_API_KEY` | Assistant IA | Erreur seulement à l'usage |
| `BUNNY_LIBRARY_ID`, `BUNNY_TOKEN_KEY`, `BUNNY_TOKEN_TTL_HOURS` | Vidéos protégées Bunny Stream | Facultatif |
| `FORMATEUR_EMAIL`, `FORMATEUR_USERNAME`, `FORMATEUR_PASSWORD` | Création du premier compte formateur | **Supprimer le mot de passe après usage** |
| `SEO_JOBS` | `on` par défaut ; toute autre valeur coupe les tâches SEO | — |
| `SAUVEGARDE_AUTO=0` | Coupe la copie quotidienne de la base | À ne **pas** définir en production |

### 5.3 Multi-sites et domaines

`PLATFORM_DOMAIN` (domaine de la plateforme pour les sous-domaines), `DOMAIN_DNS_A` / `DOMAIN_DNS_CNAME` (cibles DNS attendues, séparées par des virgules), `HOTES_AUTORISES` (hôtes acceptés en plus des domaines enregistrés), `ALLOW_INDEXING` (`0` interdit toute indexation ; `1` la force ; vide = automatique selon l'hôte). ⚠️ `ALLOW_INDEXING=0` en production **désindexe le site**.

### 5.4 Réglages avancés (valeurs par défaut sûres)

`BLOG_MAX_REVISIONS` (100), `IMPORT_SITE_MAX_ROWS` (5000), `SITEMAP_SPLIT_AT` (5000), `CONTACT_REQUESTS_PER_HOUR` (60), `COMMENT_NOTIFY` (`0` coupe les notifications), `SITE_NAME`, `TAXONOMY_CATEGORY_BASE` / `TAXONOMY_TAG_BASE` (**les changer casse les liens existants**), `WRITING_PING_EVERY_MS`, `WRITING_PING_BACKOFF`, `SEO_JOBS_TICK_MS`, `HEALTH_CHECK_TIMEOUT_MS`, `HEALTH_INFO_TTL_MS`, `KOLA_ERASURE_BATCH`.

### 5.5 À ne JAMAIS définir en production

`PAIEMENT_SIMULE` (accorde des accès sans paiement), `STRIPE_API_BASE` (redirige les appels de paiement), `SEO_PSI_URL`, `SEO_GSC_URL`, `SEO_GA4_URL`, `SEO_GOOGLE_TOKEN_URL`, `KOLA_ERASURE_FAIL`, `WRITING_PING_ALLOW_PRIVATE`, `KOLA_TEST_ALLOW_LOOPBACK`, `KOLAKISA_TEST_DNS_FILE`, `KOLAKISA_DOMAIN_VERIFY`, `CONNECTOR_API_BASE_*`, `KW_WRITE_BEHIND_MS`, `SAUVEGARDE_DELAI_MS`. Plusieurs sont ignorées hors `NODE_ENV=test`, mais ne comptez pas dessus.

### 5.6 Variables « fantômes »

`TRUST_PROXY` et `COOKIE_SECURE` **s'affichent dans l'écran de diagnostic mais ne sont lues par aucune logique** : le proxy est codé en dur (`app.set("trust proxy", 1)`, `server.js`) et le cookie de session est `secure: "auto"`. Les définir n'a aucun effet.

### 5.7 Variables des tests et scripts

`TEST_START_TIMEOUT_MS` (délai de démarrage du serveur de test, 120000 par défaut), `CHROME_PATH`, `FIREFOX_PATH`, `KOYEKOLA_TEST_SEED_DB`, et les options des scripts d'audit (`ED_*`, `PX_*`, `THEME`).

## 6. Démarrage

| Commande | Effet | Statut |
|---|---|---|
| `npm start` | `node server.js` | VÉRIFIÉE (équivalent : `node server.js` avec variables posées, serveur joignable, `/sante` = `ok`) |
| `npm run dev` | `node --watch server.js` (rechargement automatique) | LUE |
| `npm run build:editor` / `npm run build:automation-flow` | Régénère les bundles versionnés (nécessite les dépendances de développement) | LUE |

⚠️ **Démarrage lent mesuré : 192 secondes** sur une base neuve (schéma du LMS + 99 migrations), machine chargée par d'autres processus. Ne **pas** conclure à un blocage ; attendre la ligne « … disponible sur … ». Les tests utilisent `TEST_START_TIMEOUT_MS` pour cette raison. La cause exacte n'a pas été isolée.

## 7. Vérifications après démarrage

```
curl -s http://127.0.0.1:3002/sante
```

Attendu : `{"statut":"ok","formations":N,"versions_images":"ok"}` (VÉRIFIÉ). Limites de ce contrôle : voir `KOLAKISA_OPERATIONS_AND_TROUBLESHOOTING.md` §2. Ensuite : se connecter en formateur puis **Outils → Santé du site** (une trentaine de contrôles : secrets, stockage, worker, e-mail, Stripe, sauvegardes, migrations, intégrité de la base).

## 8. Tests

| Commande | Effet |
|---|---|
| `npm test` | `node --test --test-concurrency=1 "tests/*.test.js"` — suite complète (654 fichiers). **Chaque fichier démarre son propre serveur** : compter de longues durées |
| `node --test tests/<fichier>.test.js` | Un seul fichier (VÉRIFIÉE sur plusieurs fichiers) |

Les tests « navigateur » exigent Chrome et `playwright-core` (`npm install --no-save playwright-core`, non déclaré dans `package.json`) ; sans eux ils sont ignorés avec un message. La CI GitHub (`.github/workflows/tests.yml`) exécute `npm ci` puis `npm test` sous Node 24.

## 9. Erreurs courantes

| Symptôme | Cause | Résolution |
|---|---|---|
| `SESSION_SECRET est absente ou trop faible` puis arrêt | Production détectée (`NODE_ENV=production` ou `SITE_URL` en https) sans secret ≥ 16 caractères | Définir `SESSION_SECRET` |
| `Module marketing INDISPONIBLE` dans le journal | Une migration marketing a échoué (ou un fichier appliqué a été modifié / supprimé) ; l'application démarre quand même | Lire l'erreur qui précède ; **ne jamais modifier une migration déjà appliquée** ; restaurer la copie `AVANT-MIGRATION-*` si besoin |
| Fichiers envoyés disparus après un déploiement | `UPLOADS_DIR` relatif (ignoré) ou dans le dossier de l'application | Chemin **absolu** hors de l'application |
| « Le serveur de test n'a pas démarré » | Démarrage plus long que 120 s | `TEST_START_TIMEOUT_MS=900000` |
| Aucun e-mail reçu | `SMTP_HOST` vide, ou fournisseur « console » | Configurer SMTP ; vérifier Outils → Santé → « Fournisseur d'envoi » |
| Webhook Stripe : 503 | `STRIPE_WEBHOOK_SECRET` absent | Définir les deux variables Stripe |
| Envois programmés et automatisations inactifs | `MARKETING_WORKER` ≠ `on` | Définir exactement `on` |
