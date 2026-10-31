// Visual Context Analyzer + Image Placement Planner (programme 22.7). Fonction pure : à partir du secteur, du rôle de l'image dans la page, du texte de la section et de la direction artistique,
// produit une FICHE de besoin visuel (sujet, facette, cadrage, côté du sujet / du texte, classe d'ALT, éléments à éviter, consigne de génération) et plusieurs propositions RÉELLEMENT différentes.
// Les sujets décrits sont génériques : aucun lieu, marque, personne ou produit réel n'est inventé.
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Secteurs : mots de détection, sujets par rôle, facettes (intérieur / extérieur…) détectées dans le texte de la section.
const SECTORS = [
  { id: "immobilier", re: /immobili|agence immo|propriete|logement|location de bien|promoteur/, subjects: {
    hero: ["façade d'une maison d'architecte contemporaine, jardin soigné, lumière douce", "séjour lumineux avec grandes baies vitrées et mobilier sobre"],
    service: ["intérieur d'un salon épuré en lumière naturelle", "cuisine ouverte moderne et rangée", "chambre claire avec literie neutre", "salle de bain en pierre claire"],
    editorial: ["rue résidentielle calme au crépuscule", "détail d'architecture : escalier, boiseries, lumière rasante"], product: ["intérieur d'un bien, prise de vue grand angle, rangé et lumineux"] },
    facets: { interior: { detect: /interieur|salon|cuisine|chambre|salle de bain|sejour|piece|appartement|visite/, wanted: ["interieur", "salon", "cuisine", "chambre", "sejour", "salle"], avoid: ["immeuble", "facade", "logo", "plan"] },
      exterior: { detect: /exterieur|facade|jardin|terrasse|quartier|piscine|architecture/, wanted: ["facade", "exterieur", "jardin", "terrasse", "quartier", "architecture"], avoid: ["salon", "cuisine"] } } },
  { id: "technologie", re: /tech|logiciel|saas|numerique|informatique|startup|data|cloud|application|developpe/, subjects: {
    hero: ["composition abstraite de réseaux lumineux et de formes géométriques", "poste de travail moderne avec écrans (sans texte lisible)"],
    service: ["interface d'application stylisée sur un écran, sans texte lisible", "salle de serveurs vue en perspective, éclairage froid", "circuits et lignes de données en gros plan", "équipement matériel posé sur un fond sobre"],
    editorial: ["mains sur un clavier, faible profondeur de champ (sans visage)"], product: ["appareil électronique sur fond uni, éclairage de studio"] },
    facets: { hardware: { detect: /materiel|equipement|serveur|ordinateur|appareil/, wanted: ["serveur", "materiel", "equipement", "ordinateur"], avoid: [] }, software: { detect: /logiciel|application|interface|plateforme|saas/, wanted: ["interface", "ecran", "application"], avoid: [] } } },
  { id: "sante", re: /sante|medic|clinique|cabinet|soin|dentiste|pharmac|therap|kine|hopital/, subjects: {
    hero: ["salle de soins claire et propre, lumière douce, matériel rangé", "accueil de cabinet médical apaisant, plantes et bois clair"],
    service: ["équipement médical posé sur un plan de travail propre", "mains gantées d'un professionnel de santé en action (sans visage)", "salle d'attente calme et lumineuse"],
    editorial: ["schéma pédagogique simple et neutre (illustration, sans texte)"], product: ["objet de soin sur fond uni"] },
    facets: {} },
  { id: "restauration", re: /restaura|cuisine|traiteur|gastronom|cafe|boulang|patisser|bar |brasserie/, subjects: {
    hero: ["table dressée dans une salle chaleureuse, éclairage tamisé", "comptoir et cuisine ouverte, ambiance conviviale"],
    service: ["plat dressé avec soin sur une table en bois", "ingrédients frais disposés sur un plan de travail", "brigade en cuisine vue de dos, gestes précis (sans visage)", "dessert en gros plan, lumière latérale"],
    editorial: ["détail de produits du marché, couleurs naturelles"], product: ["plat vu de dessus sur fond sobre"] },
    facets: { plats: { detect: /plat|menu|carte|dessert|entree/, wanted: ["plat", "dessert", "assiette"], avoid: ["facade"] }, ambiance: { detect: /ambiance|salle|terrasse|reservation/, wanted: ["salle", "ambiance", "table", "terrasse"], avoid: [] } } },
  { id: "portfolio", re: /portfolio|photograph|creatif|graphi|illustrat|designer|artiste|studio de creation/, variety: true, subjects: {
    hero: ["table de travail créative avec croquis et échantillons", "composition graphique de formes et de couleurs"],
    service: ["projet réalisé présenté en situation, cadrage éditorial", "détail de matière et de texture", "outils de création disposés avec soin", "maquette imprimée posée sur un fond neutre"],
    editorial: ["double page de magazine ouverte (sans texte lisible)"], product: ["création présentée sur fond neutre"] }, facets: {} },
  { id: "boutique", re: /boutique|mode|vetement|e-?commerce|commerce|magasin|bijou|cosmetique/, subjects: {
    hero: ["espace de vente minimaliste, portants et lumière naturelle", "vitrine sobre avec présentation soignée"],
    service: ["détail de tissu et de couture, gros plan texturé", "accessoires disposés sur une étagère sobre", "articles pliés sur une table en bois"],
    editorial: ["ambiance d'atelier et de matières premières"], product: ["article seul sur fond uni, éclairage de studio, ombre douce"] }, facets: {} },
  { id: "formation", re: /formation|education|ecole|cours|apprentissage|universite|coaching/, subjects: {
    hero: ["espace d'apprentissage lumineux, ordinateur portable et carnets", "atelier de groupe autour d'une table (sans visages)"],
    service: ["bibliothèque et étagères de livres", "tableau blanc avec schémas (sans texte lisible)", "mains qui prennent des notes"], editorial: ["détail de cahiers et de stylos"], product: ["support de cours posé sur un bureau"] }, facets: {} },
  { id: "construction", re: /construction|batiment|btp|chantier|renovation|menuiser|architecte|travaux/, subjects: {
    hero: ["chantier ordonné à l'aube, structure en cours d'élévation", "ossature d'un bâtiment moderne en lumière rasante"],
    service: ["détail d'un ouvrage fini, finitions soignées", "outils rangés sur un établi", "plans et casque posés sur une table de chantier"], editorial: ["vue d'architecture en contre-plongée"], product: ["matériau de construction en gros plan"] }, facets: {} },
  { id: "hotel", re: /hotel|hebergement|tourisme|voyage|gite|resort/, subjects: {
    hero: ["chambre lumineuse, lit soigneusement fait et vue dégagée", "terrasse ensoleillée avec mobilier de détente"],
    service: ["espace d'accueil élégant et calme", "salle de bain moderne en pierre claire", "détail de literie et de décoration"], editorial: ["paysage local apaisé en lumière dorée"], product: ["chambre vue de face, rangée"] }, facets: {} },
  { id: "association", re: /association|ong|institution|fondation|mairie|organisation|collectivite/, subjects: {
    hero: ["mains réunies autour d'une table de travail (sans visages)", "salle de réunion simple et lumineuse"],
    service: ["documents et carnets posés sur une table", "paysage urbain apaisé en fin de journée"], editorial: ["détail de panneaux d'information (sans texte lisible)"], product: ["objet symbolique de l'action sur fond uni"] }, facets: {} },
  { id: "blog", re: /blog|magazine|editorial|actualite|journal/, subjects: {
    hero: ["bureau d'écrivain avec carnet, tasse et lumière de fenêtre"], service: ["pile de livres et lunettes sur une table en bois", "vue sur une ville depuis une fenêtre"], editorial: ["détail d'un café et d'un carnet ouvert"], product: ["livre ouvert sur fond sobre"] }, facets: {} },
];
const DEFAULT_SECTOR = { id: "generique", subjects: {
  hero: ["composition sobre et lumineuse évoquant le professionnalisme et la confiance"], service: ["détail de matériaux naturels, lumière douce", "espace de travail ordonné vu d'en haut", "formes géométriques douces"],
  editorial: ["plantes et objets de bureau en lumière naturelle"], product: ["objet seul sur fond uni"] }, facets: {} };

