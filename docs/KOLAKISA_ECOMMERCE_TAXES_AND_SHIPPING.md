# Boutique — taxes et livraison

> **Avertissement.** Kolakisa applique les règles que le propriétaire de la boutique configure ; il ne connaît aucun taux, ne détecte aucune obligation fiscale (TVA OSS, seuils, exonérations, facturation électronique…) et **ne garantit aucune conformité fiscale**. Faites valider la configuration par un professionnel.

## Taxes
- Réglages de la boutique : **taxes activées** (non par défaut) et **prix saisis TTC ou HT**.
- Règles `mk_shop_tax_rules` : nom, pays (ISO, ou `*`), région facultative, **taux en points de base** (2000 = 20,00 %), application à la livraison, priorité. **Aucune règle n'est préremplie.**
- Choix de la règle : la plus précise (pays + région > pays > `*`), puis priorité, puis ancienneté. Une seule règle par commande (pas de taxes cumulées).
- Destination : pays de **livraison** si la commande est livrée, sinon pays de facturation, à défaut pays par défaut de la boutique. Sans règle correspondante, **aucune taxe n'est inventée**.
- Calcul : par ligne, arrondi demi-supérieur, puis addition ; TTC → la taxe est extraite du prix (le total ne bouge pas), HT → ajoutée. Détail par taux sur le récapitulatif et conservé sur la commande (`tax_lines`).
- Non géré : plusieurs taxes sur une même ligne, taux par catégorie de produit, exonérations de clients, prix affichés différemment selon le pays, factures.

## Livraison
- **Zones** : liste de pays (vide = tous). Une zone qui liste le pays l'emporte sur « tous les pays ». Pays sans zone → livraison refusée (« nous ne livrons pas dans ce pays »).
- **Méthodes** : forfait, **gratuite dès un montant** (proposée seulement quand le seuil est atteint, calculé après remise), **selon le poids** (plages min/max en grammes). Plusieurs méthodes proposées, triées par coût.
- Produits numériques / non livrés : aucune livraison exigée. Panier mixte : livraison pour la partie physique.
- La méthode choisie est **revalidée côté serveur** (une méthode non éligible est refusée).
- Non géré : transporteurs en direct, étiquettes, suivi automatique, points relais, calcul par dimensions, frais par produit.
