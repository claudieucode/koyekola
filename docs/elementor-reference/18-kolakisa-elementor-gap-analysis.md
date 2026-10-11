# 18 — Matrice de comparaison Elementor ↔ KOLAKISA (fonctions transversales)

_Mise à jour du 10 octobre 2026 (quatrième passe : environ 180 articles Elementor lus ; écran « Grand écran » ajouté). La correspondance widget par widget est dans `19-widget-mapping.md`._
**Erreurs de la première version, corrigées ici** (vérifiées dans le code après coup) : (1) les points de rupture tablette et mobile **sont déjà modifiables** (Réglages du site, `layout.breakpoints`) ; (2) le CSS personnalisé **par élément existe** (déclarations validées, normal et survol) ; (3) le copier-coller passe par le stockage du navigateur, donc **entre pages et sites de KOLAKISA du même navigateur** il fonctionnait déjà.
Statuts : OPÉ = présent et testé de bout en bout · PRÉS = présent, vérifié dans le code seulement · NA = sans objet · ABS = absent (raison donnée) · « ajouté » = ajouté dans cette mission et testé.

| # | Domaine | Fonctionnalité Elementor (source lue) | KOLAKISA | Preuve | Décision |
|---|---|---|---|---|---|
| 1 | Images | Résolution de l'image (image, image box, galerie, carrousels, CTA, témoignage, fond) | **ajouté** : 5 tailles + original + adaptative | 13 tests serveur + 4 navigateur | fait |
| 2 | Images | Vignettes d'articles / formations, image mise en avant | NA : bibliothèques du blog et du catalogue, autre stockage | code | exclu |
| 3 | Images | Object-fit, ratio, filtres CSS, opacité, survol | PRÉS (`objectFit`, `aspectRatio`, `filter`, `opacity`) | code | conserver |
| 4 | Images | Lien, légende, alt, titre, nouvel onglet, visionneuse | OPÉ ; **ajouté** : visionneuse sur le widget Image seul | tests | fait |
| 5 | Galerie | Grille / mosaïque / justifiée, colonnes (jusqu'à 12), ratio, légende au survol, filtres | **ajouté** | 6 tests navigateur | fait |
| 6 | Texte | Contour du texte ; lettrine ; colonnes de texte ; sens d'écriture | **ajouté** | tests | fait |
| 7 | Texte | Ombre du texte, mode de fusion, typographie, espacement des mots | PRÉS | code | conserver |
| 8 | Texte | Balise du titre p / div / span | **ajouté** (titre H1–H6 par défaut) | test + inspecteur | fait |
| 9 | Widgets | Appel à l'action, Playlist vidéo, Bouton flottant | **ajoutés** | tests | fait |
| 10 | Widgets | Lien intelligent (e-mail, appel, SMS, WhatsApp, Messenger, Skype, Viber, Waze, agenda Google / Outlook / Yahoo) | **ajouté** (widget « Lien intelligent ») | test (11 adresses vérifiées) | fait |
| 11 | Widgets | Contenu Facebook (publication, vidéo, fil de page) | **ajouté** ; Commentaires : ABS (exige un identifiant d'application Facebook et un script externe) | test | partiel, documenté |
| 12 | Widgets | Plan du site (Sitemap) | **ajouté** (même source que `sitemap.xml`) | test | fait |
| 13 | Widgets | Compteur : séparateur des milliers ; compte à rebours : minuteur par visiteur, action à la fin, unités | **ajouté** | tests | fait |
| 14 | Widgets | Liste d'icônes en ligne + séparateurs ; partage + réseaux (Telegram, Pinterest, Reddit, Threads) ; vidéo début / fin ; Ken Burns du diaporama | **ajouté** | tests | fait |
| 15 | Widgets | Témoignage : place de la photo ; Hotspot : infobulle au survol ; Code : numéros, lignes surlignées, copier ; Suivi de lecture circulaire | **ajouté** | test | fait |
| 16 | Widgets | Onglets avec icônes | PRÉS (icône par onglet) | code | conserver |
| 17 | Widgets | Sidebar, Shortcode, SVG, Stripe / PayPal (dons, abonnements), icônes personnalisées | NA / ➡️ : notion WordPress, sécurité (SVG, shortcodes), module Commerce (paiements) | — | exclu, raison documentée |
| 18 | Structure | Conteneur flex : direction, justification, alignement, écart, retour à la ligne, débordement, hauteur min vh, balise, lien | OPÉ | tests | conserver |
| 19 | Structure | Conteneur en accordéon (volets contenant n'importe quel élément) ; onglets ; carrousel | **ajouté** (accordéon) ; onglets et carrousel PRÉS | test + inspecteur | fait |
| 20 | Structure | Séparateur de forme (haut / bas) | **ajouté** : 7 formes, couleur, hauteur, retournement, premier plan | test | fait |
| 21 | Fond | Vidéo en arrière-plan : début / fin, image de secours, lecture unique | **ajouté** | test | fait |
| 22 | Fond | Diaporama en arrière-plan + Ken Burns | **ajouté** | test | fait |
| 23 | Fond | Dégradé radial, positions et **couleurs intermédiaires** ; découpe du fond (texte) ; bordures double, gravée, ridge, inset, outset | **ajouté** | tests | fait |
| 24 | Effets | Filtres (+ inversion) et **filtres d'arrière-plan** (verre dépoli) | **ajouté** | test | fait |
| 25 | Masques | Formes Fleur, Croquis, Blob (+ 8 formes existantes) ; masque par image | **ajouté** (formes) ; image PRÉS | test | fait |
| 26 | Mouvement | 14 animations de survol | **ajouté** : 12 nouvelles (16 au total) | test | fait |
| 27 | Mouvement | Animations d'entrée (37), défilement, souris (3D, suivi), sticky, contrôle de fenêtre | PRÉS : 63 animations, défilement, souris, sticky, plage | code | conserver |
| 28 | Position | Décalage d'ancre (en-tête collant) ; relative / absolue / fixe / sticky ; z-index | **ajouté** (décalage d'ancre) ; reste PRÉS | test | fait |
| 29 | Page | Magnétisme de défilement (Scroll Snap) | **ajouté** | test | fait |
| 30 | Popups | Ouverture automatique (chargement, défilement, sortie, inactivité), fréquence, fermeture automatique, verrou, carte du coin, barre du bas | **ajouté** (widget Fenêtre) | test | fait |
| 31 | Popups | Clics comptés, pages vues, source de trafic, règles de rôle | ABS : rôle / public couverts par les conditions d'affichage de l'élément ; le reste est marginal | — | non fait, documenté |
| 32 | Avancé | ID, classes, attributs personnalisés, z-index, position, ordre, taille | PRÉS | code | conserver |
| 33 | Avancé | CSS personnalisé par élément (Pro chez Elementor) | PRÉS : déclarations validées (normal + survol), jamais d'`url()` ni `@import` | code | conserver |
| 34 | Avancé | Conditions d'affichage : public, programmation, jours / heures, paramètre d'adresse, **groupes ET / OU** | **ajouté** (jours / heures, ET / OU) ; public et rôles PRÉS | tests | fait |
| 35 | Avancé | Conditions : catégorie / auteur de l'article, date d'inscription | ABS (propres aux modèles d'article ; modèle d'audience différent) | — | non fait, documenté |
| 36 | Responsive | Trois écrans, héritage descendant, points de rupture modifiables | PRÉS (820–1279 et 400–767 px) | code | conserver |
| 37 | Responsive | Appareils supplémentaires : **Grand écran** (seuil réglable, hérite de l'ordinateur) ; portable, tablette / mobile paysage | **ajouté** (grand écran) ; les autres : ABS (même mécanisme, non demandés en priorité) | test navigateur (7) + normalisation | fait / partiel, documenté |
| 38 | Interface | Raccourcis, menu contextuel, structure, sélection multiple, favoris, palette de commandes | OPÉ / PRÉS | code, tests | conserver |
| 39 | Interface | Coller depuis un autre site ou navigateur | **ajouté** | test | fait |
| 40 | Interface | Notes (commentaires collaboratifs sur un élément) | ABS : pas de système de commentaires dans l'éditeur | — | non fait |
| 41 | Historique | Historique de session, révisions, enregistrement auto | OPÉ | tests existants | conserver |
| 42 | Styles | Couleurs / polices globales, classes, états, styles enregistrés, composants | PRÉS | commits | conserver |
| 43 | Styles | Export / import des classes et variables | ABS (l'export / import existe pour les pages) | — | non fait |
| 44 | CMS | Étiquettes dynamiques, boucles (pagination, « voir plus »), modèles | PRÉS | code | conserver |
| 45 | CMS | Boucle : modèle alterné à une position donnée | ABS | — | non fait |
| 46 | IA | Modification par IA, respect du verrou de format | PRÉS, testé | test | conserver |