// Rôles : format de GÉNÉRATION (limité à ce que les fournisseurs savent produire : 1:1, 3:2, 2:3), affichage prévu, composition, classe d'ALT.
const ROLES = {
  hero: { gen: "3:2", display: "16:9", subjectSide: "right", textSide: "left", altClass: "informative-or-decorative", detail: "Composition large avec de l'espace libre pour le texte, arrière-plan peu chargé." },
  banner: { gen: "3:2", display: "21:9", subjectSide: "center", textSide: "none", altClass: "decorative", detail: "Bande horizontale : sujet dans le tiers central, bords peu chargés pour le recadrage." },
  service: { gen: "3:2", display: "3:2", subjectSide: "center", textSide: "none", altClass: "informative", detail: "Sujet net, cadrage serré, un seul élément principal." },
  background: { gen: "3:2", display: "16:9", subjectSide: "none", textSide: "center", altClass: "decorative", detail: "Texture ou ambiance très peu détaillée, faible contraste, aucun élément à lire : le texte sera posé dessus." },
  editorial: { gen: "3:2", display: "3:2", subjectSide: "left", textSide: "right", altClass: "informative", detail: "Cadrage éditorial, sujet décalé, respiration autour." },
  product: { gen: "1:1", display: "1:1", subjectSide: "center", textSide: "none", altClass: "informative", detail: "Produit centré, fond uni, ombre douce, aucune inscription." },
  illustration: { gen: "3:2", display: "3:2", subjectSide: "center", textSide: "none", altClass: "informative", detail: "Illustration claire, formes simples, sans texte." },
  blog: { gen: "3:2", display: "16:9", subjectSide: "center", textSide: "none", altClass: "decorative-or-informative", detail: "Visuel d'article : sujet lisible en miniature, sans texte." },
  testimonial: { gen: "1:1", display: "1:1", subjectSide: "center", textSide: "none", altClass: "informative", detail: "" },
};
const MOODS = { luxe: "style premium, raffiné, contrastes doux", minimaliste: "style minimaliste, beaucoup d'espace négatif, tons neutres", corporate: "style professionnel et rassurant, net et lumineux", creatif: "style expressif et coloré, composition dynamique", editorial: "style éditorial, tons chauds de papier", tech: "style moderne et technologique, lignes nettes", ecommerce: "style commercial propre, fond épuré", institutionnel: "style sobre et institutionnel", educatif: "style accessible et chaleureux, lumière naturelle" };
const HUES = [[15, "rouge profond"], [45, "orange doré"], [70, "jaune sable"], [150, "vert"], [190, "turquoise"], [250, "bleu marine profond"], [290, "violet"], [335, "rose bordeaux"], [361, "rouge profond"]];
const hueName = (h) => (HUES.find(([m]) => h < m) || HUES[0])[1];
const NEGATIVE = "Aucun texte, lettrage, logo ni filigrane dans l'image (un fournisseur ne garantit pas leur exactitude) ; aucune personne identifiable ni visage ; aucune marque réelle.";
// Angles de prise de vue : chacun change réellement le cadrage et la lumière (pas de variantes quasi identiques)
const ANGLES = [
  { id: "ensemble", text: "plan d'ensemble, prise de vue à hauteur d'yeux, lumière du jour", side: "right" },
  { id: "detail", text: "gros plan sur un détail, faible profondeur de champ", side: "left" },
  { id: "ambiance", text: "vue large en lumière chaude de fin de journée, ambiance enveloppante", side: "center" },
  { id: "plongee", text: "vue en plongée, composition graphique et aérée", side: "right" },
];

