// Agriculture et alimentation (4 thèmes). Textes de DÉMONSTRATION : fermes, personnes, tarifs et coordonnées fictifs. Commandes : renvoi vers le formulaire de contact (pas de paiement en ligne).
module.exports = [
  // 1. Ferme maraîchère (thème historique)
  {
    key: "foret", name: "Forêt", category: "agriculture", tags: ["naturel", "chaleureux"], siteType: "Ferme maraîchère", featured: true,
    description: "Ferme maraîchère et vente directe : verts profonds, surfaces douces, formes arrondies et paniers de saison. Un thème calme, naturel et rassurant.",
    brand: "Ferme du Bois Joli",
    tokens: { colors: { primary: "#166534", secondary: "#052e16", accent: "#ca8a04", background: "#f1f8f3", surface: "#ffffff", text: "#10261a", muted: "#4b6556" }, fonts: { heading: "font.cormorant-garamond", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 10, card: 20 }, border: { width: 1, color: "#cfe3d5" }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 62, weight: 700, lineHeight: 1.06, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "bois-joli", motifs: ["botanical", "blobs", "dunes"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Maraîchage biologique en vente directe : paniers hebdomadaires, marché du samedi et visites de la ferme.", cols: [["La ferme", "Nos produits", "Notre histoire", "Visites"], ["Commander", "Panier de la semaine", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Nos produits", "/produits"], ["La ferme", "/la-ferme"], ["Commander", "/commander"], ["Contact", "/contact"]], cta: ["Commander un panier", "/commander"],
    contact: { address: "Chemin du Bois Joli, 79000 Niort", phone: "05 49 00 18 18", email: "ferme@bois-joli.example", hours: "Marché : samedi 8 h – 13 h · Retrait à la ferme : mercredi 16 h – 19 h", tagline: "Des légumes de saison, cultivés à deux pas de chez vous." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Maraîchage biologique", title: "Des légumes cueillis le matin, sur votre table le soir", sub: "Quinze hectares cultivés sans pesticides de synthèse, en vente directe : paniers, marché et retrait à la ferme.", cta: ["Commander un panier", "/commander"], cta2: ["Découvrir la ferme", "/la-ferme"] }],
        ["feat:cards", { eyebrow: "Nos paniers", title: "Quatre façons de manger de saison", items: [{ icon: "heart", t: "Panier solo", x: "5 à 6 légumes de saison, idéal pour une ou deux personnes." }, { icon: "home", t: "Panier famille", x: "8 à 10 légumes, de quoi nourrir quatre personnes pendant la semaine." }, { icon: "sun", t: "Panier fruits", x: "Pommes, poires, petits fruits et agrumes de producteurs voisins." }, { icon: "sparkles", t: "Panier mixte", x: "Légumes, œufs et un produit surprise de la ferme." }] }],
        ["gal:cards", { title: "À la récolte cette semaine", items: [{ t: "Carottes de sable", x: "Croquantes, récoltées à la main.", tag: "Racines" }, { t: "Courges butternut", x: "Chair fondante, conservation longue.", tag: "Courges" }, { t: "Mesclun de saison", x: "Jeunes pousses lavées et prêtes à servir.", tag: "Feuilles" }] }],
        ["proof:statsbar", { items: [["15 ha", "cultivés en bio"], ["120", "familles abonnées (exemple)"], ["40", "variétés de légumes"]] }],
        ["proof:quotes", { title: "Mots de nos abonnés", items: [{ q: "Des légumes qui ont du goût, et un panier qui change tout le temps.", n: "Sylvie A.", r: "cliente fictive" }, { q: "J'ai redécouvert les courges grâce aux recettes de la ferme.", n: "Thierry B.", r: "client fictif" }, { q: "Les enfants adorent les visites de la ferme.", n: "Claire F.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Prêt à recevoir votre premier panier ?", sub: "Écrivez-nous : nous organisons votre retrait ou votre livraison.", cta: ["Commander", "/commander"] }],
      ] },
      { key: "produits", name: "Nos produits", blocks: [
        ["misc:pagehead", { title: "Nos produits", sub: "Cultivés, récoltés et vendus sur place." }],
        ["feat:tabs", { title: "Selon les saisons", items: [{ t: "Printemps", x: "Radis, asperges, jeunes salades, petits pois, fraises." }, { t: "Été", x: "Tomates anciennes, courgettes, aubergines, haricots, melons." }, { t: "Automne", x: "Courges, choux, poireaux, pommes de terre, betteraves." }, { t: "Hiver", x: "Mâche, endives, panais, carottes, céleri-rave." }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Panier solo", price: "14 €", x: "5 à 6 légumes" }, { t: "Panier famille", price: "26 €", x: "8 à 10 légumes" }, { t: "Panier fruits", price: "18 €", x: "Fruits de saison" }, { t: "Œufs plein air (x12)", price: "4,50 €", x: "Poules élevées sur parcours" }] }],
        ["cta:card", { title: "Un doute sur la composition ?", sub: "Nous adaptons les paniers aux allergies et aux préférences.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "la-ferme", name: "La ferme", blocks: [
        ["misc:pagehead", { title: "La ferme du Bois Joli" }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Trois générations, une même terre", paras: ["Le Bois Joli est une ferme familiale reprise en 2012 par Mathilde et Antoine Rémy, après le départ à la retraite de leurs parents. Elle est passée en agriculture biologique dès 2013.", "Nous cultivons en rotation, couvrons le sol l'hiver, plantons des haies et accueillons des abeilles pour que la terre reste vivante."], image: "portrait-7" }],
        ["feat:steps", { eyebrow: "Une année à la ferme", title: "Au rythme des saisons", items: [{ d: "Mars", t: "Semis sous abri", x: "Tomates, aubergines, poivrons." }, { d: "Mai", t: "Plantation", x: "Mise en terre des plants." }, { d: "Juillet", t: "Récoltes d'été", x: "Le pic des paniers." }, { d: "Octobre", t: "Courges et racines", x: "Stockage pour l'hiver." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Mathilde Rémy", r: "Maraîchère, cheffe de culture" }, { n: "Antoine Rémy", r: "Maraîcher, livraisons" }, { n: "Jules Bardin", r: "Salarié agricole" }] }],
      ] },
      { key: "commander", name: "Commander", blocks: [
        ["misc:pagehead", { title: "Commander un panier", sub: "La commande se fait par le formulaire : nous vous répondons sous 24 h." }],
        ["feat:steps", { title: "Comment ça marche", items: [{ t: "Vous écrivez", x: "Taille du panier, fréquence, lieu de retrait." }, { t: "Nous confirmons", x: "Nous vous répondons avec les prochaines dates." }, { t: "Vous retirez", x: "Au marché, à la ferme ou en point relais." }] }],
        ["feat:list2", { title: "Points de retrait", items: [{ t: "Marché de Niort, samedi 8 h – 13 h" }, { t: "La ferme, mercredi 16 h – 19 h" }, { t: "Épicerie du Pré, vendredi 17 h – 19 h" }, { t: "Livraison à domicile (Niort et alentours)" }] }],
        ["cta:band", { title: "Prêt à commander ?", sub: "Envoyez-nous votre demande par le formulaire.", cta: ["Écrire à la ferme", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Écrire à la ferme", formTitle: "Votre message", formIntro: "Commande, visite scolaire, partenariat : on vous répond vite.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Nos horaires", rows: [["Mercredi", "16 h – 19 h, retrait à la ferme"], ["Vendredi", "17 h – 19 h, épicerie du Pré"], ["Samedi", "8 h – 13 h, marché de Niort"]] }],
      ] },
    ],
  },

  // 2. Vignoble
  {
    key: "clos-pierres-dorees", name: "Clos des Pierres Dorées", category: "agriculture", tags: ["luxe", "classique"], siteType: "Domaine viticole",
    description: "Domaine viticole élégant : bordeaux profond, or vieilli, serif d'étiquette de grand cru, grands bandeaux photo et présentation des cuvées.",
    brand: "Clos des Pierres Dorées",
    tokens: { colors: { primary: "#6b1d2a", secondary: "#2a0f15", accent: "#b8893a", background: "#faf5ef", surface: "#ffffff", text: "#2a1a1c", muted: "#6a5558" }, fonts: { heading: "font.marcellus", body: "font.lora", button: "font.lora", link: "font.lora" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e3d6c4" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.1, letterSpacing: 0.02 }, h2: { size: 36, weight: 400, lineHeight: 1.2, letterSpacing: 0.02, transform: "uppercase" } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "pierres-dorees", motifs: ["topo", "arches", "dunes"] },
    head: ["head:split", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Les vins", "/les-vins"], ["Le domaine", "/le-domaine"], ["Visites et dégustations", "/visites"], ["Contact", "/contact"]], cta: ["Réserver une visite", "/visites"],
    contact: { address: "Route des Coteaux, 33330 Saint-Émilion", phone: "05 57 00 19 19", email: "caveau@pierres-dorees.example", hours: "Caveau ouvert du lundi au samedi, 10 h – 18 h", tagline: "Quatre générations de vignerons." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Vignerons depuis 1921", title: "Le goût d'un coteau, la patience d'une famille", sub: "Dix-huit hectares en conversion biologique, des cuvées de terroir élevées en fûts de chêne et en amphore.", cta: ["Découvrir les vins", "/les-vins"], cta2: ["Réserver une dégustation", "/visites"], overlay: "#2a0f1599" }],
        ["feat:alt", { eyebrow: "Nos cuvées", title: "Trois expressions du domaine", items: [{ t: "Cuvée Pierres Dorées", x: "Merlot et cabernet franc, élevage de 18 mois en fût. Notes de cassis et de cèdre.", link: ["Les vins", "/les-vins"] }, { t: "Cuvée Calcaire", x: "Un rouge souple, issu de vieilles vignes sur sol de calcaire à astéries.", link: ["Les vins", "/les-vins"] }, { t: "Le Clos blanc", x: "Un sémillon vif, vinifié en amphore, pour l'apéritif et les fruits de mer.", link: ["Les vins", "/les-vins"] }] }],
        ["proof:stats", { title: "Le domaine en chiffres (exemples)", items: [["18 ha", "de vignes"], ["4", "générations"], ["60 000", "bouteilles par an"]] }],
        ["misc:quote", { text: "Un vin se fait d'abord dans la vigne ; la cave ne fait que l'écouter.", by: "Jeanne Marcadet, vigneronne (fictive)" }],
        ["gal:strip", { title: "Au fil des saisons", items: [{ t: "Taille d'hiver" }, { t: "Floraison" }, { t: "Véraison" }, { t: "Vendanges" }, { t: "Cuvier" }] }],
        ["cta:image", { title: "Venez goûter sur place", sub: "Visite des chais et dégustation commentée de quatre cuvées.", cta: ["Réserver", "/visites"] }],
      ] },
      { key: "les-vins", name: "Les vins", blocks: [
        ["misc:pagehead", { title: "Les vins du domaine" }],
        ["feat:pricelist", { title: "Carte des cuvées (tarifs indicatifs)", items: [{ t: "Cuvée Pierres Dorées, rouge", price: "28 €", x: "Merlot, cabernet franc · fût de chêne 18 mois" }, { t: "Cuvée Calcaire, rouge", price: "19 €", x: "Merlot, vieilles vignes · cuve béton" }, { t: "Le Clos blanc", price: "16 €", x: "Sémillon, sauvignon gris · amphore" }, { t: "Rosé de saignée", price: "11 €", x: "Cabernet franc · fraîcheur et fruit" }] }],
        ["feat:accordion", { title: "Accords mets-vins", items: [{ t: "Cuvée Pierres Dorées", x: "Côte de bœuf, agneau de lait, fromages affinés." }, { t: "Le Clos blanc", x: "Huîtres, poissons grillés, chèvre frais." }, { t: "Rosé de saignée", x: "Cuisine de l'été, grillades, tapas." }] }],
        ["cta:card", { title: "Commander ou réserver des bouteilles ?", sub: "Les commandes se traitent directement avec le domaine, par courriel ou au caveau.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "le-domaine", name: "Le domaine", blocks: [
        ["misc:pagehead", { title: "Le domaine" }],
        ["misc:story", { eyebrow: "Une famille, un terroir", title: "Quatre générations sur le même coteau", paras: ["Le Clos des Pierres Dorées est né en 1921, quand Albert Marcadet a planté ses premiers ceps sur un coteau de calcaire. Sa petite-fille Jeanne conduit aujourd'hui le domaine avec son frère Louis.", "Depuis 2019, les vignes sont en conversion biologique : enherbement, labour au cheval sur les parcelles les plus pentues, vendanges manuelles."], image: "portrait-10" }],
        ["feat:numbered", { title: "Nos convictions", items: [{ t: "Le sol", x: "Biodiversité, enherbement, zéro herbicide." }, { t: "La main", x: "Taille, effeuillage et vendanges manuels." }, { t: "Le temps", x: "Élevages longs, sans précipitation." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Jeanne Marcadet", r: "Vigneronne" }, { n: "Louis Marcadet", r: "Maître de chai" }, { n: "Elsa Vidal", r: "Accueil et dégustations" }] }],
      ] },
      { key: "visites", name: "Visites et dégustations", blocks: [
        ["misc:pagehead", { title: "Visites et dégustations" }],
        ["price:tiers", { title: "Nos expériences (exemples)", items: [{ t: "Dégustation", price: "15 €", period: "/ personne", f: ["Quatre cuvées", "Visite du chai", "Durée 1 h"], cta: "Réserver", url: "/contact" }, { t: "Coteau & chai", price: "32 €", period: "/ personne", hl: true, f: ["Balade dans les vignes", "Six cuvées", "Planche de charcuterie"], cta: "Réserver", url: "/contact" }, { t: "Vendanges", price: "65 €", period: "/ personne", f: ["Matinée de vendanges", "Déjeuner vigneron", "Une bouteille offerte"], cta: "Réserver", url: "/contact" }] }],
        ["misc:hours", { title: "Horaires du caveau", rows: [["Lundi – vendredi", "10 h – 18 h"], ["Samedi", "10 h – 19 h"], ["Dimanche", "Sur réservation"]] }],
        ["cta:band", { title: "Une visite en groupe ?", sub: "Nous accueillons jusqu'à 25 personnes.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:map", { title: "Nous trouver", mapAddress: "Route des Coteaux, 33330 Saint-Émilion" }],
        ["contact:info", { title: "Écrire au domaine", formTitle: "Votre message", formIntro: "Réservation, commande ou information : écrivez-nous.", cta: ["Envoyer", "/contact"] }],
      ] },
    ],
  },

  // 3. Apiculteur
  {
    key: "rucher-des-landes", name: "Rucher des Landes", category: "agriculture", tags: ["ludique", "chaleureux"], siteType: "Apiculteur et miellerie",
    description: "Miellerie artisanale : jaune miel et brun de ruche, titres manuscrits, formes arrondies, motifs de rayons et cartes de miels de saison.",
    brand: "Rucher des Landes",
    tokens: { colors: { primary: "#a85008", secondary: "#422006", accent: "#ca8a04", background: "#fffbeb", surface: "#ffffff", text: "#3a1f07", muted: "#6e5436" }, fonts: { heading: "font.amatic-sc", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 10, md: 18, lg: 30, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 88, weight: 700, lineHeight: 0.95, letterSpacing: 0 }, h2: { size: 56, weight: 700, lineHeight: 1, letterSpacing: 0 } } },
    dna: { scale: "xl", pad: "normal", align: "center", shape: "pill" }, art: { seed: "rucher-landes", motifs: ["tiles", "blobs", "botanical"] },
    head: ["head:float", {}], foot: ["foot:newsletter", { title: "La lettre du rucher", sub: "Récoltes, floraisons et recettes au miel, quatre fois par an.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Nos miels", "/nos-miels"], ["Le rucher", "/le-rucher"], ["Commander", "/commander"], ["Contact", "/contact"]], cta: ["Commander", "/commander"],
    contact: { address: "Lieu-dit Le Pinas, 40200 Mimizan", phone: "05 58 00 20 20", email: "miel@rucher-des-landes.example", hours: "Vente à la miellerie : mercredi et samedi, 10 h – 17 h", tagline: "Du miel de pins, de bruyère et de fleurs sauvages." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:center", { eyebrow: "Apiculteur récoltant", title: "Le miel des landes, récolté avec douceur", sub: "250 ruches posées au gré des floraisons : bruyère, châtaignier, tournesol et forêt de pins. Aucun mélange, aucune chauffe excessive.", cta: ["Voir les miels", "/nos-miels"], cta2: ["Commander", "/commander"], stats: [["250", "ruches"], ["6", "miels de saison"], ["100 %", "récolte à froid"]] }],
        ["gal:wall", { title: "Les miels du moment", items: [{ t: "Bruyère" }, { t: "Châtaignier" }, { t: "Fleurs sauvages" }, { t: "Miel de pins" }] }],
        ["feat:bento", { eyebrow: "Autour du miel", title: "Des produits de la ruche", items: [{ t: "Pain d'épices et nougats", x: "Fabriqués à la miellerie avec le miel de la récolte." }, { t: "Pollen et gelée royale", x: "Produits frais, conservés au froid et vendus en petits pots." }, { t: "Bougies en cire d'abeille", x: "Roulées à la main, avec mèche de coton." }] }],
        ["proof:quotes", { title: "Les gourmands parlent", items: [{ q: "Le miel de bruyère est une révélation.", n: "Brigitte N.", r: "cliente fictive" }, { q: "Il cristallise doucement, comme du vrai miel.", n: "Daniel Q.", r: "client fictif" }, { q: "Nos enfants le réclament au petit déjeuner.", n: "Camille V.", r: "cliente fictive" }] }],
        ["feat:icons", { title: "Nos engagements", items: [{ icon: "sun", t: "Floraisons locales", x: "Miel récolté dans un rayon de 50 km." }, { icon: "heart", t: "Abeilles respectées", x: "Pas de nourrissement sucré pendant les miellées." }, { icon: "shield", t: "Traçabilité", x: "Numéro de lot indiqué sur chaque pot." }] }],
        ["cta:band", { title: "Un pot de soleil chez vous ?", sub: "Commandes par courriel, retrait à la miellerie ou envoi en colis.", cta: ["Commander", "/commander"] }],
      ] },
      { key: "nos-miels", name: "Nos miels", blocks: [
        ["misc:pagehead", { title: "Nos miels" }],
        ["feat:pricelist", { title: "Tarifs indicatifs (pot de 500 g)", items: [{ t: "Fleurs sauvages", price: "9 €", x: "Doux, floral, texture fine" }, { t: "Châtaignier", price: "10 €", x: "Corsé, ambré, notes boisées" }, { t: "Bruyère callune", price: "12 €", x: "Épicé, rond, légèrement acidulé" }, { t: "Miel de pins", price: "11 €", x: "Résineux, malté, peu sucré" }] }],
        ["feat:accordion", { title: "Bien choisir son miel", items: [{ t: "Quel miel pour les tisanes ?", x: "Un miel doux comme celui de fleurs sauvages." }, { t: "Pourquoi mon miel cristallise-t-il ?", x: "C'est un signe de qualité ; chauffez doucement au bain-marie pour le liquéfier." }, { t: "Quelle conservation ?", x: "À l'abri de la lumière, à température ambiante, pendant deux ans." }] }],
        ["gal:products", { title: "Autres produits (démonstration)", items: [{ t: "Pain d'épices", price: "6 €" }, { t: "Nougat au miel", price: "7 €" }, { t: "Bougie en cire", price: "12 €" }, { t: "Pollen frais", price: "9 €" }] }],
      ] },
      { key: "le-rucher", name: "Le rucher", blocks: [
        ["misc:pagehead", { title: "Le rucher" }],
        ["misc:story", { eyebrow: "L'apiculteur", title: "Vingt ans à suivre les fleurs", paras: ["Après des années d'ingénierie forestière, Marc Lasserre a posé ses premières ruches dans la forêt des Landes. Il déplace aujourd'hui ses colonies au rythme des floraisons.", "Chaque ruche est visitée tous les dix jours en saison. Le miel est extrait à froid, filtré sans pression et mis en pot sous trois jours."], image: "portrait-11" }],
        ["feat:steps", { eyebrow: "Une saison", title: "Le cycle des abeilles", items: [{ d: "Mars", t: "Réveil", x: "Visite de printemps et vérification des reines." }, { d: "Mai", t: "Transhumance", x: "Déplacement vers les acacias et les châtaigniers." }, { d: "Juillet", t: "Récolte", x: "Extraction des hausses." }, { d: "Octobre", t: "Hivernage", x: "Préparation des colonies pour le froid." }] }],
        ["feat:numbered", { title: "Chiffres du rucher (exemples)", items: [{ t: "250", x: "ruches actives" }, { t: "8 t", x: "de miel par an" }, { t: "6", x: "floraisons suivies" }] }],
      ] },
      { key: "commander", name: "Commander", blocks: [
        ["misc:pagehead", { title: "Commander", sub: "Par courriel, sans paiement en ligne : vous réglez à la remise ou à réception." }],
        ["feat:steps", { title: "Comment commander", items: [{ t: "Vous écrivez", x: "Miels souhaités, quantité, adresse ou jour de retrait." }, { t: "Nous répondons", x: "Confirmation, total et délai." }, { t: "Vous recevez", x: "Retrait à la miellerie ou colis sous 5 jours." }] }],
        ["feat:list2", { title: "Livraison et retrait", items: [{ t: "Retrait gratuit à la miellerie" }, { t: "Colis dès 2 pots" }, { t: "Marchés de Mimizan et Biscarrosse" }, { t: "Pots consignés (bon de réduction)" }] }],
        ["cta:band", { title: "Votre commande de miel", sub: "Envoyez-nous votre liste par le formulaire.", cta: ["Écrire au rucher", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Nous joindre" }],
        ["misc:hours", { title: "Vente à la miellerie", rows: [["Mercredi", "10 h – 17 h"], ["Samedi", "10 h – 17 h"], ["Marchés d'été", "Mimizan le mardi, Biscarrosse le jeudi"]] }],
      ] },
    ],
  },

  // 4. Fromagerie
  {
    key: "fromagerie-haut-pre", name: "Fromagerie du Haut-Pré", category: "agriculture", tags: ["audacieux", "ludique"], siteType: "Fromagerie fermière",
    description: "Fromagerie fermière franche et colorée : bleu cobalt et jaune beurre, capitales épaisses, grands blocs de couleur et fiches de fromages.",
    brand: "Fromagerie du Haut-Pré",
    tokens: { colors: { primary: "#1e40af", secondary: "#172554", accent: "#eab308", background: "#fffdf3", surface: "#ffffff", text: "#14213d", muted: "#4a5675" }, fonts: { heading: "font.bungee", body: "font.figtree", button: "font.bungee", link: "font.figtree" }, radius: { sm: 6, md: 12, lg: 20, button: 10, field: 10, card: 16 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.08, letterSpacing: 0 }, h2: { size: 34, weight: 400, lineHeight: 1.15, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "haut-pre", motifs: ["blobs", "objects", "plates"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Fromagerie fermière : lait de nos 60 vaches, fabrication à la ferme, vente au magasin et sur les marchés.", cols: [["La fromagerie", "Nos fromages", "Notre histoire", "Visites"], ["Commander", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Nos fromages", "/nos-fromages"], ["La fromagerie", "/la-fromagerie"], ["Commander", "/commander"], ["Contact", "/contact"]], cta: ["Commander", "/commander"],
    contact: { address: "Ferme du Haut-Pré, 39800 Poligny", phone: "03 84 00 21 21", email: "magasin@haut-pre.example", hours: "Magasin : mardi au samedi, 9 h – 12 h 30 et 15 h – 18 h 30", tagline: "Le lait de nos vaches, le geste de nos fromagers." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Fromagerie fermière", title: "Du lait de la ferme à la cave d'affinage", sub: "Soixante vaches montbéliardes, un atelier de fabrication, trois caves d'affinage : cinq fromages (dont un frais) que nous suivons du pré à l'assiette.", cta: ["Voir les fromages", "/nos-fromages"], cta2: ["Commander", "/commander"], angle: 150, stats: [["60", "vaches montbéliardes"], ["5", "fromages"], ["14 mois", "d'affinage maximal"]] }],
        ["feat:strips", { eyebrow: "La gamme", title: "Quatre fromages de caractère", items: [{ t: "Le Haut-Pré", x: "Pâte pressée cuite, affinée 14 mois, notes de noisette." }, { t: "Le Petit Cobalt", x: "Croûte fleurie, pâte souple, doux et crémeux." }, { t: "Le Bleu du Mont", x: "Persillé, puissant, affiné en cave humide." }, { t: "La Tomme des Vaches", x: "Pâte pressée non cuite, goût rond et lacté." }] }],
        ["feat:numbered", { title: "Comment on les fait", items: [{ t: "Traite", x: "Deux fois par jour, lait livré à l'atelier en 20 minutes." }, { t: "Caillage", x: "Cuve en cuivre, présure naturelle, brassage lent." }, { t: "Affinage", x: "Frottage, retournement et patience en cave." }] }],
        ["gal:grid", { title: "À la ferme", items: [{ t: "Les vaches au pré" }, { t: "La cuve de caillage" }, { t: "Les caves d'affinage" }, { t: "Le magasin" }] }],
        ["proof:stats", { title: "La fromagerie en chiffres (exemples)", items: [["40 ha", "de prairies naturelles"], ["300 t", "de lait transformé par an"], ["3", "caves d'affinage"]] }],
        ["cta:split", { title: "Un plateau pour vos fêtes ?", sub: "Composez-le avec nous : réservation par le formulaire.", cta: ["Commander", "/commander"] }],
      ] },
      { key: "nos-fromages", name: "Nos fromages", blocks: [
        ["misc:pagehead", { title: "Nos fromages" }],
        ["gal:cards", { title: "Fiches fromages", items: [{ t: "Le Haut-Pré", x: "Pâte pressée cuite, 14 mois d'affinage.", tag: "Vache · 14 mois" }, { t: "Le Bleu du Mont", x: "Pâte persillée, saveur intense.", tag: "Vache · 3 mois" }, { t: "Le Petit Cobalt", x: "Croûte fleurie, texture crémeuse.", tag: "Vache · 5 semaines" }] }],
        ["feat:pricelist", { title: "Tarifs indicatifs", items: [{ t: "Le Haut-Pré (le kg)", price: "34 €", x: "Aussi vendu à la coupe" }, { t: "Le Bleu du Mont (le kg)", price: "29 €", x: "Pièce de 250 g : 7,50 €" }, { t: "Le Petit Cobalt (pièce)", price: "6,50 €", x: "250 g environ" }, { t: "Le Frais du Matin (pot 500 g)", price: "4,20 €", x: "Nature ou aux herbes" }] }],
        ["feat:accordion", { title: "Conseils de dégustation", items: [{ t: "À quelle température servir ?", x: "Sortez-les de la cave à frigo 30 minutes avant de les déguster." }, { t: "Quel vin avec le Haut-Pré ?", x: "Un vin jaune ou un blanc du Jura, tout en rondeur." }] }],
      ] },
      { key: "la-fromagerie", name: "La fromagerie", blocks: [
        ["misc:pagehead", { title: "La fromagerie" }],
        ["misc:story", { eyebrow: "Notre ferme", title: "Une affaire de famille et de lait cru", paras: ["Éric et Valérie Perrin ont repris la ferme du Haut-Pré en 2009. Ils ont construit l'atelier de fabrication dans l'ancienne grange et fabriquent leurs fromages au lait cru de leur troupeau.", "Les vaches pâturent six mois par an dans des prairies naturelles de 40 hectares. Le foin est séché en grange pour l'hiver."], image: "portrait-13" }],
        ["feat:icons", { title: "Nos règles", items: [{ icon: "heart", t: "Lait cru", x: "Aucun traitement thermique." }, { icon: "sun", t: "Pâturage", x: "Six mois par an dans les prés." }, { icon: "shield", t: "Pas d'ensilage", x: "Foin et herbe uniquement." }, { icon: "clock", t: "Affinage lent", x: "Chaque fromage prend son temps." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Éric Perrin", r: "Éleveur et fromager" }, { n: "Valérie Perrin", r: "Affineuse" }, { n: "Noé Charpy", r: "Magasin et marchés" }] }],
      ] },
      { key: "commander", name: "Commander", blocks: [
        ["misc:pagehead", { title: "Commander", sub: "Plateaux, pièces entières et colis : par le formulaire, sans paiement en ligne." }],
        ["feat:cards", { title: "Nos formules", items: [{ icon: "heart", t: "Plateau de fêtes", x: "Cinq fromages, de quoi régaler six à huit personnes." }, { icon: "briefcase", t: "Colis découverte", x: "Quatre fromages expédiés sous glace partout en France." }, { icon: "users", t: "Restaurateurs", x: "Tarifs professionnels, livraison régulière." }] }],
        ["feat:steps", { title: "Comment faire", items: [{ t: "Dites-nous", x: "Fromages, quantités, date de retrait." }, { t: "Nous préparons", x: "Découpe à la demande." }, { t: "Retrait ou envoi", x: "Au magasin ou en colis réfrigéré." }] }],
        ["cta:band", { title: "Passez commande", sub: "Réponse sous 24 h ouvrées.", cta: ["Écrire à la fromagerie", "/contact"] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Nous écrire", formTitle: "Votre message", formIntro: "Commande, visite de groupe ou partenariat.", cta: ["Envoyer", "/contact"] }],
        ["misc:hours", { title: "Horaires du magasin", rows: [["Mardi – vendredi", "9 h – 12 h 30 · 15 h – 18 h 30"], ["Samedi", "9 h – 18 h"], ["Dimanche – lundi", "Fermé"]] }],
      ] },
    ],
  },
];
