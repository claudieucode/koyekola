# Theme Builder — audit du moteur de rendu (réglages de style)

Objectif : un réglage fait dans le panneau « Style » (couleur, police, taille…) doit changer le canevas, survivre à l'enregistrement et au rechargement, et apparaître sur le site publié, pour toutes les catégories de modèles.

## Chaîne de rendu (une seule, partagée)

1. Les réglages sont stockés dans `styles.desktop|tablet|mobile` de chaque nœud (et dans `parts` pour les sous-éléments d'un widget).
2. `src/marketing/pages/nodes.js` (`declarations()`, `pageCss`) transforme chaque nœud en règles `.kw-n-<id> { … }` (parties : `.kw-node.kw-n-<id> <sélecteur>`).
3. Le canevas de l'éditeur est une iframe générée par le serveur (`POST …/rendu`) avec **le même gabarit et le même CSS** que le site public (`marketing-public/landing`, `public/css/landing.css`). Il n'y a donc pas deux moteurs : une anomalie de rendu se voit des deux côtés, et une correction vaut pour les deux.

## Priorité des styles (documentée et testée)

1. Valeur locale du nœud (`styles` du nœud, par appareil) — la plus forte
2. Classe / style assigné (parties `parts`, états survol)
3. Style global du site (jetons : `--kw-font-heading`, `--kw-font-link`…)
4. Base du thème (`landing.css`)
5. Valeur de repli du navigateur

Règle de mise en œuvre : les styles de base du thème sont écrits avec `:where()` (spécificité nulle) pour qu'un réglage local gagne toujours.

## Anomalies trouvées

| # | Fichier | Cause réelle | Impact | Correction | Test |
|---|---------|--------------|--------|------------|------|
| 1 | `public/css/landing.css` | Règles `.lp-site h1/h2/h3 { font-family: var(--kw-font-heading) }`, `.lp-site a { … }`, `.lp-site .kw-btn { … }` : plus spécifiques que `.kw-n-<id>` | La police réglée sur un titre, un lien ou un bouton était ignorée (canevas ET site) | Règles de base réécrites en `:where(...)` (spécificité 0) | `theme-builder-proprietes-rendu` (6/6 ; 0/6 sans la correction) |
| 2 | `landing.css` | `<button>` natif n'hérite pas de la typographie | Police/taille/graisse de la recherche et des boutons natifs ignorées | `:where(.lp-site) :where(button){font-family:inherit;letter-spacing:inherit;text-transform:inherit}` ; `.kw-search button` hérite | audit propriétés |
| 3 | `nodes.js` `declarations()` | La police n'était écrite que sur la racine du widget ; les enfants (liens, boutons, titres) la perdaient via leurs propres règles | Réglage de police sans effet sur les textes internes d'un widget | `fontFamily` écrit aussi `--kw-font-link/-button/-heading` : les règles de base les lisent | audit propriétés / parties |
| 4 | `landing.css` | `.kw-sitelogo-text` fixait taille, graisse et espacement en dur | Le logo texte ne réagissait pas à taille/graisse | Règle ramenée à `:where(.kw-sitelogo)` (hérité) | audit propriétés |
| 5 | `catalog/footer.js` | Pieds de page : couleurs/polices dépendaient de la charte du site | Réglages écrasés selon la charte | Identités fixes par modèle (livré avant, voir doc pieds de page) | `theme-builder-pieds-identites` |

## Méthode de vérification

- Test de bout en bout `tests/theme-builder-proprietes-rendu.test.js` (vrai Chrome, styles **calculés**, domaine réel `a.test`/`b.test`) : réglage → canevas → enregistrement → rechargement → publication → site public → autre site non affecté, pour 6 catégories (en-tête, pied de page, article, archive, résultats de recherche, 404). Avant correction : 0/6. Après : 6/6.
- `scripts/audit-proprietes.js` : pour chaque type d'élément (hors conteneurs purs), 7 propriétés de texte sont réglées et mesurées sur chaque texte visible.
- `scripts/audit-parties.js` : chaque « partie » (sous-élément) de chaque widget est réglée et mesurée.
- Non-régression : 1346 tests des familles styles/pages/éditeur/Theme Builder ; 1334 réussis. Les échecs restants sont décrits dans le rapport de fonctionnalité (déjà présents avant ces changements, ou dus à la charge).
