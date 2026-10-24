// Hôtels, tourisme et voyages (8 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs ; hébergements et séjours présentés à titre d'exemple.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];

module.exports = [
  // 1. COMPAGNIE DES CAPS — voyages organisés, affiche
  {
    key: "compagnie-des-caps", name: "Compagnie des Caps", category: "tourisme", tags: ["audacieux", "classique"], siteType: "Voyagiste et croisières",
    description: "Voyagiste à l'affiche : grand titre en capitales sur fond bleu marine, jaune soleil, serif Abril Fatface et circuits présentés comme des destinations à ne pas manquer.",
    brand: "Compagnie des Caps",
    tokens: { colors: { primary: "#0e5a8a", secondary: "#0a2e48", accent: "#e8a317", background: "#fdf6e9", surface: "#fffdf7", text: "#1a2a3a", muted: "#55606b" }, fonts: { heading: "font.abril-fatface", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.02, letterSpacing: -0.01 } } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "compagnie-des-caps", motifs: ["waves", "mountains", "rays"] },
    head: ["head:topbar", { info: "Voyages en groupe et sur mesure · 02 98 00 14 65", note: "Départs garantis dès 6 participants" }], foot: ["foot:columns", { about: "Voyagiste indépendant : circuits accompagnés, croisières et séjours sur mesure vers quarante destinations.", cols: [["Voyager", "Circuits", "Croisières", "Sur mesure"], ["Agence", "Conseils", "Contact", "Conditions"]] }],
    menu: [["Accueil", "/"], ["Circuits", "/circuits"], ["Croisières", "/croisieres"], ["Sur mesure", "/sur-mesure"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "14 quai des Armateurs, 29200 Brest", phone: "02 98 00 14 65", email: "voyages@compagniedescaps.example", hours: "Du lundi au samedi, 9 h 30 – 18 h 30", tagline: "Des voyages écrits à plusieurs mains." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Circuits · Croisières · Sur mesure", title: "Cap sur l'ailleurs.", sub: "Quarante destinations, des accompagnateurs passionnés et des groupes à taille humaine : partez l'esprit libre.", cta: ["Voir les circuits", "/circuits"], cta2: ["Demander un devis", "/contact"] }],
        ["gal:cards", { eyebrow: "Au départ cet hiver", title: "Trois voyages à la une", items: [{ t: "Islande, feux et glaces", tag: "9 jours", x: "Geysers, aurores boréales et lagons chauds. Dès 3 290 €." }, { t: "Cap-Vert, escales atlantiques", tag: "10 jours", x: "Trois îles à la voile. Dès 2 480 €." }, { t: "Japon, de Tokyo à Kyoto", tag: "12 jours", x: "Temples, trains et cuisine. Dès 4 150 €." }] }],
        ["proof:statsbar", { items: [["40", "destinations"], ["1 200", "voyageurs par an (exemple)"], ["25 ans", "d'expérience"]] }],
        ["feat:alt", { title: "Voyager avec nous", items: [{ t: "Des groupes de douze maximum", x: "Parce qu'un voyage se vit mieux à petite échelle.", link: ["Nos circuits", "/circuits"] }, { t: "Des conseillers qui connaissent le terrain", x: "Chaque itinéraire est testé par nos équipes avant publication." }] }],
        ["proof:quotes", { title: "Carnets de voyageurs", items: [{ q: "Un circuit parfaitement rythmé, un guide formidable.", n: "Sylvie D.", r: "cliente fictive" }, { q: "Les escales du Cap-Vert resteront gravées.", n: "Yves M.", r: "client fictif" }, { q: "Sérieux, humain, attentif aux détails.", n: "Hélène C.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Votre prochain voyage commence ici.", sub: "Un conseiller vous rappelle sous 24 heures.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "circuits", name: "Circuits", blocks: [
        ph("Circuits accompagnés", "Départs garantis, hébergements sélectionnés."),
        ["gal:listings", { title: "À partir de 2 480 € par personne", items: [{ t: "Islande, feux et glaces", tag: "9 jours", price: "3 290 €", x: "Guide francophone, vols inclus, hébergement en lodges." }, { t: "Pérou, Machu Picchu et Vallée sacrée", tag: "13 jours", price: "3 790 €", x: "Trains panoramiques, marchés et sites incas." }, { t: "Japon, Tokyo à Kyoto", tag: "12 jours", price: "4 150 €", x: "Pass ferroviaire inclus, ryokan une nuit." }] }],
        ["feat:checks", { eyebrow: "Dans nos prix", title: "Ce qui est inclus", items: [{ t: "Vols internationaux et transferts" }, { t: "Hébergements de charme" }, { t: "Accompagnateur francophone" }, { t: "Assistance voyage 24 h/24" }, { t: "Pourboires locaux inclus" }], cta: ["Demander un devis", "/contact"] }],
        ["cta:split", { title: "Une date vous convient ?", sub: "Nous vous envoyons le programme détaillé.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "croisieres", name: "Croisières", blocks: [
        ph("Croisières et voiliers", "Quelques îles, beaucoup d'horizon."),
        ["feat:tabs", { title: "Nos formules", items: [{ t: "Voilier de charme", x: "Huit cabines, un équipage de six, escales sur la côte atlantique." }, { t: "Fluviale", x: "Péniche confortable sur la Loire et le Douro, vélos à bord." }, { t: "Grande croisière", x: "Navire de 600 passagers vers la Méditerranée orientale." }] }],
        ["feat:steps", { title: "Une journée à bord", items: [{ t: "Petit déjeuner en terrasse", x: "Vue sur l'escale du jour.", d: "8 h" }, { t: "Excursion", x: "Visite guidée ou baignade.", d: "10 h" }, { t: "Navigation", x: "Cap sur l'île suivante.", d: "16 h" }, { t: "Dîner de l'équipage", x: "Poisson du port et soirée musicale.", d: "20 h" }] }],
        ["cta:card", { title: "Date et cabine disponibles", sub: "Réservez avec 20 % d'acompte (démonstration).", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "sur-mesure", name: "Sur mesure", blocks: [
        ph("Voyages sur mesure", "Un itinéraire écrit pour vous."),
        ["feat:rows", { title: "Comment ça se passe", items: [{ t: "Un premier échange", x: "Dates, envies, budget et rythme." }, { t: "Une proposition", x: "Itinéraire détaillé, hébergements, transports, prix." }, { t: "Des ajustements", x: "Jusqu'à ce que le voyage vous ressemble." }, { t: "Votre départ", x: "Carnet de voyage numérique et assistance sur place." }] }],
        ["misc:faq", { items: [{ t: "À partir de quel budget ?", x: "Comptez 150 € par jour et par personne, hors vols." }, { t: "Puis-je voyager en famille ?", x: "Oui, nous composons des programmes adaptés aux enfants." }, { t: "Y a-t-il une assurance ?", x: "Nous proposons une assurance annulation en option." }] }],
        ["cta:band", { title: "Racontez-nous votre voyage idéal.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Notre agence vous reçoit sur rendez-vous."),
        ["contact:info", { title: "Parlons de votre voyage", formTitle: "Votre projet", formIntro: "Destination, dates, nombre de voyageurs.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "14 quai des Armateurs, 29200 Brest" }],
      ] },
    ],
  },

  // 2. VILLA LUMIÈRE — hôtel de luxe
  {
    key: "villa-lumiere", name: "Villa Lumière", category: "tourisme", tags: ["luxe", "editorial"], siteType: "Hôtel de luxe",
    description: "Hôtel de luxe feutré : ivoire, bronze et noir chaud, serif Prata, grands visuels plein cadre, chambres en annonces et appel à l'action sur image.",
    brand: "Villa Lumière",
    tokens: { colors: { primary: "#8a6d3b", secondary: "#2a2622", accent: "#b8895a", background: "#faf7f2", surface: "#ffffff", text: "#2a2622", muted: "#675f56" }, fonts: { heading: "font.prata", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.1, letterSpacing: 0 }, h2: { size: 36, weight: 400, lineHeight: 1.2, letterSpacing: 0 } }, buttons: { paddingY: 15, paddingX: 36 }, border: { width: 1, color: "#e5ddd0" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "villa-lumiere", motifs: ["arches", "bokeh", "mesh"] },
    head: ["head:center", {}], foot: ["foot:big", { title: "VILLA LUMIÈRE" }],
    menu: [["Accueil", "/"], ["Chambres et suites", "/chambres"], ["Spa et table", "/spa"], ["Événements", "/evenements"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "1 chemin du Cap, 06230 Saint-Jean-Cap-Ferrat", phone: "04 93 00 18 90", email: "reservation@villalumiere.example", hours: "Réception ouverte 24 h/24, 7 j/7", tagline: "Quinze chambres face à la mer." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Hôtel 5 étoiles · Côte d'Azur", title: "La lumière, en héritage.", sub: "Une villa de 1912, quinze chambres, un jardin d'oliviers et la Méditerranée pour seul horizon.", cta: ["Réserver votre séjour", "/reserver"], cta2: ["Découvrir les chambres", "/chambres"], overlay: "#1c1612a0" }],
        ["feat:alt", { eyebrow: "L'art de recevoir", title: "Deux expériences signature", items: [{ t: "Le petit déjeuner sur la terrasse", x: "Pains chauds, confitures d'agrumes et œufs du jardin, face à la baie.", link: ["Voir la table", "/spa"] }, { t: "Le spa de la villa", x: "Soins signature, hammam de marbre et bassin chauffé à 30 °C.", link: ["Découvrir le spa", "/spa"] }] }],
        ["gal:listings", { eyebrow: "Chambres et suites", title: "Choisir son refuge", items: [{ t: "Chambre Jardin", tag: "32 m²", price: "à partir de 420 €", x: "Terrasse sur les oliviers." }, { t: "Suite Baie", tag: "58 m²", price: "à partir de 790 €", x: "Vue mer, baignoire îlot." }, { t: "Villa du Cap", tag: "120 m²", price: "à partir de 1 650 €", x: "Piscine privée, majordome." }] }],
        ["proof:big", { items: [{ q: "Un séjour hors du temps : la lumière change à chaque heure.", n: "Madeleine V.", r: "cliente fictive" }] }],
        ["cta:image", { title: "Une escapade de trois nuits ?", sub: "Petit déjeuner, soin du spa et dîner offerts pour tout séjour de trois nuits en semaine.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "chambres", name: "Chambres et suites", blocks: [
        ph("Chambres et suites", "Quinze lieux, quinze atmosphères."),
        ["gal:listings", { title: "Nos hébergements", items: [{ t: "Chambre Jardin", tag: "32 m²", price: "420 €", x: "Lit king size, terrasse privée." }, { t: "Chambre Terrasse", tag: "40 m²", price: "560 €", x: "Vue partielle mer, salon." }, { t: "Suite Baie", tag: "58 m²", price: "790 €", x: "Vue mer panoramique." }, { t: "Suite Oliviers", tag: "64 m²", price: "880 €", x: "Deux chambres, jardin privatif." }, { t: "Suite Phare", tag: "75 m²", price: "1 100 €", x: "Terrasse sur le toit." }, { t: "Villa du Cap", tag: "120 m²", price: "1 650 €", x: "Piscine, majordome." }] }],
        ["feat:list2", { title: "Inclus dans chaque chambre", items: [{ t: "Petit déjeuner à la carte" }, { t: "Wifi très haut débit" }, { t: "Literie de grande marque (fictive)" }, { t: "Minibar offert" }, { t: "Accès au spa" }, { t: "Navette vers le port" }] }],
        ["cta:band", { title: "Un anniversaire, une demande ?", sub: "Notre conciergerie compose votre séjour sur mesure.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "spa", name: "Spa et table", blocks: [
        ph("Spa et table", "Se délasser, puis se régaler."),
        ["feat:icons", { title: "Le spa", items: [{ icon: "sparkles", t: "Soins signature", x: "Massage aux huiles d'olive et de lavande, 60 minutes." }, { icon: "moon", t: "Hammam de marbre", x: "Vapeur douce, thé à la menthe." }, { icon: "sun", t: "Bassin chauffé", x: "Trente degrés toute l'année." }] }],
        ["misc:menu", { title: "La table de la villa", left: ["Midi", [{ t: "Carpaccio de daurade", x: "Agrumes et fenouil", price: "24 €" }, { t: "Pâtes aux palourdes", x: "Piment doux", price: "28 €" }]], right: ["Soir", [{ t: "Loup de ligne", x: "Barigoule d'artichauts", price: "46 €" }, { t: "Agneau de Sisteron", x: "Cuit au sarment", price: "52 €" }]] }],
        ["cta:card", { title: "Réservez un soin", sub: "Un rendez-vous au spa se prend à l'arrivée ou en ligne.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "evenements", name: "Événements", blocks: [
        ph("Événements", "Mariages intimes, séminaires, anniversaires."),
        ["feat:bento", { title: "Vos plus beaux jours", items: [{ t: "Mariages", x: "Cérémonie dans le jardin, dîner sous les étoiles jusqu'à 80 invités.", icon: "heart" }, { t: "Séminaires", x: "Salle de 40 places, vue mer.", icon: "briefcase" }, { t: "Anniversaires", x: "Table privée, menu dégustation.", icon: "star" }] }],
        ["proof:stats", { items: [["80", "invités maximum"], ["3", "salons privatifs"], ["15", "chambres sur place"]] }],
        ["cta:split", { title: "Concevons votre événement.", sub: "Notre équipe vous répond sous 48 h.", cta: ["Demander un devis", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Réception ouverte jour et nuit."),
        ["contact:cards", { title: "Réserver votre séjour", cta: ["Envoyer", "/reserver"] }],
        ["contact:map", { title: "Saint-Jean-Cap-Ferrat", mapAddress: "1 chemin du Cap, 06230 Saint-Jean-Cap-Ferrat" }],
      ] },
    ],
  },

  // 3. GÎTE DES CIMES — refuge de montagne
  {
    key: "gite-des-cimes", name: "Gîte des Cimes", category: "tourisme", tags: ["chaleureux", "naturel"], siteType: "Gîte et refuge de montagne",
    description: "Refuge de montagne accueillant : bois, mousse et braise, serif Fraunces, coches pratiques, chronologie d'un week-end et tarifs de saison en toute simplicité.",
    brand: "Gîte des Cimes",
    tokens: { colors: { primary: "#7a3b1d", secondary: "#2f3b2a", accent: "#d98e32", background: "#f7f3ec", surface: "#fffdf8", text: "#2a2a22", muted: "#5f5f52" }, fonts: { heading: "font.fraunces", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e1d8c6" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "gite-des-cimes", motifs: ["mountains", "topo", "dunes"] },
    head: ["head:bar", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Hébergement", "/hebergement"], ["Activités", "/activites"], ["Tarifs et accès", "/tarifs"], ["Contact", "/contact"]], cta: ["Réserver", "/contact"],
    contact: { address: "Hameau des Cimes, 73440 Saint-Martin-de-Belleville", phone: "04 79 00 24 18", email: "gite@gitedescimes.example", hours: "Accueil de 16 h à 19 h ; ouvert de décembre à avril et de juin à octobre", tagline: "Poêle à bois, repas du terroir, étoiles." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Savoie · 1 750 m d'altitude", title: "Le refuge où l'on se sent chez soi.", sub: "Dortoirs cosy, chambres familiales, soupe fumante et poêle à bois : posez vos sacs, le sentier peut attendre demain.", cta: ["Voir l'hébergement", "/hebergement"], cta2: ["Réserver", "/contact"] }],
        ["feat:checks", { eyebrow: "Sur place", title: "Tout ce qu'il faut après la marche", items: [{ t: "Dîner du terroir et petit déjeuner copieux" }, { t: "Séchoir à chaussures et local à skis" }, { t: "Sauna en bois chauffé au feu" }, { t: "Panier-repas pour les randonnées" }, { t: "Wifi uniquement dans le salon" }], cta: ["Réserver", "/contact"] }],
        ["feat:steps", { title: "Un week-end au gîte", items: [{ t: "Arrivée", x: "Thé chaud et visite du refuge.", d: "Vendredi" }, { t: "Grande boucle", x: "Randonnée ou raquettes, panier fourni.", d: "Samedi" }, { t: "Veillée", x: "Tartiflette, jeux de société et ciel étoilé.", d: "Samedi soir" }, { t: "Départ", x: "Petit déjeuner au soleil.", d: "Dimanche" }] }],
        ["gal:wall", { items: [{ t: "Le salon" }, { t: "Le sauna" }, { t: "Les chambres" }, { t: "La vue" }] }],
        ["proof:quotes", { title: "Mot du livre d'or", items: [{ q: "Une ambiance chaleureuse, un repas de montagne comme on les aime.", n: "Famille Garnier", r: "clients fictifs" }, { q: "Le sauna après la randonnée, un bonheur.", n: "Thibault L.", r: "client fictif" }, { q: "Parfait avec les enfants.", n: "Nadia F.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Les week-ends d'hiver partent vite.", sub: "Réservez dès l'ouverture du calendrier.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "hebergement", name: "Hébergement", blocks: [
        ph("L'hébergement", "Quarante couchages, du dortoir à la chambre familiale."),
        ["gal:listings", { title: "Où dormir", items: [{ t: "Dortoir de 6", tag: "Lits superposés", price: "38 € / pers.", x: "Draps fournis, casiers individuels." }, { t: "Chambre double", tag: "2 pers.", price: "92 € / nuit", x: "Salle d'eau privative." }, { t: "Chambre famille", tag: "4 pers.", price: "148 € / nuit", x: "Lits superposés et lit double." }] }],
        ["feat:pricelist", { title: "Demi-pension", items: [{ t: "Adulte (dîner + petit déjeuner)", x: "Hébergement non compris", price: "36 €" }, { t: "Enfant moins de 12 ans", price: "22 €" }, { t: "Panier-repas", price: "10 €" }, { t: "Sauna, 1 h", price: "12 €" }] }],
        ["cta:split", { title: "Besoin d'un groupe ?", sub: "Privatisation possible dès vingt personnes.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "activites", name: "Activités", blocks: [
        ph("Activités", "Marcher, glisser, observer."),
        ["feat:tabs", { title: "Selon la saison", items: [{ t: "Hiver", x: "Raquettes, ski de randonnée avec guide, luge à 300 m du gîte." }, { t: "Printemps", x: "Sorties botaniques, observation des marmottes, balades fleuries." }, { t: "Été", x: "Randonnée sur le GR, via ferrata, baignade au lac de montagne." }] }],
        ["gal:cards", { title: "Nos coups de cœur", items: [{ t: "Lac du Plan", tag: "3 h", x: "Boucle familiale, 280 m de dénivelé." }, { t: "Col des Rousses", tag: "5 h", x: "Panorama sur le massif." }, { t: "Cascade Blanche", tag: "2 h", x: "Chemin ombragé, glace en hiver." }] }],
        ["cta:band", { title: "Un accompagnateur pour votre sortie ?", sub: "Nous vous mettons en relation avec un guide diplômé (démonstration).", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs et accès", blocks: [
        ph("Tarifs et accès"),
        ["feat:compare", { title: "Basse et haute saison", rows: [["", "Basse saison", "Haute saison"], ["Dortoir", "34 €", "38 €"], ["Chambre double", "82 €", "92 €"], ["Chambre famille", "128 €", "148 €"], ["Demi-pension adulte", "34 €", "36 €"]] }],
        ["misc:faq", { title: "Avant de partir", items: [{ t: "Comment arriver ?", x: "Parking à 800 m du gîte, navette de bagages en hiver." }, { t: "Acceptez-vous les animaux ?", x: "Oui, dans les chambres doubles uniquement." }, { t: "Y a-t-il du réseau mobile ?", x: "Faible : prévenez vos proches avant de monter." }] }],
        ["cta:card", { title: "Un doute ? Appelez-nous.", sub: "On vous répond le soir, après le service.", cta: ["Appeler", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Réservation, groupes, renseignements."),
        ["contact:info", { title: "Écrire au gîte", formTitle: "Votre demande", formIntro: "Dates, nombre de personnes, besoin de demi-pension.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Ouverture", rows: [["Hiver", "Décembre – avril"], ["Été", "Juin – octobre"], ["Accueil", "16 h – 19 h"]] }],
      ] },
    ],
  },

  // 4. TREK SAUVAGE — aventure, sombre
  {
    key: "trek-sauvage", name: "Trek Sauvage", category: "tourisme", tags: ["sombre", "audacieux"], siteType: "Agence d'aventure et trek",
    description: "Agence de trek et d'aventure en mode nuit : noir ardoise, orange signal, capitales condensées, bandeau à rechercher, programmes à onglets et chiffres bruts.",
    brand: "Trek Sauvage",
    tokens: { colors: { primary: "#ff7a1a", secondary: "#0a1013", accent: "#5fd0c0", background: "#10181c", surface: "#18232a", text: "#eaf1f2", muted: "#9fb2b8" }, fonts: { heading: "font.barlow-condensed", body: "font.inter", button: "font.barlow-condensed", link: "font.inter" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 68, weight: 700, lineHeight: 1.0, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 42, weight: 700, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" } }, buttons: { paddingY: 14, paddingX: 30 } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "trek-sauvage", motifs: ["mountains", "topo", "halftone"] },
    head: ["head:minimal", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Treks", "/treks"], ["Expéditions", "/expeditions"], ["Équipement", "/equipement"], ["Contact", "/contact"]], cta: ["Choisir un trek", "/treks"],
    contact: { address: "27 rue des Alpinistes, 38700 La Tronche", phone: "04 76 00 98 76", email: "depart@treksauvage.example", hours: "Du lundi au vendredi, 9 h – 17 h", tagline: "Les itinéraires qui demandent un peu de cran." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Trek · Alpinisme · Expéditions", title: "L'aventure ne se réserve pas à moitié.", sub: "Des itinéraires engagés, des guides diplômés et des groupes de huit au maximum.", placeholder: "Rechercher un trek, un massif, un pays…", overlay: "#0a1013aa" }],
        ["proof:stats", { title: "En chiffres", items: [["60", "itinéraires"], ["8", "participants maximum"], ["14", "guides diplômés"], ["22 ans", "d'expérience"]] }],
        ["feat:tabs", { eyebrow: "Nos univers", title: "Choisissez votre terrain", items: [{ t: "Haute montagne", x: "Traversées glaciaires, ascensions de 4 000 m, nuits en refuge d'altitude." }, { t: "Désert", x: "Marche en autonomie dans les dunes du Sahara, bivouacs à la belle étoile." }, { t: "Forêts et volcans", x: "Treks tropicaux, ascensions de cratères et nuits sous tente." }] }],
        ["gal:masonry", { title: "Depuis le sac à dos", items: [{ t: "Aube au col" }, { t: "Bivouac" }, { t: "Traversée" }, { t: "Cordée" }, { t: "Feu du soir" }, { t: "Sommet" }] }],
        ["cta:image", { title: "Votre prochain défi commence ici.", sub: "Trek en groupe ou départ privé : parlez-nous de votre niveau.", cta: ["Demander un programme", "/contact"] }],
      ] },
      { key: "treks", name: "Treks", blocks: [
        ph("Nos treks", "Classés selon l'engagement et le dénivelé."),
        ["gal:listings", { title: "Départs de la saison", items: [{ t: "Tour du Mont-Blanc", tag: "Difficile", price: "1 190 €", x: "8 jours, 170 km, hébergement en refuge." }, { t: "Traversée du Hoggar", tag: "Engagé", price: "2 250 €", x: "12 jours dans le désert, avec chameliers." }, { t: "Volcans d'Islande", tag: "Modéré", price: "1 780 €", x: "7 jours, lodges et sources chaudes." }] }],
        ["feat:rows", { title: "Choisir son niveau", items: [{ t: "Modéré", x: "4 à 6 heures de marche par jour, 500 m de dénivelé positif." }, { t: "Difficile", x: "6 à 8 heures par jour, 900 m de dénivelé, terrain technique par endroits." }, { t: "Engagé", x: "Altitude, autonomie, conditions météo changeantes. Expérience requise." }] }],
        ["cta:band", { title: "Besoin d'un conseil sur le niveau ?", sub: "Un guide vous rappelle sous 48 h.", cta: ["Parler à un guide", "/contact"] }],
      ] },
      { key: "expeditions", name: "Expéditions", blocks: [
        ph("Expéditions", "Pour aller plus loin, plus haut, plus longtemps."),
        ["feat:steps", { eyebrow: "Préparation", title: "De l'idée au sommet", items: [{ t: "Bilan", x: "Entretien de niveau et de motivation.", d: "6 mois" }, { t: "Entraînement", x: "Programme personnalisé, sorties d'entraînement.", d: "3 mois" }, { t: "Départ", x: "Voyage groupé, acclimatation, ascension.", d: "J 0" }, { t: "Retour", x: "Débriefing et récit en images.", d: "J + 7" }] }],
        ["feat:bento", { title: "Les projets de la saison", items: [{ t: "Mont Toubkal", x: "Haut Atlas, 4 167 m, huit jours.", icon: "trophy" }, { t: "Kilimandjaro", x: "Route Machame, sept jours d'ascension.", icon: "sun" }, { t: "Aconcagua", x: "Expédition de 18 jours, réservée aux alpinistes confirmés.", icon: "shield" }] }],
        ["cta:split", { title: "Votre projet d'expédition ?", sub: "Un guide d'expédition étudie votre dossier.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "equipement", name: "Équipement", blocks: [
        ph("Équipement et sécurité", "Partir léger, partir sûr."),
        ["feat:list2", { title: "La liste de base", items: [{ t: "Chaussures de randonnée cassées" }, { t: "Sac de 40 litres" }, { t: "Veste imperméable" }, { t: "Couche chaude, bonnet, gants" }, { t: "Lampe frontale" }, { t: "Bâtons télescopiques" }] }],
        ["misc:faq", { title: "Sécurité", items: [{ t: "Quels sont les encadrants ?", x: "Guides de haute montagne diplômés et accompagnateurs en montagne." }, { t: "Que faire en cas de pépin ?", x: "Chaque groupe dispose d'une radio, d'une trousse et d'un plan d'évacuation." }, { t: "L'assurance est-elle incluse ?", x: "L'assistance rapatriement est incluse, l'annulation est optionnelle." }] }],
        ["cta:card", { title: "Louer plutôt qu'acheter ?", sub: "Sacs, bâtons et couchages disponibles à la location.", cta: ["Voir la location", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Dites-nous où vous voulez aller."),
        ["contact:cards", { title: "Écrire à l'équipe", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Permanence téléphonique", rows: [["Lundi – Vendredi", "9 h – 17 h"], ["Week-end", "Fermé"]] }],
      ] },
    ],
  },

  // 5. PLAGE POP — club vacances et camping familial
  {
    key: "plage-pop", name: "Plage Pop", category: "tourisme", tags: ["ludique", "moderne"], siteType: "Camping et village vacances",
    description: "Village vacances en bord de mer, tout en couleurs : corail, turquoise et soleil, titres arrondis en Righteous, boutons en pilule, comparateur de formules et FAQ rassurante.",
    brand: "Plage Pop",
    tokens: { colors: { primary: "#d93a35", secondary: "#007c85", accent: "#ffc233", background: "#fffbf0", surface: "#ffffff", text: "#12284c", muted: "#4d5f7a" }, fonts: { heading: "font.righteous", body: "font.poppins", button: "font.righteous", link: "font.poppins" }, radius: { sm: 10, md: 16, lg: 26, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.05, letterSpacing: 0 } }, buttons: { paddingY: 14, paddingX: 32 } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "plage-pop", motifs: ["waves", "blobs", "objects"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "Les bons plans soleil", sub: "Offres de dernière minute et promos de saison, une fois par mois.", button: "Je m'inscris" }],
    menu: [["Accueil", "/"], ["Hébergements", "/hebergements"], ["Animations", "/animations"], ["Tarifs", "/tarifs"], ["Infos pratiques", "/infos"]], cta: ["Réserver mon séjour", "/tarifs"],
    contact: { address: "Route de la Dune, 85100 Les Sables-d'Olonne", phone: "02 51 00 77 18", email: "vacances@plagepop.example", hours: "Accueil de 8 h à 20 h, d'avril à septembre", tagline: "Pieds dans le sable, tête en vacances." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Camping 4 étoiles · Vendée", title: "Les vacances, en version pop !", sub: "Mobil-homes lumineux, piscine à toboggans et plage à 200 mètres : on s'occupe de tout, vous gardez le sourire.", cta: ["Choisir mon hébergement", "/hebergements"], cta2: ["Voir les tarifs", "/tarifs"], stats: [["200 m", "de la plage"], ["120", "emplacements"], ["4 étoiles", "de confort"]] }],
        ["misc:marquee", { items: ["Enfants de moins de 3 ans offerts", "Accès piscine inclus", "Animaux acceptés", "Annulation flexible"] }],
        ["feat:cards", { eyebrow: "Au programme", title: "Une semaine, mille envies", items: [{ icon: "sun", t: "Plage et piscine", x: "Bassin chauffé, toboggans, pataugeoire et plage surveillée à 200 m." }, { icon: "users", t: "Club enfants", x: "Ateliers créatifs, chasses au trésor, mini-disco chaque soir." }, { icon: "heart", t: "Soirées pop", x: "Spectacles, bal et cinéma de plein air." }] }],
        ["gal:listings", { title: "Nos hébergements", items: [{ t: "Mobil-home Mouette", tag: "4 pers.", price: "dès 460 € / sem.", x: "Terrasse couverte, 2 chambres." }, { t: "Mobil-home Pétrel", tag: "6 pers.", price: "dès 690 € / sem.", x: "3 chambres, climatisation." }, { t: "Emplacement nu", tag: "Tente ou camping-car", price: "dès 24 € / nuit", x: "Électricité 10 A comprise." }] }],
        ["proof:quotes", { title: "Les vacanciers racontent", items: [{ q: "Les enfants n'ont pas voulu partir !", n: "Famille Roux", r: "clients fictifs" }, { q: "Propre, calme la nuit, animé le jour.", n: "Delphine G.", r: "cliente fictive" }, { q: "Un accueil formidable.", n: "Marc et Lise", r: "clients fictifs" }] }],
        ["cta:band", { title: "Réservez avant le 31 mars : -10 %", sub: "Offre de démonstration valable pour les séjours d'été.", cta: ["Réserver", "/tarifs"] }],
      ] },
      { key: "hebergements", name: "Hébergements", blocks: [
        ph("Nos hébergements", "Du mobil-home tout confort à l'emplacement nu."),
        ["gal:listings", { title: "Choisissez votre coin de plage", items: [{ t: "Mobil-home Mouette", tag: "4 pers.", price: "460 €", x: "2 chambres, terrasse, 28 m²." }, { t: "Mobil-home Pétrel", tag: "6 pers.", price: "690 €", x: "3 chambres, clim, 34 m²." }, { t: "Chalet Embruns", tag: "6 pers.", price: "820 €", x: "Terrasse bois, lave-vaisselle." }, { t: "Tente Safari", tag: "4 pers.", price: "390 €", x: "Équipée et au calme." }, { t: "Emplacement nu", tag: "Tente", price: "24 € / nuit", x: "Électricité comprise." }, { t: "Aire camping-car", tag: "Camping-car", price: "28 € / nuit", x: "Eau et vidange." }] }],
        ["feat:list2", { title: "Dans tous nos hébergements", items: [{ t: "Linge de lit en option" }, { t: "Cuisine équipée" }, { t: "Terrasse avec salon de jardin" }, { t: "Barbecue collectif" }, { t: "Parking" }, { t: "Wifi aux abords du bar" }] }],
        ["cta:split", { title: "Besoin d'un conseil ?", sub: "Famille, couple ou bande d'amis : on vous oriente.", cta: ["Nous écrire", "/infos"] }],
      ] },
      { key: "animations", name: "Animations", blocks: [
        ph("Animations", "Du matin au soir, il y a toujours quelque chose à faire."),
        ["misc:schedule", { title: "Une journée type", items: [{ d: "9 h 30", t: "Aquagym", x: "Au bord de la piscine." }, { d: "11 h", t: "Atelier plage", x: "Châteaux de sable et jeux." }, { d: "15 h", t: "Tournoi de pétanque", x: "Pour les petits et les grands." }, { d: "21 h", t: "Soirée spectacle", x: "Karaoké, bal, cinéma plein air." }] }],
        ["gal:cards", { title: "Les clubs", items: [{ t: "Mini-club", tag: "4 à 7 ans", x: "Ateliers créatifs et chasses au trésor." }, { t: "Club ados", tag: "12 à 17 ans", x: "Sports de plage et tournois." }, { t: "Espace détente", tag: "Adultes", x: "Aquagym, yoga, balades à vélo." }] }],
        ["cta:band", { title: "Les inscriptions aux clubs sont gratuites.", cta: ["Voir les tarifs", "/tarifs"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ph("Tarifs de la saison", "Prix par semaine, taxe de séjour en sus."),
        ["feat:compare", { title: "Comparer les formules", rows: [["", "Mobil-home Mouette", "Mobil-home Pétrel", "Emplacement nu"], ["Capacité", "4 pers.", "6 pers.", "6 pers."], ["Basse saison", "460 €", "690 €", "24 € / nuit"], ["Haute saison", "820 €", "1 150 €", "42 € / nuit"], ["Piscine", "incluse", "incluse", "incluse"]] }],
        ["price:tiers", { title: "Options", items: [{ t: "Linge de lit", price: "12 €", period: "/ lit", f: ["Draps et taies", "Serviettes en option"] }, { t: "Pack arrivée", price: "29 €", period: "/ séjour", f: ["Ménage final", "Linge de bain", "Kit vaisselle"], hl: true }, { t: "Animal de compagnie", price: "5 €", period: "/ nuit", f: ["Un animal par hébergement", "Carnet de santé obligatoire"] }] }],
        ["cta:card", { title: "Un doute ? Appelez-nous.", sub: "On vous répond de 8 h à 20 h.", cta: ["Nous contacter", "/infos"] }],
      ] },
      { key: "infos", name: "Infos pratiques", blocks: [
        ph("Infos pratiques"),
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "À quelle heure arrive-t-on ?", x: "Arrivée dès 15 h, départ avant 10 h." }, { t: "Les animaux sont-ils acceptés ?", x: "Oui, tenus en laisse sur le site." }, { t: "Peut-on annuler ?", x: "Annulation gratuite jusqu'à 30 jours avant l'arrivée (démonstration)." }, { t: "Y a-t-il des supermarchés proches ?", x: "À cinq minutes en voiture, et une épicerie sur place." }] }],
        ["contact:map", { title: "Comment venir", mapAddress: "Route de la Dune, 85100 Les Sables-d'Olonne" }],
        ["misc:hours", { title: "Accueil", rows: [["Avril – juin", "9 h – 19 h"], ["Juillet – août", "8 h – 20 h"], ["Septembre", "9 h – 18 h"]] }],
      ] },
    ],
  },

  // 6. ÉCOLODGE CANOPÉE
  {
    key: "ecolodge-canopee", name: "Écolodge Canopée", category: "tourisme", tags: ["naturel", "minimaliste"], siteType: "Écolodge et séjours nature",
    description: "Écolodge discret : vert forêt, sable et laiton, titres Jost épurés, serif Lora pour le texte, grille d'icônes sans cartes et chronologie du séjour.",
    brand: "Écolodge Canopée",
    tokens: { colors: { primary: "#3d6b4f", secondary: "#1f3a2c", accent: "#c4a35a", background: "#eef2ea", surface: "#fafcf7", text: "#1f2d24", muted: "#546357" }, fonts: { heading: "font.jost", body: "font.lora", button: "font.jost", link: "font.lora" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.1, letterSpacing: -0.01 }, h2: { size: 34, weight: 400, lineHeight: 1.2, letterSpacing: 0 } }, border: { width: 1, color: "#d4dccd" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "ecolodge-canopee", motifs: ["botanical", "topo", "plates"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Huit cabanes perchées au cœur d'une forêt privée, alimentées à 100 % par énergie solaire.", cols: [["Séjourner", "Cabanes", "Expériences", "Tarifs"], ["Engagements", "Notre démarche", "Contact"]] }],
    menu: [["Accueil", "/"], ["Cabanes", "/cabanes"], ["Expériences", "/experiences"], ["Notre démarche", "/demarche"], ["Contact", "/contact"]], cta: ["Réserver une cabane", "/contact"],
    contact: { address: "Lieu-dit La Canopée, 24290 Montignac", phone: "05 53 00 41 67", email: "sejour@ecolodgecanopee.example", hours: "Accueil 15 h – 19 h ; réponses aux e-mails sous 24 h", tagline: "Dormir dans les arbres, sans bruit." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Périgord · forêt privée de 12 hectares", title: "Dormir au rythme de la forêt.", sub: "Huit cabanes perchées, sans écran dans les chambres, un petit-déjeuner de producteurs locaux et des sentiers pour se perdre en douceur.", cta: ["Voir les cabanes", "/cabanes"], cta2: ["Notre démarche", "/demarche"] }],
        ["feat:grid-icons", { eyebrow: "Le séjour", title: "Rien de superflu", items: [{ icon: "sun", t: "Énergie solaire", x: "Panneaux et batteries, eau chaude solaire." }, { icon: "moon", t: "Ciel étoilé", x: "Éclairage extérieur réduit pour voir la voie lactée." }, { icon: "heart", t: "Cuisine locale", x: "Petit-déjeuner de la région livré à la cabane." }, { icon: "globe", t: "Faible impact", x: "Matériaux biosourcés, toilettes sèches." }] }],
        ["feat:steps", { title: "Un séjour de deux nuits", items: [{ t: "Arrivée à pied", x: "Votre sac est porté jusqu'à la cabane.", d: "Jour 1" }, { t: "Balade guidée", x: "Découverte de la faune et de la flore.", d: "Jour 1" }, { t: "Matin libre", x: "Hamac, lecture, bain nordique.", d: "Jour 2" }, { t: "Dernier lever de soleil", x: "Petit déjeuner sur la terrasse.", d: "Jour 3" }] }],
        ["gal:strip", { title: "Dans la canopée", items: [{ t: "Cabane" }, { t: "Passerelle" }, { t: "Terrasse" }, { t: "Bain nordique" }, { t: "Forêt" }] }],
        ["cta:card", { title: "Vous cherchez le silence ?", sub: "Nous aussi. Les dates d'automne sont ouvertes.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "cabanes", name: "Cabanes", blocks: [
        ph("Les cabanes", "Huit refuges, de deux à quatre personnes."),
        ["gal:listings", { title: "Choisir sa cabane", items: [{ t: "Cabane Chêne", tag: "2 pers.", price: "170 € / nuit", x: "Lit double, terrasse, vue sur le vallon." }, { t: "Cabane Noyer", tag: "3 pers.", price: "210 € / nuit", x: "Deux couchages et une banquette." }, { t: "Cabane Cèdre", tag: "4 pers.", price: "260 € / nuit", x: "Deux niveaux, poêle à bois." }] }],
        ["feat:list2", { title: "Dans chaque cabane", items: [{ t: "Linge de lit et serviettes" }, { t: "Bouilloire et thés bio" }, { t: "Douche chaude solaire" }, { t: "Plaid et hamac" }, { t: "Jumelles pour observer les oiseaux" }, { t: "Pas de télévision" }] }],
        ["cta:band", { title: "Petit-déjeuner inclus, panier du soir en option.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "experiences", name: "Expériences", blocks: [
        ph("Expériences", "Marcher, goûter, se réveiller doucement."),
        ["feat:alt", { title: "À vivre sur place", items: [{ t: "Balade crépusculaire", x: "Un guide naturaliste vous conduit à l'écoute des chouettes (2 h, 25 €).", link: ["Réserver", "/contact"] }, { t: "Bain nordique", x: "Cuve de bois chauffée au feu, trois créneaux par soir (30 €).", link: ["Réserver", "/contact"] }] }],
        ["proof:quotes", { items: [{ q: "On a retrouvé le sommeil et les oiseaux.", n: "Ariane S.", r: "cliente fictive" }, { q: "Un silence incroyable, une douceur de vivre.", n: "Pascal D.", r: "client fictif" }, { q: "Très bien pensé, sans ostentation.", n: "Clémence B.", r: "cliente fictive" }] }],
        ["cta:split", { title: "Offrir une nuit dans les arbres.", sub: "Cartes cadeaux valables un an.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "demarche", name: "Notre démarche", blocks: [
        ph("Notre démarche"),
        ["misc:text", { eyebrow: "Engagements", title: "Un impact léger", paras: ["Les cabanes sont construites en bois local, isolées en fibres de chanvre, sans béton ni fondation profonde.", "Nous suivons notre consommation d'eau et d'énergie chaque mois et publions les chiffres (valeurs d'exemple)."] }],
        ["proof:statsbar", { items: [["100 %", "énergie solaire"], ["0", "plastique à usage unique"], ["12 ha", "de forêt protégée"]] }],
        ["feat:numbered", { title: "Trois principes", items: [{ t: "Construire peu", x: "Chaque cabane s'adapte à la pente et aux arbres." }, { t: "Consommer juste", x: "Eau chaude solaire, compost, récupération des eaux de pluie." }, { t: "Partager", x: "Emploi local et achats auprès de producteurs voisins." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact et accès"),
        ["contact:info", { title: "Réserver une cabane", formTitle: "Demande de séjour", formIntro: "Dates, nombre d'adultes et d'enfants.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "Lieu-dit La Canopée, 24290 Montignac" }],
      ] },
    ],
  },

  // 7. ESCALES — agence de voyages en ligne, clair, corporate
  {
    key: "escales-agence", name: "Escales", category: "tourisme", tags: ["moderne", "geometrique"], siteType: "Agence de voyages et voyages d'affaires",
    description: "Agence de voyages claire et structurée : bleu roi, ambre, Work Sans, bandeau avec recherche, tableau comparatif de formules et pied de page newsletter.",
    brand: "Escales Voyages",
    tokens: { colors: { primary: "#1d4ed8", secondary: "#0f2547", accent: "#f59e0b", background: "#f5f8fc", surface: "#ffffff", text: "#16233a", muted: "#4c5b73" }, fonts: { heading: "font.work-sans", body: "font.inter", button: "font.work-sans", link: "font.inter" }, radius: { sm: 6, md: 10, lg: 14, button: 10, field: 8, card: 12 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.08, letterSpacing: -0.025 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "escales-agence", motifs: ["skyline", "mesh", "tiles"] },
    head: ["head:topbar", { info: "Service client · 01 55 00 12 90", note: "Du lundi au vendredi, 9 h – 19 h" }], foot: ["foot:newsletter", { title: "Les bons plans Escales", sub: "Nos meilleures offres de vols et d'hôtels, une fois par semaine.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Destinations", "/destinations"], ["Offres", "/offres"], ["Voyages d'affaires", "/affaires"], ["Contact", "/contact"]], cta: ["Devis gratuit", "/contact"],
    contact: { address: "88 boulevard Haussmann, 75008 Paris", phone: "01 55 00 12 90", email: "conseil@escales.example", hours: "Du lundi au vendredi, 9 h – 19 h ; samedi, 10 h – 17 h", tagline: "Voyages simples, prix clairs." },
    social: ["linkedin", "facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "Agence de voyages", title: "Où partez-vous ensuite ?", sub: "Vols, hôtels, séjours : un conseiller compare pour vous et vous propose le meilleur rapport qualité-prix.", placeholder: "Destination, pays, ville…", overlay: "#0f2547b0" }],
        ["feat:icons", { eyebrow: "Pourquoi nous", title: "Un voyage simple dès le premier appel", items: [{ icon: "users", t: "Un conseiller dédié", x: "Le même interlocuteur de la demande de devis jusqu'au retour." }, { icon: "shield", t: "Prix tout compris", x: "Pas de frais cachés : vols, hôtels, transferts et taxes." }, { icon: "clock", t: "Assistance 24 h/24", x: "Une ligne d'urgence en cas d'imprévu." }] }],
        ["gal:coursecards", { title: "Séjours à la une", items: [{ t: "Lisbonne, 4 jours", tag: "Ville", price: "dès 540 €", x: "Vols et hôtel centre-ville.", cta: "Voir l'offre", url: "/offres" }, { t: "Marrakech, 5 jours", tag: "Soleil", price: "dès 620 €", x: "Riad et excursion dans l'Atlas.", cta: "Voir l'offre", url: "/offres" }, { t: "Rome, 3 jours", tag: "Culture", price: "dès 480 €", x: "Hôtel 4 étoiles, visite guidée.", cta: "Voir l'offre", url: "/offres" }] }],
        ["proof:logos", { title: "Nos partenaires (fictifs)", items: ["AirCaps", "Hôtels Altaïr", "Rail Horizon", "Croisières Nautis", "Assur Voyage"] }],
        ["proof:quotes", { items: [{ q: "Mon conseiller a refait tout mon voyage après un retard de vol.", n: "Anne-Sophie L.", r: "cliente fictive" }, { q: "Devis reçu en deux heures, prix très compétitif.", n: "David R.", r: "client fictif" }, { q: "Un vrai suivi humain.", n: "Karima B.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Devis gratuit en deux heures.", sub: "Dites-nous votre projet, nous nous occupons du reste.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "destinations", name: "Destinations", blocks: [
        ph("Destinations", "Villes, plages, montagnes : où que vous alliez."),
        ["gal:masonry", { title: "Inspirations", items: [{ t: "Lisbonne" }, { t: "Marrakech" }, { t: "Rome" }, { t: "Istanbul" }, { t: "Madère" }, { t: "Reykjavik" }] }],
        ["feat:tabs", { title: "Par type de voyage", items: [{ t: "Week-ends en ville", x: "Villes européennes à moins de trois heures de vol." }, { t: "Soleil et plage", x: "Îles, côtes et séjours en bord de mer." }, { t: "Nature et aventure", x: "Randonnées, parcs nationaux, croisières." }] }],
        ["cta:split", { title: "Une idée en tête ?", sub: "Un conseiller vous aide à choisir.", cta: ["Nous appeler", "/contact"] }],
      ] },
      { key: "offres", name: "Offres", blocks: [
        ph("Offres du moment", "Tarifs par personne, base chambre double (démonstration)."),
        ["gal:listings", { title: "Départs en promotion", items: [{ t: "Lisbonne, 4 jours", tag: "Ville", price: "540 €", x: "Vol A/R + hôtel 3 étoiles." }, { t: "Marrakech, 5 jours", tag: "Soleil", price: "620 €", x: "Riad avec petit déjeuner." }, { t: "Rome, 3 jours", tag: "Culture", price: "480 €", x: "Hôtel 4 étoiles, visite guidée." }, { t: "Madère, 7 jours", tag: "Nature", price: "890 €", x: "Voiture de location comprise." }, { t: "Istanbul, 4 jours", tag: "Ville", price: "570 €", x: "Hôtel centre historique." }, { t: "Reykjavik, 5 jours", tag: "Aventure", price: "1 140 €", x: "Excursion aurores comprise." }] }],
        ["feat:compare", { title: "Nos formules", rows: [["", "Essentiel", "Confort", "Premium"], ["Vol + hôtel", "oui", "oui", "oui"], ["Transferts", "non", "oui", "oui"], ["Assurance annulation", "option", "oui", "oui"], ["Conseiller dédié", "oui", "oui", "oui"], ["Conciergerie", "non", "non", "oui"]] }],
        ["cta:band", { title: "Une offre vous intéresse ?", cta: ["Réserver un devis", "/contact"] }],
      ] },
      { key: "affaires", name: "Voyages d'affaires", blocks: [
        ph("Voyages d'affaires", "Déplacements professionnels, séminaires et incentives."),
        ["feat:cards", { title: "Notre accompagnement", items: [{ icon: "briefcase", t: "Déplacements", x: "Réservation de vols et de trains, flexibilité des billets, suivi des notes de frais." }, { icon: "users", t: "Séminaires", x: "Organisation de rencontres de 20 à 300 personnes en France et en Europe." }, { icon: "trophy", t: "Incentives", x: "Voyages de récompense pour vos équipes, de la sélection du lieu à l'animation." }] }],
        ["proof:stats", { items: [["120", "entreprises clientes (exemple)"], ["24 h/24", "assistance dédiée"], ["-12 %", "de budget moyen (exemple)"]] }],
        ["cta:image", { title: "Un devis pour votre entreprise ?", sub: "Nous répondons sous 24 heures ouvrées.", cta: ["Demander un devis pro", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Notre agence parisienne vous reçoit sur rendez-vous."),
        ["contact:cards", { title: "Parlez à un conseiller", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "88 boulevard Haussmann, 75008 Paris" }],
      ] },
    ],
  },

  // 8. CITY BREAK NUIT — hôtel design urbain, sombre néon
  {
    key: "nuit-urbaine", name: "Nuit Urbaine", category: "tourisme", tags: ["sombre", "geometrique", "moderne"], siteType: "Hôtel urbain design",
    description: "Hôtel urbain nocturne : encre violette, néon menthe, capitales espacées Epilogue, bandeau éditorial, tuiles géométriques et chambres au tarif affiché.",
    brand: "Hôtel Nuit Urbaine",
    tokens: { colors: { primary: "#b388ff", secondary: "#0a0814", accent: "#2ee6c5", background: "#12101c", surface: "#1c1930", text: "#f1eefc", muted: "#b0aacb" }, fonts: { heading: "font.epilogue", body: "font.dm-sans", button: "font.epilogue", link: "font.dm-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 6, field: 6, card: 10 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.02, letterSpacing: -0.03, transform: "uppercase" }, h2: { size: 34, weight: 800, lineHeight: 1.1, letterSpacing: -0.01, transform: "uppercase" } }, border: { width: 1, color: "#332d52" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "nuit-urbaine", motifs: ["skyline", "mesh", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Cinquante-deux chambres, un rooftop et un bar ouvert jusqu'à 2 h, à dix minutes à pied de la gare.", cols: [["L'hôtel", "Chambres", "Rooftop", "Quartier"], ["Aide", "Réserver", "Contact", "Accès"]] }],
    menu: [["Accueil", "/"], ["Chambres", "/chambres"], ["Rooftop et bar", "/rooftop"], ["Le quartier", "/quartier"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "36 rue des Docks, 13002 Marseille", phone: "04 91 00 36 52", email: "bonsoir@nuiturbaine.example", hours: "Réception 24 h/24 ; bar du rooftop de 17 h à 2 h", tagline: "L'hôtel qui s'allume à la nuit tombée." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { eyebrow: "Hôtel design · Marseille", kicker: "52 chambres · rooftop", title: "La ville ne dort jamais. Vous si.", sub: "Chambres insonorisées, literie premium et rooftop sur les docks : un point de chute pour les noctambules comme pour les voyageurs d'un soir.", cta: ["Réserver", "/reserver"], cta2: ["Voir les chambres", "/chambres"] }],
        ["feat:bento", { eyebrow: "L'adresse", title: "Trois raisons de s'arrêter", items: [{ t: "Le rooftop", x: "Cocktails de saison, DJ le week-end et vue à 360° sur le port.", icon: "sparkles" }, { t: "Chambres sombres", x: "Rideaux occultants, isolation phonique renforcée.", icon: "moon" }, { t: "Check-in digital", x: "Arrivée sans contact (démonstration), badge sur téléphone.", icon: "smartphone" }] }],
        ["gal:wall", { items: [{ t: "Lobby" }, { t: "Chambre" }, { t: "Rooftop" }, { t: "Bar" }] }],
        ["feat:pricelist", { eyebrow: "Tarifs exemples", title: "Chambres à partir de", items: [{ t: "Chambre Nuit", x: "18 m², lit double", price: "99 €" }, { t: "Chambre Loft", x: "26 m², bureau", price: "139 €" }, { t: "Suite Skyline", x: "45 m², terrasse", price: "249 €" }] }],
        ["cta:image", { title: "Séjour d'une nuit ? Départ tardif offert.", sub: "Check-out jusqu'à 14 h du dimanche au jeudi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "chambres", name: "Chambres", blocks: [
        ph("Chambres", "Du studio à la suite, du simple au spectaculaire."),
        ["gal:listings", { title: "Notre sélection", items: [{ t: "Chambre Nuit", tag: "18 m²", price: "99 €", x: "Lit double, douche italienne." }, { t: "Chambre Loft", tag: "26 m²", price: "139 €", x: "Bureau, grand miroir." }, { t: "Suite Skyline", tag: "45 m²", price: "249 €", x: "Terrasse privée, vue sur le port." }] }],
        ["feat:grid-icons", { title: "Inclus partout", items: [{ icon: "monitor", t: "Écran connecté", x: "Streaming, enceinte Bluetooth." }, { icon: "zap", t: "Wifi fibre", x: "Débit illimité." }, { icon: "moon", t: "Isolation phonique", x: "Doubles vitrages et portes acoustiques." }, { icon: "coin", t: "Minibar à prix doux", x: "Boissons à 3 €." }] }],
        ["cta:band", { title: "Tarif préférentiel à partir de 3 nuits.", sub: "Remise de 10 % (offre de démonstration).", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "rooftop", name: "Rooftop et bar", blocks: [
        ph("Rooftop et bar", "Du coucher de soleil à deux heures du matin."),
        ["misc:schedule", { title: "La semaine du rooftop", items: [{ d: "Mardi", t: "Afterwork", x: "Cocktails à 9 €, 18 h – 21 h." }, { d: "Jeudi", t: "Live acoustique", x: "Sets de 45 minutes." }, { d: "Vendredi", t: "DJ", x: "House et disco jusqu'à 2 h." }, { d: "Dimanche", t: "Brunch rooftop", x: "11 h – 15 h, 28 €." }] }],
        ["misc:menu", { title: "Carte du bar", left: ["Cocktails", [{ t: "Noctambule", x: "Gin, hibiscus, citron vert", price: "12 €" }, { t: "Docks", x: "Rhum, ananas grillé, menthe", price: "13 €" }]], right: ["À grignoter", [{ t: "Planche du port", x: "Poutargue, olives, tapenade", price: "14 €" }, { t: "Panisses", x: "Sauce aïoli", price: "8 €" }]] }],
        ["cta:card", { title: "Privatiser le rooftop ?", sub: "Jusqu'à cent invités.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "quartier", name: "Le quartier", blocks: [
        ph("Le quartier", "À pied, tout est proche."),
        ["feat:rows", { title: "Nos adresses autour de l'hôtel", items: [{ t: "Le Vieux-Port, 15 minutes", x: "Promenade et ferry vers le Frioul." }, { t: "Musée des Docks, 5 minutes", x: "Expositions d'art contemporain." }, { t: "La halle gourmande, 8 minutes", x: "Ouvert dès 9 h, cuisine de rue." }, { t: "Gare Saint-Charles, 10 minutes", x: "TGV et TER." }] }],
        ["proof:quotes", { items: [{ q: "Une adresse stylée, au calme malgré la rue.", n: "Romane P.", r: "cliente fictive" }, { q: "Le rooftop vaut le déplacement.", n: "Hakim M.", r: "client fictif" }, { q: "Chambre impeccable, personnel formidable.", n: "Elena K.", r: "cliente fictive" }] }],
        ["cta:split", { title: "Vous arrivez en train ?", sub: "Nous gardons vos bagages dès 10 h.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Au meilleur tarif, directement sur le site."),
        ["contact:info", { title: "Votre séjour à Marseille", formTitle: "Demande de réservation", formIntro: "Arrivée, départ, type de chambre.", cta: ["Envoyer", "/reserver"] }],
        ["contact:map", { mapAddress: "36 rue des Docks, 13002 Marseille" }],
      ] },
    ],
  },
];
