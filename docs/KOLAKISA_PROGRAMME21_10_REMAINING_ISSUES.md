# KOLAKISA — Programme 21.10 : limites et reste à faire

## Statut : VALIDÉ AVEC RÉSERVES
Le parcours (brief → modèle → plan → catalogue → produits → design → médias → configuration → SEO → aperçu → vérifications → publication) fonctionne sur un vrai serveur et dans Chrome, avec **fournisseurs simulés** et **sans aucun paiement**. Les réserves ci-dessous sont réelles.

## Dépendances et prérequis
| # | Point | Effet |
|---|---|---|
| D1 | **Le moteur e-commerce (20.5) n'était pas sur `main`** : il a été fusionné dans ce palier (migration 121, modification du webhook Stripe et du service de paiement partagés avec les formations) | Déployer 21.10 déploie ce moteur. Les tests de paiement des formations (Stripe, commerce par site, tunnel) passent sur la fusion ; **aucune transaction réelle n'a été faite**. |
| D2 | **21.9 absent** (branche vide) | Pas de régénération intelligente ni de comparaison de versions ; historique minimal propre au projet |
| D3 | **Stripe jamais vérifié contre le vrai service** (20.5) ; clés et webhook à définir par le propriétaire | La carte reste désactivée tant que le serveur n'est pas configuré ; seul le paiement manuel fonctionne |
| D4 | AI Core 21.2 non branché ; aucun fournisseur d'IA réel vérifié | La rédaction par IA (facultative) passe par l'ancien `ai.call` ; l'analyse du brief et l'assistant sont **à règles** |

## Fonctions de la spécification absentes ou partielles
| # | Fonction | État |
|---|---|---|
| L1 | **Product Page Generator** (fiche produit générée) | **Non fait** : la fiche produit est la page native du moteur ; aucun composant ni modèle de page produit n'est généré |
| L2 | Génération d'images de produits, galerie, visuels de catégories, bannières | **Absent** (le générateur de médias 21.7 ne couvre pas les produits) ; association d'images de la médiathèque seulement |
| L3 | Promotions, coupons, collections, produits recommandés, bannières, emailing, automatisations | **Non intégrés** : le moteur a des coupons, mais le constructeur ne les crée ni ne les propose |
| L4 | Modèles « personnalisé », « numérique », « multimarque » | **Partiels** (limites du moteur affichées) ; gros, dropshipping, services : **non pris en charge**, signalés |
| L5 | Internationalisation | 19 pays reconnus, devise saisie ; **seul l'euro est testé**, pas de multi-devises ni de conversion, pas de formats/unités locaux, pas de traduction de la boutique |
| L6 | Vérification du checkout | **Statique** (d'après la configuration) : aucune commande d'essai |
| L7 | Aperçu des fiches produits | Lien vers l'administration de la boutique ; les pages éditoriales ont l'aperçu natif ; **pas d'aperçu mobile/tablette intégré aux fiches** |
| L8 | Historique 21.9 : produits, catégories, design, contenus, médias | Journal et annulation des **brouillons du projet seulement** ; pas de restauration d'un produit déjà créé |
| L9 | Stock | Quantité saisie à la création seulement ; **pas d'ajustement ni d'alerte** depuis le constructeur (gérés par le moteur) |
| L10 | Variantes | Combinaisons créées à stock 0, sans SKU ni prix propre ; **à compléter dans l'administration** ; pas d'édition des variantes dans le constructeur |
| L11 | Gros catalogues | Brouillons limités à 500 ; **pas de file de traitement asynchrone** (une requête = un produit ; l'IA se lance produit par produit) ; catalogue affiché limité à 100 lignes, sans pagination |
| L12 | Assistant | À règles : catégories, pages, brouillon de produit, renommage ; pas de conseil détaillé, pas de contexte « produit sélectionné » |
| L13 | Accessibilité et navigateurs | Clavier/focus testés ; **ni lecteur d'écran, ni Firefox, ni Safari** ; contrastes non mesurés |
| L14 | Lint, typecheck, build | **Aucun script n'existe** dans le dépôt pour ce code ; `node --check` sur les scripts ; suite complète `npm test` **non exécutée** |

## Risques
1. Webhook Stripe partagé avec les formations : tout changement doit rejouer `paiement-stripe`, `commerce-par-site`, `tunnel-paiement`.
2. Une commande « en attente » réserve du stock (60 min pour la carte, **sans limite** pour le paiement manuel : à surveiller) — limite du moteur 20.5.
3. L'ouverture de la boutique expose publiquement les produits publiés : à faire après relecture des pages légales par un professionnel.

## Pour la suite
Brancher 21.9 (historique, comparaison, restauration) ; générer des modèles de fiche produit via le Theme Builder ; coupons et promotions ; file de traitement pour les gros catalogues ; essai réel borné de Stripe (clés de test) et d'un fournisseur d'IA ; test navigateur mobile des fiches produits.
