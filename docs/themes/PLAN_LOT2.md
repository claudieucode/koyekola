# Plan de l'extension n°2 : 30 thèmes (41 à 70)

## 1. Inventaire (40 thèmes existants)
- 19 catégories couvertes. Les mieux fournies : agence 4, services 4, divertissement 3, beauté 3, gastronomie 3, édition 3.
- Bibliothèque technique : recherche, catégories, styles, état, tri et pagination sont déjà faits côté serveur ; les aperçus se chargent à la demande ; 1 775 polices disponibles ; paquets de thèmes 3,6 Mo au total, chacun chargé seulement sur son site. Rien ne bloque à 70 thèmes.
- À ajouter pour 70 : collections thématiques (Restauration et boissons, Services professionnels, Culture et spectacle, Voyage et nature, Boutiques et artisans, Institutions) + chargement différé des vignettes.

## 2. Zones de saturation (à éviter)
| Zone | Déjà utilisée | Conséquence |
|---|---|---|
| Fond crème / ivoire / papier chaud | environ 19 thèmes sur 40 | max 4 nouveaux thèmes à fond chaud ; le reste : blanc, noir, couleurs franches, bleus, verts |
| Titre typographique monumental | 7 thèmes (arene, bitume, atelier, signature, noir, volume, une) | aucun nouveau hero « gros mot » |
| Néon / nuit violette-rose-cyan | 5 thèmes (pulse, vortex, ledger, orbite, echo) | cybersécurité en vert-ambre terminal, pas de néon |
| Barre flottante en pilule | 4 thèmes | pas de pilule |
| Serif élégant + sans doux | 12 thèmes environ | nouvelles paires inédites (monospace, slab, grotesque condensée, didone lyrique, gothique, etc.) |
| Planning hebdomadaire en colonnes | souffle, pulse | danse : frise de saison, pas de grille hebdo |

## 3. Les 30 thèmes
Remplacement : « Coworking / tiers-lieu » existe déjà (Tiers) → remplacé par **Planétarium / observatoire**.

