# Architecture cible de l'éditeur de blocs d'articles

Principe : **on étend l'architecture existante, on ne la remplace pas** (DT-2, DT-3). Aucun contenu enregistré n'est réécrit : tout ce qui est ajouté est lu et écrit dans le même HTML structuré (`kb-*` + `data-*`).

## 1. Couches

| Couche | Rôle | Fichiers |
|---|---|---|
| Modèle de document | nœuds Tiptap/ProseMirror, un par bloc | `src/editor/blog/nodes.js`, `blocks.js` |
| Format enregistré | HTML structuré, `content_format='html'` | `posts.content`, `post_revisions`, `post_autosaves` |
| Sanitisation | liste blanche stricte, à l'enregistrement ET à l'affichage | `src/utils/blogHtml.js` |
| Rendu public | lecteurs, sommaire, FAQ/Schema, blocs réutilisables résolus par site | `renderBlogHtml`, `services/blog.js:renderPost` |
| Interface | inserteur, barre de bloc, panneau latéral, vue en liste, palette | `src/editor/blog-editor.js`, `workspace*.js` |
| Persistance | création/enregistrement/autosave/révisions/corbeille de blocs | `src/routes/blog.js`, `services/blog.js`, `services/blockTrash.js` |
| Droits | `articles.*` par rôle et par site | `requireBlogAccess` |

## 2. Registre central de blocs (DT-4)

Aujourd'hui un bloc vit à deux endroits qui ne se connaissent pas : le nœud Tiptap et la liste blanche de `blogHtml.js`. Un bloc ajouté d'un côté seulement est **perdu au premier enregistrement**.

Cible : `src/shared/blockRegistry.js` (CommonJS, utilisable par le serveur et par esbuild) décrit chaque bloc :

```js
{ name: "kbGroup", label: "Groupe", category: "layout", html: { tag: "div", class: "kb-group" },
  attrs: { "data-bg": /^(none|light|accent|dark|warm)$/, ... },
  supports: { anchor: true, className: true, lock: true },
  transforms: { to: ["kbColumns"], from: ["*"] } }
```

- Le serveur **vérifie** (test) que chaque entrée du registre a un nœud Tiptap et une règle de sanitisation, et inversement. Le test échoue si un bloc n'a qu'une moitié.
- Les blocs nouveaux de cette mission (Préformaté, Verset, Lire la suite, Fichier, Média et texte, Couverture) sont déclarés dans le registre ; les anciens y sont **inscrits** sans changer leur rendu.
- Pas d'API publique d'extension tierce : Kolakisa n'a pas de système de plugins. L'« API » est ce registre interne + un diagnostic (`/formateur/blog/api/diagnostic` en administration) qui liste les blocs, leur version de schéma et les écarts.

## 3. Prise en charge générique (supports)

Ajoutés une seule fois, pour tous les blocs de la liste `LOCKABLE` :
- **Ancre HTML** → attribut `id`, validé `^[a-z][a-z0-9_-]{0,63}$`, unique dans l'article (le doublon est renommé à l'enregistrement, jamais perdu).
- **Classes CSS supplémentaires** → seulement `kb-x-[a-z0-9-]{1,30}`, 5 maximum. Pas de classe libre : pas de collision avec le CSS du site ni d'injection de style.
- **Verrou, masquage, identité** : déjà présents (`data-locked`, `data-hidden`, `data-block-id`).

## 4. Blocs inconnus (D11)

Un bloc dont la classe `kb-*` n'est pas connue n'est plus aplati en silence : il est conservé tel quel dans l'éditeur sous forme de **bloc de repli** (affiché, non modifiable, avec l'avertissement « bloc non pris en charge »), et la sanitisation renvoie un **rapport** (`{ removed: [...] }`) de ce qu'elle retire (image externe, URL invalide, balise hors liste). L'éditeur affiche ce rapport après l'enregistrement.

## 5. Blocs réutilisables par site (D6/D7)

Colonne `site_id` (NULL = bibliothèque partagée de l'organisation, comportement actuel : aucune donnée existante n'est modifiée). Un article voit les blocs partagés et ceux de son site. Une référence `data-ref` vers un bloc non visible est retirée à l'enregistrement et ignorée à l'affichage. Chaque modification ou suppression d'un bloc est précédée d'un instantané (`blog_reusable_versions`) restaurable.

## 6. Interface

- Un seul magasin d'état : le document Tiptap + `DATA` (page) ; pas de second modèle.
- Sélection multiple de blocs : sélection ProseMirror de plage sur les blocs de premier niveau (clic + Maj dans la vue en liste et le canevas) ; actions de groupe : Grouper, Dupliquer, Supprimer, Déplacer, Copier.
- Transformations : table déclarative dans le registre (`transforms`), appliquée par une seule fonction `transformBlock(pos, target)` qui échoue proprement (message) quand la conversion perdrait du contenu.
- Copier/coller de styles : presse-papiers interne limité aux attributs de présentation du registre (`data-bg`, `data-pad`, alignement, taille…), jamais le contenu.

## 7. Sécurité (inchangé, renforcé)

Défense en profondeur conservée : sanitisation à l'enregistrement + à l'affichage ; refus plutôt que troncature (DT-5) ; empreinte de version obligatoire pour toute écriture de l'éditeur (D3) ; isolation par site vérifiée côté serveur, jamais crue sur parole.

## 8. Ce qui reste volontairement hors architecture

- Éditeur de blocs pour les **pages** (modèle commun absent — DT-1).
- Bloc **HTML personnalisé** : refusé par défaut (sécurité). Prévu seulement derrière une décision produit (réservé aux administrateurs, sanitisé, jamais de script).
- Blocs dynamiques WordPress (requête, navigation, commentaires, etc.) : non applicables, le rendu est côté serveur EJS.
