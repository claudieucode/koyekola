# Inventaire des fonctionnalités responsive

| Fonctionnalité | Statut | Preuve |
|---|---|---|
| Sélecteur d'appareil (ordinateur, grand écran, tablette, mobile) ; largeur réelle du canevas | Opérationnel | `responsive-largeurs` (éditeur ↔ publié) |
| Changement d'appareil sans perte de sélection ni enregistrement parasite | Opérationnel | rapport de performance (0 enregistrement) ; `editeur-stabilite` |
| Valeurs propres à chaque appareil, isolées | Opérationnel | `responsive-isolation` (9 réglages) |
| Héritage mobile ← tablette ← ordinateur ; grand écran ← ordinateur | Opérationnel | `responsive-largeurs` |
| ↺ ne retire que la valeur de l'appareil affiché | Opérationnel | `responsive-isolation` |
| Valeurs conservées après rechargement | Opérationnel | `responsive-isolation` |
| Points de rupture par défaut | Opérationnel | `responsive-largeurs` (19 largeurs) |
| Points de rupture réglés par site (validation, propagation CSS, canevas) | Opérationnel | `responsive-largeurs` ; validation : tests de réglages du site préexistants |
| Visibilité par appareil (« Afficher sur ») | Opérationnel ; « Ordinateur » couvre aussi le grand écran (compatibilité, verrouillé par test) — l'interface montre pourtant 4 cases indépendantes | `responsive-largeurs`, `elementor-parite-5-grand-ecran` |
| Grille 3 → 2 → 1 colonnes automatique | Opérationnel | `responsive-largeurs` |
| Aperçu immédiat sur tablette / mobile (nombres, couleurs, 24 listes) | Opérationnel | `responsive-apercu` |
| Aperçu immédiat des autres réglages (ombres, polices, états, parties de widgets) | Partiel (rendu serveur ≈ 85–270 ms) | mission 3 |
| Canevas = publié à largeur égale | Opérationnel (mission 3, réétabli ici pour 4 appareils × 2 jeux de points de rupture sur la valeur du titre) | mission 3 ; `responsive-largeurs` |
| Éléments masqués par appareil dans le canevas | Visibles en transparence et dans le flux (voulu, mission 3) | documenté |
| Valeurs propres aux **états** (survol…) par appareil | États communs à tous les appareils (pas d'état par appareil) | architecture ; limite |
| Points de rupture supplémentaires (portable, 2ᵉ tablette, personnalisés) | Absent | écarts |
| Inversion de l'ordre des colonnes sur mobile, « Empiler » dédié | Non testé en tant que fonction dédiée (propriété `flexDirection` / `order` par appareil : opérationnelles) | `responsive-isolation` |
| Menus et widgets à comportement mobile propre (menu hamburger…) | Non testé dans cette mission | — |
| Navigateurs autres que Chrome | Non testé | — |
