# Matrice de couverture du catalogue — 9 types × 100 modèles

Générée depuis le code (`src/themeBuilder/catalog`) ; chaque cellule est un modèle valide (grammaire du Page Builder), distinct, utilisable (test `theme-builder-catalogue`).

| Type | Mises en page | Identités | Modèles |
|---|---:|---:|---:|
| En-tête (`header`) | 100 compositions (10 familles × 10) | 5 (une par modèle, 20 chacune) | 100 |
| Pied de page (`footer`) | 20 | 5 | 100 |
| Page individuelle (`single_page`) | 20 | 5 | 100 |
| Article individuel (`single_post`) | 20 | 5 | 100 |
| Archives (`archive`) | 20 | 5 | 100 |
| Résultats de recherche (`search_results`) | 20 | 5 | 100 |
| Page 404 (`not_found`) | 20 | 5 | 100 |
| Produit individuel (`single_product`) | 20 | 5 | 100 |
| Archives produits (`product_archive`) | 20 | 5 | 100 |
| **Total** | | | **900** |

## En-tête

Catalogue **plat** de 100 compositions distinctes (refonte de novembre 2026) : liste complète dans [`kolakisa-header-library-modeles.md`](kolakisa-header-library-modeles.md), architecture dans [`kolakisa-header-library.md`](kolakisa-header-library.md). Clés `<clé-du-modèle>.<identité>` (ex. `classique-logo-menu-bouton.clair`).

## Pied de page

| Mise en page | Description | Étiquettes |
|---|---|---|
| Une ligne (`une-ligne`) | Copyright et navigation sur une seule ligne. | minimaliste, sobre, copyright |
| Copyright seul (`copyright-seul`) | Uniquement la ligne de copyright, centrée. | minimaliste, copyright, centré |
| Trois colonnes (`trois-colonnes`) | Marque, navigation et appel à nous contacter. | colonnes, classique, contact |
| Quatre colonnes (`quatre-colonnes`) | Marque, navigation, rubriques du site et catégories. | colonnes, complet, catégories |
| Cinq colonnes (`cinq-colonnes`) | Marque, deux navigations, articles récents et réseaux. | colonnes, grand site, réseaux |
| Logo et description (`logo-description`) | Logo et présentation à gauche, navigation à droite, filet puis copyright. | marque, présentation, navigation |
| Newsletter (`newsletter`) | Bloc d'abonnement mis en avant dans une carte, navigation dessous. | newsletter, abonnement, conversion |
| Réseaux sociaux (`reseaux`) | Invitation à suivre, grandes icônes de réseaux centrées. | réseaux, social, centré |
| Navigation secondaire (`navigation-secondaire`) | Navigation principale en haut, liens utiles et copyright en bas. | navigation, liens utiles, légal |
| Boutique (`boutique`) | Liens, compte du client, mini-panier et accès à la boutique. | boutique, panier, compte |
| Blog (`blog`) | Catégories, articles récents et recherche. | blog, catégories, articles récents |
| Site professionnel (`pro`) | Marque, navigation et prise de contact, sobre. | professionnel, contact, rendez-vous |
| Plateforme de formation (`formation`) | Formations récentes du catalogue, navigation et compte élève. | formation, catalogue, formations |
| Grande zone de marque (`marque-geante`) | Nom du site en très grand, navigation et copyright dessous. | marque, impact, grand |
| Deux rangées (`deux-rangees`) | Rangée marque, navigation et réseaux, rangée de copyright sur fond distinct. | complet, rangées, réseaux |
| Appel à l'action (`appel-action`) | Bandeau d'appel à l'action de couleur au-dessus d'un pied de page compact. | conversion, appel à l'action, bouton |
| Éditorial (`editorial`) | Titre du site centré entre deux filets, rubriques en ligne, date du jour. | éditorial, journal, filets |
| Centré (`centre`) | Tout est empilé et centré : logo, navigation, réseaux, copyright. | centré, élégant, réseaux |
| Colonnes asymétriques (`asymetrique`) | Grande colonne de marque et d'abonnement, deux fines colonnes de liens. | asymétrique, newsletter, navigation |
| Accordéons mobile (`accordeons`) | Rubriques qui se déplient (idéal sur téléphone), navigation et copyright. | mobile, accordéon, compact |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `une-ligne.clair`).

