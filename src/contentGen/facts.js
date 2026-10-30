// Informations et anti-hallucination. Le moteur distingue quatre SOURCES : user (fourni par la personne), brief (extrait du brief analysé), external (source externe vérifiée, fournie par l'appelant),
// suggestion (idée rédactionnelle : n'est JAMAIS un fait). Seules les trois premières peuvent être affirmées dans un texte. Tout chiffre, année, contact ou adresse web absent des faits est remplacé par
// un espace réservé visible ; toute affirmation de certification, garantie, récompense, classement ou partenariat absente des faits est signalée comme critique.
const REAL = new Set(["user", "brief", "external"]);
const SOURCES = Object.freeze(["user", "brief", "external", "suggestion"]);
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

// Faits attendus par genre de page : si absents, une question est posée (jamais une invention)
const NEEDED = Object.freeze({
  accueil: ["company_name", "sector", "services"], apropos: ["company_name", "history", "mission"], services: ["services"], contact: ["email", "phone", "address"],
  portfolio: ["projects"], boutique: ["products"], blog: ["topics"], formation: ["courses"], vente: ["offer"],
});
const QUESTIONS = Object.freeze({
  company_name: "Quel est le nom exact de l'entreprise ou du projet ?", sector: "Dans quel secteur d'activité travaillez-vous ?", services: "Quels services ou produits proposez-vous (liste, même courte) ?",
  history: "Quelle est l'histoire de l'entreprise (date de création, parcours) ? Sans ces informations, aucune histoire n'est écrite.", mission: "Quelle est votre mission ou vos valeurs, en vos propres termes ?",
  email: "Quelle adresse e-mail afficher pour le contact ?", phone: "Quel numéro de téléphone afficher ?", address: "Quelle adresse physique afficher (ou aucune) ?",
  projects: "Quelles réalisations présenter (nom et description de chacune) ?", products: "Quels produits décrire (nom, caractéristiques réelles, prix si affichés) ?", topics: "Sur quels sujets souhaitez-vous publier ?",
  courses: "Quelles formations présenter ?", offer: "Quelle est l'offre exacte (contenu, prix, conditions) ?",
});

// Contexte rédactionnel : normalisé, borné ; les faits sans source réelle sont écartés
function buildContext(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  const facts = {};
  const add = (key, value, source) => {
    const k = clean(String(key || ""), 40).replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    const v = Array.isArray(value) ? value.map((x) => clean(String(x), 200)).filter(Boolean).join(" ; ") : clean(typeof value === "string" ? value : value == null ? "" : String(value), 600);
    if (!k || !v) return;
    if (!SOURCES.includes(source)) return;
    if (!REAL.has(source)) { (facts.__suggestions ||= []).push({ key: k, value: v }); return; }
    facts[k] = { value: v, source };
  };
  const company = src.company && typeof src.company === "object" ? src.company : {};
  for (const [k, v] of Object.entries(company)) add(k === "name" ? "company_name" : k, v, "user");
  for (const f of Array.isArray(src.facts) ? src.facts.slice(0, 80) : []) if (f && typeof f === "object") add(f.key, f.value, f.source || "user");
  if (src.analysis) for (const f of fromBriefAnalysis(src.analysis)) if (!facts[f.key]) add(f.key, f.value, "brief");
  const suggestions = facts.__suggestions || []; delete facts.__suggestions;
  const kw = src.keywords && typeof src.keywords === "object" ? src.keywords : {};
  const list = (v, n) => (Array.isArray(v) ? v.map((x) => clean(String(x), 60)).filter(Boolean).slice(0, n) : []);
  return {
    facts, suggestions,
    language: /^[a-z]{2}$/.test(String(src.language || "")) ? src.language : "fr", country: /^[A-Z]{2}$/.test(String(src.country || "")) ? src.country : "",
    audience: clean(src.audience, 200), tone: clean(src.tone, 80),
    keywords: { provided: list(kw.provided, 12), suggested: list(kw.suggested, 12), external: list(kw.external, 12), source: clean(kw.source, 120) },
  };
}
// Adaptateur du BriefAnalysis v1 (programme 21.3) : uniquement les faits « explicit » ou « inferred » ; une hypothèse (« assumed ») n'est jamais un fait
function fromBriefAnalysis(a) {
  const out = [];
  const ok = (f) => f && typeof f === "object" && f.value && (f.status === "explicit" || f.status === "inferred");
  const p = a && a.project ? a.project : {};
  if (ok(p.name)) out.push({ key: "company_name", value: p.name.value });
  if (ok(p.sector)) out.push({ key: "sector", value: p.sector.value });
  if (ok(p.audience)) out.push({ key: "audience", value: p.audience.value });
  if (ok(p.city)) out.push({ key: "city", value: p.city.value });
  if (a && Array.isArray(a.goals)) out.push({ key: "goals", value: a.goals.filter((g) => g.status === "explicit").map((g) => g.label || g.key) });
  return out.filter((f) => f.value && f.value.length);
}
// Faits manquants pour un genre de page, avec la question à poser
function missingFor(ctx, pageType) {
  return (NEEDED[pageType] || []).filter((k) => !ctx.facts[k]).map((k) => ({ key: k, question: QUESTIONS[k] || `Information « ${k} » ?` }));
}
const factsText = (ctx) => norm(Object.values(ctx.facts).map((f) => f.value).join(" \n "));

