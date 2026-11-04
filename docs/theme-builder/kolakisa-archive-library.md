# Bibliothèque Archive du Theme Builder — documentation technique

Fichier source : `src/themeBuilder/catalog/archive.js`. Référence Elementor : [`elementor-archive-reference.md`](./elementor-archive-reference.md).

## 1. Périmètre

La catégorie **Archive** (type `archive`) couvre les pages qui listent des articles : **blog** (`/blog`), **catégories**, **étiquettes** et **auteurs** (`/blog/auteur/<id>`). La recherche a sa propre catégorie (`search_results`), les produits aussi (`product_archive`) : elles ne sont pas modifiées ici.

La bibliothèque contient **exactement 100 modèles**. Le catalogue est du **code** : aucune ligne en base tant qu'un modèle n'est pas utilisé. « Utiliser ce modèle » crée une **copie indépendante** dans le site (une page, puis un modèle `mk_tb_templates` en brouillon) : modifier la copie ne change jamais la bibliothèque, et deux sites ne partagent rien.

## 2. Architecture : 20 contenus × 5 traitements

```
100 modèles = 20 ARCHÉTYPES (le contenu : cartes, pagination, aide à la navigation)
            × 5 TRAITEMENTS (la composition de la page autour du contenu)
```

Un modèle ne diffère donc jamais d'un autre par sa seule couleur : changer de traitement change l'arbre d'éléments (colonne latérale, bandeau, en-tête centré…).

**Traitements** (`TREATMENTS`) :

| Clé | Composition | Colonnes max. de la liste |
|---|---|---|
| `pleine` | Titre puis liste sur toute la largeur | 4 |
| `droite` | Liste à gauche, colonne latérale à droite (rubriques, plus lus, étiquettes) | 2 |
| `gauche` | Colonne latérale à gauche (titre, recherche, rubriques), liste à droite | 2 |
| `bandeau` | Bandeau coloré pleine largeur (titre + recherche), liste dessous | 3 |
| `centre` | En-tête centré avec filet, liste dans une colonne de 1000 px | 3 |

**Archétypes** (`ARCHETYPES`, 20) : grille de 3 cartes, grandes cartes, grille dense, liste avec image, article à la une, magazine asymétrique, cartes de texte, liste compacte, mosaïque, chronologie, carrousel puis liste, charger plus, défilement continu, précédent/suivant, portfolio, fil d'actualités, archive de catégorie (filtres), archive d'étiquette (nuage), archive d'auteur (fiche), recherche et filtres.

Clé d'un modèle : `<archétype>.<traitement>` (ex. `grille-3.droite`). Son identité visuelle (skin) est choisie de façon déterministe : `SKIN_ORDER[(indexArchétype + skinShift du traitement) % 5]`, ce qui donne **20 modèles par identité** (clair, marque, nuit, éditorial, doux).

## 3. Schéma de données

Un modèle produit un document `{ name, kind: "page", sections: [{ type: "layout", children: [...] }] }` d'éléments natifs du Page Builder (grammaire fermée de `nodes.js`). Aucun HTML libre, aucun CSS libre.

Éléments utilisés : `container`, `group`, `stack`, `grid`, `heading`, `text`, `image`, `divider`, `archiveinfo`, `catfilter`, `querylist`, `authorbox`, `search`.

**Boucle d'articles** (`grid` avec `props.loop`) :

| Propriété | Rôle |
|---|---|
| `source: "posts"` | Articles du blog du site |
| `archive: true` | La liste **suit l'archive affichée** (catégorie, étiquette, auteur, recherche `?q=`) |
| `count`, `offset` | Taille de page ; décalage (pour enchaîner « une » puis grille) |
| `paginate`, `pagination` | `numbers`, `prevnext`, `both`, `more` (charger plus), `infinite` ; page portée par l'adresse `?lp-<id>=N` |
| `slider: true` | Carrousel horizontal (sans pagination) |
| `urlFilter: true` | Filtre par l'adresse : `?q=` (recherche), `?categorie=` |
| `empty` | Message affiché quand l'archive n'a aucun résultat (toujours renseigné) |

Étiquettes dynamiques d'une carte : `{{post.title}}`, `{{post.url}}`, `{{post.image}}`, `{{post.excerpt}}`, `{{post.category}}`, `{{post.author}}`, `{{post.date}}`. Elles sont résolues **à l'affichage** pour chaque résultat.

## 4. Règles de contenu dynamique

