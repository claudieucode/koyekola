# Intégration e-commerce — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

## Moteur natif (20.5) et Builder (21.10)
Existent et sont testés (`programme21-10-ecommerce-builder*`, tests du palier 20.5) : produits, catégories, panier, commande, prix calculé côté serveur, webhook signé, jeton de commande — **contre un faux Stripe uniquement**. Aucun paiement réel n'a été tenté, aucune commande fictive créée en production.

## Ce que le laboratoire de génération démontre (4 scénarios boutique : boutique, mode, informatique, produits numériques)
- ⛔ **Le parcours guidé crée un « catalogue » de FORMATIONS** : ni fiche produit, ni panier, ni commande dans les pages générées (`TYPE_OF.catalogue = formation`).
- ⛔ **Le planificateur déclare la boutique « unavailable »** alors que le moteur natif existe (`registry.feature("boutique")`) — I1 du 21.11, toujours ouvert.
- Les 4 scénarios sont plafonnés par ces défaillances critiques (note maximale « À AMÉLIORER »).
- Le Builder 21.10 (chemin séparé `ai/shop`) fonctionne indépendamment du parcours guidé ; ce sont deux chemins non unifiés.

## Non évalué
Variantes de produit, stocks, taxes par pays, e-mails transactionnels, clients : ⚪ non rejoués dans ce programme (voir tests 20.5). Stripe réel : ⚪ non testé (clés de production non configurées — webhook 503 constaté).
