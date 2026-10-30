# KOLAKISA — Exploitation, journaux et diagnostic

*Date : 2026-10-29. Décrit l'observabilité **réelle** : un seul processus Node, des journaux sur la sortie standard, un écran de santé détaillé réservé à l'administration. Il n'existe pas de plateforme de surveillance.*

## 1. Où regarder, dans l'ordre

1. **`GET /sante`** (public) : l'application répond-elle, la base est-elle lisible, le redimensionnement d'images fonctionne-t-il ?
2. **Outils → Santé du site** (administrateur CMS) : une trentaine de contrôles détaillés (§3).
3. **Journal de l'hébergeur** (sortie standard et d'erreur du processus) : seul endroit qui conserve les erreurs serveur.
4. **Journal d'activité** (CMS, permission `audit.read`) : actions d'administration.
5. **Outils → Sauvegardes / Centre de gestion → Sauvegardes** : fraîcheur des copies.

## 2. `/sante` — ce qu'il vérifie et ce qu'il ne vérifie pas

Code : `server.js` (`app.get("/sante")`). Réponse : `{"statut":"ok","formations":N,"versions_images":"ok"|"indisponible"}`. Public, sans authentification, sans secret. Joignable même pour un hôte inconnu.

| Vérifie | Ne vérifie PAS |
|---|---|
| Que la base répond (`SELECT COUNT(*) FROM courses`) | **Les migrations marketing** (`marketing.ready`) : un module marketing hors service renvoie quand même `ok` |
| Que `sharp` produit réellement une image WebP | **Le worker** (`MARKETING_WORKER`), les tâches de fond |
| | L'espace disque, l'écriture dans `DATA_DIR` / `UPLOADS_DIR` |
| | La fraîcheur des sauvegardes, l'intégrité de la base |
| | Le fournisseur d'envoi, Stripe |

`versions_images: "indisponible"` **ne change pas le statut** (toujours 200). Comportement en cas de panne de la base : voir §6 (mesuré).

**Conclusion** : `/sante` = « le processus Node vit et sa base répond ». Ce n'est **pas** un contrôle de disponibilité des dépendances critiques ; pour cela, utiliser l'écran Santé (§3).

## 3. Santé détaillée du site (Outils → Santé)

Source : `src/services/tools/health.js`. Chaque contrôle est mesuré réellement, ou affiché « non mesuré ». Les plus utiles en exploitation :

| Contrôle | Signale |
|---|---|
| `secrets` | `ENCRYPTION_KEY` / `SESSION_SECRET` absents ou trop courts (**critique**) ; **attention** : le diagnostic accepte une `ENCRYPTION_KEY` de ≥ 16 caractères alors que le chiffrement exige 32 octets (64 hexadécimaux ou 44 base64) — une clé de 20 caractères passe le diagnostic mais échoue au chiffrement |
| `storage` | Fichiers envoyés dans le dossier de l'application (**critique**) : perdus au redéploiement |
| `worker` | Avertissement si `MARKETING_WORKER` ≠ `on` avec > 20 travaux en attente, ou travaux morts/bloqués. **« Actif » signifie seulement que la variable vaut `on`** : il n'y a ni battement de cœur ni horodatage du dernier passage ; un worker planté se verrait « actif » |
| `sending_provider` | Fournisseur « console » : les messages sont enregistrés comme envoyés **sans l'être** |
| `payments` | Stripe : présence des **noms** de variables (jamais des valeurs) ; critique si la clé existe sans secret de webhook. N'appelle pas Stripe : une clé révoquée n'est pas détectée |
| `migrations` | Comptes appliquées vs livrées (critique si appliquées < livrées) |
| `db_integrity` | `PRAGMA quick_check` + `foreign_key_check` |
| `backups` | Avertissement si aucune sauvegarde ou si la dernière a plus de 48 h |
| `https`, `site_url`, `headers`, `sensitive_files`, `admin_protected` | Configuration publique et exposition |
| `node_version` | Avertit si la version majeure de Node est impaire |

