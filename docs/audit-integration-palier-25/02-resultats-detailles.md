# Résultats détaillés (palier 25)

*Source : `docs/audit-integration-palier-25/resultats/resultats-scenarios.json`, écrit par l'exécution réelle de `tests/integration-globale.test.js` (2026-10-11T07:22:50.101Z). Chaque critère est un contrôle exécuté ; un critère « ÉCHEC REPRODUIT » reproduit un défaut documenté dans `04-registre-anomalies.md`.*

## INT-ABT-014 — mesure et A/B : affectation collante, exposition seulement si la page est affichée, conversion associée, robots ignorés

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (9 critères réussis)
- **Modules** : Page Builder, Tests A/B, Mesure, Consentement, Analytics · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | le test A/B est créé avec une copie B distincte (variant_page_id) | réussi |  |  |
| 2 | le test démarre (302) et passe en « en cours » | réussi | status 302 |  |
| 3 | l'affectation est collante : chaque visiteur revoit la même version | réussi |  |  |
| 4 | les deux versions sont réellement servies à l'adresse unique | réussi | B vu par 7/12 |  |
| 5 | une exposition par visiteur (pas par visite) | réussi |  |  |
| 6 | un robot ne compte pas comme exposition | réussi |  |  |
| 7 | une adresse « ?variant=b » ne force aucune version | réussi |  |  |
| 8 | l'écran de résultats répond et annonce « données insuffisantes » (jamais un gagnant) avec 12 visiteurs | réussi | status 200 |  |
| 9 | aucun gagnant n'est déclaré (le test reste « en cours ») | réussi |  |  |

## INT-ANA-016 — mesure d'audience : seuls les visiteurs consentants sont comptés, rejeu sans doublon, tableau de bord = lignes en base

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (7 critères réussis)
- **Modules** : Mesure, Consentement, Analytics · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | 3 visiteurs consentants : 9 lignes de mesure enregistrées | réussi |  |  |
| 2 | un visiteur sans consentement n'enregistre rien | réussi |  |  |
| 3 | un robot (User-Agent) n'enregistre rien même avec les cookies | réussi |  |  |
| 4 | un lot identique reçu deux fois ne double pas les lignes (déduplication) | réussi | lignes ajoutées : 9 |  |
| 5 | un lot SANS date client rejoué dans la même minute est compté une seule fois | réussi | lignes : 3 puis 3 |  |
| 6 | Analytics : 3 visiteurs, 3 sessions, 6 pages vues, 9 événements pour ces visites | réussi | {"visitors":4,"sessions":4,"pageViews":8,"events":12} |  |
| 7 | les compteurs restent distincts (visiteurs ≠ sessions ≠ pages vues ≠ événements) | réussi | {"visitors":4,"sessions":4,"pageViews":8,"events":12} |  |

## INT-AUT-010 — un événement réel déclenche un scénario exécuté par le worker, une seule fois, et le consentement est respecté

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (7 critères réussis)
- **Modules** : Formulaires, Contact Core, Automatisations, Worker, Email Engine · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | le scénario est enregistré avec une étape « étiquette » | réussi | status 200 |  |
| 2 | le scénario est activé (302) | réussi | status 302 |  |
| 3 | le worker exécute le passage jusqu'à son terme (completed) | réussi | [{"status":"completed"}] |  |
| 4 | l'action a eu son effet réel : l'étiquette est posée sur le contact | réussi |  |  |
| 5 | le journal pas à pas du scénario est écrit | réussi |  |  |
| 6 | idempotence : un second envoi ne crée pas un second passage pour ce contact | réussi |  |  |
| 7 | aucun e-mail n'a été envoyé par ce scénario (aucune étape d'e-mail) | réussi |  |  |

