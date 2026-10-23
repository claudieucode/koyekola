# KOLAKISA — Paramètres → Écriture

Référence : l'écran « Réglages d'écriture » de WordPress (capture fournie). Ce document décrit le comportement de référence, l'audit de Kolakisa, les décisions et l'état **réel** de la livraison.

## 1. Référence WordPress (comportement natif)

| Réglage | Comportement natif | Remarque |
|---|---|---|
| Catégorie par défaut des articles | Option `default_category` : catégorie attribuée à un nouvel article quand aucune n'est choisie ; sinon « Non classé ». Non rétroactive. | Une catégorie supprimée retombe sur « Non classé ». |
| Format par défaut des articles | Option `default_post_format` (standard, image, galerie, vidéo, audio, citation, lien…), seulement si le thème déclare `post-formats`. | Dépend du thème, pas du cœur. |
| Publier par e-mail | Relève un compte POP3 (`mailserver_url/port/login/pass`), publie **tout message reçu** ; appelé par `wp-mail.php` (cron externe). | Fonction historique, retirée de l'écran par défaut depuis WordPress 5.x ; sécurité faible (adresse secrète = seule authentification, POP3 sans chiffrement par défaut). |
| Catégorie par défaut des articles reçus par e-mail | Option `default_email_category`. | Lié à la fonction précédente. |
| Services de mise à jour | Option `ping_sites` : URL de services « weblogUpdates.ping » notifiés à la **première publication** (pas à chaque enregistrement). Défaut : `rpc.pingomatic.com`. | Service historique ; très peu de moteurs l'exploitent aujourd'hui et il attire du spam. Les moteurs actuels s'appuient sur le plan du site (sitemap) et IndexNow. |
| Permissions | `manage_options`. | |
| Enregistrement | Option par option, `sanitize_option`. | |

## 2. Audit de Kolakisa (avant ce lot)

| Fonction | État | Constat |
|---|---|---|
| Rubrique « Écriture » | **Absente** | Aucun groupe dans le moteur de réglages (`src/services/settings`). |
| Catégorie par défaut | **Absente** | Un article naît sans catégorie ; aucune valeur de repli. |
| Formats d'article | **Absents (modèle différent)** | Un article est un texte riche (`content_format` = html/markdown est un format de **stockage**, pas un format éditorial). Rien à sélectionner. |
| Publication par e-mail | **Absente** | Seul `nodemailer` (envoi) est installé ; aucun client POP3/IMAP ni analyseur MIME. |
| Notification de mise à jour | **Absente** | Aucun ping, aucun IndexNow. |
| Réutilisable | **Oui** | Moteur de réglages (permissions, confirmation des réglages sensibles, journal d'activité), isolation par site (`mk_content_sites`), stockage `mk_settings`, tâches d'arrière-plan par minuterie, triggers SQL interdisant une relation entre contenus de sites différents. |

## 3. Décisions

1. **Catégorie par défaut : implémentée**, par site (principal compris). Stockée dans `mk_settings` (`writing.<main|site_N>.default_category`). Appliquée à la création d'un article **sans aucune catégorie choisie** (formulaire de l'éditeur, création rapide du CMS). L'éditeur coche aussi la catégorie d'avance pour un nouvel article. Non rétroactive. Une catégorie supprimée ou d'un autre site est ignorée : l'article reste sans catégorie (comportement antérieur).
2. **Format par défaut : non proposé.** Aucun format réel n'existe ; en inventer reviendrait à créer un réglage sans effet. L'écran l'explique.
3. **Publication par e-mail : non implémentée, et non simulée.** Elle exige un client POP3/IMAP chiffré, un analyseur MIME sûr, une authentification de l'expéditeur (SPF/DKIM ou jeton signé, pas une adresse secrète), la validation du HTML et des pièces jointes, la déduplication et une file de modération. Aucune de ces briques n'est installée. Voies réalistes pour plus tard : (a) un **webhook entrant** d'un service de réception (Mailgun/Postmark/SendGrid) signé, créant des **brouillons** ; (b) un client IMAP (`imapflow`) + `mailparser` avec compte dédié, vérification DKIM, brouillon obligatoire. Par conséquent, **pas de « catégorie par défaut des articles reçus par e-mail »** (réglage sans effet). L'écran affiche un état explicatif.
4. **Notifications de publication : implémentées** (protocole `weblogUpdates.ping`, XML-RPC), par site :
   - réglage **sensible** (permission `settings.sensitive` + confirmation) : activation et liste des destinations ;
   - **aucune destination préremplie** (les anciennes adresses de WordPress ne sont pas considérées comme fiables) ;
   - adresses **https** seulement, sans identifiants, sans IP privée littérale, 5 au plus, dédoublonnées ;
   - à l'envoi, le nom d'hôte est résolu et **refusé s'il pointe vers une adresse privée** (SSRF) ; pas de suivi de redirection ; délai d'attente 8 s ;
   - déclenchement : **première publication seulement**, quel que soit le chemin (publication directe, éditeur, programmation), jamais à l'enregistrement ; les articles publiés avant l'activation ou depuis plus de 7 jours ne sont pas notifiés ; un brouillon n'est jamais notifié ;
   - arrière-plan : minuterie du serveur (60 s) + déclenchement immédiat à la publication ; **au plus 3 essais** avec délais croissants (0 s, 2 min, 15 min) ; une destination retirée ou une désactivation arrête les envois en attente ;
   - **l'échec n'empêche jamais la publication** ; journal consultable dans l'écran (table `cms_ping_log`, une ligne par article et destination : pas de doublon) ;
   - le contenu envoyé se limite au nom et à l'adresse publique du site (aucun secret).
5. **Options complémentaires** : aucune ajoutée. Les autres valeurs d'écriture existent déjà ailleurs et n'ont pas été dupliquées : commentaires ouverts par défaut (Paramètres → Commentaires), médias (Paramètres → Médias), SEO (Paramètres → SEO), adresses (Permaliens).
6. **IndexNow** (notification des moteurs à la publication) est la voie moderne ; elle n'a pas été ajoutée ici (nécessite une clé hébergée à la racine du site et un choix produit) — à décider.

## 4. Où est le code

- `src/services/writing.js` : stockage par site, catégorie par défaut, validation des destinations, file et envoi des notifications, journal.
- `src/services/settings/index.js` : groupe « Écriture » (3 réglages), type `urllist`.
- `src/marketing/web/settings.js`, `views/marketing/settings-group.ejs` : adresse `/parametres/ecriture`, panneaux d'information et journal.
- `src/marketing/web/cmsNav.js` : entrée « Écriture » dans Paramètres (principal et espace d'un site).
- Application : `src/routes/blog.js` (création + case cochée d'avance), `src/marketing/web/articles.js` (création rapide), `src/services/blog.js` (déclenchement à la publication), `server.js` (minuterie).
- Tests : `tests/ecriture-reglages.test.js`.

## 5. Limites connues

- Publication par e-mail et format d'article : absents (voir ci-dessus).
- Les services externes n'ont pas été contactés pour de vrai : les tests utilisent un serveur local et une exception de test (`WRITING_PING_ALLOW_PRIVATE`, ignorée hors `NODE_ENV=test`).
- La création d'articles par import (Outils → Importer) n'applique pas la catégorie par défaut : le fichier importé apporte ses propres catégories.
- Aucune migration destructive : une table ajoutée (`cms_ping_log`, créée si absente) ; retour arrière : la supprimer et effacer les clés `writing.%` de `mk_settings`.
