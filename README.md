# KOLAKISA

Votre plateforme personnelle pour héberger, publier et vendre vos propres formations en ligne (catalogue, panier, paiement, lecteur vidéo, espace de création). **Un seul compte créateur** (vous) — ce n'est pas une place de marché multi-formateurs. Express + EJS + SQLite (`node:sqlite`), sans dépendance externe.

## Démarrer en local

```
npm install
npm run seed   # peuple la base avec votre compte créateur, des formations et des étudiants de démo (destructif)
npm run dev    # démarre le serveur avec rechargement automatique
```

Ouvrir http://localhost:3002

Comptes de démonstration (mot de passe pour tous : `password123`) :
- **Compte créateur (le vôtre)** : `claire@example.com` — c'est le seul compte avec accès à « Mon espace » (création de formations, chapitres, sous-chapitres). Il n'existe aucune inscription publique pour devenir créateur : ce rôle est réservé à ce compte unique.
- Étudiants de démo (comptes qui achètent/suivent des formations) : `julie@example.com`, `hugo@example.com`, `nadia@example.com`

Pour utiliser la plateforme avec votre propre identité, changez simplement le nom d'utilisateur/bio de ce compte depuis la base, ou adaptez `src/config/seed.js` avant de relancer `npm run seed`.

## Fonctionnalités

- Page d'accueil et catalogue public de **vos** formations, avec recherche, filtres (catégorie, niveau, prix), tri, et un bloc « À propos de vous »
- Fiche formation : programme en **chapitres et sous-chapitres**, avis notés, aperçus gratuits
- Panier + paiement par carte via **Stripe Checkout** (démonstration sans débit si Stripe n'est pas configuré, en local uniquement — voir plus bas)
- Espace étudiant : mes formations, suivi de progression, lecteur vidéo
- **Mon espace** (réservé à votre compte créateur) : création/édition de formation, upload de miniature et de vidéos, gestion du programme (chapitres, sous-chapitres, réordonnancement), publication, suivi des ventes

## Offres : prix promo avec dates

Dans **Mon espace → une formation → Offres**, vous créez une offre (nom, prix, début et fin facultatifs). Pendant sa période, le catalogue, la fiche, le panier, le paiement (Stripe compris), les e-mails et pages marketing affichent le prix de l'offre avec le prix habituel barré. Règles : une offre ne peut que **baisser** le prix standard (la formation garde son prix), la moins chère l'emporte si plusieurs sont actives, la fin est incluse (toute la journée choisie, heure de Paris). Les codes promo s'appliquent **par-dessus** le prix de l'offre. La commande conserve l'offre appliquée (`order_items.offer_name`), visible dans le détail de la commande et dans **Centre de gestion → Analytics → Ventes par offre**. Si le prix change entre l'affichage du paiement et le clic (fin d'offre), le client voit le nouveau total avant de payer. La règle de prix est dans `src/services/pricing.js` (et `pricingSql.js` pour le tri du catalogue).

## Paiement : Stripe Checkout

Avec `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` (voir `.env.example`), « Payer » envoie le client sur la page de paiement hébergée par Stripe. Aucune donnée de carte ne passe par ce site. Les montants (prix, code promo) sont calculés par le serveur ; la commande et l'accès à la formation ne sont créés qu'après la confirmation de Stripe (webhook signé `POST /stripe/webhook`, ou relecture de la session au retour du client).

Configuration dans le tableau de bord Stripe : ajouter un point de terminaison webhook `<SITE_URL>/stripe/webhook` avec les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` et `checkout.session.expired`, puis copier son « secret de signature » dans `STRIPE_WEBHOOK_SECRET`. Commencez par les clés de **test** (`sk_test_…`, carte `4242 4242 4242 4242`).

Sans clé Stripe : en local, le paiement reste une **démonstration** (rien n'est débité) ; **en ligne** (`NODE_ENV=production` ou `SITE_URL` en https), toute commande payante est refusée. Les commandes gratuites (formation à 0 € ou code promo à 100 %) ne passent pas par Stripe. Un paiement encaissé dont le montant ne correspond pas, ou dont la formation a été supprimée, n'ouvre aucun accès et est signalé dans les journaux : à vérifier et rembourser dans Stripe.

## Publier le site en ligne

Guide complet pour **Hostinger** : [DEPLOIEMENT-HOSTINGER.md](DEPLOIEMENT-HOSTINGER.md) (GitHub, variables d’environnement, création du compte formateur, test de persistance des données, sauvegardes).

Commandes utiles :

- `npm run creer-formateur -- email pseudo motdepasse` : crée ou met à jour le compte formateur **sans rien effacer** (contrairement à `npm run seed`, à ne jamais lancer en ligne).
- `npm run sauvegarde` : sauvegarde de la base dans `data/backups/`.
- `GET /sante` : page de contrôle (`{"statut":"ok"}`).

Variables d’environnement : voir `.env.example`.
