// E-commerce Brief Analyzer + Business Model Analyzer. ANALYSE À RÈGLES (aucun modèle d'IA, aucun coût, aucun envoi de texte à un fournisseur) : elle extrait ce que le texte dit,
// avec la PREUVE (l'extrait), et sépare strictement trois choses :
//   facts       : dit explicitement dans le texte (ou corrigé par la personne) ;
//   assumptions : déduit d'un indice faible (ex. devise habituelle d'un pays) — toujours signalé, jamais présenté comme un fait ;
//   missing     : à demander (nom de la boutique, pays, devise, types de produits…).
// Un modèle commercial n'est « supporté » que d'après les capacités RÉELLES du moteur (capabilities.MODEL_SUPPORT).
const { detectSector, norm, SECTORS } = require("./library");
const { MODEL_SUPPORT } = require("./capabilities");

const COUNTRIES = [
  ["CD", "République démocratique du Congo", ["rdc", "r.d.c", "kinshasa", "lubumbashi", "goma", "congo-kinshasa", "republique democratique du congo"], "CDF"], ["CG", "Congo-Brazzaville", ["brazzaville", "pointe-noire", "congo-brazzaville"], "XAF"],
  ["FR", "France", ["france", "paris", "lyon", "marseille", "francais"], "EUR"], ["BE", "Belgique", ["belgique", "bruxelles", "belge"], "EUR"], ["CH", "Suisse", ["suisse", "geneve", "zurich"], "CHF"],
  ["CA", "Canada", ["canada", "quebec", "montreal", "ontario"], "CAD"], ["CM", "Cameroun", ["cameroun", "douala", "yaounde"], "XAF"], ["SN", "Sénégal", ["senegal", "dakar"], "XOF"],
  ["CI", "Côte d'Ivoire", ["cote d'ivoire", "abidjan", "ivoirien"], "XOF"], ["MA", "Maroc", ["maroc", "casablanca", "rabat", "marrakech"], "MAD"], ["TN", "Tunisie", ["tunisie", "tunis"], "TND"],
  ["DZ", "Algérie", ["algerie", "alger"], "DZD"], ["ML", "Mali", ["mali", "bamako"], "XOF"], ["BJ", "Bénin", ["benin", "cotonou"], "XOF"], ["TG", "Togo", ["togo", "lome"], "XOF"], ["GA", "Gabon", ["gabon", "libreville"], "XAF"],
  ["RW", "Rwanda", ["rwanda", "kigali"], "RWF"], ["US", "États-Unis", ["etats-unis", "usa", "new york", "americain"], "USD"], ["GB", "Royaume-Uni", ["royaume-uni", "londres", "angleterre"], "GBP"],
];
const CURRENCIES = [["EUR", ["euro", "euros", "eur", "€"]], ["USD", ["dollar", "dollars", "usd", "$"]], ["XOF", ["fcfa", "xof", "franc cfa"]], ["XAF", ["xaf"]], ["CDF", ["franc congolais", "cdf"]], ["MAD", ["dirham", "mad"]], ["CAD", ["dollar canadien", "cad"]], ["GBP", ["livre sterling", "gbp"]], ["CHF", ["franc suisse", "chf"]]];

// Extrait autour de l'élément trouvé. La recherche se fait sur une version sans accents DE MÊME LONGUEUR que le texte (un caractère → un caractère), pour que les positions coïncident.
const flat = (t) => t.replace(/[^]/g, (c) => { const x = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); return x ? x[0] : " "; });
const snippet = (text, needle) => { const t = text.replace(/\s+/g, " "); const i = flat(t).indexOf(norm(needle)); return i < 0 ? needle : t.slice(Math.max(0, i - 40), i + needle.length + 40).trim(); };
const has = (n, words) => words.find((w) => n.includes(w));

