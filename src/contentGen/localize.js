// Localisation : langue + pays → consignes de localisation (pas de traduction littérale) et exemples de formats calculés par Intl. Table courte et prudente : les moyens de paiement, la livraison
// et les obligations légales ne sont JAMAIS présumés (`payments`/`legal` = « unverified »).
const { detectLanguage } = require("./lang");

const LANGUAGES = Object.freeze({
  fr: { name: "français", level: "full" }, en: { name: "anglais", level: "full" }, es: { name: "espagnol", level: "full" }, pt: { name: "portugais", level: "full" },
  // Prises en charge selon le fournisseur : qualité non vérifiée, signalée
  de: { name: "allemand", level: "model" }, it: { name: "italien", level: "model" }, sw: { name: "swahili", level: "model" }, ln: { name: "lingala", level: "model" }, ar: { name: "arabe", level: "model" },
});
const COUNTRIES = Object.freeze({
  CD: { name: "République démocratique du Congo", currency: "CDF", alt: ["USD"], tz: "Africa/Kinshasa", metric: true, locale: "fr-CD" },
  CG: { name: "Congo-Brazzaville", currency: "XAF", alt: [], tz: "Africa/Brazzaville", metric: true, locale: "fr-CG" },
  CM: { name: "Cameroun", currency: "XAF", alt: [], tz: "Africa/Douala", metric: true, locale: "fr-CM" },
  SN: { name: "Sénégal", currency: "XOF", alt: [], tz: "Africa/Dakar", metric: true, locale: "fr-SN" },
  CI: { name: "Côte d'Ivoire", currency: "XOF", alt: [], tz: "Africa/Abidjan", metric: true, locale: "fr-CI" },
  MA: { name: "Maroc", currency: "MAD", alt: [], tz: "Africa/Casablanca", metric: true, locale: "fr-MA" },
  FR: { name: "France", currency: "EUR", alt: [], tz: "Europe/Paris", metric: true, locale: "fr-FR" },
  BE: { name: "Belgique", currency: "EUR", alt: [], tz: "Europe/Brussels", metric: true, locale: "fr-BE" },
  CH: { name: "Suisse", currency: "CHF", alt: [], tz: "Europe/Zurich", metric: true, locale: "fr-CH" },
  CA: { name: "Canada", currency: "CAD", alt: [], tz: "America/Toronto", metric: true, locale: "fr-CA" },
  US: { name: "États-Unis", currency: "USD", alt: [], tz: "America/New_York", metric: false, locale: "en-US" },
  GB: { name: "Royaume-Uni", currency: "GBP", alt: [], tz: "Europe/London", metric: true, locale: "en-GB" },
  ES: { name: "Espagne", currency: "EUR", alt: [], tz: "Europe/Madrid", metric: true, locale: "es-ES" },
  MX: { name: "Mexique", currency: "MXN", alt: [], tz: "America/Mexico_City", metric: true, locale: "es-MX" },
  PT: { name: "Portugal", currency: "EUR", alt: [], tz: "Europe/Lisbon", metric: true, locale: "pt-PT" },
  BR: { name: "Brésil", currency: "BRL", alt: [], tz: "America/Sao_Paulo", metric: true, locale: "pt-BR" },
  AO: { name: "Angola", currency: "AOA", alt: [], tz: "Africa/Luanda", metric: true, locale: "pt-AO" },
});
function sample(locale, currency) {
  try { return { number: new Intl.NumberFormat(locale).format(1234567.5), price: new Intl.NumberFormat(locale, { style: "currency", currency }).format(1234.5), date: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 2, 5))) }; }
  catch { return null; }
}
// Profil de localisation d'un couple langue/pays
function profile(language = "fr", country = "") {
  const lang = LANGUAGES[language] || null;
  const c = COUNTRIES[country] || null;
  const locale = c && c.locale.startsWith(language) ? c.locale : language;
  const notes = [];
  if (!lang) notes.push(`Langue « ${language} » hors de la liste prise en charge : génération refusée.`);
  else if (lang.level === "model") notes.push(`Langue « ${lang.name} » : qualité dépendante du fournisseur, non vérifiée — relecture indispensable.`);
  if (country && !c) notes.push(`Pays « ${country} » absent de la table de localisation : devise, formats et usages à confirmer par la personne ; aucune valeur par défaut n'est supposée.`);
  if (c && !c.metric) notes.push("Unités : système impérial usuel dans ce pays ; ne convertir que si l'information est fournie.");
  const fm = c ? sample(locale, c.currency) : null;
  return {
    language, languageName: lang ? lang.name : "", supported: Boolean(lang), level: lang ? lang.level : "none", country, countryName: c ? c.name : "", currency: c ? c.currency : "", otherCurrencies: c ? c.alt : [], timezone: c ? c.tz : "",
    metric: c ? c.metric : null, formats: fm, payments: "unverified", legal: "unverified", notes,
  };
}
function toPrompt(p, source = null) {
  const parts = [`Langue du texte : ${p.languageName || p.language}. Rédige directement dans cette langue avec des tournures naturelles et le vocabulaire professionnel local : ${source ? "adapte (localise) le texte source, ne le traduis pas mot à mot" : "pas de calque d'une autre langue"}.`];
  if (p.country) {
    parts.push(`Public : ${p.countryName || p.country}.`);
    if (p.currency) parts.push(`Si un prix est fourni, garde sa devise d'origine ; devise locale de référence : ${p.currency}${p.otherCurrencies.length ? ` (usage courant aussi : ${p.otherCurrencies.join(", ")})` : ""}. N'utilise pas une devise, une marque ou une référence d'un autre pays par défaut.`);
    if (p.formats) parts.push(`Formats locaux (exemples) : nombre ${p.formats.number} ; date ${p.formats.date}.`);
  }
  parts.push("Ne présume aucun moyen de paiement, aucune livraison ni aucune obligation légale propres à ce pays : ne les mentionne que s'ils sont fournis.");
  return parts.join("\n");
}
module.exports = { LANGUAGES, COUNTRIES, profile, toPrompt, detectLanguage };
