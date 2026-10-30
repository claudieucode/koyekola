// AI Image Prompt Planner : lit la structure NATIVE des pages (sections) et le contexte du site (type, secteur, direction artistique appliquée) et fabrique des FICHES de besoin visuel avec une consigne précise.
// Emplacements d'image réellement présents dans le moteur de pages : l'image du bandeau (`hero.image`) et la section « Image » (`image.src`). Les cartes, témoignages, formations n'ont pas d'emplacement d'image propre :
// aucun besoin n'est inventé pour eux. Les visuels de produits ou de catégories de boutique n'ont aucun composant natif : ils sont signalés « sans emplacement », jamais présentés comme réalisables.
// Fonction pure : aucune base, aucun appel.
const crypto = require("node:crypto");

const RATIO_SIZE = { "1:1": "1024×1024", "3:2": "1536×1024", "2:3": "1024×1536" };
// Sujets visuels par secteur (mots-clés → sujet). Aucun lieu, marque, personne ou produit réel n'est décrit.
const SUBJECTS = [
  [/immobili/, { hero: "façade d'une maison d'architecte contemporaine avec jardin soigné, lumière douce du matin", extra: ["intérieur de salon lumineux et épuré, grandes baies vitrées", "cuisine moderne ouverte sur une salle à manger", "vue d'architecture : volumes et lignes d'un immeuble résidentiel moderne"] }],
  [/restaurant|cuisine|traiteur/, { hero: "table dressée dans une salle de restaurant chaleureuse, éclairage tamisé", extra: ["plat gastronomique dressé avec soin sur une table en bois", "comptoir et cuisine ouverte, ambiance conviviale", "détail de produits frais de saison"] }],
  [/hotel|hebergement|tourisme/, { hero: "chambre d'hôtel lumineuse avec lit soigneusement fait et vue dégagée", extra: ["espace d'accueil élégant et calme", "terrasse ensoleillée avec mobilier de détente", "salle de bain moderne en pierre claire"] }],
  [/boutique|vetement|mode|commerce|e-?commerce/, { hero: "vêtements pliés et portants dans un espace de vente minimaliste, lumière naturelle", extra: ["détail de tissu et de couture, gros plan texturé", "étagère de présentation sobre avec accessoires", "vitrine de boutique épurée"] }],
  [/formation|education|ecole|cours|apprentissage/, { hero: "espace d'apprentissage lumineux : bureau, ordinateur portable et carnets, ambiance studieuse", extra: ["atelier de groupe autour d'une table, mains et documents (sans visages)", "bibliothèque et étagères de livres", "écran d'ordinateur avec schémas abstraits"] }],
  [/tech|logiciel|saas|numerique|startup/, { hero: "composition abstraite de réseaux lumineux et de formes géométriques évoquant le numérique", extra: ["interface stylisée d'application sur un écran (sans texte lisible)", "circuits et lignes de données en perspective", "poste de travail moderne vu de dessus"] }],
  [/portfolio|photograph|creatif|agence|design/, { hero: "atelier créatif : table de travail, croquis et échantillons de couleurs", extra: ["détail de matériaux et textures", "composition graphique de formes et de couleurs", "outils de création disposés avec soin"] }],
  [/association|organisation|ong|institution/, { hero: "mains réunies autour d'une table de travail, esprit de collaboration (sans visages)", extra: ["salle de réunion simple et lumineuse", "paysage urbain apaisé en fin de journée", "détail de documents et de notes sur un bureau"] }],
  [/blog|magazine|editorial/, { hero: "bureau d'écrivain avec carnet, tasse et lumière de fenêtre", extra: ["pile de livres et lunettes sur une table en bois", "vue sur une ville depuis une fenêtre", "détail d'un café et d'un carnet ouvert"] }],
];
const DEFAULT_SUBJECT = { hero: "composition sobre et lumineuse évoquant le professionnalisme et la confiance, éléments de bureau et plantes", extra: ["détail de matériaux naturels, lumière douce", "espace de travail ordonné vu d'en haut", "formes géométriques douces et neutres"] };
const MOOD_STYLE = { luxe: "style premium, raffiné, contrastes doux, grande qualité de lumière", minimaliste: "style minimaliste, beaucoup d'espace négatif, tons neutres", corporate: "style professionnel et rassurant, net et lumineux", creatif: "style expressif et coloré, composition dynamique", editorial: "style éditorial, tons chauds de papier, composition posée", tech: "style moderne et technologique, lignes nettes, profondeur", ecommerce: "style commercial propre, fond épuré, mise en valeur nette", institutionnel: "style sobre et institutionnel, tons posés", educatif: "style accessible et chaleureux, lumière naturelle" };
const HUE_WORDS = [[15, "rouge profond"], [45, "orange doré"], [70, "jaune sable"], [150, "vert"], [190, "turquoise"], [250, "bleu marine profond"], [290, "violet"], [335, "rose bordeaux"], [361, "rouge profond"]];
const hueName = (h) => (HUE_WORDS.find(([max]) => h < max) || HUE_WORDS[0])[1];
const NEGATIVE = "Sans aucun texte, lettrage, logo ni filigrane ; aucune personne identifiable ni visage ; aucune marque réelle.";

