// Bloc « HTML personnalisé » : le SEUL bloc qui peut contenir du code libre (scripts, iframes, styles). C'est donc le seul qui sort de la garantie
// « aucun script possible » des articles ; il est protégé par une SIGNATURE :
//   - seul le compte créateur (rôle « formateur ») peut en créer ou en modifier : à l'enregistrement, la route signe le code reçu (HMAC-SHA-256, clé ENCRYPTION_KEY) ;
//   - toute autre personne qui envoie un bloc HTML personnalisé voit le bloc refusé (aucune signature) ; modifier le code d'un bloc signé en invalide la signature ;
//   - à l'affichage, le code n'est restitué que si la signature est valide : une valeur injectée directement en base, ou copiée d'un autre contenu modifié, est ignorée.
// Le code est stocké encodé (base64url) dans un attribut : il ne traverse jamais l'assainisseur HTML comme du balisage.
const crypto = require("crypto");
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const { default: render } = require("dom-serializer");

const MAX_CODE = 60000;
const keyOf = () => { const k = process.env.ENCRYPTION_KEY; return typeof k === "string" && k.length >= 32 ? k : null; };
const encode = (code) => Buffer.from(String(code), "utf8").toString("base64url");
const decode = (b64) => { try { return Buffer.from(String(b64), "base64url").toString("utf8"); } catch { return ""; } };
function sign(b64) {
  const key = keyOf();
  if (!key) return "";
  return crypto.createHmac("sha256", key).update(`kb-html:v1:${b64}`).digest("base64url");
}
function verify(b64, sig) {
  const key = keyOf();
  if (!key || !b64 || !sig) return false;
  const expected = sign(b64);
  const a = Buffer.from(expected); const b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const isBlock = (n) => n.attribs && String(n.attribs.class || "").split(/\s+/).includes("kb-html");

// Appelé par la route d'enregistrement AVANT l'assainissement : signe les blocs reçus si la personne y est autorisée.
// Sans autorisation, les blocs non signés (ou à signature invalide) sont retirés par l'assainisseur.
function signBlocks(html, { allowed }) {
  const source = String(html || "");
  if (!source.includes("kb-html")) return source;
  const doc = parseDocument(source);
  let changed = false;
  for (const n of DomUtils.findAll(isBlock, doc.children)) {
    const code = n.attribs["data-code"] || "";
    if (!code || decode(code).length > MAX_CODE) { DomUtils.removeElement(n); changed = true; continue; }
    if (verify(code, n.attribs["data-sig"])) continue; // déjà signé et inchangé
    if (allowed) { n.attribs["data-sig"] = sign(code); changed = true; } else { delete n.attribs["data-sig"]; changed = true; }
  }
  return changed ? render(doc.children, { encodeEntities: "utf8" }) : source;
}
module.exports = { encode, decode, sign, verify, signBlocks, MAX_CODE, available: () => Boolean(keyOf()) };
