# Theme Builder — rapport de fonctionnalité (rendu des réglages)

## Causes racines
1. **Spécificité CSS** : les règles de base du thème (`.lp-site h1/a/.kw-btn { font-family … }`) étaient plus spécifiques que les règles générées par réglage (`.kw-n-<id>`). Le réglage était enregistré, rechargé et publié correctement, mais écrasé à l'affichage.
2. **Héritage cassé** : le `<button>` natif n'hérite pas de la typographie ; les textes internes d'un widget redéfinissaient leur propre police.
3. **Valeurs fixes** dans le logo texte (taille, graisse, espacement).

## Fichiers corrigés
- `public/css/landing.css` — règles de base en `:where()` (spécificité nulle), héritage des boutons natifs, logo texte.
- `src/marketing/pages/nodes.js` — `fontFamily` émet aussi `--kw-font-link/-button/-heading`.
- Nouveaux : `scripts/audit-proprietes.js`, `scripts/audit-parties.js`, `tests/theme-builder-proprietes-rendu.test.js`, trois documents dans `docs/theme-builder/`.

## Catégories auditées
En-tête, pied de page, article seul, archive, résultats de recherche, 404 : test de bout en bout (canevas → enregistrement → rechargement → publication → site public → isolation d'un autre site), en plus du responsive (tablette, masquage mobile), de l'état au survol et de l'élément imbriqué. Détail : `THEME_BUILDER_PROPERTY_VALIDATION.md`.

## Résultats exacts
- Test de bout en bout : **6/6** réussis (0/6 avant correction).
- Audit par type (`audit-proprietes`, 80 types mesurés, 7 propriétés) : 258 mesures conformes, 78 « défaut », 91 « absent » (propriété sans texte concerné ou widget vide), 42 « sans texte ». **La police (`fontFamily`) est conforme sur tous les types sauf `code`** (monospace voulu).
- Audit des parties (`audit-parties`, 75 types, 184 parties) : **0 réglage sans effet**.
- Non-régression, 1346 tests : 1334 réussis, 5 sauf ci-dessous, 5 ignorés.

## Les « défauts » restants : par conception
Il s'agit de widgets composés (tarifs, compteur, diaporama, témoignage, alerte, bascule, frise…) dont les sous-éléments portent leur propre taille/graisse/couleur. Un réglage posé sur le widget entier n'écrase pas ces sous-éléments : on les règle par leurs **parties** (panneau « Style » de la partie), ce que l'audit des parties confirme (0 sans effet). Le bouton interne du widget Recherche garde sa couleur et sa graisse pour la même raison.

## Échecs de la non-régression (non causés par ces changements)
- `theme-builder-elementor-ui` et `theme-builder-kolakisa-ui` (3 tests : barre marine, navigation, responsive de l'interface) : **échouent aussi sans mes modifications** (vérifié en les retirant temporairement). À traiter à part.
- `editeur-blocs-flux-rss`, `editeur-blocs-limites`, `editeur-widgets` : réussis seuls (et sans mes modifications) ; les échecs venaient de la charge de la machine (délais).

## Limites / points ouverts
- Page seule, fiche produit, archive produits, barre latérale, personnalisé : même moteur de rendu, mais **non mesurés** séparément dans le test de bout en bout.
- Le widget Menu n'est mesuré que s'il a un menu assigné.
- 13 types demandent un contenu réel (image, vidéo, formulaire…) pour être rendus : non mesurés par l'audit automatique (erreurs 422 de validation, pas de défaut de rendu).
