# Inventaire Mailchimp - Partie B (délivrabilité, conformité, rapports, CRM, e-commerce, canaux, API, IA, comptes, facturation)

Date de collecte : 2026-10-26. Méthode : WebFetch/WebSearch sur mailchimp.com (help, developer, pricing). Les contenus ont été lus via un résumeur automatique et des extraits de recherche : les valeurs chiffrées sont à re-vérifier sur la page source avant de les figer en spécification. Texte reformulé, aucune copie longue.

## Légende des statuts

| Code | Sens |
|---|---|
| C | Confirmée par page officielle Mailchimp consultée |
| O | Confirmée mais dépendante d'une offre / d'un pays / d'une intégration |
| P | Observée dans des extraits de recherche officiels peu détaillés, ou page possiblement ancienne ; à vérifier |
| N | Non accessible / non vérifiée (voir section Lacunes) |

Offres (pricing/marketing, consulté) : Free (250 contacts, 500 envois/mois, max 250/jour, 1 utilisateur, 1 audience) ; Essentials (envois = 10x contacts, 3 utilisateurs/audiences, flux jusqu'à 4 étapes) ; Standard (12x contacts, 5 utilisateurs/audiences, jusqu'à 200 flux, IA générative, rapports personnalisés, contenu dynamique) ; Premium (15x contacts, utilisateurs/audiences illimités, SSO, support téléphone). Prix USD, susceptibles de changer.