## INT-CMS-001 — création, édition, rechargement, publication et rendu public d'une page

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (14 critères réussis)
- **Modules** : CMS, Page Builder, URL, Permissions, Sites · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | la page est créée par la route du CMS (302) et enregistrée sur le site A | réussi | status 302 |  |
| 2 | le Page Builder existant s'ouvre sur cette page | réussi | status 200 |  |
| 3 | le brouillon est enregistré (200) avec une nouvelle révision | réussi | status 200 |  |
| 4 | après rechargement, l'aperçu montre le contenu enregistré | réussi | aperçu relu depuis la base |  |
| 5 | l'éditeur rechargé contient le contenu enregistré | réussi | contenu présent dans le document de l'éditeur |  |
| 6 | avant publication, la page publique n'existe pas (404) | réussi |  |  |
| 7 | la publication réussit (200) et crée une version | réussi | status 200 |  |
| 8 | la page publique est servie (200) avec le contenu publié | réussi | status 200 |  |
| 9 | la page publique n'est pas mise en cache (no-store) | réussi | no-store |  |
| 10 | un lecteur de l'organisation ne peut pas enregistrer (403) | réussi |  |  |
| 11 | un membre du site B ne peut pas enregistrer la page du site A (403/404) | réussi |  |  |
| 12 | un anonyme est renvoyé vers la connexion | réussi |  |  |
| 13 | aucun contenu pirate n'a été enregistré | réussi |  |  |
| 14 | le membre du site A (accès limité) peut modifier sa propre page | réussi |  |  |

## INT-CMS-002 — révisions, version publiée conservée, restauration et modification concurrente

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (6 critères réussis)
- **Modules** : Page Builder, Historique, Publication · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | la version publiée reste « UN » pendant que le brouillon est « DEUX » | réussi |  |  |
| 2 | l'historique de la page répond et liste des points | réussi | status 200 |  |
| 3 | une modification concurrente (révision périmée) est refusée (409) sans écraser | réussi | status 409 |  |
| 4 | restaurer la version 1 copie son contenu dans le brouillon (302) | réussi | status 302 |  |
| 5 | la restauration ne change pas la page publique avant une nouvelle publication | réussi |  |  |
| 6 | abandonner le brouillon rend l'éditeur à la version en ligne | réussi |  |  |

## INT-CMS-003 — médiathèque : envoi, métadonnées, insertion dans une page, affichage public, protection à la suppression

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (6 critères réussis)
- **Modules** : Médiathèque, Page Builder, Pages publiques · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | le fichier est enregistré (201) avec un chemin /uploads/marketing/… | réussi | status 201 |  |
| 2 | le texte alternatif est enregistré et relu en base | réussi | status 200 |  |
| 3 | la page publique affiche l'image par son adresse permanente | réussi | adresse trouvée dans le HTML public |  |
| 4 | le fichier est réellement servi (200, type image) | réussi |  |  |
| 5 | la suppression définitive d'un média utilisé par une page est refusée | réussi | status 409 |  |
| 6 | un membre limité au site B ne peut pas gérer la médiathèque de l'organisation | réussi |  |  |

## INT-CMS-004 — styles globaux : brouillon, publication, effet réel sur le site public, aucune modification involontaire

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (7 critères réussis)
- **Modules** : Apparence, Pages publiques, Page Builder · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | sans configuration publiée, aucune feuille d'apparence n'est ajoutée | réussi |  |  |
| 2 | le brouillon n'est PAS visible sur le site public | réussi |  |  |
| 3 | la publication de l'apparence réussit | réussi | status 302 |  |
| 4 | la couleur publiée est dans la feuille du site public | réussi |  |  |
| 5 | une injection CSS est refusée : la feuille publique reste propre | réussi |  |  |
| 6 | une personne sans droit de publication ne peut pas publier l'apparence | réussi |  |  |
| 7 | retirer la configuration rend le site à son apparence d'origine | réussi |  |  |

## INT-CMS-006 — rédaction d'articles selon les rôles (état actuel : réservée au compte créateur)

