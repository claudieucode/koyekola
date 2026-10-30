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

const fact = () => obj({ value: str, status: en(FACT_STATUS), confidence: num, evidence: str });
const analysisSchema = () => obj({
  briefLanguage: str,
  name: fact(), siteType: fact(), sector: fact(), country: fact(), city: fact(), siteLanguage: fact(), audience: fact(),
  tone: fact(), formality: fact(), style: fact(), typography: fact(),
  colors: arr(fact()),
  secondaryTypes: arr(en(Object.keys(SITE_TYPES))),
  goals: arr(obj({ key: en(Object.keys(GOALS)), status: en(FACT_STATUS), confidence: num, evidence: str })),
  features: arr(obj({ key: en(registry.featureKeys()), status: en(FACT_STATUS), confidence: num, evidence: str, reason: str })),
  pagesRequested: arr(obj({ name: str, evidence: str })),
  contradictions: arr(obj({ description: str, evidence: str })),
  missing: arr(obj({ topic: str, why: str, blocking: bool })),
  questions: arr(obj({ topic: str, question: str, why: str, blocking: bool, choices: arr(str) })),
});

const planSchema = () => obj({
  site: obj({ name: str, description: str }),
  pages: arr(obj({
    key: str, name: str, slug: str, purpose: str, description: str, pageType: str, priority: en(PRIORITIES), origin: en(["user", "ai"]),
    menu: en(MENUS), position: num, parent: str, relatedTo: arr(str),
    sections: arr(obj({
      key: str, type: str, purpose: str, description: str, expectedContent: str, widgets: arr(str), importance: en(IMPORTANCE),
      requiredData: arr(str), dependsOn: arr(en(registry.featureKeys())), origin: en(["user", "ai"]),
    })),
  })),
  navigation: obj({ main: arr(str), secondary: arr(str), footer: arr(str) }),
  features: arr(obj({ key: en(registry.featureKeys()), level: en(LEVELS), origin: en(["user", "ai"]), reason: str })),
  conversions: arr(obj({ action: en(CONVERSIONS), pageKey: str, label: str })),
  recommendations: arr(obj({ text: str, feature: str, why: str })),
});

module.exports = { VERSION, CONTRACTS, SITE_TYPES, GOALS, CONVERSIONS, FACT_STATUS, LEVELS, PRIORITIES, MENUS, IMPORTANCE, PLAN_STATUS, LIMITS, analysisSchema, planSchema };
