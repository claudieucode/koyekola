// Automobile et mobilité (4 thèmes). Tous les textes sont des textes de DÉMONSTRATION (garages, véhicules, prix, personnes et coordonnées fictifs), remplaçables dans l'éditeur.
const contactPage = (sub, title, addr, cta) => ({ key: "contact", name: "Contact", blocks: [
  ["misc:pagehead", { title: "Contact", sub }],
  ["contact:cards", { title, cta }],
  ["contact:map", { mapAddress: addr }],
] });

module.exports = [
  {
    key: "bielle-et-chrome", name: "Bielle & Chrome", category: "auto", tags: ["sombre", "audacieux"], siteType: "Garage et atelier de mécanique",
    description: "Garage indépendant sur fond noir graphite, rouge signal et jaune de sécurité : titres Anton en capitales, forfaits d'entretien et prise de rendez-vous en ligne.",
    featured: true, brand: "Garage Bielle & Chrome",
    tokens: { colors: { primary: "#e03a1e", secondary: "#0b0908", accent: "#ffb703", background: "#14110f", surface: "#1f1a17", text: "#f4efe9", muted: "#b9aea3" }, fonts: { heading: "font.anton", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 400, lineHeight: 1, transform: "uppercase", letterSpacing: 0.01 }, h2: { size: 40, weight: 400, transform: "uppercase" } }, border: { width: 1, color: "#3a322c" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "bielle", motifs: ["rays", "plates", "halftone"] },
    head: ["head:topbar", { info: "Atelier ouvert du lundi au samedi, 8 h – 18 h 30", note: "Urgence dépannage : 06 12 34 56 78" }],
    foot: ["foot:columns", { about: "Entretien, réparation et préparation de véhicules toutes marques depuis 1998 (garage fictif).", cols: [["Atelier", "Entretien", "Pneus", "Carrosserie"], ["Pratique", "Prendre rendez-vous", "Tarifs", "Contact"]] }],
    menu: [["Accueil", "/"], ["Entretien", "/entretien"], ["Réparations", "/reparations"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Prendre rendez-vous", "/contact"],
    contact: { address: "ZA des Quatre Routes, 31700 Blagnac", phone: "05 61 00 44 44", email: "atelier@bielle-chrome.example", hours: "Lundi au samedi, 8 h – 18 h 30", tagline: "Mécanique, pneus et carrosserie, toutes marques." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Garage indépendant à Blagnac", title: "Votre voiture mérite un vrai mécano.", sub: "Révision, freinage, distribution, diagnostic électronique : devis écrit avant travaux, pièces d'origine ou équivalentes.", cta: ["Prendre rendez-vous", "/contact"], cta2: ["Voir les tarifs", "/tarifs"] }],
        ["misc:marquee", { items: ["Devis gratuit", "Véhicule de courtoisie", "Toutes marques", "Garantie 12 mois", "Paiement en trois fois"] }],
        ["feat:icons", { eyebrow: "L'atelier", title: "Ce que nous faisons de mieux", items: [{ icon: "settings", t: "Entretien constructeur", x: "Révision dans le respect du carnet, garantie conservée." }, { icon: "activity", t: "Diagnostic électronique", x: "Lecture des défauts, essais sur route, rapport écrit." }, { icon: "shield", t: "Freinage et liaison au sol", x: "Plaquettes, disques, amortisseurs, géométrie." }, { icon: "zap", t: "Climatisation et batterie", x: "Recharge, contrôle des fuites, remplacement." }] }],
        ["gal:wall", { title: "Dans l'atelier", items: [{ t: "Pont élévateur" }, { t: "Valise de diagnostic" }, { t: "Banc de géométrie" }, { t: "Stock de pneus" }] }],
        ["proof:statsbar", { items: [["25 ans", "d'atelier"], ["14 000", "révisions réalisées (exemple)"], ["4,8/5", "avis clients (exemple)"]] }],
        ["proof:quotes", { title: "Ce que disent les clients", items: [{ q: "Prix annoncé, prix payé. Rare.", n: "Franck D.", r: "Client fictif" }, { q: "Ma vieille berline roule comme neuve.", n: "Sabrina L.", r: "Cliente fictive" }, { q: "Pièce remplacée montrée avant de la jeter.", n: "Olivier P.", r: "Client fictif" }] }],
        ["cta:band", { title: "Un bruit étrange ? Venez le faire écouter.", sub: "Diagnostic à partir de 39 €, offert si vous faites les travaux.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "entretien", name: "Entretien", blocks: [
        ["misc:pagehead", { title: "Entretien et révision", sub: "Respect du carnet constructeur, devis écrit." }],
        ["feat:tabs", { title: "Nos forfaits", items: [{ t: "Vidange", x: "Huile, filtre à huile, contrôle de 30 points, remise à zéro de l'indicateur." }, { t: "Révision complète", x: "Vidange, filtres air et habitacle, bougies selon motorisation, contrôle freinage." }, { t: "Distribution", x: "Kit complet avec pompe à eau, tendeur et garantie de 24 mois." }, { t: "Pré-contrôle technique", x: "Vérification des points de contrôle avant passage." }] }],
        ["feat:steps", { title: "Votre passage à l'atelier", items: [{ t: "Prise en charge", x: "Constat avec vous du véhicule." }, { t: "Devis écrit", x: "Validé avant tout démontage." }, { t: "Travaux", x: "Suivi par SMS." }, { t: "Restitution", x: "Essai, pièces remplacées, facture détaillée." }] }],
        ["cta:split", { title: "Réservez votre créneau d'entretien", cta: ["Choisir un créneau", "/contact"] }],
      ] },
      { key: "reparations", name: "Réparations", blocks: [
        ["misc:pagehead", { title: "Réparations" }],
        ["gal:cards", { items: [{ t: "Freinage", tag: "Sécurité", x: "Plaquettes, disques, liquide, purge." }, { t: "Embrayage", tag: "Transmission", x: "Kit complet et volant moteur." }, { t: "Pneumatiques", tag: "Pneus", x: "Montage, équilibrage, parallélisme." }, { t: "Carrosserie légère", tag: "Carrosserie", x: "Débosselage et retouches de peinture." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Utilisez-vous des pièces d'origine ?", x: "Oui, ou des équivalents de première monte, au choix, indiqués sur le devis." }, { t: "Ai-je un véhicule de courtoisie ?", x: "Sur réservation, pour les travaux de plus d'une demi-journée." }, { t: "Mes garanties constructeur restent-elles valables ?", x: "Oui, nous respectons le carnet d'entretien et utilisons des pièces conformes." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs (exemple, main-d'œuvre incluse)" }],
        ["feat:pricelist", { title: "Forfaits indicatifs", items: [{ t: "Vidange + filtre à huile", x: "Citadine", price: "89 €" }, { t: "Plaquettes avant", x: "Pièces et pose", price: "129 €" }, { t: "Disques + plaquettes avant", x: "Pièces et pose", price: "259 €" }, { t: "Révision complète", x: "Berline", price: "219 €" }, { t: "Recharge de climatisation", x: "Gaz et contrôle", price: "79 €" }] }],
        ["misc:text", { title: "À savoir", paras: ["Tous les prix sont TTC, valables pour les véhicules courants, hors pièces spécifiques. Le devis définitif est établi après diagnostic."] }],
      ] },
      contactPage("Rendez-vous sur place, par téléphone ou en ligne.", "Prendre rendez-vous", "ZA des Quatre Routes, 31700 Blagnac", ["Demander un créneau", "/contact"]),
    ],
  },

  {
    key: "occasions-verdel", name: "Occasions Verdel", category: "auto", tags: ["moderne", "technique"], siteType: "Concession de véhicules d'occasion",
    description: "Concession VO claire et rassurante : vert forêt et or, Space Grotesk, fiches véhicules avec kilométrage vérifié, garantie et reprise en vitrine.",
    brand: "Occasions Verdel",
    tokens: { colors: { primary: "#1f5f46", secondary: "#10281f", accent: "#d4a017", background: "#f6f7f4", surface: "#ffffff", text: "#17201b", muted: "#52605a" }, fonts: { heading: "font.space-grotesk", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 700, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "verdel", motifs: ["mesh", "topo", "tiles"] },
    head: ["head:bar", {}],
    foot: ["foot:newsletter", { title: "Les arrivages de la semaine", sub: "Un courriel quand un modèle correspondant à votre alerte entre en stock.", button: "Créer une alerte" }],
    menu: [["Accueil", "/"], ["Véhicules", "/vehicules"], ["Reprise", "/reprise"], ["Garantie", "/garantie"], ["Contact", "/contact"]], cta: ["Estimer ma reprise", "/reprise"],
    contact: { address: "128 route de Lyon, 38100 Grenoble", phone: "04 76 00 18 18", email: "vente@occasions-verdel.example", hours: "Du mardi au samedi, 9 h – 19 h", tagline: "Véhicules d'occasion révisés et garantis." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "120 véhicules en stock", title: "L'occasion, version transparente.", sub: "Chaque véhicule est révisé en atelier, kilométrage certifié, historique complet remis à la livraison.", placeholder: "Marque, modèle, budget…", cta: ["Voir tout le stock", "/vehicules"] }],
        ["gal:listings", { eyebrow: "Arrivages", title: "Derniers véhicules entrés (démonstration)", items: [{ t: "Citadine hybride 2021", tag: "34 200 km", price: "15 490 €", x: "Boîte auto, caméra de recul, garantie 12 mois." }, { t: "SUV compact diesel 2019", tag: "78 900 km", price: "19 990 €", x: "7 places, attelage, entretien suivi." }, { t: "Berline électrique 2022", tag: "21 500 km", price: "27 900 €", x: "Autonomie réelle 380 km, batterie contrôlée." }, { t: "Break essence 2020", tag: "52 300 km", price: "17 700 €", x: "Toit panoramique, régulateur adaptatif." }] }],
        ["feat:grid-icons", { title: "Nos engagements", items: [{ icon: "checkCircle", t: "100 points de contrôle", x: "Rapport signé par un mécanicien." }, { icon: "shield", t: "Garantie 12 mois", x: "Extensible jusqu'à 36 mois." }, { icon: "coin", t: "Reprise sur place", x: "Offre ferme en 20 minutes." }, { icon: "fileText", t: "Historique transparent", x: "Factures, carnet, kilométrage vérifié." }] }],
        ["feat:alt", { title: "Financer ou reprendre", items: [{ t: "Financement sur mesure", x: "LOA, crédit classique ou location longue durée, simulation immédiate.", link: ["Voir le détail", "/garantie"] }, { t: "Reprise de votre véhicule", x: "Estimation gratuite, déduite du prix du véhicule choisi.", link: ["Estimer ma reprise", "/reprise"] }] }],
        ["proof:stats", { items: [["8 200", "véhicules vendus (exemple)"], ["100 pts", "contrôlés par véhicule"], ["4,7/5", "avis clients (exemple)"]] }],
        ["cta:band", { title: "Vous ne trouvez pas le bon modèle ?", sub: "Créez une alerte : nous vous prévenons dès son arrivée.", cta: ["Créer une alerte", "/contact"] }],
      ] },
      { key: "vehicules", name: "Véhicules", blocks: [
        ["misc:pagehead", { title: "Véhicules en stock", sub: "Annonces de démonstration." }],
        ["gal:listings", { items: [{ t: "Citadine hybride 2021", tag: "34 200 km", price: "15 490 €", x: "Boîte auto." }, { t: "SUV compact diesel 2019", tag: "78 900 km", price: "19 990 €", x: "7 places." }, { t: "Berline électrique 2022", tag: "21 500 km", price: "27 900 €", x: "Autonomie 380 km." }, { t: "Break essence 2020", tag: "52 300 km", price: "17 700 €", x: "Toit panoramique." }, { t: "Utilitaire 3 places 2018", tag: "96 000 km", price: "13 800 €", x: "Aménagé atelier." }, { t: "Cabriolet 2017", tag: "61 400 km", price: "22 500 €", x: "Carnet à jour." }] }],
        ["feat:compare", { title: "Choisir sa motorisation", rows: [["", "Essence", "Hybride", "Électrique"], ["Usage idéal", "mixte", "ville", "trajets réguliers"], ["Budget carburant", "moyen", "bas", "très bas"], ["Entretien", "classique", "réduit", "minimal"]] }],
      ] },
      { key: "reprise", name: "Reprise", blocks: [
        ["misc:pagehead", { title: "Reprise de votre véhicule" }],
        ["feat:steps", { items: [{ t: "Décrivez votre véhicule", x: "Marque, modèle, année, kilométrage." }, { t: "Estimation en ligne", x: "Fourchette indicative immédiate." }, { t: "Expertise sur place", x: "Vingt minutes avec un expert." }, { t: "Offre ferme", x: "Paiement sous 48 heures." }] }],
        ["misc:faq", { items: [{ t: "Faut-il acheter chez vous pour faire reprendre ?", x: "Non, la reprise est possible sans achat." }, { t: "Quels documents apporter ?", x: "Carte grise, pièce d'identité, carnet d'entretien." }] }],
        ["cta:card", { title: "Combien vaut votre voiture ?", cta: ["Estimer ma reprise", "/contact"] }],
      ] },
      { key: "garantie", name: "Garantie", blocks: [
        ["misc:pagehead", { title: "Garanties et financement" }],
        ["price:tiers", { title: "Extensions de garantie (exemple)", items: [{ t: "Standard", price: "Incluse", period: "12 mois", f: ["Moteur et boîte", "Direction", "Freinage"] }, { t: "Confort", price: "290 €", period: "24 mois", hl: true, f: ["Tout Standard", "Électronique", "Climatisation"], cta: ["Choisir", "/contact"] }, { t: "Sérénité", price: "490 €", period: "36 mois", f: ["Tout Confort", "Assistance 24 h", "Véhicule de remplacement"], cta: ["Choisir", "/contact"] }] }],
        ["feat:list2", { title: "Financement", items: [{ t: "Crédit classique de 12 à 84 mois" }, { t: "Location avec option d'achat" }, { t: "Apport à partir de 0 €" }, { t: "Accord de principe en 24 heures" }] }],
      ] },
      contactPage("Passez nous voir ou réservez un essai en ligne.", "Réserver un essai", "128 route de Lyon, 38100 Grenoble", ["Réserver un essai", "/contact"]),
    ],
  },

  {
    key: "voltige-velos", name: "Voltige Vélos", category: "auto", tags: ["ludique", "naturel"], siteType: "Magasin de vélos électriques",
    description: "Boutique-atelier de vélos électriques : vert pomme et orange vif, Josefin Sans, essais gratuits, gammes ville, cargo et montagne, location à la semaine.",
    brand: "Voltige Vélos",
    tokens: { colors: { primary: "#4c8c0a", secondary: "#1d2a14", accent: "#ff6b35", background: "#f7fbf2", surface: "#ffffff", text: "#1d2a14", muted: "#55664a" }, fonts: { heading: "font.josefin-sans", body: "font.outfit", button: "font.josefin-sans", link: "font.outfit" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 18 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.06 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "voltige", motifs: ["blobs", "mountains", "waves"] },
    head: ["head:float", {}],
    foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Nos vélos", "/velos"], ["Location", "/location"], ["Atelier", "/atelier"], ["Contact", "/contact"]], cta: ["Réserver un essai", "/contact"],
    contact: { address: "17 cours Berriat, 38000 Grenoble", phone: "04 76 12 12 12", email: "salut@voltige-velos.example", hours: "Mardi au samedi, 10 h – 19 h", tagline: "Vélos électriques, essai gratuit." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Vélos à assistance électrique", title: "Montez la côte en souriant.", sub: "Vélos de ville, cargos familiaux et VTT électriques : essayez-les gratuitement sur nos parcours.", cta: ["Voir les vélos", "/velos"], cta2: ["Louer à la semaine", "/location"] }],
        ["feat:cards", { eyebrow: "Trois gammes", title: "Un vélo pour chaque trajet", items: [{ icon: "mapPin", t: "Ville", x: "Garde-boue, éclairage, antivol intégré. Dès 1 490 €." }, { icon: "users", t: "Cargo famille", x: "Deux enfants, courses, banc confortable. Dès 3 290 €." }, { icon: "globe", t: "Montagne", x: "Suspension, moteur central, autonomie 120 km. Dès 2 790 €." }] }],
        ["gal:products", { title: "Les coups de cœur (démonstration)", items: [{ t: "Citadin Lumière", price: "1 790 €" }, { t: "Cargo Famille 2", price: "3 590 €" }, { t: "Trail Belledonne", price: "3 190 €" }, { t: "Pliant Poche", price: "1 490 €" }] }],
        ["feat:steps", { title: "Votre parcours d'achat", items: [{ t: "Essai gratuit", x: "Une heure, sur route et en côte." }, { t: "Réglage", x: "Selle, guidon, assistance." }, { t: "Financement", x: "Avec aides locales à l'achat selon éligibilité." }, { t: "Livraison", x: "Vélo prêt à rouler, formation incluse." }] }],
        ["proof:quotes", { items: [{ q: "J'ai vendu ma deuxième voiture au bout d'un mois.", n: "Nadia B.", r: "Cliente fictive" }, { q: "Le cargo emmène mes jumeaux à l'école, même sous la pluie.", n: "Rémi C.", r: "Client fictif" }] }],
        ["cta:image", { title: "Essayez, c'est gratuit.", sub: "Réservez votre créneau d'une heure.", cta: ["Réserver un essai", "/contact"] }],
      ] },
      { key: "velos", name: "Nos vélos", blocks: [
        ["misc:pagehead", { title: "Nos vélos", sub: "Catalogue de démonstration, sans vente en ligne : essai et achat en boutique." }],
        ["gal:products", { items: [{ t: "Citadin Lumière", price: "1 790 €" }, { t: "Cargo Famille 2", price: "3 590 €" }, { t: "Trail Belledonne", price: "3 190 €" }, { t: "Pliant Poche", price: "1 490 €" }] }],
        ["misc:product", { eyebrow: "Modèle phare", title: "Cargo Famille 2", price: "3 590 €", text: "Un vélo cargo biporteur pensé pour les trajets quotidiens avec deux enfants.", points: ["Moteur central 85 Nm", "Batterie 625 Wh, jusqu'à 100 km", "Capote de pluie et ceintures incluses"], cta: ["Réserver un essai", "/contact"], url: "/contact", note: "Démonstration : pas de paiement en ligne." }],
        ["feat:compare", { title: "Comparer les gammes", rows: [["", "Ville", "Cargo", "Montagne"], ["Autonomie", "80 km", "100 km", "120 km"], ["Charge max", "130 kg", "200 kg", "140 kg"], ["Prix dès", "1 490 €", "3 290 €", "2 790 €"]] }],
      ] },
      { key: "location", name: "Location", blocks: [
        ["misc:pagehead", { title: "Location de vélos électriques" }],
        ["price:tiers", { items: [{ t: "Journée", price: "29 €", period: "par jour", f: ["Casque et antivol", "Batterie chargée"], cta: ["Réserver", "/contact"] }, { t: "Semaine", price: "129 €", period: "7 jours", hl: true, f: ["Casque, antivol, sacoches", "Assistance dépannage"], cta: ["Réserver", "/contact"] }, { t: "Mois", price: "349 €", period: "30 jours", f: ["Option d'achat", "Entretien inclus"], cta: ["Réserver", "/contact"] }] }],
        ["misc:faq", { items: [{ t: "Faut-il une caution ?", x: "Oui, par empreinte de carte, libérée au retour." }, { t: "Puis-je rendre le vélo dans une autre ville ?", x: "Non, retour dans notre boutique." }] }],
      ] },
      { key: "atelier", name: "Atelier", blocks: [
        ["misc:pagehead", { title: "Atelier et service après-vente" }],
        ["feat:pricelist", { title: "Entretien (exemple)", items: [{ t: "Révision annuelle", x: "Contrôle moteur, freins, transmission", price: "89 €" }, { t: "Remplacement de pneu", x: "Pièce et pose", price: "35 €" }, { t: "Diagnostic batterie", x: "Capacité et cellules", price: "29 €" }] }],
        ["feat:list2", { title: "Toutes marques", items: [{ t: "Réparation même hors boutique" }, { t: "Pièces d'origine" }, { t: "Prêt d'un vélo de courtoisie" }, { t: "Délai de 48 heures" }] }],
        ["cta:split", { title: "Un vélo qui coince ? Passez nous le montrer.", cta: ["Venir à l'atelier", "/contact"] }],
      ] },
      contactPage("Venez essayer, ou écrivez-nous pour réserver.", "Réserver un essai", "17 cours Berriat, 38000 Grenoble", ["Réserver", "/contact"]),
    ],
  },

  {
    key: "boussole-permis", name: "Boussole Permis", category: "auto", tags: ["editorial", "classique"], siteType: "Auto-école",
    description: "Auto-école pédagogique : bleu indigo et jaune citron, Red Hat Display, forfaits permis B et conduite accompagnée, suivi de progression et plateforme de code.",
    brand: "Auto-école Boussole",
    tokens: { colors: { primary: "#3b4fe0", secondary: "#121a33", accent: "#ffcf33", background: "#eef3ff", surface: "#ffffff", text: "#121a33", muted: "#4b5675" }, fonts: { heading: "font.red-hat-display", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 50, weight: 900, lineHeight: 1.08, letterSpacing: -0.025 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "boussole", motifs: ["rays", "ribbons", "tiles"] },
    head: ["head:bar", {}],
    foot: ["foot:columns", { about: "Auto-école Boussole, formation au permis B, à la conduite accompagnée et au permis accéléré (établissement fictif).", cols: [["Formations", "Permis B", "Conduite accompagnée", "Code"], ["Infos", "Tarifs", "Financement", "Contact"]] }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Tarifs", "/tarifs"], ["Moniteurs", "/moniteurs"], ["Contact", "/contact"]], cta: ["S'inscrire", "/contact"],
    contact: { address: "31 rue de la République, 59000 Lille", phone: "03 20 00 31 31", email: "inscription@boussole-permis.example", hours: "Lundi au samedi, 9 h – 19 h", tagline: "Permis B, accompagné et accéléré." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Auto-école à Lille", title: "Votre permis, sans stress et sans surprise.", sub: "Des moniteurs patients, des horaires souples et un suivi de progression partagé après chaque leçon.", cta: ["S'inscrire", "/contact"], cta2: ["Voir les tarifs", "/tarifs"], image: "hero" }],
        ["proof:statsbar", { items: [["88 %", "de réussite au premier passage (exemple)"], ["25 ans", "d'expérience"], ["6 moniteurs", "diplômés"]] }],
        ["feat:bento", { title: "Trois façons de passer le permis", items: [{ t: "Permis B classique", x: "20 heures de conduite minimum, rythme à votre convenance." }, { t: "Conduite accompagnée", x: "Dès 15 ans, avec un accompagnateur, 3 000 km minimum." }, { t: "Permis accéléré", x: "Le code et la conduite regroupés sur deux semaines." }] }],
        ["feat:steps", { title: "Votre parcours", items: [{ t: "Inscription", x: "Dossier et évaluation de départ." }, { t: "Code de la route", x: "Salle ou plateforme en ligne." }, { t: "Conduite", x: "Leçons de 1 heure avec bilan." }, { t: "Examen", x: "Présentation quand vous êtes prêt." }] }],
        ["proof:quotes", { title: "Elles et ils ont leur permis", items: [{ q: "Mon moniteur m'a appris à rester calme dans le rond-point.", n: "Lou M.", r: "Élève, cliente fictive" }, { q: "Le suivi en ligne m'a motivé jusqu'à l'examen.", n: "Yanis A.", r: "Élève, client fictif" }, { q: "Un planning adapté à mes études.", n: "Clara D.", r: "Élève, cliente fictive" }] }],
        ["cta:band", { title: "Prête ou prêt à prendre le volant ?", sub: "Évaluation de départ offerte.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Nos formations" }],
        ["feat:rows", { items: [{ t: "Permis B", x: "Code, 20 heures minimum de conduite, rendez-vous pédagogiques." }, { t: "Conduite accompagnée (AAC)", x: "À partir de 15 ans, 20 heures de formation puis 3 000 km accompagnés." }, { t: "Permis accéléré", x: "Stage intensif de 10 jours, hébergement non inclus." }, { t: "Boîte automatique", x: "Formation allégée, 13 heures minimum, permis limité à la boîte automatique." }, { t: "Remise à niveau", x: "Heures de conduite à l'unité pour reprendre confiance." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "À partir de quel âge ?", x: "À 17 ans pour la conduite accompagnée, 18 ans pour l'examen." }, { t: "Puis-je financer avec le CPF ?", x: "Oui, selon les conditions en vigueur au moment de l'inscription." }, { t: "Combien de temps pour décrocher le permis ?", x: "En moyenne trois à six mois selon votre rythme." }] }],
        ["cta:split", { title: "Un doute sur la formule ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs (exemple)" }],
        ["price:tiers", { items: [{ t: "Permis B", price: "1 290 €", period: "forfait", f: ["Inscription et code illimité", "20 heures de conduite", "Présentation à l'examen"], cta: ["S'inscrire", "/contact"] }, { t: "Conduite accompagnée", price: "1 190 €", period: "forfait", hl: true, f: ["Code illimité", "20 heures de conduite", "Deux rendez-vous pédagogiques"], cta: ["S'inscrire", "/contact"] }, { t: "Permis accéléré", price: "1 690 €", period: "stage", f: ["Code et conduite", "Examen en fin de stage"], cta: ["S'inscrire", "/contact"] }] }],
        ["feat:pricelist", { title: "À l'unité", items: [{ t: "Heure de conduite", price: "52 €" }, { t: "Accompagnement à l'examen", price: "70 €" }, { t: "Forfait code seul", price: "190 €" }] }],
      ] },
      { key: "moniteurs", name: "Moniteurs", blocks: [
        ["misc:pagehead", { title: "Nos moniteurs" }],
        ["proof:team", { title: "Les visages de Boussole", items: [{ n: "Farid Benali", r: "Moniteur, 14 ans d'expérience" }, { n: "Alice Dewulf", r: "Monitrice, conduite accompagnée" }, { n: "Jérémy Lambert", r: "Moniteur, boîte automatique" }, { n: "Sonia Ketema", r: "Directrice pédagogique" }] }],
        ["feat:list2", { title: "Notre pédagogie", items: [{ t: "Un bilan écrit après chaque leçon" }, { t: "Un moniteur référent du début à la fin" }, { t: "Voiture à double commande récente" }, { t: "Leçons dès 7 h 30 et jusqu'à 20 h" }] }],
      ] },
      contactPage("Passez au bureau ou inscrivez-vous en ligne.", "S'inscrire", "31 rue de la République, 59000 Lille", ["Envoyer", "/contact"]),
    ],
  },
];
