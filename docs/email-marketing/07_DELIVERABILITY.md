# 07 — Délivrabilité

## Ce qui existe

| Élément | État | Où |
|---|---|---|
| Abstraction de fournisseur (console, SMTP, Resend) | V | `src/marketing/sending/providers/` ; changer de fournisseur = ajouter un fichier qui implémente `send(message)` |
| File d'attente, réservation atomique, reprises, travaux « dead » | V | `src/marketing/queue/` |
| Débit par minute, plafond quotidien (calculés depuis la base) | V | `sending/dispatch.js` (`capacity`) |
| Idempotence d'envoi (`UNIQUE(campaign_id, contact_id)`, clé `Idempotency-Key` chez Resend) | V | `sending/builder.js`, `migrations/008_envoi.sql` |
| Erreurs temporaires / permanentes / adresse refusée / limitation / configuration | V | `providers/errors.js` |
| Vérification SPF, DKIM, DMARC par requêtes DNS réelles | P | `domains/index.js` ; DKIM par sélecteurs courants ou par l'API Resend |
| Webhooks entrants signés (HMAC-SHA256, tolérance 300 s) | V | `sending/webhooks.js` |
| Rebond permanent et plainte → liste de suppression | V | `sending/webhooks.js` |
| En-têtes `List-Unsubscribe` + un clic | V | `sending/builder.js` |
| **Pause automatique sur plaintes ou rebonds (nouveau)** | V | `sending/reputation.js`, `marketing-reputation.test.js` |
| Contrôle avant envoi (preflight) | V | `sending/preflight.js` |

## Garde de réputation (ajouté par cette mission)

Une campagne en cours d'envoi est mise en pause automatiquement, avant le lot suivant et à chaque plainte ou rebond permanent reçu, quand :

- les plaintes pour spam atteignent **0,3 %** des messages envoyés ; ou
- les rebonds permanents atteignent **5 %** ;

et seulement après **100 envois** (en dessous, un seul retour fausserait la mesure). Le message affiché explique la cause et la marche à suivre. La reprise est manuelle ; après une reprise, le garde ne recoupe qu'au **double** du seuil (l'équipe a décidé en connaissance de cause). Chaque pause est journalisée (`campaign.paused`, motif `reputation`).

Sources des seuils : le seuil de 0,3 % est celui que Google indique dans ses consignes aux expéditeurs en volume (« ne jamais l'atteindre ») ; Yahoo publie une règle voisine. **Non vérifié ici** : la page Mailchimp correspondante renvoie une erreur 404, donc ces valeurs ne sont pas confirmées par Mailchimp. Le seuil de 5 % de rebonds est une valeur prudente de ce projet, non une règle d'une messagerie. Les deux sont des constantes dans `sending/reputation.js`.

## Ce qui manque ou dépend de l'extérieur

- **Échauffement d'IP, limitation par domaine destinataire** : non implémentés. Pertinents seulement avec une IP dédiée et de gros volumes.
- **SMTP** : aucun événement de retour. Les rebonds différés et les plaintes ne sont connus qu'avec Resend (ou un autre fournisseur à webhooks). Avec SMTP seul, le garde de réputation ne voit ni plaintes ni rebonds différés.
- **Rebonds mous** : enregistrés mais jamais comptés ; pas de suppression après répétitions.
- **Ouvertures** : les clients de messagerie (protection de la vie privée, proxys) déclenchent des ouvertures automatiques ; l'interface le signale, mais il n'y a pas de détection. Les taux de clic sont plus fiables.
- **Signature DKIM** : faite par le fournisseur, pas par l'application ; la vérification DNS ne prouve pas que le sélecteur réellement utilisé par le fournisseur est celui qui a été testé.
- **Placement en boîte de réception** : non mesurable ici. Acceptation par le fournisseur, livraison, placement et lecture sont quatre choses différentes ; le logiciel ne mesure que les deux premières.
- **Envoi réel** : jamais exécuté pendant cette mission. Il demande un domaine d'expédition vérifié (SPF, DKIM, DMARC publiés dans la zone DNS) et un compte chez le fournisseur.

## Prérequis pour une première campagne réelle

1. Choisir le fournisseur (Resend recommandé : webhooks de retour, clé d'idempotence) et renseigner sa clé dans Réglages d'envoi.
2. Ajouter le domaine d'expédition dans Paramètres → Domaines, publier les enregistrements DNS demandés, lancer la vérification jusqu'à « Authentifié ».
3. Configurer le webhook entrant du fournisseur (secret par organisation).
4. Vérifier l'adresse postale de l'organisation (exigée par plusieurs pays).
5. Envoyer d'abord un test à l'équipe, puis une petite liste d'abonnés consentants.
