// Cap — cabinet de conseil en stratégie. Direction artistique : le schéma. Blanc froid, encre bleu-nuit, un seul ambre vif ; grotesque nette + serif de lecture ; matrice 2×2 aux flèches tracées, méga-menu par expertises, études de cas chiffrées.
const { sec, esc } = require("../kit");
const SECTEURS = ["Industrie", "Santé", "Énergie", "Distribution", "Services financiers", "Secteur public"];
const ENJEUX = ["Croissance", "Performance", "Transformation", "Fusion-acquisition", "Durabilité"];

// bar : [libellé, valeur avant, valeur après, texte avant, texte après] ; fig : [préfixe, nombre, décimales, suffixe]
const CASES = [
  { id: "verdier", name: "Maison Verdier", sec: "Industrie", enj: "Croissance", fig: ["×", 2.1, 1, ""], figl: "chiffre d'affaires à l'export en 30 mois", dur: 30, team: 6,
    bar: ["Chiffre d'affaires export", 38, 80, "38 M€", "80 M€"],
    facts: [["9", "nouveaux marchés ouverts"], ["+7 pts", "de marge brute"], ["4", "filières revues"]],
    ctx: "Un fabricant familial de produits alimentaires, leader régional, dépendait à 70 % d'un seul marché. Les marges s'érodaient et l'export restait opportuniste.",
    acts: ["Cartographie de 24 marchés selon l'attractivité et la capacité à les servir", "Choix de trois marchés prioritaires et d'un modèle de distribution par partenaires", "Mise en place d'un pilotage trimestriel de l'export par la direction"],
    res: "Le chiffre d'affaires export a plus que doublé, avec une marge brute en hausse grâce à une gamme resserrée sur les références les plus rentables." },
  { id: "helios", name: "Hélios Énergie Régions", sec: "Énergie", enj: "Durabilité", fig: ["+", 240, 0, " MW"], figl: "de capacité renouvelable installée en trois ans", dur: 36, team: 8,
    bar: ["Part d'énergie renouvelable", 22, 46, "22 %", "46 %"],
    facts: [["−31 %", "d'émissions directes"], ["12", "sites équipés"], ["3 ans", "de feuille de route"]],
    ctx: "Un énergéticien régional devait concilier une trajectoire de décarbonation contraignante et des investissements limités, sans fragiliser la sécurité d'approvisionnement.",
    acts: ["Modélisation de quatre trajectoires d'investissement et de leur risque", "Priorisation des sites selon le rendement du capital engagé", "Montage d'un programme de partenariats pour partager les coûts de raccordement"],
    res: "La part d'énergie renouvelable est passée de 22 % à 46 %, avec un coût de production moyen stable sur la période." },
  { id: "saint-aubin", name: "Réseau Saint-Aubin", sec: "Santé", enj: "Transformation", fig: ["−", 35, 0, " %"], figl: "d'attente avant prise en charge aux urgences", dur: 18, team: 5,
    bar: ["Délai moyen de prise en charge", 142, 92, "142 min", "92 min"],
    facts: [["−22 %", "de passages évitables"], ["5", "sites réorganisés"], ["96 %", "de personnel associé"]],
    ctx: "Un réseau de cliniques voyait ses urgences saturées aux heures de pointe, avec des équipes épuisées et des patients mécontents de l'attente.",
    acts: ["Analyse des flux patients heure par heure sur douze mois", "Création d'un circuit court pour les cas simples, co-construit avec les soignants", "Tableau de bord partagé pour réajuster les effectifs chaque semaine"],
    res: "Le délai moyen avant prise en charge est passé de 142 à 92 minutes, sans création de poste supplémentaire." },
  { id: "norvia", name: "Norvia Logistique", sec: "Distribution", enj: "Performance", fig: ["−", 18, 0, " %"], figl: "de coût logistique par colis", dur: 14, team: 4,
    bar: ["Coût logistique par colis", 4.2, 3.45, "4,20 €", "3,45 €"],
    facts: [["−2 j", "de délai moyen"], ["6", "entrepôts regroupés"], ["+11 pts", "de remplissage"]],
    ctx: "Un distributeur multi-enseignes exploitait un réseau d'entrepôts hérité de plusieurs fusions, avec des tournées redondantes et des camions à moitié vides.",
    acts: ["Modèle de réseau pour comparer 5 scénarios de regroupement", "Refonte des tournées et mutualisation entre enseignes", "Accompagnement des équipes de site pendant la bascule"],
    res: "Le coût par colis a baissé de 18 % et les délais se sont raccourcis, ce qui a financé une partie de la hausse des salaires." },
  { id: "lac", name: "Banque Mutuelle du Lac", sec: "Services financiers", enj: "Transformation", fig: ["−", 40, 0, " %"], figl: "de délai d'ouverture de compte", dur: 12, team: 5,
    bar: ["Délai d'ouverture de compte", 10, 6, "10 jours", "6 jours"],
    facts: [["−3", "étapes de validation"], ["+9 pts", "de satisfaction"], ["2", "applications fusionnées"]],
    ctx: "Une banque mutualiste perdait des clients avant même la première opération : le parcours d'entrée en relation cumulait douze étapes et trois ressaisies.",
    acts: ["Cartographie du parcours client et mesure des abandons étape par étape", "Suppression des ressaisies et simplification des pièces demandées", "Pilote sur trois agences avant généralisation"],
    res: "Le délai d'ouverture est passé de dix à six jours, avec moins d'abandons avant la première opération." },
  { id: "rivemont", name: "Métropole de Rivemont", sec: "Secteur public", enj: "Performance", fig: ["", 12, 0, " M€"], figl: "d'économies annuelles récurrentes", dur: 20, team: 6,
    bar: ["Coût de traitement d'un dossier", 48, 31, "48 €", "31 €"],
    facts: [["−35 %", "de coût par dossier"], ["14", "démarches simplifiées"], ["0", "service fermé"]],
    ctx: "Une métropole devait financer de nouveaux services sans augmenter les impôts locaux, alors que les demandes des habitants progressaient chaque année.",
    acts: ["Revue des 40 démarches les plus fréquentes", "Regroupement de trois guichets et dématérialisation choisie, avec maintien d'un accueil physique", "Pilotage par la donnée dans chaque direction"],
    res: "Le coût de traitement d'un dossier est passé de 48 à 31 euros, et l'accueil physique a été conservé dans chaque quartier." },
  { id: "atlas", name: "Atlas Composants", sec: "Industrie", enj: "Fusion-acquisition", fig: ["", 9, 0, " mois"], figl: "pour intégrer une acquisition au lieu de 18", dur: 9, team: 7,
    bar: ["Durée d'intégration", 18, 9, "18 mois", "9 mois"],
    facts: [["24 M€", "de synergies tenues"], ["2", "usines alignées"], ["0", "départ de talent clé"]],
    ctx: "Un équipementier rachetait un concurrent plus petit mais très complémentaire. Les précédentes intégrations avaient pris deux fois plus de temps que prévu.",
    acts: ["Plan des cent premiers jours et comité d'intégration hebdomadaire", "Convergence des gammes avant celle des systèmes", "Suivi nominatif des talents clés"],
    res: "L'intégration s'est achevée en neuf mois, et les synergies annoncées au conseil ont été tenues." },
  { id: "calypso", name: "Calypso Retail", sec: "Distribution", enj: "Croissance", fig: ["+", 14, 0, " pts"], figl: "de part des ventes réalisées en ligne", dur: 24, team: 5,
    bar: ["Part des ventes en ligne", 11, 25, "11 %", "25 %"],
    facts: [["×1,6", "de panier moyen"], ["−4 pts", "de taux de retour"], ["3", "magasins convertis en relais"]],
    ctx: "Une enseigne de magasins de centre-ville voyait sa fréquentation baisser et son site en ligne n'était qu'une vitrine.",
    acts: ["Segmentation de la clientèle selon ses usages réels", "Magasins repensés en points de retrait et de conseil", "Offre en ligne alignée sur les stocks locaux"],
    res: "La part des ventes en ligne est passée de 11 % à 25 %, sans fermeture de magasin." },
];