const subjectFor = (text) => (SUBJECTS.find(([re]) => re.test(text)) || [null, DEFAULT_SUBJECT])[1];
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// context : { siteName, description, category, sector, mood, hue, imagery } ; role : "hero" | "extra"
function promptFor(context, role, n = 0) {
  const subj = subjectFor(norm(`${context.category} ${context.sector} ${context.description}`));
  const scene = role === "hero" ? subj.hero : subj.extra[n % subj.extra.length];
  const style = MOOD_STYLE[context.mood] || MOOD_STYLE.corporate;
  const palette = `palette dominante ${hueName(Number.isFinite(context.hue) ? context.hue : 215)} et tons neutres harmonieux`;
  const composition = role === "hero" ? "Composition large avec de l'espace libre sur un côté pour accueillir du texte." : "Composition équilibrée, sujet clair et net.";
  return `Photographie ${role === "hero" ? "d'ambiance" : "d'illustration"} : ${scene}. ${style} ; ${palette}. ${composition} ${NEGATIVE}`;
}
const keyOf = (pageId, sectionId, slot) => `${pageId}:${sectionId}:${slot}`;
const idOf = (key) => `need_${crypto.createHash("sha1").update(key).digest("hex").slice(0, 10)}`;

const EXTRA_RULES = [[/realisation|galerie|portfolio|projet|bien|propriete|logement/, 3], [/accueil|home/, 1]];
// pages : [{ id, name, sections: [...] }] ; renvoie les fiches (une par emplacement vide) + les besoins sans emplacement natif
function plan(context, pages) {
  const needs = [];
  for (const p of pages) {
    const secs = Array.isArray(p.sections) ? p.sections : [];
    const hero = secs.find((s) => s.type === "hero");
    const imageCount = secs.filter((s) => s.type === "image").length;
    if (hero && hero.id && !hero.image) {
      const key = keyOf(p.id, hero.id, "image");
      needs.push(fiche(key, p, hero, "hero", "image", "3:2", "Image principale du bandeau", promptFor(context, "hero"), 1, context));
    }
    const wanted = (EXTRA_RULES.find(([re]) => re.test(norm(p.name))) || [null, 0])[1];
    const anchor = hero || secs[0];
    if (anchor && anchor.id && wanted > imageCount) {
      for (let i = imageCount; i < wanted; i += 1) {
        const key = keyOf(p.id, anchor.id, `extra-${i + 1}`);
        needs.push(fiche(key, p, anchor, "image-section", `extra-${i + 1}`, "3:2", `Illustration ${i + 1} de « ${p.name} »`, promptFor(context, "extra", i), 2 + i, context));
      }
    }
  }
  if (/boutique|e-?commerce|commerce/.test(norm(`${context.category} ${context.sector}`))) {
    needs.push({ id: idOf("site:produits"), key: "site:produits", pageId: null, pageName: "", sectionId: "", widget: "", slot: "produits", mediaType: "image", description: "Images de produits et de catégories", prompt: "", style: "", format: "png", ratio: "1:1", width: 1024, height: 1024, priority: 9, status: "no_slot", reason: "Kolakisa n'a pas de composant produit ni de catégorie de boutique : aucun emplacement natif pour ces images." });
  }
  return needs;
}
function fiche(key, page, section, widget, slot, ratio, description, prompt, priority, context) {
  const [w, h] = RATIO_SIZE[ratio].split("×").map(Number);
  return { id: idOf(key), key, pageId: page.id, pageName: page.name, sectionId: section.id, widget, slot, mediaType: "image", description, prompt, style: MOOD_STYLE[context.mood] || MOOD_STYLE.corporate, format: "png", ratio, width: w, height: h, priority, status: "needed", reason: "" };
}
// Texte alternatif d'une image GÉNÉRÉE : repris de ce qui a été demandé (jamais d'information inventée sur l'image réelle). Contexte réel du site si connu.
function altFor(need) {
  const base = String(need.description || "").replace(/^Image principale du bandeau$/, "Illustration d'ambiance").replace(/\s+/g, " ").trim();
  return `${base} (image générée)`.slice(0, 200);
}
module.exports = { plan, promptFor, altFor, keyOf, RATIO_SIZE, NEGATIVE, subjectFor, hueName };