Limite écrite dans le code : « Non mesuré : aucun journal des requêtes lentes ni des erreurs serveur n'est tenu par le CMS ».

## 4. Journaux

| Quoi | Où | Contenu | Persistant ? |
|---|---|---|---|
| Erreurs serveur non gérées | `console.error("[KOLAKISA] Erreur sur METHODE URL :", err)` (`server.js`) | **Pile complète** + **URL complète, chaîne de requête comprise** | Seulement dans le journal de l'hébergeur |
| Rejets de promesses | `process.on("unhandledRejection")` : **journalise sans arrêter** le processus. **Pas de `uncaughtException`** | — | idem |
| Démarrage | `[KOLAKISA] …` (migrations appliquées, sauvegarde avant migration, « Module marketing INDISPONIBLE », « Worker marketing démarré. ») | — | idem |
| File d'e-mails | `[KOLAKISA] File d'envoi : …` ; en production sans SMTP, avertissement `E-mail « <type> » non envoyé : SMTP non configuré` | **Hors production : le corps de l'e-mail (liens de réinitialisation compris) est imprimé dans la console** | idem |
| Journal d'audit | Table `mk_audit_logs`, **en écriture seule** (déclencheurs `mk_audit_no_update` / `no_delete`) ; lecture avec `audit.read` | Action, ressource, `metadata` JSON **masquée par nom de clé** (`password`, `secret`, `token`, `api_key`, `authorization`, `cookie`, `signature`, `encryption` ; 8 Ko max) | Oui, en base |
| Erreurs frontend | **Non remontées** : aucun `window.onerror` ni point d'entrée serveur | — | Non |

**Données sensibles dans les journaux** — contrôle réalisé : aucun `console.*` n'imprime de corps de requête, mot de passe, jeton ou clé (recherche dans `server.js`, `src`, `scripts`, hors scripts de recette). **Réserve** : l'URL journalisée peut contenir un jeton si une erreur survient sur une route dont le jeton est dans le chemin (lien d'invitation, de réinitialisation, d'effacement) : **non vérifié route par route**. Traiter le journal de l'hébergeur comme confidentiel.

**Journal d'activité incomplet** (palier 17, limite 12) : ne couvrent pas tout — réinitialisation de mot de passe, changement d'e-mail, suppression de compte, connexions mobiles, usage des clés, création/publication d'articles, redirections, taxonomies, modération, publication de l'apparence. Les opérations d'outils vont dans `audit_log`, table distincte de celle lue par « Journal d'activité ». Le journal n'est pas inviolable.

**Messages d'erreur visibles par les visiteurs** : jamais de pile. Seul le message d'une erreur « utilisateur » est affiché ; toute autre erreur affiche « Une erreur est survenue. Réessayez dans un instant. ». Fuites mineures : un « Détail technique » (200 caractères) dans un message d'envoi de ressource (`gestion.js`) et dans l'essai de reconstruction — pages réservées au formateur.

## 5. Procédures de diagnostic

| Symptôme | Vérifier | Action |
|---|---|---|
| Site injoignable après un push | Redéploiement en cours ? (démarrage à froid mesuré : **192 s**) | Attendre ; lire le journal de l'hébergeur ; vérifier `SESSION_SECRET` (le processus s'arrête s'il est faible) |
| `/sante` OK mais le CMS marketing ne répond pas | Journal : `Module marketing INDISPONIBLE` | Lire l'erreur de migration juste au-dessus ; **ne pas modifier le fichier de migration** ; envisager la restauration de `AVANT-MIGRATION-*` avec accord |
| E-mails non envoyés | Santé : `sending_provider`, `worker` ; `SMTP_HOST` ; table `mail_outbox` (statut `skipped` + `last_error`) | Configurer SMTP ; `MARKETING_WORKER=on` |
| Aucune automatisation ne part | Santé : `worker` ; variable exactement `on` | Corriger la variable ; redémarrer |
| Paiement impossible / webhook 503 | Santé : `payments` | Définir `STRIPE_SECRET_KEY` **et** `STRIPE_WEBHOOK_SECRET` ; déclarer `<SITE_URL>/stripe/webhook` chez Stripe |
| Médias disparus | Santé : `storage` ; `UPLOADS_DIR` | Chemin **absolu** hors application ; restaurer l'archive des fichiers |
| Connexion refusée après plusieurs essais | **429** : 10 échecs par IP et par 15 min (compteur **en mémoire**, remis à zéro au redémarrage) | Attendre 15 min |
| Domaine d'un site renvoie 421 | Hôte non enregistré / non vérifié | Vérifier `mk_site_domains` (statut `verified`), TXT `_kolakisa-verify`, `HOTES_AUTORISES` |
| Site désindexé | `ALLOW_INDEXING=0` ou hôte privé | Retirer la variable en production |
| Sauvegarde ancienne | Santé : `backups` ; `SAUVEGARDE_AUTO` | Ne pas définir `SAUVEGARDE_AUTO=0` ; lancer une sauvegarde manuelle |

## 6. Comportement mesuré quand la base est en panne (2026-10-29)

Essai sur une copie jetable, serveur réellement démarré, puis table `courses` renommée **après** le démarrage (panne simulée) :

| Moment | Réponse de `/sante` |
|---|---|
| Avant la panne | HTTP 200 `{"statut":"ok",…}` |
| **Pendant** la panne | **HTTP 500**, page d'erreur HTML d'Express (**pas** une requête laissée en attente) |
| Après réparation | HTTP 200 `{"statut":"ok",…}` (le serveur se rétablit seul) |

Constats :
- **Une sonde qui alerte sur tout code ≠ 200 détecte bien cette panne.** Une hypothèse de l'exploration (« la requête resterait en attente ») est **fausse** pour ce scénario.
- L'erreur ne vient pas de la route `/sante` : un intergiciel exécuté **avant** elle échoue sur la même table. Entourer `/sante` d'un `try/catch` (essayé, **annulé**) ne change rien ; aucun code n'a donc été modifié.
- **Défaut relevé (non corrigé) : le gabarit d'erreur lui-même échoue** (`icon is not defined` dans `views/error.ejs`, quand l'erreur survient avant l'intergiciel qui fournit `icon`). Express retombe alors sur **sa page d'erreur par défaut**, qui **affiche la pile et les chemins de fichiers sauf si `NODE_ENV=production`**. L'application, elle, considère « production » dès que `SITE_URL` est en https (`server.js`) : si `NODE_ENV` n'est **pas** défini en ligne, un visiteur pourrait voir une pile d'erreur dans ce cas précis. **Définir `NODE_ENV=production` est donc obligatoire**, pas seulement recommandé. La valeur de production n'a pas pu être lue.
- Un scénario **différent** (fichier de base verrouillé, disque plein, base illisible) n'a **pas** été testé.

## 7. Surveillance minimale recommandée (aucun outil payant requis)

1. Une sonde externe gratuite (ou une tâche planifiée) sur `GET /sante` toutes les 5 minutes, **alertant sur tout code ≠ 200** (et non seulement sur l'absence de réponse).
2. Ouvrir **Outils → Santé** après chaque déploiement et chaque semaine.
3. Télécharger une sauvegarde hors site chaque semaine (`KOLAKISA_BACKUP_AND_RESTORE.md`).
4. Une alerte sur le worker et l'envoi **n'existe pas** : à créer (critère C10 du palier 27, **NON ATTEINT**). Proposition minimale : exposer l'état de `marketing.ready` et l'âge du dernier passage du worker dans l'écran Santé ; **non réalisé**, car cela modifie le moteur de tâches de fond — hors périmètre de ce palier.
