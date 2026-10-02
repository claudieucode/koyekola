// Longueur d'un SMS et nombre de « segments » facturés. Un SMS long est découpé en plusieurs segments, et CHAQUE
// segment est facturé comme un SMS : c'est ce que l'opérateur compte, pas le nombre de caractères.
//  - alphabet GSM-7 (lettres sans accent + quelques accents : é è à ù ì ò Ç…) : 160 caractères, puis 153 par segment ;
//  - dès qu'UN seul caractère sort de cet alphabet (ê, â, î, ô, û, ç, œ, emoji…), tout le message passe en UCS-2 :
//    70 caractères, puis 67 par segment. Une seule lettre « ê » peut donc doubler le prix d'une campagne.
const GSM_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€\f"; // comptent pour 2 (caractère d'échappement + caractère)
const basic = new Set(GSM_BASIC);
const extended = new Set(GSM_EXTENDED);

function smsLength(text) {
  const value = String(text ?? "");
  let gsmUnits = 0;
  const unsupported = new Set();
  for (const ch of value) {
    if (basic.has(ch)) gsmUnits += 1;
    else if (extended.has(ch)) gsmUnits += 2;
    else unsupported.add(ch);
  }
  if (unsupported.size === 0) {
    const segments = gsmUnits === 0 ? 0 : gsmUnits <= 160 ? 1 : Math.ceil(gsmUnits / 153);
    return { encoding: "GSM-7", units: gsmUnits, segments, perSegment: segments > 1 ? 153 : 160, unsupported: [] };
  }
  const units = value.length; // UCS-2 : unités UTF-16 (un emoji en compte 2)
  const segments = units <= 70 ? 1 : Math.ceil(units / 67);
  return { encoding: "UCS-2", units, segments, perSegment: segments > 1 ? 67 : 70, unsupported: [...unsupported].slice(0, 20) };
}

// Remplace les lettres hors GSM-7 par leur équivalent le plus proche (ê → e, ç → c, œ → oe, guillemets typographiques…),
// pour rester à 160 caractères par segment. Ne touche pas aux accents qui existent en GSM-7 (é, è, à, ù…).
const REPLACEMENTS = {
  "ê": "e", "ë": "e", "â": "a", "á": "a", "ã": "a", "î": "i", "ï": "i", "í": "i", "ô": "o", "ó": "o", "õ": "o", "û": "u", "ú": "u",
  "ç": "c", "ÿ": "y", "œ": "oe", "Œ": "OE", "À": "A", "Â": "A", "È": "E", "Ê": "E", "Ë": "E", "Î": "I", "Ï": "I", "Ô": "O", "Û": "U", "Ù": "U",
  "’": "'", "‘": "'", "“": "\"", "”": "\"", "«": "\"", "»": "\"", "–": "-", "—": "-", "…": "...", " ": " ", " ": " ",
};
const toGsm = (text) => [...String(text ?? "")].map((ch) => (basic.has(ch) || extended.has(ch) ? ch : REPLACEMENTS[ch] ?? ch)).join("");

module.exports = { smsLength, toGsm };
