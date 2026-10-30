# KOLAKISA — Checklist de préparation à la production

*Date : 2026-10-29. Statuts autorisés : **PASS**, **FAIL**, **BLOCKED**, **NOT_TESTED**, **NOT_APPLICABLE** (avec justification). Un contrôle non testé n'est jamais compté comme réussi. « Preuve » renvoie à une commande exécutée pendant ce palier, à un fichier du dépôt ou à un rapport antérieur daté.*

## Verdict

**BLOQUÉ — Kolakisa ne doit pas être déclaré prêt pour la production.** Les critères de sortie du palier 27 (`docs/audit-global-palier-24/08-criteres-sortie-palier-27.md`) comptent encore des **FAIL** (paiement, anomalies P1 ouvertes, surveillance, sauvegarde hors site, décisions humaines) et des **BLOCKED** (envoi d'e-mail réel, worker) qui exigent l'accès aux secrets et à l'état de production, que ce palier n'a pas. Le site est cependant **déjà en ligne** (kolakisa.com répond) ; ce document évalue la préparation, pas l'existence d'un déploiement.

## A. Critères du palier 27 (C01 à C14)

| # | Critère | Statut | Preuve | Risque | Action restante | Responsable |
|---|---|---|---|---|---|---|
| C01 | Suite automatisée verte | **NOT_TESTED** (suite complète non rejouée) | Palier 26 : 4 048 tests, 4 044 réussis, 1 échec (import de 5 000 lignes, dépend de la charge), 3 ignorés. Ce palier : 29 tests de la barre de l'éditeur + 14 fichiers ciblés (voir rapport) | Régression non détectée | Lancer `npm test` complet sur une machine peu chargée | Propriétaire / dev |
| C02 | Tests d'intégration du palier 25 | **NOT_TESTED** | Palier 25 : 21 scénarios, 177/177 critères (2026-10-11, serveurs jetables) ; non rejoués | Dérive depuis le 11/10 | Rejouer `docs/audit-integration-palier-25/` | Dev |
| C03 | Aucune P0 ; P1 corrigées ou acceptées par écrit | **FAIL** | Registre P24 : G-01 (webhook) ouvert, G-02 (worker) visibilité ajoutée mais valeur de production inconnue, G-04 (branches non fusionnées) bloquée ; G-03 corrigée | Paiement et tâches de fond non validés | Voir C04, C06 ; décision du propriétaire sur G-04 | Propriétaire |
| C04 | Paiement : paiement + remboursement de test ; webhook de production répond 400 sans signature | **FAIL** | **Mesuré le 2026-10-29** : `POST https://kolakisa.com/stripe/webhook` sans signature → **503** (au lieu de 400) | **Aucun paiement par carte ne peut être enregistré** | Définir `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (clés de **test** d'abord), déclarer le webhook chez Stripe, rejouer le parcours | **Propriétaire** (secrets) |
| C05 | Envoi d'e-mail réel (reçu, SPF/DKIM/DMARC, désinscription) | **BLOCKED** | Fournisseur et `SMTP_*` de production illisibles ; Santé → `sending_provider` à consulter par un administrateur | Messages enregistrés « envoyés » sans partir (fournisseur « console ») | Consulter Outils → Santé en production ; envoi d'essai ; vérifier SPF/DKIM/DMARC du domaine | Propriétaire |
| C06 | Tâches de fond actives | **BLOCKED** | `MARKETING_WORKER` de production illisible ; **aucun battement de cœur** : « actif » = variable à `on` | Automatisations et envois programmés inertes | Écran Santé → `worker` ; scénario d'essai ; redémarrage | Propriétaire |
| C07a | Dépendances : `npm audit` sans vulnérabilité haute | **PASS sur la branche, pas encore en production** | `npm audit --omit=dev` : **6 vulnérabilités (2 hautes : `multer`, `body-parser`)** avant ; **0** après mise à jour ciblée du seul verrou (voir rapport) | DoS sur téléversement et corps compressé ; avis `sanitize-html`, `nodemailer` | Livrer le verrou mis à jour | Dev |
| C07b | Sécurité applicative (CSRF, CSP, 2FA, limiteurs) | **FAIL** | Pas de jeton CSRF (seul `Origin`/`Referer` + `SameSite=Lax` ; une requête sans ces en-têtes passe) ; CSP sans `script-src` ; **pas de 2FA** ; inscription sans limite ; compteurs de connexion en mémoire ; 13 limites ouvertes (`PALIER17_LIMITATIONS`) | Voir limites | Décisions et correctifs dédiés (hors palier 19) | Dev + propriétaire |
| C08 | Isolation des sites | **FAIL** | P24 G-05 : décision multi-site D1–D10 non close ; palier 17 : 4 fuites corrigées, limites 1–5 et 7 ouvertes (noms uniques par organisation, effacement de contact partagé…) | Fuite entre sites sur certains cas | Trancher D1–D10 | Propriétaire |
| C09a | Restauration à blanc réussie | **PASS (données jetables uniquement)** | `KOLAKISA_BACKUP_AND_RESTORE.md` §5 : sauvegarde, restauration, `integrity_check` ok, démarrage d'un serveur, 99 migrations, `/sante` ok | Non prouvé sur une base de production réelle | Répéter sur une **copie téléchargée** de la production | Dev |
| C09b | Copie externe planifiée | **FAIL** | Sauvegardes automatiques **sur le même disque**, base seule ; aucun envoi hors site | **Perte du disque = perte des données** | Mettre en place un téléchargement hors site régulier (base + `fichiers.tar`) | Propriétaire |
| C10 | Surveillance (URL de santé, journalisation exploitable, alerte worker/envoi) | **FAIL** | `/sante` existe (basique) et l'écran Santé (~30 contrôles) ; **aucune alerte**, aucun journal d'erreurs persistant hors journal de l'hébergeur, erreurs frontend non remontées | Panne silencieuse (module marketing, worker) | Sonde externe sur `/sante` ; revue hebdomadaire de l'écran Santé | Propriétaire |
| C11 | Performance : mesures de référence consignées | **NOT_TESTED** | Seule mesure de ce palier : **démarrage à froid 192 s** (machine chargée). Mesures partielles P23/P24 | Redéploiement long | Mesurer sur une machine calme | Dev |
| C12 | Documentation relue et à jour | **PASS** (documents du palier 19) | Sept documents + `.env.example` complété ; chemins et variables vérifiés dans le code (voir rapport) | Décisions D1–D10 non consignées | — | — |
| C13 | Déploiement préparé (procédure écrite : fusion, migration, vérification, retour arrière) | **PASS** | `KOLAKISA_DEPLOYMENT_RUNBOOK.md` ; commande « migrations en attente » vérifiée | Retour arrière limité (2 migrations sur 99 ont un `.down.sql`) | Créer une préproduction | Dev |
| C14 | Décisions humaines closes (D1 à D6 + autorisations) | **FAIL** | Ouvertes (registre P24) | Blocage des correctifs en attente | Décisions du propriétaire | **Propriétaire** |

## B. Critères complémentaires

| Critère | Statut | Preuve | Limites | Action restante |
|---|---|---|---|---|
| Installation depuis le verrou (`npm ci`) | **PASS** | Exécutée (code 0), y compris `--omit=dev --ignore-scripts` | — | — |
| Compilation de production | **NOT_APPLICABLE** | Aucune compilation à l'hébergement : commande de build **vide**, bundles d'éditeur **versionnés** (`build-editor.js`) | Aucun contrôle que les bundles sont à jour | Ajouter un contrôle CI |
| Démarrage de l'application | **PASS** | Serveur réel démarré sur base restaurée, joignable | **192 s** de démarrage à froid | Mesurer |
| Contrôle de santé | **PASS (limité)** | `/sante` 200 en production (2026-10-29) ; essai de panne : 500 puis rétablissement | Ne reflète ni migrations, ni worker, ni disque, ni envoi, ni Stripe | Voir C10 |
| Migrations cohérentes | **PASS (base neuve)** | 99/99 appliquées, 114 dernière, copie `AVANT-MIGRATION` créée | Base de production réelle non testée ; échec de migration = module inactif **sans alerte** | Voir Déploiement §6 |
| Cookies / sessions | **PASS** (revue de code) | `httpOnly`, `sameSite=lax`, `secure:"auto"` + `trust proxy 1`, session régénérée à la connexion, 30 jours, store SQLite | `secure:"auto"` dépend de `X-Forwarded-Proto` du proxy (non vérifié chez l'hébergeur) | Vérifier le cookie en ligne |
| HTTPS | **PASS (observé)** | `http://kolakisa.com/` → 301 `https://kolakisa.com/` ; HSTS `max-age=15552000` | La redirection n'est **pas** dans le code (hébergeur) ; domaines clients : certificat géré par l'hébergeur, non vérifié | — |
| En-têtes de sécurité | **PASS partiel** | Observés en ligne : `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, HSTS, CSP minimale | CSP sans `script-src` : pas de protection XSS | Voir C07b |
| Gestion des erreurs | **FAIL partiel** | Pas de pile montrée en fonctionnement normal ; **mais** le gabarit d'erreur échoue (`icon is not defined`) pour une erreur survenant avant son intergiciel, d'où la page par défaut d'Express (pile visible si `NODE_ENV` ≠ `production`) | Valeur de production de `NODE_ENV` illisible | **Définir `NODE_ENV=production`** ; corriger `views/error.ejs` (dev) |
| Téléversements | **PASS partiel** | Extension imposée, noms aléatoires, SVG/HTML refusés ; médiathèque : type lu dans les octets | Miniatures/blog/vidéos : type déclaré par le client ; saturation mémoire possible (limite 6) | Limites P17 |
| Secrets | **PASS partiel** | AES-256-GCM pour les secrets en base ; aucun `console.*` n'imprime de secret ; `.env` ignoré par git | `ENCRYPTION_KEY` non sauvegardée ; `bcrypt` coût 10, mot de passe minimal 8 | Coffre pour les clés |
| Permissions côté serveur | **PASS** (tests P17/P23, matrice sans écart) | `palier17-securite.test.js` (15 tests), matrice P23 | Production non testée | — |
| Parcours fondamentaux | **NOT_TESTED** (production) | Couverts en test (P24 : 15/24 modules validés en test) | Aucun flux réel validé en production | Recette avec comptes de test |
| Responsive / accessibilité | **NOT_TESTED** pour ce palier | `audit-qualite` : 3 contrastes insuffisants, 4 focus invisibles (120 routes × 2 thèmes) ; `audit-interface` : 27 boutons étirés, 112 chevauchements, 359 textes coupés ; **non comparés à une base de référence** | Impossible de dire ce qui est nouveau | Comparer à `main` avant la barre |
| Performance acceptable | **NOT_TESTED** | Voir C11 | — | — |
| Retour arrière | **PASS (documenté), limité** | `KOLAKISA_DEPLOYMENT_RUNBOOK.md` §8 | Aucun retour arrière automatique ; code ancien vs schéma migré non garanti | Préproduction |

## C. Registre des risques résiduels

| ID | Risque | Type | Gravité | Impact | Probabilité / incertitude | Preuve | Réduction | Condition de résolution | Phase |
|---|---|---|---|---|---|---|---|---|---|
| R1 | **Webhook Stripe non configuré** : aucun paiement enregistré | Dépendance externe | **Élevée (P1)** | Ventes impossibles ou non reconnues | **Certain** (503 mesuré le 2026-10-29) | Sonde | Aucune sans secrets | Variables Stripe + webhook déclaré | Opération propriétaire |
| R2 | **Perte du disque = perte de tout** | Technique | **Élevée** | Base, médias, sauvegardes perdus | Faible-moyenne, impact total | Code `backups.js` | Téléchargement hors site | Stockage externe | Opération propriétaire |
| R3 | **Push sur `main` = production, sans barrière** | Technique | **Élevée** | Régression livrée directement | Moyenne | `DEPLOIEMENT-HOSTINGER.md`, `tests.yml` | Règles de branche + préproduction | Configuration GitHub / Hostinger | Infrastructure |
| R4 | **Échec de migration silencieux** (module marketing inactif, `/sante` ok) | Technique | Élevée | Fonctions marketing indisponibles sans alerte | Faible | `migrate.js`, `index.js` | Lire le journal après chaque déploiement ; sonde sur Santé | `/sante` reflétant `marketing.ready` | Développement dédié |
| R5 | **Worker et envoi d'e-mail non vérifiables** | Dépendance externe | Élevée (G-02) | Automatisations inertes | Inconnue | Variables illisibles | Santé → `worker`, `sending_provider` | Accès propriétaire | Opération propriétaire |
| R6 | **`NODE_ENV` inconnu en production** → pile d'erreur possible sur une erreur précoce | Technique | Moyenne | Fuite de chemins et de code | Inconnue | Essai de panne (§6 Exploitation) | Définir `NODE_ENV=production` | Panneau de l'hébergeur | Opération propriétaire |
| R7 | Pas de CSRF par jeton, CSP minimale, pas de 2FA | Technique | Moyenne | Attaques inter-sites sur sessions | Faible-moyenne | `security.js` | `SameSite=Lax` | Développement dédié + validation hébergeur (`X-Forwarded-Host`) | Développement |
| R8 | Fuites entre sites (limites P17 1-5, 7) | Technique | Moyenne | Données d'un site visibles ou écrasées par un autre | Faible | `PALIER17_LIMITATIONS` | Tests P17 | Décisions D1–D10 | Développement |
| R9 | Démarrage à froid très long (192 s) | Technique | Moyenne | Indisponibilité à chaque redéploiement | Mesuré (machine chargée) | Mesure | — | Mesure sur machine calme ; cause à isoler | Développement |
| R10 | `ENCRYPTION_KEY` perdue = secrets illisibles | Documentaire/opération | Élevée | Fournisseurs, Google à reconfigurer | Faible | `crypto.js` | Coffre de mots de passe | Décision du propriétaire | Opération propriétaire |
| R11 | Travail non fusionné (G-04) ; copies de travail multiples | Organisationnel | Moyenne | Perte de commits de l'éditeur | Moyenne | Registre P24 | Fusion ou abandon par branche | Décision du propriétaire | Opération propriétaire |
| R12 | Journal d'activité incomplet et non inviolable | Technique | Moyenne | Traçabilité lacunaire | Certain | `PALIER17_LIMITATIONS` n°12 | — | Développement dédié | Développement |
| R13 | **Aucun audit de sécurité indépendant** | Organisationnel | Moyenne | Failles non détectées | Inconnue | `PALIER17_LIMITATIONS` : « ni certifié ni entièrement sécurisé » | — | Audit externe | Décision du propriétaire |

## D. Ce qui reste hors de portée de ce palier

Aucun secret, aucune variable de production, aucune donnée de production, aucun accès SSH ou hPanel n'a été utilisé. Tout ce qui en dépend (C04, C05, C06, restauration sur la production réelle, certificat HTTPS d'un domaine client) reste **BLOCKED** ou **NOT_TESTED**.
