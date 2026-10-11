# Écarts identifiés — état final (10 octobre 2026)

Source : `docs/elementor-reference/18-…` (43 lignes) et `19-widget-mapping.md` (correspondance widget par widget).

## Corrigés dans cette mission (testés)
Résolutions d'image (7 widgets + fond d'image + photo de témoignage) · galerie (dispositions, colonnes, ratio, légende au survol, filtres) · contour du texte · lettrine et colonnes de texte · visionneuse sur le widget Image · 3 nouveaux widgets (Appel à l'action, Playlist vidéo, Bouton flottant) · séparateur de forme · 12 animations de survol · 3 formes de masque · compteur (séparateur des milliers) · compte à rebours (minuteur par visiteur, action à la fin, unités) · liste d'icônes (en ligne, séparateurs) · partage et réseaux (Telegram, Pinterest, Reddit, Threads) · vidéo (début / fin) · Ken Burns du diaporama · diaporama et vidéo de fond (début / fin, secours, lecture unique) · dégradé radial et positions · bordures double et gravée · jours et heures d'affichage · magnétisme de défilement · collage depuis un autre site ou navigateur.

## Erreurs de ma première analyse, corrigées
Points de rupture modifiables (existaient), CSS personnalisé par élément (existait), copier-coller entre sites du même navigateur (existait). La première version les donnait pour absents ou exclus : **c'était faux**.

## Non faits (décision documentée)
| Écart | Raison |
|---|---|
| Titre en p / div / span | Titres sémantiques volontaires |
| Appareils supplémentaires (portrait / paysage, grands écrans) | Trois écrans fixes ; coût élevé dans le moteur CSS |
| Conditions d'affichage ET / OU, rôle, auteur / catégorie d'article | Modèle d'audience différent (contacts, abonnés, clients, élèves) |
| Liens intelligents (agenda, Waze, Skype, Viber) | Usage marginal ; WhatsApp / e-mail / SMS couverts par le bouton flottant |
| Facebook (embed, commentaires, flux), PayPal dons / abonnements, Sitemap, icônes personnalisées | Services tiers ou usage marginal |
| SVG, shortcodes | Refusés pour la sécurité |
| Témoignage : position de la photo ; Hotspot : déclencheur ; Code : numéros de ligne ; Suivi circulaire | Usage marginal |