## Page individuelle

| Mise en page | Description | Étiquettes |
|---|---|---|
| Classique (`classique`) | Titre puis contenu dans une colonne centrée. | classique, simple, texte |
| Colonne étroite (`etroit`) | Colonne de lecture étroite, titre centré : idéal pour mentions légales et textes longs. | étroit, lecture, mentions |
| Bandeau titre coloré (`bandeau`) | Bandeau de couleur pour le titre, contenu dessous. | bandeau, couleur, titre |
| Héros d'ouverture (`heros`) | Grand titre centré avec phrase d'accroche et bouton, puis contenu. | héros, présentation, appel à l'action |
| À propos (`a-propos`) | Titre et texte à gauche, emplacement de portrait à droite via l'image mise en avant. | à propos, présentation, équipe |
| Services en colonnes (`services`) | Texte puis trois colonnes de présentation à compléter. | services, colonnes, offre |
| Liste d'atouts (`avantages`) | Texte et liste d'atouts à compléter en deux colonnes. | atouts, avantages, liste |
| Contact (`contact`) | Contenu à gauche, carte de coordonnées à compléter à droite. | contact, coordonnées, rendez-vous |
| Entreprise (`entreprise`) | Présentation de l'entreprise avec liens vers les réseaux. | entreprise, réseaux, professionnel |
| Page d'atterrissage (`landing`) | Titre, contenu, puis grand appel à l'action pleine largeur. | landing, conversion, appel à l'action |
| Deux colonnes de texte (`deux-colonnes`) | Contenu réparti en deux colonnes de journal. | colonnes, journal, texte long |
| Barre latérale de liens (`barre-laterale`) | Menu vertical à gauche, contenu à droite. | navigation, barre latérale, sous-pages |
| Questions fréquentes (`faq`) | Contenu puis accordéon de questions à compléter. | faq, aide, accordéon |
| Sommaire en tête (`sommaire`) | Table des matières puis contenu : pour les guides et pages longues. | sommaire, document, guide |
| Avec fil d'Ariane (`fil-ariane`) | Fil d'Ariane au-dessus du titre. | navigation, référencement, sobre |
| Contenu en carte (`carte`) | Contenu posé dans une carte centrée. | carte, encadré, relief |
| Visuel en ouverture (`image-large`) | Image mise en avant pleine largeur, puis titre et contenu. | image, visuel, présentation |
| Minimal (`minimal`) | Titre et contenu sans aucun ornement. | minimaliste, sobre, texte |
| Équipe et auteurs (`equipe`) | Contenu puis liste dynamique des auteurs du site. | équipe, auteurs, présentation |
| Page et actualités (`actualites`) | Contenu de la page suivi des derniers articles du blog. | actualités, blog, accueil |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `classique.clair`).

## Article individuel

