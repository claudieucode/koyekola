# Automatisations et pont KOLAKISA — guide, garanties et limites (jalon M4, éditeur graphique phase 1)

## Comment ça marche
1. **Le pont** lit régulièrement (toutes les 30 s, worker actif) les tables du site — comptes, commandes, inscriptions, leçons terminées, avis, favoris — et enregistre des **événements** (`lms.user_registered`, `lms.order_completed`, `lms.course_enrolled`, `lms.lesson_completed`, `lms.course_completed` (dérivé : toutes les leçons faites), `lms.review_posted`, `lms.favorite_added`). **Aucune route du LMS n'est modifiée** : le pont ne fait que lire.
2. **Un scénario** = un déclencheur (un événement, avec un filtre facultatif : telle formation, telle étiquette…) + des **étapes** dans l'ordre.
3. **Le moteur** fait entrer un contact dans les scénarios actifs qui correspondent, puis exécute les étapes ; une attente est une **date de réveil en base** (rien ne « dort » en mémoire : tout survit à un redémarrage).

## Étapes disponibles
| Étape | Effet |
|---|---|
| Envoyer un e-mail | Un modèle du bon type (marketing ↔ marketing, transactionnel ↔ transactionnel) |
| Attendre | 1 minute à 1 an |
| Condition | Le contact correspond-il à un segment ? un e-mail précédent a-t-il été **ouvert** ou **cliqué** ? Chaque branche (« Si oui » / « Sinon ») va où vous voulez : l'étape suivante, la sortie du scénario, ou **une autre étape précise** (un vrai embranchement à deux chemins, ex. e-mail A si ouvert / e-mail B sinon) |
| Ajouter / retirer une étiquette, une liste | Idempotent ; **n'émet aucun événement** |
| Fin | Termine le passage |

### Embranchements (« Si oui » va à un e-mail, « Sinon » va à un autre)
Une condition peut envoyer vers **deux suites différentes**, pas seulement continuer ou sortir — utile pour un schéma
du type « Bienvenue → ouvert ? → e-mail A / e-mail B ». Point à connaître, découvert en le construisant : **le moteur
enchaîne les étapes sans s'arrêter tant qu'aucune n'attend**. Une condition placée juste après l'e-mail qu'elle
vérifie, sans attente entre les deux, s'évalue donc **dans le même passage que l'envoi** — avant que quiconque ait pu
matériellement l'ouvrir. Insérez toujours une **attente** (quelques heures à quelques jours, selon ce que vous
laissez comme délai de réponse) entre l'e-mail à vérifier et la condition qui le vérifie.
Dans l'éditeur graphique, la condition « ouvert »/« cliqué » désigne l'e-mail à vérifier en le choisissant sur le
canevas (menu déroulant dans le panneau latéral) — ce lien est une **référence stable**, pas un numéro : déplacer les
nœuds sur le canevas ne change jamais le sens de vos embranchements.

Variables utilisables dans les modèles d'un scénario : `{{event.course_title}}`, `{{event.order_total}}`, `{{event.order_id}}`, `{{event.lesson_title}}` et les deux liens `{{event.course_url}}` / `{{event.learn_url}}` (utilisables dans un bouton ou un lien).

## Garanties (couvertes par des tests)
- **L'historique ne déclenche jamais rien** : au premier passage, le pont se place à la fin de l'historique du site et n'émet rien. Seuls les événements **postérieurs** comptent (sinon vos anciens élèves recevraient un « bienvenue »).
- **Idempotence** : chaque événement a une clé (`order:12`, `enrollment:34`…) ; relire, redémarrer ou rejouer ne crée aucun doublon. Un contact entre **une seule fois** dans un scénario et reçoit **chaque e-mail une seule fois** ; rejouer une étape déjà envoyée n'envoie rien de plus.
- **Marketing** : consentement **revérifié avant chaque e-mail**. Un contact désinscrit, bloqué ou sans consentement **sort du scénario** ; il ne reçoit rien de plus.
- **Transactionnel** (bienvenue, confirmation…) : ignore la désinscription marketing (le message concerne le compte), **mais respecte la liste de suppression** (rebond dur, plainte), n'a **ni lien ni en-tête de désinscription** et n'est jamais bloqué par le plafond quotidien. Il ne donne **aucun consentement marketing**.
- **Pas de boucle** : les actions d'un scénario n'émettent aucun événement, donc ne peuvent déclencher aucun autre scénario.
- **Contenu figé à l'activation** : modifier un modèle ou un scénario ensuite ne change pas les passages en cours (un scénario actif se modifie après une pause ; il est alors réactivé après un nouveau contrôle).
- **Pannes** : échec temporaire → 3 essais espacés ; refus définitif → l'étape est consignée en échec et le scénario continue ; adresse refusée → suppression et sortie ; limitation du fournisseur → attente ; identifiants refusés → **le scénario est mis en pause** avec un message, sans rien perdre.
- **Sûreté de l'activation** : contrôle avant activation (modèle prêt, fournisseur, adresse https, clé de signature…), droit d'administrateur, activation refusée si une condition n'est pas remplie.

## Comment l'essayer sans risque
1. Réglages d'envoi : laissez le fournisseur **console** (rien ne part réellement).
2. Créez un modèle transactionnel « Bienvenue », un scénario « Bienvenue après inscription » (déclencheur : compte créé) avec une étape e-mail, activez-le.
3. Activez `MARKETING_WORKER=on`, inscrivez un compte de test : au bout de ~30 s (ou via **Événements → Synchroniser maintenant**), le message apparaît dans le journal du serveur.

## Limites connues
- **Éditeur graphique (canevas)** : glisser-déposer, zoom/ajuster à l'écran, panneau latéral par étape — voir
  `EMAIL_MARKETING_ARCHITECTURE.md` §27. Phase 1 seulement : pas encore de mini-carte, de rangement automatique, de
  bouton « + » directement sur une flèche, ni d'annuler/rétablir (glisser un nœud ou une connexion au mauvais endroit
  se corrige en le refaisant, pas avec Ctrl+Z). Toujours **pas de retour en arrière** dans le déroulé (relier une
  flèche vers une étape déjà passée créerait une boucle : refusé à l'enregistrement, message clair).
- **Un contact entre une seule fois** et reçoit chaque e-mail une seule fois : pas de « un e-mail par commande » (les deux e-mails du site — bienvenue après achat, notification de contact — **restent inchangés** et envoyés directement ; si vous créez un scénario équivalent, vous recevrez deux messages : décidez lequel garder).
- **Délai d'environ 30 s** entre une action sur le site et son événement (lecture périodique). Sans worker (`MARKETING_WORKER=off`), aucun événement n'est lu ni traité.
- **Événements manqués pendant qu'un scénario est en pause ou inactif** : non rattrapés à la reprise (seuls les passages déjà entrés reprennent).
- **Base réinitialisée** (`npm run seed`) : le pont se recale sans rien rejouer, mais les comptes recréés pendant l'opération peuvent être ignorés.
- Pas de déclencheurs « anniversaire », « inactivité », « panier abandonné » (le panier n'est pas enregistré par le site) ni de webhooks sortants à ce stade (jalon M5).
- Comme pour les campagnes : la délivrabilité ne peut pas être garantie ; SMTP ne remonte ni plaintes ni rebonds différés.
