# Mailchimp — variables d'environnement

La **clé d'API Mailchimp** et la **clé Mailchimp Transactional (Mandrill)** ne se mettent **pas** dans le fichier `.env` : on les saisit dans l'écran *Marketing → Mailchimp*, elles sont alors enregistrées **chiffrées** (AES-256-GCM, liées à l'organisation) avec la clé `ENCRYPTION_KEY`, et ne sont jamais réaffichées. Seules les variables ci-dessous concernent le serveur.

| Variable | Obligatoire | Description | Exemple |
|---|---|---|---|
| `ENCRYPTION_KEY` | **Oui** | 32 octets (64 caractères hexadécimaux, ou 44 caractères en base64). Chiffre les clés d'API et le jeton de webhook. Sans elle, l'écran refuse d'enregistrer une clé. Déjà utilisée par Kolakisa pour les autres secrets : **ne la changez pas** après avoir enregistré des clés (elles deviendraient illisibles). | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SITE_URL` | Pour les webhooks | Adresse publique du site, en **HTTPS**. Sert à fabriquer l'adresse du webhook entrant `https://<site>/webhooks/mailchimp/<organisation>/<jeton>`. Sans elle, l'installation du webhook en un clic est refusée (la synchronisation horaire reste active). | `https://kolakisa.com` |
| `MAILCHIMP_SYNC_INTERVAL_MS` | Non | Intervalle de la synchronisation automatique, en millisecondes (60 000 minimum). Par défaut : une heure. La synchronisation ne s'exécute que si Mailchimp est connecté et que la case « Synchroniser automatiquement » est cochée. | `3600000` |
| `MAILCHIMP_API_BASE` | Non (tests) | Remplace `https://<centre>.api.mailchimp.com/3.0` (serveur de test ou simulateur). **HTTPS obligatoire en production.** Ne jamais la renseigner en production. | `http://127.0.0.1:4010/3.0` |
| `MANDRILL_API_BASE` | Non (tests) | Remplace `https://mandrillapp.com/api/1.0`. Même remarque. | `http://127.0.0.1:4010/api/1.0` |

## Ce qu'il n'y a pas à configurer
- Aucune variable de limite de débit : le plafond de **8 requêtes simultanées** (Mailchimp en autorise 10) est fixé dans le code.
- Aucun secret de webhook dans `.env` : le jeton est généré à la connexion, chiffré en base, régénérable depuis l'écran.
