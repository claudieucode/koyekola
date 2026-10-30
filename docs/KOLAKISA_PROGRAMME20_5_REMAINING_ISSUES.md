# Programme 20.5 — problèmes résiduels, limites et dépendances externes

## Dépendances externes (rien n'est « prêt » sans elles)
| Dépendance | Effet tant qu'elle manque |
|---|---|
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + webhook déclaré chez Stripe (`<SITE_URL>/stripe/webhook`) | le paiement par carte n'est pas proposé ; seul le paiement manuel fonctionne |
| `SMTP_HOST` (+ `SMTP_*`) | les notifications sont mises en file puis **ignorées** (journal « non configuré ») ; rien n'est annoncé comme envoyé |
| Module « Commerce » activé pour le site (équipe) et boutique ouverte | boutique publique en 404 |
| HTTPS / domaine du site (voir TITAN XXXII) | la boutique d'un site n'est joignable que par son domaine **vérifié** |
| Validation fiscale par un professionnel | aucun taux n'est fourni ni garanti |

## Non testé contre le réel
Aucune requête vers le vrai Stripe (faux serveur local uniquement) ; aucune transaction financière ; aucun envoi d'e-mail réel ; aucun test sur la base de production.

## Fonctions absentes ou partielles
- Produits **téléchargeables** (livraison de fichier, lien expirant) et **groupés** : refusés par le service. Un produit « numérique » n'a aucune livraison de fichier : l'acheteur reçoit la confirmation ; le fichier doit être transmis autrement.
- **Remboursement émis depuis Kolakisa** : non ; l'administrateur l'effectue chez le fournisseur ; Kolakisa l'enregistre (ou le reçoit par webhook `charge.refunded`). Remboursement partiel : noté dans l'historique seulement.
- Autres passerelles de paiement (PayPal, Mobile Money…) : absentes. Une seule paire de clés Stripe pour toute la plateforme (pas de compte Stripe par boutique).
- **Avis clients, produits associés intelligents (upsells/cross-sells)** : seuls les « produits associés » par catégorie existent sur la fiche. Pas d'avis.
- **Import/export de produits** (CSV), duplication d'un produit, modification en masse : absents.
- **Factures/PDF**, avoirs, numérotation comptable : absents.
- **Taxes** : une règle par commande, pas de cumul, pas d'exonération, pas de TVA intracommunautaire/OSS.
- **Livraison** : pas de transporteur en direct ni d'étiquettes ; pas de frais par produit ni par dimensions.
- **Devises** : celle de la boutique ; seul l'euro est testé ; `{{product.price}}` utilise le format de la devise de la boutique ; l'ancien alias formation reste en euros.
- **Commandes sans stock géré** : aucune limite d'achat par client.
- **Mot de passe client** : 10 caractères minimum, pas de double authentification ; limitation de débit en mémoire (réinitialisée au redémarrage).
- **Emails** : texte brut uniquement (limite de la file existante) ; pas de modèle graphique.
- **Page Builder** : les éléments de boutique n'ont pas de « parties » stylables individuellement (`parts.js`) ; styles généraux du bloc et responsive communs à tous les éléments. Les pages Panier, Commande, Compte et Confirmation sont des pages **serveur** (non éditables dans l'éditeur) ; l'éditeur propose des liens et une grille, pas un formulaire de caisse embarqué.
- **Theme Builder (20.3 non réalisé)** : les modèles restent un réglage d'**organisation** ; Kolakisa ne les filtre par site que pour la boutique (`pick(…, { siteId })`). Pas d'exclusions ni de ET/OU dans les conditions ; le rendu d'un modèle produit n'est pas encore prévisualisé avec un vrai produit dans l'éditeur (`previewScope` non étendu).
- **Bibliothèque de templates (20.4 non réalisé)** : aucun kit « boutique » n'est fourni ; à construire sur 20.4.
- **Site principal** : sa boutique `/boutique` cohabite avec le commerce des formations (`/panier`, `/commande`) qui reste séparé et inchangé ; deux paniers distincts.
- **Vidage de session** : le panier est lié à un cookie ; vidé si le visiteur supprime ses cookies.
- **Concurrence multi-processus** : SQLite synchrone dans un seul processus Node ; une exécution en plusieurs processus exigerait de revoir les transactions (`BEGIN IMMEDIATE`).
- **Indexation SEO** : pas de plan du site ni de données structurées (schema.org Product) pour les produits.
- **Tests de navigateur** : le panier mobile a été corrigé après mesure ; pas de test d'accessibilité automatisé (lecteur d'écran) au-delà des repères (titres, libellés, lien d'évitement, rôles).

## Risques
1. Webhook partagé avec les formations : l'aiguillage `shop:` est testé, mais tout changement du webhook doit rejouer `paiement-stripe`, `commerce-par-site`, `tunnel-paiement`.
2. Une commande « en attente » réserve du stock jusqu'à annulation/expiration (60 min pour la carte, **sans limite** pour le paiement manuel : à surveiller).
3. Numérotation : compteur par boutique, incrémenté dans la transaction de commande ; non rétroactif.
