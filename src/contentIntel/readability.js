// Lisibilité : indicateurs calculés sur le texte réel (longueur des phrases, des mots) et indice de Flesch adapté (Kandel-Moles pour le français, Flesch pour l'anglais).
// Repère INDICATIF : ni une note officielle ni un critère de classement. Les langues sans formule validée ici reçoivent seulement les mesures, sans indice.
const { wordsOf } = require("./text");

function syllables(word, lang) {
  const w = String(word).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
  if (!w) return 0;
  let g = (w.match(/[aeiouy]+/g) || []).length;
  if (lang === "fr" && /[^aeiouy]es?$/.test(w) && g > 1) g -= 1; // « e » muet final
  if (lang === "en" && /[^aeiouy]e$/.test(w) && g > 1) g -= 1;
  return Math.max(1, g);
}
function analyze(doc, lang = "fr") {
  const words = doc.words, sents = doc.sentences;
  if (words.length < 30 || !sents.length) return { evaluable: false, reason: "Texte trop court pour une mesure fiable (moins de 30 mots).", words: words.length };
  const avgSentence = words.length / sents.length;
  const long = sents.filter((s) => s.split(/\s+/).length > 30).length;
  const syl = words.reduce((n, w) => n + syllables(w, lang), 0) / words.length;
  let index = null;
  if (lang === "fr") index = 207 - 1.015 * avgSentence - 73.6 * syl;
  else if (lang === "en") index = 206.835 - 1.015 * avgSentence - 84.6 * syl;
  if (index !== null) index = Math.max(0, Math.min(100, Math.round(index)));
  const level = index === null ? null : index >= 70 ? "facile" : index >= 50 ? "standard" : index >= 30 ? "soutenu" : "difficile";
  return { evaluable: true, words: words.length, sentences: sents.length, avgSentence: Math.round(avgSentence * 10) / 10, longSentences: long, longRatio: Math.round((long / sents.length) * 100) / 100, avgSyllables: Math.round(syl * 100) / 100, index, level, formula: index === null ? null : lang === "fr" ? "Kandel-Moles (adaptation française de Flesch)" : "Flesch Reading Ease", note: "Repère indicatif, calculé sur ce texte ; il ne mesure ni la justesse ni la pertinence." };
}
module.exports = { analyze, syllables };
