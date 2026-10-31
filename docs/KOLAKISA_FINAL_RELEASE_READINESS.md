# Préparation à la mise en production — 22.10

**Verdict : NON CERTIFIÉ — CORRECTIONS NÉCESSAIRES.** Le code livré par ce programme (laboratoire, correctif de méta description, documents) est sûr à déployer ; l'AI Website Builder lui-même n'est pas prêt pour un usage réel sans réserves.

## Bloquants P1 (voir `KOLAKISA_CORRECTION_ROADMAP.md`)
1. Accueils identiques entre secteurs (22.3 non branché).
2. Textes d'exemple publiables (59/74 pages).
3. Aucune image dans les sites générés (22.7 non branché).
4. Boutique : parcours guidé = catalogue de formations ; planificateur « indisponible ».
5. Pages Contact/Rendez-vous non publiables d'origine (26).
6. Aucun fournisseur d'IA réel vérifié, aucun paiement réel vérifié.

## Dépendances externes
Clés de fournisseurs d'IA (essai borné avec plafond de coût), `NODE_ENV=production`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (webhook : 503 tant qu'elles manquent), compte Hostinger pour mesures de production.

## Non testé
Éditeur (fluidité), rendu des sites générés sur 7 tailles, Core Web Vitals réels, lecteurs d'écran, variantes/stocks/taxes de boutique, Firefox/Safari, pannes réelles de fournisseurs.

## Recommandations
Brancher dans cet ordre : (1) `layoutGen` sur l'accueil, (2) `contentIntel.review` à la publication (avertir sur exemples), (3) `imageIntel`/`aiMedia` après « Appliquer », (4) catalogue → boutique native, (5) formulaire de contact associé. Puis essai réel borné d'un fournisseur d'IA. Puis réaliser 22.2, 22.4, 22.5.
