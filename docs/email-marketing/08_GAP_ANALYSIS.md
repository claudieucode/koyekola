# 08 — Matrice des écarts par module

Sources : `00a_…` et `00b_…` (preuves fichier:ligne et noms de tests), `01a_…` et `01b_…` (capacités Mailchimp, à revérifier). État « après » = état à la fin de cette mission, avec la preuve entre parenthèses. Les codes d'état sont ceux de `00_SCOPE_AND_METHODOLOGY.md`.

## Vue d'ensemble

| # | Module | Avant | Après | Écart principal restant |
|---|---|---|---|---|
| 1 | Tableau de bord | V | V | pas d'indicateur de réputation d'expéditeur sur l'accueil |
| 2 | Contacts et audiences | V, 3 défauts | V | doublons flous, rebonds mous, export sans propriétés |
| 3 | Segmentation | V (moteur unique) | V | pas d'entrée/sortie de segment comme déclencheur ; pas de segments prédictifs |
| 4 | Campagnes | V | V | fuseau de programmation en UTC, pas de replanification, pas de récurrence |
| 5 | Éditeur visuel | V/I | V/I | texte brut non éditable, accessibilité partielle |
| 6 | Modèles | V (15 modèles) | V (15 modèles) | bibliothèque modeste, pas de modèles sectoriels |
| 7 | Personnalisation | V | V | pas de boucle ni de recommandation de produits |
| 8 | Tests A/B | P | V (valeur probante) | pas de test sur l'heure ou l'expéditeur |
| 9 | Automatisations | V, 1 défaut grave | V | ré-entrée, déclencheur calendaire |
| 10 | Formulaires | V | V | pas de CAPTCHA, limiteur en mémoire |
| 11 | Landing pages | V/I | V/I | domaine personnalisé par page |
| 12 | Délivrabilité | V, 5 défauts | V | échauffement d'IP, limitation par domaine destinataire, FBL hors Resend |
| 13 | Conformité | V, 2 défauts | V | rétention des événements d'e-mail |
| 14 | Statistiques | P | P | deux sources de chiffres, détection des ouvertures automatiques |
| 15 | CRM léger | V/I | V/I | — |
| 16 | E-commerce | V (LMS) / NI (externe) | idem | Shopify, WooCommerce : non connectés |
| 17 | SMS | V / BE | V / BE | confirmation du numéro par code ; opérateur réel non branché |
| 18 | API et webhooks | V, 3 défauts | V | pas d'API d'envoi, pas de rotation du secret de webhook |
| 19 | IA | V | V | — |
| 20 | Comptes et permissions | V, 1 défaut | V | — |
| 21 | Facturation et quotas | NI | NI | décision commerciale préalable (voir ci-dessous) |

## Défauts trouvés par l'audit et leur sort

Chaque ligne a été relue dans le code avant correction. « Test » = fichier de non-régression.