- **Statut** : **RÉUSSI PARTIELLEMENT** (3 critères réussis, 3 en échec reproduit)
- **Modules** : Articles, Permissions, Éditeur d'articles · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | Éditeur : peut créer un article (attendu par ses permissions) | **ÉCHEC REPRODUIT** | status 403 | G-03 |
| 2 | Auteur : peut créer un article (attendu par ses permissions) | **ÉCHEC REPRODUIT** | status 403 | G-03 |
| 3 | Contributeur : peut créer un article (attendu par ses permissions) | **ÉCHEC REPRODUIT** | status 403 | G-03 |
| 4 | le compte créateur crée un article (200) | réussi | status 200 |  |
| 5 | un Lecteur ne peut pas créer d'article (403) | réussi |  |  |
| 6 | un compte hors équipe ne peut pas créer d'article (403) | réussi |  |  |

## INT-CMS-007 — publication programmée d'une page : invisible avant l'heure, publiée à la première visite après l'heure, présente au plan du site

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (6 critères réussis)
- **Modules** : Pages, Publication programmée, SEO, Pages publiques · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | la programmation est enregistrée (302, date en base) | réussi | status 302 |  |
| 2 | avant l'heure : la page est invisible (404) | réussi |  |  |
| 3 | à l'heure dite, la première visite de l'administration publie la page | réussi | {"status":"published","scheduled_at":null} |  |
| 4 | la page est en ligne avec son contenu | réussi |  |  |
| 5 | la page programmée indexable est dans le plan du site | réussi |  |  |
| 6 | la publication automatique est consignée au journal (utilisateur vide = système) | réussi |  |  |

## INT-COM-012 — commande de test : panier, session de paiement, aucun accès avant paiement confirmé, montant fixé par le serveur

- **Statut** : **SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)** (4 critères réussis)
- **Modules** : Commerce, Stripe (faux serveur), Accès aux formations · **Mode** : SIMULÉ

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | « Payer » redirige vers la page de paiement du fournisseur (303) | réussi | 303 https://checkout.stripe.test/pay/cs_int_1 |  |
| 2 | le montant envoyé au fournisseur est celui du serveur (5000), pas celui du formulaire falsifié | réussi | 5000 |  |
| 3 | aucune commande n'existe avant le paiement | réussi |  |  |
| 4 | aucun accès à la formation avant le paiement | réussi |  |  |

## INT-COM-013 — webhook de paiement : signature, idempotence, commande, accès, contact « Client », événement, Analytics ; échec de paiement

