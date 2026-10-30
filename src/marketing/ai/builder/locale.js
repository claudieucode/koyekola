// Contexte local : pays, devise, fuseau, langue. Table VOLONTAIREMENT courte et prudente. Elle ne dit jamais qu'un moyen de paiement, une livraison ou une
// obligation fiscale est disponible : `payments`/`legal` valent toujours « unverified ». Un pays absent de la table donne un contexte « inconnu », pas une valeur par défaut américaine.
const { norm } = require("./registry");

const COUNTRIES = {
  CD: { name: "République démocratique du Congo", names: ["rdc", "r.d.c", "congo kinshasa", "congo-kinshasa", "republique democratique du congo", "kinshasa", "lubumbashi", "goma", "kolwezi", "mbuji-mayi", "kisangani", "bukavu"], currency: "CDF", otherCurrencies: ["USD"], timezones: ["Africa/Kinshasa", "Africa/Lubumbashi"], languages: ["fr"] },
  CG: { name: "Congo-Brazzaville", names: ["congo brazzaville", "congo-brazzaville", "brazzaville", "pointe-noire"], currency: "XAF", otherCurrencies: [], timezones: ["Africa/Brazzaville"], languages: ["fr"] },
  CM: { name: "Cameroun", names: ["cameroun", "douala", "yaounde"], currency: "XAF", otherCurrencies: [], timezones: ["Africa/Douala"], languages: ["fr", "en"] },
  SN: { name: "Sénégal", names: ["senegal", "dakar"], currency: "XOF", otherCurrencies: [], timezones: ["Africa/Dakar"], languages: ["fr"] },
  CI: { name: "Côte d'Ivoire", names: ["cote d'ivoire", "cote d ivoire", "abidjan"], currency: "XOF", otherCurrencies: [], timezones: ["Africa/Abidjan"], languages: ["fr"] },
  MA: { name: "Maroc", names: ["maroc", "casablanca", "rabat", "morocco"], currency: "MAD", otherCurrencies: [], timezones: ["Africa/Casablanca"], languages: ["fr"] },
  FR: { name: "France", names: ["france", "paris", "lyon", "marseille"], currency: "EUR", otherCurrencies: [], timezones: ["Europe/Paris"], languages: ["fr"] },
  BE: { name: "Belgique", names: ["belgique", "bruxelles", "belgium"], currency: "EUR", otherCurrencies: [], timezones: ["Europe/Brussels"], languages: ["fr"] },
  CH: { name: "Suisse", names: ["suisse", "geneve", "switzerland"], currency: "CHF", otherCurrencies: [], timezones: ["Europe/Zurich"], languages: ["fr"] },
  CA: { name: "Canada", names: ["canada", "montreal", "quebec", "toronto"], currency: "CAD", otherCurrencies: [], timezones: ["America/Toronto"], languages: ["fr", "en"] },
  US: { name: "États-Unis", names: ["etats-unis", "usa", "united states", "new york"], currency: "USD", otherCurrencies: [], timezones: ["America/New_York"], languages: ["en"] },
  GB: { name: "Royaume-Uni", names: ["royaume-uni", "united kingdom", "london", "londres"], currency: "GBP", otherCurrencies: [], timezones: ["Europe/London"], languages: ["en"] },
};
// Langues que le CMS sait produire dans ce palier : le français (langue du produit) et l'anglais. Les autres sont signalées, jamais ignorées.
const SUPPORTED_LANGUAGES = ["fr", "en"];

function detectCountry(text) {
  const t = ` ${norm(text)} `;
  for (const [code, c] of Object.entries(COUNTRIES)) for (const n of c.names) if (new RegExp(`[^a-z0-9]${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z0-9]`).test(t)) return code;
  return null;
}
function contextFor(code) {
  const c = COUNTRIES[code];
  if (!c) return { code: code || null, known: false, name: "", currency: "", otherCurrencies: [], timezones: [], languages: [], payments: "unverified", legal: "unverified", note: "Pays non répertorié : devise, fuseau et usages locaux à confirmer par la personne." };
  return { code, known: true, name: c.name, currency: c.currency, otherCurrencies: c.otherCurrencies, timezones: c.timezones, languages: c.languages, payments: "unverified", legal: "unverified", note: "Moyens de paiement, livraison et obligations légales locaux : non vérifiés, à confirmer. Aucune recommandation juridique n'est donnée comme un fait." };
}

// Langue d'un texte : indices lexicaux (fr, en, es, pt). Retourne { code, confident }
const HINTS = {
  fr: ["je ", "pour ", "mon ", "une ", "des ", "les ", "avec ", "site ", "nous ", "vos ", "veux", "souhaite", "entreprise", "boutique", "et "],
  en: [" the ", " and ", " for ", " my ", " want ", " website ", " with ", " our ", " you ", " would "],
  es: [" quiero ", " para ", " una ", " con ", " mi ", " sitio ", " los ", " las ", " empresa "],
  pt: [" quero ", " para ", " uma ", " com ", " meu ", " site ", " nosso ", " empresa ", " não "],
};
function detectLanguage(text) {
  const t = ` ${norm(text)} `;
  const score = Object.fromEntries(Object.entries(HINTS).map(([k, list]) => [k, list.filter((h) => t.includes(h)).length]));
  const best = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [code, n] = best[0];
  const second = best[1][1];
  return { code: n >= 2 && n > second ? code : "unknown", confident: n >= 3 && n >= second + 2, scores: score };
}
module.exports = { COUNTRIES, SUPPORTED_LANGUAGES, detectCountry, contextFor, detectLanguage };
