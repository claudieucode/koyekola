# Inventaire de la manipulation visuelle

| Fonction | Statut | Preuve |
|---|---|---|
| Sélection depuis le canevas et les calques (état partagé) | Opérationnel | `edition-visuelle`, `editeur-structure` (préexistant) |
| Clics du canevas sans effet de visiteur (lien, bouton externe, lien dans le texte) | Opérationnel | `edition-visuelle` |
| Sélection de l'enfant sans son parent | Opérationnel | idem |
| Sélection multiple (Maj / Cmd) | Non testée dans cette mission | — |
| Redimensionnement e / s / se : appareil affiché seulement | Opérationnel | `edition-visuelle` |
| Redimensionnement : unité d'origine conservée (`%`, `rem`, `em`, `vw`, `vh`) | Opérationnel (**corrigé**) | idem |
| Redimensionnement : borne min. / max. déclarée respectée | Opérationnel (**corrigé**) | idem |
| Redimensionnement : proportions (Maj), magnétisme (Alt le coupe) | Opérationnel (préexistant) | `editeur-regles-magnetisme` |
| Redimensionnement : valeur `auto` non figée par la poignée « Hauteur » | Opérationnel | `edition-visuelle` |
| Redimensionnement d'un élément en `%` dans un parent sans largeur propre / en Grille | Non testé en détail | — |
| Poignées d'écart et de marge intérieure | Opérationnel (préexistant) | `editeur-manipulation-directe` |
| Glisser-déposer dans les calques : déplacement valide, cycle refusé, 0 perte | Opérationnel | `edition-visuelle` |
| Glisser dans le canevas par la poignée « Déplacer » | Opérationnel (préexistant) ; non re-testé ici | `editeur-canvas-moteur` |
| Dupliquer (imbriqué : identités, classes, références, écrans) | Opérationnel | `edition-visuelle` |
| Supprimer, annuler, rétablir | Opérationnel | idem |
| Menus contextuels, raccourcis autres que Ctrl+D / Suppr / Ctrl+Z / Alt+↑↓ | Non testés dans cette mission | — |
| Fuites d'écouteurs | Aucune constatée (120 sélections) | rapport de performance |
| Écran tactile (poignée 28 px) | Préexistant, non re-testé | `editeur-manipulation-directe` |