// ---------- Garde anti-invention ----------
// Motifs écrits sur un texte SANS accents (norm) : « certifié » → « certifie »
const CLAIMS = [
  [/\bcertifi\w*|\bcertified\b|\bcertificad\w*|\bcertificado\b/, "certification"], [/\biso ?\d{3,5}\b/, "norme ISO"], [/\bgaranti\w*|\bguarant\w*|\bgarant[i]\w*/, "garantie"],
  [/\bprimes?\b|\bawards?\b|\brecompens\w*|\bdistingu\w*|\bpremio\w*|\bpremio\w*/, "récompense"], [/\b(n ?°|numero|number)\s?(1|un|one|uno)\b|#1\b/, "classement"],
  [/\bleaders?\b|\blider\b/, "leadership"], [/\bagree\w*|\baccredit\w*|\baccredited\b|\bacreditad\w*/, "agrément"], [/\bpartenaires? officiel\w*|\bofficial partner\b/, "partenariat"],
  [/\bdes milliers\b|\bdes centaines\b|\bthousands of\b|\bhundreds of\b|\bmilhares\b|\bmiles de\b/, "effectif de clients"], [/\bsans risque\b|\brisk[- ]free\b|\bsin riesgo\b/, "promesse sans risque"],
  [/100 ?%/, "promesse absolue"], [/\ble meilleur\b|\bla meilleure\b|\bles meilleurs\b|\bthe best\b|\bel mejor\b|\bo melhor\b/, "superlatif non prouvé"],
];
const PLACEHOLDER = "[à compléter]";
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URLRE = /\bhttps?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi;
const PHONE = /(?<![\d])\+?\d(?:[\d ()-]|\.(?=\d)){7,}\d(?![\d])/g;
const NUM = /\d+(?:[.,]\d+)?/g;
const SMALL_OK = /^\s*(?:étapes?|raisons?|points?|conseils?|questions?|minutes?|steps?|reasons?|tips?|passos?|razones?|pasos?|clics?|clicks?)\b/i;

// Remplace les données chiffrées/contacts absents des faits ; signale les affirmations non étayées. Ne modifie JAMAIS un texte d'origine fourni par la personne (appelé seulement sur du texte généré).
function guard(text, context) {
  const known = factsText(context);
  const replaced = [], claims = [];
  let out = String(text ?? "");
  const inFacts = (s) => known.includes(norm(s).trim());
  out = out.replace(EMAIL, (m) => { if (inFacts(m)) return m; replaced.push({ kind: "email", match: m }); return PLACEHOLDER; });
  out = out.replace(URLRE, (m) => { if (inFacts(m)) return m; replaced.push({ kind: "url", match: m }); return PLACEHOLDER; });
  out = out.replace(PHONE, (m) => { const digits = m.replace(/\D/g, ""); if (digits.length < 8) return m; if (known.replace(/\D+/g, "").includes(digits)) return m; replaced.push({ kind: "phone", match: m.trim() }); return PLACEHOLDER; });
  out = out.replace(NUM, (m, offset, whole) => {
    if (inFacts(m)) return m;
    const after = whole.slice(offset + m.length, offset + m.length + 24);
    if (/^\d$/.test(m) || (/^\d{1,2}$/.test(m) && Number(m) <= 5)) { if (SMALL_OK.test(after)) return m; }
    // un chiffre à l'intérieur d'un espace réservé déjà posé
    const before = whole.slice(Math.max(0, offset - 20), offset);
    if (/\[[^\]]*$/.test(before)) return m;
    replaced.push({ kind: /^(19|20)\d{2}$/.test(m) ? "year" : "number", match: m });
    return PLACEHOLDER;
  });
  for (const [re, kind] of CLAIMS) {
    const hit = norm(out).match(re);
    if (!hit) continue;
    const stem = hit[0].replace(/\W+/g, " ").trim().slice(0, 8);
    if (stem && known.includes(stem)) continue;
    claims.push({ kind, match: hit[0] });
  }
  return { text: out.replace(/(\[à compléter\][\s,;]*){2,}/g, `${PLACEHOLDER} `).trim(), replaced, claims };
}
const hasPlaceholder = (s) => /\[[^\]\n]{1,80}\]/.test(String(s));
module.exports = { REAL, SOURCES, NEEDED, QUESTIONS, PLACEHOLDER, buildContext, fromBriefAnalysis, missingFor, factsText, guard, hasPlaceholder, norm, clean };