1. Le titre vient du widget `archiveinfo` (titre et description de l'archive, nombre d'articles). Un seul titre principal (h1) par modèle.
2. Les boucles portent `archive: true` : sur `/blog`, tous les articles du site ; sur une catégorie, ses seuls articles ; sur un auteur, les siens.
3. **Isolation des sites** : la requête est limitée aux contenus affectés au site qui sert la page (aucun article d'un autre site).
4. **Aucun contenu de démonstration sur le site publié.** Les exemples n'existent que dans l'aperçu de la bibliothèque, et le titre y est explicitement « Titre de l'archive (exemple) ». Une archive vide affiche le message `empty`.
5. **Images** : toujours `{{post.image}}`, revalidée à l'affichage ; jamais d'image factice.
6. **Liens** : uniquement `{{post.url}}` ou des adresses standard ; aucun lien inventé.

## 5. Règles de rendu et responsive

- Mise en page par **Flexbox et Grid** uniquement. Aucun `position: absolute` ni `fixed` (vérifié par test).
- Toute rangée flex a `flexWrap: wrap` ; les zones de texte prennent la place restante (`flexBasis: 0`, `flexGrow: 1`, `minWidth`).
- Toute grille (y compris les boucles) définit ses colonnes **tablette (≤ 2)** et **mobile (1)**.
- Avec une colonne latérale, la liste est limitée à 2 colonnes pour éviter des cartes étroites.
- Vignette, aperçu, éditeur et site publié viennent du **même document** et du **même rendu** (`themeRender`).

## 6. Règles d'affichage, sauvegarde et publication

Le modèle copié suit le cycle commun du Theme Builder : brouillon → conditions d'affichage (`conditions.js`) → publication → rendu public. Le modèle le plus spécifique l'emporte (une catégorie précise bat « toutes les archives »). Publier un autre modèle archive le précédent (`replace: true`) : aucun reste de l'ancien. La condition « date » existe dans le moteur mais le site n'a aucune page d'archive par date.

## 7. Tests

- `tests/theme-builder-archive-bibliotheque.test.js` :
  - exactement 100 modèles, clés et noms uniques, anciens identifiants disparus ;
  - 5 compositions différentes par contenu, aucun document identique, ≥ 95 signatures de composition distinctes sur 100 ;
  - par modèle : un titre d'archive, une liste qui suit l'archive, état vide, images et liens dynamiques seulement, pas de position absolue, grilles responsives ;
  - présence de toutes les fonctionnalités (5 paginations, carrousel, filtre d'adresse, auteur, filtres, recherche) ;
  - 20 modèles par identité ;
  - serveur réel : les 100 aperçus = vignettes avec archive d'exemple signalée ; publication ; liste d'un blog, d'une catégorie, d'un seul résultat, d'une recherche vide ; pagination « charger plus » sans doublon ; isolation entre sites ; remplacement.
- `tests/theme-builder-catalogue-public.test.js` : adoption d'un modèle d'archive jusqu'au rendu public.
- Vérification visuelle par lots : `scripts/verification-visuelle-archive.js` (Chrome sans interface, 3 largeurs, rapport JSON).

## 8. Limites connues

- Pas d'archive par date, de type de contenu personnalisé ni d'archive de produits dans cette catégorie (les produits ont `product_archive`).
- Les articles sans image mise en avant s'affichent sans image (pas de substitut).
- L'aperçu de la bibliothèque utilise une archive d'exemple : il ne permet pas de choisir une archive réelle du site.
- Le défilement infini et le bouton « charger plus » se comportent comme dans l'éditeur de pages ; leur comportement exact côté navigateur n'a pas été comparé à Elementor (non vérifiable, voir la référence).

## 9. Ajouter ou modifier un modèle

- **Nouveau contenu** : ajouter un `A(clé, libellé, étiquettes, description, { head?, content })` dans `ARCHETYPES`. `content(k, cols)` doit plafonner ses colonnes avec `g(k, n, cols, …)` et garder `archive: true` et `empty`. Le catalogue passe alors à 105 : mettre à jour les tests (le nombre exact est volontairement vérifié).
- **Nouveau traitement** : ajouter une entrée dans `TREATMENTS` (`build(k, archétype)`), avec un `skinShift` qui garde 20 modèles par identité.
- Ne jamais figer d'image ni d'adresse : utiliser `k.img("post.image")` et les étiquettes `{{post.*}}`.
- Relancer `node --test tests/theme-builder-archive-bibliotheque.test.js`.

## 10. Décisions techniques

- **Croisement contenu × composition** plutôt que 100 écritures à la main : garantit la cohérence d'alignement, évite les copier-coller divergents et rend chaque modèle vérifiable par des règles communes.
- **Une seule boucle** (`archive: true`) au lieu de deux widgets (comme Archive Posts et Loop Grid chez Elementor) : un seul chemin de rendu, donc vignette = aperçu = site publié.
- **Catalogue en code** : pas de migration de données ; les sites qui ont utilisé un ancien modèle gardent leur copie.
