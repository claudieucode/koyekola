# Programme 21 — préparation à la production

## Prêt
- Création d'un **site vitrine** de bout en bout avec des structures natives, en brouillon, publiable par le système natif : testé avec une IA simulée (voir scénario).
- Isolation multisite et permissions des moteurs : testées (lecture et écriture).
- Migrations 116 à 120 : additives, sans perte de données sur une base existante (testé), tables à la demande en `IF NOT EXISTS`.
- Construction : `build:editor` et `build:automation-flow` réussissent ; `npm audit --omit=dev` : 0 vulnérabilité.
- Santé de production vérifiée après déploiement (voir rapport final).

## Nécessite une configuration
- **Clé d'IA** (connecteur Anthropic ou `ANTHROPIC_API_KEY`) et module « IA » activé pour chaque site à accès limité : sans elles, l'analyse du brief, la création du plan et la génération de textes affichent un message clair (testé).
- **Fournisseur d'images réel** : clé + activation dans l'AI Core + autorisation de dépense ; à vérifier en réel avant tout usage.
- Domaine et DNS : écran Domaines existant ; l'assistant ne modifie jamais les DNS.

## Pas prêt / à corriger avant un usage commercial
1. **21.9 et 21.10 absents** : pas d'historique global ni de régénération pilotée par l'impact ; **pas de boutique** (voir ci-dessous).
2. Qualité réelle des générations d'IA **non évaluée** (tout est simulé) : il faut un essai avec un vrai fournisseur et une relecture humaine.
3. **Aucun test dans un navigateur réel** sur cette machine (194 suites « navigateur » non exécutées : Playwright/Chrome absents) : responsive, accessibilité clavier et lecteur d'écran, débordements, interactions du studio **non vérifiés visuellement**.
4. Performance en conditions réelles (plusieurs dizaines de sites, plusieurs centaines de pages) **non mesurée**.
5. Sauvegardes : procédure existante (`npm run sauvegarde`) non rejouée dans ce palier.

## E-commerce : BLOQUÉ PAR UNE DÉPENDANCE
Kolakisa ne possède **aucune** infrastructure de boutique de produits : pas de table produits/variantes/stocks, pas de livraison, pas de taxes ; le panier et Stripe ne vendent que des **formations** ; la section « Commerce » est le suivi des revenus de formations. Construire une « boutique de matériel informatique » exigerait d'abord de développer ce socle commercial (hors périmètre du programme 21, qui n'a pas à le simuler). Aucun produit, prix, stock ou caractéristique n'a été inventé ; aucun paiement n'a été effectué.
