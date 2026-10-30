# Programme 20.7 — points restants

| # | Priorité | Point | Action |
|---|---|---|---|
| 1 | P2 (décision) | Theme Builder au niveau organisation, pas par site | Décider d'une table `mk_theme_templates(site_id…)` (étape E du plan site-builder-2026-10-18) |
| 2 | P2 | E-commerce Builder absent : variantes, stock, livraison, fiscalité, boutique par site | Programme dédié ; ne pas annoncer comme disponible |
| 3 | P2 | Suite complète non terminée dans cette passe | Relancer à froid, tranches séquentielles, sans autre session |
| 4 | P2 | `portee-des-routes` instable sous forte charge | Surveiller ; rejouer seul |
| 5 | P2 | Performances non mesurées | Lancer `scripts/audit-performance.js` à froid |
| 6 | P3 | Pas de licences ni de marché de modèles externes | À cadrer si l'objectif est un catalogue tiers |
| 7 | P3 | Multi-pays (devises, TVA, adresses) non audité | L'e-commerce actuel est en euros via Stripe |
| 8 | P2 | Pas de lint / typecheck / build ; CI GitHub bloquée par la facturation | Ajouter et rétablir la CI |
| 9 | — | Déploiement Hostinger non vérifiable depuis ici | Contrôle manuel |
