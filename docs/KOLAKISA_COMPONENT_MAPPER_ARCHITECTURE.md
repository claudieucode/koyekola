# Component Mapper — architecture

- **Registre** (`registry.js`) : lu dans `pages/sections.TYPES`. Pour chaque type : identifiant, libellé, catégorie, ce qu'il fournit, dépendances, responsive, et **propriétés autorisées déduites en exécutant le normaliseur réel** sur un exemple (aucune liste de propriétés écrite à la main). Les types réservés au Page Builder (`layout`, `component`) ne sont pas utilisés.
- **Catégories absentes** (déclarées, jamais présentées comme disponibles) : galerie/grille, tableau, carte de lieux, composant de navigation, liste dynamique d'articles, produits (boutique), tableau de tarifs, icônes dans les cartes.
- **Règles** (`mapper.RULES`) : un genre de section du plan → composants. Pour chaque section, le mapper enregistre : besoin, composants, état (`ok` / `partial` = alternative / `skipped`), justification, limites, fonctionnalité manquante, texte d'exemple.
- **Garde** : si une règle citait un composant absent du registre, la section est neutralisée et le composant signalé manquant.
- **Secours** : aucun composant exact → combinaison native (ex. galerie = sections « Image » successives ; tarifs = cartes) → sinon section ignorée avec motif. Jamais d'identifiant ou de propriété inventés, jamais de bloc vide, jamais d'image sans rapport (une image n'est posée que si le plan la fournit).