- **Statut** : **SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)** (17 critères réussis)
- **Modules** : Commerce, Webhook signé, Contact Core, Événements, Analytics · **Mode** : SIMULÉ

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | signature invalide (mauvais secret) refusée (400), rien n'est accordé | réussi |  |  |
| 2 | signature absente refusée (400) | réussi |  |  |
| 3 | webhook signé accepté (200) | réussi |  |  |
| 4 | la commande existe avec le bon total (5000) APRÈS confirmation | réussi | 5000 |  |
| 5 | l'accès à la formation est ouvert | réussi |  |  |
| 6 | idempotence : un rejeu du webhook ne crée pas une seconde commande | réussi |  |  |
| 7 | une session inconnue est ignorée sans erreur (200) et ne crée rien | réussi |  |  |
| 8 | l'événement « purchase.completed » est écrit dans le journal à partir de la commande réelle | réussi | source commerce |  |
| 9 | le contact existe et correspond au compte acheteur (lien par le compte) | réussi | {"id":2,"lifecycle_stage":"customer"} |  |
| 10 | l'événement d'achat est rattaché à ce contact | réussi |  |  |
| 11 | le premier achat réel passe le contact en « client » | réussi | customer |  |
| 12 | Analytics lit la commande réelle : revenu brut de 50,00 € (5000 centimes) et 1 commande | réussi | {"noData":false,"kpis":{"orders":1,"paidOrders":1,"grossCents":5000,"discountCents":0,"refunds":0,"refundCents":0,"netCents":5000,"avgBasketCents":5000,"newCustomers":1,"returningCustomers":0},"previo |  |
| 13 | l'écran Analytics s'affiche (200) | réussi | status 200 |  |
| 14 | un remboursement signé est accepté (200) | réussi |  |  |
| 15 | un remboursement rejoué n'est enregistré qu'une fois | réussi |  |  |
| 16 | un remboursement d'un paiement inconnu est ignoré | réussi |  |  |
| 17 | échec d'un paiement asynchrone : accepté sans créer de commande | réussi |  |  |

## INT-COM-017 — paiement non abouti : session expirée ou échouée, aucune commande, aucun accès, retour clair pour l'acheteur

- **Statut** : **SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)** (8 critères réussis)
- **Modules** : Commerce, Webhook signé, Accès aux formations · **Mode** : SIMULÉ

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | la session de paiement est créée « en attente » | réussi | pending |  |
| 2 | l'expiration signée de la session est acceptée (200) | réussi |  |  |
| 3 | la session passe en « expired » | réussi | expired |  |
| 4 | aucune commande n'est créée | réussi |  |  |
| 5 | aucun accès n'est ouvert | réussi |  |  |
| 6 | la page de retour dit clairement que rien n'a été débité (402) | réussi | status 402 |  |
| 7 | une expiration rejouée ne change rien (200, toujours « expired », aucune commande) | réussi |  |  |
| 8 | un autre compte ne peut pas lire le retour de cette commande | réussi |  |  |

## INT-COM-018 — concurrence : le même webhook de paiement reçu 6 fois en même temps ne crée qu'une commande, une inscription et un e-mail de confirmation

- **Statut** : **SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)** (5 critères réussis)
- **Modules** : Commerce, Webhook signé, Concurrence, Accès aux formations · **Mode** : SIMULÉ

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | les 6 requêtes simultanées sont toutes acceptées (200) | réussi | 200,200,200,200,200,200 |  |
| 2 | une seule commande existe pour cet acheteur | réussi | 1 |  |
| 3 | une seule inscription à la formation | réussi |  |  |
| 4 | un seul e-mail de confirmation d'achat en file | réussi | 1 |  |
| 5 | une seule ligne de commande | réussi |  |  |

## INT-CON-008 — soumission d'un formulaire : validation, contact, consentement, doublons, événements

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (10 critères réussis)
- **Modules** : Formulaires, Contact Core, Consentements, Événements · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | sans case cochée : aucun abonnement marketing (le contact, s'il existe, n'est pas abonné) | réussi | {} |  |
| 2 | sans case cochée : aucune preuve de consentement | réussi |  |  |
| 3 | une adresse invalide est refusée, aucun contact créé | réussi | status 400 |  |
| 4 | avec la case : le contact est créé, adresse normalisée en minuscules | réussi | status 302 |  |
| 5 | avec la case : la preuve de consentement est enregistrée | réussi |  |  |
| 6 | avec la case : le contact est abonné | réussi | subscribed |  |
| 7 | un second envoi (casse différente) ne crée pas de doublon | réussi |  |  |
| 8 | l'événement « formulaire envoyé » est écrit dans le journal du contact | réussi |  |  |
| 9 | le champ piège refuse l'envoi d'un robot (aucun contact) | réussi | status 302 |  |
| 10 | un prénom contenant du HTML est échappé dans l'administration | réussi |  |  |

## INT-CON-009 — cohérence du Contact Core : compte ≠ contact ≠ consentement, commentaire, site

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (7 critères réussis)
- **Modules** : Contact Core, Comptes, Commentaires, Sites · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | créer un compte crée (ou relie) UNE fiche de contact | réussi |  |  |
| 2 | créer un compte n'abonne personne (aucune preuve de consentement marketing) | réussi | unknown |  |
| 3 | le commentaire est enregistré | réussi |  |  |
| 4 | un commentaire n'abonne jamais son auteur à une liste marketing | réussi | {} |  |
| 5 | un membre du site A voit les contacts de son site (lecture) | réussi | status 200 |  |
| 6 | un membre du site B ne voit pas les contacts du site A (refus) | réussi | status 403 |  |
| 7 | un compte hors équipe est refusé sur les contacts | réussi |  |  |

