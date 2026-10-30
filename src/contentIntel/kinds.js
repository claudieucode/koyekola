// Content Structure Planner : douze genres de contenu. Chacun décrit ce qu'une page de ce genre doit contenir (sections NATIVES du CMS), une longueur indicative,
// l'importance de l'appel à l'action et les faits à demander avant de rédiger. Ces attentes sont des repères éditoriaux, pas des règles de classement.
const { NEEDED } = require("../contentGen/facts");

const KINDS = Object.freeze({
  home: { label: "Page d'accueil", requires: ["hero"], recommends: ["features", "cta"], minWords: 80, cta: "required", facts: NEEDED.accueil, genre: "accueil" },
  service: { label: "Page de service", requires: ["hero", "text"], recommends: ["features", "faq", "cta"], minWords: 200, cta: "required", facts: NEEDED.services, genre: "services" },
  product: { label: "Page produit", requires: ["hero"], recommends: ["features", "faq", "cta"], minWords: 120, cta: "required", facts: NEEDED.boutique, genre: "boutique" },
  category: { label: "Page catégorie", requires: ["hero", "text"], recommends: ["list", "faq"], minWords: 100, cta: "optional", facts: NEEDED.boutique, genre: "boutique" },
  institutional: { label: "Page institutionnelle", requires: ["hero", "text"], recommends: ["list"], minWords: 150, cta: "optional", facts: NEEDED.apropos, genre: "apropos" },
  presentation: { label: "Page de présentation", requires: ["hero", "text"], recommends: ["features"], minWords: 150, cta: "optional", facts: NEEDED.apropos, genre: "apropos" },
  contact: { label: "Page de contact", requires: ["hero"], recommends: ["form"], minWords: 20, cta: "required", facts: NEEDED.contact, genre: "contact" },
  landing: { label: "Page de destination commerciale", requires: ["hero", "cta"], recommends: ["features", "faq", "form"], minWords: 150, cta: "required", facts: NEEDED.vente, genre: "vente" },
  article: { label: "Article de blog", requires: ["text"], recommends: ["faq"], minWords: 400, cta: "optional", facts: NEEDED.blog, genre: "blog" },
  case_study: { label: "Étude de cas", requires: ["hero", "text"], recommends: ["list", "cta"], minWords: 300, cta: "optional", facts: NEEDED.portfolio, genre: "portfolio" },
  faq: { label: "Page FAQ", requires: ["faq"], recommends: ["cta"], minWords: 100, cta: "optional", facts: [], genre: "faq" },
  comparison: { label: "Page de comparaison", requires: ["hero", "text"], recommends: ["list", "faq", "cta"], minWords: 300, cta: "optional", facts: [], genre: "comparaison" },
});
const RULES = [
  ["contact", /contact|nous-joindre|joindre|contacto/], ["faq", /\bfaq\b|questions?[- ]frequentes|foire/], ["comparison", /compar|\bvs\b|versus|alternative|comparativa/],
  ["case_study", /etude[- ]de[- ]cas|case[- ]study|cas[- ]client|realisation|temoignage/], ["category", /categor|collection|rayon|gamme/], ["product", /produit|product|fiche|article-boutique/],
  ["institutional", /a[- ]propos|about|notre[- ](histoire|mission|equipe|vision)|mentions|valeurs|equipe|quienes/], ["presentation", /presentation|qui[- ]sommes|entreprise|societe/],
  ["service", /service|prestation|offre|solution|tarif|servicio/], ["home", /^(accueil|home|index|inicio)?$|^accueil|^home$/], ["article", /blog|article|actualite|news|guide|tutoriel|ressource/],
];
const fold = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Genre d'une page : choix EXPLICITE de la personne d'abord, puis indices du nom/adresse, puis structure ; sinon « service » n'est PAS présumé (genre indéterminé)
function detect({ name = "", slug = "", kind = "", types = [], explicit = null, isHome = false } = {}) {
  if (explicit && KINDS[explicit]) return { kind: explicit, basis: "declared" };
  if (isHome) return { kind: "home", basis: "site_home" };
  if (kind === "landing" || kind === "funnel") return { kind: "landing", basis: "page_kind" };
  const hay = `${fold(name)} ${fold(slug)}`.trim();
  for (const [k, re] of RULES) if (re.test(hay)) return { kind: k, basis: "name_or_slug" };
  if (types.includes("form") && types.includes("cta")) return { kind: "landing", basis: "structure" };
  return { kind: null, basis: "undetermined" };
}
// Plan de structure : sections natives à créer + faits manquants à demander. N'écrit rien.
function plan(kind, { facts = {}, intent = null } = {}) {
  const k = KINDS[kind];
  if (!k) return null;
  const sections = [...new Set([...k.requires, ...k.recommends, ...(intent ? intent.structure.sections.filter((s) => k.requires.includes(s) || k.recommends.includes(s)) : [])])];
  const missing = k.facts.filter((f) => !facts[f]);
  return { kind, label: k.label, sections, minWords: k.minWords, cta: k.cta, genre: k.genre, missingFacts: missing, askBeforeWriting: missing.length > 0 };
}
module.exports = { KINDS, detect, plan, fold };
