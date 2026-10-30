// Content Quality Validator. Classe les constats en critical | important | improve | suggestion et distingue le CERTAIN (mesuré : longueur, donnée inventée, mot interdit) du PROBABLE (`certain:false` : style,
// langue, répétition). Aucune note de qualité : seulement des comptes, car une note de « qualité rédactionnelle » ne serait pas une mesure objective. Pas de correcteur orthographique hors ligne :
// seules les fautes mécaniques sont détectées (mot doublé, espaces, ponctuation) — la relecture humaine reste nécessaire.
const facts = require("./facts");
const voiceLib = require("./voice");
const { detectLanguage } = require("./lang");

const SEVERITIES = Object.freeze(["critical", "important", "improve", "suggestion"]);
const issue = (severity, code, field, message, certain = true, extra = {}) => ({ severity, code, field, message, certain, ...extra });
const sentences = (t) => String(t).split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 5);
const norm = facts.norm;

// Un champ : texte final (déjà passé par la garde) + sa description
function checkField(field, text, { context, voice, language = "fr", trusted = false } = {}) {
  const out = [];
  const v = String(text ?? "");
  if (!v.trim()) { out.push(issue("important", "empty", field.key, `Champ « ${field.label} » vide.`)); return out; }
  if (v.length > field.max) out.push(issue("critical", "too_long", field.key, `Champ « ${field.label} » : ${v.length} caractères, ${field.max} au plus.`));
  if (facts.hasPlaceholder(v)) out.push(issue("important", "placeholder", field.key, `Champ « ${field.label} » : contient un espace réservé à compléter avant publication.`));
  // Un texte écrit par une personne (trusted) est sa propre source : seule une IA est soumise à la garde anti-invention
  const g = trusted ? { replaced: [], claims: [] } : facts.guard(v, context);
  for (const r of g.replaced) out.push(issue("critical", "invented_fact", field.key, `Donnée non fournie (${r.kind} « ${r.match} »).`, true));
  for (const c of g.claims) out.push(issue("critical", "unsupported_claim", field.key, `Affirmation non étayée par les informations fournies : ${c.kind} (« ${c.match} »).`, true, { claim: c.kind }));
  const words = v.split(/\s+/).filter(Boolean);
  if (/\b(\p{L}{2,})\s+\1\b/iu.test(v)) out.push(issue("improve", "double_word", field.key, "Mot répété consécutivement."));
  if (/ {2,}/.test(v.replace(/\n/g, " "))) out.push(issue("suggestion", "double_space", field.key, "Espaces multiples."));
  if (language === "fr" && /\S[;:!?]/.test(v.replace(/https?:\/\/\S+/g, "").replace(/\d:\d/g, ""))) out.push(issue("suggestion", "fr_punctuation", field.key, "Typographie française : espace avant ; : ! ?.", false));
  if (/!{2,}|\?{2,}/.test(v)) out.push(issue("improve", "punct_series", field.key, "Ponctuation répétée (!!, ??)."));
  if (words.filter((w) => w.length > 3 && w === w.toUpperCase() && /\p{L}/u.test(w)).length >= 2) out.push(issue("improve", "caps", field.key, "Mots en majuscules : ton criard.", false));
  if (words.length >= 8) {
    const d = detectLanguage(v);
    if (d.code !== "unknown" && d.code !== language) out.push(issue("important", "language_mismatch", field.key, `Le texte semble être en « ${d.code} » alors que la langue attendue est « ${language} ».`, false));
  }
  if (voice) {
    for (const w of voice.avoid || []) if (w && norm(v).includes(norm(w))) out.push(issue("important", "avoided_word", field.key, `Formule à éviter selon la voix de la marque : « ${w} ».`));
    if (language === "fr") { const a = voiceLib.addressIssues(v, voice); if (a) out.push(issue("important", "address", field.key, `Voix de marque : ${a}.`, false)); }
    const max = { courtes: 18, moyennes: 28, longues: 40 }[voice.sentences];
    const long = sentences(v).find((s) => s.split(/\s+/).length > max + 8);
    if (long) out.push(issue("suggestion", "long_sentence", field.key, `Phrase longue pour la voix « ${voice.sentences} » (${long.split(/\s+/).length} mots).`, false));
  }
  if (field.path && field.path[0] === "title" && words.length > 14) out.push(issue("suggestion", "title_long", field.key, "Titre long : ramenez-le à une idée claire.", false));
  if (/button|cta|label/i.test(String(field.path && field.path[field.path.length - 1])) && words.length > 5) out.push(issue("suggestion", "button_long", field.key, "Texte de bouton long : 2 à 4 mots sont plus lisibles.", false));
  return out;
}
// Ensemble d'une page : répétitions et cohérence entre champs
function checkSet(entries, { language = "fr" } = {}) {
  const out = [];
  const seen = new Map();
  for (const [key, text] of entries) for (const s of sentences(text)) { const n = norm(s).replace(/\W+/g, " ").trim(); if (seen.has(n) && seen.get(n) !== key) out.push(issue("important", "repeated_sentence", key, `Phrase déjà utilisée dans « ${seen.get(n)} ».`, true)); else seen.set(n, key); }
  const openings = new Map();
  for (const [key, text] of entries) { const w = norm(text).replace(/[^a-z0-9 ]+/g, " ").trim().split(/\s+/).slice(0, 3).join(" "); if (w.split(" ").length === 3) openings.set(w, [...(openings.get(w) || []), key]); }
  for (const [w, keys] of openings) if (keys.length >= 3) out.push(issue("improve", "repeated_opening", keys[2], `Trois textes commencent par « ${w} ... » : variez les attaques.`, false));
  const all = entries.map(([, t]) => norm(t)).join(" ").split(/[^a-z0-9]+/).filter((w) => w.length > 5);
  const freq = new Map(); for (const w of all) freq.set(w, (freq.get(w) || 0) + 1);
  if (all.length >= 80) for (const [w, n] of freq) if (n / all.length > 0.05 && n >= 6) out.push(issue("improve", "overused_word", "page", `Le mot « ${w} » revient ${n} fois : variez le vocabulaire.`, false));
  return out;
}
const summary = (issues) => Object.fromEntries([...SEVERITIES.map((s) => [s, issues.filter((i) => i.severity === s).length]), ["certain", issues.filter((i) => i.certain).length], ["probable", issues.filter((i) => !i.certain).length]]);
// Bloquant = critique ET non résolu (une donnée inventée déjà retirée automatiquement ne bloque plus : l'espace réservé reste signalé)
const blocking = (issues) => issues.filter((i) => i.severity === "critical" && !i.resolved);
const redactions = (replaced, key) => replaced.map((r) => issue("critical", "invented_fact", key, `Donnée non fournie retirée automatiquement (${r.kind} « ${r.match} ») : remplacée par un espace réservé.`, true, { resolved: true }));
module.exports = { SEVERITIES, checkField, checkSet, summary, blocking, redactions, issue };
