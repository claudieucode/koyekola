# E-mails de KOLAKISA — fonctionnement, configuration, maintenance

Deux familles d'e-mails :

| Famille | Exemples | Envoi | Réglage |
|---|---|---|---|
| **E-mails du site** (transactionnels) | confirmation d'achat, mot de passe oublié, bienvenue à l'inscription, alerte « nouveau message de contact », accusé de réception au visiteur, confirmation d'inscription à la newsletter | SMTP (`src/utils/mailer.js`), via la file `src/utils/outbox.js` | variables `SMTP_*`, `CONTACT_EMAIL` |
| **Marketing** | campagnes, automatisations | fournisseur choisi dans *Marketing → Réglages d'envoi* (Console / SMTP / Resend) | réglages chiffrés + `ENCRYPTION_KEY`, `MARKETING_WORKER=on` |

## Configuration recommandée : Resend pour tout

1. Compte sur resend.com → *Domains* → ajouter `kolakisa.com` → recopier dans hPanel → *DNS* les enregistrements
   affichés par Resend (DKIM `resend._domainkey`, SPF/MX du sous-domaine `send`), plus un DMARC :
   `_dmarc` · TXT · `v=DMARC1; p=none;` (à durcir en `p=quarantine` après quelques semaines sans problème).
2. Resend → *API Keys* → créer une clé.
3. Variables d'environnement (hPanel → votre site Node.js) :
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASS=<la clé Resend re_…>
   SMTP_FROM=KOLAKISA <contacts@kolakisa.com>
   CONTACT_EMAIL=<adresse qui reçoit les messages du formulaire de contact>
   MARKETING_WORKER=on
   ```
4. *Marketing → Réglages d'envoi* : fournisseur **Resend**, même clé, expéditeur `KOLAKISA <contacts@kolakisa.com>`.
   Webhook Resend (rebonds/plaintes) : l'adresse affichée sur la page.
5. Vérifier : bouton **« Envoyer un e-mail de test »** (canal « E-mails du site » puis « Campagnes ») sur la même page,
   ou en terminal : `npm run test-email -- votre-adresse@exemple.com` (diagnostic détaillé, jamais le mot de passe).

## Garanties (tests : `tests/emails.test.js`)

- **Aucune page n'attend le serveur d'e-mail** : achat, contact, inscription, mot de passe oublié mettent l'e-mail en
  file et répondent tout de suite. Délais SMTP bornés (10 s connexion, 20 s envoi).
- **Échec = réessai** : 5 essais (1, 2, 4, 8 min), relance chaque minute ; un envoi interrompu est repris.
  Journal visible dans *Réglages d'envoi → E-mails du site : derniers envois* (jamais le contenu, adresse masquée).
- **Liens secrets** (réinitialisation, confirmation newsletter) : seule leur empreinte SHA-256 est en base ; le texte de
  l'e-mail est effacé de la file dès qu'il est parti. Réinitialisation : 1 h, usage unique, 5 demandes/h par IP et 3/h
  par adresse, réponse identique que le compte existe ou non.
- **Formulaire de contact** : validation côté serveur, champ piège anti-robots, 5 messages/h par IP ; l'accusé de
  réception a un texte fixe (ne recopie rien de ce que la personne a écrit : pas de relais de spam possible).
- **Double confirmation newsletter** : activée par défaut pour les nouveaux formulaires (case dans l'éditeur du
  formulaire) ; aucun consentement n'est enregistré avant le clic sur « Oui, je confirme » (un simple affichage du lien
  par un antivirus ne confirme rien) ; lien valable 7 jours.

## Maintenance

- Changer de fournisseur ou de clé : modifier les variables `SMTP_*` (e-mails du site) et *Réglages d'envoi* (marketing),
  puis renvoyer un e-mail de test.
- Après un changement DNS, attendre la validation du domaine chez Resend (statut « Verified ») avant d'envoyer.
- Surveiller le journal « E-mails du site » : un « Échec » répété signale des identifiants refusés ou un domaine non vérifié.
- Fournisseur de secours (si Resend tombe) : non branché ; possible avec un second compte (ex. Brevo) — à décider.
