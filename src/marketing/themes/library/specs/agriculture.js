// Agriculture (9 thèmes v2). Textes de DÉMONSTRATION : exploitations, personnes, tarifs et coordonnées fictifs. Commandes : renvoi vers le formulaire de contact (pas de paiement en ligne).
const T = [];

// 1. Ferme maraîchère en paniers
T.push({
  key: "glanure-verte", name: "Glanure Verte", category: "agriculture", tags: ["naturel", "chaleureux"], siteType: "Ferme maraîchère en paniers", featured: true,
  description: "Maraîchage en paniers hebdomadaires : vert feuille, jaune paille et formes en pilule. Une composition d'accueil aérée qui met le panier de la semaine et les points de retrait au premier plan.",
  brand: "Les Jardins de la Glanure",
  tokens: { colors: { primary: "#2e7d32", secondary: "#14331a", accent: "#e0a526", background: "#f6faf1", surface: "#ffffff", text: "#16281a", muted: "#4a5f4d" }, fonts: { heading: "font.young-serif", body: "font.lexend", button: "font.lexend", link: "font.lexend" }, radius: { sm: 8, md: 14, lg: 26, button: 999, field: 12, card: 22 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d3e4c9" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.08, letterSpacing: -0.01 } } },
  dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "glanure", motifs: ["botanical", "blobs", "dunes"] },
  head: ["head:bar", {}],
  foot: ["foot:columns", { about: "Maraîchage en paniers hebdomadaires : retrait à la ferme, deux relais de quartier et livraison à vélo.", cols: [["Les paniers", "Formules", "Calendrier des récoltes", "Points de retrait"], ["La ferme", "Notre méthode", "Visites", "Contact"]] }],
  menu: [["Accueil", "/"], ["Les paniers", "/paniers"], ["Calendrier", "/calendrier"], ["La ferme", "/la-ferme"], ["Contact", "/contact"]], cta: ["Réserver mon panier", "/contact"],
  contact: { address: "Route de la Glanure, 37300 Joué-lès-Tours", phone: "02 47 00 41 41", email: "paniers@glanure.example", hours: "Retrait à la ferme : mardi et vendredi 16 h 30 – 19 h", tagline: "Un panier de légumes frais chaque semaine, cueillis la veille." },
  social: ["instagram", "facebook"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:split", { eyebrow: "Paniers de légumes hebdomadaires", title: "Le potager de la semaine, dans votre cabas", sub: "Douze hectares cultivés sans produit chimique de synthèse. Vous choisissez une formule, nous récoltons la veille de votre retrait.", cta: ["Réserver mon panier", "/contact"], cta2: ["Voir les formules", "/paniers"] }],
      ["feat:cards", { eyebrow: "Les formules", title: "Un panier à la taille de votre table", items: [{ icon: "user", t: "Petit panier", x: "Quatre à cinq légumes pour une ou deux personnes." }, { icon: "home", t: "Panier famille", x: "Sept à neuf légumes, de quoi cuisiner toute la semaine." }, { icon: "sun", t: "Panier d'été en plus", x: "Tomates, aubergines et herbes fraîches ajoutées de juin à septembre." }, { icon: "heart", t: "Panier solidaire", x: "Un tarif réduit financé par les abonnés qui le souhaitent." }] }],
      ["gal:cards", { title: "Dans les caisses cette semaine", items: [{ t: "Carottes botte", x: "Fanes fraîches, goût sucré.", tag: "Racines" }, { t: "Blettes à cardes blanches", x: "Tendres, à poêler ou en gratin.", tag: "Feuilles" }, { t: "Courgettes jaunes", x: "Récoltées jeunes pour rester fondantes.", tag: "Fruits" }] }],
      ["proof:statsbar", { items: [["12 ha", "en culture"], ["140", "paniers par semaine (exemple)"], ["3", "points de retrait"]] }],
      ["proof:quotes", { title: "Ce qu'en disent les abonnés", items: [{ q: "On découvre un légume nouveau chaque semaine, et la fiche recette aide beaucoup.", n: "Aurélie N.", r: "cliente fictive" }, { q: "Retrait facile le vendredi, et des salades qui tiennent cinq jours.", n: "Maxime D.", r: "client fictif" }, { q: "Le panier solidaire nous permet de manger bio sans compter.", n: "Fatou S.", r: "cliente fictive" }] }],
      ["cta:band", { title: "Les inscriptions pour la saison sont ouvertes", sub: "Écrivez-nous : nous réservons votre panier et votre créneau de retrait.", cta: ["Réserver mon panier", "/contact"] }],
    ] },
    { key: "paniers", name: "Les paniers", blocks: [
      ["misc:pagehead", { title: "Les paniers", sub: "Trois formules, sans engagement long." }],
      ["feat:pricelist", { title: "Tarifs indicatifs (exemples)", items: [{ t: "Petit panier", price: "13 €", x: "4 à 5 légumes" }, { t: "Panier famille", price: "24 €", x: "7 à 9 légumes" }, { t: "Panier solidaire", price: "10 €", x: "Petit panier à tarif réduit" }, { t: "Option œufs (x6)", price: "2,80 €", x: "Poules élevées sur parcours herbeux" }] }],
      ["feat:checks", { title: "Ce que comprend l'abonnement", cta: ["Nous contacter", "/contact"], items: [{ t: "Une fiche recettes avec chaque panier" }, { t: "Une pause possible pendant vos vacances" }, { t: "Un échange de légume que vous n'aimez pas" }, { t: "Des paniers sans emballage plastique" }] }],
      ["cta:card", { title: "Une question sur la composition ?", sub: "Allergies, préférences : nous adaptons au mieux.", cta: ["Écrire à la ferme", "/contact"] }],
    ] },
    { key: "calendrier", name: "Calendrier", blocks: [
      ["misc:pagehead", { title: "Calendrier des récoltes", sub: "Ce que vous trouverez dans le panier, mois par mois." }],
      ["feat:steps", { title: "Au fil de l'année", items: [{ d: "Mars – mai", t: "Les premiers verts", x: "Radis, épinards, jeunes poireaux, asperges de la voisine." }, { d: "Juin – août", t: "Le plein soleil", x: "Tomates, courgettes, haricots, concombres, basilic." }, { d: "Sept. – nov.", t: "Les courges arrivent", x: "Potimarrons, poireaux, choux, pommes de terre, betteraves." }, { d: "Déc. – fév.", t: "Légumes d'hiver", x: "Panais, céleri-rave, mâche, carottes de garde." }] }],
      ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Que se passe-t-il en cas de gelée ou de grêle ?", x: "Le panier est allégé mais jamais supprimé : nous complétons avec des produits de fermes voisines." }, { t: "Puis-je changer de formule ?", x: "Oui, avant le jeudi soir pour la semaine suivante." }, { t: "Où retirer mon panier ?", x: "À la ferme, ou dans l'un des deux relais de quartier (adresses communiquées à l'inscription)." }] }],
    ] },
    { key: "la-ferme", name: "La ferme", blocks: [
      ["misc:pagehead", { title: "La ferme de la Glanure" }],
      ["misc:story", { eyebrow: "Notre parcours", title: "Deux maraîchers, une terre reprise en 2016", paras: ["Cécile et Joris ont repris ce terrain d'ancien verger pour y cultiver des légumes. Ils travaillent à la main, couvrent les sols et associent les cultures pour limiter les traitements.", "L'eau vient d'une retenue collinaire, les plants sont semés sur place et le surplus est donné chaque mois à une épicerie solidaire du quartier."] }],
      ["proof:stats", { title: "La ferme en chiffres (exemples)", items: [["12 ha", "cultivés"], ["45", "variétés de légumes"], ["4", "personnes à la ferme"]] }],
      ["cta:split", { title: "Venez voir où poussent vos légumes", sub: "Une visite gratuite est organisée le premier samedi de chaque mois.", cta: ["S'inscrire à la visite", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact", sub: "Réservation de panier, visite ou question." }],
      ["contact:info", { title: "Parler à la ferme", formTitle: "Réserver un panier", formIntro: "Indiquez votre formule et votre point de retrait, nous revenons vers vous sous deux jours.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Retraits", rows: [["Mardi", "16 h 30 – 19 h"], ["Vendredi", "16 h 30 – 19 h"], ["Samedi (visite)", "10 h – 12 h, une fois par mois"]] }],
    ] },
  ],
});

// 2. Vignoble (thème sombre)
T.push({
  key: "cep-minuit", name: "Cep de Minuit", category: "agriculture", tags: ["sombre", "luxe", "editorial"], siteType: "Domaine viticole et vente de vin", isNew: true,
  modules: ["Boutique en ligne : le module e-commerce n'est pas installé, le catalogue est une démonstration"],
  description: "Domaine viticole en tons de lie-de-vin sur fond nuit, titres fins de style affiche et bandeau photographique. Cuvées, dégustations au caveau et commande par demande de contact.",
  brand: "Domaine des Côtes Obscures",
  tokens: { colors: { primary: "#d982b0", secondary: "#2a1220", accent: "#e8c07a", background: "#1a0e15", surface: "#27161f", text: "#f5e9ee", muted: "#c9b2bd" }, fonts: { heading: "font.italiana", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#4a2a3b" }, type: { h1: { size: 64, weight: 400, lineHeight: 1.04, letterSpacing: 0.01 } } },
  dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "cep-minuit", motifs: ["topo", "arches", "rays"] },
  head: ["head:center", {}],
  foot: ["foot:big", { title: "Domaine des Côtes Obscures" }],
  menu: [["Accueil", "/"], ["Les cuvées", "/cuvees"], ["Dégustation", "/degustation"], ["Le domaine", "/domaine"], ["Contact", "/contact"]], cta: ["Commander des bouteilles", "/contact"],
  contact: { address: "Lieu-dit Les Côtes Obscures, 33330 Saint-Émilion", phone: "05 57 00 23 23", email: "cave@cotes-obscures.example", hours: "Caveau : du mercredi au dimanche, 10 h – 18 h", tagline: "Vins de propriété, en vente directe." },
  social: ["instagram"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:cover", { eyebrow: "Vins de propriété", title: "Des vignes à flanc de coteau, des vins à l'ombre longue", sub: "Quatorze hectares conduits en agriculture biologique, vinifiés et élevés au domaine.", cta: ["Découvrir les cuvées", "/cuvees"], cta2: ["Réserver une dégustation", "/degustation"] }],
      ["feat:alt", { eyebrow: "Trois signatures", title: "Nos cuvées du moment", items: [{ t: "Cuvée Vieille Souche", x: "Merlot et cabernet franc sur argile, douze mois de fût. Fruits noirs, tanins soyeux.", link: ["Voir la fiche", "/cuvees"] }, { t: "Rosé de Saignée", x: "Pressurage direct de raisins rouges, bouche tendue et florale.", link: ["Voir la fiche", "/cuvees"] }, { t: "Blanc des Calcaires", x: "Sémillon et sauvignon, élevage sur lies fines, finale saline.", link: ["Voir la fiche", "/cuvees"] }] }],
      ["proof:big", { items: [{ q: "Un vin qui se laisse découvrir lentement, comme la visite du chai.", n: "Bastien L.", r: "client fictif" }] }],
      ["gal:strip", { title: "Au fil des saisons", items: [{ t: "Taille" }, { t: "Vendanges" }, { t: "Cuvier" }, { t: "Fûts" }, { t: "Mise en bouteille" }] }],
      ["cta:image", { title: "Une cave à visiter sur rendez-vous", sub: "Dégustation commentée de cinq vins dans le chai.", cta: ["Réserver", "/degustation"] }],
    ] },
    { key: "cuvees", name: "Les cuvées", blocks: [
      ["misc:pagehead", { title: "Les cuvées", sub: "Prix indicatifs de démonstration, commande sur demande." }],
      ["gal:products", { title: "Le catalogue", items: [{ t: "Vieille Souche rouge", price: "24 €", x: "Merlot, cabernet franc" }, { t: "Rosé de Saignée", price: "11 €", x: "Merlot" }, { t: "Blanc des Calcaires", price: "15 €", x: "Sémillon, sauvignon" }, { t: "Crémant brut nature", price: "17 €", x: "Méthode traditionnelle" }] }],
      ["misc:product", { eyebrow: "Cuvée phare", title: "Vieille Souche rouge", price: "24 €", text: "Vignes de quarante-cinq ans, vendange manuelle, élevage de douze mois en fûts de deux vins.", points: ["Bouche pleine, tanins fins", "À servir vers 17 °C", "Garde : 8 à 10 ans"], cta: "Demander cette cuvée", url: "/contact", note: "Commande par le formulaire de contact : pas de paiement en ligne." }],
    ] },
    { key: "degustation", name: "Dégustation", blocks: [
      ["misc:pagehead", { title: "Dégustation au caveau" }],
      ["feat:pricelist", { title: "Les formules (exemples)", items: [{ t: "Découverte, 3 vins", price: "12 €", x: "Remboursée dès trois bouteilles achetées" }, { t: "Verticale, 5 millésimes", price: "28 €", x: "Sur rendez-vous, une heure" }, { t: "Accord vins et fromages", price: "35 €", x: "Planche locale incluse" }] }],
      ["misc:schedule", { title: "Une visite type", items: [{ d: "0 h 00", t: "Accueil dans les vignes", x: "Explication des parcelles." }, { d: "0 h 20", t: "Le chai", x: "Cuves et fûts, vinification." }, { d: "0 h 45", t: "Dégustation", x: "Cinq vins commentés." }] }],
    ] },
    { key: "domaine", name: "Le domaine", blocks: [
      ["misc:pagehead", { title: "Le domaine" }],
      ["misc:story", { eyebrow: "Une histoire de famille", title: "Quatre générations sur la même colline", paras: ["Le domaine est cultivé depuis 1934 par la famille Lanvergne, aujourd'hui représentée par Élise, œnologue, et son frère Mathis, qui conduit les vignes.", "La conduite est biologique, avec enherbement, labours doux et vendanges manuelles en cagettes pour préserver le raisin."] }],
      ["feat:numbered", { title: "Nos engagements", items: [{ t: "14 ha", x: "tous en agriculture biologique" }, { t: "0", x: "désherbant chimique de synthèse" }, { t: "100 %", x: "des vins mis en bouteille au domaine" }] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:map", { title: "Nous trouver", mapAddress: "Saint-Émilion, France" }],
      ["misc:hours", { title: "Ouverture du caveau", rows: [["Mercredi – vendredi", "10 h – 18 h"], ["Samedi – dimanche", "10 h – 19 h"], ["Lundi – mardi", "Sur rendez-vous"]] }],
    ] },
  ],
});

// 3. Fromagerie fermière
T.push({
  key: "caillebotte", name: "Caillebotte", category: "agriculture", tags: ["chaleureux", "editorial"], siteType: "Fromagerie fermière",
  description: "Fromagerie fermière aux tons de croûte et de crème, titres de presse à empattements calés à gauche et grille asymétrique. Affinage, tournée des marchés et commande par contact.",
  brand: "Fromagerie de la Combe",
  tokens: { colors: { primary: "#a15a00", secondary: "#3a2410", accent: "#2f6f8f", background: "#fbf5e6", surface: "#fffdf7", text: "#2c1f12", muted: "#665544" }, fonts: { heading: "font.alegreya", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 2, md: 6, lg: 10, button: 4, field: 4, card: 6 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#e5d6b4" }, type: { h1: { size: 58, weight: 800, lineHeight: 1.04, letterSpacing: -0.015 } } },
  dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "caillebotte", motifs: ["plates", "tiles", "halftone"] },
  head: ["head:topbar", { info: "Vente à la ferme du mardi au samedi · Marché de Chambéry le samedi matin", note: "Fromages au lait cru" }],
  foot: ["foot:newsletter", { title: "La lettre de l'affinage", sub: "Une fois par mois : nouveautés de la cave et dates de marché.", button: "Je m'abonne" }],
  menu: [["Accueil", "/"], ["Nos fromages", "/fromages"], ["Affinage", "/affinage"], ["Marchés", "/marches"], ["Contact", "/contact"]], cta: ["Commander un plateau", "/contact"],
  contact: { address: "La Combe, 73190 Challes-les-Eaux", phone: "04 79 00 66 66", email: "ferme@fromagerie-combe.example", hours: "Boutique : mardi – samedi, 9 h – 12 h 30 et 15 h – 19 h", tagline: "Lait de nos chèvres et de nos vaches, fromages de la ferme." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:split-left", { eyebrow: "Lait cru, affinage lent", title: "Des fromages nés à la traite et affinés à la cave", sub: "Soixante chèvres, vingt vaches, et un hâloir en pierre où les croûtes se forment à leur rythme.", cta: ["Voir les fromages", "/fromages"], cta2: ["Où nous trouver", "/marches"] }],
      ["feat:bento", { eyebrow: "La gamme", title: "Trois familles de fromages", items: [{ t: "Les chèvres", x: "Bûchettes fraîches, crottins affinés quatre semaines, cendré à croûte fleurie.", icon: "heart" }, { t: "Les vaches", x: "Tomme de montagne, reblochon fermier, pâte pressée de six mois.", icon: "home" }, { t: "Les frais", x: "Faisselle, yaourts et beurre baratté.", icon: "sparkles" }] }],
      ["gal:featured", { title: "Sur la table de dégustation", items: [{ t: "Tomme de la Combe", x: "Pâte pressée, notes de noisette." }, { t: "Crottin cendré", x: "Fondant, croûte fleurie." }, { t: "Reblochon fermier", x: "Lait cru, texture crémeuse." }, { t: "Fromage blanc", x: "Frais, légèrement acidulé." }] }],
      ["feat:steps", { title: "Du lait à l'assiette", items: [{ d: "6 h", t: "La traite", x: "Le lait est travaillé dans les deux heures." }, { d: "J + 1", t: "Le moulage", x: "À la louche, sans pression." }, { d: "J + 30", t: "L'affinage", x: "Retournement et brossage manuels." }] }],
      ["proof:quotes", { title: "Les clients en parlent", items: [{ q: "La tomme a une vraie longueur en bouche, rien à voir avec le supermarché.", n: "Hélène P.", r: "cliente fictive" }, { q: "Leur plateau pour notre repas de famille a fait l'unanimité.", n: "Romain C.", r: "client fictif" }, { q: "J'ai appris à reconnaître un lait cru grâce à leur accueil.", n: "Inès V.", r: "cliente fictive" }] }],
      ["cta:split", { title: "Un plateau pour votre prochain repas ?", sub: "Dites-nous le nombre de convives, nous composons le plateau.", cta: ["Commander un plateau", "/contact"] }],
    ] },
    { key: "fromages", name: "Nos fromages", blocks: [
      ["misc:pagehead", { title: "Nos fromages", sub: "Disponibles selon la saison et la lactation." }],
      ["feat:pricelist", { title: "Tarifs au kilo (exemples)", items: [{ t: "Tomme de la Combe", price: "28 €/kg", x: "Vache, 3 mois" }, { t: "Crottin cendré (pièce)", price: "2,60 €", x: "Chèvre, 4 semaines" }, { t: "Reblochon fermier", price: "22 €/kg", x: "Vache, lait cru" }, { t: "Beurre baratté", price: "14 €/kg", x: "Demi-sel ou doux" }] }],
      ["feat:compare", { title: "Choisir son fromage", rows: [["", "Chèvre", "Vache"], ["Texture", "Fondante, crémeuse", "Pressée, souple"], ["Saveur", "Acidulée, lactique", "Noisette, beurrée"], ["À associer", "Vin blanc sec", "Vin rouge léger"]] }],
      ["cta:card", { title: "Envie d'un conseil ?", sub: "Nous composons des plateaux sur mesure.", cta: ["Nous écrire", "/contact"] }],
    ] },
    { key: "affinage", name: "Affinage", blocks: [
      ["misc:pagehead", { title: "La cave d'affinage" }],
      ["misc:text", { eyebrow: "Savoir-faire", title: "Le temps comme ingrédient", paras: ["Nos fromages reposent sur planches d'épicéa dans une cave naturellement fraîche. Chaque pièce est retournée, frottée à l'eau salée et surveillée selon son profil.", "Nous ne fabriquons que ce que nous pouvons affiner nous-mêmes : cela limite les volumes mais assure une régularité de qualité."] }],
      ["feat:accordion", { title: "Pour mieux comprendre", items: [{ t: "Qu'est-ce que le lait cru ?", x: "Un lait non chauffé au-delà de 40 °C, qui garde sa flore naturelle et donne des arômes plus variés." }, { t: "Peut-on congeler un fromage ?", x: "Nous le déconseillons : la pâte devient granuleuse." }, { t: "Quelle est la durée de conservation ?", x: "Comptez dix jours pour les croûtes fleuries, plusieurs semaines pour les pâtes pressées." }] }],
    ] },
    { key: "marches", name: "Marchés", blocks: [
      ["misc:pagehead", { title: "Où nous trouver" }],
      ["misc:hours", { title: "Tournée de la semaine", rows: [["Mardi – vendredi", "Boutique à la ferme, 9 h – 12 h 30"], ["Mercredi", "Marché de Montmélian, 7 h – 13 h"], ["Samedi", "Marché de Chambéry, 7 h – 13 h"]] }],
      ["cta:band", { title: "Un événement ou un restaurant à servir ?", sub: "Livraisons professionnelles sur demande.", cta: ["Nous contacter", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:cards", { title: "Écrire à la fromagerie", formTitle: "Commander un plateau", formIntro: "Précisez le nombre de personnes et la date souhaitée.", cta: ["Envoyer", "/contact"] }],
      ["feat:list2", { title: "Pensez à nous dire", items: [{ t: "La date de retrait" }, { t: "Les fromages à éviter" }, { t: "Le budget souhaité" }, { t: "Les contraintes d'allergie" }] }],
    ] },
  ],
});


// 4. Apiculteur / miel (sombre)
T.push({
  key: "rucher-ambre", name: "Rucher d'Ambre", category: "agriculture", tags: ["sombre", "chaleureux", "audacieux"], siteType: "Apiculteur et vente de miel",
  modules: ["Boutique en ligne : le module e-commerce n'est pas installé, le catalogue est une démonstration"],
  description: "Apiculture et miels de terroir : fond brun profond, jaune ambre éclatant, grandes plaques à empattements et affiche d'accueil en capitales. Récoltes par fleurs, produits de la ruche et commande par contact.",
  brand: "Rucher des Quatre Vents",
  tokens: { colors: { primary: "#f0b429", secondary: "#2b1d0c", accent: "#ffd980", background: "#1f1509", surface: "#2d2010", text: "#fbf1dc", muted: "#d2bf9c" }, fonts: { heading: "font.zilla-slab", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 6, card: 10 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#4b3716" }, type: { h1: { size: 60, weight: 700, lineHeight: 1.02, letterSpacing: -0.01, transform: "uppercase" } } },
  dna: { scale: "xl", pad: "normal", align: "left", shape: "soft" }, art: { seed: "rucher", motifs: ["tiles", "halftone", "rays"] },
  head: ["head:dark", {}],
  foot: ["foot:center", {}],
  menu: [["Accueil", "/"], ["Nos miels", "/miels"], ["La ruche", "/ruche"], ["Visites", "/visites"], ["Contact", "/contact"]], cta: ["Commander du miel", "/contact"],
  contact: { address: "Chemin des Quatre Vents, 26150 Die", phone: "04 75 00 77 77", email: "miel@quatre-vents.example", hours: "Vente au rucher : jeudi – samedi, 10 h – 18 h", tagline: "Miels récoltés par nos soins, de la ruche au pot." },
  social: ["instagram", "facebook"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:poster", { eyebrow: "Apiculteur récoltant", title: "Du miel, rien que du miel", sub: "Quatre-vingts ruches posées entre lavande, châtaigniers et prairies, extraites à froid.", cta: ["Voir les miels", "/miels"], cta2: ["Visiter le rucher", "/visites"] }],
      ["feat:numbered", { title: "Un rucher à taille humaine", items: [{ t: "80", x: "ruches conduites sans traitement chimique" }, { t: "5", x: "miels de fleurs distincts chaque année" }, { t: "0", x: "chauffage du miel à l'extraction" }] }],
      ["gal:products", { title: "Les pots du moment", items: [{ t: "Miel de lavande", price: "9 €", x: "Pot de 250 g" }, { t: "Miel de châtaignier", price: "9,50 €", x: "Pot de 250 g" }, { t: "Miel de printemps", price: "8 €", x: "Pot de 250 g" }, { t: "Pain d'épices", price: "6 €", x: "Au miel, 300 g" }] }],
      ["feat:checks", { title: "Ce que nous nous engageons à faire", cta: ["En savoir plus", "/ruche"], items: [{ t: "Récolter uniquement le surplus" }, { t: "Indiquer l'origine florale de chaque pot" }, { t: "Laisser des réserves aux abeilles pour l'hiver" }, { t: "Mettre en pot sur place" }] }],
      ["cta:card", { title: "Un colis ou un cadeau d'entreprise ?", sub: "Écrivez-nous pour une commande de plusieurs pots.", cta: ["Nous contacter", "/contact"] }],
    ] },
    { key: "miels", name: "Nos miels", blocks: [
      ["misc:pagehead", { title: "Nos miels", sub: "Un miel par fleur, une récolte par an." }],
      ["feat:tabs", { title: "Des fleurs, des goûts", items: [{ t: "Lavande", x: "Clair, crémeux, note florale douce. Récolte de juillet." }, { t: "Châtaignier", x: "Ambré foncé, un peu amer, très aromatique. Récolte de juillet." }, { t: "Tilleul", x: "Frais, mentholé. Récolte de juin." }, { t: "Toutes fleurs", x: "Équilibré, utile pour la cuisine. Récolte de mai." }] }],
      ["misc:product", { eyebrow: "Coup de cœur", title: "Miel de châtaignier", price: "9,50 €", text: "Un miel de caractère, foncé et fluide, idéal avec les fromages et dans les marinades.", points: ["Pot de 250 g ou 500 g", "Cristallise lentement", "Récolte de l'année"], cta: "Demander ce miel", url: "/contact", note: "Commande par le formulaire de contact : pas de paiement en ligne." }],
      ["feat:pricelist", { title: "Tarifs (exemples)", items: [{ t: "Pot 250 g", price: "8 – 9,50 €", x: "Selon la fleur" }, { t: "Pot 500 g", price: "15 – 18 €", x: "Selon la fleur" }, { t: "Bougie de cire", price: "7 €", x: "Cire d'abeille pure" }] }],
    ] },
    { key: "ruche", name: "La ruche", blocks: [
      ["misc:pagehead", { title: "Vie d'une ruche" }],
      ["feat:steps", { title: "Le cycle de l'année", items: [{ d: "Mars", t: "Réveil", x: "Visite de printemps, contrôle des réserves." }, { d: "Mai – juillet", t: "Miellées", x: "Transhumance vers lavande et châtaigniers." }, { d: "Août", t: "Extraction", x: "Désoperculation et centrifugation à froid." }, { d: "Octobre", t: "Hivernage", x: "Nourrissement léger, protection du couvain." }] }],
      ["proof:big", { items: [{ q: "On goûte la différence entre un miel bouilli et un miel respecté.", n: "Marion T.", r: "cliente fictive" }] }],
    ] },
    { key: "visites", name: "Visites", blocks: [
      ["misc:pagehead", { title: "Visiter le rucher" }],
      ["misc:schedule", { title: "Animation de deux heures", items: [{ d: "10 h", t: "Équipement", x: "Combinaison et enfumoir." }, { d: "10 h 30", t: "Ouverture d'une ruche", x: "Observation du couvain et de la reine." }, { d: "11 h 30", t: "Dégustation", x: "Cinq miels comparés." }] }],
      ["cta:band", { title: "Groupes et écoles sur rendez-vous", sub: "Tarif de groupe sur demande.", cta: ["Réserver", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:info", { title: "Écrire au rucher", formTitle: "Commander ou réserver", formIntro: "Indiquez vos pots et le retrait souhaité.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Vente au rucher", rows: [["Jeudi – samedi", "10 h – 18 h"], ["Dimanche", "Marché de Die, 8 h – 13 h"]] }],
    ] },
  ],
});

// 5. Élevage et boucherie fermière
T.push({
  key: "pre-carmin", name: "Pré Carmin", category: "agriculture", tags: ["audacieux", "classique"], siteType: "Élevage et boucherie fermière",
  description: "Élevage de plein air et boucherie à la ferme : rouge carmin, noir de charbon, titres gras d'affiche et mise en page de journal. Colis de viande, découpe sur mesure et commande par contact.",
  brand: "Élevage du Pré Carmin",
  tokens: { colors: { primary: "#9b1c24", secondary: "#1c1413", accent: "#c9a26b", background: "#faf6f1", surface: "#ffffff", text: "#211817", muted: "#615350" }, fonts: { heading: "font.abril-fatface", body: "font.ibm-plex-sans", button: "font.ibm-plex-sans", link: "font.ibm-plex-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#211817" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.02, letterSpacing: -0.015 } } },
  dna: { scale: "xl", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "pre-carmin", motifs: ["plates", "mountains", "halftone"] },
  head: ["head:split", {}],
  foot: ["foot:simple", {}],
  menu: [["Accueil", "/"], ["Les colis", "/colis"], ["La découpe", "/decoupe"], ["L'élevage", "/elevage"], ["Contact", "/contact"]], cta: ["Réserver un colis", "/contact"],
  contact: { address: "Le Pré Carmin, 15300 Murat", phone: "04 71 00 88 88", email: "viande@pre-carmin.example", hours: "Boutique : vendredi 14 h – 19 h, samedi 9 h – 13 h", tagline: "Viande de nos bêtes, élevées à l'herbe." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:editorial", { kicker: "Élevage de plein air depuis 1989", title: "De l'herbe, du temps, de la viande qui a du goût", sub: "Bœufs de race rustique, agneaux d'estive et porcs élevés sur paille. Abattage local, découpe à la ferme.", cta: ["Réserver un colis", "/contact"], cta2: ["Voir l'élevage", "/elevage"] }],
      ["feat:strips", { title: "Ce que nous élevons", items: [{ t: "Bœufs de race rustique", x: "Quinze mois à l'herbe, finition au foin, maturation de trois semaines." }, { t: "Agneaux d'estive", x: "Nés au printemps, vendus à l'automne, viande tendre." }, { t: "Porcs sur paille", x: "Charcuteries cuites au chaudron et saucisses sèches." }] }],
      ["gal:masonry", { title: "À la boucherie cette semaine", items: [{ t: "Entrecôte maturée", x: "21 jours en chambre froide." }, { t: "Gigot d'agneau", x: "À rôtir, 2 kg environ." }, { t: "Saucisse de ferme", x: "Maille fine, noisette de piment." }, { t: "Pâté de campagne", x: "Recette de la ferme." }] }],
      ["proof:stats", { title: "L'élevage en chiffres (exemples)", items: [["60", "bêtes à l'année"], ["100 %", "d'herbe et de foin"], ["12 km", "jusqu'à l'abattoir"]] }],
      ["feat:accordion", { title: "Avant de commander", items: [{ t: "Comment sont composés les colis ?", x: "Nous répartissons les morceaux équitablement : steaks, rôtis, bourguignon, haché et os à moelle." }, { t: "Puis-je congeler la viande ?", x: "Oui, tout est conditionné sous vide et prêt à congeler." }, { t: "Livrez-vous ?", x: "Nous livrons sur trois points de retrait de la région, à confirmer à la commande." }] }],
      ["cta:band", { title: "Le prochain colis est ouvert aux réservations", sub: "Réservez avant la fin du mois.", cta: ["Réserver", "/contact"] }],
    ] },
    { key: "colis", name: "Les colis", blocks: [
      ["misc:pagehead", { title: "Les colis de viande", sub: "Réservation à l'avance, retrait à la ferme." }],
      ["price:tiers", { items: [{ t: "Colis bœuf 5 kg", price: "89 €", period: "exemple", f: ["Steaks, rôti, bourguignon", "Haché pur bœuf", "Sous vide"], cta: "Réserver", url: "/contact" }, { t: "Colis bœuf 10 kg", price: "165 €", period: "exemple", f: ["Tous les morceaux nobles", "Haché et os à moelle", "Sous vide"], cta: "Réserver", url: "/contact", hl: true }, { t: "Colis agneau 6 kg", price: "96 €", period: "exemple", f: ["Gigot, épaule, côtelettes", "Carré et collier"], cta: "Réserver", url: "/contact" }] }],
      ["cta:card", { title: "Un colis sur mesure ?", sub: "Dites-nous la taille de votre congélateur.", cta: ["Nous écrire", "/contact"] }],
    ] },
    { key: "decoupe", name: "La découpe", blocks: [
      ["misc:pagehead", { title: "La découpe à la ferme" }],
      ["misc:text", { eyebrow: "Atelier", title: "Une découpe à la demande", paras: ["Notre atelier est agréé : la viande est maturée, désossée et parée sur place. Vous pouvez demander l'épaisseur des tranches ou le poids des rôtis.", "Les os et parures sont valorisés en bouillon et en haché, rien n'est perdu."] }],
      ["feat:list2", { title: "Sur demande", items: [{ t: "Tranches épaisses ou fines" }, { t: "Rôtis ficelés" }, { t: "Brochettes marinées" }, { t: "Os à moelle et jarret" }] }],
    ] },
    { key: "elevage", name: "L'élevage", blocks: [
      ["misc:pagehead", { title: "L'élevage" }],
      ["misc:story", { eyebrow: "La ferme", title: "Trente-cinq ans d'herbe", paras: ["Bernard et Solène Aubrac exploitent cent vingt hectares de prairies naturelles. Les bêtes pâturent d'avril à novembre, puis passent l'hiver à l'étable avec du foin de la ferme.", "L'alimentation exclut les farines animales et le soja importé."] }],
      ["proof:big", { items: [{ q: "On sent le goût de l'herbe dans la viande, et on sait d'où elle vient.", n: "Patrick R.", r: "client fictif" }] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:map", { title: "Nous trouver", mapAddress: "Murat, Cantal, France" }],
      ["misc:hours", { title: "Boutique à la ferme", rows: [["Vendredi", "14 h – 19 h"], ["Samedi", "9 h – 13 h"]] }],
    ] },
  ],
});

// 6. AMAP / circuits courts
T.push({
  key: "amap-ricochet", name: "AMAP Ricochet", category: "agriculture", tags: ["moderne", "ludique"], siteType: "AMAP et circuits courts", isNew: true,
  description: "Association pour le maintien d'une agriculture paysanne : bleu-vert vif, sans-serif rond et grille claire. Producteurs partenaires, calendrier des distributions et adhésion par contact.",
  brand: "AMAP Ricochet",
  tokens: { colors: { primary: "#0e7490", secondary: "#0b2e3a", accent: "#f08a24", background: "#f3fafb", surface: "#ffffff", text: "#102a33", muted: "#4a6670" }, fonts: { heading: "font.baloo-2", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: { sm: 10, md: 16, lg: 28, button: 999, field: 14, card: 24 }, shadow: { card: "md", button: "sm" }, border: { width: 1, color: "#cfe5ea" }, type: { h1: { size: 56, weight: 800, lineHeight: 1.05, letterSpacing: -0.01 } } },
  dna: { scale: "m", pad: "normal", align: "center", shape: "pill" }, art: { seed: "ricochet", motifs: ["blobs", "waves", "objects"] },
  head: ["head:float", {}],
  foot: ["foot:line", {}],
  menu: [["Accueil", "/"], ["Producteurs", "/producteurs"], ["Distributions", "/distributions"], ["Adhérer", "/adherer"], ["Contact", "/contact"]], cta: ["Adhérer", "/adherer"],
  contact: { address: "Salle des Fêtes, 12 rue du Marais, 35000 Rennes", phone: "02 99 00 55 55", email: "bureau@amap-ricochet.example", hours: "Distribution : jeudi 18 h – 19 h 30", tagline: "Mangeurs et paysans, engagés ensemble." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:stacked", { eyebrow: "Association de consommateurs et de paysans", title: "Mangeons local, engageons-nous ensemble", sub: "Chaque semaine, des produits frais de six fermes voisines, payés à l'avance pour garantir un revenu juste.", cta: ["Adhérer à l'AMAP", "/adherer"], cta2: ["Voir les producteurs", "/producteurs"], stats: [["6", "fermes partenaires"], ["85", "familles adhérentes (exemple)"], ["30 km", "rayon maximum"]] }],
      ["feat:steps", { title: "Comment ça marche", items: [{ d: "1", t: "Je choisis mes contrats", x: "Légumes, pain, œufs, fromage, viande, miel." }, { d: "2", t: "Je règle à la saison", x: "Un chèque par contrat, étalé si besoin." }, { d: "3", t: "Je retire chaque semaine", x: "Salle des fêtes, le jeudi soir." }] }],
      ["feat:grid-icons", { title: "Ce que l'AMAP change", items: [{ icon: "heart", t: "Un revenu stable", x: "Les paysans connaissent leur chiffre d'affaires avant de semer." }, { icon: "globe", t: "Moins de kilomètres", x: "Tous les produits viennent de moins de 30 km." }, { icon: "users", t: "Du lien", x: "Chaque adhérent donne deux demi-journées par an." }] }],
      ["proof:team", { items: [{ n: "Lucie Maréchal", r: "Trésorière" }, { n: "Jonas Ferrand", r: "Référent légumes" }, { n: "Awa Diallo", r: "Référente œufs et pain" }] }],
      ["feat:compare", { title: "AMAP ou panier classique ?", rows: [["", "AMAP", "Supermarché"], ["Prix annoncé", "Avant la saison", "Variable"], ["Lien avec le paysan", "Direct", "Aucun"], ["Origine", "Moins de 30 km", "Souvent inconnue"]] }],
      ["cta:split", { title: "Prochaine permanence découverte", sub: "Venez rencontrer les paysans un jeudi soir de distribution.", cta: ["S'inscrire", "/contact"] }],
    ] },
    { key: "producteurs", name: "Producteurs", blocks: [
      ["misc:pagehead", { title: "Nos producteurs", sub: "Six fermes, un contrat de confiance." }],
      ["gal:cards", { title: "Qui produit quoi", items: [{ t: "Ferme des Landes", x: "Légumes de saison, 14 ha.", tag: "Légumes" }, { t: "Boulangerie du Pré", x: "Pains au levain, farine locale.", tag: "Pain" }, { t: "Œufs de la Haie", x: "Poules en parcours, 600 têtes.", tag: "Œufs" }, { t: "Chèvrerie du Val", x: "Fromages frais et affinés.", tag: "Fromages" }] }],
      ["feat:bento", { title: "Les contrats", items: [{ t: "Légumes", x: "Un panier par semaine, 26 semaines.", icon: "heart" }, { t: "Pain et œufs", x: "Une miche et six œufs, retrait hebdomadaire.", icon: "home" }, { t: "Viande", x: "Quatre livraisons par an.", icon: "star" }] }],
    ] },
    { key: "distributions", name: "Distributions", blocks: [
      ["misc:pagehead", { title: "Calendrier des distributions" }],
      ["misc:schedule", { title: "Un jeudi de distribution", items: [{ d: "17 h 30", t: "Installation", x: "Les bénévoles dressent les tables." }, { d: "18 h", t: "Retrait des paniers", x: "Chacun récupère sa part." }, { d: "19 h 30", t: "Rangement", x: "Les adhérents de permanence aident." }] }],
      ["misc:faq", { title: "Questions pratiques", items: [{ t: "Que faire si je suis absent ?", x: "Prévenez un voisin ou le référent : votre panier peut être retiré par une autre personne." }, { t: "Puis-je arrêter en cours d'année ?", x: "Le contrat est de saison, mais vous pouvez trouver un remplaçant." }] }],
    ] },
    { key: "adherer", name: "Adhérer", blocks: [
      ["misc:pagehead", { title: "Adhérer à l'AMAP" }],
      ["feat:pricelist", { title: "Adhésion et contrats (exemples)", items: [{ t: "Adhésion annuelle", price: "15 €", x: "Par foyer" }, { t: "Contrat légumes, 26 semaines", price: "338 €", x: "13 € par panier" }, { t: "Contrat pain, 26 semaines", price: "117 €", x: "4,50 € la miche" }] }],
      ["cta:band", { title: "Rejoignez la prochaine saison", sub: "Demandez le dossier d'adhésion.", cta: ["Écrire au bureau", "/contact"] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:cards", { title: "Le bureau de l'AMAP", formTitle: "Demande d'adhésion", formIntro: "Indiquez les contrats qui vous intéressent.", cta: ["Envoyer", "/contact"] }],
      ["misc:text", { title: "Qui contacter", paras: ["Questions sur un contrat : écrivez au référent concerné via le formulaire.", "Visite des fermes : un week-end par an, programme communiqué aux adhérents."] }],
    ] },
  ],
});

// 7. Brasserie artisanale (sombre)
T.push({
  key: "houblon-nuit", name: "Houblon de Nuit", category: "agriculture", tags: ["sombre", "audacieux"], siteType: "Brasserie artisanale",
  modules: ["Boutique en ligne : le module e-commerce n'est pas installé, le catalogue est une démonstration"],
  description: "Brasserie artisanale : noir houblon, jaune-vert acide, capitales compressées et collage d'images décalées. Bières de saison, visites du brassin et commande par contact.",
  brand: "Brasserie du Quai Noir",
  tokens: { colors: { primary: "#b9d02f", secondary: "#10130b", accent: "#ff8a3d", background: "#12150d", surface: "#1d2214", text: "#f1f4e3", muted: "#b9c19a" }, fonts: { heading: "font.staatliches", body: "font.barlow", button: "font.barlow", link: "font.barlow" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#3b4425" }, type: { h1: { size: 76, weight: 400, lineHeight: 0.98, letterSpacing: 0.01, transform: "uppercase" } } },
  dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "houblon", motifs: ["halftone", "plates", "mesh"] },
  head: ["head:minimal", {}],
  foot: ["foot:columns", { about: "Brasserie artisanale indépendante : bières non filtrées, brassées par lots de 1 000 litres.", cols: [["La brasserie", "Nos bières", "Visites", "Brassins"], ["Contact", "Commander", "Revendeurs", "Mentions"]] }],
  menu: [["Accueil", "/"], ["Nos bières", "/bieres"], ["Visites", "/visites"], ["Brassins", "/brassins"], ["Contact", "/contact"]], cta: ["Commander un fût", "/contact"],
  contact: { address: "Quai des Chargeurs, 59000 Lille", phone: "03 20 00 33 33", email: "brasseurs@quai-noir.example", hours: "Taproom : mercredi – samedi, 17 h – 23 h", tagline: "Brassée à la main, servie sans filtre." },
  social: ["instagram"],
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:collage", { eyebrow: "Brasserie indépendante", title: "Bières de nuit, brassées au quai", sub: "IPA, stout et saison, brassées en petites cuves avec du houblon et de l'orge de la région.", cta: ["Voir les bières", "/bieres"], cta2: ["Réserver une visite", "/visites"] }],
      ["gal:carousel", { title: "Au robinet en ce moment", items: [{ t: "Sentier Blond", x: "Légère, florale, 4,8 %" }, { t: "Quai Noir Stout", x: "Café et cacao, 6 %" }, { t: "Houblon Brut IPA", x: "Agrumes, amertume nette, 6,4 %" }, { t: "Saison des Moissons", x: "Poivrée, sèche, 5,6 %" }] }],
      ["feat:tabs", { title: "Nos familles", items: [{ t: "Blondes", x: "Faciles à boire, parfaites en terrasse." }, { t: "IPA", x: "Houblonnées, agrumes et fruits tropicaux." }, { t: "Brunes et stouts", x: "Malts torréfiés, notes de café." }, { t: "Saisons", x: "Épicées, sèches, brassées avec des produits locaux." }] }],
      ["misc:marquee", { items: ["Brassin du mois : IPA au houblon de Flandre", "Taproom ouvert du mercredi au samedi", "Visites sur réservation", "Fûts disponibles pour vos fêtes"] }],
      ["proof:logos", { title: "Servies chez nos revendeurs (fictifs)", items: ["Bar Le Quinquet", "Cave du Beffroi", "Épicerie La Maline", "Guinguette des Wateringues"] }],
      ["cta:band", { title: "Un fût pour votre soirée ?", sub: "Fûts de 20 et 30 litres, avec tireuse en prêt.", cta: ["Nous contacter", "/contact"] }],
    ] },
    { key: "bieres", name: "Nos bières", blocks: [
      ["misc:pagehead", { title: "Nos bières", sub: "Prix indicatifs de démonstration." }],
      ["gal:products", { title: "La carte", items: [{ t: "Sentier Blond", price: "3,50 €", x: "Bouteille 33 cl" }, { t: "Quai Noir Stout", price: "4 €", x: "Bouteille 33 cl" }, { t: "Houblon Brut IPA", price: "4,20 €", x: "Bouteille 33 cl" }, { t: "Saison des Moissons", price: "4 €", x: "Bouteille 33 cl" }] }],
      ["misc:product", { eyebrow: "Fût", title: "Fût de 20 litres", price: "95 €", text: "Idéal pour un mariage ou une fête de quartier, avec prêt de tireuse.", points: ["Consigne de 30 €", "Choix de la bière", "Retrait au quai"], cta: "Demander un fût", url: "/contact", note: "Commande via le formulaire de contact : aucun paiement en ligne." }],
    ] },
    { key: "visites", name: "Visites", blocks: [
      ["misc:pagehead", { title: "Visites et dégustations" }],
      ["misc:schedule", { title: "Visite du samedi (1 h 30)", items: [{ d: "15 h", t: "La salle de brassage", x: "Malts, houblons, levures." }, { d: "15 h 40", t: "Les cuves", x: "Fermentation et garde." }, { d: "16 h 15", t: "Dégustation", x: "Quatre bières à comparer." }] }],
      ["feat:pricelist", { title: "Tarifs (exemples)", items: [{ t: "Visite et dégustation", price: "14 €", x: "Par personne" }, { t: "Groupe de 10", price: "120 €", x: "Sur réservation" }] }],
    ] },
    { key: "brassins", name: "Brassins", blocks: [
      ["misc:pagehead", { title: "Journal de brassage" }],
      ["feat:steps", { title: "Un brassin en cinq jours", items: [{ d: "Jour 1", t: "Empâtage", x: "Brassage du malt concassé." }, { d: "Jour 2", t: "Ébullition", x: "Houblonnage en deux temps." }, { d: "Jour 3 – 10", t: "Fermentation", x: "Surveillance de la densité." }, { d: "Jour 21", t: "Mise en bouteille", x: "Refermentation en bouteille." }] }],
      ["misc:quote", { text: "Une bière artisanale, c'est surtout un temps de patience.", by: "Équipe brasserie" }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:info", { title: "Passer commande", formTitle: "Commander des bières ou un fût", formIntro: "Précisez la date de votre événement.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Taproom", rows: [["Mercredi – jeudi", "17 h – 22 h"], ["Vendredi – samedi", "17 h – 23 h"]] }],
    ] },
  ],
});

// 8. Huilerie / oliveraie
T.push({
  key: "moulin-oleo", name: "Moulin Oleo", category: "agriculture", tags: ["luxe", "minimaliste"], siteType: "Huilerie et oliveraie",
  modules: ["Boutique en ligne : le module e-commerce n'est pas installé, le catalogue est une démonstration"],
  description: "Huilerie d'oliviers en vert sauge et blanc crème, capitales fines à empattement et grands espaces. Récolte, trituration à froid, dégustation et commande par contact.",
  brand: "Moulin de Saint-Aubin",
  tokens: { colors: { primary: "#2f6f5e", secondary: "#18332b", accent: "#b88a2d", background: "#f8f6ee", surface: "#fffefa", text: "#1b2a25", muted: "#506059" }, fonts: { heading: "font.marcellus", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#dcdcc8" }, type: { h1: { size: 54, weight: 400, lineHeight: 1.1, letterSpacing: 0.02, transform: "uppercase" } } },
  dna: { scale: "m", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "oleo", motifs: ["botanical", "arches", "dunes"] },
  head: ["head:side", {}],
  foot: ["foot:newsletter", { title: "Nouvelle récolte", sub: "Un mot en novembre quand l'huile nouvelle est prête.", button: "Me prévenir" }],
  menu: [["Accueil", "/"], ["Les huiles", "/huiles"], ["Le moulin", "/moulin"], ["Dégustation", "/degustation"], ["Contact", "/contact"]], cta: ["Commander", "/contact"],
  contact: { address: "Chemin du Moulin, 84220 Gordes", phone: "04 90 00 12 12", email: "moulin@saint-aubin.example", hours: "Boutique : tous les jours de novembre à mars, 10 h – 17 h", tagline: "Huile d'olive pressée à froid, mise en bouteille au moulin." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:framed", { eyebrow: "Récolte à la main, trituration à froid", title: "Une huile verte, fruitée, de nos propres oliviers", sub: "Trois mille arbres, quatre variétés, une trituration dans les heures qui suivent la cueillette.", cta: ["Découvrir les huiles", "/huiles"], cta2: ["Visiter le moulin", "/moulin"] }],
      ["feat:rows", { title: "De l'arbre à la bouteille", items: [{ t: "La cueillette", x: "Au peigne, de la mi-octobre à décembre." }, { t: "Le broyage", x: "Moulin à meules de pierre, pâte froide à moins de 27 °C." }, { t: "La décantation", x: "Filtrage léger, mise en bouteille sous azote." }] }],
      ["gal:grid", { title: "Les variétés", items: [{ t: "Aglandau", x: "Vert intense, artichaut cru." }, { t: "Picholine", x: "Amande et herbe fraîche." }, { t: "Verdale", x: "Douce, pomme verte." }, { t: "Tanche", x: "Fruitée mûre, noire." }] }],
      ["proof:big", { items: [{ q: "Une huile qui pique juste ce qu'il faut et qui parfume tout le plat.", n: "Cécile M.", r: "cliente fictive" }] }],
      ["cta:image", { title: "Un bidon pour la famille ?", sub: "Formats de 3 et 5 litres.", cta: ["Nous écrire", "/contact"] }],
    ] },
    { key: "huiles", name: "Les huiles", blocks: [
      ["misc:pagehead", { title: "Les huiles", sub: "Tarifs de démonstration." }],
      ["gal:products", { title: "Le catalogue", items: [{ t: "Huile vierge extra", price: "14 €", x: "50 cl" }, { t: "Huile verte nouvelle", price: "17 €", x: "50 cl, novembre" }, { t: "Olives de table", price: "7 €", x: "Bocal 200 g" }, { t: "Tapenade verte", price: "6,50 €", x: "Pot 90 g" }] }],
      ["misc:product", { eyebrow: "Récolte de l'année", title: "Huile verte nouvelle", price: "17 €", text: "Pressée dans les trois jours suivant la cueillette, très fruitée, avec une belle amertume.", points: ["Bouteille de 50 cl", "À consommer dans l'année", "Notes d'artichaut et d'herbe coupée"], cta: "Demander cette huile", url: "/contact", note: "Commande via le formulaire de contact : aucun paiement en ligne." }],
      ["feat:compare", { title: "Choisir son huile", rows: [["", "Fruité vert", "Fruité mûr"], ["Saveur", "Herbe, artichaut", "Amande, pomme"], ["Usage", "Crudités, poissons", "Pâtisserie, sauces"]] }],
    ] },
    { key: "moulin", name: "Le moulin", blocks: [
      ["misc:pagehead", { title: "Le moulin" }],
      ["misc:story", { eyebrow: "Notre histoire", title: "Un moulin à meules depuis 1962", paras: ["Le moulin appartient à la famille Saint-Aubin. Chaque automne, voisins et amateurs viennent y presser leurs olives.", "Nous assurons aussi la trituration à façon pour les petits propriétaires, avec un rendement suivi sur chaque lot."] }],
      ["proof:stats", { items: [["3 000", "oliviers"], ["4", "variétés"], ["60 ans", "de pressage"]] }],
    ] },
    { key: "degustation", name: "Dégustation", blocks: [
      ["misc:pagehead", { title: "Dégustation" }],
      ["feat:pricelist", { title: "Les formules (exemples)", items: [{ t: "Dégustation découverte", price: "8 €", x: "Trois huiles, pain du four" }, { t: "Atelier accord huile et mets", price: "28 €", x: "Sur réservation, 1 h 30" }] }],
      ["misc:faq", { items: [{ t: "Comment conserver son huile ?", x: "À l'abri de la lumière et de la chaleur, bouchon fermé." }, { t: "Combien de temps se garde-t-elle ?", x: "Idéalement dix-huit mois après la mise en bouteille." }] }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:map", { title: "Au moulin", mapAddress: "Gordes, Vaucluse, France" }],
      ["misc:hours", { title: "Boutique", rows: [["Novembre – mars", "Tous les jours, 10 h – 17 h"], ["Avril – octobre", "Sur rendez-vous"]] }],
    ] },
  ],
});

// 9. Coopérative agricole
T.push({
  key: "grange-commune", name: "Grange Commune", category: "agriculture", tags: ["moderne", "classique"], siteType: "Coopérative agricole",
  description: "Coopérative de producteurs : bleu indigo, ambre et cartes nettes, bandeau dégradé et chiffres clés. Filières, adhésion, magasin de producteurs et actualités.",
  brand: "Coopérative Terres Unies",
  tokens: { colors: { primary: "#3730a3", secondary: "#1a1850", accent: "#e8a33d", background: "#f6f6fb", surface: "#ffffff", text: "#1a1b33", muted: "#53557a" }, fonts: { heading: "font.ibarra-real-nova", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#dcdcee" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.06, letterSpacing: -0.01 } } },
  dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "grange", motifs: ["tiles", "topo", "ribbons"] },
  head: ["head:masthead", { dateline: "Coopérative agricole · 214 adhérents" }],
  foot: ["foot:center", {}],
  menu: [["Accueil", "/"], ["Filières", "/filieres"], ["Adhérer", "/adherer"], ["Magasin", "/magasin"], ["Actualités", "/actualites"], ["Contact", "/contact"]], cta: ["Devenir adhérent", "/adherer"],
  contact: { address: "ZA des Trois Chênes, 51000 Châlons-en-Champagne", phone: "03 26 00 99 99", email: "accueil@terres-unies.example", hours: "Du lundi au vendredi, 8 h – 12 h 30 et 13 h 30 – 17 h 30", tagline: "Des agriculteurs qui commercialisent ensemble." },
  pages: [
    { key: "accueil", name: "Accueil", blocks: [
      ["hero:gradient", { eyebrow: "Coopérative de producteurs", title: "Produire ensemble, vendre mieux", sub: "Céréales, légumineuses et élevage : collecte, stockage, transformation et vente en commun, avec des prix connus à l'avance.", cta: ["Devenir adhérent", "/adherer"], cta2: ["Voir les filières", "/filieres"], stats: [["214", "agriculteurs adhérents (exemple)"], ["28 000 t", "de céréales collectées"], ["4", "sites de stockage"]] }],
      ["feat:icons", { title: "Ce que nous mutualisons", items: [{ icon: "layers", t: "Collecte et stockage", x: "Silos, séchage et suivi de la qualité des lots." }, { icon: "briefcase", t: "Conseil agronomique", x: "Techniciens présents sur le terrain toute l'année." }, { icon: "barChart", t: "Commercialisation", x: "Contrats pluriannuels avec des meuniers et des brasseurs." }, { icon: "globe", t: "Transition", x: "Accompagnement vers des pratiques moins dépendantes des intrants." }] }],
      ["proof:statsbar", { items: [["1 957", "ha en légumineuses"], ["12", "contrats de filière"], ["92 %", "des adhérents reviennent (exemple)"]] }],
      ["feat:list2", { title: "Nos engagements envers les adhérents", items: [{ t: "Un prix minimum annoncé avant les semis" }, { t: "Un paiement sous 30 jours" }, { t: "Un conseil indépendant" }, { t: "Une gouvernance à une voix par adhérent" }] }],
      ["gal:wall", { title: "Sur le terrain", items: [{ t: "Moisson" }, { t: "Silo" }, { t: "Atelier" }, { t: "Assemblée" }] }],
      ["cta:image", { title: "Rencontrer un conseiller", sub: "Premier rendez-vous gratuit sur votre exploitation.", cta: ["Prendre rendez-vous", "/contact"] }],
    ] },
    { key: "filieres", name: "Filières", blocks: [
      ["misc:pagehead", { title: "Nos filières", sub: "Cinq débouchés structurés." }],
      ["feat:alt", { title: "Les grandes cultures et l'élevage", items: [{ t: "Blé meunier", x: "Contrats avec deux minoteries locales, cahier des charges de qualité.", link: ["Nous contacter", "/contact"] }, { t: "Orge brassicole", x: "Variétés demandées par les brasseries régionales.", link: ["Nous contacter", "/contact"] }, { t: "Légumineuses", x: "Lentilles, pois chiches, pois cassés pour l'alimentation humaine.", link: ["Nous contacter", "/contact"] }] }],
      ["feat:pricelist", { title: "Barème indicatif de campagne (exemples)", items: [{ t: "Blé meunier", price: "245 €/t", x: "Qualité standard" }, { t: "Orge brassicole", price: "265 €/t", x: "Calibre 2,5 mm" }, { t: "Lentilles vertes", price: "1 150 €/t", x: "Triées et calibrées" }] }],
    ] },
    { key: "adherer", name: "Adhérer", blocks: [
      ["misc:pagehead", { title: "Devenir adhérent" }],
      ["feat:steps", { title: "Les étapes", items: [{ d: "1", t: "Premier échange", x: "Un conseiller visite votre exploitation." }, { d: "2", t: "Souscription de parts", x: "Parts sociales remboursables à la sortie." }, { d: "3", t: "Engagement de campagne", x: "Volumes et filières choisis ensemble." }] }],
      ["misc:faq", { items: [{ t: "Combien coûte l'adhésion ?", x: "Un capital de parts sociales (montant fourni à la demande), remboursable en cas de départ." }, { t: "Suis-je tenu de livrer toute ma récolte ?", x: "Non, vous choisissez les volumes engagés par filière." }] }],
      ["cta:band", { title: "Une question sur l'adhésion ?", sub: "Un conseiller vous répond sous deux jours ouvrés.", cta: ["Nous contacter", "/contact"] }],
    ] },
    { key: "magasin", name: "Magasin", blocks: [
      ["misc:pagehead", { title: "Le magasin de producteurs", sub: "Farines, légumineuses et produits fermiers du territoire." }],
      ["gal:listings", { title: "En rayon (démonstration)", items: [{ t: "Farine de blé T80", tag: "Épicerie", price: "2,20 €/kg", x: "Moulue à la pierre" }, { t: "Lentilles vertes", tag: "Légumineuses", price: "4,50 €/500 g", x: "Origine locale" }, { t: "Bière blonde", tag: "Boissons", price: "3,50 €", x: "Brasserie partenaire" }] }],
      ["misc:hours", { title: "Ouverture", rows: [["Lundi – vendredi", "9 h – 12 h 30 et 14 h – 18 h"], ["Samedi", "9 h – 13 h"]] }],
    ] },
    { key: "actualites", name: "Actualités", blocks: [
      ["misc:pagehead", { title: "Actualités de la coopérative" }],
      ["misc:posts", { title: "Dernières nouvelles", count: 3, layout: "list" }],
      ["misc:quote", { text: "Ensemble, nous sommes plus solides face aux aléas de la campagne.", by: "Présidente de la coopérative" }],
    ] },
    { key: "contact", name: "Contact", blocks: [
      ["misc:pagehead", { title: "Contact" }],
      ["contact:info", { title: "Nous écrire", formTitle: "Prendre rendez-vous", formIntro: "Précisez votre exploitation et le sujet.", cta: ["Envoyer", "/contact"] }],
      ["misc:hours", { title: "Accueil", rows: [["Lundi – vendredi", "8 h – 17 h 30"]] }],
    ] },
  ],
});

module.exports = T;
