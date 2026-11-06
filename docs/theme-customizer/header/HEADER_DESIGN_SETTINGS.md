# Entête — réglages de structure et de design (vue principale)

| Réglage (clé `settings.header.…`) | Libellé | Type | Valeurs / bornes | Défaut | Par appareil |
|---|---|---|---|---|---|
| `auto` | Afficher l'entête automatique du site | bool | oui/non | false | non |
| `width` | Largeur | enum | full/contained | full | non |
| `margin` | Marge externe | space | -400–400 | — | oui |
| `rowHeight` | Hauteur de la rangée principale | num | 40–400 px | — | oui |
| `rowAlign` | Alignement horizontal | enum | between/start/center/end | between | non |
| `rowBg` | Arrière-plan de la rangée principale | color | #rrggbb, couleur du site ou vide | — | non |
| `rowBorder` | Épaisseur de la bordure inférieure | num | 0–20 px | — | non |
| `rowBorderColor` | Couleur de la bordure inférieure | color | #rrggbb, couleur du site ou vide | — | non |
| `rowPadding` | Espacement intérieur | space | 0–200 | — | oui |

## Notes
- **Largeur** : « Pleine largeur » étend le fond de l'entête sur toute la page ; « Largeur du contenu » aligne le contenu sur la largeur de conteneur du site (réglage « Largeur du conteneur » de Mise en page), avec 24 px de bord au minimum.
- **Marge externe / espacement** : quatre côtés (une case vide vaut 0), unités px, em, rem ou %, liaison des quatre valeurs dans l'interface.
- **Par appareil** : la valeur ordinateur s'applique partout ; la tablette et le mobile ne posent une règle que si une valeur propre est saisie — sinon ils héritent.
- **Rangées** : le moteur a une seule rangée (principale). Les rangées « au-dessus » et « sous l'entête » d'Astra ne sont pas disponibles ; la composition montre l'état réel des trois éléments.
