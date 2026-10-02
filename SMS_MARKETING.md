# SMS marketing — guide, garanties et limites

Le SMS est un **canal séparé** de l'e-mail, comme chez Mailchimp : consentement distinct, statut distinct, liste de
numéros bloqués distincte. Fournisseur : **Twilio** (choix de l'utilisateur, 2026-10-02) ; pays visés : RD Congo,
Congo-Brazzaville, France/Europe, autres pays d'Afrique.

## Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 1. Fondations | numéros E.164, consentement SMS, numéros bloqués, Twilio + mode console, réglages, heures de silence, SMS de test | **fait** |
| 2. Campagnes SMS | onglet « SMS » (campagnes, abonnés, réglages), éditeur avec compteur en direct et aperçu téléphone, {{prenom}}/{{nom}}, liens courts suivis, mention STOP automatique, contrôle avant envoi + coût estimé, SMS de test, envoi immédiat ou programmé, pause/reprise/annulation, rapport | **fait** |
| 3. Désinscription | lien court « STOP SMS » (confirmation par bouton) ; réponse STOP/ARRET… et START/AIDE (webhook entrant Twilio signé) ; accusés de livraison | **fait** |
| 4. Audience | case SMS dans les formulaires et pop-ups, import avec preuve, filtre/segment « abonnés SMS » | à faire |
| 5. Automatisations | étape « Envoyer un SMS » dans le canevas | à faire |
| 6. Rapports | livrés / non livrés (rappels de statut Twilio), clics, désinscriptions, SMS facturés et coût | **fait** (rapport par campagne) |

Hors périmètre : MMS (Mailchimp ne les propose qu'aux États-Unis et au Canada), conversation bidirectionnelle.

## Mise en route (Twilio)

1. Créer un compte sur twilio.com ; noter **Account SID** (AC…) et **Auth Token** (page d'accueil de la console).
2. **Messaging → Settings → Geo permissions** : cocher les pays visés (RD Congo, Congo, France…). Sinon : erreur 21408.
3. Choisir l'expéditeur :
   - un **nom** (« KOYEKOLA », 11 caractères au plus, sans accent) : autorisé dans la plupart des pays visés, mais
     **personne ne peut y répondre** — la désinscription se fait par le lien court ajouté à chaque SMS ;
   - un **numéro Twilio** (+…) : la réponse STOP fonctionne en plus (phase 3) ;
   - un **Messaging Service** (MG…) : Twilio choisit l'expéditeur adapté à chaque pays.
4. KOYEKOLA → Marketing → Paramètres → **Réglages SMS** : fournisseur Twilio, expéditeur, identifiants, pays par défaut.
   `ENCRYPTION_KEY` doit être définie (le jeton est chiffré en base, jamais réaffiché).
5. **Envoyer un SMS de test** à votre propre numéro depuis la même page (texte fixe, 10 par heure).

## Règles garanties (tests : `tests/marketing-sms.test.js`)

- Un contact n'est joignable par SMS qu'avec une **preuve d'accord SMS** pour **ce numéro précis** (`mk_consents`,
  `purpose = 'sms'`, `channel_address` = numéro E.164). L'accord e-mail ne vaut jamais accord SMS, et inversement.
- Après un retrait, ni l'équipe, ni un import, ni l'API ne peuvent réabonner : seule la personne elle-même.
- Un numéro bloqué (STOP, numéro invalide, blocage manuel) ne redevient jamais joignable ; effacer puis recréer le
  contact n'y change rien. Seul un blocage manuel peut être levé.
- `isSmsSendable()` est la seule porte d'envoi ; `smsSendableSql()` en est la version en masse (test d'équivalence).
- **Heures de silence à l'heure du destinataire** (fuseau déduit de l'indicatif ; RD Congo = Kinshasa). France : en
  plus, ni dimanche ni jour férié (règle non désactivable).
- Coût : `smsLength()` compte les segments facturés (GSM-7 : 160 puis 153 ; un seul caractère hors GSM-7 comme ê, ô, ç
  → UCS-2 : 70 puis 67). `toGsm()` remplace ces caractères. Plafond de segments par SMS réglable (3 par défaut).
- Le numéro complet n'apparaît jamais dans les journaux ni dans les listes (`maskPhone` : « +243 •••• 5678 ») ; les
  erreurs Twilio sont classées par code, sans relayer leur texte.

## Limites connues

- Un seul fuseau par pays (la RD Congo en a deux : Lubumbashi reçoit les SMS une heure « plus tôt » qu'à Kinshasa).
- La table des pays (`src/marketing/sms/phone.js`) couvre l'Afrique centrale et de l'Ouest, le Maghreb, l'Europe
  francophone et le Canada ; ailleurs, un numéro au format « +… » reste accepté s'il respecte la norme E.164.
- Les prix Twilio varient selon le pays (≈ 0,23 $ par segment vers la RD Congo d'après les comparatifs publics de 2024) :
  vérifiez la grille officielle avant toute campagne.

## Adresses à déclarer chez Twilio (phase 2-3)

- **Rappels de statut** : ajoutés automatiquement à chaque SMS (`SITE_URL/webhooks/sms/twilio/<organisation>`) : rien à faire.
- **SMS entrants** (seulement avec un numéro Twilio comme expéditeur) : dans la console Twilio, sur le numéro →
  *Messaging → A message comes in* → Webhook `POST` `https://votre-site/webhooks/sms/twilio/1/entrant`.
  Mots-clés : STOP, ARRET, ANNULER, FIN, DESINSCRIRE… → numéro bloqué ; START → la personne se réinscrit elle-même ;
  AIDE/HELP → message d'information. Réponses sans accent (un seul SMS facturé).
- Toutes ces requêtes sont vérifiées par la signature `X-Twilio-Signature` (jeton du compte) ; `SITE_URL` doit être
  exactement l'adresse publique en https.

## Campagnes SMS : garanties (tests : `tests/marketing-sms-campagnes.test.js`)

- Accord SMS revérifié pour chaque message au moment de l'envoi ; heures de silence au fuseau du destinataire (un SMS
  de nuit attend le matin sans compter comme un essai) ; jamais de renvoi d'un SMS interrompu (payé deux fois sinon).
- Lancement : contrôle avant envoi vert + nombre de destinataires retapé + case « j'ai vérifié le coût ».
- Liens courts `/s/<code>` (8 caractères aléatoires) : la destination est lue en base (pas de redirection ouverte),
  les robots d'aperçu ne comptent pas, l'ouverture de la page STOP ne désinscrit pas (bouton obligatoire).
- Numéro refusé par l'opérateur (Twilio 21211/21614, 30005/30006) → bloqué « invalide » ; 21610 → bloqué « STOP » ;
  identifiants refusés → campagne en pause avec le message.
