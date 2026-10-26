# Inventaire Mailchimp - Partie A (audiences, segmentation, campagnes, éditeur, templates, automations, formulaires)

Date de collecte : 2026-10-26. Sources : pages d'aide officielles mailchimp.com/help (consultées via WebFetch/WebSearch). Contenu reformulé, aucun texte copié en bloc.

Préfixe d'URL : `H` = `https://mailchimp.com/help/`.

Légende du statut :
- **C** = capacité confirmée par la doc officielle
- **P** = confirmée mais dépendante d'une offre (plan) ou d'une intégration
- **O** = observée mais peu documentée (information partielle ou indirecte)
- **N** = non accessible / non vérifiable (voir section Lacunes)

Avertissement : plusieurs articles d'aide sont anciens (métadonnées de recherche : 2 000 à 4 000 jours). Les noms de plans et limites sont à revérifier dans le compte avant tout engagement. Les sources se contredisent parfois (signalé ci-dessous). Le vocabulaire a évolué : « Customer Journeys » est désormais « Marketing Automation Flows / automation flows ».

## 1. Audiences et contacts

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-001 | Statuts de contact e-mail | Audiences | Trois statuts : abonné (subscribed), désabonné (unsubscribed), non-abonné (non-subscribed, ex. client boutique sans opt-in marketing). Seuls les abonnés reçoivent du marketing. | Non-abonnés surtout liés à une synchro e-commerce | Les non-abonnés comptent dans le total de contacts facturable | H getting-started-audience/ ; H about-non-subscribed-contacts/ (titre vu en recherche) | C |
| MC-A-002 | Statut « cleaned » | Audiences | Contacts nettoyés (adresses en rebond dur, etc.). | - | Archiver des contacts cleaned ne réduit pas le compte facturable | H about-cleaned-contacts/ (titre vu en recherche, contenu non lu) ; H archive-unarchive-contacts/ (résumé de recherche) | O |
| MC-A-003 | Audience principale unique recommandée | Audiences | Mailchimp recommande une seule audience, segmentée par tags/groupes/segments. Les audiences sont indépendantes : pas de détection de doublons, rebonds ou désabonnements entre audiences. | Plusieurs audiences possibles selon l'offre (non précisé) | Un contact présent dans deux audiences compte deux fois | H getting-started-audience/ ; H import-contacts-mailchimp/ | C |
| MC-A-004 | Ajout manuel d'un contact | Audiences | Ajout d'un abonné à la fois. | - | - | H getting-started-audience/ | C |
| MC-A-005 | Import par fichier CSV/TXT | Audiences | Import de CSV ou TXT, colonne e-mail obligatoire, mappage des autres colonnes vers les champs, colonnes non mappées ignorées. | - | Séparateur point-virgule à convertir en virgule ; formats imposés pour téléphone, anniversaire, adresse ; un seul statut par import | H import-contacts-mailchimp/ ; H format-guidelines-for-your-import-file/ | C |
| MC-A-006 | Import par copier-coller | Audiences | Collage depuis un tableur ou une liste. | - | Mêmes règles de mappage | H import-contacts-mailchimp/ | C |
| MC-A-007 | Import via applications connectées | Audiences | Sources citées : Zapier, Salesforce, WooCommerce, QuickBooks Online, Squarespace Commerce, Shopify ; la page audience cite aussi Magento, BigCommerce. | Dépend de l'intégration | - | H import-contacts-mailchimp/ ; H getting-started-audience/ | P |
| MC-A-008 | Mise à jour de contacts existants à l'import | Audiences | Option « Update any existing contacts » : met à jour les champs par correspondance de noms de colonnes. | - | Les champs vides écrasent les données existantes ; seuls abonnés/non-abonnés mettables à jour ; le statut marketing existant n'est pas modifié | H import-contacts-mailchimp/ | C |
| MC-A-009 | Exclusion des doublons/rebonds/désabonnés à l'import | Audiences | À l'import dans une audience existante, adresses déjà connues comme doublons, rebonds ou désabonnées sont exclues. | - | Limité à l'audience cible | H import-contacts-mailchimp/ | C |
| MC-A-010 | Attestation de consentement à l'import | Audiences | L'utilisateur doit avoir la permission ; les contacts importés « abonnés » sautent le processus d'inscription. Si seul le consentement e-mail existe : e-mail abonné, SMS non-abonné. Listes achetées/louées interdites. | Conformité (RGPD/UE concerné, voir MC-A-037) | Responsabilité de l'utilisateur | H import-contacts-mailchimp/ ; H getting-started-audience/ | C |
| MC-A-011 | Import de tags | Audiences | Colonne « Tags » (valeurs séparées par virgules, tags créés s'ils n'existent pas) ou jeu de tags appliqué à tout le fichier. | - | Nom de tag max 100 caractères ; emojis non importables ; virgule dans un tag = guillemets | H format-guidelines-for-your-import-file/ ; H import-contacts-mailchimp/ | C |
| MC-A-012 | Import d'appartenance à des groupes | Audiences | Une colonne par catégorie de groupe, noms multiples séparés par virgules. | - | Les groupes doivent exister avant ; l'import n'enlève pas des groupes existants | H add-subscribers-to-groups/ ; H format-guidelines-for-your-import-file/ | C |
| MC-A-013 | Champs d'audience (types) | Audiences | Types : Text, Number, Radio Buttons, Check Boxes, Drop Down, Date, Birthday, Address, Zip Code, Phone, Website, Image, Language (Language n'apparaît qu'avec l'auto-traduction du formulaire). Age Verification géré par le système (SMS à restriction d'âge). | - | Type non modifiable après création ; valeur 255 octets ; libellé de formulaire 50 octets ; 30 champs par contact (80 sur Premium) | H manage-audience-signup-form-fields/ | C / P (Premium) |
| MC-A-014 | Merge tags de champs + valeur par défaut | Audiences | Chaque champ a un merge tag et une valeur par défaut optionnelle ; champ pouvant être obligatoire. | - | Suppression d'un champ = suppression des données (masquer plutôt) | H manage-audience-signup-form-fields/ | C |
| MC-A-015 | Groupes (interest groups) | Audiences | Catégories assignées par l'expéditeur ou choisies par le contact, visibles ou masquées dans les formulaires. Les cases à cocher créent des groupes. | Création : rôle Manager ou supérieur | 60 groupes par audience (cases à cocher) | H getting-started-audience/ ; H manage-audience-signup-form-fields/ | C |
| MC-A-016 | Tags | Audiences | Étiquettes internes pour organiser les contacts, utilisables en segmentation et automations. | - | Sensibles à la casse dans les merge tags ; non utilisables dans les balises conditionnelles (voir MC-A-049) | H getting-started-audience/ ; H use-conditional-merge-tag-blocks/ | C |
| MC-A-017 | Archivage / désarchivage de contacts | Audiences | Retire le contact du tableau actif en conservant ses données ; il ne reçoit plus de marketing. | Réduit la facturation des périodes futures | Ne baisse pas le pic déjà enregistré dans la période en cours ; un changement de profil peut désarchiver ; archiver des cleaned ne réduit pas le compte | H archive-unarchive-contacts/ (extraits via recherche) | O (page non lue directement) |
| MC-A-018 | Archivage des contacts inactifs | Audiences | Article dédié à l'archivage de contacts inactifs. | - | Détails non lus | H remove-inactive-contacts/ (titre seul) | N |
| MC-A-019 | Suppression définitive de contact | Audiences | Supprime de façon permanente les données personnelles du contact. L'API Marketing a une action « forget contact ». | - | Irréversible | H delete-contacts/ ; H gdpr-faq/ (résumés de recherche) | O |
| MC-A-020 | Fusion d'audiences | Audiences | Pas de fonction de fusion native : procédure manuelle (sauvegarder, archiver l'ancienne audience, importer dans l'audience principale avec des tags d'origine, ou via CSV). | - | Permanent ; les métriques d'engagement ne suivent pas ; horodatages d'opt-in, source et permissions RGPD perdus (déconseillé pour audiences RGPD) | H combine-audiences-primary-audience-uses-tags/ ; H combine-audiences-csv-file/ (résumés de recherche) | O |
| MC-A-021 | Export de contacts | Audiences | Export CSV depuis le tableau de contacts ; contacts archivés exportés séparément. | Export réservé Owners/Admins | Fichier disponible 30 jours dans le compte | H view-export-contacts/ ; H export-contacts/ (résumés de recherche) | O |
| MC-A-022 | Export d'un contact unique (demande d'accès) | Audiences | Export depuis la fiche contact pour répondre à une demande d'accès RGPD. | - | - | H gdpr-faq/ (résumé de recherche) | O |
| MC-A-023 | Export et sauvegarde des données du compte | Audiences | Exports de compte (aussi via l'API Account Exports). | - | Détails non lus | H export-back-up-data/ ; developer/marketing/api/account-exports/ (titres seuls) | N |
| MC-A-024 | Fiche contact (profil) | Audiences | Page de profil contact. | - | Contenu non lu | H about-contact-profile-pages/ (titre seul) | N |
| MC-A-025 | Champs de preuve de consentement | Audiences | Colonnes d'export OPTIN_TIME, OPTIN_IP, CONFIRM_TIME, CONFIRM_IP pour justifier l'inscription via un formulaire hébergé Mailchimp. | Formulaire hébergé Mailchimp | Pas fourni pour contacts importés (non vérifié) | H gdpr-faq/ (résumé de recherche) | O |
| MC-A-026 | Champs RGPD / permissions marketing | Audiences | Cases de permissions marketing sur formulaire ; export d'une colonne par permission. | Audience RGPD activée | Indisponibles sur les formulaires popup ; page des champs d'audience ne les détaille pas | H about-signup-form-options/ ; H view-export-contacts/ (résumé) | C (limite popup) / O (détail) |
| MC-A-027 | Désinscription et centre de préférences | Audiences | Lien « mettre à jour vos préférences » dans les e-mails pour gérer ses intérêts. | - | - | H getting-started-audience/ | C |
| MC-A-028 | Facturation par contacts | Audiences | Total de contacts facturé au pic de la période ; dépassement = frais additionnels. Plan gratuit : 250 contacts, 500 envois/mois, 250/jour (valeurs vues dans l'aide, à revérifier). | Selon plan | Contacts archivés/cleaned/supprimés exclus du total futur | H import-contacts-mailchimp/ ; H archive-unarchive-contacts/ | P |

## 2. Segmentation

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-029 | Segment standard (builder de base) | Segmentation | Conditions combinées avec un seul opérateur AND ou OR. | Free et Essentials | 10 conditions max ; pas de mélange AND/OR | H getting-started-with-segments/ ; H about-advanced-segmentation/ (résumé) | C |
| MC-A-030 | Segment avancé (AND/OR imbriqués) | Segmentation | Groupes de conditions avec logique imbriquée ; condition de premier niveau obligatoire dont la logique s'applique aux groupes. | Standard, Premium ou Legacy avec Pro | Génération plus lente avec beaucoup de conditions | H getting-started-with-segments/ ; H understanding-advanced-segmentation-logic/ (résumé) | P |
| MC-A-031 | Segments enregistrés | Segmentation | Segment sauvegardé et réutilisable depuis le tableau de contacts, l'éditeur e-mail ou SMS. | - | - | H getting-started-with-segments/ | C |
| MC-A-032 | Segments prédéfinis (pre-built) | Segmentation | Segments générés automatiquement (ex. Engaged Subscribers, Recent Customers) à partir de l'engagement ou des achats. | Achats : intégration e-commerce | Liste exacte non lue | H about-pre-built-segments/ ; H getting-started-with-segments/ | C |
| MC-A-033 | Segments statique vs dynamique | Segmentation | Non traité dans l'aide lue. Les segments se recalculent à l'envoi (voir MC-A-034). | - | Aucune terminologie « statique/dynamique » officielle trouvée | H getting-started-with-segments/ | N |
| MC-A-034 | Recalcul des destinataires à l'envoi | Segmentation | Option « Finalize your recipients at send time » : réexécute le segment avant l'envoi. | Désactivable sur Standard+ ; Free/Essentials toujours finalisé à l'envoi | Si le segment est modifié après programmation, il faut le rajouter à l'e-mail | H schedule-or-pause-a-regular-email-campaign/ | P |
| MC-A-035 | Conditions : coordonnées et tags | Segmentation | Tag, adresse, champs texte/date, anniversaire, note de contact, info modifiée, langue, téléphone, SMS, VIP, code postal. | - | « is not » inclut les valeurs vides, « is » les exclut | H all-the-segmenting-options/ ; H about-advanced-segmentation/ | C |
| MC-A-036 | Conditions : activité e-mail/SMS | Segmentation | Engagement (nouveau, rare, parfois, souvent), interaction (envoyé, ouvert, cliqué, répondu), statut d'abonnement ; SMS. | SMS : programme SMS requis | « Email date added » converti en UTC | H all-the-segmenting-options/ | C / P |
| MC-A-037 | Conditions : origine du contact | Segmentation | Date d'ajout e-mail/SMS et source d'inscription. | - | Fuseau UTC | H all-the-segmenting-options/ | C |
| MC-A-038 | Conditions : e-commerce | Segmentation | Achats par article, catégorie, montant, etc. | Boutique synchronisée | Disponible seulement avec intégration | H all-the-segmenting-options/ ; H getting-started-audience/ | P |
| MC-A-039 | Conditions : avis produits | Segmentation | Avis par note, période, type, produit. | Intégration d'avis (Judge.me, Yotpo cités) | - | H all-the-segmenting-options/ | P |
| MC-A-040 | Conditions : autres activités | Segmentation | Événements personnalisés (API), conversations Inbox, engagement site (pages vues, clics de lien), inscriptions landing pages, sondages, SurveyMonkey. | Selon intégrations ; option « Specific URL » : Standard et Premium | Seules les options pertinentes pour les données du compte s'affichent | H all-the-segmenting-options/ | P |
| MC-A-041 | Segments prédictifs (analytics prédictifs) | Segmentation | Prochaine date de commande, risque de churn (haut/moyen/bas), probabilité d'achat (30/60/90/365 j), valeur vie client prédite, démographie prédite (âge, genre, lieu). | Plan non précisé par la page ; probablement lié à des données e-commerce (non confirmé) | Exigences d'offre et de volume de données non documentées dans la page lue | H all-the-segmenting-options/ | O |
| MC-A-042 | Exclusion automatique des non-abonnés | Segmentation | À l'envoi e-mail/SMS, les contacts non abonnés sont retirés. | - | - | H getting-started-with-segments/ | C |

## 3. Campagnes

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-043 | E-mail régulier (regular) | Campagnes | Type le plus courant : conception libre, envoi immédiat ou programmé. | - | - | H getting-started-with-campaigns/ ; H create-and-send-regular-email/ | C |
| MC-A-044 | E-mail texte brut (plain-text) | Campagnes | Message sans mise en forme. | - | Pas de mise en forme | H create-a-plain-text-campaign/ ; H getting-started-with-campaigns/ | C |
| MC-A-045 | E-mail automatisé | Campagnes | Déclenché par date, événement ou activité (voir section 6). | Selon plan | - | H getting-started-with-campaigns/ | C |
| MC-A-046 | Campagne RSS | Campagnes | Envoi automatique des nouveaux articles d'un flux (quotidien, hebdo, mensuel) ; rien n'est envoyé s'il n'y a pas de nouveauté. Blocs RSS Header/Items réservés aux automations RSS et au builder legacy. | Disponibilité actuelle du type non reconfirmée | Pages anciennes (environ 2 400 jours) ; non listé parmi les 4 types du guide principal | features/rss-to-email/ ; H use-rss-items-content-blocks/ ; H about-mailchimps-email-builders/ | O |
| MC-A-047 | Merge tag FEED dans e-mails | Campagnes | Ajout de contenu de flux (liste de titres, extraits) dans régulier, texte brut, A/B via balise feedblock. | - | Syntaxe détaillée non lue | H add-a-blog-post-to-any-campaign/ ; H use-rss-items-content-blocks/ | O |
| MC-A-048 | Test A/B | Campagnes | Une variable testée : objet, nom d'expéditeur, contenu ou heure d'envoi (SMS : contenu seul). Jusqu'à 3 variantes. Gagnant auto (ouvertures, clics, revenu) ou manuel. | Selon plan ; revenu = boutique connectée | Test d'heure d'envoi : envoi à tous en une fois ; petites audiences/segments : envoi à tous | H about-ab-tests/ | P |
| MC-A-049 | Test multivarié | Campagnes | Combinaisons de plusieurs variables. | Standard ou supérieur, ou Pro | Pas de détail dans la page lue | H about-ab-tests/ ; features/ab-testing/ | P / O |
| MC-A-050 | Programmation d'envoi | Campagnes | Choix date/heure dans la checklist ; pause et édition possibles. | Essentials ou supérieur | Pause au moins 5 min avant l'envoi ; fuseau du compte (préférer fuseau local à GMT fixe) | H schedule-or-pause-a-regular-email-campaign/ | P |
| MC-A-051 | Envoi par lots (batch delivery) | Campagnes | Envoi échelonné pour limiter la charge sur le site ou serveur. | Standard ou supérieur | - | H schedule-or-pause-a-regular-email-campaign/ | P |
| MC-A-052 | Timewarp | Campagnes | Livre selon le fuseau de chaque destinataire. | Standard ou supérieur (page de programmation) | Non couvert par la page STO | H schedule-or-pause-a-regular-email-campaign/ | P |
| MC-A-053 | Send Time Optimization | Campagnes | Choisit l'heure probable d'engagement, dans les 24 h de la date choisie. | Standard ou supérieur | Régulier, texte brut, A/B, multivarié seulement (pas automatisé) ; date au moins 48 h dans le futur ; plus de 5 h restantes dans la journée ; données d'engagement suffisantes ; sources divergentes sur le critère (clics vs ouvertures) | H use-send-time-optimization/ ; H schedule-or-pause-a-regular-email-campaign/ | P |
| MC-A-054 | Checklist de pré-envoi | Campagnes | Étapes To, From, Subject, Content, Send time ; alerte de contenu par défaut (texte de template non remplacé). | - | Liste complète des vérifications non lue | H resolve-the-default-text-content-alert/ ; H schedule-or-pause-a-regular-email-campaign/ | O |
| MC-A-055 | Réplication de campagne | Campagnes | Duplication d'un e-mail envoyé ou brouillon. | - | Contenu non lu | H replicate-a-campaign/ (titre seul) | N |
| MC-A-056 | Landing page comme campagne | Campagnes | Les landing pages sont listées dans le guide mais ne sont pas des e-mails (voir section 7). | - | - | H getting-started-with-campaigns/ | C |

## 4. Éditeur d'e-mails

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-057 | Nouvel éditeur drag-and-drop | Éditeur | Blocs glissés dans des mises en page à colonnes, duplication, annuler/rétablir sur brouillons, blocs Apps et Survey. Défaut sauf si legacy utilisé avant. | - | Pas de blocs RSS ni Share | H about-mailchimps-email-builders/ ; H use-layout-content-blocks-new-builder | C |
| MC-A-058 | Éditeur legacy | Éditeur | Seul à permettre le code de template personnalisé et les flux RSS ; bloc Share. | - | Interface ancienne | H about-mailchimps-email-builders/ | C |
| MC-A-059 | Blocs de contenu (catalogue) | Éditeur | Nouveau : Paragraph, Heading, Layouts, Image, Video, Product, Product Recommendation, Review Product, Discount, Payment, Button, Social, Survey, Apps, Code, Logo, Footer, Divider, Spacer. Legacy : Text, Boxed Text, Image Group/Card, Image+Text, Product, Discount Code, Button, Social Follow, RSS, Share, Code, Footer, Divider. | Blocs commerce : intégration e-commerce probable | Pas de limite numérique documentée | H about-mailchimps-email-builders/ | C |
| MC-A-060 | Bloc Code (HTML) | Éditeur | HTML personnalisé dans l'e-mail ; usage avancé. | - | Réservé aux utilisateurs maîtrisant le code | H use-code-content-blocks-new-builder/ | C |
| MC-A-061 | Bloc Link Preview | Éditeur | Vignette et description d'une URL. | Intégration Link Preview ; nouveau builder seulement | - | H connect-disconnect-link-preview/ ; integrations/link-preview/ | P |
| MC-A-062 | Blocs répétables / variables | Éditeur | Sections dupliquables ou changeables dans un template codé avec le Template Language. | - | Legacy uniquement ; blocs déplaçables seulement dans leur zone | H repeatable-or-variable-content-blocks/ | C |
| MC-A-063 | Blocs de contenu réutilisables enregistrés | Éditeur | Aucune fonction d'enregistrement de blocs individuels trouvée ; seule la réutilisation de designs entiers via templates est documentée. | - | À confirmer en compte | H about-mailchimps-email-builders/ (recherche) | N |
| MC-A-064 | Merge tags | Éditeur | Insertion de champs d'audience dans le contenu ; guides et aide-mémoire dédiés. | - | Syntaxe non lue en détail | H getting-started-with-merge-tags/ ; H all-the-merge-tags-cheat-sheet/ | O |
| MC-A-065 | Balises conditionnelles (IF/ELSE/ELSEIF/IFNOT) | Éditeur | Contenu conditionnel par balises dans un même bloc, opérateurs d'égalité et de comparaison numérique. | Plan non précisé | Pas de AND/OR ; champs et groupes mais pas tags ; inopérant dans objets et URL uniques ; non rendu dans les e-mails de test ; sensibles à la casse | H use-conditional-merge-tag-blocks/ | C |
| MC-A-066 | Contenu dynamique | Éditeur | Affiche/masque un bloc selon des conditions, pour servir plusieurs publics dans un même e-mail. | Standard ou supérieur | Nouveau builder : champs, groupes, tags, 10 conditions par bloc ; legacy : champs et groupes ; pas dans le pied de page ; audience obligatoire ; non activé dans les e-mails de test | H about-dynamic-content/ | P |
| MC-A-067 | Aperçu et e-mail de test | Éditeur | Preview et envoi de tests ; aperçu avec option « live merge tag info ». | - | Limites quotidiennes de tests ; merge tags dynamiques non remplis en test | H preview-and-test-your-email-campaign/ ; H about-dynamic-content/ | C |
| MC-A-068 | Inbox Preview (rendu multi-clients) | Éditeur | Captures par client (Gmail, Outlook, Apple Mail, iPhone, iPad, Android...) via Litmus ; vue daltonisme ; 10 clients populaires présélectionnés. | Plan mensuel payant (une autre page parle d'Essentials+, une autre de Standard+ : divergence) | 25 jetons/mois, 1 jeton par client et par aperçu, expirent à fin de cycle ; audience requise ; indisponible dans le constructeur de templates | H test-with-inbox-preview/ | P |
| MC-A-069 | Vérificateur de liens | Éditeur | « Check email links » dans Preview ; icône d'alerte sur liens cassés (nouveau builder). | - | Ne vérifie pas merge tags, ancres, mailto | H troubleshoot-broken-links/ ; H preview-and-test-your-email-campaign/ (résumés de recherche) | O |
| MC-A-070 | Contrôle d'accessibilité | Éditeur | Aucun vérificateur dédié trouvé ; seul équivalent : vue daltonisme d'Inbox Preview. | Plan d'Inbox Preview | - | H test-with-inbox-preview/ | N |
| MC-A-071 | Contrôle spam / délivrabilité en éditeur | Éditeur | Non confirmé dans les pages lues. | - | - | H test-with-inbox-preview/ | N |

## 5. Templates

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-072 | Templates Mailchimp prédéfinis | Templates | Filtrables par type, style, secteur. | Certaines options selon plan | Détail non chiffré | H create-a-template-with-the-template-builder/ | P |
| MC-A-073 | Templates enregistrés | Templates | Designs sauvegardés réutilisables, onglet Saved. | - | - | H create-a-template-with-the-template-builder/ | C |
| MC-A-074 | Template depuis un e-mail récent | Templates | Démarrage depuis un envoi récent ou un brouillon. | - | - | H create-a-template-with-the-template-builder/ | C |
| MC-A-075 | Création depuis zéro | Templates | Mise en page vierge avec images, polices, couleurs. | - | - | H create-a-template-with-the-template-builder/ | C |
| MC-A-076 | Template HTML personnalisé (Code your own) | Templates | Import de HTML ; menu : modifier, répliquer, partager, exporter, renommer. | - | Option avancée ; mécanique de partage non détaillée (partage inter-comptes évoqué dans une autre source) | H create-a-template-with-the-template-builder/ | C / O |
| MC-A-077 | Templates transactionnels | Templates | Templates pour l'API, à publier avant envoi ; conversion marketing vers transactionnel irréversible. | Add-on Mailchimp Transactional | Converti = inutilisable en marketing | H create-a-template-with-the-template-builder/ | P |
| MC-A-078 | Template Language (balises de template) | Templates | Langage pour blocs éditables, répétables, variables ; référence sur templates.mailchimp.com. | - | Page de référence non lue | templates.mailchimp.com/getting-started/merge-tags/ (titre vu) | O |

## 6. Automations (Marketing Automation Flows, ex Customer Journeys)

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-079 | Création de flux depuis zéro ou template | Automations | Flux nommé, lié à une audience ; templates fournis avec déclencheurs, règles et actions modifiables. | Outils selon plan | - | H create-customer-journey/ | C |
| MC-A-080 | Déclencheurs multiples | Automations | Jusqu'à 3 déclencheurs, chacun avec jusqu'à 5 filtres ; ne s'appliquent qu'aux événements postérieurs à l'activation. | Plusieurs déclencheurs : Standard ou supérieur | Déclencheur panier abandonné non combinable avec un autre | H about-customer-journeys/ ; H create-customer-journey/ | P |
| MC-A-081 | Catalogue de déclencheurs | Automations | Catégories vues : activité contact (ex. mot-clé texto), activité d'achat (panier abandonné). | Boutique pour panier ; SMS pour texto | Liste complète « All the Marketing Automation Flow Triggers » non lue | H about-customer-journeys/ (recherche) | O |
| MC-A-082 | Déclencheur par API | Automations | Endpoint pour déclencher une étape depuis l'API ; point de départ « API » à configurer dans le builder. | - | Doc développeur non lue | developer/marketing/api/customer-journeys-journeys-steps-actions/ (titre) | O |
| MC-A-083 | Événements personnalisés | Automations | Suivi d'activités externes via événements (utilisables en segmentation et déclencheurs). | - | Guide non lu | developer/marketing/guides/track-outside-activity-events/ (titre) | O |
| MC-A-084 | Conditions de saut (conditional split) | Automations | Deux chemins selon jusqu'à 5 conditions. | Standard ou supérieur | - | H about-customer-journeys/ | P |
| MC-A-085 | Répartition en pourcentage | Automations | Deux chemins selon un pourcentage. | Standard ou supérieur | - | H about-customer-journeys/ | P |
| MC-A-086 | Délai (time delay) | Automations | Retient les contacts pendant une durée. | - | Bornes non lues | H about-customer-journeys/ | C |
| MC-A-087 | Attente de déclencheur (wait for trigger) | Automations | Retient jusqu'à ce qu'une condition soit remplie. | - | 10 par flux | H about-customer-journeys/ | C |
| MC-A-088 | Actions e-mail / SMS / enquête | Automations | Envoi e-mail, e-mail avec sondage, SMS. | SMS : programme SMS approuvé, add-on Standard+ | - | H about-customer-journeys/ ; H create-customer-journey/ | P |
| MC-A-089 | Actions de gestion de contact | Automations | Group/ungroup, tag/untag, unsubscribe, update contact, archive contact. | - | - | H about-customer-journeys/ | C |
| MC-A-090 | Webhook | Automations | Appel sortant depuis un flux. | Standard ou supérieur | Format non détaillé | H about-customer-journeys/ | P |
| MC-A-091 | Limite d'étapes | Automations | Essentials : 4 étapes ; Standard et plus : 200. | Selon plan | Plan Free non précisé | H about-customer-journeys/ | P |
| MC-A-092 | Conditions de sortie | Automations | Événements retirant un contact du flux. | - | Détail non lu | H about-customer-journeys/ | O |
| MC-A-093 | Statuts et suivi | Automations | Draft, Active (pause nécessaire pour éditer), Paused (pas de nouveaux entrants, ceux en cours n'avancent pas) ; page « All flows » avec compteurs. | - | - | H about-customer-journeys/ ; H create-customer-journey/ | C |
| MC-A-094 | Flux spécialisés | Automations | Panier abandonné, Text-to-Join (inscription par SMS). | Boutique ; programme SMS | Détails non lus | H create-abandoned-cart-customer-journey/ ; H create-text-to-join-customer-journey-map/ (titres) | O |

## 7. Formulaires d'inscription et landing pages

| ID | Nom | Module | Description | Offre / pays / intégration | Limites connues | URL source | Statut |
|---|---|---|---|---|---|---|---|
| MC-A-095 | Formulaire hébergé de base | Formulaires | Un formulaire d'abonnement hébergé par audience, partageable par lien. | - | Un seul par audience (version système) | H about-signup-form-options/ | C |
| MC-A-096 | Formulaire hébergé avancé | Formulaires | Version éditable en HTML. | Plan payant | - | H about-signup-form-options/ | P |
| MC-A-097 | Formulaire embarqué | Formulaires | HTML à coller sur un site tiers ; champs masquables, réordonnables, renommables, texte d'aide. | - | Styles avancés = édition HTML ; plusieurs par audience | H about-signup-form-options/ | C |
| MC-A-098 | Formulaire popup | Formulaires | Fenêtre contextuelle avec règles d'affichage. | - | Champs RGPD et reCAPTCHA indisponibles | H about-signup-form-options/ | C |
| MC-A-099 | Intégrations et plugins | Formulaires | Collecte via WordPress, Squarespace, etc. | Annuaire d'intégrations | - | H about-signup-form-options/ | P |
| MC-A-100 | API de formulaire | Formulaires | Formulaire codé sur mesure envoyant à l'API. | - | Double opt-in e-mail non géré par Mailchimp (à la charge du développeur) | H about-signup-form-options/ ; H about-double-opt-in/ | C |
| MC-A-101 | Single opt-in (défaut) | Formulaires | Audience en opt-in simple par défaut. | - | - | H about-signup-form-options/ | C |
| MC-A-102 | Double opt-in e-mail | Formulaires | Lien de confirmation par e-mail avant statut abonné ; activable par audience ou en lot ; personnalisation du formulaire, e-mail de confirmation, pages de remerciement, e-mail de bienvenue optionnel (désactivé par défaut). | Possiblement par défaut si adresse principale dans l'UE | Seulement formulaires Mailchimp ; reCAPTCHA obligatoire non désactivable ; message de confirmation non personnalisable sur landing page | H about-double-opt-in/ ; H set-signup-preferences/ | C |
| MC-A-103 | Double opt-in SMS | Formulaires | Confirmation par texto. | Programme SMS approuvé ; pays où requis | Obligatoire pour flux SMS de panier abandonné (désactiver met l'envoi en pause) | H about-double-opt-in/ | P |
| MC-A-104 | reCAPTCHA sur formulaires | Formulaires | Configuré dans les réglages de formulaires ; invisible sur landing pages. | - | Absent des popups | H about-signup-form-options/ ; H about-recaptcha-for-signup-forms/ | C |
| MC-A-105 | Constructeur de formulaire | Formulaires | Form Builder et blocs de formulaire. | - | Contenu non lu | H how-the-form-builder-works/ ; H use-signup-form-blocks/ (titres) | N |
| MC-A-106 | Landing pages | Formulaires | Pages construites avec le bloc Signup Form, champs supplémentaires possibles ; champs, opt-in et reCAPTCHA hérités de l'audience liée. | Gratuites sur tous les plans selon les pages marketing | Aucun plafond de pages trouvé | H create-a-landing-page/ ; features/landing-pages/ ; H about-signup-form-options/ | C / O |
| MC-A-107 | Domaine personnalisé pour landing pages | Formulaires | Connexion d'un domaine ou sous-domaine ; sinon URL mailchi.mp gratuite. | Essentials ou supérieur (une aide ancienne dit plan Websites payant) | Propagation jusqu'à 48 h | H connect-domain/ ; H getting-started-domains/ | P |
| MC-A-108 | Pages de remerciement et e-mails de bienvenue | Formulaires | Personnalisables dans le flux d'inscription (double opt-in e-mail). | - | - | H about-double-opt-in/ | C |

## Lacunes

Pages non lues ou inaccessibles (seul le titre ou un résumé de recherche a été vu) :
- `https://mailchimp.com/help/getting-started-with-audiences/`, `about-segments/`, `types-of-campaigns/`, `about-customer-journey-builder/`, `about-signup-forms/` : HTTP 404 (URL devinées, remplacées par les URL réelles).
- Pages non ouvertes directement : archivage (`archive-unarchive-contacts`, `remove-inactive-contacts`), export (`view-export-contacts`, `export-contacts`, `export-back-up-data`), suppression, fusion, GDPR FAQ, fiche contact, cleaned contacts, segments avancés (logique, opérateurs), segments prédéfinis, liste complète des déclencheurs, conditions de sortie, merge tags (syntaxe et aide-mémoire), checklist de pré-envoi, réplication, Form Builder, blocs de formulaire, aide landing pages, templates.mailchimp.com. Les entrées correspondantes sont en statut O ou N.
- Documentation développeur (mailchimp.com/developer/marketing) : seulement les titres vus dans les résultats ; aucune spécification d'API vérifiée. Les mentions API (forget contact, trigger de flux, événements, account exports) sont donc au mieux O.
- Aucune confirmation officielle pour : segments « statiques/dynamiques » (terminologie), exigences d'offre des segments prédictifs, blocs de contenu individuels réutilisables, vérificateur d'accessibilité dédié, contrôle de spam dans l'éditeur.
- Aucune dépendance par pays vérifiée, hormis le double opt-in possiblement par défaut pour une adresse principale dans l'UE et les contraintes SMS (programme approuvé). Disponibilité de la fonction par pays : non documentée dans les pages lues.
- Divergences entre sources : plan requis pour Inbox Preview (payant mensuel / Essentials+ / Standard+) ; critère de Send Time Optimization (clics vs ouvertures) ; nom du produit (Customer Journeys vs Marketing Automation Flows). Plan Free pour automations non précisé.
- Valeurs de limites (250 contacts, 25 jetons, 30/80 champs, 60 groupes) relevées dans des pages parfois datées : à revérifier avant usage.
