# En-têtes du secteur « resto » (Restaurants, gastronomie et hôtellerie)

Fichier : `src/themeBuilder/catalog/header/sectors/resto.js` (10 modèles, clés `resto-01` à `resto-10`). Aucune image, aucun HTML libre ; horaires, adresse et téléphone sont des consignes à remplacer, jamais des données inventées. Bouton « Réserver » présent et évident dans chacun des 10 modèles (sauf navigation : le menu plein écran du n° 2 le laisse à gauche, toujours visible).

## Matrice de conception

| # | Nom | Direction | Composition (silhouette) | Navigation | Palette fixe | Polices | Mouvement | Mode |
|---|---|---|---|---|---|---|---|---|
| 01 | Le Zinc | Bistrot rétro | Bandeau d'horaires brique ; médaillon rond (double bordure) à gauche ; à droite deux niveaux (accroche + Réserver, filet en tirets, navigation) | Soulignée, majuscules | crème `#f6ead3`, brun `#2b1a12`, brique `#9c2f1d`, sable `#ecdcbc` | Yeseva One + Karla | médaillon en zoom, fondu doux ; survol « se soulève » | collant |
| 02 | Table Étoilée | Gastronomie sobre | Une seule rangée aérée : Réserver contour or à gauche, marque espacée entre deux filets, hamburger à droite | Menu plein écran numéroté (Motion Studio) | noir `#0f0e0c`, ivoire `#efe6d6`, or `#c8a456` | Cormorant Garamond + Raleway | révélation de la marque ; survol « flotte » | se réduit |
| 03 | Pizza Rosso | Trattoria / pizzeria | Liseré tricolore ; dalle rouge inclinée portant la marque (texte redressé) ; pastilles ; gros bouton pilule verte | Pastilles pleines au survol | crème `#fff4dc`, brun `#2a1208`, rouge `#c62a1f`, vert `#2a7a37` | Caprasimo + Nunito | glissement latéral ; survol « surgit » | collant |
| 04 | Maki Zen | Sushi / japonais minimal | Rangée presque vide : pastille rouge + marque, long filet fin qui relie, navigation fine, bouton carré | Fine, espacée | papier `#f7f4ee`, encre `#1c1b1a`, rouge `#b3261e` | Zen Old Mincho + Zen Kaku Gothic New | fondu | se cache au défilement |
| 05 | Pain de Campagne | Boulangerie-pâtisserie | Bandeau défilant d'annonces ; étiquette en tirets (marque) ; cases arrondies ; bouton pilule | Cases arrondies (passent à la ligne) | crème `#fdf1e3`, brun `#4a2c17`, miel `#e0953f` | Cherry Swash + Nunito Sans | montée douce ; survol « flotte » | collant |
| 06 | La Carte des Vins | Bar à vin / cave | Carte verticale : liste à filets pointillés dans un cartouche ; marque italique à gauche ; horaires + Réserver à droite | Liste verticale pointillée (menu replié sur mobile) | bordeaux `#2a0f17`, ivoire `#f3e6d8`, or `#d8b06a` | Playfair Display + Lato | fondu ; survol « se soulève » | statique |
| 07 | Brasserie Houblon | Brasserie / microbrasserie | Bandeau d'horaires ambre ; barre charbon à onglets pleine hauteur ; bouton carré | Onglets (liseré ambre) | charbon `#1e1b18`, crème `#f4ead8`, ambre `#e8a317` | Alfa Slab One + Barlow | glissement ; survol « appuie » | se réduit |
| 08 | Maison de Charme | Hôtel de charme | Marque italique centrée entre deux filets ; longue capsule contenant navigation + Réserver | Fine dans une capsule | lin `#f3efe6`, vert `#2f3a30`, sauge `#5b6f4f` | Bellefair + Mulish | révélation + capsule en montée ; survol « grossit » | collant |
| 09 | Grand Resort | Resort / hôtel luxe | Superposé : barre d'infos + Réserver en verre, titre monumental fluide centré, filet, navigation centrée | Fine centrée | teal `#0e2a2f`, blanc, sable `#e9d3a1` | Bodoni Moda + Jost | révélation ; survol « se soulève » | superposé, plein au défilement |
| 10 | Camion Soleil | Traiteur / food truck | Ticker rapide noir ; dalle inclinée à cadre épais ; cases à contour épais ; gros bouton noir | Cases contour noir, inversées au survol | jaune `#ffd23f`, noir `#1a1410`, rouge `#d7261e` | Lilita One + Work Sans | zoom ; survol « rebondit » | collant |

Les mouvements sont natifs (moteur de mouvement du Page Builder), désactivés si le visiteur demande moins de mouvement, et réglables dans l'éditeur (animation d'entrée, durée, délai, survol).

## Responsive

* Tablette : espacements réduits, médaillon et dalles rétrécis.
* Mobile : menu replié derrière un bouton (sauf n° 6 : la carte verticale est remplacée par un menu replié), bandeaux d'infos remplacés par le message à personnaliser (07) ou masqués (09 garde la barre simple), ordre par écran (marque en tête au n° 2), Réserver toujours conservé.

## Limites connues

* La marque en médaillon, en dalle ou en étiquette est un texte (ou le logo du site) : un nom très long passe à la ligne dans le médaillon du n° 1.
* Le menu plein écran du n° 2 s'affiche à plat dans la bibliothèque (correction du moteur faite ailleurs) ; il se teste sur la page publiée.
* Pas de navigation numérotée dans la rangée (seul le menu plein écran numérote).