| # | Clé | Domaine | Direction artistique | Hero (inédit en gras) | Navigation | Grille | Composant signature |
|---|---|---|---|---|---|---|---|
| 1 | pellicule | Production cinéma | noir grain argentique, générique | **letterbox 2,39 avec bande-annonce** | barre de chapitres bas | rangées de films horizontales | filmographie + fiche film |
| 2 | rideau | Théâtre | velours, clair-obscur, affiche | **rideau qui s'ouvre** | menu plein écran à programme | affiche-colonnes | saison + réservation de places |
| 3 | pointe | École de danse | courbes, mouvement, encre bleue | traces de mouvement SVG | latérale discrète | bandes courbes | frise de saison filtrable par niveau et style |
| 4 | facette | Joaillerie | fond profond, macro, reflets | gemme géométrique animée | barre fine centrée | vitrines 2 colonnes | pièce zoomable + choix métal/pierre |
| 5 | petale | Fleuriste | frais, organique, aquarelle | composition florale mouvante | barre à onglets de saison | masonry | composeur de bouquet + créneau de livraison |
| 6 | houblon | Brasserie | étiquettes gravées, rétro-industriel | mur de fûts et étiquettes | bandeau étiquette | grille d'étiquettes | bières + profil de goût en radar |
| 7 | millesime | Domaine viticole | terroir, paysages, classique | panorama de parcelles | menu en liste verticale | colonnes de cuvées | fiches millésimes + dégustation |
| 8 | roulotte | Food truck | pop, stickers, couleurs criardes | camion dessiné qui roule | **onglets d'autocollants** | cartes inclinées | semaine du truck sur carte |
| 9 | speakeasy | Bar à cocktails | art déco, dorures, nuit feutrée | éventail déco en or | porte-menu vertical doré | carte à filets | cocktails par spiritueux |
| 10 | rasoir | Barbershop | cuir, rétro, contraste | enseigne à bandes tournantes | barre enseigne | tickets de service | rendez-vous par barbier |
| 11 | encre | Tatouage | flash, trait gras, brut | planche de flashs | menu en tampon | planches de flashs | portfolio par artiste + projet |
| 12 | cap | Cabinet de conseil | schémas, autorité sobre | schéma stratégique animé | méga-menu à expertises | études en colonnes | cas chiffrés |
| 13 | bilan | Expert-comptable | ordre, clarté, rassurant | calendrier de l'année | barre à échéances | tableau lisible | calendrier fiscal + simulateur |
| 14 | talent | Recrutement | portraits, optimisme | mosaïque de portraits | barre + compteur d'offres | cartes d'offres | offres filtrables + candidature |
| 15 | bouclier | Cybersécurité | terminal vert-ambre | **terminal interactif** | **barre de commandes** | alertes en flux | tableau de menaces + audit |
| 16 | manuel | Doc développeur | monospace, lisibilité | page de doc + recherche | **latérale avec sommaire** | **doc 3 colonnes** | doc avec blocs de code copiables |
| 17 | civitas | Mairie | institutionnel, accessible | accès rapides aux démarches | **bandeau d'accessibilité (taille, contraste)** | services en colonnes | démarches + agenda + actualités |
| 18 | zenith | Planétarium | ciel, étoiles, carte céleste | **carte du ciel rotative** | cercle d'horaires | séances en arcs | séances + réservation |
| 19 | riviera | Villas | lumière, piscine, slow | grand plan lumière | barre transparente | cartes pleine largeur | fiches villas + calendrier |
| 20 | etoile | Glamping | bois, ciel étoilé, dessins | carte dessinée du site | onglets en bois | hébergements sur carte | carte des hébergements + réservation |
| 21 | abysse | Plongée | bleus profonds, bulles | descente par paliers | profondeur à droite | niveaux en paliers | formation + sorties |
| 22 | altitude | Aviation privée | horizon, silence | trajectoire sur globe | barre minimale | pas de grille : une colonne | demande de vol |
| 23 | volt | Vélo électrique | vert vif, angles | vélo en diagonale | barre inclinée | blocs diagonaux | configurateur + autonomie |
| 24 | circuit | Hardware | éclatés techniques | **produit éclaté au défilement** | barre sombre à onglets | **scrollytelling** | spécifications révélées |
| 25 | meeple | Jeux de société | plateau, couleurs généreuses | plateau de jeu | pions de navigation | cartes de boîtes | catalogue (âge, durée, joueurs) |
| 26 | essence | Ébéniste | bois, lenteur | veines de bois | barre lente | planches larges | essences + dimensions |
| 27 | lyrique | Opéra / orchestre | noir et or, solennel | portique et lustre | menu à programme | colonnes lyriques | saison + plan de salle |
| 28 | chaine | Créateur de contenu | énergie, vignettes | grille de vignettes | barre à abonnement | mur de vidéos | vidéos + kit média |
| 29 | recueil | Services funéraires | sobriété absolue, quasi statique | texte seul, très calme | barre simple | une colonne | avis + condoléances |
| 30 | sape | Sapologie | élégance flamboyante | défilé de tenues | menu en étiquette | lookbook | mesures guidées + lookbook |

Valeurs d'axes inédites introduites : letterbox cinéma, rideau qui s'ouvre, terminal interactif, barre de commandes, bandeau d'accessibilité, latérale à sommaire, doc 3 colonnes, scrollytelling d'éclaté produit, carte du ciel rotative, onglets d'autocollants (plus de 5).

## 4. Lots
- **Pilote (3)** : pellicule (nuit, cinéma), manuel (clair, monospace, documentation), roulotte (pop, couleurs criardes). Très éloignés entre eux et de l'existant.
- **Lot 2 (6)** : rideau, facette, speakeasy, rasoir, encre, lyrique
- **Lot 3 (6)** : houblon, millesime, petale, riviera, etoile, altitude
- **Lot 4 (6)** : cap, bilan, talent, bouclier, civitas, recueil (mairie et funéraire : sensibles)
- **Lot 5 (5)** : pointe, zenith, volt, circuit, meeple
- **Lot 6 (4)** : chaine, sape, abysse, essence

À chaque lot : tests, matrice anti-clone, aperçus, envoi sur GitHub.