| Mise en page | Description | Étiquettes |
|---|---|---|
| Classique (`classique`) | Titre, informations, image, texte, puis auteur et commentaires. | classique, lecture, blog |
| Colonne étroite (`etroit`) | Colonne de lecture étroite, titre centré, sans image. | centré, lecture, minimaliste |
| Héros plein écran (`heros-plein`) | Grand visuel d'ouverture avec le titre posé dessus, texte en dessous. | héros, image, immersif |
| Colonne latérale (`lateral`) | Article à gauche, colonne de widgets à droite. | barre latérale, blog, classique |
| Sommaire à gauche (`lateral-gauche`) | Sommaire collant à gauche, texte à droite. | sommaire, documentation, long format |
| Magazine (`magazine`) | Image à la une pleine largeur, titre en bandeau, articles liés en cartes. | magazine, image, articles liés |
| Éditorial à lettrine (`editorial`) | En-tête de revue centré, filet, texte à lettrine. | éditorial, lettrine, élégant |
| Bandeau titre coloré (`bandeau-titre`) | Bandeau de couleur pour le titre, texte clair en dessous. | bandeau, couleur, titre |
| Barre de lecture (`lecture-suivie`) | Barre de progression en haut, sommaire en tête, texte seul. | progression, long format, lecture |
| Image latérale (`image-laterale`) | En-tête en deux colonnes : titre à gauche, image à droite. | image, deux colonnes, en-tête |
| Minimal (`minimal`) | Le titre et le texte, rien d'autre. | minimaliste, sobre, texte |
| Article en carte (`carte`) | Article posé dans une grande carte sur un fond de page. | carte, encadré, relief |
| Auteur en tête (`auteur-en-tete`) | Boîte auteur juste sous le titre, avant le texte. | auteur, signature, personnel |
| Partage sur le côté (`partage-flottant`) | Boutons de partage en colonne à gauche du texte. | partage, social, réseaux |
| Fil d'Ariane et catégories (`fil-ariane`) | Fil d'Ariane, catégorie en pastilles, texte, articles de la même catégorie. | navigation, catégories, référencement |
| Résumé en exergue (`resume`) | Résumé de l'article mis en valeur avant le texte. | résumé, accroche, citation |
| Lire la suite (`suite`) | Texte puis navigation précédent/suivant et trois articles liés. | navigation, articles liés, fin d'article |
| Appel à poursuivre (`abonnement`) | Bloc d'invitation à découvrir le blog après le texte. | appel à l'action, abonnement, fin d'article |
| Grand titre centré (`grand-titre`) | Très grand titre centré, image large, texte étroit. | titre, centré, impact |
| Discussion (`discussion`) | Texte puis commentaires mis en avant et auteurs à suivre. | commentaires, communauté, échange |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `classique.clair`).

## Archives

| Mise en page | Description | Étiquettes |
|---|---|---|
| Grille 3 colonnes (`grille-3`) | Titre d'archive puis grille de 3 cartes avec image. | grille, cartes, image |
| Grille 2 colonnes (`grille-2`) | Deux grandes cartes par ligne, image haute. | grille, grandes cartes, image |
| Grille 4 colonnes (`grille-4`) | Quatre petites cartes par ligne, sans extrait. | grille, dense, image |
| Liste image à gauche (`liste`) | Un article par ligne : image à gauche, texte à droite. | liste, horizontal, image |
| Vedette puis grille (`vedette`) | Le dernier article en grand, les suivants en grille. | vedette, grille, image |
| Magazine asymétrique (`magazine`) | Grande une à gauche, trois brèves à droite, puis la suite. | magazine, asymétrique, éditorial |
| Cartes sans image (`sans-image`) | Cartes de texte uniquement : titre, extrait, auteur. | texte, sobre, cartes |
| Liste compacte (`compacte`) | Une ligne par article : date, titre, auteur. | compact, titres, date |
| Colonne latérale à droite (`lateral-droite`) | Articles à gauche ; catégories et articles populaires à droite. | colonne latérale, catégories, populaires |
| Colonne latérale à gauche (`lateral-gauche`) | Rubriques à gauche, liste d'articles à droite. | colonne latérale, rubriques, navigation |
| Nuage d'étiquettes (`etiquettes`) | Étiquettes en ligne au-dessus de la liste. | étiquettes, tags, colonne latérale |
| Carrousel puis liste (`carrousel`) | Carrousel horizontal des derniers articles, puis la liste paginée. | carrousel, slider, à la une |
| Charger plus (`charger-plus`) | Grille de cartes et bouton « charger plus » à la place des numéros. | charger plus, pagination, grille |
| Éditorial centré (`editorial`) | En-tête centré, grands titres, une colonne étroite. | éditorial, centré, typographique |
| Mosaïque (`mosaique`) | Deux grandes cartes puis quatre petites. | mosaïque, irrégulier, image |
| Chronologie (`chronologie`) | Fil vertical : la date à gauche, l'article à droite sur un trait. | timeline, date, chronologique |
| Archive d'auteur (`auteur`) | Fiche de l'auteur (photo, biographie) puis ses articles. | auteur, profil, biographie |
| Bandeau d'en-tête (`bandeau`) | Bandeau coloré avec titre, recherche et catégories, puis la grille. | bandeau, recherche, filtres |
| Cartes à filet (`filet`) | Deux colonnes de textes séparés par un filet d'accent, sans image. | texte, filet, deux colonnes |
| Filtres et cartes horizontales (`filtres-haut`) | Barre de catégories sous le titre, cartes image-texte sur deux colonnes. | filtres, catégories, horizontal |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `grille-3.clair`).

