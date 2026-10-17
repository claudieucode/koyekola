# Inventaire des fonctionnalités de styles globaux

| Fonctionnalité | Statut | Preuve |
|---|---|---|
| Couleurs du système (10) + dérivées lisibles (`on-primary`, `on-accent`) | Opérationnel | `styles-globaux-navigateur` |
| Couleurs personnalisées (≤ 30) | Opérationnel ; suppression protégée (pages, composants, **et désormais réglages du site**) | idem |
| Référence ≠ valeur locale (modifier le site ne touche pas la valeur locale) | Opérationnel | idem |
| Couleurs du système sur page **hors site** | Opérationnel (**corrigé**, repli sur la valeur d'origine) | idem |
| Couleur personnalisée sur page hors site | Limité : n'existe que dans un site (pas de repli) | limite |
| Polices du site (titres, texte, boutons, liens) | Opérationnel (pile réellement appliquée mesurée) | idem |
| Échelle typographique (h1–h6, texte, légende, bouton) | Opérationnel (non re-mesuré ici : tests de réglages du site préexistants) | `site-web-reglages-theme` |
| Typographies globales **nommées** réutilisables (style de texte appliqué à un élément) | **Absent** (seules l'échelle du site et les classes) | écarts |
| Espacements, rayons, ombres, bordures, tailles du site | Opérationnel (références `token:space-…`, `token:radius-…`, repli d'origine) | mission 2 |
| Boutons / liens / listes / images / champs : réglages globaux | Opérationnel (tests préexistants) | `site-web-reglages-theme` |
| Classes globales (≤ 40, par écran et état) | Opérationnel | `styles-globaux-navigateur`, `editeur-classes-globales` |
| Modifier une classe → seuls ses porteurs changent | Opérationnel | `styles-globaux-navigateur` |
| Priorité classe < style propre < valeur d'écran | Opérationnel | idem |
| Liste des éléments qui portent une classe / compteur d'usage d'une classe | **Absent** | écarts |
| Suppression d'une classe utilisée | Possible ; l'élément garde un nom de classe sans effet (inoffensif, invisible) | limite |
| Compteur d'usage des couleurs (pages, références) | Opérationnel (pages, composants ; ne compte pas les réglages du site — la suppression, elle, les protège) | `colorUsage` |
| Composants réutilisables (sections) | Opérationnel (hors périmètre de cette mission) | tests préexistants |
| Aperçu immédiat d'un changement de jeton | Pas d'aperçu local : modification dans les réglages du site, rendu serveur | rapport de performance |
| Dupliquer un élément → référence conservée | Opérationnel | `styles-globaux-navigateur` |
| Modèles de site (en-tête, pied de page, article…) | Absent (mission 9) | — |
