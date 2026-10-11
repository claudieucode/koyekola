# Architecture de style des widgets KOLAKISA — proposition (LOT 2 / 3 / 4)

*Document de conception, sans code : il décrit comment ajouter des « cibles de style » (parties internes) à tous les widgets en s'appuyant sur ce qui existe.
Faits vérifiés dans `src/marketing/pages/nodes.js`, `public/js/page-builder.js`, `views/marketing-public/_node.ejs`, `public/css/landing.css`. La matrice est dans `KOLAKISA_WIDGET_CONTROL_MATRIX.md`, le plan de non-régression dans `KOLAKISA_WIDGET_REGRESSION_PLAN.md`.*

## 1. Chemin actuel d'un réglage de style (vérifié)

```
Inspector (styleSection / contrôle)
   → setStyles(ids, {clé: valeur})                      public/js/page-builder.js
        → change(fn, {key})                              historique : capture JSON complète, regroupée par clé
             → styleSet(nœud, écran, état, create)       ← POINT DE PASSAGE UNIQUE côté éditeur
                  nœud.styles[écran][clé]  |  nœud.states[état][clé]
        → afterChange → POST …/rendu (document complet) → patchCanvas (mise à jour en place) → enregistrement différé (PUT …/brouillon)
Serveur
   normalizeNode → normalizeStyles → normalizeStyleSet    grammaire fermée STYLE_PROPS (rien de libre)
   pageCss(sections) → add(id, styles, states)            ← POINT DE PASSAGE UNIQUE côté rendu : `.kw-n-<id>{…}`, @media par écran, :hover/:focus-visible/:active
   _node.ejs ajoute la classe `kw-n-<id>`                  même code : canevas, aperçu, page publiée
```

Deux points de passage uniques signifient qu'une extension faite à ces deux endroits profite automatiquement à : tous les contrôles, l'historique, l'enregistrement, la
publication, l'aperçu, les révisions / versions, le copier-coller, les écrans. C'est le fondement de la proposition.

## 2. Ce qui manque, précisément

Un style n'a qu'**une cible : la racine du nœud**. Les parties internes d'un widget (carte, image, date, titre…) sont stylées par des règles en dur dans
`landing.css`. Conséquences : impossible de les régler depuis l'Inspector, les réglages de la racine ne les atteignent que par héritage, et les remplacer exige du CSS de page (permission `pages.code`).
44 widgets sur 86 présentent au moins deux parties internes visibles.

## 3. Alternatives examinées

| Option | Verdict |
|---|---|
| A. Transformer chaque sous-élément en nœud du document (vrais widgets enfants) | **Rejetée comme règle générale** : explose le nombre d'éléments (limite 400), casse le contrat des widgets existants et des pages publiées, alourdit le canevas. **Conservée comme voie spécialisée** : la grille à boucle existante fait déjà cela pour les contenus dynamiques. |
| B. Ouvrir le CSS libre sur les parties | **Rejetée** : contraire au principe de sécurité du produit (grammaire fermée, pas de CSS libre pour les auteurs ordinaires). |
| C. Un jeu de propriétés « par partie » propre à chaque widget (`titleColor`, `cardRadius`…) | **Rejetée** : une propriété par réglage et par widget = des centaines de champs, des contrôles dupliqués, aucun responsive ni état. Ce modèle est celui des 7 réglages ponctuels actuels et ne passe pas à l'échelle. |
| **D. « Parties » : un jeu de styles par partie, même forme que `styles` / `states`** | **Retenue** (ci-dessous). |

## 4. Proposition : les « parties » (style targets)

### 4.1 Déclaration (registre, une seule fois par widget)

Dans la description du widget (`NODE_TYPES` pour les natifs, `registerWidget` / `def.parts` pour les personnalisés) :

```js
parts: {
  card:    { label: "Carte",   select: ".kw-post-card",    groups: ["background","border","spacing","effects","layout"], states: ["hover","focus"] },
  image:   { label: "Image",   select: ".kw-post-card img", groups: ["size","media","border","effects"] },
  meta:    { label: "Date",    select: ".kw-post-date",    groups: ["typography","spacing"] },
  title:   { label: "Titre",   select: ".kw-post-title",   groups: ["typography","spacing"], states: ["hover"] },
  excerpt: { label: "Extrait", select: ".kw-post-excerpt", groups: ["typography","spacing"] },
}
```

* `select` : sélecteur **choisi par le développeur dans le registre**, jamais saisi par l'auteur ; il est préfixé par `.kw-n-<id>` à l'écriture (`.kw-n-<id> .kw-post-card`).
* `groups` : sous-ensemble des groupes de propriétés existants (`STYLE_PROPS[...].group`), éventuellement restreint à une liste de clés ; ce qui n'est pas listé est refusé à la normalisation.
* `states` : états autorisés pour cette partie (aucun pour une partie non interactive).
* `root` reste implicite : le profil actuel du widget (`INSPECTORS[type].groups`) **ne change pas**.

