// Civitas — mairie et collectivité locale. Direction artistique : service public clair et exemplaire sur l'accessibilité. Fond blanc, indigo grisé, bleu-vert et rouge discret ;
// Schibsted Grotesk + Andika (très lisible), blason et silhouettes de bâtiments dessinés, bandeau d'accessibilité mémorisé (taille, contraste, police lisible, animations),
// accès rapides en grosses tuiles, catalogue de démarches par colonnes avec fiche et liste de contrôle cochable, actualités filtrables et agenda local.
const { sec, esc } = require("../kit");

/* ---------- données de démonstration (commune fictive) ---------- */
const THEMES = [
  ["etat-civil", "État civil", "Naissance, mariage, papiers d'identité", "id"],
  ["urbanisme", "Urbanisme", "Travaux, permis, certificats", "house"],
  ["ecoles", "Écoles et enfance", "Inscriptions, cantine, périscolaire", "school"],
  ["dechets", "Déchets et propreté", "Collectes, encombrants, déchèterie", "bin"],
  ["voirie", "Voirie et stationnement", "Signalements, macaron, chantiers", "road"],
  ["solidarite", "Solidarité", "Aides, seniors, handicap", "heart"],
  ["elections", "Élections et citoyenneté", "Listes, procurations, recensement", "vote"],
  ["culture", "Culture et sport", "Médiathèque, salles, associations", "book"],
];
// [id, thème, titre, résumé, pièces, délai, coût, lieu, étapes]
const SVC = [
  ["carte-identite", "etat-civil", "Carte nationale d'identité", "Première demande ou renouvellement pour un adulte ou un enfant.", ["Photo d'identité de moins de 6 mois", "Justificatif de domicile de moins de 6 mois", "Ancienne carte, ou déclaration de perte ou de vol", "Acte de naissance de moins de 3 mois si la mairie le demande"], "3 à 5 semaines", "Gratuit (25 € de timbre en cas de perte)", "Mairie annexe, sur rendez-vous", ["Remplir la pré-demande en ligne", "Prendre rendez-vous au guichet", "Venir retirer la carte avec le récépissé"]],
  ["passeport", "etat-civil", "Passeport", "Demande ou renouvellement d'un passeport biométrique.", ["Photo d'identité de moins de 6 mois", "Justificatif de domicile de moins de 6 mois", "Carte d'identité ou ancien passeport", "Timbre fiscal du montant indiqué"], "4 à 6 semaines", "Timbre fiscal, 86 € pour un adulte", "Mairie annexe, sur rendez-vous", ["Remplir la pré-demande en ligne", "Acheter le timbre fiscal", "Déposer le dossier au guichet"]],
  ["acte-naissance", "etat-civil", "Acte de naissance", "Copie intégrale ou extrait d'acte, pour vous ou un proche.", ["Pièce d'identité du demandeur", "Nom, prénoms, date et lieu de naissance de la personne", "Prénoms et noms des parents"], "Sous 5 jours ouvrés", "Gratuit", "En ligne, par courrier ou au guichet", ["Indiquer l'identité de la personne concernée", "Préciser copie intégrale ou extrait", "Recevoir l'acte par courrier ou par courriel"]],
  ["mariage-pacs", "etat-civil", "Mariage et PACS", "Préparer un mariage civil ou enregistrer un PACS en mairie.", ["Pièces d'identité des deux futurs époux ou partenaires", "Justificatifs de domicile", "Actes de naissance de moins de 3 mois", "Liste des témoins avec leurs pièces d'identité"], "Dossier à déposer 2 mois avant la date", "Gratuit", "Hôtel de ville, service de l'état civil", ["Retirer ou télécharger le dossier", "Déposer le dossier complet", "Fixer la date de la cérémonie"]],
  ["declaration-travaux", "urbanisme", "Déclaration préalable de travaux", "Clôture, ravalement, extension limitée, abri de jardin.", ["Formulaire de déclaration complété", "Plan de situation du terrain", "Plan de masse des constructions", "Photographie de l'existant"], "1 mois d'instruction", "Gratuit", "Service urbanisme, Hôtel de ville", ["Rassembler plans et photographies", "Déposer le dossier en 2 exemplaires", "Attendre la décision et l'afficher sur le terrain"]],
  ["permis-construire", "urbanisme", "Permis de construire", "Maison neuve, extension importante ou changement de destination.", ["Formulaire de demande de permis", "Plan de situation et plan de masse", "Plans des façades et des coupes", "Notice descriptive du projet"], "2 à 3 mois d'instruction", "Gratuit (taxes d'aménagement ensuite)", "Service urbanisme, Hôtel de ville", ["Faire établir les plans", "Déposer le dossier complet", "Afficher l'autorisation une fois obtenue"]],
  ["certificat-urbanisme", "urbanisme", "Certificat d'urbanisme", "Connaître les règles qui s'appliquent à un terrain avant un achat.", ["Formulaire de demande", "Plan de situation du terrain", "Note descriptive du projet envisagé"], "1 à 2 mois", "Gratuit", "Service urbanisme, Hôtel de ville", ["Compléter le formulaire", "Joindre le plan du terrain", "Recevoir le certificat par courrier"]],
  ["inscription-scolaire", "ecoles", "Inscription à l'école", "Première inscription en maternelle ou en élémentaire, ou changement d'école.", ["Livret de famille ou acte de naissance", "Justificatif de domicile de moins de 3 mois", "Carnet de santé avec les vaccinations", "Certificat de radiation en cas de changement d'école"], "Réponse sous 15 jours", "Gratuit", "Service enfance, Hôtel de ville", ["Réunir les pièces", "Faire la demande auprès du service enfance", "Se présenter à l'école avec le certificat"]],
  ["cantine-periscolaire", "ecoles", "Cantine et accueil périscolaire", "Repas du midi, garderie du matin et du soir, mercredis.", ["Justificatif de domicile", "Dernier avis d'imposition pour le quotient familial", "Attestation d'assurance de l'enfant", "Fiche sanitaire complétée"], "10 jours", "De 0,90 € à 4,60 € le repas selon le quotient", "Service enfance, Hôtel de ville", ["Calculer le quotient familial", "Compléter la fiche sanitaire", "Choisir les jours de présence"]],
  ["encombrants", "dechets", "Enlèvement des encombrants", "Meubles, matelas, gros appareils : ramassage à domicile.", ["Liste des objets à enlever", "Adresse et créneau souhaité"], "Passage sous 3 semaines", "Gratuit, 2 passages par an", "Service propreté, par téléphone ou en ligne", ["Lister les objets", "Choisir une date de passage", "Sortir les objets la veille au soir"]],
  ["carte-decheterie", "dechets", "Carte de déchèterie", "Accès gratuit pour les habitants, avec dépôt de gravats et de déchets verts.", ["Pièce d'identité", "Justificatif de domicile de moins de 3 mois", "Numéro d'immatriculation du véhicule"], "8 jours", "Gratuit", "Service propreté, Hôtel de ville", ["Déposer la demande", "Recevoir la carte par courrier", "La présenter à l'entrée de la déchèterie"]],
  ["signalement-voirie", "voirie", "Signaler un problème sur la voie publique", "Nid-de-poule, éclairage en panne, dépôt sauvage, mobilier abîmé.", ["Adresse ou repère précis du problème", "Photographie si possible"], "Prise en charge sous 48 heures", "Gratuit", "En ligne ou par téléphone", ["Décrire le problème et son lieu", "Joindre une photographie", "Suivre la prise en charge par courriel"]],
  ["macaron-stationnement", "voirie", "Macaron de stationnement résidentiel", "Stationner dans votre quartier avec un tarif résident.", ["Carte grise au nom du demandeur", "Justificatif de domicile de moins de 3 mois", "Pièce d'identité"], "10 jours", "30 € par an", "Police municipale, Hôtel de ville", ["Réunir les trois pièces", "Déposer la demande", "Placer le macaron derrière le pare-brise"]],
  ["aide-seniors", "solidarite", "Aide aux seniors et portage de repas", "Repas à domicile, aide aux démarches, visites de courtoisie.", ["Pièce d'identité", "Dernier avis d'imposition", "Justificatif de domicile", "Attestation d'assurance habitation"], "3 semaines", "Selon les ressources du foyer", "Centre communal d'action sociale", ["Prendre rendez-vous avec le CCAS", "Constituer le dossier", "Définir ensemble les aides utiles"]],
  ["inscription-listes", "elections", "Inscription sur les listes électorales", "Voter dans la commune : à faire dès l'emménagement ou à 18 ans.", ["Pièce d'identité en cours de validité", "Justificatif de domicile de moins de 3 mois"], "Prise en compte pour le prochain scrutin", "Gratuit", "En ligne ou au service élections", ["Rassembler les deux pièces", "Faire la demande", "Recevoir la carte électorale"]],
  ["procuration", "elections", "Procuration de vote", "Faire voter une personne de confiance à votre place.", ["Pièce d'identité du mandant", "Nom, date de naissance et commune de vote du mandataire"], "Immédiat si la demande est faite à temps", "Gratuit", "En ligne, puis validation à la gendarmerie", ["Choisir la personne de confiance", "Faire la demande en ligne", "Faire valider l'identité"]],
  ["recensement-citoyen", "elections", "Recensement citoyen à 16 ans", "Obligatoire pour les jeunes, il ouvre l'accès à de nombreux examens.", ["Pièce d'identité du jeune", "Livret de famille", "Justificatif de domicile"], "Attestation remise immédiatement", "Gratuit", "Hôtel de ville, accueil", ["Venir dans le trimestre des 16 ans", "Présenter les pièces", "Conserver l'attestation"]],
  ["reservation-salle", "culture", "Réserver une salle municipale", "Salles des fêtes, salles associatives et gymnases, pour les habitants et les associations.", ["Pièce d'identité ou statuts de l'association", "Attestation d'assurance responsabilité civile", "Dates et horaires souhaités"], "15 jours", "Tarif horaire selon la salle", "Service vie associative, Hôtel de ville", ["Vérifier les disponibilités", "Déposer la demande", "Signer la convention d'occupation"]],
  ["carte-mediatheque", "culture", "Carte de médiathèque", "Prêt de livres, de musique, de films et accès aux ateliers.", ["Pièce d'identité", "Justificatif de domicile"], "Immédiat", "Gratuit pour les moins de 18 ans, 12 € par an ensuite", "Médiathèque municipale", ["Se présenter à l'accueil", "Remplir la fiche d'inscription", "Emprunter dès le jour même"]],
];
const THEME_BY = Object.fromEntries(THEMES.map((t) => [t[0], t]));
const SHORT = { "carte-identite": "Gratuit", passeport: "86 €", "acte-naissance": "Gratuit", "mariage-pacs": "Gratuit", "declaration-travaux": "Gratuit", "permis-construire": "Gratuit", "certificat-urbanisme": "Gratuit", "inscription-scolaire": "Gratuit", "cantine-periscolaire": "Selon quotient", encombrants: "Gratuit", "carte-decheterie": "Gratuit", "signalement-voirie": "Gratuit", "macaron-stationnement": "30 € par an", "aide-seniors": "Selon ressources", "inscription-listes": "Gratuit", procuration: "Gratuit", "recensement-citoyen": "Gratuit", "reservation-salle": "Selon la salle", "carte-mediatheque": "12 € par an" };
const SHORTD = { "carte-identite": "3 à 5 semaines", passeport: "4 à 6 semaines", "acte-naissance": "5 jours", "mariage-pacs": "2 mois avant", "declaration-travaux": "1 mois", "permis-construire": "2 à 3 mois", "certificat-urbanisme": "1 à 2 mois", "inscription-scolaire": "15 jours", "cantine-periscolaire": "10 jours", encombrants: "3 semaines", "carte-decheterie": "8 jours", "signalement-voirie": "48 heures", "macaron-stationnement": "10 jours", "aide-seniors": "3 semaines", "inscription-listes": "Immédiat", procuration: "Immédiat", "recensement-citoyen": "Immédiat", "reservation-salle": "15 jours", "carte-mediatheque": "Immédiat" };

