# 10 - Conditions d'affichage d'un Header Elementor

Date de consultation : 2026-11-07. Légende et sources : voir 00_RESEARCH_SCOPE.md. Theme Builder = [PRO].

## 1. Principe

- Un header neuf a par défaut la condition « toute la page » (Entire Site) ; Save & Close pour la garder. - https://elementor.com/help/conditions/
- Chaque condition = deux listes : à gauche Include ou Exclude ; à droite les pages ciblées. Plusieurs conditions possibles sur un même template (ex. catégories Shirts ET Pants). - https://elementor.com/help/conditions/
- Édition : dans l'éditeur, flèche à côté de Publish > Display Conditions ; ou carte du Header dans le Theme Builder > Edit Conditions. - https://elementor.com/help/conditions/ , https://elementor.com/help/header-site-part/
- Point vert = actif avec conditions, point gris = brouillon sans condition. - https://elementor.com/help/the-elementor-theme-builder/
- Distinction à ne pas confondre : « Conditions / Triggers / Advanced Rules » est la mécanique des popups (triggers = actions de l'utilisateur ; advanced rules = nb de visites, URL d'origine, appareils). Elle ne s'applique pas aux headers. - https://elementor.com/help/wp-json/wp/v2/posts/141

## 2. Liste complète des options (page de doc lue)

Source : https://elementor.com/help/conditions/

### Entire Site
Toutes les pages du site.

### Singular (contenus individuels)
- All Singular : toute page qui n'est pas une archive.
- Front Page : page d'accueil.
- Posts : tous, ou précis. Affinages : In Category, In Child Categories, In Tag, Posts by Author.
- Pages : toutes ou précises.
- Page by Author (la doc écrit « All posts by a selected author », probablement une erreur de copie).
- Landing Pages : toutes ou précises ; Landing pages by Author.
- Floating buttons : tous ou précis ; Floating buttons by Author.
- Media : tous ou précis ; Media by Author.
- Direct child of : enfant direct d'une page/article choisi.
- Any Child of : enfant à toute profondeur.
- By Author : tout élément d'un auteur choisi.
- 404 Page.

### Archives
- All Archives (par défaut) ou sélection.
- Author Archive, Date Archive, Search Results, Posts Archive.
- Categories ; Direct Child Category of ; Any Child Category of ; Tags.

### WooCommerce [PRO + WooCommerce]
- All (pages boutique) par défaut.
- All Product Archives, Shop Page, Search Results, Product Category, Product Tags, Products, In Category, In Child Product Categories, In Tag (doc : texte erroné « in a selected category »), Products by Author.

### Condition développeur : utilisateur connecté
Une condition personnalisée (« logged in user ») est donnée comme exemple d'extension : enregistrée dans le groupe `general` via l'action `elementor/theme/register_conditions`, avec un nom unique, un libellé traduisible et une méthode de vérification qui renvoie vrai/faux. Elle n'est PAS dans la liste native ci-dessus. [EXTENSION] - https://developers.elementor.com/docs/theme-conditions/simple-example
Les sous-conditions (affiner « tous » vers un sous-ensemble ou un élément) se déclarent avec un libellé « all » et l'enregistrement de sous-conditions. - http://developers.elementor.com/docs/theme-conditions/sub-conditions
Les groupes cités (general, singular, archive) viennent d'un résumé tiers -> NON VÉRIFIÉ en dehors de `general`.

Non trouvés dans la doc native lue : conditions par rôle, par appareil, par langue, par date/heure -> NON VÉRIFIÉ / probablement absents du natif (les rôles sont l'exemple « avancé » développeur : https://developers.elementor.com/docs/theme-conditions/advanced-example/ , résumé de recherche seulement).

## 3. Conflits et priorité

Ce que la doc dit : un avertissement s'affiche si une condition entre en conflit avec un autre site part (exemple : header « toutes les pages » alors qu'un autre header couvre déjà des pages). - https://elementor.com/help/conditions/

Ce que la doc ne dit PAS : la règle exacte de résolution (quel header gagne). La page officielle précise elle-même qu'elle ne décrit pas la résolution au-delà de l'avertissement -> règle de spécificité NON VÉRIFIÉE.

Hypothèse de travail à valider par test (mémoire / pratique, NON VÉRIFIÉ) : le template le plus spécifique l'emporte (ex. une page précise > catégorie > Singular > Entire Site), et l'Exclude retire un template du jeu des candidats. Pour Kolakisa : définir une règle explicite et documentée.

## 4. Exemples

| Besoin | Réglage |
|---|---|
| Header sur tout le site | Include > Entire Site |
| Header de la boutique | Include > WooCommerce (All), ou Shop Page |
| Header de l'accueil | Include > Singular > Front Page |
| Tout sauf la page contact | Include > Entire Site + Exclude > Singular > Pages > Contact |
| Header spécial pour les articles d'une catégorie | Include > Singular > Posts > In Category > X |
| Header pour la recherche | Include > Archives > Search Results |
| Header pour 404 | Include > Singular > 404 Page |

(Exemples construits d'après la liste ; seul « Shirts et Pants » est dans la doc.)

## 5. Cas limites

- Aucune condition : le header ne s'affiche nulle part (point gris, brouillon). - https://elementor.com/help/wp-json/wp/v2/posts/163845
- Template non publié (brouillon/privé) : invisible côté public. - idem
- Page en layout « Elementor Canvas » : header/footer masqués volontairement. - idem
- Masqué par Hide on Desktop/Tablet/Mobile (Advanced > Responsive). - idem
- Cache : Clear Files & Data puis cache serveur/CDN. - idem
- Thème sans support des locations : remplacer header ET footer ensemble. - https://elementor.com/help/wp-json/wp/v2/posts/252
- REST API désactivée : templates non affichés. - https://elementor.com/help/the-elementor-theme-builder/
- Plusieurs headers qui se recoupent : voir §3.
- Header avec conditions + export/import : si les conditions suivent l'export, NON VÉRIFIÉ (la doc d'import/export lue ne les cite pas). - https://elementor.com/help/import-and-export-elementor-website-templates/
- Thème Hello : option « Disable theme header and footer » citée par un article tiers (divibooster) ; l'aide Elementor sur le header Hello (toggles logo, slogan, menu, copyright dans Site Settings, expérience « Hello Theme Header & Footer ») n'est connue que par un résumé de recherche -> NON VÉRIFIÉ. Hello Biz : non consulté.

## 6. Recommandations pour Kolakisa (déductions)

- Modèle : liste de règles `{mode: include|exclude, type, sous-type, ids[]}` par header.
- Calcul d'un score de spécificité (page précise > taxonomie > type > site) ; égalité = le plus récent ou priorité manuelle ; afficher un avertissement de recoupement comme Elementor.
- Conditions supplémentaires utiles (absentes du natif Elementor) : connecté/invité, rôle, appareil, langue, planification.
- Tester les cas limites du §5.
