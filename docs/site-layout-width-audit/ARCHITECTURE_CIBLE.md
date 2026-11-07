# Architecture cible (proposition, rien n'est implémenté)

## Principe : extérieur / intérieur
- **Extérieur** : toujours 100 % (fond, bordures).
- **Intérieur** : largeur pilotée par jetons CSS.

## Jetons centraux (par site, posés sur `.lp-site` / `:root` du site)
```
--kw-w-narrow:   620px   /* formulaires, connexion, lecture */
--kw-w-standard: 900px   /* texte long */
--kw-w-wide:     var(--kw-container, 1280px) /* contenu large */
--kw-w-max:      1600px  /* plafond grands écrans */
--kw-gutter:     clamp(16px, 4vw, 40px)
```
Valeurs de départ à fixer à l'étape 1 ; elles **reprennent** `contentWidth`, `containerWidth`, `gutter` de `siteSettings.js` (pas de nouveau réglage utilisateur au départ) : les defaults actuels (760/1100/16) restent la valeur de repli pour que les sites existants ne bougent pas.

## Quatre comportements
| Type | Mécanisme proposé |
|---|---|
| Full width | `.kw-full` / fond `band` (existe) |
| Wide | `max-width: var(--kw-w-wide)` + `padding-inline: var(--kw-gutter)` |
| Standard | `var(--kw-w-standard)` |
| Narrow | `var(--kw-w-narrow)` (`.lp-w-narrow` existe) |

## En-tête / pied (Theme Builder)
Classe de pièce toujours appliquée : le `.lp-main` de la pièce passe en `max-width:none; padding-block:0` **par défaut** pour `kw-theme-header/footer` ; le contenu intérieur se cale avec `--kw-w-wide`. À valider : compatibilité avec les pièces existantes qui s'appuient sur la colonne 760 px (voir RISQUES).

## Vues EJS classiques
`.container-wide` lit `var(--kw-w-wide, 1240px)` : défaut inchangé, donc zéro régression ; grilles : `minmax` conservé, plafond relevé via le jeton.

## Thèmes
Ne pas supprimer les `!important` des packs. Option : faire lire `--pk-max` à partir du jeton quand le pack ne le définit pas (`var(--pk-max, var(--kw-w-wide, 1280px))`).

## Éditeur
Les trois niveaux demandés (section, conteneur, contenu) existent déjà en grande partie. Évolution éventuelle (hors périmètre, à proposer séparément) : indiquer dans l'éditeur quand un en-tête/pied n'est pas en `band`.