const NEWS = [
  ["2026-11-03", "Travaux", "Rue des Tilleuls : circulation alternée jusqu'au 20 décembre", "Le réseau d'eau est renouvelé sur 400 mètres. Les accès aux commerces et aux écoles sont maintenus, avec un cheminement piéton sécurisé.", "road"],
  ["2026-10-30", "Culture", "La médiathèque prolonge ses horaires le samedi", "Dès novembre, la médiathèque ouvre de 10 h à 18 h sans interruption. Les ateliers numériques restent gratuits.", "book"],
  ["2026-10-27", "Environnement", "Nouveaux bacs de tri : la distribution commence", "Chaque foyer reçoit un bac à couvercle jaune et un guide du tri. Les rues sont servies par quartier, selon un calendrier affiché en mairie.", "bin"],
  ["2026-10-22", "Solidarité", "Plan grand froid : le CCAS recense les personnes isolées", "Les habitants fragiles peuvent se faire connaître afin d'être appelés en cas d'alerte météo. L'inscription est gratuite et confidentielle.", "heart"],
  ["2026-10-18", "Vie locale", "Le budget participatif ouvre le dépôt des idées", "Une enveloppe de 150 000 € sera consacrée aux projets choisis par les habitants. Les idées se déposent jusqu'à la fin du mois de janvier.", "vote"],
  ["2026-10-15", "Écoles", "Inscriptions scolaires : la campagne 2027 est ouverte", "Les familles dont l'enfant entre en petite section ou au CP peuvent inscrire leur enfant dès maintenant auprès du service enfance.", "school"],
  ["2026-10-09", "Vie locale", "Compte rendu du conseil municipal d'octobre", "Les principales décisions : tarifs de la cantine, convention avec la médiathèque, avenant au contrat de collecte des déchets.", "id"],
  ["2026-10-02", "Travaux", "Le gymnase Jean-Zay rouvre après rénovation", "Isolation, nouveaux vestiaires accessibles et sol sportif : le gymnase retrouve ses utilisateurs lundi 9 novembre.", "house"],
];
const NEWS_CATS = ["Travaux", "Culture", "Environnement", "Solidarité", "Vie locale", "Écoles"];

const EVENTS = [
  ["2026-11-12", "18:30", "Conseil municipal", "Hôtel de ville, salle du conseil", "Conseil", "Séance publique : ordre du jour affiché une semaine avant.", ["pmr", "boucle"]],
  ["2026-11-14", "10:00", "Atelier numérique : faire ses démarches en ligne", "Médiathèque", "Citoyenneté", "Un animateur accompagne chacun pas à pas, sur ordinateur ou téléphone.", ["pmr"]],
  ["2026-11-21", "20:30", "Concert de l'orchestre d'harmonie", "Salle des fêtes", "Culture", "Programme d'automne : musiques de film et pièces classiques.", ["pmr", "boucle"]],
  ["2026-11-28", "09:00", "Collecte solidaire de la banque alimentaire", "Place du marché", "Solidarité", "Les denrées non périssables sont reçues toute la matinée.", ["pmr"]],
  ["2026-12-03", "14:00", "Permanence urbanisme sur rendez-vous", "Mairie annexe", "Citoyenneté", "Un instructeur répond aux questions sur les projets de travaux.", ["pmr", "lsf"]],
  ["2026-12-06", "15:00", "Spectacle jeune public : le petit théâtre d'ombres", "Théâtre municipal", "Famille", "À partir de 4 ans, durée 45 minutes.", ["pmr", "boucle"]],
  ["2026-12-10", "18:30", "Conseil municipal : débat d'orientation budgétaire", "Hôtel de ville, salle du conseil", "Conseil", "Présentation des grandes lignes du budget 2027.", ["pmr", "boucle", "lsf"]],
  ["2026-12-13", "08:30", "Foulées de la solidarité", "Parc des Rives", "Sport", "Courses de 5 et 10 km et marche ouverte à tous.", ["pmr"]],
  ["2026-12-19", "17:00", "Marché de Noël et illuminations", "Place de la République", "Famille", "Artisans locaux, chorale des écoles et lancement des illuminations.", ["pmr"]],
  ["2027-01-09", "11:00", "Vœux du maire aux habitants", "Salle des fêtes", "Citoyenneté", "Moment d'échange suivi d'un buffet.", ["pmr", "boucle", "lsf"]],
  ["2027-01-16", "10:00", "Tournoi de badminton intercommunal", "Gymnase Jean-Zay", "Sport", "Matchs en simple et en double, tous niveaux.", ["pmr"]],
  ["2027-01-22", "18:30", "Réunion publique : budget participatif", "Salle des fêtes", "Citoyenneté", "Présentation du règlement et des modalités de vote.", ["pmr", "boucle"]],
  ["2027-01-28", "18:30", "Conseil municipal", "Hôtel de ville, salle du conseil", "Conseil", "Séance publique : vote du budget primitif.", ["pmr", "boucle", "lsf"]],
  ["2027-01-30", "14:30", "Après-midi jeux de société", "Médiathèque", "Famille", "Pour toute la famille, jeux prêtés sur place.", ["pmr"]],
];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const dparts = (iso) => { const [y, m, d] = iso.split("-").map(Number); const dt = new Date(Date.UTC(y, m - 1, d)); return { y, m, d, wd: DAYS[dt.getUTCDay()] }; };
const longDate = (iso) => { const p = dparts(iso); return `${p.d === 1 ? "1er" : p.d} ${MONTHS[p.m - 1]} ${p.y}`; };
const ACCESS = { pmr: "Accessible aux personnes à mobilité réduite", boucle: "Boucle magnétique", lsf: "Interprète en langue des signes (LSF)" };

