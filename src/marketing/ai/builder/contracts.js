// Contrats versionnés du Brief Analyzer et du Site Planner (Programme 21.3). Deux niveaux :
//  - SCHÉMAS DEMANDÉS AU MODÈLE (JSON Schema strict : tous les champs requis, additionalProperties:false) ;
//  - OBJETS NORMALISÉS produits par le serveur (seuls ceux-ci circulent vers les paliers suivants).
// La version est portée par chaque objet (`contract`, `version`) : un changement de forme = nouvelle version, les plans déjà enregistrés gardent la leur.
const registry = require("./registry");

const VERSION = 1;
const CONTRACTS = Object.freeze({ analysis: "kolakisa.brief-analysis", plan: "kolakisa.site-plan", pagePlan: "kolakisa.page-plan" });

const SITE_TYPES = Object.freeze({
  vitrine: "Site vitrine", entreprise: "Site d'entreprise", portfolio: "Portfolio", agence: "Agence", blog: "Blog", magazine: "Magazine", boutique: "Boutique en ligne",
  educatif: "Site éducatif", formation: "Plateforme de formation", immobilier: "Immobilier", restaurant: "Restaurant", hotel: "Hôtel", association: "Association",
  evenementiel: "Site événementiel", services_pro: "Services professionnels", communautaire: "Site communautaire", institutionnel: "Site institutionnel", autre: "Autre projet",
});
const GOALS = Object.freeze({
  presenter: "Présenter une entreprise ou une activité", vendre: "Vendre des produits", prospects: "Générer des prospects", devis: "Recevoir des demandes de devis",
  publier: "Publier des articles", portfolio: "Présenter un portfolio", former: "Former des utilisateurs", reserver: "Recevoir des réservations",
  informer: "Informer une communauté", contacter: "Être contacté facilement",
});
const CONVERSIONS = Object.freeze(["acheter", "devis", "reserver", "inscrire", "telecharger", "contacter", "lire", "catalogue"]);
const FACT_STATUS = Object.freeze(["explicit", "inferred", "assumed", "unknown"]);
const LEVELS = Object.freeze(["required", "recommended", "optional"]);
const PRIORITIES = Object.freeze(["essential", "recommended", "optional"]);
const MENUS = Object.freeze(["main", "secondary", "footer", "none"]);
const IMPORTANCE = Object.freeze(["essential", "important", "optional"]);
const PLAN_STATUS = Object.freeze(["draft", "pending", "validated", "modified", "to_fix"]);
const LIMITS = Object.freeze({ brief: 6000, minChars: 15, minWords: 3, pages: 12, sectionsPerPage: 30, mainMenu: 7, questions: 5, text: 400, long: 1200 });

const str = { type: "string" };
const bool = { type: "boolean" };
const num = { type: "number" };
const en = (values) => ({ type: "string", enum: [...values] });
const arr = (items) => ({ type: "array", items });
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

// Schéma d'analyse demandé au modèle — forme COMPACTE. Anthropic compile le schéma en grammaire : l'ancienne forme
// (un objet « fait » recopié 14 fois, 17 énumérations dont les listes de clés) dépassait sa limite (400 « compiled grammar
// is too large »). Ici, UN seul objet « fait » (champ nommé par `field`) et UN seul objet « signal » (objectif, fonctionnalité,
// type secondaire) ; les listes de clés autorisées sont dans la consigne et revérifiées par le serveur (brief.normalize).
const FACT_FIELDS = Object.freeze(["name", "siteType", "sector", "country", "city", "siteLanguage", "audience", "tone", "formality", "style", "typography", "color"]);
const SIGNAL_KINDS = Object.freeze(["goal", "feature", "secondaryType"]);
const analysisSchema = () => obj({
  briefLanguage: str,
  facts: arr(obj({ field: en(FACT_FIELDS), value: str, status: en(FACT_STATUS), confidence: num, evidence: str })),
  signals: arr(obj({ kind: en(SIGNAL_KINDS), key: str, status: en(FACT_STATUS), confidence: num, evidence: str, reason: str })),
  pagesRequested: arr(obj({ name: str, evidence: str })),
  contradictions: arr(obj({ description: str, evidence: str })),
  missing: arr(obj({ topic: str, why: str, blocking: bool })),
  questions: arr(obj({ topic: str, question: str, why: str, blocking: bool, choices: arr(str) })),
});

// Reconstruit la forme historique (un champ par fait) lue par brief.normalize. Une réponse déjà à l'ancienne forme
// (sans `facts`) passe telle quelle. Les clés inconnues sont ignorées ici et filtrées ensuite par le serveur.
function expandAnalysis(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.facts)) return raw;
  const out = { briefLanguage: raw.briefLanguage, colors: [], goals: [], features: [], secondaryTypes: [], pagesRequested: raw.pagesRequested, contradictions: raw.contradictions, missing: raw.missing, questions: raw.questions };
  for (const f of raw.facts) {
    if (!f || !FACT_FIELDS.includes(f.field)) continue;
    const fact = { value: f.value, status: f.status, confidence: f.confidence, evidence: f.evidence };
    if (f.field === "color") out.colors.push(fact);
    else if (!out[f.field]) out[f.field] = fact; // la première occurrence d'un champ l'emporte
  }
  for (const s of Array.isArray(raw.signals) ? raw.signals : []) {
    if (!s || !SIGNAL_KINDS.includes(s.kind)) continue;
    if (s.kind === "secondaryType") out.secondaryTypes.push(s.key);
    else (s.kind === "goal" ? out.goals : out.features).push({ key: s.key, status: s.status, confidence: s.confidence, evidence: s.evidence, reason: s.reason });
  }
  return out;
}

const planSchema = () => obj({
  site: obj({ name: str, description: str }),
  pages: arr(obj({
    key: str, name: str, slug: str, purpose: str, description: str, pageType: str, priority: en(PRIORITIES), origin: en(["user", "ai"]),
    menu: en(MENUS), position: num, parent: str, relatedTo: arr(str),
    sections: arr(obj({
      key: str, type: str, purpose: str, description: str, expectedContent: str, widgets: arr(str), importance: en(IMPORTANCE),
      requiredData: arr(str), dependsOn: arr(str), origin: en(["user", "ai"]),
    })),
  })),
  navigation: obj({ main: arr(str), secondary: arr(str), footer: arr(str) }),
  features: arr(obj({ key: str, level: en(LEVELS), origin: en(["user", "ai"]), reason: str })),
  conversions: arr(obj({ action: en(CONVERSIONS), pageKey: str, label: str })),
  recommendations: arr(obj({ text: str, feature: str, why: str })),
});

module.exports = { FACT_FIELDS, SIGNAL_KINDS, VERSION, CONTRACTS, SITE_TYPES, GOALS, CONVERSIONS, FACT_STATUS, LEVELS, PRIORITIES, MENUS, IMPORTANCE, PLAN_STATUS, LIMITS, analysisSchema, expandAnalysis, planSchema };
