# 08 — Responsive et héritage

_Vérifié le 2026-10-10._

## Confirmé — https://elementor.com/help/mobile-editing/ (article lu)
- **Seuils par défaut** : au-dessus de 1024 px = ordinateur ; 767–1024 px = tablette ; sous 767 px = mobile. Trois versions de page par défaut.
- **Aperçu** : icône d'appareil dans la barre du haut ; en mode non-ordinateur, des poignées redimensionnent la vue (gauche, droite, bas).
- **Héritage descendant** : une modification faite sur un écran plus large se répercute sur les plus étroits ; une modification faite sur mobile n'affecte ni l'ordinateur ni la tablette.
- Les réglages par écran portent une **icône d'appareil** (menu pour choisir l'écran). Recommandation officielle : choisir l'écran cible dans la barre du haut avant de modifier.
- **Points de rupture personnalisés** : Réglages du site → Mise en page → Points de rupture ; on peut modifier les valeurs en px et ajouter d'autres appareils (six options mentionnées). Les deux points de rupture par défaut ne peuvent pas être supprimés. **Le statut Pro n'est pas indiqué.**
- **Contrôles responsive (développeurs)** : https://developers.elementor.com/docs/editor-controls/responsive-control.html — `add_responsive_control()` stocke une valeur par appareil ; `devices` limite les appareils ; `tablet_default` / `mobile_default` donnent des valeurs de départ par appareil ; les sélecteurs CSS reçoivent `{{WRAPPER}}`, `{{SIZE}}`, `{{UNIT}}`.
- **Masquage** : Avancé → Responsive (voir 07).

## Non vérifié
Colonnes inversées, ordre des éléments par appareil, valeurs « explicites » vs héritées affichées dans l'interface, suffixes de stockage, comportement exact des fuites entre appareils.

## Point d'attention pour KOLAKISA
L'héritage d'Elementor est **descendant (desktop-first)**. KOLAKISA stocke des styles par écran (`styles.desktop/tablet/mobile`) : voir la matrice de comparaison.
