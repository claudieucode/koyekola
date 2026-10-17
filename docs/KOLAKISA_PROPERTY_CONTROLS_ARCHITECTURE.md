# Architecture du moteur de propriétés et de contrôles

*Chantier « Prompt 2 ». Ce document décrit ce qui existe réellement dans le code (rien n'a été reconstruit) et le contrat que les tests font respecter.*

## 1. Une seule source de vérité : le serveur

```
src/marketing/pages/nodes.js
 ├─ STYLE_PROPS   110 propriétés de style : { css, check(valeur) → valeur normalisée | null, out(valeur) → CSS, group }
 ├─ STYLE_UI      libellé + liste d'options (pour les propriétés « à liste »)
 ├─ COMPOSED      8 propriétés composées : backgroundImage, gradient, overlay, shadow, filter, backdrop, transform, mask
 ├─ NODE_TYPES    92 types d'éléments : props(p) = normalisation du contenu de l'élément
 ├─ editorSpec()  description envoyée au navigateur (SPEC) : types, propriétés (kind : enum | color | number | text | length), groupes
 └─ pageCss()     génération du CSS (même fonction pour le canevas et la page publiée)
```

*Aucune valeur libre n'atteint la page* : le CSS est fabriqué à partir de valeurs validées par `check`, sous la classe `.kw-n-<id>`.
Une valeur invalide est **refusée** (erreur 422 qui nomme le réglage), jamais corrigée en silence ; une valeur vide / `null` signifie
« hériter » et la clé disparaît du document.

## 2. Du contrôle au site publié

```
Contrôle de l'inspecteur  (public/js/page-builder.js, fabriqué d'après SPEC.styleProps[kind])
   │  enum   → boutons à icônes (ICON_ENUMS) ou liste       color → colorButton (HEX/RGB/HSL, opacité, jetons du site)
   │  number → numberControl  (bornes NUM, précision/entier NUMCFG)       length → lengthControl (unités UNITS, jetons LEN_FAMILY)
   │  text   → pistes de grille
   ▼
setStyle(ids, clé, valeur)  →  setStyles : écrit dans styles[écran] ou states[état] de l'élément (vide = supprime la clé), cleanStyles()
   ▼
change() : une étape d'historique (annuler/rétablir), aperçu immédiat en style en ligne (clearPreviews), rendu patché du canevas
   ▼
PUT /marketing/pages/:id/brouillon  → normalizeStyles → STYLE_PROPS[clé].check   (422 si invalide)
   ▼
POST /marketing/pages/:id/rendu → pageCss → canevas (iframe patchée en place)          publication → /p/<slug> (même pageCss)
```

### Valeur propre, héritée, par défaut

| Notion | Où elle vit | Comportement |
|---|---|---|
| Valeur **propre** | `styles[écran][clé]` ou `states[état][clé]` | écrite par le contrôle ; affichée en noir ; bouton ↺ |
| Valeur **héritée** | écran plus grand (`inheritedValue`) | champ vide + valeur grise (placeholder) ; rien n'est écrit dans le document |
| **Absente** | clé non présente | n'écrase jamais l'héritage ni le défaut du thème : aucune déclaration CSS n'est produite |
| **Réinitialiser** (↺) | `setStyle(…, "")` | supprime la surcharge locale de CET écran / état et rend l'héritage |
| **Référence globale** | `token:primary`, `token:space-md`… | conservée telle quelle dans le document ; convertie en `var(--kw-…)` au rendu (changer le jeton met à jour tous les éléments) |
| **Invalide** | refusée par `check` | message sur le contrôle (client) ou 422 nommant le réglage (serveur) ; le document précédent reste intact |

### Écrans et états

Quatre écrans (`desktop`, `wide`, `tablet`, `mobile`) et trois états (`hover`, `focus`, `active`). Une valeur d'un écran n'est écrite que dans
le `@media` de cet écran ; un écran sans valeur n'écrit rien. Toute propriété est acceptée sur tous les écrans et états (même `check`).

## 3. Le contrat que les tests font respecter

`tests/controles-contrat.test.js` (rapide, sans navigateur) :

* chaque propriété a un libellé, un groupe connu, une propriété CSS ; `enum` ⇔ liste d'options ;
* toute option d'une liste est acceptée par le serveur (**aucune option qui semble fonctionner sans l'être**) ;
* validateurs idempotents ; jamais `NaN` / `undefined` / `null` dans le CSS ;
* valeurs hostiles (`;`, `}`, `url(…)`, `expression`, `!important`, `\`) refusées ou sans effet dangereux ;
* toute propriété qui accepte une couleur du site (`token:…`) la convertit en `var(--kw-…)` ; idem pour les longueurs du site ;
* **bornes et caractère entier de chaque nombre : côté interface = côté serveur** ; **toute unité proposée par un menu est acceptée par le serveur**.

`tests/controles-coherence.test.js` (vrai serveur) : références de couleur conservées partout (style, états, dégradé, voile, ombre, séparateur, icônes, formes) ;
vide = hériter ; invalide = refus nommé sans rien casser ; unités ; écrans ; valeurs inconnues ; position du séparateur conservée sans texte.

`tests/controles-matrice-navigateur.test.js` (Chrome réel) : voir le rapport de tests.

## 4. Spécialisations conservées (non uniformisées volontairement)

| Famille | Pourquoi un composant dédié |
|---|---|
| Marges / intérieurs | 4 côtés liés ou non, unité commune, valeur du site pour les 4 côtés |
| Bordure / arrondi déliés | 4 côtés / 4 coins indépendants, écrits après la valeur générale |
| Police | bibliothèque (Font Manager), recherche, favoris, chargement à la demande |
| Couleur | HEX 3/6/8, RGB, HSL, opacité, jetons du site |
| Composées (ombre, filtres, transformation, masque, dégradé, fond) | plusieurs valeurs → une déclaration ; chaque champ modifie sa part sans écraser les autres |
| Grille / flex enfant | réglages proposés selon la mise en page du **parent** (`parentLayout`) |

## 5. Ce qui n'a PAS changé

L'interface, les panneaux, le thème, le modèle de données, la sérialisation. Les corrections de ce chantier sont listées dans le rapport d'implémentation.
