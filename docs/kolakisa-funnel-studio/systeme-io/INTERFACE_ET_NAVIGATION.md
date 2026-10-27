# Interface et navigation (tunnels de vente)

Préfixe des sources : `H` = https://help.systeme.io/article/ (suivi du numéro-slug).

## 1. Navigation générale

Libellés de menus cités dans les articles lus :
- Onglet **Sites** > **Sales funnels** (liste des tunnels). Source : H147-how-to-create-a-funnel, H277-how-to-activate-a-funnel.
- Menu **CRM** > **Contacts**. Source : H348-how-to-automatically-and-manually-add-tags-to-your-contacts.
- Onglet **Emails** > **Campaigns** ; **Emails** > **Newsletters**. Sources : H367-how-to-set-up-an-email-campaign, H1335-how-to-use-the-email-editor.
- Onglet **Automations** > **Rules** / **Workflows**. Sources : H140-automation-rules, H1542-workflow-feature.
- Onglet **Assets** > **Coupons** ; **Assets** > **Physical products**. Sources : H247-how-to-create-and-add-a-coupon-code-to-your-order-form, H292-how-to-create-and-sell-a-physical-product-on-systeme-io.
- Menu **Sales** > **Transactions** (et Ventes > Commandes pour les produits physiques). Sources : H151-how-to-make-a-test-purchase, H292-....
- Menu **SMS** > **SMS Templates** / **Statistics**. Source : H4483-how-to-send-sms-messages-with-systeme-io.
- Photo de profil > **Settings** (dont Sales Funnels, Webhooks, Payment Gateways, Custom Domains, MCP & API keys, Sous-comptes). Sources : H306-is-it-possible-to-insert-html-css-or-js-code, H2930-how-to-use-systeme-ios-webhook-service, H225-how-to-connect-your-stripe-account-to-systeme-io, H1719-facebook-conversions-api, H2323-how-to-create-a-public-api-key-on-systeme-io, H4243-how-to-create-a-sub-account-on-systeme-io.
- Les articles se contredisent légèrement sur le chemin des domaines ("Settings > Custom Domains" / "Paramètres > Domaine personnalisé"). Les deux désignent le même écran. À VÉRIFIER dans un compte gratuit.

Un article cite aussi un menu supérieur « Funnels » (H231-how-to-connect-a-sales-funnel-or-a-page-to-your-website). À VÉRIFIER : probablement la barre de l'éditeur de tunnel.

## 2. Liste des tunnels

- Objectif : voir, filtrer, gérer les tunnels.
- Actions : menu "..." par tunnel : **Activate** (avec confirmation **Confirm**, notification de succès), **Share**, **Settings**. Filtre déroulant avec valeur **Inactive** puis bouton **Filter**. Source : H277-how-to-activate-a-funnel ; H148-how-to-share-a-sales-funnel ; H345-how-to-change-the-domain-name-of-a-funnel.
- Valeurs de filtre autres qu'« Inactive » : À VÉRIFIER (compte gratuit).
- Limites : nombre de tunnels par plan : Free 3, Startup 10, Webinar 50, Unlimited illimité (https://systeme.io/pricing). Message d'erreur en cas de dépassement : non documenté, À VÉRIFIER. Conséquences du dépassement de plan : voir PERMISSIONS_ET_SECURITE.md.

## 3. Création d'un tunnel

- Parcours : Sites > Sales funnels > **Create** ; fenêtre avec **Name**, **Domain**, **Currency**, puis choix d'un des quatre types (voir TYPES_DE_TUNNELS.md). Source : H147-how-to-create-a-funnel.
- Validations/erreurs : non documentées. Le type « Run an evergreen webinar » exige le plan Webinar ou Unlimited (H147, H265-how-to-create-automated-webinars).
- Relations : la devise du tunnel doit correspondre à celle du produit physique vendu (H292).

## 4. Paramètres du tunnel (« Funnel settings »)

- Accès : ouvrir un tunnel > **Funnel settings**, ou menu "..." > **Settings**. Source : H345, H307-how-to-activate-payments-by-stripe-or-paypal.
- Paramètres confirmés : choix du **domaine** (appliqué à toutes les pages du tunnel ; le domaine doit déjà être connecté) ; cases **Credit card or debit card** et **PayPal** ; **Deadline settings** (H1574-how-to-create-a-deadline-for-a-sales-funnel) ; zone de code de suivi dans Settings > Sales Funnels (global) (H306).
- Liste complète des réglages : À VÉRIFIER (compte gratuit).

## 5. Gestion des pages d'un tunnel

- Ajouter : bouton **Add step** (menu de gauche) > fenêtre « Create funnel step » avec champ **Type**, choix d'un modèle ou page vierge, **Save** ; **Select** pour choisir un modèle ; **Edit page**. Sources : H252-how-to-create-an-order-form-payment-page, H243-how-to-create-an-upsell-and-a-downsell.
- Déplacer vers un autre tunnel : "..." > **Move** > choisir le tunnel > **Save** (la page quitte le tunnel d'origine). Dupliquer : "..." > **Duplicate** (copie « (copy) »). Supprimer : "..." > **Remove** > **Confirm** (définitif). Source : H305-how-to-move-duplicate-delete-page-from-sales-funnel.
- Chemin d'URL : champ **URL Path**, enregistré automatiquement, majuscules interdites. Le nom de la page s'enregistre aussi automatiquement. Source : H322-how-to-change-the-url-path-of-a-page.
- Pages en test A/B : duplication possible, suppression et déplacement impossibles (H218-how-to-create-a-split-test).
- Favicon : article 150-how-to-change-the-favicon-of-my-pages listé mais non lu. À VÉRIFIER.

## 6. Partage d'un tunnel

- Menu "..." > **Share** : une fenêtre affiche une URL à copier. Le destinataire, connecté à son compte systeme.io, colle le lien dans son navigateur ; une notification confirme l'ajout et le tunnel apparaît dans sa liste. Source : H148-how-to-share-a-sales-funnel.
- Limites : le lien de partage est un lien d'affiliation (« Sales funnel-sharing links are affiliate links »). Droits du destinataire, nombre de partages : non documentés, À VÉRIFIER.
- Une page seule peut aussi être partagée (article 323-how-to-share-a-page listé, non lu).

## 7. Domaines

- Connexion d'un domaine : Settings > Custom Domain > **Add domain** ; saisir le domaine **avec le préfixe www** ; deux enregistrements CNAME à créer chez l'hébergeur DNS ; propagation généralement 24 à 48 h ; domaine racine par redirection ; un domaine = un seul site. Source : H135-how-to-connect-your-domain-to-systemeio.
- Erreur « domaine non approuvé » : CNAME absents/incorrects, propagation incomplète, domaine ajouté sans www ; approbation sous 24 h si la config est valide. Source : H347-my-domain-name-is-not-approved.
- Le plan Free inclut 1 domaine personnalisé (https://systeme.io/pricing). Limites des autres plans : À VÉRIFIER.
- Lien d'un site externe vers un tunnel : copier l'URL d'une étape (icône de copie à côté du chemin) (H231).
- Intégrer un formulaire/popup sur un site externe : voir FORMULAIRES_ET_CONTACTS.md.
