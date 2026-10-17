# Audit initial de l'éditeur KOLAKISA (palier 0) — 10 octobre 2026

Base : `origin/main` au commit `d6f4f27`. Branche de travail : `elementor-reference`.

## Architecture constatée (code lu)
- Éditeur : JavaScript sans framework, `public/js/page-builder.js` (~7 400 lignes) + modules (`-direct`, `-menu`, `-effects`, `-snap`, `-rules`, `-ai`).
- Canevas : iframe rendue côté serveur (`POST /marketing/pages/:id/rendu`, gabarit `views/marketing-public/_node.ejs`) ; la page publique utilise le **même gabarit** (donc un réglage appliqué au rendu l'est partout).
- Modèle : arbre de nœuds validé par `src/marketing/pages/nodes.js` (fonction `props` par type de widget, jamais de valeur libre). Brouillon `PUT /brouillon` à 1 s, historique 150 pas, versions restaurables.
- Médias : `src/marketing/media/index.js` (table `mk_media`, noms fabriqués, type lu dans la signature du fichier, largeur/hauteur lues dans l'en-tête). Servis par `/uploads/marketing` (statique, mise en cache 30 jours).
- Un second système de « versions réduites » existe **pour le blog** (`/formateur/blog/api/medias`, générées dans le navigateur) : séparé, non touché.

## Constat sur les images (point de départ du palier 2)
| Question de la mission | Réponse constatée |
|---|---|
| Stockage | un seul fichier par image, dossier `UPLOADS_DIR/marketing/<organisation>/` |
| Dimensions enregistrées | oui (`mk_media.width/height`), sauf AVIF (inconnues) |
| Miniatures / variantes | **aucune** pour la médiathèque du Page Builder |
| Formats optimisés | aucun |
| Originaux conservés | oui |
| Bibliothèque de redimensionnement | **aucune** dans les dépendances (pas de `sharp`) |
| Rendu | `<img src=original loading=lazy>` ; pas de `srcset` ; l'image mise en avant, les vignettes de listes et l'avatar de témoignage servent aussi l'original |
| Réglage de résolution dans l'inspecteur | **absent** pour tous les widgets image |
La référence de l'utilisateur (Elementor) : « Résolution de l'image » = tailles générées par WordPress à l'envoi (voir `elementor-reference/05`).

## Autres constats (lus dans le code, non retestés)
- Raccourcis déjà riches : Ctrl+Z / Maj+Z / Y, C, X, V, D, S, G, A, Ctrl+Maj+V (coller le style), Ctrl+K (palette de commandes), Maj+R/G/M (règles, repères, grille, magnétisme).
- Propriétés de style présentes : `objectFit`, `aspectRatio`, `filter`, `textShadow`, `mixBlendMode`, `transform`, masque, arrière-plans multicouches, grille CSS.
- **Absent** : contour du texte (`text-stroke`), points de rupture personnalisés (3 écrans fixes : 820 / 390 px), « coller depuis un autre site », barre de filtres / surcouche / ratio / disposition justifiée de la galerie.
- Plusieurs autres documents d'audit existent déjà (`KOLAKISA_EDITOR_PROPERTY_AUDIT.md`, `KOLAKISA_UNIVERSAL_PROPERTY_AUDIT.md`, `KOLAKISA_PERFORMANCE_*`, `ELEMENTOR_FEATURE_*` à la racine) : cet audit ne les refait pas.

## État de référence et retour arrière
- Aucun code modifié avant ce constat. Retour arrière : la branche `elementor-reference` n'est pas fusionnée ; `main` reste intact. La seule dépendance ajoutée (`sharp`, optionnelle) n'est requise par aucun chemin de code : son absence ramène à l'affichage de l'original.
- Performance de référence : voir `KOLAKISA_PERFORMANCE_BASELINE.md` (mesures du 10 octobre) et `KOLAKISA_EDITOR_PERFORMANCE_REPORT.md`.