## Résultats de recherche

| Mise en page | Description | Étiquettes |
|---|---|---|
| Champ en vedette (`vedette`) | Grand champ de recherche centré sous le titre, résultats en liste. | champ, centré, vedette |
| Liste avec extraits (`extraits`) | Un résultat par ligne : titre, extrait, auteur. | liste, extraits, sobre |
| Grille 3 colonnes (`grille-3`) | Résultats en cartes à image sur trois colonnes. | grille, cartes, image |
| Grille 2 colonnes (`grille-2`) | Deux grandes cartes par ligne. | grille, grandes cartes, image |
| Filtres de catégories (`filtres`) | Barre de catégories entre le champ et les résultats. | filtres, catégories, navigation |
| Colonne latérale à droite (`lateral-droite`) | Résultats à gauche ; catégories et articles populaires à droite. | colonne latérale, catégories, populaires |
| Colonne latérale à gauche (`lateral-gauche`) | Titre, champ et filtres à gauche ; résultats à droite. | colonne latérale, recherche, filtres |
| Suggestions populaires (`populaires`) | Sous les résultats, les articles les plus lus pour continuer la lecture. | suggestions, populaires, sans résultat |
| Sans résultat soigné (`sans-resultat`) | Message d'aide personnalisé, nouveau champ, catégories et lectures conseillées. | sans résultat, aide, suggestions |
| Compact (`compact`) | Une ligne par résultat : date et titre. | compact, titres, date |
| Éditorial (`editorial`) | Titre centré sous filet, résultats en grandes lignes de texte. | éditorial, centré, typographique |
| Bandeau de recherche (`bandeau`) | Bandeau coloré contenant le titre et le champ ; résultats en grille dessous. | bandeau, champ, fond |
| Cartes sans image (`sans-image`) | Cartes de texte, deux colonnes. | texte, cartes, sobre |
| Chronologie (`chronologie`) | Date à gauche, résultat à droite sur un trait. | timeline, date, chronologique |
| Charger plus (`charger-plus`) | Grille de résultats avec bouton « charger plus ». | charger plus, pagination, grille |
| Titre et champ côte à côte (`une-rangee`) | Titre et champ sur une rangée, quatre petites cartes. | compact, quatre colonnes, dense |
| Lectures conseillées défilantes (`suggestions-defilantes`) | Carrousel d'articles récents au-dessus des résultats. | carrousel, suggestions, slider |
| Étiquettes proposées (`etiquettes`) | Étiquettes en ligne pour rebondir, puis la liste. | étiquettes, tags, navigation |
| Premier résultat en grand (`magazine`) | Meilleur résultat en grand, les suivants en liste. | magazine, vedette, asymétrique |
| Panneau de recherche (`panneau`) | Panneau à gauche (champ, filtres, populaires), liste à droite. | panneau, filtres, deux colonnes |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `vedette.clair`).

## Page 404

