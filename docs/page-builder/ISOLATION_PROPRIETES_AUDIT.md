# Isolation des propriétés du Page Builder : audit

Règle voulue : tout réglage fait dans le panneau de propriétés d'un élément n'affecte que cet élément (son identifiant unique), à tous les niveaux d'imbrication. L'héritage voulu (réglages globaux du thème, variables CSS, classes globales) reste permis.

## 0. CORRECTION DE LA CONCLUSION (à lire d'abord)

La conclusion « non reproduit » de la section 1 est FAUSSE pour le cas réellement signalé. Mon essai flouait une IMAGE (un élément sans enfants). Le vrai défaut est le flou (et les autres filtres) posé sur une SECTION LIBRE ou un CONTENEUR qui contient des éléments : en CSS, `filter` sur une boîte s'applique à la boîte entière rendue avec ses enfants, donc le fond ET le titre, le texte, les boutons étaient flous. Reproduit et corrigé : voir `ISOLATION_CONTENEUR_FILTRES.md` et `tests/isolation-conteneur.test.js`. La section 1 ci-dessous est conservée telle quelle pour l'historique : ce qu'elle dit de l'image reste exact (un filtre sur une image floute l'image, c'est voulu).

## 1. Le défaut signalé (flou de l'image qui floute tout le conteneur)

Constat honnête : je n'ai PAS pu reproduire ce défaut dans le code de ce dépôt. Ce qui a été essayé, avec de vrais résultats :

| Essai | Résultat |
|---|---|
| Éditeur réel dans Chrome : conteneur avec image, titre, texte, bouton. Clic réel sur l'image, onglet Style, Flou = 8. | Seule l'image est floue (`filter: blur(8px)`). Titre, texte, bouton et conteneur : `filter: none`. Le brouillon enregistré ne contient le style que sur l'image. |
| Même chose après rechargement de l'éditeur | Identique. |
| CSS publié (`pageCss`) du même cas | Une seule règle : `.kw-n-<idImage>{filter:blur(8px)}`. |
| Balayage de 131 types de widgets, 13 familles de réglages (flou, opacité, rayon, couleur, taille de texte, police, ombre, transformation, filtre d'arrière-plan, curseur, z-index, fond, bordure), chaque widget entouré d'un titre et d'un texte voisins, comparé page par page au même rendu sans réglage (styles calculés par Chrome) | Aucune fuite vers les frères ni vers le parent. 18 types n'ont pas pu être testés car ils exigent des réglages obligatoires (embed, carousel, lottie, etc.). |
| Feuilles de style globales (landing.css, globalStyles.js, themeCss.js) | Aucune règle `filter` posée sur `.kw-container`, `.kw-layout` ou `.kw-node` en général. Les `filter` de landing.css visent des composants précis (bouton au survol, texte rotatif, texte découpé). |
| kw-effects.js (défilement / souris) | Écrit `filter`, `translate`… uniquement sur l'élément qui porte l'attribut. Un seul point écrit sur le PARENT : `perspective` (inclinaison 3D), voir risque R3. |

Scénarios qui pourraient encore provoquer le symptôme (non reproduits, à vérifier sur la version déployée ou avec les données de la personne) :

1. Le clic a sélectionné le CONTENEUR et non l'image (image recouverte par un voile, ou clic avec Maj / Ctrl / Cmd qui ajoute à la sélection : `page-builder.js` ligne 5553 traite Maj, Ctrl et Cmd comme « ajouter à la sélection », et le réglage s'applique alors à toute la sélection).
2. Les quatre éléments portent la même classe globale (« Classes CSS globales ») ou sont des instances liées d'un composant global : modifier la classe / le composant modifie tous les éléments qui l'utilisent. C'est voulu, mais peut surprendre.
3. Une version déployée différente de ce dépôt.

## 2. Défaut RÉEL trouvé et corrigé : l'historique mélangeait deux éléments

