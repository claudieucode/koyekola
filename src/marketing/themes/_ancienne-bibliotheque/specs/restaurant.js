// Restaurants (lot A, 9 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs.
const ph = (title, sub) => ["misc:pagehead", sub ? { title, sub } : { title }];

module.exports = [
  // 1. PRUNE & CENDRE — restaurant gastronomique
  {
    key: "prune-cendre", name: "Prune & Cendre", category: "restaurant", tags: ["luxe", "editorial"], siteType: "Restaurant gastronomique", featured: true,
    description: "Ivoire, prune profonde et filets dorés : un titre serif d'une grande finesse, un en-tête minimal et une mise en page éditoriale pour une table gastronomique à menu dégustation.",
    brand: "Maison Prune",
    tokens: { colors: { primary: "#6b2d5c", secondary: "#2b1a27", accent: "#a9772a", background: "#f7f2ec", surface: "#ffffff", text: "#231820", muted: "#5f5058" }, fonts: { heading: "font.instrument-serif", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 76, weight: 400, lineHeight: 1.0, letterSpacing: -0.01 }, h2: { size: 46, weight: 400, lineHeight: 1.1, letterSpacing: 0 } }, border: { width: 1, color: "#e0d3c6" } },
    dna: { scale: "xl", pad: "airy", align: "center", shape: "sharp" }, art: { seed: "prune-cendre", motifs: ["plates", "arches", "bokeh"] },
    head: ["head:minimal", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Menus", "/menus"], ["La maison", "/maison"], ["Cave", "/cave"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "4 rue des Orfèvres, 67000 Strasbourg", phone: "03 88 00 21 45", email: "salle@maisonprune.example", hours: "Du mercredi au samedi, 19 h 30 – 22 h ; déjeuner le vendredi et le samedi", tagline: "Une cuisine de saison, à l'instant." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Table gastronomique · Strasbourg", title: "Quinze couverts, une seule partition.", sub: "Le chef compose chaque semaine un menu en sept temps avec les maraîchers et pêcheurs de la région.", cta: ["Réserver une table", "/reserver"], cta2: ["Découvrir les menus", "/menus"] }],
        ["feat:numbered", { eyebrow: "La maison", title: "Trois principes", items: [{ t: "Le produit", x: "Une dizaine de producteurs, des légumes cueillis le matin, du poisson de petit bateau." }, { t: "Le geste", x: "Cuissons précises, sauces courtes, assaisonnements justes." }, { t: "Le temps", x: "Trois heures de table, sans précipitation, avec un accord mets et vins pour chaque temps." }] }],
        ["gal:featured", { eyebrow: "Instants de table", title: "Du pass à l'assiette", items: [{ t: "Langoustine, beurre noisette" }, { t: "Pigeon, cerise noire" }, { t: "Fromages affinés" }, { t: "Prune, verveine" }], bg: "token:surface" }],
        ["proof:big", { items: [{ q: "Une cuisine d'une précision rare, servie avec une vraie chaleur.", n: "Hélène V.", r: "cliente fictive" }] }],
        ["cta:card", { title: "Les réservations ouvrent trois mois à l'avance.", sub: "Pour une occasion particulière, écrivez-nous : nous ferons notre possible.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "menus", name: "Menus", blocks: [
        ph("Les menus", "Composés chaque semaine. Allergies et régimes : prévenez-nous à la réservation."),
        ["feat:pricelist", { title: "Menus dégustation (exemples)", items: [{ t: "Menu du marché, quatre temps", x: "Le déjeuner, vendredi et samedi", price: "68 €" }, { t: "Menu Prune, sept temps", x: "Le soir, du mercredi au samedi", price: "135 €" }, { t: "Accord mets et vins", x: "Quatre verres sélectionnés", price: "62 €" }, { t: "Menu végétal, sept temps", x: "Sur demande, 48 h à l'avance", price: "120 €" }] }],
        ["misc:menu", { eyebrow: "Extrait du menu actuel", title: "Quelques temps", left: ["Début de repas", [{ t: "Betterave fumée", x: "Raifort, huile de noix", price: "—" }, { t: "Langoustine", x: "Beurre noisette, bergamote", price: "—" }]], right: ["Fin de repas", [{ t: "Pigeon", x: "Cerise noire, jus au cacao", price: "—" }, { t: "Prune, verveine", x: "Sorbet, tuile, crème glacée", price: "—" }]] }],
        ["cta:band", { title: "Une table pour un anniversaire ?", sub: "Menu personnalisé jusqu'à huit convives.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "maison", name: "La maison", blocks: [
        ph("La maison"),
        ["misc:story", { eyebrow: "Le chef", title: "Une cuisine qui écoute la saison", paras: ["Après dix ans en Alsace et en Scandinavie, Étienne Marchal (chef fictif) ouvre une salle de quinze couverts où tout se voit : le pass, les gestes, les assiettes.", "Il travaille avec une poignée de producteurs qu'il visite chaque semaine. Le menu change à chaque livraison."], image: "portrait-2" }],
        ["proof:team", { title: "En salle et en cuisine", items: [{ n: "Étienne Marchal", r: "Chef (fictif)" }, { n: "Inès Garnier", r: "Cheffe pâtissière" }, { n: "Paul Lemoine", r: "Sommelier" }] }],
        ["proof:logos", { title: "Nos producteurs (exemples)", items: ["Ferme du Rieth", "Maraîchage des Îles", "Pêcherie de la Baie", "Fromagerie Haut-Val"] }],
      ] },
      { key: "cave", name: "Cave", blocks: [
        ph("La cave", "Quatre cents références, une large place aux vignerons indépendants."),
        ["feat:rows", { title: "Les grandes lignes", items: [{ t: "Alsace et Allemagne", x: "Rieslings secs, pinots gris sur la tension, vieux millésimes." }, { t: "Bourgogne et Jura", x: "Chardonnays droits, pinots noirs de village." }, { t: "Sans alcool", x: "Infusions froides, jus fermentés, thé glacé maison." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Peut-on apporter une bouteille ?", x: "Oui, avec un droit de bouchon de 30 €." }, { t: "Peut-on commander un seul verre ?", x: "La cave propose quarante références au verre." }, { t: "Proposez-vous des accords sans alcool ?", x: "Oui, sept boissons composées pour le menu Prune." }] }],
        ["cta:split", { title: "Soirée vigneron", sub: "Une fois par mois, un vigneron présente ses cuvées autour d'un menu dédié.", cta: ["Voir les dates", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Par téléphone ou en écrivant à la salle."),
        ["misc:hours", { title: "Ouverture", rows: [["Lundi – Mardi", "Fermé"], ["Mercredi – Jeudi", "19 h 30 – 22 h"], ["Vendredi – Samedi", "12 h – 13 h 30 · 19 h 30 – 22 h"], ["Dimanche", "Fermé"]] }],
        ["contact:map", { title: "Maison Prune", mapAddress: "4 rue des Orfèvres, 67000 Strasbourg" }],
      ] },
    ],
  },

  // 2. POIREAU RIEUR — bistrot de quartier
  {
    key: "poireau-rieur", name: "Poireau Rieur", category: "restaurant", tags: ["chaleureux", "ludique"], siteType: "Bistrot de quartier",
    description: "Bordeaux et crème, bandeau d'actualité façon journal de comptoir, titres serif épais et ardoise du jour : un bistrot de quartier convivial et bavard.",
    brand: "Le Poireau Rieur",
    tokens: { colors: { primary: "#9b1b3a", secondary: "#1e2a2f", accent: "#a3711c", background: "#faf3ea", surface: "#fffaf3", text: "#26191a", muted: "#6a5455" }, fonts: { heading: "font.young-serif", body: "font.karla", button: "font.karla", link: "font.karla" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e8d9c6" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "poireau-rieur", motifs: ["tiles", "botanical", "objects"] },
    head: ["head:masthead", { dateline: "Ardoise du jour · ouvert 7 j/7 · 12 h – 23 h" }], foot: ["foot:columns", { about: "Bistrot de quartier : plat du jour, cuisine de ménage et vins nature au verre, au coin de la rue du Marché.", cols: [["Le bistrot", "L'ardoise", "Notre histoire", "Privatiser"], ["Infos", "Réserver", "Horaires", "Accès"]] }],
    menu: [["Accueil", "/"], ["L'ardoise", "/ardoise"], ["Le bistrot", "/bistrot"], ["Événements", "/evenements"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "22 rue du Marché, 44000 Nantes", phone: "02 40 00 31 22", email: "bonjour@poireaurieur.example", hours: "Tous les jours, 12 h – 14 h 30 et 19 h – 23 h", tagline: "Plat du jour, bon vin, bonne humeur." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Bistrot de quartier · Nantes", title: "Chez nous, on mange comme chez mémé.", sub: "Plat du jour à 14 €, oeuf mayo qui tient la route et vins nature au verre. Venez comme vous êtes.", cta: ["Voir l'ardoise", "/ardoise"], cta2: ["Réserver", "/reserver"] }],
        ["misc:marquee", { items: ["Plat du jour 14 €", "Formule midi 19 €", "Vins nature au verre", "Terrasse chauffée"] }],
        ["feat:strips", { title: "Au bistrot, on aime", items: [{ t: "Le fait maison", x: "Pain, mayonnaise, terrines et desserts préparés sur place chaque matin." }, { t: "Les petits producteurs", x: "Légumes du maraîcher d'à côté, charcuterie de la ferme, fromages de la crémerie." }, { t: "La tablée", x: "Un grand comptoir, des tables serrées et des discussions qui s'engagent." }] }],
        ["proof:quotes", { title: "Le mot des habitués", items: [{ q: "Le plat du jour est toujours une bonne surprise.", n: "Claire T.", r: "cliente fictive" }, { q: "Le patron connaît nos prénoms, et nos verres.", n: "Marc D.", r: "client fictif" }, { q: "Le meilleur oeuf mayo du quartier.", n: "Salomé L.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Une table pour ce soir ?", sub: "Réservation conseillée le jeudi et le vendredi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "ardoise", name: "L'ardoise", blocks: [
        ph("L'ardoise", "Elle change tous les jours, au gré du marché."),
        ["misc:menu", { title: "Ce que dit l'ardoise", intro: "Exemples de la saison. Prix nets en euros.", left: ["Pour commencer", [{ t: "Oeuf mayonnaise", x: "Mayonnaise maison, ciboulette", price: "6 €" }, { t: "Poireaux vinaigrette", x: "Noisettes, moutarde ancienne", price: "7 €" }, { t: "Terrine de campagne", x: "Cornichons, pain grillé", price: "8 €" }]], right: ["Pour continuer", [{ t: "Blanquette de veau", x: "Riz pilaf", price: "18 €" }, { t: "Andouillette grillée", x: "Frites, moutarde", price: "17 €" }, { t: "Poisson du marché", x: "Beurre blanc, légumes", price: "19 €" }, { t: "Plat du jour", x: "À voir sur l'ardoise", price: "14 €" }]] }],
        ["feat:pricelist", { title: "Pour finir et pour trinquer", items: [{ t: "Riz au lait vanillé", price: "6 €" }, { t: "Mousse au chocolat", price: "6 €" }, { t: "Verre de vin nature", x: "Vigneron du Val de Loire", price: "5 €" }, { t: "Carafe de la maison, 50 cl", price: "13 €" }] }],
        ["cta:split", { title: "Formule du midi à 19 €", sub: "Entrée, plat, dessert, du lundi au vendredi hors jours fériés.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "bistrot", name: "Le bistrot", blocks: [
        ph("Le bistrot", "Une adresse de quartier depuis douze ans."),
        ["misc:story", { eyebrow: "Notre histoire", title: "Un comptoir, une cuisine, des amis", paras: ["Le Poireau Rieur a ouvert dans une ancienne droguerie, dont il garde le carrelage et le grand zinc.", "Gaëlle et Antoine Roux (propriétaires fictifs) cuisinent comme on le faisait chez leurs grands-parents : en famille, avec ce qu'il y a au marché."], image: "portrait-1" }],
        ["proof:stats", { title: "Le bistrot en chiffres (exemples)", items: [["40", "couverts en salle"], ["12 ans", "d'ardoise"], ["6", "vignerons au verre"]] }],
        ["gal:wall", { title: "Dans la salle", items: [{ t: "Le zinc" }, { t: "L'ardoise" }, { t: "La terrasse" }, { t: "Les desserts" }] }],
      ] },
      { key: "evenements", name: "Événements", blocks: [
        ph("Événements", "Quand le bistrot fait la fête."),
        ["misc:schedule", { title: "Au programme du mois", items: [{ d: "Jeu. 20 h", t: "Soirée vin nature", x: "Un vigneron, quatre verres, un plat." }, { d: "Dim. 12 h", t: "Brunch de quartier", x: "Oeufs, charcuteries, viennoiseries." }, { d: "Ven. 21 h", t: "Soirée quiz", x: "Par équipes de quatre, lots à la clé." }] }],
        ["feat:checks", { title: "Fêtes et repas de groupe", cta: ["Nous écrire", "/reserver"], items: [{ t: "Jusqu'à vingt-cinq convives" }, { t: "Menu fixe ou carte libre" }, { t: "Boissons au forfait" }, { t: "Devis rapide" }] }],
        ["cta:card", { title: "On privatise ?", sub: "Anniversaires, pots de départ, repas d'équipe.", cta: ["Demander un devis", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver", "Pour six personnes et plus, appelez-nous."),
        ["misc:hours", { title: "Horaires", rows: [["Du lundi au vendredi", "12 h – 14 h 30 · 19 h – 23 h"], ["Samedi", "12 h – 15 h · 19 h – 23 h 30"], ["Dimanche", "Brunch 11 h – 15 h"]] }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Écrire au bistrot", formIntro: "Réponse sous une journée." }],
      ] },
    ],
  },

  // 3. TIZZONE — pizzeria au feu de bois
  {
    key: "tizzone-forno", name: "Tizzone", category: "restaurant", tags: ["audacieux", "chaleureux"], siteType: "Pizzeria au feu de bois",
    description: "Orange four à bois, crème et vert basilic : une barre flottante, un collage de pizzas, des titres gras et une carte de pizzas lisible, pour une pizzeria napolitaine.",
    isNew: true, brand: "Tizzone",
    tokens: { colors: { primary: "#c2410c", secondary: "#3a1d10", accent: "#4d7c0f", background: "#fff6e8", surface: "#fffdf8", text: "#2b1a10", muted: "#6d5440" }, fonts: { heading: "font.bricolage-grotesque", body: "font.work-sans", button: "font.bricolage-grotesque", link: "font.work-sans" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 14, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 62, weight: 800, lineHeight: 1.02, letterSpacing: -0.025 } }, border: { width: 1, color: "#f0dcc0" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "pill" }, art: { seed: "tizzone-forno", motifs: ["blobs", "rays", "objects"] },
    head: ["head:float", {}], foot: ["foot:big", { title: "TIZZONE" }],
    menu: [["Accueil", "/"], ["Les pizzas", "/pizzas"], ["Le four", "/four"], ["Emporter", "/emporter"], ["Venir", "/venir"]], cta: ["Commander à emporter", "/emporter"],
    contact: { address: "9 place de la Fontaine, 31000 Toulouse", phone: "05 61 00 44 18", email: "ciao@tizzone.example", hours: "Du mardi au dimanche, 11 h 45 – 14 h 15 et 18 h 45 – 22 h 30", tagline: "Pâte lente, feu vif." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "Pizzeria napolitaine · Toulouse", title: "90 secondes à 450 degrés.", sub: "Pâte levée 48 heures, tomates pelées, mozzarella fior di latte : des pizzas cuites au feu de bois de hêtre, à croquer sur place ou à emporter.", cta: ["Voir les pizzas", "/pizzas"], cta2: ["Emporter", "/emporter"] }],
        ["proof:statsbar", { items: [["48 h", "de levée de la pâte"], ["450 °C", "dans la voûte du four"], ["90 s", "de cuisson"]] }],
        ["gal:cards", { eyebrow: "Les incontournables", title: "Trois pizzas pour commencer", items: [{ t: "Margherita", x: "Tomate, fior di latte, basilic, huile d'olive.", tag: "Classique" }, { t: "Diavola", x: "Salami piquant, piment, miel de fleurs.", tag: "Épicée" }, { t: "Funghi e tartufo", x: "Champignons, crème de truffe, roquette.", tag: "Gourmande" }] }],
        ["feat:alt", { title: "Un four, une pâte, un geste", items: [{ t: "La pâte", x: "Farine de blé tendre, levain, eau et sel. Rien d'autre.", link: ["La carte", "/pizzas"] }, { t: "Le feu", x: "Un four à dôme construit à la main, nourri de hêtre sec.", link: ["Le four", "/four"] }] }],
        ["cta:image", { title: "Une pizza pour ce soir ?", sub: "Commandez par téléphone avant 18 h 30 : retrait en dix minutes.", cta: ["Emporter", "/emporter"] }],
      ] },
      { key: "pizzas", name: "Les pizzas", blocks: [
        ph("Les pizzas", "Prix nets, en euros. Base blanche ou rouge."),
        ["misc:menu", { title: "La carte", left: ["Rosse (base tomate)", [{ t: "Margherita", x: "Fior di latte, basilic", price: "11 €" }, { t: "Diavola", x: "Salami piquant, miel", price: "14 €" }, { t: "Napoli", x: "Anchois, câpres, olives", price: "13 €" }, { t: "Quattro formaggi", x: "Quatre fromages italiens", price: "15 €" }]], right: ["Bianche (base crème)", [{ t: "Funghi e tartufo", x: "Champignons, truffe", price: "16 €" }, { t: "Pistacchio", x: "Mortadelle, pistache, burrata", price: "16 €" }, { t: "Orto", x: "Légumes grillés, chèvre", price: "13 €" }, { t: "Calzone", x: "Jambon, ricotta, tomate", price: "14 €" }]] }],
        ["feat:list2", { title: "Suppléments et accompagnements", items: [{ t: "Burrata, 3 €" }, { t: "Jambon cru, 3 €" }, { t: "Roquette, 1 €" }, { t: "Salade verte" }, { t: "Tiramisu maison" }, { t: "Panna cotta" }] }],
        ["cta:band", { title: "Menu du midi à 14 €", sub: "Une pizza au choix et un café, du mardi au vendredi.", cta: ["Voir les horaires", "/venir"] }],
      ] },
      { key: "four", name: "Le four", blocks: [
        ph("Le four", "Sept tonnes de briques réfractaires et beaucoup de patience."),
        ["feat:steps", { title: "Une pizza en quatre étapes", items: [{ t: "Le pétrin", x: "Pétrissage lent à la main, puis repos au frais.", d: "J − 2" }, { t: "Les boules", x: "La pâte est boulée et repose 24 heures.", d: "J − 1" }, { t: "L'étalage", x: "Étalée à la main, sans rouleau.", d: "Service" }, { t: "Le feu", x: "Cuite 90 secondes sur la sole.", d: "Service" }] }],
        ["misc:story", { eyebrow: "Le pizzaiolo", title: "Un geste appris à Naples", paras: ["Luca Benedetti (pizzaiolo fictif) a appris auprès d'une famille napolitaine avant d'ouvrir Tizzone à Toulouse.", "Il choisit ses farines, ses tomates et sa mozzarella auprès de petits producteurs d'Italie et du Sud-Ouest."], image: "portrait-3" }],
        ["proof:quotes", { title: "Ils ont goûté", items: [{ q: "Une pâte légère qui fond sur la langue.", n: "Anaïs G.", r: "cliente fictive" }, { q: "La Diavola, c'est un coup de coeur.", n: "Yanis C.", r: "client fictif" }, { q: "On croirait être à Naples.", n: "Pierre-Louis A.", r: "client fictif" }] }],
      ] },
      { key: "emporter", name: "Emporter", blocks: [
        ph("À emporter", "Commandez par téléphone, retrait en dix minutes."),
        ["feat:icons", { title: "Comment ça marche", items: [{ icon: "smartphone", t: "J'appelle", x: "Au 05 61 00 44 18, de 11 h 45 à 22 h." }, { icon: "clock", t: "J'attends dix minutes", x: "Les pizzas partent du four directement dans les boîtes." }, { icon: "mapPin", t: "Je passe les chercher", x: "Au comptoir, place de la Fontaine." }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faites-vous la livraison ?", x: "Non, uniquement vente à emporter et service sur place." }, { t: "Avez-vous des pizzas sans gluten ?", x: "Pas à ce jour : la farine circule dans toute la cuisine." }, { t: "Peut-on réserver ?", x: "Oui, pour le soir à partir de quatre couverts." }] }],
        ["cta:split", { title: "Commande de groupe", sub: "Dix pizzas ou plus : appelez-nous la veille.", cta: ["Nous contacter", "/venir"] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Jeudi", "11 h 45 – 14 h 15 · 18 h 45 – 22 h"], ["Vendredi – Samedi", "11 h 45 – 14 h 15 · 18 h 45 – 22 h 30"], ["Dimanche", "18 h 45 – 22 h"]] }],
        ["contact:map", { title: "Place de la Fontaine", mapAddress: "9 place de la Fontaine, 31000 Toulouse" }],
      ] },
    ],
  },

  // 4. ARDENTE — steakhouse / grill (sombre)
  {
    key: "braise-ardente", name: "Ardente", category: "restaurant", tags: ["sombre", "audacieux"], siteType: "Steakhouse et grill",
    description: "Fond brun charbon, ambre incandescent et capitales condensées : un en-tête sombre, une image plein bandeau et une carte de viandes maturées, pour un grill nocturne.",
    brand: "Ardente Grill",
    tokens: { colors: { primary: "#e8a838", secondary: "#0e0a07", accent: "#c8452d", background: "#17120d", surface: "#231a12", text: "#f5ebdc", muted: "#bfae98" }, fonts: { heading: "font.oswald", body: "font.archivo", button: "font.oswald", link: "font.archivo" }, radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 70, weight: 600, lineHeight: 1.0, letterSpacing: 0.02, transform: "uppercase" }, h2: { size: 40, weight: 600, lineHeight: 1.08, letterSpacing: 0.03, transform: "uppercase" } }, border: { width: 1, color: "#3a2c1f" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "braise-ardente", motifs: ["rays", "halftone", "topo"] },
    head: ["head:dark", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Les viandes", "/viandes"], ["Privatisation", "/privatisation"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "31 boulevard des Tanneurs, 33000 Bordeaux", phone: "05 56 00 71 09", email: "salle@ardente.example", hours: "Du mardi au dimanche, 19 h – 23 h ; déjeuner samedi et dimanche", tagline: "Viandes maturées sur braise de chêne." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Steakhouse · Bordeaux", title: "La viande, rien que la viande.", sub: "Races à viande maturées, grillées sur braise de chêne et tranchées à table. Une carte courte, des vins de caractère.", cta: ["Réserver une table", "/reserver"], cta2: ["La carte", "/carte"] }],
        ["feat:tabs", { title: "Nos pièces", items: [{ t: "Entrecôte", x: "Persillée, grillée saignante ou à point, 350 g." }, { t: "Côte de boeuf", x: "Un kilo à partager, maturée 35 jours." }, { t: "Onglet", x: "Tendre et goûteux, sauce échalote." }, { t: "Pièce du jour", x: "Selon l'arrivage du boucher." }] }],
        ["proof:stats", { title: "Le grill en chiffres (exemples)", items: [["35 j", "de maturation"], ["8", "éleveurs partenaires"], ["55", "couverts"]] }],
        ["gal:carousel", { title: "La cuisine ouverte", items: [{ t: "Le grill" }, { t: "La chambre froide" }, { t: "La salle" }, { t: "Le bar" }] }],
        ["cta:band", { title: "Vendredi soir, la salle est pleine.", sub: "Réservez votre table dès aujourd'hui.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Carte courte, viandes servies avec frites ou légumes."),
        ["misc:menu", { title: "Carte du grill", left: ["Entrées", [{ t: "Tartare au couteau", x: "Jaune confit, câpres", price: "14 €" }, { t: "Os à moelle", x: "Sel gris, pain grillé", price: "11 €" }]], right: ["Du grill", [{ t: "Entrecôte 350 g", x: "Frites, sauce au poivre", price: "34 €" }, { t: "Onglet 250 g", x: "Échalotes confites", price: "26 €" }, { t: "Côte de boeuf 1 kg", x: "Pour deux", price: "89 €" }, { t: "Poulet fermier", x: "Jus, ail rôti", price: "22 €" }]] }],
        ["feat:list2", { title: "Sauces et accompagnements", items: [{ t: "Poivre vert" }, { t: "Béarnaise" }, { t: "Beurre d'anchois" }, { t: "Frites maison" }, { t: "Gratin de pommes de terre" }, { t: "Haricots verts à l'ail" }] }],
        ["cta:card", { title: "Menu du soir à 39 €", sub: "Entrée, grill du jour, dessert.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "viandes", name: "Les viandes", blocks: [
        ph("Les viandes", "D'où elles viennent, comment elles sont maturées."),
        ["feat:compare", { title: "Choisir sa pièce", rows: [["", "Entrecôte", "Onglet", "Côte de boeuf"], ["Texture", "Persillée", "Fondante", "Juteuse"], ["Poids", "350 g", "250 g", "1 kg"], ["Pour", "1 personne", "1 personne", "2 à 3 personnes"]] }],
        ["misc:story", { eyebrow: "Le boucher", title: "Choisies une à une", paras: ["Maxime Coudert (boucher fictif) visite chaque éleveur avant de sélectionner ses pièces.", "La maturation se fait en chambre à 2 °C, de trois à six semaines selon la race."], image: "portrait-4" }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quelle cuisson conseillez-vous ?", x: "Saignante ou à point, pour respecter le grain de la viande." }, { t: "Avez-vous une option sans viande ?", x: "Oui, un plat végétal du jour." }, { t: "Menu enfant ?", x: "Oui, steak haché frais et frites, 12 €." }] }],
      ] },
      { key: "privatisation", name: "Privatisation", blocks: [
        ph("Privatisation", "La salle haute pour vos dîners d'équipe et de famille."),
        ["feat:checks", { title: "Ce que comprend la salle haute", cta: ["Demander un devis", "/reserver"], items: [{ t: "Jusqu'à 24 convives" }, { t: "Menu sur mesure" }, { t: "Vins accordés" }, { t: "Accès indépendant" }] }],
        ["proof:quotes", { title: "Après leur repas", items: [{ q: "Notre dîner d'équipe était parfait.", n: "Camille B.", r: "cliente fictive" }, { q: "Viande exceptionnelle, service attentif.", n: "Sébastien P.", r: "client fictif" }] }],
        ["cta:split", { title: "Un événement à organiser ?", sub: "Écrivez-nous les dates visées et le nombre de convives.", cta: ["Nous écrire", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Vendredi", "19 h – 23 h"], ["Samedi – Dimanche", "12 h – 14 h 30 · 19 h – 23 h"]] }],
        ["contact:info", { title: "Nous contacter", formTitle: "Demande de réservation", formIntro: "Indiquez date, heure et nombre de couverts." }],
      ] },
    ],
  },

  // 5. SILLON — restaurant végétal
  {
    key: "vegetal-sillon", name: "Sillon", category: "restaurant", tags: ["naturel", "minimaliste"], siteType: "Restaurant végétal",
    description: "Vert feuille, fond herbe tendre et texte seul en accueil : un restaurant végétal et de saison, avec en-tête latéral, titres Fraunces et pied de page à lettre d'information.",
    brand: "Sillon",
    tokens: { colors: { primary: "#2f7d32", secondary: "#1c3a22", accent: "#c98a1a", background: "#f4f8ee", surface: "#ffffff", text: "#1b2a1c", muted: "#4d6150" }, fonts: { heading: "font.fraunces", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 6, md: 12, lg: 20, button: 12, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d9e5cd" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "vegetal-sillon", motifs: ["botanical", "blobs", "waves"] },
    head: ["head:side", {}], foot: ["foot:newsletter", { title: "Les nouvelles du potager", sub: "Une lettre par saison : nouveau menu et ateliers.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Le potager", "/potager"], ["Ateliers", "/ateliers"], ["Venir", "/venir"]], cta: ["Réserver", "/venir"],
    contact: { address: "5 chemin des Jardins, 38000 Grenoble", phone: "04 76 00 18 92", email: "bonjour@sillon.example", hours: "Du mercredi au dimanche, 12 h – 14 h 30 ; vendredi et samedi aussi le soir", tagline: "Cuisine végétale de saison." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:minimal", { eyebrow: "Cuisine 100 % végétale · Grenoble", title: "Des légumes, rien d'autre. Et ça suffit.", sub: "Un menu qui suit la saison, des fermentations maison et des producteurs à moins de cinquante kilomètres.", cta: ["Voir la carte", "/carte"], cta2: ["Réserver", "/venir"] }],
        ["gal:strip", { title: "Au fil de la saison", items: [{ t: "Courge rôtie" }, { t: "Chou fermenté" }, { t: "Champignons" }, { t: "Poire pochée" }, { t: "Pain au levain" }] }],
        ["feat:grid-icons", { title: "Notre cuisine", items: [{ icon: "sun", t: "De saison", x: "Un menu qui change tous les mois." }, { icon: "layers", t: "Fermentée", x: "Kimchi, miso, kombucha faits sur place." }, { icon: "globe", t: "Locale", x: "Moins de 50 km entre le champ et l'assiette." }, { icon: "heart", t: "Sans gluten sur demande", x: "Beaucoup de plats le sont déjà." }] }],
        ["proof:big", { items: [{ q: "On ne remarque même plus l'absence de viande.", n: "Lucie F.", r: "cliente fictive" }] }],
        ["cta:split", { title: "Déjeuner de saison à 22 €", sub: "Entrée, plat, dessert. Du mercredi au dimanche.", cta: ["Réserver", "/venir"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Menu de saison, exemples d'automne."),
        ["feat:pricelist", { title: "Au déjeuner", items: [{ t: "Soupe de courge rôtie", x: "Graines grillées, huile de noisette", price: "9 €" }, { t: "Risotto d'épeautre", x: "Champignons, thym, parmesan végétal", price: "17 €" }, { t: "Chou rôti", x: "Houmous de pois chiches, dukkah", price: "16 €" }, { t: "Poire pochée", x: "Crème d'amande, sablé", price: "8 €" }] }],
        ["feat:rows", { title: "À boire", items: [{ t: "Kombucha maison", x: "Gingembre ou hibiscus." }, { t: "Vins nature", x: "Vignerons de Savoie et d'Isère." }, { t: "Infusions du jardin", x: "Verveine, menthe, thym." }] }],
        ["cta:band", { title: "Menu dégustation du vendredi", sub: "Six temps, 48 €.", cta: ["Réserver", "/venir"] }],
      ] },
      { key: "potager", name: "Le potager", blocks: [
        ph("Le potager", "Un hectare à dix minutes de la cuisine."),
        ["misc:text", { eyebrow: "Notre ferme partenaire", title: "Cultiver pour cuisiner", paras: ["Un maraîcher voisin cultive pour nous quarante variétés de légumes, dont beaucoup oubliées.", "Les épluchures retournent au compost, les bocaux se remplissent en été pour l'hiver."] }],
        ["feat:steps", { title: "Une année au potager", items: [{ t: "Printemps", x: "Asperges, radis, herbes fraîches.", d: "Mars" }, { t: "Été", x: "Tomates, courgettes, aubergines.", d: "Juin" }, { t: "Automne", x: "Courges, champignons, poires.", d: "Sept." }, { t: "Hiver", x: "Racines, choux, fermentations.", d: "Déc." }] }],
        ["gal:wall", { title: "Au jardin", items: [{ t: "Les tomates" }, { t: "Les herbes" }, { t: "Les courges" }, { t: "Le compost" }] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ph("Ateliers", "Apprendre à cuisiner les légumes."),
        ["misc:schedule", { title: "Prochains ateliers", items: [{ d: "Sam. 10 h", t: "Fermenter ses légumes", x: "Kimchi et choucroute, 3 h, 45 €." }, { d: "Dim. 15 h", t: "Pain au levain", x: "De la farine à la mie, 4 h, 55 €." }, { d: "Mer. 19 h", t: "Cuisine d'hiver", x: "Racines et choux, 2 h 30, 38 €." }] }],
        ["cta:card", { title: "Offrir un atelier", sub: "Bon cadeau valable un an.", cta: ["Nous écrire", "/venir"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il apporter du matériel ?", x: "Non, tout est fourni, tablier compris." }, { t: "Accessible aux débutants ?", x: "Oui, aucun niveau n'est requis." }] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Réserver et venir"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi – Mardi", "Fermé"], ["Mercredi – Jeudi", "12 h – 14 h 30"], ["Vendredi – Samedi", "12 h – 14 h 30 · 19 h – 22 h"], ["Dimanche", "12 h – 15 h"]] }],
        ["contact:map", { title: "Sillon", mapAddress: "5 chemin des Jardins, 38000 Grenoble" }],
      ] },
    ],
  },

  // 6. CITRONNIER — libanais / méditerranéen
  {
    key: "mezze-citronnier", name: "Citronnier", category: "restaurant", tags: ["chaleureux", "geometrique"], siteType: "Restaurant libanais et méditerranéen",
    description: "Turquoise profond, ocre safran et motifs de carreaux : un titre Gloock généreux, un en-tête symétrique et une page de mezzés à partager pour une table méditerranéenne.",
    brand: "Le Citronnier",
    tokens: { colors: { primary: "#0f766e", secondary: "#12363a", accent: "#b8780f", background: "#fbf7ee", surface: "#fffdf7", text: "#1c2b2a", muted: "#4f625f" }, fonts: { heading: "font.gloock", body: "font.albert-sans", button: "font.albert-sans", link: "font.albert-sans" }, radius: { sm: 4, md: 10, lg: 18, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#e8dfc9" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "mezze-citronnier", motifs: ["tiles", "arches", "dunes"] },
    head: ["head:split", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Mezzés", "/mezzes"], ["Grillades", "/grillades"], ["Traiteur", "/traiteur"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "14 rue des Oliviers, 13001 Marseille", phone: "04 91 00 25 63", email: "table@citronnier.example", hours: "Tous les jours sauf lundi, 12 h – 14 h 30 et 19 h – 23 h", tagline: "Mezzés, braises et thé à la menthe." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Cuisine libanaise et méditerranéenne", title: "Posez tout au milieu de la table.", sub: "Houmous soyeux, taboulé aux herbes fraîches, falafels dorés et grillades au charbon : une cuisine à partager, du matin au soir.", cta: ["Voir les mezzés", "/mezzes"], cta2: ["Réserver", "/reserver"] }],
        ["feat:bento", { title: "Les incontournables", items: [{ t: "Le grand mezzé", x: "Douze petits plats froids et chauds, pour deux à quatre personnes.", icon: "users" }, { t: "Les grillades", x: "Chich taouk, kafta, agneau mariné.", icon: "sparkles" }, { t: "Les douceurs", x: "Baklavas, knefé et thé à la menthe.", icon: "heart" }] }],
        ["gal:masonry", { title: "À table", items: [{ t: "Houmous" }, { t: "Taboulé" }, { t: "Falafels" }, { t: "Grillades" }, { t: "Pâtisseries" }, { t: "La salle" }], bg: "token:surface" }],
        ["proof:quotes", { title: "Ils ont partagé", items: [{ q: "Des saveurs authentiques et un accueil sincère.", n: "Nadia H.", r: "cliente fictive" }, { q: "Le grand mezzé est une vraie fête.", n: "Thomas V.", r: "client fictif" }, { q: "Le houmous est addictif.", n: "Léonie M.", r: "cliente fictive" }] }],
        ["cta:image", { title: "Un repas en famille ou entre amis ?", sub: "Tablées jusqu'à vingt personnes, sur réservation.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "mezzes", name: "Mezzés", blocks: [
        ph("Les mezzés", "De petits plats à poser au centre de la table."),
        ["misc:menu", { title: "Mezzés froids et chauds", left: ["Froids", [{ t: "Houmous", x: "Pois chiches, tahini, citron", price: "7 €" }, { t: "Moutabal", x: "Aubergine fumée", price: "8 €" }, { t: "Taboulé", x: "Persil, menthe, boulgour", price: "8 €" }, { t: "Labneh", x: "Fromage frais, huile d'olive", price: "7 €" }]], right: ["Chauds", [{ t: "Falafels", x: "Sauce tarator", price: "8 €" }, { t: "Sambousseks", x: "Fromage ou viande", price: "9 €" }, { t: "Kebbé", x: "Boulgour et agneau", price: "10 €" }, { t: "Halloumi grillé", x: "Miel, thym", price: "9 €" }]] }],
        ["feat:pricelist", { title: "Formules à partager", items: [{ t: "Mezzé du jardin, végétarien", price: "24 €" }, { t: "Grand mezzé, 12 plats", price: "38 €" }, { t: "Mezzé royal avec grillades", price: "52 €" }] }],
        ["cta:band", { title: "Menu du midi à 16 €", sub: "Un mezzé, une grillade ou un plat végétarien, un thé.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "grillades", name: "Grillades", blocks: [
        ph("Grillades et plats", "Marinades maison, cuisson au charbon de bois."),
        ["feat:rows", { title: "Du charbon à l'assiette", items: [{ t: "Chich taouk", x: "Poulet mariné à l'ail et au citron, 17 €." }, { t: "Kafta", x: "Brochettes d'agneau haché aux herbes, 18 €." }, { t: "Agneau mariné", x: "Épaule confite puis grillée, 21 €." }, { t: "Plat végétarien du jour", x: "Selon le marché, 15 €." }] }],
        ["feat:alt", { title: "Le geste du feu", items: [{ t: "Marinades", x: "Citron, ail, sumac et huile d'olive pendant vingt-quatre heures." }, { t: "Braise", x: "Charbon de bois, cuisson lente, pains chauds à côté." }] }],
        ["proof:stats", { items: [["24 h", "de marinade"], ["14", "plats de mezzé"], ["60", "couverts"]] }],
      ] },
      { key: "traiteur", name: "Traiteur", blocks: [
        ph("Traiteur", "Buffets, plateaux et repas de fête."),
        ["price:tiers", { title: "Formules", items: [{ t: "Plateau mezzé", price: "18 €", period: "/ personne", f: ["Six mezzés froids", "Pain pita", "Dessert"], cta: "Demander un devis", url: "/reserver" }, { t: "Buffet", price: "32 €", period: "/ personne", f: ["Douze mezzés", "Deux grillades", "Pâtisseries"], cta: "Demander un devis", url: "/reserver", hl: true }, { t: "Fête", price: "sur devis", f: ["Service sur place", "Vaisselle", "Boissons"], cta: "Nous écrire", url: "/reserver" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quel délai prévoir ?", x: "Au moins cinq jours pour un plateau." }, { t: "Livrez-vous ?", x: "Dans un rayon de quinze kilomètres, avec frais." }] }],
        ["cta:card", { title: "Un événement à nourrir ?", sub: "Devis en 48 heures.", cta: ["Demander un devis", "/reserver"] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Vendredi", "12 h – 14 h 30 · 19 h – 23 h"], ["Samedi – Dimanche", "12 h – 23 h"]] }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Réserver une table", formIntro: "Réponse rapide." }],
      ] },
    ],
  },

  // 7. HOULE — crêperie bretonne
  {
    key: "galette-houle", name: "Houle", category: "restaurant", tags: ["classique", "naturel"], siteType: "Crêperie bretonne",
    description: "Bleu océan, fond brume et touches de beurre doré : un en-tête centré, un héros sur fond secondaire et une carte de galettes et de crêpes pour une crêperie en bord de mer.",
    brand: "Crêperie de la Houle",
    tokens: { colors: { primary: "#1d6fa5", secondary: "#10304a", accent: "#a87a0c", background: "#f3f8fb", surface: "#ffffff", text: "#14283a", muted: "#4a6075" }, fonts: { heading: "font.newsreader", body: "font.nunito-sans", button: "font.nunito-sans", link: "font.nunito-sans" }, radius: { sm: 4, md: 8, lg: 14, button: 8, field: 6, card: 10 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#d3e2ec" } },
    dna: { scale: "m", pad: "normal", align: "center", shape: "soft" }, art: { seed: "galette-houle", motifs: ["waves", "mountains", "ribbons"] },
    head: ["head:center", {}], foot: ["foot:columns", { about: "Galettes de blé noir et crêpes de froment, cuites à la commande face à la mer.", cols: [["La crêperie", "La carte", "Le blé noir", "Les cidres"], ["Infos", "Horaires", "Venir", "Groupes"]] }],
    menu: [["Accueil", "/"], ["La carte", "/carte"], ["Blé noir et cidres", "/ble-noir"], ["Groupes", "/groupes"], ["Venir", "/venir"]], cta: ["Voir la carte", "/carte"],
    contact: { address: "3 quai des Goémoniers, 29900 Concarneau", phone: "02 98 00 55 41", email: "creperie@houle.example", hours: "Tous les jours, 11 h 45 – 14 h 30 et 18 h 30 – 21 h 30 (fermé le mardi hors vacances)", tagline: "Galettes, crêpes et cidre brut." },
    social: ["facebook", "instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Crêperie bretonne · Concarneau", title: "Une galette, un bol de cidre, la mer en face.", sub: "Blé noir moulu en Bretagne, beurre demi-sel baratté, oeufs fermiers : on cuit à la commande sur le billig.", cta: ["Voir la carte", "/carte"], cta2: ["Venir", "/venir"] }],
        ["feat:icons", { title: "Ce qui fait la différence", items: [{ icon: "layers", t: "Blé noir de Bretagne", x: "Une farine moulue à la pierre, dans le Finistère." }, { icon: "heart", t: "Beurre demi-sel", x: "Baratté à la ferme, jamais remplacé." }, { icon: "sun", t: "Cuit à la commande", x: "Chaque galette passe sur le billig devant vous." }] }],
        ["gal:coursecards", { title: "Trois galettes de la maison", items: [{ t: "La complète", x: "Jambon, oeuf, emmental.", tag: "Classique", price: "10,50 €", cta: "Voir la carte", url: "/carte" }, { t: "La Houle", x: "Saint-Jacques, poireaux, crème.", tag: "Signature", price: "15,50 €", cta: "Voir la carte", url: "/carte" }, { t: "La saucisse", x: "Saucisse de Molène, oignons confits.", tag: "Terroir", price: "13 €", cta: "Voir la carte", url: "/carte" }] }],
        ["proof:quotes", { title: "Sur le livre d'or", items: [{ q: "La meilleure galette complète de la côte.", n: "Josiane L.", r: "cliente fictive" }, { q: "Un cidre brut parfait et un accueil rieur.", n: "Erwan G.", r: "client fictif" }, { q: "Les crêpes caramel au beurre salé, un régal.", n: "Mathilde K.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Une crêpe pour le goûter ?", sub: "Ouvert tous les après-midi en saison.", cta: ["Horaires", "/venir"] }],
      ] },
      { key: "carte", name: "La carte", blocks: [
        ph("La carte", "Galettes salées, crêpes sucrées, cidres et boissons."),
        ["misc:menu", { title: "Galettes et crêpes", intro: "Prix nets en euros (exemples).", left: ["Galettes de blé noir", [{ t: "Complète", x: "Jambon, oeuf, emmental", price: "10,50 €" }, { t: "La Houle", x: "Saint-Jacques, poireaux", price: "15,50 €" }, { t: "Chèvre miel", x: "Noix, salade", price: "11,50 €" }, { t: "Saucisse", x: "Oignons confits", price: "13 €" }]], right: ["Crêpes de froment", [{ t: "Beurre sucre", price: "4 €" }, { t: "Caramel beurre salé", price: "6 €" }, { t: "Chocolat maison", price: "6 €" }, { t: "Flambée au lambig", x: "Pomme caramélisée", price: "9 €" }]] }],
        ["feat:pricelist", { title: "Menus", items: [{ t: "Menu galette", x: "Complète, crêpe beurre sucre, bolée", price: "14 €" }, { t: "Menu mousse", x: "La Houle, crêpe caramel, bolée", price: "22 €" }, { t: "Menu enfant", x: "Galette jambon, crêpe, sirop", price: "9 €" }] }],
        ["cta:split", { title: "Sans gluten ?", sub: "Plusieurs galettes se préparent en farine de blé noir pur : demandez-nous.", cta: ["Nous appeler", "/venir"] }],
      ] },
      { key: "ble-noir", name: "Blé noir et cidres", blocks: [
        ph("Blé noir et cidres", "Deux produits de la terre bretonne."),
        ["feat:steps", { title: "Du champ à la galette", items: [{ t: "Semis", x: "Le blé noir se sème au printemps.", d: "Mai" }, { t: "Récolte", x: "Mûr à la fin de l'été, il est battu en septembre.", d: "Sept." }, { t: "Mouture", x: "Passée à la meule de pierre.", d: "Octobre" }, { t: "Cuisson", x: "Sur le billig, à la commande.", d: "Service" }] }],
        ["feat:list2", { title: "Les cidres de la maison", items: [{ t: "Cidre brut fermier" }, { t: "Cidre doux" }, { t: "Cidre rosé" }, { t: "Poiré" }, { t: "Jus de pomme" }, { t: "Lambig" }] }],
        ["misc:quote", { text: "On ne fait pas une galette, on la réussit.", by: "Dicton de la maison" }],
      ] },
      { key: "groupes", name: "Groupes", blocks: [
        ph("Groupes", "Repas de famille, classes et associations."),
        ["price:tiers", { title: "Menus de groupe", items: [{ t: "Galette", price: "13 €", period: "/ personne", f: ["Complète", "Crêpe beurre sucre", "Cidre"], cta: "Réserver", url: "/venir" }, { t: "Houle", price: "20 €", period: "/ personne", f: ["Galette au choix", "Crêpe caramel", "Bolée"], cta: "Réserver", url: "/venir", hl: true }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "À partir de combien de personnes ?", x: "Dès huit couverts, sur réservation." }, { t: "Accessibilité ?", x: "La salle est de plain-pied." }] }],
        ["cta:card", { title: "Nous écrire", sub: "Précisez la date et le nombre de convives.", cta: ["Contact", "/venir"] }],
      ] },
      { key: "venir", name: "Venir", blocks: [
        ph("Nous trouver"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi, mercredi à dimanche", "11 h 45 – 14 h 30 · 18 h 30 – 21 h 30"], ["Mardi", "Fermé hors vacances scolaires"]] }],
        ["contact:map", { title: "Quai des Goémoniers", mapAddress: "3 quai des Goémoniers, 29900 Concarneau" }],
      ] },
    ],
  },

  // 8. KOI NOCTURNE — restaurant japonais / sushi (sombre)
  {
    key: "koi-nocturne", name: "Koi Nocturne", category: "restaurant", tags: ["sombre", "minimaliste"], siteType: "Restaurant japonais et sushi",
    description: "Bleu nuit d'encre, accent bleu glycine et vermillon : un titre Tenor Sans discret, de larges respirations et un comptoir à sushis nocturne.",
    brand: "Koi Nocturne",
    tokens: { colors: { primary: "#8c9eff", secondary: "#060813", accent: "#ff6b57", background: "#0f1220", surface: "#181c30", text: "#eef0fa", muted: "#aab0cc" }, fonts: { heading: "font.tenor-sans", body: "font.mulish", button: "font.mulish", link: "font.mulish" }, radius: { sm: 2, md: 4, lg: 8, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 58, weight: 400, lineHeight: 1.1, letterSpacing: 0.01 }, h2: { size: 36, weight: 400, lineHeight: 1.2, letterSpacing: 0.02 } }, border: { width: 1, color: "#2a3050" } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "koi-nocturne", motifs: ["waves", "ribbons", "mesh"] },
    head: ["head:bar", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Carte", "/carte"], ["Omakase", "/omakase"], ["Comptoir", "/comptoir"], ["Réserver", "/reserver"]], cta: ["Réserver", "/reserver"],
    contact: { address: "11 rue des Lanternes, 75010 Paris", phone: "01 40 00 62 80", email: "table@koinocturne.example", hours: "Du mardi au samedi, 19 h – 23 h ; déjeuner le jeudi et le vendredi", tagline: "Sushis au comptoir, saké et nuit." },
    social: ["instagram"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Sushis et cuisine japonaise · Paris", title: "Le riz, le poisson, le geste.", sub: "Douze places au comptoir, un chef sushi face à vous et des poissons choisis chaque matin.", cta: ["Réserver une place", "/reserver"], cta2: ["Voir la carte", "/carte"], stats: [["12", "places au comptoir"], ["18", "sakés"], ["6 h", "de riz préparé chaque jour"]] }],
        ["feat:alt", { title: "Deux façons de dîner", items: [{ t: "Au comptoir", x: "Omakase en douze pièces, chef face à vous.", link: ["Omakase", "/omakase"] }, { t: "En salle", x: "Carte de sushis, sashimis, plats chauds et brochettes.", link: ["La carte", "/carte"] }] }],
        ["gal:grid", { title: "À la carte", items: [{ t: "Nigiri saumon" }, { t: "Maki thon" }, { t: "Sashimi du jour" }, { t: "Tempura de légumes" }, { t: "Ramen miso" }, { t: "Mochi" }] }],
        ["proof:quotes", { title: "En quelques mots", items: [{ q: "Un comptoir apaisant et des sushis impeccables.", n: "Aurélien T.", r: "client fictif" }, { q: "Le riz est parfait, tiède, avec du caractère.", n: "Mei S.", r: "cliente fictive" }] }],
        ["cta:image", { title: "Quelques places le vendredi.", sub: "Réservez avant le jeudi midi.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "carte", name: "Carte", blocks: [
        ph("La carte", "Poissons selon l'arrivage. Prix nets (exemples)."),
        ["misc:menu", { title: "Sushis et plats", left: ["Nigiri (2 pièces)", [{ t: "Saumon", price: "6 €" }, { t: "Thon rouge", price: "9 €" }, { t: "Daurade", price: "7 €" }, { t: "Saint-Jacques", price: "9 €" }]], right: ["Plats chauds", [{ t: "Tempura de légumes", x: "Sauce tentsuyu", price: "9 €" }, { t: "Gyoza maison", x: "Porc ou légumes", price: "8 €" }, { t: "Ramen miso", x: "Bouillon 12 h", price: "16 €" }, { t: "Poulet yakitori", x: "Sauce tare", price: "12 €" }]] }],
        ["feat:pricelist", { title: "Plateaux", items: [{ t: "Plateau Koï, 12 pièces", price: "26 €" }, { t: "Plateau Lune, 18 pièces", price: "38 €" }, { t: "Chirashi du jour", price: "24 €" }] }],
        ["cta:band", { title: "Menu déjeuner à 24 €", sub: "Jeudi et vendredi uniquement.", cta: ["Réserver", "/reserver"] }],
      ] },
      { key: "omakase", name: "Omakase", blocks: [
        ph("Omakase", "Laissez le chef choisir pour vous."),
        ["feat:steps", { title: "Déroulé du repas", items: [{ t: "Mise en bouche", x: "Un petit plat de saison.", d: "1" }, { t: "Sashimis", x: "Trois poissons selon l'arrivage.", d: "2" }, { t: "Nigiris", x: "Huit pièces servies une à une.", d: "3" }, { t: "Final", x: "Soupe miso, dessert.", d: "4" }] }],
        ["price:tiers", { title: "Formules", items: [{ t: "Omakase", price: "78 €", f: ["Douze pièces", "Soupe miso", "Dessert"], cta: "Réserver", url: "/reserver" }, { t: "Omakase et saké", price: "112 €", f: ["Douze pièces", "Trois sakés", "Dessert"], cta: "Réserver", url: "/reserver", hl: true }] }],
        ["misc:text", { title: "Précisions", paras: ["Le menu omakase se réserve 48 heures à l'avance. Prévenez-nous de toute allergie ou aversion : le chef adapte.", "Le service dure environ une heure et demie."] }],
      ] },
      { key: "comptoir", name: "Comptoir", blocks: [
        ph("Le comptoir"),
        ["misc:story", { eyebrow: "Le chef", title: "Quinze ans de riz et de couteau", paras: ["Ren Takahara (chef fictif) a appris à Osaka puis à Paris. Il prépare lui-même le riz, vinaigré à la température du jour.", "Chaque soir, il prend ses poissons au marché de Rungis et les travaille à la minute."], image: "portrait-3" }],
        ["proof:stats", { items: [["15 ans", "de pratique"], ["2", "marchés par semaine"], ["40", "références de saké"]] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Proposez-vous des options végétariennes ?", x: "Oui, un menu de sushis végétaux sur demande." }, { t: "Quelle tenue ?", x: "Libre, le comptoir est détendu." }] }],
      ] },
      { key: "reserver", name: "Réserver", blocks: [
        ph("Réserver"),
        ["misc:hours", { title: "Horaires", rows: [["Lundi", "Fermé"], ["Mardi – Mercredi", "19 h – 23 h"], ["Jeudi – Vendredi", "12 h – 14 h · 19 h – 23 h"], ["Samedi", "19 h – 23 h"], ["Dimanche", "Fermé"]] }],
        ["contact:map", { title: "Rue des Lanternes", mapAddress: "11 rue des Lanternes, 75010 Paris" }],
      ] },
    ],
  },

  // 9. CROCHET — burger artisanal
  {
    key: "burger-crochet", name: "Crochet", category: "restaurant", tags: ["ludique", "audacieux"], siteType: "Burger artisanal",
    description: "Violet électrique sur fond beurre, jaune moutarde et gros titres Unbounded : une affiche en capitales, un ton franc et une carte de burgers à composer.",
    isNew: true, brand: "Crochet Burger",
    tokens: { colors: { primary: "#7c3aed", secondary: "#1a1033", accent: "#f5b800", background: "#fffbea", surface: "#ffffff", text: "#1d1530", muted: "#5b5272" }, fonts: { heading: "font.unbounded", body: "font.urbanist", button: "font.unbounded", link: "font.urbanist" }, radius: { sm: 6, md: 12, lg: 20, button: 14, field: 10, card: 16 }, shadow: { card: "none", button: "md" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "uppercase" }, h2: { size: 32, weight: 700, lineHeight: 1.15, letterSpacing: -0.01 } }, border: { width: 2, color: "#1a1033" } },
    dna: { scale: "l", pad: "tight", align: "left", shape: "soft" }, art: { seed: "burger-crochet", motifs: ["halftone", "objects", "blobs"] },
    head: ["head:topbar", { info: "Ouvert 11 h 30 – 23 h · Lyon 7e", note: "Burger du mois : le Bleu Cassis" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Les burgers", "/burgers"], ["Compose le tien", "/compose"], ["Frites et boissons", "/sides"], ["Nous trouver", "/trouver"]], cta: ["Commander sur place", "/burgers"],
    contact: { address: "27 rue de Marseille, 69007 Lyon", phone: "04 72 00 90 14", email: "salut@crochet.example", hours: "Tous les jours, 11 h 30 – 23 h", tagline: "Pain brioché, steak haché frais, sauces maison." },
    social: ["instagram", "facebook"],
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Burgers artisanaux · Lyon", title: "Un burger, pas un sandwich.", sub: "Steak haché minute dans du boeuf fermier, pain brioché du boulanger d'à côté, sauces faites maison tous les matins.", cta: ["Voir les burgers", "/burgers"], cta2: ["Composer le mien", "/compose"] }],
        ["misc:marquee", { items: ["Boeuf fermier", "Pain brioché", "Frites maison", "Sauces maison", "Options végétariennes"] }],
        ["gal:products", { title: "Les stars de la carte", items: [{ t: "Le Crochet", price: "13 €" }, { t: "Bleu Cassis", price: "14 €" }, { t: "Le Poulet Rôti", price: "12 €" }, { t: "Le Champi (veggie)", price: "12 €" }] }],
        ["feat:numbered", { title: "Trois règles", items: [{ t: "Frais", x: "Steak haché chaque matin, jamais surgelé." }, { t: "Local", x: "Pain, légumes et fromage de moins de 80 km." }, { t: "Généreux", x: "Pas de burger où l'on cherche la sauce." }] }],
        ["cta:card", { title: "Un midi pressé ?", sub: "Burger, frites et boisson à 15 € en semaine.", cta: ["Voir la carte", "/burgers"] }],
      ] },
      { key: "burgers", name: "Les burgers", blocks: [
        ph("Les burgers", "Servis avec frites maison. Prix nets (exemples)."),
        ["misc:menu", { title: "La carte", left: ["Boeuf", [{ t: "Le Crochet", x: "Cheddar, oignons caramélisés, pickles", price: "13 €" }, { t: "Bleu Cassis", x: "Bleu d'Auvergne, confiture de cassis", price: "14 €" }, { t: "Le Double", x: "Deux steaks, bacon, sauce fumée", price: "16 €" }]], right: ["Autres", [{ t: "Poulet rôti", x: "Cuisse désossée, mayo citron", price: "12 €" }, { t: "Le Champi", x: "Champignon pané, chèvre, roquette", price: "12 €" }, { t: "Le P'tit Crochet", x: "Menu enfant, frites, boisson", price: "9 €" }]] }],
        ["feat:list2", { title: "Sauces maison", items: [{ t: "Fumée" }, { t: "Moutarde miel" }, { t: "Mayo citron" }, { t: "Barbecue" }, { t: "Sriracha douce" }, { t: "Ketchup maison" }] }],
        ["cta:band", { title: "Burger du mois", sub: "Le Bleu Cassis, à découvrir jusqu'à fin novembre.", cta: ["Compose le tien", "/compose"] }],
      ] },
      { key: "compose", name: "Compose le tien", blocks: [
        ph("Compose ton burger", "Quatre choix, mille combinaisons."),
        ["feat:steps", { title: "Quatre étapes", items: [{ t: "Le pain", x: "Brioché, complet ou sans gluten.", d: "1" }, { t: "La viande", x: "Boeuf, poulet ou galette végétale.", d: "2" }, { t: "Le fromage", x: "Cheddar, bleu, chèvre ou vegan.", d: "3" }, { t: "La sauce", x: "Deux sauces au choix.", d: "4" }] }],
        ["feat:compare", { title: "Les formules", rows: [["", "Simple", "Double"], ["Steaks", "1", "2"], ["Garnitures", "3", "5"], ["Prix", "11 €", "15 €"]] }],
        ["misc:text", { title: "Allergies", paras: ["Informez le comptoir de toute allergie : le pain et les sauces contiennent des allergènes (gluten, oeuf, moutarde)."] }],
      ] },
      { key: "sides", name: "Frites et boissons", blocks: [
        ph("Frites et boissons"),
        ["feat:pricelist", { title: "Les à-côtés", items: [{ t: "Frites maison", x: "Pommes de terre fraîches, deux fois cuites", price: "4 €" }, { t: "Frites patate douce", price: "5 €" }, { t: "Onion rings", price: "5 €" }, { t: "Salade croquante", price: "5 €" }] }],
        ["feat:pricelist", { title: "Boissons", items: [{ t: "Limonade maison", price: "4 €" }, { t: "Bière artisanale 33 cl", price: "5 €" }, { t: "Milkshake vanille ou chocolat", price: "6 €" }, { t: "Cola de la brasserie", price: "3 €" }] }],
        ["cta:split", { title: "Soirée entre amis ?", sub: "Plateau de six burgers à partager, 69 €.", cta: ["Nous trouver", "/trouver"] }],
      ] },
      { key: "trouver", name: "Nous trouver", blocks: [
        ph("Nous trouver"),
        ["misc:hours", { title: "Horaires", rows: [["Tous les jours", "11 h 30 – 23 h"]] }],
        ["contact:cards", { title: "Nous joindre", formTitle: "Un message ?", formIntro: "On répond dans la journée." }],
      ] },
    ],
  },
];
