# Programme 20.7 — audit de sécurité et d'isolation

Preuves exécutées (accès directs, sans passer par l'interface) : anonyme refusé ; personne limitée au site A refusée pour créer un site, supprimer A, archiver B, toucher aux modèles de thème (réglage d'organisation, données inchangées vérifiées) ; prix du panier non modifiable par le navigateur (champs `price_cents`/`price`/`total` ignorés) ; panier et commande exigent une connexion. Rejoués : paliers 17 et 18 (isolation inter-sites, portées de routes à plusieurs milliers de combinaisons, clés d'API, SSRF), 21.8.
**Aucune vulnérabilité nouvelle trouvée ; aucune correction de code nécessaire.**
Non testés dans cette passe : IDOR sur chaque route de commande (couvert par palier 17), XSS exhaustif de l'éditeur (couvert par suites existantes), webhooks de fournisseurs autres que Stripe (n'existent pas).
Risque connu : les modèles de thème sont partagés par l'organisation (une page de n'importe quel site peut servir de modèle pour le site principal). Aucune fuite vers un accès limité (écran réservé à l'équipe), mais pas d'indépendance par site.