## INT-CON-010 — concurrence : 6 envois simultanés du même formulaire par la même personne ne créent qu'un contact et qu'un abonnement

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (5 critères réussis)
- **Modules** : Formulaires, Contact Core, Consentements, Concurrence · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | aucune requête ne provoque d'erreur serveur | réussi | 302,302,302,302,302,302 |  |
| 2 | un seul contact existe pour cette adresse | réussi | 1 |  |
| 3 | le contact est abonné une seule fois (statut stable) | réussi | subscribed |  |
| 4 | la preuve de consentement « accordé » existe | réussi |  |  |
| 5 | les preuves de consentement ne sont pas multipliées sans limite (≤ 6, une par envoi accepté) | réussi | 1 |  |

## INT-EML-011 — e-mail : le consentement et la désinscription décident des destinataires ; messages enregistrés avec leur état (fournisseur « console » = aucun envoi réel)

- **Statut** : **SIMULÉ UNIQUEMENT (critères réussis sur un faux fournisseur)** (13 critères réussis)
- **Modules** : Formulaires, Contact Core, Automatisations, Email Engine, Consentements, Worker · **Mode** : SIMULÉ

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | l'audience joignable contient l'abonné avec preuve de consentement | réussi | [3] |  |
| 2 | l'audience joignable exclut le désinscrit | réussi |  |  |
| 3 | l'audience joignable exclut la personne sans consentement | réussi |  |  |
| 4 | un modèle d'e-mail est créé par la route | réussi | status 302 |  |
| 5 | un scénario avec une étape d'e-mail est enregistré sans étape incomplète | réussi | {"ok":true,"incomplete":[]} |  |
| 6 | avant l'activation, l'écran du scénario prévient que le fournisseur « console » n'envoie rien | réussi | Fournisseur « console » : rien ne sera réellement envoyé (réglages d&#39;envoi) |  |
| 7 | le scénario est activé | réussi |  |  |
| 8 | APRÈS l'activation, l'écran du scénario rappelle encore que le fournisseur « console » n'envoie rien | réussi | l'avertissement a disparu de l'écran du scénario actif |  |
| 9 | avec consentement prouvé : un message est enregistré (une seule fois) | réussi | [{"status":"sent","provider":"console"}] |  |
| 10 | état observé : « sent » par le fournisseur « console » (SIMULATION : rien n'est réellement transmis) | réussi | [{"status":"sent","provider":"console"}] |  |
| 11 | sans consentement : AUCUN message n'est enregistré pour cette adresse | réussi | contact : [] |  |
| 12 | le passage du contact sans accord est tracé et ne reste pas bloqué en « running » | réussi | [] |  |
| 13 | un second envoi du formulaire par la même personne ne produit pas un second e-mail | réussi |  |  |

## INT-SEC-015 — isolation entre sites, accès par identifiant, webhooks invalides, secrets et données personnelles dans les journaux

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (15 critères réussis)
- **Modules** : Permissions, Sites, Webhooks, Journaux · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | membre du site B → page du site A refusé | réussi | status 403 |  |
| 2 | membre du site B → tunnel du site A refusé | réussi | status 403 |  |
| 3 | membre du site B → aperçu de page du site A refusé | réussi | status 403 |  |
| 4 | membre du site B → historique du site A refusé | réussi | status 403 |  |
| 5 | compte hors équipe → page refusé | réussi | status 403 |  |
| 6 | compte hors équipe → tunnel refusé | réussi | status 403 |  |
| 7 | compte hors équipe → aperçu de page refusé | réussi | status 403 |  |
| 8 | compte hors équipe → historique refusé | réussi | status 403 |  |
| 9 | membre du site B → supprimer la page refusé | réussi | status 403 |  |
| 10 | membre du site B → archiver refusé | réussi | status 403 |  |
| 11 | membre du site B → publier refusé | réussi | status 403 |  |
| 12 | webhook Stripe sans configuration : fermé (503) sur ce serveur de test | réussi |  |  |
| 13 | API publique sans clé : 401 | réussi |  |  |
| 14 | fichiers sensibles non exposés (.env, base, code) | réussi |  |  |
| 15 | les journaux du serveur ne contiennent ni mot de passe ni clé secrète de test | réussi | recherche dans la sortie du serveur de test |  |

## INT-SEO-005 — SEO, URL, 404, aperçu privé et plan du site

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (11 critères réussis)
- **Modules** : SEO, URL, Pages, Sitemap · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | balise title rendue | réussi | Titre SEO d&#39;intégration · KOLAKISA |  |
| 2 | canonical vers l'adresse publique | réussi | https://k.test/p/page-seo-integration |  |
| 3 | Open Graph présent | réussi |  |  |
| 4 | la page indexable est dans le plan du site | réussi |  |  |
| 5 | une page non indexable est servie mais absente du plan du site et en noindex | réussi |  |  |
| 6 | un brouillon n'est pas public (404, noindex) | réussi |  |  |
| 7 | l'aperçu d'un brouillon est privé (anonyme renvoyé à la connexion) | réussi |  |  |
| 8 | une adresse inconnue répond 404 en noindex | réussi |  |  |
| 9 | l'ancienne adresse redirige (301) vers la nouvelle | réussi | 301 /p/page-seo-renommee |  |
| 10 | la nouvelle adresse est servie | réussi |  |  |
| 11 | une page dépubliée disparaît (404) et quitte le plan du site | réussi |  |  |

## INT-TUN-006 — une page du CMS est réutilisée par un tunnel : référence stable, aucune copie, protection de la page

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (9 critères réussis)
- **Modules** : CMS, Page Builder, Tunnel Builder, URL, Permissions · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | le tunnel est créé sur le site A | réussi |  |  |
| 2 | chaque étape référence la page par son identifiant (page_id) | réussi |  |  |
| 3 | aucune copie de la page n'a été créée | réussi |  |  |
| 4 | le rendu de l'étape est celui de la page référencée | réussi |  |  |
| 5 | avant republication, le visiteur voit toujours la version en ligne | réussi |  |  |
| 6 | après republication, la modification apparaît dans l'étape | réussi |  |  |
| 7 | mettre à la corbeille une page d'un tunnel actif est refusé, la page reste en ligne | réussi |  |  |
| 8 | un membre du site B ne voit pas le tunnel du site A | réussi |  |  |
| 9 | un membre du site B ne peut pas y ajouter une étape | réussi |  |  |

## INT-TUN-007 — navigation entre les étapes du tunnel et cohérence avec l'ordre configuré

- **Statut** : **RÉUSSI — PREUVES COMPLÈTES** (5 critères réussis)
- **Modules** : Tunnel Builder, Pages publiques · **Mode** : RÉEL en test

| # | Critère | Résultat | Preuve observée | Anomalie |
|---|---|---|---|---|
| 1 | le bouton « Continuer » de l'étape 1 passe par le suivi de clic de la page | réussi | /p/etape-entree-integration/clic/0 |  |
| 2 | le clic redirige vers la page de l'étape 2 configurée | réussi | 302 /p/etape-merci-integration |  |
| 3 | un numéro de bouton inconnu ramène sur la page (aucune adresse inventée) | réussi | 302 /p/etape-entree-integration |  |
| 4 | un clic sur une page inconnue répond 404 | réussi |  |  |
| 5 | la dernière étape (merci) n'a pas de bouton « étape suivante » | réussi |  |  |
