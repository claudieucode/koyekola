// Restaurants (lot B, 9 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const f = (h, b) => ({ heading: h, body: b, button: b, link: b });

module.exports = [
  // 1. Café de spécialité — clair, brun
  {
    key: "sillage-torre", name: "Sillage Torréfaction", category: "restaurant", tags: ["chaleureux", "minimaliste"], siteType: "Café de spécialité et torréfacteur",
    description: "Crème de lait, brun torréfié et titres en slab serif : un en-tête centré, des rangées numérotées et des fonds alternés pour un café de spécialité qui vend aussi ses grains.",
    brand: "Sillage Café",
    tokens: { colors: { primary: "#6b3d22", secondary: "#2d1c12", accent: "#b9852f", background: "#faf5ec", surface: "#ffffff", text: "#2a1d14", muted: "#6a5646" }, fonts: f("font.zilla-slab", "font.jost"), radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 }, h2: { size: 38, weight: 600, lineHeight: 1.15, letterSpacing: 0 } }, border: { width: 1, color: "#e6d9c6" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "sillage-torre", motifs: ["bokeh", "objects", "tiles"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Torréfaction à Lille, café au comptoir et grains à emporter.", cols: [["Le café", "Comptoir", "Les grains"], ["Pratique", "Atelier", "Venir"]] }],
    menu: [["Accueil", "/"], ["Comptoir", "/comptoir"], ["Les grains", "/grains"], ["Ateliers", "/ateliers"], ["Venir", "/venir"]], cta: ["Voir les grains", "/grains"],
    contact: { address: "18 rue des Tisserands, 59000 Lille", phone: "03 20 00 41 18", email: "bonjour@sillagecafe.example", hours: "Du lundi au vendredi, 8 h – 17 h ; week-end 9 h – 18 h", tagline: "Torréfié chaque semaine, servi à la minute." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Café de spécialité · Lille", title: "Du grain à la tasse, sans détour.", sub: "Nous torréfions chaque semaine de petits lots d'origines traçables et les préparons au comptoir en filtre, espresso ou cold brew.", cta: ["Voir les grains", "/grains"], cta2: ["Le comptoir", "/comptoir"] }],
        ["feat:rows", { eyebrow: "Notre méthode", title: "Trois étapes, une exigence", items: [{ t: "Choisir", x: "Des lots de producteurs suivis, dégustés à l'aveugle avant chaque achat." }, { t: "Torréfier", x: "Un petit tambour, des profils clairs qui laissent parler le fruit." }, { t: "Servir", x: "Moulu à la demande, extraction réglée chaque matin." }], bg: "token:surface" }],
        ["gal:cards", { title: "Au comptoir cette semaine", items: [{ t: "Éthiopie, lavé", tag: "Filtre", x: "Fleur d'oranger, pêche blanche." }, { t: "Colombie, honey", tag: "Espresso", x: "Cacao, caramel, orange." }, { t: "Cold brew maison", tag: "Glacé", x: "Infusé 18 heures." }] }],
        ["proof:quotes", { items: [{ q: "Le meilleur filtre de la ville, et l'accueil va avec.", n: "Margaux T.", r: "cliente fictive" }, { q: "J'y achète mes grains chaque samedi.", n: "Bastien R.", r: "client fictif" }, { q: "Une carte courte, tout est juste.", n: "Awa D.", r: "cliente fictive" }] }],
        ["cta:split", { title: "Un abonnement grains, sans engagement.", sub: "Un sachet de 250 g tous les quinze jours, à retirer au comptoir.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "comptoir", name: "Comptoir", blocks: [
        ph("Le comptoir", "Une carte courte, préparée à la commande."),
        ["feat:pricelist", { title: "Boissons (exemples)", items: [{ t: "Espresso", x: "Double extraction", price: "2,80 €" }, { t: "Flat white", x: "Lait entier ou végétal", price: "4,20 €" }, { t: "Filtre du jour", x: "V60 ou Chemex", price: "4,50 €" }, { t: "Cold brew", x: "Servi sur glace", price: "4,80 €" }] }],
        ["misc:menu", { title: "À grignoter", left: ["Sucré", [{ t: "Cookie noisette", x: "Chocolat 64 %", price: "3,20 €" }, { t: "Banana bread", x: "Beurre demi-sel", price: "3,80 €" }]], right: ["Salé", [{ t: "Toast avocat", x: "Citron, graines", price: "7,50 €" }, { t: "Croque maison", x: "Comté, jambon blanc", price: "8,00 €" }]] }],
        ["cta:band", { title: "Une pause à plusieurs ?", sub: "Nous réservons la grande table pour six personnes.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "grains", name: "Les grains", blocks: [
        ph("Les grains", "Sachets de 250 g, retrait au comptoir (démonstration, pas de vente en ligne)."),
        ["misc:product", { eyebrow: "Grains de la semaine", title: "Éthiopie Gedeb, lavé", price: "12,90 €", text: "Un café floral et délicat, torréfié clair. Idéal en filtre.", points: ["Fleur d'oranger, thé noir", "Lot traçable, 250 g", "Torréfié le lundi"], cta: "Réserver un sachet", url: "/contact", note: "Retrait au comptoir, paiement sur place." }],
        ["feat:checks", { title: "Comment l'infuser", cta: ["Voir l'atelier", "/ateliers"], items: [{ t: "15 g pour 250 ml d'eau" }, { t: "Eau à 93 °C" }, { t: "Mouture moyenne-fine" }, { t: "Temps total : 3 minutes" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Moulez-vous le café ?", x: "Oui, pour la méthode de votre choix." }, { t: "Combien de temps se conserve-t-il ?", x: "Idéalement un mois après torréfaction." }] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ph("Ateliers de dégustation"),
        ["misc:schedule", { title: "Samedi, atelier filtre", items: [{ d: "10 h", t: "Accueil", x: "Café de bienvenue." }, { d: "10 h 30", t: "Dégustation", x: "Trois origines en cupping." }, { d: "11 h 30", t: "Pratique", x: "Chacun prépare son filtre." }] }],
        ["feat:icons", { title: "Ce qui est inclus", items: [{ t: "Matériel prêté", x: "Balance, bouilloire, moulin.", icon: "settings" }, { t: "Un sachet offert", x: "À emporter chez vous.", icon: "heart" }] }],
        ["cta:card", { title: "Atelier de 8 personnes maximum", sub: "Tarif exemple : 35 €. Inscription par message.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver"),
        ["contact:map", { title: "Au coeur du Vieux-Lille", mapAddress: "18 rue des Tisserands, 59000 Lille" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – vendredi", "8 h – 17 h"], ["Samedi", "9 h – 18 h"], ["Dimanche", "9 h – 16 h"]] }],
        ["misc:faq", { items: [{ t: "Accepte-t-on les chiens ?", x: "Oui, en terrasse." }, { t: "Wifi ?", x: "Oui, jusqu'à 11 h en semaine." }] }],
      ] },
    ],
  },

  // 2. Boulangerie artisanale — blé, ocre
  {
    key: "levain-aube", name: "Levain & Aube", category: "restaurant", tags: ["naturel", "chaleureux"], siteType: "Boulangerie artisanale au levain",
    description: "Blé, ocre et farine : un titre serif lisible, des bandes de produits et des étapes de fabrication pour une boulangerie au levain naturel qui travaille de nuit.",
    brand: "Boulangerie Levain & Aube",
    tokens: { colors: { primary: "#8f5c00", secondary: "#f3e3bd", accent: "#3f6b3a", background: "#fffaf0", surface: "#f6ecd5", text: "#2f2410", muted: "#65532f" }, fonts: f("font.literata", "font.chivo"), radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 8 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.1, letterSpacing: -0.01 }, h2: { size: 36, weight: 700, lineHeight: 1.2, letterSpacing: 0 } }, border: { width: 1, color: "#e5d3a8" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "levain-aube", motifs: ["dunes", "rays", "plates"] },
    head: ["head:topbar", { info: "Fournée du matin dès 6 h 30", note: "Fermé le lundi" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Nos pains", "/pains"], ["Fabrication", "/fabrication"], ["Commander", "/commander"], ["Boutique", "/boutique"]], cta: ["Commander", "/commander"],
    contact: { address: "7 place du Marché, 49100 Angers", phone: "02 41 00 17 07", email: "four@levainaube.example", hours: "Du mardi au samedi, 6 h 30 – 19 h ; dimanche 7 h – 13 h", tagline: "Pétri la veille, cuit à l'aube." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Boulangerie au levain", title: "Le pain a besoin de temps.", sub: "Vingt-quatre heures de fermentation, des farines de meuniers locaux et un four à bois pour une croûte qui chante.", cta: ["Voir nos pains", "/pains"], cta2: ["Précommander", "/commander"] }],
        ["feat:strips", { title: "Chaque matin au fournil", items: [{ t: "Pain de campagne", x: "Farine de blé T80, longue pousse." }, { t: "Baguette de tradition", x: "Croustillante, mie alvéolée." }, { t: "Viennoiseries pur beurre", x: "Feuilletées à la main." }] }],
        ["proof:statsbar", { items: [["24 h", "de fermentation"], ["6", "farines locales"], ["4 h", "de four à bois"]] }],
        ["feat:alt", { title: "Du grain au comptoir", items: [{ t: "Le meunier", x: "Un moulin à vingt kilomètres, des blés anciens." }, { t: "Le fournil", x: "Pétrin lent, façonnage à la main." }] }],
        ["cta:image", { title: "Précommandez pour demain matin.", sub: "Retrait entre 7 h et 12 h.", cta: ["Précommander", "/commander"] }],
      ] },
      { key: "pains", name: "Nos pains", blocks: [
        ph("Nos pains", "Quelques références de démonstration."),
        ["gal:cards", { title: "Pains au levain", items: [{ t: "Campagne", tag: "Tous les jours", x: "Mie crémeuse, croûte épaisse." }, { t: "Seigle et noix", tag: "Du mercredi", x: "Dense et parfumé." }, { t: "Petit épeautre", tag: "Le samedi", x: "Goût de noisette." }] }],
        ["feat:pricelist", { title: "Prix indicatifs", items: [{ t: "Baguette de tradition", price: "1,40 €" }, { t: "Campagne 800 g", price: "4,60 €" }, { t: "Croissant pur beurre", price: "1,50 €" }, { t: "Pain au chocolat", price: "1,70 €" }] }],
        ["cta:band", { title: "Allergies ou régimes ?", sub: "Demandez-nous la liste des allergènes.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "fabrication", name: "Fabrication", blocks: [
        ph("De la farine à la croûte"),
        ["feat:steps", { title: "Le cycle de 24 heures", items: [{ t: "Le levain", x: "Rafraîchi à 16 h.", d: "16 h" }, { t: "Le pétrissage", x: "Lent, à la main puis au pétrin.", d: "20 h" }, { t: "La pousse", x: "Au froid, toute la nuit.", d: "Nuit" }, { t: "La cuisson", x: "Au four à bois dès l'aube.", d: "5 h" }] }],
        ["misc:story", { title: "Une équipe de quatre", paras: ["Camille Rouvière (cheffe boulangère fictive) a repris le fournil en cherchant le goût de son enfance.", "Chaque fournée porte la date de pétrissage."], image: "portrait-1" }],
        ["proof:big", { items: [{ q: "On reconnaît le pain les yeux fermés.", n: "Joël P.", r: "client fictif" }] }],
      ] },
      { key: "commander", name: "Commander", blocks: [
        ph("Précommande", "Pas de paiement en ligne : réglez au retrait."),
        ["feat:list2", { title: "Comment ça marche", items: [{ t: "Écrivez-nous avant 18 h" }, { t: "Indiquez le créneau de retrait" }, { t: "Confirmation par e-mail" }, { t: "Paiement au comptoir" }] }],
        ["contact:info", { title: "Votre commande", formTitle: "Un message suffit", formIntro: "Détaillez les pains souhaités.", cta: ["Envoyer", "/contact"] }],
      ] },
      { key: "boutique", name: "Boutique", blocks: [
        ph("L'épicerie du fournil"),
        ["gal:products", { title: "Produits de démonstration", items: [{ t: "Farine de blé T80", price: "3,90 €" }, { t: "Granola maison", price: "6,50 €" }, { t: "Confiture d'abricot", price: "5,20 €" }, { t: "Sac en toile", price: "9,00 €" }] }],
        ["misc:marquee", { items: ["Retrait au comptoir", "Produits locaux", "Fabriqué sur place"] }],
        ["cta:card", { title: "Catalogue de démonstration", sub: "Pas de vente en ligne : passez nous voir.", cta: ["Nous contacter", "/contact"] }],
      ] },
    ],
  },

  // 3. Pâtisserie — rose-prune
  {
    key: "choux-velours", name: "Choux Velours", category: "restaurant", tags: ["luxe", "editorial"], siteType: "Pâtisserie fine et salon de thé",
    description: "Crème, framboise écrasée et typographie Didone : une mise en page poster, des galeries de gâteaux et une boutique de démonstration pour une pâtisserie fine.",
    brand: "Maison Choux Velours",
    tokens: { colors: { primary: "#a8328f", secondary: "#3a1633", accent: "#d9a441", background: "#fdf6f4", surface: "#ffffff", text: "#2b1526", muted: "#6c4f66" }, fonts: f("font.bodoni-moda", "font.schibsted-grotesk"), radius: { sm: 0, md: 4, lg: 8, button: 0, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.05, letterSpacing: -0.01 }, h2: { size: 40, weight: 500, lineHeight: 1.12, letterSpacing: 0 } }, border: { width: 1, color: "#ecd5dc" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "choux-velours", motifs: ["blobs", "botanical", "plates"] },
    head: ["head:split", {}], foot: ["foot:newsletter", { title: "Les nouveautés de saison", sub: "Un message par mois, jamais plus.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Vitrine", "/vitrine"], ["Salon de thé", "/salon"], ["Sur commande", "/commande"], ["Contact", "/contact"]], cta: ["Commander un gâteau", "/commande"],
    contact: { address: "22 avenue des Tilleuls, 69006 Lyon", phone: "04 72 00 33 22", email: "douceurs@chouxvelours.example", hours: "Du mardi au dimanche, 9 h – 18 h 30", tagline: "Des gâteaux comme des bijoux." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { title: "Pâtisserie fine", sub: "Entremets, choux et tartes de saison, réalisés chaque matin à Lyon.", cta: ["Voir la vitrine", "/vitrine"], cta2: ["Commander", "/commande"] }],
        ["gal:wall", { title: "En vitrine", items: [{ t: "Choux vanille" }, { t: "Tarte framboise" }, { t: "Paris-Brest" }, { t: "Entremets cassis" }] }],
        ["feat:bento", { title: "Notre signature", items: [{ t: "Le chou craquelin", x: "Pâte croustillante, crème légère, vanille de Madagascar." }, { t: "Les entremets", x: "Cinq textures, un seul parfum." }, { t: "Les macarons", x: "Coques lisses, ganaches intenses." }], bg: "token:surface" }],
        ["proof:big", { items: [{ q: "Un gâteau d'anniversaire digne d'un bijou, et délicieux.", n: "Solène G.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Une pièce montée pour votre mariage ?", sub: "Dégustation sur rendez-vous.", cta: ["Prendre rendez-vous", "/commande"] }],
      ] },
      { key: "vitrine", name: "Vitrine", blocks: [
        ph("La vitrine", "Sélection de la saison."),
        ["gal:masonry", { items: [{ t: "Tarte citron meringuée" }, { t: "Éclair café" }, { t: "Fraisier" }, { t: "Millefeuille" }, { t: "Opéra" }, { t: "Saint-Honoré" }] }],
        ["feat:pricelist", { title: "Prix indicatifs", items: [{ t: "Chou à la vanille", price: "4,20 €" }, { t: "Éclair", price: "4,60 €" }, { t: "Entremets individuel", price: "6,40 €" }, { t: "Boîte de 6 macarons", price: "14,00 €" }] }],
        ["cta:split", { title: "Disponibilités du jour", sub: "Appelez-nous avant 11 h.", cta: ["Appeler", "/contact"] }],
      ] },
      { key: "salon", name: "Salon de thé", blocks: [
        ph("Le salon de thé"),
        ["misc:menu", { title: "Goûter", left: ["Thés et cafés", [{ t: "Thé noir fumé", x: "Théière 40 cl", price: "5,50 €" }, { t: "Chocolat chaud", x: "Chocolat 70 %", price: "5,80 €" }]], right: ["Assiettes", [{ t: "Assiette gourmande", x: "Trois mignardises", price: "9,50 €" }, { t: "Brunch du dimanche", x: "Sucré et salé", price: "24,00 €" }]] }],
        ["misc:hours", { title: "Horaires du salon", rows: [["Mardi – samedi", "9 h – 18 h 30"], ["Dimanche", "9 h – 17 h"]] }],
        ["misc:quote", { text: "Ici, on prend le temps de goûter.", by: "L'équipe" }],
      ] },
      { key: "commande", name: "Sur commande", blocks: [
        ph("Gâteaux sur commande", "Anniversaires, mariages, entreprises."),
        ["feat:steps", { title: "En quatre étapes", items: [{ t: "Le brief", x: "Vos envies, le nombre de convives." }, { t: "La proposition", x: "Dessin et devis sous 48 h." }, { t: "La dégustation", x: "Pour les mariages." }, { t: "Le retrait", x: "Boîte et conseils de conservation." }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Délai minimum ?", x: "Trois jours pour un gâteau, trois semaines pour une pièce montée." }, { t: "Régimes spéciaux ?", x: "Sans gluten possible sur demande." }] }],
        ["contact:cards", { title: "Écrivez-nous", cta: "Envoyer" }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:info", { title: "Nous écrire", formTitle: "Votre demande", formIntro: "Nous répondons sous 24 h.", cta: ["Envoyer", "/contact"] }],
        ["misc:text", { title: "Livraison", paras: ["Nous livrons dans le 6e arrondissement le samedi (démonstration)."] }],
      ] },
    ],
  },

  // 4. Bar à cocktails — sombre
  {
    key: "alambic-nuit", name: "Alambic de Nuit", category: "restaurant", tags: ["sombre", "audacieux"], siteType: "Bar à cocktails de création",
    description: "Nuit indigo, violet électrique et titres Abril Fatface : un thème sombre avec en-tête foncé, accueil en affiche et carte de cocktails pour un bar de création.",
    brand: "L'Alambic de Nuit",
    tokens: { colors: { primary: "#a78bfa", secondary: "#241a45", accent: "#f0b45b", background: "#120f1f", surface: "#1d1830", text: "#f1ecfb", muted: "#b8aed3" }, fonts: f("font.abril-fatface", "font.sora"), radius: { sm: 2, md: 6, lg: 10, button: 999, field: 6, card: 12 }, shadow: { card: "md", button: "none" }, type: { h1: { size: 72, weight: 400, lineHeight: 1.02, letterSpacing: -0.01 }, h2: { size: 42, weight: 400, lineHeight: 1.1, letterSpacing: 0 } }, border: { width: 1, color: "#352c57" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "pill" }, art: { seed: "alambic-nuit", motifs: ["bokeh", "mesh", "rays"] },
    head: ["head:dark", {}], foot: ["foot:big", { title: "L'Alambic" }],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Le bar", "/bar"], ["Soirées", "/soirees"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "3 passage des Lumières, 33000 Bordeaux", phone: "05 56 00 31 03", email: "bar@alambicnuit.example", hours: "Du mardi au samedi, 18 h – 2 h", tagline: "Des cocktails comme des histoires." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Bar à cocktails · Bordeaux", title: "La nuit se sert frappée.", sub: "Des créations signées, des spiritueux de petits producteurs et une ambiance de salon feutré jusqu'à 2 h.", cta: ["Voir la carte", "/carte"], cta2: ["Réserver", "/reserver"], stats: [["12", "créations"], ["80", "spiritueux"], ["2 h", "dernier service"]] }],
        ["gal:carousel", { title: "Les signatures", items: [{ t: "Smoke & Fig", x: "Whisky, figue, fumée" }, { t: "Violette Noire", x: "Gin, cassis, violette" }, { t: "Rhum Minuit", x: "Rhum ambré, café, cacao" }, { t: "Spritz Indigo", x: "Bitter, agrumes, bulles" }] }],
        ["feat:tabs", { title: "L'esprit de la maison", items: [{ t: "Création", x: "Une carte renouvelée chaque saison." }, { t: "Sourcing", x: "Producteurs indépendants, jus pressés." }, { t: "Sans alcool", x: "Quatre créations à la carte." }] }],
        ["proof:stats", { items: [["12", "créations"], ["4", "sans alcool"], ["3", "ans d'existence"]] }],
        ["cta:image", { title: "Réservez votre table.", sub: "Groupes jusqu'à douze personnes.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Prix indicatifs, exemples de démonstration."),
        ["misc:menu", { title: "Cocktails", left: ["Signatures", [{ t: "Smoke & Fig", x: "Whisky, figue, fumée", price: "13 €" }, { t: "Violette Noire", x: "Gin, cassis, violette", price: "12 €" }, { t: "Rhum Minuit", x: "Rhum ambré, café", price: "13 €" }]], right: ["Sans alcool", [{ t: "Jardin d'Hiver", x: "Thé, citron, romarin", price: "8 €" }, { t: "Pomme Fumée", x: "Pomme, épices", price: "8 €" }]] }],
        ["feat:pricelist", { title: "Assiettes à partager", items: [{ t: "Planche de charcuteries", price: "16 €" }, { t: "Olives marinées", price: "5 €" }, { t: "Fromages de chèvre", price: "14 €" }] }],
        ["cta:band", { title: "Une envie sur mesure ?", sub: "Dites-nous vos goûts, nous créerons.", cta: ["Au bar", "/bar"] }],
      ] },
      { key: "bar", name: "Le bar", blocks: [
        ph("Le bar"),
        ["misc:story", { title: "Deux associés, un alambic", paras: ["Léo Marsan et Inès Dray (fictifs) ont ouvert un bar où chaque verre a une histoire.", "La carte change quatre fois par an."], image: "portrait-3" }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Léo Marsan", r: "Barman, associé" }, { n: "Inès Dray", r: "Cheffe de bar" }, { n: "Tom Aubry", r: "Barback" }] }],
        ["proof:quotes", { items: [{ q: "Des cocktails justes et inventifs.", n: "Clara B.", r: "cliente fictive" }, { q: "L'ambiance parfaite d'un jeudi soir.", n: "Hugo N.", r: "client fictif" }] }],
      ] },
      { key: "soirees", name: "Soirées", blocks: [
        ph("Soirées et privatisation"),
        ["feat:cards", { title: "Au programme", items: [{ t: "Jeudi jazz", x: "Trio live dès 21 h.", icon: "star" }, { t: "Masterclass", x: "Un spiritueux, trois verres.", icon: "sparkles" }, { t: "Privatisation", x: "Jusqu'à 40 personnes.", icon: "users" }] }],
        ["price:tiers", { items: [{ t: "Soirée 20 personnes", price: "à partir de 600 €", f: ["Bar dédié", "Planches", "Barman"], cta: "Demander", url: "/reserver" }, { t: "Soirée 40 personnes", price: "à partir de 1 100 €", f: ["Cocktails signature", "DJ", "Planches"], cta: "Demander", url: "/reserver", hl: true }] }],
        ["cta:card", { title: "Un devis sous 48 h.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver"),
        ["contact:map", { title: "Au passage des Lumières", mapAddress: "3 passage des Lumières, 33000 Bordeaux" }],
        ["misc:hours", { title: "Horaires", rows: [["Mardi – jeudi", "18 h – 1 h"], ["Vendredi – samedi", "18 h – 2 h"]] }],
      ] },
    ],
  },

  // 5. Brasserie — marine
  {
    key: "zinc-et-sel", name: "Zinc & Sel", category: "restaurant", tags: ["classique", "editorial"], siteType: "Brasserie traditionnelle",
    description: "Bleu marine, crème et titres Baskerville : un bandeau de journal, des rangées de plats du jour et une carte complète pour une brasserie de quartier.",
    brand: "Brasserie Zinc & Sel",
    tokens: { colors: { primary: "#1d3f7a", secondary: "#10213f", accent: "#b8863b", background: "#f8f5ee", surface: "#ffffff", text: "#161c2a", muted: "#505a70" }, fonts: f("font.libre-baskerville", "font.cabin"), radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.12, letterSpacing: 0 }, h2: { size: 34, weight: 700, lineHeight: 1.2, letterSpacing: 0 } }, border: { width: 1, color: "#d9d3c2" } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "zinc-et-sel", motifs: ["tiles", "skyline", "plates"] },
    head: ["head:masthead", { dateline: "Service continu · Du lundi au dimanche" }], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Plat du jour", "/jour"], ["Groupes", "/groupes"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "1 place de la Gare, 37000 Tours", phone: "02 47 00 12 01", email: "table@zincetsel.example", hours: "Tous les jours, 11 h 30 – 23 h", tagline: "La cuisine de toujours, service continu." },
    social: ["facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Brasserie · Tours", title: "Le zinc, les nappes blanches et la cuisine du jour.", sub: "Plats mijotés, poissons de la criée et plateaux de fruits de mer, servis sans interruption.", cta: ["La carte", "/carte"], cta2: ["Réserver", "/reserver"] }],
        ["feat:rows", { eyebrow: "Les classiques", title: "Ce qu'on vient chercher", items: [{ t: "Le poireau vinaigrette", x: "Oeuf mimosa, moutarde à l'ancienne." }, { t: "L'entrecôte, sauce poivre", x: "Frites maison à volonté." }, { t: "L'île flottante", x: "Crème anglaise, caramel." }] }],
        ["proof:logos", { title: "Nos producteurs (exemples)", items: ["Boucherie Delage", "Criée de l'Atlantique", "Maraîchers du Cher", "Fromagerie Valmy"] }],
        ["gal:strip", { title: "À table", items: [{ t: "Plateau" }, { t: "Entrecôte" }, { t: "Soupe" }, { t: "Tarte" }, { t: "Zinc" }] }],
        ["cta:split", { title: "Une table pour ce midi ?", sub: "Réservation recommandée le week-end.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte"),
        ["misc:menu", { title: "Carte de saison", left: ["Entrées", [{ t: "Poireau vinaigrette", x: "Oeuf mimosa", price: "9 €" }, { t: "Soupe de poisson", x: "Rouille, croûtons", price: "11 €" }]], right: ["Plats", [{ t: "Entrecôte", x: "Sauce poivre, frites", price: "26 €" }, { t: "Sole meunière", x: "Pommes vapeur", price: "34 €" }]] }],
        ["feat:pricelist", { title: "Desserts", items: [{ t: "Île flottante", price: "8 €" }, { t: "Tarte Tatin", price: "9 €" }, { t: "Mousse au chocolat", price: "8 €" }] }],
        ["cta:band", { title: "Formule du midi : 22 €", sub: "Entrée-plat ou plat-dessert, du lundi au vendredi.", cta: ["Plat du jour", "/jour"] }],
      ] },
      { key: "jour", name: "Plat du jour", blocks: [
        ph("Plat du jour", "Ardoise renouvelée chaque matin."),
        ["misc:schedule", { title: "La semaine (exemple)", items: [{ d: "Lundi", t: "Blanquette de veau", x: "Riz pilaf." }, { d: "Mardi", t: "Hachis parmentier", x: "Salade verte." }, { d: "Mercredi", t: "Dos de cabillaud", x: "Beurre blanc." }, { d: "Jeudi", t: "Coq au vin", x: "Pommes grenailles." }] }],
        ["misc:quote", { text: "Ce que la criée nous donne, nous le cuisinons.", by: "Le chef" }],
        ["feat:checks", { title: "Formule midi", cta: ["Réserver", "/reserver"], items: [{ t: "Plat du jour" }, { t: "Café offert" }, { t: "Service rapide" }] }],
      ] },
      { key: "groupes", name: "Groupes", blocks: [
        ph("Groupes et repas d'affaires"),
        ["feat:icons", { title: "Nos salons", items: [{ t: "Salle du fond", x: "Jusqu'à 30 convives.", icon: "users" }, { t: "Terrasse", x: "Chauffée en hiver.", icon: "sun" }, { t: "Menu groupe", x: "À partir de 34 €.", icon: "list" }] }],
        ["proof:quotes", { items: [{ q: "Un repas d'équipe sans faute.", n: "Delphine A.", r: "cliente fictive" }] }],
        ["cta:card", { title: "Devis sous 24 h", cta: ["Écrire", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver"),
        ["contact:cards", { title: "Réserver une table", cta: "Envoyer" }],
        ["misc:hours", { title: "Horaires", rows: [["Tous les jours", "11 h 30 – 23 h"]] }],
      ] },
    ],
  },

  // 6. Traiteur événementiel — bordeaux
  {
    key: "nappe-blanche", name: "Nappe Blanche", category: "restaurant", tags: ["luxe", "classique"], siteType: "Traiteur événementiel et réceptions",
    description: "Bordeaux profond, ivoire et Cormorant : un en-tête fin, des formules de réception et des étapes de préparation pour un traiteur de mariages et d'événements d'entreprise.",
    brand: "Nappe Blanche Traiteur",
    tokens: { colors: { primary: "#8b1a35", secondary: "#3a0f1c", accent: "#b99350", background: "#fbf7f3", surface: "#f2e9e3", text: "#271217", muted: "#664a50" }, fonts: f("font.cormorant-garamond", "font.plus-jakarta-sans"), radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 66, weight: 500, lineHeight: 1.03, letterSpacing: 0 }, h2: { size: 42, weight: 500, lineHeight: 1.1, letterSpacing: 0 } }, border: { width: 1, color: "#e1d0c8" } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "nappe-blanche", motifs: ["arches", "botanical", "bokeh"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Traiteur de réceptions en Occitanie, de 20 à 400 convives.", cols: [["Événements", "Mariages", "Entreprises"], ["Infos", "Devis", "Contact"]] }],
    menu: [["Accueil", "/"], ["Mariages", "/mariages"], ["Entreprises", "/entreprises"], ["Formules", "/formules"], ["Devis", "/devis"]], cta: ["Demander un devis", "/devis"],
    contact: { address: "12 chemin des Vignes, 34000 Montpellier", phone: "04 67 00 28 12", email: "devis@nappeblanche.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Votre réception, de la première bouchée au dernier verre." },
    social: ["instagram", "linkedin"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Traiteur de réceptions · Montpellier", title: "Une table à la hauteur de votre événement.", sub: "Cocktails dînatoires, buffets et repas assis, élaborés avec les producteurs de l'Hérault.", cta: ["Demander un devis", "/devis"], cta2: ["Nos formules", "/formules"] }],
        ["proof:stats", { items: [["300+", "réceptions"], ["400", "convives maximum"], ["10 ans", "d'expérience"]] }],
        ["feat:alt", { title: "Deux univers", items: [{ t: "Mariages", x: "Du vin d'honneur au dessert.", link: ["Voir", "/mariages"] }, { t: "Entreprises", x: "Séminaires et lancements.", link: ["Voir", "/entreprises"] }] }],
        ["gal:featured", { title: "Nos réalisations", items: [{ t: "Pièce montée" }, { t: "Cocktail estival" }, { t: "Buffet" }, { t: "Verrines" }], bg: "token:surface" }],
        ["cta:card", { title: "Un premier échange offert.", sub: "Nous préparons une proposition personnalisée.", cta: ["Demander un devis", "/devis"] }],
      ] },
      { key: "mariages", name: "Mariages", blocks: [
        ph("Mariages"),
        ["feat:steps", { title: "Le parcours", items: [{ t: "Rencontre", x: "Vos goûts, votre lieu.", d: "J-12 mois" }, { t: "Dégustation", x: "Trois menus à goûter.", d: "J-6 mois" }, { t: "Mise au point", x: "Plan de salle, horaires.", d: "J-1 mois" }, { t: "Le grand jour", x: "Équipe de salle dédiée.", d: "J" }] }],
        ["proof:big", { items: [{ q: "Nos invités parlent encore du buffet.", n: "Élodie & Marc", r: "clients fictifs" }] }],
        ["misc:faq", { title: "Questions", items: [{ t: "Fournissez-vous la vaisselle ?", x: "Oui, linge, verrerie et vaisselle inclus." }] }],
      ] },
      { key: "entreprises", name: "Entreprises", blocks: [
        ph("Événements d'entreprise"),
        ["feat:grid-icons", { title: "Pour vos équipes", items: [{ t: "Plateaux-repas", x: "Livrés sur site.", icon: "briefcase" }, { t: "Cocktails", x: "Inaugurations, vœux.", icon: "sparkles" }, { t: "Séminaires", x: "Pause et déjeuner.", icon: "users" }] }],
        ["feat:compare", { title: "Formules", rows: [["", "Cocktail", "Repas assis"], ["Dès", "28 € / pers.", "55 € / pers."], ["Durée", "2 h", "4 h"], ["Service", "oui", "oui"]] }],
        ["cta:band", { title: "Besoin d'un devis rapide ?", cta: ["Écrire", "/devis"] }],
      ] },
      { key: "formules", name: "Formules", blocks: [
        ph("Formules"),
        ["price:tiers", { items: [{ t: "Cocktail", price: "dès 28 €", period: "par personne", f: ["12 pièces salées", "4 sucrées", "Service"], cta: "Demander", url: "/devis" }, { t: "Buffet", price: "dès 42 €", period: "par personne", f: ["Entrées, plats", "Desserts", "Vaisselle"], cta: "Demander", url: "/devis", hl: true }, { t: "Repas assis", price: "dès 55 €", period: "par personne", f: ["Trois services", "Maître d'hôtel", "Vins"], cta: "Demander", url: "/devis" }] }],
        ["misc:text", { title: "À savoir", paras: ["Tarifs d'exemple, hors boissons. Devis personnalisé sur demande."] }],
        ["proof:logos", { title: "Lieux partenaires (fictifs)", items: ["Domaine des Pins", "Mas du Lez", "Château Verrière"] }],
      ] },
      { key: "devis", name: "Devis", blocks: [
        ph("Demande de devis"),
        ["contact:info", { title: "Parlez-nous de votre événement", formTitle: "Votre projet", formIntro: "Date, lieu, nombre de convives.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Disponibilités", rows: [["Lundi – vendredi", "9 h – 18 h"]] }],
      ] },
    ],
  },

  // 7. Food-truck — turquoise/sombre
  {
    key: "bitume-gourmand", name: "Bitume Gourmand", category: "restaurant", tags: ["audacieux", "ludique"], siteType: "Food-truck de street-food",
    description: "Gris bitume, turquoise vif et titres Anton en capitales : un en-tête latéral, une affiche d'accueil et un calendrier de tournées pour un camion de street-food.",
    brand: "Bitume Gourmand",
    tokens: { colors: { primary: "#4fd1c5", secondary: "#f6c945", accent: "#ff6b4a", background: "#1a1d21", surface: "#252a30", text: "#f4f6f7", muted: "#b6bec6" }, fonts: f("font.anton", "font.onest"), radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 400, lineHeight: 1.0, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 40, weight: 400, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" } }, border: { width: 2, color: "#39414a" } },
    dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "bitume-gourmand", motifs: ["halftone", "rays", "objects"] },
    head: ["head:side", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Le menu", "/menu"], ["Où est le camion", "/tournee"], ["Événements", "/evenements"], ["Contact", "/contact"]], cta: ["Où on est ?", "/tournee"],
    contact: { address: "Atelier : zone artisanale des Quatre Chemins, 44800 Saint-Herblain", phone: "06 00 00 44 18", email: "salut@bitumegourmand.example", hours: "Tournées du mardi au dimanche, voir le planning", tagline: "Du burger, des tacos, du bruit." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Food-truck · Nantes", title: "Le camion qui arrive avec l'appétit.", sub: "Burgers de bœuf fermier, tacos grillés et frites maison, cuisinés devant vous.", cta: ["Où on est ?", "/tournee"], cta2: ["Le menu", "/menu"] }],
        ["misc:marquee", { items: ["Frites maison", "Bœuf fermier", "Sauces faites ici", "Options végé"] }],
        ["feat:numbered", { title: "Trois best-sellers", items: [{ t: "Le Bitume", x: "Double bœuf, cheddar, oignons confits." }, { t: "Le Tacos Braise", x: "Poulet mariné, sauce fumée." }, { t: "La Végé Nuit", x: "Galette de pois chiches, houmous." }] }],
        ["gal:wall", { items: [{ t: "Burger" }, { t: "Tacos" }, { t: "Frites" }, { t: "Dessert" }] }],
        ["cta:band", { title: "Un événement ? On vient.", cta: ["Nous inviter", "/evenements"] }],
      ] },
      { key: "menu", name: "Le menu", blocks: [
        ph("Le menu", "Prix indicatifs."),
        ["feat:pricelist", { title: "Burgers et tacos", items: [{ t: "Le Bitume", x: "Double bœuf, cheddar", price: "11,50 €" }, { t: "Le Tacos Braise", x: "Poulet, sauce fumée", price: "10,00 €" }, { t: "La Végé Nuit", x: "Pois chiches, houmous", price: "10,00 €" }, { t: "Frites maison", price: "3,50 €" }] }],
        ["misc:menu", { title: "Formules", left: ["Menus", [{ t: "Menu burger", x: "Burger, frites, boisson", price: "14,50 €" }, { t: "Menu tacos", x: "Tacos, frites, boisson", price: "13,00 €" }]], right: ["Suppléments", [{ t: "Bacon", price: "1,50 €" }, { t: "Fromage", price: "1,00 €" }]] }],
        ["cta:split", { title: "Commande à emporter", sub: "Passez-nous un message avant la tournée.", cta: ["Écrire", "/contact"] }],
      ] },
      { key: "tournee", name: "Où est le camion", blocks: [
        ph("Où est le camion ?", "Planning de démonstration."),
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Mardi", t: "Place Royale", x: "11 h 30 – 14 h 30" }, { d: "Jeudi", t: "Parc technologique", x: "11 h 30 – 14 h" }, { d: "Vendredi", t: "Quai des Chantiers", x: "18 h – 22 h" }, { d: "Dimanche", t: "Marché de Talensac", x: "11 h – 15 h" }] }],
        ["feat:steps", { title: "Le rythme d'une journée", items: [{ t: "Marché", x: "Courses du matin.", d: "7 h" }, { t: "Préparation", x: "Sauces, viandes.", d: "9 h" }, { t: "Service", x: "On ouvre.", d: "11 h 30" }] }],
        ["cta:card", { title: "Suivez-nous", sub: "Le lieu du jour est publié chaque matin.", cta: ["Contact", "/contact"] }],
      ] },
      { key: "evenements", name: "Événements", blocks: [
        ph("Privatiser le camion"),
        ["price:tiers", { items: [{ t: "Mariage / anniversaire", price: "dès 12 € / pers.", f: ["50 à 200 convives", "Deux menus", "Service 2 h"], cta: "Demander", url: "/contact" }, { t: "Entreprise", price: "dès 14 € / pers.", f: ["Menu complet", "Boisson comprise"], cta: "Demander", url: "/contact", hl: true }] }],
        ["proof:quotes", { items: [{ q: "Le camion a fait l'unanimité à notre fête d'été.", n: "Karim L.", r: "client fictif" }, { q: "Rapide, généreux, drôle.", n: "Lucie M.", r: "cliente fictive" }] }],
        ["misc:faq", { items: [{ t: "Faut-il de l'électricité ?", x: "Non, le camion est autonome." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact"),
        ["contact:cards", { title: "Parlons-en", cta: "Envoyer" }],
        ["misc:hours", { title: "Tournées", rows: [["Mardi – vendredi", "Midi"], ["Vendredi – samedi", "Soir"]] }],
      ] },
    ],
  },

  // 8. Glacier — pistache
  {
    key: "boule-pistache", name: "Boule Pistache", category: "restaurant", tags: ["ludique", "chaleureux"], siteType: "Glacier artisanal",
    description: "Vert pistache, crème et titres Righteous arrondis : un bandeau collage, une galerie de parfums et un carnet de saisons pour un glacier artisanal joyeux.",
    brand: "Glacier Boule Pistache",
    tokens: { colors: { primary: "#4e7a14", secondary: "#e6f0c8", accent: "#e0527a", background: "#fffdf4", surface: "#f4f7e4", text: "#22301a", muted: "#556247" }, fonts: f("font.righteous", "font.quicksand"), radius: { sm: 8, md: 14, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.05, letterSpacing: 0 }, h2: { size: 38, weight: 400, lineHeight: 1.12, letterSpacing: 0 } }, border: { width: 2, color: "#d5e3ab" } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "boule-pistache", motifs: ["blobs", "objects", "dunes"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "Boule Pistache" }],
    menu: [["Accueil", "/"], ["Les parfums", "/parfums"], ["Cornets & coupes", "/coupes"], ["Fêtes", "/fetes"], ["Venir", "/venir"]], cta: ["Les parfums", "/parfums"],
    contact: { address: "5 quai des Pêcheurs, 17000 La Rochelle", phone: "05 46 00 55 05", email: "glaces@boulepistache.example", hours: "Tous les jours d'avril à octobre, 12 h – 22 h", tagline: "Des glaces faites ici, avec du vrai lait." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Glacier artisanal · La Rochelle", title: "Des boules qui rendent heureux.", sub: "Vingt parfums fabriqués chaque matin avec du lait fermier, des fruits de saison et de la pistache de Sicile.", cta: ["Les parfums", "/parfums"], cta2: ["Cornets et coupes", "/coupes"] }],
        ["gal:coursecards", { title: "Les stars de la vitrine", items: [{ t: "Pistache de Sicile", tag: "Crémeux", price: "3,20 €", x: "Notre best-seller.", cta: ["Voir", "/parfums"] }, { t: "Fraise gariguette", tag: "Fruité", price: "3,20 €", x: "Sorbet pur fruit.", cta: ["Voir", "/parfums"] }, { t: "Caramel beurre salé", tag: "Gourmand", price: "3,20 €", x: "Éclats de fleur de sel.", cta: ["Voir", "/parfums"] }] }],
        ["feat:grid-icons", { title: "Pourquoi c'est bon", items: [{ t: "Lait fermier", x: "Collecté à 30 km.", icon: "heart" }, { t: "Fruits de saison", x: "Pas de purée industrielle.", icon: "sun" }, { t: "Fait chaque jour", x: "Pas de stock.", icon: "clock" }] }],
        ["proof:quotes", { items: [{ q: "La meilleure pistache de la côte.", n: "Nina C.", r: "cliente fictive" }, { q: "Les enfants réclament le parfum du jour.", n: "Rémi D.", r: "client fictif" }] }],
        ["cta:image", { title: "Un anniversaire ?", sub: "Bacs de glace et animations sur réservation.", cta: ["En savoir plus", "/fetes"] }],
      ] },
      { key: "parfums", name: "Les parfums", blocks: [
        ph("Les parfums", "Une vingtaine, qui changent avec les saisons."),
        ["gal:grid", { items: [{ t: "Vanille bourbon" }, { t: "Chocolat noir 70 %" }, { t: "Citron vert" }, { t: "Mangue" }, { t: "Noisette" }, { t: "Pistache" }] }],
        ["feat:tabs", { title: "Par famille", items: [{ t: "Crèmes", x: "Vanille, caramel, noisette, café." }, { t: "Sorbets", x: "Fraise, citron, mangue, framboise." }, { t: "Sans lait", x: "Coco, chocolat, fruits de la passion." }] }],
        ["cta:band", { title: "Une allergie ?", sub: "La liste des allergènes est affichée à la vitrine.", cta: ["Nous contacter", "/venir"] }],
      ] },
      { key: "coupes", name: "Cornets & coupes", blocks: [
        ph("Cornets et coupes"),
        ["feat:pricelist", { title: "Tarifs indicatifs", items: [{ t: "Cornet une boule", price: "3,20 €" }, { t: "Cornet deux boules", price: "5,50 €" }, { t: "Coupe Pistache", x: "Trois boules, crème fouettée", price: "8,50 €" }, { t: "Milk-shake", price: "6,00 €" }] }],
        ["gal:featured", { title: "Les coupes signature", items: [{ t: "Coupe Pistache" }, { t: "Sundae caramel" }, { t: "Banana split" }, { t: "Affogato" }] }],
        ["misc:quote", { text: "Deux boules, c'est raisonnable.", by: "La maison" }],
      ] },
      { key: "fetes", name: "Fêtes", blocks: [
        ph("Fêtes et bacs à emporter"),
        ["price:tiers", { items: [{ t: "Bac 1 litre", price: "14 €", f: ["Deux parfums", "Prêt en 24 h"], cta: "Réserver", url: "/venir" }, { t: "Anniversaire", price: "dès 90 €", f: ["Dix enfants", "Animation", "Gâteau glacé"], cta: "Réserver", url: "/venir", hl: true }] }],
        ["feat:accordion", { title: "Questions", items: [{ t: "Pouvez-vous livrer ?", x: "Non, retrait à la boutique." }] }],
        ["cta:card", { title: "Un devis, vite", cta: ["Écrire", "/venir"] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver"),
        ["contact:map", { title: "Sur le port", mapAddress: "5 quai des Pêcheurs, 17000 La Rochelle" }],
        ["misc:hours", { title: "Horaires d'été", rows: [["Tous les jours", "12 h – 22 h"]] }],
      ] },
    ],
  },

  // 9. Bar à jus et brunch — vert
  {
    key: "presse-matin", name: "Presse du Matin", category: "restaurant", tags: ["naturel", "moderne"], siteType: "Bar à jus et brunch",
    description: "Vert frais, blanc cassé et titres Ibarra Real Nova : un accueil en bandes empilées, des onglets de jus et des tarifs de brunch pour un bar à jus du week-end.",
    brand: "Presse du Matin",
    tokens: { colors: { primary: "#2b7a35", secondary: "#e3f1dc", accent: "#e8892e", background: "#fbfdf8", surface: "#eef6e8", text: "#17261a", muted: "#4b5f4d" }, fonts: f("font.ibarra-real-nova", "font.lexend"), radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 18 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 600, lineHeight: 1.08, letterSpacing: -0.01 }, h2: { size: 36, weight: 600, lineHeight: 1.15, letterSpacing: 0 } }, border: { width: 1, color: "#cfe3c6" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "presse-matin", motifs: ["botanical", "waves", "bokeh"] },
    head: ["head:bar", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Les jus", "/jus"], ["Brunch", "/brunch"], ["Cures", "/cures"], ["Venir", "/venir"]], cta: ["Réserver le brunch", "/brunch"],
    contact: { address: "9 rue des Halles, 31000 Toulouse", phone: "05 61 00 90 09", email: "salut@pressematin.example", hours: "Du mercredi au dimanche, 8 h 30 – 16 h", tagline: "Pressé à froid, servi frais." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Bar à jus et brunch · Toulouse", title: "Le matin commence par un fruit.", sub: "Jus pressés à froid, bowls, tartines et brunch du week-end dans une salle claire pleine de plantes.", cta: ["Les jus", "/jus"], cta2: ["Brunch", "/brunch"], stats: [["12", "jus pressés"], ["100 %", "fruits frais"], ["3", "brunchs"]] }],
        ["feat:tabs", { title: "À la carte", items: [{ t: "Jus", x: "Pressés à froid, sans sucre ajouté." }, { t: "Bowls", x: "Açaï, granola, fruits frais." }, { t: "Tartines", x: "Pain au levain, garnitures de saison." }] }],
        ["gal:masonry", { title: "En images", items: [{ t: "Jus vert" }, { t: "Bowl" }, { t: "Pancakes" }, { t: "Tartine" }] }],
        ["feat:checks", { title: "Notre engagement", cta: ["Voir les cures", "/cures"], items: [{ t: "Fruits de producteurs locaux" }, { t: "Bouteilles consignées" }, { t: "Options véganes" }] }],
        ["cta:split", { title: "Brunch du week-end : réservez.", sub: "Deux services, 10 h et 12 h 30.", cta: ["Réserver", "/brunch"] }],
      ] },
      { key: "jus", name: "Les jus", blocks: [
        ph("Les jus"),
        ["feat:pricelist", { title: "Pressés à froid (exemples)", items: [{ t: "Vert Vif", x: "Pomme, concombre, gingembre", price: "6,50 €" }, { t: "Soleil Levant", x: "Orange, carotte, curcuma", price: "6,50 €" }, { t: "Rose Pivoine", x: "Betterave, pomme, citron", price: "6,50 €" }, { t: "Shot de gingembre", price: "3,00 €" }] }],
        ["feat:bento", { title: "Les plus demandés", items: [{ t: "Vert Vif", x: "Le plus frais." }, { t: "Soleil Levant", x: "Vitaminé." }, { t: "Rose Pivoine", x: "Terreux et doux." }] }],
        ["cta:band", { title: "Une cure de trois jours ?", cta: ["Voir les cures", "/cures"] }],
      ] },
      { key: "brunch", name: "Brunch", blocks: [
        ph("Brunch du week-end", "Samedi et dimanche, sur réservation."),
        ["price:tiers", { items: [{ t: "Brunch Vert", price: "24 €", f: ["Jus pressé", "Boisson chaude", "Plat salé et sucré"] , cta: "Réserver", url: "/venir" }, { t: "Brunch Gourmand", price: "29 €", f: ["Jus pressé", "Boisson chaude", "Oeufs, pancakes, bowl"], cta: "Réserver", url: "/venir", hl: true }] }],
        ["misc:menu", { title: "À la carte", left: ["Salé", [{ t: "Oeufs bénédicte", x: "Pain au levain", price: "13 €" }, { t: "Avocado toast", x: "Graines", price: "11 €" }]], right: ["Sucré", [{ t: "Pancakes", x: "Sirop d'érable", price: "10 €" }, { t: "Bowl açaï", x: "Granola", price: "10 €" }]] }],
        ["proof:quotes", { items: [{ q: "Le brunch le plus lumineux de Toulouse.", n: "Sarah F.", r: "cliente fictive" }] }],
      ] },
      { key: "cures", name: "Cures", blocks: [
        ph("Cures de jus"),
        ["feat:steps", { title: "Comment ça marche", items: [{ t: "Choix", x: "1, 3 ou 5 jours.", d: "J-3" }, { t: "Retrait", x: "Bouteilles consignées.", d: "J-1" }, { t: "La cure", x: "Six jus par jour.", d: "J" }] }],
        ["misc:text", { title: "Précautions", paras: ["Cette offre ne remplace pas un avis médical. Demandez conseil à un professionnel de santé en cas de doute."] }],
        ["feat:compare", { title: "Formules", rows: [["", "1 jour", "3 jours"], ["Jus", "6", "18"], ["Prix", "39 €", "105 €"]] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver"),
        ["contact:info", { title: "Passez nous voir", formTitle: "Réserver", formIntro: "Indiquez la date et le nombre de convives.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: [["Mercredi – vendredi", "8 h 30 – 15 h"], ["Samedi – dimanche", "9 h – 16 h"]] }],
      ] },
    ],
  },
];
