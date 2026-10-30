# KOLAKISA — Constructeur de boutique par IA : architecture

`navigateur (ai-shop.js)` → `routes (web/aiShop.js, /marketing/ia/studio/boutique)` → `ai/shop/project.js` → services **natifs** du moteur e-commerce (`shop/catalog`, `shop/store`), Page Generator, Design Generator, médiathèque, publication des pages.

## Données
- `mk_ai_shops` : un projet (brief, analyse, plan, structure, brouillons de produits, configuration proposée, table `applied`). `site_id` obligatoire, isolé par site (inventaire des tables : « isolée »).
- `mk_ai_shop_events`, `mk_ai_shop_states` : historique et copies d'annulation.
- **Aucune donnée commerciale vivante** dans ces tables : catalogue, stocks, prix, commandes, paiements = tables `mk_shop_*` du moteur.

## Cycle d'un élément
brouillon (projet) → **acceptation explicite** (plan, structure) → application idempotente (`applied`) → objet natif du moteur **en brouillon** → publication guidée (contrôles bloquants d'abord) → ouverture de la boutique (droit « paiements » distinct).

## Garde-fous
- Idempotence : une catégorie existante (même adresse) est réutilisée ; un produit déjà créé n'est jamais recréé ; une page existante n'est jamais écrasée (`skip`).
- Révision : toute modification du projet exige la révision vue (409 sinon).
- Atomicité : chaque application travaille en transaction du moteur ; les refus sont listés produit par produit (succès partiel explicite).
- Portée : `load` filtre par organisation et, pour un accès limité, par site (testé par mutation). Module « ia » exigé (préfixe `/ia`), module « commerce » exigé pour écrire dans le catalogue.
- Asynchronisme : les générations en lot ne bloquent pas l'interface (une requête = un produit ; le CSV est limité à 500 lignes) ; **pas de file de traitement** pour de très gros catalogues (voir REMAINING_ISSUES).

## Cohabitation
L'accueil « Créer un site avec l'IA » propose site **ou** boutique. L'interface 21.8, ses moteurs et l'AI Core ne sont pas modifiés.