Cause racine : `public/js/page-builder.js`, fonction `setStyles` (environ ligne 1044). La clé qui regroupe des frappes successives en une seule étape d'annulation était `clé du champ + écran + état`, SANS l'identifiant de l'élément. Pour le sélecteur de couleur la clé est `color:<propriété>` (ligne 3508), la même pour tous les éléments. Résultat : changer la couleur du titre, cliquer le texte, changer sa couleur : les deux changements formaient UNE seule étape. Un seul « Annuler » rendait la couleur d'origine aux DEUX éléments (preuve exécutée avant correction : après deux changements et un Annuler, titre ET texte étaient revenus à la couleur d'origine, et le bouton Annuler était grisé).

Même faiblesse dans `setProp` (réglages de contenu avec une clé sans identifiant).

Correction : la clé contient maintenant les identifiants des éléments visés, la partie (`styleTarget`), l'écran et l'état. Aucune donnée ni API modifiée, aucune migration nécessaire.

## 3. Classification des propriétés

Chaque réglage est écrit dans `it.styles[écran][clé]`, `it.states[état][clé]` ou `it.parts[partie]…` de l'élément sélectionné (`styleSet`, `holderOf`), puis rendu par `src/marketing/pages/nodes.js` avec le sélecteur `.kw-n-<id>` (parties : `.kw-node.kw-n-<id> <sélecteur>`).

| Famille | Propriétés | Classe | Où c'est écrit / rendu |
|---|---|---|---|
| Visuelles | filter (flou, luminosité, contraste, saturation, teinte, gris, sépia, inversion), opacité, ombres, rayon, bordures, couleurs, fonds, dégradés, voile, masque, backdrop | Individuelle | `.kw-n-<id>` de l'élément |
| Typographie | police, taille, graisse, interligne, espacement, alignement, ombre du texte | Individuelle (les descendants héritent par le CSS normal) ; valeurs globales du thème = Globale héritée | `.kw-n-<id>` ; variables `--kw-…` pour le global |
| Dimensions | width, height, min/max, flex-grow/shrink/basis, align-self, order, margin, position, z-index | Individuelle (propriétés d'ENFANT : s'écrivent sur l'enfant) | `.kw-n-<id>` |
| Dispositions du conteneur | display, flex-direction, flex-wrap, justify/align, gap, row/column-gap, grille (colonnes, lignes), padding | Structurelle (restent sur le PARENT, règlent la disposition des enfants) | `.kw-n-<idParent>` |
| Avancées | transformations, transitions, animations d'entrée, visibilité, curseur, hover / clic, CSS perso (`n.css`), attributs | Individuelle | `.kw-n-<id>`, `.kw-node.kw-n-<id>` |
| États | normal / survol / focus / actif | Individuelle | `.kw-n-<id>:hover` etc. |
| Responsive | ordinateur / tablette / mobile | Individuelle, par écran (héritage de l'écran plus grand) | `@media` + `.kw-n-<id>` |
| Globales | typographie / couleurs / conteneur / boutons du thème, classes globales, composants globaux | Globale héritée (voulue) | variables CSS, règles de faible spécificité, écrites AVANT les `.kw-n-<id>` donc une valeur perso gagne toujours |

## 4. Risques restants (non corrigés, à connaître)

- R1 : sélection multiple (Maj / Ctrl / Cmd + clic) : le réglage s'applique à tous les éléments sélectionnés. C'est voulu ; l'inspecteur le signale par le nombre d'éléments.
- R2 : une copie d'un modèle de boucle partage son identifiant (`seenIds` dans `pageCss`) : comportement voulu, les copies ont le même style.
- R3 : `kw-effects.js` pose `perspective` sur le parent pour l'inclinaison 3D et mémorise sa valeur de départ à la première pose : avec deux frères inclinés, la valeur « de départ » du second est déjà celle posée par le premier. Pas d'effet visible dans le cas normal ; non corrigé car structurel au 3D.
- R4 : les tests navigateur existants (`*-navigateur.test.js`) exigent Playwright, absent de cette machine : ils sont ignorés ici. Les nouveaux tests utilisent un petit pilote Chrome maison (`tests/helpers-chrome-cdp.js`).

## 5. Plan de correction (réalisé)

1. Clé d'historique : identifiants + partie dans `setStyles`, identifiant dans `setProp`.
2. Pilote Chrome sans dépendance pour pouvoir vérifier dans un vrai navigateur.
3. Suite `tests/isolation-proprietes.test.js` : 10 scénarios demandés, 3 niveaux d'imbrication, propriétés structurelles, héritage voulu, widgets à parties.

Aucune architecture changée, aucun système parallèle, aucune migration.