const HOURS = [[1, "Lundi", "8:30-12:00,13:30-17:30"], [2, "Mardi", "8:30-12:00,13:30-19:00"], [3, "Mercredi", "8:30-12:00,13:30-17:30"], [4, "Jeudi", "8:30-12:00,13:30-17:30"], [5, "Vendredi", "8:30-12:00,13:30-16:30"], [6, "Samedi", "9:00-12:00"]];
const hoursAttr = HOURS.map(([d, , h]) => `${d}=${h}`).join(";");
const fmtH = (s) => s.split(",").map((r) => r.split("-").map((t) => t.replace(":00", "").replace(":", " h ").replace(/^(\d+)$/, "$1 h")).join(" – ")).join(" · ");

/* ---------- illustrations (SVG en ligne, sans identifiants) ---------- */
const PICTO = {
  id: `<rect x="5" y="10" width="38" height="28" rx="3"/><circle class="k" cx="17" cy="21" r="5"/><path class="k" d="M9 33c1-5 4-7 8-7s7 2 8 7z"/><path class="ks" d="M28 18h10M28 24h10M28 30h7"/>`,
  house: `<path d="M3 24 24 6l21 18z"/><rect x="9" y="22" width="30" height="21"/><rect class="k" x="20" y="29" width="8" height="14"/><rect class="k" x="12" y="26" width="6" height="6"/><rect class="k" x="30" y="26" width="6" height="6"/>`,
  school: `<path d="M3 20 24 9l21 11z"/><rect x="7" y="20" width="34" height="23"/><rect class="k" x="20" y="29" width="8" height="14"/><circle class="k" cx="24" cy="16" r="2.4"/><rect class="k" x="10" y="26" width="6" height="7"/><rect class="k" x="32" y="26" width="6" height="7"/><path d="M24 9V3h8v4h-8"/>`,
  bin: `<rect x="8" y="9" width="32" height="6" rx="1"/><rect x="18" y="5" width="12" height="5" rx="1"/><path d="M11 17h26l-2 26H13z"/><path class="ks" d="M19 23v14M24 23v14M29 23v14"/>`,
  road: `<path d="M18 5h12l14 38H4z"/><path class="k" d="M22.5 9h3v6h-3zM22 20h4v7h-4zM21.5 32h5v9h-5z"/>`,
  heart: `<path d="M24 43S5 31 5 17a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 14-19 26-19 26z"/><path class="ks" d="M24 16v14M17 23h14"/>`,
  vote: `<rect x="7" y="21" width="34" height="22" rx="2"/><rect class="k" x="15" y="26" width="18" height="4" rx="1"/><path d="M15 4h18v17H15z"/><path class="ks" d="M20 12l3 3 6-7" fill="none"/>`,
  book: `<path d="M3 10c8-3 15-2 21 3v29c-6-5-13-6-21-3z"/><path d="M45 10c-8-3-15-2-21 3v29c6-5 13-6 21-3z"/><path class="ks" d="M9 17q6-1 10 2M9 24q6-1 10 2M29 19q4-3 10-2M29 26q4-3 10-2"/>`,
};
const picto = (k, cls = "") => `<svg class="cv-ico ${cls}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${PICTO[k] || PICTO.id}</svg>`;
const arrow = `<svg class="cv-arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>`;

const crest = (cls = "cv-crest") => `<svg class="${cls}" viewBox="0 0 64 76" aria-hidden="true" focusable="false"><path class="cv-c0" d="M5 5h54v34c0 18-12 28-27 35C17 67 5 57 5 39z"/><path class="cv-c1" d="M11 11h42v26c0 13-9 21-21 27-12-6-21-14-21-27z"/><path class="cv-c2" d="M21 36V22h4v3h4v-3h6v3h4v-3h4v14z"/><rect class="cv-c2" x="26" y="29" width="12" height="9"/><rect class="cv-c1" x="30" y="31" width="4" height="7"/><path class="cv-c3" d="M11 44q7-5 14 0t14 0 14 0v6q-7 5-14 0t-14 0-14 0z"/><path class="cv-c4" d="M32 53l5 5-5 6-5-6z"/></svg>`;

// Silhouette de bâtiments : mairie centrale à fronton et horloge, clocher, école, médiathèque, immeubles, arbres
const windows = (x, y, cols, rows, w = 7, h = 9, gx = 13, gy = 17) => { let o = ""; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) o += "M" + (x + c * gx) + " " + (y + r * gy) + "h" + w + "v" + h + "h-" + w + "z"; return o; };
const skylineG = () => `<g class="cv-sk1"><rect x="20" y="62" width="110" height="78"/><rect x="140" y="40" width="64" height="100"/><rect x="900" y="50" width="90" height="90"/><rect x="1000" y="70" width="70" height="70"/><rect x="1090" y="34" width="86" height="106"/><path d="M190 140V86h60v54z"/></g>
<g class="cv-sk2"><rect x="270" y="58" width="130" height="82"/><path d="M262 58 335 22l73 36z"/><rect x="330" y="8" width="10" height="16"/><rect x="560" y="76" width="260" height="64"/><path d="M548 78 690 38l142 40z"/><rect x="620" y="60" width="140" height="18"/><rect x="684" y="14" width="12" height="26"/><path d="M690 4 696 14h-12z"/><circle cx="690" cy="58" r="12"/><rect x="450" y="22" width="44" height="118"/><path d="M444 24 472 -8l28 32z"/><rect x="838" y="66" width="50" height="74"/><circle cx="430" cy="104" r="20"/><circle cx="520" cy="112" r="16"/><circle cx="853" cy="106" r="0"/></g>
<g class="cv-sk3"><path d="${windows(30, 74, 7, 4)}${windows(150, 52, 4, 5)}${windows(912, 62, 5, 3, 7, 9, 16)}${windows(1100, 46, 5, 5, 7, 9, 15)}${windows(280, 74, 8, 3, 7, 9, 15)}${windows(572, 90, 14, 2, 8, 10, 17, 24)}M456 40h8v14h-8zM480 40h8v14h-8zM456 70h8v14h-8zM480 70h8v14h-8zM676 104h28v36h-28z"/><circle cx="690" cy="58" r="9" class="cv-sk4"/><path class="cv-sk5" d="M690 58v-6M690 58l4 3"/></g>`;
const miniG = `<g class="cv-sk1"><rect x="20" y="62" width="110" height="78"/><rect x="900" y="50" width="90" height="90"/><rect x="1090" y="34" width="86" height="106"/></g><g class="cv-sk2"><rect x="270" y="58" width="130" height="82"/><path d="M262 58 335 22l73 36z"/><rect x="560" y="76" width="260" height="64"/><path d="M548 78 690 38l142 40z"/><rect x="450" y="22" width="44" height="118"/></g>`;
const skyline = (cls = "cv-sky") => `<svg class="${cls}" viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${skylineG()}<rect class="cv-sk6" x="0" y="136" width="1200" height="4"/></svg>`;
// vignette d'actualité : pictogramme sur fond de silhouette
const vignette = (k, tone) => `<svg class="cv-vig cv-tone${tone}" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect class="cv-vbg" width="320" height="180"/><g transform="translate(0,122) scale(.27)" class="cv-vsk">${miniG}</g><g class="cv-vico" transform="translate(116,28) scale(1.8)">${PICTO[k] || PICTO.id}</g></svg>`;

