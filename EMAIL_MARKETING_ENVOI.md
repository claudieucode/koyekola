# Envoi de campagnes — guide, garanties et limites (jalon M3)

## Mise en route (dans cet ordre)
1. **`.env`** : `ENCRYPTION_KEY` (32 octets en hexadécimal : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), `SITE_URL=https://votre-domaine.fr` (les liens de désinscription et de suivi en dépendent), `MARKETING_WORKER=on`. **Ne changez plus `ENCRYPTION_KEY`** : cela invaliderait les liens déjà envoyés et les secrets enregistrés.
2. **Envoi → Réglages** : fournisseur, expéditeur (`Nom <adresse@domaine>`), débit, plafond quotidien, clés.
3. **Modèles → Adresse du pied de page** (exigée par plusieurs législations).
4. **Chez votre fournisseur** : authentifier le domaine d'expédition (SPF, DKIM, DMARC) — sans cela vos messages iront en indésirables. Ce module ne le fait pas à votre place (diagnostic prévu au jalon M6).
5. **Envoyez-vous un test** depuis l'éditeur de modèle, dans vos vrais clients mail, avant toute campagne.
6. **Campagnes → Nouvelle** : modèle + liste ou segment → **contrôle avant envoi** → lancement (confirmation en tapant le nombre de destinataires).

## Fournisseurs
| Fournisseur | Usage | Retours de livraison |
|---|---|---|
| `console` (**défaut**) | Essais : **rien n'est envoyé**, les messages sont seulement journalisés | — |
| `smtp` | Variables `SMTP_*` du serveur | Seul un refus immédiat du serveur est connu (adresse inexistante : 550/551/553 → rebond dur). Pas de rebonds différés ni de plaintes |
| `resend` | API Resend | Webhooks signés : livré, rebond, plainte → alimentent la liste de suppression |

Webhook Resend : déclarez `https://votre-domaine.fr/webhooks/email/resend/1` (événements `delivered`, `bounced`, `complained`) et enregistrez son secret `whsec_…` dans Envoi → Réglages. Les clés sont **chiffrées**, jamais réaffichées, jamais journalisées.

## Ce que garantit l'envoi (couvert par des tests)
- **Conformité vérifiée à CHAQUE message**, au moment de partir : désinscrit, bloqué, consentement retiré ou désinscrit de la liste **entre le lancement et l'envoi** ⇒ rien n'est envoyé (« ignoré »).
- **Jamais de doublon silencieux** : `UNIQUE(campagne, contact)` ; un envoi **interrompu** n'est pas rejoué d'office (marqué « échoué : interrompu »).
- **Contenu et destinataires figés** au lancement : modifier le modèle ou la liste ensuite ne change pas la campagne.
- **Débit et plafond** (60/minute et 1 000/jour par défaut), calculés depuis la base (valables après redémarrage). Au-delà, l'envoi continue le lendemain (UTC).
- **Reprises** : échec temporaire → 3 essais (attente croissante) ; refus définitif → ce destinataire seulement ; limitation du fournisseur → ralentissement ; identifiants refusés → **pause** de la campagne avec un message.
- **Désinscription en un clic** : en-têtes `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058) et lien signé dans le pied de page ; la désinscription est attribuée à la campagne.
- **Rebond permanent ou plainte ⇒ liste de suppression**, définitivement ; un rebond temporaire ou de type inconnu ne supprime jamais.
- **Webhooks** : signature Svix vérifiée (HMAC, horodatage à ±5 min), rejeu sans effet, aucun détail d'erreur divulgué.
- **Suivi** : la destination d'un clic est **lue en base** (jamais dans le lien) ⇒ pas de redirection ouverte ; jetons signés ; les clics de robots sont enregistrés mais exclus des chiffres.
- **Lancement** réservé aux administrateurs (`campaigns.send`) ; toutes les actions sont auditées, sans adresse e-mail ni secret.

## Limites à connaître
- **Le worker doit tourner** (`MARKETING_WORKER=on`) : sans lui, une campagne lancée reste en file. Sur un hébergement Node qui met le processus en veille (Hostinger), l'envoi peut s'interrompre puis reprendre ; pour une campagne importante, prévoyez un processus qui reste actif ou un appel régulier au site.
- **La délivrabilité ne peut pas être garantie** : elle dépend de votre domaine (SPF/DKIM/DMARC), de votre réputation, de la qualité de la liste et du contenu. Démarrez petit (le plafond quotidien y aide) et surveillez rebonds et plaintes (alertes à 2 % de rebonds et 0,1 % de plaintes).
- **Les ouvertures sont indicatives** (Apple Mail et d'autres clients pré-chargent les images ; d'autres bloquent les images). Le taux de clic est plus fiable. Suivi des ouvertures désactivé par défaut.
- **SMTP** : pas de plaintes ni de rebonds différés. Pour un suivi complet, utilisez Resend.
- **Un envoi interrompu n'est pas rejoué** : il faut vérifier « Messages non envoyés » sur la campagne. Si votre fournisseur a déjà accepté le message, un renvoi manuel créerait un doublon.
- Le texte brut des messages n'est pas suivi (seul le HTML l'est). Pas de test A/B, d'automatisations ni d'attribution du revenu à ce stade (jalons M4/M5). Pas encore de webhook pour SES/Sendgrid.
- Volumes : SQLite tient ~100 000 contacts ; les campagnes plus lourdes demandent PostgreSQL et un worker séparé.