## 1. Délivrabilité

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-001 | Vérification du domaine d'envoi | Domaines | Étape préalable : prouver l'accès à l'adresse/domaine (lien ou code par e-mail). N'améliore pas directement la délivrabilité. | Compte et facturation > Domaines | C | https://mailchimp.com/help/set-up-email-domain-authentication/ |
| MC-B-002 | Authentification DKIM (2 CNAME) | Domaines | Ajout de 2 enregistrements CNAME chez le fournisseur DNS. | Domaine possédé uniquement ; pas Gmail/Yahoo ; validation de quelques minutes à 48 h ; modifier les CNAME exige désactiver puis réauthentifier | C | idem |
| MC-B-003 | Publication DMARC (1 TXT `_dmarc`) | Domaines | Mailchimp guide la création de l'enregistrement TXT DMARC. | Requis par Gmail/Yahoo au-delà de 5 000 e-mails/24 h vers leurs adresses | C | idem |
| MC-B-004 | Authentification automatique via Entri | Domaines | Connexion au fournisseur DNS pour créer les enregistrements automatiquement (recommandé), sinon saisie manuelle. | Dépend du fournisseur DNS supporté par Entri | C | idem |
| MC-B-005 | Résolution / relance d'authentification | Domaines | Boutons Resolve / Restart authentication en cas d'échec. | - | C | idem |
| MC-B-006 | SPF | Domaines | Non mentionné dans l'article d'authentification consulté (Mailchimp ne demande que DKIM + DMARC). | Ne pas supposer un enregistrement SPF dédié sans autre source | N | idem (absence constatée) |
| MC-B-007 | Exigences expéditeurs Gmail/Yahoo | Conformité | L'article d'authentification confirme : authentification personnalisée exigée, DMARC requis > 5 000 e-mails/24 h. Page dédiée Mailchimp introuvable (404). Seuil de plaintes 0,3 % et List-Unsubscribe one-click proviennent de sources tierces. | Chiffres plaintes/one-click non confirmés côté Mailchimp | P | https://mailchimp.com/help/set-up-email-domain-authentication/ |
| MC-B-008 | Rebonds hard | Délivrabilité | Adresse non livrable ; l'adresse est retirée de l'audience (statut "cleaned"), consultable. Exception : hard bounce d'une adresse ayant interagi récemment, non retirée immédiatement, notée au profil. | Nombre de tentatives non précisé | C | https://mailchimp.com/help/about-bounces/ |
| MC-B-009 | Rebonds soft | Délivrabilité | Adresse reconnue mais livraison temporairement impossible (boîte pleine). Soft bounces répétés conduisent à "cleaned". | Seuil de répétition non lu | P | https://mailchimp.com/help/about-cleaned-contacts/ |
| MC-B-010 | Contacts nettoyés (cleaned) | Délivrabilité | Contacts en hard/soft bounces répétés ; non facturés. | - | C | https://mailchimp.com/help/mailchimp-pricing-tiers/ |
| MC-B-011 | Plaintes spam / abuse reports | Délivrabilité | Suivi des plaintes ; seuil au-delà duquel avertissement puis suspension. Endpoint API des abuse reports. | Seuils chiffrés non publiés (0,05 % cité par un tiers, non fiable) | O/P | https://mailchimp.com/help/about-abuse-complaints/ |
| MC-B-012 | Avertissements et suspension de compte | Compliance | Avertissement d'abord (plaintes, bounces, désabonnements, plaintes directes), suspension si taux très supérieur ; revue par l'équipe Compliance (jours ouvrés, heure de l'Est). | Historique visible dans Compte > Account History | C | https://mailchimp.com/help/about-suspension/ |
| MC-B-013 | Avertissement de taux de désabonnement | Compliance | Pages dédiées "unsubscribe warnings / suspension". | Pas de suspension sans notice | C | https://mailchimp.com/help/about-unsubscribe-warnings/ |
| MC-B-014 | Limites d'envoi par offre | Facturation | Free : 500/mois et 250/jour ; payant : multiple des contacts (10x / 12x / 15x). Dépassement facturé sur payant, envoi suspendu sur Free. | Legacy Free : 12 000/mois, 2 000/24 h (ancien) | O | https://mailchimp.com/pricing/marketing/ |
| MC-B-015 | Limite d'e-mails de test | Délivrabilité | Page dédiée aux limites d'envoi de tests. | Valeurs non lues | N | https://mailchimp.com/help/about-test-email-sending-limits/ |
| MC-B-016 | Verified Domains (API) | API | Groupe de ressources "Verified Domains" dans l'API Marketing. | Détails endpoints non lus | C (existence) | https://mailchimp.com/developer/marketing/llms.txt |
| MC-B-017 | Détection des bots / filtrage | Rapports | Option de compte qui exclut l'activité de bots des statistiques ; baisse sensible des ouvertures/clics. Réglage global au compte. | - | C | https://mailchimp.com/help/about-bot-activity/ |

## 2. Conformité

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-020 | Champs RGPD / marketing permissions | Audience | Cases de consentement par finalité sur formulaires (hébergé, intégré, landing). Option "exiger au moins une case". Texte de consentement éditable, mention politique de confidentialité non éditable. | Indisponible sur formulaires pop-up ; modifier une case existante peut invalider le consentement | C | https://mailchimp.com/help/collect-consent-with-gdpr-forms/ |
| MC-B-021 | Segmentation par permission marketing | Audience | Segment par étiquette du champ RGPD. | - | P | idem |
| MC-B-022 | Champ API `marketing_permissions` | API | Booléen pour synchroniser les permissions. | - | C | https://mailchimp.com/help/gdpr-faq/ |
| MC-B-023 | Double opt-in | Audience | Confirmation par e-mail ; preuves via OPTIN_TIME/OPTIN_IP/CONFIRM_TIME/CONFIRM_IP à l'export. | Non exigé par le RGPD selon Mailchimp ; exigé en Autriche, Allemagne, Norvège ; fusion d'audiences supprime OPTIN_TIME | C | https://mailchimp.com/help/gdpr-faq/ |
| MC-B-024 | Suppression définitive de contact | Audience | Efface les données personnelles, anonymise dans les rapports, empêche le réajout (API : empêche aussi réimport). Réservée aux demandes RGPD ; archiver pour l'inactivité. | Irréversible | C | https://mailchimp.com/help/delete-contacts/ |
| MC-B-025 | DPA et transferts de données | Légal | DPA avec clauses contractuelles types intégré aux CGU ; serveurs/siège aux USA. | - | C | https://mailchimp.com/help/gdpr-faq/ |
| MC-B-026 | Rapports d'accès (DSAR) | Légal | Page "Data Subject Access Reports". | Contenu non lu | P | https://mailchimp.com/legal/dsar-requests/ |
| MC-B-027 | Pied de page obligatoire (CAN-SPAM) | Campagnes | Lien de désabonnement + adresse postale (boîte postale acceptée) ; insérés automatiquement par les modèles intégrés, à ajouter manuellement en HTML personnalisé. | Mailchimp impose CAN-SPAM même hors USA | C | https://mailchimp.com/help/anti-spam-requirements-for-email/ |
| MC-B-028 | Aide CASL (Canada) | Conformité | Pied de page : nom de l'expéditeur, adresse, un moyen de contact, désabonnement. Règles de consentement CASL non lues en détail. | - | P | https://mailchimp.com/help/stay-compliant-with-casl/ |
| MC-B-029 | LGPD (Brésil) | Conformité | FAQ et page dédiées. | Contenu non lu | P | https://mailchimp.com/help/lgpd-faq/ |
| MC-B-030 | Désabonnement manuel / actions de désabonnement | Audience | Désabonner email ou SMS depuis le tableau/profil ; réabonnement par formulaire pour auto-désabonnés. | - | C | https://mailchimp.com/help/unsubscribe-people-marketing/ |
| MC-B-031 | Centre de préférences / mise à jour de profil | Audience | Formulaire permettant choix de groupes et fréquence ; tag `*|UPDATE_PROFILE|*` dans le pied par défaut. | - | C | https://mailchimp.com/help/create-a-preferences-center/ |
| MC-B-032 | En-tête List-Unsubscribe one-click | Délivrabilité | Recommandé en guide marketing ; documentation technique Mailchimp d'implémentation non trouvée. | - | N | https://mailchimp.com/resources/email-unsubscribe-rate/ |

## 3. Rapports et statistiques

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-040 | Rapport de campagne : aperçu | Rapports | Destinataires, ouvertures, clics, désabonnements, plaintes, commandes, revenus. | Suivi ouvertures/clics doit être activé | C | https://mailchimp.com/help/about-email-campaign-reports/ |
| MC-B-041 | Activité par destinataire + export de segment | Rapports | Isoler/exporter selon ouvert, cliqué, rebond, désabonné. | - | C | idem |
| MC-B-042 | Performance des clics + Click Map | Rapports | URL suivies (total/unique), carte visuelle. | - | C | idem |
| MC-B-043 | Onglet social | Rapports | J'aime Facebook, référents, carte. | Compte Facebook connecté | O | idem |
| MC-B-044 | Onglet e-commerce | Rapports | Achats par destinataire, filtre par boutique ; commandes, revenu moyen, ventes brutes, revenu total. | Boutique connectée ; commande avec `campaign_id` | O | idem + https://mailchimp.com/developer/marketing/concepts/e-commerce.md |
| MC-B-045 | Inbox (réponses) | Rapports | Lire/répondre aux réponses de contacts. | - | C | idem |
| MC-B-046 | Géolocalisation / 24 premières heures | Rapports | Carte des lieux d'ouverture ; courbe 24 h. | Affaibli par Apple MPP | C | idem |
| MC-B-047 | Apple MPP : impact | Rapports | Ouvertures gonflées (pixels préchargés), localisation/appareil peu fiables, clics/achats non affectés. Conseil : déclencher/recibler sur clics. | Lancé 2021 (iOS 15) | C | https://mailchimp.com/help/apple-privacy-faq/ |
| MC-B-048 | Exclusion des métriques MPP | Rapports | Case dans tableau de bord marketing et rapports personnalisés pour exclure les métriques d'ouverture touchées (envois dès 22 juin 2024). | Rapports personnalisés : Standard+ | O | idem |
| MC-B-049 | Rapports personnalisés | Rapports | Métriques listées dans une page dédiée. | Standard+ (pricing) | O | https://mailchimp.com/help/custom-report-metrics/ |
| MC-B-050 | Benchmarking (comparaison avec pairs) | Rapports | Compare aux moyennes de l'industrie. | Détails non lus | P | https://mailchimp.com/help/about-campaign-benchmarking/ |
| MC-B-051 | Rapports d'automatisation | Rapports | Non lus ; l'API expose "Customer Journeys" et "Automations" (emails, queue). | - | N | https://mailchimp.com/developer/marketing/llms.txt |
| MC-B-052 | API Reports | API | Abuse reports, click details, domain performance, email activity, open details, sent-to, unsubscribed. | - | C | idem |
| MC-B-053 | Account Exports (API) | API | Ressource d'exports de compte. | Non détaillée | C (existence) | idem |
| MC-B-054 | Export de rapport PDF/CSV global | Rapports | Seul l'export de segments d'activité est confirmé. | - | N | - |

## 4. CRM / profil de contact

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-060 | Profil de contact | Audience | Fiche par personne : statut, source, tags, notes, achats, engagement. | - | P | https://mailchimp.com/help/about-contact-profile-pages/ |
| MC-B-061 | Fil d'activité | Audience | Timeline filtrable : envois, ouvertures, clics, (dés)abonnements, bounces, achats, notes, événements API personnalisés, engagement site. | Site connecté pour engagement site | P | https://mailchimp.com/features/contact-profiles/ |
| MC-B-062 | Tags et champs personnalisés | Audience | Création/attribution manuelle, import, formulaires ; ciblage ET/OU. | - | P | https://mailchimp.com/help/create-add-remove-tags/ |
| MC-B-063 | Contact rating (1 à 5 étoiles) | Audience | Basé sur l'engagement e-mail ; contact neuf = 2 étoiles. Hors pubs/automatisations/landing. | Affecté par MPP | P | https://mailchimp.com/help/about-contact-ratings/ |
| MC-B-064 | Segments | Audience | Jusqu'à 10 conditions (tags, rating, campagne, événements). Segments avancés dans l'API. | Limite 10 à re-vérifier | P | https://mailchimp.com/help/all-the-segmenting-options/ |
| MC-B-065 | Contacts non abonnés | Audience | Adresses sans opt-in marketing ; comptent dans la facturation. | - | C | https://mailchimp.com/help/about-non-subscribed-contacts/ |
| MC-B-066 | Archivage de contacts | Audience | Retire de la facturation future ; désarchivage automatique si le profil change. | Ne baisse pas le pic de la période courante | C | https://mailchimp.com/help/archive-unarchive-contacts/ |
| MC-B-067 | Prédictions (âge, genre) | Audience | Mentionnées sur la fiche. | Peu documenté | P | https://mailchimp.com/features/contact-profiles/ |

## 5. E-commerce

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-070 | Intégrations de boutiques | Intégrations | Shopify, WooCommerce, Squarespace, BigCommerce, PrestaShop, Adobe Commerce, Big Cartel ou API 3.0 personnalisée. | Fonctions variables par plateforme (BigCommerce sans panier abandonné selon une page ancienne) | O | https://mailchimp.com/help/connect-your-online-store-to-mailchimp/ |
| MC-B-071 | Modèle e-commerce API | API | Store (lié à 1 audience, non modifiable) > Customers, Products/variants, Carts, Orders, Promo rules/codes. Boutiques natives Mailchimp en lecture seule. | - | C | https://mailchimp.com/developer/marketing/concepts/e-commerce.md |
| MC-B-072 | Automatisation panier abandonné | Automatisations | Déclencheur par boutique + délai ; blocs panier/bouton auto ; ne se combine pas avec un autre déclencheur. | Boutique supportée ; plus : SMS 1 par panier sous 48 h, SMS requiert programme approuvé + double opt-in ; classiques réservés aux comptes payants préexistants | O | https://mailchimp.com/help/create-abandoned-cart-customer-journey/ |
| MC-B-073 | Paniers (API) | API | Servent uniquement à l'abandon ; sans expiration ; supprimer annule l'e-mail. | - | C | concepts/e-commerce.md |
| MC-B-074 | Recommandations produits | Campagnes | Bloc auto-rempli à l'envoi : personnalisé, meilleures ventes, nouveautés. Produit : `image_url` et stock > 0. | Personnalisation : seuils de données (ex. 50 clients, 10 produits, 500 commandes/an, source ancienne) | O/P | https://mailchimp.com/help/use-product-recommendation-content-blocks-new-builder/ |
| MC-B-075 | Reciblage produit | Automatisations | Cookies ; 1 e-mail par 7 jours ; bloc Retargeting requis. | Shopify, WooCommerce, PrestaShop | O | https://mailchimp.com/help/create-a-product-retargeting-email/ |
| MC-B-076 | Attribution des revenus | Rapports | `mc_cid` -> `campaign_id` de la commande ; `mc_eid` retrouve le destinataire ; `mc_tc` attribue à une recommandation. Requis : `campaign_id`, `processed_at_foreign`, `financial_status`. | Intégration personnalisée : à implémenter | C | concepts/e-commerce.md |
| MC-B-077 | Notifications de commande/expédition | Automatisations | `financial_status` et `fulfillment_status=shipped` déclenchent des messages. | - | C | idem |
| MC-B-078 | Pause de sync (`is_syncing`) | API | Désactive les automatisations e-commerce pendant l'import. | - | C | idem |
| MC-B-079 | Statut client `transactional` | API | `opt_in_status=false` crée un membre "transactional" ; double opt-in : transactional puis pending. | - | C | idem |

## 6. SMS/MMS et autres canaux

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-080 | SMS marketing | SMS | Campagnes et flux SMS ; crédits par pays. | Module payant ; programme à approuver par pays ; opt-out obligatoire | O | https://mailchimp.com/help/about-sms-marketing/ |
| MC-B-081 | Pays et types d'expéditeur SMS | SMS | USA/Canada : 10DLC ; UK, Belgique, Australie : numéro virtuel ; nombreux pays européens : Sender ID. | Tables contradictoires entre pages ; page principale ancienne | O/P | idem |
| MC-B-082 | MMS | SMS | Images dans le message. | USA et Canada ; Standard/Premium ; US 3 crédits, Canada 5 | O | https://mailchimp.com/help/about-sms-marketing-credits/ |
| MC-B-083 | Crédits SMS | Facturation | 1 crédit/SMS US ; 2 à 16 selon pays ; non reportés d'un cycle. | - | O | idem |
| MC-B-084 | Double opt-in SMS | SMS | Réglage par audience, auto-activé dans certains pays. | - | P | idem |
| MC-B-085 | SMS Campaigns (API) | API | Ressource "SMS Campaigns", mélangeable en batch. | - | C (existence) | llms.txt / batch-operations.md |
| MC-B-086 | Publication sociale organique | Social | Facebook Pages, Instagram pro, X ; pas de profil Facebook personnel. Programmation 2 h à 3 mois. | Programmation : Standard+ ; publication immédiate toutes offres | O/P | https://mailchimp.com/help/publish-social-post-send-email/ |
| MC-B-087 | Publicités Facebook/Instagram | Pub | Création et ciblage ; API "Facebook Ads". | Prérequis non lus | P | https://mailchimp.com/solutions/social-media-marketing-tools/ |
| MC-B-088 | Cartes postales | Print | Apparaissent dans le calendrier marketing ; aucune doc détaillée consultée. | - | N | https://mailchimp.com/features/marketing-calendar/ |
| MC-B-089 | Landing pages | Web | Gratuites pour tous selon la page produit. API "Landing Pages". | - | P | https://mailchimp.com/help/about-landing-pages/ |
| MC-B-090 | Sites web / Connected Sites | Web | Constructeur de site mentionné, détails absents ; API "Connected Sites". | - | N | - |

## 7. API Marketing v3 et Transactional

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-100 | Racine et format | API | `https://api.mailchimp.com/3.0/` (sous-domaine `<dc>` du datacenter), JSON, REST, actions non-REST sous `/actions/`, spec OpenAPI JSON/YAML. | - | C | https://mailchimp.com/developer/marketing/docs/fundamentals/ |
| MC-B-101 | Authentification clé API | API | Basic ou Bearer. | Clé pour son propre compte | C | https://mailchimp.com/developer/guides/get-started-with-mailchimp-api-3/ |
| MC-B-102 | OAuth 2 (authorization code) | API | `client_id`/`client_secret`, échange `code` côté serveur ; jetons sans expiration ni refresh ; endpoint metadata donne le datacenter. | Pour accéder au compte d'un tiers | C | https://mailchimp.com/developer/marketing/api-concepts/authentication/oauth-2.md |
| MC-B-103 | Limites de débit | API | 10 connexions simultanées par utilisateur, 429 au-delà ; timeout 120 s ; limite non relevable. | Dépassement abusif peut désactiver l'accès | C | https://mailchimp.com/developer/marketing/api-concepts/rate-limits-and-timeouts.md |
| MC-B-104 | Pagination | API | `count` (défaut 10, max 1000) et `offset`. | - | C | .../methods-and-parameters.md |
| MC-B-105 | Réponses partielles | API | `fields` / `exclude_fields`, notation pointée, exclusifs. | - | C | idem |
| MC-B-106 | Méthodes | API | GET/POST/PATCH/PUT/DELETE ; `X-HTTP-Method-Override` via POST. | - | C | idem |
| MC-B-107 | Opérations batch | API | POST `/batches`, `operations[]` (method, path, operation_id, body, params) ; résultats tar.gz 7 jours, URL valable 10 min ; max 500 batchs pending ; ordre non garanti. | - | C | .../batch-operations.md |
| MC-B-108 | Webhooks de batch | API | Max 20 ; GET de vérification à la création ; POST form-urlencoded à chaque batch terminé. | - | C | idem |
| MC-B-109 | Webhooks d'audience | API | Événements subscribe, unsubscribe, et autres (profil, campagne, bounces cités) ; création via Audience > Settings > Webhooks ou API ; réponse requise sous 10 s ; reprises sur 75 min. | Liste complète des événements non confirmée | C/P | .../webhooks.md |
| MC-B-110 | Signature des webhooks | API | `X-Mailchimp-Signature` (`t=...,v1=...`), HMAC-SHA256 sur timestamp + corps brut, secret affiché une fois, tolérance 5 min. | Optionnelle | C | idem |
| MC-B-111 | Groupes de ressources | API | Account Exports, Activity Feed, Authorized Apps, Automations, Batches, Batch Webhooks, Campaign Folders, Campaigns, Connected Sites, Conversations, Customer Journeys, E-commerce, Facebook Ads, File Manager, Landing Pages, Lists (members, segments, merge fields, interest categories, surveys, webhooks), Ping, Reporting, Reports, Search, SMS Campaigns, Templates, Verified Domains. | - | C | https://mailchimp.com/developer/marketing/llms.txt |
| MC-B-112 | Guides, SDK et CLI | API | Bibliothèques clientes, CLI, quickstarts import/export, tags. | - | C | idem |
| MC-B-113 | Transactional (ex-Mandrill) : API | Transactional | POST uniquement, clé dans le corps (`key`), restrictions IP/endpoint, clé de test. | - | C | https://mailchimp.com/developer/transactional/docs/fundamentals |
| MC-B-114 | Transactional : SMTP | Transactional | Même délivrabilité que l'API ; envoi seul. | - | C | idem |
| MC-B-115 | Transactional : webhooks, règles | Transactional | Webhooks d'événements avec alerte d'erreur ; Rules Engine conditionnel. | - | C | idem |
| MC-B-116 | Transactional : réputation | Transactional | Par compte (horaire), tags (quotidien), sous-comptes ; alerte à "Poor". | - | C | idem |
| MC-B-117 | Transactional : domaines | Transactional | DKIM + DMARC et vérification obligatoires avant envoi externe. | - | C | idem + help domain auth |
| MC-B-118 | Transactional : tarification | Transactional | Blocs de 25 000 e-mails, 20 $ dégressif jusqu'à 10 $ ; IP dédiée 29,95 $/mois ; blocs non reportés ; envoi stoppé sans blocs. | Complément à Standard/Premium (ou Monthly legacy) ; Essentials exclu ; test 500 envois ; mode test 10 000/jour | O | https://mailchimp.com/pricing/transactional-email/ |
| MC-B-119 | Transactional : SMS | Transactional | Même crédits que SMS marketing ; mêmes pays. | Programme approuvé requis | O | idem |

## 8. IA (Intuit Assist)

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-130 | Write with AI | IA | Rédaction/édition inline : ton, raccourcir, allonger, grammaire, prompt libre. | Beta ; Standard+ ; adresse principale AU, CA, UK ou US | O | https://mailchimp.com/help/use-inline-content-generation/ |
| MC-B-131 | Générateur de contenu e-mail | IA | 3 propositions selon secteur, intention, voix de marque. | Beta (avr. 2023) | P | https://mailchimp.com/newsroom/announcing-email-content-generator/ |
| MC-B-132 | IA dans modèles de flux | IA | E-mails générés dans flux prêts à l'emploi (bienvenue, panier, win-back). | Standard+ ; adresse US | O | https://mailchimp.com/help/create-pre-built-journey-emails-intuit-ai/ |
| MC-B-133 | Segmentation en langage naturel | IA | Annoncée "bientôt" en 2023 ; disponibilité non confirmée. | - | P | https://mailchimp.com/newsroom/introducing-intuit-assist/ |
| MC-B-134 | Prédictif, heure/jour d'envoi, Content Optimizer, Analytics AI | IA | Cités comme outils IA ; détails de chacun non lus. | Plans non vérifiés | P | https://mailchimp.com/solutions/ai-tools/ |
| MC-B-135 | Suggestions d'objets | IA | Non vérifiées séparément. | - | N | - |

## 9. Comptes, utilisateurs, rôles

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-140 | Niveaux d'utilisateur | Compte | Owner (tout, facturation, fermeture), Admin (comme Owner sans se retirer l'accès), Manager (créer/envoyer e-mails et SMS, importer, rapports ; pas facturation/export/fermeture), Author (contenu, rapports), Viewer (rapports en lecture). | Free : 1 siège Owner ; Essentials : Owner/Admin ; Standard : + Author/Viewer ; Premium : tous, illimités (sources partiellement divergentes) | O | https://mailchimp.com/help/manage-user-levels-in-your-account/ |
| MC-B-141 | Invitation et transfert de propriété | Compte | Seuls Owner/Admin invitent ; l'ancien Owner devient Admin. | Un Owner obligatoire | C | https://mailchimp.com/help/transfer-ownership-of-an-account/ |
| MC-B-142 | Accès agence / multi-comptes | Compte | Accès agence, une connexion pour plusieurs comptes, connexion de comptes clients. | Détails non lus | P | https://mailchimp.com/help/grant-account-access/ |
| MC-B-143 | Clés API et applications autorisées | Compte | Gestion des clés et apps OAuth. | - | P | https://mailchimp.com/help/about-api-keys/ |
| MC-B-144 | SSO entreprise | Compte | Premium uniquement. | Premium | O | https://mailchimp.com/pricing/marketing/ |

