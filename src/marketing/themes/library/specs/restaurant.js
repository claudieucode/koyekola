// Restaurants, cafés et gastronomie (8 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];
const week = (a, b, c) => [["Lundi", a], ["Mardi", a], ["Mercredi", a], ["Jeudi", b], ["Vendredi", b], ["Samedi", c], ["Dimanche", c === "Fermé" ? "Fermé" : c]];

module.exports = [
  // 1. SAVANE — terre et ocre, cuisine d'inspiration africaine
  {
    key: "savane", name: "Savane", category: "restaurant", tags: ["chaleureux", "naturel"], siteType: "Restaurant d'inspiration africaine", featured: true,
    description: "Tons de terre et d'ocre, titres serif chaleureux et grandes photos : un restaurant de cuisine d'inspiration africaine qui met la carte et la réservation au premier plan.",
    brand: "Maison Savane",
    tokens: { colors: { primary: "#b45309", secondary: "#3b2412", accent: "#4d7c0f", background: "#fbf5ea", surface: "#fffdf8", text: "#2a1b0e", muted: "#6f5a45" }, fonts: { heading: "font.fraunces", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 6, md: 10, lg: 16, button: 999, field: 10, card: 14 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e6d6bd" } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "soft" }, art: { seed: "savane", motifs: ["dunes", "botanical", "rays"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Cuisine de partage d'inspiration ouest-africaine, braisée, épicée et généreuse, dans une salle chaleureuse.", cols: [["La maison", "Notre histoire", "La carte", "Galerie"], ["Pratique", "Réserver", "Horaires", "Privatisation"]] }],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Notre histoire", "/histoire"], ["Galerie", "/galerie"], ["Réserver", "/reserver"]], cta: ["Réserver une table", "/reserver"],
    contact: { address: "18 avenue des Baobabs, 69003 Lyon", phone: "04 78 00 12 34", email: "table@savane.example", hours: "Du mardi au dimanche, 12 h – 14 h 30 et 19 h – 22 h 30", tagline: "Braises, épices et partage." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Cuisine d'inspiration ouest-africaine", title: "Une table qui sent la braise et les épices.", sub: "Poulet yassa, thiéboudienne du jour, bananes plantain dorées : des plats à partager, préparés chaque matin avec des produits de saison.", cta: ["Réserver une table", "/reserver"], cta2: ["Voir la carte", "/carte"] }],
        ["feat:icons", { eyebrow: "L'esprit de la maison", title: "Manger ensemble, simplement", items: [{ icon: "heart", t: "Cuisine de partage", x: "De grands plats posés au centre, chacun se sert : on mange comme à la maison." }, { icon: "sun", t: "Épices fraîches", x: "Mélanges moulus chaque semaine : gingembre, piment, cumin, graines de néré." }, { icon: "users", t: "Tablées et fêtes", x: "Une salle voûtée pour dix à trente convives, anniversaires et repas d'équipe." }] }],
        ["gal:featured", { eyebrow: "À la carte cette saison", title: "Quatre plats que l'on vous recommande", items: [{ t: "Poulet yassa" }, { t: "Mafé d'agneau" }, { t: "Thiéboudienne" }, { t: "Dessert du jour" }], bg: "token:surface" }],
        ["proof:quotes", { eyebrow: "Livre d'or", title: "Ils sont passés à table", items: [{ q: "Des saveurs franches, un service aux petits soins.", n: "Awa K.", r: "cliente fictive" }, { q: "Le yassa est une merveille, les portions sont généreuses.", n: "Julien P.", r: "client fictif" }, { q: "Parfait pour notre repas d'anniversaire à douze.", n: "Mariam S.", r: "cliente fictive" }] }],
        ["cta:image", { title: "Une table vous attend ce week-end.", sub: "Réservez en ligne ou par téléphone, jusqu'à la veille à midi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Cuisine maison, produits frais, plats à partager."),
        ["misc:menu", { eyebrow: "Carte de la saison", title: "Du feu à l'assiette", intro: "Tous nos plats peuvent être partagés. Prix nets, en euros (exemples).", left: ["Entrées", [{ t: "Accras de morue", x: "Sauce piquante maison", price: "8 €" }, { t: "Salade de mangue verte", x: "Cacahuètes grillées, citron vert", price: "9 €" }, { t: "Pastels au bœuf", x: "Trio de sauces", price: "9 €" }]], right: ["Plats", [{ t: "Poulet yassa", x: "Oignons confits, citron, riz parfumé", price: "18 €" }, { t: "Mafé d'agneau", x: "Sauce arachide, patate douce", price: "21 €" }, { t: "Thiéboudienne", x: "Poisson du marché, légumes, riz rouge", price: "22 €" }, { t: "Plantain braisé", x: "Option végétarienne, sauce tomate pimentée", price: "15 €" }]] }],
        ["feat:pricelist", { title: "Desserts et boissons", items: [{ t: "Thiakry", x: "Millet, crème de coco, vanille", price: "7 €" }, { t: "Gâteau au gingembre", x: "Sirop d'hibiscus", price: "8 €" }, { t: "Bissap maison", x: "Hibiscus, menthe, 25 cl", price: "4 €" }, { t: "Jus de gingembre", x: "Pressé le matin", price: "4 €" }] }],
        ["cta:band", { title: "Menu du déjeuner à 19 €", sub: "Plat du jour, dessert et boisson, du mardi au vendredi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "histoire", name: "Notre histoire", blocks: [
        ph("Notre histoire"),
        ["misc:story", { eyebrow: "La maison", title: "Une cuisine apprise auprès de nos grands-mères", paras: ["Savane est née de recettes de famille rapportées de Dakar et d'Abidjan, adaptées aux producteurs de la région lyonnaise.", "Nous cuisinons à la braise et à la marmite, avec des épices moulues sur place et des légumes livrés trois fois par semaine."], image: "portrait-3" }],
        ["feat:numbered", { title: "Trois promesses", items: [{ t: "Du frais", x: "Pas de surgelé : le menu change selon l'arrivage." }, { t: "Du fait maison", x: "Sauces, pains et desserts préparés chaque matin." }, { t: "De l'accueil", x: "Chaque table est servie comme on reçoit des amis." }] }],
        ["proof:team", { eyebrow: "La brigade", title: "Ceux qui font la maison", items: [{ n: "Fatou Diagne", r: "Cheffe (fictive)" }, { n: "Moussa Keita", r: "Maître d'hôtel" }, { n: "Léa Armand", r: "Pâtisserie" }] }],
      ] },
      { key: "galerie", name: "Galerie", blocks: [
        ph("Galerie", "La salle, les plats, les soirées."),
        ["gal:masonry", { title: "Dans l'assiette et autour", items: [{ t: "La salle voûtée" }, { t: "Le grill" }, { t: "Les épices" }, { t: "Les desserts" }, { t: "La terrasse" }, { t: "Le bar" }] }],
        ["gal:strip", { title: "Instants de service", items: [{ t: "Dressage" }, { t: "Braises" }, { t: "Boissons" }, { t: "Pains" }, { t: "Salle" }] }],
        ["cta:split", { title: "Envie de privatiser la salle ?", sub: "Jusqu'à trente convives, menu sur mesure.", cta: ["Nous contacter", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver une table", "Par téléphone ou via le formulaire ci-dessous."),
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Lundi", "Fermé"], ["Mardi – Vendredi", "12 h – 14 h 30 · 19 h – 22 h 30"], ["Samedi", "12 h – 15 h · 19 h – 23 h"], ["Dimanche", "12 h – 15 h"]] }],
        ["contact:map", { title: "Nous trouver", mapAddress: "18 avenue des Baobabs, 69003 Lyon" }],
      ] },
    ],
  },

  // 2. BRAISE NORD — grill sombre, capitales condensées
  {
    key: "braise-nord", name: "Braise Nord", category: "restaurant", tags: ["sombre", "audacieux"], siteType: "Grill et steakhouse", isNew: true,
    description: "Grill nocturne en noir charbon et orange braise : capitales condensées, affiche en plein écran et blocs massifs pour une adresse de viandes maturées.",
    brand: "Braise Nord",
    tokens: { colors: { primary: "#e4572e", secondary: "#0d0a08", accent: "#f2a541", background: "#15110e", surface: "#211b17", text: "#f4ece3", muted: "#bcae9f" }, fonts: { heading: "font.barlow-condensed", body: "font.archivo", button: "font.barlow-condensed", link: "font.archivo" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 72, weight: 700, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" }, h2: { size: 44, weight: 700, lineHeight: 1.05, letterSpacing: 0.02, transform: "uppercase" } }, buttons: { paddingY: 14, paddingX: 32 } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "braise-nord", motifs: ["halftone", "rays", "plates"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "BRAISE NORD" }],
    menu: [["Accueil", "/"], ["Carte", "/carte"], ["Maturation", "/maturation"], ["Cave et bar", "/cave"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "7 quai des Forges, 59000 Lille", phone: "03 20 00 45 67", email: "salle@braisenord.example", hours: "Du mardi au samedi, 19 h – 23 h ; déjeuner le vendredi", tagline: "Viandes maturées, feu de bois." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Grill au feu de bois · Lille", title: "Le feu. La viande. Le temps.", sub: "Côtes de bœuf maturées six semaines, cuites sur braise de chêne et servies saignantes ou à votre goût.", cta: ["Réserver une table", "/reserver"], cta2: ["Voir la carte", "/carte"] }],
        ["feat:bento", { eyebrow: "Notre signature", title: "Trois façons de passer à table", items: [{ t: "La côte à partager", x: "Un kilo de côte de bœuf maturée, tranchée devant vous, frites cuites à la graisse de bœuf et sauce au poivre.", icon: "sparkles" }, { t: "Les pièces du boucher", x: "Onglet, bavette, entrecôte : coupes du jour selon l'arrivage.", icon: "tag" }, { t: "Le menu du soir", x: "Entrée, pièce de viande, dessert : 38 €.", icon: "star" }] }],
        ["proof:statsbar", { items: [["42 jours", "de maturation maximum"], ["650 °C", "au cœur de la braise"], ["12", "producteurs partenaires (exemple)"]] }],
        ["gal:masonry", { title: "En cuisine", items: [{ t: "La braise" }, { t: "La chambre de maturation" }, { t: "La côte" }, { t: "La salle" }, { t: "Le bar" }, { t: "Les sauces" }] }],
        ["cta:split", { title: "Dîner un vendredi soir ?", sub: "Les tables partent vite : réservez dès maintenant.", cta: ["Réserver", "/reserver"], cta2: ["Appeler la salle", "/reserver"] }],
      ] },
      { key: "carte", name: "Carte", blocks: [
        ph("La carte", "Ardoise renouvelée selon l'arrivage."),
        ["misc:menu", { title: "Du feu à la table", left: ["Pour commencer", [{ t: "Os à moelle rôti", x: "Fleur de sel, pain grillé", price: "11 €" }, { t: "Tartare de bœuf au couteau", x: "Câpres, jaune confit", price: "14 €" }, { t: "Oignon rouge braisé", x: "Fromage de brebis, noisettes", price: "10 €" }]], right: ["Au feu de bois", [{ t: "Onglet", x: "250 g, échalotes confites", price: "26 €" }, { t: "Entrecôte maturée 28 jours", x: "350 g", price: "36 €" }, { t: "Côte de bœuf à partager", x: "1 kg, pour deux à trois personnes", price: "88 €" }, { t: "Pièce du boucher", x: "Selon l'arrivage", price: "27 €" }]] }],
        ["feat:list2", { title: "Accompagnements et sauces", items: [{ t: "Frites à la graisse de bœuf" }, { t: "Purée fumée" }, { t: "Légumes grillés" }, { t: "Sauce au poivre" }, { t: "Béarnaise" }, { t: "Beurre à l'ail noir" }] }],
        ["cta:band", { title: "Menu du soir à 38 €", sub: "Disponible du mardi au jeudi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "maturation", name: "Maturation", blocks: [
        ph("L'art de la maturation", "Six semaines, une chambre à 2 °C et beaucoup de patience."),
        ["feat:steps", { eyebrow: "Du pré à la braise", title: "Le parcours d'une côte", items: [{ t: "Sélection", x: "Race à viande, élevage en plein air chez nos éleveurs partenaires.", d: "J 0" }, { t: "Maturation", x: "Chambre à 2 °C, hygrométrie contrôlée.", d: "J 7 à 42" }, { t: "Parage", x: "Retrait de la croûte, découpe à la commande.", d: "J 42" }, { t: "Cuisson", x: "Braise de chêne, repos de dix minutes.", d: "Service" }] }],
        ["misc:story", { eyebrow: "Le boucher", title: "Un métier de patience", paras: ["Notre chef boucher, Romain Delattre (fictif), sélectionne chaque pièce et surveille la chambre matin et soir.", "Une viande bien maturée est plus tendre, plus parfumée et se cuit mieux : c'est tout le secret de la maison."], image: "portrait-4" }],
        ["proof:quotes", { title: "Entendu en salle", items: [{ q: "La meilleure côte de bœuf que j'aie goûtée.", n: "Étienne R.", r: "client fictif" }, { q: "Du feu, du goût, de la générosité.", n: "Sofia M.", r: "cliente fictive" }, { q: "Un grill qui sait ce qu'il fait.", n: "Hugo B.", r: "client fictif" }] }],
      ] },
      { key: "cave", name: "Cave et bar", blocks: [
        ph("Cave et bar", "Vins de caractère, bières du Nord, cocktails fumés."),
        ["feat:cards", { title: "À boire", items: [{ icon: "star", t: "La cave", x: "Cent références de vignerons indépendants, du rouge de charpente au blanc vif." }, { icon: "sparkles", t: "Cocktails fumés", x: "Whisky tourbé, orange brûlée, bois de chêne." }, { icon: "heart", t: "Bières du Nord", x: "Six brasseries artisanales, au fût et en bouteille." }] }],
        ["feat:pricelist", { title: "Quelques repères", items: [{ t: "Verre de rouge de la maison", price: "6 €" }, { t: "Bouteille conseillée du mois", price: "34 €" }, { t: "Cocktail fumé", price: "12 €" }, { t: "Bière blonde, 33 cl", price: "5 €" }] }],
        ["cta:card", { title: "Un accord mets et vins ?", sub: "Notre sommelier compose votre sélection pour 4 verres : 28 €.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Groupes à partir de huit : appelez-nous."),
        ["contact:map", { title: "Braise Nord, quai des Forges", mapAddress: "7 quai des Forges, 59000 Lille" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Jeudi", "19 h – 22 h 30"], ["Vendredi", "12 h – 14 h · 19 h – 23 h"], ["Samedi", "19 h – 23 h"], ["Dimanche", "Fermé"]] }],
        ["cta:band", { title: "Une envie de privatiser ?", sub: "Salle de trente places avec accès direct à la braise.", cta: ["Nous écrire", "/reserver"] }],
      ] },
    ],
  },

  // 3. ROCKET DINER — burgers rétro, ludique
  {
    key: "rocket-diner", name: "Rocket Diner", category: "restaurant", tags: ["ludique", "audacieux"], siteType: "Burgers et diner rétro",
    description: "Diner rétro joyeux : rouge cerise, turquoise et jaune moutarde, titres arrondis, bandeau d'annonces défilant et boutons en pilule pour un burger bar plein d'énergie.",
    brand: "Rocket Diner",
    tokens: { colors: { primary: "#d62839", secondary: "#0f4c5c", accent: "#fcbf49", background: "#fff8ec", surface: "#ffffff", text: "#1d2b3a", muted: "#55616e" }, fonts: { heading: "font.righteous", body: "font.nunito", button: "font.righteous", link: "font.nunito" }, radius: { sm: 10, md: 16, lg: 24, button: 999, field: 14, card: 22 }, shadow: { card: "md", button: "md" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.04, letterSpacing: 0 }, h2: { size: 40, weight: 400, lineHeight: 1.1, letterSpacing: 0 } }, buttons: { paddingY: 14, paddingX: 30 } },
    dna: { scale: "l", pad: "normal", align: "center", shape: "pill" }, art: { seed: "rocket-diner", motifs: ["blobs", "objects", "ribbons"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "La lettre du Diner", sub: "Un burger spécial par mois, les soirées à thème et les offres : une lettre par mois, pas plus.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Le menu", "/menu"], ["Soirées", "/soirees"], ["Livraison", "/livraison"], ["Contact", "/contact"]], cta: ["Commander", "/livraison"],
    contact: { address: "3 boulevard de la Fusée, 31000 Toulouse", phone: "05 61 00 89 10", email: "salut@rocketdiner.example", hours: "Tous les jours, 11 h 30 – 23 h", tagline: "Burgers, shakes et vinyles." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Burgers · Shakes · Vinyles", title: "Le meilleur burger de la galaxie.", sub: "Pain briochée cuit chaque matin, steak haché minute, sauces maison et milk-shakes épais comme il faut.", cta: ["Voir le menu", "/menu"], cta2: ["Commander à emporter", "/livraison"] }],
        ["misc:marquee", { items: ["Happy hour 17 h – 19 h", "Frites maison à volonté le mercredi", "Menu enfant à 9 €", "Brunch le dimanche"] }],
        ["feat:pricelist", { eyebrow: "Les best-sellers", title: "Top 4 des fusées", items: [{ t: "Le Rocket", x: "Cheddar fumé, oignons caramélisés, sauce maison", price: "13,50 €" }, { t: "Le Nébuleuse", x: "Poulet croustillant, coleslaw, miel pimenté", price: "12,50 €" }, { t: "Le Lunaire", x: "Galette de pois chiches, avocat, sauce yaourt", price: "12 €" }, { t: "Shake Comète", x: "Vanille, caramel beurre salé, chantilly", price: "6,50 €" }] }],
        ["proof:big", { items: [{ q: "On a débarqué à six, on est repartis comblés : les frites sont folles !", n: "Camille et sa bande", r: "cliente fictive" }] }],
        ["cta:band", { title: "Une envie de burger ? Direct en 20 minutes.", sub: "Commande à emporter ou livraison dans un rayon de 3 km (démonstration).", cta: ["Commander", "/livraison"] }],
      ] },
      { key: "menu", name: "Le menu", blocks: [
        ph("Le menu", "Tout est fait maison, tout est servi chaud."),
        ["misc:menu", { title: "Burgers et compagnie", left: ["Burgers", [{ t: "Le Rocket", x: "Bœuf, cheddar fumé, oignons caramélisés", price: "13,50 €" }, { t: "Le Nébuleuse", x: "Poulet croustillant, coleslaw, miel pimenté", price: "12,50 €" }, { t: "Le Lunaire", x: "Végétarien, pois chiches, avocat", price: "12 €" }, { t: "Le Double Orbite", x: "Deux steaks, bacon, pickles", price: "16 €" }]], right: ["Sides et shakes", [{ t: "Frites maison", x: "Sel fumé ou sauce fromagère", price: "4,50 €" }, { t: "Onion rings", x: "Panure croustillante", price: "5 €" }, { t: "Shake Comète", x: "Vanille, caramel, chantilly", price: "6,50 €" }, { t: "Shake Fraise Galaxie", x: "Fruits frais", price: "6,50 €" }]] }],
        ["feat:icons", { title: "Pour les petits astronautes", items: [{ icon: "smartphone", t: "Menu enfant 9 €", x: "Mini-burger, frites, jus et une glace." }, { icon: "heart", t: "Sans gluten", x: "Pain sans gluten sur demande, sans supplément." }, { icon: "sparkles", t: "Options végétales", x: "Deux burgers et un shake à base de lait d'avoine." }] }],
        ["cta:split", { title: "Faim de loup ?", sub: "Livraison ou à emporter, tous les jours.", cta: ["Commander", "/livraison"] }],
      ] },
      { key: "soirees", name: "Soirées", blocks: [
        ph("Soirées à thème", "Rock'n'roll, quiz et brunchs en famille."),
        ["misc:schedule", { title: "La semaine au Diner", items: [{ d: "Mercredi", t: "Frites à volonté", x: "Servies avec chaque burger, dès 18 h." }, { d: "Vendredi", t: "Soirée vinyles", x: "Un DJ pose ses disques, 20 h – 23 h." }, { d: "Samedi", t: "Quiz burger", x: "Par équipes de quatre, un shake pour les gagnants." }, { d: "Dimanche", t: "Brunch rétro", x: "Pancakes, œufs brouillés, bacon, 17 €." }] }],
        ["gal:cards", { title: "Les derniers temps forts", items: [{ t: "Soirée années 60", tag: "Vinyles", x: "Danse, milk-shakes et jukebox." }, { t: "Quiz de rentrée", tag: "Jeux", x: "Douze équipes en lice." }, { t: "Brunch rétro", tag: "Famille", x: "Pancakes à volonté." }] }],
        ["cta:card", { title: "Un anniversaire à fêter ?", sub: "Tablée jusqu'à vingt personnes, gâteau offert.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "livraison", name: "Livraison", blocks: [
        ph("Commander", "Retrait au comptoir ou livraison à Toulouse."),
        ["feat:steps", { title: "Comment ça marche", items: [{ t: "Choisissez", x: "Parcourez le menu et appelez-nous." }, { t: "Confirmez", x: "Nous vous donnons l'heure exacte." }, { t: "Dégustez", x: "Votre commande arrive chaude, emballée avec soin." }] }],
        ["misc:faq", { title: "Questions fréquentes", items: [{ t: "Quel est le délai ?", x: "En moyenne vingt à trente minutes selon l'affluence." }, { t: "Livrez-vous après 22 h ?", x: "Jusqu'à 22 h 30, dans un rayon de 3 km." }, { t: "Puis-je commander à l'avance ?", x: "Oui, jusqu'à 48 heures avant, par téléphone." }] }],
        ["cta:band", { title: "Appelez le 05 61 00 89 10", sub: "Notre équipe prend les commandes de 11 h 30 à 22 h 30.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ph("Contact", "Salut ! Une question, une réservation de groupe ?"),
        ["contact:cards", { title: "On vous répond vite", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: week("11 h 30 – 23 h", "11 h 30 – 23 h", "11 h 30 – 23 h") }],
      ] },
    ],
  },

  // 4. MARÉE HAUTE — brasserie de la mer, éditorial marin
  {
    key: "maree-haute", name: "Marée Haute", category: "restaurant", tags: ["editorial", "classique"], siteType: "Brasserie de la mer",
    description: "Brasserie marine éditoriale : un grand titre de presse en Abril Fatface, bleu profond et corail, numérotation des étapes, carrousel de plats et grande citation.",
    brand: "Brasserie Marée Haute",
    tokens: { colors: { primary: "#0b3c6e", secondary: "#072a4d", accent: "#ff6b57", background: "#f6fafb", surface: "#ffffff", text: "#0b2239", muted: "#4a6075" }, fonts: { heading: "font.abril-fatface", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 2, md: 4, lg: 8, button: 4, field: 4, card: 6 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 60, weight: 400, lineHeight: 1.0, letterSpacing: -0.02 } } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "maree-haute", motifs: ["waves", "mesh", "tiles"] },
    head: ["head:split", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Le banc d'écailler", "/ecailler"], ["Cave", "/cave"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "2 quai du Port, 17000 La Rochelle", phone: "05 46 00 77 21", email: "reservation@mareehaute.example", hours: "Tous les jours sauf lundi, 12 h – 14 h 30 et 19 h – 22 h", tagline: "Poissons du jour, coquillages de la baie." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { eyebrow: "Brasserie de la mer", kicker: "La Rochelle · depuis 1998", title: "La mer, à marée haute.", sub: "Huîtres de la baie, poissons de ligne, crustacés vivants : l'arrivage du matin se retrouve sur votre table avant la fin de la journée.", cta: ["Réserver", "/reserver"], cta2: ["Voir la carte", "/carte"] }],
        ["feat:numbered", { eyebrow: "De la criée à l'assiette", title: "Trois engagements", items: [{ t: "Pêche du jour", x: "Poissons achetés à la criée, jamais de surgelé." }, { t: "Coquillages vivants", x: "Huîtres, moules, palourdes de la baie, sélectionnés chaque matin." }, { t: "Cuisson juste", x: "Plancha, vapeur ou cru : la saveur avant tout." }] }],
        ["gal:carousel", { title: "À l'ardoise cette semaine", items: [{ t: "Huîtres n°3", x: "La demi-douzaine, 14 €" }, { t: "Bar de ligne", x: "Beurre blanc, 28 €" }, { t: "Plateau de fruits de mer", x: "Pour deux, 76 €" }, { t: "Cabillaud rôti", x: "Chou rave, 24 €" }] }],
        ["proof:quotes", { eyebrow: "Livre d'or", title: "Ils reviennent à marée haute", items: [{ q: "Des huîtres incroyables et un service impeccable.", n: "Nathalie F.", r: "cliente fictive" }, { q: "Le bar de ligne est cuit à la perfection.", n: "Olivier T.", r: "client fictif" }, { q: "Le plateau pour deux vaut le détour.", n: "Pauline V.", r: "cliente fictive" }] }],
        ["cta:card", { title: "Déjeuner face au port ?", sub: "Formule du midi à 24 €, du mardi au vendredi.", cta: ["Réserver une table", "/reserver"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Renouvelée au fil des arrivages."),
        ["misc:menu", { title: "Entre baie et pleine mer", left: ["Entrées", [{ t: "Huîtres de la baie n°3", x: "Les six", price: "14 €" }, { t: "Tartare de daurade", x: "Citron caviar, aneth", price: "15 €" }, { t: "Soupe de poissons de roche", x: "Rouille, croûtons", price: "12 €" }]], right: ["Plats", [{ t: "Bar de ligne", x: "Beurre blanc, légumes de saison", price: "28 €" }, { t: "Cabillaud rôti", x: "Chou rave, beurre noisette", price: "24 €" }, { t: "Linguine aux palourdes", x: "Ail, persil, piment doux", price: "22 €" }, { t: "Homard breton", x: "Grillé, beurre d'algues", price: "46 €" }]] }],
        ["feat:alt", { title: "Les incontournables", items: [{ t: "Le plateau de fruits de mer", x: "Huîtres, crevettes, bulots, langoustines et tourteau pour deux personnes.", link: ["Réserver", "/reserver"] }, { t: "Le menu de la criée", x: "Entrée, poisson du jour et dessert : 39 €." }] }],
        ["cta:split", { title: "Une allergie ?", sub: "Signalez-la à la réservation, nous adaptons.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "ecailler", name: "Banc d'écailler", blocks: [
        ph("Le banc d'écailler", "Ouvert à la demande, devant la salle."),
        ["feat:tabs", { title: "Les coquillages", items: [{ t: "Huîtres", x: "Creuses de la baie, calibres 2 à 4. Servies à la mignonette ou nature." }, { t: "Moules", x: "Moules de bouchot à la marinière, à la crème ou au curry." }, { t: "Crustacés", x: "Langoustines, tourteau et homard bretons, cuits à la minute." }] }],
        ["proof:stats", { items: [["5 000", "huîtres ouvertes par semaine (exemple)"], ["8", "producteurs de la baie"], ["12 h", "entre l'arrivage et le service"]] }],
        ["cta:band", { title: "Plateau pour deux : 76 €", sub: "Sur réservation, la veille avant 18 h.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "cave", name: "Cave", blocks: [
        ph("La cave", "Blancs vifs et bulles de caractère."),
        ["feat:cards", { title: "Accords mets et mer", items: [{ icon: "star", t: "Muscadet sur lie", x: "Pour les huîtres et les coquillages crus." }, { icon: "sun", t: "Chenin sec", x: "Pour les poissons grillés et les beurres blancs." }, { icon: "sparkles", t: "Crémant", x: "Pour les plateaux et les desserts." }] }],
        ["feat:pricelist", { title: "Au verre", items: [{ t: "Muscadet", price: "5,50 €" }, { t: "Chenin", price: "6,50 €" }, { t: "Crémant", price: "7 €" }, { t: "Cidre brut", price: "4,50 €" }] }],
        ["misc:quote", { text: "Un bon accord, c'est comme une marée : il monte tout doucement.", by: "Le sommelier de la maison (fictif)" }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Terrasse chauffée de novembre à mars."),
        ["contact:info", { title: "Une table face au port", formTitle: "Votre demande", formIntro: "Indiquez date, heure et nombre de couverts.", cta: ["Envoyer", "/reserver"] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Samedi", "12 h – 14 h 30 · 19 h – 22 h"], ["Dimanche", "12 h – 15 h"]] }],
      ] },
    ],
  },

  // 5. TORRÉFACTEUR — café de spécialité, minimaliste
  {
    key: "grain-et-tasse", name: "Grain & Tasse", category: "restaurant", tags: ["minimaliste", "chaleureux"], siteType: "Café de spécialité et torréfacteur",
    description: "Café de spécialité minimaliste : crème, espresso et caramel, texte seul au bandeau, bande de photos de comptoir et onglets pour les origines de la torréfaction.",
    brand: "Grain & Tasse",
    tokens: { colors: { primary: "#5a3a22", secondary: "#2b1d14", accent: "#c27c3a", background: "#f4ede4", surface: "#fbf7f1", text: "#2b1d14", muted: "#6a5646" }, fonts: { heading: "font.jost", body: "font.karla", button: "font.jost", link: "font.karla" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 64, weight: 500, lineHeight: 1.04, letterSpacing: -0.02 }, h2: { size: 36, weight: 500, lineHeight: 1.12, letterSpacing: -0.01 } }, border: { width: 1, color: "#dccdb8" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "grain-et-tasse", motifs: ["tiles", "plates", "objects"] },
    head: ["head:minimal", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Carte", "/carte"], ["Torréfaction", "/torrefaction"], ["Ateliers", "/ateliers"], ["Venir", "/venir"]], cta: ["Nous trouver", "/venir"],
    contact: { address: "9 rue des Tanneurs, 35000 Rennes", phone: "02 99 00 31 42", email: "bonjour@graintasse.example", hours: "Du lundi au samedi, 8 h – 18 h ; dimanche, 9 h – 16 h", tagline: "Torréfaction lente, tasses calmes." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Café de spécialité · Rennes", title: "Un café lent, torréfié à deux pas.", sub: "Nous torréfions chaque semaine de petits lots venus de coopératives d'Éthiopie, de Colombie et du Rwanda, et nous les servons sans hâte.", cta: ["Voir la carte", "/carte"], cta2: ["Nous trouver", "/venir"] }],
        ["gal:strip", { title: "Au comptoir", items: [{ t: "Espresso" }, { t: "Filtre" }, { t: "Cookie" }, { t: "Grains" }, { t: "Cold brew" }] }],
        ["feat:list2", { eyebrow: "Notre façon de faire", title: "Ce que vous trouverez chez nous", items: [{ t: "Cafés de coopératives en circuits courts" }, { t: "Torréfaction maison, chaque mardi" }, { t: "Lait local et boissons végétales" }, { t: "Pâtisseries du matin, faites sur place" }, { t: "Vente de grains et de moulus" }, { t: "Wifi calme, prises disponibles" }] }],
        ["proof:stats", { items: [["3", "origines à la carte"], ["8 min", "de torréfaction par lot"], ["48 h", "entre torréfaction et tasse"]] }],
        ["cta:split", { title: "Passez prendre un café.", sub: "Ouvert dès 8 h, tous les jours.", cta: ["Nous trouver", "/venir"] }],
      ] },
      { key: "carte", name: "Carte", blocks: [
        ph("La carte", "Cafés, thés et gourmandises."),
        ["misc:menu", { title: "Boissons et petits plaisirs", left: ["Cafés", [{ t: "Espresso", x: "Café du moment", price: "2,50 €" }, { t: "Flat white", x: "Double espresso, lait microtexturé", price: "4,50 €" }, { t: "Filtre V60", x: "Origine au choix", price: "4 €" }, { t: "Cold brew", x: "Infusé 18 heures", price: "4,80 €" }]], right: ["Gourmandises", [{ t: "Cookie noisette", x: "Chocolat 64 %", price: "3,20 €" }, { t: "Banana bread", x: "Tranche, beurre salé", price: "3,80 €" }, { t: "Toast avocat", x: "Pain au levain, citron, graines", price: "7,50 €" }, { t: "Granola maison", x: "Yaourt, fruits de saison", price: "6,50 €" }]] }],
        ["feat:pricelist", { title: "À emporter", items: [{ t: "Grains, sachet 250 g", x: "Éthiopie Guji, Colombie Huila ou Rwanda", price: "9,80 €" }, { t: "Abonnement mensuel", x: "Un sachet livré chaque mois (démonstration)", price: "9 €" }] }],
        ["cta:band", { title: "Un café en retard ?", sub: "Suspendu : offrez une tasse à un inconnu.", cta: ["En savoir plus", "/venir"] }],
      ] },
      { key: "torrefaction", name: "Torréfaction", blocks: [
        ph("La torréfaction", "Du café vert à la tasse."),
        ["feat:tabs", { title: "Nos origines", items: [{ t: "Éthiopie", x: "Notes de fleurs et d'agrumes, lavé. Coopérative de Guji, altitude 2 000 m." }, { t: "Colombie", x: "Caramel, noisette, corps rond. Petits producteurs du Huila." }, { t: "Rwanda", x: "Fruits rouges, thé noir. Station de lavage familiale." }] }],
        ["feat:steps", { eyebrow: "Chaque mardi", title: "Les étapes", items: [{ t: "Dégustation du café vert", x: "Échantillon et fiche de lot." }, { t: "Profil de torréfaction", x: "Courbe notée à chaque fournée." }, { t: "Repos", x: "Quarante-huit heures avant la mise en sachet." }] }],
        ["cta:card", { title: "Envie d'apprendre ?", sub: "Venez à nos ateliers de dégustation.", cta: ["Voir les ateliers", "/ateliers"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ph("Ateliers", "Dégustation, latte art et préparation maison."),
        ["feat:rows", { title: "Au programme du mois", items: [{ t: "Dégustation comparée (1 h 30)", x: "Trois origines, trois méthodes, un carnet de notes. 25 € par personne." }, { t: "Latte art, initiation (2 h)", x: "Lait, pitcher et gestes : repartez avec votre cœur. 35 €." }, { t: "Barista à la maison (2 h)", x: "Choisir sa moulin, son filtre, régler sa mouture. 30 €." }] }],
        ["misc:faq", { title: "Questions", items: [{ t: "Faut-il réserver ?", x: "Oui, huit places maximum par atelier." }, { t: "Pour tous les niveaux ?", x: "Oui, aucune connaissance préalable n'est nécessaire." }, { t: "Peut-on offrir un atelier ?", x: "Oui, la carte cadeau est disponible au comptoir." }] }],
        ["cta:split", { title: "Réservez votre place.", sub: "Les ateliers sont complets une semaine à l'avance.", cta: ["Nous écrire", "/venir"] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver", "Entre le marché et la rivière."),
        ["contact:map", { title: "Grain & Tasse", mapAddress: "9 rue des Tanneurs, 35000 Rennes" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Samedi", "8 h – 18 h"], ["Dimanche", "9 h – 16 h"]] }],
        ["cta:band", { title: "À très vite autour d'une tasse.", cta: ["Écrire un message", "/venir"] }],
      ] },
    ],
  },

  // 6. AUBE — boulangerie pâtisserie, pastel
  {
    key: "aube-gourmande", name: "Aube Gourmande", category: "restaurant", tags: ["luxe", "chaleureux"], siteType: "Boulangerie-pâtisserie",
    description: "Boulangerie-pâtisserie délicate : rose poudré, vert pistache, serif Prata, bandeau encadré et vitrine de créations avec leurs prix.",
    brand: "Maison Aube",
    tokens: { colors: { primary: "#b03f5c", secondary: "#6b2d3e", accent: "#5f8a4e", background: "#fff6f3", surface: "#ffffff", text: "#4a2a2f", muted: "#76565b" }, fonts: { heading: "font.prata", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 12, md: 18, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "none" } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "pill" }, art: { seed: "aube-gourmande", motifs: ["blobs", "botanical", "bokeh"] },
    head: ["head:side", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Vitrine", "/vitrine"], ["Commandes", "/commandes"], ["Notre atelier", "/atelier"], ["Boutique", "/boutique"]], cta: ["Commander un gâteau", "/commandes"],
    contact: { address: "5 place de la Halle, 44000 Nantes", phone: "02 40 00 58 36", email: "aube@aubegourmande.example", hours: "Du mardi au dimanche, 6 h 30 – 19 h", tagline: "Pains au levain, viennoiseries, entremets." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Boulangerie · Pâtisserie · Nantes", title: "Le matin commence par une brioche.", sub: "Pains au levain naturel, viennoiseries pur beurre et entremets de saison, façonnés à la main chaque nuit dans notre laboratoire.", cta: ["Voir la vitrine", "/vitrine"], cta2: ["Commander", "/commandes"] }],
        ["gal:products", { eyebrow: "La vitrine du jour", title: "Quelques créations de la maison", items: [{ t: "Croissant pur beurre", price: "1,40 €", x: "Feuilletage de trois jours" }, { t: "Paris-Brest", price: "5,20 €", x: "Praliné noisette" }, { t: "Tarte citron meringuée", price: "4,80 €", x: "Citron de Menton" }, { t: "Pain au levain", price: "4,10 €", x: "Farine de blé ancien" }] }],
        ["feat:strips", { title: "Tout au long de la journée", items: [{ t: "6 h 30 : sortie du four", x: "Baguettes tradition, pains aux graines et viennoiseries tièdes." }, { t: "12 h : formule déjeuner", x: "Sandwich, tarte salée du jour, dessert : 12,50 €." }, { t: "16 h : l'heure du goûter", x: "Éclairs, tartelettes et chocolat chaud épais." }] }],
        ["misc:story", { eyebrow: "L'atelier", title: "Une pâtisserie de quartier", paras: ["Margaux Lemaire (fictive), pâtissière, a ouvert la maison en 2016 avec un four à sole et une obsession : le beurre de baratte.", "Chaque semaine, nous proposons un entremets de saison et une viennoiserie en édition limitée."], image: "portrait-6" }],
        ["cta:band", { title: "Un gâteau pour un moment à fêter ?", sub: "Commandez huit jours à l'avance.", cta: ["Commander", "/commandes"] }],
      ] },
      { key: "vitrine", name: "Vitrine", blocks: [
        ph("La vitrine", "Pains, viennoiseries, pâtisseries."),
        ["feat:pricelist", { title: "Boulangerie", items: [{ t: "Baguette tradition", price: "1,15 €" }, { t: "Pain de campagne 600 g", price: "4,10 €" }, { t: "Pain aux noix et figues", price: "4,80 €" }, { t: "Brioche feuilletée", price: "3,20 €" }] }],
        ["gal:cards", { title: "Pâtisseries", items: [{ t: "Éclair vanille", tag: "5,00 €", x: "Crème vanille de Madagascar" }, { t: "Tartelette fraise", tag: "5,50 €", x: "Crème d'amande, fraises de saison" }, { t: "Opéra", tag: "5,80 €", x: "Café, chocolat noir, biscuit Joconde" }] }],
        ["cta:card", { title: "Les nouveautés arrivent chaque saison.", sub: "Suivez-nous pour ne rien manquer.", cta: ["Nous écrire", "/commandes"] }],
      ] },
      { key: "commandes", name: "Commandes", blocks: [
        ph("Commandes sur mesure", "Gâteaux d'anniversaire, pièces montées, buffets."),
        ["feat:checks", { eyebrow: "Sur commande", title: "Pour toutes vos occasions", items: [{ t: "Gâteaux d'anniversaire dès 6 parts" }, { t: "Pièces montées et choux" }, { t: "Plateaux de mignardises" }, { t: "Buffets salés et sucrés" }, { t: "Options sans gluten et vegan" }], cta: ["Demander un devis", "/commandes"] }],
        ["feat:steps", { title: "Comment commander", items: [{ t: "Demande", x: "Envoyez-nous la date, le nombre de convives et vos envies." }, { t: "Devis", x: "Réponse sous 48 h, avec un croquis du gâteau." }, { t: "Retrait", x: "Récupérez votre commande à l'atelier, joliment emballée." }] }],
        ["contact:info", { title: "Votre demande", formTitle: "Parlez-nous de votre événement", formIntro: "Date, nombre de personnes, goûts, allergies.", cta: ["Envoyer", "/commandes"] }],
      ] },
      { key: "atelier", name: "Notre atelier", blocks: [
        ph("Notre atelier"),
        ["misc:text", { eyebrow: "Savoir-faire", title: "Le temps, le beurre, la main", paras: ["Nos pâtes lèvent douze à vingt-quatre heures. Les levains sont nourris chaque jour, les crèmes cuites à l'ancienne.", "Nous travaillons avec un meunier de la Loire (fictif) et un laitier du bocage vendéen pour le beurre et la crème."] }],
        ["proof:team", { eyebrow: "L'équipe", title: "Ceux qui travaillent la nuit", items: [{ n: "Margaux Lemaire", r: "Pâtissière" }, { n: "Karim Bensaïd", r: "Boulanger" }, { n: "Élise Robin", r: "Chocolatière" }] }],
        ["proof:quotes", { items: [{ q: "Les croissants les plus croustillants du quartier.", n: "Laurent G.", r: "client fictif" }, { q: "Un gâteau d'anniversaire sublime, et délicieux.", n: "Claire H.", r: "cliente fictive" }, { q: "On y va pour le pain, on repart avec une tarte.", n: "Samir O.", r: "client fictif" }] }],
      ] },
      { key: "boutique", name: "Boutique", blocks: [
        ph("Boutique et horaires", "Pour passer, ou pour offrir."),
        ["contact:map", { title: "La boutique", mapAddress: "5 place de la Halle, 44000 Nantes" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Samedi", "6 h 30 – 19 h"], ["Dimanche", "7 h – 13 h 30"]] }],
      ] },
    ],
  },

  // 7. VERDURE — table végétale
  {
    key: "table-verdure", name: "Table Verdure", category: "restaurant", tags: ["naturel", "moderne"], siteType: "Restaurant végétal et de saison",
    description: "Restaurant végétal et local : vert profond, ambre, sans-serif Work Sans, grille d'icônes, étapes de la ferme à l'assiette et grande image d'appel.",
    brand: "Table Verdure",
    tokens: { colors: { primary: "#2f7d32", secondary: "#12361c", accent: "#e9a23b", background: "#f3f7ee", surface: "#ffffff", text: "#17301f", muted: "#4b6352" }, fonts: { heading: "font.work-sans", body: "font.lora", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 6, md: 10, lg: 14, button: 8, field: 8, card: 12 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 54, weight: 700, lineHeight: 1.08, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "table-verdure", motifs: ["botanical", "topo", "blobs"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Cuisine végétale de saison, cuisinée avec les légumes de huit maraîchers voisins.", cols: [["Découvrir", "Carte", "Producteurs", "Cours de cuisine"], ["Venir", "Réserver", "Accès", "Contact"]] }],
    menu: [["Accueil", "/"], ["Carte de saison", "/carte"], ["Producteurs", "/producteurs"], ["Cours", "/cours"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "21 chemin des Jardins, 38000 Grenoble", phone: "04 76 00 66 54", email: "bonjour@tableverdure.example", hours: "Du mardi au samedi, 12 h – 14 h et 19 h – 21 h 30", tagline: "Végétal, local, de saison." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Cuisine végétale · Grenoble", title: "Les légumes ont la vedette.", sub: "Un menu qui suit les saisons, cuisiné avec des légumes cueillis à moins de trente kilomètres.", cta: ["Voir la carte de saison", "/carte"], cta2: ["Réserver", "/reserver"], stats: [["30 km", "rayon d'approvisionnement"], ["8", "maraîchers partenaires"], ["100 %", "végétal"]] }],
        ["feat:grid-icons", { eyebrow: "Notre cuisine", title: "Une table engagée, sans prise de tête", items: [{ icon: "sun", t: "De saison", x: "Le menu change toutes les six semaines." }, { icon: "heart", t: "Zéro gaspillage", x: "Fanes, épluchures et cœurs : tout est valorisé." }, { icon: "users", t: "Local", x: "Huit exploitations de l'Isère, livrées à vélo." }, { icon: "leaf", t: "Sans compromis", x: "Aucun produit d'origine animale, pour une carte plus gourmande." }].map((it) => ({ ...it, icon: it.icon === "leaf" ? "sparkles" : it.icon })) }],
        ["feat:steps", { eyebrow: "Du champ à l'assiette", title: "Une journée en cuisine", items: [{ t: "Récolte", x: "Les cagettes arrivent à 7 h.", d: "7 h" }, { t: "Préparation", x: "Légumes lavés, taillés, marinés ou fermentés.", d: "9 h" }, { t: "Service", x: "Menu du midi puis dîner à la carte.", d: "12 h" }, { t: "Retour à la terre", x: "Épluchures confiées au compost des jardins voisins.", d: "22 h" }] }],
        ["gal:cards", { title: "Nos assiettes de saison", items: [{ t: "Carottes rôties au miso", tag: "Entrée", x: "Pâte de sésame, graines torréfiées." }, { t: "Risotto d'épeautre", tag: "Plat", x: "Champignons, noisettes, herbes." }, { t: "Crème de courge", tag: "Dessert", x: "Vanille, sablé aux épices." }] }],
        ["cta:image", { title: "Un déjeuner qui fait du bien.", sub: "Formule à 19 € : entrée, plat, thé glacé maison.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "Carte de saison", blocks: [
        ph("Carte de saison", "Automne : courges, champignons, châtaignes."),
        ["misc:menu", { title: "Menu d'automne", left: ["À partager", [{ t: "Houmous de betterave", x: "Pain grillé, zaatar", price: "8 €" }, { t: "Velouté de courge", x: "Lait de coco, graines", price: "9 €" }, { t: "Carottes rôties au miso", x: "Sésame noir", price: "10 €" }]], right: ["Plats", [{ t: "Risotto d'épeautre", x: "Champignons, noisettes", price: "17 €" }, { t: "Tarte fine aux poireaux", x: "Crème d'amande, ciboulette", price: "16 €" }, { t: "Curry de pois chiches", x: "Riz noir, coriandre", price: "17 €" }, { t: "Dessert du jour", x: "Fruits cuits, crumble", price: "8 €" }]] }],
        ["feat:list2", { title: "Boissons", items: [{ t: "Kombucha maison" }, { t: "Jus pressés du jour" }, { t: "Bières locales" }, { t: "Vins nature" }, { t: "Thés et infusions" }, { t: "Café de spécialité" }] }],
        ["cta:band", { title: "Menu enfant à 10 €", sub: "Plat, dessert, jus pressé.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "producteurs", name: "Producteurs", blocks: [
        ph("Nos producteurs", "Huit exploitations, une même exigence."),
        ["gal:listings", { title: "Là où poussent nos assiettes", items: [{ t: "Ferme des Trois Ruisseaux", tag: "Légumes", price: "12 km", x: "Maraîchage en agriculture biologique." }, { t: "Verger du Col", tag: "Fruits", price: "21 km", x: "Pommes, poires et noix anciennes." }, { t: "Moulin de la Bonne", tag: "Céréales", price: "18 km", x: "Épeautre et sarrasin moulus sur pierre." }] }],
        ["misc:story", { eyebrow: "Notre parti pris", title: "Payer le juste prix", paras: ["Nous fixons les tarifs avec chaque producteur avant la saison, afin qu'il puisse planifier ses semis.", "Le menu s'adapte aux surplus de la ferme : c'est aussi ce qui le rend vivant."], image: "portrait-8" }],
        ["cta:card", { title: "Visite de ferme", sub: "Un samedi par mois, déjeuner inclus.", cta: ["En savoir plus", "/cours"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ph("Cours de cuisine végétale"),
        ["feat:alt", { title: "Cuisiner les légumes autrement", items: [{ t: "Fermentation", x: "Choucroute, kimchi, kombucha : maîtrisez les bases en trois heures. 55 €.", link: ["S'inscrire", "/reserver"] }, { t: "Cuisine de la racine à la fane", x: "Zéro déchet, bouillons, pestos de fanes. 60 €." }] }],
        ["misc:faq", { items: [{ t: "Combien de participants ?", x: "Huit au maximum." }, { t: "Le repas est-il compris ?", x: "Oui, nous dégustons ensemble ce qui a été préparé." }, { t: "Faut-il apporter quelque chose ?", x: "Un tablier et un bocal, nous fournissons le reste." }] }],
        ["cta:split", { title: "Offrez un cours.", sub: "Bon cadeau valable un an.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Tables de deux à douze personnes."),
        ["contact:map", { title: "Au bout du chemin des Jardins", mapAddress: "21 chemin des Jardins, 38000 Grenoble" }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Samedi", "12 h – 14 h · 19 h – 21 h 30"], ["Dimanche", "Brunch, 10 h – 14 h"]] }],
        ["cta:band", { title: "Allergies ou régimes particuliers ?", sub: "Signalez-les à la réservation.", cta: ["Nous écrire", "/reserver"] }],
      ] },
    ],
  },

  // 8. NOIR DE SEL — gastronomie, sombre luxe
  {
    key: "noir-de-sel", name: "Noir de Sel", category: "restaurant", tags: ["luxe", "sombre", "editorial"], siteType: "Restaurant gastronomique",
    description: "Table gastronomique nocturne : bleu nuit, or pâle, capitales espacées en Epilogue, bandeau sur fond sombre, menus dégustation et mur d'images.",
    brand: "Noir de Sel",
    tokens: { colors: { primary: "#c9a45c", secondary: "#080d14", accent: "#8fb3c9", background: "#0f1620", surface: "#17212e", text: "#eef0f3", muted: "#a9b4c2" }, fonts: { heading: "font.epilogue", body: "font.cormorant-garamond", button: "font.epilogue", link: "font.cormorant-garamond" }, radius: { sm: 0, md: 0, lg: 2, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 48, weight: 300, lineHeight: 1.12, letterSpacing: 0.06, transform: "uppercase" }, h2: { size: 30, weight: 300, lineHeight: 1.2, letterSpacing: 0.08, transform: "uppercase" }, body: { size: 19 } }, buttons: { paddingY: 14, paddingX: 34 }, border: { width: 1, color: "#2a3a4d" } },
    dna: { scale: "m", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "noir-de-sel", motifs: ["mesh", "arches", "bokeh"] },
    head: ["head:center", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Les menus", "/menus"], ["Le chef", "/chef"], ["Galerie", "/galerie"], ["Réservation", "/reservation"]], cta: ["Réserver", "/reservation"],
    contact: { address: "4 rue de l'Observatoire, 33000 Bordeaux", phone: "05 56 00 20 25", email: "maitre.hotel@noirdesel.example", hours: "Du mercredi au samedi, 19 h 30 – 22 h ; déjeuner jeudi et vendredi", tagline: "Cuisine d'auteur, vingt couverts." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Cuisine d'auteur · Bordeaux", title: "Vingt couverts. Un seul menu.", sub: "Sept à neuf services construits autour des produits d'un territoire, entre fumée, acidité et finesse.", cta: ["Réserver une table", "/reservation"], cta2: ["Découvrir les menus", "/menus"] }],
        ["feat:rows", { eyebrow: "La démarche", title: "Trois lignes directrices", items: [{ t: "Le territoire", x: "Poissons de l'estuaire, gibier de la forêt des Landes, légumes de huit jardins." }, { t: "Le geste", x: "Cuissons lentes, fumaisons à froid, sauces réduites sur quarante-huit heures." }, { t: "La suite", x: "Une dramaturgie de plats, du plus vif au plus profond." }] }],
        ["gal:wall", { items: [{ t: "Langoustine, beurre noisette" }, { t: "Pigeon, betterave fumée" }, { t: "Caviar d'aubergine" }, { t: "Chocolat, sel noir" }] }],
        ["proof:big", { items: [{ q: "Un repas hors du temps, mené avec une précision rare.", n: "Isabelle C.", r: "cliente fictive" }] }],
        ["cta:card", { title: "Réservez votre soirée.", sub: "Les réservations ouvrent soixante jours à l'avance.", cta: ["Réserver", "/reservation"] }],
      ] },
      { key: "menus", name: "Les menus", blocks: [
        ph("Les menus", "Servis à l'ensemble de la table."),
        ["feat:pricelist", { title: "Dégustations", items: [{ t: "Menu Estuaire — 7 services", x: "Poissons, coquillages, algues", price: "95 €" }, { t: "Menu Forêt — 7 services", x: "Gibier, champignons, racines", price: "110 €" }, { t: "Menu Noir de Sel — 9 services", x: "Carte blanche du chef", price: "145 €" }, { t: "Accord mets et vins", x: "Cinq verres", price: "65 €" }] }],
        ["misc:menu", { title: "Extrait de l'automne", left: ["Premiers services", [{ t: "Huître, pomme verte", x: "Eau de mer infusée", price: "I" }, { t: "Langoustine rôtie", x: "Beurre noisette, citron noir", price: "II" }]], right: ["Services principaux", [{ t: "Pigeon", x: "Betterave fumée, cassis", price: "V" }, { t: "Chevreuil", x: "Céleri, genièvre", price: "VI" }]] }],
        ["cta:split", { title: "Régime particulier ?", sub: "Menu végétal et sans gluten sur demande, quarante-huit heures à l'avance.", cta: ["Nous écrire", "/reservation"] }],
      ] },
      { key: "chef", name: "Le chef", blocks: [
        ph("Le chef"),
        ["misc:story", { eyebrow: "Portrait", title: "Antoine Valcourt (personnage fictif)", paras: ["Formé dans trois maisons étoilées, il ouvre Noir de Sel en 2019 avec une cuisine fumée et acidulée.", "Son credo : un produit, un geste, un souvenir."], image: "portrait-2" }],
        ["proof:stats", { items: [["20", "couverts par service"], ["7", "personnes en cuisine"], ["60", "jours de réservation"]] }],
        ["proof:quotes", { items: [{ q: "Un moment rare, mené avec élégance.", n: "Édouard L.", r: "client fictif" }, { q: "Chaque service raconte quelque chose.", n: "Marion A.", r: "cliente fictive" }, { q: "Le meilleur dîner de l'année.", n: "Benoît Z.", r: "client fictif" }] }],
      ] },
      { key: "galerie", name: "Galerie", blocks: [
        ph("Galerie", "Quelques images de la saison."),
        ["gal:grid", { title: "Dans la salle et en cuisine", items: [{ t: "La salle" }, { t: "Le passe" }, { t: "Le dressage" }, { t: "La cave" }, { t: "Le comptoir" }, { t: "Le dessert" }] }],
        ["gal:strip", { title: "Instants", items: [{ t: "Fumée" }, { t: "Sel noir" }, { t: "Coquille" }, { t: "Herbes" }, { t: "Tablée" }] }],
        ["cta:band", { title: "Vous aimez ce que vous voyez ?", cta: ["Réserver", "/reservation"] }],
      ] },
      { key: "reservation", name: "Réservation", blocks: [
        ph("Réservation", "Deux à six convives, en ligne ou par téléphone."),
        ["contact:info", { title: "Votre soirée à Noir de Sel", formTitle: "Demande de réservation", formIntro: "Date souhaitée, menu, allergies.", cta: ["Envoyer", "/reservation"] }],
        ["misc:hours", { title: "Services", rows: [["Mercredi", "19 h 30 – 22 h"], ["Jeudi", "12 h 15 – 14 h · 19 h 30 – 22 h"], ["Vendredi", "12 h 15 – 14 h · 19 h 30 – 22 h"], ["Samedi", "19 h 30 – 22 h"]] }],
      ] },
    ],
  },
];
