// 100 concepts d'archives : [famille, nom, usage, comp, cols, image, barre, entête, nav, filtre, particularité, bg, encre, accent, polices, faisabilité]
// comp : G grille · GA asymétrique · LI liste image gauche · LD image droite · LT texte seul · IX index daté · MO mosaïque · UB une+brèves · HG héros+grille · V3 trois vedettes
//        MS sections par rubrique · CJ colonnes de journal · TL frise · OV image en fond · FS pleine largeur · CR bandes défilantes · TB tableau · ZZ zigzag · SP écran scindé
//        GM groupé par mois/année · NU classement numéroté · CH cartes horizontales · TY typographique géant · PO mur de fiches · ST pile
// barre : 0 aucune · G gauche · D droite · H haut (filtres) · 2 double
// nav : N numéros · PS précédent/suivant · NP les deux · M charger plus · I défilement infini
// filtre : - aucun · C rubriques · S recherche · T étiquettes · CS rubriques+recherche
// faisabilité : A = briques actuelles · B = brique à ajouter (précisée)
const C = [];
const add = (...a) => C.push(a);
// 1 Magazine premium
add("Magazine premium", "Une du matin", "magazine généraliste", "HG", 3, "haut 16:9", "0", "bandeau", "N", "C", "premier article plein cadre + grille", "#faf7f2", "#14110f", "#b3122a", "Playfair Display + Inter", "A");
add("Magazine premium", "Couverture", "magazine culturel", "V3", 3, "haut 4:5", "0", "centré", "M", "-", "trois couvertures verticales puis liste", "#ffffff", "#111111", "#e4572e", "Fraunces + Work Sans", "A");
add("Magazine premium", "Rubriques en colonnes", "magazine d'actualité", "MS", 4, "gauche carré", "D", "éditorial", "N", "C", "une section par rubrique", "#f5f5f0", "#1d1d1b", "#005f73", "Libre Caslon + Source Sans", "B: boucle par rubrique");
add("Magazine premium", "Grand format", "magazine d'images", "FS", 1, "plein écran", "0", "minimal", "I", "-", "une image par écran, titre superposé", "#0c0c0c", "#f4f1ea", "#d9a441", "Cormorant + Jost", "B: image en fond");
// 2 Journal numérique
add("Journal numérique", "Quotidien", "journal en ligne", "CJ", 3, "aucune", "0", "bandeau", "N", "C", "colonnes filetées, titre massif", "#fdfcf8", "#161616", "#a4161a", "Old Standard TT + Public Sans", "A");
add("Journal numérique", "Dernière heure", "fil d'actualité", "TL", 1, "aucune", "0", "minimal", "M", "C", "frise verticale avec heures", "#ffffff", "#0f172a", "#dc2626", "IBM Plex Sans + IBM Plex Mono", "B: frise");
add("Journal numérique", "Page de une", "portail d'information", "UB", 2, "haut 16:9", "D", "éditorial", "N", "CS", "une + brèves + colonne les plus lus", "#f7f7f7", "#202020", "#0b5fff", "Merriweather + Roboto", "A");
add("Journal numérique", "Édition du soir", "newsletter archivée", "GM", 1, "aucune", "0", "centré", "N", "-", "groupé par mois", "#f1ece1", "#2a2118", "#7a4e2d", "Spectral + Karla", "B: regroupement par mois");
// 3 Blog minimaliste
add("Blog minimaliste", "Carnet", "blog personnel", "LT", 1, "aucune", "0", "minimal", "PS", "-", "titres seuls, date en marge", "#ffffff", "#222222", "#222222", "EB Garamond + Inter", "A");
add("Blog minimaliste", "Marge", "blog d'écrivain", "IX", 1, "aucune", "0", "centré", "N", "T", "index daté étroit 640 px", "#fbfaf7", "#2b2b2b", "#8a5a44", "Newsreader + Newsreader", "A");
add("Blog minimaliste", "Cahier", "notes courtes", "LT", 1, "aucune", "G", "minimal", "I", "T", "colonne de rubriques à gauche", "#f8f8f6", "#1c1c1c", "#2d6a4f", "Lora + DM Sans", "A");
add("Blog minimaliste", "Silence", "blog photo sobre", "ST", 1, "pleine largeur", "0", "minimal", "I", "-", "pile d'images, légende discrète", "#ffffff", "#111111", "#111111", "Instrument Serif + Inter", "A");
// 4 Blog professionnel
add("Blog professionnel", "Ressources", "blog d'entreprise", "G", 3, "haut 3:2", "0", "bandeau", "N", "CS", "grille nette, filtres en haut", "#ffffff", "#0f1f3d", "#2563eb", "Manrope + Inter", "A");
add("Blog professionnel", "Expert", "cabinet conseil", "LI", 1, "gauche carré", "D", "éditorial", "N", "C", "liste + encadré contact", "#f4f6fa", "#14213d", "#e09f3e", "Source Serif + Source Sans", "A");
add("Blog professionnel", "Étude de cas", "agence", "ZZ", 1, "alternée gauche/droite", "0", "centré", "M", "C", "zigzag image/texte", "#fffdf9", "#1e1e1e", "#ff6b35", "DM Serif Display + DM Sans", "A");
add("Blog professionnel", "Centre d'aide", "base de connaissances", "TB", 1, "aucune", "G", "bandeau", "N", "CS", "tableau titre/rubrique/date", "#ffffff", "#17202a", "#0ea5a4", "Inter + Inter", "B: tableau");
// 5 Technologie
add("Technologie", "Terminal", "blog de développeurs", "LT", 1, "aucune", "H", "minimal", "N", "T", "style console, étiquettes en pastilles", "#0b0f14", "#d6e2f0", "#39ff88", "JetBrains Mono + Inter", "A");
add("Technologie", "Lancement", "actualité produit", "G", 3, "haut 16:9", "0", "bandeau", "M", "C", "cartes à bordure lumineuse", "#0a0b1e", "#eef0ff", "#7c5cff", "Space Grotesk + Inter", "A");
add("Technologie", "Changelog", "journal de versions", "TL", 1, "aucune", "G", "minimal", "N", "S", "frise datée avec recherche", "#ffffff", "#0b1220", "#6d28d9", "Geist + Geist Mono", "B: frise");
add("Technologie", "Laboratoire", "veille techno", "MO", 4, "mixte", "0", "centré", "I", "T", "mosaïque de tailles mixtes", "#111827", "#f9fafb", "#22d3ee", "Sora + Inter", "B: mosaïque");
// 6 Économie
add("Économie", "Chiffres du jour", "magazine économique", "UB", 2, "haut 16:9", "D", "bandeau", "N", "C", "colonne de brèves chiffrées", "#fff9f0", "#1b1b1b", "#d97706", "Libre Franklin + Libre Baskerville", "A");
add("Économie", "Analyse", "revue d'analyses", "LD", 1, "droite carré", "0", "éditorial", "PS", "C", "titres longs, auteur en avant", "#f8f5ee", "#1f2937", "#9a3412", "Gelasio + Inter", "A");
add("Économie", "Dossier", "dossiers thématiques", "HG", 2, "haut 16:9", "H", "bandeau", "N", "C", "héros de dossier + sous-dossiers", "#ffffff", "#0f2a43", "#0f766e", "Roboto Slab + Roboto", "A");
add("Économie", "Marché", "veille sectorielle", "NU", 1, "aucune", "D", "minimal", "N", "S", "classement numéroté 1 à n", "#f3f4f6", "#111827", "#b91c1c", "Barlow Condensed + Barlow", "A");
// 7 Finance
add("Finance", "Rapport", "rapports annuels", "TB", 1, "aucune", "G", "bandeau", "N", "C", "tableau par année", "#ffffff", "#0b2545", "#13315c", "IBM Plex Serif + IBM Plex Sans", "B: tableau");
add("Finance", "Conseil patrimoine", "banque privée", "LI", 1, "gauche carré", "D", "éditorial", "N", "C", "teintes sobres, encadré contact", "#f5f1e8", "#1b2a1f", "#a68a3a", "Cormorant Garamond + Lato", "A");
add("Finance", "Bourse", "actualité boursière", "CH", 2, "petite vignette", "0", "minimal", "M", "CS", "cartes horizontales denses", "#0f172a", "#e2e8f0", "#22c55e", "Inter Tight + Inter", "A");
add("Finance", "Guide épargne", "pédagogie financière", "G", 3, "haut 3:2", "0", "centré", "N", "C", "grille douce, pictos de rubrique", "#eef7f3", "#12372a", "#16a34a", "Nunito + Nunito Sans", "A");
// 8 Mode
add("Mode", "Lookbook", "magazine de mode", "G", 4, "haut 4:5", "0", "centré", "M", "C", "grille de portraits, titres fins", "#fbf4f1", "#1a1a1a", "#b76e79", "Bodoni Moda + Jost", "A");
add("Mode", "Défilé", "actualités de collections", "FS", 1, "plein écran", "0", "minimal", "I", "-", "pleine page, légende en bas", "#000000", "#ffffff", "#ffffff", "Italiana + Montserrat", "B: image en fond");
add("Mode", "Carnet de style", "blog de style", "ZZ", 1, "alternée", "0", "centré", "N", "T", "zigzag aéré", "#fff8f5", "#2d1f1f", "#c26a5a", "Cormorant + Questrial", "A");
add("Mode", "Planche", "moodboard", "PO", 3, "carrée", "0", "minimal", "M", "T", "mur de fiches légèrement inclinées", "#f2e9e1", "#2b2220", "#8b5e3c", "Caveat + Poppins", "B: mur de fiches");
// 9 Photographie
add("Photographie", "Galerie", "photographe", "MO", 3, "mixte", "0", "minimal", "I", "C", "mosaïque sans texte, titre au survol", "#0e0e0e", "#f2f2f2", "#f2f2f2", "Syne + Inter", "B: mosaïque");
add("Photographie", "Série", "séries photo", "FS", 1, "plein écran", "0", "centré", "PS", "-", "une série par écran", "#151515", "#eeeeee", "#e8c547", "Bebas Neue + Karla", "B: image en fond");
add("Photographie", "Contact sheet", "planche contact", "G", 4, "carrée", "H", "minimal", "N", "T", "grille serrée, numéros de vue", "#f1f1ef", "#111111", "#e11d48", "Space Mono + Inter", "A");
add("Photographie", "Reportage", "photojournalisme", "UB", 2, "haut 3:2", "0", "bandeau", "M", "C", "une + vignettes, légendes", "#fafafa", "#0a0a0a", "#ff3b30", "Oswald + Source Sans", "A");
// 10 Voyage
add("Voyage", "Carnet de route", "blog de voyage", "HG", 3, "haut 3:2", "0", "bandeau", "M", "C", "héros destination + cartes", "#fff7ec", "#2a1b0f", "#e07a1f", "Pacifico + Lato", "A");
add("Voyage", "Destinations", "guide de destinations", "OV", 3, "en fond", "H", "centré", "N", "C", "carte image avec titre superposé", "#0e2a3a", "#f4f1e8", "#f2a541", "Playfair Display + Mulish", "B: image en fond");
add("Voyage", "Escale", "chroniques de voyage", "LI", 1, "gauche large", "D", "éditorial", "N", "T", "image large, méta lieu et date", "#f4efe6", "#1d2a2f", "#3a7d8c", "Libre Baskerville + Open Sans", "A");
add("Voyage", "Itinéraire", "récits d'itinéraires", "TL", 1, "petite vignette", "G", "minimal", "N", "S", "frise étapes", "#ffffff", "#17323d", "#00a896", "Fira Sans + Fira Sans", "B: frise");
// 11 Automobile
add("Automobile", "Essai", "essais de véhicules", "HG", 3, "haut 16:9", "0", "bandeau", "N", "C", "héros essai du jour + cartes", "#101215", "#f1f1f1", "#e63946", "Rajdhani + Roboto", "A");
add("Automobile", "Garage", "actualité auto", "CH", 2, "gauche large", "D", "minimal", "N", "CS", "cartes horizontales, fiche technique", "#f3f3f1", "#171717", "#d00000", "Archivo + Archivo", "A");
add("Automobile", "Concept car", "design automobile", "FS", 1, "plein écran", "0", "centré", "I", "-", "plein écran sombre", "#050505", "#fafafa", "#00b4d8", "Orbitron + Inter", "B: image en fond");
add("Automobile", "Comparatif", "comparatifs", "TB", 1, "aucune", "G", "bandeau", "N", "C", "tableau comparatif titre/date/note", "#ffffff", "#111827", "#1d4ed8", "Titillium Web + Roboto", "B: tableau");
// 12 Sport
add("Sport", "Match", "actualité sportive", "UB", 3, "haut 16:9", "D", "bandeau", "N", "C", "une + résultats récents", "#fefefe", "#0b132b", "#ff5400", "Anton + Roboto", "A");
add("Sport", "Vestiaire", "blog de club", "G", 3, "haut 3:2", "0", "bandeau", "M", "C", "grille énergique, étiquettes vives", "#0b132b", "#f8f9fa", "#fca311", "Barlow Condensed + Barlow", "A");
add("Sport", "Classement", "chroniques de saison", "NU", 1, "aucune", "D", "minimal", "N", "S", "numéros géants", "#f5f7fa", "#1a1a2e", "#e63946", "Bebas Neue + Inter", "A");
add("Sport", "Entraînement", "conseils d'entraînement", "CH", 2, "gauche carré", "0", "centré", "N", "T", "cartes horizontales + niveau", "#effaf3", "#102a1a", "#2dc653", "Saira + Saira", "A");
// 13 Gastronomie
add("Gastronomie", "Recettes", "blog culinaire", "G", 3, "haut 4:3", "0", "bandeau", "N", "CS", "cartes chaudes, temps de lecture", "#fff8ef", "#3b1f0e", "#c2410c", "Playfair Display + Nunito", "A");
add("Gastronomie", "Carte du jour", "restaurant", "LT", 1, "aucune", "0", "centré", "PS", "-", "style carte de restaurant, filets", "#faf3e6", "#2b1d12", "#8c2f1b", "Cormorant SC + EB Garamond", "A");
add("Gastronomie", "Marché", "produits de saison", "MO", 3, "mixte", "0", "centré", "M", "T", "mosaïque colorée", "#f6f3e8", "#23361f", "#6a994e", "Recoleta + DM Sans", "B: mosaïque");
add("Gastronomie", "Chef", "chroniques de chef", "ZZ", 1, "alternée", "G", "éditorial", "N", "C", "zigzag + fiche du chef", "#1a1613", "#f2e8d5", "#d4a373", "Cormorant + Lato", "A");
// 14 Santé et bien-être
add("Santé et bien-être", "Conseils", "blog santé", "G", 3, "haut 3:2", "0", "bandeau", "N", "C", "grille douce arrondie", "#f2f8f5", "#173a2e", "#2a9d8f", "Nunito + Nunito Sans", "A");
add("Santé et bien-être", "Parcours", "programmes", "LI", 1, "gauche rond", "D", "éditorial", "N", "C", "vignettes rondes", "#fdf6f0", "#3d2c24", "#e29578", "Lora + Mulish", "A");
add("Santé et bien-être", "Praticien", "cabinet médical", "LD", 1, "droite carré", "D", "éditorial", "PS", "-", "encadré rendez-vous", "#ffffff", "#0c3b5c", "#0b84a5", "Source Serif + Source Sans", "A");
add("Santé et bien-être", "Respirer", "méditation", "ST", 1, "pleine largeur", "0", "minimal", "I", "-", "pile espacée, texte centré", "#eef2ec", "#2f3e34", "#7a9e7e", "Cormorant + Quicksand", "A");
// 15 Culture
add("Culture", "Programme", "agenda culturel", "GM", 1, "gauche carré", "G", "bandeau", "N", "CS", "regroupé par mois", "#fff4e6", "#2b1a0e", "#d62828", "Abril Fatface + Work Sans", "B: regroupement par mois");
add("Culture", "Critique", "critiques", "LD", 1, "droite portrait", "D", "éditorial", "N", "C", "portraits d'œuvres", "#f6f1e9", "#201a14", "#7f1d1d", "Libre Caslon + Karla", "A");
add("Culture", "Théâtre", "scène et spectacles", "OV", 2, "en fond", "0", "centré", "M", "C", "affiches avec titre superposé", "#2a0a12", "#f9e7d2", "#e9b44c", "Cinzel + Lato", "B: image en fond");
add("Culture", "Médiathèque", "bibliothèque", "CH", 2, "gauche portrait", "G", "bandeau", "N", "CS", "fiches type livre", "#fafaf5", "#1b2b34", "#386fa4", "Crimson Pro + Inter", "A");
// 16 Art
add("Art", "Atelier", "artiste", "MO", 3, "mixte", "0", "minimal", "I", "T", "mosaïque d'œuvres", "#f4f1ec", "#121212", "#ff4d00", "Unbounded + Inter", "B: mosaïque");
add("Art", "Exposition", "galerie d'art", "G", 2, "haut libre", "H", "centré", "N", "C", "cartes sans bordure, cartels", "#ffffff", "#0d0d0d", "#0d0d0d", "Cormorant + Montserrat", "A");
add("Art", "Manifeste", "revue d'art", "TY", 1, "aucune", "0", "centré", "N", "-", "titres géants typographiques", "#e9e4d8", "#0a0a0a", "#ff3d00", "Bricolage Grotesque + Space Grotesk", "A");
add("Art", "Vernissage", "événements d'art", "PO", 3, "carrée", "0", "bandeau", "M", "C", "mur de fiches", "#fdecef", "#2c1a2e", "#9d4edd", "Fraunces + Outfit", "B: mur de fiches");
// 17 Architecture
add("Architecture", "Projets", "agence d'architecture", "GA", 3, "haut mixte", "0", "minimal", "N", "C", "grille asymétrique 2/1", "#efefec", "#131313", "#c1440e", "Archivo Narrow + Archivo", "A");
add("Architecture", "Plans", "études techniques", "TB", 1, "aucune", "G", "bandeau", "N", "CS", "tableau projet/lieu/année", "#f7f7f5", "#1a1a1a", "#264653", "IBM Plex Mono + IBM Plex Sans", "B: tableau");
add("Architecture", "Façade", "réalisations", "FS", 1, "plein écran", "0", "minimal", "I", "-", "une réalisation par écran", "#d8d6d0", "#111111", "#111111", "Syncopate + Inter", "B: image en fond");
add("Architecture", "Chantier", "journal de chantier", "TL", 1, "petite vignette", "D", "éditorial", "N", "C", "frise par phase", "#ffffff", "#2b2d42", "#ef8354", "Barlow + Barlow Semi Condensed", "B: frise");
// 18 Immobilier
add("Immobilier", "Actualités du marché", "agence immobilière", "UB", 2, "haut 3:2", "D", "bandeau", "N", "C", "une + brèves + contact", "#ffffff", "#17324d", "#d4a017", "Poppins + Open Sans", "A");
add("Immobilier", "Guide de l'acheteur", "conseils", "G", 3, "haut 3:2", "0", "centré", "N", "C", "cartes nettes, pictos", "#f0f7fa", "#14323f", "#0e7490", "Outfit + Inter", "A");
add("Immobilier", "Quartiers", "guides de quartiers", "OV", 3, "en fond", "H", "bandeau", "M", "C", "cartes quartier superposées", "#12263a", "#f5f1e6", "#f4a261", "Lora + Mulish", "B: image en fond");
add("Immobilier", "Investir", "investissement", "LT", 1, "aucune", "G", "éditorial", "N", "CS", "texte seul, rubriques à gauche", "#faf8f3", "#1f2a1f", "#386641", "Merriweather + Lato", "A");
// 19 Éducation
add("Éducation", "Cours", "école / formation", "G", 3, "haut 3:2", "0", "bandeau", "N", "C", "grille lumineuse, niveau", "#ffffff", "#0f3d3a", "#f59e0b", "Baloo 2 + Nunito", "A");
add("Éducation", "Campus", "vie étudiante", "UB", 2, "haut 16:9", "D", "éditorial", "M", "C", "une + agenda court", "#f3f6ff", "#1a2a6c", "#fb8500", "Poppins + Poppins", "A");
add("Éducation", "Leçon du jour", "pédagogie", "LI", 1, "gauche carré", "G", "minimal", "N", "T", "liste claire, niveau et durée", "#fffcf0", "#2f3e46", "#52b788", "Atkinson Hyperlegible + Atkinson Hyperlegible", "A");
add("Éducation", "Bibliothèque", "ressources", "CH", 2, "gauche petite", "0", "bandeau", "N", "CS", "fiches ressources compactes", "#f8f9fa", "#212529", "#6930c3", "Lexend + Lexend", "A");
// 20 Science et recherche
add("Science et recherche", "Publication", "laboratoire", "IX", 1, "aucune", "G", "bandeau", "N", "CS", "index daté, auteurs en avant", "#ffffff", "#0b3954", "#087e8b", "Source Serif + Source Sans", "A");
add("Science et recherche", "Revue", "revue scientifique", "CJ", 2, "aucune", "D", "éditorial", "N", "C", "deux colonnes denses", "#fbfbf8", "#1c1c1c", "#9b2226", "STIX Two Text + Inter", "A");
add("Science et recherche", "Découverte", "vulgarisation", "HG", 3, "haut 16:9", "0", "bandeau", "M", "C", "héros + cartes colorées", "#0b1d3a", "#f1faee", "#ffb703", "Chivo + Chivo", "A");
add("Science et recherche", "Archives ouvertes", "dépôt de travaux", "GM", 1, "aucune", "G", "minimal", "N", "S", "regroupé par année", "#f4f4f2", "#111111", "#264653", "IBM Plex Serif + IBM Plex Mono", "B: regroupement par année");
// 21 Entreprise et marketing
add("Entreprise et marketing", "Communiqués", "relations presse", "TB", 1, "aucune", "D", "minimal", "N", "S", "tableau date/titre", "#ffffff", "#1a1a2e", "#16213e", "Inter + Inter", "B: tableau");
add("Entreprise et marketing", "Actualités société", "entreprise", "G", 3, "haut 16:9", "0", "bandeau", "N", "C", "sobre, encadré contact", "#f5f7fa", "#1b263b", "#415a77", "Public Sans + Public Sans", "A");
add("Entreprise et marketing", "Campagne", "agence marketing", "MO", 3, "mixte", "0", "centré", "M", "T", "mosaïque vive", "#fff1e6", "#2b2d42", "#ef233c", "Syne + DM Sans", "B: mosaïque");
add("Entreprise et marketing", "Témoignages", "preuves clients", "ST", 1, "pleine largeur", "0", "centré", "N", "-", "pile de grandes fiches", "#eaf4f4", "#073b4c", "#06d6a0", "Fraunces + Inter", "A");
// 22 Actualités et divertissement
add("Actualités et divertissement", "Buzz", "divertissement", "G", 4, "haut 1:1", "0", "bandeau", "I", "T", "grille dense vive", "#fff200", "#111111", "#ff006e", "Bowlby One + Rubik", "A");
add("Actualités et divertissement", "Cinéma", "actualité cinéma", "LD", 1, "droite portrait", "D", "éditorial", "N", "C", "affiches portrait", "#14080e", "#f6e9d7", "#e0a458", "Playfair Display + Raleway", "A");
add("Actualités et divertissement", "Musique", "chroniques musicales", "CR", 3, "carrée", "0", "minimal", "M", "C", "bandes défilantes par rubrique", "#1b1b3a", "#f0e6ff", "#ff7bff", "Rubik + Inter", "B: bandes défilantes");
add("Actualités et divertissement", "Jeux", "actualité jeux vidéo", "HG", 3, "haut 16:9", "H", "bandeau", "M", "CS", "héros + cartes néon", "#0d0221", "#eaeaff", "#00f5d4", "Press Start 2P + Inter", "A");
// 23 Communauté
add("Communauté", "Assemblée", "association", "UB", 2, "haut 3:2", "D", "éditorial", "N", "C", "une + appel à agir", "#fffbea", "#3b2a08", "#c2410c", "Merriweather + Nunito", "A");
add("Communauté", "Voisins", "vie locale", "CH", 2, "gauche carré", "G", "bandeau", "N", "CS", "fiches chaleureuses", "#f1f8f0", "#1f3a1f", "#588157", "Nunito + Nunito", "A");
add("Communauté", "Témoignage", "récits de membres", "ZZ", 1, "alternée rond", "0", "centré", "M", "-", "portraits ronds, citation", "#fdf0e6", "#3a1f10", "#e76f51", "Lora + Poppins", "A");
add("Communauté", "Forum des idées", "billets de membres", "NU", 1, "aucune", "D", "minimal", "N", "S", "classement numéroté", "#f4f1fb", "#241e3b", "#7b2cbf", "DM Sans + DM Sans", "A");
// 24 Formations et portfolios
add("Formations et portfolios", "Catalogue", "organisme de formation", "G", 3, "haut 16:9", "H", "bandeau", "N", "CS", "grille + filtres rubriques/recherche", "#ffffff", "#0b3c5d", "#f2a900", "Montserrat + Open Sans", "A");
add("Formations et portfolios", "Projets clients", "freelance", "GA", 3, "haut mixte", "0", "minimal", "M", "C", "grille asymétrique", "#f6f4ef", "#111111", "#111111", "Space Grotesk + Inter", "A");
add("Formations et portfolios", "Études de cas", "agence", "SP", 1, "droite large", "G", "bandeau", "N", "C", "titre fixe à gauche, liste qui défile", "#0f0f0f", "#f5f5f5", "#c6ff3d", "Anton + Inter", "B: colonne fixe");
add("Formations et portfolios", "Parcours", "cursus", "TL", 1, "petite vignette", "D", "éditorial", "N", "C", "frise par étape", "#f0f9ff", "#0c4a6e", "#0284c7", "Poppins + Inter", "B: frise");
// 25 Éditorial expérimental
add("Éditorial expérimental", "Affiche", "revue indépendante", "TY", 1, "aucune", "0", "minimal", "N", "-", "titres démesurés en pleine largeur", "#f2ede4", "#0a0a0a", "#ff2e00", "Anton + Space Mono", "A");
add("Éditorial expérimental", "Collage", "zine", "PO", 3, "mixte", "0", "centré", "M", "T", "mur de fiches décalées", "#ffe8d6", "#1d1d1d", "#6a4c93", "Rubik Mono One + Karla", "B: mur de fiches");
add("Éditorial expérimental", "Index vivant", "carnet de recherche", "IX", 1, "aucune", "G", "minimal", "I", "T", "index serré, étiquettes en marge", "#0a0a0a", "#e8e8e8", "#ffd60a", "Space Mono + Space Mono", "A");
add("Éditorial expérimental", "Mur", "mur d'idées", "PO", 4, "carrée", "0", "bandeau", "M", "CS", "mur de fiches filtrable", "#e0f2f1", "#102a2c", "#ff7043", "Bricolage Grotesque + Inter", "B: mur de fiches");
// Corrections après le premier contrôle de diversité (doublons de structure et de noms détectés par check.js)
const fix = (n, o) => { const k = { nom: 1, comp: 3, cols: 4, img: 5, barre: 6, tete: 7, nav: 8, filtre: 9, part: 10 }; for (const [f, v] of Object.entries(o)) C[n - 1][k[f]] = v; };
fix(41, { comp: "LD", cols: 1, img: "droite large", barre: "D", nav: "PS", filtre: "CS", part: "grande photo à droite, fiche note" });
fix(30, { nav: "PS", tete: "centré", filtre: "C" });
fix(67, { nav: "N", tete: "bandeau", filtre: "T" });
fix(56, { nav: "PS", tete: "centré", img: "large 2:1", filtre: "T" });
fix(26, { img: "gauche portrait", barre: "G", nav: "PS", tete: "centré" });
fix(66, { barre: "D", filtre: "T", tete: "minimal" });
fix(24, { nom: "Cours du marché" });
fix(47, { barre: "G", tete: "bandeau", nav: "I" });
fix(92, { barre: "0", tete: "centré", filtre: "T", nav: "M" });
fix(44, { barre: "H", tete: "minimal", filtre: "S" });
fix(70, { cols: 2, img: "haut 16:9", barre: "G", nav: "M" });
fix(51, { nom: "Halles" });
fix(83, { cols: 4, tete: "bandeau", nav: "I", filtre: "C" });
fix(73, { cols: 4, img: "haut 1:1", barre: "H", filtre: "S" });
fix(86, { img: "gauche portrait", barre: "G", nav: "M", tete: "centré" });
fix(96, { nom: "Cursus", barre: "G", tete: "minimal", nav: "M" });
const slug = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Libellés exacts de ce que chaque composition fait réellement dans le moteur (ni regroupement par mois, ni zigzag alterné, ni numérotation : voir docs)
const PART = { GM: "index daté, dates en marge", NU: "classé par nombre de lectures", ZZ: "grandes vignettes, filets entre les lignes", TL: "frise verticale datée", PO: "fiches cadrées type polaroïd", MS: "à la une, plus lus, tous les articles" };
module.exports = C.map((a, i) => ({ n: i + 1, key: `${slug(a[0])}.${slug(a[1])}`, famKey: slug(a[0]), fam: a[0], nom: a[1], usage: a[2], comp: a[3], cols: a[4], img: a[5], barre: a[6], tete: a[7], nav: a[8], filtre: a[9], part: PART[a[3]] || a[10], bg: a[11], ink: a[12], acc: a[13], fonts: a[14], faisab: a[15] }));
