# Funnel Studio — Matrice de parité systeme.io ↔ KOLAKISA (état réel)

Mise à jour : 2026-10-27, après le jalon « étapes de paiement ». Sources de référence : `systeme-io/*.md` (public uniquement ; ce qui demande un compte est **À VÉRIFIER**). Preuves : fichiers de tests cités.

| Fonction systeme.io | KOLAKISA | Statut | Preuve / remarque |
|---|---|---|---|
| Créer, dupliquer, archiver un tunnel | Tunnels | COMPLET | `tunnels.test.js`, `cms-tunnel*.test.js` |
| Types de tunnels (audience, vente, personnalisé) | 9 modèles + « Vente avec bon de commande » | COMPLET | `tunnel-paiement.test.js` (modèle) |
| Webinaire evergreen (sessions du jour) | Modèle « Webinaire » (inscription + confirmation), sans agenda de sessions | PARTIEL | pas de moteur de sessions |
| Étapes : ajouter, réordonner, supprimer, dupliquer | Oui | COMPLET | `cms-tunnel.test.js` |
| Page par étape dans l'éditeur commun | Oui (référence, jamais copie) | COMPLET | `cms-tunnel-web.test.js` |
| Étape suivante / étape précise | `/etape-suivante`, `/etape/<id>` | COMPLET | `cms-tunnel-web.test.js` |
| Formulaire de capture, consentement, double opt-in | Oui | COMPLET | `marketing-forms-*.test.js` |
| Tags, listes, automatisations, e-mails | Oui, événements `funnel.*` | COMPLET | `marketing-automations*.test.js` |
| Statistiques par étape | Visites, passage, inscriptions, ventes | COMPLET | `tunnels.test.js` ; définitions dans `funnels/analytics.js` |
| Abandon | `funnel.abandoned` après N heures | COMPLET | `abandon.js` |
| Test A/B de pages | Oui | COMPLET | `marketing-tests-ab*.test.js` |
| **Bon de commande (paiement carte)** | Étape `order` → Stripe Checkout | **COMPLET** (jalon) | `tunnel-paiement.test.js` |
| **Order bump** | Case à cocher, formation additionnelle, même paiement | **COMPLET** (jalon) | idem |
| **Upsell / downsell** | Étapes `upsell` / `downsell`, refus, saut du repli | **PARTIEL** | paiement refait sur Stripe (pas de « un clic ») |
| Paiement de la commande confirmé par le fournisseur | Webhook signé + relecture ; jamais sur simple retour navigateur | COMPLET | `paiement-stripe.test.js`, `tunnel-paiement.test.js` |
| PayPal | Absent | ABSENT | seul Stripe est branché |
| Produit physique, expédition, TVA | Absent | ABSENT | catalogue = formations uniquement |
| Codes promo dans le bon de commande | Champ sur la page d'offre, vérifié serveur | COMPLET | `tunnel-paiement.test.js` |
| Plans de paiement, abonnements | Absent | ABSENT | |
| Commande sans compte | Compte requis | PARTIEL | redirection vers la connexion puis retour |
| Pixels Meta / CAPI | Absent | ABSENT | mesure interne uniquement (consentement) |
| Domaines personnalisés par tunnel | Domaine du site uniquement | BLOQUÉ | infrastructure Hostinger (DNS, certificats) |
| Variables de page `{{funnel.*}}` | Absent | ABSENT | |
| Aperçu du parcours entier | Aperçu page par page | PARTIEL | |
| Permissions par rôle | `funnels.*` | COMPLET | `cms-tunnel-web.test.js` |
| Isolation inter-sites | Serveur refuse pages d'un autre site, accès limité par site | COMPLET | `cms-tunnel-web.test.js` (IDOR) |
| Interface minimaliste, animations, `prefers-reduced-motion` | Charte KOLAKISA existante | À VÉRIFIER | audit visuel non fait dans ce jalon |

Aucune parité globale n'est déclarée : les lignes ABSENT / PARTIEL / BLOQUÉ restent à traiter.
