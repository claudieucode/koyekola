# 04 — API et intégrations

L'API publique (`/api/v1`) est décrite dans `EMAIL_MARKETING_API.md` (racine). État vérifié par l'audit : clés d'API hachées (SHA-256, affichage unique, révocation immédiate, portée lecture ou lecture/écriture, portée limitée à un site), limiteur de 120 requêtes par minute et par clé, contacts, événements, listes, campagnes (pause, reprise, annulation), vue d'ensemble. Webhooks sortants : signature HMAC-SHA256 avec horodatage, file avec 6 tentatives, clé d'idempotence par couple point d'accès / événement, historique des livraisons. Webhooks entrants du fournisseur : signature vérifiée, tolérance 300 s.

**Absent** : API d'envoi (transactionnel ou campagne), rotation du secret d'un webhook sortant, pagination et versionnement documentés au-delà de `/v1`.

## Connecteurs : accès réel et prérequis

« Vérifié » = le code existe et ses tests passent avec une simulation. **Aucun de ces services n'a été contacté pendant la mission.** Les coûts et limites chez les tiers ne sont pas repris ici : ils changent et n'ont pas été relus aux sources ; à vérifier avant tout engagement.

| Connecteur | Rôle | Code | Ce qu'il faut pour l'activer |
|---|---|---|---|
| SMTP (nodemailer) | envoi simple | `providers/smtp.js` | variables `SMTP_*` d'un serveur de messagerie ; aucun événement de retour (rebonds différés, plaintes inconnus) |
| Resend | envoi + retours + vérification de domaine | `providers/resend.js`, `domains/index.js` | compte, clé d'API (ajoutée dans Réglages d'envoi), domaine d'expédition, webhook entrant avec secret |
| Twilio | SMS | `sms/providers/twilio.js` | compte, numéro ou identifiant d'expéditeur, jeton, webhook entrant ; règles propres à chaque pays |
| Fournisseur d'IA | rédaction assistée | `ai/index.js`, connecteurs `services/connectors/http.js` | clé d'API déclarée dans les connecteurs ; le texte rédigé part chez le fournisseur, aucune donnée de contact |
| LMS Kolakisa | événements d'inscription, commande, leçon, certificat, avis | `bridge/events.js`, `bridge/lms.js` | rien (interne) ; lecture toutes les 30 s |
| Shopify, WooCommerce, autres boutiques | commandes, paniers | **aucun code** | à étudier : API, authentification et webhooks de chaque plateforme, compte de test ; ne pas simuler |
| Stripe | remboursements dans les événements | `refund.completed` dans `automations/catalog.js` | dépend de l'intégration de paiement du LMS ; le pied de page indique « aucun paiement réel » |

## Contrôle des liens (nouveau)

`POST /marketing/modeles/apercu/liens` : corps `{ template }`, réponse `{ results: [{ url, state, status, message, finalUrl? }], checked, skipped }`. Réservé à la session d'un membre ayant le droit `templates.write`, 6 appels par heure et par personne. Ce n'est pas une route de l'API publique.