### 4.2 Donnée enregistrée (compatible, facultative)

```json
{ "id": "…", "type": "posts", "props": {…}, "styles": {…}, "states": {…},
  "parts": { "card": { "styles": { "desktop": { "borderRadius": "20px" }, "mobile": { "paddingTop": "12px" } }, "states": { "hover": { "boxShadow": "lg" } } },
             "title": { "styles": { "desktop": { "fontSize": "22px" }, "mobile": { "fontSize": "18px" } } } } }
```

* Même forme que `styles` / `states` du nœud : **la même fonction de validation** `normalizeStyleSet` est appelée par partie, avec en plus le filtre `groups` de la partie.
* Absence de `parts` = comportement historique, octet pour octet (pas de migration des pages existantes, pas de changement de `version` de la page).
* Les propriétés composées (ombre, dégradé, filtre, transformation, masque, fond image) passent par le même chemin.
* Les pages enregistrées avant l'évolution restent valides et les pages enregistrées après restent lisibles par l'ancien code : une clé inconnue `parts` serait ignorée (à vérifier au LOT 6 sur la copie de production).

### 4.3 Rendu (serveur, un seul endroit)

Dans `pageCss()`, `add(id, styles, states)` reçoit en plus `parts` et appelle la même boucle (écrans, états) avec le sélecteur de la partie :

```
.kw-n-<id> .kw-post-card{…}                    (ordinateur)
@media (max-width:1023px){ .kw-n-<id> .kw-post-card{…} }
.kw-n-<id> .kw-post-card:hover{…}
```