| Mise en page | Description | Étiquettes |
|---|---|---|
| Centrée minimale (`minimale`) | Titre, courte explication et retour à l'accueil. | minimaliste, centré, accueil |
| Deux colonnes (`deux-colonnes`) | Message à gauche, recherche et accueil à droite. | colonnes, recherche, accueil |
| Grand 404 (`grand-404`) | Immense « 404 » typographique puis message et accueil. | typographique, 404, impact |
| Cartes de liens (`cartes-liens`) | Trois cartes : accueil, catalogue, contact. | cartes, navigation, catalogue |
| Recherche en vedette (`recherche-vedette`) | Grand champ de recherche mis en avant. | recherche, blog, centré |
| Articles suggérés (`articles-suggeres`) | Message court puis trois articles récents. | articles, blog, suggestions |
| Ton léger (`humour`) | Message décalé mais sobre, retour à l'accueil. | humour, sobre, centré |
| Éditorial (`editorial`) | Mise en page de journal : filets, rubrique, titre en grand. | éditorial, journal, filets |
| Carte centrale (`carte-centrale`) | Un message dans une carte posée au centre. | carte, encadré, centré |
| Catalogue de formations (`catalogue`) | Message puis formations récentes du catalogue. | formation, catalogue, formations |
| Boutique (`boutique`) | Message, accès à la boutique et au compte client. | boutique, achats, panier |
| Blog : recherche et articles (`blog-complet`) | Recherche puis liste d'articles populaires. | blog, recherche, articles |
| Liste d'actions (`liste-actions`) | Que faire maintenant : liste de trois chemins possibles. | actions, liste, navigation |
| Catégories du blog (`categories`) | Message puis catégories du blog en étiquettes. | catégories, blog, étiquettes |
| Moitié message, moitié suggestions (`moitie`) | Message et recherche à gauche, articles récents à droite. | colonnes, articles, recherche |
| Bandeau de couleur (`bandeau`) | Message sur un grand bandeau de couleur, suggestions dessous. | couleur, impact, bandeau |
| Quatre chemins (`quatre-chemins`) | Quatre cartes courtes : accueil, blog, catalogue, contact. | navigation, grille, cartes |
| Signaler le problème (`signalement`) | Explique quoi faire si le lien devrait fonctionner, avec contact. | contact, aide, signalement |
| Étapes de retour (`numero-etapes`) | Trois étapes numérotées pour retrouver son chemin. | étapes, guide, recherche |
| Page complète (`complet`) | Grand 404, recherche, articles et formations réunis. | complet, articles, formations |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `minimale.clair`).

## Produit individuel

| Mise en page | Description | Étiquettes |
|---|---|---|
| Image à gauche (`image-gauche`) | Grande image à gauche, titre, prix et achat à droite, description dessous. | classique, image, achat |
| Image à droite (`image-droite`) | Informations et achat à gauche, image à droite. | classique, image, achat |
| Colonne d'achat collante (`achat-collant`) | L'achat reste visible pendant la lecture de la description. | collant, sticky, achat |
| Onglets (`onglets`) | Fiche haute, puis onglets description et livraison. | onglets, description, informations |
| Accordéon (`accordeon`) | Informations repliables sous l'achat. | accordéon, informations, compact |
| Colonne centrale (`galerie-centree`) | Image, titre, prix et achat centrés sur une seule colonne. | centré, galerie, épuré |
| Image pleine largeur (`pleine-largeur`) | Visuel très large en ouverture, puis achat et description en deux colonnes. | pleine largeur, visuel, immersif |
| Minimal (`minimal`) | Le strict nécessaire : titre, prix, achat, petite image. | minimaliste, sobre, rapide |
| Éditorial (`editorial`) | Catégorie, grand titre centré, image large, texte en colonne étroite. | éditorial, magazine, lecture |
| Carte d'achat (`carte-achat`) | Image à gauche, achat dans une carte encadrée à droite. | carte, encadré, achat |
| Produits associés (`avec-associes`) | Fiche classique suivie des produits mis en avant. | associés, vente croisée, vedette |
| Promotions en bas (`avec-promos`) | Fiche suivie des produits en promotion. | promotions, vente croisée, grille |
| Réassurance (`reassurance`) | Fiche suivie d'une bande de réassurance en ligne. | réassurance, confiance, liste |
| Bandeau de titre (`bandeau-titre`) | Bandeau en haut avec fil d'Ariane, titre et prix ; image et achat dessous. | bandeau, en-tête, prix |
| Trois colonnes (`trois-colonnes`) | Description, image et achat côte à côte. | trois colonnes, dense, description |
| Fiche technique (`fiche-technique`) | Fiche classique avec bloc référence, disponibilité et catégorie. | technique, détails, informations |
| Image collante (`image-collante`) | L'image reste en place, le texte défile à droite. | collant, sticky, image |
| Barre d'achat collée (`barre-achat`) | Fiche complète et barre d'achat qui reste en bas de l'écran. | collant, mobile, achat |
| Vitrine (`vitrine`) | Bandeau héros image + achat, puis description et produits de la boutique. | vitrine, héros, associés |
| Fiche compacte (`liste-compacte`) | Petite image à côté des infos, accordéon et promotions en deux colonnes. | compact, liste, promotions |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `image-gauche.clair`).

