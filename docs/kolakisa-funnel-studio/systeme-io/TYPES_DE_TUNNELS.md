# Types de tunnels

Source principale : https://help.systeme.io/article/147-how-to-create-a-funnel (création : Sites > Sales funnels > Create ; champs Name, Domain, Currency ; quatre types). Source marketing : https://systeme.io/features (tunnels opt-in, de vente, de webinaire).

Convention : `H147`, `H252`, `H265` = https://help.systeme.io/article/ suivi du numéro (147-how-to-create-a-funnel, 252-how-to-create-an-order-form-payment-page, 265-how-to-create-automated-webinars).

Rappel : un type de tunnel n'est qu'un gabarit initial d'étapes. Les types d'étapes (Opt-in page, Sales page, Order form, Upsell, Downsell, Thank You, etc.) sont détaillés dans ETAPES_ET_PARCOURS.md. Rien ne démontre publiquement qu'un tunnel d'un type donné soit restreint à ses pages initiales (le type « Custom » permet d'ajouter n'importe quelle étape via « + Add step »). Pour les autres types : À VÉRIFIER (essayer « Add step » dans un tunnel « Build an Audience »).

## 1. « Build an Audience »

- Structure : page **Opt-in** + page **Thank you**. Usage : développer la liste d'e-mails. Source : H147.
- Parcours visiteur (déduit des sources, étapes citées) :
  1. Le visiteur arrive sur la page opt-in (URL publique de l'étape ; domaine choisi à la création).
  2. Il remplit le formulaire (au moins un champ de type Email obligatoire, sinon erreur « At least one email input is required on this page »). Sources : https://help.systeme.io/article/1602-how-to-build-your-contact-list-using-a-sales-funnel ; https://help.systeme.io/article/623-what-does-it-mean-when-the-error-at-least-one-email-input-is-required-on-this-pags-is-displayed-on-one-of-your-pages.
  3. Le bouton, réglé sur l'action « Submit form », enregistre le contact dans la liste (et déclenche les règles « Funnel step form subscribed »), puis redirige : « To the next step », « To the custom URL » ou « No redirection » (message sur place). Source : article 1602.
  4. Si le double opt-in est activé : un e-mail de confirmation est envoyé ; sans clic sous 24 h le contact est supprimé de la liste (article 1602). Détails : À VÉRIFIER (article « How to set up double opt-in » non lu).
  5. Page Thank you.
- Automatisations typiques : e-mail automatique (https://help.systeme.io/article/280-how-to-send-an-automatic-email-when-a-lead-subscribes).

## 2. « Sell »

- Structure préconfigurée : page **Order form** + page **Thank you**. Usage : générer des ventes. Source : H147.
- Parcours visiteur :
  1. (Optionnel, hors gabarit) page de vente : bouton avec action « Open URL » vers l'URL du formulaire de commande (https://help.systeme.io/article/330-how-to-link-between-the-pages-of-a-funnel).
  2. Order form : choix du type d'offre (Digital product / Physical product), plan(s) tarifaire(s), coupon, order bump éventuels (https://help.systeme.io/article/252-how-to-create-an-order-form-payment-page). Variante « Two-step order form » : coordonnées d'abord (le contact est ajouté même sans achat), puis paiement (https://help.systeme.io/article/235-what-is-two-step-order-form).
  3. Paiement validé : redirection vers l'upsell s'il existe ; upsell accepté vers remerciement ; refusé vers downsell puis remerciement ; sinon page de remerciement par défaut (article 330).
  4. Page Thank you (élément « Order Summary » possible, uniquement sur une « Sales Thank You » : https://help.systeme.io/article/352-how-to-add-the-order-summary-on-the-thank-you-page).
  5. Livraison : l'accès à la ressource (cours, tag, communauté...) est donné après paiement ; produit physique : expédition hors systeme.io (H252).
- Passerelles : cartes (Stripe) et PayPal activables dans Funnel settings (https://help.systeme.io/article/307-how-to-activate-payments-by-stripe-or-paypal). Détails : PRODUITS_ET_PAIEMENTS.md.

## 3. « Custom »

- Canevas vierge ; nouvelle page via le bouton **« + Add step »**. Source : H147.
- Parcours visiteur : entièrement défini par l'utilisateur (liens de boutons, redirections). Le comportement automatique après paiement (upsell/downsell/thank you) est décrit dans article 330 pour une séquence opt-in > sales > order form > upsell > downsell > thank you.
- Un article produit physique propose « Sell » ou « Custom » (H292).

## 4. « Run an evergreen webinar »

- Structure : 3 pages (inscription, remerciement/« thank you », « conference »). Disponible uniquement avec les plans **Webinar** et **Unlimited**. Sources : H147 ; https://help.systeme.io/article/265-how-to-create-automated-webinars.
- Parcours visiteur :
  1. Page d'inscription : formulaire dans une **popup** (Popups > + > Edit popup settings) avec un élément de date « Webinar registration date » à configurer obligatoirement (H265).
  2. Le visiteur choisit une session : seules les sessions du jour sont proposées (« Today at 2:00 PM ») ; pas de date calendaire fixe (H265).
  3. Page « thank you », puis page « conference » : accessibles uniquement après inscription (pas par URL directe) (H265).
  4. Code personnalisé au démarrage : article 2463 listé, non lu ; À VÉRIFIER.
- Limites : un seul webinaire par tunnel ; pas de webinaire en direct ; l'article ne détaille pas les options de session/horaires (H265). Événement webhook `contact.webinar.registered` : voir INTEGRATIONS_ET_API.md.

## 5. Autres usages mentionnés (non types de création)

- « Tunnels de lancement de produit » cités dans la FAQ marketing (https://systeme.io/features). Pas de type distinct documenté. À VÉRIFIER.
- Types d'étapes supplémentaires via l'API/MCP : lien en bio, page d'information, formulaire intégré, formulaire popup (https://help.systeme.io/article/11408-how-to-manage-your-funnels-with-the-systeme-io-mcp-server).
- Un tunnel de « moins de 5 pages » est présenté comme adapté à un site simple (« up to 5 », formulation ambiguë) : https://help.systeme.io/article/1005-when-to-use-the-sales-funnel-feature-and-the-blog-feature. Ne pas en déduire une limite technique : À VÉRIFIER.

## 6. Tableau comparatif

| Critère | Build an Audience | Sell | Custom | Run an evergreen webinar |
|---|---|---|---|---|
| Pages initiales | Opt-in, Thank you | Order form, Thank you | aucune (vierge) | 3 : inscription, thank you, conference |
| But documenté | liste e-mail | ventes | libre | webinaire evergreen |
| Plan requis | non précisé (Free : 3 tunnels) | idem | idem | Webinar ou Unlimited |
| Paiement | non | oui | selon étapes ajoutées | non documenté |
| Particularités | formulaire + redirection | upsell/downsell/bump/coupon | « + Add step » | popup d'inscription + date ; sessions du jour |

Source de la table : H147, H265, https://systeme.io/pricing.