const checkSvg = `<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 10.5 8.5 15 16 5.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="square"/></svg>`;

/* ---------- en-tête, pied de page ---------- */
const SUB = {
  "/demarches": THEMES.slice(0, 6).map((t) => [t[1], `/demarches#${t[0]}`]).concat([["Toutes les démarches", "/demarches"]]),
  "/vie-municipale": [["Conseil municipal", "/vie-municipale#conseil"], ["Vos élus", "/vie-municipale#elus"], ["Budget", "/vie-municipale#budget"]],
};
const menuItems = (menu) => menu.map(({ label, url }) => ({ label, url, sub: SUB[url] || null }));
const a11yBar = () => `<div class="cv-a11y" role="region" aria-label="Réglages d'accessibilité">
  <div class="cv-a11y-in">
    <a class="cv-skip" href="#contenu" data-cv-skip>Aller au contenu</a>
    <details class="cv-tdet"><summary class="cv-tsum"><span class="cv-aa" aria-hidden="true">Aa</span> Réglages d'accessibilité</summary><div class="cv-tools" role="group" aria-label="Réglages d'affichage">
      <span class="cv-seg" role="group" aria-label="Taille du texte"><span class="cv-seg-t" aria-hidden="true">Texte</span><a href="#taille-moins" role="button" data-cv-act="size-" aria-label="Réduire la taille du texte"><span aria-hidden="true">A−</span></a><a href="#taille-normale" role="button" data-cv-act="size0" aria-pressed="true" aria-label="Taille du texte normale"><span aria-hidden="true">A</span></a><a href="#taille-plus" role="button" data-cv-act="size+" aria-label="Augmenter la taille du texte"><span aria-hidden="true">A+</span></a></span>
      <span class="cv-seg" role="group" aria-label="Contraste des couleurs"><span class="cv-seg-t" aria-hidden="true">Contraste</span><a href="#contraste-normal" role="button" data-cv-act="c-normal" aria-pressed="true" aria-label="Contraste normal">Normal</a><a href="#contraste-eleve" role="button" data-cv-act="c-high" aria-pressed="false" aria-label="Contraste élevé">Élevé</a></span>
      <a class="cv-tg" href="#police-lisible" role="button" data-cv-act="dys" aria-pressed="false">Police lisible</a>
      <a class="cv-tg" href="#animations" role="button" data-cv-act="motion" aria-pressed="false">Réduire les animations</a>
      <a class="cv-tg cv-reset" href="#reinitialiser" role="button" data-cv-act="reset">Réinitialiser</a>
    </div></details>
    <p class="cv-tel">Allô mairie <strong>01 23 45 67 89</strong></p>
    <p class="cv-live" role="status" aria-live="polite"></p>
  </div></div>`;
const header = (c) => {
  const items = menuItems(c.menu);
  const top = items.map((m) => `<li class="cv-mi${m.sub ? " cv-has" : ""}"><a href="${esc(m.url)}">${esc(m.label)}</a>${m.sub ? `<div class="cv-dr">${m.sub.map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join("")}</div>` : ""}</li>`).join("");
  const mob = items.map((m) => `<li><a class="cv-mm" href="${esc(m.url)}">${esc(m.label)}</a>${m.sub ? `<ul>${m.sub.map(([l, u]) => `<li><a href="${esc(u)}">${esc(l)}</a></li>`).join("")}</ul>` : ""}</li>`).join("");
  return `<header class="cv-head pk-bleed" lang="fr">${a11yBar()}
  <div class="cv-top"><a class="cv-logo" href="/" aria-label="${esc(c.brand)} — accueil">${crest()}<span class="cv-logo-t"><strong>Ville de Vauclerc</strong><small>Hôtel de ville · 18 400 habitants</small></span></a>
    <p class="cv-open" data-cv-open="${hoursAttr}"><span class="cv-dot" aria-hidden="true"></span><span data-cv-opent>Horaires de la mairie</span></p>
    <details class="cv-burger"><summary><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg><span>Menu</span></summary><div class="cv-drawer" role="navigation" aria-label="Menu mobile"><ul>${mob}<li><a class="cv-mm" href="/recherche">Rechercher sur le site</a></li></ul></div></details></div>
  <div class="cv-menu" role="navigation" aria-label="Navigation principale"><ul class="cv-ml">${top}</ul><a class="cv-find" href="/recherche">Rechercher sur le site ${arrow}</a></div>
  <div class="cv-tri" aria-hidden="true"><i></i><i></i><i></i></div></header>`;
};
const footer = (c) => `<footer class="cv-foot pk-bleed" lang="fr">${skyline("cv-sky cv-sky--foot")}
  <div class="cv-fg"><div class="cv-f1">${crest()}<p class="cv-f-name">Ville de Vauclerc</p><address>Hôtel de ville<br>1 place de la République<br>Vauclerc</address><p>Allô mairie : 01 23 45 67 89</p></div>
    <div class="cv-f2"><h2 class="cv-fh">Horaires</h2><dl class="cv-fhrs">${HOURS.map(([, d, h]) => `<div><dt>${d}</dt><dd>${fmtH(h)}</dd></div>`).join("")}</dl></div>
    <div class="cv-f3"><h2 class="cv-fh">Services</h2>${c.menu.map(({ label, url }) => `<a class="cv-fl" href="${esc(url)}">${esc(label)}</a>`).join("")}<a class="cv-fl" href="/recherche">Recherche</a></div>
    <div class="cv-f4"><h2 class="cv-fh">Accessibilité</h2><p>Ce site propose un bandeau de réglages : taille du texte, contraste, police lisible, réduction des animations. Il se parcourt entièrement au clavier.</p><p>Accueil en langue des signes sur rendez-vous.</p></div></div>
  <p class="cv-legal">© Ville de Vauclerc — site de démonstration. Commune, élus, chiffres et horaires fictifs. Déclaration d'accessibilité : à compléter par la collectivité.</p></footer>`;

const pagehead = (crumb, title, sub, ico) => sec(`<section class="cv-ph pk-bleed"><div class="cv-w cv-ph-in"><div class="cv-ph-t"><div class="cv-crumb" role="navigation" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true"> / </span><span aria-current="page">${esc(crumb)}</span></div>
  <div class="cv-h1" role="heading" aria-level="1" data-cv-h1>${title}</div><p class="cv-ph-sub">${esc(sub)}</p></div><div class="cv-ph-ico" aria-hidden="true">${picto(ico || "house")}</div></div>${skyline("cv-sky cv-sky--ph")}</section>`);

