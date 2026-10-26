# 02 — Spécifications fonctionnelles

Le comportement du module existant est décrit par les documents historiques à la racine du dépôt : `EMAIL_MARKETING_ARCHITECTURE.md`, `_DATABASE.md`, `_ENVOI.md`, `_AUTOMATIONS.md`, `_MODELES.md`, `_CONFORMITE.md`, `_API.md` et `SMS_MARKETING.md`. Ils restent la référence ; ce fichier ne les recopie pas. Il consigne les **règles ajoutées ou précisées par cette mission**, avec leurs critères d'acceptation et leur test.

## F1 — Valeur probante d'un gagnant A/B

- **Règle.** Le gagnant désigné automatiquement reste la meilleure version selon le critère choisi (l'envoi du reste de la cible n'est jamais bloqué), mais le rapport indique si l'avantage est établi.
- **Méthode.** Comparaison du gagnant à la meilleure autre version : test du Z sur deux proportions à 95 % (`pages/abstats.js`), valable si chaque version compte au moins 5 conversions et 5 non-conversions.
- **Niveaux.** `significant`, `not_significant`, `insufficient`, `not_tested` (revenu, choix manuel). Les ouvertures sont toujours signalées comme indicatives.
- **Acceptation.** 2 destinataires par version → « données insuffisantes » ; 2 000 envois par version avec 100 contre 180 clics → « significatif » ; 300 envois avec 30 contre 36 clics → « non significatif, peut venir du hasard ».
- **Test.** `tests/marketing-ab-preuve.test.js`.

## F2 — Pause automatique de réputation

Voir `07_DELIVERABILITY.md`. Acceptation : après 100 envois, 3 plaintes sur 1 000 (0,3 %) ou 50 rebonds permanents sur 1 000 (5 %) mettent la campagne en pause avec un message explicite ; 2 plaintes ou 49 rebonds ne font rien ; une campagne qui n'est pas en cours d'envoi n'est jamais touchée ; après reprise manuelle le garde ne recoupe qu'au double du seuil. Test : `tests/marketing-reputation.test.js`.

## F3 — Contrôle HTTP des liens d'un e-mail

- **Parcours.** Éditeur → Aperçu → panneau « Liens » → bouton « Vérifier que les liens répondent ».
- **Règles.** Adresses http(s) distinctes du message rendu, hors liens système ; 25 adresses au plus ; HEAD puis GET si HEAD est refusé ; 3 redirections au plus ; 6 secondes par adresse ; le corps de la page n'est jamais lu ; chaque saut est revérifié contre les adresses internes ; 6 vérifications par heure et par personne ; droit `templates.write`.
- **États.** Répond, ne répond pas correctement (404/410, adresse interne), à vérifier à la main (401/403/429, erreur serveur, délai, nom introuvable).
- **Tests.** `tests/marketing-linkcheck.test.js`, `tests/marketing-linkcheck-route.test.js`.

## F4 — Refus conservés lors d'une fusion de contacts

Acceptation : désinscrit d'une liste, d'une catégorie ou globalement sur la fiche absorbée → la fiche conservée n'est pas joignable pour cette liste, cette catégorie ou globalement. Test : `tests/contacts-fusion-refus.test.js`.

## F5 — Réinscription d'une personne désinscrite

Acceptation : un formulaire sans double confirmation, soumis avec l'adresse d'une personne désinscrite, produit une demande de confirmation (état « en attente ») au lieu d'un abonnement ; la case d'inscription au LMS ne réabonne pas une adresse désinscrite. Test : `tests/contacts-fusion-refus.test.js`.

## F6 — Scénarios transactionnels

Acceptation : un scénario « transactionnel » n'accepte que les déclencheurs de `SERVICE_TRIGGERS` (`automations/catalog.js`) ; un déclencheur d'abandon, de favori, de score, d'étiquette ou de visite est refusé avec un message qui renvoie vers le type Marketing. Test : `tests/marketing-automations.test.js`.

## F7 — Étape d'e-mail de scénario sans doublon

Acceptation : le message est réservé (`claimed_at`) juste avant l'appel au fournisseur ; une erreur connue qui permet de réessayer lève la réservation ; un message resté réservé après une interruption est marqué « échoué (interrompu) » et n'est jamais renvoyé. Test : `tests/marketing-automations.test.js`.
