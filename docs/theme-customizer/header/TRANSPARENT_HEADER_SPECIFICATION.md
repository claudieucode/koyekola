# Entête transparent — spécification

## Comportement
- **Activer sur tout le site** (`tpEnabled`) : l'entête devient `position:absolute` en haut de la page (le contenu passe derrière), fond transparent (ou la « superposition » `tpBg`).
- **Activer sur** (`tpOn`) : `desktop` (au-dessus du point de rupture tablette), `mobile` (tablette + mobile : **la tablette suit le mobile**) ou `both`.
- **Logo transparent différent** (`tpLogo` + `tpLogoUrl`) : le second logo remplace le principal tant que l'entête est transparent ; sinon le logo principal est conservé.
- **Couleurs** : titre (+ survol), slogan, logo (masque), menu (normal / survol / actif, arrière-plan), sous-menu, déclencheur du menu hors-champ, bordure inférieure.
- S'applique à l'entête automatique du site et, pour la structure et le menu, au composant d'en-tête du Theme Builder.

## Non couvert (dépendances absentes du moteur)
Couleurs des médias sociaux, de la recherche, des boutons, du HTML, des widgets, du compte et de la permutation : ces éléments n'existent pas dans l'entête automatique. Les superpositions « au-dessus » et « sous l'entête » demandent des rangées qui n'existent pas encore. Les règles d'exclusion par type de page (articles, archives, erreur) sont prévues dans l'architecture mais ne sont pas exposées tant qu'aucun contrôle ne les honore.

## Réglages
| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `tpEnabled` | Activer sur tout le site | bool | oui/non | false | non |
| `tpOn` | Activer sur | enum | desktop/mobile/both | both | non |
| `tpLogo` | Logo transparent différent | bool | oui/non | false | non |
| `tpLogoUrl` | Logo de l'entête transparent | media | image de la médiathèque | — | non |
| `tpBorder` | Taille de bordure inférieure | num | 0–20 px | — | non |
| `tpLogoColor` | Couleur du logo | color | #rrggbb, couleur du site ou vide | — | non |
| `tpBg` | Superposition d'arrière-plan — entête principal | color | #rrggbb, couleur du site ou vide | — | non |
| `tpTitle` | Titre du site | color | #rrggbb, couleur du site ou vide | — | non |
| `tpTitleHover` | Titre du site — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `tpTagline` | Slogan | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuColor` | Menu : texte/lien — normal | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuBg` | Menu : arrière-plan — normal | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuColorHover` | Menu : texte/lien — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuBgHover` | Menu : arrière-plan — survol | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuColorActive` | Menu : texte/lien — actif | color | #rrggbb, couleur du site ou vide | — | non |
| `tpMenuBgActive` | Menu : arrière-plan — actif | color | #rrggbb, couleur du site ou vide | — | non |
| `tpSubColor` | Sous-menu : texte/lien | color | #rrggbb, couleur du site ou vide | — | non |
| `tpSubBg` | Sous-menu : arrière-plan | color | #rrggbb, couleur du site ou vide | — | non |
| `tpTriggerColor` | Déclencheur du menu hors-champ | color | #rrggbb, couleur du site ou vide | — | non |
