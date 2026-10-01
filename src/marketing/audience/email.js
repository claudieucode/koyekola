// Normalisation et validation des adresses e-mail. Volontairement STRICTE : mieux vaut refuser une adresse exotique
// (l'import la signale, l'admin la corrige) que d'envoyer vers une adresse mal formée ou d'ouvrir une injection d'en-têtes.
// La normalisation ne « devine » rien : les « + » et les points restent (jean+promo@x.com et jean@x.com sont distinctes).
const { domainToASCII } = require("node:url");

const LOCAL_CHARS = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const MAX_TOTAL = 254;
const MAX_LOCAL = 64;
const MAX_DOMAIN = 253;

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  let text = value.normalize("NFC").trim();
  text = text.replace(/^mailto:/i, "");
  if (text.startsWith("<") && text.endsWith(">")) text = text.slice(1, -1).trim();
  text = text.toLowerCase();
  const at = text.indexOf("@");
  if (at > 0 && at === text.lastIndexOf("@")) {
    const domain = text.slice(at + 1);
    if (/[^\x00-\x7f]/.test(domain)) {
      const ascii = domainToASCII(domain);
      if (ascii) text = `${text.slice(0, at)}@${ascii}`;
    }
  }
  return text;
}

// → { ok: true, email } ou { ok: false, reason } (raison lisible, affichée dans l'aperçu d'import)
function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return { ok: false, reason: "Adresse absente ou vide." };
  if (/[\s\x00-\x1f\x7f]/.test(email)) return { ok: false, reason: "Espaces ou caractères de contrôle interdits." };
  if (email.split("@").length !== 2) return { ok: false, reason: "Il doit y avoir exactement un « @ »." };
  if (email.length > MAX_TOTAL) return { ok: false, reason: "Adresse trop longue." };
  const [local, domain] = email.split("@");
  if (!local) return { ok: false, reason: "Il manque la partie avant le « @ »." };
  if (local.length > MAX_LOCAL) return { ok: false, reason: "Partie avant le « @ » trop longue (64 caractères au plus)." };
  if (domain.length > MAX_DOMAIN) return { ok: false, reason: "Domaine trop long." };
  if (!LOCAL_CHARS.test(local)) return { ok: false, reason: "Caractères non pris en charge avant le « @ »." };
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return { ok: false, reason: "Point mal placé avant le « @ »." };
  const labels = domain.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return { ok: false, reason: "Domaine invalide (exemple attendu : exemple.fr)." };
  const tld = labels[labels.length - 1];
  if (tld.length < 2 || /^[0-9]+$/.test(tld)) return { ok: false, reason: "Domaine invalide : extension incorrecte." };
  return { ok: true, email };
}

module.exports = { normalizeEmail, validateEmail };
