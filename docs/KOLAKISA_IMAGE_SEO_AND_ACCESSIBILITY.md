# SEO et accessibilité des images

`alt.classify` → `informative | decorative | functional | complex`.
- **Décorative** (fond, bannière, bandeau accompagné de texte) : ALT vide proposé.
- **Fonctionnelle** (image cliquable) : le libellé de l'action, pas la description.
- **Informative** : proposée seulement d'après une source connue (description, légende, consigne de génération) ; sans source → `to_describe`, **rien n'est inventé**.
- **Complexe** : ALT court + description longue exigée.

Contrôles `alt.validate` : absent (informative), > 125 caractères, préfixe « image de / photo de », nom de fichier, bourrage de mots-clés (mot ≥ 3 fois ou ≥ 4 virgules), doublon sur la page.

## Non fait
ALT non écrit automatiquement dans les pages (propositions seulement) ; le suffixe « (image générée) » de `aiMedia.suggestAlt`/`altFor` (constat 22.1 M3) est **conservé** car des tests existants l'exigent ; nom de fichier SEO, titre et légende non gérés ici. Aucune conformité WCAG n'est affirmée.
