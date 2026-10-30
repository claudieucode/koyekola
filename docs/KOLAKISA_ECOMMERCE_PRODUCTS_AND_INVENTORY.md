# Boutique — produits, variantes, prix et stocks

## Types de produits
| Type | État | Détail |
|---|---|---|
| `simple` | **opérationnel** | produit physique, prix, stock facultatif, poids, dimensions |
| `variable` | **opérationnel** | attributs (ex. « Taille : S, M, L »), variantes avec SKU, prix et stock propres ; une variante est **obligatoire** à l'achat |
| `digital` | **opérationnel** (sans livraison) | jamais d'adresse ni de frais de port ; **aucune livraison de fichier** n'est fournie (voir limites) |
| `downloadable` | **non pris en charge** | refusé par le service (« type non pris en charge ») : pas de fichier protégé ni de lien expirant |
| `grouped` | **non pris en charge** | refusé de même |

## Champs d'un produit
Nom, description courte et complète, SKU (unique par boutique), prix, prix promotionnel avec période, gestion du stock, poids (g), dimensions (mm), à livrer ou non, image principale, galerie (adresses de la médiathèque, `/…` ou `https://…` uniquement), étiquettes, catégories (arborescence), mis en avant, titre/description SEO, statut (brouillon, en ligne, archivé). Suppression **douce** : les commandes passées gardent leur instantané (nom, SKU, prix).

## Règles de prix
- Montants **entiers en centimes**, jamais de flottant.
- Une promotion s'applique **seulement si** elle baisse le prix **et** si sa période est en cours (`priceOf`). Un prix promotionnel ≥ prix normal est refusé à l'enregistrement.
- Variante : son prix propre, sinon celui du produit ; sa promotion propre, sinon celle du produit si elle n'a pas de prix propre.

## Stock
- Décompté à la **création de la commande** (réservation) par `UPDATE … WHERE stock_qty >= ?` : impossible de descendre sous zéro, même avec deux acheteurs simultanés (testé : le second est refusé sans commande).
- Rendu à l'**annulation**, à l'**échec/expiration du paiement** ; une seule fois (`stock_released`).
- Commande payée après annulation (confirmation tardive) : la commande est rétablie et le stock est repris dans la limite du disponible ; une note « stock à vérifier » est inscrite dans l'historique.
- Chaque mouvement est journalisé (`mk_shop_stock_movements`) ; ajustement manuel avec `shop.write`, jamais en dessous de zéro.
- Seuil de stock bas réglable (affiché dans la liste).

## Catalogue
`catalog.catalogQuery` exécute **en base** : recherche (nom, SKU, description courte, étiquettes, SKU des variantes ; caractères `% _ \` neutralisés), catégorie (avec sous-catégories), étiquette, prix minimum/maximum (sur le **prix effectif**, promotion comprise), en stock, en promotion, mis en avant, tri (nouveautés, mis en avant, prix ↑ ↓, nom), pagination (12 par page, 48 maximum). Les produits sont ensuite enrichis en **2 requêtes** pour toute la page (variantes, catégories) : pas de requête par produit.

## Fichiers
`src/marketing/shop/catalog.js` · `views/marketing/boutique/produit*.ejs` · tests `tests/programme20-5-boutique-moteur.test.js`.
