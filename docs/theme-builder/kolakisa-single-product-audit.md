# Produit individuel — Phase 1 : audit, références et 100 concepts

> Document de recherche. Aucun code modifié. Généré lors de la Phase 1 ; les constats du code viennent de lectures, aucun test n'a été exécuté.

## 1. État actuel
- Catalogue : `src/themeBuilder/catalog/single_product.js` = 20 mises en page × 5 identités (`kit.js` SKINS) = 100 entrées, mais seulement 20 structures réelles.
- Identités : jetons du site (`token:primary`…) → un changement de charte modifie les modèles ; seul le skin « Nuit » a des teintes fixes. Aucun mode héritage / indépendant / hybride n'existe.
- Mécanisme d'identité fixe déjà présent mais réservé aux en-têtes/pieds/sectoriels (`catalog/identities.js`, `ownSkins`).
- La copie utilisée est indépendante (`use.js`) mais ne mémorise pas la clé d'origine pour ce type.

## 2. Écarts moteur e-commerce (constatés dans le code)
- Variantes : un simple menu déroulant, aucun JS ; prix, image et stock ne se mettent pas à jour ; image de variante jamais affichée sur la fiche.
- Pas d'achat immédiat, pas de galerie interactive, pas de vidéo, pas de marque, pas d'attributs non variables.
- Types : simple et variable oui ; numérique partiel (pas de livraison de fichier) ; téléchargeable, groupé, externe non ; abonnement/personnalisation/âge uniquement dans la fiche native, pas dans le widget `shopbuy`.
- Avis : système réel (acheteurs vérifiés) mais aucun widget d'affichage dans le builder. Wishlist et comparaison existent sans widget.
- Absents : retour en stock, associés du produit courant, vente incitative, souvent achetés ensemble, vus récemment, livraison estimée.
- Jetons {{product.*}} : title, subtitle, description (400 car.), price, regular_price, url, image, category, short_description, sku, availability, cart_url. Rien pour galerie, note, stock, étiquettes, marque.
- SEO : JSON-LD Product/Offer réel ; pas de canonical, pas d'Open Graph.
- Sécurité : prix recalculés côté serveur (bon point) ; protection CSRF par Origin/Referer seulement ; pas de limitation de débit sur l'ajout au panier.