const EXPERTISES = [
  { key: "croissance", short: "Croissance", name: "Stratégie de croissance", line: "Choisir où jouer et comment gagner.", intro: "Marchés à conquérir, offres à repenser, modèle économique à faire évoluer : nous aidons les comités de direction à trancher, puis à engager les moyens.",
    q: ["Quels marchés et quels segments méritent notre investissement ?", "Comment passer d'une croissance opportuniste à une croissance choisie ?", "Quel modèle de distribution, quels partenaires ?"], d: [["Cartographie", "des marchés et de la position concurrentielle"], ["Feuille de route", "chiffrée à trois ans"], ["Pilotage", "trimestriel des initiatives"]], case: "verdier" },
  { key: "organisation", short: "Organisation", name: "Transformation d'organisation", line: "Aligner la structure sur la stratégie.", intro: "Une stratégie échoue rarement sur le papier. Nous travaillons les rôles, les décisions et les rituels pour que l'organisation suive l'ambition.",
    q: ["Qui décide de quoi, et à quelle vitesse ?", "Comment réduire les niveaux sans perdre en expertise ?", "Comment embarquer les équipes pendant le changement ?"], d: [["Modèle cible", "d'organisation et de gouvernance"], ["Plan de déploiement", "par vagues"], ["Dispositif", "d'accompagnement des managers"]], case: "saint-aubin" },
  { key: "operations", short: "Opérations", name: "Performance opérationnelle", line: "Faire mieux avec les mêmes moyens.", intro: "Coûts, délais, qualité, stocks : nous mesurons là où la valeur se perd, avec les équipes de terrain, et installons des améliorations qui durent.",
    q: ["Où se situent les trois plus grands gisements de performance ?", "Comment réduire les délais sans dégrader la qualité ?", "Comment faire tenir les gains dans le temps ?"], d: [["Diagnostic", "chiffré, site par site"], ["Plan d'actions", "priorisé par retour sur effort"], ["Tableau de bord", "partagé avec les équipes"]], case: "norvia" },
  { key: "finance", short: "Croissance externe", name: "Finance et opérations de croissance externe", line: "Acheter, vendre, intégrer.", intro: "Évaluation d'une cible, négociation, intégration : nous intervenons de la thèse d'investissement aux cent premiers jours, avec un souci constant du calendrier.",
    q: ["La cible est-elle cohérente avec notre stratégie ?", "Quelles synergies sont réalistes, et en combien de temps ?", "Que faut-il protéger pendant l'intégration ?"], d: [["Thèse", "d'acquisition et valorisation"], ["Plan", "des cent premiers jours"], ["Suivi", "des synergies"]], case: "atlas" },
  { key: "durabilite", short: "Durabilité", name: "Transition énergétique et durabilité", line: "Décarboner sans fragiliser l'entreprise.", intro: "Trajectoires bas carbone, investissements, conformité : nous traduisons les engagements en choix financiers lisibles par les directions générales et les conseils.",
    q: ["Quelle trajectoire est tenable financièrement ?", "Quels investissements en premier ?", "Comment rendre compte des progrès de façon crédible ?"], d: [["Trajectoire", "modélisée par scénario"], ["Plan d'investissement", "phasé"], ["Indicateurs", "de suivi et de communication"]], case: "helios" },
  { key: "numerique", short: "Numérique", name: "Données et numérique", line: "Du schéma directeur aux premiers usages.", intro: "Nous aidons à choisir les chantiers numériques qui servent réellement la stratégie, à les financer et à les faire adopter, sans promesse de solution miracle.",
    q: ["Quels usages de la donnée ont le plus d'impact ici ?", "Faire, acheter ou s'associer ?", "Comment mesurer l'adoption et la valeur créée ?"], d: [["Schéma directeur", "numérique"], ["Cas d'usage", "priorisés et chiffrés"], ["Comité", "de pilotage des chantiers"]], case: "lac" },
];

const PARTNERS = [
  { n: "Hélène Marchetti", r: "Associée gérante", e: "croissance", x: "Stratégie de croissance", y: 22, b: "Ancienne directrice de la stratégie d'un groupe agroalimentaire. Dirige le cabinet depuis 2016." },
  { n: "Karim Belhadj", r: "Associé", e: "operations", x: "Performance opérationnelle", y: 18, b: "Ingénieur de formation, a conduit une vingtaine de programmes de performance dans l'industrie et la distribution." },
  { n: "Aurélie Vandenbroucke", r: "Associée", e: "organisation", x: "Transformation d'organisation", y: 16, b: "Spécialiste des organisations de santé et du secteur public, enseigne la conduite du changement." },
  { n: "Thomas Rey", r: "Associé", e: "finance", x: "Croissance externe", y: 19, b: "Ancien banquier d'affaires, accompagne les acquisitions des entreprises de taille intermédiaire." },
  { n: "Inès Carvalho", r: "Associée", e: "durabilite", x: "Transition énergétique", y: 13, b: "Ingénieure et économiste de l'énergie, a travaillé auprès de collectivités et d'énergéticiens." },
  { n: "Mathieu Lefèvre", r: "Associé", e: "numerique", x: "Données et numérique", y: 15, b: "Ancien directeur des systèmes d'information, pilote les schémas directeurs numériques." },
];

const PUBS = [
  { t: "note", date: "2026-10-14", lib: "14 octobre 2026", title: "Faut-il encore avoir une stratégie à cinq ans ?", ex: "Dans un environnement instable, la valeur d'un plan est moins dans l'horizon que dans la qualité des choix qu'il force à expliciter.", min: 7 },
  { t: "etude", date: "2026-09-02", lib: "2 septembre 2026", title: "Ce que coûte vraiment un projet de transformation qui dérape", ex: "Retour sur quarante programmes : les trois facteurs qui expliquent l'essentiel des dérives de calendrier.", min: 14 },
  { t: "barometre", date: "2026-06-18", lib: "18 juin 2026", title: "Baromètre des comités de direction, édition 2026", ex: "Priorités et inquiétudes de 180 dirigeants d'entreprises de taille intermédiaire (données de démonstration).", min: 10 },
  { t: "note", date: "2026-05-06", lib: "6 mai 2026", title: "Cinq questions avant de racheter un concurrent", ex: "Une grille courte pour tester la thèse d'acquisition avant d'engager les équipes et les honoraires.", min: 6 },
  { t: "etude", date: "2026-03-11", lib: "11 mars 2026", title: "Réduire les coûts sans réduire la qualité : ce que montrent huit cas", ex: "Les leviers qui tiennent dans la durée, et ceux dont l'effet s'évapore en un an.", min: 12 },
  { t: "barometre", date: "2025-12-04", lib: "4 décembre 2025", title: "Décarbonation : où en sont les industriels ?", ex: "Un état des lieux des engagements et des investissements réellement engagés (données de démonstration).", min: 9 },
];

