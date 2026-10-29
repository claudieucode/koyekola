# Intégrations et API

Préfixe `H` = https://help.systeme.io/article/

## 1. API publique

Source : H2323-how-to-create-a-public-api-key-on-systeme-io. Documentation officielle citée : https://developer.systeme.io/reference/api (non lue).
- Clé : photo de profil > Settings > **MCP & API keys** > section **Public API keys** > **Create** > nom unique, date d'expiration (vide = sans expiration) > Save. La clé n'est affichable qu'à la création. Maximum 3 clés par compte. Un e-mail est envoyé à chaque création.
- Méthode d'authentification (en-tête), versionnage, limites de débit, pagination, codes d'erreur : non documentés dans l'article. À VÉRIFIER dans la documentation développeur.
- Ressources (selon l'article) : contacts, tags, champs personnalisés, newsletters, campagnes (avec étapes), statistiques e-mail, tunnels et pages (création de tunnels, étapes opt-in et webinaire, listing, enregistrement du contenu en remplacement complet, schémas JSON), plans tarifaires et coupons, cours/modules/leçons, communautés, règles d'automatisation, abonnements tiers, webhooks, produits numériques et physiques (rattachement aux order forms, upsells, downsells), offres, paramètres de vente (order bumps, devise, moyens de paiement, taxes, commissions d'affiliation), réservations, modèles SMS.
- Limitations annoncées : modification et suppression des tunnels/étapes non prises en charge via MCP ; type d'événement de calendrier non modifiable via MCP. Portée exacte « API » vs « MCP » : À VÉRIFIER.

## 2. Webhooks

- Service de webhooks (Settings > Webhooks) — H2930-how-to-use-systeme-ios-webhook-service : Create > nom, URL, clé secrète, bouton Active, événements > Save. Événements : contact créé, tag ajouté, tag retiré, opt-in, nouvelle vente (tunnels et boutiques créateur), vente annulée (abonnement résilié ou remboursement). Logs : "..." > View logs (Message log, Delivery log, Copy log). URL HTTPS obligatoire. Relances : jusqu'à 12 nouvelles tentatives, délai croissant jusqu'à environ 24 h. Signature : non décrite (la clé secrète est saisie ; algorithme et en-tête à VÉRIFIER dans la documentation développeur). Limite du nombre de webhooks : non précisée.
- Action webhook dans règles/workflows — H144-how-to-create-and-trigger-a-webhook-after-an-opt-in-or-a-sale : requête HTTP en JSON vers l'URL saisie ; IP sources 185.236.142.1, 185.236.142.2, 185.236.142.3. Payload : `type`, `data`, `account`, `created_at`. Types cités : `contact.optin.completed`, `customer.sale.completed` (customer, funnel_step, offer_price_plan avec direct_charge_amount et currency, order, order_item, coupon), `contact.tag.added`, `contact.tag.removed`, `contact.webinar.registered`, `contact.course.enrolled`, `contact.course_bundle.enrolled`, `contact.campaign.finished`, `contact.page.visited`, `contact.email_link.clicked`. Méthode HTTP, en-têtes, authentification, retries de cette voie : non précisés. Les exemples de l'article datent de 2021.
- L'action webhook n'est pas transmise lors du partage d'un workflow (H1542-workflow-feature).

## 3. Serveur MCP

Source : H11408-how-to-manage-your-funnels-with-the-systeme-io-mcp-server. Serveur MCP natif, clé MCP générée dans le compte. Capacités : créer/lister/rechercher des tunnels, ajouter/lister étapes opt-in, créer pages de webinaire (inscription, remerciement, diffusion), régénérer le contenu d'une page de webinaire. Types d'étapes pris en charge : opt-in, opt-in thank you, lien en bio, page d'information, formulaire intégré, formulaire popup, pages de webinaire. Pas de modification partielle ni de suppression. Catégorie d'aide MCP (11 articles) : non lue.

## 4. Intégrations natives et tierces

- Marketing : liaison native avec e-mails, cours, pipeline CRM, calendrier de réservation, webinaires, sans Zapier (https://systeme.io/features).
- Paiement : Stripe, PayPal et autres (voir PRODUITS_ET_PAIEMENTS.md).
- SMS : Twilio (H4483).
- Meta : Pixel et CAPI (ANALYTICS_ET_CONVERSIONS.md).
- Google Sheets : action de workflow (H1542).
- Autorépondeur externe : article 628 ; ActiveCampaign : 1573 ; SendGrid : 134/637 — non lus.
- Zapier : l'API et les webhooks sont mentionnés comme voies d'import (H1086-what-happens-when-my-account-gets-restricted cite Zapier parmi les canaux d'ajout de contacts). Intégration Zapier officielle : À VÉRIFIER.
- Embarquement externe : script « Inline form » / « Popup form » (H266), lien vers une étape (H231).

## 5. Sécurité des appels

Voir PERMISSIONS_ET_SECURITE.md.
