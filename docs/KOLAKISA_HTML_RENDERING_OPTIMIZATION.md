# HTML et rendu

## Fait
- **Image principale** (`optimize.js`, appliquée dans `landingPublic.js`) : la première `<img>` du `<main>`, hors `<header>/<nav>/<footer>`, hors logos/avatars/icônes et hors largeur déclarée ≤ 120 px, perd `loading="lazy"` et reçoit `fetchpriority="high"`. Aucune autre image n'est modifiée. Idempotent ; sans `<main>` le HTML est renvoyé tel quel. Réglage **par site**, activé par défaut, réversible, journalisé.
- **Dimensions réservées** : le widget Image écrit `width`/`height` d'après l'en-tête du fichier de la médiathèque (déjà lu et mis en cache par `variants.dimensions`), **uniquement** si la taille choisie ne recadre pas (original ou adaptative). Image externe, `{{variable}}` ou recadrée : aucun attribut inventé. Le CSS existant `.kw-image img { height:auto }` garantit l'absence de déformation.
- **Détection** (non corrective) : enveloppes `<div>` nues à enfant `<div>` unique, profondeur > 32, DOM > 1 500 éléments.

## Non fait, volontairement
- **Aplatissement automatique du DOM** : non réalisé. Les wrappers du Page Builder portent des classes de widgets (`kw-*`) dont dépendent styles, éditeur et A/B ; sans mesure montrant un gain, la simplification risquerait de casser des widgets. Le moteur les *signale* seulement.

## Garanties
Accessibilité (alt, structure) et SEO inchangés ; l'éditeur n'est pas touché (le rendu d'aperçu n'applique pas l'optimisation : seule la route publique `/p/*` le fait).