const sv = (vb, body, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;
const arrow = `<svg class="cp-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
const chev = `<svg class="cp-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
const ICON = {
  croissance: sv("0 0 48 48", `<path d="M6 42h36M10 42V32h8v10M20 42V22h8v20M30 42V12h8v30" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="cp-a" d="M10 26 24 12l8 6 8-10" fill="none" stroke="#ffab1a" stroke-width="2.6"/>`),
  organisation: sv("0 0 48 48", `<rect x="18" y="5" width="12" height="9" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="34" width="12" height="9" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="32" y="34" width="12" height="9" fill="#ffab1a" stroke="currentColor" stroke-width="1.6"/><path d="M24 14v10M10 34V24h28v10" fill="none" stroke="currentColor" stroke-width="1.6"/>`),
  operations: sv("0 0 48 48", `<path d="M5 12h12l5 6-5 6H5l5-6zM27 24h12l5 6-5 6H27l5-6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="cp-a" d="M10 38h-3m31-30h3" stroke="#ffab1a" stroke-width="2.6"/><circle cx="36" cy="14" r="4" fill="#ffab1a" stroke="currentColor" stroke-width="1.4"/>`),
  finance: sv("0 0 48 48", `<circle cx="18" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="30" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M24 14.2a12 12 0 0 1 0 19.6 12 12 0 0 1 0-19.6z" fill="#ffab1a" stroke="currentColor" stroke-width="1.2"/>`),
  durabilite: sv("0 0 48 48", `<path d="M6 12c10 0 12 22 22 22h14" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="cp-dash" d="M6 40h36" stroke="currentColor" stroke-width="1.2"/><circle cx="26" cy="32" r="5" fill="#ffab1a" stroke="currentColor" stroke-width="1.4"/><path d="M6 6v34" stroke="currentColor" stroke-width="1.6"/>`),
  numerique: sv("0 0 48 48", `<path d="M24 24 9 10M24 24l16-14M24 24 9 38M24 24l16 14" stroke="currentColor" stroke-width="1.4"/><circle cx="24" cy="24" r="7" fill="#ffab1a" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="4" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="40" cy="10" r="4" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="38" r="4" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="40" cy="38" r="4" fill="#fff" stroke="currentColor" stroke-width="1.6"/>`),
};
// Grands schémas des expertises (320 × 200)
const G = 'fill="none" stroke="currentColor" stroke-width="1.2"';
const SCHEMA = {
  croissance: sv("0 0 320 200", `<path d="M30 20v160h270" ${G}/><path d="M30 180 80 140h40v-30h40V80h40V50h40" class="cp-draw" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="60" y="140" width="40" height="40" fill="#e9eef7"/><rect x="100" y="110" width="40" height="70" fill="#e9eef7"/><rect x="140" y="80" width="40" height="100" fill="#e9eef7"/><rect x="180" y="50" width="40" height="130" fill="#e9eef7"/><path class="cp-draw" d="M50 150C110 140 150 100 215 40" fill="none" stroke="#ffab1a" stroke-width="4"/><path d="m206 36 14-2-4 14z" fill="#ffab1a"/><circle class="cp-dash" cx="250" cy="34" r="16" fill="none" stroke="currentColor"/>`, "cp-sch"),
  organisation: sv("0 0 320 200", `<rect x="125" y="14" width="70" height="30" fill="#0b1530"/><path class="cp-draw" d="M160 44v22M50 66h220M50 66v20M160 66v20M270 66v20M50 130v-8M160 130v-8M270 124v8" ${G}/><rect x="15" y="86" width="70" height="30" fill="#fff" stroke="currentColor" stroke-width="1.2"/><rect x="125" y="86" width="70" height="30" fill="#ffab1a" stroke="currentColor" stroke-width="1.2"/><rect x="235" y="86" width="70" height="30" fill="#fff" stroke="currentColor" stroke-width="1.2"/><path class="cp-draw" d="M30 116v20M70 116v20M140 116v20M180 116v20M250 116v20M290 116v20" ${G}/><rect x="15" y="136" width="30" height="24" fill="#e9eef7"/><rect x="55" y="136" width="30" height="24" fill="#e9eef7"/><rect x="125" y="136" width="30" height="24" fill="#e9eef7"/><rect x="165" y="136" width="30" height="24" fill="#e9eef7"/><rect x="235" y="136" width="30" height="24" fill="#e9eef7"/><rect x="275" y="136" width="30" height="24" fill="#e9eef7"/>`, "cp-sch"),
  operations: sv("0 0 320 200", `<path d="M20 60h60l18 25-18 25H20l18-25zM112 60h60l18 25-18 25h-60l18-25zM204 60h60l18 25-18 25h-60l18-25z" fill="#fff" stroke="currentColor" stroke-width="1.4"/><path d="M112 60h60l18 25-18 25h-60l18-25z" fill="#ffab1a" stroke="currentColor" stroke-width="1.4"/><path class="cp-dash cp-draw" d="M236 118v36H60v-30" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m52 126 8-10 8 10z" fill="currentColor"/><path d="M20 30h262M20 40h140" stroke="#aeb8cf" stroke-width="1.2"/><rect x="20" y="168" width="150" height="8" fill="#e9eef7"/><rect x="20" y="168" width="94" height="8" fill="#0b1530"/>`, "cp-sch"),
  finance: sv("0 0 320 200", `<circle cx="80" cy="100" r="56" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="132" cy="100" r="56" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M106 53a56 56 0 0 1 0 94 56 56 0 0 1 0-94z" fill="#ffab1a" stroke="currentColor" stroke-width="1.2"/><path d="M215 170h95M215 20v150" ${G}/><rect x="226" y="110" width="18" height="60" fill="#0b1530"/><rect x="250" y="84" width="18" height="26" fill="#ffab1a"/><rect x="274" y="62" width="18" height="22" fill="#ffab1a"/><rect x="298" y="62" width="12" height="108" fill="#0b1530"/><path class="cp-dash cp-draw" d="M235 108V96M259 84V74M283 62" stroke="currentColor"/>`, "cp-sch"),
  durabilite: sv("0 0 320 200", `<path d="M30 20v160h280" ${G}/><path d="M30 38C90 40 120 110 190 130S260 150 300 152L300 180 30 180z" fill="#e9eef7"/><path class="cp-draw" d="M30 38C90 40 120 110 190 130S260 150 300 152" fill="none" stroke="#0b1530" stroke-width="2.4"/><path class="cp-dash" d="M30 130h270" stroke="currentColor" stroke-width="1.2"/><circle cx="168" cy="124" r="9" fill="#ffab1a" stroke="currentColor" stroke-width="1.6"/><path class="cp-dash" d="M168 124v56" stroke="currentColor"/>`, "cp-sch"),
  numerique: sv("0 0 320 200", `<path class="cp-draw" d="M160 100 60 40M160 100l110-60M160 100 60 160M160 100l110 60M160 100V30M160 100v72" ${G}/><circle cx="160" cy="100" r="24" fill="#ffab1a" stroke="currentColor" stroke-width="1.6"/><circle cx="60" cy="40" r="14" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="270" cy="40" r="14" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="60" cy="160" r="14" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="270" cy="160" r="14" fill="#fff" stroke="currentColor" stroke-width="1.6"/><circle cx="160" cy="26" r="9" fill="#0b1530"/><circle cx="160" cy="176" r="9" fill="#0b1530"/>`, "cp-sch"),
};
const MARK = sv("0 0 40 40", `<rect x="1" y="1" width="38" height="38" fill="#0b1530"/><path d="M20 1v38M1 20h38" stroke="#3a4a78" stroke-width="1"/><path d="M9 31 29 11" stroke="#ffab1a" stroke-width="4"/><path d="m22 8 10-1-1 10z" fill="#ffab1a"/>`, "cp-mark");

const bw = (v, max) => Math.max(5, Math.round((v / max) * 100 / 5) * 5);
const bars = (b, cls = "") => { const mx = Math.max(b[1], b[2]); return `<div class="cp-bars ${cls}" data-bars><p class="cp-bar-t">${esc(b[0])}</p><div class="cp-bar cp-bar--b"><span>Avant</span><i class="cp-fill cp-w${bw(b[1], mx)}"></i><b>${esc(b[3])}</b></div><div class="cp-bar cp-bar--a"><span>Après</span><i class="cp-fill cp-w${bw(b[2], mx)}"></i><b>${esc(b[4])}</b></div></div>`; };
const fig = (f) => `<span class="cp-fig" data-count="${f[1]}" data-dec="${f[2]}" ${f[0]?`data-pre="${esc(f[0])}"`:""} ${f[3]?`data-suf="${esc(f[3])}"`:""}>${esc(f[0])}${String(f[1]).replace(".", ",")}${esc(f[3])}</span>`;

const caseCard = (c, filter) => `<article class="cp-case"${filter ? ` data-secteur="${esc(c.sec)}" data-enjeu="${esc(c.enj)}"` : ""} data-reveal>
  <p class="cp-tags"><span>${esc(c.sec)}</span><span>${esc(c.enj)}</span></p>
  <div class="cp-bigfig">${fig(c.fig)}<small>${esc(c.figl)}</small></div>
  ${bars(c.bar)}
  <h3 class="cp-case-t">${esc(c.name)}</h3>
  <a class="cp-more" href="${filter ? "/etude" : "/etudes"}"${filter ? ' data-open="1"' : ""}>${filter ? "Voir le détail" : "Voir les études"} ${arrow}</a>
  ${filter ? `<div class="cp-detail"><h2 class="cp-pn-t">${esc(c.name)}</h2><p class="cp-tags"><span>${esc(c.sec)}</span><span>${esc(c.enj)}</span><span>${c.dur} mois</span></p><p class="cp-pn-ctx">${esc(c.ctx)}</p><h3>Ce que nous avons fait</h3><ul>${c.acts.map((a) => `<li>${esc(a)}</li>`).join("")}</ul><h3>Résultats</h3>${bars(c.bar, "cp-bars--l")}<dl class="cp-facts">${c.facts.map((f) => `<div><dt>${esc(f[1])}</dt><dd>${esc(f[0])}</dd></div>`).join("")}</dl><p class="cp-pn-res">${esc(c.res)}</p></div>` : ""}
</article>`;

// ---------- en-tête, méga-menu, pied ----------
const mega = () => `<div class="cp-mega" role="region" aria-label="Nos expertises"><div class="cp-mega-in">
  <div class="cp-mega-intro"><p class="cp-eyebrow">Nos expertises</p><p class="cp-mega-lead">Six façons d'aider une direction à choisir son cap, puis à le tenir.</p><a class="cp-more" href="/expertises">Toutes les expertises ${arrow}</a></div>
  <ul class="cp-mega-list">${EXPERTISES.map((e, i) => `<li><a href="/expertises#${e.key}">${ICON[e.key]}<span><b>${esc(e.name)}</b><small>${esc(e.line)}</small></span></a></li>`).join("")}</ul>
  <a class="cp-mega-case" href="/etude"><span class="cp-eyebrow">À lire</span><b>−35 %</b><span>d'attente aux urgences d'un réseau de cliniques en dix-huit mois</span><i>Voir l'étude ${arrow}</i></a></div></div>`;
const header = (c) => `<header class="cp-head pk-bleed"><div class="cp-bar-w"><div class="cp-bar-in">
  <a class="cp-logo" href="/" aria-label="${esc(c.brand)}, accueil">${MARK}<span class="cp-logo-t"><b>Cap</b><small>Conseil en stratégie</small></span></a>
  <div class="cp-nav" role="navigation" aria-label="Navigation principale">
    <a class="cp-nav-a" href="/">Accueil</a><a class="cp-nav-a cp-nav-x" href="/expertises" data-mega aria-expanded="false" aria-haspopup="true">Expertises ${chev}</a><a class="cp-nav-a" href="/etudes">Études de cas</a><a class="cp-nav-a" href="/equipe">Associés</a><a class="cp-nav-a" href="/publications">Publications</a></div>
  <a class="cp-search" href="/recherche" aria-label="Rechercher"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2"/></svg></a>
  <a class="cp-btn cp-btn--hd" href="/contact">Nous contacter</a>
  <details class="cp-burger"><summary aria-label="Menu"><span></span><span></span><span></span></summary><div class="cp-drawer" role="navigation" aria-label="Menu mobile">
    <a href="/">Accueil</a><details class="cp-sub"><summary>Expertises ${chev}</summary>${EXPERTISES.map((e) => `<a href="/expertises#${e.key}">${esc(e.name)}</a>`).join("")}<a class="cp-sub-all" href="/expertises">Toutes les expertises</a></details><a href="/etudes">Études de cas</a><a href="/equipe">Associés</a><a href="/publications">Publications</a><a href="/recherche">Recherche</a><a class="cp-btn cp-btn--block" href="/contact">Nous contacter</a></div></details>
  </div>${mega()}</div></header>`;
const footer = () => `<footer class="cp-foot pk-bleed"><div class="cp-wrap"><div class="cp-foot-top"><div class="cp-foot-brand">${MARK}<p>Cap Conseil accompagne les directions générales dans leurs choix de stratégie, d'organisation et de performance.</p></div>
  <div class="cp-foot-cols"><div><p class="cp-fh">Expertises</p>${EXPERTISES.map((e) => `<a href="/expertises#${e.key}">${esc(e.short)}</a>`).join("")}</div><div><p class="cp-fh">Cabinet</p><a href="/etudes">Études de cas</a><a href="/equipe">Associés</a><a href="/publications">Publications</a><a href="/recherche">Recherche</a></div><div><p class="cp-fh">Contact</p><address>18 quai des Chartrons<br>33000 Bordeaux</address><a href="/contact">Nous écrire</a></div></div></div>
  <p class="cp-legal">© Cap Conseil. Site de démonstration : le cabinet, les clients, les chiffres et les personnes cités sont fictifs.</p></div></footer>`;

const head = (kicker, title, sub, extra = "") => sec(`<section class="cp-ph cp-grid pk-bleed"><div class="cp-wrap"><p class="cp-eyebrow" data-reveal>${esc(kicker)}</p><div class="cp-h1" role="heading" aria-level="1" data-reveal>${title}</div>${sub ? `<p class="cp-sub-lead" data-reveal>${esc(sub)}</p>` : ""}${extra}</div></section>`);

// ---------- hero : matrice stratégique ----------
const matrix = () => `<div class="cp-mx" data-matrix>
  <div class="cp-mx-plot"><div class="cp-mx-q" data-quad="1"><i>Arbitrer</i></div><div class="cp-mx-q" data-quad="2"><i>Investir</i></div><div class="cp-mx-q" data-quad="3"><i>Redéployer</i></div><div class="cp-mx-q" data-quad="4"><i>Défendre</i></div></div>
  <svg class="cp-mx-svg" viewBox="0 0 480 440" aria-hidden="true" focusable="false">
    <path d="M56 16v368h408" fill="none" stroke="#0b1530" stroke-width="1.6"/><path d="m50 24 6-12 6 12M456 378l12 6-12 6" fill="none" stroke="#0b1530" stroke-width="1.6"/>
    <path class="cp-dash" d="M260 16v368M56 200h408" stroke="#aeb8cf" stroke-width="1"/>
    <g class="cp-mx-ticks" stroke="#0b1530" stroke-width="1.2"><path d="M56 108h8M56 292h8M148 384v-8M372 384v-8"/></g>
    <g class="cp-mx-b"><circle cx="170" cy="96" r="22" fill="#e9eef7" stroke="#0b1530" stroke-width="1.6"/><circle cx="336" cy="300" r="15" fill="#e9eef7" stroke="#0b1530" stroke-width="1.6"/><circle cx="418" cy="248" r="10" fill="#e9eef7" stroke="#0b1530" stroke-width="1.6"/><circle cx="110" cy="250" r="12" fill="#e9eef7" stroke="#0b1530" stroke-width="1.6"/></g>
    <path class="cp-dash cp-draw cp-mx-ar2" d="M192 96C250 70 300 66 340 78" fill="none" stroke="#0b1530" stroke-width="1.6"/>
    <path class="cp-draw cp-mx-ar" d="M110 328C150 290 200 288 250 236S340 122 372 100" fill="none" stroke="#ffab1a" stroke-width="5"/>
    <path class="cp-mx-head" d="m388 90-24 2 12 20z" fill="#ffab1a"/>
    <g class="cp-mx-now"><circle cx="100" cy="338" r="16" fill="#fff" stroke="#0b1530" stroke-width="2.2"/><circle cx="100" cy="338" r="5" fill="#0b1530"/><circle class="cp-mx-pulse" cx="100" cy="338" r="16" fill="none" stroke="#0b1530" stroke-width="1.4"/></g>
    <g class="cp-mx-goal"><circle class="cp-dash" cx="404" cy="84" r="30" fill="#fdeccd" stroke="#0b1530" stroke-width="1.6"/><circle cx="404" cy="84" r="9" fill="#0b1530"/></g>
  </svg>
  <span class="cp-mx-ay">Attractivité du marché</span><span class="cp-mx-ax">Position concurrentielle</span><span class="cp-mx-now-l">Aujourd'hui</span><span class="cp-mx-goal-l">Le cap</span>
  <p class="cp-mx-cap" aria-live="polite" data-cap>Survolez un quadrant : chacun appelle une décision différente.</p>
  <ul class="cp-mx-chips" aria-label="Quadrants de la matrice"><li><a href="#q2" data-qchip="2">Investir</a></li><li><a href="#q1" data-qchip="1">Arbitrer</a></li><li><a href="#q4" data-qchip="4">Défendre</a></li><li><a href="#q3" data-qchip="3">Redéployer</a></li></ul></div>`;

const home = (c) => [sec(header(c)),
  sec(`<section class="cp-hero cp-grid pk-bleed"><div class="cp-wrap cp-hero-in"><div class="cp-hero-copy"><p class="cp-eyebrow" data-reveal>Conseil en stratégie · depuis 2009</p>
    <div class="cp-h1" role="heading" aria-level="1" data-reveal>Choisir le bon cap.<br><mark>Puis l'atteindre.</mark></div>
    <p class="cp-lead" data-reveal>Nous aidons les comités de direction à trancher sur des sujets difficiles, avec des faits, des schémas lisibles et des plans que les équipes s'approprient.</p>
    <div class="cp-actions" data-reveal><a class="cp-btn cp-btn--lg" href="/contact">Parler de votre enjeu ${arrow}</a><a class="cp-btn cp-btn--line cp-btn--lg" href="/etudes">Voir nos études de cas</a></div>
    <ul class="cp-proof" data-reveal><li><b>140</b><span>dirigeants accompagnés</span></li><li><b>4</b><span>bureaux en France</span></li><li><b>6</b><span>expertises</span></li></ul></div>
    <div class="cp-hero-fig" data-reveal>${matrix()}</div></div></section>`),
  sec(`<section class="cp-stmt pk-bleed"><div class="cp-wrap"><p class="cp-stmt-t" data-reveal>Une stratégie utile tient en <mark>une page</mark>, se chiffre en <mark>trois indicateurs</mark> et se discute en <mark>une heure</mark>. Nous travaillons pour que la vôtre soit de cette sorte.</p></div></section>`),
  sec(`<section class="cp-s cp-s--white pk-bleed"><div class="cp-wrap"><div class="cp-sh"><div><p class="cp-eyebrow" data-reveal>01 · Expertises</p><h2 class="cp-h2" data-reveal>Six terrains d'intervention</h2></div><a class="cp-more" href="/expertises" data-reveal>Toutes les expertises ${arrow}</a></div>
    <ul class="cp-xgrid">${EXPERTISES.map((e, i) => `<li data-reveal><a class="cp-x" href="/expertises#${e.key}"><span class="cp-x-n">0${i + 1}</span>${ICON[e.key]}<h3>${esc(e.name)}</h3><p>${esc(e.line)}</p><i class="cp-x-go">${arrow}</i></a></li>`).join("")}</ul></div></section>`),
  sec(`<section class="cp-s cp-s--ink cp-grid cp-grid--d pk-bleed"><div class="cp-wrap"><p class="cp-eyebrow cp-eyebrow--l" data-reveal>02 · Notre méthode</p><h2 class="cp-h2 cp-h2--l" data-reveal>Quatre temps, un fil rouge</h2>
    <ol class="cp-steps" data-flow><li data-reveal><span class="cp-st-n">1</span><h3>Diagnostiquer</h3><p>Entretiens, données, observation du terrain : un état des lieux partagé avant toute recommandation.</p></li><li data-reveal><span class="cp-st-n">2</span><h3>Choisir</h3><p>Deux ou trois options chiffrées, un arbitrage clair, des critères de décision écrits.</p></li><li data-reveal><span class="cp-st-n">3</span><h3>Déployer</h3><p>Un plan par vagues, des responsables nommés, des indicateurs suivis chaque mois.</p></li><li data-reveal><span class="cp-st-n">4</span><h3>Ancrer</h3><p>Des rituels de pilotage et une équipe interne capable de poursuivre sans nous.</p></li></ol>
    <svg class="cp-flow" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="cp-draw" d="M0 20h985" stroke="#ffab1a" stroke-width="3" fill="none"/><path d="m978 8 20 12-20 12z" fill="#ffab1a"/></svg></div></section>`),
  sec(`<section class="cp-s cp-s--pale pk-bleed"><div class="cp-wrap"><div class="cp-sh"><div><p class="cp-eyebrow" data-reveal>03 · Études de cas</p><h2 class="cp-h2" data-reveal>Des résultats mesurés</h2></div><a class="cp-more" href="/etudes" data-reveal>Filtrer les études ${arrow}</a></div>
    <div class="cp-cases cp-cases--3">${[CASES[2], CASES[0], CASES[1]].map((x) => caseCard(x, false)).join("")}</div><p class="cp-note" data-reveal>Études illustratives : les organisations et les chiffres sont fictifs.</p></div></section>`),
  sec(`<section class="cp-s cp-s--amber pk-bleed"><div class="cp-wrap"><ul class="cp-counters"><li data-reveal><b data-count="140" data-dec="0">140</b><span>dirigeants accompagnés</span></li><li data-reveal><b data-count="86" data-dec="0" data-suf=" %">86 %</b><span>de nos missions confiées par des clients existants</span></li><li data-reveal><b data-count="17" data-dec="0" data-suf=" ans">17 ans</b><span>d'indépendance, sans lien avec des éditeurs</span></li><li data-reveal><b data-count="3" data-dec="0" data-suf=" mois">3 mois</b><span>durée médiane d'une mission</span></li></ul></div></section>`),
  sec(`<section class="cp-s cp-s--white pk-bleed"><div class="cp-wrap cp-pubs-h"><div><p class="cp-eyebrow" data-reveal>04 · Publications</p><h2 class="cp-h2" data-reveal>Ce que nous pensons</h2><p class="cp-muted" data-reveal>Des notes courtes, des études fondées sur nos missions et un baromètre annuel.</p><a class="cp-more" href="/publications" data-reveal>Toutes les publications ${arrow}</a></div>
    <ul class="cp-pubs">${PUBS.slice(0, 3).map((p) => pubRow(p)).join("")}</ul></div></section>`),
  sec(`<section class="cp-cta cp-grid cp-grid--d pk-bleed"><div class="cp-wrap cp-cta-in"><h2 class="cp-h2 cp-h2--l" data-reveal>Un enjeu à clarifier ?</h2><div data-reveal><p class="cp-lead cp-lead--l">Une première conversation d'une heure, sans engagement, pour poser le problème et dire si nous pouvons vous aider.</p><a class="cp-btn cp-btn--lg" href="/contact">Prendre contact ${arrow}</a></div></div></section>`),
  sec(footer())];

const TYPE = { note: "Note", etude: "Étude", barometre: "Baromètre" };
function pubRow(p) { return `<li class="cp-pub" data-type="${p.t}" data-reveal><time datetime="${p.date}">${esc(p.lib)}</time><span class="cp-pub-ty cp-ty-${p.t}">${TYPE[p.t]}</span><div><h3>${esc(p.title)}</h3><p>${esc(p.ex)}</p></div><a class="cp-pub-go" href="/contact" aria-label="Recevoir : ${esc(p.title)}"><span>Recevoir ${arrow}</span><small>${p.min} min de lecture</small></a></li>`; }

// ---------- expertises ----------
const expertises = (c) => [sec(header(c)), head("Six terrains d'intervention", "Nos <mark>expertises</mark>", "Choisissez un sujet : chaque expertise présente les questions que nous traitons et ce que vous obtenez."),
  sec(`<section class="cp-s cp-s--white pk-bleed"><div class="cp-wrap cp-xp" data-tabs="x"><div class="cp-xp-tabs" role="tablist" aria-label="Expertises">${EXPERTISES.map((e, i) => `<a href="#${e.key}" role="tab" data-tab="${e.key}"${i ? "" : ' class="is-on"'}><span class="cp-x-n">0${i + 1}</span>${esc(e.name)}</a>`).join("")}</div>
    <div class="cp-xp-panels">${EXPERTISES.slice(0, 3).map((e, i) => xpPanel(e, i)).join("")}</div></div></section>`),
  sec(`<section class="cp-xp-b pk-bleed"><div class="cp-wrap cp-xp cp-xp--b" data-tabs="x"><div class="cp-xp-tabs cp-xp-tabs--ghost" aria-hidden="true"></div><div class="cp-xp-panels">${EXPERTISES.slice(3).map((e, i) => xpPanel(e, i + 3)).join("")}</div></div></section>`),
  sec(`<section class="cp-cta cp-grid cp-grid--d pk-bleed"><div class="cp-wrap cp-cta-in"><h2 class="cp-h2 cp-h2--l">Quelle expertise pour votre sujet ?</h2><div><p class="cp-lead cp-lead--l">Décrivez votre situation en quelques lignes : nous vous indiquons l'associé le plus à même d'en parler.</p><a class="cp-btn cp-btn--lg" href="/contact">Écrire au cabinet ${arrow}</a></div></div></section>`),
  sec(footer())];
function xpPanel(e, i) { const cs = CASES.find((x) => x.id === e.case); return `<article class="cp-xpn" data-panel="${e.key}" data-group="x"><div class="cp-xpn-fig">${SCHEMA[e.key]}</div><div class="cp-xpn-body"><p class="cp-eyebrow">Expertise 0${i + 1}</p><h2 class="cp-h2">${esc(e.name)}</h2><p class="cp-lead">${esc(e.intro)}</p>
  <h3>Questions que nous traitons</h3><ul class="cp-qs">${e.q.map((q) => `<li>${esc(q)}</li>`).join("")}</ul><h3>Ce que vous obtenez</h3><dl class="cp-dl">${e.d.map((d) => `<div><dt>${esc(d[0])}</dt><dd>${esc(d[1])}</dd></div>`).join("")}</dl>
  <a class="cp-xpn-case" href="/etude"><b>${fig(cs.fig)}</b><span>${esc(cs.name)} : ${esc(cs.figl)}</span>${arrow}</a></div></article>`; }

// ---------- études de cas ----------
const chips = (label, key, list) => `<div class="cp-fgroup"><p class="cp-flabel">${label}</p><ul class="cp-chips" role="group" aria-label="${label}"><li><a href="#tous-${key}" data-f="${key}" class="is-on" aria-pressed="true">Tous</a></li>${list.map((v) => `<li><a href="#${key}-${v.toLowerCase().replace(/[^a-z]+/g, "-")}" data-f="${key}" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</a></li>`).join("")}</ul></div>`;
const etudes = (c) => [sec(header(c)), head("Résultats mesurés", "Études de <mark>cas</mark>", "Huit missions illustratives. Filtrez par secteur ou par enjeu, puis ouvrez une étude pour voir le détail."),
  sec(`<section class="cp-s cp-s--white cp-lab pk-bleed" data-filter><div class="cp-wrap"><div class="cp-filters" data-reveal>${chips("Secteur", "secteur", SECTEURS)}${chips("Enjeu", "enjeu", ENJEUX)}
    <p class="cp-count" aria-live="polite"><b data-n>8</b> <span data-nl>études affichées</span><a class="cp-reset" href="#reinitialiser" data-reset>Réinitialiser</a></p></div>
    <div class="cp-cases">${CASES.map((x) => caseCard(x, true)).join("")}</div>
    <p class="cp-empty">Aucune étude ne correspond à cette combinaison. Essayez un autre secteur ou un autre enjeu, ou <a href="/contact">posez-nous la question</a>.</p><p class="cp-note">Études illustratives : les organisations et les chiffres sont fictifs.</p></div>
    <aside class="cp-panel" role="dialog" aria-label="Détail de l'étude"><div class="cp-panel-in"><a class="cp-close" href="#fermer" data-close aria-label="Fermer le détail"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="2"/></svg></a><div class="cp-panel-body" data-pbody></div><a class="cp-btn cp-btn--block" href="/etude">Lire la fiche complète ${arrow}</a></div></aside><div class="cp-veil" data-close></div></section>`),
  sec(footer())];

// ---------- fiche étude ----------
const etude = (c) => { const k = CASES[0]; return [sec(header(c)),
  sec(`<section class="cp-ph cp-grid pk-bleed"><div class="cp-wrap"><p class="cp-crumbs" data-reveal><a href="/etudes">Études de cas</a> <span aria-hidden="true">/</span> ${esc(k.sec)}</p><div class="cp-h1" role="heading" aria-level="1" data-reveal>${esc(k.name)} : <mark>doubler l'export</mark> en trente mois</div><p class="cp-tags cp-tags--l" data-reveal><span>${esc(k.sec)}</span><span>${esc(k.enj)}</span><span>${k.dur} mois</span><span>Équipe de ${k.team}</span></p></div></section>`),
  sec(`<section class="cp-s cp-s--white pk-bleed"><div class="cp-wrap cp-fiche"><article class="cp-art">
    <h2 class="cp-h2" data-reveal>Le contexte</h2><p class="cp-lead" data-reveal>${esc(k.ctx)}</p>
    <h2 class="cp-h2" data-reveal>Le diagnostic</h2><p data-reveal>Nous avons positionné vingt-quatre marchés selon deux critères : l'attractivité du marché (taille, croissance, intensité concurrentielle) et la capacité de l'entreprise à le servir (notoriété, logistique, réglementation). Le résultat tenait sur une page.</p>
    <figure class="cp-fig2" data-reveal><div class="cp-mini">${sv("0 0 320 240", `<path d="M30 14v200h284" ${G}/><path class="cp-dash" d="M172 14v200M30 114h284" stroke="#aeb8cf"/><g fill="#e9eef7" stroke="#0b1530" stroke-width="1.4"><circle cx="70" cy="60" r="14"/><circle cx="120" cy="170" r="9"/><circle cx="90" cy="130" r="11"/><circle cx="230" cy="180" r="12"/></g><g fill="#ffab1a" stroke="#0b1530" stroke-width="1.6"><circle cx="230" cy="52" r="20"/><circle cx="270" cy="92" r="13"/><circle cx="198" cy="80" r="10"/></g><path class="cp-dash cp-draw" d="M100 190C150 170 200 120 226 78" fill="none" stroke="#0b1530" stroke-width="2"/>`, "cp-sch")}</div><figcaption>Vingt-quatre marchés positionnés : trois ressortent nettement (en ambre).</figcaption></figure>
    <h2 class="cp-h2" data-reveal>Ce que nous avons fait</h2>
    <ol class="cp-tl" data-reveal>${k.acts.map((a, i) => `<li><span>${["Mois 1 à 3", "Mois 4 à 12", "Mois 13 à 30"][i]}</span><p>${esc(a)}</p></li>`).join("")}</ol>
    <h2 class="cp-h2" data-reveal>Les résultats</h2><p data-reveal>${esc(k.res)}</p>
    <div class="cp-seg" role="group" aria-label="Afficher" data-seg><a href="#compare" data-s="compare" class="is-on" aria-pressed="true">Comparer</a><a href="#avant" data-s="avant" aria-pressed="false">Avant</a><a href="#apres" data-s="apres" aria-pressed="false">Après</a></div>
    <div class="cp-bar-stack" data-seg-t data-state="compare">${bars(k.bar, "cp-bars--l")}${bars(["Marges brutes export", 100, 118, "base 100", "118"], "cp-bars--l")}${bars(["Part du premier marché dans l'export", 70, 38, "70 %", "38 %"], "cp-bars--l")}</div>
    <h2 class="cp-h2" data-reveal>Ce que nous en retenons</h2><ul class="cp-qs" data-reveal><li>Choisir peu de marchés a produit plus que les cibler tous.</li><li>Le pilotage trimestriel par la direction a pesé autant que la stratégie elle-même.</li><li>Les partenaires locaux ont réduit le risque, mais demandé un suivi plus étroit que prévu.</li></ul></article>
    <aside class="cp-side" aria-label="Chiffres clés"><div class="cp-side-in"><p class="cp-eyebrow">Résultat principal</p><div class="cp-bigfig cp-bigfig--s">${fig(k.fig)}<small>${esc(k.figl)}</small></div><dl class="cp-facts">${k.facts.map((f) => `<div><dt>${esc(f[1])}</dt><dd>${esc(f[0])}</dd></div>`).join("")}</dl><a class="cp-btn cp-btn--block" href="/contact">Parler d'un sujet proche ${arrow}</a><a class="cp-more" href="/etudes">Toutes les études ${arrow}</a></div></aside></div></section>`),
  sec(`<section class="cp-s cp-s--pale pk-bleed"><div class="cp-wrap"><h2 class="cp-h2">Dans le même esprit</h2><div class="cp-cases cp-cases--3">${[CASES[1], CASES[3], CASES[6]].map((x) => caseCard(x, false)).join("")}</div><p class="cp-note">Étude illustrative : l'entreprise et les chiffres sont fictifs.</p></div></section>`),
  sec(footer())]; };

// ---------- associés ----------
const mono = (n, i) => sv("0 0 120 120", `<rect width="120" height="120" fill="#e9eef7"/><path d="M60 0v120M0 60h120" stroke="#d3d9e6"/><circle cx="60" cy="46" r="20" fill="#0b1530"/><path d="M20 120c0-30 18-46 40-46s40 16 40 46z" fill="#0b1530"/><rect x="${[0, 80, 0, 80, 40, 0][i % 6]}" y="${[0, 0, 100, 100, 0, 50][i % 6]}" width="40" height="20" fill="#ffab1a"/>`, "cp-mono");
const equipe = (c) => [sec(header(c)), head("Le cabinet", "Les <mark>associés</mark>", "Six associés, une règle : le partenaire qui vous rencontre en début de mission reste présent jusqu'à la fin."),
  sec(`<section class="cp-s cp-s--white pk-bleed" data-filter><div class="cp-wrap"><div class="cp-filters" data-reveal><div class="cp-fgroup"><p class="cp-flabel">Expertise</p><ul class="cp-chips" role="group" aria-label="Expertise"><li><a href="#tous-e" data-f="e" class="is-on" aria-pressed="true">Tous</a></li>${EXPERTISES.map((e) => `<li><a href="#e-${e.key}" data-f="e" data-v="${e.key}" aria-pressed="false">${esc(e.short)}</a></li>`).join("")}</ul></div><p class="cp-count" aria-live="polite"><b data-n>6</b> <span data-nl>associés affichés</span></p></div>
    <ul class="cp-people">${PARTNERS.map((p, i) => `<li class="cp-person" data-e="${p.e}" data-reveal>${mono(p.n, i)}<div class="cp-pp"><h3>${esc(p.n)}</h3><p class="cp-role">${esc(p.r)} · ${esc(p.x)}</p><p>${esc(p.b)}</p><details><summary>Parcours et interventions</summary><p>${p.y} ans de conseil. Intervient sur les sujets de ${esc(p.x.toLowerCase())}. Publie régulièrement dans la rubrique <a href="/publications">Publications</a>. Biographie fictive de démonstration.</p></details></div><a class="cp-more" href="/contact">Écrire ${arrow}</a></li>`).join("")}</ul>
    <p class="cp-empty">Aucun associé pour ce filtre.</p></div></section>`),
  sec(`<section class="cp-s cp-s--ink cp-grid cp-grid--d pk-bleed"><div class="cp-wrap"><p class="cp-eyebrow cp-eyebrow--l">Nos principes</p><h2 class="cp-h2 cp-h2--l">Trois engagements de travail</h2><ul class="cp-prin"><li><b>01</b><h3>Dire ce que nous pensons</h3><p>Une recommandation claire, même quand elle dérange, et la trace des hypothèses qui la fondent.</p></li><li><b>02</b><h3>Travailler avec vos équipes</h3><p>Chaque mission comprend des collaborateurs de l'entreprise, pour que les décisions soient comprises et reprises.</p></li><li><b>03</b><h3>Rester indépendants</h3><p>Aucune commission d'éditeur ou de fournisseur : nos conseils ne dépendent pas de ce que nous revendons.</p></li></ul></div></section>`),
  sec(footer())];

// ---------- publications ----------
const publications = (c) => [sec(header(c)), head("Notes, études, baromètres", "<mark>Publications</mark>", "Ce que nous apprenons de nos missions, résumé pour les dirigeants pressés."),
  sec(`<section class="cp-feat cp-s cp-s--pale pk-bleed"><div class="cp-wrap cp-feat-in"><div><p class="cp-eyebrow" data-reveal>À la une · Baromètre 2026</p><h2 class="cp-h2" data-reveal>Ce qui préoccupe les comités de direction</h2><p class="cp-lead" data-reveal>Cent quatre-vingts dirigeants d'entreprises de taille intermédiaire ont classé leurs priorités. Données de démonstration.</p><a class="cp-btn" href="/contact" data-reveal>Recevoir le baromètre ${arrow}</a></div>
    <div class="cp-chart" data-reveal><p class="cp-bar-t">Priorité citée « forte » ou « très forte » (en %)</p>${[["Maîtrise des coûts", 78], ["Recrutement et fidélisation", 71], ["Décarbonation", 54], ["Croissance externe", 38], ["Usages de l'IA", 62]].map((r) => `<div class="cp-hb"><span>${r[0]}</span><i class="cp-fill cp-w${Math.round(r[1] / 5) * 5}"></i><b>${r[1]}</b></div>`).join("")}</div></div></section>`),
  sec(`<section class="cp-s cp-s--white pk-bleed" data-filter><div class="cp-wrap"><div class="cp-filters"><div class="cp-fgroup"><p class="cp-flabel">Type</p><ul class="cp-chips" role="group" aria-label="Type de publication"><li><a href="#tous-t" data-f="t" class="is-on" aria-pressed="true">Tout</a></li><li><a href="#t-note" data-f="t" data-v="note" aria-pressed="false">Notes</a></li><li><a href="#t-etude" data-f="t" data-v="etude" aria-pressed="false">Études</a></li><li><a href="#t-barometre" data-f="t" data-v="barometre" aria-pressed="false">Baromètres</a></li></ul></div><p class="cp-count" aria-live="polite"><b data-n>6</b> <span data-nl>publications affichées</span></p></div>
    <ul class="cp-pubs cp-pubs--full">${PUBS.map(pubRow).join("")}</ul><p class="cp-empty">Aucune publication de ce type.</p></div></section>`),
  sec(footer())];

// ---------- contact, recherche, introuvable ----------
const contact = (c) => [sec(header(c)), head("Parlons de votre enjeu", "<mark>Contact</mark>", "Décrivez votre situation : un associé vous répond sous deux jours ouvrés."),
  sec(`<section class="cp-s cp-s--white pk-bleed"><div class="cp-wrap"><ul class="cp-ways"><li data-reveal><b>01</b><h2>Un premier échange</h2><p>Une heure pour poser le problème, sans engagement ni proposition commerciale automatique.</p></li><li data-reveal><b>02</b><h2>Une note de cadrage</h2><p>Si le sujet s'y prête, nous vous adressons en une semaine une note de deux pages : questions, approche, calendrier.</p></li><li data-reveal><b>03</b><h2>Une mission ou un conseil</h2><p>Vous décidez. Sinon, nous vous orientons vers un confrère mieux placé.</p></li></ul><address class="cp-addr" data-reveal><b>Cap Conseil</b> · 18 quai des Chartrons, 33000 Bordeaux · <a href="mailto:contact@example.com">contact@example.com</a> <small>(adresse de démonstration)</small></address></div></section>`),
  { type: "form", heading: "Écrire au cabinet", intro: "Indiquez votre secteur, votre enjeu et le calendrier souhaité. Merci de ne pas joindre d'informations confidentielles." }, sec(footer())];
const recherche = (c) => [sec(header(c)), head("Rechercher", "Une <mark>question</mark> ?", "Une expertise, une étude de cas, une publication."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher une expertise, une étude…" } }] }, sec(footer())];
const introuvable = (c) => [sec(header(c)), sec(`<section class="cp-404 cp-grid pk-bleed"><div class="cp-wrap cp-404-in"><div><p class="cp-eyebrow">Hors du cadre</p><div class="cp-h1" role="heading" aria-level="1">Page <mark>introuvable</mark></div><p class="cp-lead">Cette page n'existe pas ou a changé d'adresse. Reprenons le bon cap.</p><div class="cp-actions"><a class="cp-btn cp-btn--lg" href="/">Retour à l'accueil ${arrow}</a><a class="cp-btn cp-btn--line cp-btn--lg" href="/recherche">Rechercher</a></div></div>
  <div class="cp-404-fig">${sv("0 0 320 280", `<path d="M40 20v220h260" fill="none" stroke="#0b1530" stroke-width="1.6"/><path class="cp-dash" d="M170 20v220M40 130h260" stroke="#aeb8cf"/><circle cx="90" cy="190" r="12" fill="#fff" stroke="#0b1530" stroke-width="2"/><path class="cp-dash cp-draw" d="M100 182C150 150 200 120 270 40 310 4 330 30 330 30" fill="none" stroke="#ffab1a" stroke-width="4"/><circle cx="304" cy="30" r="9" fill="#0b1530"/>`, "cp-sch")}</div></div></section>`), sec(footer())];

module.exports = {
  key: "cap", name: "Cap", version: "2.0.0", category: "agence", tags: ["moderne", "editorial", "technique"], siteType: "Cabinet de conseil en stratégie", featured: true,
  concept: "Un cabinet qui pense en schémas : matrice stratégique dont les flèches se tracent, méga-menu par expertises et études de cas à grands chiffres filtrables.",
  description: "Cabinet de conseil en stratégie : fond blanc froid, encre bleu-nuit et un seul ambre vif, grotesque nette et serif de lecture, schéma 2×2 animé, méga-menu par expertises, études chiffrées filtrables avec avant/après et fiche en panneau.",
  brand: "Cap Conseil", modules: ["formulaires", "recherche"],
  dna: { header: "barre-blanche-fine-et-mega-menu-par-expertises-au-clic", hero: "schema-strategique-matrice-2x2-aux-fleches-tracees", grid: "etudes-de-cas-en-colonnes-a-grands-chiffres", motion: "fleches-qui-se-tracent-compteurs-et-barres-avant-apres", shapes: "reperes-en-croix-filets-fins-et-quadrants", rhythm: "alterne-blanc-froid-encre-et-quadrillage-par-chapitres-numerotes", signature: "etudes-chiffrees-filtrables-avant-apres-et-fiche-en-panneau" },
  tokens: {
    colors: { primary: "#ffab1a", secondary: "#0b1530", accent: "#ffab1a", background: "#f5f7fb", surface: "#ffffff", text: "#0b1530", muted: "#4e5b78", success: "#157347", warning: "#8a5a00", error: "#b42318" },
    fonts: { heading: "font.schibsted-grotesk", body: "font.literata", button: "font.schibsted-grotesk", link: "font.schibsted-grotesk" },
    radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#0b1530" },
    type: { h1: { size: 64, weight: 700, lineHeight: 1.04 }, h2: { size: 40, weight: 700, lineHeight: 1.1 } },
  },
  options: [
    { key: "accent", label: "Couleur d'accent (ambre)", type: "color", default: "#ffab1a" },
    { key: "ink", label: "Encre bleu-nuit", type: "color", default: "#0b1530" },
    { key: "grid", label: "Quadrillage des fonds", type: "choice", default: "on", choices: [["on", "Affiché"], ["off", "Masqué"]] },
    { key: "draw", label: "Flèches qui se tracent", type: "choice", default: "on", choices: [["on", "Animées"], ["off", "Fixes"]] },
  ],
  menu: [["Accueil", "/"], ["Expertises", "/expertises"], ["Études de cas", "/etudes"], ["Associés", "/equipe"], ["Publications", "/publications"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: home }, { key: "expertises", name: "Expertises", render: expertises }, { key: "etudes", name: "Études de cas", render: etudes }, { key: "etude", name: "Fiche étude", render: etude },
    { key: "equipe", name: "Associés", render: equipe }, { key: "publications", name: "Publications", render: publications }, { key: "contact", name: "Contact", render: contact },
    { key: "recherche", name: "Recherche", render: recherche }, { key: "introuvable", name: "Page introuvable", render: introuvable },
  ],
};