/* ---------- blocs ---------- */
const searchBox = (mode) => `<div class="cv-search" data-cv-search="${mode}" role="search" aria-label="Recherche de démarche"><a class="cv-btn" href="/recherche">Rechercher sur le site ${arrow}</a></div>`;
const tiles = () => THEMES.map(([id, name, desc, ico]) => {
  const list = SVC.filter((s) => s[1] === id);
  return `<li><a class="cv-tile" href="/demarches#${id}">${picto(ico, "cv-tile-ico")}<span class="cv-tile-b"><h3 class="cv-tile-h">${esc(name)}</h3><span class="cv-tile-d">${esc(desc)}</span><span class="cv-tile-n">${list.length} démarches ${arrow}</span></span></a></li>`;
}).join("");
const indexList = () => `<details class="cv-index"><summary>Toutes les démarches de A à Z (${SVC.length})</summary><ul data-cv-index>${SVC.slice().sort((a, b) => a[2].localeCompare(b[2], "fr")).map((s) => `<li><a href="/demarche#${s[0]}" data-t="${esc(s[2] + " " + s[3] + " " + THEME_BY[s[1]][1])}">${esc(s[2])}</a></li>`).join("")}</ul></details>`;

const newsCard = (n, big) => {
  const [d, cat, t, x, ico] = n;
  const tone = NEWS_CATS.indexOf(cat) % 3;
  return `<article class="cv-news${big ? " cv-news--big" : ""}" data-cv-item data-c="${esc(cat)}"><div class="cv-news-v">${vignette(ico, tone)}</div><div class="cv-news-b"><p class="cv-meta"><span class="cv-chip cv-chip--${tone}">${esc(cat)}</span><time>${longDate(d)}</time></p><h3 class="cv-news-h">${esc(t)}</h3><p>${esc(x)}</p></div></article>`;
};
const eventRow = (e) => {
  const [d, h, t, lieu, cat, x, acc] = e;
  const p = dparts(d);
  return `<li class="cv-ev" data-cv-item data-m="${d.slice(0, 7)}" data-c="${esc(cat)}"><time class="cv-date"><span class="cv-date-w">${p.wd.slice(0, 3)}.</span><b>${p.d}</b><span class="cv-date-m">${MONTHS[p.m - 1].slice(0, 4)}${MONTHS[p.m - 1].length > 4 ? "." : ""}</span></time>
    <div class="cv-ev-b"><p class="cv-meta"><span class="cv-chip">${esc(cat)}</span><span>${h.replace(":", " h ")}</span></p><h3 class="cv-ev-h">${esc(t)}</h3><p>${esc(x)}</p><p class="cv-ev-l"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5a6 6 0 0 0-6 6c0 4.5 6 11 6 11s6-6.5 6-11a6 6 0 0 0-6-6zm0 8.3a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z"/></svg>${esc(lieu)}</p>
    <ul class="cv-acc" aria-label="Accessibilité de l'événement">${acc.map((a) => `<li class="cv-acc-${a}">${ACCESS[a]}</li>`).join("")}</ul></div></li>`;
};
const filterGroup = (g, label, items, first) => `<div class="cv-fg-g" role="group" aria-label="${esc(label)}" data-g="${g}"><p class="cv-fg-t" aria-hidden="true">${esc(label)}</p>${first ? `<a href="#tous" role="button" class="is-on" aria-pressed="true" data-v="*">${esc(first)}</a>` : ""}${items.map(([v, l], i) => `<a href="#f-${esc(String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-"))}" role="button" aria-pressed="${!first && i === 0 ? "true" : "false"}"${!first && i === 0 ? ' class="is-on"' : ""} data-v="${esc(v)}">${esc(l)}</a>`).join("")}</div>`;

/* ---------- pages ---------- */
const home = (c) => [
  sec(header(c)),
  sec(`<section class="cv-hero pk-bleed" lang="fr"><div class="cv-w"><div class="cv-hero-top">
    <div class="cv-hero-t"><p class="cv-kicker">Ville de Vauclerc · Services au public</p><div class="cv-h1 cv-h1--home" role="heading" aria-level="1" data-cv-h1>Bienvenue à Vauclerc. <em>Vos démarches, simplement.</em></div>
      <p class="cv-lead">Carte d'identité, inscription à l'école, permis de construire, signalement sur la voie publique : tout se trouve ici, avec les pièces à fournir, les délais et les coûts.</p>
      <p class="cv-sl">Que souhaitez-vous faire ?</p>${searchBox("home")}</div>
    <aside class="cv-today" aria-label="La mairie aujourd'hui"><h2 class="cv-h3">La mairie aujourd'hui</h2><p class="cv-open cv-open--big" data-cv-open="${hoursAttr}"><span class="cv-dot" aria-hidden="true"></span><span data-cv-opent>Horaires de la mairie</span></p>
      <p class="cv-today-p">1 place de la République, accès de plain-pied, accueil prioritaire pour les personnes à mobilité réduite.</p><a class="cv-btn cv-btn--ghost" href="/contact">Horaires et accès ${arrow}</a></aside></div>
    <div class="cv-quick"><h2 class="cv-h2">Accès rapides</h2><ul class="cv-tiles">${tiles()}</ul>${indexList()}</div></div>${skyline("cv-sky cv-sky--hero")}</section>`),
  sec(`<section class="cv-alert pk-bleed" aria-label="Information pratique"><div class="cv-w cv-alert-in"><span class="cv-alert-ic" aria-hidden="true">${picto("road")}</span><p><strong>Travaux rue des Tilleuls.</strong> Circulation alternée jusqu'au 20 décembre ; accès aux commerces et aux écoles maintenus.</p><a class="cv-more" href="/actualites">Voir le détail ${arrow}</a></div></section>`),
  sec(`<section class="cv-sec pk-bleed"><div class="cv-w"><div class="cv-sh"><h2 class="cv-h2">Actualités</h2><a class="cv-more" href="/actualites">Toutes les actualités ${arrow}</a></div>
    <div class="cv-news-list">${NEWS.slice(0, 3).map((n, i) => newsCard(n, i === 0)).join("")}</div></div></section>`),
  sec(`<section class="cv-sec cv-sec--tint pk-bleed"><div class="cv-w cv-two"><div><div class="cv-sh"><h2 class="cv-h2">Agenda local</h2><a class="cv-more" href="/agenda">Tout l'agenda ${arrow}</a></div><ul class="cv-evs">${EVENTS.slice(0, 4).map(eventRow).join("")}</ul></div>
    <div><div class="cv-sh"><h2 class="cv-h2">Les plus demandées</h2></div><ol class="cv-top5">${["carte-identite", "inscription-scolaire", "declaration-travaux", "encombrants", "inscription-listes"].map((id) => { const s = SVC.find((x) => x[0] === id); return `<li><a href="/demarche#${id}"><span class="cv-top5-n" aria-hidden="true"></span><span class="cv-top5-b"><strong>${esc(s[2])}</strong><small>${esc(THEME_BY[s[1]][1])} · délai ${esc(SHORTD[id].toLowerCase())}</small></span>${arrow}</a></li>`; }).join("")}</ol>
      <div class="cv-help"><h3 class="cv-h3">Besoin d'aide pour une démarche ?</h3><p>Un agent vous accompagne à l'accueil, sans rendez-vous, ou par téléphone du lundi au vendredi.</p><a class="cv-btn" href="/contact">Nous contacter ${arrow}</a></div></div></div></section>`),
  sec(`<section class="cv-sec pk-bleed"><div class="cv-w"><div class="cv-sh"><h2 class="cv-h2">Vie municipale</h2><a class="cv-more" href="/vie-municipale">Conseil, élus, budget ${arrow}</a></div>
    <div class="cv-cards3"><article class="cv-card"><h3 class="cv-h3">Prochain conseil municipal</h3><p class="cv-big">Jeudi 12 novembre, 18 h 30</p><p>Séance publique à l'Hôtel de ville. L'ordre du jour est affiché une semaine avant.</p></article>
      <article class="cv-card"><h3 class="cv-h3">Le budget en un coup d'œil</h3><p class="cv-big">38,4 M€</p><p>Pour 100 € dépensés, 26 € vont aux écoles et à la jeunesse.</p></article>
      <article class="cv-card"><h3 class="cv-h3">Vos élus à votre écoute</h3><p class="cv-big">29 conseillers</p><p>Le maire et ses adjoints reçoivent sur rendez-vous, au service d'accueil.</p></article></div></div></section>`),
  sec(footer(c)),
];