## Archives produits

| Mise en page | Description | Étiquettes |
|---|---|---|
| Filtres à gauche (`filtres-gauche`) | Colonne de filtres à gauche, grille de produits à droite. | filtres, latéral, classique |
| Filtres à droite (`filtres-droite`) | Grille à gauche, filtres dans une colonne à droite. | filtres, latéral |
| Filtres en haut (`filtres-haut`) | Titre, filtres sur une carte, puis grille à quatre colonnes. | filtres, barre, large |
| Recherche en vedette (`recherche-vedette`) | Grand champ de recherche de produits sous le titre. | recherche, vedette |
| Grande vignette (2 colonnes) (`grille-2`) | Deux colonnes de grandes fiches produit. | grande grille, visuel, 2 colonnes |
| Grille à 4 colonnes (`grille-4`) | Catalogue à quatre colonnes. | grille, 4 colonnes, catalogue |
| Grille dense (5 colonnes) (`grille-5`) | Cinq colonnes pour un grand catalogue. | dense, 5 colonnes, grand catalogue |
| Promotions en tête (`promos-dessus`) | Produits en promotion au-dessus du catalogue. | promotions, mise en avant |
| Produits vedettes en tête (`vedettes-dessus`) | Produits mis en avant au-dessus de la liste. | vedette, mise en avant |
| Bandeau avec mini-panier (`bandeau-panier`) | Fine barre avec recherche et mini-panier au-dessus du catalogue. | panier, bandeau, boutique |
| Panier et compte (`panier-commande`) | Liens panier, commande et compte client sous le titre. | panier, compte, commande |
| Bandeau de catégorie (`bandeau-categorie`) | Titre et description de la catégorie dans un bandeau pleine largeur. | bandeau, catégorie, centré |
| Éditorial (`editorial`) | Libellé, titre, filet puis deux grandes colonnes. | éditorial, magazine, sobre |
| Catalogue minimal (`minimal`) | Titre et grille, rien d'autre. | minimaliste, sobre, rapide |
| Recherche et filtres latéraux (`recherche-filtres`) | Recherche puis filtres dans la colonne latérale. | recherche, filtres, complet |
| Promotions et vedettes (`double-mise-en-avant`) | Deux rangées de mise en avant avant le catalogue complet. | promotions, vedette, vitrine |
| Filtres collants (`filtres-collants`) | La colonne de filtres reste visible pendant le défilement. | filtres, collant, sticky |
| Outils en ligne (`outils-en-ligne`) | Recherche et mini-panier sur une ligne, puis titre et grille. | recherche, panier, compact |
| Carte titre et recherche (`carte-recherche`) | Titre et recherche dans une carte, grille dessous. | carte, recherche, encadré |
| Vitrine complète (`vitrine`) | Produits vedettes, filtres en haut, puis catalogue à quatre colonnes. | vitrine, filtres, vedette |

Identités : Clair épuré · Couleur de marque · Nuit · Éditorial · Doux et arrondi — clés `<mise-en-page>.<identité>` (ex. `filtres-gauche.clair`).