function analyze(text, overrides = {}) {
  const raw = String(text ?? "").replace(/\u0000/g, "").trim();
  const n = ` ${norm(raw)} `;
  const facts = {}, assumptions = [], missing = [], warnings = [];
  const fact = (key, value, evidence) => { facts[key] = { value, status: "explicit", evidence }; };

  // Nom de la boutique : seulement s'il est écrit entre guillemets ou après « nommée / appelée »
  const nm = raw.match(/(?:boutique|magasin|marque|site)[^.«"]{0,40}(?:nomm[ée]e?|appel[ée]e?|intitul[ée]e?)\s*[«"']?([^»"'.,\n]{2,60})/i) || raw.match(/[«"]([^»"]{2,60})[»"]/);
  if (nm) fact("shopName", nm[1].trim(), snippet(raw, nm[1])); else missing.push({ key: "shopName", question: "Quel est le nom de la boutique ou de la marque ?" });

  // Secteur
  const sector = detectSector(raw);
  if (sector.score > 0) fact("sector", sector.key, snippet(raw, sector.evidence));
  else { missing.push({ key: "sector", question: "Quels types de produits comptez-vous vendre ?" }); assumptions.push({ key: "sector", value: "general", reason: "Aucun secteur reconnu : structure minimale proposée." }); }

  // Pays
  const c = COUNTRIES.find(([, , keys]) => has(n, keys.map(norm)));
  if (c) fact("country", c[0], snippet(raw, has(n, c[2].map(norm)) || c[1])); else missing.push({ key: "country", question: "Dans quel pays la boutique est-elle exploitée ?" });
  const sold = COUNTRIES.filter(([, , keys]) => has(n, keys.map(norm))).map(([code]) => code);
  if (sold.length > 1) fact("markets", sold, `Plusieurs pays cités : ${sold.join(", ")}`);

  // Langue
  const fr = /\b(je|nous|une|des|les|pour|boutique|vendre|vente|produits?)\b/.test(norm(raw)); const en = /\b(i want|we sell|online store|shop for|products)\b/.test(norm(raw));
  if (fr && !en) fact("language", "fr", "Texte rédigé en français"); else if (en && !fr) fact("language", "en", "Texte rédigé en anglais"); else missing.push({ key: "language", question: "Dans quelle langue la boutique doit-elle être rédigée ?" });

  // Devise : explicite seulement si écrite ; sinon HYPOTHÈSE signalée (devise usuelle du pays), jamais un fait
  const cur = CURRENCIES.find(([, keys]) => keys.some((k) => (k.length <= 3 ? new RegExp(`(^|[^a-z])${k.replace("$", "\\$")}($|[^a-z])`, "i").test(raw) : n.includes(norm(k)))));
  if (cur) fact("currency", cur[0], snippet(raw, cur[1][0]));
  else if (c) { assumptions.push({ key: "currency", value: c[3], reason: `Devise usuelle de ${c[1]} : à confirmer, aucun prix n'est converti.` }); missing.push({ key: "currency", question: "Dans quelle devise affichez-vous vos prix ?" }); }
  else missing.push({ key: "currency", question: "Dans quelle devise affichez-vous vos prix ?" });

  // Positionnement et public
  const pos = has(n, ["luxe", "premium", "haut de gamme", "artisanal", "ecologique", "pas cher", "petit prix", "discount", "abordable", "sur mesure"]);
  if (pos) fact("positioning", pos, snippet(raw, pos));
  const aud = has(n, ["professionnel", "entreprises", "b2b", "particuliers", "etudiants", "enfants", "femmes", "hommes", "jeunes"]);
  if (aud) fact("audience", aud, snippet(raw, aud)); else missing.push({ key: "audience", question: "À qui vendez-vous (particuliers, professionnels, public précis) ?" });

  // Canaux
  const channels = ["whatsapp", "facebook", "instagram", "tiktok", "marketplace", "magasin physique", "boutique physique", "retrait"].filter((k) => n.includes(k));
  if (channels.length) fact("channels", channels, `Canaux cités : ${channels.join(", ")}`);

  // Modèles commerciaux (preuve + prise en charge réelle)
  const models = [];
  const add = (key, evidence) => models.push({ key, ...MODEL_SUPPORT[key], evidence });
  const digital = has(n, ["numerique", "telechargeable", "ebook", "e-book", "licence", "logiciel", "formation en ligne"]);
  const physical = has(n, ["livraison", "livrer", "physique", "stock", "colis", "expedi", "vetement", "ordinateur", "chaussure", "meuble", "cosmetique", "bijou"]) || (!digital && sector.score > 0);
  if (physical) add("physical", snippet(raw, physical === true ? "produits" : physical));
  if (digital) add("digital", snippet(raw, digital));
  const custom = has(n, ["personnalis", "sur mesure", "gravure", "broderie"]); if (custom) add("custom", snippet(raw, custom));
  const service = has(n, ["prestation", "reservation", "rendez-vous", "abonnement de service", "cours particuliers"]); if (service) add("service", snippet(raw, service));
  const single = has(n, ["un seul produit", "mono-produit", "monoproduit", "produit unique"]); if (single) add("single_product", snippet(raw, single));
  else if (sector.score > 0 || has(n, ["categories", "catalogue", "gamme"])) add("multi_category", snippet(raw, sector.evidence || "catalogue"));
  const brand = has(n, ["multimarque", "plusieurs marques", "differentes marques"]); if (brand) add("multi_brand", snippet(raw, brand));
  const whole = has(n, ["en gros", "grossiste", "revendeurs"]); if (whole) add("wholesale", snippet(raw, whole));
  const drop = has(n, ["dropshipping", "drop shipping", "drop-shipping"]); if (drop) add("dropshipping", snippet(raw, drop));
  if (!models.length) { missing.push({ key: "businessModel", question: "Vendez-vous des produits physiques, numériques, ou des services ?" }); }
  for (const m of models) if (m.status === "unsupported") warnings.push(`« ${m.label} » n'est pas pris en charge par le moteur de boutique : ${m.reason}`);
  for (const m of models) if (m.status === "partial") warnings.push(`« ${m.label} » n'est pris en charge qu'en partie : ${m.reason}`);

  // Corrections de la personne : un fait corrigé devient explicite et sa preuve est « corrigé par vous »
  for (const [k, v] of Object.entries(overrides || {})) {
    if (v === null || v === "") { delete facts[k]; continue; }
    facts[k] = { value: v, status: "explicit", evidence: "Précisé ou corrigé par vous." };
  }
  const known = new Set(Object.keys(facts));
  const stillMissing = missing.filter((m) => !known.has(m.key));
  const sectorKey = facts.sector ? facts.sector.value : "general";
  return {
    engine: "règles (sans IA)", facts, assumptions: assumptions.filter((a) => !known.has(a.key)), missing: stillMissing, models, warnings,
    sector: { key: sectorKey, label: (SECTORS[sectorKey] || SECTORS.general).label },
    readiness: stillMissing.some((m) => ["country", "sector"].includes(m.key)) ? "insufficient" : stillMissing.length > 2 ? "partial" : "good",
  };
}
module.exports = { analyze, COUNTRIES, CURRENCIES };