## 3. Bogues et risques à traiter avant tout nouveau modèle
1. Formulaire d'achat en double : `views/boutique/produit.ejs` insère le modèle puis le bloc natif `_buy` quand un modèle de thème existe.
2. Conditions « produit précis », « étiquette », « auteur » : le contexte de rendu ne transmet pas `postId`/`tags` (`shopPublic.js:129`, `render.js:42`) → elles ne devraient jamais correspondre. À confirmer par test.
3. Marque, type de produit, taxonomie personnalisée : n'existent pas dans les données.
4. Aperçu : toujours l'exemple « Nom du produit (exemple) », image vide, sans bandeau « exemple ».
5. `catalog/index.js` et `kit.js` sont partagés par 9 types : régression déjà arrivée.
6. Fichiers sensibles en session parallèle : `nodes.js`, `_sections.ejs`, `conditions.js`, `match.js`, `resolve.js`, `landing.css`.
7. Le dépôt est sur la branche `header-builder-elementor` (67 commits d'avance) avec des fichiers non suivis d'autres sessions.

## 4. Références étudiées (réellement ouvertes)
Google Search Central (Product, Merchant listing, variantes), web.dev (LCP), W3C APG (carrousel), Dawn (code), démos Flatsome (menu), page Woodmart, thèmes Shopify Prestige et Impact, page Elementor WooCommerce Builder.
**Non consultés** : ThemeForest, TemplateMonster, Creative Market, Porto, Rey, Kalles, Ella, Focal, Be Yours, Broadcast, Symmetry, documentation WooCommerce, boutiques de marque. Ces références doivent être étudiées avant la Phase 2, ou l'étude sera déclarée partielle.

## 5. Briques à construire (code des briques : B)
G1 galerie interactive (miniatures, zoom, clavier) · V1 variantes dynamiques (prix, image, stock, indisponibles) · R1 widget avis · A1 achat immédiat · P1 associés du produit courant · F1 souvent achetés ensemble · M1 vidéo produit · S1 attributs / caractéristiques · D1 livraison estimée · N1 retour en stock · W1 wishlist/comparaison · T1 marque/type · X1 personnalisation, âge, abonnement dans l'achat · H1 repères sur image · Q1 tarifs par quantité · DL produits téléchargeables et licences · EX produit externe · GR produit groupé.

## 6. Les 100 concepts
| Réf | Nom | Secteur | Galerie | Infos | Contenu | Achat | Signature | Briques à prévoir |
|---|---|---|---|---|---|---|---|---|
| A01 | Atelier vertical | Généraliste | vignettes verticales | droite | onglets | dans la fiche | Vignettes verticales, onglets | G1 |
| A02 | Rail horizontal | Mode | vignettes horizontales | colonne collante | accordéons | colonne collante | Vignettes sous l'image, infos collantes | G1 |
| A03 | Grille double | Déco | grille 2 colonnes | colonne collante | sections ancrées | carte d'achat | Images en grille 2 colonnes, achat en carte | G1 |
| A04 | Pile pleine largeur | Luxe | images empilées | superposée à l'image | éditorial | barre flottante | Images empilées, infos flottantes sur l'image | G1 |
| A05 | Carrousel plein cadre | Photo | carrousel | bandeau de titre | description simple | tiroir | Carrousel large, achat en tiroir | G1 |
| A06 | Mosaïque asymétrique | Déco | mosaïque | gauche | sections ancrées | dans la fiche | Cinq images en mosaïque | G1 |
| A07 | Loupe joaillière | Bijoux | image unique + zoom | droite | tableau technique | carte d'achat | Image unique, loupe macro | G1 |
| A08 | Boutique latérale | Généraliste | vignettes verticales | gauche | accordéons | dans la fiche | Galerie à droite, barre latérale catégories | G1 |
| A09 | Défilement rapide | Streetwear | images empilées | colonne collante | description simple | barre flottante | Images en défilement vertical, barre mobile | G1 |
| A10 | Héros plein écran | Sneakers | visuel plein écran | bandeau de titre | onglets | colonne collante | Visuel 100 % de la hauteur, achat sous le pli | G1 |
| B01 | Guide des tailles | Mode | vignettes verticales | droite | accordéons | carte d'achat | Tableau des tailles intégré | G1, V1, S1 |
| B02 | Pastilles couleur | Mode | vignettes horizontales | droite | description simple | dans la fiche | Pastilles couleur qui changent l'image | G1, V1 |
| B03 | Look complet | Mode | grille 2 colonnes | 3 colonnes | sections ancrées | carte d'achat | Tenue complète et produits à associer | G1, P1, F1 |
| B04 | Lookbook | Mode | mosaïque | centrée | éditorial | dans la fiche | Récit éditorial puis fiche | G1 |
| B05 | Drop limité | Sneakers | visuel plein écran | superposée à l'image | description simple | barre flottante | Page de lancement, stock réel affiché | G1, V1 |
| B06 | Maroquinerie | Sacs | image unique + zoom | gauche | tableau technique | colonne collante | Détails matière, loupe sur coutures | G1, S1 |
| B07 | Capsule saison | Mode | volet image fixe | colonne collante | sections ancrées | dans la fiche | Volet image fixe, texte qui défile | G1 |
| B08 | Chaussure de ville | Chaussures | vignettes verticales | colonne collante | onglets | carte d'achat | Pointures avec stock par pointure | G1, V1 |
| B09 | Basiques enfants | Enfants | vignettes horizontales | droite | accordéons | dans la fiche | Tailles par âge, couleurs vives | G1, V1 |
| B10 | Lingerie douce | Mode | images empilées | centrée | description simple | tiroir | Fiche discrète, tiroir d'achat | G1, V1 |
| C01 | Noir et or | Luxe | image unique + zoom | centrée | éditorial | dans la fiche | Page monochrome, grands blancs | G1 |
| C02 | Maison de montres | Montres | vignettes verticales | gauche | tableau technique | carte d'achat | Calibre et caractéristiques détaillées | G1, S1 |
| C03 | Écrin | Bijoux | images empilées | droite | sections ancrées | colonne collante | Coffret cadeau et gravure | G1, X1 |
| C04 | Salon privé | Luxe | visuel plein écran | bandeau de titre | éditorial | tiroir | Accès sur demande, contact conseiller | G1 |
| C05 | Pièce unique | Art | image unique + zoom | colonne collante | description simple | carte d'achat | Un seul exemplaire, certificat | G1 |
| C06 | Parfumerie | Parfum | mosaïque | centrée | accordéons | dans la fiche | Notes olfactives en pyramide | G1, S1 |
| C07 | Cave à vins | Boissons | petite image / sans galerie | droite | tableau technique | carte d'achat | Étiquette, millésime, accords | S1 |
| C08 | Haute joaillerie | Bijoux | carrousel | superposée à l'image | onglets | barre flottante | Carrousel de détails, rendez-vous boutique | G1 |
| C09 | Cuir et patine | Maroquinerie | grille 2 colonnes | gauche | sections ancrées | dans la fiche | Gros plans matière en grille | G1 |
| C10 | Édition numérotée | Luxe | volet image fixe | centrée | éditorial | colonne collante | Numéro de série, récit de fabrication | G1 |
| D01 | Routine soin | Beauté | images empilées | gauche | accordéons | carte d'achat | Étapes d'utilisation et ingrédients | G1, S1 |
| D02 | Teintes maquillage | Cosmétiques | mosaïque | colonne collante | onglets | tiroir | Nuancier cliquable | G1, V1 |
| D03 | Avant après | Soins | grille 2 colonnes | droite | sections ancrées | dans la fiche | Comparaison avant/après | G1, H1 |
| D04 | Coffret découverte | Beauté | mosaïque | 3 colonnes | description simple | colonne collante | Produits du coffret en liste | G1, GR |
| D05 | Cure abonnement | Bien-être | image unique + zoom | gauche | accordéons | carte d'achat | Achat unique ou abonnement | G1, X1 |
| D06 | Pharmacie douce | Soins | petite image / sans galerie | droite | tableau technique | dans la fiche | Composition et précautions | S1 |
| D07 | Rituel vidéo | Beauté | visuel plein écran | centrée | onglets | barre flottante | Vidéo d'application en tête | M1 |
| D08 | Naturel | Cosmétiques bio | images empilées | colonne collante | éditorial | carte d'achat | Labels et origine des ingrédients | G1, S1 |
| D09 | Barbier | Soins homme | vignettes verticales | bandeau de titre | description simple | dans la fiche | Bandeau sombre, grande typographie | G1 |
| D10 | Parfum personnalisé | Beauté | image unique + zoom | gauche | accordéons | colonne collante | Texte de gravure sur flacon | G1, X1 |
| E01 | Fiche technique | Électronique | vignettes verticales | droite | tableau technique | colonne collante | Tableau de spécifications complet | G1, S1 |
| E02 | Comparateur | Informatique | vignettes horizontales | colonne collante | onglets | carte d'achat | Comparaison avec d'autres modèles | G1, W1 |
| E03 | Casque studio | Audio | visuel plein écran | superposée à l'image | sections ancrées | barre flottante | Sections par fonction avec ancres | G1, M1 |
| E04 | Téléphone | Mobile | carrousel | 3 colonnes | tableau technique | dans la fiche | Capacités et coloris en pastilles | G1, V1, S1 |
| E05 | Accessoire malin | Mobile | vignettes horizontales | droite | description simple | carte d'achat | Compatibilité par modèle | V1 |
| E06 | Objectif photo | Photographie | image unique + zoom | gauche | onglets | dans la fiche | Zoom, exemples de clichés | G1, S1 |
| E07 | Éclaté produit | Électronique | petite image / sans galerie | centrée | sections ancrées | tiroir | Repères sur l'image | H1 |
| E08 | Configuration PC | Informatique | images empilées | colonne collante | tableau technique | zone de personnalisation | Options à composer | V1, X1 |
| E09 | Offre reconditionnée | Électronique | grille 2 colonnes | bandeau de titre | accordéons | barre flottante | États et garantie | S1 |
| E10 | Test vidéo | Audio | volet image fixe | colonne collante | éditorial | colonne collante | Vidéo de test et points forts | M1 |
| F01 | Salon scandinave | Mobilier | images empilées | superposée à l'image | sections ancrées | colonne collante | Ambiances et dimensions | G1, S1 |
| F02 | Cuisine pro | Cuisine | vignettes horizontales | 3 colonnes | onglets | tiroir | Capacités et accessoires | G1, S1 |
| F03 | Atelier déco | Déco | mosaïque | centrée | éditorial | carte d'achat | Mise en scène éditoriale | G1 |
| F04 | Électroménager | Électroménager | vignettes horizontales | gauche | tableau technique | barre flottante | Classe énergie et dimensions | G1, S1 |
| F05 | Livraison volumineuse | Mobilier | vignettes verticales | colonne collante | accordéons | colonne collante | Délai et montage détaillés | G1, D1 |
| F06 | Luminaire | Maison | visuel plein écran | bandeau de titre | description simple | dans la fiche | Visuel d'ambiance plein cadre | G1 |
| F07 | Textile maison | Maison | grille 2 colonnes | droite | accordéons | carte d'achat | Matières et entretien | G1, V1 |
| F08 | Vaisselle | Cuisine | image unique + zoom | centrée | sections ancrées | dans la fiche | Pièces associées du service | G1, P1 |
| F09 | Meuble sur mesure | Mobilier | images empilées | gauche | description simple | zone de personnalisation | Dimensions et finitions à choisir | V1, X1 |
| F10 | Art de table | Maison | carrousel | colonne collante | onglets | tiroir | Carrousel d'ambiances | G1 |
| G01 | Épicerie fine | Alimentaire | carrousel | centrée | tableau technique | dans la fiche | Valeurs nutritionnelles, allergènes | G1, S1 |
| G02 | Marché du terroir | Alimentaire | petite image / sans galerie | gauche | éditorial | dans la fiche | Producteur et origine | S1 |
| G03 | Panier abonnement | Alimentaire | vignettes horizontales | droite | accordéons | carte d'achat | Livraison récurrente | G1, X1 |
| G04 | Chocolatier | Alimentaire | visuel plein écran | centrée | éditorial | barre flottante | Fiche gourmande plein cadre | G1 |
| G05 | Thé et café | Boissons | vignettes verticales | colonne collante | sections ancrées | dans la fiche | Profil de dégustation en jauges | G1, S1 |
| G06 | Atelier artisan | Artisanat | mosaïque | gauche | éditorial | colonne collante | Histoire du créateur | G1 |
| G07 | Poterie | Artisanat | grille 2 colonnes | droite | description simple | carte d'achat | Pièces uniques et dimensions | G1, V1 |
| G08 | Pâtisserie sur commande | Alimentaire | images empilées | droite | accordéons | carte d'achat | Message personnalisé, délai | G1, X1 |
| G09 | Boîte cadeau | Alimentaire | image unique + zoom | bandeau de titre | sections ancrées | tiroir | Composition du coffret | G1, GR |
| G10 | Bio local | Alimentaire | petite image / sans galerie | centrée | onglets | dans la fiche | Labels et circuits courts | S1 |
| H01 | Équipement sportif | Sport | vignettes verticales | colonne collante | onglets | colonne collante | Niveaux et pratiques | G1, V1 |
| H02 | Fitness | Sport | volet image fixe | superposée à l'image | sections ancrées | tiroir | Programme associé | G1 |
| H03 | Vélo | Sport | vignettes horizontales | droite | tableau technique | carte d'achat | Géométrie et tailles | G1, S1, V1 |
| H04 | Pièces auto | Auto | petite image / sans galerie | gauche | tableau technique | dans la fiche | Compatibilité véhicule | S1 |
| H05 | Jouets | Jouets | mosaïque | droite | accordéons | carte d'achat | Âge conseillé et sécurité | G1, S1 |
| H06 | Éveil bébé | Enfants | grille 2 colonnes | centrée | description simple | dans la fiche | Couleurs douces, conseils | G1 |
| H07 | Animalerie | Animaux | vignettes horizontales | colonne collante | onglets | colonne collante | Taille et race conseillées | G1, V1 |
| H08 | Matériel pro | Professionnel | vignettes verticales | 3 colonnes | tableau technique | colonne collante | Tarifs par quantité | S1, Q1 |
| H09 | Randonnée | Sport | images empilées | gauche | sections ancrées | barre flottante | Poids, contenance, saisons | G1, S1 |
| H10 | Atelier outillage | Professionnel | vignettes verticales | bandeau de titre | tableau technique | dans la fiche | Bandeau titre, références | G1, S1 |
| I01 | Logiciel licence | Logiciel | petite image / sans galerie | centrée | onglets | carte d'achat | Licences et versions | DL |
| I02 | Livre numérique | Livres | image unique + zoom | gauche | éditorial | dans la fiche | Extrait et sommaire | DL |
| I03 | Formation en ligne | Formation | volet image fixe | colonne collante | sections ancrées | colonne collante | Programme et ce qui est inclus | DL |
| I04 | Pack de ressources | Numérique | grille 2 colonnes | centrée | description simple | carte d'achat | Aperçu des fichiers | DL |
| I05 | Modèle à télécharger | Numérique | visuel plein écran | bandeau de titre | description simple | barre flottante | Aperçu plein cadre | DL |
| I06 | Livre papier | Livres | vignettes verticales | droite | tableau technique | dans la fiche | Quatrième de couverture, auteur | G1, S1 |
| I07 | Manuel scolaire | Éducatif | vignettes horizontales | gauche | onglets | carte d'achat | Niveau et programme | S1 |
| I08 | Kit éducatif | Éducatif | mosaïque | 3 colonnes | sections ancrées | colonne collante | Contenu du kit | G1, GR |
| I09 | Police ou plugin | Logiciel | petite image / sans galerie | colonne collante | accordéons | carte d'achat | Démonstration et licence étendue | DL |
| I10 | Cours à l'unité | Formation | carrousel | droite | sections ancrées | tiroir | Extraits vidéo | M1, DL |
| J01 | Produit à personnaliser | Personnalisable | image unique + zoom | colonne collante | description simple | zone de personnalisation | Aperçu en direct du texte | X1 |
| J02 | Lien partenaire | Affiliation | vignettes verticales | droite | onglets | carte d'achat | Bouton vers la boutique du partenaire | EX |
| J03 | Lot groupé | Groupé | grille 2 colonnes | droite | accordéons | colonne collante | Composition et quantités | GR, G1 |
| J04 | Abonnement mensuel | Services | petite image / sans galerie | centrée | sections ancrées | carte d'achat | Fréquences et avantages | X1 |
| J05 | Précommande | Lancement | visuel plein écran | superposée à l'image | éditorial | barre flottante | Date annoncée, acompte | G1 |
| J06 | Vente privée | Mode | images empilées | bandeau de titre | description simple | tiroir | Accès réservé aux membres | G1 |
| J07 | Réservation | Services | volet image fixe | gauche | sections ancrées | colonne collante | Créneaux et lieu | X1 |
| J08 | Catalogue sans achat | Industrie | vignettes verticales | colonne collante | tableau technique | dans la fiche | Demande de devis | S1 |
| J09 | Tarifs dégressifs | B2B | petite image / sans galerie | colonne collante | onglets | zone de personnalisation | Tableau de prix par quantité | Q1 |
| J10 | Cadeau rapide | Cadeaux | vignettes horizontales | centrée | description simple | tiroir | Achat rapide en trois clics | G1, A1 |

## 7. Matrice de diversité
Quatre axes structurels : galerie (10 valeurs), position des infos (7), navigation du contenu (6), achat (6).
- Vérifié par script : 100 références uniques ; aucune combinaison des 4 axes en double.
- Pas encore atteint : 86 paires ne diffèrent que par un seul axe. Elles se distinguent par leur signature, mais à renforcer en Phase 2/3 (cinquième axe : hiérarchie visuelle / direction artistique). Liste : A01~I06, A01~J02, A02~F05, A02~H07, A03~B03, A04~J05, A05~J06, A06~C09, A07~C07, A07~H03, B01~F07, B01~G03, B01~G08, B01~H05, B01~J02, B02~B09, B02~E05, B04~C01, B04~C06, B04~F03, B05~E03, B05~I05, B05~J05, B06~D10, B07~G05, B07~I03, B08~E02, B08~H01, B08~J02, B09~G03, B10~J06, B10~J10, C01~F08, C01~I02, C03~F01, C05~J01, C07~D06, C07~H03, C09~D03, C10~E10, D01~D05, D01~G08, D02~F10, D04~I08, D05~D10, D06~H04, D06~I06, D07~G04, D09~F06, D09~H10, E01~H08, E01~I06, E02~H07, E02~I07, E03~J05, E04~G01, E05~G03, E05~G07, E05~H03, E06~I02, E07~J04, E10~I03, F05~H01, F06~I05, F07~G03, F07~G07, F07~G08, F07~H05, F07~J03, G02~H04, G02~I02, G03~G08, G03~H03, G03~H05, G04~J05, G05~J08, G07~I04, G08~H05, G10~I01, H01~H07, H06~I04, H10~I06, H10~J08, I01~J04, I03~J07, I06~J08.

## 8. Plan progressif
- Phase 2 : architecture d'identité (trois modes, variables CSS isolées, champ unique, mémorisation de l'origine, migration additive, retour arrière) + correction des bogues §3 (1 et 2).
- Phase 3 : briques minimales (G1, V1, A1, R1) + un seul modèle complet testé.
- Phase 4 : groupes de 5 à 10, ordonnés par briques disponibles ; les concepts qui exigent DL, EX, GR, T1, D1, N1 attendent ces briques.
- Phase 5 : audit final.

## 9. Stratégie de tests
Bibliothèque (100 uniques, matrice) · rendu des données réelles (prix, promo, variantes, stock, avis) · panier et achat immédiat (quantité, stock, validations) · scénario d'identité en 9 étapes (marine → beige → héritage → retour) · responsive 320 → 1920 · isolation multisite (`isolation-*`, `header-*`, `footer-*`) · accessibilité (clavier, focus, swatches) · SEO (JSON-LD sans doublon). Les tests existent déjà pour le catalogue et le rendu (`theme-builder-*`) mais aucun test dédié à la fiche produit.
