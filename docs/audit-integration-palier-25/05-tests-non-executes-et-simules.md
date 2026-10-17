# Tests non exécutés, bloqués ou simulés (palier 25)

## A. Ce que prouvent les tests SIMULÉS — et ce qu'ils ne prouvent pas

| Scénarios | Ce qui est remplacé par un faux | Ce que le test PROUVE | Ce que le test NE PROUVE PAS |
|---|---|---|---|
| INT-COM-012, 013, 017, 018 | **Stripe** : un faux serveur HTTP local répond aux créations/lectures de sessions ; les webhooks sont signés par le test avec un secret de test | Notre code : montant fixé par le serveur, aucune commande ni accès avant confirmation, vérification de signature (HMAC, horodatage), idempotence, rejeu, concurrence, remboursement, session expirée, pont → événements → contact → Analytics | Que le vrai Stripe accepte nos requêtes (clés, page de paiement, domaine), que son webhook soit configuré et signé avec le bon secret, que la carte soit débitée. **En production, le webhook répond 503 : non configuré (G-01)** |
| INT-EML-011 | **Fournisseur d'e-mail** : le fournisseur « console » enregistre le message « sent » sans rien transmettre | Notre code : le consentement et la désinscription décident des destinataires ; un message est enregistré une seule fois ; l'absence de consentement bloque l'envoi ; le worker traite la file | Qu'un e-mail parte réellement, soit accepté par un fournisseur, soit livré ou lu ; SPF/DKIM/DMARC ; rebonds et plaintes réels |
| INT-AUT-010 | Aucun faux : worker réel du serveur de test, actions locales (étiquette) | Exécution réelle en tâche de fond d'un scénario, idempotence, journal | Le worker **de production** (valeur de `MARKETING_WORKER` inconnue) |

Tout état d'e-mail au-delà de « enregistré » ou « envoyé par la console » (**accepté par le fournisseur, livré, rejeté**) est **NON OBSERVÉ** dans ce palier.

## B. Scénarios prévus (palier 24, plan T01–T18) NON exécutés ou partiels

| Plan | Scénario | Statut | Raison précise | Méthode pour l'exécuter plus tard |
|---|---|---|---|---|
| T05 | E-mail réel avec SPF/DKIM | **BLOQUÉ PAR L'ENVIRONNEMENT** | Aucun fournisseur de test configuré ; envoi à de vrais destinataires interdit | Fournisseur d'e-mail en mode bac à sable ou boîte jetable ; domaine de test avec SPF/DKIM ; relancer INT-EML-011 en changeant le fournisseur |
| T06 | Reprise d'un scénario après redémarrage du serveur pendant une attente | **NON EXÉCUTÉ** | Nécessite d'arrêter et relancer un serveur de test en cours de scénario (non automatisé ici) | Test avec attente de 30 s, arrêt du worker, redémarrage, vérification de la reprise sans doublon |
| T07-T08 | Paiement et remboursement avec le vrai Stripe (mode test) | **BLOQUÉ PAR L'ENVIRONNEMENT** | Aucune clé de test Stripe fournie ; aucun paiement réel autorisé | Clés `sk_test_…` et webhook de test fournis par le propriétaire ; relancer INT-COM-012/013 sans le faux serveur |
| T09 | `cart.abandoned` et relance | **NON EXÉCUTÉ** | Le délai réglable minimal est de plusieurs heures ; testé en unitaire avec horloge simulée (`cms-commerce`) mais pas à travers HTTP | Réglage minimal du délai en environnement de test et avance d'horloge contrôlée |
| T10 | Événements `funnel.*` d'un visiteur identifié | **NON EXÉCUTÉ (partiel)** | La navigation est testée (INT-TUN-007) mais pas la liaison visiteur → contact → événements de tunnel au niveau HTTP ; couverte par `cms-orchestration` (suite existante) | Visiteur consentant qui soumet un formulaire puis parcourt le tunnel ; relire `mk_events` |
| T13 | Attribution d'un achat à une variante A/B | **NON EXÉCUTÉ** | Combine paiement simulé et test A/B ; couverte par `cms-abtest` (suite existante, en mémoire) | Achat d'un visiteur exposé, lecture de l'attribution dans les résultats |
| T15 | Sauvegarde puis restauration à blanc | **NON EXÉCUTÉ dans ce fichier** | Couverte par `tests/sauvegarde-restauration.test.js` (suite existante, verte) ; pas rejouée sur un environnement de production | Restauration sur une copie de la production par le propriétaire |
| T16 | Webhooks Resend / Twilio signés | **NON EXÉCUTÉ** | Les routes sont fermées (404) tant qu'un secret n'est pas configuré ; aucun secret de test fourni | Configurer un secret de test sur un serveur de test et envoyer des événements signés et non signés |
| T17 | Perte de travail dans l'éditeur (coupure réseau) | **NON APPLICABLE (fonction absente)** | Il n'existe pas de copie locale dans le Page Builder (G-12) | À écrire avec la correction |
| T18 | Régression visuelle éditeur / public | **NON EXÉCUTÉ** | Aucun seuil de comparaison défini ; nécessite des captures de référence | Définir des pages de référence et un seuil, comparer des captures Chrome |

## C. Ce qui n'est pas dans le périmètre de ces tests
- **Production** : aucun test n'a ciblé la production (seules des lectures simples avaient été faites au palier 24).
- **Fournisseurs réels** : Stripe, Resend, SMTP, Twilio, Anthropic, Google : jamais contactés.
- **SMS** : aucun scénario SMS (aucun envoi payant autorisé) ; couverts par les suites `marketing-sms*`.
- **Clavier / accessibilité écran par écran, performance en production** : hors de ce palier.
