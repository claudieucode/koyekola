// Industrie, construction et artisanat (6 thèmes). Textes de DÉMONSTRATION : entreprises, chiffres, références et coordonnées fictifs.
module.exports = [
  // 1. Menuiserie
  {
    key: "atelier-chene", name: "Atelier du Chêne", category: "industrie", tags: ["chaleureux", "naturel"], siteType: "Menuiserie sur mesure",
    description: "Menuiserie artisanale : tons de bois chauds, titres épais, grandes photos d'ouvrages et alternance image / texte pour raconter chaque réalisation.",
    brand: "Atelier du Chêne",
    tokens: { colors: { primary: "#8a5a2b", secondary: "#2b1d12", accent: "#b45309", background: "#f7f1e8", surface: "#fffaf2", text: "#2a1e14", muted: "#675848" }, fonts: { heading: "font.kanit", body: "font.bitter", button: "font.kanit", link: "font.bitter" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 8 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 58, weight: 600, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "atelier-chene", motifs: ["plates", "topo", "objects"] },
    head: ["head:topbar", { info: "Atelier ouvert du lundi au vendredi · Devis gratuit sous 72 h", note: "02 40 00 55 66" }], foot: ["foot:columns", { about: "Menuiserie sur mesure : escaliers, cuisines, bibliothèques et agencements, fabriqués dans notre atelier.", cols: [["Atelier", "Savoir-faire", "Réalisations", "Qualité"], ["Contact", "Demander un devis", "Mentions légales"]] }],
    menu: [["Accueil", "/"], ["Savoir-faire", "/savoir-faire"], ["Réalisations", "/realisations"], ["Qualité", "/qualite"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "9 chemin des Scieries, 44000 Nantes", phone: "02 40 00 55 66", email: "atelier@atelier-chene.example", hours: "Du lundi au vendredi, 8 h – 17 h 30", tagline: "Le bois, travaillé à la main et à la mesure." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Menuiserie sur mesure depuis 1987", title: "Des ouvrages en bois pensés pour votre maison", sub: "Escaliers, cuisines, bibliothèques, menuiseries extérieures : chaque pièce est dessinée, débitée et assemblée dans notre atelier nantais.", cta: ["Demander un devis", "/contact"], cta2: ["Voir les réalisations", "/realisations"] }],
        ["feat:alt", { eyebrow: "Ce que nous fabriquons", title: "Trois grandes familles d'ouvrages", items: [{ t: "Escaliers", x: "Limons à la française, marches en chêne massif, garde-corps sur mesure.", link: ["Savoir-faire", "/savoir-faire"] }, { t: "Cuisines et agencements", x: "Façades en bois, plans de travail massifs, rangements optimisés.", link: ["Réalisations", "/realisations"] }, { t: "Menuiseries extérieures", x: "Fenêtres, portes d'entrée et volets en bois certifié.", link: ["Qualité", "/qualite"] }] }],
        ["proof:stats", { title: "L'atelier en chiffres (exemples)", items: [["37 ans", "d'atelier"], ["1 200", "ouvrages livrés"], ["9", "compagnons"]] }],
        ["gal:featured", { title: "Quelques réalisations", items: [{ t: "Escalier hélicoïdal en chêne", x: "Marches en chêne massif, limon à la française." }, { t: "Bibliothèque sous pente" }, { t: "Cuisine en noyer" }, { t: "Portes d'entrée en mélèze" }] }],
        ["proof:quotes", { title: "Ils ont fait confiance à l'atelier", items: [{ q: "Un escalier qui s'intègre comme s'il avait toujours été là.", n: "Mireille T.", r: "cliente fictive" }, { q: "Délais tenus, finitions impeccables.", n: "Pascal R.", r: "client fictif" }, { q: "Des conseils précieux sur les essences.", n: "Aurélie S.", r: "cliente fictive" }] }],
        ["cta:band", { title: "Un projet en bois ?", sub: "Décrivez-le-nous : nous venons mesurer chez vous, gratuitement.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ["misc:pagehead", { title: "Notre savoir-faire", sub: "Du croquis à la pose." }],
        ["feat:steps", { eyebrow: "Notre méthode", title: "Les étapes d'un ouvrage", items: [{ t: "Relevé de côtes", x: "Nous venons chez vous mesurer et écouter vos usages." }, { t: "Plans et maquette", x: "Plans validés ensemble, échantillons de bois." }, { t: "Fabrication", x: "Débit, assemblage et finition en atelier." }, { t: "Pose", x: "Livraison et installation par nos compagnons." }] }],
        ["feat:icons", { title: "Nos spécialités", items: [{ icon: "layers", t: "Escaliers", x: "Droits, quart-tournants, hélicoïdaux." }, { icon: "home", t: "Agencements", x: "Dressings, bibliothèques, placards sous pente." }, { icon: "sun", t: "Extérieur", x: "Portes, fenêtres, pergolas, terrasses." }, { icon: "settings", t: "Restauration", x: "Parquets anciens, boiseries, portes." }] }],
        ["misc:text", { eyebrow: "Les essences", title: "Chêne, noyer, mélèze, frêne", paras: ["Nous travaillons surtout des bois français, issus de forêts gérées durablement, séchés naturellement puis en séchoir.", "Chaque essence a ses qualités : nous vous guidons selon l'usage, la lumière et le budget."] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations", sub: "Un aperçu de nos derniers chantiers." }],
        ["gal:masonry", { title: "En images", items: [{ t: "Escalier suspendu" }, { t: "Cuisine en chêne" }, { t: "Bibliothèque sur mesure" }, { t: "Porte cochère" }, { t: "Terrasse en mélèze" }, { t: "Dressing sous pente" }] }],
        ["gal:cards", { title: "Études de cas", items: [{ t: "Maison de ville à Nantes", x: "Escalier et garde-corps remplaçant une structure béton.", tag: "Escalier" }, { t: "Longère près de Clisson", x: "Fenêtres en chêne, isolation et finitions à l'huile.", tag: "Rénovation" }, { t: "Appartement haussmannien", x: "Bibliothèque sur trois mètres de hauteur.", tag: "Agencement" }] }],
        ["cta:split", { title: "Voir un ouvrage en vrai ?", sub: "Visites d'atelier le premier samedi du mois.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité et engagements" }],
        ["feat:checks", { title: "Nos engagements", cta: ["Demander un devis", "/contact"], items: [{ t: "Bois issu de forêts gérées durablement" }, { t: "Fabrication en atelier, pas de sous-traitance" }, { t: "Garantie décennale sur la pose" }, { t: "Finitions à l'huile ou vernis sans solvants" }] }],
        ["proof:logos", { title: "Labels et affiliations (exemples)", items: ["Artisans du Bois", "Maison Qualifiée", "Forêts Durables", "Compagnons de l'Ouest"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quels délais prévoir ?", x: "Comptez 6 à 10 semaines selon l'ouvrage, après validation des plans." }, { t: "Le devis est-il gratuit ?", x: "Oui, le déplacement et le devis sont offerts." }, { t: "Posez-vous aussi ?", x: "Oui, la pose est assurée par nos compagnons." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact et devis" }],
        ["contact:info", { title: "Parlez-nous de votre projet", formTitle: "Demande de devis", formIntro: "Décrivez l'ouvrage, sa localisation et vos délais.", cta: ["Envoyer ma demande", "/contact"] }],
        ["contact:map", { mapAddress: "9 chemin des Scieries, 44000 Nantes" }],
      ] },
    ],
  },

  // 2. Métallerie (sombre)
  {
    key: "forge-acier", name: "Forge & Acier", category: "industrie", tags: ["sombre", "audacieux"], siteType: "Métallerie et serrurerie d'art",
    description: "Métallerie sombre et puissante : fond graphite, orange forge, capitales massives, bandes numérotées et galerie en mosaïque.",
    brand: "FORGE & ACIER",
    tokens: { colors: { primary: "#ea580c", secondary: "#0c0a09", accent: "#fbbf24", background: "#171310", surface: "#221c18", text: "#f5efe9", muted: "#b9aea4" }, fonts: { heading: "font.bungee", body: "font.barlow", button: "font.bungee", link: "font.barlow" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#3a2f28" }, type: { h1: { size: 62, weight: 400, lineHeight: 1.05, letterSpacing: 0 }, h2: { size: 36, weight: 400, lineHeight: 1.1, letterSpacing: 0.01 } }, buttons: { paddingY: 16, paddingX: 30 } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "forge-acier", motifs: ["rays", "plates", "mesh"] },
    head: ["head:bar", {}], foot: ["foot:big", { title: "Forge & Acier" }],
    menu: [["Accueil", "/"], ["Savoir-faire", "/savoir-faire"], ["Réalisations", "/realisations"], ["Qualité", "/qualite"], ["Contact", "/contact"]], cta: ["Devis", "/contact"],
    contact: { address: "ZA des Forges, 42000 Saint-Étienne", phone: "04 77 00 61 61", email: "atelier@forge-acier.example", hours: "Du lundi au vendredi, 7 h 30 – 17 h", tagline: "Acier, inox, aluminium : travaillés sur mesure." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:poster", { eyebrow: "Métallerie et serrurerie", title: "L'acier, forgé à votre mesure", sub: "Garde-corps, escaliers, verrières, portails et structures : conception, fabrication et pose par un atelier de dix métalliers.", cta: ["Demander un devis", "/contact"], cta2: ["Nos réalisations", "/realisations"] }],
        ["feat:numbered", { title: "Trois métiers sous un même toit", items: [{ t: "Soudure", x: "Acier, inox et aluminium, procédés MIG, TIG et à l'électrode." }, { t: "Chaudronnerie", x: "Pliage, découpe laser, cintrage jusqu'à 12 mm." }, { t: "Pose", x: "Levage et montage par nos équipes habilitées." }] }],
        ["gal:wall", { title: "Dans l'atelier", items: [{ t: "Découpe laser" }, { t: "Soudure TIG" }, { t: "Verrière" }, { t: "Escalier acier" }] }],
        ["proof:statsbar", { items: [["18 000 m²", "d'ouvrages posés (exemple)"], ["10", "métalliers"], ["48 h", "pour un devis chiffré"]] }],
        ["feat:strips", { eyebrow: "Spécialités", title: "Ce que nous fabriquons", items: [{ t: "Verrières d'atelier", x: "Profilés acier fins, double vitrage feuilleté." }, { t: "Escaliers et passerelles", x: "Limons plats, marches en tôle larmée ou chêne." }, { t: "Portails et clôtures", x: "Barreaudage, lames, motorisation." }, { t: "Mobilier industriel", x: "Étagères, tables, structures de comptoirs." }] }],
        ["cta:band", { title: "Votre projet mérite de la matière.", sub: "Envoyez vos plans ou une photo : réponse sous 48 h.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ["misc:pagehead", { title: "Savoir-faire", sub: "De la tôle brute à l'ouvrage fini." }],
        ["feat:tabs", { title: "Nos procédés", items: [{ t: "Découpe", x: "Laser fibre jusqu'à 20 mm, oxycoupage pour les fortes épaisseurs." }, { t: "Formage", x: "Presse plieuse 3 m, rouleuse, cintreuse à tubes." }, { t: "Soudure", x: "Soudeurs qualifiés, contrôle visuel et ressuage." }, { t: "Finitions", x: "Thermolaquage, galvanisation, patine à l'huile." }] }],
        ["feat:rows", { title: "Un parcours de projet balisé", items: [{ t: "Étude", x: "Relevé, plans de fabrication, calculs de structure." }, { t: "Fabrication", x: "Prototypage, atelier, contrôle qualité." }, { t: "Pose", x: "Livraison, levage, réglages et réception." }] }],
        ["cta:split", { title: "Une pièce sur plan ?", sub: "Envoyez-nous votre fichier DXF ou vos croquis.", cta: ["Envoyer mes plans", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations" }],
        ["gal:featured", { title: "Chantiers récents", items: [{ t: "Verrière de loft", x: "38 m² de profilés acier fins." }, { t: "Passerelle de halle" }, { t: "Garde-corps inox" }, { t: "Portail coulissant" }] }],
        ["gal:cards", { title: "Études de cas", items: [{ t: "Halle de marché, Roanne", x: "Structure et escaliers : 14 tonnes d'acier.", tag: "Structure" }, { t: "Restaurant industriel, Lyon", x: "Verrière de 38 m² et mobilier sur mesure.", tag: "Verrière" }, { t: "Résidence, Saint-Étienne", x: "42 garde-corps en acier thermolaqué.", tag: "Garde-corps" }] }],
        ["proof:quotes", { title: "Avis de clients", items: [{ q: "Des soudures impeccables et un chantier propre.", n: "Direction technique", r: "client fictif" }, { q: "Un atelier qui tient les délais.", n: "Architecte", r: "client fictif" }, { q: "Réactifs sur les modifications de dernière minute.", n: "Maître d'ouvrage", r: "client fictif" }] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité et sécurité" }],
        ["proof:logos", { title: "Certifications (exemples)", items: ["EN 1090 · EXC2", "ISO 9001", "MASE", "Qualifelec Métal"] }],
        ["feat:list2", { title: "Notre démarche", items: [{ t: "Soudeurs qualifiés" }, { t: "Traçabilité des matières" }, { t: "Contrôles dimensionnels" }, { t: "Formation sécurité annuelle" }, { t: "Déchets métalliques recyclés" }, { t: "Garantie décennale" }] }],
        ["feat:accordion", { title: "Questions techniques", items: [{ t: "Quels aciers utilisez-vous ?", x: "S235 et S355 pour la structure, inox 304 et 316 pour l'extérieur." }, { t: "Faites-vous le thermolaquage ?", x: "Oui, en partenariat avec un atelier voisin, couleurs RAL au choix." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact et devis" }],
        ["contact:cards", { title: "Nous joindre" }],
        ["misc:hours", { title: "Horaires de l'atelier", rows: [["Lundi – jeudi", "7 h 30 – 17 h"], ["Vendredi", "7 h 30 – 15 h"], ["Week-end", "Fermé"]] }],
      ] },
    ],
  },

  // 3. Électricité industrielle
  {
    key: "ampere-industrie", name: "Ampère Industrie", category: "industrie", tags: ["technique", "moderne"], siteType: "Électricité industrielle et automatismes",
    description: "Installateur électricien industriel : bleu tension, jaune de signalisation, grilles d'icônes techniques, onglets de métiers et bandes de chiffres.",
    brand: "Ampère Industrie",
    tokens: { colors: { primary: "#0b4aa6", secondary: "#0b1b33", accent: "#facc15", background: "#f5f7fa", surface: "#ffffff", text: "#0f1a2b", muted: "#506077" }, fonts: { heading: "font.titillium-web", body: "font.dm-sans", button: "font.titillium-web", link: "font.dm-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 8, card: 10 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 }, h2: { size: 36, weight: 700, lineHeight: 1.15, letterSpacing: 0 } } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ampere", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:bar", {}], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Savoir-faire", "/savoir-faire"], ["Références", "/references"], ["Qualité", "/qualite"], ["Contact", "/contact"]], cta: ["Contacter un ingénieur", "/contact"],
    contact: { address: "ZI Les Nouettes, 69800 Saint-Priest", phone: "04 78 00 72 72", email: "contact@ampere-industrie.example", hours: "Du lundi au vendredi, 7 h 30 – 18 h · Astreinte 24 h/24", tagline: "Énergie, automatismes et maintenance." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Électricité industrielle", title: "Vos lignes de production, alimentées et pilotées sans interruption", sub: "Armoires électriques, automatismes, câblage et maintenance : 60 techniciens au service des sites industriels.", cta: ["Contacter un ingénieur", "/contact"], cta2: ["Nos références", "/references"] }],
        ["proof:statsbar", { items: [["60", "techniciens et ingénieurs"], ["24 h/24", "astreinte maintenance"], ["350", "sites suivis (exemple)"]] }],
        ["feat:tabs", { eyebrow: "Nos métiers", title: "De l'étude au dépannage", items: [{ t: "Armoires et distribution", x: "Conception, câblage et mise en service de tableaux basse tension." }, { t: "Automatismes", x: "Programmation d'automates, supervision, robots et convoyeurs." }, { t: "Maintenance", x: "Contrats préventifs, thermographie infrarouge, dépannage." }, { t: "Efficacité énergétique", x: "Comptage, variation de vitesse, éclairage LED industriel." }] }],
        ["feat:grid-icons", { title: "Ce que nous maîtrisons", items: [{ icon: "zap", t: "Haute et basse tension", x: "Postes, transformateurs, distribution." }, { icon: "settings", t: "Automatismes", x: "Automates, variateurs, capteurs." }, { icon: "monitor", t: "Supervision", x: "Tableaux de bord de production." }, { icon: "shield", t: "Sécurité", x: "Habilitations et consignations." }] }],
        ["gal:strip", { title: "Sur le terrain", items: [{ t: "Armoire de commande" }, { t: "Poste de transformation" }, { t: "Chemin de câbles" }, { t: "Supervision" }, { t: "Thermographie" }] }],
        ["cta:image", { title: "Un arrêt de ligne ? Nous intervenons.", sub: "Astreinte 24 h/24, intervention sur site en moins de 4 heures dans la région.", cta: ["Appeler l'astreinte", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ["misc:pagehead", { title: "Savoir-faire", sub: "Une ingénierie intégrée, du bureau d'études à l'atelier." }],
        ["feat:rows", { title: "Nos prestations", items: [{ t: "Bureau d'études", x: "Schémas, notes de calcul, cahiers des charges, conformité aux normes." }, { t: "Atelier d'armoires", x: "Câblage à plat, tests d'isolement, essais fonctionnels en usine." }, { t: "Installation sur site", x: "Tirage de câbles, raccordements, mise en service." }, { t: "Contrats de maintenance", x: "Visites planifiées, rapports, pièces de rechange." }] }],
        ["feat:steps", { eyebrow: "Notre méthode", title: "Un projet en quatre temps", items: [{ t: "Audit", x: "Visite du site, relevés, analyse des risques." }, { t: "Conception", x: "Schémas et chiffrage détaillé." }, { t: "Réalisation", x: "Fabrication et pose en limitant les arrêts." }, { t: "Recette", x: "Essais, formation des équipes, dossier technique." }] }],
        ["cta:band", { title: "Besoin d'un chiffrage ?", sub: "Envoyez-nous votre cahier des charges.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "references", name: "Références", blocks: [
        ["misc:pagehead", { title: "Références" }],
        ["gal:cards", { title: "Chantiers récents", items: [{ t: "Ligne d'embouteillage", x: "Automatisation d'une ligne de 36 000 bouteilles/heure.", tag: "Agroalimentaire" }, { t: "Atelier de plasturgie", x: "Remplacement de 12 armoires de commande.", tag: "Plasturgie" }, { t: "Plateforme logistique", x: "Distribution BT et éclairage LED sur 14 000 m².", tag: "Logistique" }] }],
        ["proof:logos", { title: "Ils nous confient leurs sites (clients fictifs)", items: ["Sylva Pack", "Mécanord", "Laiterie du Rhône", "Logis Express"] }],
        ["proof:quotes", { title: "Témoignages", items: [{ q: "Une équipe très réactive sur les arrêts programmés.", n: "Responsable maintenance", r: "client fictif" }, { q: "Des dossiers techniques complets, à jour.", n: "Directeur d'usine", r: "client fictif" }, { q: "Intervention en moins de trois heures un dimanche.", n: "Chef de production", r: "client fictif" }] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité, sécurité, environnement" }],
        ["proof:logos", { title: "Certifications (exemples)", items: ["ISO 9001", "MASE", "Qualifelec", "ISO 45001"] }],
        ["feat:compare", { title: "Nos niveaux d'engagement (exemple)", rows: [["Prestation", "Standard", "Contrat Sérénité"], ["Délai d'intervention", "Sous 24 h", "Sous 4 h"], ["Visite préventive", "Annuelle", "Trimestrielle"], ["Thermographie", "Sur demande", "Incluse"], ["Pièces critiques en stock", "non", "oui"]] }],
        ["feat:list2", { title: "Sécurité d'abord", items: [{ t: "Habilitations électriques à jour" }, { t: "Consignations tracées" }, { t: "Plan de prévention par chantier" }, { t: "Taux de fréquence suivi chaque mois" }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:info", { title: "Contacter un ingénieur", formTitle: "Décrivez votre besoin", formIntro: "Site, équipement concerné, urgence : nous revenons vers vous rapidement.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "ZI Les Nouettes, 69800 Saint-Priest" }],
      ] },
    ],
  },

  // 4. Fabrication mécanique
  {
    key: "precis-mecanique", name: "Précis Mécanique", category: "industrie", tags: ["technique", "minimaliste"], siteType: "Fabrication mécanique de précision",
    description: "Sous-traitant en mécanique de précision : gris métal, orange vif, grille technique, bandeau empilé avec chiffres et catalogue de moyens de production.",
    brand: "Précis Mécanique",
    tokens: { colors: { primary: "#9a3412", secondary: "#1f2937", accent: "#0369a1", background: "#eef0f2", surface: "#ffffff", text: "#1b2430", muted: "#566170" }, fonts: { heading: "font.kanit", body: "font.ibm-plex-sans", button: "font.kanit", link: "font.ibm-plex-sans" }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#cfd5dc" }, type: { h1: { size: 54, weight: 500, lineHeight: 1.1, letterSpacing: 0 }, h2: { size: 34, weight: 500, lineHeight: 1.2, letterSpacing: 0 } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "precis-meca", motifs: ["tiles", "plates", "topo"] },
    head: ["head:side", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Moyens", "/moyens"], ["Réalisations", "/realisations"], ["Qualité", "/qualite"], ["Contact", "/contact"]], cta: ["Demande de prix", "/contact"],
    contact: { address: "18 rue de l'Horlogerie, 25000 Besançon", phone: "03 81 00 84 84", email: "devis@precis-mecanique.example", hours: "Du lundi au vendredi, 7 h – 17 h 30", tagline: "Pièces usinées, tolérances au micron." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Mécanique de précision", title: "Des pièces au centième, en petites et moyennes séries", sub: "Tournage, fraisage, rectification et assemblage pour l'aéronautique, le médical et l'horlogerie.", cta: ["Demande de prix", "/contact"], cta2: ["Nos moyens", "/moyens"], stats: [["± 0,005 mm", "tolérance courante"], ["42", "machines"], ["15 j", "délai moyen"]] }],
        ["feat:strips", { eyebrow: "Procédés", title: "Un parc machines complet", items: [{ t: "Tournage CN", x: "Diamètres 2 à 320 mm, barres jusqu'à 65 mm." }, { t: "Fraisage 5 axes", x: "Pièces complexes en alliages, titane et plastiques techniques." }, { t: "Rectification", x: "Plane et cylindrique, états de surface Ra 0,2." }, { t: "Assemblage", x: "Sous-ensembles propres, contrôlés et emballés." }] }],
        ["proof:stats", { title: "Chiffres de l'atelier (exemples)", items: [["38 ans", "d'expérience"], ["1,8 M", "pièces par an"], ["99,2 %", "de conformité en livraison"]] }],
        ["gal:grid", { title: "Pièces récentes", items: [{ t: "Corps de vanne en inox" }, { t: "Engrenage en bronze" }, { t: "Bride titane" }, { t: "Insert médical" }, { t: "Arbre rectifié" }, { t: "Boîtier aluminium" }] }],
        ["feat:list2", { title: "Matières travaillées", items: [{ t: "Aciers et inox" }, { t: "Aluminium" }, { t: "Titane" }, { t: "Laiton et bronze" }, { t: "PEEK et plastiques techniques" }, { t: "Superalliages" }] }],
        ["cta:split", { title: "Un plan à chiffrer ?", sub: "Envoyez-le avec la quantité : réponse sous 48 h.", cta: ["Demande de prix", "/contact"] }],
      ] },
      { key: "moyens", name: "Moyens", blocks: [
        ["misc:pagehead", { title: "Moyens de production" }],
        ["feat:compare", { title: "Parc machines (exemple)", rows: [["Machine", "Nombre", "Capacité"], ["Tours CN", "12", "Ø 2 à 320 mm"], ["Centres 5 axes", "6", "600 × 500 × 400 mm"], ["Rectifieuses", "4", "Ø 5 à 250 mm"], ["Machines à mesurer 3D", "3", "± 0,002 mm"]] }],
        ["feat:icons", { title: "Autour de l'usinage", items: [{ icon: "layers", t: "Programmation FAO", x: "Pilotage direct depuis votre fichier 3D." }, { icon: "settings", t: "Outillages", x: "Gabarits, montages d'usinage et outils spéciaux." }, { icon: "eye", t: "Contrôle", x: "Rapports dimensionnels sur demande." }, { icon: "download", t: "Logistique", x: "Emballage sur mesure, livraison en flux tendu." }] }],
        ["cta:band", { title: "Une pièce complexe ?", sub: "Parlez-en à notre bureau des méthodes.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations" }],
        ["gal:cards", { title: "Cas clients", items: [{ t: "Pièces de pompe médicale", x: "Série de 12 000 pièces en inox 316L, traçabilité complète.", tag: "Médical" }, { t: "Rouages d'horlogerie", x: "Pignons de 4 mm en laiton, états de surface soignés.", tag: "Horlogerie" }, { t: "Supports aéronautiques", x: "Fraisage 5 axes d'aluminium 7075, 300 pièces/mois.", tag: "Aéro" }] }],
        ["proof:quotes", { title: "Clients", items: [{ q: "Qualité constante, documentation toujours au rendez-vous.", n: "Acheteur", r: "client fictif" }, { q: "Un interlocuteur technique qui parle plan.", n: "Ingénieur méthodes", r: "client fictif" }, { q: "Ils ont repris une pièce impossible chez trois confrères.", n: "Chef de projet", r: "client fictif" }] }],
        ["proof:logos", { title: "Secteurs desservis", items: ["Aéronautique", "Médical", "Horlogerie", "Énergie"] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité et certifications" }],
        ["feat:checks", { title: "Engagements qualité", cta: ["Voir les certificats", "/contact"], items: [{ t: "Premier article systématique" }, { t: "Rapport dimensionnel en série" }, { t: "Traçabilité lot et matière" }, { t: "Salle de métrologie à 20 °C" }] }],
        ["proof:logos", { title: "Certifications (exemples)", items: ["ISO 9001", "EN 9100", "ISO 13485", "ISO 14001"] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Quelles séries acceptez-vous ?", x: "De la pièce unique à 20 000 pièces par an." }, { t: "Fournissez-vous la matière ?", x: "Oui, avec certificat matière, ou nous usinons la vôtre." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Demande de prix" }],
        ["contact:info", { title: "Parlons de votre pièce", formTitle: "Votre demande", formIntro: "Indiquez matière, quantité, tolérances et délai.", cta: ["Envoyer ma demande", "/contact"] }],
        ["misc:hours", { title: "Horaires", rows: [["Lundi – jeudi", "7 h – 17 h 30"], ["Vendredi", "7 h – 16 h"]] }],
      ] },
    ],
  },

  // 5. Verrerie d'art
  {
    key: "verrerie-opale", name: "Verrerie Opale", category: "industrie", tags: ["luxe", "minimaliste"], siteType: "Verrerie d'art",
    description: "Atelier de verrerie d'art : palette glacée vert d'eau, serif de galerie, grands blancs, pièces présentées comme dans un cabinet de curiosités.",
    brand: "Verrerie Opale",
    tokens: { colors: { primary: "#0b6b63", secondary: "#10302e", accent: "#b45309", background: "#f2f8f7", surface: "#ffffff", text: "#12302e", muted: "#4b6664" }, fonts: { heading: "font.marcellus", body: "font.manrope", button: "font.manrope", link: "font.manrope" }, radius: { sm: 6, md: 14, lg: 28, button: 999, field: 12, card: 22 }, shadow: { card: "lg", button: "none" }, type: { h1: { size: 56, weight: 400, lineHeight: 1.12, letterSpacing: 0 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "verrerie-opale", motifs: ["bokeh", "blobs", "arches"] },
    head: ["head:center", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Savoir-faire", "/savoir-faire"], ["Collections", "/collections"], ["Ateliers", "/ateliers"], ["Contact", "/contact"]], cta: ["Visiter l'atelier", "/contact"],
    contact: { address: "3 passage des Souffleurs, 54000 Nancy", phone: "03 83 00 17 17", email: "atelier@verrerie-opale.example", hours: "Du mardi au samedi, 10 h – 18 h", tagline: "Verre soufflé, verre sculpté, verre vivant." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "Atelier de verre soufflé", title: "La lumière, à la bouche et au chalumeau", sub: "Vases, luminaires et pièces uniques soufflés à la canne dans notre atelier, à 1 150 °C, et finis à froid à la main.", cta: ["Voir les collections", "/collections"], cta2: ["Réserver un atelier", "/ateliers"] }],
        ["misc:quote", { text: "Le verre garde la mémoire de chaque souffle.", by: "Inès Valmont, maître verrier (fictive)" }],
        ["gal:wall", { title: "Pièces du moment", items: [{ t: "Vase Brume" }, { t: "Lustre Opale" }, { t: "Coupe Aurore" }, { t: "Carafe Source" }] }],
        ["feat:grid-icons", { title: "Quatre gestes", items: [{ icon: "sun", t: "Cueillir", x: "La masse de verre en fusion." }, { icon: "sparkles", t: "Souffler", x: "Donner sa forme à la bulle." }, { icon: "layers", t: "Façonner", x: "Pinces, fers et feuilles de couleur." }, { icon: "clock", t: "Recuire", x: "Douze heures de refroidissement lent." }] }],
        ["feat:alt", { title: "Sur mesure", items: [{ t: "Commandes d'architectes", x: "Luminaires monumentaux, cloisons de verre, appliques.", link: ["Parlons-en", "/contact"] }, { t: "Cadeaux d'entreprise", x: "Séries numérotées, gravure du nom.", link: ["Découvrir", "/collections"] }] }],
        ["cta:image", { title: "Venez voir le verre naître", sub: "Démonstrations ouvertes au public chaque samedi à 15 h.", cta: ["Réserver une visite", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ["misc:pagehead", { title: "Savoir-faire" }],
        ["misc:story", { eyebrow: "L'atelier", title: "Quatre souffleurs, un four, des siècles de gestes", paras: ["L'atelier perpétue une tradition lorraine du verre, avec des techniques de soufflage, de pâte de verre et de gravure à la roue.", "Chaque pièce est signée, datée et numérotée. Aucun moule industriel : chaque forme est un acte unique."], image: "portrait-4" }],
        ["feat:steps", { eyebrow: "Une pièce, de A à Z", title: "Fabrication", items: [{ t: "Cueillage", x: "Le verre en fusion, prélevé à la canne." }, { t: "Soufflage", x: "On souffle, on tourne, on façonne." }, { t: "Recuisson", x: "Une nuit dans le four de détente." }, { t: "Finition à froid", x: "Meulage, gravure et polissage." }] }],
        ["proof:stats", { items: [["1 150 °C", "température du four"], ["12 h", "de recuisson"], ["400", "pièces par an (exemple)"]] }],
      ] },
      { key: "collections", name: "Collections", blocks: [
        ["misc:pagehead", { title: "Collections" }],
        ["gal:masonry", { title: "Pièces uniques et petites séries", items: [{ t: "Vase Brume" }, { t: "Lustre Opale" }, { t: "Coupe Aurore" }, { t: "Verres Estuaire" }, { t: "Carafe Source" }, { t: "Boules de Noël" }] }],
        ["gal:products", { title: "Sélection de démonstration", items: [{ t: "Vase Brume", price: "220 €" }, { t: "Coupe Aurore", price: "140 €" }, { t: "Carafe Source", price: "95 €" }, { t: "Verres Estuaire (6)", price: "180 €" }] }],
        ["cta:card", { title: "Acheter une pièce ?", sub: "Les pièces se choisissent à l'atelier ou sur demande : écrivez-nous.", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ["misc:pagehead", { title: "Ateliers d'initiation" }],
        ["price:tiers", { title: "Nos formules (exemples)", items: [{ t: "Découverte", price: "75 €", period: "/ personne", f: ["1 h 30", "Une boule de Noël soufflée", "Matériel fourni"], cta: "Réserver", url: "/contact" }, { t: "Soufflage", price: "140 €", period: "/ personne", hl: true, f: ["3 heures", "Un vase de votre choix", "Cuisson et retrait sous 10 jours"], cta: "Réserver", url: "/contact" }, { t: "Stage de week-end", price: "380 €", period: "/ personne", f: ["2 jours", "Trois pièces", "Déjeuner compris"], cta: "Réserver", url: "/contact" }] }],
        ["feat:accordion", { title: "Bon à savoir", items: [{ t: "À partir de quel âge ?", x: "Dès 12 ans, accompagné d'un adulte jusqu'à 16 ans." }, { t: "Dois-je apporter quelque chose ?", x: "Seulement des vêtements en coton à manches longues." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact" }],
        ["contact:cards", { title: "Visiter l'atelier" }],
        ["misc:hours", { title: "Horaires d'ouverture", rows: [["Mardi – vendredi", "10 h – 18 h"], ["Samedi", "10 h – 19 h, démonstration à 15 h"], ["Dimanche – lundi", "Fermé"]] }],
      ] },
    ],
  },

  // 6. Charpente
  {
    key: "charpentes-saint-eloi", name: "Charpentes Saint-Éloi", category: "industrie", tags: ["classique", "geometrique"], siteType: "Charpente et construction bois",
    description: "Charpentier-constructeur : fond blanc franc, vert de pin et ocre, titres sans empattement en capitales, bandeau en cartes de chantiers et plaquette de chiffres.",
    brand: "Charpentes Saint-Éloi",
    tokens: { colors: { primary: "#0f3d3e", secondary: "#0a2627", accent: "#d38b1f", background: "#ffffff", surface: "#f4f1ea", text: "#14201f", muted: "#4d5d5c" }, fonts: { heading: "font.inter", body: "font.zilla-slab", button: "font.inter", link: "font.zilla-slab" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d9d4c7" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.02, letterSpacing: -0.03, transform: "uppercase" }, h2: { size: 34, weight: 800, lineHeight: 1.1, letterSpacing: -0.01, transform: "uppercase" } }, buttons: { paddingY: 15, paddingX: 30 } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "saint-eloi", motifs: ["topo", "plates", "mountains"] },
    head: ["head:topbar", { info: "Charpente · ossature bois · couverture · Bureau d'études intégré", note: "Devis sous 5 jours" }], foot: ["foot:newsletter", { title: "Nos chantiers par courriel", sub: "Une lettre par trimestre : chantiers, matériaux, réglementation.", button: "Nous écrire" }],
    menu: [["Accueil", "/"], ["Savoir-faire", "/savoir-faire"], ["Réalisations", "/realisations"], ["Qualité", "/qualite"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "Lieu-dit La Scierie, 73000 Chambéry", phone: "04 79 00 53 53", email: "bureau@charpentes-saint-eloi.example", hours: "Du lundi au vendredi, 7 h 30 – 17 h", tagline: "Charpentes traditionnelles et maisons à ossature bois." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:cover", { eyebrow: "Charpentiers depuis 1974", title: "Des charpentes qui tiennent debout pour des générations", sub: "Charpentes traditionnelles, fermettes, ossature bois et surélévations : de l'étude à la couverture, une seule entreprise.", cta: ["Demander un devis", "/contact"], cta2: ["Voir nos chantiers", "/realisations"], overlay: "#0a262799" }],
        ["feat:cards", { eyebrow: "Savoir-faire", title: "Quatre métiers du bois", items: [{ icon: "home", t: "Charpente traditionnelle", x: "Chevrons, fermes et pannes en sapin ou chêne, assemblées à tenons-mortaises." }, { icon: "layers", t: "Ossature bois", x: "Maisons et extensions basse consommation, préfabriquées en atelier." }, { icon: "sun", t: "Surélévation", x: "Un étage de plus en quelques semaines, sans reconstruire." }, { icon: "settings", t: "Rénovation", x: "Traitement, renfort et remplacement de charpentes anciennes." }] }],
        ["proof:statsbar", { items: [["50 ans", "de métier"], ["420", "charpentes posées (exemple)"], ["22", "compagnons"]] }],
        ["feat:alt", { eyebrow: "Chantiers", title: "Un chantier raconté", items: [{ t: "Ferme savoyarde à Aix-les-Bains", x: "Charpente en épicéa de pays sur 220 m², taillée à la main.", link: ["Voir", "/realisations"] }, { t: "Surélévation d'un immeuble", x: "Deux niveaux en ossature bois, posés en trois semaines.", link: ["Voir", "/realisations"] }] }],
        ["proof:quotes", { title: "Avis", items: [{ q: "Une charpente superbe, posée en une semaine.", n: "Maître d'ouvrage", r: "client fictif" }, { q: "Un bureau d'études très pédagogue.", n: "Architecte", r: "cliente fictive" }, { q: "Chantier propre, équipe ponctuelle.", n: "Particulier", r: "client fictif" }] }],
        ["cta:band", { title: "Un projet de toiture ou d'extension ?", sub: "Visite gratuite et devis détaillé sous cinq jours.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "savoir-faire", name: "Savoir-faire", blocks: [
        ["misc:pagehead", { title: "Savoir-faire", sub: "Un bois choisi, une structure calculée, un assemblage maîtrisé." }],
        ["feat:rows", { title: "De l'arbre à la toiture", items: [{ t: "Choix des bois", x: "Épicéa, douglas et chêne, certifiés et séchés pour limiter les déformations." }, { t: "Bureau d'études", x: "Calcul de structure, plans 3D et métrés avant la taille." }, { t: "Taille et assemblage", x: "Machine à commande numérique et finition manuelle." }, { t: "Levage et couverture", x: "Grue, pose de la charpente et mise hors d'eau en 48 heures." }] }],
        ["feat:tabs", { title: "Types de toitures", items: [{ t: "À deux pans", x: "Le grand classique, simple et économique." }, { t: "À la Mansart", x: "Pour gagner un étage habitable sous combles." }, { t: "En croupe", x: "Élégante, adaptée aux maisons de maître." }] }],
        ["cta:split", { title: "Un doute sur votre charpente ?", sub: "Un diagnostic gratuit sous quinze jours.", cta: ["Demander un diagnostic", "/contact"] }],
      ] },
      { key: "realisations", name: "Réalisations", blocks: [
        ["misc:pagehead", { title: "Réalisations" }],
        ["gal:featured", { title: "Chantiers récents", items: [{ t: "Ferme savoyarde", x: "Charpente en épicéa de pays, taillée à la main." }, { t: "Surélévation en ville" }, { t: "Pavillon à ossature bois" }, { t: "Hangar agricole" }] }],
        ["gal:coursecards", { title: "Études de cas", items: [{ t: "Grange transformée en habitation", x: "Charpente conservée à 70 %, isolation bio-sourcée.", tag: "Rénovation", price: "180 m²", cta: "Contact", url: "/contact" }, { t: "Maison passive à Annecy", x: "Ossature bois en sapin, trois semaines de montage.", tag: "Neuf", price: "135 m²", cta: "Contact", url: "/contact" }] }],
        ["proof:stats", { items: [["38", "surélévations"], ["120 t", "de bois mises en œuvre par an"], ["100 %", "du bois d'origine contrôlée"]] }],
      ] },
      { key: "qualite", name: "Qualité", blocks: [
        ["misc:pagehead", { title: "Qualité et engagements" }],
        ["proof:logos", { title: "Labels et qualifications (exemples)", items: ["Qualibat Charpente", "Bois de France", "Compagnons Bâtisseurs", "RGE Isolation"] }],
        ["feat:checks", { title: "Ce que nous garantissons", cta: ["Parler à un chargé d'affaires", "/contact"], items: [{ t: "Garantie décennale" }, { t: "Bois à taux d'humidité contrôlé" }, { t: "Traitement fongicide sans solvant" }, { t: "Dossier d'ouvrage remis à la réception" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il un permis pour changer la charpente ?", x: "Pas si la forme et la hauteur ne changent pas ; une déclaration préalable suffit en cas de modification." }, { t: "Quel délai de pose ?", x: "Une maison de 120 m² se charpente en une semaine, couverture comprise." }] }],
      ] },
      { key: "contact", name: "Contact", blocks: [
        ["misc:pagehead", { title: "Contact et devis" }],
        ["contact:info", { title: "Décrivez-nous votre projet", formTitle: "Demande de devis", formIntro: "Lieu, surface, type de toiture : quelques lignes suffisent.", cta: ["Envoyer", "/contact"] }],
        ["contact:map", { mapAddress: "Lieu-dit La Scierie, 73000 Chambéry" }],
      ] },
    ],
  },
];
