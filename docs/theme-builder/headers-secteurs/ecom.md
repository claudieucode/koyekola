# En-têtes du secteur E-commerce (ecom) : matrice de conception

Fichier : `src/themeBuilder/catalog/header/sectors/ecom.js`. Dix modèles `ecom-01` à `ecom-10`. Éléments commerciaux = éléments natifs du CMS (recherche vers le catalogue du site, compte du visiteur, mini-panier avec pastille de compte réel) ; catégories = menu affecté à « En-tête » ; aucun produit, prix ni catégorie inventé ; annonces = consignes à remplacer ; barres promotionnelles = conteneurs `dismissible`.

| Clé | Nom | Direction artistique | Composition | Navigation / catégories | Recherche · compte · panier | Palette (fond, texte, accent) | Polices (titres + texte) | Mode · entrée · survol |
|---|---|---|---|---|---|---|---|---|
| 01 | Grand Rayon | Marketplace généraliste | 3 étages : bandeau promo fermable (nuit), rangée marque + recherche géante + actions, rangée de catégories sur gris | Onglets (tab) | Recherche au centre de la rangée, compte et panier à droite | blanc, bleu nuit, orange | Poppins + Inter | collant réduit · fade · lift |
| 02 | Maison Lin | Mode épurée | Une rangée aérée : menu plein écran / marque centrée / actions ; rangée de recherche fine dessous | Menu plein écran numéroté (ordinateur et mobile) | Recherche seule en rangée centrée, compte et panier à droite | ivoire, noir | Bodoni Moda + Jost | collant · reveal |
| 03 | Atelier Intérieur | Maison et déco | Colonne de marque en terre cuite (angle arrondi) + deux rangées à droite | Catégories soulignées | Compte dans la colonne de marque, recherche arrondie + panier à droite | lin, brun, terre cuite | Fraunces + DM Sans | collant réduit · slide |
| 04 | Volt | High-tech | Ticker en tête, une seule rangée dense, liseré dégradé | Mono (minuscules) | Recherche « commande » extensible, compte, panier | nuit, gris clair, menthe | Space Grotesk + IBM Plex Mono | collant · zoom |
| 05 | Halle Gourmande | Épicerie fine | Rangée utilitaire à droite, marque italique entre deux filets, catégories entre filets épais et fin | Capitales espacées centrées | Recherche + compte + panier en rangée utilitaire | crème, vert sapin, rouge | Libre Baskerville + Work Sans | collant · fade |
| 06 | Éclat Beauté | Beauté | Barre promo dégradé fermable + carte arrondie flottante (ombre) | Pilules | Recherche arrondie, compte, panier dans la carte | rose poudré, prune | Cormorant Garamond + Nunito Sans | collant réduit · rise |
| 07 | Cabinet Créateur | Créateur, navigation latérale | Rail vertical à gauche (marque + catégories en grand) ; à droite actions + ticker géant | Liste verticale (mobile : bouton de menu) | Recherche + compte + panier en haut à droite | sable, noir, brique | Syne + Work Sans | normal · slide |
| 08 | Solde Express | Outlet / promos | Barre promo rouge fermable avec bouton ; rangée noire, bloc de marque jaune à biais | Blocs pleine hauteur | Recherche compacte, panier en pastille jaune | noir, blanc, jaune, rouge | Anton + Barlow Condensed | collant · slide · pop |
| 09 | Cherche & Trouve | Recherche d'abord | Bandeau bleu : mini-rangée, champ de recherche géant centré, pastilles centrées | Pilules centrées | Recherche géante au centre, compte et panier en haut | bleu roi, blanc, jaune | Manrope | normal · zoom |
| 10 | Pavé Catalogue | Mosaïque de catégories | Cadre épais : nom monumental + recherche à gauche, cases de catégories à droite | Cases bordées (navTiles) | Recherche sous la marque, compte et panier en blocs | blanc, noir, rouge | Archivo Black + Archivo | normal · reveal |

## Responsive
Tablette : grilles à deux colonnes resserrées. Mobile : une colonne, recherche pleine largeur, catégories repliées derrière le bouton du menu natif (modèle 02 : menu plein écran ; modèle 07 : la liste verticale est remplacée par un menu replié), compte et panier gardés dans la ligne de marque.

## Limites
Aucun menu à sous-panneaux ; le menu plein écran ne montre que le premier niveau ; pas de favoris (le CMS n'a pas d'élément « favoris » natif) ; la mosaïque n'a pas un nombre de colonnes garanti.
