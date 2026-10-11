# Plan des tests d'intégration globaux — palier 25 (préparé, NON exécuté)

**Aucun de ces scénarios n'a été exécuté dans le palier 24** ; ils sont décrits pour être exécutés dans un **environnement de test jetable** (serveur de test + base temporaire, comme `tests/helpers.js`), jamais sur les données de production. Les scénarios marqués ⚠ demandent des comptes ou clés **de test** d'un fournisseur externe (à fournir par le propriétaire, hors production).

Principe : un test d'intégration traverse **au moins deux modules** du déclenchement à l'effet observable (base, e-mail reçu, page publique), et vérifie en plus le refus (consentement absent, mauvais site, mauvais rôle, rejeu).

## Données de test communes
- 2 sites (A, B) ; 1 compte créateur ; comptes d'équipe : Administrateur, Éditeur, Auteur, Contributeur, Lecteur ; 1 membre limité au site A ; 1 membre limité au site B ; 1 élève.
- 1 formation publiée (prix > 0), 1 coupon, 1 page de vente, 1 formulaire publié, 1 audience, 1 scénario, 1 modèle d'e-mail.
- Visiteurs : un avec `kw_consent=1` + `kw_vid`, un sans consentement, un robot (User-Agent).

## Scénarios (priorité décroissante)

| ID | Parcours | Prérequis | Étapes clés | Résultat attendu | Critère d'acceptation |
|---|---|---|---|---|---|
| T01 | Création → publication d'une page → page publique | Site A | Créer (route), enregistrer le brouillon, publier, lire `/p/<adresse>`, changer l'adresse, relire l'ancienne | 200 puis 301 ; version créée ; SEO présent dans le HTML ; indexable selon le type | HTML public = contenu du brouillon publié ; ancienne adresse en 301 ; absente du sitemap si non indexable |
| T02 | Séparation entre sites | Sites A et B, membres limités | Chaque membre tente pages, tunnels, e-mails, A/B, outils, analytics de l'autre site (par identifiant) | 403 ou 404 partout | Aucune ressource de l'autre site lisible ni modifiable ; relancer `audit-parite/sonde-permissions.js` sans écart |
| T03 | Rôles et permissions | 5 rôles | Matrice de routes × profils | Écritures refusées aux rôles lecture ; articles selon D2 | 0 écriture inattendue ; rôles articles conformes à la décision |
| T04 | Formulaire → contact → consentement | Formulaire publié | Soumettre avec et sans case ; doublon ; robot | Fiche créée ; preuve de consentement seulement si case cochée ; événement `form.submitted` | Pas d'abonnement sans case ; un seul événement par envoi |
| T05 | Contact → e-mail (consentement) | T04 | Campagne vers l'audience ; désinscrire ; relancer | E-mail seulement aux consentants non désinscrits | ⚠ Fournisseur de test : message reçu avec SPF/DKIM ; désinscrit non joint |
| T06 | Événement → scénario → e-mail | T04, **worker actif** | Soumission → scénario (étiquette, attente courte, e-mail) | Passage unique ; journal pas à pas ; e-mail envoyé après l'attente | ⚠ Redémarrer le serveur pendant l'attente : le scénario reprend ; aucun doublon |
| T07 | Commande réelle de test | ⚠ Clés Stripe de TEST, webhook de test | Panier → paiement de test → retour | Commande, accès à la formation, `purchase.completed`, contact « Client », scénario déclenché | Webhook répond 400 sans signature (et non 503) ; rejeu du webhook = 1 commande |
| T08 | Remboursement | T07 | Remboursement partiel puis total depuis Stripe de test | `refund.completed`, `order.partially_refunded`, `order.refunded` ; net = brut − remboursements | Aucun doublon au rejeu ; revenu net correct dans Analytics |
| T09 | Échec / abandon de paiement | T07 | Carte refusée ; panier laissé | `payment.failed` (1 fois), `cart.abandoned` après le délai | Délai réglable respecté ; consentement respecté pour la relance |
| T10 | Tunnel de pages | Tunnel avec 3 étapes | Parcours d'un visiteur consenti ; saut d'étape ; abandon | Événements `funnel.*` sans doublon ; abandon après délai | « Sauter n'est pas terminer » ; noindex d'étape respecté |
| T11 | Mesure et consentement | Visiteurs de test | Visites avec/sans consentement, robot | Seuls les consentants comptés ; robot ignoré | Chiffres du tableau de bord = lignes en base |
| T12 | Test A/B de page | Page A + copie B, test démarré | 200 visiteurs répartis ; conversions ; rapports | Affectation collante ; exposition = page affichée ; verdict prudent | Jamais de « gagnant » sans règles ; anomalie de répartition signalée |
| T13 | Analytics ↔ A/B ↔ commerce | T07, T12 | Achat par un visiteur exposé | Attribution à la première version vue ; hors fenêtre exclue | Revenu net par version cohérent |
| T14 | Articles multi-auteurs (si D2 = oui) | Correctif appliqué | Auteur écrit, ne publie pas ; Éditeur publie ; accès croisé | Conformité au correctif | `tests/cms-articles-multi-auteurs` vert + 403 croisés |
| T15 | Sauvegarde et restauration | Base de test remplie | `npm run sauvegarde`, restauration à blanc | Comptes identiques avant/après | Restauration sans erreur ; `integrity_check` = ok |
| T16 | Webhooks entrants | ⚠ Secrets de test Resend/Twilio | Événements signés puis non signés | Signés acceptés (idempotents) ; non signés refusés | Rebond/plainte/STOP traités ; aucun traitement sans signature |
| T17 | Éditeur : perte de travail | Navigateur de test | Couper le réseau pendant l'édition ; recharger | Dernier brouillon enregistré retrouvé ; message clair | (après G-12) copie locale restaurée |
| T18 | Régression visuelle éditeur / public | Pages de référence | Comparer capture éditeur et page publique | Écart sous un seuil défini | Seuil accepté par écrit |

## Critères d'acceptation globaux du palier 25
- Tous les scénarios T01–T13 et T15 exécutés ; ⚠ T05–T09 et T16 exécutés **avec des comptes de test** ou **explicitement reportés par écrit** (sans les compter comme réussis).
- Chaque échec ouvre une entrée dans le registre des anomalies avec reproduction.
- La suite complète reste verte hors échecs acceptés par écrit (G-10).
- Aucune donnée de production touchée.
