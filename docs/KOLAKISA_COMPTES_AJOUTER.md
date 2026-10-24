# Utilisateurs → Ajouter un compte

Écran : `/marketing/site-web/utilisateurs/nouveau` (central) et `/marketing/site-web/sites/<id>/equipe-ajouter` (espace d'un site). Permission : `users.create`.

- **Moteur** : `src/services/accounts.js` (validation, quota 30 comptes/heure/administrateur, création transactionnelle, jeton d'activation, résumé honnête de la notification). Écran partagé : `src/marketing/web/accountNew.js`.
- **Champs** : identifiant (jamais modifié en silence), e-mail (normalisé, unique sans tenir compte de la casse), prénom, nom, site web (http/https), langue (langues réellement prises en charge), mot de passe (haché bcrypt ; masqué par défaut, afficher/masquer, générateur `crypto.getRandomValues`, jauge indicative).
- **Rôle** : par défaut « Compte ordinaire » (aucun accès à l'administration). Un rôle n'est attribuable que s'il ne dépasse pas les droits de l'acteur (`assertCanGrantRole`) ; jamais Super administrateur pour un seul site ; jamais de rôle global privilégié.
- **Multisite** : dans l'espace d'un site, le site vient de l'adresse (le champ du formulaire est ignoré) ; le rôle est un rôle de site.
- **E-mail** : jamais le mot de passe. Lien personnel (7 jours, empreinte seule en base) pour choisir son mot de passe + lien de confirmation. Sans serveur d'e-mail, le message le dit et le lien est montré à l'administrateur ; « en file d'envoi » = accepté, pas lu.
- **Double envoi** : identifiant de formulaire à usage unique + unicité en base.
- **Base** : colonnes ajoutées à `users` : `first_name`, `last_name`, `website`, `language`.
- **Limite** : un compte sans rôle n'apparaît pas dans la liste de l'équipe (seulement dans la gestion des élèves) ; l'écran de confirmation le précise.
- Tests : `tests/compte-ajouter.test.js`.
