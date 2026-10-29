# Emails et automatisations

Préfixe `H` = https://help.systeme.io/article/

## 1. Campagnes d'e-mails (séquences)

Source : H367-how-to-set-up-an-email-campaign.
- Création : Emails > Campaigns > Create ; fenêtre « Create campaign » : nom, adresse expéditeur, description > Save.
- E-mail : ouvrir la campagne > Create ; champs Subject, Sender name, Sender email address, **Editor type** (Classic editor / Visual editor), Select a template. Changer d'éditeur en cours efface le contenu.
- Éditeur classique : pièce jointe, variables de substitution, « Create a link ». Éditeur visuel : glisser-déposer (images, textes, boutons, sections, colonnes), Settings, aperçu mobile, visibilité Desktop/Mobile par élément, polices Mailbox Default / Adaptive. Boutons : Save, Save and test, Exit.
- Planification : l'e-mail doit être activé ("..." > Activate) puis : **This email will be sent after**, **Delay**, **Time / Days of the week** (facultatif). L'e-mail ne part que si toutes les conditions sont remplies ; le délai part de la livraison du précédent. Insertion en milieu de séquence : seuls les contacts n'ayant pas atteint l'étape le reçoivent.
- Limites chiffrées (pièces jointes, nombre d'e-mails) : non précisées par H367. Pièces jointes des e-mails de règle : 5 Mo (H280-how-to-send-an-automatic-email-when-a-lead-subscribes).
- Inscription manuelle à une campagne : article 159 non lu. Plan Free : 1 campagne email (https://systeme.io/pricing).

## 2. Newsletters

Source : H1335-how-to-use-the-email-editor.
- Emails > Newsletters > Create. Fenêtre : Subject, Sender name, Sender email address, Select an editor mode. Configuration : preview line (facultative), expéditeur, pièces jointes, filtres de contacts (inscrits sur une période, avec tag, excluant un tag), variables.
- Actions finales : Save and test, Save and send, Save and schedule, Save draft, Create an A/B test, Exit.
- Éditeur visuel : newsletters et campagnes uniquement ; e-mails d'automatisation = éditeur classique seul.
- Limites : test d'envoi seulement après vérification de l'adresse expéditeur ; rendu en mode sombre non contrôlé. Procédure complète (358), renvoi aux non-ouvreurs (289), A/B de newsletter : non lus. À VÉRIFIER.

## 3. Règles d'automatisation (Rules)

Source : H140-automation-rules.
- Création : Automations > Rules > Create ; colonnes Trigger et Action ; « + » > liste **Add trigger** ; « + » > liste **Add action** ; **Save Rule**. Les règles peuvent aussi se créer depuis l'éditeur de tunnel (onglet/menu **Automation rules**, **Add rule**).
- Déclencheurs cités : Funnel step form subscribed (puis choix de la page), New sale, Tag added (le tag doit être ajouté après la création de la règle), Email link clicked (délai de 1 minute après le premier clic).
- Autres déclencheurs/actions via l'API (tags, cours, ventes, formulaires de tunnel, fin de campagne, réservations, visites de page ; actions : ajouter/retirer tag, inscrire/révoquer un cours, désabonner d'une campagne, webhook, SMS) : H2323-how-to-create-a-public-api-key-on-systeme-io. La parité UI/API n'est pas démontrée. À VÉRIFIER.
- Actions citées ailleurs : Send email, Campaign (H154), Add a tag (H280), Send SMS (H4483).
- Conditions : aucune dans les règles (H140 n'en décrit pas) ; conditions disponibles dans les workflows (étape Décision).
- Limites : un déclencheur ne peut s'activer que 20 fois par contact ; à la 20e, le déclencheur est désactivé et règles/workflows sont désactivés pour ce contact ; historique des tâches conservé un mois. Plan Free : 1 règle d'automatisation ; Unlimited : illimitées (https://systeme.io/pricing). Valeurs Startup/Webinar : À VÉRIFIER.
- Cas : e-mail automatique à l'inscription (H280) : page d'inscription > Automation Rules > Add rule > Funnel step form subscribed > Send email > Save rule. Le bouton doit être « Submit form ». Menu "..." pour modifier/désactiver/supprimer.

## 4. Workflows

Source : H1542-workflow-feature.
- Déclencheurs (plusieurs possibles) : tags, inscription via tunnel/blog/site/boutique créateur, cours (inscription, fin de cours/module/leçon, pack), ventes (achat, annulation, échec de paiement d'abonnement), e-mail (ouverture, clic, fin de campagne), événements (rendez-vous agenda, inscription webinaire evergreen), communauté, visite de page.
- Étapes : Action, Décision (Oui/Non avec filtres sur champs, tags, activité e-mail, dates, état du contact), Délai (minutes/heures/jours ou date exacte jusqu'à un an avec fuseau).
- Actions : e-mail (ou e-mail à une adresse), abonner/désabonner campagne, SMS, tags, étape de pipeline, cours/packs (inscrire/révoquer), communauté, webhook, ligne Google Sheets.
- Libellés : « + Add a trigger », « (+) », menu "..." Activate / Deactivate / Share ; désactiver avec ou sans annulation des tâches planifiées. Workflows inactifs par défaut.
- Limites : aucun effet rétroactif ; changer une durée n'affecte que les nouveaux contacts ; historique un mois ; le partage ne transmet pas les déclencheurs « Blog page form subscribed » et « Creator store form subscribed », ni les actions Google Sheets et webhook. Différence formelle règles/workflows : non définie par les sources. Limite de workflows par plan : À VÉRIFIER.

## 5. SMS

Source : H4483-how-to-send-sms-messages-with-systeme-io.
- Prérequis : compte Twilio connecté (article 4477 non lu).
- SMS > SMS Templates > Create : nom, type d'expéditeur (Sender phone number, Alphanumeric Sender ID, Messaging Services), message (max 1600 caractères), substitutions. Automatisation via Rules ou Workflows (action Send SMS). SMS > Statistics : total envoyés, taux de livraison moyen, taux d'échec moyen, liste des messages.
- Un champ téléphone est nécessaire dans les formulaires. Coûts gérés par Twilio. Marketing : SMS à l'opt-in ou à l'abandon de panier (https://systeme.io/features) ; l'abandon de panier n'a pas été retrouvé comme déclencheur dans les articles lus. À VÉRIFIER.

## 6. Autres e-mails

- Expéditeur : confirmation de l'adresse (article 2070), SendGrid (134, 637), pied de page « Sent with systeme.io » (2008), délivrabilité (catégorie 3251) : non lus. Message générique : « Pourquoi mes e-mails ne sont-ils pas envoyés ? » (227) non lu.