## 10. Facturation, plans, quotas

| ID | Nom | Module | Description | Dépendance / limites | Statut | Source |
|---|---|---|---|---|---|---|
| MC-B-150 | Plans | Facturation | Free, Essentials, Standard, Premium (voir tableau d'intro). | Prix USD ; remise 15 % 12 mois à 10 000+ contacts ; essai 14 jours Essentials/Standard | O | https://mailchimp.com/pricing/marketing/ |
| MC-B-151 | Contacts facturables | Facturation | Comptent : abonnés, désabonnés, non abonnés. Ne comptent pas : archivés, nettoyés, supprimés. | Facturation sur le pic de la période ; plan legacy compte les doublons entre audiences | C | https://mailchimp.com/help/mailchimp-pricing-tiers/ |
| MC-B-152 | Dépassements | Facturation | Contacts/envois en excès facturés (payant) ; blocage sur Free (envois et tests). | - | C | pricing + about-mailchimp-pricing-plans |
| MC-B-153 | Pay As You Go | Facturation | Crédits d'e-mails pour expéditeurs occasionnels. | Disponibilité/pays non lus | P | https://mailchimp.com/help/about-the-pay-as-you-go-plan/ |
| MC-B-154 | Plan legacy / frais additionnels | Facturation | Pages dédiées. | Non lues | P | https://mailchimp.com/help/about-legacy-pricing-plan/ |
| MC-B-155 | Plan sur mesure | Facturation | Au-delà de 200 000 contacts, via les ventes. | - | C | pricing |

## Lacunes (non accessible ou non vérifié)

- Page Mailchimp "Gmail/Yahoo sender requirements" : URL testée en 404 ; seuil de plaintes 0,3 % et one-click non confirmés par source Mailchimp.
- SPF : non mentionné dans la doc d'authentification lue.
- Détail du compte rendu des rapports d'automatisation, export PDF/CSV de rapport global, tests A/B, suggestion d'objets IA.
- Cartes postales et constructeur de site : aucune page détaillée lue.
- Règles de consentement CASL détaillées, LGPD, DSAR : titres vus seulement.
- Seuils exacts de plaintes/bounces/désabonnements pour avertissement ou suspension, nombre de tentatives de renvoi : non publiés dans les pages lues.
- Liste complète des événements de webhook d'audience et des codes d'erreur API (page "errors" non lue).
- Nombreuses pages help datent de plusieurs années selon les métadonnées de recherche ; valeurs d'interface et seuils à re-contrôler.
- Disponibilité par pays (hors SMS) et offre exacte pour la plupart des fonctions IA/social/pub : non établies.
