// Détection de langue par indices lexicaux (fr, en, es, pt) : approximation, utilisée seulement pour SIGNALER un texte qui semble dans une autre langue (jamais pour refuser).
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const HINTS = {
  fr: [" le ", " la ", " les ", " des ", " une ", " pour ", " avec ", " votre ", " vos ", " nous ", " est ", " et ", " dans ", " sur "],
  en: [" the ", " and ", " for ", " with ", " your ", " our ", " you ", " is ", " are ", " to ", " of "],
  es: [" el ", " los ", " las ", " para ", " con ", " una ", " su ", " nuestro ", " nuestros ", " es ", " y ", " del "],
  pt: [" o ", " os ", " as ", " para ", " com ", " uma ", " seu ", " nosso ", " nossos ", " e ", " do ", " da ", " nao "],
};
function detectLanguage(text) {
  const t = ` ${norm(text).replace(/[^a-z0-9]+/g, " ")} `;
  const score = Object.fromEntries(Object.entries(HINTS).map(([k, l]) => [k, l.filter((h) => t.includes(h)).length]));
  const best = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const [code, n] = best[0];
  return { code: n >= 2 && n > best[1][1] ? code : "unknown", scores: score };
}
module.exports = { detectLanguage };
