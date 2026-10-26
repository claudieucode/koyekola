# 12 — Exploitation et déploiement

## Ce que cette mission change en production

| Changement | Nature | Risque | Retour arrière |
|---|---|---|---|
| Migration `111_message_reserve.sql` : colonne `mk_messages.claimed_at` (nulle par défaut) | additive, aucune ligne touchée | très faible | `ALTER TABLE mk_messages DROP COLUMN claimed_at` (SQLite ≥ 3.35) ; le code ignore la colonne si elle est vide |
| Comportement : connexion mobile, expéditeur, webhooks, fusion, réinscription, A/B, pause de réputation, vérification des liens | code | modéré (voir ci-dessous) | revenir au commit précédent ; aucune donnée n'est réécrite |

Les migrations marketing sont **figées** : une migration déjà appliquée ne doit jamais être modifiée (même un commentaire), sinon le serveur désactive tout le module marketing (incident du 2026-10-03). La 111 est nouvelle ; ne plus la modifier après publication.

## Effets visibles pour les utilisateurs

- **Domaine d'expédition d'un site** : si l'adresse d'un site utilise un domaine encore « À vérifier », l'envoi retombe sur l'identité de l'organisation. Vérifier les domaines dans Paramètres → Domaines avant de s'en étonner.
- **Application mobile** : la clé est maintenant propre à chaque utilisateur ; l'application doit se reconnecter une fois. Un membre sans droit d'administrer les clés reçoit 403.
- **Webhooks sortants** : un destinataire qui répond par une redirection reçoit une erreur définitive ; il faut indiquer l'adresse finale. Les erreurs 408 et 429 sont maintenant réessayées.
- **Formulaires** : une personne désinscrite qui se réinscrit reçoit un e-mail de confirmation, même si le formulaire n'avait pas de double confirmation.
- **Scénarios** : un nouveau scénario « transactionnel » ne peut être déclenché que par un événement de service ; les scénarios déjà créés ne sont pas modifiés.
- **Campagnes** : peuvent passer en pause automatiquement (message explicatif dans la campagne).

## Avant déploiement

1. Sauvegarde de la base : la commande de sauvegarde du Centre de gestion (ou copie du fichier `data/KOYEKOLA.db` à froid).
2. Fusionner `origin/main`, relancer les tests concernés (liste dans `11_TEST_STRATEGY.md`).
3. Pousser sur `main` (jamais de push forcé).
4. Après déploiement : `GET /sante` répond « ok », puis ouvrir Marketing → Campagnes et Marketing → Domaines.

## Tâches de fond

Le worker marketing doit tourner pour que les campagnes, les scénarios et les webhooks partent. Le tableau de bord signale l'état des files et des services. Variables d'environnement utiles : `ENCRYPTION_KEY` (secrets chiffrés, obligatoire pour les webhooks sortants), `SITE_URL` en https (liens de désinscription), `SMTP_*` ou la clé du fournisseur choisi.

## Surveillance conseillée

- campagnes en pause (message `reputation`) ;
- travaux « dead » de la file ;
- domaines qui repassent à « À vérifier » ;
- taux de plaintes et de rebonds par campagne (page de rapport).

## Restauration

Restaurer la sauvegarde de la base puis redéployer le commit précédent. Aucune migration de cette mission n'est destructive.
