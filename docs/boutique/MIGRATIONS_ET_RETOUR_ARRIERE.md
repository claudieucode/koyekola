# Migrations et retour arrière

Toutes les migrations de la boutique sont **additives** (nouvelles tables, colonnes avec valeur par défaut) : aucune donnée commerciale existante n'est modifiée ou supprimée.

| N° | Contenu |
|---|---|
| 144 | Remboursements (`mk_shop_refunds`) |
| 146 | Vendeur et factures/avoirs (`mk_shop_company`, `mk_shop_invoices`) |
| 147 | Fichiers numériques et droits de téléchargement ; colonnes de limite sur les produits |
| 148 | Classes de taxe et d'expédition, exonération, codes postaux, suppléments |
| 150 | Paniers abandonnés (colonnes de panier et de réglages) |
| 151 | Identifiants de passerelles par site (chiffrés) |
| 152 | Promotions : livraison offerte, promotion automatique |

(La 145 et la 149 appartiennent à d'autres chantiers.) Le suivi se fait dans `schema_migrations` (numéro + empreinte) ; deux fichiers de même numéro bloquent le module marketing au démarrage (garde-fou).

## Sauvegarde avant mise à jour
Automatique : copie quotidienne de la base dans `<DATA_DIR>/backups/` (14 conservées). Manuelle : `npm run sauvegarde`. À faire avant chaque déploiement important.

## Retour arrière
1. Arrêter l'application. 2. Restaurer la copie de la base voulue depuis `backups/` à la place de `KOYEKOLA.db`. 3. Redéployer le code de la version précédente. Les colonnes ajoutées restent inoffensives pour l'ancien code ; les fichiers numériques (`DATA_DIR/shop-files`) ne sont pas touchés.
Les nouvelles fonctions sont isolées par site : désactiver le module « Commerce » d'un site ferme sa boutique sans rien supprimer.
