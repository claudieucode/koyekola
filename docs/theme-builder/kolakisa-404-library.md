# Bibliothèque « Page 404 » du Theme Builder (v2 — 100 concepts)

> Remplace la bibliothèque « 20 contenus × 5 mises en page » (conservée dans l'historique Git). Les études et le plan sont dans `docs/theme-builder/404/`.

## Périmètre
Catégorie `not_found` (« Page 404 ») : modèle affiché quand une adresse du site n'existe pas. **100 concepts** répartis en **15 familles** (5 à 8 modèles chacune) : minimalistes, créatives, technologiques, illustratives, photographiques, e-commerce, SaaS, éditoriales, entreprises, éducation, communautés, marketing, interactives, élégantes/premium, expérimentales.

## Architecture (inchangée dans son principe)
- **Le catalogue est du code** : aucune ligne en base tant qu'un modèle n'est pas utilisé. `catalog/index.js` expose `entries()`, `list()`, `build()`, `find()` ; `catalog/not_found.js` est le point d'entrée et réexporte `catalog/not_found2.js` (agrégateur) et le dossier `catalog/not_found2/` (un fichier par famille `fam-01.js` … `fam-15.js`).
- **« Utiliser ce modèle »** (`catalog/use.js`) crée une **copie indépendante** dans le site (page du Page Builder + modèle en brouillon). **Changer le catalogue ne touche jamais les 404 déjà utilisées** par les sites (aucune clé de catalogue n'est conservée pour ce type).
- **Rendu public** : `themeBuilder/render.js` choisit le modèle publié applicable ; `themeRender.renderRegion` le rend. **Le statut HTTP 404 est posé par le routage (`server.js`) avant le rendu**, jamais par le modèle ; `noindex` en balise et en en-tête.
- **Widgets de mouvement** : `themeRender.wrapHtml` charge désormais la feuille et le runtime de Motion Studio quand un modèle de région (404, archives, articles…) contient un widget de mouvement (sans quoi ces widgets s'affichaient bruts). Additif : rien n'est chargé sans widget de mouvement.

## Un modèle = un concept
Chaque entrée de `fam-NN.js` est un objet `{ key, family, skin, name, tags, desc, decl: { C, N, P, T }, build(k) }` :
- `skin` : identité fixe (palette et polices, jamais la charte du site) ; modifiable ensuite dans l'éditeur.
- `decl` : ce que le concepteur **déclare** — C composition, N traitement du numéro, P palette, T typographie.
- Les axes **M** (média), **A** (animation), **R** (parcours de récupération) et **D** (densité) sont **dérivés du document construit** (`derive()` dans `not_found2.js`) : on ne peut pas les déclarer faux.
- `extras.json` : pour chaque modèle, 0 à 2 **compléments de récupération** (recherche, articles, catégories, formations, boutique, abonnement, FAQ, fenêtre d'aide, menu, ruban, machine à écrire…) et éventuellement un **traitement du numéro** quand le concept n'en a pas. Ces choix sont **calculés par un optimiseur** pour que toutes les paires de modèles respectent les portes de diversité, parmi des compléments cohérents avec la famille ; ils sont donc reproductibles et vérifiés par test.
- Un lien « Retour à l'accueil » est ajouté automatiquement si un modèle n'a aucune sortie directe en dehors de ses widgets interactifs.

## Données réelles, rien d'inventé
Articles, catégories, formations, produits, recherche, compte, abonnement : **widgets natifs lisant les données du site** ; message vide propre sinon. Aucun faux produit, article, avis, chiffre, ni compte à rebours. Les liens pointent vers des pages standard (`/`, `/blog`, `/catalogue`, `/contact`, `/boutique`, `/compte`).
- **Illustrations** : dessins vectoriels originaux au trait (`not_found2/art.js`), affichés par le widget de tracé SVG de Motion Studio.
- **Photographiques** : aucune photo n'est fournie ni copiée ; ces compositions utilisent les **couvertures réelles** des articles, produits et formations du site (et de grands aplats de couleur). Pour une photo propre, ajouter un widget Image dans l'éditeur.
- **Interactives** : interactions **natives** (boîtes retournables, accordéon, onglets, fenêtres, carrousel, effets au pointeur, bouton magnétique). Aucun mini-jeu d'arcade n'est livré : il demanderait un nouveau moteur de script.

## Contraintes du moteur découvertes (à connaître pour ajouter un modèle)
- Ombres : seulement les préréglages (`sm`, `md`, `lg`, `xl`, texte `glow`) ; pas d'ombre libre.
- Pas de propriété de rotation/transformation, de dégradé ni d'image de fond au niveau d'un élément ; `clamp()` refusé pour les tailles ; `line-height` ≥ 0,8 ; couleurs en hexadécimal.
- Un seul `h1` par modèle (un widget peut porter la balise `h1`) ; aucun positionnement absolu ou fixe ; chaque modèle a au moins une sortie directe.

## Contrôle de la diversité (tests)
`tests/theme-builder-404-diversite.test.js` (sans serveur) vérifie : exactement 100 modèles et 15 familles ; codes `404-001`…`404-100` ; densité ; un seul h1, une action, liens valides ; pour **chaque paire** (4 950) au moins **5 axes sur 8** différents dont **3 structurels sur 6** ; arbres construits distincts et **similarité ≤ 85 %** ; aucune composition au-delà de 20 % des modèles, au moins 12 compositions distinctes.
`tests/theme-builder-404-bibliotheque.test.js` (vrai serveur et Chrome) vérifie : pour chaque modèle utilisé puis publié, l'adresse inconnue répond **HTTP 404** avec le titre du modèle et `noindex`, le site B n'affiche rien du modèle du site A, l'accueil reste 200, et aucun modèle ne déborde à 1440 / 820 / 390 px.

## Ajouter ou modifier un modèle
1. Écrire l'entrée dans la famille `fam-NN.js` (déclarer C, N, P, T ; construire avec `k.*` et les aides de `h.js`).
2. Si le total change ou si la diversité n'est plus tenue, relancer l'optimiseur des compléments : `node scripts/optimiser-complements-404.js` et mettre à jour `extras.json`.
3. Lancer les deux tests ci-dessus.
