# Upsells, downsells et order bumps

Préfixe `H` = https://help.systeme.io/article/

## 1. Upsell et downsell (étapes de tunnel)

Source : H243-how-to-create-an-upsell-and-a-downsell. Ventes additionnelles « en un clic » (https://systeme.io/features).
- Création : Add step > fenêtre « Create funnel step » > Type = Upsell ou Downsell > modèle ou vierge > Save > Select > panneau de configuration (règles d'automatisation et paramètres) > Edit page.
- Offre : **Digital product** (« + » ; ressource Courses, Course bundles, Tags, Communities ; plans tarifaires) ou **Physical product** (produit existant ; boutons **Accept** et **Decline** à ajouter dans l'éditeur).
- Ordre : upsell après l'order form principal ; downsell après l'upsell.
- Comportement : clic sur **Accept** déclenche le paiement ; transaction séparée de la commande principale (facturations distinctes).
- Enchaînements automatiques (H330-how-to-link-between-the-pages-of-a-funnel) : paiement validé vers upsell ; accepté vers thank you ; refusé vers downsell puis thank you.
- Limites : pas de Calendar Event en upsell/downsell. Pour un produit numérique, le mécanisme de refus (bouton, redirection) n'est pas décrit : À VÉRIFIER. Nombre d'upsells en chaîne, paiement avec la carte enregistrée sans ressaisie, comportement avec PayPal : non documentés (À VÉRIFIER avec achat test).
- Éviter de confondre : les facturations multiples ont pour conséquence que des processeurs comme PayPal n'affichent que le prix de l'offre principale dans leur fenêtre (H154).

## 2. Order bump

Source : H154-how-to-add-an-order-bump-to-a-payment-page.
- Création : ouvrir l'order form > bouton **Add order bump** > **Choose offer type** : Physical product / Digital product.
- Ressource numérique : Courses, Course bundles, Tags, Communities (pas d'événement calendrier : message d'erreur).
- Prix : un **prix unique** obligatoire (un seul prix par bump) ; création via « How to create and configure a price plan » (H153).
- Affichage : glisser l'élément **Order bump** dans le corps de la page via l'éditeur.
- Automatisation : créer un tag « Order Bump », le donner via la ressource Tags, puis règle Automations > Rules avec déclencheur « Tag assigned » (libellé cité dans l'article ; ailleurs « Tag added » — À VÉRIFIER) et action « Send email » ou « Campaign ».
- Limites : livraison externe pour les produits physiques ; le bump et l'offre principale sont deux transactions distinctes.
- Nombre de bumps par order form : non documenté. À VÉRIFIER.

## 3. Relations

- Paiement : PRODUITS_ET_PAIEMENTS.md.
- Pixel/CAPI : le montant total (bumps et upsells présents au moment de l'achat) est envoyé dans un seul événement Purchase ; pas de suivi séparé (H1632-how-to-add-facebook-pixel-and-setup-events).
- Webhook `customer.sale.completed` contient `order` et `order_item` : voir INTEGRATIONS_ET_API.md. Si chaque upsell génère son propre événement : À VÉRIFIER.