* **Spécificité** : les styles par défaut de `landing.css` pour les parties passent en `:where(…)` (spécificité nulle) au fur et à mesure que les parties sont déclarées ; les règles de l'auteur (`.kw-n-<id> .partie`) l'emportent ainsi sans `!important`.
* **Hors portée** : tout est généré uniquement pour les parties effectivement stylées (aucune règle ajoutée tant qu'une partie est vide).
* Sécurité : sélecteur du registre, valeurs de la grammaire fermée, identifiant validé (`NODE_ID`) : aucune nouvelle surface d'injection.

### 4.4 Éditeur (un seul point de passage)

`styleSet(nœud, écran, état, create)` apprend une **cible courante** `styleTarget` (« racine » par défaut) :

* cible = racine → comportement actuel inchangé ;
* cible = partie `p` → il lit / écrit `nœud.parts[p].styles[écran]` ou `nœud.parts[p].states[état]`.

Comme tous les contrôles (`ownValue`, `inheritedValue`, `setStyles`, `cleanStyles`, copier / coller du style, bouton d'effacement) passent par `styleSet`, **aucun contrôle n'est dupliqué**.
Interface : dans l'onglet Style, une rangée de puces ou un menu « Partie : Carte · Image · Date · Titre · Extrait » au-dessus du sélecteur d'écran / d'état ; seuls les groupes
autorisés de la partie sont affichés (donc jamais de contrôle inutile) ; un point signale les parties déjà personnalisées ; un bouton « Réinitialiser la partie » supprime son jeu de styles
(retour aux valeurs par défaut du thème, pas « à zéro »).

### 4.5 Responsive et états

* Écrans : identiques à la racine (`styles[écran]`, héritage vers le bas, valeur héritée en grisé).
* États : le modèle actuel ne décline pas les états par écran ; pour les parties on reste **identique** (un jeu par état) afin de ne rien introduire de différent. Un état par écran pourra être ajouté plus tard pour toutes les cibles à la fois si le besoin se confirme (le survol n'a pas de sens sur mobile).

### 4.6 Hérité / global / local

Ordre de résolution (déjà celui du produit, étendu aux parties) : valeur par défaut du thème (`landing.css` en `:where`) → styles du site (`themeCss`) → classe globale → réglage local de la partie → écran plus étroit → état.
Les **classes globales** (`normalizeClassDefs`) pourront porter `parts` avec la même normalisation (LOT 10) ; les jetons de couleur, d'espacement, de rayon et de type du site restent utilisés par `withLenToken` / `colorCss`.

### 4.7 Historique, enregistrement, publication

* Historique : inchangé (la capture JSON contient `parts` ; les curseurs gardent leur clé de regroupement : une étape par geste).
* Enregistrement : `PUT …/brouillon` du document complet, inchangé.
* Publication / aperçu / révisions / versions : copient le document, donc `parts` aussi ; `pageCss()` est le seul producteur du CSS.
* Copier / coller le style : copie aussi `parts[p]` correspondant (ou le groupe choisi) vers un widget de même type ; vers un autre type, seules les parties de même clé sont reprises.

### 4.8 Accessibilité et HTML

Les parties ne changent **ni le HTML ni l'ordre des éléments** : seuls des styles sont ajoutés (contrastes, tailles, `outline` du focus restent sous la responsabilité de l'auteur ; le focus clavier garde un style par défaut visible, non supprimable par une partie si la propriété `outline` n'est pas dans la grammaire).
Pas de masquage visuel d'un contenu porteur de sens par `display` sans contrepartie : les cases « afficher la date / l'extrait / l'image » restent les contrôles de présence (Contenu).

### 4.9 Performance

* Aucune requête, aucun observateur, aucun rendu supplémentaire : le changement de partie remplace seulement les paramètres de `styleSet` ; l'Inspector est déjà reconstruit à chaque sélection.
* Côté serveur : une boucle de plus uniquement pour les nœuds qui ont `parts` ; poids du CSS proportionnel au nombre de parties réellement stylées.
* Le canevas continue d'être mis à jour en place (`patchCanvas`) ; un réglage de partie ne modifie que la section qui le contient.

### 4.10 Extensibilité

Un nouveau widget déclare `schema` (contenu), `style` (profil de racine), `parts` (cibles), son gabarit EJS (avec les classes déclarées) : ni l'Inspector, ni `pageCss()`, ni l'historique ne changent.
Un test de contrat (`widgets-contrat.test.js`, existant) sera étendu : chaque `parts[].select` doit exister dans le gabarit rendu du widget et chaque classe utilisée doit avoir un style.

## 5. Pourquoi cette voie est la plus sûre

1. Aucune modification des données existantes, aucun changement des pages sans `parts` (sortie identique, testable).
2. Aucun nouveau contrôle, aucun nouveau moteur : les deux points de passage sont étendus, pas contournés.
3. Aucune CSS libre ; le sélecteur vient du registre.
4. Progressif : on peut livrer le moteur puis déclarer les parties widget après widget ; un widget sans `parts` se comporte comme aujourd'hui.
5. Cohérent avec les widgets personnalisés et les futurs widgets.

## 6. Risques identifiés

| Risque | Parade |
|---|---|
| Règles par défaut de `landing.css` plus spécifiques que `.kw-n-<id> .partie` | passer les défauts de chaque widget déclaré en `:where()` au moment où il est déclaré ; test de spécificité par widget |
| Poids du CSS sur une page chargée | ne générer que les parties stylées ; mesurer avant / après (bench existant) |
| Parties dont la structure change selon une option (`layout: list`) | sélecteurs stables (classes de rôle, pas de structure) ; option documentée dans `parts` si une partie disparaît |
| Désynchronisation gabarit ↔ registre | test de contrat qui rend le widget et vérifie chaque `select` |
| Pages copiées entre sites / modèles / composants | `parts` fait partie du nœud : copié partout avec lui ; vérifier `normalizeNode` aux points d'import (modèles de page, composants, bibliothèque de blocs) |
| Surcharge de l'Inspector | groupes limités par partie, accordéons, rien d'affiché si non pertinent |
| États non déclinés par écran | comportement identique à la racine ; extension ultérieure commune |

## 7. Plan par lots (rappel et ajustement)

| Lot | Contenu | Prérequis / critère |
|---|---|---|
| 0–3 | Audit, matrice, architecture (ce document) | fait |
| 4a | Instantanés de référence (rendu + CSS de 86 types et pages) | test « sortie identique » vert |
| 4b | `parts` : validation (`normalizeNode`), CSS (`pageCss`), contrat de widget, aucune partie déclarée | sortie identique, tests unitaires |
| 5 | Premier cas : `posts` (carte, image, date, titre, extrait, lien ; lignes max de l'extrait) | UI → modèle → rendu → enregistrement → rechargement → annuler / rétablir → écrans → aperçu → publication |
| 6 | Validation du moteur (ancienne page ouverte et re-enregistrée sans changement) | aucun octet modifié |
| 7 | Extension : `courselist`, `querylist`, `testimonial`, `pricing`, `accordion`, `tabs`, `signupform`, `table`, `gallery`… par ordre d'impact | par famille, matrice mise à jour |
| 8–9 | Responsive et états (vérification, pas de nouveau modèle) | tests par écran / état |
| 10 | Classes globales étendues aux parties | migration inutile (champ facultatif) |
| 11 | Copier / coller le style des parties | tests copier-coller |
| 12 | Accessibilité (contraste d'aide, focus visible) | contrôle automatique |
| 13 | Performance (20 / 100 / 300 / 400 éléments) | pas de dégradation mesurée |
| 14 | Régression complète | voir le plan |

## 8. Hors périmètre volontaire

Refaire les widgets ; transformer les parties en nœuds ; CSS libre pour les auteurs ordinaires ; modifier le design de l'Inspector ; ajouter des widgets absents.