const demarches = (c) => [
  sec(header(c)), pagehead("Démarches en ligne", "Démarches <em>en ligne</em>", "Choisissez un thème ou cherchez une démarche : chaque fiche indique les pièces à fournir, le délai, le coût et le lieu.", "id"),
  sec(`<section class="cv-sec cv-cat pk-bleed" data-cv-filters><div class="cv-w"><div class="cv-bar" lang="fr">
    <div class="cv-search-wrap"><p class="cv-sl">Rechercher dans le catalogue</p><div class="cv-search" data-cv-search="filter" role="search"><a class="cv-btn" href="/recherche">Rechercher sur le site ${arrow}</a></div></div>
    <div class="cv-chips">${filterGroup("t", "Thème", THEMES.map((t) => [t[0], t[1]]), "Tous les thèmes")}</div></div>
    <p class="cv-count" role="status" aria-live="polite"><strong data-cv-count>${SVC.length}</strong> démarches affichées</p>
    <div class="cv-cols">${THEMES.map(([id, name, , ico]) => `<section class="cv-col" data-cv-sect data-t="${id}"><div class="cv-col-h">${picto(ico, "cv-col-ico")}<h2 class="cv-h3">${esc(name)}</h2></div><ul class="cv-svcs">${SVC.filter((s) => s[1] === id).map((s) => `<li data-cv-item data-t="${id}" data-q="${esc(s[2] + " " + s[3])}"><a class="cv-svc" href="/demarche#${s[0]}"><span class="cv-svc-n">${esc(s[2])}</span><span class="cv-svc-m"><span>Délai : ${esc(SHORTD[s[0]])}</span><span>Coût : ${esc(SHORT[s[0]])}</span></span></a></li>`).join("")}</ul></section>`).join("")}</div>
    <p class="cv-empty" data-cv-empty hidden>Aucune démarche ne correspond à votre recherche. Essayez un mot plus court, ou <a href="/recherche">lancez une recherche sur tout le site</a>.</p></div></section>`),
  sec(footer(c)),
];

const ficheHtml = (s) => {
  const [id, th, titre, resume, pieces, delai, cout, lieu, etapes] = s;
  const same = SVC.filter((x) => x[1] === th && x[0] !== id);
  return `<article class="cv-fiche" data-fiche="${id}" data-titre="${esc(titre)}"><div class="cv-fiche-main"><p class="cv-chip">${esc(THEME_BY[th][1])}</p><h2 class="cv-h2">${esc(titre)}</h2><p class="cv-lead">${esc(resume)}</p>
    <h3 class="cv-h3">Pièces à fournir</h3><p class="cv-prog" data-cv-prog role="status" aria-live="polite">0 pièce prête sur ${pieces.length}</p>
    <ul class="cv-checks" aria-label="Liste de contrôle des pièces">${pieces.map((p, i) => `<li><a href="#piece-${i + 1}" role="checkbox" aria-checked="false"><span class="cv-box">${checkSvg}</span><span class="cv-ct">${esc(p)}</span></a></li>`).join("")}</ul>
    <h3 class="cv-h3">Comment faire</h3><ol class="cv-steps">${etapes.map((e) => `<li>${esc(e)}</li>`).join("")}</ol>
    <p class="cv-note">Informations de démonstration, à titre indicatif : la collectivité les adapte à ses propres règles.</p></div>
  <aside class="cv-side" aria-label="Informations pratiques"><h3 class="cv-h3">En pratique</h3><dl class="cv-dl"><div><dt>Délai</dt><dd>${esc(delai)}</dd></div><div><dt>Coût</dt><dd>${esc(cout)}</dd></div><div><dt>Lieu</dt><dd>${esc(lieu)}</dd></div></dl>
    <div class="cv-recap"><h3 class="cv-h3">Votre récapitulatif</h3><p data-cv-recap>Cochez les pièces que vous avez déjà réunies.</p><a class="cv-btn cv-btn--ghost" href="#copier" role="button" data-cv-copy>Copier le récapitulatif</a></div>
    <a class="cv-btn cv-btn--big" href="/contact">Faire ma demande ${arrow}</a><p class="cv-side-n">Le formulaire de contact transmet votre demande au service concerné : collez-y le récapitulatif.</p>
    ${same.length ? `<h3 class="cv-h3">Dans le même thème</h3><ul class="cv-same">${same.map((x) => `<li><a href="/demarche#${x[0]}">${esc(x[2])}</a></li>`).join("")}</ul>` : ""}</aside></article>`;
};
const demarche = (c) => [
  sec(header(c)), pagehead("Fiche démarche", "Fiche <em>démarche</em>", "Pièces à fournir, délai, coût et lieu : préparez votre dossier avant de vous déplacer.", "id"),
  sec(`<section class="cv-sec cv-fiches pk-bleed"><div class="cv-w"><div class="cv-back" lang="fr"><a class="cv-more cv-more--l" href="/demarches"><svg class="cv-arr cv-arr--l" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-7 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg> Toutes les démarches</a></div></div></section>`),
  ...SVC.map((s) => sec(`<section class="cv-fiche-w pk-bleed"><div class="cv-w">${ficheHtml(s)}</div></section>`)),
  sec(footer(c)),
];

const actualites = (c) => [
  sec(header(c)), pagehead("Actualités", "<em>Actualités</em> de la commune", "Travaux, culture, solidarité, vie locale : l'information de la mairie, classée par thème.", "book"),
  sec(`<section class="cv-sec pk-bleed" data-cv-filters><div class="cv-w"><div class="cv-bar cv-bar--solo"><div class="cv-chips">${filterGroup("c", "Catégorie", NEWS_CATS.map((x) => [x, x]), "Toutes")}</div></div>
    <p class="cv-count" role="status" aria-live="polite"><strong data-cv-count>${NEWS.length}</strong> articles affichés</p>
    <div class="cv-news-list" data-cv-sect>${NEWS.map((n, i) => newsCard(n, i === 0)).join("")}</div>
    <p class="cv-empty" data-cv-empty hidden>Aucun article dans cette catégorie pour le moment.</p></div></section>`),
  sec(footer(c)),
];

const agenda = (c) => {
  const months = [...new Set(EVENTS.map((e) => e[0].slice(0, 7)))];
  const cats = [...new Set(EVENTS.map((e) => e[4]))];
  const mlabel = (m) => { const [y, mm] = m.split("-").map(Number); return `${MONTHS[mm - 1][0].toUpperCase()}${MONTHS[mm - 1].slice(1)} ${y}`; };
  return [
    sec(header(c)), pagehead("Agenda", "<em>Agenda</em> local", "Séances du conseil, spectacles, sport, rendez-vous citoyens : filtrez par mois et par catégorie.", "vote"),
    sec(`<section class="cv-sec pk-bleed" data-cv-filters><div class="cv-w cv-agenda"><aside class="cv-filters" aria-label="Filtres de l'agenda">${filterGroup("m", "Mois", months.map((m) => [m, mlabel(m)]), "Tous les mois")}${filterGroup("c", "Catégorie", cats.map((x) => [x, x]), "Toutes les catégories")}</aside>
      <div class="cv-agenda-l"><p class="cv-count" role="status" aria-live="polite"><strong data-cv-count>${EVENTS.length}</strong> rendez-vous affichés</p>
      ${months.map((m) => `<section class="cv-month" data-cv-sect data-m="${m}"><h2 class="cv-mh">${mlabel(m)}</h2><ul class="cv-evs">${EVENTS.filter((e) => e[0].startsWith(m)).map(eventRow).join("")}</ul></section>`).join("")}
      <p class="cv-empty" data-cv-empty hidden>Aucun rendez-vous pour cette combinaison. Choisissez « Tous les mois » ou « Toutes les catégories ».</p>
      <p class="cv-legend">Pictogrammes : accessibilité de la salle ; boucle magnétique pour les personnes malentendantes ; interprète en langue des signes (<abbr title="langue des signes française">LSF</abbr>) sur certaines séances.</p></div></div></section>`),
    sec(footer(c)),
  ];
};

