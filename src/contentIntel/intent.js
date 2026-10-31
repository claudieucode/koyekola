// Search Intent Analyzer : classe une requête (mot-clé principal) en intention informationnelle, navigationnelle, commerciale, transactionnelle ou locale.
// Méthode : indices lexicaux listés (fr, en, es), preuves rendues à l'utilisateur. C'est une ESTIMATION à règles, jamais une mesure issue d'un moteur de recherche :
// aucun volume, aucune difficulté, aucune donnée de résultats n'est produit. Une requête sans indice reste « indéterminée » au lieu d'être devinée.
const fold = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");

const CUES = Object.freeze({
  transactional: ["acheter", "achat", "commander", "commande", "prix", "tarif", "tarifs", "devis", "reserver", "reservation", "inscription", "s inscrire", "telecharger", "souscrire", "buy", "order", "price", "pricing", "quote", "book", "booking", "subscribe", "download", "comprar", "precio", "reservar", "cotizacion"],
  commercial: ["meilleur", "meilleurs", "meilleure", "comparatif", "comparer", "avis", "versus", " vs ", "alternative", "top ", "choisir", "classement", "test ", "best", "review", "reviews", "compare", "comparison", "alternatives", "mejor", "opiniones", "comparativa"],
  informational: ["comment", "pourquoi", "quest ce", "qu est", "c est quoi", "definition", "guide", "tutoriel", "exemple", "exemples", "conseils", "astuces", "difference", "quand", "combien de temps", "how ", "what is", "why ", "guide", "tutorial", "examples", "tips", "difference", "como ", "que es", "por que", "ejemplos"],
  navigational: ["connexion", "se connecter", "login", "log in", "sign in", "mon compte", "site officiel", "contact", "contacter", "espace client", "official site", "my account", "iniciar sesion"],
  local: ["pres de", "proche de", "autour de", "a proximite", "dans ma ville", "near me", "nearby", "close to", "cerca de", "cerca", "adresse", "horaires", "ouvert"],
});
const LABELS = Object.freeze({ informational: "Informationnelle", navigational: "Navigationnelle", commercial: "Commerciale (comparaison)", transactional: "Transactionnelle", local: "Locale", undetermined: "Indéterminée" });

// Structure de contenu conseillée par intention : des SECTIONS NATIVES du CMS (hero, text, features, faq, cta, form, list), pas un format parallèle
const STRUCTURE = Object.freeze({
  informational: { sections: ["hero", "text", "list", "faq"], advice: "Répondre d'abord à la question, développer par intertitres, finir par une FAQ ; un seul appel à l'action discret.", cta: "soft" },
  navigational: { sections: ["hero", "text", "button"], advice: "Rendre la destination évidente : nom, accès direct, coordonnées ; peu de texte.", cta: "direct" },
  commercial: { sections: ["hero", "features", "list", "faq", "cta"], advice: "Présenter des critères de choix vérifiables, une comparaison honnête, puis une action.", cta: "medium" },
  transactional: { sections: ["hero", "features", "text", "faq", "cta", "form"], advice: "Offre claire, réassurance vérifiable (seulement ce qui est fourni), conditions visibles, action principale répétée.", cta: "strong" },
  local: { sections: ["hero", "text", "features", "faq", "cta"], advice: "Indiquer la zone servie, l'adresse et les horaires RÉELS ; ne pas fabriquer de pages par ville sans contenu propre.", cta: "medium" },
  undetermined: { sections: ["hero", "text", "cta"], advice: "Préciser le mot-clé principal pour obtenir une structure adaptée.", cta: "soft" },
});
// Intention attendue par défaut selon le genre de page, quand aucun mot-clé n'est saisi
const BY_KIND = Object.freeze({ home: "navigational", service: "transactional", product: "transactional", category: "commercial", institutional: "navigational", presentation: "informational", contact: "navigational", landing: "transactional", article: "informational", case_study: "informational", faq: "informational", comparison: "commercial" });

function analyze(keyword, { kind = null, city = "", brand = "" } = {}) {
  const k = ` ${fold(keyword).trim()} `;
  if (k.trim().length < 2) return { intent: "undetermined", label: LABELS.undetermined, basis: "no_keyword", expectedFromKind: kind ? BY_KIND[kind] || null : null, scores: {}, evidence: [], structure: STRUCTURE.undetermined, note: "Aucun mot-clé principal : l'intention ne peut pas être estimée." };
  const scores = {}, evidence = [];
  // un indice qui OUVRE la requête (« comment … », « prix … ») pèse double : il en donne la forme ; les autres indices la nuancent
  for (const [intent, cues] of Object.entries(CUES)) for (const c of cues) if (k.includes(c.startsWith(" ") || c.endsWith(" ") ? c : ` ${c}`) || k.includes(c)) { scores[intent] = (scores[intent] || 0) + (k.trimStart().startsWith(c.trim()) ? 2 : 1); evidence.push({ intent, cue: c.trim() }); break; }
  const cityF = fold(city).trim(), brandF = fold(brand).trim();
  if (cityF.length >= 3 && k.includes(cityF)) { scores.local = (scores.local || 0) + 1; evidence.push({ intent: "local", cue: `ville « ${city} »` }); }
  if (brandF.length >= 3 && k.includes(brandF)) { scores.navigational = (scores.navigational || 0) + 1; evidence.push({ intent: "navigational", cue: `nom de la marque « ${brand} »` }); }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const intent = top ? top[0] : "undetermined";
  const mixed = ranked.length > 1 && ranked[1][1] === top[1] ? ranked.slice(0, 2).map((r) => r[0]) : null;
  return { intent, label: LABELS[intent], basis: top ? "lexical_cues" : "no_cue", mixed, expectedFromKind: kind ? BY_KIND[kind] || null : null, scores, evidence, structure: STRUCTURE[intent],
    note: top ? "Estimation à règles à partir de la formulation ; non issue d'un moteur de recherche. À confirmer par vous." : "Aucun indice lexical : intention indéterminée, plutôt que devinée." };
}
// Cohérence entre l'intention estimée et la structure réelle de la page : écarts constatés (jamais « Google exige »)
function matchStructure(analysis, doc) {
  const wanted = analysis.structure.sections, have = new Set(doc.types.concat(doc.faq.length ? ["faq"] : []));
  const missing = wanted.filter((t) => !have.has(t) && !(t === "list" && have.has("features")) && !(t === "button" && have.has("hero")) && !(t === "text" && (have.has("features") || doc.words.length > 150)));
  return { wanted, missing, ratio: wanted.length ? Math.round(((wanted.length - missing.length) / wanted.length) * 100) / 100 : 1 };
}
module.exports = { analyze, matchStructure, LABELS, STRUCTURE, BY_KIND, CUES, fold };
