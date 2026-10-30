# Programme 21 — préparation à la production

## Prêt (vérifié par des tests ou du code lu)
- Création d'un **site vitrine** avec structures natives, en brouillon, publiable par le système natif (IA simulée) ; régénération sélective protégée (21.9) ; historique et restauration de pages sans suppression de versions.
- **Moteur de boutique natif** (catalogue, variantes, stock, panier recalculé côté serveur, commandes, remboursements, clients) et **constructeur de boutique par IA** (brouillons de produits sans donnée inventée, validation avant publication) — testés avec un faux Stripe.
- Isolation multisite et permissions des moteurs 21.3 à 21.10 : testées en lecture et en écriture.
- Migrations 116 à 122 : additives ; mise à niveau d'une base existante sans perte (testé jusqu'à 120 dans `programme21-international-migrations`, 121 et 122 couvertes par les tests du moteur de boutique) ; tables à la demande en `IF NOT EXISTS`.
- `build:editor` et `build:automation-flow` réussissent ; `npm audit --omit=dev` : 0 vulnérabilité.

## Nécessite une configuration
- **Clé d'IA** (connecteur Anthropic ou `ANTHROPIC_API_KEY`) et module « IA » par site : sans elles, analyse du brief, création du plan et génération de textes affichent une explication claire.
- **Stripe** (clés serveur et webhook) pour le paiement par carte de la boutique : sans configuration la carte reste désactivée, seul le paiement manuel fonctionne. **Jamais vérifié contre le vrai service.**
- **Module Commerce** activé sur chaque site boutique ; droit « paiements » pour ouvrir la boutique.
- Fournisseur d'images réel : clé + activation dans l'AI Core + autorisation de dépense (non vérifié).
- Domaine et DNS : écran Domaines existant ; l'assistant ne modifie jamais les DNS.

## Pas prêt / à corriger avant un usage commercial
1. **Aucun fournisseur d'IA ni de paiement vérifié en réel** ; qualité réelle des générations non évaluée.
2. **Aucun test dans un navigateur réel** sur cette machine (Playwright/Chrome absents, plus de 190 suites non exécutées, dont celles de la boutique et du constructeur de boutique) : responsive, accessibilité, interactions non vérifiés visuellement.
3. Boutique : pas de fiche produit générée, pas d'images de produits générées, promotions/coupons non pilotés par le constructeur, parcours d'achat validé **sans commande d'essai**, seul l'euro testé, pas de multi-devises ni de traduction.
4. Intégration : registre du Site Planner non aligné sur la boutique (I1), 21.9 non relié au studio ni au catalogue (I2, I4), protections de 21.9 non consultées par tous les moteurs (I3), piles d'annulation séparées.
5. Performance en conditions réelles non mesurée (plusieurs dizaines de sites, centaines de pages, catalogues volumineux : brouillons limités à 500, catalogue affiché 100 lignes).
6. Déployer 21.10 a déployé le moteur de boutique : le webhook Stripe et le service de paiement partagés avec les formations ont été modifiés par le palier 20.5 — à surveiller après toute mise en production.
7. Sauvegardes : procédure existante (`npm run sauvegarde`) non rejouée dans ce palier.