const BUDGET = [["Écoles et jeunesse", 26], ["Voirie et cadre de vie", 18], ["Culture et sport", 14], ["Solidarité", 13], ["Administration générale", 12], ["Sécurité et tranquillité", 8], ["Dette", 5], ["Environnement", 4]];
const ELUS = [
  ["Claire Berthelot", "Maire", "Finances, stratégie, relations avec les habitants", "Mardi, sur rendez-vous"],
  ["Marc Delorme", "1er adjoint", "Urbanisme, travaux et mobilités", "Jeudi 14 h – 17 h"],
  ["Samira Haddad", "Adjointe", "Écoles, enfance et jeunesse", "Lundi 14 h – 17 h"],
  ["Paul Vasseur", "Adjoint", "Solidarité et seniors", "Mercredi 9 h – 12 h"],
  ["Nadia Lefèvre", "Adjointe", "Culture, sport et vie associative", "Vendredi 9 h – 12 h"],
  ["Thomas Roche", "Conseiller délégué", "Environnement et propreté", "Sur rendez-vous"],
  ["Élise Marchand", "Conseillère déléguée", "Démocratie participative et numérique", "Sur rendez-vous"],
  ["Jean Girard", "Conseiller délégué", "Commerces et marché", "Sur rendez-vous"],
];
const initials = (n) => n.split(" ").map((w) => w[0]).join("");
const bars = () => { let y = 0; return `<svg class="cv-bud" viewBox="0 0 100 ${BUDGET.length * 11}" role="img" aria-label="Répartition de 100 euros de dépenses par poste" preserveAspectRatio="none">${BUDGET.map(([l, v], i) => { const r = `<rect class="cv-bud-b cv-bud-b${i % 4}" x="0" y="${y + 1}" width="${v * 3.4}" height="7.5"/>`; y += 11; return r; }).join("")}</svg>`; };

const vie = (c) => [
  sec(header(c)), pagehead("Vie municipale", "Vie <em>municipale</em>", "Le conseil, vos élus et le budget de la commune, expliqués simplement.", "vote"),
  sec(`<section class="cv-sec pk-bleed" data-cv-filters data-cv-tabs><div class="cv-w"><div class="cv-bar cv-bar--solo cv-tabs-bar" lang="fr">${filterGroup("p", "Rubrique", [["conseil", "Conseil municipal"], ["elus", "Vos élus"], ["budget", "Budget"]], null)}</div>
    <div class="cv-panel" data-cv-item data-p="conseil"><h2 class="cv-h2">Conseil municipal</h2><div class="cv-two cv-two--e"><div><p class="cv-lead">Le conseil se réunit en séance publique environ une fois par mois. Toute personne peut y assister, des places sont réservées aux personnes à mobilité réduite.</p>
      <h3 class="cv-h3">Ordre du jour du 12 novembre</h3><div class="cv-acc-l">${["Approbation du compte rendu de la séance précédente|Le texte est lu puis soumis au vote. Il est ensuite publié sur le site.", "Tarifs de la restauration scolaire 2027|Présentation de la grille selon le quotient familial et vote des tarifs.", "Convention avec la médiathèque intercommunale|Mise en commun du catalogue et prêt entre les deux établissements.", "Subventions aux associations|Répartition de l'enveloppe annuelle entre 42 associations locales.", "Questions diverses|Les conseillers peuvent interroger le maire sur la vie de la commune."].map((x) => { const [t, d] = x.split("|"); return `<details><summary>${esc(t)}</summary><p>${esc(d)}</p></details>`; }).join("")}</div>
      <p class="cv-note">Les comptes rendus sont mis à disposition après chaque séance. <a href="/contact">Demandez-les au secrétariat</a> si vous préférez une version papier ou en gros caractères.</p></div>
      <div class="cv-card"><h3 class="cv-h3">Composition du conseil</h3><p>29 conseillers municipaux.</p><svg class="cv-hemi" viewBox="0 0 120 20" role="img" aria-label="21 sièges pour le groupe majoritaire, 5 pour le premier groupe d'opposition, 3 pour le second"><rect class="cv-bud-b0" x="0" y="2" width="87" height="14"/><rect class="cv-bud-b1" x="87" y="2" width="21" height="14"/><rect class="cv-bud-b2" x="108" y="2" width="12" height="14"/></svg>
        <ul class="cv-leg"><li><i class="cv-sw0"></i>Groupe majoritaire : 21</li><li><i class="cv-sw1"></i>Groupe d'opposition A : 5</li><li><i class="cv-sw2"></i>Groupe d'opposition B : 3</li></ul></div></div></div>
    <div class="cv-panel" data-cv-item data-p="elus"><h2 class="cv-h2">Vos élus</h2><ul class="cv-elus">${ELUS.map(([n, f, d, p]) => `<li class="cv-elu"><svg class="cv-avatar" viewBox="0 0 64 64" aria-hidden="true"><circle class="cv-av0" cx="32" cy="32" r="32"/><circle class="cv-av1" cx="32" cy="25" r="11"/><path class="cv-av1" d="M10 58c2-14 11-21 22-21s20 7 22 21a32 32 0 0 1-44 0z"/></svg><div><h3 class="cv-h3">${esc(n)}</h3><p class="cv-role">${esc(f)}</p><p>${esc(d)}</p><p class="cv-perm"><strong>Permanence :</strong> ${esc(p)}</p></div></li>`).join("")}</ul></div>
    <div class="cv-panel" data-cv-item data-p="budget"><h2 class="cv-h2">Budget 2026</h2><p class="cv-lead">La commune dépense 38,4 millions d'euros en 2026. Voici ce que représentent 100 € de dépenses.</p><div class="cv-bud-w"><table class="cv-tab"><caption>Pour 100 € dépensés, par poste</caption><thead><tr><th scope="col">Poste</th><th scope="col">Part</th><th scope="col"><span class="cv-sr">Graphique</span></th><th scope="col">En millions</th></tr></thead><tbody>${BUDGET.map(([l, v]) => `<tr><th scope="row">${esc(l)}</th><td>${v} €</td><td><svg class="cv-rowbar" viewBox="0 0 100 8" aria-hidden="true"><rect width="${v * 3.8}" height="8"/></svg></td><td>${(38.4 * v / 100).toFixed(1).replace(".", ",")} M€</td></tr>`).join("")}</tbody></table></div>
      <p class="cv-note">Chiffres de démonstration. Les données détaillées peuvent être publiées en <span lang="en">open data</span> par la collectivité.</p></div></div></section>`),
  sec(footer(c)),
];

