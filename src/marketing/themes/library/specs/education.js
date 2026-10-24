// Éducation, formation et e-learning (10 thèmes). Textes de DÉMONSTRATION : établissements, personnes et coordonnées fictifs, remplaçables dans l'éditeur.
const contactPage = (sub, title, cta, mapAddress, formIntro) => ({
  key: "contact", name: "Contact", blocks: [
    ["misc:pagehead", { title: "Contact", sub }],
    ["contact:info", { title, formTitle: "Écrivez-nous", formIntro, cta }],
    ["contact:map", { title: "Nous trouver", mapAddress }],
  ],
});
const COURSES = ["Formations Kolakisa (catalogue réel)"];

module.exports = [
  // 1. Organisme de formation professionnelle — thème historique
  {
    key: "ocean", name: "Océan", category: "education", tags: ["minimaliste", "moderne"], siteType: "Organisme de formation professionnelle",
    description: "Bleus profonds, fond glacé et titres serif posés : un organisme de formation sobre et lumineux, avec catalogue réel, admissions et équipe pédagogique.",
    modules: COURSES, brand: "Institut Océan",
    tokens: { colors: { primary: "#0b6e99", secondary: "#073b4c", accent: "#06b6a4", background: "#eff9fd", surface: "#ffffff", text: "#0c2230", muted: "#4d6675" }, fonts: { heading: "font.spectral", body: "font.inter", button: "font.inter", link: "font.inter" }, radius: { sm: 6, md: 10, lg: 16, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, border: { width: 1, color: "#c5dfeb" } },
    dna: { scale: "m", pad: "normal", align: "left", shape: "soft" }, art: { seed: "ocean", motifs: ["waves", "blobs", "topo"] },
    head: ["head:bar", {}], foot: ["foot:columns", { about: "Organisme de formation professionnelle certifié (exemple) : bureautique, management, langues et prévention.", cols: [["Formations", "Catalogue", "Admissions", "Tarifs"], ["Institut", "Équipe pédagogique", "Contact", "Mentions"]] }],
    menu: [["Accueil", "/"], ["Formations", "/formations"], ["Institut", "/institut"], ["Admissions", "/admissions"], ["Contact", "/contact"]], cta: ["Demander un devis", "/contact"],
    contact: { address: "8 quai des Marées, 44000 Nantes", phone: "02 40 55 01 20", email: "formation@ocean-institut.example", hours: "Du lundi au vendredi, 8 h 30 – 17 h 30", tagline: "Se former toute sa vie, à son rythme." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split", { eyebrow: "Formation professionnelle", title: "Apprenez avec méthode, avancez avec confiance.", sub: "Des parcours courts et certifiants pour les salariés, les indépendants et les équipes, en présentiel comme à distance.", cta: ["Voir le catalogue", "/formations"], cta2: ["Demander un devis", "/contact"], image: "hero" }],
        ["feat:icons", { eyebrow: "Notre approche", title: "Une pédagogie qui s'adapte à vous", items: [{ icon: "graduation", t: "Formateurs praticiens", x: "Des intervenants en activité, évalués après chaque session." }, { icon: "calendarClock", t: "Rythmes flexibles", x: "Journées, soirs ou modules à distance selon votre agenda." }, { icon: "trophy", t: "Certifications", x: "Attestation de fin de parcours et préparation aux certifications reconnues." }] }],
        ["gal:coursecards", { eyebrow: "Parcours à la une", title: "Trois formations très demandées", items: [{ t: "Excel pour la gestion", tag: "Intermédiaire", price: "690 €", x: "Tableaux croisés, formules avancées et tableaux de bord en 3 jours.", cta: "Découvrir", url: "/formations" }, { t: "Manager une équipe", tag: "Débutant", price: "1 150 €", x: "Posture, délégation et entretiens individuels en 4 jours.", cta: "Découvrir", url: "/formations" }, { t: "Anglais professionnel B2", tag: "Avancé", price: "1 480 €", x: "40 heures pour réunions, e-mails et présentations.", cta: "Découvrir", url: "/formations" }] }],
        ["proof:statsbar", { items: [["2 400", "stagiaires formés par an"], ["96 %", "de satisfaction (exemple)"], ["38", "formateurs experts"]] }],
        ["proof:quotes", { eyebrow: "Témoignages", title: "Ils sont montés en compétence", items: [{ q: "Programme clair et exercices tirés de mon quotidien.", n: "Léa M.", r: "Assistante de gestion, cliente fictive" }, { q: "Mon équipe applique déjà ses acquis au bout d'une semaine.", n: "Karim T.", r: "Responsable d'agence, client fictif" }, { q: "Un suivi sérieux, même à distance.", n: "Sophie R.", r: "Comptable, cliente fictive" }] }],
        ["cta:band", { title: "Construisons votre plan de formation.", sub: "Réponse sous 48 heures ouvrées, avec financement possible.", cta: ["Demander un devis", "/contact"] }],
      ] },
      { key: "formations", name: "Formations", blocks: [
        ["misc:pagehead", { title: "Catalogue des formations", sub: "Inter-entreprises ou sur mesure, du niveau initiation à l'expertise." }],
        ["misc:courses", {}],
        ["feat:steps", { eyebrow: "Votre parcours", title: "De la demande à l'attestation", items: [{ t: "Analyse du besoin", x: "Un entretien pour fixer objectifs et niveau.", d: "J-30" }, { t: "Convention", x: "Devis, programme et dossier de financement.", d: "J-20" }, { t: "Formation", x: "Alternance d'apports, d'ateliers et de cas pratiques.", d: "J" }, { t: "Évaluation", x: "Bilan à chaud, attestation et suivi à 3 mois.", d: "J+90" }] }],
        ["cta:split", { title: "Un besoin spécifique ?", sub: "Nous construisons un programme sur mesure pour vos équipes.", cta: ["Parler à un conseiller", "/contact"] }],
      ] },
      { key: "institut", name: "L'institut", blocks: [
        ["misc:pagehead", { title: "L'institut", sub: "Une équipe pédagogique engagée depuis 2004." }],
        ["misc:story", { eyebrow: "Notre histoire", title: "Former sans jargon, évaluer sans stress", paras: ["Créé par d'anciens responsables RH, l'institut conçoit des parcours qui partent des situations de travail réelles.", "Chaque stagiaire dispose d'un référent pédagogique de la première question jusqu'au suivi à trois mois."], image: "portrait-1" }],
        ["proof:team", { eyebrow: "Équipe pédagogique", title: "Ceux qui vous accompagnent", items: [{ n: "Claire Delmas", r: "Directrice pédagogique" }, { n: "Yann Kerloc'h", r: "Formateur management" }, { n: "Amina Seddiki", r: "Formatrice langues" }, { n: "Paul Estèbe", r: "Formateur bureautique" }] }],
        ["feat:numbered", { title: "Nos engagements", items: [{ t: "Transparence", x: "Programme, prix et indicateurs de résultat publiés." }, { t: "Accessibilité", x: "Un référent handicap pour adapter chaque parcours." }, { t: "Qualité", x: "Évaluation de chaque session par les stagiaires." }] }],
      ] },
      { key: "admissions", name: "Admissions", blocks: [
        ["misc:pagehead", { title: "Admissions et tarifs", sub: "Trois formules, des financements possibles." }],
        ["price:tiers", { items: [{ t: "Journée", price: "290 €", period: "par jour", x: "Pour une compétence ciblée.", f: ["Groupes de 8 maximum", "Supports numériques", "Attestation"], cta: "S'inscrire", url: "/contact" }, { t: "Parcours", price: "1 150 €", period: "4 jours", x: "Le plus choisi.", f: ["Suivi individuel", "Cas pratiques", "Évaluation finale", "Point de suivi à 3 mois"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Sur mesure", price: "Sur devis", x: "Pour les équipes.", f: ["Programme dédié", "Dans vos locaux", "Reporting RH"], cta: "Demander un devis", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Comment financer ma formation ?", x: "Plan de développement des compétences, CPF ou financement personnel : nous vous aidons à monter le dossier (exemple de démonstration)." }, { t: "Y a-t-il un prérequis ?", x: "Un test de positionnement gratuit de 15 minutes adapte le parcours à votre niveau." }, { t: "Puis-je annuler ?", x: "Jusqu'à 14 jours avant le début, sans frais." }] }],
        ["cta:card", { title: "Un doute sur votre éligibilité ?", sub: "Un conseiller vous rappelle dans la journée.", cta: ["Être rappelé", "/contact"] }],
      ] },
      contactPage("Un conseiller vous répond sous 24 heures ouvrées.", "Parlons de votre projet", ["Demander un devis", "/contact"], "8 quai des Marées, 44000 Nantes", "Précisez la formation visée et le nombre de participants."),
    ],
  },

  // 2. École de langues
  {
    key: "lingua-atelier", name: "Lingua Atelier", category: "education", tags: ["chaleureux", "ludique"], siteType: "École de langues",
    description: "Une école de langues chaleureuse : corail et sarcelle sur crème, collage de visuels, onglets par langue et ambiance de café-conversation.",
    brand: "Lingua Atelier",
    tokens: { colors: { primary: "#d9503b", secondary: "#155e63", accent: "#f2b134", background: "#fff8ee", surface: "#ffffff", text: "#2a2220", muted: "#6b5b55" }, fonts: { heading: "font.spectral", body: "font.raleway", button: "font.raleway", link: "font.raleway" }, radius: { sm: 8, md: 14, lg: 22, button: 999, field: 12, card: 20 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 56, weight: 700, lineHeight: 1.08, letterSpacing: -0.01 } } },
    dna: { scale: "l", pad: "airy", align: "left", shape: "pill" }, art: { seed: "lingua", motifs: ["bokeh", "objects", "ribbons"] },
    head: ["head:center", {}], foot: ["foot:newsletter", { title: "Une phrase utile par semaine", sub: "Recevez expressions, astuces et dates des ateliers de conversation.", button: "Je m'abonne" }],
    menu: [["Accueil", "/"], ["Langues", "/langues"], ["Méthode", "/methode"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Cours d'essai gratuit", "/contact"],
    contact: { address: "23 rue des Tanneurs, 69002 Lyon", phone: "04 72 10 33 48", email: "bonjour@lingua-atelier.example", hours: "Lundi – samedi, 9 h – 20 h", tagline: "Parler d'abord, conjuguer ensuite." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:collage", { eyebrow: "École de langues à Lyon", title: "Parlez dès la première heure.", sub: "Anglais, espagnol, allemand, italien et japonais en petits groupes, avec des enseignants natifs et des ateliers de conversation.", cta: ["Cours d'essai gratuit", "/contact"], cta2: ["Voir les langues", "/langues"] }],
        ["misc:marquee", { items: ["Cours d'essai offert", "Groupes de 6 maximum", "Ateliers conversation chaque jeudi", "Préparation TOEIC et DELE"] }],
        ["feat:tabs", { eyebrow: "Nos langues", title: "Choisissez votre destination", items: [{ t: "Anglais", x: "Du niveau A1 au C1, avec options business et voyage. Cours en soirée et le samedi matin." }, { t: "Espagnol", x: "Un parcours vivant autour de la culture ibérique et latino-américaine, préparation DELE." }, { t: "Allemand", x: "Grammaire progressive, vocabulaire professionnel et échanges avec des partenaires outre-Rhin." }, { t: "Japonais", x: "Hiragana et katakana dès le premier mois, puis conversation du quotidien." }] }],
        ["feat:bento", { eyebrow: "La méthode", title: "Trois ingrédients, un seul but", items: [{ icon: "users", t: "Petits groupes", x: "Six personnes au plus pour que chacun parle à chaque cours." }, { icon: "globe", t: "Immersion douce", x: "Dès le niveau A2, le français quitte la salle." }, { icon: "trophy", t: "Certifications", x: "Cambridge, TOEIC, DELE ou Goethe selon votre objectif." }] }],
        ["proof:big", { items: [{ q: "Au bout de trois mois, j'ai commandé un repas entier en espagnol, sans traduire dans ma tête.", n: "Camille V.", r: "élève fictive" }] }],
        ["cta:card", { title: "Votre première heure est offerte.", sub: "Test de niveau et cours d'essai, sans engagement.", cta: ["Réserver mon essai", "/contact"] }],
      ] },
      { key: "langues", name: "Langues", blocks: [
        ["misc:pagehead", { title: "Nos langues", sub: "Cinq langues, six niveaux, des formats pour chaque emploi du temps." }],
        ["gal:coursecards", { title: "Cours collectifs", items: [{ t: "Anglais conversation", tag: "B1 – B2", price: "29 €/mois", x: "Deux heures par semaine, thèmes d'actualité.", cta: "S'inscrire", url: "/contact" }, { t: "Espagnol débutant", tag: "A1", price: "27 €/mois", x: "Prononciation, vie quotidienne, premiers dialogues.", cta: "S'inscrire", url: "/contact" }, { t: "Allemand pro", tag: "B2", price: "35 €/mois", x: "E-mails, réunions et négociation.", cta: "S'inscrire", url: "/contact" }] }],
        ["feat:list2", { title: "Inclus dans chaque inscription", items: [{ t: "Test de niveau initial" }, { t: "Plateforme d'exercices en ligne" }, { t: "Bilan de progression chaque trimestre" }, { t: "Accès aux ateliers du jeudi" }] }],
        ["cta:band", { title: "Pas sûr de votre niveau ?", sub: "Passez le test gratuit de 15 minutes.", cta: ["Passer le test", "/contact"] }],
      ] },
      { key: "methode", name: "Méthode", blocks: [
        ["misc:pagehead", { title: "Notre méthode", sub: "On apprend une langue en la parlant." }],
        ["feat:alt", { items: [{ t: "Parler en premier", x: "Chaque séance débute par cinq minutes de conversation libre pour casser la glace et activer le vocabulaire." }, { t: "Des supports vivants", x: "Chansons, extraits de séries, menus et articles du jour plutôt que des manuels poussiéreux." }, { t: "Un suivi personnel", x: "Votre enseignant note vos erreurs fréquentes et vous propose des exercices ciblés.", link: ["Rencontrer l'équipe", "/contact"] }] }],
        ["proof:team", { title: "Les enseignants", items: [{ n: "Emma Whitlock", r: "Anglais, native de Leeds" }, { n: "Lucía Barrantes", r: "Espagnol, native de Séville" }, { n: "Jonas Reiter", r: "Allemand, natif de Stuttgart" }, { n: "Mika Ohara", r: "Japonais, native de Kobe" }] }],
        ["misc:quote", { text: "Une langue se fixe quand on s'amuse à la parler.", by: "Principe de l'atelier" }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et formules", sub: "Sans frais d'inscription la première année (exemple)." }],
        ["price:tiers", { items: [{ t: "Collectif", price: "29 €", period: "par mois", x: "Un cours hebdomadaire.", f: ["6 élèves maximum", "Plateforme en ligne"], cta: "Choisir", url: "/contact" }, { t: "Intensif", price: "79 €", period: "par mois", x: "Pour progresser vite.", f: ["3 cours par semaine", "Atelier du jeudi", "Préparation certification"], cta: "Choisir", url: "/contact", hl: true }, { t: "Individuel", price: "42 €", period: "l'heure", x: "Sur rendez-vous.", f: ["Programme sur mesure", "Horaires libres"], cta: "Choisir", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions pratiques", items: [{ t: "Puis-je changer de groupe ?", x: "Oui, au début de chaque trimestre selon les places disponibles." }, { t: "Que se passe-t-il si je rate un cours ?", x: "Il peut être rattrapé dans un autre groupe de même niveau." }, { t: "Proposez-vous des cours pour enfants ?", x: "Des ateliers dès 7 ans le mercredi après-midi." }] }],
        ["cta:split", { title: "Un budget formation à utiliser ?", sub: "Nous établissons devis et convention pour les entreprises.", cta: ["Demander un devis", "/contact"] }],
      ] },
      contactPage("Passez nous voir autour d'un thé : l'atelier est ouvert six jours sur sept.", "Venez parler avec nous", ["Cours d'essai gratuit", "/contact"], "23 rue des Tanneurs, 69002 Lyon", "Dites-nous la langue et le niveau qui vous intéressent."),
    ],
  },

  // 3. Coding bootcamp (sombre)
  {
    key: "codeforge", name: "Codeforge", category: "education", tags: ["sombre", "technique", "audacieux"], siteType: "Bootcamp de développement web",
    description: "Un bootcamp au ton nocturne : fond anthracite, violet électrique, titres larges et grille de compétences pour convaincre des reconversions numériques.",
    brand: "Codeforge Bootcamp",
    tokens: { colors: { primary: "#8b6cff", secondary: "#0a0d14", accent: "#2ee6a6", background: "#10131c", surface: "#181c28", text: "#eceff6", muted: "#a3adc2" }, fonts: { heading: "font.unbounded", body: "font.dm-sans", button: "font.dm-sans", link: "font.dm-sans" }, radius: { sm: 4, md: 8, lg: 12, button: 8, field: 6, card: 10 }, shadow: { card: "none", button: "md" }, type: { h1: { size: 48, weight: 700, lineHeight: 1.1, letterSpacing: -0.03 } }, border: { width: 1, color: "#2a3042" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "codeforge", motifs: ["mesh", "tiles", "rays"] },
    head: ["head:dark", {}], foot: ["foot:big", { title: "Forgez votre prochain métier." }],
    menu: [["Accueil", "/"], ["Programme", "/programme"], ["Financement", "/financement"], ["Anciens élèves", "/alumni"], ["Contact", "/contact"]], cta: ["Candidater", "/contact"],
    contact: { address: "5 passage de la Fonderie, 33000 Bordeaux", phone: "05 56 90 12 34", email: "admissions@codeforge.example", hours: "Du lundi au vendredi, 9 h – 19 h", tagline: "12 semaines pour devenir développeur web." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:gradient", { eyebrow: "Bootcamp full-stack · 12 semaines", title: "Devenez développeur web en 12 semaines.", sub: "Une formation intensive, des projets réels et un accompagnement vers l'emploi pour les reconversions.", cta: ["Candidater", "/contact"], cta2: ["Voir le programme", "/programme"], stats: [["12", "semaines"], ["15", "élèves par promo"], ["8", "projets livrés"]], angle: 135 }],
        ["feat:bento", { eyebrow: "Stack enseignée", title: "Les outils qu'attendent les recruteurs", items: [{ icon: "layout", t: "Front-end", x: "HTML, CSS moderne, JavaScript et React avec accessibilité intégrée." }, { icon: "settings", t: "Back-end", x: "Node.js, API REST, bases SQL et tests automatisés." }, { icon: "gitBranch", t: "Travail d'équipe", x: "Git, revues de code et méthodes agiles." }] }],
        ["feat:steps", { eyebrow: "Le parcours", title: "Douze semaines, quatre étapes", items: [{ t: "Fondations", x: "Algorithmique et JavaScript.", d: "S1–3" }, { t: "Front-end", x: "Interfaces React.", d: "S4–6" }, { t: "Back-end", x: "API, données, sécurité.", d: "S7–9" }, { t: "Projet final", x: "Produit livré en équipe.", d: "S10–12" }] }],
        ["gal:featured", { title: "Projets d'élèves", items: [{ t: "Marché de quartier", x: "Application de circuits courts." }, { t: "Planning médical", tag: "Santé" }, { t: "Billetterie", tag: "Culture" }, { t: "Suivi sportif", tag: "Sport" }] }],
        ["proof:statsbar", { items: [["87 %", "en poste sous 6 mois (exemple)"], ["46", "entreprises partenaires"], ["4,8/5", "note des anciens (exemple)"]] }],
        ["cta:split", { title: "Prochaine promo : 2 mars.", sub: "Dossier, test de logique et entretien en 10 jours.", cta: ["Candidater", "/contact"] }],
      ] },
      { key: "programme", name: "Programme", blocks: [
        ["misc:pagehead", { title: "Programme détaillé", sub: "Quarante heures par semaine, pédagogie par projet." }],
        ["feat:tabs", { title: "Modules", items: [{ t: "JavaScript", x: "Variables, fonctions, asynchronisme, DOM et modules ES. Trois mini-projets." }, { t: "React", x: "Composants, état, hooks, routage et tests d'interface." }, { t: "Node et SQL", x: "Serveur Express, authentification, modélisation et requêtes." }, { t: "Pro", x: "Déploiement, CI, CV technique, simulation d'entretien." }] }],
        ["misc:schedule", { title: "Une journée type", items: [{ d: "9 h", t: "Daily et défi du matin", x: "Un exercice court en binôme." }, { d: "10 h", t: "Cours magistral", x: "Notions du jour." }, { d: "14 h", t: "Atelier projet", x: "Pair programming." }, { d: "17 h", t: "Revue de code", x: "Retours des formateurs." }] }],
        ["feat:compare", { title: "Codeforge face aux autres voies", rows: [["", "Codeforge", "Autodidacte", "Cursus long"], ["Durée", "12 semaines", "Variable", "3 ans"], ["Projets réels", "8", "Selon vous", "2 à 3"], ["Mentor dédié", "oui", "non", "parfois"]] }],
      ] },
      { key: "financement", name: "Financement", blocks: [
        ["misc:pagehead", { title: "Tarifs et financement" }],
        ["price:tiers", { items: [{ t: "Temps plein", price: "7 900 €", period: "12 semaines", f: ["40 h par semaine", "Mentor dédié", "Accompagnement emploi"], cta: "Candidater", url: "/contact", hl: true }, { t: "Temps partiel", price: "8 400 €", period: "24 semaines", f: ["Soirs et samedis", "Mêmes projets", "Accès à vie au contenu"], cta: "Candidater", url: "/contact" }] }],
        ["feat:checks", { title: "Modes de financement possibles", cta: ["Voir mon éligibilité", "/contact"], items: [{ t: "Compte personnel de formation" }, { t: "Aide régionale de reconversion" }, { t: "Prêt étudiant à taux réduit" }, { t: "Paiement en trois fois" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Faut-il savoir coder ?", x: "Non, un test de logique suffit. Des ressources de préparation sont fournies." }, { t: "Quel matériel ?", x: "Un ordinateur portable avec 8 Go de mémoire." }] }],
      ] },
      { key: "alumni", name: "Anciens élèves", blocks: [
        ["misc:pagehead", { title: "Ils ont franchi le pas" }],
        ["proof:big", { items: [{ q: "Ancienne infirmière, je suis développeuse en CDI depuis quatre mois. Les revues de code m'ont appris plus que dix tutoriels.", n: "Marion G.", r: "promo 14, cliente fictive" }] }],
        ["proof:logos", { title: "Entreprises partenaires (fictives)", items: ["Nubix", "Vignoble Tech", "Dockyard", "Atlas Santé", "Pixelbrasserie"] }],
        ["cta:band", { title: "Votre histoire commence ici.", cta: ["Candidater", "/contact"] }],
      ] },
      contactPage("Notre équipe admissions répond en 24 heures.", "Parlons de votre reconversion", ["Candidater", "/contact"], "5 passage de la Fonderie, 33000 Bordeaux", "Racontez-nous votre parcours en quelques lignes."),
    ],
  },

  // 4. Cours de musique
  {
    key: "cadence-musique", name: "Cadence", category: "education", tags: ["editorial", "chaleureux"], siteType: "École de musique",
    description: "École de musique élégante : bordeaux et ivoire, titres manuscrits, alternance image-texte par instrument et grille horaire des cours.",
    brand: "École Cadence",
    tokens: { colors: { primary: "#8c2f4b", secondary: "#2c1a24", accent: "#d8a24a", background: "#fbf5ee", surface: "#fffdfa", text: "#2b1c22", muted: "#6c565d" }, fonts: { heading: "font.dancing-script", body: "font.nunito", button: "font.nunito", link: "font.nunito" }, radius: { sm: 6, md: 12, lg: 18, button: 12, field: 10, card: 16 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 64, weight: 700, lineHeight: 1.05 }, h2: { size: 44, weight: 700 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "soft" }, art: { seed: "cadence", motifs: ["ribbons", "arches", "objects"] },
    head: ["head:split", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Instruments", "/instruments"], ["Professeurs", "/professeurs"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Cours d'essai", "/contact"],
    contact: { address: "14 place du Conservatoire, 37000 Tours", phone: "02 47 38 20 15", email: "accueil@cadence-musique.example", hours: "Mardi – samedi, 10 h – 20 h", tagline: "Le plaisir de jouer, à tout âge." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:framed", { eyebrow: "École de musique à Tours", title: "Jouez, vibrez, progressez.", sub: "Piano, guitare, violon, chant et batterie : des cours individuels et collectifs pour les enfants dès 5 ans comme pour les adultes.", cta: ["Réserver un cours d'essai", "/contact"], cta2: ["Les instruments", "/instruments"] }],
        ["feat:alt", { eyebrow: "Nos disciplines", title: "Un instrument pour chaque envie", items: [{ t: "Piano et claviers", x: "Classique, jazz ou variété : un répertoire choisi avec vous, sur piano droit et numérique.", link: ["Découvrir", "/instruments"] }, { t: "Guitare et basse", x: "Accords, tablatures et jeu en groupe dès les premiers mois.", link: ["Découvrir", "/instruments"] }, { t: "Chant", x: "Voix, souffle et interprétation, avec une préparation à la scène.", link: ["Découvrir", "/instruments"] }] }],
        ["gal:masonry", { title: "Instants de l'école", items: [{ t: "Audition de printemps" }, { t: "Atelier jazz" }, { t: "Orchestre des juniors" }, { t: "Stage de chant" }, { t: "Concert de fin d'année" }] }],
        ["proof:quotes", { title: "Mots d'élèves", items: [{ q: "Ma fille a joué devant 80 personnes après neuf mois.", n: "Isabelle R.", r: "Maman d'élève, cliente fictive" }, { q: "Je reprends le piano à 52 ans, sans pression.", n: "Daniel F.", r: "Élève adulte, client fictif" }, { q: "Les ateliers de groupe m'ont donné confiance.", n: "Inès O.", r: "Guitariste, cliente fictive" }] }],
        ["feat:pricelist", { eyebrow: "Tarifs", title: "Des cours accessibles", items: [{ t: "Éveil musical (5 – 7 ans)", price: "22 €/mois", x: "45 minutes par semaine" }, { t: "Cours individuel 30 min", price: "78 €/mois", x: "Tous instruments" }, { t: "Atelier de groupe", price: "35 €/mois", x: "Jazz, rock ou chorale" }] }],
        ["cta:image", { title: "Venez essayer, c'est offert.", sub: "Un premier cours de 30 minutes, instrument prêté.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "instruments", name: "Instruments", blocks: [
        ["misc:pagehead", { title: "Instruments et disciplines" }],
        ["feat:strips", { items: [{ t: "Piano", x: "Cinq pianos de travail, partitions fournies, préparation aux examens." }, { t: "Guitare", x: "Classique, folk ou électrique, cours en duo possibles." }, { t: "Violon", x: "Méthode Suzuki dès 5 ans et orchestre des juniors." }, { t: "Batterie", x: "Studio insonorisé et pads d'entraînement." }, { t: "Chant", x: "Technique vocale, chorale et préparation aux auditions." }] }],
        ["misc:schedule", { title: "Un mercredi à l'école", items: [{ d: "14 h", t: "Éveil musical", x: "5 – 7 ans, salle des cuivres." }, { d: "15 h 30", t: "Orchestre des juniors", x: "8 – 12 ans." }, { d: "17 h", t: "Atelier jazz", x: "Ados et adultes, niveau 2." }, { d: "19 h", t: "Chorale", x: "Ouverte à tous, sans solfège." }] }],
        ["cta:card", { title: "Quel instrument pour votre enfant ?", sub: "Un conseiller vous oriente en quinze minutes.", cta: ["Prendre conseil", "/contact"] }],
      ] },
      { key: "professeurs", name: "Professeurs", blocks: [
        ["misc:pagehead", { title: "Nos professeurs" }],
        ["proof:team", { items: [{ n: "Élodie Mercadier", r: "Piano et formation musicale" }, { n: "Rafael Quintero", r: "Guitare et basse" }, { n: "Noémie Lacaze", r: "Violon et orchestre" }, { n: "Tristan Ouvrard", r: "Chant et batterie" }] }],
        ["misc:story", { eyebrow: "Notre projet", title: "Apprendre par le plaisir de jouer", paras: ["Fondée par trois musiciens-enseignants, l'école privilégie la pratique collective dès les premiers mois.", "Chaque trimestre, une audition publique offre à chaque élève une scène à sa mesure."], image: "portrait-2" }],
        ["feat:numbered", { title: "Ce qui nous guide", items: [{ t: "Bienveillance", x: "On progresse mieux sans jugement." }, { t: "Répertoire libre", x: "Vous choisissez vos morceaux." }, { t: "Scène", x: "Quatre rendez-vous publics par an." }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs et inscriptions" }],
        ["price:tiers", { items: [{ t: "Découverte", price: "78 €", period: "par mois", f: ["30 min par semaine", "Instrument prêté", "Audition annuelle"], cta: "S'inscrire", url: "/contact" }, { t: "Progression", price: "112 €", period: "par mois", f: ["45 min par semaine", "Atelier de groupe inclus", "Préparation d'examen"], cta: "S'inscrire", url: "/contact", hl: true }, { t: "Famille", price: "-15 %", period: "dès 2 inscrits", f: ["Tous instruments", "Horaires groupés"], cta: "S'inscrire", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Dois-je acheter un instrument ?", x: "Pas au début : nous prêtons guitares, violons et claviers pendant trois mois." }, { t: "Y a-t-il des vacances ?", x: "L'école suit le calendrier scolaire de la zone." }] }],
        ["cta:band", { title: "Rentrée le 9 septembre.", cta: ["Je m'inscris", "/contact"] }],
      ] },
      contactPage("Passez à l'école, un thé vous attend.", "Rencontrons-nous", ["Cours d'essai", "/contact"], "14 place du Conservatoire, 37000 Tours", "Indiquez l'âge de l'élève et l'instrument souhaité."),
    ],
  },

  // 5. Soutien scolaire
  {
    key: "cap-reussite", name: "Cap Réussite", category: "education", tags: ["moderne", "audacieux"], siteType: "Soutien scolaire",
    description: "Soutien scolaire dynamique : bleu nuit et jaune soleil, titres condensés en capitales, bandeau d'infos pratique pour rassurer les familles.",
    brand: "Cap Réussite",
    tokens: { colors: { primary: "#1e3a8a", secondary: "#10204f", accent: "#facc15", background: "#f7f8fc", surface: "#ffffff", text: "#14193a", muted: "#555c80" }, fonts: { heading: "font.barlow", body: "font.karla", button: "font.barlow", link: "font.karla" }, radius: { sm: 4, md: 8, lg: 12, button: 6, field: 6, card: 10 }, shadow: { card: "sm", button: "sm" }, type: { h1: { size: 54, weight: 800, lineHeight: 1.02, transform: "uppercase" }, h2: { size: 36, weight: 800, transform: "uppercase" } } },
    dna: { scale: "m", pad: "tight", align: "left", shape: "sharp" }, art: { seed: "capreussite", motifs: ["tiles", "plates", "halftone"] },
    head: ["head:topbar", { info: "Cours à domicile et en visio · Crédit d'impôt de 50 %", note: "Appelez le 03 20 41 77 08" }], foot: ["foot:simple", {}],
    menu: [["Accueil", "/"], ["Matières", "/matieres"], ["Nos méthodes", "/methodes"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Bilan gratuit", "/contact"],
    contact: { address: "31 boulevard Carnot, 59800 Lille", phone: "03 20 41 77 08", email: "famille@cap-reussite.example", hours: "Lundi – samedi, 9 h – 19 h", tagline: "Retrouver confiance, une matière à la fois." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:split-left", { eyebrow: "Du CP à la terminale", title: "Chaque élève peut y arriver.", sub: "Des professeurs sélectionnés, un suivi hebdomadaire et un bilan trimestriel envoyé aux parents.", cta: ["Bilan pédagogique gratuit", "/contact"], cta2: ["Voir les matières", "/matieres"] }],
        ["feat:checks", { title: "Pourquoi nos familles nous choisissent", cta: ["Parler à un conseiller", "/contact"], items: [{ t: "Professeur unique et suivi par un coordinateur" }, { t: "Premier cours satisfait ou remplacé" }, { t: "Compte rendu après chaque séance" }, { t: "Stages pendant les vacances" }] }],
        ["feat:numbered", { eyebrow: "En trois temps", title: "Comment ça marche", items: [{ t: "Bilan gratuit", x: "Une heure pour cerner les difficultés et les objectifs." }, { t: "Le bon professeur", x: "Nous vous présentons un enseignant sous 72 heures." }, { t: "Progrès suivis", x: "Points réguliers et ajustements chaque mois." }] }],
        ["proof:stats", { title: "Des résultats encourageants (exemples)", items: [["+3,2", "points de moyenne en un trimestre"], ["92 %", "de familles qui renouvellent"], ["1 200", "élèves accompagnés"]] }],
        ["feat:accordion", { title: "Vos questions", items: [{ t: "À partir de quel niveau ?", x: "Dès le CP et jusqu'aux classes préparatoires." }, { t: "Et si mon enfant n'accroche pas ?", x: "Nous changeons de professeur gratuitement." }, { t: "Quel est le crédit d'impôt ?", x: "50 % des dépenses éligibles, dans les conditions fixées par la loi en vigueur (information donnée à titre d'exemple)." }] }],
        ["cta:band", { title: "Un bilan gratuit pour commencer.", cta: ["Je réserve", "/contact"] }],
      ] },
      { key: "matieres", name: "Matières", blocks: [
        ["misc:pagehead", { title: "Matières et niveaux", sub: "Du primaire au supérieur." }],
        ["feat:grid-icons", { items: [{ icon: "calculator", t: "Mathématiques", x: "Du calcul mental aux spécialités du lycée." }, { icon: "book", t: "Français", x: "Lecture, orthographe, dissertation et oral du bac." }, { icon: "globe", t: "Langues", x: "Anglais, espagnol et allemand." }, { icon: "sparkles", t: "Sciences", x: "Physique-chimie et SVT." }] }],
        ["gal:cards", { title: "Stages pendant les vacances", items: [{ t: "Révisions du brevet", tag: "3e", x: "Cinq matinées en petit groupe." }, { t: "Objectif bac", tag: "Terminale", x: "Méthode, grand oral et rattrapage." }, { t: "Rentrée en 6e", tag: "CM2", x: "Autonomie et organisation." }] }],
        ["cta:split", { title: "Une matière manque ?", sub: "Demandez-nous : nous recrutons à la demande.", cta: ["Nous contacter", "/contact"] }],
      ] },
      { key: "methodes", name: "Nos méthodes", blocks: [
        ["misc:pagehead", { title: "Une pédagogie qui redonne confiance" }],
        ["misc:story", { eyebrow: "Notre approche", title: "Comprendre avant de réciter", paras: ["Nos professeurs commencent par repérer la notion mal installée, puis reconstruisent par étapes avec des exercices de plus en plus autonomes.", "Les parents reçoivent un compte rendu écrit après chaque séance."], image: "portrait-1" }],
        ["proof:quotes", { items: [{ q: "Ma fille a repris goût aux maths en six semaines.", n: "Valérie D.", r: "Parent, cliente fictive" }, { q: "Les comptes rendus sont précis et utiles.", n: "Olivier C.", r: "Parent, client fictif" }, { q: "J'ai décroché mon bac avec mention.", n: "Yasmine K.", r: "Élève, cliente fictive" }] }],
        ["proof:team", { items: [{ n: "Maël Garnier", r: "Coordinateur pédagogique" }, { n: "Fatou Diagne", r: "Professeure de mathématiques" }, { n: "Louis Pichon", r: "Professeur de lettres" }] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs transparents" }],
        ["price:tiers", { items: [{ t: "Primaire", price: "28 €", period: "l'heure", f: ["Domicile ou visio", "Compte rendu écrit"], cta: "Réserver", url: "/contact" }, { t: "Collège et lycée", price: "34 €", period: "l'heure", f: ["Professeur spécialiste", "Bilan trimestriel", "Stages inclus à -10 %"], cta: "Réserver", url: "/contact", hl: true }, { t: "Supérieur", price: "42 €", period: "l'heure", f: ["Enseignant expert", "Préparation aux concours"], cta: "Réserver", url: "/contact" }] }],
        ["feat:compare", { title: "Domicile ou visio", rows: [["", "Domicile", "Visio"], ["Déplacement", "oui", "non"], ["Tableau partagé", "non", "oui"], ["Créneaux le soir", "oui", "oui"]] }],
        ["cta:card", { title: "Premier cours satisfait ou remplacé.", cta: ["Réserver le bilan", "/contact"] }],
      ] },
      contactPage("Une réponse dans la journée.", "Parlons de votre enfant", ["Bilan gratuit", "/contact"], "31 boulevard Carnot, 59800 Lille", "Indiquez la classe et la matière à renforcer."),
    ],
  },

  // 6. Université / MBA
  {
    key: "collegium-aurelien", name: "Collegium Aurélien", category: "education", tags: ["classique", "luxe", "editorial"], siteType: "Université et programmes MBA",
    description: "Grande école de gestion : bordeaux profond, ivoire et or, titres de presse en garamond, bandeau de journal et programmes détaillés.",
    brand: "Collegium Aurélien",
    tokens: { colors: { primary: "#6f1d2e", secondary: "#1e1417", accent: "#b8893b", background: "#faf6f0", surface: "#ffffff", text: "#241a1d", muted: "#665a5d" }, fonts: { heading: "font.eb-garamond", body: "font.work-sans", button: "font.work-sans", link: "font.work-sans" }, radius: { sm: 0, md: 2, lg: 4, button: 0, field: 0, card: 2 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 62, weight: 500, lineHeight: 1.05 }, h2: { size: 42, weight: 500 } }, border: { width: 1, color: "#e0d3c5" } },
    dna: { scale: "xl", pad: "airy", align: "left", shape: "sharp" }, art: { seed: "aurelien", motifs: ["arches", "plates", "skyline"] },
    head: ["head:masthead", { dateline: "Rentrée académique 2027 · Admissions ouvertes" }], foot: ["foot:columns", { about: "Collegium Aurélien (établissement fictif) : programmes MBA, masters spécialisés et formation continue.", cols: [["Programmes", "MBA Executive", "Master Finance", "Formation continue"], ["Collegium", "Admissions", "Recherche", "Contact"]] }],
    menu: [["Accueil", "/"], ["Programmes", "/programmes"], ["Admissions", "/admissions"], ["Corps professoral", "/professeurs"], ["Contact", "/contact"]], cta: ["Candidater", "/contact"],
    contact: { address: "1 place des Docteurs, 69007 Lyon", phone: "04 78 62 40 00", email: "admissions@collegium-aurelien.example", hours: "Du lundi au vendredi, 9 h – 18 h", tagline: "Penser large, décider juste." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:editorial", { kicker: "Admissions 2027", title: "Former des décideurs qui comptent.", sub: "MBA Executive, masters spécialisés et formation continue au cœur de Lyon, avec un corps professoral mêlant chercheurs et dirigeants.", cta: ["Candidater", "/contact"], cta2: ["Les programmes", "/programmes"] }],
        ["feat:strips", { eyebrow: "Programmes", title: "Quatre voies d'excellence", items: [{ t: "MBA Executive", x: "18 mois en rythme compatible avec une activité de direction." }, { t: "Master Finance de marché", x: "Deux ans, dont douze mois en alternance." }, { t: "Master Santé", x: "Gouvernance des établissements de santé et politiques publiques." }, { t: "Certificats courts", x: "Neuf jours pour maîtriser un sujet stratégique." }] }],
        ["proof:statsbar", { items: [["34", "nationalités sur le campus"], ["92 %", "d'insertion à 6 mois (exemple)"], ["120", "entreprises partenaires"]] }],
        ["gal:featured", { title: "La vie du campus", items: [{ t: "Amphithéâtre Aurélien", x: "400 places, rénové en 2025." }, { t: "Bibliothèque" }, { t: "Incubateur" }, { t: "Club de débat" }] }],
        ["proof:logos", { title: "Employeurs des diplômés (fictifs)", items: ["Banque Voltaire", "Groupe Alsatia", "Cabinet Orsini", "Santé Nord", "Maison Fabrega"] }],
        ["cta:split", { title: "Rencontrez-nous aux journées portes ouvertes.", sub: "Samedi 14 novembre, de 10 h à 17 h.", cta: ["S'inscrire", "/contact"] }],
      ] },
      { key: "programmes", name: "Programmes", blocks: [
        ["misc:pagehead", { title: "Programmes" }],
        ["feat:tabs", { title: "Nos cursus", items: [{ t: "MBA Executive", x: "Stratégie, finance, leadership et un projet d'entreprise suivi par un mentor. Un week-end par mois et deux semaines d'immersion." }, { t: "Master Finance", x: "Marchés, gestion de portefeuille, risque et réglementation, avec un stage de six mois." }, { t: "Master Santé", x: "Pilotage hospitalier, économie de la santé et conduite du changement." }] }],
        ["feat:compare", { title: "Comparer les formats", rows: [["", "MBA Executive", "Master Finance", "Certificat"], ["Durée", "18 mois", "24 mois", "9 jours"], ["Rythme", "Week-ends", "Alternance", "Intensif"], ["Public", "Cadres", "Étudiants", "Tous"]] }],
        ["cta:band", { title: "Besoin d'un programme sur mesure ?", cta: ["Contacter la direction", "/contact"] }],
      ] },
      { key: "admissions", name: "Admissions", blocks: [
        ["misc:pagehead", { title: "Admissions", sub: "Un processus en quatre temps." }],
        ["feat:steps", { items: [{ t: "Dossier", x: "CV, lettre de motivation, relevés.", d: "Janv." }, { t: "Test", x: "Logique et anglais.", d: "Fév." }, { t: "Entretien", x: "Devant un jury mixte.", d: "Mars" }, { t: "Décision", x: "Réponse sous 15 jours.", d: "Avril" }] }],
        ["price:tiers", { items: [{ t: "MBA Executive", price: "24 500 €", f: ["18 mois", "Immersion internationale", "Mentorat"], cta: "Candidater", url: "/contact" }, { t: "Master", price: "9 800 €", period: "par an", f: ["Alternance possible", "Bourses sur critères"], cta: "Candidater", url: "/contact", hl: true }, { t: "Certificat", price: "3 200 €", f: ["9 jours", "Éligible au financement entreprise"], cta: "Candidater", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Existe-t-il des bourses ?", x: "Des bourses d'excellence et de mérite sont décrites ici à titre d'exemple de démonstration." }, { t: "Puis-je candidater depuis l'étranger ?", x: "Oui, les entretiens se font en visioconférence." }] }],
      ] },
      { key: "professeurs", name: "Corps professoral", blocks: [
        ["misc:pagehead", { title: "Corps professoral" }],
        ["proof:team", { items: [{ n: "Pr Bénédicte Landry", r: "Directrice académique, finance" }, { n: "Pr Étienne Roussel", r: "Stratégie et gouvernance" }, { n: "Dr Nadia Hamdane", r: "Économie de la santé" }, { n: "Pr Gaspard Linares", r: "Leadership" }] }],
        ["misc:story", { eyebrow: "Recherche", title: "Une recherche au service des organisations", paras: ["Trois chaires financées par des mécènes d'entreprise étudient la gouvernance, la transition énergétique et les nouveaux modèles de santé.", "Les étudiants contribuent à des études de cas publiées avec leurs enseignants."], image: "portrait-2" }],
        ["misc:quote", { text: "Un dirigeant se forme à décider dans l'incertitude, pas à réciter des cas.", by: "Pr Étienne Roussel" }],
      ] },
      contactPage("Le service des admissions vous répond sous deux jours ouvrés.", "Échangeons sur votre parcours", ["Candidater", "/contact"], "1 place des Docteurs, 69007 Lyon", "Précisez le programme visé et votre situation professionnelle."),
    ],
  },

  // 7. Académie de cuisine
  {
    key: "atelier-mijote", name: "Atelier Mijoté", category: "education", tags: ["chaleureux", "naturel"], siteType: "Académie de cuisine",
    description: "Académie de cuisine gourmande : terracotta, vert olive et crème, grandes photos plein cadre, planning des ateliers et formules offertes.",
    brand: "L'Atelier Mijoté",
    tokens: { colors: { primary: "#b4492a", secondary: "#3a3a1c", accent: "#d9a441", background: "#fdf6ec", surface: "#fffaf2", text: "#2f2418", muted: "#6a5a47" }, fonts: { heading: "font.ibm-plex-serif", body: "font.figtree", button: "font.figtree", link: "font.figtree" }, radius: { sm: 6, md: 12, lg: 20, button: 999, field: 10, card: 18 }, shadow: { card: "md", button: "none" } },
    dna: { scale: "l", pad: "normal", align: "left", shape: "soft" }, art: { seed: "mijote", motifs: ["objects", "botanical", "plates"] },
    head: ["head:float", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Ateliers", "/ateliers"], ["Cursus pro", "/cursus"], ["Chefs", "/chefs"], ["Contact", "/contact"]], cta: ["Réserver un atelier", "/contact"],
    contact: { address: "9 rue des Halles, 13001 Marseille", phone: "04 91 20 55 18", email: "ateliers@mijote.example", hours: "Mardi – dimanche, 9 h – 21 h", tagline: "Cuisiner, goûter, partager." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Académie de cuisine à Marseille", title: "Mettez la main à la pâte.", sub: "Ateliers gourmands le soir et le week-end, cursus professionnels en six mois, stages enfants pendant les vacances.", cta: ["Réserver un atelier", "/contact"], cta2: ["Voir le planning", "/ateliers"] }],
        ["gal:wall", { title: "Dans nos casseroles ce mois-ci", items: [{ t: "Pâtes fraîches" }, { t: "Tarte tropézienne" }, { t: "Bouillabaisse revisitée" }, { t: "Pain au levain" }] }],
        ["feat:alt", { eyebrow: "Nos univers", title: "Trois façons d'apprendre", items: [{ t: "Ateliers du soir", x: "Deux heures et demie pour réaliser un menu et le déguster ensemble, à partir de 59 €.", link: ["Voir le planning", "/ateliers"] }, { t: "Cursus professionnel", x: "Un CAP de cuisine préparé en candidat libre, avec stages en restaurant.", link: ["Découvrir", "/cursus"] }, { t: "Stages enfants", x: "Les 8 – 14 ans cuisinent pendant les vacances scolaires." }] }],
        ["proof:big", { items: [{ q: "J'ai appris à faire un vrai feuilletage, et mes amis me demandent déjà la recette.", n: "Nathalie P.", r: "élève fictive" }] }],
        ["gal:coursecards", { title: "Prochaines sessions", items: [{ t: "Cuisine provençale", tag: "Tous niveaux", price: "65 €", x: "Ratatouille, rouille et panisses.", cta: "Réserver", url: "/contact" }, { t: "Pâtisserie fine", tag: "Intermédiaire", price: "79 €", x: "Éclairs et tartelettes.", cta: "Réserver", url: "/contact" }, { t: "Cuisine végétale", tag: "Débutant", price: "59 €", x: "Menu complet sans viande.", cta: "Réserver", url: "/contact" }] }],
        ["cta:image", { title: "Offrez un atelier.", sub: "Carte cadeau valable un an, sur le montant de votre choix.", cta: ["Offrir", "/contact"] }],
      ] },
      { key: "ateliers", name: "Ateliers", blocks: [
        ["misc:pagehead", { title: "Ateliers et planning", sub: "Dix places par atelier, tabliers fournis." }],
        ["misc:schedule", { title: "Cette semaine", items: [{ d: "Mar. 19 h", t: "Pâtes fraîches", x: "Tagliatelles, ravioles et sauce tomate." }, { d: "Jeu. 19 h", t: "Cuisine thaïe", x: "Curry vert et riz parfumé." }, { d: "Sam. 10 h", t: "Pain au levain", x: "Pétrissage et cuisson en cocotte." }, { d: "Dim. 15 h", t: "Atelier parent-enfant", x: "Cookies et muffins." }] }],
        ["feat:pricelist", { title: "Tarifs", items: [{ t: "Atelier du soir", price: "59 – 79 €", x: "2 h 30, dégustation incluse" }, { t: "Atelier parent-enfant", price: "45 €", x: "Un adulte et un enfant" }, { t: "Stage 3 jours", price: "190 €", x: "Techniques de base" }] }],
        ["cta:band", { title: "Les places partent vite.", cta: ["Réserver", "/contact"] }],
      ] },
      { key: "cursus", name: "Cursus pro", blocks: [
        ["misc:pagehead", { title: "Cursus professionnel" }],
        ["feat:steps", { eyebrow: "Six mois", title: "De débutant à commis", items: [{ t: "Bases", x: "Couteaux, cuissons, fonds.", d: "Mois 1–2" }, { t: "Cuisine", x: "Sauces, poissons, viandes.", d: "Mois 3–4" }, { t: "Pâtisserie", x: "Pâtes et crèmes.", d: "Mois 5" }, { t: "Stage", x: "Quatre semaines en restaurant.", d: "Mois 6" }] }],
        ["price:tiers", { items: [{ t: "Cursus complet", price: "5 900 €", period: "6 mois", f: ["320 heures", "Tenue offerte", "Stage encadré"], cta: "Candidater", url: "/contact", hl: true }, { t: "Spécialisation pâtisserie", price: "2 400 €", period: "8 semaines", f: ["140 heures", "Matériel prêté"], cta: "Candidater", url: "/contact" }] }],
        ["feat:list2", { title: "Débouchés", items: [{ t: "Commis de cuisine" }, { t: "Traiteur" }, { t: "Cuisinier en restauration collective" }, { t: "Création d'activité" }] }],
      ] },
      { key: "chefs", name: "Chefs", blocks: [
        ["misc:pagehead", { title: "Les chefs de l'atelier" }],
        ["proof:team", { items: [{ n: "Chef Marius Albertini", r: "Cuisine provençale" }, { n: "Chef Anaïs Dorval", r: "Pâtisserie" }, { n: "Chef Idriss Benali", r: "Cuisine du monde" }] }],
        ["misc:story", { eyebrow: "L'esprit de l'atelier", title: "Une cuisine qui se partage", paras: ["Nous travaillons avec des producteurs de la région : tomates de Provence, huile d'olive du Luberon, poissons de la criée.", "Chaque atelier se termine à table, autour du repas préparé."], image: "portrait-1" }],
        ["proof:quotes", { items: [{ q: "Ambiance conviviale et vrais gestes de pro.", n: "Marc L.", r: "Élève, client fictif" }, { q: "Un anniversaire inoubliable.", n: "Sarah B.", r: "Cliente fictive" }, { q: "Mon fils redemande des stages.", n: "Julie A.", r: "Maman, cliente fictive" }] }],
      ] },
      contactPage("Réservation par téléphone, ou écrivez-nous.", "Venez cuisiner", ["Réserver un atelier", "/contact"], "9 rue des Halles, 13001 Marseille", "Indiquez l'atelier souhaité et le nombre de convives."),
    ],
  },

  // 8. E-learning
  {
    key: "savoirly", name: "Savoirly", category: "education", tags: ["moderne", "minimaliste"], siteType: "Plateforme d'e-learning",
    description: "Plateforme d'e-learning claire et aérée : vert menthe et indigo, recherche de cours en première ligne, carrousel de formations et grille d'icônes.",
    brand: "Savoirly",
    tokens: { colors: { primary: "#4338ca", secondary: "#1e1b4b", accent: "#10b981", background: "#ffffff", surface: "#f3f4fb", text: "#1c1d33", muted: "#555770" }, fonts: { heading: "font.ibm-plex-sans", body: "font.public-sans", button: "font.public-sans", link: "font.public-sans" }, radius: { sm: 6, md: 10, lg: 14, button: 10, field: 8, card: 14 }, shadow: { card: "sm", button: "none" }, type: { h1: { size: 52, weight: 600, lineHeight: 1.1, letterSpacing: -0.02 } } },
    dna: { scale: "m", pad: "airy", align: "left", shape: "soft" }, art: { seed: "savoirly", motifs: ["blobs", "mesh", "tiles"] },
    modules: COURSES, head: ["head:minimal", {}], foot: ["foot:newsletter", { title: "Une idée d'apprentissage chaque lundi", sub: "Nouveaux cours, astuces de mémorisation et offres exclusives.", button: "S'abonner" }],
    menu: [["Accueil", "/"], ["Cours", "/cours"], ["Pour les équipes", "/equipes"], ["Tarifs", "/tarifs"], ["Contact", "/contact"]], cta: ["Essai gratuit", "/contact"],
    contact: { address: "Plateforme 100 % en ligne · siège : 40 rue du Faubourg, 59000 Lille", phone: "03 20 90 44 10", email: "support@savoirly.example", hours: "Support du lundi au vendredi, 8 h – 19 h", tagline: "Apprenez où vous voulez, quand vous voulez." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:search", { eyebrow: "E-learning pour tous", title: "Trouvez le cours qui vous fait avancer.", sub: "Plus de 300 cours en vidéo, des exercices corrigés et des parcours certifiants.", placeholder: "Rechercher un cours : Excel, photographie, SEO…", cta: ["Essai gratuit 14 jours", "/contact"] }],
        ["feat:grid-icons", { eyebrow: "Pourquoi Savoirly", title: "Apprendre devient simple", items: [{ icon: "play", t: "Vidéos courtes", x: "Des leçons de 6 à 12 minutes." }, { icon: "quiz", t: "Quiz instantanés", x: "Corrections détaillées." }, { icon: "monitor", t: "Tous écrans", x: "Ordinateur, tablette ou mobile." }, { icon: "trophy", t: "Certificats", x: "Preuve de réussite partageable." }] }],
        ["gal:carousel", { title: "Cours populaires", items: [{ t: "Photographie de A à Z", x: "8 heures · 42 leçons" }, { t: "Excel essentiel", x: "6 heures · 30 leçons" }, { t: "Rédiger pour le web", x: "5 heures · 26 leçons" }, { t: "Introduction à l'IA", x: "4 heures · 20 leçons" }, { t: "Gestion de projet", x: "7 heures · 34 leçons" }] }],
        ["proof:stats", { items: [["320", "cours en ligne"], ["58 000", "apprenants (exemple)"], ["4,7/5", "note moyenne (exemple)"]] }],
        ["feat:tabs", { title: "Des parcours pour chaque objectif", items: [{ t: "Carrière", x: "Bureautique, management, communication : montez en compétence sans quitter votre poste." }, { t: "Créativité", x: "Photo, dessin, vidéo et écriture pour explorer de nouvelles passions." }, { t: "Numérique", x: "Marketing digital, données et bases de la programmation." }] }],
        ["cta:band", { title: "14 jours pour tout essayer.", sub: "Sans carte bancaire, sans engagement.", cta: ["Commencer", "/contact"] }],
      ] },
      { key: "cours", name: "Cours", blocks: [
        ["misc:pagehead", { title: "Catalogue de cours", sub: "Sélection du catalogue Kolakisa." }],
        ["misc:courses", {}],
        ["misc:search", { title: "Rechercher une formation" }],
        ["feat:rows", { title: "Chaque cours comprend", items: [{ t: "Vidéos et supports", x: "Fiches à télécharger et transcriptions." }, { t: "Exercices corrigés", x: "Pour valider vos acquis." }, { t: "Forum d'entraide", x: "Les formateurs répondent sous 48 heures." }] }],
      ] },
      { key: "equipes", name: "Pour les équipes", blocks: [
        ["misc:pagehead", { title: "Savoirly pour les équipes" }],
        ["feat:bento", { items: [{ icon: "users", t: "Suivi des équipes", x: "Tableaux de bord par service." }, { icon: "layers", t: "Parcours sur mesure", x: "Assemblez cours internes et externes." }, { icon: "shield", t: "Données protégées", x: "Hébergement en France." }] }],
        ["proof:logos", { title: "Équipes accompagnées (fictives)", items: ["Aurore Logistique", "Brasserie Quillet", "Mutuelle Cèdre", "Atelier Verny"] }],
        ["cta:card", { title: "Un devis pour votre entreprise.", sub: "À partir de 10 licences.", cta: ["Demander une démo", "/contact"] }],
      ] },
      { key: "tarifs", name: "Tarifs", blocks: [
        ["misc:pagehead", { title: "Tarifs" }],
        ["price:tiers", { items: [{ t: "Découverte", price: "0 €", f: ["20 leçons gratuites", "Quiz limités"], cta: "Commencer", url: "/contact" }, { t: "Illimité", price: "19 €", period: "par mois", f: ["Tous les cours", "Certificats", "Support prioritaire"], cta: "Essayer", url: "/contact", hl: true }, { t: "Équipes", price: "12 €", period: "par licence", f: ["Dès 10 licences", "Tableaux de bord", "Parcours sur mesure"], cta: "Nous écrire", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions fréquentes", items: [{ t: "Puis-je résilier à tout moment ?", x: "Oui, en deux clics depuis votre espace." }, { t: "Les certificats sont-ils reconnus ?", x: "Ce sont des attestations de réussite de démonstration." }] }],
        ["cta:split", { title: "Moins de 3 minutes pour vous inscrire.", cta: ["Créer mon compte", "/contact"] }],
      ] },
      contactPage("Support à votre écoute, du lundi au vendredi.", "Une question ?", ["Essai gratuit", "/contact"], "40 rue du Faubourg, 59000 Lille", "Décrivez votre besoin, nous répondons en moins de 24 heures."),
    ],
  },

  // 9. Crèche / école maternelle
  {
    key: "petits-pas-creche", name: "Petits Pas", category: "education", tags: ["ludique", "chaleureux"], siteType: "Crèche et école maternelle",
    description: "Crèche accueillante : jaune beurre, vert tendre et bleu ciel, titres manuscrits, grandes illustrations et déroulé d'une journée rassurant pour les parents.",
    brand: "Crèche Les Petits Pas",
    tokens: { colors: { primary: "#2f8f6b", secondary: "#2a5a7a", accent: "#f4b942", background: "#fffcf2", surface: "#ffffff", text: "#27332e", muted: "#58665f" }, fonts: { heading: "font.caveat", body: "font.quicksand", button: "font.quicksand", link: "font.quicksand" }, radius: { sm: 12, md: 20, lg: 28, button: 999, field: 16, card: 26 }, shadow: { card: "md", button: "sm" }, type: { h1: { size: 66, weight: 700, lineHeight: 1.0 }, h2: { size: 46, weight: 700 }, body: { size: 18 } } },
    dna: { scale: "l", pad: "airy", align: "center", shape: "pill" }, art: { seed: "petitspas", motifs: ["blobs", "bokeh", "objects"] },
    head: ["head:side", {}], foot: ["foot:center", {}],
    menu: [["Accueil", "/"], ["Notre projet", "/projet"], ["Une journée", "/journee"], ["Inscriptions", "/inscriptions"], ["Contact", "/contact"]], cta: ["Visiter la crèche", "/contact"],
    contact: { address: "4 allée des Tilleuls, 35000 Rennes", phone: "02 99 14 62 80", email: "direction@petitspas.example", hours: "Lundi – vendredi, 7 h 30 – 18 h 30", tagline: "Grandir en confiance, un petit pas après l'autre." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:stacked", { eyebrow: "Crèche et école maternelle bilingue", title: "Un nid pour grandir tout en douceur.", sub: "Accueil des enfants de 3 mois à 6 ans par une équipe de professionnelles de la petite enfance, dans un jardin ombragé.", cta: ["Visiter la crèche", "/contact"], cta2: ["Notre projet", "/projet"], stats: [["3 mois – 6 ans", "tranche d'âge"], ["1 pour 5", "adultes par enfant"], ["12 ans", "d'expérience"]] }],
        ["feat:cards", { title: "Ce que nous offrons", items: [{ icon: "heart", t: "Un lien sécurisant", x: "Une référente par enfant, de l'adaptation jusqu'au départ." }, { icon: "palette", t: "Éveil créatif", x: "Peinture, musique et motricité chaque jour." }, { icon: "sun", t: "Dehors tous les jours", x: "Jardin, potager et balades dans le quartier." }] }],
        ["misc:hours", { title: "Horaires d'accueil", rows: [["Accueil du matin", "7 h 30 – 9 h 30"], ["Repas", "11 h 30"], ["Sieste", "12 h 30 – 15 h"], ["Départs", "16 h 30 – 18 h 30"]] }],
        ["proof:quotes", { title: "Mots de parents", items: [{ q: "Notre fils court vers la porte chaque matin.", n: "Aurélie C.", r: "Maman, cliente fictive" }, { q: "Des repas bio et des équipes à l'écoute.", n: "Julien M.", r: "Papa, client fictif" }, { q: "Un vrai suivi, avec photos et carnet de liaison.", n: "Priya S.", r: "Maman, cliente fictive" }] }],
        ["feat:steps", { title: "Votre première visite", items: [{ t: "Visite", x: "Découverte des lieux avec la directrice.", d: "1" }, { t: "Dossier", x: "Pièces et projet d'accueil.", d: "2" }, { t: "Adaptation", x: "Une semaine de découverte progressive.", d: "3" }] }],
        ["cta:card", { title: "Venez visiter notre jardin.", sub: "Visites sur rendez-vous, chaque mardi et jeudi.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      { key: "projet", name: "Notre projet", blocks: [
        ["misc:pagehead", { title: "Notre projet pédagogique" }],
        ["misc:story", { eyebrow: "Notre philosophie", title: "Laisser l'enfant explorer", paras: ["Nous croyons que les enfants apprennent par le jeu, le mouvement et la relation. Les salles sont aménagées pour qu'ils choisissent leurs activités.", "Les adultes observent, soutiennent et accompagnent plutôt qu'ils ne dirigent."], image: "portrait-2" }],
        ["feat:icons", { items: [{ icon: "users", t: "Équipe qualifiée", x: "Auxiliaires de puériculture, éducatrices et psychomotricienne." }, { icon: "globe", t: "Éveil à l'anglais", x: "Comptines et jeux dès 2 ans." }, { icon: "sparkles", t: "Repas équilibrés", x: "Cuisinés sur place avec des produits locaux." }] }],
        ["proof:team", { title: "L'équipe", items: [{ n: "Camille Dufresne", r: "Directrice, éducatrice" }, { n: "Awa Konaté", r: "Auxiliaire de puériculture" }, { n: "Léna Moreau", r: "Éducatrice, éveil musical" }] }],
      ] },
      { key: "journee", name: "Une journée", blocks: [
        ["misc:pagehead", { title: "Une journée aux Petits Pas" }],
        ["misc:schedule", { items: [{ d: "7 h 30", t: "Accueil", x: "Jeux calmes et câlins pour une séparation douce." }, { d: "9 h 30", t: "Ateliers", x: "Peinture, motricité ou histoires." }, { d: "11 h 30", t: "Repas", x: "Menu du jour affiché à l'entrée." }, { d: "12 h 30", t: "Sieste", x: "Dans la salle de repos, à chacun son rythme." }, { d: "16 h", t: "Goûter et jardin", x: "Retrouvailles et jeux dehors." }] }],
        ["gal:wall", { title: "Nos salles", items: [{ t: "Salle des câlins" }, { t: "Atelier d'art" }, { t: "Jardin" }, { t: "Cuisine" }] }],
        ["cta:band", { title: "Une place se libère ?", cta: ["Nous écrire", "/contact"] }],
      ] },
      { key: "inscriptions", name: "Inscriptions", blocks: [
        ["misc:pagehead", { title: "Inscriptions et tarifs" }],
        ["price:tiers", { items: [{ t: "Temps partiel", price: "dès 3,10 €", period: "l'heure", x: "Selon vos revenus.", f: ["2 à 3 jours", "Repas inclus"], cta: "Se renseigner", url: "/contact" }, { t: "Temps plein", price: "dès 2,70 €", period: "l'heure", x: "Tarif dégressif.", f: ["5 jours", "Repas et goûter", "Couches fournies"], cta: "Se renseigner", url: "/contact", hl: true }, { t: "École maternelle", price: "190 €", period: "par mois", f: ["Dès 3 ans", "Anglais inclus"], cta: "Se renseigner", url: "/contact" }] }],
        ["feat:accordion", { title: "Questions de parents", items: [{ t: "Quand déposer le dossier ?", x: "Dès le sixième mois de grossesse pour une entrée en septembre." }, { t: "Acceptez-vous les enfants allergiques ?", x: "Oui, avec un protocole d'accueil individualisé." }] }],
        ["cta:card", { title: "Un doute ? Venez nous voir.", cta: ["Prendre rendez-vous", "/contact"] }],
      ] },
      contactPage("La directrice vous rappelle dans la journée.", "Faisons connaissance", ["Visiter la crèche", "/contact"], "4 allée des Tilleuls, 35000 Rennes", "Indiquez l'âge de votre enfant et la date d'entrée souhaitée."),
    ],
  },

  // 10. Centre de formation aux métiers du numérique
  {
    key: "numeris-campus", name: "Numeris Campus", category: "education", tags: ["geometrique", "moderne"], siteType: "Centre de formation aux métiers du numérique",
    description: "Campus du numérique graphique : turquoise vif et noir d'encre, grosses sections géométriques, parcours en alternance et chiffres d'insertion.",
    brand: "Numeris Campus",
    tokens: { colors: { primary: "#007c8c", secondary: "#071f2b", accent: "#ff7a45", background: "#f4f8f9", surface: "#ffffff", text: "#0b1c24", muted: "#4b616b" }, fonts: { heading: "font.archivo", body: "font.space-grotesk", button: "font.archivo", link: "font.space-grotesk" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, type: { h1: { size: 60, weight: 800, lineHeight: 1.0, letterSpacing: -0.03 }, h2: { size: 40, weight: 800, letterSpacing: -0.02 } }, border: { width: 2, color: "#071f2b" } },
    dna: { scale: "xl", pad: "normal", align: "left", shape: "sharp" }, art: { seed: "numeris", motifs: ["tiles", "plates", "halftone"] },
    head: ["head:bar", {}], foot: ["foot:line", {}],
    menu: [["Accueil", "/"], ["Métiers", "/metiers"], ["Alternance", "/alternance"], ["Vie de campus", "/campus"], ["Contact", "/contact"]], cta: ["Rejoindre le campus", "/contact"],
    contact: { address: "27 avenue de la Gare, 31000 Toulouse", phone: "05 61 77 21 90", email: "inscription@numeris-campus.example", hours: "Du lundi au vendredi, 8 h 30 – 18 h", tagline: "Les métiers du numérique s'apprennent en faisant." },
    pages: [
      { key: "accueil", name: "Accueil", blocks: [
        ["hero:bleed", { eyebrow: "Titres professionnels niveau 5 à 7", title: "Apprenez un métier du numérique, en alternance.", sub: "Développement, cybersécurité, data et design d'interface : des formations de 12 à 24 mois co-construites avec les entreprises.", cta: ["Rejoindre le campus", "/contact"], cta2: ["Les métiers", "/metiers"] }],
        ["feat:rows", { eyebrow: "Quatre filières", title: "Choisissez votre spécialité", items: [{ t: "Développement d'applications", x: "Du web au mobile, avec méthodes agiles." }, { t: "Cybersécurité", x: "Sécuriser les réseaux et répondre aux incidents." }, { t: "Data et IA", x: "Collecte, modélisation et visualisation." }, { t: "Design d'interface", x: "Recherche utilisateur, prototypes et design system." }] }],
        ["proof:statsbar", { items: [["93 %", "d'insertion (exemple)"], ["70", "entreprises partenaires"], ["18", "mois en moyenne"]] }],
        ["gal:coursecards", { title: "Formations ouvertes", items: [{ t: "Développeur web et mobile", tag: "Niveau 5", price: "Financée", x: "24 mois en alternance.", cta: "Détails", url: "/metiers" }, { t: "Technicien cybersécurité", tag: "Niveau 5", price: "Financée", x: "12 mois.", cta: "Détails", url: "/metiers" }, { t: "Concepteur UX/UI", tag: "Niveau 6", price: "Financée", x: "18 mois.", cta: "Détails", url: "/metiers" }] }],
        ["proof:logos", { title: "Entreprises d'accueil (fictives)", items: ["Octavia Cloud", "Mairie-Lab", "Radar Systèmes", "Cobalt Retail", "Vélodata"] }],
        ["feat:accordion", { title: "Avant de candidater", items: [{ t: "Faut-il un bac ?", x: "Selon le titre : de bac à bac+3. Un entretien évalue aussi la motivation." }, { t: "Qui finance ?", x: "L'entreprise d'accueil via un contrat d'alternance (exemple pédagogique)." }] }],
        ["cta:image", { title: "Rentrée en octobre.", sub: "Dernières places en cybersécurité.", cta: ["Candidater", "/contact"] }],
      ] },
      { key: "metiers", name: "Métiers", blocks: [
        ["misc:pagehead", { title: "Les métiers du numérique" }],
        ["feat:tabs", { items: [{ t: "Développement", x: "Front-end, back-end, mobile. Projets en équipe et portfolio public." }, { t: "Cybersécurité", x: "Audit, supervision, réponse aux incidents, laboratoire d'attaque et défense." }, { t: "Data et IA", x: "Python, SQL, apprentissage automatique et éthique des données." }, { t: "UX/UI", x: "Ateliers de conception, tests utilisateurs, prototypes interactifs." }] }],
        ["misc:courses", {}],
        ["cta:split", { title: "Quel métier vous convient ?", sub: "Passez le test d'orientation de 10 minutes.", cta: ["Passer le test", "/contact"] }],
      ] },
      { key: "alternance", name: "Alternance", blocks: [
        ["misc:pagehead", { title: "L'alternance en pratique" }],
        ["feat:numbered", { items: [{ t: "On vous met en relation", x: "Nous présentons votre profil à nos entreprises partenaires." }, { t: "Deux semaines à l'école, trois en entreprise", x: "Rythme régulier et suivi par un tuteur." }, { t: "Un salaire dès le premier mois", x: "Variable selon l'âge et le niveau (exemple)." }] }],
        ["feat:compare", { title: "Alternance ou formation classique ?", rows: [["", "Alternance", "Formation classique"], ["Coût de la formation", "0 €", "Variable"], ["Rémunération", "oui", "non"], ["Expérience en poste", "oui", "stage"]] }],
        ["proof:quotes", { items: [{ q: "Mon entreprise m'a embauché à la fin du contrat.", n: "Mehdi A.", r: "Ancien, client fictif" }, { q: "J'ai changé de voie à 31 ans, sans regret.", n: "Laure H.", r: "Ancienne, cliente fictive" }, { q: "Les projets m'ont donné un vrai portfolio.", n: "Eliott N.", r: "Ancien, client fictif" }] }],
      ] },
      { key: "campus", name: "Vie de campus", blocks: [
        ["misc:pagehead", { title: "Vie de campus" }],
        ["gal:grid", { items: [{ t: "Fablab" }, { t: "Salle de cybersécurité" }, { t: "Espace de coworking" }, { t: "Cafétéria" }, { t: "Hackathon" }, { t: "Studio vidéo" }] }],
        ["proof:team", { title: "L'équipe pédagogique", items: [{ n: "Judith Pelletier", r: "Directrice du campus" }, { n: "Ravi Menon", r: "Responsable cybersécurité" }, { n: "Clémence Aubry", r: "Responsable UX/UI" }, { n: "Théo Gilbert", r: "Responsable développement" }] }],
        ["cta:band", { title: "Venez au prochain hackathon.", cta: ["S'inscrire", "/contact"] }],
      ] },
      contactPage("Un conseiller vous accompagne dans votre candidature.", "Rejoignez le campus", ["Rejoindre le campus", "/contact"], "27 avenue de la Gare, 31000 Toulouse", "Précisez la filière et votre niveau d'études."),
    ],
  },
];
