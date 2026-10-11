# Rapport d'implémentation — 10 octobre 2026 (branche `elementor-reference`)

## Ajouté : résolutions d'image (palier 2)
- **Service commun** `src/marketing/media/variants.js` : 5 largeurs (Miniature 150, Petite 320, Moyenne 640, Grande 1024, Très grande 1600 px), « Taille originale » (défaut, comportement inchangé) et « Adaptative » (`srcset`).
- **Stratégie** : versions WebP **fabriquées à la demande** à la première visite, puis conservées (`UPLOADS_DIR/marketing/<org>/v/<largeur>/`). Rien n'est précalculé : les anciennes images en profitent sans migration, le stockage ne croît que pour les tailles choisies, seules 5 largeurs sont acceptées (pas de fabrication illimitée). L'original n'est jamais modifié.
- **Pas de lien cassé** : si `sharp` est absent, si l'image est plus petite que la taille demandée ou si la fabrication échoue → l'adresse renvoie vers l'original (302). Sans `sharp`, le rendu n'utilise jamais d'adresse de version.
- **Widgets** : Image, Galerie, Carrousel, Boîte d'image, Image à points d'intérêt, photo de témoignage (propriété `size`, enregistrée seulement si différente de l'original ; valeur inconnue ignorée) et **image de fond** de tout conteneur (`backgroundImage.size`, sans option « adaptative »).
- **Inspecteur** : champ « Résolution de l'image » avec les seules tailles plus petites que l'image (la plus petite pour un lot), dimensions de l'original affichées, aide contextuelle ; désactivé pour une image externe ou dynamique.
- **Suppression définitive** d'une image : ses versions sont retirées.

## Ajouté : galerie, contour du texte, visionneuse
- **Galerie** : disposition (grille, mosaïque, **justifiée**), colonnes 1–6, ratio d'aspect (grille), hauteur des lignes (justifiée), **légende au survol** (visible en permanence sur écran tactile, sans transition si « réduire les animations »), **barre de filtres** par étiquette d'image (« Tous » + une touche par étiquette, `aria-pressed`, la visionneuse saute les images masquées). Classes CSS fixes, aucune valeur libre dans la page ; valeurs par défaut non enregistrées ; mosaïque et justifiée s'excluent.
- **Contour du texte** : deux propriétés de style (`textStrokeWidth`, `textStrokeColor`) dans le groupe Typographie, donc disponibles pour tous les éléments à typographie, enregistrables dans les styles.
- **Visionneuse du widget Image** : case « Agrandir au clic » (désactivée si l'image a un lien) ; l'image d'origine s'ouvre même si une version réduite est affichée.
- **Défaut trouvé par un test et corrigé** : la légende au survol recouvrait le bas de l'image et bloquait le clic de la visionneuse (`pointer-events: none`).

## Fichiers modifiés / ajoutés
`src/marketing/media/variants.js` (nouveau), `src/marketing/media/index.js`, `src/marketing/pages/nodes.js`, `src/marketing/web/siteWeb.js` (route `/site-web/medias/resolutions.json`), `src/middlewares/locals.js`, `server.js` (montage avant le dossier statique), `views/marketing-public/_node.ejs`, `public/js/page-builder.js`, `public/js/landing.js`, `public/css/landing.css`, `src/marketing/pages/stylePresets.js`, `package.json` / `package-lock.json` (`sharp` en **optionalDependencies**), tests `images-resolutions*.test.js`, `galerie-options-navigateur.test.js` (et deux cas ajoutés à `editeur-canvas-proprietes-restantes-navigateur.test.js`), documentation `docs/elementor-reference/` (18 fichiers) et `docs/KOLAKISA_EDITOR_*.md`.

## Migrations
Aucune migration de base ; aucune donnée existante modifiée.

## Conservé sans modification
Tout le reste de l'éditeur (la mission demandait de conserver l'existant).
## Volontairement exclu ou reporté
CSS personnalisé par widget (sécurité) ; balise div/span/p pour les titres (sémantique) ; tailles carrées recadrées (voir limitations) ; points de rupture personnalisés et « coller depuis un autre site » (reportés, décisions de produit). Détail : `KOLAKISA_EDITOR_GAP_ANALYSIS.md`, `KOLAKISA_EDITOR_LIMITATIONS.md`.