function sectorOf(text) { const t = norm(text); return SECTORS.find((s) => s.re.test(t)) || DEFAULT_SECTOR; }
function facetOf(sector, text) { const t = norm(text); for (const [name, f] of Object.entries(sector.facets || {})) if (f.detect.test(t)) return { name, ...f }; return null; }
const sideWords = { left: "à gauche", right: "à droite", center: "au centre" };
const otherSide = (s) => (s === "left" ? "right" : s === "right" ? "left" : "center");

// input : { sectorText, role, sectionText, mood, hue, index, side, count }
function visualBrief(input = {}) {
  const role = ROLES[input.role] ? input.role : "illustration";
  const spec = ROLES[role];
  if (role === "testimonial") {
    return { role, allowed: false, reason: "Portrait de témoignage : aucune photo n'est générée pour une personne (droit à l'image, fausse preuve sociale). Utilisez la photo réelle du client avec son accord écrit.", imageClass: "informative" };
  }
  const sector = sectorOf(input.sectorText), facet = facetOf(sector, `${input.sectionText || ""}`);
  const pool = (sector.subjects[role] && sector.subjects[role].length ? sector.subjects[role] : sector.subjects.service || DEFAULT_SECTOR.subjects.service);
  const subject = pool[(input.index || 0) % pool.length];
  const subjectSide = input.side || spec.subjectSide;
  const composition = { subjectSide, textSide: spec.textSide === "none" ? "none" : spec.textSide === "center" ? "center" : (input.side ? otherSide(input.side) : spec.textSide) };
  const mood = MOODS[input.mood] || MOODS.corporate, hue = Number.isFinite(input.hue) ? input.hue : 215;
  const wanted = facet ? facet.wanted : [], avoid = facet ? facet.avoid : [];
  const orientation = spec.display === "1:1" ? "carré" : "paysage";
  const place = subjectSide === "none" ? "" : subjectSide === "center" ? " Sujet centré." : ` Sujet placé ${sideWords[subjectSide]}${composition.textSide !== "none" ? `, espace libre ${sideWords[composition.textSide]} pour le texte` : ""}.`;
  const prompt = `Photographie : ${subject}${facet ? ` (focus ${facet.name})` : ""}. ${mood} ; palette dominante ${hueName(hue)} et tons neutres harmonieux.${place} ${spec.detail} ${NEGATIVE}`.replace(/\s+/g, " ").trim();
  return { role, allowed: true, sector: sector.id, variety: Boolean(sector.variety), facet: facet ? facet.name : null, subject, ratio: spec.gen, displayRatio: spec.display, orientation, composition, wanted, avoid, imageClass: spec.altClass, prompt, mood: input.mood || "corporate", hue };
}

// N propositions différentes : sujet, angle, côté du sujet et ratio d'accroche changent ; chaque proposition garde la même identité visuelle (palette, ambiance).
function proposals(input = {}, n = 3) {
  const base = visualBrief(input);
  if (!base.allowed) return [];
  const sector = sectorOf(input.sectorText), pool = sector.subjects[base.role] || sector.subjects.service || DEFAULT_SECTOR.subjects.service;
  const count = Math.max(1, Math.min(4, n)), out = [];
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[i % ANGLES.length], b = visualBrief({ ...input, index: (input.index || 0) + i, side: base.composition.subjectSide === "none" ? undefined : angle.side });
    out.push({ ...b, angle: angle.id, prompt: b.prompt.replace(/ Photographie : /, ` Photographie, ${angle.text} : `).replace(/^Photographie : /, `Photographie, ${angle.text} : `), subjectPoolSize: pool.length });
  }
  return out;
}
module.exports = { visualBrief, proposals, sectorOf, ROLES, SECTORS, ANGLES, NEGATIVE, hueName, norm };
