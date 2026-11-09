# Surveillance de la qualité (chantier 15)

## Constat du 8 novembre 2026
Le contrôle automatique GitHub (`.github/workflows/tests.yml`) **n'a pas démarré une seule fois** sur les 40 derniers envois : GitHub répond
« The job was not started because recent account payments have failed or your spending limit needs to be increased ».
Le site se met à jour tout seul à chaque envoi sur `main` (déploiement Git de Hostinger) sans attendre ce contrôle : pendant ce temps, aucune régression n'a été signalée automatiquement
(exemples réels : états d'en-tête supprimés, enveloppe de l'en-tête perdue, condition « visiteur » écrite deux fois).

**À faire par le propriétaire du compte GitHub** : GitHub → Settings → Billing and plans → vérifier le moyen de paiement et la limite de dépense des Actions (ou rendre le dépôt public, ce qui rend les minutes gratuites). Dès que c'est réglé, le contrôle repart sans autre changement.

## Ce qui est en place maintenant (sans GitHub)
| Outil | Commande | Durée | Ce qu'il attrape |
|---|---|---|---|
| Contrôle rapide | `npm run controle` | quelques minutes | JavaScript invalide, vue EJS qui ne compile plus, états d'en-tête disparus, classe « collé » perdue, 6 suites ciblées (réglages d'en-tête, widgets d'en-tête, condition visiteur, conditions du pied de page, isolation des conteneurs, enveloppe publique de l'en-tête) |
| Contrôle rapide + Chrome | `npm run controle -- --navigateur` | plus long | idem + 3 parcours dans un vrai navigateur (états d'en-tête, panneau en-tête, panneau pied de page) |
| Santé du site en ligne | `npm run sante` | quelques secondes | pages clés (accueil, connexion, catalogue, blog, feuilles de style et scripts) : code 200 et moins de 2,5 s |

## Règle de travail
Avant tout envoi sur `main` : `npm run controle`. Après chaque déploiement : `npm run sante`.
Le contrôle n'est PAS branché automatiquement sur l'envoi (plusieurs sessions poussent en parallèle : un blocage automatique les gênerait mutuellement) ; il est lancé volontairement.

## Limites
- Il ne remplace pas la suite complète (`npm test`, environ 2 500 tests, très longue sur cette machine partagée).
- Pas de mesure de vitesse chiffrée (Lighthouse) : seule la durée de réponse des pages clés est mesurée.
- Une dizaine de tests de la bibliothèque du Theme Builder échouent encore (voir le rapport du 8 novembre) : le contrôle rapide ne les inclut pas pour ne pas rester rouge en permanence.
