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
- Panier + paiement **simulé** (aucune carte n'est réellement débitée — voir plus bas)
- Espace étudiant : mes formations, suivi de progression, lecteur vidéo
- **Mon espace** (réservé à votre compte créateur) : création/édition de formation, upload de miniature et de vidéos, gestion du programme (chapitres, sous-chapitres, réordonnancement), publication, suivi des ventes

## Paiement : ce qui est simulé

Aucun prestataire de paiement n'est branché : une commande inscrit l'élève sans débiter de carte (aucun champ de carte n'est affiché).

- **En production** (`NODE_ENV=production`), les commandes payantes sont **refusées** : la fiche d'une formation payante affiche « L'achat en ligne ouvre bientôt » et un lien vers le contact. Les commandes à 0 € (formations gratuites, code promo à 100 %) restent possibles.
- `PAIEMENT_SIMULE=1` rouvre le mode démonstration en production (commande payante validée sans paiement) : à ne jamais utiliser avec de vrais clients.
- En développement et dans les tests, le mode démonstration reste ouvert.

Pour accepter de vrais paiements, il faut brancher un prestataire (Stripe Checkout est le plus simple à intégrer).

## Publier le site en ligne

Guide complet pour **Hostinger** : [DEPLOIEMENT-HOSTINGER.md](DEPLOIEMENT-HOSTINGER.md) (GitHub, variables d’environnement, création du compte formateur, test de persistance des données, sauvegardes).

Commandes utiles :

- `npm run creer-formateur -- email pseudo motdepasse` : crée ou met à jour le compte formateur **sans rien effacer** (contrairement à `npm run seed`, à ne jamais lancer en ligne).
- `npm run sauvegarde` : sauvegarde de la base dans `data/backups/`.
- `GET /sante` : page de contrôle (`{"statut":"ok"}`).

Variables d’environnement : voir `.env.example`.
