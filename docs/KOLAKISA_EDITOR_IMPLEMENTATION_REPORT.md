# Rapport d'implémentation — 10 octobre 2026 (branche `elementor-reference`)

## Ajouté ou corrigé (tout est testé ; voir `KOLAKISA_EDITOR_TEST_REPORT.md`)
**Images** — service commun `src/marketing/media/variants.js` : 5 largeurs (150 / 320 / 640 / 1024 / 1600 px), « Taille originale » (défaut, rien ne change), « Adaptative » (`srcset`). Versions WebP **fabriquées à la demande** à la première visite puis gardées ; l'original n'est jamais modifié ; aucune migration ; repli vers l'original si `sharp` est absent, si l'image est plus petite ou si la fabrication échoue. Widgets : Image, Galerie, Carrousel, Boîte d'image, Image à points d'intérêt, photo de témoignage, **image de fond** de tout conteneur. Suppression définitive d'une image : ses versions sont retirées.
**Galerie** — disposition grille / mosaïque / justifiée, colonnes 1–6, ratio d'aspect, hauteur des lignes, légende au survol, barre de filtres par étiquette (la visionneuse saute les images filtrées).
**Texte** — contour du texte (épaisseur + couleur), lettrine, colonnes de texte.
**Visionneuse** sur le widget Image (désactivée par un lien).
**Nouveaux widgets** (framework des widgets personnalisés : 3 fichiers chacun + parties stylables) : **Appel à l'action** (`cta`), **Playlist vidéo** (`videoplaylist`), **Bouton flottant** (`floatingbutton`).
**Conteneurs** — séparateur de forme haut / bas (7 formes, couleur, hauteur, retournement, premier plan) ; diaporama en arrière-plan (jusqu'à 8 images, Ken Burns) ; vidéo de fond avec début / fin, image de secours, lecture unique ; dégradé **radial** et position de chaque couleur ; bordures double et gravée ; formes de masque fleur / blob / croquis.
**Mouvement** — 12 animations de survol (16 au total) ; Ken Burns du diaporama.
**Widgets existants complétés** — compteur (séparateur des milliers) ; compte à rebours (minuteur par visiteur, action à la fin : texte / masquer / rediriger, unités masquables) ; liste d'icônes (en ligne, séparateurs) ; partage et réseaux (+ Telegram, Pinterest, Reddit, Threads) ; vidéo (début / fin).
**Page** — magnétisme de défilement (haut / centre / bas, marge, arrêt obligatoire) ; jours et heures d'affichage d'un élément (heure de Paris).
**Interface** — « Coller depuis un autre site ou navigateur » (presse-papiers du système, texte balisé, borné, revalidé par le serveur) ; correction d'un défaut existant : l'angle 0° du dégradé n'était pas enregistrable.

## Ajouté lors de la troisième passe (après lecture de ~180 articles)
**Widgets** : Lien intelligent (`smartlink`), Contenu Facebook (`facebookembed`), Plan du site (`sitemap`). **Conteneur en accordéon** (volets libres). **Fenêtre** : ouverture automatique (chargement, défilement, sortie, inactivité), fréquence (toujours / par visite / une fois), fermeture automatique, verrou, carte du coin et barre du bas non bloquantes. **Style** : sens d'écriture, décalage d'ancre, découpe du fond (dans le texte), bordures ridge / inset / outset, inversion, **filtres d'arrière-plan**, dégradé à couleurs intermédiaires. **Texte** : balise du titre p / div / span. **Galerie** : jusqu'à 12 colonnes. **Widgets complétés** : témoignage (place de la photo), points d'intérêt (survol), code (numéros, lignes surlignées, copier), suivi de lecture circulaire. **Affichage** : groupes de conditions ET / OU.

## Ajouté lors de la quatrième passe
**Écran « Grand écran »** : ajout structurel du moteur de styles (clé `wide`, seuil réglable de 1400 à 3000 px, 1920 par défaut, dans les réglages du site) ; hérite de l'ordinateur et jamais de la tablette (hiérarchie d'écrans explicite dans l'éditeur) ; bouton dans la barre des écrans, cadre à 1920 px, cadre « ordinateur » plafonné juste sous le seuil ; « Masquer sur grand écran » ; compatibilité conservée : « masquer sur ordinateur » masque aussi le grand écran, un élément ne peut pas être masqué sur les trois écrans historiques. **Images** : paliers 768, 1536 et 2048 px ajoutés. **Inventaire** à identifiants stables (109 lignes) généré par script ; rapport final de parité.

## Défauts trouvés par les tests pendant le travail, et corrigés
La légende de galerie au survol bloquait le clic de la visionneuse ; la liste des parties stylables exigeait que le sélecteur désigne un **descendant** de la racine (bouton flottant restructuré) ; un remplacement de CSS avait effacé trois blocs (détecté par les tests, rétabli).

## Fichiers modifiés / ajoutés
Serveur : `src/marketing/media/variants.js`, `media/index.js`, `pages/nodes.js`, `pages/parts.js`, `pages/index.js`, `pages/scrollSnap.js`, `pages/stylePresets.js`, `pages/widgets/{cta,videoplaylist,floatingbutton,carrousels}.js`, `web/siteWeb.js`, `landing/index.js`, `middlewares/locals.js`, `server.js`. Affichage : `views/marketing-public/_node.ejs`, `_social-icon.ejs`, `widgets/{cta,videoplaylist,floatingbutton,slides}.ejs`, `public/css/landing.css`, `public/js/landing.js`. Éditeur : `public/js/page-builder.js`. Quatrième passe : `scripts/build-parity-inventory.py`. Dépendances : `sharp` (**optionnelle**). Troisième passe : `pages/widgets/{smartlink,facebookembed,sitemap}.js` et leurs gabarits. Tests : voir le rapport de tests. Documentation : `docs/elementor-reference/` (30 fichiers) et `docs/KOLAKISA_EDITOR_*.md`.

## Migrations
Aucune migration de base. Les réglages ajoutés sont des propriétés facultatives des pages ; une page existante garde exactement son rendu (filet de sécurité des widgets : seules les 3 entrées des nouveaux widgets et l'ajout de « Ken Burns » au diaporama changent dans la référence).

## Conservé sans modification / exclu / reporté
Voir `KOLAKISA_EDITOR_GAP_ANALYSIS.md` (liste des écarts non faits, avec la raison) et `KOLAKISA_EDITOR_LIMITATIONS.md`.
