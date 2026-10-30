# Audit de l'expérience utilisateur (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

Périmètre : parcours observable dans le HTML public et les routes. Pas de test d'usage avec des personnes, pas de navigateur.

## Mesures
| Contrôle | Résultat |
|---|---|
| Liens internes de l'accueil testés (extraits de chaque site) | tous valides (0 lien cassé sur 15 sites) |
| Appel à l'action présent sur l'accueil | oui (15 / 15) |
| Pages de contact / rendez-vous publiables sans action manuelle | **non** : 19 pages sur 72 (15 sites sur 15) |
| Menu de navigation dans la page publiée | non observé (étape « menu » non exécutée par le laboratoire — non noté) |
| Application d'une génération sur un 2e site | **bloquée sans choix manuel** (sonde : 0 page créée, message « existe déjà… ») |

## Constats
- **U1 (P1)** **Le formulaire de contact est le parcours de conversion de la plupart des scénarios (devis, rendez-vous, réservation, demande de démonstration), et il n'est pas publiable d'origine.** L'utilisateur reçoit « La section d'inscription a besoin d'un formulaire : choisissez-en un dans les réglages de la page ». Le message est clair, mais l'étape n'est pas guidée (Q6).
- **U2 (P2)** **Un deuxième site ne peut pas recevoir la génération sans arbitrage page par page** (Q8) parce que des pages homonymes existent ailleurs ; les noms deviennent « Accueil (5) ». Pour un utilisateur non technique, c'est un blocage inattendu.
- **U3 (P1)** Les textes d'exemple restent visibles et publiables (Q2) : le parcours « générer puis publier » permet de mettre en ligne un site portant des « [Titre] » et un faux témoignage.
- **U4 (P1, boutiques)** Le parcours « découvrir un produit → panier → commande simulée » **n'est pas démontré** par le parcours guidé : le « Catalogue » généré est un catalogue de formations (Q5). Le moteur de boutique natif (20.5) et la boutique IA (21.10) disposent de parcours testés par ailleurs (tests serveur de panier/commande, paiement jamais vérifié en réel), mais ils ne sont pas reliés au parcours guidé ni au planificateur.
- **U5 (info)** Les liens et ancres de l'accueil fonctionnent ; aucune erreur HTTP sur les 53 pages publiées.

## Recommandations
Associer automatiquement (ou proposer en un clic) un formulaire de contact au moment de la génération ; proposer la stratégie « nouvelle page » par défaut pour un site vide ; afficher un avertissement bloquant à la publication si des espaces réservés subsistent ; relier la génération « boutique » au moteur natif.
