# 18 — Matrice de comparaison Elementor ↔ KOLAKISA (fonctions transversales)

_Mise à jour du 10 octobre 2026 (deuxième passe, après lecture d'environ 90 articles Elementor). La correspondance widget par widget est dans `19-widget-mapping.md`._
**Erreurs de la première version, corrigées ici** (vérifiées dans le code après coup) : (1) les points de rupture tablette et mobile **sont déjà modifiables** (Réglages du site, `layout.breakpoints`) ; (2) le CSS personnalisé **par élément existe** (déclarations validées, normal et survol) ; (3) le copier-coller passe par le stockage du navigateur, donc **entre pages et sites de KOLAKISA du même navigateur** il fonctionnait déjà.
Statuts : OPÉ = présent et testé de bout en bout · PRÉS = présent, vérifié dans le code seulement · NA = sans objet · ABS = absent (raison donnée) · « ajouté » = ajouté dans cette mission et testé.

| # | Domaine | Fonctionnalité Elementor (source lue) | KOLAKISA | Preuve | Décision |
|---|---|---|---|---|---|
| 1 | Images | Résolution de l'image (image, image box, galerie, carrousels, CTA, témoignage…) | **ajouté** : 5 tailles + original + adaptative ; aussi fond d'image et photo de témoignage | 13 tests serveur + 4 navigateur | fait |
| 2 | Images | Vignettes d'articles / formations, image mise en avant | NA : bibliothèques du blog et du catalogue, autre stockage | code | exclu |
| 3 | Images | Object-fit, ratio, filtres CSS, opacité, survol | PRÉS (`objectFit`, `aspectRatio`, `filter`, `opacity`) | code | conserver |
| 4 | Images | Lien, légende, alt, titre, nouvel onglet, visionneuse | OPÉ ; **ajouté** : visionneuse sur le widget Image seul | tests | fait |
| 5 | Galerie | Grille / mosaïque / justifiée, colonnes, ratio, légende au survol, filtres | **ajouté** (colonnes 1–6 ; Elementor 1–24) | 5 tests navigateur | fait |
| 6 | Texte | Contour du texte | **ajouté** (épaisseur + couleur) | test | fait |
| 7 | Texte | Lettrine, colonnes de texte | **ajouté** | test | fait |
| 8 | Texte | Ombre du texte, mode de fusion, typographie, espacement des mots | PRÉS | code | conserver |
| 9 | Texte | Balise du titre p / div / span | ABS volontaire : titres sémantiques H1–H6 | — | exclu |
| 10 | Widgets | Appel à l'action, Playlist vidéo, Bouton flottant | **ajoutés** | tests | fait |
| 11 | Widgets | Sitemap, SVG, Stripe/PayPal, Sidebar, Shortcode | NA ou ➡️ autre module (voir 19) | — | exclu |
| 12 | Widgets | Compteur : séparateur des milliers | **ajouté** | test | fait |
| 13 | Widgets | Compte à rebours : minuteur par visiteur, action à la fin, unités | **ajouté** | test | fait |
| 14 | Widgets | Liste d'icônes : en ligne, séparateurs | **ajouté** | test | fait |
| 15 | Widgets | Partage / réseaux sociaux : Telegram, Pinterest, Reddit, Threads | **ajouté** | test | fait |
| 16 | Widgets | Vidéo : début / fin | **ajouté** (YouTube, Vimeo, fichier) | test | fait |
| 17 | Widgets | Slides : effet Ken Burns | **ajouté** | test | fait |
| 18 | Widgets | Témoignage : position de la photo ; Hotspot : déclencheur ; Code : numéros de ligne / copier ; Suivi de progression circulaire | ABS (usage marginal) | — | non fait, documenté |
| 19 | Structure | Conteneur flex : direction, justification, alignement, écart, retour à la ligne, débordement, hauteur min vh, balise, lien | OPÉ | tests | conserver |
| 20 | Structure | Grille | PRÉS (non documentée chez Elementor dans les pages lues) | code | — |
| 21 | Structure | Séparateur de forme (haut / bas) | **ajouté** : 7 formes, couleur, hauteur, retournement, premier plan | test | fait |
| 22 | Fond | Vidéo en arrière-plan | PRÉS (`bgVideo`) ; options début / fin / image de secours : ABS | code | partiel |
| 23 | Fond | Diaporama en arrière-plan + Ken Burns | **ajouté** | test | fait |
| 24 | Masques | Formes Fleur, Croquis, Blob (+ cercle, triangle, hexagone) | **ajouté** : fleur, croquis, blob (+ 8 formes existantes) ; masque par image PNG/SVG : PRÉS (`mask.src`) | test | fait |
| 25 | Mouvement | 14 animations de survol | **ajouté** : 12 nouvelles (16 au total) | test | fait |
| 26 | Mouvement | Animations d'entrée (37), défilement, souris (3D, suivi), sticky, contrôle de fenêtre | PRÉS : 63 animations, effets de défilement, souris, sticky, plage | code | conserver |
| 27 | Page | Magnétisme de défilement (Scroll Snap) | **ajouté** (haut / centre / bas, marge, arrêt obligatoire) | test | fait |
| 28 | Avancé | ID, classes, attributs personnalisés, z-index, position, ordre | PRÉS | code | conserver |
| 29 | Avancé | CSS personnalisé par élément (Pro chez Elementor) | PRÉS : déclarations validées (normal + survol), jamais d'`url()` ni `@import` | code | conserver |
| 30 | Avancé | Conditions d'affichage : public, programmation, **jours / heures**, paramètre d'adresse | PRÉS ; **jours et heures ajoutés** (heure de Paris) | test | partiel : pas de groupes ET / OU |
| 31 | Avancé | Conditions : rôle, catégorie / auteur de l'article, date d'inscription | ABS (modèle d'audience différent : contacts, abonnés, clients, élèves) | — | non fait |
| 32 | Responsive | Trois écrans, héritage descendant, points de rupture modifiables | PRÉS (820–1279 et 400–767 px) | code | conserver |
| 33 | Responsive | Appareils supplémentaires (portrait / paysage, grands écrans) | ABS : trois écrans fixes | — | reporté (moteur CSS) |
| 34 | Interface | Raccourcis, menu contextuel, structure, sélection multiple, favoris, palette de commandes | OPÉ / PRÉS | code, tests | conserver |
| 35 | Interface | Coller depuis un autre site ou navigateur | **ajouté** (presse-papiers du système, texte balisé, contenu borné et revalidé) | test | fait |
| 36 | Historique | Historique de session, révisions, enregistrement auto | OPÉ | tests existants | conserver |
| 37 | Styles | Couleurs / polices globales, classes, états, styles enregistrés, composants | PRÉS | commits | conserver |
| 38 | CMS | Étiquettes dynamiques (groupes article, formation, produit, visiteur, page, site, date, adresse), boucles, modèles | PRÉS | code | conserver |
| 39 | IA | Modification par IA, respect du verrou de format | PRÉS, testé | test | conserver |
| 40 | Liens | Liens intelligents : agenda (Google / Outlook / Yahoo), Waze, Skype, Viber | ABS : seuls `tel:`, `mailto:` et les liens du site sont acceptés ; WhatsApp / e-mail / SMS existent dans le bouton flottant (ajouté) | code | non fait, documenté |
| 41 | Fond | Dégradé radial et position de chaque couleur ; bordures double et gravée | **ajouté** | test | fait |
| 42 | Fond | Vidéo de fond : début / fin, image de secours, lecture unique | **ajouté** | test | fait |
| 43 | Éléments | Facebook : Embed, Commentaires, Flux de page ; Sitemap ; PayPal dons / abonnements ; icônes personnalisées | ABS : dépendent de services tiers ou d'un usage marginal | — | non fait, documenté |
