# Palier 14 — Limites et problèmes restants

## Environnements non testés (et pourquoi)
- **Safari / WebKit** : Safari est installé mais `safaridriver` n'est pas activé (il demande une action administrateur dans les réglages de Safari) ; je ne l'ai pas contournée. **Aucune garantie WebKit.**
- **Edge** : lancé via Playwright, le navigateur se ferme immédiatement au démarrage (`Target page, context or browser has been closed`). Version de Playwright trop ancienne pour cet Edge, ou incompatibilité macOS 12 ; cause non investiguée plus avant. Edge étant Chromium, le risque propre est faible, mais **non démontré**.
- **Appareils physiques** (iOS, Android), clavier virtuel, tactile réel, rotation réelle : **aucun**. Toutes les tailles sont des fenêtres redimensionnées de navigateurs de bureau.
- Pas d'émulation tactile (événements pointer/touch), pas de test d'impression.

## Problèmes constatés et non corrigés
| Sujet | État | Raison |
|---|---|---|
| Éditeur visuel sur écran de téléphone/tablette portrait | Cibles < 24 px (`pb-fav` 22 px, `pb-twist` 18×24, un bouton 34×17) ; barre du haut sur plusieurs lignes à ≤ 1024 px (156 px à 1024×640) | L'éditeur est une interface de bureau ; le brief interdit de le transformer en éditeur mobile complet. Non traité, à indiquer aux utilisateurs |
| Valeurs par défaut des points de rupture écrites deux fois (`nodes.js`, `siteSettings.js`) | Identiques aujourd'hui | Aucun défaut reproduit : pas de centralisation entreprise. Une constante partagée réduirait le risque de dérive |
| ~40 largeurs de `@media` distinctes dans les feuilles de la plateforme (hors réglage par site) | Non uniformisées | Aucun défaut reproduit ; changer des seuils sans cas démontré risquerait de dégrader des rendus validés |
| Administration : liens à 23,6–24 px (arrondis par la sonde) | Mesure limite | Dans la tolérance de la sonde, pas de défaut avéré |
| Bouton « Filtrer » de `/marketing/contacts` (1 px) | Voulu | Bouton de secours masqué quand le filtre est instantané |
| `textpath` (SVG) « dépasse » dans Firefox | Artefact de mesure | Le document ne défile pas ; mesure de `getBoundingClientRect()` sur `<textPath>` |

## Changement visuel assumé
Pastilles du carrousel : espacement des points de 16 à 24 px (zone cliquable de 24 px exigée par WCAG 2.5.8). Le point reste de 10 px.

## Non vérifié
Rendu des polices distantes selon le navigateur, défilement inertiel, comportement des menus du site public au toucher, cohérence pixel-à-pixel aperçu/page publiée au-delà de la taille du titre et des largeurs de cadre (testées : tailles de police aux trois points de rupture, largeurs des cadres, données inchangées). Les 90 widgets créables sont vérifiés pour l'absence de débordement, pas pour leur apparence.
