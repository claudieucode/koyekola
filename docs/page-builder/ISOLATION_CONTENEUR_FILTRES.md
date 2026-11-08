# Isolation des filtres d'un conteneur

## Le défaut

Dans l'éditeur, sur une section libre (`layout`) ou un conteneur (`container`, `group`, `stack`, `grid`, `columns`, `column`) qui contient des éléments, Style → Filtres → Flou (ou luminosité, contraste, saturation, teinte, niveaux de gris, sépia, inversion) floutait TOUT : le fond (image d'arrière-plan) et le titre, le texte, les boutons, les images à l'intérieur.

Cause : le serveur écrivait `.kw-n-<id>{…;filter:blur(7px)}` sur la boîte du conteneur. En CSS, `filter` s'applique à la boîte entière rendue avec ses enfants. Le canevas de l'éditeur et la page publiée utilisent le même `pageCss` (`src/marketing/pages/nodes.js`, appelé par `src/marketing/landing/index.js`), donc le défaut était identique des deux côtés. `public/js/page-builder.js` n'écrit aucun CSS d'élément.

Règle voulue : un filtre posé sur un conteneur n'agit QUE sur son fond propre (couleur, image, dégradé, voile), jamais sur ses contenus.

## Le correctif

Dans `pageCss`, la fonction `add()` décide, pour chaque nœud, d'un « mode fond filtré » (`filteredBackground`). Il s'active quand le nœud est un conteneur (`NODE_TYPES[type].container === true`, ou une section `layout`) et qu'au moins un écran ou un état définit un filtre NON NEUTRE (flou > 0, luminosité ≠ 100 %, etc.). Dans ce mode :

1. Toutes les propriétés de fond du nœud (couleur, image, dégradé, voile, taille, position, répétition, fixation, découpe) ET le filtre passent sur `.kw-n-<id>::before`. Le nœud lui-même n'a plus ni fond ni filtre.
2. `::before` : `content:"";position:absolute;inset:-<débord>px;z-index:-1;pointer-events:none;border-radius:inherit`. Le débord vaut 2 × le flou le plus fort du nœud (en px). Un `clip-path:inset(<débord>px round <rayon du conteneur>)` recadre après le filtre : le flou ne laisse pas de bords transparents et ne dépasse pas du conteneur. Le rayon suit l'héritage ordinateur → tablette → mobile (grand écran : ordinateur).
3. Le nœud reçoit `:where(.kw-n-<id>){position:relative;isolation:isolate}` (spécificité nulle) : les enfants restent au-dessus du fond, et une position choisie par l'auteur (absolute, fixed, sticky) l'emporte toujours.
4. La répartition vaut pour CHAQUE écran et CHAQUE état (`:hover::before`, `.lp-site-header.is-scrolled .kw-n-<id>::before`…). Une fois le mode décidé pour un nœud, tous ses fonds de tous les écrans passent sur `::before` (sinon l'héritage tablette/mobile se casserait).
5. Les autres propriétés (bordure, ombre, rayon, remplissage, flex/grille, dimensions, opacité, transformation, masque, « Flou arrière » `backdrop`…) restent sur le nœud, inchangées. Les bandes pleine largeur (`--kw-pl` / `--kw-pr`) aussi.
6. La durée de transition (`transitionDuration`) est répétée sur `::before` pour la couleur de fond et le filtre.
7. Un conteneur SANS filtre non neutre est rendu strictement comme avant : le test compare 7 échantillons de CSS avec la sortie d'avant la correction (`tests/fixtures/isolation-conteneur-avant.json`).
8. Les éléments qui ne sont pas des conteneurs (image, titre, texte, bouton, widgets) gardent `filter` sur eux-mêmes : un flou sur une image floute l'image.

Le CSS libre de l'auteur (`css`, `cssHover`) reste écrit en dernier (`.kw-node.kw-n-<id>{…}`) et peut surcharger.

## Cas particuliers

- Liens (`props.link`), bandes (`band`), conteneurs imbriqués, copies de boucle (règles écrites une fois, `seenIds`) : testés.
- Fond « dans les lettres » (`backgroundClip: text`) : le fond épouse le texte, il ne peut pas être séparé des lettres. Dans ce cas le comportement d'origine est conservé (le filtre reste sur le conteneur). Choix assumé.
- Conteneur à `overflow` masqué : `::before` est à l'intérieur du conteneur ; le débord est de toute façon recadré par `clip-path`.
- Enfant avec `z-index` négatif : le conteneur devient un contexte d'empilement (`isolation:isolate`), donc l'enfant reste à l'intérieur ; il se place au même niveau que `::before` (-1) et se peint par-dessus lui (il vient après dans le document). Non testé en navigateur.
- `prefers-reduced-motion`, impression : non concernés (le CSS ne dépend pas d'eux).

## Compatibilité : ce qui change pour les pages existantes

Une page déjà enregistrée avec un filtre sur un conteneur ou une section change d'aspect : le fond reste filtré, mais les contenus ne le sont plus (c'est ce que demande l'utilisateur). Les pages sans filtre sur un conteneur sont identiques octet par octet. Aucune donnée enregistrée n'est modifiée (aucune migration) : seul le CSS produit change.

## Limites connues

- Le fond couvre la zone intérieure (hors bordure) : une bordure semi-transparente laisse voir la page derrière, non le fond du conteneur. Une bordure pleine n'est pas affectée.
- L'image de fond, si elle est en « cover », est calculée sur la boîte agrandie du débord : elle est environ (2 × flou) px plus grande au total (2 % pour un flou de 7 px sur 1000 px), recadrée aux bords du conteneur.
- Un fond défini par le thème du site (feuille de style) et non par les réglages du nœud reste sur le nœud, non filtré.
- Les classes CSS globales (`classCss`) qui poseraient un `filter` sur un conteneur ne sont pas concernées : le filtre y agit toujours sur toute la boîte.
- Pas de réglage « Appliquer les filtres : au fond / à tout le conteneur » : l'interface des filtres est du code spécifique dans `public/js/page-builder.js`, pas la table `STYLE_UI`, et ajouter un réglage aurait demandé de la modifier. Pour un effet sur toute la section, utiliser le CSS libre de l'élément (`filter:blur(3px)`), qui s'applique à la boîte entière.

## Autres propriétés de conteneur qui agissent sur les contenus (non modifiées, à décider)

- `opacity` : un conteneur à 50 % estompe tout son contenu. Séparer le fond reviendrait à ne rendre transparent que le fond ; risque élevé pour les pages existantes qui s'en servent pour faire apparaître/disparaître une zone entière.
- `mask` / `clip-path` : coupent aussi les enfants. Même remarque ; souvent voulu (forme d'une carte).
- `mix-blend-mode`, `transform` : s'appliquent à la boîte entière, voulu pour une carte inclinée.

## Preuves

`tests/isolation-conteneur.test.js` : CSS (tous types, 8 filtres, écrans, états, imbrication, snapshot sans filtre), Chrome sur la page publiée (styles calculés, comparaison de pixels du texte et du bouton avec/sans flou, bord franc adouci, bords pleins, aucun débord, bouton cliquable via `elementFromPoint`, mobile, survol, lien, bande, fond dans les lettres), et l'éditeur réel (flou réglé dans le panneau sur le conteneur, rechargement). Les parties Chrome sont ignorées sans Chrome.
