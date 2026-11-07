# En-têtes du secteur « sante » (Nutrition, santé et bien-être) : matrice de conception

Fichier : `src/themeBuilder/catalog/header/sectors/sante.js`. Toutes les formes sont natives (conteneurs arrondis, anneaux, bandes inclinées, dégradés) ; aucune image, aucune coordonnée inventée (consignes à remplacer).

| Clé | Nom | Direction | Composition | Palette | Polices | Navigation | Composants | Défilement | Entrée / survol |
|---|---|---|---|---|---|---|---|---|---|
| 01 | Sève | Organique | 1 rangée haute : trois disques qui se chevauchent + marque ; capsule de navigation ; bouton ; liseré dégradé | crème, sauge, vert, or doux | Fraunces + Nunito | pilules dans une capsule | disques, anneau, stripe | statique | douce ; disques en zoom lent ; grossit |
| 02 | Silence de Kyoto | Minimalisme japonais | 1 rangée de 56 px : sceau vermillon, marque minuscule espacée, bouton-ligne, menu plein écran numéroté | blanc cassé, noir, vermillon | Zen Old Mincho + Zen Kaku | menu plein écran (fsMenu) | disque, filet, bouton-ligne | collant | fondu ; se soulève |
| 03 | Herbier | Naturopathie | Bloc de marque olive à coins asymétriques (30 %) ; à droite : infos pratiques puis navigation + rendez-vous | crème, olive, terre | Gelasio + Mulish | soulignée | anneau, infos | statique | glisse depuis la gauche ; appuie |
| 04 | Cabinet Verger | Nutritionniste | Marque + navigation, carte terracotta de rendez-vous à droite, bandeau d'informations dessous | blanc, vert profond, terracotta | DM Serif Display + Figtree | soulignée | carte, infos, message | collant | monte en fondu ; surgit |
| 05 | Horizon Santé | Clinique | Rangée blanche (marque + 3 infos à filets) puis bande bleu profond d'onglets de services + rendez-vous | blanc, bleu océan, bleu profond | Manrope + Figtree | onglets | disque dégradé, filets, infos | se réduit | monte ; se soulève |
| 06 | Cueillette | Compléments / boutique | Bandeau défilant, médaillon rond de marque, recherche + compte + panier à pastille, catégories en pilules | crème, olive | Fraunces + Karla | pilules | ticker, recherche, compte, panier | collant | fondu |
| 07 | Souffle en Ligne | Yoga / méditation | Colonne centrée sur dégradé bleu-lavande : anneaux concentriques autour de la marque, navigation fine, bouton rond | bleu glacé, lavande | Quicksand + Nunito Sans | fine | anneaux, dégradé | verre dépoli | révélation ; flotte |
| 08 | Aurèle Spa | Spa haut de gamme | Bande sombre : navigation en capitales, marque italique entre filets or, horaires + bouton contour | vert profond, or sable, ivoire | Cormorant Garamond + Jost | capitales espacées | filets or, infos | se réduit | révélation ; se soulève |
| 09 | Cap Nutrition | Programme de coaching | Bande verte (bandes inclinées, marque blanche, bouton blanc) puis rangée de cases de navigation en mosaïque | pêche, vert, terre cuite | Bricolage Grotesque + Figtree | mosaïque de cases | bandes inclinées | se réduit | glisse ; rebondit |
| 10 | Pharmacie du Parc | Pharmacie | Bandeau vert d'infos, rangée marque + recherche large + compte + panier + rendez-vous, bande verte de rubriques | blanc, vert émeraude | Albert Sans + Public Sans | blocs pleins | infos, recherche, compte, panier | collant | monte ; se soulève |

Responsive : chaque rangée passe à la ligne (flex), les grilles ont un réglage tablette et `1fr` mobile, les formes décoratives et informations sont masquées sur mobile, les menus se replient derrière un bouton (sauf 02 : menu plein écran).