const contact = (c) => [
  sec(header(c)), pagehead("Contact", "Contact, <em>horaires</em> et accès", "Venir à la mairie, appeler le bon service ou écrire à la commune.", "house"),
  sec(`<section class="cv-sec pk-bleed"><div class="cv-w cv-two cv-two--c"><div><h2 class="cv-h2">Horaires d'ouverture</h2><p class="cv-open cv-open--big" data-cv-open="${hoursAttr}"><span class="cv-dot" aria-hidden="true"></span><span data-cv-opent>Horaires de la mairie</span></p>
    <table class="cv-tab cv-hrs"><caption>Horaires de l'accueil de l'Hôtel de ville</caption><thead><tr><th scope="col">Jour</th><th scope="col">Ouverture</th></tr></thead><tbody>${HOURS.map(([d, j, h]) => `<tr data-d="${d}"><th scope="row">${j}</th><td>${fmtH(h)}</td></tr>`).join("")}<tr><th scope="row">Dimanche</th><td>Fermé</td></tr></tbody></table>
    <p class="cv-note">L'état civil reçoit sur rendez-vous. Le mardi, l'accueil est ouvert jusqu'à 19 h.</p>
    <h2 class="cv-h2 cv-h2--m">Services</h2><table class="cv-tab"><caption>Numéros des services municipaux</caption><thead><tr><th scope="col">Service</th><th scope="col">Téléphone</th></tr></thead><tbody>${[["Accueil et état civil", "01 23 45 67 89"], ["Urbanisme", "01 23 45 67 90"], ["Enfance et écoles", "01 23 45 67 91"], ["Action sociale (CCAS)", "01 23 45 67 92"], ["Propreté et voirie", "01 23 45 67 93"]].map(([s, t]) => `<tr><th scope="row">${s}</th><td>${t}</td></tr>`).join("")}</tbody></table></div>
    <div><h2 class="cv-h2">Accès à l'Hôtel de ville</h2>
    <svg class="cv-plan" viewBox="0 0 400 300" role="img" aria-label="Plan : l'Hôtel de ville est place de la République, entre l'arrêt de bus Mairie et le parking des Tilleuls"><rect class="cv-pl0" width="400" height="300"/><path class="cv-pl1" d="M0 210h400v34H0zM170 0h34v300h-34z"/><path class="cv-pl2" d="M0 227h400M187 0v300" /><rect class="cv-pl3" x="214" y="104" width="130" height="90"/><path class="cv-pl4" d="M205 104 279 66l74 38z"/><rect class="cv-pl4" x="262" y="150" width="34" height="44"/><circle class="cv-pl5" cx="279" cy="132" r="9"/><rect class="cv-pl6" x="40" y="130" width="86" height="64" rx="3"/><circle class="cv-pl7" cx="150" cy="262" r="16"/><path class="cv-pl8" d="M150 254v16M144 262h12"/><rect class="cv-pl9" x="40" y="258" width="64" height="30" rx="3"/><path class="cv-pl8" d="M72 266v14M66 266h8a4 4 0 0 1 0 8h-8"/></svg>
    <ul class="cv-key"><li><b>Hôtel de ville</b> : 1 place de la République, entrée de plain-pied.</li><li><b>Bus</b> : lignes 3 et 7, arrêt « Mairie », à 50 mètres.</li><li><b>Voiture</b> : parking des Tilleuls, 4 places réservées aux personnes handicapées.</li><li><b>Vélo</b> : arceaux devant l'entrée principale.</li></ul>
    <div class="cv-card"><h3 class="cv-h3">Accueil adapté</h3><ul class="cv-chk"><li>Boucle magnétique aux guichets</li><li>Accueil en langue des signes (LSF) sur rendez-vous</li><li>Documents en gros caractères ou en <abbr title="facile à lire et à comprendre">FALC</abbr> sur demande</li><li>Accompagnement aux démarches numériques</li></ul></div></div></div></section>`),
  { type: "form", heading: "Écrire à la mairie", intro: "Décrivez votre demande (démarche, adresse concernée). Si vous avez utilisé la liste de contrôle d'une démarche, collez le récapitulatif dans votre message. Réponse sous cinq jours ouvrés." },
  sec(footer(c)),
];

const recherche = (c) => [
  sec(header(c)), pagehead("Recherche", "<em>Rechercher</em> sur le site", "Une démarche, un service, une date : saisissez quelques mots.", "id"),
  { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une démarche, un service, une actualité…" } }] },
  sec(`<section class="cv-sec cv-sec--tint pk-bleed"><div class="cv-w"><h2 class="cv-h2">Pistes utiles</h2><ul class="cv-pist">${["carte-identite", "inscription-scolaire", "declaration-travaux", "encombrants"].map((id) => { const s = SVC.find((x) => x[0] === id); return `<li><a class="cv-tile cv-tile--s" href="/demarche#${id}">${picto(THEME_BY[s[1]][3], "cv-tile-ico")}<span class="cv-tile-b"><strong class="cv-tile-h">${esc(s[2])}</strong><span class="cv-tile-d">${esc(THEME_BY[s[1]][1])}</span></span></a></li>`; }).join("")}</ul></div></section>`),
  sec(footer(c)),
];

const introuvable = (c) => [
  sec(header(c)),
  sec(`<section class="cv-404 pk-bleed" lang="fr"><div class="cv-w cv-404-in"><div><p class="cv-kicker">Erreur 404</p><div class="cv-h1" role="heading" aria-level="1" data-cv-h1>Cette page <em>n'existe pas</em>.</div><p class="cv-lead">L'adresse est peut-être erronée, ou la page a changé de place. Voici de quoi retrouver votre chemin.</p>
    <div class="cv-actions"><a class="cv-btn cv-btn--big" href="/">Retour à l'accueil ${arrow}</a><a class="cv-btn cv-btn--ghost cv-btn--big" href="/recherche">Rechercher sur le site</a></div>
    <h2 class="cv-h3 cv-h3--m">Accès rapides</h2><ul class="cv-pist">${THEMES.slice(0, 4).map(([id, n, , ico]) => `<li><a class="cv-tile cv-tile--s" href="/demarches#${id}">${picto(ico, "cv-tile-ico")}<span class="cv-tile-b"><strong class="cv-tile-h">${esc(n)}</strong></span></a></li>`).join("")}</ul></div>
    <div class="cv-404-art" aria-hidden="true">${crest("cv-crest cv-crest--xl")}</div></div>${skyline("cv-sky cv-sky--hero")}</section>`),
  sec(footer(c)),
];

module.exports = {
  key: "civitas", name: "Civitas", version: "2.0.0", category: "services", tags: ["classique", "moderne"], siteType: "Mairie et collectivité locale", featured: true,
  concept: "Une mairie claire et accessible : un bandeau de réglages (taille du texte, contraste, police lisible), des accès rapides en grosses tuiles et un catalogue de démarches avec liste de contrôle des pièces.",
  description: "Collectivité locale : fond blanc, indigo grisé, bleu-vert et rouge discret, blason et bâtiments dessinés, bandeau d'accessibilité mémorisé, accès rapides, démarches avec pièces à cocher, actualités et agenda filtrables.",
  brand: "Ville de Vauclerc", modules: ["formulaires", "recherche"],
  dna: {
    header: "bandeau-d-accessibilite-persistant-et-menu-a-rubriques", hero: "acces-rapides-en-grosses-tuiles-et-recherche-de-demarche", grid: "services-en-colonnes-par-theme",
    motion: "reglages-d-affichage-memorises-et-filtres-instantanes-sans-animation", shapes: "ecusson-de-blason-pictogrammes-pleins-et-filet-tricolore",
    rhythm: "lecture-par-usage-demander-s-informer-participer", signature: "demarches-en-ligne-liste-de-controle-des-pieces-actualites-et-agenda-filtrable",
  },
  tokens: {
    colors: { primary: "#40397f", secondary: "#0b5f63", accent: "#a3201a", background: "#ffffff", surface: "#f3f2fa", text: "#1a1a2e", muted: "#44445c", success: "#1c6b3a", warning: "#7a4a00", error: "#a3201a" },
    fonts: { heading: "font.schibsted-grotesk", body: "font.andika", button: "font.schibsted-grotesk", link: "font.opendyslexic" },
    radius: { sm: 4, md: 6, lg: 8, button: 6, field: 6, card: 8 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#6f6c99" },
    type: { h1: { size: 50, weight: 800, lineHeight: 1.1, transform: "none" }, h2: { size: 34, weight: 700, lineHeight: 1.2, transform: "none" } },
  },
  options: [
    { key: "accent", label: "Couleur institutionnelle", type: "color", default: "#40397f" },
    { key: "rouge", label: "Rouge discret", type: "color", default: "#a3201a" },
    { key: "fond", label: "Fond de la une", type: "choice", default: "lavande", choices: [["lavande", "Lavande"], ["menthe", "Menthe"], ["blanc", "Blanc"]] },
    { key: "tuiles", label: "Accès rapides", type: "choice", default: "grandes", choices: [["grandes", "Grandes tuiles"], ["compactes", "Tuiles compactes"]] },
    { key: "alerte", label: "Bandeau d'information", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
  ],
  menu: [["Accueil", "/"], ["Démarches", "/demarches"], ["Actualités", "/actualites"], ["Agenda", "/agenda"], ["Vie municipale", "/vie-municipale"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "demarches", name: "Démarches", render: demarches }, { key: "demarche", name: "Fiche démarche", render: demarche },
    { key: "actualites", name: "Actualités", render: actualites }, { key: "agenda", name: "Agenda", render: agenda }, { key: "vie-municipale", name: "Vie municipale", render: vie },
    { key: "contact", name: "Contact", render: contact }, { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
