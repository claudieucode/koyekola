// Outils de comparaison de textes (contenus très similaires, cannibalisation). Méthode : mots normalisés (minuscules,
// sans accents, sans mots vides), « bardeaux » de 5 mots consécutifs, indice de Jaccard. Une ressemblance est une
// ANALYSE à vérifier, jamais une certitude sur la façon dont Google traite les pages.
const STOP = new Set("a au aux avec ce ces cet cette dans de des du elle en et eux il ils je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y est sont etre avoir a ont plus tres comme tout tous toute toutes".split(" "));

const strip = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const normalizeWords = (text) => strip(text).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));

function shingles(words, size = 5) {
  const out = new Set();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(" "));
  return out;
}
function jaccard(a, b) {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}
const similarity = (wordsA, wordsB) => jaccard(shingles(wordsA), shingles(wordsB));
const titleTokens = (title) => normalizeWords(String(title || "").replace(/\s[·|—-]\s.*$/, ""));

module.exports = { normalizeWords, shingles, jaccard, similarity, titleTokens };