| Réf. | Gravité | Défaut | Sort | Test |
|---|---|---|---|---|
| 12-B1 | haute | Webhooks sortants : redirections suivies, IP non figée, plages CGNAT absentes | **corrigé** : redirections jamais suivies, connexion épinglée sur l'adresse validée, plages 100.64/10, 192.0.0/24, 198.18/15, 198.51.100/24, 203.0.113/24 refusées | `marketing-webhooks-durcissement.test.js` |
| 12-B2 | haute | Une personne désinscrite pouvait être réabonnée par un tiers (formulaire sans double opt-in, inscription au LMS) | **corrigé** : passage obligatoire par le lien de confirmation ; la case cochée à l'inscription ne réabonne pas | `contacts-fusion-refus.test.js` |
| 12-B3 | haute | Connexion mobile : 500 à la 2ᵉ connexion, révocation de toutes les clés, rôle ignoré | **corrigé** : une clé par utilisateur, anciennes clés renommées, droit `api_keys.manage` exigé | `marketing-mobile-auth.test.js` |
| 12-B4 | moyenne | Un scénario ne se déclenche qu'une fois par contact à vie | **non corrigé**, conception documentée ci-dessous | — |
| 12-B5 | moyenne | Domaine d'expédition non vérifié accepté (usurpation) | **corrigé** : seuls les domaines `verified` ou `authenticated` | `cms-email-engine.test.js` (test adapté) |
| 12-B6 | moyenne | « Transactionnel » contourne le consentement sans contrôle | **corrigé en partie** : déclencheurs limités aux événements de service. Le contenu n'est pas contrôlé. | `marketing-automations.test.js` |
| 12-B7 | moyenne | Tout SMTP 550/551/553 devenait une suppression définitive | **corrigé** : suppression seulement si le code détaillé 5.1.x ou le texte désigne le destinataire | `marketing-providers.test.js` |
| 12-B8 | moyenne | Double envoi possible (e-mail de scénario interrompu) | **corrigé pour l'e-mail de scénario** : message réservé avant l'appel, jamais renvoyé. SMS Twilio et SMTP après délai dépassé : **non corrigé** (pas de clé d'idempotence chez ces fournisseurs) | `marketing-automations.test.js` |
| 12-B9 | basse | Webhook : 408 et 429 abandonnés | **corrigé** : réessayés | `marketing-webhooks-durcissement.test.js` |
| 12-B10 | basse | Accord SMS sans vérification du numéro | **non corrigé** | — |
| 1-B1 | haute | Fusion de contacts : désabonnements par liste et refus de catégorie perdus | **corrigé** | `contacts-fusion-refus.test.js` |
| 1-B2 | moyenne | Fiche archivée comptée « catégorie refusée » | **étiquette corrigée** ; la réactivation d'une fiche archivée par un nouveau consentement reste une décision à prendre | `contacts-fusion-refus.test.js` |
| 1-B3 | moyenne | Export CSV : numéros `+…` préfixés d'une apostrophe | **corrigé** (numéros internationaux intacts, formules toujours neutralisées) | `contacts-fusion-refus.test.js` |
| 1-B5 | basse | Programmation saisie et affichée en UTC | **non corrigé** | — |

## Extensions réalisées

| Fonction | Avant | Après | Test |
|---|---|---|---|
| Valeur probante d'un gagnant A/B | meilleur taux brut, dès 2 destinataires | test du Z à 95 %, effectifs minimaux, avertissement ouvertures et revenu | `marketing-ab-preuve.test.js` |
| Pause automatique sur plaintes ou rebonds | seuils d'alerte passifs | pause à ≥ 0,3 % de plaintes ou ≥ 5 % de rebonds durs (après 100 envois) ; reprise manuelle à marge doublée | `marketing-reputation.test.js` |
| Contrôle HTTP des liens d'un e-mail | forme de l'adresse seulement | état de chaque lien (HEAD puis GET, 3 redirections, garde anti-SSRF à chaque saut, 25 adresses, 6 vérifications par heure) | `marketing-linkcheck.test.js`, `marketing-linkcheck-route.test.js` |

## Ré-entrée dans un scénario (12-B4) : conception, non réalisée

Pourquoi pas maintenant : `mk_automation_runs` porte `UNIQUE (automation_id, contact_id)` et `mk_messages` porte `UNIQUE (campaign_id, contact_id)`. Autoriser la ré-entrée touche les deux contraintes (reconstruction de table SQLite) et l'idempotence des messages : le risque principal est le **double envoi**, ce que cette mission cherche justement à éviter.

Conception proposée : réglage `reentry` par scénario (`never` par défaut, `per_event`). En mode `per_event`, la clé d'unicité devient `(automation_id, contact_id, trigger_event_id)` et le message `(campaign_id, contact_id, run_id)`. Tests à écrire d'abord : deux commandes du même contact produisent deux confirmations ; le rejeu d'un même événement n'en produit qu'une ; un arrêt serveur entre les deux ne double rien.

## Facturation et quotas (module 21)

Non réalisé, volontairement. La mission demande d'étudier le besoin avant de développer et interdit un paiement fictif. Le pied de page du site indique « aucun paiement réel n'est traité » : il faut d'abord décider si Kolakisa vend l'accès à l'outil d'e-mailing. Si oui : choix d'un prestataire de paiement, identifiants, grille de forfaits. Les plafonds d'envoi et le quota IA existent déjà (`sending/config.js`, `sms/config.js`, `ai/index.js`).
