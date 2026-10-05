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

## Heure d'envoi : heure locale et meilleure heure

Dans la fenêtre « Prêt à envoyer ? », rubrique **Quand ?** (`src/marketing/sending/sendtime.js`) :

- **Tout de suite** ou **à une date précise** : comportement habituel.
- **À l'heure locale de chaque contact** (équivalent de Timewarp) : chaque destinataire reçoit le message à l'heure choisie dans *son* fuseau. Si l'heure est déjà passée dans certains fuseaux, le lancement est refusé avec le nombre de contacts concernés (programmer au moins 24 h à l'avance couvre tous les fuseaux).
- **À la meilleure heure de chaque contact** (équivalent de Send Time Optimization) : heure locale la plus fréquente de ses ouvertures et clics réels des 12 derniers mois (robots exclus, au moins 3 engagements) ; sinon l'heure la plus active de l'audience. Indisponible tant que l'audience n'a pas au moins 20 engagements venant de 5 contacts. Les envois s'étalent sur les 24 h du jour choisi (fuseau par défaut).

Fuseau d'un contact, dans cet ordre : fuseau du contact (formulaire d'inscription, fiche, import — colonne « fuseau ») → fuseau du navigateur de son compte KOLAKISA (relevé à l'inscription et à chaque connexion) → pays à fuseau unique → fuseau par défaut (Réglages d'envoi). Aucune géolocalisation par adresse IP. Chaque destinataire garde son heure (`next_attempt_at`), son fuseau et l'origine de ce fuseau (`send_tz`, `send_basis`) ; le rapport de campagne résume le plan. Non disponible pour les tests A/B. Tests : `tests/marketing-heure-envoi.test.js`.

## Campagnes RSS

Campagnes → **Campagnes RSS** (`src/marketing/rss/`, migration 026). Une campagne RSS = un modèle « parent » contenant un bloc **Articles**, une source (blog KOLAKISA, éventuellement une catégorie, ou flux RSS/Atom externe), une audience et une fréquence (chaque jour, certains jours de la semaine, ou un jour du mois, à une heure du fuseau par défaut). À chaque échéance (tâche « rss.run » de la file) :

- seuls les articles **jamais envoyés** par cette campagne partent (mémorisés dans `mk_rss_seen`) ; aucun nouvel article → rien n'est envoyé ;
- au premier envoi, seulement les articles des dernières 24 h, 7 jours ou 30 jours selon la fréquence ; les plus anciens servent de point de départ et ne partent jamais ;
- au plus N articles par envoi (les plus récents) ; un envoi par jour au maximum ;
- chaque envoi est une campagne ordinaire (« enfant », `mk_campaigns.rss_id`) lancée avec les contrôles habituels (consentement, désinscription, rythme), visible dans Toutes les campagnes avec son rapport.

Le bloc **Articles** existe aussi dans les modèles ordinaires : il affiche les derniers articles du blog, figés à l'enregistrement (case « Actualiser »). Vide, il est autorisé dans un modèle mais bloque l'envoi d'une campagne ordinaire.

Flux externe : http(s) seulement, jamais une adresse du réseau interne (vérifiée au moment de la connexion, redirections comprises), 2 Mo et 10 s au plus ; le contenu est réduit à du texte brut. Tests : `tests/marketing-rss.test.js`.

## Pages d'atterrissage

Campagnes → **Pages d'atterrissage** (`src/marketing/landing/`, migration 027). Pages web hébergées à l'adresse `/p/<adresse>`, composées de sections (bandeau, texte, image, liste, formation du catalogue, bouton, citation, formulaire d'inscription), aux couleurs choisies. Grammaire fermée : aucun HTML libre ; liens https:// ou pages du site, images https:// ou médiathèque marketing ; textes échappés (Markdown sûr).

- **Inscription** : par un formulaire d'inscription existant (consentement prouvé, double confirmation, liste, étiquettes du formulaire) ; la page ajoute jusqu'à 5 étiquettes. Mêmes protections que les formulaires publics (champ piège, limite par adresse IP).
- **Publication** : contrôles (contenu, formulaire publié, formation publiée) ; en ligne mais non indexée par défaut (comme Mailchimp), option d'indexation ; mise hors ligne → page indisponible ; une formation dépubliée fait disparaître sa section.
- **Statistiques** : visites, visiteurs uniques (empreinte quotidienne non réversible, sans cookie ni adresse IP conservée, robots exclus), clics par lien (redirection uniquement vers un lien enregistré), inscriptions, taux de conversion (inscriptions / visiteurs uniques). Pas de chiffre d'affaires par page (non mesuré).

Tests : `tests/marketing-pages-atterrissage.test.js`.

## Sondages

Audience → **Sondages** (`src/marketing/surveys/`, migration 028). Questions : choix unique, choix multiples (option « Autre »), échelle 1-5 ou 1-10, texte court ou long ; obligatoires ou non. Page publique `/sondage/<adresse>` (non indexée) ; ouverture, clôture.

- **Dans un e-mail** : bloc « Sondage » (bouton, et en option la 1re question cliquable). Chaque destinataire reçoit un lien personnel signé (`survey_token`, jeton « survey » dérivé d'ENCRYPTION_KEY) : sa réponse est rattachée à sa fiche ; une nouvelle réponse remplace la précédente.
- **Lien public** : réponse anonyme, ou rattachée à l'adresse saisie (facultative, obligatoire ou jamais demandée). Inscription à une liste seulement si la case de consentement est cochée (preuve enregistrée).
- **Étiquettes automatiques** : « Réponse | étiquette » dans les réponses possibles ; et depuis le rapport, « Étiqueter N contacts » ayant choisi une réponse.
- **Rapport** : répartition et pourcentages, moyenne des échelles, réponses « Autre » et textes, réponses individuelles ; export CSV (administrateurs, formules neutralisées).
- Dès la première réponse, les types de questions et leurs réponses possibles sont figés (les intitulés restent modifiables).

Tests : `tests/marketing-sondages.test.js`.

