# Mailchimp dans Kolakisa — guide d'utilisation

**Marketing → Intégrations → Mailchimp** (réservé aux administrateurs de l'organisation).

## 1. Connexion (5 minutes)
1. Dans Mailchimp : *Compte → Extras → Clés d'API → Créer une clé*. Elle ressemble à `0123456789abcdef0123456789abcdef-us21`.
2. Dans Kolakisa, onglet **Connexion** : collez la clé, *Valider et enregistrer*. La clé est vérifiée **en direct** auprès de Mailchimp, puis stockée chiffrée. Le nom du compte s'affiche.
3. Une **première synchronisation complète** démarre seule : audiences, campagnes et statistiques sont lues.

Prérequis serveur : `ENCRYPTION_KEY` (voir `ENV_EXAMPLE.md`). Pour les webhooks en temps réel : `SITE_URL` en HTTPS.

## 2. Relier une audience à une liste Kolakisa
Onglet **Audiences** → *Lier* : une liste Kolakisa « Mailchimp — nom » est créée et liée. À la synchronisation suivante :
- les abonnés Mailchimp arrivent dans Kolakisa **avec leur preuve de consentement** ; les désinscrits et adresses invalides sont enregistrés comme tels ;
- les contacts de cette liste Kolakisa qui ont un consentement valide sont abonnés chez Mailchimp ;
- **Kolakisa reste maître du consentement** : une personne désinscrite chez Kolakisa n'est jamais réabonnée par Mailchimp.

## 3. Installer les webhooks (temps réel)
Onglet **Webhooks** → *Installer le webhook Kolakisa* (une audience à la fois). Mailchimp prévient alors Kolakisa à chaque inscription, désinscription, changement de profil, adresse invalide, changement d'adresse ou envoi de campagne. L'onglet affiche les événements reçus **en direct**, leur charge complète, et permet de **rejouer** un événement.

## 4. Fonctionnalités disponibles
| Onglet | Ce que vous pouvez faire |
|---|---|
| Vue d'ensemble | contacts, campagnes, taux d'ouverture moyen, revenus ; évolution des abonnés sur 30 jours ; **alertes** (rebonds ≥ 5 %, désabonnements ≥ 1 %, plaintes ≥ 0,1 % sur 7 jours) |
| Audiences | créer, modifier, supprimer ; statistiques et croissance ; **import CSV avec correspondance des colonnes** ; export CSV ; champs personnalisés, segments, tags, groupes d'intérêts |
| Contacts | tableau filtré par statut ; fiche (activité, tags, notes, modification) ; ajout ; **actions groupées** (désabonner, archiver, tagger) ; archivage et suppression définitive |
| Campagnes | **assistant en 5 étapes** (type : standard, texte brut, RSS, test A/B · destinataires, segment ou tag · paramètres · contenu HTML avec aperçu ordinateur/mobile · envoi immédiat, planifié ou brouillon) ; test, contrôle avant envoi, duplication, suppression ; pause/reprise RSS |
| Modèles | galerie (personnalisés, de base, galerie Mailchimp) ; éditeur HTML avec **aperçu en direct** ; création, duplication, suppression ; balises de fusion |
| Rapports | liste, **détail par campagne** (ouvertures, clics, rebonds, désabonnements, plaintes, domaines, localisation, produits, A/B), **comparaison** de 2 à 10 campagnes, export CSV, impression / PDF |
| Automatisations | liste, démarrer/arrêter, e-mails de la séquence, file d'attente, **ajouter/retirer un contact**, déclencher une étape de parcours client |
| Boutiques | boutiques, produits, commandes, clients (e-commerce Mailchimp) |
| Pages | pages de destination : créer, publier, dépublier, rapport |
| Compte | informations, domaines d'expédition (vérification), applications autorisées, activité |
| Transactionnel | clé Mandrill, envoi d'un e-mail de service, suivi des messages, expéditeurs et domaines, modèles, webhooks, liste de rejet et d'autorisation |
| Journal | derniers appels vers Mailchimp |

Le détail de chaque opération (endpoint, paramètres, exemples) est dans `MAILCHIMP_DOC.md`.

## 5. Démarrage rapide — première campagne
1. *Audiences* : vérifiez qu'une audience existe (sinon *Créer une audience*).
2. *Campagnes → Nouvelle campagne* : suivez les 5 étapes ; à la dernière, **envoyez-vous un test** puis choisissez *Enregistrer en brouillon*.
3. Dans la liste : *Vérifier* (liste de contrôle de Mailchimp), puis *Planifier* ou *Envoyer*. L'envoi demande une confirmation nommée et ne peut pas être annulé.

## 6. Dépannage
| Message ou symptôme | Cause et solution |
|---|---|
| « La clé d'API Mailchimp est refusée » | clé révoquée, mal copiée, ou d'un autre compte. Générez-en une nouvelle (*Compte → Extras → Clés d'API*) et enregistrez-la. |
| « Format de clé invalide » | la clé doit finir par le centre de données (`-us21`). |
| « ENCRYPTION_KEY est absente ou invalide » | l'hébergeur doit définir `ENCRYPTION_KEY` (32 octets) ; sans elle, rien ne peut être enregistré. |
| « Mailchimp limite le nombre de requêtes simultanées » | trop d'opérations en même temps ; Kolakisa réessaie seul. Si cela persiste, attendez quelques minutes. |
| « Mailchimp refuse de réabonner cette adresse » | la personne s'est désinscrite : elle doit se réinscrire elle-même (formulaire Mailchimp). Kolakisa ne contourne jamais ce choix. |
| « Adresse publique indisponible : SITE_URL » | définissez `SITE_URL` en HTTPS pour installer les webhooks ; la synchronisation horaire fonctionne sans. |
| Les événements n'arrivent pas | l'adresse a été régénérée (réinstallez le webhook) ; ou l'événement vient d'une action de l'API (volontairement exclue). Regardez l'onglet *Webhooks* et le *Journal*. |
| Synchronisation « partielle » | une audience a échoué : le message le dit dans l'onglet *Connexion* ; les autres ont été traitées. Relancez après correction. |
| Un contact « conflit » | il est désinscrit ou supprimé chez Kolakisa mais abonné chez Mailchimp : son désabonnement est renvoyé à Mailchimp (comptabilisé dans « Conflits résolus »). |
| Rapport vide pour une campagne récente | Mailchimp met quelques minutes à produire les chiffres ; relancez la synchronisation. |
| Transactionnel : « Mandrill est refusée » | la clé Transactional est distincte de la clé Marketing ; module complémentaire payant à activer chez Mailchimp. |

## 7. Avant de passer en production
1. Faire tourner `TEST_RESULTS.md` § « Recette avec un vrai compte » (connexion, synchronisation d'une audience de test, campagne de test à une adresse interne, webhook) : **cette recette n'a pas pu être faite** faute de clé réelle.
2. Vérifier que `SITE_URL` est en HTTPS et que `ENCRYPTION_KEY` est sauvegardée (perdue, les clés enregistrées sont illisibles).
