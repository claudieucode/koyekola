# Pied de page : conditions d'affichage et publication (chantier B)

Ce document décrit ce qui a été ajouté au Theme Builder de Kolakisa pour décider **où** un pied de page s'affiche et **comment** on le publie.
Le moteur de conditions est partagé : tout ce qui est décrit ici est **rétro-compatible** pour les en-têtes, barres latérales, modèles libres, articles, archives, 404 et produits.

## 1. Règle de priorité (Elementor ne la décrit pas)

Pour une page donnée, **un seul pied** s'affiche. Le choix est fait par `src/themeBuilder/resolve.js`, toujours de la même façon :

1. Un pied **brouillon ou archivé** ne s'applique jamais.
2. Une **exclusion** qui correspond à la page retire le pied, même si une inclusion plus précise correspond.
3. Sans inclusion, le pied vaut pour **tout le site**. Avec plusieurs inclusions, il suffit qu'**une** corresponde (OU) ; les critères d'une même condition se combinent en ET.
4. Parmi les pieds restants, **le plus précis gagne**. Précision (plus grand = plus précis) : page ou formation choisie 100 › page d'accueil 90 › sous-pages directes 80 › sous-pages 70 › compte client 65 › catégorie/étiquette choisie 60 › « Panier, commande… » 55 › 404 50 › recherche 40 › fiche formation (toutes) 35 › toutes les pages d'un type 30 › « Toute la boutique » 22 › tout contenu individuel 20 › rôle précis 18 › visiteur connecté 15 › tout le site 10.
5. À précision égale : le **plus récemment publié** gagne ; à date égale, le **plus petit identifiant**. Aucun hasard : l'ordre de la liste n'a pas d'importance (testé).
6. Il n'y a **jamais deux pieds** sur une page : le moteur renvoie un seul gagnant ; le rendu public n'ajoute pas le pied d'origine quand un pied du Theme Builder s'applique (suite `theme-builder-pied-unique`).

## 2. Nouvelles conditions

| Condition (écran) | Clé | Vue concernée | Effet réel |
|---|---|---|---|
| Compte client (boutique) | `account` | `/boutique/compte…` | oui (vue « account » déduite de l'adresse) |
| Pages de la boutique (panier, commande…) | `shop_page` | `/boutique/*` hors compte, liste et produit | oui |
| Toute la boutique | `shop` | liste, produit, panier/commande, compte | oui |
| Fiche formation | `course` (+ formations choisies, catégorie) | `/cours/:slug` | oui |
| Visiteur connecté / rôle | `visitor` (`state` in/out, `roles`) | toutes | oui, voir §4 |
| Pages précises, catégories, étiquettes, auteurs | `page`, `post`, `product`… | existantes | choix par **liste avec recherche** (plus d'identifiants à saisir) |

Corrections « Produit » et « Boutique » : leur logique était déjà correcte (le catalogue et la fiche produit déclarent leur contexte via `renderRegion`). Ce qui manquait était l'absence de vue pour le panier, la commande et le compte, qui tombaient dans la vue « page » (une condition « Pages » s'y appliquait par erreur). Elles ont désormais leurs propres vues. La preuve est dans `tests/footer-conditions.test.js` (« effet réel sur les vues compte client, boutique et fiche formation »).

**Changement de comportement assumé** : `/boutique/compte`, `/boutique/panier` et `/cours/:slug` ne sont plus vus comme de simples « pages » : un pied limité à « Pages » ne s'y affiche plus ; un pied « Tout le site » (aucune condition) s'y affiche toujours.

**Types de contenu personnalisés (CPT)** : Kolakisa n'a pas de système de types de contenu personnalisés (recherche dans `src/`, `migrations` : seule la taxonomie article/catégorie/étiquette existe). Il n'y a donc rien à cibler ; le point d'extension `registerCondition` (condition « personnalisée », code serveur) existe pour le jour où ils seront créés, et le moteur les accepte déjà sans modification.

## 3. Publication

* **Première publication d'un pied** : une fenêtre demande « Où afficher ce pied ? » : *Tout le site* ou *Conditions personnalisées*. Rien n'est coché d'avance et le bouton Publier reste grisé tant qu'on n'a pas choisi.
* **Contrôle côté serveur** : `POST …/modeles/:id/publier` avec `{ strict: true, scope: "site" | "custom", conditions }` refuse (409, `needsScope`) une première publication sans portée. Sans `strict`, l'API garde son comportement d'origine (compatibilité avec les appels existants et les autres types) ; l'écran envoie toujours `strict`.
* **Résumé lisible** : « Tout le site, sauf : les pages « A », « B » » / « Uniquement : … ».
* **Conflits visibles avant de publier** (`GET …/modeles/:id/plan-publication`) : doublon exact (bloquant : *remplacer* l'ancien pied, qui repasse en brouillon, rien n'est supprimé), même précision (avertissement : le plus récent l'emporte), chevauchement (qui l'emporte sur les pages communes), et effet sur les pages réelles (« ce pied s'affichera sur N pages sur M, en remplaçant … »).
* **Garder les deux avec priorité** : la priorité est automatique (§1). Pour changer qui gagne, on précise les conditions de l'un des deux ; il n'y a pas de curseur de priorité manuel.
* **Dépublier** : `POST …/depublier` ; le site retrouve le pied général (ou le pied d'origine s'il n'y en a plus).
* **Tester une adresse** (`GET …/modeles/:id/s-applique?url=/boutique/compte`) : « Ce pied s'applique-t-il à cette adresse ? » avec la raison. Les adresses d'un autre site et les adresses externes (`//…`) sont refusées. Pour un pied brouillon, la réponse dit « une fois publié ».
* **Sélecteurs** (`GET …/api/cibles?type=page|category|tag|author|product_category|product_tag|course|role&q=`) : filtrés par organisation et par site. Les formations sont proposées pour le site principal seulement (les formations appartiennent à la plateforme, pas à un site créé).

## 4. Visiteur connecté / rôle

Les réponses publiques sont déjà envoyées avec `Cache-Control: private, no-cache` (`server.js`) : un navigateur ou un relais partagé ne peut pas servir le pied d'un visiteur à un autre. Le contexte de rendu reçoit donc `visitor = { loggedIn, role }` (compte de la plateforme : `etudiant`, `formateur` ; client de la boutique : `client`).
Limites : un visiteur **inconnu** (aperçu sans précision, simulateur) ne correspond jamais à une condition de connexion ; une exclusion « connectés » n'exclut alors personne. Si un jour une mise en cache publique (CDN) est ajoutée, ces conditions devront être exclues de ce cache.
Une condition « visiteur » ne se combine pas en ET avec une autre condition de page (les inclusions se combinent en OU) : elle sert surtout en exclusion (« tout le site sauf les connectés ») ou seule.

## 5. Isolation et droits

Toutes les requêtes filtrent `organization_id` **et** `site_id`. Les droits existants s'appliquent : lecture (`forms.read`) pour le plan, le test d'adresse et les sélecteurs ; écriture (`forms.write`) pour publier / dépublier. Un modèle d'un autre site répond 404 (testé).

## 6. Fichiers

Nouveaux : `src/themeBuilder/urlContext.js`, `src/themeBuilder/publication.js`, `tests/footer-conditions.test.js`. Modifiés : `types.js`, `conditions.js`, `match.js`, `resolve.js`, `store.js`, `render.js` (deux fonctions), `src/marketing/web/themeBuilder.js`, `public/js/theme-builder.js`, `public/css/theme-builder.css`, `views/marketing/theme-builder.ejs`. Aucune migration (aucun nouveau champ en base : les conditions sont déjà stockées en JSON).
